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
  const deliveredToday = orders.filter(o => {
    const today = new Date();
    const orderDate = new Date(o.updatedAt);
    return o.orderStatus === 'delivered' && 
           orderDate.toDateString() === today.toDateString();
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
  
  const ordersTrend = ordersLastMonth > 0 
    ? Math.round(((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100)
    : 0;

  const isLoading = medicinesLoading || ordersLoading || usersLoading;

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
              value={medicines.length}
              icon={Pill}
              color="primary"
              trend={medicines.length > 0 ? { value: Math.round((medicines.filter(m => m.isNewProduct).length / medicines.length) * 100), isPositive: true } : undefined}
              delay={0}
            />
            <StatCard
              title="إجمالي الطلبات"
              value={orders.length}
              icon={ShoppingCart}
              color="accent"
              trend={ordersTrend !== 0 ? { value: Math.abs(ordersTrend), isPositive: ordersTrend > 0 } : undefined}
              delay={1}
            />
            <StatCard
              title="المستخدمين"
              value={users.length}
              icon={Users}
              color="success"
              delay={2}
            />
            <StatCard
              title="إجمالي الإيرادات"
              value={`${totalRevenue.toLocaleString()} ج.م`}
              icon={DollarSign}
              color="warning"
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
                <p className="text-2xl font-bold">{deliveredToday}</p>
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
                  {ordersTrend > 0 ? '+' : ''}{ordersTrend}%
                  {ordersTrend > 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-success" />
                  ) : ordersTrend < 0 ? (
                    <ArrowUpRight className="w-5 h-5 text-destructive rotate-180" />
                  ) : null}
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SalesChart orders={orders} />
          <OrderStatusChart orders={orders} />
        </div>

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
