/**
 * Hook لأدوية الصيدلية
 * Pharmacy Medicines Hook
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  MedicineWithApproval,
  CreateMedicineInput,
  UpdateMedicineInput,
  GroupedMedicines,
} from '@/types';
import {
  createMedicine,
  updateMedicine,
  getMedicinesGroupedByStatus,
  canPharmacyAddMedicine,
} from '@/services/medicineService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UsePharmacyMedicinesReturn {
  medicines: MedicineWithApproval[];
  groupedMedicines: GroupedMedicines;
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  limitInfo: {
    canAdd: boolean;
    currentCount: number;
    limit: number;
    remaining: number;
  };
  addMedicine: (data: CreateMedicineInput) => Promise<MedicineWithApproval | null>;
  editMedicine: (id: string, data: UpdateMedicineInput) => Promise<boolean>;
  refreshMedicines: () => Promise<void>;
  checkCanAdd: () => Promise<boolean>;
}

export function usePharmacyMedicines(pharmacyId?: string): UsePharmacyMedicinesReturn {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineWithApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [limitInfo, setLimitInfo] = useState({
    canAdd: true,
    currentCount: 0,
    limit: 0, // Start with 0 instead of 100
    remaining: 0,
  });

  const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
  const effectivePharmacyIdNumber = pharmacyId ? parseInt(pharmacyId) : user?.pharmacyId;

  // Real-time listener for pharmacy medicines
  useEffect(() => {
    if (!effectivePharmacyIdNumber) {
      setMedicines([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', effectivePharmacyIdNumber),
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

        setMedicines(medicineList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to medicines:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [effectivePharmacyId]);


  // Update limit info when pharmacy changes
  useEffect(() => {
    if (!effectivePharmacyId) {
      setLimitInfo({
        canAdd: false,
        currentCount: 0,
        limit: 100,
        remaining: 100,
      });
      return;
    }

    const updateLimitInfo = async () => {
      try {
        const info = await canPharmacyAddMedicine(effectivePharmacyId);
        setLimitInfo({
          ...info,
          remaining: info.limit - info.currentCount,
        });
      } catch (err) {
        console.error('Error fetching limit info:', err);
        setLimitInfo({
          canAdd: true,
          currentCount: 0,
          limit: 100,
          remaining: 100,
        });
      }
    };

    updateLimitInfo();
  }, [effectivePharmacyId]); // Only update when pharmacyId changes, not medicines.length

  // Group medicines by status
  const groupedMedicines: GroupedMedicines = {
    pending: medicines.filter(m => m.status === 'pending'),
    approved: medicines.filter(m => m.status === 'approved'),
    rejected: medicines.filter(m => m.status === 'rejected'),
  };

  // Stats
  const stats = {
    total: medicines.length,
    pending: groupedMedicines.pending.length,
    approved: groupedMedicines.approved.length,
    rejected: groupedMedicines.rejected.length,
  };

  const addMedicine = useCallback(
    async (data: CreateMedicineInput): Promise<MedicineWithApproval | null> => {
      if (!effectivePharmacyId || !user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      if (!limitInfo.canAdd) {
        toast.error('تم الوصول للحد الأقصى من الأدوية المسموح بها');
        return null;
      }

      try {
        const pharmacyName = user.pharmacyName || 'صيدلية';
        const medicine = await createMedicine(data, effectivePharmacyId, pharmacyName);
        
        toast.success('تم إضافة الدواء بنجاح وهو في انتظار المراجعة');
        return medicine;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في إضافة الدواء');
        setError(error);
        return null;
      }
    },
    [effectivePharmacyId, user, limitInfo.canAdd]
  );

  const editMedicine = useCallback(
    async (id: string, data: UpdateMedicineInput): Promise<boolean> => {
      if (!effectivePharmacyId) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      try {
        await updateMedicine(id, data, effectivePharmacyId);
        toast.success('تم تحديث الدواء بنجاح');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في تحديث الدواء');
        return false;
      }
    },
    [effectivePharmacyId]
  );

  const refreshMedicines = useCallback(async () => {
    if (!effectivePharmacyId) return;
    
    try {
      setIsLoading(true);
      const grouped = await getMedicinesGroupedByStatus(effectivePharmacyId);
      const allMedicines = [
        ...grouped.pending,
        ...grouped.approved,
        ...grouped.rejected,
      ];
      setMedicines(allMedicines);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [effectivePharmacyId]);

  const checkCanAdd = useCallback(async (): Promise<boolean> => {
    if (!effectivePharmacyId) return false;
    
    try {
      const info = await canPharmacyAddMedicine(effectivePharmacyId);
      setLimitInfo({
        ...info,
        remaining: info.limit - info.currentCount,
      });
      return info.canAdd;
    } catch {
      return false;
    }
  }, [effectivePharmacyId]);

  return {
    medicines,
    groupedMedicines,
    isLoading,
    error,
    stats,
    limitInfo,
    addMedicine,
    editMedicine,
    refreshMedicines,
    checkCanAdd,
  };
}
