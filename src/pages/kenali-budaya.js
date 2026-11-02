/**
 * Kenali Budaya dari Foto — Frontend Controller
 * Fitur identifikasi budaya Bali dengan client-side image resizing,
 * verifikasi JWT Supabase, status loading interaktif, dan penanganan anti-halusinasi.
 *
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import {
  createElement,
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Eye,
  AlertTriangle,
  Search
} from 'lucide';

import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { showToast } from '../components/ui.js';
import { getCurrentUser, getSession, requireAuth } from '../lib/auth.js';

// Lindungi halaman — wajib login/daftar
const session = await requireAuth();
if (!session) {
  // redirect otomatis oleh requireAuth ke /src/pages/masuk.html
}

// Konfigurasi Klien
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB (Persyaratan 1)
const MAX_DIMENSION_PX = 1024; // Sisi terpanjang maksimal 1024 px (Persyaratan 1)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// State Controller
const state = {
  selectedFile: null,
  resizedBase64: null,
  resizedBlob: null,
  resizedWidth: 0,
  resizedHeight: 0,
  isProcessing: false,
  currentUser: null,
  currentSession: null,
  statusTickerInterval: null
};

/**
 * Inisialisasi halaman Kenali Budaya
 */
async function init() {
  await renderNavbar('#navbar');
  renderFooter('#footer');

  renderIcons();
  await checkAuthStatus();
  setupEventListeners();
}

/**
 * Render semua ikon Lucide statis
 */
function renderIcons() {
  const iconMap = {
    'hero-camera-icon': Camera,
    'privacy-shield-icon': ShieldCheck,
    'auth-warn-icon': AlertTriangle,
    'dropzone-camera-icon': Camera,
    'btn-camera-icon': Camera,
    'btn-file-icon': Upload,
    'preview-check-icon': CheckCircle2,
    'btn-retake-icon': RefreshCw,
    'btn-identify-sparkle-icon': Sparkles,
    'loading-center-icon': Sparkles,
    'result-check-icon': CheckCircle2,
    'result-eye-icon': Eye,
    'result-book-icon': BookOpen,
    'result-arrow-icon': ArrowRight,
    'result-disclaimer-icon': AlertTriangle,
    'uncertain-help-icon': HelpCircle,
    'uncertain-search-icon': Search
  };

  Object.entries(iconMap).forEach(([id, iconData]) => {
    const target = document.getElementById(id);
    if (target && !target.hasChildNodes()) {
      const svg = createElement(iconData);
      svg.setAttribute('width', '18');
      svg.setAttribute('height', '18');
      target.appendChild(svg);
    }
  });
}

/**
 * Periksa status autentikasi Supabase pengguna
 */
async function checkAuthStatus() {
  try {
    state.currentUser = await getCurrentUser();
    state.currentSession = await getSession();

    const authBanner = document.getElementById('auth-reminder-banner');
    if (!state.currentUser && authBanner) {
      authBanner.classList.remove('hidden');
    } else if (authBanner) {
      authBanner.classList.add('hidden');
    }
  } catch (err) {
    console.warn('[Kenali Budaya] Gagal memverifikasi auth:', err);
  }
}

/**
 * Pasang seluruh event listener interaktif
 */
function setupEventListeners() {
  const cameraInput = document.getElementById('camera-input');
  const fileInput = document.getElementById('file-input');
  const btnCamera = document.getElementById('btn-trigger-camera');
  const btnFile = document.getElementById('btn-trigger-file');
  const dropzoneArea = document.getElementById('dropzone-area');
  const btnRetake = document.getElementById('btn-retake-photo');
  const btnStartIdentify = document.getElementById('btn-start-identify');
  const btnIdentifyAnother = document.getElementById('btn-identify-another');
  const btnTryAnother = document.getElementById('btn-try-another-photo');

  // Trigger file picker
  btnCamera?.addEventListener('click', (e) => {
    e.stopPropagation();
    cameraInput?.click();
  });

  btnFile?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  // Dropzone click
  dropzoneArea?.addEventListener('click', () => {
    fileInput?.click();
  });

  // Drag and drop handlers
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzoneArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneArea.classList.add('border-daun', 'bg-daun/5');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzoneArea?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzoneArea.classList.remove('border-daun', 'bg-daun/5');
    });
  });

  dropzoneArea?.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleIncomingFile(files[0]);
    }
  });

  // Input change
  cameraInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleIncomingFile(e.target.files[0]);
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleIncomingFile(e.target.files[0]);
    }
  });

  // Tombol aksi
  btnRetake?.addEventListener('click', resetPhotoSelection);
  btnIdentifyAnother?.addEventListener('click', resetPhotoSelection);
  btnTryAnother?.addEventListener('click', resetPhotoSelection);

  // Mulai Identifikasi
  btnStartIdentify?.addEventListener('click', processCultureIdentification);
}

