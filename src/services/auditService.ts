/**
 * خدمة سجلات المراجعة
 * Audit Log Service
 * 
 * Requirements: 7.1, 7.2, 7.4
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AuditLog,
  AuditAction,
  CreateAuditLogInput,
  AuditFilters,
} from '@/types';
import { DatabaseError, AuthorizationError } from '@/types/errors';

const AUDIT_LOGS_COLLECTION = 'auditLogs';

/**
 * تحويل بيانات Firestore إلى AuditLog
 */
function mapFirestoreToAuditLog(id: string, data: Record<string, unknown>): AuditLog {
  return {
    id,
    action: data.action as AuditAction,
    actorId: data.actorId as string,
    actorEmail: data.actorEmail as string,
    actorRole: data.actorRole as 'admin' | 'pharmacist',
    targetId: data.targetId as string,
    targetType: data.targetType as 'pharmacy' | 'medicine' | 'user',
    details: (data.details as Record<string, unknown>) || {},
    timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate() : new Date(),
  };
}

/**
 * تسجيل إجراء في سجل المراجعة
 * Requirement 7.1: Create audit log entry
 */
export async function logAction(input: CreateAuditLogInput): Promise<AuditLog> {
  try {
    const logId = doc(collection(db, AUDIT_LOGS_COLLECTION)).id;
    
    const logData = {
      action: input.action,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      targetId: input.targetId,
      targetType: input.targetType,
      details: input.details || {},
      timestamp: serverTimestamp(),
    };
    
    await setDoc(doc(db, AUDIT_LOGS_COLLECTION, logId), logData);
    
    return mapFirestoreToAuditLog(logId, {
      ...logData,
      timestamp: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw new DatabaseError('فشل في تسجيل الإجراء', 'logAction', error as Error);
  }
}

/**
 * جلب سجلات المراجعة مع الفلترة
 * Requirement 7.2: Display logs with filtering
 */
export async function getAuditLogs(filters?: AuditFilters): Promise<AuditLog[]> {
  try {
    let q = query(
      collection(db, AUDIT_LOGS_COLLECTION),
      orderBy('timestamp', 'desc')
    );
    
    // Apply action filter
    if (filters?.action && filters.action !== 'all') {
      q = query(q, where('action', '==', filters.action));
    }
    
    // Apply actor filter
    if (filters?.actorId) {
      q = query(q, where('actorId', '==', filters.actorId));
    }
    
    // Apply target type filter
    if (filters?.targetType && filters.targetType !== 'all') {
      q = query(q, where('targetType', '==', filters.targetType));
    }
    
    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(doc => mapFirestoreToAuditLog(doc.id, doc.data()));
    
    // Apply date range filter (client-side)
    if (filters?.dateRange) {
      logs = logs.filter(log => {
        return log.timestamp >= filters.dateRange!.start && 
               log.timestamp <= filters.dateRange!.end;
      });
    }
    
    return logs;
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw new DatabaseError('فشل في جلب سجلات المراجعة', 'getAuditLogs', error as Error);
  }
}

/**
 * منع تعديل أو حذف سجلات المراجعة
 * Requirement 7.4: Audit logs are immutable
 */
export async function updateAuditLog(): Promise<never> {
  throw new AuthorizationError(
    'لا يمكن تعديل سجلات المراجعة',
    'ACTION_NOT_ALLOWED'
  );
}

export async function deleteAuditLog(): Promise<never> {
  throw new AuthorizationError(
    'لا يمكن حذف سجلات المراجعة',
    'ACTION_NOT_ALLOWED'
  );
}

/**
 * تصدير سجلات المراجعة كـ CSV
 */
export async function exportAuditLogsToCSV(filters?: AuditFilters): Promise<string> {
  const logs = await getAuditLogs(filters);
  
  const headers = ['ID', 'Action', 'Actor ID', 'Actor Email', 'Actor Role', 'Target ID', 'Target Type', 'Timestamp', 'Details'];
  const rows = logs.map(log => [
    log.id,
    log.action,
    log.actorId,
    log.actorEmail,
    log.actorRole,
    log.targetId,
    log.targetType,
    log.timestamp.toISOString(),
    JSON.stringify(log.details),
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  return csvContent;
}

// ==================== Helper Functions for Logging ====================

/**
 * تسجيل إنشاء صيدلية
 */
export async function logPharmacyCreated(
  adminId: string,
  adminEmail: string,
  pharmacyId: string,
  pharmacyName: string
): Promise<void> {
  await logAction({
    action: 'pharmacy_created',
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'admin',
    targetId: pharmacyId,
    targetType: 'pharmacy',
    details: { pharmacyName },
  });
}

/**
 * تسجيل تغيير حالة الصيدلية
 */
export async function logPharmacyStatusChange(
  adminId: string,
  adminEmail: string,
  pharmacyId: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  let action: AuditAction;
  switch (newStatus) {
    case 'active':
      action = 'pharmacy_activated';
      break;
    case 'inactive':
      action = 'pharmacy_deactivated';
      break;
    case 'suspended':
      action = 'pharmacy_suspended';
      break;
    default:
      action = 'pharmacy_deactivated';
  }
  
  await logAction({
    action,
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'admin',
    targetId: pharmacyId,
    targetType: 'pharmacy',
    details: { oldStatus, newStatus },
  });
}

/**
 * تسجيل الموافقة على دواء
 */
export async function logMedicineApproved(
  adminId: string,
  adminEmail: string,
  medicineId: string,
  medicineName: string
): Promise<void> {
  await logAction({
    action: 'medicine_approved',
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'admin',
    targetId: medicineId,
    targetType: 'medicine',
    details: { medicineName },
  });
}

/**
 * تسجيل رفض دواء
 */
export async function logMedicineRejected(
  adminId: string,
  adminEmail: string,
  medicineId: string,
  medicineName: string,
  rejectionNotes: string
): Promise<void> {
  await logAction({
    action: 'medicine_rejected',
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'admin',
    targetId: medicineId,
    targetType: 'medicine',
    details: { medicineName, rejectionNotes },
  });
}

/**
 * تسجيل تحديث حد الأدوية
 */
export async function logMedicineLimitUpdated(
  adminId: string,
  adminEmail: string,
  pharmacyId: string,
  oldLimit: number,
  newLimit: number
): Promise<void> {
  await logAction({
    action: 'limit_updated',
    actorId: adminId,
    actorEmail: adminEmail,
    actorRole: 'admin',
    targetId: pharmacyId,
    targetType: 'pharmacy',
    details: { oldLimit, newLimit },
  });
}
