/**
 * Kamus Bahasa Bali — Frontend Controller
 * Gaya KBBI dengan pencarian debounce, filter tingkat bahasa, saran otomatis, dan modal detail
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import {
  createElement,
  Search,
  X,
  BookOpen,
  Sparkles,
  Volume2,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Info
} from 'lucide';

import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/ui.js';
import {
  searchDictionary,
  getWordDetail,
  KELAS_KATA_MAP,
  TINGKAT_STYLE_MAP,
  FALLBACK_DICTIONARY
} from '../lib/dictionary.js';
import { getGrammarRules } from '../lib/grammar.js';

// State global halaman kamus
const state = {
  query: '',
  tingkat: 'semua',
  kelasKata: 'semua',
  results: [],
  isLoading: false,
  debounceTimer: null,
};

/**
 * Inisialisasi halaman Kamus
 */
async function init() {
  renderNavbar('#navbar');
  renderFooter('#footer');

  // Render icon static header
  renderStaticIcons();

  // Handle URL query parameter (?q=... atau ?kata=... atau ?id=...)
  const params = new URLSearchParams(window.location.search);
  const initialQ = params.get('q') || params.get('kata') || '';
  const initialId = params.get('id');
  const initialTingkat = params.get('tingkat');

  if (initialTingkat && TINGKAT_STYLE_MAP[initialTingkat]) {
    state.tingkat = initialTingkat;
    updateTingkatButtonUI(initialTingkat);
  }

  if (initialQ) {
    const input = document.getElementById('search-input');
    if (input) {
      input.value = initialQ;
      state.query = initialQ;
      document.getElementById('btn-clear-search')?.classList.remove('hidden');
    }
  }

  // Setup event listeners
  setupEventListeners();

  // Load data awal
  await performSearch();
  await renderGrammarSection();

  // Jika ada ID atau kata spesifik di URL, buka modal detailnya
  if (initialId || (initialQ && state.results.length === 1)) {
    const target = initialId
      ? await getWordDetail(initialId)
      : state.results[0];
    if (target) {
      openWordModal(target);
    }
  }
}

/**
 * Render ikon statis di header
 */
function renderStaticIcons() {
  const iconMap = {
    'header-icon-book': BookOpen,
    'guide-icon-sparkle': Sparkles,
    'search-icon-wrapper': Search,
    'btn-clear-search': X,
  };

  Object.entries(iconMap).forEach(([id, iconData]) => {
    const target = document.getElementById(id);
    if (target) {
      const svg = createElement(iconData);
      svg.setAttribute('width', '18');
      svg.setAttribute('height', '18');
      target.appendChild(svg);
    }
  });
}

/**
 * Setup seluruh event listeners
 */
function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  const btnClear = document.getElementById('btn-clear-search');
  const selectKelas = document.getElementById('select-kelas-kata');
  const btnReset = document.getElementById('btn-reset-filter');
  const btnToggleGuide = document.getElementById('btn-toggle-guide');
  const suggestionsDropdown = document.getElementById('suggestions-dropdown');

  // 1. Input pencarian dengan Debounce
  searchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    state.query = val;

    if (val.trim()) {
      btnClear?.classList.remove('hidden');
    } else {
      btnClear?.classList.add('hidden');
      hideSuggestions();
    }

    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(async () => {
      await performSearch();
      updateSuggestions(val);
    }, 280);
  });

  // Tombol bersihkan pencarian
  btnClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.query = '';
    btnClear.classList.add('hidden');
    hideSuggestions();
    performSearch();
    searchInput?.focus();
  });

  // Tutup suggestions saat klik di luar
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-input') && !e.target.closest('#suggestions-dropdown')) {
      hideSuggestions();
    }
  });

  // 2. Filter Tingkat Bahasa
  const tingkatContainer = document.getElementById('tingkat-filter-buttons');
  tingkatContainer?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-tingkat]');
    if (!btn) return;

    const tingkatVal = btn.getAttribute('data-tingkat');
    state.tingkat = tingkatVal;
    updateTingkatButtonUI(tingkatVal);
    performSearch();
  });

  // 3. Filter Kelas Kata
  selectKelas?.addEventListener('change', (e) => {
    state.kelasKata = e.target.value;
    performSearch();
  });

  // 4. Tombol Reset Filter
  btnReset?.addEventListener('click', () => {
    state.query = '';
    state.tingkat = 'semua';
    state.kelasKata = 'semua';

    if (searchInput) searchInput.value = '';
    btnClear?.classList.add('hidden');
    if (selectKelas) selectKelas.value = 'semua';
    updateTingkatButtonUI('semua');
    hideSuggestions();
    performSearch();
    showToast('Filter telah direset.', 'info');
  });

  // 5. Toggle panduan tingkatan bahasa
  btnToggleGuide?.addEventListener('click', () => {
    const guideContent = document.getElementById('guide-content');
    const guideLabel = document.getElementById('guide-toggle-label');
    if (!guideContent) return;

    const isHidden = guideContent.classList.contains('hidden');
    guideContent.classList.toggle('hidden');
    if (guideLabel) {
      guideLabel.textContent = isHidden ? 'Tutup Panduan' : 'Buka Panduan';
    }
  });

  // 6. Modal close on backdrop click & ESC
  const modal = document.getElementById('word-detail-modal');
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeWordModal();
    }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeWordModal();
  });
}

