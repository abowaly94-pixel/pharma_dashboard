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
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMedicines } from '@/hooks/useMedicines';
import { useAuth } from '@/contexts/AuthContext';
import { Medicine } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PharmacistMedicines() {
  const { user } = useAuth();
  const { medicines, isLoading, deleteMedicine } = useMedicines(user?.pharmacyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (medicine.code && medicine.code.includes(searchQuery))
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteMedicine(id);
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
              💊 أدويتي
            </h1>
            <p className="text-gray-600 text-lg">إدارة منتجات صيدليتك بكل سهولة</p>
          </div>
          <Button className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6">
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
                <span className="text-2xl">✅</span>
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
                <span className="text-2xl">❌</span>
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
                ⚠️ تنبيه: يوجد {lowStockMedicines.length} منتج بمخزون منخفض (أقل من 10 وحدات). يرجى إعادة التخزين قريباً!
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
              placeholder="🔍 ابحث عن دواء بالاسم أو الكود..."
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
          {isLoading ? (
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
                  {searchQuery ? '🔍 لم يتم العثور على نتائج' : '📦 لا توجد أدوية حتى الآن'}
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
                    <span>❌</span>
                    <span>نفذ</span>
                  </div>
                ) : medicine.quantity < 10 ? (
                  <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1 animate-pulse">
                    <span>⚠️</span>
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

        {/* Medicine Details Dialog */}
        <Dialog open={!!selectedMedicine} onOpenChange={() => setSelectedMedicine(null)}>
          <DialogContent className="max-w-3xl bg-white/95 backdrop-blur-xl border-2 border-white/40 shadow-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                💊 تفاصيل الدواء
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
                            ❌ نفذ من المخزون
                          </span>
                        ) : selectedMedicine.quantity < 10 ? (
                          <span className="text-xs bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full font-bold">
                            ⚠️ مخزون منخفض
                          </span>
                        ) : (
                          <span className="text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold">
                            ✅ متوفر
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
                    <p className="text-xs text-green-700 font-cairo font-medium mb-2">💰 السعر</p>
                    <p className="text-2xl font-bold text-green-900">{selectedMedicine.price} ج.م</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 text-center">
                    <p className="text-xs text-blue-700 font-cairo font-medium mb-2">📦 الكمية</p>
                    <p className={`text-2xl font-bold ${
                      selectedMedicine.quantity === 0 ? 'text-red-600' :
                      selectedMedicine.quantity < 10 ? 'text-orange-600' : 
                      'text-blue-900'
                    }`}>
                      {selectedMedicine.quantity}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100 text-center">
                    <p className="text-xs text-purple-700 font-cairo font-medium mb-2">📊 المبيعات</p>
                    <p className="text-2xl font-bold text-purple-900">{selectedMedicine.sellingCount || 0}</p>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100 text-center">
                    <p className="text-xs text-yellow-700 font-cairo font-medium mb-2">⭐ التقييم</p>
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
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-cairo font-bold h-12 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Edit className="w-5 h-5 ml-2" />
                    تعديل المعلومات
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleDelete(selectedMedicine.id)}
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
