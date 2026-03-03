/**
 * سكريبت لإضافة الفئات الجديدة إلى قاعدة البيانات
 * Script to add new categories to the database
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

// Firebase configuration - استخدم نفس الإعدادات من ملف .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CATEGORIES_COLLECTION = 'medicine_categories';

// الفئات الجديدة
const newCategories = [
  {
    name: 'أدوية',
    nameEn: 'Medicines',
    description: 'جميع أنواع الأدوية والعقاقير الطبية',
    isActive: true,
  },
  {
    name: 'إكسسوارات',
    nameEn: 'Accessories',
    description: 'إكسسوارات طبية ومنتجات العناية الشخصية',
    isActive: true,
  },
  {
    name: 'أدوات كلية أسنان',
    nameEn: 'Dental Tools',
    description: 'أدوات ومعدات طب الأسنان',
    isActive: true,
  },
];

async function addCategories() {
  console.log('🚀 بدء إضافة الفئات الجديدة...\n');

  for (const category of newCategories) {
    try {
      // التحقق من عدم وجود الفئة مسبقاً
      const existingQuery = query(
        collection(db, CATEGORIES_COLLECTION),
        where('name', '==', category.name)
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        console.log(`⚠️  الفئة "${category.name}" موجودة بالفعل، تخطي...`);
        continue;
      }

      // إنشاء معرف جديد
      const categoryId = doc(collection(db, CATEGORIES_COLLECTION)).id;

      // إضافة الفئة
      await setDoc(doc(db, CATEGORIES_COLLECTION, categoryId), {
        ...category,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
      });

      console.log(`✅ تمت إضافة الفئة "${category.name}" بنجاح`);
    } catch (error) {
      console.error(`❌ خطأ في إضافة الفئة "${category.name}":`, error);
    }
  }

  console.log('\n✨ انتهى إضافة الفئات!');
  process.exit(0);
}

addCategories();
