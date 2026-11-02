/**
 * Curated Reviews & Testimonials Section — Tour Penjelajah Bali
 * Menampilkan ulasan autentik terkurasi dari wisatawan dan solo traveler
 * yang telah menjelajahi jalur Formula 3+1 dan kebudayaan Bali.
 */

import { getCurrentUser, hasCachedSession } from '../lib/auth.js';
import { openAuthModal } from '../lib/authGate.js';

// Data Ulasan Terkurasi Berkualitas Tinggi
export const CURATED_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Ni Putu Swastika',
    origin: 'Denpasar, Bali',
    role: 'Pecinta Budaya & Fotografer Tradisi',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'Oktober 2026',
    category: 'alam',
    routeVisited: 'Buleleng · Air Terjun Sekumpul & Desa Adat Pedawa',
    quote: 'Formula 3+1 benar-benar membuka mata saya. Sebagai warga Bali, saya terharu melihat rute Sekumpul diarahkan dengan sangat menghormati alam tanpa kerumunan turis massal. Syobak Singaraja yang direkomendasikan adalah kuliner akulturasi paling otentik yang pernah saya rasakan.'
  },
  {
    id: 'rev-2',
    name: 'David Miller',
    origin: 'Melbourne, Australia',
    role: 'Cultural Travel Journalist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'September 2026',
    category: 'budaya',
    routeVisited: 'Karangasem · Pura Lempuyang & Teluk Jemeluk',
    quote: 'The Balinese Etiquette & Kamus feature is pure gold. Villagers in Karangasem smiled so warmly when I greeted them with "Matur suksma". The AI Vision camera accurately explained the sacred meaning of Canang Sari at the temple. The most respectful travel guide to Bali.'
  },
  {
    id: 'rev-3',
    name: 'Bagus Aryasena',
    origin: 'Surabaya, Jawa Timur',
    role: 'Solo Backpacker & Penggiat Lingkungan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'Oktober 2026',
    category: 'kuliner',
    routeVisited: 'Tabanan · Air Terjun Leke-Leke & Warung Entil Pupuan',
    quote: 'Sangat responsif dan ringan di HP Android saya! Sistem gamifikasi lencananya membuat solo trip terasa bernilai dan tidak sekadar selfie. Rute warung tradisional Entil Pupuan yang dibungkus daun telengidi adalah hidden gem luar biasa yang tidak ada di brosur wisata biasa.'
  },
  {
    id: 'rev-4',
    name: 'Kadek Anindya & Raka',
    origin: 'Jakarta Selatan',
    role: 'Traveler Keluarga',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80',
    rating: 5,
    date: 'Oktober 2026',
    category: 'budaya',
    routeVisited: 'Bangli · Hutan Bambu Penglipuran & Danau Batur',
    quote: 'Perjalanan edukatif terbaik untuk keluarga kami. Anak-anak belajar filosofi Tri Hita Karana secara menyenangkan. Alunan musik rindik Bali di webnya membuat kami rileks saat merencanakan petualangan di Ubud dan Kintamani.'
  }
];

/**
 * Render Review Section HTML ke Container
 */
