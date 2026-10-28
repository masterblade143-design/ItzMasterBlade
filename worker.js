/* Anonymous inbox: Cloudflare Worker + D1.
   POST   /api/message        public, anonymous
   GET    /api/messages       admin only (Bearer token)
   DELETE /api/messages/:id   admin only
   GET    /admin              private reader page (needs the token to show anything) */

const MIN_LEN = 3, MAX_LEN = 1000, MAX_BODY = 6000;
const SEND_LIMIT_PER_HOUR = 5;      // messages per visitor per hour
const AUTH_LIMIT_PER_HOUR = 20;     // wrong-password tries per visitor per hour
const TOPICS = ["Feedback", "Question", "Idea", "Just saying hi"];

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    try {
      if (url.pathname === "/api/message" && req.method === "POST") return await submit(req, env, cors);
      if (url.pathname === "/api/messages" && req.method === "GET") return await list(req, env);
      const m = url.pathname.match(/^\/api\/messages\/(\d{1,12})$/);
      if (m && req.method === "DELETE") return await remove(req, env, Number(m[1]));
      if (url.pathname === "/admin" && req.method === "GET") return adminPage();
      return json({ error: "not found" }, 404, cors);
    } catch (e) {
      return json({ error: "server error" }, 500, cors);
    }
  },
};

/* ---------- helpers ---------- */
function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || "").split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
}
function corsHeaders(req, env) {
  const h = { "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" };
  const o = req.headers.get("Origin");
  if (o && allowedOrigins(env).includes(o)) h["Access-Control-Allow-Origin"] = o;
  return h;
}
function json(obj, status, extra) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: Object.assign({ "Content-Type": "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }, extra || {}) });
}
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function safeEqual(a, b) {                       // constant-time comparison via hashes
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let d = 0; for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
}
/* Counts hits per visitor per hour without keeping the IP: only a salted one-way hash that expires. */
async function hit(env, req, scope, limit) {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  const bucket = Math.floor(Date.now() / 3600000);
  const h = await sha256(scope + "|" + ip + "|" + (env.RL_SALT || env.ADMIN_TOKEN || "salt") + "|" + bucket);
  await env.DB.prepare("DELETE FROM rl WHERE b < ?").bind(bucket).run();
  const row = await env.DB.prepare("INSERT INTO rl(h,n,b) VALUES(?,1,?) ON CONFLICT(h) DO UPDATE SET n=n+1 RETURNING n").bind(h, bucket).first();
  return row.n <= limit;
}
async function isAdmin(req, env) {
  if (!env.ADMIN_TOKEN) return "unset";
  if (!(await hit(env, req, "auth", AUTH_LIMIT_PER_HOUR))) return "limited";
  const given = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  return given.length > 0 && (await safeEqual(given, env.ADMIN_TOKEN)) ? "ok" : "no";
}
async function guard(req, env) {
  const a = await isAdmin(req, env);
  if (a === "ok") return null;
  if (a === "unset") return json({ error: "admin token not configured" }, 503);
  if (a === "limited") return json({ error: "too many attempts" }, 429);
  return json({ error: "unauthorized" }, 401);
}

/* ---------- public: submit ---------- */
async function submit(req, env, cors) {
  const origin = req.headers.get("Origin");
  if (origin && !allowedOrigins(env).includes(origin)) return json({ error: "forbidden" }, 403, cors);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "too large" }, 413, cors);
  let body; try { body = JSON.parse(raw); } catch { return json({ error: "bad request" }, 400, cors); }
  if (!body || typeof body !== "object") return json({ error: "bad request" }, 400, cors);

  if (typeof body.hp === "string" && body.hp.length) return json({ ok: true }, 200, cors);   // bot trap: fake success

  let message = typeof body.message === "string" ? body.message.replace(/\r\n/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim() : "";
  message = message.replace(/\n{4,}/g, "\n\n\n");
  if (message.length < MIN_LEN) return json({ error: "message too short" }, 400, cors);
  if (message.length > MAX_LEN) return json({ error: "message too long" }, 400, cors);
  const topic = TOPICS.includes(body.topic) ? body.topic : "Feedback";

  if (!(await hit(env, req, "send", SEND_LIMIT_PER_HOUR))) return json({ error: "slow down" }, 429, cors);

  await env.DB.prepare("INSERT INTO messages(created_at,topic,message) VALUES(?,?,?)").bind(new Date().toISOString(), topic, message).run();
  return json({ ok: true }, 200, cors);
}

/* ---------- admin ---------- */
async function list(req, env) {
  const denied = await guard(req, env); if (denied) return denied;
  const { results } = await env.DB.prepare("SELECT id,created_at,topic,message FROM messages ORDER BY id DESC LIMIT 500").all();
  return json({ messages: results }, 200);
}
async function remove(req, env, id) {
  const denied = await guard(req, env); if (denied) return denied;
  await env.DB.prepare("DELETE FROM messages WHERE id=?").bind(id).run();
  return json({ ok: true }, 200);
}
function adminPage() {
  return new Response(ADMIN_HTML, { headers: {
    "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'",
    "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow" } });
}

const ADMIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Inbox</title>
<style>
:root{color-scheme:dark;--bg:#0b0f24;--card:#141a3d;--line:#2b3270;--text:#e8eaff;--mute:#a4aad8;--acc:#a78bfa}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,"Segoe UI Variable Text","Segoe UI",sans-serif;padding:24px}
main{max-width:760px;margin:0 auto}h1{font-size:1.3rem;margin:0 0 4px}.sub{color:var(--mute);margin:0 0 18px;font-size:.9rem}
input,button{font:inherit;color:inherit}input{width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:#0e1330}
button{cursor:pointer;padding:9px 16px;border-radius:999px;border:1px solid var(--line);background:#1b2250}button:hover{border-color:var(--acc)}
button.pri{background:linear-gradient(135deg,#5b5fc7,#a78bfa);border:0;color:#fff;font-weight:600}button.del{color:#ff8a8a;padding:6px 12px;font-size:.85rem}
.bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px}.bar .sp{flex:1}.msg{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-bottom:12px}
.meta{display:flex;gap:10px;align-items:center;color:var(--mute);font-size:.8rem;margin-bottom:8px}.tag{padding:2px 10px;border-radius:999px;border:1px solid var(--line);color:var(--text)}
.txt{white-space:pre-wrap;overflow-wrap:anywhere}.err{color:#ff8a8a;min-height:1.4em;margin-top:10px}[hidden]{display:none!important}
</style></head><body><main>
<h1>Anonymous inbox</h1><p class="sub">Only visible with your admin token. Nothing here identifies senders.</p>
<div id="login"><input id="tok" type="password" placeholder="Admin token" autocomplete="current-password"><div class="bar" style="margin-top:12px"><button class="pri" id="go">Open inbox</button></div></div>
<div id="app" hidden><div class="bar"><strong id="count"></strong><span class="sp"></span><button id="ref">Refresh</button><button id="out">Lock</button></div><div id="list"></div></div>
<div class="err" id="err" role="alert"></div>
<script>
var $=function(i){return document.getElementById(i)},tok=null;
try{tok=sessionStorage.getItem("inbox-token")}catch(e){}
function err(t){$("err").textContent=t||""}
function hdr(){return{Authorization:"Bearer "+tok}}
function show(on){$("login").hidden=on;$("app").hidden=!on}
function fmt(s){try{return new Date(s).toLocaleString()}catch(e){return s}}
function render(msgs){
  var box=$("list");box.textContent="";$("count").textContent=msgs.length+(msgs.length===1?" message":" messages");
  if(!msgs.length){var p=document.createElement("p");p.className="sub";p.textContent="Nothing yet. Check back later.";box.appendChild(p)}
  msgs.forEach(function(m){
    var d=document.createElement("div");d.className="msg";
    var meta=document.createElement("div");meta.className="meta";
    var t=document.createElement("span");t.className="tag";t.textContent=m.topic;
    var w=document.createElement("span");w.textContent=fmt(m.created_at);
    var sp=document.createElement("span");sp.style.flex="1";
    var b=document.createElement("button");b.className="del";b.textContent="Delete";
    b.onclick=function(){if(!confirm("Delete this message?"))return;
      fetch("/api/messages/"+m.id,{method:"DELETE",headers:hdr()}).then(function(r){if(r.ok)load();else err("Could not delete")})};
    meta.append(t,w,sp,b);
    var x=document.createElement("div");x.className="txt";x.textContent=m.message;
    d.append(meta,x);box.appendChild(d);
  });
}
function load(){
  err("");
  fetch("/api/messages",{headers:hdr()}).then(function(r){
    if(r.status===401){tok=null;try{sessionStorage.removeItem("inbox-token")}catch(e){}show(false);err("Wrong token");return null}
    if(r.status===429){err("Too many attempts. Try again in an hour.");show(false);return null}
    if(!r.ok){err("Server error ("+r.status+")");return null}
    return r.json();
  }).then(function(j){if(j){show(true);render(j.messages)}}).catch(function(){err("Network error")});
}
$("go").onclick=function(){tok=$("tok").value.trim();if(!tok)return;try{sessionStorage.setItem("inbox-token",tok)}catch(e){}$("tok").value="";load()};
$("tok").addEventListener("keydown",function(e){if(e.key==="Enter")$("go").click()});
$("ref").onclick=load;
$("out").onclick=function(){tok=null;try{sessionStorage.removeItem("inbox-token")}catch(e){}show(false);$("list").textContent=""};
if(tok)load();
</script></main></body></html>`;
