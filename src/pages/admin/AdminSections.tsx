import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSections } from '@/hooks/useSections';
import { Section } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminSections() {
  const { sections, isLoading, addSection, updateSection, deleteSection, toggleSectionStatus } = useSections();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    isActive: true,
  });

  const handleOpenDialog = (section?: Section) => {
    if (section) {
      setEditingSection(section);
      setFormData({
        name: section.name,
        nameEn: section.nameEn || '',
        isActive: section.isActive,
      });
    } else {
      setEditingSection(null);
      setFormData({
        name: '',
        nameEn: '',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('يجب إدخال اسم القسم');
      return;
    }

    try {
      if (editingSection) {
        await updateSection(editingSection.id, formData);
      } else {
        await addSection(formData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving section:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟ سيؤثر ذلك على جميع الفئات المرتبطة به.')) {
      try {
        await deleteSection(id);
      } catch (error) {
        console.error('Error deleting section:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await toggleSectionStatus(id, !currentStatus);
    } catch (error) {
      console.error('Error toggling status:', error);
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
            <h1 className="text-3xl font-bold font-cairo">إدارة الأقسام</h1>
            <p className="text-muted-foreground">
              إدارة أقسام المنتجات الرئيسية ({sections.length} قسم)
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gradient-primary text-primary-foreground font-cairo">
            <Plus className="w-5 h-5 ml-2" />
            إضافة قسم جديد
          </Button>
        </motion.div>

        {/* Sections Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              جاري تحميل الأقسام...
            </div>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد أقسام</h3>
            <p className="text-muted-foreground">ابدأ بإضافة قسم جديد</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{section.name}</h3>
                      {section.nameEn && (
                        <p className="text-xs text-gray-500">{section.nameEn}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={section.isActive ? 'default' : 'secondary'}>
                    {section.isActive ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-8"
                    onClick={() => handleOpenDialog(section)}
                  >
                    <Edit className="w-3 h-3 ml-1" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleToggleStatus(section.id, section.isActive)}
                  >
                    {section.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                    onClick={() => handleDelete(section.id)}
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
              <DialogTitle className="font-cairo text-lg">
                {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-cairo text-sm">اسم القسم بالعربي *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="مثال: أدوية"
                  className="h-10"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameEn" className="font-cairo text-sm">اسم القسم بالإنجليزي</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Example: Medicines"
                  className="h-10"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <Label htmlFor="isActive" className="font-cairo text-sm cursor-pointer">
                  قسم نشط
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="font-cairo"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-cairo"
                >
                  {editingSection ? 'حفظ التعديلات' : 'إضافة القسم'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
