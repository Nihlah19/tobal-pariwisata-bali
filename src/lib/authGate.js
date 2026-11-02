/**
 * Auth Gate & Modal Interceptor — Tour Penjelajah Bali
 * Menjaga fitur-fitur bergamifikasi & AI agar tidak bisa diakses sembarangan
 * tanpa akun terdaftar, dan menampilkan dialog ajakan daftar/masuk secara interaktif.
 */

import { getSession } from './auth.js';

/**
 * Tampilkan modal ajakan mendaftar/masuk akun
 * @param {string} featureName - Nama fitur yang coba diakses
 * @param {string} targetUrl - URL tujuan setelah berhasil login
 */
export function promptAuthModal(featureName = 'Fitur Petualangan', targetUrl = '') {
  // Hapus modal lama jika sudah ada
  const existing = document.getElementById('auth-gate-modal');
  if (existing) existing.remove();

  const safeReturn = targetUrl ? encodeURIComponent(targetUrl) : '';
  const registerUrl = `/src/pages/masuk.html?tab=register${safeReturn ? `&returnTo=${safeReturn}` : ''}`;
  const loginUrl = `/src/pages/masuk.html?tab=login${safeReturn ? `&returnTo=${safeReturn}` : ''}`;

  const overlay = document.createElement('div');
  overlay.id = 'auth-gate-modal';
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-tanah-gelap/70 backdrop-blur-md animate-fade-in';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  overlay.innerHTML = `
    <div class="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-pasir/80 text-center transform transition-all animate-slide-up">
      
      <!-- Tombol Tutup -->
      <button id="btn-close-auth-modal" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-pasir/40 hover:bg-pasir text-tanah/70 hover:text-tanah-gelap flex items-center justify-center transition cursor-pointer" aria-label="Tutup Dialog">
        <i class="fa-solid fa-xmark text-sm"></i>
      </button>

      <!-- Badge Icon Kunci Berhias Daun & Emas -->
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-100 via-orange-50 to-emerald-100 text-daun border border-amber-300/80 flex items-center justify-center mx-auto mb-4 shadow-sm">
        <i class="fa-solid fa-compass text-2xl text-daun"></i>
      </div>

      <!-- Header Teks -->
      <span class="badge-padi text-[10px] py-0.5 px-3 uppercase font-bold tracking-wider inline-flex mb-2">
        Akses Khusus Anggota
      </span>
      <h3 class="font-heading font-extrabold text-2xl text-tanah-gelap mb-2">
        Daftar Akun Terlebih Dahulu
      </h3>
      
      <p class="font-body text-xs sm:text-sm text-tanah/80 leading-relaxed mb-4">
        Fitur <strong class="text-daun font-bold">${featureName}</strong> memerlukan akun penjelajah untuk menyimpan catatan perjalanan dan membuka fitur cerdas Bali.
      </p>

      <!-- Keuntungan Mendaftar -->
      <div class="bg-gradient-to-r from-emerald-50/70 to-amber-50/70 rounded-2xl p-3.5 mb-5 border border-pasir/60 text-left space-y-2 text-xs text-tanah-gelap">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-daun text-xs shrink-0"></i>
          <span>Rekomendasi paket petualangan 3+1 personal AI</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-daun text-xs shrink-0"></i>
          <span>Buka lencana tradisi & rekam jejak petualangan</span>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-check text-daun text-xs shrink-0"></i>
          <span>AI Vision pendeteksi budaya, pura, & busana Bali</span>
        </div>
      </div>

      <!-- Tombol Aksi Utama -->
      <div class="space-y-2.5">
        <a href="${registerUrl}" class="w-full btn-primer !py-3.5 !rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:scale-102 transition-transform" id="btn-modal-go-register">
          <i class="fa-solid fa-user-plus text-xs"></i>
          <span>Daftar Akun Baru (Gratis 15 Detik)</span>
        </a>

        <a href="${loginUrl}" class="w-full btn-sekunder !py-3 !rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 border border-pasir hover:border-daun/40 transition" id="btn-modal-go-login">
          <i class="fa-solid fa-arrow-right-to-bracket text-xs text-daun"></i>
          <span>Sudah Punya Akun? Masuk Di Sini</span>
        </a>
      </div>

      <!-- Info Tambahan -->
      <p class="text-[11px] text-tanah/60 font-body mt-4">
        100% Gratis · Tanpa Iklan · Akses Selamanya
      </p>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeModal = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  document.getElementById('btn-close-auth-modal')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  const onEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', onEscape);
    }
  };
  document.addEventListener('keydown', onEscape);
}

// Pasang interceptor global berbasis Event Delegation (menangani seluruh tautan secara konsisten)
let isInterceptorAttached = false;

export async function setupProtectedLinks() {
  if (isInterceptorAttached) return;
  isInterceptorAttached = true;

  document.addEventListener('click', async (e) => {
    // Cari elemen <a> atau elemen bertanda data-auth-required
    const target = e.target.closest('a[href], [data-auth-required="true"]');
    if (!target) return;

    const href = target.getAttribute('href') || target.dataset.targetUrl || '';

    // Kecualikan navigasi keluar, jangkar internal halaman, dan halaman masuk langsung
    if (href.startsWith('#') || href.includes('masuk.html') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    const protectedPatterns = [
      { pattern: 'petualangan', name: 'Jalur Petualangan Cerdas' },
      { pattern: 'lencana', name: 'Koleksi Lencana Budaya' },
      { pattern: 'kenali-budaya', name: 'Kenali Budaya (AI Vision)' },
      { pattern: 'onboarding', name: 'Kustomisasi Preferensi Petualangan' }
    ];

    let matchedFeature = target.dataset.featureName || null;

    if (!matchedFeature) {
      for (const item of protectedPatterns) {
        if (href.includes(item.pattern)) {
          matchedFeature = item.name;
          break;
        }
      }
    }

    const isProtected = Boolean(matchedFeature) || target.dataset.authRequired === 'true';
    if (!isProtected) return;

    // Cek sesi autentikasi
    const session = await getSession();
    if (session?.user) {
      // User sudah masuk akun, izinkan navigasi normal
      return;
    }

    // Belum masuk akun: cegah perpindahan halaman dan munculkan modal suruh daftar
    e.preventDefault();
    e.stopPropagation();

    const featureTitle = matchedFeature || 'Fitur Eksplorasi Bali';
    promptAuthModal(featureTitle, target.href || href);
  }, true); // Use capture phase to intercept before default link navigation
}
