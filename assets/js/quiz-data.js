/* ============================================================================
   DATA KUIS KARSABIZ (Legalitas Business Diagnostic) — file INI yang diedit
   tim konten buat isi/ubah pertanyaan & aturan rekomendasi. Jangan sentuh
   quiz.js (itu "mesin"-nya, generic, baca struktur di bawah ini).

   Berbeda dari kuis versi lama (satu jawaban → satu hasil), kuis ini ala
   "diagnostic": user jawab 5-7 pertanyaan (beberapa di-skip otomatis kalau
   nggak relevan), lalu SEMUA jawabannya dicocokkan ke aturan legalitas di
   RECOMMENDATION_RULES buat hasilin daftar rekomendasi berprioritas (bukan
   cuma satu hasil). Hasil itu TIDAK langsung ditampilkan ke user — dikirim
   ke belakang layar (lihat quiz.js) sambil user cuma diminta isi nama/WA/
   email, terus dikasih tau "sedang dianalisis". Ini sesuai briefing: biar
   admin yang follow-up manual & lebih personal, bukan auto-generated.

   STRUKTUR PERTANYAAN
   --------------------
   Ada 2 jenis pertanyaan di QUIZ_DATA.questions:

   1) Pertanyaan biasa (single-select, nentuin pertanyaan selanjutnya)
        title, subtitle?, mascot?
        options: [{ label, desc?, value, next, kbli? }]
      `value` disimpen ke jawaban akhir (dipakai buat evaluasi rekomendasi),
      `next` nentuin id pertanyaan/step selanjutnya (bisa beda-beda per
      opsi — ini yang bikin pertanyaan lanjutan bisa nyesuaiin kategori,
      misal cuma usaha makanan yang lanjut ke pertanyaan detail produk).

   2) Pertanyaan grup (kumpulan sub-pertanyaan dalam satu layar, buat
      ngumpulin beberapa fakta sekaligus — termasuk yang boleh pilih lebih
      dari satu). `next` SELALU tetap/gak tergantung jawaban (grup cuma
      ngumpulin fakta, bukan nentuin cabang).
        type: "group"
        title, subtitle?, mascot?, next
        groups: [{
          key,           // dipakai nyimpen jawaban grup ini, mis. "kemasan"
          label,         // judul mini section
          hint?,         // teks kecil, mis. "Boleh pilih lebih dari satu"
          multi,         // true = checkbox (boleh banyak), false = radio (satu)
          required?,     // default true — false kalau boleh nol pilihan
          options: [{ label, value, kbli? }]
        }]

   `kbli` (opsional, di option manapun) — daftar kode 5-digit KBLI 2025
   yang match sama pilihan itu, hasil nge-mining langsung dari buku resmi
   "Klasifikasi Baku Lapangan Usaha Indonesia (KBLI) 2025" (BPS, Katalog
   1302017). Formatnya [{ code, title }]. Ini yang bikin klaim "dicocokkan
   ke database KBLI" di core proposition beneran valid — bukan cuma
   kategori umum. evaluateRecommendations() ngumpulin semua kbli yang
   ke-trigger jadi `kbliMatched` di hasil akhir, biar admin bisa liat kode
   persisnya pas follow-up manual. Kategori yang pertanyaannya masih umum
   (Jasa, Manufaktur) sengaja belum dikasih kode spesifik — golongannya
   kelewat luas buat dipetakan dari 1 pertanyaan kategori doang, perlu
   pertanyaan turunan lagi kayak yang udah ada di Makanan & Perdagangan.

   QUIZ_DATA.start = id pertanyaan pertama.
   Pertanyaan/grup terakhir nunjuk next: "lead-capture" — ini bukan id
   pertanyaan, tapi sinyal ke quiz.js buat pindah ke layar form nama/WA/
   email (lihat renderLeadCapture di quiz.js).

   RECOMMENDATION_RULES
   ---------------------
   Function evaluateRecommendations(answers) di bawah nge-cocokin SEMUA
   jawaban (key = id pertanyaan biasa ATAU key grup, value = value/array
   value yang dipilih) ke daftar legalitas yang relevan. Ini representasi
   manual dari "logic if-then" yang harusnya di-generate dari dokumen KBLI
   — kalau nanti ada content-generator project terpisah yang compile aturan
   dari dokumen KBLI resmi, hasilnya tinggal dipetakan ke bentuk array yang
   sama persis kayak yang di-return function ini, lalu function ini bisa
   diganti jadi baca dari JSON hasil compile-nya.
   ============================================================================ */

