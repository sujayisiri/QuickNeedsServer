import * as admin from "firebase-admin";
/**
 * Initialize Firebase Admin SDK
 * This should be called once when Lambda starts
 */
export declare const initializeFirebase: () => void;
/**
 * Get Firebase Admin instance
 */
export declare const getFirebaseAdmin: () => typeof admin;
/**
 * Send push notification to a single device
 */
export declare const sendPushNotification: (fcmToken: string, title: string, body: string, data?: Record<string, string>) => Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * Send push notification to multiple devices
 */
export declare const sendPushNotificationToMultipleDevices: (fcmTokens: string[], title: string, body: string, data?: Record<string, string>) => Promise<{
    successCount: number;
    failureCount: number;
    responses: any[];
}>;
//# sourceMappingURL=firebase.d.ts.map