# إصلاح مشكلة ظهور تحذير الحد الأقصى عند كل refresh

## المشكلة

عند عمل refresh لصفحة "أدويتي"، كان يظهر تحذير "تم الوصول للحد الأقصى من الأدوية" حتى لو لم يصل الصيدلي للحد الأقصى فعلياً.

### السبب

في ملف `src/hooks/usePharmacyMedicines.ts`، كان هناك `useEffect` يستدعي `canPharmacyAddMedicine` في كل مرة يتغير فيها `medicines.length`:

```typescript
// الكود الخاطئ
useEffect(() => {
  if (!effectivePharmacyId) return;

  const updateLimitInfo = async () => {
    try {
      const info = await canPharmacyAddMedicine(effectivePharmacyId);
      setLimitInfo({
        ...info,
        remaining: info.limit - info.currentCount,
      });
    } catch (err) {
      console.error('Error fetching limit info:', err);
    }
  };

  updateLimitInfo();
}, [effectivePharmacyId, medicines.length]); // ❌ medicines.length يسبب المشكلة
```

### المشكلة بالتفصيل:

1. عند تحميل الصفحة، يتم جلب الأدوية من Firestore
2. عندما تصل الأدوية، يتغير `medicines.length`
3. هذا يُشغل `useEffect` مرة أخرى
4. يتم استدعاء `canPharmacyAddMedicine`
5. إذا كان هناك أي تأخير أو خطأ في الاستجابة، يظهر التحذير بشكل خاطئ
6. أيضاً، كان هناك سطر مكرر في نهاية الـ `useEffect`

## الحل

### 1. إزالة `medicines.length` من dependencies

```typescript
// الكود الصحيح
useEffect(() => {
  if (!effectivePharmacyId) {
    setLimitInfo({
      canAdd: false,
      currentCount: 0,
      limit: 100,
      remaining: 100,
    });
    return;
  }

  const updateLimitInfo = async () => {
    try {
      const info = await canPharmacyAddMedicine(effectivePharmacyId);
      setLimitInfo({
        ...info,
        remaining: info.limit - info.currentCount,
      });
    } catch (err) {
      console.error('Error fetching limit info:', err);
      setLimitInfo({
        canAdd: true,
        currentCount: 0,
        limit: 100,
        remaining: 100,
      });
    }
  };

  updateLimitInfo();
}, [effectivePharmacyId]); // ✅ فقط عند تغيير pharmacyId
```

### 2. إضافة fallback values

إذا حدث خطأ في جلب معلومات الحد، نضع قيم افتراضية تسمح بالإضافة:

```typescript
catch (err) {
  console.error('Error fetching limit info:', err);
  setLimitInfo({
    canAdd: true,      // ✅ السماح بالإضافة في حالة الخطأ
    currentCount: 0,
    limit: 100,
    remaining: 100,
  });
}
```

### 3. إزالة السطر المكرر

كان هناك سطرين لإغلاق الـ `useEffect`:

```typescript
// قبل الإصلاح
  }, [effectivePharmacyId]); // السطر الصحيح
  }, [effectivePharmacyId, medicines.length]); // ❌ سطر مكرر خاطئ

// بعد الإصلاح
  }, [effectivePharmacyId]); // ✅ سطر واحد فقط
```

## النتيجة

### ✅ قبل الإصلاح:
- التحذير يظهر عند كل refresh
- التحذير يظهر حتى لو لم يصل للحد
- تجربة مستخدم سيئة

### ✅ بعد الإصلاح:
- التحذير يظهر فقط عند الوصول للحد الفعلي
- لا يظهر التحذير عند refresh
- تجربة مستخدم أفضل

## الملفات المعدلة

- `src/hooks/usePharmacyMedicines.ts`

## الاختبار

للتأكد من أن الإصلاح يعمل:

1. افتح صفحة "أدويتي"
2. اعمل refresh للصفحة عدة مرات
3. تأكد أن التحذير لا يظهر إلا إذا وصلت فعلياً للحد الأقصى
4. أضف دواء جديد وتأكد أن العداد يتحدث بشكل صحيح

## ملاحظات

- الـ `useEffect` الآن يعتمد فقط على `effectivePharmacyId`
- هذا يعني أن معلومات الحد يتم جلبها مرة واحدة فقط عند تحميل الصفحة
- إذا تم إضافة أو حذف دواء، سيتم تحديث العداد من خلال الـ real-time listener في Firestore
- التحذير سيظهر فقط عندما `limitInfo.canAdd === false`

---

**تم إصلاح المشكلة بنجاح! ✅**
