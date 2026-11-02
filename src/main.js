/**
 * Main Entry — Tour Penjelajah Bali (Beranda)
 * Eksekusi ultra-cepat tanpa blocking waterfall render.
 */
import './styles/main.css';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { createElement, Sparkles, Volume2, ArrowRight } from 'lucide';
import { getSession, getUserProfile, hasCachedSession } from './lib/auth.js';
import { getWordOfTheDay, TINGKAT_STYLE_MAP, KELAS_KATA_MAP } from './lib/dictionary.js';
import { showToast } from './components/ui.js';
import { setupProtectedLinks } from './lib/authGate.js';

// 1. Render layout secara sinkron (FCP < 0.3s)
renderNavbar('#navbar');
renderFooter('#footer');

// 2. Lindungi fitur pada landing page
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

// 4. Render 'Kata Bahasa Bali Hari Ini' (Kruna Rahina Mangkin)
function renderWordOfTheDay() {
  const container = document.getElementById('kata-hari-ini-container');
  if (!container) return;

  const word = getWordOfTheDay();
  const tingkatInfo = TINGKAT_STYLE_MAP[word.tingkat] || TINGKAT_STYLE_MAP['umum'];
  const kelasLabel = KELAS_KATA_MAP[word.kelas_kata] || word.kelas_kata;

  container.innerHTML = `
    <div class="card-natural !p-6 sm:!p-8 bg-white/95 backdrop-blur-md shadow-sm border border-pasir/80 relative overflow-hidden group">
      
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-pasir/60">
        <div>
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-daun/10 text-daun border border-daun/20 text-xs font-semibold uppercase tracking-wider mb-2">
            <span id="wotd-sparkle-icon"></span>
            Kata Hari Ini · Kruna Rahina Mangkin
          </div>
          <h2 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap">
            Pelajari Kosakata Budaya Bali
          </h2>
        </div>

        <span class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${tingkatInfo.badgeClass} shadow-xs">
          <span class="w-2 h-2 rounded-full ${tingkatInfo.dotClass}"></span>
          Tingkat: ${tingkatInfo.label}
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        <!-- Info Kata Utama -->
        <div class="lg:col-span-5 space-y-2">
          <div class="flex items-baseline gap-3">
            <span class="font-heading text-3xl sm:text-4xl font-extrabold text-daun-gelap tracking-wide">
              ${word.kata}
            </span>
            <span class="font-mono text-xs text-tanah/70 bg-krem px-2.5 py-1 rounded-lg border border-pasir" title="${kelasLabel}">
              ${word.kelas_kata} · ${kelasLabel.split(' ')[0]}
            </span>
          </div>
          <p class="font-body text-base font-semibold text-tanah-gelap leading-snug">
            ${word.arti_indonesia}
          </p>
          ${word.arti_inggris ? `
            <p class="font-body text-xs text-tanah/70 italic">
              English: ${word.arti_inggris}
            </p>
          ` : ''}
        </div>

        <!-- Contoh Kalimat & Catatan -->
        <div class="lg:col-span-7 space-y-3">
          ${word.contoh_bali ? `
            <div class="p-4 rounded-2xl bg-krem/70 border border-pasir/70 text-xs sm:text-sm space-y-1">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-tanah/60 block">Contoh Percakapan:</span>
              <p class="font-body italic font-semibold text-tanah-gelap">
                "${word.contoh_bali}"
              </p>
              ${word.contoh_terjemahan ? `
                <p class="text-tanah text-xs">
                  ${word.contoh_terjemahan}
                </p>
              ` : ''}
            </div>
          ` : ''}

          ${word.catatan ? `
            <p class="text-xs text-tanah/80 bg-amber-50/70 p-3 rounded-xl border border-amber-200/50 flex items-start gap-2">
              <svg class="w-4 h-4 text-amber-600 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span><strong class="text-amber-950 font-medium">Etika Tutur:</strong> ${word.catatan}</span>
            </p>
          ` : ''}
        </div>

      </div>

      <!-- Footer Card Actions -->
      <div class="mt-6 pt-5 border-t border-pasir/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <button id="btn-wotd-speak" class="btn-ghost !py-2 !px-3 text-xs flex items-center gap-1.5 border border-pasir cursor-pointer">
            <span id="wotd-audio-icon"></span>
            Dengarkan Lafal
          </button>
          <a href="/src/pages/kamus.html?kata=${encodeURIComponent(word.kata)}" class="btn-sekunder !py-2 !px-4 text-xs font-semibold">
            Buka di Kamus
          </a>
        </div>

        <a href="/src/pages/kamus.html" class="inline-flex items-center gap-1 text-daun hover:text-daun-gelap font-semibold text-xs sm:text-sm">
          <span>Jelajahi 40+ Kosakata Lainnya</span>
          <span id="wotd-arrow-icon"></span>
        </a>
      </div>

    </div>
  `;

  // Render icons dengan Lucide
  const iconSparkle = document.getElementById('wotd-sparkle-icon');
  if (iconSparkle) {
    const svg = createElement(Sparkles);
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    iconSparkle.appendChild(svg);
  }

  const iconAudio = document.getElementById('wotd-audio-icon');
  if (iconAudio) {
    const svg = createElement(Volume2);
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    iconAudio.appendChild(svg);
  }

  const iconArrow = document.getElementById('wotd-arrow-icon');
  if (iconArrow) {
    const svg = createElement(ArrowRight);
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    iconArrow.appendChild(svg);
  }

  // Audio lafal kata
  document.getElementById('btn-wotd-speak')?.addEventListener('click', () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.kata);
      utterance.lang = 'id-ID';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
    showToast(`Melafalkan: "${word.kata}"`, 'info');
  });
}

renderWordOfTheDay();

// 5. Scroll-triggered fade-in cepat tanpa lag
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

document.querySelectorAll('.card-organik, .animate-slide-up, #kata-hari-ini').forEach((el) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(16px)';
  el.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
  observer.observe(el);
});
