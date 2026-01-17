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
import { SalesChart, OrderStatusChart } from '@/components/dashboard/Charts';
import { ApiKeyAlert } from '@/components/dashboard/ApiKeyAlert';
import { useMedicines } from '@/hooks/useMedicines';
import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';

export default function AdminDashboard() {
  const { medicines, isLoading: medicinesLoading } = useMedicines();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { users, isLoading: usersLoading } = useUsers();

  // Calculate real statistics from Firebase data
  const totalRevenue = orders.reduce((sum, order) => {
    const amount = typeof order.totalAmount === 'number' && !isNaN(order.totalAmount) ? order.totalAmount : 0;
    return sum + amount;
  }, 0);
  
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  
  // Filter only regular users (exclude admins and pharmacists)
  const regularUsers = users.filter(u => !u.role || u.role === 'user');
  
  // Count orders delivered today
  const deliveredToday = orders.filter(o => {
    if (o.orderStatus !== 'delivered') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orderDate = new Date(o.updatedAt);
    orderDate.setHours(0, 0, 0, 0);
    
    return orderDate.getTime() === today.getTime();
  }).length;

  // Calculate trends
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  const ordersThisMonth = orders.filter(o => new Date(o.createdAt) >= lastMonth).length;
  const ordersLastMonth = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    return orderDate >= twoMonthsAgo && orderDate < lastMonth;
  }).length;
  
  let ordersTrend = 0;
  if (ordersLastMonth > 0) {
    ordersTrend = Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100);
  }

  const isLoading = medicinesLoading || ordersLoading || usersLoading;

  const displayStats = {
    medicines: medicines.length,
    orders: orders.length,
    users: regularUsers.length,
    revenue: totalRevenue,
    pending: pendingOrders,
    delivered: deliveredToday,
    trend: ordersTrend
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* API Key Alert */}
        <ApiKeyAlert />

        {/* Stats Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="إجمالي الإيرادات"
              value={`${displayStats.revenue.toLocaleString()} ج.م`}
              icon={DollarSign}
              color="warning"
              delay={0}
            />
            <StatCard
              title="المستخدمين"
              value={displayStats.users}
              icon={Users}
              color="success"
              delay={1}
            />
            <StatCard
              title="إجمالي الطلبات"
              value={displayStats.orders}
              icon={ShoppingCart}
              color="accent"
              delay={2}
            />
            <StatCard
              title="إجمالي الأدوية"
              value={displayStats.medicines}
              icon={Pill}
              color="primary"
              delay={3}
            />
          </div>
        )}

        {/* Secondary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-amber-700 font-cairo font-medium">طلبات معلقة</p>
                  <p className="text-2xl font-bold text-amber-800">{displayStats.pending}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-cairo font-medium">تم التوصيل اليوم</p>
                  <p className="text-2xl font-bold text-green-800">{displayStats.delivered}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileHover={{ y: -2 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-cairo font-medium">معدل النمو</p>
                  <p className="text-2xl font-bold text-blue-800 flex items-center gap-1">
                    {displayStats.trend > 0 ? '+' : ''}{displayStats.trend}%
                    {displayStats.trend > 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-green-600" />
                    ) : displayStats.trend < 0 ? (
                      <ArrowUpRight className="w-5 h-5 text-red-600 rotate-180" />
                    ) : null}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Charts Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <SalesChart orders={orders} />
          <OrderStatusChart orders={orders} />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
