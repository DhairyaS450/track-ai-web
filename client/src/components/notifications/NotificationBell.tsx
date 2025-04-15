import React, { useState } from 'react';
import { Bell, X, BookOpen, Clock, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      window.location.href = link;
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering the notification click
    deleteNotification(id);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'study-session':
        return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'reminder':
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'deadline':
        return <Calendar className="h-4 w-4 text-red-500" />;
      case 'ai-suggestion':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'success':
        return <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">Success</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 text-xs">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-100 text-red-800 text-xs">Error</Badge>;
      case 'info':
      default:
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">Info</Badge>;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-sm text-muted-foreground p-4 text-center">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''} hover:bg-accent relative group`}
                onClick={() => handleNotificationClick(notification.id, notification.link)}
              >
                <div className="flex flex-col gap-1 w-full pr-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getNotificationIcon(notification.type)}
                      <span className="font-medium">{notification.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notification.createdAt ? 
                        format(notification.createdAt.toDate(), 'MMM d, h:mm a') : 
                        'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 absolute top-3 right-3"
                  onClick={(e) => handleDeleteNotification(e, notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};