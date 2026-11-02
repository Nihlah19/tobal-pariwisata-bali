/**
 * Footer — Tour Penjelajah Bali
 */
import { createElement, Compass } from 'lucide';

export function renderFooter(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  el.innerHTML = `
    <footer class="bg-tanah-gelap text-krem/80 mt-auto">
      <!-- Divider gelombang -->
      <div class="wave-divider -mb-px">
        <svg viewBox="0 0 1200 80" preserveAspectRatio="none" class="w-full h-12 sm:h-16">
          <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
                fill="#3B2F24"/>
        </svg>
      </div>

      <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <!-- Brand -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span id="footer-logo-icon" class="text-padi"></span>
              <span class="font-heading font-bold text-lg text-krem">Penjelajah Bali</span>
            </div>
            <p class="text-sm leading-relaxed text-krem/60">
              Jelajahi Bali melampaui tempat viral. Temukan budaya, rasa, dan
              keindahan yang tersembunyi di setiap sudut Pulau Dewata.
            </p>
          </div>

          <!-- Navigasi -->
          <div>
            <h4 class="font-heading font-semibold text-krem mb-3 text-sm uppercase tracking-wider">
              Navigasi
            </h4>
            <ul class="space-y-2 text-sm">
              <li><a href="/" class="hover:text-padi transition-colors">Beranda</a></li>
              <li><a href="/src/pages/petualangan.html" class="hover:text-padi transition-colors">Petualangan Saya</a></li>
              <li><a href="/src/pages/lencana.html" class="hover:text-padi transition-colors">Lencana</a></li>
              <li><a href="/src/pages/kamus.html" class="hover:text-padi transition-colors">Kamus Bahasa Bali</a></li>
              <li><a href="/src/pages/budaya.html" class="hover:text-padi transition-colors">Ensiklopedia Budaya</a></li>
              <li><a href="/src/pages/kenali-budaya.html" class="hover:text-padi transition-colors">Kenali Budaya (AI)</a></li>
              <li><a href="/src/pages/masuk.html" class="hover:text-padi transition-colors">Masuk</a></li>
            </ul>
          </div>

          <!-- Info -->
          <div>
            <h4 class="font-heading font-semibold text-krem mb-3 text-sm uppercase tracking-wider">
              Kompetisi
            </h4>
            <p class="text-sm text-krem/60">
              Dibuat untuk <span class="text-padi font-medium">Bali Digifest 2026</span><br>
              AI Web Innovation Challenge
            </p>
            <p class="text-sm text-krem/60 mt-3">
              Data destinasi dan kearifan lokal
              <span class="text-padi/90 font-medium">terkurasi secara kultural</span> bersama komunitas penutur Bali.
            </p>
          </div>
        </div>

        <!-- Bottom bar -->
        <div class="border-t border-krem/10 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-krem/60">
          <p class="font-body">
            © 2026 Tour Penjelajah Bali. powered by <span class="text-padi font-semibold">Nihlah.Auliya</span>
          </p>
        </div>
      </div>
    </footer>
  `;

  // Render ikon
  const footerLogo = document.getElementById('footer-logo-icon');
  if (footerLogo) {
    const svg = createElement(Compass);
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    footerLogo.appendChild(svg);
  }
}
