# Design System — Temu Karsa

Dokumen ini merangkum keputusan desain, visual style, dan tampilan homepage
Temu Karsa: legalitas usaha (pendirian PT/CV, perizinan, merek, pajak) dan
penyewaan ruang kerja (Virtual Office, Private Office, Coworking Space,
Meeting Room) untuk pelaku UMKM di Indonesia.

> **Update:** kedua kelompok layanan payung (L1) sudah lengkap beserta semua
> sub-layanannya (L2) — 2 halaman L1 + 7 halaman L2, total 9 halaman kategori
> di luar homepage. Lihat bagian **Arsitektur Multi-Halaman** di bawah untuk
> daftar lengkap & pola yang dipakai membangunnya, dipakai lagi kalau suatu
> saat ada kelompok layanan baru. Empat halaman pendukung (Tentang Kami,
> Kontak, Kebijakan Privasi, Tanya AI) juga sudah jadi halaman sendiri —
> lihat bagian **Halaman Pendukung** di akhir dokumen.

## Prinsip desain

- **Brand-first, bukan template generik.** Semua warna aksen diturunkan
  langsung dari logo, semua ilustrasi dibuat custom (bukan stok icon), semua
  copy dalam Bahasa Indonesia dan spesifik ke konteks legalitas/workspace.
- **Gerakan bermakna, bukan dekorasi.** Setiap animasi/hover punya alasan
  fungsional (menandakan interaktif, menonjolkan state aktif). Elemen yang
  bukan tombol/link (mis. kartu info "Kenapa Pilih Kami") sengaja **diam**
  saat di-hover — hanya elemen yang benar-benar bisa diklik yang bergerak.
- **Konsisten lintas section.** Kicker + heading, kartu, badge rating, dan
  pola tombol dipakai ulang di semua section, bukan didesain ulang tiap kali.
- **Aksesibilitas gerak.** Semua animasi (reveal, illustrasi, marquee,
  typewriter, carousel) menghormati `prefers-reduced-motion`.

## Palet warna

| Token | Nilai | Peran |
|---|---|---|
| `--navy` | `#003399` | Warna teks logo, tombol utama non-CTA, footer, ikon default |
| `--blue` | `#0058FF` | Warna aksi utama — semua primary CTA, hover-fill, link aktif |
| `--cyan` | `#009DFD` | Highlight sekunder, hover state dari `--blue`, gradient aksen |
| `--navy-deep` | `#041C4F` | Latar sangat gelap (aksen kartu testimoni) |
| `--ink` | `#08152F` | Warna teks judul/heading standar |
| `--body` | `#5C6272` | Warna teks paragraf |
| `--muted` | `#8A90A0` | Teks sekunder/meta (tanggal, label kecil) |
| `--line` | `#E4E7EE` | Border/divider tipis |
| `--surface` | `#FFFFFF` | Latar kartu/section terang |
| `--canvas` | `#F4F5F8` | Latar section abu sangat tipis (alternating background) |
| `--canvas-alt` | `#EDEFF5` | Latar ikon box, chip, section abu yang sedikit lebih tegas |

Aturan pemakaian: section-section bergantian antara `--surface` (putih) dan
default `--canvas` (abu tipis) supaya ritme scroll terasa, tanpa perlu garis
pemisah di setiap section — garis pemisah (`.section-divider`, 1px
`--line`) hanya dipakai saat dua section bersebelahan kebetulan sama-sama
`--canvas` sehingga butuh penanda batas.

## Tipografi

- **Font**: Plus Jakarta Sans (Google Fonts), fallback system sans-serif.
- **Heading** (`h1`–`h5`): bold (700), `letter-spacing:-0.025em`, warna `--ink`.
- **Skala**: `h1` clamp(2.4rem–4.1rem), `h2` clamp(1.95rem–3rem) — selalu
  fluid dengan `clamp()`, tidak pernah breakpoint tetap untuk ukuran teks.
- **Pola judul section** (dipakai di hampir semua section):
  `.section-kicker` (label kecil biru, bold, di atas judul) diikuti
  `.intro-heading` yang berisi dua bagian warna berbeda dalam satu kalimat:
  `.intro-heading__strong` (hitam/`--ink`, poin utama) +
  `.intro-heading__soft` (`--muted`, kalimat pendukung). Ini pola judul
  standar di seluruh homepage — dipakai ulang, bukan judul custom per section.

## Layout & spacing

- **Grid**: `--max: 1280px` max-width, `--gutter: 40px` padding kiri-kanan,
  turun ke `30px`/`20px` di breakpoint tablet/mobile.
- **Jarak antar-section**: `--section-y: 120px` (default) → `96px` (≤1180px)
  → `74px` (≤680px), dipakai sebagai `padding-block` bawaan tiap `.section`.
  Beberapa pasangan section (mis. Artikel → CTA) sengaja diberi jarak lebih
  rapat (dikunci 80px total via override manual) ketika jarak default terasu
  terlalu jauh untuk alur visualnya.
- **Breakpoint**: 1180px, 980px (nav berubah jadi burger menu), 680px (mobile).
- **Radius**: skala 4 tingkat — `--r-sm:12px` (chip, ikon box) → `--r-md:18px`
  (dropdown) → `--r-lg:26px` (kartu) → `--r-xl:34px` (section besar: hero,
  CTA band, footer).
- **"Floating card" motif**: Hero dan Footer sama-sama pakai
  `margin: var(--hero-margin)` + `border-radius: var(--r-xl)` sehingga
  mengambang dengan jarak dari tepi viewport, bukan full-bleed — navbar pill
  di header sengaja dihitung sejajar persis dengan tepi kartu hero ini di
  semua breakpoint.

## Komponen

### Navbar
Pill mengambang, **selalu putih** (bukan transparan) demi keterbacaan di atas
foto hero, posisi fixed tanpa geser saat scroll (cuma shadow menebal).
Berisi: logo, dropdown "Layanan" (2 kolom: Legalitas & Workspace), lalu link
teks polos urut **Tentang Kami → KarsaBiz → Artikel → Kontak →
Kebijakan Privasi** (urutan ini baku, sama persis di semua 20 halaman — kalau
ada link nav baru ditambahkan, ikuti urutan yang sudah disepakati, jangan
taruh sembarang posisi), link "Tanya AI" (teks + ikon sparkle, tanpa border
tombol, di `.header__cta` — bukan bagian dari `<nav>` link-link di atas),
dan tombol primary "Konsultasi Gratis" yang langsung membuka WhatsApp dengan
pesan pembuka otomatis.

- **Hover link nav = ganti warna teks jadi `--blue` saja.** Sempat pakai
  underline (`::after` yang scale-in), tapi dilepas total supaya konsisten
  dengan halaman kategori (L1) yang dari awal cuma pakai perubahan warna.
  Berlaku untuk semua link nav termasuk trigger dropdown "Layanan".
