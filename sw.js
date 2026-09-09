const CACHE_NAME = "distribuidora-lopez-servidor-unico-8790-v143";
const ASSETS = [
  "./manifest.json",
  "./maintenance.html",
  "./icons/icon.svg",
  "./icons/logo-distribuidora-lopez.jpg",
  "./icons/logo-distribuidora-lopez-192.png",
  "./icons/logo-distribuidora-lopez-512.png",
  "./icons/grupo-rocha-solutions.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  if (event.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(async () => (
        await caches.match("./maintenance.html") || new Response(
          "<!doctype html><html lang=\"es\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Mantenimiento</title><body><h1>Estamos trabajando</h1><p>Volvemos en unos minutos.</p></body></html>",
          { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
        )
      ))
    );
    return;
  }

  if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css") || url.pathname.endsWith("/config.js")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
