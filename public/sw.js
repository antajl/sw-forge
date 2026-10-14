/**
 * sw.js — SW-Forge Service Worker for Offline & PWA support.
 */

const CACHE_NAME = 'sw-forge-v1.2.20';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/dist/app.css',
  './js/ui.js',
  './js/core/meta.js',
  './js/core/translations.js',
  './js/core/defaults.js',
  './js/core/changelog-data.js',
  './js/core/bootstrap.js',
  './js/data/artifacts/effects.js',
  './js/data/artifact-ingame-score.js',
  './js/data/relics/effects.js',
  './js/data/gear/parse.js',
  './js/data/gear/icons.js',
  './js/data/parser.js',
  './js/data/ingame-score.js',
  './js/data/local-assets.js',
  './js/data/skill-db.js',
  './js/data/monster-db.js',
  './js/engine/engine-core.js',
  './js/engine/engine-legacy-roles.js',
  './js/engine/engine-gem-reapp-verdict.js',
  './js/engine/engine-artifacts.js',
  './js/advanced-formulas.js',
  './js/engine/engine-process.js',
  './js/engine/engine-depth.js',
  './js/self-test.js',
  './js/swrm-motion.js',
  './assets/gsap.min.js',
  './assets/favicon-16.png',
  './assets/favicon-32.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        // Continue even if some optional asset fails
        console.warn('SW install cache warning:', err);
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('sw-forge-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ignore cross-origin non-GET or browser extension schemes
  if (url.origin !== self.location.origin) return;

  // For HTML navigations: Network-first, fallback to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html'))),
    );
    return;
  }

  // For static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => null);

      return cached || fetchPromise;
    }),
  );
});
