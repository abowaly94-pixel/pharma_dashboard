import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Medicine } from '@/types';
import { toast } from 'sonner';
import { deleteImageFromSupabase } from '@/lib/supabase';

export function useMedicines(pharmacyId?: number, options?: { enabled?: boolean }) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (options?.enabled === false) {
      setMedicines([]);
      setFilteredMedicines([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create base query - remove orderBy temporarily to test
    let medicinesQuery;

    try {
      if (pharmacyId !== undefined && pharmacyId !== null) {
        // For pharmacist - filter by pharmacy first, then try orderBy
        medicinesQuery = query(
          collection(db, 'medicines'),
          where('pharmacyId', '==', pharmacyId)
        );
      } else {
        // For admin - get all medicines
        medicinesQuery = query(collection(db, 'medicines'));
      }

      const unsubscribe = onSnapshot(medicinesQuery,
        (snapshot) => {
          const medicinesList = snapshot.docs.map(doc => {
            const data = doc.data();

            return {
              id: doc.id,
              name: data.name || 'دواء غير معروف',
              code: data.code || '',
              description: data.description || '',
              price: data.price || 0,
              quantity: data.quantity || 0,
              pharmacyId: data.pharmacyId as string,
              pharmacyName: data.pharmacyName || '',
              pharmcyAddress: data.pharmcyAddress || '',
              avgRating: data.avgRating || 0,
              ratingCount: data.ratingCount || 0,
              discountRating: data.discountRating || 0,
              isNewProduct: data.isNewProduct || false,
              sellingCount: data.sellingCount || 0,
              reviews: data.reviews || [],
              subabaseImageUrl: data.subabaseImageUrl || data.subabaseORImageUrl || '', // الحقل الأساسي
              subabaseORImageUrl: data.subabaseORImageUrl || '', // للتوافق مع البيانات القديمة
              category: data.category || '',
              manufacturer: data.manufacturer || '',
              expiryDate: data.expiryDate?.toDate(),
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate()
            } as Medicine;
          });

          // Sort manually by createdAt if needed
          medicinesList.sort((a, b) => {
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });

          setMedicines(medicinesList);
          setFilteredMedicines(medicinesList);
          setIsLoading(false);
        },
        (err) => {
          console.error('❌ خطأ في جلب الأدوية:', err);
          console.error('تفاصيل الخطأ:', {
            code: err.code,
            message: err.message,
            pharmacyId: pharmacyId
          });

          let errorMessage = 'فشل في تحميل الأدوية';

          if (err.code === 'failed-precondition') {
            errorMessage = 'يحتاج إنشاء فهرس في Firebase Console';
          } else if (err.code === 'permission-denied') {
            errorMessage = 'ليس لديك صلاحية للوصول للأدوية';
          } else if (err.code === 'unavailable') {
            errorMessage = 'خدمة Firebase غير متاحة حالياً';
          }

          setError(errorMessage);
          setIsLoading(false);
          toast.error(`حدث خطأ: ${errorMessage}`);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('❌ خطأ في إنشاء الاستعلام:', err);
      setError('خطأ في إعداد الاستعلام');
      setIsLoading(false);
    }
  }, [pharmacyId, options?.enabled]);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMedicines(medicines);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = medicines.filter(medicine =>
      medicine.name.toLowerCase().includes(query) ||
      medicine.code.toLowerCase().includes(query) ||
      medicine.description.toLowerCase().includes(query) ||
      medicine.pharmacyName.toLowerCase().includes(query) ||
      medicine.category?.toLowerCase().includes(query) ||
      medicine.manufacturer?.toLowerCase().includes(query)
    );

    setFilteredMedicines(filtered);
  }, [searchQuery, medicines]);

  const addMedicine = async (medicine: Omit<Medicine, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'medicines'), {
        ...medicine,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('تم إضافة الدواء بنجاح');
    } catch (err) {
      console.error('Error adding medicine:', err);
      toast.error('فشل في إضافة الدواء');
      throw err;
    }
  };

  const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
    try {
      const medicineRef = doc(db, 'medicines', id);

      // Clean up the updates object - explicitly set empty strings for deleted images
      const cleanedUpdates: any = { ...updates };

      // If image URL is empty, explicitly set both fields to empty string
      if ('subabaseImageUrl' in cleanedUpdates && cleanedUpdates.subabaseImageUrl === '') {
        cleanedUpdates.subabaseImageUrl = '';
        cleanedUpdates.subabaseORImageUrl = '';
      }

      await updateDoc(medicineRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });
      toast.success('تم تحديث بيانات الدواء بنجاح');
    } catch (err) {
      console.error('Error updating medicine:', err);
      toast.error('فشل في تحديث بيانات الدواء');
      throw err;
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      // Get medicine data first to retrieve image URL
      const medicineRef = doc(db, 'medicines', id);
      const medicineDoc = await getDoc(medicineRef);

      if (medicineDoc.exists()) {
        const medicineData = medicineDoc.data();
        const imageUrl = medicineData.subabaseImageUrl || medicineData.subabaseORImageUrl;

        // Delete image from Supabase Storage if exists
        if (imageUrl) {
          console.log('🗑️ حذف الصورة من Supabase Storage:', imageUrl);
          const deleteResult = await deleteImageFromSupabase(imageUrl);

          if (deleteResult.success) {
            console.log('✅ تم حذف الصورة من Supabase بنجاح');
          } else {
            console.warn('⚠️ فشل حذف الصورة من Supabase:', deleteResult.error);
            // Continue with medicine deletion even if image deletion fails
          }
        }
      }

      // Delete medicine document from Firestore
      await deleteDoc(medicineRef);
      toast.success('تم حذف الدواء والصورة بنجاح');
    } catch (err) {
      console.error('Error deleting medicine:', err);
      toast.error('فشل في حذف الدواء');
      throw err;
    }
  };

  return {
    medicines: filteredMedicines,
    allMedicines: medicines, // Ensure allMedicines is returned
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    addMedicine,
    updateMedicine,
    deleteMedicine
  };
}
