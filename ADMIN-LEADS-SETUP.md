# Admin Dashboard Temu Karsa — Cara Kerja & Setup

Dashboard admin terpusat di `/admin/` — satu shell dengan sidebar
(Dashboard, Artikel, Leads KarsaBiz), satu login (email + password), buat
semua tool admin Temu Karsa. Bagian "Leads" adalah tempat admin lihat
semua orang yang submit kuis KarsaBiz, plus lihat & download hasil
diagnostic-nya sebagai PDF.

## Bagaimana cara kerjanya

1. Data lead (dari `assets/js/quiz.js`, fungsi `submitLead`) disimpan di
   tabel `leads` di **Supabase** — itu satu-satunya peran Supabase di sini,
   cuma nyimpen database. Admin **tidak perlu** pernah buka dashboard
   Supabase.
2. Admin buka `namadomain.com/admin/` → kalau belum login, muncul form
   **email + password** → dicek server-side terhadap env var `ADMIN_EMAIL`
   / `ADMIN_PASSWORD` → kalau cocok, dikasih cookie sesi 12 jam
   (`admin_session`), berlaku buat seluruh `/admin/*` (Dashboard, Artikel,
   Leads).
3. Sidebar dashboard punya 3 bagian: **Dashboard** (ringkasan angka lead),
   **Artikel** (Decap CMS, editor konten website), **Leads** (tabel semua
   submit kuis KarsaBiz).
4. Halaman Leads manggil `/api/leads` (Cloudflare Pages Function) buat
   nampilin tabel — endpoint ini yang pegang `SUPABASE_SERVICE_ROLE_KEY`
   secara rahasia di server, browser admin sendiri gak pernah nyentuh
   Supabase langsung.
5. Klik satu baris → buka tampilan detail (kop surat, ringkasan profil,
   rekomendasi legalitas, referensi KBLI) → klik **Download PDF** →
   browser admin sendiri yang convert ke PDF lewat dialog print
   (`window.print()`) → pilih "Save as PDF". Gak ada PDF yang di-generate
   & disimpan di server sama sekali — dibikin on-demand di browser admin
   tiap kali dibuka.

Catatan soal bagian **Artikel**: itu masih Decap CMS, dan Decap PUNYA
proses login GitHub sendiri buat bisa commit ke repo (lapisan auth yang
beda & terpisah dari login dashboard di atas — gak bisa dihindari, itu
cara Decap kerja). Jadi admin akan lihat login GitHub itu HANYA saat
pertama kali buka bagian Artikel, bukan buat masuk ke dashboard secara
keseluruhan.

## File yang perlu Anda ketahui

- `admin/index.html` — Dashboard (login gate email+password + ringkasan).
- `admin/shell.css` — sidebar/topbar/kartu, dipakai bareng di ketiga halaman.
- `admin/articles/index.html` — Decap CMS dibungkus sidebar yang sama.
- `admin/leads/index.html` — halaman Leads (daftar + tampilan detail/print).
- `functions/api/admin-login.js` — cek email+password, terbitin cookie sesi.
- `functions/api/admin-logout.js` — hapus cookie sesi.
- `functions/api/admin-me.js` — cek cookie sesi masih valid atau enggak
  (dipakai semua halaman `/admin/*` buat mutusin nampilin form login atau
  isi dashboard).
- `functions/api/leads.js` — proxy aman ke Supabase (pegang service_role
  key), balikin daftar lead atau detail satu lead.
- `functions/_lib/session.js` — helper cookie sesi (tanda tangan HMAC).
- `functions/api/auth.js` + `functions/api/callback.js` — login GitHub
  KHUSUS buat Decap CMS (bagian Artikel) commit ke repo, gak ada
  hubungannya sama login dashboard di atas.

## Langkah manual yang HARUS Anda lakukan

Di **Cloudflare Pages → Settings → Environment variables**, tambahin
(selain `OAUTH_CLIENT_ID`/`OAUTH_CLIENT_SECRET` yang udah ada buat Decap
CMS):

1. **`ADMIN_EMAIL`** — email buat login dashboard, contoh:
   `temukarsaid@gmail.com`

2. **`ADMIN_PASSWORD`** — password buat login dashboard. Disimpan apa
   adanya (plain text) di Environment Variables Cloudflare — bukan di
   kode, bukan di GitHub. Cukup aman buat tim kecil; bisa di-upgrade ke
   hash nanti kalau perlu.

3. **`SESSION_SECRET`** — string acak yang panjang & rahasia, dipakai buat
   nandatangani cookie sesi. Generate sekali aja, contoh cara bikinnya di
   PowerShell:
   ```powershell
   -join ((48..57)+(65..90)+(97..122)|Get-Random -Count 40|%{[char]$_})
   ```
   Copy hasilnya, paste sebagai value `SESSION_SECRET`.

4. **`SUPABASE_URL`** — `https://dzrhihckfjaztdwtqmzy.supabase.co`

5. **`SUPABASE_SERVICE_ROLE_KEY`** — dari Supabase Dashboard → Project
   Settings → **API Keys** → cari yang label-nya `service_role` (BUKAN
   `anon` — ini key rahasia, kebalikan dari yang dipasang di `quiz.js`).
   **Jangan pernah** taruh key ini di kode/file yang ke-commit ke GitHub —
   cuma boleh ada di Environment Variables Cloudflare.

Setelah env var-nya lengkap, redeploy sekali (push commit apa aja, atau
trigger redeploy manual dari dashboard Cloudflare Pages) biar env var
baru kebaca.

## Tes

1. Buka `namadomain.com/admin/` → muncul form email + password → login
   pakai `ADMIN_EMAIL` / `ADMIN_PASSWORD` yang udah di-set.
2. Harusnya langsung masuk ke Dashboard, liat kartu ringkasan (Total
   leads, PDF siap dikirim, Belum diproses) + panel Lead Terbaru.
3. Klik **Leads** di sidebar → tabel semua lead (atau "Belum ada lead"
   kalau memang belum ada yang submit kuis).
4. Klik satu baris → detail-nya harus muncul lengkap.
5. Klik **Download PDF** → dialog print browser muncul → pilih "Save as
   PDF" (atau destination printer "Save as PDF").
6. Klik **Artikel** di sidebar → CMS Decap muncul dengan sidebar yang
   sama → kalau belum pernah, bakal diminta login GitHub (proses terpisah,
   khusus buat commit artikel).
