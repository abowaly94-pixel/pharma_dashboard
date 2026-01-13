import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pharmacy } from '@/types';
import { toast } from 'sonner';

export function usePharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const pharmaciesQuery = query(
      collection(db, 'pharmacies'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      pharmaciesQuery,
      (snapshot) => {
        const pharmaciesList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            pharmacyId: data.pharmacyId || 0,
            name: data.name || 'صيدلية غير معروفة',
            address: data.address || '',
            city: data.city || '',
            phoneNumber: data.phoneNumber || '',
            email: data.email || '',
            ownerName: data.ownerName || '',
            licenseNumber: data.licenseNumber || '',
            isActive: data.isActive !== false,
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
        setError('Failed to fetch pharmacies');
        setIsLoading(false);
        toast.error('حدث خطأ أثناء تحميل الصيدليات');
      }
    );

    return () => unsubscribe();
  }, []);

  const addPharmacy = async (pharmacy: Omit<Pharmacy, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'pharmacies'), {
        ...pharmacy,
        createdAt: serverTimestamp()
      });
      toast.success('تم إضافة الصيدلية بنجاح');
    } catch (err) {
      console.error('Error adding pharmacy:', err);
      toast.error('فشل في إضافة الصيدلية');
      throw err;
    }
  };

  const updatePharmacy = async (id: string, updates: Partial<Pharmacy>) => {
    try {
      const pharmacyRef = doc(db, 'pharmacies', id);
      await updateDoc(pharmacyRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      toast.success('تم تحديث بيانات الصيدلية بنجاح');
    } catch (err) {
      console.error('Error updating pharmacy:', err);
      toast.error('فشل في تحديث بيانات الصيدلية');
      throw err;
    }
  };

  const deletePharmacy = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'pharmacies', id));
      toast.success('تم حذف الصيدلية بنجاح');
    } catch (err) {
      console.error('Error deleting pharmacy:', err);
      toast.error('فشل في حذف الصيدلية');
      throw err;
    }
  };

  const togglePharmacyStatus = async (id: string, isActive: boolean) => {
    try {
      await updatePharmacy(id, { isActive });
      toast.success(isActive ? 'تم تفعيل الصيدلية' : 'تم إيقاف الصيدلية');
    } catch (err) {
      console.error('Error toggling pharmacy status:', err);
      throw err;
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
