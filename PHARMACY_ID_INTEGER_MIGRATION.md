# تحويل pharmacyId من String إلى Integer

## التغييرات المطبقة

تم تحويل `pharmacyId` من **string** إلى **integer** في جميع أنحاء النظام لتوافق مع التطبيق المحمول.

### 1. Types (src/types/index.ts)
تم تحديث جميع الـ interfaces:
- ✅ `User.pharmacyId`: `string` → `number`
- ✅ `Medicine.pharmacyId`: `string` → `number`
- ✅ `Pharmacy.pharmacyId`: `string` → `number`
- ✅ `PharmacyAccount.pharmacyId`: `string` → `number`
- ✅ `PharmacySession.pharmacyId`: `string` → `number`
- ✅ `MedicineWithApproval.pharmacyId`: `string` → `number`
- ✅ `MedicineFilters.pharmacyId`: `string` → `number`
- ✅ `Order.pharmacyId`: `string` → `number`

### 2. Services

#### pharmacyService.ts
- ✅ إضافة دالة `generateUniquePharmacyId()` لتوليد ID رقمي فريد يبدأ من 10001
- ✅ تحديث `createPharmacy()` لاستخدام ID رقمي بدلاً من Firebase UID
- ✅ تحديث `getPharmacyByPharmacyId()` للبحث بـ integer
- ✅ تحديث `mapFirestoreToPharmacy()` لتحويل pharmacyId إلى number

#### medicineService.ts
- ✅ تحديث `createMedicine()` لقبول `pharmacyId: number`
- ✅ تحديث `getMedicinesByPharmacy()` لقبول `pharmacyId: number`
- ✅ تحديث `updateMedicine()` لقبول `pharmacyId: number`
- ✅ تحديث `deleteMedicine()` لقبول `pharmacyId: number`
- ✅ تحديث `canPharmacyAddMedicine()` لقبول `pharmacyId: number`
- ✅ تحديث `getActualMedicineCount()` لقبول `pharmacyId: number`
- ✅ تحديث `getMedicinesGroupedByStatus()` لقبول `pharmacyId: number`

### 3. Hooks

#### usePharmacyMedicines.ts
- ✅ تحديث parameter type من `string?` إلى `number?`
- ✅ إزالة `.toString()` من جميع استخدامات `user?.pharmacyId`
- ✅ إضافة type conversion في `updateLimitInfo()` للتوافق

#### useMedicines.ts
- ✅ تحديث parameter type من `string?` إلى `number?`

#### useOrders.ts
- ✅ تحديث parameter type من `string?` إلى `number?`

#### useAutoNotifications.ts
- ✅ تحديث `notifyOrderStatusChange()` لقبول `pharmacyId: number`
- ✅ تحديث `notifyMedicineApproved()` لقبول `pharmacyId: number`
- ✅ تحديث `notifyMedicineRejected()` لقبول `pharmacyId: number`
- ✅ تحديث `notifyLowStock()` لقبول `pharmacyId: number`
- ✅ تحويل pharmacyId إلى string عند إرسال الإشعارات (للتوافق مع Firebase)

### 4. Components & Pages

#### PharmacistDashboard.tsx
- ✅ إزالة `.toString()` من `user?.pharmacyId`

#### PharmacistMedicines.tsx
- ✅ إزالة `.toString()` من `user?.pharmacyId`
- ✅ تحديث `notifyLowStock()` calls

#### PharmacistOrders.tsx
- ✅ استخدام `user?.pharmacyId` مباشرة بدون `.toString()`

#### AdminMedicines.tsx
- ✅ تحديث `formData.pharmacyId` من `string` إلى `number`
- ✅ تحديث Autocomplete لتحويل pharmacyId إلى string للعرض فقط

#### AdminMedicineReview.tsx
- ✅ تحديث filters لاستخدام `Number()` عند التحويل من Select value

#### AdminOrders.tsx
- ✅ إزالة `.toString()` من `order.pharmacyId`

## كيفية عمل النظام الجديد

### توليد pharmacyId
```typescript
async function generateUniquePharmacyId(): Promise<number> {
  const pharmaciesRef = collection(db, PHARMACIES_COLLECTION);
  const q = query(pharmaciesRef, orderBy('pharmacyId', 'desc'));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return 10001; // أول رقم صيدلية
  }
  
  const lastPharmacy = snapshot.docs[0].data();
  const lastId = lastPharmacy.pharmacyId as number;
  return lastId + 1;
}
```

### مثال على البيانات
```javascript
// قبل التحديث
{
  id: "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1",
  pharmacyId: "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1",
  name: "صيدلية النور"
}

// بعد التحديث
{
  id: "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1",
  pharmacyId: 10001,
  name: "صيدلية النور"
}
```

## ملاحظات مهمة

1. **Firebase Document ID** يبقى كما هو (string UID)
2. **pharmacyId** الآن integer مميز يبدأ من 10001
3. التطبيق المحمول يستخدم `pharmacyId` (integer) للتعامل مع الصيدليات
4. الإشعارات تحول pharmacyId إلى string عند الإرسال للتوافق مع Firebase

## الخطوات التالية

### للصيدليات الموجودة
يجب تحديث البيانات الموجودة في Firestore:
```javascript
// Script لتحديث الصيدليات الموجودة
const pharmacies = await getDocs(collection(db, 'pharmacies'));
let nextId = 10001;

for (const doc of pharmacies.docs) {
  await updateDoc(doc.ref, {
    pharmacyId: nextId++
  });
}
```

### للأدوية الموجودة
يجب تحديث pharmacyId في الأدوية:
```javascript
// Script لتحديث الأدوية
const medicines = await getDocs(collection(db, 'medicines'));
const pharmacyMap = {}; // map من string UID إلى integer ID

for (const doc of medicines.docs) {
  const data = doc.data();
  const pharmacy = await getPharmacyById(data.pharmacyId);
  
  await updateDoc(doc.ref, {
    pharmacyId: pharmacy.pharmacyId // integer
  });
}
```

## Testing

تأكد من اختبار:
- ✅ إنشاء صيدلية جديدة
- ✅ إضافة دواء جديد
- ✅ عرض أدوية الصيدلية
- ✅ تحديث دواء
- ✅ حذف دواء
- ✅ إرسال إشعارات
- ✅ عرض الطلبات
- ✅ فلترة الأدوية حسب الصيدلية

## التوافق مع التطبيق المحمول

التطبيق المحمول الآن يمكنه:
```dart
// Dart/Flutter
class Pharmacy {
  final int pharmacyId;  // ✅ integer
  final String name;
  
  Pharmacy.fromJson(Map<String, dynamic> json)
    : pharmacyId = json['pharmacyId'] as int,
      name = json['name'] as String;
}
```

تم التحديث بنجاح! 🎉
