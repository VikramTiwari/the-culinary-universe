import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyABF0TnrJ_LmkXzpgatFPETdDv_KC6clBI",
  authDomain: "culinary-universe.firebaseapp.com",
  projectId: "culinary-universe",
  storageBucket: "culinary-universe.firebasestorage.app",
  messagingSenderId: "533626372925",
  appId: "1:533626372925:web:b8225bf4a1bda2a9673b54",
  measurementId: "G-EYZTGCMCHL"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Analytics (safely running only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
