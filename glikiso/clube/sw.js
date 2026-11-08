/* Só para os avisos no celular. Não guarda nada em cache: o clube sempre abre na versão mais nova. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* Na versão de verdade, o aviso chega por aqui, mandado pelo servidor (Web Push). */
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.titulo || "Gliki Sô", { body: d.texto || "", data: { url: d.url || "./" } }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (abertas.length) return abertas[0].focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || "./");
  })());
});
