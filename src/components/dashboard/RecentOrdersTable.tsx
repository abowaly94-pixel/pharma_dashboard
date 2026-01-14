import { motion } from 'framer-motion';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface RecentOrdersTableProps {
  orders: Order[];
  onViewOrder?: (order: Order) => void;
}

const statusConfig = {
  pending: { label: 'قيد الانتظار', class: 'badge-warning' },
  confirmed: { label: 'مؤكد', class: 'badge-info' },
  shipped: { label: 'تم الشحن', class: 'badge-info' },
  delivered: { label: 'تم التوصيل', class: 'badge-success' },
  cancelled: { label: 'ملغي', class: 'badge-danger' },
};

export function RecentOrdersTable({ orders, onViewOrder }: RecentOrdersTableProps) {
  const recentOrders = orders.slice(0, 5);

  if (recentOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 font-cairo mb-2">لا توجد طلبات حتى الآن</h3>
        <p className="text-gray-500">سيتم عرض آخر الطلبات هنا</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-cairo">آخر الطلبات</h3>
            <p className="text-sm text-gray-500 mt-1">أحدث {recentOrders.length} طلبات</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">📋</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                رقم الطلب
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                العميل
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                المبلغ
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                الحالة
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                التاريخ
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                الروشتة
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentOrders.map((order, index) => {
              const status = statusConfig[order.orderStatus];
              return (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 cursor-pointer transition-all duration-200 group"
                  onClick={() => onViewOrder?.(order)}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                      #{order.orderId.slice(-8)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{order.shippingAddressEntity.namee}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.shippingAddressEntity.phoneNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-green-600">{order.totalAmount} ج.م</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`${status.class} px-3 py-1.5 rounded-full text-xs font-bold`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {order.orderStatus === 'delivered' && order.prescriptionUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-emerald-600 font-cairo hover:text-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(order.prescriptionUrl!, '_blank');
                        }}
                      >
                        <FileText className="w-4 h-4 ml-1" />
                        الروشتة
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
