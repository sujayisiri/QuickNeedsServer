# QuickNeeds Backend - Setup Complete! 🎉

## What's Been Created

Your serverless backend for QuickNeeds is now ready for deployment on AWS Lambda!

### 📁 Project Structure

```
QuickNeedsServer/
├── src/
│   ├── handlers/              # Lambda function handlers
│   │   ├── auth.ts           # OTP-based authentication
│   │   ├── authorizer.ts     # JWT token validator
│   │   ├── users.ts          # User profile management
│   │   ├── products.ts       # Product CRUD operations
│   │   └── orders.ts         # Order management
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       ├── auth.ts           # JWT & OTP utilities
│       ├── dynamodb.ts       # Database helpers
│       ├── response.ts       # API response formatters
│       └── sms.ts            # SMS/SNS integration
├── scripts/
│   ├── seed-products.ts      # Seed initial products
│   └── create-admin.ts       # Create admin users
├── serverless.yml            # AWS infrastructure config
├── DATABASE_SCHEMA.md        # Complete DB design
├── DEPLOYMENT.md             # Deployment guide
├── README.md                 # API documentation
└── package.json              # Dependencies
```

## 🏗️ Architecture

**Technology Stack:**

- **Runtime**: Node.js 20.x with TypeScript
- **Framework**: Serverless Framework
- **Database**: Amazon DynamoDB (Single-table design)
- **API**: AWS API Gateway
- **Compute**: AWS Lambda Functions
- **Auth**: JWT with OTP verification
- **SMS**: AWS SNS (ready to integrate)

**Key Features:**

- ✅ Serverless & Auto-scaling
- ✅ Pay-per-use pricing model
- ✅ Sub-second response times
- ✅ Role-based access control (User/Admin)
- ✅ Secure JWT authentication
- ✅ RESTful API design
- ✅ Production-ready error handling

## 📊 Database Design

**DynamoDB Single-Table Design** with:

- **Entities**: Users, Products, Orders, Order Items, OTP Records
- **Access Patterns**: Optimized with 2 Global Secondary Indexes
- **Performance**: Designed for millisecond latency
- **Cost**: On-demand pricing (~$5-10/month for moderate traffic)

