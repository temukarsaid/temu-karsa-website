/* Data lead contoh — cuma dipakai kalau env DEMO_LEADS=1 (lihat
   functions/api/leads.js), buat coba-coba tampilan dashboard/Leads/PDF di
   preview lokal tanpa perlu Supabase beneran. TIDAK dipakai di produksi. */

export const DEMO_LEADS = [
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
