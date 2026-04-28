import { ReturnValue } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
export declare const dynamoDB: DynamoDBDocumentClient;
export declare const TableName: string;
export declare const dbPut: (item: any) => Promise<import("@aws-sdk/lib-dynamodb").PutCommandOutput>;
export declare const dbGet: (key: {
    PK: string;
    SK: string;
}) => Promise<Record<string, any> | undefined>;
export declare const dbQuery: (params: {
    KeyConditionExpression: string;
    ExpressionAttributeValues: any;
    IndexName?: string;
    ScanIndexForward?: boolean;
    Limit?: number;
    ExclusiveStartKey?: any;
}) => Promise<import("@aws-sdk/lib-dynamodb").QueryCommandOutput>;
export declare const dbUpdate: (params: {
    Key: {
        PK: string;
        SK: string;
    };
    UpdateExpression: string;
    ExpressionAttributeValues: any;
    ExpressionAttributeNames?: any;
    ReturnValues?: ReturnValue;
}) => Promise<import("@aws-sdk/lib-dynamodb").UpdateCommandOutput>;
export declare const dbDelete: (key: {
    PK: string;
    SK: string;
}) => Promise<import("@aws-sdk/lib-dynamodb").DeleteCommandOutput>;
export declare const dbScan: (params?: {
    FilterExpression?: string;
    ExpressionAttributeValues?: any;
    Limit?: number;
    ExclusiveStartKey?: any;
}) => Promise<import("@aws-sdk/lib-dynamodb").ScanCommandOutput>;
export declare const dbBatchWrite: (items: any[]) => Promise<import("@aws-sdk/lib-dynamodb").BatchWriteCommandOutput>;
//# sourceMappingURL=dynamodb.d.ts.map