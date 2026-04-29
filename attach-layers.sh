#!/bin/bash
# Script to attach existing layers to Lambda functions
# Use this when functions exist but layers are not attached

set -e

# Configuration
REGION="us-east-1"

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
NC='\033[0m'

echo "🔗 Attach Layers to Lambda Functions"
echo "====================================="
echo ""

# Get latest layer versions
echo "${BLUE}🔍 Finding latest layer versions...${NC}"

CORE_ARN=$(aws lambda list-layer-versions \
  --layer-name quickneeds-core-dependencies \
  --region ${REGION} \
  --query 'LayerVersions[0].LayerVersionArn' \
  --output text 2>/dev/null || echo "")

FIREBASE_ARN=$(aws lambda list-layer-versions \
  --layer-name quickneeds-firebase-dependencies \
  --region ${REGION} \
  --query 'LayerVersions[0].LayerVersionArn' \
  --output text 2>/dev/null || echo "")

if [ -z "$CORE_ARN" ] || [ -z "$FIREBASE_ARN" ]; then
  echo "${RED}✗ Layers not found!${NC}"
  echo ""
  echo "Please create layers first:"
  echo "  ./create-layers.sh"
  echo ""
  exit 1
fi

echo "${GREEN}✓ Core layer found${NC}"
echo "  ${CORE_ARN}"
echo ""
echo "${GREEN}✓ Firebase layer found${NC}"
echo "  ${FIREBASE_ARN}"
echo ""

# Confirm
read -p "Attach these layers to all functions? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "${BLUE}🔄 Attaching layers to functions...${NC}"
echo ""

success=0
failed=0
skipped=0

for function_name in "${LAMBDA_FUNCTIONS[@]}"; do
  # Check if function exists
  if ! aws lambda get-function \
    --function-name ${function_name} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${YELLOW}⊘${NC} ${function_name} (not found)"
    ((skipped++))
    continue
  fi

  # Update layers
  if aws lambda update-function-configuration \
    --function-name ${function_name} \
    --layers ${CORE_ARN} ${FIREBASE_ARN} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} ${function_name}"
    ((success++))
  else
    echo "${RED}✗${NC} ${function_name}"
    ((failed++))
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ $failed -eq 0 ] && [ $skipped -eq 0 ]; then
  echo "${GREEN}✅ All ${success} functions updated with layers!${NC}"
elif [ $failed -eq 0 ]; then
  echo "${GREEN}✅ ${success} functions updated${NC}"
  echo "${YELLOW}⊘ ${skipped} functions skipped (not found)${NC}"
else
  echo "${YELLOW}⚠️  ${success} succeeded, ${failed} failed, ${skipped} skipped${NC}"
fi

echo ""

# Verify one function
if [ $success -gt 0 ]; then
  echo "${BLUE}🔍 Verifying first function...${NC}"
  first_function="${LAMBDA_FUNCTIONS[0]}"
  
  config=$(aws lambda get-function-configuration \
    --function-name ${first_function} \
    --region ${REGION} 2>/dev/null || echo "")
  
  if [ ! -z "$config" ]; then
    layers=$(echo "$config" | grep -o "LayerVersionArn" | wc -l | tr -d ' ')
    echo "  ${first_function}: ${layers} layers attached"
    
    if [ "$layers" -eq "2" ]; then
      echo "${GREEN}  ✓ Verification passed${NC}"
    else
      echo "${YELLOW}  ⚠ Expected 2 layers, found ${layers}${NC}"
    fi
  fi
fi

echo ""
