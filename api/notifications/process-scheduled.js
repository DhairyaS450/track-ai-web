import { db, admin } from '../../lib/firebase-admin';
import { isAuthenticated } from '../../lib/middleware/auth';

/**
 * Cloud function to process scheduled notifications
 * This function should be triggered by a cron job every minute
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    const authenticated = await isAuthenticated(req)
    if (!authenticated) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Current timestamp for comparison
    const now = admin.firestore.Timestamp.now();
    
    // Get all pending notifications scheduled for before now
    const scheduledNotificationsRef = db.collection('scheduledNotifications');
    const snapshot = await scheduledNotificationsRef
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .get();
    
    if (snapshot.empty) {
      return res.status(200).json({ message: 'No notifications to process' });
    }
    
    const processingPromises = [];
    const processedCount = { regular: 0, recurring: 0 };
    
    snapshot.forEach(doc => {
      const notification = { id: doc.id, ...doc.data() };
      processingPromises.push(processNotification(notification, processedCount));
    });
    
    await Promise.all(processingPromises);
    
    return res.status(200).json({ 
      message: `Processed ${processedCount.regular} notifications and ${processedCount.recurring} recurring notifications` 
    });
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return res.status(500).json({ error: 'Failed to process scheduled notifications' });
  }
}

/**
 * Process a single notification - deliver it and update its status
 */
async function processNotification(notification, counter) {
  try {
    // Create the actual notification in the notifications collection
    await db.collection('notifications').add({
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      link: notification.link || null,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Mark scheduled notification as delivered
    await db.collection('scheduledNotifications').doc(notification.id).update({
      status: 'delivered',
      modifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Handle recurring notifications - schedule the next occurrence
    if (notification.recurring) {
      await scheduleNextRecurrence(notification);
      counter.recurring++;
    } else {
      counter.regular++;
    }
    
    // Send push notification if applicable
    await sendPushNotification(notification);
    
    return true;
  } catch (error) {
    console.error(`Error processing notification ${notification.id}:`, error);
    return false;
  }
}

/**
 * Schedule the next occurrence of a recurring notification
 */
async function scheduleNextRecurrence(notification) {
  try {
    const { recurring, scheduledFor } = notification;
    const { frequency, endDate } = recurring;
    
    // Calculate next occurrence date
    const currentDate = scheduledFor.toDate();
    let nextDate = new Date(currentDate);
    
    switch (frequency) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        throw new Error(`Unknown frequency: ${frequency}`);
    }
    
    // Check if we've reached the end date
    if (endDate && nextDate > endDate.toDate()) {
      return; // Don't schedule any more recurrences
    }
    
    // Create new scheduled notification for next occurrence
    const newNotification = {
      ...notification,
      scheduledFor: admin.firestore.Timestamp.fromDate(nextDate),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Remove id as we're creating a new document
    delete newNotification.id;
    
    // Add the new scheduled notification to the database
    await db.collection('scheduledNotifications').add(newNotification);
    
  } catch (error) {
    console.error(`Error scheduling recurrence for notification ${notification.id}:`, error);
  }
}

/**
 * Send push notification to user's devices
 */
async function sendPushNotification(notification) {
  try {
    // Get user's FCM tokens
    const userDoc = await db.collection('users').doc(notification.userId).get();
    if (!userDoc.exists) return;
    
    const userData = userDoc.data();
    if (!userData.notificationSettings?.pushEnabled) return;
    if (!userData.fcmTokens) return;
    
    const tokens = Object.keys(userData.fcmTokens).filter(token => userData.fcmTokens[token]);
    if (tokens.length === 0) return;
    
    // Construct notification message
    const message = {
      notification: {
        title: notification.title,
        body: notification.message
      },
      data: {
        type: notification.type,
        link: notification.link || ''
      },
      tokens
    };
    
    // Send notification
    await admin.messaging().sendMulticast(message);
    
  } catch (error) {
    console.error(`Error sending push notification for ${notification.id}:`, error);
  }
}
