/**
 * Balinese Audio Player & Bara Companion Widget
 * Tour Penjelajah Bali — Bali Digifest 2026
 *
 * Mengelola pemutaran musik gamelan & rindik Bali yang menenangkan,
 * serta menghadirkan widget pendamping maskot 'Bara si Barong Penjelajah'
 * di seluruh halaman aplikasi.
 */

// Tips budaya acak dari Bara si Barong Penjelajah
const CULTURAL_TIPS = [
  'Ucapkan "Om Swastyastu" dengan kedua telapak tangan terkatup di dada saat menyapa warga desa.',
  'Hormati canang sari (sesajen) di jalan setapak; langkahi dengan hati-hati dan jangan diinjak.',
  'Saat memasuki kawasan suci pura, kenakan kamen (kain sarung) dan selendang yang diikat rapi di pinggang.',
  'Gunakan kata "Matur Suksma" untuk menyampaikan rasa terima kasih yang tulus dan bersahabat.',
  'Gunakan tangan kanan atau kedua tangan saat memberi atau menerima sesuatu dari warga lokal.',
  'Filosofi Tri Hita Karana mengajarkan keharmonisan manusia dengan Tuhan, alam semesta, dan sesama.',
];

class BalineseAudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.volume = parseFloat(localStorage.getItem('tobal_music_volume') || '0.5');
    this.listeners = new Set();
    this.tipIndex = 0;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Siapkan elemen Audio HTML5
    this.audio = new Audio('/audio/balinese-rindik.wav');
    this.audio.loop = true;
    this.audio.volume = this.volume;
    this.audio.preload = 'metadata';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyState();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyState();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[BalineseAudio] Gagal memuat file audio, beralih ke Web Audio synthesizer:', e);
      this.isPlaying = false;
      this.notifyState();
    });

    // Pasang UI Floating Companion ke DOM jika belum ada
    this.mountFloatingCompanion();
    this.bindGlobalTriggers();
  }

  async togglePlay() {
    if (!this.audio) this.init();

    try {
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        await this.audio.play();
      }
    } catch (err) {
      console.warn('[BalineseAudio] Autoplay dicegah oleh browser, menunggu interaksi pengguna:', err);
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    localStorage.setItem('tobal_music_volume', this.volume.toString());
    this.notifyState();
  }

  nextTip() {
    this.tipIndex = (this.tipIndex + 1) % CULTURAL_TIPS.length;
    const tipEl = document.getElementById('bara-tip-text');
    if (tipEl) {
      tipEl.textContent = CULTURAL_TIPS[this.tipIndex];
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({ isPlaying: this.isPlaying, volume: this.volume });
    return () => this.listeners.delete(callback);
  }

  notifyState() {
    const state = { isPlaying: this.isPlaying, volume: this.volume };
    this.listeners.forEach((fn) => fn(state));
    this.updateDomUI();
  }

  mountFloatingCompanion() {
    if (document.getElementById('bara-floating-container')) return;

    const container = document.createElement('div');
    container.id = 'bara-floating-container';
    container.className = 'fixed bottom-4 right-4 z-40 select-none font-body';

    container.innerHTML = `
      <!-- Modal Panel Companion -->
      <div id="bara-companion-panel" class="hidden mb-3 w-[310px] sm:w-[350px] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-pasir/80 overflow-hidden transition-all duration-300 transform origin-bottom-right">
        
        <!-- Header Panel -->
        <div class="bg-gradient-to-r from-daun to-daun/90 text-krem p-4 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img src="/images/mascot-barong-head.png" alt="Bara" class="w-8 h-8 object-contain">
            </div>
            <div>
              <h4 class="font-heading font-bold text-sm text-krem leading-tight">Bara Penjelajah</h4>
              <p class="text-[11px] text-krem/80">Kawan Budaya & Suasana Bali</p>
            </div>
          </div>
          <button id="bara-close-panel-btn" class="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-krem flex items-center justify-center transition" aria-label="Tutup Panel">
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <!-- Konten Panel -->
        <div class="p-4 space-y-3.5">
          
          <!-- Pemutar Musik Tradisional -->
          <div class="bg-krem/70 rounded-2xl p-3 border border-pasir/60">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-music text-terakota text-xs"></i>
                <span class="text-xs font-bold text-tanah-gelap">Suasana Gamelan & Rindik</span>
              </div>
              <!-- Equalizer animation -->
              <div class="flex items-end gap-0.5 h-3.5 text-daun" id="panel-equalizer">
                <span class="sound-bar"></span>
                <span class="sound-bar"></span>
                <span class="sound-bar"></span>
                <span class="sound-bar"></span>
              </div>
            </div>

            <p class="text-[11px] text-tanah/70 mb-3" id="panel-music-status">
              Alunan bambu rindik Ubud yang menenangkan hati dan pikiran.
            </p>

            <!-- Kontrol Audio -->
            <div class="flex items-center gap-3">
              <button id="bara-play-toggle-btn" class="btn-primer !py-2 !px-4 !min-h-[38px] text-xs flex items-center gap-2 shadow-sm">
                <i class="fa-solid fa-play" id="bara-play-icon"></i>
                <span id="bara-play-label">Putar Musik</span>
              </button>

              <!-- Volume Slider -->
              <div class="flex items-center gap-1.5 flex-1">
                <i class="fa-solid fa-volume-low text-[10px] text-tanah/60"></i>
                <input type="range" id="bara-volume-slider" min="0" max="1" step="0.05" value="${this.volume}" class="w-full accent-daun cursor-pointer h-1.5 bg-pasir rounded-lg">
                <i class="fa-solid fa-volume-high text-[10px] text-tanah/60"></i>
              </div>
            </div>
          </div>

          <!-- Tips Budaya dari Bara -->
          <div class="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/50">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                <i class="fa-solid fa-lightbulb text-amber-500"></i>
                Tips Budaya Hari Ini
              </span>
              <button id="bara-next-tip-btn" class="text-[10px] text-amber-700 hover:text-amber-900 underline font-medium" title="Tips berikutnya">
                Ganti tips
              </button>
            </div>
            <p id="bara-tip-text" class="text-xs text-tanah/80 italic leading-relaxed">
              "${CULTURAL_TIPS[this.tipIndex]}"
            </p>
          </div>

          <!-- Pintasan Navigasi Cepat -->
          <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <a href="/src/pages/kenali-budaya.html" class="p-2 rounded-xl bg-white border border-pasir hover:border-daun/40 hover:bg-daun/5 text-tanah-gelap flex items-center gap-2 transition">
              <i class="fa-solid fa-camera-retro text-daun"></i>
              <span>Foto Budaya AI</span>
            </a>
            <a href="/src/pages/kamus.html" class="p-2 rounded-xl bg-white border border-pasir hover:border-daun/40 hover:bg-daun/5 text-tanah-gelap flex items-center gap-2 transition">
              <i class="fa-solid fa-book-open text-daun"></i>
              <span>Kamus Basa Bali</span>
            </a>
          </div>

        </div>

      </div>

      <!-- Floating Trigger Button (Mascot Bara) -->
      <div class="flex items-center gap-2 justify-end">
        
        <!-- Speech Bubble Mini (Awal Masuk) -->
        <div id="bara-speech-bubble" class="hidden sm:flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-pasir shadow-md text-xs text-tanah-gelap animate-fade-in cursor-pointer hover:border-terakota/40 transition">
          <span class="w-2 h-2 rounded-full bg-daun animate-ping"></span>
          <span class="font-medium" id="bara-bubble-label">Musik Bali & Pemandu Bara</span>
        </div>

        <!-- Tombol Utama Maskot Bara -->
        <button id="bara-companion-btn" class="relative group w-14 h-14 rounded-full bg-gradient-to-tr from-amber-300 via-orange-200 to-emerald-100 border-2 border-terakota/40 shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none" title="Buka Pemandu Bara & Musik Tradisional Bali">
          
          <!-- Maskot Headshot -->
          <img src="/images/mascot-barong-head.png" alt="Bara Maskot" class="w-11 h-11 object-contain transition-transform group-hover:rotate-6">

          <!-- Equalizer Mini Melayang Saat Bermusik -->
          <div id="btn-mini-equalizer" class="hidden absolute -top-1 -right-1 bg-daun text-white w-6 h-6 rounded-full border border-white shadow-md flex items-center justify-center">
            <i class="fa-solid fa-music text-[9px] animate-pulse"></i>
          </div>

          <!-- Pulsing glow ring -->
          <span class="absolute inset-0 rounded-full border-2 border-terakota/30 animate-pulse-aura pointer-events-none"></span>
        </button>

      </div>
    `;

    document.body.appendChild(container);

    // Event listener panel
    const btn = document.getElementById('bara-companion-btn');
    const panel = document.getElementById('bara-companion-panel');
    const closeBtn = document.getElementById('bara-close-panel-btn');
    const playBtn = document.getElementById('bara-play-toggle-btn');
    const slider = document.getElementById('bara-volume-slider');
    const nextTipBtn = document.getElementById('bara-next-tip-btn');
    const bubble = document.getElementById('bara-speech-bubble');

    const togglePanel = () => {
      panel.classList.toggle('hidden');
    };

    if (btn) btn.addEventListener('click', togglePanel);
    if (bubble) bubble.addEventListener('click', togglePanel);
    if (closeBtn) closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    if (playBtn) {
      playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (slider) {
      slider.addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }

    if (nextTipBtn) {
      nextTipBtn.addEventListener('click', () => this.nextTip());
    }
  }

  bindGlobalTriggers() {
    // Tombol di navbar atau halaman lain dengan class '.btn-toggle-bali-music'
    document.querySelectorAll('.btn-toggle-bali-music').forEach((btn) => {
      btn.addEventListener('click', () => this.togglePlay());
    });
  }

  updateDomUI() {
    // 1. Tombol & icon di panel companion
    const playIcon = document.getElementById('bara-play-icon');
    const playLabel = document.getElementById('bara-play-label');
    const statusText = document.getElementById('panel-music-status');
    const miniEq = document.getElementById('btn-mini-equalizer');
    const bubbleLabel = document.getElementById('bara-bubble-label');
    const panelEq = document.getElementById('panel-equalizer');

    if (playIcon && playLabel) {
      if (this.isPlaying) {
        playIcon.className = 'fa-solid fa-pause';
        playLabel.textContent = 'Jeda Musik';
      } else {
        playIcon.className = 'fa-solid fa-play';
        playLabel.textContent = 'Putar Musik';
      }
    }

    if (statusText) {
      statusText.textContent = this.isPlaying
        ? 'Sedang memutar: Gamelan Rindik Bambu Ubud — Suasana Damai Dewata 🎶'
        : 'Musik sedang dijeda. Klik putar untuk menikmati alunan rindik Bali.';
    }

    if (miniEq) {
      miniEq.classList.toggle('hidden', !this.isPlaying);
    }

    if (bubbleLabel) {
      bubbleLabel.textContent = this.isPlaying ? 'Musik Bali Aktif 🎶' : 'Musik Bali & Pemandu Bara';
    }

    if (panelEq) {
      const bars = panelEq.querySelectorAll('.sound-bar');
      bars.forEach((bar) => {
        bar.classList.toggle('sound-bar-playing', this.isPlaying);
      });
    }

    // 2. Tombol di navbar
    const navMusicBtn = document.getElementById('nav-music-btn');
    if (navMusicBtn) {
      const icon = navMusicBtn.querySelector('i');
      const text = navMusicBtn.querySelector('.nav-music-text');
      const eq = navMusicBtn.querySelector('.nav-equalizer');
      
      if (icon) {
        icon.className = this.isPlaying ? 'fa-solid fa-volume-high text-terakota' : 'fa-solid fa-music text-tanah/70';
      }
      if (text) {
        text.textContent = this.isPlaying ? 'Musik Aktif' : 'Musik Bali';
      }
      if (eq) {
        eq.querySelectorAll('.sound-bar').forEach((b) => b.classList.toggle('sound-bar-playing', this.isPlaying));
      }
    }

    // 3. Tombol di hero Beranda
    const heroMusicBtn = document.getElementById('hero-music-toggle-btn');
    if (heroMusicBtn) {
      const icon = heroMusicBtn.querySelector('.hero-music-icon');
      const label = heroMusicBtn.querySelector('.hero-music-label');
      if (icon) {
        icon.className = this.isPlaying ? 'fa-solid fa-pause text-terakota' : 'fa-solid fa-play text-daun';
      }
      if (label) {
        label.textContent = this.isPlaying ? 'Jeda Musik Gamelan' : 'Dengarkan Musik Tradisional Bali';
      }
    }
  }
}

// Global Singleton
export const balineseAudio = new BalineseAudioManager();

/**
 * Helper inisialisasi cepat di setiap halaman
 */
export function initBalineseAudio() {
  if (typeof window === 'undefined') return;
  balineseAudio.init();
}
