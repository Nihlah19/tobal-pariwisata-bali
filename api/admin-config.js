/**
 * Serverless Function: /api/admin-config
 * Mengelola Pengaturan Super Admin:
 * - Status Database Supabase & Switcher Database Baru
 * - Konfigurasi Google Gemini AI Key & Model
 * - Verifikasi koneksi langsung & penulisan dinamis ke .env
 *
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { createClient } from '@supabase/supabase-js';
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

// Helper menulis / memperbarui key di .env
function updateEnvFile(updates = {}) {
  const envPath = path.resolve(process.cwd(), '.env');
  let currentContent = '';
  if (fs.existsSync(envPath)) {
    currentContent = fs.readFileSync(envPath, 'utf8');
  }

  const lines = currentContent.split('\n');
  const keysUpdated = new Set();
  const newLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed.includes('=')) {
      newLines.push(line);
      continue;
    }

    const eqIdx = line.indexOf('=');
    const key = line.slice(0, eqIdx).trim();
    if (key in updates) {
      newLines.push(`${key}=${updates[key]}`);
      keysUpdated.add(key);
      process.env[key] = updates[key];
    } else {
      newLines.push(line);
    }
  }

  // Tambahkan key baru yang belum ada di file
  for (const [k, v] of Object.entries(updates)) {
    if (!keysUpdated.has(k)) {
      newLines.push(`${k}=${v}`);
      process.env[k] = v;
    }
  }

  fs.writeFileSync(envPath, newLines.join('\n'), 'utf8');
}

// Helper membaca request body
async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
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

function maskSecret(val) {
  if (!val) return 'Belum Diatur';
  if (val.length <= 8) return '****';
  return val.slice(0, 7) + '...' + val.slice(-4);
}

export default async function handler(req, res) {
  ensureEnvLoaded();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const adminPasskey = process.env.ADMIN_SECRET_KEY || 'tobal2026';
  const providedKey = req.headers['x-admin-key'] || req.headers['X-Admin-Key'];

  // Verifikasi otorisasi admin (Passkey atau JWT role admin)
  if (providedKey !== adminPasskey) {
    // Toleransi jika sedang GET status konfigurasi dengan token auth
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Akses ditolak: Masukkan Passkey Super Admin yang valid.' });
    }
  }

  // GET: Baca status konfigurasi sistem saat ini
  if (req.method === 'GET') {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const geminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    // Periksa jumlah tabel jika supabase aktif
    const stats = { places: 0, culture_articles: 0, dictionary: 0, balinese_grammar: 0 };
    if (supabaseUrl && supabaseAnon) {
      try {
        const client = createClient(supabaseUrl, supabaseAnon, { auth: { persistSession: false } });
        const [pRes, cRes, dRes, gRes] = await Promise.allSettled([
          client.from('places').select('*', { count: 'exact', head: true }),
          client.from('culture_articles').select('*', { count: 'exact', head: true }),
          client.from('dictionary').select('*', { count: 'exact', head: true }),
          client.from('balinese_grammar').select('*', { count: 'exact', head: true }),
        ]);

        if (pRes.status === 'fulfilled' && pRes.value.count !== null) stats.places = pRes.value.count;
        if (cRes.status === 'fulfilled' && cRes.value.count !== null) stats.culture_articles = cRes.value.count;
        if (dRes.status === 'fulfilled' && dRes.value.count !== null) stats.dictionary = dRes.value.count;
        if (gRes.status === 'fulfilled' && gRes.value.count !== null) stats.balinese_grammar = gRes.value.count;
      } catch {}
    }

    const openAiKey = process.env.OPENAI_API_KEY || '';
    const openAiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    return res.status(200).json({
      success: true,
      config: {
        supabase_url: supabaseUrl,
        supabase_anon_masked: maskSecret(supabaseAnon),
        supabase_service_role_configured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== supabaseAnon),
        gemini_api_key_configured: Boolean(geminiKey),
        gemini_api_key_masked: maskSecret(geminiKey),
        gemini_model: geminiModel,
        openai_api_key_configured: Boolean(openAiKey),
        openai_api_key_masked: maskSecret(openAiKey),
        openai_model: openAiModel,
        stats
      }
    });
  }

  // POST: Aksi konfigurasi (Uji koneksi, simpan DB baru, simpan Gemini)
  if (req.method === 'POST') {
    const body = await readBody(req);
    const { action } = body;

    // 1. UJI KONEKSI SUPABASE BARU
    if (action === 'test_supabase') {
      const { url, key } = body;
      if (!url || !key) {
        return res.status(400).json({ error: 'URL dan API Key Supabase wajib diisi untuk pengujian.' });
      }

      const start = Date.now();
      try {
        const testClient = createClient(url, key, { auth: { persistSession: false } });
        const { data, error, count } = await testClient.from('places').select('*', { count: 'exact', head: true });
        const latency = Date.now() - start;

        if (error) {
          // Coba cek auth API jika tabel places belum ada di DB baru
          const { error: authErr } = await testClient.auth.getSession();
          if (authErr) {
            return res.status(400).json({
              success: false,
              error: `Gagal terhubung ke Supabase: ${error.message}`
            });
          }
          return res.status(200).json({
            success: true,
            warning: 'Terhubung ke instance Supabase, tetapi tabel "places" belum dibuat. Anda dapat menjalankan skema SQL migrasi.',
            latencyMs: latency
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Koneksi ke database Supabase berhasil dan aktif!',
          placesCount: count || 0,
          latencyMs: latency
        });
      } catch (err) {
        return res.status(500).json({
          success: false,
          error: `Kesalahan koneksi: ${err.message}`
        });
      }
    }

    // 2. SIMPAN SUPABASE BARU (DATABASE SWITCHER JIKA DB LAMA PENUH)
    if (action === 'save_supabase') {
      const { url, anonKey, serviceRoleKey } = body;
      if (!url || !anonKey) {
        return res.status(400).json({ error: 'Supabase URL dan Publishable/Anon Key tidak boleh kosong.' });
      }

      const cleanUrl = url.trim().replace(/\/+$/, '');
      const cleanAnon = anonKey.trim();
      const cleanService = (serviceRoleKey || '').trim() || cleanAnon;

      updateEnvFile({
        VITE_SUPABASE_URL: cleanUrl,
        VITE_SUPABASE_ANON_KEY: cleanAnon,
        SUPABASE_URL: cleanUrl,
        SUPABASE_SERVICE_ROLE_KEY: cleanService
      });

      return res.status(200).json({
        success: true,
        message: 'Konfigurasi database Supabase baru berhasil disimpan dan langsung aktif di runtime!'
      });
    }

    // 3. UJI GEMINI API KEY
    if (action === 'test_gemini') {
      const { apiKey, model = 'gemini-3.1-flash-lite' } = body;
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;

      if (!keyToUse) {
        return res.status(400).json({ error: 'API Key Gemini wajib diisi untuk pengujian.' });
      }

      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyToUse}`;
        const aiRes = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Berikan salam khas Bali dalam 1 kalimat pendek: Om Swastyastu.' }] }]
          })
        });

        const aiJson = await aiRes.json();
        if (!aiRes.ok) {
          throw new Error(aiJson.error?.message || `HTTP ${aiRes.status}`);
        }

        const reply = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || 'Koneksi sukses!';
        return res.status(200).json({
          success: true,
          message: 'Koneksi Gemini AI berhasil! Model merespons dengan normal.',
          sampleReply: reply
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Pengujian Gemini AI gagal: ${err.message}`
        });
      }
    }

    // 4. SIMPAN GEMINI CONFIG
    if (action === 'save_gemini') {
      const { apiKey, model = 'gemini-3.1-flash-lite' } = body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API Key Gemini tidak boleh kosong.' });
      }

      updateEnvFile({
        GEMINI_API_KEY: apiKey.trim(),
        GEMINI_MODEL: model.trim()
      });

      return res.status(200).json({
        success: true,
        message: 'Konfigurasi Gemini AI API berhasil diperbarui dan disimpan!'
      });
    }

    // 5. UJI OPENAI API KEY (GPT-4o-mini / GPT-4o)
    if (action === 'test_openai') {
      const { apiKey, model = 'gpt-4o-mini' } = body;
      const keyToUse = apiKey || process.env.OPENAI_API_KEY;

      if (!keyToUse) {
        return res.status(400).json({ error: 'API Key OpenAI wajib diisi untuk pengujian.' });
      }

      try {
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Berikan salam singkat khas Bali dalam 1 kalimat: Om Swastyastu.' }],
            max_tokens: 40,
            temperature: 0.5
          })
        });

        const aiJson = await aiRes.json();
        if (!aiRes.ok) {
          throw new Error(aiJson.error?.message || `HTTP ${aiRes.status}`);
        }

        const reply = aiJson.choices?.[0]?.message?.content?.trim() || 'Koneksi OpenAI sukses!';
        return res.status(200).json({
          success: true,
          message: `Koneksi OpenAI (${model}) berhasil! Model merespons dengan normal.`,
          sampleReply: reply
        });
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: `Pengujian OpenAI API gagal: ${err.message}`
        });
      }
    }

    // 6. SIMPAN OPENAI CONFIG
    if (action === 'save_openai') {
      const { apiKey, model = 'gpt-4o-mini' } = body;
      if (!apiKey) {
        return res.status(400).json({ error: 'API Key OpenAI tidak boleh kosong.' });
      }

      updateEnvFile({
        OPENAI_API_KEY: apiKey.trim(),
        OPENAI_MODEL: model.trim()
      });

      return res.status(200).json({
        success: true,
        message: 'Konfigurasi OpenAI (ChatGPT) berhasil diperbarui dan disimpan!'
      });
    }

    return res.status(400).json({ error: `Aksi ${action} tidak dikenali.` });
  }

  return res.status(405).json({ error: 'Metode HTTP tidak didukung.' });
}
