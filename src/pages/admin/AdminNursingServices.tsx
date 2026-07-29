import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  UserCheck,
  Calendar,
  Phone,
  MapPin,
  Star,
  Award,
  DollarSign,
  Upload,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SafeImage } from '@/components/ui/safe-image';
import { nursingService } from '@/services/nursingService';
import { Nurse, NursingService, NursingBooking } from '@/types';
import { MapLocationPicker } from '@/components/maps/MapLocationPicker';

export default function AdminNursingServices() {
  const [activeTab, setActiveTab] = useState<'nurses' | 'services' | 'bookings'>('nurses');

  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [services, setServices] = useState<NursingService[]>([]);
  const [bookings, setBookings] = useState<NursingBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [nurseSearch, setNurseSearch] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  // Dialog States - Nurses
  const [isNurseDialogOpen, setIsNurseDialogOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [accountForm, setAccountForm] = useState({
    createAccount: false,
    email: '',
    password: '',
  });
  const [nurseForm, setNurseForm] = useState({
    name: '',
    titleAr: '',
    titleEn: '',
    avatarUrl: '',
    rating: 5.0,
    reviewsCount: 1,
    experienceYears: 5,
    locationAr: 'القاهرة',
    locationEn: 'Cairo',
    distanceKm: 2.0,
    price: 100.0,
    phone: '',
    isVerified: true,
    serviceIds: [] as string[],
    aboutAr: '',
    latitude: 30.0444,
    longitude: 31.2357,
    coverageAreas: ['الشيخ زايد', '6 أكتوبر'] as string[],
    coverageRadiusKm: 10,
  });

  // Dialog States - Services
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<NursingService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    id: '',
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: 'vaccines',
    startingPrice: 50.0,
    accentColorHex: '#3638DA',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedNurses, fetchedServices, fetchedBookings] = await Promise.all([
        nursingService.getAllNurses(),
        nursingService.getAllServices(),
        nursingService.getAllBookings(),
      ]);
      setNurses(fetchedNurses);
      setServices(fetchedServices);
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Error fetching nursing data:', error);
      toast.error('حدث خطأ أثناء تحميل بيانات خدمات التمريض');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Nurse Dialog Handlers
  const handleOpenNurseDialog = (nurse?: Nurse) => {
    if (nurse) {
      setEditingNurse(nurse);
      setAccountForm({
        createAccount: false,
        email: nurse.email || '',
        password: '',
      });
      setNurseForm({
        name: nurse.name,
        titleAr: nurse.titleAr,
        titleEn: nurse.titleEn,
        avatarUrl: nurse.avatarUrl,
        rating: nurse.rating || 5.0,
        reviewsCount: nurse.reviewsCount || 1,
        experienceYears: nurse.experienceYears || 5,
        locationAr: nurse.locationAr || 'القاهرة',
        locationEn: nurse.locationEn || 'Cairo',
        distanceKm: nurse.distanceKm || 2.0,
        price: nurse.price || 100.0,
        phone: nurse.phone || '',
        isVerified: nurse.isVerified ?? true,
        serviceIds: nurse.serviceIds || [],
        aboutAr: nurse.aboutAr || '',
        latitude: nurse.latitude || 30.0444,
        longitude: nurse.longitude || 31.2357,
        coverageAreas: nurse.coverageAreas || ['الشيخ زايد', '6 أكتوبر'],
        coverageRadiusKm: nurse.coverageRadiusKm || 10,
      });
    } else {
      setEditingNurse(null);
      setAccountForm({
        createAccount: true,
        email: '',
        password: '',
      });
      setNurseForm({
        name: '',
        titleAr: 'أخصائي تمريض منزلي',
        titleEn: 'Home Nurse Specialist',
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=60',
        rating: 5.0,
        reviewsCount: 1,
        experienceYears: 5,
        locationAr: 'القاهرة',
        locationEn: 'Cairo',
        distanceKm: 2.0,
        price: 120.0,
        phone: '',
        isVerified: true,
        serviceIds: services.map((s) => s.id),
        aboutAr: '',
        latitude: 30.0444,
        longitude: 31.2357,
        coverageAreas: ['الشيخ زايد', '6 أكتوبر'],
        coverageRadiusKm: 10,
      });
    }
    setIsNurseDialogOpen(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    toast.info('جاري رفع صورة الممرض على Supabase Storage...');

    try {
      const res = await nursingService.uploadNurseAvatar(file);
      if (res.success && res.url) {
        setNurseForm((prev) => ({ ...prev, avatarUrl: res.url! }));
        toast.success('تم رفع صورة الممرض بنجاح!');
      } else {
        toast.error(res.error || 'فشل رفع الصورة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء رفع صورة الممرض');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleSaveNurse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nurseForm.name.trim()) {
      toast.error('يرجى إدخال اسم الممرض');
      return;
    }
    if (!nurseForm.phone.trim()) {
      toast.error('يرجى إدخال رقم هاتف الممرض');
      return;
    }

    try {
      let nurseId = editingNurse?.id;
      if (editingNurse) {
        await nursingService.updateNurse(editingNurse.id, nurseForm);
        toast.success('تم تحديث بيانات الممرض بنجاح');
      } else {
        nurseId = await nursingService.addNurse(nurseForm);
        toast.success('تم إضافة الممرض بنجاح');
      }

      if (accountForm.createAccount && accountForm.email.trim() && accountForm.password.trim() && nurseId) {
        try {
          await nursingService.createNurseAccount(
            nurseId,
            accountForm.email.trim(),
            accountForm.password.trim(),
            nurseForm.name.trim(),
            nurseForm.avatarUrl
          );
          toast.success('تم إنشاء حساب الدخول للممرض بنجاح! 🔑');
        } catch (accErr: any) {
          toast.error(`فشل إنشاء حساب الدخول: ${accErr.message || 'خطأ'}`);
        }
      }

      setIsNurseDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ بيانات الممرض');
    }
  };

  const handleDeleteNurse = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الممرض؟')) {
      try {
        await nursingService.deleteNurse(id);
        toast.success('تم حذف الممرض بنجاح');
        fetchData();
      } catch (error) {
        toast.error('فشل حذف الممرض');
      }
    }
  };

  const handleToggleNurseVerified = async (id: string, currentVerified: boolean) => {
    try {
      await nursingService.toggleNurseVerified(id, !currentVerified);
      toast.success(currentVerified ? 'تم إلغاء توثيق الممرض' : 'تم توثيق الممرض بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل تغيير حالة توثيق الممرض');
    }
  };

  // Service Dialog Handlers
  const handleOpenServiceDialog = (service?: NursingService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        id: service.id,
        titleAr: service.titleAr,
        titleEn: service.titleEn,
        descriptionAr: service.descriptionAr,
        descriptionEn: service.descriptionEn,
        icon: service.icon || 'vaccines',
        startingPrice: service.startingPrice || 50,
        accentColorHex: service.accentColorHex || '#3638DA',
      });
    } else {
      setEditingService(null);
      setServiceForm({
        id: `service_${Date.now()}`,
        titleAr: '',
        titleEn: '',
        descriptionAr: '',
        descriptionEn: '',
        icon: 'vaccines',
        startingPrice: 50.0,
        accentColorHex: '#3638DA',
      });
    }
    setIsServiceDialogOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.titleAr.trim() || !serviceForm.titleEn.trim()) {
      toast.error('يرجى إدخال اسم الخدمة بالعربي والإنجليزي');
      return;
    }

    try {
      if (editingService) {
        await nursingService.updateService(editingService.id, serviceForm);
        toast.success('تم تحديث الخدمة بنجاح');
      } else {
        await nursingService.addService(serviceForm);
        toast.success('تم إضافة الخدمة بنجاح');
      }
      setIsServiceDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء حفظ الخدمة');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      try {
        await nursingService.deleteService(id);
        toast.success('تم حذف الخدمة بنجاح');
        fetchData();
      } catch (error) {
        toast.error('فشل حذف الخدمة');
      }
    }
  };

  // Booking Status Handler
  const handleUpdateBookingStatus = async (id: string, status: NursingBooking['status']) => {
    try {
      await nursingService.updateBookingStatus(id, status);
      toast.success('تم تحديث حالة طلب الزيارة');
      fetchData();
    } catch (error) {
      toast.error('فشل تحديث حالة الطلب');
    }
  };

  const filteredNurses = nurses.filter(
    (n) =>
      n.name.toLowerCase().includes(nurseSearch.toLowerCase()) ||
      n.titleAr.toLowerCase().includes(nurseSearch.toLowerCase()) ||
      n.locationAr.toLowerCase().includes(nurseSearch.toLowerCase())
  );

  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter === 'all') return true;
    return b.status === bookingFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                <HeartPulse className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold font-cairo">خدمات التمريض المنزلي</h1>
                <p className="text-muted-foreground font-cairo text-sm">
                  إدارة الممرضين والممرضات، أنواع الخدمات، ومتابعة طلبات الزيارات المنزلية
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchData} className="font-cairo">
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>

            {activeTab === 'nurses' && (
              <Button onClick={() => handleOpenNurseDialog()} className="gradient-primary text-primary-foreground font-cairo">
                <Plus className="w-4 h-4 ml-2" />
                إضافة ممرض جديد
              </Button>
            )}

            {activeTab === 'services' && (
              <Button onClick={() => handleOpenServiceDialog()} className="gradient-primary text-primary-foreground font-cairo">
                <Plus className="w-4 h-4 ml-2" />
                إضافة خدمة جديدة
              </Button>
            )}
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">إجمالي الممرضين</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{nurses.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">الممرضين الموثقين</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">
                {nurses.filter((n) => n.isVerified).length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">أنواع الخدمات</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{services.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">طلبات الزيارات</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{bookings.length}</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('nurses')}
            className={`py-3 px-6 text-sm font-semibold font-cairo border-b-2 transition-colors ${
              activeTab === 'nurses'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👨‍⚕️ إدارة الممرضين والممرضات ({nurses.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`py-3 px-6 text-sm font-semibold font-cairo border-b-2 transition-colors ${
              activeTab === 'services'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🩺 خدمات التمريض ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-6 text-sm font-semibold font-cairo border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 طلبات الزيارات المنزلية ({bookings.length})
          </button>
        </div>

        {/* Tab 1: Nurses List */}
        {activeTab === 'nurses' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="ابحث باسم الممرض، التخصص، أو المنطقة..."
                value={nurseSearch}
                onChange={(e) => setNurseSearch(e.target.value)}
                className="pr-9 font-cairo"
              />
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-gray-500 font-cairo">جاري تحميل بيانات الممرضين...</div>
            ) : filteredNurses.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-gray-100">
                <User className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="font-cairo text-gray-600">لا يوجد ممرضين مطابقين للبحث</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNurses.map((nurse) => (
                  <motion.div
                    key={nurse.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="relative">
                          <SafeImage
                            src={nurse.avatarUrl}
                            alt={nurse.name}
                            isAvatar
                            className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shrink-0"
                          />
                          {nurse.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 font-cairo text-base truncate">
                              {nurse.name}
                            </h3>
                          </div>
                          <p className="text-xs text-indigo-600 font-cairo font-medium mb-1">
                            {nurse.titleAr}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-3.5 h-3.5 fill-current" /> {nurse.rating}
                            </span>
                            <span>({nurse.reviewsCount} تقييم)</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Badges */}
                      <div className="space-y-2 text-xs text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-gray-400" /> الخبرة:
                          </span>
                          <span className="font-bold text-gray-800 font-cairo">{nurse.experienceYears} سنوات</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" /> المنطقة:
                          </span>
                          <span className="font-medium text-gray-800 font-cairo">{nurse.locationAr}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-gray-400" /> الهاتف:
                          </span>
                          <span className="font-mono text-gray-800">{nurse.phone}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-gray-400" /> سعر الزيارة:
                          </span>
                          <span className="font-bold text-emerald-600 font-cairo">{nurse.price} ج.م</span>
                        </div>
                      </div>

                      {/* Coverage Areas */}
                      {nurse.coverageAreas && nurse.coverageAreas.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1 font-cairo">
                            <Compass className="w-3 h-3 text-emerald-600" /> مناطق التغطية ({nurse.coverageRadiusKm || 10} كم):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {nurse.coverageAreas.map((area) => (
                              <span
                                key={area}
                                className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-cairo border border-emerald-200"
                              >
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Services badges */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {nurse.serviceIds.map((sid) => {
                          const sObj = services.find((s) => s.id === sid);
                          return (
                            <Badge key={sid} variant="secondary" className="text-[10px] font-cairo">
                              {sObj ? sObj.titleAr : sid}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 font-cairo text-xs"
                        onClick={() => handleOpenNurseDialog(nurse)}
                      >
                        <Edit className="w-3.5 h-3.5 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`text-xs font-cairo ${nurse.isVerified ? 'text-amber-600' : 'text-emerald-600'}`}
                        onClick={() => handleToggleNurseVerified(nurse.id, nurse.isVerified)}
                      >
                        {nurse.isVerified ? 'إلغاء التوثيق' : 'توثيق'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteNurse(nurse.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Services List */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: service.accentColorHex || '#3638DA' }}
                    >
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-xs">
                      تبدأ من {service.startingPrice} ج.م
                    </Badge>
                  </div>

                  <h3 className="font-bold text-gray-900 font-cairo text-lg">{service.titleAr}</h3>
                  <p className="text-xs text-gray-400 font-mono mb-2">{service.titleEn}</p>
                  <p className="text-xs text-gray-600 font-cairo leading-relaxed">{service.descriptionAr}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 font-cairo text-xs"
                    onClick={() => handleOpenServiceDialog(service)}
                  >
                    <Edit className="w-3.5 h-3.5 ml-1" />
                    تعديل الخدمة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Bookings List */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex gap-2">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((st) => (
                <Button
                  key={st}
                  variant={bookingFilter === st ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setBookingFilter(st)}
                  className="font-cairo text-xs"
                >
                  {st === 'all' && 'الكل'}
                  {st === 'pending' && 'معلق'}
                  {st === 'confirmed' && 'مؤكد'}
                  {st === 'completed' && 'مكتمل'}
                  {st === 'cancelled' && 'ملغي'}
                </Button>
              ))}
            </div>

            {filteredBookings.length === 0 ? (
              <div className="py-12 text-center bg-white rounded-2xl border border-gray-100 font-cairo text-gray-500">
                لا توجد طلبات زيارات منزلية مسجلة حالياً
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-cairo text-xs">
                    <tr>
                      <th className="p-4">المريض / العميل</th>
                      <th className="p-4">الممرض المطلوبة</th>
                      <th className="p-4">العنوان</th>
                      <th className="p-4">الموعد</th>
                      <th className="p-4">السعر</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-cairo">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{b.userName}</p>
                          <p className="text-xs text-gray-500 dir-ltr text-right">{b.userPhone}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-indigo-600">{b.nurseName}</p>
                          {b.serviceTitleAr && <p className="text-xs text-gray-400">{b.serviceTitleAr}</p>}
                        </td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs">
                          <p className="font-medium text-slate-800 line-clamp-2">{b.address || 'لم يحدد عنوان نصي'}</p>
                          {b.latitude && b.longitude ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 transition-all"
                            >
                              <ExternalLink className="w-3 h-3" /> فتح موقع المريض بالخريطة 📍
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              <ExternalLink className="w-3 h-3" /> بحث في الخريطة 🗺️
                            </a>
                          )}
                        </td>
                        <td className="p-4 text-xs">
                          {b.isImmediate ? (
                            <Badge className="bg-red-50 text-red-600 border-red-200">زيارة فورية ⚡</Badge>
                          ) : (
                            <span>{b.scheduledDate || 'محدد مسبقاً'}</span>
                          )}
                        </td>
                        <td className="p-4 font-bold text-emerald-600">{b.price} ج.م</td>
                        <td className="p-4">
                          <Badge
                            className={`
                              ${b.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                              ${b.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                              ${b.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                              ${b.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}
                            `}
                          >
                            {b.status === 'pending' && 'معلق'}
                            {b.status === 'confirmed' && 'مؤكد'}
                            {b.status === 'completed' && 'مكتمل'}
                            {b.status === 'cancelled' && 'ملغي'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <select
                            value={b.status}
                            onChange={(e) =>
                              handleUpdateBookingStatus(b.id, e.target.value as NursingBooking['status'])
                            }
                            className="text-xs p-1.5 rounded-lg border border-gray-200 bg-white font-cairo focus:outline-none"
                          >
                            <option value="pending">معلق</option>
                            <option value="confirmed">تأكيد الطلب</option>
                            <option value="completed">تم الاختتام</option>
                            <option value="cancelled">إلغاء الطلب</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Nurse Dialog */}
        <Dialog open={isNurseDialogOpen} onOpenChange={setIsNurseDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto font-cairo" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingNurse ? 'تعديل بيانات الممرض' : 'إضافة ممرض جديد'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveNurse} className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الممرض / الممرضة *</Label>
                <Input
                  value={nurseForm.name}
                  onChange={(e) => setNurseForm({ ...nurseForm, name: e.target.value })}
                  placeholder="مثال: د. أحمد محمود"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>المسمى الوظيفي (عربي)</Label>
                  <Input
                    value={nurseForm.titleAr}
                    onChange={(e) => setNurseForm({ ...nurseForm, titleAr: e.target.value })}
                    placeholder="مثال: أخصائي تمريض جراحي"
                  />
                </div>
                <div className="space-y-2">
                  <Label>المسمى الوظيفي (إنجليزي)</Label>
                  <Input
                    value={nurseForm.titleEn}
                    onChange={(e) => setNurseForm({ ...nurseForm, titleEn: e.target.value })}
                    placeholder="Surgical Nurse"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" /> صورة الشخصية (Supabase Storage)
                </Label>
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={nurseForm.avatarUrl}
                    alt="معاينة"
                    isAvatar
                    className="w-12 h-12 rounded-xl object-cover border shrink-0"
                  />
                  <label className="cursor-pointer bg-white px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 flex items-center gap-1">
                    {isUploadingAvatar ? 'جاري الرفع...' : 'تغيير الصورة'}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input
                    value={nurseForm.phone}
                    onChange={(e) => setNurseForm({ ...nurseForm, phone: e.target.value })}
                    placeholder="01012345678"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>سعر الزيارة (ج.م)</Label>
                  <Input
                    type="number"
                    value={nurseForm.price}
                    onChange={(e) => setNurseForm({ ...nurseForm, price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>المنطقة (عربي)</Label>
                  <Input
                    value={nurseForm.locationAr}
                    onChange={(e) => setNurseForm({ ...nurseForm, locationAr: e.target.value })}
                    placeholder="المعادي، القاهرة"
                  />
                </div>
                <div className="space-y-2">
                  <Label>سنوات الخبرة</Label>
                  <Input
                    type="number"
                    value={nurseForm.experienceYears}
                    onChange={(e) => setNurseForm({ ...nurseForm, experienceYears: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label>الخدمات التي يقدمها:</Label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nurseForm.serviceIds.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNurseForm({ ...nurseForm, serviceIds: [...nurseForm.serviceIds, s.id] });
                          } else {
                            setNurseForm({
                              ...nurseForm,
                              serviceIds: nurseForm.serviceIds.filter((id) => id !== s.id),
                            });
                          }
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>{s.titleAr}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>نبذة عن الممرض (عربي)</Label>
                <Textarea
                  value={nurseForm.aboutAr}
                  onChange={(e) => setNurseForm({ ...nurseForm, aboutAr: e.target.value })}
                  placeholder="خبرة طويلة في تركيب المحاليل والرعاية المنزلية..."
                  rows={2}
                />
              </div>

              {/* Map Location & Coverage Areas Picker */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" /> موقع الممرض على خريطة القمر الصناعي ومناطق التغطية 🛰️
                </Label>
                <MapLocationPicker
                  latitude={nurseForm.latitude}
                  longitude={nurseForm.longitude}
                  coverageAreas={nurseForm.coverageAreas}
                  coverageRadiusKm={nurseForm.coverageRadiusKm}
                  onChange={(locData) => {
                    setNurseForm((prev) => ({
                      ...prev,
                      latitude: locData.latitude,
                      longitude: locData.longitude,
                      coverageAreas: locData.coverageAreas,
                      coverageRadiusKm: locData.coverageRadiusKm,
                      locationAr: locData.locationAr || prev.locationAr,
                    }));
                  }}
                />
              </div>

              {/* Account Creation Section */}
              <div className="space-y-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="createAccountToggle"
                    checked={accountForm.createAccount}
                    onChange={(e) => setAccountForm({ ...accountForm, createAccount: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <Label htmlFor="createAccountToggle" className="cursor-pointer text-xs font-bold text-indigo-900">
                    🔑 إنشاء / تحديث حساب دخول الممرض للوحة التحكم
                  </Label>
                </div>

                {accountForm.createAccount && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs">البريد الإلكتروني للدخول *</Label>
                      <Input
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                        placeholder="nurse@pharmanow.com"
                        dir="ltr"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">كلمة المرور *</Label>
                      <Input
                        type="password"
                        value={accountForm.password}
                        onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                        placeholder="••••••••"
                        dir="ltr"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="nurseVerified"
                  checked={nurseForm.isVerified}
                  onChange={(e) => setNurseForm({ ...nurseForm, isVerified: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <Label htmlFor="nurseVerified" className="cursor-pointer text-sm">
                  ممرض موثق ومفعل في التطبيق
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsNurseDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="gradient-primary text-white">
                  حفظ الممرض
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Service Dialog */}
        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent className="max-w-md font-cairo" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة تمريض جديدة'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div className="space-y-2">
                <Label>اسم الخدمة (عربي) *</Label>
                <Input
                  value={serviceForm.titleAr}
                  onChange={(e) => setServiceForm({ ...serviceForm, titleAr: e.target.value })}
                  placeholder="إعطاء الحقن"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>اسم الخدمة (إنجليزي) *</Label>
                <Input
                  value={serviceForm.titleEn}
                  onChange={(e) => setServiceForm({ ...serviceForm, titleEn: e.target.value })}
                  placeholder="Injections"
                  dir="ltr"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={serviceForm.descriptionAr}
                  onChange={(e) => setServiceForm({ ...serviceForm, descriptionAr: e.target.value })}
                  placeholder="حقن عضل ووريد بأيدي متخصصين..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>السعر المبدئي (ج.م)</Label>
                  <Input
                    type="number"
                    value={serviceForm.startingPrice}
                    onChange={(e) => setServiceForm({ ...serviceForm, startingPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>لون الـ Badge</Label>
                  <Input
                    type="color"
                    value={serviceForm.accentColorHex}
                    onChange={(e) => setServiceForm({ ...serviceForm, accentColorHex: e.target.value })}
                    className="h-10 cursor-pointer p-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="gradient-primary text-white">
                  حفظ الخدمة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
