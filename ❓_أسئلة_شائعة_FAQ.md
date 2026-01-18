# ❓ أسئلة شائعة - نظام الإشعارات

## 📌 أسئلة عامة

### س1: ما الفرق بين Web Notifications و Push Notifications؟

**الجواب**:
- **Web Notifications**: تظهر داخل التطبيق فقط (في قائمة الجرس)
- **Push Notifications**: تظهر كإشعارات متصفح حتى لو التطبيق مغلق

```
Web Notifications:
- تحتاج التطبيق مفتوح
- تظهر في UI فقط
- لا تحتاج FCM

Push Notifications:
- تعمل حتى لو التطبيق مغلق
- تظهر كإشعار متصفح
- تحتاج FCM Token
```

---

### س2: هل يمكن إرسال إشعار لمستخدم واحد فقط؟

**الجواب**: نعم! استخدم `targetUsers`:

```typescript
await sendNotification({
  title: "إشعار خاص",
  body: "هذا إشعار لك فقط",
  type: "user",
  targetUsers: ["user123"]  // معرف المستخدم
});
```

---

### س3: كيف أرسل إشعار لجميع الصيادلة؟

**الجواب**: استخدم `targetRoles`:

```typescript
await sendNotification({
  title: "تنبيه للصيادلة",
  body: "يرجى مراجعة الطلبات",
  type: "general",
  targetRoles: ["pharmacist"]
});
```

---

### س4: هل يمكن إرسال إشعار للجميع؟

**الجواب**: نعم! اترك `targetUsers` و `targetRoles` فارغة:

```typescript
await sendNotification({
  title: "إعلان عام",
  body: "صيانة النظام غدًا",
  type: "system"
  // لا targetUsers ولا targetRoles
});
```

---

## 🔧 أسئلة تقنية

### س5: لماذا Service Worker لا يسجل؟

**الجواب**: جرب هذه الحلول:

1. **امسح Cache**:
   ```
   Ctrl + Shift + Delete
   امسح Cached images and files
   ```

2. **Unregister Service Workers القديمة**:
   ```
   F12 > Application > Service Workers
   اضغط Unregister على جميع Service Workers
   ```

3. **Hard Reload**:
   ```
   Ctrl + F5
   ```

4. **تحقق من المسار**:
   ```javascript
   // يجب أن يكون الملف في:
   public/firebase-messaging-sw.js
   
   // وليس في:
   src/firebase-messaging-sw.js ❌
   ```

---

### س6: لماذا FCM Token لا يحفظ في Firestore؟

**الجواب**: تحقق من:

1. **VAPID Key موجود**:
   ```bash
   # في .env.local
   VITE_FIREBASE_VAPID_KEY=your-key-here
   ```

2. **Firebase Rules صحيحة**:
   ```javascript
   match /fcmTokens/{tokenId} {
     allow read: if request.auth != null;
     allow create: if request.auth != null;
     allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
   }
   ```

3. **Collection موجود**:
   ```
   Firebase Console > Firestore
   يجب أن يكون هناك collection اسمه: fcmTokens
   ```

---

### س7: لماذا الإشعارات لا تظهر في الوقت الفعلي؟

**الجواب**: تحقق من:

1. **اتصال الإنترنت**:
   ```
   تأكد من أن الإنترنت يعمل
   ```

2. **Firestore Rules**:
   ```javascript
   match /notifications/{notificationId} {
     allow read: if request.auth != null;
   }
   ```

3. **Console للأخطاء**:
   ```
   F12 > Console
   ابحث عن أخطاء باللون الأحمر
   ```

4. **onSnapshot يعمل**:
   ```typescript
   // في NotificationContext
   useEffect(() => {
     const unsubscribe = onSnapshot(q, (snapshot) => {
       // يجب أن يعمل هذا
     });
     return () => unsubscribe();
   }, [user]);
   ```

---

### س8: كيف أحصل على VAPID Key؟

**الجواب**: من Firebase Console:

