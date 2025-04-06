// This is the service worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.0/firebase-messaging-compat.js');

// Your Firebase configuration - this must match your Firebase config in the main app
firebase.initializeApp({
  apiKey: "AIzaSyCrkxDMQZR9B0urCV_yQLnorWYnmWvW-p4",
  authDomain: "track-ai-app.firebaseapp.com",
  projectId: "track-ai-app",
  storageBucket: "track-ai-app.firebasestorage.app",
  messagingSenderId: "519011897064",
  appId: "1:519011897064:web:1533e6585b1072d745435d",
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
