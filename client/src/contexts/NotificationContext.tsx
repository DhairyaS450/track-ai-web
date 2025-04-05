import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useToast } from '@/hooks/useToast';

// Define the notification type
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
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
  const { toast } = useToast();
  const { user } = useAuth();
  
  const unreadCount = notifications.filter(notification => !notification.read).length;

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
  }, [notifications]);

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

  const clearNotifications = async () => {
    // This doesn't actually delete notifications, just marks them as read
    // You could implement a delete function if needed
    await markAllAsRead();
  };

  const value = {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};