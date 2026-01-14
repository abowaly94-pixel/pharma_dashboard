import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pharmacy } from '@/types';
import { toast } from 'sonner';

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const pharmaciesQuery = query(
        collection(db, 'pharmacies'),
        orderBy('name', 'asc')
      );

      const unsubscribe = onSnapshot(
        pharmaciesQuery,
        (snapshot) => {
          const pharmaciesList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              pharmacyId: data.pharmacyId || 0,
              name: data.name || '',
              address: data.address || '',
              city: data.city || '',
              phoneNumber: data.phoneNumber || '',
              email: data.email || '',
              ownerName: data.ownerName || '',
              licenseNumber: data.licenseNumber || '',
              isActive: data.isActive ?? true,
              rating: data.rating || 0,
              totalOrders: data.totalOrders || 0,
              totalMedicines: data.totalMedicines || 0,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate()
            } as Pharmacy;
          });

          setPharmacies(pharmaciesList);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching pharmacies:', err);
          setError('فشل في تحميل الصيدليات');
          setIsLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up pharmacies query:', err);
      setError('خطأ في إعداد الاستعلام');
      setIsLoading(false);
    }
  }, []);

  const addPharmacy = async (pharmacyData: Omit<Pharmacy, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addDoc(collection(db, 'pharmacies'), {
        ...pharmacyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('تم إضافة الصيدلية بنجاح');
    } catch (error) {
      console.error('Error adding pharmacy:', error);
      toast.error('فشل في إضافة الصيدلية');
      throw error;
    }
  };

  const updatePharmacy = async (id: string, pharmacyData: Partial<Pharmacy>) => {
    try {
      const pharmacyRef = doc(db, 'pharmacies', id);
      await updateDoc(pharmacyRef, {
        ...pharmacyData,
        updatedAt: serverTimestamp()
      });
      toast.success('تم تحديث الصيدلية بنجاح');
    } catch (error) {
      console.error('Error updating pharmacy:', error);
      toast.error('فشل في تحديث الصيدلية');
      throw error;
    }
  };

  const deletePharmacy = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pharmacies', id));
      toast.success('تم حذف الصيدلية بنجاح');
    } catch (error) {
      console.error('Error deleting pharmacy:', error);
      toast.error('فشل في حذف الصيدلية');
      throw error;
    }
  };

  const togglePharmacyStatus = async (id: string, isActive: boolean) => {
    try {
      const pharmacyRef = doc(db, 'pharmacies', id);
      await updateDoc(pharmacyRef, {
        isActive,
        updatedAt: serverTimestamp()
      });
      toast.success(isActive ? 'تم تفعيل الصيدلية' : 'تم إيقاف الصيدلية');
    } catch (error) {
      console.error('Error toggling pharmacy status:', error);
      toast.error('فشل في تغيير حالة الصيدلية');
      throw error;
    }
  };

  return { 
    pharmacies, 
    isLoading, 
    error,
    addPharmacy,
    updatePharmacy,
    deletePharmacy,
    togglePharmacyStatus
  };
}
