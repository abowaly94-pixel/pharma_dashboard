import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { toast } from 'sonner';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Professional Real-time listener for users collection
      const usersCollection = collection(db, 'users');

      const unsubscribe = onSnapshot(usersCollection,
        async (snapshot) => {
          console.log('Snapshot received, docs count:', snapshot.docs.length);
          
          const usersPromises = snapshot.docs.map(async (userDoc) => {
            const data = userDoc.data();
            console.log('Processing user:', userDoc.id, data);
            
            // جلب cart من subcollection
            let cart = [];
            try {
              const cartSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'cart'));
              cart = cartSnapshot.docs.map(doc => doc.data());
              console.log(`Cart for ${data.name}:`, cart.length);
            } catch (err) {
              console.log(`No cart subcollection for user ${data.name}`);
            }
            
            // جلب favorites من subcollection
            let favorites = [];
            try {
              const favoritesSnapshot = await getDocs(collection(db, 'users', userDoc.id, 'favorites'));
              favorites = favoritesSnapshot.docs.map(doc => doc.id);
              console.log(`Favorites for ${data.name}:`, favorites.length);
            } catch (err) {
              console.log(`No favorites subcollection for user ${data.name}`);
            }
            
            // إذا لم تكن subcollections، نحاول نجيبها من fields
            if (cart.length === 0 && data.cart) {
              if (Array.isArray(data.cart)) {
                cart = data.cart;
              } else if (typeof data.cart === 'object') {
                cart = Object.values(data.cart);
              }
            }
            
            if (favorites.length === 0 && data.favorites) {
              if (Array.isArray(data.favorites)) {
                favorites = data.favorites;
              } else if (typeof data.favorites === 'object') {
                favorites = Object.values(data.favorites);
              }
            }
            
            const user = {
              uid: userDoc.id,
              email: data.email || '',
              name: data.name || 'مستخدم غير معروف',
              role: data.role || 'user',
              profileImageUrl: data.profileImageUrl || '',
              phoneNumber: data.phoneNumber || '',
              cart: cart,
              favorites: favorites,
              pharmacyId: data.pharmacyId,
              pharmacyName: data.pharmacyName,
              createdAt: data.createdAt?.toDate(),
              updatedAt: data.updatedAt?.toDate(),
              isActive: data.isActive !== undefined ? data.isActive : true
            } as User;
            
            console.log(`Final user ${data.name}:`, {
              uid: user.uid,
              name: user.name,
              email: user.email,
              cart: user.cart.length,
              favorites: user.favorites.length
            });
            
            return user;
          });

          const usersList = await Promise.all(usersPromises);
          // ترتيب المستخدمين أبجدياً بعد جلبهم
          usersList.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
          
          console.log('Total users loaded:', usersList.length);
          console.log('Users:', usersList);
          setUsers(usersList);
          setIsLoading(false);
        },
        (err) => {
          console.error('Error fetching users:', err);
          setError('فشل في تحميل المستخدمين');
          setIsLoading(false);
          toast.error('حدث خطأ أثناء تحميل بيانات المستخدمين');
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up users query:', err);
      setError('خطأ في إعداد الاستعلام');
      setIsLoading(false);
    }
  }, []);

  const deleteUser = async (userId: string) => {
    try {
      // حذف المستخدم من Firestore
      await deleteDoc(doc(db, 'users', userId));
      
      toast.success('تم حذف المستخدم بنجاح');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('فشل في حذف المستخدم');
      throw err;
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        isActive,
        updatedAt: new Date()
      });
      toast.success(isActive ? 'تم تفعيل المستخدم' : 'تم إيقاف المستخدم');
    } catch (err) {
      console.error('Error toggling user status:', err);
      toast.error('فشل في تغيير حالة المستخدم');
      throw err;
    }
  };

  return { 
    users, 
    isLoading, 
    error,
    deleteUser,
    toggleUserStatus
  };
}
