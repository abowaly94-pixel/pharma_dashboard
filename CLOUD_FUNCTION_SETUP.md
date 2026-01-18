# إعداد Cloud Functions لإرسال Push Notifications

## 📋 نظرة عامة

هذا الملف يحتوي على الكود اللازم لإنشاء Cloud Function في Firebase لإرسال Push Notifications عبر FCM.

---

## 🚀 خطوات الإعداد

### 1. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. تسجيل الدخول إلى Firebase

```bash
firebase login
```

### 3. تهيئة Cloud Functions في المشروع

```bash
firebase init functions
```

اختر:
- ✅ TypeScript
- ✅ ESLint
- ✅ Install dependencies

### 4. إنشاء ملف Cloud Function

أنشئ ملف `functions/src/index.ts` بالكود التالي:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function: Send FCM notification when a new notification is created
 * Triggers on: Firestore document creation in 'notifications' collection
 */
export const sendNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const notificationId = context.params.notificationId;

      console.log('New notification created:', notificationId);

      // Get target users
      let targetUserIds: string[] = [];

      // If targetUsers is specified, use it
      if (notification.targetUsers && notification.targetUsers.length > 0) {
        targetUserIds = notification.targetUsers;
      }
      // If targetRoles is specified, get users with those roles
      else if (notification.targetRoles && notification.targetRoles.length > 0) {
        const usersSnapshot = await admin.firestore()
          .collection('users')
          .where('role', 'in', notification.targetRoles)
          .get();
        
        targetUserIds = usersSnapshot.docs.map(doc => doc.id);
      }
      // If neither is specified, send to all users
      else {
        const usersSnapshot = await admin.firestore()
          .collection('users')
          .get();
        
        targetUserIds = usersSnapshot.docs.map(doc => doc.id);
      }

      console.log(`Sending notification to ${targetUserIds.length} users`);

      // Get FCM tokens for target users
      const tokensSnapshot = await admin.firestore()
        .collection('fcmTokens')
        .where('userId', 'in', targetUserIds)
        .get();

      const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

      if (tokens.length === 0) {
        console.log('No FCM tokens found for target users');
        return null;
      }

      console.log(`Found ${tokens.length} FCM tokens`);

      // Prepare FCM message
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          ...(notification.imageUrl && { imageUrl: notification.imageUrl })
        },
        data: {
          notificationId: notificationId,
          type: notification.type,
          ...(notification.actionUrl && { actionUrl: notification.actionUrl }),
          ...(notification.data && { ...notification.data })
        }
      };

      // Send to all tokens
      const response = await admin.messaging().sendEachForMulticast({
        tokens: tokens,
        ...message
      });

      console.log(`Successfully sent ${response.successCount} messages`);
      console.log(`Failed to send ${response.failureCount} messages`);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        const tokensToRemove: string[] = [];
        
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Error sending to token ${tokens[idx]}:`, resp.error);
            
            // Remove invalid tokens
            if (resp.error?.code === 'messaging/invalid-registration-token' ||
                resp.error?.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(tokens[idx]);
            }
          }
        });

        // Delete invalid tokens from Firestore
        if (tokensToRemove.length > 0) {
          const batch = admin.firestore().batch();
          
          for (const token of tokensToRemove) {
            const tokenDocs = await admin.firestore()
              .collection('fcmTokens')
              .where('token', '==', token)
              .get();
            
            tokenDocs.forEach(doc => {
              batch.delete(doc.ref);
            });
          }
          
          await batch.commit();
          console.log(`Removed ${tokensToRemove.length} invalid tokens`);
        }
      }

      return null;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

/**
 * Cloud Function: Clean up old FCM tokens
 * Runs daily at midnight
 */
export const cleanupOldTokens = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Africa/Cairo')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldTokensSnapshot = await admin.firestore()
        .collection('fcmTokens')
        .where('updatedAt', '<', thirtyDaysAgo)
        .get();

      if (oldTokensSnapshot.empty) {
        console.log('No old tokens to clean up');
        return null;
      }

      const batch = admin.firestore().batch();
      oldTokensSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleaned up ${oldTokensSnapshot.size} old tokens`);

      return null;
    } catch (error) {
      console.error('Error cleaning up tokens:', error);
      return null;
    }
  });

/**
 * Cloud Function: Send test notification (HTTP callable)
 * For testing purposes
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  // Check if user is admin
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(context.auth.uid)
    .get();

  if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can send test notifications'
    );
  }

  try {
    // Create test notification
    await admin.firestore().collection('notifications').add({
      title: data.title || 'إشعار تجريبي',
      body: data.body || 'هذا إشعار تجريبي من النظام',
      type: 'system',
      targetUsers: [context.auth.uid],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      sentBy: context.auth.uid
    });

    return { success: true, message: 'Test notification sent' };
  } catch (error) {
    console.error('Error sending test notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test notification');
  }
});
```

### 5. تثبيت Dependencies

```bash
cd functions
npm install firebase-admin firebase-functions
```

### 6. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

---

## 🔧 التكوين المطلوب

### في Firebase Console:

1. **تفعيل Cloud Functions**
   - اذهب إلى Firebase Console
   - Functions > Get Started

2. **تفعيل Cloud Messaging**
   - Settings > Cloud Messaging
   - تأكد من تفعيل Firebase Cloud Messaging API

3. **إعداد Firestore Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Notifications collection
       match /notifications/{notificationId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null && 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
       }
       
       // FCM Tokens collection
       match /fcmTokens/{tokenId} {
         allow read, write: if request.auth != null && 
                            resource.data.userId == request.auth.uid;
       }
     }
   }
   ```

---

## 📊 مراقبة Cloud Functions

### في Firebase Console:
- Functions > Dashboard
- شاهد logs وعدد الاستدعاءات
- راقب الأخطاء والتنبيهات

### في الكود:
```typescript
// في أي مكان في التطبيق
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendTestNotification = httpsCallable(functions, 'sendTestNotification');

// إرسال إشعار تجريبي
await sendTestNotification({
  title: 'اختبار',
  body: 'هذا إشعار تجريبي'
});
```

---

## 💰 التكلفة

Cloud Functions لها حصة مجانية:
- ✅ 2 مليون استدعاء/شهر
- ✅ 400,000 GB-seconds
- ✅ 200,000 CPU-seconds

بعد ذلك:
- $0.40 لكل مليون استدعاء
- $0.0000025 لكل GB-second
- $0.0000100 لكل GHz-second

---

## 🧪 اختبار Cloud Functions محلياً

```bash
# تثبيت Firebase Emulator
firebase init emulators

# تشغيل Emulators
firebase emulators:start

# في ملف آخر، اختبر الـ function
curl -X POST http://localhost:5001/pharmanow-754a7/us-central1/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Test","body":"Testing"}}'
```

---

## ⚠️ ملاحظات مهمة

1. **الأمان:**
   - لا تشارك Service Account Keys
   - استخدم Firestore Security Rules
   - تحقق من صلاحيات المستخدم

2. **الأداء:**
   - استخدم batching لإرسال عدة إشعارات
   - نظف الـ tokens القديمة بانتظام
   - راقب استهلاك Cloud Functions

3. **الاختبار:**
   - اختبر على Emulator أولاً
   - استخدم test notifications
   - راقب الـ logs

---

## 🔗 روابط مفيدة

- [Firebase Cloud Functions Docs](https://firebase.google.com/docs/functions)
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
