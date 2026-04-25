# QuickNeeds Server - Deployment Guide

## Prerequisites Checklist

- [ ] Node.js 20.x installed
- [ ] AWS Account created
- [ ] AWS CLI installed and configured
- [ ] Serverless Framework installed globally: `npm install -g serverless`

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
cd QuickNeedsServer
npm install
```

### 2. Configure AWS CLI

```bash
aws configure
```

Enter your:

- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., us-east-1)
- Default output format (json)

### 3. Set Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env and set JWT_SECRET
# For production, use a strong random string
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Build the Project

```bash
npm run build
```

### 5. Deploy to Development

```bash
npm run deploy:dev
```

This will:

- Package your Lambda functions
- Create DynamoDB table: `quickneeds-dev`
- Create API Gateway endpoints
- Set up IAM roles and permissions
- Deploy all Lambda functions

**Output Example:**

```
Service Information
service: quickneeds-api
stage: dev
region: us-east-1
stack: quickneeds-api-dev
api keys:
  None
endpoints:
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/auth/send-otp
  POST - https://abc123.execute-api.us-east-1.amazonaws.com/dev/auth/verify-otp
  GET - https://abc123.execute-api.us-east-1.amazonaws.com/dev/products
  ...
functions:
  sendOtp: quickneeds-api-dev-sendOtp
  verifyOtp: quickneeds-api-dev-verifyOtp
  ...
```

**Save the API base URL**: `https://abc123.execute-api.us-east-1.amazonaws.com/dev`

### 6. Test the Deployment

Test the send-otp endpoint:

```bash
curl -X POST https://YOUR-API-URL/dev/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

Expected response:

```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "otp": "123456"
  }
}
```

### 7. Create Admin User

After deploying, create an admin user manually in DynamoDB:

**AWS Console Method:**

1. Go to DynamoDB Console
2. Select table: `quickneeds-dev`
3. Click "Create item"
4. Add the following:

```json
{
  "PK": "USER#9999999999",
  "SK": "PROFILE",
  "phoneNumber": "9999999999",
  "name": "Admin User",
  "role": "admin",
  "createdAt": "2024-04-25T00:00:00.000Z",
  "updatedAt": "2024-04-25T00:00:00.000Z"
}
```

**Or use AWS CLI:**

```bash
aws dynamodb put-item \
  --table-name quickneeds-dev \
  --item '{
    "PK": {"S": "USER#9999999999"},
    "SK": {"S": "PROFILE"},
    "phoneNumber": {"S": "9999999999"},
    "name": {"S": "Admin User"},
    "role": {"S": "admin"},
    "createdAt": {"S": "2024-04-25T00:00:00.000Z"},
    "updatedAt": {"S": "2024-04-25T00:00:00.000Z"}
  }'
```

### 8. Seed Initial Products (Optional)

You can create a script to seed products or add them via the admin API after logging in.

**Using API:**

```bash
# 1. Login as admin to get token
curl -X POST https://YOUR-API-URL/dev/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9999999999","otp":"123456"}'

# 2. Use token to create products
curl -X POST https://YOUR-API-URL/dev/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Tomato",
    "price": 30,
    "category": "Vegetables",
    "unit": "kg",
    "image": "🍅",
    "description": "Fresh red tomatoes",
    "stock": 100
  }'
```

### 9. Deploy to Production

When ready for production:

```bash
# Set production JWT secret
export JWT_SECRET="your-production-secret-key"

# Deploy to production
npm run deploy:prod
```

**Important Production Steps:**

1. Update CORS origins in `serverless.yml` to your production domain
2. Store JWT_SECRET in AWS Secrets Manager
3. Enable CloudWatch alarms for monitoring
4. Set up custom domain name (optional)
5. Enable WAF for API Gateway (recommended)
6. Enable CloudFront for caching (optional)

### 10. Update Frontend Configuration

Update your React app to use the deployed API:

```typescript
// In your frontend config
const API_BASE_URL = "https://abc123.execute-api.us-east-1.amazonaws.com/dev";
```

---

## Post-Deployment

### Monitor Your Application

**View Logs:**

```bash
# View logs for specific function
serverless logs -f sendOtp --stage dev --tail

