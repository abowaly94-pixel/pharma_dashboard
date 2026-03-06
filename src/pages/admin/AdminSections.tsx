import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Package, Eye, EyeOff, Image as ImageIcon, RefreshCw, Database } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSections } from '@/hooks/useSections';
import { Section } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { uploadImageToSupabase, deleteImageFromSupabase, removeImageBackground } from '@/lib/supabase';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { SafeImage } from '@/components/ui/safe-image';
import { updateSectionMedicinesImages } from '@/utils/updateMedicineSectionImages';
import { sectionService } from '@/services/sectionService';

export default function AdminSections() {
  const { sections, isLoading, addSection, updateSection, deleteSection, toggleSectionStatus } = useSections();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    imageUrl: '',
    originalImageUrl: '',
    isActive: true,
  });

  const handleOpenDialog = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        name: section.name,
        nameEn: section.nameEn || '',
        imageUrl: (section as any).sectionImageUrl || '',
        originalImageUrl: (section as any).originalImageUrl || '',
        isActive: section.isActive,
      });
    } else {
      setEditingSection(null);
      setFormData({
        name: '',
        nameEn: '',
        imageUrl: '',
        originalImageUrl: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const originalSize = formatFileSize(file.size);
    toast.info(`جاري ضغط ورفع الصورة... (${originalSize})`);

    try {
      // ضغط الصورة أولاً
      const compressedFile = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85,
        maxSizeMB: 0.5,
      });

      const compressedSize = formatFileSize(compressedFile.size);
      const savings = Math.round((1 - compressedFile.size / file.size) * 100);

      if (savings > 10) {
        toast.success(`تم ضغط الصورة بنجاح! (${originalSize} → ${compressedSize})`);
      }

      // رفع الصورة المضغوطة
      const result = await uploadImageToSupabase(compressedFile);

      if (result.success && result.url) {
        setFormData({ ...formData, imageUrl: result.url, originalImageUrl: '' });
        toast.success('تم رفع الصورة بنجاح!');
      } else {
        toast.error(result.error || 'فشل رفع الصورة');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveBackground = async () => {
    if (!formData.imageUrl) {
      toast.error('لا توجد صورة لإزالة الخلفية منها');
      return;
    }

    setIsRemovingBg(true);
    toast.info('جاري إزالة الخلفية... قد يستغرق بضع ثوانٍ');

    try {
      const result = await removeImageBackground(formData.imageUrl);

      if (!result.success || !result.blob) {
        toast.error(result.error || 'فشل إزالة الخلفية');
        setIsRemovingBg(false);
        return;
      }

      const file = new File([result.blob], 'section-no-bg.png', { type: 'image/png' });
      const currentImageUrl = formData.imageUrl;
      const originalImageUrl = formData.originalImageUrl;

      // حذف الصورة الحالية إذا كانت من Supabase
      if (currentImageUrl.includes('supabase.co/storage')) {
        const deleteResult = await deleteImageFromSupabase(currentImageUrl);
        if (deleteResult.success) {
          toast.success('تم حذف الصورة القديمة');
        }
      }

      // ضغط الصورة المعالجة
      const compressedFile = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.95,
        maxSizeMB: 0.15,
      });

      const uploadResult = await uploadImageToSupabase(compressedFile);

      if (uploadResult.success && uploadResult.url) {
        const savedOriginalUrl = originalImageUrl || 
          (!currentImageUrl.includes('supabase.co/storage') ? currentImageUrl : '');

        setFormData({
          ...formData,
          imageUrl: uploadResult.url,
          originalImageUrl: savedOriginalUrl
        });

        toast.success('تم إزالة الخلفية بنجاح!');
      } else {
        toast.error(uploadResult.error || 'فشل رفع الصورة المعالجة');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('حدث خطأ أثناء إزالة الخلفية');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.imageUrl) return;

    if (window.confirm('هل تريد مسح الصورة؟')) {
      const imageUrl = formData.imageUrl;
      const originalImageUrl = formData.originalImageUrl;
      const isSupabaseImage = imageUrl.includes('supabase.co/storage');
      const hasOriginal = originalImageUrl && originalImageUrl !== imageUrl;

      if (isSupabaseImage) {
        const result = await deleteImageFromSupabase(imageUrl);
        if (result.success) {
          toast.success('تم حذف الصورة');
        }
      }

      if (hasOriginal && originalImageUrl.includes('supabase.co/storage')) {
        await deleteImageFromSupabase(originalImageUrl);
      }

      // إذا كان هناك صورة أصلية من الإنترنت، ارجع لها
      if (hasOriginal && !originalImageUrl.includes('supabase.co/storage')) {
        setFormData({ ...formData, imageUrl: originalImageUrl, originalImageUrl: '' });
      } else {
        setFormData({ ...formData, imageUrl: '', originalImageUrl: '' });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('يجب إدخال اسم القسم بالعربي');
      return;
    }

    if (!formData.nameEn.trim()) {
      toast.error('يجب إدخال اسم القسم بالإنجليزي');
      return;
    }

    if (!formData.imageUrl.trim()) {
      toast.error('يجب رفع صورة للقسم');
      return;
    }

    try {
      const sectionData = {
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim(),
        sectionImageUrl: formData.imageUrl, // حفظ رابط الصورة
        originalImageUrl: formData.originalImageUrl, // حفظ الصورة الأصلية
        isActive: formData.isActive,
      };

      if (editingSection) {
        await updateSection(editingSection.id, sectionData);
      } else {
        await addSection(sectionData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيؤثر ذلك على جميع الفئات المرتبطة به.')) {
      try {
        await deleteSection(id);
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSectionStatus(id, !currentStatus);
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleSyncSectionImages = async (sectionId: string, sectionName: string) => {
    if (!window.confirm(`هل تريد تحديث صور جميع الأدوية في قسم "${sectionName}"؟`)) {
      return;
    }

    const loadingToast = toast.loading('جاري تحديث صور الأدوية...');
    
    try {
      const result = await updateSectionMedicinesImages(sectionId);
      toast.dismiss(loadingToast);
      
      if (result.updated > 0) {
        toast.success(`تم تحديث ${result.updated} دواء بنجاح!`);
      } else {
        toast.info('لا توجد أدوية تحتاج للتحديث');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('فشل تحديث صور الأدوية');
      console.error('Error syncing section images:', error);
    }
  };

  const handleSyncAllSectionsToList = async () => {
    if (!window.confirm('هل تريد مزامنة جميع الأقسام إلى sections_list؟\nهذا سيسهل استدعاء الأقسام من تطبيق Flutter.')) {
      return;
    }

    const loadingToast = toast.loading('جاري مزامنة الأقسام...');
    
    try {
      const result = await sectionService.syncAllSectionsToList();
      toast.dismiss(loadingToast);
      
      if (result.success > 0) {
        toast.success(`تم مزامنة ${result.success} قسم بنجاح! ${result.failed > 0 ? `فشل ${result.failed}` : ''}`);
      } else {
        toast.error('فشلت المزامنة');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('حدث خطأ أثناء المزامنة');
      console.error('Error syncing sections:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold font-cairo">إدارة الأقسام</h1>
            <p className="text-muted-foreground">
              إدارة أقسام المنتجات الرئيسية ({sections.length} قسم)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleSyncAllSectionsToList} 
              variant="outline"
              className="font-cairo"
              title="مزامنة جميع الأقسام إلى sections_list للاستدعاء السهل من Flutter"
            >
              <Database className="w-4 h-4 ml-2" />
              مزامنة للـ Flutter
            </Button>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground font-cairo">
              <Plus className="w-5 h-5 ml-2" />
              إضافة قسم جديد
            </Button>
          </div>
        </motion.div>

        {/* Sections Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              جاري تحميل الأقسام...
            </div>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد أقسام</h3>
            <p className="text-muted-foreground">ابدأ بإضافة قسم جديد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300"
              >
                {/* Section Image */}
                {(section as any).sectionImageUrl && (
                  <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                    <SafeImage
                      src={(section as any).sectionImageUrl}
                      alt={section.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{section.name}</h3>
                      {section.nameEn && (
                        <p className="text-xs text-gray-500">{section.nameEn}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={section.isActive ? 'default' : 'secondary'}>
                    {section.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleOpenDialog(section)}
                  >
                    <Edit className="w-3 h-3 ml-1" />
                    تعديل
                  </Button>
                  {(section as any).sectionImageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleSyncSectionImages(section.id, section.name)}
                      title="تحديث صور الأدوية"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleStatus(section.id, section.isActive)}
                  >
                    {section.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(section.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo text-lg">
                {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-cairo text-sm">اسم القسم بالعربي *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: أدوية"
                  className="h-10"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn" className="font-cairo text-sm">اسم القسم بالإنجليزي *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                  placeholder="Example: Medicines"
                  className="h-10"
                  dir="ltr"
                />
              </div>

              {/* Image Upload Section */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Label className="font-cairo text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  صورة القسم *
                </Label>

                <label
                  htmlFor="section-image-upload"
                  className={`
                    flex items-center justify-center gap-2 h-10 px-4 rounded-lg border-2 border-dashed
                    transition-all cursor-pointer font-cairo text-sm font-medium
                    ${isUploading ? 'bg-gray-100 border-gray-300 cursor-not-allowed' : 
                      formData.imageUrl ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' : 
                      'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:bg-blue-50'}
                  `}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري الرفع...</span>
                    </>
                  ) : formData.imageUrl ? (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>يوجد صورة - احذفها للتغيير</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      <span>رفع صورة</span>
                    </>
                  )}
                  <input
                    id="section-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading || !!formData.imageUrl}
                    className="hidden"
                  />
                </label>

                {/* URL Input - Hidden if image is from Supabase */}
                {!formData.imageUrl.includes('supabase.co/storage') && !formData.imageUrl && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400 font-cairo">أو</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <Input
                      type="url"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="رابط صورة من الإنترنت"
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400"
                    />
                  </>
                )}

                {/* Image Preview */}
                {formData.imageUrl && (
                  <div className="space-y-2">
                    <div className="relative w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-white">
                      <SafeImage
                        src={formData.imageUrl}
                        alt="معاينة صورة القسم"
                        className="w-full h-full object-contain p-3"
                      />
                      <div className="absolute top-2 right-2 flex gap-1.5">
                        {!(formData.originalImageUrl && formData.originalImageUrl !== formData.imageUrl) && (
                          <button
                            type="button"
                            onClick={handleRemoveBackground}
                            disabled={isRemovingBg}
                            className="px-3 h-7 bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 text-white rounded text-xs font-cairo"
                          >
                            {isRemovingBg ? 'جاري...' : 'حذف الخلفية'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleDeleteImage}
                          className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <Label htmlFor="isActive" className="font-cairo text-sm cursor-pointer">
                  قسم نشط
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="font-cairo"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.imageUrl}
                  title={!formData.imageUrl ? 'يجب رفع صورة للقسم أولاً' : ''}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingSection ? '💾 حفظ التعديلات' : '➕ إضافة القسم'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
