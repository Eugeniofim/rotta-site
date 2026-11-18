/* A Gliki mudou para glikisocookeria.com (18/11/2026). Este service worker só se desliga:
   apaga os caches, sai do aparelho e recarrega as abas abertas, que então seguem para o endereço novo. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll({ type: "window" })) c.navigate(c.url);
})()));
