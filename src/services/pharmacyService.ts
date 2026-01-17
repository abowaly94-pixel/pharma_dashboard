/**
 * خدمة إدارة الصيدليات
 * Pharmacy Management Service
 * 
 * Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.7, 5.1, 5.2
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
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, getAuth } from 'firebase/auth';
import { db, auth, getSecondaryApp } from '@/lib/firebase';
import {
  PharmacyAccount,
  PharmacyStatus,
  CreatePharmacyInput,
  UpdatePharmacyInput,
  PharmacyFilters,
} from '@/types';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
} from '@/types/errors';

// Collection reference
const PHARMACIES_COLLECTION = 'pharmacies';
const USERS_COLLECTION = 'users';

/**
 * تحويل بيانات Firestore إلى PharmacyAccount
 */
function mapFirestoreToPharmacy(id: string, data: Record<string, unknown>): PharmacyAccount {
  return {
    id,
    pharmacyId: data.pharmacyId as number,
    name: data.name as string,
    email: data.email as string,
    address: data.address as string,
    city: data.city as string,
    phoneNumber: data.phoneNumber as string,
    ownerName: data.ownerName as string,
    licenseNumber: data.licenseNumber as string,
    status: (data.status as PharmacyStatus) || 'inactive',
    medicineLimit: (data.medicineLimit as number) || 100,
    currentMedicineCount: (data.currentMedicineCount as number) || 0,
    emailVerified: (data.emailVerified as boolean) || false,
    failedLoginAttempts: (data.failedLoginAttempts as number) || 0,
    lockedUntil: data.lockedUntil ? (data.lockedUntil as Timestamp).toDate() : null,
    rating: (data.rating as number) || 0,
    totalOrders: (data.totalOrders as number) || 0,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
    createdBy: (data.createdBy as string) || '',
    // Detailed address fields
    street: (data.street as string) || '',
    governorate: (data.governorate as string) || '',
    postalCode: (data.postalCode as string) || '',
  };
}

/**
 * التحقق من صحة بيانات الصيدلية
 */
function validatePharmacyInput(input: CreatePharmacyInput): void {
  if (!input.name || input.name.trim().length < 2) {
    throw new ValidationError('اسم الصيدلية مطلوب ويجب أن يكون أكثر من حرفين', 'name', 'REQUIRED');
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email)) {
    throw new ValidationError('البريد الإلكتروني غير صالح', 'email', 'INVALID_EMAIL');
  }
  
  if (!input.password || input.password.length < 8) {
    throw new ValidationError('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'password', 'WEAK_PASSWORD');
  }
  
  if (!input.address || input.address.trim().length < 5) {
    throw new ValidationError('العنوان مطلوب', 'address', 'REQUIRED');
  }
  
  if (!input.city || input.city.trim().length < 2) {
    throw new ValidationError('المدينة مطلوبة', 'city', 'REQUIRED');
  }
  
  if (!input.phoneNumber || input.phoneNumber.length < 10) {
    throw new ValidationError('رقم الهاتف غير صالح', 'phoneNumber', 'INVALID_PHONE');
  }
  
  if (!input.ownerName || input.ownerName.trim().length < 2) {
    throw new ValidationError('اسم المالك مطلوب', 'ownerName', 'REQUIRED');
  }
  
  if (!input.licenseNumber || input.licenseNumber.trim().length < 5) {
    throw new ValidationError('رقم الترخيص مطلوب', 'licenseNumber', 'REQUIRED');
  }
}

/**
 * توليد رقم صيدلية فريد
 */
async function generatePharmacyId(): Promise<number> {
  const pharmaciesRef = collection(db, PHARMACIES_COLLECTION);
  const snapshot = await getDocs(pharmaciesRef);
  return snapshot.size + 1;
}

/**
 * إنشاء صيدلية جديدة
 * Requirement 1.1: Create pharmacy with hashed password and inactive status
 */
