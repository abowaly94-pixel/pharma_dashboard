# 🚀 تشغيل Migration لتحويل pharmacyId إلى Integer

## الطريقة السريعة (Recommended)

### 1. افتح Firebase Console
اذهب إلى: https://console.firebase.google.com

### 2. افتح Firestore Database
- اختر مشروعك
- اذهب إلى Firestore Database
- افتح `pharmacies` collection

### 3. تحديث يدوي (للاختبار السريع)

#### لصيدلية واحدة:
1. اختر أي صيدلية
2. اضغط على Edit (✏️)
3. غير `pharmacyId` من string إلى number:
   - **قبل:** `"wN1x6Mudc0X3Ba9y4M2lFfkEKqf1"` (string)
   - **بعد:** `10001` (number)
4. احفظ التغييرات

### 4. تحقق من النتيجة
```javascript
// في Firebase Console > Firestore
// يجب أن ترى:
pharmacyId: 10001  // بدون علامات تنصيص = integer ✅
```

## الطريقة الأوتوماتيكية (للبيانات الكثيرة)

### الخيار 1: استخدام Node.js Script

```bash
# 1. تثبيت ts-node
npm install -D ts-node @types/node

# 2. تشغيل السكريبت
npx ts-node scripts/migrate-pharmacy-ids.ts
```

### الخيار 2: استخدام Firebase Console Script

1. افتح Firebase Console
2. اذهب إلى Firestore Database
3. اضغط على "Start collection" أو افتح أي collection
4. افتح Developer Tools (F12)
5. اذهب إلى Console tab
6. الصق هذا الكود:

```javascript
// ⚠️ تأكد أنك في Firebase Console قبل تشغيل هذا الكود

async function migratePharmacyIds() {
  console.log('🚀 بدء التحويل...');
  
  // جلب جميع الصيدليات
  const pharmaciesRef = firebase.firestore().collection('pharmacies');
  const snapshot = await pharmaciesRef.get();
  
  let nextId = 10001;
  const batch = firebase.firestore().batch();
  
  snapshot.forEach(doc => {
    console.log(`تحديث ${doc.data().name}: ${doc.data().pharmacyId} → ${nextId}`);
    batch.update(doc.ref, { pharmacyId: nextId });
    nextId++;
  });
  
  await batch.commit();
  console.log('✅ تم التحويل بنجاح!');
}

// تشغيل
migratePharmacyIds();
```

### الخيار 3: استخدام Firebase CLI

```bash
# 1. تسجيل الدخول
firebase login

# 2. إنشاء script مؤقت
# أنشئ ملف: temp-migrate.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrate() {
  const pharmacies = await db.collection('pharmacies').get();
  let nextId = 10001;
  
  const batch = db.batch();
  
  pharmacies.forEach(doc => {
    batch.update(doc.ref, { pharmacyId: nextId });
    console.log(`${doc.data().name}: ${nextId}`);
    nextId++;
  });
  
  await batch.commit();
  console.log('✅ Done!');
}

migrate();

# 3. تشغيل
node temp-migrate.js
```

## التحقق من النجاح

### في Firebase Console:
```
pharmacyId: 10001  ✅ (number - بدون علامات تنصيص)
pharmacyId: "10001"  ❌ (string - بعلامات تنصيص)
```

### في الكود:
```typescript
const pharmacy = await getPharmacyById('someId');
console.log(typeof pharmacy.pharmacyId); // يجب أن يطبع "number"
```

### في التطبيق المحمول:
```dart
// يجب أن يعمل بدون أخطاء
final pharmacyId = json['pharmacyId'] as int;
```

## ملاحظات مهمة

1. ✅ الكود الجديد **جاهز** ويحفظ integer تلقائياً
2. ⚠️ البيانات القديمة محتاجة migration
3. 🔄 بعد الـ migration، كل صيدلية جديدة هتاخد ID تلقائي (10002, 10003...)

## إذا ظهرت مشاكل

### المشكلة: "لسه string في Firebase"
**الحل:**
- امسح cache المتصفح
- أعد تحميل Firebase Console
- تحقق من الـ migration script أنه اشتغل

### المشكلة: "التطبيق المحمول بيرجع error"
**الحل:**
- تأكد أن الـ migration تم بنجاح
- تحقق من Firebase Console يدوياً
- أعد تشغيل التطبيق المحمول

---

**بعد الـ Migration:**
- ✅ pharmacyId الآن integer في Firebase
- ✅ الكود يحفظ integer تلقائياً
- ✅ التطبيق المحمول يشتغل بدون مشاكل
