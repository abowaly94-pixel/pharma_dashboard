import { initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration - using the exact config you provided
const firebaseConfig = {
  apiKey: "AIzaSyBLPXSx83_5rBSr8XWN41WnQEYoaPfLjtM",
  authDomain: "pharmanow-754a7.firebaseapp.com",
  projectId: "pharmanow-754a7",
  storageBucket: "pharmanow-754a7.firebasestorage.app",
  messagingSenderId: "899708379709",
  appId: "1:899708379709:web:808bc5cc7ce74cbeb38054",
  measurementId: "G-J9Y4XV5MQ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services (force long polling to avoid network/proxy issues)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
});
export const auth = getAuth(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
