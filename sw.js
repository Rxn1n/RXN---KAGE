/* Service worker de RXN KAGE: guarda la app en el celular para que funcione sin internet.
   Cuando subas una versión nueva, cambia el número de CACHE (ej. rxnkage-1.1.1)
   y la app mostrará el aviso «Hay una versión nueva». */
const CACHE = 'rxnkage-1.2.0';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => (k.startsWith('shinobi-') || k.startsWith('rxnkage-')) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

/* Primero responde con lo guardado (rápido y sin señal) y, si hay conexión, refresca la copia en segundo plano. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const clave = req.mode === 'navigate' ? './index.html' : req;
      const guardado = await cache.match(clave, { ignoreSearch: true });
      const red = fetch(req)
        .then(res => {
          if (res && res.ok && res.type === 'basic') cache.put(clave, res.clone());
          return res;
        })
        .catch(() => null);
      if (guardado) {
        e.waitUntil(red);
        return guardado;
      }
      const res = await red;
      return res || new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    })
  );
});
