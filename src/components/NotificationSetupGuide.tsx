import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Bell, Smartphone, Chrome, Globe } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';

export function NotificationSetupGuide() {
  const { requestPermission } = useNotifications();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-cairo">
          <Bell className="h-5 w-5" />
          تفعيل الإشعارات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h3 className="font-semibold font-cairo">لتفعيل الإشعارات وتمكين إرسالها إلى المستخدمين:</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Chrome className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium font-cairo">الخطوة 1: منح إذن الإشعارات</p>
                <p className="text-muted-foreground font-cairo">يجب أن يمنح كل مستخدم إذنًا لعرض الإشعارات في المتصفح</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium font-cairo">الخطوة 2: حفظ رمز FCM</p>
                <p className="text-muted-foreground font-cairo">يتم حفظ رمز FCM الخاص بكل مستخدم في قاعدة البيانات</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium font-cairo">الخطوة 3: إرسال الإشعارات</p>
                <p className="text-muted-foreground font-cairo">بمجرد التسجيل، يمكن إرسال الإشعارات إلى الأجهزة</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-cairo">
            <strong>ملاحظة:</strong> لا يمكن إرسال إشعارات إلى المستخدمين الذين لم يسجلوا أجهزتهم.
            بمجرد منح الإذن، سيتم حفظ رمز الجهاز تلقائيًا.
          </p>
        </div>

        <Button 
          onClick={requestPermission}
          className="w-full flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          تفعيل الإشعارات الآن
        </Button>
      </CardContent>
    </Card>
  );
}