var QUIZ_DATA = {
  start: "q1",

  questions: {
    q1: {
      title: "Apa bentuk usahamu saat ini?",
      subtitle: "Pilih yang paling pas dengan kondisi bisnismu sekarang.",
      mascot: "penasaran",
      options: [
        {
          label: "Usaha Perorangan / UMKM Mandiri",
          desc: "Jalan sendiri, modal pribadi, belum pakai akta notaris. Contoh: online shop baju rumahan, katering harian.",
          value: "perorangan",
          next: "q2"
        },
        {
          label: "CV",
          desc: "Badan usaha patungan sederhana yang punya sekutu aktif & pasif. Contoh: kontraktor kecil, digital agensi dirintis 2-3 orang.",
          value: "cv",
          next: "q2"
        },
        {
          label: "PT Perorangan / Umum",
          desc: "Badan usaha resmi berbadan hukum. Contoh: startup teknologi, PT dagang yang punya pemegang saham.",
          value: "pt",
          next: "q2"
        },
        {
          label: "Yayasan / Koperasi",
          desc: "Untuk kegiatan sosial, keagamaan, atau simpan pinjam.",
          value: "yayasan",
          next: "q2"
        }
      ]
    },

    q2: {
      title: "Kira-kira, apa aktivitas utama atau produk yang kamu tawarkan?",
      subtitle: "Pilih kategori yang paling mendekati.",
      mascot: "penasaran",
      options: [
        {
          label: "Makanan, Minuman, & Kuliner",
          desc: "Produk konsumsi kemasan, warung makan, restoran, café, katering, atau usaha kuliner lainnya.",
          value: "makanan",
          next: "q2-makanan-mode"
        },
        {
          label: "Perdagangan Barang Umum",
          desc: "Fashion, elektronik, kosmetik, kelontong — jual beli barang jadi tanpa memproduksi sendiri.",
          value: "dagang",
          next: "q4-dagang"
        },
        {
          label: "Jasa / Layanan Profesional",
          desc: "Konsultasi, agensi kreatif, desain, IT, cuci pakaian/laundry, salon.",
          value: "jasa",
          next: "q3-jasa"
        },
        {
          label: "Manufaktur / Produksi Pabrikan",
          desc: "Membuat barang dari bahan mentah jadi barang jadi dalam skala besar.",
          value: "manufaktur",
          next: "q3-manufaktur"
        },
        {
          label: "Akomodasi & Pariwisata",
          desc: "Hotel, vila, kos-kosan, kafe, restoran, tempat wisata.",
          value: "akomodasi",
          next: "q5",
          kbli: [
            { code: "55101-55106", title: "Aktivitas Hotel Bintang 1-5 / Nonbintang" },
            { code: "55201-55203", title: "Akomodasi Jangka Pendek Lainnya (Vila, Homestay, Hostel)" },
            { code: "56101", title: "Aktivitas Penyediaan Makanan di Bangunan Tetap (Restoran/Kafe)" }
          ]
        }
      ]
    },

    // Cabang makanan: pisahkan antara produk kemasan dan sajian langsung (restoran/katering)
    "q2-makanan-mode": {
      title: "Bagaimana kamu menjual produk makanan/minumanmu?",
      subtitle: "Ini menentukan jalur legalitas yang berbeda antara produksi dan penjualan langsung.",
      mascot: "penasaran",
      options: [
        {
          label: "Produk Kemasan / Olahan yang Dijual (Makanan Jadi Kemasan)",
          desc: "Diproduksi sendiri lalu dijual lewat toko, online shop, pasar, atau dititipkan — tidak langsung disajikan ke meja tamu.",
          value: "produk-kemasan",
          next: "q3-makanan"
        },
        {
          label: "Restoran, Warung Makan, atau Rumah Makan",
          desc: "Menyajikan makanan/minuman langsung ke tamu yang makan di tempat (dine-in) atau dibawa pulang (take-away).",
          value: "restoran",
          next: "q3-resto",
          kbli: [
            { code: "56101", title: "Restoran / Rumah Makan dengan Penyajian di Tempat" },
            { code: "56102", title: "Aktivitas Penyediaan Makanan di Jalan atau Kios" }
          ]
        },
        {
          label: "Kafe / Coffee Shop / Warung Kopi",
          desc: "Fokus menjual minuman (kopi, teh, jus) dan camilan ringan, dengan atau tanpa tempat duduk.",
          value: "kafe",
          next: "q3-resto",
          kbli: [
            { code: "56301", title: "Aktivitas Bar dan Kedai Minuman" },
            { code: "56101", title: "Restoran / Kafe dengan Penyajian di Tempat" }
          ]
        },
        {
          label: "Katering / Jasa Boga / Penyedia Makanan untuk Event",
          desc: "Memasak dan mengirim makanan untuk acara, perusahaan, atau langganan harian (kantin, meal prep).",
          value: "katering",
          next: "q3-resto",
          kbli: [
            { code: "56210", title: "Aktivitas Katering untuk Suatu Event/Perhelatan" },
            { code: "56290", title: "Aktivitas Penyediaan Makanan Lainnya" }
          ]
        },
        {
          label: "Cloud Kitchen / Dapur Hantu (tanpa dine-in)",
          desc: "Memasak untuk pesanan online (GoFood, GrabFood, ShopeeFood) tanpa area makan bagi tamu.",
          value: "cloud-kitchen",
          next: "q3-resto",
          kbli: [
            { code: "56101", title: "Aktivitas Penyediaan Makanan (Restoran / Cloud Kitchen)" },
            { code: "56102", title: "Aktivitas Penyediaan Makanan di Jalan atau Kios" }
          ]
        }
      ]
    },

    // Pertanyaan tambahan untuk F&B / sajian langsung
    "q3-resto": {
      type: "group",
      title: "Detail usaha kuliner kamu:",
      subtitle: "Informasi ini menentukan izin operasional tambahan yang mungkin dibutuhkan.",
      mascot: "menjelaskan2",
      next: "q5",
      groups: [
        {
          key: "resto-skala",
          label: "Berapa kapasitas tempat duduk / skala operasional?",
          multi: false,
          options: [
            { label: "Warung/gerobak kecil (< 10 kursi atau tanpa tempat duduk)", value: "micro" },
            { label: "Sedang (10–50 kursi)", value: "medium" },
            { label: "Besar / restoran dengan lebih dari 50 kursi", value: "large" }
          ]
        },
        {
          key: "resto-produk",
          label: "Apakah usahamu menjual/mengolah hal-hal berikut?",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          required: false,
          options: [
            {
              label: "Minuman beralkohol (bir, wine, cocktail, dll.)",
              value: "alkohol",
              kbli: [{ code: "56301", title: "Aktivitas Bar dan Kedai Minuman Beralkohol" }]
            },
            {
              label: "Produk daging olahan sendiri (sosis, dendeng, nugget buatan sendiri)",
              value: "olah-daging",
              kbli: [{ code: "10120", title: "Pengolahan dan Pengawetan Daging dan Produk Daging" }]
            },
            {
              label: "Kue / roti / pastry yang diproduksi sendiri untuk dijual eceran",
              value: "bakery",
              kbli: [{ code: "10710", title: "Industri Produk Bakeri" }]
            }
          ]
        }
      ]
    },

    // Khusus kategori Makanan & Minuman Kemasan — nentuin butuh PIRT / BPOM /
    // izin khusus atau enggak, berdasarkan cara kemas & bahan baku.
    "q3-makanan": {
      type: "group",
      title: "Bagaimana detail produk makanan/minumanmu?",
      subtitle: "Ini menentukan apakah kamu butuh PIRT, izin edar BPOM, atau izin edar khusus.",
      mascot: "menjelaskan3",
      next: "q5",
      groups: [
        {
          key: "kemasan",
          label: "Bagaimana cara pengemasannya?",
          multi: false,
          options: [
            { label: "Dikemas dalam wadah tertutup dan dijual langsung / dititipkan (skala rumahan)", value: "rumahan" },
            { label: "Diproduksi massal dengan mesin pabrik / dikemas secara industri kedap udara (vacuum, kaleng, botol pabrikan)", value: "industri" }
          ]
        },
        {
          key: "bahan",
          label: "Apa bahan baku atau kandungan utamanya?",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Mengandung daging hewan (sapi, ayam, kambing, ikan, dll.) atau produk olahan daging", value: "daging",
              kbli: [
                { code: "10111-10119", title: "Kegiatan Rumah Potong Hewan" },
                { code: "10120", title: "Pengolahan dan Pengawetan Daging dan Produk Daging" }
              ]
            },
            {
              label: "Mengandung bahan susu segar / keju / olahan susu mentah", value: "susu",
              kbli: [{ code: "10501", title: "Industri Susu Segar dan Krim" }]
            },
            {
              label: "Produk kering / kue kering / keripik / sambal tanpa daging (100% nabati/rempah)", value: "kering",
              kbli: [
                { code: "10710", title: "Industri Produk Bakeri" },
                { code: "10794", title: "Industri Kerupuk, Keripik, Peyek, dan Sejenisnya" },
                { code: "10779", title: "Industri Bumbu Masakan Lainnya" }
              ]
            },
            {
              label: "Minuman beralkohol atau mengandung bahan pengawet kimia tertentu", value: "alkohol",
              kbli: [
                { code: "11020", title: "Industri Minuman Beralkohol Hasil Fermentasi Anggur" },
                { code: "11030", title: "Industri Minuman Beralkohol Hasil Fermentasi Malt" }
              ]
            }
          ]
        }
      ]
    },

    // Khusus kategori Perdagangan Barang Umum — cek kalau produknya masuk
    // kategori kecantikan/kesehatan/fashion yang butuh izin edar tambahan.
    "q4-dagang": {
      type: "group",
      title: "Apakah produkmu melibatkan hal berikut?",
      subtitle: "Beberapa jenis produk butuh izin edar tambahan di luar NIB standar.",
      mascot: "menjelaskan2",
      next: "q5",
      groups: [
        {
          key: "produkKhusus",
          label: "Pilih yang sesuai",
          hint: "Boleh pilih lebih dari satu, atau lewati kalau tidak ada yang sesuai",
          multi: true,
          required: false,
          options: [
            {
              label: "Kosmetik, skincare, atau produk perawatan tubuh", value: "kosmetik",
              kbli: [
                { code: "20232", title: "Industri Kosmetik untuk Manusia, Cairan Lensa Kontak" },
                { code: "47724", title: "Perdagangan Eceran Kosmetik untuk Manusia" }
              ]
            },
            {
              label: "Obat-obatan, suplemen kesehatan, atau alat kesehatan", value: "obat",
              kbli: [{ code: "47721", title: "Perdagangan Eceran Sediaan Farmasi untuk Manusia di Apotek" }]
            },
            {
              label: "Pakaian jadi, tekstil, atau aksesori fesyen", value: "fashion",
              kbli: [{ code: "47711", title: "Perdagangan Eceran Pakaian" }]
            }
          ]
        }
      ]
    },

    // Khusus kategori Jasa — dibagi ke sub-kategori besar dulu baru di-drill
    // lebih dalam, supaya KBLI yang dihasilkan benar-benar spesifik.
    "q3-jasa": {
      title: "Jasa spesifik apa yang kamu tawarkan?",
      subtitle: "Pilih kategori besar yang paling mendekati bidang usahamu.",
      mascot: "menjelaskan2",
      options: [
        {
          label: "Desain, Kreatif, atau Periklanan",
          desc: "Desain grafis, desain interior, branding, agensi iklan, fotografer profesional.",
          value: "kreatif",
          next: "q3-jasa-kreatif"
        },
        {
          label: "Produksi Konten, Film, atau Media",
          desc: "Studio produksi film/video, podcast, content creator, affiliate marketing, influencer.",
          value: "produksi",
          next: "q3-jasa-produksi"
        },
        {
          label: "IT, Software, atau Teknologi Digital",
          desc: "Pengembangan aplikasi/web, SaaS, konsultasi IT, cybersecurity.",
          value: "it",
          next: "q3-jasa-it"
        },
        {
          label: "Konsultan Bisnis, Hukum, atau Keuangan",
          desc: "Konsultan manajemen, akuntan, penasihat hukum, konsultan pajak, HR.",
          value: "konsultan",
          next: "q3-jasa-konsultan"
        },
        {
          label: "Pendidikan, Pelatihan, atau Kursus",
          desc: "Bimbel, lembaga kursus, pelatihan vokasional, coaching, e-learning.",
          value: "pendidikan",
          next: "q3-jasa-pendidikan"
        },
        {
          label: "Jasa Personal (Kecantikan, Kebugaran, Laundry)",
          desc: "Salon, spa, barbershop, gym, personal trainer, laundry.",
          value: "personal",
          next: "q3-jasa-personal"
        },
        {
          label: "Jasa Profesional Lainnya",
          desc: "Kurir, cleaning service, jasa reparasi, event organizer, atau jasa lain yang belum ada di atas.",
          value: "lainnya",
          next: "q5",
          kbli: [
            { code: "82990", title: "Aktivitas Jasa Penunjang Usaha Lainnya YTDL" },
            { code: "81290", title: "Aktivitas Kebersihan Gedung dan Bangunan Industri Lainnya" }
          ]
        }
      ]
    },

    // Sub: Desain, Kreatif, Periklanan
    "q3-jasa-kreatif": {
      type: "group",
      title: "Bidang kreatif apa yang kamu tekuni?",
      subtitle: "Setiap sub-bidang punya kode KBLI dan ketentuan izin yang berbeda.",
      mascot: "menjelaskan2",
      next: "q5",
      groups: [
        {
          key: "jasa-kreatif-bidang",
          label: "Pilih yang paling sesuai",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Desain Grafis / Komunikasi Visual (logo, brosur, poster)",
              value: "desain-grafis",
              kbli: [{ code: "74192", title: "Aktivitas Desain Grafis/Komunikasi Visual" }]
            },
            {
              label: "Desain Interior / Arsitektur Ruang",
              value: "desain-interior",
              kbli: [
                { code: "74121", title: "Aktivitas Desain Interior" },
                { code: "71101", title: "Aktivitas Arsitektur" }
              ]
            },
            {
              label: "Desain Produk / Industri (packaging, produk fisik)",
              value: "desain-produk",
              kbli: [{ code: "74191", title: "Aktivitas Desain Produk" }]
            },
            {
              label: "Agensi Periklanan / Media Buying / Social Media Ads",
              value: "iklan",
              kbli: [
                { code: "73100", title: "Aktivitas Periklanan" },
                { code: "73201", title: "Riset Pasar" }
              ]
            },
            {
              label: "Fotografi Komersial / Wedding Photography",
              value: "fotografi",
              kbli: [{ code: "74201", title: "Aktivitas Fotografi" }]
            },
            {
              label: "Branding Strategis / Konsultan Identitas Merek",
              value: "branding",
              kbli: [
                { code: "74192", title: "Aktivitas Desain Grafis/Komunikasi Visual" },
                { code: "70202", title: "Aktivitas Konsultansi Manajemen dan Bisnis Industri" }
              ]
            }
          ]
        }
      ]
    },

    // Sub: Produksi Konten, Film, Media
    "q3-jasa-produksi": {
      type: "group",
      title: "Bidang produksi konten apa yang kamu jalankan?",
      subtitle: "Termasuk apakah ada penerimaan royalti, lisensi konten, atau model afiliasi.",
      mascot: "menjelaskan3",
      next: "q5",
      groups: [
        {
          key: "jasa-produksi-bidang",
          label: "Pilih yang sesuai",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Studio Produksi Film / Video Komersial / Dokumenter",
              value: "film",
              kbli: [
                { code: "59111", title: "Aktivitas Produksi Film Bioskop" },
                { code: "59112", title: "Aktivitas Produksi Film Bukan Bioskop (Video)" }
              ]
            },
            {
              label: "Produksi Iklan Video / TVC / Konten Branded",
              value: "iklan-video",
              kbli: [
                { code: "59131", title: "Aktivitas Distribusi Film Bioskop" },
                { code: "73100", title: "Aktivitas Periklanan" }
              ]
            },
            {
              label: "Podcast / Produksi Audio / Rekaman Suara",
              value: "audio",
              kbli: [{ code: "59201", title: "Aktivitas Perekaman Suara" }]
            },
            {
              label: "Content Creator / YouTuber / Streamer (penghasilan dari ads/brand deal)",
              value: "creator",
              kbli: [
                { code: "59112", title: "Aktivitas Produksi Film Bukan Bioskop (Video)" },
                { code: "90002", title: "Aktivitas Hiburan dan Seni Pertunjukan Lainnya" }
              ]
            },
            {
              label: "Affiliate Marketing / Endorsement / Influencer Marketing",
              value: "afiliasi",
              kbli: [
                { code: "73100", title: "Aktivitas Periklanan" },
                { code: "73201", title: "Riset Pasar" }
              ]
            },
            {
              label: "Penerbitan Digital / Platform Berita / Blog Profesional",
              value: "penerbitan",
              kbli: [
                { code: "58130", title: "Penerbitan Surat Kabar, Jurnal, dan Buletin" },
                { code: "63121", title: "Portal Web dan/atau Platform Digital" }
              ]
            },
            {
              label: "Agensi Manajemen Artis / Talent Management",
              value: "talent",
              kbli: [{ code: "90003", title: "Kegiatan Agen Artis, Agen Bakat, dan Manajemen Artis" }]
            }
          ]
        },
        {
          key: "jasa-produksi-model",
          label: "Model bisnis / sumber pendapatan utama kamu?",
          multi: false,
          options: [
            { label: "Jasa (bayar per proyek / retainer)", value: "jasa-proyek" },
            { label: "Royalti / Lisensi konten", value: "royalti" },
            { label: "Komisi afiliasi / endorsement", value: "komisi" },
            { label: "Platform / Iklan (AdSense, YouTube monetize)", value: "platform-ads" }
          ]
        }
      ]
    },

    // Sub: IT, Software, Teknologi Digital
    "q3-jasa-it": {
      type: "group",
      title: "Bidang IT / teknologi digital apa yang kamu kerjakan?",
      subtitle: "Pembedaan antara pengembang, SaaS, dan konsultan penting untuk KBLI yang tepat.",
      mascot: "menjelaskan2",
      next: "q5",
      groups: [
        {
          key: "jasa-it-bidang",
          label: "Pilih yang paling sesuai",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Pengembangan Aplikasi Mobile (Android/iOS)",
              value: "mobile-dev",
              kbli: [{ code: "62011", title: "Aktivitas Pengembangan Aplikasi Perdagangan melalui Internet (Aplikasi Mobile)" }]
            },
            {
              label: "Pengembangan Website / Web App / Frontend-Backend",
              value: "web-dev",
              kbli: [{ code: "62199", title: "Aktivitas Pemrograman Komputer Lainnya YTDL" }]
            },
            {
              label: "SaaS / Platform Digital / Marketplace",
              value: "saas",
              kbli: [
                { code: "63121", title: "Portal Web dan/atau Platform Digital" },
                { code: "62011", title: "Aktivitas Pengembangan Aplikasi Perdagangan melalui Internet" }
              ]
            },
            {
              label: "Konsultasi IT / System Integrator / ERP",
              value: "konsultan-it",
              kbli: [{ code: "62209", title: "Aktivitas Konsultansi Komputer dan Manajemen Fasilitas Komputer Lainnya" }]
            },
            {
              label: "Keamanan Siber (Cybersecurity) / Penetration Testing",
              value: "cybersec",
              kbli: [{ code: "62209", title: "Aktivitas Konsultansi Komputer dan Manajemen Fasilitas Komputer Lainnya" }]
            },
            {
              label: "Data Analytics / AI / Machine Learning Services",
              value: "data-ai",
              kbli: [
                { code: "62199", title: "Aktivitas Pemrograman Komputer Lainnya YTDL" },
                { code: "70202", title: "Aktivitas Konsultansi Manajemen dan Bisnis Industri" }
              ]
            },
            {
              label: "Penyedia Hosting / Cloud Services / Data Center",
              value: "hosting",
              kbli: [{ code: "63111", title: "Aktivitas Pengolahan Data" }]
            }
          ]
        }
      ]
    },

    // Sub: Konsultan Bisnis, Hukum, Keuangan
    "q3-jasa-konsultan": {
      type: "group",
      title: "Bidang konsultansi profesional apa yang kamu tawarkan?",
      subtitle: "Beberapa bidang memerlukan izin praktik atau keanggotaan profesi khusus.",
      mascot: "menjelaskan3",
      next: "q5",
      groups: [
        {
          key: "jasa-konsultan-bidang",
          label: "Pilih yang sesuai",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Konsultan Manajemen / Strategi Bisnis",
              value: "manajemen",
              kbli: [{ code: "70202", title: "Aktivitas Konsultansi Manajemen dan Bisnis Industri" }]
            },
            {
              label: "Akuntan Publik / Auditor / Jasa Pembukuan",
              value: "akuntan",
              kbli: [
                { code: "69200", title: "Aktivitas Akuntansi, Pembukuan, dan Audit" },
                { code: "69201", title: "Aktivitas Akuntan Publik" }
              ]
            },
            {
              label: "Konsultan Pajak / Tax Advisor",
              value: "pajak",
              kbli: [{ code: "69202", title: "Aktivitas Konsultansi Pajak" }]
            },
            {
              label: "Jasa Hukum / Advokat / Notaris",
              value: "hukum",
              kbli: [
                { code: "69100", title: "Aktivitas Hukum" },
                { code: "69101", title: "Aktivitas Advokat" }
              ]
            },
            {
              label: "Konsultan SDM / HR / Rekrutmen",
              value: "sdm",
              kbli: [{ code: "78109", title: "Aktivitas Penempatan Tenaga Kerja Swasta Lainnya" }]
            },
            {
              label: "Konsultan Pemasaran / Digital Marketing",
              value: "marketing",
              kbli: [
                { code: "70202", title: "Aktivitas Konsultansi Manajemen dan Bisnis Industri" },
                { code: "73100", title: "Aktivitas Periklanan" }
              ]
            },
            {
              label: "Konsultan Keuangan / Financial Planner",
              value: "keuangan",
              kbli: [{ code: "66191", title: "Aktivitas Penasehat Investasi" }]
            }
          ]
        }
      ]
    },

    // Sub: Pendidikan, Pelatihan, Kursus
    "q3-jasa-pendidikan": {
      type: "group",
      title: "Jenis pendidikan atau pelatihan apa yang kamu selenggarakan?",
      subtitle: "Lembaga kursus dan pelatihan memiliki kewajiban izin dari Dinas Pendidikan.",
      mascot: "menjelaskan2",
      next: "q5",
      groups: [
        {
          key: "jasa-pendidikan-jenis",
          label: "Pilih yang sesuai",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Bimbingan Belajar (Bimbel) / Les Privat Akademik",
              value: "bimbel",
              kbli: [{ code: "85499", title: "Pendidikan Lainnya YTDL" }]
            },
            {
              label: "Lembaga Kursus & Pelatihan (LKP) Vokasional (komputer, menjahit, memasak)",
              value: "lkp",
              kbli: [{ code: "85499", title: "Pendidikan Lainnya YTDL" }]
            },
            {
              label: "Pelatihan Korporat / Corporate Training / Workshop B2B",
              value: "corporate-training",
              kbli: [
                { code: "85499", title: "Pendidikan Lainnya YTDL" },
                { code: "70202", title: "Aktivitas Konsultansi Manajemen dan Bisnis Industri" }
              ]
            },
            {
              label: "E-learning / Kursus Online / Platform Pendidikan Digital",
              value: "elearning",
              kbli: [
                { code: "85499", title: "Pendidikan Lainnya YTDL" },
                { code: "63121", title: "Portal Web dan/atau Platform Digital" }
              ]
            },
            {
              label: "Sekolah Formal (SD, SMP, SMA, Universitas)",
              value: "formal",
              kbli: [
                { code: "85101", title: "Pendidikan Dasar" },
                { code: "85201", title: "Pendidikan Menengah Umum" },
                { code: "85301", title: "Pendidikan Tinggi" }
              ]
            }
          ]
        }
      ]
    },

    // Sub: Jasa Personal (Kecantikan, Kebugaran, Laundry)
    "q3-jasa-personal": {
      type: "group",
      title: "Jenis jasa personal apa yang kamu tawarkan?",
      subtitle: "Beberapa jenis jasa ini memerlukan sertifikasi tambahan dari Dinkes.",
      mascot: "menjelaskan2",
      next: "q5",
      groups: [
        {
          key: "jasa-personal-bidang",
          label: "Pilih yang sesuai",
          hint: "Boleh pilih lebih dari satu",
          multi: true,
          options: [
            {
              label: "Salon Rambut / Barbershop",
              value: "salon",
              kbli: [{ code: "96211", title: "Aktivitas Potong Rambut" }]
            },
            {
              label: "Perawatan Kecantikan / Skin Care / Make-up Artistik",
              value: "kecantikan",
              kbli: [{ code: "96220", title: "Aktivitas Perawatan Kecantikan" }]
            },
            {
              label: "Spa / Pijat Tradisional / Terapi Relaksasi",
              value: "spa",
              kbli: [{ code: "96222", title: "Aktivitas Spa" }]
            },
            {
              label: "Gym / Pusat Kebugaran / Fitness Center",
              value: "gym",
              kbli: [{ code: "93131", title: "Aktivitas Pusat Kebugaran" }]
            },
            {
              label: "Personal Trainer / Instruktur Yoga / Pilates",
              value: "trainer",
              kbli: [{ code: "85510", title: "Pendidikan Olah Raga dan Rekreasi" }]
            },
            {
              label: "Laundry / Dry Cleaning / Binatu",
              value: "laundry",
              kbli: [{ code: "96100", title: "Aktivitas Pencucian dan Pembersihan Produk Tekstil dan Bulu" }]
            }
          ]
        }
      ]
    },


    // Khusus kategori Manufaktur — sama alasannya kayak Jasa, golongan
    // industri terlalu luas buat 1 pertanyaan kategori doang.
    "q3-manufaktur": {
      title: "Produk apa yang kamu produksi?",
      subtitle: "Biar rekomendasi KBLI & standar usahanya lebih tepat sasaran.",
      mascot: "menjelaskan3",
      options: [
        {
          label: "Tekstil, Garmen, atau Pakaian Jadi",
          value: "tekstil",
          next: "q5",
          kbli: [{ code: "14111", title: "Industri Pakaian Jadi (Konfeksi) dari Tekstil" }]
        },
        {
          label: "Furnitur (Kayu, Rotan, Logam, atau Plastik)",
          value: "furnitur",
          next: "q5",
          kbli: [
            { code: "31011", title: "Industri Furnitur dari Kayu" },
            { code: "31012", title: "Industri Furnitur dari Rotan dan Bambu" },
            { code: "31021", title: "Industri Furnitur dari Plastik" },
            { code: "31022", title: "Industri Furnitur dari Logam" }
          ]
        },
        {
          label: "Produk Plastik atau Kemasan",
          value: "plastik",
          next: "q5",
          kbli: [{ code: "22202", title: "Industri Barang dari Plastik dan Bioplastik untuk Kemasan" }]
        },
        {
          label: "Produk atau Fabrikasi Logam",
          value: "logam",
          next: "q5",
          kbli: [
            { code: "25111", title: "Industri Produk Logam Struktural Bukan Aluminium untuk Konstruksi Ringan" },
            { code: "25112", title: "Industri Produk Logam Struktural Aluminium untuk Konstruksi Ringan" }
          ]
        },
        {
          label: "Elektronik atau Komponen Elektronik",
          value: "elektronik",
          next: "q5",
          kbli: [{ code: "26199", title: "Industri Komponen dan Papan Elektronik Lainnya YTDL" }]
        },
        {
          label: "Produk Manufaktur Lainnya",
          value: "lainnya",
          next: "q5"
        }
      ]
    },

    q5: {
      title: "Di mana kamu menjalankan proses produksi atau operasional utama bisnismu?",
      mascot: "menjelaskan1",
      options: [
        { label: "Di rumah / Dapur rumah (SOHO)", desc: "Kamar, garasi, atau dapur pribadi.", value: "rumah", next: "q6" },
        { label: "Tempat komersial terpisah", desc: "Ruko, kios pasar, rukan, atau kantor sewa.", value: "komersial", next: "q6" },
        { label: "Pabrik / Gudang industri khusus", desc: "Tempat produksi skala besar yang berdiri sendiri.", value: "pabrik", next: "q6" },
        { label: "Secara digital murni", desc: "Kantor virtual, tidak ada stok fisik di tempat.", value: "digital", next: "q6" }
      ]
    },

    q6: {
      title: "Bagaimana skala jangkauan pemasaran dan distribusi produk/jasamu?",
      mascot: "menjelaskan1",
      options: [
        { label: "Lokal saja", desc: "Hanya dijual di sekitar lingkungan rumah / kota lokal (skala kecil/eceran).", value: "lokal", next: "q7" },
        { label: "Seluruh Indonesia", desc: "Dikirim ke seluruh Indonesia lewat kurir / e-commerce (Shopee, Tokopedia, TikTok Shop).", value: "nasional", next: "q7" },
        { label: "Ekspor / Impor", desc: "Diekspor ke luar negeri atau diimpor dari luar negeri.", value: "ekspor-impor", next: "q7" }
      ]
    },

    q7: {
      title: "Apakah bisnismu berpotensi berdampak pada lingkungan sekitar?",
      mascot: "kaget",
      options: [
        { label: "Ya, ada dampak", desc: "Menghasilkan limbah cair berbahaya, limbah pabrik, asap, atau polusi suara.", value: "berdampak", next: "lead-capture" },
        { label: "Tidak", desc: "Kegiatan usaha biasa yang tidak menghasilkan limbah berat (kantor, toko retail, jasa).", value: "tidak-berdampak", next: "lead-capture" }
      ]
    }
  }
};

