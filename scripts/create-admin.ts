/**
 * Script to create an admin user
 * Run with: ts-node scripts/create-admin.ts <phoneNumber>
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE || "quickneeds-dev";

async function createAdmin(phoneNumber: string) {
  if (!phoneNumber || !/^\d{10}$/.test(phoneNumber)) {
    console.error(
      "❌ Invalid phone number. Please provide a 10-digit phone number.",
    );
    process.exit(1);
  }

  const now = new Date().toISOString();

  const adminUser = {
    PK: `USER#${phoneNumber}`,
    SK: "PROFILE",
    phoneNumber,
    name: "Admin User",
    role: "admin",
    createdAt: now,
    updatedAt: now,
  };

  try {
    const command = new PutCommand({
      TableName,
      Item: adminUser,
    });

    await dynamoDB.send(command);

    console.log("✅ Admin user created successfully!");
    console.log("Phone Number:", phoneNumber);
    console.log("Role: admin");
    console.log(
      "\nYou can now login with this phone number and use OTP to access admin features.",
    );
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
    process.exit(1);
  }
}

// Get phone number from command line
const phoneNumber = process.argv[2];

if (!phoneNumber) {
  console.error("Usage: ts-node scripts/create-admin.ts <phoneNumber>");
  console.error("Example: ts-node scripts/create-admin.ts 9876543210");
  process.exit(1);
}

createAdmin(phoneNumber)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
