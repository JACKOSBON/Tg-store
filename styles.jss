:root{--bg:#f6f7fb;--card:#fff;--accent1:#6f2ce8;--accent2:#2187ff;--muted:#717171}
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,Arial;background:var(--bg);color:#222}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;background:linear-gradient(135deg,var(--accent1),var(--accent2));color:#fff;box-shadow:0 6px 14px rgba(0,0,0,0.12)}
.brand{display:flex;gap:12px;align-items:center}.brand-icon{width:56px;height:56px;border-radius:12px;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;font-size:26px}
.brand-title{font-weight:800;font-size:20px}.brand-sub{font-weight:800;font-size:20px;margin-top:-6px}
.nav{display:flex;gap:18px;align-items:center}.nav a{color:rgba(255,255,255,0.96);text-decoration:none;font-weight:600}.pill{background:rgba(255,255,255,0.14);border:none;padding:10px 18px;border-radius:12px;color:#fff}
.container{max-width:920px;margin:36px auto;padding:0 18px}.page-title{font-size:36px;margin:18px 0;text-align:center;color:#333}
.products-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px}
.card{background:var(--card);border-radius:14px;padding:18px;box-shadow:0 10px 22px rgba(40,40,40,0.06);min-height:220px;display:flex;flex-direction:column;gap:12px}
.card-img{height:120px;background:linear-gradient(135deg,var(--accent1),var(--accent2));border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:22px}
.card-title{font-size:20px;margin:0}.price{font-weight:800;color:var(--accent1);font-size:22px}
.card-actions{margin-top:auto;display:flex;gap:12px}.btn{border:none;padding:12px 18px;border-radius:10px;cursor:pointer;background:#eee;font-weight:700}.btn.primary{background:linear-gradient(90deg,var(--accent1),var(--accent2));color:#fff}.chat-btn{background:linear-gradient(90deg,var(--accent1),#7b3df2);color:#fff}.buy-btn{background:linear-gradient(90deg,#6f2ce8,#6f2ce8);color:#fff}

.auth-container{display:flex;justify-content:center;align-items:flex-start;padding:40px 16px}.auth-card{width:360px;background:var(--card);padding:24px;border-radius:12px;box-shadow:0 12px 30px rgba(20,20,20,0.06)}
.auth-card h2{margin-top:0;text-align:center;color:var(--accent1)}.auth-card label{display:block;margin-bottom:12px;font-weight:700;color:#333}.auth-card input{width:100%;padding:12px;border-radius:8px;border:1px solid #e6e6e6;margin-top:6px}
.muted{color:var(--muted)}.small{font-size:12px}
.modal{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(8,8,8,0.35);display:flex;align-items:center;justify-content:center;z-index:80}.modal.hidden{display:none}
.modal-content{width:100%;max-width:720px;background:#fff;border-radius:14px;padding:18px;position:relative;box-shadow:0 24px 60px rgba(0,0,0,0.2)}.modal .close{position:absolute;right:12px;top:12px;border:none;background:transparent;font-size:18px;cursor:pointer}
.chat-messages{height:360px;overflow:auto;padding:12px;border-radius:8px;background:#fafafa;border:1px solid #f0f0f0;margin-bottom:12px}
.bubble{padding:10px;border-radius:12px;margin-bottom:8px;max-width:78%}.bubble-admin{background:linear-gradient(90deg,var(--accent1),var(--accent2));color:#fff;margin-left:auto}.bubble-user{background:#fff;border:1px solid #eee}
.chat-input-row{display:flex;gap:8px}.chat-input-row input{flex:1;padding:12px;border-radius:10px;border:1px solid #ddd}
.admin-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}.admin-card{background:#fff;padding:16px;border-radius:12px;box-shadow:0 10px 20px rgba(0,0,0,0.04)}
.admin-actions{display:flex;gap:8px;align-items:center;margin-top:8px}.pill.small{padding:6px 10px;border-radius:999px;background:#efefef;font-weight:700}.pill.small.green{background:#e1f7ea;color:#0a8a39}.pill.small.red{background:#ffecec;color:#b30000}
.meta{font-size:11px;color:#666;margin-bottom:6px}.paid-tag{display:inline-block;margin-left:10px;padding:3px 8px;background:#e6ffe8;color:#0a8a39;border-radius:8px;font-weight:700;font-size:12px}
