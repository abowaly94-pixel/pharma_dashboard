import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import app from './firebase';

let messaging: Messaging | null = null;

// Initialize Firebase Cloud Messaging
export const initializeMessaging = async () => {
  try {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      messaging = getMessaging(app);
      return messaging;
    }
  } catch (error) {
    console.error('Error initializing messaging:', error);
  }
  return null;
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      if (!messaging) {
        await initializeMessaging();
      }
      
      if (messaging) {
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: 'YOUR_VAPID_KEY' // Replace with your VAPID key from Firebase Console
        });
        
        console.log('FCM Token:', token);
        return token;
      }
    } else {
      console.log('Notification permission denied.');
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
  
  return null;
};

// Save FCM token to Firestore
export const saveFCMToken = async (userId: string, token: string) => {
  try {
    await addDoc(collection(db, 'fcmTokens'), {
      userId,
      token,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Listen for foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log('Message received:', payload);
        resolve(payload);
      });
    }
  });

// Notification types
export interface NotificationData {
  title: string;
  body: string;
  type: 'order' | 'medicine' | 'user' | 'system' | 'general';
  targetUsers?: string[]; // User IDs to send to (empty = all users)
  targetRoles?: ('admin' | 'pharmacist' | 'user')[]; // Roles to send to
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

// Send notification (save to Firestore - backend will handle FCM)
export const sendNotification = async (notificationData: NotificationData) => {
  try {
    const notification = {
      ...notificationData,
      createdAt: serverTimestamp(),
      read: false,
      sentBy: 'admin' // You can pass the actual user ID
    };

    const docRef = await addDoc(collection(db, 'notifications'), notification);
    console.log('Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Get user notifications
export const getUserNotifications = async (userId: string, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('targetUsers', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Get notifications by role
export const getNotificationsByRole = async (role: string, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('targetRoles', 'array-contains', role),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching notifications by role:', error);
    return [];
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('targetUsers', 'array-contains', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, {
        read: true,
        readAt: serverTimestamp()
      })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('targetUsers', 'array-contains', userId),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};
