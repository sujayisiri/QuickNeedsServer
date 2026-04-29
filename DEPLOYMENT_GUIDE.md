# Lambda Deployment Guide

## Overview

The `deploy-lambdas.sh` script provides a complete automated deployment solution for updating all QuickNeeds Lambda functions with new code and layers.

## What It Does

### 1. Creates/Updates Lambda Layers
- **Layer 1 (Core)**: AWS SDK, JWT, UUID, bcryptjs (~80-100MB)
- **Layer 2 (Firebase)**: firebase-admin SDK (~120-150MB)
- Optimizes size by removing docs, tests, and unnecessary files
- Publishes new layer versions to AWS Lambda

### 2. Builds Application Code
- Compiles TypeScript to JavaScript
- Creates a deployment package (zip) with compiled code only
- Excludes source maps and dev files

### 3. Uploads to S3
- Uploads both layers to `s3://quickneeds-lambda-deployments/layers/`
- Uploads code package to `s3://quickneeds-lambda-deployments/code/`
- Uses timestamped filenames to track deployments

### 4. Updates All Lambda Functions
- Updates code for all 15 Lambda functions
- Attaches both layers to each function
- Handles errors gracefully and reports status

### 5. Verifies Deployment
- Checks layer attachments
- Validates code size
- Shows last modified timestamps

## Prerequisites

Before running the script, ensure you have:

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure list
   ```

2. **Correct AWS credentials**
   - Must have permissions for:
     - Lambda (create/update functions, publish layers)
     - S3 (create bucket, upload objects)
     - IAM (if creating new roles)

3. **Node.js and npm installed**
   ```bash
   node --version
   npm --version
   ```

4. **Project dependencies installed**
   ```bash
   npm install
   ```

## Usage

### Quick Start

```bash
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
./deploy-lambdas.sh
```

The script will:
1. Show configuration and ask for confirmation
2. Execute all deployment steps
3. Show progress with colored output
4. Display a summary at the end

### Expected Output

```
🚀 QuickNeeds Lambda Deployment Script
========================================

Region: us-east-1
Stage: dev
S3 Bucket: quickneeds-lambda-deployments
Functions: 15

Continue with deployment? (y/n)
```

### Step-by-Step Process

1. **S3 Bucket Check** (10 seconds)
   - Creates bucket if it doesn't exist
   - Reuses existing bucket

2. **Layer Creation** (2-3 minutes)
   - Installs dependencies in clean environments
   - Creates optimized zip files
   - Uploads to S3
   - Publishes new layer versions

3. **Code Build** (30 seconds)
   - Compiles TypeScript
   - Creates deployment package

4. **S3 Upload** (10 seconds)
   - Uploads code package with timestamp

5. **Lambda Updates** (1-2 minutes)
   - Updates each function's code
   - Attaches both layers
   - Shows progress for each function

6. **Verification** (30 seconds)
   - Samples 3 functions to verify deployment

**Total Time: ~5-7 minutes**

## Lambda Functions Updated

The script updates these 15 functions:

| Function Name | Handler | Purpose |
|--------------|---------|---------|
| quickneeds-verifyOtp | auth.verifyOtp | Verify OTP for login |
| quickneeds-sendOtp | auth.sendOtp | Send OTP via Firebase |
| quickneeds-getProfile | profile.getProfile | Get user profile |
| quickneeds-updateProfile | profile.updateProfile | Update user profile |
| quickneeds-listProducts | products.listProducts | List all products |
| quickneeds-getProduct | products.getProduct | Get single product |
| quickneeds-createProduct | products.createProduct | Create product (admin) |
| quickneeds-updateProduct | products.updateProduct | Update product (admin) |
| quickneeds-deleteProduct | products.deleteProduct | Delete product (admin) |
| quickneeds-uploadImage | products.uploadImage | Upload image (legacy) |
| quickneeds-createOrder | orders.createOrder | Create new order |
| quickneeds-listOrders | orders.listOrders | List user/admin orders |
| quickneeds-getOrder | orders.getOrder | Get single order |
| quickneeds-updateOrderStatus | orders.updateOrderStatus | Update order status (admin) |
| quickneeds-authorizer | authorizer.handler | JWT authorizer |

## Configuration

Edit these variables in `deploy-lambdas.sh` if needed:

```bash
REGION="us-east-1"              # AWS region
STAGE="dev"                      # Deployment stage
S3_BUCKET="quickneeds-lambda-deployments"  # S3 bucket name
```

## Troubleshooting

### Script Fails at Layer Creation

**Error**: `npm install` fails
```bash
cd QuickNeedsServer
npm install
npm run build
```

### Function Not Found Errors

**Error**: `quickneeds-xxx - function not found`

The function doesn't exist in AWS. Check function names:
```bash
aws lambda list-functions --region us-east-1 --query 'Functions[?starts_with(FunctionName, `quickneeds`)].FunctionName'
```

If names are different, update the `LAMBDA_FUNCTIONS` array in the script.

### Layers Not Attaching

**Error**: Layer attachment fails

Check layer ARNs exist:
```bash
aws lambda list-layers --region us-east-1
```

View layer details:
```bash
aws lambda get-layer-version --layer-name quickneeds-core-dependencies --version-number 1
```

### Permission Denied

**Error**: `AccessDeniedException`

Your AWS credentials lack required permissions. Add these policies:
- AWSLambdaFullAccess
- AmazonS3FullAccess

Or use a custom policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:UpdateFunctionConfiguration",
        "lambda:PublishLayerVersion",
        "lambda:GetFunction",
        "lambda:GetFunctionConfiguration",
        "s3:CreateBucket",
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "*"
    }
  ]
}
```

