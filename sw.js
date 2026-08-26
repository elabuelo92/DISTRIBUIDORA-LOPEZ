const CACHE_NAME = "distribuidora-lopez-servidor-unico-8790-v112";
const ASSETS = [
  "./manifest.json",
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  if (event.request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname === "/") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" }).catch(() => new Response(
        "<!doctype html><html lang=\"es\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>Servidor sin conexion</title><body style=\"margin:0;display:grid;min-height:100vh;place-items:center;background:#11252b;color:#fff;font-family:Arial,sans-serif\"><main style=\"max-width:420px;padding:24px;text-align:center\"><h1>Servidor sin conexion</h1><p>La aplicacion no pudo llegar al servidor 8790. Abrir el servidor en la PC y volver a intentar.</p></main></body></html>",
        { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
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
