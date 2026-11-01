/**
 * Script Uji Unit Recommender Engine — Tour Penjelajah Bali
 * Menjalankan pengujian logika Content-Based Filtering secara mandiri tanpa database.
 * Jalankan dengan: node scripts/test-recommend.js
 */

import {
  recommendPackage,
  tokenize,
  buildTfidfModel,
  cosineSimilarity,
  WEIGHT_COSINE,
  WEIGHT_NOVELTY
} from '../api/lib/recommender.js';

// ==============================================================================
// 1. DATA CONTOH DESTINASI BALI
// ==============================================================================
const DUMMY_PLACES = [
  // Buleleng
  {
    id: 'p1',
    name: 'Air Terjun Sekumpul',
    type: 'wisata',
    category: 'alam',
    tags: ['air-terjun', 'hutan', 'trekking', 'alam-asri'],
    region: 'Buleleng',
    price_level: 2,
    popularity: 78,
    is_viral: true,
    description: 'Gugusan air terjun megah di lembah rimbun Buleleng dengan tujuh aliran air alami yang memukau. [PERLU DIVERIFIKASI]'
  },
  {
    id: 'p2',
    name: 'Desa Adat Pedawa',
    type: 'wisata',
    category: 'budaya',
    tags: ['desa-kuno', 'bali-aga', 'sejarah', 'arsitektur-bambu'],
    region: 'Buleleng',
    price_level: 1,
    popularity: 32,
    is_viral: false,
    description: 'Salah satu desa Bali Aga kuno yang mempertahankan rumah bambu tradisional dan ritual kuno. [PERLU DIVERIFIKASI]'
  },
  {
    id: 'p3',
    name: 'Warung Syobak Singaraja',
    type: 'kuliner',
    category: 'kuliner-tradisional',
    tags: ['kuliner-khas', 'singaraja', 'bumbu-tauco', 'legendaris'],
    region: 'Buleleng',
    price_level: 1,
    popularity: 46,
    is_viral: false,
    description: 'Kuliner akulturasi Tionghoa-Buleleng dengan kuah kental gurih khas Singaraja. [PERLU DIVERIFIKASI]'
  },
  // Karangasem
  {
    id: 'p4',
    name: 'Pura Lempuyang Luhur',
    type: 'wisata',
    category: 'budaya',
    tags: ['pura', 'gunung-agung', 'fotogenik', 'spiritual'],
    region: 'Karangasem',
    price_level: 2,
    popularity: 92,
    is_viral: true,
    description: 'Pura megah di lereng Gunung Lempuyang yang masyhur dengan panorama Gerbang Surga. [PERLU DIVERIFIKASI]'
  },
  {
    id: 'p5',
    name: 'Warung Makan Ikan Teluk Jemeluk',
    type: 'kuliner',
    category: 'kuliner-tradisional',
    tags: ['seafood', 'ikan-bakar', 'pesisir', 'sambal-matah'],
    region: 'Karangasem',
    price_level: 2,
    popularity: 48,
    is_viral: false,
    description: 'Ikan segar tangkapan nelayan Amed dibakar arang sabut kelapa dengan sambal matah. [PERLU DIVERIFIKASI]'
  },
  // Tabanan
  {
    id: 'p6',
    name: 'Air Terjun Leke Leke',
    type: 'wisata',
    category: 'alam',
    tags: ['air-terjun', 'hutan-tropis', 'tenang', 'hidden-gem'],
    region: 'Tabanan',
    price_level: 1,
    popularity: 48,
    is_viral: false,
    description: 'Air terjun sempit anggun yang tersembunyi di balik celah tebing hijau lumut. [PERLU DIVERIFIKASI]'
  },
  {
    id: 'p7',
    name: 'Warung Entil Pupuan',
    type: 'kuliner',
    category: 'kuliner-tradisional',
    tags: ['entil', 'daun-telengidi', 'tradisional', 'khas-tabanan'],
    region: 'Tabanan',
    price_level: 1,
    popularity: 38,
    is_viral: false,
    description: 'Makanan khas Tabanan barat berupa beras yang dibungkus daun telengidi dengan kuah santan. [PERLU DIVERIFIKASI]'
  },
  // Gianyar
  {
    id: 'p8',
    name: 'Candi Tebing Gunung Kawi',
    type: 'wisata',
    category: 'budaya',
    tags: ['candi-pahat', 'arkeologi', 'sejarah-kuno'],
    region: 'Gianyar',
    price_level: 1,
    popularity: 52,
    is_viral: false,
    description: 'Situs arkeologi abad ke-11 berupa candi megah yang dipahat di tebing batu Sungai Pakerisan. [PERLU DIVERIFIKASI]'
  },
  {
    id: 'p9',
    name: 'Terasering Sawah Tegalalang',
    type: 'wisata',
    category: 'alam',
    tags: ['sawah-bertingkat', 'subak', 'ubud', 'bentang-alam'],
    region: 'Gianyar',
    price_level: 2,
    popularity: 85,
    is_viral: true,
    description: 'Lansekap sawah berundak bertingkat legendaris yang menerapkan sistem irigasi Subak. [PERLU DIVERIFIKASI]'
  }
];

// ==============================================================================
// 2. SUITE PENGUJIAN
// ==============================================================================
console.log('========================================================');
console.log('🧪 PENGUJIAN RECOMMENDER ENGINE (CONTENT-BASED FILTERING)');
console.log('========================================================');
console.log(`Bobot Pengaturan: Cosine Similarity = ${WEIGHT_COSINE}, Novelty Boost = ${WEIGHT_NOVELTY}\n`);

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

