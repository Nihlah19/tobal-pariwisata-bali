/**
 * Komponen Showcase — Tour Penjelajah Bali
 * Script untuk halaman galeri komponen UI.
 */
import '../styles/main.css';
import { renderNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import {
  showToast,
  showModal,
  progressBarHTML,
  emptyStateHTML,
  initEmptyStateIcon,
  skeletonCardsHTML,
  waveDividerHTML,
} from '../components/ui.js';

// Render layout
renderNavbar('#navbar');
renderFooter('#footer');

// Progress bars
document.getElementById('progress-25').innerHTML = progressBarHTML(25, 'Paket 25%');
document.getElementById('progress-75').innerHTML = progressBarHTML(75, 'Paket 75%');
document.getElementById('progress-100').innerHTML = progressBarHTML(100, 'Paket 100%');

// Skeleton
document.getElementById('skeleton-area').innerHTML = skeletonCardsHTML(3);

// Empty state
document.getElementById('empty-state-area').innerHTML = emptyStateHTML({
  title: 'Belum Ada Petualangan',
  description: 'Anda belum memiliki paket petualangan. Mulai jelajahi Bali sekarang!',
  actionText: 'Mulai Petualangan',
  actionHref: '/',
});
initEmptyStateIcon();

// Wave divider
const waveArea = document.getElementById('wave-demo-area');
if (waveArea) {
  waveArea.insertAdjacentHTML('beforebegin', waveDividerHTML('#2F5D3A', false));
  waveArea.insertAdjacentHTML('afterend', waveDividerHTML('#F5EFE0', true));
}

// Toast buttons
document.getElementById('btn-toast-sukses')?.addEventListener('click', () => {
  showToast('Destinasi berhasil ditandai selesai! 🎉', 'sukses');
});

document.getElementById('btn-toast-error')?.addEventListener('click', () => {
  showToast('Gagal menyimpan ulasan. Coba lagi nanti.', 'error');
});

document.getElementById('btn-toast-info')?.addEventListener('click', () => {
  showToast('Paket petualangan baru tersedia untuk Anda!', 'info');
});

// Modal button
document.getElementById('btn-modal')?.addEventListener('click', () => {
  showModal({
    title: 'Tandai Selesai?',
    body: `
      <p class="mb-3">Apakah Anda yakin ingin menandai destinasi ini sebagai selesai?</p>
      <p class="text-sm text-tanah/60">
        Anda bisa menulis ulasan setelah menandai destinasi selesai.
      </p>
    `,
    confirmText: 'Ya, Selesai!',
    cancelText: 'Batal',
    onConfirm: () => {
      showToast('Destinasi ditandai selesai! ✅', 'sukses');
    },
  });
});
