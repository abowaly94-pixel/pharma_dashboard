import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, ExternalLink } from 'lucide-react';
import { useApiKeyStatus } from '@/hooks/useApiKeyStatus';
import { Link } from 'react-router-dom';

export function ApiKeyAlert() {
  const { isValid, remainingCalls, error, isLoading } = useApiKeyStatus();

  // Don't show anything while loading
  if (isLoading) {
    return null;
  }

  // Show warning if API key is invalid or missing
  if (!isValid) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-cairo font-medium text-orange-800">
              تحذير: مفتاح Remove.bg API غير متوفر
            </p>
            <p className="text-sm text-orange-700 mt-1">
              {error || 'لن تتمكن من استخدام ميزة إزالة خلفية الصور'}
            </p>
          </div>
          <Link to="/admin/settings">
            <Button variant="outline" size="sm" className="font-cairo">
              <Key className="w-4 h-4 ml-2" />
              إضافة مفتاح API
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if remaining calls are low
  if (typeof remainingCalls === 'number' && remainingCalls <= 10) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <p className="font-cairo font-medium text-yellow-800">
              تنبيه: الحصة المجانية قاربت على الانتهاء
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              متبقي {remainingCalls} صورة فقط هذا الشهر
            </p>
          </div>
          <div className="flex gap-2">
            <a 
              href="https://www.remove.bg/api" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="font-cairo">
                <ExternalLink className="w-4 h-4 ml-2" />
                حساب جديد
              </Button>
            </a>
            <Link to="/admin/settings">
              <Button variant="outline" size="sm" className="font-cairo">
                <Key className="w-4 h-4 ml-2" />
                تحديث المفتاح
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Don't show anything if everything is fine
  return null;
}