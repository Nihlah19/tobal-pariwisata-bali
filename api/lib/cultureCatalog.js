/**
 * Culture Catalog & Anti-Hallucination Helper — Tour Penjelajah Bali
 * Menyediakan katalog budaya tertutup (closed-set) dan normalizer pencocokan
 * untuk mencegah halusinasi model vision AI pada fitur Kenali Budaya.
 */

export const DEFAULT_CULTURE_ARTICLES = [
  {
    id: 'c1',
    slug: 'etika-berkunjung-ke-pura-bali',
    judul: 'Etika & Tata Krama Berkunjung ke Pura di Bali',
    nama_alternatif: [
      'Dharmaning Melancaran ka Pura',
      'Aturan Masuk Pura',
      'Temple Etiquette Bali',
      'Pakaian Adat Pura',
      'Kamben dan Senteng',
      'Pura Bali'
    ],
    kategori: 'etika',
    ringkasan: 'Panduan etika sakral saat menginjakkan kaki di kawasan suci pura: mulai dari pakaian adat (kamben dan senteng), sikap tubuh, hingga larangan pantangan.',
    wilayah: 'Seluruh Bali',
    gambar_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c2',
    slug: 'filosofi-canang-sari-persembahan-harian',
    judul: 'Canang Sari: Makna Filosofis di Balik Persembahan Bunga Harian',
    nama_alternatif: [
      'Canang Sari Bali',
      'Banten Canang',
      'Makna Canang',
      'Canang',
      'Sesaji Bunga Bali',
      'Porosan'
    ],
    kategori: 'upacara',
    ringkasan: 'Anyaman daun kelapa muda berisikan bunga lima warna dan harum dupa yang menghiasi sudut jalanan dan pelinggih pura sebagai wujud syukur harian.',
    wilayah: 'Seluruh Bali',
    gambar_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c3',
    slug: 'sistem-irigasi-subak-tri-hita-karana',
    judul: 'Sistem Subak: Harmoni Manusia, Alam, dan Spiritualitas dalam Pengairan Bali',
    nama_alternatif: [
      'Subak Bali',
      'Organisasi Pengairan Tradisional',
      'Warisan Budaya Dunia UNESCO Subak',
      'Sawah Terasering Jatiluwih',
      'Irigasi Subak',
      'Terasering Sawah Bali'
    ],
    kategori: 'tradisi',
    ringkasan: 'Kearifan lokal pengelolaan air sawah komunal berusia lebih dari seribu tahun yang diakui UNESCO, berasaskan filosofi keharmonisan Tri Hita Karana.',
    wilayah: 'Tabanan',
    gambar_url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c4',
    slug: 'tari-kecak-seni-suara-dan-kisah-ramayana',
    judul: 'Tari Kecak: Kidung Paduan Suara Sakral dan Epik Ramayana',
    nama_alternatif: [
      'Kecak Ramayana',
      'Tari Cak',
      'Tari Api Kecak',
      'Tari Kecak',
      'Kecak Dance Uluwatu',
      'Hanoman Obong'
    ],
    kategori: 'tari',
    ringkasan: 'Pertunjukan drama tari tanpa instrumen gamelan, diiringi paduan suara vokal puluhan pria yang melantunkan irama cak-cak bertempo dinamis.',
    wilayah: 'Badung',
    gambar_url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c5',
    slug: 'tradisi-ogoh-ogoh-malam-pengerupukan-nyepi',
    judul: 'Ogoh-Ogoh: Patung Raksasa Simbol Bhuta Kala pada Malam Pengerupukan',
    nama_alternatif: [
      'Pawai Ogoh-ogoh',
      'Pengerupukan',
      'Tawur Agung Kesanga',
      'Patung Ogoh-ogoh',
      'Parade Ogoh-ogoh Nyepi'
    ],
    kategori: 'tradisi',
    ringkasan: 'Kreativitas seni patung raksasa pemuda banjar yang diarak meriah sebelum hening total Hari Suci Nyepi.',
    wilayah: 'Seluruh Bali',
    gambar_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c6',
    slug: 'kain-tenun-gringsing-endek-dan-songket',
    judul: 'Kain Tenun Tradisional Bali: Gringsing, Endek, dan Songket',
    nama_alternatif: [
      'Tenun Ikat Bali',
      'Kain Pegringsingan',
      'Wastra Bali',
      'Kain Gringsing Tenganan',
      'Kain Endek Bali',
      'Kain Songket Bali',
      'Tenun Tenganan'
    ],
    kategori: 'kerajinan',
    ringkasan: 'Warisan adiluhung tenun ikat ganda langka dari Desa Tenganan serta keindahan motif geometris kain endek dan kemewahan benang emas songket.',
    wilayah: 'Karangasem',
    gambar_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c7',
    slug: 'arsitektur-asta-kosala-kosali-rumah-tradisional',
    judul: 'Asta Kosala Kosali: Pedoman Tata Ruang dan Arsitektur Tradisional Bali',
    nama_alternatif: [
      'Arsitektur Bali',
      'Bale Tradisional',
      'Sanga Mandala Arsitektur',
      'Candi Bentar',
      'Kori Agung',
      'Angkul-angkul',
      'Rumah Tradisional Bali'
    ],
    kategori: 'arsitektur',
    ringkasan: 'Filosofi arsitektur sakral khas Bali yang mengatur tata letak bangunan rumah, pura, dan banjar berdasarkan proporsi anatomi tubuh pemilik rumah.',
    wilayah: 'Seluruh Bali',
    gambar_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c8',
    slug: 'kuliner-lawar-dan-bumbu-base-genep',
    judul: 'Base Genep dan Lawar: Jiwa dan Keseimbangan Cita Rasa Kuliner Bali',
    nama_alternatif: [
      'Bumbu Dasar Bali',
      'Kuliner Lawar',
      'Ajengan Tradisional',
      'Base Genep Bali',
      'Lawar Bali',
      'Nasi Lawar'
    ],
    kategori: 'kuliner',
    ringkasan: 'Rahasia kelezatan rempah khas Bali yang terdiri dari 15 macam bumbu akar, daun, dan biji yang melambangkan keharmonisan semesta.',
    wilayah: 'Gianyar',
    gambar_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c9',
    slug: 'upacara-melasti-penyucian-ke-samudra',
    judul: 'Upacara Melasti: Ritual Suci Penyucian Arca dan Jiwa ke Segara',
    nama_alternatif: [
      'Melasti Nyepi',
      'Ritual Segara',
      'Panyucian Pratima',
      'Upacara Melasti',
      'Prosesi Melasti ke Pantai'
    ],
    kategori: 'upacara',
    ringkasan: 'Iring-iringan ribuan umat berbusana putih mengusung benda suci (pratima) menuju pantai beberapa hari sebelum Nyepi untuk memohon tirta amertha.',
    wilayah: 'Seluruh Bali',
    gambar_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'c10',
    slug: 'tari-pendet-tarian-penyambutan-dan-penghormatan',
    judul: 'Tari Pendet: Tarian Klasik Penyambutan Penuh Keanggunan',
    nama_alternatif: [
      'Pendet Bali',
      'Tari Selamat Datang Bali',
      'Tari Tabur Bunga',
      'Tari Pendet',
      'Bokor Bunga Pendet'
    ],
    kategori: 'tari',
    ringkasan: 'Tarian anggun wanita Bali membawakan bokor berisi kelopak bunga segar yang ditaburkan sebagai ungkapan selamat datang dan rasa hormat.',
    wilayah: 'Denpasar',
    gambar_url: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=1200&q=80'
  }
];