/**
 * Update UI tombol filter tingkatan bahasa aktif
 */
function updateTingkatButtonUI(selectedTingkat) {
  const buttons = document.querySelectorAll('#tingkat-filter-buttons button');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-tingkat') === selectedTingkat) {
      btn.className = 'filter-btn filter-btn-active';
    } else {
      btn.className = 'filter-btn';
    }
  });
}

/**
 * Melakukan pencarian data kamus
 */
async function performSearch() {
  const countText = document.getElementById('results-count-text');
  const container = document.getElementById('dictionary-entries-area');
  if (!container) return;

  state.isLoading = true;
  if (countText) countText.textContent = 'Mencari kosakata...';

  // Render skeleton loading
  container.innerHTML = Array(4).fill(0).map(() => `
    <div class="card-natural p-5 sm:p-6 space-y-4 animate-pulse">
      <div class="flex items-center justify-between">
        <div class="h-6 w-32 bg-pasir/60 rounded"></div>
        <div class="h-5 w-20 bg-pasir/50 rounded-full"></div>
      </div>
      <div class="h-4 w-48 bg-pasir/40 rounded"></div>
      <div class="h-16 bg-pasir/30 rounded-xl"></div>
    </div>
  `).join('');

  try {
    const results = await searchDictionary({
      query: state.query,
      tingkat: state.tingkat,
      kelasKata: state.kelasKata
    });

    state.results = results;
    renderDictionaryResults(results);

    if (countText) {
      countText.textContent = `Ditemukan ${results.length} kosakata`;
    }
  } catch (err) {
    console.error('[Kamus Search Error]:', err);
    renderDictionaryResults([]);
    if (countText) countText.textContent = 'Gagal memuat kamus';
  } finally {
    state.isLoading = false;
  }
}

/**
 * Autocomplete suggestions dropdown
 */
function updateSuggestions(inputVal) {
  const clean = inputVal.trim().toLowerCase();
  const dropdown = document.getElementById('suggestions-dropdown');
  if (!dropdown) return;

  if (clean.length < 2) {
    hideSuggestions();
    return;
  }

  // Filter 5 kata teratas
  const matched = FALLBACK_DICTIONARY.filter(item =>
    item.kata.toLowerCase().includes(clean) ||
    item.arti_indonesia.toLowerCase().includes(clean)
  ).slice(0, 5);

  if (matched.length === 0) {
    hideSuggestions();
    return;
  }

  dropdown.innerHTML = matched.map(w => {
    const tingkatInfo = TINGKAT_STYLE_MAP[w.tingkat] || TINGKAT_STYLE_MAP['umum'];
    return `
      <div
        class="suggestion-item px-4 py-2.5 hover:bg-krem/70 cursor-pointer flex items-center justify-between transition-colors text-sm"
        data-kata="${w.kata}"
      >
        <div class="flex items-center gap-2">
          <strong class="font-heading text-tanah-gelap">${w.kata}</strong>
          <span class="text-xs text-tanah truncate max-w-[200px] sm:max-w-[300px]">· ${w.arti_indonesia}</span>
        </div>
        <span class="text-[11px] px-2 py-0.5 rounded-full ${tingkatInfo.badgeClass} whitespace-nowrap">
          ${tingkatInfo.short}
        </span>
      </div>
    `;
  }).join('');

  dropdown.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const kata = item.getAttribute('data-kata');
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = kata;
      state.query = kata;
      hideSuggestions();
      performSearch();
    });
  });

  dropdown.classList.remove('hidden');
}

