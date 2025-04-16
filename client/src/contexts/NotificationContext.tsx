import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/useToast';
import {
  initMessaging,
  arePushNotificationsSupported,
  getNotificationPermissionStatus,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationSubscribed
} from '@/services/pushNotificationService';
import { 
  scheduleNotification, 
  cancelScheduledNotification, 
  updateScheduledNotification, 
  getScheduledNotificationsForUser,
  ScheduledNotification
} from '@/services/scheduledNotificationService';

// Define the notification type
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'study-session' | 'reminder' | 'deadline' | 'ai-suggestion';
  link?: string;
  read: boolean;
  createdAt: Timestamp;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  createNotification: (notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  // Scheduled notifications
  scheduleNotification: (notification: Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>) => Promise<string | null>;
  scheduledNotifications: ScheduledNotification[];
  cancelScheduledNotification: (notificationId: string) => Promise<boolean>;
  updateScheduledNotification: (notificationId: string, updates: Partial<Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>>) => Promise<boolean>;
  // Push notification functions
  isPushSupported: boolean;
  pushPermissionStatus: string;
  isPushEnabled: boolean;
  requestPushPermission: () => Promise<string>;
  enablePushNotifications: () => Promise<boolean>;
  disablePushNotifications: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const NotificationProvider: React.FC<Props> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Push notification state
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState('default');
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Initialize push notification service
  useEffect(() => {
    const initPushService = async () => {
      // Initialize Firebase messaging
      await initMessaging();
      
      // Check if push is supported
      const supported = await arePushNotificationsSupported();
      setIsPushSupported(supported);
      
      // Get current permission status
      const permissionStatus = getNotificationPermissionStatus();
      setPushPermissionStatus(permissionStatus);
      
      // Check if user is subscribed
      if (user && permissionStatus === 'granted') {
        const isSubscribed = await isPushNotificationSubscribed();
        setIsPushEnabled(isSubscribed);
      }
    };
    
    initPushService();
  }, [user]);

  // Load scheduled notifications
  useEffect(() => {
    if (!user) {
      setScheduledNotifications([]);
      return;
    }

    const loadScheduledNotifications = async () => {
      const notifications = await getScheduledNotificationsForUser(user.uid);
      setScheduledNotifications(notifications);
    };

    loadScheduledNotifications();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // Subscribe to notifications for the current user
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsList: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notificationsList.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notificationsList);
    });

    return () => unsubscribe();
  }, [user]);

  // Display toast for new notifications
  useEffect(() => {
    // Only show toast for the most recent unread notification
    const newNotification = notifications.find(notification => !notification.read);
    
    if (newNotification) {
      toast({
        title: newNotification.title,
        description: newNotification.message,
        variant: newNotification.type === 'error' ? 'destructive' : 'default',
        action: newNotification.link ? (
          <a href={newNotification.link} className="underline">
            View
          </a>
        ) : undefined,
      });
    }
  }, [notifications, toast]);

  const createNotification = async (notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>) => {
    if (!user) return;
    
    await addDoc(collection(db, 'notifications'), {
      ...notification,
      userId: user.uid,
      read: false,
      createdAt: serverTimestamp(),
    });
  };

  const markAsRead = async (notificationId: string) => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  };

  const markAllAsRead = async () => {
    const promises = notifications
      .filter(notification => !notification.read)
      .map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
    
    await Promise.all(promises);
  };

  const deleteNotification = async (notificationId: string) => {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  };

  const clearNotifications = async () => {
    // This doesn't actually delete notifications, just marks them as read
    // You could implement a delete function if needed
    await markAllAsRead();
  };

  // Scheduled notification functions
  const scheduleUserNotification = async (notification: Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>) => {
    if (!user) return null;
    
    const notificationId = await scheduleNotification(user.uid, notification);
    
    // Refresh scheduled notifications list
    if (notificationId) {
      const notifications = await getScheduledNotificationsForUser(user.uid);
      setScheduledNotifications(notifications);
    }
    
    return notificationId;
  };

  const cancelUserScheduledNotification = async (notificationId: string) => {
    const success = await cancelScheduledNotification(notificationId);
    
    // Refresh scheduled notifications list
    if (success && user) {
      const notifications = await getScheduledNotificationsForUser(user.uid);
      setScheduledNotifications(notifications);
    }
    
    return success;
  };

  const updateUserScheduledNotification = async (
    notificationId: string, 
    updates: Partial<Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>>
  ) => {
    const success = await updateScheduledNotification(notificationId, updates);
    
    // Refresh scheduled notifications list
    if (success && user) {
      const notifications = await getScheduledNotificationsForUser(user.uid);
      setScheduledNotifications(notifications);
    }
    
    return success;
  };

  // Push notification functions
  const requestPushPermission = async () => {
    if (!isPushSupported) return 'unsupported';
    
    try {
      const permission = await Notification.requestPermission();
      setPushPermissionStatus(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'error';
    }
  };

  const enablePushNotifications = async () => {
    if (pushPermissionStatus !== 'granted') {
      const permission = await requestPushPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permission Denied',
          description: 'You need to allow notifications in your browser settings.',
          variant: 'destructive',
        });
        return false;
      }
    }
    
    const token = await subscribeToPushNotifications();
    const success = !!token;
    setIsPushEnabled(success);
    
    if (success) {
      toast({
        title: 'Push Notifications Enabled',
        description: 'You will now receive push notifications.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to enable push notifications.',
        variant: 'destructive',
      });
    }
    
    return success;
  };

  const disablePushNotifications = async () => {
    const success = await unsubscribeFromPushNotifications();
    
    if (success) {
      setIsPushEnabled(false);
      toast({
        title: 'Push Notifications Disabled',
        description: 'You will no longer receive push notifications.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to disable push notifications.',
        variant: 'destructive',
      });
    }
    
    return success;
  };

  const value = {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    // Scheduled notifications
    scheduleNotification: scheduleUserNotification,
    scheduledNotifications,
    cancelScheduledNotification: cancelUserScheduledNotification,
    updateScheduledNotification: updateUserScheduledNotification,
    // Push notification functions
    isPushSupported,
    pushPermissionStatus,
    isPushEnabled,
    requestPushPermission,
    enablePushNotifications,
    disablePushNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};