export async function createPharmacy(
  input: CreatePharmacyInput,
  adminId: string
): Promise<PharmacyAccount> {
  // Validate input
  validatePharmacyInput(input);
  
  try {
    console.log('🔍 Checking if email exists:', input.email);
    
    // Check if email already exists
    const existingQuery = query(
      collection(db, PHARMACIES_COLLECTION),
      where('email', '==', input.email.toLowerCase())
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new ValidationError('البريد الإلكتروني مستخدم مسبقاً', 'email', 'DUPLICATE');
    }
    
    console.log('✅ Email is available');
    console.log('🔐 Creating Firebase Auth user...');
    
    // استخدام secondary app لإنشاء المستخدم بدون التأثير على session الأدمن
    const secondaryApp = getSecondaryApp();
    const secondaryAuth = getAuth(secondaryApp);
    
    // Create Firebase Auth user (password is automatically hashed by Firebase)
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        input.email,
        input.password
      );
      console.log('✅ Firebase Auth user created:', userCredential.user.uid);
    } catch (authError: any) {
      console.error('❌ Firebase Auth error:', authError.code, authError.message);
      if (authError.code === 'auth/email-already-in-use') {
        throw new ValidationError('البريد الإلكتروني مستخدم مسبقاً. جرب إيميل تاني أو احذف المستخدم من Firebase Console.', 'email', 'DUPLICATE');
      }
      if (authError.code === 'auth/weak-password') {
        throw new ValidationError('كلمة المرور ضعيفة جداً', 'password', 'WEAK_PASSWORD');
      }
      if (authError.code === 'auth/invalid-email') {
        throw new ValidationError('البريد الإلكتروني غير صالح', 'email', 'INVALID_EMAIL');
      }
      throw new DatabaseError('فشل في إنشاء حساب المستخدم: ' + authError.message, 'createPharmacy', authError);
    }
    
    const userId = userCredential.user.uid;
    
    // Send email verification
    try {
      await sendEmailVerification(userCredential.user);
      console.log('✅ Verification email sent');
    } catch (e) {
      console.warn('⚠️ Could not send verification email:', e);
    }
    
    // تسجيل خروج المستخدم الجديد من secondary auth
    await secondaryAuth.signOut();
    console.log('✅ Signed out from secondary auth');
    
    // Generate pharmacy ID
    const pharmacyId = await generatePharmacyId();
    console.log('✅ Generated pharmacy ID:', pharmacyId);
    
    // Create pharmacy document
    const pharmacyData = {
      pharmacyId,
      name: input.name.trim(),
      email: input.email.toLowerCase(),
      address: input.address.trim(),
      city: input.city.trim(),
      phoneNumber: input.phoneNumber,
      ownerName: input.ownerName.trim(),
      licenseNumber: input.licenseNumber.trim(),
      status: 'inactive' as PharmacyStatus, // Always start as inactive
      medicineLimit: input.medicineLimit || 100,
      currentMedicineCount: 0,
      emailVerified: false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      rating: 0,
      totalOrders: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminId,
    };
    
    console.log('💾 Saving pharmacy document...');
    // Save to pharmacies collection
    await setDoc(doc(db, PHARMACIES_COLLECTION, userId), pharmacyData);
    console.log('✅ Pharmacy document saved');
    
    console.log('💾 Saving user document...');
    // Also create user document with pharmacist role
    await setDoc(doc(db, USERS_COLLECTION, userId), {
      uid: userId,
      email: input.email.toLowerCase(),
      name: input.name.trim(),
      role: 'pharmacist',
      pharmacyId,
      pharmacyName: input.name.trim(),
      profileImageUrl: '',
      cart: [],
      favorites: [],
      isActive: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✅ User document saved');
    
    console.log('🎉 تم إنشاء الصيدلية بنجاح:', pharmacyData.name);
    
    return mapFirestoreToPharmacy(userId, {
      ...pharmacyData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('❌ Error creating pharmacy:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    throw new DatabaseError('فشل في إنشاء الصيدلية: ' + (error.message || 'خطأ غير معروف'), 'createPharmacy', error as Error);
  }
}


/**
 * جلب جميع الصيدليات مع الفلترة
 * Requirement 1.3: Display all pharmacies with status
 * Requirement 1.4: Search and filter pharmacies
 */
export async function getPharmacies(filters?: PharmacyFilters): Promise<PharmacyAccount[]> {
  try {
    const pharmaciesRef = collection(db, PHARMACIES_COLLECTION);
    let q = query(pharmaciesRef);
    
    // Apply status filter
    if (filters?.status && filters.status !== 'all') {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Apply sorting
    const sortField = filters?.sortBy || 'createdAt';
    const sortDirection = filters?.sortOrder || 'desc';
    q = query(q, orderBy(sortField, sortDirection));
    
    const snapshot = await getDocs(q);
    let pharmacies = snapshot.docs.map(doc => 
      mapFirestoreToPharmacy(doc.id, doc.data())
    );
    
    // Apply search filter (client-side for flexibility)
    if (filters?.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      pharmacies = pharmacies.filter(pharmacy =>
        pharmacy.name.toLowerCase().includes(searchLower) ||
        pharmacy.email.toLowerCase().includes(searchLower) ||
        pharmacy.ownerName.toLowerCase().includes(searchLower) ||
        pharmacy.city.toLowerCase().includes(searchLower)
      );
    }
    
    return pharmacies;
  } catch (error) {
    console.error('Error fetching pharmacies:', error);
    throw new DatabaseError('فشل في جلب الصيدليات', 'getPharmacies', error as Error);
  }
}

/**
 * جلب صيدلية بواسطة المعرف
 */
export async function getPharmacyById(id: string): Promise<PharmacyAccount> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('pharmacy', id);
    }
    
    return mapFirestoreToPharmacy(docSnap.id, docSnap.data());
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error fetching pharmacy:', error);
    throw new DatabaseError('فشل في جلب الصيدلية', 'getPharmacyById', error as Error);
  }
}

/**
 * جلب صيدلية بواسطة رقم الصيدلية
 */
export async function getPharmacyByPharmacyId(pharmacyId: number): Promise<PharmacyAccount | null> {
  try {
    const q = query(
      collection(db, PHARMACIES_COLLECTION),
      where('pharmacyId', '==', pharmacyId)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return mapFirestoreToPharmacy(doc.id, doc.data());
  } catch (error) {
    console.error('Error fetching pharmacy by pharmacyId:', error);
    throw new DatabaseError('فشل في جلب الصيدلية', 'getPharmacyByPharmacyId', error as Error);
  }
}

/**
 * تحديث حالة الصيدلية
 * Requirements 1.5, 1.6, 1.7: Activate, deactivate, suspend pharmacy
 */
export async function updatePharmacyStatus(
  id: string,
  status: PharmacyStatus
): Promise<void> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('pharmacy', id);
    }
    
    // Update pharmacy status
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    
    // Also update user document
    const userRef = doc(db, USERS_COLLECTION, id);
    await updateDoc(userRef, {
      isActive: status === 'active',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error updating pharmacy status:', error);
    throw new DatabaseError('فشل في تحديث حالة الصيدلية', 'updatePharmacyStatus', error as Error);
  }
}

/**
 * تحديث حد الأدوية للصيدلية
 * Requirements 5.1, 5.2: Set and update medicine limit
 */
export async function updateMedicineLimit(
  id: string,
  limit: number
): Promise<void> {
  if (limit < 0) {
    throw new ValidationError('الحد يجب أن يكون رقماً موجباً', 'medicineLimit', 'OUT_OF_RANGE');
  }
  
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('pharmacy', id);
    }
    
    await updateDoc(docRef, {
      medicineLimit: limit,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Error updating medicine limit:', error);
    throw new DatabaseError('فشل في تحديث حد الأدوية', 'updateMedicineLimit', error as Error);
  }
}

/**
 * تحديث بيانات الصيدلية
 */
export async function updatePharmacy(
  id: string,
  input: UpdatePharmacyInput
): Promise<void> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('pharmacy', id);
    }
    
    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    
    if (input.name) updateData.name = input.name.trim();
    if (input.address) updateData.address = input.address.trim();
    if (input.city) updateData.city = input.city.trim();
    if (input.phoneNumber) updateData.phoneNumber = input.phoneNumber;
    if (input.ownerName) updateData.ownerName = input.ownerName.trim();
    if (input.licenseNumber) updateData.licenseNumber = input.licenseNumber.trim();
    if (input.street) updateData.street = input.street.trim();
    if (input.governorate) updateData.governorate = input.governorate.trim();
    if (input.postalCode) updateData.postalCode = input.postalCode.trim();
    
    await updateDoc(docRef, updateData);
    
    // Update user document if name changed
    if (input.name) {
      const userRef = doc(db, USERS_COLLECTION, id);
      await updateDoc(userRef, {
        name: input.name.trim(),
        pharmacyName: input.name.trim(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error updating pharmacy:', error);
    throw new DatabaseError('فشل في تحديث الصيدلية', 'updatePharmacy', error as Error);
  }
}

/**
 * البحث عن الصيدليات
 * Requirement 1.4: Search pharmacies by name, email, or status
 */
export async function searchPharmacies(
  searchQuery: string,
  filters?: PharmacyFilters
): Promise<PharmacyAccount[]> {
  return getPharmacies({
    ...filters,
    searchQuery,
  });
}

/**
 * تحديث عداد الأدوية للصيدلية
 */
export async function updateMedicineCount(
  id: string,
  increment: number
): Promise<void> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('pharmacy', id);
    }
    
    const currentCount = (docSnap.data().currentMedicineCount as number) || 0;
    const newCount = Math.max(0, currentCount + increment);
    
    await updateDoc(docRef, {
      currentMedicineCount: newCount,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error updating medicine count:', error);
    throw new DatabaseError('فشل في تحديث عداد الأدوية', 'updateMedicineCount', error as Error);
  }
}

/**
 * التحقق من إمكانية إضافة دواء جديد
 */
export async function canAddMedicine(pharmacyId: string): Promise<boolean> {
  try {
    const pharmacy = await getPharmacyById(pharmacyId);
    return pharmacy.currentMedicineCount < pharmacy.medicineLimit;
  } catch {
    return false;
  }
}

/**
 * جلب إحصائيات الصيدليات
 */
export async function getPharmacyStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  suspended: number;
}> {
  try {
    const pharmacies = await getPharmacies();
    
    return {
      total: pharmacies.length,
      active: pharmacies.filter(p => p.status === 'active').length,
      inactive: pharmacies.filter(p => p.status === 'inactive').length,
      suspended: pharmacies.filter(p => p.status === 'suspended').length,
    };
  } catch (error) {
    console.error('Error fetching pharmacy stats:', error);
    throw new DatabaseError('فشل في جلب إحصائيات الصيدليات', 'getPharmacyStats', error as Error);
  }
}

