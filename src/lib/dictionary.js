/**
 * Kamus Bahasa Bali — Data Access & Utilities
 * Mendukung pencarian Supabase PostgreSQL (pg_trgm / ilike) dengan fallback lokal lengkap
 * Tour Penjelajah Bali — Bali Digifest 2026
 */

import { supabase } from './supabaseClient.js';

// ==============================================================================
// DATASET LOKAL LENGKAP (46 KOSAKATA TERKURASI DENGAN TINGKATAN BAHASA)
// Berfungsi sebagai data fallback instan saat offline atau sebelum migrasi database
// ==============================================================================
export const FALLBACK_DICTIONARY = [
  // SAPAAN & PERCAKAPAN
  {
    id: 'k1',
    kata: 'Om Swastyastu',
    arti_indonesia: 'Semoga dalam keadaan selamat dan sejahtera atas karunia Sang Hyang Widhi Wasa (sapaan sakral pembuka khas Bali)',
    arti_inggris: 'May peace and safety be upon you (sacred Balinese greeting)',
    kelas_kata: 'p',
    tingkat: 'umum',
    contoh_bali: 'Om Swastyastu, matur suksma sampun rauh ring jero titiang.',
    contoh_terjemahan: 'Om Swastyastu, terima kasih banyak telah berkunjung ke kediaman hamba. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Umum: Om Swastyastu'],
    catatan: 'Diucapkan dengan cakupan kedua telapak tangan di dada (anjali mudra) dan sedikit membungkuk hormat. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k2',
    kata: 'Matur suksma',
    arti_indonesia: 'Terima kasih banyak / berterima kasih secara sopan',
    arti_inggris: 'Thank you very much',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Matur suksma antuk wantuan ragane.',
    contoh_terjemahan: 'Terima kasih banyak atas bantuan Anda. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Suksma', 'Alus Singgih: Suksmayang'],
    catatan: 'Ungkapan terima kasih yang paling aman dan sopan digunakan wisatawan kepada siapa saja di Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k3',
    kata: 'Suksma mewali',
    arti_indonesia: 'Terima kasih kembali / sama-sama',
    arti_inggris: 'You are welcome / thank you in return',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Suksma mewali, dumogi rahayu ring margi.',
    contoh_terjemahan: 'Terima kasih kembali, semoga selamat di perjalanan. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Mewali'],
    catatan: 'Jawaban balasan santun saat lawan bicara mengucapkan matur suksma. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k4',
    kata: 'Rahajeng semeng',
    arti_indonesia: 'Selamat pagi',
    arti_inggris: 'Good morning',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Rahajeng semeng bli, kenken kabare mangkin?',
    contoh_terjemahan: 'Selamat pagi bli, bagaimana kabarnya sekarang? [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Sapaan pagi hari bernada hangat untuk menyapa warga lokal. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k5',
    kata: 'Rahajeng tengai',
    arti_indonesia: 'Selamat siang',
    arti_inggris: 'Good afternoon',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Rahajeng tengai mbok, sampun ngajeng?',
    contoh_terjemahan: 'Selamat siang mbok, sudah makan siang? [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Digunakan sekitar pukul 11.00 hingga 15.00 WITA. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k6',
    kata: 'Rahajeng wengi',
    arti_indonesia: 'Selamat malam',
    arti_inggris: 'Good evening / Good night',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Rahajeng wengi, suksma antuk pelayanan sane becik.',
    contoh_terjemahan: 'Selamat malam, terima kasih atas pelayanan yang baik. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Sapaan malam hari untuk bertegur sapa santai atau salam perpisahan malam. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k7',
    kata: 'Ampura',
    arti_indonesia: 'Maaf / mohon maaf / permisi',
    arti_inggris: 'Excuse me / I am sorry',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Ampura, margi puniki nuju kija nggih?',
    contoh_terjemahan: 'Mohon maaf, jalan ini mengarah ke mana ya? [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Singgih: Sinampura', 'Andap: Ngampurayang'],
    catatan: 'Kata wajib saat permisi berjalan di kerumunan upacara atau menanyakan petunjuk arah. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k8',
    kata: 'Inggih',
    arti_indonesia: 'Ya / benar / setuju secara santun',
    arti_inggris: 'Yes / correct (polite)',
    kelas_kata: 'adv',
    tingkat: 'alus madya',
    contoh_bali: 'Inggih patut, titiang jagi melancaran ka Sekumpul.',
    contoh_terjemahan: 'Ya benar sekali, hamba hendak berwisata ke Sekumpul. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Aja / Saja', 'Alus Singgih: Inggih patut'],
    catatan: 'Kata penanda rasa hormat dan kesepahaman dalam percakapan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k9',
    kata: 'Nenten',
    arti_indonesia: 'Tidak / bukan (bentuk halus)',
    arti_inggris: 'No / not (polite)',
    kelas_kata: 'adv',
    tingkat: 'alus madya',
    contoh_bali: 'Titiang nenten uning margi punika.',
    contoh_terjemahan: 'Hamba tidak mengetahui jalan tersebut. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Sing / Tusing', 'Alus Sor: Nenten'],
    catatan: 'Sangat disarankan memakai kata nenten dibanding sing untuk kesantunan dengan warga lokal. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k10',
    kata: 'Sing',
    arti_indonesia: 'Tidak / bukan (bentuk akrab / informal)',
    arti_inggris: 'No / not (casual)',
    kelas_kata: 'adv',
    tingkat: 'andap/kasar',
    contoh_bali: 'Icang sing nyak melali joh-joh.',
    contoh_terjemahan: 'Aku tidak mau bepergian jauh-jauh. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Nenten', 'Alus Singgih: Nenten pisan'],
    catatan: 'Hanya digunakan sesama kawan sebaya akrab; jangan gunakan pada pemangku atau tetua adat. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k11',
    kata: 'Durusang',
    arti_indonesia: 'Silakan / mari dipersilakan',
    arti_inggris: 'Please go ahead / Please enter',
    kelas_kata: 'v',
    tingkat: 'alus singgih',
    contoh_bali: 'Durusang ngranjing ring jero titiang.',
    contoh_terjemahan: 'Silakan masuk ke kediaman hamba. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Ngiring', 'Andap: Jalan'],
    catatan: 'Bentuk penghormatan tinggi saat mempersilakan tamu masuk atau mencicipi hidangan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k12',
    kata: 'Titiang',
    arti_indonesia: 'Saya / hamba (merendahkan diri sendiri secara santun)',
    arti_inggris: 'I / myself (humble form)',
    kelas_kata: 'pron',
    tingkat: 'alus sor',
    contoh_bali: 'Titiang meled uning indik adat ring Pedawa.',
    contoh_terjemahan: 'Hamba sangat ingin tahu tentang adat istiadat di Pedawa. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Tiang', 'Andap: Icang', 'Kasar: Kai'],
    catatan: 'Menunjukkan tata krama andap asor (rendah hati) luhur masyarakat Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k13',
    kata: 'Ragane',
    arti_indonesia: 'Anda / beliau (meninggikan lawan bicara)',
    arti_inggris: 'You (respectful form)',
    kelas_kata: 'pron',
    tingkat: 'alus singgih',
    contoh_bali: 'Sira wastan ragane nggih?',
    contoh_terjemahan: 'Siapakah nama Anda yang mulia/terhormat? [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Jero', 'Andap: Cai (pria) / Nyai (wanita)'],
    catatan: 'Pronomina kedua paling santun saat berinteraksi dengan tokoh adat atau orang baru. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k14',
    kata: 'Punapi gatrane?',
    arti_indonesia: 'Bagaimana kabar Anda? (bentuk sopan)',
    arti_inggris: 'How are you? (polite)',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Punapi gatrane bapak perbekel mangkin?',
    contoh_terjemahan: 'Bagaimana kabar Bapak Kepala Desa sekarang? [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Kenken kabare?'],
    catatan: 'Pertanyaan kabar santun yang sangat dihargai saat bertamu ke desa wisata. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k15',
    kata: 'Kenken kabare?',
    arti_indonesia: 'Bagaimana kabarmu? (sapaan santai / akrab)',
    arti_inggris: 'How are you? (casual)',
    kelas_kata: 'p',
    tingkat: 'andap/kasar',
    contoh_bali: 'Bli, kenken kabare mangkin?',
    contoh_terjemahan: 'Bli, bagaimana kabarmu sekarang? [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Punapi gatrane?'],
    catatan: 'Sapaan akrab sehari-hari kepada teman sebaya atau pemandu wisata yang sudah akrab. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },

  // ANGKA & TRANSAKSI
  {
    id: 'k16',
    kata: 'Besik',
    arti_indonesia: 'Satu (ragam akrab)',
    arti_inggris: 'One (casual)',
    kelas_kata: 'num',
    tingkat: 'andap/kasar',
    contoh_bali: 'Beliang jukut besik manten.',
    contoh_terjemahan: 'Belikan sayur satu porsi saja. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Siki'],
    catatan: 'Bilangan satu ragam umum sehari-hari. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k17',
    kata: 'Siki',
    arti_indonesia: 'Satu (ragam sopan / halus)',
    arti_inggris: 'One (polite)',
    kelas_kata: 'num',
    tingkat: 'alus madya',
    contoh_bali: 'Nunas canang siki nggih mbok.',
    contoh_terjemahan: 'Minta canang satu ya mbok. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Besik'],
    catatan: 'Sangat sopan digunakan saat berbelanja canang atau memesan makanan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k18',
    kata: 'Dua',
    arti_indonesia: 'Dua (ragam akrab)',
    arti_inggris: 'Two (casual)',
    kelas_kata: 'num',
    tingkat: 'andap/kasar',
    contoh_bali: 'Ia ngelah panak dua.',
    contoh_terjemahan: 'Dia memiliki anak dua orang. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Kalih'],
    catatan: 'Bilangan dua untuk percakapan santai. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k19',
    kata: 'Kalih',
    arti_indonesia: 'Dua (ragam halus)',
    arti_inggris: 'Two (polite)',
    kelas_kata: 'num',
    tingkat: 'alus madya',
    contoh_bali: 'Titiang nunas ajengan kalih porsi.',
    contoh_terjemahan: 'Hamba memesan makanan dua porsi. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Dua'],
    catatan: 'Digunakan dalam percakapan sopan atau pesanan resmi. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k20',
    kata: 'Telu',
    arti_indonesia: 'Tiga (ragam akrab)',
    arti_inggris: 'Three (casual)',
    kelas_kata: 'num',
    tingkat: 'andap/kasar',
    contoh_bali: 'Ada anak telu di marga.',
    contoh_terjemahan: 'Ada tiga orang di jalan. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Tiga'],
    catatan: 'Bilangan tiga untuk percakapan sehari-hari. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k21',
    kata: 'Tiga',
    arti_indonesia: 'Tiga (ragam halus)',
    arti_inggris: 'Three (polite)',
    kelas_kata: 'num',
    tingkat: 'alus madya',
    contoh_bali: 'Tiket ranjing puniki kaperluang antuk jadma tiga.',
    contoh_terjemahan: 'Tiket masuk ini diperlukan untuk tiga orang. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Telu'],
    catatan: 'Ragam sopan untuk menyebut tiga. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k22',
    kata: 'Papat',
    arti_indonesia: 'Empat',
    arti_inggris: 'Four',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Buku petualangan puniki medaging patpat genah becik.',
    contoh_terjemahan: 'Buku petualangan ini berisi empat tempat bagus. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Kerap dilafalkan patpat saat merangkai kata benda. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k23',
    kata: 'Lima',
    arti_indonesia: 'Lima (angka 5 atau anggota tubuh tangan)',
    arti_inggris: 'Five (or hand)',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Ajine lima tali rupiah.',
    contoh_terjemahan: 'Harganya lima ribu rupiah. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Dapat bermakna bilangan lima atau tangan tergantung konteks kalimat. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k24',
    kata: 'Nem',
    arti_indonesia: 'Enam',
    arti_inggris: 'Six',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Wenten anak nem sane sareng melancaran.',
    contoh_terjemahan: 'Ada enam orang yang ikut berwisata. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Angka enam dalam perhitungan Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k25',
    kata: 'Pitu',
    arti_indonesia: 'Tujuh',
    arti_inggris: 'Seven',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Air Terjun Sekumpul medue pitung grojogan.',
    contoh_terjemahan: 'Air Terjun Sekumpul memiliki tujuh air terjun. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Sering disebut "pitu" atau "pitung". [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k26',
    kata: 'Kutus',
    arti_indonesia: 'Delapan',
    arti_inggris: 'Eight',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Kutus tali rupiah aji tiket niki.',
    contoh_terjemahan: 'Delapan ribu rupiah harga tiket ini. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Angka delapan dalam hitungan tradisional. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k27',
    kata: 'Sia',
    arti_indonesia: 'Sembilan',
    arti_inggris: 'Nine',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Pulau Bali kabelas dados sia kabupaten.',
    contoh_terjemahan: 'Pulau Bali terbagi menjadi sembilan kabupaten/kota. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Angka sembilan dalam tradisi nawa sanga. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k28',
    kata: 'Dasa',
    arti_indonesia: 'Sepuluh',
    arti_inggris: 'Ten',
    kelas_kata: 'num',
    tingkat: 'umum',
    contoh_bali: 'Dasa tali rupiah punika sampun cukup.',
    contoh_terjemahan: 'Sepuluh ribu rupiah itu sudah cukup. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Satuan genap sepuluh. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k29',
    kata: 'Aji kuda?',
    arti_indonesia: 'Berapa harganya?',
    arti_inggris: 'How much does this cost?',
    kelas_kata: 'p',
    tingkat: 'alus madya',
    contoh_bali: 'Kamben puniki aji kuda nggih bli?',
    contoh_terjemahan: 'Kain sarung ini berapa harganya ya bli? [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Kuda hargane?'],
    catatan: 'Frasa kunci wisatawan untuk menanyakan harga secara sopan di pasar seni lokal. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },

  // MAKANAN & KULINER
  {
    id: 'k30',
    kata: 'Rayunan',
    arti_indonesia: 'Santapan / hidangan makanan terhormat (tingkatan tertinggi)',
    arti_inggris: 'Honored meal / feast',
    kelas_kata: 'n',
    tingkat: 'alus singgih',
    contoh_bali: 'Ratu Peranda sampun merayunan ring bale gedong.',
    contoh_terjemahan: 'Ratu Pedanda sudah menikmati santapan di bale gedong. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Ajengan', 'Andap: Nasi / Panganan'],
    catatan: 'Bentuk penghormatan tertinggi untuk makanan pemuka agama atau bangsawan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k31',
    kata: 'Ajengan',
    arti_indonesia: 'Makanan / hidangan nasi yang sopan',
    arti_inggris: 'Food / meal (polite)',
    kelas_kata: 'n',
    tingkat: 'alus madya',
    contoh_bali: 'Durusang ambal ajengan puniki sane sampun cawisang.',
    contoh_terjemahan: 'Silakan cicipi hidangan makanan ini yang telah disiapkan. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Singgih: Rayunan', 'Andap: Nasi'],
    catatan: 'Istilah Ajengan Bali populer merujuk pada kuliner tradisional bermutu. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k32',
    kata: 'Nasi',
    arti_indonesia: 'Nasi / beras yang sudah dimasak',
    arti_inggris: 'Cooked rice',
    kelas_kata: 'n',
    tingkat: 'andap/kasar',
    contoh_bali: 'Ia seduk pesan, lantas medaar nasi campur.',
    contoh_terjemahan: 'Dia lapar sekali, lantas makan nasi campur. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Ajengan', 'Alus Singgih: Rayunan'],
    catatan: 'Kata benda nasi dalam percakapan sehari-hari. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k33',
    kata: 'Ngajeng',
    arti_indonesia: 'Makan (ragam sopan netral)',
    arti_inggris: 'To eat (polite)',
    kelas_kata: 'v',
    tingkat: 'alus madya',
    contoh_bali: 'Ngiring ngajeng dumun sareng-sareng.',
    contoh_terjemahan: 'Mari makan terlebih dahulu bersama-sama. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Singgih: Merayunan', 'Alus Sor: Neda', 'Andap: Medaar / Mangan'],
    catatan: 'Kata ajakan santun saat mengajak teman atau tuan rumah makan bersama. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k34',
    kata: 'Neda',
    arti_indonesia: 'Makan (merendahkan diri sendiri di hadapan orang terhormat)',
    arti_inggris: 'To eat (humble self-referential form)',
    kelas_kata: 'v',
    tingkat: 'alus sor',
    contoh_bali: 'Titiang sampun neda ring warung ajeng wau.',
    contoh_terjemahan: 'Hamba sudah makan di warung depan tadi. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Ngajeng', 'Alus Singgih: Merayunan', 'Andap: Mangan'],
    catatan: 'Menunjukkan kesantunan tinggi saat menyatakan bahwa diri sendiri telah makan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k35',
    kata: 'Toya',
    arti_indonesia: 'Air (air minum atau air jernih bersih)',
    arti_inggris: 'Water (polite)',
    kelas_kata: 'n',
    tingkat: 'alus madya',
    contoh_bali: 'Nunas toya ning asiki bli.',
    contoh_terjemahan: 'Minta air tawar jernih satu gelas ya bli. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Singgih: Tirta (air suci)', 'Andap: Yeh'],
    catatan: 'Bentuk halus dari kata yeh. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k36',
    kata: 'Yeh',
    arti_indonesia: 'Air',
    arti_inggris: 'Water (casual)',
    kelas_kata: 'n',
    tingkat: 'andap/kasar',
    contoh_bali: 'Yeh tukade melancaran enggal pesan.',
    contoh_terjemahan: 'Air sungai itu mengalir deras sekali. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Toya'],
    catatan: 'Kata sehari-hari untuk air, kerap menjadi toponimi seperti Yeh Sanih atau Yeh Gangga. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k37',
    kata: 'Jukut',
    arti_indonesia: 'Sayuran / masakan berkuah sayur',
    arti_inggris: 'Vegetable dish',
    kelas_kata: 'n',
    tingkat: 'andap/kasar',
    contoh_bali: 'Jukut ares puniki rasane jaen pesan.',
    contoh_terjemahan: 'Sayur ares ini rasanya sangat enak. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Jangan'],
    catatan: 'Istilah khas kuliner sayuran Bali seperti jukut urab, jukut undis, jukut ares. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k38',
    kata: 'Jaen',
    arti_indonesia: 'Enak / lezat',
    arti_inggris: 'Delicious / tasty',
    kelas_kata: 'adj',
    tingkat: 'andap/kasar',
    contoh_bali: 'Lawar kuwir puniki jaen sajan!',
    contoh_terjemahan: 'Lawar itik ini lezat sekali! [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Becik rasanipun', 'Alus Singgih: Kasukan'],
    catatan: 'Pujian spontan yang sangat menyenangkan bagi juru masak warung di Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k39',
    kata: 'Wareg',
    arti_indonesia: 'Kenyang (sudah puas makan)',
    arti_inggris: 'Full / satisfied after eating',
    kelas_kata: 'adj',
    tingkat: 'andap/kasar',
    contoh_bali: 'Titiang sampun wareg, matur suksma.',
    contoh_terjemahan: 'Hamba sudah kenyang, terima kasih banyak. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Watek'],
    catatan: 'Menyatakan rasa kenyang secara sopan setelah dijamu warga. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },

  // ARAH & NAVIGASI
  {
    id: 'k40',
    kata: 'Kaja',
    arti_indonesia: 'Arah hulu / menuju gunung (sakral / utama). Berbeda di tiap daerah: di Bali Selatan mengarah ke utara, di Buleleng mengarah ke selatan',
    arti_inggris: 'Mountainward / Sacred uphill direction',
    kelas_kata: 'adv',
    tingkat: 'umum',
    contoh_bali: 'Pura Besakih magenah ring genah sane pinih kaja.',
    contoh_terjemahan: 'Pura Besakih terletak di tempat yang paling mengarah ke gunung (kaja). [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Orientasi sumbu spiritual paling penting dalam kosmologi tata ruang Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k41',
    kata: 'Kelod',
    arti_indonesia: 'Arah hilir / menuju laut (profan / teben). Kebalikan dari kaja',
    arti_inggris: 'Seaward / Downhill direction',
    kelas_kata: 'adv',
    tingkat: 'umum',
    contoh_bali: 'Pasih Sanur magenah ring arah kelod saking jeroan.',
    contoh_terjemahan: 'Pantai Sanur berada di arah laut (kelod) dari perkampungan. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Pasangan sumbu Kaja-Kelod untuk tata letak desa dan pura di Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k42',
    kata: 'Kangin',
    arti_indonesia: 'Timur (arah matahari terbit / kesucian Dewa Iswara)',
    arti_inggris: 'East',
    kelas_kata: 'adv',
    tingkat: 'umum',
    contoh_bali: 'Karangasem punika magenah ring ujung kangin pulo Bali.',
    contoh_terjemahan: 'Karangasem terletak di ujung timur pulau Bali. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Sumbu matahari terbit yang disucikan dalam tradisi Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k43',
    kata: 'Kauh',
    arti_indonesia: 'Barat (arah matahari terbenam)',
    arti_inggris: 'West',
    kelas_kata: 'adv',
    tingkat: 'umum',
    contoh_bali: 'Jembrana magenah ring wawidangan kauh.',
    contoh_terjemahan: 'Jembrana berada di wilayah barat pulau Bali. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Arah barat dalam orientasi empat penjuru mata angin Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k44',
    kata: 'Ring dija',
    arti_indonesia: 'Di mana (ragam halus / santun)',
    arti_inggris: 'Where (polite)',
    kelas_kata: 'adv',
    tingkat: 'alus madya',
    contoh_bali: 'Ring dija genah pura desa punika magenah?',
    contoh_terjemahan: 'Di manakah lokasi pura desa tersebut berada? [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Dija'],
    catatan: 'Cara bertanya arah paling santun ketika menjelajahi desa wisata. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k45',
    kata: 'Meriki',
    arti_indonesia: 'Ke sini / kemari',
    arti_inggris: 'Hither / To this place',
    kelas_kata: 'adv',
    tingkat: 'alus madya',
    contoh_bali: 'Ngiring meriki melinggih dumun.',
    contoh_terjemahan: 'Mari ke sini duduk terlebih dahulu. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Mai'],
    catatan: 'Ajakan santun untuk mempersilakan orang mendekat atau singgah. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k46',
    kata: 'Merika',
    arti_indonesia: 'Ke sana / menuju ke tempat itu',
    arti_inggris: 'Thither / To that place',
    kelas_kata: 'adv',
    tingkat: 'alus madya',
    contoh_bali: 'Yening jagi ka danu, margine nuju merika.',
    contoh_terjemahan: 'Jika hendak ke danau, jalannya menuju ke sana. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Kema'],
    catatan: 'Petunjuk arah tujuan yang diucapkan secara sopan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k47',
    kata: 'Margi',
    arti_indonesia: 'Jalan / lintasan jalan raya atau jalan setapak',
    arti_inggris: 'Road / path (polite)',
    kelas_kata: 'n',
    tingkat: 'alus madya',
    contoh_bali: 'Margi puniki resik tur asri pisan.',
    contoh_terjemahan: 'Jalan ini bersih serta asri sekali. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Jalan'],
    catatan: 'Kata benda halus untuk menyebut jalan. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },

  // ETIKA PURA & BUDAYA
  {
    id: 'k48',
    kata: 'Pura',
    arti_indonesia: 'Tempat suci persembahyangan umat Hindu di Bali',
    arti_inggris: 'Balinese Hindu temple',
    kelas_kata: 'n',
    tingkat: 'umum',
    contoh_bali: 'Ritatkala ngranjing ka pura, iraga patut ngangge busana adat sane rapi.',
    contoh_terjemahan: 'Ketika memasuki pura, kita wajib memakai pakaian adat yang rapi. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Berasal dari bahasa Sanskerta pur yang berarti kota atau istana yang dibentengi kesucian. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k49',
    kata: 'Tirta',
    arti_indonesia: 'Air suci yang telah disucikan melalui doa mantram oleh pemangku atau pedanda',
    arti_inggris: 'Holy water used in Hindu blessings',
    kelas_kata: 'n',
    tingkat: 'alus singgih',
    contoh_bali: 'Pamangku ngicen tirta ring para pamedek sami.',
    contoh_terjemahan: 'Pemangku membagikan air suci kepada seluruh umat yang hadir. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Alus Madya: Toya ning', 'Andap: Yeh ning'],
    catatan: 'Dipercikkan di kepala, diminum 3 kali, dan dibasuhkan ke wajah untuk penyucian rohani. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k50',
    kata: 'Kamben',
    arti_indonesia: 'Kain bawahan tradisional (sarung khas Bali) yang wajib menutupi kaki hingga bawah lutut',
    arti_inggris: 'Traditional waist cloth / sarong required in temples',
    kelas_kata: 'n',
    tingkat: 'umum',
    contoh_bali: 'Wisatawan patut nganggen kamben rikala ngranjing ring wawidangan pura.',
    contoh_terjemahan: 'Wisatawan wajib mengenakan kamben saat masuk ke kawasan pura. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Pakaian wajib pria dan wanita saat memasuki area tempat suci di Bali. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k51',
    kata: 'Senteng',
    arti_indonesia: 'Selendang pengikat pinggang sebagai simbol mengendalikan emosi dan hawa nafsu saat beribadah',
    arti_inggris: 'Waist sash worn during temple visits symbolizing self-control',
    kelas_kata: 'n',
    tingkat: 'umum',
    contoh_bali: 'Ikat senteng ring bangkiang pinaka cihna nahan emosi.',
    contoh_terjemahan: 'Ikatkan selendang di pinggang sebagai tanda menahan emosi dan hawa nafsu. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Sinonim: Selendang'],
    catatan: 'Diikatkan di luar kamben tepat di batas pusar sebagai simbol batas antara keduniawian dan kesucian. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k52',
    kata: 'Canang',
    arti_indonesia: 'Sesaji anyaman daun kelapa muda dengan beras, bunga segar lima warna perlambang keharmonisan',
    arti_inggris: 'Daily floral offering woven from young coconut leaves',
    kelas_kata: 'n',
    tingkat: 'umum',
    contoh_bali: 'Canang sari punika aturang antuk rasa bhakti ring Hyang Widhi.',
    contoh_terjemahan: 'Canang sari tersebut dipersembahkan dengan rasa tulus ikhlas kepada Hyang Widhi. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Jangan pernah melangkahi atau menginjak canang yang baru dipersembahkan dan berdupa. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k53',
    kata: 'Pamangku',
    arti_indonesia: 'Pemimpin upacara suci atau penjaga persembahyangan di pura',
    arti_inggris: 'Temple priest / spiritual officiant',
    kelas_kata: 'n',
    tingkat: 'alus singgih',
    contoh_bali: 'Jero Mangku sampun nyiapang upakara sembahyang.',
    contoh_terjemahan: 'Jero Mangku telah menyiapkan perlengkapan persembahyangan. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Sapaan santun kepadanya adalah Jero Mangku. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k54',
    kata: 'Sukla',
    arti_indonesia: 'Suci, murni, bersih secara lahir dan batin, belum pernah tersentuh kotoran',
    arti_inggris: 'Pure / sacred / clean',
    kelas_kata: 'adj',
    tingkat: 'alus singgih',
    contoh_bali: 'Banten sane kaaturang patut sukla tur ning.',
    contoh_terjemahan: 'Sesajen yang dipersembahkan wajib murni dan suci bersih. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Juga digunakan untuk menyebut hidangan vegetarian suci bagi upacara pura. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k55',
    kata: 'Cuntaka',
    arti_indonesia: 'Keadaan tidak suci secara spiritual (berduka, melahirkan, menstruasi) sehingga berpantang masuk pura',
    arti_inggris: 'Period of ritual impurity barring temple entry',
    kelas_kata: 'n',
    tingkat: 'umum',
    contoh_bali: 'Anak sane sedek cuntaka nenten dados ngranjing ka jeroan pura.',
    contoh_terjemahan: 'Orang yang sedang dalam kondisi cuntaka tidak diperkenankan masuk ke area dalam pura. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Bentuk penghormatan terhadap kesucian area utama mandala pura. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k56',
    kata: 'Matur piuning',
    arti_indonesia: 'Berdoa memohon izin spiritual kepada penguasa tempat atau leluhur sebelum memulai kegiatan',
    arti_inggris: 'Prayer to ask spiritual permission before activities',
    kelas_kata: 'v',
    tingkat: 'alus singgih',
    contoh_bali: 'Ngiring matur piuning dumun sadurung ngawit trekking ka hutan.',
    contoh_terjemahan: 'Mari memohon izin secara doa terlebih dahulu sebelum mulai trekking ke hutan. [PERLU DIVERIFIKASI]',
    padanan_tingkat: null,
    catatan: 'Tradisi luhur untuk senantiasa menjaga keharmonisan alam sekala dan niskala. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  },
  {
    id: 'k57',
    kata: 'Tedun',
    arti_indonesia: 'Turun / hadir bersama-sama untuk gotong royong warga adat (ngayah) di pura',
    arti_inggris: 'Gathering together for communal temple service',
    kelas_kata: 'v',
    tingkat: 'alus singgih',
    contoh_bali: 'Krama desa sami tedun ngayah ring pura mangkin.',
    contoh_terjemahan: 'Warga desa semuanya hadir bergotong royong di pura sekarang. [PERLU DIVERIFIKASI]',
    padanan_tingkat: ['Andap: Tuun'],
    catatan: 'Gotong royong tulus ikhlas di pura ini disebut tradisi ngayah. [PERLU DIVERIFIKASI]',
    sumber: '[PERLU DIVERIFIKASI - Menunggu Acuan Pengguna]'
  }
];

