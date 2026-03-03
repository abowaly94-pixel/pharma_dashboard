import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Building2, Phone, Mail, MapPin, Edit,
  CheckCircle, XCircle, AlertTriangle, Pill, Eye, EyeOff, MoreVertical, KeyRound, Trash2, Settings, AlertCircle
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
    updatePharmacyData,
    resetPharmacyPassword,
    deletePharmacy
  } = usePharmacyManagement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<PharmacyAccount | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyAccount | null>(null);
  const [pendingStatus, setPendingStatus] = useState<PharmacyStatus | null>(null);
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



  const handleOpenStatusDialog = (pharmacy: PharmacyAccount, status: PharmacyStatus) => {
    setSelectedPharmacy(pharmacy);
    setPendingStatus(status);
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (selectedPharmacy && pendingStatus) {
      await changePharmacyStatus(selectedPharmacy.id, pendingStatus);

      setIsStatusDialogOpen(false);
      setSelectedPharmacy(null);
      setPendingStatus(null);
    }
  };

  const handleOpenResetPasswordDialog = (pharmacy: PharmacyAccount) => {
    setSelectedPharmacy(pharmacy);
    setIsResetPasswordDialogOpen(true);
  };

  const handleOpenDeleteDialog = (pharmacy: PharmacyAccount) => {
    setSelectedPharmacy(pharmacy);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedPharmacy) {
      console.log('🗑️ Confirming delete for pharmacy:', selectedPharmacy.id, selectedPharmacy.name);
      const result = await deletePharmacy(selectedPharmacy.id);
      console.log('📦 Delete result:', result);
      if (result?.success) {
        setIsDeleteDialogOpen(false);
        setSelectedPharmacy(null);
      }
    }
  };

  const handleConfirmResetPassword = async () => {
    if (selectedPharmacy) {
      const success = await resetPharmacyPassword(selectedPharmacy.email);
      if (success) {
        setIsResetPasswordDialogOpen(false);
        setSelectedPharmacy(null);
      }
    }
  };

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
        medicineLimit: 0,
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
      !formData.licenseNumber || !formData.medicineLimit) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    // Validate address length
    if (formData.address.trim().length < 10) {
      toast.error('⚠️ عنوان الصيدلية يجب أن يكون 10 أحرف على الأقل');
      return;
    }

    // Validate license number length
    if (formData.licenseNumber.trim().length < 5) {
      toast.error('رقم الترخيص يجب أن يكون 5 أحرف على الأقل');
      return;
    }

    // Validate medicine limit
    if (formData.medicineLimit <= 0) {
      toast.error('الحد الأقصى للأدوية يجب أن يكون أكبر من صفر');
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
        return <Badge className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="w-3 h-3 ml-1" />نشط</Badge>;
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-200"><XCircle className="w-3 h-3 ml-1" />غير نشط</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 ml-1" />معلق</Badge>;
    }
  };

  const getStatusText = (status: PharmacyStatus) => {
    switch (status) {
      case 'active': return 'تفعيل';
      case 'inactive': return 'إلغاء التفعيل';
      case 'suspended': return 'تعليق';
    }
  };

  const getStatusDescription = (status: PharmacyStatus, pharmacyName: string) => {
    switch (status) {
      case 'active':
        return `سيتم تفعيل صيدلية "${pharmacyName}" وستتمكن من تسجيل الدخول وإدارة الأدوية.`;
      case 'inactive':
        return `سيتم إلغاء تفعيل صيدلية "${pharmacyName}" ولن تتمكن من تسجيل الدخول.`;
      case 'suspended':
        return `سيتم تعليق صيدلية "${pharmacyName}" مؤقتاً. يمكنك إعادة تفعيلها لاحقاً.`;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPharmacies.map((pharmacy, index) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-cairo">{pharmacy.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{pharmacy.city}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleOpenDetailsDialog(pharmacy)}>
                            <Eye className="w-4 h-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenDialog(pharmacy)}>
                            <Edit className="w-4 h-4 ml-2" />
                            تعديل البيانات
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenLimitDialog(pharmacy)}>
                            <Pill className="w-4 h-4 ml-2" />
                            تعديل حد الأدوية
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenResetPasswordDialog(pharmacy)}>
                            <KeyRound className="w-4 h-4 ml-2" />
                            إعادة تعيين كلمة المرور
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleOpenDeleteDialog(pharmacy)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            حذف الصيدلية نهائياً
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {pharmacy.status !== 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleOpenStatusDialog(pharmacy, 'active')}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 ml-2" />
                              تفعيل الصيدلية
                            </DropdownMenuItem>
                          )}
                          {pharmacy.status === 'active' && (
                            <DropdownMenuItem
                              onClick={() => handleOpenStatusDialog(pharmacy, 'inactive')}
                              className="text-gray-600"
                            >
                              <XCircle className="w-4 h-4 ml-2" />
                              إلغاء التفعيل
                            </DropdownMenuItem>
                          )}
                          {pharmacy.status !== 'suspended' && (
                            <DropdownMenuItem
                              onClick={() => handleOpenStatusDialog(pharmacy, 'suspended')}
                              className="text-red-600"
                            >
                              <AlertTriangle className="w-4 h-4 ml-2" />
                              تعليق الصيدلية
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الحالة</span>
                      {getStatusBadge(pharmacy.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate" dir="ltr">{pharmacy.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span dir="ltr">{pharmacy.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{pharmacy.address}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">الأدوية</span>
                        <span className="font-semibold">
                          {pharmacy.currentMedicineCount} / {pharmacy.medicineLimit}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pharmacy.currentMedicineCount >= pharmacy.medicineLimit
                            ? 'bg-red-500'
                            : pharmacy.currentMedicineCount >= pharmacy.medicineLimit * 0.8
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            }`}
                          style={{
                            width: `${Math.min((pharmacy.currentMedicineCount / pharmacy.medicineLimit) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
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
              medicineLimit: 0,
            });
            setShowPassword(false);
          }
        }}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                {editingPharmacy ? 'تعديل بيانات الصيدلية' : 'إضافة صيدلية جديدة'}
              </DialogTitle>
              <DialogDescription>
                {editingPharmacy
                  ? 'قم بتعديل البيانات المطلوبة ثم احفظ التغييرات'
                  : 'املأ جميع البيانات المطلوبة لإنشاء حساب صيدلية جديد'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-base font-bold text-blue-900 font-cairo flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  المعلومات الأساسية
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">اسم الصيدلية *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="text-sm font-semibold">رقم الترخيص *</Label>
                    <Input
                      id="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      required
                      minLength={5}
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-sm font-semibold">اسم المالك *</Label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-semibold">المدينة *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      className="bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">عنوان الصيدلية بالتفصيل *</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    minLength={10}
                    className={`font-cairo bg-white ${!formData.address || formData.address.trim().length < 10 ? 'border-red-400' : 'border-green-500'}`}
                    dir="rtl"
                  />
                  <p className="text-xs text-orange-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    يجب إدخال العنوان بالكامل (الشارع، المدينة، المحافظة)
                  </p>
                </div>
              </div>

              {/* Contact Info Section */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="text-base font-bold text-green-900 font-cairo flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  معلومات الاتصال
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-semibold">رقم الهاتف *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                      minLength={10}
                      dir="ltr"
                      className="bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold">البريد الإلكتروني *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={!!editingPharmacy}
                      dir="ltr"
                      className="bg-white"
                    />
                  </div>
                </div>

                {!editingPharmacy && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-semibold">كلمة المرور *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!editingPharmacy}
                        minLength={8}
                        className="pl-10 bg-white"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings Section */}
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="text-base font-bold text-purple-900 font-cairo flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  الإعدادات
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="medicineLimit" className="text-sm font-semibold">الحد الأقصى للأدوية *</Label>
                  <Input
                    id="medicineLimit"
                    type="number"
                    min={1}
                    required
                    value={formData.medicineLimit || ''}
                    onChange={(e) => setFormData({ ...formData, medicineLimit: parseInt(e.target.value) || 0 })}
                    className="bg-white"
                  />
                  <p className="text-xs text-muted-foreground">
                    عدد الأدوية التي يمكن للصيدلية إضافتها
                  </p>
                </div>
              </div>

              {/* Footer */}
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
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
                    medicineLimit: 0,
                  });
                  setShowPassword(false);
                }}>
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !formData.name ||
                    !formData.email ||
                    !formData.address || formData.address.trim().length < 10 ||
                    !formData.city ||
                    !formData.phoneNumber ||
                    !formData.ownerName ||
                    !formData.licenseNumber ||
                    !formData.medicineLimit ||
                    (!editingPharmacy && (!formData.password || formData.password.length < 8))
                  }
                  title={
                    !formData.address || formData.address.trim().length < 10
                      ? 'يجب إدخال عنوان الصيدلية بالكامل (10 أحرف على الأقل)'
                      : ''
                  }
                >
                  {editingPharmacy ? 'حفظ التعديلات' : 'إضافة الصيدلية'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Status Change Confirmation Dialog */}
        <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo">
                تأكيد {pendingStatus && getStatusText(pendingStatus)}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {selectedPharmacy && pendingStatus && getStatusDescription(pendingStatus, selectedPharmacy.name)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmStatusChange}>
                تأكيد
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Medicine Limit Dialog */}
        <Dialog open={isLimitDialogOpen} onOpenChange={setIsLimitDialogOpen}>
          <DialogContent
            className="max-w-md"
            onPointerDownOutside={() => setIsLimitDialogOpen(false)}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo">تعديل حد الأدوية</DialogTitle>
              <DialogDescription>
                تحديد الحد الأقصى لعدد الأدوية التي يمكن للصيدلية إضافتها
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الصيدلية:</span>
                  <span className="font-semibold">{selectedPharmacy?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الحد الحالي:</span>
                  <span className="font-semibold">{selectedPharmacy?.medicineLimit} دواء</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الأدوية المضافة:</span>
                  <span className="font-semibold">{selectedPharmacy?.currentMedicineCount} دواء</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newLimit">الحد الجديد</Label>
                <Input
                  id="newLimit"
                  type="number"
                  min={selectedPharmacy?.currentMedicineCount || 1}
                  value={newLimit}
                  onChange={(e) => setNewLimit(parseInt(e.target.value) || 100)}
                  placeholder="أدخل الحد الجديد"
                />
                <p className="text-xs text-muted-foreground">
                  يجب أن يكون الحد الجديد أكبر من أو يساوي عدد الأدوية الحالية
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsLimitDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleUpdateLimit}>
                حفظ
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent
            className="max-w-lg"
            onPointerDownOutside={() => setIsDetailsDialogOpen(false)}
          >
            <DialogHeader>
              <DialogTitle className="font-cairo">تفاصيل الصيدلية</DialogTitle>
            </DialogHeader>
            {selectedPharmacy && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{selectedPharmacy.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedPharmacy.city}</p>
                  </div>
                  {getStatusBadge(selectedPharmacy.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">البريد الإلكتروني</span>
                    <p className="font-semibold" dir="ltr">{selectedPharmacy.email}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">رقم الهاتف</span>
                    <p className="font-semibold" dir="ltr">{selectedPharmacy.phoneNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">المالك</span>
                    <p className="font-semibold">{selectedPharmacy.ownerName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">رقم الترخيص</span>
                    <p className="font-semibold">{selectedPharmacy.licenseNumber}</p>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <span className="text-muted-foreground">العنوان</span>
                    <p className="font-semibold">{selectedPharmacy.address}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">حد الأدوية</span>
                    <p className="font-semibold">{selectedPharmacy.currentMedicineCount} / {selectedPharmacy.medicineLimit}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">التقييم</span>
                    <p className="font-semibold">{selectedPharmacy.rating.toFixed(1)} ⭐</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">إجمالي الطلبات</span>
                    <p className="font-semibold">{selectedPharmacy.totalOrders}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">تاريخ الإنشاء</span>
                    <p className="font-semibold">{selectedPharmacy.createdAt.toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <AlertDialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo">
                إعادة تعيين كلمة المرور
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {selectedPharmacy && (
                  <>
                    سيتم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني:
                    <br />
                    <span className="font-semibold text-foreground" dir="ltr">{selectedPharmacy.email}</span>
                    <br /><br />
                    ستتمكن الصيدلية من إنشاء كلمة مرور جديدة عبر الرابط المرسل.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmResetPassword}>
                إرسال الرابط
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Pharmacy Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="border-red-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo text-red-600 flex items-center gap-2">
                <Trash2 className="w-5 h-5" />
                حذف الصيدلية نهائياً
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base space-y-3">
                {selectedPharmacy && (
                  <>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-bold text-red-700 mb-1">⚠️ تحذير: هذه العملية لا يمكن التراجع عنها!</p>
                      <p className="text-red-600 text-sm">
                        سيتم حذف الصيدلية وجميع بياناتها بشكل نهائي.
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p><strong>الصيدلية:</strong> {selectedPharmacy.name}</p>
                      <p><strong>البريد:</strong> {selectedPharmacy.email}</p>
                      <p><strong>عدد الأدوية:</strong> {selectedPharmacy.currentMedicineCount} دواء</p>
                    </div>

                    <p className="text-red-600 font-semibold">
                      سيتم حذف:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                      <li>حساب الصيدلية</li>
                      <li>جميع الأدوية المعتمدة</li>
                      <li>جميع الأدوية المعلقة والمرفوضة</li>
                      <li>بيانات المستخدم</li>
                    </ul>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف نهائياً
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
