import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RefreshCw,
  CheckCircle,
  XCircle,
  Layers,
  Layout,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBanners } from '@/hooks/useBanners';
import { Banner } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { uploadImageToSupabase } from '@/lib/supabase';
import { compressImage, formatFileSize } from '@/lib/imageCompression';
import { getBannerIllustration } from '@/assets/bannerIllustrations';

const COLOR_PRESETS = [
  { name: 'أزرق (سحابة الصيدلية)', primary: '#3478F6', bg: '#EBF3FF' },
  { name: 'أخضر (زمردي طازج)', primary: '#10B981', bg: '#ECFDF5' },
  { name: 'بنفسجي (ملكي فاخر)', primary: '#8B5CF6', bg: '#F5F3FF' },
  { name: 'برتقالي (دافئ وسريع)', primary: '#F97316', bg: '#FFF7ED' },
  { name: 'وردي (عناية وجمال)', primary: '#EC4899', bg: '#FDF2F8' },
  { name: 'أحمر طوارئ', primary: '#EF4444', bg: '#FEF2F2' },
];

export default function AdminBanners() {
  const {
    banners,
    isLoading,
    addBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    toggleAllStatus,
    deleteAllBanners,
    seedInitialBanners,
  } = useBanners();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Image manipulation & zoom state for dialog preview
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [imageOffsetX, setImageOffsetX] = useState<number>(0);
  const [imageOffsetY, setImageOffsetY] = useState<number>(0);

  // Mouse Drag / Pan handlers for live interactive framing
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!formData.imageUrl) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - imageOffsetX, y: e.clientY - imageOffsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setImageOffsetX(Math.round(e.clientX - dragStart.x));
    setImageOffsetY(Math.round(e.clientY - dragStart.y));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const [formData, setFormData] = useState({
    title: '',
    titleEn: '',
    subtitle: '',
    subtitleEn: '',
    badgeText: '',
    badgeTextEn: '',
    imageUrl: '',
    bannerType: 'image_only' as 'image_only' | 'custom_card',
    primaryColor: '#3478F6',
    backgroundColor: '#EBF3FF',
    actionType: 'none' as 'none' | 'category' | 'medicine' | 'url',
    actionTarget: '',
    isActive: true,
    sortOrder: 1,
  });

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setImageZoom(banner.imageZoom !== undefined ? banner.imageZoom : 1);
      setImageRotation(banner.imageRotation !== undefined ? banner.imageRotation : 0);
      setImageOffsetX(banner.imageOffsetX !== undefined ? banner.imageOffsetX : 0);
      setImageOffsetY(banner.imageOffsetY !== undefined ? banner.imageOffsetY : 0);
      setFormData({
        title: banner.title || '',
        titleEn: banner.titleEn || '',
        subtitle: banner.subtitle || '',
        subtitleEn: banner.subtitleEn || '',
        badgeText: banner.badgeText || '',
        badgeTextEn: banner.badgeTextEn || '',
        imageUrl: banner.imageUrl || '',
        bannerType: banner.bannerType || (banner.imageUrl && !banner.subtitle ? 'image_only' : 'custom_card'),
        primaryColor: banner.primaryColor || '#3478F6',
        backgroundColor: banner.backgroundColor || '#EBF3FF',
        actionType: banner.actionType || 'none',
        actionTarget: banner.actionTarget || '',
        isActive: banner.isActive,
        sortOrder: banner.sortOrder || 1,
      });
    } else {
      setEditingBanner(null);
      setImageZoom(1);
      setImageRotation(0);
      setImageOffsetX(0);
      setImageOffsetY(0);
      setFormData({
        title: '',
        titleEn: '',
        subtitle: '',
        subtitleEn: '',
        badgeText: '',
        badgeTextEn: '',
        imageUrl: '',
        bannerType: 'image_only',
        primaryColor: '#3478F6',
        backgroundColor: '#EBF3FF',
        actionType: 'none',
        actionTarget: '',
        isActive: true,
        sortOrder: (banners.length || 0) + 1,
      });
    }
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const originalSize = formatFileSize(file.size);
    toast.info(`جاري ضغط ورفع الصورة... (${originalSize})`);

    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.88,
        maxSizeMB: 0.8,
      });

      const result = await uploadImageToSupabase(compressedFile);

      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url! }));
        toast.success('تم رفع صورة البانر بنجاح!');
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
            toast.success('تم تحميل الصورة بنجاح!');
          }
        };
        reader.readAsDataURL(compressedFile);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() && formData.bannerType === 'custom_card') {
      toast.error('يرجى إدخال عنوان البانر بالعربية');
      return;
    }

    if (!formData.imageUrl.trim() && formData.bannerType === 'image_only') {
      toast.error('يرجى رفع صورة البانر أولاً');
      return;
    }

    // Default title for image_only if empty
    const finalFormData = {
      ...formData,
      title: formData.title.trim() || (formData.bannerType === 'image_only' ? 'إعلان إعلاني كامل' : 'بانر'),
      imageZoom: imageZoom,
      imageRotation: imageRotation,
      imageOffsetX: imageOffsetX,
      imageOffsetY: imageOffsetY,
    };

    try {
      if (editingBanner) {
        await updateBanner(editingBanner.id, finalFormData);
      } else {
        await addBanner(finalFormData);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving banner:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`هل أنت تأكد من حذف البانر "${title}"؟`)) {
      await deleteBanner(id);
    }
  };

  const filteredBanners = banners.filter((banner) => {
    const matchesSearch =
      (banner.title && banner.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (banner.subtitle && banner.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesActive = filterActiveOnly ? banner.isActive : true;
    return matchesSearch && matchesActive;
  });

  const activeCount = banners.filter((b) => b.isActive).length;
  const hiddenCount = banners.length - activeCount;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 font-cairo" dir="rtl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Layers className="w-7 h-7 text-primary" />
              إدارة البانرات الإعلانية
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              إمكانية رفع صورة كاملة تغطي البانر أو اختيار تصميم مخصص مع نصوص وشارات
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={seedInitialBanners}
              disabled={isLoading}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10 font-bold"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              إضافة البانرات الافتراضية
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('هل أنت متاكد من إخفاء جميع البانرات؟ سيتم إخفاء قسم البانرات بالكامل من تطبيق الهاتف.')) {
                  toggleAllStatus(false);
                }
              }}
              disabled={isLoading || banners.length === 0 || activeCount === 0}
              className="gap-2 border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold"
            >
              <EyeOff className="w-4 h-4" />
              إخفاء جميع البانرات
            </Button>

            <Button
              variant="outline"
              onClick={() => toggleAllStatus(true)}
              disabled={isLoading || banners.length === 0 || hiddenCount === 0}
              className="gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
            >
              <Eye className="w-4 h-4" />
              تفعيل الكل
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (window.confirm('هل أنت متاكد من حذف جميع البانرات نهائياً من قاعدة البيانات؟')) {
                  deleteAllBanners();
                }
              }}
              disabled={isLoading || banners.length === 0}
              className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 font-bold"
            >
              <Trash2 className="w-4 h-4" />
              حذف الكل
            </Button>

            <Button
              onClick={() => handleOpenDialog()}
              className="gap-2 gradient-primary text-primary-foreground font-bold shadow-md"
            >
              <Plus className="w-5 h-5" />
              إضافة بانر جديد
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">إجمالي البانرات</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">{banners.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ImageIcon className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">البانرات النشطة (معروضة)</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {activeCount}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">البانرات المخفية</p>
              <h3 className="text-2xl font-bold text-muted-foreground mt-1">{hiddenCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <EyeOff className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="w-full sm:w-80">
            <Input
              type="text"
              placeholder="ابحث باسم البانر أو التوضيح..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant={filterActiveOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterActiveOnly(!filterActiveOnly)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {filterActiveOnly ? 'عرض البانرات النشطة فقط' : 'عرض الكل'}
            </Button>
          </div>
        </div>

        {/* Banners Grid / List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <span className="mr-3 text-muted-foreground">جاري تحميل البانرات...</span>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد بانرات إعلانية</h3>
            <p className="text-muted-foreground mb-6">
              لم يتم إضافة أي بانرات إعلانية بعد، يمكنك إضافة بانر جديد أو إضافة البانرات الافتراضية.
            </p>
            <Button onClick={seedInitialBanners} className="gap-2 gradient-primary">
              <Sparkles className="w-4 h-4" />
              إضافة البانرات الافتراضية الآن
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBanners.map((banner) => (
              <motion.div
                key={banner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-card border rounded-2xl overflow-hidden shadow-card transition-all flex flex-col justify-between ${
                  banner.isActive ? 'border-border' : 'border-border opacity-70 bg-muted/20'
                }`}
              >
                {/* Check Banner Mode: Full Image vs Custom Card */}
                {banner.bannerType === 'image_only' || (!banner.subtitle && banner.imageUrl) ? (
                  <div className="relative h-[180px] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                    <img
                      src={getBannerIllustration(banner.imageUrl)}
                      alt={banner.title}
                      className="w-full h-full object-cover transition-transform"
                      style={{
                        transform: `scale(${banner.imageZoom ?? 1}) rotate(${banner.imageRotation ?? 0}deg)`
                      }}
                    />
                    <div className="absolute top-3 right-3 z-10 flex gap-2">
                      <Badge className="bg-black/60 backdrop-blur-md text-white font-bold gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        صورة كاملة
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant={banner.isActive ? 'default' : 'secondary'} className="gap-1">
                        {banner.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            مفعل
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                            مخفي
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div
                    className="p-5 relative overflow-hidden flex flex-col justify-between min-h-[180px]"
                    style={{ backgroundColor: banner.backgroundColor }}
                  >
                    {/* Decorative Circle Background */}
                    <div
                      className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-10"
                      style={{ backgroundColor: banner.primaryColor }}
                    />
                    <div
                      className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-15"
                      style={{ backgroundColor: banner.primaryColor }}
                    />

                    {/* Top Badge & Active Status */}
                    <div className="flex justify-between items-start z-10">
                      {banner.badgeText ? (
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-bold shadow-xs"
                          style={{
                            backgroundColor: `${banner.primaryColor}20`,
                            color: banner.primaryColor,
                            border: `1px solid ${banner.primaryColor}30`,
                          }}
                        >
                          {banner.badgeText}
                        </span>
                      ) : (
                        <span />
                      )}

                      <Badge variant={banner.isActive ? 'default' : 'secondary'} className="gap-1">
                        {banner.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-400" />
                            مفعل
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                            مخفي
                          </>
                        )}
                      </Badge>
                    </div>

                    {/* Title & Subtitle + Image Content */}
                    <div className="flex justify-between items-center gap-3 z-10 mt-3">
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
                          {banner.title}
                        </h4>
                        {banner.subtitle && (
                          <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                      {banner.imageUrl && (
                        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-xs p-1 border border-white/40 shadow-xs overflow-hidden">
                          <img
                            src={getBannerIllustration(banner.imageUrl)}
                            alt={banner.title}
                            className="w-full h-full object-contain transition-transform"
                            style={{
                              transform: `scale(${banner.imageZoom ?? 1}) rotate(${banner.imageRotation ?? 0}deg)`
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="p-4 bg-card border-t border-border flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md font-mono">
                      الترتيب: #{banner.sortOrder}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate max-w-[120px]">
                      {banner.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleBannerStatus(banner.id, banner.isActive)}
                      title={banner.isActive ? 'إخفاء البانر' : 'تفعيل البانر'}
                    >
                      {banner.isActive ? (
                        <EyeOff className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Eye className="w-4 h-4 text-emerald-500" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenDialog(banner)}
                      title="تعديل البانر"
                    >
                      <Edit className="w-4 h-4 text-blue-500" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(banner.id, banner.title)}
                      title="حذف البانر"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add / Edit Dialog with 2 Banner Options (Full Image vs Custom Card) */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto font-cairo" dir="rtl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-xl font-bold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {editingBanner ? (
                    <>
                      <Edit className="w-5 h-5 text-primary" />
                      تعديل البانر الإعلاني
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 text-primary" />
                      إضافة بانر إعلاني جديد
                    </>
                  )}
                </span>
                <Badge variant="outline" className="text-xs font-mono font-normal">
                  {formData.bannerType === 'image_only' ? '🖼️ صورة كاملة' : '🎨 تصميم مخصص'}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* RIGHT COLUMN (7/12): FORM FIELDS & INPUTS */}
                <div className="lg:col-span-7 space-y-5">
                  
                  {/* 1. Mode Selector Switch */}
                  <div className="space-y-2">
                    <Label className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Layout className="w-4 h-4 text-primary" />
                      1. اختر طريقة عرض البانر في التطبيق
                    </Label>
                    <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted/60 rounded-xl border border-border">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerType: 'image_only' })}
                        className={`py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          formData.bannerType === 'image_only'
                            ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
                            : 'text-muted-foreground hover:bg-background/80'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4" />
                        🖼️ صورة كاملة (تغطية)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, bannerType: 'custom_card' })}
                        className={`py-3 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          formData.bannerType === 'custom_card'
                            ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30'
                            : 'text-muted-foreground hover:bg-background/80'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        🎨 كارت مخصص (نصوص وشارة)
                      </button>
                    </div>
                  </div>

                  {/* 2. Image Source Uploader */}
                  <div className="space-y-3 bg-muted/30 p-3.5 rounded-xl border border-border">
                    <Label className="font-bold text-xs text-foreground flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      2. صورة البانر *
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-[11px] text-muted-foreground mb-1 block">رفع من الجهاز</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                          className="text-xs h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-muted-foreground mb-1 block">أو رابط مباشر URL</Label>
                        <Input
                          type="text"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          placeholder="https://..."
                          className="text-xs h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Text Fields */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="title" className="font-bold text-xs">
                        {formData.bannerType === 'image_only'
                          ? 'عنوان مرجعي للبانر (للإدارة)'
                          : 'العنوان الرئيسي (بالعربي) *'}
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder={
                          formData.bannerType === 'image_only'
                            ? 'مثال: إعلان عروض الصيف'
                            : 'مثال: الدوا مش موجود؟ إحنا نجيبهولك'
                        }
                        required={formData.bannerType === 'custom_card'}
                        className="text-sm"
                      />
                    </div>

                    {formData.bannerType === 'custom_card' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="titleEn" className="text-xs">العنوان (بالإنجليزي)</Label>
                            <Input
                              id="titleEn"
                              value={formData.titleEn}
                              onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                              placeholder="e.g. Medicine unavailable?"
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="subtitle" className="text-xs">الوصف الفرعي (بالعربي)</Label>
                            <Input
                              id="subtitle"
                              value={formData.subtitle}
                              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                              placeholder="مثال: مش هتلف على صيدليات تاني"
                              className="text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="badgeText" className="text-xs">نص الشارة (بالعربي)</Label>
                            <Input
                              id="badgeText"
                              value={formData.badgeText}
                              onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                              placeholder="مثال: أدوية نادرة"
                              className="text-xs"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="badgeTextEn" className="text-xs">نص الشارة (بالإنجليزي)</Label>
                            <Input
                              id="badgeTextEn"
                              value={formData.badgeTextEn}
                              onChange={(e) => setFormData({ ...formData, badgeTextEn: e.target.value })}
                              placeholder="e.g. Rare Medicines"
                              className="text-xs"
                            />
                          </div>
                        </div>

                        {/* Color Presets */}
                        <div className="space-y-2 pt-1">
                          <Label className="text-xs font-bold">ألوان البانر السريعة</Label>
                          <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map((preset) => (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    primaryColor: preset.primary,
                                    backgroundColor: preset.bg,
                                  })
                                }
                                className="px-2.5 py-1 rounded-md border text-[11px] font-bold flex items-center gap-1.5 transition-transform hover:scale-105"
                                style={{
                                  backgroundColor: preset.bg,
                                  borderColor: preset.primary,
                                  color: preset.primary,
                                }}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white"
                                  style={{ backgroundColor: preset.primary }}
                                />
                                {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 4. Order & Active Switch */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                    <div className="space-y-1">
                      <Label htmlFor="sortOrder" className="text-xs font-bold">ترتيب الظهور</Label>
                      <Input
                        id="sortOrder"
                        type="number"
                        min="1"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
                        className="text-xs h-9 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold">حالة البانر</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant={formData.isActive ? 'default' : 'outline'}
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className="w-full justify-center gap-1.5 font-bold h-9 text-xs"
                      >
                        {formData.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            مفعل ومتاح
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            مخفي
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                </div>

                {/* LEFT COLUMN (5/12): STICKY LIVE INTERACTIVE PREVIEW & IMAGE POSITIONING STUDIO */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="sticky top-0 space-y-3 bg-muted/20 p-4 rounded-2xl border border-border">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                        📱 المعاينة الحية والتأطير التفاعلي
                      </Label>
                      <span className="text-[10px] text-muted-foreground">
                        {imageZoom !== 1 || imageRotation !== 0 || imageOffsetX !== 0 || imageOffsetY !== 0 ? 'مُعدل' : 'افتراضي'}
                      </span>
                    </div>

                    {/* INTERACTIVE DRAG-TO-POSITION CANVAS */}
                    <div
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`relative w-full rounded-2xl overflow-hidden border-2 shadow-lg transition-colors select-none ${
                        isDragging ? 'border-primary cursor-grabbing' : 'border-border cursor-grab hover:border-primary/50'
                      }`}
                      style={{
                        height: '180px',
                        backgroundColor: formData.bannerType === 'custom_card' ? formData.backgroundColor : '#0f172a',
                      }}
                    >
                      {formData.bannerType === 'image_only' ? (
                        /* FULL IMAGE PREVIEW */
                        formData.imageUrl ? (
                          <img
                            src={getBannerIllustration(formData.imageUrl)}
                            alt="Full Banner Preview"
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                            style={{
                              transform: `translate(${imageOffsetX}px, ${imageOffsetY}px) scale(${imageZoom}) rotate(${imageRotation}deg)`,
                            }}
                          />
                        ) : (
                          <div className="text-center p-6 text-slate-400 space-y-2 pointer-events-none">
                            <ImageIcon className="w-10 h-10 mx-auto opacity-50" />
                            <p className="text-xs font-bold">يرجى رفع أو إضافة رابط الصورة الإعلانية الكاملة</p>
                          </div>
                        )
                      ) : (
                        /* CUSTOM CARD PREVIEW */
                        <div className="p-4 w-full h-full relative flex flex-col justify-between pointer-events-none">
                          <div
                            className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-10"
                            style={{ backgroundColor: formData.primaryColor }}
                          />
                          <div className="z-10 flex justify-start">
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs"
                              style={{
                                backgroundColor: `${formData.primaryColor}20`,
                                color: formData.primaryColor,
                                border: `1px solid ${formData.primaryColor}30`,
                              }}
                            >
                              {formData.badgeText || 'شارة الترويج'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-3 z-10">
                            <div className="space-y-0.5 flex-1">
                              <h3 className="font-bold text-slate-800 text-sm leading-snug">
                                {formData.title || 'عنوان البانر الرئيسي'}
                              </h3>
                              <p className="text-slate-600 text-[10px] leading-relaxed">
                                {formData.subtitle || 'الوصف الفرعي المعروض أسفل العنوان'}
                              </p>
                            </div>
                            {formData.imageUrl && (
                              <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/70 p-1 border border-white/50 shadow-xs overflow-hidden relative">
                                <img
                                  src={getBannerIllustration(formData.imageUrl)}
                                  alt="Banner Preview"
                                  draggable={false}
                                  className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
                                  style={{
                                    transform: `translate(${imageOffsetX}px, ${imageOffsetY}px) scale(${imageZoom}) rotate(${imageRotation}deg)`,
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Drag Indicator Overlay */}
                      {formData.imageUrl && (
                        <div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                          <Move className="w-3 h-3 text-primary animate-pulse" />
                          اسحب بالماوس لتحريك الصورة
                        </div>
                      )}
                    </div>

                    {/* CONTROLS STUDIO */}
                    {formData.imageUrl && (
                      <div className="space-y-3 bg-background p-3 rounded-xl border border-border">
                        {/* Zoom Slider */}
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="flex items-center gap-1">
                              <ZoomIn className="w-3.5 h-3.5 text-primary" />
                              التكبير (Zoom):
                            </span>
                            <span className="font-mono text-primary text-xs">{Math.round(imageZoom * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.4"
                            max="3.0"
                            step="0.05"
                            value={imageZoom}
                            onChange={(e) => setImageZoom(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>

                        {/* Directional Nudge Pad + Rotation + Reset */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setImageOffsetY((y) => y - 5)}
                              className="h-7 w-7 p-0"
                              title="تحريك لأعلى"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setImageOffsetY((y) => y + 5)}
                              className="h-7 w-7 p-0"
                              title="تحريك لأسفل"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setImageOffsetX((x) => x - 5)}
                              className="h-7 w-7 p-0"
                              title="تحريك لليسار"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setImageOffsetX((x) => x + 5)}
                              className="h-7 w-7 p-0"
                              title="تحريك لليمين"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setImageRotation((r) => (r + 90) % 360)}
                              className="h-7 px-2 text-[11px] font-bold gap-1"
                              title="تدوير 90 درجة"
                            >
                              <RotateCw className="w-3 h-3" />
                              {imageRotation}°
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setImageZoom(1);
                                setImageRotation(0);
                                setImageOffsetX(0);
                                setImageOffsetY(0);
                              }}
                              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                              title="إعادة الضبط"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading}
                  className="gradient-primary text-primary-foreground font-bold px-8 shadow-md"
                >
                  {editingBanner ? 'حفظ التعديلات' : 'إضافة البانر الآن'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
