import { Timestamp } from 'firebase/firestore';

export type NotificationType = 'order' | 'medicine' | 'user' | 'system' | 'general';
export type UserRole = 'admin' | 'pharmacist' | 'user';

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  targetUsers?: string[];
  targetRoles?: UserRole[];
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
  sentBy?: string;
}

export interface NotificationData {
  title: string;
  body: string;
  type: NotificationType;
  targetUsers?: string[];
  targetRoles?: UserRole[];
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
}

export interface FCMToken {
  id?: string;
  userId: string;
  token: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: {
    order: number;
    medicine: number;
    user: number;
    system: number;
    general: number;
  };
}
