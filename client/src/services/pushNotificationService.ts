import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db, firebaseApp } from "@/config/firebase";

// Initialize messaging (will be set in init function)
let messaging: any = null;

/**
 * Initialize Firebase Cloud Messaging
 */
export const initMessaging = async () => {
  try {
    // Check if browser supports Firebase Messaging
    if (await isSupported()) {
      // Setup messaging
      messaging = getMessaging(firebaseApp);
      
      // Setup foreground notification handler
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show notification using the Notification API
        if (payload.notification) {
          const { title, body } = payload.notification;
          if (Notification.permission === 'granted') {
            navigator.serviceWorker.ready.then((registration) => {
              registration.showNotification(title || 'Notification', {
                body: body || '',
                icon: '/logo.png',
                badge: '/logo.png',
                data: payload.data
              });
            });
          }
        }
      });
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to initialize messaging:", error);
    return false;
  }
};

/**
 * Check if push notifications are supported in this browser
 */
export const arePushNotificationsSupported = async () => {
  // Check if service workers and Push API are supported
  return (
    'serviceWorker' in navigator && 
    'PushManager' in window && 
    await isSupported()
  );
};

/**
 * Request permission for push notifications
 * @returns Permission status ('granted', 'denied', or 'default')
 */
export const requestNotificationPermission = async () => {
  if (!await arePushNotificationsSupported()) {
    return 'unsupported';
  }
  
  try {
    return Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'error';
  }
};

/**
 * Get current notification permission status
 */
export const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Subscribe user to push notifications
 * @returns FCM token or null if failed
 */
export const subscribeToPushNotifications = async () => {
  if (!messaging) {
    const initialized = await initMessaging();
    if (!initialized) return null;
  }
  
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    });
    
    if (currentToken) {
      // Save token to user's profile in Firestore
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          // Update existing user document
          await updateDoc(userRef, {
            fcmTokens: {
              [currentToken]: true
            },
            notificationSettings: {
              pushEnabled: true
            }
          });
        } else {
          // Create new user document
          await setDoc(userRef, {
            fcmTokens: {
              [currentToken]: true
            },
            notificationSettings: {
              pushEnabled: true
            }
          });
        }
      }
      
      return currentToken;
    } else {
      console.error('No token received from FCM');
      return null;
    }
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

/**
 * Unsubscribe from push notifications
 */
export const unsubscribeFromPushNotifications = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'notificationSettings.pushEnabled': false
      });
    }
    
    // Note: There's no direct way to unsubscribe in Firebase Messaging v9+
    // The above just marks the user as unsubscribed in our database
    
    return true;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

/**
 * Check if user is subscribed to push notifications
 */
export const isPushNotificationSubscribed = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.notificationSettings?.pushEnabled === true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking push notification status:', error);
    return false;
  }
};
