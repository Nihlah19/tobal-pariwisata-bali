/**
 * Main Entry — Tour Penjelajah Bali (Beranda)
 * Eksekusi ultra-cepat tanpa blocking waterfall render.
 */
import './styles/main.css';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { getSession, getUserProfile, hasCachedSession } from './lib/auth.js';
import { showToast } from './components/ui.js';
import { setupProtectedLinks } from './lib/authGate.js';
import { registerServiceWorker } from './lib/registerSW.js';
import { initReviewsSection } from './components/reviewsSection.js';

// 1. Registrasi Service Worker untuk Caching Offline & Jaringan Lambat
registerServiceWorker();

// 2. Render layout secara sinkron (FCP < 0.3s)
renderNavbar('#navbar');
renderFooter('#footer');

// 3. Inisialisasi Ulasan Terkurasi Penjelajah
initReviewsSection('#ulasan-penjelajah-container');

// 4. Lindungi fitur pada landing page
setupProtectedLinks();

// 3. Inisialisasi CTA tombol utama tanpa blocking
function setupHeroCta() {
  const heroCta = document.getElementById('hero-cta');
  if (!heroCta) return;

  // Jika ada token di cache, hidrasi di latar belakang
  if (hasCachedSession()) {
    setTimeout(async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const profile = await getUserProfile(session.user.id);
          const hasOnboarded = profile?.interests && profile.interests.length > 0;
          
          heroCta.innerHTML = `
            <svg class="w-4 h-4 text-krem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
            <span>${hasOnboarded ? 'Lanjutkan Petualangan' : 'Atur Preferensi Minat'}</span>
          `;
          heroCta.href = hasOnboarded ? '/src/pages/petualangan.html' : '/src/pages/onboarding.html';
          heroCta.removeAttribute('data-auth-required');
        }
      } catch (err) {
        console.warn('[Hero CTA] Sesi offline:', err);
      }
    }, 20);
  }
}

setupHeroCta();

// 4. Scroll-triggered fade-in cepat tanpa lag
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

document.querySelectorAll('.card-organik, .animate-slide-up').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
  observer.observe(el);
});
