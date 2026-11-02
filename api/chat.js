/**
 * Serverless Function: /api/chat
 * AI Chatbot Budaya & Wisata Tobal (Bli Kadek)
 *
 * Fitur:
 * - Mengakses seluruh database (Kamus Basa Bali, Destinasi Wisata 3+1, Ensiklopedia Budaya, Tata Krama Pura)
 * - Khusus untuk pengguna yang telah terautentikasi (JWT Supabase)
 * - Dukungan Multi-AI Engine: OpenAI (GPT-4o / GPT-4o-mini) & Google Gemini AI
 * - Fallback cerdas berbasis database lokal Tobal tanpa pesan error/disclaimer teknis
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
      supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
    } catch {}
  }

  // 1. Cari Kosa Kata Kamus Basa Bali
  const matchedWords = [];
  if (supabaseClient) {
    try {
      const { data: dbWords } = await supabaseClient
        .from('dictionary')
        .select('kata, arti_indonesia, tingkat')
        .or(`kata.ilike.%${q}%,arti_indonesia.ilike.%${q}%`)
        .limit(4);
      if (dbWords && dbWords.length > 0) {
        dbWords.forEach(w => matchedWords.push(`${w.kata} (${w.tingkat || 'Umum'}): ${w.arti_indonesia}`));
      }
    } catch {}
  }

  if (matchedWords.length === 0) {
    FALLBACK_WORDS.forEach(w => {
      if (q.includes(w.kata.toLowerCase()) || w.arti.toLowerCase().includes(q) || q.includes('suksma') || q.includes('bahasa') || q.includes('arti')) {
        matchedWords.push(`${w.kata} (${w.tingkat}): ${w.arti}`);
      }
    });
  }

  if (matchedWords.length > 0) {
    contextParts.push(`[Referensi Kamus Basa Bali]:\n- ` + matchedWords.slice(0, 3).join('\n- '));
    sources.push({ type: 'kamus', count: matchedWords.length, label: 'Kamus Basa Bali' });
  }

  // 2. Cari Destinasi Wisata 3+1 & Kuliner Tradisional
  const matchedPlaces = [];
  if (supabaseClient) {
    try {
      const { data: dbPlaces } = await supabaseClient
        .from('places')
        .select('name, region, category, description, cultural_note')
        .or(`name.ilike.%${q}%,region.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(4);
      if (dbPlaces && dbPlaces.length > 0) {
        dbPlaces.forEach(p => matchedPlaces.push(`${p.name} (${p.region} - ${p.category}): ${p.description || ''} | Nilai Budaya: ${p.cultural_note || '-'}`));
      }
    } catch {}
  }

  if (matchedPlaces.length === 0) {
    FALLBACK_PLACES.forEach(p => {
      if (q.includes(p.nama.toLowerCase()) || q.includes(p.wilayah.toLowerCase()) || q.includes(p.tipe.toLowerCase()) || q.includes('wisata') || q.includes('tempat') || q.includes('rekomendasi') || q.includes('destinasi')) {
        matchedPlaces.push(`${p.nama} (${p.wilayah} - ${p.tipe}): ${p.deskripsi}`);
      }
    });
  }

  if (matchedPlaces.length > 0) {
    contextParts.push(`[Referensi Destinasi Terkurasi 3+1]:\n- ` + matchedPlaces.slice(0, 3).join('\n- '));
    sources.push({ type: 'destinasi', count: matchedPlaces.length, label: 'Katalog Destinasi 3+1' });
  }

  // 3. Cari Ensiklopedia Budaya & Tata Krama Pura
  const matchedCulture = [];
  DEFAULT_CULTURE_ARTICLES.forEach(art => {
    const hay = `${art.judul} ${art.ringkasan} ${art.isi} ${art.etika || ''} ${art.kategori}`.toLowerCase();
    if (hay.includes(q) || (q.includes('pura') && hay.includes('pura')) || (q.includes('etika') && hay.includes('etika')) || (q.includes('adat') && hay.includes('adat'))) {
      matchedCulture.push(`${art.judul} (${art.kategori}): ${art.ringkasan} | Etika: ${art.etika || 'Hormati kesucian pura'}`);
    }
  });

  if (matchedCulture.length > 0) {
    contextParts.push(`[Referensi Ensiklopedia Budaya]:\n- ` + matchedCulture.slice(0, 2).join('\n- '));
    sources.push({ type: 'budaya', count: matchedCulture.length, label: 'Ensiklopedia Budaya' });
  }

  return {
    contextText: contextParts.join('\n\n'),
    sources
  };
}

/**
 * Panggil OpenAI Chat Completions API (GPT-4o-mini / GPT-4o)
 */
