# ❓ أسئلة شائعة (FAQ)

## 🎯 أسئلة حول الإعداد

### ❓ هل أحتاج لترقية Firebase لـ Blaze Plan؟
**✅ لا!** الحل الحالي يعمل على Spark Plan (المجاني) تماماً.

---

### ❓ هل أحتاج لـ Cloud Functions؟
**✅ لا!** نستخدم V1 API مباشرة من Admin Panel.

---

### ❓ ما هو Access Token؟
**📝 شرح:**
- Access Token هو مفتاح مؤقت للوصول لـ FCM API
- يسمح لك بإرسال Push Notifications
- ينتهي بعد ساعة واحدة
- يمكن تجديده بسهولة

---

### ❓ لماذا ينتهي Access Token بعد ساعة؟
**📝 شرح:**
- هذا إجراء أمني من Google
- للحماية من الاستخدام غير المصرح به
- يمكن تجديده بضغطة زر من OAuth Playground

---

### ❓ هل يوجد حل دائم بدون تجديد كل ساعة؟
**✅ نعم، لكن يحتاج:**
1. **Service Account:** يحتاج Backend/Cloud Functions
2. **Refresh Token:** يحتاج كود إضافي
3. **Cloud Functions:** يحتاج Blaze Plan

**للاختبار:** Access Token يكفي تماماً

---

## 🎯 أسئلة حول OAuth Client ID

### ❓ ما هو OAuth Client ID؟
**📝 شرح:**
- هو معرّف تطبيقك في Google Cloud
- يسمح لك بالحصول على Access Token
- يُنشأ مرة واحدة فقط

---

### ❓ هل أحتاج لإنشاء OAuth Client ID في كل مرة؟
**✅ لا!** تنشئه مرة واحدة فقط، ثم تستخدمه دائماً.

---

### ❓ ماذا لو نسيت Client ID أو Client Secret؟
**📝 الحل:**
1. اذهب لـ Google Cloud Console
2. APIs & Services > Credentials
3. ستجد OAuth Client ID المحفوظ
4. اضغط عليه لرؤية البيانات

---

### ❓ هل يمكنني استخدام نفس OAuth Client ID لمشاريع أخرى؟
**⚠️ لا!** كل مشروع Firebase يحتاج OAuth Client ID خاص به.

---

## 🎯 أسئلة حول Firestore

### ❓ أين أحفظ Access Token؟
**📝 المسار:**
```
Firestore > system_settings > fcm_config > accessToken
```

---

### ❓ ماذا لو لم أجد system_settings؟
**📝 الحل:**
1. اضغط "Start collection"
2. اكتب: `system_settings`
3. أنشئ document: `fcm_config`
4. أضف field: `accessToken`

---

### ❓ هل يمكنني تغيير اسم Collection أو Document؟
**⚠️ لا!** الكود يبحث عن:
- Collection: `system_settings`
- Document: `fcm_config`
- Field: `accessToken`

**يجب استخدام نفس الأسماء بالضبط!**

---

### ❓ كيف أعرف أن Access Token محفوظ بشكل صحيح؟
**✅ تحقق من:**
1. المسار: `system_settings/fcm_config/accessToken`
2. النوع: `string`
3. القيمة: تبدأ بـ `ya29.`

---

## 🎯 أسئلة حول Admin Panel

### ❓ لماذا تبويب "Push (Mobile)" معطل؟
**📝 الأسباب المحتملة:**
1. Access Token غير موجود في Firestore
2. المسار خاطئ
3. اسم Field خاطئ

**الحل:** تحقق من Firestore وأعد تحميل الصفحة

---

### ❓ ما الفرق بين "Web App" و "Push (Mobile)"؟
**📝 الفرق:**

**Web App:**
- إشعارات داخل التطبيق فقط
- تظهر في NotificationBell
- لا تصل للهاتف

**Push (Mobile):**
- إشعارات حقيقية (Push Notifications)
- تصل لجميع الأجهزة (Web + Android + iOS)
- تظهر حتى لو التطبيق مغلق

---

### ❓ هل يمكنني إرسال لمستخدم واحد فقط؟
**✅ نعم!** لكن يحتاج تعديل بسيط في الكود.

**حالياً:** يمكنك الإرسال لـ:
- الجميع
- المسؤولين فقط
- الصيادلة فقط
- المستخدمين فقط

---

### ❓ كم عدد الإشعارات التي يمكنني إرسالها؟
**📝 الحدود:**
- **Spark Plan (مجاني):** غير محدود تقريباً
- **لكن:** يوجد حد يومي من Google (عادة كافي)

---

## 🎯 أسئلة حول الإرسال

### ❓ لماذا لا تصل الإشعارات؟
**📝 الأسباب المحتملة:**