// Map label kelas kata ke nama panjang
export const KELAS_KATA_MAP = {
  n: 'Nomina (Kata Benda)',
  v: 'Verba (Kata Kerja)',
  adj: 'Adjektiva (Kata Sifat)',
  adv: 'Adverbia (Kata Keterangan)',
  num: 'Numeralia (Kata Bilangan)',
  p: 'Partikel / Ungkapan',
  pron: 'Pronomina (Kata Ganti)'
};

// Map styling tingkat bahasa
export const TINGKAT_STYLE_MAP = {
  'alus singgih': {
    label: 'Alus Singgih (ASI)',
    short: 'ASI',
    badgeClass: 'bg-padi/25 text-amber-900 border-padi/60',
    dotClass: 'bg-padi',
    deskripsi: 'Bahasa halus untuk menghormati orang yang ditinggikan derajatnya (pemuka agama, raja, sesepuh).'
  },
  'alus sor': {
    label: 'Alus Sor (ASO)',
    short: 'ASO',
    badgeClass: 'bg-daun/20 text-daun-gelap border-daun/50',
    dotClass: 'bg-daun',
    deskripsi: 'Bahasa halus untuk merendahkan diri sendiri secara santun (andap asor).'
  },
  'alus madya': {
    label: 'Alus Madya (AMA)',
    short: 'AMA',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-600',
    deskripsi: 'Bahasa sopan netral yang paling aman dan sopan digunakan wisatawan kepada siapa saja.'
  },
  'andap/kasar': {
    label: 'Andap / Kasar (AK)',
    short: 'AK',
    badgeClass: 'bg-pasir/70 text-tanah-gelap border-pasir',
    dotClass: 'bg-tanah',
    deskripsi: 'Bahasa sehari-hari untuk kawan sebaya atau orang yang lebih muda.'
  },
  'umum': {
    label: 'Umum / Netral',
    short: 'Umum',
    badgeClass: 'bg-stone-200/70 text-stone-800 border-stone-300',
    dotClass: 'bg-stone-500',
    deskripsi: 'Kosakata budaya atau religi yang berlaku umum di segala tingkatan.'
  }
};

