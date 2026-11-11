/* Aposentado: o app agora usa ../sw.js (site, clube e painel juntos).
   Quem ainda tinha este registrado é desligado na próxima visita, e o novo assume. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.registration.unregister()));
