import { useState, useEffect } from 'react';
import { Section } from '@/types';
import { sectionService } from '@/services/sectionService';
import { toast } from 'sonner';

export const useSections = (activeOnly: boolean = false) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = activeOnly 
        ? await sectionService.getActiveSections()
        : await sectionService.getAllSections();
      setSections(data);
    } catch (err) {
      const errorMessage = 'فشل في تحميل الأقسام';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching sections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [activeOnly]);

  const addSection = async (sectionData: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await sectionService.addSection(sectionData);
      toast.success('تم إضافة القسم بنجاح');
      await fetchSections();
    } catch (err) {
      toast.error('فشل في إضافة القسم');
      throw err;
    }
  };

  const updateSection = async (id: string, sectionData: Partial<Section>) => {
    try {
      await sectionService.updateSection(id, sectionData);
      toast.success('تم تحديث القسم بنجاح');
      await fetchSections();
    } catch (err) {
      toast.error('فشل في تحديث القسم');
      throw err;
    }
  };

  const deleteSection = async (id: string) => {
    try {
      await sectionService.deleteSection(id);
      toast.success('تم حذف القسم بنجاح');
      await fetchSections();
    } catch (err) {
      toast.error('فشل في حذف القسم');
      throw err;
    }
  };

  const toggleSectionStatus = async (id: string, isActive: boolean) => {
    try {
      await sectionService.toggleSectionStatus(id, isActive);
      toast.success(isActive ? 'تم تفعيل القسم' : 'تم إلغاء تفعيل القسم');
      await fetchSections();
    } catch (err) {
      toast.error('فشل في تغيير حالة القسم');
      throw err;
    }
  };

  return {
    sections,
    isLoading,
    error,
    addSection,
    updateSection,
    deleteSection,
    toggleSectionStatus,
    refreshSections: fetchSections,
  };
};
