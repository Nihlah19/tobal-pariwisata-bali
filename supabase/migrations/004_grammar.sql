-- ==============================================================================
-- TOUR PENJELAJAH BALI — MIGRATION 004: BALINESE GRAMMAR (TATA BAHASA BALI)
-- Tabel aturan tata bahasa, tingkatan bahasa (Sor Singgih), sintaksis & pronomina
-- Bali Digifest 2026 (AI Web Innovation Challenge)
-- ==============================================================================

-- 1. BUAT TABEL BALINESE_GRAMMAR
CREATE TABLE IF NOT EXISTS public.balinese_grammar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  judul TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  kategori TEXT NOT NULL CHECK (kategori IN ('sor-singgih', 'pronomina', 'afiksasi', 'sintaksis', 'tata-krama', 'kosakata-khusus')),
  tingkat TEXT DEFAULT 'semua tingkatan',
  ringkasan TEXT NOT NULL,
  penjelasan_markdown TEXT NOT NULL,
  pola_rumus TEXT,
  contoh_kalimat JSONB DEFAULT '[]'::jsonb, -- Array objek: [{ bali, indonesia, catatan }]
  urutan INT DEFAULT 0,
  diterbitkan BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. INDEX PENCARIAN & FILTER
CREATE INDEX IF NOT EXISTS idx_grammar_slug ON public.balinese_grammar (slug);
CREATE INDEX IF NOT EXISTS idx_grammar_kategori ON public.balinese_grammar (kategori);
CREATE INDEX IF NOT EXISTS idx_grammar_diterbitkan ON public.balinese_grammar (diterbitkan);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.balinese_grammar ENABLE ROW LEVEL SECURITY;

-- Policy: Publik dapat membaca seluruh materi tata bahasa yang telah diterbitkan
DROP POLICY IF EXISTS "Tata bahasa dapat dibaca publik" ON public.balinese_grammar;
CREATE POLICY "Tata bahasa dapat dibaca publik"
ON public.balinese_grammar FOR SELECT
USING (diterbitkan = true);

-- Operasi tulis (INSERT, UPDATE, DELETE) dikelola oleh Backend Admin / Service Role

