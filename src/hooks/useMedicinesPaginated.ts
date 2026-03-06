import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Medicine } from '@/types';
import { toast } from 'sonner';

function parseExpiryDate(value: unknown): Date | string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  return undefined;
}

interface UseMedicinesPaginatedOptions {
  pageSize?: number;
  pharmacyId?: number;
  sectionId?: string;
  category?: string;
}

export function useMedicinesPaginated(options: UseMedicinesPaginatedOptions = {}) {
  const { pageSize = 20, pharmacyId, sectionId, category } = options;
  
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [pageCache, setPageCache] = useState<Map<number, {
    medicines: Medicine[];
    lastDoc: QueryDocumentSnapshot<DocumentData> | null;
    firstDoc: QueryDocumentSnapshot<DocumentData> | null;
  }>>(new Map());

  // حساب إجمالي عدد الأدوية
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        let countQuery = query(collection(db, 'medicines'));

        if (pharmacyId !== undefined && pharmacyId !== null) {
          countQuery = query(countQuery, where('pharmacyId', '==', pharmacyId));
        }

        if (sectionId && sectionId !== 'all') {
          countQuery = query(countQuery, where('sectionId', '==', sectionId));
        }

        if (category && category !== 'all') {
          countQuery = query(countQuery, where('category', '==', category));
        }

        const snapshot = await getCountFromServer(countQuery);
        setTotalCount(snapshot.data().count);
      } catch (err) {
        console.error('Error fetching total count:', err);
        setTotalCount(0);
      }
    };

    fetchTotalCount();
  }, [pharmacyId, sectionId, category]);

  // جلب الأدوية للصفحة الحالية
  useEffect(() => {
    const fetchMedicines = async () => {
      // التحقق من الكاش أولاً
      const cached = pageCache.get(currentPage);
      if (cached) {
        setMedicines(cached.medicines);
        setLastDoc(cached.lastDoc);
        setFirstDoc(cached.firstDoc);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let medicinesQuery = query(
          collection(db, 'medicines'),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );

        // إضافة الفلاتر
        if (pharmacyId !== undefined && pharmacyId !== null) {
          medicinesQuery = query(
            collection(db, 'medicines'),
            where('pharmacyId', '==', pharmacyId),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
          );
        }

        if (sectionId && sectionId !== 'all') {
          medicinesQuery = query(medicinesQuery, where('sectionId', '==', sectionId));
        }

        if (category && category !== 'all') {
          medicinesQuery = query(medicinesQuery, where('category', '==', category));
        }

        // إذا لم تكن الصفحة الأولى، استخدم lastDoc للانتقال
        if (currentPage > 1 && lastDoc) {
          medicinesQuery = query(medicinesQuery, startAfter(lastDoc));
        }

        const snapshot = await getDocs(medicinesQuery);

        const medicinesList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'دواء غير معروف',
            nameEn: data.nameEn || '',
            code: data.code || '',
            description: data.description || '',
            descriptionEn: data.descriptionEn || '',
            price: data.price || 0,
            quantity: data.quantity || 0,
            pharmacyId: typeof data.pharmacyId === 'string' ? parseInt(data.pharmacyId, 10) : (data.pharmacyId || 0),
            pharmacyName: data.pharmacyName || '',
            pharmcyAddress: data.pharmcyAddress || '',
            avgRating: data.avgRating || 0,
            ratingCount: data.ratingCount || 0,
            discountRating: data.discountRating || 0,
            isNewProduct: data.isNewProduct || false,
            sellingCount: data.sellingCount || 0,
            reviews: data.reviews || [],
            subabaseImageUrl: data.subabaseImageUrl || data.subabaseORImageUrl || '',
            subabaseORImageUrl: data.subabaseORImageUrl || '',
            category: data.category || '',
            categoryId: data.categoryId || '',
            sectionId: data.sectionId || '',
            sectionName: data.sectionName || '',
            manufacturer: data.manufacturer || '',
            pharmacyPrice: data.pharmacyPrice || 0,
            pharmacyDiscount: data.pharmacyDiscount || 0,
            expiryDate: parseExpiryDate(data.expiryDate),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate()
          } as Medicine;
        });

        const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
        const newFirstDoc = snapshot.docs[0] || null;

        // حفظ في الكاش
        setPageCache(prev => new Map(prev).set(currentPage, {
          medicines: medicinesList,
          lastDoc: newLastDoc,
          firstDoc: newFirstDoc
        }));

        setMedicines(medicinesList);
        setLastDoc(newLastDoc);
        setFirstDoc(newFirstDoc);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching medicines:', err);
        setError('فشل في تحميل الأدوية');
        setIsLoading(false);
        toast.error('حدث خطأ في تحميل الأدوية');
      }
    };

    fetchMedicines();
  }, [currentPage, pageSize, pharmacyId, sectionId, category]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const refreshCurrentPage = () => {
    // مسح الكاش للصفحة الحالية
    setPageCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(currentPage);
      return newCache;
    });
    // إعادة التحميل
    setCurrentPage(currentPage);
  };

  return {
    medicines,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
    refreshCurrentPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}
