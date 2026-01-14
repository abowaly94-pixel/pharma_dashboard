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
  Store,
  Calendar,
  ShoppingCart,
  Heart,
  Trash2,
  Eye
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const roleConfig = {
  admin: { label: 'مدير النظام', class: 'badge-danger', icon: Shield },
  pharmacist: { label: 'صيدلي', class: 'badge-info', icon: Store },
  user: { label: 'مستخدم', class: 'badge-success', icon: UserIcon },
};

export default function AdminUsers() {
  const { users, isLoading, deleteUser } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.phoneNumber && user.phoneNumber.includes(searchQuery));

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const handleDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete.uid);
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'غير متوفر';
    return new Date(date).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold font-cairo">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">عرض وإدارة جميع المستخدمين في النظام</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-6 py-4 text-center">
            <p className="text-sm text-muted-foreground font-cairo mb-1">إجمالي المستخدمين</p>
            <p className="text-3xl font-bold text-primary">
              {isLoading ? (
                <span className="inline-block w-12 h-8 bg-primary/20 animate-pulse rounded"></span>
              ) : (
                users.length
              )}
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
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
          </div>
          
          {/* Results Count */}
          {!isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-cairo">
              <span>عرض</span>
              <span className="font-bold text-primary">{filteredUsers.length}</span>
              <span>من أصل</span>
              <span className="font-bold text-primary">{users.length}</span>
              <span>مستخدم</span>
            </div>
          )}
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
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UserIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-cairo text-muted-foreground">لا توجد نتائج</p>
            </div>
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
                    <div className="flex items-center gap-3">
                      <Avatar className="w-14 h-14 border-2 border-primary/20">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-cairo">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-base font-cairo mb-1">{user.name}</h3>
                        <span className={`${role.class} inline-flex items-center gap-1 text-xs`}>
                          <RoleIcon className="w-3 h-3" />
                          {role.label}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          className="font-cairo cursor-pointer"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="w-4 h-4 ml-2" />
                          عرض التفاصيل
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="font-cairo text-destructive cursor-pointer"
                          onClick={() => setUserToDelete(user)}
                        >
                          <Trash2 className="w-4 h-4 ml-2" />
                          حذف المستخدم
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate text-xs" dir="ltr">{user.email}</span>
                    </div>

                    {user.phoneNumber && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="font-cairo" dir="ltr">{user.phoneNumber}</span>
                      </div>
                    )}

                    {user.pharmacyName && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Store className="w-4 h-4 flex-shrink-0" />
                        <span className="font-cairo truncate">{user.pharmacyName}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground font-cairo">السلة</p>
                        <p className="font-medium">{user.cart?.length || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <div>
                        <p className="text-xs text-muted-foreground font-cairo">المفضلة</p>
                        <p className="font-medium">{user.favorites?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* User Details Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cairo text-2xl">تفاصيل المستخدم</DialogTitle>
              <DialogDescription className="font-cairo">
                معلومات كاملة عن المستخدم
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <Avatar className="w-20 h-20 border-2 border-primary">
                    <AvatarImage src={selectedUser.profileImageUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-cairo">
                      {selectedUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-cairo mb-1">{selectedUser.name}</h3>
                    <span className={`${roleConfig[selectedUser.role || 'user'].class} inline-flex items-center gap-1`}>
                      {(() => {
                        const RoleIcon = roleConfig[selectedUser.role || 'user'].icon;
                        return <RoleIcon className="w-3 h-3" />;
                      })()}
                      {roleConfig[selectedUser.role || 'user'].label}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold font-cairo text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    معلومات الاتصال
                  </h4>
                  <div className="grid gap-3 pr-7">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground font-cairo">البريد الإلكتروني</span>
                      <span className="font-medium" dir="ltr">{selectedUser.email}</span>
                    </div>
                    {selectedUser.phoneNumber && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground font-cairo">رقم الهاتف</span>
                        <span className="font-medium" dir="ltr">{selectedUser.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pharmacy Information */}
                {selectedUser.role === 'pharmacist' && selectedUser.pharmacyName && (
                  <div className="space-y-3">
                    <h4 className="font-semibold font-cairo text-lg flex items-center gap-2">
                      <Store className="w-5 h-5 text-primary" />
                      معلومات الصيدلية
                    </h4>
                    <div className="grid gap-3 pr-7">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground font-cairo">اسم الصيدلية</span>
                        <span className="font-medium font-cairo">{selectedUser.pharmacyName}</span>
                      </div>
                      {selectedUser.pharmacyId && (
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground font-cairo">رقم الصيدلية</span>
                          <span className="font-medium">{selectedUser.pharmacyId}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Activity Statistics */}
                <div className="space-y-3">
                  <h4 className="font-semibold font-cairo text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    إحصائيات النشاط
                  </h4>
                  <div className="grid grid-cols-2 gap-3 pr-7">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                        <span className="text-sm text-muted-foreground font-cairo">السلة</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedUser.cart?.length || 0}</p>
                      <p className="text-xs text-muted-foreground font-cairo mt-1">منتج</p>
                    </div>
                    <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-muted-foreground font-cairo">المفضلة</span>
                      </div>
                      <p className="text-2xl font-bold">{selectedUser.favorites?.length || 0}</p>
                      <p className="text-xs text-muted-foreground font-cairo mt-1">منتج</p>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="space-y-3">
                  <h4 className="font-semibold font-cairo text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    معلومات الحساب
                  </h4>
                  <div className="grid gap-3 pr-7">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground font-cairo">معرف المستخدم</span>
                      <span className="font-mono text-xs">{selectedUser.uid}</span>
                    </div>
                    {selectedUser.createdAt && (
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground font-cairo">تاريخ التسجيل</span>
                        <span className="font-cairo">{formatDate(selectedUser.createdAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cairo text-xl">تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription className="font-cairo text-base">
                هل أنت متأكد من حذف المستخدم <span className="font-bold text-foreground">{userToDelete?.name}</span>؟
                <br />
                <span className="text-destructive font-semibold">سيتم حذف المستخدم من قاعدة البيانات و Firebase Auth نهائياً.</span>
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="font-cairo">إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 font-cairo"
              >
                حذف نهائياً
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
