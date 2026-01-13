# 🏥 PharmaNow Admin & Pharmacist Hub

نظام إدارة متكامل واحترافي للصيدليات مع Firebase Authentication و Firestore و Cloud Messaging

## 🚀 البدء السريع

### 1. التثبيت
```bash
npm install
```

### 2. التشغيل
```bash
npm run dev
```

التطبيق سيعمل على: `http://localhost:8080`

### 3. إنشاء البيانات التجريبية

**للمرة الأولى:**
1. افتح: `http://localhost:8080/test`
2. اضغط "Seed Database"
3. انتظر حتى تكتمل العملية ✅

### 4. إصلاح مشكلة تسجيل الدخول

إذا كنت تواجه مشكلة في تسجيل الدخول (البيانات غير صحيحة):

**الحل السريع (بدون حذف):**
1. افتح: `http://localhost:8080/sync`
2. اضغط "بدء المزامنة"
3. انتظر حتى تكتمل العملية ✅
4. اذهب لتسجيل الدخول

> هذه الصفحة تربط حسابات Firebase Auth مع Firestore بدون حذف أي بيانات

### 5. تسجيل الدخول
- **Admin**: `admin@test.com` / `123456`
- **Pharmacist**: `pharmacist@test.com` / `123456`

## ✨ المميزات الرئيسية

### 🔥 Firebase Integration - بيانات حقيقية 100%

**النظام يعرض البيانات الحقيقية من Firebase فقط!**

### ✅ ما يتم عرضه:
- **Firebase Authentication**: جميع المستخدمين المسجلين فعلياً
- **Firestore Database**: 
  - الأدوية الموجودة في collection `medicines`
  - الطلبات الموجودة في collection `orders`
  - المستخدمين الموجودين في collection `users`
  - الصيدليات الموجودة في collection `pharmacies`
  - الإشعارات الموجودة في collection `notifications`
- **Real-time Updates**: أي تغيير في Firebase يظهر فوراً

### ❌ ما لا يتم عرضه:
- لا توجد بيانات وهمية أو ثابتة
- لا توجد بيانات مؤقتة في الذاكرة
- كل شيء يأتي من Firebase مباشرة

### 📊 البيانات التجريبية (اختيارية)

صفحة `/test` تنشئ بيانات تجريبية **للاختبار فقط**:
- 3 مستخدمين تجريبيين
- 2 صيدلية تجريبية
- 3 أدوية تجريبية
- 2 طلب تجريبي

> ⚠️ **مهم**: هذه البيانات تُحفظ في Firebase وتصبح بيانات حقيقية. يمكنك حذفها من Firebase Console أو استخدام `/reset`

### 📊 Admin Dashboard (6 صفحات)
- ✅ Dashboard الرئيسي مع إحصائيات شاملة
- ✅ إدارة الأدوية الكاملة
- ✅ إدارة الطلبات
- ✅ إدارة المستخدمين
- ✅ إدارة الصيدليات (جديد!)
- ✅ إدارة الإشعارات

### 💊 Medicines Management
- ✅ إضافة أدوية جديدة مع صور
- ✅ تعديل بيانات الأدوية
- ✅ حذف الأدوية
- ✅ بحث متقدم (اسم، كود، صيدلية، فئة، شركة مصنعة)
- ✅ عرض تفاصيل كاملة مع صور
- ✅ إدارة المخزون والكميات
- ✅ نظام التقييمات والمراجعات
- ✅ نظام الخصومات
- ✅ تصنيف المنتجات الجديدة

### 🏪 Pharmacies Management
- ✅ إضافة صيدليات جديدة
- ✅ تعديل بيانات الصيدليات
- ✅ تفعيل/إيقاف الصيدليات
- ✅ عرض معلومات كاملة (العنوان، الهاتف، البريد)
- ✅ إدارة التراخيص
- ✅ عرض إحصائيات كل صيدلية

### 🔔 Notifications System
- ✅ إرسال واستقبال الإشعارات
- ✅ Push Notifications
- ✅ 5 أنواع إشعارات
- ✅ استهداف مستخدمين محددين
- ✅ Service Worker

### 🎨 UI/UX Features
- ✅ تصميم احترافي مع Shadcn/ui
- ✅ Dark/Light Mode
- ✅ Responsive Design
- ✅ Animations مع Framer Motion
- ✅ Loading States
- ✅ Error Handling
- ✅ Toast Notifications

## 🛠️ التقنيات المستخدمة

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore + FCM)
- **State Management**: React Context + Custom Hooks
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 📊 الصفحات المتاحة

