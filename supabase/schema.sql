-- ==============================================================================
-- Tour Penjelajah Bali — Database Schema (Supabase / PostgreSQL)
-- Bali Digifest 2026: AI Web Innovation Challenge
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DEFINITION
-- ==============================================================================

-- Tabel: profiles
-- Menyimpan preferensi petualang dan profil personal
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  interests text[] DEFAULT '{}'::text[],
  preferred_regions text[] DEFAULT '{}'::text[],
  budget text CHECK (budget IN ('hemat', 'menengah', 'premium') OR budget IS NULL),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Tabel: places
-- Menyimpan katalog destinasi wisata dan kuliner di seluruh kabupaten Bali
CREATE TABLE IF NOT EXISTS public.places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('wisata', 'kuliner')),
  category text NOT NULL, -- contoh: 'alam', 'budaya', 'pantai', 'sejarah', 'kuliner-tradisional', 'kopi-kebun'
  tags text[] DEFAULT '{}'::text[],
  region text NOT NULL, -- 9 kabupaten/kota: Badung, Bangli, Buleleng, Gianyar, Jembrana, Karangasem, Klungkung, Tabanan, Denpasar
  price_level int NOT NULL CHECK (price_level BETWEEN 1 AND 3), -- 1: Hemat, 2: Menengah, 3: Premium
  popularity int NOT NULL DEFAULT 50 CHECK (popularity BETWEEN 0 AND 100), -- 0: Hidden gem, 100: Super viral
  is_viral boolean NOT NULL DEFAULT false,
  description text,
  cultural_note text, -- catatan etika/kebudayaan lokal
  image_url text,
  lat double precision,
  lng double precision,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabel: trips
-- Paket petualangan pengguna (3 destinasi wisata + 1 tempat kuliner)
CREATE TABLE IF NOT EXISTS public.trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'selesai')),
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Tabel: trip_items
-- Item per tempat dalam paket petualangan
CREATE TABLE IF NOT EXISTS public.trip_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  position int NOT NULL CHECK (position BETWEEN 1 AND 4), -- Posisi 1-3 wisata, 4 kuliner
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  CONSTRAINT uq_trip_place UNIQUE (trip_id, place_id),
  CONSTRAINT uq_trip_position UNIQUE (trip_id, position)
);

-- Tabel: reviews
-- Ulasan dan rating setelah menyelesaikan jelajah
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_place_review UNIQUE (user_id, place_id)
);

-- Tabel: badges
-- Master data lencana pencapaian petualangan
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Tabel: user_badges
-- Lencana yang telah diperoleh oleh petualang
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES public.trips(id) ON DELETE SET NULL,
  earned_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- ==============================================================================
-- 3. INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_places_region ON public.places (region);
CREATE INDEX IF NOT EXISTS idx_places_type ON public.places (type);
CREATE INDEX IF NOT EXISTS idx_places_category ON public.places (category);
CREATE INDEX IF NOT EXISTS idx_places_is_viral ON public.places (is_viral);
CREATE INDEX IF NOT EXISTS idx_places_popularity ON public.places (popularity);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips (user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips (status);

CREATE INDEX IF NOT EXISTS idx_trip_items_trip_id ON public.trip_items (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_items_place_id ON public.trip_items (place_id);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON public.reviews (place_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges (user_id);

-- ==============================================================================
-- 4. AUTOMATIC PROFILE TRIGGER (ON AUTH SIGNUP)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1),
      'Penjelajah Bali'
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Aktifkan RLS di seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- A. PLACES & BADGES (Publik bisa membaca)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Places can be viewed by everyone" ON public.places;
CREATE POLICY "Places can be viewed by everyone"
  ON public.places FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Badges can be viewed by everyone" ON public.badges;
CREATE POLICY "Badges can be viewed by everyone"
  ON public.badges FOR SELECT
  USING (true);

-- ------------------------------------------------------------------------------
-- B. REVIEWS (Publik bisa membaca, hanya pemilik bisa menulis/mengubah/menghapus)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- C. PROFILES (Hanya pemilik yang dapat membaca dan mengubah)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- D. TRIPS (Hanya pemilik yang dapat membaca dan mengelola)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own trips" ON public.trips;
CREATE POLICY "Users can view own trips"
  ON public.trips FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own trips" ON public.trips;
CREATE POLICY "Users can create own trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trips" ON public.trips;
CREATE POLICY "Users can update own trips"
  ON public.trips FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
CREATE POLICY "Users can delete own trips"
  ON public.trips FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- E. TRIP_ITEMS (Hanya pemilik trip yang dapat membaca dan mengubah item)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own trip items" ON public.trip_items;
CREATE POLICY "Users can view own trip items"
  ON public.trip_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own trip items" ON public.trip_items;
CREATE POLICY "Users can insert own trip items"
  ON public.trip_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own trip items" ON public.trip_items;
CREATE POLICY "Users can update own trip items"
  ON public.trip_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_items.trip_id
      AND trips.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own trip items" ON public.trip_items;
CREATE POLICY "Users can delete own trip items"
  ON public.trip_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_items.trip_id
      AND trips.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- F. USER_BADGES (Hanya pemilik yang dapat membaca dan menerima lencana)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
CREATE POLICY "Users can view own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own earned badges" ON public.user_badges;
CREATE POLICY "Users can insert own earned badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 6. ATOMIC SERVER-SIDE PROCEDURE: complete_trip_item
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

    -- A. ATURAN BADGE 1: 'Penjelajah Pemula' (paket pertama diselesaikan)
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

    -- B. ATURAN BADGE 2: 'Penjelajah Utara' (minimal 1 tempat di Buleleng, Karangasem, Jembrana)
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

    -- C. ATURAN BADGE 3: 'Pencari Budaya' (minimal 2 tempat berkategori budaya)
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

GRANT EXECUTE ON FUNCTION public.complete_trip_item(uuid, int, text) TO authenticated;

