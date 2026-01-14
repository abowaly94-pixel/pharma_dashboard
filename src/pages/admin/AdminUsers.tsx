import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  User as UserIcon,
  Store
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsers } from '@/hooks/useUsers';
import { User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const roleConfig = {
  admin: { label: 'مدير النظام', class: 'badge-danger', icon: Shield },
  pharmacist: { label: 'صيدلي', class: 'badge-info', icon: Store },
  user: { label: 'مستخدم', class: 'badge-success', icon: UserIcon },
};

export default function AdminUsers() {
  const { users, isLoading, updateUserRole, deleteUser } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleRoleUpdate = async (userId: string, currentRole: User['role']) => {
    const newRole = currentRole === 'admin' ? 'pharmacist' : (currentRole === 'pharmacist' ? 'user' : 'pharmacist');
    await updateUserRole(userId, newRole);
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      await deleteUser(userId);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold font-cairo">إدارة المستخدمين</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين في النظام</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48 font-cairo">
              <Filter className="w-4 h-4 ml-2" />
              <SelectValue placeholder="الدور" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-cairo">جميع الأدوار</SelectItem>
              <SelectItem value="admin" className="font-cairo">مدير النظام</SelectItem>
              <SelectItem value="pharmacist" className="font-cairo">صيدلي</SelectItem>
              <SelectItem value="user" className="font-cairo">مستخدم</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-2/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredUsers.map((user, index) => {
              const role = roleConfig[user.role || 'user'];
              const RoleIcon = role.icon;

              return (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-xl shadow-card border border-border/30 p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-16 h-16 border-2 border-primary/20">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{user.name}</h3>
                        <span className={`${role.class} inline-flex items-center gap-1 mt-1`}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="font-cairo cursor-pointer">عرض التفاصيل</DropdownMenuItem>
                        <DropdownMenuItem
                          className="font-cairo text-primary cursor-pointer"
                          onClick={() => handleRoleUpdate(user.uid, user.role)}
                        >
                          تغيير الدور (تبديل)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="font-cairo text-destructive cursor-pointer"
                          onClick={() => handleDelete(user.uid)}
                        >
                          حذف المستخدم
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span className="truncate" dir="ltr">{user.email}</span>
                    </div>

                    {user.pharmacyName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="w-4 h-4" />
                        <span className="font-cairo">{user.pharmacyName}</span>
                      </div>
                    )}
                  </div>

                  {user.role === 'user' && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-cairo">المفضلة:</span>
                      <span className="font-medium">{user.favorites.length} منتج</span>
                    </div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
