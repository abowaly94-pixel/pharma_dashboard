# 📱 إعداد الإشعارات للـ Mobile App

## 🎯 الهدف:
إرسال إشعارات من صفحة الأدمن (Web) إلى جميع المستخدمين على:
- ✅ Web App
- ✅ Mobile App (Android/iOS)
- ✅ كلاهما معاً

---

## 📊 البنية المطلوبة:

```
Admin Panel (Web)
    ↓
  Firestore (notifications collection)
    ↓
  Cloud Function (يستمع للإضافات الجديدة)
    ↓
  Firebase Cloud Messaging (FCM)
    ↓
  ┌─────────────┬─────────────┐
  ↓             ↓             ↓
Web Users   Android Users  iOS Users
```

---

## 🔧 الإعداد الكامل:

### 1️⃣ تحديث Firestore Structure

#### Collection: `fcmTokens`
```javascript
{
  id: "auto-generated",
  userId: "user123",
  token: "fcm-token-here",
  platform: "web" | "android" | "ios",  // ← جديد
  deviceId: "device-unique-id",         // ← جديد
  appVersion: "1.0.0",                  // ← جديد
  createdAt: timestamp,
  updatedAt: timestamp,
  lastUsed: timestamp                   // ← جديد
}
```

---

### 2️⃣ تحديث Cloud Function

**ملف:** `functions/src/index.ts`

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Send FCM notification when a new notification is created
 * Supports Web, Android, and iOS
 */
export const sendNotificationOnCreate = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    try {
      const notification = snap.data();
      const notificationId = context.params.notificationId;

      console.log('📢 New notification created:', notificationId);

      // 1. Get target users
      let targetUserIds: string[] = [];

      if (notification.targetUsers && notification.targetUsers.length > 0) {
        // إرسال لمستخدمين محددين
        targetUserIds = notification.targetUsers;
        console.log(`🎯 Targeting specific users: ${targetUserIds.length}`);
      } 
      else if (notification.targetRoles && notification.targetRoles.length > 0) {
        // إرسال حسب الدور (admin, pharmacist, user)
        const usersSnapshot = await admin.firestore()
          .collection('users')
          .where('role', 'in', notification.targetRoles)
          .get();
        
        targetUserIds = usersSnapshot.docs.map(doc => doc.id);
        console.log(`🎯 Targeting roles ${notification.targetRoles}: ${targetUserIds.length} users`);
      } 
      else {
        // إرسال لجميع المستخدمين (Web + Mobile)
        const usersSnapshot = await admin.firestore()
          .collection('users')
          .get();
        
        targetUserIds = usersSnapshot.docs.map(doc => doc.id);
        console.log(`🎯 Targeting ALL users: ${targetUserIds.length}`);
      }

      if (targetUserIds.length === 0) {
        console.log('⚠️ No target users found');
        return null;
      }

      // 2. Get FCM tokens for ALL platforms
      const allTokens: Array<{token: string, platform: string, userId: string}> = [];
      
      // Query in batches (Firestore 'in' limit is 10)
      const batchSize = 10;
      for (let i = 0; i < targetUserIds.length; i += batchSize) {
        const batch = targetUserIds.slice(i, i + batchSize);
        
        const tokensSnapshot = await admin.firestore()
          .collection('fcmTokens')
          .where('userId', 'in', batch)
          .get();

        tokensSnapshot.docs.forEach(doc => {
          const data = doc.data();
          allTokens.push({
            token: data.token,
            platform: data.platform || 'web',
            userId: data.userId
          });
        });
      }

      if (allTokens.length === 0) {
        console.log('⚠️ No FCM tokens found for target users');
        return null;
      }

      console.log(`📱 Found ${allTokens.length} tokens across platforms:`);
      const webTokens = allTokens.filter(t => t.platform === 'web').length;
      const androidTokens = allTokens.filter(t => t.platform === 'android').length;
      const iosTokens = allTokens.filter(t => t.platform === 'ios').length;
      console.log(`   - Web: ${webTokens}`);
      console.log(`   - Android: ${androidTokens}`);
      console.log(`   - iOS: ${iosTokens}`);

      // 3. Prepare FCM message
      const tokens = allTokens.map(t => t.token);
      
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
          ...(notification.data && { 
            customData: JSON.stringify(notification.data) 
          }),
          // إضافة timestamp للـ Mobile App
          timestamp: Date.now().toString(),
          // إضافة click_action للـ Android
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        },
        // إعدادات خاصة بالـ Android
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'pharmanow_notifications',
            sound: 'default',
            priority: 'high' as const,
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        // إعدادات خاصة بالـ iOS
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true
            }
          }
        }
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
          ...message
        });

        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Collect invalid tokens
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            
            if (errorCode === 'messaging/invalid-registration-token' ||
                errorCode === 'messaging/registration-token-not-registered') {
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
            .collection('fcmTokens')
            .where('token', '==', token)
            .limit(1)
            .get();
          
          tokenDocs.forEach(doc => {
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
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return null;
    } catch (error) {
      console.error('❌ Error sending notification:', error);
      return null;
    }
  });

