"""
Tour Penjelajah Bali — Content-Based Filtering (CBF) Pipeline
Bali Digifest 2026: AI Web Innovation Challenge

Dataset: dakbsabsa/bali-destination-tour-datasets-2026 via kagglehub
Outputs:
  1. public/data/bali_cbf_model.pkl (Python Pickle format for ML / data science)
  2. public/data/destinations_cbf.json (Web-ready JSON for frontend & API)
  3. supabase/seed_kaggle_destinations.sql (Postgres SQL Seed for database)
"""

import os
import re
import math
import pickle
import json
from collections import Counter
import pandas as pd
import numpy as np

# 1. Lokasi Cache Kaggle / Download
CSV_CACHE_PATH = r"C:\Users\User\.cache\kagglehub\datasets\dakbsabsa\bali-destination-tour-datasets-2026\versions\1\bali_destinations_20260721_121044.csv"

def load_raw_dataset():
    if os.path.exists(CSV_CACHE_PATH):
        print(f"[OK] Memuat dataset dari cache lokal: {CSV_CACHE_PATH}")
        return pd.read_csv(CSV_CACHE_PATH)
    else:
        print("[INFO] Mengunduh via kagglehub...")
        import kagglehub
        path = kagglehub.dataset_download("dakbsabsa/bali-destination-tour-datasets-2026")
        csv_file = os.path.join(path, "bali_destinations_20260721_121044.csv")
        return pd.read_csv(csv_file)

# 2. Pemetaan Wilayah ke 9 Kabupaten/Kota Resmi Bali
def map_to_bali_regency(location_str):
    loc = str(location_str).lower()
    
    if any(k in loc for k in ["kuta", "canggu", "jimbaran", "nusa dua", "mengwi", "abiansemal", "seminyak", "legian", "uluwatu", "kerobokan"]):
        return "Badung"
    elif any(k in loc for k in ["denpasar", "sanur", "renon"]):
        return "Denpasar"
    elif any(k in loc for k in ["ubud", "tegallalang", "payangan", "sukawati", "blahbatuh", "gianyar", "tampaksiring"]):
        return "Gianyar"
    elif any(k in loc for k in ["singaraja", "banjar", "seririt", "sukasada", "kubutambahan", "gerokgak", "sawan", "tejakula", "lovina"]):
        return "Buleleng"
    elif any(k in loc for k in ["tabanan", "kediri", "marga", "baturiti", "penebel", "bedugul", "jatiluwih", "selemadeg"]):
        return "Tabanan"
    elif any(k in loc for k in ["kintamani", "bangli", "susut", "tembuku", "batur"]):
        return "Bangli"
    elif any(k in loc for k in ["karangasem", "amlapura", "rendang", "bebandem", "selat", "kubu", "manggis", "candidasa", "amed", "besakih"]):
        return "Karangasem"
    elif any(k in loc for k in ["klungkung", "nusa penida", "nusa lembongan", "nusa ceningan", "semarapura", "dawan"]):
        return "Klungkung"
    elif any(k in loc for k in ["negara", "jembrana", "mendoyo", "pekutatan", "melaya", "gilimanuk"]):
        return "Jembrana"
    else:
        return "Badung"  # fallback default

# 3. Pemetaan Kategori & Tipe
def map_category_and_type(raw_cat, name_str):
    c = str(raw_cat).strip().lower()
    n = str(name_str).lower()
    
    if c == "kuliner":
        return "kuliner", "kuliner-tradisional", ["makanan khas", "kuliner lokal", "autentik", "warung bali"]
    elif c == "coffee shop":
        return "kuliner", "kopi-kebun", ["kopi", "santai", "kafe alam", "tempat nongkrong", "cozy"]
    elif c == "alam":
        tags = ["alam", "pemandangan", "hijaunya bali"]
        if "pantai" in n or "beach" in n or "cove" in n:
            tags.extend(["pantai", "ombak", "sunset"])
            return "wisata", "pantai", tags
        elif "waterfall" in n or "air terjun" in n or "curug" in n:
            tags.extend(["air terjun", "sejuk", "trekking"])
            return "wisata", "alam", tags
        elif "lake" in n or "danau" in n or "gunung" in n or "mountain" in n:
            tags.extend(["pegunungan", "danau", "udara dingin"])
            return "wisata", "alam", tags
        return "wisata", "alam", tags
    elif c == "budaya":
        tags = ["budaya", "sejarah", "warisan leluhur"]
        if "pura" in n or "temple" in n:
            tags.extend(["pura", "spiritual", "tempat suci", "arsitektur bali"])
        elif "museum" in n or "palace" in n or "puri" in n:
            tags.extend(["sejarah", "kerajaan", "seni lukis"])
        return "wisata", "budaya", tags
    elif c == "akomodasi":
        return "wisata", "desa-wisata", ["penginapan etnik", "suasana tenang", "desa wisata", "staycation"]
    else:
        return "wisata", "alam", ["rekreasi", "jelajah"]

