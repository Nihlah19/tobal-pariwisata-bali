/**
 * Petualangan Saya — Tour Penjelajah Bali
 * Jalur petualangan bergaya gamifikasi Duolingo.
 */
import '../styles/main.css';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { requireAuth, getUserProfile } from '../lib/auth.js';
import { supabase } from '../lib/supabaseClient.js';
import { getRelatedWordForPlace, TINGKAT_STYLE_MAP } from '../lib/dictionary.js';
import { getRelatedCultureForPlaceSync } from '../lib/culture.js';
import {
  showToast,
  showModal,
  progressBarHTML,
  emptyStateHTML,
  initEmptyStateIcon,
  skeletonCardsHTML
} from '../components/ui.js';
import {
  createElement,
  CheckCircle,
  MapPin,
  Utensils,
  Camera,
  Star,
  Award,
  Sparkles,
  Compass,
  ArrowRight,
  Info
} from 'lucide';

// Lindungi halaman
const session = await requireAuth();
if (!session) {
  // redirect otomatis oleh requireAuth
}

renderNavbar('#navbar');
renderFooter('#footer');

const userId = session.user.id;
const headerArea = document.getElementById('trip-header-area');
const contentArea = document.getElementById('trip-content-area');
const reviewModalContainer = document.getElementById('review-modal-container');
const celebrationModalContainer = document.getElementById('celebration-modal-container');

// State aplikasi
let activeTrip = null;
let tripItems = [];

// Muat data awal
await loadTripData();

// Jika ada parameter ?new=true dari onboarding, picu buat petualangan baru secara otomatis
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('new') === 'true' && !activeTrip) {
  await createNewAdventure();
}

/**
 * Memuat paket petualangan aktif milik pengguna dari database.
 */
async function loadTripData() {
  renderLoadingState();

  try {
    // 1. Cari trip aktif
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'aktif')
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (tripErr) throw tripErr;

    if (!trip) {
      activeTrip = null;
      tripItems = [];
      renderEmptyTripState();
      return;
    }

    activeTrip = trip;

    // 2. Ambil detail trip_items beserta informasi places
    const { data: items, error: itemsErr } = await supabase
      .from('trip_items')
      .select(`
        id,
        position,
        completed,
        completed_at,
        places (
          id,
          name,
          type,
          category,
          tags,
          region,
          price_level,
          popularity,
          is_viral,
          description,
          cultural_note,
          image_url,
          lat,
          lng
        )
      `)
      .eq('trip_id', activeTrip.id)
      .order('position', { ascending: true });

    if (itemsErr) throw itemsErr;

    tripItems = items || [];
    renderActiveTrip();

  } catch (err) {
    console.error('[Petualangan Load Error]:', err);
    renderErrorState('Gagal memuat petualangan Anda. Silakan muat ulang halaman.');
  }
}

/**
 * Render Header Petualangan & Progress Bar
 */
function renderTripHeader() {
  if (!activeTrip || tripItems.length === 0) {
    headerArea.innerHTML = '';
    return;
  }

  const completedCount = tripItems.filter(i => i.completed).length;
  const totalCount = tripItems.length || 4;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  headerArea.innerHTML = `
    <div class="card-organik !p-6 sm:!p-8 mb-6 bg-gradient-to-br from-white/95 to-pasir/20">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="badge-daun">Paket Aktif</span>
            <span class="text-xs text-tanah/60 font-body">Dibuat ${new Date(activeTrip.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap">
            Jalur Penjelajah Pulau Dewata
          </h1>
          <p class="font-body text-sm text-tanah/70 mt-0.5">
            Selesaikan 3 destinasi dan 1 santapan khas untuk meraih Lencana Eksklusif!
          </p>
        </div>
        <div class="shrink-0 flex items-center gap-2">
          <button id="btn-refresh-adventure" class="btn-sekunder text-xs sm:text-sm !py-2.5 !px-4">
            <span id="btn-refresh-icon"></span>
            Ganti Paket
          </button>
        </div>
      </div>

      <!-- Progress Section -->
      <div class="mt-4 pt-4 border-t border-pasir/40">
        <div class="flex justify-between items-center text-sm font-body mb-2">
          <span class="font-semibold text-daun flex items-center gap-1.5">
            <span class="inline-block w-2.5 h-2.5 rounded-full ${completedCount === totalCount ? 'bg-daun' : 'bg-padi animate-pulse'}"></span>
            Progres Petualangan
          </span>
          <span class="font-bold text-tanah-gelap">${completedCount} dari ${totalCount} Selesai (${progressPercent}%)</span>
        </div>
        ${progressBarHTML(progressPercent, 'Progres paket')}
      </div>
    </div>
  `;

  // Pasang ikon tombol
  const refreshIcon = document.getElementById('btn-refresh-icon');
  if (refreshIcon) {
    const svg = createElement(Compass);
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    refreshIcon.appendChild(svg);
  }

  // Listener ganti paket
  document.getElementById('btn-refresh-adventure')?.addEventListener('click', () => {
    showModal({
      title: 'Mulai Petualangan Baru?',
      body: `
        <p class="mb-2">Paket aktif Anda saat ini akan dihentikan dan digantikan dengan paket petualangan baru dari AI.</p>
        <p class="text-xs text-tanah/60">Destinasi yang belum selesai tetap tersimpan di riwayat.</p>
      `,
      confirmText: 'Ya, Buat Baru',
      cancelText: 'Tetap di Sini',
      onConfirm: async () => {
        await createNewAdventure();
      }
    });
  });
}

