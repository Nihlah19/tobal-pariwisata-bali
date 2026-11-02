/**
 * Balinese Ambient Audio Player — Tour Penjelajah Bali
 * Menghadirkan alunan musik tradisional rindik bambu Ubud secara elegan,
 * bersih, dan ringan tanpa memblokir performa render halaman.
 */

class BalineseAudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.volume = parseFloat(localStorage.getItem('tobal_music_volume') || '0.5');
    this.listeners = new Set();
    this.initialized = false;
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
    this.audio.loop = true;
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

    this.audio.addEventListener('error', (e) => {
      console.warn('[BalineseAudio] Gagal memuat file audio:', e);
      this.isPlaying = false;
      this.notifyState();
    });

    this.audio.src = '/audio/balinese-rindik.mp3';
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
    callback({ isPlaying: this.isPlaying, volume: this.volume });
    return () => this.listeners.delete(callback);
  }

  notifyState() {
    const state = { isPlaying: this.isPlaying, volume: this.volume };
    this.listeners.forEach((fn) => fn(state));
    this.updateDomUI();
  }

  mountFloatingPlayer() {
    if (document.getElementById('tobal-ambient-player')) return;

    const container = document.createElement('div');
    container.id = 'tobal-ambient-player';
    container.className = 'fixed bottom-5 right-5 z-40 select-none';

    container.innerHTML = `
      <div class="flex items-center gap-2.5 p-1.5 pl-3.5 pr-2 rounded-full bg-white/95 backdrop-blur-md border border-pasir/80 shadow-md hover:shadow-lg transition-all text-xs font-body text-tanah-gelap">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full ${this.isPlaying ? 'bg-daun animate-pulse' : 'bg-pasir-gelap/60'}" id="audio-pill-dot"></span>
          <span class="font-semibold text-xs text-tanah-gelap hidden sm:inline flex items-center gap-1.5"><i class="fa-solid fa-music text-daun text-[11px]"></i> Rindik Bali</span>
        </div>

        <button id="floating-audio-toggle" class="w-7 h-7 rounded-full bg-daun hover:bg-daun/90 text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95" aria-label="Putar Suasana Musik Bali">
          <i id="floating-audio-icon" class="fa-solid fa-play text-[10px]"></i>
        </button>
      </div>
    `;

    document.body.appendChild(container);

    document.getElementById('floating-audio-toggle')?.addEventListener('click', () => {
      this.togglePlay();
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

    if (dot) {
      dot.className = `w-2 h-2 rounded-full ${this.isPlaying ? 'bg-daun animate-pulse' : 'bg-pasir-gelap/60'}`;
    }

    if (floatingIcon) {
      if (this.isPlaying) {
        floatingIcon.className = 'fa-solid fa-pause text-[10px]';
      } else {
        floatingIcon.className = 'fa-solid fa-play text-[10px]';
      }
    }

    // Perbarui label navbar jika ada
    document.querySelectorAll('.hero-music-label').forEach((el) => {
      el.textContent = this.isPlaying ? 'Hentikan Musik Rindik' : 'Dengarkan Alunan Rindik Bali';
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