// Cache memori untuk hasil pencarian kamus (TTL: 10 menit)
const dictionaryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Mencari kata di kamus (Supabase dengan caching & fallback dataset lokal)
 */
export async function searchDictionary({ query = '', tingkat = 'semua', kelasKata = 'semua' } = {}) {
  const cleanQ = query.trim().toLowerCase();
  const cacheKey = `${cleanQ}__${tingkat}__${kelasKata}`;

  const cached = dictionaryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let results = null;

  try {
    // 1. Coba query ke Supabase
    let sbQuery = supabase.from('dictionary').select('*');

    if (tingkat && tingkat !== 'semua') {
      sbQuery = sbQuery.eq('tingkat', tingkat);
    }
    if (kelasKata && kelasKata !== 'semua') {
      sbQuery = sbQuery.eq('kelas_kata', kelasKata);
    }
    if (cleanQ) {
      sbQuery = sbQuery.or(`kata.ilike.%${cleanQ}%,arti_indonesia.ilike.%${cleanQ}%,contoh_bali.ilike.%${cleanQ}%`);
    }

    const { data, error } = await sbQuery.order('kata', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      results = data;
    }
  } catch (err) {
    // Fallback diam-diam ke data lokal
  }

  if (!results) {
    // 2. Filter dari dataset lokal
    results = FALLBACK_DICTIONARY.filter(item => {
      // Filter tingkat
      if (tingkat !== 'semua' && item.tingkat !== tingkat) {
        return false;
      }
      // Filter kelas kata
      if (kelasKata !== 'semua' && item.kelas_kata !== kelasKata) {
        return false;
      }
      // Filter text query
      if (cleanQ) {
        const matchKata = item.kata.toLowerCase().includes(cleanQ);
        const matchArti = item.arti_indonesia.toLowerCase().includes(cleanQ);
        const matchArtiEn = item.arti_inggris ? item.arti_inggris.toLowerCase().includes(cleanQ) : false;
        const matchContoh = item.contoh_bali ? item.contoh_bali.toLowerCase().includes(cleanQ) : false;
        const matchCatatan = item.catatan ? item.catatan.toLowerCase().includes(cleanQ) : false;
        return matchKata || matchArti || matchArtiEn || matchContoh || matchCatatan;
      }
      return true;
    });
  }

  // Simpan ke cache
  dictionaryCache.set(cacheKey, { data: results, timestamp: Date.now() });
  return results;
}

