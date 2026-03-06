/**
 * خدمة إدارة تصنيفات الأدوية
 * Medicine Categories Management Service
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
  MedicineCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/types';
import {
  ValidationError,
  NotFoundError,
  DatabaseError,
  AuthorizationError,
} from '@/types/errors';

const CATEGORIES_COLLECTION = 'medicine_categories';

/**
 * تحويل بيانات Firestore إلى MedicineCategory
 */
function mapFirestoreToCategory(id: string, data: Record<string, unknown>): MedicineCategory {
  return {
    id,
    name: data.name as string,
    nameEn: data.nameEn as string,
    description: (data.description as string) || '',
    sectionId: data.sectionId as string | undefined,
    sectionName: data.sectionName as string | undefined,
    isActive: data.isActive as boolean,
    createdAt: data.createdAt ? (data.createdAt as Timestamp).toDate() : new Date(),
    updatedAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
    createdBy: data.createdBy as string,
  };
}

/**
 * التحقق من صحة بيانات التصنيف
 */
function validateCategoryInput(input: CreateCategoryInput): void {
  if (!input.name || input.name.trim().length < 2) {
    throw new ValidationError('اسم التصنيف بالعربية مطلوب (حرفين على الأقل)', 'name', 'REQUIRED');
  }
  if (!input.nameEn || input.nameEn.trim().length < 2) {
    throw new ValidationError('اسم التصنيف بالإنجليزية مطلوب (حرفين على الأقل)', 'nameEn', 'REQUIRED');
  }
}

/**
 * إنشاء تصنيف جديد
 */
export async function createCategory(
  input: CreateCategoryInput,
  adminId: string
): Promise<MedicineCategory> {
  validateCategoryInput(input);

  try {
    // التحقق من عدم وجود تصنيف بنفس الاسم
    const existingQuery = query(
      collection(db, CATEGORIES_COLLECTION),
      where('name', '==', input.name.trim())
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      throw new ValidationError('يوجد تصنيف بنفس الاسم بالفعل', 'name', 'DUPLICATE');
    }

    const categoryId = doc(collection(db, CATEGORIES_COLLECTION)).id;

    const categoryData = {
      name: input.name.trim(),
      nameEn: input.nameEn.trim(),
      description: input.description?.trim() || '',
      sectionId: input.sectionId || '',
      sectionName: input.sectionName || '',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: adminId,
    };

    await setDoc(doc(db, CATEGORIES_COLLECTION, categoryId), categoryData);

    return mapFirestoreToCategory(categoryId, {
      ...categoryData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    console.error('Error creating category:', error);
    throw new DatabaseError('فشل في إنشاء التصنيف', 'createCategory', error as Error);
  }
}

/**
 * جلب جميع التصنيفات
 */
export async function getAllCategories(activeOnly = false): Promise<MedicineCategory[]> {
  try {
    console.log('🔍 getAllCategories called with activeOnly:', activeOnly);
    console.log('📂 Collection name:', CATEGORIES_COLLECTION);
    
    // Get all categories first (no compound query to avoid index requirement)
    const q = query(collection(db, CATEGORIES_COLLECTION));
    
    const snapshot = await getDocs(q);
    console.log('📊 Firebase query result - docs count:', snapshot.docs.length);
    
    let categories = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📄 Category doc:', { id: doc.id, name: data.name, isActive: data.isActive });
      return mapFirestoreToCategory(doc.id, data);
    });
    
    // Filter active categories in memory if needed
    if (activeOnly) {
      categories = categories.filter(cat => cat.isActive);
      console.log('✅ Filtered for active categories:', categories.length);
    }
    
    // Sort by creation date (newest first)
    categories.sort((a, b) => {
      const dateA = a.createdAt?.getTime() || 0;
      const dateB = b.createdAt?.getTime() || 0;
      return dateB - dateA; // الأحدث أولاً
    });
    
    console.log('✅ Final categories:', categories);
    return categories;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    throw new DatabaseError('فشل في جلب التصنيفات', 'getAllCategories', error as Error);
  }
}

/**
 * جلب تصنيف بواسطة المعرف
 */
export async function getCategoryById(id: string): Promise<MedicineCategory> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new NotFoundError('category', id);
    }

    return mapFirestoreToCategory(docSnap.id, docSnap.data());
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    console.error('Error fetching category:', error);
    throw new DatabaseError('فشل في جلب التصنيف', 'getCategoryById', error as Error);
  }
}

/**
 * تحديث تصنيف
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<void> {
  try {
    const category = await getCategoryById(id);

    // التحقق من عدم وجود تصنيف آخر بنفس الاسم الجديد
    if (input.name && input.name !== category.name) {
      const existingQuery = query(
        collection(db, CATEGORIES_COLLECTION),
        where('name', '==', input.name.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        throw new ValidationError('يوجد تصنيف بنفس الاسم بالفعل', 'name', 'DUPLICATE');
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (input.name) updateData.name = input.name.trim();
    if (input.nameEn) updateData.nameEn = input.nameEn.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.sectionId !== undefined) updateData.sectionId = input.sectionId;
    if (input.sectionName !== undefined) updateData.sectionName = input.sectionName;

    await updateDoc(doc(db, CATEGORIES_COLLECTION, id), updateData);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    console.error('Error updating category:', error);
    throw new DatabaseError('فشل في تحديث التصنيف', 'updateCategory', error as Error);
  }
}

/**
 * حذف تصنيف
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    // التحقق من عدم ارتباط التصنيف بأي أدوية
    const medicinesQuery = query(
      collection(db, 'medicines'),
      where('category', '==', id)
    );
    const medicinesSnapshot = await getDocs(medicinesQuery);

    if (!medicinesSnapshot.empty) {
      throw new AuthorizationError(
        'لا يمكن حذف التصنيف لأنه مرتبط بأدوية موجودة',
        'ACTION_NOT_ALLOWED'
      );
    }

    // التحقق من الأدوية المعلقة أيضاً
    const pendingMedicinesQuery = query(
      collection(db, 'pending_medicines'),
      where('category', '==', id)
    );
    const pendingMedicinesSnapshot = await getDocs(pendingMedicinesQuery);

    if (!pendingMedicinesSnapshot.empty) {
      throw new AuthorizationError(
        'لا يمكن حذف التصنيف لأنه مرتبط بأدوية معلقة',
        'ACTION_NOT_ALLOWED'
      );
    }

    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }
    console.error('Error deleting category:', error);
    throw new DatabaseError('فشل في حذف التصنيف', 'deleteCategory', error as Error);
  }
}

/**
 * تبديل حالة التصنيف (تفعيل/تعطيل)
 */
export async function toggleCategoryStatus(id: string): Promise<void> {
  try {
    const category = await getCategoryById(id);
    await updateDoc(doc(db, CATEGORIES_COLLECTION, id), {
      isActive: !category.isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    console.error('Error toggling category status:', error);
    throw new DatabaseError('فشل في تغيير حالة التصنيف', 'toggleCategoryStatus', error as Error);
  }
}

/**
 * جلب إحصائيات التصنيفات
 */
export async function getCategoryStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
}> {
  try {
    const categories = await getAllCategories();

    return {
      total: categories.length,
      active: categories.filter(c => c.isActive).length,
      inactive: categories.filter(c => !c.isActive).length,
    };
  } catch (error) {
    console.error('Error fetching category stats:', error);
    throw new DatabaseError('فشل في جلب إحصائيات التصنيفات', 'getCategoryStats', error as Error);
  }
}
