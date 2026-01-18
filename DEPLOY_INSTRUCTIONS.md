# 🚀 دليل Deploy Cloud Functions - خطوة بخطوة

## ✅ ما تم إنجازه:

- ✅ إنشاء مجلد `functions/`
- ✅ كتابة كود Cloud Functions
- ✅ إعداد ملفات التكوين
- ✅ تحديث Web App لحفظ platform

---

## 📋 الخطوات المطلوبة منك:

### 1️⃣ تثبيت Firebase CLI (إذا لم يكن مثبت)

```bash
npm install -g firebase-tools
```

**للتحقق من التثبيت:**
```bash
firebase --version
```

يجب أن يظهر رقم الإصدار (مثل: 13.0.0)

---

### 2️⃣ تسجيل الدخول إلى Firebase

```bash
firebase login
```

**ماذا سيحدث:**
- سيفتح المتصفح
- سجل دخول بحساب Google المرتبط بمشروع Firebase
- اضغط "Allow"

**للتحقق:**
```bash
firebase projects:list
```

يجب أن ترى مشروع `pharmanow-754a7`

---

### 3️⃣ تثبيت Dependencies للـ Functions

```bash
cd functions
npm install
```

**الانتظار:** قد يستغرق 2-3 دقائق

---

### 4️⃣ Build الكود

```bash
npm run build
```

**يجب أن ترى:**
```
✓ Compiled successfully
```

---

### 5️⃣ Deploy على Firebase

```bash
# من مجلد functions
npm run deploy

# أو ارجع للـ root وشغل
cd ..
firebase deploy --only functions
```

**الانتظار:** قد يستغرق 3-5 دقائق

**يجب أن ترى:**
```
✔ functions[sendNotificationOnCreate] Successful create operation.
✔ functions[cleanupOldTokens] Successful create operation.
✔ functions[sendTestNotification] Successful create operation.

✔ Deploy complete!
```

---

### 6️⃣ التحقق من Deploy

#### أ. من Firebase Console:
```
1. اذهب إلى: https://console.firebase.google.com/project/pharmanow-754a7/functions
2. يجب أن ترى 3 functions:
   - sendNotificationOnCreate
   - cleanupOldTokens
   - sendTestNotification
```

#### ب. من Terminal:
```bash
firebase functions:list
```

---

### 7️⃣ تفعيل Firebase Cloud Messaging API

**مهم جداً!** بدون هذه الخطوة، الإشعارات لن تعمل.

```
1. اذهب إلى: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=pharmanow-754a7
2. اضغط "Enable" أو "تفعيل"
3. انتظر 1-2 دقيقة
```

---

### 8️⃣ اختبار النظام

#### أ. من Web App:

```
1. افتح التطبيق: http://localhost:5173
2. سجل دخول كـ Admin
3. اذهب إلى: /admin/notifications
4. أرسل إشعار تجريبي:
   - العنوان: "اختبار"
   - المحتوى: "هذا إشعار تجريبي"
   - النوع: "عام"
   - المستهدفون: "الجميع"
5. اضغط "إرسال الإشعار"
```

#### ب. تحقق من Logs:

```bash
firebase functions:log --only sendNotificationOnCreate
```

**يجب أن ترى:**
```
📢 New notification created: [notification-id]
🎯 Targeting ALL users: X
📱 Found Y tokens across platforms:
   - Web: Y
   - Android: 0
   - iOS: 0
✅ Successfully sent Y messages
```

#### ج. تحقق من الإشعار:

```
1. في Web App، اضغط على جرس الإشعارات
2. يجب أن ترى الإشعار الجديد
```

---

## 🎯 إذا كل شيء يعمل:

### ✅ تهانينا! النظام يعمل بنجاح!

الآن يمكنك:
- ✅ إرسال إشعارات من صفحة الأدمن
- ✅ الإشعارات تصل لجميع المستخدمين على Web
- ✅ جاهز لاستقبال Mobile App في المستقبل

---

## ❌ إذا واجهت مشاكل:

### المشكلة 1: `firebase: command not found`

**الحل:**
```bash
npm install -g firebase-tools
```

---

### المشكلة 2: `Permission denied`

**الحل:**
```bash
firebase login --reauth
```

---

### المشكلة 3: `Build failed`

**الحل:**
```bash
cd functions
rm -rf node_modules
npm install
npm run build
```

---

### المشكلة 4: `Deploy failed`

**الحل:**
1. تحقق من اتصال الإنترنت
2. تأكد من تسجيل الدخول: `firebase login`
3. تأكد من المشروع الصحيح: `firebase use pharmanow-754a7`
4. حاول مرة أخرى: `firebase deploy --only functions`

---

### المشكلة 5: الإشعارات لا تصل

**الحل:**
1. تحقق من Logs: `firebase functions:log`
2. تأكد من تفعيل FCM API (الخطوة 7)
3. تحقق من وجود FCM tokens في Firestore:
   ```
   Firebase Console > Firestore > fcmTokens collection
   ```
4. تأكد من وجود users في Firestore:
   ```
   Firebase Console > Firestore > users collection
   ```

---

## 📊 مراقبة النظام

### عرض Logs مباشرة:

```bash
firebase functions:log --follow
```

### عرض Logs في Firebase Console:

```
https://console.firebase.google.com/project/pharmanow-754a7/functions/logs
```

### إحصائيات الاستخدام:

```
https://console.firebase.google.com/project/pharmanow-754a7/functions/usage
```

---

## 🔄 تحديث Functions في المستقبل

إذا أردت تعديل الكود:

```bash
# 1. عدل الكود في functions/src/index.ts
# 2. Build
cd functions
npm run build

# 3. Deploy
npm run deploy
```

---

## 💡 نصائح مهمة:

1. **Logs هي صديقك:**
   - دائماً راجع الـ logs عند حدوث مشكلة
   - `firebase functions:log`

2. **اختبر قبل Deploy:**
   - استخدم Emulator للاختبار المحلي
   - `npm run serve` في مجلد functions

3. **راقب التكلفة:**
   - Firebase Console > Functions > Usage
   - الحصة المجانية كافية للاستخدام المتوسط

4. **Backup:**
   - احتفظ بنسخة من الكود
   - استخدم Git

---

## 📞 للمساعدة:

إذا واجهت أي مشكلة:
1. راجع Logs: `firebase functions:log`
2. راجع Firebase Console
3. تحقق من الخطوات أعلاه

---

## ✅ Checklist:

- [ ] تثبيت Firebase CLI
- [ ] تسجيل الدخول
- [ ] تثبيت Dependencies
- [ ] Build الكود
- [ ] Deploy Functions
- [ ] تفعيل FCM API
- [ ] اختبار النظام
- [ ] التحقق من Logs

---

**🎉 بالتوفيق! النظام جاهز للـ Deploy!**

بعد إتمام هذه الخطوات، سيكون نظام الإشعارات يعمل بالكامل ويمكنك إرسال إشعارات من صفحة الأدمن لجميع المستخدمين على Web والـ Mobile (عند إضافته).