### S3 Upload Fails

**Error**: S3 upload timeout or failure

Check S3 access:
```bash
aws s3 ls s3://quickneeds-lambda-deployments/
```

If bucket doesn't exist in the region:
```bash
aws s3 mb s3://quickneeds-lambda-deployments --region us-east-1
```

## Manual Verification

After deployment, verify manually:

### 1. Check Lambda Function

```bash
aws lambda get-function-configuration \
  --function-name quickneeds-listProducts \
  --region us-east-1
```

Look for:
- `Layers`: Should show 2 layer ARNs
- `CodeSize`: Should match deployment package
- `LastModified`: Should be recent

### 2. Test an Endpoint

```bash
# Get a product (requires authentication)
curl https://p4s2fjfozi.execute-api.ap-south-2.amazonaws.com/dev/products
```

### 3. Check CloudWatch Logs

```bash
aws logs tail /aws/lambda/quickneeds-listProducts --follow
```

## Advanced Usage

### Deploy to Production

Edit the script:
```bash
STAGE="prod"
S3_BUCKET="quickneeds-lambda-deployments-prod"
```

Update function names if they include stage:
```bash
LAMBDA_FUNCTIONS=(
  "quickneeds-prod-verifyOtp"
  "quickneeds-prod-getProduct"
  # ... etc
)
```

### Deploy Only Code (Skip Layers)

Comment out the layer creation step:
```bash
# create_layers  # Skip layer creation
build_and_package
upload_code
# Update update_lambdas() to not modify layers
```

### Dry Run Mode

Add before `main()`:
```bash
DRY_RUN=true  # Set to true for testing

# In update functions, add:
if [ "$DRY_RUN" = true ]; then
  echo "  [DRY RUN] Would update ${function_name}"
  continue
fi
```

## Rollback

If deployment fails or causes issues:

### 1. Rollback to Previous Code

```bash
# List previous versions
aws s3 ls s3://quickneeds-lambda-deployments/code/

# Use a previous package
OLD_PACKAGE="quickneeds-functions-20260428-123456.zip"

# Update each function
aws lambda update-function-code \
  --function-name quickneeds-listProducts \
  --s3-bucket quickneeds-lambda-deployments \
  --s3-key code/${OLD_PACKAGE}
```

### 2. Rollback Layers

```bash
# List layer versions
aws lambda list-layer-versions --layer-name quickneeds-core-dependencies

# Use previous version (e.g., version 5 instead of 6)
CORE_ARN="arn:aws:lambda:us-east-1:ACCOUNT:layer:quickneeds-core-dependencies:5"
FIREBASE_ARN="arn:aws:lambda:us-east-1:ACCOUNT:layer:quickneeds-firebase-dependencies:5"

# Update function with old layers
aws lambda update-function-configuration \
  --function-name quickneeds-listProducts \
  --layers ${CORE_ARN} ${FIREBASE_ARN}
```

## Best Practices

1. **Always test in dev first**
   - Deploy to dev environment
   - Test all endpoints
   - Check CloudWatch logs

2. **Keep deployment packages**
   - S3 stores all versions automatically
   - Use meaningful names with timestamps

3. **Monitor after deployment**
   - Watch CloudWatch metrics
   - Check error rates
   - Monitor Lambda duration/memory

4. **Backup before major updates**
   - Export Lambda configurations
   - Document current layer versions
   - Keep previous deployment packages

5. **Use CI/CD for production**
   - Integrate with GitHub Actions
   - Add automated tests
   - Require approvals

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy Lambda Functions

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Deploy
        run: ./deploy-lambdas.sh
```

## Support

For issues or questions:
1. Check CloudWatch logs: `/aws/lambda/quickneeds-*`
2. Review AWS Lambda console: https://console.aws.amazon.com/lambda
3. Check S3 bucket contents: https://console.aws.amazon.com/s3
4. Verify IAM permissions for your user/role

## Related Documentation

- [MANUAL_AWS_DEPLOYMENT.md](MANUAL_AWS_DEPLOYMENT.md) - Manual deployment steps
- [FIX_413_ERROR.md](FIX_413_ERROR.md) - Image upload with presigned URLs
- [ADMIN_FEATURES.md](../ADMIN_FEATURES.md) - Admin functionality
- [PUSH_NOTIFICATIONS_SETUP.md](../PUSH_NOTIFICATIONS_SETUP.md) - Firebase setup
