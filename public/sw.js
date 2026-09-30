/*
 * Offline support. Pages and tools you have opened keep working without a connection:
 * - pages (HTML): network first; the saved copy only when the network fails or takes over 4 s (the fresh page still
 *   replaces it in the cache);
 * - /_next/static (content-hashed, immutable): cache first;
 * - /vendor, /fonts, search index, icons: served from cache, refreshed in the background.
 * Nothing you type or open is stored here — only the site's own files. Other origins are never touched.
 */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const STATIC = `static-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const MAX_PAGES = 80;
// Old deployments leave hashed chunks behind: keep the newest ones only.
const MAX_STATIC = 600;
const MAX_ASSETS = 150;
const NETWORK_TIMEOUT = 4000;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![PAGES, STATIC, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cacheable(res) {
  return res && res.status === 200 && res.type === "basic";
}

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function page(request) {
  const cache = await caches.open(PAGES);
  const cached = () => cache.match(request, { ignoreSearch: true });
  const network = fetch(request).then((res) => {
    if (cacheable(res)) cache.put(request, res.clone()).then(() => trim(PAGES, MAX_PAGES));
    return res;
  });
  // A slow network: after a few seconds show the saved copy if there is one, otherwise keep waiting.
  const slow = new Promise((resolve) => setTimeout(() => cached().then((hit) => hit && resolve(hit)), NETWORK_TIMEOUT));
  try {
    return await Promise.race([network, slow]);
  } catch (err) {
    const hit = await cached();
    return hit || offlinePage(cache, new URL(request.url).pathname.startsWith("/en") ? "en" : "ru");
  }
}

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** No connection and the page was never opened: say so and list the pages that do work offline. */
async function offlinePage(cache, lang) {
  const items = [];
  for (const req of (await cache.keys()).reverse()) {
    const path = new URL(req.url).pathname;
    if (!path.startsWith(`/${lang}`)) continue;
    const res = await cache.match(req);
    const title = ((await res.text()).match(/<title>([^<]*)<\/title>/) || [])[1] || path;
    items.push(`<li><a href="${esc(path)}">${title.split(" | ")[0]}</a></li>`);
  }
  const t =
    lang === "ru"
      ? { title: "Нет подключения к интернету", text: "Эта страница ещё не сохранена на устройстве. Без интернета работают инструменты, которые вы уже открывали:", retry: "Попробовать снова" }
      : { title: "You are offline", text: "This page hasn't been saved on this device yet. Tools you have opened before work offline:", retry: "Try again" };
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t.title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;margin:0;padding:2rem 1rem;color:#1a1b1e;background:#f6f6f3}main{max-width:40rem;margin:0 auto}h1{font-size:1.5rem;margin:0 0 .5rem}a{color:#2553d8}li{margin:.35rem 0}button{font:inherit;margin-top:1rem;padding:.6rem 1.1rem;border:0;border-radius:.5rem;background:#2553d8;color:#fff}@media(prefers-color-scheme:dark){body{background:#0f1012;color:#e8e8ea}a{color:#8aa8ff}}</style></head>
<body><main><h1>${t.title}</h1><p>${t.text}</p><ul>${items.join("")}</ul><button onclick="location.reload()">${t.retry}</button></main></body></html>`;
  return new Response(html, { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (cacheable(res)) cache.put(request, res.clone()).then(() => trim(STATIC, MAX_STATIC));
  return res;
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  const fresh = fetch(request).then((res) => {
    if (cacheable(res)) cache.put(request, res.clone()).then(() => trim(ASSETS, MAX_ASSETS));
    return res;
  });
  if (hit) {
    event.waitUntil(fresh.catch(() => undefined));
    return hit;
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // React Server Component payloads and range requests (media) go straight to the network.
  if (url.searchParams.has("_rsc") || request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(page(request));
  } else if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
  } else if (/^\/(vendor|fonts)\//.test(url.pathname) || /\/search\.json$/.test(url.pathname) || /\.(png|svg|ico|webmanifest)$/.test(url.pathname) || url.pathname === "/legacy.css") {
    event.respondWith(staleWhileRevalidate(request, event));
  }
});
