/**
 * Tour Penjelajah Bali — Service Worker
 * Menyediakan caching instan untuk CSS, HTML, Gambar, & Aset
 * Memastikan tampilan CSS & halaman dapat diakses dalam keadaan offline dan jaringan lemot.
 */

const CACHE_NAME = 'tobal-pariwisata-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/styles/main.css',
  '/favicon.svg',
  '/src/pages/kamus.html',
  '/src/pages/budaya.html',
  '/src/pages/kenali-budaya.html',
  '/src/pages/masuk.html',
  '/src/pages/petualangan.html',
  '/src/pages/lencana.html',
  '/src/pages/onboarding.html'
];

// 1. Install Event: Pre-cache aset utama
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache yang tidak menghalangi jika salah satu gagal
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW Precache Notice]', url, err);
          })
        )
      );
    })
  );
});

// 2. Activate Event: Bersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// 3. Fetch Event: Strategi Pintar (Stale-While-Revalidate untuk CSS/Aset & Network-First dengan Fallback untuk Halaman)
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Jangan tangani permintaan selain GET atau permintaan browser extensions
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Jangan cache panggilan otentikasi / API dinamis Supabase
  if (url.hostname.includes('supabase.co') || url.pathname.startsWith('/api/')) {
    return;
  }

  // A. Strategi Cache-First untuk CSS, Font, JS, & Gambar (Memastikan CSS seketika muncul tanpa jeda jaringan)
  const isStaticAsset =
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.webp') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Ambil dari cache jika ada
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Jika offline / gagal jaringan, fallback ke cached response
            return cachedResponse;
          });

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // B. Strategi Network-First dengan Timeout untuk Halaman HTML
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      Promise.race([
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            // Jaringan mati / offline
            const cached = await caches.match(request);
            if (cached) return cached;
            return caches.match('/index.html');
          }),
        // Timeout 1.8 detik jika jaringan lemot, langsung pakai cache
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Network timeout')), 1800)
        )
      ]).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return caches.match('/index.html');
      })
    );
  }
});
