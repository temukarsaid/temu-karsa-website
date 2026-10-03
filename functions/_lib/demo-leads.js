/* Data lead contoh — cuma dipakai kalau env DEMO_LEADS=1 (lihat
   functions/api/leads.js), buat coba-coba tampilan dashboard/Leads/PDF di
   preview lokal tanpa perlu Supabase beneran. TIDAK dipakai di produksi. */

const BASE_LEADS = [
  {
    id: '11111111-aaaa-4bbb-8ccc-000000000001',
    created_at: '2026-09-10T03:24:00.000Z',
    nama: 'Siti Rahmawati',
    whatsapp: '0812-3456-7890',
    email: 'siti.rahmawati@gmail.com',
    status: 'pdf_siap',
    answers: {
      q1: 'perorangan',
      q2: 'makanan',
      kemasan: 'kering',
      bahan: 'kering',
      q5: 'rumah',
      q6: 'lokal',
      q7: 'tidak-berdampak',
    },
    recommendations: [
      { label: 'NIB (Nomor Induk Berusaha)', description: 'Wajib dimiliki semua pelaku usaha, termasuk usaha perorangan skala rumahan, sebelum mulai berjualan.', status: 'wajib' },
      { label: 'PIRT (Pangan Industri Rumah Tangga)', description: 'Wajib buat produk makanan kering yang diproduksi di rumah dan diedarkan secara lokal.', status: 'wajib' },
      { label: 'Sertifikasi Halal', description: 'Perlu diperiksa lebih lanjut tergantung bahan baku dan target pasar produk.', status: 'kondisional' },
      { label: 'Label & Kemasan Sesuai BPOM', description: 'Disarankan supaya kemasan produk sudah sesuai standar pelabelan pangan.', status: 'disarankan' },
    ],
    kbli_matched: [
      { code: '10794', title: 'Industri Makanan Ringan dari Ubi, Kacang-kacangan dan Biji-bijian' },
      { code: '47212', title: 'Perdagangan Eceran Makanan Ringan/Jajanan' },
    ],
  },
  {
    id: '22222222-aaaa-4bbb-8ccc-000000000002',
    created_at: '2026-09-11T09:05:00.000Z',
    nama: 'Andy Pratama',
    whatsapp: '0857-1122-3344',
    email: 'andy.pratama@outlook.com',
    status: 'baru',
    answers: {
      q1: 'pt',
      q2: 'jasa',
      'q3-jasa': 'it',
      q5: 'digital',
      q6: 'nasional',
      q7: 'tidak-berdampak',
    },
    recommendations: [
      { label: 'NIB (Nomor Induk Berusaha)', description: 'Wajib dimiliki sebelum PT bisa beroperasi dan membuka rekening usaha.', status: 'wajib' },
      { label: 'Akta Pendirian PT & SK Kemenkumham', description: 'Wajib sebagai dasar hukum badan usaha PT Perorangan.', status: 'wajib' },
      { label: 'Sertifikasi ISO 27001', description: 'Perlu diperiksa kalau klien enterprise mensyaratkan standar keamanan data.', status: 'kondisional' },
      { label: 'NPWP Badan Usaha', description: 'Disarankan segera diurus setelah NIB terbit untuk keperluan pajak.', status: 'disarankan' },
    ],
    kbli_matched: [
      { code: '62019', title: 'Aktivitas Pemrograman Komputer Lainnya' },
      { code: '62029', title: 'Aktivitas Konsultasi Komputer dan Manajemen Fasilitas Komputer Lainnya' },
    ],
  },
  {
    id: '33333333-aaaa-4bbb-8ccc-000000000003',
    created_at: '2026-09-12T14:40:00.000Z',
    nama: 'Dewi Anggraini',
    whatsapp: '0821-9988-7766',
    email: 'dewi.anggraini@yahoo.com',
    status: 'baru',
    answers: {
      q1: 'cv',
      q2: 'dagang',
      produkKhusus: 'fashion',
      q5: 'komersial',
      q6: 'ekspor-impor',
      q7: 'tidak-berdampak',
    },
    recommendations: [
      { label: 'NIB (Nomor Induk Berusaha)', description: 'Wajib dimiliki CV sebelum bisa bertransaksi dan mengurus izin ekspor.', status: 'wajib' },
      { label: 'Akta Pendirian CV', description: 'Wajib sebagai dasar hukum badan usaha CV di hadapan notaris.', status: 'wajib' },
      { label: 'API-U (Angka Pengenal Importir)', description: 'Perlu diperiksa karena rencana distribusi mencakup ekspor/impor.', status: 'kondisional' },
      { label: 'Hak Merek', description: 'Disarankan didaftarkan supaya brand fashion terlindungi secara hukum.', status: 'disarankan' },
    ],
    kbli_matched: [
      { code: '47711', title: 'Perdagangan Eceran Pakaian' },
      { code: '46411', title: 'Perdagangan Besar Tekstil' },
    ],
  },
];

