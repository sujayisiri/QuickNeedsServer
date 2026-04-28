import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
export declare const createOrder: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const listOrders: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const getOrder: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const updateOrderStatus: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=orders.d.ts.map