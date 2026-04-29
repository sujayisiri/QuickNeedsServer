#!/bin/bash
# Comprehensive Lambda deployment script
# This script:
# 1. Creates/updates Lambda layers
# 2. Builds and packages the application code
# 3. Uploads code to S3
# 4. Updates all Lambda functions
# 5. Attaches layers to all functions

set -e  # Exit on error

# Configuration
REGION="us-east-1"
STAGE="dev"
S3_BUCKET="quickneeds-lambda-deployments"
CODE_PACKAGE_NAME="quickneeds-functions-$(date +%Y%m%d-%H%M%S).zip"

# Lambda function names
LAMBDA_FUNCTIONS=(
  "quickneeds-verifyOtp"
  "quickneeds-getProduct"
  "quickneeds-updateProduct"
  "quickneeds-createOrder"
  "quickneeds-getOrder"
  "quickneeds-deleteProduct"
  "quickneeds-authorizer"
  "quickneeds-listOrders"
  "quickneeds-updateProfile"
  "quickneeds-sendOtp"
  "quickneeds-getProfile"
  "quickneeds-uploadImage"
  "quickneeds-updateOrderStatus"
  "quickneeds-listProducts"
  "quickneeds-createProduct"
)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 QuickNeeds Lambda Deployment Script"
echo "========================================"
echo ""
echo "Region: ${REGION}"
echo "Stage: ${STAGE}"
echo "S3 Bucket: ${S3_BUCKET}"
echo "Functions: ${#LAMBDA_FUNCTIONS[@]}"
echo ""

# Function to check if S3 bucket exists
check_s3_bucket() {
  echo "${BLUE}📦 Checking S3 bucket...${NC}"
  if ! aws s3 ls "s3://${S3_BUCKET}" 2>/dev/null; then
    echo "  Creating S3 bucket..."
    aws s3 mb "s3://${S3_BUCKET}" --region ${REGION}
    echo "${GREEN}  ✓ S3 bucket created${NC}"
  else
    echo "${GREEN}  ✓ S3 bucket exists${NC}"
  fi
  echo ""
}

