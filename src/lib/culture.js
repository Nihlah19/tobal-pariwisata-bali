/**
 * Ensiklopedia Budaya Bali — Data Access & Utilities
 * Mendukung pencarian Supabase dengan fallback dataset lokal lengkap & sanitasi Markdown aman
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { supabase } from './supabaseClient.js';

// ==============================================================================
// 1. DATASET LOKAL LENGKAP (10 ARTIKEL ENSIKLOPEDIA BUDAYA)
// ==============================================================================
export const FALLBACK_CULTURE_ARTICLES = [
  {
    id: 'c1',
    slug: 'etika-berkunjung-ke-pura-bali',
    judul: 'Etika & Tata Krama Berkunjung ke Pura di Bali',
    nama_alternatif: ['Dharmaning Melancaran ka Pura', 'Aturan Masuk Pura', 'Temple Etiquette Bali'],
    kategori: 'etika',
    ringkasan: 'Panduan etika sakral saat menginjakkan kaki di kawasan suci pura: mulai dari pakaian adat (kamben dan senteng), sikap tubuh, hingga larangan pantangan.',
    isi_markdown: `## Menjaga Kesucian Rumah Ibadah

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

Dengan mematuhi etika ini, Anda turut melestarikan kesakralan dan kedamaian spiritual Pulau Dewata.`,
    gambar_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Seluruh Bali',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '4 menit baca'
  },
  {
    id: 'c2',
    slug: 'filosofi-canang-sari-persembahan-harian',
    judul: 'Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian',
    nama_alternatif: ['Canang Sari Bali', 'Banten Canang', 'Makna Canang'],
    kategori: 'upacara',
    ringkasan: 'Anyaman daun kelapa muda berisikan bunga lima warna dan harum dupa yang menghiasi sudut jalanan dan pelinggih pura sebagai wujud syukur harian.',
    isi_markdown: `## Persembahan Tulus Tanpa Pamrih

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
Bila Anda berjalan di trotoar atau gang desa dan melihat canang tergeletak, cukup lewati dengan hati-hati. Jangan melangkahi atau menendangnya, terutama bila dupa masih menyala.`,
    gambar_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Seluruh Bali',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '3 menit baca'
  },
  {
    id: 'c3',
    slug: 'sistem-irigasi-subak-tri-hita-karana',
    judul: 'Sistem Subak: Harmoni Manusia, Alam, dan Spiritualitas dalam Pengairan Bali',
    nama_alternatif: ['Subak Bali', 'Organisasi Pengairan Tradisional', 'Warisan Budaya Dunia UNESCO Subak'],
    kategori: 'tradisi',
    ringkasan: 'Kearifan lokal pengelolaan air sawah komunal berusia lebih dari seribu tahun yang diakui UNESCO, berasaskan filosofi keharmonisan Tri Hita Karana.',
    isi_markdown: `## Mahakarya Hidrologi Tradisional

Terasering persawahan hijau yang menyejukkan mata di Jatiluwih, Pupuan, dan Tegalalang bukan sekadar pesona lansekap estetis. Di balik keindahannya tersimpan kejeniusan sosial-ekologis bernama **Subak**, sistem pengelolaan air sawah mandiri yang telah berjalan sejak abad ke-11 Masehi.

Pada tahun 2012, UNESCO secara resmi menetapkan Subak sebagai **Warisan Budaya Dunia** karena dinilai mempraktikkan lanskap budaya yang berkelanjutan.

### Nilai Luhur Tri Hita Karana dalam Subak
Subak tidak beroperasi semata-mata sebagai asosiasi petani pemakai air, melainkan sebuah lembaga sosio-religius yang berakar pada tiga keharmonisan:
1. **Parhyangan (Hubungan dengan Tuhan):** Setiap subak memiliki jaringan pura, mulai dari *Pura Ulun Suwi* di sawah hingga *Pura Danau Batur* sebagai hulu mata air agung Bali. Petani menggelar ritual doa pada setiap tahapan menanam padi.
2. **Pawongan (Hubungan Antar-Sesama):** Air dibagi secara adil dan demokratis melalui musyawarah anggota yang dipimpin oleh *Pekaseh* (ketua subak). Petani di hulu tidak boleh memonopoli air dari petani di hilir.
3. **Palemahan (Hubungan dengan Alam):** Pola tanam serempak (*kerta masa*) diterapkan untuk memutus siklus hama secara biologis tanpa merusak kesuburan tanah.

### Manfaat bagi Keberlanjutan Bali
Sistem Subak membuktikan bahwa kearifan tradisional mampu menjaga ketahanan pangan pulau selama berabad-abad tanpa menguras lingkungan, sekaligus membentuk bentang alam Bali yang ikonik.`,
    gambar_url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Tabanan',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '5 menit baca'
  },
  {
    id: 'c4',
    slug: 'tari-kecak-seni-suara-dan-kisah-ramayana',
    judul: 'Tari Kecak: Kidung Paduan Suara Sakral dan Epik Ramayana',
    nama_alternatif: ['Kecak Ramayana', 'Tari Cak', 'Tari Api Kecak'],
    kategori: 'tari',
    ringkasan: 'Pertunjukan drama tari tanpa instrumen gamelan, diiringi paduan suara vokal puluhan pria yang melantunkan irama cak-cak bertempo dinamis.',
    isi_markdown: `## Gema Suara Paduan Jiwa

Di antara puluhan seni tari Bali, **Tari Kecak** memiliki keunikan paling mencolok: tidak ada alunan instrumen gamelan logam (gong atau gangsa) yang mengiringinya. Seluruh musik latar dihasilkan murni oleh paduan suara vokal puluhan hingga ratusan pria yang duduk bersila melingkari api suci.

### Akar Tradisi Sanghyang
Tari Kecak berakar dari tradisi sakral kuno **Sanghyang Dedari**, sebuah tarian ritual penolak bala di mana paduan suara vokal dilantunkan untuk mengiringi penari yang kerasukan roh suci (*trance*).

Pada dekade 1930-an, seniman tari Bali legendaris **Wayan Limbak** bekerja sama dengan pelukis asal Jerman **Walter Spies** mentransformasikan paduan vokal padat tersebut menjadi sendratari naratif yang membawakan wiracarita **Ramayana**.

### Struktur Pertunjukan
- **Pola Vokal Polifoni:** Para penari vokal mengenakan kain poleng hitam-putih melingkari api damar. Mereka membagi suara dalam harmoni bertingkat (*cak-cak-ke-cak*) dengan tempo yang dapat melambat khidmat lalu meledak cepat penuh energi.
- **Kisah Ramayana:** Alur cerita menampilkan penculikan Dewi Sita oleh Rahwana, pertempuran Rama dan Laksamana, hingga bantuan setia pasukan kera yang dipimpin oleh ksatria Hanoman.
- **Klimaks Tarian Api (Hanoman Obong):** Hanoman dikepung oleh lingkaran bara api sabut kelapa yang membara, lalu secara magis menendang dan memadamkan api tersebut tanpa terluka.

Pertunjukan ini mengajarkan pesan abadi tentang kemenangan kebajikan (*dharma*) atas angkara murka (*adharma*).`,
    gambar_url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Badung',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '4 menit baca'
  },
  {
    id: 'c5',
    slug: 'tradisi-ogoh-ogoh-malam-pengerupukan-nyepi',
    judul: 'Ogoh-Ogoh: Patung Raksasa Simbol Bhuta Kala pada Malam Pengerupukan',
    nama_alternatif: ['Pawai Ogoh-ogoh', 'Pengerupukan', 'Tawur Agung Kesanga'],
    kategori: 'tradisi',
    ringkasan: 'Kreativitas seni patung raksasa pemuda banjar yang diarak meriah sebelum hening total Hari Suci Nyepi.',
    isi_markdown: `## Kemeriahan Sebelum Keheningan Agung

Sehari sebelum Pulau Bali memasuki keheningan hening total dalam rangka **Hari Suci Nyepi (Tahun Baru Caka)**, pulau ini terlebih dahulu diramaikan oleh salah satu parade seni paling spektakuler di dunia: **Pawai Ogoh-Ogoh** pada malam *Pengerupukan*.

### Makna Spiritual Bhuta Kala
*Ogoh-ogoh* adalah karya seni patung raksasa berwujud sosok menyeramkan yang menggambarkan **Bhuta Kala**—personifikasi energi negatif, sifat serakah, amarah, dan kekacauan yang ada di alam semesta maupun di dalam diri manusia.

Pada sore hari *Pengerupukan*, warga menggelar upacara *Tawur Kesanga* di perempatan jalan agung (*catur pata*) untuk menyucikan lingkungan. Ketika malam tiba, ogoh-ogoh diarak berputar-putar diiringi dentuman musik gamelan baleganjur yang menggelegar serta obor api. Tujuannya adalah mengusir dan menenteramkan roh-roh pengganggu agar tidak mengusik kedamaian manusia.

### Kreativitas dan Ramah Lingkungan
Pembuatan ogoh-ogoh digarap berbulan-bulan sebelumnya oleh kelompok pemuda banjar (*Sekaa Teruna Teruni*). Kini, komunitas pemuda Bali giat beralih meninggalkan styrofoam dan menggunakan bahan-bahan alami ramah lingkungan:
- Kerangka bambu dan rotan
- Pelapis bubur kertas koran bekas
- Anyaman serat ijuk, daun kelapa, dan pewarna alam

Di akhir parade atau menjelang fajar, ogoh-ogoh secara simbolis dibakar atau dinetralkan sebagai lambang pemusnahan sifat buruk sebelum memasuki perenungan *Catur Brata Penyepian*.`,
    gambar_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Seluruh Bali',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '4 menit baca'
  },
  {
    id: 'c6',
    slug: 'kain-tenun-gringsing-endek-dan-songket',
    judul: 'Kain Tenun Tradisional Bali: Gringsing, Endek, dan Songket',
    nama_alternatif: ['Tenun Ikat Bali', 'Kain Pegringsingan', 'Wastra Bali'],
    kategori: 'kerajinan',
    ringkasan: 'Warisan adiluhung tenun ikat ganda langka dari Desa Tenganan serta keindahan motif geometris kain endek dan kemewahan benang emas songket.',
    isi_markdown: `## Mahakarya Wastra Pulau Dewata

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
Songket ditenun dengan menyisipkan benang emas atau perak di atas dasar kain sutra atau katun. Kain ini memancarkan kemewahan agung dan umumnya dikenakan pada momentum sakral penting seperti upacara potong gigi (*metatah*) dan pernikahan adat.`,
    gambar_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Karangasem',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '5 menit baca'
  },
  {
    id: 'c7',
    slug: 'arsitektur-asta-kosala-kosali-rumah-tradisional',
    judul: 'Asta Kosala Kosali: Pedoman Tata Ruang dan Arsitektur Tradisional Bali',
    nama_alternatif: ['Arsitektur Bali', 'Bale Tradisional', 'Sanga Mandala Arsitektur'],
    kategori: 'arsitektur',
    ringkasan: 'Filosofi arsitektur sakral khas Bali yang mengatur tata letak bangunan rumah, pura, dan banjar berdasarkan proporsi anatomi tubuh pemilik rumah.',
    isi_markdown: `## Membangun Selaras Tubuh dan Semesta

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

Pintu masuk halaman (*Angkul-angkul*) selalu dilengkapi dinding penyekat di baliknya yang disebut **Aling-aling**, berfungsi membelokkan aliran angin dan menangkal energi negatif agar tidak langsung menerobos ke tengah rumah.`,
    gambar_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Seluruh Bali',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '4 menit baca'
  },
  {
    id: 'c8',
    slug: 'kuliner-lawar-dan-bumbu-base-genep',
    judul: 'Base Genep dan Lawar: Jiwa dan Keseimbangan Cita Rasa Kuliner Bali',
    nama_alternatif: ['Bumbu Dasar Bali', 'Kuliner Lawar', 'Ajengan Tradisional'],
    kategori: 'kuliner',
    ringkasan: 'Rahasia kelezatan rempah khas Bali yang terdiri dari 15 macam bumbu akar, daun, dan biji yang melambangkan keharmonisan semesta.',
    isi_markdown: `## Perpaduan Rempah Penakluk Rasa

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

Pembuatan lawar (*tradisi mebat*) dikerjakan secara gotong royong oleh kaum pria di banjar sejak dini hari menjelang hari raya besar seperti Galungan dan Kuningan. Mebat bukan sekadar memasak, melainkan ruang sosial mempererat tali persaudaraan (*menyama braya*) warga desa.`,
    gambar_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Gianyar',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '4 menit baca'
  },
  {
    id: 'c9',
    slug: 'upacara-melasti-penyucian-ke-samudra',
    judul: 'Upacara Melasti: Ritual Suci Penyucian Arca dan Jiwa ke Segara',
    nama_alternatif: ['Melasti Nyepi', 'Ritual Segara', 'Panyucian Pratima'],
    kategori: 'upacara',
    ringkasan: 'Iring-iringan ribuan umat berbusana putih mengusung benda suci (pratima) menuju pantai beberapa hari sebelum Nyepi untuk memohon tirta amertha.',
    isi_markdown: `## Perjalanan Air Menuju Samudra Kehidupan

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
- Dilarang keras menerbangkan drone di atas area upacara dan kepala para pemangku.`,
    gambar_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Seluruh Bali',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '4 menit baca'
  },
  {
    id: 'c10',
    slug: 'tari-pendet-tarian-penyambutan-dan-penghormatan',
    judul: 'Tari Pendet: Tarian Klasik Penyambutan Penuh Keanggunan',
    nama_alternatif: ['Pendet Bali', 'Tari Selamat Datang Bali', 'Tari Tabur Bunga'],
    kategori: 'tari',
    ringkasan: 'Tarian anggun wanita Bali membawakan bokor berisi kelopak bunga segar yang ditaburkan sebagai ungkapan selamat datang dan rasa hormat.',
    isi_markdown: `## Taburan Bunga Keberkahan

Dengan senyum ramah, gerak mata yang dinamis (*seledet*), dan liukan jemari yang lentur, para penari wanita menaburkan kelopak bunga warna-warni ke arah penonton di akhir tarian. Inilah pesona **Tari Pendet**, salah satu tari tradisional Bali tertua yang paling dicintai.

### Transformasi dari Ritual Sakral ke Seni Pertunjukan
Awalnya, Tari Pendet adalah tarian pemujaan (*tari wali*) yang dipentaskan di halaman dalam pura (*jeroan*) saat upacara piodalan berlangsung. Tarian ini melambangkan penyambutan atas turunnya para dewa dan roh leluhur ke alam duniawi.

Pada dekade 1950-an, maestro tari Bali **I Wayan Beratha** mengadaptasi Tari Pendet menjadi tarian penyambutan kehormatan untuk menyambut tamu agung dan wisatawan mancanegara tanpa mengurangi keanggunan nilai sakralnya.

### Ciri Khas Gerakan
1. **Ngegol:** Gerakan pinggul yang bergoyang luwes mengikuti tempo ketukan gong.
2. **Seledet:** Gerakan bola mata yang melirik tajam ke kiri dan ke kanan secara ekspresif, menjadi ciri khas utama ekspresi tari Bali.
3. **Bokor Perak:** Penari memegang bokor berukir perak yang dipenuhi bunga kamboja, mawar, dan kenanga harum yang ditaburkan sebagai doa restu keselamatan.

Tari Pendet menjadi lambang keramahan dan kehangatan hati masyarakat Bali dalam menyambut siapa saja yang datang berkunjung dengan niat baik.`,
    gambar_url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80',
    wilayah: 'Denpasar',
    sumber: ['sumber belum diisi', '[PERLU DIVERIFIKASI]'],
    read_time: '3 menit baca'
  }
];

// Map label dan styling kategori artikel budaya
export const CULTURE_CATEGORY_MAP = {
  upacara: {
    label: 'Upacara & Ritual',
    badgeClass: 'bg-padi/20 text-amber-900 border-padi/40',
    icon: '<i class="fa-solid fa-om text-amber-700"></i>'
  },
  tari: {
    label: 'Seni Tari',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: '<i class="fa-solid fa-masks-theater text-rose-700"></i>'
  },
  kuliner: {
    label: 'Kuliner Tradisional',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: '<i class="fa-solid fa-bowl-food text-amber-800"></i>'
  },
  arsitektur: {
    label: 'Arsitektur Khas',
    badgeClass: 'bg-stone-200 text-stone-900 border-stone-300',
    icon: '<i class="fa-solid fa-archway text-stone-800"></i>'
  },
  kerajinan: {
    label: 'Kriya & Kerajinan',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    icon: '<i class="fa-solid fa-scroll text-purple-700"></i>'
  },
  tradisi: {
    label: 'Tradisi & Adat',
    badgeClass: 'bg-daun/20 text-daun-gelap border-daun/40',
    icon: '<i class="fa-solid fa-tree text-daun"></i>'
  },
  etika: {
    label: 'Etika & Tata Krama',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    icon: '<i class="fa-solid fa-hands-praying text-emerald-800"></i>'
  }
};

/**
 * Sanitasi dan konversi Markdown ringan secara aman (XSS safe)
 */
