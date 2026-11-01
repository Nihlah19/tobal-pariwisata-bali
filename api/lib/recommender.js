/**
 * Recommender Engine — Tour Penjelajah Bali
 * Content-Based Filtering (One-Hot + TF-IDF + Cosine Similarity + Novelty Boost)
 * Logika murni tanpa library ML berat.
 */

// ==============================================================================
// 1. KONSTANTA BOBOT REKOMENDASI
// ==============================================================================
// WEIGHT_COSINE: Mengukur kecocokan konten (minat, kategori, wilayah, budget)
// WEIGHT_NOVELTY: Memberi dorongan skor pada tempat yang kurang viral (hidden gems)
// agar kunjungan wisata di Bali tidak menumpuk di tempat viral saja.
export const WEIGHT_COSINE = 0.7;
export const WEIGHT_NOVELTY = 0.3;

// Stopwords umum bahasa Indonesia untuk membersihkan deskripsi
const INDONESIAN_STOPWORDS = new Set([
  'dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'pada', 'adalah', 'ini', 'itu',
  'dengan', 'sebagai', 'oleh', 'serta', 'atau', 'juga', 'dalam', 'karena',
  'sebuah', 'satu', 'bisa', 'dapat', 'akan', 'ada', 'khas', 'sarat', 'salah',
  'perlu', 'diverifikasi', 'puluhan', 'tahun', 'silam', 'sejak'
]);

// 9 Wilayah / Kabupaten di Bali
export const BALI_REGIONS = [
  'Badung', 'Bangli', 'Buleleng', 'Gianyar',
  'Jembrana', 'Karangasem', 'Klungkung', 'Tabanan', 'Denpasar'
];

// Budget to Price Level Mapping
const BUDGET_MAP = {
  'hemat': 1,
  'menengah': 2,
  'premium': 3
};

// ==============================================================================
// 2. TOKENISASI & PEMROSESAN TEKS
// ==============================================================================
export function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/\[perlu diverifikasi\]/gi, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !INDONESIAN_STOPWORDS.has(w));
}

// ==============================================================================
// 3. TF-IDF MODEL BUILDER
// ==============================================================================
export function buildTfidfModel(places) {
  const docsTokens = places.map(p => {
    const tagTokens = Array.isArray(p.tags) ? p.tags.flatMap(t => tokenize(t)) : [];
    const descTokens = tokenize(p.description || '');
    const catTokens = tokenize(p.category || '');
    return [...tagTokens, ...tagTokens, ...catTokens, ...descTokens]; // bobot ekstra pada tags
  });

  const N = places.length;
  const docFreq = {};

  // Hitung Document Frequency (DF)
  docsTokens.forEach(tokens => {
    const uniqueTerms = new Set(tokens);
    uniqueTerms.forEach(term => {
      docFreq[term] = (docFreq[term] || 0) + 1;
    });
  });

  // Hitung IDF halus (smooth IDF)
  const idf = {};
  const vocabulary = Object.keys(docFreq);
  vocabulary.forEach(term => {
    idf[term] = Math.log((1 + N) / (1 + docFreq[term])) + 1;
  });

  return { vocabulary, idf, docsTokens };
}

// ==============================================================================
// 4. VEKTORISASI FITUR TEMPAT
// ==============================================================================
export function buildPlaceVectors(places, tfidfModel) {
  const { vocabulary, idf, docsTokens } = tfidfModel;

  // Dapatkan seluruh kategori unik
  const allCategories = Array.from(new Set(places.map(p => p.category).filter(Boolean)));

  const vectors = places.map((place, idx) => {
    const vector = {};

    // A. One-hot: Category (Bobot 2.0)
    allCategories.forEach(cat => {
      vector[`cat_${cat}`] = place.category === cat ? 2.0 : 0.0;
    });

    // B. One-hot: Region (Bobot 1.5)
    BALI_REGIONS.forEach(reg => {
      vector[`reg_${reg}`] = place.region === reg ? 1.5 : 0.0;
    });

    // C. One-hot: Price Level 1, 2, 3 (Bobot 1.0)
    [1, 2, 3].forEach(lvl => {
      vector[`price_${lvl}`] = place.price_level === lvl ? 1.0 : 0.0;
    });

    // D. TF-IDF untuk Text (Tags + Description) (Bobot 1.5)
    const tokens = docsTokens[idx];
    const termCounts = {};
    tokens.forEach(t => {
      termCounts[t] = (termCounts[t] || 0) + 1;
    });
    const totalTokens = tokens.length || 1;

    vocabulary.forEach(term => {
      const tf = (termCounts[term] || 0) / totalTokens;
      const termIdf = idf[term] || 0;
      vector[`term_${term}`] = (tf * termIdf) * 1.5;
    });

    // Normalisasi vektor ke unit length (L2 norm)
    return normalizeVector(vector);
  });

  return { vectors, allCategories };
}

