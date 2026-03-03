import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Section } from '@/types';

const SECTIONS_COLLECTION = 'sections';

export const sectionService = {
  // Get all sections
  async getAllSections(): Promise<Section[]> {
    try {
      const q = query(
        collection(db, SECTIONS_COLLECTION),
        orderBy('order', 'asc')
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
      const q = query(collection(db, SECTIONS_COLLECTION), orderBy('order', 'asc'));
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
      const docRef = await addDoc(collection(db, SECTIONS_COLLECTION), {
        ...sectionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
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
      const sectionRef = doc(db, SECTIONS_COLLECTION, id);
      await updateDoc(sectionRef, {
        ...sectionData,
        updatedAt: Timestamp.now(),
      });
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
    } catch (error) {
      console.error('Error toggling section status:', error);
      throw error;
    }
  },
};
