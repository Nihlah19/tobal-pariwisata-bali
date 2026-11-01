-- ==============================================================================
-- TOUR PENJELAJAH BALI — MIGRATION 002: DICTIONARY (KAMUS BAHASA BALI)
-- Tabel kamus kosakata Bahasa Bali gaya KBBI dengan tingkatan bahasa & RLS
-- Bali Digifest 2026 (AI Web Innovation Challenge)
-- ==============================================================================

-- 1. AKTIFKAN EKSTENSI PENCARIAN TRIGRAM (pg_trgm)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. BUAT TABEL DICTIONARY
CREATE TABLE IF NOT EXISTS public.dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kata TEXT NOT NULL,
  arti_indonesia TEXT NOT NULL,
  arti_inggris TEXT,
  kelas_kata TEXT NOT NULL, -- 'n' (nomina), 'v' (verba), 'adj' (adjektiva), 'adv' (adverbia), 'num' (numeralia), 'p' (partikel/ungkapan/frasa), 'pron' (pronomina)
  tingkat TEXT NOT NULL CHECK (tingkat IN ('alus singgih', 'alus sor', 'alus madya', 'andap/kasar', 'umum')),
  contoh_bali TEXT,
  contoh_terjemahan TEXT,
  padanan_tingkat TEXT[], -- array berisi padanan kata pada tingkatan lain, misal ARRAY['Andap: nasi', 'Alus Sor: ajengan']
  catatan TEXT,
  sumber TEXT DEFAULT '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. INDEX PENCARIAN CEPAT & TRIGRAM
CREATE INDEX IF NOT EXISTS idx_dictionary_kata ON public.dictionary (kata);
CREATE INDEX IF NOT EXISTS idx_dictionary_tingkat ON public.dictionary (tingkat);
CREATE INDEX IF NOT EXISTS idx_dictionary_kelas_kata ON public.dictionary (kelas_kata);

