import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ApiKeyStatus {
  isValid: boolean;
  remainingCalls?: number;
  error?: string;
  isLoading: boolean;
  lastChecked?: Date;
}

const API_CHECK_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

export function useApiKeyStatus() {
  const [status, setStatus] = useState<ApiKeyStatus>({
    isValid: false,
    isLoading: true,
  });

  const checkApiKeyStatus = async (retryCount = 0) => {
    try {
      setStatus(prev => ({ ...prev, isLoading: true }));
      
      // Get API key from database
      const apiKeysRef = doc(db, 'system_settings', 'api_keys');
      const apiKeysDoc = await getDoc(apiKeysRef);
      
      if (!apiKeysDoc.exists()) {
        setStatus({
          isValid: false,
          error: 'لم يتم تعيين مفتاح API',
          isLoading: false,
          lastChecked: new Date(),
        });
        return;
      }

      const data = apiKeysDoc.data();
      const apiKey = data?.removeBgApiKey;

      if (!apiKey || !apiKey.trim()) {
        setStatus({
          isValid: false,
          error: 'مفتاح API فارغ',
          isLoading: false,
          lastChecked: new Date(),
        });
        return;
      }

      // Test API key with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CHECK_TIMEOUT);

      try {
        const response = await fetch('https://api.remove.bg/v1.0/account', {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey.trim(),
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const accountData = await response.json();
          const remainingCalls = accountData.attributes?.api?.free_calls_remaining ?? 0;
          
          setStatus({
            isValid: true,
            remainingCalls,
            isLoading: false,
            lastChecked: new Date(),
          });
        } else {
          if (retryCount < MAX_RETRIES) {
            setTimeout(() => checkApiKeyStatus(retryCount + 1), 2000);
            return;
          }

          setStatus({
            isValid: false,
            error: 'مفتاح API غير صحيح أو منتهي الصلاحية',
            isLoading: false,
            lastChecked: new Date(),
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (retryCount < MAX_RETRIES) {
          setTimeout(() => checkApiKeyStatus(retryCount + 1), 2000);
          return;
        }

        setStatus({
          isValid: false,
          error: 'فشل الاتصال بخادم Remove.bg',
          isLoading: false,
          lastChecked: new Date(),
        });
      }
    } catch (err) {
      setStatus({
        isValid: false,
        error: 'فشل في فحص حالة مفتاح API',
        isLoading: false,
        lastChecked: new Date(),
      });
    }
  };

  useEffect(() => {
    checkApiKeyStatus();
  }, []);

  return {
    ...status,
    refresh: checkApiKeyStatus,
  };
}