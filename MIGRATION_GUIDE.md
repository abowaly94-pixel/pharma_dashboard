# دليل تحويل pharmacyId من String إلى Integer

## المشكلة
Firebase بيخزن `pharmacyId` كـ **string** بدلاً من **integer**، والتطبيق المحمول محتاج integer.

## الحل

### الخطوة 1: تشغيل Migration Script

#### الطريقة الأولى: باستخدام ts-node
```bash
# تثبيت ts-node إذا لم يكن مثبت
npm install -D ts-node

# تشغيل السكريبت
npx ts-node scripts/migrate-pharmacy-ids.ts
```

#### الطريقة الثانية: باستخدام Firebase Functions
إذا كنت تستخدم Firebase Functions، يمكنك إضافة الكود كـ function وتشغيله مرة واحدة:

```typescript
// في functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const migratePharmacyIds = functions.https.onRequest(async (req, res) => {
  // نسخ كود الـ migration هنا
  // ...
  res.send('Migration completed!');
});
```

ثم:
```bash
firebase deploy --only functions:migratePharmacyIds
# افتح الرابط في المتصفح لتشغيل الـ function
```

### الخطوة 2: التحقق من النتائج

بعد تشغيل الـ migration، تحقق من Firebase Console:

#### في Firestore:
1. افتح `pharmacies` collection
2. اختر أي صيدلية
3. تأكد أن `pharmacyId` الآن **number** مش **string**

**قبل:**
```json
{
  "id": "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1",
  "pharmacyId": "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1",  // ❌ string
  "name": "صيدلية النور"
}
```

**بعد:**
```json
{
  "id": "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1",
  "pharmacyId": 10001,  // ✅ integer
  "name": "صيدلية النور"
}
```

### الخطوة 3: اختبار النظام

#### 1. اختبار إنشاء صيدلية جديدة
```typescript
// يجب أن يعطي pharmacyId = 10002, 10003, etc.
const newPharmacy = await createPharmacy({
  name: "صيدلية الشفاء",
  email: "shifa@pharmacy.com",
  password: "password123",
  // ...
}, adminId);

console.log(newPharmacy.pharmacyId); // يجب أن يكون integer
console.log(typeof newPharmacy.pharmacyId); // يجب أن يكون "number"
```

#### 2. اختبار إضافة دواء
```typescript
const medicine = await createMedicine(
  medicineData,
  10001, // pharmacyId كـ integer
  "صيدلية النور"
);

// تحقق من Firebase أن pharmacyId محفوظ كـ integer
```

#### 3. اختبار التطبيق المحمول
```dart
// في Flutter/Dart
class Pharmacy {
  final int pharmacyId;  // ✅ يجب أن يعمل بدون مشاكل
  
  Pharmacy.fromJson(Map<String, dynamic> json)
    : pharmacyId = json['pharmacyId'] as int;
}
```

## ماذا يفعل الـ Migration Script؟

السكريبت يقوم بـ:

1. ✅ جلب جميع الصيدليات من `pharmacies` collection
2. ✅ توليد أرقام integer فريدة (10001, 10002, 10003...)
3. ✅ تحديث `pharmacyId` في `pharmacies` collection
4. ✅ تحديث `pharmacyId` في `users` collection (للصيادلة)
5. ✅ تحديث `pharmacyId` في `medicines` collection
6. ✅ تحديث `pharmacyId` في `pending_medicines` collection
7. ✅ تحديث `pharmacyId` في `orders` collection

## خريطة التحويل

السكريبت يطبع خريطة توضح التحويل:

```
📊 خريطة التحويل:
  - صيدلية النور: "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1" → 10001
  - صيدلية الشفاء: "abc123xyz456" → 10002
  - صيدلية الأمل: "def789ghi012" → 10003
```

## استكشاف الأخطاء

### المشكلة: "pharmacyId is still a string"
**الحل:**
1. تأكد أن الـ migration script اشتغل بنجاح
2. افتح Firebase Console وتحقق يدوياً
3. امسح الـ cache في المتصفح
4. أعد تشغيل التطبيق

### المشكلة: "Cannot read pharmacyId"
**الحل:**
1. تأكد أن الكود الجديد متحدث في جميع الملفات
2. تأكد أن الـ types محدثة
3. أعد compile الكود: `npm run build`

### المشكلة: "Duplicate pharmacyId"
**الحل:**
السكريبت يستخدم sequential IDs، لكن إذا حصل تضارب:
```typescript
// في generateUniquePharmacyId()
// تأكد أنه يجلب آخر ID ويزيد عليه
const lastId = lastPharmacy.pharmacyId as number;
return lastId + 1;
```

## Rollback (التراجع)

إذا حصلت مشكلة وعايز ترجع للـ string:

```typescript
// Script للرجوع (استخدمه بحذر!)
const pharmacies = await getDocs(collection(db, 'pharmacies'));

for (const doc of pharmacies.docs) {
  const data = doc.data();
  await updateDoc(doc.ref, {
    pharmacyId: doc.id // رجوع للـ Firebase UID
  });
}
```

## ملاحظات مهمة

⚠️ **قبل تشغيل الـ migration:**
1. اعمل backup للـ Firestore database
2. جرب على test environment الأول
3. تأكد أن مفيش users شغالين على النظام

✅ **بعد الـ migration:**
1. الصيدليات الجديدة هتاخد IDs تلقائياً (10004, 10005...)
2. الأدوية الجديدة هتتخزن بـ integer pharmacyId
3. التطبيق المحمول هيشتغل بدون مشاكل

## الدعم

إذا واجهت أي مشكلة:
1. تحقق من الـ console logs
2. افتح Firebase Console وتحقق من البيانات
3. تأكد أن الـ types محدثة في الكود

---

**تم التحديث:** 2024
**الإصدار:** 1.0
