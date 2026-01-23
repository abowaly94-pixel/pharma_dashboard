import { useCallback } from 'react';
import { sendNotification, NotificationData } from '@/lib/notifications';

/**
 * Hook for sending automatic notifications on system events
 * This hook provides helper functions to send notifications for common events
 */
export function useAutoNotifications() {
  
  /**
   * Send notification when a new order is created
   */
  const notifyNewOrder = useCallback(async (orderId: string, pharmacyName: string) => {
    try {
      await sendNotification({
        title: 'طلب جديد',
        body: `تم استلام طلب جديد #${orderId} من ${pharmacyName}`,
        type: 'order',
        targetRoles: ['admin'],
        actionUrl: '/admin/orders',
        data: { orderId, pharmacyName }
      });
    } catch (error) {
      console.error('Error sending new order notification:', error);
    }
  }, []);

  /**
   * Send notification when order status changes
   */
  const notifyOrderStatusChange = useCallback(async (
    orderId: string,
    status: string,
    pharmacyId: number
  ) => {
    try {
      const statusMessages: Record<string, string> = {
        pending: 'قيد الانتظار',
        processing: 'قيد المعالجة',
        shipped: 'تم الشحن',
        delivered: 'تم التوصيل',
        cancelled: 'تم الإلغاء'
      };

      await sendNotification({
        title: 'تحديث حالة الطلب',
        body: `تم تحديث حالة الطلب #${orderId} إلى: ${statusMessages[status] || status}`,
        type: 'order',
        targetUsers: [String(pharmacyId)],
        actionUrl: '/pharmacist/orders',
        data: { orderId, status }
      });
    } catch (error) {
      console.error('Error sending order status notification:', error);
    }
  }, []);

  /**
   * Send notification when a new medicine is added
   */
  const notifyNewMedicine = useCallback(async (medicineName: string, pharmacyName: string) => {
    try {
      await sendNotification({
        title: 'دواء جديد',
        body: `تم إضافة دواء جديد: ${medicineName} من ${pharmacyName}`,
        type: 'medicine',
        targetRoles: ['admin'],
        actionUrl: '/admin/medicine-review',
        data: { medicineName, pharmacyName }
      });
    } catch (error) {
      console.error('Error sending new medicine notification:', error);
    }
  }, []);

  /**
   * Send notification when medicine is approved
   */
  const notifyMedicineApproved = useCallback(async (
    medicineName: string,
    pharmacyId: number
  ) => {
    try {
      await sendNotification({
        title: 'تمت الموافقة على الدواء',
        body: `تمت الموافقة على الدواء: ${medicineName}`,
        type: 'medicine',
        targetUsers: [String(pharmacyId)],
        actionUrl: '/pharmacist/medicines',
        data: { medicineName, status: 'approved' }
      });
    } catch (error) {
      console.error('Error sending medicine approved notification:', error);
    }
  }, []);

  /**
   * Send notification when medicine is rejected
   */
  const notifyMedicineRejected = useCallback(async (
    medicineName: string,
    pharmacyId: number,
    reason?: string
  ) => {
    try {
      await sendNotification({
        title: 'تم رفض الدواء',
        body: `تم رفض الدواء: ${medicineName}${reason ? ` - السبب: ${reason}` : ''}`,
        type: 'medicine',
        targetUsers: [String(pharmacyId)],
        actionUrl: '/pharmacist/medicines',
        data: { medicineName, status: 'rejected', reason }
      });
    } catch (error) {
      console.error('Error sending medicine rejected notification:', error);
    }
  }, []);

  /**
   * Send notification when medicine stock is low
   */
  const notifyLowStock = useCallback(async (
    medicineName: string,
    currentStock: number,
    pharmacyId: number
  ) => {
    try {
      await sendNotification({
        title: 'تنبيه: مخزون منخفض',
        body: `مخزون الدواء ${medicineName} منخفض (${currentStock} وحدة متبقية)`,
        type: 'medicine',
        targetUsers: [String(pharmacyId)],
        actionUrl: '/pharmacist/medicines',
        data: { medicineName, currentStock }
      });
    } catch (error) {
      console.error('Error sending low stock notification:', error);
    }
  }, []);

  /**
   * Send notification when a new user registers
   */
  const notifyNewUser = useCallback(async (userName: string, userRole: string) => {
    try {
      await sendNotification({
        title: 'مستخدم جديد',
        body: `تم تسجيل مستخدم جديد: ${userName} (${userRole})`,
        type: 'user',
        targetRoles: ['admin'],
        actionUrl: '/admin/users',
        data: { userName, userRole }
      });
    } catch (error) {
      console.error('Error sending new user notification:', error);
    }
  }, []);

  /**
   * Send notification when pharmacy is approved
   */
  const notifyPharmacyApproved = useCallback(async (
    pharmacyName: string,
    pharmacyId: string
  ) => {
    try {
      await sendNotification({
        title: 'تمت الموافقة على الصيدلية',
        body: `تمت الموافقة على صيدلية: ${pharmacyName}. يمكنك الآن البدء في استخدام النظام`,
        type: 'system',
        targetUsers: [pharmacyId],
        actionUrl: '/pharmacist',
        data: { pharmacyName, status: 'approved' }
      });
    } catch (error) {
      console.error('Error sending pharmacy approved notification:', error);
    }
  }, []);

  /**
   * Send notification when pharmacy is rejected
   */
  const notifyPharmacyRejected = useCallback(async (
    pharmacyName: string,
    pharmacyId: string,
    reason?: string
  ) => {
    try {
      await sendNotification({
        title: 'تم رفض الصيدلية',
        body: `تم رفض صيدلية: ${pharmacyName}${reason ? ` - السبب: ${reason}` : ''}`,
        type: 'system',
        targetUsers: [pharmacyId],
        data: { pharmacyName, status: 'rejected', reason }
      });
    } catch (error) {
      console.error('Error sending pharmacy rejected notification:', error);
    }
  }, []);

  /**
   * Send system-wide notification
   */
  const notifySystem = useCallback(async (
    title: string,
    message: string,
    targetRoles?: ('admin' | 'pharmacist' | 'user')[]
  ) => {
    try {
      await sendNotification({
        title,
        body: message,
        type: 'system',
        targetRoles,
        data: { timestamp: Date.now() }
      });
    } catch (error) {
      console.error('Error sending system notification:', error);
    }
  }, []);

  return {
    notifyNewOrder,
    notifyOrderStatusChange,
    notifyNewMedicine,
    notifyMedicineApproved,
    notifyMedicineRejected,
    notifyLowStock,
    notifyNewUser,
    notifyPharmacyApproved,
    notifyPharmacyRejected,
    notifySystem
  };
}
