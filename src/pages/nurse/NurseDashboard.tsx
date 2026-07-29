import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HeartPulse,
  Calendar,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Star,
  DollarSign,
  Upload,
  ShieldCheck,
  ClipboardList,
  ExternalLink,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { SafeImage } from '@/components/ui/safe-image';
import { nursingService } from '@/services/nursingService';
import { Nurse, NursingBooking } from '@/types';
import { MapLocationPicker } from '@/components/maps/MapLocationPicker';

export default function NurseDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'schedule' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<NursingBooking[]>([]);
  const [nurseProfile, setNurseProfile] = useState<Nurse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit State
  const [isUploading, setIsUploading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    titleAr: '',
    phone: '',
    price: 100,
    locationAr: '',
    aboutAr: '',
    experienceYears: 5,
    avatarUrl: '',
    latitude: 30.0444,
    longitude: 31.2357,
    coverageAreas: ['الشيخ زايد', '6 أكتوبر'] as string[],
    coverageRadiusKm: 10,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const allNurses = await nursingService.getAllNurses();
      // Find current logged-in nurse by email or user.uid
      const currentNurse = allNurses.find(
        (n) => n.userId === user?.uid || (n.email && n.email === user?.email)
      ) || allNurses[0]; // fallback for demonstration if needed

      if (currentNurse) {
        setNurseProfile(currentNurse);
        setProfileForm({
          name: currentNurse.name,
          titleAr: currentNurse.titleAr,
          phone: currentNurse.phone,
          price: currentNurse.price,
          locationAr: currentNurse.locationAr,
          aboutAr: currentNurse.aboutAr,
          experienceYears: currentNurse.experienceYears,
          avatarUrl: currentNurse.avatarUrl,
          latitude: currentNurse.latitude || 30.0444,
          longitude: currentNurse.longitude || 31.2357,
          coverageAreas: currentNurse.coverageAreas || ['الشيخ زايد', '6 أكتوبر'],
          coverageRadiusKm: currentNurse.coverageRadiusKm || 10,
        });

        // Fetch bookings for this nurse
        const nurseBookings = await nursingService.getNurseBookings(currentNurse.id, currentNurse.email);
        setBookings(nurseBookings);
      }
    } catch (error) {
      console.error('Error fetching nurse portal data:', error);
      toast.error('حدث خطأ أثناء تحميل لوحة الممرض');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    if (nurseProfile) {
      const unsubscribe = nursingService.subscribeToNurseBookings(
        nurseProfile.id,
        nurseProfile.email,
        (liveBookings) => {
          setBookings(liveBookings);
        }
      );
      return () => unsubscribe();
    }
  }, [user, nurseProfile?.id]);

  const handleUpdateStatus = async (id: string, status: NursingBooking['status']) => {
    try {
      await nursingService.updateBookingStatus(id, status);
      toast.success('تم تحديث حالة الزيارة بنجاح');
      fetchData();
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث حالة الزيارة');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info('جاري رفع الصورة على Supabase...');

    try {
      const res = await nursingService.uploadNurseAvatar(file);
      if (res.success && res.url) {
        setProfileForm((prev) => ({ ...prev, avatarUrl: res.url! }));
        toast.success('تم رفع الصورة بنجاح!');
      } else {
        toast.error(res.error || 'فشل رفع الصورة');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nurseProfile) return;

    try {
      await nursingService.updateNurse(nurseProfile.id, {
        name: profileForm.name,
        titleAr: profileForm.titleAr,
        phone: profileForm.phone,
        price: profileForm.price,
        locationAr: profileForm.locationAr,
        aboutAr: profileForm.aboutAr,
        experienceYears: profileForm.experienceYears,
        avatarUrl: profileForm.avatarUrl,
      });
      toast.success('تم حفظ بيانات الملف الشخصي بنجاح');
      fetchData();
    } catch (error) {
      toast.error('فشل حفظ بيانات الملف الشخصي');
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const completedBookings = bookings.filter((b) => b.status === 'completed');

  return (
    <DashboardLayout>
      <div className="space-y-6" dir="rtl">
        {/* Welcome Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-primary p-6 rounded-3xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <SafeImage
              src={nurseProfile?.avatarUrl || user?.profileImageUrl || ''}
              alt={nurseProfile?.name || 'Nurse'}
              isAvatar
              className="w-20 h-20 rounded-2xl object-cover border-2 border-white/30 shadow shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-cairo">
                  مرحباً، {nurseProfile?.name || user?.name} 👋
                </h1>
                {nurseProfile?.isVerified && (
                  <Badge className="bg-emerald-400 text-emerald-950 font-cairo border-none text-[10px]">
                    موثق معتمد ✨
                  </Badge>
                )}
              </div>
              <p className="text-white/80 font-cairo text-sm mt-1">
                {nurseProfile?.titleAr || 'أخصائي تمريض منزلي'}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/90 mt-2">
                <span className="flex items-center gap-1 font-cairo font-bold">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-300" /> {nurseProfile?.rating || 4.9} ({nurseProfile?.reviewsCount || 10} تقييم)
                </span>
                <span>•</span>
                <span className="font-cairo">{nurseProfile?.locationAr || 'القاهرة'}</span>
              </div>
            </div>
          </div>

          <Button onClick={fetchData} className="bg-white/20 hover:bg-white/30 text-white font-cairo border-none">
            <RefreshCw className="w-4 h-4 ml-2" />
            تحديث البيانات
          </Button>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">إجمالي الطلبات الموجهة</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{bookings.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">طلبات بانتظار التأكيد</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{pendingBookings.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">الزيارات القادمة</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{confirmedBookings.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-cairo">الزيارات المكتملة</p>
              <h3 className="text-2xl font-bold font-cairo text-gray-900">{completedBookings.length}</h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`py-3 px-6 text-sm font-semibold font-cairo border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 طلبات الزيارات ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 px-6 text-sm font-semibold font-cairo border-b-2 transition-colors ${
              activeTab === 'schedule'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🗓️ جدول المواعيد والزيارات ({confirmedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-6 text-sm font-semibold font-cairo border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 الملف الشخصي والإعدادات
          </button>
        </div>

        {/* Tab 1: Bookings Management */}
        {activeTab === 'bookings' && (
          <div className="space-y-4 font-cairo">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">جاري تحميل طلباتك...</div>
            ) : bookings.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100">
                <HeartPulse className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-bold text-gray-700">لا توجد طلبات زيارة منزلية حالياً</h3>
                <p className="text-xs text-gray-500 mt-1">ستظهر الطلبات الجديدة الموجهة إليك هنا فور إرسالها من المرضى</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.map((b) => (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-xs text-gray-400">طلب زيارة رقم:</span>
                        <h4 className="font-bold text-gray-900 text-base">{b.userName}</h4>
                      </div>
                      <Badge
                        className={`
                          ${b.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : ''}
                          ${b.status === 'confirmed' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                          ${b.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : ''}
                          ${b.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-200' : ''}
                        `}
                      >
                        {b.status === 'pending' && 'بانتظار موافقتك ⏳'}
                        {b.status === 'confirmed' && 'مؤكدة وفي الانتظار 📅'}
                        {b.status === 'completed' && 'مكتملة تم إنجازها ✅'}
                        {b.status === 'cancelled' && 'ملغية ❌'}
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold">رقم الهاتف:</span>
                        <a href={`tel:${b.userPhone}`} className="text-indigo-600 underline dir-ltr">
                          {b.userPhone}
                        </a>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <div>
                          <span className="font-bold">العنوان:</span>
                          <p className="text-gray-600 mt-0.5">{b.address}</p>
                          {b.latitude && b.longitude ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${b.latitude},${b.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition-all shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> فتح موقع المريض بالخريطة مباشرة 📍
                            </a>
                          ) : (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address || '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"
                            >
                              <ExternalLink className="w-3 h-3" /> فتح في خرائط جوجل 🗺️
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold">الموعد:</span>
                        <span>{b.isImmediate ? 'زیارة فورية ⚡' : b.scheduledDate}</span>
                      </div>

                      {b.notes && (
                        <div className="flex items-start gap-2 pt-1 border-t border-gray-200 mt-2">
                          <span className="font-bold text-gray-500">ملاحظات العميل:</span>
                          <span className="text-gray-700 italic">{b.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Action Buttons */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <span className="text-xs text-gray-400">قيمة الزيارة:</span>
                        <p className="text-lg font-bold text-emerald-600">{b.price} ج.م</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-cairo text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                            تأكيد واستلام الزيارة
                          </Button>
                        )}

                        {b.status === 'confirmed' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(b.id, 'completed')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-cairo text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                            تم إكمال الزيارة
                          </Button>
                        )}

                        {b.status !== 'cancelled' && b.status !== 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                            className="text-red-500 hover:text-red-600 font-cairo text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 ml-1" />
                            إلغاء
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Schedule & Appointments */}
        {activeTab === 'schedule' && (
          <div className="space-y-4 font-cairo">
            {confirmedBookings.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                لا توجد مواعيد قادمة مؤكدة في جدولك حالياً
              </div>
            ) : (
              <div className="space-y-3">
                {confirmedBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-4 rounded-2xl border-r-4 border-r-indigo-600 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-50 text-indigo-700 border-none font-cairo">
                          {b.isImmediate ? 'زيارة فورية ⚡' : b.scheduledDate}
                        </Badge>
                        <h4 className="font-bold text-gray-900 text-base">{b.userName}</h4>
                      </div>
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {b.address}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={`tel:${b.userPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> الاتصال بالمريض
                      </a>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(b.id, 'completed')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-cairo text-xs"
                      >
                        إكمال الزيارة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Nurse Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl font-cairo">
            <h3 className="text-xl font-bold text-gray-900 mb-6">تعديل ملفك الشخصي كـ ممرض</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>المسمى الوظيفي والتخصص</Label>
                <Input
                  value={profileForm.titleAr}
                  onChange={(e) => setProfileForm({ ...profileForm, titleAr: e.target.value })}
                  placeholder="أخصائي تمريض عناية وجروح"
                />
              </div>

              <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Label className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-600" /> صورة البروفايل (Supabase Storage)
                </Label>
                <div className="flex items-center gap-3">
                  <SafeImage
                    src={profileForm.avatarUrl}
                    alt="معاينة"
                    isAvatar
                    className="w-14 h-14 rounded-xl object-cover border shrink-0"
                  />
                  <label className="cursor-pointer bg-white px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100 flex items-center gap-1">
                    {isUploading ? 'جاري الرفع...' : 'رفع صورة جديدة'}
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف للتواصل</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>سعر الزيارة الشاملة (ج.م)</Label>
                  <Input
                    type="number"
                    value={profileForm.price}
                    onChange={(e) => setProfileForm({ ...profileForm, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>المنطقة والموقع</Label>
                  <Input
                    value={profileForm.locationAr}
                    onChange={(e) => setProfileForm({ ...profileForm, locationAr: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>سنوات الخبرة</Label>
                  <Input
                    type="number"
                    value={profileForm.experienceYears}
                    onChange={(e) => setProfileForm({ ...profileForm, experienceYears: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>نبذة تعريفية للمرضى (عربي)</Label>
                <Textarea
                  value={profileForm.aboutAr}
                  onChange={(e) => setProfileForm({ ...profileForm, aboutAr: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Map Location & Coverage Areas Picker */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <Label className="text-sm font-bold text-slate-900 flex items-center gap-1.5 font-cairo">
                  <MapPin className="w-4 h-4 text-emerald-600" /> موقعك على خريطة القمر الصناعي ومناطق تغطيتك 🛰️
                </Label>
                <MapLocationPicker
                  latitude={profileForm.latitude}
                  longitude={profileForm.longitude}
                  coverageAreas={profileForm.coverageAreas}
                  coverageRadiusKm={profileForm.coverageRadiusKm}
                  onChange={(locData) => {
                    setProfileForm((prev) => ({
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

              <Button type="submit" className="gradient-primary text-white w-full mt-4 h-11 text-base">
                حفظ التعديلات في بروفايل الممرض
              </Button>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
