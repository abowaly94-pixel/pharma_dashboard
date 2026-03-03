import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Edit, Package, Star, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMedicines } from '@/hooks/useMedicines';
import { useCategories } from '@/hooks/useCategories';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MedicineImage } from '@/components/ui/medicine-image';

export default function PharmacistMedicines() {
  const { user } = useAuth();
  const hasPharmacyId = user?.pharmacyId !== undefined && user?.pharmacyId !== null;
  const { medicines, isLoading, updateMedicine, searchQuery, setSearchQuery } = useMedicines(
    user?.pharmacyId,
    { enabled: hasPharmacyId }
  );
  const { categories, isLoading: categoriesLoading } = useCategories(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [formData, setFormData] = useState({
    price: 0,
    quantity: 0,
    discountRating: 0,
  });

  // Filter medicines by category
  const filteredMedicines = selectedCategory === 'all' 
    ? medicines 
    : medicines.filter(m => m.category === selectedCategory);

  const handleOpenEdit = (medicine: Medicine) => {
    setEditingMedicine(medicine);
    setFormData({
      price: medicine.price,
      quantity: medicine.quantity,
      discountRating: medicine.discountRating,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMedicine) return;

    try {
      await updateMedicine(editingMedicine.id, formData);
      toast.success('تم تحديث الدواء بنجاح');
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating medicine:', error);
      toast.error('حدث خطأ أثناء التحديث');
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
            <h1 className="text-3xl font-bold font-cairo">أدوية الصيدلية</h1>
            <p className="text-muted-foreground">عرض وتحديث أدوية صيدليتك ({filteredMedicines.length} دواء)</p>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px] font-cairo">
                <SelectValue placeholder="جميع الفئات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categoriesLoading ? (
                  <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>
                ) : categories.length === 0 ? (
                  <div className="p-2 text-center text-sm text-gray-500">لا توجد تصنيفات</div>
                ) : (
                  categories.map((cat) => (
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
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              جاري تحميل الأدوية...
            </div>
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد أدوية</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'لم يتم العثور على أي أدوية في صيدليتك'
                : `لا توجد أدوية في فئة "${selectedCategory}"`
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

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex flex-col">
                      {medicine.discountRating > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-400 line-through">{medicine.price.toFixed(2)} ج.م</span>
                          <span className="text-lg font-bold text-green-600">
                            {(medicine.price - (medicine.price * medicine.discountRating / 100)).toFixed(2)} ج.م
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
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs h-8"
                      onClick={() => handleOpenEdit(medicine)}
                    >
                      <Edit className="w-3 h-3 ml-1" />
                      تعديل
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">تعديل الدواء</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="font-cairo">السعر (ج.م) *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount" className="font-cairo">نسبة الخصم (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountRating}
                  onChange={(e) => setFormData({ ...formData, discountRating: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="gradient-primary">
                  تحديث
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
