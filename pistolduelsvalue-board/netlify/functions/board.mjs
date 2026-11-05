import { getStore } from "@netlify/blobs";

const J = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const sha = async (s) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, "0")).join("");
const SLUG = /^[a-z0-9-]{1,60}$/;
const list = (a, n) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && SLUG.test(x)).slice(0, n) : []);

export default async (req) => {
  const store = getStore("members");
  if (req.method === "GET") {
    const { blobs } = await store.list();
    const out = [];
    for (const b of blobs) {
      const m = await store.get(b.key, { type: "json" });
      if (m) { const { th, ...pub } = m; out.push({ id: b.key, ...pub }); }
    }
    return J({ members: out });
  }
  if (req.method !== "POST") return J({ error: "method" }, 405);
  let raw = "";
  try { raw = await req.text(); } catch (e) {}
  if (raw.length > 30000) return J({ error: "too large" }, 413);
  let b;
  try { b = JSON.parse(raw); } catch (e) { return J({ error: "bad json" }, 400); }
  const rb = String(b.rb || "").trim(), dc = String(b.dc || "").trim().replace(/^@/, ""), token = String(b.token || "");
  if (!/^[A-Za-z0-9_]{3,20}$/.test(rb)) return J({ error: "Invalid Roblox username." }, 400);
  if (!/^[A-Za-z0-9_.#-]{2,37}$/.test(dc)) return J({ error: "Invalid Discord username." }, 400);
  if (token.length < 16 || token.length > 100) return J({ error: "Invalid session." }, 400);
  const key = rb.toLowerCase();
  const th = await sha(token);
  const old = await store.get(key, { type: "json" });
  if (old && old.th !== th) return J({ error: "That Roblox username is already registered from another device." }, 403);
  const posts = (Array.isArray(b.posts) ? b.posts : []).slice(0, 20).map((p) => ({
    id: String((p && p.id) || "").replace(/[^a-z0-9]/gi, "").slice(0, 20) || Date.now().toString(36),
    off: list(p && p.off, 12),
    want: list(p && p.want, 12),
    note: String((p && p.note) || "").slice(0, 120),
    ts: Number(p && p.ts) > 0 && Number(p.ts) <= Date.now() + 60000 ? Number(p.ts) : Date.now(),
  })).filter((p) => p.off.length && p.want.length);
  const wish = list(b.wish, 60);
  await store.setJSON(key, { rb, dc, posts, wish, ts: Date.now(), th });
  return J({ ok: true });
};

export const config = { path: "/api/board" };
