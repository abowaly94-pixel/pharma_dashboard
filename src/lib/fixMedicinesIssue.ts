import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// بيانات أدوية تجريبية للإضافة الفورية
const quickMedicines = [
  {
    id: 'med1',
    name: 'أسبرين',
    code: 'ASP-001',
    description: 'مسكن للألم ومضاد للالتهابات، يستخدم لتخفيف الصداع والآلام الخفيفة',
    price: 25,
    quantity: 100,
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل',
    pharmcyAddress: 'شارع التحرير، القاهرة',
    category: 'مسكنات',
    manufacturer: 'شركة الأدوية المصرية',
    avgRating: 4.5,
    ratingCount: 12,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 45,
    reviews: [],
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'med2',
    name: 'بنادول',
    code: 'PAN-002',
    description: 'مسكن للألم وخافض للحرارة، آمن وفعال للاستخدام اليومي',
    price: 18,
    quantity: 150,
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل',
    pharmcyAddress: 'شارع التحرير، القاهرة',
    category: 'مسكنات',
    manufacturer: 'GSK',
    avgRating: 4.2,
    ratingCount: 8,
    discountRating: 10,
    isNewProduct: true,
    sellingCount: 78,
    reviews: [],
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'med3',
    name: 'سيتال',
    code: 'CIT-003',
    description: 'مضاد للحساسية، يخفف أعراض الحساسية الموسمية',
    price: 35,
    quantity: 80,
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل',
    pharmcyAddress: 'شارع التحرير، القاهرة',
    category: 'مضادات الحساسية',
    manufacturer: 'سانوفي',
    avgRating: 4.0,
    ratingCount: 5,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 23,
    reviews: [],
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'med4',
    name: 'فيتامين د',
    code: 'VIT-004',
    description: 'مكمل غذائي لتقوية العظام والمناعة',
    price: 45,
    quantity: 200,
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل',
    pharmcyAddress: 'شارع التحرير، القاهرة',
    category: 'فيتامينات',
    manufacturer: 'فايزر',
    avgRating: 4.7,
    ratingCount: 15,
    discountRating: 5,
    isNewProduct: true,
    sellingCount: 92,
    reviews: [],
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'med5',
    name: 'أوجمنتين',
    code: 'AUG-005',
    description: 'مضاد حيوي واسع المجال لعلاج الالتهابات البكتيرية',
    price: 65,
    quantity: 50,
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل',
    pharmcyAddress: 'شارع التحرير، القاهرة',
    category: 'مضادات حيوية',
    manufacturer: 'GSK',
    avgRating: 4.3,
    ratingCount: 20,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 156,
    reviews: [],
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const diagnoseAndFixMedicines = async () => {
  console.log('🔍 بدء تشخيص مشكلة الأدوية...');
  
  try {
    // تحقق من الاتصال بـ Firebase
    const medicinesRef = collection(db, 'medicines');
    const snapshot = await getDocs(medicinesRef);
    
    console.log(`📊 عدد الأدوية الحالية في قاعدة البيانات: ${snapshot.size}`);
    
    if (snapshot.size === 0) {
      console.log('❌ المشكلة: مجموعة الأدوية فارغة في Firestore');
      console.log('🔧 الحل: إضافة أدوية تجريبية...');
      
      // إضافة الأدوية التجريبية
      for (const medicine of quickMedicines) {
        await setDoc(doc(db, 'medicines', medicine.id), medicine);
        console.log(`✅ تم إضافة: ${medicine.name}`);
      }
      
      console.log('🎉 تم إضافة 5 أدوية تجريبية بنجاح!');
      return {
        success: true,
        message: 'تم إضافة الأدوية التجريبية بنجاح',
        medicinesAdded: quickMedicines.length
      };
    } else {
      console.log('✅ يوجد أدوية في قاعدة البيانات');
      
      // عرض الأدوية الموجودة
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name || 'دواء بدون اسم'} (ID: ${doc.id})`);
      });
      
      return {
        success: true,
        message: 'يوجد أدوية في قاعدة البيانات',
        medicinesCount: snapshot.size
      };
    }
  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error);
    return {
      success: false,
      message: 'فشل في الاتصال بقاعدة البيانات',
      error: error
    };
  }
};

export const checkFirebaseConnection = async () => {
  try {
    console.log('🔗 اختبار الاتصال بـ Firebase...');
    const testRef = collection(db, 'medicines');
    await getDocs(testRef);
    console.log('✅ الاتصال بـ Firebase يعمل بشكل صحيح');
    return true;
  } catch (error) {
    console.error('❌ فشل الاتصال بـ Firebase:', error);
    return false;
  }
};