1. **Access Token منتهي:**
   - الحل: جدده من OAuth Playground

2. **لا توجد FCM Tokens:**
   - الحل: تأكد من أن المستخدمين سمحوا بالإشعارات

3. **المستخدم لم يسجل دخول:**
   - الحل: المستخدم يجب أن يسجل دخول مرة واحدة

4. **الإنترنت ضعيف:**
   - الحل: تحقق من الاتصال

---

### ❓ كيف أعرف أن الإشعار وصل؟
**✅ علامات النجاح:**
1. رسالة "تم إرسال X إشعار بنجاح"
2. الإشعار يظهر على الهاتف
3. لا توجد أخطاء في Console

---

### ❓ ماذا لو ظهرت رسالة "Failed to send"؟
**📝 الحل:**
1. تحقق من Access Token في Firestore
2. تحقق من أنه لم ينتهي (أقل من ساعة)
3. جدده من OAuth Playground
4. تحقق من Console للأخطاء

---

### ❓ هل يمكنني إرسال صورة مع الإشعار؟
**✅ نعم!** أضف رابط الصورة في حقل "رابط الصورة".

**مثال:**
```
https://example.com/image.jpg
```

---

### ❓ هل يمكنني إضافة رابط للإشعار؟
**✅ نعم!** أضف الرابط في حقل "رابط الإجراء".

**مثال:**
```
/admin/orders
```

عند الضغط على الإشعار، سينتقل المستخدم لهذه الصفحة.

---

## 🎯 أسئلة حول التجديد

### ❓ كيف أجدد Access Token؟
**📝 الخطوات:**
1. افتح OAuth Playground
2. في Step 2، اضغط "Refresh access token"
3. انسخ الـ Access Token الجديد
4. حدّثه في Firestore

---

### ❓ هل يجب تجديد OAuth Client ID؟
**✅ لا!** OAuth Client ID دائم، لا يحتاج تجديد.

**فقط Access Token يحتاج تجديد كل ساعة.**

---

### ❓ ماذا يحدث إذا انتهى Access Token أثناء الإرسال؟
**📝 النتيجة:**
- سيفشل الإرسال
- ستظهر رسالة خطأ
- يجب تجديد Access Token

---

### ❓ هل يمكنني جدولة تجديد Access Token تلقائياً؟
**✅ نعم!** لكن يحتاج:
1. استخدام Refresh Token
2. كود إضافي في Backend
3. أو Cloud Functions

**للاختبار:** التجديد اليدوي يكفي

---

## 🎯 أسئلة حول الأمان

### ❓ هل Access Token آمن؟
**⚠️ نعم، لكن:**
- لا تشاركه مع أحد
- لا تنشره على GitHub
- احفظه في Firestore فقط

---

### ❓ هل يمكن لأي شخص استخدام Access Token؟
**⚠️ نعم!** لذلك:
- احفظه في Firestore (محمي)
- لا تضعه في الكود
- لا تشاركه

---

### ❓ ماذا لو سُرق Access Token؟
**📝 الحل:**
1. لا تقلق، ينتهي بعد ساعة
2. أنشئ Access Token جديد
3. حدّثه في Firestore

---

## 🎯 أسئلة حول الأخطاء

### ❓ خطأ: "Access Token غير موجود"
**📝 الحل:**
1. تحقق من Firestore: `system_settings/fcm_config/accessToken`
2. تأكد من أن Field name هو `accessToken` بالضبط
3. تأكد من أن النوع `string`

---

### ❓ خطأ: "لا توجد FCM tokens"
**📝 الحل:**
1. تأكد من أن المستخدمين سجلوا دخول
2. تأكد من أنهم سمحوا بالإشعارات
3. تحقق من `fcmTokens` collection في Firestore

---

### ❓ خطأ: "Invalid authentication credentials"
**📝 الحل:**
1. Access Token منتهي أو خاطئ
2. جدده من OAuth Playground
3. تأكد من نسخه بالكامل

---

### ❓ خطأ: "Permission denied"
**📝 الحل:**
1. تحقق من أن OAuth Client ID صحيح
2. تحقق من أن Redirect URI صحيح
3. تحقق من أنك سجلت دخول بالحساب الصحيح

---

## 🎯 أسئلة متقدمة

### ❓ كيف أستخدم Service Account بدلاً من Access Token؟
**📝 الخطوات:**
1. احصل على Service Account JSON من Firebase
2. استخدم Backend/Cloud Functions
3. استخدم المكتبة الرسمية لـ FCM

**ملاحظة:** يحتاج Blaze Plan

---

