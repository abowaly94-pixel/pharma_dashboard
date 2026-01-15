import { useState } from 'react';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Search, Plus, Edit, Trash2, Package, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePharmacyMedicines } from '@/hooks/usePharmacyMedicines';
import { useAuth } from '@/contexts/AuthContext';
import { Medicine, MedicineWithApproval } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deleteImageFromSupabase, uploadImageToSupabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PharmacistMedicines() {
  const { user } = useAuth();
  const { 
    medicines,
    stats: medicineStats, 
    limitInfo,
    isLoading,
    addMedicine: addMedicineFromHook,
    editMedicine,
  } = usePharmacyMedicines(user?.pharmacyId?.toString());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | MedicineWithApproval | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    quantity: 0,
    category: '',
    manufacturer: '',
    subabaseORImageUrl: '',
  });

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (medicine.code && medicine.code.includes(searchQuery))
  );

  const handleOpenAddEdit = (medicine?: Medicine | MedicineWithApproval) => {
    if (medicine) {
      setEditingMedicine(medicine);
      const imageUrl = 'imageUrl' in medicine ? medicine.imageUrl : '';
      setFormData({
        name: medicine.name,
        code: medicine.code,
        description: medicine.description,
        price: medicine.price,
        quantity: medicine.quantity,
        category: medicine.category || '',
        manufacturer: medicine.manufacturer || '',
        subabaseORImageUrl: imageUrl,
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
        subabaseORImageUrl: '',
      });
    }
    setIsAddEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const dataToSave = {
        name: formData.name,
        code: formData.code,
        description: formData.description,
        price: formData.price,
        quantity: formData.quantity,
        category: formData.category,
        manufacturer: formData.manufacturer,
        imageUrl: formData.subabaseORImageUrl,
        expiryDate: new Date(),
      };
      
      if (editingMedicine) {
        await editMedicine(editingMedicine.id, dataToSave);
      } else {
        await addMedicineFromHook(dataToSave);
      }
      setIsAddEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟')) {
      try {
        const medicine = medicines.find(m => m.id === id);
        if (medicine) {
          const imageUrl = 'imageUrl' in medicine ? medicine.imageUrl : '';
          if (imageUrl) {
            await deleteImageFromSupabase(imageUrl);
          }
        }
        await deleteDoc(doc(db, 'medicines', id));
        toast.success('تم حذف الدواء بنجاح');
      } catch (error) {
        console.error('Error deleting medicine:', error);
        toast.error('فشل في حذف الدواء');
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info('جاري رفع الصورة...');

    try {
      const result = await uploadImageToSupabase(file);
      if (result.success && result.url) {
        setFormData({ ...formData, subabaseORImageUrl: result.url });
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold font-cairo">أدويتي</h1>
          <Button onClick={() => handleOpenAddEdit()} className="font-cairo">
            <Plus className="w-4 h-4 ml-2" />
            إضافة دواء جديد
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 font-cairo mb-1">إجمالي الأدوية</p>
              <p className="text-2xl font-bold">{medicines.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 font-cairo mb-1">قيد المراجعة</p>
              <p className="text-2xl font-bold text-orange-600">{medicineStats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 font-cairo mb-1">موافق عليها</p>
              <p className="text-2xl font-bold text-green-600">{medicineStats.approved}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 font-cairo mb-1">مرفوضة</p>
              <p className="text-2xl font-bold text-red-600">{medicineStats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Limit Info */}
        {limitInfo && limitInfo.limit > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-cairo mb-1">حد الأدوية المسموح به</p>
                  <p className="text-2xl font-bold">{medicines.length} / {limitInfo.limit}</p>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-600 font-cairo mb-1">المتبقي</p>
                  <p className={`text-2xl font-bold ${(limitInfo.limit - medicines.length) <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                    {limitInfo.limit - medicines.length}
                  </p>
                </div>
              </div>
              {medicines.length >= limitInfo.limit && (
                <Alert className="mt-3 border-red-200 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="font-cairo text-red-700">
                    تم الوصول للحد الأقصى من الأدوية. لا يمكن إضافة المزيد.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="ابحث عن دواء بالاسم أو الكود..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 font-cairo"
          />
        </div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            [...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-gray-200" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))
          ) : filteredMedicines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 font-cairo mb-2">
                {searchQuery ? 'لم يتم العثور على نتائج' : 'لا توجد أدوية حتى الآن'}
              </h3>
              <p className="text-gray-600 font-cairo">
                {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'ابدأ بإضافة أدوية جديدة'}
              </p>
            </div>
          ) : (
            filteredMedicines.map((medicine) => {
              const medicineStatus = 'status' in medicine ? medicine.status : 'approved';
              const rejectionNotes = 'rejectionNotes' in medicine ? medicine.rejectionNotes : null;
              
              return (
                <Card key={medicine.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="relative h-32 bg-gray-100">
                    {('imageUrl' in medicine && medicine.imageUrl) ? (
                      <img
                        src={medicine.imageUrl}
                        alt={medicine.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      {medicineStatus === 'pending' && (
                        <Badge className="bg-orange-500 text-white text-xs">قيد المراجعة</Badge>
                      )}
                      {medicineStatus === 'rejected' && (
                        <Badge className="bg-red-500 text-white text-xs">مرفوض</Badge>
                      )}
                    </div>
                    
                    {/* Out of Stock */}
                    {medicine.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm bg-red-600 px-3 py-1 rounded-full">نفذت الكمية</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{medicine.name}</h3>
                    <p className="text-xs text-gray-500">#{medicine.code}</p>
                    
                    {medicine.category && (
                      <Badge variant="outline" className="text-xs">{medicine.category}</Badge>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-blue-600">{medicine.price} ج.م</span>
                      <span className={`text-sm font-medium ${medicine.quantity > 10 ? 'text-green-600' : medicine.quantity > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                        الكمية: {medicine.quantity}
                      </span>
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
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleOpenAddEdit(medicine)}
                      >
                        <Edit className="w-3 h-3 ml-1" />
                        تعديل
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(medicine.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="font-cairo">اسم الدواء *</Label>
                  <Input 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="code" className="font-cairo">الكود *</Label>
                  <Input id="code" value={formData.code} readOnly className="bg-gray-50" />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="font-cairo">الوصف</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  rows={3} 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="price" className="font-cairo">السعر (ج.م) *</Label>
                  <Input 
                    id="price" 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={formData.price} 
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="quantity" className="font-cairo">الكمية *</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="0" 
                    value={formData.quantity} 
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })} 
                    required 
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="font-cairo">الفئة</Label>
                  <Input 
                    id="category" 
                    value={formData.category} 
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                    placeholder="مسكنات" 
                  />
                </div>
                <div>
                  <Label htmlFor="manufacturer" className="font-cairo">الشركة</Label>
                  <Input 
                    id="manufacturer" 
                    value={formData.manufacturer} 
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })} 
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="font-cairo">صورة الدواء</Label>
                <div className="space-y-2">
                  <label className={`block ${formData.subabaseORImageUrl ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <div className={`flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-cairo border-2 border-dashed transition-all ${
                      formData.subabaseORImageUrl 
                        ? 'bg-gray-100 text-gray-500 border-gray-300' 
                        : isUploading
                          ? 'bg-blue-50 text-blue-600 border-blue-300'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    }`}>
                      {isUploading ? 'جاري الرفع...' : formData.subabaseORImageUrl ? 'تم رفع الصورة' : 'رفع صورة'}
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
                    <div className="relative w-full h-32 rounded-lg border overflow-hidden bg-gray-50">
                      <img 
                        src={formData.subabaseORImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm('هل تريد حذف الصورة؟')) {
                            if (formData.subabaseORImageUrl.includes('supabase.co/storage')) {
                              await deleteImageFromSupabase(formData.subabaseORImageUrl);
                            }
                            setFormData({ ...formData, subabaseORImageUrl: '' });
                            toast.success('تم حذف الصورة');
                          }
                        }}
                        className="absolute top-2 left-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)} className="font-cairo">
                  إلغاء
                </Button>
                <Button type="submit" className="font-cairo">
                  {editingMedicine ? 'حفظ' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
