import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  Clock,
  Package,
  FileText,
  ReceiptText
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOrders } from "@/hooks/useOrders";
import { useAutoNotifications } from '@/hooks/useAutoNotifications';
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
import { AttachmentPreview } from '@/components/orders/AttachmentPreview';
import { MedicineImage } from '@/components/ui/medicine-image';

const statusConfig = {
  pending: { label: 'قيد الانتظار', class: 'badge-warning', icon: Clock },
  confirmed: { label: 'مؤكد', class: 'badge-info', icon: CheckCircle },
  shipped: { label: 'تم الشحن', class: 'badge-info', icon: Truck },
  delivered: { label: 'تم التوصيل', class: 'badge-success', icon: Package },
  cancelled: { label: 'ملغي', class: 'badge-danger', icon: XCircle },
};

const isImageFile = (url?: string) => {
  if (!url) return false;
  return /\.(png|jpe?g|gif|webp|svg)$/i.test(url.split('?')[0]);
};

export default function AdminOrders() {
  const { orders, isLoading, error, updateOrderStatus } = useOrders(undefined, { isAdminView: true });
  const { notifyOrderStatusChange } = useAutoNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<{
    type: 'prescription' | 'payment';
    url: string;
    title: string;
  } | null>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddressEntity.namee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shippingAddressEntity.phoneNumber.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: Order['orderStatus']) => {
    await updateOrderStatus(orderId, newStatus);

    // Find the order to get pharmacy information
    const order = orders.find(o => o.id === orderId);
    if (order && order.pharmacyId) {
      await notifyOrderStatusChange(order.orderId, newStatus, order.pharmacyId);
    }

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
          <h1 className="text-3xl font-bold font-cairo">إدارة الطلبات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع الطلبات في النظام</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="بحث برقم الطلب أو اسم العميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo h-11 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 font-cairo h-11 bg-white border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">جميع الحالات</SelectItem>
              <SelectItem value="pending" className="font-cairo">قيد الانتظار</SelectItem>
              <SelectItem value="confirmed" className="font-cairo">مؤكد</SelectItem>
              <SelectItem value="shipped" className="font-cairo">تم الشحن</SelectItem>
              <SelectItem value="delivered" className="font-cairo">تم التوصيل</SelectItem>
              <SelectItem value="cancelled" className="font-cairo">ملغي</SelectItem>
            </SelectContent>
          </Select>
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
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">المنتجات</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">المبلغ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">طريقة الدفع</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">التاريخ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className="px-6 py-4">
                        <div className="h-12 bg-muted rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-red-600">
                      حدث خطأ أثناء تحميل الطلبات
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات
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
                          <span className="text-sm">{order.cartItem.length} منتج</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-green-600">
                            {(() => {
                              // حساب المبلغ الصحيح بناءً على الأسعار بعد الخصم
                              const correctSubtotal = order.cartItem.reduce((sum, item) => {
                                const price = item.medicineEntity.price;
                                const discount = item.medicineEntity.discountRating || 0;
                                const finalPrice = price - (price * discount / 100);
                                return sum + (finalPrice * item.count);
                              }, 0);
                              const correctTotal = correctSubtotal + (order.deliveryFee || 0);
                              return correctTotal.toFixed(2);
                            })()} ج.م
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm">{order.paymentMethodName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`${status.class} inline-flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(order.createdAt), 'dd MMM yyyy', { locale: ar })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(order.createdAt), 'hh:mm a', { locale: ar })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                              className="font-cairo"
                            >
                              <Eye className="w-4 h-4 ml-1" />
                              عرض
                            </Button>
                          </div>
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
                تفاصيل الطلب #{selectedOrder?.orderId?.slice(-8) ?? ''}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Update */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-cairo font-medium">حالة الطلب:</span>
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
                      <p><span className="text-muted-foreground">البريد:</span> {selectedOrder.shippingAddressEntity.email}</p>
                      <p><span className="text-muted-foreground">الهاتف:</span> {selectedOrder.shippingAddressEntity.phoneNumber}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold font-cairo text-lg">عنوان التوصيل</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-muted-foreground">المدينة:</span> {selectedOrder.shippingAddressEntity.city}</p>
                      <p><span className="text-muted-foreground">العنوان:</span> {selectedOrder.shippingAddressEntity.address}</p>
                      <p><span className="text-muted-foreground">الشقة:</span> {selectedOrder.shippingAddressEntity.apartmentNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                {(selectedOrder.prescriptionUrl || selectedOrder.paymentProofUrl) && (
                  <div className="grid gap-4">
                    {selectedOrder.prescriptionUrl && (
                      <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-emerald-600 font-semibold flex items-center gap-2">
                              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                                <FileText className="w-4 h-4" />
                              </span>
                              روشتة الطلب
                            </p>
                          </div>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setAttachmentPreview({
                              type: 'prescription',
                              url: selectedOrder.prescriptionUrl!,
                              title: `روشتة الطلب #${selectedOrder.orderId.slice(-8)}`
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setAttachmentPreview({
                                type: 'prescription',
                                url: selectedOrder.prescriptionUrl!,
                                title: `روشتة الطلب #${selectedOrder.orderId.slice(-8)}`
                              });
                            }
                          }}
                          className="relative border-t border-emerald-100 bg-white cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {isImageFile(selectedOrder.prescriptionUrl) ? (
                            <img
                              src={selectedOrder.prescriptionUrl}
                              alt="روشتة الطلب"
                              className="w-full h-64 object-contain bg-white"
                              loading="lazy"
                            />
                          ) : (
                            <iframe
                              src={selectedOrder.prescriptionUrl}
                              title="روشتة الطلب"
                              className="w-full h-64 bg-white pointer-events-none"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors" />
                        </div>
                      </div>
                    )}
                    {selectedOrder.paymentProofUrl && (
                      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm text-blue-600 font-semibold flex items-center gap-2">
                              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
                                <ReceiptText className="w-4 h-4" />
                              </span>
                              إيصال الدفع
                            </p>
                          </div>
                        </div>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setAttachmentPreview({
                              type: 'payment',
                              url: selectedOrder.paymentProofUrl!,
                              title: `إيصال الدفع #${selectedOrder.orderId.slice(-8)}`
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setAttachmentPreview({
                                type: 'payment',
                                url: selectedOrder.paymentProofUrl!,
                                title: `إيصال الدفع #${selectedOrder.orderId.slice(-8)}`
                              });
                            }
                          }}
                          className="relative border-t border-blue-100 bg-white cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {isImageFile(selectedOrder.paymentProofUrl) ? (
                            <img
                              src={selectedOrder.paymentProofUrl}
                              alt="إيصال الدفع"
                              className="w-full h-64 object-contain bg-white"
                              loading="lazy"
                            />
                          ) : (
                            <iframe
                              src={selectedOrder.paymentProofUrl}
                              title="إيصال الدفع"
                              className="w-full h-64 bg-white pointer-events-none"
                            />
                          )}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                <div className="space-y-3">
                  <h4 className="font-semibold font-cairo text-lg">المنتجات</h4>
                  <div className="divide-y divide-border border rounded-lg">
                    {selectedOrder.cartItem.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4">
                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border-2 border-gray-100 shadow-sm">
                          <MedicineImage
                            imageUrl={item.medicineEntity.subabaseImageUrl}
                            originalImageUrl={item.medicineEntity.subabaseORImageUrl}
                            name={item.medicineEntity.name}
                            objectFit="contain"
                            className="p-1"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.medicineEntity.name}</p>
                          <p className="text-sm text-muted-foreground">{item.medicineEntity.pharmacyName}</p>
                        </div>
                        <div className="text-left">
                          {item.medicineEntity.discountRating > 0 ? (
                            <div className="flex flex-col">
                              <p className="text-xs text-gray-400 line-through">{item.medicineEntity.price.toFixed(2)} ج.م</p>
                              <p className="font-medium text-green-600">
                                {(() => {
                                  const discountAmount = item.medicineEntity.price * (item.medicineEntity.discountRating / 100);
                                  const finalPrice = item.medicineEntity.price - discountAmount;
                                  return finalPrice.toFixed(2);
                                })()} ج.م
                              </p>
                            </div>
                          ) : (
                            <p className="font-medium">{item.medicineEntity.price.toFixed(2)} ج.م</p>
                          )}
                          <p className="text-sm text-muted-foreground">الكمية: {item.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-cairo">المجموع الفرعي:</span>
                    <span className="text-green-600 font-semibold">
                      {(() => {
                        const correctSubtotal = selectedOrder.cartItem.reduce((sum, item) => {
                          const price = item.medicineEntity.price;
                          const discount = item.medicineEntity.discountRating || 0;
                          const finalPrice = price - (price * discount / 100);
                          return sum + (finalPrice * item.count);
                        }, 0);
                        return correctSubtotal.toFixed(2);
                      })()} ج.م
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-cairo">رسوم التوصيل:</span>
                    <span>{selectedOrder.deliveryFee.toFixed(2)} ج.م</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
                    <span className="font-cairo">الإجمالي:</span>
                    <span className="text-primary">
                      {(() => {
                        const correctSubtotal = selectedOrder.cartItem.reduce((sum, item) => {
                          const price = item.medicineEntity.price;
                          const discount = item.medicineEntity.discountRating || 0;
                          const finalPrice = price - (price * discount / 100);
                          return sum + (finalPrice * item.count);
                        }, 0);
                        const correctTotal = correctSubtotal + selectedOrder.deliveryFee;
                        return correctTotal.toFixed(2);
                      })()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <AttachmentPreview
        preview={attachmentPreview}
        onClose={() => setAttachmentPreview(null)}
      />
    </DashboardLayout>
  );
}
