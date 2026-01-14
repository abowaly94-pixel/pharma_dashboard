import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Palette, Store, User, Mail, Phone, MapPin, FileText, LogOut } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
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

export default function PharmacistSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // User Settings
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
    pharmacyName: user?.pharmacyName || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        pharmacyName: user.pharmacyName || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        phoneNumber: profileData.phone,
        pharmacyName: profileData.pharmacyName,
      });
      
      // Refresh user data
      await refreshUser();
      
      toast.success('تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('فشل حفظ البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
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
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl gradient-primary text-white shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-cairo">الإعدادات</h1>
              <p className="text-muted-foreground">إدارة إعدادات الصيدلية والتفضيلات</p>
            </div>
          </div>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <User className="w-5 h-5 text-primary" />
                الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24 border-4 border-primary/20">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold font-cairo">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <p className="text-sm text-primary font-cairo mt-1">صيدلي</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="font-cairo"
                >
                  {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <Bell className="w-5 h-5 text-primary" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-cairo font-medium">
                    إشعارات الطلبات الجديدة
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    استقبال إشعارات عند وصول طلبات جديدة
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="font-cairo font-medium">
                    تنبيهات البريد الإلكتروني
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    إرسال التنبيهات المهمة عبر البريد
                  </p>
                </div>
                <Switch
                  checked={emailAlerts}
                  onCheckedChange={setEmailAlerts}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pharmacy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <Store className="w-5 h-5 text-primary" />
                معلومات الصيدلية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Store className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">اسم الصيدلية</p>
                    <p className="font-cairo font-medium">{user?.pharmacyName || 'غير محدد'}</p>
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
          transition={{ delay: 0.4 }}
        >
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo text-destructive">
                <LogOut className="w-5 h-5" />
                تسجيل الخروج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-cairo font-medium mb-1">الخروج من الحساب</p>
                  <p className="text-sm text-muted-foreground">
                    سيتم تسجيل خروجك من النظام وإعادتك لصفحة تسجيل الدخول
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowLogoutDialog(true)}
                  className="font-cairo"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Confirmation Dialog */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo text-xl">تأكيد تسجيل الخروج</AlertDialogTitle>
              <AlertDialogDescription className="font-cairo text-base">
                هل أنت متأكد من تسجيل الخروج من حسابك؟
                <br />
                سيتم إعادتك إلى صفحة تسجيل الدخول.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLogout}
                className="bg-destructive hover:bg-destructive/90 font-cairo"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
