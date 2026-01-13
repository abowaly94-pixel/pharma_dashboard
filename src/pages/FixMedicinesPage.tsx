import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Pill, Info } from 'lucide-react';
import { diagnoseAndFixMedicines, checkFirebaseConnection } from '@/lib/fixMedicinesIssue';
import { runDetailedDiagnosis } from '@/lib/detailedDiagnosis';

export default function FixMedicinesPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const [detailedResults, setDetailedResults] = useState<any>(null);

  const handleDetailedDiagnosis = async () => {
    setIsLoading(true);
    setResult(null);
    setDetailedResults(null);
    
    try {
      const diagnosis = await runDetailedDiagnosis();
      setDetailedResults(diagnosis);
      setConnectionStatus(diagnosis.firebaseConnection);
      
      if (diagnosis.medicinesCollection.count === 0) {
        setResult({
          success: false,
          message: 'مجموعة الأدوية فارغة - يحتاج إضافة بيانات',
          needsSeeding: true
        });
      } else if (diagnosis.possibleIssues.length > 0) {
        setResult({
          success: false,
          message: `تم العثور على ${diagnosis.possibleIssues.length} مشكلة محتملة`,
          issues: diagnosis.possibleIssues,
          recommendations: diagnosis.recommendations
        });
      } else {
        setResult({
          success: true,
          message: 'جميع الفحوصات تمت بنجاح - الأدوية يجب أن تظهر',
          medicinesCount: diagnosis.medicinesCollection.count
        });
      }
      
    } catch (error: any) {
      setResult({
        success: false,
        message: `حدث خطأ: ${error.message}`,
        error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnoseAndFix = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // أولاً اختبار الاتصال
      const isConnected = await checkFirebaseConnection();
      setConnectionStatus(isConnected);
      
      if (!isConnected) {
        setResult({
          success: false,
          message: 'فشل في الاتصال بـ Firebase. تحقق من إعدادات الشبكة.'
        });
        return;
      }
      
      // ثم تشخيص وإصلاح المشكلة
      const fixResult = await diagnoseAndFixMedicines();
      setResult(fixResult);
      
    } catch (error: any) {
      setResult({
        success: false,
        message: `حدث خطأ: ${error.message}`,
        error
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Pill className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              إصلاح مشكلة عدم ظهور الأدوية
            </CardTitle>
            <p className="text-gray-600 mt-2">
              هذه الأداة ستقوم بتشخيص وإصلاح مشكلة عدم ظهور الأدوية في التطبيق
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* حالة الاتصال */}
            {connectionStatus !== null && (
              <Alert className={connectionStatus ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {connectionStatus ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={connectionStatus ? "text-green-800" : "text-red-800"}>
                    {connectionStatus ? "✅ الاتصال بـ Firebase يعمل بشكل صحيح" : "❌ فشل في الاتصال بـ Firebase"}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* النتيجة */}
            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                    {result.message}
                    {result.medicinesAdded && (
                      <div className="mt-2 text-sm">
                        تم إضافة {result.medicinesAdded} أدوية تجريبية
                      </div>
                    )}
                    {result.medicinesCount && (
                      <div className="mt-2 text-sm">
                        عدد الأدوية الموجودة: {result.medicinesCount}
                      </div>
                    )}
                    {result.issues && (
                      <div className="mt-2 text-sm">
                        <strong>المشاكل:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {result.issues.map((issue: string, index: number) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.recommendations && (
                      <div className="mt-2 text-sm">
                        <strong>التوصيات:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {result.recommendations.map((rec: string, index: number) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* النتائج المفصلة */}
            {detailedResults && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    تقرير التشخيص المفصل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span>الاتصال بـ Firebase:</span>
                      <span className={detailedResults.firebaseConnection ? "text-green-600" : "text-red-600"}>
                        {detailedResults.firebaseConnection ? "✅ يعمل" : "❌ فشل"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>مجموعة الأدوية:</span>
                      <span className={detailedResults.medicinesCollection.exists ? "text-green-600" : "text-red-600"}>
                        {detailedResults.medicinesCollection.exists ? "✅ موجودة" : "❌ غير موجودة"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>عدد الأدوية:</span>
                      <span className="font-semibold">{detailedResults.medicinesCollection.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>استعلام orderBy:</span>
                      <span className={detailedResults.medicinesCollection.queryWithOrderBy ? "text-green-600" : "text-red-600"}>
                        {detailedResults.medicinesCollection.queryWithOrderBy ? "✅ يعمل" : "❌ فشل"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>استعلام pharmacyId:</span>
                      <span className={detailedResults.medicinesCollection.queryWithPharmacyId ? "text-green-600" : "text-red-600"}>
                        {detailedResults.medicinesCollection.queryWithPharmacyId ? "✅ يعمل" : "❌ فشل"}
                      </span>
                    </div>
                  </div>
                  
                  {detailedResults.medicinesCollection.documents.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">الأدوية الموجودة:</h4>
                      <div className="max-h-32 overflow-y-auto text-sm space-y-1">
                        {detailedResults.medicinesCollection.documents.map((doc: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span>{doc.name || 'بدون اسم'}</span>
                            <span className="text-xs text-gray-500">ID: {doc.id}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* أزرار التشخيص والإصلاح */}
            <div className="space-y-3">
              <Button
                onClick={handleDetailedDiagnosis}
                disabled={isLoading}
                size="lg"
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري التشخيص المفصل...
                  </>
                ) : (
                  <>
                    <Info className="w-4 h-4 ml-2" />
                    تشخيص مفصل للمشكلة
                  </>
                )}
              </Button>

              {result?.needsSeeding && (
                <Button
                  onClick={handleDiagnoseAndFix}
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري إضافة البيانات...
                    </>
                  ) : (
                    <>
                      <Pill className="w-4 h-4 ml-2" />
                      إضافة أدوية تجريبية
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* معلومات إضافية */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">ما تفعله هذه الأداة:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• تتحقق من الاتصال بقاعدة بيانات Firebase</li>
                <li>• تفحص مجموعة الأدوية في Firestore</li>
                <li>• تضيف أدوية تجريبية إذا كانت المجموعة فارغة</li>
                <li>• تعرض تقرير مفصل عن الحالة</li>
              </ul>
            </div>

            {/* تحذير */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">تنبيه مهم</h3>
              </div>
              <p className="text-sm text-yellow-700">
                هذه الأداة ستضيف بيانات تجريبية فقط. في البيئة الإنتاجية، يجب إضافة البيانات الحقيقية من خلال واجهة الإدارة.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}