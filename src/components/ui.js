/**
 * Komponen UI — Tour Penjelajah Bali
 * Semua komponen reusable: toast, modal, progress bar, empty state, skeleton, wave divider.
 */
import {
  createElement,
  X, CheckCircle, AlertCircle, Info, Compass
} from 'lucide';

// ============================================
// TOAST
// ============================================
let toastTimeout = null;

/**
 * Tampilkan toast notification.
 * @param {string} message - Pesan
 * @param {'sukses'|'error'|'info'} type - Jenis toast
 * @param {number} duration - Durasi dalam ms
 */
export function showToast(message, type = 'info', duration = 4000) {
  const existing = document.getElementById('app-toast');
  if (existing) existing.remove();
  if (toastTimeout) clearTimeout(toastTimeout);

  const icons = { sukses: CheckCircle, error: AlertCircle, info: Info };
  const classes = {
    sukses: 'toast-sukses',
    error: 'toast-error',
    info: 'toast-info',
  };

  const toast = document.createElement('div');
  toast.id = 'app-toast';
  toast.className = classes[type] || classes.info;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span id="toast-icon" class="shrink-0"></span>
    <p class="flex-1 text-sm">${message}</p>
    <button class="shrink-0 text-tanah/50 hover:text-tanah transition-colors" aria-label="Tutup">
      <span id="toast-close-icon"></span>
    </button>
  `;

  document.body.appendChild(toast);

  // Render ikon
  const iconEl = document.getElementById('toast-icon');
  if (iconEl) {
    const svg = createElement(icons[type] || icons.info);
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    iconEl.appendChild(svg);
  }

  const closeEl = document.getElementById('toast-close-icon');
  if (closeEl) {
    const svg = createElement(X);
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    closeEl.appendChild(svg);
  }

  // Tutup saat klik tombol close
  toast.querySelector('button').addEventListener('click', () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 200);
  });

  // Auto-dismiss
  toastTimeout = setTimeout(() => {
    if (toast.parentElement) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 200);
    }
  }, duration);
}

// ============================================
// MODAL
// ============================================

/**
 * Tampilkan modal dialog.
 * @param {object} options - { title, body, onConfirm, confirmText, cancelText }
 */
export function showModal({
  title = '',
  body = '',
  onConfirm = null,
  confirmText = 'Ya',
  cancelText = 'Batal',
}) {
  const existing = document.getElementById('app-modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'app-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-heading text-xl font-semibold">${title}</h3>
        <button class="btn-ghost p-1" id="modal-close" aria-label="Tutup">
          <span id="modal-close-icon"></span>
        </button>
      </div>
      <div class="font-body text-teks/80 mb-6">${body}</div>
      <div class="flex justify-end gap-3">
        <button class="btn-sekunder text-sm" id="modal-cancel">${cancelText}</button>
        ${onConfirm ? `<button class="btn-primer text-sm" id="modal-confirm">${confirmText}</button>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeIcon = document.getElementById('modal-close-icon');
  if (closeIcon) {
    const svg = createElement(X);
    svg.setAttribute('width', '20');
    svg.setAttribute('height', '20');
    closeIcon.appendChild(svg);
  }

  const close = () => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 200);
  };

  document.getElementById('modal-close')?.addEventListener('click', close);
  document.getElementById('modal-cancel')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  if (onConfirm) {
    document.getElementById('modal-confirm')?.addEventListener('click', () => {
      onConfirm();
      close();
    });
  }

  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });
}

// ============================================
// PROGRESS BAR
// ============================================

export function progressBarHTML(percent, label = 'Progres') {
  const clamped = Math.max(0, Math.min(100, percent));
  return `
    <div class="progress-bar" role="progressbar"
         aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="100"
         aria-label="${label}">
      <div class="progress-bar-fill" style="width: ${clamped}%"></div>
    </div>
  `;
}

// ============================================
// EMPTY STATE
// ============================================

export function emptyStateHTML({
  title = 'Belum ada data',
  description = '',
  actionText = '',
  actionHref = '#',
}) {
  return `
    <div class="empty-state animate-fade-in">
      <div class="w-20 h-20 rounded-full bg-pasir/60 flex items-center justify-center mb-5" id="empty-icon-wrapper">
        <span id="empty-icon" class="text-tanah/50"></span>
      </div>
      <h3 class="font-heading text-xl font-semibold text-tanah-gelap/70 mb-2">${title}</h3>
      ${description ? `<p class="font-body text-tanah/60 text-sm max-w-sm mb-6">${description}</p>` : ''}
      ${actionText ? `<a href="${actionHref}" class="btn-primer text-sm">${actionText}</a>` : ''}
    </div>
  `;
}

export function initEmptyStateIcon() {
  const target = document.getElementById('empty-icon');
  if (target && !target.querySelector('svg')) {
    const svg = createElement(Compass);
    svg.setAttribute('width', '36');
    svg.setAttribute('height', '36');
    target.appendChild(svg);
  }
}

// ============================================
// SKELETON LOADING
// ============================================

export function skeletonCardsHTML(count = 3) {
  return Array.from({ length: count })
    .map(
      () => `
      <div class="card-organik !hover:translate-y-0 !hover:shadow-organik">
        <div class="skeleton h-40 w-full mb-4"></div>
        <div class="skeleton h-5 w-3/4 mb-3"></div>
        <div class="skeleton h-4 w-full mb-2"></div>
        <div class="skeleton h-4 w-5/6 mb-4"></div>
        <div class="skeleton h-9 w-28 rounded-3xl"></div>
      </div>
    `
    )
    .join('');
}

// ============================================
// WAVE DIVIDER
// ============================================

export function waveDividerHTML(color = '#F5EFE0', flip = false) {
  return `
    <div class="wave-divider ${flip ? 'rotate-180' : ''}" aria-hidden="true">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" class="w-full h-10 sm:h-16">
        <path d="M0,40 C200,80 400,0 600,40 C800,80 1000,0 1200,40 L1200,80 L0,80 Z"
              fill="${color}"/>
      </svg>
    </div>
  `;
}
