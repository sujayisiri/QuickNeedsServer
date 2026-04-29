# Quick Start: Lambda Deployment

## 🚀 For Your Current Situation

Since your Lambda functions already exist but **don't have layers attached**, follow these steps:

### Step 1: Check Current Status
```bash
./check-status.sh
```
This shows which functions need layers.

### Step 2: Create Layers (if not already created)
```bash
./create-layers.sh
```
This creates the layer packages and publishes them to AWS.

### Step 3: Attach Layers to All Functions
```bash
./attach-layers.sh
```
This automatically finds the latest layers and attaches them to all 15 functions.

### Step 4: Verify
```bash
./check-status.sh
```
All functions should now show "2" in the Layers column.

---

## 📋 Complete Command Sequence

```bash
# Navigate to project
cd /Users/sujays/Desktop/Personal/QuickNeedsServer

# 1. Check what you have
./check-status.sh

# 2. Create layers (takes 3-4 minutes)
./create-layers.sh

# 3. Attach layers to functions (takes 30 seconds)
./attach-layers.sh

# 4. Verify all functions have layers
./check-status.sh

# Expected output: All functions show "2" layers ✅
```

---

## 🔄 Going Forward

### For Code Changes Only
```bash
# Edit your code
vim src/handlers/products.ts

# Deploy (1-2 minutes)
./quick-deploy.sh
```

### For Code + Dependency Changes
```bash
# Update dependencies
npm install new-package

# Full deploy (5-7 minutes)
./deploy-lambdas.sh
```

### To Check Anytime
```bash
# See current status
./check-status.sh
```

---

## ⚠️ Important Notes

1. **AWS Credentials**: Make sure `aws configure` is set up correctly
2. **Region**: Scripts use `us-east-1` by default
3. **Function Names**: Scripts target functions starting with `quickneeds-`
4. **S3 Bucket**: Scripts create/use `quickneeds-lambda-deployments`

---

## 🎯 Decision Tree

```
┌─ Need to update Lambda functions?
│
├─ YES ─┬─ Functions exist but no layers? ────────→ ./attach-layers.sh
│       │
│       ├─ Code changes only? ────────────────────→ ./quick-deploy.sh
│       │
│       ├─ Code + dependencies changed? ──────────→ ./deploy-lambdas.sh
│       │
│       └─ First time / complete setup? ──────────→ ./deploy-lambdas.sh
│
└─ NO ──┬─ Just want to check status? ────────────→ ./check-status.sh
        │
        └─ Create layers for later use? ──────────→ ./create-layers.sh
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Run `./check-status.sh` - all functions show "2" layers
- [ ] Test an API endpoint
- [ ] Check CloudWatch logs for errors
- [ ] Monitor Lambda metrics for 5-10 minutes

### Test API Endpoint
```bash
# Test products list (replace with your API Gateway URL)
curl https://p4s2fjfozi.execute-api.ap-south-2.amazonaws.com/dev/products
```

### Check Logs
```bash
aws logs tail /aws/lambda/quickneeds-listProducts --follow
```

---

## 🆘 Troubleshooting

**"Function not found"**
→ Check function names: `aws lambda list-functions --region us-east-1`

**"AccessDenied"**
→ Check AWS credentials: `aws sts get-caller-identity`

**"Layers not found"**
→ Run `./create-layers.sh` first

**Build fails**
→ Fix TypeScript errors: `npm run build`

---

## 📞 Need Help?

1. Check [README_DEPLOYMENT.md](README_DEPLOYMENT.md) for detailed guides
2. Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for troubleshooting
3. Run `./check-status.sh` to see current state
4. Check CloudWatch logs in AWS Console

---

## 🎉 Success!

Once `./check-status.sh` shows all functions with "2" layers, you're done!

Your Lambda functions now have:
- ✅ Core dependencies layer (AWS SDK, JWT, UUID, bcrypt)
- ✅ Firebase layer (for push notifications)
- ✅ Your application code

Ready to handle requests! 🚀
