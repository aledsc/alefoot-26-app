// Service worker do Alefoot 26: guarda o jogo no aparelho para abrir sem internet.
// Estratégia: devolve o que está guardado na hora e busca a versão nova em segundo plano
// (a versão nova chega em segundo plano; a página avisa e o jogador decide quando recarregar).
const CACHE = 'alefoot26-20261030194537';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (ev) => {
  // cache: 'reload' pula o cache HTTP do navegador: a versão nova vem mesmo da rede
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== 'GET' || url.origin !== self.location.origin) return;
  // o próprio sw.js e o que pede "sem cache" vão direto à rede: é assim que o jogo descobre a versão publicada
  if (url.pathname.endsWith('/sw.js') || ev.request.cache === 'no-store') return;
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
