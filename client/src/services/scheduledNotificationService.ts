import { db } from '@/config/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Notification } from '@/contexts/NotificationContext';

export interface ScheduledNotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: Notification['type'];
  link?: string;
  scheduledFor: Timestamp;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: Timestamp; // Optional end date for recurring notifications
  };
  status: 'pending' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
  modifiedAt?: Timestamp;
}

/**
 * Schedule a notification for future delivery
 */
export const scheduleNotification = async (
  userId: string,
  notification: Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>
): Promise<string | null> => {
  try {
    // Validate scheduledFor date is in the future
    if (notification.scheduledFor.toDate() <= new Date()) {
      console.error('Scheduled time must be in the future');
      return null;
    }

    const scheduledNotification: Omit<ScheduledNotification, 'id'> = {
      userId,
      ...notification,
      status: 'pending',
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'scheduledNotifications'), scheduledNotification);
    return docRef.id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelScheduledNotification = async (notificationId: string): Promise<boolean> => {
  try {
    // Mark as cancelled instead of deleting, to keep history
    const notificationRef = doc(db, 'scheduledNotifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'cancelled',
      modifiedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error cancelling notification:', error);
    return false;
  }
};

/**
 * Update a scheduled notification
 */
export const updateScheduledNotification = async (
  notificationId: string,
  updates: Partial<Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>>
): Promise<boolean> => {
  try {
    const notificationRef = doc(db, 'scheduledNotifications', notificationId);
    
    // Add modified timestamp
    const updatedFields = {
      ...updates,
      modifiedAt: serverTimestamp()
    };
    
    await updateDoc(notificationRef, updatedFields);
    return true;
  } catch (error) {
    console.error('Error updating scheduled notification:', error);
    return false;
  }
};

/**
 * Get all scheduled notifications for a user
 */
export const getScheduledNotificationsForUser = async (
  userId: string,
  status?: ScheduledNotification['status']
): Promise<ScheduledNotification[]> => {
  try {
    let q = query(
      collection(db, 'scheduledNotifications'),
      where('userId', '==', userId)
    );
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    
    const querySnapshot = await getDocs(q);
    const notifications: ScheduledNotification[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({ 
        id: doc.id, 
        ...doc.data() 
      } as ScheduledNotification);
    });
    
    return notifications;
  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
    return [];
  }
};

/**
 * Mark a scheduled notification as delivered
 */
export const markScheduledNotificationAsDelivered = async (notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = doc(db, 'scheduledNotifications', notificationId);
    await updateDoc(notificationRef, {
      status: 'delivered',
      modifiedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as delivered:', error);
    return false;
  }
};

/**
 * Create a recurring notification schedule
 */
export const scheduleRecurringNotification = async (
  userId: string,
  notification: Omit<ScheduledNotification, 'id' | 'userId' | 'status' | 'createdAt'>,
  frequency: 'daily' | 'weekly' | 'monthly',
  endDate?: Date
): Promise<string | null> => {
  try {
    const recurringNotification: Omit<ScheduledNotification, 'id'> = {
      userId,
      ...notification,
      recurring: {
        frequency,
        endDate: endDate ? Timestamp.fromDate(endDate) : undefined
      },
      status: 'pending',
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'scheduledNotifications'), recurringNotification);
    return docRef.id;
  } catch (error) {
    console.error('Error scheduling recurring notification:', error);
    return null;
  }
};
