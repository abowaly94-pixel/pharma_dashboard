# اختبار بيانات Firebase 🔍

## كيفية التحقق من البيانات

### 1. افتح Console المتصفح
اضغط `F12` أو `Ctrl+Shift+I` لفتح Developer Tools

### 2. افتح صفحة إدارة المستخدمين
انتقل إلى `/admin/users`

### 3. شاهد الـ Console Logs
ستجد رسائل مثل:
```
User أحمد محمد: {cart: 3, favorites: 5, rawCart: Array(3), rawFavorites: Array(5)}
User سارة علي: {cart: 0, favorites: 2, rawCart: [], rawFavorites: Array(2)}
Total users loaded: 10
```

## بنية البيانات المتوقعة في Firebase

### مستند User في Firestore
```json
{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phoneNumber": "+201234567890",
  "role": "user",
  "profileImageUrl": "https://...",
  "cart": [
    {
      "count": 2,
      "medicineEntity": {
        "id": "med123",
        "name": "باراسيتامول",
        "price": 25.5
      }
    }
  ],
  "favorites": ["med123", "med456", "med789"],
  "pharmacyId": null,
  "pharmacyName": null,
  "createdAt": Timestamp,
  "isActive": true
}
```

### مستند Pharmacist في Firestore
```json
{
  "name": "د. محمد أحمد",
  "email": "pharmacist@example.com",
  "phoneNumber": "+201234567890",
  "role": "pharmacist",
  "profileImageUrl": "https://...",
  "cart": [],
  "favorites": [],
  "pharmacyId": 1,
  "pharmacyName": "صيدلية النور",
  "createdAt": Timestamp,
  "isActive": true
}
```

## المشاكل المحتملة وحلولها

### المشكلة 1: cart أو favorites يظهر 0 دائماً
**السبب**: البيانات في Firebase قد تكون:
- `null` بدلاً من `[]`
- `{}` (object فاضي) بدلاً من `[]`
- غير موجودة أصلاً

**الحل**: الكود الحالي يعالج كل هذه الحالات تلقائياً

### المشكلة 2: البيانات لا تظهر
**السبب المحتمل**:
1. لا يوجد مستخدمين في Firestore
2. مشكلة في الصلاحيات
3. خطأ في اسم Collection

**الحل**:
1. تحقق من Firebase Console أن collection اسمه `users`
2. تحقق من وجود بيانات فعلية
3. تحقق من Firestore Rules

### المشكلة 3: خطأ في orderBy
**السبب**: قد يكون Index غير موجود

**الحل**: 
- Firebase سيعطيك رابط لإنشاء Index
- أو احذف `orderBy` مؤقتاً للاختبار

## كيفية إضافة بيانات تجريبية

### من Firebase Console
1. افتح Firestore Database
2. اختر collection `users`
3. اضغط "Add document"
4. أضف البيانات التالية:

```
Document ID: (Auto-ID)

Fields:
- name: "مستخدم تجريبي"
- email: "test@example.com"
- phoneNumber: "+201234567890"
- role: "user"
- profileImageUrl: ""
- cart: [] (array)
- favorites: ["med1", "med2", "med3"] (array)
- createdAt: (timestamp - now)
- isActive: true (boolean)
```

## التحقق من صحة البيانات

### في الصفحة
1. افتح صفحة إدارة المستخدمين
2. يجب أن ترى:
   - اسم المستخدم
   - البريد الإلكتروني
   - رقم الهاتف (إن وجد)
   - الدور (badge ملون)
   - عدد المنتجات في السلة
   - عدد المنتجات المفضلة

### في نافذة التفاصيل
1. اضغط على "عرض التفاصيل"
2. يجب أن ترى:
   - صورة المستخدم
   - معلومات الاتصال كاملة
   - إحصائيات السلة والمفضلة
   - معرف المستخدم (UID)
   - تاريخ التسجيل

## ملاحظات مهمة

### البيانات Real-time
- البيانات تتحدث تلقائياً عند أي تغيير في Firestore
- لا تحتاج لتحديث الصفحة
- أي إضافة أو حذف أو تعديل يظهر فوراً

### الأداء
- الكود يستخدم `onSnapshot` للتحديث الفوري
- يتم ترتيب المستخدمين أبجدياً
- يتم معالجة البيانات بشكل آمن

### الأمان
- فقط المدراء يمكنهم رؤية هذه الصفحة
- البيانات محمية بـ Firestore Rules
- لا يمكن تعديل الأدوار من الواجهة
