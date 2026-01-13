import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ResetDatabase() {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleReset = async () => {
    if (!confirm('⚠️ هل أنت متأكد؟ سيتم حذف جميع البيانات من Firestore (المستخدمين، الأدوية، الطلبات)')) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all users from Firestore
      const usersSnapshot = await getDocs(collection(db, 'users'));
      for (const userDoc of usersSnapshot.docs) {
        await deleteDoc(doc(db, 'users', userDoc.id));
      }
      console.log('✅ Deleted all users from Firestore');

      // Delete all medicines
      const medicinesSnapshot = await getDocs(collection(db, 'medicines'));
      for (const medicineDoc of medicinesSnapshot.docs) {
        await deleteDoc(doc(db, 'medicines', medicineDoc.id));
      }
      console.log('✅ Deleted all medicines');

      // Delete all orders
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      for (const orderDoc of ordersSnapshot.docs) {
        await deleteDoc(doc(db, 'orders', orderDoc.id));
      }
      console.log('✅ Deleted all orders');

      toast.success('تم حذف جميع البيانات بنجاح');
      
      // Redirect to seed page
      setTimeout(() => {
        navigate('/test');
      }, 1500);
    } catch (error) {
      console.error('Error resetting database:', error);
      toast.error('حدث خطأ أثناء حذف البيانات');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500/10 to-orange-500/10" dir="rtl">
      <div className="max-w-md w-full p-8 bg-card rounded-2xl shadow-2xl border border-red-200">
        <div className="text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold font-cairo mb-2 text-red-600">
              إعادة تعيين قاعدة البيانات
            </h1>
            <p className="text-muted-foreground font-cairo">
              سيتم حذف جميع البيانات من Firestore
            </p>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-right">
            <h3 className="font-bold font-cairo mb-2 text-red-700">⚠️ تحذير:</h3>
            <ul className="text-sm space-y-1 text-red-600">
              <li>• سيتم حذف جميع المستخدمين من Firestore</li>
              <li>• سيتم حذف جميع الأدوية</li>
              <li>• سيتم حذف جميع الطلبات</li>
            </ul>
          </div>

          {/* Note */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-right">
            <h3 className="font-bold font-cairo mb-2 text-yellow-700">📝 ملاحظة:</h3>
            <p className="text-sm text-yellow-600">
              يجب حذف المستخدمين من Firebase Authentication يدوياً من 
              <a 
                href="https://console.firebase.google.com/project/pharmanow-754a7/authentication/users"
                target="_blank"
                rel="noopener noreferrer"
                className="underline mx-1"
              >
                Firebase Console
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleReset}
              disabled={isDeleting}
              className="w-full font-cairo bg-red-600 hover:bg-red-700"
              size="lg"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 ml-2" />
                  حذف جميع البيانات
                </>
              )}
            </Button>

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
