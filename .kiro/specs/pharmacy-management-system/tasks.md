# Implementation Plan: Pharmacy Management System

## Overview

خطة تنفيذ نظام إدارة الصيدليات الاحترافي. يتم تقسيم العمل إلى مراحل متتابعة تبدأ بالبنية الأساسية ثم الخدمات ثم واجهات المستخدم.

## Tasks

- [x] 1. إعداد البنية الأساسية والأنواع
  - [x] 1.1 تحديث ملف الأنواع `src/types/index.ts` بإضافة الواجهات الجديدة
    - إضافة `PharmacyStatus`, `MedicineStatus`, `AuditAction` types
    - إضافة `PharmacyAccount`, `MedicineWithApproval`, `AuditLog` interfaces
    - إضافة `PharmacyFilters`, `MedicineFilters`, `AuditFilters` interfaces
    - _Requirements: 1.1, 3.1, 7.1_
  
  - [x] 1.2 إنشاء ملف أنواع الأخطاء `src/types/errors.ts`
    - إنشاء `AuthenticationError`, `AuthorizationError`, `ValidationError` classes
    - _Requirements: 2.1, 2.2, 3.2_

- [x] 2. إنشاء خدمات إدارة الصيدليات
  - [x] 2.1 إنشاء خدمة الصيدليات `src/services/pharmacyService.ts`
    - تنفيذ `createPharmacy` مع تشفير كلمة المرور وحالة inactive
    - تنفيذ `getPharmacies`, `getPharmacyById`
    - تنفيذ `updatePharmacyStatus` (activate/deactivate/suspend)
    - تنفيذ `updateMedicineLimit`
    - تنفيذ `searchPharmacies` مع الفلترة
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2_
  
  - [x] 2.2 كتابة اختبار خاصية لإنشاء الصيدلية
    - **Property 1: Pharmacy Creation Security**
    - **Validates: Requirements 1.1**
  
  - [x] 2.3 كتابة اختبار خاصية للبحث عن الصيدليات
    - **Property 2: Pharmacy Search Accuracy**
    - **Validates: Requirements 1.4**
  
  - [x] 2.4 كتابة اختبار خاصية لانتقالات حالة الصيدلية
    - **Property 3: Pharmacy Status Transitions**
    - **Validates: Requirements 1.5, 1.6, 1.7**

- [x] 3. إنشاء خدمات المصادقة للصيدليات
  - [x] 3.1 إنشاء خدمة المصادقة `src/services/pharmacyAuthService.ts`
    - تنفيذ `loginPharmacy` مع التحقق من الحالة
    - تنفيذ `logoutPharmacy`
    - تنفيذ `validateSession`
    - تنفيذ `handleFailedLogin` مع قفل الحساب بعد 5 محاولات
    - تنفيذ `isAccountLocked`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 3.2 كتابة اختبار خاصية للمصادقة مع التحكم بالوصول
    - **Property 4: Authentication with Status-Based Access**
    - **Validates: Requirements 2.1, 2.2**
  
  - [x] 3.3 كتابة اختبار خاصية لصلاحية الجلسات
    - **Property 5: Session Validity**
    - **Validates: Requirements 2.3, 2.4**

- [x] 4. Checkpoint - التحقق من الخدمات الأساسية
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. إنشاء خدمات إدارة الأدوية
  - [x] 5.1 إنشاء خدمة الأدوية `src/services/medicineService.ts`
    - تنفيذ `createMedicine` مع حالة pending
    - تنفيذ `getMedicinesByPharmacy` مع التجميع حسب الحالة
    - تنفيذ `getPendingMedicines` للـ Admin
    - تنفيذ `updateMedicine` مع التحقق من الصلاحيات
    - تنفيذ `approveMedicine`, `rejectMedicine`
    - تنفيذ `canAddMedicine` للتحقق من الحد
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 5.2 كتابة اختبار خاصية لحالة الدواء الجديد
    - **Property 6: Medicine Creation Status**
    - **Validates: Requirements 3.1**
  
  - [x] 5.3 كتابة اختبار خاصية لتطبيق حدود الأدوية
    - **Property 7: Medicine Limit Enforcement**
    - **Validates: Requirements 3.2, 5.1, 5.2, 5.3**
  
  - [x] 5.4 كتابة اختبار خاصية لتجميع الأدوية حسب الحالة
    - **Property 8: Medicine Status Grouping**
    - **Validates: Requirements 3.3**
  
  - [x] 5.5 كتابة اختبار خاصية لصلاحيات تعديل الأدوية
    - **Property 9: Medicine Edit Permissions**
    - **Validates: Requirements 3.4, 3.5, 3.6**
  
  - [x] 5.6 كتابة اختبار خاصية لفلترة الأدوية
    - **Property 11: Medicine Filtering**
    - **Validates: Requirements 4.4**

- [x] 6. إنشاء خدمة سجلات المراجعة
  - [x] 6.1 إنشاء خدمة المراجعة `src/services/auditService.ts`
    - تنفيذ `logAction` لتسجيل الإجراءات
    - تنفيذ `getAuditLogs` مع الفلترة
    - تنفيذ `exportAuditLogs` لتصدير CSV
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [x] 6.2 كتابة اختبار خاصية لإنشاء سجلات المراجعة
    - **Property 13: Audit Log Creation**
    - **Validates: Requirements 7.1**
  
  - [x] 6.3 كتابة اختبار خاصية لعدم قابلية تعديل السجلات
    - **Property 14: Audit Log Immutability**
    - **Validates: Requirements 7.4**

