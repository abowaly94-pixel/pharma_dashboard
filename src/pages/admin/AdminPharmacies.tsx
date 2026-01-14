import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Building2, Phone, Mail, MapPin, Edit, Trash2, Power } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePharmacies } from '@/hooks/usePharmacies';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pharmacy } from '@/types';

export default function AdminPharmacies() {
  const { pharmacies, isLoading, addPharmacy, updatePharmacy, deletePharmacy, togglePharmacyStatus } = usePharmacies();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<Pharmacy | null>(null);
  const [formData, setFormData] = useState({
    pharmacyId: 0,
    name: '',
    address: '',
    city: '',
    phoneNumber: '',
    email: '',
    ownerName: '',
    licenseNumber: '',
    isActive: true
  });

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pharmacy.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenDialog = (pharmacy?: Pharmacy) => {
    if (pharmacy) {
      setEditingPharmacy(pharmacy);
      setFormData({
        pharmacyId: pharmacy.pharmacyId,
        name: pharmacy.name,
        address: pharmacy.address,
        city: pharmacy.city,
        phoneNumber: pharmacy.phoneNumber,
        email: pharmacy.email,
        ownerName: pharmacy.ownerName,
        licenseNumber: pharmacy.licenseNumber,
        isActive: pharmacy.isActive
      });
    } else {
      setEditingPharmacy(null);
      setFormData({
        pharmacyId: pharmacies.length + 1,
        name: '',
        address: '',
        city: '',
        phoneNumber: '',
        email: '',
        ownerName: '',
        licenseNumber: '',
        isActive: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPharmacy) {
        await updatePharmacy(editingPharmacy.id, formData);
      } else {
        await addPharmacy({
          ...formData,
          rating: 0,
          totalOrders: 0,
          totalMedicines: 0
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving pharmacy:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الصيدلية؟')) {
      await deletePharmacy(id);
    }
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
            <h1 className="text-3xl font-bold font-cairo">إدارة الصيدليات</h1>
            <p className="text-muted-foreground">إدارة جميع الصيدليات المسجلة في النظام</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="font-cairo">
            <Plus className="w-4 h-4 ml-2" />
            إضافة صيدلية جديدة
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
              placeholder="ابحث عن صيدلية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
        </motion.div>

        {/* Pharmacies Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : filteredPharmacies.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد صيدليات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharmacy, index) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="stat-card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold font-cairo">{pharmacy.name}</h3>
                      <Badge variant={pharmacy.isActive ? 'default' : 'secondary'}>
                        {pharmacy.isActive ? 'نشط' : 'متوقف'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{pharmacy.city} - {pharmacy.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span dir="ltr">{pharmacy.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span dir="ltr">{pharmacy.email}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">المالك: </span>
                    <span className="font-semibold">{pharmacy.ownerName}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => togglePharmacyStatus(pharmacy.id, !pharmacy.isActive)}
                    className="flex-1"
                  >
                    <Power className="w-4 h-4 ml-1" />
                    {pharmacy.isActive ? 'إيقاف' : 'تفعيل'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(pharmacy)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(pharmacy.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo">
                {editingPharmacy ? 'تعديل الصيدلية' : 'إضافة صيدلية جديدة'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section 1: Basic Info */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  المعلومات الأساسية
                </h3>
                
                <div className="grid grid-cols-[2fr,1fr] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-cairo text-sm font-semibold text-gray-700">اسم الصيدلية *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="أدخل اسم الصيدلية"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pharmacyId" className="font-cairo text-sm font-semibold text-gray-700">رقم الصيدلية</Label>
                    <Input
                      id="pharmacyId"
                      value={formData.pharmacyId}
                      readOnly
                      disabled
                      className="h-10 bg-gray-100 cursor-not-allowed text-gray-600 border-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-cairo text-sm font-semibold text-gray-700">المدينة *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="القاهرة، الإسكندرية..."
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="font-cairo text-sm font-semibold text-gray-700">رقم الترخيص *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      required
                      placeholder="رقم الترخيص"
                      className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="font-cairo text-sm font-semibold text-gray-700 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    العنوان بالتفصيل *
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="الشارع، الحي، المنطقة..."
                    className="h-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section 2: Contact Info */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  معلومات الاتصال
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="font-cairo text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Phone className="w-4 h-4 text-purple-600" />
                      رقم الهاتف *
                    </Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                      dir="ltr"
                      placeholder="+20 123 456 7890"
                      className="h-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-cairo text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Mail className="w-4 h-4 text-purple-600" />
                      البريد الإلكتروني *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      dir="ltr"
                      placeholder="pharmacy@example.com"
                      className="h-10 bg-white border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Owner Info */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  معلومات المالك
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="font-cairo text-sm font-semibold text-gray-700">اسم المالك *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                    placeholder="الاسم الكامل للمالك"
                    className="h-10 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Section 4: Status */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Power className="w-5 h-5 text-amber-600" />
                  حالة الصيدلية
                </h3>
                
                <div className="bg-white p-3 rounded-lg border-2 border-amber-200 hover:border-amber-400 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-bold font-cairo text-gray-900 block">
                        صيدلية نشطة
                      </span>
                      <span className="text-xs text-amber-600 font-cairo">
                        {formData.isActive ? 'الصيدلية تعمل حالياً' : 'الصيدلية متوقفة مؤقتاً'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-10 px-6 font-cairo font-semibold border-2 hover:bg-gray-100"
                >
                  إلغاء
                </Button>
                <Button 
                  type="submit"
                  className="h-10 px-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  {editingPharmacy ? '💾 حفظ التعديلات' : '➕ إضافة الصيدلية'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
