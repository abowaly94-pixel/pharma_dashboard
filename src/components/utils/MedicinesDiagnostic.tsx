import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Pill, RefreshCw } from 'lucide-react';
import { runDetailedDiagnosis } from '@/lib/detailedDiagnosis';
import { diagnoseAndFixMedicines } from '@/lib/fixMedicinesIssue';

interface MedicinesDiagnosticProps {
  onMedicinesAdded?: () => void;
}

export function MedicinesDiagnostic({ onMedicinesAdded }: MedicinesDiagnosticProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleQuickDiagnosis = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const diagnosis = await runDetailedDiagnosis();
      
      if (diagnosis.medicinesCollection.count === 0) {
        setResult({
          type: 'empty',
          message: 'قاعدة البيانات فارغة - لا توجد أدوية',
          canFix: true,
          diagnosis
        });
      } else if (diagnosis.possibleIssues.length > 0) {
        setResult({
          type: 'issues',
          message: `تم العثور على ${diagnosis.possibleIssues.length} مشكلة`,
          issues: diagnosis.possibleIssues,
          recommendations: diagnosis.recommendations,
          diagnosis
        });
      } else {
        setResult({
          type: 'success',
          message: `تم العثور على ${diagnosis.medicinesCollection.count} دواء - كل شيء يعمل بشكل صحيح`,
          diagnosis
        });
      }
      
    } catch (error: any) {
      setResult({
        type: 'error',
        message: `خطأ في التشخيص: ${error.message}`,
        error
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSampleMedicines = async () => {
    setIsLoading(true);
    
    try {
      const fixResult = await diagnoseAndFixMedicines();
      
      if (fixResult.success) {
        setResult({
          type: 'fixed',
          message: `تم إضافة ${fixResult.medicinesAdded || 0} أدوية تجريبية بنجاح`,
          medicinesAdded: fixResult.medicinesAdded
        });
        
        // إشعار المكون الأب بأن الأدوية تم إضافتها
        if (onMedicinesAdded) {
          setTimeout(onMedicinesAdded, 1000);
        }
      } else {
        setResult({
          type: 'error',
          message: fixResult.message || 'فشل في إضافة الأدوية'
        });
      }
      
    } catch (error: any) {
      setResult({
        type: 'error',
        message: `خطأ: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Pill className="w-5 h-5 text-blue-600" />
          تشخيص سريع للأدوية
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* أزرار التشخيص */}
        <div className="flex gap-2">
          <Button
            onClick={handleQuickDiagnosis}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 ml-2" />
            )}
            فحص سريع
          </Button>
          
          {result?.canFix && (
            <Button
              onClick={handleAddSampleMedicines}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Pill className="w-4 h-4 ml-2" />
              )}
              إضافة أدوية تجريبية
            </Button>
          )}
        </div>

        {/* النتائج */}
        {result && (
          <Alert className={
            result.type === 'success' || result.type === 'fixed' 
              ? "border-green-200 bg-green-50" 
              : result.type === 'error' 
              ? "border-red-200 bg-red-50"
              : "border-yellow-200 bg-yellow-50"
          }>
            <div className="flex items-center gap-2">
              {result.type === 'success' || result.type === 'fixed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-yellow-600" />
              )}
              <AlertDescription className={
                result.type === 'success' || result.type === 'fixed' 
                  ? "text-green-800" 
                  : result.type === 'error'
                  ? "text-red-800"
                  : "text-yellow-800"
              }>
                {result.message}
                
                {result.issues && (
                  <div className="mt-2 text-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                      className="p-0 h-auto text-xs"
                    >
                      {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </Button>
                  </div>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* التفاصيل المفصلة */}
        {showDetails && result?.diagnosis && (
          <div className="text-sm space-y-2 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>الاتصال: {result.diagnosis.firebaseConnection ? '✅' : '❌'}</div>
              <div>عدد الأدوية: {result.diagnosis.medicinesCollection.count}</div>
              <div>استعلام orderBy: {result.diagnosis.medicinesCollection.queryWithOrderBy ? '✅' : '❌'}</div>
              <div>استعلام pharmacyId: {result.diagnosis.medicinesCollection.queryWithPharmacyId ? '✅' : '❌'}</div>
            </div>
            
            {result.recommendations && (
              <div className="mt-2">
                <strong>التوصيات:</strong>
                <ul className="list-disc list-inside mt-1 text-xs">
                  {result.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* روابط مفيدة */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 للمزيد من التشخيص: <a href="/fix-medicines" className="text-blue-600 hover:underline">صفحة التشخيص المفصل</a></div>
          <div>🌱 لإضافة بيانات شاملة: <a href="/seed" className="text-blue-600 hover:underline">صفحة البذر</a></div>
        </div>
      </CardContent>
    </Card>
  );
}