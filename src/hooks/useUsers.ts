import { useState, useEffect } from 'react';
import { User } from '@/types';

// Demo users based on Firebase structure
const demoUsers: User[] = [
  {
    uid: '2f6bUt5bRggbtgKSMqSdLPzwuH53',
    email: 'shalaby.vbs@gmail.com',
    name: 'Ahmed Shalaby',
    profileImageUrl: 'https://lh3.googleusercontent.com/a/ACg8ocJTSsdBfjc4Ck5b_gOAydbfAFmrUv/zeq5=s96-c',
    cart: [],
    favorites: [],
    role: 'user'
  },
  {
    uid: 'QZkcWaLoRGMA18BL92TqxX5Zp222',
    email: 'waly20691@gmail.com',
    name: 'Abdo Waly',
    profileImageUrl: '',
    cart: [],
    favorites: [],
    role: 'user'
  },
  {
    uid: 'admin-001',
    email: 'admin@pharmanow.com',
    name: 'مدير النظام',
    profileImageUrl: '',
    cart: [],
    favorites: [],
    role: 'admin'
  },
  {
    uid: 'pharm-001',
    email: 'pharmacy@pharmanow.com',
    name: 'صيدلية النادى',
    profileImageUrl: '',
    cart: [],
    favorites: [],
    role: 'pharmacist',
    pharmacyId: 827457,
    pharmacyName: 'ELNADA PHARMACY'
  },
  {
    uid: 'user-005',
    email: 'mohamed@gmail.com',
    name: 'Mohamed Ali',
    profileImageUrl: '',
    cart: [],
    favorites: [],
    role: 'user'
  }
];

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        setUsers(demoUsers);
      } catch (err) {
        setError('Failed to fetch users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { users, isLoading, error, setUsers };
}
