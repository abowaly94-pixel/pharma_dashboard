import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Trash, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMedicinesPaginated } from '@/hooks/useMedicinesPaginated';
import { useCategories } from '@/hooks/useCategories';
import { useSections } from '@/hooks/useSections';
import { Medicine } from '@/types';
import { Pagination } from '@/components/ui/pagination';
import { MedicinesTable } from '@/components/admin/MedicinesTable';
import { toast } from 'sonner';
import { removeDuplicateMedicines } from '@/utils/removeDuplicateMedicines';
import { deleteMedicinePermanently } from '@/services/medicineService';

export default function AdminMedicinesPaginated() {
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [pageSize, setPageSize] = useState(20);

  const { categories, isLoading: categoriesLoading } = useCategories(true);
  const { sections, isLoading: sectionsLoading } = useSections(true);

  const {
    medicines,
    isLoading,
    currentPage,
    totalPages,
    totalCount,
    goToPage,
    refreshCurrentPage
  } = useMedicinesPaginated({
    pageSize,
    sectionId: selectedSection !== 'all' ? selectedSection : undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined
  });

  // فلترة محلية بناءً على البحث
  const filteredMedicines = medicines.filter(medicine => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      medicine.name.toLowerCase().includes(query) ||
      medicine.code.toLowerCase().includes(query) ||
      medicine.description.toLowerCase().includes(query) ||
      medicine.pharmacyName.toLowerCase().includes(query) ||
      medicine.category?.toLowerCase().includes(query) ||
      medicine.manufacturer?.toLowerCase().includes(query)
    );
  });

  const handleView = (medicine: Medicine) => {
    // TODO: فتح dialog لعرض التفاصيل
    console.log('View medicine:', medicine);
  };

  const handleEdit = (medicine: Medicine) => {
    // TODO: فتح dialog للتعديل
    console.log('Edit medicine:', medicine);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الدواء؟ سيتم حذف الصورة أيضاً من التخزين.')) {
      try {
        await deleteMedicinePermanently(id);
        toast.success('تم حذف الدواء والصورة بنجاح');
        refreshCurrentPage();
      } catch (error) {
        console.error('Error deleting medicine:', error);
        toast.error('فشل في حذف الدواء');
      }
    }
  };

  const handleRemoveDuplicates = async () => {
    if (!window.confirm('هل تريد حذف جميع الأدوية المكررة؟ سيتم الاحتفاظ بالأحدث فقط.')) return;
    
    const loadingToast = toast.loading('جاري فحص وحذف المكررات...');
    try {
      const result = await removeDuplicateMedicines('medicines');
      toast.dismiss(loadingToast);
      if (result.duplicatesRemoved > 0) {
        toast.success(`تم حذف ${result.duplicatesRemoved} دواء مكرر!`);
        refreshCurrentPage();
      } else {
        toast.info('لا توجد أدوية مكررة');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('فشل حذف المكررات');
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
            <p className="text-muted-foreground font-cairo">
              عرض وإدارة جميع الأدوية في النظام ({totalCount} دواء)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleRemoveDuplicates}
              variant="outline"
              className="font-cairo"
            >
              <Trash className="w-4 h-4 ml-2" />
              حذف المكررات
            </Button>
            <Button 
              onClick={() => {/* TODO: فتح dialog الإضافة */}}
              className="gradient-primary text-primary-foreground font-cairo"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة دواء جديد
            </Button>
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-4 space-y-4"
        >
          {/* Search and View Mode */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الكود، الصيدلية، الفئة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 font-cairo"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="font-cairo"
              >
                <TableIcon className="w-4 h-4 ml-2" />
                جدول
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="font-cairo"
              >
                <LayoutGrid className="w-4 h-4 ml-2" />
                شبكة
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Section Filter */}
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger className="h-10 font-cairo">
                <SelectValue placeholder="جميع الأقسام" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {sectionsLoading ? (
                  <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>
                ) : sections.length === 0 ? (
                  <div className="p-2 text-center text-sm text-gray-500">لا توجد أقسام</div>
                ) : (
                  sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.icon} {section.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={selectedSection === 'all'}
            >
              <SelectTrigger className={`h-10 font-cairo ${selectedSection === 'all' ? 'opacity-50' : ''}`}>
                <SelectValue placeholder={selectedSection === 'all' ? 'اختر القسم أولاً' : 'جميع الفئات'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {selectedSection === 'all' ? (
                  <div className="p-2 text-center text-sm text-gray-500">اختر قسم أولاً</div>
                ) : categoriesLoading ? (
                  <div className="p-2 text-center text-sm text-gray-500">جاري التحميل...</div>
                ) : categories.filter(cat => cat.sectionId === selectedSection).length === 0 ? (
                  <div className="p-2 text-center text-sm text-gray-500">لا توجد فئات</div>
                ) : (
                  categories
                    .filter(cat => cat.sectionId === selectedSection)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-10 font-cairo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 أدوية</SelectItem>
                <SelectItem value="20">20 دواء</SelectItem>
                <SelectItem value="50">50 دواء</SelectItem>
                <SelectItem value="100">100 دواء</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center justify-center bg-gray-50 rounded-lg px-4 border border-gray-200">
              <span className="text-sm font-cairo text-gray-700">
                {filteredMedicines.length} نتيجة
              </span>
            </div>
          </div>
        </motion.div>

        {/* Table View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MedicinesTable
            medicines={filteredMedicines}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalCount={totalCount}
              pageSize={pageSize}
            />
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
