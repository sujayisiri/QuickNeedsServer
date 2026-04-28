"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyAdmins = exports.notifyUser = exports.getAdminDeviceTokens = exports.getUserDeviceTokens = exports.sendNotification = exports.registerToken = void 0;
const dynamodb_1 = require("../utils/dynamodb");
const response_1 = require("../utils/response");
const firebase_1 = require("../utils/firebase");
/**
 * Register device token for push notifications
 * POST /notifications/register-token
 */
const registerToken = async (event) => {
    try {
        const phoneNumber = event.requestContext.authorizer?.phoneNumber;
        if (!phoneNumber) {
            return (0, response_1.errorResponse)("Unauthorized", 401);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body || !body.token) {
            return (0, response_1.errorResponse)("Token is required", 400);
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
        await (0, dynamodb_1.dbPut)(deviceToken);
        return (0, response_1.successResponse)({
            message: "Device token registered successfully",
        });
    }
    catch (error) {
        console.error("Error registering device token:", error);
        return (0, response_1.errorResponse)(error.message || "Failed to register device token");
    }
};
exports.registerToken = registerToken;
/**
 * Send push notification
 * POST /notifications/send
 * Admin only - for internal use
 */
const sendNotification = async (event) => {
    try {
        const role = event.requestContext.authorizer?.role;
        // Only admins can send notifications directly via this endpoint
        if (role !== "admin") {
            return (0, response_1.errorResponse)("Forbidden: Admin access required", 403);
        }
        const body = (0, response_1.parseBody)(event.body);
        if (!body || !body.title || !body.body) {
            return (0, response_1.errorResponse)("Title and body are required", 400);
        }
        // If phoneNumber provided, get token from database
        let fcmToken = body.fcmToken;
        if (body.phoneNumber && !fcmToken) {
            const tokens = await (0, exports.getUserDeviceTokens)(body.phoneNumber);
            if (tokens.length === 0) {
                return (0, response_1.errorResponse)("No device tokens found for user", 404);
            }
            fcmToken = tokens[0]; // Use first token
        }
        if (!fcmToken) {
            return (0, response_1.errorResponse)("Either phoneNumber or fcmToken is required", 400);
        }
        const result = await (0, firebase_1.sendPushNotification)(fcmToken, body.title, body.body, body.data || {});
        if (result.success) {
            return (0, response_1.successResponse)({
                message: "Notification sent successfully",
                messageId: result.messageId,
            });
        }
        else {
            return (0, response_1.errorResponse)(result.error || "Failed to send notification");
        }
    }
    catch (error) {
        console.error("Error sending notification:", error);
        return (0, response_1.errorResponse)(error.message || "Failed to send notification");
    }
};
exports.sendNotification = sendNotification;
/**
 * Helper function: Get all device tokens for a user
 */
const getUserDeviceTokens = async (phoneNumber) => {
    try {
        const result = await (0, dynamodb_1.dbQuery)({
            KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
            ExpressionAttributeValues: {
                ":pk": `USER#${phoneNumber}`,
                ":sk": "DEVICE_TOKEN#",
            },
        });
        return result.Items?.map((item) => item.fcmToken) || [];
    }
    catch (error) {
        console.error("Error fetching user device tokens:", error);
        return [];
    }
};
exports.getUserDeviceTokens = getUserDeviceTokens;
/**
 * Helper function: Get all admin device tokens
 */
const getAdminDeviceTokens = async () => {
    try {
        // Query for all users with admin role
        const result = await (0, dynamodb_1.dbQuery)({
            IndexName: "GSI1",
            KeyConditionExpression: "GSI1PK = :role",
            ExpressionAttributeValues: {
                ":role": "ROLE#admin",
            },
        });
        const adminPhoneNumbers = result.Items?.map((item) => item.phoneNumber) || [];
        // Get all device tokens for all admins
        const allTokens = [];
        for (const phoneNumber of adminPhoneNumbers) {
            const tokens = await (0, exports.getUserDeviceTokens)(phoneNumber);
            allTokens.push(...tokens);
        }
        return allTokens;
    }
    catch (error) {
        console.error("Error fetching admin device tokens:", error);
        return [];
    }
};
exports.getAdminDeviceTokens = getAdminDeviceTokens;
/**
 * Helper function: Send notification to user
 * Used internally by other handlers
 */
const notifyUser = async (phoneNumber, title, body, data) => {
    try {
        const tokens = await (0, exports.getUserDeviceTokens)(phoneNumber);
        if (tokens.length === 0) {
            console.log(`No device tokens found for user: ${phoneNumber}`);
            return;
        }
        if (tokens.length === 1) {
            await (0, firebase_1.sendPushNotification)(tokens[0], title, body, data || {});
        }
        else {
            await (0, firebase_1.sendPushNotificationToMultipleDevices)(tokens, title, body, data || {});
        }
    }
    catch (error) {
        console.error("Error notifying user:", error);
        // Don't throw - notifications are best effort
    }
};
exports.notifyUser = notifyUser;
/**
 * Helper function: Send notification to all admins
 * Used internally by other handlers
 */
const notifyAdmins = async (title, body, data) => {
    try {
        const tokens = await (0, exports.getAdminDeviceTokens)();
        if (tokens.length === 0) {
            console.log("No admin device tokens found");
            return;
        }
        await (0, firebase_1.sendPushNotificationToMultipleDevices)(tokens, title, body, data || {});
    }
    catch (error) {
        console.error("Error notifying admins:", error);
        // Don't throw - notifications are best effort
    }
};
exports.notifyAdmins = notifyAdmins;
//# sourceMappingURL=notifications.js.map