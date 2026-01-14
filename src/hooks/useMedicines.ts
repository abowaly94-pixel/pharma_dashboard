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
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Medicine } from '@/types';
import { toast } from 'sonner';

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
          console.log(`📊 تم جلب ${snapshot.size} دواء من Firebase`);
          
          const medicinesList = snapshot.docs.map(doc => {
            const data = doc.data();
            
            return {
              id: doc.id,
              name: data.name || 'دواء غير معروف',
              code: data.code || '',
              description: data.description || '',
              price: data.price || 0,
              quantity: data.quantity || 0,
              pharmacyId: data.pharmacyId || 0,
              pharmacyName: data.pharmacyName || '',
              pharmcyAddress: data.pharmcyAddress || '',
              avgRating: data.avgRating || 0,
              ratingCount: data.ratingCount || 0,
              discountRating: data.discountRating || 0,
              isNewProduct: data.isNewProduct || false,
              sellingCount: data.sellingCount || 0,
              reviews: data.reviews || [],
              subabaseORImageUrl: data.subabaseORImageUrl || '',
              subabaseImageUrl: data.subabaseImageUrl || '', // الحقل الصحيح
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

          console.log('✅ تم تحميل الأدوية بنجاح:', medicinesList.map(m => m.name));
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
      await updateDoc(medicineRef, {
        ...updates,
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
      await deleteDoc(doc(db, 'medicines', id));
      toast.success('تم حذف الدواء بنجاح');
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
