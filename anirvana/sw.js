const CACHE = 'anirvana-v1';   /* SUBIR ESTE NÚMERO A CADA PUBLICAÇÃO */
const ESSENCIAL = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESSENCIAL)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('anirvana-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
/* a página pede a troca quando a pessoa aperta "Atualizar" — nunca sozinho */
self.addEventListener('message', e => {
  if (e.data && e.data.tipo === 'assumir') self.skipWaiting();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  const ehApp = req.mode === 'navigate' || req.destination === 'document' || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  const pedido = ehApp ? fetch(new Request(req.url, {cache:'no-store', credentials:'same-origin'})) : fetch(req);
  e.respondWith(pedido
    .then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {}); }
      return res;
    })
    .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
