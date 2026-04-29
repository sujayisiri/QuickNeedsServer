# Product Image Upload - Backend Implementation

This document describes the backend changes implemented to support product image uploads to AWS S3.

## Changes Summary

### 1. New Files Created

#### `/src/utils/s3.ts`

Utility functions for S3 operations:

- `uploadImageToS3()` - Uploads image buffer to S3 and returns public URL
- `parseMultipartFormData()` - Parses multipart/form-data from API Gateway

### 2. Modified Files

#### `/src/types/index.ts`

Updated `Product` interface with new fields:

```typescript
export interface Product {
  // ... existing fields
  imageUrl?: string; // Product icon/thumbnail image URL (from S3)
  descriptionType?: "text" | "image"; // Type of description
  descriptionImageUrl?: string; // Image description URL (from S3)
}
```

#### `/src/handlers/products.ts`

**New Handler:**

- `uploadImage()` - Handles image upload to S3 (Admin only)
  - Validates file type and size
  - Uploads to S3 with public-read ACL
  - Returns S3 URL

**Updated Handlers:**

- `listProducts()` - Now returns new image fields
- `getProduct()` - Returns new image fields
- `createProduct()` - Accepts and stores new image fields
- `updateProduct()` - Can update new image fields

#### `/serverless.yml`

**Environment Variables:**

- Added `S3_BUCKET_NAME` - S3 bucket name for product images
- Added `AWS_REGION` - AWS region for S3

**IAM Permissions:**

- Added S3 permissions for PutObject, PutObjectAcl, GetObject

**Functions:**

- Added `uploadProductImage` function with route `/products/upload-image`

**Resources:**

- Added `ProductsImagesBucket` - S3 bucket with public read access
- Added `ProductsImagesBucketPolicy` - Bucket policy for public read

#### `/package.json`

- Added `@aws-sdk/client-s3` dependency

#### `/.env.example`

- Added `S3_BUCKET_NAME` environment variable

## API Endpoints

### POST `/products/upload-image`

Upload a product image to S3.

**Authentication:** Required (Admin only)

**Headers:**

```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**Request Body (FormData):**

- `image` (File) - The image file to upload
- `type` (string) - Type of image: "icon" or "description"

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://quickneeds-products-dev.s3.us-east-1.amazonaws.com/products/icon-uuid.jpg",
    "message": "Image uploaded successfully"
  }
}
```

**Response (Error):**

```json
{
  "success": false,
  "error": "Error message"
}
```

**Validations:**

- File must be an image (image/\*)
- File size must be less than 5MB
- Type must be "icon" or "description"
- User must be an admin

### POST `/products` (Updated)

Now accepts additional fields:

**Request Body:**

```json
{
  "name": "Product Name",
  "price": 100,
  "category": "Vegetables",
  "unit": "kg",
  "image": "🍅",
  "imageUrl": "https://s3-url/products/icon-uuid.jpg",
  "description": "Product description",
  "descriptionType": "text",
  "descriptionImageUrl": "https://s3-url/products/description-uuid.jpg"
}
```

### PUT `/products/{id}` (Updated)

Can now update image fields:

**Request Body:**

```json
{
  "imageUrl": "https://s3-url/products/new-icon.jpg",
  "descriptionType": "image",
  "descriptionImageUrl": "https://s3-url/products/new-description.jpg"
}
```

### GET `/products` and GET `/products/{id}` (Updated)

Now return image fields in response.

## Deployment

### 1. Install Dependencies

```bash
cd QuickNeedsServer
npm install
```

### 2. Update Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the following:

```env
S3_BUCKET_NAME=quickneeds-products-dev
AWS_REGION=us-east-1
```

### 3. Deploy to AWS

```bash
# Deploy to dev environment
npm run deploy:dev

# Or deploy to production
npm run deploy:prod
```

This will:

- Create the S3 bucket automatically
- Set up bucket policy for public read access
- Deploy all Lambda functions
- Configure API Gateway routes

### 4. Verify Deployment

After deployment, Serverless will output:

```
endpoints:
  POST - https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/products/upload-image
  ...other endpoints...
```

Test the endpoint:

```bash
curl -X POST \
  https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/products/upload-image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "type=icon"
```

## Database Schema

No changes needed to DynamoDB tables. The new fields are optional and will be automatically stored when products are created/updated.

**Product Item Structure:**

```
PK: "PRODUCT#<uuid>"
SK: "METADATA"
productId: "<uuid>"
name: "Product Name"
price: 100
category: "Vegetables"
unit: "kg"
image: "🍅"
imageUrl: "https://s3-url/products/icon.jpg"      // NEW
description: "Description text"
descriptionType: "text" or "image"                 // NEW
descriptionImageUrl: "https://s3-url/desc.jpg"    // NEW
barcode: "123456"
stock: 100
active: true
createdAt: "2026-04-29T..."
updatedAt: "2026-04-29T..."
createdBy: "+919876543210"
```

## S3 Bucket Configuration

The bucket is automatically configured with:

### Public Access

- Public read access enabled for GetObject
- Images are publicly accessible via HTTPS URL

### CORS Configuration

Allows cross-origin requests from any domain:

