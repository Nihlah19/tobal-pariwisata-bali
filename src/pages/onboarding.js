/**
 * Onboarding Script — Tour Penjelajah Bali
 * Menangani pemilihan minat, wilayah favorit, dan anggaran.
 */
import '../styles/main.css';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { requireAuth, getUserProfile } from '../lib/auth.js';
import { supabase } from '../lib/supabaseClient.js';
import { showToast } from '../components/ui.js';

// Lindungi halaman: wajib login
const session = await requireAuth();
if (!session) {
  // requireAuth akan melakukan redirect otomatis
}

await renderNavbar('#navbar');
renderFooter('#footer');

// Pilihan Data
const INTERESTS = [
  { id: 'alam', icon: 'fa-solid fa-tree', label: 'Alam Asri', desc: 'Air terjun, hutan, dan perbukitan' },
  { id: 'budaya', icon: 'fa-solid fa-om', label: 'Budaya & Seni', desc: 'Pura, upacara, dan seni tari' },
  { id: 'kuliner', icon: 'fa-solid fa-bowl-food', label: 'Kuliner Lokal', desc: 'Warung legendaris & rasa autentik' },
  { id: 'sejarah', icon: 'fa-solid fa-landmark', label: 'Sejarah Kuno', desc: 'Candi purba & situs kerajaan' },
  { id: 'pantai', icon: 'fa-solid fa-umbrella-beach', label: 'Pantai & Laut', desc: 'Pesisir tenang & pemandangan laut' },
  { id: 'desa wisata', icon: 'fa-solid fa-house-chimney', label: 'Desa Adat', desc: 'Kehidupan warga desa tradisional' },
];

const REGIONS = [
  { id: 'Badung', label: 'Badung (Selatan)' },
  { id: 'Bangli', label: 'Bangli (Tengah)' },
  { id: 'Buleleng', label: 'Buleleng (Utara)' },
  { id: 'Gianyar', label: 'Gianyar (Ubud & Seni)' },
  { id: 'Jembrana', label: 'Jembrana (Barat)' },
  { id: 'Karangasem', label: 'Karangasem (Timur)' },
  { id: 'Klungkung', label: 'Klungkung & Nusa Penida' },
  { id: 'Tabanan', label: 'Tabanan (Agraris & Danau)' },
  { id: 'Denpasar', label: 'Kota Denpasar' },
];

const BUDGETS = [
  { id: 'hemat', title: 'Hemat', subtitle: 'Warung lokal & destinasi tiket terjangkau', icon: '<i class="fa-solid fa-coins text-amber-500"></i>' },
  { id: 'menengah', title: 'Sedang / Menengah', subtitle: 'Pengalaman seimbang dan nyaman', icon: '<i class="fa-solid fa-credit-card text-emerald-500"></i>' },
  { id: 'premium', title: 'Premium', subtitle: 'Eksplorasi berfasilitas lengkap', icon: '<i class="fa-solid fa-gem text-purple-500"></i>' },
];

// State
let selectedInterests = new Set(['alam', 'budaya']);
let selectedRegions = new Set();
let isSurprise = false;
let selectedBudget = 'menengah';

// Muat data profil yang sudah ada (jika pernah diisi sebelumnya)
if (session?.user) {
  const existingProfile = await getUserProfile(session.user.id);
  if (existingProfile) {
    if (existingProfile.interests && existingProfile.interests.length > 0) {
      selectedInterests = new Set(existingProfile.interests);
    }
    if (existingProfile.preferred_regions && existingProfile.preferred_regions.length > 0) {
      selectedRegions = new Set(existingProfile.preferred_regions);
    } else {
      isSurprise = true;
    }
    if (existingProfile.budget) {
      selectedBudget = existingProfile.budget;
    }
  }
}

// 1. Render Interests
const interestsContainer = document.getElementById('interests-container');
function renderInterests() {
  interestsContainer.innerHTML = INTERESTS.map(item => {
    const isSelected = selectedInterests.has(item.id);
    return `
      <button type="button" data-interest="${item.id}"
        class="text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between
          ${isSelected
            ? 'bg-daun text-krem border-daun shadow-sm scale-[1.02]'
            : 'bg-white text-tanah-gelap border-pasir hover:border-daun/40'}">
        <div class="flex items-center gap-2 mb-1">
          <i class="${item.icon} ${isSelected ? 'text-krem' : 'text-daun'} text-sm"></i>
          <span class="font-semibold text-sm">${item.label}</span>
        </div>
        <span class="text-xs mt-1 ${isSelected ? 'text-krem/80' : 'text-tanah/60'}">${item.desc}</span>
      </button>
    `;
  }).join('');

  interestsContainer.querySelectorAll('[data-interest]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-interest');
      if (selectedInterests.has(id)) {
        if (selectedInterests.size > 1) selectedInterests.delete(id);
      } else {
        selectedInterests.add(id);
      }
      renderInterests();
    });
  });
}

