/**
 * خدمة إدارة الأدوية
 * Medicine Management Service
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MedicineWithApproval,
  MedicineStatus,
  CreateMedicineInput,
  UpdateMedicineInput,
  MedicineFilters,
  GroupedMedicines,
} from '@/types';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  DatabaseError,
} from '@/types/errors';
import { getPharmacyById, getPharmacyByPharmacyId, updateMedicineCount } from './pharmacyService';
import { deleteImageFromSupabase } from '@/lib/supabase';

const MEDICINES_COLLECTION = 'medicines';
const PENDING_MEDICINES_COLLECTION = 'pending_medicines';

/**
 * تحويل بيانات Firestore إلى MedicineWithApproval
 */
function mapFirestoreToMedicine(id: string, data: Record<string, unknown>): MedicineWithApproval {
  return {
    id,
    name: data.name as string,
    code: data.code as string,
    description: data.description as string,
    price: data.price as number,
    quantity: data.quantity as number,
    category: data.category as string,
    manufacturer: data.manufacturer as string,
    expiryDate: data.expiryDate ? (data.expiryDate as Timestamp).toDate() : new Date(),
    subabaseImageUrl: data.subabaseImageUrl as string || data.subabaseORImageUrl as string || '',
    subabaseORImageUrl: data.subabaseORImageUrl as string || data.subabaseImageUrl as string || '',
    pharmacyId: data.pharmacyId as string,
    pharmacyName: data.pharmacyName as string,
    pharmcyAddress: data.pharmcyAddress as string || 'غير محدد',
    status: (data.status as MedicineStatus) || 'pending',
    rejectionNotes: (data.rejectionNotes as string) || null,
    reviewedBy: (data.reviewedBy as string) || null,
    reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : null,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
  };
}

/**
 * التحقق من صحة بيانات الدواء
 */
function validateMedicineInput(input: CreateMedicineInput): void {
  if (!input.name || input.name.trim().length < 2) {
    throw new ValidationError('اسم الدواء مطلوب', 'name', 'REQUIRED');
  }
  if (!input.code || input.code.trim().length < 3) {
    throw new ValidationError('كود الدواء مطلوب', 'code', 'REQUIRED');
  }
  if (!input.description || input.description.trim().length < 10) {
    throw new ValidationError('وصف الدواء مطلوب (10 أحرف على الأقل)', 'description', 'REQUIRED');
  }
  if (input.price <= 0) {
    throw new ValidationError('السعر يجب أن يكون أكبر من صفر', 'price', 'OUT_OF_RANGE');
  }
  if (input.quantity < 0) {
    throw new ValidationError('الكمية يجب أن تكون صفر أو أكثر', 'quantity', 'OUT_OF_RANGE');
  }
  // Category is optional - removed validation
}

/**
 * إنشاء دواء جديد
 * Requirement 3.1: Create medicine in pending_medicines collection
 * الأدوية الجديدة تُخزن في pending_medicines فقط ولا تنتقل إلى medicines إلا بعد الموافقة
 */
