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
          label: "Makanan & Minuman Olahan",
          desc: "Produk konsumsi, baik basah maupun kering/kemasan.",
          value: "makanan",
          next: "q3-makanan"
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

    // Khusus kategori Makanan & Minuman — nentuin butuh PIRT / BPOM / izin
    // khusus atau enggak, berdasarkan cara kemas & bahan baku.
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

    // Khusus kategori Jasa / Layanan Profesional — golongan "jasa" di KBLI
    // kelewat luas buat dipetakan dari 1 pertanyaan kategori doang, jadi
    // ditanya lebih spesifik dulu.
    "q3-jasa": {
      title: "Jasa spesifik apa yang kamu tawarkan?",
      subtitle: "Biar rekomendasi KBLI & izin praktiknya lebih tepat sasaran.",
      mascot: "menjelaskan2",
      options: [
        {
          label: "Konsultasi Bisnis & Manajemen",
          desc: "Konsultan strategi, keuangan, SDM, atau pemasaran.",
          value: "konsultasi",
          next: "q5",
          kbli: [{ code: "70202", title: "Aktivitas Konsultansi Manajemen dan Bisnis Industri" }]
        },
        {
          label: "Agensi Kreatif, Desain, atau Periklanan",
          desc: "Branding, iklan, desain grafis/komunikasi visual.",
          value: "kreatif",
          next: "q5",
          kbli: [
            { code: "73100", title: "Aktivitas Periklanan" },
            { code: "74192", title: "Aktivitas Desain Grafis/Komunikasi Visual" }
          ]
        },
        {
          label: "IT, Software, atau Digital",
          desc: "Pengembangan aplikasi/website, konsultasi IT.",
          value: "it",
          next: "q5",
          kbli: [
            { code: "62199", title: "Aktivitas Pemrograman Komputer Lainnya YTDL" },
            { code: "62209", title: "Aktivitas Konsultansi Komputer dan Manajemen Fasilitas Komputer Lainnya" }
          ]
        },
        {
          label: "Cuci Pakaian / Laundry",
          desc: "Binatu, dry cleaning, dan sejenisnya.",
          value: "laundry",
          next: "q5",
          kbli: [{ code: "96100", title: "Aktivitas Pencucian dan Pembersihan Produk Tekstil dan Bulu" }]
        },
        {
          label: "Kecantikan, Salon, atau Spa",
          desc: "Perawatan rambut, tata rias, spa harian.",
          value: "kecantikan",
          next: "q5",
          kbli: [{ code: "96220", title: "Aktivitas Perawatan Kecantikan" }]
        },
        {
          label: "Jasa Profesional Lainnya",
          desc: "Selain kategori di atas.",
          value: "lainnya",
          next: "q5"
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

  // Jasa yang bersentuhan langsung sama tubuh/pakaian pelanggan (laundry,
  // salon/spa) umumnya diminta punya sertifikat laik higiene sanitasi dari
  // Dinas Kesehatan setempat, di luar NIB standar.
  if (answers.q2 === "jasa" && (answers["q3-jasa"] === "laundry" || answers["q3-jasa"] === "kecantikan")) {
    items.push({
      id: "higiene-sanitasi",
      label: "Sertifikat Laik Higiene Sanitasi",
      status: "kondisional",
      statusLabel: "Perlu diperiksa",
      description: "Jasa yang bersentuhan langsung dengan tubuh atau barang pelanggan (laundry, salon, spa) umumnya diminta punya sertifikat laik higiene sanitasi dari Dinas Kesehatan setempat.",
      cta: "Konsultasikan"
    });
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
