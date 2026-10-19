// Офлайн режим.
// Файловете на приложението: първо мрежата (за да идват новите факти), при липса на интернет се ползва запазеното копие.
// Шрифтовете: първо запазеното копие.
const CACHE = "arhivat-v2";
const FILES = ["./", "index.html", "data.json", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (FONT_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r;
    })));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
