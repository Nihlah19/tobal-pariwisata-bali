/**
 * Unit & Integration Test Suite: Fitur 'Kenali Budaya' (Tahap 9)
 * Menguji:
 * 1. Taksonomi tertutup dan aturan anti-halusinasi (Zero Hallucination Policy)
 * 2. Pencocokan nama budaya dan nama alternatif
 * 3. Ambang batas keyakinan (Confidence threshold >= 0.6 vs < 0.6)
 * 4. Verifikasi JWT Supabase dan penolakan request tanpa autentikasi
 * 5. Validasi tipe MIME (hanya jpeg/png/webp) dan batas ukuran
 * 6. Rate limiting (maksimal 10 permintaan per jam per pengguna)
 * 7. Integritas data ringkasan dari database (bukan teks model) dan disclaimer AI
 *
 * Jalankan: node scripts/test-identify.js
 */

import handler from '../api/identify-culture.js';
import {
  DEFAULT_CULTURE_ARTICLES,
  buildClosedChoicePrompt,
  matchArticleFromPrediction
} from '../api/lib/cultureCatalog.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Mock Helper untuk Req & Res Serverless
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

// 1x1 pixel JPEG dalam base64 untuk pengujian
const DUMMY_BASE64_JPEG = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 PENGUJIAN FITUR KENALI BUDAYA (TAHAP 9)');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: ANTI-HALUSINASI - TAKSONOMI TERTUTUP & MATCHING
  // --------------------------------------------------------------------------
  console.log('Test Suite 1: Anti-Halusinasi & Pencocokan Taksonomi Tertutup');

  // A. Judul persis
  const match1 = matchArticleFromPrediction('Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian');
  assert(match1 !== null && match1.slug === 'filosofi-canang-sari-persembahan-harian', 'Mencocokkan judul lengkap Canang Sari');

  // B. Nama alternatif resmi
  const match2 = matchArticleFromPrediction('Kamben dan Senteng');
  assert(match2 !== null && match2.slug === 'etika-berkunjung-ke-pura-bali', 'Mencocokkan nama alternatif busana adat pura');

  const match3 = matchArticleFromPrediction('Tari Kecak');
  assert(match3 !== null && match3.slug === 'tari-kecak-seni-suara-dan-kisah-ramayana', 'Mencocokkan kata kunci Tari Kecak');

  const match4 = matchArticleFromPrediction('Terasering Sawah Bali');
  assert(match4 !== null && match4.slug === 'sistem-irigasi-subak-tri-hita-karana', 'Mencocokkan irigasi Subak');

  const match5 = matchArticleFromPrediction('Pawai Ogoh-ogoh');
  assert(match5 !== null && match5.slug === 'tradisi-ogoh-ogoh-malam-pengerupukan-nyepi', 'Mencocokkan pawai Ogoh-ogoh');

  // C. Menolak halusinasi budaya di luar Bali
  const matchHallucination1 = matchArticleFromPrediction('Candi Borobudur Magelang');
  assert(matchHallucination1 === null, 'Menolak objek luar Bali (Candi Borobudur)');

  const matchHallucination2 = matchArticleFromPrediction('Batik Megamendung Cirebon');
  assert(matchHallucination2 === null, 'Menolak objek non-Bali (Batik Megamendung)');

  const matchHallucination3 = matchArticleFromPrediction('Menara Eiffel Paris');
  assert(matchHallucination3 === null, 'Menolak objek luar negeri (Menara Eiffel)');

  // D. Menolak jika tidak dikenali / buram
  const matchUnknown = matchArticleFromPrediction('tidak dikenali');
  assert(matchUnknown === null, 'Menolak string "tidak dikenali"');

  // E. Prompt pilihan tertutup
  const prompt = buildClosedChoicePrompt(DEFAULT_CULTURE_ARTICLES);
  assert(prompt.includes('ZERO-HALLUCINATION POLICY'), 'Prompt menyertakan aturan Anti-Halusinasi ketat');
  assert(prompt.includes('DAFTAR PILIHAN TERTUTUP'), 'Prompt membatasi model pada pilihan tertutup');
  assert(prompt.includes('Canang Sari'), 'Prompt memuat katalog artikel budaya');

  // --------------------------------------------------------------------------
  // TEST 2: VALIDASI METHOD & AUTHENTICATION
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 2: Validasi HTTP Method & Autentikasi JWT Supabase');

  // A. Tolak method selain POST
  {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handler(req, res);
    assert(res.statusCode === 405, 'Menolak request GET dengan 405 Method Not Allowed');
  }

  // B. Tolak request tanpa Authorization header
  {
    const { req, res } = createMockReqRes({ method: 'POST', headers: {} });
    await handler(req, res);
    assert(res.statusCode === 401, 'Menolak request tanpa Authorization header dengan 401');
    assert(res.responseData?.error?.includes('Bearer'), 'Pesan error meminta format Bearer token');
  }

  // C. Tolak Authorization header tidak valid
  {
    const { req, res } = createMockReqRes({ method: 'POST', headers: { authorization: 'Basic 12345' } });
    await handler(req, res);
    assert(res.statusCode === 401, 'Menolak Authorization yang bukan Bearer token');
  }

  // --------------------------------------------------------------------------
  // TEST 3: VALIDASI BODY GAMBAR, FORMAT MIME & UKURAN
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 3: Validasi Body, Tipe MIME & Batas Ukuran');

  // A. Tolak body kosong
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'x-mock-test': 'true' },
      body: {}
    });
    await handler(req, res);
    assert(res.statusCode === 400, 'Menolak request tanpa field foto dengan 400');
  }

  // B. Tolak MIME type tidak didukung (misal GIF atau PDF)
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'x-mock-test': 'true' },
      body: { image: DUMMY_BASE64_JPEG, mimeType: 'image/gif' }
    });
    await handler(req, res);
    assert(res.statusCode === 400, 'Menolak tipe MIME image/gif');
    assert(res.responseData?.error?.includes('JPEG, PNG, dan WebP'), 'Error menginformasikan format yang didukung');
  }

  // C. Tolak ukuran melebihi batas 4 MB
  {
    const hugeString = 'A'.repeat(6 * 1024 * 1024); // 6 MB string
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: { authorization: 'Bearer test-token', 'x-mock-test': 'true' },
      body: { image: hugeString, mimeType: 'image/jpeg' }
    });
    await handler(req, res);
    assert(res.statusCode === 400, 'Menolak gambar melebihi batas 4 MB dengan 400');
  }

  // --------------------------------------------------------------------------
  // TEST 4: AMBANG BATAS KEYAKINAN (CONFIDENCE THRESHOLD >= 0.6 vs < 0.6)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 4: Ambang Batas Keyakinan & Anti-Menebak (Confidence Threshold)');

  // A. Keyakinan Tinggi (0.92 >= 0.6) -> Teridentifikasi
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer dev-user-1',
        'x-mock-test': 'true',
        'x-mock-result': 'Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian',
        'x-mock-confidence': '0.92',
        'x-mock-reason': 'Terlihat canang ceper anyaman janur dengan porosan dan bunga lima warna.'
      },
      body: { image: DUMMY_BASE64_JPEG, mimeType: 'image/jpeg' }
    });
    await handler(req, res);
    assert(res.statusCode === 200, 'Identifikasi sukses mengembalikan HTTP 200');
    assert(res.responseData?.status === 'identified', 'Status adalah identified');
    assert(res.responseData?.nama_budaya.includes('Canang Sari'), 'Nama budaya sesuai artikel database');
    assert(res.responseData?.ringkasan.includes('Anyaman daun kelapa muda'), 'Ringkasan berasal dari DATABASE ARTIKEL');
    assert(res.responseData?.tautan_artikel.includes('filosofi-canang-sari'), 'Tautan mengarah ke artikel ensiklopedia');
    assert(res.responseData?.disclaimer.includes('kecerdasan buatan'), 'Menyertakan peringatan disclaimer AI');
    assert(res.responseData?.keyakinan === 0.92, 'Tingkat keyakinan sesuai (0.92)');
  }

  // B. Keyakinan Rendah (< 0.6 misal 0.45) -> Belum Bisa Dipastikan (Tidak Boleh Menebak)
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer dev-user-2',
        'x-mock-test': 'true',
        'x-mock-result': 'Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian',
        'x-mock-confidence': '0.45' // Di bawah 0.6
      },
      body: { image: DUMMY_BASE64_JPEG, mimeType: 'image/jpeg' }
    });
    await handler(req, res);
    assert(res.statusCode === 200, 'Respons uncertain tetap HTTP 200');
    assert(res.responseData?.status === 'uncertain', 'Status adalah uncertain saat keyakinan < 0.6');
    assert(res.responseData?.pesan === 'Belum bisa dipastikan', 'Menampilkan pesan "Belum bisa dipastikan"');
    assert(res.responseData?.saran.includes('pencarian manual'), 'Menawarkan pencarian manual di ensiklopedia');
    assert(res.responseData?.nama_budaya === null, 'Tidak menebak nama budaya saat keyakinan rendah');
  }

  // C. Objek tidak dikenali / buram
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer dev-user-3',
        'x-mock-test': 'true',
        'x-mock-result': 'uncertain'
      },
      body: { image: DUMMY_BASE64_JPEG, mimeType: 'image/jpeg' }
    });
    await handler(req, res);
    assert(res.responseData?.status === 'uncertain', 'Status uncertain untuk objek buram/tidak dikenali');
    assert(res.responseData?.pesan === 'Belum bisa dipastikan', 'Pesan "Belum bisa dipastikan"');
  }

  // --------------------------------------------------------------------------
  // TEST 5: RATE LIMITING (10 PERMINTAAN PER JAM PER PENGGUNA)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 5: Rate Limiting (10 Permintaan / Jam / Pengguna)');

  {
    const testUserId = 'rate-limit-test-user';
    let blocked = false;
    let requestsCount = 0;

    // Lakukan 12 request berturut-turut untuk user yang sama
    for (let i = 1; i <= 12; i++) {
      const { req, res } = createMockReqRes({
        method: 'POST',
        headers: {
          authorization: `Bearer ${testUserId}`,
          'x-mock-test': 'true',
          'x-mock-result': 'Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian',
          'x-mock-confidence': '0.90'
        },
        body: { image: DUMMY_BASE64_JPEG, mimeType: 'image/jpeg' }
      });
      await handler(req, res);

      if (res.statusCode === 429) {
        blocked = true;
        assert(res.headers['retry-after'] !== undefined, 'Menyertakan header Retry-After pada response 429');
        assert(res.responseData?.error?.includes('10 foto per jam'), 'Pesan error menyebutkan batas 10 foto per jam');
        break;
      } else {
        requestsCount++;
      }
    }

    assert(requestsCount === 10, 'Tepat 10 permintaan pertama diizinkan');
    assert(blocked === true, 'Permintaan ke-11 diblokir dengan HTTP 429');
  }

  // --------------------------------------------------------------------------
  // TEST 6: PRIVASI (ZERO STORAGE & NO LEAKS)
  // --------------------------------------------------------------------------
  console.log('\nTest Suite 6: Kepatuhan Privasi (Zero-Storage)');
  {
    const { req, res } = createMockReqRes({
      method: 'POST',
      headers: {
        authorization: 'Bearer privacy-test-user',
        'x-mock-test': 'true',
        'x-mock-result': 'Sistem Subak: Harmoni Manusia, Alam, dan Spiritualitas dalam Pengairan Bali',
        'x-mock-confidence': '0.88'
      },
      body: { image: DUMMY_BASE64_JPEG, mimeType: 'image/jpeg' }
    });
    await handler(req, res);

    const jsonString = JSON.stringify(res.responseData);
    assert(!jsonString.includes(DUMMY_BASE64_JPEG), 'Respons API tidak membocorkan atau menyimpan data base64 foto');
    assert(res.responseData?.nama_budaya.includes('Subak'), 'Identifikasi Subak berhasil');
  }

  console.log('\n======================================================');
  console.log(`🎉 SELURUH PENGUJIAN SELESAI: ${passedTests} / ${totalTests} BERHASIL`);
  console.log('======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Pengujian gagal:', err);
  process.exit(1);
});
