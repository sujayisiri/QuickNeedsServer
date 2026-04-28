import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
/**
 * Register device token for push notifications
 * POST /notifications/register-token
 */
export declare const registerToken: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * Send push notification
 * POST /notifications/send
 * Admin only - for internal use
 */
export declare const sendNotification: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
/**
 * Helper function: Get all device tokens for a user
 */
export declare const getUserDeviceTokens: (phoneNumber: string) => Promise<string[]>;
/**
 * Helper function: Get all admin device tokens
 */
export declare const getAdminDeviceTokens: () => Promise<string[]>;
/**
 * Helper function: Send notification to user
 * Used internally by other handlers
 */
export declare const notifyUser: (phoneNumber: string, title: string, body: string, data?: Record<string, string>) => Promise<void>;
/**
 * Helper function: Send notification to all admins
 * Used internally by other handlers
 */
export declare const notifyAdmins: (title: string, body: string, data?: Record<string, string>) => Promise<void>;
//# sourceMappingURL=notifications.d.ts.map