import { motion } from 'framer-motion';
import { User } from '@/types';
import { Badge } from '@/components/ui/badge';

interface AllUsersTableProps {
  users: User[];
}

export function AllUsersTable({ users }: AllUsersTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-card rounded-xl shadow-card border border-border/30 overflow-hidden"
    >
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold font-cairo">جميع المستخدمين</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                الاسم
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                البريد الإلكتروني
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                الدور
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                رقم الصيدلية
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-muted-foreground font-cairo">
                اسم الصيدلية
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user, index) => (
              <motion.tr
                key={user.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="table-row-hover"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant={user.role === 'admin' ? 'default' : 
                             user.role === 'pharmacist' ? 'secondary' : 'outline'}
                  >
                    {user.role === 'admin' ? 'مدير' : 
                     user.role === 'pharmacist' ? 'صيدلي' : 'مستخدم'}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{user.pharmacyId || '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm">{user.pharmacyName || '-'}</span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}