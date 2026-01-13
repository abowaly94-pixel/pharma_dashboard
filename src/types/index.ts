export interface Medicine {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  quantity: number;
  pharmacyId: number;
  pharmacyName: string;
  pharmcyAddress: string;
  avgRating: number;
  ratingCount: number;
  discountRating: number;
  isNewProduct: boolean;
  sellingCount: number;
  reviews: Review[];
  subabaseORImageUrl: string;
  subabaseImageUrl?: string; // الحقل الصحيح من Supabase
  category?: string;
  manufacturer?: string;
  expiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Pharmacy {
  id: string;
  pharmacyId: number;
  name: string;
  address: string;
  city: string;
  phoneNumber: string;
  email: string;
  ownerName: string;
  licenseNumber: string;
  isActive: boolean;
  rating: number;
  totalOrders: number;
  totalMedicines: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Review {
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CartItem {
  count: number;
  medicineEntity: Medicine;
}

export interface ShippingAddress {
  namee: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  apartmentNumber: string;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  cartItem: CartItem[];
  orderStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethodName: string;
  payWithCash: boolean;
  deliveryFee: number;
  subtotal: number;
  totalAmount: number;
  shippingAddressEntity: ShippingAddress;
  senderWalletPhone: string;
  pharmacyWalletNumber: string | null;
  paymentProofUrl: string | null;
  prescriptionUrl: string;
  createdAt: Date;
  updatedAt: Date;
  pharmacyId?: number;
  reviews?: Review[];
}

export interface User {
  uid: string;
  email: string;
  name: string;
  profileImageUrl: string;
  cart: CartItem[];
  favorites: string[];
  role?: 'admin' | 'pharmacist' | 'user';
  pharmacyId?: number;
  pharmacyName?: string;
}

export interface DashboardStats {
  totalMedicines: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
}
