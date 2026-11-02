/**
 * AI Chatbot Modal — Tour Penjelajah Bali (Bli Kadek)
 *
 * Asisten AI Kultural yang terhubung ke basis data Kamus Basa Bali,
 * Destinasi Wisata 3+1, Ensiklopedia Budaya, dan Etika Pura.
 *
 * Aturan Akses: Khusus pengguna yang telah masuk (login / register).
 * Jika belum masuk, mengarahkan pengguna ke Auth Gate Modal.
 *
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { hasCachedSession, getCurrentUser, getSession } from '../lib/auth.js';
import { openAuthModal } from '../lib/authGate.js';

let chatModalEl = null;
let chatLauncherEl = null;
let chatHistory = [];
let isSending = false;

/**
 * Inisialisasi Chatbot Launcher di seluruh halaman
 */
export function initChatbot() {
  if (document.getElementById('tobal-chat-launcher')) return;

  // 1. Buat Tombol Launcher Mengambang (Diangkat agar tidak tertutup nav Android & lega di atas musik)
  chatLauncherEl = document.createElement('div');
  chatLauncherEl.id = 'tobal-chat-launcher';
  chatLauncherEl.className = 'fixed bottom-22 right-3.5 sm:bottom-25 sm:right-6 z-40 flex items-center group';
  chatLauncherEl.innerHTML = `
    <button type="button" id="btn-open-tobal-chat" class="flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-daun hover:bg-daun/90 text-krem shadow-organik-lg border border-padi/40 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
      <div class="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 p-0.5 overflow-hidden flex items-center justify-center shrink-0">
        <img src="/images/mascot-barong-head.png" alt="Bara" class="w-full h-full object-contain" />
      </div>
      <span class="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-padi opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-padi"></span>
      </span>
      <span class="font-body text-[11px] sm:text-xs font-bold tracking-wide">Tanya AI Budaya</span>
    </button>
  `;
  document.body.appendChild(chatLauncherEl);

  // 2. Event Listener Tombol Launcher
  document.getElementById('btn-open-tobal-chat')?.addEventListener('click', () => {
    handleOpenChat();
  });
}

/**
 * Handler Membuka Chat: Memeriksa Status Login
 */
async function handleOpenChat() {
  const isCached = hasCachedSession();
  let user = null;

  if (isCached) {
    user = await getCurrentUser();
  }

  // Jika belum masuk, buka modal autentikasi
  if (!user && !isCached) {
    openAuthModal(
      'Asisten AI Budaya Tobal (Bli Kadek)',
      'Fitur AI Chatbot yang terhubung ke seluruh database kosa kata, etika pura, dan rekomendasi personal hanya dapat diakses setelah Anda masuk atau membuat akun.'
    );
    return;
  }

  // Jika sudah masuk, buka jendela obrolan AI
  showChatModal(user);
}

/**
 * Render Modal Dialog Obrolan AI
 */
