import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Edit, Trash2, Tag, Package } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useCategories } from '@/hooks/useCategories';
import { useSections } from '@/hooks/useSections';
import { MedicineCategory } from '@/types';

export default function AdminCategories() {
  const { categories, isLoading, addCategory, updateCategory, deleteCategory } = useCategories();
  const { sections } = useSections(true); // Get active sections only
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MedicineCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    sectionId: '',
  });

  const handleOpenDialog = (category?: MedicineCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        nameEn: category.nameEn,
        sectionId: category.sectionId || '',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        nameEn: '',
        sectionId: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const section = sections.find(s => s.id === formData.sectionId);
      const categoryData = {
        ...formData,
        sectionName: section?.name || undefined,
      };
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
      } else {
        await addCategory(categoryData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الفئة؟ لن يمكن حذفها إذا كانت مرتبطة بأدوية.')) {
      try {
        await deleteCategory(id);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'all' || cat.sectionId === selectedSection;
    return matchesSearch && matchesSection;
  });

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
            <h1 className="text-3xl font-bold font-cairo">إدارة الفئات</h1>
            <p className="text-muted-foreground">عرض وإدارة فئات الأدوية ({categories.length} فئة)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground font-cairo">
              <Plus className="w-5 h-5 ml-2" />
              إضافة فئة جديدة
            </Button>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث عن فئة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
          
          <Select value={selectedSection} onValueChange={setSelectedSection}>
            <SelectTrigger className="font-cairo">
              <SelectValue placeholder="جميع الأقسام" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">جميع الأقسام</SelectItem>
              {sections.map((section) => (
                <SelectItem key={section.id} value={section.id} className="font-cairo">
                  {section.icon} {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              جاري تحميل التصنيفات...
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد فئات</h3>
            <p className="text-muted-foreground">لم يتم العثور على أي فئات</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      {category.sectionName && (
                        <div className="flex items-center gap-1 mt-1">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">{category.sectionName}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleOpenDialog(category)}
                  >
                    <Edit className="w-3 h-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sectionId" className="font-cairo">القسم *</Label>
                <Select 
                  value={formData.sectionId} 
                  onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                >
                  <SelectTrigger className="font-cairo">
                    <SelectValue placeholder="اختر القسم" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id} className="font-cairo">
                        {section.icon} {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="font-cairo">اسم الفئة (عربي) *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: مسكنات"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn" className="font-cairo">اسم الفئة (إنجليزي) *</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  required
                  placeholder="Example: Painkillers"
                  dir="ltr"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingCategory ? 'تحديث' : 'إضافة'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
