#!/bin/bash
# Script to fix Lambda handler configurations
# This updates all function handlers to use the correct path

set -e

REGION="us-east-1"

# Function to handler mapping
declare -A HANDLERS=(
  ["quickneeds-verifyOtp"]="handlers/auth.verifyOtp"
  ["quickneeds-sendOtp"]="handlers/auth.sendOtp"
  ["quickneeds-getProfile"]="handlers/users.getProfile"
  ["quickneeds-updateProfile"]="handlers/users.updateProfile"
  ["quickneeds-listProducts"]="handlers/products.listProducts"
  ["quickneeds-getProduct"]="handlers/products.getProduct"
  ["quickneeds-createProduct"]="handlers/products.createProduct"
  ["quickneeds-updateProduct"]="handlers/products.updateProduct"
  ["quickneeds-deleteProduct"]="handlers/products.deleteProduct"
  ["quickneeds-uploadImage"]="handlers/products.uploadImage"
  ["quickneeds-getUploadUrl"]="handlers/products.getUploadUrl"
  ["quickneeds-createOrder"]="handlers/orders.createOrder"
  ["quickneeds-listOrders"]="handlers/orders.listOrders"
  ["quickneeds-getOrder"]="handlers/orders.getOrder"
  ["quickneeds-updateOrderStatus"]="handlers/orders.updateOrderStatus"
  ["quickneeds-authorizer"]="handlers/authorizer.handler"
)

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔧 Fix Lambda Handler Configurations"
echo "====================================="
echo ""

success=0
failed=0
skipped=0

for function_name in "${!HANDLERS[@]}"; do
  handler="${HANDLERS[$function_name]}"
  
  # Check if function exists
  if ! aws lambda get-function \
    --function-name ${function_name} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${YELLOW}⊘${NC} ${function_name} (not found)"
    ((skipped++))
    continue
  fi
  
  # Get current handler
  current_handler=$(aws lambda get-function-configuration \
    --function-name ${function_name} \
    --region ${REGION} \
    --query 'Handler' \
    --output text 2>/dev/null || echo "")
  
  if [ "$current_handler" == "$handler" ]; then
    echo "${GREEN}✓${NC} ${function_name} (already correct)"
    ((success++))
    continue
  fi
  
  # Update handler
  if aws lambda update-function-configuration \
    --function-name ${function_name} \
    --handler ${handler} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} ${function_name}: ${current_handler} → ${handler}"
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
  echo "${GREEN}✅ All handlers configured correctly!${NC}"
elif [ $failed -eq 0 ]; then
  echo "${GREEN}✅ ${success} handlers updated${NC}"
  echo "${YELLOW}⊘ ${skipped} functions not found${NC}"
else
  echo "${YELLOW}⚠️  ${success} succeeded, ${failed} failed, ${skipped} skipped${NC}"
fi

echo ""
echo "💡 Now redeploy your code:"
echo "   ./quick-deploy.sh"
echo ""