/* Data contoh submission "Checklist Dokumen Usaha" (lihat
   assets/js/checklist.js) — dipakai functions/api/checklist-leads.js
   kalau DEMO_LEADS=1, sama kayak DEMO_LEADS di atas buat Legal Check. */
const BASE_CHECKLIST = [
  {
    id: '44444444-aaaa-4bbb-8ccc-000000000004',
    created_at: '2026-09-29T08:12:00.000Z',
    nama: 'Budi Santoso',
    whatsapp: '0812-3456-7890',
    email: 'budi.santoso@gmail.com',
    status: 'baru',
    answers: {
      formType: 'checklist-dokumen-usaha',
      jenisLayanan: 'pendirian-pt',
      persons: [
        { nama: 'Budi Santoso', nik: '3201234567890001', alamat: 'Jl. Melati III No. 12, RT 004/RW 007, Kel. Sukamaju, Kec. Cibinong', saham: '60' },
        { nama: 'Siti Aminah', nik: '3201234567890002', alamat: 'Jl. Sudirman No. 5, Bekasi Timur', saham: '40' },
      ],
      npwpList: [
        { nama: 'Budi Santoso', npwp: '3201234567890001' },
        { nama: 'Siti Aminah', npwp: '3201234567890002' },
      ],
      companyNames: ['Maju Jaya Sentosa', 'Karya Abadi Makmur', 'Cipta Mandiri Sejahtera'],
      businessAddress: 'Ruko Taman Juanda, Jl. Pahlawan Blok B1 No.3, Bekasi Timur, Jawa Barat 17111',
      modalDasar: '50000000',
      modalDisetor: '12500000',
    },
  },
  {
    id: '55555555-aaaa-4bbb-8ccc-000000000005',
    created_at: '2026-09-30T11:40:00.000Z',
    nama: 'Dewi Anggraini',
    whatsapp: '0821-9988-7766',
    email: 'dewi.anggraini@yahoo.com',
    status: 'pdf_siap',
    answers: {
      formType: 'checklist-dokumen-usaha',
      jenisLayanan: 'pendirian-cv',
      persons: [
        { nama: 'Dewi Anggraini', nik: '3275012345670003', alamat: 'Jl. Kenanga No. 8, RT 002/RW 003, Kel. Harapan Jaya, Kec. Bekasi Utara', saham: '100' },
      ],
      npwpList: [
        { nama: 'Dewi Anggraini', npwp: '3275012345670003' },
      ],
      companyNames: ['Dewi Fashion Jaya', 'Anggraini Mode Sentosa', 'Karya Dewi Abadi'],
      businessAddress: 'Jl. Ahmad Yani No. 21, Bekasi Barat, Jawa Barat 17134',
      modalDasar: '25000000',
      modalDisetor: '25000000',
    },
  },
];

/* Tambahan data contoh yang di-generate (seed tetap, jadi hasilnya sama tiap
   jalan) dan disebar ke 90 hari terakhir relatif ke waktu server — supaya
   grafik tren di dashboard home punya cukup titik buat dicoba di preview
   lokal. Tetap cuma kepakai di DEMO_LEADS=1; dashboard nandain "Data contoh". */