- [x] 7. Checkpoint - التحقق من خدمات الأدوية والمراجعة
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. إنشاء React Hooks
  - [x] 8.1 إنشاء hook إدارة الصيدليات `src/hooks/usePharmacyManagement.ts`
    - تنفيذ جلب الصيدليات مع real-time updates
    - تنفيذ إنشاء وتحديث الصيدليات
    - تنفيذ البحث والفلترة
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_
  
  - [x] 8.2 إنشاء hook مراجعة الأدوية `src/hooks/useMedicineApproval.ts`
    - تنفيذ جلب الأدوية المعلقة
    - تنفيذ الموافقة والرفض
    - تنفيذ الفلترة
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 8.3 إنشاء hook أدوية الصيدلية `src/hooks/usePharmacyMedicines.ts`
    - تنفيذ جلب أدوية الصيدلية مع التجميع
    - تنفيذ إضافة وتعديل الأدوية
    - تنفيذ التحقق من الحد
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1_
  
  - [x] 8.4 إنشاء hook سجلات المراجعة `src/hooks/useAuditLogs.ts`
    - تنفيذ جلب السجلات مع الفلترة
    - تنفيذ التصدير
    - _Requirements: 7.2_

- [ ] 9. إنشاء واجهات Admin
  - [ ] 9.1 تحديث صفحة إدارة الصيدليات `src/pages/admin/AdminPharmacies.tsx`
    - إضافة نموذج إنشاء صيدلية جديدة
    - إضافة جدول الصيدليات مع البحث والفلترة
    - إضافة أزرار تفعيل/إلغاء تفعيل/تعليق
    - إضافة تعديل حد الأدوية
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2, 5.4_
  
  - [ ] 9.2 إنشاء صفحة مراجعة الأدوية `src/pages/admin/AdminMedicineReview.tsx`
    - عرض الأدوية المعلقة
    - أزرار الموافقة والرفض مع ملاحظات
    - فلترة حسب الصيدلية والتاريخ
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ] 9.3 إنشاء صفحة سجلات المراجعة `src/pages/admin/AdminAuditLogs.tsx`
    - عرض السجلات مع الفلترة
    - زر التصدير CSV
    - _Requirements: 7.2_
  
  - [ ] 9.4 كتابة اختبار خاصية لدقة إحصائيات لوحة التحكم
    - **Property 15: Dashboard Statistics Accuracy**
    - **Validates: Requirements 8.1**

- [ ] 10. Checkpoint - التحقق من واجهات Admin
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. إنشاء واجهات الصيدلية
  - [ ] 11.1 تحديث صفحة أدوية الصيدلية `src/pages/pharmacist/PharmacistMedicines.tsx`
    - إضافة نموذج إضافة دواء جديد
    - عرض الأدوية مجمعة حسب الحالة
    - عرض ملاحظات الرفض
    - إمكانية تعديل الأدوية المعلقة والمرفوضة
    - عرض الحد الحالي والمتبقي
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2_
  
  - [ ] 11.2 كتابة اختبار خاصية لدورة حياة ملاحظات الرفض
    - **Property 12: Rejection Notes Lifecycle**
    - **Validates: Requirements 6.1, 6.3**

- [ ] 12. إنشاء خدمة التصدير
  - [ ] 12.1 إنشاء خدمة التصدير `src/services/exportService.ts`
    - تنفيذ `exportPharmacies` لتصدير الصيدليات
    - تنفيذ `exportMedicines` لتصدير الأدوية
    - تنفيذ `exportAuditLogs` لتصدير السجلات
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [ ] 12.2 كتابة اختبار خاصية لتصدير CSV
    - **Property 16: CSV Export Round-Trip**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 13. تكامل مراجعة الأدوية مع سجل المراجعة
  - [ ] 13.1 ربط خدمة الأدوية مع خدمة المراجعة
    - إضافة تسجيل تلقائي عند الموافقة/الرفض
    - إضافة تسجيل عند تغيير حالة الصيدلية
    - _Requirements: 4.5, 7.1_
  
  - [ ] 13.2 كتابة اختبار خاصية لمراجعة الأدوية مع سجل المراجعة
    - **Property 10: Medicine Review with Audit**
    - **Validates: Requirements 4.2, 4.3, 4.5**

- [ ] 14. تحديث التنقل والتوجيه
  - [ ] 14.1 تحديث `src/App.tsx` بإضافة المسارات الجديدة
    - إضافة مسار `/admin/medicine-review`
    - إضافة مسار `/admin/audit-logs`
    - _Requirements: 8.2, 8.3_
  
  - [ ] 14.2 تحديث القائمة الجانبية للـ Admin
    - إضافة رابط مراجعة الأدوية
    - إضافة رابط سجلات المراجعة
    - _Requirements: 8.2, 8.3_

- [ ] 15. Final Checkpoint - التحقق النهائي
  - Ensure all tests pass, ask the user if questions arise.
  - التحقق من جميع التدفقات الرئيسية
  - التحقق من الصلاحيات والأمان

## Notes

- جميع المهام إلزامية بما في ذلك الاختبارات
- كل مهمة تشير إلى متطلبات محددة للتتبع
- نقاط التحقق تضمن التحقق التدريجي
- اختبارات الخصائص تتحقق من خصائص الصحة الشاملة باستخدام fast-check
- اختبارات الوحدة تتحقق من أمثلة وحالات حدية محددة
