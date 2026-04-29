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
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:PutObjectAcl", "s3:GetObject"],
      "Resource": "arn:aws:s3:::quickneeds-products-dev/*"
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

## Step 4: Create Lambda Layers for Dependencies (Split into 2 layers)

Lambda has a 250MB unzipped size limit per layer. Since our dependencies are large (especially firebase-admin), we'll split them into **2 layers**:

### Layer 1: Core Dependencies (AWS SDK + Essential packages)

```bash
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
mkdir -p deployment-packages

# Create core layer structure
mkdir -p layers/core/nodejs
cd layers/core/nodejs

# Create package.json with core dependencies only
cat > package.json << 'EOF'
{
  "name": "quickneeds-core-dependencies",
  "version": "1.0.0",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.540.0",
    "@aws-sdk/lib-dynamodb": "^3.540.0",
    "@aws-sdk/client-s3": "^3.540.0",
    "@aws-sdk/client-sns": "^3.540.0",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1",
    "bcryptjs": "^2.4.3"
  }
}
EOF

# Install production dependencies only
npm install --production --no-optional

# Remove unnecessary files
rm -rf node_modules/**/*.md
rm -rf node_modules/**/test
rm -rf node_modules/**/tests
rm -rf node_modules/**/.github

# Package the layer
cd ..
zip -r -q ../../deployment-packages/core-layer.zip nodejs/
cd ../..

# Check size
echo "Core layer size:"
ls -lh deployment-packages/core-layer.zip
```

### Layer 2: Firebase Dependencies

```bash
# Create firebase layer structure
mkdir -p layers/firebase/nodejs
cd layers/firebase/nodejs

# Create package.json with firebase only
cat > package.json << 'EOF'
{
  "name": "quickneeds-firebase-dependencies",
  "version": "1.0.0",
  "dependencies": {
    "firebase-admin": "^13.8.0"
  }
}
EOF

# Install production dependencies only
npm install --production --no-optional

# Remove unnecessary files to reduce size
rm -rf node_modules/**/*.md
rm -rf node_modules/**/test
rm -rf node_modules/**/tests
rm -rf node_modules/**/.github
rm -rf node_modules/**/docs
rm -rf node_modules/**/examples

# Package the layer
cd ..
zip -r -q ../../deployment-packages/firebase-layer.zip nodejs/
cd ../..

# Check size
echo "Firebase layer size:"
ls -lh deployment-packages/firebase-layer.zip
```

### Upload Both Layers to S3

```bash
# Create S3 bucket (if not already created)
aws s3 mb s3://quickneeds-lambda-deployments --region us-east-1

# Upload both layers
aws s3 cp deployment-packages/core-layer.zip s3://quickneeds-lambda-deployments/
aws s3 cp deployment-packages/firebase-layer.zip s3://quickneeds-lambda-deployments/
```

### Create Both Lambda Layers

```bash
# Create Core Layer
aws lambda publish-layer-version \
  --layer-name quickneeds-core-dependencies \
  --description "Core dependencies: AWS SDK, JWT, UUID, bcrypt" \
  --content S3Bucket=quickneeds-lambda-deployments,S3Key=core-layer.zip \
  --compatible-runtimes nodejs20.x \
  --region us-east-1

# Note the ARN output (e.g., arn:aws:lambda:us-east-1:123456789:layer:quickneeds-core-dependencies:1)

# Create Firebase Layer
aws lambda publish-layer-version \
  --layer-name quickneeds-firebase-dependencies \
  --description "Firebase Admin SDK for push notifications" \
  --content S3Bucket=quickneeds-lambda-deployments,S3Key=firebase-layer.zip \
  --compatible-runtimes nodejs20.x \
  --region us-east-1

# Note the ARN output (e.g., arn:aws:lambda:us-east-1:123456789:layer:quickneeds-firebase-dependencies:1)
```

**Save both ARNs - you'll need them when creating Lambda functions!**

### Via AWS Console (Alternative):

If you prefer using the console:

1. **Create Core Layer:**
   - Go to **Lambda** → **Layers** → **Create layer**
   - Name: `quickneeds-core-dependencies`
   - Upload from S3: `s3://quickneeds-lambda-deployments/core-layer.zip`
   - Compatible runtimes: Node.js 20.x
   - Click **Create**

2. **Create Firebase Layer:**
   - Go to **Lambda** → **Layers** → **Create layer**
   - Name: `quickneeds-firebase-dependencies`
   - Upload from S3: `s3://quickneeds-lambda-deployments/firebase-layer.zip`
   - Compatible runtimes: Node.js 20.x
   - Click **Create**

---

## Step 5: Package Lambda Function Code

Now package just your code (much smaller without node_modules):

```bash
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
mkdir -p deployment-packages
zip -r deployment-packages/functions.zip dist/
```

This should be < 1MB and can be uploaded directly!

---

