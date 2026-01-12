import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
  isPharmacist: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: Record<string, User & { password: string }> = {
  'admin@pharmanow.com': {
    uid: 'admin-001',
    email: 'admin@pharmanow.com',
    name: 'مدير النظام',
    profileImageUrl: '',
    cart: [],
    favorites: [],
    role: 'admin',
    password: 'admin123'
  },
  'pharmacy@pharmanow.com': {
    uid: 'pharm-001',
    email: 'pharmacy@pharmanow.com',
    name: 'صيدلية النادى',
    profileImageUrl: '',
    cart: [],
    favorites: [],
    role: 'pharmacist',
    pharmacyId: 827457,
    pharmacyName: 'ELNADA PHARMACY',
    password: 'pharmacy123'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('pharmanow_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const demoUser = demoUsers[email];
    if (demoUser && demoUser.password === password) {
      const { password: _, ...userWithoutPassword } = demoUser;
      setUser(userWithoutPassword);
      localStorage.setItem('pharmanow_user', JSON.stringify(userWithoutPassword));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pharmanow_user');
  };

  const isAdmin = user?.role === 'admin';
  const isPharmacist = user?.role === 'pharmacist';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, isPharmacist }}>
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