export async function createMedicine(
  input: CreateMedicineInput,
  pharmacyId: string,
  pharmacyName: string
): Promise<MedicineWithApproval> {
  validateMedicineInput(input);

  try {
    // Validating pharmacyId format (should be UUID string now)
    if (!pharmacyId || pharmacyId.length < 5) {
      throw new ValidationError('معرف الصيدلية غير صحيح', 'pharmacyId', 'INVALID_FORMAT');
    }

    // Check if pharmacy can add more medicines using pharmacyId (string reference)
    const pharmacy = await getPharmacyById(pharmacyId);
    if (!pharmacy) {
      throw new NotFoundError('pharmacy', pharmacyId);
    }

    if (pharmacy.currentMedicineCount >= pharmacy.medicineLimit) {
      throw new AuthorizationError(
        'تم الوصول للحد الأقصى من الأدوية المسموح بها',
        'MEDICINE_LIMIT_REACHED'
      );
    }

    // Build pharmacy address from detailed fields
    const pharmcyAddress = [
      pharmacy.street,
      pharmacy.city,
      pharmacy.governorate,
      pharmacy.postalCode
    ].filter(Boolean).join(', ') || pharmacy.address || 'غير محدد';

    // Generate unique ID - يتم الحفظ في pending_medicines فقط
    const medicineId = doc(collection(db, PENDING_MEDICINES_COLLECTION)).id;

    const medicineData = {
      name: input.name.trim(),
      code: input.code.trim(),
      description: input.description.trim(),
      price: input.price,
      quantity: input.quantity,
      category: input.category,
      manufacturer: input.manufacturer || '',
      expiryDate: Timestamp.fromDate(input.expiryDate),
      subabaseImageUrl: input.subabaseImageUrl || '',
      subabaseORImageUrl: input.subabaseORImageUrl || input.subabaseImageUrl || '',
      isNewProduct: input.isNewProduct || false,
      discountRating: input.discountRating || 0,
      pharmacyId: pharmacyId, // Store as string (UID)
      pharmacyName,
      pharmcyAddress, // Add pharmacy address
      status: 'pending' as MedicineStatus, // Always pending
      rejectionNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log('💾 Saving medicine to pending_medicines collection:', {
      medicineId,
      pharmacyId: pharmacyId,
      pharmacyName,
      pharmcyAddress,
      name: input.name
    });

    // الحفظ في pending_medicines فقط - لن يظهر في medicines حتى الموافقة
    await setDoc(doc(db, PENDING_MEDICINES_COLLECTION, medicineId), medicineData);

    console.log('✅ Medicine saved to pending_medicines successfully');

    // Update pharmacy medicine count using the pharmacy document ID
    await updateMedicineCount(pharmacy.id, 1);

    console.log('✅ Medicine count updated');

    return mapFirestoreToMedicine(medicineId, {
      ...medicineData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthorizationError || error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error creating medicine:', error);
    throw new DatabaseError('فشل في إنشاء الدواء', 'createMedicine', error as Error);
  }
}

/**
 * جلب أدوية الصيدلية
 * Requirement 3.3: Display medicines grouped by status
 * يجلب من كلا الـ collections: pending_medicines و medicines
 */
export async function getMedicinesByPharmacy(pharmacyId: string): Promise<MedicineWithApproval[]> {
  try {
    // جلب الأدوية المعتمدة من medicines collection
    const approvedQuery = query(
      collection(db, MEDICINES_COLLECTION),
      where('pharmacyId', '==', pharmacyId),
      where('deleted', '==', false)
    );

    // جلب الأدوية المعلقة والمرفوضة من pending_medicines collection
    const pendingQuery = query(
      collection(db, PENDING_MEDICINES_COLLECTION),
      where('pharmacyId', '==', pharmacyId),
      where('deleted', '==', false)
    );

    const [approvedSnapshot, pendingSnapshot] = await Promise.all([
      getDocs(approvedQuery),
      getDocs(pendingQuery)
    ]);

    const approvedMedicines = approvedSnapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));
    const pendingMedicines = pendingSnapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));

    // دمج النتائج وترتيبها حسب تاريخ الإنشاء
    const allMedicines = [...approvedMedicines, ...pendingMedicines];
    allMedicines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allMedicines;
  } catch (error) {
    console.error('Error fetching medicines:', error);
    throw new DatabaseError('فشل في جلب الأدوية', 'getMedicinesByPharmacy', error as Error);
  }
}

/**
 * جلب الأدوية مجمعة حسب الحالة
 */
export async function getMedicinesGroupedByStatus(pharmacyId: string): Promise<GroupedMedicines> {
  const medicines = await getMedicinesByPharmacy(pharmacyId);

  return {
    pending: medicines.filter(m => m.status === 'pending'),
    approved: medicines.filter(m => m.status === 'approved'),
    rejected: medicines.filter(m => m.status === 'rejected'),
  };
}

/**
 * جلب الأدوية المعلقة للمراجعة
 * Requirement 4.1: Display pending medicines for Admin
 * يجلب من pending_medicines collection فقط
 */
export async function getPendingMedicines(): Promise<MedicineWithApproval[]> {
  try {
    const q = query(
      collection(db, PENDING_MEDICINES_COLLECTION),
      where('status', '==', 'pending'),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));
  } catch (error) {
    console.error('Error fetching pending medicines:', error);
    throw new DatabaseError('فشل في جلب الأدوية المعلقة', 'getPendingMedicines', error as Error);
  }
}

/**
 * جلب دواء بواسطة المعرف
 * يبحث في كلا الـ collections
 */