// ------------------------------------------------------------------------------
// TEST 1: Tokenizer & Normalisasi Teks
// ------------------------------------------------------------------------------
console.log('👉 [Test 1] Tokenisasi dan Pembersihan Stopwords');
const sampleText = 'Gugusan air terjun megah di lembah rimbun Buleleng [PERLU DIVERIFIKASI]';
const tokens = tokenize(sampleText);
assert(tokens.includes('terjun'), 'Token "terjun" berhasil diekstrak');
assert(!tokens.includes('di'), 'Stopword "di" berhasil dibuang');
assert(!tokens.includes('diverifikasi'), 'Teks penanda [PERLU DIVERIFIKASI] berhasil dibersihkan');

// ------------------------------------------------------------------------------
// TEST 2: Model TF-IDF
// ------------------------------------------------------------------------------
console.log('\n👉 [Test 2] Pembuatan Model TF-IDF');
const tfidf = buildTfidfModel(DUMMY_PLACES);
assert(tfidf.vocabulary.length > 10, `Kosakata terbentuk dengan ${tfidf.vocabulary.length} kata unik`);
assert(tfidf.idf['terjun'] > 1.0, `Nilai IDF untuk "terjun" = ${tfidf.idf['terjun']?.toFixed(2)}`);

// ------------------------------------------------------------------------------
// TEST 3: Rekomendasi Pengguna Penggemar Alam (Buleleng & Tabanan)
// ------------------------------------------------------------------------------
console.log('\n👉 [Test 3] Rekomendasi Profil Pecinta Alam');
const natureUser = {
  interests: ['alam', 'air-terjun', 'trekking'],
  preferred_regions: ['Buleleng', 'Tabanan'],
  budget: 'hemat'
};

const result1 = recommendPackage(natureUser, DUMMY_PLACES, []);
const pkg1 = result1.package;

assert(pkg1.length === 4, `Paket menghasilkan tepat 4 destinasi (aktual: ${pkg1.length})`);

const wisataCount1 = pkg1.filter(p => p.type === 'wisata').length;
const kulinerCount1 = pkg1.filter(p => p.type === 'kuliner').length;
assert(wisataCount1 === 3, `Paket berisi tepat 3 tempat wisata (aktual: ${wisataCount1})`);
assert(kulinerCount1 === 1, `Paket berisi tepat 1 tempat kuliner (aktual: ${kulinerCount1})`);

// Periksa batasan diversitas wilayah (maksimal 2 tempat per region)
const regionCounts1 = {};
pkg1.forEach(p => {
  regionCounts1[p.region] = (regionCounts1[p.region] || 0) + 1;
});
const maxRegionCount1 = Math.max(...Object.values(regionCounts1));
assert(maxRegionCount1 <= 2, `Diversitas wilayah terpenuhi: maks per region = ${maxRegionCount1} (<= 2)`);

console.log(`  Alasan Rekomendasi: "${result1.reason}"`);
console.log('  Rincian Tempat Terpilih:');
pkg1.forEach(p => {
  console.log(`    - Posisi ${p.position}: [${p.type.toUpperCase()}] ${p.name} (${p.region}) | Kategori: ${p.category} | Skor Akhir: ${p.finalScore} (Kecocokan: ${p.matchPercent}%)`);
});

// ------------------------------------------------------------------------------
// TEST 4: Pengecualian Tempat yang Sudah Pernah Selesai Dikunjungi
// ------------------------------------------------------------------------------
console.log('\n👉 [Test 4] Pengecualian Tempat yang Sudah Diselesaikan');
// Misalkan pengguna sudah mengunjungi 'p1' (Air Terjun Sekumpul)
const completedIds = ['p1'];
const result2 = recommendPackage(natureUser, DUMMY_PLACES, completedIds);
const containsCompleted = result2.package.some(p => p.id === 'p1');
assert(!containsCompleted, 'Tempat yang sudah diselesaikan (Air Terjun Sekumpul) TIDAK muncul lagi di rekomendasi baru');

// ------------------------------------------------------------------------------
// TEST 5: Rekomendasi Pengguna Penggemar Budaya (Karangasem & Gianyar)
// ------------------------------------------------------------------------------
console.log('\n👉 [Test 5] Rekomendasi Profil Pecinta Budaya');
const cultureUser = {
  interests: ['budaya', 'sejarah', 'candi-pahat'],
  preferred_regions: ['Karangasem', 'Gianyar'],
  budget: 'menengah'
};

const result3 = recommendPackage(cultureUser, DUMMY_PLACES, []);
const pkg3 = result3.package;
const hasCulturePlaces = pkg3.some(p => p.category === 'budaya');
assert(hasCulturePlaces, 'Paket mengandung destinasi kategori budaya sesuai minat pengguna');
console.log(`  Alasan: "${result3.reason}"`);

// ==============================================================================
// RINGKASAN HASIL TEST
// ==============================================================================
console.log('\n========================================================');
console.log(`HASIL: ${passedTests} / ${totalTests} pengujian BERHASIL`);
if (passedTests === totalTests) {
  console.log('🎉 SELURUH PENGUJIAN LOGIKA REKOMENDASI LOLOS 100%!');
} else {
  console.error('⚠️ TERDAPAT PENGUJIAN YANG GAGAL.');
  process.exit(1);
}
console.log('========================================================\n');
