-- ==============================================================================
-- Tour Penjelajah Bali — Server-Side Completion & Badge Logic
-- Fungsi Atomic: complete_trip_item
-- Mencegah bypass RLS, menandai selesai hanya trip milik user yang login,
-- dan memberikan badge secara otomatis di tingkat database.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.complete_trip_item(
  p_trip_item_id uuid,
  p_rating int DEFAULT NULL,
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_trip_id uuid;
  v_place_id uuid;
  v_all_completed boolean := false;
  v_newly_awarded jsonb := '[]'::jsonb;
  v_has_north boolean := false;
  v_culture_count int := 0;
  v_badge_pemula_id uuid;
  v_badge_utara_id uuid;
  v_badge_budaya_id uuid;
  v_inserted_id uuid;
BEGIN
  -- 1. Verifikasi Autentikasi Pengguna
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Pengguna harus terautentikasi' USING ERRCODE = '42501';
  END IF;

  -- 2. Verifikasi Kepemilikan: trip_item harus milik trip milik user_id (anti-bypass RLS)
  SELECT ti.trip_id, ti.place_id
  INTO v_trip_id, v_place_id
  FROM public.trip_items ti
  JOIN public.trips t ON t.id = ti.trip_id
  WHERE ti.id = p_trip_item_id AND t.user_id = v_user_id;

  IF v_trip_id IS NULL THEN
    RAISE EXCEPTION 'Akses ditolak: Item petualangan tidak ditemukan atau bukan milik Anda' USING ERRCODE = '42501';
  END IF;

  -- 3. Tandai trip_item sebagai selesai
  UPDATE public.trip_items
  SET completed = true,
      completed_at = COALESCE(completed_at, now())
  WHERE id = p_trip_item_id;

  -- 4. Simpan ulasan jika rating valid (1-5) diberikan
  IF p_rating IS NOT NULL AND p_rating BETWEEN 1 AND 5 THEN
    INSERT INTO public.reviews (user_id, place_id, rating, comment, created_at)
    VALUES (v_user_id, v_place_id, p_rating, p_comment, now())
    ON CONFLICT (user_id, place_id)
    DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now();
  END IF;

  -- 5. Periksa apakah seluruh 4 destinasi di paket trip ini sudah selesai
  IF NOT EXISTS (
    SELECT 1 FROM public.trip_items
    WHERE trip_id = v_trip_id AND completed = false
  ) THEN
    v_all_completed := true;

    -- Update status trip menjadi selesai
    UPDATE public.trips
    SET status = 'selesai',
        completed_at = COALESCE(completed_at, now())
    WHERE id = v_trip_id;

    -- Dapatkan ID badge master
    SELECT id INTO v_badge_pemula_id FROM public.badges WHERE code = 'penjelajah-pemula';
    SELECT id INTO v_badge_utara_id FROM public.badges WHERE code = 'penjelajah-utara';
    SELECT id INTO v_badge_budaya_id FROM public.badges WHERE code = 'pencari-budaya';

    -- A. ATURAN BADGE 1: 'Penjelajah Pemula'
    -- Diberikan saat paket pertama diselesaikan
    IF v_badge_pemula_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id, trip_id, earned_at)
      VALUES (v_user_id, v_badge_pemula_id, v_trip_id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING
      RETURNING id INTO v_inserted_id;

      IF v_inserted_id IS NOT NULL THEN
        v_newly_awarded := v_newly_awarded || jsonb_build_object(
          'code', 'penjelajah-pemula',
          'name', 'Penjelajah Pemula',
          'description', 'Diberikan kepada petualang yang berhasil menyelesaikan paket petualangan pertamanya di Pulau Dewata.'
        );
      END IF;
    END IF;

    -- B. ATURAN BADGE 2: 'Penjelajah Utara'
    -- Diberikan jika paket berisi minimal 1 tempat di Buleleng, Karangasem, atau Jembrana
    SELECT EXISTS (
      SELECT 1 FROM public.trip_items ti
      JOIN public.places p ON p.id = ti.place_id
      WHERE ti.trip_id = v_trip_id
      AND p.region IN ('Buleleng', 'Karangasem', 'Jembrana')
    ) INTO v_has_north;

    IF v_has_north AND v_badge_utara_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id, trip_id, earned_at)
      VALUES (v_user_id, v_badge_utara_id, v_trip_id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING
      RETURNING id INTO v_inserted_id;

      IF v_inserted_id IS NOT NULL THEN
        v_newly_awarded := v_newly_awarded || jsonb_build_object(
          'code', 'penjelajah-utara',
          'name', 'Penjelajah Utara',
          'description', 'Diberikan atas keberhasilan menelusuri keasrian dan kearifan lokal kawasan Buleleng, Karangasem, atau Jembrana.'
        );
      END IF;
    END IF;

    -- C. ATURAN BADGE 3: 'Pencari Budaya'
    -- Diberikan jika minimal 2 tempat berkategori budaya diselesaikan di paket tersebut
    SELECT COUNT(*) INTO v_culture_count
    FROM public.trip_items ti
    JOIN public.places p ON p.id = ti.place_id
    WHERE ti.trip_id = v_trip_id
    AND p.category = 'budaya';

    IF v_culture_count >= 2 AND v_badge_budaya_id IS NOT NULL THEN
      INSERT INTO public.user_badges (user_id, badge_id, trip_id, earned_at)
      VALUES (v_user_id, v_badge_budaya_id, v_trip_id, now())
      ON CONFLICT (user_id, badge_id) DO NOTHING
      RETURNING id INTO v_inserted_id;

      IF v_inserted_id IS NOT NULL THEN
        v_newly_awarded := v_newly_awarded || jsonb_build_object(
          'code', 'pencari-budaya',
          'name', 'Pencari Budaya',
          'description', 'Diberikan kepada penjelajah yang menuntaskan kunjungan ke situs sejarah, candi kuno, dan desa adat tradisi Bali.'
        );
      END IF;
    END IF;

  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'trip_id', v_trip_id,
    'trip_item_id', p_trip_item_id,
    'all_completed', v_all_completed,
    'newly_awarded_badges', v_newly_awarded
  );
END;
$$;

-- Berikan hak eksekusi kepada pengguna yang terautentikasi
GRANT EXECUTE ON FUNCTION public.complete_trip_item(uuid, int, text) TO authenticated;
