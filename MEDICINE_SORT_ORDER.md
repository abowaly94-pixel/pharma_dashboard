# ميزة ترتيب الأدوية (Medicine Sort Order)

## نظرة عامة
تم إضافة خاصية `sortOrder` للتحكم في ترتيب عرض الأدوية في التطبيق.

## التغييرات المطبقة

### 1. إضافة حقل `sortOrder` في نوع Medicine
```typescript
export interface Medicine {
  // ... الحقول الأخرى
  sortOrder?: number; // ترتيب العرض - رقم أقل يظهر أولاً
}
```

### 2. تحديث منطق الترتيب في `useMedicines`
- الأدوية تُرتب أولاً حسب `sortOrder` (تصاعدي)
- إذا كان `sortOrder` متساوي، يتم الترتيب حسب `createdAt` (الأحدث أولاً)
- القيمة الافتراضية: `999999` للأدوية بدون ترتيب محدد

### 3. واجهة التحكم في الترتيب
تم إضافة عمود جديد في جدول الأدوية يحتوي على:
- زر ⬆️ لتحريك الدواء لأعلى
- عرض رقم الترتيب الحالي
- زر ⬇️ لتحريك الدواء لأسفل

## كيفية الاستخدام

### في صفحة إدارة الأدوية
1. افتح صفحة "إدارة الأدوية"
2. ستجد عمود "الترتيب" في بداية الجدول
3. استخدم الأزرار لتحريك الأدوية لأعلى أو لأسفل
4. التغييرات تُحفظ تلقائياً في Firebase

### برمجياً
```typescript
// استخدام hook
const { updateSortOrder } = useMedicines();

// تحديث الترتيب
await updateSortOrder(medicineId, newOrderNumber);
```

## ملاحظات تقنية
- الترتيب يعمل في الوقت الفعلي (Real-time)
- التحديثات تُطبق مباشرة على Firebase
- لا يوجد toast notifications لتجنب الإزعاج عند التحريك المتكرر
- الأزرار تُعطل تلقائياً في بداية ونهاية القائمة

## الملفات المعدلة
- `src/types/index.ts` - إضافة حقل sortOrder
- `src/hooks/useMedicines.ts` - منطق الترتيب والتحديث
- `src/components/admin/MedicinesTable.tsx` - واجهة التحكم
- `src/pages/admin/AdminMedicinesPaginated.tsx` - دمج الميزة