// ==============================================================================
// 5. VEKTORISASI PROFIL PENGGUNA
// ==============================================================================
export function buildProfileVector(profile, allCategories, tfidfModel, highRatedPlaces = [], allPlaces = [], placeVectors = []) {
  const { vocabulary, idf } = tfidfModel;
  const vector = {};

  // Inisialisasi semua dimensi ke 0
  allCategories.forEach(cat => { vector[`cat_${cat}`] = 0.0; });
  BALI_REGIONS.forEach(reg => { vector[`reg_${reg}`] = 0.0; });
  [1, 2, 3].forEach(lvl => { vector[`price_${lvl}`] = 0.0; });
  vocabulary.forEach(term => { vector[`term_${term}`] = 0.0; });

  // A. Preferensi Eksplisit: Interests (Minat)
  const interests = profile?.interests || [];
  interests.forEach(interest => {
    const interestTokens = tokenize(interest);

    // Cocokkan ke kategori
    allCategories.forEach(cat => {
      if (cat.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(cat.toLowerCase())) {
        vector[`cat_${cat}`] += 2.5;
      }
    });

    // Cocokkan ke terms / tags
    interestTokens.forEach(term => {
      if (vector[`term_${term}`] !== undefined) {
        vector[`term_${term}`] += (idf[term] || 1.5) * 2.0;
      }
    });
  });

  // B. Preferensi Eksplisit: Preferred Regions (Wilayah)
  const preferredRegions = profile?.preferred_regions || [];
  preferredRegions.forEach(reg => {
    if (vector[`reg_${reg}`] !== undefined) {
      vector[`reg_${reg}`] += 2.0;
    }
  });

  // C. Preferensi Eksplisit: Budget
  const targetPrice = BUDGET_MAP[profile?.budget] || 2;
  vector[`price_${targetPrice}`] += 1.5;

  // D. Preferensi Implisit: Rata-rata vektor tempat dengan rating >= 4
  if (highRatedPlaces.length > 0 && placeVectors.length > 0) {
    const highRatedIds = new Set(highRatedPlaces.map(p => p.id));
    let matchCount = 0;
    const avgVector = {};

    allPlaces.forEach((p, idx) => {
      if (highRatedIds.has(p.id)) {
        matchCount++;
        const pVec = placeVectors[idx];
        Object.keys(pVec).forEach(k => {
          avgVector[k] = (avgVector[k] || 0) + pVec[k];
        });
      }
    });

    if (matchCount > 0) {
      Object.keys(avgVector).forEach(k => {
        // Gabungkan preferensi eksplisit + 0.6 bobot histori rating tinggi
        vector[k] = (vector[k] || 0) + ((avgVector[k] / matchCount) * 0.6);
      });
    }
  }

  return normalizeVector(vector);
}

// ==============================================================================
// 6. OPERASI VEKTOR & COSINE SIMILARITY
// ==============================================================================
export function normalizeVector(vector) {
  let sumSq = 0;
  for (const key in vector) {
    sumSq += vector[key] * vector[key];
  }
  const mag = Math.sqrt(sumSq);
  if (mag === 0) return vector;

  const normalized = {};
  for (const key in vector) {
    normalized[key] = vector[key] / mag;
  }
  return normalized;
}

export function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  for (const key in vecA) {
    if (vecB[key] !== undefined) {
      dotProduct += vecA[key] * vecB[key];
    }
  }
  return Math.max(0, Math.min(1, dotProduct));
}

// ==============================================================================
// 7. SCORING & DIVERSITY PACKAGE SELECTION
// ==============================================================================
/**
 * Menghitung skor akhir dan memilih 1 paket petualangan:
 * - 3 tempat type 'wisata'
 * - 1 tempat type 'kuliner'
 * - Maksimal 2 tempat dari region yang sama
 * - Menghindari tempat yang sudah dikunjungi (completedPlaceIds)
 */
