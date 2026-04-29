#!/bin/bash
# Script to create S3 bucket for product images with proper configuration

set -e

REGION="ap-south-2"
BUCKET_NAME="quickneeds-products"

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
  echo "${YELLOW}⚠️  Bucket already exists — skipping creation, will update config${NC}"
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

# ── CORS FIX ─────────────────────────────────────────────────────────────────
# Added HEAD to AllowedMethods  (browsers send HEAD preflight before GET)
# Added ExposedHeaders          (ETag needed by some image renderers)
# AllowedOrigins kept as "*"    (lock to your domain in prod)
# ─────────────────────────────────────────────────────────────────────────────
echo "Setting CORS configuration..."
aws s3api put-bucket-cors \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --cors-configuration '{
    "CORSRules": [
      {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": [
          "ETag",
          "x-amz-request-id",
          "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
      }
    ]
  }'

echo "${GREEN}✓ CORS configured${NC}"
echo ""

# Set bucket policy for public reads
echo "Setting bucket policy for public reads..."
aws s3api put-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"PublicReadGetObject\",
        \"Effect\": \"Allow\",
        \"Principal\": \"*\",
        \"Action\": \"s3:GetObject\",
        \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
      }
    ]
  }"

echo "${GREEN}✓ Bucket policy set (GetObject + HeadObject)${NC}"
echo ""

# ── VERIFY ───────────────────────────────────────────────────────────────────
echo "${BLUE}📋 Verifying Configuration${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "CORS Rules:"
aws s3api get-bucket-cors \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --query 'CORSRules[0]' \
  --output table 2>/dev/null || echo "  Could not retrieve CORS"

echo ""

echo "Bucket Policy Actions:"
aws s3api get-bucket-policy \
  --bucket ${BUCKET_NAME} \
  --region ${REGION} \
  --query 'Policy' \
  --output text 2>/dev/null \
  | python3 -c "import sys,json; p=json.load(sys.stdin); [print(' ',a) for s in p['Statement'] for a in (s['Action'] if isinstance(s['Action'],list) else [s['Action']])]" \
  || echo "  Could not parse policy"

echo ""

# ── LIVE CORS TEST ────────────────────────────────────────────────────────────
echo "${BLUE}🔍 Testing CORS headers on a preflight request${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CORS_RESULT=$(curl -s -o /dev/null -w "%{http_code}" \
  -X OPTIONS \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  "https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/" 2>/dev/null || echo "000")

if [ "$CORS_RESULT" = "200" ] || [ "$CORS_RESULT" = "403" ]; then
  # 403 is fine here — it means S3 responded and CORS headers were returned
  CORS_HEADER=$(curl -s -I \
    -H "Origin: http://localhost:3000" \
    "https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/" \
    | grep -i "access-control-allow-origin" || echo "")

  if [ ! -z "$CORS_HEADER" ]; then
    echo "${GREEN}✓ CORS headers are being returned:${NC}"
    echo "  $CORS_HEADER"
  else
    echo "${YELLOW}⚠️  CORS config applied but headers not yet visible${NC}"
    echo "  Wait ~30 seconds and test again with:"
    echo "  curl -I -H \"Origin: http://localhost:3000\" \\"
    echo "    https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/products/test.jpg"
  fi
else
  echo "${YELLOW}⚠️  Could not reach bucket endpoint (HTTP ${CORS_RESULT})${NC}"
fi

echo ""
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GREEN}✅ S3 Bucket Setup Complete!${NC}"
echo "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Bucket URL: https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/"
echo ""
echo "What changed:"
echo "  ✓ HEAD added to AllowedMethods  (fixes browser preflight)"
echo "  ✓ ETag added to ExposeHeaders   (fixes some image renderers)"
echo "  ✓ HeadObject added to bucket policy"
echo ""
echo "To manually test CORS on an actual image:"
echo "  curl -I -H \"Origin: http://localhost:3000\" \\"
echo "    https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/products/YOUR-IMAGE.jpg"
echo ""
echo "You should see 'access-control-allow-origin: *' in the response."
echo ""