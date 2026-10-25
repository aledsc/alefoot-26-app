// Service worker do Alefoot 26: guarda o jogo no aparelho para abrir sem internet.
// Estratégia: devolve o que está guardado na hora e busca a versão nova em segundo plano
// (a atualização vale na próxima vez que o app abrir).
const CACHE = 'alefoot26-20261025020342';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET' || new URL(ev.request.url).origin !== self.location.origin) return;
  ev.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const guardado = await cache.match(ev.request, { ignoreSearch: true });
      const rede = fetch(ev.request)
        .then((resp) => {
          if (resp.ok) cache.put(ev.request, resp.clone());
          return resp;
        })
        .catch(() => guardado);
      return guardado ?? rede;
    }),
  );
});