- Allowed Methods: GET, PUT, POST, DELETE
- Allowed Headers: \*
- Allowed Origins: \*

### Naming Convention

Images are stored with unique filenames:

- Icon images: `products/icon-<uuid>.<extension>`
- Description images: `products/description-<uuid>.<extension>`

### URL Format

```
https://<bucket-name>.s3.<region>.amazonaws.com/products/<type>-<uuid>.<extension>

Example:
https://quickneeds-products-dev.s3.us-east-1.amazonaws.com/products/icon-abc123.jpg
```

## Security Considerations

### File Upload Security

1. **File Type Validation**: Only image/\* MIME types are allowed
2. **File Size Limit**: Maximum 5MB per file
3. **Admin-Only Access**: Only admin users can upload images
4. **Unique Filenames**: UUIDs prevent filename collisions

### S3 Security

1. **Public Read Access**: Images are publicly readable (required for app)
2. **Restricted Write**: Only Lambda functions can write to bucket
3. **IAM Policies**: Minimal permissions granted to Lambda role

### Recommendations

1. **Add Image Scanning**: Consider adding virus/malware scanning
2. **Image Optimization**: Add automatic image compression/resizing
3. **CDN**: Use CloudFront for faster image delivery
4. **Rate Limiting**: Add rate limits to upload endpoint

## Cost Considerations

### S3 Costs

- Storage: ~$0.023 per GB/month
- Data Transfer: First 1 GB free, then ~$0.09 per GB
- Requests: Minimal (PUT/GET requests)

**Example:**

- 1000 products with 2 images each (icon + description)
- Average 500 KB per image
- Total: ~1 GB storage = ~$0.023/month
- 10,000 views/month = ~$0.90/month
- **Total: ~$1/month for moderate usage**

### Lambda Costs

- Free tier: 1M requests/month
- After: $0.20 per 1M requests
- Image upload adds ~500ms execution time

## Testing

### Test Upload Locally

If running with `serverless offline`:

```bash
# Start local server
npm run local

# Upload test image
curl -X POST \
  http://localhost:3000/products/upload-image \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "image=@test-image.jpg" \
  -F "type=icon"
```

**Note:** Local testing requires:

1. AWS credentials configured
2. S3 bucket already created
3. DynamoDB table accessible

### Test Product Creation with Images

1. Upload an icon image
2. Upload a description image
3. Create product with returned URLs:

```bash
curl -X POST \
  https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/products \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fresh Tomatoes",
    "price": 30,
    "category": "Vegetables",
    "unit": "kg",
    "image": "🍅",
    "imageUrl": "https://s3-url/icon.jpg",
    "description": "Farm fresh tomatoes",
    "descriptionType": "image",
    "descriptionImageUrl": "https://s3-url/description.jpg"
  }'
```

## Troubleshooting

### Common Issues

**1. "Access Denied" when uploading**

- Check IAM role has S3 permissions
- Verify bucket policy allows PutObject
- Confirm bucket exists

**2. "Bucket does not exist"**

- Run `serverless deploy` to create bucket
- Check `S3_BUCKET_NAME` environment variable
- Verify AWS region is correct

**3. "File too large"**

- Maximum file size is 5MB
- Compress images before upload
- Consider implementing client-side compression

**4. "Invalid Content-Type"**

- Must use `multipart/form-data`
- Ensure frontend sends correct headers
- Check API Gateway binary media types

**5. Images not loading in app**

- Verify S3 bucket policy allows public read
- Check CORS configuration
- Confirm image URLs are correct
- Test URL directly in browser

### Debug Commands

```bash
# Check if bucket exists
aws s3 ls s3://quickneeds-products-dev/

# List uploaded images
aws s3 ls s3://quickneeds-products-dev/products/

# Check bucket policy
aws s3api get-bucket-policy --bucket quickneeds-products-dev

# Test image accessibility
curl -I https://quickneeds-products-dev.s3.us-east-1.amazonaws.com/products/icon-uuid.jpg
```

## Migration Guide

### Existing Products

Existing products without image fields will continue to work:

- `imageUrl` defaults to undefined (uses emoji fallback)
- `descriptionType` defaults to 'text'
- `descriptionImageUrl` defaults to undefined

No database migration needed - fields are optional.

### Updating Existing Products

Use the update endpoint to add images to existing products:

```bash
curl -X PUT \
  https://xxxxx.execute-api.us-east-1.amazonaws.com/dev/products/<product-id> \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://s3-url/new-icon.jpg",
    "descriptionType": "image",
    "descriptionImageUrl": "https://s3-url/description.jpg"
  }'
```

## Future Enhancements

1. **Image Optimization**
   - Auto-resize images to standard sizes
   - Generate thumbnails for faster loading
   - Convert to WebP format

2. **Multiple Images**
   - Support image galleries
   - Multiple product angles
   - Zoom functionality

3. **CDN Integration**
   - Use CloudFront for image delivery
   - Edge caching for faster loads
   - Custom domain for images

4. **Image Processing**
   - Background removal
   - Auto-cropping
   - Watermarking

5. **Advanced Features**
   - Video support
   - 360° product views
   - AR preview support

---

**Last Updated**: April 29, 2026
**Version**: 1.0.0
