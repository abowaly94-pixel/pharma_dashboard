/**
 * سكريبت لحذف الأدوية المكررة بناءً على الكود
 * Script to remove duplicate medicines based on code
 */

import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteImageFromSupabase } from '@/lib/supabase';

interface DuplicateResult {
  totalChecked: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  errors: string[];
}

/**
 * حذف الأدوية المكررة - يحتفظ بالأحدث ويحذف الأقدم
 */
export async function removeDuplicateMedicines(collectionName: string = 'medicines'): Promise<DuplicateResult> {
  console.log(`🔄 بدء فحص الأدوية المكررة في ${collectionName}...`);

  const result: DuplicateResult = {
    totalChecked: 0,
    duplicatesFound: 0,
    duplicatesRemoved: 0,
    errors: [],
  };

  try {
    // جلب جميع الأدوية مرتبة حسب تاريخ الإنشاء
    const medicinesRef = collection(db, collectionName);
    const q = query(medicinesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    console.log(`📂 تم جلب ${snapshot.size} دواء`);
    result.totalChecked = snapshot.size;

    // تجميع الأدوية حسب الكود
    const medicinesByCode = new Map<string, any[]>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const code = data.code;

      if (!medicinesByCode.has(code)) {
        medicinesByCode.set(code, []);
      }

      medicinesByCode.get(code)!.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      });
    });

    // البحث عن المكررات
    for (const [code, medicines] of medicinesByCode.entries()) {
      if (medicines.length > 1) {
        result.duplicatesFound += medicines.length - 1;
        console.log(`\n⚠️ وجدنا ${medicines.length} أدوية بالكود: ${code}`);

        // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
        medicines.sort((a, b) => {
          const dateA = a.createdAt?.getTime() || 0;
          const dateB = b.createdAt?.getTime() || 0;
          return dateB - dateA;
        });

        // الاحتفاظ بالأول (الأحدث) وحذف الباقي
        const [keep, ...toDelete] = medicines;
        console.log(`   ✓ سيتم الاحتفاظ بـ: ${keep.name} (${keep.id})`);

        for (const medicine of toDelete) {
          try {
            console.log(`   🗑️ حذف: ${medicine.name} (${medicine.id})`);

            // حذف الصورة من Supabase إذا كانت موجودة
            if (medicine.subabaseImageUrl?.includes('supabase.co/storage')) {
              await deleteImageFromSupabase(medicine.subabaseImageUrl);
              console.log(`      ✓ تم حذف الصورة`);
            }

            // حذف المستند
            await deleteDoc(doc(db, collectionName, medicine.id));
            result.duplicatesRemoved++;
            console.log(`      ✓ تم حذف المستند`);
          } catch (error) {
            const errorMsg = `فشل حذف ${medicine.id}: ${error}`;
            result.errors.push(errorMsg);
            console.error(`      ✗ ${errorMsg}`);
          }
        }
      }
    }

    console.log('\n✅ اكتمل الفحص!');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - إجمالي الأدوية: ${result.totalChecked}`);
    console.log(`   - مكررات وجدت: ${result.duplicatesFound}`);
    console.log(`   - مكررات حذفت: ${result.duplicatesRemoved}`);
    console.log(`   - أخطاء: ${result.errors.length}`);

    return result;
  } catch (error) {
    console.error('❌ خطأ في الفحص:', error);
    throw error;
  }
}

/**
 * حذف دواء معين بالكود
 */
export async function removeMedicineByCode(code: string, collectionName: string = 'medicines'): Promise<boolean> {
  try {
    const medicinesRef = collection(db, collectionName);
    const snapshot = await getDocs(medicinesRef);

    const medicines = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((m: any) => m.code === code);

    if (medicines.length === 0) {
      console.log(`لم يتم العثور على دواء بالكود: ${code}`);
      return false;
    }

    if (medicines.length === 1) {
      console.log(`وجدنا دواء واحد فقط بالكود: ${code}`);
      return false;
    }

    // ترتيب حسب تاريخ الإنشاء والاحتفاظ بالأحدث
    medicines.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
      const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
      return dateB - dateA;
    });

    const [keep, ...toDelete] = medicines;
    console.log(`سيتم الاحتفاظ بـ: ${(keep as any).name} (${keep.id})`);

    for (const medicine of toDelete) {
      console.log(`حذف: ${(medicine as any).name} (${medicine.id})`);
      
      if ((medicine as any).subabaseImageUrl?.includes('supabase.co/storage')) {
        await deleteImageFromSupabase((medicine as any).subabaseImageUrl);
      }
      
      await deleteDoc(doc(db, collectionName, medicine.id));
    }

    console.log(`✅ تم حذف ${toDelete.length} دواء مكرر`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في حذف الدواء:', error);
    throw error;
  }
}
