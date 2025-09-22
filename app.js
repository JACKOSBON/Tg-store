// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getAuth, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyApI1Bi18rCpVNlXmPoQDb_y28a8kajAwQ",
  authDomain: "darkstore-f069a.firebaseapp.com",
  projectId: "darkstore-f069a",
  storageBucket: "darkstore-f069a.firebasestorage.app",
  messagingSenderId: "767024328451",
  appId: "1:767024328451:web:16e4d2993e265f45e00336",
  measurementId: "G-R1N3F3MM99"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elements
const loginBtn = document.getElementById("loginBtn");
const signupLink = document.getElementById("signupLink");
const forgotPassword = document.getElementById("forgotPassword");

// LOGIN
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    signInWithEmailAndPassword(auth, email, pass)
      .then(() => {
        alert("Login successful!");
        window.location.href = "home.html"; // redirect
      })
      .catch(err => alert(err.message));
  });
}

// SIGNUP
if (signupLink) {
  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    const email = prompt("Enter email for signup:");
    const pass = prompt("Enter password:");

    createUserWithEmailAndPassword(auth, email, pass)
      .then(() => alert("Account created! Now login."))
      .catch(err => alert(err.message));
  });
}

// FORGOT PASSWORD
if (forgotPassword) {
  forgotPassword.addEventListener("click", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    if (!email) return alert("Enter email first!");

    sendPasswordResetEmail(auth, email)
      .then(() => alert("Reset link sent to your email!"))
      .catch(err => alert(err.message));
  });
}

// AUTO-REDIRECT if logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in as", user.email);
  }
});