/**
 * Validasi dan proses foto yang dipilih oleh pengguna
 * Menerapkan batas 4 MB, format jpeg/png/webp, dan resize 1024 px di sisi klien (Persyaratan 1)
 */
async function handleIncomingFile(file) {
  if (!file) return;

  // 1. Validasi Tipe File (Persyaratan 1: hanya jpeg/png/webp)
  const isTypeValid = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) ||
    /\.(jpe?g|png|webp)$/i.test(file.name);

  if (!isTypeValid) {
    showToast('Format foto tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.', 'error');
    return;
  }

  // 2. Validasi Ukuran File (Persyaratan 1: batas 4 MB)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    showToast(`Ukuran foto terlalu besar (${sizeMb} MB). Batas maksimal adalah 4 MB.`, 'error');
    return;
  }

  try {
    showToast('Mengoptimalkan foto di sisi klien...', 'info', 1500);

    // 3. Resize di sisi klien (sisi terpanjang maksimal 1024 px, format JPEG)
    const resizeResult = await resizeImageClientSide(file, MAX_DIMENSION_PX, 0.85);

    state.selectedFile = file;
    state.resizedBase64 = resizeResult.base64;
    state.resizedBlob = resizeResult.blob;
    state.resizedWidth = resizeResult.width;
    state.resizedHeight = resizeResult.height;

    // Tampilkan pratinjau gambar
    displayPreview(resizeResult);

  } catch (err) {
    console.error('[Kenali Budaya] Gagal memproses gambar:', err);
    showToast('Gagal memproses gambar. Silakan coba file gambar lain.', 'error');
  }
}

/**
 * Resizer Gambar Sisi Klien menggunakan HTML5 Canvas
 * Mengubah ukuran gambar sehingga sisi terpanjang <= 1024 px dan mengompres ke JPEG
 */
function resizeImageClientSide(file, maxDimension = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Hitung skala rasio aspek
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Gambar ke elemen Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak didukung'));
          return;
        }

        // Terapkan latar belakang putih untuk gambar transparan PNG/WebP saat dikonversi ke JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format JPEG sesuai persyaratan
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        canvas.toBlob((blob) => {
          resolve({
            dataUrl,
            base64: dataUrl,
            blob,
            width,
            height,
            sizeBytes: blob?.size || Math.round(dataUrl.length * 0.75),
            originalName: file.name
          });
        }, 'image/jpeg', quality);
      };

      img.onerror = () => reject(new Error('Gagal memuat elemen gambar'));
      img.src = readerEvent.target.result;
    };

    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.readAsDataURL(file);
  });
}

/**
 * Menampilkan elemen pratinjau gambar setelah resize
 */
