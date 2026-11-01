-- ==============================================================================
-- TOUR PENJELAJAH BALI — SKENARIO PENGUJIAN AKUN DEMO & DATA CONTOH
-- Digunakan untuk pengujian otomatis atau manual di Supabase SQL Editor
-- Bali Digifest 2026 (AI Web Innovation Challenge)
-- ==============================================================================

/*
================================================================================
INFORMASI AKUN DEMO (DATA CONTOH NON-PRIBADI):
- Email     : demo.penjelajah@balidigifest.id
- Password  : PenjelajahBali2026!
- Nama      : Wayan Penjelajah Cerdas
- Peran     : Penjelajah Uji Coba

CARA UJI END-TO-END MELALUI WEB UI (DIREKOMENDASIKAN):
1. Buka halaman Masuk: /src/pages/masuk.html
2. Pilih tab "Daftar", masukkan data akun demo di atas.
3. Di halaman Onboarding (/src/pages/onboarding.html):
   - Minat: Wisata Alam & Wisata Budaya
   - Wilayah: Buleleng, Karangasem, Tabanan
   - Anggaran: Sedang
4. Di halaman Petualangan (/src/pages/petualangan.html):
   - Klik "Buat Petualangan Baru" -> Rekomendasi 4 tempat terbuat.
   - Klik "Selesai Jelajah" pada tempat 1..4, berikan rating & ulasan.
   - Pada tempat ke-4, modal perayaan akan muncul otomatis!
5. Di halaman Lencana (/src/pages/lencana.html):
   - Periksa 3 lencana yang terbuka:
     * Penjelajah Pemula (Paket pertama selesai 4/4)
     * Penjelajah Utara (Ada destinasi di Buleleng/Karangasem/Jembrana)
     * Pencari Budaya (Minimal 2 destinasi berkategori budaya)
================================================================================
*/

-- ==============================================================================
-- SIMULASI SQL LANGSUNG (OPSIONAL — JIKA INGIN SIMULASI TANPA BROWSER)
-- ==============================================================================

DO $$
DECLARE
  v_demo_user_id UUID;
  v_trip_id UUID;
  v_item_id UUID;
  v_place_id UUID;
  r RECORD;
BEGIN
  -- 1. Cari user demo di auth.users jika sudah pernah didaftarkan via UI/Auth API
  SELECT id INTO v_demo_user_id
  FROM auth.users
  WHERE email = 'demo.penjelajah@balidigifest.id'
  LIMIT 1;

  IF v_demo_user_id IS NOT NULL THEN
    RAISE NOTICE 'User demo ditemukan: %', v_demo_user_id;

    -- 2. Pastikan profil terisi
    UPDATE public.profiles
    SET
      full_name = 'Wayan Penjelajah Cerdas',
      interests = ARRAY['alam', 'budaya'],
      preferred_regions = ARRAY['Buleleng', 'Karangasem', 'Tabanan'],
      budget = 2,
      onboarding_completed = TRUE
    WHERE id = v_demo_user_id;

    RAISE NOTICE 'Profil demo berhasil disinkronkan.';
  ELSE
    RAISE NOTICE 'Catatan: Akun demo.penjelajah@balidigifest.id belum terdaftar di Auth. Silakan lakukan Sign Up melalui halaman /src/pages/masuk.html terlebih dahulu.';
  END IF;
END $$;

-- ==============================================================================
-- QUERY VERIFIKASI PROGRESS AKUN DEMO
-- Jalankan query di bawah ini untuk memeriksa status terkini akun demo:
-- ==============================================================================

-- 1. Cek Profil & Onboarding
SELECT p.id, p.full_name, p.interests, p.preferred_regions, p.budget, p.onboarding_completed
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'demo.penjelajah@balidigifest.id';

-- 2. Cek Petualangan Aktif / Selesai
SELECT t.id AS trip_id, t.title, t.status, t.completed_items_count, t.total_items_count, t.created_at
FROM public.trips t
JOIN auth.users u ON u.id = t.user_id
WHERE u.email = 'demo.penjelajah@balidigifest.id'
ORDER BY t.created_at DESC;

-- 3. Cek Daftar Tempat dalam Trip & Status Penyelesaiannya
SELECT ti.order_index, pl.name, pl.category, pl.region, ti.completed, ti.completed_at
FROM public.trip_items ti
JOIN public.places pl ON pl.id = ti.place_id
JOIN public.trips t ON t.id = ti.trip_id
JOIN auth.users u ON u.id = t.user_id
WHERE u.email = 'demo.penjelajah@balidigifest.id'
ORDER BY ti.order_index ASC;

-- 4. Cek Lencana yang Berhasil Diperoleh Akun Demo
SELECT b.code, b.title, b.description, ub.unlocked_at
FROM public.user_badges ub
JOIN public.badges b ON b.id = ub.badge_id
JOIN auth.users u ON u.id = ub.user_id
WHERE u.email = 'demo.penjelajah@balidigifest.id'
ORDER BY ub.unlocked_at ASC;
