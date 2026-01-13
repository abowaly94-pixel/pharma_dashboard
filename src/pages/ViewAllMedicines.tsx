import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pill, Package, Star, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Medicine {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  quantity: number;
  pharmacyId: number;
  pharmacyName: string;
  pharmcyAddress: string;
  category: string;
  manufacturer: string;
  avgRating: number;
  ratingCount: number;
  discountRating: number;
  isNewProduct: boolean;
  sellingCount: number;
  subabaseORImageUrl: string;
  subabaseImageUrl?: string;
  createdAt?: any;
}

export default function ViewAllMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        console.log('🔍 جاري جلب جميع الأدوية من Firebase...');
        const medicinesRef = collection(db, 'medicines');
        const snapshot = await getDocs(medicinesRef);
        
        console.log(`📊 تم العثور على ${snapshot.size} دواء`);
        
        const medicinesList: Medicine[] = [];
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`- ${data.name || 'بدون اسم'} (ID: ${doc.id})`);
          
          medicinesList.push({
            id: doc.id,
            name: data.name || 'دواء غير معروف',
            code: data.code || '',
            description: data.description || '',
            price: data.price || 0,
            quantity: data.quantity || 0,
            pharmacyId: data.pharmacyId || 0,
            pharmacyName: data.pharmacyName || '',
            pharmcyAddress: data.pharmcyAddress || '',
            category: data.category || '',
            manufacturer: data.manufacturer || '',
            avgRating: data.avgRating || 0,
            ratingCount: data.ratingCount || 0,
            discountRating: data.discountRating || 0,
            isNewProduct: data.isNewProduct || false,
            sellingCount: data.sellingCount || 0,
            subabaseORImageUrl: data.subabaseORImageUrl || 'https://via.placeholder.com/150',
            subabaseImageUrl: data.subabaseImageUrl,
            createdAt: data.createdAt
          });
        });
        
        // ترتيب حسب التاريخ
        medicinesList.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB.getTime() - dateA.getTime();
        });
        
        setMedicines(medicinesList);
        setIsLoading(false);
        
      } catch (err: any) {
        console.error('❌ خطأ في جلب الأدوية:', err);
        setError(`فشل في جلب الأدوية: ${err.message}`);
        setIsLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">جاري تحميل الأدوية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Pill className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">جميع الأدوية</h1>
          <p className="text-gray-600">عرض شامل لجميع الأدوية الموجودة في قاعدة البيانات</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">{medicines.length}</div>
              <div className="text-sm text-gray-600">إجمالي الأدوية</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">
                {medicines.length > 0 ? (medicines.reduce((sum, med) => sum + med.avgRating, 0) / medicines.length).toFixed(1) : '0'}
              </div>
              <div className="text-sm text-gray-600">متوسط التقييم</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-800">
                {new Set(medicines.map(med => med.pharmacyId)).size}
              </div>
              <div className="text-sm text-gray-600">عدد الصيدليات</div>
            </CardContent>
          </Card>
        </div>

        {/* Error */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Medicines Grid */}
        {medicines.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد أدوية</h3>
              <p className="text-gray-500">لم يتم العثور على أي أدوية في قاعدة البيانات</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {medicines.map((medicine) => (
              <Card key={medicine.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg font-bold text-gray-800 line-clamp-1">
                      {medicine.name}
                    </CardTitle>
                    {medicine.isNewProduct && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        جديد
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">كود: {medicine.code}</div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Image */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                    {(medicine.subabaseORImageUrl || medicine.subabaseImageUrl) ? (
                      <img 
                        src={medicine.subabaseORImageUrl || medicine.subabaseImageUrl}
                        alt={medicine.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                                </svg>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {medicine.description}
                  </p>

                  {/* Price & Quantity */}
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-bold text-blue-600">
                      {medicine.price} ج.م
                      {medicine.discountRating > 0 && (
                        <span className="text-xs text-green-600 mr-1">
                          (-{medicine.discountRating}%)
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      الكمية: {medicine.quantity}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium mr-1">
                        {medicine.avgRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      ({medicine.ratingCount} تقييم)
                    </span>
                  </div>

                  {/* Category & Manufacturer */}
                  <div className="space-y-1">
                    {medicine.category && (
                      <Badge variant="outline" className="text-xs">
                        {medicine.category}
                      </Badge>
                    )}
                    {medicine.manufacturer && (
                      <div className="text-xs text-gray-500">
                        الشركة: {medicine.manufacturer}
                      </div>
                    )}
                  </div>

                  {/* Pharmacy Info */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-700">
                          {medicine.pharmacyName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {medicine.pharmcyAddress}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sales Info */}
                  <div className="text-xs text-gray-500 text-center">
                    تم بيع {medicine.sellingCount} مرة
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}