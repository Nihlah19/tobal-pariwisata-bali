/**
 * Serverless Function: /api/recommend
 * Rekomendasi Paket Petualangan Bali (Content-Based Filtering)
 *
 * INPUT: Supabase JWT di Header Authorization (Bearer <token>)
 * OUTPUT: JSON Paket Petualangan (3 wisata + 1 kuliner) yang disimpan ke trips & trip_items
 */

import { createClient } from '@supabase/supabase-js';
import { recommendPackage } from './lib/recommender.js';
import fs from 'node:fs';
import path from 'node:path';

// Helper pemuat fallback .env lokal jika dijalankan di Node langsung
function ensureEnvLoaded() {
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY)) {
    return;
  }
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

// Rate Limiter: Maksimal 30 permintaan rekomendasi / jam / pengguna
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MAX_RECOMMEND_PER_WINDOW = 30;
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (timestamps.length >= MAX_RECOMMEND_PER_WINDOW) {
    const oldest = timestamps[0];
    const resetSeconds = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, resetSeconds };
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return { allowed: true };
}

export default async function handler(req, res) {
  // Pastikan variabel environment termutakhir terbaca
  ensureEnvLoaded();

  // Security & CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Hanya menerima metode POST (atau GET untuk kemudahan pengujian terautentikasi)
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['POST', 'GET', 'OPTIONS']);
    return res.status(405).json({ error: `Metode ${req.method} tidak diizinkan. Gunakan POST.` });
  }

  try {
    // 1. VERIFIKASI AUTHENTICATION DARI HEADER
    // Jangan pernah percaya user_id dari request body untuk keamanan
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

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Konfigurasi server belum lengkap (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diatur).'
      });
    }

    // Inisialisasi Supabase client di serverless function:
    // Jika tidak memiliki SERVICE_ROLE_KEY rahasia (menggunakan anon / publishable key),
    // kita teruskan Authorization header Bearer token pengguna ke Supabase client.
    // Ini mengizinkan PostgreSQL Row Level Security (RLS) beroperasi atas nama auth.uid() = user.id.
    const isServiceRole = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      !process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_publishable_') &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.VITE_SUPABASE_ANON_KEY
    );

    const clientOptions = {
      auth: { persistSession: false }
    };

    if (!isServiceRole && token) {
      clientOptions.global = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
    }

    const supabase = createClient(supabaseUrl, supabaseKey, clientOptions);

    // Verifikasi JWT ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({
        error: 'Sesi tidak valid atau telah kedaluwarsa. Silakan masuk kembali.'
      });
    }

    const user = authData.user;
    const userId = user.id;

    // Rate Limit Check (Maksimal 30 permintaan per jam per pengguna)
    const rateLimit = checkRateLimit(userId);
    res.setHeader('X-RateLimit-Limit', MAX_RECOMMEND_PER_WINDOW.toString());
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', rateLimit.resetSeconds.toString());
      return res.status(429).json({
        error: `Batas kuota rekomendasi tercapai (maksimal 30 per jam). Silakan coba lagi dalam ${Math.ceil(rateLimit.resetSeconds / 60)} menit.`,
        resetSeconds: rateLimit.resetSeconds
      });
    }

    // 2. AMBIL DATA PROFIL PENGGUNA
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, interests, preferred_regions, budget')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('[Recommend API] Gagal memuat profil:', profileError);
    }

    // Profil fallback jika profil belum diisi lengkap
    const userProfile = profile || {
      interests: ['alam', 'budaya'],
      preferred_regions: [],
      budget: 'menengah'
    };

    // 3. AMBIL RIWAYAT TEMPAT YANG SUDAH DISELESAIKAN OLEH USER
    const { data: completedItems, error: completedError } = await supabase
      .from('trip_items')
      .select('place_id, trips!inner(user_id)')
      .eq('trips.user_id', userId)
      .eq('completed', true);

    if (completedError) {
      console.warn('[Recommend API] Peringatan memuat riwayat completed:', completedError);
    }
    const completedPlaceIds = (completedItems || []).map(item => item.place_id);

    // 4. AMBIL TEMPAT DENGAN RATING USER >= 4 (PREFERENSI IMPLISIT)
    const { data: highReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('place_id, rating')
      .eq('user_id', userId)
      .gte('rating', 4);

    if (reviewsError) {
      console.warn('[Recommend API] Peringatan memuat review:', reviewsError);
    }
    const highRatedPlaceIds = (highReviews || []).map(r => r.place_id);

    // 5. AMBIL SELURUH KATALOG DESTINASI DARI DATABASE
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('*');

    if (placesError || !places || places.length === 0) {
      return res.status(500).json({
        error: 'Gagal mengambil data destinasi tempat dari database.'
      });
    }

    const highRatedPlaces = places.filter(p => highRatedPlaceIds.includes(p.id));

    // 6. PROSES REKOMENDASI CONTENT-BASED FILTERING
    const recommendationResult = recommendPackage(
      userProfile,
      places,
      completedPlaceIds,
      highRatedPlaces
    );

    const selectedPlaces = recommendationResult.package;

    // 7. SIMPAN PAKET PETUALANGAN BARU KE DATABASE (trips + trip_items)
    // A. Buat trip baru berstatus 'aktif'
    const { data: newTrip, error: createTripError } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        status: 'aktif'
      })
      .select()
      .single();

    if (createTripError) {
      console.error('[Recommend API] Gagal membuat trip:', createTripError);
      return res.status(500).json({
        error: `Gagal menyimpan paket petualangan ke database (${createTripError.message}).`
      });
    }

    // B. Masukkan 4 destinasi terpilih ke trip_items
    const tripItemsPayload = selectedPlaces.map((place, index) => ({
      trip_id: newTrip.id,
      place_id: place.id,
      position: place.position || (index + 1),
      completed: false
    }));

    const { error: insertItemsError } = await supabase
      .from('trip_items')
      .insert(tripItemsPayload);

    if (insertItemsError) {
      console.error('[Recommend API] Gagal membuat trip_items:', insertItemsError);
      // Bersihkan trip yang gagal dibuat
      await supabase.from('trips').delete().eq('id', newTrip.id);
      return res.status(500).json({
        error: `Gagal menyimpan rincian tempat petualangan (${insertItemsError.message}).`
      });
    }

    // 8. OUTPUT RESPONSE JSON LENGKAP
    return res.status(200).json({
      success: true,
      trip_id: newTrip.id,
      status: 'aktif',
      created_at: newTrip.created_at,
      reason: recommendationResult.reason,
      package: selectedPlaces.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        category: p.category,
        region: p.region,
        price_level: p.price_level,
        popularity: p.popularity,
        is_viral: p.is_viral,
        description: p.description,
        cultural_note: p.cultural_note,
        image_url: p.image_url,
        lat: p.lat,
        lng: p.lng,
        position: p.position,
        matchPercent: p.matchPercent,
        cosineScore: p.cosineScore,
        noveltyScore: p.noveltyScore,
        finalScore: p.finalScore
      })),
      meta: {
        weights: recommendationResult.weights,
        completed_places_excluded: completedPlaceIds.length,
        total_items: selectedPlaces.length
      }
    });

  } catch (err) {
    console.error('[Recommend API] Terjadi kesalahan tak terduga:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan internal pada sistem rekomendasi AI.',
      details: err.message
    });
  }
}
