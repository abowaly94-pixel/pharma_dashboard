import { motion } from 'framer-motion';
import { Settings, Bell, User, Mail, Phone, Store, FileText, LogOut } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

export default function PharmacistSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    pharmacyName: user?.pharmacyName || '',
    street: user?.street || '',
    city: user?.city || '',
    governorate: user?.governorate || '',
    postalCode: user?.postalCode || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        pharmacyName: user.pharmacyName || '',
        street: user.street || '',
        city: user.city || '',
        governorate: user.governorate || '',
        postalCode: user.postalCode || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    // Validate basic fields
    if (!profileData.name || profileData.name.trim().length < 2) {
      toast.error('الاسم الكامل مطلوب (حرفين على الأقل)');
      return;
    }
    
    if (!profileData.pharmacyName || profileData.pharmacyName.trim().length < 2) {
      toast.error('اسم الصيدلية مطلوب (حرفين على الأقل)');
      return;
    }
    
    // Validate address fields - ALL REQUIRED
    if (!profileData.street || profileData.street.trim().length < 3) {
      toast.error('⚠️ الشارع مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (!profileData.city || profileData.city.trim().length < 2) {
      toast.error('⚠️ المدينة مطلوبة (حرفين على الأقل)');
      return;
    }
    if (!profileData.governorate || profileData.governorate.trim().length < 2) {
      toast.error('⚠️ المحافظة مطلوبة (حرفين على الأقل)');
      return;
    }
    if (!profileData.postalCode || profileData.postalCode.trim().length < 5) {
      toast.error('⚠️ الرمز البريدي مطلوب (5 أرقام على الأقل)');
      return;
    }
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.name.trim(),
        phoneNumber: profileData.phone,
        pharmacyName: profileData.pharmacyName.trim(),
        street: profileData.street.trim(),
        city: profileData.city.trim(),
        governorate: profileData.governorate.trim(),
        postalCode: profileData.postalCode.trim(),
      });
      
      // Also update pharmacy document
      const pharmacyRef = doc(db, 'pharmacies', user.uid);
      await updateDoc(pharmacyRef, {
        name: profileData.pharmacyName.trim(),
        street: profileData.street.trim(),
        city: profileData.city.trim(),
        governorate: profileData.governorate.trim(),
        postalCode: profileData.postalCode.trim(),
      });
      
      await refreshUser();
      toast.success('✅ تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('❌ فشل حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('هل أنت متأكد من تسجيل الخروج؟')) return;
    
    try {
      await logout();
      toast.success('تم تسجيل الخروج بنجاح');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('فشل تسجيل الخروج');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo mb-2">الإعدادات</h1>
          <p className="text-muted-foreground">إدارة معلومات حسابك</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <User className="w-5 h-5" />
                المعلومات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="الاسم الكامل"
                    className="font-cairo"
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    value={profileData.email}
                    disabled
                    className="font-cairo bg-muted"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="رقم الهاتف"
                    className="font-cairo"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    اسم الصيدلية
                  </Label>
                  <Input
                    value={profileData.pharmacyName}
                    onChange={(e) => setProfileData({ ...profileData, pharmacyName: e.target.value })}
                    placeholder="اسم الصيدلية"
                    className="font-cairo"
                    dir="rtl"
                  />
                </div>
              </div>

              <Separator className="my-4" />
              
              {/* Address Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold font-cairo text-red-600 flex items-center gap-2">
                  <span>📍</span>
                  عنوان الصيدلية بالتفصيل *
                </h3>
                <p className="text-sm text-red-600 font-cairo font-bold">
                  ⚠️ يجب إدخال العنوان بالكامل لتتمكن من إضافة أو تعديل الأدوية
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-cairo text-red-600 font-bold flex items-center gap-1">
                      الشارع *
                      {profileData.street.trim().length < 3 && (
                        <span className="text-xs text-red-500">(مطلوب - 3 أحرف على الأقل)</span>
                      )}
                    </Label>
                    <Input
                      value={profileData.street}
                      onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                      placeholder="مثال: شارع الجمهورية"
                      className={`font-cairo ${!profileData.street || profileData.street.trim().length < 3 ? 'border-red-500 focus:border-red-600' : 'border-green-500'}`}
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-cairo text-red-600 font-bold flex items-center gap-1">
                      المدينة *
                      {profileData.city.trim().length < 2 && (
                        <span className="text-xs text-red-500">(مطلوب - حرفين على الأقل)</span>
                      )}
                    </Label>
                    <Input
                      value={profileData.city}
                      onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                      placeholder="مثال: المنصورة"
                      className={`font-cairo ${!profileData.city || profileData.city.trim().length < 2 ? 'border-red-500 focus:border-red-600' : 'border-green-500'}`}
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-cairo text-red-600 font-bold flex items-center gap-1">
                      المحافظة *
                      {profileData.governorate.trim().length < 2 && (
                        <span className="text-xs text-red-500">(مطلوب - حرفين على الأقل)</span>
                      )}
                    </Label>
                    <Input
                      value={profileData.governorate}
                      onChange={(e) => setProfileData({ ...profileData, governorate: e.target.value })}
                      placeholder="مثال: الدقهلية"
                      className={`font-cairo ${!profileData.governorate || profileData.governorate.trim().length < 2 ? 'border-red-500 focus:border-red-600' : 'border-green-500'}`}
                      dir="rtl"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-cairo text-red-600 font-bold flex items-center gap-1">
                      الرمز البريدي *
                      {profileData.postalCode.trim().length < 5 && (
                        <span className="text-xs text-red-500">(مطلوب - 5 أرقام على الأقل)</span>
                      )}
                    </Label>
                    <Input
                      value={profileData.postalCode}
                      onChange={(e) => setProfileData({ ...profileData, postalCode: e.target.value })}
                      placeholder="مثال: 35511"
                      className={`font-cairo ${!profileData.postalCode || profileData.postalCode.trim().length < 5 ? 'border-red-500 focus:border-red-600' : 'border-green-500'}`}
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={
                    isLoading || 
                    !profileData.name || profileData.name.trim().length < 2 ||
                    !profileData.pharmacyName || profileData.pharmacyName.trim().length < 2 ||
                    !profileData.street || profileData.street.trim().length < 3 ||
                    !profileData.city || profileData.city.trim().length < 2 ||
                    !profileData.governorate || profileData.governorate.trim().length < 2 ||
                    !profileData.postalCode || profileData.postalCode.trim().length < 5
                  }
                  className="font-cairo"
                  title={
                    !profileData.street || profileData.street.trim().length < 3 ||
                    !profileData.city || profileData.city.trim().length < 2 ||
                    !profileData.governorate || profileData.governorate.trim().length < 2 ||
                    !profileData.postalCode || profileData.postalCode.trim().length < 5
                      ? 'يجب إدخال جميع حقول العنوان بشكل صحيح'
                      : ''
                  }
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pharmacy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo">
                <Store className="w-5 h-5" />
                معلومات الصيدلية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">اسم الصيدلية</p>
                    <p className="font-cairo font-medium">
                      {user?.pharmacyName === 'صيدلية النخيل' ? 'الصيدلية' : (user?.pharmacyName || 'غير محدد')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">معرف الصيدلية</p>
                    <p className="font-cairo font-medium font-mono text-sm">{user?.pharmacyId || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-cairo text-destructive">
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-cairo font-medium mb-1">الخروج من الحساب</p>
                  <p className="text-sm text-muted-foreground">
                    سيتم تسجيل خروجك من النظام
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleLogout}
                  className="font-cairo"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
