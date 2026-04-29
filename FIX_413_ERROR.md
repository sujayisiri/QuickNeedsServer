# Fix for 413 Request Too Large Error

## Problem

When uploading product images (especially icons), you were getting a **413 "Request Entity Too Large"** error. This is caused by API Gateway's hard limit of 10MB for request payloads.

## Root Cause

- API Gateway has a **10MB maximum payload size** for Lambda proxy integrations
- When images are uploaded through API Gateway, they get base64-encoded which increases size by ~33%
- A 7.5MB image becomes ~10MB after encoding, exceeding the limit
- There is **no way to increase** this 10MB limit in API Gateway

## Solution: S3 Presigned URLs

Instead of uploading through API Gateway, we now use **presigned URLs** to upload directly to S3:

### How It Works

1. **Frontend** requests a presigned URL from the backend (small request, just metadata)
2. **Backend** generates a presigned URL valid for 5 minutes and returns it
3. **Frontend** uploads the image directly to S3 using the presigned URL (bypasses API Gateway)
4. **Backend** returns the final S3 public URL for the image

### Benefits

✅ **No size limit** - Can upload images up to S3's limit (5GB per file)
✅ **Faster** - Direct S3 upload without Lambda processing
✅ **Lower costs** - Less Lambda execution time and data transfer
✅ **More reliable** - No API Gateway timeout issues

## Changes Made

### Backend Changes

1. **Added presigner package** ([package.json](../QuickNeedsServer/package.json))

   ```json
   "@aws-sdk/s3-request-presigner": "^3.540.0"
   ```

2. **New function in s3.ts** ([s3.ts](../QuickNeedsServer/src/utils/s3.ts))

   ```typescript
   generatePresignedUploadUrl(fileName, contentType, type);
   ```

   - Generates unique filename with UUID
   - Creates presigned PUT URL valid for 5 minutes
   - Returns both uploadUrl and final imageUrl

3. **New Lambda handler** ([products.ts](../QuickNeedsServer/src/handlers/products.ts))

   ```typescript
   getUploadUrl(event);
   ```

   - Admin-only endpoint
   - Validates file type (must be image/\*)
   - Returns presigned URL + final image URL

4. **New endpoint in serverless.yml** ([serverless.yml](../QuickNeedsServer/serverless.yml))
   ```yaml
   POST /products/get-upload-url
   ```

   - Protected by JWT authorizer
   - Same IAM permissions as before

### Frontend Changes

1. **Updated API config** ([api.ts](../QuickNeeds/src/config/api.ts))

   ```typescript
   getUploadUrl: `${API_BASE_URL}/products/get-upload-url`;
   ```

2. **Updated AdminProducts upload logic** ([AdminProducts.tsx](../QuickNeeds/src/pages/AdminProducts.tsx))
   - Now uses 2-step presigned URL approach
   - Updated file size validation to 10MB (from 5MB)
   - Handles both icon and description image uploads

3. **Created reusable utility** ([uploadImageWithPresignedUrl.ts](../QuickNeeds/src/utils/uploadImageWithPresignedUrl.ts))
   - Can be used anywhere in the app
   - Handles full presigned URL flow

## Deployment Steps

1. **Install new dependency:**

   ```bash
   cd /Users/sujays/Desktop/Personal/QuickNeedsServer
   npm install
   ```

2. **Build and deploy backend:**

   ```bash
   npm run build
   npm run deploy:dev
   ```

3. **Test the upload:**
   - Try uploading a product icon (up to 10MB now)
   - Should work without 413 error

## File Size Limits

| Type             | Old Limit | New Limit | Reason           |
| ---------------- | --------- | --------- | ---------------- |
| Icon             | 5MB       | 10MB      | Direct S3 upload |
| Description      | 5MB       | 10MB      | Direct S3 upload |
| API Gateway      | 10MB      | N/A       | Bypassed         |
| S3 Single Upload | N/A       | 5GB       | S3 limit         |

## Backward Compatibility

The old `/products/upload-image` endpoint is **still available** but has the 10MB limit. The new `/products/get-upload-url` endpoint should be used for all new uploads.

## Testing Checklist

- [ ] Backend deploys successfully
- [ ] Can upload small image (<1MB) for icon
- [ ] Can upload large image (5-10MB) for icon
- [ ] Can upload image for description
- [ ] Image URLs are publicly accessible
- [ ] Images display correctly in ProductDetails page
- [ ] Images display correctly on product cards

## Troubleshooting

**If you get CORS errors:**

- Make sure the S3 bucket has proper CORS configuration
- The presigned URL should work without additional CORS setup

**If upload fails at step 2 (S3 upload):**

- Check that the presigned URL hasn't expired (5 min timeout)
- Verify file Content-Type matches what was requested

**If images aren't publicly accessible:**

- Check S3 bucket policy allows public reads
- Verify ACL is set to "public-read" in the upload

## Next Steps

After successful deployment, you can:

1. Test with various image sizes
2. Add progress indicators for large uploads
3. Implement image compression on frontend if needed
4. Add support for multiple image uploads (product gallery)
