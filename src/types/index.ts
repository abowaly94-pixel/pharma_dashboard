// ==================== Status Types ====================

/** حالة الصيدلية في النظام */
export type PharmacyStatus = 'active' | 'inactive' | 'suspended';

/** حالة الدواء في نظام المراجعة */
export type MedicineStatus = 'pending' | 'approved' | 'rejected';

// ==================== Core Interfaces ====================

export interface Medicine {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  quantity: number;
  pharmacyId: number;
  pharmacyName: string;
  pharmcyAddress: string; // تم الاحتفاظ بالاسم الحالي للتوافق
  avgRating: number;
  ratingCount: number;
  discountRating: number;
  isNewProduct: boolean;
  sellingCount: number;
  reviews: Review[];
  subabaseImageUrl: string; // الحقل الأساسي للصور من Supabase
  subabaseORImageUrl?: string; // حقل قديم للتوافق مع البيانات القديمة
  category?: string;
  manufacturer?: string;
  expiryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/** 
 * واجهة الدواء المعلق - يتم إنشاؤها عندما يرفع الصيدلي دواء جديد
 * Pending Medicine Interface - Created when pharmacist uploads a new medicine
 */
export interface PendingMedicine extends Medicine {
  status: 'pending';
  rejectionNotes?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
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
  phoneNumber?: string;
  cart: CartItem[];
  favorites: string[];
  role?: 'admin' | 'pharmacist' | 'user';
  pharmacyId?: number;
  pharmacyName?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  // Detailed address fields for pharmacists
  street?: string;
  city?: string;
  governorate?: string;
  postalCode?: string;
}

export interface DashboardStats {
  totalMedicines: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  todayOrders: number;
}

// ==================== Pharmacy Management Interfaces ====================

/** حساب الصيدلية الموسع مع إدارة الحدود والحالة */
export interface PharmacyAccount {
  id: string;
  pharmacyId: number;
  name: string;
  email: string;
  address: string;
  city: string;
  phoneNumber: string;
  ownerName: string;
  licenseNumber: string;
  status: PharmacyStatus;
  medicineLimit: number;
  currentMedicineCount: number;
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  rating: number;
  totalOrders: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID who created this pharmacy
  // Detailed address fields
  street?: string;
  governorate?: string;
  postalCode?: string;
}

/** بيانات إنشاء صيدلية جديدة */
export interface CreatePharmacyInput {
  name: string;
  email: string;
  password: string;
  address: string;
  city: string;
  phoneNumber: string;
  ownerName: string;
  licenseNumber: string;
  medicineLimit?: number;
}

/** بيانات تحديث الصيدلية */
export interface UpdatePharmacyInput {
  name?: string;
  address?: string;
  city?: string;
  phoneNumber?: string;
  ownerName?: string;
  licenseNumber?: string;
  street?: string;
  governorate?: string;
  postalCode?: string;
}

// ==================== Medicine with Approval Interfaces ====================

/** الدواء مع نظام الموافقة */
export interface MedicineWithApproval {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  manufacturer: string;
  expiryDate: Date;
  subabaseImageUrl: string;
  subabaseORImageUrl: string;
  pharmacyId: number;
  pharmacyName: string;
  status: MedicineStatus;
  rejectionNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from Medicine
  avgRating?: number;
  ratingCount?: number;
  discountRating?: number;
  isNewProduct?: boolean;
  sellingCount?: number;
  reviews?: Review[];
  pharmcyAddress?: string;
}

/** بيانات إنشاء دواء جديد */
export interface CreateMedicineInput {
  name: string;
  code: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  manufacturer: string;
  expiryDate: Date;
  subabaseImageUrl: string;
  subabaseORImageUrl?: string;
  isNewProduct?: boolean;
  discountRating?: number;
}

/** بيانات تحديث الدواء */
export interface UpdateMedicineInput {
  name?: string;
  code?: string;
  description?: string;
  price?: number;
  quantity?: number;
  category?: string;
  manufacturer?: string;
  expiryDate?: Date;
  subabaseImageUrl?: string;
  subabaseORImageUrl?: string;
  isNewProduct?: boolean;
  discountRating?: number;
}

// ==================== Filter Interfaces ====================

/** فلاتر البحث عن الصيدليات */
export interface PharmacyFilters {
  status?: PharmacyStatus | 'all';
  searchQuery?: string;
  sortBy?: 'name' | 'createdAt' | 'medicineCount';
  sortOrder?: 'asc' | 'desc';
}

/** فلاتر البحث عن الأدوية */
export interface MedicineFilters {
  status?: MedicineStatus | 'all';
  pharmacyId?: number;
  dateRange?: { start: Date; end: Date };
  category?: string;
}

// ==================== Session Interface ====================

/** جلسة الصيدلية */
export interface PharmacySession {
  sessionId: string;
  pharmacyId: number;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  isValid: boolean;
}

// ==================== Dashboard Stats Extended ====================

/** إحصائيات لوحة التحكم الموسعة */
export interface AdminDashboardStats extends DashboardStats {
  totalPharmacies: number;
  activePharmacies: number;
  inactivePharmacies: number;
  suspendedPharmacies: number;
  pendingMedicines: number;
  approvedMedicines: number;
  rejectedMedicines: number;
}

/** الأدوية مجمعة حسب الحالة */
export interface GroupedMedicines {
  pending: MedicineWithApproval[];
  approved: MedicineWithApproval[];
  rejected: MedicineWithApproval[];
}
