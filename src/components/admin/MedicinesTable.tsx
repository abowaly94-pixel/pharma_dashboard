import { useState } from 'react';
import { Edit, Trash2, Eye, Star, Package } from 'lucide-react';
import { Medicine } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MedicineImage } from '@/components/ui/medicine-image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface MedicinesTableProps {
  medicines: Medicine[];
  onView: (medicine: Medicine) => void;
  onEdit: (medicine: Medicine) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function MedicinesTable({
  medicines,
  onView,
  onEdit,
  onDelete,
  isLoading = false
}: MedicinesTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="p-8 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            جاري تحميل الأدوية...
          </div>
        </div>
      </div>
    );
  }

  if (medicines.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2 font-cairo">لا توجد أدوية</h3>
          <p className="text-muted-foreground font-cairo">لم يتم العثور على أي أدوية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-right font-cairo font-semibold">الصورة</TableHead>
              <TableHead className="text-right font-cairo font-semibold">اسم الدواء</TableHead>
              <TableHead className="text-right font-cairo font-semibold">الكود</TableHead>
              <TableHead className="text-right font-cairo font-semibold">الفئة</TableHead>
              <TableHead className="text-right font-cairo font-semibold">القسم</TableHead>
              <TableHead className="text-right font-cairo font-semibold">السعر</TableHead>
              <TableHead className="text-right font-cairo font-semibold">الكمية</TableHead>
              <TableHead className="text-right font-cairo font-semibold">التقييم</TableHead>
              <TableHead className="text-right font-cairo font-semibold">الصيدلية</TableHead>
              <TableHead className="text-center font-cairo font-semibold">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.map((medicine) => (
              <TableRow 
                key={medicine.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* الصورة */}
                <TableCell className="w-20">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                    <MedicineImage
                      imageUrl={(medicine as any).subabaseImageUrl}
                      originalImageUrl={medicine.subabaseORImageUrl}
                      name={medicine.name}
                      objectFit="contain"
                      className="p-1"
                    />
                    {medicine.quantity === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">نفذت</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* اسم الدواء */}
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="font-cairo text-sm">{medicine.name}</span>
                    {medicine.nameEn && (
                      <span className="text-xs text-gray-500" dir="ltr">{medicine.nameEn}</span>
                    )}
                    <div className="flex gap-1 mt-1">
                      {medicine.isNewProduct && (
                        <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">جديد</Badge>
                      )}
                      {medicine.discountRating > 0 && (
                        <Badge variant="destructive" className="text-xs px-1.5 py-0">
                          -{medicine.discountRating}%
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* الكود */}
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {medicine.code}
                  </code>
                </TableCell>

                {/* الفئة */}
                <TableCell>
                  {medicine.category ? (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 font-cairo">
                      {medicine.category}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>

                {/* القسم */}
                <TableCell>
                  {(medicine as any).sectionName ? (
                    <div className="flex items-center gap-2">
                      {(medicine as any).sectionImageUrl && (
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-200 overflow-hidden flex-shrink-0">
                          <img 
                            src={(medicine as any).sectionImageUrl} 
                            alt={(medicine as any).sectionName} 
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                      <span className="text-xs font-cairo">{(medicine as any).sectionName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </TableCell>

                {/* السعر */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {medicine.discountRating > 0 ? (
                      <>
                        <span className="text-xs text-gray-400 line-through">
                          {medicine.price.toFixed(2)} ج.م
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          {(medicine.price - (medicine.price * (medicine.discountRating / 100))).toFixed(2)} ج.م
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-bold text-blue-600">
                        {medicine.price.toFixed(2)} ج.م
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* الكمية */}
                <TableCell>
                  <span className={`text-sm font-medium ${
                    medicine.quantity > 10 
                      ? 'text-green-600' 
                      : medicine.quantity > 0 
                        ? 'text-orange-500' 
                        : 'text-red-500'
                  }`}>
                    {medicine.quantity}
                  </span>
                </TableCell>

                {/* التقييم */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{medicine.avgRating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({medicine.ratingCount})</span>
                  </div>
                </TableCell>

                {/* الصيدلية */}
                <TableCell>
                  <div className="flex flex-col gap-0.5 max-w-[150px]">
                    <span className="text-xs font-cairo truncate">{medicine.pharmacyName}</span>
                    {medicine.pharmcyAddress && (
                      <span className="text-xs text-gray-500 truncate">{medicine.pharmcyAddress}</span>
                    )}
                  </div>
                </TableCell>

                {/* الإجراءات */}
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-200 hover:bg-blue-50 hover:border-blue-300"
                      onClick={() => onView(medicine)}
                      title="عرض التفاصيل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-200 hover:bg-green-50 hover:border-green-300"
                      onClick={() => onEdit(medicine)}
                      title="تعديل"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 border-gray-200 hover:bg-red-50 hover:border-red-300 text-red-500 hover:text-red-600"
                      onClick={() => onDelete(medicine.id)}
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