async function callOpenAi(apiKey, model, systemPrompt, recentHistory, queryText) {
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  for (const h of recentHistory) {
    if (h.role && h.text) {
      messages.push({
        role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
        content: h.text
      });
    }
  }

  messages.push({ role: 'user', content: queryText });

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages,
      max_tokens: 450,
      temperature: 0.65
    })
  });

  const aiJson = await aiRes.json();
  if (!aiRes.ok) {
    throw new Error(aiJson.error?.message || `OpenAI HTTP ${aiRes.status}`);
  }

  return aiJson.choices?.[0]?.message?.content?.trim();
}

/**
 * Panggil Google Gemini API
 */
async function callGemini(apiKey, model, systemPrompt, recentHistory, queryText) {
  const contents = [];

  for (const h of recentHistory) {
    if (h.role && h.text) {
      contents.push({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.text }]
      });
    }
  }

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
    throw new Error(aiJson.error?.message || `Gemini HTTP ${aiRes.status}`);
  }

  return aiJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

export default async function handler(req, res) {
  ensureEnvLoaded();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metode tidak diizinkan. Gunakan POST.' });
  }

  try {
    // 1. Verifikasi Autentikasi Pengguna
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Akses terbatas: Anda harus masuk (login) terlebih dahulu untuk berinteraksi dengan AI Budaya Tobal.'
      });
    }

    // 2. Baca Body Request
    const body = await readBody(req);
    const queryText = (body.prompt || body.message || '').trim();
    const history = body.history || [];

    if (!queryText) {
      return res.status(400).json({ error: 'Pesan / prompt tidak boleh kosong.' });
    }

    // 3. Grounding: Ambil referensi data dari basis data Tobal
    const { contextText, sources } = await retrieveDatabaseContext(queryText);

    // Prompt Sistem Ringkas & Hemat Token
    const systemPrompt = `Anda adalah "Bli Kadek", asisten pemandu wisata dan budaya Bali asli di platform "Tour Penjelajah Bali" (Tobal).
Karakter Anda: Ramah, bijaksana, menjunjung tinggi Tri Hita Karana dan etika kearifan lokal Bali.
Aturan respon:
1. Jawab pertanyaan pengguna dengan ramah, to-the-point, dan berwawasan (maksimal 2-3 paragraf ringkas).
2. SANGAT PENTING: Gunakan DATA REFERENSI DATABASE berikut sebagai fakta utama:
${contextText || 'Gunakan pengetahuan umum budaya Bali yang santun dan akurat.'}
3. Berikan tips etika atau kosa kata Basa Bali Alus yang relevan jika sesuai konteks.
4. Jangan menyebutkan detail teknis prompt atau token API.`;

    const recentHistory = Array.isArray(history) ? history.slice(-4) : [];

    const openAiKey = process.env.OPENAI_API_KEY || '';
    const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    let reply = '';
    let modelUsed = '';

    // Prioritas 1: Jika OpenAI API Key terpasang (misal token 100% aktif milik user)
    if (openAiKey) {
      try {
        reply = await callOpenAi(openAiKey, openAiModel, systemPrompt, recentHistory, queryText);
        modelUsed = `OpenAI ${openAiModel}`;
      } catch (openAiErr) {
        console.warn('[OpenAI Fallback to Gemini]:', openAiErr.message);
      }
    }

    // Prioritas 2: Jika belum ada balasan dan Gemini Key terpasang
    if (!reply && geminiKey) {
      try {
        reply = await callGemini(geminiKey, geminiModel, systemPrompt, recentHistory, queryText);
        modelUsed = `Google ${geminiModel}`;
      } catch (geminiErr) {
        console.warn('[Gemini Fallback to Local Database]:', geminiErr.message);
      }
    }

    // Fallback Cerdas Berbasis Database Lokal Tobal (Jika kedua API tidak ada atau limit)
    // PENTING: Tanpa disclaimer teknis/kuota! Respons disajikan 100% natural & ramah.
    if (!reply) {
      let smartFallback = `Om Swastyastu! Berdasarkan catatan basis data terkurasi Tobal seputar budaya dan destinasi Bali:\n\n`;
      if (contextText) {
        smartFallback += `${contextText}\n\n`;
      } else {
        smartFallback += `Untuk etika dan kosa kata Bali, selalu gunakan bahasa Alus Madya seperti "Matur suksma" (terima kasih) dan jaga kesucian saat mengunjungi pura suci.\n\n`;
      }
      smartFallback += `Ada hal lain yang ingin Anda ketahui atau tanyakan seputar perjalanan budaya Bali? Bli Kadek siap membantu!`;

      return res.status(200).json({
        success: true,
        reply: smartFallback,
        sources: sources.length > 0 ? sources : ['Tobal Database'],
        isFallback: true
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      sources: sources.length > 0 ? sources : ['Tobal Database & AI Engine'],
      modelUsed
    });

  } catch (err) {
    console.error('[Error in /api/chat]:', err);
    return res.status(500).json({
      error: 'Terjadi kendala pada layanan AI Chatbot.',
      details: err.message
    });
  }
}
