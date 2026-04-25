import { DynamoDBClient, ReturnValue } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Configure DynamoDB client (supports local and AWS)
const clientConfig: any = {
  region: process.env.AWS_REGION || "us-east-1",
};

// Use local DynamoDB if IS_OFFLINE is set (serverless-offline)
if (process.env.IS_OFFLINE === "true") {
  clientConfig.endpoint = "http://localhost:8000";
  clientConfig.credentials = {
    accessKeyId: "local",
    secretAccessKey: "local",
  };
  console.log("🔧 Using local DynamoDB at http://localhost:8000");
}

const client = new DynamoDBClient(clientConfig);

export const dynamoDB = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const TableName = process.env.DYNAMODB_TABLE || "quickneeds-dev";

// Helper functions for common DynamoDB operations
export const dbPut = async (item: any) => {
  const command = new PutCommand({
    TableName,
    Item: item,
  });
  return dynamoDB.send(command);
};

export const dbGet = async (key: { PK: string; SK: string }) => {
  const command = new GetCommand({
    TableName,
    Key: key,
  });
  const result = await dynamoDB.send(command);
  return result.Item;
};

export const dbQuery = async (params: {
  KeyConditionExpression: string;
  ExpressionAttributeValues: any;
  IndexName?: string;
  ScanIndexForward?: boolean;
  Limit?: number;
  ExclusiveStartKey?: any;
}) => {
  const command = new QueryCommand({
    TableName,
    ...params,
  });
  return dynamoDB.send(command);
};

export const dbUpdate = async (params: {
  Key: { PK: string; SK: string };
  UpdateExpression: string;
  ExpressionAttributeValues: any;
  ExpressionAttributeNames?: any;
  ReturnValues?: ReturnValue;
}) => {
  const command = new UpdateCommand({
    TableName,
    ...params,
  });
  return dynamoDB.send(command);
};

export const dbDelete = async (key: { PK: string; SK: string }) => {
  const command = new DeleteCommand({
    TableName,
    Key: key,
  });
  return dynamoDB.send(command);
};

export const dbScan = async (params?: {
  FilterExpression?: string;
  ExpressionAttributeValues?: any;
  Limit?: number;
  ExclusiveStartKey?: any;
}) => {
  const command = new ScanCommand({
    TableName,
    ...params,
  });
  return dynamoDB.send(command);
};

export const dbBatchWrite = async (items: any[]) => {
  const command = new BatchWriteCommand({
    RequestItems: {
      [TableName]: items,
    },
  });
  return dynamoDB.send(command);
};
