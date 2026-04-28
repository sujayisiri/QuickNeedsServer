# Backend Push Notifications Setup

## Overview

Push notifications have been integrated into the backend using Firebase Cloud Messaging (FCM).

## Changes Made

### 1. **Installed Dependencies**

- `firebase-admin` - Firebase Admin SDK for sending push notifications

### 2. **New Files Created**

#### `src/utils/firebase.ts`

- Initializes Firebase Admin SDK
- Provides functions for sending push notifications:
  - `sendPushNotification()` - Send to single device
  - `sendPushNotificationToMultipleDevices()` - Send to multiple devices

#### `src/handlers/notifications.ts`

- `registerToken` - Register device FCM token
- `sendNotification` - Send push notification (admin only)
- `getUserDeviceTokens()` - Helper to get user's tokens
- `getAdminDeviceTokens()` - Helper to get all admin tokens
- `notifyUser()` - Send notification to specific user
- `notifyAdmins()` - Send notification to all admins

### 3. **Updated Files**

#### `src/handlers/orders.ts`

- Added notification when order is created (notifies admins)
- Added notifications when order status changes (notifies user):
  - Order accepted
  - Order delivered
  - Order cancelled

#### `serverless.yml`

- Added notification endpoints
- Added Firebase environment variable
- New endpoints:
  - `POST /notifications/register-token`
  - `POST /notifications/send`

#### `DATABASE_SCHEMA.md`

- Added Device Tokens entity pattern

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Project name: `QuickNeeds` (or your choice)

### Step 2: Add iOS App

1. In Firebase Console, click "Add app" → iOS
2. Bundle ID: `com.quickneeds.app`
3. Download `GoogleService-Info.plist`
4. Add to iOS project: `ios/App/App/GoogleService-Info.plist`

### Step 3: Configure APNs (Apple Push Notifications)

1. Go to Apple Developer Portal → Keys
2. Create new key with APNs enabled
3. Download `.p8` file and note Key ID and Team ID
4. In Firebase Console:
   - Go to Project Settings → Cloud Messaging
   - Upload APNs Auth Key (.p8 file)
   - Enter Key ID and Team ID

### Step 4: Get Service Account Key

1. In Firebase Console:
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Download JSON file
2. **IMPORTANT**: Keep this file secure, never commit to git

### Step 5: Add Service Account to Environment

For **local development** (`.env` file):

```bash
# Minify JSON to single line (remove newlines and spaces)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"quickneeds-xxxx","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-xxxxx@quickneeds-xxxx.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

For **AWS Lambda** (Serverless deployment):

```bash
# Set as environment variable before deploying
export FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
serverless deploy
```

Or add to AWS Systems Manager Parameter Store and reference in serverless.yml:

```yaml
environment:
  FIREBASE_SERVICE_ACCOUNT_KEY: ${ssm:/quickneeds/firebase-key}
```

---

## Database Schema

Device tokens are stored with this pattern:

```
PK: USER#{phoneNumber}
SK: DEVICE_TOKEN#{fcmToken}

Attributes:
  - phoneNumber: string
  - fcmToken: string
  - deviceType: "ios" | "android"
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

## API Endpoints

### 1. Register Device Token

**POST** `/notifications/register-token`

Register user's device token for push notifications.

**Headers:**

