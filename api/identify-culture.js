/**
 * Serverless Function: /api/identify-culture
 * Fitur 'Kenali Budaya' dari foto menggunakan Gemini Vision API
 * Dilengkapi perlindungan Anti-Halusinasi (Closed-Set Taxonomy),
 * Rate Limiting (10 req/jam/user), dan penegakan privasi zero-storage.
 *
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_CULTURE_ARTICLES,
  buildClosedChoicePrompt,
  matchArticleFromPrediction
} from './lib/cultureCatalog.js';

// ==============================================================================
// 1. IN-MEMORY RATE LIMITER (10 permintaan / jam / pengguna)
// ==============================================================================
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 Jam
const MAX_REQUESTS_PER_WINDOW = 10;
const rateLimitStore = new Map(); // userId -> Array of timestamps

/**
 * Memeriksa dan memperbarui status rate limit pengguna
 */
function checkRateLimit(userId) {
  const now = Date.now();
  const timestamps = rateLimitStore.get(userId) || [];

  // Filter timestamps yang berada dalam jendela waktu 1 jam terakhir
  const activeTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = activeTimestamps[0];
    const resetSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetSeconds
    };
  }

  // Tambahkan timestamp baru
  activeTimestamps.push(now);
  rateLimitStore.set(userId, activeTimestamps);

  // Bersihkan data lama di store untuk menjaga efisiensi memori
  if (rateLimitStore.size > 500) {
    for (const [id, times] of rateLimitStore.entries()) {
      const valid = times.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      if (valid.length === 0) {
        rateLimitStore.delete(id);
      } else {
        rateLimitStore.set(id, valid);
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_WINDOW - activeTimestamps.length,
    resetSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
  };
}

// ==============================================================================
// 2. HELPER BACA BODY (Kompatibel Vercel Serverless & Connect Middleware di Vite)
// ==============================================================================
async function readRequestBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

// ==============================================================================
// 3. MAIN SERVERLESS HANDLER
// ==============================================================================
export default async function handler(req, res) {
  // Security & CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({
      error: `Metode ${req.method} tidak diizinkan. Gunakan POST.`
    });
  }

  try {
    // --------------------------------------------------------------------------
    // A. VERIFIKASI JWT SUPABASE
    // --------------------------------------------------------------------------
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Header Authorization dengan format Bearer <token> wajib disertakan.'
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return res.status(401).json({ error: 'Token autentikasi tidak boleh kosong.' });
    }

    let userId = null;

    // Dukungan mode pengujian otomatis lokal jika diaktifkan
    const isMockTest = req.headers['x-mock-test'] === 'true';
    if (isMockTest && token) {
      userId = token;
    } else {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({
          error: 'Konfigurasi server belum lengkap (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur).'
        });
      }

      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });

      const { data: authData, error: authError } = await supabase.auth.getUser(token);
      if (authError || !authData?.user) {
        return res.status(401).json({
          error: 'Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.'
        });
      }
      userId = authData.user.id;
    }

    // --------------------------------------------------------------------------
    // B. BATASI LAJU PER PENGGUNA (RATE LIMIT: 10 req / jam)
    // --------------------------------------------------------------------------
    const rateLimit = checkRateLimit(userId);
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW.toString());
    res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());

    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', rateLimit.resetSeconds.toString());
      return res.status(429).json({
        error: `Batas kuota tercapai (maksimal 10 foto per jam). Silakan coba lagi dalam ${Math.ceil(rateLimit.resetSeconds / 60)} menit.`,
        resetSeconds: rateLimit.resetSeconds
      });
    }

    // --------------------------------------------------------------------------
    // C. BACA & VALIDASI BODY GAMBAR
    // --------------------------------------------------------------------------
    const body = await readRequestBody(req);
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        error: 'Permintaan tidak valid. Harap sertakan body JSON berisi foto dan tipe MIME.'
      });
    }

    let { image, mimeType } = body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({
        error: 'Foto wajib disertakan dalam format base64.'
      });
    }

    // Validasi tipe MIME yang diizinkan (hanya jpeg, png, webp)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const normalizedMime = (mimeType || 'image/jpeg').toLowerCase();
    if (!allowedMimeTypes.includes(normalizedMime)) {
      return res.status(400).json({
        error: 'Format foto tidak didukung. Hanya format JPEG, PNG, dan WebP yang diizinkan.'
      });
    }

    // Bersihkan prefix data URI jika ada (misal: data:image/jpeg;base64,...)
    let base64Pure = image;
    if (image.includes(';base64,')) {
      const parts = image.split(';base64,');
      base64Pure = parts[1] || '';
    }

    // Validasi batas ukuran (maksimal 4 MB asli, sekitar 5.6 MB dalam base64)
    const MAX_BASE64_LEN = 5.6 * 1024 * 1024;
    if (base64Pure.length > MAX_BASE64_LEN) {
      return res.status(400).json({
        error: 'Ukuran foto melebihi batas maksimal 4 MB. Foto telah ditolak demi efisiensi dan keamanan.'
      });
    }

    // Validasi integritas string base64
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Pure.substring(0, Math.min(100, base64Pure.length)))) {
      return res.status(400).json({
        error: 'Format enkripsi base64 gambar tidak valid.'
      });
    }

    // --------------------------------------------------------------------------
    // D. AMBIL ARTIKEL RESMI UNTUK DAFTAR PILIHAN TERTUTUP (ANTI-HALUSINASI)
    // --------------------------------------------------------------------------
    let articles = DEFAULT_CULTURE_ARTICLES;

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: { persistSession: false }
        });
        const { data: dbArticles, error: dbError } = await supabase
          .from('culture_articles')
          .select('id, slug, judul, nama_alternatif, ringkasan, kategori, wilayah, gambar_url')
          .eq('diterbitkan', true);

        if (!dbError && dbArticles && dbArticles.length > 0) {
          articles = dbArticles;
        }
      }
    } catch {
      // Menggunakan fallback dataset jika database offline/belum disetup
      articles = DEFAULT_CULTURE_ARTICLES;
    }

    // Buat prompt tertutup
    const promptText = buildClosedChoicePrompt(articles);

    // --------------------------------------------------------------------------
    // E. MODE PENGUJIAN MOCK (Opsional untuk testing tanpa koneksi eksternal)
    // --------------------------------------------------------------------------
    if (isMockTest && req.headers['x-mock-result']) {
      const mockResultHeader = req.headers['x-mock-result'];
      let mockConfidence = parseFloat(req.headers['x-mock-confidence'] || '0.92');
      let mockVisualReason = req.headers['x-mock-reason'] || 'Terlihat anyaman janur ceper persegi dengan bunga panca warna.';

      const matchedArticle = matchArticleFromPrediction(mockResultHeader, articles);
      if (matchedArticle && mockConfidence >= 0.6 && mockResultHeader !== 'uncertain') {
        return res.status(200).json({
          success: true,
          status: 'identified',
          nama_budaya: matchedArticle.judul,
          slug: matchedArticle.slug,
          kategori: matchedArticle.kategori,
          ringkasan: matchedArticle.ringkasan, // Ringkasan DARI DATABASE ARTIKEL
          wilayah: matchedArticle.wilayah || 'Bali',
          gambar_url: matchedArticle.gambar_url,
          tautan_artikel: `/budaya?slug=${matchedArticle.slug}`,
          keyakinan: mockConfidence,
          alasan_visual: mockVisualReason,
          disclaimer: 'Hasil identifikasi dihasilkan oleh kecerdasan buatan (AI) dan dapat keliru. Harap verifikasi keabsahan informasi dengan membaca literatur budaya atau berkonsultasi dengan tokoh adat lokal.'
        });
      }

      // Kasus keyakinan < 0.6 atau objek tidak dikenali
      return res.status(200).json({
        success: true,
        status: 'uncertain',
        nama_budaya: null,
        keyakinan: mockConfidence < 0.6 ? mockConfidence : 0.45,
        alasan_visual: mockVisualReason || 'Gambar tidak menampilkan ornamen atau unsur budaya Bali yang cukup jelas.',
        pesan: 'Belum bisa dipastikan',
        saran: 'Objek budaya dalam foto belum dapat dipastikan dengan tingkat keyakinan yang memadai (< 60%). Coba ambil foto dengan sudut berbeda, pencahayaan lebih terang, atau gunakan pencarian manual di Ensiklopedia Budaya.'
      });
    }

    // --------------------------------------------------------------------------
    // F. PANGGIL GOOGLE GEMINI VISION API
    // --------------------------------------------------------------------------
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (!geminiApiKey || geminiApiKey === 'your-gemini-ai-studio-api-key') {
      return res.status(503).json({
        error: 'Layanan AI pengenalan budaya belum siap: GEMINI_API_KEY belum dikonfigurasi di lingkungan server. Harap atur nilai GEMINI_API_KEY di file .env Anda.'
      });
    }

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${geminiApiKey}`;

    // Siapkan payload Gemini Vision
    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: promptText },
            {
              inline_data: {
                mime_type: normalizedMime === 'image/jpg' ? 'image/jpeg' : normalizedMime,
                data: base64Pure
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 800
      }
    };

    // Controller untuk timeout 20 detik
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let geminiResponse;
    try {
      geminiResponse = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal
      });
    } catch (networkErr) {
      clearTimeout(timeoutId);
      if (networkErr.name === 'AbortError') {
        return res.status(504).json({
          error: 'Waktu analisis foto melebihi batas waktu (timeout 20 detik). Koneksi internet Anda atau server AI sedang lambat, silakan coba beberapa saat lagi.'
        });
      }
      return res.status(502).json({
        error: 'Gagal menghubungi server kecerdasan buatan Gemini. Silakan periksa koneksi internet server.',
        details: networkErr.message
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // Tangani kuota habis atau error dari Gemini
    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text().catch(() => '');
      if (geminiResponse.status === 429 || errText.includes('RESOURCE_EXHAUSTED')) {
        return res.status(429).json({
          error: 'Kuota API kecerdasan buatan sedang mencapai batas. Mohon tunggu beberapa saat dan coba kembali.'
        });
      }
      return res.status(geminiResponse.status).json({
        error: 'Layanan AI mengalami kendala dalam menganalisis foto. Silakan coba kembali nanti.',
        status: geminiResponse.status
      });
    }

    const geminiData = await geminiResponse.json();
    const rawContentText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContentText) {
      return res.status(200).json({
        success: true,
        status: 'uncertain',
        nama_budaya: null,
        keyakinan: 0.0,
        alasan_visual: 'Gambar tidak menghasilkan deteksi visual yang jelas.',
        pesan: 'Belum bisa dipastikan',
        saran: 'Objek budaya dalam foto belum dapat dipastikan. Coba ambil foto dengan sudut berbeda, pencahayaan lebih terang, atau gunakan pencarian manual di Ensiklopedia Budaya.'
      });
    }

    // --------------------------------------------------------------------------
    // G. PARSE JSON DENGAN AMAN & TERAPKAN LOGIKA ANTI-HALUSINASI
    // --------------------------------------------------------------------------
    let parsedResult = null;
    try {
      // Bersihkan kemungkinan markdown code fence jika ada
      let cleanedJson = rawContentText.trim();
      if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
      }
      parsedResult = JSON.parse(cleanedJson);
    } catch (jsonErr) {
      console.warn('[Identify API] Gagal mem-parse JSON hasil model:', jsonErr.message);
      return res.status(200).json({
        success: true,
        status: 'uncertain',
        nama_budaya: null,
        keyakinan: 0.0,
        alasan_visual: 'Format analisis model tidak dapat diproses dengan aman.',
        pesan: 'Belum bisa dipastikan',
        saran: 'Objek budaya belum dapat dipastikan. Silakan coba foto lain atau cari di Ensiklopedia Budaya.'
      });
    }

    const rawBudayaName = parsedResult.nama_budaya || '';
    const rawConfidence = typeof parsedResult.keyakinan === 'number'
      ? parsedResult.keyakinan
      : parseFloat(parsedResult.keyakinan || '0');
    const visualReason = parsedResult.alasan_visual || 'Tidak ada deskripsi visual yang tersedia.';

    // Cocokkan hasil model dengan daftar resmi tertutup artikel budaya kita
    const matchedArticle = matchArticleFromPrediction(rawBudayaName, articles);

    // KETENTUAN ANTI-HALUSINASI (Persyaratan 3):
    // Jika keyakinan < 0.6 atau tidak dikenali, tampilkan 'Belum bisa dipastikan'
    // dan tawarkan pencarian manual di ensiklopedia, jangan menebak!
    if (!matchedArticle || rawConfidence < 0.6 || rawBudayaName.toLowerCase().includes('tidak dikenali')) {
      return res.status(200).json({
        success: true,
        status: 'uncertain',
        nama_budaya: null,
        keyakinan: Math.max(0, Math.min(1, rawConfidence || 0)),
        alasan_visual: visualReason,
        pesan: 'Belum bisa dipastikan',
        saran: 'Objek budaya dalam foto belum dapat dipastikan dengan tingkat keyakinan yang memadai (< 60%). Coba ambil foto dengan sudut berbeda, pencahayaan lebih terang, atau gunakan pencarian manual di Ensiklopedia Budaya.'
      });
    }

    // --------------------------------------------------------------------------
    // H. HASIL TERIDENTIFIKASI (Persyaratan 4: Ringkasan dari DB, bukan AI)
    // --------------------------------------------------------------------------
    return res.status(200).json({
      success: true,
      status: 'identified',
      nama_budaya: matchedArticle.judul,
      slug: matchedArticle.slug,
      kategori: matchedArticle.kategori,
      ringkasan: matchedArticle.ringkasan, // WAJIB dari database artikel, bukan karangan AI
      wilayah: matchedArticle.wilayah || 'Bali',
      gambar_url: matchedArticle.gambar_url,
      tautan_artikel: `/budaya?slug=${matchedArticle.slug}`,
      keyakinan: Math.max(0, Math.min(1, rawConfidence)),
      alasan_visual: visualReason,
      disclaimer: 'Hasil identifikasi dihasilkan oleh kecerdasan buatan (AI) dan dapat keliru. Harap verifikasi keabsahan informasi dengan membaca literatur budaya atau berkonsultasi dengan tokoh adat lokal.'
    });

  } catch (err) {
    console.error('[Identify Culture API] Terjadi kesalahan tak terduga:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan sistem internal saat memproses foto.',
      details: err.message
    });
  }
}
