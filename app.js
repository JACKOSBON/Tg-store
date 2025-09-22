import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, onSnapshot, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

// init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const adminEmail = 'admin@gmail.com';

// sample courses
const sampleCourses = [
  { id: 'c1', title: 'Course 1: Basics', price: '₹499' },
  { id: 'c2', title: 'Course 2: Advanced', price: '₹799' }
];

// --- Helpers ---
function $id(id){ return document.getElementById(id); }
function qs(sel){ return document.querySelector(sel); }

// --- Page specific logic ---
const path = location.pathname.split('/').pop();

// LOGIN page
if(path === '' || path === 'index.html'){
  $id('signupBtn').addEventListener('click', async (e)=>{
    e.preventDefault();
    const email = prompt('Enter email:');
    const pass = prompt('Enter password:');
    if(!email || !pass) return alert('Cancelled');
    try{ await createUserWithEmailAndPassword(auth, email, pass); alert('Account created. Please login.'); }
    catch(err){ alert(err.message); }
  });

  $id('loginBtn').addEventListener('click', async (e)=>{
    e.preventDefault();
    const email = $id('email').value.trim();
    const pass = $id('password').value;
    if(!email || !pass) return alert('Enter credentials');
    try{ await signInWithEmailAndPassword(auth, email, pass); window.location.href='home.html'; }
    catch(err){ alert(err.message); }
  });

  $id('forgotPassword').addEventListener('click', async (e)=>{
    e.preventDefault();
    const email = $id('email').value.trim();
    if(!email) return alert('Enter email to reset');
    try{ await sendPasswordResetEmail(auth, email); alert('Reset email sent'); }
    catch(err){ alert(err.message); }
  });
}

// AUTH state and shared UI
onAuthStateChanged(auth, async (user)=>{
  const userEmailEl = $id('userEmail'); if(userEmailEl) userEmailEl.textContent = user ? user.email : '';
  // if admin page and not admin -> redirect
  if(path === 'admin.html'){
    if(!user) return location.href='index.html';
    if(user.email !== adminEmail) return alert('Access denied: admin only.') && (location.href='home.html');
  }
  // if home page, render courses
  if(path === 'home.html'){
    renderCourses();
    if(!user) return; // purchases/chat require login
    loadPurchases(user);
  }
  // if chat page, initialize chat listener based on ?chatId=...
  if(path === 'chat.html'){
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chatId');
    if(!chatId) return alert('No chat specified') && (location.href='home.html');
    initChat(chatId, user);
    $id('backHome').addEventListener('click', ()=> location.href='home.html');
  }
  if(path === 'admin.html') loadAdmin();
});

// --- Home functions ---
function renderCourses(){
  const el = $id('courseList');
  if(!el) return;
  el.innerHTML = '';
  sampleCourses.forEach(c=>{
    const card = document.createElement('div'); card.className='course-card card';
    card.innerHTML = `<h3>${c.title}</h3><p class="muted">${c.price}</p><div class="row"><button data-id="${c.id}" class="btn primary buy">Buy</button><button data-id="${c.id}" class="btn ghost small open-chat">Open Chat</button></div>`;
    el.appendChild(card);
  });
  // buy buttons
  document.querySelectorAll('.buy').forEach(b=> b.addEventListener('click', async (ev)=>{
    const id = ev.currentTarget.dataset.id;
    const user = auth.currentUser;
    if(!user) return alert('Please login first'); 
    const course = sampleCourses.find(x=>x.id===id);
    // create purchase and chat
    try{
      const purchaseRef = await addDoc(collection(db,'purchases'),{
        userId: user.uid, userEmail: user.email, courseId: course.id, courseTitle: course.title, status:'pending_manual_payment', createdAt: serverTimestamp()
      });
      const chatRef = await addDoc(collection(db,'chats'),{ participants:[user.email, adminEmail], purchaseId: purchaseRef.id, courseTitle: course.title, createdAt: serverTimestamp() });
      await addDoc(collection(db,'chats', chatRef.id, 'messages'),{ sender: user.email, text: `I purchased ${course.title}`, timestamp: serverTimestamp() });
      alert('Purchase created. Open chat to confirm payment.'); 
      location.href = `chat.html?chatId=${chatRef.id}`;
    }catch(err){ alert(err.message); }
  }));
  document.querySelectorAll('.open-chat').forEach(b=> b.addEventListener('click', async (ev)=>{
    const user = auth.currentUser;
    if(!user) return alert('Please login first'); 
    const snaps = await getDocs(query(collection(db,'chats'), where('participants','array-contains', user.email), orderBy('createdAt','desc')));
    if(!snaps.empty){ location.href = `chat.html?chatId=${snaps.docs[0].id}`; }
    else alert('No chat found — click Buy to create one.');
  }));
}

