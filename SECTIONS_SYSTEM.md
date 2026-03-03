# نظام الأقسام والفئات

## نظرة عامة
تم إنشاء نظام هرمي من مستويين لتنظيم المنتجات:
- **المستوى الأول: الأقسام (Sections)** - التصنيف الرئيسي
- **المستوى الثاني: الفئات (Categories)** - التصنيف الفرعي داخل كل قسم

## البنية الهرمية

```
📦 أقسام (Sections)
  ├─ 💊 أدوية
  │   ├─ مسكنات
  │   ├─ مضادات حيوية
  │   └─ فيتامينات
  ├─ 🧴 مستحضرات تجميل
  │   ├─ عناية بالبشرة
  │   ├─ عناية بالشعر
  │   └─ مكياج
  └─ 👶 منتجات أطفال
      ├─ حفاضات
      ├─ ألبان
      └─ عناية بالطفل
```

## الملفات المضافة

### 1. Types (src/types/index.ts)
```typescript
interface Section {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
}

interface MedicineCategory {
  // ... الحقول الموجودة
  sectionId?: string;      // ربط الفئة بالقسم
  sectionName?: string;    // اسم القسم للعرض
}
```

### 2. Service (src/services/sectionService.ts)
خدمات Firebase للأقسام:
- `getAllSections()` - جلب جميع الأقسام
- `getActiveSections()` - جلب الأقسام النشطة فقط
- `addSection()` - إضافة قسم جديد
- `updateSection()` - تحديث قسم
- `deleteSection()` - حذف قسم
- `toggleSectionStatus()` - تفعيل/إلغاء تفعيل قسم

### 3. Hook (src/hooks/useSections.ts)
React Hook لإدارة الأقسام مع:
- State management
- Loading states
- Error handling
- Toast notifications

### 4. صفحة الإدارة (src/pages/admin/AdminSections.tsx)
واجهة كاملة لإدارة الأقسام:
- عرض جميع الأقسام في Grid
- إضافة قسم جديد
- تعديل قسم موجود
- حذف قسم
- تفعيل/إلغاء تفعيل قسم
- ترتيب الأقسام

## الوصول للصفحة

### URL
```
/admin/sections
```

### في الداشبورد
يمكن إضافة رابط في القائمة الجانبية للوصول السريع

## الخطوات التالية

### 1. ربط الفئات بالأقسام
تحديث صفحة `AdminCategories.tsx` لإضافة:
- Dropdown لاختيار القسم عند إضافة/تعديل فئة
- عرض اسم القسم مع كل فئة
- فلترة الفئات حسب القسم

### 2. تحديث نموذج الأدوية
في `AdminMedicines.tsx`:
- إضافة dropdown للأقسام
- تحديث dropdown الفئات ليعرض فقط فئات القسم المختار
- حفظ `sectionId` مع بيانات الدواء

### 3. الفلترة في الداشبورد
- فلتر بالقسم أولاً
- ثم فلتر بالفئة داخل القسم
- عرض إحصائيات لكل قسم

## مثال على الاستخدام

### إضافة قسم جديد
1. اذهب إلى `/admin/sections`
2. اضغط "إضافة قسم جديد"
3. أدخل البيانات:
   - اسم القسم بالعربي: "أدوية"
   - اسم القسم بالإنجليزي: "Medicines"
   - الأيقونة: 💊
   - الوصف: "جميع أنواع الأدوية والعلاجات"
   - الترتيب: 0
   - نشط: ✓
4. احفظ

### ربط فئة بقسم
سيتم تحديث صفحة الفئات لتشمل اختيار القسم

## قاعدة البيانات (Firebase)

### Collection: sections
```json
{
  "id": "auto-generated",
  "name": "أدوية",
  "nameEn": "Medicines",
  "description": "جميع أنواع الأدوية",
  "icon": "💊",
  "isActive": true,
  "order": 0,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Collection: categories (محدثة)
```json
{
  "id": "auto-generated",
  "name": "مسكنات",
  "nameEn": "Painkillers",
  "sectionId": "section-id-here",
  "sectionName": "أدوية",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## الميزات

✅ إدارة كاملة للأقسام
✅ دعم اللغتين العربية والإنجليزية
✅ أيقونات مخصصة (إيموجي)
✅ ترتيب مخصص
✅ تفعيل/إلغاء تفعيل
✅ واجهة سهلة الاستخدام
✅ Responsive Design
✅ Toast Notifications
✅ Error Handling

## ملاحظات مهمة

- جميع الحقول الجديدة اختيارية (optional) للتوافق مع البيانات القديمة
- حذف قسم يجب أن يتم بحذر لأنه قد يؤثر على الفئات المرتبطة
- يمكن إضافة validation إضافي حسب الحاجة
