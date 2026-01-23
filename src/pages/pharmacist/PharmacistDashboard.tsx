import { motion } from 'framer-motion';
import {
  Pill,
  ShoppingCart,
  DollarSign
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMedicines } from '@/hooks/useMedicines';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const hasPharmacyId = user?.pharmacyId !== undefined && user?.pharmacyId !== null;
  const { medicines } = useMedicines(user?.pharmacyId, { enabled: hasPharmacyId });
  const { orders } = useOrders(user?.pharmacyId, { enabled: hasPharmacyId });

  // Calculate statistics with validation
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = typeof order.totalAmount === 'number' && !isNaN(order.totalAmount) ? order.totalAmount : 0;
    return sum + amount;
  }, 0);
  
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  const lowStockMedicines = medicines.filter(m => {
    const qty = typeof m.quantity === 'number' && !isNaN(m.quantity) ? m.quantity : 0;
    return qty > 0 && qty < 10;
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo mb-2">
            مرحباً، {user?.pharmacyName === 'صيدلية النخيل' ? 'الصيدلية' : user?.pharmacyName}
          </h1>
          <p className="text-muted-foreground">إليك ملخص نشاط صيدليتك</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  إجمالي الأدوية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{medicines.length}</div>
                {lowStockMedicines > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {lowStockMedicines} دواء بمخزون منخفض
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  إجمالي الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                {pendingOrders > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {pendingOrders} طلب قيد الانتظار
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  إجمالي الإيرادات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} ج.م</div>
                <p className="text-xs text-muted-foreground mt-1">من {orders.length} طلب</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
