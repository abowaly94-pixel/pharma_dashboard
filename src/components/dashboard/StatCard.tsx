import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'accent' | 'success' | 'warning';
  delay?: number;
}

const colorClasses = {
  primary: {
    bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
    text: 'text-white',
    cardBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    border: 'border-blue-100'
  },
  accent: {
    bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
    text: 'text-white',
    cardBg: 'bg-gradient-to-br from-purple-50 to-pink-50',
    border: 'border-purple-100'
  },
  success: {
    bg: 'bg-gradient-to-br from-green-500 to-green-600',
    text: 'text-white',
    cardBg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-green-100'
  },
  warning: {
    bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
    text: 'text-white',
    cardBg: 'bg-gradient-to-br from-orange-50 to-amber-50',
    border: 'border-orange-100'
  },
};

export function StatCard({ title, value, icon: Icon, trend, color = 'primary', delay = 0 }: StatCardProps) {
  const colors = colorClasses[color];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: delay * 0.1, duration: 0.6, ease: "easeOut" }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl ${colors.cardBg} ${colors.border} border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 p-6 group cursor-pointer`}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
        <div className={`w-full h-full ${colors.bg} rounded-full transform translate-x-6 -translate-y-6`} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-cairo mb-2 font-medium">{title}</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 transition-transform duration-200">
              {value}
            </p>
          </div>
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ duration: 0.2 }}
            className={`p-3 rounded-xl ${colors.bg} ${colors.text} shadow-lg`}
          >
            <Icon className="w-6 h-6" />
          </motion.div>
        </div>
        
        {trend && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: (delay * 0.1) + 0.3 }}
            className="flex items-center gap-2"
          >
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend.isPositive 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <span>{trend.isPositive ? '↗' : '↘'}</span>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
            </div>
            <span className="text-xs text-gray-500 font-cairo">من الفترة السابقة</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
