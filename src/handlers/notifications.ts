import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { dbPut, dbQuery } from "../utils/dynamodb";
import { successResponse, errorResponse, parseBody } from "../utils/response";
import {
  sendPushNotification,
  sendPushNotificationToMultipleDevices,
} from "../utils/firebase";

/**
 * Register device token for push notifications
 * POST /notifications/register-token
 */
export const registerToken = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const phoneNumber = event.requestContext.authorizer?.phoneNumber;

    if (!phoneNumber) {
      return errorResponse("Unauthorized", 401);
    }

    const body = parseBody<{
      token: string;
      deviceType?: string;
    }>(event.body);

    if (!body || !body.token) {
      return errorResponse("Token is required", 400);
    }

    const now = new Date().toISOString();

    // Store device token
    const deviceToken = {
      PK: `USER#${phoneNumber}`,
      SK: `DEVICE_TOKEN#${body.token}`,
      phoneNumber,
      fcmToken: body.token,
      deviceType: body.deviceType || "unknown",
      createdAt: now,
      updatedAt: now,
    };

    await dbPut(deviceToken);

    return successResponse({
      message: "Device token registered successfully",
    });
  } catch (error: any) {
    console.error("Error registering device token:", error);
    return errorResponse(error.message || "Failed to register device token");
  }
};

/**
 * Send push notification
 * POST /notifications/send
 * Admin only - for internal use
 */
export const sendNotification = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  try {
    const role = event.requestContext.authorizer?.role;

    // Only admins can send notifications directly via this endpoint
    if (role !== "admin") {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = parseBody<{
      phoneNumber?: string;
      fcmToken?: string;
      title: string;
      body: string;
      data?: Record<string, string>;
    }>(event.body);

    if (!body || !body.title || !body.body) {
      return errorResponse("Title and body are required", 400);
    }

    // If phoneNumber provided, get token from database
    let fcmToken = body.fcmToken;

    if (body.phoneNumber && !fcmToken) {
      const tokens = await getUserDeviceTokens(body.phoneNumber);
      if (tokens.length === 0) {
        return errorResponse("No device tokens found for user", 404);
      }
      fcmToken = tokens[0]; // Use first token
    }

    if (!fcmToken) {
      return errorResponse("Either phoneNumber or fcmToken is required", 400);
    }

    const result = await sendPushNotification(
      fcmToken,
      body.title,
      body.body,
      body.data || {},
    );

    if (result.success) {
      return successResponse({
        message: "Notification sent successfully",
        messageId: result.messageId,
      });
    } else {
      return errorResponse(result.error || "Failed to send notification");
    }
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return errorResponse(error.message || "Failed to send notification");
  }
};

/**
 * Helper function: Get all device tokens for a user
 */
export const getUserDeviceTokens = async (
  phoneNumber: string,
): Promise<string[]> => {
  try {
    const result = await dbQuery({
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${phoneNumber}`,
        ":sk": "DEVICE_TOKEN#",
      },
    });

    return result.Items?.map((item: any) => item.fcmToken) || [];
  } catch (error) {
    console.error("Error fetching user device tokens:", error);
    return [];
  }
};

/**
 * Helper function: Get all admin device tokens
 */
export const getAdminDeviceTokens = async (): Promise<string[]> => {
  try {
    // Query for all users with admin role
    const result = await dbQuery({
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :role",
      ExpressionAttributeValues: {
        ":role": "ROLE#admin",
      },
    });

    const adminPhoneNumbers =
      result.Items?.map((item: any) => item.phoneNumber) || [];

    // Get all device tokens for all admins
    const allTokens: string[] = [];
    for (const phoneNumber of adminPhoneNumbers) {
      const tokens = await getUserDeviceTokens(phoneNumber);
      allTokens.push(...tokens);
    }

    return allTokens;
  } catch (error) {
    console.error("Error fetching admin device tokens:", error);
    return [];
  }
};

/**
 * Helper function: Send notification to user
 * Used internally by other handlers
 */
export const notifyUser = async (
  phoneNumber: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> => {
  try {
    const tokens = await getUserDeviceTokens(phoneNumber);

    if (tokens.length === 0) {
      console.log(`No device tokens found for user: ${phoneNumber}`);
      return;
    }

    if (tokens.length === 1) {
      await sendPushNotification(tokens[0], title, body, data || {});
    } else {
      await sendPushNotificationToMultipleDevices(
        tokens,
        title,
        body,
        data || {},
      );
    }
  } catch (error) {
    console.error("Error notifying user:", error);
    // Don't throw - notifications are best effort
  }
};

/**
 * Helper function: Send notification to all admins
 * Used internally by other handlers
 */
export const notifyAdmins = async (
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> => {
  try {
    const tokens = await getAdminDeviceTokens();

    if (tokens.length === 0) {
      console.log("No admin device tokens found");
      return;
    }

    await sendPushNotificationToMultipleDevices(
      tokens,
      title,
      body,
      data || {},
    );
  } catch (error) {
    console.error("Error notifying admins:", error);
    // Don't throw - notifications are best effort
  }
};
