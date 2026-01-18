import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Send FCM Push Notification using FCM REST API
 * This works without Cloud Functions by calling FCM API directly
 */

interface FCMNotificationData {
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  targetRoles?: string[];
  targetUsers?: string[];
}

/**
 * Get FCM Server Key from Firestore (stored by admin)
 */
async function getFCMServerKey(): Promise<string | null> {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const settingsRef = doc(db, 'system_settings', 'fcm_config');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return data?.serverKey || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting FCM server key:', error);
    return null;
  }
}

/**
 * Get all FCM tokens for target users
 */
async function getTargetTokens(
  targetRoles?: string[],
  targetUsers?: string[]
): Promise<string[]> {
  try {
    const tokens: string[] = [];
    
    // Get target user IDs
    let targetUserIds: string[] = [];
    
    if (targetUsers && targetUsers.length > 0) {
      targetUserIds = targetUsers;
    } else if (targetRoles && targetRoles.length > 0) {
      // Get users by role
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', 'in', targetRoles));
      const usersSnapshot = await getDocs(q);
      targetUserIds = usersSnapshot.docs.map(doc => doc.id);
    } else {
      // Get all users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      targetUserIds = usersSnapshot.docs.map(doc => doc.id);
    }
    
    if (targetUserIds.length === 0) {
      return [];
    }
    
    // Get FCM tokens for these users (in batches of 10)
    const batchSize = 10;
    for (let i = 0; i < targetUserIds.length; i += batchSize) {
      const batch = targetUserIds.slice(i, i + batchSize);
      
      const tokensRef = collection(db, 'fcmTokens');
      const q = query(tokensRef, where('userId', 'in', batch));
      const tokensSnapshot = await getDocs(q);
      
      tokensSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.token) {
          tokens.push(data.token);
        }
      });
    }
    
    return tokens;
  } catch (error) {
    console.error('Error getting target tokens:', error);
    return [];
  }
}

/**
 * Send FCM notification using REST API
 * This is a workaround to send push notifications without Cloud Functions
 * 
 * Note: This requires FCM Server Key to be stored in Firestore
 * Admin should add it in Settings page
 */
export async function sendFCMPushNotification(
  data: FCMNotificationData
): Promise<{ success: boolean; message: string; sentCount?: number }> {
  try {
    // Get FCM Server Key
    const serverKey = await getFCMServerKey();
    
    if (!serverKey) {
      return {
        success: false,
        message: 'مفتاح FCM Server Key غير موجود. يرجى إضافته في صفحة الإعدادات'
      };
    }
    
    // Get target tokens
    const tokens = await getTargetTokens(data.targetRoles, data.targetUsers);
    
    if (tokens.length === 0) {
      return {
        success: false,
        message: 'لا توجد FCM tokens للمستخدمين المستهدفين'
      };
    }
    
    console.log(`Sending to ${tokens.length} devices...`);
    
    // Send to each token (FCM REST API doesn't support multicast in legacy API)
    let successCount = 0;
    let failureCount = 0;
    
    const sendPromises = tokens.map(async (token) => {
      try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${serverKey}`
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: data.title,
              body: data.body,
              ...(data.imageUrl && { image: data.imageUrl }),
              click_action: data.actionUrl || '/',
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            },
            data: {
              actionUrl: data.actionUrl || '/',
              timestamp: Date.now().toString()
            },
            priority: 'high'
          })
        });
        
        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
          console.error(`Failed to send to token: ${response.statusText}`);
        }
      } catch (error) {
        failureCount++;
        console.error('Error sending to token:', error);
      }
    });
    
    await Promise.all(sendPromises);
    
    return {
      success: true,
      message: `تم إرسال ${successCount} إشعار بنجاح${failureCount > 0 ? ` (فشل ${failureCount})` : ''}`,
      sentCount: successCount
    };
  } catch (error) {
    console.error('Error sending FCM push notification:', error);
    return {
      success: false,
      message: 'فشل إرسال الإشعار: ' + (error as Error).message
    };
  }
}

/**
 * Check if FCM Server Key is configured
 */
export async function isFCMConfigured(): Promise<boolean> {
  const serverKey = await getFCMServerKey();
  return !!serverKey;
}
