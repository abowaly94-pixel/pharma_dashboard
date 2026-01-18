# دليل استخدام نظام الإشعارات

## 📱 كيفية استخدام الإشعارات في التطبيق

---

## 1️⃣ إعداد البيئة

### الخطوة 1: إضافة VAPID Key

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر مشروعك `pharmanow-754a7`
3. اذهب إلى **Project Settings** (⚙️)
4. اختر تبويب **Cloud Messaging**
5. في قسم **Web Push certificates**:
   - إذا لم يكن موجود، اضغط **Generate key pair**
   - انسخ الـ **Key pair** (VAPID key)

6. أضف الـ key في ملف `.env.local`:
```env
VITE_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

7. أعد تشغيل السيرفر:
```bash
npm run dev
```

---

## 2️⃣ استخدام الإشعارات في الكود

### في أي Component:

```typescript
import { useAutoNotifications } from '@/hooks/useAutoNotifications';

function MyComponent() {
  const {
    notifyNewOrder,
    notifyOrderStatusChange,
    notifyNewMedicine,
    notifyMedicineApproved,
    notifyMedicineRejected,
    notifyLowStock
  } = useAutoNotifications();

  // مثال: إرسال إشعار عند إنشاء طلب جديد
  const handleCreateOrder = async () => {
    // ... كود إنشاء الطلب
    
    await notifyNewOrder(orderId, pharmacyName);
  };

  // مثال: إرسال إشعار عند تغيير حالة الطلب
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    // ... كود تحديث الحالة
    
    await notifyOrderStatusChange(orderId, newStatus, pharmacyId);
  };

  // مثال: إرسال إشعار عند إضافة دواء جديد
  const handleAddMedicine = async () => {
    // ... كود إضافة الدواء
    
    await notifyNewMedicine(medicineName, pharmacyName);
  };
}
```

---

## 3️⃣ أمثلة عملية

### مثال 1: إشعار عند الموافقة على دواء

```typescript
// في صفحة AdminMedicineReview.tsx
import { useAutoNotifications } from '@/hooks/useAutoNotifications';

const { notifyMedicineApproved } = useAutoNotifications();

const handleApproveMedicine = async (medicine: Medicine) => {
  try {
    // تحديث حالة الدواء في Firestore
    await updateDoc(doc(db, 'medicines', medicine.id), {
      status: 'approved',
      approvedAt: serverTimestamp()
    });

    // إرسال إشعار للصيدلية
    await notifyMedicineApproved(medicine.name, medicine.pharmacyId);

    toast.success('تمت الموافقة على الدواء');
  } catch (error) {
    toast.error('فشل في الموافقة على الدواء');
  }
};
```

### مثال 2: إشعار عند انخفاض المخزون

```typescript
// في صفحة PharmacistMedicines.tsx
import { useAutoNotifications } from '@/hooks/useAutoNotifications';

const { notifyLowStock } = useAutoNotifications();

const checkStockLevels = async () => {
  const medicines = await getMedicines();
  
  medicines.forEach(async (medicine) => {
    if (medicine.stock < 10) {
      await notifyLowStock(
        medicine.name,
        medicine.stock,
        medicine.pharmacyId
      );
    }
  });
};
```

### مثال 3: إشعار عند رفض دواء

```typescript
const { notifyMedicineRejected } = useAutoNotifications();

const handleRejectMedicine = async (medicine: Medicine, reason: string) => {
  try {
    // تحديث حالة الدواء
    await updateDoc(doc(db, 'medicines', medicine.id), {
      status: 'rejected',
      rejectionReason: reason,
      rejectedAt: serverTimestamp()
    });

    // إرسال إشعار للصيدلية مع السبب
    await notifyMedicineRejected(
      medicine.name,
      medicine.pharmacyId,
      reason
    );

    toast.success('تم رفض الدواء');
  } catch (error) {
    toast.error('فشل في رفض الدواء');
  }
};
```

---

## 4️⃣ إرسال إشعارات مخصصة

### من صفحة Admin Notifications:

```typescript
import { sendNotification } from '@/lib/notifications';

// إرسال إشعار لجميع المستخدمين
await sendNotification({
  title: 'تحديث النظام',
  body: 'سيتم إجراء صيانة على النظام غداً',
  type: 'system',
  // لا تحدد targetUsers أو targetRoles = يرسل للجميع
});

// إرسال إشعار للصيادلة فقط
await sendNotification({
  title: 'عرض خاص',
  body: 'خصم 20% على جميع الأدوية',
  type: 'general',
  targetRoles: ['pharmacist'],
  imageUrl: 'https://example.com/offer.jpg'
});