export async function getMedicineById(id: string): Promise<MedicineWithApproval> {
  try {
    // أولاً نبحث في medicines collection
    const medicinesDocRef = doc(db, MEDICINES_COLLECTION, id);
    const medicinesDocSnap = await getDoc(medicinesDocRef);

    if (medicinesDocSnap.exists()) {
      return mapFirestoreToMedicine(medicinesDocSnap.id, medicinesDocSnap.data());
    }

    // إذا لم نجده، نبحث في pending_medicines collection
    const pendingDocRef = doc(db, PENDING_MEDICINES_COLLECTION, id);
    const pendingDocSnap = await getDoc(pendingDocRef);

    if (pendingDocSnap.exists()) {
      return mapFirestoreToMedicine(pendingDocSnap.id, pendingDocSnap.data());
    }

    throw new NotFoundError('medicine', id);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching medicine:', error);
    throw new DatabaseError('فشل في جلب الدواء', 'getMedicineById', error as Error);
  }
}

/**
 * تحديد الـ collection الذي يوجد فيه الدواء
 */
async function getMedicineCollection(id: string): Promise<string> {
  const medicinesDocRef = doc(db, MEDICINES_COLLECTION, id);
  const medicinesDocSnap = await getDoc(medicinesDocRef);

  if (medicinesDocSnap.exists()) {
    return MEDICINES_COLLECTION;
  }

  const pendingDocRef = doc(db, PENDING_MEDICINES_COLLECTION, id);
  const pendingDocSnap = await getDoc(pendingDocRef);

  if (pendingDocSnap.exists()) {
    return PENDING_MEDICINES_COLLECTION;
  }

  throw new NotFoundError('medicine', id);
}


/**
 * تحديث دواء
 * Requirements 3.4, 3.5, 3.6: Update medicine with permission checks
 * الأدوية المعلقة والمرفوضة في pending_medicines، المعتمدة في medicines
 */
export async function updateMedicine(
  id: string,
  input: UpdateMedicineInput,
  pharmacyId: string
): Promise<void> {
  try {
    const medicine = await getMedicineById(id);
    const collectionName = await getMedicineCollection(id);

    // Check ownership - compare as strings to handle both types
    const medicinePharmacyId = String(medicine.pharmacyId);
    const inputPharmacyId = String(pharmacyId);
    if (medicinePharmacyId !== inputPharmacyId) {
      throw new AuthorizationError('لا يمكنك تعديل هذا الدواء', 'RESOURCE_NOT_OWNED');
    }

    // Check if editing is allowed based on status
    if (medicine.status === 'approved') {
      throw new AuthorizationError(
        'لا يمكن تعديل الأدوية المعتمدة بدون إذن الإدارة',
        'EDIT_NOT_ALLOWED'
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (input.name) updateData.name = input.name.trim();
    if (input.code) updateData.code = input.code.trim();
    if (input.description) updateData.description = input.description.trim();
    if (input.price !== undefined) updateData.price = input.price;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;
    if (input.category) updateData.category = input.category;
    if (input.manufacturer) updateData.manufacturer = input.manufacturer;
    if (input.expiryDate) updateData.expiryDate = Timestamp.fromDate(input.expiryDate);
    if (input.subabaseImageUrl) {
      updateData.subabaseImageUrl = input.subabaseImageUrl;
      updateData.subabaseORImageUrl = input.subabaseORImageUrl || input.subabaseImageUrl;
    }
    if (input.isNewProduct !== undefined) updateData.isNewProduct = input.isNewProduct;
    if (input.discountRating !== undefined) updateData.discountRating = input.discountRating;

    // If editing a rejected medicine, reset to pending
    if (medicine.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejectionNotes = null;
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }

    await updateDoc(doc(db, collectionName, id), updateData);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      throw error;
    }
    console.error('Error updating medicine:', error);
    throw new DatabaseError('فشل في تحديث الدواء', 'updateMedicine', error as Error);
  }
}

/**
 * الموافقة على دواء
 * Requirement 4.2: Approve medicine
 * ينقل الدواء من pending_medicines إلى medicines collection
 */
export async function approveMedicine(id: string, adminId: string): Promise<void> {
  try {
    // جلب الدواء من pending_medicines
    const pendingDocRef = doc(db, PENDING_MEDICINES_COLLECTION, id);
    const pendingDocSnap = await getDoc(pendingDocRef);

    if (!pendingDocSnap.exists()) {
      throw new NotFoundError('medicine', id);
    }

    const medicineData = pendingDocSnap.data();

    if (medicineData.status !== 'pending') {
      throw new AuthorizationError('يمكن الموافقة فقط على الأدوية المعلقة', 'ACTION_NOT_ALLOWED');
    }

    // تحديث البيانات للموافقة
    const approvedData = {
      ...medicineData,
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      rejectionNotes: null,
      updatedAt: serverTimestamp(),
    };

    console.log('✅ Moving medicine from pending_medicines to medicines:', id);

    // إنشاء الدواء في medicines collection
    await setDoc(doc(db, MEDICINES_COLLECTION, id), approvedData);

    // حذف الدواء من pending_medicines collection
    await deleteDoc(pendingDocRef);

    console.log('✅ Medicine approved and moved to medicines collection');
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      throw error;
    }
    console.error('Error approving medicine:', error);
    throw new DatabaseError('فشل في الموافقة على الدواء', 'approveMedicine', error as Error);
  }
}

