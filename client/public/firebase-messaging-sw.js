// This is the service worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// Your Firebase configuration - this must match your Firebase config in the main app
firebase.initializeApp({ 
  apiKey: "AIzaSyAlchEmQ-aXaWoUgMXHZ70--b0v2Jcc5Sk",
  authDomain: "tidaltasks-app.firebaseapp.com",
  projectId: "tidaltasks-app",
  storageBucket: "tidaltasks-app.firebasestorage.app",
  messagingSenderId: "953882206050",
  appId: "1:953882206050:web:342fdce829bffb6c73563b",
  measurementId: "G-V4XPE4D9MJ"
});

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(clients.matchAll({
    type: "window"
  }).then((clientList) => {
    for (const client of clientList) {
      if (client.url === '/' && 'focus' in client)
        return client.focus();
    }
    if (clients.openWindow)
      return clients.openWindow('/');
  }));
});
