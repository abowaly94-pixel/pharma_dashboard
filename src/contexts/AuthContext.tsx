import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isPharmacist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Persistent session handling
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user data from database
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser({
              ...userData,
              uid: firebaseUser.uid,
              email: firebaseUser.email || userData.email,
            });
          } else {
            // Fallback for users without a database record yet
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Unknown',
              role: 'user',
              profileImageUrl: firebaseUser.photoURL || '',
              cart: [],
              favorites: []
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user data immediately for redirection
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        
        // If user is a pharmacist, check pharmacy status
        if (userData.role === 'pharmacist') {
          const pharmacyDoc = await getDoc(doc(db, 'pharmacies', firebaseUser.uid));
          
          if (pharmacyDoc.exists()) {
            const pharmacyData = pharmacyDoc.data();
            const pharmacyStatus = pharmacyData.status;
            
            // Check if pharmacy is active
            if (pharmacyStatus !== 'active') {
              await signOut(auth);
              setIsLoading(false);
              throw new Error('الصيدلية غير مفعلة. يرجى التواصل مع الإدارة لتفعيل حسابك');
            }
            
            // Check if account is locked
            const lockedUntil = pharmacyData.lockedUntil;
            if (lockedUntil) {
              const lockTime = lockedUntil.toDate();
              const now = new Date();
              if (now < lockTime) {
                await signOut(auth);
                setIsLoading(false);
                throw new Error('تم قفل الحساب مؤقتاً. يرجى المحاولة بعد 15 دقيقة');
              }
            }
            
            // Reset failed login attempts on successful login
            await updateDoc(doc(db, 'pharmacies', firebaseUser.uid), {
              failedLoginAttempts: 0,
              lockedUntil: null,
            });
          }
        }
        
        const fullUser = {
          ...userData,
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData.email,
        };
        setUser(fullUser);
        setIsLoading(false);
        return fullUser;
      }

      const fallbackUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || 'Unknown',
        role: 'user',
        profileImageUrl: firebaseUser.photoURL || '',
        cart: [],
        favorites: []
      };
      setUser(fallbackUser);
      setIsLoading(false);
      return fallbackUser;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      
      // Re-throw the error so it can be caught in LoginPage
      if (error instanceof Error && error.message.includes('الصيدلية غير مفعلة')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('تم قفل الحساب')) {
        throw error;
      }
      
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          setUser({
            ...userData,
            uid: currentUser.uid,
            email: currentUser.email || userData.email,
          });
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  };

  const isAdmin = user?.role === 'admin';
  const isPharmacist = user?.role === 'pharmacist';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, isAdmin, isPharmacist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