/**
 * رفض دواء
 * Requirement 4.3: Reject medicine with notes
 * يبقى الدواء في pending_medicines مع تغيير الحالة إلى rejected
 */
export async function rejectMedicine(
  id: string,
  adminId: string,
  notes: string
): Promise<void> {
  if (!notes || notes.trim().length < 5) {
    throw new ValidationError('يجب إضافة ملاحظات للرفض (5 أحرف على الأقل)', 'rejectionNotes', 'REQUIRED');
  }

  try {
    // جلب الدواء من pending_medicines
    const pendingDocRef = doc(db, PENDING_MEDICINES_COLLECTION, id);
    const pendingDocSnap = await getDoc(pendingDocRef);

    if (!pendingDocSnap.exists()) {
      throw new NotFoundError('medicine', id);
    }

    const medicineData = pendingDocSnap.data();

    if (medicineData.status !== 'pending' && medicineData.status !== 'rejected') {
      throw new AuthorizationError('يمكن رفض الأدوية المعلقة أو المرفوضة فقط', 'ACTION_NOT_ALLOWED');
    }

    // تحديث الحالة في pending_medicines (يبقى هناك)
    await updateDoc(pendingDocRef, {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      rejectionNotes: notes.trim(),
      updatedAt: serverTimestamp(),
    });

    console.log('❌ Medicine rejected in pending_medicines:', id);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Error rejecting medicine:', error);
    throw new DatabaseError('فشل في رفض الدواء', 'rejectMedicine', error as Error);
  }
}

/**
 * فلترة الأدوية
 * Requirement 4.4: Filter medicines
 * يبحث في كلا الـ collections حسب الفلتر
 */
export async function filterMedicines(filters: MedicineFilters): Promise<MedicineWithApproval[]> {
  try {
    let allMedicines: MedicineWithApproval[] = [];

    // تحديد أي collections نبحث فيها بناءً على فلتر الحالة
    const searchApproved = !filters.status || filters.status === 'all' || filters.status === 'approved';
    const searchPending = !filters.status || filters.status === 'all' || filters.status === 'pending' || filters.status === 'rejected';

    if (searchApproved) {
      // البحث في medicines collection (الأدوية المعتمدة)
      let approvedQuery = query(collection(db, MEDICINES_COLLECTION), where('deleted', '==', false));

      if (filters.pharmacyId) {
        approvedQuery = query(approvedQuery, where('pharmacyId', '==', filters.pharmacyId));
      }

      const approvedSnapshot = await getDocs(approvedQuery);
      const approvedMedicines = approvedSnapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));
      allMedicines = [...allMedicines, ...approvedMedicines];
    }

    if (searchPending) {
      // البحث في pending_medicines collection
      let pendingQuery = query(collection(db, PENDING_MEDICINES_COLLECTION), where('deleted', '==', false));

      if (filters.status && filters.status !== 'all' && filters.status !== 'approved') {
        pendingQuery = query(pendingQuery, where('status', '==', filters.status));
      }

      if (filters.pharmacyId) {
        pendingQuery = query(pendingQuery, where('pharmacyId', '==', filters.pharmacyId));
      }

      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingMedicines = pendingSnapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));
      allMedicines = [...allMedicines, ...pendingMedicines];
    }

    // Apply date range filter (client-side)
    if (filters.dateRange) {
      allMedicines = allMedicines.filter(m => {
        const createdAt = m.createdAt;
        return createdAt >= filters.dateRange!.start && createdAt <= filters.dateRange!.end;
      });
    }

    // Apply category filter (client-side)
    if (filters.category) {
      allMedicines = allMedicines.filter(m => m.category === filters.category);
    }

    // ترتيب حسب تاريخ الإنشاء
    allMedicines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return allMedicines;
  } catch (error) {
    console.error('Error filtering medicines:', error);
    throw new DatabaseError('فشل في فلترة الأدوية', 'filterMedicines', error as Error);
  }
}

