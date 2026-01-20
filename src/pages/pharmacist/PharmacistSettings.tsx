import { motion } from 'framer-motion';
import { Store, FileText, LogOut } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PharmacistSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

        {/* Pharmacy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
          transition={{ delay: 0.2 }}
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
