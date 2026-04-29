#!/bin/bash
# Script to fix Lambda handler configurations
# This updates all function handlers to use the correct path

set -e

REGION="us-east-1"

# Function to handler mapping (function_name:handler_path)
HANDLERS="
quickneeds-verifyOtp:handlers/auth.verifyOtp
quickneeds-sendOtp:handlers/auth.sendOtp
quickneeds-getProfile:handlers/users.getProfile
quickneeds-updateProfile:handlers/users.updateProfile
quickneeds-listProducts:handlers/products.listProducts
quickneeds-getProduct:handlers/products.getProduct
quickneeds-createProduct:handlers/products.createProduct
quickneeds-updateProduct:handlers/products.updateProduct
quickneeds-deleteProduct:handlers/products.deleteProduct
quickneeds-uploadImage:handlers/products.uploadImage
quickneeds-getUploadUrl:handlers/products.getUploadUrl
quickneeds-createOrder:handlers/orders.createOrder
quickneeds-listOrders:handlers/orders.listOrders
quickneeds-getOrder:handlers/orders.getOrder
quickneeds-updateOrderStatus:handlers/orders.updateOrderStatus
quickneeds-authorizer:handlers/authorizer.handler
"

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

# Process each function:handler pair
echo "$HANDLERS" | grep -v '^$' | while IFS=: read -r function_name handler; do
  # Skip empty lines
  [ -z "$function_name" ] && continue
  
  # Check if function exists
  if ! aws lambda get-function \
    --function-name ${function_name} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${YELLOW}⊘${NC} ${function_name} (not found)"
    continue
  fi
  
  # Get current handler
  current_handler=$(aws lambda get-function-configuration \
    --function-name ${function_name} \
    --region ${REGION} \
    --query 'Handler' \
    --output text 2>/dev/null || echo "")
  
  if [ "$current_handler" = "$handler" ]; then
    echo "${GREEN}✓${NC} ${function_name} (already correct)"
    continue
  fi
  
  # Update handler
  if aws lambda update-function-configuration \
    --function-name ${function_name} \
    --handler ${handler} \
    --region ${REGION} \
    --output text > /dev/null 2>&1; then
    echo "${GREEN}✓${NC} ${function_name}: ${current_handler} → ${handler}"
  else
    echo "${RED}✗${NC} ${function_name}"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "${GREEN}✅ Handler configuration complete!${NC}"
echo ""
echo "💡 Now redeploy your code:"
echo "   ./quick-deploy.sh"
echo ""
