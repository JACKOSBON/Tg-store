# CARDERS HUB — Dark Theme Demo

Files:
- login.html — Dark-themed login screen (matches your provided UI)
- home.html — Home page with same theme, featured course, course list and chat box
- style.css — Dark + orange accent styling
- firebase-config.js — Your Firebase config (already inserted)
- app.js — Simple app logic (auth, purchases, chat)
- README.md — This file

Steps:
1. In Firebase Console enable Email/Password auth.
2. Create a Firestore database.
3. Serve these files (open login.html or home.html via a static server).
4. Sign up / log in. When logged in as email you will be treated as admin in the UI.

Notes:
- This is a demo. Secure Firestore rules before production.
- Manual payment flow: user buys a course -> `purchases` doc created -> `chats/{chatId}` created -> messages exchanged to confirm payment.
