import * as admin from "firebase-admin";

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * This should be called once when Lambda starts
 */
export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Check if service account key is provided via environment variable
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      console.warn(
        "Firebase service account key not found. Push notifications will not work.",
      );
      return;
    }

    // Parse the service account key from environment variable
    const serviceAccount = JSON.parse(serviceAccountKey);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
};

/**
 * Get Firebase Admin instance
 */
export const getFirebaseAdmin = () => {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  return admin;
};

/**
 * Send push notification to a single device
 */
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    initializeFirebase();

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
        priority: "high" as const,
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
  } catch (error: any) {
    console.error("Error sending push notification:", error);
    return {
      success: false,
      error: error.message || "Failed to send notification",
    };
  }
};

/**
 * Send push notification to multiple devices
 */
export const sendPushNotificationToMultipleDevices = async (
  fcmTokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<{
  successCount: number;
  failureCount: number;
  responses: any[];
}> => {
  try {
    initializeFirebase();

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
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "quickneeds",
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `${response.successCount} messages sent successfully, ${response.failureCount} failed`,
    );

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error: any) {
    console.error("Error sending push notifications:", error);
    return {
      successCount: 0,
      failureCount: fcmTokens.length,
      responses: [],
    };
  }
};
