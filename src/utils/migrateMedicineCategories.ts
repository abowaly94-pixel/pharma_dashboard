/**
 * سكريبت لتحديث الأدوية القديمة وإضافة التصنيفات
 * Script to migrate old medicines and add category IDs
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAllCategories } from '@/services/categoryService';

interface MigrationResult {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * تحديث الأدوية القديمة بإضافة category ID
 */
export async function migrateMedicineCategories(): Promise<MigrationResult> {
  console.log('🔄 بدء تحديث الأدوية القديمة...');

  const result: MigrationResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // جلب جميع التصنيفات
    const categories = await getAllCategories(false);
    console.log(`📦 تم جلب ${categories.length} تصنيف`);

    if (categories.length === 0) {
      console.warn('⚠️ لا توجد تصنيفات! يجب إضافة تصنيفات أولاً');
      return result;
    }

    // إنشاء خريطة للبحث السريع (اسم التصنيف -> ID)
    const categoryMap = new Map<string, string>();
    categories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat.id);
      categoryMap.set(cat.nameEn.toLowerCase(), cat.id);
    });

    // تحديث الأدوية في medicines collection
    await updateMedicinesInCollection('medicines', categoryMap, result);

    // تحديث الأدوية في pending_medicines collection
    await updateMedicinesInCollection('pending_medicines', categoryMap, result);

    console.log('\n📊 نتيجة التحديث:');
    console.log(`✅ تم التحديث: ${result.updated}`);
    console.log(`⏭️ تم التخطي: ${result.skipped}`);
    console.log(`❌ أخطاء: ${result.errors}`);
    console.log(`📈 الإجمالي: ${result.total}`);

    return result;
  } catch (error) {
    console.error('❌ خطأ في التحديث:', error);
    throw error;
  }
}

async function updateMedicinesInCollection(
  collectionName: string,
  categoryMap: Map<string, string>,
  result: MigrationResult
): Promise<void> {
  console.log(`\n📂 معالجة ${collectionName}...`);

  const snapshot = await getDocs(collection(db, collectionName));
  console.log(`📊 عدد الأدوية: ${snapshot.docs.length}`);

  for (const medicineDoc of snapshot.docs) {
    result.total++;
    const data = medicineDoc.data();
    const currentCategory = data.category;

    try {
      // إذا كان فيه category بالفعل وهو ID صحيح، تخطي
      if (currentCategory && typeof currentCategory === 'string' && currentCategory.length > 10) {
        // تحقق إذا كان ID موجود في التصنيفات
        const categoryExists = Array.from(categoryMap.values()).includes(currentCategory);
        if (categoryExists) {
          console.log(`⏭️ ${data.name}: التصنيف موجود بالفعل`);
          result.skipped++;
          continue;
        }
      }

      // محاولة إيجاد التصنيف المناسب
      let categoryId: string | null = null;

      if (currentCategory && typeof currentCategory === 'string') {
        // البحث بالاسم
        categoryId = categoryMap.get(currentCategory.toLowerCase()) || null;
      }

      // إذا لم نجد تصنيف، استخدم تصنيف افتراضي (أول تصنيف)
      if (!categoryId) {
        categoryId = categoryMap.values().next().value || null;
        console.log(`⚠️ ${data.name}: لم يتم العثور على تصنيف مطابق، استخدام التصنيف الافتراضي`);
      }

      if (categoryId) {
        await updateDoc(doc(db, collectionName, medicineDoc.id), {
          category: categoryId,
        });
        console.log(`✅ ${data.name}: تم التحديث`);
        result.updated++;
      } else {
        console.warn(`⚠️ ${data.name}: لم يتم العثور على تصنيف`);
        result.skipped++;
      }
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${data.name}:`, error);
      result.errors++;
    }
  }
}

/**
 * تعيين تصنيف افتراضي لجميع الأدوية بدون تصنيف
 */
export async function setDefaultCategoryForAll(defaultCategoryId: string): Promise<MigrationResult> {
  console.log('🔄 تعيين تصنيف افتراضي لجميع الأدوية...');

  const result: MigrationResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // تحديث medicines
    await setDefaultInCollection('medicines', defaultCategoryId, result);

    // تحديث pending_medicines
    await setDefaultInCollection('pending_medicines', defaultCategoryId, result);

    console.log('\n📊 نتيجة التحديث:');
    console.log(`✅ تم التحديث: ${result.updated}`);
    console.log(`⏭️ تم التخطي: ${result.skipped}`);
    console.log(`❌ أخطاء: ${result.errors}`);

    return result;
  } catch (error) {
    console.error('❌ خطأ في التحديث:', error);
    throw error;
  }
}

async function setDefaultInCollection(
  collectionName: string,
  defaultCategoryId: string,
  result: MigrationResult
): Promise<void> {
  const snapshot = await getDocs(collection(db, collectionName));

  for (const medicineDoc of snapshot.docs) {
    result.total++;
    const data = medicineDoc.data();

    try {
      if (!data.category || data.category === '') {
        await updateDoc(doc(db, collectionName, medicineDoc.id), {
          category: defaultCategoryId,
        });
        console.log(`✅ ${data.name}: تم تعيين التصنيف الافتراضي`);
        result.updated++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      console.error(`❌ خطأ في تحديث ${data.name}:`, error);
      result.errors++;
    }
  }
}
