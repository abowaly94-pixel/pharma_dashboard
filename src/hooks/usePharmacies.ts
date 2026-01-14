import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pharmacy } from '@/types';

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

  return { pharmacies, isLoading, error };
}
