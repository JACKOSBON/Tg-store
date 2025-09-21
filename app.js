const API_URL = "https://darkstore.tauseefrza458.workers.dev/
";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      let res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      let data = await res.json();
      alert(data.message || "Registered successfully!");
      if (data.success) window.location.href = "login.html";
    });
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      let res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      let data = await res.json();
      if (data.success) {
        localStorage.setItem("user", username);
        window.location.href = "index.html";
      } else {
        alert(data.message);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }

  // Show/hide login/logout
  if (localStorage.getItem("user")) {
    document.getElementById("loginLink")?.style.setProperty("display", "none");
    document.getElementById("registerLink")?.style.setProperty("display", "none");
    logoutBtn.style.display = "inline-block";
  }
});
