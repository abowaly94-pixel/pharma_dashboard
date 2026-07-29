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
        return {
          id: docSnap.id,
          title: data.title || '',
          titleEn: data.titleEn || '',
          subtitle: data.subtitle || '',
          subtitleEn: data.subtitleEn || '',
          badgeText: data.badgeText || '',
          badgeTextEn: data.badgeTextEn || '',
          imageUrl: data.imageUrl || '',
          bannerType: data.bannerType || 'custom_card',
          primaryColor: data.primaryColor || '#3478F6',
          backgroundColor: data.backgroundColor || '#EBF3FF',
          actionType: data.actionType || 'none',
          actionTarget: data.actionTarget || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          sortOrder: data.sortOrder || 0,
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
      if (!bannerData.title || bannerData.title.trim() === '') {
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

  // Toggle active status
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

  // Seed sample initial banners
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
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/3063/3063823.png',
          bannerType: 'custom_card',
          primaryColor: '#3478F6',
          backgroundColor: '#EBF3FF',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 1,
        },
        {
          title: 'خدمات التمريض المنزلي',
          titleEn: 'Home Nursing Services',
          subtitle: 'رعاية تمريضية شاملة بالساعة أو اليوم',
          subtitleEn: 'Comprehensive hourly or daily nursing care',
          badgeText: 'متاح 24/7',
          badgeTextEn: 'Available 24/7',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/2874/2874780.png',
          primaryColor: '#10B981',
          backgroundColor: '#ECFDF5',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 2,
        },
        {
          title: 'عروض وتخفيضات أسبوعية',
          titleEn: 'Weekly Deals & Offers',
          subtitle: 'خصومات تصل حتى 30% على المستلزمات الطبية',
          subtitleEn: 'Discounts up to 30% on medical supplies',
          badgeText: 'خصم حقيقي',
          badgeTextEn: 'Exclusive Discount',
          imageUrl: 'https://cdn-icons-png.flaticon.com/512/1043/1043444.png',
          primaryColor: '#8B5CF6',
          backgroundColor: '#F5F3FF',
          actionType: 'none',
          actionTarget: '',
          isActive: true,
          sortOrder: 3,
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
