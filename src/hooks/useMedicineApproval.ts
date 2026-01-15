/**
 * Hook لمراجعة الأدوية
 * Medicine Approval Hook
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MedicineWithApproval, MedicineFilters, MedicineStatus } from '@/types';
import {
  approveMedicine,
  rejectMedicine,
  filterMedicines,
  getMedicineStats,
} from '@/services/medicineService';
import {
  logMedicineApproved,
  logMedicineRejected,
} from '@/services/auditService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UseMedicineApprovalReturn {
  pendingMedicines: MedicineWithApproval[];
  allMedicines: MedicineWithApproval[];
  filteredMedicines: MedicineWithApproval[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  filters: MedicineFilters;
  setFilters: (filters: MedicineFilters) => void;
  approve: (id: string) => Promise<boolean>;
  reject: (id: string, notes: string) => Promise<boolean>;
  refreshMedicines: () => Promise<void>;
}

export function useMedicineApproval(): UseMedicineApprovalReturn {
  const { user } = useAuth();
  const [allMedicines, setAllMedicines] = useState<MedicineWithApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<MedicineFilters>({
    status: 'all',
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Real-time listener for medicines
  useEffect(() => {
    const q = query(
      collection(db, 'medicines'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const medicineList: MedicineWithApproval[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            code: data.code,
            description: data.description,
            price: data.price,
            quantity: data.quantity,
            category: data.category,
            manufacturer: data.manufacturer || '',
            expiryDate: data.expiryDate?.toDate() || new Date(),
            imageUrl: data.imageUrl || data.subabaseORImageUrl || '',
            pharmacyId: data.pharmacyId,
            pharmacyName: data.pharmacyName,
            status: data.status || 'pending',
            rejectionNotes: data.rejectionNotes || null,
            reviewedBy: data.reviewedBy || null,
            reviewedAt: data.reviewedAt?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };
        });

        setAllMedicines(medicineList);
        
        // Update stats
        setStats({
          total: medicineList.length,
          pending: medicineList.filter(m => m.status === 'pending').length,
          approved: medicineList.filter(m => m.status === 'approved').length,
          rejected: medicineList.filter(m => m.status === 'rejected').length,
        });
        
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to medicines:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter medicines
  const filteredMedicines = allMedicines.filter((medicine) => {
    if (filters.status && filters.status !== 'all' && medicine.status !== filters.status) {
      return false;
    }
    if (filters.pharmacyId && medicine.pharmacyId !== filters.pharmacyId) {
      return false;
    }
    if (filters.category && medicine.category !== filters.category) {
      return false;
    }
    if (filters.dateRange) {
      const createdAt = medicine.createdAt;
      if (createdAt < filters.dateRange.start || createdAt > filters.dateRange.end) {
        return false;
      }
    }
    return true;
  });

  // Pending medicines only
  const pendingMedicines = allMedicines.filter(m => m.status === 'pending');

  const approve = useCallback(
    async (id: string): Promise<boolean> => {
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      try {
        const medicine = allMedicines.find(m => m.id === id);
        await approveMedicine(id, user.uid);
        
        // Log the action
        if (medicine) {
          await logMedicineApproved(user.uid, user.email, id, medicine.name);
        }
        
        toast.success('تمت الموافقة على الدواء');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في الموافقة على الدواء');
        return false;
      }
    },
    [user, allMedicines]
  );

  const reject = useCallback(
    async (id: string, notes: string): Promise<boolean> => {
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      if (!notes || notes.trim().length < 5) {
        toast.error('يجب إضافة ملاحظات للرفض (5 أحرف على الأقل)');
        return false;
      }

      try {
        const medicine = allMedicines.find(m => m.id === id);
        await rejectMedicine(id, user.uid, notes);
        
        // Log the action
        if (medicine) {
          await logMedicineRejected(user.uid, user.email, id, medicine.name, notes);
        }
        
        toast.success('تم رفض الدواء');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في رفض الدواء');
        return false;
      }
    },
    [user, allMedicines]
  );

  const refreshMedicines = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await filterMedicines(filters);
      setAllMedicines(data);
      const newStats = await getMedicineStats();
      setStats(newStats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    pendingMedicines,
    allMedicines,
    filteredMedicines,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    approve,
    reject,
    refreshMedicines,
  };
}
