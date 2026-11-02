/**
 * Kamus Bahasa Bali — Frontend Controller
 * Gaya KBBI dengan pencarian debounce, filter tingkat bahasa, saran otomatis, dan modal detail
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import '../styles/main.css';
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
  page: 1,
  pageSize: 12
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

  // 6. Shortcut Ungkapan Wisatawan Cepat
  document.querySelectorAll('.phrase-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const term = chip.getAttribute('data-search') || '';
      if (searchInput) searchInput.value = term;
      state.query = term;
      btnClear?.classList.remove('hidden');
      performSearch();
      document.getElementById('dictionary-entries-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // 7. Kuis Kilat Basa Bali & Etika
  document.getElementById('btn-open-balinese-quiz')?.addEventListener('click', () => {
    openBalineseQuizModal();
  });

  // 8. Modal close on backdrop click & ESC
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
async function performSearch(resetPage = true) {
  const countText = document.getElementById('results-count-text');
  const container = document.getElementById('dictionary-entries-area');
  if (!container) return;

  if (resetPage) {
    state.page = 1;
  }

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

  const paginationEl = document.getElementById('dictionary-pagination');

  // 1. KONDISI KOSONG (KATA TIDAK DITEMUKAN)
  if (!entries || entries.length === 0) {
    if (paginationEl) {
      paginationEl.classList.add('hidden');
      paginationEl.innerHTML = '';
    }

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

  // Paginasi: hitung total halaman & slice
  const totalItems = entries.length;
  const totalPages = Math.ceil(totalItems / state.pageSize);
  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  const startIdx = (state.page - 1) * state.pageSize;
  const endIdx = Math.min(startIdx + state.pageSize, totalItems);
  const pagedEntries = entries.slice(startIdx, endIdx);

  // 2. RENDER ENTRI KARTU GAYA KBBI (HANYA HALAMAN AKTIF)
  container.innerHTML = pagedEntries.map(item => {
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

  // Render kontrol paginasi
  renderDictionaryPagination(totalItems, totalPages, startIdx, endIdx);
}

/**
 * Render Kontrol Navigasi Paginasi Kamus
 */
function renderDictionaryPagination(totalItems, totalPages, startIdx, endIdx) {
  const paginationEl = document.getElementById('dictionary-pagination');
  if (!paginationEl) return;

  if (totalPages <= 1) {
    paginationEl.classList.add('hidden');
    paginationEl.innerHTML = '';
    return;
  }

  paginationEl.classList.remove('hidden');

  // Generate tombol halaman
  let pageButtonsHTML = '';
  const maxButtons = 5;
  let startPage = Math.max(1, state.page - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    pageButtonsHTML += `
      <button class="kamus-page-btn w-9 h-9 rounded-xl border border-pasir text-xs font-semibold hover:border-daun hover:text-daun transition-colors cursor-pointer" data-page="1">1</button>
      ${startPage > 2 ? '<span class="px-1 text-tanah/50 text-xs">...</span>' : ''}
    `;
  }

  for (let p = startPage; p <= endPage; p++) {
    const isActive = p === state.page;
    pageButtonsHTML += `
      <button class="kamus-page-btn w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-daun text-white shadow-xs' : 'border border-pasir hover:border-daun hover:text-daun bg-white text-tanah'}" data-page="${p}">${p}</button>
    `;
  }

  if (endPage < totalPages) {
    pageButtonsHTML += `
      ${endPage < totalPages - 1 ? '<span class="px-1 text-tanah/50 text-xs">...</span>' : ''}
      <button class="kamus-page-btn w-9 h-9 rounded-xl border border-pasir text-xs font-semibold hover:border-daun hover:text-daun transition-colors cursor-pointer" data-page="${totalPages}">${totalPages}</button>
    `;
  }

  paginationEl.innerHTML = `
    <div class="text-xs text-tanah font-medium">
      Menampilkan <strong>${startIdx + 1} - ${endIdx}</strong> dari <strong>${totalItems}</strong> kosakata (Halaman ${state.page} / ${totalPages})
    </div>
    <div class="flex items-center gap-1.5">
      <button id="btn-kamus-prev" class="px-3.5 py-2 rounded-xl border border-pasir text-xs font-semibold text-tanah hover:border-daun hover:text-daun transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none" ${state.page <= 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-left text-[10px]"></i>
        <span>Sebelumnya</span>
      </button>
      <div class="flex items-center gap-1">
        ${pageButtonsHTML}
      </div>
      <button id="btn-kamus-next" class="px-3.5 py-2 rounded-xl border border-pasir text-xs font-semibold text-tanah hover:border-daun hover:text-daun transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none" ${state.page >= totalPages ? 'disabled' : ''}>
        <span>Berikutnya</span>
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </button>
    </div>
  `;

  // Listener tombol halaman
  paginationEl.querySelector('#btn-kamus-prev')?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      renderDictionaryResults(state.results);
      scrollToKamusTop();
    }
  });

  paginationEl.querySelector('#btn-kamus-next')?.addEventListener('click', () => {
    if (state.page < totalPages) {
      state.page++;
      renderDictionaryResults(state.results);
      scrollToKamusTop();
    }
  });

  paginationEl.querySelectorAll('.kamus-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p && p !== state.page) {
        state.page = p;
        renderDictionaryResults(state.results);
        scrollToKamusTop();
      }
    });
  });
}