/**
 * Render Jalur Petualangan ala Duolingo (Path Style)
 */
function renderActiveTrip() {
  renderTripHeader();

  contentArea.innerHTML = `
    <div class="relative py-4 pl-4 sm:pl-8">
      
      <!-- Garis Jalur Setapak Terhubung -->
      <div class="path-connector"></div>

      <!-- Daftar 4 Destinasi / Checkpoint -->
      <div class="space-y-10 relative z-10" id="checkpoints-list">
        ${tripItems.map((item, idx) => renderCheckpointCard(item, idx)).join('')}
      </div>

    </div>
  `;

  // Pasang event listener tombol 'Selesai Jelajah'
  tripItems.forEach(item => {
    const btn = document.getElementById(`btn-finish-${item.id}`);
    if (btn && !item.completed) {
      btn.addEventListener('click', () => openReviewModal(item));
    }
  });
}

/**
 * Render satu kartu destinasi di jalur belajar
 */
function renderCheckpointCard(item, index) {
  const place = item.places;
  if (!place) return '';

  const isCompleted = item.completed;
  const isKuliner = place.type === 'kuliner';
  const position = item.position || (index + 1);

  // Status tampilan node
  const nodeIcon = isCompleted
    ? '<i class="fa-solid fa-check"></i>'
    : (isKuliner ? '<i class="fa-solid fa-utensils text-base"></i>' : position);

  const nodeColorClass = isCompleted
    ? 'bg-daun text-krem border-daun ring-4 ring-daun/20 shadow-md'
    : 'bg-white text-tanah-gelap border-2 border-lumut shadow-md';

  const defaultImg = isKuliner
    ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80';

  const relatedWord = getRelatedWordForPlace(place);
  const tingkatStyle = TINGKAT_STYLE_MAP[relatedWord.tingkat] || TINGKAT_STYLE_MAP['umum'];
  const relatedCulture = getRelatedCultureForPlaceSync(place);

  return `
    <div class="flex items-start gap-4 sm:gap-6 animate-slide-up" style="animation-delay: ${index * 0.1}s">
      
      <!-- Node Checkpoint Bulat Ala Duolingo -->
      <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-heading font-bold text-lg sm:text-xl shrink-0 transition-all duration-300 ${nodeColorClass}">
        ${nodeIcon}
      </div>

      <!-- Kartu Konten Destinasi -->
      <div class="flex-1 card-organik !p-5 sm:!p-6 transition-all duration-300 ${isCompleted ? '!bg-white/60 border-daun/30' : 'hover:border-daun/50'}">
        
        <div class="flex flex-col md:flex-row gap-5">
          <!-- Foto Destinasi -->
          <div class="md:w-5/12 shrink-0">
            <div class="relative overflow-hidden rounded-2xl h-44 sm:h-48 w-full group">
              <img src="${place.image_url || defaultImg}"
                alt="${place.name}"
                loading="lazy"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onerror="this.onerror=null; this.src='${defaultImg}';" />
              <div class="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                <span class="${isKuliner ? 'badge-padi' : 'badge-daun'} text-xs font-semibold shadow-sm">
                  ${isKuliner ? 'Kuliner Pilihan' : `Tujuan ${position}`}
                </span>
                ${!place.is_viral ? '<span class="badge-laut text-xs font-semibold shadow-sm">Hidden Gem</span>' : ''}
              </div>
              <div class="absolute bottom-2.5 right-2.5">
                <span class="badge bg-tanah-gelap/80 backdrop-blur-sm text-krem text-xs">
                  ${place.region}
                </span>
              </div>
            </div>
          </div>

          <!-- Keterangan Destinasi -->
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 class="font-heading text-xl sm:text-2xl font-bold text-tanah-gelap leading-snug">
                    ${place.name}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="badge-tanah text-xs">${place.category}</span>
                    <span class="text-xs text-tanah/70 font-body flex items-center gap-1">
                      <span>Anggaran:</span>
                      <span class="inline-flex text-amber-600 gap-0.5">${'<i class="fa-solid fa-coins text-[10px]"></i>'.repeat(place.price_level || 1)}</span>
                    </span>
                  </div>
                </div>
              </div>

              <p class="font-body text-sm text-tanah/80 leading-relaxed mb-3">
                ${place.description || 'Destinasi autentik di Bali yang sarat keindahan dan nilai tradisi.'}
              </p>

              <!-- Catatan Kearifan Budaya -->
              ${place.cultural_note ? `
                <div class="bg-pasir/40 rounded-2xl p-3 border border-pasir text-xs font-body text-tanah-gelap/90 mb-3 flex items-start gap-2.5">
                  <span class="text-amber-600 shrink-0 mt-0.5"><i class="fa-solid fa-lightbulb"></i></span>
                  <div>
                    <strong class="font-semibold text-tanah">Kearifan Lokal:</strong>
                    <span class="italic">${place.cultural_note}</span>
                  </div>
                </div>
              ` : ''}

              <!-- Kosakata Bahasa Bali Terkait Destinasi -->
              <div class="bg-daun/5 rounded-2xl p-3 border border-daun/20 text-xs font-body text-tanah-gelap mb-3 flex items-start gap-2.5">
                <span class="text-daun shrink-0 mt-0.5"><i class="fa-solid fa-book-open"></i></span>
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <strong class="font-heading text-sm font-bold text-daun-gelap">${relatedWord.kata}</strong>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tingkatStyle.badgeClass}">
                      ${tingkatStyle.short}
                    </span>
                    <span class="text-[10px] font-mono text-tanah/60">${relatedWord.kelas_kata}</span>
                  </div>
                  <p class="text-tanah text-xs mt-0.5 leading-snug">
                    ${relatedWord.arti_indonesia}
                  </p>
                  <a href="/src/pages/kamus.html?kata=${encodeURIComponent(relatedWord.kata)}" class="inline-flex items-center gap-1 text-[11px] font-semibold text-daun hover:text-daun-gelap hover:underline mt-1">
                    Buka di Kamus Bahasa Bali →
                  </a>
                </div>
              </div>

              <!-- Tautan Kenali Budayanya (Ensiklopedia Budaya) -->
              ${relatedCulture ? `
                <div class="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/60 text-xs font-body text-amber-950 mb-3 flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 truncate">
                    <span class="text-amber-800 shrink-0"><i class="fa-solid fa-landmark"></i></span>
                    <span class="truncate">
                      <strong class="font-semibold text-amber-900">Kenali budayanya:</strong>
                      <span class="text-tanah-gelap ml-1">${relatedCulture.judul}</span>
                    </span>
                  </div>
                  <a
                    href="/src/pages/budaya.html?slug=${encodeURIComponent(relatedCulture.slug)}"
                    class="shrink-0 inline-flex items-center gap-1 font-semibold text-daun hover:text-daun-gelap hover:underline"
                    title="Baca artikel budaya tentang ${relatedCulture.judul}"
                  >
                    <span>Baca</span>
                    <span>→</span>
                  </a>
                </div>
              ` : ''}
            </div>

            <!-- Bagian Aksi / Status Selesai -->
            <div class="pt-3 border-t border-pasir/40 flex items-center justify-between">
              <div>
                ${isCompleted
                  ? `<span class="inline-flex items-center gap-1.5 text-sm font-semibold text-daun">
                       <span>✓</span> Selesai Dijelajahi
                     </span>`
                  : `<span class="text-xs text-tanah/60 font-body">Kunjungi & catat ulasan Anda</span>`
                }
              </div>

              ${!isCompleted ? `
                <button id="btn-finish-${item.id}"
                  class="btn-primer text-xs sm:text-sm !py-2.5 !px-5 shadow-sm">
                  Selesai Jelajah
                </button>
              ` : `
                <span class="text-xs text-tanah/50 font-body">
                  ${item.completed_at ? new Date(item.completed_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                </span>
              `}
            </div>

          </div>
        </div>

      </div>

    </div>
  `;
}

/**
 * Membuka Modal Review saat pengguna menandai destinasi 'Selesai Jelajah'.
 */
function openReviewModal(item) {
  const place = item.places;
  let selectedRating = 5;

  reviewModalContainer.innerHTML = `
    <div class="modal-overlay" id="modal-review-overlay">
      <div class="modal-content !max-w-md">
        
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-heading text-xl font-bold text-tanah-gelap">
            Tandai Selesai Jelajah
          </h3>
          <button id="btn-close-review" class="btn-ghost p-1 text-tanah/60 hover:text-tanah">✕</button>
        </div>

        <p class="font-body text-sm text-tanah/80 mb-4">
          Bagaimana pengalaman Anda saat menjelajahi <strong>${place.name}</strong>?
        </p>

        <!-- Rating Bintang Interaktif -->
        <div class="mb-5 text-center bg-pasir/30 py-3.5 rounded-2xl border border-pasir/50">
          <label class="block text-xs font-semibold text-tanah-gelap mb-2 uppercase tracking-wider font-body">
            Beri Penilaian
          </label>
          <div class="flex justify-center gap-2" id="star-rating-container">
            ${[1, 2, 3, 4, 5].map(val => `
              <button type="button" data-val="${val}" class="star-btn text-3xl transition-transform hover:scale-125 focus:outline-none text-padi">
                ★
              </button>
            `).join('')}
          </div>
          <span class="block text-xs text-tanah/70 mt-1 font-body" id="rating-label">Sangat Mengesankan (5/5)</span>
        </div>

        <!-- Textarea Ulasan -->
        <div class="mb-6">
          <label class="block font-body text-xs font-semibold text-tanah-gelap mb-1.5 uppercase tracking-wider">
            Catatan / Ulasan Singkat (Opsional)
          </label>
          <textarea id="review-comment" rows="3"
            placeholder="Ceritakan keunikan tempat, keramahan warga, atau tips bagi penjelajah berikutnya..."
            class="w-full px-3.5 py-2.5 rounded-2xl border border-pasir bg-white font-body text-sm text-teks focus:outline-none focus:ring-2 focus:ring-daun/30 focus:border-daun"></textarea>
        </div>

        <!-- Tombol Aksi -->
        <div class="flex flex-col sm:flex-row gap-2 justify-end">
          <button type="button" id="btn-skip-review" class="btn-sekunder text-xs sm:text-sm !py-2.5">
            Lewati Ulasan
          </button>
          <button type="button" id="btn-submit-review" class="btn-primer text-xs sm:text-sm !py-2.5">
            <span id="review-spinner" class="hidden inline-block animate-spin mr-1">◌</span>
            Simpan & Tandai Selesai
          </button>
        </div>

      </div>
    </div>
  `;

  // Interaksi Bintang
  const ratingLabels = [
    '',
    'Kurang Memuaskan (1/5)',
    'Cukup Baik (2/5)',
    'Menarik (3/5)',
    'Sangat Bagus (4/5)',
    'Sangat Mengesankan (5/5)'
  ];
  const starBtns = reviewModalContainer.querySelectorAll('.star-btn');
  const ratingLabel = document.getElementById('rating-label');

  function updateStars(val) {
    selectedRating = val;
    starBtns.forEach(btn => {
      const bVal = parseInt(btn.getAttribute('data-val'));
      btn.className = `star-btn text-3xl transition-transform hover:scale-125 focus:outline-none ${bVal <= val ? 'text-padi' : 'text-pasir'}`;
    });
    ratingLabel.textContent = ratingLabels[val] || '';
  }

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      updateStars(parseInt(btn.getAttribute('data-val')));
    });
  });

  const closeReviewModal = () => {
    reviewModalContainer.innerHTML = '';
  };

  document.getElementById('btn-close-review')?.addEventListener('click', closeReviewModal);

  // Simpan tanpa ulasan
  document.getElementById('btn-skip-review')?.addEventListener('click', async () => {
    await markItemCompleted(item, null, null);
    closeReviewModal();
  });

  // Simpan beserta ulasan
  document.getElementById('btn-submit-review')?.addEventListener('click', async () => {
    const comment = document.getElementById('review-comment')?.value?.trim() || null;
    document.getElementById('review-spinner')?.classList.remove('hidden');
    await markItemCompleted(item, selectedRating, comment);
    closeReviewModal();
  });
}

