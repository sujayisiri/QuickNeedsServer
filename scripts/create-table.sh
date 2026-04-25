#!/bin/bash

# Script to create DynamoDB table manually using AWS CLI
# Run: bash scripts/create-table.sh

TABLE_NAME="quickneeds-dev"
REGION="us-east-1"

echo "Creating DynamoDB table: $TABLE_NAME in region: $REGION"

# Create table
aws dynamodb create-table \
  --table-name $TABLE_NAME \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"GSI1\",
        \"KeySchema\": [
          {\"AttributeName\": \"GSI1PK\", \"KeyType\": \"HASH\"},
          {\"AttributeName\": \"GSI1SK\", \"KeyType\": \"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"}
      },
      {
        \"IndexName\": \"GSI2\",
        \"KeySchema\": [
          {\"AttributeName\": \"GSI2PK\", \"KeyType\": \"HASH\"},
          {\"AttributeName\": \"GSI2SK\", \"KeyType\": \"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\": \"ALL\"}
      }
    ]" \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
  --region $REGION \
  --tags Key=Environment,Value=dev Key=Service,Value=quickneeds

echo "Waiting for table to become ACTIVE..."
aws dynamodb wait table-exists --table-name $TABLE_NAME --region $REGION

echo "✅ Table created successfully!"

# Enable Point-in-Time Recovery
echo "Enabling Point-in-Time Recovery..."
aws dynamodb update-continuous-backups \
  --table-name $TABLE_NAME \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region $REGION

# Enable TTL
echo "Enabling TTL on 'TTL' attribute..."
aws dynamodb update-time-to-live \
  --table-name $TABLE_NAME \
  --time-to-live-specification "Enabled=true, AttributeName=TTL" \
  --region $REGION

echo "✅ Table configuration complete!"
echo ""
echo "Table details:"
aws dynamodb describe-table --table-name $TABLE_NAME --region $REGION --query "Table.[TableName,TableStatus,ItemCount,TableSizeBytes]"
