# CMS Artikel — Cara Kerja & Setup

Sistem ini memungkinkan tim Temu Karsa membuat/mengedit artikel lewat form web
di `/admin`, klik Publish, dan artikel baru otomatis tayang di website —
tanpa perlu sentuh kode.

## Bagaimana cara kerjanya

1. **Eleventy** (`eleventy/` folder) membaca file JSON di `eleventy/articles/*.json`
   dan generate halaman HTML artikel (`pembuatan-cv.html`, dst) di root project —
   layout-nya identik dengan artikel yang sudah ada sekarang.
2. **19 halaman lain** (index.html, layanan, tentang-kami, dll) TIDAK disentuh
   sama sekali oleh Eleventy — itu tetap file HTML statis biasa.
3. **Decap CMS** (`admin/index.html` + `admin/config.yml`) adalah form editor
   yang tim Temu Karsa buka di `namadomain.com/admin`. Field formnya sudah
   dipetakan 1:1 ke struktur artikel yang ada (judul, gambar hero, section-section
   isi, tabel perbandingan, kata kunci, dst).
4. Saat tim klik **Publish** di CMS, Decap CMS menyimpan perubahan sebagai commit
   git baru ke file JSON di `eleventy/articles/`.
5. Cloudflare Pages otomatis rebuild setiap ada commit baru — build command
   menjalankan Eleventy dulu (generate ulang semua halaman artikel), baru
   situsnya live.
6. **Daftar Isi (sticky TOC)** di sisi kanan artikel otomatis di-generate dari
   judul-judul section yang diisi di CMS — tim tidak perlu isi field TOC terpisah,
   jadi tidak akan pernah "kelewat update" seperti sebelumnya.

## File yang perlu Anda ketahui

- `eleventy/articles/*.json` — 5 artikel yang sudah ada, sudah dimigrasikan ke
  format ini sebagai data awal (sudah diverifikasi tampil identik di browser).
- `eleventy/_includes/article-layout.njk` — template HTML artikel (jangan diedit
  kecuali mau ubah layout untuk SEMUA artikel sekaligus).
- `admin/config.yml` — daftar field yang muncul di form CMS.
- `functions/api/auth.js` + `functions/api/callback.js` — OAuth proxy buat
  login GitHub di CMS, jalan otomatis sebagai Cloudflare Pages Function
  begitu di-deploy (folder `functions/` otomatis kedeteksi Cloudflare Pages
  lewat file-based routing, tidak perlu setup layanan terpisah). Lihat
  langkah #3 di bawah untuk konfigurasinya.

## Langkah manual yang HARUS Anda lakukan (di luar kemampuan saya)

Langkah-langkah ini melibatkan akun eksternal (GitHub, Cloudflare) sehingga
saya tidak bisa melakukannya untuk Anda:

1. **Init git repo & push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Buat repo baru di GitHub, lalu push.

2. **Hubungkan repo ke Cloudflare Pages** — Cloudflare dashboard → Workers &
   Pages → Create → Pages → Connect to Git, pilih repo GitHub-nya. Set:
   - **Build command**: `npx @11ty/eleventy && true`
   - **Build output directory**: `/` (Eleventy sudah nulis ke root project,
     jadi output directory-nya root, bukan folder `dist`/`_site`)

3. **Setup autentikasi Decap CMS (backend "github")** — OAuth provider-nya
   SUDAH disiapkan nyatu di project ini sendiri (`functions/api/auth.js` +
   `functions/api/callback.js`, otomatis kedeteksi Cloudflare Pages sebagai
   Pages Function saat deploy), jadi **tidak perlu deploy layanan terpisah**.
   Tinggal:
   - Buat GitHub OAuth App baru: GitHub → Settings → Developer settings →
     OAuth Apps → New OAuth App.
     - **Homepage URL**: URL situs Anda setelah dideploy (mis. `https://temukarsa.pages.dev`,
       atau custom domain-nya kalau sudah disambungkan)
     - **Authorization callback URL**: URL situs yang sama + `/api/callback`
       (mis. `https://temukarsa.pages.dev/api/callback`)
   - Setelah dibuat, GitHub kasih **Client ID** dan **Client Secret** — masukkan
     keduanya ke Cloudflare Pages: Project Settings → Environment variables:
     - `OAUTH_CLIENT_ID` = Client ID tadi
     - `OAUTH_CLIENT_SECRET` = Client Secret tadi
     (lalu redeploy sekali biar env var-nya kebaca)
   - Buka `admin/config.yml`, isi:
     - `repo:` → `owner/nama-repo` GitHub Anda
     - `base_url:` → URL situs Anda sendiri setelah dideploy (yang sama seperti
       di atas, TANPA `/api/callback` di belakangnya)
   - Commit & push perubahan `admin/config.yml` itu supaya ikut ter-deploy.

4. **Undang anggota tim** sebagai collaborator di repo GitHub (minimal akses
   Write) — mereka login ke `/admin` pakai akun GitHub masing-masing.

Setelah 4 langkah ini selesai, alur kerja tim jadi:

> Buka `namadomain.com/admin` → login GitHub → New Articles → isi form
> (judul, gambar, section per section) → Publish → dalam ~1 menit artikel
> baru live di website, dengan layout yang identik dengan artikel-artikel
> yang sudah ada.

## Menjalankan build secara lokal

```bash
npx @11ty/eleventy
```

Ini akan menulis ulang ke-5 file artikel HTML di root project berdasarkan isi
`eleventy/articles/*.json` — jalankan ini setiap habis edit file JSON secara
manual, atau setelah menambah artikel baru lewat CMS di lokal.
