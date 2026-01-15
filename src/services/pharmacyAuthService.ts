/**
 * خدمة المصادقة للصيدليات
 * Pharmacy Authentication Service
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { PharmacyAccount, PharmacySession, PharmacyStatus } from '@/types';
import { AuthenticationError, DatabaseError } from '@/types/errors';

const PHARMACIES_COLLECTION = 'pharmacies';
const USERS_COLLECTION = 'users';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * التحقق من حالة قفل الحساب
 * Requirement 2.5: Account lockout after 5 failed attempts
 */
export async function isAccountLocked(pharmacyId: string): Promise<boolean> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, pharmacyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const data = docSnap.data();
    const lockedUntil = data.lockedUntil as Timestamp | null;
    
    if (!lockedUntil) {
      return false;
    }
    
    const lockTime = lockedUntil.toDate();
    const now = new Date();
    
    if (now < lockTime) {
      return true;
    }
    
    // Lock expired, reset
    await updateDoc(docRef, {
      lockedUntil: null,
      failedLoginAttempts: 0,
    });
    
    return false;
  } catch (error) {
    console.error('Error checking account lock:', error);
    return false;
  }
}

/**
 * معالجة محاولة تسجيل دخول فاشلة
 * Requirement 2.5: Lock account after 5 failed attempts for 15 minutes
 */
export async function handleFailedLogin(pharmacyId: string): Promise<void> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, pharmacyId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return;
    }
    
    const data = docSnap.data();
    const currentAttempts = (data.failedLoginAttempts as number) || 0;
    const newAttempts = currentAttempts + 1;
    
    const updateData: Record<string, unknown> = {
      failedLoginAttempts: newAttempts,
      updatedAt: serverTimestamp(),
    };
    
    // Lock account if max attempts reached
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
      updateData.lockedUntil = Timestamp.fromDate(lockUntil);
    }
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error handling failed login:', error);
  }
}

/**
 * إعادة تعيين عداد المحاولات الفاشلة
 */
async function resetFailedAttempts(pharmacyId: string): Promise<void> {
  try {
    const docRef = doc(db, PHARMACIES_COLLECTION, pharmacyId);
    await updateDoc(docRef, {
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
}

/**
 * تسجيل دخول الصيدلية
 * Requirements 2.1, 2.2: Login with status check
 */
export async function loginPharmacy(
  email: string,
  password: string
): Promise<{ user: FirebaseUser; pharmacy: PharmacyAccount }> {
  try {
    // First, try to authenticate
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    
    // Check pharmacy document
    const pharmacyRef = doc(db, PHARMACIES_COLLECTION, userId);
    const pharmacySnap = await getDoc(pharmacyRef);
    
    if (!pharmacySnap.exists()) {
      await signOut(auth);
      throw new AuthenticationError('الحساب غير موجود', 'INVALID_CREDENTIALS');
    }
    
    const pharmacyData = pharmacySnap.data();
    
    // Check if account is locked
    const locked = await isAccountLocked(userId);
    if (locked) {
      await signOut(auth);
      throw new AuthenticationError(
        'تم قفل الحساب مؤقتاً. يرجى المحاولة بعد 15 دقيقة',
        'ACCOUNT_LOCKED'
      );
    }
    
    // Check pharmacy status
    const status = pharmacyData.status as PharmacyStatus;
    
    if (status === 'inactive') {
      await signOut(auth);
      throw new AuthenticationError(
        'الحساب غير مفعل. يرجى التواصل مع الإدارة',
        'ACCOUNT_INACTIVE'
      );
    }
    
    if (status === 'suspended') {
      await signOut(auth);
      throw new AuthenticationError(
        'تم تعليق الحساب. يرجى التواصل مع الإدارة',
        'ACCOUNT_SUSPENDED'
      );
    }
    
    // Reset failed attempts on successful login
    await resetFailedAttempts(userId);
    
    // Map pharmacy data
    const pharmacy: PharmacyAccount = {
      id: userId,
      pharmacyId: pharmacyData.pharmacyId as number,
      name: pharmacyData.name as string,
      email: pharmacyData.email as string,
      address: pharmacyData.address as string,
      city: pharmacyData.city as string,
      phoneNumber: pharmacyData.phoneNumber as string,
      ownerName: pharmacyData.ownerName as string,
      licenseNumber: pharmacyData.licenseNumber as string,
      status: status,
      medicineLimit: (pharmacyData.medicineLimit as number) || 100,
      currentMedicineCount: (pharmacyData.currentMedicineCount as number) || 0,
      emailVerified: (pharmacyData.emailVerified as boolean) || false,
      failedLoginAttempts: 0,
      lockedUntil: null,
      rating: (pharmacyData.rating as number) || 0,
      totalOrders: (pharmacyData.totalOrders as number) || 0,
      createdAt: pharmacyData.createdAt ? (pharmacyData.createdAt as Timestamp).toDate() : new Date(),
      updatedAt: new Date(),
      createdBy: (pharmacyData.createdBy as string) || '',
    };
    
    return { user: userCredential.user, pharmacy };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    
    // Firebase auth error - invalid credentials
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/invalid-credential' || 
        firebaseError.code === 'auth/user-not-found' ||
        firebaseError.code === 'auth/wrong-password') {
      throw new AuthenticationError(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        'INVALID_CREDENTIALS'
      );
    }
    
    console.error('Login error:', error);
    throw new DatabaseError('فشل في تسجيل الدخول', 'loginPharmacy', error as Error);
  }
}

/**
 * تسجيل خروج الصيدلية
 * Requirement 2.4: Logout and invalidate session
 */
export async function logoutPharmacy(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw new DatabaseError('فشل في تسجيل الخروج', 'logoutPharmacy', error as Error);
  }
}

/**
 * التحقق من صلاحية الجلسة
 * Requirement 2.3: Session validation
 */
export function validateSession(): Promise<FirebaseUser | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * الحصول على المستخدم الحالي
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * التحقق من حالة الصيدلية للمستخدم الحالي
 */
export async function checkCurrentPharmacyStatus(): Promise<PharmacyStatus | null> {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    const pharmacyRef = doc(db, PHARMACIES_COLLECTION, user.uid);
    const pharmacySnap = await getDoc(pharmacyRef);
    
    if (!pharmacySnap.exists()) return null;
    
    return pharmacySnap.data().status as PharmacyStatus;
  } catch {
    return null;
  }
}

/**
 * الاستماع لتغييرات حالة المصادقة
 */
export function onPharmacyAuthStateChanged(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
