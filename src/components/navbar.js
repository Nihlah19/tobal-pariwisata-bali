/**
 * Navbar — Tour Penjelajah Bali
 * Menu: Beranda, Petualangan Saya, Lencana, Kamus Basa Bali, Ensiklopedia Budaya, Kenali Budaya (AI)
 * Desain: Modern Floating Island Capsule Navigation dengan Maskot Bara & Pemutar Musik Bali
 */

import { getCurrentUser, getUserProfile, signOutUser } from '../lib/auth.js';
import { initBalineseAudio } from './balineseAudio.js';

/**
 * Menentukan halaman aktif dari URL.
 */
function getActivePage() {
  const path = window.location.pathname;
  if (path === '/' || path.endsWith('index.html')) return 'beranda';
  if (path.includes('petualangan')) return 'petualangan';
  if (path.includes('lencana')) return 'lencana';
  if (path.includes('kamus')) return 'kamus';
  if (path.includes('budaya')) return 'budaya';
  if (path.includes('kenali-budaya') || path.includes('kenali')) return 'kenali-budaya';
  if (path.includes('masuk')) return 'masuk';
  if (path.includes('onboarding')) return 'onboarding';
  return '';
}

/**
 * Render navbar ke elemen target dan sinkronkan dengan Supabase Auth & Audio Controller.
 * @param {string} selector - CSS selector elemen target
 */
