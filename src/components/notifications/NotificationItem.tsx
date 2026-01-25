import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  ShoppingCart, 
  Pill, 
  Users, 
  Bell,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';
import { SafeImage } from '@/components/ui/safe-image';

interface NotificationItemProps {
  notification: Notification;
}

const iconMap = {
  order: ShoppingCart,
  medicine: Pill,
  user: Users,
  system: Bell,
  general: Package
};

const colorMap = {
  order: 'text-blue-500 bg-blue-50',
  medicine: 'text-green-500 bg-green-50',
  user: 'text-purple-500 bg-purple-50',
  system: 'text-orange-500 bg-orange-50',
  general: 'text-gray-500 bg-gray-50'
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const { markAsRead } = useNotifications();
  const Icon = iconMap[notification.type] || Bell;

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigation disabled - notifications will only mark as read
    // if (notification.actionUrl) {
    //   window.location.href = notification.actionUrl;
    // }
  };

  const timeAgo = notification.createdAt?.toDate
    ? formatDistanceToNow(notification.createdAt.toDate(), {
        addSuffix: true,
        locale: ar
      })
    : 'الآن';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'p-4 hover:bg-accent/50 cursor-pointer transition-colors',
        !notification.read && 'bg-accent/20'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className={cn('p-2 rounded-lg h-fit', colorMap[notification.type])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm font-cairo leading-tight">
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
            )}
          </div>
          <p className="text-sm text-muted-foreground font-cairo leading-snug">
            {notification.body}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
      {notification.imageUrl && (
        <div className="mt-2 rounded-lg w-full h-32 overflow-hidden">
          <SafeImage
            src={notification.imageUrl}
            alt=""
            fallbackMessage="لا يمكن عرض صورة الإشعار"
          />
        </div>
      )}
    </motion.div>
  );
}