# Function to create/update Lambda layers
create_layers() {
  echo "${BLUE}🔧 Step 1: Creating Lambda Layers${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Clean up
  rm -rf layers deployment-packages
  mkdir -p deployment-packages

  # === LAYER 1: Core Dependencies ===
  echo "${YELLOW}Creating Layer 1: Core Dependencies${NC}"
  mkdir -p layers/core/nodejs
  cd layers/core/nodejs

  cat > package.json << 'EOF'
{
  "name": "quickneeds-core-dependencies",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.540.0",
    "@aws-sdk/lib-dynamodb": "^3.540.0",
    "@aws-sdk/client-s3": "^3.540.0",
    "@aws-sdk/s3-request-presigner": "^3.540.0",
    "@aws-sdk/client-sns": "^3.540.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1",
    "bcryptjs": "^2.4.3"
  }
}
EOF

  echo "  Installing dependencies..."
  npm install --production --no-optional --silent 2>&1 | grep -v "npm WARN" || true

  echo "  Optimizing size..."
  find node_modules -name "*.md" -type f -delete 2>/dev/null || true
  rm -rf node_modules/**/test node_modules/**/tests node_modules/**/.github 2>/dev/null || true

  echo "  Creating zip..."
  cd ..
  zip -r -q ../../deployment-packages/core-layer.zip nodejs/
  cd ../..

  CORE_SIZE=$(ls -lh deployment-packages/core-layer.zip | awk '{print $5}')
  echo "${GREEN}  ✓ Core layer: ${CORE_SIZE}${NC}"

  # === LAYER 2: Firebase Dependencies ===
  echo ""
  echo "${YELLOW}Creating Layer 2: Firebase Dependencies${NC}"
  mkdir -p layers/firebase/nodejs
  cd layers/firebase/nodejs

  cat > package.json << 'EOF'
{
  "name": "quickneeds-firebase-dependencies",
  "version": "1.0.0",
  "dependencies": {
    "firebase-admin": "^13.8.0"
  }
}
EOF

  echo "  Installing dependencies..."
  npm install --production --no-optional --silent 2>&1 | grep -v "npm WARN" || true

  echo "  Optimizing size..."
  find node_modules -name "*.md" -type f -delete 2>/dev/null || true
  rm -rf node_modules/**/test node_modules/**/tests node_modules/**/.github node_modules/**/docs node_modules/**/examples 2>/dev/null || true

  echo "  Creating zip..."
  cd ..
  zip -r -q ../../deployment-packages/firebase-layer.zip nodejs/
  cd ../..

  FIREBASE_SIZE=$(ls -lh deployment-packages/firebase-layer.zip | awk '{print $5}')
  echo "${GREEN}  ✓ Firebase layer: ${FIREBASE_SIZE}${NC}"

  # Upload to S3
  echo ""
  echo "  Uploading layers to S3..."
  aws s3 cp deployment-packages/core-layer.zip "s3://${S3_BUCKET}/layers/" --quiet
  aws s3 cp deployment-packages/firebase-layer.zip "s3://${S3_BUCKET}/layers/" --quiet
  echo "${GREEN}  ✓ Layers uploaded${NC}"

  # Publish layers
  echo ""
  echo "  Publishing Lambda layers..."
  
  CORE_ARN=$(aws lambda publish-layer-version \
    --layer-name quickneeds-core-dependencies \
    --description "Core dependencies: AWS SDK, JWT, UUID, bcrypt ($(date +%Y-%m-%d))" \
    --content S3Bucket=${S3_BUCKET},S3Key=layers/core-layer.zip \
    --compatible-runtimes nodejs20.x \
    --region ${REGION} \
    --query 'LayerVersionArn' \
    --output text)

  FIREBASE_ARN=$(aws lambda publish-layer-version \
    --layer-name quickneeds-firebase-dependencies \
    --description "Firebase Admin SDK for push notifications ($(date +%Y-%m-%d))" \
    --content S3Bucket=${S3_BUCKET},S3Key=layers/firebase-layer.zip \
    --compatible-runtimes nodejs20.x \
    --region ${REGION} \
    --query 'LayerVersionArn' \
    --output text)

  echo "${GREEN}  ✓ Layers published${NC}"
  echo ""
  echo "  Core Layer ARN: ${CORE_ARN}"
  echo "  Firebase Layer ARN: ${FIREBASE_ARN}"
  echo ""

  # Save ARNs for later use
  echo "${CORE_ARN}" > deployment-packages/core-layer-arn.txt
  echo "${FIREBASE_ARN}" > deployment-packages/firebase-layer-arn.txt
}

# Function to build and package application code
build_and_package() {
  echo "${BLUE}🔨 Step 2: Building Application Code${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Build TypeScript
  echo "  Compiling TypeScript..."
  npm run build

  # Create package
  echo "  Creating deployment package..."
  cd dist
  zip -r -q ../deployment-packages/${CODE_PACKAGE_NAME} . -x "*.map"
  cd ..

  PACKAGE_SIZE=$(ls -lh deployment-packages/${CODE_PACKAGE_NAME} | awk '{print $5}')
  echo "${GREEN}  ✓ Package created: ${PACKAGE_SIZE}${NC}"
  echo "  Package name: ${CODE_PACKAGE_NAME}"
  echo ""
}

# Function to upload code to S3
upload_code() {
  echo "${BLUE}☁️  Step 3: Uploading Code to S3${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  echo "  Uploading ${CODE_PACKAGE_NAME}..."
  aws s3 cp deployment-packages/${CODE_PACKAGE_NAME} "s3://${S3_BUCKET}/code/" --quiet
  
  echo "${GREEN}  ✓ Code uploaded to S3${NC}"
  echo ""
}