export function renderSanitizedMarkdown(mdText) {
  if (!mdText) return '';

  // 1. Escape tag HTML berbahaya
  let text = mdText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 2. Headings
  text = text.replace(/^### (.*$)/gim, '<h3 class="font-heading text-xl font-bold text-tanah-gelap mt-6 mb-3">$1</h3>');
  text = text.replace(/^## (.*$)/gim, '<h2 class="font-heading text-2xl sm:text-3xl font-bold text-tanah-gelap mt-8 mb-4 pb-2 border-b border-pasir/60">$1</h2>');
  text = text.replace(/^# (.*$)/gim, '<h1 class="font-heading text-3xl sm:text-4xl font-extrabold text-tanah-gelap mt-10 mb-4">$1</h1>');

  // 3. Blockquotes
  text = text.replace(/^\> (.*$)/gim, '<blockquote class="border-l-4 border-padi bg-padi/10 p-4 my-4 rounded-r-2xl italic font-heading text-tanah-gelap text-sm sm:text-base">$1</blockquote>');

  // 4. Bold & Italic
  text = text.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-tanah-gelap">$1</strong>');
  text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // 5. Unordered lists
  text = text.replace(/^\- (.*$)/gim, '<li class="ml-5 list-disc text-tanah leading-relaxed my-1">$1</li>');

  // 6. Ordered lists
  text = text.replace(/^\d+\. (.*$)/gim, '<li class="ml-5 list-decimal text-tanah leading-relaxed my-1">$1</li>');

  // 7. Paragraphs
  const paragraphs = text.split(/\n\n+/);
  return paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<li')) {
        return trimmed;
      }
      return `<p class="font-body text-tanah leading-relaxed my-4 text-base sm:text-lg">${trimmed}</p>`;
    })
    .join('\n');
}