function seededRandom(seed) {
  let a = seed;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DEMO_NAMES = [
  'Rina Wulandari', 'Agus Setiawan', 'Fajar Nugroho', 'Lestari Handayani', 'Yoga Pratama',
  'Nur Aisyah', 'Hendra Wijaya', 'Maya Sari', 'Dimas Saputra', 'Putri Ramadhani',
  'Bayu Kurniawan', 'Intan Permata', 'Rizky Maulana', 'Sri Wahyuni', 'Teguh Santoso',
  'Ayu Lestari', 'Eko Prasetyo', 'Fitri Amalia', 'Galih Firmansyah', 'Hana Safitri',
  'Irfan Hakim', 'Joko Susilo', 'Kartika Dewi', 'Lukman Hidayat', 'Mega Puspita',
  'Novi Andriani', 'Oki Ramadhan', 'Prita Melati', 'Rudi Hartono', 'Sinta Maharani',
];
const BENTUK = ['perorangan', 'perorangan', 'pt', 'cv', 'cv', 'yayasan'];
const KATEGORI = ['makanan', 'makanan', 'dagang', 'jasa', 'jasa', 'manufaktur', 'akomodasi'];
const LAYANAN = ['pendirian-pt', 'pendirian-pt', 'pendirian-cv', 'nib-perizinan', 'nib-perizinan', 'legalitas-pertanahan'];

function pick(rng, list) { return list[Math.floor(rng() * list.length)]; }
function digits(rng, n) { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(rng() * 10); return s; }
function demoId(prefix, i) { return prefix + ('000000' + i.toString(16)).slice(-6) + '-d3e0-4ccc-8ccc-' + ('00000000000' + (i * 7919).toString(16)).slice(-12); }
function contact(rng, nama) {
  const slug = nama.toLowerCase().replace(/[^a-z]+/g, '.');
  return { whatsapp: '08' + digits(rng, 2) + '-' + digits(rng, 4) + '-' + digits(rng, 4), email: slug + '@gmail.com' };
}

function generateDemo() {
  const rng = seededRandom(20261002);
  const now = Date.now();
  const DAY = 86400000;
  const leads = [];
  const checklist = [];
  let n = 0;
  for (let d = 89; d >= 0; d--) {
    const recency = 1 - d / 90; // makin baru makin ramai — kesan tren naik
    const lcPerDay = rng() < 0.25 + 0.45 * recency ? (rng() < 0.3 ? 2 : 1) : 0;
    const clPerDay = d <= 45 && rng() < 0.15 + 0.35 * recency ? (rng() < 0.25 ? 2 : 1) : 0;
    for (let k = 0; k < lcPerDay + clPerDay; k++) {
      n++;
      const created = new Date(now - d * DAY - Math.floor(rng() * 10) * 3600000).toISOString();
      const nama = pick(rng, DEMO_NAMES);
      const sent = d > 6 ? true : d > 1 ? rng() < 0.55 : rng() < 0.15;
      const base = { created_at: created, nama: nama, status: sent ? 'pdf_siap' : 'baru', ...contact(rng, nama) };
      if (k < lcPerDay) {
        leads.push({
          ...base,
          id: demoId('a', n),
          answers: { q1: pick(rng, BENTUK), q2: pick(rng, KATEGORI), q5: 'rumah', q6: 'lokal', q7: 'tidak-berdampak' },
          recommendations: [
            { label: 'NIB (Nomor Induk Berusaha)', description: 'Wajib dimiliki semua pelaku usaha sebelum mulai beroperasi.', status: 'wajib' },
          ],
          kbli_matched: [],
        });
      } else {
        checklist.push({
          ...base,
          id: demoId('c', n),
          answers: {
            formType: 'checklist-dokumen-usaha',
            jenisLayanan: pick(rng, LAYANAN),
            persons: [{ nama: nama, nik: '32' + digits(rng, 14), alamat: 'Jl. Contoh No. ' + (1 + Math.floor(rng() * 90)) + ', Bekasi', saham: '100' }],
            npwpList: [{ nama: nama, npwp: '32' + digits(rng, 14) }],
            companyNames: ['Karya ' + nama.split(' ')[0] + ' Sentosa', 'Mitra ' + nama.split(' ')[0] + ' Abadi', 'Cipta ' + nama.split(' ')[0] + ' Mandiri'],
            businessAddress: 'Jl. Contoh Raya No. ' + (1 + Math.floor(rng() * 90)) + ', Bekasi, Jawa Barat',
            modalDasar: '50000000',
            modalDisetor: '12500000',
          },
        });
      }
    }
  }
  return { leads, checklist };
}

// Di-generate saat request pertama, BUKAN di top-level modul: runtime
// Workers membekukan Date.now() di 0 (1970) selama inisialisasi modul.
let cache = null;
function demoData() {
  if (!cache) {
    const generated = generateDemo();
    const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    cache = {
      leads: BASE_LEADS.concat(generated.leads).sort(byNewest),
      checklist: BASE_CHECKLIST.concat(generated.checklist).sort(byNewest),
    };
  }
  return cache;
}

export function getDemoLeads() { return demoData().leads; }
export function getDemoChecklistLeads() { return demoData().checklist; }