/**
 * إرسال رابط إعادة تعيين كلمة المرور للصيدلية
 * Send password reset email to pharmacy
 */
export async function sendPharmacyPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new DatabaseError('فشل في إرسال رابط إعادة تعيين كلمة المرور', 'sendPharmacyPasswordReset', error as Error);
  }
}


/**
 * حذف صيدلية نهائياً مع جميع أدويتها
 * Delete pharmacy permanently with all its medicines
 * ⚠️ هذه العملية لا يمكن التراجع عنها
 */
export async function deletePharmacyPermanently(id: string): Promise<{
  success: boolean;
  deletedMedicinesCount: number;
  deletedPendingCount: number;
}> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new NotFoundError('pharmacy', id);
    }
    
    const pharmacyData = docSnap.data();
    const pharmacyIdNum = pharmacyData.pharmacyId as number;
    
    console.log(`🗑️ بدء حذف الصيدلية: ${pharmacyData.name} (ID: ${pharmacyIdNum})`);
    
    // 1. حذف جميع الأدوية المعتمدة من medicines collection
    const medicinesQuery = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', pharmacyIdNum)
    );
    const medicinesSnapshot = await getDocs(medicinesQuery);
    
    let deletedMedicinesCount = 0;
    for (const medicineDoc of medicinesSnapshot.docs) {
      await deleteDoc(doc(db, 'medicines', medicineDoc.id));
      deletedMedicinesCount++;
    }
    console.log(`✅ تم حذف ${deletedMedicinesCount} دواء معتمد`);
    
    // 2. حذف جميع الأدوية المعلقة/المرفوضة من pending_medicines collection
    const pendingQuery = query(
      collection(db, 'pending_medicines'),
      where('pharmacyId', '==', pharmacyIdNum)
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    
    let deletedPendingCount = 0;
    for (const pendingDoc of pendingSnapshot.docs) {
      await deleteDoc(doc(db, 'pending_medicines', pendingDoc.id));
      deletedPendingCount++;
    }
    console.log(`✅ تم حذف ${deletedPendingCount} دواء معلق/مرفوض`);
    
    // 3. حذف مستند المستخدم من users collection
    const userRef = doc(db, USERS_COLLECTION, id);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      await deleteDoc(userRef);
      console.log('✅ تم حذف مستند المستخدم');
    }
    
    // 4. حذف مستند الصيدلية
    await deleteDoc(docRef);
    console.log('✅ تم حذف مستند الصيدلية');
    
    // ملاحظة: حذف المستخدم من Firebase Auth يتطلب Admin SDK
    // يمكن للمستخدم إعادة التسجيل بنفس البريد الإلكتروني لاحقاً
    
    console.log(`🎉 تم حذف الصيدلية "${pharmacyData.name}" نهائياً`);
    
    return {
      success: true,
      deletedMedicinesCount,
      deletedPendingCount,
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error deleting pharmacy permanently:', error);
    throw new DatabaseError('فشل في حذف الصيدلية', 'deletePharmacyPermanently', error as Error);
  }
}
