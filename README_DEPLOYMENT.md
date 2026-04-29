# QuickNeeds Lambda Deployment Scripts

This directory contains automated deployment scripts for managing Lambda functions and layers.

## Scripts Overview

### 1. `deploy-lambdas.sh` - Full Deployment ⭐
**Use when**: First deployment, dependency changes, or layer updates needed

**What it does**:
- ✅ Creates/updates Lambda layers (core + firebase)
- ✅ Builds TypeScript code
- ✅ Packages and uploads to S3
- ✅ Updates all 15 Lambda functions
- ✅ Attaches layers to functions
- ✅ Verifies deployment

**Time**: ~5-7 minutes

```bash
./deploy-lambdas.sh
```

### 2. `quick-deploy.sh` - Code Only Update ⚡
**Use when**: Only code changes (no dependency updates)

**What it does**:
- ✅ Builds TypeScript code
- ✅ Packages and uploads to S3
- ✅ Updates all Lambda function code
- ❌ Does NOT update layers

**Time**: ~1-2 minutes

```bash
./quick-deploy.sh
```

### 3. `attach-layers.sh` - Attach Layers 🔗
**Use when**: Functions exist but don't have layers attached

**What it does**:
- ✅ Finds latest layer versions automatically
- ✅ Attaches both layers to all functions
- ✅ Skips functions that don't exist
- ❌ Does NOT update code or create layers

**Time**: ~30 seconds

```bash
./attach-layers.sh
```

### 4. `check-status.sh` - Status Report 📊
**Use when**: You want to see current deployment status

**What it does**:
- ✅ Lists all QuickNeeds Lambda functions
- ✅ Shows layer count for each function
- ✅ Displays runtime and last modified date
- ✅ Lists available layer versions
- ✅ Provides summary statistics

**Time**: ~10 seconds

```bash
./check-status.sh
```

### 5. `create-layers.sh` - Layers Only 📦
**Use when**: Only dependency updates needed

**What it does**:
- ✅ Creates Lambda layers
- ✅ Uploads to S3
- ✅ Publishes new layer versions
- ❌ Does NOT update function code

**Time**: ~3-4 minutes

```bash
./create-layers.sh
```

## Quick Reference

| Scenario | Script to Use | Time |
|----------|--------------|------|
| First time setup | `deploy-lambdas.sh` | 5-7 min |
| Code change only | `quick-deploy.sh` | 1-2 min |
| Dependency update | `deploy-lambdas.sh` | 5-7 min |
| New function added | `deploy-lambdas.sh` | 5-7 min |
| Layer fix only | `create-layers.sh` | 3-4 min |
| Emergency hotfix | `quick-deploy.sh` | 1-2 min |
| Check deployment status | `check-status.sh` | 10 sec |
| Functions missing layers | `attach-layers.sh` | 30 sec |

## Prerequisites

All scripts require:
- AWS CLI configured with proper credentials
- Node.js 20+ and npm installed
- `npm install` run in project directory
- AWS permissions for Lambda and S3

## Configuration

Edit these variables in each script if needed:

```bash
REGION="us-east-1"
STAGE="dev"
S3_BUCKET="quickneeds-lambda-deployments"
```

## Lambda Functions Managed

All scripts update these 15 functions:

```
quickneeds-verifyOtp
quickneeds-getProduct
quickneeds-updateProduct
quickneeds-createOrder
quickneeds-getOrder
quickneeds-deleteProduct
quickneeds-authorizer
quickneeds-listOrders
quickneeds-updateProfile
quickneeds-sendOtp
quickneeds-getProfile
quickneeds-uploadImage
quickneeds-updateOrderStatus
quickneeds-listProducts
quickneeds-createProduct
```

## TCheck Current Status

```bash
# See what's currently deployed
./check-status.sh

# Output shows:
# - Which functions have layers
# - Which functions need layers
# - Layer versions available
```

### ypical Workflow

### Day-to-Day Development (Code Changes)

```bash
# Make code changes
vim src/handlers/products.ts

# Quick deploy (1-2 min)
./quick-deploy.sh

# Test
curl https://your-api.execute-api.us-east-1.amazonaws.com/dev/products
```

### Adding New Dependencies
Functions Missing Layers

```bash
# Check which functions need layers
./check-status.sh

# Attach layers to all functions
./attach-layers.sh

# Verify
./check-status.sh
```

### 
```bash
# Add dependency
npm install new-package

# Update package.json
vim package.json

# Full deploy with layer update (5-7 min)
./deploy-lambdas.sh
```

### Emergency Rollback

```bash
# Find previous deployment
aws s3 ls s3://quickneeds-lambda-deployments/code/

# Update manually with old package
aws lambda update-function-code \
  --function-name quickneeds-listProducts \
  --s3-bucket quickneeds-lambda-deployments \
  --s3-key code/quickneeds-functions-TIMESTAMP.zip
```

