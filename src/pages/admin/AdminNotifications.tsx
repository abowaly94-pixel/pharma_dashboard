import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, serverTimestamp, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { Send, Users, UserCheck, Bell, Smartphone, Info, Trash2, CheckCheck, AlertTriangle, Search, Check, ExternalLink } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { sendNotification, NotificationData, deleteNotification, deleteAllNotifications } from '@/lib/notifications';
import { sendFCMPushNotificationV1, isFCMV1Configured } from '@/services/fcmServiceV1';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
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
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ShoppingCart, Pill, Package } from 'lucide-react';

const iconMap: Record<string, any> = {
  order: ShoppingCart,
  medicine: Pill,
  user: Users,
  system: Bell,
  general: Package,
};

const colorMap: Record<string, string> = {
  order: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  medicine: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  user: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  system: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  general: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

export default function AdminNotifications() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(false);
  const [fcmConfigured, setFcmConfigured] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'general' as NotificationData['type'],
    targetRole: 'all',
    imageUrl: '',
    actionUrl: ''
  });
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const { requestPermission: registerThisDevice } = useNotifications();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ totalUsers: 0, usersWithTokens: 0 });
  const [showUserList, setShowUserList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [authError, setAuthError] = useState(false);
  const navigate = useNavigate();

  // Check if FCM is configured
  useEffect(() => {
    const initData = async () => {
      const configured = await isFCMV1Configured();
      setFcmConfigured(configured);

      try {
        const tokensRef = collection(db, 'fcmTokens');
        const tokensSnapshot = await getDocs(tokensRef);
        const validTokens = tokensSnapshot.docs.filter(doc => !!doc.data().token);
        setTokenCount(validTokens.length);

        const usersWithTokens = new Set(validTokens.map(doc => doc.data().userId));

        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          hasToken: usersWithTokens.has(doc.id)
        }));

        setAllUsers(usersList as any);
        setUserStats({
          totalUsers: usersList.length,
          usersWithTokens: usersWithTokens.size
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };

    initData();

    // Fetch campaigns
    const q = query(collection(db, 'push_campaigns'), orderBy('sentAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCampaigns(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Show confirmation for sending to all
    if (formData.targetRole === 'all') {
      setShowSendConfirm(true);
      return;
    }

    await sendWebNotification();
  };

  const sendWebNotification = async () => {
    setIsLoading(true);
    setShowSendConfirm(false);

    try {
      const notificationData: NotificationData = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
        imageUrl: formData.imageUrl || undefined,
        actionUrl: formData.actionUrl || undefined
      };

      // Set target roles based on selection
      if (formData.targetRole !== 'all') {
        notificationData.targetRoles = [formData.targetRole as any];
      }

      await sendNotification(notificationData);

      toast.success('تم إرسال الإشعار بنجاح ✓');

      // Reset form
      setFormData({
        title: '',
        body: '',
        type: 'general',
        targetRole: 'all',
        imageUrl: '',
        actionUrl: ''
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('فشل إرسال الإشعار');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushNotification = async () => {
    if (!formData.title || !formData.body) {
      toast.error('يرجى ملء العنوان والمحتوى');
      return;
    }

    setIsPushLoading(true);

    try {
      const targetRoles = formData.targetRole !== 'all' && formData.targetRole !== 'specific' ? [formData.targetRole] : undefined;
      const targetUsers = formData.targetRole === 'specific' ? selectedUserIds : undefined;

      if (formData.targetRole === 'specific' && selectedUserIds.length === 0) {
        toast.error('يرجى اختيار مستخدم واحد على الأقل');
        return;
      }

      const result = await sendFCMPushNotificationV1({
        title: formData.title,
        body: formData.body,
        imageUrl: formData.imageUrl || undefined,
        actionUrl: formData.actionUrl || undefined,
        targetRoles,
        targetUsers
      });

      if (result.success) {
        setAuthError(false);
        toast.success(result.message);

        // Save to push_campaigns
        await addDoc(collection(db, 'push_campaigns'), {
          title: formData.title,
          body: formData.body,
          type: formData.type,
          targetRole: formData.targetRole,
          targetUsersCount: targetUsers?.length || 0,
          sentCount: result.sentCount || 0,
          status: 'Completed',
          sentAt: serverTimestamp(),
          sentBy: user?.name || 'Admin',
          imageUrl: formData.imageUrl || '',
          actionUrl: formData.actionUrl || ''
        });

        // Also save to global notifications (for the bell icon)
        await sendNotification({
          title: formData.title,
          body: formData.body,
          type: formData.type,
          imageUrl: formData.imageUrl || '',
          actionUrl: formData.actionUrl || '',
          targetRoles: (targetRoles || null) as any,
          targetUsers: targetUsers || null
        });

        // Reset form
        setFormData({
          title: '',
          body: '',
          type: 'general',
          targetRole: 'all',
          imageUrl: '',
          actionUrl: ''
        });
        setSelectedUserIds([]);
      } else {
        if (result.status === 401) {
          setAuthError(true);
        }
        toast.error(result.message || 'فشل إرسال الإشعار (خطأ في الاستجابة)');
      }
    } catch (error: any) {
      console.error('CRITICAL: Push Notification Exception Caught:', error);
      // Detailed error message for debugging
      const errorMsg = error?.message || 'خطأ غير معروف في السيستم';
      toast.error(`حدث خطأ تقني: ${errorMsg}`);
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setNotificationToDelete(notificationId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteNotification = async () => {
    if (!notificationToDelete) return;

    try {
      await deleteNotification(notificationToDelete);
      toast.success('تم حذف الإشعار');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('فشل حذف الإشعار');
    } finally {
      setShowDeleteConfirm(false);
      setNotificationToDelete(null);
    }
  };

  const handleDeleteAllNotifications = async () => {
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAllNotifications = async () => {
    setIsDeletingAll(true);
    try {
      const count = await deleteAllNotifications();
      toast.success(`تم حذف ${count} إشعار`);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      toast.error('فشل حذف الإشعارات');
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const renderFormFields = () => (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="font-cairo">عنوان الإشعار</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="أدخل عنوان الإشعار"
          required
          className="font-cairo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="body" className="font-cairo">محتوى الإشعار</Label>
        <Textarea
          id="body"
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          placeholder="أدخل محتوى الإشعار"
          required
          rows={4}
          className="font-cairo"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type" className="font-cairo">نوع الإشعار</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as any })}
          >
            <SelectTrigger className="font-cairo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">عام</SelectItem>
              <SelectItem value="order">طلب</SelectItem>
              <SelectItem value="medicine">دواء</SelectItem>
              <SelectItem value="user">مستخدم</SelectItem>
              <SelectItem value="system">نظام</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetRole" className="font-cairo">المستهدفون</Label>
          <Select
            value={formData.targetRole}
            onValueChange={(value) => setFormData({ ...formData, targetRole: value })}
          >
            <SelectTrigger className="font-cairo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الجميع</SelectItem>
              <SelectItem value="admin">المسؤولين</SelectItem>
              <SelectItem value="pharmacist">الصيادلة</SelectItem>
              <SelectItem value="user">المستخدمين</SelectItem>
              <SelectItem value="specific">مستخدمين محددين</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.targetRole === 'specific' && (
        <div className="space-y-4 border rounded-xl p-4 bg-accent/10">
          <div className="flex items-center justify-between">
            <Label className="font-cairo">اختر المستخدمين المستهدفين ({selectedUserIds.length})</Label>
            <div className="relative w-48">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
          </div>

          <ScrollArea className="h-48 rounded-md border bg-background">
            <div className="p-2 space-y-1">
              {allUsers
                .filter(u =>
                  u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(targetUser => (
                  <div
                    key={targetUser.id}
                    onClick={() => {
                      setSelectedUserIds(prev =>
                        prev.includes(targetUser.id)
                          ? prev.filter(id => id !== targetUser.id)
                          : [...prev, targetUser.id]
                      );
                    }}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors text-sm",
                      selectedUserIds.includes(targetUser.id) ? "bg-primary/10" : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        targetUser.hasToken ? "bg-emerald-500" : "bg-gray-300"
                      )} title={targetUser.hasToken ? "جهاز مفعل" : "لا يوجد جهاز"} />
                      <div>
                        <p className="font-medium font-cairo">{targetUser.name}</p>
                        <p className="text-xs text-muted-foreground">{targetUser.email}</p>
                      </div>
                    </div>
                    {selectedUserIds.includes(targetUser.id) && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))
              }
            </div>
          </ScrollArea>
          {!allUsers.some(u => u.hasToken) && (
            <p className="text-[10px] text-amber-600 font-cairo">
              * الدائرة الخضراء تعني أن المستخدم لديه إشعارات مفعلة.
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="imageUrl" className="font-cairo">رابط الصورة (اختياري)</Label>
        <Input
          id="imageUrl"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
          type="url"
          className="font-cairo"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="actionUrl" className="font-cairo">رابط الإجراء (اختياري)</Label>
        <Input
          id="actionUrl"
          value={formData.actionUrl}
          onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
          placeholder="/admin/orders"
          className="font-cairo"
        />
      </div>

      {/* Preview Section */}
      {(formData.title || formData.body) && (
        <div className="border rounded-lg p-4 bg-accent/30">
          <p className="text-xs text-muted-foreground mb-2 font-cairo">معاينة الإشعار:</p>
          <div className="flex gap-3">
            <div className={cn('p-2 rounded-lg h-fit', colorMap[formData.type])}>
              {(() => {
                const Icon = iconMap[formData.type] || Bell;
                return <Icon className="h-5 w-5" />;
              })()}
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-semibold text-sm font-cairo leading-tight">
                {formData.title || 'عنوان الإشعار'}
              </h4>
              <p className="text-sm text-muted-foreground font-cairo leading-snug">
                {formData.body || 'محتوى الإشعار'}
              </p>
              <p className="text-xs text-muted-foreground">الآن</p>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const renderNotificationItem = (notification: any) => {
    const Icon = iconMap[notification.type] || Bell;
    const timeAgo = notification.createdAt?.toDate
      ? formatDistanceToNow(notification.createdAt.toDate(), {
        addSuffix: true,
        locale: ar
      })
      : 'الآن';

    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'p-4 hover:bg-accent/50 transition-colors group relative',
          !notification.read && 'bg-accent/20'
        )}
      >
        <div className="flex gap-3">
          <div className={cn('p-2 rounded-lg h-fit', colorMap[notification.type])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-sm font-cairo leading-tight">
                {notification.title}
              </h4>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-cairo leading-snug">
              {notification.body}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo mb-2">إدارة الإشعارات</h1>
          <p className="text-muted-foreground">إرسال وإدارة الإشعارات للمستخدمين على Web و Mobile</p>
        </motion.div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4 text-right">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-cairo">إجمالي المستخدمين</p>
                <h3 className="text-2xl font-bold">{userStats.totalUsers}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-4 flex items-center gap-4 text-right">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-600 font-cairo">أجهزة مفعلة</p>
                <h3 className="text-2xl font-bold">{userStats.usersWithTokens}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 flex items-center gap-4 text-right">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-600 font-cairo">نسبة الوصول</p>
                <h3 className="text-2xl font-bold">
                  {userStats.totalUsers > 0
                    ? Math.round((userStats.usersWithTokens / userStats.totalUsers) * 100)
                    : 0}%
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Notification Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Send className="h-5 w-5" />
                  إرسال إشعار جديد
                </CardTitle>
                <CardDescription>أرسل إشعارات للمستخدمين على Web أو Mobile</CardDescription>
              </CardHeader>
              <CardContent>
                {authError && (
                  <Alert variant="destructive" className="mb-6 animate-pulse border-2">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertDescription className="font-cairo space-y-3">
                      <p className="font-bold text-lg">⚠️ انتهت صلاحية مفتاح الوصول (Access Token)</p>
                      <p className="text-sm">مفاتيح Google OAuth 2.0 بتنتهي كل 60 دقيقة. عشان ترجع تبعت إشعارات تاني، لازم تجدد المفتاح.</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="font-cairo h-8"
                          onClick={() => navigate('/admin/settings')}
                        >
                          تحديث المفتاح في الإعدادات
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="font-cairo h-8 text-destructive"
                          onClick={() => window.open('https://developers.google.com/oauthplayground/', '_blank')}
                        >
                          فتح OAuth Playground <ExternalLink className="w-3 h-3 mr-1" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {!fcmConfigured && !authError && (
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="font-cairo text-sm">
                      لإرسال Push Notifications، يرجى إضافة Access Token في الإعدادات أو في Firestore (system_settings/fcm_config/accessToken)
                    </AlertDescription>
                  </Alert>
                )}

                <Tabs defaultValue="web" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="web" className="font-cairo">
                      <Bell className="h-4 w-4 mr-2" />
                      Web App
                    </TabsTrigger>
                    <TabsTrigger value="push" className="font-cairo" disabled={!fcmConfigured}>
                      <Smartphone className="h-4 w-4 mr-2" />
                      Push (Mobile)
                    </TabsTrigger>
                  </TabsList>

                  {tokenCount === 0 ? (
                    <Alert className="mb-4 bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="font-cairo text-sm text-amber-800">
                        <p className="font-bold mb-1">تنبيه: لا يوجد أي أجهزة مسجلة في النظام حالياً.</p>
                        <p className="mb-2">الـ {userStats.totalUsers} مستخدم اللي عندك هم "حسابات". عشان تبعت "Push" لازم المستخدم يوافق على الإشعارات من متصفحه أولاً عشان يظهر كـ "جهاز مفعل".</p>
                        {!window.isSecureContext && (
                          <p className="text-destructive font-bold mb-2">⚠️ تنبيه: المتصفح يتطلب اتصال آمن (HTTPS) لتفعيل الإشعارات.</p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-amber-300 hover:bg-amber-100 font-cairo"
                          onClick={async () => {
                            try {
                              console.log('Registering current device...');
                              await registerThisDevice();

                              // Wait a moment for firestore to sync
                              setTimeout(async () => {
                                const tokensRef = collection(db, 'fcmTokens');
                                const snapshot = await getDocs(tokensRef);
                                const validTokens = snapshot.docs.filter(doc => !!doc.data().token);
                                setTokenCount(validTokens.length);

                                if (validTokens.length > 0) {
                                  toast.success('تم تسجيل جهازك بنجاح! يمكنك الإرسال الآن.');
                                }
                              }, 1500);
                            } catch (err) {
                              console.error('Registration error:', err);
                              toast.error('حدث خطأ أثناء التسجيل. تفقد الـ console.');
                            }
                          }}
                        >
                          سجل متصفحك الحالي كجهاز استقبال
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mb-4 bg-emerald-50 border-emerald-200">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="font-cairo text-sm text-emerald-800">
                        يوجد حالياً <span className="font-bold">{tokenCount}</span> أجهزة مسجلة في النظام بانتظار استلام الإشعارات.
                      </AlertDescription>
                    </Alert>
                  )}

                  <TabsContent value="web">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {renderFormFields()}
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        <Send className="h-4 w-4 mr-2" />
                        {isLoading ? 'جاري الإرسال...' : 'إرسال إشعار Web'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="push">
                    <div className="space-y-4">
                      {renderFormFields()}
                      <Button
                        type="button"
                        className="w-full"
                        disabled={isPushLoading}
                        onClick={handlePushNotification}
                      >
                        <Smartphone className="h-4 w-4 mr-2" />
                        {isPushLoading ? 'جاري الإرسال...' : 'إرسال Push Notification'}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center font-cairo">
                        سيتم إرسال الإشعار لجميع الأجهزة (Web + Android + iOS)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 font-cairo">
                    <Bell className="h-5 w-5" />
                    الإشعارات الأخيرة
                    {unreadCount > 0 && (
                      <span className="text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-cairo"
                        onClick={handleMarkAllAsRead}
                      >
                        <CheckCheck className="h-4 w-4 ml-1" />
                        تعليم الكل كمقروء
                      </Button>
                    )}
                    {notifications.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-cairo text-destructive hover:text-destructive"
                        onClick={handleDeleteAllNotifications}
                        disabled={isDeletingAll}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        {isDeletingAll ? 'جاري الحذف...' : 'حذف الكل'}
                      </Button>
                    )}
                  </div>
                </div>
                <CardDescription>آخر الإشعارات المرسلة</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  <Tabs defaultValue="in-app" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                      <TabsTrigger
                        value="in-app"
                        className="rounded-none border-b-2 border-transparent px-6 py-3 font-cairo data-[state=active]:border-primary"
                      >
                        إشعارات النظام
                      </TabsTrigger>
                      <TabsTrigger
                        value="campaigns"
                        className="rounded-none border-b-2 border-transparent px-6 py-3 font-cairo data-[state=active]:border-primary"
                      >
                        حملات الـ Push
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="in-app" className="m-0">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Bell className="h-16 w-16 mb-4 opacity-20" />
                          <p className="font-cairo">لا توجد إشعارات</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {notifications.map((notification) => renderNotificationItem(notification))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="campaigns" className="m-0">
                      {campaigns.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <Smartphone className="h-16 w-16 mb-4 opacity-20" />
                          <p className="font-cairo">لا توجد حملات مرسلة</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {campaigns.map((campaign) => (
                            <div key={campaign.id} className="p-4 hover:bg-accent/50 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-sm font-cairo">{campaign.title}</h4>
                                <Badge variant="secondary" className="font-cairo text-[10px] h-5">
                                  {campaign.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-cairo line-clamp-2 mb-3">
                                {campaign.body}
                              </p>
                              <div className="flex items-center justify-between text-[10px]">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Smartphone className="w-3 h-3" />
                                    {campaign.sentCount} جهاز
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {campaign.targetRole === 'all' ? 'الجميع' : campaign.targetRole}
                                  </span>
                                </div>
                                <span className="text-muted-foreground" dir="ltr">
                                  {campaign.sentAt?.toDate ? formatDistanceToNow(campaign.sentAt.toDate(), { addSuffix: true, locale: ar }) : ''}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-cairo">إجمالي الإشعارات</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/10">
                  <UserCheck className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-cairo">غير مقروءة</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-cairo">مقروءة</p>
                  <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Send Confirmation Dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              تأكيد الإرسال للجميع
            </AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">
              سيتم إرسال هذا الإشعار لجميع المستخدمين. هل أنت متأكد؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={sendWebNotification} className="font-cairo">
              نعم، إرسال
            </AlertDialogAction>
            <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              حذف الإشعار
            </AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">
              هل أنت متأكد من حذف هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={confirmDeleteNotification} className="font-cairo bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
            <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              حذف جميع الإشعارات
            </AlertDialogTitle>
            <AlertDialogDescription className="font-cairo">
              هل أنت متأكد من حذف جميع الإشعارات ({notifications.length} إشعار)؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={confirmDeleteAllNotifications} className="font-cairo bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف الكل
            </AlertDialogAction>
            <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
