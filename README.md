# QuickNeeds Server

Backend API for QuickNeeds application built with AWS Lambda, API Gateway, and DynamoDB.

## Architecture

- **Runtime**: Node.js 20.x with TypeScript
- **Framework**: Serverless Framework
- **Database**: Amazon DynamoDB (Single-table design)
- **Authentication**: JWT with OTP verification
- **Deployment**: AWS Lambda + API Gateway

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- AWS Account
- AWS CLI configured with credentials
- Serverless Framework CLI

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your values
```

## Project Structure

```
QuickNeedsServer/
├── src/
│   ├── handlers/          # Lambda function handlers
│   │   ├── auth.ts        # Authentication (OTP)
│   │   ├── authorizer.ts  # JWT authorizer
│   │   ├── users.ts       # User profile management
│   │   ├── products.ts    # Product CRUD
│   │   └── orders.ts      # Order management
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   └── utils/             # Utility functions
│       ├── auth.ts        # JWT & OTP utilities
│       ├── dynamodb.ts    # DynamoDB helpers
│       └── response.ts    # Response formatters
├── serverless.yml         # Serverless configuration
├── tsconfig.json          # TypeScript configuration
├── package.json
└── DATABASE_SCHEMA.md     # Database design documentation
```

## Development

```bash
# Build TypeScript
npm run build

# Run locally (requires serverless-offline)
npm run local

# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## API Endpoints

### Authentication

#### Send OTP

```http
POST /auth/send-otp
Content-Type: application/json

{
  "phoneNumber": "9876543210"
}
```

#### Verify OTP & Login

```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "9876543210",
  "otp": "123456"
}
```

### User Profile

#### Get Profile

```http
GET /users/profile
Authorization: Bearer <token>
```

#### Update Profile

```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "address": {
    "flatNumber": "101",
    "floorNumber": "1",
    "blockNumber": "A",
    "address": "123 Main St",
    "landmark": "Near Park"
  }
}
```

### Products

#### List Products

```http
GET /products?category=Vegetables&limit=20
```

#### Get Product

```http
GET /products/{productId}
```

#### Create Product (Admin)

```http
POST /products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Tomato",
  "price": 30,
  "category": "Vegetables",
  "unit": "kg",
  "image": "🍅",
  "description": "Fresh red tomatoes",
  "barcode": "123456789",
  "stock": 100
}
```

#### Update Product (Admin)

```http
PUT /products/{productId}
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "price": 35,
  "stock": 150
}
```

#### Delete Product (Admin)

```http
DELETE /products/{productId}
Authorization: Bearer <admin-token>
```

### Orders

#### Create Order

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "uuid",
      "productName": "Tomato",
      "productImage": "🍅",
      "price": 30,
      "quantity": 2,
      "unit": "kg"
    }
  ],
  "deliveryAddress": {
    "flatNumber": "101",
    "address": "123 Main St"
  }
}
```

#### List Orders

```http
# User sees their orders
GET /orders?limit=20
Authorization: Bearer <token>

# Admin sees all orders, can filter by status
GET /orders?status=pending&limit=50
Authorization: Bearer <admin-token>
```

#### Get Order

```http
GET /orders/{orderId}
Authorization: Bearer <token>
```

#### Update Order Status (Admin)

```http
PUT /orders/{orderId}/status
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "status": "accepted"
}
```

## Environment Variables

| Variable       | Description         | Default        |
| -------------- | ------------------- | -------------- |
| STAGE          | Deployment stage    | dev            |
| DYNAMODB_TABLE | DynamoDB table name | quickneeds-dev |
| JWT_SECRET     | Secret key for JWT  | (required)     |
| SNS_REGION     | AWS region for SNS  | us-east-1      |

## Database

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete database design documentation.

### Key Features

- **Single-table design** for optimal performance
- **Global Secondary Indexes** for efficient querying
- **TTL enabled** for automatic cleanup of OTP records
- **Point-in-time recovery** enabled for data safety
- **On-demand billing** for cost optimization

## Security

### Authentication Flow

1. User requests OTP via phone number
2. OTP sent via SMS (SNS) and stored in DynamoDB (hashed)
3. User submits OTP for verification
4. Server validates OTP and returns JWT token
5. JWT token used for subsequent authenticated requests

### Authorization

- JWT tokens expire after 7 days
- Admin-only endpoints check role in JWT payload
- API Gateway custom authorizer validates all protected routes

### Best Practices

- All passwords/OTPs are hashed with bcrypt
- JWT secret should be stored in AWS Secrets Manager (production)
- HTTPS/TLS enforced for all API calls
- CORS configured for frontend domain only (production)

## Deployment

### First-time Setup

1. **Configure AWS credentials:**

```bash
aws configure
```

2. **Set JWT secret as environment variable:**

```bash
export JWT_SECRET="your-production-secret-key"
```

3. **Deploy to AWS:**

```bash
npm run deploy:prod
```

4. **Note the API endpoint URL from deployment output**

### Updating

```bash
# Make your changes
npm run build

# Deploy
npm run deploy:prod
```

### Rollback

```bash
serverless rollback --stage prod --timestamp <timestamp>
```

## Monitoring

### CloudWatch Logs

All Lambda functions log to CloudWatch:

```bash
serverless logs -f sendOtp --stage prod --tail
```

### Metrics

Monitor in AWS Console:

- Lambda invocations, duration, errors
- API Gateway requests, latency, 4xx/5xx errors
- DynamoDB read/write capacity, throttles

### Alarms (Setup Recommended)

- Lambda errors > threshold
- API Gateway 5xx errors
- DynamoDB throttling events

## Cost Optimization

1. **DynamoDB On-Demand**: Pay only for requests
2. **Lambda**: 1M free requests/month
3. **API Gateway**: $3.50 per million requests
4. **Estimated monthly cost**: $5-20 for moderate traffic

### Optimization Tips

- Use DynamoDB batch operations
- Enable API Gateway caching for product listings
- Consider Reserved Capacity for predictable workloads

## Testing

### Local Testing

```bash
# Start local API
npm run local

# Test endpoint
curl -X POST http://localhost:3000/dev/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"9876543210"}'
```

### Integration Tests

(TODO: Add Jest tests)

## Troubleshooting

### Common Issues

**Issue**: Deployment fails with "Cannot find module"
**Solution**: Run `npm run build` before deploying

**Issue**: DynamoDB access denied
**Solution**: Check IAM role has required permissions in serverless.yml

**Issue**: CORS errors in frontend
**Solution**: Verify API Gateway CORS configuration in serverless.yml

## Future Enhancements

- [ ] Add SNS integration for real OTP SMS
- [ ] Implement email notifications
- [ ] Add product image upload to S3
- [ ] Implement search functionality with Elasticsearch
- [ ] Add caching layer (ElastiCache/DAX)
- [ ] Implement rate limiting
- [ ] Add comprehensive unit tests
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring dashboards
- [ ] Implement GraphQL API (optional)

## Support

For issues or questions, please open a GitHub issue.

## License

MIT