/**
 * التحقق من إمكانية إضافة دواء
 * يحسب العدد الفعلي من الأدوية (غير المحذوفة) من كلا الـ collections
 */
export async function canPharmacyAddMedicine(pharmacyId: string): Promise<{
  canAdd: boolean;
  currentCount: number;
  limit: number;
  message?: string;
}> {
  try {
    // Direct string usage
    const pharmacy = await getPharmacyById(pharmacyId);
    if (!pharmacy) {
      return { canAdd: false, currentCount: 0, limit: 0, message: 'الصيدلية غير موجودة' };
    }

    console.log('📊 Pharmacy limit info from DB:', {
      pharmacyId: pharmacyId,
      name: pharmacy.name,
      medicineLimit: pharmacy.medicineLimit,
      currentMedicineCount: pharmacy.currentMedicineCount
    });

    // حساب العدد الفعلي من الأدوية من كلا الـ collections
    const actualCount = await getActualMedicineCount(pharmacyId);

    console.log('📊 Actual medicine count:', actualCount);

    // تحديث العداد في الصيدلية إذا كان مختلف
    if (actualCount !== pharmacy.currentMedicineCount) {
      console.log(`🔄 Syncing medicine count for pharmacy ${pharmacyId}: ${pharmacy.currentMedicineCount} -> ${actualCount}`);
      await syncPharmacyMedicineCount(pharmacy.id, actualCount);
    }

    const canAdd = actualCount < pharmacy.medicineLimit;
    const remaining = pharmacy.medicineLimit - actualCount;

    let message: string | undefined;
    if (!canAdd) {
      message = `تم الوصول للحد الأقصى (${pharmacy.medicineLimit} دواء). تواصل مع الإدارة لزيادة الحد.`;
    } else if (remaining <= 3) {
      message = `تبقى ${remaining} أدوية فقط من الحد المسموح`;
    }

    console.log('📊 Final limit info:', { canAdd, currentCount: actualCount, limit: pharmacy.medicineLimit, message });

    return {
      canAdd,
      currentCount: actualCount,
      limit: pharmacy.medicineLimit,
      message,
    };
  } catch (error) {
    console.error('Error checking pharmacy medicine limit:', error);
    return { canAdd: false, currentCount: 0, limit: 0, message: 'حدث خطأ في التحقق من الحد' };
  }
}

/**
 * حساب العدد الفعلي للأدوية من كلا الـ collections
 */
async function getActualMedicineCount(pharmacyId: string): Promise<number> {
  try {
    // عد الأدوية المعتمدة (غير المحذوفة) من medicines collection
    const approvedQuery = query(
      collection(db, MEDICINES_COLLECTION),
      where('pharmacyId', '==', pharmacyId),
      where('deleted', '==', false)
    );

    // عد الأدوية المعلقة والمرفوضة (غير المحذوفة) من pending_medicines collection
    const pendingQuery = query(
      collection(db, PENDING_MEDICINES_COLLECTION),
      where('pharmacyId', '==', pharmacyId),
      where('deleted', '==', false)
    );

    const [approvedSnapshot, pendingSnapshot] = await Promise.all([
      getDocs(approvedQuery),
      getDocs(pendingQuery)
    ]);

    console.log(`📊 Medicine count breakdown for pharmacy ${pharmacyId}:`, {
      approved: approvedSnapshot.docs.length,
      approvedIds: approvedSnapshot.docs.map(d => d.id),
      pending: pendingSnapshot.docs.length,
      pendingIds: pendingSnapshot.docs.map(d => d.id),
      total: approvedSnapshot.docs.length + pendingSnapshot.docs.length
    });

    return approvedSnapshot.docs.length + pendingSnapshot.docs.length;
  } catch (error) {
    console.error('Error counting medicines:', error);
    return 0;
  }
}

/**
 * مزامنة عداد الأدوية في الصيدلية
 */
