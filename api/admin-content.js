/**
 * Serverless Function: /api/admin-content
 * Mengelola Operasi CRUD Konten oleh Admin:
 * - Artikel Budaya (Blog/CMS Studio)
 * - Kamus Bahasa Bali
 * - Tata Bahasa Bali (Balinese Grammar)
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

function getSupabaseClient(req) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  const authHeader = req.headers['authorization'];
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

  const options = { auth: { persistSession: false } };
  if (token && (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.VITE_SUPABASE_ANON_KEY)) {
    options.global = {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  return createClient(url, key, options);
}

export default async function handler(req, res) {
  ensureEnvLoaded();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const adminPasskey = process.env.ADMIN_SECRET_KEY || 'tobal2026';
  const providedKey = req.headers['x-admin-key'] || req.headers['X-Admin-Key'];

  if (providedKey !== adminPasskey) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ error: 'Akses ditolak: Passkey Admin tidak valid.' });
    }
  }

  const supabase = getSupabaseClient(req);
  if (!supabase) {
    return res.status(500).json({ error: 'Koneksi database Supabase belum dikonfigurasi.' });
  }

  const body = await readBody(req);
  const { action } = body;

  try {
    // ============================================================================
    // A. KELOLA ENSIKLOPEDIA BUDAYA (BLOG / CMS)
    // ============================================================================
    if (action === 'save_culture') {
      const {
        id,
        judul,
        slug,
        kategori,
        ringkasan,
        isi_markdown,
        gambar_url,
        wilayah,
        nama_alternatif,
        diterbitkan = true
      } = body.article || {};

      if (!judul || !ringkasan || !isi_markdown) {
        return res.status(400).json({ error: 'Judul, ringkasan, dan isi artikel wajib diisi.' });
      }

      const generatedSlug = (slug || judul)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const payload = {
        judul,
        slug: generatedSlug,
        kategori: kategori || 'tradisi',
        ringkasan,
        isi_markdown,
        gambar_url: gambar_url || 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
        wilayah: wilayah || 'Seluruh Bali',
        nama_alternatif: Array.isArray(nama_alternatif) ? nama_alternatif : (nama_alternatif ? [nama_alternatif] : []),
        diterbitkan: Boolean(diterbitkan)
      };

      let result = null;
      if (id) {
        // Update
        const { data, error } = await supabase
          .from('culture_articles')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('culture_articles')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return res.status(200).json({
        success: true,
        message: 'Artikel budaya berhasil disimpan ke database!',
        data: result
      });
    }

    if (action === 'delete_culture') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'ID artikel budaya wajib disertakan.' });

      const { error } = await supabase.from('culture_articles').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Artikel budaya berhasil dihapus.' });
    }

    // ============================================================================
    // B. KELOLA KAMUS BAHASA BALI
    // ============================================================================
    if (action === 'save_dictionary') {
      const {
        id,
        kata,
        arti_indonesia,
        arti_inggris,
        kelas_kata,
        tingkat,
        contoh_bali,
        contoh_terjemahan,
        padanan_tingkat,
        catatan,
        sumber
      } = body.word || {};

      if (!kata || !arti_indonesia) {
        return res.status(400).json({ error: 'Kata Bali dan arti Indonesia wajib diisi.' });
      }

      const payload = {
        kata: kata.trim(),
        arti_indonesia: arti_indonesia.trim(),
        arti_inggris: arti_inggris?.trim() || null,
        kelas_kata: kelas_kata || 'p',
        tingkat: tingkat || 'umum',
        contoh_bali: contoh_bali?.trim() || null,
        contoh_terjemahan: contoh_terjemahan?.trim() || null,
        padanan_tingkat: Array.isArray(padanan_tingkat) ? padanan_tingkat : (padanan_tingkat ? [padanan_tingkat] : null),
        catatan: catatan?.trim() || null,
        sumber: sumber?.trim() || '[Diverifikasi Admin Tobal]'
      };

      let result = null;
      if (id && !id.startsWith('k')) { // Jika ID UUID supabase
        const { data, error } = await supabase
          .from('dictionary')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('dictionary')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return res.status(200).json({
        success: true,
        message: 'Kosakata kamus berhasil disimpan ke database!',
        data: result
      });
    }

    if (action === 'delete_dictionary') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'ID kosakata wajib disertakan.' });

      const { error } = await supabase.from('dictionary').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Kosakata kamus berhasil dihapus.' });
    }

    // ============================================================================
    // C. KELOLA TATA BAHASA BALI (BALINESE GRAMMAR)
    // ============================================================================
    if (action === 'save_grammar') {
      const {
        id,
        judul,
        slug,
        kategori,
        tingkat,
        ringkasan,
        penjelasan_markdown,
        pola_rumus,
        contoh_kalimat,
        urutan = 0,
        diterbitkan = true
      } = body.grammar || {};

      if (!judul || !ringkasan || !penjelasan_markdown) {
        return res.status(400).json({ error: 'Judul, ringkasan, dan penjelasan tata bahasa wajib diisi.' });
      }

      const generatedSlug = (slug || judul)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const payload = {
        judul,
        slug: generatedSlug,
        kategori: kategori || 'sor-singgih',
        tingkat: tingkat || 'semua tingkatan',
        ringkasan,
        penjelasan_markdown,
        pola_rumus: pola_rumus || null,
        contoh_kalimat: Array.isArray(contoh_kalimat) ? contoh_kalimat : [],
        urutan: parseInt(urutan, 10) || 0,
        diterbitkan: Boolean(diterbitkan)
      };

      let result = null;
      if (id && !id.startsWith('g')) {
        const { data, error } = await supabase
          .from('balinese_grammar')
          .update(payload)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('balinese_grammar')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      return res.status(200).json({
        success: true,
        message: 'Materi tata bahasa Bali berhasil disimpan ke database!',
        data: result
      });
    }

    if (action === 'delete_grammar') {
      const { id } = body;
      if (!id) return res.status(400).json({ error: 'ID materi tata bahasa wajib disertakan.' });

      const { error } = await supabase.from('balinese_grammar').delete().eq('id', id);
      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Materi tata bahasa berhasil dihapus.' });
    }

    return res.status(400).json({ error: `Aksi ${action} tidak dikenali.` });

  } catch (err) {
    console.error('[Admin Content API Error]:', err);
    return res.status(500).json({
      error: `Gagal memproses data di database: ${err.message}`,
      hint: 'Jika tabel di Supabase belum dibuat, jalankan file SQL migrasi di tab Konfigurasi.'
    });
  }
}
