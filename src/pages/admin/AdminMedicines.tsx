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
import { toast } from 'sonner';

export default function AdminMedicines() {
  const { medicines, isLoading, addMedicine, updateMedicine, deleteMedicine, searchQuery, setSearchQuery } = useMedicines();
  const { pharmacies } = usePharmacies();
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    quantity: 0,
    pharmacyId: 0,
    pharmacyName: '',
    pharmcyAddress: '',
    category: '',
    manufacturer: '',
    subabaseImageUrl: '',
    subabaseORImageUrl: '', // الصورة الأصلية قبل إزالة الخلفية
    avgRating: 0,
    ratingCount: 0,
    discountRating: 0,
    isNewProduct: false,
    sellingCount: 0,
    reviews: []
  });

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
        code: `MED-${Date.now()}`,
        description: '',
        price: 0,
        quantity: 0,
        pharmacyId: defaultPharmacy?.pharmacyId || 0,
        pharmacyName: defaultPharmacy?.name || '',
        pharmcyAddress: defaultPharmacy ? `${defaultPharmacy.address}, ${defaultPharmacy.city}` : '',
        category: '',
        manufacturer: '',
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
    
    // التحقق من وجود عنوان الصيدلية
    if (!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 5) {
      toast.error('⚠️ يجب إدخال عنوان الصيدلية بالتفصيل (5 أحرف على الأقل)');
      return;
    }
    
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
      
      // حفظ البيانات
      const dataToSave = {
        ...formData,
      };
      
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
    toast.info('جاري رفع الصورة...');
    console.log('📤 Uploading file:', file.name);

    try {
      const result = await uploadImageToSupabase(file);
      
      if (result.success && result.url) {
        setFormData({ ...formData, subabaseImageUrl: result.url });
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
      // Remove background
      const result = await removeImageBackground(formData.subabaseImageUrl);
      
      if (!result.success || !result.blob) {
        toast.error(result.error || 'فشل إزالة الخلفية');
        return;
      }

      // Convert blob to file
      const file = new File([result.blob], 'medicine-no-bg.png', { type: 'image/png' });
      
      // رفع الصورة الجديدة بدون حذف القديمة
      const uploadResult = await uploadImageToSupabase(file);
      
      if (uploadResult.success && uploadResult.url) {
        // حفظ الصورة الأصلية في subabaseORImageUrl إذا لم تكن محفوظة
        const originalImageUrl = formData.subabaseORImageUrl || formData.subabaseImageUrl;
        
        setFormData({ 
          ...formData, 
          subabaseImageUrl: uploadResult.url,
          subabaseORImageUrl: originalImageUrl
        });
        
        toast.success('تم إزالة الخلفية ورفع الصورة بنجاح! 🎉\nيمكنك حذف الصورة إذا لم تعجبك');
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
            <p className="text-muted-foreground">عرض وإدارة جميع الأدوية في النظام ({medicines.length} دواء)</p>
          </div>
          <Button onClick={() => handleOpenAddEdit()} className="gradient-primary text-primary-foreground font-cairo">
            <Plus className="w-5 h-5 ml-2" />
            إضافة دواء جديد
          </Button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم، الكود، الصيدلية، الفئة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
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
        ) : medicines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد أدوية</h3>
            <p className="text-muted-foreground">لم يتم العثور على أي أدوية في قاعدة البيانات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {medicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-32 bg-muted overflow-hidden rounded-t-xl">
                  {((medicine as any).subabaseImageUrl || medicine.subabaseORImageUrl) ? (
                    <img
                      src={(medicine as any).subabaseImageUrl || medicine.subabaseORImageUrl}
                      alt={medicine.name}
                      className="w-full h-full object-contain bg-white p-2 group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        // إذا فشلت الصورة، أخفيها واعرض أيقونة
                        const target = e.currentTarget as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                              </svg>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                      <Package className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {medicine.isNewProduct && (
                      <Badge className="bg-green-500 text-white text-xs px-2 py-1">جديد</Badge>
                    )}
                    {medicine.discountRating > 0 && (
                      <Badge variant="destructive" className="text-xs px-2 py-1">-{medicine.discountRating}%</Badge>
                    )}
                  </div>
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
                          <span className="text-sm text-gray-400 line-through">{medicine.price} ج.م</span>
                          <span className="text-lg font-bold text-blue-600">
                            {(medicine.price * (1 - medicine.discountRating / 100)).toFixed(2)} ج.م
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-bold text-blue-600">{medicine.price} ج.م</span>
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
        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogContent 
            className="max-w-3xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={() => setIsAddEditDialogOpen(false)}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </DialogTitle>
            </DialogHeader>
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
                  <Label htmlFor="description" className="font-cairo text-sm font-semibold text-gray-700">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="أضف وصف تفصيلي للدواء..."
                    className="text-sm resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
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

              {/* Section 2: Pharmacy Info */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  معلومات الصيدلية
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="pharmacyName" className="font-cairo text-sm font-semibold text-gray-700">
                    اسم الصيدلية (اكتب أو اختر) *
                  </Label>
                  <Autocomplete
                    options={pharmacies
                      .map((pharmacy) => ({
                        value: pharmacy.pharmacyId.toString(),
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
                      const selectedPharmacy = pharmacies.find(p => p.pharmacyId.toString() === option.value);
                      if (selectedPharmacy) {
                        setFormData({
                          ...formData,
                          pharmacyId: selectedPharmacy.pharmacyId,
                          pharmacyName: selectedPharmacy.name,
                          pharmcyAddress: `${selectedPharmacy.address}, ${selectedPharmacy.city}`
                        });
                      }
                    }}
                    placeholder="اكتب اسم الصيدلية..."
                    className="h-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500">
                    💡 اكتب لرؤية الاقتراحات أو أدخل اسم جديد
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pharmcyAddress" className="font-cairo text-sm font-semibold text-red-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-red-600" />
                    عنوان الصيدلية بالتفصيل *
                    {(!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 5) && (
                      <span className="text-xs text-red-500">(مطلوب - 5 أحرف على الأقل)</span>
                    )}
                  </Label>
                  <Textarea
                    id="pharmcyAddress"
                    value={formData.pharmcyAddress}
                    onChange={(e) => setFormData({ ...formData, pharmcyAddress: e.target.value })}
                    placeholder="الشارع، المدينة، المحافظة، الرمز البريدي"
                    rows={2}
                    required
                    className={`text-sm resize-none ${!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 5 ? 'border-red-500 focus:border-red-600 bg-red-50' : 'border-green-500 bg-white'} focus:ring-purple-500`}
                    dir="rtl"
                  />
                  <p className="text-xs text-red-600 font-bold">
                    ⚠️ يجب إدخال العنوان بالكامل (الشارع، المدينة، المحافظة)
                  </p>
                </div>
              </div>

              {/* Section 3: Additional Options */}
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

              {/* Section 4: Medicine Image */}
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
                      <div className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg text-sm font-cairo font-bold shadow-md transition-all ${
                        formData.subabaseImageUrl 
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
                            <span>📤 رفع صورة من الجهاز</span>
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
                  
                  {/* URL Input - Always visible */}
                  <div className="space-y-2">
                    <Label className="text-sm font-cairo font-semibold text-gray-700">🔗 أضف رابط صورة من الإنترنت</Label>
                    <Input 
                      id="imageUrlInputAdmin"
                      type="url"
                      value={formData.subabaseImageUrl}
                      onChange={(e) => {
                        setFormData({ ...formData, subabaseImageUrl: e.target.value });
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="h-10 bg-white border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                    />
                  </div>
                  
                  {/* Image Preview - Shows when URL is valid */}
                  {formData.subabaseImageUrl && formData.subabaseImageUrl.trim() && (
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
                        <img 
                          src={formData.subabaseImageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-contain p-3"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector('.error-message')) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'error-message w-full h-full flex items-center justify-center text-sm text-red-500 font-cairo';
                              errorDiv.innerHTML = '<div class="text-center"><div class="text-4xl mb-2">⚠️</div><div class="font-bold">صورة غير صالحة</div><div class="text-xs mt-1">تأكد من صحة الرابط</div></div>';
                              parent.appendChild(errorDiv);
                            }
                          }}
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
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
                                if (isSupabaseImage) {
                                  toast.info('جاري حذف الصورة...');
                                  const result = await deleteImageFromSupabase(imageUrl);

                                  if (result.success) {
                                    toast.success('تم حذف الصورة بنجاح');
                                    
                                    // إذا كان فيه صورة أصلية، نرجع لها
                                    if (hasOriginal) {
                                      setFormData({ ...formData, subabaseImageUrl: originalImageUrl });
                                    } else {
                                      setFormData({ ...formData, subabaseImageUrl: '', subabaseORImageUrl: '' });
                                    }
                                  } else {
                                    toast.error(`فشل حذف الصورة: ${result.error || 'خطأ غير معروف'}`);
                                  }
                                } else {
                                  // إذا كان فيه صورة أصلية، نرجع لها
                                  if (hasOriginal) {
                                    setFormData({ ...formData, subabaseImageUrl: originalImageUrl });
                                  } else {
                                    setFormData({ ...formData, subabaseImageUrl: '', subabaseORImageUrl: '' });
                                  }
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
                  onClick={() => setIsAddEditDialogOpen(false)}
                  className="h-10 px-6 font-cairo font-semibold border-2 hover:bg-gray-100"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  disabled={!formData.subabaseImageUrl || !formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 5}
                  title={
                    !formData.subabaseImageUrl 
                      ? 'يجب رفع صورة للدواء أولاً' 
                      : (!formData.pharmcyAddress || formData.pharmcyAddress.trim().length < 5)
                      ? 'يجب إدخال عنوان الصيدلية بالتفصيل (5 أحرف على الأقل)'
                      : ''
                  }
                  className="h-10 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingMedicine ? '💾 حفظ التعديلات' : '➕ إضافة الدواء'}
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
                    <p className="text-muted-foreground font-cairo">{selectedMedicine.description || 'لا يوجد وصف'}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground font-cairo">السعر:</span>
                        {selectedMedicine.discountRating > 0 ? (
                          <div className="flex flex-col">
                            <p className="text-sm text-gray-400 line-through">{selectedMedicine.price} ج.م</p>
                            <p className="font-bold text-primary text-xl">
                              {(selectedMedicine.price * (1 - selectedMedicine.discountRating / 100)).toFixed(2)} ج.م
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-primary text-xl">{selectedMedicine.price} ج.م</p>
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
                        <span className="text-muted-foreground font-cairo">التقييم:</span>
                        <p className="font-bold flex items-center gap-1">
                          <Star className="w-4 h-4 text-warning fill-warning" />
                          {selectedMedicine.avgRating.toFixed(1)} ({selectedMedicine.ratingCount})
                        </p>
                      </div>
                      {selectedMedicine.manufacturer && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground font-cairo">الشركة المصنعة:</span>
                          <p className="font-bold">{selectedMedicine.manufacturer}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground font-cairo">المبيعات:</span>
                        <p className="font-bold">{selectedMedicine.sellingCount}</p>
                      </div>
                      {selectedMedicine.discountRating > 0 && (
                        <div>
                          <span className="text-muted-foreground font-cairo">الخصم:</span>
                          <p className="font-bold text-destructive">{selectedMedicine.discountRating}%</p>
                        </div>
                      )}
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
