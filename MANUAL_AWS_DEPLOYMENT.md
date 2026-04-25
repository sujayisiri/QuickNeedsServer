# Manual AWS Deployment Guide

This guide walks you through manually creating all AWS resources and deploying the QuickNeeds backend without using Serverless Framework.

---

## Step 1: Create DynamoDB Table

### Via AWS Console:

1. Go to **DynamoDB** → **Tables** → **Create table**
2. Configure:
   - **Table name**: `quickneeds-dev`
   - **Partition key**: `PK` (String)
   - **Sort key**: `SK` (String)
   - **Table settings**: On-demand capacity
3. After creation, add **Global Secondary Indexes**:

   **GSI1:**
   - Name: `GSI1`
   - Partition key: `GSI1PK` (String)
   - Sort key: `GSI1SK` (String)
   - Projected attributes: All

   **GSI2:**
   - Name: `GSI2`
   - Partition key: `GSI2PK` (String)
   - Sort key: `GSI2SK` (String)
   - Projected attributes: All

4. Enable **Point-in-time recovery** in the Backups tab
5. Enable **DynamoDB Streams** with view type: New and old images

---

## Step 2: Create IAM Role for Lambda

### Via AWS Console:

1. Go to **IAM** → **Roles** → **Create role**
2. Select **AWS service** → **Lambda**
3. Click **Next**
4. Skip adding policies (we'll add custom policy)
5. Name: `quickneeds-lambda-role`
6. After creation, click the role → **Add permissions** → **Create inline policy**
7. Switch to **JSON** and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/quickneeds-dev",
        "arn:aws:dynamodb:us-east-1:*:table/quickneeds-dev/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["sns:Publish"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

8. Name the policy: `quickneeds-lambda-policy`
9. Click **Create policy**

---

## Step 3: Build the Code

```bash
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
npm install
npm run build
```

---

## Step 4: Package Lambda Functions

For each function, create a deployment package:

```bash
# Create deployment packages directory
mkdir -p deployment-packages

# Package all dependencies with built code
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
zip -r deployment-packages/functions.zip dist/ node_modules/ package.json
```

**Note:** If your package exceeds 50MB, you need to upload via S3 (see Step 4a below).

---

## Step 4a: Upload to S3 (Required if package > 50MB)

Since the package is ~64MB, direct upload won't work. Use S3 instead:

```bash
# Create an S3 bucket (one-time setup)
aws s3 mb s3://quickneeds-lambda-deployments --region us-east-1

# Upload the zip file
aws s3 cp deployment-packages/functions.zip s3://quickneeds-lambda-deployments/functions.zip
```

**Important:** Keep this bucket for future updates. You'll upload new versions here.

---

## Step 5: Create Lambda Functions

You need to create **13 Lambda functions**. For each function:

### Via AWS Console:

1. Go to **Lambda** → **Functions** → **Create function**
2. Select **Author from scratch**
3. Configure:
   - **Function name**: (see list below)
   - **Runtime**: Node.js 20.x
   - **Architecture**: x86_64
   - **Permissions**: Use existing role → `quickneeds-lambda-role`
4. Click **Create function**
5. Upload code (choose ONE method):

   **Method A - Via S3 (Required if > 50MB):**
   - **Code source** → **Upload from** → **Amazon S3 location**
   - Enter S3 URI: `s3://quickneeds-lambda-deployments/functions.zip`
   - Click **Save**

   **Method B - Direct upload (Only if < 50MB):**
   - **Code source** → **Upload from** → **.zip file**
   - Upload `deployment-packages/functions.zip`

6. Configure:
   - **Handler**: (see list below)
   - **Memory**: 512 MB
   - **Timeout**: 30 seconds
7. Add **Environment variables**:
   ```
   DYNAMODB_TABLE=quickneeds-dev
   JWT_SECRET=your-secure-random-secret-key-here
   SNS_REGION=us-east-1
   STAGE=dev
   ```

### Lambda Functions to Create:

| Function Name                  | Handler                                  |
| ------------------------------ | ---------------------------------------- |
| `quickneeds-sendOtp`           | `dist/handlers/auth.sendOtp`             |
| `quickneeds-verifyOtp`         | `dist/handlers/auth.verifyOtp`           |
| `quickneeds-getProfile`        | `dist/handlers/users.getProfile`         |
| `quickneeds-updateProfile`     | `dist/handlers/users.updateProfile`      |
| `quickneeds-listProducts`      | `dist/handlers/products.listProducts`    |
| `quickneeds-getProduct`        | `dist/handlers/products.getProduct`      |
| `quickneeds-createProduct`     | `dist/handlers/products.createProduct`   |
| `quickneeds-updateProduct`     | `dist/handlers/products.updateProduct`   |
| `quickneeds-deleteProduct`     | `dist/handlers/products.deleteProduct`   |
| `quickneeds-createOrder`       | `dist/handlers/orders.createOrder`       |
| `quickneeds-listOrders`        | `dist/handlers/orders.listOrders`        |
| `quickneeds-getOrder`          | `dist/handlers/orders.getOrder`          |
| `quickneeds-updateOrderStatus` | `dist/handlers/orders.updateOrderStatus` |
| `quickneeds-authorizer`        | `dist/handlers/authorizer.handler`       |

---

## Step 6: Create API Gateway

### Via AWS Console:

1. Go to **API Gateway** → **Create API**
2. Select **REST API** (not private) → **Build**
3. Configure:
   - **API name**: `quickneeds-api`
   - **Endpoint type**: Regional

### Create Authorizer:

1. In your API → **Authorizers** → **Create New Authorizer**
2. Configure:
   - **Name**: `jwt-authorizer`
   - **Type**: Lambda
   - **Lambda function**: `quickneeds-authorizer`
   - **Lambda Event Payload**: Token
   - **Token Source**: Authorization
   - **Token validation**: (leave empty)
3. Click **Create**

### Create Resources and Methods:

#### Auth endpoints (no authorization):

1. Create resource `/auth`
2. Create method `POST /auth/send-otp` → integrate with `quickneeds-sendOtp`
3. Create method `POST /auth/verify-otp` → integrate with `quickneeds-verifyOtp`
4. Enable CORS for both

#### User endpoints (with authorization):

1. Create resource `/users`
2. Create resource `/users/profile`
3. Create method `GET /users/profile` → integrate with `quickneeds-getProfile`
4. Create method `PUT /users/profile` → integrate with `quickneeds-updateProfile`
5. For both methods, enable **Authorization** → select `jwt-authorizer`
6. Enable CORS

#### Product endpoints:

1. Create resource `/products`
2. Create method `GET /products` → integrate with `quickneeds-listProducts` (no auth)
3. Create method `POST /products` → integrate with `quickneeds-createProduct` (with auth)
4. Create resource `/products/{id}`
5. Create method `GET /products/{id}` → integrate with `quickneeds-getProduct` (no auth)
6. Create method `PUT /products/{id}` → integrate with `quickneeds-updateProduct` (with auth)
7. Create method `DELETE /products/{id}` → integrate with `quickneeds-deleteProduct` (with auth)
8. Enable CORS for all

#### Order endpoints (all with authorization):

1. Create resource `/orders`
2. Create method `GET /orders` → integrate with `quickneeds-listOrders`
3. Create method `POST /orders` → integrate with `quickneeds-createOrder`
4. Create resource `/orders/{id}`
5. Create method `GET /orders/{id}` → integrate with `quickneeds-getOrder`
6. Create resource `/orders/{id}/status`
7. Create method `PUT /orders/{id}/status` → integrate with `quickneeds-updateOrderStatus`
8. All require `jwt-authorizer`
9. Enable CORS for all

### Deploy API:

1. Click **Actions** → **Deploy API**
2. Create new stage: `dev`
3. Click **Deploy**
4. Note the **Invoke URL** (e.g., `https://abc123.execute-api.us-east-1.amazonaws.com/dev`)

---

## Step 7: Test the API

```bash
# Set your API URL
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"

# Test send OTP
curl -X POST $API_URL/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'

# Test list products
curl $API_URL/products
```

---

## Step 8: Create Admin User

Run this from your local machine:

```bash
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=quickneeds-dev
npm run create:admin 9999999999
```

---

## Step 9: Seed Products (Optional)

```bash
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=quickneeds-dev
npm run seed:products
```

---

## Important Notes

1. **Replace region**: Change `us-east-1` to your preferred region throughout
2. **JWT_SECRET**: Use a strong random string, not the default
3. **API Gateway permissions**: Each Lambda needs permission to be invoked by API Gateway (AWS console adds this automatically when you integrate)
4. **CORS**: Make sure to enable CORS for all endpoints that will be called from the frontend
5. **Cost**: Using on-demand billing and pay-per-request reduces costs when traffic is low

---

## Updating Code

To update after making changes:

```bash
# Rebuild
npm run build

# Repackage
zip -r deployment-packages/functions.zip dist/ node_modules/ package.json

# Upload to S3
aws s3 cp deployment-packages/functions.zip s3://quickneeds-lambda-deployments/functions.zip

# Update all Lambda functions via AWS CLI:
aws lambda update-function-code \
  --function-name quickneeds-sendOtp \
  --s3-bucket quickneeds-lambda-deployments \
  --s3-key functions.zip

# Repeat for all 13 functions, or use this loop:
for func in sendOtp verifyOtp getProfile updateProfile listProducts getProduct createProduct updateProduct deleteProduct createOrder listOrders getOrder updateOrderStatus authorizer; do
  aws lambda update-function-code \
    --function-name quickneeds-$func \
    --s3-bucket quickneeds-lambda-deployments \
    --s3-key functions.zip
done
```

---

## Why Serverless Framework is Better

This manual process requires creating and managing 13 Lambda functions + API Gateway + DynamoDB + IAM roles separately. Serverless Framework does all of this with one command (`serverless deploy`), manages state, handles updates, and ensures consistency.

If you're hitting deployment issues with Serverless Framework, they're usually fixable. The manual approach above is significantly more time-consuming and error-prone.
