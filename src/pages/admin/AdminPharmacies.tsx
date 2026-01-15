import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Building2, Phone, Mail, MapPin, Edit, 
  Power, CheckCircle, XCircle, AlertTriangle, Pill, Eye, EyeOff
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePharmacyManagement } from '@/hooks/usePharmacyManagement';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PharmacyAccount, PharmacyStatus, CreatePharmacyInput } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function AdminPharmacies() {
  const { 
    filteredPharmacies, 
    isLoading, 
    stats,
    filters,
    setFilters,
    createNewPharmacy, 
    changePharmacyStatus,
    changeMedicineLimit,
    updatePharmacyData 
  } = usePharmacyManagement();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyAccount | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyAccount | null>(null);
  const [newLimit, setNewLimit] = useState(100);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CreatePharmacyInput>({
    name: '',
    email: '',
    password: '',
    address: '',
    city: '',
    phoneNumber: '',
    ownerName: '',
    licenseNumber: '',
    medicineLimit: 100,
  });

  const handleOpenDialog = (pharmacy?: PharmacyAccount) => {
    if (pharmacy) {
      setEditingPharmacy(pharmacy);
      setFormData({
        name: pharmacy.name,
        email: pharmacy.email,
        password: '',
        address: pharmacy.address,
        city: pharmacy.city,
        phoneNumber: pharmacy.phoneNumber,
        ownerName: pharmacy.ownerName,
        licenseNumber: pharmacy.licenseNumber,
        medicineLimit: pharmacy.medicineLimit,
      });
    } else {
      setEditingPharmacy(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        city: '',
        phoneNumber: '',
        ownerName: '',
        licenseNumber: '',
        medicineLimit: 100,
      });
    }
    setIsDialogOpen(true);
  };

  const handleOpenLimitDialog = (pharmacy: PharmacyAccount) => {
    setSelectedPharmacy(pharmacy);
    setNewLimit(pharmacy.medicineLimit);
    setIsLimitDialogOpen(true);
  };

  const handleOpenDetailsDialog = (pharmacy: PharmacyAccount) => {
    setSelectedPharmacy(pharmacy);
    setIsDetailsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log form data for debugging
    console.log('Form data being submitted:', formData);
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.address || 
        !formData.city || !formData.phoneNumber || !formData.ownerName || 
        !formData.licenseNumber) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    
    // Validate license number length
    if (formData.licenseNumber.trim().length < 5) {
      toast.error('رقم الترخيص يجب أن يكون 5 أحرف على الأقل');
      return;
    }
    
    // Validate phone number length
    if (formData.phoneNumber.length < 10) {
      toast.error('رقم الهاتف يجب أن يكون 10 أرقام على الأقل');
      return;
    }
    
    if (!editingPharmacy && (!formData.password || formData.password.length < 8)) {
      toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    
    try {
      if (editingPharmacy) {
        await updatePharmacyData(editingPharmacy.id, formData);
      } else {
        const result = await createNewPharmacy(formData);
        if (result) {
          // Reset form
          setFormData({
            name: '',
            email: '',
            password: '',
            address: '',
            city: '',
            phoneNumber: '',
            ownerName: '',
            licenseNumber: '',
            medicineLimit: 100,
          });
          setShowPassword(false);
        }
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving pharmacy:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };

  const handleUpdateLimit = async () => {
    if (selectedPharmacy) {
      await changeMedicineLimit(selectedPharmacy.id, newLimit);
      setIsLimitDialogOpen(false);
    }
  };

  const getStatusBadge = (status: PharmacyStatus) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 ml-1" />نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><XCircle className="w-3 h-3 ml-1" />غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 ml-1" />معلق</Badge>;
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

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الصيدليات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700">نشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">غير نشطة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700">معلقة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.suspended}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن صيدلية..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="pr-10 font-cairo"
            />
          </div>
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) => setFilters({ ...filters, status: value as PharmacyStatus | 'all' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="فلترة حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشطة</SelectItem>
              <SelectItem value="inactive">غير نشطة</SelectItem>
              <SelectItem value="suspended">معلقة</SelectItem>
            </SelectContent>
          </Select>
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
                      {getStatusBadge(pharmacy.status)}
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
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Pill className="w-4 h-4" />
                    <span>الأدوية: {pharmacy.currentMedicineCount} / {pharmacy.medicineLimit}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <div className="text-sm">
                    <span className="text-muted-foreground">المالك: </span>
                    <span className="font-semibold">{pharmacy.ownerName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {pharmacy.status !== 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changePharmacyStatus(pharmacy.id, 'active')}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <CheckCircle className="w-4 h-4 ml-1" />
                      تفعيل
                    </Button>
                  )}
                  {pharmacy.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changePharmacyStatus(pharmacy.id, 'inactive')}
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      إلغاء التفعيل
                    </Button>
                  )}
                  {pharmacy.status !== 'suspended' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changePharmacyStatus(pharmacy.id, 'suspended')}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <AlertTriangle className="w-4 h-4 ml-1" />
                      تعليق
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenLimitDialog(pharmacy)}
                  >
                    <Pill className="w-4 h-4 ml-1" />
                    تعديل الحد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDialog(pharmacy)}
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenDetailsDialog(pharmacy)}
                  >
                    <Eye className="w-4 h-4 ml-1" />
                    التفاصيل
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
              {/* Basic Info */}
              <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  المعلومات الأساسية
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-cairo text-sm font-semibold">اسم الصيدلية *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="أدخل اسم الصيدلية"
                      className="h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="font-cairo text-sm font-semibold">رقم الترخيص *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      required
                      minLength={5}
                      placeholder="رقم الترخيص (5 أحرف على الأقل)"
                      className="h-10 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-cairo text-sm font-semibold">المدينة *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="القاهرة، الإسكندرية..."
                      className="h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medicineLimit" className="font-cairo text-sm font-semibold">حد الأدوية</Label>
                    <Input
                      id="medicineLimit"
                      type="number"
                      min={1}
                      value={formData.medicineLimit}
                      onChange={(e) => setFormData({ ...formData, medicineLimit: parseInt(e.target.value) || 100 })}
                      className="h-10 bg-white"
                    />
                  </div>
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="font-cairo text-sm font-semibold">العنوان بالتفصيل *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      minLength={5}
                      placeholder="الشارع، الحي، المنطقة... (5 أحرف على الأقل)"
                      className="h-10 bg-white"
                    />
                  </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-purple-600" />
                  معلومات الاتصال
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="font-cairo text-sm font-semibold">رقم الهاتف *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                      minLength={10}
                      dir="ltr"
                      placeholder="+20 123 456 7890"
                      className="h-10 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-cairo text-sm font-semibold">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      dir="ltr"
                      placeholder="pharmacy@example.com"
                      className="h-10 bg-white"
                    />
                  </div>
                </div>

                {!editingPharmacy && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="font-cairo text-sm font-semibold">كلمة المرور *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingPharmacy}
                        placeholder="كلمة مرور قوية (8 أحرف على الأقل)"
                        className="h-10 bg-white pl-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      يجب أن تحتوي على 8 أحرف على الأقل
                    </p>
                  </div>
                )}
              </div>

              {/* Owner Info */}
              <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <h3 className="text-base font-bold font-cairo text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-green-600" />
                  معلومات المالك
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName" className="font-cairo text-sm font-semibold">اسم المالك *</Label>
                  <Input
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                    placeholder="الاسم الكامل للمالك"
                    className="h-10 bg-white"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-500">
                  {editingPharmacy ? 'حفظ التعديلات' : 'إضافة الصيدلية'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Medicine Limit Dialog */}
        <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cairo">تعديل حد الأدوية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                الصيدلية: <span className="font-semibold">{selectedPharmacy?.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                الحد الحالي: <span className="font-semibold">{selectedPharmacy?.medicineLimit}</span> دواء
              </p>
              <p className="text-sm text-muted-foreground">
                الأدوية الحالية: <span className="font-semibold">{selectedPharmacy?.currentMedicineCount}</span> دواء
              </p>
              <div className="space-y-2">
                <Label htmlFor="newLimit">الحد الجديد</Label>
                <Input
                  id="newLimit"
                  type="number"
                  min={selectedPharmacy?.currentMedicineCount || 1}
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseInt(e.target.value) || 100)}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsLimitDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleUpdateLimit}>
                  حفظ
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-cairo">تفاصيل الصيدلية</DialogTitle>
            </DialogHeader>
            {selectedPharmacy && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedPharmacy.name}</h3>
                    {getStatusBadge(selectedPharmacy.status)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">البريد الإلكتروني:</span>
                    <p className="font-semibold" dir="ltr">{selectedPharmacy.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">رقم الهاتف:</span>
                    <p className="font-semibold" dir="ltr">{selectedPharmacy.phoneNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المدينة:</span>
                    <p className="font-semibold">{selectedPharmacy.city}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">رقم الترخيص:</span>
                    <p className="font-semibold">{selectedPharmacy.licenseNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">العنوان:</span>
                    <p className="font-semibold">{selectedPharmacy.address}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">المالك:</span>
                    <p className="font-semibold">{selectedPharmacy.ownerName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">حد الأدوية:</span>
                    <p className="font-semibold">{selectedPharmacy.currentMedicineCount} / {selectedPharmacy.medicineLimit}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">التقييم:</span>
                    <p className="font-semibold">{selectedPharmacy.rating} ⭐</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">إجمالي الطلبات:</span>
                    <p className="font-semibold">{selectedPharmacy.totalOrders}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                    <p className="font-semibold">{selectedPharmacy.createdAt.toLocaleDateString('ar-EG')}</p>
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
