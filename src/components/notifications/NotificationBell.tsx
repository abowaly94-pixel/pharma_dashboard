import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationItem } from './NotificationItem';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, requestPermission } = useNotifications();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1"
              >
                <Badge
                  variant="destructive"
                  className="h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold font-cairo">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              تعليم الكل كمقروء
            </Button>
          )}
        </div>
        
        {/* Enable Notifications Button */}
        {notificationPermission !== 'granted' && (
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <BellRing className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-semibold font-cairo mb-1">
                  فعّل الإشعارات
                </p>
                <p className="text-xs text-muted-foreground font-cairo mb-2">
                  احصل على تحديثات فورية
                </p>
                <Button
                  size="sm"
                  onClick={async () => {
                    await requestPermission();
                    if ('Notification' in window) {
                      setNotificationPermission(Notification.permission);
                    }
                  }}
                  className="w-full"
                >
                  تفعيل الإشعارات
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <ScrollArea className="h-[400px]">{notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm font-cairo">لا توجد إشعارات</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
