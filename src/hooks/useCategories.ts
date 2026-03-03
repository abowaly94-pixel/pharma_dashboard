import { useState, useEffect } from 'react';
import { getAllCategories, createCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { MedicineCategory, CreateCategoryInput, UpdateCategoryInput } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useCategories(activeOnly = false) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllCategories(activeOnly);
      setCategories(data);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
      setError(err.message || 'فشل في تحميل التصنيفات');
      toast.error('فشل في تحميل التصنيفات');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [activeOnly]);

  const addCategory = async (input: CreateCategoryInput) => {
    if (!user?.uid) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      await createCategory(input, user.uid);
      toast.success('تم إضافة التصنيف بنجاح');
      await fetchCategories();
    } catch (err: any) {
      console.error('Error adding category:', err);
      toast.error(err.message || 'فشل في إضافة التصنيف');
      throw err;
    }
  };

  const updateCategoryById = async (id: string, input: UpdateCategoryInput) => {
    try {
      await updateCategory(id, input);
      toast.success('تم تحديث التصنيف بنجاح');
      await fetchCategories();
    } catch (err: any) {
      console.error('Error updating category:', err);
      toast.error(err.message || 'فشل في تحديث التصنيف');
      throw err;
    }
  };

  const deleteCategoryById = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('تم حذف التصنيف بنجاح');
      await fetchCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error(err.message || 'فشل في حذف التصنيف');
      throw err;
    }
  };

  return {
    categories,
    isLoading,
    error,
    addCategory,
    updateCategory: updateCategoryById,
    deleteCategory: deleteCategoryById,
    refreshCategories: fetchCategories,
  };
}