### Admin Pages
- `/admin` - Dashboard الرئيسي مع إحصائيات
- `/admin/medicines` - إدارة الأدوية (إضافة، تعديل، حذف، بحث)
- `/admin/orders` - إدارة الطلبات
- `/admin/users` - إدارة المستخدمين
- `/admin/pharmacies` - إدارة الصيدليات (جديد!)
- `/admin/notifications` - إدارة الإشعارات

### Pharmacist Pages
- `/pharmacist` - Dashboard
- `/pharmacist/medicines` - أدويتي
- `/pharmacist/orders` - طلباتي

### Utility Pages
- `/test` - إنشاء البيانات التجريبية
- `/sync` - مزامنة المستخدمين
- `/reset` - إعادة تعيين قاعدة البيانات
- `/login` - صفحة تسجيل الدخول

## 📚 كيف يعمل النظام

### 1. عند تشغيل التطبيق
```bash
npm run dev
```
- يتصل بـ Firebase
- يستمع للتغييرات في الوقت الفعلي (Real-time Listeners)
- يعرض البيانات الموجودة فعلياً في Firebase

### 2. إذا كانت قاعدة البيانات فارغة
- لن تظهر أي بيانات (Empty State)
- يمكنك إضافة بيانات يدوياً من Dashboard
- أو استخدام `/test` لإنشاء بيانات تجريبية

### 3. عند إضافة/تعديل/حذف بيانات
- يتم الحفظ مباشرة في Firebase
- تظهر التغييرات فوراً لجميع المستخدمين
- لا توجد بيانات مؤقتة

## 📊 مصادر البيانات

| الصفحة | المصدر | Real-time |
|--------|--------|-----------|
| Dashboard | Firebase Firestore | ✅ |
| الأدوية | `medicines` collection | ✅ |
| الطلبات | `orders` collection | ✅ |
| المستخدمين | `users` collection | ✅ |
| الصيدليات | `pharmacies` collection | ✅ |
| الإشعارات | `notifications` collection + FCM | ✅ |

## 🔒 Firebase Security

### Authentication
- كل مستخدم يجب أن يكون مسجل في Firebase Auth
- الـ UID من Firebase Auth يُستخدم كـ Document ID في Firestore

### Firestore Rules (يجب تطبيقها)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Medicines collection
    match /medicines/{medicineId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'pharmacist']);
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Pharmacies collection
    match /pharmacies/{pharmacyId} {
      allow read: if true;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## 🔧 Scripts المتاحة

```bash
npm run dev          # تشغيل التطبيق في وضع التطوير
npm run build        # Build للإنتاج
npm run preview      # معاينة Build
npm run lint         # فحص الكود
```

## 🎯 Best Practices المطبقة

### Code Quality
- ✅ TypeScript للـ Type Safety
- ✅ ESLint للـ Code Quality
- ✅ Component-based Architecture
- ✅ Custom Hooks للـ Reusability
- ✅ Error Boundaries
- ✅ Loading States

### Firebase Best Practices
- ✅ Real-time Listeners مع Cleanup
- ✅ Optimistic Updates
- ✅ Error Handling
- ✅ Security Rules (يجب تطبيقها)
- ✅ Indexed Queries
- ✅ Batch Operations

### Performance
- ✅ Code Splitting
- ✅ Lazy Loading
- ✅ Image Optimization
- ✅ Memoization
- ✅ Debouncing للبحث

### UX
- ✅ Loading Skeletons
- ✅ Error Messages واضحة
- ✅ Success Feedback
- ✅ Confirmation Dialogs
- ✅ Responsive Design
- ✅ Accessibility

## 🔒 الأمان

- Firebase Authentication للمصادقة
- Role-based Access Control (Admin/Pharmacist)
- Protected Routes
- Input Validation
- XSS Protection

## 📱 الدعم

### المتصفحات
- ✅ Chrome/Edge (آخر إصدارين)
- ✅ Firefox (آخر إصدارين)
- ✅ Safari (iOS 16.4+)

### الأجهزة
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## 🐛 استكشاف الأخطاء

### لا يمكن تسجيل الدخول؟
→ استخدم صفحة `/sync` لمزامنة المستخدمين

### لا تظهر البيانات؟
→ تأكد من تشغيل `/test` لإنشاء البيانات التجريبية

### مشاكل في الصور؟
→ تأكد من رابط الصورة صحيح أو استخدم Placeholder

## 🎉 الحالة

✅ **جاهز للاستخدام والتطوير!**

النظام جاهز بالكامل مع:
- إدارة كاملة للأدوية مع الصور
- إدارة الصيدليات
- بحث متقدم
- Real-time Updates
- UI/UX احترافي

---

**تم التطوير بواسطة**: Kiro AI Assistant  
**التاريخ**: 2026-01-13  
**الإصدار**: 2.0.0