-- Index GIN Trigram untuk pencarian fleksibel pada kolom kata & arti_indonesia
CREATE INDEX IF NOT EXISTS idx_dictionary_kata_trgm ON public.dictionary USING gin (kata gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dictionary_arti_trgm ON public.dictionary USING gin (arti_indonesia gin_trgm_ops);

-- 4. ATUR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.dictionary ENABLE ROW LEVEL SECURITY;

-- Policy: Publik dapat membaca seluruh entri kamus (SELECT)
CREATE POLICY "Kamus dapat dibaca oleh siapa saja"
ON public.dictionary
FOR SELECT
USING (true);

-- Catatan Keamanan: Operasi INSERT, UPDATE, dan DELETE TIDAK DIBUKA untuk publik.
-- Secara default di PostgreSQL / Supabase, ketiadaan policy tulis untuk anon/authenticated
-- memastikan hanya service_role (backend admin) yang dapat memodifikasi data kamus.

-- ==============================================================================
-- 5. SEED DATA AWAL: 46 KOSAKATA BERGUNA BAGI WISATAWAN
-- Mencakup: Sapaan, Angka, Makanan, Arah/Navigasi, dan Etika di Pura
-- Semua entri ditandai [PERLU DIVERIFIKASI] untuk akurasi penutur asli / kamus resmi
-- ==============================================================================

INSERT INTO public.dictionary (
  kata, arti_indonesia, arti_inggris, kelas_kata, tingkat,
  contoh_bali, contoh_terjemahan, padanan_tingkat, catatan, sumber
) VALUES
-- ------------------------------------------------------------------------------
-- KELOMPOK 1: SAPAAN, UNGKAPAN SOPAN, & PERCAKAPAN
-- ------------------------------------------------------------------------------
(
  'Om Swastyastu',
  'Semoga dalam keadaan selamat dan sejahtera atas karunia Sang Hyang Widhi Wasa (sapaan sakral pembuka khas Bali)',
  'May peace and safety be upon you (sacred Balinese greeting)',
  'p', 'umum',
  'Om Swastyastu, matur suksma sampun rauh ring jero titiang.',
  'Om Swastyastu, terima kasih banyak telah berkunjung ke kediaman hamba. [PERLU DIVERIFIKASI]',
  ARRAY['Umum: Om Swastyastu'],
  'Diucapkan dengan cakupan kedua telapak tangan di dada (anjali mudra) dan sedikit membungkuk hormat. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Matur suksma',
  'Terima kasih banyak / berterima kasih secara sopan',
  'Thank you very much',
  'p', 'alus madya',
  'Matur suksma antuk wantuan ragane.',
  'Terima kasih banyak atas bantuan Anda. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Suksma', 'Alus Singgih: Suksmayang'],
  'Ungkapan terima kasih yang paling aman dan sopan digunakan wisatawan kepada siapa saja di Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Suksma mewali',
  'Terima kasih kembali / sama-sama',
  'You are welcome / thank you in return',
  'p', 'alus madya',
  'Suksma mewali, dumogi rahayu ring margi.',
  'Terima kasih kembali, semoga selamat di perjalanan. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Mewali'],
  'Jawaban balasan santun saat lawan bicara mengucapkan matur suksma. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Rahajeng semeng',
  'Selamat pagi',
  'Good morning',
  'p', 'alus madya',
  'Rahajeng semeng bli, kenken kabare mangkin?',
  'Selamat pagi bli, bagaimana kabarnya sekarang? [PERLU DIVERIFIKASI]',
  NULL,
  'Sapaan pagi hari bernada hangat untuk menyapa warga lokal. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Rahajeng tengai',
  'Selamat siang',
  'Good afternoon',
  'p', 'alus madya',
  'Rahajeng tengai mbok, sampun ngajeng?',
  'Selamat siang mbok, sudah makan siang? [PERLU DIVERIFIKASI]',
  NULL,
  'Digunakan sekitar pukul 11.00 hingga 15.00 WITA. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Rahajeng wengi',
  'Selamat malam',
  'Good evening / Good night',
  'p', 'alus madya',
  'Rahajeng wengi, suksma antuk pelayanan sane becik.',
  'Selamat malam, terima kasih atas pelayanan yang baik. [PERLU DIVERIFIKASI]',
  NULL,
  'Sapaan malam hari untuk bertegur sapa santai atau salam perpisahan malam. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Ampura',
  'Maaf / mohon maaf / permisi',
  'Excuse me / I am sorry',
  'p', 'alus madya',
  'Ampura, margi puniki nuju kija nggih?',
  'Mohon maaf, jalan ini mengarah ke mana ya? [PERLU DIVERIFIKASI]',
  ARRAY['Alus Singgih: Sinampura', 'Andap: Ngampurayang'],
  'Kata wajib saat permisi berjalan di kerumunan upacara atau menanyakan petunjuk arah. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Inggih',
  'Ya / benar / setuju secara santun',
  'Yes / correct (polite)',
  'adv', 'alus madya',
  'Inggih patut, titiang jagi melancaran ka Sekumpul.',
  'Ya benar sekali, hamba hendak berwisata ke Sekumpul. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Aja / Saja', 'Alus Singgih: Inggih patut'],
  'Kata penanda rasa hormat dan kesepahaman dalam percakapan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Nenten',
  'Tidak / bukan (bentuk halus)',
  'No / not (polite)',
  'adv', 'alus madya',
  'Titiang nenten uning margi punika.',
  'Hamba tidak mengetahui jalan tersebut. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Sing / Tusing', 'Alus Sor: Nenten'],
  'Sangat disarankan memakai kata nenten dibanding sing untuk kesantunan dengan warga lokal. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Sing',
  'Tidak / bukan (bentuk akrab / informal)',
  'No / not (casual)',
  'adv', 'andap/kasar',
  'Icang sing nyak melali joh-joh.',
  'Aku tidak mau bepergian jauh-jauh. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Nenten', 'Alus Singgih: Nenten pisan'],
  'Hanya digunakan sesama kawan sebaya akrab; jangan gunakan pada pemangku atau tetua adat. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Durusang',
  'Silakan / mari dipersilakan',
  'Please go ahead / Please enter',
  'v', 'alus singgih',
  'Durusang ngranjing ring jero titiang.',
  'Silakan masuk ke kediaman hamba. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Ngiring', 'Andap: Jalan'],
  'Bentuk penghormatan tinggi saat mempersilakan tamu masuk atau mencicipi hidangan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Titiang',
  'Saya / hamba (merendahkan diri sendiri secara santun)',
  'I / myself (humble form)',
  'pron', 'alus sor',
  'Titiang meled uning indik adat ring Pedawa.',
  'Hamba sangat ingin tahu tentang adat istiadat di Pedawa. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Tiang', 'Andap: Icang', 'Kasar: Kai'],
  'Menunjukkan tata krama andap asor (rendah hati) luhur masyarakat Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Ragane',
  'Anda / beliau (meninggikan lawan bicara)',
  'You (respectful form)',
  'pron', 'alus singgih',
  'Sira wastan ragane nggih?',
  'Siapakah nama Anda yang mulia/terhormat? [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Jero', 'Andap: Cai (pria) / Nyai (wanita)'],
  'Pronomina kedua paling santun saat berinteraksi dengan tokoh adat atau orang baru. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Punapi gatrane?',
  'Bagaimana kabar Anda? (bentuk sopan)',
  'How are you? (polite)',
  'p', 'alus madya',
  'Punapi gatrane bapak perbekel mangkin?',
  'Bagaimana kabar Bapak Kepala Desa sekarang? [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Kenken kabare?'],
  'Pertanyaan kabar santun yang sangat dihargai saat bertamu ke desa wisata. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kenken kabare?',
  'Bagaimana kabarmu? (sapaan santai / akrab)',
  'How are you? (casual)',
  'p', 'andap/kasar',
  'Bli, kenken kabare mangkin?',
  'Bli, bagaimana kabarmu sekarang? [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Punapi gatrane?'],
  'Sapaan akrab sehari-hari kepada teman sebaya atau pemandu wisata yang sudah akrab. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),

