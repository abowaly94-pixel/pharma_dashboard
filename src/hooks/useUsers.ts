import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { toast } from 'sonner';

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);

    // Professional Real-time listener for users collection
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            email: data.email || '',
            name: data.name || 'مستخدم غير معروف',
            role: data.role || 'user',
            profileImageUrl: data.profileImageUrl || '',
            cart: data.cart || [],
            favorites: data.favorites || [],
            ...data
          } as User;
        });

        setUsers(usersList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users');
        setIsLoading(false);
        toast.error('حدث خطأ أثناء تحميل بيانات المستخدمين');
      }
    );

    return () => unsubscribe();
  }, []);

  const updateUserRole = async (userId: string, role: User['role']) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role });
      toast.success('تم تحديث دور المستخدم بنجاح');
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('فشل في تحديث دور المستخدم');
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast.success('تم حذف المستخدم بنجاح');
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('فشل في حذف المستخدم');
    }
  };

  return { users, isLoading, error, setUsers, updateUserRole, deleteUser };
}
