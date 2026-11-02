/**
 * Balinese Ambient Audio Player & Playlist Manager — Tour Penjelajah Bali
 * Menghadirkan alunan musik tradisional Bali secara berkesinambungan (auto-looping playlist):
 * 1. Rindik Ayun Ambing (Bambu Tradisional Ubud)
 * 2. Sekar Jepun Dewata (Harmoni Rindik & Kempyung)
 * 3. Suling Suara Alam (Seruling & Tirta Suci Meditatif)
 */

export const BALINESE_PLAYLIST = [
  {
    id: 'rindik-ayun-ambing',
    title: 'Rindik Ayun Ambing',
    tag: 'Bambu Ubud',
    desc: 'Alunan bambu rindik Ubud yang menyejukkan hati & gemercik tirta suci.',
    src: '/audio/balinese-rindik.mp3',
    icon: 'fa-solid fa-music',
  },
  {
    id: 'sekar-jepun',
    title: 'Sekar Jepun Dewata',
    tag: 'Rindik & Kempyung',
    desc: 'Kotekan bambu dinamis laras Pelog Selisir dengan aksen kempur perunggu.',
    src: '/audio/sekar-jepun-rindik.wav',
    icon: 'fa-solid fa-spa',
  },
  {
    id: 'suling-dewata',
    title: 'Suling Suara Alam',
    tag: 'Seruling & Hening',
    desc: 'Tiupan meditatif seruling bambu berpadu gemercik air suci & genta pura.',
    src: '/audio/suling-dewata.wav',
    icon: 'fa-solid fa-wind',
  },
];

class BalineseAudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.currentTrackIndex = parseInt(localStorage.getItem('tobal_music_track_idx') || '0', 10);
    if (isNaN(this.currentTrackIndex) || this.currentTrackIndex < 0 || this.currentTrackIndex >= BALINESE_PLAYLIST.length) {
      this.currentTrackIndex = 0;
    }
    this.volume = parseFloat(localStorage.getItem('tobal_music_volume') || '0.5');
    this.listeners = new Set();
    this.initialized = false;
    this.isMenuOpen = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Pasang UI audio kontrol minimalis ke DOM
    this.mountFloatingPlayer();
    this.bindGlobalTriggers();
  }

  ensureAudioLoaded() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.volume = this.volume;
    this.audio.preload = 'none';

    this.audio.addEventListener('play', () => {
      this.isPlaying = true;
      this.notifyState();
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.notifyState();
    });

    // AUTO-LOOP: Ketika satu lagu selesai, otomatis bergulir memutar lagu berikutnya tanpa henti
    this.audio.addEventListener('ended', () => {
      console.log('[BalineseAudio] Lagu selesai, beralih otomatis ke lagu berikutnya...');
      this.nextTrack(true);
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[BalineseAudio] Gagal memuat track saat ini, beralih ke track cadangan:', e);
      if (this.isPlaying) {
        setTimeout(() => this.nextTrack(true), 800);
      }
    });

    const currentTrack = BALINESE_PLAYLIST[this.currentTrackIndex];
    this.audio.src = currentTrack.src;
  }

  async togglePlay() {
    this.ensureAudioLoaded();

    try {
      if (this.isPlaying) {
        this.audio.pause();
      } else {
        await this.audio.play();
      }
    } catch (err) {
      console.warn('[BalineseAudio] Autoplay dicegah browser, butuh interaksi pengguna:', err);
    }
  }

  async playTrack(index, autoPlay = true) {
    this.currentTrackIndex = (index + BALINESE_PLAYLIST.length) % BALINESE_PLAYLIST.length;
    localStorage.setItem('tobal_music_track_idx', this.currentTrackIndex.toString());

    this.ensureAudioLoaded();
    const currentTrack = BALINESE_PLAYLIST[this.currentTrackIndex];
    this.audio.src = currentTrack.src;

    if (autoPlay) {
      try {
        await this.audio.play();
        this.isPlaying = true;
      } catch (err) {
        console.warn('[BalineseAudio] Pemutaran track tertahan:', err);
      }
    }
    this.notifyState();
  }

  nextTrack(autoPlay = true) {
    const nextIdx = (this.currentTrackIndex + 1) % BALINESE_PLAYLIST.length;
    this.playTrack(nextIdx, autoPlay);
  }

  prevTrack(autoPlay = true) {
    const prevIdx = (this.currentTrackIndex - 1 + BALINESE_PLAYLIST.length) % BALINESE_PLAYLIST.length;
    this.playTrack(prevIdx, autoPlay);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    localStorage.setItem('tobal_music_volume', this.volume.toString());
    this.notifyState();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTrack: BALINESE_PLAYLIST[this.currentTrackIndex],
      trackIndex: this.currentTrackIndex,
      totalTracks: BALINESE_PLAYLIST.length,
    });
    return () => this.listeners.delete(callback);
  }

  notifyState() {
    const state = {
      isPlaying: this.isPlaying,
      volume: this.volume,
      currentTrack: BALINESE_PLAYLIST[this.currentTrackIndex],
      trackIndex: this.currentTrackIndex,
      totalTracks: BALINESE_PLAYLIST.length,
    };
    this.listeners.forEach((fn) => fn(state));
    this.updateDomUI();
  }

  getCurrentTrack() {
    return BALINESE_PLAYLIST[this.currentTrackIndex] || BALINESE_PLAYLIST[0];
  }

  mountFloatingPlayer() {
    if (document.getElementById('tobal-ambient-player')) return;

    const container = document.createElement('div');
    container.id = 'tobal-ambient-player';
    container.className = 'fixed bottom-7 right-3.5 sm:bottom-9 sm:right-6 z-40 select-none';

    const currentTrack = this.getCurrentTrack();

    container.innerHTML = `
      <!-- Playlist Popover Menu -->
      <div id="audio-playlist-menu" class="hidden absolute bottom-full right-0 mb-2 w-72 sm:w-80 bg-white/95 backdrop-blur-xl border border-pasir/80 rounded-2xl shadow-xl p-3 text-tanah-gelap transition-all animate-fade-in font-body">
        <div class="flex items-center justify-between pb-2 border-b border-pasir/60 mb-2">
          <div class="flex items-center gap-1.5">
            <i class="fa-solid fa-compact-disc text-daun text-xs"></i>
            <span class="font-heading font-bold text-xs tracking-tight text-tanah-gelap">Daftar Putar Musik Tradisi Bali</span>
          </div>
          <span class="text-[10px] bg-daun/10 text-daun px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <i class="fa-solid fa-rotate text-[8px] animate-spin-slow"></i> Auto-Loop
          </span>
        </div>

        <div class="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
          ${BALINESE_PLAYLIST.map((t, i) => `
            <button type="button" data-track-index="${i}" class="btn-select-audio-track w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer border ${i === this.currentTrackIndex ? 'bg-daun/10 border-daun/40 text-daun' : 'hover:bg-pasir/30 border-transparent text-tanah-gelap'}">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-6 h-6 rounded-lg ${i === this.currentTrackIndex ? 'bg-daun text-white' : 'bg-pasir/40 text-tanah/70'} flex items-center justify-center shrink-0 text-[10px]">
                  <i class="${t.icon}"></i>
                </div>
                <div class="truncate">
                  <div class="text-xs font-bold truncate leading-tight">${t.title}</div>
                  <div class="text-[10px] text-tanah/60 truncate">${t.tag}</div>
                </div>
              </div>
              <span class="text-[10px] font-semibold shrink-0 ml-2 ${i === this.currentTrackIndex ? 'text-daun font-bold' : 'text-tanah/40'}">
                ${i === this.currentTrackIndex ? '<i class="fa-solid fa-volume-high text-[10px] animate-pulse"></i>' : `#${i + 1}`}
              </span>
            </button>
          `).join('')}
        </div>

        <div class="pt-2 mt-2 border-t border-pasir/50 flex items-center justify-between text-[10px] text-tanah/70">
          <span>Otomatis memutar lagu berikutnya</span>
          <button type="button" id="btn-close-playlist-menu" class="hover:text-tanah-gelap font-semibold px-2 py-0.5 rounded cursor-pointer">Tutup</button>
        </div>
      </div>

      <!-- Floating Pill Bar -->
      <div class="flex items-center gap-1.5 sm:gap-2 p-1.5 pl-3 sm:pl-3.5 pr-1.5 rounded-full bg-white/95 backdrop-blur-md border border-pasir/80 shadow-md hover:shadow-lg transition-all text-xs font-body text-tanah-gelap">
        
        <!-- Track Info & Indicator (Clickable to open playlist) -->
        <button type="button" id="floating-audio-menu-toggle" class="flex items-center gap-2 text-left cursor-pointer group" title="Buka Daftar Putar Musik Bali (Auto-Loop)">
          <span class="w-2 h-2 rounded-full ${this.isPlaying ? 'bg-daun animate-pulse ring-2 ring-daun/30' : 'bg-pasir-gelap/60'}" id="audio-pill-dot"></span>
          <div class="flex items-center gap-1.5 max-w-[120px] sm:max-w-[155px]">
            <span id="floating-audio-title" class="font-semibold text-xs text-tanah-gelap group-hover:text-daun transition truncate">
              ${currentTrack.title}
            </span>
            <span id="floating-audio-badge" class="bg-pasir/60 group-hover:bg-daun/10 group-hover:text-daun text-tanah/70 text-[9px] font-bold px-1.5 py-0.2 rounded-full shrink-0 transition">
              ${this.currentTrackIndex + 1}/${BALINESE_PLAYLIST.length}
            </span>
          </div>
        </button>

        <div class="h-3.5 w-px bg-pasir-gelap/30 mx-0.5"></div>

        <!-- Tombol Lagu Berikutnya (Next Track) -->
        <button type="button" id="floating-audio-next" class="w-7 h-7 rounded-full bg-pasir/40 hover:bg-pasir/80 text-tanah-gelap flex items-center justify-center transition cursor-pointer active:scale-95" title="Lagu Berikutnya">
          <i class="fa-solid fa-forward-step text-[10px]"></i>
        </button>

        <!-- Tombol Putar / Jeda -->
        <button type="button" id="floating-audio-toggle" class="w-7 h-7 rounded-full bg-daun hover:bg-daun/90 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95" aria-label="Putar Suasana Musik Bali">
          <i id="floating-audio-icon" class="fa-solid fa-play text-[10px]"></i>
        </button>
      </div>
    `;

    document.body.appendChild(container);

    // Event Listeners
    document.getElementById('floating-audio-toggle')?.addEventListener('click', () => {
      this.togglePlay();
    });

    document.getElementById('floating-audio-next')?.addEventListener('click', () => {
      this.nextTrack(true);
    });

    const menuEl = document.getElementById('audio-playlist-menu');
    const menuToggle = document.getElementById('floating-audio-menu-toggle');
    const closeMenuBtn = document.getElementById('btn-close-playlist-menu');

    menuToggle?.addEventListener('click', (e) => {
      e.stopPropagation();
      menuEl?.classList.toggle('hidden');
    });

    closeMenuBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      menuEl?.classList.add('hidden');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (menuEl && !menuEl.classList.contains('hidden') && !container.contains(e.target)) {
        menuEl.classList.add('hidden');
      }
    });

    // Track item selection
    container.querySelectorAll('.btn-select-audio-track').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.getAttribute('data-track-index') || '0', 10);
        this.playTrack(idx, true);
        menuEl?.classList.add('hidden');
      });
    });
  }

  bindGlobalTriggers() {
    // Sinkronkan seluruh tombol berkelas .btn-toggle-bali-music
    document.querySelectorAll('.btn-toggle-bali-music').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePlay();
      });
    });
  }

  updateDomUI() {
    const dot = document.getElementById('audio-pill-dot');
    const floatingIcon = document.getElementById('floating-audio-icon');
    const titleEl = document.getElementById('floating-audio-title');
    const badgeEl = document.getElementById('floating-audio-badge');
    const currentTrack = this.getCurrentTrack();

    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${this.isPlaying ? 'bg-daun animate-pulse ring-2 ring-daun/30' : 'bg-pasir-gelap/60'}`;
    }

    if (floatingIcon) {
      floatingIcon.className = this.isPlaying ? 'fa-solid fa-pause text-[10px]' : 'fa-solid fa-play text-[10px]';
    }

    if (titleEl) {
      titleEl.textContent = currentTrack.title;
    }

    if (badgeEl) {
      badgeEl.textContent = `${this.currentTrackIndex + 1}/${BALINESE_PLAYLIST.length}`;
    }

    // Perbarui highlight di playlist popover
    document.querySelectorAll('#audio-playlist-menu .btn-select-audio-track').forEach((btn, idx) => {
      if (idx === this.currentTrackIndex) {
        btn.className = 'btn-select-audio-track w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer border bg-daun/10 border-daun/40 text-daun';
      } else {
        btn.className = 'btn-select-audio-track w-full text-left p-2 rounded-xl transition flex items-center justify-between cursor-pointer border hover:bg-pasir/30 border-transparent text-tanah-gelap';
      }
    });

    // Perbarui label tombol di landing page jika ada
    document.querySelectorAll('.hero-music-label').forEach((el) => {
      el.textContent = this.isPlaying ? `Jeda Musik (${currentTrack.title})` : 'Dengarkan Alunan Musik Bali';
    });
  }
}

let audioManagerInstance = null;

export function initBalineseAudio() {
  if (!audioManagerInstance) {
    audioManagerInstance = new BalineseAudioManager();
    audioManagerInstance.init();
  }
  return audioManagerInstance;
}
