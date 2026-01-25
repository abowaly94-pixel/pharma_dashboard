import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  Calendar,
  Edit,
  Trash2,
  Image as ImageIcon,
  MapPin,
  Star,
  AlertCircle,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useMedicineApproval } from '@/hooks/useMedicineApproval';
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
import { MedicineWithApproval } from '@/types';
import { toast } from 'sonner';
import { deleteImageFromSupabase, uploadImageToSupabase, removeImageBackground } from '@/lib/supabase';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MedicineImage } from '@/components/ui/medicine-image';

export default function AdminMedicineReview() {
  const {
    pendingMedicines,
    allMedicines,
    isLoading,
    stats,
    filters,
    setFilters,
    approve,
    reject,
  } = useMedicineApproval();

  const { notifyMedicineApproved, notifyMedicineRejected } = useAutoNotifications();

  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithApproval | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  
  // Edit dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<MedicineWithApproval | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [uploadedImagesInSession, setUploadedImagesInSession] = useState<string[]>([]); // تتبع الصور المرفوعة في الجلسة الحالية
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    quantity: 0,
    category: '',
    manufacturer: '',
    subabaseImageUrl: '',
    subabaseORImageUrl: '',
  });

  // Restore edit dialog state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('admin_medicine_review_edit_dialog_state');
    if (savedState) {
      try {
        const { isOpen, editFormData: savedFormData, editingMedicineId } = JSON.parse(savedState);
        if (isOpen) {
          setIsEditDialogOpen(true);
          setEditFormData(savedFormData);
          
          // If editing, find the medicine by ID
          if (editingMedicineId) {
            const medicine = allMedicines.find(m => m.id === editingMedicineId);
            if (medicine) {
              setEditingMedicine(medicine);
            }
          }
        }
      } catch (error) {
        console.error('Failed to restore edit dialog state:', error);
        localStorage.removeItem('admin_medicine_review_edit_dialog_state');
      }
    }
  }, [allMedicines]);

  // Save edit dialog state to localStorage whenever it changes
  useEffect(() => {
    if (isEditDialogOpen) {
      const stateToSave = {
        isOpen: true,
        editFormData,
        editingMedicineId: editingMedicine?.id || null,
      };
      localStorage.setItem('admin_medicine_review_edit_dialog_state', JSON.stringify(stateToSave));
    } else {
      localStorage.removeItem('admin_medicine_review_edit_dialog_state');
    }
  }, [isEditDialogOpen, editFormData, editingMedicine]);

  const approvedMedicines = allMedicines.filter(m => m.status === 'approved');
  const rejectedMedicines = allMedicines.filter(m => m.status === 'rejected');

  const handleOpenReview = (medicine: MedicineWithApproval, action: 'approve' | 'reject') => {
    setSelectedMedicine(medicine);
    setReviewAction(action);
    setRejectionNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleOpenEdit = (medicine: MedicineWithApproval) => {
    setImageLoadError(false);
    // Reset uploaded images tracker
    setUploadedImagesInSession([]);
    setEditingMedicine(medicine);
    setEditFormData({
      name: medicine.name,
      code: medicine.code,
      description: medicine.description,
      price: medicine.price,
      quantity: medicine.quantity,
      category: medicine.category || '',
      manufacturer: medicine.manufacturer || '',
      subabaseImageUrl: medicine.subabaseImageUrl || medicine.subabaseORImageUrl || '',
      subabaseORImageUrl: medicine.subabaseORImageUrl || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedicine) return;

    if (!editFormData.subabaseImageUrl || editFormData.subabaseImageUrl.trim() === '') {
      toast.error('يجب وجود صورة للدواء');
      return;
    }

    try {
      // Update medicine in pending_medicines collection
      const medicineRef = doc(db, 'pending_medicines', editingMedicine.id);
      await updateDoc(medicineRef, {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        price: editFormData.price,
        quantity: editFormData.quantity,
        category: editFormData.category,
        manufacturer: editFormData.manufacturer || '',
        subabaseImageUrl: editFormData.subabaseImageUrl,
        subabaseORImageUrl: editFormData.subabaseORImageUrl || editFormData.subabaseImageUrl,
        updatedAt: serverTimestamp(),
      });

      toast.success('تم تحديث الدواء بنجاح');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating medicine:', error);
      toast.error('حدث خطأ أثناء تحديث الدواء');
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
        setEditFormData({ ...editFormData, subabaseImageUrl: result.url });
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

  const handleRemoveBackground = async () => {
    if (!editFormData.subabaseImageUrl) {
      toast.error('لا توجد صورة لإزالة الخلفية منها');
      return;
    }

    setIsRemovingBg(true);
    toast.info('جاري إزالة الخلفية... قد يستغرق بضع ثوانٍ');

    try {
      const result = await removeImageBackground(editFormData.subabaseImageUrl);
      
      if (!result.success || !result.blob) {
        toast.error(result.error || 'فشل إزالة الخلفية');
        setIsRemovingBg(false);
        return;
      }

      const file = new File([result.blob], 'medicine-no-bg.png', { type: 'image/png' });
      
      const currentImageUrl = editFormData.subabaseImageUrl;
      
      // Delete old image from Supabase if it exists
      if (currentImageUrl.includes('supabase.co/storage')) {
        await deleteImageFromSupabase(currentImageUrl);
      }
      
      // Upload new processed image
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
        const savedOriginalUrl = editFormData.subabaseORImageUrl || 
                                 (!currentImageUrl.includes('supabase.co/storage') ? currentImageUrl : '');
        
        setEditFormData({ 
          ...editFormData, 
          subabaseImageUrl: uploadResult.url,
          subabaseORImageUrl: savedOriginalUrl
        });
        
        // تتبع الصورة المعالجة المرفوعة حديثاً
        setUploadedImagesInSession(prev => [...prev, uploadResult.url]);
        
        toast.success('تم إزالة الخلفية ورفع الصورة بنجاح! 🎉');
      } else {
        toast.error(uploadResult.error || 'فشل رفع الصورة بعد إزالة الخلفية');
      }
    } catch (error) {
      console.error('Error removing background:', error);
      toast.error('حدث خطأ أثناء إزالة الخلفية');
    } finally {
      setIsRemovingBg(false);
    }
  };

  // حذف الصور المرفوعة في الجلسة الحالية عند الإلغاء
  const handleCancelEditDialog = async () => {
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
    setIsEditDialogOpen(false);
  };

  const handleSubmitReview = async () => {
    if (!selectedMedicine) return;

    if (reviewAction === 'approve') {
      const success = await approve(selectedMedicine.id);
      if (success) {
        await notifyMedicineApproved(selectedMedicine.name, selectedMedicine.pharmacyId);
      }
    } else {
      if (!rejectionNotes.trim()) {
        toast.error('يرجى إدخال ملاحظات الرفض');
        return;
      }
      const success = await reject(selectedMedicine.id, rejectionNotes);
      if (success) {
        await notifyMedicineRejected(selectedMedicine.name, selectedMedicine.pharmacyId, rejectionNotes);
      }
    }

    setIsReviewDialogOpen(false);
    setSelectedMedicine(null);
  };

  const getMedicinesByTab = () => {
    switch (activeTab) {
      case 'pending':
        return pendingMedicines;
      case 'approved':
        return approvedMedicines;
      case 'rejected':
        return rejectedMedicines;
      default:
        return [];
    }
  };

  const medicines = getMedicinesByTab();

  // Handle checkbox toggle
  const handleToggleSelect = (medicineId: string) => {
    const newSelected = new Set(selectedMedicineIds);
    if (newSelected.has(medicineId)) {
      newSelected.delete(medicineId);
    } else {
      newSelected.add(medicineId);
    }
    setSelectedMedicineIds(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (activeTab !== 'pending') return;

    if (selectedMedicineIds.size === pendingMedicines.length) {
      setSelectedMedicineIds(new Set());
    } else {
      setSelectedMedicineIds(new Set(pendingMedicines.map(m => m.id)));
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedMedicineIds.size === 0) return;

    setIsBulkApproving(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedMedicineIds) {
      const success = await approve(id);
      if (success) {
        successCount++;
        // Find the medicine to get info for notification
        const med = pendingMedicines.find(m => m.id === id);
        if (med) {
          await notifyMedicineApproved(med.name, med.pharmacyId);
        }
      } else {
        failCount++;
      }
    }

    setIsBulkApproving(false);
    setSelectedMedicineIds(new Set());

    if (failCount === 0) {
      toast.success(`تمت الموافقة على ${successCount} دواء بنجاح`);
    } else {
      toast.warning(`تمت الموافقة على ${successCount} دواء، فشل ${failCount}`);
    }
  };

  // Clear selection when changing tabs
  const handleTabChange = (tab: 'pending' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    setSelectedMedicineIds(new Set());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold font-cairo">مراجعة الأدوية</h1>
            <p className="text-muted-foreground">مراجعة والموافقة على الأدوية المضافة من الصيدليات</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                قيد المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                موافق عليها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                مرفوضة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 border-b"
        >
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 font-cairo font-semibold transition-colors ${activeTab === 'pending'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            قيد المراجعة ({stats.pending})
          </button>
          <button
            onClick={() => handleTabChange('approved')}
            className={`px-4 py-2 font-cairo font-semibold transition-colors ${activeTab === 'approved'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            موافق عليها ({stats.approved})
          </button>
          <button
            onClick={() => handleTabChange('rejected')}
            className={`px-4 py-2 font-cairo font-semibold transition-colors ${activeTab === 'rejected'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            مرفوضة ({stats.rejected})
          </button>
        </motion.div>

        {/* Filters and Bulk Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن دواء..."
                className="pr-10 font-cairo"
              />
            </div>
            <Select
              value={filters.pharmacyId ? String(filters.pharmacyId) : 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, pharmacyId: value === 'all' ? undefined : Number(value) })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع الصيدليات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصيدليات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {activeTab === 'pending' && pendingMedicines.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="font-cairo"
              >
                {selectedMedicineIds.size === pendingMedicines.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>

              {selectedMedicineIds.size > 0 && (
                <>
                  <Badge variant="secondary" className="font-cairo">
                    {selectedMedicineIds.size} محدد
                  </Badge>

                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={isBulkApproving}
                    className="bg-green-600 hover:bg-green-700 font-cairo"
                  >
                    {isBulkApproving ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2" />
                        جاري الموافقة...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 ml-2" />
                        الموافقة على المحدد ({selectedMedicineIds.size})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Medicines Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد أدوية في هذه الفئة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`stat-card hover:shadow-lg transition-all ${selectedMedicineIds.has(medicine.id) ? 'ring-2 ring-primary' : ''
                  }`}
              >
                {/* Image with Checkbox */}
                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-4">
                  {activeTab === 'pending' && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedMedicineIds.has(medicine.id)}
                        onChange={() => handleToggleSelect(medicine.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                  )}
                  <MedicineImage
                    imageUrl={medicine.subabaseImageUrl}
                    originalImageUrl={medicine.subabaseORImageUrl}
                    name={medicine.name}
                    objectFit="contain"
                    className="p-4"
                  />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold font-cairo text-lg mb-1">{medicine.name}</h3>
                    <p className="text-sm text-muted-foreground">كود: {medicine.code}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{medicine.pharmacyName}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">السعر: </span>
                      {medicine.discountRating > 0 ? (
                        <span>
                          <span className="text-sm text-gray-400 line-through">{medicine.price.toFixed(2)} ج.م</span>
                          <span className="font-bold text-green-600 mr-2">
                            {(() => {
                              const discountAmount = medicine.price * (medicine.discountRating / 100);
                              const finalPrice = medicine.price - discountAmount;
                              return finalPrice.toFixed(2);
                            })()} ج.م
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-primary">{medicine.price.toFixed(2)} ج.م</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">الكمية: </span>
                      <span className="font-bold">{medicine.quantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(medicine.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>

                  {medicine.rejectionNotes && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 transition-all duration-200">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-xs font-semibold text-red-800 flex-1 text-right">
                          ملاحظات الرفض:
                        </p>
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      </div>
                      <div 
                        className="max-h-24 overflow-y-auto text-sm text-red-700 leading-relaxed pl-1 whitespace-pre-wrap break-words scrollbar-thin scrollbar-thumb-red-300 scrollbar-track-red-100 hover:scrollbar-thumb-red-400" 
                        dir="rtl" 
                        style={{ direction: 'rtl' }}
                      >
                        {medicine.rejectionNotes}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenEdit(medicine)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(medicine, 'approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReview(medicine, 'reject')}
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent 
            className="max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo">
                {reviewAction === 'approve' ? 'الموافقة على الدواء' : 'رفض الدواء'}
              </DialogTitle>
            </DialogHeader>
            {selectedMedicine && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold font-cairo mb-2">{selectedMedicine.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    الصيدلية: {selectedMedicine.pharmacyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    السعر: {selectedMedicine.discountRating > 0 ? (
                      <>
                        <span className="line-through text-gray-400">{selectedMedicine.price.toFixed(2)} ج.م</span>
                        <span className="font-bold text-green-600 mr-2">
                          {(() => {
                            const discountAmount = selectedMedicine.price * (selectedMedicine.discountRating / 100);
                            const finalPrice = selectedMedicine.price - discountAmount;
                            return finalPrice.toFixed(2);
                          })()} ج.م
                        </span>
                      </>
                    ) : (
                      `${selectedMedicine.price.toFixed(2)} ج.م`
                    )}
                  </p>
                </div>

                {reviewAction === 'reject' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionNotes" className="font-cairo">
                      ملاحظات الرفض *
                    </Label>
                    <Textarea
                      id="rejectionNotes"
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="اكتب سبب الرفض..."
                      rows={4}
                      className="font-cairo"
                    />
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    className={
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }
                  >
                    {reviewAction === 'approve' ? 'موافقة' : 'رفض'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          if (!open) {
            handleCancelEditDialog();
          }
        }}>
          <DialogContent 
            className="max-w-3xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                تعديل الدواء قبل الموافقة
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit} className="space-y-5">
              {/* Basic Info */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  المعلومات الأساسية
                </h3>
                
                <div className="grid grid-cols-[2fr,1fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="font-cairo text-sm font-semibold text-gray-700">اسم الدواء *</Label>
                    <Input
                      id="edit-name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      placeholder="أدخل اسم الدواء"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-code" className="font-cairo text-sm font-semibold text-gray-700">الكود</Label>
                    <Input
                      id="edit-code"
                      value={editFormData.code}
                      readOnly
                      disabled
                      className="h-10 bg-gray-100 cursor-not-allowed text-gray-600 border-gray-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="font-cairo text-sm font-semibold text-gray-700">الوصف</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={3}
                    placeholder="أضف وصف تفصيلي للدواء..."
                    className="text-sm resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price" className="font-cairo text-sm font-semibold text-gray-700">السعر (ج.م) *</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editFormData.price === 0 ? '' : editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                      required
                      placeholder="أدخل السعر"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantity" className="font-cairo text-sm font-semibold text-gray-700">الكمية *</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      min="0"
                      value={editFormData.quantity === 0 ? '' : editFormData.quantity}
                      onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })}
                      required
                      placeholder="أدخل الكمية"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category" className="font-cairo text-sm font-semibold text-gray-700">الفئة</Label>
                    <Input
                      id="edit-category"
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      placeholder="مسكنات، مضادات..."
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-manufacturer" className="font-cairo text-sm font-semibold text-gray-700">الشركة المصنعة</Label>
                    <Input
                      id="edit-manufacturer"
                      value={editFormData.manufacturer}
                      onChange={(e) => setEditFormData({ ...editFormData, manufacturer: e.target.value })}
                      placeholder="اسم الشركة"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medicine Image */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                  صورة الدواء *
                </h3>
                
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="relative">
                    <label className={`block ${editFormData.subabaseImageUrl ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-sm font-cairo font-bold shadow-md transition-all ${
                        editFormData.subabaseImageUrl 
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
                        ) : editFormData.subabaseImageUrl ? (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>يوجد صورة - احذفها للتغيير</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>📤 رفع صورة من الجهاز</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading || !!editFormData.subabaseImageUrl}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* Divider */}
                  {!editFormData.subabaseImageUrl && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-amber-300"></div>
                      <span className="text-sm text-gray-600 font-cairo font-semibold">أو</span>
                      <div className="flex-1 h-px bg-amber-300"></div>
                    </div>
                  )}
                  
                  {/* URL Input - Hidden if image is from Supabase */}
                  {!editFormData.subabaseImageUrl.includes('supabase.co/storage') && (
                    <div className="space-y-2">
                      <Label className="text-sm font-cairo font-semibold text-gray-700">🔗 أضف رابط صورة من الإنترنت</Label>
                      <Input 
                        type="url"
                        value={editFormData.subabaseImageUrl}
                        onChange={(e) => {
                          setEditFormData({ ...editFormData, subabaseImageUrl: e.target.value });
                          setImageLoadError(false);
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="h-10 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                    </div>
                  )}
                  
                  {/* Image Preview */}
                  {editFormData.subabaseImageUrl && editFormData.subabaseImageUrl.trim() && (
                    <div className="space-y-3">
                      {/* Badge for processed image */}
                      {editFormData.subabaseORImageUrl && editFormData.subabaseORImageUrl !== editFormData.subabaseImageUrl && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg">
                          <span className="text-purple-600 text-sm font-cairo">
                            ✨ صورة بدون خلفية - يمكنك حذفها والرجوع للأصلية
                          </span>
                        </div>
                      )}
                      
                      <div className="relative w-full h-40 rounded-xl border-2 border-amber-300 overflow-hidden bg-white shadow-md group">
                        <MedicineImage
                          imageUrl={editFormData.subabaseImageUrl}
                          originalImageUrl={editFormData.subabaseORImageUrl}
                          name="Preview"
                          objectFit="contain"
                          className="p-3"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          {/* Remove background button */}
                          {!imageLoadError && !(editFormData.subabaseORImageUrl && editFormData.subabaseORImageUrl !== editFormData.subabaseImageUrl) && (
                            <button
                              type="button"
                              onClick={handleRemoveBackground}
                              disabled={isRemovingBg}
                              className="px-3 h-8 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-lg flex items-center justify-center gap-1.5 shadow-lg transition-all text-xs font-cairo font-bold"
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
                              const imageUrl = editFormData.subabaseImageUrl;
                              const originalImageUrl = editFormData.subabaseORImageUrl;
                              const isSupabaseImage = imageUrl.includes('supabase.co/storage');
                              const hasOriginal = originalImageUrl && originalImageUrl !== imageUrl;

                              if (window.confirm('هل تريد مسح الصورة؟')) {
                                if (isSupabaseImage) {
                                  await deleteImageFromSupabase(imageUrl);
                                }
                                
                                if (hasOriginal && originalImageUrl.includes('supabase.co/storage')) {
                                  await deleteImageFromSupabase(originalImageUrl);
                                }
                                
                                if (hasOriginal && !originalImageUrl.includes('supabase.co/storage')) {
                                  setEditFormData({ ...editFormData, subabaseImageUrl: originalImageUrl });
                                } else {
                                  setEditFormData({ ...editFormData, subabaseImageUrl: '', subabaseORImageUrl: '' });
                                }
                                
                                toast.success('تم حذف الصورة');
                              }
                            }}
                            className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-all"
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
                  onClick={handleCancelEditDialog}
                  className="h-10 px-6 font-cairo font-semibold border-2 hover:bg-gray-100"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  disabled={!editFormData.subabaseImageUrl}
                  className="h-10 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💾 حفظ التعديلات
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