function scrollToKamusTop() {
  const target = document.getElementById('dictionary-entries-area');
  if (target) {
    const yOffset = -90;
    const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
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

/**
 * Modal Kuis Kilat Basa Bali & Etika Kultural (3 Soal Interaktif)
 */
function openBalineseQuizModal() {
  let existing = document.getElementById('balinese-quiz-modal');
  if (existing) existing.remove();

  const quizData = [
    {
      question: 'Kata apa yang paling santun dan lazim diucapkan untuk berterima kasih kepada warga lokal di Bali?',
      options: [
        { text: 'Matur Suksma / Suksma', isCorrect: true, exp: 'Tepat! "Suksma" atau "Matur Suksma" (Alus Madya) adalah ungkapan terima kasih yang santun dan sangat dihargai warga Bali.' },
        { text: 'Matur Nuwun', isCorrect: false, exp: '"Matur Nuwun" adalah bahasa Jawa. Di Bali, ucapkan "Matur Suksma".' },
        { text: 'Ampura', isCorrect: false, exp: '"Ampura" berarti mohon maaf atau permisi.' },
        { text: 'Rahajeng', isCorrect: false, exp: '"Rahajeng" berarti selamat (seperti Rahajeng Semeng = Selamat Pagi).' }
      ]
    },
    {
      question: 'Tingkatan bahasa (Anggah-Ungguhing) apa yang paling aman dan sopan digunakan wisatawan kepada masyarakat Bali?',
      options: [
        { text: 'Alus Madya (Sopan Netral)', isCorrect: true, exp: 'Benar! Alus Madya adalah bahasa sopan yang paling aman digunakan wisatawan karena santun dan tidak terikat kasta.' },
        { text: 'Andap / Kasar (Akrab Sebaya)', isCorrect: false, exp: 'Andap hanya digunakan untuk teman sebaya yang sudah sangat akrab atau orang tua kepada anak muda.' },
        { text: 'Alus Singgih (Penghormatan Sakral)', isCorrect: false, exp: 'Alus Singgih dikhususkan bagi pemuka agama (Pedanda/Pamangku) atau orang yang sangat dihormati.' },
        { text: 'Basa Campuran Bebas', isCorrect: false, exp: 'Alus Madya tetap merupakan standar kesopanan terbaik dalam tata krama Bali.' }
      ]
    },
    {
      question: 'Saat mengunjungi pura sakral atau menghadiri upacara adat, perlengkapan busana apa yang wajib dikenakan?',
      options: [
        { text: 'Kain Kamen & Selendang / Senteng yang diikat rapi', isCorrect: true, exp: 'Tepat! Kamen menutup pinggang ke bawah, dan selendang/senteng diikat di pinggang sebagai simbol mengendalikan hawa nafsu sebelum memasuki mandala suci.' },
        { text: 'Celana Pendek & Topi Pantai', isCorrect: false, exp: 'Celana pendek tidak diperkenankan di area pura karena memperlihatkan bagian kaki yang tidak sopan menurut tradisi.' },
        { text: 'Pakaian renang dengan sarung transparan', isCorrect: false, exp: 'Sangat dilarang karena menodai kesucian kawasan suci pura.' },
        { text: 'Bebas tanpa aturan asalkan nyaman', isCorrect: false, exp: 'Setiap pura memiliki aturan sakral (*dresta*) yang wajib dihormati setiap pengunjung.' }
      ]
    }
  ];

  let currentIdx = 0;
  let score = 0;

  const modalEl = document.createElement('div');
  modalEl.id = 'balinese-quiz-modal';
  modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-tanah-gelap/60 backdrop-blur-xs animate-fade-in';

  function renderQuestion() {
    if (currentIdx >= quizData.length) {
      // Tampilan Selesai
      modalEl.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-pasir shadow-2xl text-center space-y-5 animate-scale-up">
          <div class="w-16 h-16 rounded-full bg-daun/10 text-daun flex items-center justify-center mx-auto text-3xl shadow-sm">
            🏆
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-daun block mb-1">Hasil Kuis Budaya</span>
            <h3 class="font-heading text-2xl font-bold text-tanah-gelap">
              ${score === 3 ? 'Sempurna! Penjelajah Sejati' : score >= 2 ? 'Hebat! Anda Siap Menjelajah' : 'Terus Belajar Budaya Bali'}
            </h3>
            <p class="text-xs sm:text-sm text-tanah/80 mt-2 leading-relaxed">
              Anda menjawab <strong>${score} dari 3</strong> pertanyaan dengan tepat. Pemahaman etika Anda akan membuat perjalanan di Bali lebih bermakna dan dihormati warga setempat.
            </p>
          </div>
          <div class="p-3 rounded-2xl bg-pasir/30 border border-pasir/60 text-xs text-tanah-gelap">
            <span class="font-semibold text-daun">Tips:</span> Anda dapat mendengarkan audio lafal asli di setiap kartu kosakata kamus di bawah!
          </div>
          <div class="flex gap-2 justify-center pt-2">
            <button type="button" id="btn-quiz-retry" class="btn-sekunder text-xs !py-2.5 !px-4">Ulangi Kuis</button>
            <button type="button" id="btn-quiz-close" class="btn-primer text-xs !py-2.5 !px-5">Tutup</button>
          </div>
        </div>
      `;

      modalEl.querySelector('#btn-quiz-retry')?.addEventListener('click', () => {
        currentIdx = 0;
        score = 0;
        renderQuestion();
      });
      modalEl.querySelector('#btn-quiz-close')?.addEventListener('click', () => {
        modalEl.remove();
        document.body.style.overflow = '';
      });
      return;
    }

    const q = quizData[currentIdx];
    modalEl.innerHTML = `
      <div class="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 border border-pasir shadow-2xl space-y-4 animate-scale-up">
        
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-pasir/50 pb-3">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-full bg-padi/20 text-amber-900 flex items-center justify-center text-xs font-bold">
              ${currentIdx + 1}
            </span>
            <span class="font-heading font-bold text-xs uppercase tracking-wider text-tanah">
              Pertanyaan ${currentIdx + 1} dari ${quizData.length}
            </span>
          </div>
          <button type="button" id="btn-close-quiz-x" class="text-tanah/50 hover:text-tanah text-lg p-1">✕</button>
        </div>

        <!-- Question -->
        <div>
          <h3 class="font-heading text-base sm:text-lg font-bold text-tanah-gelap leading-snug">
            ${q.question}
          </h3>
        </div>

        <!-- Options -->
        <div class="space-y-2 pt-1" id="quiz-options-container">
          ${q.options.map((opt, i) => `
            <button type="button" data-idx="${i}" class="quiz-opt-btn w-full text-left p-3 rounded-2xl bg-krem/40 hover:bg-daun/10 border border-pasir hover:border-daun/40 text-xs sm:text-sm text-tanah-gelap transition-all flex items-start gap-2.5 cursor-pointer">
              <span class="w-5 h-5 rounded-full bg-white border border-pasir text-[10px] font-bold text-tanah/70 flex items-center justify-center shrink-0 mt-0.5">
                ${['A', 'B', 'C', 'D'][i]}
              </span>
              <span class="flex-1">${opt.text}</span>
            </button>
          `).join('')}
        </div>

        <!-- Explanation area (hidden until answered) -->
        <div id="quiz-explanation" class="hidden p-3 rounded-2xl text-xs space-y-1"></div>

        <!-- Next button -->
        <div class="pt-2 flex justify-end">
          <button type="button" id="btn-quiz-next" class="hidden btn-primer text-xs !py-2 !px-4">
            ${currentIdx === quizData.length - 1 ? 'Lihat Hasil' : 'Lanjut →'}
          </button>
        </div>

      </div>
    `;

    modalEl.querySelector('#btn-close-quiz-x')?.addEventListener('click', () => {
      modalEl.remove();
      document.body.style.overflow = '';
    });

    const optButtons = modalEl.querySelectorAll('.quiz-opt-btn');
    const expBox = modalEl.querySelector('#quiz-explanation');
    const nextBtn = modalEl.querySelector('#btn-quiz-next');

    optButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Disable all buttons once selected
        optButtons.forEach(b => b.disabled = true);
        const selIdx = parseInt(btn.getAttribute('data-idx'), 10);
        const selOpt = q.options[selIdx];

        if (selOpt.isCorrect) {
          score++;
          btn.className = 'quiz-opt-btn w-full text-left p-3 rounded-2xl bg-emerald-50 border border-emerald-400 text-xs sm:text-sm text-emerald-950 flex items-start gap-2.5';
          expBox.className = 'p-3 rounded-2xl text-xs space-y-1 bg-emerald-50 text-emerald-900 border border-emerald-200 block animate-fade-in';
          expBox.innerHTML = `<strong>Jawaban Benar!</strong> ${selOpt.exp}`;
        } else {
          btn.className = 'quiz-opt-btn w-full text-left p-3 rounded-2xl bg-amber-50 border border-amber-400 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5';
          expBox.className = 'p-3 rounded-2xl text-xs space-y-1 bg-amber-50 text-amber-900 border border-amber-200 block animate-fade-in';
          expBox.innerHTML = `<strong>Kurang Tepat.</strong> ${selOpt.exp}`;
        }

        nextBtn.classList.remove('hidden');
      });
    });

    nextBtn.addEventListener('click', () => {
      currentIdx++;
      renderQuestion();
    });
  }

  document.body.appendChild(modalEl);
  document.body.style.overflow = 'hidden';
  renderQuestion();
}

// Jalankan inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', init);

