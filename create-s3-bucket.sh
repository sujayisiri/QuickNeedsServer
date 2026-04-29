#!/bin/bash
# Script to create S3 bucket for product images with proper configuration

set -e

REGION="ap-south-2"
BUCKET_NAME="quickneeds-products-dev"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "${BLUE}🪣 Creating S3 Bucket for Product Images${NC}"
echo "=========================================="
echo ""
echo "Bucket: ${BUCKET_NAME}"
echo "Region: ${REGION}"
echo ""

# Check if bucket exists
if aws s3 ls "s3://${BUCKET_NAME}" --region ${REGION} 2>/dev/null; then
  echo "${YELLOW}⚠️  Bucket already exists${NC}"
  echo ""
else
  # Create bucket
  echo "Creating bucket..."
  aws s3api create-bucket \
    --bucket ${BUCKET_NAME} \
    --region ${REGION} \
    --create-bucket-configuration LocationConstraint=${REGION}
  
  echo "${GREEN}✓ Bucket created${NC}"
  echo ""
fi

# Disable public access block (needed for public reads)
echo "Configuring public access..."
aws s3api put-public-access-block \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

echo "${GREEN}✓ Public access configured${NC}"
echo ""

# Set CORS configuration
echo "Setting CORS configuration..."
cat > /tmp/cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --cors-configuration file:///tmp/cors-config.json

echo "${GREEN}✓ CORS configured${NC}"
echo ""

# Set bucket policy for public reads
echo "Setting bucket policy for public reads..."
cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --policy file:///tmp/bucket-policy.json

echo "${GREEN}✓ Bucket policy set${NC}"
echo ""

# Cleanup temp files
rm -f /tmp/cors-config.json /tmp/bucket-policy.json

# Verify configuration
echo "${BLUE}📋 Verifying Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check CORS
echo "CORS Configuration:"
aws s3api get-bucket-cors --bucket ${BUCKET_NAME} --region ${REGION} \
  --query 'CORSRules[0].[AllowedOrigins[0],AllowedMethods[]]' \
  --output table 2>/dev/null || echo "  Could not retrieve CORS"

echo ""

# Check Policy
echo "Bucket Policy:"
aws s3api get-bucket-policy --bucket ${BUCKET_NAME} --region ${REGION} \
  --query 'Policy' --output text 2>/dev/null | grep -o '"Effect":"Allow"' || echo "  Could not retrieve policy"

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ S3 Bucket Setup Complete!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Bucket URL: https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/"
echo ""
echo "You can now:"
echo "  1. Upload images via presigned URLs"
echo "  2. Access images publicly"
echo "  3. Display images in your app without CORS errors"
echo ""
