/* Eonbound — service worker simples e seguro.
   Regras:
   - index.html, js/, json e manifest: SEMPRE rede primeiro (o jogador recebe a versão nova); cache só como reserva offline.
   - assets/ (imagens, áudio, ícones): cache primeiro, com versão. Mudou um asset? Aumente VERSION abaixo.
   - Qualquer erro aqui dentro cai para a rede normal: o SW nunca pode quebrar o jogo.
   - Não intercepta: outros domínios, métodos diferentes de GET, pedidos parciais (Range, comuns em áudio) e ?debug=1. */
'use strict';
const VERSION = 'v0.12.2';                      // <- aumente a cada publicação que troque arquivos em assets/
const STATIC_CACHE = 'eonbound-static-' + VERSION;   // assets/ (cache primeiro)
const PAGE_CACHE = 'eonbound-page-' + VERSION;       // index.html, js, json (rede primeiro)
const PRECACHE = [                          // pequeno de propósito; o resto entra no cache conforme o jogo pede
  './',
  'manifest.webmanifest',
  'assets/pwa/icon-192.png',
  'assets/brand/name.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(PAGE_CACHE);
      // um por um: arquivo faltando não derruba a instalação
      await Promise.all(PRECACHE.map(u => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    } catch (e) { /* segue sem pré-cache */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      await Promise.all(names.filter(n => n.startsWith('eonbound-') && n !== STATIC_CACHE && n !== PAGE_CACHE).map(n => caches.delete(n)));
    } catch (e) { /* nada */ }
    try { await self.clients.claim(); } catch (e) { /* nada */ }
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function cacheable(res) { return res && res.status === 200 && res.type === 'basic'; }

async function putSafe(cacheName, request, response) {
  try { const cache = await caches.open(cacheName); await cache.put(request, response); } catch (e) { /* disco cheio etc.: ignora */ }
}

/* rede primeiro; se a rede falhar, usa o cache (ignorando ?parametros) */
async function networkFirst(request, isPage) {
  try {
    const res = await fetch(request);
    if (cacheable(res)) putSafe(PAGE_CACHE, request, res.clone());
    return res;
  } catch (err) {
    const hit = await caches.match(request, { ignoreSearch: true }).catch(() => null);
    if (hit) return hit;
    if (isPage) { const home = await caches.match('./', { ignoreSearch: true }).catch(() => null); if (home) return home; }
    throw err;
  }
}

/* cache primeiro; se não tiver, busca na rede e guarda */
async function cacheFirst(request) {
  const hit = await caches.match(request).catch(() => null);
  if (hit) return hit;
  const res = await fetch(request);
  if (cacheable(res)) putSafe(STATIC_CACHE, request, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (req.method !== 'GET') return;                         // nunca mexe em POST etc.
  if (url.origin !== self.location.origin) return;          // nunca mexe em outros domínios
  if (req.headers.has('range')) return;                     // áudio/vídeo parcial: deixa o navegador resolver
  if (url.searchParams.get('debug') === '1') return;        // modo de teste sempre direto da rede
  if (url.pathname.endsWith('/sw.js')) return;

  const isPage = req.mode === 'navigate' || req.destination === 'document';
  const path = url.pathname;
  const isStaticAsset = /\/assets\/.+\.(png|jpg|jpeg|webp|gif|svg|mp3|ogg|m4a|wav|woff2?)$/i.test(path);

  const handler = isStaticAsset ? cacheFirst(req) : networkFirst(req, isPage);
  // rede de segurança final: se qualquer coisa acima falhar, tenta a rede pura
  event.respondWith(handler.catch(() => fetch(req)));
});
