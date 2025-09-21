import React, { useEffect, useState } from 'react'
import { auth, db } from './firebase'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, addDoc, onSnapshot, doc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'

function useCollection(path, q=null){
  const [docs, setDocs] = useState([])
  useEffect(()=>{
    let col = collection(db, path)
    let unsub
    if(q) unsub = onSnapshot(query(col, ...q), snapshot => setDocs(snapshot.docs.map(d=>({id:d.id, ...d.data()}))))
    else unsub = onSnapshot(col, snapshot => setDocs(snapshot.docs.map(d=>({id:d.id, ...d.data()}))))
    return ()=> unsub && unsub()
  }, [path])
  return docs
}

export default function App(){
  const [view, setView] = useState('home')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(()=> onAuthStateChanged(auth,u=>{ setUser(u); setLoading(false)}),[])
  if(loading) return <div className="center">Loading...</div>
  const isAdmin = localStorage.getItem('demoAdmin')==='true' || user?.email?.toLowerCase() === 'admin@demo.com'
  return (
    <div className="page">
      <Header setView={setView} user={user} onLogout={()=>{ signOut(auth); localStorage.removeItem('demoAdmin'); setUser(null); setView('home'); }} isAdmin={isAdmin} />
      <main className="main">
        {view==='home' && <Home user={user} setView={setView} />}
        {view==='login' && <Auth setView={setView} />}
        {view==='admin' && <Admin user={user} isAdmin={isAdmin} />}
        {view==='product' && <ProductPage />}
      </main>
      <FloatingChat user={user} />
    </div>
  )
}

function Header({setView,user,onLogout,isAdmin}){
  return <header className="header">
    <div className="left">
      <div className="logoIcon">👜</div>
      <div className="brand">DarkStore</div>
    </div>
    <nav className="nav">
      <button onClick={()=>setView('home')}>Home</button>
      {!isAdmin && <button onClick={()=>setView('login')}>Login</button>}
      {isAdmin && <button onClick={()=>setView('admin')}>Admin Panel</button>}
      {user && <button onClick={onLogout}>Logout</button>}
    </nav>
  </header>
}

function Home({user,setView}){
  const products = useCollection('products', [orderBy('createdAt','desc')])
  return <div className="container">
    <h1 className="title">Welcome to DarkStore</h1>
    <div className="grid">{products.map(p=>(
      <div className="card" key={p.id}>
        <h3>{p.name}</h3>
        <p className="desc">{p.description}</p>
        <div className="price">₹{p.price}</div>
        <div className="actions">
          <button onClick={()=>{ localStorage.setItem('openProduct', JSON.stringify(p)); window.location.reload() }}>View</button>
          <button className="buy" onClick={async ()=>{
            if(!user && localStorage.getItem('demoAdmin')!=='true') return alert('Login first')
            await addDoc(collection(db,'chats'),{
              productId: p.id,
              productName: p.name,
              participants: [user? user.uid : 'guest', 'admin'],
              createdAt: serverTimestamp()
            })
            alert('Chat created. Open floating chat to message admin.')
            setView('product')
          }}>Buy / Chat</button>
        </div>
      </div>
    ))}</div>
  </div>
}

function ProductPage(){ 
  const product = JSON.parse(localStorage.getItem('openProduct')||'null')
  if(!product) return <div style={{padding:20}}>Select product from Home</div>
  return <div style={{padding:20}} className="productPage">
    <h2>{product.name}</h2>
    <p>{product.description}</p>
    <div className="price">Price: ₹{product.price}</div>
    <p className="muted">Use floating chat to talk to admin for payment.</p>
  </div>
}

function Auth({setView}){
  const [mode,setMode] = useState('login')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')

  async function submit(e){
    e.preventDefault()
    if(mode==='login'){
      if(email==='admin' && password==='adminTAZTK'){ localStorage.setItem('demoAdmin','true'); alert('Admin demo logged in'); window.location.reload(); return }
      try{ await signInWithEmailAndPassword(auth,email,password) }catch(e){ alert(e.message) }
    } else {
      try{ await createUserWithEmailAndPassword(auth,email,password) }catch(e){ alert(e.message) }
    }
  }

  return <div className="auth">
    <div className="card authcard">
      <h2>{mode==='login'?'Login to DarkStore':'Create Account'}</h2>
      <form onSubmit={submit}>
        <label>Email or username</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="email or 'admin'"/>
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)}/>
        <button className="big">{mode==='login'?'Login':'Create Account'}</button>
      </form>
      <p className="muted" onClick={()=>setMode(mode==='login'?'signup':'login')}>{mode==='login'?"Don't have account? Create":"Already have? Login"}</p>
    </div>
  </div>
}