```
1. اذهب إلى Firebase Console
2. اختر مشروعك
3. اذهب إلى Project Settings (⚙️)
4. اختر تبويب "Cloud Messaging"
5. في قسم "Web Push certificates"
6. اضغط "Generate key pair"
7. انسخ الـ Key
8. ضعه في .env.local:
   VITE_FIREBASE_VAPID_KEY=your-key-here
```

---

### س9: كيف أحصل على Access Token للـ Push Notifications؟

**الجواب**: من OAuth Playground:

```
1. اذهب إلى: https://developers.google.com/oauthplayground/
2. اضغط على ⚙️ (Settings)
3. فعّل "Use your own OAuth credentials"
4. أدخل OAuth Client ID و Secret
5. في Step 1، اختر "Firebase Cloud Messaging API v1"
6. اضغط "Authorize APIs"
7. في Step 2، اضغط "Exchange authorization code for tokens"
8. انسخ "Access token"
9. احفظه في Firestore:
   Collection: system_settings
   Document: fcm_config
   Field: accessToken
```

**ملاحظة**: Access Token ينتهي بعد ساعة، يجب تجديده.

---

## 🐛 أسئلة استكشاف الأخطاء

### س10: لماذا لا تظهر نافذة السماح بالإشعارات؟

**الجواب**: تحقق من:

1. **إعدادات المتصفح**:
   ```
   Chrome: Settings > Privacy > Site Settings > Notifications
   تأكد من أن الموقع غير محظور
   ```

2. **تم السماح مسبقًا**:
   ```
   إذا سمحت مسبقًا، لن تظهر النافذة مرة أخرى
   ```

3. **جرب متصفح آخر**:
   ```
   جرب Firefox أو Edge
   ```

4. **Incognito Mode**:
   ```
   جرب في وضع التصفح الخاص
   ```

---

### س11: لماذا الإشعارات تظهر مكررة؟

**الجواب**: قد يكون السبب:

1. **Multiple Listeners**:
   ```typescript
   // تأكد من cleanup في useEffect
   useEffect(() => {
     const unsubscribe = onSnapshot(...);
     return () => unsubscribe(); // مهم!
   }, []);
   ```

2. **Multiple Tabs**:
   ```
   إذا فتحت التطبيق في عدة تبويبات،
   كل تبويب سيستقبل الإشعار
   ```

3. **Service Worker مكرر**:
   ```
   F12 > Application > Service Workers
   Unregister جميع Service Workers
   أعد تحميل الصفحة
   ```

---

### س12: لماذا Badge الجرس لا يتحدث؟

**الجواب**: تحقق من:

1. **unreadCount يتحدث**:
   ```typescript
   // في NotificationContext
   setUnreadCount(notificationsList.filter(n => !n.read).length);
   ```

2. **markAsRead يعمل**:
   ```typescript
   const markAsRead = async (id) => {
     await markNotificationAsRead(id);
     // يجب أن يحدث State
   };
   ```

3. **Real-time Updates**:
   ```typescript
   // onSnapshot يجب أن يعمل
   onSnapshot(q, (snapshot) => {
     // يحدث State تلقائيًا
   });
   ```

---

## 📱 أسئلة Mobile

### س13: هل يعمل النظام على Mobile؟

**الجواب**: نعم! ولكن:

- **Web App على Mobile**: يعمل 100%
- **Native Mobile App**: يحتاج تطبيق منفصل (React Native / Flutter)
- **PWA**: يعمل على Android، محدود على iOS

---

### س14: كيف أختبر على Mobile؟

**الجواب**:

1. **افتح التطبيق على Mobile**:
   ```
   http://your-ip:5173
   مثال: http://192.168.1.100:5173
   ```

2. **فعّل الإشعارات**:
   ```
   اضغط على الجرس
   اضغط "تفعيل الإشعارات"
   اسمح بالإشعارات
   ```

3. **أرسل إشعار من Desktop**:
   ```
   يجب أن يصل للـ Mobile
   ```

---

## 🔒 أسئلة الأمان

### س15: هل FCM Tokens آمنة؟

**الجواب**: نعم، ولكن:

- ✅ **لا تعرضها في UI**
- ✅ **احفظها في Firestore فقط**
- ✅ **استخدم Firebase Rules**
- ✅ **امسح Tokens القديمة**

