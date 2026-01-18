# 🔑 كيفية الحصول على FCM Server Key

## ⚠️ المشكلة في الصورة:
**Cloud Messaging API (Legacy)** معطل (Disabled)

---

## ✅ الحل - تفعيل Legacy API:

### الخطوة 1: تفعيل Cloud Messaging API (Legacy)

1. **في نفس الصفحة اللي أنت فيها:**
   ```
   https://console.firebase.google.com/project/pharmanow-754a7/settings/cloudmessaging
   ```

2. **اضغط على الـ 3 نقاط (⋮) بجانب "Cloud Messaging API (Legacy)"**

3. **اختر "Enable"** أو **"تفعيل"**

4. **انتظر 1-2 دقيقة حتى يتم التفعيل**

5. **أعد تحميل الصفحة**

---

### الخطوة 2: نسخ Server Key

بعد التفعيل، ستظهر لك:

```
Cloud Messaging API (Legacy) ✓ Enabled

Server key: AIzaSy...........................
```

**انسخ الـ Server key**

---

### الخطوة 3: حفظ الـ Key في Firestore

#### الطريقة 1: من Firebase Console (الأسهل)

1. **اذهب إلى Firestore:**
   ```
   https://console.firebase.google.com/project/pharmanow-754a7/firestore
   ```

2. **اضغط "Start collection"** (إذا لم يكن موجود)

3. **Collection ID:** `system_settings`

4. **Document ID:** `fcm_config`

5. **أضف Field:**
   - **Field:** `serverKey`
   - **Type:** `string`
   - **Value:** الصق الـ Server Key اللي نسخته

6. **اضغط "Save"**

---

#### الطريقة 2: من الكود (إذا تريد)

```javascript
// في Firebase Console > Firestore > Add document
{
  "serverKey": "AIzaSy..........................."
}
```

---

## 🎯 التحقق من النجاح:

### 1. تحقق من Firestore:
```
Firestore > system_settings > fcm_config > serverKey
```
يجب أن ترى الـ key محفوظ ✅

### 2. جرب في Admin Panel:
```
1. افتح: http://localhost:5173/admin/notifications
2. يجب أن يظهر تبويب "Push (Mobile)" مفعّل ✅
3. إذا كان معطل، أعد تحميل الصفحة
```

---

## 📸 الخطوات بالصور:

### الخطوة 1: تفعيل Legacy API
```
Cloud Messaging API (Legacy) ⊗ Disabled
                              ⋮  ← اضغط هنا
                              ↓
                           Enable ← اختر هذا
```

### الخطوة 2: بعد التفعيل
```
Cloud Messaging API (Legacy) ✓ Enabled

Server key: AIzaSy...........................
            ↑
         انسخ هذا
```

### الخطوة 3: في Firestore
```
Firestore Database
├── system_settings (collection)
    └── fcm_config (document)
        └── serverKey: "AIzaSy..." (field)
```

---

## ⚠️ ملاحظات مهمة:

### 1. Legacy API vs V1 API:
- **Legacy API:** سهل الاستخدام، يعمل من Frontend
- **V1 API:** يحتاج Backend/Cloud Functions
- **نحن نستخدم Legacy** لأنه أبسط ومجاني

### 2. الأمان:
- ✅ Server Key حساس
- ✅ احفظه في Firestore فقط
- ✅ لا تشاركه في الكود
- ✅ لا تنشره على GitHub

### 3. الصلاحيات:
- Legacy API يسمح بالإرسال من Frontend
- آمن لأن Firestore محمي بـ Security Rules

---

## 🆘 إذا واجهت مشكلة:

### المشكلة 1: لا أجد خيار "Enable"

**الحل:**
- تأكد من أنك Admin في المشروع
- جرب من متصفح آخر
- امسح الـ cache

### المشكلة 2: Legacy API لا يظهر

**الحل:**
- تأكد من الرابط الصحيح:
  ```
  https://console.firebase.google.com/project/pharmanow-754a7/settings/cloudmessaging
  ```
- أعد تحميل الصفحة

### المشكلة 3: Server Key لا يظهر بعد التفعيل

**الحل:**
- انتظر 2-3 دقائق
- أعد تحميل الصفحة
- تحقق من أن التفعيل نجح (يجب أن يظهر ✓ Enabled)

---

## 🎉 بعد الانتهاء:

### اختبر النظام:

```
1. افتح: http://localhost:5173/admin/notifications
2. اختر تبويب "Push (Mobile)"
3. املأ النموذج:
   - العنوان: "اختبار"
   - المحتوى: "هذا إشعار تجريبي"
   - المستهدفون: "الجميع"
4. اضغط "إرسال Push Notification"
5. يجب أن ترى: "تم إرسال X إشعار بنجاح" ✅
```

---

## 📋 ملخص الخطوات:

```
1. تفعيل Legacy API (⋮ > Enable)
2. نسخ Server Key
3. حفظه في Firestore:
   - Collection: system_settings
   - Document: fcm_config
   - Field: serverKey
4. اختبار من Admin Panel ✅
```

---

**🚀 بعد هذه الخطوات، سيعمل Push Notifications بنجاح!**
