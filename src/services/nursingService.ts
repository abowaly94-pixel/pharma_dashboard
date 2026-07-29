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
  setDoc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { db, getSecondaryApp } from '@/lib/firebase';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Nurse, NursingService, NursingBooking } from '@/types';

const SERVICES_COLLECTION = 'nursing_services';
const NURSES_COLLECTION = 'nurses';
const BOOKINGS_COLLECTION = 'nursing_bookings';

const DEFAULT_SERVICES: Omit<NursingService, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'injections',
    titleAr: 'إعطاء الحقن',
    titleEn: 'Injections',
    descriptionAr: 'حقن عضل، وريد، وتحت الجلد بأيدي متخصصين معقمين',
    descriptionEn: 'IM, IV and Subcutaneous injections by certified nurses',
    icon: 'vaccines',
    startingPrice: 50.0,
    accentColorHex: '#3638DA',
  },
  {
    id: 'iv_drips',
    titleAr: 'تركيب المحاليل',
    titleEn: 'IV Drips',
    descriptionAr: 'تركيب كانيولا وإعادة إعطاء المحاليل والمغذيات بالمنزل',
    descriptionEn: 'Cannula insertion and home IV drip administration',
    icon: 'water_drop',
    startingPrice: 120.0,
    accentColorHex: '#00A86B',
  },
  {
    id: 'wound_care',
    titleAr: 'الغيار على الجروح',
    titleEn: 'Wound Dressing',
    descriptionAr: 'تطهير وتغيير معقم لجروح العمليات والحروق والقدم السكري',
    descriptionEn: 'Sterile dressing for surgical wounds, burns and ulcers',
    icon: 'healing',
    startingPrice: 150.0,
    accentColorHex: '#E53E3E',
  },
  {
    id: 'vital_signs',
    titleAr: 'قياس الضغط والسكر',
    titleEn: 'Vital Signs',
    descriptionAr: 'فحص العلامات الحيوية، الضغط، السكر، ونسبة الأكسجين',
    descriptionEn: 'Checking BP, Blood Sugar, Pulse and SpO2 levels',
    icon: 'monitor_heart',
    startingPrice: 40.0,
    accentColorHex: '#DD6B20',
  },
  {
    id: 'elderly_care',
    titleAr: 'تمريض كبار السن',
    titleEn: 'Elderly Care',
    descriptionAr: 'رعاية تمريضية شاملة بالساعة للمسنين والحالات الحرجـة',
    descriptionEn: 'Shift-based specialized care for elderly patients',
    icon: 'elderly',
    startingPrice: 300.0,
    accentColorHex: '#805AD5',
  },
];

const DEFAULT_NURSES: Omit<Nurse, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'nurse_1',
    name: 'أحمد محمود العبد',
    titleAr: 'أخصائي تمريض جراحي ومحاليل',
    titleEn: 'Surgical & IV Specialist Nurse',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=60',
    rating: 4.9,
    reviewsCount: 64,
    experienceYears: 7,
    locationAr: 'المعادي، القاهرة',
    locationEn: 'Maadi, Cairo',
    distanceKm: 1.2,
    price: 120.0,
    phone: '01012345678',
    isVerified: true,
    serviceIds: ['injections', 'iv_drips', 'wound_care', 'vital_signs'],
    aboutAr: 'أخصائي تمريض خبرة 7 سنوات بمستشفيات قصر العيني، متقن لتركيب الكانيولا للورد الصعب والغيار المعقم للجروح.',
  },
  {
    id: 'nurse_2',
    name: 'م. سارة فاروق الحسيني',
    titleAr: 'أخصائية تمريض منزلي وكبار السن',
    titleEn: 'Home Care & Elderly Specialist',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=60',
    rating: 4.95,
    reviewsCount: 88,
    experienceYears: 9,
    locationAr: 'مدينة نصر، القاهرة',
    locationEn: 'Nasr City, Cairo',
    distanceKm: 2.5,
    price: 150.0,
    phone: '01123456789',
    isVerified: true,
    serviceIds: ['injections', 'iv_drips', 'vital_signs', 'elderly_care'],
    aboutAr: 'خبرة طويلة في التعامل مع مرضى كبار السن، المتابعة الدورية للعلامات الحيوية، وإعطاء كافة العلاجات الوريدية والعضلية.',
  },
  {
    id: 'nurse_3',
    name: 'محمد مصطفى كامل',
    titleAr: 'تمريض عناية مركزة وجروح',
    titleEn: 'ICU & Wound Care Nurse',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=60',
    rating: 4.8,
    reviewsCount: 42,
    experienceYears: 5,
    locationAr: 'التجمع الخامس، القاهرة',
    locationEn: '5th Settlement, Cairo',
    distanceKm: 3.1,
    price: 140.0,
    phone: '01234567890',
    isVerified: true,
    serviceIds: ['injections', 'iv_drips', 'wound_care'],
    aboutAr: 'أخصائي تمريض عناية مركزة، متخصص في تنظيف وتطهير الجروح المعقدة والغيار المعقم السليم.',
  },
  {
    id: 'nurse_4',
    name: 'م. نورهان خالد',
    titleAr: 'أخصائية تمريض ورعاية منزلية',
    titleEn: 'General Nursing & Vital Care',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=60',
    rating: 4.88,
    reviewsCount: 51,
    experienceYears: 6,
    locationAr: 'مصر الجديدة، القاهرة',
    locationEn: 'Heliopolis, Cairo',
    distanceKm: 1.8,
    price: 100.0,
    phone: '01512345678',
    isVerified: true,
    serviceIds: ['injections', 'vital_signs', 'iv_drips'],
    aboutAr: 'سرعة استجابة في تقديم خدمات الحقن والمحاليل بالمنزل، معاملة لطيفة ومحترفة مع الأطفال والمرضى.',
  },
];

