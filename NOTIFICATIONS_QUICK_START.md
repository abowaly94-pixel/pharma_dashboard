# 🚀 البدء السريع - نظام الإشعارات

## ⚡ 3 خطوات فقط للبدء

### 1️⃣ احصل على VAPID Key

```bash
# اذهب إلى Firebase Console
https://console.firebase.google.com/project/pharmanow-754a7/settings/cloudmessaging

# في قسم Web Push certificates
# اضغط "Generate key pair"
# انسخ الـ Key
```

### 2️⃣ أضف الـ Key في `.env.local`

```env
VITE_FIREBASE_VAPID_KEY=YOUR_KEY_HERE
```

### 3️⃣ أعد تشغيل السيرفر

```bash
npm run dev
```

---

## 💡 استخدام بسيط

```typescript
import { useAutoNotifications } from '@/hooks/useAutoNotifications';

function MyComponent() {
  const { notifyNewOrder, notifyMedicineApproved } = useAutoNotifications();

  // إرسال إشعار
  await notifyNewOrder('ORDER123', 'صيدلية النور');
  await notifyMedicineApproved('باراسيتامول', 'pharmacy123');
}
```

---

## 📚 الملفات المهمة

| الملف | الوصف |
|------|-------|
| `NOTIFICATION_SYSTEM_ANALYSIS.md` | تحليل شامل للنظام والمشاكل |
| `NOTIFICATION_USAGE_GUIDE.md` | دليل الاستخدام الكامل |
| `CLOUD_FUNCTION_SETUP.md` | إعداد Push Notifications |
| `src/hooks/useAutoNotifications.ts` | Hook للإشعارات التلقائية |

---

## ✅ ما تم إصلاحه

- ✅ إضافة VAPID key من environment variables
- ✅ إصلاح تكرار FCM tokens
- ✅ تحديث Service Worker
- ✅ إنشاء hook للإشعارات التلقائية
- ✅ إضافة error handling
- ✅ توثيق شامل

---

## ⚠️ ما يحتاج عمل إضافي

- ⏳ إعداد Cloud Functions (اختياري للـ Push Notifications)
- ⏳ دمج الإشعارات في صفحات الطلبات والأدوية
- ⏳ اختبار الإشعارات على أجهزة مختلفة

---

## 🆘 مشاكل شائعة

**الإشعارات لا تظهر؟**
- تأكد من إضافة VAPID key
- أعد تشغيل السيرفر
- امنح إذن الإشعارات في المتصفح

**Push Notifications لا تعمل؟**
- تحتاج Cloud Functions (راجع `CLOUD_FUNCTION_SETUP.md`)

---

## 📞 للمساعدة

راجع الملفات التفصيلية أو افتح issue في GitHub.
