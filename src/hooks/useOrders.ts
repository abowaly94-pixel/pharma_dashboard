import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, CartItem } from '@/types';
import { toast } from 'sonner';

export function useOrders(pharmacyId?: number, options?: { enabled?: boolean; isAdminView?: boolean }) {
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

    // If no pharmacyId provided and not admin view, don't fetch anything
    if (!options?.isAdminView && (pharmacyId === undefined || pharmacyId === null)) {
      setOrders([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create base query - get all orders then filter client-side for pharmacy
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery,
      (snapshot) => {
        console.log('useOrders - snapshot received, docs count:', snapshot.docs.length);
        console.log('useOrders - isAdminView:', options?.isAdminView);
        
        let ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('useOrders - processing order:', doc.id, data);
          try {
            // Extract pharmacyId from first cart item if not at order level
            const cartItems = Array.isArray(data.cartItem) ? data.cartItem : [];
            const firstPharmacyId = cartItems.length > 0 
              ? cartItems[0]?.medicineEntity?.pharmacyId 
              : undefined;

            return {
              id: doc.id,
              orderId: data.orderId || doc.id,
              userId: data.userId || '',
              cartItem: cartItems,
              orderStatus: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(data.orderStatus)
                ? data.orderStatus
                : 'pending',
              paymentMethodName: data.paymentMethodName || 'Unknown',
              payWithCash: typeof data.payWithCash === 'boolean' ? data.payWithCash : true,
              deliveryFee: typeof data.deliveryFee === 'number' ? data.deliveryFee : 0,
              subtotal: typeof data.subtotal === 'number' ? data.subtotal : 0,
              totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
              latitude: typeof data.latitude === 'number'
                ? data.latitude
                : (typeof data.shippingAddressEntity?.latitude === 'number'
                  ? data.shippingAddressEntity.latitude
                  : undefined),
              longitude: typeof data.longitude === 'number'
                ? data.longitude
                : (typeof data.shippingAddressEntity?.longitude === 'number'
                  ? data.shippingAddressEntity.longitude
                  : undefined),
              shippingAddressEntity: {
                namee: data.shippingAddressEntity?.namee || 'عميل غير معروف',
                email: data.shippingAddressEntity?.email || '',
                phoneNumber: data.shippingAddressEntity?.phoneNumber || '',
                address: data.shippingAddressEntity?.address || '',
                city: data.shippingAddressEntity?.city || '',
                apartmentNumber: data.shippingAddressEntity?.apartmentNumber || '',
                latitude: typeof data.shippingAddressEntity?.latitude === 'number'
                  ? data.shippingAddressEntity.latitude
                  : (typeof data.latitude === 'number' ? data.latitude : undefined),
                longitude: typeof data.shippingAddressEntity?.longitude === 'number'
                  ? data.shippingAddressEntity.longitude
                  : (typeof data.longitude === 'number' ? data.longitude : undefined),
              },
              senderWalletPhone: data.senderWalletPhone || '',
              pharmacyWalletNumber: data.pharmacyWalletNumber || null,
              paymentProofUrl: data.paymentProofUrl || null,
              prescriptionUrl: data.prescriptionUrl || '',
              pharmacyId: data.pharmacyId || firstPharmacyId,
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

        // If admin view, return all orders without filtering
        if (options?.isAdminView) {
          console.log('useOrders - Admin view, returning all orders:', ordersList.length);
          setOrders(ordersList);
          setError(null);
          setIsLoading(false);
          return;
        }

        console.log('useOrders - Pharmacy view, filtering for pharmacyId:', pharmacyId);

        // Filter orders for specific pharmacy - only show orders with items from this pharmacy
        ordersList = ordersList.filter(order => {
          return order.cartItem.some(
            (item: CartItem) => {
              const itemPharmacyId = item.medicineEntity?.pharmacyId;
              const itemIdNum = typeof itemPharmacyId === 'string' ? parseInt(itemPharmacyId, 10) : itemPharmacyId;
              const targetIdNum = typeof pharmacyId === 'string' ? parseInt(pharmacyId, 10) : pharmacyId;
              return itemIdNum === targetIdNum;
            }
          );
        }).map(order => {
          // Filter cart items to show only this pharmacy's items
          const filteredCartItems = order.cartItem.filter(
            (item: CartItem) => {
              const itemPharmacyId = item.medicineEntity?.pharmacyId;
              const itemIdNum = typeof itemPharmacyId === 'string' ? parseInt(itemPharmacyId, 10) : itemPharmacyId;
              const targetIdNum = typeof pharmacyId === 'string' ? parseInt(pharmacyId, 10) : pharmacyId;
              return itemIdNum === targetIdNum;
            }
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
  }, [pharmacyId, options?.enabled, options?.isAdminView]);

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
