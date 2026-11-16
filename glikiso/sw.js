/* Service worker do app Gliki Sô: site, clube e painel.
   SUBIR O NÚMERO A CADA PUBLICAÇÃO — senão o celular não vê que mudou. */
const CACHE = "gliki-v7";
const ESSENCIAL = [
  "./", "./clube/", "./painel/",
  "./comum/nuvem.js", "./comum/dados.js", "./comum/icones.js", "./comum/estilo.css", "./comum/rolagem.js", "./comum/app.js",
  "./comum/logo-escrita.svg", "./manifest.webmanifest", "./icones/icone-192.png", "./abertura/p/001.webp"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(ESSENCIAL.map((u) => c.add(u).catch(() => {})))));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

/* a página pede a troca quando a pessoa aperta "Atualizar" (ou quando não está no meio de nada) */
self.addEventListener("message", (e) => {
  if (e.data && e.data.tipo === "assumir") self.skipWaiting();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* os quadros da abertura nunca mudam: guarda e serve do aparelho */
  if (/\/abertura(-natal)?\//.test(url.pathname)) {
    const busca = () => fetch(req).then((res) => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}); }
      return res;
    });
    e.respondWith(caches.match(req).then((r) => r || busca().catch(() => busca())));
    return;
  }

  const ehPagina = req.mode === "navigate" || req.destination === "document";
  const pedido = ehPagina ? fetch(new Request(req.url, { cache: "no-store", credentials: "same-origin" })) : fetch(req);
  e.respondWith(pedido
    .then((res) => {
      if (res && res.ok) { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {}); }
      return res;
    })
    .catch(() => caches.match(req, { ignoreSearch: ehPagina }).then((r) => r || (ehPagina ? caches.match("./clube/") : undefined))));
});

/* avisos do clube (na versão de verdade chegam pelo servidor, com Web Push) */
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(d.titulo || "Gliki Sô", {
    body: d.texto || "", icon: "icones/icone-192.png", badge: "icones/icone-192.png", data: { url: d.url || "clube/" }
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    if (abertas.length) return abertas[0].focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || "clube/");
  })());
});
