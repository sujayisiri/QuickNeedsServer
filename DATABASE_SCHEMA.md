# QuickNeeds Database Schema Design

## Database: Amazon DynamoDB

### Why DynamoDB?

- **Serverless**: No server management, scales automatically
- **Fast**: Single-digit millisecond latency at any scale
- **Cost-effective**: Pay only for what you use (on-demand pricing)
- **Highly Available**: Built-in replication across multiple AZs
- **Perfect for Lambda**: Both are serverless, work seamlessly together

## Single Table Design

Using a single DynamoDB table with multiple entity types for optimal performance and cost efficiency.

### Table Name

`quickneeds-{stage}` (e.g., quickneeds-dev, quickneeds-prod)

### Primary Key Structure

- **PK** (Partition Key): Entity identifier
- **SK** (Sort Key): Entity type/relationship

### Global Secondary Indexes

#### GSI1 - User Orders & Product Categories

- **GSI1PK**: User phone number or product category
- **GSI1SK**: Order timestamp or product name

#### GSI2 - Order Status & Product Search

- **GSI2PK**: Order status or product category
- **GSI2SK**: Order creation date or product price

---

## Entity Patterns

### 1. Users

**Purpose**: Store user profile and authentication data

```
PK: USER#{phoneNumber}
SK: PROFILE
Attributes:
  - phoneNumber: string
  - name: string
  - role: "user" | "admin"
  - address: {
      flatNumber: string
      floorNumber: string
      blockNumber: string
      address: string
      landmark: string
    }
  - createdAt: ISO timestamp
  - updatedAt: ISO timestamp
  - lastLogin: ISO timestamp
```

**Access Patterns**:

- Get user by phone number: `PK = USER#{phoneNumber} AND SK = PROFILE`
- List all users: `Scan` (admin only, with pagination)

---

### 2. OTP Verification

**Purpose**: Store OTP codes for authentication (with TTL)

```
PK: OTP#{phoneNumber}
SK: VERIFICATION
Attributes:
  - phoneNumber: string
  - otp: string (hashed)
  - expiresAt: number (Unix timestamp)
  - attempts: number
  - verified: boolean
  - TTL: number (DynamoDB TTL, auto-delete after expiration)
```

**Access Patterns**:

- Get OTP for verification: `PK = OTP#{phoneNumber} AND SK = VERIFICATION`
- Auto-deletion via TTL after 10 minutes

---

### 3. Products

**Purpose**: Store product catalog

```
PK: PRODUCT#{productId}
SK: METADATA
Attributes:
  - productId: string (UUID)
  - name: string
  - price: number
  - category: string
  - unit: string
  - image: string
  - description: string
  - barcode: string (optional)
  - stock: number
  - active: boolean
  - createdAt: ISO timestamp
  - updatedAt: ISO timestamp
  - createdBy: string (admin phone number)

GSI1PK: CATEGORY#{category}
GSI1SK: PRODUCT#{name}

GSI2PK: ACTIVE#{active}
GSI2SK: PRICE#{price}
```

**Access Patterns**:

- Get product by ID: `PK = PRODUCT#{productId} AND SK = METADATA`
- List all products: `Query` with `PK begins_with PRODUCT#`
- Get products by category: `GSI1PK = CATEGORY#{category}`
- Search products by price range: `GSI2PK = ACTIVE#true AND GSI2SK between`
- Get product by barcode: Use GSI3 or Scan with filter

---

### 4. Orders

**Purpose**: Store order headers

```
PK: ORDER#{orderId}
SK: METADATA
Attributes:
  - orderId: string (UUID)
  - orderedBy: string (phone number)
  - status: "pending" | "accepted" | "delivered" | "cancelled"
  - total: number
  - itemCount: number
  - deliveryAddress: object
  - createdAt: ISO timestamp
  - updatedAt: ISO timestamp
  - acceptedAt: ISO timestamp (optional)
  - deliveredAt: ISO timestamp (optional)

GSI1PK: USER#{phoneNumber}
GSI1SK: ORDER#{createdAt}

GSI2PK: STATUS#{status}
GSI2SK: ORDER#{createdAt}
```

**Access Patterns**:

- Get order by ID: `PK = ORDER#{orderId} AND SK = METADATA`
- Get user's orders: `GSI1PK = USER#{phoneNumber}` (sorted by date)
- Get orders by status: `GSI2PK = STATUS#{status}` (for admin dashboard)
- Get all orders: `Query` with `PK begins_with ORDER#` and `SK = METADATA`

---

### 5. Order Items

**Purpose**: Store individual items in an order

```
PK: ORDER#{orderId}
SK: ITEM#{productId}
Attributes:
  - orderId: string
  - productId: string
  - productName: string
  - productImage: string
  - price: number
  - quantity: number
  - unit: string
  - subtotal: number
```

**Access Patterns**:

- Get all items for an order: `PK = ORDER#{orderId} AND SK begins_with ITEM#`
- This design allows fetching order metadata and items in 2 queries

---

### 6. Device Tokens

**Purpose**: Store device tokens for push notifications