/**
 * Normalisasi string untuk pencocokan teks toleran
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Format prompt pilihan tertutup untuk dikirim ke Gemini
 */
export function buildClosedChoicePrompt(articles) {
  const listItems = articles.map((art, index) => {
    const alts = Array.isArray(art.nama_alternatif) && art.nama_alternatif.length > 0
      ? ` (Nama lain/elemen terkait: ${art.nama_alternatif.join(', ')})`
      : '';
    return `${index + 1}. "${art.judul}" [Kategori: ${art.kategori}]${alts}`;
  }).join('\n');

  return `Anda adalah seorang kurator dan pakar kebudayaan Bali yang bertugas menganalisis foto budaya.

TUGAS ANDA:
Periksa gambar ini secara saksama. Identifikasi apakah objek utama pada gambar tersebut secara meyakinkan cocok dengan SALAH SATU topik budaya Bali dari DAFTAR RESMI TERTUTUP di bawah ini.

DAFTAR PILIHAN TERTUTUP (HANYA PILIH DARI DAFTAR INI):
${listItems}

ATURAN ANTI-HALUSINASI SANGAT KETAT (ZERO-HALLUCINATION POLICY):
1. Anda HANYA boleh memilih nama budaya yang ada di DAFTAR RESMI TERTUTUP di atas. Tuliskan judul persis atau nama alternatif resmi yang ada di daftar.
2. JANGAN PERNAH MENGARANG ATAU MENERKA budaya di luar daftar di atas. Jika gambar bukan budaya Bali, tidak jelas, buram, foto orang biasa, atau tidak ada yang cocok di daftar, Anda WAJIB menjawab "tidak dikenali".
3. Berikan nilai "keyakinan" (confidence score) antara 0.0 sampai 1.0:
   - >= 0.85: Objek budaya sangat jelas terlihat ciri khas utamanya.
   - 0.60 - 0.84: Objek budaya cukup meyakinkan meskipun ada sebagian elemen yang tertutup.
   - < 0.60 atau 0.0: Ragu-ragu, tidak jelas, buram, atau tidak cocok.
4. Tuliskan "alasan_visual" dalam 1-2 kalimat bahasa Indonesia ringkas yang menjelaskan ciri visual nyata apa yang terlihat (misal: anyaman janur ceper, susunan bunga panca dewa, ornamen candi bentar, busana adat kamben & senteng, gerak tari bokor, dll.).
5. KELUARKAN HANYA FORMAT JSON MURNI TANPA MARKDOWN / TEKS LAIN:
{
  "nama_budaya": "Judul persis dari daftar ATAU 'tidak dikenali'",
  "keyakinan": 0.9,
  "alasan_visual": "Deskripsi singkat ciri visual yang terlihat"
}`;
}

