import { motion } from 'framer-motion';
import {
  Pill,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  Star
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable';
import { SalesChart } from '@/components/dashboard/Charts';
import { AllMedicinesTable } from '@/components/dashboard/AllMedicinesTable';
import { AllOrdersTable } from '@/components/dashboard/AllOrdersTable';
import { useMedicines } from '@/hooks/useMedicines';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';

export default function PharmacistDashboard() {
  const { user } = useAuth();
  const hasPharmacyId = user?.pharmacyId !== undefined && user?.pharmacyId !== null;
  const { medicines } = useMedicines(user?.pharmacyId, { enabled: hasPharmacyId });
  const { orders } = useOrders(user?.pharmacyId, { enabled: hasPharmacyId });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalStock = medicines.reduce((sum, med) => sum + med.quantity, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo mb-2">مرحباً، {user?.pharmacyName}</h1>
          <p className="text-muted-foreground">إليك ملخص نشاط صيدليتك اليوم</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="أدويتي"
            value={medicines.length}
            icon={Pill}
            color="primary"
            delay={0}
          />
          <StatCard
            title="طلباتي"
            value={orders.length}
            icon={ShoppingCart}
            color="accent"
            delay={1}
          />
          <StatCard
            title="إجمالي المخزون"
            value={totalStock}
            icon={Package}
            color="success"
            delay={2}
          />
          <StatCard
            title="إيراداتي"
            value={`${totalRevenue.toLocaleString()} ج.م`}
            icon={DollarSign}
            color="warning"
            delay={3}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card rounded-xl shadow-card border border-border/30 p-6"
          >
            <h3 className="text-lg font-semibold font-cairo mb-4">أكثر الأدوية مبيعاً</h3>
            <div className="space-y-4">
              {[...medicines]
                .sort((a, b) => (b.sellingCount || 0) - (a.sellingCount || 0))
                .slice(0, 3).map((medicine, index) => (
                  <div key={medicine.id} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">{medicine.sellingCount || 0} مبيعات</p>
                    </div>
                    <span className="text-primary font-semibold">{medicine.price} ج.م</span>
                  </div>
                ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl shadow-card border border-border/30 p-6"
          >
            <h3 className="text-lg font-semibold font-cairo mb-4">أفضل التقييمات</h3>
            <div className="space-y-4">
              {medicines
                .filter(m => m.avgRating > 0)
                .sort((a, b) => b.avgRating - a.avgRating)
                .slice(0, 3)
                .map((medicine) => (
                  <div key={medicine.id} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                      {medicine.subabaseORImageUrl ? (
                        <img src={medicine.subabaseORImageUrl} alt={medicine.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{medicine.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span className="text-sm">{medicine.avgRating}</span>
                        <span className="text-sm text-muted-foreground">({medicine.ratingCount} تقييم)</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        </div>

        {/* Sales Chart */}
        <SalesChart orders={orders} />

        {/* Recent Orders */}
        <RecentOrdersTable orders={orders} />

        {/* All Data Tables for Pharmacist */}
        <div className="space-y-8">
          <AllMedicinesTable medicines={medicines} />
          <AllOrdersTable orders={orders} />
        </div>
      </div>
    </DashboardLayout>
  );
}
