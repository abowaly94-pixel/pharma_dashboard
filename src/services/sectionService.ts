import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Section } from '@/types';

const SECTIONS_COLLECTION = 'sections';
const SECTIONS_LIST_COLLECTION = 'sections_list'; // Collection للاستدعاء السهل من Flutter

export const sectionService = {
  // Get all sections
  async getAllSections(): Promise<Section[]> {
    try {
      const q = query(
        collection(db, SECTIONS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Section[];
    } catch (error) {
      console.error('Error getting sections:', error);
      throw error;
    }
  },

  // Get active sections only
  async getActiveSections(): Promise<Section[]> {
    try {
      // NOTE: Avoid compound query (where + orderBy) to prevent Firestore index requirement.
      // Fetch ordered sections then filter active in memory.
      const q = query(collection(db, SECTIONS_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }))
        .filter((section) => (section as Section).isActive) as Section[];
    } catch (error) {
      console.error('Error getting active sections:', error);
      throw error;
    }
  },

  // Add new section
  async addSection(sectionData: Omit<Section, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // التحقق من البيانات الإلزامية
      if (!sectionData.name || sectionData.name.trim() === '') {
        throw new Error('اسم القسم بالعربي مطلوب');
      }
      
      if (!sectionData.nameEn || sectionData.nameEn.trim() === '') {
        throw new Error('اسم القسم بالإنجليزي مطلوب');
      }
      
      if (!sectionData.sectionImageUrl || sectionData.sectionImageUrl.trim() === '') {
        throw new Error('صورة القسم مطلوبة');
      }
      
      const docRef = await addDoc(collection(db, SECTIONS_COLLECTION), {
        ...sectionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // مزامنة مع sections_list للاستدعاء السهل من Flutter
      await this.syncToSectionsList(docRef.id, {
        ...sectionData,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding section:', error);
      throw error;
    }
  },

  // Update section
  async updateSection(id: string, sectionData: Partial<Section>): Promise<void> {
    try {
      // التحقق من البيانات الإلزامية عند التحديث
      if (sectionData.name !== undefined && (!sectionData.name || sectionData.name.trim() === '')) {
        throw new Error('اسم القسم بالعربي مطلوب');
      }
      
      if (sectionData.nameEn !== undefined && (!sectionData.nameEn || sectionData.nameEn.trim() === '')) {
        throw new Error('اسم القسم بالإنجليزي مطلوب');
      }
      
      if (sectionData.sectionImageUrl !== undefined && (!sectionData.sectionImageUrl || sectionData.sectionImageUrl.trim() === '')) {
        throw new Error('صورة القسم مطلوبة');
      }
      
      const sectionRef = doc(db, SECTIONS_COLLECTION, id);
      await updateDoc(sectionRef, {
        ...sectionData,
        updatedAt: Timestamp.now(),
      });
      
      // مزامنة التحديث مع sections_list
      await this.syncUpdateToSectionsList(id, sectionData);
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  },

  // Delete section
  async deleteSection(id: string): Promise<void> {
    try {
      const sectionRef = doc(db, SECTIONS_COLLECTION, id);
      await deleteDoc(sectionRef);
      
      // حذف من sections_list أيضاً
      await this.deleteFromSectionsList(id);
    } catch (error) {
      console.error('Error deleting section:', error);
      throw error;
    }
  },

  // Toggle section active status
  async toggleSectionStatus(id: string, isActive: boolean): Promise<void> {
    try {
      const sectionRef = doc(db, SECTIONS_COLLECTION, id);
      await updateDoc(sectionRef, {
        isActive,
        updatedAt: Timestamp.now(),
      });
      
      // مزامنة التحديث مع sections_list
      await this.syncUpdateToSectionsList(id, { isActive });
    } catch (error) {
      console.error('Error toggling section status:', error);
      throw error;
    }
  },

  // ==================== دوال المزامنة مع sections_list ====================

  /**
   * مزامنة قسم جديد إلى sections_list
   * يتم استدعاؤها تلقائياً عند إضافة قسم جديد
   */
  async syncToSectionsList(sectionId: string, sectionData: Section): Promise<void> {
    try {
      const listDocRef = doc(db, SECTIONS_LIST_COLLECTION, sectionId);
      await setDoc(listDocRef, {
        id: sectionId,
        name: sectionData.name,
        nameEn: sectionData.nameEn || '',
        description: sectionData.description || '',
        icon: sectionData.icon || '',
        sectionImageUrl: (sectionData as any).sectionImageUrl || '',
        originalImageUrl: (sectionData as any).originalImageUrl || '',
        isActive: sectionData.isActive,
        order: sectionData.order || 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error syncing to sections_list:', error);
      // لا نرمي الخطأ لأن العملية الأساسية نجحت
    }
  },

  /**
   * مزامنة تحديث قسم إلى sections_list
   * يتم استدعاؤها تلقائياً عند تحديث قسم
   */
  async syncUpdateToSectionsList(sectionId: string, sectionData: Partial<Section>): Promise<void> {
    try {
      const listDocRef = doc(db, SECTIONS_LIST_COLLECTION, sectionId);
      await updateDoc(listDocRef, {
        ...sectionData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error syncing update to sections_list:', error);
      // لا نرمي الخطأ لأن العملية الأساسية نجحت
    }
  },

  /**
   * حذف قسم من sections_list
   * يتم استدعاؤها تلقائياً عند حذف قسم
   */
  async deleteFromSectionsList(sectionId: string): Promise<void> {
    try {
      const listDocRef = doc(db, SECTIONS_LIST_COLLECTION, sectionId);
      await deleteDoc(listDocRef);
    } catch (error) {
      console.error('Error deleting from sections_list:', error);
      // لا نرمي الخطأ لأن العملية الأساسية نجحت
    }
  },

  /**
   * مزامنة جميع الأقسام الموجودة إلى sections_list
   * استخدم هذه الدالة مرة واحدة لمزامنة البيانات الموجودة
   */
  async syncAllSectionsToList(): Promise<{ success: number; failed: number }> {
    try {
      const sections = await this.getAllSections();
      let success = 0;
      let failed = 0;

      for (const section of sections) {
        try {
          await this.syncToSectionsList(section.id, section);
          success++;
        } catch (error) {
          console.error(`Failed to sync section ${section.id}:`, error);
          failed++;
        }
      }

      return { success, failed };
    } catch (error) {
      console.error('Error syncing all sections:', error);
      throw error;
    }
  },
};
