import { useState, useEffect } from 'react';
import { Order } from '@/types';

// Demo orders based on Firebase structure
const demoOrders: Order[] = [
  {
    id: 'ORjNsMb5tB5v6q7nvlXN',
    orderId: 'ORjNsMb5tB5v6q7nvlXN',
    userId: 'QZkcWaLoRGMA18BL92TqxX5Zp222',
    cartItem: [
      {
        count: 1,
        medicineEntity: {
          id: '9iKPCXkcyeewx948h8RS',
          name: 'Aloe Pura Gel',
          code: '355696',
          description: '- Organic Aloe Vera',
          price: 790,
          quantity: 15,
          pharmacyId: 409241,
          pharmacyName: 'ELNADA PHARMACY',
          pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
          avgRating: 0,
          ratingCount: 0,
          discountRating: 10,
          isNewProduct: true,
          sellingCount: 0,
          reviews: [],
          subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/aloe.png'
        }
      },
      {
        count: 1,
        medicineEntity: {
          id: 'DlpA5I91vuKvTC8B6a1c',
          name: 'Mustela Baby Cream',
          code: '380455',
          description: '- Avocado Perseose',
          price: 700,
          quantity: 6,
          pharmacyId: 673237,
          pharmacyName: 'ELNADA PHARMACY',
          pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
          avgRating: 0,
          ratingCount: 0,
          discountRating: 5,
          isNewProduct: true,
          sellingCount: 0,
          reviews: [],
          subabaseORImageUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Medicine/mustela.png'
        }
      }
    ],
    orderStatus: 'pending',
    paymentMethodName: 'Cash on Delivery',
    payWithCash: true,
    deliveryFee: 15,
    subtotal: 1490,
    totalAmount: 1505,
    shippingAddressEntity: {
      namee: 'Abdo Waly',
      email: 'waly20691@gmail.com',
      phoneNumber: '01002235555',
      address: 'sdadf',
      city: 'dsadfsa',
      apartmentNumber: 'adsfd'
    },
    senderWalletPhone: '01002235555',
    pharmacyWalletNumber: null,
    paymentProofUrl: null,
    prescriptionUrl: 'https://jzvdrawjkkqbxvhpefhd.supabase.co/storage/v1/object/public/Prescription/presc.png',
    createdAt: new Date('2026-01-08T13:28:05'),
    updatedAt: new Date('2026-01-08T13:28:05')
  },
  {
    id: '0adypMdL2YDGbbh3tQFr',
    orderId: '0adypMdL2YDGbbh3tQFr',
    userId: 'user-002',
    cartItem: [
      {
        count: 2,
        medicineEntity: {
          id: '8vLjQaKOj3FvSJRw2ItM',
          name: 'Nexium',
          code: '569063',
          description: '-Esomeprazole',
          price: 332,
          quantity: 9,
          pharmacyId: 827457,
          pharmacyName: 'ELNADA PHARMACY',
          pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
          avgRating: 0,
          ratingCount: 0,
          discountRating: 0,
          isNewProduct: true,
          sellingCount: 0,
          reviews: [],
          subabaseORImageUrl: ''
        }
      }
    ],
    orderStatus: 'confirmed',
    paymentMethodName: 'Vodafone Cash',
    payWithCash: false,
    deliveryFee: 20,
    subtotal: 664,
    totalAmount: 684,
    shippingAddressEntity: {
      namee: 'Ahmed Hassan',
      email: 'ahmed@gmail.com',
      phoneNumber: '01112345678',
      address: 'شارع التحرير',
      city: 'Cairo',
      apartmentNumber: '5A'
    },
    senderWalletPhone: '01112345678',
    pharmacyWalletNumber: '01098765432',
    paymentProofUrl: 'https://example.com/payment.png',
    prescriptionUrl: '',
    createdAt: new Date('2026-01-10T09:15:00'),
    updatedAt: new Date('2026-01-10T11:30:00')
  },
  {
    id: '2OuSLsWQdDAMR6kg76oI',
    orderId: '2OuSLsWQdDAMR6kg76oI',
    userId: 'user-003',
    cartItem: [
      {
        count: 3,
        medicineEntity: {
          id: 'GfmZCgKRw09zLTOT5KmU',
          name: 'Panadol Extra',
          code: '123456',
          description: 'Pain relief',
          price: 45,
          quantity: 100,
          pharmacyId: 827457,
          pharmacyName: 'ELNADA PHARMACY',
          pharmcyAddress: 'ElSalam, El Menia, Minya Governorate 2441207.',
          avgRating: 4.8,
          ratingCount: 89,
          discountRating: 0,
          isNewProduct: false,
          sellingCount: 234,
          reviews: [],
          subabaseORImageUrl: ''
        }
      }
    ],
    orderStatus: 'delivered',
    paymentMethodName: 'Cash on Delivery',
    payWithCash: true,
    deliveryFee: 15,
    subtotal: 135,
    totalAmount: 150,
    shippingAddressEntity: {
      namee: 'Sara Ahmed',
      email: 'sara@gmail.com',
      phoneNumber: '01223456789',
      address: 'المعادي',
      city: 'Cairo',
      apartmentNumber: '12'
    },
    senderWalletPhone: '01223456789',
    pharmacyWalletNumber: null,
    paymentProofUrl: null,
    prescriptionUrl: '',
    createdAt: new Date('2026-01-05T14:20:00'),
    updatedAt: new Date('2026-01-07T16:45:00')
  }
];

export function useOrders(pharmacyId?: number) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        let filteredOrders = demoOrders;
        if (pharmacyId) {
          filteredOrders = demoOrders.filter(order => 
            order.cartItem.some(item => item.medicineEntity.pharmacyId === pharmacyId)
          );
        }
        
        setOrders(filteredOrders);
      } catch (err) {
        setError('Failed to fetch orders');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [pharmacyId]);

  const updateOrderStatus = async (orderId: string, status: Order['orderStatus']) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, orderStatus: status, updatedAt: new Date() } : order
      )
    );
  };

  return { orders, isLoading, error, updateOrderStatus };
}
