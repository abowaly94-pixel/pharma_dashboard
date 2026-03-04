/**
 * سكريبت لتحديث الأدوية الموجودة وإضافة صور الأقسام
 * Script to update existing medicines with section images
 */

import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sectionService } from '@/services/sectionService';

interface UpdateResult {
  total: number;
  updated: number;
  skipped: number;
  errors: string[];
}

/**
 * تحديث الأدوية بإضافة صور الأقسام
 */
export async function updateMedicineSectionImages(): Promise<UpdateResult> {
  console.log('🔄 بدء تحديث صور الأقسام في الأدوية...');

  const result: UpdateResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // جلب جميع الأقسام
    const sections = await sectionService.getAllSections();
    console.log(`📂 تم جلب ${sections.length} قسم`);

    // إنشاء خريطة للأقسام (ID -> Section)
    const sectionMap = new Map(sections.map(s => [s.id, s]));

    // تحديث الأدوية في كل collection
    await updateCollectionMedicines('medicines', sectionMap, result);
    await updateCollectionMedicines('pending_medicines', sectionMap, result);

    console.log('\n✅ اكتمل التحديث!');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - إجمالي الأدوية: ${result.total}`);
    console.log(`   - تم التحديث: ${result.updated}`);
    console.log(`   - تم التخطي: ${result.skipped}`);
    console.log(`   - الأخطاء: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.error('\n❌ الأخطاء:', result.errors);
    }

    return result;
  } catch (error) {
    console.error('❌ خطأ في التحديث:', error);
    throw error;
  }
}

async function updateCollectionMedicines(
  collectionName: string,
  sectionMap: Map<string, any>,
  result: UpdateResult
): Promise<void> {
  console.log(`\n📂 معالجة ${collectionName}...`);

  try {
    // جلب الأدوية التي لها sectionId ولكن بدون sectionImageUrl
    const medicinesRef = collection(db, collectionName);
    const snapshot = await getDocs(medicinesRef);

    console.log(`   وجدنا ${snapshot.size} دواء`);

    for (const medicineDoc of snapshot.docs) {
      result.total++;
      const medicineData = medicineDoc.data();
      const sectionId = medicineData.sectionId;

      // تخطي إذا لم يكن هناك sectionId
      if (!sectionId) {
        result.skipped++;
        continue;
      }

      // تخطي إذا كانت الصورة موجودة بالفعل
      if (medicineData.sectionImageUrl) {
        result.skipped++;
        continue;
      }

      // جلب بيانات القسم
      const section = sectionMap.get(sectionId);
      if (!section) {
        result.errors.push(`القسم ${sectionId} غير موجود للدواء ${medicineDoc.id}`);
        result.skipped++;
        continue;
      }

      // تخطي إذا لم يكن للقسم صورة
      if (!section.sectionImageUrl) {
        result.skipped++;
        continue;
      }

      // تحديث الدواء
      try {
        await updateDoc(doc(db, collectionName, medicineDoc.id), {
          sectionImageUrl: section.sectionImageUrl || '',
          sectionOriginalImageUrl: section.originalImageUrl || '',
          updatedAt: new Date(),
        });

        result.updated++;
        console.log(`   ✓ تم تحديث: ${medicineData.name} (${medicineDoc.id})`);
      } catch (error) {
        const errorMsg = `فشل تحديث ${medicineDoc.id}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`   ✗ ${errorMsg}`);
      }
    }
  } catch (error) {
    console.error(`❌ خطأ في معالجة ${collectionName}:`, error);
    throw error;
  }
}

/**
 * تحديث أدوية قسم معين فقط
 */
export async function updateSectionMedicinesImages(sectionId: string): Promise<UpdateResult> {
  console.log(`🔄 تحديث صور الأدوية للقسم ${sectionId}...`);

  const result: UpdateResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // جلب بيانات القسم
    const sections = await sectionService.getAllSections();
    const section = sections.find(s => s.id === sectionId);

    if (!section) {
      throw new Error(`القسم ${sectionId} غير موجود`);
    }

    if (!section.sectionImageUrl) {
      console.log('⚠️ القسم لا يحتوي على صورة');
      return result;
    }

    // تحديث الأدوية في كل collection
    await updateSectionInCollection('medicines', sectionId, section, result);
    await updateSectionInCollection('pending_medicines', sectionId, section, result);

    console.log('\n✅ اكتمل التحديث!');
    console.log(`📊 الإحصائيات:`);
    console.log(`   - إجمالي الأدوية: ${result.total}`);
    console.log(`   - تم التحديث: ${result.updated}`);
    console.log(`   - تم التخطي: ${result.skipped}`);

    return result;
  } catch (error) {
    console.error('❌ خطأ في التحديث:', error);
    throw error;
  }
}

async function updateSectionInCollection(
  collectionName: string,
  sectionId: string,
  section: any,
  result: UpdateResult
): Promise<void> {
  try {
    const medicinesRef = collection(db, collectionName);
    const q = query(medicinesRef, where('sectionId', '==', sectionId));
    const snapshot = await getDocs(q);

    console.log(`   وجدنا ${snapshot.size} دواء في ${collectionName}`);

    for (const medicineDoc of snapshot.docs) {
      result.total++;

      try {
        await updateDoc(doc(db, collectionName, medicineDoc.id), {
          sectionImageUrl: section.sectionImageUrl || '',
          sectionOriginalImageUrl: section.originalImageUrl || '',
          updatedAt: new Date(),
        });

        result.updated++;
        console.log(`   ✓ تم تحديث: ${medicineDoc.data().name}`);
      } catch (error) {
        const errorMsg = `فشل تحديث ${medicineDoc.id}: ${error}`;
        result.errors.push(errorMsg);
        console.error(`   ✗ ${errorMsg}`);
      }
    }
  } catch (error) {
    console.error(`❌ خطأ في معالجة ${collectionName}:`, error);
    throw error;
  }
}
