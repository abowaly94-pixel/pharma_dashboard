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
  Image as ImageIcon
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMedicines } from '@/hooks/useMedicines';
import { Medicine } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MedicinesDiagnostic } from '@/components/utils/MedicinesDiagnostic';

export default function AdminMedicines() {
  const { medicines, isLoading, addMedicine, updateMedicine, deleteMedicine, searchQuery, setSearchQuery } = useMedicines();
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    quantity: 0,
    pharmacyId: 1,
    pharmacyName: 'صيدلية النخيل',
    pharmcyAddress: 'القاهرة',
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
        subabaseORImageUrl: medicine.subabaseORImageUrl,
        avgRating: medicine.avgRating,
        ratingCount: medicine.ratingCount,
        discountRating: medicine.discountRating,
        isNewProduct: medicine.isNewProduct,
        sellingCount: medicine.sellingCount,
        reviews: medicine.reviews
      });
    } else {
      setEditingMedicine(null);
      setFormData({
        name: '',
        code: `MED-${Date.now()}`,
        description: '',
        price: 0,
        quantity: 0,
        pharmacyId: 1,
        pharmacyName: 'صيدلية النخيل',
        pharmcyAddress: 'القاهرة',
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
    try {
      if (editingMedicine) {
        await updateMedicine(editingMedicine.id, formData);
      } else {
        await addMedicine(formData);
      }
      setIsAddEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving medicine:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟')) {
      await deleteMedicine(id);
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

        {/* تشخيص سريع - يظهر فقط إذا لم توجد أدوية */}
        {!isLoading && medicines.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <MedicinesDiagnostic 
              onMedicinesAdded={() => {
                // إعادة تحميل الصفحة أو تحديث البيانات
                setRefreshKey(prev => prev + 1);
                window.location.reload();
              }} 
            />
          </motion.div>
        )}

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
            <p className="text-muted-foreground mb-4">لم يتم العثور على أي أدوية في قاعدة البيانات</p>
            <div className="space-y-2">
              <Button 
                onClick={() => handleOpenAddEdit()} 
                className="gradient-primary text-primary-foreground font-cairo"
              >
                <Plus className="w-4 h-4 ml-2" />
                إضافة أول دواء
              </Button>
              <div className="text-sm text-muted-foreground">
                أو <a href="/seed" className="text-primary hover:underline">إضافة بيانات تجريبية</a>
              </div>
            </div>
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
                      <span className="text-lg font-bold text-blue-600">{medicine.price} ج.م</span>
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                {editingMedicine ? 'تعديل الدواء' : 'إضافة دواء جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-cairo">اسم الدواء *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code" className="font-cairo">الكود *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-cairo">الوصف</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
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
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <Label htmlFor="discountRating" className="font-cairo">نسبة الخصم (%)</Label>
                  <Input
                    id="discountRating"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountRating}
                    onChange={(e) => setFormData({ ...formData, discountRating: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-cairo">الفئة</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="مثال: مسكنات، مضادات حيوية"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer" className="font-cairo">الشركة المصنعة</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  />
                </div>
              </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="font-cairo">رابط الصورة</Label>
                  <div className="flex gap-2">
                    <Input
                      id="imageUrl"
                      value={formData.subabaseORImageUrl}
                      onChange={(e) => setFormData({ ...formData, subabaseORImageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <ImageIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.subabaseORImageUrl && (
                    <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={formData.subabaseORImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-gray-500">صورة غير صالحة</div>';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isNewProduct}
                    onChange={(e) => setFormData({ ...formData, isNewProduct: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-cairo">منتج جديد</span>
                </label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">
                  {editingMedicine ? 'حفظ التعديلات' : 'إضافة الدواء'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
          <DialogContent className="max-w-3xl" dir="rtl">
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
                        <p className="font-bold text-primary text-xl">{selectedMedicine.price} ج.م</p>
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
