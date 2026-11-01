/**
 * Tata Bahasa Bali — Data Access & Fallback Layer
 * Mengelola aturan tata bahasa, tingkatan bahasa (Sor Singgih), sintaksis & pronomina
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { supabase } from './supabaseClient.js';

export const FALLBACK_GRAMMAR_RULES = [
  {
    id: 'g1',
    judul: 'Sor Singgih Basa Bali: Tingkatan Bahasa',
    slug: 'sor-singgih-basa-bali',
    kategori: 'sor-singgih',
    tingkat: 'semua tingkatan',
    ringkasan: 'Prinsip tata krama berbahasa Bali berdasarkan status sosial, keakraban, dan penghormatan lawan bicara.',
    penjelasan_markdown: `## Mengenal Sor Singgih Basa Bali

Bahasa Bali memiliki sistem tingkatan bahasa (*Sor Singgih Basa*) yang mencerminkan rasa hormat dan etika pergaulan masyarakat. Secara garis besar, terdapat empat tingkatan utama:

1. **Alus Singgih (ASI):** Digunakan untuk menghormati lawan bicara yang berstatus lebih tinggi (orang tua, sulinggih, tamu terhormat).
2. **Alus Sor (ASO):** Digunakan untuk merendahkan diri sendiri saat berbicara dengan orang yang dihormati sebagai wujud sopan santun.
3. **Alus Madya (AMA):** Bahasa halus tingkat menengah yang paling netral dan aman digunakan oleh wisatawan kepada masyarakat umum.
4. **Andap (Kepara):** Bahasa sehari-hari yang dipakai antar teman akrab atau sesama yang seumuran.`,
    pola_rumus: 'Subjek + Kruna Alus + Keterangan',
    contoh_kalimat: [
      { bali: 'Titiang nunas pamit mangkin.', indonesia: 'Saya mohon pamit sekarang.', catatan: 'Alus Sor: Titiang (saya merendah) + nunas pamit.' },
      { bali: 'Ragané sampun ngajeng?', indonesia: 'Apakah Anda sudah bersantap?', catatan: 'Alus Singgih: Ragané (Anda) + ngajeng (makan sopan).' },
      { bali: 'Tiang luas ka pasar.', indonesia: 'Saya pergi ke pasar.', catatan: 'Andap: Tiang + luas.' }
    ],
    urutan: 1,
    diterbitkan: true
  },
  {
    id: 'g2',
    judul: 'Kata Ganti Orang (Pronomina) dalam Bahasa Bali',
    slug: 'kata-ganti-orang-pronomina',
    kategori: 'pronomina',
    tingkat: 'semua tingkatan',
    ringkasan: 'Penggunaan kata ganti pertama, kedua, dan ketiga yang disesuaikan dengan derajat kesopanan.',
    penjelasan_markdown: `## Sistem Pronomina Bahasa Bali

Memilih kata ganti orang yang tepat sangat krusial dalam bahasa Bali agar tidak menyinggung perasaan lawan bicara.

### Kata Ganti Orang Pertama (Saya / Kami)
- **Titiang:** Sangat halus (Alus Sor), dipakai kepada orang tua, tokoh agama, atau saat berbicara di forum resmi.
- **Tiang:** Halus menengah (Alus Madya), paling lazim dan aman digunakan wisatawan saat berbelanja atau bertanya arah.
- **Icang / Awake:** Akrab / kasar (Andap), hanya kepada sahabat karib sebaya.

### Kata Ganti Orang Kedua (Anda / Kamu)
- **Ragané / Idané:** Alus Singgih, sangat sopan untuk menyapa orang terhormat.
- **Jeroné:** Sopan, menyapa orang baru yang belum dikenal namanya.
- **Bli (Laki-laki) / Mbok (Perempuan):** Sapaan kekeluargaan yang ramah dan akrab di Bali.
- **Cai / Nyai:** Kasar, jangan pernah digunakan kepada orang lain.`,
    pola_rumus: 'Pronomina Alus + Predikat Alus',
    contoh_kalimat: [
      { bali: 'Titiang mawasta Putu.', indonesia: 'Nama hamba adalah Putu.', catatan: 'Titiang (saya) + mawasta (bernama - alus).' },
      { bali: 'Sira peséngan ragane?', indonesia: 'Siapakah nama Anda yang terhormat?', catatan: 'Sira (siapa - alus) + peséngan (nama - alus singgih).' }
    ],
    urutan: 2,
    diterbitkan: true
  },
  {
    id: 'g3',
    judul: 'Pola Kalimat Dasar Bahasa Bali (SPO)',
    slug: 'pola-kalimat-dasar-bahasa-bali',
    kategori: 'sintaksis',
    tingkat: 'umum',
    ringkasan: 'Struktur susunan kalimat deklaratif, interogatif, dan imperatif dalam tuturan harian Bali.',
    penjelasan_markdown: `## Struktur Kalimat Bahasa Bali

Pada dasarnya, susunan tata kalimat bahasa Bali memiliki kemiripan dengan bahasa Indonesia, yaitu berpola **Subjek - Predikat - Objek - Keterangan (S-P-O-K)**.

Namun, terdapat ciri khas:
1. Penempatan kata penunjuk (*puniki* = ini, *punika* = itu) selalu diletakkan **setelah** kata benda.
2. Kalimat tanya sering menggunakan partikel penegas seperti *napi* (apa), *sira* (siapa), *ring dija* (di mana), dan *dija* (mana).`,
    pola_rumus: 'Subjek + Predikat + Objek + Kata Penunjuk (puniki/punika)',
    contoh_kalimat: [
      { bali: 'Wayan numbas buah ring peken.', indonesia: 'Wayan membeli buah di pasar.', catatan: 'S: Wayan, P: numbas, O: buah, K: ring peken.' },
      { bali: 'Banten puniki sampun puput.', indonesia: 'Sesaji ini sudah selesai dibuat.', catatan: 'Benda (Banten) diikuti penunjuk (puniki).' }
    ],
    urutan: 3,
    diterbitkan: true
  },
  {
    id: 'g4',
    judul: 'Kruna Polah & Pembentukan Kata Kerja Aktif (Afiksasi)',
    slug: 'kruna-polah-afiksasi',
    kategori: 'afiksasi',
    tingkat: 'umum',
    ringkasan: 'Aturan pembentukan kata kerja aktif (nasalisasi) dari kata dasar dalam bahasa Bali.',
    penjelasan_markdown: `## Kruna Polah (Nasalisasi)

Dalam bahasa Bali, kata kerja aktif transitif dibentuk dari kata dasar (*kruna lingga*) yang mengalami proses nasalisasi (*anusuara*).

Aturan perubahan konsonan awal:
- **b, p** berubah menjadi **m-** (contoh: *baca* -> *maca*, *pancing* -> *mancing*)
- **d, t** berubah menjadi **n-** (contoh: *tumbas* -> *numbas*, *tulis* -> *nulis*)
- **j, c, s** berubah menjadi **ny-** (contoh: *jemak* -> *nyemak*, *sampat* -> *nyampat*)
- **g, k, vokal** berubah menjadi **ng-** (contoh: *goreng* -> *ngoreng*, *alap* -> *ngalap*)`,
    pola_rumus: 'Anusuara (m-, n-, ny-, ng-) + Kruna Lingga',
    contoh_kalimat: [
      { bali: 'Ibu nyampat ring natahé.', indonesia: 'Ibu menyapu di halaman.', catatan: 'Kata dasar: sampat -> nyampat.' },
      { bali: 'Bapak numbas ajengan ring warung.', indonesia: 'Bapak membeli makanan di warung.', catatan: 'Kata dasar: tumbas -> numbas.' }
    ],
    urutan: 4,
    diterbitkan: true
  },
  {
    id: 'g5',
    judul: 'Ungkapan Santun & Etika Bertanya Arah untuk Wisatawan',
    slug: 'tata-krama-bertanya-arah',
    kategori: 'tata-krama',
    tingkat: 'alus madya',
    ringkasan: 'Panduan etika berbicara saat menyapa warga, memohon izin, dan menanyakan lokasi destinasi.',
    penjelasan_markdown: `## Etika Bertanya kepada Warga Lokal

Masyarakat Bali sangat menghargai wisatawan yang memulai percakapan dengan nada sopan dan gestur tubuh yang santun.

Tips penting:
1. Awali dengan sapaan salam (*Om Swastyastu*) atau sapaan kekeluargaan (*Nunas lugra bli/mbok*).
2. Gunakan kata *nunas lugra* (mohon izin / permisi) atau *nunas tulung* (minta tolong).
3. Jangan menunjuk arah atau pura dengan jari telunjuk; gunakan jempol tangan kanan diiringi senyuman hangat.
4. Akhiri selalu dengan ucapan *Matur suksma* (terima kasih banyak).`,
    pola_rumus: 'Nunas lugra + Sapaan + Pertanyaan Arah + Matur suksma',
    contoh_kalimat: [
      { bali: 'Nunas lugra bli, ring dija margi ka Pasih Amed?', indonesia: 'Permisi bli, di mana jalan menuju Pantai Amed?', catatan: 'Nunas lugra (permisi) + ring dija margi (di mana jalan).' },
      { bali: 'Matur suksma antuk pituduh ragane.', indonesia: 'Terima kasih banyak atas petunjuk Anda.', catatan: 'Ucapan penutup yang sangat dihargai warga lokal.' }
    ],
    urutan: 5,
    diterbitkan: true
  }
];

// Helper membaca data tambahan dari localStorage (sinkronisasi admin instan)
function getLocalGrammarCustom() {
  try {
    const raw = localStorage.getItem('tobal_custom_grammar');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Mencari materi tata bahasa Bali
 */
