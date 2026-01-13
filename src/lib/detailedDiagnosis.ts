import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from './firebase';

export const runDetailedDiagnosis = async () => {
  console.log('🔍 بدء التشخيص المفصل...');
  
  const results = {
    firebaseConnection: false,
    medicinesCollection: {
      exists: false,
      count: 0,
      documents: [] as any[],
      queryWithOrderBy: false,
      queryWithPharmacyId: false
    },
    possibleIssues: [] as string[],
    recommendations: [] as string[]
  };

  try {
    // 1. اختبار الاتصال الأساسي
    console.log('1️⃣ اختبار الاتصال بـ Firebase...');
    const testRef = collection(db, 'medicines');
    await getDocs(testRef);
    results.firebaseConnection = true;
    console.log('✅ الاتصال بـ Firebase يعمل');

    // 2. فحص مجموعة الأدوية الأساسية
    console.log('2️⃣ فحص مجموعة الأدوية...');
    const medicinesSnapshot = await getDocs(testRef);
    results.medicinesCollection.exists = true;
    results.medicinesCollection.count = medicinesSnapshot.size;
    
    console.log(`📊 عدد الأدوية: ${medicinesSnapshot.size}`);
    
    if (medicinesSnapshot.size > 0) {
      // جمع بيانات الأدوية
      medicinesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        results.medicinesCollection.documents.push({
          id: doc.id,
          name: data.name,
          pharmacyId: data.pharmacyId,
          createdAt: data.createdAt,
          hasRequiredFields: !!(data.name && data.price && data.quantity)
        });
        console.log(`- ${data.name || 'بدون اسم'} (ID: ${doc.id}, Pharmacy: ${data.pharmacyId})`);
      });
    }

    // 3. اختبار الاستعلام مع orderBy
    console.log('3️⃣ اختبار الاستعلام مع orderBy...');
    try {
      const orderedQuery = query(collection(db, 'medicines'), orderBy('createdAt', 'desc'));
      const orderedSnapshot = await getDocs(orderedQuery);
      results.medicinesCollection.queryWithOrderBy = true;
      console.log(`✅ استعلام orderBy يعمل - النتائج: ${orderedSnapshot.size}`);
    } catch (orderError: any) {
      console.error('❌ فشل استعلام orderBy:', orderError.message);
      results.possibleIssues.push('فشل في استعلام orderBy - قد يكون بسبب عدم وجود فهرس مركب');
      results.recommendations.push('إنشاء فهرس مركب في Firebase Console للحقل createdAt');
    }

    // 4. اختبار الاستعلام مع pharmacyId
    console.log('4️⃣ اختبار الاستعلام مع pharmacyId...');
    try {
      const pharmacyQuery = query(
        collection(db, 'medicines'), 
        where('pharmacyId', '==', 1),
        orderBy('createdAt', 'desc')
      );
      const pharmacySnapshot = await getDocs(pharmacyQuery);
      results.medicinesCollection.queryWithPharmacyId = true;
      console.log(`✅ استعلام pharmacyId يعمل - النتائج: ${pharmacySnapshot.size}`);
    } catch (pharmacyError: any) {
      console.error('❌ فشل استعلام pharmacyId:', pharmacyError.message);
      results.possibleIssues.push('فشل في استعلام pharmacyId مع orderBy - يحتاج فهرس مركب');
      results.recommendations.push('إنشاء فهرس مركب في Firebase Console للحقول pharmacyId + createdAt');
    }

    // 5. تحليل البيانات
    if (results.medicinesCollection.count === 0) {
      results.possibleIssues.push('مجموعة الأدوية فارغة');
      results.recommendations.push('تشغيل صفحة البذر لإضافة بيانات تجريبية');
    }

    const documentsWithoutRequiredFields = results.medicinesCollection.documents.filter(doc => !doc.hasRequiredFields);
    if (documentsWithoutRequiredFields.length > 0) {
      results.possibleIssues.push(`${documentsWithoutRequiredFields.length} أدوية تفتقر للحقول المطلوبة`);
      results.recommendations.push('التحقق من بنية البيانات في Firebase Console');
    }

    const documentsWithoutCreatedAt = results.medicinesCollection.documents.filter(doc => !doc.createdAt);
    if (documentsWithoutCreatedAt.length > 0) {
      results.possibleIssues.push(`${documentsWithoutCreatedAt.length} أدوية بدون حقل createdAt`);
      results.recommendations.push('إضافة حقل createdAt للأدوية الموجودة');
    }

  } catch (error: any) {
    console.error('❌ خطأ في التشخيص:', error);
    results.possibleIssues.push(`خطأ في الاتصال: ${error.message}`);
    
    if (error.code === 'permission-denied') {
      results.recommendations.push('التحقق من قواعد الأمان في Firestore');
    } else if (error.code === 'failed-precondition') {
      results.recommendations.push('إنشاء الفهارس المطلوبة في Firebase Console');
    }
  }

  // 6. تقرير النتائج
  console.log('\n📋 تقرير التشخيص:');
  console.log('='.repeat(50));
  console.log(`🔗 الاتصال بـ Firebase: ${results.firebaseConnection ? '✅' : '❌'}`);
  console.log(`📦 مجموعة الأدوية موجودة: ${results.medicinesCollection.exists ? '✅' : '❌'}`);
  console.log(`📊 عدد الأدوية: ${results.medicinesCollection.count}`);
  console.log(`🔍 استعلام orderBy: ${results.medicinesCollection.queryWithOrderBy ? '✅' : '❌'}`);
  console.log(`🏥 استعلام pharmacyId: ${results.medicinesCollection.queryWithPharmacyId ? '✅' : '❌'}`);
  
  if (results.possibleIssues.length > 0) {
    console.log('\n⚠️ المشاكل المحتملة:');
    results.possibleIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 التوصيات:');
    results.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }

  return results;
};