/**
 * Mengambil kata berdasarkan kata kunci spesifik atau ID (dengan caching)
 */
export async function getWordDetail(identifier) {
  if (!identifier) return null;

  const cacheKey = `word__${identifier.toLowerCase()}`;
  const cached = dictionaryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  let result = null;
  try {
    const { data, error } = await supabase
      .from('dictionary')
      .select('*')
      .or(`id.eq.${identifier},kata.ilike.${identifier}`)
      .maybeSingle();

    if (!error && data) {
      result = data;
    }
  } catch (err) {
    // Fallback lokal
  }

  if (!result) {
    result = FALLBACK_DICTIONARY.find(item =>
      item.id === identifier || item.kata.toLowerCase() === identifier.toLowerCase()
    ) || null;
  }

  if (result) {
    dictionaryCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

/**
 * Mengambil Kata Hari Ini (Kruna Rahina Mangkin) secara deterministik harian
 */
export function getWordOfTheDay() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const diff = now - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = dayOfYear % FALLBACK_DICTIONARY.length;
  return FALLBACK_DICTIONARY[index] || FALLBACK_DICTIONARY[0];
}

/**
 * Mengambil 1 kosakata yang relevan dengan destinasi (untuk kartu di Petualangan)
 */
export function getRelatedWordForPlace(place) {
  if (!place) return FALLBACK_DICTIONARY[0];

  const cat = (place.category || '').toLowerCase();
  const type = (place.type || '').toLowerCase();
  const desc = (place.description || '').toLowerCase();
  const name = (place.name || '').toLowerCase();

  // 1. Makanan / Kuliner
  if (type === 'kuliner' || cat.includes('kuliner') || desc.includes('kuliner') || desc.includes('makan')) {
    const kulinerWords = ['Ajengan', 'Rayunan', 'Ngajeng', 'Jaen', 'Wareg', 'Nasi'];
    const chosen = kulinerWords[Math.floor(Math.random() * kulinerWords.length)];
    return FALLBACK_DICTIONARY.find(w => w.kata.toLowerCase() === chosen.toLowerCase()) || FALLBACK_DICTIONARY[30];
  }

  // 2. Budaya, Pura, Sejarah, Desa Adat
  if (cat.includes('budaya') || cat.includes('sejarah') || name.includes('pura') || desc.includes('pura')) {
    const cultureWords = ['Pura', 'Tirta', 'Kamben', 'Senteng', 'Canang', 'Pamangku', 'Matur piuning', 'Durusang'];
    const chosen = cultureWords[Math.floor(Math.random() * cultureWords.length)];
    return FALLBACK_DICTIONARY.find(w => w.kata.toLowerCase() === chosen.toLowerCase()) || FALLBACK_DICTIONARY[47];
  }

  // 3. Alam, Air Terjun, Danau, Hutan
  if (cat.includes('alam') || desc.includes('air terjun') || desc.includes('danau') || desc.includes('hutan')) {
    const natureWords = ['Toya', 'Yeh', 'Margi', 'Kaja', 'Kelod', 'Kangin'];
    const chosen = natureWords[Math.floor(Math.random() * natureWords.length)];
    return FALLBACK_DICTIONARY.find(w => w.kata.toLowerCase() === chosen.toLowerCase()) || FALLBACK_DICTIONARY[34];
  }

  // Default: Sapaan atau terima kasih
  return FALLBACK_DICTIONARY.find(w => w.kata === 'Matur suksma') || FALLBACK_DICTIONARY[1];
}
