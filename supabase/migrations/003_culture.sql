-- ==============================================================================
-- TOUR PENJELAJAH BALI — MIGRATION 003: CULTURE ENCYCLOPEDIA (ENSIKLOPEDIA BUDAYA)
-- Tabel artikel budaya, kategori, markdown content, dan relasi place_culture
-- Bali Digifest 2026 (AI Web Innovation Challenge)
-- ==============================================================================

-- 1. BUAT TABEL CULTURE_ARTICLES
CREATE TABLE IF NOT EXISTS public.culture_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  judul TEXT NOT NULL,
  nama_alternatif TEXT[],
  kategori TEXT NOT NULL CHECK (kategori IN ('upacara', 'tari', 'kuliner', 'arsitektur', 'kerajinan', 'tradisi', 'etika')),
  ringkasan TEXT NOT NULL,
  isi_markdown TEXT NOT NULL,
  gambar_url TEXT,
  wilayah TEXT DEFAULT 'Seluruh Bali',
  sumber TEXT[] DEFAULT ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  diterbitkan BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Index pencarian dan filter
CREATE INDEX IF NOT EXISTS idx_culture_slug ON public.culture_articles (slug);
CREATE INDEX IF NOT EXISTS idx_culture_kategori ON public.culture_articles (kategori);
CREATE INDEX IF NOT EXISTS idx_culture_diterbitkan ON public.culture_articles (diterbitkan);

