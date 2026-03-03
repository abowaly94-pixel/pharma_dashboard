import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { seedCategories } from '@/utils/seedCategories';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function SeedCategoriesButton() {
  const { user } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeed = async () => {
    if (!user?.uid) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    if (!window.confirm('هل تريد إضافة التصنيفات الافتراضية؟\n\nسيتم إضافة 10 تصنيفات شائعة للأدوية.')) {
      return;
    }

    setIsSeeding(true);
    try {
      await seedCategories(user.uid);
      toast.success('تم إضافة التصنيفات الافتراضية بنجاح! 🎉');
    } catch (error) {
      console.error('Error seeding categories:', error);
      toast.error('حدث خطأ أثناء إضافة التصنيفات');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Button
      onClick={handleSeed}
      disabled={isSeeding}
      variant="outline"
      size="sm"
      className="font-cairo"
    >
      {isSeeding ? (
        <>
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          جاري الإضافة...
        </>
      ) : (
        <>
          🌱 إضافة تصنيفات افتراضية
        </>
      )}
    </Button>
  );
}