export async function renderNavbar(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  const active = getActivePage();
  const user = await getCurrentUser();
  let displayName = '';

  if (user) {
    const profile = await getUserProfile(user.id);
    displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Penjelajah';
  }

  // Helper kelas tombol kapsul menu desktop
  const navItemClass = (page) =>
    active === page
      ? 'bg-gradient-to-r from-daun to-emerald-700 text-white font-bold shadow-md shadow-daun/20 px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-2 text-xs transition-all duration-300 scale-102'
      : 'text-tanah-gelap/80 hover:text-daun hover:bg-white/90 font-medium px-3 sm:px-3.5 py-2 rounded-full flex items-center gap-2 text-xs transition-all duration-200';

  el.innerHTML = `
    <nav class="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-pasir/70 shadow-xs transition-all" role="navigation" aria-label="Navigasi utama">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Logo Brand dengan Maskot Bara -->
          <a href="/" class="flex items-center gap-3 group shrink-0" aria-label="Beranda Tobal">
            <div class="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-300 via-orange-200 to-emerald-100 border-2 border-amber-300 shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:rotate-3">
              <img src="/images/mascot-barong-head.png" alt="Bara Maskot" class="w-8 h-8 sm:w-9 sm:h-9 object-contain">
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-daun rounded-full border-2 border-white"></span>
            </div>
            
            <span class="font-heading font-black text-2xl sm:text-3xl text-tanah-gelap tracking-tight leading-none group-hover:text-daun transition-colors">
              Tobal
            </span>
          </a>

          <!-- Desktop Navigation: Modern Island / Capsule Dock -->
          <div class="hidden xl:flex items-center p-1.5 rounded-full bg-pasir/30 border border-pasir/70 backdrop-blur-md shadow-inner gap-0.5">
            <a href="/" class="${navItemClass('beranda')}" title="Halaman Utama">
              <i class="fa-solid fa-house-chimney text-xs ${active === 'beranda' ? 'text-amber-200' : 'text-tanah/60'}"></i>
              <span>Beranda</span>
            </a>
            <a href="/src/pages/petualangan.html" class="${navItemClass('petualangan')}" title="Jalur Petualangan Saya">
              <i class="fa-solid fa-map-location-dot text-xs ${active === 'petualangan' ? 'text-amber-200' : 'text-tanah/60'}"></i>
              <span>Petualangan</span>
            </a>
            <a href="/src/pages/lencana.html" class="${navItemClass('lencana')}" title="Koleksi Lencana Tradisi">
              <i class="fa-solid fa-award text-xs ${active === 'lencana' ? 'text-amber-200' : 'text-tanah/60'}"></i>
              <span>Lencana</span>
            </a>
            <a href="/src/pages/kamus.html" class="${navItemClass('kamus')}" title="Kamus Etika Bahasa Bali">
              <i class="fa-solid fa-book-open text-xs ${active === 'kamus' ? 'text-amber-200' : 'text-tanah/60'}"></i>
              <span>Kamus Basa Bali</span>
            </a>
            <a href="/src/pages/budaya.html" class="${navItemClass('budaya')}" title="Ensiklopedia Budaya Dewata">
              <i class="fa-solid fa-landmark text-xs ${active === 'budaya' ? 'text-amber-200' : 'text-tanah/60'}"></i>
              <span>Budaya</span>
            </a>
            <a href="/src/pages/kenali-budaya.html" class="${navItemClass('kenali-budaya')}" title="Kenali Budaya dari Foto AI">
              <i class="fa-solid fa-camera-retro text-xs ${active === 'kenali-budaya' ? 'text-amber-300' : 'text-amber-600'}"></i>
              <span>Kenali Budaya</span>
              <span class="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-xs">AI</span>
            </a>
          </div>

          <!-- Secondary Desktop Navigation (Layar Medium lg-xl) -->
          <div class="hidden md:flex xl:hidden items-center p-1 rounded-full bg-pasir/30 border border-pasir/70 gap-0.5">
            <a href="/" class="${navItemClass('beranda')}" title="Beranda">
              <i class="fa-solid fa-house-chimney text-xs"></i>
              <span>Beranda</span>
            </a>
            <a href="/src/pages/petualangan.html" class="${navItemClass('petualangan')}" title="Petualangan">
              <i class="fa-solid fa-route text-xs"></i>
              <span>Jalur</span>
            </a>
            <a href="/src/pages/kamus.html" class="${navItemClass('kamus')}" title="Kamus">
              <i class="fa-solid fa-book-open text-xs"></i>
              <span>Kamus</span>
            </a>
            <a href="/src/pages/kenali-budaya.html" class="${navItemClass('kenali-budaya')}" title="Kenali Budaya (AI)">
              <i class="fa-solid fa-camera text-xs text-amber-500"></i>
              <span>AI Foto</span>
            </a>
          </div>

          <!-- Action Buttons: Musik Bali + Masuk/Akun + Mobile Trigger -->
          <div class="flex items-center gap-2 sm:gap-3">
            
            <!-- Tombol Musik Tradisional Bali -->
            <button id="nav-music-btn" class="btn-toggle-bali-music px-3 sm:px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-50 via-white to-emerald-50 hover:from-amber-100 hover:to-emerald-100 border border-amber-300/80 hover:border-daun/50 text-tanah-gelap transition-all duration-300 flex items-center gap-2 text-xs font-bold shadow-xs hover:shadow-sm cursor-pointer active:scale-95" title="Putar Musik Gamelan & Rindik Bali">
              <i class="fa-solid fa-music text-terakota text-xs"></i>
              <span class="nav-music-text hidden sm:inline text-xs">Musik Bali</span>
              <span class="nav-equalizer flex items-end gap-0.5 h-3.5 text-daun">
                <span class="sound-bar"></span>
                <span class="sound-bar"></span>
                <span class="sound-bar"></span>
              </span>
            </button>

            <!-- Super Admin Link -->
            <a href="/src/pages/admin.html" class="w-9 h-9 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 flex items-center justify-center transition shadow-xs" title="Super Admin Dashboard">
              <i class="fa-solid fa-crown text-xs"></i>
            </a>

            <!-- Akun / Masuk -->
            ${user
              ? `<div class="hidden sm:flex items-center gap-2.5 bg-pasir/30 hover:bg-pasir/50 px-3 py-1.5 rounded-full border border-pasir/70 text-xs font-semibold text-tanah-gelap transition">
                   <span class="w-6 h-6 rounded-full bg-gradient-to-tr from-daun to-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                     ${displayName.charAt(0).toUpperCase()}
                   </span>
                   <span class="max-w-[110px] truncate" title="${displayName}">${displayName}</span>
                 </div>
                 <button class="w-9 h-9 rounded-full bg-pasir/30 hover:bg-red-50 hover:text-red-600 text-tanah/70 border border-pasir/60 flex items-center justify-center transition cursor-pointer" id="btn-keluar" title="Keluar dari akun">
                   <i class="fa-solid fa-right-from-bracket text-xs"></i>
                 </button>`
              : `<a href="/src/pages/masuk.html" class="btn-primer !rounded-full !px-5 !py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2">
                   <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                   <span>Masuk</span>
                 </a>`
            }

            <!-- Tombol Menu Mobile Hamburger -->
            <button class="md:hidden w-10 h-10 rounded-2xl bg-pasir/40 hover:bg-pasir/70 border border-pasir/70 text-tanah-gelap flex items-center justify-center transition" id="btn-mobile-menu" aria-label="Buka navigasi mobile">
              <i class="fa-solid fa-bars text-base" id="mobile-menu-icon"></i>
            </button>

          </div>
        </div>
      </div>

      <!-- Mobile Dropdown Drawer -->
      <div class="md:hidden hidden border-t border-pasir/50 bg-white/95 backdrop-blur-xl animate-fade-in shadow-xl" id="mobile-menu">
        <div class="px-5 py-4 space-y-2">
          ${user ? `
            <div class="p-3 bg-pasir/30 rounded-2xl border border-pasir/60 flex items-center gap-3 mb-3">
              <span class="w-8 h-8 rounded-full bg-daun text-white flex items-center justify-center font-bold text-xs shadow-xs">
                ${displayName.charAt(0).toUpperCase()}
              </span>
              <div>
                <span class="text-[10px] font-bold text-daun uppercase tracking-wider block">Penjelajah Aktif</span>
                <span class="font-heading font-bold text-sm text-tanah-gelap">${displayName}</span>
              </div>
            </div>
          ` : ''}

          <a href="/" class="${active === 'beranda' ? 'bg-daun text-white font-bold' : 'text-tanah hover:bg-pasir/40 font-medium'} flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition">
            <i class="fa-solid fa-house-chimney w-5 text-center text-xs"></i>
            <span>Beranda</span>
          </a>
          <a href="/src/pages/petualangan.html" class="${active === 'petualangan' ? 'bg-daun text-white font-bold' : 'text-tanah hover:bg-pasir/40 font-medium'} flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition">
            <i class="fa-solid fa-map-location-dot w-5 text-center text-xs"></i>
            <span>Petualangan Saya</span>
          </a>
          <a href="/src/pages/lencana.html" class="${active === 'lencana' ? 'bg-daun text-white font-bold' : 'text-tanah hover:bg-pasir/40 font-medium'} flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition">
            <i class="fa-solid fa-award w-5 text-center text-xs"></i>
            <span>Koleksi Lencana</span>
          </a>
          <a href="/src/pages/kamus.html" class="${active === 'kamus' ? 'bg-daun text-white font-bold' : 'text-tanah hover:bg-pasir/40 font-medium'} flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition">
            <i class="fa-solid fa-book-open w-5 text-center text-xs"></i>
            <span>Kamus Basa Bali</span>
          </a>
          <a href="/src/pages/budaya.html" class="${active === 'budaya' ? 'bg-daun text-white font-bold' : 'text-tanah hover:bg-pasir/40 font-medium'} flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition">
            <i class="fa-solid fa-landmark w-5 text-center text-xs"></i>
            <span>Ensiklopedia Budaya</span>
          </a>
          <a href="/src/pages/kenali-budaya.html" class="${active === 'kenali-budaya' ? 'bg-daun text-white font-bold' : 'text-tanah hover:bg-pasir/40 font-medium'} flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-camera-retro w-5 text-center text-xs text-amber-500"></i>
              <span>Kenali Budaya (AI Vision)</span>
            </div>
            <span class="badge-padi text-[10px] py-0.5 px-2 inline-flex items-center gap-1 font-bold">
              <i class="fa-solid fa-sparkles text-[9px]"></i>
              <span>Baru</span>
            </span>
          <a href="/src/pages/admin.html" class="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition">
            <i class="fa-solid fa-crown text-amber-600 w-5 text-center text-xs"></i>
            <span>Super Admin Dashboard</span>
          </a>

          ${user ? `
            <div class="border-t border-pasir/50 pt-2 mt-3">
              <button class="w-full text-left font-body text-sm font-semibold text-red-600 px-4 py-3 rounded-2xl hover:bg-red-50 flex items-center gap-3 transition" id="btn-mobile-keluar">
                <i class="fa-solid fa-right-from-bracket w-5 text-center text-xs"></i>
                <span>Keluar Akun</span>
              </button>
            </div>
          ` : `
            <div class="pt-2 mt-2">
              <a href="/src/pages/masuk.html" class="btn-primer w-full !py-3 !rounded-2xl text-sm flex items-center justify-center gap-2">
                <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
                <span>Masuk / Daftar Akun</span>
              </a>
            </div>
          `}
        </div>
      </div>
    </nav>
  `;

  // Event handler keluar
  document.getElementById('btn-keluar')?.addEventListener('click', async () => {
    await signOutUser();
  });
  document.getElementById('btn-mobile-keluar')?.addEventListener('click', async () => {
    await signOutUser();
  });

  // Toggle mobile menu
  const btnMobile = document.getElementById('btn-mobile-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileIcon = document.getElementById('mobile-menu-icon');

  if (btnMobile && mobileMenu) {
    btnMobile.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      if (mobileIcon) {
        mobileIcon.className = isOpen ? 'fa-solid fa-bars text-base' : 'fa-solid fa-xmark text-base';
      }
      btnMobile.setAttribute('aria-label', isOpen ? 'Buka navigasi mobile' : 'Tutup navigasi mobile');
    });
  }

  // Pasang pemutar audio Bali & maskot Bara di seluruh halaman
  initBalineseAudio();
}
