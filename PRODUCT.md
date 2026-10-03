# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Calon klien (situs publik):** pelaku usaha/UMKM di Indonesia yang butuh legalitas usaha (pendirian PT/CV, NIB, perizinan) atau ruang kerja (Virtual Office, Private Office, Coworking, Meeting Room), dan yang memakai tools KarsaBiz untuk cek kebutuhan legalitasnya.
- **Tim internal (dashboard admin `/admin/`):** dua peran yang sama pentingnya —
  - **Owner** memantau performa KarsaBiz (tren, profil calon klien, perbandingan tool) untuk keputusan bisnis.
  - **Tim follow-up** memproses antrian submission tiap hari: buka/cetak PDF, hubungi via WhatsApp/email, tandai status "Sudah dikirim".

## Product Purpose

Temu Karsa adalah mitra legalitas, ruang kerja, dan tools bisnis digital untuk pelaku usaha di Indonesia. KarsaBiz adalah payung tools digitalnya: pengunjung mengisi tool di website, hasilnya masuk ke admin, lalu tim mengirim hasil personal (PDF) via WhatsApp/email dalam 1x24 jam kerja. Sukses = banyak submission masuk dan semuanya ditindaklanjuti cepat.

## Positioning

Hasil tool tidak ditampilkan otomatis ke pengunjung — dihitung di belakang layar lalu dikirim personal oleh tim, sehingga setiap submission adalah lead yang dilayani manusia.

## Operating Context

- Tools KarsaBiz yang hidup: **Legal Check** (kuis diagnostic legalitas → rekomendasi + KBLI) dan **Checklist Dokumen Usaha** (form 7 langkah: jenis layanan, pendiri/KTP, NPWP, 3 opsi nama PT, alamat kedudukan, modal & saham, kontak). **Kalkulator Modal Usaha** masih placeholder.
- Semua submission disimpan di satu tabel Supabase `leads`; Checklist dibedakan lewat `answers.formType = 'checklist-dokumen-usaha'`.
- Status submission: `baru` (Belum diproses) → `pdf_siap` (Sudah dikirim), ditandai manual oleh admin.
- PDF dicetak dari admin (kop surat Temu Karsa) lalu dikirim via WhatsApp/email.
- Mode demo lokal: `DEMO_LEADS=1` di `.dev.vars` memakai data contoh di `functions/_lib/demo-leads.js`.

## Capabilities and Constraints

- Situs statis HTML/CSS/JS + Eleventy untuk artikel, di-deploy ke Cloudflare Pages; API admin lewat Cloudflare Pages Functions (`functions/api/*`).
- Dashboard admin punya dua sumber data: submission (Legal Check + Checklist, Supabase) dan **traffic website dari Google Analytics 4** (property dengan tag `G-13PN8VEX01`), dibaca server-side lewat GA4 Data API dengan service account (diputuskan 2026-10-02, menggantikan keputusan awal "submission saja"). Owner/admin tidak perlu membuka GA.
- Metrik performa yang penting (dikonfirmasi): volume submission & trennya, kecepatan follow-up (dikirim vs menumpuk, umur antrian), profil calon klien (jenis/bentuk usaha, layanan dicari), perbandingan antar tool, pengunjung & tren harian, halaman terpopuler, sumber pengunjung, konversi pengunjung halaman tool → submission.

## Brand Commitments

- Nama: Temu Karsa; produk tools: KarsaBiz. Bahasa Indonesia di seluruh UI.
- Logo & aset brand di `assets/img/` (logo-temu-karsa.png, favicon-mark.png, maskot di `assets/img/mascot/`).
- Kontak resmi: temukarsaid@gmail.com, WhatsApp +62 851-2155-8129, Ruko Taman Juanda, Jl. Pahlawan Blok B1 No.3, Bekasi Timur.

## Evidence on Hand

- Data submission nyata di Supabase (tidak bisa diakses dari sandbox dev ini); data contoh di `functions/_lib/demo-leads.js` (3 Legal Check, 2 Checklist).
- Belum ada data konversi ke klien berbayar atau pendapatan — jangan dikarang di dashboard. Traffic hanya dari GA4; selama GA belum terhubung, preview lokal memakai data contoh berlabel.

## Product Principles

1. Setiap submission adalah orang yang menunggu jawaban — antrian yang belum diproses harus selalu terlihat.
2. Angka di dashboard hanya dari data yang benar-benar tersimpan; label jujur bila datanya contoh/kosong.
3. Satu tempat untuk dua kebutuhan: owner melihat tren, tim menyelesaikan antrian, tanpa saling menghalangi.
4. Konsisten dengan identitas Temu Karsa (biru brand, Plus Jakarta Sans, Bahasa Indonesia).
