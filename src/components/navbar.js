/**
 * Navbar — Tour Penjelajah Bali
 * Desain: Clean, Human-Crafted Editorial Navigation (Cepat, Ringan & Non-blocking)
 */

import { getCurrentUser, getUserProfile, signOutUser, hasCachedSession } from '../lib/auth.js';
import { initBalineseAudio } from './balineseAudio.js';
import { setupProtectedLinks } from '../lib/authGate.js';
import { registerServiceWorker } from '../lib/registerSW.js';
import { initChatbot } from './chatModal.js';

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

export function renderNavbar(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  registerServiceWorker();
  initChatbot();

  const active = getActivePage();
  const isAdminCached = sessionStorage.getItem('tobal_admin_key') === 'tobal2026';
  const hasCached = hasCachedSession();

  const navItemClass = (page) =>
    active === page
      ? 'bg-daun text-white font-semibold shadow-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs transition-all'
      : 'text-tanah-gelap/80 hover:text-daun hover:bg-white/80 font-medium px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-xs transition-colors';

  // Render navbar layout IMMEDIATELY (0ms blocking time)
  el.innerHTML = `
    <nav class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pasir/60 shadow-xs" role="navigation" aria-label="Navigasi Utama">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-18">
          
          <!-- Logo Brand Elegan & Bersih -->
          <a href="/" class="flex items-center gap-2.5 group shrink-0" aria-label="Beranda Tobal">
            <div class="w-9 h-9 rounded-xl bg-daun/10 text-daun border border-daun/20 flex items-center justify-center font-heading font-black text-sm transition-transform group-hover:scale-105">
              <span>TB</span>
            </div>
            <div class="flex flex-col">
              <span class="font-heading font-bold text-lg text-tanah-gelap tracking-tight leading-none group-hover:text-daun transition-colors">
                Tobal
              </span>
              <span class="text-[9px] tracking-widest text-tanah/60 uppercase font-semibold mt-0.5">
                Penjelajah Bali
              </span>
            </div>
          </a>

          <!-- Menu Desktop: Capsule Dock Minimalis -->
          <div class="hidden xl:flex items-center p-1 rounded-full bg-pasir/30 border border-pasir/60 backdrop-blur-sm gap-0.5">
            <a href="/" class="${navItemClass('beranda')}" title="Beranda">
              <span>Beranda</span>
            </a>
            <a href="/src/pages/petualangan.html" class="${navItemClass('petualangan')}" title="Jalur Petualangan" data-auth-required="true" data-feature-name="Jalur Petualangan Cerdas">
              <span>Petualangan</span>
            </a>
            <a href="/src/pages/lencana.html" class="${navItemClass('lencana')}" title="Koleksi Lencana" data-auth-required="true" data-feature-name="Koleksi Lencana Budaya">
              <span>Lencana</span>
            </a>
            <a href="/src/pages/kamus.html" class="${navItemClass('kamus')}" title="Kamus Etika Basa Bali">
              <span>Kamus Basa Bali</span>
            </a>
            <a href="/src/pages/budaya.html" class="${navItemClass('budaya')}" title="Ensiklopedia Budaya">
              <span>Ensiklopedia</span>
            </a>
            <a href="/src/pages/kenali-budaya.html" class="${navItemClass('kenali-budaya')}" title="Kenali Budaya (AI)" data-auth-required="true" data-feature-name="Kenali Budaya (AI Vision)">
              <span>Kenali Budaya</span>
              <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full">AI</span>
            </a>
          </div>

          <!-- Secondary Menu (Layar Medium) -->
          <div class="hidden md:flex xl:hidden items-center p-1 rounded-full bg-pasir/30 border border-pasir/60 gap-0.5">
            <a href="/" class="${navItemClass('beranda')}">Beranda</a>
            <a href="/src/pages/petualangan.html" class="${navItemClass('petualangan')}" data-auth-required="true">Petualangan</a>
            <a href="/src/pages/kamus.html" class="${navItemClass('kamus')}">Kamus</a>
            <a href="/src/pages/budaya.html" class="${navItemClass('budaya')}">Ensiklopedia</a>
            <a href="/src/pages/kenali-budaya.html" class="${navItemClass('kenali-budaya')}" data-auth-required="true">AI Budaya</a>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2 sm:gap-2.5">
            
            <!-- Tombol Chat AI Budaya (Database Access) -->
            <button id="nav-chat-ai-btn" class="px-3 py-1.5 rounded-full bg-daun/10 hover:bg-daun/20 text-daun border border-daun/30 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer" title="Tanya AI Budaya Tobal">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Chat AI</span>
            </button>

            <!-- Tombol Musik Suasana Bali -->
            <button id="nav-music-btn" class="btn-toggle-bali-music px-3 py-1.5 rounded-full bg-pasir/40 hover:bg-pasir/70 text-tanah-gelap border border-pasir/70 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer" title="Alunan Rindik Ubud">
              <svg class="w-3.5 h-3.5 text-daun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18V5l12-2v13"></path>
                <circle cx="6" cy="18" r="3"></circle>
                <circle cx="18" cy="16" r="3"></circle>
              </svg>
              <span class="hidden sm:inline">Rindik Bali</span>
            </button>

            <!-- Admin Link Container (dihidrasi otomatis) -->
            <div id="navbar-admin-slot">
              ${isAdminCached ? `
                <a href="/src/pages/admin.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-xs">
                  <svg class="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Admin</span>
                </a>
              ` : ''}
            </div>

            <!-- Akun / Masuk Slot -->
            <div id="navbar-auth-slot">
              <a href="/src/pages/masuk.html" class="btn-primer !rounded-full !px-4 !py-2 text-xs font-bold shadow-xs hover:shadow-md transition">
                <span>Masuk</span>
              </a>
            </div>

            <!-- Hamburger Mobile -->
            <button class="md:hidden w-9 h-9 rounded-xl bg-pasir/30 hover:bg-pasir/60 border border-pasir/60 text-tanah-gelap flex items-center justify-center transition cursor-pointer" id="btn-mobile-menu" aria-label="Buka navigasi mobile">
              <svg class="w-4 h-4" id="mobile-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

          </div>
        </div>
      </div>

      <!-- Mobile Drawer -->
      <div class="md:hidden hidden border-t border-pasir/50 bg-white/98 backdrop-blur-xl animate-fade-in shadow-lg" id="mobile-menu">
        <div class="px-4 py-3 space-y-1 text-sm font-medium">
          <div id="mobile-user-slot"></div>
          <a href="/" class="${active === 'beranda' ? 'bg-daun text-white font-semibold' : 'text-tanah hover:bg-pasir/30'} flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition">
            <span>Beranda</span>
          </a>
          <a href="/src/pages/petualangan.html" class="${active === 'petualangan' ? 'bg-daun text-white font-semibold' : 'text-tanah hover:bg-pasir/30'} flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition" data-auth-required="true" data-feature-name="Jalur Petualangan Cerdas">
            <span>Petualangan Saya</span>
          </a>
          <a href="/src/pages/lencana.html" class="${active === 'lencana' ? 'bg-daun text-white font-semibold' : 'text-tanah hover:bg-pasir/30'} flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition" data-auth-required="true" data-feature-name="Koleksi Lencana Budaya">
            <span>Koleksi Lencana</span>
          </a>
          <a href="/src/pages/kamus.html" class="${active === 'kamus' ? 'bg-daun text-white font-semibold' : 'text-tanah hover:bg-pasir/30'} flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition">
            <span>Kamus Basa Bali</span>
          </a>
          <a href="/src/pages/budaya.html" class="${active === 'budaya' ? 'bg-daun text-white font-semibold' : 'text-tanah hover:bg-pasir/30'} flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition">
            <span>Ensiklopedia Budaya</span>
          </a>
          <a href="/src/pages/kenali-budaya.html" class="${active === 'kenali-budaya' ? 'bg-daun text-white font-semibold' : 'text-tanah hover:bg-pasir/30'} flex items-center justify-between px-3.5 py-2.5 rounded-xl transition" data-auth-required="true" data-feature-name="Kenali Budaya (AI Vision)">
            <span>Kenali Budaya</span>
            <span class="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full">AI</span>
          </a>
          <button type="button" id="mobile-chat-ai-btn" class="w-full text-left text-daun font-semibold hover:bg-pasir/30 flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Tanya AI Budaya (Database)</span>
            </span>
            <span class="text-xs">💬</span>
          </button>
          <div id="mobile-admin-slot"></div>
        </div>
      </div>
    </nav>
  `;

  // Toggle mobile menu
  const btnMobile = document.getElementById('btn-mobile-menu');
  const mobileMenu = document.getElementById('mobile-menu');
  if (btnMobile && mobileMenu) {
    btnMobile.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Hubungkan tombol Chat AI di Navbar Desktop & Mobile ke Launcher
  const triggerChat = () => {
    const launcherBtn = document.getElementById('btn-open-tobal-chat');
    if (launcherBtn) {
      launcherBtn.click();
    }
    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
    }
  };

  document.getElementById('nav-chat-ai-btn')?.addEventListener('click', triggerChat);
  document.getElementById('mobile-chat-ai-btn')?.addEventListener('click', triggerChat);

  // Pasang pemutar audio
  initBalineseAudio();

  // Hidrasi sesi user secara asinkron di latar belakang (tanpa menghalangi render utama)
  if (hasCached) {
    setTimeout(async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getUserProfile(user.id);
          const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Penjelajah';
          const isAdmin = user.email === 'admin@tobal.id' || user.email?.startsWith('admin@') || profile?.role === 'admin' || sessionStorage.getItem('tobal_admin_key') === 'tobal2026';

          const authSlot = document.getElementById('navbar-auth-slot');
          if (authSlot) {
            authSlot.innerHTML = `
              <div class="flex items-center gap-2">
                <div class="hidden sm:flex items-center gap-2 bg-pasir/30 px-3 py-1.5 rounded-full border border-pasir/60 text-xs font-semibold text-tanah-gelap">
                  <span class="w-5 h-5 rounded-full bg-daun text-white flex items-center justify-center text-[10px] font-bold">
                    ${displayName.charAt(0).toUpperCase()}
                  </span>
                  <span class="max-w-[100px] truncate">${displayName}</span>
                </div>
                <button class="w-8 h-8 rounded-full bg-pasir/30 hover:bg-red-50 hover:text-red-600 text-tanah/70 border border-pasir/60 flex items-center justify-center transition cursor-pointer" id="btn-keluar" title="Keluar Akun">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            `;
            document.getElementById('btn-keluar')?.addEventListener('click', async () => {
              await signOutUser();
            });
          }

          if (isAdmin) {
            const adminSlot = document.getElementById('navbar-admin-slot');
            if (adminSlot && !adminSlot.innerHTML.trim()) {
              adminSlot.innerHTML = `
                <a href="/src/pages/admin.html" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition shadow-xs">
                  <svg class="w-3.5 h-3.5 text-amber-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span>Admin</span>
                </a>
              `;
            }
          }
        }
      } catch (e) {
        console.warn('[Navbar] Gagal hidrasi sesi:', e);
      }
    }, 10);
  }

  // Pasang proteksi auth
  setupProtectedLinks();
}