function displayPreview(resizeResult) {
  const dropzoneArea = document.getElementById('dropzone-area');
  const previewSection = document.getElementById('preview-section');
  const previewImg = document.getElementById('preview-img');
  const fileSpecText = document.getElementById('file-spec-text');
  const fileSizeBadge = document.getElementById('file-size-badge');

  // Sembunyikan hasil lama jika ada
  hideAllResults();

  if (previewImg) {
    previewImg.src = resizeResult.dataUrl;
  }

  const kbSize = (resizeResult.sizeBytes / 1024).toFixed(0);
  if (fileSpecText) {
    fileSpecText.textContent = `Resolusi: ${resizeResult.width} × ${resizeResult.height} px · Format: JPEG`;
  }
  if (fileSizeBadge) {
    fileSizeBadge.textContent = `${kbSize} KB (Siap dianalisis)`;
  }

  dropzoneArea?.classList.add('hidden');
  previewSection?.classList.remove('hidden');

  // Scroll halus ke area pratinjau
  previewSection?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Reset pilihan foto kembali ke tampilan awal
 */
function resetPhotoSelection() {
  state.selectedFile = null;
  state.resizedBase64 = null;
  state.resizedBlob = null;
  state.isProcessing = false;

  stopLoadingTicker();

  const cameraInput = document.getElementById('camera-input');
  const fileInput = document.getElementById('file-input');
  if (cameraInput) cameraInput.value = '';
  if (fileInput) fileInput.value = '';

  const dropzoneArea = document.getElementById('dropzone-area');
  const previewSection = document.getElementById('preview-section');
  const loadingState = document.getElementById('loading-state');
  const laser = document.getElementById('scanning-laser');

  laser?.classList.add('hidden');
  loadingState?.classList.add('hidden');
  previewSection?.classList.add('hidden');
  dropzoneArea?.classList.remove('hidden');

  hideAllResults();
}

/**
 * Sembunyikan seluruh wadah hasil
 */
function hideAllResults() {
  document.getElementById('result-identified')?.classList.add('hidden');
  document.getElementById('result-uncertain')?.classList.add('hidden');
}

/**
 * Ticker teks status loading yang ramah dan menenangkan
 */
function startLoadingTicker() {
  const messages = [
    { title: 'Memeriksa Komposisi Visual...', subtitle: 'Mendeteksi ornamen, busana adat, atau sesaji pada foto...' },
    { title: 'Mencocokkan Taksonomi Budaya...', subtitle: 'Menghubungkan ciri visual dengan artikel Ensiklopedia Budaya Bali...' },
    { title: 'Menerapkan Filter Anti-Halusinasi...', subtitle: 'Memverifikasi tingkat keyakinan agar tidak menebak secara sembarangan...' }
  ];

  let step = 0;
  const titleEl = document.getElementById('loading-status-title');
  const subtitleEl = document.getElementById('loading-status-subtitle');

  if (titleEl && subtitleEl) {
    titleEl.textContent = messages[0].title;
    subtitleEl.textContent = messages[0].subtitle;
  }

  stopLoadingTicker();
  state.statusTickerInterval = setInterval(() => {
    step = (step + 1) % messages.length;
    if (titleEl && subtitleEl) {
      titleEl.textContent = messages[step].title;
      subtitleEl.textContent = messages[step].subtitle;
    }
  }, 3000);
}

function stopLoadingTicker() {
  if (state.statusTickerInterval) {
    clearInterval(state.statusTickerInterval);
    state.statusTickerInterval = null;
  }
}

/**
 * Proses Pengiriman Foto ke /api/identify-culture
 */
async function processCultureIdentification() {
  if (state.isProcessing) return;

  if (!state.resizedBase64) {
    showToast('Harap pilih atau ambil foto terlebih dahulu.', 'error');
    return;
  }

  // Periksa autentikasi pengguna
  let session = await getSession();
  if (!session) {
    showToast('Silakan masuk akun terlebih dahulu untuk menggunakan AI Kenali Budaya.', 'error');
    const authBanner = document.getElementById('auth-reminder-banner');
    authBanner?.classList.remove('hidden');
    authBanner?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  state.isProcessing = true;

  const btnStartIdentify = document.getElementById('btn-start-identify');
  const previewSection = document.getElementById('preview-section');
  const loadingState = document.getElementById('loading-state');
  const laser = document.getElementById('scanning-laser');

  // Tampilkan status 'sedang mengenali' (Persyaratan 1)
  btnStartIdentify?.setAttribute('disabled', 'true');
  btnStartIdentify?.classList.add('opacity-50', 'cursor-not-allowed');
  laser?.classList.remove('hidden');
  loadingState?.classList.remove('hidden');
  hideAllResults();
  startLoadingTicker();

  loadingState?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    // Siapkan payload ke /api/identify-culture
    const payload = {
      image: state.resizedBase64,
      mimeType: 'image/jpeg'
    };

    const response = await fetch('/api/identify-culture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);

    // Tangani error status HTTP dengan pesan ramah (Persyaratan 6)
    if (!response.ok) {
      handleApiError(response.status, data);
      return;
    }

    if (!data || !data.success) {
      showToast(data?.error || 'Tidak dapat memproses identifikasi foto.', 'error');
      return;
    }

    // Tampilkan hasil berdasarkan status verifikasi model (Persyaratan 3 & 4)
    if (data.status === 'identified') {
      renderIdentifiedResult(data);
    } else {
      renderUncertainResult(data);
    }

  } catch (netErr) {
    console.error('[Kenali Budaya] Network error:', netErr);
    showToast('Koneksi internet bermasalah. Silakan periksa jaringan dan coba lagi.', 'error');
  } finally {
    state.isProcessing = false;
    stopLoadingTicker();
    laser?.classList.add('hidden');
    loadingState?.classList.add('hidden');
    btnStartIdentify?.removeAttribute('disabled');
    btnStartIdentify?.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

/**
 * Tangani ragam error API dengan pesan yang ramah (Persyaratan 6)
 */
function handleApiError(status, data) {
  if (status === 401) {
    showToast('Sesi Anda telah kedaluwarsa. Silakan masuk kembali.', 'error');
    const authBanner = document.getElementById('auth-reminder-banner');
    authBanner?.classList.remove('hidden');
    return;
  }

  if (status === 429) {
    const errorMsg = data?.error || 'Batas permintaan tercapai (maksimal 10 foto per jam). Silakan coba lagi nanti.';
    showToast(errorMsg, 'error', 6000);
    return;
  }

  if (status === 504) {
    showToast('Waktu pemrosesan melebihi batas (timeout). Silakan periksa koneksi internet atau gunakan foto yang lebih kecil.', 'error', 5000);
    return;
  }

  if (status === 503) {
    showToast(data?.error || 'Layanan AI sedang dalam konfigurasi server. Harap coba kembali nanti.', 'error', 5000);
    return;
  }

  showToast(data?.error || 'Terjadi kendala saat menganalisis foto budaya.', 'error');
}

/**
 * Tampilkan Kasus Sukses: Budaya Teridentifikasi (Persyaratan 4)
 */
function renderIdentifiedResult(data) {
  const container = document.getElementById('result-identified');
  if (!container) return;

  // Persentase Keyakinan
  const confidencePercent = Math.round((data.keyakinan || 0) * 100);
  const confidenceEl = document.getElementById('result-confidence-text');
  if (confidenceEl) {
    confidenceEl.textContent = `${confidencePercent}%`;
  }

  // Kategori & Wilayah
  const catEl = document.getElementById('result-category-badge');
  if (catEl) {
    catEl.textContent = data.kategori ? data.kategori.toUpperCase() : 'BUDAYA';
  }

  const regionEl = document.getElementById('result-region-text');
  if (regionEl) {
    regionEl.textContent = `Wilayah: ${data.wilayah || 'Seluruh Bali'}`;
  }

  // Judul Budaya Resmi
  const titleEl = document.getElementById('result-culture-title');
  if (titleEl) {
    titleEl.textContent = data.nama_budaya;
  }

  // Alasan Visual AI
  const visualEl = document.getElementById('result-visual-reason');
  if (visualEl) {
    visualEl.textContent = `"${data.alasan_visual || 'Elemen visual khas budaya Bali terdeteksi.'}"`;
  }

  // Ringkasan Resmi dari DATABASE ARTIKEL (Bukan dari AI)
  const summaryEl = document.getElementById('result-culture-summary');
  if (summaryEl) {
    summaryEl.textContent = data.ringkasan;
  }

  // Tautan Artikel Lengkap
  const linkEl = document.getElementById('result-article-link');
  if (linkEl && data.slug) {
    linkEl.href = `/src/pages/budaya.html?slug=${encodeURIComponent(data.slug)}`;
  }

  // Peringatan Hasil AI
  const disclaimerEl = document.getElementById('result-disclaimer-text');
  if (disclaimerEl && data.disclaimer) {
    disclaimerEl.textContent = data.disclaimer;
  }

  hideAllResults();
  container.classList.remove('hidden');
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  showToast(`Berhasil mengenali: ${data.nama_budaya}`, 'sukses');
}

/**
 * Tampilkan Kasus: Belum Bisa Dipastikan (Confidence < 0.6 / Tidak Dikenali) (Persyaratan 3)
 */
function renderUncertainResult(data) {
  const container = document.getElementById('result-uncertain');
  if (!container) return;

  const reasonEl = document.getElementById('uncertain-reason-text');
  if (reasonEl) {
    const safeReason = (data.alasan_visual || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const reasonText = safeReason
      ? ` Catatan visual AI: "${safeReason}"`
      : '';

    reasonEl.innerHTML = `Kecerdasan buatan kami tidak dapat memastikan kecocokan foto ini dengan tingkat keyakinan yang memadai (estimasi keyakinan <strong>${confidencePercent}%</strong>, di bawah batas aman 60%).${reasonText} Demi menjaga kesakralan dan kebenaran informasi, kami <strong>tidak menebak secara sembarangan</strong>.`;
  }

  hideAllResults();
  container.classList.remove('hidden');
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  showToast('Objek budaya belum bisa dipastikan secara meyakinkan.', 'info');
}

// Inisialisasi saat DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
