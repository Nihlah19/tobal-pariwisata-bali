/**
 * Navbar — Tour Penjelajah Bali
 * Menu: Beranda, Petualangan Saya, Lencana, Masuk/Keluar
 * Slot nonaktif: Kamus, Budaya, Kenali Budaya (tahap 7-9)
 */
import {
  createElement,
  Compass, Map, Award, LogIn, LogOut, User,
  Menu, X, BookOpen, Landmark, Camera, Sparkles
} from 'lucide';
import { getCurrentUser, getUserProfile, signOutUser } from '../lib/auth.js';

/**
 * Menentukan halaman aktif dari URL.
 */
function getActivePage() {
  const path = window.location.pathname;
  if (path === '/' || path.includes('index')) return 'beranda';
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
 * Render navbar ke elemen target dan sinkronkan dengan Supabase Auth.
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

  const linkClass = (page) =>
    active === page ? 'nav-link-active' : 'nav-link';

  el.innerHTML = `
    <nav class="sticky top-0 z-30 bg-krem/90 backdrop-blur-md border-b border-pasir/40" role="navigation" aria-label="Navigasi utama">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a href="/" class="flex items-center gap-2 group" aria-label="Beranda Tour Penjelajah Bali">
            <span class="text-daun transition-transform duration-300 group-hover:rotate-12" id="nav-logo-icon"></span>
            <span class="font-heading font-bold text-lg text-tanah-gelap hidden sm:block">
              Penjelajah Bali
            </span>
          </a>

          <!-- Desktop Menu -->
          <div class="hidden md:flex items-center gap-1">
            <a href="/" class="${linkClass('beranda')} flex items-center gap-1.5">
              <span id="nav-icon-beranda"></span>
              Beranda
            </a>
            <a href="/src/pages/petualangan.html" class="${linkClass('petualangan')} flex items-center gap-1.5">
              <span id="nav-icon-petualangan"></span>
              Petualangan Saya
            </a>
            <a href="/src/pages/lencana.html" class="${linkClass('lencana')} flex items-center gap-1.5">
              <span id="nav-icon-lencana"></span>
              Lencana
            </a>

            <!-- Divider -->
            <div class="w-px h-6 bg-pasir mx-2"></div>

            <a href="/src/pages/kamus.html" class="${linkClass('kamus')} flex items-center gap-1.5">
              <span id="nav-icon-kamus"></span>
              Kamus
            </a>
            <a href="/src/pages/budaya.html" class="${linkClass('budaya')} flex items-center gap-1.5">
              <span id="nav-icon-budaya"></span>
              Budaya
            </a>
            <a href="/src/pages/kenali-budaya.html" class="${linkClass('kenali-budaya')} flex items-center gap-1.5" title="Kenali Budaya dari Foto dengan AI">
              <span id="nav-icon-foto"></span>
              Kenali Budaya
            </a>
          </div>

          <!-- Auth + Mobile Toggle -->
          <div class="flex items-center gap-2">
            ${user
              ? `<div class="hidden sm:flex items-center gap-2 text-sm font-body text-tanah bg-pasir/40 px-3 py-1.5 rounded-full border border-pasir/60">
                   <span id="nav-icon-user" class="text-daun"></span>
                   <span class="font-medium text-tanah-gelap max-w-[120px] truncate" title="${displayName}">${displayName}</span>
                 </div>
                 <button class="btn-ghost text-sm !px-3 !py-1.5" id="btn-keluar" title="Keluar dari akun">
                   <span id="nav-icon-keluar"></span>
                   <span class="hidden sm:inline">Keluar</span>
                 </button>`
              : `<a href="/src/pages/masuk.html" class="btn-primer text-sm !px-4 !py-2">
                   <span id="nav-icon-masuk"></span>
                   Masuk
                 </a>`
            }
            <button class="md:hidden btn-ghost p-2" id="btn-mobile-menu" aria-label="Buka menu">
              <span id="nav-icon-menu"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div class="md:hidden hidden border-t border-pasir/40 bg-krem/95 backdrop-blur-md" id="mobile-menu">
        <div class="px-4 py-3 space-y-1">
          ${user ? `<div class="px-3 py-2 text-xs font-semibold text-daun uppercase tracking-wider">Halo, ${displayName}</div>` : ''}
          <a href="/" class="${linkClass('beranda')} block">Beranda</a>
          <a href="/src/pages/petualangan.html" class="${linkClass('petualangan')} block">Petualangan Saya</a>
          <a href="/src/pages/lencana.html" class="${linkClass('lencana')} block">Lencana</a>
          <a href="/src/pages/kamus.html" class="${linkClass('kamus')} block">Kamus Bahasa Bali</a>
          <a href="/src/pages/budaya.html" class="${linkClass('budaya')} block">Ensiklopedia Budaya</a>
          <a href="/src/pages/kenali-budaya.html" class="${linkClass('kenali-budaya')} block flex items-center justify-between">
            <span>Kenali Budaya (AI)</span>
            <span class="badge-padi text-xs py-0.5 px-2 inline-flex items-center gap-1">
              <i class="fa-solid fa-sparkles text-[10px]"></i>
              <span>Baru</span>
            </span>
          </a>
          ${user ? `
            <div class="border-t border-pasir/40 my-2"></div>
            <button class="w-full text-left font-body text-sm font-medium text-red-600 px-3 py-2 rounded-2xl hover:bg-red-50 transition-colors" id="btn-mobile-keluar">
              Keluar Akun
            </button>
          ` : ''}
        </div>
      </div>
    </nav>
  `;

  // Render ikon Lucide
  const icons = {
    'nav-logo-icon': Compass,
    'nav-icon-beranda': Compass,
    'nav-icon-petualangan': Map,
    'nav-icon-lencana': Award,
    'nav-icon-kamus': BookOpen,
    'nav-icon-budaya': Landmark,
    'nav-icon-foto': Camera,
    'nav-icon-masuk': LogIn,
    'nav-icon-keluar': LogOut,
    'nav-icon-user': User,
    'nav-icon-menu': Menu,
  };

  Object.entries(icons).forEach(([id, iconData]) => {
    const target = document.getElementById(id);
    if (target) {
      const svg = createElement(iconData);
      svg.setAttribute('width', '18');
      svg.setAttribute('height', '18');
      target.appendChild(svg);
    }
  });

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
  if (btnMobile && mobileMenu) {
    btnMobile.addEventListener('click', () => {
      const isOpen = !mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden');
      btnMobile.querySelector('svg')?.remove();
      const newIcon = createElement(isOpen ? Menu : X);
      newIcon.setAttribute('width', '20');
      newIcon.setAttribute('height', '20');
      btnMobile.querySelector('span')?.appendChild(newIcon);
      btnMobile.setAttribute('aria-label', isOpen ? 'Buka menu' : 'Tutup menu');
    });
  }
}
