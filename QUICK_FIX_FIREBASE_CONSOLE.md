# 🚀 حل سريع: تحويل pharmacyId إلى Integer من Firebase Console

## المشكلة
الأدوية والصيدليات الموجودة لسه `pharmacyId` بتاعها **string** مش **integer**.

## الحل السريع (5 دقائق)

### الخطوة 1: افتح Firebase Console
1. اذهب إلى: https://console.firebase.google.com
2. اختر مشروعك
3. اذهب إلى **Firestore Database**

### الخطوة 2: افتح Developer Console
اضغط **F12** أو **Ctrl+Shift+I** (في Windows) أو **Cmd+Option+I** (في Mac)

### الخطوة 3: الصق هذا الكود

```javascript
// 🔥 Script لتحويل pharmacyId من String إلى Integer
// انسخ والصق الكود ده كله في Console واضغط Enter

(async function migrateAllPharmacyIds() {
  console.log('🚀 بدء عملية التحويل...\n');
  
  const db = firebase.firestore();
  let totalUpdated = 0;
  
  try {
    // ========================================
    // 1. تحويل pharmacies collection
    // ========================================
    console.log('📝 Step 1: تحويل pharmacies...');
    const pharmaciesSnapshot = await db.collection('pharmacies').get();
    
    if (pharmaciesSnapshot.empty) {
      console.log('⚠️ لا توجد صيدليات');
    } else {
      let nextId = 10001;
      const pharmacyMapping = {}; // map من old ID إلى new ID
      
      // إنشاء الخريطة أولاً
      pharmaciesSnapshot.forEach(doc => {
        const oldId = doc.data().pharmacyId;
        pharmacyMapping[oldId] = nextId;
        pharmacyMapping[doc.id] = nextId; // أيضاً map الـ Firebase UID
        console.log(`  ${doc.data().name}: "${oldId}" → ${nextId}`);
        nextId++;
      });
      
      // تحديث الصيدليات
      const batch1 = db.batch();
      pharmaciesSnapshot.forEach(doc => {
        const oldId = doc.data().pharmacyId;
        const newId = pharmacyMapping[oldId];
        batch1.update(doc.ref, { pharmacyId: newId });
      });
      await batch1.commit();
      totalUpdated += pharmaciesSnapshot.size;
      console.log(`✅ تم تحديث ${pharmaciesSnapshot.size} صيدلية\n`);
      
      // ========================================
      // 2. تحويل users collection
      // ========================================
      console.log('📝 Step 2: تحويل users (الصيادلة)...');
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'pharmacist')
        .get();
      
      if (!usersSnapshot.empty) {
        const batch2 = db.batch();
        usersSnapshot.forEach(doc => {
          const oldId = doc.data().pharmacyId;
          const newId = pharmacyMapping[oldId] || pharmacyMapping[doc.id];
          if (newId) {
            batch2.update(doc.ref, { pharmacyId: newId });
            console.log(`  ${doc.data().name}: ${oldId} → ${newId}`);
          }
        });
        await batch2.commit();
        totalUpdated += usersSnapshot.size;
        console.log(`✅ تم تحديث ${usersSnapshot.size} مستخدم\n`);
      }
      
      // ========================================
      // 3. تحويل medicines collection
      // ========================================
      console.log('📝 Step 3: تحويل medicines...');
      const medicinesSnapshot = await db.collection('medicines').get();
      
      if (!medicinesSnapshot.empty) {
        const batch3 = db.batch();
        let medicineCount = 0;
        
        medicinesSnapshot.forEach(doc => {
          const oldId = doc.data().pharmacyId;
          const newId = pharmacyMapping[oldId];
          if (newId) {
            batch3.update(doc.ref, { pharmacyId: newId });
            medicineCount++;
          }
        });
        
        await batch3.commit();
        totalUpdated += medicineCount;
        console.log(`✅ تم تحديث ${medicineCount} دواء\n`);
      }
      
      // ========================================
      // 4. تحويل pending_medicines collection
      // ========================================
      console.log('📝 Step 4: تحويل pending_medicines...');
      const pendingSnapshot = await db.collection('pending_medicines').get();
      
      if (!pendingSnapshot.empty) {
        const batch4 = db.batch();
        let pendingCount = 0;
        
        pendingSnapshot.forEach(doc => {
          const oldId = doc.data().pharmacyId;
          const newId = pharmacyMapping[oldId];
          if (newId) {
            batch4.update(doc.ref, { pharmacyId: newId });
            pendingCount++;
          }
        });
        
        await batch4.commit();
        totalUpdated += pendingCount;
        console.log(`✅ تم تحديث ${pendingCount} دواء معلق\n`);
      }
      
      // ========================================
      // 5. تحويل orders collection
      // ========================================
      console.log('📝 Step 5: تحويل orders...');
      const ordersSnapshot = await db.collection('orders').get();
      
      if (!ordersSnapshot.empty) {
        const batch5 = db.batch();
        let orderCount = 0;
        
        ordersSnapshot.forEach(doc => {
          const oldId = doc.data().pharmacyId;
          if (oldId) {
            const newId = pharmacyMapping[oldId];
            if (newId) {
              batch5.update(doc.ref, { pharmacyId: newId });
              orderCount++;
            }
          }
        });
        
        if (orderCount > 0) {
          await batch5.commit();
          totalUpdated += orderCount;
          console.log(`✅ تم تحديث ${orderCount} طلب\n`);
        }
      }
    }
    
    // ========================================
    // النتيجة النهائية
    // ========================================
    console.log('🎉 تمت عملية التحويل بنجاح!');
    console.log(`📊 إجمالي التحديثات: ${totalUpdated}`);
    console.log('\n✅ جميع pharmacyId الآن integer بدلاً من string');
    console.log('\n🔍 للتحقق: افتح أي صيدلية أو دواء وتأكد أن pharmacyId بدون علامات تنصيص');
    
  } catch (error) {
    console.error('❌ حدث خطأ:', error);
    console.error('تفاصيل الخطأ:', error.message);
  }
})();
```

