# إصلاح منطق حساب الأدوية في صفحة الصيدلي

## المشكلة
كان هناك خطأ في حساب عدد الأدوية والحد المسموح به:
- العداد يظهر 0/0 رغم وجود دواء واحد
- التحذير يظهر "تم الوصول للحد الأقصى" رغم عدم الوصول للحد
- الأدوية لا تظهر في القائمة بشكل صحيح

## السبب الجذري

### 1. تضارب في استخدام الـ Hooks
الصفحة كانت تستخدم hook-ين مختلفين:
- `useMedicines` - يجلب الأدوية من Firestore
- `usePharmacyMedicines` - يحسب الإحصائيات والحدود

هذا أدى إلى:
- بيانات مكررة
- عدم تزامن بين البيانات
- حسابات خاطئة

### 2. خطأ في نوع البيانات
```typescript
// الخطأ: pharmacyId يُمرر كـ string لكن في Firestore هو number
const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();

// في query:
where('pharmacyId', '==', effectivePharmacyId) // string
// لكن في Firestore:
pharmacyId: 1 // number
```

### 3. خطأ في دالة canPharmacyAddMedicine
```typescript
// الخطأ: تستخدم getPharmacyById بـ string ID
const pharmacy = await getPharmacyById(pharmacyId); // يبحث بـ document ID

// الصحيح: يجب استخدام getPharmacyByPharmacyId بـ number
const pharmacy = await getPharmacyByPharmacyId(pharmacyIdNum); // يبحث بـ pharmacyId field
```

## الحل المطبق

### 1. توحيد استخدام الـ Hooks
```typescript
// قبل:
const { medicines, isLoading, addMedicine, updateMedicine, deleteMedicine } = useMedicines(user?.pharmacyId, { enabled: hasPharmacyId });
const { groupedMedicines, stats: medicineStats, limitInfo } = usePharmacyMedicines(user?.pharmacyId?.toString());

// بعد:
const { 
  medicines,
  groupedMedicines, 
  stats: medicineStats, 
  limitInfo,
  isLoading,
  addMedicine: addMedicineFromHook,
  editMedicine,
} = usePharmacyMedicines(user?.pharmacyId?.toString());
```

### 2. إصلاح نوع البيانات في usePharmacyMedicines
```typescript
// إضافة متغير للـ pharmacyId كـ number
const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
const effectivePharmacyIdNumber = pharmacyId ? parseInt(pharmacyId) : user?.pharmacyId;

// استخدام الـ number في query
const q = query(
  collection(db, 'medicines'),
  where('pharmacyId', '==', effectivePharmacyIdNumber), // number بدلاً من string
  orderBy('createdAt', 'desc')
);
```

### 3. إصلاح canPharmacyAddMedicine
```typescript
export async function canPharmacyAddMedicine(pharmacyId: string): Promise<{
  canAdd: boolean;
  currentCount: number;
  limit: number;
}> {
  try {
    // تحويل string إلى number
    const pharmacyIdNum = parseInt(pharmacyId);
    if (isNaN(pharmacyIdNum)) {
      return { canAdd: false, currentCount: 0, limit: 0 };
    }
    
    // استخدام getPharmacyByPharmacyId بدلاً من getPharmacyById
    const pharmacy = await getPharmacyByPharmacyId(pharmacyIdNum);
    if (!pharmacy) {
      return { canAdd: false, currentCount: 0, limit: 0 };
    }
    
    return {
      canAdd: pharmacy.currentMedicineCount < pharmacy.medicineLimit,
      currentCount: pharmacy.currentMedicineCount,
      limit: pharmacy.medicineLimit,
    };
  } catch (error) {
    console.error('Error checking pharmacy medicine limit:', error);
    return { canAdd: false, currentCount: 0, limit: 0 };
  }
}
```

### 4. تحديث MedicineWithApproval Type
```typescript
export interface MedicineWithApproval {
  // ... الحقول الأساسية
  // إضافة الحقول الاختيارية من Medicine
  avgRating?: number;
  ratingCount?: number;
  discountRating?: number;
  isNewProduct?: boolean;
  sellingCount?: number;
  reviews?: Review[];
  subabaseORImageUrl?: string;
  pharmcyAddress?: string;
}
```

### 5. تبسيط دوال الحفظ والحذف
```typescript
// handleSubmit - استخدام editMedicine و addMedicineFromHook
const dataToSave = {
  name: formData.name,
  code: formData.code,
  description: formData.description,
  price: formData.price,
  quantity: formData.quantity,
  category: formData.category,
  manufacturer: formData.manufacturer,
  imageUrl: formData.subabaseORImageUrl,
  expiryDate: new Date(),
};

if (editingMedicine) {
  await editMedicine(editingMedicine.id, dataToSave);
} else {
  await addMedicineFromHook(dataToSave);
}

// handleDelete - حذف مباشر من Firestore
await deleteDoc(doc(db, 'medicines', id));
```

## النتيجة

### ✅ ما تم إصلاحه:
1. **العداد يعمل بشكل صحيح**: يظهر العدد الفعلي للأدوية والحد المسموح به
2. **التحذير دقيق**: يظهر فقط عند الوصول للحد الفعلي
3. **الأدوية تظهر**: جميع الأدوية تظهر في القائمة بشكل صحيح
4. **الإحصائيات صحيحة**: عدد الأدوية المعلقة/الموافق عليها/المرفوضة صحيح
5. **لا تضارب في البيانات**: استخدام hook واحد فقط
6. **الأداء أفضل**: عدد أقل من الاستعلامات

### 📊 قبل وبعد:

#### قبل الإصلاح:
```
العداد: 0 / 0
التحذير: "تم الوصول للحد الأقصى"
الأدوية: لا تظهر
الإحصائيات: 0 في كل شيء
```

#### بعد الإصلاح:
```
العداد: 1 / 100 (أو الحد الفعلي)
التحذير: يظهر فقط عند الوصول للحد
الأدوية: تظهر جميعها بشكل صحيح
الإحصائيات: دقيقة وصحيحة
```

## الملفات المعدلة

1. ✅ `src/hooks/usePharmacyMedicines.ts`
   - إصلاح نوع pharmacyId في query
   - إضافة effectivePharmacyIdNumber

2. ✅ `src/services/medicineService.ts`
   - إصلاح canPharmacyAddMedicine
   - استخدام getPharmacyByPharmacyId
   - إضافة import

3. ✅ `src/pages/pharmacist/PharmacistMedicines.tsx`
   - إزالة useMedicines
   - استخدام usePharmacyMedicines فقط
   - تبسيط handleSubmit و handleDelete
   - إزالة dynamic imports

4. ✅ `src/types/index.ts`
   - تحديث MedicineWithApproval
   - إضافة الحقول الاختيارية

## الدروس المستفادة

1. **توحيد مصدر البيانات**: استخدام hook واحد أفضل من استخدام عدة hooks
2. **التحقق من أنواع البيانات**: string vs number يمكن أن يسبب مشاكل كبيرة
3. **استخدام الدوال الصحيحة**: getPharmacyById vs getPharmacyByPharmacyId
4. **التوثيق مهم**: فهم الفرق بين document ID و field value

## التوصيات المستقبلية

1. **استخدام TypeScript بشكل أفضل**: تحديد أنواع البيانات بدقة
2. **اختبار الحالات الحدية**: التأكد من عمل الكود في جميع الحالات
3. **مراجعة الكود**: التأكد من عدم وجود تضارب في استخدام الـ hooks
4. **توحيد الأنواع**: استخدام نوع واحد للـ pharmacyId في كل المشروع

---

**تم الإصلاح بنجاح! ✅**
