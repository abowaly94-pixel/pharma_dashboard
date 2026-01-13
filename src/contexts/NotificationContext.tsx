import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import {
  initializeMessaging,
  requestNotificationPermission,
  saveFCMToken,
  onMessageListener,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '@/lib/notifications';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'medicine' | 'user' | 'system' | 'general';
  targetUsers?: string[];
  targetRoles?: string[];
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: any;
  readAt?: any;
  sentBy?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Initialize FCM and request permission
  const requestPermission = async () => {
    try {
      await initializeMessaging();
      const token = await requestNotificationPermission();
      
      if (token && user) {
        setFcmToken(token);
        await saveFCMToken(user.uid, token);
        toast.success('تم تفعيل الإشعارات بنجاح');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('فشل تفعيل الإشعارات');
    }
  };

  // Listen for real-time notifications from Firestore
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe;

    const setupNotificationListener = async () => {
      try {
        // Query notifications for this user or their role
        const q = query(
          collection(db, 'notifications'),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const notificationsList: Notification[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filter notifications for this user
            const isForUser = 
              !data.targetUsers || 
              data.targetUsers.length === 0 || 
              data.targetUsers.includes(user.uid);
            
            const isForRole = 
              !data.targetRoles || 
              data.targetRoles.length === 0 || 
              data.targetRoles.includes(user.role);

            if (isForUser || isForRole) {
              notificationsList.push({
                id: doc.id,
                ...data
              } as Notification);
            }
          });

          setNotifications(notificationsList);
          setUnreadCount(notificationsList.filter(n => !n.read).length);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error setting up notification listener:', error);
        setIsLoading(false);
      }
    };

    setupNotificationListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // Listen for foreground FCM messages
  useEffect(() => {
    const setupForegroundListener = async () => {
      try {
        const payload = await onMessageListener();
        console.log('Foreground message received:', payload);
        
        // Show toast notification
        if (payload && typeof payload === 'object' && 'notification' in payload) {
          const notification = payload.notification as any;
          toast.info(notification.title, {
            description: notification.body
          });
        }
      } catch (error) {
        console.error('Error in foreground listener:', error);
      }
    };

    if (fcmToken) {
      setupForegroundListener();
    }
  }, [fcmToken]);

  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsAsRead(user.uid);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      toast.success('تم تعليم جميع الإشعارات كمقروءة');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('فشل تعليم الإشعارات كمقروءة');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        requestPermission
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
