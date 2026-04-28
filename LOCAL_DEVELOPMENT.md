# Local Development Environment Setup

## Option 1: Quick Test (No Database)

If you just want to verify the code compiles and functions are structured correctly:

```bash
cd QuickNeedsServer
npm install
npm run build
```

If build succeeds, your TypeScript code is valid!

---

## Option 2: Full Local Testing with DynamoDB Local

### Step 1: Install DynamoDB Local

Using Docker (Recommended):

```bash
# Pull DynamoDB Local image
docker pull amazon/dynamodb-local

# Run DynamoDB Local (keep this terminal open)
docker run -p 8000:8000 amazon/dynamodb-local
```

Or without Docker:

```bash
# Install DynamoDB Local via npm
npm install -g dynamodb-local

# Start DynamoDB Local (keep this terminal open)
dynamodb-local
```

### Step 2: Install Additional Dependencies

```bash
cd QuickNeedsServer

# Install local development dependencies
npm install --save-dev dynamodb-local serverless-dynamodb-local serverless-offline
```

### Step 3: Create Local Table

Run this script to create the table in your local DynamoDB:

```bash
# Use the create-local-table script
node scripts/create-local-table.js
```

### Step 4: Start Local API Server

```bash
# Start serverless offline
npm run local

# Or with custom port
serverless offline start --httpPort 3000
```

Your API will be available at: `http://localhost:3000`

---

## Option 3: Mock Database (Fastest)

For quick testing without DynamoDB, you can use in-memory storage.

See `scripts/test-local.js` for a simple test setup.

---

## Testing the Local API

Once running, test with curl:

```bash
# Test send OTP
curl -X POST http://localhost:3000/dev/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'

# Test verify OTP (use OTP from previous response)
curl -X POST http://localhost:3000/dev/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210","otp":"123456"}'

# Test list products
curl http://localhost:3000/dev/products
```

---

## Troubleshooting

**Port already in use:**

```bash
# Use different port
serverless offline start --httpPort 3001
```

**DynamoDB connection error:**

```bash
# Make sure DynamoDB Local is running on port 8000
docker ps  # Check if container is running
```

**Cannot find module errors:**

```bash
# Rebuild
npm run build
```
