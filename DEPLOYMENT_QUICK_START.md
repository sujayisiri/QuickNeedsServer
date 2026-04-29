# Quick Deployment Guide - Product Images Feature

## Prerequisites

- AWS Account configured
- AWS CLI installed and configured
- Node.js 20.x installed
- Serverless Framework installed globally

## Step 1: Install Dependencies

```bash
cd QuickNeedsServer
npm install
```

This will install the new `@aws-sdk/client-s3` package along with existing dependencies.

## Step 2: Environment Configuration

The S3 bucket name is automatically configured in `serverless.yml`:

- Dev: `quickneeds-products-dev`
- Prod: `quickneeds-products-prod`

No manual configuration needed!

## Step 3: Deploy

### Deploy to Development

```bash
npm run deploy:dev
```

### Deploy to Production

```bash
npm run deploy:prod
```

The deployment will automatically:

1. ✅ Create S3 bucket with public read access
2. ✅ Set up CORS configuration
3. ✅ Configure bucket policy
4. ✅ Deploy all Lambda functions
5. ✅ Set up API Gateway routes
6. ✅ Grant necessary IAM permissions

## Step 4: Verify

After deployment, you'll see:

```
endpoints:
  POST - https://xxxxx.execute-api.region.amazonaws.com/dev/products/upload-image
  POST - https://xxxxx.execute-api.region.amazonaws.com/dev/products
  GET - https://xxxxx.execute-api.region.amazonaws.com/dev/products
  ...
```

## Step 5: Update Frontend

Update the API base URL in your frontend if needed:

```typescript
// src/config/api.ts
export const API_BASE_URL =
  "https://xxxxx.execute-api.region.amazonaws.com/dev";
```

## Step 6: Test

### Test Image Upload

```bash
# Get admin token first
TOKEN="your-admin-jwt-token"

# Upload an image
curl -X POST \
  https://xxxxx.execute-api.region.amazonaws.com/dev/products/upload-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.jpg" \
  -F "type=icon"
```

Expected response:

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://quickneeds-products-dev.s3.region.amazonaws.com/products/icon-uuid.jpg",
    "message": "Image uploaded successfully"
  }
}
```

### Test Product Creation

```bash
curl -X POST \
  https://xxxxx.execute-api.region.amazonaws.com/dev/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Tomatoes",
    "price": 30,
    "category": "Vegetables",
    "unit": "kg",
    "image": "🍅",
    "imageUrl": "https://s3-url/icon.jpg",
    "description": "Farm fresh tomatoes",
    "descriptionType": "text"
  }'
```

## Troubleshooting

### Issue: Deployment fails with "Bucket already exists"

**Solution:** The bucket name must be globally unique. Update `bucketName` in `serverless.yml`:

```yaml
custom:
  bucketName: quickneeds-products-${self:provider.stage}-YOUR-UNIQUE-ID
```

### Issue: Images not accessible

**Solution:** Check bucket policy:

```bash
aws s3api get-bucket-policy --bucket quickneeds-products-dev
```

### Issue: CORS errors in frontend

**Solution:** Bucket CORS is automatically configured. If issues persist, manually add:

```bash
aws s3api put-bucket-cors --bucket quickneeds-products-dev --cors-configuration '{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }]
}'
```

## Cost Estimate

For moderate usage (1000 products, 10,000 views/month):

- S3 Storage: ~$0.02/month
- S3 Requests: ~$0.01/month
- Data Transfer: ~$0.90/month
- Lambda: Free tier
- **Total: ~$1/month**

## What's New

### New Endpoint

- `POST /products/upload-image` - Upload product images

### Updated Endpoints

- `POST /products` - Now accepts imageUrl, descriptionType, descriptionImageUrl
- `PUT /products/{id}` - Can update image fields
- `GET /products` - Returns image fields
- `GET /products/{id}` - Returns image fields

### New Database Fields

Products now support:

- `imageUrl` - Product icon URL
- `descriptionType` - 'text' or 'image'
- `descriptionImageUrl` - Description image URL

## Support

For issues:

1. Check CloudWatch logs
2. Verify IAM permissions
3. Test S3 bucket access
4. Review API Gateway logs

## Next Steps

1. ✅ Deploy backend
2. ✅ Test image upload
3. ✅ Update frontend API URL if needed
4. ✅ Test end-to-end in mobile app
5. 🎉 Start uploading product images!

---

**Ready to deploy?** Just run `npm run deploy:dev`!
