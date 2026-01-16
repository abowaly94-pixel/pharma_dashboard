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
    limit: 0, // Start with 0 to indicate not loaded yet
    remaining: 0,
  });

  // Real-time listener for pharmacy medicines
  useEffect(() => {
    const effectivePharmacyIdNumber = pharmacyId ? parseInt(pharmacyId) : user?.pharmacyId;
    
    if (!effectivePharmacyIdNumber) {
      console.log('⚠️ No pharmacy ID found', { 
        pharmacyId, 
        userPharmacyId: user?.pharmacyId,
        effectivePharmacyIdNumber,
        user: user ? { uid: user.uid, role: user.role, pharmacyId: user.pharmacyId } : null
      });
      setMedicines([]);
      setIsLoading(false);
      return;
    }

    console.log('🔍 Setting up real-time listener for pharmacyId:', effectivePharmacyIdNumber, {
      user: user ? { uid: user.uid, role: user.role, pharmacyId: user.pharmacyId } : null
    });
    setIsLoading(true);

    // Query without orderBy to avoid index requirement
    // TODO: Add orderBy('createdAt', 'desc') after creating the composite index
    const q = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', effectivePharmacyIdNumber)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📦 Received medicines update:', snapshot.docs.length, 'medicines');
        
        const medicineList: MedicineWithApproval[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log('💊 Medicine:', {
            id: doc.id,
            name: data.name,
            pharmacyId: data.pharmacyId,
            status: data.status
          });
          
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

        console.log('✅ Setting medicines state:', medicineList.length, 'medicines');
        setMedicines(medicineList);
        setIsLoading(false);
      },
      (err) => {
        console.error('❌ Error listening to medicines:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pharmacyId, user?.pharmacyId]);


  // Update limit info when pharmacy changes or medicines count changes
  useEffect(() => {
    const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
    
    if (!effectivePharmacyId) {
      setLimitInfo({
        canAdd: false,
        currentCount: 0,
        limit: 0,
        remaining: 0,
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
        // On error, set reasonable defaults but don't show fake numbers
        setLimitInfo({
          canAdd: false,
          currentCount: medicines.length,
          limit: 0,
          remaining: 0,
        });
      }
    };

    updateLimitInfo();
  }, [pharmacyId, user?.pharmacyId, medicines.length]); // Update when pharmacyId or medicines count changes

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
      const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
      
      if (!effectivePharmacyId || !user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      if (!limitInfo.canAdd) {
        toast.error('تم الوصول للحد الأقصى من الأدوية المسموح بها');
        return null;
      }

      try {
        console.log('🔍 Adding medicine with data:', {
          pharmacyId: effectivePharmacyId,
          pharmacyName: user.pharmacyName,
          data
        });
        
        const pharmacyName = user.pharmacyName || 'صيدلية';
        const medicine = await createMedicine(data, effectivePharmacyId, pharmacyName);
        
        console.log('✅ Medicine added successfully:', medicine);
        toast.success('تم إضافة الدواء بنجاح وهو في انتظار المراجعة');
        return medicine;
      } catch (err) {
        const error = err as Error;
        console.error('❌ Error adding medicine:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        
        // رسائل خطأ أكثر وضوحاً
        if (error.message.includes('اسم الدواء')) {
          toast.error('اسم الدواء مطلوب (حرفين على الأقل)');
        } else if (error.message.includes('وصف الدواء')) {
          toast.error('وصف الدواء مطلوب (10 أحرف على الأقل)');
        } else if (error.message.includes('فئة الدواء')) {
          toast.error('فئة الدواء مطلوبة');
        } else if (error.message.includes('السعر')) {
          toast.error('السعر يجب أن يكون أكبر من صفر');
        } else if (error.message.includes('الكمية')) {
          toast.error('الكمية يجب أن تكون صفر أو أكثر');
        } else {
          toast.error(error.message || 'فشل في إضافة الدواء');
        }
        
        setError(error);
        return null;
      }
    },
    [pharmacyId, user, limitInfo.canAdd]
  );

  const editMedicine = useCallback(
    async (id: string, data: UpdateMedicineInput): Promise<boolean> => {
      const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
      
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
    [pharmacyId, user]
  );

  const refreshMedicines = useCallback(async () => {
    const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
    
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
  }, [pharmacyId, user]);

  const checkCanAdd = useCallback(async (): Promise<boolean> => {
    const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
    
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
  }, [pharmacyId, user]);

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