// Cache memori untuk artikel budaya dan relasi destinasi (TTL: 10 menit)
const cultureCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Mengambil daftar artikel budaya (Supabase dengan caching & fallback)
 */
export async function getCultureArticles({ kategori = 'semua', query = '' } = {}) {
  const cleanQ = query.trim().toLowerCase();
  const cacheKey = `articles__${kategori}__${cleanQ}`;

  const cached = cultureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let results = null;

  try {
    let sbQuery = supabase.from('culture_articles').select('*').eq('diterbitkan', true);

    if (kategori && kategori !== 'semua') {
      sbQuery = sbQuery.eq('kategori', kategori);
    }
    if (cleanQ) {
      sbQuery = sbQuery.or(`judul.ilike.%${cleanQ}%,ringkasan.ilike.%${cleanQ}%`);
    }

    const { data, error } = await sbQuery.order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      results = data;
    }
  } catch (err) {
    // Fallback diam-diam
  }

  if (!results) {
    // Filter fallback lokal
    results = FALLBACK_CULTURE_ARTICLES.filter(item => {
      if (kategori !== 'semua' && item.kategori !== kategori) return false;
      if (cleanQ) {
        const matchJudul = item.judul.toLowerCase().includes(cleanQ);
        const matchRingkasan = item.ringkasan.toLowerCase().includes(cleanQ);
        const matchAlt = item.nama_alternatif?.some(a => a.toLowerCase().includes(cleanQ));
        return matchJudul || matchRingkasan || matchAlt;
      }
      return true;
    });
  }

  cultureCache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

