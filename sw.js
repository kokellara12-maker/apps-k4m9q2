// Mis Apps: modo offline.
// Cambia el número de versión si quieres forzar una recarga completa.
const CORE = 'mis-juegos-core-v7';
const RUN = 'mis-juegos-run-v3';
const PRECACHE = [
  './',
  './index.html',
  './apps.json',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CORE)
      .then((c) => c.addAll(PRECACHE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('mis-juegos-') && k !== CORE && k !== RUN).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Con internet: usa lo último y lo guarda. Sin internet (o muy lento): usa lo guardado.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith(
    new Promise((resolve) => {
      let done = false;
      const fromCache = () => caches.match(req, { ignoreSearch: true });

      const timer = setTimeout(async () => {
        const hit = await fromCache();
        if (hit && !done) {
          done = true;
          resolve(hit);
        }
      }, 3000);

      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          clearTimeout(timer);
          if (res.ok) {
            const copy = res.clone();
            caches.open(RUN).then((c) => c.put(req, copy));
          }
          if (!done) {
            done = true;
            resolve(res);
          }
        })
        .catch(async () => {
          clearTimeout(timer);
          const hit = await fromCache();
          if (!done) {
            done = true;
            resolve(hit || new Response('Sin conexión y todavía no guardado.', { status: 503 }));
          }
        });
    })
  );
});
