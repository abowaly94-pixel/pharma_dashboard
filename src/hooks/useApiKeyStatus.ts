import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ApiKeyStatus {
  isValid: boolean;
  remainingCalls?: number;
  error?: string;
  isLoading: boolean;
}

export function useApiKeyStatus() {
  const [status, setStatus] = useState<ApiKeyStatus>({
    isValid: false,
    isLoading: true,
  });

  const checkApiKeyStatus = async () => {
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
        });
        return;
      }

      const data = apiKeysDoc.data();
      const apiKey = data.removeBgApiKey;

      if (!apiKey || !apiKey.trim()) {
        setStatus({
          isValid: false,
          error: 'مفتاح API فارغ',
          isLoading: false,
        });
        return;
      }

      // Test API key
      const response = await fetch('https://api.remove.bg/v1.0/account', {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey.trim(),
        },
      });

      if (response.ok) {
        const accountData = await response.json();
        const remainingCalls = accountData.attributes?.api?.free_calls_remaining || 0;
        
        setStatus({
          isValid: true,
          remainingCalls,
          isLoading: false,
        });
      } else {
        setStatus({
          isValid: false,
          error: 'مفتاح API غير صحيح أو منتهي الصلاحية',
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error checking API key status:', error);
      setStatus({
        isValid: false,
        error: 'فشل في فحص حالة مفتاح API',
        isLoading: false,
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