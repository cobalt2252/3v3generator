const VERSION = "2026-10-14.7";
const SHELL = "3v3-shell-" + VERSION;
const FILES = ["./", "index.html", "style.css", "js/engine.js", "js/app.js", "manifest.json", "icon-192.png", "apple-touch-icon.png", "icon-512.png", "fonts/inter-latin-wght-normal.woff2"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => (k.startsWith("3v3-shell-") && k !== SHELL) || k === "3v3-fonts").map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("message", (e) => { if (e.data === "skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(caches.match("index.html").then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req).then((r) => r || fetch(req).then((n) => {
    const copy = n.clone(); caches.open(SHELL).then((c) => c.put(req, copy)); return n;
  })));
});
