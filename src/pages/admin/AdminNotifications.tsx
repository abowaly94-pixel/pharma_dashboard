import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, UserCheck, Bell } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { sendNotification, NotificationData } from '@/lib/notifications';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminNotifications() {
  const { notifications, unreadCount } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'general' as NotificationData['type'],
    targetRole: 'all',
    imageUrl: '',
    actionUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
      
      toast.success('تم إرسال الإشعار بنجاح');
      
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo mb-2">إدارة الإشعارات</h1>
          <p className="text-muted-foreground">إرسال وإدارة الإشعارات للمستخدمين</p>
        </motion.div>

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
                <CardDescription>أرسل إشعارات للمستخدمين أو الصيادلة</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'جاري الإرسال...' : 'إرسال الإشعار'}
                  </Button>
                </form>
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
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Bell className="h-5 w-5" />
                  الإشعارات الأخيرة
                  {unreadCount > 0 && (
                    <span className="text-sm bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>آخر الإشعارات المرسلة</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Bell className="h-16 w-16 mb-4 opacity-20" />
                      <p className="font-cairo">لا توجد إشعارات</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                        />
                      ))}
                    </div>
                  )}
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
    </DashboardLayout>
  );
}
