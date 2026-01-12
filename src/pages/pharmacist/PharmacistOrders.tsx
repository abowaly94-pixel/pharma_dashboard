import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  Package
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig = {
  pending: { label: 'قيد الانتظار', class: 'badge-warning', icon: Clock },
  confirmed: { label: 'مؤكد', class: 'badge-info', icon: CheckCircle },
  shipped: { label: 'تم الشحن', class: 'badge-info', icon: Truck },
  delivered: { label: 'تم التوصيل', class: 'badge-success', icon: Package },
  cancelled: { label: 'ملغي', class: 'badge-danger', icon: XCircle },
};

export default function PharmacistOrders() {
  const { user } = useAuth();
  const { orders, isLoading, updateOrderStatus } = useOrders(user?.pharmacyId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(order =>
    order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.shippingAddressEntity.namee.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    await updateOrderStatus(orderId, newStatus);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo">طلباتي</h1>
          <p className="text-muted-foreground">إدارة طلبات صيدليتك</p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-card rounded-xl p-4 border border-border/30">
            <div className="flex items-center gap-2 text-warning mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-cairo text-sm">قيد الانتظار</span>
            </div>
            <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'pending').length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30">
            <div className="flex items-center gap-2 text-accent mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-cairo text-sm">مؤكد</span>
            </div>
            <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'confirmed').length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30">
            <div className="flex items-center gap-2 text-accent mb-2">
              <Truck className="w-5 h-5" />
              <span className="font-cairo text-sm">تم الشحن</span>
            </div>
            <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'shipped').length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/30">
            <div className="flex items-center gap-2 text-success mb-2">
              <Package className="w-5 h-5" />
              <span className="font-cairo text-sm">تم التوصيل</span>
            </div>
            <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'delivered').length}</p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الطلب أو اسم العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">رقم الطلب</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">العميل</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">المبلغ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">التاريخ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-12 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground font-cairo">لا توجد طلبات</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, index) => {
                    const status = statusConfig[order.orderStatus];
                    const StatusIcon = status.icon;
                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="table-row-hover"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium font-mono">#{order.orderId.slice(-8)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{order.shippingAddressEntity.namee}</p>
                            <p className="text-xs text-muted-foreground">{order.shippingAddressEntity.phoneNumber}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-primary">{order.totalAmount} ج.م</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${status.class} inline-flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="font-cairo"
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            عرض
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                تفاصيل الطلب #{selectedOrder?.orderId.slice(-8)}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Update */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-cairo font-medium">تحديث حالة الطلب:</span>
                  <Select
                    value={selectedOrder.orderStatus}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value as Order['orderStatus'])}
                  >
                    <SelectTrigger className="w-48 font-cairo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending" className="font-cairo">قيد الانتظار</SelectItem>
                      <SelectItem value="confirmed" className="font-cairo">مؤكد</SelectItem>
                      <SelectItem value="shipped" className="font-cairo">تم الشحن</SelectItem>
                      <SelectItem value="delivered" className="font-cairo">تم التوصيل</SelectItem>
                      <SelectItem value="cancelled" className="font-cairo">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Info */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold font-cairo text-lg">معلومات العميل</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">الاسم:</span> {selectedOrder.shippingAddressEntity.namee}</p>
                      <p><span className="text-muted-foreground">الهاتف:</span> {selectedOrder.shippingAddressEntity.phoneNumber}</p>
                      <p><span className="text-muted-foreground">البريد:</span> {selectedOrder.shippingAddressEntity.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold font-cairo text-lg">عنوان التوصيل</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">المدينة:</span> {selectedOrder.shippingAddressEntity.city}</p>
                      <p><span className="text-muted-foreground">العنوان:</span> {selectedOrder.shippingAddressEntity.address}</p>
                    </div>
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-3">
                  <h4 className="font-semibold font-cairo text-lg">المنتجات</h4>
                  <div className="divide-y divide-border border rounded-lg">
                    {selectedOrder.cartItem.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {item.medicineEntity.subabaseORImageUrl ? (
                            <img
                              src={item.medicineEntity.subabaseORImageUrl}
                              alt={item.medicineEntity.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.medicineEntity.name}</p>
                          <p className="text-sm text-muted-foreground">#{item.medicineEntity.code}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{item.medicineEntity.price} ج.م</p>
                          <p className="text-sm text-muted-foreground">× {item.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-cairo">المجموع الفرعي:</span>
                    <span>{selectedOrder.subtotal} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-cairo">رسوم التوصيل:</span>
                    <span>{selectedOrder.deliveryFee} ج.م</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span className="font-cairo">الإجمالي:</span>
                    <span className="text-primary">{selectedOrder.totalAmount} ج.م</span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
