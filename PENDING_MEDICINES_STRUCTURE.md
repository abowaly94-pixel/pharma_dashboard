# بنية بيانات الأدوية (Medicines Structure)

## نظرة عامة
النظام يستخدم **collection منفصل** للأدوية المعلقة والمرفوضة (`pending_medicines`) وآخر للأدوية المعتمدة (`medicines`).

### سير العمل:
1. **إضافة دواء جديد**: يُحفظ في `pending_medicines` بحالة `pending`
2. **الموافقة**: يُنقل من `pending_medicines` إلى `medicines` بحالة `approved`
3. **الرفض**: يبقى في `pending_medicines` بحالة `rejected`
4. **إعادة التقديم**: الدواء المرفوض يُعاد لحالة `pending` عند التعديل

## Collections

### 1. `pending_medicines` Collection
يحتوي على الأدوية التي:
- في انتظار المراجعة (`status: 'pending'`)
- تم رفضها (`status: 'rejected'`)

### 2. `medicines` Collection
يحتوي على الأدوية المعتمدة فقط (`status: 'approved'`)

## بنية البيانات (Data Structure)

```typescript
interface Medicine {
  // المعرفات الأساسية
  id: string;                    // معرف فريد للدواء
  code: string;                  // كود الدواء
  
  // معلومات الدواء
  name: string;                  // اسم الدواء
  description: string;           // وصف الدواء
  price: number;                 // السعر
  quantity: number;              // الكمية المتاحة
  category: string;              // فئة الدواء
  manufacturer: string;          // الشركة المصنعة
  expiryDate: Date;              // تاريخ انتهاء الصلاحية
  
  // معلومات الصيدلية
  pharmacyId: number;            // معرف الصيدلية
  pharmacyName: string;          // اسم الصيدلية
  
  // الصور
  imageUrl: string;              // رابط الصورة من Supabase Storage
  
  // حالة المراجعة
  status: 'pending' | 'approved' | 'rejected';
  rejectionNotes?: string;       // ملاحظات الرفض
  reviewedBy?: string;           // معرف المراجع
  reviewedAt?: Date;             // تاريخ المراجعة
  
  // التواريخ
  createdAt: Date;               // تاريخ الإنشاء
  updatedAt: Date;               // تاريخ آخر تحديث
  deleted: boolean;              // هل تم حذف الدواء (soft delete)
}
```

## دورة حياة الدواء

```
┌─────────────────────────────────────────────────────────────────┐
│                         الصيدلي يضيف دواء                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              pending_medicines (status: 'pending')              │
│                      في انتظار مراجعة الأدمن                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
┌───────────────────────────┐   ┌───────────────────────────────┐
│         الموافقة          │   │           الرفض               │
│    ينتقل إلى medicines    │   │  يبقى في pending_medicines   │
│   (status: 'approved')    │   │    (status: 'rejected')       │
└───────────────────────────┘   └───────────────────────────────┘
                                              │
                                              ▼
                                ┌───────────────────────────────┐
                                │    الصيدلي يعدل الدواء        │
                                │   يعود لـ status: 'pending'   │
                                └───────────────────────────────┘
```

## الخدمات المتاحة

### للصيدلي:
- `createMedicine()`: إنشاء دواء جديد → يُحفظ في `pending_medicines`
- `getMedicinesByPharmacy()`: جلب أدوية الصيدلية من كلا الـ collections
- `updateMedicine()`: تحديث دواء معلق أو مرفوض
- `deleteMedicine()`: حذف دواء معلق أو مرفوض

### للإدارة:
- `getPendingMedicines()`: جلب الأدوية المعلقة من `pending_medicines`
- `approveMedicine()`: الموافقة → ينقل من `pending_medicines` إلى `medicines`
- `rejectMedicine()`: الرفض → يبقى في `pending_medicines` مع تغيير الحالة
- `filterMedicines()`: فلترة الأدوية من كلا الـ collections

## ملاحظات مهمة

1. **الأدوية الجديدة لا تظهر للمستخدمين** حتى تتم الموافقة عليها
2. **الأدوية المعتمدة فقط** في `medicines` collection
3. **Real-time listeners** تستمع لكلا الـ collections
4. **الصور** تُحذف من Supabase عند حذف الدواء
