import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration for Curtex Furnishing Production App
const firebaseConfig = {
  apiKey: "AIzaSyClpZ8pR3brJFyy0sz4j7593NbOjQ7-T2E",
  authDomain: "chat-application-e66b9.firebaseapp.com",
  projectId: "chat-application-e66b9",
  storageBucket: "chat-application-e66b9.firebasestorage.app",
  messagingSenderId: "527091957173",
  appId: "1:527091957173:web:a95b75d9a9343dc2ab2dfc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with settings optimized for React Native
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Better for mobile
});

export const db = firestore;
export const auth = getAuth(app);
export default app;
