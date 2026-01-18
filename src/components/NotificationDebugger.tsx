import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function NotificationDebugger() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({
    hasPermission: false,
    fcmToken: null as string | null,
    tokenInDb: false,
    totalTokens: 0,
    userTokens: [] as any[],
    loading: true
  });

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    setDebugInfo(prev => ({ ...prev, loading: true }));

    // Check notification permission
    const hasPermission = 'Notification' in window && Notification.permission === 'granted';
    
    // Check FCM token
    let fcmToken: string | null = null;
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      // We can't directly check the FCM token without initializing messaging
      // So we'll check if it's stored in localStorage or sessionStorage
      fcmToken = localStorage.getItem('fcm_token') || sessionStorage.getItem('fcm_token') || null;
    }
    
    // Check if user has tokens in DB
    let tokenInDb = false;
    let userTokens = [];
    let totalTokens = 0;
    
    if (user) {
      try {
        // Get user's tokens
        const userTokensRef = collection(db, 'fcmTokens');
        const userQuery = query(userTokensRef, where('userId', '==', user.uid));
        const userSnapshot = await getDocs(userQuery);
        userTokens = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        tokenInDb = userSnapshot.size > 0;
        
        // Get total tokens
        const allTokensSnapshot = await getDocs(collection(db, 'fcmTokens'));
        totalTokens = allTokensSnapshot.size;
      } catch (error) {
        console.error('Error checking tokens:', error);
      }
    }

    setDebugInfo({
      hasPermission,
      fcmToken,
      tokenInDb,
      totalTokens,
      userTokens,
      loading: false
    });
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-500' : 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-cairo">مُعدِّل الإشعارات</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {debugInfo.loading ? (
          <p className="text-center font-cairo">جاري التحقق...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold font-cairo mb-2">صلاحيات الإشعارات</h3>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(debugInfo.hasPermission)} text-white`}>
                    {debugInfo.hasPermission ? 'ممنوحة' : 'غير ممنوحة'}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-cairo">
                    {debugInfo.hasPermission ? 'المتصفح يسمح بالإشعارات' : 'المستخدم لم يمنح إذن الإشعارات'}
                  </span>
                </div>
              </div>

              <div className="border rounded-lg p-3">
                <h3 className="font-semibold font-cairo mb-2">حالة رمز FCM</h3>
                <div className="flex items-center gap-2">
                  <Badge className={`${getStatusColor(!!debugInfo.tokenInDb)} text-white`}>
                    {debugInfo.tokenInDb ? 'مسجل' : 'غير مسجل'}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-cairo">
                    {debugInfo.tokenInDb ? 'الرمز محفوظ في قاعدة البيانات' : 'الرمز غير محفوظ'}
                  </span>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h3 className="font-semibold font-cairo mb-2">إحصائيات الرموز</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-cairo">إجمالي الرموز في النظام</p>
                  <p className="text-lg font-bold">{debugInfo.totalTokens}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-cairo">رموز المستخدم الحالي</p>
                  <p className="text-lg font-bold">{debugInfo.userTokens.length}</p>
                </div>
              </div>
            </div>

            {debugInfo.userTokens.length > 0 && (
              <div className="border rounded-lg p-3">
                <h3 className="font-semibold font-cairo mb-2">رموز FCM للمستخدم</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {debugInfo.userTokens.map((token, index) => (
                    <div key={index} className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {token.token?.substring(0, 30)}... (تم التحديث: {token.updatedAt?.toDate ? token.updatedAt.toDate().toLocaleString() : 'N/A'})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-cairo">
                <strong>تلميح:</strong> إذا كان الرمز غير مسجل، يجب على المستخدم تفعيل الإشعارات أولاً.
                انقر على زر "تفعيل الإشعارات" في الزاوية العلوية أو انقر على الزر أدناه.
              </p>
            </div>

            <Button 
              onClick={checkNotificationStatus}
              variant="outline"
              className="w-full"
            >
              تحديث الحالة
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}