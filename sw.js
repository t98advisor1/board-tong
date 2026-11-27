/* Board-Tong 독립 스마트 판서 보드 서비스 워커 */
var CACHE_VERSION = 'board-tong-v2.8.2';
var CACHE_NAME = 'board-tong-' + CACHE_VERSION;

var PRECACHE = [
  './',
  './index.html',
  './smart-board.css?v=2.8.2',
  './smart-board.js?v=2.8.2',
  './smart-board-guide.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg',
  './libs/jszip.min.js',
  './libs/pdf-lib.min.js',
  './libs/pdf.min.js',
  './libs/pdf.worker.min.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (/\.mp4$/i.test(url.pathname)) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () {
          return caches.match(req).then(function (m) { return m || caches.match('./index.html'); });
        })
    );
    return;
  }

  if (/\/(index\.html|smart-board\.html|smart-board-guide\.html|smart-board\.css|smart-board\.js)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
          }
          return res;
        })
        .catch(function () { return caches.match(req); })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        }
        return res;
      });
    })
  );
});
