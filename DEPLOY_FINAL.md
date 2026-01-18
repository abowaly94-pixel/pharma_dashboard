# 🚀 الأوامر الصحيحة للـ Deploy

## ⚠️ المشكلة:
أنت الآن في المجلد الرئيسي، يجب أن تكون في مجلد `functions`

---

## ✅ الحل - الأوامر الصحيحة:

```bash
# 1. الذهاب لمجلد functions
cd functions

# 2. تثبيت Dependencies
npm install

# 3. Build
npm run build

# 4. Deploy
npm run deploy
```

---

## 📋 نسخ ولصق (كل الأوامر مرة واحدة):

```bash
cd functions && npm install && npm run build && npm run deploy
```

---

## ⏱️ الوقت المتوقع: 5-8 دقائق

---

## ✅ يجب أن ترى:

```
=== Deploying to 'pharmanow-754a7'...

i  deploying functions
✔  functions: Finished running predeploy script.
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled

i  functions: creating Node.js 18 function sendNotificationOnCreate...
i  functions: creating Node.js 18 function cleanupOldTokens...
i  functions: creating Node.js 18 function sendTestNotification...

✔  functions[sendNotificationOnCreate] Successful create operation.
✔  functions[cleanupOldTokens] Successful create operation.
✔  functions[sendTestNotification] Successful create operation.

✔  Deploy complete!
```

---

## 🎯 بعد Deploy:

### 1. تفعيل FCM API
افتح هذا الرابط واضغط "Enable":
```
https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=pharmanow-754a7
```

### 2. اختبار النظام
```
1. افتح: http://localhost:5173
2. سجل دخول كـ Admin
3. اذهب إلى: /admin/notifications
4. أرسل إشعار تجريبي
5. تحقق من جرس الإشعارات
```

### 3. تحقق من Logs
```bash
cd ..
firebase functions:log
```

---

**🚀 نفذ الأوامر الآن!**
