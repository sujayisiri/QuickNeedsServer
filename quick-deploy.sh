#!/bin/bash
# Quick Lambda update script (code only, no layers)
# Use this when you only need to update code, not layers

set -e

# Configuration
REGION="us-east-1"
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
NC='\033[0m'

echo "⚡ Quick Lambda Update (Code Only)"
echo "=================================="
echo ""

# Build
echo "${BLUE}🔨 Building...${NC}"
npm run build
echo "${GREEN}✓ Build complete${NC}"
echo ""

# Package
echo "${BLUE}📦 Packaging...${NC}"
mkdir -p deployment-packages
cd dist
zip -r -q ../deployment-packages/${CODE_PACKAGE_NAME} . -x "*.map"
cd ..
PACKAGE_SIZE=$(ls -lh deployment-packages/${CODE_PACKAGE_NAME} | awk '{print $5}')
echo "${GREEN}✓ Package: ${PACKAGE_SIZE}${NC}"
echo ""

# Upload
echo "${BLUE}☁️  Uploading to S3...${NC}"
aws s3 cp deployment-packages/${CODE_PACKAGE_NAME} "s3://${S3_BUCKET}/code/" --quiet
echo "${GREEN}✓ Uploaded${NC}"
echo ""

# Update functions
echo "${BLUE}🔄 Updating ${#LAMBDA_FUNCTIONS[@]} functions...${NC}"
success=0
failed=0

for function_name in "${LAMBDA_FUNCTIONS[@]}"; do
  if aws lambda update-function-code \
    --function-name ${function_name} \
    --s3-bucket ${S3_BUCKET} \
    --s3-key code/${CODE_PACKAGE_NAME} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} ${function_name}"
    ((success++))
  else
    echo "${YELLOW}✗${NC} ${function_name}"
    ((failed++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $failed -eq 0 ]; then
  echo "${GREEN}✅ All ${success} functions updated!${NC}"
else
  echo "${YELLOW}⚠️  ${success} succeeded, ${failed} failed${NC}"
fi
echo ""
