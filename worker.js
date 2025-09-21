export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/register" && request.method === "POST") {
      let data = await request.json();
      let users = JSON.parse(await env.DB.get("users") || "[]");

      if (users.find(u => u.username === data.username)) {
        return new Response(JSON.stringify({ success: false, message: "User exists" }), { status: 400 });
      }

      users.push(data);
      await env.DB.put("users", JSON.stringify(users));
      return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/login" && request.method === "POST") {
      let data = await request.json();
      let users = JSON.parse(await env.DB.get("users") || "[]");

      let user = users.find(u => u.username === data.username && u.password === data.password);
      if (user) {
        return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ success: false, message: "Invalid credentials" }), { status: 401 });
    }

    return new Response("Not Found", { status: 404 });
  }
};
