import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seedFirebaseDatabase } from '@/lib/seedFirebase';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AutoSeedPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('جاري إنشاء الحسابات...');
  const navigate = useNavigate();

  useEffect(() => {
    const runSeed = async () => {
      try {
        setMessage('جاري الاتصال بـ Firebase...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setMessage('جاري إنشاء الحسابات...');
        await seedFirebaseDatabase();
        
        setMessage('تم إنشاء الحسابات بنجاح! ✅');
        setStatus('success');
      } catch (error: any) {
        console.error('Error:', error);
        setMessage(`حدث خطأ: ${error.message}`);
        setStatus('error');
      }
    };

    runSeed();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10" dir="rtl">
      <div className="max-w-md w-full p-8 bg-card rounded-2xl shadow-2xl border">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-primary animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-500" />
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold font-cairo mb-2">
              {status === 'loading' && 'إنشاء الحسابات'}
              {status === 'success' && 'تم بنجاح! 🎉'}
              {status === 'error' && 'حدث خطأ'}
            </h1>
            <p className="text-muted-foreground font-cairo">{message}</p>
          </div>

          {/* Details */}
          {status === 'success' && (
            <div className="bg-muted p-4 rounded-lg text-right space-y-2">
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-3">
                <p className="text-sm text-yellow-700 font-cairo">
                  ⚠️ هذه بيانات تجريبية للاختبار فقط. في الإنتاج، سيتم عرض البيانات الحقيقية من Firebase.
                </p>
              </div>
              
              <h3 className="font-bold font-cairo mb-3">بيانات تسجيل الدخول:</h3>
              
              <div className="space-y-3">
                <div className="bg-background p-3 rounded border">
                  <p className="text-sm text-muted-foreground">Admin</p>
                  <p className="font-mono text-sm">admin@test.com</p>
                  <p className="font-mono text-sm">123456</p>
                </div>

                <div className="bg-background p-3 rounded border">
                  <p className="text-sm text-muted-foreground">Pharmacist</p>
                  <p className="font-mono text-sm">pharmacist@test.com</p>
                  <p className="font-mono text-sm">123456</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {status === 'success' && (
              <Button
                onClick={() => navigate('/login')}
                className="w-full font-cairo"
                size="lg"
              >
                اذهب لتسجيل الدخول
              </Button>
            )}

            {status === 'error' && (
              <Button
                onClick={() => window.location.reload()}
                className="w-full font-cairo"
                size="lg"
                variant="destructive"
              >
                حاول مرة أخرى
              </Button>
            )}

            {status === 'loading' && (
              <p className="text-sm text-muted-foreground">
                الرجاء الانتظار...
              </p>
            )}
          </div>

          {/* Info */}
          {status === 'success' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>✅ تم إنشاء 3 حسابات تجريبية</p>
              <p>✅ تم إنشاء 2 صيدلية تجريبية</p>
              <p>✅ تم إنشاء 3 أدوية تجريبية</p>
              <p>✅ تم إنشاء 2 طلب تجريبي</p>
              <p className="text-yellow-600 mt-2">⚠️ بيانات تجريبية للاختبار فقط</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
