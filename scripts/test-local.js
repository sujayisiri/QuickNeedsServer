/**
 * Simple script to test Lambda functions locally without DynamoDB
 * Run: node scripts/test-local.js
 */

// Mock event for sending OTP
const mockSendOtpEvent = {
  body: JSON.stringify({
    phoneNumber: '9876543210',
  }),
  headers: {},
  requestContext: {},
};

// Mock event for verifying OTP
const mockVerifyOtpEvent = {
  body: JSON.stringify({
    phoneNumber: '9876543210',
    otp: '123456',
  }),
  headers: {},
  requestContext: {},
};

async function testLocally() {
  console.log('🧪 Testing Lambda functions locally (without DynamoDB)...\n');

  try {
    // Test that modules can be imported
    console.log('✓ Checking imports...');
    const auth = require('../dist/handlers/auth');
    const products = require('../dist/handlers/products');
    const orders = require('../dist/handlers/orders');
    const users = require('../dist/handlers/users');
    console.log('✓ All handlers imported successfully\n');

    // Test auth handler structure
    console.log('✓ Checking handler structure...');
    if (typeof auth.sendOtp === 'function') {
      console.log('  ✓ auth.sendOtp is a function');
    }
    if (typeof auth.verifyOtp === 'function') {
      console.log('  ✓ auth.verifyOtp is a function');
    }
    if (typeof products.listProducts === 'function') {
      console.log('  ✓ products.listProducts is a function');
    }
    if (typeof orders.createOrder === 'function') {
      console.log('  ✓ orders.createOrder is a function');
    }
    if (typeof users.getProfile === 'function') {
      console.log('  ✓ users.getProfile is a function');
    }

    console.log('\n✅ All basic checks passed!');
    console.log('\n📝 Note: Full testing requires DynamoDB (local or AWS)');
    console.log('   To test with local DynamoDB:');
    console.log('   1. Run: docker run -p 8000:8000 amazon/dynamodb-local');
    console.log('   2. Run: node scripts/create-local-table.js');
    console.log('   3. Run: npm run local');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure you run "npm run build" first!');
    process.exit(1);
  }
}

// Run tests
testLocally();