function hideSuggestions() {
  const dropdown = document.getElementById('suggestions-dropdown');
  if (dropdown) dropdown.classList.add('hidden');
}

/**
 * Render hasil daftar entri kamus (Gaya KBBI)
 */
function renderDictionaryResults(entries) {
  const container = document.getElementById('dictionary-entries-area');
  if (!container) return;

  // 1. KONDISI KOSONG (KATA TIDAK DITEMUKAN)
  if (!entries || entries.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 px-6 text-center card-natural border-dashed border-2 border-pasir max-w-xl mx-auto space-y-5">
        <div class="w-16 h-16 mx-auto rounded-full bg-pasir/40 flex items-center justify-center text-tanah">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </div>
        <div class="space-y-1">
          <h3 class="font-heading text-xl font-bold text-tanah-gelap">
            Kosakata Belum Ditemukan
          </h3>
          <p class="font-body text-sm text-tanah max-w-md mx-auto">
            Kata <em class="font-semibold text-daun">"${state.query || 'yang Anda cari'}"</em> belum ada di kamus kami atau tidak cocok dengan filter yang dipilih.
          </p>
        </div>

        <!-- Saran kata populer untuk wisatawan -->
        <div class="pt-3 border-t border-pasir/60">
          <p class="text-xs text-tanah/70 font-semibold mb-2 uppercase tracking-wider">
            Coba cari kosakata populer berikut:
          </p>
          <div class="flex flex-wrap justify-center gap-2">
            ${['Om Swastyastu', 'Matur suksma', 'Ampura', 'Toya', 'Pura', 'Kaja'].map(k => `
              <button class="quick-suggest-btn text-xs bg-white hover:bg-daun/10 text-tanah-gelap hover:text-daun px-3 py-1.5 rounded-full border border-pasir transition-all" data-kata="${k}">
                ${k}
              </button>
            `).join('')}
          </div>
        </div>

        <button id="btn-empty-reset" class="btn-sekunder text-sm !py-2 !px-4 mt-2">
          Reset Filter & Cari Ulang
        </button>
      </div>
    `;

    // Event listener saran cepat
    container.querySelectorAll('.quick-suggest-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const kata = btn.getAttribute('data-kata');
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.value = kata;
        state.query = kata;
        performSearch();
      });
    });

    document.getElementById('btn-empty-reset')?.addEventListener('click', () => {
      document.getElementById('btn-reset-filter')?.click();
    });

    return;
  }

  // 2. RENDER ENTRI KARTU GAYA KBBI
  container.innerHTML = entries.map(item => {
    const tingkatInfo = TINGKAT_STYLE_MAP[item.tingkat] || TINGKAT_STYLE_MAP['umum'];
    const kelasLabel = KELAS_KATA_MAP[item.kelas_kata] || item.kelas_kata;

    return `
      <article
        class="dictionary-entry-card bg-white rounded-3xl p-5 sm:p-6 border border-pasir hover:border-daun/40 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
        data-id="${item.id}"
      >
        <div class="space-y-3.5">
          
          <!-- Baris Atas: Kata, Kelas Kata & Tingkat Bahasa -->
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-baseline gap-2 flex-wrap">
                <h2 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap group-hover:text-daun transition-colors">
                  ${item.kata}
                </h2>
                <span class="font-mono text-xs text-tanah/70 bg-krem px-2 py-0.5 rounded-md border border-pasir" title="${kelasLabel}">
                  ${item.kelas_kata}
                </span>
              </div>
              <p class="text-[11px] text-tanah/60 italic">${kelasLabel}</p>
            </div>

            <!-- Badge Tingkat Bahasa -->
            <span
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tingkatInfo.badgeClass} whitespace-nowrap"
              title="${tingkatInfo.deskripsi}"
            >
              <span class="w-2 h-2 rounded-full ${tingkatInfo.dotClass}"></span>
              ${tingkatInfo.label}
            </span>
          </div>

          <!-- Arti Indonesia & Inggris -->
          <div class="space-y-1">
            <p class="font-body text-base text-tanah-gelap font-medium leading-snug">
              ${item.arti_indonesia}
            </p>
            ${item.arti_inggris ? `
              <p class="font-body text-xs text-tanah/70 italic">
                En: ${item.arti_inggris}
              </p>
            ` : ''}
          </div>

          <!-- Contoh Kalimat & Terjemahan -->
          ${item.contoh_bali ? `
            <div class="p-3.5 rounded-2xl bg-krem/60 border border-pasir/60 space-y-1 text-xs sm:text-sm">
              <p class="font-body italic text-tanah-gelap font-medium">
                "${item.contoh_bali}"
              </p>
              ${item.contoh_terjemahan ? `
                <p class="text-tanah text-xs">
                  Artinya: ${item.contoh_terjemahan}
                </p>
              ` : ''}
            </div>
          ` : ''}

          <!-- Padanan Tingkatan Lain -->
          ${Array.isArray(item.padanan_tingkat) && item.padanan_tingkat.length > 0 ? `
            <div class="flex items-center gap-1.5 flex-wrap text-xs pt-1">
              <span class="text-tanah/60 font-semibold">Padanan:</span>
              ${item.padanan_tingkat.map(p => `
                <span class="px-2 py-0.5 bg-pasir/40 rounded-lg text-tanah font-medium cursor-pointer hover:bg-daun/20 hover:text-daun transition-colors" data-padanan="${p}">
                  ${p}
                </span>
              `).join('')}
            </div>
          ` : ''}

          <!-- Catatan Budaya Singkat -->
          ${item.catatan ? `
            <p class="text-xs text-tanah/80 leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/50 flex items-start gap-2">
              <i class="fa-solid fa-lightbulb text-amber-600 mt-0.5 shrink-0"></i>
              <span><span class="font-medium text-amber-950">Etika:</span> ${item.catatan}</span>
            </p>
          ` : ''}

        </div>

        <!-- Tombol Aksi Bawah -->
        <div class="pt-4 mt-4 border-t border-pasir/40 flex items-center justify-between text-xs text-tanah">
          <div class="flex items-center gap-2">
            <!-- Tombol Suara / Lafal -->
            <button
              class="btn-audio-speak p-2 rounded-xl hover:bg-pasir/50 text-tanah hover:text-daun transition-colors flex items-center gap-1"
              title="Dengarkan pelafalan kata"
              data-kata="${item.kata}"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
              <span class="hidden sm:inline">Lafal</span>
            </button>

            <!-- Tombol Salin -->
            <button
              class="btn-copy-word p-2 rounded-xl hover:bg-pasir/50 text-tanah hover:text-daun transition-colors flex items-center gap-1"
              title="Salin kata ke clipboard"
              data-kata="${item.kata}"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
              </svg>
              <span class="hidden sm:inline">Salin</span>
            </button>
          </div>

          <!-- Tombol Detail -->
          <button
            class="btn-view-detail text-daun hover:text-daun-gelap font-semibold flex items-center gap-1 p-2 rounded-xl hover:bg-daun/10 transition-colors"
            data-id="${item.id}"
          >
            <span>Detail Lengkap</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>

      </article>
    `;
  }).join('');

  // Pasang event listener tombol di tiap kartu
  container.querySelectorAll('.btn-view-detail').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const item = entries.find(x => x.id === id);
      if (item) openWordModal(item);
    });
  });

  container.querySelectorAll('.btn-copy-word').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const kata = btn.getAttribute('data-kata');
      if (kata) {
        navigator.clipboard.writeText(kata);
        showToast(`Kata "${kata}" berhasil disalin!`, 'sukses');
      }
    });
  });

  container.querySelectorAll('.btn-audio-speak').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const kata = btn.getAttribute('data-kata');
      speakWord(kata);
    });
  });

  // Klik padanan untuk mencari kata tersebut
  container.querySelectorAll('[data-padanan]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const padananText = el.getAttribute('data-padanan');
      // Ekstrak kata setelah titik dua, misal "Andap: Nasi" -> "Nasi"
      const targetKata = padananText.includes(':') ? padananText.split(':')[1].trim() : padananText;
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = targetKata;
      state.query = targetKata;
      performSearch();
    });
  });
}

/**
 * Text-to-Speech sederhana via browser Web Speech API
 */
function speakWord(word) {
  if (!('speechSynthesis' in window)) {
    showToast(`Pelafalan audio: "${word}"`, 'info');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'id-ID'; // Fallback lafal Indonesia / Bali
  utterance.rate = 0.85; // Sedikit lebih lambat agar jelas
  window.speechSynthesis.speak(utterance);
  showToast(`Melafalkan: "${word}"`, 'info');
}

/**
 * Membuka Modal Detail Kata yang Komprehensif
 */
function openWordModal(word) {
  const modal = document.getElementById('word-detail-modal');
  const container = document.getElementById('modal-content-container');
  if (!modal || !container) return;

  const tingkatInfo = TINGKAT_STYLE_MAP[word.tingkat] || TINGKAT_STYLE_MAP['umum'];
  const kelasLabel = KELAS_KATA_MAP[word.kelas_kata] || word.kelas_kata;

  container.innerHTML = `
    <!-- Modal Header -->
    <div class="flex items-start justify-between gap-4 border-b border-pasir pb-4">
      <div>
        <div class="flex items-center gap-3 flex-wrap">
          <h2 class="font-heading text-3xl sm:text-4xl font-bold text-tanah-gelap">
            ${word.kata}
          </h2>
          <span class="px-3 py-1 rounded-full text-xs font-semibold border ${tingkatInfo.badgeClass}">
            ${tingkatInfo.label}
          </span>
        </div>
        <p class="font-mono text-xs text-tanah mt-1">${kelasLabel}</p>
      </div>
      <button id="btn-close-modal" class="p-2 text-tanah/60 hover:text-tanah rounded-xl hover:bg-pasir/40 transition-colors" aria-label="Tutup modal">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Modal Body -->
    <div class="space-y-5 text-sm">
      
      <!-- Arti Lengkap -->
      <div class="p-4 rounded-2xl bg-krem/60 border border-pasir/80 space-y-2">
        <span class="text-xs font-semibold uppercase tracking-wider text-tanah/70 block">
          Makna & Definisi
        </span>
        <p class="font-body text-base font-semibold text-tanah-gelap leading-relaxed">
          ${word.arti_indonesia}
        </p>
        ${word.arti_inggris ? `
          <p class="text-xs text-tanah/80 italic">
            English Translation: ${word.arti_inggris}
          </p>
        ` : ''}
      </div>

      <!-- Contoh Kalimat -->
      ${word.contoh_bali ? `
        <div class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-tanah/70 block">
            Contoh Penggunaan dalam Kalimat
          </span>
          <div class="p-4 rounded-2xl bg-white border border-pasir shadow-sm space-y-1.5">
            <p class="font-body text-base italic font-semibold text-daun-gelap">
              "${word.contoh_bali}"
            </p>
            ${word.contoh_terjemahan ? `
              <p class="text-tanah text-xs sm:text-sm">
                Terjemahan: ${word.contoh_terjemahan}
              </p>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Penjelasan Tingkat Bahasa -->
      <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1 text-xs text-emerald-950">
        <strong class="block font-heading font-semibold text-sm text-emerald-900">
          Tentang Tingkatan: ${tingkatInfo.label}
        </strong>
        <p class="leading-relaxed">
          ${tingkatInfo.deskripsi}
        </p>
      </div>

      <!-- Padanan Kata -->
      ${Array.isArray(word.padanan_tingkat) && word.padanan_tingkat.length > 0 ? `
        <div class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-wider text-tanah/70 block">
            Padanan dalam Tingkatan Bahasa Lain
          </span>
          <div class="flex flex-wrap gap-2">
            ${word.padanan_tingkat.map(p => `
              <span class="px-3 py-1 bg-pasir/40 rounded-xl text-tanah font-medium text-xs">
                ${p}
              </span>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Catatan Etika & Budaya -->
      ${word.catatan ? `
        <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-950">
          <strong class="font-heading font-semibold text-amber-900 text-sm flex items-center gap-2">
            <i class="fa-solid fa-lightbulb text-amber-600"></i>
            <span>Catatan Etika & Konteks Budaya</span>
          </strong>
          <p class="leading-relaxed">
            ${word.catatan}
          </p>
        </div>
      ` : ''}

      <!-- Sumber Acuan -->
      <div class="text-[11px] text-tanah/60 pt-2 border-t border-pasir/40 flex items-center justify-between">
        <span>Sumber Acuan: <em>${word.sumber || '[PERLU DIVERIFIKASI]'}</em></span>
        <span class="text-padi font-medium">[Status: Perlu Verifikasi Penutur Asli]</span>
      </div>

    </div>

    <!-- Modal Footer Actions -->
    <div class="flex items-center justify-between pt-4 border-t border-pasir">
      <button
        id="modal-speak-btn"
        class="btn-sekunder text-xs !py-2 !px-4 flex items-center gap-1.5"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        Dengarkan Lafal
      </button>

      <div class="flex items-center gap-2">
        <button
          id="modal-copy-btn"
          class="btn-sekunder text-xs !py-2 !px-4 flex items-center gap-1.5"
        >
          Salin Kata
        </button>
        <button
          id="modal-done-btn"
          class="btn-primer text-xs !py-2 !px-5"
        >
          Tutup
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-close-modal')?.addEventListener('click', closeWordModal);
  document.getElementById('modal-done-btn')?.addEventListener('click', closeWordModal);

  document.getElementById('modal-copy-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(word.kata);
    showToast(`Kata "${word.kata}" berhasil disalin!`, 'sukses');
  });

  document.getElementById('modal-speak-btn')?.addEventListener('click', () => {
    speakWord(word.kata);
  });

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

async function renderGrammarSection() {
  const container = document.getElementById('grammar-entries-area');
  if (!container) return;

  try {
    const rules = await getGrammarRules();
    if (!rules || rules.length === 0) {
      container.innerHTML = '<p class="text-xs text-tanah/50 italic py-4">Materi tata bahasa sedang dipersiapkan...</p>';
      return;
    }

    container.innerHTML = rules.map(rule => `
      <div class="card-organik p-5 bg-white border border-pasir/80 space-y-3 shadow-xs">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pasir/40 pb-2.5">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-lg bg-daun/10 text-daun flex items-center justify-center font-bold text-xs">
              ${rule.urutan || 1}
            </span>
            <h3 class="font-heading font-bold text-base text-tanah-gelap">${rule.judul}</h3>
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-daun bg-daun/10 px-2.5 py-0.5 rounded-full border border-daun/20 self-start sm:self-auto">
            ${rule.kategori}
          </span>
        </div>
        <p class="text-xs text-tanah leading-relaxed">${rule.ringkasan}</p>
        ${rule.pola_rumus ? `
          <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50 font-mono text-xs text-amber-900 flex items-center gap-2">
            <i class="fa-solid fa-cube text-amber-600 text-xs"></i>
            <span><strong>Pola Rumus:</strong> ${rule.pola_rumus}</span>
          </div>
        ` : ''}
        ${Array.isArray(rule.contoh_kalimat) && rule.contoh_kalimat.length > 0 ? `
          <div class="space-y-1.5 pt-1">
            <span class="text-[11px] font-bold uppercase tracking-wider text-tanah/70 block">Contoh Penggunaan:</span>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              ${rule.contoh_kalimat.map(c => `
                <div class="p-2.5 rounded-xl bg-krem/40 border border-pasir/60">
                  <p class="font-bold text-tanah-gelap">"${c.bali}"</p>
                  <p class="text-tanah/70 text-[11px] mt-0.5">${c.indonesia}</p>
                  ${c.catatan ? `<p class="text-[10px] text-terakota mt-0.5 italic">Catatan: ${c.catatan}</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');
  } catch (err) {
    console.warn('[Grammar Error]:', err.message);
  }
}

function closeWordModal() {
  const modal = document.getElementById('word-detail-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

// Jalankan inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', init);