export async function getGrammarRules(options = {}) {
  const { query = '', kategori = 'semua' } = options;
  const cleanQ = query.trim().toLowerCase();

  let results = null;

  try {
    let sbQuery = supabase.from('balinese_grammar').select('*').eq('diterbitkan', true);
    if (kategori && kategori !== 'semua') {
      sbQuery = sbQuery.eq('kategori', kategori);
    }
    if (cleanQ) {
      sbQuery = sbQuery.or(`judul.ilike.%${cleanQ}%,ringkasan.ilike.%${cleanQ}%`);
    }

    const { data, error } = await sbQuery.order('urutan', { ascending: true });
    if (!error && Array.isArray(data) && data.length > 0) {
      results = data;
    }
  } catch {}

  if (!results) {
    const custom = getLocalGrammarCustom();
    const all = [...custom, ...FALLBACK_GRAMMAR_RULES];

    results = all.filter(item => {
      if (kategori !== 'semua' && item.kategori !== kategori) return false;
      if (cleanQ) {
        const matchTitle = item.judul.toLowerCase().includes(cleanQ);
        const matchSummary = item.ringkasan.toLowerCase().includes(cleanQ);
        return matchTitle || matchSummary;
      }
      return true;
    });
  }

  return results;
}

/**
 * Ambil satu aturan tata bahasa berdasarkan slug atau id
 */
export async function getGrammarDetail(identifier) {
  if (!identifier) return null;

  try {
    const { data, error } = await supabase
      .from('balinese_grammar')
      .select('*')
      .or(`slug.eq.${identifier},id.eq.${identifier}`)
      .maybeSingle();

    if (!error && data) return data;
  } catch {}

  const custom = getLocalGrammarCustom();
  const all = [...custom, ...FALLBACK_GRAMMAR_RULES];
  return all.find(g => g.slug === identifier || g.id === identifier) || null;
}
