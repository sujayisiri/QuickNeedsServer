#!/bin/bash
# Script to create multiple Lambda layers to avoid 250MB limit

set -e  # Exit on error

echo "🚀 Creating Lambda Layers for QuickNeeds..."
echo ""

# Configuration
REGION="us-east-1"
S3_BUCKET="quickneeds-lambda-deployments"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Clean up old layers
echo "🧹 Cleaning up old layer files..."
rm -rf layers deployment-packages
mkdir -p deployment-packages

# === LAYER 1: Core Dependencies ===
echo ""
echo "${BLUE}📦 Creating Layer 1: Core Dependencies${NC}"
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
    "@aws-sdk/client-sns": "^3.540.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1",
    "bcryptjs": "^2.4.3"
  }
}
EOF

echo "  Installing core dependencies..."
npm install --production --no-optional --silent

echo "  Optimizing size..."
rm -rf node_modules/**/*.md
rm -rf node_modules/**/test
rm -rf node_modules/**/tests
rm -rf node_modules/**/.github

echo "  Creating zip file..."
cd ..
zip -r -q ../../deployment-packages/core-layer.zip nodejs/
cd ../..

CORE_SIZE=$(ls -lh deployment-packages/core-layer.zip | awk '{print $5}')
echo "${GREEN}  ✓ Core layer created: ${CORE_SIZE}${NC}"

# === LAYER 2: Firebase Dependencies ===
echo ""
echo "${BLUE}📦 Creating Layer 2: Firebase Dependencies${NC}"
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

echo "  Installing Firebase..."
npm install --production --no-optional --silent

echo "  Optimizing size..."
rm -rf node_modules/**/*.md
rm -rf node_modules/**/test
rm -rf node_modules/**/tests
rm -rf node_modules/**/.github
rm -rf node_modules/**/docs
rm -rf node_modules/**/examples

echo "  Creating zip file..."
cd ..
zip -r -q ../../deployment-packages/firebase-layer.zip nodejs/
cd ../..

FIREBASE_SIZE=$(ls -lh deployment-packages/firebase-layer.zip | awk '{print $5}')
echo "${GREEN}  ✓ Firebase layer created: ${FIREBASE_SIZE}${NC}"

# === Upload to S3 ===
echo ""
echo "${BLUE}☁️  Uploading layers to S3...${NC}"

# Create bucket if it doesn't exist
if ! aws s3 ls "s3://${S3_BUCKET}" 2>/dev/null; then
    echo "  Creating S3 bucket..."
    aws s3 mb "s3://${S3_BUCKET}" --region ${REGION}
fi

echo "  Uploading core layer..."
aws s3 cp deployment-packages/core-layer.zip "s3://${S3_BUCKET}/" --quiet

echo "  Uploading firebase layer..."
aws s3 cp deployment-packages/firebase-layer.zip "s3://${S3_BUCKET}/" --quiet

echo "${GREEN}  ✓ Both layers uploaded to S3${NC}"

# === Publish Lambda Layers ===
echo ""
echo "${BLUE}🎯 Publishing Lambda layers...${NC}"

echo "  Publishing core layer..."
CORE_ARN=$(aws lambda publish-layer-version \
  --layer-name quickneeds-core-dependencies \
  --description "Core dependencies: AWS SDK, JWT, UUID, bcrypt" \
  --content S3Bucket=${S3_BUCKET},S3Key=core-layer.zip \
  --compatible-runtimes nodejs20.x \
  --region ${REGION} \
  --query 'LayerVersionArn' \
  --output text)

echo "  Publishing firebase layer..."
FIREBASE_ARN=$(aws lambda publish-layer-version \
  --layer-name quickneeds-firebase-dependencies \
  --description "Firebase Admin SDK for push notifications" \
  --content S3Bucket=${S3_BUCKET},S3Key=firebase-layer.zip \
  --compatible-runtimes nodejs20.x \
  --region ${REGION} \
  --query 'LayerVersionArn' \
  --output text)

# === Summary ===
echo ""
echo "${GREEN}✅ Successfully created both Lambda layers!${NC}"
echo ""
echo "📋 Layer ARNs (save these!):"
echo ""
echo "Core Layer ARN:"
echo "  ${CORE_ARN}"
echo ""
echo "Firebase Layer ARN:"
echo "  ${FIREBASE_ARN}"
echo ""
echo "💡 When creating Lambda functions, attach BOTH layers."
echo ""
echo "📝 Next steps:"
echo "  1. Create Lambda functions (see MANUAL_AWS_DEPLOYMENT.md Step 6)"
echo "  2. Add both layer ARNs to each function"
echo "  3. Upload your code: deployment-packages/functions.zip"
echo ""
