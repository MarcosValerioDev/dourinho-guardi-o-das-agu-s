// Service worker do Dourinho.
// Estratégia "rede primeiro": sempre tenta baixar a versão mais nova (o cache HTTP
// do navegador evita baixar de novo o que não mudou) e usa o cache só quando está
// offline. Assim um build novo da Unity nunca fica misturado com arquivos antigos.
// Ao mudar a lista de arquivos abaixo, incremente a versão do cache.
const CACHE = "dourinho-v1";

const ARQUIVOS = [
  "./",
  "index.html",
  "style.css",
  "favicon.png",
  "manifest.webmanifest",
  "Build/Dourinho.loader.js",
  "Build/Dourinho.framework.js.unityweb",
  "Build/Dourinho.data.unityweb",
  "Build/Dourinho.wasm.unityweb"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return resp;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
