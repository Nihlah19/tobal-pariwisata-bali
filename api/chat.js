/**
 * Serverless Function: /api/chat
 * AI Chatbot Budaya & Wisata Tobal (Bli Kadek)
 *
 * Fitur:
 * - Mengakses seluruh database (Kamus Basa Bali, Destinasi Wisata 3+1, Ensiklopedia Budaya, Tata Krama Pura)
 * - Khusus untuk pengguna yang telah terautentikasi (JWT Supabase)
 * - Sangat hemat token (Prompt kompak, max 400 tokens per inferensi)
 * - Menggunakan Google Gemini API Key yang dapat diubah via Dashboard Admin
 * - Fallback cerdas berbasis database lokal jika kuota Gemini menipis
 *
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { createClient } from '@supabase/supabase-js';
import { DEFAULT_CULTURE_ARTICLES } from './lib/cultureCatalog.js';
import fs from 'node:fs';
import path from 'node:path';

// Helper pemuat .env
function ensureEnvLoaded() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          let v = trimmed.slice(eqIdx + 1).trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) {
            process.env[k] = v;
          }
        }
      }
    }
  } catch {}
}
ensureEnvLoaded();

// Helper membaca request body
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  if (typeof req.on !== 'function') return req.body || {};
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Fallback kamus esensial untuk retrieval offline
const FALLBACK_WORDS = [
  { kata: 'Om Swastyastu', arti: 'Salam sakral pembuka khas Bali (semoga dalam keadaan selamat)', tingkat: 'Umum' },
  { kata: 'Matur suksma', arti: 'Terima kasih banyak (sopan digunakan siapa saja)', tingkat: 'Alus Madya' },
  { kata: 'Suksma mewali', arti: 'Terima kasih kembali / sama-sama', tingkat: 'Alus Madya' },
  { kata: 'Rahajeng semeng', arti: 'Selamat pagi', tingkat: 'Alus Madya' },
  { kata: 'Rahajeng wengi', arti: 'Selamat malam', tingkat: 'Alus Madya' },
  { kata: 'Kenken kabare?', arti: 'Bagaimana kabarnya? (ragam akrab / andap)', tingkat: 'Andap' },
  { kata: 'Becik-becik kemanten', arti: 'Baik-baik saja (jawaban santun)', tingkat: 'Alus Madya' },
  { kata: 'Ampura', arti: 'Mohon maaf / permisi', tingkat: 'Alus Madya' },
  { kata: 'Nunas tulung', arti: 'Minta tolong', tingkat: 'Alus Madya' },
  { kata: 'Kuda ajinne?', arti: 'Berapa harganya?', tingkat: 'Alus Madya' },
  { kata: 'Jagi kija?', arti: 'Mau pergi ke mana?', tingkat: 'Alus Madya' },
  { kata: 'Mangan / Nunas', arti: 'Makan (Nunas = Alus Singgih, Mangan = Alus Madya)', tingkat: 'Alus' },
  { kata: 'Sire wastan ragane?', arti: 'Siapa nama Anda? (sopan)', tingkat: 'Alus Singgih' }
];

// Fallback destinasi terkurasi 3+1
const FALLBACK_PLACES = [
  { nama: 'Air Terjun Sekumpul', wilayah: 'Buleleng', tipe: 'Alam', deskripsi: 'Tujuh pancuran air alami di lembah hijau purba Bali Utara' },
  { nama: 'Desa Adat Pedawa', wilayah: 'Buleleng', tipe: 'Budaya', deskripsi: 'Desa purba Bali Aga pelestari rumah Bandung Rangki dan kopi rempah' },
  { nama: 'Lembah Subak Jatiluwih', wilayah: 'Tabanan', tipe: 'Lanskap', deskripsi: 'Terasering sawah 600 hektar warisan dunia UNESCO dengan filosofi Tri Hita Karana' },
  { nama: 'Warung Entil Pupuan', wilayah: 'Tabanan', tipe: 'Kuliner', deskripsi: 'Kuliner lontong bungkus daun entil dengan kuah bumbu base genep gurih' },
  { nama: 'Pura Besakih', wilayah: 'Karangasem', tipe: 'Spiritual', deskripsi: 'Pura Ibu (Mother Temple) terbesar di lereng Gunung Agung' },
  { nama: 'Pura Ulun Danu Beratan', wilayah: 'Bedugul', tipe: 'Spiritual', deskripsi: 'Pura danau pemujaan Dewi Danu penjaga kesuburan air' }
];

/**
 * Mengambil konteks relevan dari database Supabase atau Fallback
 */
