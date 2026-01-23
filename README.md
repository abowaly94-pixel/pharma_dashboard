# PharmaHub - نظام إدارة الصيدليات

نظام متكامل لإدارة الصيدليات والأدوية مع لوحة تحكم للإدارة والصيادلة.

## 🚀 المميزات

### للإدارة (Admin)
- ✅ إدارة الصيدليات (إضافة، تعديل، تفعيل، تعطيل)
- ✅ مراجعة الأدوية المعلقة (موافقة/رفض)
- ✅ إدارة المستخدمين
- ✅ عرض الطلبات والإحصائيات
- ✅ إرسال الإشعارات

### للصيادلة (Pharmacist)
- ✅ إدارة الأدوية (إضافة، تعديل، حذف)
- ✅ عرض الطلبات الخاصة بالصيدلية
- ✅ استقبال الإشعارات
- ✅ إحصائيات المبيعات

## 🛠️ التقنيات المستخدمة

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore + Authentication + Cloud Functions)
- **Storage**: Supabase (للصور)
- **Notifications**: Firebase Cloud Messaging (FCM)

## 📦 التثبيت

```bash
# تثبيت المكتبات
npm install

# تشغيل المشروع
npm run dev
```

## 🔧 الإعداد

### 1. Firebase
أنشئ ملف `.env.local` وأضف:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Supabase
أضف في `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## 📱 نظام الـ pharmacyId

النظام يستخدم **integer IDs** للصيدليات:
- ✅ فريد لكل صيدلية (10001, 10002, 10003...)
- ✅ ثابت ولا يتغير
- ✅ متوافق مع التطبيق المحمول
- ✅ سهل في الاستخدام والتقارير

## 📚 البنية

```
src/
├── components/     # مكونات React
├── contexts/       # Context API
├── hooks/          # Custom Hooks
├── lib/            # المكتبات والإعدادات
├── pages/          # الصفحات
├── services/       # خدمات Firebase
└── types/          # TypeScript Types
```

## 🔐 الأمان

- ✅ Authentication عبر Firebase
- ✅ Role-based access control (Admin/Pharmacist)
- ✅ عزل بيانات كل صيدلية
- ✅ Validation على جميع المدخلات

## 📄 الترخيص

هذا المشروع خاص ومملوك لـ PharmaHub.

## 📞 الدعم

للدعم الفني، تواصل معنا عبر البريد الإلكتروني.
