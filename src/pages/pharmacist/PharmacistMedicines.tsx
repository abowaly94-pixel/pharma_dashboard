import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  Image as ImageIcon,
  Star,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePharmacyMedicines } from '@/hooks/usePharmacyMedicines';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
import { MedicineWithApproval } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deleteImageFromSupabase, uploadImageToSupabase, removeImageBackground } from '@/lib/supabase';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { toast } from 'sonner';

export default function PharmacistMedicines() {
  const { user } = useAuth();
  const {
    medicines,
    stats: medicineStats,
    limitInfo,
    isLoading,
    error,
    addMedicine: addMedicineFromHook,
    editMedicine,
    deleteMedicine: deleteMedicineFromHook,
    checkCanAdd,
  } = usePharmacyMedicines(user?.pharmacyId?.toString());

  const { notifyNewMedicine, notifyLowStock } = useAutoNotifications();

  console.log('🏥 PharmacistMedicines Component:', {
    userEmail: user?.email,
    pharmacyId: user?.pharmacyId,
    medicinesCount: medicines.length,
    isLoading,
    error: error?.message,
    medicines: medicines.map(m => ({ id: m.id, name: m.name, status: m.status }))
  });

  // Check if address is complete
  const isAddressComplete = true;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineWithApproval | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false); // حماية إضافية من race conditions
  const [imageLoadError, setImageLoadError] = useState(false); // جديد: لتتبع فشل تحميل الصورة
  const [uploadedImagesInSession, setUploadedImagesInSession] = useState<string[]>([]); // تتبع الصور المرفوعة في الجلسة الحالية
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    quantity: 0,
    category: '',
    manufacturer: '',
    subabaseImageUrl: '',
    subabaseORImageUrl: '', // الصورة الأصلية قبل إزالة الخلفية
    avgRating: 0,
    ratingCount: 0,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 0,
  });

  // Restore dialog state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('pharmacist_medicine_dialog_state');
    if (savedState) {
      try {
        const { isOpen, formData: savedFormData, editingMedicineId } = JSON.parse(savedState);
        if (isOpen) {
          setIsAddEditDialogOpen(true);
          setFormData(savedFormData);

          // If editing, find the medicine by ID
          if (editingMedicineId) {
            const medicine = medicines.find(m => m.id === editingMedicineId);
            if (medicine) {
              setEditingMedicine(medicine);
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore dialog state:', error);
        localStorage.removeItem('pharmacist_medicine_dialog_state');
      }
    }
  }, [medicines]);

  // Save dialog state to localStorage whenever it changes
  useEffect(() => {
    if (isAddEditDialogOpen) {
      const stateToSave = {
        isOpen: true,
        formData,
        editingMedicineId: editingMedicine?.id || null,
      };
      localStorage.setItem('pharmacist_medicine_dialog_state', JSON.stringify(stateToSave));
    } else {
      localStorage.removeItem('pharmacist_medicine_dialog_state');
    }
  }, [isAddEditDialogOpen, formData, editingMedicine]);

  const filteredMedicines = medicines.filter(medicine => {
    // Filter by search query
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (medicine.code && medicine.code.includes(searchQuery));

    // Filter by status
    const matchesStatus = statusFilter === 'all' || medicine.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleOpenAddEdit = (medicine?: MedicineWithApproval) => {
    // Reset image error state
    setImageLoadError(false);
    // Reset uploaded images tracker
    setUploadedImagesInSession([]);

    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        name: medicine.name,
        code: medicine.code,
        description: medicine.description,
        price: medicine.price,
        quantity: medicine.quantity,
        category: medicine.category || '',
        manufacturer: medicine.manufacturer || '',
        subabaseImageUrl: medicine.subabaseImageUrl || medicine.subabaseORImageUrl || '',
        subabaseORImageUrl: medicine.subabaseORImageUrl || '',
        avgRating: medicine.avgRating || 0,
        ratingCount: medicine.ratingCount || 0,
        discountRating: medicine.discountRating || 0,
        isNewProduct: medicine.isNewProduct || false,
        sellingCount: medicine.sellingCount || 0,
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        name: '',
        code: `MED-${Date.now()}`,
        description: '',
        price: 0,
        quantity: 0,
        category: '',
        manufacturer: '',
        subabaseImageUrl: '',
        subabaseORImageUrl: '',
        avgRating: 0,
        ratingCount: 0,
        discountRating: 0,
        isNewProduct: false,
        sellingCount: 0,
      });
    }
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('📝 Form submitted with data:', formData);

    // التحقق من وجود صورة
    if (!formData.subabaseImageUrl || formData.subabaseImageUrl.trim() === '') {
      toast.error('يجب رفع صورة للدواء قبل الحفظ');
      return;
    }

    // التحقق من البيانات المطلوبة
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error('اسم الدواء مطلوب (حرفين على الأقل)');
      return;
    }

    if (!formData.description || formData.description.trim().length < 10) {
      toast.error('وصف الدواء مطلوب (10 أحرف على الأقل)');
      return;
    }

    if (formData.price <= 0) {
      toast.error('السعر يجب أن يكون أكبر من صفر');
      return;
    }

    if (formData.quantity < 0) {
      toast.error('الكمية يجب أن تكون صفر أو أكثر');
      return;
    }

    // منع الإرسال المتكرر (بعد التحقق من البيانات)
    if (isSaving || savingRef.current) {
      toast.warning('جاري الحفظ... الرجاء الانتظار');
      return;
    }

    console.log('✅ All validations passed');

    setIsSaving(true);
    savingRef.current = true; // حماية فورية

    try {
      // إذا كان تعديل وتم تغيير الصورة، احذف الصورة القديمة من Supabase
      if (editingMedicine) {
        const oldImageUrl = (editingMedicine as any)?.subabaseImageUrl || editingMedicine?.subabaseORImageUrl;
        const newImageUrl = formData.subabaseImageUrl;

        // احذف الصورة القديمة إذا:
        // 1. كانت موجودة
        // 2. تم تغييرها (الصورة الجديدة مختلفة)
        // 3. الصورة القديمة من Supabase (تحتوي على supabase.co)
        if (oldImageUrl && oldImageUrl !== newImageUrl && oldImageUrl.includes('supabase.co/storage')) {
          console.log('🗑️ حذف الصورة القديمة من Supabase:', oldImageUrl);
          toast.info('جاري حذف الصورة القديمة...');

          const deleteResult = await deleteImageFromSupabase(oldImageUrl);

          if (deleteResult.success) {
            console.log('✅ تم حذف الصورة القديمة بنجاح');
            toast.success('تم حذف الصورة القديمة من التخزين');
          } else {
            console.warn('⚠️ فشل حذف الصورة القديمة:', deleteResult.error);
            // نكمل الحفظ حتى لو فشل حذف الصورة القديمة
          }
        }
      }

      const dataToSave = {
        name: formData.name.trim(),
        code: formData.code,
        description: formData.description.trim(),
        price: formData.price,
        quantity: formData.quantity,
        category: formData.category.trim(),
        manufacturer: formData.manufacturer.trim(),
        subabaseImageUrl: formData.subabaseImageUrl,
        subabaseORImageUrl: formData.subabaseImageUrl,
        isNewProduct: formData.isNewProduct,
        discountRating: formData.discountRating,
        expiryDate: new Date(),
      };

      console.log('💾 Saving medicine:', dataToSave);

      if (editingMedicine) {
        const success = await editMedicine(editingMedicine.id, dataToSave);
        if (success) {
          setIsAddEditDialogOpen(false);
          toast.success('تم تحديث الدواء بنجاح');
          // Check for low stock notification
          if (dataToSave.quantity > 0 && dataToSave.quantity <= 5) {
            await notifyLowStock(dataToSave.name, dataToSave.quantity, user?.pharmacyId?.toString() || "");
          }
        }
      } else {
        const newMedicine = await addMedicineFromHook(dataToSave);
        console.log('🎉 Medicine creation result:', newMedicine);
        if (newMedicine) {
          setIsAddEditDialogOpen(false);
          toast.success('تم إضافة الدواء بنجاح');
          // Notify admin about new medicine
          await notifyNewMedicine(dataToSave.name, user?.pharmacyName || "صيدلية");

          // Check if initially added with low stock
          if (dataToSave.quantity > 0 && dataToSave.quantity <= 5) {
            await notifyLowStock(dataToSave.name, dataToSave.quantity, user?.pharmacyId?.toString() || "");
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in handleSubmit:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
      savingRef.current = false; // إعادة تعيين الحماية
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟ سيتم حذف الصورة أيضاً من التخزين.')) {
      const success = await deleteMedicineFromHook(id);
      if (!success) {
        // Error message already shown by the hook
        console.error('Failed to delete medicine');
      }
    }
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
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeMB: 1,
      });

      const compressedSize = formatFileSize(compressedFile.size);
      const savings = Math.round((1 - compressedFile.size / file.size) * 100);

      console.log('📸 Image compression:', {
        original: originalSize,
        compressed: compressedSize,
        savings: `${savings}%`
      });

      if (savings > 10) {
        toast.success(`تم ضغط الصورة بنجاح! (${originalSize} → ${compressedSize})`);
      }

      // رفع الصورة المضغوطة
      const result = await uploadImageToSupabase(compressedFile);
      if (result.success && result.url) {
        setFormData({ ...formData, subabaseImageUrl: result.url });
        // تتبع الصورة المرفوعة حديثاً
        setUploadedImagesInSession(prev => [...prev, result.url]);
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

  // حذف الصور المرفوعة في الجلسة الحالية عند الإلغاء
  const handleCancelDialog = async () => {
    if (uploadedImagesInSession.length > 0) {
      console.log('🗑️ حذف الصور المرفوعة في الجلسة:', uploadedImagesInSession);
      toast.info('جاري حذف الصور المرفوعة...');

      for (const imageUrl of uploadedImagesInSession) {
        if (imageUrl.includes('supabase.co/storage')) {
          const result = await deleteImageFromSupabase(imageUrl);
          if (result.success) {
            console.log('✅ تم حذف الصورة:', imageUrl);
          } else {
            console.error('❌ فشل حذف الصورة:', imageUrl, result.error);
          }
        }
      }

      toast.success('تم حذف الصور المرفوعة');
    }

    setUploadedImagesInSession([]);
    setIsAddEditDialogOpen(false);
  };

  const handleRemoveBackground = async () => {
    if (!formData.subabaseImageUrl) {
      toast.error('لا توجد صورة لإزالة الخلفية منها');
      return;
    }

    setIsRemovingBg(true);
    toast.info('جاري إزالة الخلفية... قد يستغرق بضع ثوانٍ');

    try {
      console.log('🎨 بدء إزالة الخلفية للصورة:', formData.subabaseImageUrl);

      const result = await removeImageBackground(formData.subabaseImageUrl);

      if (!result.success || !result.blob) {
        console.error('❌ فشل إزالة الخلفية:', result.error);
        toast.error(result.error || 'فشل إزالة الخلفية');
        setIsRemovingBg(false);
        return;
      }

      console.log('✅ تمت إزالة الخلفية بنجاح');
      const file = new File([result.blob], 'medicine-no-bg.png', { type: 'image/png' });

      // حذف الصورة القديمة من Supabase إذا كانت موجودة
      const currentImageUrl = formData.subabaseImageUrl;
      const originalImageUrl = formData.subabaseORImageUrl;

      console.log('📋 معلومات الصور:', {
        currentImageUrl,
        originalImageUrl,
        isFromSupabase: currentImageUrl.includes('supabase.co/storage')
      });

      // احذف الصورة الحالية إذا كانت من Supabase
      // (سواء كانت معالجة سابقة أو صورة أصلية من Supabase)
      if (currentImageUrl.includes('supabase.co/storage')) {
        console.log('🗑️ حذف الصورة القديمة من Supabase:', currentImageUrl);
        toast.info('جاري حذف الصورة القديمة...');

        const deleteResult = await deleteImageFromSupabase(currentImageUrl);

        if (deleteResult.success) {
          console.log('✅ تم حذف الصورة القديمة بنجاح');
          toast.success('تم حذف الصورة القديمة');
        } else {
          console.error('❌ فشل حذف الصورة القديمة:', deleteResult.error);
          toast.warning('تحذير: فشل حذف الصورة القديمة، لكن سنكمل رفع الجديدة');
        }
      } else {
        console.log('ℹ️ الصورة الحالية ليست من Supabase، لن يتم حذفها');
      }

      // رفع الصورة الجديدة
      console.log('📤 رفع الصورة المعالجة الجديدة...');
      const originalSize = formatFileSize(file.size);
      toast.info(`جاري ضغط ورفع الصورة المعالجة... (${originalSize})`);

      // ضغط الصورة المعالجة قبل الرفع (مع الحفاظ على الشفافية)
      const compressedFile = await compressImage(file, {
        maxWidth: 800,       // أبعاد أصغر للضغط الأفضل
        maxHeight: 800,
        quality: 0.95,       // جودة عالية لـ PNG
        maxSizeMB: 0.15,     // حد أقصى 150 KB
      });

      const compressedSize = formatFileSize(compressedFile.size);
      const savings = Math.round((1 - compressedFile.size / file.size) * 100);

      console.log('📸 Background removed image compression:', {
        original: originalSize,
        compressed: compressedSize,
        savings: `${savings}%`
      });

      if (savings > 10) {
        toast.success(`تم ضغط الصورة المعالجة! (${originalSize} → ${compressedSize})`);
      }

      const uploadResult = await uploadImageToSupabase(compressedFile);

      if (uploadResult.success && uploadResult.url) {
        console.log('✅ تم رفع الصورة المعالجة بنجاح:', uploadResult.url);

        // حفظ الصورة الأصلية في subabaseORImageUrl إذا لم تكن محفوظة
        // إذا كانت الصورة الأصلية من الإنترنت (ليست من Supabase)، احتفظ بها
        const savedOriginalUrl = originalImageUrl ||
          (!currentImageUrl.includes('supabase.co/storage') ? currentImageUrl : '');

        console.log('💾 حفظ البيانات:', {
          newImageUrl: uploadResult.url,
          savedOriginalUrl
        });

        setFormData({
          ...formData,
          subabaseImageUrl: uploadResult.url,
          subabaseORImageUrl: savedOriginalUrl
        });

        // تتبع الصورة المعالجة المرفوعة حديثاً
        setUploadedImagesInSession(prev => [...prev, uploadResult.url]);

        toast.success('تم إزالة الخلفية ورفع الصورة بنجاح! 🎉\nيمكنك حذف الصورة إذا لم تعجبك');
      } else {
        console.error('❌ فشل رفع الصورة المعالجة:', uploadResult.error);
        toast.error(uploadResult.error || 'فشل رفع الصورة بعد إزالة الخلفية');
      }
    } catch (error) {
      console.error('❌ خطأ في إزالة الخلفية:', error);
      toast.error('حدث خطأ أثناء إزالة الخلفية');
    } finally {
      setIsRemovingBg(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="font-cairo text-red-700">
              <p className="font-bold mb-1">❌ حدث خطأ</p>
              <p className="text-sm">{error.message}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="mt-2 bg-white hover:bg-red-100 border-red-300 text-red-700 font-cairo font-bold"
              >
                إعادة تحميل الصفحة
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold font-cairo">أدويتي</h1>
            <p className="text-muted-foreground">إدارة أدوية الصيدلية ({medicines.length} دواء)</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenAddEdit()}
              className="gradient-primary text-primary-foreground font-cairo"
              disabled={!limitInfo.canAdd}
              title={
                !limitInfo.canAdd
                  ? (limitInfo.message || 'تم الوصول للحد الأقصى')
                  : 'إضافة دواء جديد'
              }
            >
              <Plus className="w-5 h-5 ml-2" />
              {!limitInfo.canAdd ? 'الحد الأقصى' : 'إضافة دواء جديد'}
            </Button>
          </div>
        </motion.div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('all')}
          >
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 font-cairo mb-1">إجمالي الأدوية</p>
              <p className="text-2xl font-bold">{medicines.length}</p>
              {statusFilter === 'all' && <p className="text-xs text-blue-600 font-cairo mt-1">✓ محدد</p>}
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-orange-500 shadow-lg' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('pending')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-gray-600 font-cairo">قيد المراجعة</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{medicineStats.pending}</p>
              {statusFilter === 'pending' && <p className="text-xs text-orange-600 font-cairo mt-1">✓ محدد</p>}
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'approved' ? 'ring-2 ring-green-500 shadow-lg' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('approved')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <p className="text-sm text-gray-600 font-cairo">موافق عليها</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{medicineStats.approved}</p>
              {statusFilter === 'approved' && <p className="text-xs text-green-600 font-cairo mt-1">✓ محدد</p>}
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer transition-all ${statusFilter === 'rejected' ? 'ring-2 ring-red-500 shadow-lg' : 'hover:shadow-md'}`}
            onClick={() => setStatusFilter('rejected')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <p className="text-sm text-gray-600 font-cairo">مرفوضة</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{medicineStats.rejected}</p>
              {statusFilter === 'rejected' && <p className="text-xs text-red-600 font-cairo mt-1">✓ محدد</p>}
            </CardContent>
          </Card>
        </div>

        {/* Limit Info */}
        {limitInfo && limitInfo.limit > 0 && (
          <Card className={`${!limitInfo.canAdd ? 'border-red-300 bg-red-50' : limitInfo.remaining <= 3 ? 'border-orange-300 bg-orange-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-cairo mb-1">حد الأدوية المسموح به</p>
                  <p className="text-2xl font-bold">{limitInfo.currentCount} / {limitInfo.limit}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600 font-cairo mb-1">المتبقي</p>
                  <p className={`text-2xl font-bold ${limitInfo.remaining <= 3 ? 'text-red-600' : limitInfo.remaining <= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                    {limitInfo.remaining}
                  </p>
                </div>
              </div>
              {/* رسالة تحذيرية عند اقتراب الحد */}
              {limitInfo.message && (
                <Alert className={`mt-3 ${!limitInfo.canAdd ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
                  <AlertCircle className={`w-4 h-4 ${!limitInfo.canAdd ? 'text-red-600' : 'text-orange-600'}`} />
                  <AlertDescription className={`font-cairo ${!limitInfo.canAdd ? 'text-red-700' : 'text-orange-700'}`}>
                    {limitInfo.message}
                  </AlertDescription>
                </Alert>
              )}
              {/* شريط التقدم */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${!limitInfo.canAdd ? 'bg-red-500' :
                      limitInfo.remaining <= 3 ? 'bg-orange-500' :
                        'bg-green-500'
                      }`}
                    style={{ width: `${Math.min(100, (limitInfo.currentCount / limitInfo.limit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الكود، الفئة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>

          {/* Status Filter Info */}
          {statusFilter !== 'all' && (
            <Alert className={`
              ${statusFilter === 'pending' ? 'bg-orange-50 border-orange-200' : ''}
              ${statusFilter === 'approved' ? 'bg-green-50 border-green-200' : ''}
              ${statusFilter === 'rejected' ? 'bg-red-50 border-red-200' : ''}
            `}>
              <AlertCircle className={`w-4 h-4 
                ${statusFilter === 'pending' ? 'text-orange-600' : ''}
                ${statusFilter === 'approved' ? 'text-green-600' : ''}
                ${statusFilter === 'rejected' ? 'text-red-600' : ''}
              `} />
              <AlertDescription className={`font-cairo flex items-center justify-between
                ${statusFilter === 'pending' ? 'text-orange-700' : ''}
                ${statusFilter === 'approved' ? 'text-green-700' : ''}
                ${statusFilter === 'rejected' ? 'text-red-700' : ''}
              `}>
                <span>
                  {statusFilter === 'pending' && '⏳ عرض الأدوية قيد المراجعة فقط'}
                  {statusFilter === 'approved' && '✅ عرض الأدوية الموافق عليها فقط'}
                  {statusFilter === 'rejected' && '❌ عرض الأدوية المرفوضة فقط'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="h-6 text-xs"
                >
                  إلغاء الفلتر
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        {/* Medicines Grid */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                جاري تحميل الأدوية...
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse border border-gray-200">
                  <div className="w-full h-32 bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? 'لم يتم العثور على نتائج' : 'لا توجد أدوية حتى الآن'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'لم يتم إضافة أي أدوية بعد'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedicines.map((medicine, index) => {
              const medicineStatus = medicine.status;
              const rejectionNotes = medicine.rejectionNotes;

              return (
                <motion.div
                  key={medicine.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-32 bg-muted overflow-hidden rounded-t-xl">
                    {medicine.subabaseImageUrl ? (
                      <img
                        src={medicine.subabaseImageUrl}
                        alt={medicine.name}
                        className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const placeholder = document.createElement('div');
                            placeholder.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100';
                            placeholder.innerHTML = `
                              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                              </svg>
                            `;
                            parent.insertBefore(placeholder, parent.firstChild);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}

                    {/* Status Badge - Always visible on top */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                      {medicineStatus === 'pending' && (
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1.5 font-bold shadow-lg flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          قيد المراجعة
                        </Badge>
                      )}
                      {medicineStatus === 'rejected' && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 font-bold shadow-lg flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          مرفوض
                        </Badge>
                      )}
                      {medicineStatus === 'approved' && (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1.5 font-bold shadow-lg flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          موافق عليه
                        </Badge>
                      )}
                    </div>

                    {/* Badges - Top Left */}
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
                      {medicine.isNewProduct && (
                        <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 shadow-md font-bold font-cairo animate-pulse">
                          جديد
                        </Badge>
                      )}

                    </div>

                    {/* Out of Stock */}
                    {medicine.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-xl">
                        <span className="text-white font-semibold text-sm bg-red-600 px-3 py-1 rounded-full">نفذت الكمية</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1">{medicine.name}</h3>
                        <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md inline-block">#{medicine.code}</p>
                      </div>
                    </div>

                    {medicine.category && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{medicine.category}</Badge>
                    )}

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                      {medicine.description || 'لا يوجد وصف'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex flex-col">
                        {medicine.discountRating > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-400 line-through">{medicine.price} ج.م</span>
                            <span className="text-lg font-bold text-blue-600">
                              {(medicine.price * (1 - medicine.discountRating / 100)).toFixed(2)} ج.م
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-blue-600">{medicine.price} ج.م</span>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className={`text-sm font-medium ${medicine.quantity > 10 ? 'text-green-600' : medicine.quantity > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                          الكمية: {medicine.quantity}
                        </div>
                        {medicine.discountRating > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-red-50 text-red-600 border-red-200 font-bold w-fit">
                            خصم {medicine.discountRating}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Rejection Notes */}
                    {rejectionNotes && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <AlertDescription className="text-xs text-red-600 font-cairo">
                          {rejectionNotes}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs h-8 border-gray-200 hover:bg-green-50 hover:border-green-300"
                        onClick={() => handleOpenAddEdit(medicine)}
                        disabled={!isAddressComplete}
                        title={!isAddressComplete ? 'يجب إدخال عنوان الصيدلية بالكامل من صفحة الإعدادات' : 'تعديل الدواء'}
                      >
                        <Edit className="w-3 h-3 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-gray-200 hover:bg-red-50 hover:border-red-300 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(medicine.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Dialog - نفس القائمة التي يستخدمها الأدمن */}
        <Dialog open={isAddEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCancelDialog();
          }
        }}>
          <DialogContent
            className="max-w-3xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </DialogTitle>
            </DialogHeader>

            {/* Address Warning */}
            {!isAddressComplete && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="font-cairo text-red-700 font-bold">
                  ⚠️ يجب إدخال عنوان الصيدلية بالكامل من صفحة الإعدادات قبل إضافة أي دواء
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Basic Info */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  المعلومات الأساسية
                </h3>

                <div className="grid grid-cols-[2fr,1fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-cairo text-sm font-semibold text-gray-700">اسم الدواء *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="أدخل اسم الدواء"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="font-cairo text-sm font-semibold text-gray-700">الكود</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      readOnly
                      disabled
                      className="h-10 bg-gray-100 cursor-not-allowed text-gray-600 border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="font-cairo text-sm font-semibold text-gray-700">
                    الوصف * <span className="text-xs text-red-600">(10 أحرف على الأقل)</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                    minLength={10}
                    placeholder="أضف وصف تفصيلي للدواء (10 أحرف على الأقل)..."
                    className="text-sm resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    {formData.description.length} / 10 أحرف كحد أدنى
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="font-cairo text-sm font-semibold text-gray-700">السعر (ج.م) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price === 0 ? '' : formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      required
                      placeholder="أدخل السعر بالجنيه"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="font-cairo text-sm font-semibold text-gray-700">الكمية *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity === 0 ? '' : formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                      required
                      placeholder="أدخل الكمية المتاحة"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="font-cairo text-sm font-semibold text-gray-700">الفئة</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="مسكنات، مضادات..."
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer" className="font-cairo text-sm font-semibold text-gray-700">الشركة المصنعة</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="اسم الشركة"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Additional Options */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-600" />
                  خيارات إضافية
                </h3>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border-2 border-blue-200 hover:border-blue-400 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isNewProduct}
                        onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-bold font-cairo text-gray-900 block">
                          منتج جديد
                        </span>
                        <span className="text-xs text-blue-600 font-cairo">
                          سيظهر بشارة "جديد"
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="bg-white p-3 rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.discountRating > 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          discountRating: e.target.checked ? 10 : 0
                        })}
                        className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-bold font-cairo text-gray-900 block">
                          تطبيق خصم
                        </span>
                        <span className="text-xs text-green-600 font-cairo">
                          إضافة نسبة خصم
                        </span>
                      </div>
                    </label>
                    {formData.discountRating > 0 && (
                      <div className="mt-3">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discountRating === 0 ? '' : formData.discountRating}
                          onChange={(e) => setFormData({
                            ...formData,
                            discountRating: parseInt(e.target.value) || 0
                          })}
                          placeholder="أدخل نسبة الخصم (اختياري)"
                          className="h-9 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Medicine Image - إلزامي */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  صورة الدواء *
                </h3>
                <p className="text-xs text-red-600 font-cairo font-bold">⚠️ يجب رفع صورة للدواء قبل الحفظ - هذا الحقل إلزامي</p>

                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="relative">
                    <label className={`block ${formData.subabaseImageUrl ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-sm font-cairo font-bold shadow-md transition-all ${formData.subabaseImageUrl
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : isUploading
                          ? 'bg-amber-400 text-white cursor-wait'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white hover:shadow-lg cursor-pointer'
                        }`}>
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>جاري الرفع...</span>
                          </>
                        ) : formData.subabaseImageUrl ? (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>يوجد صورة - احذفها للتغيير</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>📤 رفع صورة من الجهاز (إلزامي)</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading || !!formData.subabaseImageUrl}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Divider */}
                  {!formData.subabaseImageUrl && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-amber-300"></div>
                      <span className="text-sm text-gray-600 font-cairo font-semibold">أو</span>
                      <div className="flex-1 h-px bg-amber-300"></div>
                    </div>
                  )}

                  {/* URL Input - Hidden if image is from Supabase (processed) for security */}
                  {!formData.subabaseImageUrl.includes('supabase.co/storage') && (
                    <div className="space-y-2">
                      <Label className="text-sm font-cairo font-semibold text-gray-700">🔗 أضف رابط صورة من الإنترنت</Label>
                      <Input
                        id="imageUrlInputPharmacist"
                        type="url"
                        value={formData.subabaseImageUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, subabaseImageUrl: e.target.value });
                          setImageLoadError(false); // Reset error when URL changes
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="h-10 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {/* Image Preview */}
                  {formData.subabaseImageUrl && (
                    <div className="space-y-3">
                      {/* Badge للصورة المعالجة */}
                      {formData.subabaseORImageUrl && formData.subabaseORImageUrl !== formData.subabaseImageUrl && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                          <span className="text-purple-600 text-sm font-cairo">
                            ✨ صورة بدون خلفية - يمكنك حذفها والرجوع للأصلية
                          </span>
                        </div>
                      )}

                      <div className="relative w-full h-40 rounded-xl border-2 border-amber-300 overflow-hidden bg-white shadow-md group">
                        {!imageLoadError ? (
                          <img
                            src={formData.subabaseImageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain p-3"
                            onError={() => {
                              setImageLoadError(true);
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-red-500 font-cairo">
                            <div className="text-center">
                              <div className="text-4xl mb-2">⚠️</div>
                              <div className="font-bold">صورة غير صالحة</div>
                              <div className="text-xs mt-1">تأكد من صحة الرابط</div>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-2">
                          {/* زر حذف الخلفية - يُخفى إذا كانت الصورة معالجة بالفعل أو فاشلة */}
                          {!imageLoadError && !(formData.subabaseORImageUrl && formData.subabaseORImageUrl !== formData.subabaseImageUrl) && (
                            <button
                              type="button"
                              onClick={handleRemoveBackground}
                              disabled={isRemovingBg}
                              className="px-3 h-8 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-lg transition-all text-xs font-cairo font-bold"
                              title="إزالة خلفية الصورة"
                            >
                              {isRemovingBg ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>جاري...</span>
                                </>
                              ) : (
                                <>
                                  <span>✨</span>
                                  <span>حذف الخلفية</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              const imageUrl = formData.subabaseImageUrl;
                              const originalImageUrl = formData.subabaseORImageUrl;
                              const isSupabaseImage = imageUrl.includes('supabase.co/storage');
                              const hasOriginal = originalImageUrl && originalImageUrl !== imageUrl;

                              let confirmMessage = 'هل تريد مسح الصورة؟';
                              if (isSupabaseImage) {
                                confirmMessage += '\n\nسيتم حذف الصورة من التخزين فوراً.';
                              }
                              if (hasOriginal) {
                                confirmMessage += '\n\nسيتم الرجوع للصورة الأصلية.';
                              }

                              if (window.confirm(confirmMessage)) {
                                // حذف الصورة الحالية من Supabase
                                if (isSupabaseImage) {
                                  console.log('🗑️ حذف الصورة الحالية:', imageUrl);
                                  toast.info('جاري حذف الصورة...');
                                  const result = await deleteImageFromSupabase(imageUrl);

                                  if (result.success) {
                                    console.log('✅ تم حذف الصورة الحالية بنجاح');
                                    toast.success('تم حذف الصورة بنجاح');
                                  } else {
                                    console.error('❌ فشل حذف الصورة الحالية:', result.error);
                                    toast.error(`فشل حذف الصورة: ${result.error || 'خطأ غير معروف'}`);
                                  }
                                }

                                // حذف الصورة الأصلية من Supabase إذا كانت موجودة ومختلفة
                                if (hasOriginal && originalImageUrl.includes('supabase.co/storage')) {
                                  console.log('🗑️ حذف الصورة الأصلية:', originalImageUrl);
                                  const originalResult = await deleteImageFromSupabase(originalImageUrl);

                                  if (originalResult.success) {
                                    console.log('✅ تم حذف الصورة الأصلية بنجاح');
                                  } else {
                                    console.error('❌ فشل حذف الصورة الأصلية:', originalResult.error);
                                  }
                                }

                                // تحديث الـ state
                                if (hasOriginal && !originalImageUrl.includes('supabase.co/storage')) {
                                  // إذا كانت الصورة الأصلية من الإنترنت، نرجع لها
                                  setFormData({ ...formData, subabaseImageUrl: originalImageUrl });
                                } else {
                                  // إذا لا، نفرغ الحقول
                                  setFormData({ ...formData, subabaseImageUrl: '', subabaseORImageUrl: '' });
                                }

                                if (!isSupabaseImage) {
                                  toast.success('تم إزالة الصورة');
                                }
                              }
                            }}
                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-all"
                            title="حذف الصورة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelDialog}
                  className="h-10 px-6 font-cairo font-semibold border-2 hover:bg-gray-100"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.subabaseImageUrl || !isAddressComplete || isSaving || isUploading || isRemovingBg}
                  title={
                    isSaving
                      ? 'جاري الحفظ...'
                      : isUploading
                        ? 'جاري رفع الصورة...'
                        : isRemovingBg
                          ? 'جاري إزالة الخلفية...'
                          : !isAddressComplete
                            ? 'يجب إدخال عنوان الصيدلية بالكامل من صفحة الإعدادات أولاً'
                            : !formData.subabaseImageUrl
                              ? 'يجب رفع صورة للدواء أولاً'
                              : ''
                  }
                  className="h-10 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : editingMedicine ? (
                    '💾 حفظ التعديلات'
                  ) : (
                    '➕ إضافة الدواء'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
