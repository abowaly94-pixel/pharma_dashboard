/**
 * سكريبت لإضافة تصنيفات افتراضية
 * Script to seed default categories
 */

import { createCategory } from '@/services/categoryService';

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
    description: 'أدوية لعلاج الربو والحساسية',
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

export async function seedCategories(adminId: string): Promise<void> {
  console.log('🌱 بدء إضافة التصنيفات الافتراضية...');

  let successCount = 0;
  let errorCount = 0;

  for (const category of defaultCategories) {
    try {
      await createCategory(category, adminId);
      console.log(`✅ تم إضافة: ${category.name}`);
      successCount++;
    } catch (error: any) {
      // تجاهل خطأ التكرار
      if (error.code === 'DUPLICATE') {
        console.log(`⚠️ موجود مسبقاً: ${category.name}`);
      } else {
        console.error(`❌ فشل إضافة ${category.name}:`, error);
        errorCount++;
      }
    }
  }

  console.log(`\n📊 النتيجة:`);
  console.log(`✅ تم الإضافة: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`⚠️ موجود مسبقاً: ${defaultCategories.length - successCount - errorCount}`);
}