/**
 * Tandai destinasi selesai dan simpan ulasan jika ada.
 * Mengutamakan fungsi database atomic `complete_trip_item` (server-side RLS & badge check).
 */
async function markItemCompleted(item, rating, comment) {
  try {
    const nowIso = new Date().toISOString();

    // 1. Coba panggil Database Function complete_trip_item (Atomic & Server-Side Security)
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('complete_trip_item', {
      p_trip_item_id: item.id,
      p_rating: rating || null,
      p_comment: comment || null
    });

    if (!rpcErr && rpcResult?.success) {
      // Pemanggilan server function berhasil!
      item.completed = true;
      item.completed_at = nowIso;
      renderActiveTrip();
      showToast(`"${item.places.name}" berhasil ditandai selesai! 🎉`, 'sukses');

      if (rpcResult.all_completed) {
        showCelebrationModal(rpcResult.newly_awarded_badges);
      }
      return;
    }

    // 2. Fallback aman jika RPC belum di-execute di Supabase SQL Editor:
    // Tetap patuh pada RLS database dan jalankan validasi aturan badge
    const { error: itemErr } = await supabase
      .from('trip_items')
      .update({
        completed: true,
        completed_at: nowIso
      })
      .eq('id', item.id);

    if (itemErr) throw itemErr;

    // Simpan ulasan jika ada rating
    if (rating) {
      await supabase
        .from('reviews')
        .upsert({
          user_id: userId,
          place_id: item.places.id,
          rating: rating,
          comment: comment,
          created_at: nowIso
        }, { onConflict: 'user_id,place_id' });
    }

    // Perbarui state lokal
    item.completed = true;
    item.completed_at = nowIso;
    renderActiveTrip();
    showToast(`"${item.places.name}" berhasil ditandai selesai! 🎉`, 'sukses');

    // Cek apakah seluruh 4/4 tempat dalam trip telah selesai
    const allCompleted = tripItems.every(i => i.completed);
    if (allCompleted) {
      await handleTripCompletionFallback();
    }

  } catch (err) {
    console.error('[Mark Completed Error]:', err);
    showToast('Gagal menandai destinasi: ' + (err.message || 'Coba lagi nanti'), 'error');
  }
}

