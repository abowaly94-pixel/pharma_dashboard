import { useState } from 'react';
import { Search, Eye, Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from '@/contexts/AuthContext';
import { Order } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  pending: { label: 'قيد الانتظار', class: 'bg-orange-100 text-orange-700', icon: Clock },
  confirmed: { label: 'مؤكد', class: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  shipped: { label: 'تم الشحن', class: 'bg-purple-100 text-purple-700', icon: Truck },
  delivered: { label: 'تم التوصيل', class: 'bg-green-100 text-green-700', icon: Package },
  cancelled: { label: 'ملغي', class: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function PharmacistOrders() {
  const { user } = useAuth();
  const hasPharmacyId = user?.pharmacyId !== undefined && user?.pharmacyId !== null;
  const { orders, isLoading, updateOrderStatus } = useOrders(user?.pharmacyId, { enabled: hasPharmacyId });
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
        <div>
          <h1 className="text-3xl font-bold font-cairo">طلباتي</h1>
          <p className="text-gray-600">إدارة طلبات صيدليتك</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Clock className="w-4 h-4" />
                <span className="font-cairo text-sm">قيد الانتظار</span>
              </div>
              <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'pending').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-cairo text-sm">مؤكد</span>
              </div>
              <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'confirmed').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Truck className="w-4 h-4" />
                <span className="font-cairo text-sm">تم الشحن</span>
              </div>
              <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'shipped').length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Package className="w-4 h-4" />
                <span className="font-cairo text-sm">تم التوصيل</span>
              </div>
              <p className="text-2xl font-bold">{orders.filter(o => o.orderStatus === 'delivered').length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="بحث برقم الطلب أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 font-cairo"
          />
        </div>

        {/* Orders Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600 font-cairo">رقم الطلب</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600 font-cairo">العميل</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600 font-cairo">المبلغ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600 font-cairo">الحالة</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600 font-cairo">التاريخ</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-600 font-cairo">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-6 py-4">
                        <div className="h-12 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : !hasPharmacyId ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-cairo">جاري تحميل بيانات الصيدلية...</p>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-cairo">لا توجد طلبات</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const status = statusConfig[order.orderStatus];
                    const StatusIcon = status.icon;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium font-mono">#{order.orderId.slice(-8)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{order.shippingAddressEntity.namee}</p>
                            <p className="text-xs text-gray-500">{order.shippingAddressEntity.phoneNumber}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-blue-600">{order.totalAmount} ج.م</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`${status.class} inline-flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500">
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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo text-xl">
                تفاصيل الطلب #{selectedOrder?.orderId?.slice(-8) ?? ''}
              </DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status Update */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                      <p><span className="text-gray-500">الاسم:</span> {selectedOrder.shippingAddressEntity.namee}</p>
                      <p><span className="text-gray-500">الهاتف:</span> {selectedOrder.shippingAddressEntity.phoneNumber}</p>
                      <p><span className="text-gray-500">البريد:</span> {selectedOrder.shippingAddressEntity.email}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold font-cairo text-lg">عنوان التوصيل</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="text-gray-500">المدينة:</span> {selectedOrder.shippingAddressEntity.city}</p>
                      <p><span className="text-gray-500">العنوان:</span> {selectedOrder.shippingAddressEntity.address}</p>
                    </div>
                  </div>
                </div>

                {/* Prescription & Payment */}
                {(selectedOrder.prescriptionUrl || selectedOrder.paymentProofUrl) && (
                  <div className="grid gap-4">
                    {selectedOrder.prescriptionUrl && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-3 bg-green-50 border-b">
                          <p className="text-sm text-green-700 font-semibold font-cairo">روشتة الطلب</p>
                        </div>
                        <div className="p-2 bg-white">
                          <img
                            src={selectedOrder.prescriptionUrl}
                            alt="روشتة الطلب"
                            className="w-full h-48 object-contain"
                          />
                        </div>
                      </div>
                    )}
                    {selectedOrder.paymentProofUrl && (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="p-3 bg-blue-50 border-b">
                          <p className="text-sm text-blue-700 font-semibold font-cairo">إيصال الدفع</p>
                        </div>
                        <div className="p-2 bg-white">
                          <img
                            src={selectedOrder.paymentProofUrl}
                            alt="إيصال الدفع"
                            className="w-full h-48 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Products */}
                <div className="space-y-3">
                  <h4 className="font-semibold font-cairo text-lg">المنتجات</h4>
                  <div className="divide-y border rounded-lg">
                    {selectedOrder.cartItem.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {(item.medicineEntity.subabaseImageUrl || item.medicineEntity.subabaseORImageUrl) ? (
                            <img
                              src={item.medicineEntity.subabaseImageUrl || item.medicineEntity.subabaseORImageUrl}
                              alt={item.medicineEntity.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.medicineEntity.name}</p>
                          <p className="text-sm text-gray-500">#{item.medicineEntity.code}</p>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{item.medicineEntity.price} ج.م</p>
                          <p className="text-sm text-gray-500">× {item.count}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-cairo">المجموع الفرعي:</span>
                    <span>{selectedOrder.subtotal} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-cairo">رسوم التوصيل:</span>
                    <span>{selectedOrder.deliveryFee} ج.م</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="font-cairo">الإجمالي:</span>
                    <span className="text-blue-600">{selectedOrder.totalAmount} ج.م</span>
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