// إرسال إشعار لمستخدم محدد
await sendNotification({
  title: 'رسالة خاصة',
  body: 'تم قبول طلبك',
  type: 'user',
  targetUsers: ['userId123'],
  actionUrl: '/pharmacist/orders'
});
```

---

## 5️⃣ عرض الإشعارات

### الإشعارات تظهر تلقائياً في:

1. **جرس الإشعارات** (NotificationBell) في الهيدر
2. **صفحة الإشعارات** للأدمن
3. **Push Notifications** على الجهاز (بعد إعداد Cloud Functions)

### للوصول إلى الإشعارات في أي component:

```typescript
import { useNotifications } from '@/contexts/NotificationContext';

function MyComponent() {
  const {
    notifications,      // جميع الإشعارات
    unreadCount,       // عدد الإشعارات غير المقروءة
    isLoading,         // حالة التحميل
    markAsRead,        // تعليم إشعار كمقروء
    markAllAsRead,     // تعليم الكل كمقروء
    requestPermission  // طلب إذن الإشعارات
  } = useNotifications();

  return (
    <div>
      <p>لديك {unreadCount} إشعار غير مقروء</p>
      
      {notifications.map(notification => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
          {!notification.read && (
            <button onClick={() => markAsRead(notification.id)}>
              تعليم كمقروء
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 6️⃣ أنواع الإشعارات

| النوع | الاستخدام | المستهدفون |
|------|----------|-----------|
| `order` | الطلبات | Admin, Pharmacist |
| `medicine` | الأدوية | Admin, Pharmacist |
| `user` | المستخدمين | Admin |
| `system` | النظام | الجميع |
| `general` | عام | حسب الاختيار |

---

## 7️⃣ استكشاف الأخطاء

### المشكلة: الإشعارات لا تظهر

**الحلول:**
1. تأكد من إضافة VAPID key في `.env.local`
2. تأكد من إعادة تشغيل السيرفر بعد تعديل `.env.local`
3. تحقق من Console للأخطاء
4. تأكد من منح إذن الإشعارات في المتصفح

### المشكلة: Push Notifications لا تعمل

**الحلول:**
1. تأكد من إعداد Cloud Functions (راجع `CLOUD_FUNCTION_SETUP.md`)
2. تحقق من Firebase Console > Functions
3. تأكد من تفعيل Firebase Cloud Messaging API
4. راجع logs في Firebase Console

### المشكلة: الإشعارات تتكرر

**الحلول:**
1. تم إصلاح هذه المشكلة في `saveFCMToken()`
2. تأكد من استخدام أحدث نسخة من الكود
3. نظف الـ tokens القديمة من Firestore

---

## 8️⃣ Best Practices

### ✅ افعل:
- أرسل إشعارات للأحداث المهمة فقط
- استخدم عناوين واضحة ومختصرة
- أضف actionUrl لتوجيه المستخدم
- استخدم targetRoles بدلاً من targetUsers للإشعارات العامة

### ❌ لا تفعل:
- لا ترسل إشعارات كثيرة (spam)
- لا تستخدم نصوص طويلة جداً
- لا ترسل إشعارات لجميع المستخدمين إلا للضرورة
- لا تنسى error handling

---

## 9️⃣ مثال كامل: دمج الإشعارات في صفحة الطلبات

```typescript
// src/pages/admin/AdminOrders.tsx
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

export default function AdminOrders() {
  const { notifyOrderStatusChange } = useAutoNotifications();

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    pharmacyId: string
  ) => {
    try {
      // 1. تحديث حالة الطلب في Firestore
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // 2. إرسال إشعار للصيدلية
      await notifyOrderStatusChange(orderId, newStatus, pharmacyId);

      // 3. إظهار رسالة نجاح
      toast.success('تم تحديث حالة الطلب');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('فشل تحديث حالة الطلب');
    }
  };

  return (
    // ... باقي الكود
  );
}
```

---

## 🎯 الخلاصة

نظام الإشعارات الآن جاهز للاستخدام! فقط:

1. ✅ أضف VAPID key في `.env.local`
2. ✅ استخدم `useAutoNotifications` hook
3. ✅ أرسل إشعارات عند الأحداث المهمة
4. ✅ (اختياري) أعد Cloud Functions للـ Push Notifications

للمزيد من المعلومات، راجع:
- `NOTIFICATION_SYSTEM_ANALYSIS.md` - تحليل شامل للنظام
- `CLOUD_FUNCTION_SETUP.md` - إعداد Cloud Functions
