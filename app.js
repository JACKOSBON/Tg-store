// App behavior connecting UI with Firebase (simple demo)
// Admin email (treated as admin when signed in)
const adminEmail = "admin@gmail.com";

const sampleCourses = [
  { id: "c-js", title: "Mastering JavaScript", price: "₹999" },
  { id: "c-web", title: "Beginner Web Development", price: "₹499" },
  { id: "c-fb", title: "Fullstack with Firebase", price: "₹799" }
];

let currentUser = null;
let currentChatId = null;

// render course list
function renderCourses(){
  const el = document.getElementById('course-list');
  if(!el) return;
  el.innerHTML = '';
  sampleCourses.forEach(c=>{
    const d = document.createElement('div');
    d.className = 'course';
    d.innerHTML = `<h3>${c.title}</h3><p class="muted">${c.price} — short description.</p>
      <div class="row"><button data-id="${c.id}" class="btn small primary buy-btn">Buy</button></div>`;
    el.appendChild(d);
  });
}

// buy flow: create purchase and chat
async function onBuy(e){
  const courseId = e.target.dataset.id;
  const course = sampleCourses.find(x=>x.id===courseId);
  if(!currentUser){ alert('Please login first.'); window.location.href='login.html'; return; }
  const purchaseRef = await db.collection('purchases').add({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    courseId: course.id,
    courseTitle: course.title,
    price: course.price,
    status: 'pending_manual_payment',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  const chatDoc = await db.collection('chats').add({
    participants: [currentUser.email, adminEmail],
    purchaseId: purchaseRef.id,
    courseTitle: course.title,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await db.collection('chats').doc(chatDoc.id).collection('messages').add({
    sender: currentUser.email,
    text: `Hi Admin, I want to buy "${course.title}". I have completed payment. Please confirm.`,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  alert('Purchase recorded. Open chat to confirm manual payment.');
  openChat(chatDoc.id);
}

// open chat and listen
function openChat(chatId){
  currentChatId = chatId;
  const messagesEl = document.getElementById('messages');
  if(!messagesEl) return;
  messagesEl.innerHTML = '';
  db.collection('chats').doc(chatId).collection('messages').orderBy('timestamp')
    .onSnapshot(snap=>{
      messagesEl.innerHTML = '';
      snap.forEach(doc=>{
        const m = doc.data();
        const div = document.createElement('div');
        div.className = 'message' + (m.sender===adminEmail ? ' admin' : '');
        div.textContent = `${m.sender}: ${m.text}`;
        messagesEl.appendChild(div);
      });
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
}

// auth state
auth.onAuthStateChanged(user=>{
  currentUser = user;
  const userEmailEl = document.getElementById('user-email');
  if(user){
    if(userEmailEl) userEmailEl.textContent = user.email;
    // if admin, show admin-only actions (not implemented fully here)
    if(user.email === adminEmail){
      // admin UI could be enhanced
    }
    // try to load user's chat if exists: latest chat where user is participant
    db.collection('chats').where('participants','array-contains', user.email).limit(1).get()
      .then(q=>{
        if(!q.empty){
          openChat(q.docs[0].id);
        }
      });
  } else {
    if(userEmailEl) userEmailEl.textContent = '';
    // redirect to login if on pages that require auth
  }
});

// initial render
renderCourses();
