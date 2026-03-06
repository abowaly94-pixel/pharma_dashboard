# دليل دمج نظام Pagination مع الصفحة الحالية

## الخيارات المتاحة

لديك خياران لتطبيق نظام الـ pagination:

### الخيار 1: استخدام الصفحة الجديدة (موصى به) ⭐

استخدام الصفحة الجديدة `AdminMedicinesPaginated.tsx` كما هي.

**المميزات:**
- ✅ جاهزة للاستخدام مباشرة
- ✅ لا تحتاج تعديلات
- ✅ أداء محسّن
- ✅ واجهة نظيفة

**الخطوات:**

1. **إضافة Route جديد:**

في ملف `src/App.tsx`:

```typescript
import AdminMedicinesPaginated from '@/pages/admin/AdminMedicinesPaginated';

// في الـ routes
<Route path="/admin/medicines-table" element={<AdminMedicinesPaginated />} />
```

2. **إضافة رابط في القائمة:**

في ملف القائمة الجانبية:

```typescript
{
  name: 'الأدوية (جدول)',
  href: '/admin/medicines-table',
  icon: Table
}
```

3. **الوصول للصفحة:**

افتح المتصفح على: `http://localhost:5173/admin/medicines-table`

---

### الخيار 2: دمج مع الصفحة الحالية

تعديل `AdminMedicines.tsx` الحالية لإضافة عرض جدولي مع pagination.

## خطوات الدمج التفصيلية

### 1. إضافة الـ Imports

في أول ملف `AdminMedicines.tsx`:

```typescript
// إضافة هذه الـ imports
import { useMedicinesPaginated } from '@/hooks/useMedicinesPaginated';
import { Pagination } from '@/components/ui/pagination';
import { MedicinesTable } from '@/components/admin/MedicinesTable';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
```

### 2. إضافة State للعرض

داخل الـ component:

```typescript
export default function AdminMedicines() {
  // ... الـ states الموجودة
  
  // إضافة هذه الـ states الجديدة
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [pageSize, setPageSize] = useState(20);
  const [usePagination, setUsePagination] = useState(false);
  
  // ... باقي الكود
}
```

### 3. إضافة Hook الـ Pagination

```typescript
// استخدام الـ hook الجديد عند تفعيل pagination
const paginatedData = useMedicinesPaginated({
  pageSize,
  sectionId: selectedSection !== 'all' ? selectedSection : undefined,
  category: selectedCategory !== 'all' ? selectedCategory : undefined
});

// اختيار البيانات حسب الوضع
const displayMedicines = usePagination ? paginatedData.medicines : filteredMedicines;
const isLoadingData = usePagination ? paginatedData.isLoading : isLoading;
```

### 4. إضافة Toggle للعرض

في قسم الـ Header، أضف أزرار التبديل:

```typescript
<div className="flex gap-2">
  {/* Toggle Pagination */}
  <Button
    variant={usePagination ? 'default' : 'outline'}
    onClick={() => setUsePagination(!usePagination)}
    className="font-cairo"
  >
    {usePagination ? 'إيقاف Pagination' : 'تفعيل Pagination'}
  </Button>

  {/* Toggle View Mode */}
  {usePagination && (
    <>
      <Button
        variant={viewMode === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('table')}
      >
        <TableIcon className="w-4 h-4 ml-2" />
        جدول
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setViewMode('grid')}
      >
        <LayoutGrid className="w-4 h-4 ml-2" />
        شبكة
      </Button>
    </>
  )}

  {/* باقي الأزرار الموجودة */}
</div>
```

### 5. تعديل قسم العرض

استبدل قسم عرض الأدوية بهذا الكود:

```typescript
{/* عرض الأدوية */}
{usePagination && viewMode === 'table' ? (
  // عرض جدولي مع pagination
  <>
    <MedicinesTable
      medicines={displayMedicines}
      onView={setSelectedMedicine}
      onEdit={handleOpenAddEdit}
      onDelete={handleDelete}
      isLoading={isLoadingData}
    />
    
    {/* Pagination Controls */}
    {!isLoadingData && paginatedData.totalPages > 1 && (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <Pagination
          currentPage={paginatedData.currentPage}
          totalPages={paginatedData.totalPages}
          onPageChange={paginatedData.goToPage}
          totalCount={paginatedData.totalCount}
          pageSize={pageSize}
        />
      </div>
    )}
  </>
) : (
  // العرض الشبكي الحالي (Grid)
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {displayMedicines.map((medicine, index) => (
      // ... الكود الحالي للـ cards
    ))}
  </div>
)}
```

### 6. إضافة اختيار عدد النتائج

في قسم الفلاتر:

```typescript
{usePagination && (
  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
    <SelectTrigger className="h-10 font-cairo w-32">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="10">10 أدوية</SelectItem>
      <SelectItem value="20">20 دواء</SelectItem>
      <SelectItem value="50">50 دواء</SelectItem>
      <SelectItem value="100">100 دواء</SelectItem>
    </SelectContent>
  </Select>
)}
```

## الكود الكامل للدمج

إليك مثال كامل لكيفية دمج النظام:

```typescript
import { useState } from 'react';
import { useMedicines } from '@/hooks/useMedicines';
import { useMedicinesPaginated } from '@/hooks/useMedicinesPaginated';
import { MedicinesTable } from '@/components/admin/MedicinesTable';
import { Pagination } from '@/components/ui/pagination';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';

export default function AdminMedicines() {
  // States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [usePagination, setUsePagination] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // الـ hook القديم (بدون pagination)
  const { 
    medicines, 
    isLoading, 
    searchQuery, 
    setSearchQuery 
  } = useMedicines();

  // الـ hook الجديد (مع pagination)
  const paginatedData = useMedicinesPaginated({
    pageSize,
    sectionId: selectedSection !== 'all' ? selectedSection : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined
  });

  // فلترة محلية للعرض القديم
  const filteredMedicines = medicines.filter(medicine => {
    if (selectedSection !== 'all' && medicine.sectionId !== selectedSection) return false;
    if (selectedCategory !== 'all' && medicine.category !== selectedCategory) return false;
    if (searchQuery && !medicine.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // اختيار البيانات حسب الوضع
  const displayMedicines = usePagination ? paginatedData.medicines : filteredMedicines;
  const isLoadingData = usePagination ? paginatedData.isLoading : isLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold font-cairo">إدارة الأدوية</h1>
          
          <div className="flex gap-2">
            {/* Toggle Pagination */}
            <Button
              variant={usePagination ? 'default' : 'outline'}
              onClick={() => setUsePagination(!usePagination)}
            >
              {usePagination ? '⚡ Pagination مفعّل' : 'تفعيل Pagination'}
            </Button>

            {/* View Mode (فقط مع pagination) */}
            {usePagination && (
              <>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  onClick={() => setViewMode('table')}
                >
                  <TableIcon className="w-4 h-4 ml-2" />
                  جدول
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4 ml-2" />
                  شبكة
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {/* Search */}
          <Input
            placeholder="بحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Section Filter */}
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger>
              <SelectValue placeholder="القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
              {/* ... الأقسام */}
            </SelectContent>
          </Select>

          {/* Page Size (فقط مع pagination) */}
          {usePagination && (
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Display */}
        {usePagination && viewMode === 'table' ? (
          // عرض جدولي
          <>
            <MedicinesTable
              medicines={displayMedicines}
              onView={(m) => console.log(m)}
              onEdit={(m) => console.log(m)}
              onDelete={(id) => console.log(id)}
              isLoading={isLoadingData}
            />
            
            {paginatedData.totalPages > 1 && (
              <Pagination
                currentPage={paginatedData.currentPage}
                totalPages={paginatedData.totalPages}
                onPageChange={paginatedData.goToPage}
                totalCount={paginatedData.totalCount}
                pageSize={pageSize}
              />
            )}
          </>
        ) : (
          // عرض شبكي (Grid) - الكود الحالي
          <div className="grid grid-cols-4 gap-4">
            {displayMedicines.map(medicine => (
              <div key={medicine.id}>
                {/* ... card الحالي */}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
```

## المقارنة بين الخيارين

| الميزة | الخيار 1 (صفحة جديدة) | الخيار 2 (دمج) |
|--------|----------------------|----------------|
| سهولة التطبيق | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| الوقت المطلوب | 5 دقائق | 30 دقيقة |
| التوافق | لا يؤثر على الكود الحالي | يحتاج تعديلات |
| المرونة | محدودة | عالية |
| الصيانة | سهلة | متوسطة |

## التوصية النهائية

**للبدء السريع:** استخدم الخيار 1 (الصفحة الجديدة)

**للتخصيص الكامل:** استخدم الخيار 2 (الدمج)

يمكنك البدء بالخيار 1 للتجربة، ثم الانتقال للخيار 2 لاحقاً إذا احتجت مزيد من التخصيص.

## الدعم والمساعدة

إذا واجهت أي مشاكل:

1. تحقق من Firebase Indexes (راجع `MEDICINES_PAGINATION_GUIDE.md`)
2. تأكد من تثبيت جميع المكونات
3. راجع console.log للأخطاء
4. تأكد من صلاحيات Firebase

## الخطوات التالية

بعد تطبيق النظام:

1. ✅ اختبر التنقل بين الصفحات
2. ✅ جرب الفلاتر المختلفة
3. ✅ قس الأداء (سرعة التحميل)
4. ✅ راقب استهلاك Firebase
5. ✅ اجمع ملاحظات المستخدمين

حظاً موفقاً! 🚀