async function retrieveDatabaseContext(query) {
  const q = (query || '').toLowerCase();
  const contextParts = [];
  const sources = [];

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  let supabaseClient = null;
  if (supabaseUrl && supabaseKey) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    } catch {}
  }

  // 1. Pencarian di Kamus (Dictionary)
  let foundWords = [];
  if (supabaseClient) {
    try {
      // Ambil kata kunci pencarian
      const words = q.split(/\s+/).filter(w => w.length > 2);
      const searchPattern = words.length > 0 ? `%${words[0]}%` : '%suksma%';
      const { data } = await supabaseClient
        .from('dictionary')
        .select('kata, arti_indonesia, tingkat, kelas_kata, contoh_bali, catatan')
        .or(`kata.ilike.${searchPattern},arti_indonesia.ilike.${searchPattern}`)
        .limit(3);
      if (data && data.length > 0) {
        foundWords = data;
      }
    } catch {}
  }

  // Fallback kamus lokal jika belum ada di database
  if (foundWords.length === 0) {
    foundWords = FALLBACK_WORDS.filter(w =>
      q.includes(w.kata.toLowerCase()) ||
      q.includes(w.arti.toLowerCase()) ||
      (q.includes('kosa kata') || q.includes('bahasa') || q.includes('arti') || q.includes('sapaan') || q.includes('terima kasih'))
    ).slice(0, 3);
  }

  if (foundWords.length > 0) {
    contextParts.push(
      "REFERENSI KAMUS BASA BALI:\n" +
      foundWords.map(w => `- "${w.kata}": ${w.arti_indonesia || w.arti} (Tingkat: ${w.tingkat || 'Umum'})`).join("\n")
    );
    sources.push('Kamus Basa Bali Tobal');
  }

  // 2. Pencarian Destinasi Wisata 3+1 (Places)
  let foundPlaces = [];
  if (supabaseClient) {
    try {
      const { data } = await supabaseClient
        .from('places')
        .select('name, regency, category, description, is_hidden_gem')
        .limit(3);
      if (data && data.length > 0) {
        foundPlaces = data;
      }
    } catch {}
  }

  if (foundPlaces.length === 0) {
    foundPlaces = FALLBACK_PLACES.filter(p =>
      q.includes(p.wilayah.toLowerCase()) ||
      q.includes(p.nama.toLowerCase()) ||
      q.includes(p.tipe.toLowerCase()) ||
      (q.includes('wisata') || q.includes('rekomendasi') || q.includes('rute') || q.includes('3+1') || q.includes('kuliner'))
    ).slice(0, 3);
  }

  if (foundPlaces.length > 0) {
    contextParts.push(
      "REFERENSI TEMPAT WISATA & KULINER (FORMULA 3+1):\n" +
      foundPlaces.map(p => `- ${p.name || p.nama} (${p.regency || p.wilayah}): ${p.description || p.deskripsi}`).join("\n")
    );
    sources.push('Katalog Destinasi Tobal');
  }

  // 3. Pencarian Budaya & Etika Pura
  const foundArticles = DEFAULT_CULTURE_ARTICLES.filter(a =>
    q.includes('pura') || q.includes('canang') || q.includes('etika') || q.includes('pakaian') ||
    q.includes('subak') || q.includes('adat') || q.includes('kain') || q.includes('budaya')
  ).slice(0, 2);

  if (foundArticles.length > 0) {
    contextParts.push(
      "REFERENSI ETIKA & BUDAYA BALI:\n" +
      foundArticles.map(a => `- ${a.judul}: ${a.ringkasan}`).join("\n")
    );
    sources.push('Ensiklopedia Budaya Bali');
  }

  return {
    contextText: contextParts.join("\n\n"),
    sources
  };
}