/**
 * Clean up old and unused tokens
 * Runs daily at 2 AM
 */
export const cleanupOldTokens = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('Africa/Cairo')
  .onRun(async (context) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldTokensSnapshot = await admin.firestore()
        .collection('fcmTokens')
        .where('lastUsed', '<', thirtyDaysAgo)
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
 * HTTP endpoint to send test notification
 * For testing from Postman or Mobile App
 */
export const sendTestNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    await admin.firestore().collection('notifications').add({
      title: data.title || 'إشعار تجريبي',
      body: data.body || 'هذا إشعار تجريبي من النظام',
      type: 'system',
      targetUsers: data.targetUsers || [],
      targetRoles: data.targetRoles || [],
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

---

### 3️⃣ تحديث Web App لحفظ Platform

**ملف:** `src/lib/notifications.ts`

```typescript
// Save FCM token with platform info
export const saveFCMToken = async (userId: string, token: string) => {
  try {
    const tokensRef = collection(db, 'fcmTokens');
    const q = query(
      tokensRef, 
      where('userId', '==', userId), 
      where('token', '==', token)
    );
    const querySnapshot = await getDocs(q);
    
    const tokenData = {
      userId,
      token,
      platform: 'web', // ← تحديد المنصة
      deviceId: navigator.userAgent, // معرف الجهاز
      appVersion: '1.0.0', // نسخة التطبيق
      updatedAt: serverTimestamp(),
      lastUsed: serverTimestamp()
    };
    
    if (querySnapshot.empty) {
      await addDoc(tokensRef, {
        ...tokenData,
        createdAt: serverTimestamp()
      });
      console.log('FCM token saved successfully');
    } else {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, tokenData);
      console.log('FCM token updated successfully');
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};
```

---

### 4️⃣ إعداد Mobile App (Flutter/React Native)

#### للـ Flutter:

**1. تثبيت Firebase Messaging:**
```yaml
# pubspec.yaml
dependencies:
  firebase_messaging: ^14.7.0
  firebase_core: ^2.24.0
```

**2. حفظ FCM Token:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<void> initialize(String userId) async {
    // طلب الإذن
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      // الحصول على Token
      String? token = await _messaging.getToken();
      
      if (token != null) {
        // حفظ Token في Firestore
        await _saveToken(userId, token);
      }

      // الاستماع لتحديثات Token
      _messaging.onTokenRefresh.listen((newToken) {
        _saveToken(userId, newToken);
      });

      // الاستماع للإشعارات
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationClick);
    }
  }

  Future<void> _saveToken(String userId, String token) async {
    try {
      // البحث عن token موجود
      final query = await _firestore
          .collection('fcmTokens')
          .where('userId', isEqualTo: userId)
          .where('token', isEqualTo: token)
          .get();

      final data = {
        'userId': userId,
        'token': token,
        'platform': Platform.isAndroid ? 'android' : 'ios',
        'deviceId': await _getDeviceId(),
        'appVersion': '1.0.0',
        'updatedAt': FieldValue.serverTimestamp(),
        'lastUsed': FieldValue.serverTimestamp(),
      };

      if (query.docs.isEmpty) {
        // إضافة token جديد
        await _firestore.collection('fcmTokens').add({
          ...data,
          'createdAt': FieldValue.serverTimestamp(),
        });
      } else {
        // تحديث token موجود
        await query.docs.first.reference.update(data);
      }

      print('✅ FCM token saved successfully');
    } catch (e) {
      print('❌ Error saving FCM token: $e');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    print('📱 Foreground message: ${message.notification?.title}');
    // عرض الإشعار في التطبيق
  }

  void _handleNotificationClick(RemoteMessage message) {
    print('👆 Notification clicked: ${message.data}');
    // التنقل إلى الصفحة المناسبة
  }

  Future<String> _getDeviceId() async {
    // استخدم package مثل device_info_plus
    return 'device-id-here';
  }
}
```

**3. استخدام في التطبيق:**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final NotificationService _notificationService = NotificationService();

  @override
  void initState() {
    super.initState();
    _initializeNotifications();
  }

  Future<void> _initializeNotifications() async {
    // احصل على userId من Authentication
    String userId = FirebaseAuth.instance.currentUser?.uid ?? '';
    
    if (userId.isNotEmpty) {
      await _notificationService.initialize(userId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('PharmaNo')),
      body: Center(child: Text('Home Page')),
    );
  }
}
```

---

### 5️⃣ اختبار النظام

#### من صفحة الأدمن (Web):

```typescript
// في AdminNotifications.tsx
const handleSendToAll = async () => {
  await sendNotification({
    title: 'إشعار لجميع المستخدمين',
    body: 'هذا الإشعار سيصل للـ Web والـ Mobile',
    type: 'general',
    // لا تحدد targetUsers أو targetRoles = يرسل للجميع
  });
};

const handleSendToMobileOnly = async () => {
  // للإرسال للـ Mobile فقط، تحتاج query مخصص
  // أو إضافة حقل platform في users collection
};
```

---

### 6️⃣ Deploy Cloud Functions

```bash
# 1. تثبيت dependencies
cd functions
npm install

# 2. Deploy
firebase deploy --only functions

# 3. تحقق من Logs
firebase functions:log
```

---

## 📊 كيف يعمل النظام:

```
1. Admin يرسل إشعار من Web Panel
   ↓
2. يُحفظ في Firestore (notifications collection)
   ↓
3. Cloud Function يستمع للإضافة الجديدة
   ↓
4. يجلب جميع FCM tokens (Web + Android + iOS)
   ↓
5. يرسل FCM notification لجميع الأجهزة
   ↓
6. المستخدمون يستلمون الإشعار على:
   - Web Browser (إذا كان التطبيق مفتوح أو في Background)
   - Mobile App (حتى لو كان مغلق)
```

---

## ✅ المميزات:

- ✅ إرسال لجميع المستخدمين (Web + Mobile)
- ✅ إرسال حسب الدور (admin, pharmacist, user)
- ✅ إرسال لمستخدمين محددين
- ✅ دعم Android و iOS
- ✅ تنظيف الـ tokens القديمة تلقائياً
- ✅ إحصائيات الإرسال (نجح/فشل)
- ✅ إزالة الـ tokens غير الصالحة

---

## 💰 التكلفة:

- **FCM:** مجاني تماماً ✅
- **Cloud Functions:** 
  - 2 مليون استدعاء/شهر مجاناً
  - بعد ذلك: $0.40 لكل مليون
- **Firestore:**
  - 50,000 قراءة/يوم مجاناً
  - 20,000 كتابة/يوم مجاناً

**للاستخدام المتوسط: مجاني تماماً** ✅

---

## 🧪 اختبار:

### 1. اختبار من Web:
```
1. افتح /admin/notifications
2. أرسل إشعار للجميع
3. تحقق من Firebase Console > Functions > Logs
4. يجب أن ترى: "Successfully sent X messages"
```

### 2. اختبار من Mobile:
```
1. افتح Mobile App
2. سجل دخول
3. يجب أن يُحفظ FCM token في Firestore
4. أرسل إشعار من Web Panel
5. يجب أن يصل للـ Mobile
```

---

## 📞 للمساعدة:

إذا واجهت مشكلة:
1. تحقق من Firebase Console > Functions > Logs
2. تحقق من Firestore > fcmTokens collection
3. تأكد من تفعيل Firebase Cloud Messaging API
4. تأكد من Deploy الـ Cloud Functions

---

**🎉 الآن يمكنك إرسال إشعارات من Web Panel لجميع المستخدمين على Web و Mobile!**
