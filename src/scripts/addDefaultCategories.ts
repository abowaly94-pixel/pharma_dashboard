/**
 * Script لإضافة التصنيفات الافتراضية مباشرة في Firebase
 * يتم تشغيله مرة واحدة لإضافة التصنيفات
 */

import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultCategories = [
  {
    name: 'مسكنات الألم',
    nameEn: 'Pain Relievers',
    description: 'أدوية لتخفيف الألم والصداع',
  },
  {
    name: 'مضادات حيوية',
    nameEn: 'Antibiotics',
    description: 'أدوية لعلاج العدوى البكتيرية',
  },
  {
    name: 'فيتامينات ومكملات',
    nameEn: 'Vitamins & Supplements',
    description: 'فيتامينات ومكملات غذائية',
  },
  {
    name: 'أدوية القلب والأوعية الدموية',
    nameEn: 'Cardiovascular',
    description: 'أدوية لعلاج أمراض القلب والضغط',
  },
  {
    name: 'أدوية الجهاز الهضمي',
    nameEn: 'Digestive System',
    description: 'أدوية لعلاج مشاكل الجهاز الهضمي',
  },
  {
    name: 'أدوية الجهاز التنفسي',
    nameEn: 'Respiratory System',
    description: 'أدوية لعلاج الربو والحساصية',
  },
  {
    name: 'أدوية السكري',
    nameEn: 'Diabetes',
    description: 'أدوية لعلاج مرض السكري',
  },
  {
    name: 'مضادات الالتهاب',
    nameEn: 'Anti-inflammatory',
    description: 'أدوية لتقليل الالتهابات',
  },
  {
    name: 'أدوية الجلدية',
    nameEn: 'Dermatology',
    description: 'أدوية لعلاج الأمراض الجلدية',
  },
  {
    name: 'أدوية الأطفال',
    nameEn: 'Pediatrics',
    description: 'أدوية مخصصة للأطفال',
  },
];

export async function addDefaultCategoriesToFirebase(adminId: string = 'system') {
  console.log('🌱 بدء إضافة التصنيفات الافتراضية إلى Firebase...');

  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const category of defaultCategories) {
    try {
      // إنشاء ID فريد للتصنيف
      const categoryId = doc(collection(db, 'medicine_categories')).id;

      const categoryData = {
        name: category.name,
        nameEn: category.nameEn,
        description: category.description,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: adminId,
      };

      // إضافة التصنيف إلى Firebase
      await setDoc(doc(db, 'medicine_categories', categoryId), categoryData);

      console.log(`✅ تم إضافة: ${category.name} (ID: ${categoryId})`);
      results.success.push(category.name);
    } catch (error) {
      console.error(`❌ فشل إضافة ${category.name}:`, error);
      results.failed.push(category.name);
    }
  }

  console.log('\n📊 النتيجة النهائية:');
  console.log(`✅ نجح: ${results.success.length}`);
  console.log(`❌ فشل: ${results.failed.length}`);

  return results;
}