function showChatModal(user) {
  if (chatModalEl) {
    chatModalEl.classList.remove('hidden');
    chatModalEl.classList.add('flex');
    document.getElementById('tobal-chat-input')?.focus();
    return;
  }

  chatModalEl = document.createElement('div');
  chatModalEl.id = 'tobal-chat-modal-overlay';
  chatModalEl.className = 'fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-tanah-gelap/50 backdrop-blur-xs animate-fade-in';

  chatModalEl.innerHTML = `
    <div class="w-full sm:max-w-md h-[88vh] sm:h-[620px] bg-krem rounded-t-3xl sm:rounded-3xl shadow-2xl border border-pasir flex flex-col overflow-hidden animate-slide-up">
      
      <!-- Header Chat -->
      <div class="px-5 py-4 bg-white border-b border-pasir flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-daun/10 border border-daun/20 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
            <img src="/images/mascot-barong-head.png" alt="Bli Kadek" class="w-full h-full object-contain filter drop-shadow-xs" />
          </div>
          <div>
            <div class="flex items-center gap-1.5">
              <h3 class="font-heading font-bold text-sm text-tanah-gelap">Bli Kadek · AI Budaya</h3>
              <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <p class="text-[11px] text-tanah/70 font-body">Terhubung ke Database Tobal & AI Kultural Cerdas</p>
          </div>
        </div>
        
        <button type="button" id="btn-close-tobal-chat" class="w-8 h-8 rounded-full bg-pasir/30 hover:bg-pasir text-tanah-gelap flex items-center justify-center transition-colors cursor-pointer" aria-label="Tutup Obrolan">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Quick Chips / Pertanyaan Instan -->
      <div class="px-4 py-2.5 bg-pasir/20 border-b border-pasir/40 overflow-x-auto flex items-center gap-2 text-xs font-body scrollbar-none" id="chat-quick-chips">
        <button type="button" class="quick-chip whitespace-nowrap px-3 py-1 rounded-full bg-white border border-pasir hover:border-daun hover:text-daun text-tanah-gelap text-[11px] font-medium transition-all cursor-pointer flex items-center" data-question="Apa bahasa Balinya terima kasih dan bagaimana cara mengucapkannya dengan sopan?">
          <i class="fa-solid fa-language text-daun mr-1.5"></i>
          <span>Basa Bali "Terima Kasih"</span>
        </button>
        <button type="button" class="quick-chip whitespace-nowrap px-3 py-1 rounded-full bg-white border border-pasir hover:border-daun hover:text-daun text-tanah-gelap text-[11px] font-medium transition-all cursor-pointer flex items-center" data-question="Bagaimana etika berpakaian dan tata krama saat berkunjung ke pura di Bali?">
          <i class="fa-solid fa-hands-praying text-amber-700 mr-1.5"></i>
          <span>Etika Masuk Pura</span>
        </button>
        <button type="button" class="quick-chip whitespace-nowrap px-3 py-1 rounded-full bg-white border border-pasir hover:border-daun hover:text-daun text-tanah-gelap text-[11px] font-medium transition-all cursor-pointer flex items-center" data-question="Apa makna filosofis bunga dan sesaji Canang Sari harian?">
          <i class="fa-solid fa-seedling text-emerald-600 mr-1.5"></i>
          <span>Makna Canang Sari</span>
        </button>
        <button type="button" class="quick-chip whitespace-nowrap px-3 py-1 rounded-full bg-white border border-pasir hover:border-daun hover:text-daun text-tanah-gelap text-[11px] font-medium transition-all cursor-pointer flex items-center" data-question="Rekomendasikan paket rute 3 wisata tersembunyi + 1 kuliner pusaka di Buleleng.">
          <i class="fa-solid fa-compass text-daun mr-1.5"></i>
          <span>Rute 3+1 Buleleng</span>
        </button>
        <button type="button" class="quick-chip whitespace-nowrap px-3 py-1 rounded-full bg-white border border-pasir hover:border-daun hover:text-daun text-tanah-gelap text-[11px] font-medium transition-all cursor-pointer flex items-center" data-question="Rekomendasikan kuliner legendaris khas Bali yang halal dan autentik di sekitar Bedugul atau Tabanan.">
          <i class="fa-solid fa-utensils text-terakota mr-1.5"></i>
          <span>Kuliner Halal Autentik</span>
        </button>
      </div>

      <!-- Area Pesan (Stream) -->
      <div id="tobal-chat-messages" class="flex-1 p-4 overflow-y-auto space-y-3.5 font-body text-xs text-teks">
        
        <!-- Pesan Sambutan Awal -->
        <div class="flex items-start gap-2.5 max-w-[85%]">
          <div class="w-7 h-7 rounded-full bg-daun text-krem flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
            BK
          </div>
          <div class="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-pasir text-tanah-gelap shadow-xs space-y-1.5 leading-relaxed">
            <p><strong>Om Swastyastu!</strong> Selamat datang, ${user?.user_metadata?.full_name || 'Sahabat Penjelajah'}.</p>
            <p>Saya <em>Bli Kadek</em>, asisten pemandu AI resmi Tobal. Saya dapat membantu mencari <strong>kosa kata & etika Basa Bali</strong>, <strong>filosofi pura sakral</strong>, hingga <strong>rekomendasi rute 3+1</strong> di 9 kabupaten.</p>
            <p class="text-[10px] text-tanah/60 pt-1 border-t border-pasir/40">Silakan ajukan pertanyaan atau klik topik cepat di atas!</p>
          </div>
        </div>

      </div>

      <!-- Area Input Pesan -->
      <div class="p-3 bg-white border-t border-pasir">
        <form id="tobal-chat-form" class="flex items-center gap-2">
          <input type="text" id="tobal-chat-input" required maxlength="300"
            class="flex-1 px-4 py-2.5 rounded-2xl bg-krem/40 border border-pasir text-xs font-body text-teks placeholder-tanah/50 focus:outline-hidden focus:border-daun focus:ring-1 focus:ring-daun transition-all"
            placeholder="Ketik pertanyaan (cth: arti suksma, rute 3+1)..." />
          <button type="submit" id="btn-send-tobal-chat" class="w-10 h-10 rounded-2xl bg-daun hover:bg-daun/90 text-krem flex items-center justify-center shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer" aria-label="Kirim Pesan">
            <i class="fa-solid fa-paper-plane text-xs text-krem"></i>
          </button>
        </form>
      </div>

    </div>
  `;

  document.body.appendChild(chatModalEl);

  // Event Listeners
  document.getElementById('btn-close-tobal-chat')?.addEventListener('click', () => {
    chatModalEl.classList.remove('flex');
    chatModalEl.classList.add('hidden');
  });

  // Klik backdrop untuk menutup modal
  chatModalEl.addEventListener('click', (e) => {
    if (e.target === chatModalEl) {
      chatModalEl.classList.remove('flex');
      chatModalEl.classList.add('hidden');
    }
  });

  // Quick Chips Klik
  const quickChips = chatModalEl.querySelectorAll('.quick-chip');
  quickChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.getAttribute('data-question');
      if (q) {
        sendMessage(q);
      }
    });
  });

  // Submit Form
  const form = document.getElementById('tobal-chat-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('tobal-chat-input');
    const msg = input.value.trim();
    if (msg) {
      input.value = '';
      sendMessage(msg);
    }
  });

  document.getElementById('tobal-chat-input')?.focus();
}