### ❓ كيف أستخدم Refresh Token؟
**📝 الخطوات:**
1. احصل على Refresh Token من OAuth Playground
2. احفظه في Firestore
3. استخدمه لتجديد Access Token تلقائياً
4. يحتاج كود إضافي

---

### ❓ هل يمكنني إرسال إشعارات مجدولة؟
**✅ نعم!** لكن يحتاج:
1. Cloud Functions + Firestore Triggers
2. أو Cron Jobs
3. أو Third-party service

---

### ❓ كيف أتتبع من قرأ الإشعار؟
**📝 الحل:**
1. استخدم `notifications` collection في Firestore
2. أضف field `readBy` (array)
3. حدّثه عند قراءة الإشعار

**الكود موجود بالفعل في `NotificationContext`!**

---

### ❓ كيف أرسل إشعار لمستخدم واحد فقط؟
**📝 الحل:**
عدّل `fcmServiceV1.ts`:

```typescript
// بدلاً من:
targetRoles?: string[];

// استخدم:
targetUsers?: string[];
```

ثم في Admin Panel:
```typescript
targetUsers: ['user_id_here']
```

---

## 🎯 أسئلة حول الأداء

### ❓ كم يستغرق إرسال الإشعار؟
**📝 الوقت:**
- **1-10 مستخدمين:** 1-2 ثانية
- **10-100 مستخدم:** 2-5 ثواني
- **100+ مستخدم:** 5-10 ثواني

---

### ❓ هل يمكنني إرسال لآلاف المستخدمين؟
**✅ نعم!** لكن:
- قد يستغرق وقتاً أطول
- الأفضل استخدام Cloud Functions
- أو Batch Requests

---

### ❓ كيف أحسّن الأداء؟
**📝 نصائح:**
1. استخدم Batch Requests (500 token لكل request)
2. استخدم Cloud Functions
3. استخدم Firestore Indexes
4. قلل عدد Queries

---

## 🎯 أسئلة عامة

### ❓ هل يعمل على Android و iOS؟
**✅ نعم!** يعمل على:
- ✅ Web (Chrome, Firefox, Edge)
- ✅ Android (Chrome, WebView)
- ✅ iOS (Safari, WebView)

---

### ❓ هل يعمل على التطبيق المغلق؟
**📝 الإجابة:**
- **Web:** لا (يجب أن يكون التطبيق مفتوح)
- **Android:** نعم (حتى لو مغلق)
- **iOS:** نعم (حتى لو مغلق)

---

### ❓ هل يمكنني تخصيص شكل الإشعار؟
**📝 الإجابة:**
- **Android:** نعم (يمكن تخصيص الأيقونة واللون)
- **iOS:** محدود (يتبع نظام iOS)
- **Web:** محدود (يتبع المتصفح)

---

### ❓ كيف أختبر الإشعارات؟
**📝 الخطوات:**
1. افتح Admin Panel
2. اختر "Push (Mobile)"
3. املأ البيانات
4. اختر "الجميع"
5. اضغط "إرسال"
6. تحقق من الهاتف

---

## 🆘 مشاكل شائعة وحلولها

### 🔴 المشكلة: "تبويب Push معطل"
**✅ الحل:**
1. تحقق من Firestore: `system_settings/fcm_config/accessToken`
2. أعد تحميل الصفحة (F5)
3. تحقق من Console للأخطاء

---

### 🔴 المشكلة: "لا تصل الإشعارات"
**✅ الحل:**
1. تحقق من Access Token (لم ينتهي)
2. تحقق من FCM Tokens في Firestore
3. تحقق من أن المستخدم سمح بالإشعارات
4. تحقق من Console للأخطاء

---

### 🔴 المشكلة: "Invalid authentication credentials"
**✅ الحل:**
1. Access Token منتهي → جدده
2. Access Token خاطئ → انسخه مرة أخرى
3. OAuth Client ID خاطئ → تحقق منه

---

### 🔴 المشكلة: "Permission denied"
**✅ الحل:**
1. تحقق من OAuth Client ID
2. تحقق من Redirect URI
3. تحقق من أنك سجلت دخول بالحساب الصحيح

---

## 📞 هل تحتاج مساعدة إضافية؟

### 📚 الملفات المفيدة:
- `ما_المطلوب_منك_الآن.md` - الخطوات الأساسية
- `دليل_مصور_للخطوات.md` - دليل مصور
- `الحل_النهائي_V1_API.md` - تفاصيل تقنية
- `خطوات_Firestore_بالتفصيل.md` - دليل Firestore

### 🔍 للتحقق من الأخطاء:
1. افتح Console (F12)
2. اذهب لـ "Console" tab
3. ابحث عن رسائل الخطأ باللون الأحمر

---

**🎉 بالتوفيق!**
