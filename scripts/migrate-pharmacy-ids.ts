/**
 * Migration Script: Convert pharmacyId from String to Integer
 * 
 * هذا السكريبت يحول pharmacyId من string إلى integer في:
 * 1. pharmacies collection
 * 2. users collection (للصيادلة)
 * 3. medicines collection
 * 4. pending_medicines collection
 * 5. orders collection
 */

import { 
  collection, 
  getDocs, 
  updateDoc, 
  doc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface PharmacyMapping {
  firebaseUid: string;
  oldPharmacyId: string;
  newPharmacyId: number;
  name: string;
}

async function migratePharmacyIds() {
  console.log('🚀 بدء عملية تحويل pharmacyId من string إلى integer...\n');

  try {
    // Step 1: Get all pharmacies and assign new integer IDs
    console.log('📋 Step 1: جلب جميع الصيدليات...');
    const pharmaciesSnapshot = await getDocs(collection(db, 'pharmacies'));
    
    if (pharmaciesSnapshot.empty) {
      console.log('⚠️ لا توجد صيدليات في قاعدة البيانات');
      return;
    }

    const pharmacyMappings: PharmacyMapping[] = [];
    let nextId = 10001;

    console.log(`✅ تم العثور على ${pharmaciesSnapshot.docs.length} صيدلية\n`);

    // Create mapping of old to new IDs
    for (const pharmacyDoc of pharmaciesSnapshot.docs) {
      const data = pharmacyDoc.data();
      pharmacyMappings.push({
        firebaseUid: pharmacyDoc.id,
        oldPharmacyId: data.pharmacyId as string,
        newPharmacyId: nextId,
        name: data.name as string
      });
      nextId++;
    }

    console.log('📊 خريطة التحويل:');
    pharmacyMappings.forEach(mapping => {
      console.log(`  - ${mapping.name}: "${mapping.oldPharmacyId}" → ${mapping.newPharmacyId}`);
    });
    console.log('');

    // Step 2: Update pharmacies collection
    console.log('📝 Step 2: تحديث pharmacies collection...');
    let batch = writeBatch(db);
    let batchCount = 0;
    let totalUpdated = 0;

    for (const mapping of pharmacyMappings) {
      const pharmacyRef = doc(db, 'pharmacies', mapping.firebaseUid);
      batch.update(pharmacyRef, { 
        pharmacyId: mapping.newPharmacyId 
      });
      batchCount++;
      totalUpdated++;

      // Firestore batch limit is 500
      if (batchCount === 500) {
        await batch.commit();
        console.log(`  ✅ تم تحديث ${totalUpdated} صيدلية...`);
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`✅ تم تحديث ${totalUpdated} صيدلية في pharmacies collection\n`);

    // Step 3: Update users collection (pharmacists only)
    console.log('📝 Step 3: تحديث users collection (الصيادلة فقط)...');
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'pharmacist'))
    );

    batch = writeBatch(db);
    batchCount = 0;
    totalUpdated = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const oldPharmacyId = userData.pharmacyId;
      
      // Find the new ID
      const mapping = pharmacyMappings.find(
        m => m.oldPharmacyId === oldPharmacyId || m.firebaseUid === userDoc.id
      );

      if (mapping) {
        const userRef = doc(db, 'users', userDoc.id);
        batch.update(userRef, { 
          pharmacyId: mapping.newPharmacyId 
        });
        batchCount++;
        totalUpdated++;

        if (batchCount === 500) {
          await batch.commit();
          console.log(`  ✅ تم تحديث ${totalUpdated} مستخدم...`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`✅ تم تحديث ${totalUpdated} مستخدم في users collection\n`);

    // Step 4: Update medicines collection
    console.log('📝 Step 4: تحديث medicines collection...');
    const medicinesSnapshot = await getDocs(collection(db, 'medicines'));

    batch = writeBatch(db);
    batchCount = 0;
    totalUpdated = 0;

    for (const medicineDoc of medicinesSnapshot.docs) {
      const medicineData = medicineDoc.data();
      const oldPharmacyId = medicineData.pharmacyId;

      // Find the new ID
      const mapping = pharmacyMappings.find(
        m => m.oldPharmacyId === oldPharmacyId || m.firebaseUid === oldPharmacyId
      );

      if (mapping) {
        const medicineRef = doc(db, 'medicines', medicineDoc.id);
        batch.update(medicineRef, { 
          pharmacyId: mapping.newPharmacyId 
        });
        batchCount++;
        totalUpdated++;

        if (batchCount === 500) {
          await batch.commit();
          console.log(`  ✅ تم تحديث ${totalUpdated} دواء...`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`✅ تم تحديث ${totalUpdated} دواء في medicines collection\n`);

    // Step 5: Update pending_medicines collection
    console.log('📝 Step 5: تحديث pending_medicines collection...');
    const pendingSnapshot = await getDocs(collection(db, 'pending_medicines'));

    batch = writeBatch(db);
    batchCount = 0;
    totalUpdated = 0;

    for (const pendingDoc of pendingSnapshot.docs) {
      const pendingData = pendingDoc.data();
      const oldPharmacyId = pendingData.pharmacyId;

      // Find the new ID
      const mapping = pharmacyMappings.find(
        m => m.oldPharmacyId === oldPharmacyId || m.firebaseUid === oldPharmacyId
      );

      if (mapping) {
        const pendingRef = doc(db, 'pending_medicines', pendingDoc.id);
        batch.update(pendingRef, { 
          pharmacyId: mapping.newPharmacyId 
        });
        batchCount++;
        totalUpdated++;

        if (batchCount === 500) {
          await batch.commit();
          console.log(`  ✅ تم تحديث ${totalUpdated} دواء معلق...`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`✅ تم تحديث ${totalUpdated} دواء في pending_medicines collection\n`);

    // Step 6: Update orders collection (if pharmacyId exists)
    console.log('📝 Step 6: تحديث orders collection...');
    const ordersSnapshot = await getDocs(collection(db, 'orders'));

    batch = writeBatch(db);
    batchCount = 0;
    totalUpdated = 0;

    for (const orderDoc of ordersSnapshot.docs) {
      const orderData = orderDoc.data();
      const oldPharmacyId = orderData.pharmacyId;

      if (oldPharmacyId) {
        // Find the new ID
        const mapping = pharmacyMappings.find(
          m => m.oldPharmacyId === oldPharmacyId || m.firebaseUid === oldPharmacyId
        );

        if (mapping) {
          const orderRef = doc(db, 'orders', orderDoc.id);
          batch.update(orderRef, { 
            pharmacyId: mapping.newPharmacyId 
          });
          batchCount++;
          totalUpdated++;

          if (batchCount === 500) {
            await batch.commit();
            console.log(`  ✅ تم تحديث ${totalUpdated} طلب...`);
            batch = writeBatch(db);
            batchCount = 0;
          }
        }
      }
    }

    if (batchCount > 0) {
      await batch.commit();
    }
    console.log(`✅ تم تحديث ${totalUpdated} طلب في orders collection\n`);

    // Summary
    console.log('🎉 تمت عملية التحويل بنجاح!\n');
    console.log('📊 ملخص التحديثات:');
    console.log(`  - Pharmacies: ${pharmacyMappings.length}`);
    console.log(`  - Users: ${usersSnapshot.docs.length}`);
    console.log(`  - Medicines: ${medicinesSnapshot.docs.length}`);
    console.log(`  - Pending Medicines: ${pendingSnapshot.docs.length}`);
    console.log(`  - Orders: ${ordersSnapshot.docs.length}`);
    console.log('\n✅ جميع pharmacyId الآن integer بدلاً من string');

  } catch (error) {
    console.error('❌ حدث خطأ أثناء التحويل:', error);
    throw error;
  }
}

// Run the migration
migratePharmacyIds()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
