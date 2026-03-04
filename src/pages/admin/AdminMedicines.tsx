import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Star,
  Image as ImageIcon,
  Building2,
  MapPin,
  Trash
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMedicines } from '@/hooks/useMedicines';
import { usePharmacies } from '@/hooks/usePharmacies';
import { useCategories } from '@/hooks/useCategories';
import { useSections } from '@/hooks/useSections';
import { Medicine } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { deleteMedicinePermanently } from '@/services/medicineService';
import { deleteImageFromSupabase, uploadImageToSupabase, removeImageBackground } from '@/lib/supabase';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { toast } from 'sonner';
import { MedicineImage } from '@/components/ui/medicine-image';
import { removeDuplicateMedicines } from '@/utils/removeDuplicateMedicines';

export default function AdminMedicines() {
  const { medicines, isLoading, addMedicine, updateMedicine, deleteMedicine, searchQuery, setSearchQuery } = useMedicines();
  const { pharmacies } = usePharmacies();
  const { categories, isLoading: categoriesLoading } = useCategories(true); // Active categories only
  const { sections, isLoading: sectionsLoading } = useSections(true); // Active sections only
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false); // حماية إضافية من race conditions
  const [imageLoadError, setImageLoadError] = useState(false); // جديد: لتتبع فشل تحميل الصورة
  const [uploadedImagesInSession, setUploadedImagesInSession] = useState<string[]>([]); // تتبع الصور المرفوعة في الجلسة الحالية
  const [selectedCategory, setSelectedCategory] = useState<string>('all'); // فلتر الفئات
  const [selectedSection, setSelectedSection] = useState<string>('all'); // فلتر الأقسام
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    code: '',
    description: '',
    descriptionEn: '',
    price: 0,
    quantity: 0,
    pharmacyId: 0,
    pharmacyName: '',
    pharmcyAddress: '',
    category: '',
    categoryId: '',
    categoryEn: '',
    sectionId: '',
    sectionName: '',
    sectionNameEn: '',
    sectionImageUrl: '',
    sectionOriginalImageUrl: '',
    manufacturer: '',
    pharmacyPrice: 0,
    pharmacyDiscount: 0,
    expiryDate: '',
    subabaseImageUrl: '',
    subabaseORImageUrl: '', // الصورة الأصلية قبل إزالة الخلفية
    avgRating: 0,
    ratingCount: 0,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 0,
    reviews: []
  });

  // Restore dialog state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin_medicine_dialog_state');
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
        localStorage.removeItem('admin_medicine_dialog_state');
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
      localStorage.setItem('admin_medicine_dialog_state', JSON.stringify(stateToSave));
    } else {
      localStorage.removeItem('admin_medicine_dialog_state');
    }
  }, [isAddEditDialogOpen, formData, editingMedicine]);

  // Update selectedMedicine when medicines data changes (real-time update)
  useEffect(() => {
    if (selectedMedicine) {
      const updatedMedicine = medicines.find(m => m.id === selectedMedicine.id);
      if (updatedMedicine) {
        setSelectedMedicine(updatedMedicine);
      }
    }
  }, [medicines, selectedMedicine?.id]);

  const handleOpenAddEdit = (medicine?: Medicine) => {
    // Reset image error state
    setImageLoadError(false);
    // Reset uploaded images tracker
    setUploadedImagesInSession([]);

    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        name: medicine.name,
        nameEn: (medicine as any).nameEn || '',
        code: medicine.code,
        description: medicine.description,
        descriptionEn: (medicine as any).descriptionEn || '',
        price: medicine.price,
        quantity: medicine.quantity,
        pharmacyId: medicine.pharmacyId,
        pharmacyName: medicine.pharmacyName,
        pharmcyAddress: medicine.pharmcyAddress,
        category: medicine.category || '',
        categoryId: (medicine as any).categoryId || '',
        categoryEn: (medicine as any).categoryEn || '',
        sectionId: (medicine as any).sectionId || '',
        sectionName: (medicine as any).sectionName || '',
        sectionNameEn: (medicine as any).sectionNameEn || '',
        sectionImageUrl: (medicine as any).sectionImageUrl || '',
        sectionOriginalImageUrl: (medicine as any).sectionOriginalImageUrl || '',
        manufacturer: medicine.manufacturer || '',
        pharmacyPrice: (medicine as any).pharmacyPrice || 0,
        pharmacyDiscount: (medicine as any).pharmacyDiscount || 0,
        expiryDate: (medicine as any).expiryDate || '',
        subabaseImageUrl: (medicine as any).subabaseImageUrl || medicine.subabaseORImageUrl || '',
        subabaseORImageUrl: medicine.subabaseORImageUrl || '',
        avgRating: medicine.avgRating,
        ratingCount: medicine.ratingCount,
        discountRating: medicine.discountRating,
        isNewProduct: medicine.isNewProduct,
        sellingCount: medicine.sellingCount,
        reviews: medicine.reviews
      });
    } else {
      setEditingMedicine(null);
      // Get first pharmacy as default
      const defaultPharmacy = pharmacies[0];
      setFormData({
        name: '',
        nameEn: '',
        code: `MED-${Date.now()}`,
        description: '',
        descriptionEn: '',
        price: 0,
        quantity: 0,
        pharmacyId: defaultPharmacy?.pharmacyId || 0,
        pharmacyName: defaultPharmacy?.name || '',
        pharmcyAddress: defaultPharmacy ? `${defaultPharmacy.address}، ${defaultPharmacy.city}` : '',
        category: '',
        categoryId: '',
        categoryEn: '',
        sectionId: '',
        sectionName: '',
        sectionNameEn: '',
        sectionImageUrl: '',
        sectionOriginalImageUrl: '',
        manufacturer: '',
        pharmacyPrice: 0,
        pharmacyDiscount: 0,
        expiryDate: '',
        subabaseImageUrl: '',
        subabaseORImageUrl: '',
        avgRating: 0,
        ratingCount: 0,
        discountRating: 0,
        isNewProduct: false,
        sellingCount: 0,
        reviews: []
      });
    }
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 handleSubmit called');
    console.log('📝 Form data:', formData);
    console.log('✏️ Editing medicine:', editingMedicine);

    // التحقق من وجود صورة
    if (!formData.subabaseImageUrl || formData.subabaseImageUrl.trim() === '') {
      toast.error('يجب رفع صورة للدواء قبل الحفظ');
      return;
    }

    // التحقق من اختيار القسم
    if (!formData.sectionId || formData.sectionId.trim() === '') {
      toast.error('⚠️ يجب اختيار القسم للدواء');
      return;
    }

    // التحقق من اختيار الفئة
    if (!formData.categoryId || formData.categoryId.trim() === '') {
      toast.error('⚠️ يجب اختيار فئة للدواء');
      return;
    }

    // التحقق من وجود عنوان الصيدلية
    if (!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 10) {
      toast.error('⚠️ يجب إدخال عنوان الصيدلية بالتفصيل الكامل (10 أحرف على الأقل)');
      return;
    }

    // منع الإرسال المتكرر (بعد التحقق من البيانات)
    if (isSaving || savingRef.current) {
      toast.warning('جاري الحفظ... الرجاء الانتظار');
      return;
    }

    setIsSaving(true);
    savingRef.current = true; // حماية فورية

    try {
      // توليد كود جديد فريد للأدوية الجديدة فقط
      const dataToSave = editingMedicine 
        ? { ...formData }
        : { 
            ...formData, 
            code: `MED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // كود فريد تماماً
          };

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

      // حفظ البيانات
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, dataToSave);
        toast.success('تم تحديث الدواء بنجاح');
      } else {
        await addMedicine(dataToSave);
        toast.success('تم إضافة الدواء بنجاح');
      }

      setIsAddEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
      savingRef.current = false; // إعادة تعيين الحماية
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟ سيتم حذف الصورة أيضاً من التخزين.')) {
      try {
        await deleteMedicinePermanently(id);
        toast.success('تم حذف الدواء والصورة بنجاح');
      } catch (error) {
        console.error('Error deleting medicine:', error);
        toast.error('فشل في حذف الدواء');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 Admin handleImageUpload called!');
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const originalSize = formatFileSize(file.size);
    toast.info(`جاري ضغط ورفع الصورة... (${originalSize})`);
    console.log('📤 Uploading file:', file.name);

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
        console.log('✅ Upload success:', result.url);
      } else {
        toast.error(result.error || 'فشل رفع الصورة');
        console.error('❌ Upload failed:', result.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
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

      // Remove background
      const result = await removeImageBackground(formData.subabaseImageUrl);

      if (!result.success || !result.blob) {
        console.error('❌ فشل إزالة الخلفية:', result.error);
        toast.error(result.error || 'فشل إزالة الخلفية');
        setIsRemovingBg(false);
        return;
      }

      console.log('✅ تمت إزالة الخلفية بنجاح');
      // Convert blob to file
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

  // Update category filter when section changes
  useEffect(() => {
    if (selectedSection === 'all') {
      setSelectedCategory('all');
    } else {
      // Reset category when section changes
      setSelectedCategory('all');
    }
  }, [selectedSection]);

  // فلترة الأدوية حسب القسم والفئة
  const filteredMedicines = medicines.filter(medicine => {
    // Filter by section first
    if (selectedSection !== 'all') {
      const medicineSectionId = (medicine as any).sectionId;
      if (medicineSectionId !== selectedSection) {
        return false;
      }
    }
    // Then filter by category
    if (selectedCategory !== 'all') {
      return medicine.category === selectedCategory;
    }
    return true;
  });

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
            <h1 className="text-3xl font-bold font-cairo">إدارة الأدوية</h1>
            <p className="text-muted-foreground">
              عرض وإدارة جميع الأدوية في النظام 
              ({filteredMedicines.length} دواء
              {selectedSection !== 'all' && sections.find(s => s.id === selectedSection) && ` في قسم "${sections.find(s => s.id === selectedSection)?.name}"`}
              {selectedCategory !== 'all' && ` في فئة "${selectedCategory}"`})
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                if (!window.confirm('هل تريد حذف جميع الأدوية المكررة؟ سيتم الاحتفاظ بالأحدث فقط.')) return;
                const loadingToast = toast.loading('جاري فحص وحذف المكررات...');
                try {
                  const result = await removeDuplicateMedicines('medicines');
                  toast.dismiss(loadingToast);
                  if (result.duplicatesRemoved > 0) {
                    toast.success(`تم حذف ${result.duplicatesRemoved} دواء مكرر!`);
                    window.location.reload();
                  } else {
                    toast.info('لا توجد أدوية مكررة');
                  }
                } catch (error) {
                  toast.dismiss(loadingToast);
                  toast.error('فشل حذف المكررات');
                }
              }}
              variant="outline"
              className="font-cairo"
            >
              <Trash className="w-4 h-4 ml-2" />
              حذف المكررات
            </Button>
            <Button onClick={() => handleOpenAddEdit()} className="gradient-primary text-primary-foreground font-cairo">
              <Plus className="w-5 h-5 ml-2" />
              إضافة دواء جديد
            </Button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الكود، الصيدلية، الفئة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={selectedSection}
              onValueChange={setSelectedSection}
            >
              <SelectTrigger className="h-10 font-cairo">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {sectionsLoading ? (
                  <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>
                ) : sections.length === 0 ? (
                  <div className="p-2 text-center text-sm text-gray-500">لا توجد أقسام</div>
                ) : (
                  sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.icon} {section.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={selectedSection === 'all'}
            >
              <SelectTrigger className={`h-10 font-cairo ${selectedSection === 'all' ? 'opacity-50' : ''}`}>
                <SelectValue placeholder={selectedSection === 'all' ? 'اختر القسم أولاً' : 'جميع الفئات'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {selectedSection === 'all' ? (
                  <div className="p-2 text-center text-sm text-gray-500">اختر قسم أولاً</div>
                ) : categoriesLoading ? (
                  <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>
                ) : categories.filter(cat => cat.sectionId === selectedSection).length === 0 ? (
                  <div className="p-2 text-center text-sm text-gray-500">لا توجد فئات</div>
                ) : (
                  categories
                    .filter(cat => cat.sectionId === selectedSection)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
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
            <h3 className="text-xl font-semibold mb-2">لا توجد أدوية</h3>
            <p className="text-muted-foreground">
              {selectedSection !== 'all' || selectedCategory !== 'all'
                ? `لم يتم العثور على أدوية ${selectedSection !== 'all' && sections.find(s => s.id === selectedSection) ? `في قسم "${sections.find(s => s.id === selectedSection)?.name}"` : ''} ${selectedCategory !== 'all' ? `في فئة "${selectedCategory}"` : ''}`
                : 'لم يتم العثور على أي أدوية في قاعدة البيانات'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-32 bg-muted overflow-hidden rounded-t-xl">
                  <MedicineImage
                    imageUrl={(medicine as any).subabaseImageUrl}
                    originalImageUrl={medicine.subabaseORImageUrl}
                    name={medicine.name}
                    objectFit="contain"
                    className="p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {medicine.isNewProduct && (
                      <Badge className="bg-green-500 text-white text-xs px-2 py-1">جديد</Badge>
                    )}
                    {medicine.discountRating > 0 && (
                      <Badge variant="destructive" className="text-xs px-2 py-1">-{medicine.discountRating}%</Badge>
                    )}
                  </div>
                  {/* Section Image Badge */}
                  {(medicine as any).sectionImageUrl && (
                    <div className="absolute bottom-2 left-2">
                      <div className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 overflow-hidden">
                        <img 
                          src={(medicine as any).sectionImageUrl} 
                          alt={(medicine as any).sectionName || 'قسم'} 
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    </div>
                  )}
                  {medicine.quantity === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-t-xl">
                      <span className="text-white font-semibold text-sm bg-red-600 px-3 py-1 rounded-full">نفذت الكمية</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
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
                          <span className="text-sm text-gray-400 line-through">{medicine.price.toFixed(2)} ج.م</span>
                          <span className="text-lg font-bold text-green-600">
                            {(() => {
                              const discountAmount = medicine.price * (medicine.discountRating / 100);
                              const finalPrice = medicine.price - discountAmount;
                              console.log('💰 Admin Price Calculation:', {
                                originalPrice: medicine.price,
                                discountRating: medicine.discountRating,
                                discountAmount,
                                finalPrice
                              });
                              return finalPrice.toFixed(2);
                            })()} ج.م
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-blue-600">{medicine.price.toFixed(2)} ج.م</span>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs font-medium text-gray-700">{medicine.avgRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({medicine.ratingCount})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${medicine.quantity > 10 ? 'text-green-600' : medicine.quantity > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        الكمية: {medicine.quantity}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {medicine.pharmacyName}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => setSelectedMedicine(medicine)}
                    >
                      <Eye className="w-3 h-3 ml-1" />
                      عرض
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-200 hover:bg-green-50 hover:border-green-300"
                      onClick={() => handleOpenAddEdit(medicine)}
                    >
                      <Edit className="w-3 h-3" />
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
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isAddEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCancelDialog();
          }
        }}>
          <DialogContent
            className="max-w-xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo text-base">
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Section 1: Basic Info - Professional Clean Design */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold font-cairo text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Package className="w-4 h-4 text-slate-600" />
                  المعلومات الأساسية
                </h3>

                {/* Names Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="font-cairo text-xs font-medium text-gray-700">اسم الدواء بالعربي *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="مثال: بنادول"
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nameEn" className="font-cairo text-xs font-medium text-gray-700">اسم الدواء بالإنجليزي</Label>
                    <Input
                      id="nameEn"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Example: Panadol"
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Descriptions Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="font-cairo text-xs font-medium text-gray-700">الوصف بالعربي</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      placeholder="وصف تفصيلي للدواء..."
                      className="text-sm resize-none bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="descriptionEn" className="font-cairo text-xs font-medium text-gray-700">الوصف بالإنجليزي</Label>
                    <Textarea
                      id="descriptionEn"
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      rows={3}
                      placeholder="Detailed description..."
                      className="text-sm resize-none bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Price, Quantity, Discount - Compact Row */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="price" className="font-cairo text-xs font-medium text-gray-700">السعر (ج.م) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price === 0 ? '' : formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        required
                        placeholder="0.00"
                        className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quantity" className="font-cairo text-xs font-medium text-gray-700">الكمية *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={formData.quantity === 0 ? '' : formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                        required
                        placeholder="0"
                        className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                      />
                    </div>
                  </div>
                  
                  {/* Discount - Compact Inline */}
                  <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="discountCheck"
                        checked={formData.discountRating > 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          discountRating: e.target.checked ? 10 : 0
                        })}
                        className="w-4 h-4 text-slate-600 rounded border-gray-300 focus:ring-slate-500"
                      />
                      <label htmlFor="discountCheck" className="text-sm text-gray-700 font-cairo cursor-pointer">تطبيق خصم</label>
                    </div>
                    
                    {formData.discountRating > 0 && (
                      <>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.discountRating === 0 ? '' : formData.discountRating}
                          onChange={(e) => setFormData({
                            ...formData,
                            discountRating: parseInt(e.target.value) || 0
                          })}
                          placeholder="%"
                          className="h-8 w-20 text-sm bg-white border-gray-200 focus:border-slate-400"
                        />
                        {formData.price > 0 && (
                          <div className="text-sm font-cairo">
                            <span className="text-gray-500">بعد الخصم: </span>
                            <span className="font-bold text-slate-700">
                              {(formData.price - (formData.price * (formData.discountRating / 100))).toFixed(2)} ج.م
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Section & Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sectionId" className="font-cairo text-xs font-medium text-gray-700">القسم *</Label>
                    <Select
                      value={formData.sectionId}
                      onValueChange={(value) => {
                        const selectedSection = sections.find(s => s.id === value);
                        setFormData({ 
                          ...formData, 
                          sectionId: value, 
                          sectionName: selectedSection?.name || '',
                          sectionNameEn: selectedSection?.nameEn || '',
                          sectionImageUrl: selectedSection?.sectionImageUrl || '',
                          sectionOriginalImageUrl: selectedSection?.originalImageUrl || '',
                          category: '',
                          categoryId: '',
                          categoryEn: ''
                        });
                      }}
                      required
                    >
                      <SelectTrigger className={`h-9 text-sm ${!formData.sectionId ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}>
                        <SelectValue placeholder={sectionsLoading ? "جاري التحميل..." : "اختر القسم"} />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionsLoading ? (
                          <div className="p-2 text-center text-xs text-gray-500">جاري التحميل...</div>
                        ) : sections.length === 0 ? (
                          <div className="p-2 text-center text-xs text-gray-500">لا توجد أقسام</div>
                        ) : (
                          sections.map((section) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.icon} {section.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="font-cairo text-xs font-medium text-gray-700">الفئة *</Label>
                    <Select
                      value={formData.categoryId || formData.category}
                      onValueChange={(value) => {
                        const selectedCat = categories.find(c => c.id === value);
                        setFormData({ 
                          ...formData, 
                          categoryId: value,
                          category: selectedCat?.name || '',
                          categoryEn: selectedCat?.nameEn || ''
                        });
                      }}
                      required
                      disabled={!formData.sectionId}
                    >
                      <SelectTrigger className={`h-9 text-sm ${!formData.categoryId && !formData.category ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'} ${!formData.sectionId ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder={
                          !formData.sectionId 
                            ? "اختر القسم أولاً" 
                            : categoriesLoading 
                              ? "جاري التحميل..." 
                              : "اختر الفئة"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <div className="p-2 text-center text-xs text-gray-500">جاري التحميل...</div>
                        ) : !formData.sectionId ? (
                          <div className="p-2 text-center text-xs text-gray-500">يجب اختيار القسم أولاً</div>
                        ) : categories.filter(cat => cat.sectionId === formData.sectionId).length === 0 ? (
                          <div className="p-2 text-center text-xs text-gray-500">
                            لا توجد فئات في هذا القسم
                          </div>
                        ) : (
                          categories
                            .filter(cat => cat.sectionId === formData.sectionId)
                            .map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="manufacturer" className="font-cairo text-xs font-medium text-gray-700">الشركة المصنعة</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="اسم الشركة"
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                    />
                  </div>
                </div>

                {/* Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="expiryDate" className="font-cairo text-xs font-medium text-gray-700">تاريخ الانتهاء</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={formData.expiryDate || ''}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pharmacyDiscount" className="font-cairo text-xs font-medium text-gray-700">خصم الصيدليات (%)</Label>
                    <Input
                      id="pharmacyDiscount"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.pharmacyDiscount === 0 ? '' : formData.pharmacyDiscount}
                      onChange={(e) => setFormData({ ...formData, pharmacyDiscount: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400 focus:ring-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pharmacy Info - Clean Design */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold font-cairo text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  معلومات الصيدلية
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="pharmacyName" className="font-cairo text-xs font-medium text-gray-700">اسم الصيدلية *</Label>
                    <Autocomplete
                      options={pharmacies
                        .map((pharmacy) => ({
                          value: String(pharmacy.pharmacyId),
                          label: pharmacy.name
                        }))}
                      value={formData.pharmacyName}
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          pharmacyName: value,
                          pharmacyId: 0
                        });
                      }}
                      onSelectOption={(option) => {
                        const selectedPharmacy = pharmacies.find(p => String(p.pharmacyId) === option.value);
                        if (selectedPharmacy) {
                          setFormData({
                            ...formData,
                            pharmacyId: selectedPharmacy.pharmacyId,
                            pharmacyName: selectedPharmacy.name,
                            pharmcyAddress: `${selectedPharmacy.address}، ${selectedPharmacy.city}`
                          });
                        }
                      }}
                      placeholder="اكتب اسم الصيدلية..."
                      className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pharmcyAddress" className="font-cairo text-xs font-medium text-gray-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      عنوان الصيدلية *
                    </Label>
                    <Input
                      id="pharmcyAddress"
                      value={formData.pharmcyAddress}
                      onChange={(e) => setFormData({ ...formData, pharmcyAddress: e.target.value })}
                      placeholder="18 شارع طه حسين بجوار سوبر ماركت 4m"
                      required
                      className={`h-9 text-sm ${!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 10 ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200'}`}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Medicine Image - Clean Design */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold font-cairo text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  صورة الدواء *
                </h3>

                <div className="space-y-3">
                  {/* Upload Button */}
                  <label className={`block ${formData.subabaseImageUrl ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className={`flex items-center justify-center gap-2 h-10 px-4 rounded-md text-sm font-cairo font-medium transition-all ${formData.subabaseImageUrl
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isUploading
                          ? 'bg-slate-400 text-white cursor-wait'
                          : 'bg-slate-600 hover:bg-slate-700 text-white cursor-pointer'
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
                          <span>رفع صورة</span>
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

                  {/* URL Input - Hidden if image is from Supabase */}
                  {!formData.subabaseImageUrl.includes('supabase.co/storage') && !formData.subabaseImageUrl && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400 font-cairo">أو</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                      <Input
                        type="url"
                        value={formData.subabaseImageUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, subabaseImageUrl: e.target.value });
                          setImageLoadError(false);
                        }}
                        placeholder="رابط صورة من الإنترنت"
                        className="h-9 text-sm bg-gray-50 border-gray-200 focus:border-slate-400"
                      />
                    </>
                  )}

                  {/* Image Preview */}
                  {formData.subabaseImageUrl && (
                    <div className="space-y-2">
                      <div className="relative w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-white">
                        <MedicineImage
                          imageUrl={formData.subabaseImageUrl}
                          originalImageUrl={formData.subabaseORImageUrl}
                          name="Preview"
                          objectFit="contain"
                          className="p-3"
                        />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          {!imageLoadError && !(formData.subabaseORImageUrl && formData.subabaseORImageUrl !== formData.subabaseImageUrl) && (
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
                            onClick={async () => {
                              const imageUrl = formData.subabaseImageUrl;
                              const originalImageUrl = formData.subabaseORImageUrl;
                              const isSupabaseImage = imageUrl.includes('supabase.co/storage');
                              const hasOriginal = originalImageUrl && originalImageUrl !== imageUrl;

                              if (window.confirm('هل تريد مسح الصورة؟')) {
                                if (isSupabaseImage) {
                                  const result = await deleteImageFromSupabase(imageUrl);
                                  if (result.success) toast.success('تم حذف الصورة');
                                }
                                if (hasOriginal && originalImageUrl.includes('supabase.co/storage')) {
                                  await deleteImageFromSupabase(originalImageUrl);
                                }
                                if (hasOriginal && !originalImageUrl.includes('supabase.co/storage')) {
                                  setFormData({ ...formData, subabaseImageUrl: originalImageUrl });
                                } else {
                                  setFormData({ ...formData, subabaseImageUrl: '', subabaseORImageUrl: '' });
                                }
                              }
                            }}
                            className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Additional Options - Clean Design */}
              <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold font-cairo text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Star className="w-4 h-4 text-slate-600" />
                  خيارات إضافية
                </h3>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isNewProduct"
                    checked={formData.isNewProduct}
                    onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })}
                    className="w-4 h-4 text-slate-600 rounded border-gray-300 focus:ring-slate-500"
                  />
                  <label htmlFor="isNewProduct" className="text-sm font-cairo text-gray-700 cursor-pointer">
                    منتج جديد
                    <span className="text-xs text-gray-400 block">سيظهر بشارة "جديد"</span>
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelDialog}
                  className="h-9 px-5 text-sm font-cairo font-semibold border hover:bg-gray-100"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.subabaseImageUrl || !formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 10 || !formData.sectionId || !formData.categoryId}
                  title={
                    !formData.subabaseImageUrl
                      ? 'يجب رفع صورة للدواء أولاً'
                      : (!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 10)
                        ? 'يجب إدخال عنوان الصيدلية بالتفصيل الكامل (10 أحرف على الأقل)'
                        : !formData.sectionId
                          ? 'يجب اختيار القسم'
                          : !formData.categoryId
                            ? 'يجب اختيار الفئة'
                            : ''
                  }
                  className="h-9 px-6 text-sm bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingMedicine ? '💾 حفظ' : '➕ إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
          <DialogContent
            className="max-w-3xl"
            dir="rtl"
            onPointerDownOutside={() => setSelectedMedicine(null)}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">تفاصيل الدواء</DialogTitle>
            </DialogHeader>
            {selectedMedicine && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center overflow-hidden">
                    {((selectedMedicine as any).subabaseImageUrl || selectedMedicine.subabaseORImageUrl) ? (
                      <img
                        src={(selectedMedicine as any).subabaseImageUrl || selectedMedicine.subabaseORImageUrl}
                        alt={selectedMedicine.name}
                        className="w-full h-full object-contain bg-white p-4"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <Package className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedMedicine.name}</h3>
                      <p className="text-muted-foreground">#{selectedMedicine.code}</p>
                      {selectedMedicine.category && (
                        <Badge variant="outline" className="mt-2">{selectedMedicine.category}</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground font-cairo line-clamp-4">
                      {selectedMedicine.description || 'لا يوجد وصف'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground font-cairo">السعر:</span>
                        {selectedMedicine.discountRating > 0 ? (
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-400 line-through">{selectedMedicine.price.toFixed(2)} ج.م</p>
                            <p className="font-bold text-green-600 text-xl">
                              {(() => {
                                const discountAmount = selectedMedicine.price * (selectedMedicine.discountRating / 100);
                                const finalPrice = selectedMedicine.price - discountAmount;
                                return finalPrice.toFixed(2);
                              })()} ج.م
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-primary text-xl">{selectedMedicine.price.toFixed(2)} ج.م</p>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground font-cairo">الكمية:</span>
                        <p className="font-bold text-lg">{selectedMedicine.quantity}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-cairo">الصيدلية:</span>
                        <p className="font-bold">{selectedMedicine.pharmacyName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-cairo">خصم الصيدليات:</span>
                        <p className="font-bold">{(selectedMedicine as any).pharmacyDiscount || 0}%</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground font-cairo flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          عنوان الصيدلية:
                        </span>
                        <p className="font-bold text-sm mt-1">{selectedMedicine.pharmcyAddress || 'غير محدد'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