/**
 * Fallback penanganan penyelesaian trip 4/4:
 * Menerapkan ketiga aturan badge secara ketat dan mencegah badge ganda.
 */
async function handleTripCompletionFallback() {
  try {
    const nowIso = new Date().toISOString();
    const newlyEarnedBadges = [];

    // A. Tandai trip aktif menjadi 'selesai'
    await supabase
      .from('trips')
      .update({
        status: 'selesai',
        completed_at: nowIso
      })
      .eq('id', activeTrip.id);

    // Ambil seluruh master data lencana
    const { data: allBadges } = await supabase.from('badges').select('*');
    const badgeMap = new Map((allBadges || []).map(b => [b.code, b]));

    // Ambil lencana yang sudah dimiliki user (untuk cegah badge ganda)
    const { data: existingUserBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const ownedBadgeIds = new Set((existingUserBadges || []).map(ub => ub.badge_id));

    // ATURAN 1: 'Penjelajah Pemula' (saat paket pertama selesai)
    const pemulaBadge = badgeMap.get('penjelajah-pemula');
    if (pemulaBadge && !ownedBadgeIds.has(pemulaBadge.id)) {
      const { error: insErr } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: pemulaBadge.id,
        trip_id: activeTrip.id,
        earned_at: nowIso
      });
      if (!insErr) {
        newlyEarnedBadges.push(pemulaBadge);
        ownedBadgeIds.add(pemulaBadge.id);
      }
    }

    // ATURAN 2: 'Penjelajah Utara' (jika paket berisi minimal 1 tempat di Buleleng, Karangasem, atau Jembrana)
    const northRegions = ['Buleleng', 'Karangasem', 'Jembrana'];
    const hasNorth = tripItems.some(i => northRegions.includes(i.places?.region));
    const utaraBadge = badgeMap.get('penjelajah-utara');
    if (hasNorth && utaraBadge && !ownedBadgeIds.has(utaraBadge.id)) {
      const { error: insErr } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: utaraBadge.id,
        trip_id: activeTrip.id,
        earned_at: nowIso
      });
      if (!insErr) {
        newlyEarnedBadges.push(utaraBadge);
        ownedBadgeIds.add(utaraBadge.id);
      }
    }

    // ATURAN 3: 'Pencari Budaya' (jika minimal 2 tempat berkategori budaya diselesaikan)
    const cultureCount = tripItems.filter(i => i.places?.category === 'budaya').length;
    const budayaBadge = badgeMap.get('pencari-budaya');
    if (cultureCount >= 2 && budayaBadge && !ownedBadgeIds.has(budayaBadge.id)) {
      const { error: insErr } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: budayaBadge.id,
        trip_id: activeTrip.id,
        earned_at: nowIso
      });
      if (!insErr) {
        newlyEarnedBadges.push(budayaBadge);
        ownedBadgeIds.add(budayaBadge.id);
      }
    }

    // Tampilkan Modal Perayaan
    showCelebrationModal(newlyEarnedBadges);

  } catch (err) {
    console.error('[Trip Completion Fallback Error]:', err);
  }
}

