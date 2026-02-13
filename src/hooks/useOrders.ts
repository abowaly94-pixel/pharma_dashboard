import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, CartItem } from '@/types';
import { toast } from 'sonner';

export function useOrders(pharmacyId?: number, options?: { enabled?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (options?.enabled === false) {
      setOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create base query - get all orders then filter client-side for pharmacy
    // This handles cases where orders contain items from multiple pharmacies
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery,
      (snapshot) => {
        let ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          try {
            return {
              id: doc.id,
              orderId: data.orderId || doc.id,
              userId: data.userId || '',
              cartItem: Array.isArray(data.cartItem) ? data.cartItem : [],
              orderStatus: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(data.orderStatus)
                ? data.orderStatus
                : 'pending',
              paymentMethodName: data.paymentMethodName || 'Unknown',
              payWithCash: typeof data.payWithCash === 'boolean' ? data.payWithCash : true,
              deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
              subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
              totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
              shippingAddressEntity: {
                namee: data.shippingAddressEntity?.namee || 'عميل غير معروف',
                email: data.shippingAddressEntity?.email || '',
                phoneNumber: data.shippingAddressEntity?.phoneNumber || '',
                address: data.shippingAddressEntity?.address || '',
                city: data.shippingAddressEntity?.city || '',
                apartmentNumber: data.shippingAddressEntity?.apartmentNumber || '',
              },
              senderWalletPhone: data.senderWalletPhone || '',
              pharmacyWalletNumber: data.pharmacyWalletNumber || null,
              paymentProofUrl: data.paymentProofUrl || null,
              prescriptionUrl: data.prescriptionUrl || '',
              pharmacyId: data.pharmacyId,
              createdAt: data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : (data.createdAt ? new Date(data.createdAt) : new Date()),
              updatedAt: data.updatedAt instanceof Timestamp
                ? data.updatedAt.toDate()
                : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
              reviews: Array.isArray(data.reviews) ? data.reviews : []
            } as Order;
          } catch (error) {
            console.error('Error processing order document:', doc.id, error);
            return null;
          }
        }).filter((order): order is Order => order !== null);

        // Filter orders for specific pharmacy
        // CRITICAL: Only show orders that have items from this pharmacy
        if (pharmacyId !== undefined && pharmacyId !== null) {
          ordersList = ordersList.filter(order => {
            // Check if any cart item belongs to this pharmacy
            const hasPharmacyItems = order.cartItem.some(
              (item: CartItem) => item.medicineEntity?.pharmacyId === pharmacyId
            );
            
            // ONLY return orders that have items from this pharmacy
            return hasPharmacyItems;
          }).map(order => {
            // Filter cart items to show only this pharmacy's items
            const filteredCartItems = order.cartItem.filter(
              (item: CartItem) => item.medicineEntity?.pharmacyId === pharmacyId
            );

            // Recalculate totals for this pharmacy's items only
            const pharmacySubtotal = filteredCartItems.reduce(
              (sum, item) => sum + (item.medicineEntity.price * item.count), 0
            );

            return {
              ...order,
              cartItem: filteredCartItems,
              subtotal: pharmacySubtotal,
              // Calculate total for this pharmacy's items only
              totalAmount: pharmacySubtotal + order.deliveryFee
            };
          });
        }

        console.log(`📊 Pharmacy ${pharmacyId} orders:`, ordersList.length);
        setOrders(ordersList);
        setError(null);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
        setIsLoading(false);
        toast.error('حدث خطأ أثناء تحميل الطلبات');
      }
    );

    return () => unsubscribe();
  }, [pharmacyId, options?.enabled]);

  const updateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: Timestamp.now()
      });
      toast.success('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('فشل في تحديث حالة الطلب');
    }
  };

  return { orders, isLoading, error, updateOrderStatus };
}
