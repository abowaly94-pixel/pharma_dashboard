# 🎉 الحل النهائي - استخدام V1 API

## ✅ تم تحديث الكود لاستخدام V1 API (المفعّل بالفعل)

---

## 🚀 كيفية الحصول على Access Token (3 خطوات):

### الخطوة 1: اذهب إلى OAuth 2.0 Playground

افتح:
```
https://developers.google.com/oauthplayground/
```

---

### الخطوة 2: إعداد OAuth Playground

1. **اضغط على أيقونة الإعدادات (⚙️) في الأعلى**

2. **فعّل "Use your own OAuth credentials"**

3. **أدخل:**
   - **OAuth Client ID:** (سنحصل عليه من Firebase)
   - **OAuth Client secret:** (سنحصل عليه من Firebase)

---

### الخطوة 3: الحصول على OAuth Credentials من Firebase

#### أ. اذهب إلى Google Cloud Console:
```
https://console.cloud.google.com/apis/credentials?project=pharmanow-754a7
```

#### ب. أنشئ OAuth 2.0 Client ID:

1. **اضغط "+ CREATE CREDENTIALS"**
2. **اختر "OAuth client ID"**
3. **Application type:** اختر "Web application"
4. **Name:** اكتب "FCM Notifications"
5. **Authorized redirect URIs:** أضف:
   ```
   https://developers.google.com/oauthplayground
   ```
6. **اضغط "CREATE"**
7. **انسخ:**
   - Client ID
   - Client secret

---

### الخطوة 4: في OAuth Playground

1. **ارجع لـ OAuth Playground**
2. **في الإعدادات (⚙️):**
   - الصق Client ID
   - الصق Client secret
   - اضغط "Close"

3. **في Step 1 (Select & authorize APIs):**
   - ابحث عن: `Firebase Cloud Messaging API v1`
   - أو اكتب: `https://www.googleapis.com/auth/firebase.messaging`
   - فعّله ✅
   - اضغط "Authorize APIs"

4. **سجل دخول بحساب Google** (نفس الحساب المرتبط بـ Firebase)

5. **اضغط "Allow"**

6. **في Step 2 (Exchange authorization code for tokens):**
   - اضغط "Exchange authorization code for tokens"
   - **انسخ "Access token"** ✅

---

### الخطوة 5: احفظ Access Token في Firestore

1. **اذهب إلى Firestore:**
   ```
   https://console.firebase.google.com/project/pharmanow-754a7/firestore
   ```

2. **أنشئ/عدّل:**
   ```
   Collection: system_settings
   Document: fcm_config
   Field: accessToken = "الصق Access Token هنا"
   ```

---

## 🎯 اختبار:

```
1. افتح: http://localhost:5173/admin/notifications
2. يجب أن يظهر تبويب "Push (Mobile)" مفعّل ✅
3. جرب إرسال إشعار
```

---

## ⚠️ ملاحظات مهمة:

### 1. Access Token ينتهي بعد ساعة:
- يجب تجديده كل ساعة
- أو استخدام Refresh Token (متقدم)

### 2. للاستخدام الدائم:
- الأفضل استخدام Service Account
- أو Cloud Functions
- أو Backend API

### 3. للاختبار:
- Access Token يكفي
- جدده كل ساعة من OAuth Playground

---

## 🔄 تجديد Access Token:

عندما ينتهي (بعد ساعة):

```
1. ارجع لـ OAuth Playground
2. في Step 2، اضغط "Refresh access token"
3. انسخ الـ Access Token الجديد
4. حدّثه في Firestore
```

---

## 📋 ملخص الخطوات:

```
1. Google Cloud Console > Create OAuth Client ID
2. OAuth Playground > Use your credentials
3. Authorize Firebase Cloud Messaging API v1
4. Get Access Token
5. Save in Firestore: system_settings/fcm_config/accessToken
6. Test in Admin Panel ✅
```

---

## 🎉 بعد هذه الخطوات:

**Push Notifications ستعمل من Admin Panel!**

- ✅ بدون Cloud Functions
- ✅ بدون Blaze Plan
- ✅ باستخدام V1 API المفعّل
- ⏰ يحتاج تجديد كل ساعة (للاختبار)

---

## 💡 للاستخدام الدائم (اختياري):

إذا أردت حل دائم بدون تجديد كل ساعة:

### الخيار 1: Service Account (موصى به)
- استخدم Service Account JSON
- يحتاج Backend/Cloud Functions

### الخيار 2: Refresh Token
- احفظ Refresh Token من OAuth Playground
- استخدمه لتجديد Access Token تلقائياً

### الخيار 3: Cloud Functions
- ترقية لـ Blaze Plan
- استخدام Cloud Functions (الحل الأمثل)

---

**🚀 للاختبار الآن: استخدم Access Token (يكفي لساعة)**
