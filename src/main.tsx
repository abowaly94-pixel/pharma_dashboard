import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./radix-ui-fix.css";

// Register Service Worker for Firebase Cloud Messaging
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      console.log('✅ Service Worker registered successfully:', registration.scope);
      
      // Wait for service worker to be ready
      if (registration.installing) {
        registration.installing.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker)?.state === 'activated') {
            console.log('✅ Service Worker activated and ready');
          }
        });
      } else if (registration.waiting) {
        console.log('✅ Service Worker waiting to activate');
      } else if (registration.active) {
        console.log('✅ Service Worker already active');
      }
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
