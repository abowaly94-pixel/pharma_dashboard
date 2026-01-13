import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const diagnoseFirestoreConnection = async () => {
  console.log('[Firebase Diagnosis] Starting Firestore connection test...');
  try {
    const medicinesRef = collection(db, 'medicines');
    console.log('[Firebase Diagnosis] Attempting to get documents from "medicines" collection...');
    const snapshot = await getDocs(medicinesRef);
    console.log(`[Firebase Diagnosis] Success! Found ${snapshot.size} documents in "medicines" collection.`);
    if (snapshot.size === 0) {
      console.warn('[Firebase Diagnosis] The "medicines" collection is empty. This is a likely reason for the UI showing "no medicines".');
    }
  } catch (error) {
    console.error('[Firebase Diagnosis] Failed to connect to Firestore or read from "medicines" collection.', error);
  }
};