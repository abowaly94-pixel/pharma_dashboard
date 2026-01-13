import { auth, db } from './firebase';
import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Sample data for seeding Firebase
const sampleUsers = [
  {
    id: 'admin1',
    email: 'admin@test.com',
    name: 'مدير النظام',
    role: 'admin',
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل'
  },
  {
    id: 'pharm1',
    email: 'pharmacist@test.com',
    name: 'الصيدلي',
    role: 'pharmacist',
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل'
  },
  {
    id: 'user1',
    email: 'user@test.com',
    name: 'عميل تجريبي',
    role: 'user',
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل'
  }
];

const sampleMedicines = [
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
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop'
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
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=300&fit=crop'
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
    subabaseORImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&h=300&fit=crop'
  }
];

const samplePharmacies = [
  {
    id: 'pharm1',
    pharmacyId: 1,
    name: 'صيدلية النخيل',
    address: 'شارع التحرير، وسط البلد',
    city: 'القاهرة',
    phoneNumber: '01012345678',
    email: 'nakheel@pharmacy.com',
    ownerName: 'د. أحمد محمد',
    licenseNumber: 'LIC-2024-001',
    isActive: true,
    rating: 4.5,
    totalOrders: 0,
    totalMedicines: 0
  },
  {
    id: 'pharm2',
    pharmacyId: 2,
    name: 'صيدلية الشفاء',
    address: 'شارع الهرم، الجيزة',
    city: 'الجيزة',
    phoneNumber: '01098765432',
    email: 'shefaa@pharmacy.com',
    ownerName: 'د. فاطمة علي',
    licenseNumber: 'LIC-2024-002',
    isActive: true,
    rating: 4.3,
    totalOrders: 0,
    totalMedicines: 0
  }
];

const sampleOrders = [
  {
    id: 'ord1',
    orderId: 'ORD001',
    userId: 'user1',
    cartItem: [
      {
        count: 2,
        medicineEntity: {
          id: 'med1',
          name: 'أسبرين',
          price: 25,
          quantity: 100,
          pharmacyId: 1,
          pharmacyName: 'صيدلية النخيل'
        }
      }
    ],
    orderStatus: 'pending',
    paymentMethodName: 'Cash',
    payWithCash: true,
    deliveryFee: 10,
    subtotal: 50,
    totalAmount: 60,
    shippingAddressEntity: {
      namee: 'أحمد محمد',
      email: 'ahmed@test.com',
      phoneNumber: '01234567890',
      address: 'القاهرة، مصر',
      city: 'القاهرة',
      apartmentNumber: '15'
    },
    senderWalletPhone: '01234567890',
    pharmacyWalletNumber: null,
    paymentProofUrl: null,
    prescriptionUrl: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviews: []
  },
  {
    id: 'ord2',
    orderId: 'ORD002',
    userId: 'user1',
    cartItem: [
      {
        count: 1,
        medicineEntity: {
          id: 'med2',
          name: 'بنادول',
          price: 18,
          quantity: 150,
          pharmacyId: 1,
          pharmacyName: 'صيدلية النخيل'
        }
      },
      {
        count: 3,
        medicineEntity: {
          id: 'med3',
          name: 'سيتال',
          price: 35,
          quantity: 80,
          pharmacyId: 1,
          pharmacyName: 'صيدلية النخيل'
        }
      }
    ],
    orderStatus: 'delivered',
    paymentMethodName: 'Credit Card',
    payWithCash: false,
    deliveryFee: 15,
    subtotal: 123,
    totalAmount: 138,
    shippingAddressEntity: {
      namee: 'أحمد محمد',
      email: 'ahmed@test.com',
      phoneNumber: '01234567890',
      address: 'القاهرة، مصر',
      city: 'القاهرة',
      apartmentNumber: '15'
    },
    senderWalletPhone: '01234567890',
    pharmacyWalletNumber: '01000000000',
    paymentProofUrl: 'https://example.com/payment-proof.jpg',
    prescriptionUrl: 'https://example.com/prescription.pdf',
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    updatedAt: new Date(Date.now() - 86400000),
    reviews: []
  }
];

