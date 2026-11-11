/* Protótipo: o bastante para o celular oferecer a instalação e mostrar os avisos. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});

/* aviso vindo do servidor (versão de verdade: Web Push com a chave da loja) */
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Aviso', { body: d.corpo || '', icon: 'icone-192.png', badge: 'icone-192.png', data: { url: d.url || './' } }));
});

/* tocou no aviso: abre o app (ou traz para frente) na página certa */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var alvo = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if (cs[i].url.indexOf(self.registration.scope) === 0 && 'focus' in cs[i]) { cs[i].navigate && cs[i].navigate(alvo); return cs[i].focus(); } }
    return self.clients.openWindow(alvo);
  }));
});