async function syncPharmacyMedicineCount(pharmacyDocId: string, actualCount: number): Promise<void> {
  try {
    const docRef = doc(db, 'pharmacies', pharmacyDocId);
    await updateDoc(docRef, {
      currentMedicineCount: actualCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error syncing medicine count:', error);
  }
}

/**
 * حذف دواء
 * Delete medicine from the appropriate collection and remove image from Supabase
 */
export async function deleteMedicine(
  id: string,
  pharmacyId: string
): Promise<void> {
  try {
    const medicine = await getMedicineById(id);
    const collectionName = await getMedicineCollection(id);

    // Check ownership - compare as strings to handle both types
    const medicinePharmacyId = String(medicine.pharmacyId);
    const inputPharmacyId = String(pharmacyId);
    if (medicinePharmacyId !== inputPharmacyId) {
      throw new AuthorizationError('لا يمكنك حذف هذا الدواء', 'RESOURCE_NOT_OWNED');
    }

    // Check if deleting is allowed based on status
    if (medicine.status === 'approved') {
      throw new AuthorizationError(
        'لا يمكن حذف الأدوية المعتمدة',
        'ACTION_NOT_ALLOWED'
      );
    }

    // Delete image from Supabase Storage if exists
    if (medicine.subabaseImageUrl) {
      console.log('🗑️ حذف الصورة من Supabase Storage:', medicine.subabaseImageUrl);
      const deleteResult = await deleteImageFromSupabase(medicine.subabaseImageUrl);

      if (deleteResult.success) {
        console.log('✅ تم حذف الصورة من Supabase بنجاح');
      } else {
        console.warn('⚠️ فشل حذف الصورة من Supabase:', deleteResult.error);
        // Continue with medicine deletion even if image deletion fails
      }
    }

    // Delete the medicine (soft delete)
    await updateDoc(doc(db, collectionName, id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update pharmacy medicine count
    await updateMedicineCount(pharmacyId, -1);

    console.log('✅ تم حذف الدواء والصورة بنجاح');
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      throw error;
    }
    console.error('Error deleting medicine:', error);
    throw new DatabaseError('فشل في حذف الدواء', 'deleteMedicine', error as Error);
  }
}

/**
 * حذف دواء نهائياً (للإدارة فقط)
 * Permanently delete medicine from the appropriate collection and remove image from Supabase
 */
export async function deleteMedicinePermanently(id: string): Promise<void> {
  try {
    const medicine = await getMedicineById(id);
    const collectionName = await getMedicineCollection(id);

    // Delete image from Supabase Storage if exists
    if (medicine.subabaseImageUrl) {
      console.log('🗑️ حذف الصورة من Supabase Storage:', medicine.subabaseImageUrl);
      const deleteResult = await deleteImageFromSupabase(medicine.subabaseImageUrl);

      if (deleteResult.success) {
        console.log('✅ تم حذف الصورة من Supabase بنجاح');
      } else {
        console.warn('⚠️ فشل حذف الصورة من Supabase:', deleteResult.error);
        // Continue with medicine deletion even if image deletion fails
      }
    }

    // Delete the medicine document permanently (HARD DELETE)
    await deleteDoc(doc(db, collectionName, id));

    console.log('✅ تم حذف الدواء والصورة نهائياً من Firebase');
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error permanently deleting medicine:', error);
    throw new DatabaseError('فشل في حذف الدواء نهائياً', 'deleteMedicinePermanently', error as Error);
  }
}

/**
 * جلب إحصائيات الأدوية
 * يجمع من كلا الـ collections
 */
export async function getMedicineStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  try {
    // جلب من medicines collection (المعتمدة فقط)
    const medicinesSnapshot = await getDocs(
      query(collection(db, MEDICINES_COLLECTION), where('deleted', '==', false))
    );
    const approvedCount = medicinesSnapshot.docs.length;

    // جلب من pending_medicines collection
    const pendingSnapshot = await getDocs(
      query(collection(db, PENDING_MEDICINES_COLLECTION), where('deleted', '==', false))
    );
    const pendingMedicines = pendingSnapshot.docs.map(doc => doc.data());

    const pendingCount = pendingMedicines.filter(m => m.status === 'pending').length;
    const rejectedCount = pendingMedicines.filter(m => m.status === 'rejected').length;

    return {
      total: approvedCount + pendingMedicines.length,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
    };
  } catch (error) {
    console.error('Error fetching medicine stats:', error);
    throw new DatabaseError('فشل في جلب إحصائيات الأدوية', 'getMedicineStats', error as Error);
  }
}
