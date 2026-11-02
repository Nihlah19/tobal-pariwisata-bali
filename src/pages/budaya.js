/**
 * Ensiklopedia Budaya Bali — Frontend Controller
 * Gaya kartu majalah, sanitasi Markdown aman, daftar sumber transparan, dan tempat terkait
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import {
  createElement,
  Landmark,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  Share2,
  Compass
} from 'lucide';

import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/ui.js';
import {
  getCultureArticles,
  getCultureArticleBySlug,
  getRelatedPlacesForArticle,
  renderSanitizedMarkdown,
  CULTURE_CATEGORY_MAP,
  FALLBACK_CULTURE_ARTICLES
} from '../lib/culture.js';

// State global halaman budaya
const state = {
  query: '',
  kategori: 'semua',
  currentSlug: null,
  articles: [],
  isLoading: false,
  debounceTimer: null,
};

/**
 * Inisialisasi halaman Budaya
 */
async function init() {
  renderNavbar('#navbar');
  renderFooter('#footer');

  renderStaticIcons();

  // Cek parameter URL
  const params = new URLSearchParams(window.location.search);
  const slugParam = params.get('slug');
  const catParam = params.get('kategori');

  if (catParam && CULTURE_CATEGORY_MAP[catParam]) {
    state.kategori = catParam;
    updateCategoryTabUI(catParam);
  }

  setupEventListeners();

  // Jika ada slug di URL, langsung tampilkan detail artikel
  if (slugParam) {
    await showArticleDetail(slugParam, false);
  } else {
    await loadArticlesList();
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', async (e) => {
    const currentParams = new URLSearchParams(window.location.search);
    const slug = currentParams.get('slug');
    if (slug) {
      await showArticleDetail(slug, false);
    } else {
      showListView(false);
    }
  });
}

/**
 * Render icon statis
 */
function renderStaticIcons() {
  const iconMap = {
    'header-icon-landmark': Landmark,
    'culture-search-icon': Search,
    'btn-clear-culture-search': X,
    'icon-back-arrow': ArrowLeft,
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
 * Setup event listeners
 */
function setupEventListeners() {
  const searchInput = document.getElementById('culture-search-input');
  const btnClear = document.getElementById('btn-clear-culture-search');
  const catTabs = document.getElementById('culture-category-tabs');
  const btnBack = document.getElementById('btn-back-to-list');

  // 1. Search input dengan debounce
  searchInput?.addEventListener('input', (e) => {
    const val = e.target.value;
    state.query = val;

    if (val.trim()) {
      btnClear?.classList.remove('hidden');
    } else {
      btnClear?.classList.add('hidden');
    }

    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(async () => {
      await loadArticlesList();
    }, 280);
  });

  btnClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    state.query = '';
    btnClear.classList.add('hidden');
    loadArticlesList();
    searchInput?.focus();
  });

  // 2. Kategori tabs
  catTabs?.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-cat]');
    if (!btn) return;

    const cat = btn.getAttribute('data-cat');
    state.kategori = cat;
    updateCategoryTabUI(cat);
    loadArticlesList();
  });

  // 3. Tombol Kembali
  btnBack?.addEventListener('click', () => {
    showListView(true);
  });
}

/**
 * Update UI tab kategori aktif
 */
function updateCategoryTabUI(selectedCat) {
  const tabs = document.querySelectorAll('#culture-category-tabs button');
  tabs.forEach(btn => {
    if (btn.getAttribute('data-cat') === selectedCat) {
      btn.className = 'filter-btn filter-btn-active';
    } else {
      btn.className = 'filter-btn';
    }
  });
}

/**
 * Muat daftar artikel budaya (Gaya Kartu Majalah)
 */
async function loadArticlesList() {
  const countText = document.getElementById('culture-results-count');
  const grid = document.getElementById('culture-articles-grid');
  if (!grid) return;

  state.isLoading = true;
  if (countText) countText.textContent = 'Memuat artikel kebudayaan...';

  // Skeleton loading
  grid.innerHTML = Array(6).fill(0).map(() => `
    <div class="card-natural overflow-hidden animate-pulse">
      <div class="h-48 bg-pasir/60"></div>
      <div class="p-5 space-y-3">
        <div class="h-4 w-24 bg-pasir/50 rounded-full"></div>
        <div class="h-6 w-3/4 bg-pasir/60 rounded"></div>
        <div class="h-14 bg-pasir/30 rounded-xl"></div>
      </div>
    </div>
  `).join('');

  try {
    const articles = await getCultureArticles({
      kategori: state.kategori,
      query: state.query
    });

    state.articles = articles;
    renderMagazineGrid(articles);

    if (countText) {
      countText.textContent = `Menampilkan ${articles.length} artikel kebudayaan`;
    }
  } catch (err) {
    console.error('[Culture Articles Error]:', err);
    renderMagazineGrid([]);
    if (countText) countText.textContent = 'Gagal memuat artikel';
  } finally {
    state.isLoading = false;
  }
}

