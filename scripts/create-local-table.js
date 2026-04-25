/**
 * Script to create DynamoDB table in local DynamoDB instance
 * Prerequisites: DynamoDB Local running on port 8000
 * 
 * Run: node scripts/create-local-table.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  CreateTableCommand,
  DescribeTableCommand,
} = require('@aws-sdk/client-dynamodb');

// Configure for local DynamoDB
const client = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
  region: 'local',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local',
  },
});

const TABLE_NAME = 'quickneeds-dev';

async function createLocalTable() {
  console.log('🔧 Creating local DynamoDB table...');
  console.log('Table name:', TABLE_NAME);

  const createTableParams = {
    TableName: TABLE_NAME,
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
      { AttributeName: 'GSI2PK', AttributeType: 'S' },
      { AttributeName: 'GSI2SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
      {
        IndexName: 'GSI2',
        KeySchema: [
          { AttributeName: 'GSI2PK', KeyType: 'HASH' },
          { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  };

  try {
    // Check if table already exists
    try {
      const describeCommand = new DescribeTableCommand({ TableName: TABLE_NAME });
      await client.send(describeCommand);
      console.log('✅ Table already exists!');
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, continue with creation
    }

    // Create table
    const createCommand = new CreateTableCommand(createTableParams);
    await client.send(createCommand);

    console.log('✅ Local DynamoDB table created successfully!');
    console.log('');
    console.log('Table details:');
    console.log('- Name:', TABLE_NAME);
    console.log('- Primary Key: PK (HASH), SK (RANGE)');
    console.log('- GSI1: GSI1PK (HASH), GSI1SK (RANGE)');
    console.log('- GSI2: GSI2PK (HASH), GSI2SK (RANGE)');
    console.log('');
    console.log('You can now run: npm run local');
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('');
      console.error('💡 DynamoDB Local is not running!');
      console.error('Start it with: docker run -p 8000:8000 amazon/dynamodb-local');
    }
    
    process.exit(1);
  }
}

// Run the script
createLocalTable()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
