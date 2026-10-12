const CACHE = "plan-v16";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Свежая версия, если есть интернет; без сети или при медленной сети — из кэша.
    e.respondWith(caches.open(CACHE).then(c => {
      const net = fetch(req, { cache: "no-store" }).then(r => { if (r.ok) c.put("./index.html", r.clone()); return r; });
      const slow = new Promise(res => setTimeout(() => c.match("./index.html").then(h => h && res(h)), 3000));
      return Promise.race([net, slow]).catch(() => c.match("./index.html"));
    }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(c => c.match(req, { ignoreSearch: true }).then(hit => {
    const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
