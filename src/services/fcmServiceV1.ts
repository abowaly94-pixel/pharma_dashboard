import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Send FCM Push Notification using V1 API with Service Account
 * This uses the new Firebase Cloud Messaging API (V1)
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
 * Get Service Account credentials from Firestore
 */
async function getServiceAccount(): Promise<any | null> {
  try {
    const settingsRef = doc(db, 'system_settings', 'fcm_config');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return data?.serviceAccount || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting service account:', error);
    return null;
  }
}

/**
 * Get OAuth2 access token using service account
 * Note: This is a simplified version. In production, use a backend service.
 */
async function getAccessToken(serviceAccount: any): Promise<string | null> {
  try {
    // For security reasons, this should be done on the backend
    // But for simplicity, we'll use a workaround

    // The user needs to manually get the access token from:
    // https://developers.google.com/oauthplayground/

    const settingsRef = doc(db, 'system_settings', 'fcm_config');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return data?.accessToken || null;
    }

    return null;
  } catch (error) {
    console.error('Error getting access token:', error);
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
    // Optimization: If no specific targets, get all tokens directly (Broadcast)
    if ((!targetRoles || targetRoles.length === 0) && (!targetUsers || targetUsers.length === 0)) {
      console.log('📢 Getting all FCM tokens for broadcast...');
      const tokensRef = collection(db, 'fcmTokens');
      const tokensSnapshot = await getDocs(tokensRef);
      console.log(`🔍 Found ${tokensSnapshot.size} total docs in fcmTokens`);
      const allTokens = tokensSnapshot.docs
        .map(doc => doc.data().token)
        .filter(token => !!token);
      console.log(`✅ Extracted ${allTokens.length} valid active tokens`);
      return allTokens;
    }

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
 * Send FCM notification using V1 API
 * 
 * IMPORTANT: This requires an OAuth2 access token
 * Get it from: https://developers.google.com/oauthplayground/
 * 
 * Steps:
 * 1. Go to OAuth 2.0 Playground
 * 2. Click settings (gear icon)
 * 3. Check "Use your own OAuth credentials"
 * 4. Enter your OAuth Client ID and Secret
 * 5. In Step 1, select "Firebase Cloud Messaging API v1"
 * 6. Click "Authorize APIs"
 * 7. In Step 2, click "Exchange authorization code for tokens"
 * 8. Copy the "Access token"
 * 9. Save it in Firestore: system_settings/fcm_config/accessToken
 */
export async function sendFCMPushNotificationV1(
  data: FCMNotificationData
): Promise<{ success: boolean; message: string; sentCount?: number; status?: number }> {
  console.log('🚀 Starting FCM send process...', data);
  try {
    // Get access token
    const accessToken = await getAccessToken(null);

    if (!accessToken) {
      return {
        success: false,
        message: 'Access Token غير موجود. يرجى إضافته في صفحة الإعدادات',
        status: 401
      };
    }

    // Get target tokens
    let tokens = await getTargetTokens(data.targetRoles, data.targetUsers);

    // Broadcast fallback: If sending to 'all' and no tokens found, use Topic
    let useTopic = false;
    if (tokens.length === 0 && (!data.targetRoles || data.targetRoles.length === 0) && (!data.targetUsers || data.targetUsers.length === 0)) {
      console.log('📢 No tokens found in DB. Falling back to Topic broadcast (/topics/all)...');
      useTopic = true;
    }

    if (tokens.length === 0 && !useTopic) {
      return {
        success: false,
        message: 'لا توجد FCM tokens للمستخدمين المستهدفين'
      };
    }

    console.log(useTopic ? 'Broadcasting to topic: all' : `Sending to ${tokens.length} devices using V1 API...`);

    // Project ID
    const projectId = 'pharmanow-754a7';

    // Helper to build message body
    const buildMessage = (target: { token?: string, topic?: string }) => ({
      message: {
        ...target,
        notification: {
          title: data.title,
          body: data.body,
          ...(data.imageUrl && { image: data.imageUrl })
        },
        data: {
          actionUrl: data.actionUrl || '/',
          timestamp: Date.now().toString()
        },
        webpush: {
          fcm_options: {
            link: data.actionUrl || '/'
          }
        },
        android: {
          priority: 'high',
          notification: {
            click_action: data.actionUrl || '/',
            icon: '/favicon.ico',
            color: '#4F46E5'
          }
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              sound: 'default',
              badge: 1
            }
          },
          fcm_options: {
            image: data.imageUrl
          }
        }
      }
    });

    if (useTopic) {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(buildMessage({ topic: 'all' }))
        }
      );

      if (response.ok) {
        return {
          success: true,
          message: 'تم إرسال حملة عامة لجميع الأجهزة المشتركة (Topic: all) ✓',
          sentCount: 1 // Representing the topic send
        };
      } else {
        const err = await response.json();
        return {
          success: false,
          message: 'فشل إرسال الحملة (غالباً Access Token منتهي)',
          status: response.status
        };
      }
    }

    // Send to each token
    let successCount = 0;
    let failureCount = 0;
    let lastStatus = 200;

    const sendPromises = tokens.map(async (token) => {
      try {
        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(buildMessage({ token }))
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          failureCount++;
          lastStatus = response.status;
          const errorData = await response.json();
          console.error(`Failed to send to token:`, errorData);
        }
      } catch (error) {
        failureCount++;
        console.error('Error sending to token:', error);
      }
    });

    await Promise.all(sendPromises);

    if (successCount === 0 && failureCount > 0) {
      return {
        success: false,
        message: 'فشل إرسال جميع الإشعارات (تأكد من الـ Access Token)',
        status: lastStatus
      };
    }

    return {
      success: true,
      message: `تم إرسال ${successCount} إشعار بنجاح${failureCount > 0 ? ` (فشل ${failureCount})` : ''}`,
      sentCount: successCount
    };
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in sendFCMPushNotificationV1:', error);
    return {
      success: false,
      message: `فشل تقني في الإرسال: ${error?.name || 'Error'} - ${error.message || 'خطأ غير معروف'}`,
      status: error?.status || 500
    };
  }
}

/**
 * Check if FCM V1 is configured
 */
export async function isFCMV1Configured(): Promise<boolean> {
  try {
    const settingsRef = doc(db, 'system_settings', 'fcm_config');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return !!data?.accessToken;
    }

    return false;
  } catch (error) {
    return false;
  }
}