// load purchases for user
async function loadPurchases(user){
  const el = $id('purchases');
  const q = query(collection(db,'purchases'), where('userId','==', user.uid));
  const snaps = await getDocs(q);
  if(snaps.empty){ el.textContent = 'No purchases yet.'; return; }
  el.innerHTML='';
  snaps.forEach(docSnap=>{
    const p = docSnap.data();
    const div = document.createElement('div'); div.className='card'; div.innerHTML = `<strong>${p.courseTitle}</strong> — <em>${p.status}</em> <div class="row"><button data-id="${docSnap.id}" class="btn small ghost open-chat-purchase">Open Chat</button></div>`;
    el.appendChild(div);
  });
  document.querySelectorAll('.open-chat-purchase').forEach(b=> b.addEventListener('click', async (ev)=>{
    const pid = ev.currentTarget.dataset.id;
    const snaps = await getDocs(query(collection(db,'chats'), where('purchaseId','==', pid), orderBy('createdAt','desc')));
    if(!snaps.empty) location.href = `chat.html?chatId=${snaps.docs[0].id}`;
    else alert('No chat for this purchase.');
  }));
}

// --- Chat ---
function initChat(chatId, user){
  const msgEl = $id('messages');
  const title = $id('chatTitle');
  if(!chatId) return;
  title.textContent = 'Chat';
  // listen messages
  const messagesRef = collection(db,'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp'));
  onSnapshot(q, snap=>{
    msgEl.innerHTML='';
    snap.forEach(d=>{
      const m = d.data();
      const div = document.createElement('div');
      div.className='card message';
      if(m.sender===adminEmail) div.classList.add('muted');
      div.textContent = `${m.sender}: ${m.text}`;
      msgEl.appendChild(div);
    });
    msgEl.scrollTop = msgEl.scrollHeight;
  });
  // send
  $id('sendBtn').addEventListener('click', async ()=>{
    const txt = $id('chatInput').value.trim(); if(!txt) return;
    try{ await addDoc(collection(db,'chats', chatId, 'messages'), { sender: user.email, text: txt, timestamp: serverTimestamp() }); $id('chatInput').value=''; }
    catch(err){ alert(err.message); }
  });
}

// --- Admin ---
async function loadAdmin(){
  // purchases list
  const purchasesEl = $id('adminPurchases');
  const snaps = await getDocs(query(collection(db,'purchases'), orderBy('createdAt','desc')));
  purchasesEl.innerHTML='';
  snaps.forEach(s=>{
    const d = s.data();
    const div = document.createElement('div'); div.className='card'; div.innerHTML = `<strong>${d.courseTitle}</strong> by ${d.userEmail} — <em>${d.status}</em> <div class="row"><button data-id="${s.id}" class="btn small mark-complete">Mark Complete</button><button data-id="${s.id}" class="btn small open-chat-admin">Open Chat</button></div>`;
    purchasesEl.appendChild(div);
  });
  document.querySelectorAll('.mark-complete').forEach(b=> b.addEventListener('click', async (ev)=>{
    const id = ev.currentTarget.dataset.id; await addDoc(collection(db,'audit'), { action:'mark_complete', purchaseId:id, time: serverTimestamp() }); alert('Marked (demo)'); loadAdmin();
  }));
  // chats list
  const chatsEl = $id('adminChats'); chatsEl.innerHTML='';
  const snaps2 = await getDocs(query(collection(db,'chats'), orderBy('createdAt','desc')));
  snaps2.forEach(s=>{ const d=s.data(); const div=document.createElement('div'); div.className='card'; div.innerHTML = `<strong>${d.courseTitle}</strong> — ${d.participants.join(', ')} <div class="row"><button data-id="${s.id}" class="btn small open-chat-admin">Open Chat</button></div>`; chatsEl.appendChild(div); });
  document.querySelectorAll('.open-chat-admin').forEach(b=> b.addEventListener('click', ev=> location.href = `chat.html?chatId=${ev.currentTarget.dataset.id}`));
}

// --- logout handler for pages with logout element ---
if(document.getElementById('logout')){
  document.getElementById('logout').addEventListener('click', async ()=>{ await signOut(auth); location.href='index.html'; });
}

// --- small guard for home logout or other actions ---
if(document.getElementById('backHome')){
  document.getElementById('backHome').addEventListener('click', ()=> location.href='home.html');
}
