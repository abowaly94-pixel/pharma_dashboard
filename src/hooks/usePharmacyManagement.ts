/**
 * Hook لإدارة الصيدليات
 * Pharmacy Management Hook
 * 
 * Requirements: 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  PharmacyAccount,
  PharmacyStatus,
  CreatePharmacyInput,
  PharmacyFilters,
} from '@/types';
import {
  createPharmacy,
  getPharmacies,
  updatePharmacyStatus,
  updateMedicineLimit,
  updatePharmacy,
  getPharmacyStats,
  sendPharmacyPasswordReset,
  deletePharmacyPermanently,
} from '@/services/pharmacyService';
import { getArabicErrorMessage } from '@/types/errors';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UsePharmacyManagementReturn {
  pharmacies: PharmacyAccount[];
  filteredPharmacies: PharmacyAccount[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  filters: PharmacyFilters;
  setFilters: (filters: PharmacyFilters) => void;
  createNewPharmacy: (data: CreatePharmacyInput) => Promise<PharmacyAccount | null>;
  changePharmacyStatus: (id: string, status: PharmacyStatus) => Promise<boolean>;
  changeMedicineLimit: (id: string, limit: number) => Promise<boolean>;
  updatePharmacyData: (id: string, data: Partial<CreatePharmacyInput>) => Promise<boolean>;
  resetPharmacyPassword: (email: string) => Promise<boolean>;
  deletePharmacy: (id: string) => Promise<{ success: boolean; deletedMedicinesCount: number; deletedPendingCount: number } | null>;
  refreshPharmacies: () => Promise<void>;
}

export function usePharmacyManagement(): UsePharmacyManagementReturn {
  const { user } = useAuth();
  const [pharmacies, setPharmacies] = useState<PharmacyAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<PharmacyFilters>({
    status: 'all',
    searchQuery: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  });

  // Real-time listener for pharmacies
  useEffect(() => {
    const q = query(
      collection(db, 'pharmacies'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const pharmacyList: PharmacyAccount[] = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Calculate actual medicine count from both collections
            const pharmacyIdNum = data.pharmacyId;
            let actualCount = data.currentMedicineCount || 0;
            
            // Only recalculate if there's a mismatch indicator or for accuracy
            try {
              // Count from medicines collection (approved)
              const approvedQuery = query(
                collection(db, 'medicines'),
                where('pharmacyId', '==', pharmacyIdNum),
                where('deleted', '==', false)
              );
              
              // Count from pending_medicines collection (pending/rejected)
              const pendingQuery = query(
                collection(db, 'pending_medicines'),
                where('pharmacyId', '==', pharmacyIdNum),
                where('deleted', '==', false)
              );
              
              const [approvedSnapshot, pendingSnapshot] = await Promise.all([
                getDocs(approvedQuery),
                getDocs(pendingQuery)
              ]);
              
              actualCount = approvedSnapshot.docs.length + pendingSnapshot.docs.length;
              
              // Log the actual count for debugging
              console.log(`📊 Pharmacy: ${data.name} (ID: ${pharmacyIdNum})`, {
                stored: data.currentMedicineCount || 0,
                actual: actualCount,
                approved: approvedSnapshot.docs.length,
                pending: pendingSnapshot.docs.length,
                approvedIds: approvedSnapshot.docs.map(d => ({ id: d.id, name: d.data().name })),
                pendingIds: pendingSnapshot.docs.map(d => ({ id: d.id, name: d.data().name, status: d.data().status })),
              });
              
              // Log if there's a mismatch
              if (actualCount !== (data.currentMedicineCount || 0)) {
                console.warn(`⚠️ Medicine count mismatch for ${data.name}:`, {
                  stored: data.currentMedicineCount,
                  actual: actualCount,
                  difference: actualCount - (data.currentMedicineCount || 0),
                });
              }
            } catch (error) {
              console.error('Error calculating medicine count:', error);
            }
            
            return {
              id: doc.id,
              pharmacyId: data.pharmacyId,
              name: data.name,
              email: data.email,
              address: data.address,
              city: data.city,
              phoneNumber: data.phoneNumber,
              ownerName: data.ownerName,
              licenseNumber: data.licenseNumber,
              status: data.status || 'inactive',
              medicineLimit: data.medicineLimit || 100,
              currentMedicineCount: actualCount, // Use actual count
              emailVerified: data.emailVerified || false,
              failedLoginAttempts: data.failedLoginAttempts || 0,
              lockedUntil: data.lockedUntil?.toDate() || null,
              rating: data.rating || 0,
              totalOrders: data.totalOrders || 0,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              createdBy: data.createdBy || '',
              street: data.street || '',
              governorate: data.governorate || '',
              postalCode: data.postalCode || '',
            };
          })
        );

        setPharmacies(pharmacyList);
        
        // Update stats
        setStats({
          total: pharmacyList.length,
          active: pharmacyList.filter(p => p.status === 'active').length,
          inactive: pharmacyList.filter(p => p.status === 'inactive').length,
          suspended: pharmacyList.filter(p => p.status === 'suspended').length,
        });
        
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to pharmacies:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter pharmacies based on current filters
  const filteredPharmacies = pharmacies.filter((pharmacy) => {
    // Status filter
    if (filters.status && filters.status !== 'all' && pharmacy.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.searchQuery) {
      const search = filters.searchQuery.toLowerCase();
      const matchesSearch =
        pharmacy.name.toLowerCase().includes(search) ||
        pharmacy.email.toLowerCase().includes(search) ||
        pharmacy.ownerName.toLowerCase().includes(search) ||
        pharmacy.city.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const createNewPharmacy = useCallback(
    async (data: CreatePharmacyInput): Promise<PharmacyAccount | null> => {
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      try {
        setIsLoading(true);
        const pharmacy = await createPharmacy(data, user.uid);
        
        toast.success('تم إنشاء الصيدلية بنجاح ✅');
        return pharmacy;
      } catch (err) {
        const errorMessage = getArabicErrorMessage(err);
        console.error('❌ Error creating pharmacy:', err);
        toast.error(errorMessage);
        setError(err as Error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const changePharmacyStatus = useCallback(
    async (id: string, status: PharmacyStatus): Promise<boolean> => {
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      try {
        const pharmacy = pharmacies.find(p => p.id === id);
        const oldStatus = pharmacy?.status || 'inactive';
        
        await updatePharmacyStatus(id, status);
        
        const statusMessages = {
          active: 'تم تفعيل الصيدلية',
          inactive: 'تم إلغاء تفعيل الصيدلية',
          suspended: 'تم تعليق الصيدلية',
        };
        toast.success(statusMessages[status]);
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في تحديث حالة الصيدلية');
        return false;
      }
    },
    [user, pharmacies]
  );

  const changeMedicineLimit = useCallback(
    async (id: string, limit: number): Promise<boolean> => {
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return false;
      }

      try {
        const pharmacy = pharmacies.find(p => p.id === id);
        const oldLimit = pharmacy?.medicineLimit || 100;
        
        await updateMedicineLimit(id, limit);
        
        toast.success('تم تحديث حد الأدوية');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في تحديث حد الأدوية');
        return false;
      }
    },
    [user, pharmacies]
  );

  const updatePharmacyData = useCallback(
    async (id: string, data: Partial<CreatePharmacyInput>): Promise<boolean> => {
      try {
        await updatePharmacy(id, data);
        toast.success('تم تحديث بيانات الصيدلية');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في تحديث الصيدلية');
        return false;
      }
    },
    []
  );

  const resetPharmacyPassword = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        await sendPharmacyPasswordReset(email);
        toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني');
        return true;
      } catch (err) {
        const error = err as Error;
        toast.error(error.message || 'فشل في إرسال رابط إعادة تعيين كلمة المرور');
        return false;
      }
    },
    []
  );

  const deletePharmacy = useCallback(
    async (id: string): Promise<{ success: boolean; deletedMedicinesCount: number; deletedPendingCount: number } | null> => {
      if (!user) {
        toast.error('يجب تسجيل الدخول أولاً');
        return null;
      }

      try {
        console.log('🗑️ Starting pharmacy deletion for ID:', id);
        const result = await deletePharmacyPermanently(id);
        console.log('✅ Deletion result:', result);
        
        const totalDeleted = result.deletedMedicinesCount + result.deletedPendingCount;
        toast.success(`تم حذف الصيدلية نهائياً مع ${totalDeleted} دواء`);
        return result;
      } catch (err) {
        const error = err as Error;
        console.error('❌ Error deleting pharmacy:', error);
        toast.error(error.message || 'فشل في حذف الصيدلية');
        return null;
      }
    },
    [user]
  );

  const refreshPharmacies = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPharmacies(filters);
      setPharmacies(data);
      const newStats = await getPharmacyStats();
      setStats(newStats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    pharmacies,
    filteredPharmacies,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    createNewPharmacy,
    changePharmacyStatus,
    changeMedicineLimit,
    updatePharmacyData,
    resetPharmacyPassword,
    deletePharmacy,
    refreshPharmacies,
  };
}