async function seedFirebaseDatabase() {
  try {
    console.log('🔄 بدء عملية إنشاء البيانات التجريبية...');
    console.log('⚠️ ملاحظة: هذه بيانات تجريبية فقط للاختبار');
    
    // Check if users collection is empty
    const usersSnapshot = await getDocs(query(collection(db, 'users')));
    if (usersSnapshot.empty) {
      console.log('Seeding users...');
      for (const user of sampleUsers) {
        try {
          // Create authentication account first
          const userCredential = await createUserWithEmailAndPassword(auth, user.email, '123456');
          
          // Store additional user data in Firestore using the Firebase Auth UID
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            name: user.name,
            email: user.email,
            role: user.role,
            pharmacyId: user.pharmacyId,
            pharmacyName: user.pharmacyName,
            uid: userCredential.user.uid,
            profileImageUrl: '',
            cart: [],
            favorites: [],
            createdAt: new Date()
          });
          console.log(`✅ Added user: ${user.name} (${user.email}) with UID: ${userCredential.user.uid}`);
        } catch (authError: any) {
          // If user already exists in auth, try to get their UID and update Firestore
          if (authError.code === 'auth/email-already-in-use') {
            console.log(`⚠️ User ${user.email} already exists in Firebase Auth`);
            // Note: We can't easily get the UID of existing users without signing in
            // User should delete the account from Firebase Console or use a different approach
          } else {
            console.error('❌ Error creating auth user:', authError);
          }
        }
      }
    } else {
      console.log('ℹ️ Users collection already has data. Skipping user seeding.');
      console.log('💡 If you need to re-seed, delete the users from Firebase Console first.');
    }

    // Check if pharmacies collection is empty
    const pharmaciesSnapshot = await getDocs(query(collection(db, 'pharmacies')));
    if (pharmaciesSnapshot.empty) {
      console.log('Seeding pharmacies...');
      for (const pharmacy of samplePharmacies) {
        await setDoc(doc(db, 'pharmacies', pharmacy.id), {
          ...pharmacy,
          createdAt: new Date()
        });
        console.log(`Added pharmacy: ${pharmacy.name}`);
      }
    } else {
      console.log('Pharmacies collection already exists, skipping seeding');
    }

    // Check if medicines collection is empty
    const medicinesSnapshot = await getDocs(query(collection(db, 'medicines')));
    if (medicinesSnapshot.empty) {
      console.log('Seeding medicines...');
      for (const medicine of sampleMedicines) {
        await setDoc(doc(db, 'medicines', medicine.id), {
          ...medicine,
          createdAt: new Date()
        });
        console.log(`Added medicine: ${medicine.name}`);
      }
    } else {
      console.log('Medicines collection already exists, skipping seeding');
    }

    // Check if orders collection is empty
    const ordersSnapshot = await getDocs(query(collection(db, 'orders')));
    if (ordersSnapshot.empty) {
      console.log('Seeding orders...');
      for (const order of sampleOrders) {
        await setDoc(doc(db, 'orders', order.id), {
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        });
        console.log(`Added order: ${order.orderId}`);
      }
    } else {
      console.log('Orders collection already exists, skipping seeding');
    }

    console.log('✅ اكتملت عملية إنشاء البيانات التجريبية!');
    console.log('');
    console.log('📊 ملخص البيانات المُنشأة:');
    console.log('   - المستخدمين: 3 (Admin, Pharmacist, User)');
    console.log('   - الصيدليات: 2');
    console.log('   - الأدوية: 3');
    console.log('   - الطلبات: 2');
    console.log('');
    console.log('🔐 بيانات تسجيل الدخول:');
    console.log('   Admin: admin@test.com / 123456');
    console.log('   Pharmacist: pharmacist@test.com / 123456');
    console.log('');
    console.log('⚠️ تنبيه: هذه بيانات تجريبية. في الإنتاج، سيتم عرض البيانات الحقيقية من Firebase فقط.');
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات التجريبية:', error);
    throw error;
  }
}

export { seedFirebaseDatabase };