/**
 * Tampilkan Modal Perayaan Selesai Petualangan
 * Mendukung multiple badges yang baru terbuka sekaligus.
 */
function showCelebrationModal(awardedBadges) {
  const badgesList = Array.isArray(awardedBadges) ? awardedBadges : (awardedBadges ? [awardedBadges] : []);

  celebrationModalContainer.innerHTML = `
    <div class="modal-overlay" id="celebration-overlay">
      <div class="modal-content !max-w-lg text-center !p-6 sm:!p-8 animate-slide-up">
        
        <div class="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-sm border border-amber-200">
          <i class="fa-solid fa-trophy text-3xl"></i>
        </div>

        <span class="badge-padi text-xs uppercase tracking-wider font-semibold mb-2 inline-flex">
          Paket Petualangan Tuntas!
        </span>

        <h2 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap mb-2">
          Selamat, Penjelajah Sejati!
        </h2>

        <p class="font-body text-xs sm:text-sm text-tanah/80 mb-5 leading-relaxed">
          Anda telah menuntaskan seluruh 4 destinasi di paket ini dan turut
          meratakan kunjungan serta melestarikan kearifan lokal Bali.
        </p>

        <!-- Daftar Lencana yang Baru Diperoleh -->
        ${badgesList.length > 0 ? `
          <div class="space-y-3 mb-6 max-h-56 overflow-y-auto pr-1">
            ${badgesList.map(b => `
              <div class="bg-gradient-to-br from-pasir/40 to-padi/10 p-4 rounded-2xl border border-padi/40 flex items-center gap-3.5 text-left shadow-sm">
                <img src="${b.icon_url || '/badges/pemula.svg'}"
                  alt="${b.name}"
                  class="w-14 h-14 shrink-0 drop-shadow-md" />
                <div>
                  <span class="text-[11px] font-semibold text-daun uppercase font-body tracking-wider">Lencana Baru Terbuka</span>
                  <h4 class="font-heading text-base font-bold text-tanah-gelap">${b.name}</h4>
                  <p class="font-body text-xs text-tanah/70 mt-0.5">${b.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="bg-pasir/30 p-4 rounded-2xl border border-pasir mb-6 text-xs text-tanah/70 font-body">
            Seluruh lencana petualangan untuk kategori ini telah berada di koleksi Anda!
          </div>
        `}

        <!-- Tombol Aksi -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/src/pages/lencana.html" class="btn-sekunder text-xs sm:text-sm !py-3">
            Lihat Koleksi Lencana
          </a>
          <button id="btn-next-adventure" class="btn-primer text-xs sm:text-sm !py-3">
            Buat Petualangan Baru
          </button>
        </div>

      </div>
    </div>
  `;

  document.getElementById('btn-next-adventure')?.addEventListener('click', async () => {
    celebrationModalContainer.innerHTML = '';
    await createNewAdventure();
  });
}


/**
 * Panggil API Rekomendasi (/api/recommend) untuk menghasilkan paket baru.
 */
async function createNewAdventure() {
  headerArea.innerHTML = '';
  renderLoadingState('AI sedang menyusun paket petualangan khusus untuk Anda...');

  try {
    const session = await requireAuth();
    if (!session) return;

    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Gagal memanggil sistem rekomendasi');
    }

    showToast('Paket petualangan baru berhasil dibuat! Selamat menjelajah.', 'sukses');

    // Muat ulang data petualangan aktif
    await loadTripData();

  } catch (err) {
    console.error('[Create Adventure Error]:', err);
    showToast('Gagal membuat petualangan baru: ' + (err.message || 'Coba lagi'), 'error');
    renderEmptyTripState();
  }
}

/**
 * Render State Kosong (Belum Ada Trip Aktif)
 */
function renderEmptyTripState() {
  headerArea.innerHTML = '';
  contentArea.innerHTML = `
    <div class="card-organik text-center !py-12 !px-6 animate-fade-in max-w-xl mx-auto my-8">
      <div class="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-200 to-daun/20 border-2 border-terakota/30 p-1 flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-md animate-float-bara">
        <img src="/images/mascot-barong.png" alt="Bara Si Barong" class="w-full h-full object-contain filter drop-shadow">
      </div>
      <span class="badge-padi text-xs py-0.5 px-3 mb-2 inline-flex items-center gap-1.5">
        <i class="fa-solid fa-compass text-xs"></i>
        <span>Bara Siap Memandu</span>
      </span>
      <h2 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap mb-3">
        Belum Ada Petualangan Aktif
      </h2>
      <p class="font-body text-sm sm:text-base text-tanah/70 max-w-md mx-auto mb-8 leading-relaxed">
        Bara dan AI Penjelajah Bali siap meracik 1 paket petualangan personal berisi 3 destinasi tersembunyi non-viral dan 1 kuliner legendaris khas Bali.
      </p>
      <button id="btn-create-first-trip" class="btn-primer text-base !py-3.5 !px-8 flex items-center justify-center gap-2 mx-auto">
        <i class="fa-solid fa-wand-magic-sparkles text-krem"></i>
        <span>Buat Petualangan 3+1 Sekarang</span>
      </button>
    </div>
  `;

  document.getElementById('btn-create-first-trip')?.addEventListener('click', async () => {
    await createNewAdventure();
  });
}

function renderLoadingState(message = 'Memuat petualangan Anda...') {
  contentArea.innerHTML = `
    <div class="text-center py-12">
      <div class="w-12 h-12 border-4 border-daun/20 border-t-daun rounded-full animate-spin mx-auto mb-4"></div>
      <p class="font-body text-sm text-tanah/70">${message}</p>
      <div class="max-w-2xl mx-auto mt-8">
        ${skeletonCardsHTML(2)}
      </div>
    </div>
  `;
}

function renderErrorState(message) {
  headerArea.innerHTML = '';
  contentArea.innerHTML = `
    <div class="card-organik text-center !py-12 !px-6 max-w-md mx-auto my-8">
      <div class="text-4xl mb-3">⚠️</div>
      <h3 class="font-heading text-xl font-bold text-tanah-gelap mb-2">Terjadi Kesalahan</h3>
      <p class="font-body text-sm text-tanah/70 mb-6">${message}</p>
      <button onclick="window.location.reload()" class="btn-sekunder text-sm">
        Coba Muat Ulang
      </button>
    </div>
  `;
}