/* ------------------------------------------------------------------------
   Aturan rekomendasi — cocokin jawaban ke daftar legalitas berprioritas.
   `answers` bentuknya: { q1: "perorangan", q2: "makanan",
     kemasan: "rumahan", bahan: ["kering"], q5: "rumah", q6: "lokal",
     q7: "tidak-berdampak", ... } — key pertanyaan biasa pakai id
   pertanyaan, key grup pakai `key` yang didefinisikan di groups di atas.
   ------------------------------------------------------------------------ */
function evaluateRecommendations(answers) {
  var items = [];
  var bahan = answers.bahan || [];
  var produkKhusus = answers.produkKhusus || [];

  // NIB selalu wajib — legalitas dasar buat kegiatan usaha apapun lewat OSS RBA.
  items.push({
    id: "nib",
    label: "NIB (Nomor Induk Berusaha)",
    status: "wajib",
    statusLabel: "Perlu dimiliki",
    description: "NIB merupakan bagian dari legalitas dasar kegiatan usaha kamu, jadi identitas resmi di sistem OSS.",
    cta: "Urus NIB"
  });

  if (answers.q2 === "makanan") {
    var modeMakanan = answers["q2-makanan-mode"] || "produk-kemasan";
    var restoProduk = answers["resto-produk"] || [];
    var restoSkala = answers["resto-skala"] || "";

    // Cabang: Restoran / Warung / Katering / Cloud Kitchen
    if (modeMakanan === "restoran" || modeMakanan === "kafe" || modeMakanan === "katering" || modeMakanan === "cloud-kitchen") {
      items.push({
        id: "tdup-fnb",
        label: "TDUP (Tanda Daftar Usaha Pariwisata) — Sub-bidang Restoran/Kafe/Katering",
        status: "wajib",
        statusLabel: "Perlu dimiliki",
        description: "Usaha penyediaan makanan/minuman (restoran, kafe, katering, cloud kitchen) wajib terdaftar sebagai Usaha Pariwisata sub-bidang Jasa Makanan dan Minuman.",
        cta: "Urus TDUP"
      });
      items.push({
        id: "higiene-sanitasi-pangan",
        label: "Sertifikat Higiene Sanitasi Pangan",
        status: "wajib",
        statusLabel: "Perlu dimiliki",
        description: "Setiap usaha penyajian makanan (restoran, warung, kafe, katering) wajib memiliki Sertifikat Higiene Sanitasi Pangan dari Dinas Kesehatan setempat.",
        cta: "Konsultasikan"
      });
      if (restoSkala === "large") {
        items.push({
          id: "laik-hygiene-besar",
          label: "Laik Higiene Sanitasi Skala Besar (Golongan A)",
          status: "kondisional",
          statusLabel: "Perlu diperiksa",
          description: "Restoran kapasitas besar (>50 kursi) umumnya masuk Golongan A dengan persyaratan higiene sanitasi yang lebih ketat dari Dinas Kesehatan.",
          cta: "Konsultasikan"
        });
      }
      if (restoProduk.indexOf("alkohol") !== -1) {
        items.push({
          id: "izin-penjualan-alkohol-resto",
          label: "Izin Penjualan Minuman Beralkohol di Tempat (On-Trade)",
          status: "wajib",
          statusLabel: "Wajib diperiksa",
          description: "Jika menjual minuman beralkohol (bir, wine, dll.) di tempat makan/minum, butuh Izin Usaha Perdagangan Minuman Beralkohol (SIUP-MB) sesuai aturan Permendag.",
          cta: "Konsultasikan"
        });
      }
      if (modeMakanan === "katering") {
        items.push({
          id: "sertifikasi-halal-katering",
          label: "Sertifikat Halal (Dianjurkan untuk Katering)",
          status: "disarankan",
          statusLabel: "Disarankan",
          description: "Usaha katering untuk instansi pemerintah/korporat umumnya mensyaratkan sertifikat halal, terutama jika klien mayoritas Muslim.",
          cta: "Konsultasikan"
        });
      }

    // Cabang: Produk Kemasan
    } else {
      if (bahan.indexOf("alkohol") !== -1) {
        items.push({
          id: "izin-alkohol",
          label: "Izin Edar Minuman Berpengawet/Beralkohol",
          status: "wajib",
          statusLabel: "Wajib diperiksa",
          description: "Minuman beralkohol atau berpengawet kimia tertentu masuk kategori risiko tinggi dan butuh izin edar khusus, bukan sekadar PIRT.",
          cta: "Konsultasikan"
        });
      } else if (answers.kemasan === "industri" || bahan.indexOf("daging") !== -1 || bahan.indexOf("susu") !== -1) {
        items.push({
          id: "izin-edar-bpom",
          label: "Izin Edar BPOM (MD)",
          status: "kondisional",
          statusLabel: "Perlu diperiksa",
          description: "Produksi skala industri atau produk yang mengandung daging/susu segar tergolong risiko lebih tinggi — umumnya butuh izin edar BPOM, bukan PIRT.",
          cta: "Konsultasikan"
        });
      } else {
        items.push({
          id: "pirt",
          label: "PIRT (Pangan Industri Rumah Tangga)",
          status: "kondisional",
          statusLabel: "Perlu diperiksa",
          description: "Karena kamu memproduksi produk makanan sendiri secara rumahan, ada persyaratan tambahan yang bergantung pada karakteristik produk dan proses produksinya.",
          cta: "Konsultasikan"
        });
      }
    }
  }

  if (answers.q2 === "dagang") {
    if (produkKhusus.indexOf("kosmetik") !== -1) {
      items.push({
        id: "izin-bpom-kosmetik",
        label: "Izin Edar BPOM Kosmetik",
        status: "kondisional",
        statusLabel: "Perlu diperiksa",
        description: "Produk kosmetik, skincare, atau perawatan tubuh butuh notifikasi/izin edar BPOM khusus kosmetik sebelum dijual bebas.",
        cta: "Konsultasikan"
      });
    }
    if (produkKhusus.indexOf("obat") !== -1) {
      items.push({
        id: "izin-kemenkes",
        label: "Izin Edar Kemenkes/BPOM (Obat & Alat Kesehatan)",
        status: "wajib",
        statusLabel: "Wajib diperiksa",
        description: "Obat-obatan, suplemen kesehatan, dan alat kesehatan diatur ketat — butuh izin edar dari Kemenkes/BPOM sebelum dipasarkan.",
        cta: "Konsultasikan"
      });
    }
  }

  if (answers.q2 === "manufaktur") {
    items.push({
      id: "izin-usaha-risiko",
      label: "Sertifikat Standar / Izin Usaha Risiko Tinggi",
      status: "kondisional",
      statusLabel: "Perlu diperiksa",
      description: "Produksi pabrikan skala besar umumnya masuk kategori risiko menengah-tinggi di OSS RBA, butuh Sertifikat Standar di luar NIB.",
      cta: "Konsultasikan"
    });
  }

  // Jasa — rekomendasi berdasarkan sub-kategori spesifik
  if (answers.q2 === "jasa") {
    var jasaKat = answers["q3-jasa"];
    var jasaKreatif = answers["jasa-kreatif-bidang"] || [];
    var jasaProduksiBidang = answers["jasa-produksi-bidang"] || [];
    var jasaProduksiModel = answers["jasa-produksi-model"] || "";
    var jasaItBidang = answers["jasa-it-bidang"] || [];
    var jasaKonsultanBidang = answers["jasa-konsultan-bidang"] || [];
    var jasaPendidikanJenis = answers["jasa-pendidikan-jenis"] || [];
    var jasaPersonalBidang = answers["jasa-personal-bidang"] || [];

    // Konsultan hukum — perlu izin advokat/notaris dari Kemenkumham
    if (jasaKonsultanBidang.indexOf("hukum") !== -1) {
      items.push({
        id: "izin-advokat",
        label: "Izin Praktik Advokat / SK Notaris (Kemenkumham)",
        status: "wajib",
        statusLabel: "Wajib diperiksa",
        description: "Jasa hukum (advokat, notaris) memerlukan izin praktik resmi dari Kementerian Hukum dan HAM, di luar NIB.",
        cta: "Konsultasikan"
      });
    }

    // Konsultan keuangan / akuntan publik
    if (jasaKonsultanBidang.indexOf("akuntan") !== -1) {
      items.push({
        id: "izin-akuntan-publik",
        label: "Izin Akuntan Publik (IAP) / IAPI",
        status: "kondisional",
        statusLabel: "Perlu diperiksa",
        description: "Jasa akuntan publik atau audit keuangan memerlukan Izin Akuntan Publik dari Kemenkeu dan keanggotaan IAPI.",
        cta: "Konsultasikan"
      });
    }
    if (jasaKonsultanBidang.indexOf("pajak") !== -1) {
      items.push({
        id: "izin-konsultan-pajak",
        label: "Sertifikat Konsultan Pajak (DJP / IKPI)",
        status: "kondisional",
        statusLabel: "Perlu diperiksa",
        description: "Praktik jasa konsultan pajak memerlukan sertifikasi dari Ikatan Konsultan Pajak Indonesia (IKPI) / DJP.",
        cta: "Konsultasikan"
      });
    }

    // Pendidikan — lembaga kursus wajib dapat izin dari Dinas Pendidikan
    if (jasaPendidikanJenis.indexOf("lkp") !== -1 || jasaPendidikanJenis.indexOf("bimbel") !== -1) {
      items.push({
        id: "izin-lkp",
        label: "Izin Operasional LKP (Dinas Pendidikan)",
        status: "wajib",
        statusLabel: "Perlu dimiliki",
        description: "Lembaga Kursus dan Pelatihan (LKP) atau Bimbel yang menyelenggarakan kursus formal wajib mendapat izin operasional dari Dinas Pendidikan setempat.",
        cta: "Konsultasikan"
      });
    }
    if (jasaPendidikanJenis.indexOf("formal") !== -1) {
      items.push({
        id: "izin-sekolah-formal",
        label: "Izin Pendirian Satuan Pendidikan (Kemendikbud)",
        status: "wajib",
        statusLabel: "Wajib diperiksa",
        description: "Pendirian sekolah formal (SD/SMP/SMA/Universitas) memerlukan izin dari Kemendikbud / Kemenag dan akreditasi BAN-S/M.",
        cta: "Konsultasikan"
      });
    }

    // Produksi konten / film
    if (jasaKat === "produksi") {
      if (jasaProduksiBidang.indexOf("film") !== -1) {
        items.push({
          id: "izin-produksi-film",
          label: "Izin Usaha Produksi Film (Lembaga Sensor Film)",
          status: "kondisional",
          statusLabel: "Perlu diperiksa",
          description: "Studio produksi film/video yang mendistribusikan karya ke publik (bioskop, platform streaming) perlu melewati sensor Lembaga Sensor Film (LSF) dan mendaftarkan izin usaha perfilman.",
          cta: "Konsultasikan"
        });
      }
      if (jasaProduksiModel === "royalti") {
        items.push({
          id: "hak-cipta-kekayaan-intelektual",
          label: "Pendaftaran Hak Cipta / Kekayaan Intelektual (DJKI)",
          status: "disarankan",
          statusLabel: "Disarankan",
          description: "Jika penghasilan utamamu dari royalti konten (musik, film, tulisan), mendaftarkan hak cipta ke DJKI (Ditjen Kekayaan Intelektual) memberikan perlindungan hukum yang lebih kuat.",
          cta: "Konsultasikan"
        });
      }
    }

    // Jasa personal — higiene sanitasi
    var needsHigiene = jasaPersonalBidang.indexOf("salon") !== -1 ||
      jasaPersonalBidang.indexOf("kecantikan") !== -1 ||
      jasaPersonalBidang.indexOf("spa") !== -1 ||
      jasaKat === "personal";
    if (needsHigiene) {
      items.push({
        id: "higiene-sanitasi",
        label: "Sertifikat Laik Higiene Sanitasi (Dinkes)",
        status: "kondisional",
        statusLabel: "Perlu diperiksa",
        description: "Jasa yang bersentuhan langsung dengan tubuh pelanggan (salon, spa, kecantikan, laundry) umumnya diminta memiliki sertifikat laik higiene sanitasi dari Dinas Kesehatan setempat.",
        cta: "Konsultasikan"
      });
    }

    // Gym / pusat kebugaran
    if (jasaPersonalBidang.indexOf("gym") !== -1) {
      items.push({
        id: "izin-pusat-kebugaran",
        label: "Izin Usaha Pusat Kebugaran (Dinas Pemuda & Olahraga)",
        status: "kondisional",
        statusLabel: "Perlu diperiksa",
        description: "Pusat kebugaran / gym komersial umumnya memerlukan izin dari Dinas Pemuda dan Olahraga setempat di samping NIB OSS.",
        cta: "Konsultasikan"
      });
    }
  }

  if (answers.q2 === "akomodasi") {
    items.push({
      id: "tdup",
      label: "TDUP (Tanda Daftar Usaha Pariwisata)",
      status: "wajib",
      statusLabel: "Perlu dimiliki",
      description: "Usaha di sektor akomodasi & pariwisata (hotel, vila, kos-kosan, kafe, restoran, tempat wisata) wajib terdaftar sebagai Usaha Pariwisata di luar NIB standar.",
      cta: "Urus TDUP"
    });
  }

  if (answers.q5 === "komersial" || answers.q5 === "pabrik") {
    items.push({
      id: "pbg-slf",
      label: "PBG & SLF (Izin Bangunan & Kelayakan Fungsi)",
      status: "kondisional",
      statusLabel: "Perlu diperiksa",
      description: "Karena kamu beroperasi di tempat/bangunan komersial, gedung tersebut perlu Persetujuan Bangunan Gedung dan Sertifikat Laik Fungsi yang sesuai.",
      cta: "Konsultasikan"
    });
  }

  if (answers.q6 === "ekspor-impor") {
    items.push({
      id: "izin-ekspor-impor",
      label: "Akses Kepabeanan (API-U / API-P)",
      status: "kondisional",
      statusLabel: "Perlu diperiksa",
      description: "Aktivitas ekspor/impor butuh akses kepabeanan tambahan di luar NIB standar.",
      cta: "Konsultasikan"
    });
  }

  if (answers.q7 === "berdampak") {
    items.push({
      id: "izin-lingkungan",
      label: "Izin Lingkungan (UKL-UPL / AMDAL)",
      status: "wajib",
      statusLabel: "Wajib diperiksa",
      description: "Kegiatan usaha yang berpotensi menghasilkan limbah atau polusi wajib punya dokumen lingkungan sesuai skala dampaknya.",
      cta: "Konsultasikan"
    });
  }

  // Pendaftaran Merek — disarankan buat semua orang yang bangun brand sendiri.
  items.push({
    id: "merek",
    label: "Pendaftaran Merek",
    status: "disarankan",
    statusLabel: "Disarankan",
    description: "Kalau kamu membangun brand sendiri, pendaftaran merek dapat membantu memberikan perlindungan hukum terhadap brand tersebut.",
    cta: "Daftarkan Merek"
  });

  // Urutan tampil: wajib dulu, baru kondisional, disarankan paling akhir.
  var order = { wajib: 0, kondisional: 1, disarankan: 2 };
  items.sort(function (a, b) { return order[a.status] - order[b.status]; });

  return { items: items, kbliMatched: collectKbliMatches(answers) };
}

/* Nyisir SEMUA option (pertanyaan biasa maupun tiap option di dalam
   groups) yang value-nya cocok sama jawaban user, terus kumpulin field
   `kbli`-nya (lihat catatan `kbli` di header file). Generic — otomatis
   ikut kalau nanti ditambah kbli baru di pertanyaan manapun, gak perlu
   diutak-atik lagi function ini. */
function collectKbliMatches(answers) {
  var matched = [];
  var seen = {};
  function addFrom(option) {
    if (!option || !option.kbli) return;
    option.kbli.forEach(function (entry) {
      if (seen[entry.code]) return;
      seen[entry.code] = true;
      matched.push(entry);
    });
  }
  Object.keys(QUIZ_DATA.questions).forEach(function (qId) {
    var q = QUIZ_DATA.questions[qId];
    if (q.type === "group") {
      q.groups.forEach(function (group) {
        var val = answers[group.key];
        if (val == null) return;
        var values = group.multi ? val : [val];
        group.options.forEach(function (opt) {
          if (values.indexOf(opt.value) !== -1) addFrom(opt);
        });
      });
    } else {
      q.options.forEach(function (opt) {
        if (opt.value === answers[qId]) addFrom(opt);
      });
    }
  });
  return matched;
}