```
PK: USER#{phoneNumber}
SK: DEVICE_TOKEN#{fcmToken}
Attributes:
  - phoneNumber: string
  - fcmToken: string
  - deviceType: "ios" | "android" | "unknown"
  - createdAt: ISO timestamp
  - updatedAt: ISO timestamp
```

**Access Patterns**:

- Get all device tokens for a user: `PK = USER#{phoneNumber} AND SK begins_with DEVICE_TOKEN#`
- Register new token: `PutItem` with `PK` and `SK`
- Remove token: `DeleteItem` by `PK` and `SK`

---

### 7. Sessions (Optional)

**Purpose**: Store user session tokens

```
PK: SESSION#{token}
SK: USER#{phoneNumber}
Attributes:
  - token: string (JWT)
  - phoneNumber: string
  - role: string
  - expiresAt: number
  - TTL: number (auto-delete after expiration)
```

---

## Query Examples

### Get User Profile

```javascript
{
  TableName: 'quickneeds-prod',
  Key: {
    PK: 'USER#9876543210',
    SK: 'PROFILE'
  }
}
```

### Get User's Orders (Sorted by Date)

```javascript
{
  TableName: 'quickneeds-prod',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :pk',
  ExpressionAttributeValues: {
    ':pk': 'USER#9876543210'
  },
  ScanIndexForward: false // Descending order (newest first)
}
```

### Get Pending Orders (Admin)

```javascript
{
  TableName: 'quickneeds-prod',
  IndexName: 'GSI2',
  KeyConditionExpression: 'GSI2PK = :status',
  ExpressionAttributeValues: {
    ':status': 'STATUS#pending'
  },
  ScanIndexForward: false
}
```

### Get Products by Category

```javascript
{
  TableName: 'quickneeds-prod',
  IndexName: 'GSI1',
  KeyConditionExpression: 'GSI1PK = :category',
  ExpressionAttributeValues: {
    ':category': 'CATEGORY#Vegetables'
  }
}
```

### Get Order with Items (Batch Operation)

```javascript
// 1. Get order metadata
{
  TableName: 'quickneeds-prod',
  Key: { PK: 'ORDER#abc123', SK: 'METADATA' }
}

// 2. Get order items
{
  TableName: 'quickneeds-prod',
  KeyConditionExpression: 'PK = :orderId AND begins_with(SK, :itemPrefix)',
  ExpressionAttributeValues: {
    ':orderId': 'ORDER#abc123',
    ':itemPrefix': 'ITEM#'
  }
}
```

---

## Performance Optimizations

### 1. **Composite Keys**

Using composite keys (PK/SK) allows multiple entity types in one table while maintaining fast lookups.

### 2. **Global Secondary Indexes (GSIs)**

- GSI1: User-based queries (user orders, user products)
- GSI2: Status/category based queries (pending orders, product categories)
- Enables efficient filtering without scanning entire table

### 3. **Batch Operations**

- Use BatchGetItem for fetching multiple products at once
- Use BatchWriteItem for creating orders with multiple items

### 4. **Pagination**

- All list operations use pagination with LastEvaluatedKey
- Limit results to 20-50 items per page

### 5. **Caching Strategy**

- Cache product catalog in CloudFront/API Gateway
- Cache user profile data in application layer
- Use DynamoDB DAX (DynamoDB Accelerator) for sub-millisecond reads if needed

### 6. **TTL for Cleanup**

- OTP records auto-delete after 10 minutes
- Session tokens auto-delete after expiration
- Reduces storage costs and keeps table clean

---

## Cost Estimation

### On-Demand Pricing (Recommended for variable workloads)

- **Write**: $1.25 per million write request units
- **Read**: $0.25 per million read request units
- **Storage**: $0.25 per GB-month

### Example Monthly Cost (Assuming):

- 100,000 orders/month
- 1 million product views
- 500,000 user actions

**Estimated Cost**: ~$5-10/month

For production with high traffic, consider **Provisioned Capacity** with **Auto-Scaling** for cost optimization.

---

## Backup & Recovery

### Point-in-Time Recovery (PITR)

- Enabled by default in serverless.yml
- Allows restore to any point in last 35 days
- No performance impact

### On-Demand Backups

- Manual backups for compliance/archival
- Stored in S3
- Can be restored to new table

---

## Migration & Seeding

### Initial Data Load

1. Create products from existing data/products.ts
2. Create admin user
3. Optional: Import historical data

### Future Migrations

- Use DynamoDB Streams + Lambda for data transformation
- No downtime migrations possible with single-table design

---

## Security

### Encryption

- **At Rest**: Enabled by default (AWS KMS)
- **In Transit**: SSL/TLS for all connections

### Access Control

- Lambda functions use IAM roles with least privilege
- Row-level security via application logic
- No direct database access from frontend

### Audit Trail

- DynamoDB Streams enabled for audit logging
- CloudWatch logs for all API calls
- Can trigger Lambda for real-time monitoring

---

## Scalability

### Horizontal Scaling

- DynamoDB automatically partitions data
- Handles millions of requests per second
- No capacity planning needed with on-demand mode

### Regional Replication (Optional)

- Global Tables for multi-region setup
- Disaster recovery
- Lower latency for global users
