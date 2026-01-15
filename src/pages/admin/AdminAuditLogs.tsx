import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Download,
  Filter,
  Calendar,
  User,
  Activity,
  FileText,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { AuditAction } from '@/types';

export default function AdminAuditLogs() {
  const {
    logs,
    isLoading,
    filters,
    setFilters,
    exportToCSV,
  } = useAuditLogs();

  const [searchQuery, setSearchQuery] = useState('');

  const handleExport = async () => {
    await exportToCSV();
  };

  const getActionBadge = (action: AuditAction) => {
    const actionConfig: Record<AuditAction, { label: string; color: string }> = {
      pharmacy_created: { label: 'إنشاء صيدلية', color: 'bg-blue-500' },
      pharmacy_activated: { label: 'تفعيل صيدلية', color: 'bg-green-500' },
      pharmacy_deactivated: { label: 'إلغاء تفعيل', color: 'bg-gray-500' },
      pharmacy_suspended: { label: 'تعليق صيدلية', color: 'bg-red-500' },
      medicine_created: { label: 'إضافة دواء', color: 'bg-blue-500' },
      medicine_approved: { label: 'موافقة دواء', color: 'bg-green-500' },
      medicine_rejected: { label: 'رفض دواء', color: 'bg-red-500' },
      medicine_updated: { label: 'تعديل دواء', color: 'bg-yellow-500' },
      limit_updated: { label: 'تعديل حد', color: 'bg-purple-500' },
      login_success: { label: 'تسجيل دخول', color: 'bg-green-500' },
      login_failed: { label: 'فشل دخول', color: 'bg-red-500' },
      logout: { label: 'تسجيل خروج', color: 'bg-gray-500' },
    };

    const config = actionConfig[action];
    return (
      <Badge className={`${config.color} hover:${config.color}`}>
        {config.label}
      </Badge>
    );
  };

  const filteredLogs = logs.filter((log) => {
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        log.actorEmail.toLowerCase().includes(search) ||
        log.targetId.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold font-cairo">سجلات المراجعة</h1>
            <p className="text-muted-foreground">عرض جميع الإجراءات المسجلة في النظام</p>
          </div>
          <Button onClick={handleExport} className="font-cairo">
            <Download className="w-4 h-4 ml-2" />
            تصدير CSV
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="w-4 h-4" />
                إجمالي السجلات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{logs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="w-4 h-4" />
                اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter((log) => {
                  const today = new Date();
                  const logDate = new Date(log.timestamp);
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                المستخدمين النشطين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(logs.map((log) => log.actorId)).size}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                هذا الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter((log) => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return new Date(log.timestamp) >= weekAgo;
                }).length}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث بالبريد الإلكتروني أو معرف الهدف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 font-cairo"
            />
          </div>
          <Select
            value={filters.action || 'all'}
            onValueChange={(value) =>
              setFilters({ ...filters, action: value === 'all' ? undefined : (value as AuditAction) })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الإجراءات</SelectItem>
              <SelectItem value="pharmacy_created">إنشاء صيدلية</SelectItem>
              <SelectItem value="pharmacy_activated">تفعيل صيدلية</SelectItem>
              <SelectItem value="pharmacy_deactivated">إلغاء تفعيل</SelectItem>
              <SelectItem value="pharmacy_suspended">تعليق صيدلية</SelectItem>
              <SelectItem value="medicine_created">إضافة دواء</SelectItem>
              <SelectItem value="medicine_approved">موافقة دواء</SelectItem>
              <SelectItem value="medicine_rejected">رفض دواء</SelectItem>
              <SelectItem value="medicine_updated">تعديل دواء</SelectItem>
              <SelectItem value="limit_updated">تعديل حد</SelectItem>
              <SelectItem value="login_success">تسجيل دخول</SelectItem>
              <SelectItem value="login_failed">فشل دخول</SelectItem>
              <SelectItem value="logout">تسجيل خروج</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.targetType || 'all'}
            onValueChange={(value) =>
              setFilters({
                ...filters,
                targetType: value === 'all' ? undefined : (value as 'pharmacy' | 'medicine' | 'user'),
              })
            }
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="نوع الهدف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="pharmacy">صيدلية</SelectItem>
              <SelectItem value="medicine">دواء</SelectItem>
              <SelectItem value="user">مستخدم</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Logs Table */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا توجد سجلات</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      التاريخ والوقت
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراء
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستخدم
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      نوع الهدف
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      معرف الهدف
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{new Date(log.timestamp).toLocaleDateString('ar-EG')}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                        {log.actorEmail}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={log.actorRole === 'admin' ? 'default' : 'secondary'}>
                          {log.actorRole === 'admin' ? 'مدير' : 'صيدلي'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.targetType === 'pharmacy'
                          ? 'صيدلية'
                          : log.targetType === 'medicine'
                          ? 'دواء'
                          : 'مستخدم'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.targetId.substring(0, 8)}...
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