/**
 * Render grid kartu majalah budaya
 */
function renderMagazineGrid(articles) {
  const grid = document.getElementById('culture-articles-grid');
  if (!grid) return;

  if (!articles || articles.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 px-6 text-center card-natural border-dashed border-2 border-pasir max-w-lg mx-auto space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-pasir/40 flex items-center justify-center text-tanah">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h3 class="font-heading text-xl font-bold text-tanah-gelap">
          Artikel Belum Ditemukan
        </h3>
        <p class="font-body text-sm text-tanah">
          Tidak ada artikel budaya yang cocok dengan pencarian <em>"${state.query || state.kategori}"</em>.
        </p>
        <button id="btn-reset-culture-filter" class="btn-sekunder text-sm !py-2 !px-4 mt-2">
          Lihat Semua Artikel
        </button>
      </div>
    `;

    document.getElementById('btn-reset-culture-filter')?.addEventListener('click', () => {
      state.query = '';
      state.kategori = 'semua';
      const searchInput = document.getElementById('culture-search-input');
      if (searchInput) searchInput.value = '';
      updateCategoryTabUI('semua');
      loadArticlesList();
    });

    return;
  }

  grid.innerHTML = articles.map(item => {
    const catInfo = CULTURE_CATEGORY_MAP[item.kategori] || CULTURE_CATEGORY_MAP['tradisi'];

    return `
      <article
        class="card-natural overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-daun/40 flex flex-col justify-between group cursor-pointer"
        data-slug="${item.slug}"
      >
        <div>
          <!-- Cover Gambar -->
          <div class="relative h-48 sm:h-52 w-full overflow-hidden bg-tanah-gelap">
            <img
              src="${item.gambar_url || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'}"
              alt="${item.judul}"
              loading="lazy"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-tanah-gelap/80 via-transparent to-transparent opacity-60"></div>
            
            <!-- Badges di Gambar -->
            <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
              <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${catInfo.badgeClass} shadow-sm">
                <span>${catInfo.icon}</span>
                <span>${catInfo.label}</span>
              </span>
            </div>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
              <span class="bg-tanah-gelap/80 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <i class="fa-solid fa-location-dot text-emerald-400 text-[11px]"></i>
                <span>${item.wilayah || 'Bali'}</span>
              </span>
              <span class="bg-tanah-gelap/80 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <i class="fa-regular fa-clock text-amber-300 text-[11px]"></i>
                <span>${item.read_time || '4 menit'}</span>
              </span>
            </div>
          </div>

          <!-- Konten Teks -->
          <div class="p-5 sm:p-6 space-y-3">
            <h2 class="font-heading text-xl font-bold text-tanah-gelap group-hover:text-daun transition-colors leading-snug">
              ${item.judul}
            </h2>

            <p class="font-body text-sm text-tanah line-clamp-3 leading-relaxed">
              ${item.ringkasan}
            </p>
          </div>
        </div>

        <!-- Card Footer -->
        <div class="px-5 sm:px-6 pb-5 pt-3 border-t border-pasir/40 flex items-center justify-between text-xs font-semibold text-daun">
          <span>Baca Selengkapnya</span>
          <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </div>
      </article>
    `;
  }).join('');

  // Click card event listener
  grid.querySelectorAll('article[data-slug]').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.getAttribute('data-slug');
      if (slug) showArticleDetail(slug, true);
    });
  });
}

/**
 * Tampilkan Halaman Detail Artikel
 */
async function showArticleDetail(slug, updateHistory = true) {
  state.currentSlug = slug;

  const listView = document.getElementById('culture-list-view');
  const detailView = document.getElementById('culture-detail-view');
  const bodyContainer = document.getElementById('culture-article-body-container');
  if (!listView || !detailView || !bodyContainer) return;

  listView.classList.add('hidden');
  detailView.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Update URL browser
  if (updateHistory) {
    const newUrl = `${window.location.pathname}?slug=${encodeURIComponent(slug)}`;
    window.history.pushState({ slug }, '', newUrl);
  }

  bodyContainer.innerHTML = `
    <div class="p-12 text-center text-tanah card-natural animate-pulse">
      <div class="h-8 w-64 bg-pasir/60 rounded mx-auto mb-4"></div>
      <div class="h-4 w-96 bg-pasir/40 rounded mx-auto"></div>
    </div>
  `;

  const article = await getCultureArticleBySlug(slug);
  if (!article) {
    bodyContainer.innerHTML = `
      <div class="p-12 text-center card-natural space-y-4">
        <h2 class="font-heading text-2xl font-bold text-tanah-gelap">Artikel Tidak Ditemukan</h2>
        <p class="text-tanah text-sm">Artikel dengan tautan tersebut tidak tersedia.</p>
        <button id="btn-err-back" class="btn-primer text-sm !py-2 !px-4">Kembali</button>
      </div>
    `;
    document.getElementById('btn-err-back')?.addEventListener('click', () => showListView(true));
    return;
  }

  // Ambil tempat-tempat terkait dari place_culture
  const relatedPlaces = await getRelatedPlacesForArticle(article.id, article.slug);
  const catInfo = CULTURE_CATEGORY_MAP[article.kategori] || CULTURE_CATEGORY_MAP['tradisi'];

  // Render konten artikel majalah
  bodyContainer.innerHTML = `
    <!-- Header Artikel -->
    <header class="space-y-4">
      <div class="flex items-center gap-2 flex-wrap text-xs">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-semibold border ${catInfo.badgeClass}">
          <span>${catInfo.icon}</span>
          <span>${catInfo.label}</span>
        </span>
        <span class="px-3 py-1 rounded-full bg-pasir/50 text-tanah font-medium flex items-center gap-1.5">
          <i class="fa-solid fa-location-dot text-daun"></i>
          <span>${article.wilayah || 'Bali'}</span>
        </span>
        <span class="px-3 py-1 rounded-full bg-pasir/50 text-tanah font-medium flex items-center gap-1.5">
          <i class="fa-regular fa-clock text-tanah"></i>
          <span>${article.read_time || '4 menit baca'}</span>
        </span>
      </div>

      <h1 class="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-tanah-gelap leading-tight">
        ${article.judul}
      </h1>

      <p class="font-body text-base sm:text-lg text-tanah/90 italic font-medium leading-relaxed border-l-4 border-daun pl-4 py-1">
        ${article.ringkasan}
      </p>

      <!-- Aliases / Nama Alternatif -->
      ${Array.isArray(article.nama_alternatif) && article.nama_alternatif.length > 0 ? `
        <div class="flex items-center gap-1.5 flex-wrap text-xs text-tanah pt-1">
          <span class="font-semibold text-tanah/70">Dikenal juga sebagai:</span>
          ${article.nama_alternatif.map(a => `
            <span class="px-2.5 py-0.5 bg-pasir/40 rounded-lg text-tanah-gelap font-medium">
              ${a}
            </span>
          `).join('')}
        </div>
      ` : ''}
    </header>

    <!-- Gambar Utama Megah -->
    <div class="relative rounded-3xl overflow-hidden shadow-lg border border-pasir max-h-[460px] bg-tanah-gelap">
      <img
        src="${article.gambar_url || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'}"
        alt="${article.judul}"
        loading="lazy"
        decoding="async"
        class="w-full h-full object-cover"
      />
      <div class="absolute bottom-3 right-3">
        <span class="bg-tanah-gelap/80 backdrop-blur-sm text-krem text-[11px] px-3 py-1 rounded-full">
          Ilustrasi Budaya Bali · [PERLU DIVERIFIKASI]
        </span>
      </div>
    </div>

    <!-- Body Isi Artikel (Sanitized Markdown) -->
    <div class="bg-white rounded-3xl p-6 sm:p-10 border border-pasir shadow-sm text-tanah-gelap font-body leading-relaxed space-y-4">
      ${renderSanitizedMarkdown(article.isi_markdown)}
    </div>

    <!-- Bagian 1: Daftar Sumber Rujukan -->
    <section class="bg-pasir/30 rounded-3xl p-6 border border-pasir space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-heading text-base font-bold text-tanah-gelap flex items-center gap-2">
          <i class="fa-solid fa-book-bookmark text-daun"></i>
          <span>Daftar Sumber Rujukan & Transparansi</span>
        </h3>
        <span class="text-xs text-padi-dark bg-padi/20 px-2.5 py-0.5 rounded-full font-semibold border border-padi/30">
          [PERLU DIVERIFIKASI]
        </span>
      </div>
      <p class="text-xs text-tanah leading-relaxed">
        Artikel ini disusun sebagai pengantar edukasi kebudayaan Bali yang santun dan menjunjung nilai sakral.
        Sesuai integritas data kompetisi, rujukan resmi akan disinkronkan dengan acuan otoritatif penutur asli atau dinas kebudayaan:
      </p>
      <ul class="text-xs text-tanah space-y-1 list-disc list-inside">
        ${Array.isArray(article.sumber) && article.sumber.length > 0 ? (
          article.sumber.map(s => `<li>${s}</li>`).join('')
        ) : '<li>sumber belum diisi</li>'}
      </ul>
    </section>

    <!-- Bagian 2: Blok 'Tempat Terkait di Petualangan' (Place Culture) -->
    ${relatedPlaces && relatedPlaces.length > 0 ? `
      <section class="bg-white rounded-3xl p-6 sm:p-8 border border-pasir shadow-sm space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-daun block">Destinasi Terhubung</span>
            <h3 class="font-heading text-xl sm:text-2xl font-bold text-tanah-gelap">
              Tempat Terkait di Petualangan Saya
            </h3>
          </div>
          <span class="text-xs text-tanah bg-krem px-3 py-1 rounded-full border border-pasir">
            ${relatedPlaces.length} Destinasi
          </span>
        </div>

        <p class="text-xs sm:text-sm text-tanah">
          Kunjungi tempat-tempat berikut dalam paket petualangan Anda untuk merasakan langsung kearifan budaya ini di dunia nyata:
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${relatedPlaces.map(p => `
            <div class="p-3.5 rounded-2xl bg-krem/50 border border-pasir hover:border-daun/40 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div class="h-28 w-full rounded-xl overflow-hidden mb-2 bg-tanah-gelap">
                  <img
                    src="${p.image_url || 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=600&q=80'}"
                    alt="${p.name}"
                    class="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <h4 class="font-heading text-sm font-bold text-tanah-gelap leading-snug line-clamp-2">
                  ${p.name}
                </h4>
                <p class="text-[11px] text-tanah mt-1 flex items-center gap-1">
                  <i class="fa-solid fa-location-dot text-daun text-[10px]"></i>
                  <span>${p.region} · <span class="capitalize">${p.category}</span></span>
                </p>
              </div>

              <a
                href="/src/pages/petualangan.html"
                class="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-daun bg-white hover:bg-daun hover:text-white py-1.5 px-3 rounded-xl border border-pasir transition-all"
              >
                <span>Jelajahi di Rute</span>
                <span>→</span>
              </a>
            </div>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Tombol Bagikan & Kembali -->
    <div class="pt-6 border-t border-pasir flex items-center justify-between">
      <button id="btn-article-back-bottom" class="btn-sekunder text-xs sm:text-sm !py-2.5 !px-5">
        ← Kembali ke Daftar Artikel
      </button>

      <button id="btn-share-article" class="btn-ghost text-xs sm:text-sm !py-2.5 !px-4 flex items-center gap-1.5 border border-pasir">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        Bagikan Artikel
      </button>
    </div>
  `;

  // Event handlers di detail
  document.getElementById('btn-article-back-bottom')?.addEventListener('click', () => showListView(true));

  document.getElementById('btn-share-article')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({
        title: article.judul,
        text: article.ringkasan,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Tautan artikel berhasil disalin ke papan klip!', 'sukses');
    }
  });
}

/**
 * Beralih kembali ke tampilan daftar artikel
 */
function showListView(updateHistory = true) {
  state.currentSlug = null;
  const listView = document.getElementById('culture-list-view');
  const detailView = document.getElementById('culture-detail-view');

  if (detailView) detailView.classList.add('hidden');
  if (listView) listView.classList.remove('hidden');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (updateHistory) {
    const cleanUrl = window.location.pathname;
    window.history.pushState({}, '', cleanUrl);
  }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', init);
