import { motion } from 'framer-motion';
import { Medicine } from '@/types';
import { Badge } from '@/components/ui/badge';

interface AllMedicinesTableProps {
  medicines: Medicine[];
}

export function AllMedicinesTable({ medicines }: AllMedicinesTableProps) {
  if (medicines.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">💊</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 font-cairo mb-2">لا توجد أدوية</h3>
        <p className="text-gray-500">سيتم عرض الأدوية هنا</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-cairo">جميع الأدوية</h3>
            <p className="text-sm text-gray-500 mt-1">إجمالي {medicines.length} دواء</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">💊</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-green-50 to-emerald-50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                الاسم
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                السعر
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                الكمية
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                اسم الصيدلية
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                تقييم متوسط
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                مبيعات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {medicines.map((medicine, index) => (
              <motion.tr
                key={medicine.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 transition-all duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {medicine.subabaseORImageUrl ? (
                      <img 
                        src={medicine.subabaseORImageUrl} 
                        alt={medicine.name} 
                        className="w-12 h-12 rounded-xl object-cover shadow-sm border border-gray-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-lg">{medicine.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-semibold text-gray-800">{medicine.name}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{medicine.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-bold text-green-600">{medicine.price} ج.م</span>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    className={
                      medicine.quantity > 10 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' 
                        : medicine.quantity > 0 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0' 
                        : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-0'
                    }
                  >
                    {medicine.quantity}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{medicine.pharmacyName}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-500">⭐</span>
                    <span className="text-sm font-semibold text-gray-800">{medicine.avgRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-gray-500">({medicine.ratingCount || 0})</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-800">{medicine.sellingCount || 0}</span>
                    <span className="text-xs text-gray-500">مبيعة</span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}