## Step 6: Create Lambda Functions

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
5. Upload code:
   - **Code source** → **Upload from** → **.zip file**
   - Upload `deployment-packages/functions.zip`

6. **Add BOTH Layers:**
   - Scroll down to **Layers** section
   - Click **Add a layer**
   - Select **Custom layers**
   - Choose `quickneeds-core-dependencies` and version 1
   - Click **Add**
   - Click **Add a layer** again
   - Choose `quickneeds-firebase-dependencies` and version 1
   - Click **Add**
   - (You should now see 2 layers attached)

7. Configure:
   - **Handler**: (see list below)
   - **Memory**: 512 MB
   - **Timeout**: 30 seconds
8. Add **Environment variables**:
   ```
   S3_BUCKET_NAME=quickneeds-products-dev
   AWS_REGION=us-east-1
   DYNAMODB_TABLE=quickneeds-dev
   JWT_SECRET=your-secure-random-secret-key-here
   SNS_REGION=us-east-1
   STAGE=dev
   ```

### Lambda Functions to Create:

| Function Name                   | Handler                                |
| ------------------------------- | -------------------------------------- |
| `quickneeds-sendOtp`            | `dist/handlers/auth.sendOtp`           |
| `quickneeds-verifyOtp`          | `dist/handlers/auth.verifyOtp`         |
| `quickneeds-getProfile`         | `dist/handlers/users.getProfile`       |
| `quickneeds-updateProfile`      | `dist/handlers/users.updateProfile`    |
| `quickneeds-listProducts`       | `dist/handlers/products.listProducts`  |
| `quickneeds-getProduct`         | `dist/handlers/products.getProduct`    |
| `quickneeds-createProduct`      | `dist/handlers/products.createProduct` |
| `quickneeds-updateProduct`      | `dist/handlers/products.updateProduct` |
| `quickneeds-deleteProduct`      | `dist/handlers/products.deleteProduct` |
| `quickneeds-createOrder`        | `dist/handlers/orders.createOrder`     |
| `quickneeds-listOrders`         | `dist/handlers/orders.listOrders`      |
| `quickneeds-uploadProductImage` | `dist/handlers/products.uploadImage`   |
| `quickneeds-authorizer`         | `dist/handlers/authorizer.handler`     |

**Note:** All functions need BOTH layers attached (core + firebase).
| `quickneeds-updateOrderStatus` | `dist/handlers/orders.updateOrderStatus` |
| `quickneeds-authorizer` | `dist/handlers/authorizer.handler` |

---

## Step 7: Create API Gateway

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
5. Create resource `/products/upload-image`
6. Create method `POST /products/upload-image` → integrate with `quickneeds-uploadProductImage` (with auth)
7. For both methods, enable **Authorization** → select `jwt-authorizer`
8. Enable CORS

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

## Step 8: Test the API

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

## Step 9: Create Admin User

Run this from your local machine:

```bash
cd /Users/sujays/Desktop/Personal/QuickNeedsServer
export AWS_REGION=us-east-1
export DYNAMODB_TABLE=quickneeds-dev
npm run create:admin 9999999999
```

---

## Step 10: Seed Products (Optional)

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

### Update Function Code (when you change handlers):

````bash
# Rebuilds (when package.json changes):

```bash
# Rebuild and republish layers following the same process as Step 4
# Then update all functions with new layer versions:

CORE_LAYER_ARN="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:layer:quickneeds-core-dependencies:2"
FIREBASE_LAYER_ARN="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:layer:quickneeds-firebase-dependencies:2"

for func in sendOtp verifyOtp getProfile updateProfile listProducts getProduct createProduct updateProduct deleteProduct uploadProductImage createOrder listOrders getOrder updateOrderStatus authorizer; do
  aws lambda update-function-configuration \
    --function-name quickneeds-$func \
    --layers $CORE_LAYER_ARN $FIREBASE_
# Publish new layer version
aws lambda publish-layer-version \
  --layer-name quickneeds-dependencies \
  --zip-file fileb://deployment-packages/dependencies-layer.zip \
  --compatible-runtimes nodejs20.x

# Note the new version number (e.g., 2)
# Update all functions to use new layer version:
LAYER_ARN="arn:aws:lambda:us-east-1:YOUR_ACCOUNT_ID:layer:quickneeds-dependencies:2"

for func in sendOtp verifyOtp getProfile updateProfile listProducts getProduct createProduct updateProduct deleteProduct createOrder listOrders getOrder updateOrderStatus authorizer; do
  aws lambda update-function-configuration \
    --function-name quickneeds-$func \
    --layers $LAYER_ARN
done
````

---

## Why Serverless Framework is Better

This manual process requires creating and managing 13 Lambda functions + API Gateway + DynamoDB + IAM roles separately. Serverless Framework does all of this with one command (`serverless deploy`), manages state, handles updates, and ensures consistency.

If you're hitting deployment issues with Serverless Framework, they're usually fixable. The manual approach above is significantly more time-consuming and error-prone.