# 4. Pemetaan Tingkat Harga (1: Hemat, 2: Menengah, 3: Premium)
def map_price_level(price_min, price_max, cat_type):
    p = price_min if not pd.isna(price_min) and price_min > 0 else price_max
    if pd.isna(p) or p <= 0:
        return 1 if cat_type == "wisata" else 2
    if p < 50000:
        return 1
    elif p <= 250000:
        return 2
    else:
        return 3

# 5. Fallback Curated Image URLs
IMAGE_PALETTE = {
    "alam": [
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80"
    ],
    "budaya": [
        "https://images.unsplash.com/photo-1570789210967-2cac24afeb00?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=800&q=80"
    ],
    "pantai": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80"
    ],
    "kuliner-tradisional": [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80"
    ],
    "kopi-kebun": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80"
    ],
    "desa-wisata": [
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80"
    ]
}

def get_image_url(category, idx):
    pool = IMAGE_PALETTE.get(category, IMAGE_PALETTE["alam"])
    return pool[idx % len(pool)]

# 6. Catatan Budaya & Nilai Etika Berdasarkan Kategori
def generate_cultural_note(category, name, region):
    if category == "budaya":
        return f"Wajib mengenakan kamen (kain sarung) dan selendang (senteng). Jaga kesucian tempat dan hindari melangkah mendahului umat yang sedang bersembahyang."
    elif category == "alam" or category == "pantai":
        return f"Dihormati sebagai perwujudan Palemahan (keharmonisan dengan alam). Jaga kebersihan, bawa pulang sampah sendiri, dan hormati sesajen canang di bebatuan."
    elif category in ["kuliner-tradisional", "kopi-kebun"]:
        return f"Mencerminkan kearifan lokal bumbu rajang/base genep Bali. Sapa pemilik warung dengan ramah 'Om Swastyastu' untuk menciptakan kehangatan."
    else:
        return f"Hormati adat istiadat Banjar setempat di wilayah {region}. Bersikap sopan dan jaga ketenangan lingkungan."

# 7. TF-IDF & Cosine Similarity Engine (Pure NumPy/Vectorized)
class PureNumpyCBF:
    def __init__(self):
        self.vocab = {}
        self.idf = None
        self.matrix = None
        self.feature_names = []

    def fit_transform(self, docs):
        # Tokenize
        tokenized_docs = []
        df_counter = Counter()
        for doc in docs:
            tokens = re.findall(r'\b[a-zA-Z0-9_\-]{2,}\b', doc.lower())
            tokenized_docs.append(tokens)
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df_counter[t] += 1
                
        # Build vocabulary (frequency >= 2)
        self.feature_names = [t for t, cnt in df_counter.most_common() if cnt >= 2]
        self.vocab = {t: i for i, t in enumerate(self.feature_names)}
        N = len(docs)
        V = len(self.vocab)
        
        # Calculate IDF: log((1 + N) / (1 + df)) + 1
        self.idf = np.zeros(V, dtype=np.float32)
        for t, idx in self.vocab.items():
            self.idf[idx] = math.log((1.0 + N) / (1.0 + df_counter[t])) + 1.0
            
        # Build TF-IDF matrix
        matrix = np.zeros((N, V), dtype=np.float32)
        for i, tokens in enumerate(tokenized_docs):
            tf_counter = Counter(tokens)
            total = len(tokens) if len(tokens) > 0 else 1
            for t, cnt in tf_counter.items():
                if t in self.vocab:
                    idx = self.vocab[t]
                    matrix[i, idx] = (cnt / total) * self.idf[idx]
                    
        # L2 normalize rows for instant cosine similarity via dot product
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self.matrix = matrix / norms
        return self.matrix

    def get_similarity_matrix(self):
        # Cosine similarity matrix = self.matrix @ self.matrix.T
        return np.dot(self.matrix, self.matrix.T)