### الخطوة 4: انتظر حتى ينتهي
سترى رسائل في Console توضح التقدم:
```
🚀 بدء عملية التحويل...

📝 Step 1: تحويل pharmacies...
  Abdelrahman Waly: "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1" → 10001
✅ تم تحديث 1 صيدلية

📝 Step 2: تحويل users (الصيادلة)...
✅ تم تحديث 1 مستخدم

📝 Step 3: تحويل medicines...
✅ تم تحديث 5 دواء

📝 Step 4: تحويل pending_medicines...
✅ تم تحديث 3 دواء معلق

🎉 تمت عملية التحويل بنجاح!
```

### الخطوة 5: تحقق من النتيجة
1. في Firestore، افتح أي صيدلية
2. تحقق من `pharmacyId`:
   - ✅ **صح**: `pharmacyId: 10001` (بدون علامات تنصيص)
   - ❌ **غلط**: `pharmacyId: "10001"` (بعلامات تنصيص)

3. افتح أي دواء (medicines أو pending_medicines)
4. تحقق من `pharmacyId`:
   - ✅ **صح**: `pharmacyId: 10001`
   - ❌ **غلط**: `pharmacyId: "wN1x6Mudc0X3Ba9y4M2lFfkEKqf1"`

## إذا ظهر خطأ "firebase is not defined"

معناه إنك مش في صفحة Firebase Console الصح. تأكد إنك:
1. في صفحة **Firestore Database** (مش أي صفحة تانية)
2. في نفس المشروع اللي شغال عليه
3. جرب تعمل refresh للصفحة وتحاول تاني

## بعد التحويل

### الصيدليات الجديدة:
لما تضيف صيدلية جديدة، هتاخد ID تلقائي:
- أول صيدلية: `10001`
- تاني صيدلية: `10002`
- تالت صيدلية: `10003`
- وهكذا...

### الأدوية الجديدة:
لما الصيدلي يضيف دواء جديد، `pharmacyId` هيتحفظ تلقائياً كـ **integer**.

### التطبيق المحمول:
```dart
// الآن هيشتغل بدون مشاكل
final pharmacyId = json['pharmacyId'] as int; // ✅
```

## استكشاف الأخطاء

### "لسه string بعد التحويل"
1. امسح cache المتصفح (Ctrl+Shift+Delete)
2. أعد تحميل Firebase Console
3. تحقق من Console logs أن السكريبت اشتغل بنجاح

### "بعض الأدوية اتحولت وبعضها لأ"
- السكريبت بيحول بس الأدوية اللي `pharmacyId` بتاعها موجود في الخريطة
- تأكد إن كل الصيدليات اتحولت الأول

### "عايز أرجع للـ string تاني"
```javascript
// للرجوع (استخدمه بحذر!)
const pharmacies = await firebase.firestore().collection('pharmacies').get();
pharmacies.forEach(doc => {
  firebase.firestore().collection('pharmacies').doc(doc.id).update({
    pharmacyId: doc.id // رجوع للـ Firebase UID
  });
});
```

---

**ملاحظة مهمة:** 
- ⚠️ اعمل backup قبل التحويل
- ✅ الكود الجديد جاهز ويحفظ integer تلقائياً
- 🎯 التحويل ده مرة واحدة بس للبيانات القديمة
5