-- ------------------------------------------------------------------------------
-- KELOMPOK 2: ANGKA & TRANSAKSI WISATA
-- ------------------------------------------------------------------------------
(
  'Besik',
  'Satu (ragam akrab)',
  'One (casual)',
  'num', 'andap/kasar',
  'Beliang jukut besik manten.',
  'Belikan sayur satu porsi saja. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Siki'],
  'Bilangan satu ragam umum sehari-hari. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Siki',
  'Satu (ragam sopan / halus)',
  'One (polite)',
  'num', 'alus madya',
  'Nunas canang siki nggih mbok.',
  'Minta canang satu ya mbok. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Besik'],
  'Sangat sopan digunakan saat berbelanja canang atau memesan makanan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Dua',
  'Dua (ragam akrab)',
  'Two (casual)',
  'num', 'andap/kasar',
  'Ia ngelah panak dua.',
  'Dia memiliki anak dua orang. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Kalih'],
  'Bilangan dua untuk percakapan santai. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kalih',
  'Dua (ragam halus)',
  'Two (polite)',
  'num', 'alus madya',
  'Titiang nunas ajengan kalih porsi.',
  'Hamba memesan makanan dua porsi. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Dua'],
  'Digunakan dalam percakapan sopan atau pesanan resmi. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Telu',
  'Tiga (ragam akrab)',
  'Three (casual)',
  'num', 'andap/kasar',
  'Ada anak telu di marga.',
  'Ada tiga orang di jalan. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Tiga'],
  'Bilangan tiga untuk percakapan sehari-hari. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Tiga',
  'Tiga (ragam halus)',
  'Three (polite)',
  'num', 'alus madya',
  'Tiket ranjing puniki kaperluang antuk jadma tiga.',
  'Tiket masuk ini diperlukan untuk tiga orang. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Telu'],
  'Ragam sopan untuk menyebut tiga. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Papat',
  'Empat',
  'Four',
  'num', 'umum',
  'Buku petualangan puniki medaging patpat genah becik.',
  'Buku petualangan ini berisi empat tempat bagus. [PERLU DIVERIFIKASI]',
  NULL,
  'Kerap dilafalkan patpat saat merangkai kata benda. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Lima',
  'Lima (angka 5 atau anggota tubuh tangan)',
  'Five (or hand)',
  'num', 'umum',
  'Ajine lima tali rupiah.',
  'Harganya lima ribu rupiah. [PERLU DIVERIFIKASI]',
  NULL,
  'Dapat bermakna bilangan lima atau tangan tergantung konteks kalimat. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Nem',
  'Enam',
  'Six',
  'num', 'umum',
  'Wenten anak nem sane sareng melancaran.',
  'Ada enam orang yang ikut berwisata. [PERLU DIVERIFIKASI]',
  NULL,
  'Angka enam dalam perhitungan Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Pitu',
  'Tujuh',
  'Seven',
  'num', 'umum',
  'Air Terjun Sekumpul medue pitung grojogan.',
  'Air Terjun Sekumpul memiliki tujuh air terjun. [PERLU DIVERIFIKASI]',
  NULL,
  'Sering disebut "pitu" atau "pitung". [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kutus',
  'Delapan',
  'Eight',
  'num', 'umum',
  'Kutus tali rupiah aji tiket niki.',
  'Delapan ribu rupiah harga tiket ini. [PERLU DIVERIFIKASI]',
  NULL,
  'Angka delapan dalam hitungan tradisional. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Sia',
  'Sembilan',
  'Nine',
  'num', 'umum',
  'Pulau Bali kabelas dados sia kabupaten.',
  'Pulau Bali terbagi menjadi sembilan kabupaten/kota. [PERLU DIVERIFIKASI]',
  NULL,
  'Angka sembilan dalam tradisi nawa sanga. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Dasa',
  'Sepuluh',
  'Ten',
  'num', 'umum',
  'Dasa tali rupiah punika sampun cukup.',
  'Sepuluh ribu rupiah itu sudah cukup. [PERLU DIVERIFIKASI]',
  NULL,
  'Satuan genap sepuluh. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Aji kuda?',
  'Berapa harganya?',
  'How much does this cost?',
  'p', 'alus madya',
  'Kamben puniki aji kuda nggih bli?',
  'Kain sarung ini berapa harganya ya bli? [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Kuda hargane?'],
  'Frasa kunci wisatawan untuk menanyakan harga secara sopan di pasar seni lokal. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),

