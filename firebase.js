import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase config (from user) - storageBucket corrected to appspot.com
const firebaseConfig = {
  apiKey: "AIzaSyApI1Bi18rCpVNlXmPoQDb_y28a8kajAwQ",
  authDomain: "darkstore-f069a.firebaseapp.com",
  projectId: "darkstore-f069a",
  storageBucket: "darkstore-f069a.appspot.com",
  messagingSenderId: "767024328451",
  appId: "1:767024328451:web:16e4d2993e265f45e00336",
  measurementId: "G-R1N3F3MM99"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