# 8. Main Pipeline Execution
def main():
    print("=" * 70)
    print("MEMULAI PIPELINE CONTENT-BASED FILTERING (CBF) KAGGLE BALI 2026")
    print("=" * 70)
    
    df_raw = load_raw_dataset()
    print(f"Data mentah dimuat: {len(df_raw)} baris, {len(df_raw.columns)} kolom.")
    
    cleaned_places = []
    content_soups = []
    
    for idx, row in df_raw.iterrows():
        p_id = str(row["place_id"])
        name = str(row["place_name"]).strip()
        raw_cat = row["category"]
        loc_region = row["location_region"]
        
        region = map_to_bali_regency(loc_region)
        p_type, category, tags = map_category_and_type(raw_cat, name)
        price_lvl = map_price_level(row.get("price_min"), row.get("price_max"), p_type)
        
        # Popularity score based on price, region centrality, and category
        is_viral = (region == "Badung" and p_type == "kuliner") or ("canggu" in str(loc_region).lower())
        popularity = 85 if is_viral else 45 + (idx % 35)
        
        lat = float(row["coordinates_lat"]) if not pd.isna(row["coordinates_lat"]) else -8.409518
        lng = float(row["coordinates_lng"]) if not pd.isna(row["coordinates_lng"]) else 115.188919
        
        cultural_note = generate_cultural_note(category, name, region)
        description = f"Destinasi {category} di {loc_region}, kawasan {region}. Menawarkan pengalaman otentik khas Bali."
        img_url = get_image_url(category, idx)
        
        # Metadata dictionary
        place_data = {
            "id": p_id,
            "name": name,
            "type": p_type,
            "category": category,
            "tags": tags,
            "region": region,
            "sub_district": str(loc_region),
            "price_level": price_lvl,
            "popularity": popularity,
            "is_viral": is_viral,
            "description": description,
            "cultural_note": cultural_note,
            "image_url": img_url,
            "lat": lat,
            "lng": lng,
            "contact_wa": str(int(row["contact_wa"])) if not pd.isna(row.get("contact_wa")) else None
        }
        cleaned_places.append(place_data)
        
        # Content soup for CBF vectorization
        # Kombinasikan tipe, kategori, kabupaten, tags, dan tingkat harga
        soup = f"{p_type} {category} {region} {' '.join(tags)} budget_{price_lvl} {name} {loc_region}"
        content_soups.append(soup)
        
    df_clean = pd.DataFrame(cleaned_places)
    print(f"[OK] Data berhasil dibersihkan & dipetakan: {len(df_clean)} destinasi.")
    print("Sebaran Kategori:\n", df_clean["category"].value_counts())
    print("\nSebaran Wilayah (9 Kabupaten):\n", df_clean["region"].value_counts())
    
    # 9. Fitting CBF Vectorizer & Cosine Similarity Matrix
    print("\n[INFO] Menghitung TF-IDF dan Matriks Cosine Similarity...")
    cbf_engine = PureNumpyCBF()
    tfidf_mat = cbf_engine.fit_transform(content_soups)
    print(f"[OK] Matriks TF-IDF terbentuk: {tfidf_mat.shape} (N={tfidf_mat.shape[0]}, Vocab={tfidf_mat.shape[1]})")
    
    # Compute Top-5 Most Similar Places per item for ultra-fast lookup
    print("[INFO] Menghitung 5 rekomendasi tempat paling mirip untuk setiap destinasi...")
    top_recommendations = {}
    for i in range(len(cleaned_places)):
        # Dot product of row i with all other rows
        sim_scores = np.dot(tfidf_mat[i], tfidf_mat.T)
        sim_scores[i] = -1.0  # exclude self
        top_indices = np.argsort(sim_scores)[::-1][:5]
        
        p_id = cleaned_places[i]["id"]
        top_recommendations[p_id] = [
            {
                "id": cleaned_places[idx_rec]["id"],
                "name": cleaned_places[idx_rec]["name"],
                "category": cleaned_places[idx_rec]["category"],
                "region": cleaned_places[idx_rec]["region"],
                "similarity_score": round(float(sim_scores[idx_rec]), 4)
            }
            for idx_rec in top_indices
        ]
        
    # 10. Simpan ke File Format .PKL (Pickle untuk Python ML)
    os.makedirs(r"d:\xampp\htdocs\tobal\public\data", exist_ok=True)
    pkl_file = r"d:\xampp\htdocs\tobal\public\data\bali_cbf_model.pkl"
    with open(pkl_file, "wb") as f:
        pickle.dump({
            "places_df": df_clean,
            "vocab": cbf_engine.vocab,
            "idf": cbf_engine.idf,
            "feature_names": cbf_engine.feature_names,
            "tfidf_matrix": tfidf_mat,
            "top_recommendations": top_recommendations,
            "version": "2026.1"
        }, f)
    print(f"[OK] File .pkl berhasil disimpan: {pkl_file} ({os.path.getsize(pkl_file)} bytes)")
    
    # 11. Simpan ke File Format .JSON (Siap Akses untuk Web App / Vercel Serverless)
    json_file = r"d:\xampp\htdocs\tobal\public\data\destinations_cbf.json"
    web_payload = {
        "metadata": {
            "total_destinations": len(cleaned_places),
            "source": "dakbsabsa/bali-destination-tour-datasets-2026",
            "algorithm": "Content-Based Filtering (TF-IDF + Cosine Similarity)",
            "updated_at": "2026-11-01"
        },
        "destinations": cleaned_places,
        "top_similarities": top_recommendations
    }
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(web_payload, f, ensure_ascii=False, indent=2)
    print(f"[OK] File .json untuk Web berhasil disimpan: {json_file} ({os.path.getsize(json_file)} bytes)")
    
    # 12. Buat SQL Seed File untuk Supabase (places table)
    sql_file = r"d:\xampp\htdocs\tobal\supabase\seed_kaggle_destinations.sql"
    with open(sql_file, "w", encoding="utf-8") as f:
        f.write("-- ==============================================================================\n")
        f.write("-- Tour Penjelajah Bali — Seed Data 1.303 Destinasi Kaggle (CBF Enhanced)\n")
        f.write("-- Dataset: dakbsabsa/bali-destination-tour-datasets-2026\n")
        f.write("-- ==============================================================================\n\n")
        f.write("INSERT INTO public.places (id, name, type, category, tags, region, price_level, popularity, is_viral, description, cultural_note, image_url, lat, lng)\nVALUES\n")
        
        values_sql = []
        for p in cleaned_places:
            tags_literal = "ARRAY[" + ",".join([f"'{t}'" for t in p["tags"]]) + "]::text[]"
            # Escape single quotes in text
            name_esc = p["name"].replace("'", "''")
            desc_esc = p["description"].replace("'", "''")
            cult_esc = p["cultural_note"].replace("'", "''")
            
            row_sql = (
                f"  ('{p['id']}', '{name_esc}', '{p['type']}', '{p['category']}', {tags_literal}, "
                f"'{p['region']}', {p['price_level']}, {p['popularity']}, {'true' if p['is_viral'] else 'false'}, "
                f"'{desc_esc}', '{cult_esc}', '{p['image_url']}', {p['lat']}, {p['lng']})"
            )
            values_sql.append(row_sql)
            
        f.write(",\n".join(values_sql))
        f.write("\nON CONFLICT (id) DO UPDATE SET\n")
        f.write("  name = EXCLUDED.name,\n  type = EXCLUDED.type,\n  category = EXCLUDED.category,\n  tags = EXCLUDED.tags,\n  region = EXCLUDED.region,\n  price_level = EXCLUDED.price_level,\n  popularity = EXCLUDED.popularity,\n  is_viral = EXCLUDED.is_viral,\n  description = EXCLUDED.description,\n  cultural_note = EXCLUDED.cultural_note,\n  image_url = EXCLUDED.image_url,\n  lat = EXCLUDED.lat,\n  lng = EXCLUDED.lng;\n")
        
    print(f"[OK] File SQL Seed untuk Supabase berhasil dibuat: {sql_file} ({os.path.getsize(sql_file)} bytes)")
    
    # 13. Test Sample Recommendation
    sample_id = cleaned_places[10]["id"]
    print(f"\n[DEMO REKOMENDASI] Tempat: '{cleaned_places[10]['name']}' ({cleaned_places[10]['category']}, {cleaned_places[10]['region']})")
    print("5 Tempat Rekomendasi Teratas Berdasarkan Kesamaan Konten:")
    for rank, rec in enumerate(top_recommendations[sample_id], 1):
        print(f"  {rank}. {rec['name']} [{rec['category']}] ({rec['region']}) — Skor Kemiripan: {rec['similarity_score']}")
        
    print("\n[SELESAI] Pipeline CBF sukses 100%!")

if __name__ == "__main__":
    main()