-- ------------------------------------------------------------------------------
-- KELOMPOK 3: MAKANAN, KULINER, & MINUMAN
-- ------------------------------------------------------------------------------
(
  'Rayunan',
  'Santapan / hidangan makanan terhormat (tingkatan tertinggi)',
  'Honored meal / feast',
  'n', 'alus singgih',
  'Ratu Peranda sampun merayunan ring bale gedong.',
  'Ratu Pedanda sudah menikmati santapan di bale gedong. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Ajengan', 'Andap: Nasi / Panganan'],
  'Bentuk penghormatan tertinggi untuk makanan pemuka agama atau bangsawan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Ajengan',
  'Makanan / hidangan nasi yang sopan',
  'Food / meal (polite)',
  'n', 'alus madya',
  'Durusang ambal ajengan puniki sane sampun cawisang.',
  'Silakan cicipi hidangan makanan ini yang telah disiapkan. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Singgih: Rayunan', 'Andap: Nasi'],
  'Istilah Ajengan Bali populer merujuk pada kuliner tradisional bermutu. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Nasi',
  'Nasi / beras yang sudah dimasak',
  'Cooked rice',
  'n', 'andap/kasar',
  'Ia seduk pesan, lantas medaar nasi campur.',
  'Dia lapar sekali, lantas makan nasi campur. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Ajengan', 'Alus Singgih: Rayunan'],
  'Kata benda nasi dalam percakapan sehari-hari. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Ngajeng',
  'Makan (ragam sopan netral)',
  'To eat (polite)',
  'v', 'alus madya',
  'Ngiring ngajeng dumun sareng-sareng.',
  'Mari makan terlebih dahulu bersama-sama. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Singgih: Merayunan', 'Alus Sor: Neda', 'Andap: Medaar / Mangan'],
  'Kata ajakan santun saat mengajak teman atau tuan rumah makan bersama. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Neda',
  'Makan (merendahkan diri sendiri di hadapan orang terhormat)',
  'To eat (humble self-referential form)',
  'v', 'alus sor',
  'Titiang sampun neda ring warung ajeng wau.',
  'Hamba sudah makan di warung depan tadi. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Ngajeng', 'Alus Singgih: Merayunan', 'Andap: Mangan'],
  'Menunjukkan kesantunan tinggi saat menyatakan bahwa diri sendiri telah makan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Toya',
  'Air (air minum atau air jernih bersih)',
  'Water (polite)',
  'n', 'alus madya',
  'Nunas toya ning asiki bli.',
  'Minta air tawar jernih satu gelas ya bli. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Singgih: Tirta (air suci)', 'Andap: Yeh'],
  'Bentuk halus dari kata yeh. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Yeh',
  'Air',
  'Water (casual)',
  'n', 'andap/kasar',
  'Yeh tukade melancaran enggal pesan.',
  'Air sungai itu mengalir deras sekali. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Toya'],
  'Kata sehari-hari untuk air, kerap menjadi toponimi seperti Yeh Sanih atau Yeh Gangga. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Jukut',
  'Sayuran / masakan berkuah sayur',
  'Vegetable dish',
  'n', 'andap/kasar',
  'Jukut ares puniki rasane jaen pesan.',
  'Sayur ares ini rasanya sangat enak. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Jangan'],
  'Istilah khas kuliner sayuran Bali seperti jukut urab, jukut undis, jukut ares. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Jaen',
  'Enak / lezat',
  'Delicious / tasty',
  'adj', 'andap/kasar',
  'Lawar kuwir puniki jaen sajan!',
  'Lawar itik ini lezat sekali! [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Becik rasanipun', 'Alus Singgih: Kasukan'],
  'Pujian spontan yang sangat menyenangkan bagi juru masak warung di Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Wareg',
  'Kenyang (sudah puas makan)',
  'Full / satisfied after eating',
  'adj', 'andap/kasar',
  'Titiang sampun wareg, matur suksma.',
  'Hamba sudah kenyang, terima kasih banyak. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Watek'],
  'Menyatakan rasa kenyang secara sopan setelah dijamu warga. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),

