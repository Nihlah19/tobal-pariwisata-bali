/**
 * Masuk / Daftar — Tour Penjelajah Bali
 * Autentikasi Supabase dengan pesan validasi berbahasa Indonesia.
 */
import '../styles/main.css';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { createElement, Compass, UserCheck, AlertCircle } from 'lucide';
import { signInUser, signUpUser, getCurrentUser, getUserProfile } from '../lib/auth.js';
import { showToast } from '../components/ui.js';

// Inisialisasi layout
await renderNavbar('#navbar');
renderFooter('#footer');

// Render ikon header
const headerIconEl = document.getElementById('auth-header-icon');
if (headerIconEl) {
  const svg = createElement(Compass);
  svg.setAttribute('width', '30');
  svg.setAttribute('height', '30');
  headerIconEl.appendChild(svg);
}

// Redirect jika sudah login
const currentUser = await getCurrentUser();
if (currentUser) {
  const profile = await getUserProfile(currentUser.id);
  const isUserAdmin = currentUser.email === 'admin@tobal.id' || profile?.role === 'admin' || sessionStorage.getItem('tobal_admin_key') === 'tobal2026';
  
  if (isUserAdmin) {
    window.location.href = '/src/pages/admin.html';
  } else {
    const target = (profile?.interests && profile.interests.length > 0)
      ? '/src/pages/petualangan.html'
      : '/src/pages/onboarding.html';
    window.location.href = target;
  }
}

// Cek notifikasi akses khusus
const initialParams = new URLSearchParams(window.location.search);
if (initialParams.get('msg') === 'need_admin') {
  setTimeout(() => {
    showAlert('Halaman tersebut khusus Super Admin. Silakan masuk dengan kredensial admin.', 'error');
  }, 200);
} else if (initialParams.get('msg') === 'auth_required') {
  setTimeout(() => {
    showAlert('Silakan daftar akun baru terlebih dahulu untuk mengakses fitur petualangan dan AI Tobal.', 'info');
  }, 200);
}

// State mode form: 'login' | 'register'
let mode = 'login';

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const fieldName = document.getElementById('field-name');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const submitText = document.getElementById('submit-text');
const submitSpinner = document.getElementById('submit-spinner');
const btnSubmit = document.getElementById('btn-submit');
const authAlert = document.getElementById('auth-alert');
const authForm = document.getElementById('auth-form');

// Toggle Tab
tabLogin.addEventListener('click', () => setMode('login'));
tabRegister.addEventListener('click', () => setMode('register'));

function setMode(newMode) {
  mode = newMode;
  hideAlert();

  if (mode === 'login') {
    tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 bg-white text-daun shadow-sm';
    tabRegister.className = 'flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 text-tanah/70 hover:text-tanah-gelap';
    fieldName.classList.add('hidden');
    formTitle.textContent = 'Selamat Datang';
    formSubtitle.textContent = 'Masuk untuk melanjutkan petualangan Pulau Dewata Anda';
    submitText.textContent = 'Masuk Sekarang';
  } else {
    tabRegister.className = 'flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 bg-white text-daun shadow-sm';
    tabLogin.className = 'flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 text-tanah/70 hover:text-tanah-gelap';
    fieldName.classList.remove('hidden');
    formTitle.textContent = 'Mulai Petualangan';
    formSubtitle.textContent = 'Daftarkan diri Anda untuk menjelajahi keindahan tersembunyi Bali';
    submitText.textContent = 'Daftar Akun Baru';
  }
}

// Buka tab daftar secara otomatis jika URL memiliki parameter ?tab=register
const initialTab = new URLSearchParams(window.location.search).get('tab');
if (initialTab === 'register') {
  setMode('register');
}

function showAlert(message, type = 'error') {
  authAlert.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'border-red-200', 'bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
  if (type === 'error') {
    authAlert.classList.add('bg-red-50', 'text-red-700', 'border', 'border-red-200');
  } else {
    authAlert.classList.add('bg-emerald-50', 'text-emerald-800', 'border', 'border-emerald-200');
  }
  authAlert.textContent = message;
}

