// Firebase Cloud Messaging Service Worker
// Version: 2.0
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js');

console.log('Service Worker: Loading...');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBLPXSx83_5rBSr8XWN41WnQEYoaPfLjtM",
  authDomain: "pharmanow-754a7.firebaseapp.com",
  projectId: "pharmanow-754a7",
  storageBucket: "pharmanow-754a7.firebasestorage.app",
  messagingSenderId: "899708379709",
  appId: "1:899708379709:web:808bc5cc7ce74cbeb38054",
  measurementId: "G-J9Y4XV5MQ2"
});

console.log('Service Worker: Firebase initialized');

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Service Worker: Received background message:', payload);

  try {
    const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || '/favicon.ico',
      badge: '/favicon.ico',
      image: payload.notification?.image || payload.data?.imageUrl,
      data: {
        ...payload.data,
        actionUrl: payload.data?.actionUrl || payload.fcmOptions?.link || '/'
      },
      tag: payload.data?.notificationId || `notification-${Date.now()}`,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    };

    console.log('Service Worker: Showing notification:', notificationTitle);
    return self.registration.showNotification(notificationTitle, notificationOptions);
  } catch (error) {
    console.error('Service Worker: Error showing notification:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event);
  event.notification.close();

  // Navigation disabled - notifications will only close
  // const urlToOpen = new URL(event.notification.data?.actionUrl || '/', self.location.origin).href;
  // console.log('Service Worker: Opening URL:', urlToOpen);

  // event.waitUntil(
  //   clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
  //     // Check if there's already a window open with this URL
  //     for (const client of clientList) {
  //       if (client.url === urlToOpen && 'focus' in client) {
  //         console.log('Service Worker: Focusing existing window');
  //         return client.focus();
  //       }
  //     }
  //     // Check if any window is open
  //     if (clientList.length > 0) {
  //       console.log('Service Worker: Navigating existing window');
  //       return clientList[0].focus().then(client => {
  //         if ('navigate' in client) {
  //           return client.navigate(urlToOpen);
  //         }
  //       });
  //     }
  //     // Open new window if none exists
  //     if (clients.openWindow) {
  //       console.log('Service Worker: Opening new window');
  //       return clients.openWindow(urlToOpen);
  //     }
  //   })
  // );
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(clients.claim());
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

console.log('Service Worker: Ready');
