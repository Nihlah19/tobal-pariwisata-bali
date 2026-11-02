/**
 * Registrasi Service Worker & Deteksi Offline
 * Memastikan cache CSS & aset aktif untuk kondisi offline dan jaringan lambat.
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // SW berhasil didaftarkan
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[Tobal SW] Konten & tampilan CSS terbaru tersedia offline.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[Tobal SW Registration Failed]', err);
        });
    });
  }

  // Notifikasi offline banner jika koneksi terputus
  setupOfflineIndicator();
}

function setupOfflineIndicator() {
  const updateOnlineStatus = () => {
    let banner = document.getElementById('tobal-offline-banner');
    if (!navigator.onLine) {
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'tobal-offline-banner';
        banner.className =
          'fixed bottom-4 left-4 z-50 px-4 py-2 rounded-2xl bg-tanah-gelap text-krem text-xs shadow-lg border border-pasir/30 flex items-center gap-2 animate-fade-in';
        banner.innerHTML = `
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Mode Offline aktif — Tampilan & fitur lokal tetap siap digunakan.</span>
        `;
        document.body.appendChild(banner);
      }
    } else if (banner) {
      banner.remove();
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  if (!navigator.onLine) {
    updateOnlineStatus();
  }
}
