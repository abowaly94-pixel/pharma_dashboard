import { motion } from 'framer-motion';
import { 
  Pill, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Package,
  Clock,
  DollarSign,
  ArrowUpRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { SalesChart, OrderStatusChart } from '@/components/dashboard/Charts';
import { useMedicines } from '@/hooks/useMedicines';
import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';

export default function AdminDashboard() {
  const { medicines } = useMedicines();
  const { orders } = useOrders();
  const { users } = useUsers();

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo mb-2">لوحة التحكم</h1>
          <p className="text-muted-foreground">مرحباً بك في لوحة تحكم PharmaNow</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="إجمالي الأدوية"
            value={medicines.length}
            icon={Pill}
            color="primary"
            trend={{ value: 12, isPositive: true }}
            delay={0}
          />
          <StatCard
            title="إجمالي الطلبات"
            value={orders.length}
            icon={ShoppingCart}
            color="accent"
            trend={{ value: 8, isPositive: true }}
            delay={1}
          />
          <StatCard
            title="المستخدمين"
            value={users.length}
            icon={Users}
            color="success"
            trend={{ value: 15, isPositive: true }}
            delay={2}
          />
          <StatCard
            title="إجمالي الإيرادات"
            value={`${totalRevenue.toLocaleString()} ج.م`}
            icon={DollarSign}
            color="warning"
            trend={{ value: 23, isPositive: true }}
            delay={3}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="stat-card flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-cairo">طلبات معلقة</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-success/10">
              <Package className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-cairo">تم التوصيل اليوم</p>
              <p className="text-2xl font-bold">
                {orders.filter(o => o.orderStatus === 'delivered').length}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="stat-card flex items-center gap-4"
          >
            <div className="p-3 rounded-xl bg-accent/10">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-cairo">معدل النمو</p>
              <p className="text-2xl font-bold flex items-center gap-1">
                +23%
                <ArrowUpRight className="w-5 h-5 text-success" />
              </p>
            </div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart orders={orders} />
          <OrderStatusChart orders={orders} />
        </div>

        {/* Recent Orders */}
        <RecentOrdersTable orders={orders} />
      </div>
    </DashboardLayout>
  );
}