/**
 * Mengirim Pesan ke API /api/chat
 */
async function sendMessage(text) {
  if (isSending || !text.trim()) return;
  isSending = true;

  const messagesContainer = document.getElementById('tobal-chat-messages');
  const btnSend = document.getElementById('btn-send-tobal-chat');
  const input = document.getElementById('tobal-chat-input');

  if (btnSend) btnSend.disabled = true;
  if (input) input.disabled = true;

  // 1. Tambahkan bubble chat pengguna
  appendMessage('user', text);
  chatHistory.push({ role: 'user', text });

  // 2. Indikator mengetik Bli Kadek
  const typingIndicatorId = 'chat-typing-' + Date.now();
  const typingDiv = document.createElement('div');
  typingDiv.id = typingIndicatorId;
  typingDiv.className = 'flex items-start gap-2.5 max-w-[85%]';
  typingDiv.innerHTML = `
    <div class="w-7 h-7 rounded-full bg-daun text-krem flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
      BK
    </div>
    <div class="px-4 py-2.5 rounded-2xl rounded-tl-xs bg-white border border-pasir text-tanah/70 text-xs shadow-xs flex items-center gap-1.5">
      <span class="w-1.5 h-1.5 rounded-full bg-daun animate-bounce"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-daun animate-bounce [animation-delay:0.2s]"></span>
      <span class="w-1.5 h-1.5 rounded-full bg-daun animate-bounce [animation-delay:0.4s]"></span>
      <span class="text-[11px] ml-1">Mencari data di database...</span>
    </div>
  `;
  messagesContainer?.appendChild(typingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    // Ambil auth token jika ada
    const session = await getSession();
    const headers = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: text,
        history: chatHistory.slice(-4),
        userProfile: session?.user || { id: 'cached-user', email: 'penjelajah@tobal.id' }
      })
    });

    const json = await res.json();
    document.getElementById(typingIndicatorId)?.remove();

    if (!res.ok || !json.success) {
      if (json.code === 'AUTH_REQUIRED') {
        appendMessage('model', 'Akses dibatasi: Silakan masuk terlebih dahulu untuk mengakses chatbot database.');
        chatModalEl?.classList.add('hidden');
        openAuthModal('Akses Chatbot AI Budaya', 'Silakan masuk atau daftar akun untuk berinteraksi dengan asisten AI Tobal.');
      } else {
        appendMessage('model', json.error || 'Maaf, terjadi kendala saat menghubungi asisten AI.');
      }
      return;
    }

    // Tampilkan jawaban AI
    appendMessage('model', json.reply, json.sources);
    chatHistory.push({ role: 'assistant', text: json.reply });

  } catch (err) {
    document.getElementById(typingIndicatorId)?.remove();
    appendMessage('model', 'Maaf, sambungan terputus: ' + err.message);
  } finally {
    isSending = false;
    if (btnSend) btnSend.disabled = false;
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
}

