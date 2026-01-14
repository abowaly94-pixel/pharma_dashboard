import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Building2,
  MapPin
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMedicines } from '@/hooks/useMedicines';
import { usePharmacies } from '@/hooks/usePharmacies';
import { useAuth } from '@/contexts/AuthContext';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deleteImageFromSupabase, uploadImageToSupabase, removeImageBackground } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PharmacistMedicines() {
  const { user } = useAuth();
  const hasPharmacyId = user?.pharmacyId !== undefined && user?.pharmacyId !== null;
  const { medicines, isLoading, addMedicine, updateMedicine, deleteMedicine } = useMedicines(user?.pharmacyId, { enabled: hasPharmacyId });
  const { pharmacies } = usePharmacies();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    quantity: 0,
    pharmacyId: user?.pharmacyId || 0,
    pharmacyName: user?.pharmacyName || '',
    pharmcyAddress: '',
    category: '',
    manufacturer: '',
    subabaseORImageUrl: '',
    avgRating: 0,
    ratingCount: 0,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 0,
    reviews: []
  });

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (medicine.code && medicine.code.includes(searchQuery))
  );

  const handleOpenAddEdit = (medicine?: Medicine) => {
    if (medicine) {
      setEditingMedicine(medicine);
      setFormData({
        name: medicine.name,
        code: medicine.code,
        description: medicine.description,
        price: medicine.price,
        quantity: medicine.quantity,
        pharmacyId: medicine.pharmacyId,
        pharmacyName: medicine.pharmacyName,
        pharmcyAddress: medicine.pharmcyAddress,
        category: medicine.category || '',
        manufacturer: medicine.manufacturer || '',
        subabaseORImageUrl: (medicine as any).subabaseImageUrl || medicine.subabaseORImageUrl || '',
        avgRating: medicine.avgRating,
        ratingCount: medicine.ratingCount,
        discountRating: medicine.discountRating,
        isNewProduct: medicine.isNewProduct,
        sellingCount: medicine.sellingCount,
        reviews: medicine.reviews
      });
    } else {
      setEditingMedicine(null);
      // Get default pharmacy from user or first pharmacy in list
      const defaultPharmacy = pharmacies.find(p => p.pharmacyId === user?.pharmacyId) || pharmacies[0];
      setFormData({
        name: '',
        code: `MED-${Date.now()}`,
        description: '',
        price: 0,
        quantity: 0,
        pharmacyId: defaultPharmacy?.pharmacyId || user?.pharmacyId || 0,
        pharmacyName: defaultPharmacy?.name || user?.pharmacyName || '',
        pharmcyAddress: defaultPharmacy ? `${defaultPharmacy.address}, ${defaultPharmacy.city}` : '',
        category: '',
        manufacturer: '',
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
    
    try {
      // Check if image was deleted (empty string) and we're editing
      console.log('🔍 Checking deletion conditions:');
      const oldImageUrl = (editingMedicine as any)?.subabaseImageUrl || editingMedicine?.subabaseORImageUrl;
      console.log('Checking deletion conditions:');
      console.log('  - editingMedicine exists?', !!editingMedicine);
      console.log('  - formData.subabaseORImageUrl is empty?', formData.subabaseORImageUrl === '');
      console.log('  - editingMedicine.subabaseORImageUrl?', editingMedicine?.subabaseORImageUrl);
      console.log('  - editingMedicine.subabaseImageUrl?', (editingMedicine as any)?.subabaseImageUrl);
      console.log('  - oldImageUrl (combined)?', oldImageUrl);
      
      if (editingMedicine && formData.subabaseORImageUrl === '' && oldImageUrl) {
        console.log('✅ All conditions met - proceeding with deletion');
        // Delete the old image from Supabase Storage
        const oldImageUrl = (editingMedicine as any).subabaseImageUrl || editingMedicine.subabaseORImageUrl;
        console.log('🎯 Old image URL to delete:', oldImageUrl);
        if (oldImageUrl) {
          console.log('🔄 Attempting to delete image:', oldImageUrl);
          toast.info('جاري حذف الصورة من التخزين...');
          const result = await deleteImageFromSupabase(oldImageUrl);
          console.log('📊 Deletion result:', result);
          if (result.success) {
            toast.success('تم حذف الصورة من التخزين بنجاح');
          } else {
            toast.error(`فشل حذف الصورة: ${result.error || 'خطأ غير معروف'}`);
            console.error('❌ Deletion failed:', result.error);
          }
        }
      } else {
        console.log('❌ Deletion conditions NOT met - skipping deletion');
      }
      
      // Prepare data with both image fields
      const dataToSave = {
        ...formData,
        subabaseImageUrl: formData.subabaseORImageUrl, // Update both fields
      };
      
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, dataToSave);
      } else {
        await addMedicine(dataToSave);
      }
      setIsAddEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteMedicine(id);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🎯 handleImageUpload called!');
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info('جاري رفع الصورة...');
    console.log('📤 Uploading file:', file.name);

    try {
      const result = await uploadImageToSupabase(file);
      
      if (result.success && result.url) {
        setFormData({ ...formData, subabaseORImageUrl: result.url });
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
    if (!formData.subabaseORImageUrl) {
      toast.error('لا توجد صورة لإزالة الخلفية منها');
      return;
    }

    setIsRemovingBg(true);
    toast.info('جاري إزالة الخلفية... قد يستغرق بضع ثوانٍ');

    try {
      // Remove background
      const result = await removeImageBackground(formData.subabaseORImageUrl);
      
      if (!result.success || !result.blob) {
        toast.error(result.error || 'فشل إزالة الخلفية');
        return;
      }

      // Convert blob to file
      const file = new File([result.blob], 'medicine-no-bg.png', { type: 'image/png' });
      
      // Delete old image if it's from Supabase
      if (formData.subabaseORImageUrl.includes('supabase.co/storage')) {
        await deleteImageFromSupabase(formData.subabaseORImageUrl);
      }
      
      // Upload new image without background
      const uploadResult = await uploadImageToSupabase(file);
      
      if (uploadResult.success && uploadResult.url) {
        setFormData({ ...formData, subabaseORImageUrl: uploadResult.url });
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

  const lowStockMedicines = medicines.filter(m => m.quantity < 10);
  const outOfStockMedicines = medicines.filter(m => m.quantity === 0);

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent font-cairo mb-2">
              أدويتي
            </h1>
            <p className="text-gray-600 text-lg">إدارة منتجات صيدليتك بكل سهولة</p>
          </div>
          <Button 
            onClick={() => handleOpenAddEdit()}
            className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6"
          >
            <Plus className="w-5 h-5 ml-2" />
            إضافة دواء جديد
          </Button>
        </motion.div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-cairo font-medium mb-1">إجمالي الأدوية</p>
                <p className="text-3xl font-bold text-blue-900">{medicines.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-cairo font-medium mb-1">متوفر</p>
                <p className="text-3xl font-bold text-green-900">{medicines.filter(m => m.quantity > 10).length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-cairo font-medium mb-1">مخزون منخفض</p>
                <p className="text-3xl font-bold text-orange-900">{lowStockMedicines.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-cairo font-medium mb-1">نفذ من المخزون</p>
                <p className="text-3xl font-bold text-red-900">{outOfStockMedicines.length}</p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Alert className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-sm">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <AlertDescription className="font-cairo font-medium text-orange-800">
                تنبيه: يوجد {lowStockMedicines.length} منتج بمخزون منخفض (أقل من 10 وحدات). يرجى إعادة التخزين قريباً.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6"
        >
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ابحث عن دواء بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 h-14 text-lg font-cairo bg-white border-2 border-gray-200 focus:border-green-400 rounded-xl shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-center text-sm text-gray-600 mt-3 font-cairo">
              تم العثور على {filteredMedicines.length} نتيجة
            </p>
          )}
        </motion.div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {!hasPharmacyId ? (
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-16 text-center"
              >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 font-cairo mb-3">جاري تحميل بيانات الصيدلية...</h3>
                <p className="text-gray-600 text-lg font-cairo">يرجى الانتظار</p>
              </motion.div>
            </div>
          ) : isLoading ? (
            [...Array(8)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 animate-pulse border border-gray-100 shadow-sm">
                <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl mb-4" />
                <div className="h-5 bg-gray-200 rounded-lg w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-4" />
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded-lg flex-1" />
                  <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                  <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))
          ) : filteredMedicines.length === 0 ? (
            <div className="col-span-full">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-16 text-center"
              >
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 font-cairo mb-3">
                  {searchQuery ? 'لم يتم العثور على نتائج' : 'لا توجد أدوية حتى الآن'}
                </h3>
                <p className="text-gray-600 text-lg mb-6 font-cairo">
                  {searchQuery 
                    ? 'جرب البحث بكلمات مختلفة أو تحقق من الإملاء' 
                    : 'ابدأ بإضافة أدوية جديدة لصيدليتك'}
                </p>
                {!searchQuery && (
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-8">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة أول دواء
                  </Button>
                )}
              </motion.div>
            </div>
          ) : (
            filteredMedicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 overflow-hidden group hover:shadow-2xl hover:border-green-200 transition-all duration-300 relative"
              >
                {/* Stock Badge */}
                {medicine.quantity === 0 ? (
                  <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    <span>نفذ</span>
                  </div>
                ) : medicine.quantity < 10 ? (
                  <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1 animate-pulse">
                    <AlertCircle className="w-4 h-4" />
                    <span>مخزون منخفض</span>
                  </div>
                ) : null}

                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {((medicine as any).subabaseImageUrl || medicine.subabaseORImageUrl) ? (
                    <img
                      src={(medicine as any).subabaseImageUrl || medicine.subabaseORImageUrl}
                      alt={medicine.name}
                      className="w-full h-full object-contain bg-white p-4 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                              <svg class="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                      <Package className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Title & Code */}
                  <div>
                    <h3 className="font-bold text-gray-900 text-base line-clamp-2 mb-2 group-hover:text-green-600 transition-colors font-cairo leading-relaxed">
                      {medicine.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 rounded-full font-mono font-semibold">
                        #{medicine.code}
                      </span>
                    </div>
                  </div>

                  {/* Price & Rating */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-cairo">السعر</p>
                      <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {medicine.price} ج.م
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1 font-cairo">التقييم</p>
                      <div className="flex items-center gap-1.5">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-lg font-bold text-gray-800">
                          {medicine.avgRating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({medicine.ratingCount || 0})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock & Sales */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs text-blue-700 font-cairo font-medium mb-1">الكمية</p>
                      <p className={`text-xl font-bold ${
                        medicine.quantity === 0 ? 'text-red-600' :
                        medicine.quantity < 10 ? 'text-orange-600' : 
                        'text-blue-900'
                      }`}>
                        {medicine.quantity}
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                      <p className="text-xs text-purple-700 font-cairo font-medium mb-1">المبيعات</p>
                      <p className="text-xl font-bold text-purple-900">
                        {medicine.sellingCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-400 text-blue-600 font-cairo font-semibold transition-all duration-200"
                      onClick={() => setSelectedMedicine(medicine)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenAddEdit(medicine)}
                      className="h-10 w-10 p-0 border-2 border-green-200 hover:bg-green-50 hover:border-green-400 text-green-600 transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(medicine.id)}
                      className="h-10 w-10 p-0 border-2 border-red-200 hover:bg-red-50 hover:border-red-400 text-red-600 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Add/Edit Medicine Dialog */}
        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Basic Info - Compact */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="name" className="font-cairo text-sm">اسم الدواء *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="code" className="font-cairo text-sm">الكود *</Label>
                  <Input id="code" value={formData.code} readOnly className="h-9 bg-gray-50 cursor-default" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description" className="font-cairo text-sm">الوصف</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} className="text-sm resize-none" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="price" className="font-cairo text-xs">السعر (ج.م) *</Label>
                  <Input id="price" type="number" min="0" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} required className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="quantity" className="font-cairo text-xs">الكمية *</Label>
                  <Input id="quantity" type="number" min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} required className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="category" className="font-cairo text-xs">الفئة</Label>
                  <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="مسكنات" className="h-9" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="manufacturer" className="font-cairo text-xs">الشركة</Label>
                  <Input id="manufacturer" value={formData.manufacturer} onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} className="h-9" />
                </div>
              </div>

              {/* Pharmacy Info - Compact */}
              <div className="space-y-2 p-2.5 bg-purple-50/50 rounded border border-purple-200">
                <h3 className="text-xs font-semibold font-cairo text-gray-700 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  معلومات الصيدلية
                </h3>
                <div className="grid md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="pharmacy" className="font-cairo text-xs">اسم الصيدلية *</Label>
                    <Select value={formData.pharmacyId.toString()} onValueChange={(value) => { const selectedPharmacy = pharmacies.find(p => p.pharmacyId.toString() === value); if (selectedPharmacy) { setFormData({ ...formData, pharmacyId: selectedPharmacy.pharmacyId, pharmacyName: selectedPharmacy.name, pharmcyAddress: `${selectedPharmacy.address}, ${selectedPharmacy.city}` }); } }}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="اختر" /></SelectTrigger>
                      <SelectContent>{pharmacies.map((pharmacy) => (<SelectItem key={pharmacy.id} value={pharmacy.pharmacyId.toString()}><span className="font-cairo text-xs">{pharmacy.name}</span></SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="pharmacyName" className="font-cairo text-xs">أو اكتب يدوياً</Label>
                    <Input id="pharmacyName" value={formData.pharmacyName} onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })} placeholder="اسم الصيدلية" className="h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pharmcyAddress" className="font-cairo text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />عنوان الصيدلية *</Label>
                  <Textarea id="pharmcyAddress" value={formData.pharmcyAddress} onChange={(e) => setFormData({ ...formData, pharmcyAddress: e.target.value })} placeholder="ElSalam, El Menia, Minya Governorate 2441207" rows={2} className="text-xs resize-none" />
                </div>
              </div>

              {/* Options - Compact */}
              <div className="grid md:grid-cols-2 gap-2">
                <div className="bg-blue-50/50 p-2 rounded border border-blue-200">
                  <label className="flex items-start gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={formData.isNewProduct} onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })} className="w-3.5 h-3.5 mt-0.5 text-blue-600 rounded" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold font-cairo text-gray-900 block">دواء جديد؟</span>
                      <span className="text-[10px] text-blue-600 font-cairo">ضع علامة كمنتج جديد</span>
                    </div>
                  </label>
                </div>
                <div className="bg-green-50/50 p-2 rounded border border-green-200">
                  <label className="flex items-start gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={formData.discountRating > 0} onChange={(e) => setFormData({ ...formData, discountRating: e.target.checked ? 10 : 0 })} className="w-3.5 h-3.5 mt-0.5 text-green-600 rounded" />
                    <div className="flex-1">
                      <span className="text-xs font-semibold font-cairo text-gray-900 block">تطبيق خصم</span>
                      {formData.discountRating > 0 && (<Input type="number" min="0" max="100" value={formData.discountRating} onChange={(e) => setFormData({ ...formData, discountRating: parseInt(e.target.value) || 0 })} placeholder="%" className="h-7 text-xs mt-1" />)}
                    </div>
                  </label>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="space-y-2 p-3 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-blue-200">
                <Label className="font-cairo text-sm font-bold flex items-center gap-2 text-gray-700">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  صورة الدواء
                </Label>
                
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="relative">
                    <label className={`block ${formData.subabaseORImageUrl ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <div className={`flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-cairo font-bold shadow-md transition-all ${
                        formData.subabaseORImageUrl 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : isUploading
                            ? 'bg-blue-400 text-white cursor-wait'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white hover:shadow-lg cursor-pointer'
                      }`}>
                        {isUploading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>جاري الرفع...</span>
                          </>
                        ) : formData.subabaseORImageUrl ? (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>يوجد صورة بالفعل - احذفها أولاً للتغيير</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            <span>رفع صورة من الجهاز</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading || !!formData.subabaseORImageUrl}
                        className="hidden"
                      />
                    </label>
                    {formData.subabaseORImageUrl && (
                      <p className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-cairo">
                        <span>💡</span>
                        <span>لتغيير الصورة، احذف الصورة الحالية أولاً ثم ارفع صورة جديدة</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Divider */}
                  {!formData.subabaseORImageUrl && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-300"></div>
                      <span className="text-xs text-gray-500 font-cairo">أو</span>
                      <div className="flex-1 h-px bg-gray-300"></div>
                    </div>
                  )}
                  
                  {/* URL Input - Only show if no image */}
                  {!formData.subabaseORImageUrl && (
                    <div className="space-y-2">
                      <Label className="text-xs font-cairo text-gray-600">أضف رابط صورة من الإنترنت</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="imageUrlInput"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 h-9 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget as HTMLInputElement;
                              if (input.value.trim()) {
                                setFormData({ ...formData, subabaseORImageUrl: input.value.trim() });
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            const input = document.getElementById('imageUrlInput') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              setFormData({ ...formData, subabaseORImageUrl: input.value.trim() });
                              input.value = '';
                              toast.success('تم إضافة رابط الصورة');
                            } else {
                              toast.error('الرجاء إدخال رابط صحيح');
                            }
                          }}
                          className="h-9 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-cairo font-bold"
                        >
                          إضافة
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 font-cairo">💡 الصق رابط الصورة واضغط "إضافة" أو Enter</p>
                    </div>
                  )}
                  
                  {/* Display URL - Read only */}
                  {formData.subabaseORImageUrl && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="text-xs text-gray-500 font-cairo">رابط الصورة</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                      <div>
                        <Input 
                          id="imageUrl" 
                          value={formData.subabaseORImageUrl} 
                          readOnly
                          placeholder="الرابط سيظهر هنا بعد رفع الصورة..." 
                          className="w-full h-9 text-sm bg-gray-50 cursor-default" 
                        />
                      </div>
                    </>
                  )}
                  
                  {/* Image Preview */}
                  {formData.subabaseORImageUrl && (
                    <div className="relative w-full h-32 rounded-lg border-2 border-gray-300 overflow-hidden bg-white group">
                      <img 
                        src={formData.subabaseORImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { 
                          const target = e.currentTarget as HTMLImageElement; 
                          target.style.display = 'none'; 
                          const parent = target.parentElement; 
                          if (parent) { 
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-sm text-red-500 font-cairo"><div class="text-center"><div class="text-3xl mb-2">⚠️</div><div>صورة غير صالحة أو الرابط لا يعمل</div><div class="text-xs mt-1">تأكد من صحة الرابط</div></div></div>'; 
                          } 
                        }} 
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={handleRemoveBackground}
                          disabled={isRemovingBg}
                          className="px-2 h-7 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-full flex items-center justify-center gap-1 shadow-lg transition-all text-xs font-cairo font-bold"
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
                      </div>
                      <div className="absolute top-2 left-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const imageUrl = formData.subabaseORImageUrl;
                            const isSupabaseImage = imageUrl.includes('supabase.co/storage');
                            
                            if (window.confirm('هل تريد مسح الصورة؟' + (isSupabaseImage ? '\n\nسيتم حذف الصورة من التخزين فوراً.' : ''))) {
                              // Delete from Supabase Storage only if it's a Supabase image
                              if (isSupabaseImage) {
                                toast.info('جاري حذف الصورة...');
                                const result = await deleteImageFromSupabase(imageUrl);
                                
                                if (result.success) {
                                  toast.success('تم حذف الصورة بنجاح');
                                  setFormData({ ...formData, subabaseORImageUrl: '' });
                                } else {
                                  toast.error(`فشل حذف الصورة: ${result.error || 'خطأ غير معروف'}`);
                                }
                              } else {
                                // Just remove the URL for external images
                                setFormData({ ...formData, subabaseORImageUrl: '' });
                                toast.success('تم إزالة الصورة');
                              }
                            }
                          }}
                          className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)} className="h-8 text-sm font-cairo">إلغاء</Button>
                <Button type="submit" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-cairo h-8 text-sm">{editingMedicine ? 'حفظ' : 'إضافة'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Medicine Details Dialog */}
        <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
          <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                تفاصيل الدواء
              </DialogTitle>
            </DialogHeader>
            {selectedMedicine && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl h-64 flex items-center justify-center overflow-hidden border-2 border-gray-200 shadow-inner">
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
                                <svg class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <Package className="w-24 h-24 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 font-cairo mb-2">
                        {selectedMedicine.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1.5 rounded-full font-mono font-semibold">
                          #{selectedMedicine.code}
                        </span>
                        {selectedMedicine.quantity === 0 ? (
                          <span className="text-xs bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full font-bold">
                            نفذ من المخزون
                          </span>
                        ) : selectedMedicine.quantity < 10 ? (
                          <span className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full font-bold">
                            مخزون منخفض
                          </span>
                        ) : (
                          <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold">
                            متوفر
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedMedicine.description && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-sm text-gray-700 font-cairo leading-relaxed">
                          {selectedMedicine.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 text-center">
                    <p className="text-xs text-green-700 font-cairo font-medium mb-2">السعر</p>
                    <p className="text-2xl font-bold text-green-900">{selectedMedicine.price} ج.م</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 text-center">
                    <p className="text-xs text-blue-700 font-cairo font-medium mb-2">الكمية</p>
                    <p className={`text-2xl font-bold ${
                      selectedMedicine.quantity === 0 ? 'text-red-600' :
                      selectedMedicine.quantity < 10 ? 'text-orange-600' : 
                      'text-blue-900'
                    }`}>
                      {selectedMedicine.quantity}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 text-center">
                    <p className="text-xs text-purple-700 font-cairo font-medium mb-2">المبيعات</p>
                    <p className="text-2xl font-bold text-purple-900">{selectedMedicine.sellingCount || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100 text-center">
                    <p className="text-xs text-yellow-700 font-cairo font-medium mb-2">التقييم</p>
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <p className="text-2xl font-bold text-yellow-900">
                        {selectedMedicine.avgRating?.toFixed(1) || '0.0'}
                      </p>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      ({selectedMedicine.ratingCount || 0} تقييم)
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
                  <Button 
                    onClick={() => {
                      setSelectedMedicine(null);
                      handleOpenAddEdit(selectedMedicine);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-cairo font-bold h-12 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Edit className="w-5 h-5 ml-2" />
                    تعديل المعلومات
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedMedicine(null);
                      handleDelete(selectedMedicine.id);
                    }}
                    className="border-2 border-red-200 hover:bg-red-50 hover:border-red-400 text-red-600 font-cairo font-bold h-12"
                  >
                    <Trash2 className="w-5 h-5 ml-2" />
                    حذف
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