// 2. Render Regions
const regionsContainer = document.getElementById('regions-container');
const btnSurprise = document.getElementById('btn-surprise');

function renderRegions() {
  // Update tombol Kejutkan Saya
  if (isSurprise) {
    btnSurprise.className = 'w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-daun bg-daun text-krem font-body font-semibold text-sm transition-all shadow-sm';
  } else {
    btnSurprise.className = 'w-full flex items-center justify-center gap-2 p-3 rounded-2xl border-2 border-dashed border-padi bg-padi/10 text-tanah-gelap font-body font-semibold text-sm transition-all hover:bg-padi/20';
  }

  regionsContainer.innerHTML = REGIONS.map(reg => {
    const isSelected = !isSurprise && selectedRegions.has(reg.id);
    return `
      <button type="button" data-region="${reg.id}"
        class="text-left p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200
          ${isSelected
            ? 'bg-lumut text-krem border-lumut shadow-sm'
            : 'bg-white text-tanah-gelap border-pasir hover:border-lumut/40'}">
        ${reg.label}
      </button>
    `;
  }).join('');

  regionsContainer.querySelectorAll('[data-region]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-region');
      isSurprise = false;
      if (selectedRegions.has(id)) {
        selectedRegions.delete(id);
      } else {
        selectedRegions.add(id);
      }
      renderRegions();
    });
  });
}

btnSurprise.addEventListener('click', () => {
  isSurprise = !isSurprise;
  if (isSurprise) {
    selectedRegions.clear();
  }
  renderRegions();
});

// 3. Render Budget
const budgetContainer = document.getElementById('budget-container');
function renderBudgets() {
  budgetContainer.innerHTML = BUDGETS.map(b => {
    const isSelected = selectedBudget === b.id;
    return `
      <button type="button" data-budget="${b.id}"
        class="text-left p-4 rounded-2xl border transition-all duration-200
          ${isSelected
            ? 'bg-daun text-krem border-daun shadow-sm scale-[1.02]'
            : 'bg-white text-tanah-gelap border-pasir hover:border-daun/40'}">
        <div class="text-2xl mb-1">${b.icon}</div>
        <div class="font-semibold text-sm sm:text-base">${b.title}</div>
        <div class="text-xs mt-1 ${isSelected ? 'text-krem/80' : 'text-tanah/60'}">${b.subtitle}</div>
      </button>
    `;
  }).join('');

  budgetContainer.querySelectorAll('[data-budget]').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedBudget = btn.getAttribute('data-budget');
      renderBudgets();
    });
  });
}

// Inisialisasi tampilan
renderInterests();
renderRegions();
renderBudgets();

// Handle Submit
const form = document.getElementById('onboarding-form');
const btnSubmit = document.getElementById('btn-save-preferences');
const saveSpinner = document.getElementById('save-spinner');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (selectedInterests.size === 0) {
    showToast('Silakan pilih minimal satu minat petualangan.', 'error');
    return;
  }

  btnSubmit.disabled = true;
  saveSpinner.classList.remove('hidden');

  try {
    const interestsArray = Array.from(selectedInterests);
    const regionsArray = isSurprise ? [] : Array.from(selectedRegions);

    const { error } = await supabase
      .from('profiles')
      .update({
        interests: interestsArray,
        preferred_regions: regionsArray,
        budget: selectedBudget,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);

    if (error) throw error;

    showToast('Preferensi berhasil disimpan! Menyiapkan petualangan Anda...', 'sukses');

    // Alihkan langsung ke halaman Petualangan Saya
    setTimeout(() => {
      window.location.href = '/src/pages/petualangan.html?new=true';
    }, 1000);

  } catch (err) {
    console.error('[Onboarding Save Error]:', err);
    showToast('Gagal menyimpan preferensi: ' + (err.message || 'Coba lagi nanti'), 'error');
    btnSubmit.disabled = false;
    saveSpinner.classList.add('hidden');
  }
});