## Detailed Documentation
Check if any functions already exist
./check-status.sh

# 2. Install dependencies
npm install

# 3. Configure AWS (if not already done)
aws configure

# 4. Run full deployment
./deploy-lambdas.sh

# Output:
# 🚀 QuickNeeds Lambda Deployment Script
# Continue with deployment? (y/n) y
# 🔧 Step 1: Creating Lambda Layers
# ...
# ✅ All 15 Lambda functions updated successfully!

# 5. Verify deployment
./check-status.sh
```

### Attaching Layers to Existing Functions

```bash
# If functions exist but don't have layers
./attach-layers.sh

# Output:
# 🔗 Attach Layers to Lambda Functions
# 🔍 Finding latest layer versions...
# ✓ Core layer found
# ✓ Firebase layer found
# Attach these layers to all functions? (y/n) y
# 🔄 Attaching layers to functions...
# ✓ quickneeds-verifyOtp
# ✓ quickneeds-getProduct
# ...
# ✅ All 15 functions updated with layers!
```

### Checking Deployment Status

```bash
./check-status.sh

# Output:
# 📊 Lambda Functions Status Report
# ==================================
# Region: us-east-1
# 
# Found 15 functions
# 
# Function Name                  Layers     Runtime         Last Modified
# ───────────────────────────────────────────────────────────────────────
# quickneeds-authorizer          2          nodejs20.x      2026-04-29
# quickneeds-createOrder         2          nodejs20.x      2026-04-29
# quickneeds-createProduct       0          nodejs20.x      2026-04-20
# ...
# 
# Legend:
#   2 = Both layers attached (correct)
#   1 = Only one layer attached (incomplete)
#   0 = No layers attached (needs update)

# 2. Configure AWS (if not already done)
aws configure

# 3. Run full deployment
./deploy-lambdas.sh

# Output:
# 🚀 QuickNeeds Lambda Deployment Script
# Continue with deployment? (y/n) y
# 🔧 Step 1: Creating Lambda Layers
# ...
# ✅ All 15 Lambda functions updated successfully!
```

### Quick Code Update

```bash
# After fixing a bug
./quick-deploy.sh

# Output:
# ⚡ Quick Lambda Update (Code Only)
# 🔨 Building...
# ✓ Build complete
# 📦 Packaging...
# ✓ Package: 234K
# ☁️  Uploading to S3...
# ✓ Uploaded
# 🔄 Updating 15 functions...
# ✓ quickneeds-verifyOtp
# ✓ quickneeds-getProduct
# ...
# ✅ All 15 functions updated!
```

## Error Handling # Full deployment (layers + code)
├── quick-deploy.sh           # Fast code-only update
├── attach-layers.sh          # Attach existing layers to functions
├── check-status.sh           # View deployment status
├── create-layers.sh          # Layers only creation
├── DEPLOYMENT_GUIDE.md       # Detailed documentation
├── README_DEPLOYMENT.md      # This file
└── deployment-packages/ ssages
- Continue with remaining functions if one fails

### Common Errors

**Function not found**:
```
✗ quickneeds-xxx - function not found
```
→ Function doesn't exist in AWS or name is wrong

**Permission denied**:
```
AccessDeniedException: User is not authorized
```
→ AWS credentials lack Lambda/S3 permissions

**Build failed**:
```
TypeScript compilation error
```
→ Fix TypeScript errors first: `npm run build`

## Tips

1. **Use quick-deploy for speed**: For code-only changes, `quick-deploy.sh` is 3-5x faster

2. **Monitor CloudWatch**: After deployment, check logs:
   ```bash
   aws logs tail /aws/lambda/quickneeds-listProducts --follow
   ```

3. **Test one function first**: Before full deployment, test with one function:
   ```bash
   aws lambda update-function-code \
     --function-name quickneeds-listProducts \
     --s3-bucket quickneeds-lambda-deployments \
     --s3-key code/latest.zip
   ```

4. **Keep S3 clean**: Old packages accumulate. Clean up periodically:
   ```bash
   aws s3 ls s3://quickneeds-lambda-deployments/code/
   # Delete old ones (keep last 5-10)
   ```

## Support

For issues:
1. Check script output for specific error messages
2. Review [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) troubleshooting section
3. Check AWS Lambda console for function status
4. Review CloudWatch logs for runtime errors

## Files

```
QuickNeedsServer/
├── deploy-lambdas.sh       # Full deployment (layers + code)
├── quick-deploy.sh          # Fast code-only update
├── create-layers.sh         # Layers only creation
├── DEPLOYMENT_GUIDE.md      # Detailed documentation
├── README_DEPLOYMENT.md     # This file
└── deployment-packages/     # Created during deployment
    ├── core-layer.zip
    ├── firebase-layer.zip
    ├── quickneeds-functions-*.zip
    ├── core-layer-arn.txt
    └── firebase-layer-arn.txt
```
