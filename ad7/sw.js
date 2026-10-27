/* Service worker — AD7 Imóveis
   Rede primeiro (o site novo chega sempre que houver internet), cache como
   reserva (abre mesmo sem internet). Para publicar uma atualização: subir os
   arquivos novos e trocar a VERSION. Fotos dos imóveis NÃO entram no essencial:
   são centenas, no servidor do Tecimob; o app guarda as que a pessoa viu. */
'use strict';

const VERSION = 'ad7-v0.3.0';
const CORE = [
  './', './index.html', './config.js', './nuvem.js', './auth.js', './catalogo.js', './pedidos.js', './app.js',
  './estilo.css', './manifest.webmanifest', './dados/imoveis.json', './arte/logo-claro.png', './arte/logo-claro@2x.png', './arte/emblema.png', './arte/emblema@2x.png', './arte/capa-1400.jpg', './icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ad7-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  /* fotos de fora (Tecimob): guarda as vistas, serve do cache se a rede falhar */
  if (url.origin !== location.origin) {
    if (!/imagens\.tecimob\.com\.br/.test(url.hostname)) return;
    e.respondWith(fetch(e.request).then((res) => { const c = res.clone(); caches.open(VERSION + '-fotos').then((k) => k.put(e.request, c)); return res; }).catch(() => caches.match(e.request).then((h) => h || Response.error())));
    return;
  }
  const ehApp = e.request.mode === 'navigate' || /\.(?:js|css|webmanifest|json)$/.test(url.pathname);
  e.respondWith(
    fetch(e.request, ehApp ? { cache: 'reload' } : undefined)
      .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request).then((hit) => hit || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
