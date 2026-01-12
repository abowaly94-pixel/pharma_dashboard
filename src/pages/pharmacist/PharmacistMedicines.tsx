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
  const { medicines, isLoading } = useMedicines(user?.pharmacyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    medicine.code.includes(searchQuery)
  );

  const lowStockMedicines = medicines.filter(m => m.quantity < 10);

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
            <h1 className="text-3xl font-bold font-cairo">أدويتي</h1>
            <p className="text-muted-foreground">إدارة منتجات صيدليتك</p>
          </div>
          <Button className="gradient-primary text-primary-foreground font-cairo">
            <Plus className="w-5 h-5 ml-2" />
            إضافة دواء جديد
          </Button>
        </motion.div>

        {/* Low Stock Alert */}
        {lowStockMedicines.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="border-warning bg-warning/10">
              <AlertCircle className="w-5 h-5 text-warning" />
              <AlertDescription className="font-cairo">
                تنبيه: يوجد {lowStockMedicines.length} منتج بمخزون منخفض (أقل من 10 وحدات)
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
        </motion.div>

        {/* Medicines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                <div className="w-full h-40 bg-muted rounded-lg mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : filteredMedicines.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold font-cairo mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground">ابدأ بإضافة منتجات لصيدليتك</p>
            </div>
          ) : (
            filteredMedicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  {medicine.subabaseORImageUrl ? (
                    <img
                      src={medicine.subabaseORImageUrl}
                      alt={medicine.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground/50" />
                    </div>
                  )}
                  {medicine.quantity < 10 && (
                    <span className="absolute top-3 right-3 bg-warning text-warning-foreground text-xs px-2 py-1 rounded-full font-cairo">
                      مخزون منخفض
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{medicine.name}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      #{medicine.code}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-primary">{medicine.price} ج.م</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="text-sm">{medicine.avgRating || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span className="font-cairo">المبيعات: {medicine.sellingCount}</span>
                    <span className={medicine.quantity < 10 ? 'text-warning font-medium' : ''}>
                      الكمية: {medicine.quantity}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 font-cairo"
                      onClick={() => setSelectedMedicine(medicine)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      عرض
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">تفاصيل الدواء</DialogTitle>
            </DialogHeader>
            {selectedMedicine && (
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-muted rounded-lg h-48 flex items-center justify-center overflow-hidden">
                  {selectedMedicine.subabaseORImageUrl ? (
                    <img
                      src={selectedMedicine.subabaseORImageUrl}
                      alt={selectedMedicine.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-16 h-16 text-muted-foreground/50" />
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{selectedMedicine.name}</h3>
                    <p className="text-muted-foreground">#{selectedMedicine.code}</p>
                  </div>
                  <p className="text-muted-foreground font-cairo">{selectedMedicine.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground font-cairo">السعر:</span>
                      <p className="font-bold text-primary text-lg">{selectedMedicine.price} ج.م</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-cairo">الكمية:</span>
                      <p className="font-bold">{selectedMedicine.quantity}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-cairo">المبيعات:</span>
                      <p className="font-bold">{selectedMedicine.sellingCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-cairo">التقييم:</span>
                      <p className="font-bold flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        {selectedMedicine.avgRating || 'N/A'}
                      </p>
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