# View all logs
serverless logs --stage dev --tail
```

**Check Metrics:**
Go to AWS Console → CloudWatch → Dashboards

### Update Deployment

After making changes:

```bash
npm run build
npm run deploy:dev
```

### Rollback if Needed

```bash
serverless deploy list --stage dev
serverless rollback --timestamp TIMESTAMP --stage dev
```

### Remove Deployment

To completely remove the stack:

```bash
serverless remove --stage dev
```

**Warning**: This will delete the DynamoDB table and all data!

---

## Troubleshooting

### Issue: "Cannot resolve module @aws-sdk/client-dynamodb"

**Solution:**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: "IAM permissions error"

**Solution:** Ensure your AWS user has these permissions:

- AWSLambda_FullAccess
- AmazonDynamoDBFullAccess
- AmazonAPIGatewayAdministrator
- IAMFullAccess (or specific role creation permissions)
- CloudFormation full access

### Issue: "Table already exists"

**Solution:** Either:

1. Remove existing deployment: `serverless remove --stage dev`
2. Or change table name in `serverless.yml`

### Issue: "CORS error from frontend"

**Solution:** Check `serverless.yml` CORS configuration:

```yaml
cors:
  origin: "*" # Change to your domain in production
  headers:
    - Content-Type
    - Authorization
```

### Issue: "Cold start latency"

**Solutions:**

- Enable Provisioned Concurrency for Lambda
- Use Lambda SnapStart (for Java, not Node.js yet)
- Implement warming strategy with CloudWatch Events

---

## Cost Estimation

### Development Environment

- DynamoDB: $0-5/month (on-demand)
- Lambda: Free tier covers most dev usage
- API Gateway: $0-1/month
- CloudWatch Logs: $0-1/month

**Total: ~$2-7/month**

### Production Environment (1000 users, 10k requests/day)

- DynamoDB: $5-10/month
- Lambda: $5-15/month
- API Gateway: $10-20/month
- Data Transfer: $2-5/month
- CloudWatch: $2-5/month

**Total: ~$24-55/month**

Scale pricing: Costs scale linearly with usage

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable CloudTrail for audit logging
- [ ] Set up AWS Config for compliance
- [ ] Enable GuardDuty for threat detection
- [ ] Restrict CORS to your domain only
- [ ] Enable API Gateway throttling
- [ ] Use AWS WAF for DDoS protection
- [ ] Enable MFA for AWS account
- [ ] Rotate access keys regularly
- [ ] Use AWS Secrets Manager for sensitive data

---

## Next Steps

1. **Integrate with Frontend**: Update API endpoints in React app
2. **Enable SMS**: Set up AWS SNS for real OTP delivery
3. **Custom Domain**: Set up Route 53 + API Gateway custom domain
4. **CI/CD**: Set up GitHub Actions or AWS CodePipeline
5. **Monitoring**: Configure CloudWatch dashboards and alarms
6. **Backup**: Enable automated DynamoDB backups
7. **Performance**: Consider DAX for DynamoDB caching
8. **Scale**: Monitor and adjust based on traffic

---

## Support Resources

- [Serverless Framework Docs](https://www.serverless.com/framework/docs)
- [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API Gateway Docs](https://docs.aws.amazon.com/apigateway/)

---

## Quick Commands Reference

```bash
# Deploy
npm run deploy:dev
npm run deploy:prod

# View logs
serverless logs -f functionName --tail

# Invoke function locally
serverless invoke local -f functionName

# Remove deployment
serverless remove --stage dev

# Check info
serverless info --stage dev

# View metrics
serverless metrics --stage dev
```
