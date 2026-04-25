/**
 * Script to seed initial products into DynamoDB
 * Run with: ts-node scripts/seed-products.ts
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE || "quickneeds-dev";

const products = [
  // Vegetables
  {
    name: "Tomato",
    price: 30,
    category: "Vegetables",
    unit: "kg",
    image: "🍅",
    description: "Fresh red tomatoes",
    stock: 100,
  },
  {
    name: "Onion",
    price: 25,
    category: "Vegetables",
    unit: "kg",
    image: "🧅",
    description: "Fresh onions",
    stock: 150,
  },
  {
    name: "Potato",
    price: 20,
    category: "Vegetables",
    unit: "kg",
    image: "🥔",
    description: "Farm fresh potatoes",
    stock: 200,
  },
  {
    name: "Carrot",
    price: 40,
    category: "Vegetables",
    unit: "kg",
    image: "🥕",
    description: "Crunchy carrots",
    stock: 80,
  },
  {
    name: "Broccoli",
    price: 60,
    category: "Vegetables",
    unit: "kg",
    image: "🥦",
    description: "Fresh green broccoli",
    stock: 50,
  },
  {
    name: "Bell Pepper",
    price: 50,
    category: "Vegetables",
    unit: "kg",
    image: "🫑",
    description: "Colorful bell peppers",
    stock: 60,
  },

  // Fruits
  {
    name: "Apple",
    price: 120,
    category: "Fruits",
    unit: "kg",
    image: "🍎",
    description: "Crispy red apples",
    stock: 100,
  },
  {
    name: "Banana",
    price: 40,
    category: "Fruits",
    unit: "dozen",
    image: "🍌",
    description: "Ripe bananas",
    stock: 80,
  },
  {
    name: "Orange",
    price: 80,
    category: "Fruits",
    unit: "kg",
    image: "🍊",
    description: "Juicy oranges",
    stock: 90,
  },
  {
    name: "Mango",
    price: 150,
    category: "Fruits",
    unit: "kg",
    image: "🥭",
    description: "Sweet mangoes",
    stock: 70,
  },
  {
    name: "Grapes",
    price: 100,
    category: "Fruits",
    unit: "kg",
    image: "🍇",
    description: "Fresh grapes",
    stock: 60,
  },
  {
    name: "Watermelon",
    price: 30,
    category: "Fruits",
    unit: "kg",
    image: "🍉",
    description: "Sweet watermelon",
    stock: 50,
  },

  // Dairy & Groceries
  {
    name: "Rice",
    price: 50,
    category: "Groceries",
    unit: "kg",
    image: "🍚",
    description: "Premium basmati rice",
    stock: 200,
  },
  {
    name: "Wheat Flour",
    price: 40,
    category: "Groceries",
    unit: "kg",
    image: "🌾",
    description: "Whole wheat flour",
    stock: 150,
  },
  {
    name: "Milk",
    price: 60,
    category: "Dairy",
    unit: "l",
    image: "🥛",
    description: "Fresh milk",
    stock: 100,
  },
  {
    name: "Eggs",
    price: 70,
    category: "Dairy",
    unit: "dozen",
    image: "🥚",
    description: "Farm fresh eggs",
    stock: 120,
  },
  {
    name: "Bread",
    price: 40,
    category: "Bakery",
    unit: "pcs",
    image: "🍞",
    description: "Fresh bread",
    stock: 80,
  },
  {
    name: "Cheese",
    price: 200,
    category: "Dairy",
    unit: "kg",
    image: "🧀",
    description: "Premium cheese",
    stock: 40,
  },
];

async function seedProducts() {
  console.log("Starting to seed products...");
  console.log(`Target table: ${TableName}`);

  const now = new Date().toISOString();

  // Prepare items for batch write
  const items = products.map((product) => {
    const productId = uuidv4();
    return {
      PutRequest: {
        Item: {
          PK: `PRODUCT#${productId}`,
          SK: "METADATA",
          GSI1PK: `CATEGORY#${product.category}`,
          GSI1SK: `PRODUCT#${product.name}`,
          productId,
          name: product.name,
          price: product.price,
          category: product.category,
          unit: product.unit,
          image: product.image,
          description: product.description,
          stock: product.stock,
          active: true,
          createdAt: now,
          updatedAt: now,
          createdBy: "system",
        },
      },
    };
  });

  // DynamoDB batch write can handle max 25 items at once
  const batchSize = 25;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    try {
      const command = new BatchWriteCommand({
        RequestItems: {
          [TableName]: batch,
        },
      });

      await dynamoDB.send(command);
      console.log(
        `Batch ${Math.floor(i / batchSize) + 1} written successfully (${batch.length} items)`,
      );
    } catch (error) {
      console.error(
        `Error writing batch ${Math.floor(i / batchSize) + 1}:`,
        error,
      );
    }
  }

  console.log("✅ Products seeded successfully!");
  console.log(`Total products added: ${products.length}`);
}

// Run the seeding
seedProducts()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
