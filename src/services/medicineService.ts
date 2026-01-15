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

const MEDICINES_COLLECTION = 'medicines';

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
    imageUrl: data.imageUrl as string || data.subabaseORImageUrl as string || '',
    pharmacyId: data.pharmacyId as string,
    pharmacyName: data.pharmacyName as string,
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
  if (!input.category) {
    throw new ValidationError('فئة الدواء مطلوبة', 'category', 'REQUIRED');
  }
}

/**
 * إنشاء دواء جديد
 * Requirement 3.1: Create medicine with pending status
 */
export async function createMedicine(
  input: CreateMedicineInput,
  pharmacyId: string,
  pharmacyName: string
): Promise<MedicineWithApproval> {
  validateMedicineInput(input);
  
  try {
    // Convert pharmacyId to number for lookup
    const pharmacyIdNum = parseInt(pharmacyId);
    if (isNaN(pharmacyIdNum)) {
      throw new ValidationError('معرف الصيدلية غير صحيح', 'pharmacyId', 'INVALID_FORMAT');
    }
    
    // Check if pharmacy can add more medicines using pharmacyId (number)
    const pharmacy = await getPharmacyByPharmacyId(pharmacyIdNum);
    if (!pharmacy) {
      throw new NotFoundError('pharmacy', pharmacyId);
    }
    
    if (pharmacy.currentMedicineCount >= pharmacy.medicineLimit) {
      throw new AuthorizationError(
        'تم الوصول للحد الأقصى من الأدوية المسموح بها',
        'MEDICINE_LIMIT_REACHED'
      );
    }
    
    // Generate unique ID
    const medicineId = doc(collection(db, MEDICINES_COLLECTION)).id;
    
    const medicineData = {
      name: input.name.trim(),
      code: input.code.trim(),
      description: input.description.trim(),
      price: input.price,
      quantity: input.quantity,
      category: input.category,
      manufacturer: input.manufacturer || '',
      expiryDate: Timestamp.fromDate(input.expiryDate),
      imageUrl: input.imageUrl || '',
      pharmacyId: pharmacyIdNum, // Store as number
      pharmacyName,
      status: 'pending' as MedicineStatus, // Always pending
      rejectionNotes: null,
      reviewedBy: null,
      reviewedAt: null,
      deleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    console.log('💾 Saving medicine to Firebase:', {
      medicineId,
      pharmacyId: pharmacyIdNum,
      pharmacyName,
      name: input.name
    });
    
    await setDoc(doc(db, MEDICINES_COLLECTION, medicineId), medicineData);
    
    console.log('✅ Medicine saved successfully');
    
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
 */
export async function getMedicinesByPharmacy(pharmacyId: string): Promise<MedicineWithApproval[]> {
  try {
    const q = query(
      collection(db, MEDICINES_COLLECTION),
      where('pharmacyId', '==', pharmacyId),
      where('deleted', '==', false),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));
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
 */
export async function getPendingMedicines(): Promise<MedicineWithApproval[]> {
  try {
    const q = query(
      collection(db, MEDICINES_COLLECTION),
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
 */
export async function getMedicineById(id: string): Promise<MedicineWithApproval> {
  try {
    const docRef = doc(db, MEDICINES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('medicine', id);
    }
    
    return mapFirestoreToMedicine(docSnap.id, docSnap.data());
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching medicine:', error);
    throw new DatabaseError('فشل في جلب الدواء', 'getMedicineById', error as Error);
  }
}


/**
 * تحديث دواء
 * Requirements 3.4, 3.5, 3.6: Update medicine with permission checks
 */
export async function updateMedicine(
  id: string,
  input: UpdateMedicineInput,
  pharmacyId: string
): Promise<void> {
  try {
    const medicine = await getMedicineById(id);
    
    // Check ownership
    if (medicine.pharmacyId !== pharmacyId) {
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
    if (input.imageUrl) updateData.imageUrl = input.imageUrl;
    
    // If editing a rejected medicine, reset to pending
    if (medicine.status === 'rejected') {
      updateData.status = 'pending';
      updateData.rejectionNotes = null;
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }
    
    await updateDoc(doc(db, MEDICINES_COLLECTION, id), updateData);
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
 */
export async function approveMedicine(id: string, adminId: string): Promise<void> {
  try {
    const medicine = await getMedicineById(id);
    
    if (medicine.status !== 'pending') {
      throw new AuthorizationError('يمكن الموافقة فقط على الأدوية المعلقة', 'ACTION_NOT_ALLOWED');
    }
    
    await updateDoc(doc(db, MEDICINES_COLLECTION, id), {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      rejectionNotes: null,
      updatedAt: serverTimestamp(),
    });
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
    const medicine = await getMedicineById(id);
    
    if (medicine.status !== 'pending' && medicine.status !== 'rejected') {
      throw new AuthorizationError('يمكن رفض الأدوية المعلقة أو المرفوضة فقط', 'ACTION_NOT_ALLOWED');
    }
    
    await updateDoc(doc(db, MEDICINES_COLLECTION, id), {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: serverTimestamp(),
      rejectionNotes: notes.trim(),
      updatedAt: serverTimestamp(),
    });
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
 */
export async function filterMedicines(filters: MedicineFilters): Promise<MedicineWithApproval[]> {
  try {
    let q = query(collection(db, MEDICINES_COLLECTION), orderBy('createdAt', 'desc'));
    
    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Apply pharmacy filter
    if (filters.pharmacyId) {
      q = query(q, where('pharmacyId', '==', filters.pharmacyId));
    }
    
    const snapshot = await getDocs(q);
    let medicines = snapshot.docs.map(doc => mapFirestoreToMedicine(doc.id, doc.data()));
    
    // Apply date range filter (client-side)
    if (filters.dateRange) {
      medicines = medicines.filter(m => {
        const createdAt = m.createdAt;
        return createdAt >= filters.dateRange!.start && createdAt <= filters.dateRange!.end;
      });
    }
    
    // Apply category filter (client-side)
    if (filters.category) {
      medicines = medicines.filter(m => m.category === filters.category);
    }
    
    return medicines;
  } catch (error) {
    console.error('Error filtering medicines:', error);
    throw new DatabaseError('فشل في فلترة الأدوية', 'filterMedicines', error as Error);
  }
}

/**
 * التحقق من إمكانية إضافة دواء
 */
export async function canPharmacyAddMedicine(pharmacyId: string): Promise<{
  canAdd: boolean;
  currentCount: number;
  limit: number;
}> {
  try {
    // Convert string pharmacyId to number
    const pharmacyIdNum = parseInt(pharmacyId);
    if (isNaN(pharmacyIdNum)) {
      return { canAdd: false, currentCount: 0, limit: 0 };
    }
    
    const pharmacy = await getPharmacyByPharmacyId(pharmacyIdNum);
    if (!pharmacy) {
      return { canAdd: false, currentCount: 0, limit: 0 };
    }
    
    return {
      canAdd: pharmacy.currentMedicineCount < pharmacy.medicineLimit,
      currentCount: pharmacy.currentMedicineCount,
      limit: pharmacy.medicineLimit,
    };
  } catch (error) {
    console.error('Error checking pharmacy medicine limit:', error);
    return { canAdd: false, currentCount: 0, limit: 0 };
  }
}

/**
 * حذف دواء
 */
export async function deleteMedicine(
  id: string,
  pharmacyId: string
): Promise<void> {
  try {
    const medicine = await getMedicineById(id);
    
    // Check ownership
    if (medicine.pharmacyId !== pharmacyId) {
      throw new AuthorizationError('لا يمكنك حذف هذا الدواء', 'RESOURCE_NOT_OWNED');
    }
    
    // Check if deleting is allowed based on status
    if (medicine.status === 'approved') {
      throw new AuthorizationError(
        'لا يمكن حذف الأدوية المعتمدة',
        'ACTION_NOT_ALLOWED'
      );
    }
    
    // Delete the medicine
    await updateDoc(doc(db, MEDICINES_COLLECTION, id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update pharmacy medicine count
    await updateMedicineCount(pharmacyId, -1);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof AuthorizationError) {
      throw error;
    }
    console.error('Error deleting medicine:', error);
    throw new DatabaseError('فشل في حذف الدواء', 'deleteMedicine', error as Error);
  }
}

/**
 * جلب إحصائيات الأدوية
 */
export async function getMedicineStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}> {
  try {
    const snapshot = await getDocs(collection(db, MEDICINES_COLLECTION));
    const medicines = snapshot.docs.map(doc => doc.data());
    
    return {
      total: medicines.length,
      pending: medicines.filter(m => m.status === 'pending').length,
      approved: medicines.filter(m => m.status === 'approved').length,
      rejected: medicines.filter(m => m.status === 'rejected').length,
    };
  } catch (error) {
    console.error('Error fetching medicine stats:', error);
    throw new DatabaseError('فشل في جلب إحصائيات الأدوية', 'getMedicineStats', error as Error);
  }
}
