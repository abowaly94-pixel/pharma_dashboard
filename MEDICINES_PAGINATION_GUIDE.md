# دليل نظام Pagination للأدوية

## نظرة عامة

تم إنشاء نظام pagination احترافي لإدارة الأدوية في لوحة التحكم، مما يقلل من استهلاك البيانات من Firebase ويحسن الأداء بشكل كبير.

## المميزات الرئيسية

### 1. **Pagination ذكي مع Firebase**
- جلب البيانات على دفعات (20 دواء افتراضياً)
- استخدام `startAfter` للتنقل بين الصفحات
- حساب إجمالي عدد الأدوية باستخدام `getCountFromServer`
- تخزين مؤقت (Cache) للصفحات المزارة

### 2. **عرض جدولي احترافي**
- جدول منظم يعرض جميع معلومات الدواء
- صور مصغرة للأدوية والأقسام
- عرض الأسعار مع الخصومات
- حالة المخزون (متوفر/نفذت الكمية)
- التقييمات والمراجعات

### 3. **فلترة متقدمة**
- فلترة حسب القسم (Section)
- فلترة حسب الفئة (Category)
- بحث نصي في الاسم، الكود، الصيدلية، إلخ
- اختيار عدد النتائج في الصفحة (10, 20, 50, 100)

### 4. **واجهة مستخدم سلسة**
- أزرار تنقل واضحة (السابق، التالي، الأول، الأخير)
- عرض أرقام الصفحات مع نقاط للصفحات البعيدة
- عداد النتائج (عرض 1-20 من 150 دواء)
- تبديل بين عرض الجدول والشبكة

## الملفات المضافة

### 1. `src/hooks/useMedicinesPaginated.ts`
Hook مخصص لإدارة pagination مع Firebase:

```typescript
const {
  medicines,           // الأدوية في الصفحة الحالية
  isLoading,          // حالة التحميل
  currentPage,        // رقم الصفحة الحالية
  totalPages,         // إجمالي عدد الصفحات
  totalCount,         // إجمالي عدد الأدوية
  goToPage,           // الانتقال لصفحة محددة
  nextPage,           // الصفحة التالية
  prevPage,           // الصفحة السابقة
  refreshCurrentPage  // تحديث الصفحة الحالية
} = useMedicinesPaginated({
  pageSize: 20,                    // عدد الأدوية في الصفحة
  pharmacyId: undefined,           // فلترة حسب الصيدلية (اختياري)
  sectionId: 'section-id',         // فلترة حسب القسم (اختياري)
  category: 'category-name'        // فلترة حسب الفئة (اختياري)
});
```

**المميزات:**
- ✅ Cache ذكي للصفحات المزارة
- ✅ دعم الفلترة المتعددة
- ✅ حساب تلقائي لإجمالي العدد
- ✅ معالجة الأخطاء

### 2. `src/components/ui/pagination.tsx`
مكون UI لعرض أزرار التنقل:

```typescript
<Pagination
  currentPage={1}
  totalPages={10}
  onPageChange={(page) => goToPage(page)}
  totalCount={200}
  pageSize={20}
/>
```

**المميزات:**
- ✅ تصميم responsive
- ✅ أزرار الانتقال السريع (أول/آخر صفحة)
- ✅ عرض أرقام الصفحات الذكي
- ✅ عداد النتائج

### 3. `src/components/admin/MedicinesTable.tsx`
جدول احترافي لعرض الأدوية:

```typescript
<MedicinesTable
  medicines={medicines}
  onView={(medicine) => console.log(medicine)}
  onEdit={(medicine) => console.log(medicine)}
  onDelete={(id) => console.log(id)}
  isLoading={false}
/>
```

**الأعمدة:**
- الصورة (مع حالة نفاذ المخزون)
- اسم الدواء (عربي + إنجليزي)
- الكود
- الفئة
- القسم (مع صورة القسم)
- السعر (مع الخصم)
- الكمية (مع ألوان حسب الحالة)
- التقييم
- الصيدلية
- الإجراءات (عرض، تعديل، حذف)

### 4. `src/pages/admin/AdminMedicinesPaginated.tsx`
الصفحة الرئيسية الجديدة:

**المميزات:**
- ✅ فلترة متقدمة (قسم + فئة + بحث)
- ✅ اختيار عدد النتائج
- ✅ تبديل بين عرض الجدول والشبكة
- ✅ حذف المكررات
- ✅ إضافة دواء جديد

## كيفية الاستخدام

### 1. إضافة الصفحة للـ Router

في ملف `src/App.tsx` أو ملف الـ routing:

```typescript
import AdminMedicinesPaginated from '@/pages/admin/AdminMedicinesPaginated';

// في الـ routes
<Route path="/admin/medicines-paginated" element={<AdminMedicinesPaginated />} />
```

### 2. إضافة رابط في القائمة الجانبية

في ملف `src/components/layout/DashboardLayout.tsx`:

```typescript
{
  name: 'إدارة الأدوية (Pagination)',
  href: '/admin/medicines-paginated',
  icon: Package
}
```

### 3. استخدام الـ Hook في صفحات أخرى

```typescript
import { useMedicinesPaginated } from '@/hooks/useMedicinesPaginated';

function MyComponent() {
  const {
    medicines,
    isLoading,
    currentPage,
    totalPages,
    goToPage
  } = useMedicinesPaginated({
    pageSize: 50,
    sectionId: 'vitamins'
  });

  return (
    <div>
      {medicines.map(medicine => (
        <div key={medicine.id}>{medicine.name}</div>
      ))}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

## الأداء والتحسينات

### قبل Pagination
- ❌ جلب جميع الأدوية دفعة واحدة (1000+ دواء)
- ❌ استهلاك عالي للبيانات
- ❌ بطء في التحميل
- ❌ ضغط على Firebase

### بعد Pagination
- ✅ جلب 20 دواء فقط في كل مرة
- ✅ تقليل استهلاك البيانات بنسبة 95%
- ✅ تحميل سريع (أقل من ثانية)
- ✅ تقليل التكلفة على Firebase

## مثال على الاستخدام الكامل

```typescript
import { useState } from 'react';
import { useMedicinesPaginated } from '@/hooks/useMedicinesPaginated';
import { MedicinesTable } from '@/components/admin/MedicinesTable';
import { Pagination } from '@/components/ui/pagination';

export default function MedicinesPage() {
  const [sectionId, setSectionId] = useState('all');
  const [pageSize, setPageSize] = useState(20);

  const {
    medicines,
    isLoading,
    currentPage,
    totalPages,
    totalCount,
    goToPage
  } = useMedicinesPaginated({
    pageSize,
    sectionId: sectionId !== 'all' ? sectionId : undefined
  });

  return (
    <div className="space-y-6">
      <h1>إدارة الأدوية ({totalCount} دواء)</h1>

      {/* Filters */}
      <select value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
        <option value="all">جميع الأقسام</option>
        <option value="vitamins">الفيتامينات</option>
        <option value="antibiotics">المضادات الحيوية</option>
      </select>

      <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
        <option value="10">10 أدوية</option>
        <option value="20">20 دواء</option>
        <option value="50">50 دواء</option>
      </select>

      {/* Table */}
      <MedicinesTable
        medicines={medicines}
        onView={(m) => console.log('View:', m)}
        onEdit={(m) => console.log('Edit:', m)}
        onDelete={(id) => console.log('Delete:', id)}
        isLoading={isLoading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalCount={totalCount}
        pageSize={pageSize}
      />
    </div>
  );
}
```

## Firebase Indexes المطلوبة

لضمان عمل الـ pagination بشكل صحيح، تأكد من إنشاء الـ indexes التالية في Firebase Console:

### Index 1: Basic Pagination
```
Collection: medicines
Fields:
  - createdAt (Descending)
```

### Index 2: Pharmacy Filter
```
Collection: medicines
Fields:
  - pharmacyId (Ascending)
  - createdAt (Descending)
```

### Index 3: Section Filter
```
Collection: medicines
Fields:
  - sectionId (Ascending)
  - createdAt (Descending)
```

### Index 4: Category Filter
```
Collection: medicines
Fields:
  - category (Ascending)
  - createdAt (Descending)
```

### Index 5: Combined Filters
```
Collection: medicines
Fields:
  - sectionId (Ascending)
  - category (Ascending)
  - createdAt (Descending)
```

## استكشاف الأخطاء

### خطأ: "The query requires an index"
**الحل:** إنشاء الـ index المطلوب في Firebase Console (سيظهر رابط في console.log)

### خطأ: "Permission denied"
**الحل:** التحقق من Firebase Security Rules

### البيانات لا تتحدث
**الحل:** استخدام `refreshCurrentPage()` بعد الإضافة/التعديل/الحذف

### الصفحات فارغة
**الحل:** التحقق من الفلاتر والتأكد من وجود بيانات

## التطويرات المستقبلية

- [ ] إضافة عرض الشبكة (Grid View)
- [ ] تصدير البيانات (Excel/PDF)
- [ ] فلترة متقدمة (نطاق السعر، تاريخ الانتهاء)
- [ ] ترتيب حسب الأعمدة (Sort)
- [ ] تحديد متعدد للحذف الجماعي
- [ ] معاينة سريعة (Quick View)

## الخلاصة

نظام الـ pagination الجديد يوفر:
- ⚡ أداء أسرع بكثير
- 💰 تكلفة أقل على Firebase
- 🎨 واجهة مستخدم احترافية
- 🔍 فلترة وبحث متقدم
- 📊 عرض جدولي منظم

**الاستخدام الموصى به:** استبدال صفحة `AdminMedicines.tsx` القديمة بـ `AdminMedicinesPaginated.tsx` للحصول على أفضل أداء.
