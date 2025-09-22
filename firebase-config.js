// Firebase config provided by user (inserted)
const firebaseConfig = {
  apiKey: "AIzaSyApI1Bi18rCpVNlXmPoQDb_y28a8kajAwQ",
  authDomain: "darkstore-f069a.firebaseapp.com",
  projectId: "darkstore-f069a",
  storageBucket: "darkstore-f069a.firebasestorage.app",
  messagingSenderId: "767024328451",
  appId: "1:767024328451:web:16e4d2993e265f45e00336",
  measurementId: "G-R1N3F3MM99"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
