import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Send FCM notification when a new notification is created in Firestore
 * Supports Web, Android, and iOS platforms
 * 
 * Triggers on: Firestore document creation in 'notifications' collection
 */
export const sendNotificationOnCreate = functions.firestore
  .document("notifications/{notificationId}")
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const notificationId = context.params.notificationId;

      console.log("📢 New notification created:", notificationId);

      // 1. Get target users
      let targetUserIds: string[] = [];

      if (notification.targetUsers && notification.targetUsers.length > 0) {
        // Send to specific users
        targetUserIds = notification.targetUsers;
        console.log(`🎯 Targeting specific users: ${targetUserIds.length}`);
      } else if (notification.targetRoles && notification.targetRoles.length > 0) {
        // Send based on role (admin, pharmacist, user)
        const usersSnapshot = await admin.firestore()
          .collection("users")
          .where("role", "in", notification.targetRoles)
          .get();

        targetUserIds = usersSnapshot.docs.map((doc) => doc.id);
        console.log(`🎯 Targeting roles ${notification.targetRoles}: ${targetUserIds.length} users`);
      } else {
        // Send to all users (Web + Mobile)
        const usersSnapshot = await admin.firestore()
          .collection("users")
          .get();

        targetUserIds = usersSnapshot.docs.map((doc) => doc.id);
        console.log(`🎯 Targeting ALL users: ${targetUserIds.length}`);
      }

      if (targetUserIds.length === 0) {
        console.log("⚠️ No target users found");
        return null;
      }

      // 2. Get FCM tokens for ALL platforms
      const allTokens: Array<{ token: string; platform: string; userId: string }> = [];

      // Query in batches (Firestore 'in' limit is 10)
      const batchSize = 10;
      for (let i = 0; i < targetUserIds.length; i += batchSize) {
        const batch = targetUserIds.slice(i, i + batchSize);

        const tokensSnapshot = await admin.firestore()
          .collection("fcmTokens")
          .where("userId", "in", batch)
          .get();

        tokensSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          allTokens.push({
            token: data.token,
            platform: data.platform || "web",
            userId: data.userId,
          });
        });
      }

      if (allTokens.length === 0) {
        console.log("⚠️ No FCM tokens found for target users");
        return null;
      }

      console.log(`📱 Found ${allTokens.length} tokens across platforms:`);
      const webTokens = allTokens.filter((t) => t.platform === "web").length;
      const androidTokens = allTokens.filter((t) => t.platform === "android").length;
      const iosTokens = allTokens.filter((t) => t.platform === "ios").length;
      console.log(`   - Web: ${webTokens}`);
      console.log(`   - Android: ${androidTokens}`);
      console.log(`   - iOS: ${iosTokens}`);

      // 3. Prepare FCM message
      const tokens = allTokens.map((t) => t.token);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl }),
        },
        data: {
          notificationId: notificationId,
          type: notification.type,
          ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
          ...(notification.data && {
            customData: JSON.stringify(notification.data),
          }),
          timestamp: Date.now().toString(),
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
        android: {
          priority: "high" as const,
          notification: {
            channelId: "pharmanow_notifications",
            sound: "default",
            priority: "high" as const,
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      // 4. Send to all tokens (max 500 per batch)
      const batchSize500 = 500;
      let totalSuccess = 0;
      let totalFailure = 0;
      const invalidTokens: string[] = [];

      for (let i = 0; i < tokens.length; i += batchSize500) {
        const batchTokens = tokens.slice(i, i + batchSize500);

        const response = await admin.messaging().sendEachForMulticast({
          tokens: batchTokens,
          ...message,
        });

        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Collect invalid tokens
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;

            if (errorCode === "messaging/invalid-registration-token" ||
                errorCode === "messaging/registration-token-not-registered") {
              invalidTokens.push(batchTokens[idx]);
            }
          }
        });
      }

      console.log(`✅ Successfully sent ${totalSuccess} messages`);
      console.log(`❌ Failed to send ${totalFailure} messages`);

      // 5. Remove invalid tokens
      if (invalidTokens.length > 0) {
        console.log(`🗑️ Removing ${invalidTokens.length} invalid tokens`);

        const batch = admin.firestore().batch();

        for (const token of invalidTokens) {
          const tokenDocs = await admin.firestore()
            .collection("fcmTokens")
            .where("token", "==", token)
            .limit(1)
            .get();

          tokenDocs.forEach((doc) => {
            batch.delete(doc.ref);
          });
        }

        await batch.commit();
        console.log(`✅ Removed ${invalidTokens.length} invalid tokens`);
      }

      // 6. Update notification stats
      await snap.ref.update({
        sentCount: totalSuccess,
        failedCount: totalFailure,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return null;
    } catch (error) {
      console.error("❌ Error sending notification:", error);
      return null;
    }
  });

/**
 * Clean up old and unused FCM tokens
 * Runs daily at 2 AM Cairo time
 */
export const cleanupOldTokens = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("Africa/Cairo")
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldTokensSnapshot = await admin.firestore()
        .collection("fcmTokens")
        .where("lastUsed", "<", thirtyDaysAgo)
        .get();

      if (oldTokensSnapshot.empty) {
        console.log("No old tokens to clean up");
        return null;
      }

      const batch = admin.firestore().batch();
      oldTokensSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldTokensSnapshot.size} old tokens`);

      return null;
    } catch (error) {
      console.error("Error cleaning up tokens:", error);
      return null;
    }
  });

/**
 * HTTP callable function to send test notification
 * For testing from Postman, Mobile App, or Web
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  // Check if user is admin
  const userDoc = await admin.firestore()
    .collection("users")
    .doc(context.auth.uid)
    .get();

  if (!userDoc.exists || userDoc.data()?.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only admins can send test notifications");
  }

  try {
    await admin.firestore().collection("notifications").add({
      title: data.title || "إشعار تجريبي",
      body: data.body || "هذا إشعار تجريبي من النظام",
      type: "system",
      targetUsers: data.targetUsers || [],
      targetRoles: data.targetRoles || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      sentBy: context.auth.uid,
    });

    return { success: true, message: "Test notification sent" };
  } catch (error) {
    console.error("Error sending test notification:", error);
    throw new functions.https.HttpsError("internal", "Failed to send test notification");
  }
});