```javascript
// Firebase Rules
match /fcmTokens/{tokenId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
                  resource.data.userId == request.auth.uid;
}
```

---

### س16: من يستطيع إرسال الإشعارات؟

**الجواب**: فقط Admins:

```javascript
// Firebase Rules
match /notifications/{notificationId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## ⚡ أسئلة الأداء

### س17: كم عدد الإشعارات التي يمكن إرسالها؟

**الجواب**:

- **Web Notifications**: غير محدود (Firestore)
- **Push Notifications**: حسب Firebase Quota
  - Free Plan: 10,000 رسالة/يوم
  - Blaze Plan: غير محدود (مدفوع)

---

### س18: كيف أحسّن الأداء؟

**الجواب**:

1. **Pagination**:
   ```typescript
   const q = query(
     collection(db, 'notifications'),
     orderBy('createdAt', 'desc'),
     limit(20) // فقط 20 إشعار
   );
   ```

2. **Indexes**:
   ```
   Firebase Console > Firestore > Indexes
   أضف index على: createdAt, targetRoles, targetUsers
   ```

3. **Cleanup**:
   ```typescript
   // امسح الإشعارات القديمة (أكثر من 30 يوم)
   const oldDate = new Date();
   oldDate.setDate(oldDate.getDate() - 30);
   
   const q = query(
     collection(db, 'notifications'),
     where('createdAt', '<', oldDate)
   );
   // احذف النتائج
   ```

---

## 🎨 أسئلة UI/UX

### س19: كيف أغير شكل الإشعارات؟

**الجواب**: عدّل `NotificationItem.tsx`:

```typescript
// أضف أيقونات مخصصة
const icons = {
  order: <ShoppingCart />,
  medicine: <Pill />,
  user: <User />,
  system: <Settings />,
  general: <Bell />
};

// أضف ألوان مخصصة
const colors = {
  order: 'bg-blue-100',
  medicine: 'bg-green-100',
  user: 'bg-purple-100',
  system: 'bg-red-100',
  general: 'bg-gray-100'
};
```

---

### س20: كيف أضيف صوت للإشعارات؟

**الجواب**: في `NotificationContext.tsx`:

```typescript
useEffect(() => {
  const unsubscribe = onMessageListener()
    .then((payload: any) => {
      // أضف صوت
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Could not play sound:', e));
      
      // عرض Toast
      toast.info(payload.notification.title, {
        description: payload.notification.body
      });
    });
}, [fcmToken]);
```

**ملاحظة**: ضع ملف `notification.mp3` في مجلد `public/`

---

## 📊 أسئلة Analytics

### س21: كيف أتتبع الإشعارات؟

**الجواب**: أضف logging:

```typescript
// عند الإرسال
console.log('Notification sent:', {
  id,
  title,
  targetCount,
  timestamp: Date.now()
});

// عند الاستلام
console.log('Notification received:', {
  id,
  userId,
  timestamp: Date.now()
});

// عند القراءة
console.log('Notification read:', {
  id,
  userId,
  timestamp: Date.now()
});
```

---

### س22: كيف أحسب معدل الفتح (Open Rate)؟

**الجواب**: أضف tracking:

```typescript
// في Firestore
{
  id: "abc123",
  title: "...",
  sentCount: 100,      // عدد المرسل إليهم
  deliveredCount: 95,  // عدد الذين استلموا
  readCount: 50,       // عدد الذين قرأوا
  clickCount: 30       // عدد الذين ضغطوا
}

// احسب المعدلات
const deliveryRate = (deliveredCount / sentCount) * 100;  // 95%
const openRate = (readCount / deliveredCount) * 100;      // 52.6%
const clickRate = (clickCount / readCount) * 100;         // 60%
```

---

## 🎯 الخلاصة

إذا لم تجد إجابة لسؤالك:
1. راجع **`📚_التوثيق_التقني_للإشعارات.md`**
2. تحقق من **Console** للأخطاء
3. راجع **Firebase Console**
4. تحقق من **Network Tab** في DevTools

**النظام جاهز ومختبر! 🚀**
