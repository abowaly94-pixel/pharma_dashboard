import { motion } from 'framer-motion';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold font-cairo">آخر الطلبات</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                رقم الطلب
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                العميل
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                المبلغ
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                الحالة
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                التاريخ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.slice(0, 5).map((order, index) => {
              const status = statusConfig[order.orderStatus];
              return (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="table-row-hover cursor-pointer"
                  onClick={() => onViewOrder?.(order)}
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">#{order.orderId.slice(-8)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{order.shippingAddressEntity.namee}</p>
                      <p className="text-xs text-muted-foreground">{order.shippingAddressEntity.phoneNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold">{order.totalAmount} ج.م</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={status.class}>{status.label}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                    </span>
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
