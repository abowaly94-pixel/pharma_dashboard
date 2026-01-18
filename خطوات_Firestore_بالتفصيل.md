# 📝 كيفية إنشاء fcm_config في Firestore - خطوة بخطوة

## 🎯 الهدف:
إنشاء document في Firestore لحفظ Access Token

---

## 🚀 الخطوات بالتفصيل:

### الخطوة 1: افتح Firestore

1. **اذهب إلى Firebase Console:**
   ```
   https://console.firebase.google.com/project/pharmanow-754a7/firestore
   ```

2. **أو:**
   - افتح Firebase Console: https://console.firebase.google.com
   - اختر مشروعك: `pharmanow-754a7`
   - من القائمة الجانبية، اضغط **"Firestore Database"**

---

### الخطوة 2: تحقق من وجود Collections

ستشاهد قائمة بالـ Collections الموجودة مثل:
- `users`
- `medicines`
- `orders`
- `notifications`
- إلخ...

---

### الخطوة 3: ابحث عن `system_settings`

#### إذا كان موجود:
1. **اضغط على `system_settings`**
2. **انتقل للخطوة 4**

#### إذا لم يكن موجود:
1. **اضغط "Start collection"** (أو **"+ Start collection"**)
2. **Collection ID:** اكتب `system_settings`
3. **اضغط "Next"**
4. **انتقل للخطوة 4**

---

### الخطوة 4: أنشئ Document `fcm_config`

#### إذا كنت في خطوة إنشاء Collection جديدة:

**Document ID:**
```
fcm_config
```

**Field:**
- **Field name:** `accessToken`
- **Type:** اختر `string`
- **Value:** الصق Access Token هنا (سنحصل عليه لاحقاً)

**اضغط "Save"**

---

#### إذا كان `system_settings` موجود بالفعل:

1. **اضغط على `system_settings`**
2. **اضغط "Add document"** (أو **"+ Add document"**)
3. **Document ID:** اكتب `fcm_config`
4. **Field:**
   - **Field name:** `accessToken`
   - **Type:** `string`
   - **Value:** الصق Access Token
5. **اضغط "Save"**

---

## 📸 الشكل النهائي في Firestore:

```
Firestore Database
│
├── users (collection)
├── medicines (collection)
├── orders (collection)
├── notifications (collection)
│
└── system_settings (collection)  ← هنا
    │
    └── fcm_config (document)  ← هنا
        │
        └── accessToken: "ya29.a0AfB_byC..." (field)  ← هنا
```

---

## 🎯 مثال بالصور (نصي):

### 1. صفحة Firestore الرئيسية:
```
┌─────────────────────────────────────┐
│ Firestore Database                  │
├─────────────────────────────────────┤
│ + Start collection                  │
│                                     │
│ Collections:                        │
│ ▼ users                            │
│ ▼ medicines                        │
│ ▼ orders                           │
│ ▼ notifications                    │
│ ▼ system_settings  ← اضغط هنا      │
└─────────────────────────────────────┘
```

### 2. داخل system_settings:
```
┌─────────────────────────────────────┐
│ system_settings                     │
├─────────────────────────────────────┤
│ + Add document                      │
│                                     │
│ Documents:                          │
│ ▼ fcm_config  ← اضغط هنا           │
│   (أو أنشئه إذا لم يكن موجود)      │
└─────────────────────────────────────┘
```

### 3. داخل fcm_config:
```
┌─────────────────────────────────────┐
│ fcm_config                          │
├─────────────────────────────────────┤
│ Fields:                             │
│                                     │
│ accessToken (string)                │
│ "ya29.a0AfB_byC..."                │
│                                     │
│ [Edit] [Delete]                     │
└─────────────────────────────────────┘
```

---

## 🔧 إذا أردت التعديل لاحقاً:

```
1. Firestore > system_settings > fcm_config
2. اضغط على field "accessToken"
3. اضغط "Edit" (أيقونة القلم ✏️)
4. الصق Access Token الجديد
5. اضغط "Update"
```

---

## 💡 نصائح:

### 1. إذا لم تجد "Start collection":
- تأكد من أنك في صفحة Firestore Database
- قد يكون الزر في الأعلى أو في المنتصف

### 2. إذا ظهرت رسالة خطأ:
- تأكد من أن Document ID هو `fcm_config` بالضبط
- تأكد من أن Field name هو `accessToken` بالضبط

### 3. للتحقق من النجاح:
- يجب أن ترى المسار:
  ```
  system_settings > fcm_config > accessToken
  ```

---

## 🎉 بعد الانتهاء:

### اختبر في Admin Panel:

```
1. افتح: http://localhost:5173/admin/notifications
2. يجب أن يظهر تبويب "Push (Mobile)" مفعّل ✅
3. إذا كان معطل، أعد تحميل الصفحة
```

---

## 📋 ملخص سريع:

```
1. افتح: https://console.firebase.google.com/project/pharmanow-754a7/firestore
2. اضغط على system_settings (أو أنشئه)
3. أنشئ document: fcm_config
4. أضف field: accessToken = "الصق Access Token"
5. Save ✅
```

---

**🚀 بعد هذه الخطوات، ارجع لـ Admin Panel وجرب إرسال Push Notification!**