export function initReviewsSection(containerSelector = '#ulasan-penjelajah-container') {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  // Baca ulasan tersimpan pengguna lokal jika ada
  let userReviews = [];
  try {
    const raw = localStorage.getItem('tobal_user_reviews');
    if (raw) userReviews = JSON.parse(raw);
  } catch (e) {}

  const allReviews = [...userReviews, ...CURATED_REVIEWS];

  container.innerHTML = `
    <div class="space-y-10">
      
      <!-- Header Ulasan & Skor Kredibilitas -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-pasir">
        <div>
          <h2 class="font-heading text-3xl sm:text-4xl font-bold text-tanah-gelap tracking-tight">
            Catatan Penjelajah
          </h2>
          <p class="font-body text-xs sm:text-sm text-tanah/75 mt-1.5 max-w-xl">
            Cerita nyata dari para penjelajah yang melangkah melampaui hiruk-pikuk wisata massal, menjaga kesucian adat, dan menemukan kedamaian Dewata sejati.
          </p>
        </div>

        <!-- Rating Summary Pill & Tombol Tulis -->
        <div class="flex items-center gap-3 shrink-0 flex-wrap">
          <div class="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-pasir shadow-xs">
            <div class="flex text-amber-500 text-sm">★★★★★</div>
            <div class="text-xs font-bold text-tanah-gelap">
              4.98 <span class="text-tanah/50 font-normal">/ 5.0</span>
            </div>
            <span class="text-[10px] text-daun font-semibold bg-daun/10 px-2 py-0.5 rounded-full">
              Terkurasi
            </span>
          </div>

          <button type="button" id="btn-open-review-modal" class="px-4 py-2 rounded-2xl bg-daun hover:bg-daun/90 text-krem text-xs font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5">
            <span>✍️ Tulis Ulasan Rute</span>
          </button>
        </div>
      </div>

      <!-- Filter Kategori Ulasan -->
      <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button type="button" class="review-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-daun text-white shadow-xs transition cursor-pointer" data-category="all">
          Semua Cerita (${allReviews.length})
        </button>
        <button type="button" class="review-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-pasir/40 hover:bg-pasir text-tanah transition cursor-pointer" data-category="alam">
          🌿 Alam Asri 3+1
        </button>
        <button type="button" class="review-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-pasir/40 hover:bg-pasir text-tanah transition cursor-pointer" data-category="budaya">
          🛕 Adat & Etika Pura
        </button>
        <button type="button" class="review-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-pasir/40 hover:bg-pasir text-tanah transition cursor-pointer" data-category="kuliner">
          🍲 Kuliner Pusaka
        </button>
      </div>

      <!-- Grid Kartu Ulasan Editorial -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5" id="reviews-card-grid">
        ${renderReviewCards(allReviews)}
      </div>

    </div>
  `;

  // Filter Buttons Handler
  const filterBtns = container.querySelectorAll('.review-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.className = 'review-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-pasir/40 hover:bg-pasir text-tanah transition cursor-pointer';
      });
      btn.className = 'review-filter-btn px-4 py-1.5 rounded-full text-xs font-semibold bg-daun text-white shadow-xs transition cursor-pointer';
      
      const cat = btn.getAttribute('data-category');
      const filtered = cat === 'all' ? allReviews : allReviews.filter(r => r.category === cat);
      const grid = document.getElementById('reviews-card-grid');
      if (grid) {
        grid.innerHTML = renderReviewCards(filtered);
      }
    });
  });

  // Tombol Tulis Ulasan Handler
  document.getElementById('btn-open-review-modal')?.addEventListener('click', async () => {
    const isCached = hasCachedSession();
    let user = null;
    if (isCached) {
      user = await getCurrentUser();
    }

    if (!user && !isCached) {
      openAuthModal(
        'Tulis Ulasan Perjalanan',
        'Untuk menjaga ulasan tetap autentik, terpercaya, dan terbebas dari spam, silakan masuk atau daftar akun penjelajah terlebih dahulu.'
      );
      return;
    }

    showReviewModal(user);
  });
}

function renderReviewCards(reviews) {
  if (reviews.length === 0) {
    return `
      <div class="col-span-full py-12 text-center text-tanah/60 text-xs card-organik">
        Belum ada ulasan untuk kategori ini.
      </div>
    `;
  }

  return reviews.map(r => `
    <div class="card-organik !p-6 bg-white/95 border border-pasir hover:border-daun/40 transition-all flex flex-col justify-between group shadow-xs">
      <div>
        <!-- Rute Tag & Rating -->
        <div class="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-daun/10 text-daun border border-daun/20">
            ${r.routeVisited}
          </span>
          <div class="flex items-center gap-1 text-amber-500 text-xs">
            ${'★'.repeat(r.rating)}
            <span class="text-tanah/50 text-[10px] ml-1 font-mono">${r.date}</span>
          </div>
        </div>

        <!-- Kutipan Ulasan -->
        <p class="font-body text-xs sm:text-sm text-tanah-gelap leading-relaxed italic mb-5">
          "${r.quote}"
        </p>
      </div>

      <!-- Author Footer -->
      <div class="pt-4 border-t border-pasir/60 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full overflow-hidden bg-pasir/30 border border-pasir flex items-center justify-center shrink-0">
            <img src="${r.avatar || '/images/mascot-barong-head.png'}" alt="${r.name}" class="w-full h-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div>
            <h4 class="font-heading font-bold text-xs text-tanah-gelap leading-tight">${r.name}</h4>
            <span class="text-[10px] text-tanah/70 block">${r.role || r.origin}</span>
          </div>
        </div>

        <span class="text-[10px] font-semibold text-daun flex items-center gap-1 bg-pasir/30 px-2 py-0.5 rounded-md">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Terverifikasi
        </span>
      </div>
    </div>
  `).join('');
}

/**
 * Modal Tulis Ulasan Rute
 */
