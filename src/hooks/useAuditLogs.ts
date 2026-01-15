/**
 * Hook لسجلات المراجعة
 * Audit Logs Hook
 * 
 * Requirements: 7.2
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AuditLog, AuditFilters, AuditAction } from '@/types';
import { getAuditLogs, exportAuditLogsToCSV } from '@/services/auditService';
import { toast } from 'sonner';

interface UseAuditLogsReturn {
  logs: AuditLog[];
  filteredLogs: AuditLog[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    total: number;
    byAction: Record<string, number>;
    byTargetType: Record<string, number>;
  };
  filters: AuditFilters;
  setFilters: (filters: AuditFilters) => void;
  exportToCSV: () => Promise<void>;
  refreshLogs: () => Promise<void>;
}

export function useAuditLogs(): UseAuditLogsReturn {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<AuditFilters>({
    action: 'all',
    targetType: 'all',
  });

  // Real-time listener for audit logs
  useEffect(() => {
    const q = query(
      collection(db, 'auditLogs'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logList: AuditLog[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            action: data.action as AuditAction,
            actorId: data.actorId,
            actorEmail: data.actorEmail,
            actorRole: data.actorRole,
            targetId: data.targetId,
            targetType: data.targetType,
            details: data.details || {},
            timestamp: data.timestamp?.toDate() || new Date(),
          };
        });

        setLogs(logList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error listening to audit logs:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);


  // Filter logs based on current filters
  const filteredLogs = logs.filter((log) => {
    // Action filter
    if (filters.action && filters.action !== 'all' && log.action !== filters.action) {
      return false;
    }

    // Target type filter
    if (filters.targetType && filters.targetType !== 'all' && log.targetType !== filters.targetType) {
      return false;
    }

    // Actor filter
    if (filters.actorId && log.actorId !== filters.actorId) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const timestamp = log.timestamp;
      if (timestamp < filters.dateRange.start || timestamp > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  });

  // Calculate stats
  const stats = {
    total: logs.length,
    byAction: logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byTargetType: logs.reduce((acc, log) => {
      acc[log.targetType] = (acc[log.targetType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const exportToCSV = useCallback(async () => {
    try {
      const csvContent = await exportAuditLogsToCSV(filters);
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('تم تصدير السجلات بنجاح');
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'فشل في تصدير السجلات');
    }
  }, [filters]);

  const refreshLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAuditLogs(filters);
      setLogs(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  return {
    logs,
    filteredLogs,
    isLoading,
    error,
    stats,
    filters,
    setFilters,
    exportToCSV,
    refreshLogs,
  };
}
