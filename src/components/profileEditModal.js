/**
 * Edit Profile Modal Component — Tour Penjelajah Bali
 * Memungkinkan pengguna terdaftar untuk mengubah nama, avatar (maskot Bara / persona), bio, dan preferensi wilayah.
 */

import { getCurrentUser, updateUserProfile } from '../lib/auth.js';

let modalEl = null;

// Avatar Karakter Kartun Berbusana Adat Bali & Maskot Resmi
export const AVATAR_OPTIONS = [
  { id: 'bara-barong', name: 'Bara Barong (Maskot)', url: '/images/mascot-barong-head.png' },
  { id: 'bara-full', name: 'Bara Petualang', url: '/images/mascot-barong.png' },
  { id: 'bli-udeng', name: 'Bli Wayan (Adat Safari & Udeng)', url: '/images/avatars/avatar-bli-udeng.svg' },
  { id: 'gek-kebaya', name: 'Gek Luh (Kebaya & Bunga Jepun)', url: '/images/avatars/avatar-gek-kebaya.svg' },
  { id: 'penari-legong', name: 'Tari Legong (Gelungan Emas)', url: '/images/avatars/avatar-legong.svg' },
  { id: 'dalang-poleng', name: 'Bli Kadek (Kain Poleng Catur)', url: '/images/avatars/avatar-poleng.svg' }
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

  const isPresetAvatar = AVATAR_OPTIONS.some(opt => opt.url === currentAvatar);
  const isCustomAvatar = !isPresetAvatar && currentAvatar && (currentAvatar.startsWith('data:image/') || currentAvatar.startsWith('http') || currentAvatar.startsWith('/'));

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
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Modal Body Form -->
      <form id="form-edit-profile" class="p-6 overflow-y-auto space-y-5 text-xs font-body">
        
        <!-- Pilihan Avatar Kartun Adat Bali & Maskot Bara -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="block font-bold text-tanah-gelap">Pilih Karakter Maskot & Baju Adat Bali</label>
            <span class="text-[10px] text-daun font-semibold uppercase tracking-wider">Karakter Khas Dewata</span>
          </div>
          <div class="grid grid-cols-3 sm:grid-cols-6 gap-2.5" id="avatar-selector-grid">
            ${AVATAR_OPTIONS.map(opt => `
              <button type="button" class="avatar-option-btn relative group p-1.5 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 cursor-pointer ${currentAvatar === opt.url ? 'border-daun bg-daun/10 ring-2 ring-daun/20' : 'border-pasir hover:border-daun/40 bg-krem/30'}" data-avatar-url="${opt.url}">
                <div class="w-12 h-12 rounded-xl overflow-hidden bg-white p-0.5 border border-pasir/60 flex items-center justify-center">
                  <img src="${opt.url}" alt="${opt.name}" class="w-full h-full object-contain" />
                </div>
                <span class="text-[9px] text-center font-semibold text-tanah truncate max-w-full leading-tight">${opt.name.split(' ')[0]}</span>
                ${currentAvatar === opt.url ? '<span class="avatar-check-badge absolute -top-1 -right-1 w-4 h-4 rounded-full bg-daun text-white text-[9px] flex items-center justify-center font-bold"><i class="fa-solid fa-check text-[8px]"></i></span>' : ''}
              </button>
            `).join('')}
          </div>

          <!-- Pilihan Unggah Foto Sendiri -->
          <div class="mt-3 p-3 rounded-2xl bg-krem/40 border border-pasir flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 min-w-0">
              <div id="custom-avatar-preview-box" class="w-11 h-11 rounded-xl bg-white border ${isCustomAvatar ? 'border-daun ring-2 ring-daun/30' : 'border-pasir/70'} flex items-center justify-center overflow-hidden shrink-0 relative shadow-2xs">
                <img id="custom-avatar-preview-img" src="${isCustomAvatar ? currentAvatar : '/images/mascot-barong-head.png'}" alt="Foto Sendiri" class="w-full h-full object-cover ${isCustomAvatar ? '' : 'opacity-30'}" />
                <span id="custom-avatar-badge" class="${isCustomAvatar ? '' : 'hidden'} absolute -top-1 -right-1 w-4 h-4 rounded-full bg-daun text-white text-[9px] flex items-center justify-center font-bold">
                  <i class="fa-solid fa-check text-[8px]"></i>
                </span>
              </div>
              <div class="min-w-0">
                <span class="font-bold text-tanah-gelap text-xs block truncate">Unggah Foto Profil Sendiri</span>
                <span class="text-[10px] text-tanah/70 block truncate" id="custom-avatar-filename">Gunakan foto asli Anda (Maks. 2.5MB)</span>
              </div>
            </div>
            <label for="input-custom-avatar-file" class="btn-sekunder text-xs !py-1.5 !px-3 shrink-0 cursor-pointer flex items-center gap-1.5 hover:bg-daun hover:text-white transition-all shadow-2xs">
              <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
              <span>Pilih Foto</span>
            </label>
            <input type="file" id="input-custom-avatar-file" accept="image/*" class="hidden" />
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
              { id: 'alam', icon: 'fa-solid fa-leaf text-daun', label: 'Alam & Air Terjun Asri' },
              { id: 'budaya', icon: 'fa-solid fa-gopuram text-amber-700', label: 'Pura Sakral & Filosofi Adat' },
              { id: 'kuliner', icon: 'fa-solid fa-utensils text-orange-600', label: 'Kuliner Pusaka Tradisional' },
              { id: 'seni', icon: 'fa-solid fa-masks-theater text-purple-700', label: 'Seni Tari & Musik Rindik' }
            ].map(tag => `
              <label class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pasir bg-krem/40 cursor-pointer hover:bg-daun/10 transition-colors text-xs">
                <input type="checkbox" name="interests" value="${tag.id}" ${currentInterests.includes(tag.id) ? 'checked' : ''} class="accent-daun" />
                <i class="${tag.icon} text-xs"></i>
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
          <button type="button" id="btn-cancel-profile-modal" class="px-5 py-2.5 rounded-2xl bg-pasir/40 hover:bg-pasir text-tanah font-semibold transition-colors cursor-pointer flex items-center gap-1.5">
            <i class="fa-solid fa-xmark text-xs"></i>
            <span>Batal</span>
          </button>
          <button type="submit" id="btn-save-profile" class="px-6 py-2.5 rounded-2xl bg-daun hover:bg-daun/90 text-krem font-bold shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-2">
            <i class="fa-solid fa-floppy-disk text-xs"></i>
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </form>

    </div>
  `;

  // Avatar Selection Handlers
  const avatarButtons = modalEl.querySelectorAll('.avatar-option-btn');
  const avatarHiddenInput = modalEl.querySelector('#input-profile-avatar');
  const customFileInput = modalEl.querySelector('#input-custom-avatar-file');
  const customPreviewBox = modalEl.querySelector('#custom-avatar-preview-box');
  const customPreviewImg = modalEl.querySelector('#custom-avatar-preview-img');
  const customBadge = modalEl.querySelector('#custom-avatar-badge');
  const customFilenameText = modalEl.querySelector('#custom-avatar-filename');

  function clearPresetAvatars() {
    avatarButtons.forEach(b => {
      b.classList.remove('border-daun', 'bg-daun/10', 'ring-2', 'ring-daun/20');
      b.classList.add('border-pasir', 'bg-krem/30');
      b.querySelector('.avatar-check-badge')?.remove();
    });
  }

  function clearCustomAvatar() {
    customBadge?.classList.add('hidden');
    customPreviewBox?.classList.remove('border-daun', 'ring-2', 'ring-daun/30');
    customPreviewBox?.classList.add('border-pasir/70');
    customPreviewImg?.classList.add('opacity-30');
    if (customFilenameText) {
      customFilenameText.textContent = 'Gunakan foto asli Anda (Maks. 2.5MB)';
    }
  }

  avatarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const selectedUrl = btn.getAttribute('data-avatar-url');
      avatarHiddenInput.value = selectedUrl;
      clearPresetAvatars();
      clearCustomAvatar();

      btn.classList.remove('border-pasir', 'bg-krem/30');
      btn.classList.add('border-daun', 'bg-daun/10', 'ring-2', 'ring-daun/20');
      const badge = document.createElement('span');
      badge.className = 'avatar-check-badge absolute -top-1 -right-1 w-4 h-4 rounded-full bg-daun text-white text-[9px] flex items-center justify-center font-bold';
      badge.innerHTML = '<i class="fa-solid fa-check text-[8px]"></i>';
      btn.appendChild(badge);
    });
  });

  // Unggah Foto Sendiri (File Reader & Image Compression)
  customFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format file tidak didukung. Harap pilih gambar (JPG, PNG, atau WebP).');
      return;
    }

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran gambar melebihi batas 2.5 MB. Harap pilih foto yang lebih kecil.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      avatarHiddenInput.value = base64Data;
      
      clearPresetAvatars();
      
      if (customPreviewImg) {
        customPreviewImg.src = base64Data;
        customPreviewImg.classList.remove('opacity-30');
      }
      customBadge?.classList.remove('hidden');
      customPreviewBox?.classList.remove('border-pasir/70');
      customPreviewBox?.classList.add('border-daun', 'ring-2', 'ring-daun/30');
      
      if (customFilenameText) {
        customFilenameText.textContent = `Terpilih: ${file.name}`;
      }
    };
    reader.readAsDataURL(file);
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
