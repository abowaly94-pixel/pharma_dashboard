# إعداد Cloud Function لحذف المستخدمين من Firebase Auth

## الخطوة 1: تثبيت Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

## الخطوة 2: تهيئة Functions في المشروع
```bash
firebase init functions
```

## الخطوة 3: إنشاء Function لحذف المستخدمين

في ملف `functions/src/index.ts` أو `functions/index.js`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const deleteUserAuth = functions.https.onCall(async (data, context) => {
  // التحقق من أن المستخدم مسجل دخول وهو admin
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'يجب تسجيل الدخول لحذف المستخدمين'
    );
  }

  // التحقق من أن المستخدم admin
  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();

  if (!callerData || callerData.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'فقط المدراء يمكنهم حذف المستخدمين'
    );
  }

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'معرف المستخدم مطلوب'
    );
  }

  try {
    // حذف المستخدم من Firebase Auth
    await admin.auth().deleteUser(uid);
    
    return { 
      success: true, 
      message: 'تم حذف المستخدم من Firebase Auth بنجاح' 
    };
  } catch (error) {
    console.error('Error deleting user from Auth:', error);
    throw new functions.https.HttpsError(
      'internal',
      'فشل في حذف المستخدم من Firebase Auth'
    );
  }
});
```

## الخطوة 4: نشر Function
```bash
firebase deploy --only functions
```

## ملاحظات مهمة:

1. **الحذف من Firestore يعمل حالياً**: الكود الحالي يحذف المستخدم من Firestore بنجاح
2. **Cloud Function اختيارية**: لحذف المستخدم من Firebase Auth أيضاً، تحتاج لإعداد Cloud Function
3. **بدون Cloud Function**: سيتم حذف بيانات المستخدم من Firestore فقط، لكن حساب Auth سيبقى موجوداً
4. **مع Cloud Function**: سيتم حذف المستخدم من كل من Firestore و Firebase Auth

## البديل: استخدام Firebase Admin SDK من Backend

إذا كان لديك backend خاص، يمكنك استخدام Firebase Admin SDK مباشرة:

```typescript
import * as admin from 'firebase-admin';

// حذف المستخدم من Auth
await admin.auth().deleteUser(userId);

// حذف المستخدم من Firestore
await admin.firestore().collection('users').doc(userId).delete();
```
