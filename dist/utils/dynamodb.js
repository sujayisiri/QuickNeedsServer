"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbBatchWrite = exports.dbScan = exports.dbDelete = exports.dbUpdate = exports.dbQuery = exports.dbGet = exports.dbPut = exports.TableName = exports.dynamoDB = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Configure DynamoDB client (supports local and AWS)
const clientConfig = {
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
const client = new client_dynamodb_1.DynamoDBClient(clientConfig);
exports.dynamoDB = lib_dynamodb_1.DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
    },
});
exports.TableName = process.env.DYNAMODB_TABLE || "quickneeds-dev";
// Helper functions for common DynamoDB operations
const dbPut = async (item) => {
    const command = new lib_dynamodb_1.PutCommand({
        TableName: exports.TableName,
        Item: item,
    });
    return exports.dynamoDB.send(command);
};
exports.dbPut = dbPut;
const dbGet = async (key) => {
    const command = new lib_dynamodb_1.GetCommand({
        TableName: exports.TableName,
        Key: key,
    });
    const result = await exports.dynamoDB.send(command);
    return result.Item;
};
exports.dbGet = dbGet;
const dbQuery = async (params) => {
    const command = new lib_dynamodb_1.QueryCommand({
        TableName: exports.TableName,
        ...params,
    });
    return exports.dynamoDB.send(command);
};
exports.dbQuery = dbQuery;
const dbUpdate = async (params) => {
    const command = new lib_dynamodb_1.UpdateCommand({
        TableName: exports.TableName,
        ...params,
    });
    return exports.dynamoDB.send(command);
};
exports.dbUpdate = dbUpdate;
const dbDelete = async (key) => {
    const command = new lib_dynamodb_1.DeleteCommand({
        TableName: exports.TableName,
        Key: key,
    });
    return exports.dynamoDB.send(command);
};
exports.dbDelete = dbDelete;
const dbScan = async (params) => {
    const command = new lib_dynamodb_1.ScanCommand({
        TableName: exports.TableName,
        ...params,
    });
    return exports.dynamoDB.send(command);
};
exports.dbScan = dbScan;
const dbBatchWrite = async (items) => {
    const command = new lib_dynamodb_1.BatchWriteCommand({
        RequestItems: {
            [exports.TableName]: items,
        },
    });
    return exports.dynamoDB.send(command);
};
exports.dbBatchWrite = dbBatchWrite;
//# sourceMappingURL=dynamodb.js.map