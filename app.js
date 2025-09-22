import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// LOGIN page
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.location.href = "home.html";
    } catch (err) { alert(err.message); }
  });
}

const signupLink = document.getElementById("signupLink");
if (signupLink) {
  signupLink.addEventListener("click", async () => {
    const email = prompt("Enter email:");
    const pass = prompt("Enter password:");
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Account created! Now login.");
    } catch (err) { alert(err.message); }
  });
}

const forgotPassword = document.getElementById("forgotPassword");
if (forgotPassword) {
  forgotPassword.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    if (!email) return alert("Enter email first!");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Reset email sent!");
    } catch (err) { alert(err.message); }
  });
}

// HOME page
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// Auto redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (!user && window.location.pathname.includes("home.html")) {
    window.location.href = "index.html";
  }
});
