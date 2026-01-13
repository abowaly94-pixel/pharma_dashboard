import { motion } from 'framer-motion';
import { Order } from '@/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface SalesChartProps {
  orders: Order[];
}

const COLORS = {
  pending: '#f59e0b',    // amber-500
  confirmed: '#3b82f6',  // blue-500
  delivered: '#10b981',  // green-500
  cancelled: '#ef4444'   // red-500
};

const STATUS_LABELS = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي'
};

export function SalesChart({ orders }: SalesChartProps) {
  // Calculate real weekly data from orders
  const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  
  // If no orders, show sample data for demonstration
  if (orders.length === 0) {
    const sampleData = [
      { name: 'السبت', sales: 2800, orders: 12 },
      { name: 'الأحد', sales: 3200, orders: 15 },
      { name: 'الاثنين', sales: 2100, orders: 8 },
      { name: 'الثلاثاء', sales: 4500, orders: 18 },
      { name: 'الأربعاء', sales: 3800, orders: 14 },
      { name: 'الخميس', sales: 5200, orders: 22 },
      { name: 'الجمعة', sales: 4100, orders: 16 }
    ];
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-cairo">المبيعات الأسبوعية</h3>
            <p className="text-sm text-gray-500 mt-1">إجمالي المبيعات خلال الأسبوع</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">بيانات تجريبية</span>
          </div>
        </div>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sampleData}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'Cairo' }}
                formatter={(value, name) => [
                  name === 'sales' ? `${value} ج.م` : `${value} طلب`,
                  name === 'sales' ? 'المبيعات' : 'الطلبات'
                ]}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2}
                fill="url(#salesGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    );
  }

  const weeklyData = days.map((day, index) => {
    const dayOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate.getDay() === (index + 6) % 7; // Adjust for Saturday start
    });

    return {
      name: day,
      sales: dayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      orders: dayOrders.length
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 font-cairo">المبيعات الأسبوعية</h3>
          <p className="text-sm text-gray-500 mt-1">إجمالي المبيعات خلال الأسبوع</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-xs text-gray-600">المبيعات</span>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyData}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontFamily: 'Cairo' }}
              formatter={(value, name) => [
                name === 'sales' ? `${value} ج.م` : `${value} طلب`,
                name === 'sales' ? 'المبيعات' : 'الطلبات'
              ]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="hsl(160, 84%, 39%)"
              strokeWidth={2}
              fill="url(#salesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

interface OrderStatusChartProps {
  orders: Order[];
}

export function OrderStatusChart({ orders }: OrderStatusChartProps) {
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

  let data = [
    { name: STATUS_LABELS.pending, value: statusCounts.pending || 0, status: 'pending' as OrderStatus, color: COLORS.pending },
    { name: STATUS_LABELS.confirmed, value: statusCounts.confirmed || 0, status: 'confirmed' as OrderStatus, color: COLORS.confirmed },
    { name: STATUS_LABELS.delivered, value: statusCounts.delivered || 0, status: 'delivered' as OrderStatus, color: COLORS.delivered },
    { name: STATUS_LABELS.cancelled, value: statusCounts.cancelled || 0, status: 'cancelled' as OrderStatus, color: COLORS.cancelled },
  ].filter(item => item.value > 0);

  // If no real data, show sample data
  if (data.length === 0) {
    data = [
      { name: STATUS_LABELS.pending, value: 15, status: 'pending' as OrderStatus, color: COLORS.pending },
      { name: STATUS_LABELS.confirmed, value: 8, status: 'confirmed' as OrderStatus, color: COLORS.confirmed },
      { name: STATUS_LABELS.delivered, value: 25, status: 'delivered' as OrderStatus, color: COLORS.delivered },
      { name: STATUS_LABELS.cancelled, value: 2, status: 'cancelled' as OrderStatus, color: COLORS.cancelled },
    ];
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    // وضع النص في منتصف الشريحة بالضبط
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-bold text-base"
        style={{ 
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none'
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 font-cairo">حالة الطلبات</h3>
          <p className="text-sm text-gray-500 mt-1">توزيع الطلبات حسب الحالة</p>
        </div>
        {orders.length === 0 && (
          <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">بيانات تجريبية</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Chart */}
        <div className="h-[280px] flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} طلب`, 'العدد']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontFamily: 'Cairo'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 lg:min-w-[180px]">
          {data.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div 
                className="w-4 h-4 rounded-full shadow-sm group-hover:scale-110 transition-transform"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <p className="text-sm font-cairo font-medium text-gray-700">{item.name}</p>
                <p className="text-xs text-gray-500">{item.value} طلب</p>
              </div>
              <div className="text-sm font-bold text-gray-600">
                {((item.value / total) * 100).toFixed(0)}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