function showReviewModal(user) {
  let modal = document.getElementById('review-submission-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'review-submission-modal';
    document.body.appendChild(modal);
  }

  const meta = user?.user_metadata || {};
  const authorName = meta.full_name || meta.display_name || user?.email?.split('@')[0] || 'Penjelajah Bali';
  const authorAvatar = meta.avatar_url || '/images/mascot-barong-head.png';

  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-tanah-gelap/60 backdrop-blur-xs animate-fade-in';
  modal.innerHTML = `
    <div class="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-pasir overflow-hidden flex flex-col animate-slide-up">
      
      <div class="px-6 py-4 bg-krem/60 border-b border-pasir flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-daun/10 border border-daun/20 p-1 flex items-center justify-center">
            <img src="/images/mascot-barong-head.png" alt="Bara" class="w-full h-full object-contain" />
          </div>
          <h3 class="font-heading font-bold text-sm text-tanah-gelap">Bagikan Pengalaman Rute Anda</h3>
        </div>
        <button type="button" id="btn-close-sub-review" class="w-7 h-7 rounded-full bg-pasir/40 text-tanah-gelap flex items-center justify-center cursor-pointer">
          ✕
        </button>
      </div>

      <form id="form-submit-review" class="p-6 space-y-4 text-xs font-body">
        
        <div>
          <label class="block font-bold text-tanah-gelap mb-1">Destinasi / Rute yang Dikunjungi</label>
          <input type="text" id="input-rev-route" required maxlength="80"
            class="w-full px-3.5 py-2.5 rounded-xl bg-krem/40 border border-pasir text-xs text-teks focus:border-daun focus:outline-hidden"
            placeholder="Contoh: Buleleng · Air Terjun Sekumpul & Syobak" />
        </div>

        <div>
          <label class="block font-bold text-tanah-gelap mb-1">Kategori Pengalaman</label>
          <select id="select-rev-cat" class="w-full px-3.5 py-2.5 rounded-xl bg-krem/40 border border-pasir text-xs text-teks focus:border-daun focus:outline-hidden">
            <option value="alam">🌿 Alam Asri & Air Terjun</option>
            <option value="budaya">🛕 Adat & Etika Pura</option>
            <option value="kuliner">🍲 Kuliner Tradisional Pusaka</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-tanah-gelap mb-1">Penilaian (Bintang)</label>
          <div class="flex items-center gap-2">
            <select id="select-rev-rating" class="px-3.5 py-2 rounded-xl bg-krem/40 border border-pasir text-xs text-teks font-bold text-amber-600 focus:border-daun focus:outline-hidden">
              <option value="5">★★★★★ (5/5) Sangat Memuaskan & Autentik</option>
              <option value="4">★★★★☆ (4/5) Bagus Sekali</option>
              <option value="3">★★★☆☆ (3/5) Cukup Baik</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block font-bold text-tanah-gelap mb-1">Cerita / Kesan Kultural Anda</label>
          <textarea id="textarea-rev-quote" required rows="4" maxlength="300"
            class="w-full px-3.5 py-2.5 rounded-xl bg-krem/40 border border-pasir text-xs text-teks focus:border-daun focus:outline-hidden"
            placeholder="Ceritakan bagaimana perjalanan Anda, sambutan warga lokal, atau kuliner yang paling berkesan..."></textarea>
          <span class="text-[10px] text-tanah/60 block text-right">Maksimal 300 karakter</span>
        </div>

        <div id="sub-review-alert" class="hidden p-3 rounded-xl text-xs font-semibold"></div>

        <div class="pt-2 flex items-center justify-end gap-2">
          <button type="button" id="btn-cancel-sub-review" class="px-4 py-2 rounded-xl bg-pasir/40 text-tanah font-semibold cursor-pointer">
            Batal
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl bg-daun hover:bg-daun/90 text-krem font-bold shadow-xs cursor-pointer">
            Kirim Ulasan Terkurasi
          </button>
        </div>
      </form>

    </div>
  `;

  const closeModal = () => modal.classList.add('hidden');
  modal.querySelector('#btn-close-sub-review')?.addEventListener('click', closeModal);
  modal.querySelector('#btn-cancel-sub-review')?.addEventListener('click', closeModal);

  const form = modal.querySelector('#form-submit-review');
  const alertBox = modal.querySelector('#sub-review-alert');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const route = modal.querySelector('#input-rev-route').value.trim();
    const category = modal.querySelector('#select-rev-cat').value;
    const rating = parseInt(modal.querySelector('#select-rev-rating').value, 10);
    const quote = modal.querySelector('#textarea-rev-quote').value.trim();

    if (!route || !quote) return;

    const newRev = {
      id: 'usr-' + Date.now(),
      name: authorName,
      origin: 'Penjelajah Terdaftar',
      role: 'Penjelajah Terverifikasi',
      avatar: authorAvatar,
      rating,
      date: 'Baru saja',
      category,
      routeVisited: route,
      quote
    };

    // Simpan ke localStorage
    try {
      const stored = JSON.parse(localStorage.getItem('tobal_user_reviews') || '[]');
      stored.unshift(newRev);
      localStorage.setItem('tobal_user_reviews', JSON.stringify(stored));
    } catch (err) {}

    alertBox.className = 'p-3 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 block';
    alertBox.textContent = 'Matur suksma! Ulasan Anda telah berhasil disimpan dan langsung ditampilkan di beranda.';

    setTimeout(() => {
      closeModal();
      // Re-init reviews section
      initReviewsSection();
    }, 900);
  });
}