/**
 * Mengambil satu artikel budaya berdasarkan slug (dengan caching)
 */
export async function getCultureArticleBySlug(slug) {
  if (!slug) return null;

  const cacheKey = `article__${slug}`;
  const cached = cultureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let result = null;

  try {
    const { data, error } = await supabase
      .from('culture_articles')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      result = data;
    }
  } catch (e) {
    // Fallback
  }

  if (!result) {
    result = FALLBACK_CULTURE_ARTICLES.find(a => a.slug === slug) || null;
  }

  if (result) {
    cultureCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

/**
 * Mengambil destinasi terkait suatu artikel budaya (via place_culture dengan caching)
 */
export async function getRelatedPlacesForArticle(cultureId, slug) {
  const cacheKey = `related__${cultureId || ''}__${slug || ''}`;
  const cached = cultureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let results = null;

  try {
    // Coba join query dari Supabase
    const { data, error } = await supabase
      .from('place_culture')
      .select('places (*)')
      .eq('culture_id', cultureId);

    if (!error && Array.isArray(data) && data.length > 0) {
      results = data.map(d => d.places).filter(Boolean);
    }
  } catch (e) {
    // Abaikan
  }

  if (!results || results.length === 0) {

  // Fallback heuristik tempat terkait berdasarkan kategori & slug
  const mockPlaces = [
    {
      id: 'p1',
      name: 'Air Terjun Sekumpul',
      region: 'Buleleng',
      category: 'alam',
      image_url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'p2',
      name: 'Desa Adat Pedawa & Rumah Tradisional Bandung Rangki',
      region: 'Buleleng',
      category: 'budaya',
      image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'p4',
      name: 'Pura Lempuyang Luhur & Tirta Gangga',
      region: 'Karangasem',
      category: 'budaya',
      image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'p7',
      name: 'Air Terjun Yeh Hoo & Sawah Terasering Jatiluwih',
      region: 'Tabanan',
      category: 'alam',
      image_url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'p9',
      name: 'Candi Tebing Gunung Kawi Tampaksiring',
      region: 'Gianyar',
      category: 'budaya',
      image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
    }
  ];

  if (slug && (slug.includes('pura') || slug.includes('etika'))) {
    results = [mockPlaces[2], mockPlaces[4], mockPlaces[1]];
  } else if (slug && slug.includes('subak')) {
    results = [mockPlaces[3], mockPlaces[0]];
  } else if (slug && (slug.includes('arsitektur') || slug.includes('canang') || slug.includes('gringsing'))) {
    results = [mockPlaces[1], mockPlaces[2]];
  } else {
    results = [mockPlaces[2], mockPlaces[3]];
  }
  }

  cultureCache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

/**
 * Mengambil artikel budaya yang relevan untuk suatu tempat di kartu petualangan
 */
export async function getRelatedCultureForPlace(place) {
  if (!place) return null;

  try {
    if (place.id) {
      const { data, error } = await supabase
        .from('place_culture')
        .select('culture_articles (*)')
        .eq('place_id', place.id)
        .limit(1);

      if (!error && data?.[0]?.culture_articles) {
        return data[0].culture_articles;
      }
    }
  } catch (e) {
    // Abaikan
  }

  // Heuristik fallback pencocokan artikel
  const name = (place.name || '').toLowerCase();
  const cat = (place.category || '').toLowerCase();
  const desc = (place.description || '').toLowerCase();
  const type = (place.type || '').toLowerCase();

  if (name.includes('pura') || desc.includes('pura') || name.includes('candi')) {
    return FALLBACK_CULTURE_ARTICLES[0]; // Etika Pura
  }
  if (name.includes('jatiluwih') || desc.includes('terasering') || desc.includes('sawah')) {
    return FALLBACK_CULTURE_ARTICLES[2]; // Subak
  }
  if (type === 'kuliner' || cat.includes('kuliner')) {
    return FALLBACK_CULTURE_ARTICLES[7]; // Base Genep & Lawar
  }
  if (name.includes('tenganan') || cat.includes('kerajinan') || desc.includes('tenun')) {
    return FALLBACK_CULTURE_ARTICLES[5]; // Tenun Gringsing & Endek
  }
  if (name.includes('pedawa') || desc.includes('arsitektur')) {
    return FALLBACK_CULTURE_ARTICLES[6]; // Asta Kosala Kosali
  }
  if (cat.includes('budaya') || cat.includes('sejarah')) {
    return FALLBACK_CULTURE_ARTICLES[1]; // Canang Sari
  }

  return FALLBACK_CULTURE_ARTICLES[0];
}

/**
 * Versi sinkron untuk rendering instan kartu petualangan
 */
export function getRelatedCultureForPlaceSync(place) {
  if (!place) return null;

  const name = (place.name || '').toLowerCase();
  const cat = (place.category || '').toLowerCase();
  const desc = (place.description || '').toLowerCase();
  const type = (place.type || '').toLowerCase();

  if (name.includes('pura') || desc.includes('pura') || name.includes('candi')) {
    return FALLBACK_CULTURE_ARTICLES[0]; // Etika Pura
  }
  if (name.includes('jatiluwih') || desc.includes('terasering') || desc.includes('sawah')) {
    return FALLBACK_CULTURE_ARTICLES[2]; // Subak
  }
  if (type === 'kuliner' || cat.includes('kuliner')) {
    return FALLBACK_CULTURE_ARTICLES[7]; // Base Genep & Lawar
  }
  if (name.includes('tenganan') || cat.includes('kerajinan') || desc.includes('tenun')) {
    return FALLBACK_CULTURE_ARTICLES[5]; // Tenun Gringsing & Endek
  }
  if (name.includes('pedawa') || desc.includes('arsitektur')) {
    return FALLBACK_CULTURE_ARTICLES[6]; // Asta Kosala Kosali
  }
  if (cat.includes('budaya') || cat.includes('sejarah')) {
    return FALLBACK_CULTURE_ARTICLES[1]; // Canang Sari
  }

  return FALLBACK_CULTURE_ARTICLES[0];
}
