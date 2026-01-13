import { motion } from 'framer-motion';
import { Medicine } from '@/types';
import { Badge } from '@/components/ui/badge';

interface AllMedicinesTableProps {
  medicines: Medicine[];
}

export function AllMedicinesTable({ medicines }: AllMedicinesTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold font-cairo">جميع الأدوية</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                الاسم
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                السعر
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                الكمية
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                اسم الصيدلية
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                تقييم متوسط
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                مبيعات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {medicines.map((medicine, index) => (
              <motion.tr
                key={medicine.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="table-row-hover"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {medicine.subabaseORImageUrl ? (
                      <img 
                        src={medicine.subabaseORImageUrl} 
                        alt={medicine.name} 
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-xs font-bold">{medicine.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium">{medicine.name}</span>
                      <p className="text-xs text-muted-foreground">{medicine.code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold">{medicine.price} ج.م</span>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={medicine.quantity > 10 ? 'default' : 
                             medicine.quantity > 0 ? 'secondary' : 'destructive'}
                  >
                    {medicine.quantity}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{medicine.pharmacyName}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{medicine.avgRating?.toFixed(1) || '0.0'}</span>
                    <span className="text-xs text-muted-foreground">({medicine.ratingCount || 0})</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{medicine.sellingCount || 0}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}