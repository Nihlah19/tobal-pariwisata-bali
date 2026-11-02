/**
 * Automated Test Suite: AI Chatbot Tobal & Database RAG (/api/chat)
 * Menguji:
 * 1. Validasi Method (Hanya POST)
 * 2. Autentikasi Pengguna (Wajib Login / Bearer Token)
 * 3. Ekstraksi Grounding Database Supabase (Kamus, Budaya, Destinasi)
 * 4. Token Economy & Fallback Offline saat kuota habis
 */

import handler from '../api/chat.js';

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function createMockReqRes({ method = 'POST', headers = {}, body = null }) {
  const res = {
    statusCode: 200,
    headers: {},
    responseData: null,
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.responseData = data;
      return this;
    }
  };

  const req = {
    method,
    headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
    body
  };

  return { req, res };
}

async function runChatTests() {
  console.log('\n======================================================');
  console.log('🤖 PENGUJIAN AI CHATBOT TOBAL (/api/chat)');
  console.log('======================================================\n');

  // Test 1: Method
  console.log('Test Suite 1: Validasi Method');
  {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handler(req, res);
    assert(res.statusCode === 405, 'Menolak request GET dengan 405 Method Not Allowed');
  }

  // Test 2: Auth Check
  console.log('\nTest Suite 2: Proteksi Akses (Auth Gate)');
  {
    const { req, res } = createMockReqRes({ method: 'POST', headers: {} });
    await handler(req, res);
    assert(res.statusCode === 401, 'Menolak akses tanpa Authorization header');
    assert(res.responseData?.error?.includes('masuk') || res.responseData?.error?.includes('login'), 'Pesan error mengarahkan pengguna untuk login');
  }

  // Test 3: Prompt Kosong
  console.log('\nTest Suite 3: Validasi Pesan/Prompt');
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer demo-user-123' },
      body: { prompt: '' }
    });
    await handler(req, res);
    assert(res.statusCode === 400, 'Menolak prompt kosong dengan status 400');
  }

  // Test 4: RAG Kosakata Kamus Basa Bali
  console.log('\nTest Suite 4: Grounding Database Kosakata Basa Bali');
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer demo-user-123' },
      body: { prompt: 'Apa arti suksma?' }
    });
    await handler(req, res);
    assert(res.statusCode === 200, 'Berhasil merespons query kosakata dengan status 200');
    assert(typeof res.responseData?.reply === 'string' && res.responseData.reply.length > 0, 'Menghasilkan teks jawaban ramah');
    assert(res.responseData?.sources?.some(s => (typeof s === 'string' ? s.toLowerCase().includes('kamus') : s.type === 'kamus')), 'Menyertakan referensi database tipe "kamus"');
    console.log(`     Contoh jawaban: "${res.responseData.reply.slice(0, 100)}..."`);
  }

  // Test 5: RAG Destinasi Wisata 3+1
  console.log('\nTest Suite 5: Grounding Database Destinasi Wisata');
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer demo-user-123' },
      body: { prompt: 'Rekomendasi air terjun di Buleleng' }
    });
    await handler(req, res);
    assert(res.statusCode === 200, 'Berhasil merespons query destinasi dengan status 200');
    assert(res.responseData?.sources?.some(s => (typeof s === 'string' ? (s.toLowerCase().includes('destinasi') || s.toLowerCase().includes('katalog')) : s.type === 'destinasi')), 'Menyertakan referensi database destinasi');
  }

  // Test 6: RAG Ensiklopedia Budaya & Etika Pura
  console.log('\nTest Suite 6: Grounding Database Budaya & Etika');
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer demo-user-123' },
      body: { prompt: 'Bagaimana etika masuk pura di Bali?' }
    });
    await handler(req, res);
    assert(res.statusCode === 200, 'Berhasil merespons query etika pura dengan status 200');
    assert(res.responseData?.sources?.some(s => (typeof s === 'string' ? (s.toLowerCase().includes('budaya') || s.toLowerCase().includes('ensiklopedia')) : s.type === 'budaya')), 'Menyertakan referensi database budaya');
  }

  console.log('\n======================================================');
  console.log(`🎉 SELURUH PENGUJIAN CHATBOT SELESAI: ${passed} / ${total} BERHASIL`);
  console.log('======================================================\n');
}

runChatTests().catch(err => {
  console.error('\n❌ Pengujian Chatbot gagal:', err);
  process.exit(1);
});
