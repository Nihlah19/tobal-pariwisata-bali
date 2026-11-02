/**
 * Lencana — Tour Penjelajah Bali
 * Menampilkan koleksi lencana pencapaian (terbuka vs terkunci).
 */
import '../styles/main.css';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { requireAuth, getUserProfile, getCurrentUser } from '../lib/auth.js';
import { supabase } from '../lib/supabaseClient.js';
import { progressBarHTML, skeletonCardsHTML } from '../components/ui.js';
import { openProfileEditModal } from '../components/profileEditModal.js';

// Lindungi halaman
const session = await requireAuth();
if (!session) {
  // redirect otomatis
}

renderNavbar('#navbar');
renderFooter('#footer');

const userId = session.user.id;
const headerArea = document.getElementById('badge-header-area');
const gridArea = document.getElementById('badge-grid-area');

// Fallback ikon lencana jika belum ada di database
const DEFAULT_BADGE_ICONS = {
  'penjelajah-pemula': '/badges/pemula.svg',
  'penjelajah-utara': '/badges/utara.svg',
  'pencari-budaya': '/badges/budaya.svg'
};

await loadBadges();

async function loadBadges() {
  gridArea.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${skeletonCardsHTML(3)}
    </div>
  `;

  try {
    const user = await getCurrentUser() || session.user;
    const profile = await getUserProfile(userId);
    const meta = user.user_metadata || {};
    const displayName = profile?.display_name || meta.full_name || user.email?.split('@')[0] || 'Penjelajah Dewata';
    const avatarUrl = profile?.avatar_url || meta.avatar_url || '/images/mascot-barong-head.png';
    const bioText = profile?.bio || meta.bio || 'Penjelajah budaya dan pencinta alam asri Pulau Dewata.';
    const prefRegion = profile?.preferred_region || meta.preferred_region || 'Buleleng (Bali Utara)';

    // 1. Ambil seluruh master data lencana
    const { data: allBadges, error: bErr } = await supabase
      .from('badges')
      .select('*')
      .order('created_at', { ascending: true });

    if (bErr) throw bErr;

    // 2. Ambil lencana yang sudah diperoleh pengguna
    const { data: userBadges, error: ubErr } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);

    if (ubErr) throw ubErr;

    const earnedMap = new Map();
    (userBadges || []).forEach(ub => {
      earnedMap.set(ub.badge_id, ub);
    });

    const totalBadges = allBadges?.length || 3;
    const earnedCount = earnedMap.size;
    const progressPercent = Math.round((earnedCount / totalBadges) * 100);

    // Render Profil & Header Lencana
    headerArea.innerHTML = `
      <!-- Kartu Profil Penjelajah -->
      <div class="card-organik !p-6 mb-6 bg-white border border-pasir shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-daun/10 via-krem to-amber-100 p-1 border-2 border-daun/30 overflow-hidden shrink-0 shadow-xs">
            <img src="${avatarUrl}" alt="${displayName}" class="w-full h-full object-contain filter drop-shadow-xs" />
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-heading text-lg sm:text-xl font-bold text-tanah-gelap">${displayName}</h2>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-daun/10 text-daun border border-daun/20 inline-flex items-center gap-1">
                <i class="fa-solid fa-location-dot text-[9px]"></i>
                <span>${prefRegion}</span>
              </span>
            </div>
            <p class="text-xs text-tanah/70 font-body mt-0.5 max-w-md">${bioText}</p>
            <span class="text-[11px] text-tanah/50 font-mono mt-1 block">${user.email}</span>
          </div>
        </div>

        <button type="button" id="btn-edit-my-profile" class="shrink-0 px-4 py-2 rounded-2xl bg-pasir/40 hover:bg-daun hover:text-white text-tanah-gelap text-xs font-semibold border border-pasir transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs">
          <i class="fa-solid fa-pen-to-square text-xs"></i>
          <span>Sunting Profil</span>
        </button>
      </div>

      <!-- Kartu Statistik Lencana -->
      <div class="card-organik !p-6 sm:!p-8 bg-gradient-to-br from-white/95 to-padi/10">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span class="badge-padi mb-1 inline-flex">Galeri Prestasi</span>
            <h1 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap">
              Lencana Petualang Dewata
            </h1>
            <p class="font-body text-sm text-tanah/70 mt-1">
              Setiap paket petualangan yang Anda selesaikan membuka apresiasi atas kelestarian budaya Bali.
            </p>
          </div>
          <div class="shrink-0 text-left sm:text-right">
            <span class="font-heading text-3xl sm:text-4xl font-bold text-padi">${earnedCount}</span>
            <span class="text-sm font-body text-tanah/60"> / ${totalBadges} Terbuka</span>
          </div>
        </div>

        <div class="pt-4 border-t border-pasir/40">
          <div class="flex justify-between items-center text-xs sm:text-sm font-body mb-2">
            <span class="font-medium text-tanah">Koleksi Lencana Diraih</span>
            <span class="font-bold text-daun">${progressPercent}%</span>
          </div>
          ${progressBarHTML(progressPercent, 'Progres Lencana')}
        </div>
      </div>
    `;

    document.getElementById('btn-edit-my-profile')?.addEventListener('click', () => {
      openProfileEditModal(() => loadBadges());
    });

    // Render Grid Lencana
    if (!allBadges || allBadges.length === 0) {
      gridArea.innerHTML = `
        <div class="card-organik text-center py-12">
          <p class="font-body text-tanah/70">Belum ada lencana yang tersedia di sistem saat ini.</p>
        </div>
      `;
      return;
    }

    gridArea.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${allBadges.map(badge => {
          const userBadge = earnedMap.get(badge.id);
          const isEarned = Boolean(userBadge);
          const iconSrc = badge.icon_url || DEFAULT_BADGE_ICONS[badge.code] || '/badges/pemula.svg';

          return `
            <div class="card-organik !p-6 flex flex-col justify-between transition-all duration-300
              ${isEarned
                ? 'bg-gradient-to-b from-white to-padi/5 border-padi/40 shadow-organik-lg hover:-translate-y-1'
                : 'opacity-65 grayscale hover:grayscale-0 hover:opacity-90 bg-white/50 border-pasir/50'}">
              
              <div>
                <div class="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center">
                  <img src="${iconSrc}"
                    alt="${badge.name}"
                    class="w-full h-full object-contain drop-shadow-md" />
                  ${!isEarned ? `
                    <div class="absolute inset-0 flex items-center justify-center bg-tanah-gelap/40 rounded-full backdrop-blur-[1px]">
                      <i class="fa-solid fa-lock text-white text-lg"></i>
                    </div>
                  ` : ''}
                </div>

                <div class="text-center">
                  <span class="badge ${isEarned ? 'badge-padi' : 'badge-tanah'} text-xs font-semibold mb-2">
                    ${isEarned ? '✓ Terbuka' : 'Terkunci'}
                  </span>
                  <h3 class="font-heading text-lg font-bold text-tanah-gelap mb-1.5">
                    ${badge.name}
                  </h3>
                  <p class="font-body text-xs text-tanah/70 leading-relaxed mb-4">
                    ${badge.description}
                  </p>
                </div>
              </div>

              <div class="pt-3 border-t border-pasir/40 text-center">
                ${isEarned ? `
                  <span class="text-xs text-daun font-body font-medium">
                    Diraih ${new Date(userBadge.earned_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                ` : `
                  <span class="text-xs text-tanah/50 font-body">
                    Selesaikan paket petualangan terkait
                  </span>
                `}
              </div>

            </div>
          `;
        }).join('')}
      </div>

      <div class="mt-12 text-center">
        <a href="/src/pages/petualangan.html" class="btn-primer text-sm !py-3 !px-6">
          Lanjutkan Petualangan untuk Meraih Lencana
        </a>
      </div>
    `;

  } catch (err) {
    console.error('[Load Badges Error]:', err);
    gridArea.innerHTML = `
      <div class="card-organik text-center py-12">
        <div class="text-3xl mb-2 text-amber-500"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <p class="font-body text-sm text-tanah/70 mb-4">Gagal memuat lencana Anda.</p>
        <button onclick="window.location.reload()" class="btn-sekunder text-xs">Coba Lagi</button>
      </div>
    `;
  }
}
