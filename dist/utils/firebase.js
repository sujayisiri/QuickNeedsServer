"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushNotificationToMultipleDevices = exports.sendPushNotification = exports.getFirebaseAdmin = exports.initializeFirebase = void 0;
const admin = __importStar(require("firebase-admin"));
let firebaseInitialized = false;
/**
 * Initialize Firebase Admin SDK
 * This should be called once when Lambda starts
 */
const initializeFirebase = () => {
    if (firebaseInitialized) {
        return;
    }
    try {
        // Check if service account key is provided via environment variable
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountKey) {
            console.warn("Firebase service account key not found. Push notifications will not work.");
            return;
        }
        // Parse the service account key from environment variable
        const serviceAccount = JSON.parse(serviceAccountKey);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        firebaseInitialized = true;
        console.log("Firebase Admin SDK initialized successfully");
    }
    catch (error) {
        console.error("Failed to initialize Firebase Admin SDK:", error);
        throw error;
    }
};
exports.initializeFirebase = initializeFirebase;
/**
 * Get Firebase Admin instance
 */
const getFirebaseAdmin = () => {
    if (!firebaseInitialized) {
        (0, exports.initializeFirebase)();
    }
    return admin;
};
exports.getFirebaseAdmin = getFirebaseAdmin;
/**
 * Send push notification to a single device
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
    try {
        (0, exports.initializeFirebase)();
        if (!firebaseInitialized) {
            return {
                success: false,
                error: "Firebase not initialized",
            };
        }
        const message = {
            notification: {
                title,
                body,
            },
            data,
            token: fcmToken,
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                    },
                },
            },
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "quickneeds",
                },
            },
        };
        const response = await admin.messaging().send(message);
        console.log("Successfully sent message:", response);
        return {
            success: true,
            messageId: response,
        };
    }
    catch (error) {
        console.error("Error sending push notification:", error);
        return {
            success: false,
            error: error.message || "Failed to send notification",
        };
    }
};
exports.sendPushNotification = sendPushNotification;
/**
 * Send push notification to multiple devices
 */
const sendPushNotificationToMultipleDevices = async (fcmTokens, title, body, data = {}) => {
    try {
        (0, exports.initializeFirebase)();
        if (!firebaseInitialized) {
            return {
                successCount: 0,
                failureCount: fcmTokens.length,
                responses: [],
            };
        }
        const message = {
            notification: {
                title,
                body,
            },
            data,
            tokens: fcmTokens,
            apns: {
                payload: {
                    aps: {
                        sound: "default",
                        badge: 1,
                    },
                },
            },
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "quickneeds",
                },
            },
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} messages sent successfully, ${response.failureCount} failed`);
        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses,
        };
    }
    catch (error) {
        console.error("Error sending push notifications:", error);
        return {
            successCount: 0,
            failureCount: fcmTokens.length,
            responses: [],
        };
    }
};
exports.sendPushNotificationToMultipleDevices = sendPushNotificationToMultipleDevices;
//# sourceMappingURL=firebase.js.map