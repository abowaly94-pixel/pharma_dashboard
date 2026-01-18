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
        // Get VAPID key from environment variable
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
          console.error('VAPID key not found in environment variables');
          return null;
        }

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: vapidKey
        });

        console.log('FCM Token:', token);

        // Subscribe to 'all' topic for broadcasting (simplified mock for web)
        // In mobile apps, this is native. In Web, we'll track 'all' membership in Firestore
        // or use the Topic subscription API if available.
        try {
          // You would typically call a backend function here to subscribe the token to '/topics/all'
          // For now, we'll mark the token in Firestore as a subscriber
        } catch (e) {
          console.error('Topic subscription failed:', e);
        }

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

// Save FCM token to Firestore (prevents duplicates)
export const saveFCMToken = async (userId: string, token: string) => {
  try {
    // Check if token already exists for this user
    const tokensRef = collection(db, 'fcmTokens');
    const q = query(tokensRef, where('userId', '==', userId), where('token', '==', token));
    const querySnapshot = await getDocs(q);

    const tokenData = {
      userId,
      token,
      platform: 'web', // Platform identifier for Web App
      deviceId: navigator.userAgent, // Browser user agent as device ID
      appVersion: '1.0.0', // App version
      updatedAt: serverTimestamp(),
      lastUsed: serverTimestamp()
    };

    if (querySnapshot.empty) {
      // Token doesn't exist, add it
      await addDoc(tokensRef, {
        ...tokenData,
        createdAt: serverTimestamp()
      });
      console.log('FCM token saved successfully');
    } else {
      // Token exists, update timestamp
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, tokenData);
      console.log('FCM token updated successfully');
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
  }
};

// Listen for foreground messages (continuous listener)
export const onMessageListener = () => {
  return new Promise((resolve, reject) => {
    if (!messaging) {
      reject(new Error('Messaging not initialized'));
      return;
    }

    // Set up continuous listener
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      resolve(payload);

      // Show browser notification if permission granted
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'إشعار جديد', {
          body: payload.notification.body || '',
          icon: payload.notification.icon || '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'fcm-notification',
          requireInteraction: false
        });
      }
    });

    // Return unsubscribe function
    return unsubscribe;
  });
};

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

// Delete a single notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    console.log('Notification deleted:', notificationId);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications
export const deleteAllNotifications = async (): Promise<number> => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const q = query(collection(db, 'notifications'));
    const querySnapshot = await getDocs(q);

    let deletedCount = 0;
    const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
      await deleteDoc(docSnapshot.ref);
      deletedCount++;
    });

    await Promise.all(deletePromises);
    console.log(`Deleted ${deletedCount} notifications`);
    return deletedCount;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Get notification statistics
export const getNotificationStats = async (): Promise<{
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
}> => {
  try {
    const q = query(collection(db, 'notifications'));
    const querySnapshot = await getDocs(q);

    let total = 0;
    let unread = 0;
    let read = 0;
    const byType: Record<string, number> = {};

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      total++;

      if (data.read) {
        read++;
      } else {
        unread++;
      }

      const type = data.type || 'general';
      byType[type] = (byType[type] || 0) + 1;
    });

    return { total, unread, read, byType };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return { total: 0, unread: 0, read: 0, byType: {} };
  }
};
