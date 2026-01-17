import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  Calendar,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useMedicineApproval } from '@/hooks/useMedicineApproval';
import { MedicineWithApproval } from '@/types';
import { toast } from 'sonner';

export default function AdminMedicineReview() {
  const {
    pendingMedicines,
    allMedicines,
    isLoading,
    stats,
    filters,
    setFilters,
    approve,
    reject,
  } = useMedicineApproval();

  const [selectedMedicine, setSelectedMedicine] = useState<MedicineWithApproval | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const approvedMedicines = allMedicines.filter(m => m.status === 'approved');
  const rejectedMedicines = allMedicines.filter(m => m.status === 'rejected');

  const handleOpenReview = (medicine: MedicineWithApproval, action: 'approve' | 'reject') => {
    setSelectedMedicine(medicine);
    setReviewAction(action);
    setRejectionNotes('');
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedMedicine) return;

    if (reviewAction === 'approve') {
      await approve(selectedMedicine.id);
    } else {
      if (!rejectionNotes.trim()) {
        toast.error('يرجى إدخال ملاحظات الرفض');
        return;
      }
      await reject(selectedMedicine.id, rejectionNotes);
    }

    setIsReviewDialogOpen(false);
    setSelectedMedicine(null);
  };

  const getMedicinesByTab = () => {
    switch (activeTab) {
      case 'pending':
        return pendingMedicines;
      case 'approved':
        return approvedMedicines;
      case 'rejected':
        return rejectedMedicines;
      default:
        return [];
    }
  };

  const medicines = getMedicinesByTab();

  // Handle checkbox toggle
  const handleToggleSelect = (medicineId: string) => {
    const newSelected = new Set(selectedMedicineIds);
    if (newSelected.has(medicineId)) {
      newSelected.delete(medicineId);
    } else {
      newSelected.add(medicineId);
    }
    setSelectedMedicineIds(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (activeTab !== 'pending') return;
    
    if (selectedMedicineIds.size === pendingMedicines.length) {
      setSelectedMedicineIds(new Set());
    } else {
      setSelectedMedicineIds(new Set(pendingMedicines.map(m => m.id)));
    }
  };

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (selectedMedicineIds.size === 0) return;
    
    setIsBulkApproving(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedMedicineIds) {
      const success = await approve(id);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsBulkApproving(false);
    setSelectedMedicineIds(new Set());

    if (failCount === 0) {
      toast.success(`تمت الموافقة على ${successCount} دواء بنجاح`);
    } else {
      toast.warning(`تمت الموافقة على ${successCount} دواء، فشل ${failCount}`);
    }
  };

  // Clear selection when changing tabs
  const handleTabChange = (tab: 'pending' | 'approved' | 'rejected') => {
    setActiveTab(tab);
    setSelectedMedicineIds(new Set());
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
            <h1 className="text-3xl font-bold font-cairo">مراجعة الأدوية</h1>
            <p className="text-muted-foreground">مراجعة والموافقة على الأدوية المضافة من الصيدليات</p>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                قيد المراجعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                موافق عليها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                مرفوضة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2 border-b"
        >
          <button
            onClick={() => handleTabChange('pending')}
            className={`px-4 py-2 font-cairo font-semibold transition-colors ${
              activeTab === 'pending'
                ? 'border-b-2 border-orange-500 text-orange-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            قيد المراجعة ({stats.pending})
          </button>
          <button
            onClick={() => handleTabChange('approved')}
            className={`px-4 py-2 font-cairo font-semibold transition-colors ${
              activeTab === 'approved'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            موافق عليها ({stats.approved})
          </button>
          <button
            onClick={() => handleTabChange('rejected')}
            className={`px-4 py-2 font-cairo font-semibold transition-colors ${
              activeTab === 'rejected'
                ? 'border-b-2 border-red-500 text-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            مرفوضة ({stats.rejected})
          </button>
        </motion.div>

        {/* Filters and Bulk Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="ابحث عن دواء..."
                className="pr-10 font-cairo"
              />
            </div>
            <Select
              value={filters.pharmacyId || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, pharmacyId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="جميع الصيدليات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الصيدليات</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {activeTab === 'pending' && pendingMedicines.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="font-cairo"
              >
                {selectedMedicineIds.size === pendingMedicines.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>
              
              {selectedMedicineIds.size > 0 && (
                <>
                  <Badge variant="secondary" className="font-cairo">
                    {selectedMedicineIds.size} محدد
                  </Badge>
                  
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={isBulkApproving}
                    className="bg-green-600 hover:bg-green-700 font-cairo"
                  >
                    {isBulkApproving ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-2" />
                        جاري الموافقة...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 ml-2" />
                        الموافقة على المحدد ({selectedMedicineIds.size})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Medicines Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد أدوية في هذه الفئة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {medicines.map((medicine, index) => (
              <motion.div
                key={medicine.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`stat-card hover:shadow-lg transition-all ${
                  selectedMedicineIds.has(medicine.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                {/* Image with Checkbox */}
                <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden mb-4">
                  {activeTab === 'pending' && (
                    <div className="absolute top-2 left-2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedMedicineIds.has(medicine.id)}
                        onChange={() => handleToggleSelect(medicine.id)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                  )}
                  {medicine.subabaseImageUrl ? (
                    <img
                      src={medicine.subabaseImageUrl}
                      alt={medicine.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold font-cairo text-lg mb-1">{medicine.name}</h3>
                    <p className="text-sm text-muted-foreground">كود: {medicine.code}</p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4" />
                    <span>{medicine.pharmacyName}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-muted-foreground">السعر: </span>
                      <span className="font-bold text-primary">{medicine.price} ج.م</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">الكمية: </span>
                      <span className="font-bold">{medicine.quantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(medicine.createdAt).toLocaleDateString('ar-EG')}</span>
                  </div>

                  {medicine.rejectionNotes && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-700 mb-1">ملاحظات الرفض:</p>
                      <p className="text-sm text-red-600">{medicine.rejectionNotes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReview(medicine, 'approve')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 ml-1" />
                        موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenReview(medicine, 'reject')}
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 ml-1" />
                        رفض
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cairo">
                {reviewAction === 'approve' ? 'الموافقة على الدواء' : 'رفض الدواء'}
              </DialogTitle>
            </DialogHeader>
            {selectedMedicine && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold font-cairo mb-2">{selectedMedicine.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    الصيدلية: {selectedMedicine.pharmacyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    السعر: {selectedMedicine.price} ج.م
                  </p>
                </div>

                {reviewAction === 'reject' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionNotes" className="font-cairo">
                      ملاحظات الرفض *
                    </Label>
                    <Textarea
                      id="rejectionNotes"
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="اكتب سبب الرفض..."
                      rows={4}
                      className="font-cairo"
                    />
                  </div>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsReviewDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    className={
                      reviewAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }
                  >
                    {reviewAction === 'approve' ? 'موافقة' : 'رفض'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
