import { useState } from 'react';
import { sendNotification, NotificationData } from '@/lib/notifications';
import { toast } from 'sonner';

export function useNotificationSender() {
  const [isSending, setIsSending] = useState(false);

  const send = async (data: NotificationData) => {
    setIsSending(true);
    try {
      const notificationId = await sendNotification(data);
      toast.success('تم إرسال الإشعار بنجاح');
      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('فشل إرسال الإشعار');
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  // Helper functions for common notification types
  const sendOrderNotification = async (orderId: string, status: string, targetRoles?: string[]) => {
    return send({
      title: 'تحديث الطلب',
      body: `تم تحديث حالة الطلب #${orderId} إلى: ${status}`,
      type: 'order',
      targetRoles: targetRoles as any,
      actionUrl: `/admin/orders`,
      data: { orderId, status }
    });
  };

  const sendMedicineNotification = async (medicineName: string, action: 'added' | 'updated' | 'low-stock') => {
    const messages = {
      added: `تم إضافة دواء جديد: ${medicineName}`,
      updated: `تم تحديث معلومات الدواء: ${medicineName}`,
      'low-stock': `تنبيه: مخزون منخفض للدواء ${medicineName}`
    };

    return send({
      title: action === 'low-stock' ? 'تنبيه مخزون' : 'تحديث الأدوية',
      body: messages[action],
      type: 'medicine',
      targetRoles: ['admin', 'pharmacist'],
      actionUrl: '/admin/medicines'
    });
  };

  const sendUserNotification = async (userId: string, message: string) => {
    return send({
      title: 'إشعار خاص',
      body: message,
      type: 'user',
      targetUsers: [userId]
    });
  };

  const sendSystemNotification = async (message: string, targetRoles?: string[]) => {
    return send({
      title: 'إشعار النظام',
      body: message,
      type: 'system',
      targetRoles: targetRoles as any
    });
  };

  const sendGeneralNotification = async (title: string, body: string, targetRoles?: string[]) => {
    return send({
      title,
      body,
      type: 'general',
      targetRoles: targetRoles as any
    });
  };

  return {
    send,
    isSending,
    sendOrderNotification,
    sendMedicineNotification,
    sendUserNotification,
    sendSystemNotification,
    sendGeneralNotification
  };
}