See [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for complete schema documentation.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd QuickNeedsServer
npm install
```

### 2. Configure AWS

```bash
# Install AWS CLI if not already installed
# macOS: brew install awscli
# Others: https://aws.amazon.com/cli/

# Configure with your credentials
aws configure
```

### 3. Set Environment Variables

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET to a secure random string
```

### 4. Deploy to AWS

```bash
# Deploy to development
npm run deploy:dev
```

**After deployment, you'll get an API URL like:**

```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev
```

### 5. Create Admin User

```bash
# Method 1: Using script
export DYNAMODB_TABLE=quickneeds-dev
npm run create:admin 9999999999

# Method 2: Using AWS CLI (see DEPLOYMENT.md)
```

### 6. Seed Products (Optional)

```bash
export DYNAMODB_TABLE=quickneeds-dev
npm run seed:products
```

### 7. Update Frontend

Update your React app's API configuration:

```typescript
// In your QuickNeeds frontend
const API_BASE_URL = "https://YOUR-API-URL/dev";

// Update all API calls to use this base URL
```

## 📝 API Endpoints

### Authentication

- `POST /auth/send-otp` - Send OTP to phone
- `POST /auth/verify-otp` - Verify OTP and login

### Users

- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Products

- `GET /products` - List all products
- `GET /products/{id}` - Get product details
- `POST /products` - Create product (Admin)
- `PUT /products/{id}` - Update product (Admin)
- `DELETE /products/{id}` - Delete product (Admin)

### Orders

- `POST /orders` - Create order
- `GET /orders` - List orders
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/status` - Update order status (Admin)

See [README.md](README.md) for complete API documentation with examples.

## 🔧 Development Workflow

### Local Development

```bash
# Start local API (requires serverless-offline)
npm run local

# Test locally
curl http://localhost:3000/dev/products
```

### Deployment

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

### Monitoring

```bash
# View function logs
serverless logs -f sendOtp --stage dev --tail

# View all logs
serverless logs --stage dev --tail
```

## 🔐 Security Features

- **OTP Authentication**: Secure phone-based login
- **JWT Tokens**: Stateless authentication with 7-day expiry
- **Password Hashing**: BCrypt for OTP storage
- **IAM Roles**: Least-privilege access for Lambda functions
- **CORS**: Configurable for your frontend domain
- **Encryption**: At-rest (DynamoDB) and in-transit (HTTPS)

## 💰 Estimated Costs

### Development

- **~$2-7/month** for light testing

### Production (1000 active users)

- DynamoDB: $5-10/month
- Lambda: $5-15/month
- API Gateway: $10-20/month
- **Total: ~$24-55/month**

Costs scale linearly with usage. Free tier covers initial development.

## 📚 Next Steps

### Immediate

1. ✅ Deploy to AWS Dev environment
2. ✅ Create admin user
3. ✅ Test all API endpoints
4. ✅ Update frontend to use new API

### Short-term

1. **Enable SMS**: Integrate AWS SNS for real OTP delivery
2. **Custom Domain**: Set up custom API domain
3. **Monitoring**: Configure CloudWatch alarms
4. **Testing**: Add unit and integration tests

### Long-term

1. **CI/CD**: Automate deployments with GitHub Actions
2. **Caching**: Add CloudFront/API Gateway caching
3. **Search**: Implement product search with Elasticsearch
4. **Analytics**: Track usage with CloudWatch Insights
5. **Scale**: Add DAX for DynamoDB caching if needed

## 🐛 Troubleshooting

**"Module not found" errors:**

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**"Permission denied" on AWS:**

- Check IAM permissions (Lambda, DynamoDB, API Gateway)
- Ensure AWS CLI is configured correctly

**CORS errors:**

- Update `serverless.yml` CORS configuration
- Add your frontend domain to allowed origins

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete troubleshooting guide.

## 📖 Documentation

- [README.md](README.md) - API documentation & usage
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database design
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [.env.example](.env.example) - Environment variables

## 🔄 Integration with Frontend

Update these files in your React app:

### 1. Create API Service

```typescript
// src/services/api.ts
const API_BASE_URL = "https://YOUR-API-URL/dev";

export const sendOTP = async (phoneNumber: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
  return response.json();
};

export const verifyOTP = async (phoneNumber: string, otp: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, otp }),
  });
  return response.json();
};

// Add more API calls...
```

### 2. Update Auth Context

Replace mock authentication with real API calls in `AuthContext.tsx`

### 3. Update Product Context

Replace in-memory products with API calls in `ProductsContext.tsx`

### 4. Update Orders Context

Replace in-memory orders with API calls in `OrdersContext.tsx`

## 🎯 Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] AWS CLI configured
- [ ] Deployed to AWS (`npm run deploy:dev`)
- [ ] Admin user created
- [ ] Tested authentication endpoint
- [ ] Tested products endpoint
- [ ] Frontend API URL updated
- [ ] End-to-end flow tested

## 💡 Tips

1. **Start with Dev**: Always test in dev environment first
2. **Monitor Costs**: Set up AWS billing alerts
3. **Version Control**: Commit your code to Git
4. **Backup Data**: Enable DynamoDB point-in-time recovery
5. **Security**: Never commit `.env` or AWS credentials
6. **Testing**: Test with Postman/Insomnia before frontend integration

## 🆘 Need Help?

- Check [README.md](README.md) for API documentation
- Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
- Check [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) for data structure
- AWS Documentation: https://docs.aws.amazon.com/
- Serverless Framework: https://www.serverless.com/framework/docs

## 🎉 You're All Set!

Your backend is ready to power the QuickNeeds application. Deploy, test, and integrate with your frontend to bring your grocery delivery app to life!

**Happy Coding! 🚀**
