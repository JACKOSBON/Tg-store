// ====== CONFIG - REPLACE these with your values AFTER worker deploy =====
const WORKER_BASE = 'https://REPLACE_WITH_YOUR_WORKER_URL'; // e.g. https://myworker.account.workers.dev
const CLIENT_API_KEY = 'REPLACE_WITH_CLIENT_API_KEY'; // same as API_KEY secret in Cloudflare
// =========================================================================

/* app.js - frontend logic: products, users, chats */
(async function(){
  // small helpers to call worker
  async function saveDataToRepo(key, data){
    try {
      const r = await fetch(WORKER_BASE + '/save', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'x-api-key': CLIENT_API_KEY },
        body: JSON.stringify({ key, data })
      });
      return await r.json();
    } catch(e){ console.error('save err',e); return { error:String(e) } }
  }
  async function loadDataFromRepo(key){
    try {
      const r = await fetch(WORKER_BASE + '/get?key=' + encodeURIComponent(key));
      const j = await r.json();
      return j.data;
    } catch(e){ console.error('load err',e); return null }
  }

  // seed fallback data (local) and sync to repo if empty
  async function ensureSeed(){
    // users
    let users = await loadDataFromRepo('users');
    if(!users){
      users = [{username:'admin', password:'adminTAZTK', isAdmin:true, fullName:'Admin', banned:false}];
      await saveDataToRepo('users', users);
    }
    localStorage.setItem('users', JSON.stringify(users));

    // products
    let products = await loadDataFromRepo('products');
    if(!products){
      products = [
        { id:'p1', title:'Premium Smartphone', price:599.99, desc:'Flagship performance' },
        { id:'p2', title:'Wireless Headphones', price:199.99, desc:'Noise cancelling' },
        { id:'p3', title:'Smart Watch', price:149.99, desc:'Fitness + notifications' }
      ];
      await saveDataToRepo('products', products);
    }
    localStorage.setItem('products', JSON.stringify(products));
  }

  await ensureSeed();

  // UI helpers
  const productsEl = document.getElementById('products');
  const tpl = document.getElementById('product-card');
  const authBtn = document.getElementById('authBtn');
  const adminNav = document.getElementById('adminNav');

  function getCurrentUser(){ return JSON.parse(localStorage.getItem('currentUser')||'null'); }
  function setCurrentUser(u){ localStorage.setItem('currentUser', JSON.stringify(u)); }

  // render products
  async function renderProducts(){
    const products = JSON.parse(localStorage.getItem('products')||'[]');
    productsEl.innerHTML = '';
    for(const p of products){
      const node = tpl.content.cloneNode(true);
      node.querySelector('.card-img').textContent = (p.title.split(' ')[0] || 'Item');
      node.querySelector('.card-title').textContent = p.title;
      node.querySelector('.price').textContent = `$${Number(p.price).toFixed(2)}`;
      const chatBtn = node.querySelector('.chat-btn');
      chatBtn.addEventListener('click', ()=> openChat(p.id));
      const buyBtn = node.querySelector('.buy-btn');
      buyBtn.addEventListener('click', ()=> markPaid(p.id));
      productsEl.appendChild(node);
    }
  }

  // auth UI
  function updateAuthUI(){
    const cur = getCurrentUser();
    if(cur){
      authBtn.textContent = cur.username + ' ⮟';
      authBtn.onclick = ()=>{
        if(confirm('Logout?')){ localStorage.removeItem('currentUser'); updateAuthUI(); window.location.href='index.html' }
      }
      if(cur.isAdmin) adminNav.style.display = 'inline';
    } else {
      authBtn.textContent = 'Login';
      authBtn.onclick = ()=> window.location.href = 'login.html';
      adminNav.style.display = 'none';
    }
  }
  updateAuthUI();

  // Chat modal logic
  const chatModal = document.getElementById('chatModal');
  const chatMessages = document.getElementById('chatMessages');
  const chatText = document.getElementById('chatText');
  const sendChat = document.getElementById('sendChat');
  const closeChat = document.getElementById('closeChat');
  let activeProductId = null;

  async function openChat(pid){
    const cur = getCurrentUser();
    if(!cur){ if(confirm('Login to chat?')) window.location.href='login.html'; return; }
    if(cur.banned){ alert('Your account is banned'); return; }
    activeProductId = pid;
    const products = JSON.parse(localStorage.getItem('products')||'[]');
    const p = products.find(x=>x.id===pid);
    document.getElementById('chatProductTitle').innerText = `Chat about: ${p.title}`;
    chatModal.classList.remove('hidden');
    await renderMessages(pid);
  }

  async function renderMessages(pid){
    const chats = (await loadDataFromRepo(`chats_${pid}`)) || [];
    chatMessages.innerHTML = '';
    for(const m of chats){
      const div = document.createElement('div');
      div.className = 'bubble ' + (m.sender === 'admin' ? 'bubble-admin' : 'bubble-user');
      const who = m.sender === 'admin' ? 'Admin' : (m.user || 'User');
      div.innerHTML = `<div class="meta">${who} • ${new Date(m.time).toLocaleString()}</div><div>${m.text}${m.paid? ' <span class="paid-tag">PAID</span>':''}</div>`;
      chatMessages.appendChild(div);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendChat.addEventListener('click', async ()=>{
    const text = chatText.value.trim();
    if(!text || !activeProductId) return;
    const cur = getCurrentUser();
    const key = `chats_${activeProductId}`;
    const chats = (await loadDataFromRepo(key)) || [];
    chats.push({ sender:'user', user:cur.username, text, time:Date.now(), read:false, paid:false });
    await saveDataToRepo(key, chats);
    chatText.value='';
    await renderMessages(activeProductId);
    alert('Message saved — admin will see it in Admin Panel');
  });

  closeChat.addEventListener('click', ()=> { chatModal.classList.add('hidden'); activeProductId=null });

  // mark paid (user declares manual payment)
  async function markPaid(pid){
    const cur = getCurrentUser();
    if(!cur){ if(confirm('Login to mark paid?')) window.location.href='login.html'; return; }
    const key = `chats_${pid}`;
    const chats = (await loadDataFromRepo(key)) || [];
    chats.push({ sender:'user', user:cur.username, text:'I have paid manually', time:Date.now(), paid:true });
    await saveDataToRepo(key, chats);
    alert('Marked as paid (manual). Admin will see it.');
  }

  // ADMIN PAGE LOGIC (exposed when admin opens admin.html)
  if(location.pathname.endsWith('admin.html')){
    const cur = getCurrentUser();
    if(!cur || !cur.isAdmin){ alert('Admin login required'); window.location.href='login.html'; }
    // wire logout
    document.getElementById('logoutBtn').addEventListener('click', ()=>{ localStorage.removeItem('currentUser'); window.location.href='index.html' });

    const addForm = document.getElementById('addProductForm');
    const productsContainer = document.getElementById('adminProducts');
    const usersContainer = document.getElementById('adminUsers');
    const chatsList = document.getElementById('chatsList');

    async function refreshAdminUI(){
      const products = (await loadDataFromRepo('products')) || [];
      localStorage.setItem('products', JSON.stringify(products));
      productsContainer.innerHTML = '';
      for(const p of products){
        const card = document.createElement('div'); card.className='admin-card';
        card.innerHTML = `<h3>${p.title}</h3><p class="muted">$${p.price}</p><div class="admin-actions">
          <button class="btn edit" data-id="${p.id}">Edit</button>
          <button class="btn del" data-id="${p.id}">Delete</button>
          <button class="btn open-chat" data-id="${p.id}">Open Chats</button>
        </div>`;
        productsContainer.appendChild(card);
      }

      const users = (await loadDataFromRepo('users')) || [];
      localStorage.setItem('users', JSON.stringify(users));
      usersContainer.innerHTML = '';
      for(const u of users){
        const row = document.createElement('div'); row.className='admin-card';
        row.innerHTML = `<strong>${u.username}</strong> ${u.isAdmin?'<span class="pill small green">ADMIN</span>':''} ${u.banned?'<span class="pill small red">BANNED</span>':''}
          <div class="admin-actions">
            <button class="btn ban" data-id="${u.username}">${u.banned?'Unban':'Ban'}</button>
            <button class="btn remove" data-id="${u.username}">Remove</button>
          </div>`;
        usersContainer.appendChild(row);
      }

      // chats list
      chatsList.innerHTML = '';
      // fetch products and for each product check chats
      for(const p of products){
        const cs = (await loadDataFromRepo(`chats_${p.id}`)) || [];
        if(cs.length===0) continue;
        const last = cs[cs.length-1];
        const card = document.createElement('div'); card.className='admin-card';
        card.innerHTML = `<h3>${p.title}</h3><p class="muted">Last: ${new Date(last.time).toLocaleString()}</p>
          <p>${last.sender==='admin'?'Admin':'User'}: ${String(last.text).slice(0,80)}</p>
          <div class="admin-actions"><button class="btn open-chat" data-id="${p.id}">Open</button></div>`;
        chatsList.appendChild(card);
      }
    }

    await refreshAdminUI();

    addForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const title = document.getElementById('pTitle').value.trim();
      const price = Number(document.getElementById('pPrice').value);
      if(!title || !price) return alert('Fill fields');
      const products = (await loadDataFromRepo('products')) || [];
      const id = 'p' + (Date.now());
      products.push({ id, title, price });
      await saveDataToRepo('products', products);
      await refreshAdminUI();
      alert('Product added');
      addForm.reset();
    });

    // delegate admin buttons
    document.body.addEventListener('click', async (ev)=>{
      const t = ev.target;
      if(t.matches('.del')){
        const id = t.dataset.id;
        if(!confirm('Delete product?')) return;
        let products = (await loadDataFromRepo('products')) || [];
        products = products.filter(p=>p.id!==id);
        await saveDataToRepo('products', products);
        await refreshAdminUI();
      } else if(t.matches('.edit')){
        const id = t.dataset.id;
        const products = (await loadDataFromRepo('products')) || [];
        const p = products.find(x=>x.id===id);
        const newTitle = prompt('Title', p.title);
        const newPrice = prompt('Price', p.price);
        if(newTitle && newPrice){
          p.title = newTitle; p.price = Number(newPrice);
          await saveDataToRepo('products', products);
          await refreshAdminUI();
        }
      } else if(t.matches('.ban')){
        const username = t.dataset.id;
        const users = (await loadDataFromRepo('users')) || [];
        const u = users.find(x=>x.username===username);
        u.banned = !u.banned;
        await saveDataToRepo('users', users);
        await refreshAdminUI();
      } else if(t.matches('.remove')){
        const username = t.dataset.id;
        if(!confirm('Remove user?')) return;
        let users = (await loadDataFromRepo('users')) || [];
        users = users.filter(x=>x.username!==username);
        await saveDataToRepo('users', users);
        await refreshAdminUI();
      } else if(t.matches('.open-chat')){
        const pid = t.dataset.id;
        openAdminChat(pid);
      }
    });

    // admin chat modal
    const adminChatModal = document.getElementById('adminChatModal');
    const adminChatMessages = document.getElementById('adminChatMessages');
    const adminChatText = document.getElementById('adminChatText');
    const adminSend = document.getElementById('adminSend');
    const closeAdminChat = document.getElementById('closeAdminChat');
    const markPaid = document.getElementById('markPaid');
    let activePid = null;

    async function openAdminChat(pid){
      activePid = pid;
      const products = (await loadDataFromRepo('products')) || [];
      const p = products.find(x=>x.id===pid);
      document.getElementById('adminChatTitle').innerText = `Chat — ${p.title}`;
      adminChatModal.classList.remove('hidden');
      await renderAdminMessages(pid);
    }

    async function renderAdminMessages(pid){
      const chats = (await loadDataFromRepo(`chats_${pid}`)) || [];
      adminChatMessages.innerHTML = '';
      for(const m of chats){
        const el = document.createElement('div');
        el.className = 'bubble ' + (m.sender==='admin' ? 'bubble-admin' : 'bubble-user');
        el.innerHTML = `<div class="meta">${m.sender==='admin' ? 'Admin' : (m.user||'User')} • ${new Date(m.time).toLocaleString()}</div><div>${m.text}${m.paid?'<span class="paid-tag"> PAID</span>':''}</div>`;
        adminChatMessages.appendChild(el);
      }
      adminChatMessages.scrollTop = adminChatMessages.scrollHeight;
    }

    closeAdminChat.addEventListener('click', ()=>{ adminChatModal.classList.add('hidden'); activePid=null; });

    adminSend.addEventListener('click', async ()=>{
      if(!activePid) return;
      const text = adminChatText.value.trim(); if(!text) return;
      const key = `chats_${activePid}`;
      const chats = (await loadDataFromRepo(key)) || [];
      chats.push({ sender:'admin', text, time:Date.now() });
      await saveDataToRepo(key, chats);
      adminChatText.value='';
      await renderAdminMessages(activePid);
      await refreshAdminUI();
    });

    markPaid.addEventListener('click', async ()=>{
      if(!activePid) return;
      const key = `chats_${activePid}`;
      const chats = (await loadDataFromRepo(key)) || [];
      chats.push({ sender:'admin', text:'Marked as PAID by admin', time:Date.now(), paid:true });
      await saveDataToRepo(key, chats);
      await renderAdminMessages(activePid);
      await refreshAdminUI();
    });
  }

  // initial render
  await renderProducts();
  updateAuthUI();

})();
