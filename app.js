const auth = firebase.auth();
const db = firebase.firestore();

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const chatBtn = document.getElementById("chatBtn");
const adminBtn = document.getElementById("adminBtn");
const productList = document.getElementById("product-list");

if(loginBtn){ loginBtn.onclick = ()=> window.location.href = "login.html"; }
if(logoutBtn){ logoutBtn.onclick = ()=> auth.signOut(); }
if(chatBtn){ chatBtn.onclick = ()=> alert("Chat feature coming soon!"); }
if(adminBtn){ adminBtn.onclick = ()=> alert("Admin panel coming soon!"); }

auth.onAuthStateChanged(user=>{
  if(user){
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    chatBtn.style.display = "inline-block";
    // check admin role
    db.collection("admins").doc(user.uid).get().then(doc=>{
      if(doc.exists){ adminBtn.style.display = "inline-block"; }
    });
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    chatBtn.style.display = "none";
    adminBtn.style.display = "none";
  }
});

// Load products
db.collection("products").onSnapshot(snapshot=>{
  productList.innerHTML = "";
  snapshot.forEach(doc=>{
    const p = doc.data();
    productList.innerHTML += `<div class='product'><h3>${p.name}</h3><p>${p.price}₹</p></div>`;
  });
});