/**
 * Mencocokkan nama_budaya hasil keluaran model ke artikel database yang valid
 */
export function matchArticleFromPrediction(rawName, articles = DEFAULT_CULTURE_ARTICLES) {
  if (!rawName || typeof rawName !== 'string') return null;

  const cleanInput = normalizeText(rawName);

  // Jika eksplisit dinyatakan tidak dikenali
  if (
    cleanInput.includes('tidak dikenali') ||
    cleanInput.includes('tidak dapat dikenali') ||
    cleanInput.includes('unknown') ||
    cleanInput.includes('none')
  ) {
    return null;
  }

  // 1. Cek kecocokan persis pada judul
  for (const art of articles) {
    const cleanJudul = normalizeText(art.judul);
    if (cleanInput === cleanJudul || cleanJudul.includes(cleanInput) || cleanInput.includes(cleanJudul)) {
      return art;
    }
  }

  // 2. Cek kecocokan pada nama_alternatif
  for (const art of articles) {
    if (Array.isArray(art.nama_alternatif)) {
      for (const alt of art.nama_alternatif) {
        const cleanAlt = normalizeText(alt);
        if (cleanInput === cleanAlt || cleanInput.includes(cleanAlt) || cleanAlt.includes(cleanInput)) {
          return art;
        }
      }
    }
  }

  // 3. Cek kecocokan pada slug
  for (const art of articles) {
    const slugAsWords = normalizeText(art.slug.replace(/-/g, ' '));
    if (cleanInput.includes(slugAsWords) || slugAsWords.includes(cleanInput)) {
      return art;
    }
  }

  // 4. Cek kemiripan kata kunci utama spesifik
  const keywordsMap = [
    { key: 'canang', slug: 'filosofi-canang-sari-persembahan-harian' },
    { key: 'subak', slug: 'sistem-irigasi-subak-tri-hita-karana' },
    { key: 'kecak', slug: 'tari-kecak-seni-suara-dan-kisah-ramayana' },
    { key: 'ogoh', slug: 'tradisi-ogoh-ogoh-malam-pengerupukan-nyepi' },
    { key: 'gringsing', slug: 'kain-tenun-gringsing-endek-dan-songket' },
    { key: 'endek', slug: 'kain-tenun-gringsing-endek-dan-songket' },
    { key: 'songket', slug: 'kain-tenun-gringsing-endek-dan-songket' },
    { key: 'asta kosala', slug: 'arsitektur-asta-kosala-kosali-rumah-tradisional' },
    { key: 'candi bentar', slug: 'arsitektur-asta-kosala-kosali-rumah-tradisional' },
    { key: 'lawar', slug: 'kuliner-lawar-dan-bumbu-base-genep' },
    { key: 'base genep', slug: 'kuliner-lawar-dan-bumbu-base-genep' },
    { key: 'melasti', slug: 'upacara-melasti-penyucian-ke-samudra' },
    { key: 'pendet', slug: 'tari-pendet-tarian-penyambutan-dan-penghormatan' },
    { key: 'pura', slug: 'etika-berkunjung-ke-pura-bali' },
    { key: 'kamben', slug: 'etika-berkunjung-ke-pura-bali' }
  ];

  for (const { key, slug } of keywordsMap) {
    if (cleanInput.includes(key)) {
      const found = articles.find(a => a.slug === slug);
      if (found) return found;
    }
  }

  return null;
}
