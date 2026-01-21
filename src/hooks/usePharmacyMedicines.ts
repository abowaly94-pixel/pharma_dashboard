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
  deleteMedicine,
  getMedicinesGroupedByStatus,
  canPharmacyAddMedicine,
} from '@/services/medicineService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LimitInfo {
  canAdd: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  message?: string;
}

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
  limitInfo: LimitInfo;
  addMedicine: (data: CreateMedicineInput) => Promise<MedicineWithApproval | null>;
  editMedicine: (id: string, data: UpdateMedicineInput) => Promise<boolean>;
  deleteMedicine: (id: string) => Promise<boolean>;
  refreshMedicines: () => Promise<void>;
  checkCanAdd: () => Promise<boolean>;
}

export function usePharmacyMedicines(pharmacyId?: string): UsePharmacyMedicinesReturn {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<MedicineWithApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [limitInfo, setLimitInfo] = useState<LimitInfo>({
    canAdd: true,
    currentCount: 0,
    limit: 0, // Start with 0 to indicate not loaded yet
    remaining: 0,
    message: undefined,
  });

  // Real-time listener for pharmacy medicines from both collections
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

    console.log('🔍 Setting up real-time listeners for pharmacyId:', effectivePharmacyIdNumber, {
      user: user ? { uid: user.uid, role: user.role, pharmacyId: user.pharmacyId } : null
    });
    setIsLoading(true);
    setError(null); // Clear any previous errors

    // Query for approved medicines from 'medicines' collection
    const approvedQuery = query(
      collection(db, 'medicines'),
      where('pharmacyId', '==', effectivePharmacyIdNumber),
      where('deleted', '==', false)
    );

    // Query for pending/rejected medicines from 'pending_medicines' collection
    const pendingQuery = query(
      collection(db, 'pending_medicines'),
      where('pharmacyId', '==', effectivePharmacyIdNumber),
      where('deleted', '==', false)
    );

    let approvedMedicines: MedicineWithApproval[] = [];
    let pendingMedicines: MedicineWithApproval[] = [];
    let approvedLoaded = false;
    let pendingLoaded = false;

    const updateMedicinesList = () => {
      if (approvedLoaded && pendingLoaded) {
        const allMedicines = [...approvedMedicines, ...pendingMedicines];
        allMedicines.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        console.log('✅ Setting medicines state:', allMedicines.length, 'medicines (approved:', approvedMedicines.length, ', pending/rejected:', pendingMedicines.length, ')');
        setMedicines(allMedicines);
        setIsLoading(false);
      }
    };

    const mapDocToMedicine = (doc: any): MedicineWithApproval => {
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
        subabaseImageUrl: data.subabaseImageUrl || data.subabaseORImageUrl || '',
        subabaseORImageUrl: data.subabaseORImageUrl || data.subabaseImageUrl || '',
        pharmacyId: data.pharmacyId,
        pharmacyName: data.pharmacyName,
        pharmcyAddress: data.pharmcyAddress || '',
        status: data.status || 'pending',
        rejectionNotes: data.rejectionNotes || null,
        reviewedBy: data.reviewedBy || null,
        reviewedAt: data.reviewedAt?.toDate() || null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    };

    // Listen to approved medicines
    const unsubscribeApproved = onSnapshot(
      approvedQuery,
      (snapshot) => {
        console.log('📦 Received approved medicines update:', snapshot.docs.length, 'medicines');
        approvedMedicines = snapshot.docs.map(mapDocToMedicine);
        approvedLoaded = true;
        updateMedicinesList();
      },
      (err) => {
        console.error('❌ Error listening to approved medicines:', err);
        setError(err as Error);
        approvedLoaded = true;
        updateMedicinesList();
      }
    );

    // Listen to pending/rejected medicines
    const unsubscribePending = onSnapshot(
      pendingQuery,
      (snapshot) => {
        console.log('📦 Received pending medicines update:', snapshot.docs.length, 'medicines');
        pendingMedicines = snapshot.docs.map(mapDocToMedicine);
        pendingLoaded = true;
        updateMedicinesList();
      },
      (err) => {
        console.error('❌ Error listening to pending medicines:', err);
        setError(err as Error);
        pendingLoaded = true;
        updateMedicinesList();
      }
    );

    return () => {
      unsubscribeApproved();
      unsubscribePending();
    };
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
        message: 'لم يتم تحديد الصيدلية',
      });
      return;
    }

    const updateLimitInfo = async () => {
      try {
        console.log('🔍 Checking limit for pharmacy:', effectivePharmacyId);
        console.log('📊 Current medicines in state:', medicines.length);
        console.log('📋 Medicines breakdown:', {
          pending: medicines.filter(m => m.status === 'pending').length,
          approved: medicines.filter(m => m.status === 'approved').length,
          rejected: medicines.filter(m => m.status === 'rejected').length,
        });
        
        const info = await canPharmacyAddMedicine(effectivePharmacyId);
        const remaining = Math.max(0, info.limit - info.currentCount);
        
        console.log('✅ Limit info received:', {
          canAdd: info.canAdd,
          currentCount: info.currentCount,
          limit: info.limit,
          remaining,
          message: info.message,
        });
        
        setLimitInfo({
          canAdd: info.canAdd,
          currentCount: info.currentCount,
          limit: info.limit,
          remaining,
          message: info.message,
        });
      } catch (err) {
        console.error('Error fetching limit info:', err);
        // On error, set reasonable defaults but don't show fake numbers
        setLimitInfo({
          canAdd: false,
          currentCount: medicines.length,
          limit: 0,
          remaining: 0,
          message: 'حدث خطأ في جلب معلومات الحد',
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
        const errorMsg = limitInfo.message || 'تم الوصول للحد الأقصى من الأدوية المسموح بها';
        toast.error(errorMsg);
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

  const deleteMedicineHandler = useCallback(
    async (id: string): Promise<boolean> => {
      const effectivePharmacyId = pharmacyId || user?.pharmacyId?.toString();
      
      if (!effectivePharmacyId) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      try {
        await deleteMedicine(id, effectivePharmacyId);
        toast.success('تم حذف الدواء والصورة بنجاح');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في حذف الدواء');
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
      const remaining = Math.max(0, info.limit - info.currentCount);
      setLimitInfo({
        canAdd: info.canAdd,
        currentCount: info.currentCount,
        limit: info.limit,
        remaining,
        message: info.message,
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
    deleteMedicine: deleteMedicineHandler,
    refreshMedicines,
    checkCanAdd,
  };
}