```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Request:**

```json
{
  "token": "fcm_device_token_here",
  "deviceType": "ios"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Device token registered successfully"
}
```

### 2. Send Notification (Admin Only)

**POST** `/notifications/send`

Send push notification to a user. Admin only.

**Headers:**

```
Authorization: Bearer {admin_jwt_token}
Content-Type: application/json
```

**Request:**

```json
{
  "phoneNumber": "+1234567890",
  "title": "Test Notification",
  "body": "This is a test message",
  "data": {
    "orderId": "some-id",
    "type": "custom"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Notification sent successfully",
  "messageId": "firebase-message-id"
}
```

---

## Notification Triggers

### 1. **New Order Created**

- **Trigger**: User creates an order
- **Recipients**: All admins
- **Title**: "New Order Received"
- **Body**: "Order #xxxx - ₹xxx (x items)"
- **Data**: `{ orderId, type: "new_order", total }`

### 2. **Order Accepted**

- **Trigger**: Admin accepts order
- **Recipients**: User who placed the order
- **Title**: "Order Accepted"
- **Body**: "Your order #xxxx has been accepted and is being prepared"
- **Data**: `{ orderId, type: "order_accepted", status }`

### 3. **Order Delivered**

- **Trigger**: Admin marks order as delivered
- **Recipients**: User who placed the order
- **Title**: "Order Delivered"
- **Body**: "Your order #xxxx has been delivered"
- **Data**: `{ orderId, type: "order_delivered", status }`

### 4. **Order Cancelled**

- **Trigger**: Admin cancels order
- **Recipients**: User who placed the order
- **Title**: "Order Cancelled"
- **Body**: "Your order #xxxx has been cancelled"
- **Data**: `{ orderId, type: "order_cancelled", status }`

---

## Testing

### Local Testing

1. Start local server:

```bash
npm run local
```

2. Register a device token (use token from mobile app logs):

```bash
curl -X POST http://localhost:3000/dev/notifications/register-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "device_fcm_token_from_mobile_app",
    "deviceType": "ios"
  }'
```

3. Test sending notification (admin only):

```bash
curl -X POST http://localhost:3000/dev/notifications/send \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### Production Testing

1. Deploy to AWS:

```bash
serverless deploy --stage prod
```

2. Test via deployed API endpoints
3. Create test order and verify admins receive notifications
4. Update order status and verify user receives notifications

---

## Troubleshooting

### Firebase Not Initialized

**Error**: "Firebase not initialized"

**Solution**: Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable is set correctly.

### Invalid Service Account Key

**Error**: "Failed to initialize Firebase Admin SDK"

**Solution**:

- Verify JSON is valid and minified to single line
- Escape special characters in private key
- Ensure no extra quotes or spaces

### Notifications Not Received

**Possible causes**:

1. Device token not registered
2. Token expired or invalid
3. APNs not configured in Firebase
4. App not have notification permissions
5. iOS Simulator (doesn't support push notifications)

**Debug steps**:

1. Check CloudWatch logs for errors
2. Verify token is stored in DynamoDB
3. Test with Firebase Console's notification composer
4. Check device has notification permissions enabled

### Multiple Admins Not Receiving Notifications

**Solution**:

- Check GSI1 index exists with `ROLE#admin` pattern
- Verify all admin users have role set to "admin"
- Check admin device tokens are registered

---

## Security Considerations

1. **Service Account Key**: Never commit to version control
2. **Token Storage**: Tokens stored encrypted in DynamoDB
3. **Authorization**: Only authenticated users can register tokens
4. **Admin Only**: Direct notification sending requires admin role
5. **Rate Limiting**: Consider adding rate limits to prevent abuse
6. **Token Cleanup**: Implement periodic cleanup of expired tokens

---

## Future Enhancements

1. **Token Expiration**: Add TTL to device tokens
2. **Notification History**: Store sent notifications for audit
3. **Batch Notifications**: Optimize for large admin groups
4. **Rich Notifications**: Add images and action buttons
5. **Scheduled Notifications**: For offers and reminders
6. **User Preferences**: Allow users to customize notification settings
7. **Analytics**: Track notification delivery and open rates

---

## Cost Considerations

- **Firebase**: Free tier includes 10M messages/month
- **DynamoDB**: Pay per read/write (device token storage)
- **Lambda**: Pay per invocation (notification sending)

Estimated cost for 1000 orders/month: **< $1**

---

## Support

For issues or questions:

1. Check CloudWatch logs for errors
2. Verify Firebase configuration
3. Test with Firebase Console first
4. Check mobile app logs for token registration
