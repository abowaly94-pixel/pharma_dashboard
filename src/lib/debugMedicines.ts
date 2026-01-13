import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const debugMedicinesData = async () => {
  console.log('🔍 فحص بيانات الأدوية في Firebase...');
  
  try {
    const medicinesRef = collection(db, 'medicines');
    const snapshot = await getDocs(medicinesRef);
    
    console.log(`📊 عدد الأدوية: ${snapshot.size}`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- دواء ${index + 1} ---`);
      console.log('ID:', doc.id);
      console.log('Name:', data.name);
      console.log('subabaseORImageUrl:', data.subabaseORImageUrl);
      console.log('subabaseImageUrl:', data.subabaseImageUrl);
      console.log('جميع الحقول:', Object.keys(data));
      console.log('البيانات الكاملة:', data);
    });
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ خطأ في قراءة البيانات:', error);
    return [];
  }
};