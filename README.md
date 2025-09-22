# CARDERS HUB — Responsive Package (Cloudflare-ready)

Files:
- index.html (login)
- home.html (courses + purchases)
- chat.html (separate chat page)
- admin.html (admin panel — only admin allowed)
- style.css (responsive dark theme)
- firebase-config.js (your firebase config)
- app.js (client logic using modular Firebase SDK)
- README.md (this file)

Deployment notes:
1. Push this folder to GitHub and connect to Cloudflare Pages (root directory).
2. In Firebase Console → Authentication → Authorized domains: add your deployed domain (e.g. your-site.pages.dev or custom domain).
3. Enable Email/Password sign-in in Firebase Authentication..

Security note:
- This is a front-end demo. Add Firestore security rules before production (restrict writes/reads; server-side admin checks).

