// Mis Apps: modo offline.
// Cambia el número de versión si quieres forzar una recarga completa.
const CORE = 'mis-juegos-core-v55';
const RUN = 'mis-juegos-run-v3';
const PRECACHE = [
  './',
  './index.html',
  './apps.json',
  './contrasenas.html',
  './carreras3d.html','./pengu.html','./slideice.html','./ninja.html','./colorrush.html','./planets.html','./survivors.html','./lasthill.html','./gravityflip.html','./orbit.html','./basket.html','./driftking.html','./royale.html','./driftrunner.html','./vozreversa.html','./impostor.html','./cubecraft.html','./blockblast.html','./growgarden.html','./stealbrainrot.html','./bunker.html','./lab.html','./casa.html','./vecina.html','./cuarto.html','./noche.html','./hermana.html','./benalmadena.html',
  './bgm.js','./audio/e/1169.wav','./audio/e/2080.wav','./audio/e/3169.wav','./audio/e/4403.wav','./audio/e/5768.wav','./audio/e/7347.wav','./audio/e/8752.wav','./img/benalmadena.webp','./img/colorrush.webp','./img/driftking.webp','./img/ninja.webp','./img/pengu.webp','./img/planets.webp','./img/slideice.webp','./img/survivors.webp','./audio/m_accion.mp3','./audio/m_alegre.mp3','./audio/m_atraco.mp3','./audio/m_aventura.mp3','./audio/m_batalla.mp3','./audio/m_bitloop.mp3','./audio/m_bunker.mp3','./audio/m_carretera.mp3','./audio/m_castillo.mp3','./audio/m_comico.mp3','./audio/m_espacio.mp3','./audio/m_espacio2.mp3','./audio/m_funky.mp3','./audio/m_hielo.mp3','./audio/m_hielo2.mp3','./audio/m_isla.mp3','./audio/m_jardin.mp3','./audio/m_lab.mp3','./audio/m_misterio.mp3','./audio/m_ninja.mp3','./audio/m_noche.mp3','./audio/m_persecucion.mp3','./audio/m_playa.mp3','./audio/m_pueblo.mp3','./audio/m_siniestro.mp3','./audio/m_techno.mp3','./audio/m_travieso.mp3',
  './audio/s/boom.mp3','./audio/s/camera.mp3','./audio/s/cash.mp3','./audio/s/click.mp3','./audio/s/coin.mp3','./audio/s/coins.mp3','./audio/s/dry.mp3','./audio/s/err.mp3','./audio/s/glass.mp3','./audio/s/hitmark.mp3','./audio/s/metal1.mp3','./audio/s/metal2.mp3','./audio/s/metal3.mp3','./audio/s/metal4.mp3','./audio/s/ok.mp3','./audio/s/punch1.mp3','./audio/s/punch2.mp3','./audio/s/punch3.mp3','./audio/s/reload.mp3','./audio/s/shot1.mp3','./audio/s/shot2.mp3','./audio/s/shot3.mp3','./audio/s/shot4.mp3','./audio/s/soft1.mp3','./audio/s/splash.mp3','./audio/s/step1.mp3','./audio/s/step2.mp3','./audio/s/step3.mp3','./audio/s/step4.mp3','./audio/s/swoosh.mp3','./audio/s/tick.mp3','./audio/s/ugh.mp3','./audio/s/win.mp3',
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

  // música e imágenes pesadas: primero lo guardado (no cambian)
  if (/\/(audio|img)\//.test(new URL(req.url).pathname)) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) =>
        hit || fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(RUN).then((c) => c.put(req, copy)); } return res; })
      )
    );
    return;
  }

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
