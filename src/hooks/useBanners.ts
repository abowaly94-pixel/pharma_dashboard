import { useState, useEffect, useCallback } from 'react';
import { Banner } from '@/types';
import { bannerService } from '@/services/bannerService';
import { toast } from 'sonner';

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBanners = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await bannerService.getAllBanners();
      setBanners(data);
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError(err.message || 'فشل في تحميل البانرات');
      toast.error('حدث خطأ أثناء تحميل البانرات الإعلانية');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const addBanner = async (bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const id = await bannerService.addBanner(bannerData);
      toast.success('تم إضافة البانر الإعلاني بنجاح');
      await fetchBanners();
      return id;
    } catch (err: any) {
      toast.error(err.message || 'فشل في إضافة البانر');
      throw err;
    }
  };

  const updateBanner = async (id: string, bannerData: Partial<Banner>) => {
    try {
      await bannerService.updateBanner(id, bannerData);
      toast.success('تم تحديث بيانات البانر بنجاح');
      await fetchBanners();
    } catch (err: any) {
      toast.error(err.message || 'فشل في تحديث البانر');
      throw err;
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await bannerService.deleteBanner(id);
      toast.success('تم حذف البانر بنجاح');
      await fetchBanners();
    } catch (err: any) {
      toast.error(err.message || 'فشل في حذف البانر');
      throw err;
    }
  };

  const toggleBannerStatus = async (id: string, currentStatus: boolean) => {
    try {
      await bannerService.toggleBannerStatus(id, currentStatus);
      toast.success(currentStatus ? 'تم إخفاء البانر' : 'تم تفعيل البانر');
      await fetchBanners();
    } catch (err: any) {
      toast.error('فشل في تغيير حالة البانر');
      throw err;
    }
  };

  const seedInitialBanners = async () => {
    try {
      setIsLoading(true);
      await bannerService.seedInitialBanners();
      toast.success('تم إضافة البانرات الافتراضية بنجاح!');
      await fetchBanners();
    } catch (err: any) {
      toast.error('فشل في إضافة البانرات الافتراضية');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    banners,
    isLoading,
    error,
    refreshBanners: fetchBanners,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    seedInitialBanners,
  };
}
