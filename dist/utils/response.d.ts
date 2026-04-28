import { APIGatewayProxyResult } from "aws-lambda";
export declare const response: (statusCode: number, body: any, headers?: Record<string, string>) => APIGatewayProxyResult;
export declare const successResponse: (data: any, statusCode?: number) => APIGatewayProxyResult;
export declare const errorResponse: (message: string, statusCode?: number, error?: any) => APIGatewayProxyResult;
export declare const parseBody: <T>(body: string | null) => T | null;
export declare const generateId: () => string;
export declare const validateRequired: (data: any, fields: string[]) => string | null;
//# sourceMappingURL=response.d.ts.map