-- GIN Trigram index untuk pencarian teks jika pg_trgm tersedia
CREATE INDEX IF NOT EXISTS idx_culture_judul_trgm ON public.culture_articles USING gin (judul gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_culture_ringkasan_trgm ON public.culture_articles USING gin (ringkasan gin_trgm_ops);

-- 2. BUAT TABEL PENGHUBUNG PLACE_CULTURE
CREATE TABLE IF NOT EXISTS public.place_culture (
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  culture_id UUID NOT NULL REFERENCES public.culture_articles(id) ON DELETE CASCADE,
  PRIMARY KEY (place_id, culture_id)
);

CREATE INDEX IF NOT EXISTS idx_place_culture_place_id ON public.place_culture (place_id);
CREATE INDEX IF NOT EXISTS idx_place_culture_culture_id ON public.place_culture (culture_id);

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.culture_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_culture ENABLE ROW LEVEL SECURITY;

-- Policy Baca Publik (Culture Articles)
CREATE POLICY "Artikel budaya dapat dibaca oleh publik"
ON public.culture_articles
FOR SELECT
USING (diterbitkan = true);

-- Policy Baca Publik (Place Culture)
CREATE POLICY "Relasi tempat dan budaya dapat dibaca oleh publik"
ON public.place_culture
FOR SELECT
USING (true);

-- Tulis dibatasi untuk admin / service_role (default aman Supabase)

-- ==============================================================================
-- 4. SEED 10 ARTIKEL PENGANTAR ENSIKLOPEDIA BUDAYA BALI
-- ==============================================================================

INSERT INTO public.culture_articles (
  slug, judul, nama_alternatif, kategori, ringkasan, isi_markdown,
  gambar_url, wilayah, sumber, diterbitkan
) VALUES
-- ------------------------------------------------------------------------------
-- 1. ETIKA PURA
-- ------------------------------------------------------------------------------
(
  'etika-berkunjung-ke-pura-bali',
  'Etika & Tata Krama Berkunjung ke Pura di Bali',
  ARRAY['Dharmaning Melancaran ka Pura', 'Aturan Masuk Pura', 'Temple Etiquette Bali'],
  'etika',
  'Panduan etika sakral saat menginjakkan kaki di kawasan suci pura: mulai dari pakaian adat (kamben dan senteng), sikap tubuh, hingga larangan pantangan.',
  '## Menjaga Kesucian Rumah Ibadah

Pura di Bali bukan sekadar destinasi arsitektur bersejarah, melainkan tempat bersemayam para dewa dan roh leluhur yang disucikan umat Hindu. Oleh karena itu, terdapat tata krama perilaku (*dharmaning malancaran*) yang wajib dipatuhi oleh setiap pengunjung.

### 1. Busana yang Tepat: Kamben dan Senteng
- **Kamben (Sarung):** Seluruh pengunjung wajib mengenakan kain bawahan yang menutupi kaki hingga di bawah lutut.
- **Senteng (Selendang):** Diikatkan di pinggang di luar kamben, melambangkan pengikatan hawa nafsu dan kesiapan diri memasuki ranah suci.
- **Bahu Tertutup:** Hindari pakaian tanpa lengan atau baju terbuka.

### 2. Konsep Pembagian Ruang (Tri Mandala)
Kawasan pura terbagi menjadi tiga zona konsentris:
1. **Nista Mandala (Jaba Sisi):** Halaman terluar tempat parkir dan kegiatan umum.
2. **Madya Mandala (Jaba Tengah):** Halaman tengah tempat pertunjukan tari wali atau persiapan sesaji.
3. **Utama Mandala (Jeroan):** Area tersuci tempat pelinggih utama berdiri. Area ini khusus untuk bersembahyang. Bila tidak sedang beribadah, wisatawan dilarang melangkah ke area pelinggih tanpa didampingi pemangku.

### 3. Pantangan Penting
- **Jangan Berdiri Lebih Tinggi:** Hindari berdiri di tempat yang posisinya lebih tinggi dari pemangku yang sedang memimpin doa atau pelinggih sesaji.
- **Kondisi Cuntaka:** Seseorang yang sedang berduka (kematian keluarga dekat), wanita yang sedang menstruasi, atau memiliki luka terbuka berdarah diharapkan tidak memasuki area dalam pura sebagai wujud penghormatan spiritual.
- **Menghormati Canang & Dupa:** Jangan pernah melangkahi atau menginjak sesaji canang yang masih mengepulkan asap dupa.
- **Drone & Fotografi:** Jangan mengarahkan kamera atau lampu kilat tepat di hadapan pemangku yang sedang melafalkan puja mantram.

Dengan mematuhi etika ini, Anda turut melestarikan kesakralan dan kedamaian spiritual Pulau Dewata.',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'Seluruh Bali',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 2. CANANG SARI
-- ------------------------------------------------------------------------------
(
  'filosofi-canang-sari-persembahan-harian',
  'Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian',
  ARRAY['Canang Sari Bali', 'Banten Canang', 'Makna Canang'],
  'upacara',
  'Anyaman daun kelapa muda berisikan bunga lima warna dan harum dupa yang menghiasi sudut jalanan dan pelinggih pura sebagai wujud syukur harian.',
  '## Persembahan Tulus Tanpa Pamrih

Setiap pagi di Bali diawali dengan pemandangan anggun para wanita meletakkan anyaman janur mungil berisi bunga warna-warni di ambang pintu, perempatan jalan, dan pelinggih rumah. Sesaji harian ini dikenal sebagai **Canang Sari**.

### Asal Kata dan Filosofi
Kata *Canang* berakar dari bahasa Jawa Kuno:
- **Ca:** berarti indah, menyejukkan hati.
- **Nang:** berarti tujuan, ketulusan, atau wadah persembahan.
- **Sari:** berarti inti saripati atau kesucian budi pekerti.

Secara filosofis, Canang Sari melambangkan rasa syukur yang mendalam atas segala karunia kehidupan yang dilimpahkan oleh *Sang Hyang Widhi Wasa* beserta manifestasi-Nya.

### Komponen Simbolik Canang Sari
1. **Ceper:** Alas anyaman janur segi empat melambangkan *ardha candra* atau kekuatan bumi penciptaan.
2. **Porosan:** Terbuat dari daun sirih, kapur sirih, dan buah pinang yang melambangkan **Tri Murti** (Dewa Brahma - merah/pinang, Wisnu - hitam/sirih, Siwa - putih/kapur).
3. **Bunga Berwarna-Warni (Panca Dewata):**
   - **Bunga Putih:** Mengarah ke Timur, menghormati Dewa Iswara.
   - **Bunga Merah:** Mengarah ke Selatan, menghormati Dewa Brahma.
   - **Bunga Kuning:** Mengarah ke Barat, menghormati Dewa Mahadewa.
   - **Bunga Hitam / Biru:** Mengarah ke Utara, menghormati Dewa Wisnu.
   - **Bunga Kembang Rampe (Warna-warni di Tengah):** Menghormati Dewa Siwa sebagai pusat keseimbangan semesta.
4. **Dupa Harum:** Melambangkan pengantar doa dan saksi api suci (Agni) yang membawa permohonan ke alam niskala.

### Etika Wisatawan Terhadap Canang
Bila Anda berjalan di trotoar atau gang desa dan melihat canang tergeletak, cukup lewati dengan hati-hati. Jangan melangkahi atau menendangnya, terutama bila dupa masih menyala.',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  'Seluruh Bali',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 3. SUBAK
-- ------------------------------------------------------------------------------
(
  'sistem-irigasi-subak-tri-hita-karana',
  'Sistem Subak: Harmoni Manusia, Alam, dan Spiritualitas dalam Pengairan Bali',
  ARRAY['Subak Bali', 'Organisasi Pengairan Tradisional', 'Warisan Budaya Dunia UNESCO Subak'],
  'tradisi',
  'Kearifan lokal pengelolaan air sawah komunal berusia lebih dari seribu tahun yang diakui UNESCO, berasaskan filosofi keharmonisan Tri Hita Karana.',
  '## Mahakarya Hidrologi Tradisional

Terasering persawahan hijau yang menyejukkan mata di Jatiluwih, Pupuan, dan Tegalalang bukan sekadar pesona lansekap estetis. Di balik keindahannya tersimpan kejeniusan sosial-ekologis bernama **Subak**, sistem pengelolaan air sawah mandiri yang telah berjalan sejak abad ke-11 Masehi.

Pada tahun 2012, UNESCO secara resmi menetapkan Subak sebagai **Warisan Budaya Dunia** karena dinilai mempraktikkan lanskap budaya yang berkelanjutan.

### Nilai Luhur Tri Hita Karana dalam Subak
Subak tidak beroperasi semata-mata sebagai asosiasi petani pemakai air, melainkan sebuah lembaga sosio-religius yang berakar pada tiga keharmonisan:
1. **Parhyangan (Hubungan dengan Tuhan):** Setiap subak memiliki jaringan pura, mulai dari *Pura Ulun Suwi* di sawah hingga *Pura Danau Batur* sebagai hulu mata air agung Bali. Petani menggelar ritual doa pada setiap tahapan menanam padi.
2. **Pawongan (Hubungan Antar-Sesama):** Air dibagi secara adil dan demokratis melalui musyawarah anggota yang dipimpin oleh *Pekaseh* (ketua subak). Petani di hulu tidak boleh memonopoli air dari petani di hilir.
3. **Palemahan (Hubungan dengan Alam):** Pola tanam serempak (*kerta masa*) diterapkan untuk memutus siklus hama secara biologis tanpa merusak kesuburan tanah.

### Manfaat bagi Keberlanjutan Bali
Sistem Subak membuktikan bahwa kearifan tradisional mampu menjaga ketahanan pangan pulau selama berabad-abad tanpa menguras lingkungan, sekaligus membentuk bentang alam Bali yang ikonik.',
  'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
  'Tabanan',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 4. TARI KECAK
-- ------------------------------------------------------------------------------
(
  'tari-kecak-seni-suara-dan-kisah-ramayana',
  'Tari Kecak: Kidung Paduan Suara Sakral dan Epik Ramayana',
  ARRAY['Kecak Ramayana', 'Tari Cak', 'Tari Api Kecak'],
  'tari',
  'Pertunjukan drama tari tanpa instrumen gamelan, diiringi paduan suara vokal puluhan pria yang melantunkan irama cak-cak bertempo dinamis.',
  '## Gema Suara Paduan Jiwa

Di antara puluhan seni tari Bali, **Tari Kecak** memiliki keunikan paling mencolok: tidak ada alunan instrumen gamelan logam (gong atau gangsa) yang mengiringinya. Seluruh musik latar dihasilkan murni oleh paduan suara vokal puluhan hingga ratusan pria yang duduk bersila melingkari api suci.

### Akar Tradisi Sanghyang
Tari Kecak berakar dari tradisi sakral kuno **Sanghyang Dedari**, sebuah tarian ritual penolak bala di mana paduan suara vokal dilantunkan untuk mengiringi penari yang kerasukan roh suci (*trance*).

Pada dekade 1930-an, seniman tari Bali legendaris **Wayan Limbak** bekerja sama dengan pelukis asal Jerman **Walter Spies** mentransformasikan paduan vokal padat tersebut menjadi sendratari naratif yang membawakan wiracarita **Ramayana**.

### Struktur Pertunjukan
- **Pola Vokal Polifoni:** Para penari vokal mengenakan kain poleng hitam-putih melingkari api damar. Mereka membagi suara dalam harmoni bertingkat (*cak-cak-ke-cak*) dengan tempo yang dapat melambat khidmat lalu meledak cepat penuh energi.
- **Kisah Ramayana:** Alur cerita menampilkan penculikan Dewi Sita oleh Rahwana, pertempuran Rama dan Laksamana, hingga bantuan setia pasukan kera yang dipimpin oleh ksatria Hanoman.
- **Klimaks Tarian Api (Hanoman Obong):** Hanoman dikepung oleh lingkaran bara api sabut kelapa yang membara, lalu secara magis menendang dan memadamkan api tersebut tanpa terluka.

Pertunjukan ini mengajarkan pesan abadi tentang kemenangan kebajikan (*dharma*) atas angkara murka (*adharma*).',
  'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80',
  'Badung',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 5. OGOH-OGOH
-- ------------------------------------------------------------------------------
(
  'tradisi-ogoh-ogoh-malam-pengerupukan-nyepi',
  'Ogoh-Ogoh: Patung Raksasa Simbol Bhuta Kala pada Malam Pengerupukan',
  ARRAY['Pawai Ogoh-ogoh', 'Pengerupukan', 'Tawur Agung Kesanga'],
  'tradisi',
  'Kreativitas seni patung raksasa pemuda banjar yang diarak meriah sebelum hening total Hari Suci Nyepi.',
  '## Kemeriahan Sebelum Keheningan Agung

Sehari sebelum Pulau Bali memasuki keheningan hening total dalam rangka **Hari Suci Nyepi (Tahun Baru Caka)**, pulau ini terlebih dahulu diramaikan oleh salah satu parade seni paling spektakuler di dunia: **Pawai Ogoh-Ogoh** pada malam *Pengerupukan*.

### Makna Spiritual Bhuta Kala
*Ogoh-ogoh* adalah karya seni patung raksasa berwujud sosok menyeramkan yang menggambarkan **Bhuta Kala**—personifikasi energi negatif, sifat serakah, amarah, dan kekacauan yang ada di alam semesta maupun di dalam diri manusia.

Pada sore hari *Pengerupukan*, warga menggelar upacara *Tawur Kesanga* di perempatan jalan agung (*catur pata*) untuk menyucikan lingkungan. Ketika malam tiba, ogoh-ogoh diarak berputar-putar diiringi dentuman musik gamelan baleganjur yang menggelegar serta obor api. Tujuannya adalah mengusir dan menenteramkan roh-roh pengganggu agar tidak mengusik kedamaian manusia.

### Kreativitas dan Ramah Lingkungan
Pembuatan ogoh-ogoh digarap berbulan-bulan sebelumnya oleh kelompok pemuda banjar (*Sekaa Teruna Teruni*). Kini, komunitas pemuda Bali giat beralih meninggalkan styrofoam dan menggunakan bahan-bahan alami ramah lingkungan:
- Kerangka bambu dan rotan
- Pelapis bubur kertas koran bekas
- Anyaman serat ijuk, daun kelapa, dan pewarna alam

Di akhir parade atau menjelang fajar, ogoh-ogoh secara simbolis dibakar atau dinetralkan sebagai lambang pemusnahan sifat buruk sebelum memasuki perenungan *Catur Brata Penyepian*.',
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  'Seluruh Bali',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 6. KAIN TENUN ENDEK & SONGKET
-- ------------------------------------------------------------------------------
(
  'kain-tenun-gringsing-endek-dan-songket',
  'Kain Tenun Tradisional Bali: Gringsing, Endek, dan Songket',
  ARRAY['Tenun Ikat Bali', 'Kain Pegringsingan', 'Wastra Bali'],
  'kerajinan',
  'Warisan adiluhung tenun ikat ganda langka dari Desa Tenganan serta keindahan motif geometris kain endek dan kemewahan benang emas songket.',
  '## Mahakarya Wastra Pulau Dewata

Kain tradisional (*wastra*) di Bali bukan sekadar pelindung raga atau komoditas fesyen. Kain merupakan media spiritual pembatas antara dunia suci dan dunia profan, serta penanda status kehormatan adat.

### 1. Kain Gringsing (Tenganan Pegringsingan)
Kain Gringsing merupakan salah satu warisan tekstil paling langka di dunia karena dibuat menggunakan teknik **ikat ganda** (*double ikat*), di mana benang pakan dan benang lungsi sama-sama diikat dan diwarnai sebelum ditenun. Di seluruh dunia, teknik ini hanya ada di Bali (Desa Tenganan), India, dan Jepang.

Nama *Gringsing* berasal dari:
- **Gring:** bermakna sakit atau mara bahaya.
- **Sing:** bermakna tidak.
Secara filosofis, kain ini dipercaya sebagai perisai magis penolak bala dan penyakit. Proses pembuatannya memakai pewarna alami herbal dan memakan waktu hingga 2 sampai 5 tahun untuk satu helai kain.

### 2. Kain Endek
Kain Endek ditenun dengan teknik ikat pakan tunggal. Ciri khasnya terletak pada motif geometris, flora, dan fauna yang luwes dengan gradasi warna yang hangat. Kini, Endek telah diakui sebagai warisan budaya nasional dan bahkan dilirik oleh rumah mode internasional.

### 3. Songket Bali
Songket ditenun dengan menyisipkan benang emas atau perak di atas dasar kain sutra atau katun. Kain ini memancarkan kemewahan agung dan umumnya dikenakan pada momentum sakral penting seperti upacara potong gigi (*metatah*) dan pernikahan adat.',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
  'Karangasem',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 7. ARSITEKTUR ASTA KOSALA KOSALI
-- ------------------------------------------------------------------------------
(
  'arsitektur-asta-kosala-kosali-rumah-tradisional',
  'Asta Kosala Kosali: Pedoman Tata Ruang dan Arsitektur Tradisional Bali',
  ARRAY['Arsitektur Bali', 'Bale Tradisional', 'Sanga Mandala Arsitektur'],
  'arsitektur',
  'Filosofi arsitektur sakral khas Bali yang mengatur tata letak bangunan rumah, pura, dan banjar berdasarkan proporsi anatomi tubuh pemilik rumah.',
  '## Membangun Selaras Tubuh dan Semesta

Rumah tradisional Bali tidak dirancang secara acak. Seluruh penataan ruang, dimensi tiang kayu, hingga jarak pagar halaman berpedoman pada kitab lontar suci bernama **Asta Kosala Kosali** dan **Asta Bumi**.

### Prinsip Ukuran Anatomi (Antropometri)
Keunikan utama arsitektur Bali adalah ukurannya yang disesuaikan secara personal dengan tubuh kepala keluarga:
- **Depa:** Rentangan kedua tangan dari ujung jari kiri ke kanan.
- **Lengkat:** Jarak dari ujung ibu jari ke ujung jari kelingking yang direntangkan.
- **Musti:** Ukuran kepalan tangan tegak.
- **Rai:** Jarak dari dahi ke dagu.

Penggunaan proporsi tubuh ini bermakna bahwa rumah adalah perpanjangan mikrokosmos dari diri sang penghuni, sehingga tercipta kenyamanan batin dan keselarasan energi.

### Konsep Sanga Mandala (9 Zona Ruang)
Sebuah pekarangan rumah tradisional Bali dibagi menjadi sembilan petak koordinat berdasarkan sumbu *Kaja-Kelod* (Gunung-Laut) dan *Kangin-Kauh* (Matahari Terbit-Terbenam):
1. **Utama Ning Utama (Kaja-Kangin):** Sudut tersuci, dialokasikan untuk **Merajan / Sanggah** (tempat ibadah keluarga).
2. **Madya (Tengah Pekarangan):** Dialokasikan untuk tempat tinggal, seperti **Bale Dangin** (bale upacara), **Bale Daja / Gedong** (kamar tidur sesepuh), dan **Bale Dauh**.
3. **Nista Ning Nista (Kelod-Kauh):** Sudut paling hilir, dialokasikan untuk **Pawon** (dapur), tempat pembuangan, dan kandang ternak.

Pintu masuk halaman (*Angkul-angkul*) selalu dilengkapi dinding penyekat di baliknya yang disebut **Aling-aling**, berfungsi membelokkan aliran angin dan menangkal energi negatif agar tidak langsung menerobos ke tengah rumah.',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
  'Seluruh Bali',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 8. KULINER LAWAR & BASE GENEP
-- ------------------------------------------------------------------------------
(
  'kuliner-lawar-dan-bumbu-base-genep',
  'Base Genep dan Lawar: Jiwa dan Keseimbangan Cita Rasa Kuliner Bali',
  ARRAY['Bumbu Dasar Bali', 'Kuliner Lawar', 'Ajengan Tradisional'],
  'kuliner',
  'Rahasia kelezatan rempah khas Bali yang terdiri dari 15 macam bumbu akar, daun, dan biji yang melambangkan keharmonisan semesta.',
  '## Perpaduan Rempah Penakluk Rasa

Kekayaan cita rasa kuliner tradisional Bali yang kaya, pekat, dan gurih bersumber dari satu formula bumbu legendaris: **Base Genep** (bumbu lengkap).

### Komposisi Sakral Base Genep
Base Genep memadukan 15 macam bahan yang dibagi menjadi empat kelompok utama berfilosofi empat penjuru mata angin:
1. **Bumbu Rimpang / Akar (Umbi):** Cekuh (kencur), jahe, kunyit, dan isen (lengkuas).
2. **Bumbu Biji & Buah:** Bawang merah, bawang putih, cabai, kemiri, ketumbar, merica, dan pala.
3. **Bumbu Daun & Batang:** Serai, daun salam, daun jeruk purut.
4. **Penyedap Tradisional:** Terasi bakar (*kesuna cekuh*) dan garam laut Bali.

Semua rempah ini diulek atau dicincang halus di atas talenan kayu (*talenan batu*) lalu ditumis perlahan menggunakan minyak kelapa asli (*lenga tandik*).

### Tradisi Mebat dan Lawar
Hidangan paling ikonik yang memanfaatkan keajaiban Base Genep adalah **Lawar**. Lawar merupakan campuran sayuran cincang (kelapa parut bakar, nangka muda, atau kacang panjang) bersama daging cincang berbumbu.

Pembuatan lawar (*tradisi mebat*) dikerjakan secara gotong royong oleh kaum pria di banjar sejak dini hari menjelang hari raya besar seperti Galungan dan Kuningan. Mebat bukan sekadar memasak, melainkan ruang sosial mempererat tali persaudaraan (*menyama braya*) warga desa.',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
  'Gianyar',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 9. UPACARA MELASTI
-- ------------------------------------------------------------------------------
(
  'upacara-melasti-penyucian-ke-samudra',
  'Upacara Melasti: Ritual Suci Penyucian Arca dan Jiwa ke Segara',
  ARRAY['Melasti Nyepi', 'Ritual Segara', 'Panyucian Pratima'],
  'upacara',
  'Iring-iringan ribuan umat berbusana putih mengusung benda suci (pratima) menuju pantai beberapa hari sebelum Nyepi untuk memohon tirta amertha.',
  '## Perjalanan Air Menuju Samudra Kehidupan

Tiga hingga empat hari sebelum Hari Suci Nyepi, jalanan di seluruh pesisir Bali dipenuhi oleh prosesi arak-arakan kolosal berbalut kain putih dan kuning: **Upacara Melasti** (disebut juga *Mekiis* atau *Melis*).

### Makna Hakiki Melasti
Dalam kitab lontar *Sundarigama*, Melasti bertujuan untuk:
> *Nganyudang lara roga papa klesa ring segara*  
> (Menghanyutkan dan membersihkan segala penderitaan, kekotoran jiwa, dan noda duniawi ke laut).

Umat Hindu meyakini samudra (*segara*) dan danau suci (*danu*) sebagai sumber **Tirta Amertha** (air suci keabadian) yang mampu menyucikan alam semesta (*Bhuwana Agung*) dan diri manusia (*Bhuwana Alit*).

### Suasana Prosesi
- **Iring-iringan Pratima:** Benda-benda sakral perlambang dewa (*pratima*) dan pusaka pura diusung berjalan kaki dari pura desa menuju bibir pantai.
- **Simfoni Baleganjur:** Dentuman gong dan ceng-ceng gamelan baleganjur mengiringi derap langkah dengan irama cepat penuh semangat.
- **Pemandangan Pantai:** Di tepi ombak, ratusan umat duduk bersila melantunkan mantram permohonan berkah dipimpin oleh para pemangku yang memercikkan air laut suci ke arca-arca pura.

### Panduan bagi Fotografer dan Wisatawan
- Berpakaian adat rapi (kamben dan senteng).
- Jangan memotong atau berjalan melintasi barisan depan arak-arakan pembawa pratima.
- Dilarang keras menerbangkan drone di atas area upacara dan kepala para pemangku.',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  'Seluruh Bali',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
),

-- ------------------------------------------------------------------------------
-- 10. TARI PENDET
-- ------------------------------------------------------------------------------
(
  'tari-pendet-tarian-penyambutan-dan-penghormatan',
  'Tari Pendet: Tarian Klasik Penyambutan Penuh Keanggunan',
  ARRAY['Pendet Bali', 'Tari Selamat Datang Bali', 'Tari Tabur Bunga'],
  'tari',
  'Tarian anggun wanita Bali membawakan bokor berisi kelopak bunga segar yang ditaburkan sebagai ungkapan selamat datang dan rasa hormat.',
  '## Taburan Bunga Keberkahan

Dengan senyum ramah, gerak mata yang dinamis (*seledet*), dan liukan jemari yang lentur, para penari wanita menaburkan kelopak bunga warna-warni ke arah penonton di akhir tarian. Inilah pesona **Tari Pendet**, salah satu tari tradisional Bali tertua yang paling dicintai.

### Transformasi dari Ritual Sakral ke Seni Pertunjukan
Awalnya, Tari Pendet adalah tarian pemujaan (*tari wali*) yang dipentaskan di halaman dalam pura (*jeroan*) saat upacara piodalan berlangsung. Tarian ini melambangkan penyambutan atas turunnya para dewa dan roh leluhur ke alam duniawi.

Pada dekade 1950-an, maestro tari Bali **I Wayan Beratha** mengadaptasi Tari Pendet menjadi tarian penyambutan kehormatan untuk menyambut tamu agung dan wisatawan mancanegara tanpa mengurangi keanggunan nilai sakralnya.

### Ciri Khas Gerakan
1. **Ngegol:** Gerakan pinggul yang bergoyang luwes mengikuti tempo ketukan gong.
2. **Seledet:** Gerakan bola mata yang melirik tajam ke kiri dan ke kanan secara ekspresif, menjadi ciri khas utama ekspresi tari Bali.
3. **Bokor Perak:** Penari memegang bokor berukir perak yang dipenuhi bunga kamboja, mawar, dan kenanga harum yang ditaburkan sebagai doa restu keselamatan.

Tari Pendet menjadi lambang keramahan dan kehangatan hati masyarakat Bali dalam menyambut siapa saja yang datang berkunjung dengan niat baik.',
  'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80',
  'Denpasar',
  ARRAY['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
  true
)
ON CONFLICT (slug) DO UPDATE
SET
  judul = EXCLUDED.judul,
  nama_alternatif = EXCLUDED.nama_alternatif,
  kategori = EXCLUDED.kategori,
  ringkasan = EXCLUDED.ringkasan,
  isi_markdown = EXCLUDED.isi_markdown,
  gambar_url = EXCLUDED.gambar_url,
  wilayah = EXCLUDED.wilayah,
  sumber = EXCLUDED.sumber,
  diterbitkan = EXCLUDED.diterbitkan;

-- ==============================================================================
-- 5. HUBUNGKAN ARTIKEL BUDAYA KE PLACES (PLACE_CULTURE)
-- ==============================================================================

-- 1. Etika Pura -> Destinasi Pura & Sejarah
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'etika-berkunjung-ke-pura-bali'
  AND (p.name ILIKE '%Pura%' OR p.name ILIKE '%Candi%' OR p.name ILIKE '%Pedawa%')
ON CONFLICT DO NOTHING;

-- 2. Canang Sari -> Destinasi Budaya & Desa Adat
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'filosofi-canang-sari-persembahan-harian'
  AND (p.category = 'budaya' OR p.name ILIKE '%Pedawa%' OR p.name ILIKE '%Penglipuran%')
ON CONFLICT DO NOTHING;

-- 3. Subak -> Destinasi Persawahan & Air
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'sistem-irigasi-subak-tri-hita-karana'
  AND (p.name ILIKE '%Jatiluwih%' OR p.name ILIKE '%Sekumpul%' OR p.name ILIKE '%Leke Leke%')
ON CONFLICT DO NOTHING;

-- 4. Tari Kecak -> Pura & Pusat Budaya
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'tari-kecak-seni-suara-dan-kisah-ramayana'
  AND (p.name ILIKE '%Lempuyang%' OR p.name ILIKE '%Gunung Kawi%')
ON CONFLICT DO NOTHING;

-- 5. Ogoh-ogoh -> Desa Adat Tradisi
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'tradisi-ogoh-ogoh-malam-pengerupukan-nyepi'
  AND (p.name ILIKE '%Pedawa%' OR p.name ILIKE '%Tenganan%')
ON CONFLICT DO NOTHING;

-- 6. Tenun Gringsing & Endek -> Tenganan & Klungkung
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'kain-tenun-gringsing-endek-dan-songket'
  AND (p.name ILIKE '%Tenganan%' OR p.region = 'Klungkung' OR p.region = 'Karangasem')
ON CONFLICT DO NOTHING;

-- 7. Arsitektur Asta Kosala Kosali -> Desa Pedawa & Arsitektur Bambu
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'arsitektur-asta-kosala-kosali-rumah-tradisional'
  AND (p.name ILIKE '%Pedawa%' OR p.name ILIKE '%Gunung Kawi%')
ON CONFLICT DO NOTHING;

-- 8. Base Genep & Lawar -> Seluruh Tempat Kuliner
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'kuliner-lawar-dan-bumbu-base-genep'
  AND p.type = 'kuliner'
ON CONFLICT DO NOTHING;

-- 9. Melasti -> Destinasi Pesisir & Pura
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'upacara-melasti-penyucian-ke-samudra'
  AND (p.category = 'pantai' OR p.name ILIKE '%Amed%' OR p.name ILIKE '%Lempuyang%')
ON CONFLICT DO NOTHING;

-- 10. Tari Pendet -> Destinasi Wisata Budaya
INSERT INTO public.place_culture (place_id, culture_id)
SELECT p.id, c.id
FROM public.places p, public.culture_articles c
WHERE c.slug = 'tari-pendet-tarian-penyambutan-dan-penghormatan'
  AND (p.name ILIKE '%Gunung Kawi%' OR p.name ILIKE '%Pedawa%')
ON CONFLICT DO NOTHING;