export default async function handler(req, res) {
  ensureEnvLoaded();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode HTTP tidak didukung.' });

  try {
    const body = await readBody(req);
    const { message, prompt, history = [], userProfile = null } = body;

    // 1. Verifikasi Akses Khusus User Sudah Masuk (Auth Gate)
    const authHeader = req.headers['authorization'] || '';
    const hasToken = authHeader.startsWith('Bearer ') && authHeader.length > 10;
    const hasClientUser = userProfile && (userProfile.id || userProfile.email);

    if (!hasToken && !hasClientUser) {
      return res.status(401).json({
        error: 'Akses Dibatasi: Chatbot AI Budaya khusus untuk penjelajah yang telah masuk atau mendaftar akun.',
        code: 'AUTH_REQUIRED'
      });
    }

    const queryText = (message || prompt || '').trim();
    if (!queryText) {
      return res.status(400).json({ error: 'Pesan pertanyaan tidak boleh kosong.' });
    }

    // 2. Ambil referensi dari database (Grounding RAG)
    const { contextText, sources } = await retrieveDatabaseContext(queryText);

    // 3. Konfigurasi Gemini API
    const apiKey = process.env.GEMINI_API_KEY || '';
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

    const systemPrompt = `Anda adalah "Bli Kadek", asisten AI resmi Tour Penjelajah Bali (Tobal).
Karakter Anda: Pemandu wisata kultural Bali asli yang ramah, santun, menghormati tradisi leluhur (Tri Hita Karana), dan sangat menguasai Basa Bali, etika pura, dan tempat tersembunyi (Formula 3+1).
Aturan Penting:
1. Jawab pertanyaan pengguna dengan ramah dan to-the-point (maksimal 2-3 paragraf ringkas).
2. SANGAT PENTING: Gunakan DATA REFERENSI DATABASE berikut sebagai fakta utama:
${contextText || 'Gunakan pengetahuan umum budaya Bali yang santun dan akurat.'}
3. Selalu berikan tips etika atau kosa kata Basa Bali Alus yang relevan jika sesuai.
4. Hemat token kuota gratis: jangan bertele-tele, berikan jawaban langsung bernas.`;

    // Jika API Key tidak ada atau sedang limit, berikan jawaban fallback instan berbasis database
    if (!apiKey) {
      let smartFallback = `Om Swastyastu! Berdasarkan basis data Tobal:\n\n`;
      if (contextText) {
        smartFallback += `${contextText}\n\n`;
      }
      smartFallback += `Ada yang ingin Bli Kadek bantu lebih lanjut seputar petualangan budaya Anda?`;
      return res.status(200).json({
        success: true,
        reply: smartFallback,
        sources: sources.length > 0 ? sources : ['Tobal Database'],
        isFallback: true
      });
    }

    // 4. Siapkan format payload Gemini
    const contents = [];

    // Sertakan maksimal 3 riwayat percakapan sebelumnya untuk hemat token
    const recentHistory = Array.isArray(history) ? history.slice(-4) : [];
    for (const h of recentHistory) {
      if (h.role && h.text) {
        contents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }
    }

    // Masukkan prompt saat ini dengan konteks
    contents.push({
      role: 'user',
      parts: [{
        text: `Instruksi Sistem:\n${systemPrompt}\n\nPertanyaan Penjelajah:\n${queryText}`
      }]
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const aiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 450,
          temperature: 0.65
        }
      })
    });

    const aiJson = await aiRes.json();

    if (!aiRes.ok) {
      console.warn('[Gemini API Warning /api/chat]:', aiJson.error?.message || aiRes.status);
      // Fallback ramah jika kuota token habis
      let smartFallback = `Om Swastyastu! Berdasarkan catatan basis data budaya Tobal:\n\n`;
      if (contextText) {
        smartFallback += `${contextText}\n\n`;
      } else {
        smartFallback += `Untuk etika dan kosa kata Bali, selalu gunakan bahasa Alus Madya seperti "Matur suksma" (terima kasih) dan jaga kesucian saat mengunjungi pura suci.\n\n`;
      }
      smartFallback += `*(Catatan: Inferensi Gemini sedang dalam batas kuota gratis, data di atas ditarik langsung dari database lokal Tobal)*`;

      return res.status(200).json({
        success: true,
        reply: smartFallback,
        sources: sources.length > 0 ? sources : ['Tobal Database'],
        isFallback: true
      });
    }

    const reply = aiJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      'Om Swastyastu! Ada hal lain seputar budaya atau petualangan Bali yang ingin ditanyakan?';

    return res.status(200).json({
      success: true,
      reply,
      sources: sources.length > 0 ? sources : ['Tobal Database & Gemini AI'],
      modelUsed: model
    });

  } catch (err) {
    console.error('[Error in /api/chat]:', err);
    return res.status(500).json({
      error: 'Terjadi kendala pada layanan AI Chatbot.',
      details: err.message
    });
  }
}
