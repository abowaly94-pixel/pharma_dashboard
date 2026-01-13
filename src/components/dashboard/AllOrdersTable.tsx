import { motion } from 'framer-motion';
import { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AllOrdersTableProps {
  orders: Order[];
}

const statusConfig = {
  pending: { label: 'قيد الانتظار', class: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'مؤكد', class: 'bg-blue-100 text-blue-800' },
  shipped: { label: 'تم الشحن', class: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'تم التوصيل', class: 'bg-green-100 text-green-800' },
  cancelled: { label: 'ملغي', class: 'bg-red-100 text-red-800' },
};

export function AllOrdersTable({ orders }: AllOrdersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold font-cairo">جميع الطلبات</h3>
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
                المبلغ الإجمالي
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                الحالة
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                تاريخ الإنشاء
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                عدد الأدوية
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((order, index) => {
              const status = statusConfig[order.orderStatus];
              return (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="table-row-hover"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium">#{order.orderId}</span>
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
                    <Badge className={status.class}>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm">{order.cartItem.length}</span>
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