function Admin({user,isAdmin}){
  const products = useCollection('products', [orderBy('createdAt','desc')])
  const chats = useCollection('chats', [orderBy('createdAt','desc')])
  const [name,setName] = useState('')
  const [price,setPrice] = useState('')
  const [desc,setDesc] = useState('')

  async function addProduct(){
    if(!name||!price) return alert('Fill name and price')
    await addDoc(collection(db,'products'),{name,price:Number(price),description:desc,createdAt:serverTimestamp()})
    setName(''); setPrice(''); setDesc('')
  }
  async function deleteProduct(id){ if(window.confirm('Delete?')) await deleteDoc(doc(db,'products',id)) }

  if(!isAdmin) return <div style={{padding:20}}>Admin access required.</div>

  return <div style={{padding:20}}>
    <h2>Admin Panel</h2>
    <div className="admingrid">
      <div className="panel">
        <h3>Add product</h3>
        <input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
        <input placeholder="Price" value={price} onChange={e=>setPrice(e.target.value)}/>
        <textarea placeholder="Description" value={desc} onChange={e=>setDesc(e.target.value)}/>
        <button onClick={addProduct}>Add Product</button>
      </div>
      <div className="panel">
        <h3>Products</h3>
        {products.map(p=> <div className="prodrow" key={p.id}><div>{p.name} - ₹{p.price}</div><div><button onClick={()=>deleteProduct(p.id)}>Delete</button></div></div>)}
      </div>
      <div className="panel">
        <h3>Chats</h3>
        {chats.map(c=> <ChatRow key={c.id} chat={c} />)}
      </div>
    </div>
  </div>
}

function ChatRow({chat}){
  const [msg,setMsg]=useState('')
  const msgs = useCollection(`chats/${chat.id}/messages`, [orderBy('createdAt','asc')])
  async function send(){ if(!msg) return; await addDoc(collection(db,`chats/${chat.id}/messages`),{from:'admin',text:msg,createdAt:serverTimestamp()}); setMsg('') }
  return <div className="chatrow">
    <div><b>{chat.productName}</b><div className="muted">id: {chat.id}</div></div>
    <div className="msgs">{msgs.map(m=> <div key={m.id} className={m.from==='admin'?'msg admin':'msg user'}>{m.text}</div>)}</div>
    <div className="chatinput"><input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Reply as admin"/><button onClick={send}>Send</button></div>
  </div>
}

function FloatingChat({user}){
  const [open,setOpen]=useState(false)
  const chats = useCollection('chats', [orderBy('createdAt','desc')])
  const [selected, setSelected] = useState(null)
  const msgs = selected ? useCollection(`chats/${selected.id}/messages`, [orderBy('createdAt','asc')]) : []
  const [text,setText]=useState('')

  useEffect(()=>{ if(open && !selected && chats.length>0) setSelected(chats[0]) }, [open,chats])

  async function send(){ if(!selected) return alert('No chat'); await addDoc(collection(db,`chats/${selected.id}/messages`),{from: user? user.uid : 'guest', text, createdAt: serverTimestamp()}); setText('') }

  return <>
    <div className="float" onClick={()=>{ if(!localStorage.getItem('demoAdmin') && !user) return alert('Login first or use admin'); setOpen(v=>!v) }}>
      <div className="bubble">💬</div>
    </div>
    {open && <div className="chatbox">
      <div className="chatlist">{chats.map(c=> <div key={c.id} className={selected?.id===c.id?'chatitem sel':'chatitem'} onClick={()=>setSelected(c)}><b>{c.productName}</b><div className="muted">{c.id}</div></div>)}</div>
      <div className="chatpane">
        <div className="messages">{msgs.map(m=> <div key={m.id} className={m.from==='admin'?'msg admin':'msg user'}>{m.text}</div>)}</div>
        <div className="send"><input value={text} onChange={e=>setText(e.target.value)} placeholder="Message..."/><button onClick={send}>Send</button></div>
      </div>
    </div>}
  </>
}
