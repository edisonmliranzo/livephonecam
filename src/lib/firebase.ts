import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2X4Ii1Nii4nEP8yrhp_sLJ_j8xSNKOss",
  authDomain: "livephonecam-5e273.firebaseapp.com",
  databaseURL: "https://livephonecam-5e273-default-rtdb.firebaseio.com",
  projectId: "livephonecam-5e273",
  storageBucket: "livephonecam-5e273.firebasestorage.app",
  messagingSenderId: "191808136183",
  appId: "1:191808136183:web:c301644214d3f59b5284f2",
  measurementId: "G-CYL0HEW8PK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const isConfigured = true;

export default app;