-- ------------------------------------------------------------------------------
-- KELOMPOK 4: ARAH KOSMOLOGI & NAVIGASI
-- ------------------------------------------------------------------------------
(
  'Kaja',
  'Arah hulu / menuju gunung (sakral / utama). Berbeda di tiap daerah: di Bali Selatan mengarah ke utara, di Buleleng mengarah ke selatan',
  'Mountainward / Sacred uphill direction',
  'adv', 'umum',
  'Pura Besakih magenah ring genah sane pinih kaja.',
  'Pura Besakih terletak di tempat yang paling mengarah ke gunung (kaja). [PERLU DIVERIFIKASI]',
  NULL,
  'Orientasi sumbu spiritual paling penting dalam kosmologi tata ruang Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kelod',
  'Arah hilir / menuju laut (profan / teben). Kebalikan dari kaja',
  'Seaward / Downhill direction',
  'adv', 'umum',
  'Pasih Sanur magenah ring arah kelod saking jeroan.',
  'Pantai Sanur berada di arah laut (kelod) dari perkampungan. [PERLU DIVERIFIKASI]',
  NULL,
  'Pasangan sumbu Kaja-Kelod untuk tata letak desa dan pura di Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kangin',
  'Timur (arah matahari terbit / kesucian Dewa Iswara)',
  'East',
  'adv', 'umum',
  'Karangasem punika magenah ring ujung kangin pulo Bali.',
  'Karangasem terletak di ujung timur pulau Bali. [PERLU DIVERIFIKASI]',
  NULL,
  'Sumbu matahari terbit yang disucikan dalam tradisi Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kauh',
  'Barat (arah matahari terbenam)',
  'West',
  'adv', 'umum',
  'Jembrana magenah ring wawidangan kauh.',
  'Jembrana berada di wilayah barat pulau Bali. [PERLU DIVERIFIKASI]',
  NULL,
  'Arah barat dalam orientasi empat penjuru mata angin Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Ring dija',
  'Di mana (ragam halus / santun)',
  'Where (polite)',
  'adv', 'alus madya',
  'Ring dija genah pura desa punika magenah?',
  'Di manakah lokasi pura desa tersebut berada? [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Dija'],
  'Cara bertanya arah paling santun ketika menjelajahi desa wisata. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Meriki',
  'Ke sini / kemari',
  'Hither / To this place',
  'adv', 'alus madya',
  'Ngiring meriki melinggih dumun.',
  'Mari ke sini duduk terlebih dahulu. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Mai'],
  'Ajakan santun untuk mempersilakan orang mendekat atau singgah. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Merika',
  'Ke sana / menuju ke tempat itu',
  'Thither / To that place',
  'adv', 'alus madya',
  'Yening jagi ka danu, margine nuju merika.',
  'Jika hendak ke danau, jalannya menuju ke sana. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Kema'],
  'Petunjuk arah tujuan yang diucapkan secara sopan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Margi',
  'Jalan / lintasan jalan raya atau jalan setapak',
  'Road / path (polite)',
  'n', 'alus madya',
  'Margi puniki resik tur asri pisan.',
  'Jalan ini bersih serta asri sekali. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Jalan'],
  'Kata benda halus untuk menyebut jalan. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),

