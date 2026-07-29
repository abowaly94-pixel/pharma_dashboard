import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Banner } from '@/types';
import { getBannerIllustration } from '@/assets/bannerIllustrations';

const BANNERS_COLLECTION = 'banners';

export const bannerService = {
  // Get all banners ordered by sortOrder
  async getAllBanners(): Promise<Banner[]> {
    try {
      const q = query(
        collection(db, BANNERS_COLLECTION),
        orderBy('sortOrder', 'asc')
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const rawUrl = data.imageUrl || '';
        const resolvedUrl = getBannerIllustration(rawUrl);

        return {
          id: docSnap.id,
          title: data.title || '',
          titleEn: data.titleEn || '',
          subtitle: data.subtitle || '',
          subtitleEn: data.subtitleEn || '',
          badgeText: data.badgeText || '',
          badgeTextEn: data.badgeTextEn || '',
          imageUrl: resolvedUrl,
          bannerType: data.bannerType || 'custom_card',
          primaryColor: data.primaryColor || '#3478F6',
          backgroundColor: data.backgroundColor || '#EBF3FF',
          actionType: data.actionType || 'none',
          actionTarget: data.actionTarget || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          sortOrder: data.sortOrder || 0,
          imageZoom: data.imageZoom !== undefined ? data.imageZoom : 1,
          imageRotation: data.imageRotation !== undefined ? data.imageRotation : 0,
          imageOffsetX: data.imageOffsetX !== undefined ? data.imageOffsetX : 0,
          imageOffsetY: data.imageOffsetY !== undefined ? data.imageOffsetY : 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        } as Banner;
      });
    } catch (error) {
      console.error('Error getting banners:', error);
      throw error;
    }
  },

  // Add new banner
  async addBanner(bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      if (!bannerData.title && bannerData.bannerType === 'custom_card') {
        throw new Error('عنوان البانر مطلوب');
      }

      const docRef = await addDoc(collection(db, BANNERS_COLLECTION), {
        ...bannerData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error adding banner:', error);
      throw error;
    }
  },

  // Update banner
  async updateBanner(id: string, bannerData: Partial<Banner>): Promise<void> {
    try {
      const docRef = doc(db, BANNERS_COLLECTION, id);
      await updateDoc(docRef, {
        ...bannerData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating banner:', error);
      throw error;
    }
  },

  // Delete banner
  async deleteBanner(id: string): Promise<void> {
    try {
      const docRef = doc(db, BANNERS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting banner:', error);
      throw error;
    }
  },

  // Toggle single banner active status
  async toggleBannerStatus(id: string, currentStatus: boolean): Promise<void> {
    try {
      const docRef = doc(db, BANNERS_COLLECTION, id);
      await updateDoc(docRef, {
        isActive: !currentStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error toggling banner status:', error);
      throw error;
    }
  },

  // Hide or Deactivate all banners with 1 click
  async toggleAllBannersStatus(active: boolean): Promise<void> {
    try {
      const q = query(collection(db, BANNERS_COLLECTION));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          isActive: active,
          updatedAt: Timestamp.now(),
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error toggling all banners status:', error);
      throw error;
    }
  },

  // Delete all banners with 1 click
  async deleteAllBanners(): Promise<void> {
    try {
      const q = query(collection(db, BANNERS_COLLECTION));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting all banners:', error);
      throw error;
    }
  },

  // Seed default banners including exact Home Nursing Services banner & SVG illustrations
  async seedInitialBanners(): Promise<void> {
    try {
      const sampleBanners: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          title: 'الدوا مش موجود؟ إحنا نجيبهولك',
          titleEn: 'Medicine unavailable? We will find it for you',
          subtitle: 'مش هتلف على صيدليات تاني',
          subtitleEn: 'No need to search multiple pharmacies',
          badgeText: 'أدوية نادرة',
          badgeTextEn: 'Rare Medicines',
          imageUrl: getBannerIllustration('medicine_amico'),
          bannerType: 'custom_card',
          primaryColor: '#3478F6',
          backgroundColor: '#EBF3FF',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 1,
          imageZoom: 1,
          imageRotation: 0,
        },
        {
          title: 'ابحث عن دواك بسهولة',
          titleEn: 'Find your medicine easily',
          subtitle: 'جد الأدوية والمستلزمات الطبية في أقرب الصيدليات بلمسة واحدة',
          subtitleEn: 'Locate medicines in nearby pharmacies with a single touch',
          badgeText: 'تحديد الموقع',
          badgeTextEn: 'Medicine Locator',
          imageUrl: getBannerIllustration('medicine_bro'),
          bannerType: 'custom_card',
          primaryColor: '#3478F6',
          backgroundColor: '#EBF3FF',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 2,
          imageZoom: 1,
          imageRotation: 0,
        },
        {
          title: 'عروض حصرية يومية',
          titleEn: 'Exclusive Daily Deals',
          subtitle: 'خصومات رائعة على المستلزمات الطبية والمنتجات الأكثر طلباً',
          subtitleEn: 'Great discounts on medical supplies and products',
          badgeText: 'عروض خاصة',
          badgeTextEn: 'Special Deals',
          imageUrl: getBannerIllustration('public_health'),
          bannerType: 'custom_card',
          primaryColor: '#10B981',
          backgroundColor: '#ECFDF5',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 3,
          imageZoom: 1,
          imageRotation: 0,
        },
        {
          title: 'خدمات التمريض المنزلي',
          titleEn: 'Home Nursing Services',
          subtitle: 'رعاية تمريضية شاملة بالساعة أو اليوم على مدار 24 ساعة',
          subtitleEn: 'Comprehensive hourly or daily nursing care 24/7',
          badgeText: 'متاح 24/7',
          badgeTextEn: 'Available 24/7',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209028.png',
          bannerType: 'custom_card',
          primaryColor: '#8B5CF6',
          backgroundColor: '#F5F3FF',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 4,
          imageZoom: 1,
          imageRotation: 0,
        },
      ];

      const batch = writeBatch(db);
      for (const banner of sampleBanners) {
        const docRef = doc(collection(db, BANNERS_COLLECTION));
        batch.set(docRef, {
          ...banner,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      await batch.commit();
    } catch (error) {
      console.error('Error seeding initial banners:', error);
      throw error;
    }
  },
};
