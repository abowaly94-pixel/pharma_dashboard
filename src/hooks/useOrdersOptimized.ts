import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, CartItem } from '@/types';
import { toast } from 'sonner';

// Cache للطلبات - يوفر عمليات القراءة من Firebase
const ordersCache = {
  data: null as Order[] | null,
  timestamp: 0,
  ttl: 5 * 60 * 1000 // 5 دقائق
};

export function useOrdersOptimized(pharmacyId?: number, options?: { enabled?: boolean; isAdminView?: boolean; useCache?: boolean }) {
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

    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        if (options?.useCache && ordersCache.data && (Date.now() - ordersCache.timestamp) < ordersCache.ttl) {
          console.log('useOrdersOptimized - Using cached data');
          setOrders(ordersCache.data);
          setIsLoading(false);
          return;
        }

        // Create query - get recent orders only (last 100)
        const ordersQuery = query(
          collection(db, 'orders'),
          orderBy('createdAt', 'desc'),
          limit(100)
        );

        const snapshot = await getDocs(ordersQuery);
        console.log('useOrdersOptimized - Fetched orders:', snapshot.docs.length);

        let ordersList = snapshot.docs.map(doc => {
          const data = doc.data();
          try {
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
          console.log('useOrdersOptimized - Admin view, returning all orders:', ordersList.length);
          
          // Cache the data
          ordersCache.data = ordersList;
          ordersCache.timestamp = Date.now();
          
          setOrders(ordersList);
          setError(null);
          setIsLoading(false);
          return;
        }

        console.log('useOrdersOptimized - Pharmacy view, filtering for pharmacyId:', pharmacyId);

        // Filter orders for specific pharmacy
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
          const filteredCartItems = order.cartItem.filter(
            (item: CartItem) => {
              const itemPharmacyId = item.medicineEntity?.pharmacyId;
              const itemIdNum = typeof itemPharmacyId === 'string' ? parseInt(itemPharmacyId, 10) : itemPharmacyId;
              const targetIdNum = typeof pharmacyId === 'string' ? parseInt(pharmacyId, 10) : pharmacyId;
              return itemIdNum === targetIdNum;
            }
          );

          const pharmacySubtotal = filteredCartItems.reduce(
            (sum, item) => sum + (item.medicineEntity.price * item.count), 0
          );

          return {
            ...order,
            cartItem: filteredCartItems,
            subtotal: pharmacySubtotal,
            totalAmount: pharmacySubtotal + order.deliveryFee
          };
        });

        setOrders(ordersList);
        setError(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders');
        setIsLoading(false);
        toast.error('حدث خطأ أثناء تحميل الطلبات');
      }
    };

    fetchOrders();
  }, [pharmacyId, options?.enabled, options?.isAdminView, options?.useCache]);

  const updateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        orderStatus: status,
        updatedAt: Timestamp.now()
      });
      
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, orderStatus: status } : order
      ));
      
      // Invalidate cache
      ordersCache.data = null;
      
      toast.success('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      console.error('Error updating order status:', err);
      toast.error('فشل في تحديث حالة الطلب');
    }
  };

  const refreshOrders = () => {
    ordersCache.data = null;
    setIsLoading(true);
  };

  return { orders, isLoading, error, updateOrderStatus, refreshOrders };
}