-- 4. SEED DATA AWAL TATA BAHASA BALI (5 MATERI UTAMA)
INSERT INTO public.balinese_grammar (
  judul, slug, kategori, tingkat, ringkasan, penjelasan_markdown, pola_rumus, contoh_kalimat, urutan, diterbitkan
) VALUES
(
  'Sor Singgih Basa Bali: Tingkatan Bahasa',
  'sor-singgih-basa-bali',
  'sor-singgih',
  'semua tingkatan',
  'Prinsip tata krama berbahasa Bali berdasarkan status sosial, keakraban, dan penghormatan lawan bicara.',
  '## Mengenal Sor Singgih Basa Bali

Bahasa Bali memiliki sistem tingkatan bahasa (*Sor Singgih Basa*) yang mencerminkan rasa hormat dan etika pergaulan masyarakat. Secara garis besar, terdapat empat tingkatan utama:

1. **Alus Singgih (ASI):** Digunakan untuk menghormati lawan bicara yang berstatus lebih tinggi (orang tua, sulinggih, tamu terhormat).
2. **Alus Sor (ASO):** Digunakan untuk merendahkan diri sendiri saat berbicara dengan orang yang dihormati sebagai wujud sopan santun.
3. **Alus Madya (AMA):** Bahasa halus tingkat menengah yang paling netral dan aman digunakan oleh wisatawan kepada masyarakat umum.
4. **Andap (Kepara):** Bahasa sehari-hari yang dipakai antar teman akrab atau sesama yang seumuran.',
  'Subjek + Kruna Alus + Keterangan',
  '[
    {"bali": "Titiang nunas pamit mangkin.", "indonesia": "Saya mohon pamit sekarang.", "catatan": "Alus Sor: Titiang (saya merendah) + nunas pamit."},
    {"bali": "Ragané sampun ngajeng?", "indonesia": "Apakah Anda sudah bersantap?", "catatan": "Alus Singgih: Ragané (Anda) + ngajeng (makan sopan)."},
    {"bali": "Tiang luas ka pasar.", "indonesia": "Saya pergi ke pasar.", "catatan": "Andap: Tiang + luas."}
  ]'::jsonb,
  1,
  true
),
(
  'Kata Ganti Orang (Pronomina) dalam Bahasa Bali',
  'kata-ganti-orang-pronomina',
  'pronomina',
  'semua tingkatan',
  'Penggunaan kata ganti pertama, kedua, dan ketiga yang disesuaikan dengan derajat kesopanan.',
  '## Sistem Pronomina Bahasa Bali

Memilih kata ganti orang yang tepat sangat krusial dalam bahasa Bali agar tidak menyinggung perasaan lawan bicara.

### Kata Ganti Orang Pertama (Saya / Kami)
- **Titiang:** Sangat halus (Alus Sor), dipakai kepada orang tua, tokoh agama, atau saat berbicara di forum resmi.
- **Tiang:** Halus menengah (Alus Madya), paling lazim dan aman digunakan wisatawan saat berbelanja atau bertanya arah.
- **Icang / Awake:** Akrab / kasar (Andap), hanya kepada sahabat karib sebaya.

### Kata Ganti Orang Kedua (Anda / Kamu)
- **Ragané / Idané:** Alus Singgih, sangat sopan untuk menyapa orang terhormat.
- **Jeroné:** Sopan, menyapa orang baru yang belum dikenal namanya.
- **Bli (Laki-laki) / Mbok (Perempuan):** Sapaan kekeluargaan yang ramah dan akrab di Bali.
- **Cai / Nyai:** Kasar, jangan pernah digunakan kepada orang lain.',
  'Pronomina Alus + Predikat Alus',
  '[
    {"bali": "Titiang mawasta Putu.", "indonesia": "Nama hamba adalah Putu.", "catatan": "Titiang (saya) + mawasta (bernama - alus)."},
    {"bali": "Sira peséngan ragane?", "indonesia": "Siapakah nama Anda yang terhormat?", "catatan": "Sira (siapa - alus) + peséngan (nama - alus singgih)."}
  ]'::jsonb,
  2,
  true
),
(
  'Pola Kalimat Dasar Bahasa Bali (SPO)',
  'pola-kalimat-dasar-bahasa-bali',
  'sintaksis',
  'umum',
  'Struktur susunan kalimat deklaratif, interogatif, dan imperatif dalam tuturan harian Bali.',
  '## Struktur Kalimat Bahasa Bali

Pada dasarnya, susunan tata kalimat bahasa Bali memiliki kemiripan dengan bahasa Indonesia, yaitu berpola **Subjek - Predikat - Objek - Keterangan (S-P-O-K)**.

Namun, terdapat ciri khas:
1. Penempatan kata penunjuk (*puniki* = ini, *punika* = itu) selalu diletakkan **setelah** kata benda.
2. Kalimat tanya sering menggunakan partikel penegas seperti *napi* (apa), *sira* (siapa), *ring dija* (di mana), dan *dija* (mana).',
  'Subjek + Predikat + Objek + Kata Penunjuk (puniki/punika)',
  '[
    {"bali": "Wayan numbas buah ring peken.", "indonesia": "Wayan membeli buah di pasar.", "catatan": "S: Wayan, P: numbas, O: buah, K: ring peken."},
    {"bali": "Banten puniki sampun puput.", "indonesia": "Sesaji ini sudah selesai dibuat.", "catatan": "Benda (Banten) diikuti penunjuk (puniki)."}
  ]'::jsonb,
  3,
  true
),
(
  'Kruna Polah & Pembentukan Kata Kerja Aktif (Afiksasi)',
  'kruna-polah-afiksasi',
  'afiksasi',
  'umum',
  'Aturan pembentukan kata kerja aktif (nasalisasi) dari kata dasar dalam bahasa Bali.',
  '## Kruna Polah (Nasalisasi)

Dalam bahasa Bali, kata kerja aktif transitif dibentuk dari kata dasar (*kruna lingga*) yang mengalami proses nasalisasi (*anusuara*).

Aturan perubahan konsonan awal:
- **b, p** berubah menjadi **m-** (contoh: *baca* -> *maca*, *pancing* -> *mancing*)
- **d, t** berubah menjadi **n-** (contoh: *tumbas* -> *numbas*, *tulis* -> *nulis*)
- **j, c, s** berubah menjadi **ny-** (contoh: *jemak* -> *nyemak*, *sampat* -> *nyampat*)
- **g, k, vokal** berubah menjadi **ng-** (contoh: *goreng* -> *ngoreng*, *alap* -> *ngalap*)',
  'Anusuara (m-, n-, ny-, ng-) + Kruna Lingga',
  '[
    {"bali": "Ibu nyampat ring natahé.", "indonesia": "Ibu menyapu di halaman.", "catatan": "Kata dasar: sampat -> nyampat."},
    {"bali": "Bapak numbas ajengan ring warung.", "indonesia": "Bapak membeli makanan di warung.", "catatan": "Kata dasar: tumbas -> numbas."}
  ]'::jsonb,
  4,
  true
),
(
  'Ungkapan Santun & Etika Bertanya Arah untuk Wisatawan',
  'tata-krama-bertanya-arah',
  'tata-krama',
  'alus madya',
  'Panduan etika berbicara saat menyapa warga, memohon izin, dan menanyakan lokasi destinasi.',
  '## Etika Bertanya kepada Warga Lokal

Masyarakat Bali sangat menghargai wisatawan yang memulai percakapan dengan nada sopan dan gestur tubuh yang santun.

Tips penting:
1. Awali dengan sapaan salam (*Om Swastyastu*) atau sapaan kekeluargaan (*Nunas lugra bli/mbok*).
2. Gunakan kata *nunas lugra* (mohon izin / permisi) atau *nunas tulung* (minta tolong).
3. Jangan menunjuk arah atau pura dengan jari telunjuk; gunakan jempol tangan kanan diiringi senyuman hangat.
4. Akhiri selalu dengan ucapan *Matur suksma* (terima kasih banyak).',
  'Nunas lugra + Sapaan + Pertanyaan Arah + Matur suksma',
  '[
    {"bali": "Nunas lugra bli, ring dija margi ka Pasih Amed?", "indonesia": "Permisi bli, di mana jalan menuju Pantai Amed?", "catatan": "Nunas lugra (permisi) + ring dija margi (di mana jalan)."},
    {"bali": "Matur suksma antuk pituduh ragane.", "indonesia": "Terima kasih banyak atas petunjuk Anda.", "catatan": "Ucapan penutup yang sangat dihargai warga lokal."}
  ]'::jsonb,
  5,
  true
)
ON CONFLICT (slug) DO NOTHING;
