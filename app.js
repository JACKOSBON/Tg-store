// Auth Logic
const auth = firebase.auth();

// Login
document.getElementById("loginBtn")?.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(err => {
      document.getElementById("errorMsg").innerText = err.message;
    });
});

// Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});

// Redirect if not logged in
auth.onAuthStateChanged(user => {
  if (!user && window.location.pathname.includes("index.html")) {
    window.location.href = "login.html";
  }
});