export function recommendPackage(profile, places, completedPlaceIds = [], highRatedPlaces = []) {
  if (!places || places.length === 0) {
    throw new Error('Katalog destinasi kosong.');
  }

  // 1. Buat model TF-IDF dan vektor tempat
  const tfidfModel = buildTfidfModel(places);
  const { vectors, allCategories } = buildPlaceVectors(places, tfidfModel);

  // 2. Bangun vektor profil pengguna
  const profileVec = buildProfileVector(
    profile,
    allCategories,
    tfidfModel,
    highRatedPlaces,
    places,
    vectors
  );

  // 3. Hitung skor cosine similarity dan skor akhir
  const completedSet = new Set(completedPlaceIds);
  const scoredPlaces = places.map((place, idx) => {
    const cosine = cosineSimilarity(profileVec, vectors[idx]);
    const novelty = 1 - ((place.popularity || 50) / 100);
    const finalScore = (cosine * WEIGHT_COSINE) + (novelty * WEIGHT_NOVELTY);

    return {
      ...place,
      cosineScore: Number(cosine.toFixed(4)),
      noveltyScore: Number(novelty.toFixed(4)),
      finalScore: Number(finalScore.toFixed(4)),
      matchPercent: Math.round(finalScore * 100)
    };
  });

  // 4. Pisahkan kandidat (yang belum pernah diselesaikan)
  const availablePlaces = scoredPlaces.filter(p => !completedSet.has(p.id));
  const wisataPool = availablePlaces.filter(p => p.type === 'wisata').sort((a, b) => b.finalScore - a.finalScore);
  const kulinerPool = availablePlaces.filter(p => p.type === 'kuliner').sort((a, b) => b.finalScore - a.finalScore);

  if (wisataPool.length < 3) {
    throw new Error('Jumlah destinasi wisata yang tersedia tidak mencukupi untuk membuat paket.');
  }
  if (kulinerPool.length < 1) {
    throw new Error('Jumlah tempat kuliner yang tersedia tidak mencukupi untuk membuat paket.');
  }

  // 5. Algoritma pemilihan paket dengan batasan diversitas: maks 2 tempat per region
  const selected = selectDiversePackage(wisataPool, kulinerPool);

  // 6. Buat narasi alasan rekomendasi
  const reason = generateReason(profile, selected);

  return {
    package: selected,
    reason,
    weights: {
      cosine: WEIGHT_COSINE,
      novelty: WEIGHT_NOVELTY
    }
  };
}

/**
 * Memilih 3 wisata + 1 kuliner dengan skor terbaik
 * sambil menjamin tidak ada region yang muncul lebih dari 2 kali.
 */
function selectDiversePackage(wisataPool, kulinerPool) {
  // Coba kombinasi teratas dengan backtracking sederhana
  for (let i = 0; i < wisataPool.length; i++) {
    for (let j = i + 1; j < wisataPool.length; j++) {
      for (let k = j + 1; k < wisataPool.length; k++) {
        const w1 = wisataPool[i];
        const w2 = wisataPool[j];
        const w3 = wisataPool[k];

        // Hitung frekuensi wilayah 3 wisata
        const regionCount = {};
        [w1, w2, w3].forEach(w => {
          regionCount[w.region] = (regionCount[w.region] || 0) + 1;
        });

        // Jika salah satu wilayah sudah > 2, lewati
        if (Object.values(regionCount).some(count => count > 2)) continue;

        // Cari 1 kuliner terbaik yang tidak melanggar kuota wilayah
        for (let m = 0; m < kulinerPool.length; m++) {
          const kulin = kulinerPool[m];
          const testCount = { ...regionCount };
          testCount[kulin.region] = (testCount[kulin.region] || 0) + 1;

          if (testCount[kulin.region] <= 2) {
            // Berhasil menemukan paket optimal!
            return [
              { ...w1, position: 1 },
              { ...w2, position: 2 },
              { ...w3, position: 3 },
              { ...kulin, position: 4 }
            ];
          }
        }
      }
    }
  }

  // Fallback darurat jika batasan wilayah terlalu ketat: ambil top 3 wisata + top 1 kuliner
  return [
    { ...wisataPool[0], position: 1 },
    { ...wisataPool[1], position: 2 },
    { ...wisataPool[2], position: 3 },
    { ...kulinerPool[0], position: 4 }
  ];
}

/**
 * Menghasilkan kalimat alasan rekomendasi berdasarkan minat dan wilayah yang terpilih.
 */
function generateReason(profile, selectedPlaces) {
  const regions = Array.from(new Set(selectedPlaces.map(p => p.region)));
  const categories = Array.from(new Set(selectedPlaces.map(p => p.category)));
  const userInterests = profile?.interests || [];

  const matchedInterests = userInterests.filter(interest =>
    categories.some(c => c.toLowerCase().includes(interest.toLowerCase())) ||
    selectedPlaces.some(p => p.tags && p.tags.some(t => t.toLowerCase().includes(interest.toLowerCase())))
  );

  const interestText = matchedInterests.length > 0
    ? matchedInterests.join(' dan ')
    : categories.slice(0, 2).join(' dan ');

  const regionText = regions.length === 1
    ? `di ${regions[0]}`
    : `di ${regions.slice(0, 2).join(' dan ')}`;

  const hiddenGems = selectedPlaces.filter(p => !p.is_viral);
  const hiddenGemNote = hiddenGems.length > 0
    ? ` Termasuk ${hiddenGems.length} destinasi otentik non-viral untuk dijelajahi.`
    : '';

  return `Direkomendasikan khusus berdasarkan minat ${interestText} ${regionText}.${hiddenGemNote}`;
}