- **Judul grup di dalam dropdown** (`.nav__dd-title`, mis. "Pengurusan
  Legalitas & Perizinan") jadi `<a>` sungguhan begitu halaman kategorinya
  sudah ada, sebelum itu tetap `<span>` biasa. Warna defaultnya abu
  (`--body`) sama seperti item di bawahnya — **bukan** navy/biru — supaya
  tidak keliru dibaca sebagai state aktif; baru berubah `--blue` saat hover,
  itulah penanda dia klikabel. Divider tipis di bawah judul grup
  dipertahankan di kedua kondisi (span maupun link).

### Tombol (`.btn`)
Satu sistem tombol dengan modifier, **tanpa efek naik/`translateY` pada
hover** kecuali tombol default/navy dasar — semua varian yang dipakai di
homepage (`--light`, `--ghost`, `--on-dark`) sengaja hanya bertransisi warna:
- `.btn--light` — solid biru (`--blue`) → cyan saat hover. Primary CTA.
- `.btn--ghost` — putih + border tipis → fill biru solid saat hover. Secondary CTA.
- `.btn--on-dark` — kaca/glass di atas foto, hover cuma menaikkan brightness.
- `.link-arrow` — teks + ikon panah kecil yang bergeser saat hover, dipakai
  untuk aksi tersier ("Lihat Semua Artikel", dll).

### Kartu
Pola kartu dipakai berulang dengan variasi tipis: latar putih, `--r-lg`,
`--sh-sm` → `--sh-md` saat hover (untuk kartu yang benar klikabel). Kartu
info non-klik (mis. "Kenapa Pilih Kami") eksplisit tidak naik saat hover.

- **`.service-cards`** — grid 3 kartu (icon + judul + deskripsi + tombol
  "Pelajari Selengkapnya") dipakai di halaman kategori untuk memecah satu
  layanan payung jadi beberapa sub-layanan. Meski kartunya berisi tombol
  sungguhan, **kartunya sendiri tetap diam saat hover** (tanpa naik/shadow)
  — prinsip yang sama dengan kartu "Kenapa Pilih Kami": yang boleh punya
  affordance hover cuma elemen yang benar-benar diklik (tombolnya), bukan
  bungkus kartunya.

### Ilustrasi isometrik (Layanan Kami)
Dua ilustrasi SVG custom bergaya isometrik solid (bukan wireframe/flat),
terinspirasi linear.app:
1. **16 kolom** tersusun piramida yang tumbuh-menyusut looping membentuk
   gelombang (titik tumpu di dasar tiap kolom lewat CSS var `--ox/--oy`).
2. **Balok bertakik + kubus lepas** yang keluar-masuk dari takiknya secara
   looping.
Keduanya animasi otomatis (tidak menunggu hover), hover hanya menegaskan
warna garis jadi navy.

### Carousel Artikel (gaya Stripe)
Bukan carousel geser biasa — kartu aktif melebar penuh, kartu berikutnya
tersusun sebagai strip menyempit bertingkat (dek kartu), kartu yang sudah
lewat menyusut sampai hilang dan berputar tak terbatas (loop). Strip di
kanan bisa di-hover untuk melebar sekilas. Caption di bawah carousel ikut
berganti mengikuti kartu aktif, dengan tinggi caption dikunci (`min-height`)
supaya section di bawahnya tidak ikut naik-turun.

- **Reusable, bukan cuma untuk Artikel.** Logic-nya di `main.js` sudah
  digeneralisasi jadi `initDeckCarousel(opts)` (id track/tombol/caption
  dikirim sebagai parameter), jadi satu halaman bisa punya beberapa instance
  carousel. Dipakai juga untuk section **"Ruang Kerja"** (galeri foto
  workspace) di L1 `penyewaan-space.html` dan tiap L2 kategori workspace —
  bedanya dari carousel Artikel: kartunya `<div role="button" tabindex="0">`
  (bukan `<a>`, karena tidak menuju halaman lain, dengan handler Enter/Space
  manual buat keyboard), tanpa chip kategori, dan tanpa caption di bawahnya.
- **Autoplay opsional** (`opts.autoplay`, dalam ms) — dipakai di carousel
  Ruang Kerja (tiap 3.2 detik), **tidak** di carousel Artikel homepage
  (tetap manual seperti semula). Berhenti sementara saat kartu di-hover atau
  difokus (supaya tidak mengganggu saat pengunjung sedang melihat), lanjut
  lagi begitu ditinggal, dan dilewati total kalau `prefers-reduced-motion`
  aktif di browser pengunjung.
- **Foto rasio beda-beda** — dirender pakai `background-size:cover` di
  `.acard__bg` supaya semua kartu tetap rata tinggi (`320px`, ikut tinggi
  `.article-carousel__track`) walau file aslinya macam-macam ukuran. Kalau
  ada foto **portrait** (lebih tinggi dari lebar) dipasang di box carousel
  yang landscape, `cover` akan sangat memperbesar foto secara vertikal
  sampai cuma sepotong kecil tingginya yang kelihatan — cek dulu framing-nya
  (window ukuran kartu asli, coba beberapa `background-position` persen)
  sebelum commit ke satu crop, jangan asumsi `center`/`bottom` polos pasti pas.
- **`.acard__caption`** — chip kategori + judul kartu WAJIB dibungkus dalam
  satu `<div class="acard__caption">` (flex column, `gap:12px`), bukan
  ditaruh sebagai `.acard__chip`/`.acard__title` lepas bersebelahan. Alasan:
  posisi absolute dulu dipatok di `.acard__chip`/`.acard__title` masing-masing
  dengan angka `bottom` tetap — begitu panjang judul beda-beda antar kartu
  (1 vs 3 baris), jaraknya jadi kadang overlap kadang kejauhan. Dengan
  caption sebagai satu grup flex, jaraknya otomatis konsisten berapa pun
  baris judulnya. **Kalau bikin carousel `.acard` baru (chip+judul), pakai
  struktur ini dari awal** — sempat kejadian carousel "Ruang Kerja" (dipakai
  di 5 halaman L1/L2 workspace) judulnya nge-hilang total di semua breakpoint
  karena masih pakai `.acard__title` lepas tanpa `.acard__caption`.

### Glass card (kartu kaca di atas foto hero)
`.glass-card` — latar putih transparan + `backdrop-filter:blur`, dipakai di
atas foto hero untuk menampilkan metrik kepercayaan. Dua bentuk:
- **Satu kartu, satu angka besar** (`.glass-card__stat`, dipakai di hero
  homepage) — label kecil + angka animasi + kalimat pendukung.
- **`.glass-card--mini`** — versi kecil, dipakai berulang (bukan digabung
  jadi satu kartu 2×2) supaya jadi **beberapa kartu kaca terpisah tersusun
  vertikal** di sebelah wording hero. Dipakai di hero halaman kategori untuk
  menampilkan 4 metrik sekaligus tanpa mengubah metriknya jadi satu blok teks
  penuh. Tetap di dalam `.hero__cards` yang sama (grid vertikal bawaan) —
  bukan komponen baru, cuma variasi ukuran & instance-nya digandakan.

### Form & AI box
- Kotak "Tanya AI" pakai placeholder animasi mengetik (typewriter) yang
  bergantian antar beberapa contoh pertanyaan, looping, berhenti begitu
  input difokuskan/diisi.
- Form konsultasi (`Kontak Kami`) 2 kolom, field rounded, submit menampilkan
  pesan sukses inline (belum tersambung backend asli).
- **Catatan privasi di bawah form** (`.form-note`) teks polos (bukan flex
  icon+teks lagi — sempat pakai ikon centang tapi dilepas, dan `display:flex`
  bawaannya harus ikut dicabut juga supaya teks + link "Kebijakan Privasi"
  tidak pecah jadi potongan-potongan terpisah). Link "Kebijakan Privasi" di
  dalamnya underline statis, biru saat hover — sama di homepage & L1.
- **Dropdown `<select>`** (mis. "Jenis Layanan") pakai chevron custom
  (`appearance:none` + SVG bawaan CSS, warna `--muted`), bukan panah bawaan
  browser — panah native nempel mepet ke tepi kanan field tanpa jarak.
  Chevron custom diberi jarak 16px dari tepi + padding kanan field
  dilebarkan jadi 44px supaya teks tidak tabrakan dengannya. Aturan ini di
  `.field select` pada stylesheet bersama, otomatis berlaku di semua field
  select di seluruh halaman (homepage, L1, L2), tidak perlu disalin manual.

### Peta lokasi
Google Maps embed asli (iframe, bukan gambar statis) — genuinely interaktif
(bisa zoom/geser/klik "Buka di Maps"), bukan screenshot peta.

## Copywriting

- Semua salinan Bahasa Indonesia, nada profesional-hangat (bukan kaku
  korporat, bukan terlalu santai).
- CTA konsisten: "Konsultasi Gratis" sebagai frasa utama di seluruh situs.
- Testimoni & artikel: konten placeholder yang **ditulis meniru gaya nyata**
  (nama, nama usaha, angka rating) untuk memperkuat kesan brand meski belum
  ada testimoni/artikel asli — bukan lorem ipsum.

## Struktur homepage (urutan section `index.html`)

1. Header (navbar mengambang)
2. Hero (foto handshake, headline rotator, kartu statistik kaca)
3. Marquee — daftar sektor industri yang dilayani
4. Tentang Temu Karsa
5. Layanan Kami (showcase 2 kartu + ilustrasi isometrik)
6. Kenapa Pilih Kami (6 kartu alasan)
7. Cara Kerja Kami (timeline 5 langkah)
8. Tanya AI Konsultan Bisnis (kotak AI)
9. Testimoni Client (grid masonry gaya bento)
10. FAQ (accordion)
11. Artikel (carousel gaya Stripe)
12. CTA — ajakan konsultasi (kartu gelap + foto)
13. Kontak Kami (form + info + peta)
14. Footer (mengambang, biru navy, rounded penuh)

## Arsitektur multi-halaman (SEO)

Tujuannya: setiap kelompok layanan besar dapat **halaman `.html` sendiri**
(bukan cuma anchor di homepage) supaya masing-masing bisa di-index Google
dengan keyword sendiri-sendiri, alih-alih menumpuk semua di satu URL.
Struktur bertingkat:

- **Homepage** (`index.html`) — gambaran besar semua layanan.
- **L1** — satu halaman per kelompok layanan payung. Sudah jadi:
  `legalitas-perizinan.html` ("Pengurusan Legalitas & Perizinan") dan
  `penyewaan-space.html` ("Penyewaan Space & Ruang Kerja") — keduanya
  mengikuti pola yang sama persis (lihat di bawah).
- **L2** — halaman detail satu sub-layanan spesifik di dalam satu L1. Semua
  sub-layanan di kedua L1 sudah lengkap jadi halaman sendiri, mengikuti pola
  yang sama persis (lihat di bawah). Di bawah "Pengurusan Legalitas &
  Perizinan": `pendirian-badan-usaha.html`, `perubahan-badan-usaha.html`,
  `pengurusan-legalitas.html`. Di bawah "Penyewaan Space & Ruang Kerja":
  `virtual-office.html`, `private-office.html`, `coworking-space.html`,
  `meeting-room.html`. Tidak ada lagi sub-layanan yang masih anchor
  `#id` — semua sudah punya `href` file sendiri di seluruh halaman.

### Pola halaman L1 (dipakai `legalitas-perizinan.html` & `penyewaan-space.html`)

1. **Hero** — struktur **identik** dengan hero homepage (`.hero`/
   `.hero__inner`/`.hero__copy`/`.hero__cards`), cuma foto latarnya beda per
   kategori lewat modifier `.hero__bg--legalitas` (tambah modifier baru per
   kategori, jangan ganti `.hero__bg` bawaan — itu dipakai homepage). Di atas
   judul ada **breadcrumb** (`.breadcrumb`, `Beranda / Layanan / <halaman
   ini>`) — cuma muncul di halaman kategori, homepage tidak pakai karena dia
   sendiri adalah node teratas. Judul pakai `<h1>` biasa (bukan
   `.intro-heading` kicker+heading), dengan 1-2 kata kunci digarisbawahi
   pakai `.text-gradient` (highlight gradasi cyan statis, teknik yang sama
   dengan kata berputar di hero homepage tapi tanpa animasi ganti kata).
   Metrik kepercayaan tampil sebagai beberapa `.glass-card--mini` vertikal
   di kolom kanan (lihat bagian Glass card).
2. **Layanan Kami** — grid `.service-cards` (tiap kartu punya `id` sendiri
   untuk anchor) yang isinya jadi target dropdown navbar & link footer
   kelompok tersebut. Defaultnya 3 kolom; dipakai modifier `.service-cards--4`
   (4 kolom desktop → 2 → 1) saat kelompoknya punya 4 sub-layanan, seperti di
   `penyewaan-space.html` (Virtual Office, Private Office, Coworking Space,
   Meeting Room) — dipilih 4 kolom rata, bukan 3+1 sisa sebaris sendiri.
3. **Kenapa Pilih Kami, Cara Kerja Kami, CTA, Kontak Kami** — disalin verbatim
   dari homepage (markup, class, dan style-nya sama persis) supaya trust
   signal & cara konversi konsisten di semua halaman. Tiap pasangan section
   dipisahkan `.section-divider` yang sama seperti homepage, **termasuk**
   antara Kenapa Pilih Kami dan Cara Kerja Kami. Section **CTA**
   (`.cta-section`/`.cta-band`, kartu gelap navy + foto) disisipkan sebelum
   Kontak Kami — sama seperti posisinya di homepage — dengan pesan WhatsApp
   di tombolnya disesuaikan konteks halaman (bukan pesan generik homepage).
4. **Footer** — sama persis, dengan aturan link berikut.

### Pola halaman L2 (dipakai ketujuh halaman L2 yang sudah ada — `pendirian-badan-usaha.html`, `perubahan-badan-usaha.html`, `pengurusan-legalitas.html`, `virtual-office.html`, `private-office.html`, `coworking-space.html`, `meeting-room.html`)

**Layout L2 sengaja tidak mengikuti homepage/L1 sama sekali** — ia meniru
pola halaman detail layanan (rujukan: halaman *service single* Glowdent).
Bacanya seperti dokumen/spec sheet, bukan landing page. Kontennya (wording)
boleh menyesuaikan brief yang diberikan, tapi **layoutnya wajib ikut
referensi** — bukan sebaliknya.

1. **Tanpa hero foto.** Halaman dibuka langsung dengan latar polos (bukan
   `.hero`/`.hero__bg`): breadcrumb → `<h1>` besar (hitam polos, `--ink`,
   tanpa highlight warna apa pun — beda dari L1 yang pakai `.text-gradient`)
   → satu tombol CTA, disusun vertikal rata kiri (`.service-single__top`).
   Section-nya diberi `padding-top` besar supaya judul tidak tertutup navbar
   yang fixed. Breadcrumb pakai varian `.breadcrumb--light` (teks gelap)
   karena tidak lagi berada di atas foto.
2. **Alignment presisi ke tepi pill navbar, di semua lebar layar** — bukan
   cuma `--gutter` biasa. Formula: `padding-inline: calc(var(--gutter) +
   var(--hero-margin))` **plus** `max-width: calc(var(--max) + 2 *
   var(--hero-margin))`. Kombinasi keduanya wajib — kalau cuma padding
   tanpa penyesuaian max-width, di atas ~1320px lebar viewport kontennya
   jadi meleset ±20px dari tepi navbar. Diverifikasi lolos di 320px sampai
   1920px.
   **Update:** di ≤1180px (tablet & mobile — `--gutter` sudah turun ke 30px
   di breakpoint ini juga), formula ini jadi bawaan `.wrap` lewat override
   di dalam `@media (max-width: 1180px)` (bukan cuma modifier
   `.service-single__wrap`/`.pricing__wrap` di L2) — supaya SEMUA section
   sejajar dengan pill navbar, bukan cuma section tertentu. Sebelumnya
   `.wrap` polos cuma pakai `--gutter`, jadi section biasa (mis. "Kenapa
   Pilih Kami") kelihatan meleset ~20px ke kiri dibanding section yang
   sudah pakai formula ini — "amburadul" pas discroll di tablet. Section
   yang sudah punya inset sendiri dari margin kartu (`.hero`, `.footer`,
   keduanya `margin: var(--hero-margin)`) di-override balik ke
   `padding-inline: var(--gutter)` polos lewat `.hero__inner` dan
   `.footer > .wrap` (di dalam media query yang sama) — kalau tidak,
   insetnya dobel (kartu + wrap sama-sama nambah hero-margin).
   **Base `.wrap` di atas 1180px (desktop) TIDAK diubah** — tetap `--gutter`
   biasa seperti semula, supaya layout desktop yang sudah oke tidak ikut
   bergeser.
3. **Baris dua kolom** (`.service-single__row`, grid **`280px` tetap |
   `minmax(0,1fr)`**, jarak antar baris 56px): **judul bagian di kolom kiri
   lebar tetap**, isinya di kolom kanan (`.service-single__content`). Kolom
   kiri sengaja pakai px tetap (bukan `fr`) supaya kolom kanan mulai di titik
   x yang sama persis di semua baris — termasuk baris yang lebarnya beda
   (lihat poin 4). Ini jantung layout L2 — bukan kicker kecil di atas konten
   seperti section lain di situs ini. Di ≤980px kolom kiri turun jadi judul
   di atas kontennya.
4. **Baris teks** (mis. "Ringkasan Layanan") dipersempit `max-width:980px`
   supaya paragraf enak dibaca. **Baris berisi grid kartu** (`.check-grid`,
   `.dot-grid`) diberi modifier `.service-single__row--wide` yang melepas
   batas 980px itu, supaya kartu paling kanan tetap sejajar dengan tepi kanan
   navbar — bukan berhenti di tengah seolah konten terpotong.
5. **Kartu isi (bukan paragraf/list polos)** — pakai ulang persis komponen
   `.card`/`.card__icon` yang sama dengan "Kenapa Pilih Kami" (ikon dalam
   kotak bulat biru muda di atas, wording bold di bawah), grid 3 kolom di
   desktop → 2 (≤980px) → 1 (≤680px). Tiap kartu pakai ikon SVG **berbeda**
   sesuai isinya (bukan ikon yang sama diulang) — kaca pembesar untuk
   pengecekan nama, dokumen untuk drafting akta, dst. Diam saat hover (tanpa
   naik/shadow), sama seperti aturan kartu info lain di situs ini.
6. **Investasi & Harga** — section pricing terpisah (bukan
   `.service-single__row`, section penuh sendiri dengan `background:
   var(--surface)` putih solid supaya kontras dari section di sekitarnya),
   layout 2 kolom mengikuti referensi pricing card: kicker + heading besar +
   paragraf + garis + checklist keunggulan di kiri, **satu** kartu harga di
   kanan (Temu Karsa cuma satu paket, bukan multi-tier seperti di
   referensi). Badge kecil (mis. "Paket Lengkap") menumpang di tepi atas
   kartu, rata kanan. Di dalam kartu, urutannya **vertikal satu kolom**:
   label kecil → **angka harga besar & bold** (fokus utama, `font-weight:800`,
   sampai `~54px` di layar lebar — ini yang harus langsung kebaca, bukan
   wording di sekitarnya) → deskripsi singkat → daftar isi paket (grid
   **2 kolom**, turun ke 1 kolom di ≤680px) → tombol CTA full-width di
   paling bawah. Di ≤1180px, wording+checklist naik ke atas kartu (1 kolom)
   karena kolom daftar isi paket jadi terlalu sempit kalau dipaksa
   berdampingan. Harga umumnya sekali bayar (`Rp X`), tapi kalau modelnya
   berlangganan/per-satuan-waktu (mis. Virtual Office per tahun, Coworking
   Space per hari, Meeting Room per jam), tambahkan suffix kecil abu
   `.pricing-card__period` tepat setelah angka (mis. "Rp 149.000/jam") —
   bukan bikin baris terpisah. Teks tombol CTA-nya pun disesuaikan konteks
   kategori: L2 legalitas pakai "Urus Legalitas Sekarang", L2 workspace pakai
   "Sewa Ruangan Ini" (placeholder generik, dipakai apa adanya untuk semua
   L2 workspace). Baris checklist `.pricing__points` (mis. "Estimasi
   Ketersediaan: Sesuai Jadwal") **jangan** dibungkus `<strong>` untuk
   sebagian katanya — `<li>` di situ `display:flex; gap:14px`, dan sebuah
   elemen inline seperti `<strong>` ikut dihitung sebagai flex-item
   terpisah dari teks di sekitarnya, jadi `gap` ikut menyisipkan jarak besar
   yang tidak semestinya di antara teks biasa dan kata yang di-bold (bug
   nyata yang sempat kejadian). Kalau butuh menonjolkan sebagian teks di
   dalam elemen flex begini, satu text node polos lebih aman daripada
   mencampur elemen inline lain di dalamnya.
7. **Ruang Kerja (khusus L2 di bawah L1 "Penyewaan Space & Ruang Kerja")** —
   section carousel foto workspace disisipkan **setelah** section Investasi
   & Harga, sebelum divider ke Kenapa Pilih Kami. Markup-nya disalin persis
   dari section yang sama di `penyewaan-space.html` (`id="ruang-kerja-galeri"`,
   `#workspaceTrack`/`#workspacePrev`/`#workspaceNext`, tanpa chip, autoplay
   loop) — lihat bagian **Carousel Artikel (gaya Stripe)** di Komponen untuk
   detail carousel-nya. L2 kategori legalitas tidak punya section ini.
8. **Kenapa Pilih Kami, Cara Kerja Kami, CTA, Kontak Kami, Footer** — tetap
   sama persis seperti pola L1 (lihat poin 3 di bagian Pola L1 di atas),
   supaya trust signal dan jalur konversinya konsisten di semua level
   halaman.

### Pola halaman detail Artikel (dipakai `pembuatan-cv.html`, layout awal dari rujukan *blog single* Glowdent, lalu dikembangkan lebih lanjut lewat revisi bertahap)

Beda lagi dari L1 maupun L2 — ini bukan halaman jualan layanan, jadi
layoutnya meniru struktur artikel blog, bukan pola `.service-single` yang
dipakai L2. Layout dasar diambil dari referensi Glowdent lalu direvisi
beberapa kali sampai bentuk final di bawah — **konten artikel WAJIB sama
persis (verbatim)** dengan artikel aslinya di temukarsa.com/blog/<slug>,
bukan ditulis/diringkas bebas — setiap heading, list, tabel, dan FAQ di
sumber harus muncul semua, tidak boleh dipotong jadi "kesimpulan" versi
sendiri.

1. **Section kepala** (`#blog-head`, `padding-top:180px` — alasan sama
   seperti section pembuka lain tanpa hero: navbar fixed): breadcrumb
   3 level (`Beranda / Artikel / <judul artikel>`, `.breadcrumb--light`)
   di atas, lalu baris kepala artikel — `.blog-detail__eyebrow` ("X min
   read") + `<h1>` di kolom kiri (dibatasi `max-width:60ch`), sejajar
   dengan info penulis (avatar bulat + nama, TANPA ikon share di sini —
   share dipindah ke akhir artikel, lihat poin 4) di kolom kanan. Satu
   baris (`flex; justify-content:space-between; align-items:flex-end`),
   pecah ke bawah di ≤680px.
2. **Hero satu foto** (`.blog-detail__hero`) — satu gambar penuh lebar,
   tinggi `460px` (`220px` di ≤680px), `border-radius:var(--r-xl)`. Bukan
   split dua foto seperti draf awal.
3. **Layout 2 kolom setelah hero, TAPI cuma di desktop (>980px)**:
   `.blog-detail__layout` (CSS grid `minmax(0,1fr) 300px`, gap `60px`,
   `align-items:start`) membungkus `.blog-detail__body` (kolom isi
   artikel) + `<aside class="blog-toc">` (kolom kanan, sticky). Di ≤980px
   (tablet/mobile) kolom ke-2 **disembunyikan** (`.blog-toc { display:
   none }`, bukan cuma `position:static`) dan grid balik jadi
   `minmax(0, 1fr)` 1 kolom — TOC dianggap lebih mengganggu daripada
   membantu di layar sempit. **PENTING:** perubahan apa pun di area ini
   HARUS di-scope ke breakpoint ≤980px saja — jangan sentuh tampilan
   desktop-nya (sempat kejadian TOC desktop ikut hilang gara-gara
   HTML/CSS-nya dihapus total alih-alih cuma disembunyikan di breakpoint
   sempit, bikin user marah).
   - **`.blog-toc`** — kartu "Daftar Isi" (icon list + judul kapital),
     berisi `<nav>` link ke tiap heading `<h2>` (pakai `id` slug per
     section, mis. `#apa-itu-cv`). `position:sticky; top:130px`. WAJIB
     `margin-top` menyamai `padding-top` `.blog-detail__body` (saat ini
     `64px`) supaya tepi atas kartu sejajar persis dengan paragraf lead
     pertama, bukan nongol lebih tinggi.
   - **Anchor presisi**: tiap `.blog-detail__section` diberi
     `scroll-margin-top:130px` (sama dengan `top` sticky di atas) supaya
     waktu link TOC diklik, heading tujuan mendarat di bawah navbar fixed,
     bukan ketutupan/di atas navbar.
   - **Scroll-spy**: `initBlogToc()` di `main.js` pakai
     `IntersectionObserver` (`rootMargin:'-130px 0px -70% 0px'`) buat
     toggle `.is-active` (teks+border kiri biru, bg biru muda tipis) ke
     link yang section-nya lagi kelihatan.
   - Grid pakai `minmax(0, 1fr) 300px` (bukan `1fr 300px` polos) di kedua
     breakpoint — `1fr` polos punya minimum-size otomatis = ukuran konten
     terlebarnya, jadi kalau ada `.blog-table` (min-width:640px) di
     dalamnya track malah ikut melar (bukan tabelnya yang di-scroll lewat
     `.blog-table__wrap`), bikin seluruh kolom termasuk box Daftar Isi
     meluber ke luar viewport — bug nyata yang sempat kejadian.
4. **Isi artikel** (`.blog-detail__body`): 1-2 paragraf lead besar & bold
   (`.blog-detail__lead`) full-width, lalu deretan `.blog-detail__section`
   (`<h2>` + `<p>`/`<ul>`, dibatasi `max-width:78ch` — teks mengalir
   vertikal seperti dokumen, bukan grid dua-kolom ala L1/L2). `<p>` dan
   `<ul>` di dalam section WAJIB punya `margin-bottom` sendiri (`p` ada
   `margin:0 0 18px`, `p:last-child` di-nolkan, `ul` ada `margin:18px 0`)
   — kalau tidak, paragraf beruntun atau paragraf-setelah-list jadi
   nempel tanpa jarak. Sesekali diselingi `.blog-detail__quote`
   (pull-quote rata kiri, garis vertikal biru) — ambil dari kalimat asli
   artikel, bukan bikin baru. Section perbandingan (mis. "Perbedaan CV
   dan PT", "Ringkasan") yang di sumber aslinya berbentuk tabel HARUS
   jadi tabel HTML sungguhan (`.blog-table__wrap > table.blog-table`,
   header putih, baris genap `bg:var(--canvas)`, radius+border di wrapper),
   bukan diringkas jadi bullet list — section-nya dikasih modifier
   `.blog-detail__section--wide` (`max-width:none`) supaya tabel lebar
   penuh tidak kepotong 78ch. Section penutup tanpa `<h2>` (paragraf CTA
   dari Temu Karsa) juga valid kalau memang begitu di sumber aslinya.
   Tabel perbandingan 2 kolom (bukan 3 kolom "Aspek/X/Y") WAJIB modifier
   `.blog-table--split` (`table-layout:fixed`, tiap kolom `width:50%`,
   `td:first-child` di-`white-space:normal`-kan lagi) — tanpa ini kolom
   kanan ikut sempit ngikutin kolom kiri (auto table layout), dan kolom
   kiri (isinya kalimat, bukan label pendek) mewarisi `white-space:nowrap`
   dari tabel 3-kolom sehingga teksnya numpuk ke kolom sebelah.
   Section FAQ ditulis sebagai pasangan `<p><strong>Q</strong></p><p>A</p>`
   berulang di dalam satu `.blog-detail__section` (bukan komponen
   accordion baru).
5. **Share row** (`.blog-detail__share`) — di **akhir** isi artikel
   (setelah section terakhir, sebelum keluar dari `.blog-detail__body`),
   bukan di baris kepala. Label teks "Share Artikel Ini" + 4 ikon
   (`.socials.contact__socials`, reuse komponen footer — override
   `margin-top:0` khusus di sini karena `.contact__socials` biasanya
   punya `margin-top:32px` yang bikin ikon tidak sejajar vertikal dengan
   labelnya). `border-bottom` (bukan `border-top`) supaya garis pemisah
   jatuh **di bawah** baris share, ke arah section berikutnya.
6. **Section "Kata Kunci"** — di luar `#blog-head`, section baru
   (`.related-articles__title` + `.keyword-list` isi `.keyword-chip`
   pill per tag SEO artikel, format `#TanpaSpasiCamelCase`), diikuti
   `<div class="wrap"><hr class="section-divider"></div>` sebelum lanjut
   ke section berikutnya.
7. **Section "Artikel Terbaru Lainnya"** — sebelum CTA, reuse header
   `.article-section__head`/`.article-section__nav` (judul + subjudul di
   kiri, link "Lihat Semua Artikel →" di kanan, tanpa panah carousel
   karena isinya grid statis bukan carousel) + `.article-grid` isi
   `.article-tile` card artikel lain (exclude artikel yang sedang dibaca).
8. **CTA, Kontak Kami, Footer** — tetap sama persis seperti L1/L2 (poin 3
   Pola L1).

Kelima halaman detail sudah dibuat, semua kontennya diambil verbatim dari
artikel asli di temukarsa.com/blog/<slug> (bukan ditulis/diringkas bebas)
sesuai pola di atas:

- `pembuatan-cv.html` — sumber: temukarsa.com/blog/pembuatan-cv. 9 section
  (termasuk tabel "Perbedaan CV dan PT" & "Ringkasan"), 1 quote, FAQ.
- `rekomendasi-meeting-room-bekasi.html` — sumber: .../blog/rekomendasi-
  meeting-room-di-bekasi-untuk-pertemuan-yang-lebih-produktif. 10 section
  (1 di antaranya, "Fitur Meeting Room yang Perlu Dipertimbangkan", sengaja
  TIDAK dimasukkan ke Daftar Isi — meniru DAFTAR ISI asli yang juga
  melewatkannya), 3 testimoni dalam bentuk `.blog-detail__quote` berturut.
- `kbli-2025.html` — sumber: .../blog/penambahan-kbli-baru-di-kbli-2025-
  apakah-berpengaruh-pada-nib-dan-perizinan-usaha. Artikel pendek, 5
  section, tanpa lead paragraph (sumber aslinya juga langsung masuk section
  pertama tanpa paragraf pembuka).
- `kbli-2025-explained.html` — sumber: .../blog/exploring-kbli-2025-key-
  changes-and-what-they-mean-for-you. Artikel sumber berbahasa Inggris,
  **diterjemahkan penuh ke Bahasa Indonesia** per instruksi eksplisit user
  (isi/struktur/urutan section tetap sama persis dengan sumber, hanya
  bahasanya yang diubah). 9 section panjang, tanpa list/tabel (semua
  paragraf naratif seperti sumbernya).
- `pt-perorangan-pmdn-pma.html` — sumber: .../blog/perbedaan-pt-perorangan-
  pt-pmdn-dan-pt-pma-mana-yang-cocok-untuk-bisnis-anda. 4 section, closing
  paragraph tanpa heading (mengikuti sumber yang juga tidak memberi heading
  pada paragraf penutup).

Setiap halaman saling silang-taut lengkap: kartu di `artikel.html`, card
carousel Artikel di `index.html`, dan grid "Artikel Terbaru Lainnya" di
**keempat** artikel lain — tidak ada lagi `href="#"` placeholder tersisa
di antara kelima artikel ini.

### Aturan link lintas halaman

Karena section yang sama bisa "ada" di satu halaman tapi "tidak ada" di
halaman lain, setiap link nav/footer/tombol harus disesuaikan per halaman:

- Section yang **ada di halaman itu sendiri** → anchor biasa (`#id`).
- **Tentang Kami, Kontak, dan Kebijakan Privasi masing-masing punya halaman
  sendiri** (`tentang-kami.html`, `kontak.html`, `kebijakan-privasi.html`)
  — bukan lagi anchor section di homepage. Homepage tetap punya section
  `#tentang` versi ringkasnya sendiri (tidak dihapus), tapi link nav/footer
  di **semua** halaman (termasuk dari homepage sendiri) selalu mengarah ke
  file halaman barunya, bukan ke anchor `#tentang` lagi. Lihat bagian
  **Halaman Pendukung (Tentang Kami, Kontak, Kebijakan Privasi, Tanya AI)**
  di bawah.
- **`tanya-ai.html`** juga masih halaman sendiri, tapi link nav/footer ke
  situ (dan section `#asisten-ai` di homepage) sudah **di-archive** —
  lihat poin AI tool di bawah untuk alasannya.
- Kelompok layanan (L1) atau sub-layanan (L2) yang **halamannya sendiri
  belum dibuat** → `href="#"` placeholder (L1 baru) atau anchor ke L1 induk
  `<l1>.html#id` (L2 baru, sebelum halamannya sendiri jadi) — jangan
  ditebak-tebak ke section yang tidak nyambung. Situasi ini sudah tidak ada
  lagi saat ini (semua L1 & L2 sudah lengkap), tapi berlaku lagi begitu ada
  kelompok layanan baru.
- **Begitu satu L2 dibuat, semua referensi ke sub-layanan itu di seluruh
  halaman ikut diganti dalam langkah yang sama** dari anchor
  (`<l1>.html#id` atau `#id` kalau lagi di L1-nya sendiri) jadi link langsung
  ke file L2-nya: dropdown navbar (di homepage, tiap L1, tiap L2 lain, *dan*
  L2 itu sendiri), kolom footer terkait di semua halaman, dan tombol
  "Pelajari Selengkapnya" di kartu `.service-cards` L1 induknya. Sub-layanan
  lain yang masih belum punya L2 tetap anchor ke L1 seperti biasa. Contoh
  nyata: begitu `meeting-room.html` (L2 ke-7, terakhir) dibuat, seluruh
  10 halaman yang sudah ada di-grep sekaligus untuk memastikan tidak ada
  `#meeting-room` anchor yang tertinggal.
- Brand logo di header → selalu `index.html` di halaman non-home (bukan
  `#beranda` seperti di homepage sendiri).
- Tombol WhatsApp ("Konsultasi Gratis"/"Hubungi Kami"/CTA sejenis) selalu
  `https://wa.me/6285121558129` dengan `?text=` pesan pembuka yang
  disesuaikan konteks halaman (mis. pesan di L1 legalitas menyebut
  "legalitas & perizinan usaha" secara spesifik, bukan pesan generik
  homepage) — `target="_blank" rel="noopener"` di semua tombol ini.
- Breadcrumb di hero halaman kategori, selalu 3 tingkat. Di L1: `Beranda`
  (`index.html`) → `Layanan` (`index.html#layanan-showcase`) → nama halaman
  itu sendiri. Di L2, crumb tengah diganti nama L1 induknya (link ke file
  L1, bukan ke `index.html#layanan-showcase` lagi): `Beranda` → `<nama L1>`
  → nama halaman itu sendiri. Crumb terakhir selalu teks polos
  ber-`aria-current="page"`, bukan link.

Setiap kali halaman baru (L1/L2) dibuat, link-link terkait di homepage
(dropdown navbar, footer, tombol "Lihat detail layanan" di kartu Layanan
Kami) ikut di-update ke halaman baru itu di langkah yang sama — bukan
ditinggal sebagai kerjaan terpisah.

## Halaman Pendukung (Tentang Kami, Kontak, Kebijakan Privasi, Tanya AI)

Empat halaman non-layanan yang tadinya cuma anchor section di homepage,
sekarang masing-masing halaman `.html` sendiri:

- **`tentang-kami.html`** — halaman terpanjang, dibangun section demi
  section: hero dua-kolom (`.about-hero2`, judul kiri + paragraf singkat &
  1 tombol di pojok kanan atas, foto rounded penuh lebar di bawahnya),
  marquee industri (reuse persis dari homepage), metrik (`.about-intro__stats`,
  grid `auto` + `justify-content:space-between` biar angka terakhir sejajar
  tepi kanan, bukan `1fr` rata yang nyisain ruang kosong), lalu 3 section
  berpola sama (foto + judul/paragraf/kartu, posisi foto berselang-seling
  kiri/kanan): **Visi Kami** (foto kanan), **Misi Kami** (foto kiri, 4 kartu
  `.card`/`.card__icon`), **Komitmen Utama Kami** (foto kanan, paragraf + 4
  kartu). Kolom foto & kolom teks di ketiga section ini **sengaja
  `align-items:stretch`** (bukan tinggi tetap) supaya tinggi foto otomatis
  menyamai tinggi konten teks/kartu di sampingnya — kalau kontennya nanti
  berubah, tinggi foto ikut menyesuaikan sendiri, tidak perlu diutak-atik
  manual. Lalu divider, baru reuse penuh 7 section homepage (Layanan Kami,
  Kenapa Pilih Kami, Cara Kerja Kami, divider, Testimoni Client, divider,
  FAQ, CTA, Kontak Kami) apa adanya dari `index.html`. (Section **Tim Kami**
  — 2 kartu foto anggota, `.team-grid`/`.team-card` — sempat ada di antara
  Komitmen Utama Kami dan Layanan Kami, dihapus atas permintaan user;
  CSS-nya masih ada di `style.css` kalau nanti mau dipasang lagi.)
- **`kontak.html`** — section intro (breadcrumb + `.intro-heading` rata
  kiri, copy disesuaikan konteks kontak, bukan center meski referensi
  visualnya center — situs ini **tidak ada** pola heading center di section
  awal manapun, jadi tetap ikut konvensi rata kiri) + Kontak Kami + CTA +
  Footer, semua reuse komponen yang sudah ada.
- **`kebijakan-privasi.html`** — pola dokumen sama seperti artikel
  (`.blog-detail__section` h2+p+ul, tanpa TOC/sidebar karena kontennya lebih
  pendek), 8 bagian (Data yang Dikumpulkan, Bagaimana Digunakan, Keamanan
  Data, Berbagi ke Pihak Ketiga, Hak Atas Data, Cookie, Perubahan Kebijakan,
  Hubungi Kami) + 1 pull-quote. **Halaman ini tidak punya
  `.blog-detail__hero`** (foto), jadi dipakai modifier baru
  `.blog-detail__body--no-hero` (`padding-top:24px`, bukan `64px` default)
  supaya jarak judul ke paragraf pembuka tidak kejauhan — `padding-top:64px`
  di `.blog-detail__body` awalnya dirancang buat "menyerap" jarak setelah
  foto hero, jadi kalau tidak ada hero, harus dikecilkan manual pakai
  modifier ini di halaman manapun yang sama-sama tanpa hero. CTA + Kontak
  Kami + Footer di bawahnya reuse standar.
- **`tanya-ai.html`** — cuma section `.ai-tool` (chatbox AI + chip + counter,
  identik dengan yang di homepage, `initAiBox()` di `main.js` generic jadi
  otomatis jalan) + Footer. **Sengaja tanpa CTA & Kontak Kami** — beda dari
  3 halaman pendukung lain di atas, karena section AI-nya sendiri sudah
  berfungsi sebagai satu-satunya call-to-action halaman ini. File-nya masih
  ada & masih jalan penuh kalau dibuka langsung, tapi **link ke halaman ini
  sudah di-archive** dari navbar & footer di semua 20 halaman (lihat poin
  di bawah).

### AI tool — ARCHIVED, diganti kartu Instagram (2026-09-12)

Temu Karsa **belum jadi pakai fitur AI chat** — sudah didiskusikan
constraint-nya (situs statis nggak bisa nyimpen API key dengan aman tanpa
serverless function, plus biaya API per-chat & resiko abuse/jailbreak kalau
di-deploy tanpa guardrail). Keputusannya:

1. **Link "Tanya AI"** (navbar `.nav-ai` di `header__cta`, dan link footer)
   di-**archive** (dibungkus HTML comment, bukan dihapus) di **semua 20
   halaman** — supaya halaman `tanya-ai.html` dan section `#asisten-ai` di
   homepage nggak lagi punya pintu masuk dari UI, tapi tinggal di-uncomment
   kalau AI chat jadi dipakai suatu saat.
2. **Section `#asisten-ai` di homepage** (`.ai-tool`, chatbox "Tanya AI
   Konsultan Bisnis Kami") juga di-archive dengan cara sama (HTML comment).
   CSS `.ai-tool*` di `style.css` **dibiarkan tetap ada** (tidak dipakai,
   tapi tidak dihapus) — pola yang sama seperti komponen ter-archive
   lainnya (`.marquee-band`, `.team-card`).
3. **Diganti section Instagram** (`.instagram`, id `#instagram`, persis di
   posisi section AI yang lama) — kartu profil Instagram **statis** (bukan
   live embed — situs ini statis, live feed butuh API key/widget pihak
   ketiga yang nggak aman disimpan client-side; sudah dikonfirmasi ke user
   sebelum dibangun — Instagram Basic Display API sendiri sudah
   di-*discontinue* Meta akhir 2024, opsi live yang tersisa cuma Graph API
   (butuh Business account + backend nyimpen token) atau widget pihak
   ketiga berbayar/freemium kayak SnapWidget). Isinya: `.section-kicker`
   "Media Sosial" + `.intro-heading` rata kiri (pola sama persis kayak
   section lain, BUKAN center kayak `.ai-tool__wrap` yang lama) dengan
   ajakan "Yuk, Gabung Jadi **Teman Karsa**" (nama komunitas follower,
   bukan cuma "follow kami" generik), lalu `.instagram-card`:
   - **`.instagram-card__top`** (flex row) — avatar (logo mark
     `favicon-mark.png` di lingkaran `--canvas-alt`), `@temukarsa.id` +
     badge verified (SVG custom, bukan asset Instagram), bio singkat,
     tombol `Follow @temukarsa.id` ke `https://www.instagram.com/temukarsa.id/`
     (`target="_blank"`). **Sengaja tidak ada angka follower/statistik** —
     tidak ada akses data real Instagram Temu Karsa, jadi tidak boleh
     mengarang angka.
   - **`.instagram-card__posts`** — grid 3 thumbnail persegi (`aspect-ratio:
     1/1`, `object-fit:cover`, zoom halus pas hover sama kayak
     `.article-tile__img`) berisi 3 POSTINGAN ASLI TERBARU Temu Karsa
     (bukan placeholder), masing-masing link ke post aslinya di Instagram.
     Gambarnya **disimpan lokal** di `assets/img/instagram/post-{1,2,3}.jpg`
     — diambil dari `og:image` tiap URL post (dibuka via browser, baca meta
     tag `og:image`, lalu di-download), BUKAN di-hotlink langsung ke CDN
     Instagram (`scontent.cdninstagram.com`) karena URL CDN itu signed &
     expired dalam waktu terbatas (parameter `oh`/`oe`), bakal broken kalau
     dipasang langsung sebagai `src`. **Update manual**: kalau mau ganti ke
     3 post terbaru lain nanti, ulangi proses yang sama (buka URL post
     barunya, ambil `og:image`, download, replace file + href-nya) — bukan
     otomatis/live.
   - `.instagram-card__top` stack jadi kolom di mobile (≤680px), tombolnya
     ikut aturan `.btn` full-width global yang sudah ada (tidak perlu
     override tambahan); `.instagram-card__posts` tetap 3 kolom di semua
     lebar layar, cuma gap-nya mengecil di mobile.

Data referensi (dipakai lintas halaman pendukung): LinkedIn resmi
`https://www.linkedin.com/company/temu-karsa/`, Instagram resmi
`https://www.instagram.com/temukarsa.id/`.

## Responsive — Tablet & Mobile

Setelah semua halaman selesai di desktop, dilakukan satu putaran audit &
perbaikan khusus tampilan tablet (≤980px, >680px) dan mobile (≤680px).

**Aturan kerja yang WAJIB diikuti untuk perbaikan responsive apa pun:**
setiap fix ditulis **scoped ketat** ke breakpoint yang diminta (di dalam
media query yang sesuai, kalau perlu bikin selector sekhusus mungkin, mis.
`#misi-kami .mission__photo` bukan `.mission__photo` polos) — **tidak boleh
ada efek samping ke breakpoint lain**. Ini bukan sekadar gaya kerja, tapi
pernah jadi masalah nyata dua kali: (1) instruksi "hapus Daftar Isi" yang
dikira berlaku semua breakpoint, padahal maksudnya tablet/mobile saja —
Daftar Isi desktop ikut kehapus dan harus dipulihkan; (2) `.wrap` yang
diubah global sempat ikut mengubah `.header__bar` (yang juga pakai class
`.wrap`) karena keduanya berbagi class yang sama. Karena itu, **setiap fix
di bagian ini WAJIB diverifikasi ulang di breakpoint lain (biasanya lewat
`getBoundingClientRect()`/`getComputedStyle()` di breakpoint yang *tidak*
diminta) untuk membuktikan tidak ada yang berubah**, bukan cuma discreenshot
di breakpoint yang diminta saja.

### Tablet (≤980px, breakpoint di `@media (max-width: 980px)`)

- **`.nav.is-open`** (panel menu mobile navbar): inset kiri-kanan disamakan
  dengan inset pill navbar (`calc(var(--gutter) + var(--hero-margin))`),
  bukan dipatok `16px` tetap — supaya lebar panelnya persis sejajar pill di
  atasnya, bukan lebih lebar.
- **`.header__bar`** (si pill navbar) ikut pakai class `.wrap` — kalau ada
  override `.wrap` untuk breakpoint tertentu, WAJIB tambahkan pengecualian
  balik `.header__bar { padding: 10px 10px 10px 28px; max-width: calc(var(--max) - 2 * var(--gutter)); }`
  di breakpoint yang sama, kalau tidak padding asimetrisnya (28px kiri ke
  logo, 10px kanan ke burger) ikut ketiban jadi simetris.
- **Alignment ke pill navbar berlaku ke SEMUA section**, bukan cuma
  `.service-single__wrap`/`.pricing__wrap` — lihat poin 2 di bagian *Pola
  halaman L2* di atas untuk formulanya. `.hero__inner` dan `.footer > .wrap`
  dikecualikan balik ke `padding-inline:var(--gutter)` polos karena mereka
  sudah dapat inset dari margin kartunya sendiri (`.hero`/`.footer`,
  `margin:var(--hero-margin)`) — kalau ikut nambah dari `.wrap` juga, jadi
  dobel inset.
- **`.footer`**: `padding-top` disamakan dengan `padding-bottom` (`32px`,
  turun dari `84px` bawaan desktop) — di tablet jaraknya kejauhan dari card
  di atasnya.
- **`.footer__top`**: brand (logo+deskripsi+newsletter) di-`grid-column:1/-1`
  supaya span 1 baris penuh sendiri (field newsletter-nya baru bisa selebar
  `.footer__map` di baris Kontak) — 3 kolom link (Legalitas/Workspace/
  Perusahaan) TETAP 3 kolom sebaris di baris berikutnya, jangan ikut
  ditumpuk 1 kolom (sempat salah, keburu ditumpuk semua, direvisi user).
- **`.newsletter`**: `max-width:none` (lepas dari `380px` bawaan desktop)
  supaya field email mengisi penuh lebar kolomnya.
- **`.process__line`**: garis penghubung dot "Cara Kerja Kami" sekarang
  **di-generate JS** (`initProcessLines()` di `main.js`), bukan satu
  `<div class="process__line">` statis di CSS — karena di tablet kartu bisa
  jadi 2 baris (mis. 3+2, baris ke-2 di-`flex-wrap`+`justify-content:center`)
  dan posisi garis per baris tidak bisa dipatok persen tetap lagi. Dot
  dikelompokkan per baris berdasarkan posisi vertikalnya, 1 garis dibuat
  untuk tiap baris berisi ≥2 dot. Dot-nya sendiri `[data-reveal]`
  (animasi geser saat scroll ke viewport) jadi garis di-render ulang tiap
  ada `transitionend` transform di dalam track, supaya posisinya sinkron
  dengan posisi akhir dot, bukan posisi sebelum animasi.
- **`.service-cards` dan `.process__track`**: sempat dicoba diubah dari grid
  ke `flex-wrap` + `justify-content:center` supaya kartu sisa ganjil di
  baris terakhir center — **tapi ini DIBALIKIN lagi ke grid biasa** atas
  revisi user. Keputusan final: kartu ganjil di baris terakhir **rata kiri
  seperti bawaan grid**, jangan di-center.
- **`.blog-detail__layout`**: grid `minmax(0, 1fr) 300px` (kolom konten +
  sidebar Daftar Isi) **tetap dipertahankan strukturnya** di tablet — yang
  berubah cuma `.blog-toc { display: none }` (disembunyikan, bukan dihapus
  dari DOM/CSS/JS) dan grid jadi `minmax(0, 1fr)` 1 kolom. Riwayat: sempat
  dihapus total (HTML `<aside>`, CSS `.blog-toc*`, `initBlogToc()`) karena
  instruksi "hapus Daftar Isi" dikira berlaku semua breakpoint — ternyata
  cuma dimaksud tablet/mobile, jadi versi desktop-nya harus dipulihkan
  lengkap. `minmax(0, 1fr)` (bukan `1fr` polos) tetap wajib dipakai di kedua
  breakpoint karena `1fr` punya minimum-size otomatis = ukuran konten
  terlebarnya — kalau ada `.blog-table` (`min-width:640px`) di dalamnya,
  track-nya malah ikut melar (bukan tabelnya yang scroll di
  `.blog-table__wrap`), bikin seluruh kolom meluber ke luar viewport.
- **`#misi-kami .mission__photo`**: `order:2` (foto pindah ke bawah
  judul+kartu) khusus section Misi Kami — section Komitmen Utama Kami di
  bawahnya sudah otomatis foto-di-bawah dari urutan HTML aslinya, jadi tidak
  perlu di-`order` juga.
- **`.about-hero2__side`**: `width:auto` (lepas dari `320px` fixed bawaan
  desktop, yang didesain untuk kolom sempit di samping heading) supaya
  paragraf mengisi penuh lebar 1 kolom begitu layout jadi `flex-direction:
  column`.
- **`.cta-band`**: `.cta-band__copy` padding kanan-kiri di-nolkan (dari
  `8px`/`16px` bawaan) — `.cta-band` sendiri sudah punya `padding:28px`,
  jadi padding tambahan bikin teks & tombol (`width:100%` di breakpoint ini)
  keinset lebih dalam drpd foto di bawahnya yang tidak punya padding sendiri.
  **Foto CTA** (`.cta-band__photo img`, foto `1200×675`): box tablet/mobile
  (`597×260`, rasio ~2.3) jauh lebih lebar dari rasio foto asli (~1.78),
  jadi `object-fit:cover` pas mentok di LEBAR box tanpa sisa crop
  horizontal sama sekali — `object-position` X jadi percuma (tidak ada
  ruang geser). Fix-nya: foto di-`transform:scale(1.5)` dulu baru ada ruang
  crop horizontal, dengan `transform-origin` (`16% 22%` per kalibrasi
  terakhir) dipilih presisi lewat trial-and-error visual supaya kedua orang
  di foto center horizontal DAN kepalanya tidak kepotong vertikal (origin-Y
  digeser naik dari center murni ke `22%` supaya lebih banyak bagian atas
  foto yang kelihatan).
- **`#artikel-terbaru .article-section__head`**: `align-items:flex-start`
  (bukan `flex-end` bawaan) — section "Artikel Terbaru Lainnya" di halaman
  detail artikel nav-nya cuma 1 link (tanpa tombol panah carousel kayak versi
  homepage), jadi lebih pendek dari blok judul+subjudul di sebelahnya;
  `flex-end` bikin dia nempel sejajar baris subjudul, bukan judul.

### Mobile (≤680px, breakpoint di `@media (max-width: 680px)`)

- **`.hero__inner`**: berubah jadi `display:flex; flex-direction:column`,
  TAPI `align-items:end` bawaan (didesain untuk grid 2 kolom desktop) tidak
  otomatis ke-reset — WAJIB ditambah `align-items:stretch` eksplisit, kalau
  tidak anak-anaknya (`.hero__copy` dkk) di-shrink ke lebar kontennya sendiri
  lalu diratakan ke KANAN; kalau lebar konten itu > lebar kolom yang
  tersedia, sisanya meluber ke KIRI sampai keluar viewport (nabrak, ga
  sejajar navbar).
- **`.btn`**: SEMUA tombol `.btn` fill lebar penuh kontainernya
  (`width:100%; justify-content:center`) — permintaan eksplisit "semua
  button". **Kecuali** `.header__cta .btn` (tombol kecil di dalam pill
  navbar, `width:auto`) — itu wajib tetap seukuran isinya, full-width bakal
  merusak pill-nya.
- **`.article-section__nav`**: `flex-direction:row` (bukan `column` bawaan)
  supaya link "Lihat Semua Artikel" dan tombol panah carousel sejajar 1
  baris, bukan ditumpuk. Tombol panahnya (`.article-section__arrows`) pakai
  `margin-left:auto` (BUKAN `justify-content:space-between` di parent) —
  alasannya supaya tetap rata kanan juga di section yang nav-nya cuma isi
  panah doang tanpa link teks (mis. carousel "Ruang Kerja" di halaman
  workspace) — `space-between` dengan 1 anak malah nempel ke KIRI.
- **`.pricing-card__price`**: `font-size:1.9rem` fix (bukan `clamp()`
  bawaan). `clamp(2.6rem, 4vw, 3.4rem)` minimumnya 2.6rem TIDAK PERNAH turun
  di bawah itu berapa pun sempitnya layar (acuannya `vw`, bukan breakpoint),
  jadi di mobile harga semacam "Rp 2.299.000/tahun" kepaksa pecah 2 baris.
  Class ini sama persis dipakai di 7 halaman L2 workspace/legalitas yang
  punya `.pricing-card`, jadi satu fix ini otomatis konsisten di semua
  halaman tanpa perlu disentuh satu-satu.
