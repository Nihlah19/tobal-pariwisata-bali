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

  // PWA Install Prompt
  setupPwaInstall();
}

let deferredPrompt = null;

function setupPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromptBanner();
  });
}

function showInstallPromptBanner() {
  // Hanya tampilkan jika belum pernah ditutup dalam sesi ini
  if (sessionStorage.getItem('tobal_pwa_dismissed')) return;
  if (document.getElementById('tobal-pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'tobal-pwa-install-banner';
  banner.className = 'fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-white/95 backdrop-blur-md border border-daun/30 rounded-2xl p-3 sm:p-3.5 shadow-organik-lg flex items-center justify-between gap-3 animate-slide-down';
  banner.innerHTML = `
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="w-8 h-8 rounded-xl bg-daun/10 border border-daun/20 p-1 flex items-center justify-center shrink-0">
        <img src="/images/mascot-barong-head.png" alt="Tobal" class="w-full h-full object-contain" />
      </div>
      <div class="min-w-0 text-left">
        <p class="font-heading font-bold text-xs text-tanah-gelap truncate">Pasang Aplikasi Tobal</p>
        <p class="text-[10px] text-tanah/70 truncate">Akses cepat, hemat data & rute offline</p>
      </div>
    </div>
    <div class="flex items-center gap-1.5 shrink-0">
      <button type="button" id="btn-pwa-install" class="px-3 py-1.5 rounded-xl bg-daun hover:bg-daun/90 text-krem text-[11px] font-bold shadow-xs cursor-pointer">
        Pasang
      </button>
      <button type="button" id="btn-pwa-dismiss" class="w-7 h-7 rounded-lg hover:bg-pasir/40 text-tanah/60 hover:text-tanah flex items-center justify-center text-xs cursor-pointer" aria-label="Tutup">
        ✕
      </button>
    </div>
  `;
  document.body.appendChild(banner);

  document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('[Tobal PWA] Pengguna memasang aplikasi Tobal');
      }
      deferredPrompt = null;
    }
    banner.remove();
  });

  document.getElementById('btn-pwa-dismiss')?.addEventListener('click', () => {
    sessionStorage.setItem('tobal_pwa_dismissed', 'true');
    banner.remove();
  });
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