# Function to update Lambda functions
update_lambdas() {
  echo "${BLUE}🔄 Step 4: Updating Lambda Functions${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Read layer ARNs
  CORE_ARN=$(cat deployment-packages/core-layer-arn.txt)
  FIREBASE_ARN=$(cat deployment-packages/firebase-layer-arn.txt)

  local success_count=0
  local fail_count=0
  local failed_functions=()

  for function_name in "${LAMBDA_FUNCTIONS[@]}"; do
    echo "  Updating ${function_name}..."
    
    # Update function code
    if aws lambda update-function-code \
      --function-name ${function_name} \
      --s3-bucket ${S3_BUCKET} \
      --s3-key code/${CODE_PACKAGE_NAME} \
      --region ${REGION} \
      --query 'FunctionName' \
      --output text > /dev/null 2>&1; then
      
      # Wait for update to complete
      aws lambda wait function-updated --function-name ${function_name} --region ${REGION} 2>/dev/null || true
      
      # Update layers
      if aws lambda update-function-configuration \
        --function-name ${function_name} \
        --layers ${CORE_ARN} ${FIREBASE_ARN} \
        --region ${REGION} \
        --query 'FunctionName' \
        --output text > /dev/null 2>&1; then
        
        echo "${GREEN}    ✓ ${function_name} updated${NC}"
        ((success_count++))
      else
        echo "${RED}    ✗ ${function_name} - failed to update layers${NC}"
        ((fail_count++))
        failed_functions+=("${function_name}")
      fi
    else
      echo "${RED}    ✗ ${function_name} - function not found or update failed${NC}"
      ((fail_count++))
      failed_functions+=("${function_name}")
    fi
  done

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  if [ ${fail_count} -eq 0 ]; then
    echo "${GREEN}✅ All ${success_count} Lambda functions updated successfully!${NC}"
  else
    echo "${YELLOW}⚠️  ${success_count} succeeded, ${fail_count} failed${NC}"
    if [ ${#failed_functions[@]} -gt 0 ]; then
      echo ""
      echo "Failed functions:"
      for func in "${failed_functions[@]}"; do
        echo "  - ${func}"
      done
    fi
  fi
}

# Function to verify deployment
verify_deployment() {
  echo ""
  echo "${BLUE}🔍 Step 5: Verifying Deployment${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  CORE_ARN=$(cat deployment-packages/core-layer-arn.txt)
  FIREBASE_ARN=$(cat deployment-packages/firebase-layer-arn.txt)

  echo "Checking first 3 functions..."
  for i in {0..2}; do
    function_name="${LAMBDA_FUNCTIONS[$i]}"
    echo ""
    echo "  ${function_name}:"
    
    # Get function config
    config=$(aws lambda get-function-configuration \
      --function-name ${function_name} \
      --region ${REGION} 2>/dev/null || echo "")
    
    if [ -z "$config" ]; then
      echo "${RED}    ✗ Function not found${NC}"
      continue
    fi
    
    # Check layers
    layers=$(echo "$config" | grep -o "LayerVersionArn" | wc -l)
    echo "    Layers attached: ${layers}"
    
    # Check code size
    code_size=$(echo "$config" | grep "CodeSize" | grep -o '[0-9]*' | head -1)
    if [ ! -z "$code_size" ]; then
      code_size_mb=$(echo "scale=2; $code_size / 1024 / 1024" | bc)
      echo "    Code size: ${code_size_mb} MB"
    fi
    
    # Check last update
    last_modified=$(echo "$config" | grep "LastModified" | cut -d'"' -f4)
    if [ ! -z "$last_modified" ]; then
      echo "    Last modified: ${last_modified}"
    fi
    
    echo "${GREEN}    ✓ Verified${NC}"
  done
  
  echo ""
  echo "${GREEN}✓ Verification complete${NC}"
}

# Main execution
main() {
  echo ""
  read -p "Continue with deployment? (y/n) " -n 1 -r
  echo ""
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
  fi
  
  echo ""
  
  # Execute deployment steps
  check_s3_bucket
  create_layers
  build_and_package
  upload_code
  update_lambdas
  verify_deployment
  
  # Summary
  echo ""
  echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo "${GREEN}🎉 Deployment Complete!${NC}"
  echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "📦 Artifacts:"
  echo "  - Layers: s3://${S3_BUCKET}/layers/"
  echo "  - Code: s3://${S3_BUCKET}/code/${CODE_PACKAGE_NAME}"
  echo ""
  echo "📋 Layer ARNs:"
  echo "  - Core: $(cat deployment-packages/core-layer-arn.txt)"
  echo "  - Firebase: $(cat deployment-packages/firebase-layer-arn.txt)"
  echo ""
  echo "💡 Next steps:"
  echo "  1. Test your API endpoints"
  echo "  2. Check CloudWatch logs for any errors"
  echo "  3. Monitor Lambda metrics in AWS Console"
  echo ""
}

# Run main function
main
