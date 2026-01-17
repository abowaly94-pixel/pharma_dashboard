import { motion } from 'framer-motion';
import { Settings, Bell, User, Mail, Phone, Shield, LogOut, Key, Eye, EyeOff } from 'lucide-react';
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
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
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

export default function AdminSettings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  // User Settings
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  // API Keys Settings
  const [apiKeys, setApiKeys] = useState({
    removeBgApiKey: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<{
    isValid: boolean;
    remainingCalls?: number;
    error?: string;
  } | null>(null);
  const [isTestingApiKey, setIsTestingApiKey] = useState(false);
  
  // Profile Data
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
      });
      
      // Load API keys
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    try {
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      const apiKeysDoc = await getDoc(apiKeysRef);
      
      if (apiKeysDoc.exists()) {
        const data = apiKeysDoc.data();
        const removeBgKey = data.removeBgApiKey || '';
        setApiKeys({
          removeBgApiKey: removeBgKey,
        });
        
        // Test API key if it exists
        if (removeBgKey.trim()) {
          setTimeout(() => {
            testApiKey();
          }, 500);
        }
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    setIsLoadingApiKeys(true);
    try {
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      await setDoc(apiKeysRef, {
        removeBgApiKey: apiKeys.removeBgApiKey,
        updatedAt: new Date(),
        updatedBy: user?.uid,
      }, { merge: true });
      
      toast.success('تم حفظ مفاتيح API بنجاح');
      
      // Test the API key after saving
      if (apiKeys.removeBgApiKey.trim()) {
        await testApiKey();
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast.error('فشل حفظ مفاتيح API');
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  const testApiKey = async () => {
    if (!apiKeys.removeBgApiKey.trim()) {
      setApiKeyStatus({ isValid: false, error: 'مفتاح API فارغ' });
      return;
    }

    setIsTestingApiKey(true);
    setApiKeyStatus(null);

    try {
      // Test API key by making a request to get account info
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKeys.removeBgApiKey.trim(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApiKeyStatus({
          isValid: true,
          remainingCalls: data.attributes?.api?.free_calls_remaining || 0,
        });
        toast.success('مفتاح API صحيح ويعمل بشكل طبيعي');
      } else {
        let errorMessage = 'مفتاح API غير صحيح';
        
        if (response.status === 403) {
          errorMessage = 'مفتاح API غير صحيح أو منتهي الصلاحية';
        } else if (response.status === 429) {
          errorMessage = 'تم تجاوز الحد المسموح من الطلبات';
        }
        
        setApiKeyStatus({ isValid: false, error: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      setApiKeyStatus({ isValid: false, error: 'فشل في اختبار المفتاح' });
      toast.error('فشل في اختبار مفتاح API');
    } finally {
      setIsTestingApiKey(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: profileData.name,
        phoneNumber: profileData.phone,
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
              <p className="text-muted-foreground">إدارة إعدادات النظام والتفضيلات</p>
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
                    {user?.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold font-cairo">{user?.name}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Shield className="w-4 h-4 text-destructive" />
                    <p className="text-sm text-destructive font-cairo font-medium">مدير النظام</p>
                  </div>
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
                    <Shield className="w-4 h-4" />
                    الدور
                  </Label>
                  <Input
                    value="مدير النظام"
                    disabled
                    className="font-cairo bg-muted"
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

        {/* API Keys Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <Key className="w-5 h-5 text-primary" />
                مفاتيح API
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-cairo flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    مفتاح Remove.bg API
                  </Label>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeys.removeBgApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, removeBgApiKey: e.target.value })}
                      placeholder="أدخل مفتاح Remove.bg API"
                      className="font-mono pl-12 text-right"
                      dir="rtl"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute left-2 top-0 bottom-0 my-auto h-8 w-8 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    يستخدم لإزالة خلفية الصور. احصل على مفتاح مجاني من{' '}
                    <a 
                      href="https://www.remove.bg/api" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      remove.bg
                    </a>
                  </p>
                  
                  {/* API Key Status */}
                  {apiKeyStatus && (
                    <div className={`p-3 rounded-lg border ${
                      apiKeyStatus.isValid 
                        ? 'bg-green-50 border-green-200 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          apiKeyStatus.isValid ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className="font-cairo text-sm font-medium">
                          {apiKeyStatus.isValid ? 'المفتاح صحيح' : 'المفتاح غير صحيح'}
                        </span>
                      </div>
                      {apiKeyStatus.error && (
                        <p className="text-xs mt-1">{apiKeyStatus.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <p className="font-cairo">💡 نصائح:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>كل حساب مجاني يحصل على 50 صورة شهرياً</li>
                    <li>يمكنك إنشاء حسابات متعددة للحصول على المزيد</li>
                    <li>تأكد من صحة المفتاح قبل الحفظ</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={testApiKey}
                    disabled={isTestingApiKey || !apiKeys.removeBgApiKey.trim()}
                    className="font-cairo"
                  >
                    {isTestingApiKey ? 'جاري الاختبار...' : 'اختبار المفتاح'}
                  </Button>
                  <Button
                    onClick={handleSaveApiKeys}
                    disabled={isLoadingApiKeys || !apiKeys.removeBgApiKey.trim()}
                    className="font-cairo"
                  >
                    {isLoadingApiKeys ? 'جاري الحفظ...' : 'حفظ المفاتيح'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Notifications Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
                    إشعارات النظام
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    استقبال إشعارات الطلبات والمستخدمين الجدد
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

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-cairo">
                <Settings className="w-5 h-5 text-primary" />
                معلومات النظام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">إصدار النظام</p>
                  <p className="font-cairo font-semibold">v1.0.0</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">آخر تحديث</p>
                  <p className="font-cairo font-semibold">يناير 2026</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">حالة النظام</p>
                  <p className="font-cairo font-semibold text-success">نشط</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logout Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
