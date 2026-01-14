import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SyncUsers() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
    console.log(message);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setLogs([]);

    try {
      addLog('بدء عملية المزامنة...');

      // قائمة المستخدمين المتوقعين
      const expectedUsers = [
        {
          email: 'admin@test.com',
          password: '123456',
          name: 'مدير النظام',
          role: 'admin',
          pharmacyId: 1,
          pharmacyName: 'صيدلية النخيل'
        },
        {
          email: 'pharmacist@test.com',
          password: '123456',
          name: 'الصيدلي',
          role: 'pharmacist',
          pharmacyId: 1,
          pharmacyName: 'صيدلية النخيل'
        },
        {
          email: 'user@test.com',
          password: '123456',
          name: 'عميل تجريبي',
          role: 'user',
          pharmacyId: 1,
          pharmacyName: 'صيدلية النخيل'
        }
      ];

      // مزامنة كل مستخدم
      for (const user of expectedUsers) {
        try {
          addLog(`\nمعالجة: ${user.email}`);
          
          // محاولة تسجيل الدخول للحصول على UID
          const userCredential = await signInWithEmailAndPassword(auth, user.email, user.password);
          const uid = userCredential.user.uid;
          
          addLog(`تم العثور على UID: ${uid.substring(0, 8)}...`);

          // التحقق من وجود البيانات في Firestore
          const userDocRef = doc(db, 'users', uid);
          
          // حفظ/تحديث البيانات في Firestore
          await setDoc(userDocRef, {
            uid: uid,
            email: user.email,
            name: user.name,
            role: user.role,
            pharmacyId: user.pharmacyId,
            pharmacyName: user.pharmacyName,
            profileImageUrl: '',
            cart: [],
            favorites: [],
            updatedAt: new Date()
          }, { merge: true });

          addLog(`تم تحديث بيانات ${user.name} في Firestore`);
          
          // تسجيل الخروج
          await signOut(auth);
          
        } catch (error: any) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            addLog(`المستخدم ${user.email} غير موجود في Firebase Auth`);
          } else {
            addLog(`خطأ في ${user.email}: ${error.message}`);
          }
        }
      }

      addLog('\nاكتملت عملية المزامنة');
      toast.success('تم مزامنة المستخدمين بنجاح');

    } catch (error: any) {
      addLog(`\nخطأ عام: ${error.message}`);
      toast.error('حدث خطأ أثناء المزامنة');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4" dir="rtl">
      <div className="max-w-2xl w-full p-8 bg-card rounded-2xl shadow-2xl border">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold font-cairo mb-2">
              مزامنة المستخدمين
            </h1>
            <p className="text-muted-foreground font-cairo">
              ربط حسابات Firebase Auth مع Firestore بدون حذف
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-right">
            <h3 className="font-bold font-cairo mb-2 text-blue-700">ماذا تفعل هذه الصفحة؟</h3>
            <ul className="text-sm space-y-1 text-blue-600">
              <li>• تسجيل دخول لكل مستخدم للحصول على UID الصحيح</li>
              <li>• حفظ/تحديث بيانات المستخدم في Firestore</li>
              <li>• لا يتم حذف أي بيانات موجودة</li>
            </ul>
          </div>

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
              <h3 className="font-bold font-cairo mb-3">سجل العمليات:</h3>
              <div className="font-mono text-xs space-y-1 text-right" dir="ltr">
                {logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full font-cairo bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري المزامنة...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 ml-2" />
                  بدء المزامنة
                </>
              )}
            </Button>

            {logs.length > 0 && !isSyncing && (
              <Button
                onClick={() => navigate('/login')}
                className="w-full font-cairo"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 ml-2" />
                اذهب لتسجيل الدخول
              </Button>
            )}

            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full font-cairo"
              size="lg"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