/**
 * Menambahkan bubble pesan ke dalam container
 */
function appendMessage(role, text, sources = []) {
  const container = document.getElementById('tobal-chat-messages');
  if (!container) return;

  const msgDiv = document.createElement('div');

  if (role === 'user') {
    msgDiv.className = 'flex justify-end';
    msgDiv.innerHTML = `
      <div class="max-w-[85%] px-4 py-2.5 rounded-2xl rounded-tr-xs bg-daun text-krem shadow-xs text-xs font-body leading-relaxed">
        ${escapeHtml(text)}
      </div>
    `;
  } else {
    msgDiv.className = 'flex items-start gap-2.5 max-w-[88%] animate-fade-in';
    const formattedHtml = formatMarkdownText(text);

    let sourcesHtml = '';
    if (sources && sources.length > 0) {
      sourcesHtml = `
        <div class="mt-2 pt-2 border-t border-pasir/50 flex items-center gap-1.5 flex-wrap text-[10px] text-tanah/70 font-medium">
          <span class="text-daun font-semibold">Referensi DB:</span>
          ${sources.map(s => `<span class="px-2 py-0.5 rounded-md bg-pasir/30 border border-pasir/60">${escapeHtml(s)}</span>`).join('')}
        </div>
      `;
    }

    msgDiv.innerHTML = `
      <div class="w-7 h-7 rounded-full bg-daun/15 border border-daun/30 p-0.5 flex items-center justify-center shrink-0 mt-0.5 shadow-xs overflow-hidden">
        <img src="/images/mascot-barong-head.png" alt="Bli Kadek" class="w-full h-full object-contain" />
      </div>
      <div class="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-pasir text-tanah-gelap shadow-xs space-y-1.5 leading-relaxed text-xs">
        <div>${formattedHtml}</div>
        ${sourcesHtml}
      </div>
    `;
  }

  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

/**
 * Helper format Markdown sederhana (bold, list, newline)
 */
function formatMarkdownText(raw) {
  if (!raw) return '';
  let formatted = escapeHtml(raw);

  // Bold **teks**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *teks*
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // List item "- "
  formatted = formatted.replace(/(?:^|\n)-\s+(.*?)(?=\n|$)/g, '<li class="ml-4 list-disc">$1</li>');
  // Newlines to <br>
  formatted = formatted.replace(/\n\n/g, '<p class="mt-1.5"></p>');
  formatted = formatted.replace(/\n/g, '<br />');

  return formatted;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