function hideAlert() {
  authAlert.classList.add('hidden');
  authAlert.textContent = '';
}

// Handle Submit Form
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const name = document.getElementById('name').value.trim();

  // Validasi lokal
  if (!email) {
    showAlert('Silakan masukkan alamat email Anda.');
    return;
  }
  if (!password || password.length < 6) {
    showAlert('Kata sandi harus terdiri dari minimal 6 karakter.');
    return;
  }
  if (mode === 'register' && !name) {
    showAlert('Silakan masukkan nama lengkap Anda.');
    return;
  }

  // Tampilkan loading spinner
  btnSubmit.disabled = true;
  submitSpinner.classList.remove('hidden');

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const returnTo = urlParams.get('returnTo');

    if (mode === 'register') {
      const data = await signUpUser(email, password, name);
      showToast('Pendaftaran berhasil! Selamat datang di Tour Penjelajah Bali.', 'sukses');
      
      // Arahkan pengguna baru ke onboarding untuk mengisi preferensi
      setTimeout(() => {
        window.location.href = '/src/pages/onboarding.html';
      }, 1000);

    } else {
      // Jalur khusus Super Admin lewat satu pintu
      const isAdminEmail = email.toLowerCase() === 'admin@tobal.id' || email.toLowerCase() === 'admin@penjelajahbali.id';
      const isAdminPass = password === 'admin123456' || password === 'tobal2026';

      if (isAdminEmail && isAdminPass) {
        sessionStorage.setItem('tobal_admin_key', 'tobal2026');
        localStorage.setItem('tobal_user_role', 'admin');
        
        // Coba sinkronisasi sesi Supabase jika user ada
        try {
          await signInUser(email, password);
        } catch {}

        showToast('Selamat datang, Super Admin! Membuka Panel Kendali...', 'sukses');
        setTimeout(() => {
          window.location.href = returnTo ? decodeURIComponent(returnTo) : '/src/pages/admin.html';
        }, 800);
        return;
      }

      const data = await signInUser(email, password);
      showToast('Berhasil masuk! Menyiapkan petualangan Anda...', 'sukses');

      // Periksa apakah pengguna memiliki role admin atau sudah pernah onboarding
      const user = data.user;
      const profile = user ? await getUserProfile(user.id) : null;
      const isRoleAdmin = user?.email === 'admin@tobal.id' || profile?.role === 'admin';

      if (isRoleAdmin) {
        sessionStorage.setItem('tobal_admin_key', 'tobal2026');
        localStorage.setItem('tobal_user_role', 'admin');
        setTimeout(() => {
          window.location.href = returnTo ? decodeURIComponent(returnTo) : '/src/pages/admin.html';
        }, 800);
        return;
      }

      const hasOnboarded = profile?.interests && profile.interests.length > 0;

      setTimeout(() => {
        if (returnTo) {
          window.location.href = decodeURIComponent(returnTo);
        } else if (!hasOnboarded) {
          window.location.href = '/src/pages/onboarding.html';
        } else {
          window.location.href = '/src/pages/petualangan.html';
        }
      }, 800);
    }
  } catch (err) {
    console.error('[Auth Error]:', err);
    let msg = 'Terjadi kesalahan. Silakan periksa kembali email dan kata sandi Anda.';
    if (err.message?.includes('Invalid login credentials')) {
      msg = 'Email atau kata sandi tidak cocok. Mohon periksa kembali.';
    } else if (err.message?.includes('User already registered')) {
      msg = 'Alamat email ini sudah terdaftar. Silakan gunakan tab Masuk.';
    } else if (err.message?.includes('network')) {
      msg = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    }
    showAlert(msg, 'error');
  } finally {
    btnSubmit.disabled = false;
    submitSpinner.classList.add('hidden');
  }
});
