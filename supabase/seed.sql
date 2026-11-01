-- ==============================================================================
-- Tour Penjelajah Bali — Seed Data (26 Destinasi + 3 Lencana)
-- Bali Digifest 2026: AI Web Innovation Challenge
-- Catatan: Seluruh data tempat dan koordinat diberi tanda [PERLU DIVERIFIKASI]
-- ==============================================================================

-- 1. SEED BADGES (LENCANA)
INSERT INTO public.badges (code, name, description, icon_url)
VALUES
  (
    'penjelajah-pemula',
    'Penjelajah Pemula',
    'Diberikan kepada petualang yang berhasil menyelesaikan paket petualangan pertamanya di Pulau Dewata.',
    '/badges/pemula.svg'
  ),
  (
    'penjelajah-utara',
    'Penjelajah Utara',
    'Diberikan atas keberhasilan menelusuri keasrian dan kearifan lokal kawasan Buleleng dan Bali Utara.',
    '/badges/utara.svg'
  ),
  (
    'pencari-budaya',
    'Pencari Budaya',
    'Diberikan kepada penjelajah yang menuntaskan kunjungan ke situs sejarah, candi kuno, dan desa adat tradisi Bali.',
    '/badges/budaya.svg'
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_url = EXCLUDED.icon_url;

-- ==============================================================================
-- 2. SEED PLACES (DESTINASI WISATA & KULINER SE-BALI)
-- Mencakup 9 Kabupaten/Kota:
-- Badung, Bangli, Buleleng, Gianyar, Jembrana, Karangasem, Klungkung, Tabanan, Denpasar
-- ==============================================================================

INSERT INTO public.places (
  name, type, category, tags, region, price_level, popularity, is_viral,
  description, cultural_note, image_url, lat, lng
)
VALUES
  -- ----------------------------------------------------------------------------
  -- BULELENG (BALI UTARA)
  -- ----------------------------------------------------------------------------
  (
    'Air Terjun Sekumpul',
    'wisata',
    'alam',
    ARRAY['air-terjun', 'hutan', 'trekking', 'alam-asri'],
    'Buleleng',
    2,
    78,
    true,
    'Gugusan air terjun megah di lembah rimbun Buleleng dengan tujuh aliran air alami yang memukau. [PERLU DIVERIFIKASI]',
    'Hormati kebersihan mata air suci warga dan kenakan alas kaki yang aman untuk trekking lembah. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
    -8.1724, 115.1812
  ),
  (
    'Desa Adat Pedawa & Rumah Tradisional Bandung Rangki',
    'wisata',
    'budaya',
    ARRAY['desa-kuno', 'bali-aga', 'sejarah', 'arsitektur-bambu'],
    'Buleleng',
    1,
    32,
    false,
    'Salah satu desa Bali Aga (kuno) tertua yang mempertahankan rumah bambu tradisional Bandung Rangki dan ritual kuno. [PERLU DIVERIFIKASI]',
    'Mohon izin kepada tetua adat desa sebelum memotret area persembahyangan dan rumah tinggal warga. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    -8.2312, 115.0354
  ),
  (
    'Warung Syobak Khe Lok Singaraja',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['kuliner-khas', 'singaraja', 'bumbu-tauco', 'legendaris'],
    'Buleleng',
    1,
    46,
    false,
    'Kuliner ikonik akulturasi Tionghoa-Buleleng dengan kuah kental gurih khas Singaraja sejak puluhan tahun silam. [PERLU DIVERIFIKASI]',
    'Hidangan non-halal. Tempat makan sederhana yang sarat sejarah perkotaan pelabuhan tua Singaraja. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    -8.1123, 115.0882
  ),

  -- ----------------------------------------------------------------------------
  -- KARANGASEM (BALI TIMUR)
  -- ----------------------------------------------------------------------------
  (
    'Pura Penataran Agung Lempuyang',
    'wisata',
    'budaya',
    ARRAY['pura', 'gunung-agung', 'fotogenik', 'spiritual'],
    'Karangasem',
    2,
    92,
    true,
    'Pura megah di lereng Gunung Lempuyang yang masyhur dengan panorama Gerbang Surga berlatar Gunung Agung. [PERLU DIVERIFIKASI]',
    'Kawasan suci utama: wajib mengenakan kamen/selendang, menjaga tutur kata, dan wanita haid dilarang masuk. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    -8.3908, 115.6301
  ),
  (
    'Desa Tradisional Tenganan Pegringsingan',
    'wisata',
    'budaya',
    ARRAY['kain-gringsing', 'bali-aga', 'tenun', 'arsitektur-kuno'],
    'Karangasem',
    1,
    45,
    false,
    'Desa adat Bali Aga penjaga warisan tenun ikat ganda kain Gringsing yang langka dan tata ruang desa kuno simetris. [PERLU DIVERIFIKASI]',
    'Hargai kesepakatan adat awig-awig setempat; dilarang merusak bangunan gerbang batu kuno. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    -8.4736, 115.5654
  ),
  (
    'Warung Teluk Jemeluk Amed',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['seafood', 'ikan-bakar', 'pesisir', 'sambal-matah'],
    'Karangasem',
    2,
    48,
    false,
    'Sajian ikan tangkapan segar nelayan lokal Amed dibakar arang sabut kelapa dengan sambal matah dan plecing kangkung. [PERLU DIVERIFIKASI]',
    'Dukung ekonomi nelayan tradisional dengan menikmati hasil laut harian yang ramah lingkungan. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    -8.3412, 115.6548
  ),

  -- ----------------------------------------------------------------------------
  -- BANGLI (BALI TENGAH)
  -- ----------------------------------------------------------------------------
  (
    'Desa Wisata Penglipuran',
    'wisata',
    'budaya',
    ARRAY['desa-bersih', 'arsitektur-bambu', 'hutan-bambu', 'kebudayaan'],
    'Bangli',
    2,
    88,
    true,
    'Desa adat peraih predikat salah satu desa terbersih di dunia dengan angkul-angkul seragam dan tata ruang Tri Mandala. [PERLU DIVERIFIKASI]',
    'Jaga kebersihan mutlak, dilarang merokok sembarangan di sepanjang jalur pejalan kaki desa. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=800&q=80',
    -8.4526, 115.3582
  ),
  (
    'Hutan Pinus Glagah Linggah Kintamani',
    'wisata',
    'alam',
    ARRAY['hutan-pinus', 'udara-sejuk', 'kabut', 'hidden-gem'],
    'Bangli',
    1,
    38,
    false,
    'Kawasan hutan pinus alami berkabut tenang di dataran tinggi Bangli yang jarang tersentuh hiruk-pikuk turis massal. [PERLU DIVERIFIKASI]',
    'Bawa kembali sampah Anda; dilarang menyalakan api unggun tanpa izin pengelola perhutani adat. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    -8.2435, 115.3218
  ),
  (
    'Warung Mujair Nyat-Nyat Pak Nyoman Kintamani',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['mujair', 'danau-batur', 'bumbu-bali', 'pedas-gurih'],
    'Bangli',
    2,
    62,
    false,
    'Olahan ikan mujair segar Danau Batur dimasak bumbu nyat-nyat berlimpah rempah khas pegunungan Kintamani. [PERLU DIVERIFIKASI]',
    'Disajikan hangat dengan nasi putih dan jukut urab, nikmati sambil memandang kaldera Danau Batur. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    -8.2612, 115.3621
  ),

  -- ----------------------------------------------------------------------------
  -- JEMBRANA (BALI BARAT)
  -- ----------------------------------------------------------------------------
  (
    'Bunut Bolong & Hutan Lindung Manggissari',
    'wisata',
    'alam',
    ARRAY['pohon-purba', 'mistis', 'pegunungan', 'unik'],
    'Jembrana',
    1,
    35,
    false,
    'Pohon beringin raksasa unik dengan lorong alami di tengah batang yang dapat dilewati kendaraan di jalan pedesaan. [PERLU DIVERIFIKASI]',
    'Masyarakat menganggap sakral pohon ini; dilarang membunyikan klakson berlebih atau berkata kasar saat melintas. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=800&q=80',
    -8.3245, 114.9812
  ),
  (
    'Pantai Medewi & Titik Surfing Pesisir Barat',
    'wisata',
    'pantai',
    ARRAY['pantai-batu', 'surfing', 'matahari-terbenam', 'tenang'],
    'Jembrana',
    1,
    42,
    false,
    'Pantai berbatu eksotis dengan ombak kidal panjang legendaris bagi peselancar dan suasana desa nelayan yang tenteram. [PERLU DIVERIFIKASI]',
    'Hati-hati terhadap bebatuan karang licin saat pasang dan hormati perahu nelayan tradisional yang bersandar. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    -8.4182, 114.8872
  ),
  (
    'Ayam Betutu Men Tempeh Gilimanuk',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['betutu-asli', 'pedas-rempah', 'legendaris', 'gilimanuk'],
    'Jembrana',
    2,
    82,
    true,
    'Pusat cita rasa ayam betutu basah legendaris Bali Barat sejak 1978 dengan bumbu base genep ekstra pedas menyengat. [PERLU DIVERIFIKASI]',
    'Kerap menjadi santapan wajib pemudik dan pelancong yang menyeberang via Pelabuhan Gilimanuk. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
    -8.1645, 114.4398
  ),

  -- ----------------------------------------------------------------------------
  -- KLUNGKUNG (TERMASUK NUSA PENIDA)
  -- ----------------------------------------------------------------------------
  (
    'Kelingking Beach Nusa Penida',
    'wisata',
    'pantai',
    ARRAY['tebing-t-rex', 'laut-biru', 'viral', 'nusa-penida'],
    'Klungkung',
    2,
    95,
    true,
    'Tebing kapur menjulang berbentuk kepala dinosaurus T-Rex berbalut air laut pirus kristal di pesisir Nusa Penida. [PERLU DIVERIFIKASI]',
    'Trek menuruni tebing sangat terjal dan berisiko tinggi; utamakan keselamatan dan jangan memaksakan diri. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
    -8.7512, 115.4745
  ),
  (
    'Kompleks Kertagosa & Museum Semarajaya',
    'wisata',
    'budaya',
    ARRAY['sejarah', 'lukisan-wayang', 'kamasan', 'kerajaan'],
    'Klungkung',
    1,
    44,
    false,
    'Balai pengadilan peninggalan Kerajaan Klungkung dengan lukisan langit-langit wayang gaya Kamasan yang sarat filsafat karma. [PERLU DIVERIFIKASI]',
    'Pelajari makna panel lukisan langit-langit dengan tenang; dilarang menyentuh pilar kayu kuno berukir. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
    -8.5367, 115.4042
  ),
  (
    'Warung Nasi Campur Men Lepod Klungkung',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['nasi-campur', 'jukut-urab', 'sate-lilit', 'kuliner-rakyat'],
    'Klungkung',
    1,
    52,
    false,
    'Nasi campur khas Semarapura dengan lauk sate lilit ikan tenggiri, pepes ikan, dan serundeng rempah gurih khas Klungkung. [PERLU DIVERIFIKASI]',
    'Warung makan ramah kantong favorit warga lokal di pusat kota Klungkung sejak pagi hari. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    -8.5342, 115.4021
  ),

  -- ----------------------------------------------------------------------------
  -- TABANAN
  -- ----------------------------------------------------------------------------
  (
    'Pura Ulun Danu Beratan',
    'wisata',
    'budaya',
    ARRAY['pura-danau', 'bedugul', 'ikonik', 'pegunungan'],
    'Tabanan',
    2,
    91,
    true,
    'Pura air terapung suci di tepi Danau Beratan Bedugul yang didedikasikan untuk Dewi Danu pemelihara kesuburan tanah. [PERLU DIVERIFIKASI]',
    'Kawasan suci Tri Hita Karana; kenakan busana sopan dan dilarang menerbangkan drone di atas area jeroan pura. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80',
    -8.2752, 115.1662
  ),
  (
    'Air Terjun Leke Leke',
    'wisata',
    'alam',
    ARRAY['air-terjun', 'hutan-tropis', 'tenang', 'hidden-gem'],
    'Tabanan',
    1,
    50,
    false,
    'Air terjun sempit anggun yang tersembunyi di balik celah tebing hijau lumut dengan suasana hening menyejukkan. [PERLU DIVERIFIKASI]',
    'Jaga kelestarian vegetasi lembah dan waspadai bebatuan licin di dasar cekungan air. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?auto=format&fit=crop&w=800&q=80',
    -8.3241, 115.1953
  ),
  (
    'Warung Entil Pupuan',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['entil', 'daun-telengidi', 'tradisional', 'khas-tabanan'],
    'Tabanan',
    1,
    38,
    false,
    'Makanan khas Tabanan barat berupa lontong beras merah/putih yang dibungkus daun telengidi dengan kuah santan bayem lezat. [PERLU DIVERIFIKASI]',
    'Kuliner langka warisan leluhur agraris yang umumnya disajikan pada hari raya Nyepi atau perayaan panen. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    -8.3541, 115.0123
  ),

  -- ----------------------------------------------------------------------------
  -- GIANYAR
  -- ----------------------------------------------------------------------------
  (
    'Terasering Sawah Tegalalang',
    'wisata',
    'alam',
    ARRAY['sawah-bertingkat', 'subak', 'ubud', 'bentang-alam'],
    'Gianyar',
    2,
    85,
    true,
    'Lansekap sawah berundak bertingkat legendaris yang menerapkan sistem irigasi warisan budaya dunia Subak. [PERLU DIVERIFIKASI]',
    'Berjalanlah hanya di pematang sawah yang diizinkan agar tidak merusak tanaman padi milik petani lokal. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    -8.4312, 115.2812
  ),
  (
    'Candi Tebing Gunung Kawi Tampaksiring',
    'wisata',
    'budaya',
    ARRAY['candi-pahat', 'arkeologi', 'lembah-pakerisan', 'sejarah-kuno'],
    'Gianyar',
    1,
    52,
    false,
    'Situs arkeologi abad ke-11 berupa sepuluh candi megah yang dipahat langsung di dinding tebing batu Sungai Pakerisan. [PERLU DIVERIFIKASI]',
    'Merupakan cagar budaya sakral; kenakan kain kamen dan jaga kesucian komplek pertapaan kuno. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
    -8.4234, 115.3098
  ),
  (
    'Nasi Ayam Kedewatan Ibu Mangku Ubud',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['nasi-ayam', 'ayam-suwir', 'sate-lilit', 'ubud'],
    'Gianyar',
    2,
    84,
    true,
    'Pilihan nasi ayam khas Ubud dengan paduan ayam suwir betutu, sate lilit, telur pindang, kacang goreng, dan sambal matah. [PERLU DIVERIFIKASI]',
    'Cita rasa autentik Gianyar yang disajikan dalam balutan nuansa paviliun rumah tradisional Bali. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    -8.4891, 115.2472
  ),

  -- ----------------------------------------------------------------------------
  -- BADUNG
  -- ----------------------------------------------------------------------------
  (
    'Pura Luhur Uluwatu',
    'wisata',
    'budaya',
    ARRAY['pura-tebing', 'tari-kecak', 'matahari-terbenam', 'samudra'],
    'Badung',
    2,
    94,
    true,
    'Pura Sad Kahyangan yang bertengger di puncak tebing karang terjal setinggi 70 meter menghadap Samudra Hindia. [PERLU DIVERIFIKASI]',
    'Amankan kacamata dan perhiasan dari monyet ekor panjang; kenakan selendang kuning sebelum melangkah ke pelataran. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    -8.8291, 115.0849
  ),
  (
    'Warung Babi Guling Pak Malen Seminyak',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['babi-guling', 'kuliner-khas', 'kerupuk-kulit', 'lawar'],
    'Badung',
    2,
    86,
    true,
    'Sajian babi guling populer dengan kulit renyah berkilau, daging bumbu rempah kuning gurih, dan kuah ares sedap. [PERLU DIVERIFIKASI]',
    'Hidangan non-halal. Tempat makan legendaris di sentra pariwisata Seminyak. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    -8.6923, 115.1682
  ),

  -- ----------------------------------------------------------------------------
  -- KOTA DENPASAR
  -- ----------------------------------------------------------------------------
  (
    'Monumen Perjuangan Rakyat Bali (Bajra Sandhi)',
    'wisata',
    'budaya',
    ARRAY['monumen', 'sejarah-bali', 'museum-diorama', 'renon'],
    'Denpasar',
    1,
    58,
    false,
    'Monumen arsitektur genta raksasa di Lapangan Niti Mandala Renon yang menyimpan 33 diorama sejarah perjuangan rakyat Bali. [PERLU DIVERIFIKASI]',
    'Di lantai atas terdapat ruang perenungan hening untuk menghargai jasa para pahlawan perang Puputan Badung. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
    -8.6717, 115.2339
  ),
  (
    'Warung Mak Beng Sanur',
    'kuliner',
    'kuliner-tradisional',
    ARRAY['sop-ikan', 'ikan-goreng', 'sambal-pedas', 'legendaris-1941'],
    'Denpasar',
    2,
    93,
    true,
    'Warung legendaris sejak tahun 1941 di dekat pantai Sanur dengan menu tunggal paket sup kepala ikan dan ikan laut goreng sambal terasi. [PERLU DIVERIFIKASI]',
    'Menu sup bercita rasa asam segar dengan potongan mentimun muda; antrean pengunjung sering panjang saat jam makan siang. [PERLU DIVERIFIKASI]',
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    -8.6754, 115.2631
  );