-- ------------------------------------------------------------------------------
-- KELOMPOK 5: ETIKA PURA, TEMPAT SUCI, & TATA KRAMA BUDAYA
-- ------------------------------------------------------------------------------
(
  'Pura',
  'Tempat suci persembahyangan umat Hindu di Bali',
  'Balinese Hindu temple',
  'n', 'umum',
  'Ritatkala ngranjing ka pura, iraga patut ngangge busana adat sane rapi.',
  'Ketika memasuki pura, kita wajib memakai pakaian adat yang rapi. [PERLU DIVERIFIKASI]',
  NULL,
  'Berasal dari bahasa Sanskerta pur yang berarti kota atau istana yang dibentengi kesucian. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Tirta',
  'Air suci yang telah disucikan melalui doa mantram oleh pemangku atau pedanda',
  'Holy water used in Hindu blessings',
  'n', 'alus singgih',
  'Pamangku ngicen tirta ring para pamedek sami.',
  'Pemangku membagikan air suci kepada seluruh umat yang hadir. [PERLU DIVERIFIKASI]',
  ARRAY['Alus Madya: Toya ning', 'Andap: Yeh ning'],
  'Dipercikkan di kepala, diminum 3 kali, dan dibasuhkan ke wajah untuk penyucian rohani. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Kamben',
  'Kain bawahan tradisional (sarung khas Bali) yang wajib menutupi kaki hingga bawah lutut',
  'Traditional waist cloth / sarong required in temples',
  'n', 'umum',
  'Wisatawan patut nganggen kamben rikala ngranjing ring wawidangan pura.',
  'Wisatawan wajib mengenakan kamben saat masuk ke kawasan pura. [PERLU DIVERIFIKASI]',
  NULL,
  'Pakaian wajib pria dan wanita saat memasuki area tempat suci di Bali. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Senteng',
  'Selendang pengikat pinggang sebagai simbol mengendalikan emosi dan hawa nafsu saat beribadah',
  'Waist sash worn during temple visits symbolizing self-control',
  'n', 'umum',
  'Ikat senteng ring bangkiang pinaka cihna nahan emosi.',
  'Ikatkan selendang di pinggang sebagai tanda menahan emosi dan hawa nafsu. [PERLU DIVERIFIKASI]',
  ARRAY['Sinonim: Selendang'],
  'Diikatkan di luar kamben tepat di batas pusar sebagai simbol batas antara keduniawian dan kesucian. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Canang',
  'Sesaji anyaman daun kelapa muda dengan beras, bunga segar lima warna perlambang keharmonisan',
  'Daily floral offering woven from young coconut leaves',
  'n', 'umum',
  'Canang sari punika aturang antuk rasa bhakti ring Hyang Widhi.',
  'Canang sari tersebut dipersembahkan dengan rasa tulus ikhlas kepada Hyang Widhi. [PERLU DIVERIFIKASI]',
  NULL,
  'Jangan pernah melangkahi atau menginjak canang yang baru dipersembahkan dan berdupa. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Pamangku',
  'Pemimpin upacara suci atau penjaga persembahyangan di pura',
  'Temple priest / spiritual officiant',
  'n', 'alus singgih',
  'Jero Mangku sampun nyiapang upakara sembahyang.',
  'Jero Mangku telah menyiapkan perlengkapan persembahyangan. [PERLU DIVERIFIKASI]',
  NULL,
  'Sapaan santun kepadanya adalah Jero Mangku. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Sukla',
  'Suci, murni, bersih secara lahir dan batin, belum pernah tersentuh kotoran',
  'Pure / sacred / clean',
  'adj', 'alus singgih',
  'Banten sane kaaturang patut sukla tur ning.',
  'Sesajen yang dipersembahkan wajib murni dan suci bersih. [PERLU DIVERIFIKASI]',
  NULL,
  'Juga digunakan untuk menyebut hidangan vegetarian suci bagi upacara pura. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Cuntaka',
  'Keadaan tidak suci secara spiritual (berduka, melahirkan, menstruasi) sehingga berpantang masuk pura',
  'Period of ritual impurity barring temple entry',
  'n', 'umum',
  'Anak sane sedek cuntaka nenten dados ngranjing ka jeroan pura.',
  'Orang yang sedang dalam kondisi cuntaka tidak diperkenankan masuk ke area dalam pura. [PERLU DIVERIFIKASI]',
  NULL,
  'Bentuk penghormatan terhadap kesucian area utama mandala pura. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Matur piuning',
  'Berdoa memohon izin spiritual kepada penguasa tempat atau leluhur sebelum memulai kegiatan',
  'Prayer to ask spiritual permission before activities',
  'v', 'alus singgih',
  'Ngiring matur piuning dumun sadurung ngawit trekking ka hutan.',
  'Mari memohon izin secara doa terlebih dahulu sebelum mulai trekking ke hutan. [PERLU DIVERIFIKASI]',
  NULL,
  'Tradisi luhur untuk senantiasa menjaga keharmonisan alam sekala dan niskala. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
),
(
  'Tedun',
  'Turun / hadir bersama-sama untuk gotong royong warga adat (ngayah) di pura',
  'Gathering together for communal temple service',
  'v', 'alus singgih',
  'Krama desa sami tedun ngayah ring pura mangkin.',
  'Warga desa semuanya hadir bergotong royong di pura sekarang. [PERLU DIVERIFIKASI]',
  ARRAY['Andap: Tuun'],
  'Gotong royong tulus ikhlas di pura ini disebut tradisi ngayah. [PERLU DIVERIFIKASI]',
  '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
);
