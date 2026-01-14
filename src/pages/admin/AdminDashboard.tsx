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
import { AllUsersTable } from '@/components/dashboard/AllUsersTable';
import { AllMedicinesTable } from '@/components/dashboard/AllMedicinesTable';
import { AllOrdersTable } from '@/components/dashboard/AllOrdersTable';
import { useMedicines } from '@/hooks/useMedicines';
import { useOrders } from '@/hooks/useOrders';
import { useUsers } from '@/hooks/useUsers';

export default function AdminDashboard() {
  const { medicines, isLoading: medicinesLoading } = useMedicines();
  const { orders, isLoading: ordersLoading } = useOrders();
  const { users, isLoading: usersLoading } = useUsers();

  // Calculate real statistics from Firebase data
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.orderStatus === 'pending').length;
  
  // Count orders delivered today (must be delivered status AND updated today)
  const deliveredToday = orders.filter(o => {
    if (o.orderStatus !== 'delivered') return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const orderDate = new Date(o.updatedAt);
    orderDate.setHours(0, 0, 0, 0);
    
    return orderDate.getTime() === today.getTime();
  }).length;

  // Calculate trends (compare with previous period)
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  
  const ordersThisMonth = orders.filter(o => new Date(o.createdAt) >= lastMonth).length;
  const ordersLastMonth = orders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    return orderDate >= twoMonthsAgo && orderDate < lastMonth;
  }).length;
  
  // Calculate trend percentage
  let ordersTrend = 0;
  if (ordersLastMonth > 0) {
    // Normal calculation when we have previous data
    ordersTrend = Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100);
  }
  // If no previous orders and no current orders, trend is 0
  // If no previous orders but have current orders, don't show trend (it's misleading)

  const isLoading = medicinesLoading || ordersLoading || usersLoading;

  // Always use real data from Firebase
  const displayStats = {
    medicines: medicines.length,
    orders: orders.length,
    users: users.length,
    revenue: totalRevenue,
    pending: pendingOrders,
    delivered: deliveredToday,
    trend: ordersTrend
  };

  const hasRealData = medicines.length > 0 || orders.length > 0 || users.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-cairo mb-2">
                لوحة التحكم
              </h1>
              <p className="text-gray-600 text-lg">مرحباً بك في نظام PharmaNow الإداري</p>
            </div>
            {!hasRealData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-6 py-3 rounded-xl shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-amber-700 font-cairo font-medium">
                    بيانات تجريبية للعرض
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

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
              title="إجمالي الأدوية"
              value={displayStats.medicines}
              icon={Pill}
              color="primary"
              delay={0}
            />
            <StatCard
              title="إجمالي الطلبات"
              value={displayStats.orders}
              icon={ShoppingCart}
              color="accent"
              trend={ordersLastMonth > 0 && displayStats.trend !== 0 ? { value: Math.abs(displayStats.trend), isPositive: displayStats.trend > 0 } : undefined}
              delay={1}
            />
            <StatCard
              title="المستخدمين"
              value={displayStats.users}
              icon={Users}
              color="success"
              delay={2}
            />
            <StatCard
              title="إجمالي الإيرادات"
              value={`${displayStats.revenue.toLocaleString()} ج.م`}
              icon={DollarSign}
              color="warning"
              delay={3}
            />
          </div>
        )}

        {/* Secondary Stats */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <SalesChart orders={orders} />
          <OrderStatusChart orders={orders} />
        </motion.div>

        {/* Recent Orders */}
        <RecentOrdersTable orders={orders} />

        {/* All Data Tables */}
        <div className="space-y-8">
          <AllUsersTable users={users} />
          <AllMedicinesTable medicines={medicines} />
          <AllOrdersTable orders={orders} />
        </div>
      </div>
    </DashboardLayout>
  );
}
