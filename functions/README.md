# 🔥 Firebase Cloud Functions - PharmaNo Notifications

## 📋 نظرة عامة

هذه الـ Cloud Functions مسؤولة عن إرسال Push Notifications لجميع المستخدمين على:
- ✅ Web App
- ✅ Android App
- ✅ iOS App

---

## 🚀 التثبيت والإعداد

### 1. تثبيت Dependencies

```bash
cd functions
npm install
```

### 2. Build الكود

```bash
npm run build
```

### 3. اختبار محلياً (اختياري)

```bash
npm run serve
```

---

## 📤 Deploy على Firebase

### الطريقة 1: Deploy جميع Functions

```bash
# من مجلد functions
npm run deploy

# أو من الـ root
firebase deploy --only functions
```

### الطريقة 2: Deploy function واحدة فقط

```bash
firebase deploy --only functions:sendNotificationOnCreate
firebase deploy --only functions:cleanupOldTokens
firebase deploy --only functions:sendTestNotification
```

---

## 📊 الـ Functions المتاحة

### 1. `sendNotificationOnCreate`
**النوع:** Firestore Trigger  
**المحفز:** إضافة document جديد في `notifications` collection

**ماذا يفعل:**
- يستمع لإضافة إشعار جديد
- يجلب جميع FCM tokens للمستخدمين المستهدفين
- يرسل FCM notification لجميع الأجهزة (Web + Mobile)
- يزيل الـ tokens غير الصالحة
- يحدث إحصائيات الإرسال

**الاستخدام:**
```typescript
// من Web App - يتم تلقائياً عند إضافة إشعار
await addDoc(collection(db, 'notifications'), {
  title: 'عنوان الإشعار',
  body: 'محتوى الإشعار',
  type: 'general',
  targetRoles: ['pharmacist']
});
```

---

### 2. `cleanupOldTokens`
**النوع:** Scheduled Function  
**الجدول:** يومياً الساعة 2 صباحاً (Africa/Cairo)

**ماذا يفعل:**
- يحذف FCM tokens التي لم تُستخدم منذ 30 يوم
- ينظف قاعدة البيانات من الـ tokens القديمة

---

### 3. `sendTestNotification`
**النوع:** HTTP Callable Function  
**الصلاحيات:** Admin فقط

**ماذا يفعل:**
- يرسل إشعار تجريبي
- للاختبار من Postman أو Mobile App

**الاستخدام:**
```typescript
// من Web App
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendTest = httpsCallable(functions, 'sendTestNotification');

await sendTest({
  title: 'اختبار',
  body: 'هذا إشعار تجريبي',
  targetRoles: ['admin']
});
```

---

## 📝 Logs والمراقبة

### عرض Logs في الـ Terminal

```bash
firebase functions:log
```

### عرض Logs في Firebase Console

```
Firebase Console > Functions > Logs
```

### عرض Logs لـ function محددة

```bash
firebase functions:log --only sendNotificationOnCreate
```

---

## 🧪 الاختبار

### 1. اختبار محلياً

```bash
# تشغيل Emulator
npm run serve

# في terminal آخر، اختبر الـ function
curl -X POST http://localhost:5001/pharmanow-754a7/us-central1/sendTestNotification \
  -H "Content-Type: application/json" \
  -d '{"data":{"title":"Test","body":"Testing"}}'
```

### 2. اختبار على Production

```typescript
// من Web App
await sendNotification({
  title: 'اختبار',
  body: 'هذا إشعار تجريبي',
  type: 'system'
});

// تحقق من Logs
// firebase functions:log
```

---

## 💰 التكلفة

### الحصة المجانية:
- ✅ 2,000,000 استدعاء/شهر
- ✅ 400,000 GB-seconds
- ✅ 200,000 CPU-seconds

### بعد الحصة:
- $0.40 لكل مليون استدعاء
- $0.0000025 لكل GB-second
- $0.0000100 لكل GHz-second

**للاستخدام المتوسط: مجاني تماماً** ✅

---

## 🔧 Troubleshooting

### المشكلة: Function لا تعمل

**الحلول:**
1. تحقق من Logs: `firebase functions:log`
2. تأكد من Deploy: `firebase deploy --only functions`
3. تحقق من Firebase Console > Functions

### المشكلة: الإشعارات لا تصل

**الحلول:**
1. تحقق من وجود FCM tokens في Firestore
2. تأكد من تفعيل Firebase Cloud Messaging API
3. راجع Logs للأخطاء

### المشكلة: Build Error

**الحلول:**
```bash
cd functions
rm -rf node_modules
npm install
npm run build
```

---

## 📁 هيكل الملفات

```
functions/
├── src/
│   └── index.ts          # الكود الرئيسي
├── lib/                  # الكود المُترجم (auto-generated)
├── node_modules/         # Dependencies
├── package.json          # NPM config
├── tsconfig.json         # TypeScript config
├── .eslintrc.js          # ESLint config
└── README.md            # هذا الملف
```

---

## 🔗 روابط مفيدة

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**✅ الـ Functions جاهزة للـ Deploy!**