export const nursingService = {
  // Seed initial data if Firestore is empty
  async seedInitialDataIfNeeded(): Promise<void> {
    try {
      const servicesSnap = await getDocs(collection(db, SERVICES_COLLECTION));
      if (servicesSnap.empty) {
        for (const s of DEFAULT_SERVICES) {
          await setDoc(doc(db, SERVICES_COLLECTION, s.id), {
            ...s,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }

      const nursesSnap = await getDocs(collection(db, NURSES_COLLECTION));
      if (nursesSnap.empty) {
        for (const n of DEFAULT_NURSES) {
          await setDoc(doc(db, NURSES_COLLECTION, n.id), {
            ...n,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
        }
      }
    } catch (err) {
      console.error('Error seeding nursing initial data:', err);
    }
  },

  // Services CRUD
  async getAllServices(): Promise<NursingService[]> {
    try {
      await this.seedInitialDataIfNeeded();
      const q = query(collection(db, SERVICES_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as NursingService[];
    } catch (error) {
      console.error('Error fetching nursing services:', error);
      return DEFAULT_SERVICES as NursingService[];
    }
  },

  async addService(serviceData: Omit<NursingService, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
        ...serviceData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding nursing service:', error);
      throw error;
    }
  },

  async updateService(id: string, serviceData: Partial<NursingService>): Promise<void> {
    try {
      const ref = doc(db, SERVICES_COLLECTION, id);
      await updateDoc(ref, {
        ...serviceData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating nursing service:', error);
      throw error;
    }
  },

  async deleteService(id: string): Promise<void> {
    try {
      const ref = doc(db, SERVICES_COLLECTION, id);
      await deleteDoc(ref);
    } catch (error) {
      console.error('Error deleting nursing service:', error);
      throw error;
    }
  },

  // Nurses CRUD
  async getAllNurses(): Promise<Nurse[]> {
    try {
      await this.seedInitialDataIfNeeded();
      const q = query(collection(db, NURSES_COLLECTION), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Nurse[];
    } catch (error) {
      console.error('Error fetching nurses:', error);
      return DEFAULT_NURSES as Nurse[];
    }
  },

  async addNurse(nurseData: Omit<Nurse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, NURSES_COLLECTION), {
        ...nurseData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding nurse:', error);
      throw error;
    }
  },

  async updateNurse(id: string, nurseData: Partial<Nurse>): Promise<void> {
    try {
      const ref = doc(db, NURSES_COLLECTION, id);
      await updateDoc(ref, {
        ...nurseData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating nurse:', error);
      throw error;
    }
  },

  async deleteNurse(id: string): Promise<void> {
    try {
      const ref = doc(db, NURSES_COLLECTION, id);
      await deleteDoc(ref);
    } catch (error) {
      console.error('Error deleting nurse:', error);
      throw error;
    }
  },

  async toggleNurseVerified(id: string, isVerified: boolean): Promise<void> {
    try {
      const ref = doc(db, NURSES_COLLECTION, id);
      await updateDoc(ref, {
        isVerified,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error toggling nurse verified status:', error);
      throw error;
    }
  },

  // Upload Nurse Avatar to Supabase Storage
  async uploadNurseAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    if (!isSupabaseConfigured) {
      return { success: false, error: 'Supabase storage is not configured' };
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `nurse_${timestamp}_${randomString}.${fileExt}`;
      const filePath = `nurses_images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('Medicines_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('Medicines_images')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error uploading image' };
    }
  },

  // Bookings CRUD - Resilient Fetch & Real-time Subscriptions
  async getAllBookings(): Promise<NursingBooking[]> {
    try {
      let snapshot;
      try {
        const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
        snapshot = await getDocs(q);
      } catch (qErr) {
        console.warn('Ordered query failed, falling back to simple getDocs:', qErr);
        snapshot = await getDocs(collection(db, BOOKINGS_COLLECTION));
      }

      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        let cDate = new Date();
        if (data.createdAt?.toDate) {
          cDate = data.createdAt.toDate();
        } else if (data.createdAt) {
          cDate = new Date(data.createdAt);
        }

        let uDate = undefined;
        if (data.updatedAt?.toDate) {
          uDate = data.updatedAt.toDate();
        }

        return {
          id: doc.id,
          ...data,
          createdAt: cDate,
          updatedAt: uDate,
        };
      }) as NursingBooking[];

      list.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tB - tA;
      });

      return list;
    } catch (error) {
      console.error('Error fetching nursing bookings:', error);
      return [];
    }
  },

  // Real-time listener for all bookings (Admin Dashboard)
  subscribeToBookings(callback: (bookings: NursingBooking[]) => void): () => void {
    const colRef = collection(db, BOOKINGS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => {
          const data = doc.data();
          let cDate = new Date();
          if (data.createdAt?.toDate) {
            cDate = data.createdAt.toDate();
          } else if (data.createdAt) {
            cDate = new Date(data.createdAt);
          }

          let uDate = undefined;
          if (data.updatedAt?.toDate) {
            uDate = data.updatedAt.toDate();
          }

          return {
            id: doc.id,
            ...data,
            createdAt: cDate,
            updatedAt: uDate,
          };
        }) as NursingBooking[];

        list.sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
        });

        callback(list);
      },
      (error) => {
        console.error('Error in nursing bookings snapshot listener:', error);
      }
    );
  },

  async updateBookingStatus(id: string, status: NursingBooking['status']): Promise<void> {
    try {
      const ref = doc(db, BOOKINGS_COLLECTION, id);
      await updateDoc(ref, {
        status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  // Create Firebase Auth account for a Nurse
  async createNurseAccount(nurseId: string, email: string, password: string, name: string, avatarUrl: string): Promise<string> {
    try {
      const secondaryApp = getSecondaryApp();
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const uid = userCredential.user.uid;

      // 1. Create user document in 'users' collection
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        name,
        role: 'nurse',
        profileImageUrl: avatarUrl || '',
        cart: [],
        favorites: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // 2. Update nurse document with user credentials
      const nurseRef = doc(db, NURSES_COLLECTION, nurseId);
      await updateDoc(nurseRef, {
        email,
        userId: uid,
        hasAccount: true,
        updatedAt: Timestamp.now(),
      });

      return uid;
    } catch (error) {
      console.error('Error creating nurse account:', error);
      throw error;
    }
  },

  // Fetch bookings for a specific logged-in nurse
  async getNurseBookings(nurseId: string, nurseEmail?: string): Promise<NursingBooking[]> {
    const all = await this.getAllBookings();
    return all.filter((b) => b.nurseId === nurseId || (nurseEmail && (b as any).nurseEmail === nurseEmail));
  },

  // Real-time listener for nurse bookings
  subscribeToNurseBookings(nurseId: string, nurseEmail: string | undefined, callback: (bookings: NursingBooking[]) => void): () => void {
    return this.subscribeToBookings((allBookings) => {
      const filtered = allBookings.filter(
        (b) => b.nurseId === nurseId || (nurseEmail && (b as any).nurseEmail === nurseEmail)
      );
      callback(filtered);
    });
  },
};
