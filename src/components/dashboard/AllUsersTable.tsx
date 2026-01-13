import { motion } from 'framer-motion';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';

interface AllUsersTableProps {
  users: User[];
}

export function AllUsersTable({ users }: AllUsersTableProps) {
  if (users.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-4xl">👥</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 font-cairo mb-2">لا يوجد مستخدمين</h3>
        <p className="text-gray-500">سيتم عرض المستخدمين هنا</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800 font-cairo">جميع المستخدمين</h3>
            <p className="text-sm text-gray-500 mt-1">إجمالي {users.length} مستخدم</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl">👥</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                الاسم
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                البريد الإلكتروني
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                الدور
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                رقم الصيدلية
              </th>
              <th className="text-right px-6 py-4 text-sm font-bold text-gray-700 font-cairo">
                اسم الصيدلية
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user, index) => (
              <motion.tr
                key={user.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold shadow-md">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    className={
                      user.role === 'admin' 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0' 
                        : user.role === 'pharmacist' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0' 
                        : 'bg-gray-200 text-gray-700'
                    }
                  >
                    {user.role === 'admin' ? 'مدير' : 
                     user.role === 'pharmacist' ? 'صيدلي' : 'مستخدم'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{user.pharmacyId || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-700">{user.pharmacyName || '-'}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}