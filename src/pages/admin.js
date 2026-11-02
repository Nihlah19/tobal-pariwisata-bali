/**
 * Super Admin Dashboard Controller — Tobal Pariwisata & Budaya Bali
 * Mengelola Blog Budaya, Kamus KBBI Bali, Tata Bahasa Bali, Switcher DB Supabase & Gemini AI
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import '../styles/main.css';
import { supabase } from '../lib/supabaseClient.js';
import { FALLBACK_CULTURE_ARTICLES } from '../lib/culture.js';
import { FALLBACK_DICTIONARY } from '../lib/dictionary.js';
import { FALLBACK_GRAMMAR_RULES } from '../lib/grammar.js';

// Global Admin State
const adminState = {
  passkey: sessionStorage.getItem('tobal_admin_key') || '',
  activeTab: 'overview',
  config: null,
  articles: [],
  dictionary: [],
  grammar: [],
  loadedTabs: new Set(['overview']),
  dictPage: 1,
  dictPageSize: 15,
  culturePage: 1,
  culturePageSize: 6,
  grammarPage: 1,
  grammarPageSize: 8
};

// Helper debounce untuk menghindari freezing saat mengetik pencarian
function debounce(fn, delay = 150) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ==============================================================================
// 1. TOAST NOTIFICATION HELPER
// ==============================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-900/95 border-emerald-500 text-emerald-100',
    error: 'bg-red-900/95 border-red-500 text-red-100',
    warning: 'bg-amber-900/95 border-amber-500 text-amber-100',
    info: 'bg-[#2A1E17]/95 border-terakota text-amber-100'
  };
  const icons = {
    success: 'fa-circle-check text-emerald-400',
    error: 'fa-circle-exclamation text-red-400',
    warning: 'fa-triangle-exclamation text-amber-400',
    info: 'fa-circle-info text-terakota'
  };

  toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl backdrop-blur-md text-xs font-semibold animate-fade-in transition-all ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-sm"></i>
    <span class="flex-1">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==============================================================================
// 2. ADMIN GATE AUTHENTICATION
// ==============================================================================
function initAdminGate() {
  const overlay = document.getElementById('admin-gate-overlay');
  const form = document.getElementById('form-admin-gate');
  const passInput = document.getElementById('input-admin-passkey');
  const errBox = document.getElementById('admin-gate-error');
  const logoutBtn = document.getElementById('btn-admin-logout');

  // Periksa apakah sudah ada passkey / sesi admin dari jalur masuk utama
  if (adminState.passkey) {
    verifyPasskey(adminState.passkey).then(valid => {
      if (valid) {
        overlay?.classList.add('hidden');
        loadAllData();
      } else {
        sessionStorage.removeItem('tobal_admin_key');
        adminState.passkey = '';
        window.location.href = '/src/pages/masuk.html?returnTo=' + encodeURIComponent('/src/pages/admin.html');
      }
    });
  } else {
    // Pengunjung belum login sebagai admin -> arahkan ke pintu login utama
    window.location.href = '/src/pages/masuk.html?returnTo=' + encodeURIComponent('/src/pages/admin.html');
    return;
  }

  logoutBtn?.addEventListener('click', () => {
    sessionStorage.removeItem('tobal_admin_key');
    localStorage.removeItem('tobal_user_role');
    adminState.passkey = '';
    showToast('Sesi Super Admin telah ditutup.', 'info');
    setTimeout(() => {
      window.location.href = '/src/pages/masuk.html';
    }, 600);
  });
}

async function verifyPasskey(key) {
  try {
    const res = await fetch('/api/admin-config', {
      headers: { 'X-Admin-Key': key }
    });
    return res.status !== 401;
  } catch {
    return key === 'tobal2026';
  }
}

// ==============================================================================
// 3. TAB CONTROLLER (LAZY LOADING UNTUK PERFORMA TINGGI)
// ==============================================================================
window.switchTab = async function(tabName) {
  adminState.activeTab = tabName;

  // Update button styles
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Toggle sections
  document.querySelectorAll('.admin-section').forEach(sec => {
    sec.classList.add('hidden');
  });
  const activeSec = document.getElementById(`section-${tabName}`);
  if (activeSec) {
    activeSec.classList.remove('hidden');
  }

  // Lazy load data saat tab pertama kali dibuka
  if (!adminState.loadedTabs.has(tabName)) {
    adminState.loadedTabs.add(tabName);
    if (tabName === 'culture') await loadCultureArticles();
    if (tabName === 'dictionary') await loadDictionary();
    if (tabName === 'grammar') await loadGrammar();
  } else {
    if (tabName === 'culture') renderCultureList();
    if (tabName === 'dictionary') renderDictionaryTable();
    if (tabName === 'grammar') renderGrammarList();
  }
};

function setupTabButtons() {
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.switchTab(btn.dataset.tab);
    });
  });
}

// ==============================================================================
// 4. LOAD CONFIGURATION & OVERVIEW
// ==============================================================================
async function loadConfig() {
  try {
    const res = await fetch('/api/admin-config', {
      headers: { 'X-Admin-Key': adminState.passkey }
    });
    if (!res.ok) throw new Error('Gagal memuat konfigurasi server');
    const json = await res.json();
    adminState.config = json.config;

    // Update Overview UI
    document.getElementById('overview-supabase-url').textContent = json.config.supabase_url || 'Belum diatur';
    document.getElementById('overview-supabase-key').textContent = json.config.supabase_anon_masked || 'Belum diatur';
    document.getElementById('overview-gemini-model').textContent = json.config.gemini_model || 'gemini-2.5-flash';
    document.getElementById('overview-gemini-key').textContent = json.config.gemini_api_key_masked || 'Belum diatur';

    // Populate Settings Inputs
    const urlInput = document.getElementById('cfg-supabase-url');
    if (urlInput && !urlInput.value) urlInput.value = json.config.supabase_url || '';

    const modelSelect = document.getElementById('cfg-gemini-model');
    if (modelSelect) modelSelect.value = json.config.gemini_model || 'gemini-2.5-flash';

    const openAiSelect = document.getElementById('cfg-openai-model');
    if (openAiSelect) openAiSelect.value = json.config.openai_model || 'gpt-4o-mini';

    // Stat counts
    document.getElementById('stat-places-count').textContent = json.config.stats?.places || 1328;
    document.getElementById('stat-culture-count').textContent = json.config.stats?.culture_articles || adminState.articles.length;
    document.getElementById('stat-dict-count').textContent = json.config.stats?.dictionary || adminState.dictionary.length;
    document.getElementById('stat-grammar-count').textContent = json.config.stats?.balinese_grammar || adminState.grammar.length;

  } catch (err) {
    console.warn('[Admin Config Warning]:', err.message);
  }
}

// ==============================================================================
// 4.5 REUSABLE ADMIN PAGINATION COMPONENT
// ==============================================================================
function renderAdminPagination({
  containerId,
  currentPage,
  pageSize,
  totalItems,
  itemName = 'data',
  onPageChange
}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }

  container.classList.remove('hidden');

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);

  let pageButtonsHTML = '';
  const maxButtons = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    pageButtonsHTML += `
      <button class="adm-p-btn w-8 h-8 rounded-lg border border-pasir text-xs font-semibold hover:border-terakota hover:text-terakota transition-colors cursor-pointer" data-page="1">1</button>
      ${startPage > 2 ? '<span class="px-1 text-tanah/50 text-xs">...</span>' : ''}
    `;
  }

  for (let p = startPage; p <= endPage; p++) {
    const isActive = p === currentPage;
    pageButtonsHTML += `
      <button class="adm-p-btn w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive ? 'bg-terakota text-white shadow-xs' : 'border border-pasir hover:border-terakota hover:text-terakota bg-white text-tanah'}" data-page="${p}">${p}</button>
    `;
  }

  if (endPage < totalPages) {
    pageButtonsHTML += `
      ${endPage < totalPages - 1 ? '<span class="px-1 text-tanah/50 text-xs">...</span>' : ''}
      <button class="adm-p-btn w-8 h-8 rounded-lg border border-pasir text-xs font-semibold hover:border-terakota hover:text-terakota transition-colors cursor-pointer" data-page="${totalPages}">${totalPages}</button>
    `;
  }

  container.innerHTML = `
    <div class="text-xs text-tanah font-medium">
      Menampilkan <strong>${startIdx + 1} - ${endIdx}</strong> dari <strong>${totalItems}</strong> ${itemName} (Halaman ${currentPage} / ${totalPages})
    </div>
    <div class="flex items-center gap-1.5">
      <button id="${containerId}-prev" class="px-3 py-1.5 rounded-xl border border-pasir text-xs font-semibold text-tanah hover:border-terakota hover:text-terakota transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none" ${currentPage <= 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-chevron-left text-[10px]"></i>
        <span>Sebelumnya</span>
      </button>
      <div class="flex items-center gap-1">
        ${pageButtonsHTML}
      </div>
      <button id="${containerId}-next" class="px-3 py-1.5 rounded-xl border border-pasir text-xs font-semibold text-tanah hover:border-terakota hover:text-terakota transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:pointer-events-none" ${currentPage >= totalPages ? 'disabled' : ''}>
        <span>Berikutnya</span>
        <i class="fa-solid fa-chevron-right text-[10px]"></i>
      </button>
    </div>
  `;

  container.querySelector(`#${containerId}-prev`)?.addEventListener('click', () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  });
  container.querySelector(`#${containerId}-next`)?.addEventListener('click', () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  });
  container.querySelectorAll('.adm-p-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.page, 10);
      if (p && p !== currentPage) onPageChange(p);
    });
  });
}

// ==============================================================================
// 5. ENSIKLOPEDIA BUDAYA (BLOG / CMS STUDIO)
// ==============================================================================
async function loadCultureArticles() {
  try {
    const { data, error } = await supabase.from('culture_articles').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      adminState.articles = data;
    } else {
      adminState.articles = [...FALLBACK_CULTURE_ARTICLES];
    }
  } catch {
    adminState.articles = [...FALLBACK_CULTURE_ARTICLES];
  }
  document.getElementById('stat-culture-count').textContent = adminState.articles.length;
  renderCultureList();
}

function renderCultureList() {
  const container = document.getElementById('admin-culture-list');
  const paginationEl = document.getElementById('admin-culture-pagination');
  if (!container) return;

  const searchQuery = (document.getElementById('filter-culture-search')?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('filter-culture-category')?.value || 'semua';

  const filtered = adminState.articles.filter(item => {
    if (categoryFilter !== 'semua' && item.kategori !== categoryFilter) return false;
    if (searchQuery) {
      const matchTitle = item.judul.toLowerCase().includes(searchQuery);
      const matchSummary = item.ringkasan.toLowerCase().includes(searchQuery);
      return matchTitle || matchSummary;
    }
    return true;
  });

  if (filtered.length === 0) {
    if (paginationEl) {
      paginationEl.classList.add('hidden');
      paginationEl.innerHTML = '';
    }
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-3xl border border-pasir p-6">
        <i class="fa-solid fa-file-circle-question text-tanah/40 text-3xl mb-2"></i>
        <p class="text-sm font-bold text-tanah-gelap">Tidak ada artikel yang cocok</p>
        <p class="text-xs text-tanah/60 mt-1">Gunakan kata kunci lain atau buat artikel blog budaya baru.</p>
      </div>
    `;
    return;
  }

  // Paginasi artikel
  const totalPages = Math.ceil(filtered.length / adminState.culturePageSize);
  if (adminState.culturePage > totalPages) adminState.culturePage = totalPages;
  if (adminState.culturePage < 1) adminState.culturePage = 1;

  const startIdx = (adminState.culturePage - 1) * adminState.culturePageSize;
  const pagedArticles = filtered.slice(startIdx, startIdx + adminState.culturePageSize);

  container.innerHTML = pagedArticles.map(item => `
    <div class="card-organik p-5 bg-white border border-pasir/80 flex flex-col justify-between group hover:shadow-md transition-all">
      <div class="space-y-3">
        <div class="relative w-full h-36 rounded-2xl overflow-hidden bg-pasir/40">
          <img src="${item.gambar_url || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80'}" alt="${item.judul}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='/images/mascot-barong.png'" />
          <span class="absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.diterbitkan !== false ? 'bg-emerald-600 text-white' : 'bg-tanah/80 text-white'} shadow-xs">
            ${item.diterbitkan !== false ? 'Terbit' : 'Draft'}
          </span>
          <span class="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-tanah-gelap backdrop-blur-xs">
            ${item.kategori}
          </span>
        </div>

        <div>
          <h4 class="font-heading font-bold text-base text-tanah-gelap group-hover:text-terakota transition-colors line-clamp-2">
            ${item.judul}
          </h4>
          <p class="text-xs text-tanah/70 mt-1.5 line-clamp-2 leading-relaxed">
            ${item.ringkasan}
          </p>
        </div>
      </div>

      <div class="pt-4 mt-3 border-t border-pasir/60 flex items-center justify-between text-xs">
        <span class="text-[11px] text-tanah/50 flex items-center gap-1">
          <i class="fa-solid fa-location-dot text-[10px]"></i>
          <span>${item.wilayah || 'Bali'}</span>
        </span>
        <div class="flex items-center gap-2">
          <button class="btn-edit-culture px-2.5 py-1 rounded-lg bg-pasir/40 hover:bg-terakota hover:text-white text-tanah font-semibold text-xs transition-colors cursor-pointer" data-id="${item.id}">
            <i class="fa-solid fa-pen text-[10px]"></i> Edit
          </button>
          <button class="btn-delete-culture px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-semibold text-xs transition-colors cursor-pointer" data-id="${item.id}" data-title="${item.judul}">
            <i class="fa-solid fa-trash text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Event handlers
  container.querySelectorAll('.btn-edit-culture').forEach(btn => {
    btn.addEventListener('click', () => openCultureModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-delete-culture').forEach(btn => {
    btn.addEventListener('click', () => deleteCultureArticle(btn.dataset.id, btn.dataset.title));
  });

  // Render kontrol paginasi
  renderAdminPagination({
    containerId: 'admin-culture-pagination',
    currentPage: adminState.culturePage,
    pageSize: adminState.culturePageSize,
    totalItems: filtered.length,
    itemName: 'artikel budaya',
    onPageChange: (newPage) => {
      adminState.culturePage = newPage;
      renderCultureList();
      document.getElementById('admin-culture-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function openCultureModal(id = null) {
  const modal = document.getElementById('modal-culture');
  const form = document.getElementById('form-culture-article');
  const title = document.getElementById('modal-culture-title');
  form.reset();

  if (id) {
    const item = adminState.articles.find(a => a.id === id);
    if (item) {
      title.innerHTML = '<i class="fa-solid fa-pen-to-square text-terakota"></i> Edit Artikel Budaya';
      document.getElementById('culture-form-id').value = item.id;
      document.getElementById('culture-form-judul').value = item.judul || '';
      document.getElementById('culture-form-slug').value = item.slug || '';
      document.getElementById('culture-form-kategori').value = item.kategori || 'tradisi';
      document.getElementById('culture-form-wilayah').value = item.wilayah || 'Seluruh Bali';
      document.getElementById('culture-form-alternatif').value = Array.isArray(item.nama_alternatif) ? item.nama_alternatif.join(', ') : '';
      document.getElementById('culture-form-gambar').value = item.gambar_url || '';
      document.getElementById('culture-form-ringkasan').value = item.ringkasan || '';
      document.getElementById('culture-form-markdown').value = item.isi_markdown || '';
      document.getElementById('culture-form-diterbitkan').checked = item.diterbitkan !== false;
    }
  } else {
    title.innerHTML = '<i class="fa-solid fa-newspaper text-terakota"></i> Tulis Artikel Ensiklopedia Budaya Baru';
    document.getElementById('culture-form-id').value = '';
    document.getElementById('culture-form-diterbitkan').checked = true;
  }

  modal.classList.remove('hidden');
}

async function handleCultureSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('culture-form-id').value;
  const judul = document.getElementById('culture-form-judul').value.trim();
  const slug = document.getElementById('culture-form-slug').value.trim();
  const kategori = document.getElementById('culture-form-kategori').value;
  const wilayah = document.getElementById('culture-form-wilayah').value.trim();
  const alternatifStr = document.getElementById('culture-form-alternatif').value.trim();
  const gambar_url = document.getElementById('culture-form-gambar').value.trim();
  const ringkasan = document.getElementById('culture-form-ringkasan').value.trim();
  const isi_markdown = document.getElementById('culture-form-markdown').value.trim();
  const diterbitkan = document.getElementById('culture-form-diterbitkan').checked;

  const payload = {
    id: id || undefined,
    judul,
    slug: slug || undefined,
    kategori,
    wilayah,
    nama_alternatif: alternatifStr ? alternatifStr.split(',').map(s => s.trim()).filter(Boolean) : [],
    gambar_url,
    ringkasan,
    isi_markdown,
    diterbitkan
  };

  try {
    const res = await fetch('/api/admin-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminState.passkey
      },
      body: JSON.stringify({ action: 'save_culture', article: payload })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menyimpan artikel');

    showToast(json.message || 'Artikel berhasil disimpan!', 'success');
    document.getElementById('modal-culture').classList.add('hidden');
    await loadCultureArticles();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteCultureArticle(id, title) {
  if (!confirm(`Hapus artikel "${title}" dari Ensiklopedia Budaya?`)) return;

  try {
    const res = await fetch('/api/admin-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminState.passkey
      },
      body: JSON.stringify({ action: 'delete_culture', id })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus');

    showToast('Artikel budaya berhasil dihapus.', 'success');
    adminState.articles = adminState.articles.filter(a => a.id !== id);
    renderCultureList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==============================================================================
// 6. KAMUS BAHASA BALI (DICTIONARY MANAGER)
// ==============================================================================
async function loadDictionary() {
  try {
    const { data, error } = await supabase.from('dictionary').select('*').order('kata', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      adminState.dictionary = data;
    } else {
      adminState.dictionary = [...FALLBACK_DICTIONARY];
    }
  } catch {
    adminState.dictionary = [...FALLBACK_DICTIONARY];
  }
  document.getElementById('stat-dict-count').textContent = adminState.dictionary.length;
  renderDictionaryTable();
}

function renderDictionaryTable() {
  const tbody = document.getElementById('admin-dict-table-body');
  const paginationEl = document.getElementById('admin-dict-pagination');
  if (!tbody) return;

  const searchQuery = (document.getElementById('filter-dict-search')?.value || '').toLowerCase().trim();
  const levelFilter = document.getElementById('filter-dict-level')?.value || 'semua';

  const filtered = adminState.dictionary.filter(w => {
    if (levelFilter !== 'semua' && w.tingkat !== levelFilter) return false;
    if (searchQuery) {
      const matchKata = w.kata.toLowerCase().includes(searchQuery);
      const matchArti = w.arti_indonesia.toLowerCase().includes(searchQuery);
      return matchKata || matchArti;
    }
    return true;
  });

  if (filtered.length === 0) {
    if (paginationEl) {
      paginationEl.classList.add('hidden');
      paginationEl.innerHTML = '';
    }
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-tanah/50 font-medium">
          Tidak ada kosakata yang cocok dengan pencarian.
        </td>
      </tr>
    `;
    return;
  }

  // Paginasi tabel kosakata
  const totalPages = Math.ceil(filtered.length / adminState.dictPageSize);
  if (adminState.dictPage > totalPages) adminState.dictPage = totalPages;
  if (adminState.dictPage < 1) adminState.dictPage = 1;

  const startIdx = (adminState.dictPage - 1) * adminState.dictPageSize;
  const displayItems = filtered.slice(startIdx, startIdx + adminState.dictPageSize);

  tbody.innerHTML = displayItems.map(w => `
    <tr class="hover:bg-krem/30 transition-colors">
      <td class="py-3 px-4 font-bold text-tanah-gelap text-sm">${w.kata}</td>
      <td class="py-3 px-4 text-tanah max-w-xs truncate">${w.arti_indonesia}</td>
      <td class="py-3 px-4">
        <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
          ${w.tingkat}
        </span>
      </td>
      <td class="py-3 px-4 font-mono text-[11px] text-terakota font-semibold">(${w.kelas_kata})</td>
      <td class="py-3 px-4 text-tanah/70 italic text-[11px] max-w-xs truncate">${w.contoh_bali || '-'}</td>
      <td class="py-3 px-4 text-right whitespace-nowrap">
        <button class="btn-edit-word px-2 py-1 rounded-lg bg-pasir/40 hover:bg-amber-600 hover:text-white text-tanah font-semibold text-xs transition-colors cursor-pointer mr-1" data-id="${w.id}">
          ✎ Edit
        </button>
        <button class="btn-delete-word px-2 py-1 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-semibold text-xs transition-colors cursor-pointer" data-id="${w.id}" data-kata="${w.kata}">
          ✕
        </button>
      </td>
    </tr>
  `).join('');

  // Event handlers
  tbody.querySelectorAll('.btn-edit-word').forEach(btn => {
    btn.addEventListener('click', () => openWordModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.btn-delete-word').forEach(btn => {
    btn.addEventListener('click', () => deleteWord(btn.dataset.id, btn.dataset.kata));
  });

  // Render kontrol paginasi kamus
  renderAdminPagination({
    containerId: 'admin-dict-pagination',
    currentPage: adminState.dictPage,
    pageSize: adminState.dictPageSize,
    totalItems: filtered.length,
    itemName: 'kosakata',
    onPageChange: (newPage) => {
      adminState.dictPage = newPage;
      renderDictionaryTable();
      document.getElementById('section-dictionary')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function openWordModal(id = null) {
  const modal = document.getElementById('modal-dict');
  const form = document.getElementById('form-dict-word');
  const title = document.getElementById('modal-dict-title');
  form.reset();

  if (id) {
    const item = adminState.dictionary.find(w => w.id === id);
    if (item) {
      title.innerHTML = '<i class="fa-solid fa-pen-to-square text-amber-600"></i> Edit Kosakata Kamus';
      document.getElementById('dict-form-id').value = item.id;
      document.getElementById('dict-form-kata').value = item.kata || '';
      document.getElementById('dict-form-tingkat').value = item.tingkat || 'umum';
      document.getElementById('dict-form-arti-id').value = item.arti_indonesia || '';
      document.getElementById('dict-form-arti-en').value = item.arti_inggris || '';
      document.getElementById('dict-form-kelas').value = item.kelas_kata || 'p';
      document.getElementById('dict-form-padanan').value = Array.isArray(item.padanan_tingkat) ? item.padanan_tingkat.join(', ') : '';
      document.getElementById('dict-form-contoh-bali').value = item.contoh_bali || '';
      document.getElementById('dict-form-contoh-id').value = item.contoh_terjemahan || '';
      document.getElementById('dict-form-catatan').value = item.catatan || '';
    }
  } else {
    title.innerHTML = '<i class="fa-solid fa-plus text-amber-600"></i> Tambah Kosakata Kamus Baru';
    document.getElementById('dict-form-id').value = '';
  }

  modal.classList.remove('hidden');
}

async function handleWordSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('dict-form-id').value;
  const kata = document.getElementById('dict-form-kata').value.trim();
  const tingkat = document.getElementById('dict-form-tingkat').value;
  const arti_indonesia = document.getElementById('dict-form-arti-id').value.trim();
  const arti_inggris = document.getElementById('dict-form-arti-en').value.trim();
  const kelas_kata = document.getElementById('dict-form-kelas').value;
  const padananStr = document.getElementById('dict-form-padanan').value.trim();
  const contoh_bali = document.getElementById('dict-form-contoh-bali').value.trim();
  const contoh_terjemahan = document.getElementById('dict-form-contoh-id').value.trim();
  const catatan = document.getElementById('dict-form-catatan').value.trim();

  const payload = {
    id: id || undefined,
    kata,
    tingkat,
    arti_indonesia,
    arti_inggris,
    kelas_kata,
    padanan_tingkat: padananStr ? padananStr.split(',').map(s => s.trim()).filter(Boolean) : null,
    contoh_bali,
    contoh_terjemahan,
    catatan
  };

  try {
    const res = await fetch('/api/admin-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminState.passkey
      },
      body: JSON.stringify({ action: 'save_dictionary', word: payload })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menyimpan kosakata');

    showToast(json.message || 'Kosakata berhasil disimpan!', 'success');
    document.getElementById('modal-dict').classList.add('hidden');
    await loadDictionary();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteWord(id, kata) {
  if (!confirm(`Hapus kata "${kata}" dari kamus?`)) return;

  try {
    const res = await fetch('/api/admin-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminState.passkey
      },
      body: JSON.stringify({ action: 'delete_dictionary', id })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus');

    showToast('Kosakata berhasil dihapus.', 'success');
    adminState.dictionary = adminState.dictionary.filter(w => w.id !== id);
    renderDictionaryTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==============================================================================
// 7. TATA BAHASA BALI (BALINESE GRAMMAR)
// ==============================================================================
async function loadGrammar() {
  try {
    const { data, error } = await supabase.from('balinese_grammar').select('*').order('urutan', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      adminState.grammar = data;
    } else {
      adminState.grammar = [...FALLBACK_GRAMMAR_RULES];
    }
  } catch {
    adminState.grammar = [...FALLBACK_GRAMMAR_RULES];
  }
  document.getElementById('stat-grammar-count').textContent = adminState.grammar.length;
  renderGrammarList();
}

function renderGrammarList() {
  const container = document.getElementById('admin-grammar-list');
  const paginationEl = document.getElementById('admin-grammar-pagination');
  if (!container) return;

  const searchQuery = (document.getElementById('filter-grammar-search')?.value || '').toLowerCase().trim();
  const categoryFilter = document.getElementById('filter-grammar-category')?.value || 'semua';

  const filtered = adminState.grammar.filter(item => {
    if (categoryFilter !== 'semua' && item.kategori !== categoryFilter) return false;
    if (searchQuery) {
      const matchTitle = item.judul.toLowerCase().includes(searchQuery);
      const matchSummary = item.ringkasan.toLowerCase().includes(searchQuery);
      return matchTitle || matchSummary;
    }
    return true;
  });

  if (filtered.length === 0) {
    if (paginationEl) {
      paginationEl.classList.add('hidden');
      paginationEl.innerHTML = '';
    }
    container.innerHTML = `
      <div class="py-10 text-center bg-white rounded-3xl border border-pasir p-6">
        <i class="fa-solid fa-feather-pointed text-tanah/40 text-3xl mb-2"></i>
        <p class="text-sm font-bold text-tanah-gelap">Tidak ada materi tata bahasa yang cocok</p>
      </div>
    `;
    return;
  }

  // Paginasi tata bahasa
  const totalPages = Math.ceil(filtered.length / adminState.grammarPageSize);
  if (adminState.grammarPage > totalPages) adminState.grammarPage = totalPages;
  if (adminState.grammarPage < 1) adminState.grammarPage = 1;

  const startIdx = (adminState.grammarPage - 1) * adminState.grammarPageSize;
  const displayItems = filtered.slice(startIdx, startIdx + adminState.grammarPageSize);

  container.innerHTML = displayItems.map(item => `
    <div class="card-organik p-5 bg-white border border-pasir/80 space-y-4 hover:shadow-xs transition-all">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pasir/50 pb-3">
        <div class="flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-lg bg-daun/10 text-daun flex items-center justify-center font-bold text-xs">
            ${item.urutan || 1}
          </span>
          <div>
            <h4 class="font-heading font-bold text-base text-tanah-gelap">${item.judul}</h4>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-daun bg-daun/10 px-2 py-0.5 rounded-full">
                ${item.kategori}
              </span>
              <span class="text-[10px] text-tanah/60 font-medium">
                Tingkat: ${item.tingkat || 'semua'}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 self-end sm:self-auto">
          <button class="btn-edit-grammar px-3 py-1.5 rounded-xl bg-pasir/40 hover:bg-daun hover:text-white text-tanah font-semibold text-xs transition-colors cursor-pointer" data-id="${item.id}">
            <i class="fa-solid fa-pen text-[10px]"></i> Edit
          </button>
          <button class="btn-delete-grammar px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-semibold text-xs transition-colors cursor-pointer" data-id="${item.id}" data-title="${item.judul}">
            <i class="fa-solid fa-trash text-[10px]"></i>
          </button>
        </div>
      </div>

      <p class="text-xs text-tanah leading-relaxed">${item.ringkasan}</p>

      ${item.pola_rumus ? `
        <div class="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60 font-mono text-[11px] text-amber-900 flex items-center gap-2">
          <i class="fa-solid fa-cube text-amber-600 text-xs"></i>
          <span><strong>Rumus Pola:</strong> ${item.pola_rumus}</span>
        </div>
      ` : ''}

      ${Array.isArray(item.contoh_kalimat) && item.contoh_kalimat.length > 0 ? `
        <div class="space-y-1.5 pt-1">
          <span class="text-[11px] font-bold uppercase tracking-wider text-tanah/70 block">Contoh Kalimat:</span>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            ${item.contoh_kalimat.slice(0, 3).map(c => `
              <div class="p-2 rounded-xl bg-krem/40 border border-pasir/60">
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

  // Handlers
  container.querySelectorAll('.btn-edit-grammar').forEach(btn => {
    btn.addEventListener('click', () => openGrammarModal(btn.dataset.id));
  });
  container.querySelectorAll('.btn-delete-grammar').forEach(btn => {
    btn.addEventListener('click', () => deleteGrammar(btn.dataset.id, btn.dataset.title));
  });

  // Render kontrol paginasi tata bahasa
  renderAdminPagination({
    containerId: 'admin-grammar-pagination',
    currentPage: adminState.grammarPage,
    pageSize: adminState.grammarPageSize,
    totalItems: filtered.length,
    itemName: 'kaidah tata bahasa',
    onPageChange: (newPage) => {
      adminState.grammarPage = newPage;
      renderGrammarList();
      document.getElementById('section-grammar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function openGrammarModal(id = null) {
  const modal = document.getElementById('modal-grammar');
  const form = document.getElementById('form-grammar-rule');
  const title = document.getElementById('modal-grammar-title');
  const examplesContainer = document.getElementById('grammar-examples-container');
  form.reset();
  examplesContainer.innerHTML = '';

  if (id) {
    const item = adminState.grammar.find(g => g.id === id);
    if (item) {
      title.innerHTML = '<i class="fa-solid fa-pen-to-square text-daun"></i> Edit Materi Tata Bahasa';
      document.getElementById('grammar-form-id').value = item.id;
      document.getElementById('grammar-form-judul').value = item.judul || '';
      document.getElementById('grammar-form-kategori').value = item.kategori || 'sor-singgih';
      document.getElementById('grammar-form-tingkat').value = item.tingkat || 'semua tingkatan';
      document.getElementById('grammar-form-pola').value = item.pola_rumus || '';
      document.getElementById('grammar-form-ringkasan').value = item.ringkasan || '';
      document.getElementById('grammar-form-penjelasan').value = item.penjelasan_markdown || '';

      if (Array.isArray(item.contoh_kalimat)) {
        item.contoh_kalimat.forEach(c => addGrammarExampleRow(c.bali, c.indonesia, c.catatan));
      }
    }
  } else {
    title.innerHTML = '<i class="fa-solid fa-feather text-daun"></i> Tambah Aturan Tata Bahasa Baru';
    document.getElementById('grammar-form-id').value = '';
    addGrammarExampleRow(); // default 1 row
  }

  modal.classList.remove('hidden');
}

function addGrammarExampleRow(bali = '', id = '', catatan = '') {
  const container = document.getElementById('grammar-examples-container');
  const row = document.createElement('div');
  row.className = 'grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-krem/40 border border-pasir relative group';
  row.innerHTML = `
    <input type="text" class="input-ex-bali px-2.5 py-1.5 bg-white rounded-lg border border-pasir text-xs placeholder:text-tanah/40" placeholder="Kalimat Bali..." value="${bali}" />
    <input type="text" class="input-ex-id px-2.5 py-1.5 bg-white rounded-lg border border-pasir text-xs placeholder:text-tanah/40" placeholder="Terjemahan Indonesia..." value="${id}" />
    <div class="flex items-center gap-1.5">
      <input type="text" class="input-ex-cat flex-1 px-2.5 py-1.5 bg-white rounded-lg border border-pasir text-xs placeholder:text-tanah/40" placeholder="Catatan analisa..." value="${catatan}" />
      <button type="button" class="btn-remove-row text-red-500 hover:text-red-700 px-1.5 py-1 cursor-pointer">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;
  row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

async function handleGrammarSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('grammar-form-id').value;
  const judul = document.getElementById('grammar-form-judul').value.trim();
  const kategori = document.getElementById('grammar-form-kategori').value;
  const tingkat = document.getElementById('grammar-form-tingkat').value.trim();
  const pola_rumus = document.getElementById('grammar-form-pola').value.trim();
  const ringkasan = document.getElementById('grammar-form-ringkasan').value.trim();
  const penjelasan_markdown = document.getElementById('grammar-form-penjelasan').value.trim();

  // Ambil baris contoh kalimat
  const contoh_kalimat = [];
  document.querySelectorAll('#grammar-examples-container > div').forEach(row => {
    const b = row.querySelector('.input-ex-bali')?.value.trim();
    const i = row.querySelector('.input-ex-id')?.value.trim();
    const c = row.querySelector('.input-ex-cat')?.value.trim();
    if (b && i) contoh_kalimat.push({ bali: b, indonesia: i, catatan: c });
  });

  const payload = {
    id: id || undefined,
    judul,
    kategori,
    tingkat,
    pola_rumus,
    ringkasan,
    penjelasan_markdown,
    contoh_kalimat
  };

  try {
    const res = await fetch('/api/admin-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminState.passkey
      },
      body: JSON.stringify({ action: 'save_grammar', grammar: payload })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menyimpan materi');

    showToast(json.message || 'Materi tata bahasa berhasil disimpan!', 'success');
    document.getElementById('modal-grammar').classList.add('hidden');
    await loadGrammar();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteGrammar(id, title) {
  if (!confirm(`Hapus materi "${title}" dari daftar tata bahasa?`)) return;

  try {
    const res = await fetch('/api/admin-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminState.passkey
      },
      body: JSON.stringify({ action: 'delete_grammar', id })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus');

    showToast('Materi tata bahasa berhasil dihapus.', 'success');
    adminState.grammar = adminState.grammar.filter(g => g.id !== id);
    renderGrammarList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ==============================================================================
// 8. SUPER ADMIN SETTINGS (SUPABASE SWITCHER & GEMINI AI)
// ==============================================================================
function setupSettingsHandlers() {
  const btnTestSupabase = document.getElementById('btn-test-supabase');
  const formSupabase = document.getElementById('form-supabase-config');
  const sbFeedback = document.getElementById('test-supabase-feedback');

  btnTestSupabase?.addEventListener('click', async () => {
    const url = document.getElementById('cfg-supabase-url').value.trim();
    const key = document.getElementById('cfg-supabase-anon').value.trim();
    if (!url || !key) {
      showToast('Masukkan URL dan Anon Key untuk melakukan pengujian!', 'warning');
      return;
    }

    btnTestSupabase.disabled = true;
    btnTestSupabase.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i> Menguji Koneksi...';
    sbFeedback.classList.remove('hidden', 'bg-emerald-50', 'bg-red-50', 'text-emerald-800', 'text-red-800');

    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminState.passkey
        },
        body: JSON.stringify({ action: 'test_supabase', url, key })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Koneksi gagal');

      sbFeedback.className = 'text-xs p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200';
      sbFeedback.innerHTML = `
        <i class="fa-solid fa-circle-check text-emerald-600 mr-1.5"></i>
        <strong>${json.message || 'Koneksi berhasil!'}</strong> Latensi respon: ${json.latencyMs || 0} ms. Total tempat: ${json.placesCount || 0}.
        ${json.warning ? `<p class="mt-1 text-amber-700">${json.warning}</p>` : ''}
      `;
      showToast('Koneksi ke Supabase berhasil teruji!', 'success');
    } catch (err) {
      sbFeedback.className = 'text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-200';
      sbFeedback.innerHTML = `<i class="fa-solid fa-circle-xmark text-red-600 mr-1.5"></i> ${err.message}`;
      showToast(err.message, 'error');
    } finally {
      btnTestSupabase.disabled = false;
      btnTestSupabase.innerHTML = '<i class="fa-solid fa-bolt text-xs"></i> Uji Koneksi Database Baru';
    }
  });

  formSupabase?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('cfg-supabase-url').value.trim();
    const anonKey = document.getElementById('cfg-supabase-anon').value.trim();
    const serviceRoleKey = document.getElementById('cfg-supabase-service').value.trim();

    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminState.passkey
        },
        body: JSON.stringify({ action: 'save_supabase', url, anonKey, serviceRoleKey })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan');

      showToast(json.message || 'Database Supabase berhasil diperbarui!', 'success');
      await loadConfig();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // GEMINI CONFIG
  const btnTestGemini = document.getElementById('btn-test-gemini');
  const formGemini = document.getElementById('form-gemini-config');
  const geminiFeedback = document.getElementById('test-gemini-feedback');

  btnTestGemini?.addEventListener('click', async () => {
    const apiKey = document.getElementById('cfg-gemini-key').value.trim();
    const model = document.getElementById('cfg-gemini-model').value;
    if (!apiKey) {
      showToast('Masukkan API Key Gemini untuk menguji!', 'warning');
      return;
    }

    btnTestGemini.disabled = true;
    btnTestGemini.innerHTML = '<span class="inline-block animate-spin mr-1">◌</span> Menguji AI...';
    geminiFeedback.classList.remove('hidden', 'bg-purple-50', 'bg-red-50');

    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminState.passkey
        },
        body: JSON.stringify({ action: 'test_gemini', apiKey, model })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Pengujian AI gagal');

      geminiFeedback.className = 'text-xs p-3 rounded-xl bg-purple-50 text-purple-900 border border-purple-200';
      geminiFeedback.innerHTML = `
        <span class="text-purple-600 font-bold mr-1.5">✓</span>
        <strong>${json.message}</strong> Respon AI: <em>"${json.sampleReply}"</em>
      `;
      showToast('API Key Gemini valid dan siap digunakan!', 'success');
    } catch (err) {
      geminiFeedback.className = 'text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-200';
      geminiFeedback.innerHTML = `<span class="text-red-600 font-bold mr-1.5">✕</span> ${err.message}`;
      showToast(err.message, 'error');
    } finally {
      btnTestGemini.disabled = false;
      btnTestGemini.innerHTML = '<span class="mr-1">✦</span> Uji API Key Gemini';
    }
  });

  formGemini?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('cfg-gemini-key').value.trim();
    const model = document.getElementById('cfg-gemini-model').value;

    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminState.passkey
        },
        body: JSON.stringify({ action: 'save_gemini', apiKey, model })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan');

      showToast(json.message || 'Konfigurasi Gemini AI berhasil disimpan!', 'success');
      await loadConfig();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // OPENAI CONFIG
  const btnTestOpenAi = document.getElementById('btn-test-openai');
  const formOpenAi = document.getElementById('form-openai-config');
  const openAiFeedback = document.getElementById('test-openai-feedback');

  btnTestOpenAi?.addEventListener('click', async () => {
    const apiKey = document.getElementById('cfg-openai-key').value.trim();
    const model = document.getElementById('cfg-openai-model').value;
    if (!apiKey) {
      showToast('Masukkan API Key OpenAI untuk menguji!', 'warning');
      return;
    }

    btnTestOpenAi.disabled = true;
    btnTestOpenAi.innerHTML = '<span class="inline-block animate-spin mr-1">◌</span> Menguji OpenAI...';
    openAiFeedback.classList.remove('hidden', 'bg-emerald-50', 'bg-red-50');

    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminState.passkey
        },
        body: JSON.stringify({ action: 'test_openai', apiKey, model })
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Pengujian OpenAI gagal');

      openAiFeedback.className = 'text-xs p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200';
      openAiFeedback.innerHTML = `
        <span class="text-emerald-600 font-bold mr-1.5">✓</span>
        <strong>${json.message}</strong> Respon Model: <em>"${json.sampleReply}"</em>
      `;
      showToast('API Key OpenAI valid dan siap digunakan!', 'success');
    } catch (err) {
      openAiFeedback.className = 'text-xs p-3 rounded-xl bg-red-50 text-red-800 border border-red-200';
      openAiFeedback.innerHTML = `<span class="text-red-600 font-bold mr-1.5">✕</span> ${err.message}`;
      showToast(err.message, 'error');
    } finally {
      btnTestOpenAi.disabled = false;
      btnTestOpenAi.innerHTML = '<i class="fa-solid fa-bolt text-xs"></i> Uji API Key OpenAI';
    }
  });

  formOpenAi?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const apiKey = document.getElementById('cfg-openai-key').value.trim();
    const model = document.getElementById('cfg-openai-model').value;

    try {
      const res = await fetch('/api/admin-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminState.passkey
        },
        body: JSON.stringify({ action: 'save_openai', apiKey, model })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan');

      showToast(json.message || 'Konfigurasi OpenAI berhasil disimpan!', 'success');
      await loadConfig();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ==============================================================================
// 9. MODALS & TEMPLATES
// ==============================================================================
function setupModals() {
  document.getElementById('btn-create-culture')?.addEventListener('click', () => openCultureModal());
  document.getElementById('btn-create-word')?.addEventListener('click', () => openWordModal());
  document.getElementById('btn-create-grammar')?.addEventListener('click', () => openGrammarModal());
  document.getElementById('btn-add-grammar-example')?.addEventListener('click', () => addGrammarExampleRow());

  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('modal-culture').classList.add('hidden');
      document.getElementById('modal-dict').classList.add('hidden');
      document.getElementById('modal-grammar').classList.add('hidden');
    });
  });

  // Template majalah untuk artikel budaya
  document.getElementById('btn-insert-culture-template')?.addEventListener('click', () => {
    const md = document.getElementById('culture-form-markdown');
    md.value = `## Mengenal Kearifan & Sejarah

Tuliskan sejarah, latar belakang, dan filosofi sakral dari warisan budaya ini secara naratif dan memikat bagi pembaca.

### Makna Simbolis & Komponen
- **Unsur Pertama:** Filosofi penyusun dan simbol spiritual.
- **Unsur Kedua:** Kaitan erat dengan falsafah *Tri Hita Karana* (keharmonisan Tuhan, manusia, dan alam).

### Panduan Etika & Pantangan Pengunjung
1. **Busana Adat:** Pengunjung wajib mengenakan kain kamben dan selendang senteng.
2. **Tata Krama:** Dilarang berdiri lebih tinggi dari pemangku yang memimpin doa.
3. **Kesucian:** Hormati sesaji canang sari yang diletakkan di lantai.`;
  });

  // Filter input listeners dengan debouncing
  document.getElementById('filter-culture-search')?.addEventListener('input', debounce(() => {
    adminState.culturePage = 1;
    renderCultureList();
  }, 150));
  document.getElementById('filter-culture-category')?.addEventListener('change', () => {
    adminState.culturePage = 1;
    renderCultureList();
  });
  document.getElementById('filter-dict-search')?.addEventListener('input', debounce(() => {
    adminState.dictPage = 1;
    renderDictionaryTable();
  }, 150));
  document.getElementById('filter-dict-level')?.addEventListener('change', () => {
    adminState.dictPage = 1;
    renderDictionaryTable();
  });
  document.getElementById('filter-grammar-search')?.addEventListener('input', debounce(() => {
    adminState.grammarPage = 1;
    renderGrammarList();
  }, 150));
  document.getElementById('filter-grammar-category')?.addEventListener('change', () => {
    adminState.grammarPage = 1;
    renderGrammarList();
  });

  // Forms submit
  document.getElementById('form-culture-article')?.addEventListener('submit', handleCultureSubmit);
  document.getElementById('form-dict-word')?.addEventListener('submit', handleWordSubmit);
  document.getElementById('form-grammar-rule')?.addEventListener('submit', handleGrammarSubmit);
}

// ==============================================================================
// 10. BOOTSTRAPPER (STARTUP RINGAN & ASINKRON)
// ==============================================================================
async function loadAllData() {
  // Hanya memuat konfigurasi overview awal (0ms blocking)
  await loadConfig();
  // Pre-fetch artikel budaya di latar belakang setelah idle
  setTimeout(() => {
    if (!adminState.loadedTabs.has('culture')) {
      loadCultureArticles().then(() => adminState.loadedTabs.add('culture'));
    }
  }, 350);
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminGate();
  setupTabButtons();
  setupSettingsHandlers();
  setupModals();
});
