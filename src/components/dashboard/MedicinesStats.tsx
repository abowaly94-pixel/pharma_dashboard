import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Package, TrendingUp, AlertTriangle } from 'lucide-react';

interface MedicineStats {
  total: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

export function MedicinesStats() {
  const [stats, setStats] = useState<MedicineStats>({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const medicinesRef = collection(db, 'medicines');
        const snapshot = await getDocs(medicinesRef);
        
        let total = 0;
        let lowStock = 0;
        let outOfStock = 0;
        let totalValue = 0;
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          total++;
          
          const quantity = data.quantity || 0;
          const price = data.price || 0;
          
          if (quantity === 0) {
            outOfStock++;
          } else if (quantity < 10) {
            lowStock++;
          }
          
          totalValue += price * quantity;
        });
        
        setStats({
          total,
          lowStock,
          outOfStock,
          totalValue
        });
        
      } catch (error) {
        console.error('خطأ في جلب إحصائيات الأدوية:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* إجمالي الأدوية */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">إجمالي الأدوية</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            منتج في النظام
          </p>
        </CardContent>
      </Card>

      {/* مخزون منخفض */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">مخزون منخفض</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
          <p className="text-xs text-muted-foreground">
            أقل من 10 وحدات
          </p>
        </CardContent>
      </Card>

      {/* نفذت الكمية */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">نفذت الكمية</CardTitle>
          <Pill className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
          <p className="text-xs text-muted-foreground">
            منتج غير متوفر
          </p>
        </CardContent>
      </Card>

      {/* القيمة الإجمالية */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">القيمة الإجمالية</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {stats.totalValue.toLocaleString()} ج.م
          </div>
          <p className="text-xs text-muted-foreground">
            قيمة المخزون
          </p>
        </CardContent>
      </Card>
    </div>
  );
}