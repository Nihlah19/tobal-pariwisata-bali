/**
 * Edit Profile Modal Component — Tour Penjelajah Bali
 * Memungkinkan pengguna terdaftar untuk mengubah nama, avatar (maskot Bara / persona), bio, dan preferensi wilayah.
 */

import { getCurrentUser, updateUserProfile } from '../lib/auth.js';

let modalEl = null;

// Avatar Persona Pilihan Khas Bali
export const AVATAR_OPTIONS = [
  { id: 'bara-barong', name: 'Bara Si Barong (Maskot)', url: '/images/mascot-barong-head.png' },
  { id: 'bara-full', name: 'Bara Petualang', url: '/images/mascot-barong.png' },
  { id: 'bli-kadek', name: 'Bli Kadek (Pemandu Kultural)', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
  { id: 'gek-ayu', name: 'Gek Ayu (Pecinta Tari & Bunga)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
  { id: 'wayan-alam', name: 'Wayan (Penjelajah Alam)', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
  { id: 'made-pura', name: 'Made (Pecinta Sejarah Pura)', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80' }
];

export const REGIONS_BALI = [
  'Buleleng (Bali Utara)',
  'Karangasem (Bali Timur)',
  'Tabanan (Lumbung Padi)',
  'Bangli (Pegunungan)',
  'Gianyar (Pusat Seni & Budaya)',
  'Badung (Pesisir & Budaya)',
  'Jembrana (Bali Barat)',
  'Klungkung (Kepulauan Nusa)',
  'Kota Denpasar'
];

/**
 * Buka modal edit profil
 */
export async function openProfileEditModal(onSaveSuccess = null) {
  const user = await getCurrentUser();
  if (!user) {
    alert('Silakan masuk akun terlebih dahulu untuk mengubah profil.');
    return;
  }

  const metadata = user.user_metadata || {};
  const currentName = metadata.full_name || metadata.display_name || user.email?.split('@')[0] || '';
  const currentAvatar = metadata.avatar_url || '/images/mascot-barong-head.png';
  const currentBio = metadata.bio || 'Penjelajah budaya dan pencinta alam asri Pulau Dewata.';
  const currentRegion = metadata.preferred_region || 'Buleleng (Bali Utara)';
  const currentInterests = Array.isArray(metadata.interests) ? metadata.interests : ['alam', 'budaya'];

  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'profile-edit-modal-overlay';
    document.body.appendChild(modalEl);
  }

  modalEl.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-tanah-gelap/60 backdrop-blur-xs animate-fade-in';
  modalEl.innerHTML = `
    <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-pasir overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
      
      <!-- Modal Header -->
      <div class="px-6 py-4 bg-krem/60 border-b border-pasir flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-daun/10 border border-daun/20 p-1 flex items-center justify-center overflow-hidden">
            <img src="/images/mascot-barong-head.png" alt="Bara" class="w-full h-full object-contain filter drop-shadow-xs" />
          </div>
          <div>
            <h3 class="font-heading font-bold text-base text-tanah-gelap">Sunting Profil Penjelajah</h3>
            <p class="text-xs text-tanah/70 font-body">Sesuaikan identitas kultural dan preferensi perjalanan Anda</p>
          </div>
        </div>
        <button type="button" id="btn-close-profile-modal" class="w-8 h-8 rounded-full bg-pasir/40 hover:bg-pasir text-tanah-gelap flex items-center justify-center transition-colors cursor-pointer" aria-label="Tutup">
          ✕
        </button>
      </div>

      <!-- Modal Body Form -->
      <form id="form-edit-profile" class="p-6 overflow-y-auto space-y-5 text-xs font-body">
        
        <!-- Pilihan Avatar Persona -->
        <div>
          <label class="block font-bold text-tanah-gelap mb-2">Pilih Avatar Maskot & Persona Dewata</label>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2.5" id="avatar-selector-grid">
            ${AVATAR_OPTIONS.map(opt => `
              <button type="button" class="avatar-option-btn relative group p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${currentAvatar === opt.url ? 'border-daun bg-daun/10' : 'border-pasir hover:border-daun/40 bg-krem/30'}" data-avatar-url="${opt.url}">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-white p-0.5 border border-pasir/60 flex items-center justify-center">
                  <img src="${opt.url}" alt="${opt.name}" class="w-full h-full object-contain" />
                </div>
                <span class="text-[9px] text-center font-semibold text-tanah truncate max-w-full leading-tight">${opt.name.split(' ')[0]}</span>
                ${currentAvatar === opt.url ? '<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-daun text-white text-[9px] flex items-center justify-center font-bold">✓</span>' : ''}
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="input-profile-avatar" value="${currentAvatar}" />
        </div>

        <!-- Nama Lengkap / Panggilan -->
        <div>
          <label for="input-profile-name" class="block font-bold text-tanah-gelap mb-1.5">Nama Lengkap / Nama Tampilan</label>
          <input type="text" id="input-profile-name" required maxlength="60" value="${currentName}"
            class="w-full px-4 py-2.5 rounded-2xl bg-krem/40 border border-pasir text-xs text-teks focus:outline-hidden focus:border-daun focus:ring-1 focus:ring-daun transition-all"
            placeholder="Contoh: Wayan Suardana" />
        </div>

        <!-- Wilayah / Kabupaten Favorit -->
        <div>
          <label for="select-profile-region" class="block font-bold text-tanah-gelap mb-1.5">Kabupaten / Wilayah Eksplorasi Favorit</label>
          <select id="select-profile-region" class="w-full px-4 py-2.5 rounded-2xl bg-krem/40 border border-pasir text-xs text-teks focus:outline-hidden focus:border-daun transition-all cursor-pointer">
            ${REGIONS_BALI.map(reg => `
              <option value="${reg}" ${currentRegion === reg ? 'selected' : ''}>${reg}</option>
            `).join('')}
          </select>
        </div>

        <!-- Minat Kultural -->
        <div>
          <label class="block font-bold text-tanah-gelap mb-1.5">Minat Eksplorasi</label>
          <div class="flex flex-wrap gap-2">
            ${[
              { id: 'alam', label: '🌿 Alam & Air Terjun Asri' },
              { id: 'budaya', label: '🛕 Pura Sakral & Filosofi Adat' },
              { id: 'kuliner', label: '🍲 Kuliner Pusaka Tradisional' },
              { id: 'seni', label: '🎨 Seni Tari & Musik Rindik' }
            ].map(tag => `
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pasir bg-krem/40 cursor-pointer hover:bg-daun/10 transition-colors text-xs">
                <input type="checkbox" name="interests" value="${tag.id}" ${currentInterests.includes(tag.id) ? 'checked' : ''} class="accent-daun" />
                <span class="text-tanah-gelap font-medium">${tag.label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Bio Singkat -->
        <div>
          <label for="textarea-profile-bio" class="block font-bold text-tanah-gelap mb-1.5">Bio Singkat / Moto Perjalanan</label>
          <textarea id="textarea-profile-bio" rows="3" maxlength="200"
            class="w-full px-4 py-2.5 rounded-2xl bg-krem/40 border border-pasir text-xs text-teks focus:outline-hidden focus:border-daun focus:ring-1 focus:ring-daun transition-all"
            placeholder="Tuliskan moto atau ketertarikan Anda pada kebudayaan Bali...">${currentBio}</textarea>
          <span class="text-[10px] text-tanah/60 block text-right mt-0.5">Maksimal 200 karakter</span>
        </div>

        <!-- Feedback Alert -->
        <div id="profile-edit-alert" class="hidden p-3 rounded-2xl text-xs font-semibold"></div>

        <!-- Action Buttons -->
        <div class="pt-2 flex items-center justify-end gap-2.5">
          <button type="button" id="btn-cancel-profile-modal" class="px-5 py-2.5 rounded-2xl bg-pasir/40 hover:bg-pasir text-tanah font-semibold transition-colors cursor-pointer">
            Batal
          </button>
          <button type="submit" id="btn-save-profile" class="px-6 py-2.5 rounded-2xl bg-daun hover:bg-daun/90 text-krem font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-2">
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>

    </div>
  `;

  // Avatar Selection Handlers
  const avatarButtons = modalEl.querySelectorAll('.avatar-option-btn');
  const avatarHiddenInput = modalEl.querySelector('#input-profile-avatar');

  avatarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedUrl = btn.getAttribute('data-avatar-url');
      avatarHiddenInput.value = selectedUrl;
      avatarButtons.forEach(b => {
        b.classList.remove('border-daun', 'bg-daun/10');
        b.classList.add('border-pasir', 'bg-krem/30');
        b.querySelector('.text-white')?.remove();
      });
      btn.classList.remove('border-pasir', 'bg-krem/30');
      btn.classList.add('border-daun', 'bg-daun/10');
      const badge = document.createElement('span');
      badge.className = 'absolute -top-1 -right-1 w-4 h-4 rounded-full bg-daun text-white text-[9px] flex items-center justify-center font-bold';
      badge.textContent = '✓';
      btn.appendChild(badge);
    });
  });

  // Close Handlers
  const closeBtn = modalEl.querySelector('#btn-close-profile-modal');
  const cancelBtn = modalEl.querySelector('#btn-cancel-profile-modal');
  const closeModal = () => {
    modalEl.classList.remove('flex');
    modalEl.classList.add('hidden');
  };

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl) closeModal();
  });

  // Submit Handler
  const form = modalEl.querySelector('#form-edit-profile');
  const alertBox = modalEl.querySelector('#profile-edit-alert');
  const saveBtn = modalEl.querySelector('#btn-save-profile');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = modalEl.querySelector('#input-profile-name').value.trim();
    const newAvatar = avatarHiddenInput.value;
    const newRegion = modalEl.querySelector('#select-profile-region').value;
    const newBio = modalEl.querySelector('#textarea-profile-bio').value.trim();

    const checkedInterests = [];
    modalEl.querySelectorAll('input[name="interests"]:checked').forEach(cb => {
      checkedInterests.push(cb.value);
    });

    if (!newName) {
      alertBox.className = 'p-3 rounded-2xl text-xs font-semibold bg-red-100 text-red-800 border border-red-300 block';
      alertBox.textContent = 'Nama tidak boleh kosong.';
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `
      <svg class="w-4 h-4 animate-spin text-krem" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" stroke-dasharray="32" stroke-linecap="round"></circle>
      </svg>
      <span>Menyimpan...</span>
    `;

    try {
      await updateUserProfile({
        fullName: newName,
        avatarUrl: newAvatar,
        bio: newBio,
        preferredRegion: newRegion,
        interests: checkedInterests
      });

      alertBox.className = 'p-3 rounded-2xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 block';
      alertBox.textContent = 'Profil berhasil diperbarui!';

      // Update cached display name in navbar & pages
      const navUserName = document.getElementById('navbar-user-name');
      if (navUserName) navUserName.textContent = newName.split(' ')[0];

      const navAvatarImg = document.getElementById('navbar-user-avatar-img');
      if (navAvatarImg) navAvatarImg.src = newAvatar;

      if (typeof onSaveSuccess === 'function') {
        onSaveSuccess({ newName, newAvatar, newRegion, newBio, checkedInterests });
      }

      setTimeout(() => {
        closeModal();
      }, 700);

    } catch (err) {
      alertBox.className = 'p-3 rounded-2xl text-xs font-semibold bg-red-100 text-red-800 border border-red-300 block';
      alertBox.textContent = 'Gagal menyimpan profil: ' + (err.message || 'Terjadi kesalahan');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span>Simpan Perubahan</span>`;
    }
  });
}
