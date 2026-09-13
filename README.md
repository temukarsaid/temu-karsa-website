# Temu Karsa — Website

Homepage statis (HTML/CSS/JS murni, tanpa framework atau build step).

## Menjalankan

```bash
node server.js
```

Lalu buka `http://localhost:4321`. Bisa juga langsung deploy folder ini ke
static hosting mana pun (Netlify, Vercel, GitHub Pages, cPanel) — tidak ada
proses build.

> Membuka `index.html` lewat `file://` akan membuat CSS/JS gagal termuat di
> sebagian browser. Gunakan server lokal di atas.

## Struktur

```
index.html            — seluruh homepage
assets/css/style.css  — design token + semua styling
assets/js/main.js     — preloader, sticky header, rotator, marquee,
                        scroll reveal, counter, akordion FAQ, form
assets/img/           — logo
server.js             — static server untuk preview lokal
```

## Design token

Palet diambil langsung dari logo utama dan didefinisikan di `:root`
(`assets/css/style.css`):

| Token         | Nilai     | Pakai untuk               |
|---------------|-----------|---------------------------|
| `--navy`      | `#003399` | teks logo, tombol utama   |
| `--blue`      | `#0058FF` | aksen, gradien            |
| `--cyan`      | `#009DFD` | highlight, gradien        |
| `--navy-deep` | `#041C4F` | latar gelap, footer       |

Mengubah keempat nilai ini otomatis mengubah seluruh halaman.

## Yang masih perlu diganti sebelum live

Semua item di bawah ini adalah **placeholder**:

1. **Testimoni** — tiga kutipan di section testimoni diawali `[Contoh]` dengan
   nama "Nama Klien". Wajib diganti kutipan asli beserta izin penggunaannya.
2. **Angka statistik** — `500+ badan usaha`, `12 tahun`, `4.9/5`, `98%`,
   `7 hari`. Ganti dengan data riil (atribut `data-count` di `index.html`).
3. **Harga workspace** — Rp 2,5jt/tahun, Rp 850rb/bulan, Rp 4,5jt/bulan,
   Rp 200rb/jam.
4. **Data kontak** — alamat, telepon `(021) 5000-1234`, WhatsApp
   `6281200001234`, email `halo@temukarsa.id`. Nomor WhatsApp muncul di 3
   tempat: CTA banner, footer, dan tombol mengambang.
5. **Artikel** — tiga kartu artikel masih `href="#"`.
6. **Form** — `initForm()` di `main.js` baru menampilkan pesan sukses di sisi
   klien. Sambungkan ke endpoint, Formspree, atau WhatsApp API.

## Menambahkan foto

Layout sudah menyediakan slot foto; tanpa foto, latar gradien tetap tampil rapi.

- **Hero** — set di `style.css`: `.hero__photo { --hero-photo: url('../img/hero.jpg'); }`
- **Foto kantor (section Tentang)** — di `index.html`:
  `<div class="media-frame__photo" style="--photo:url('assets/img/kantor.jpg')"></div>`
- **Kartu workspace** — sama, pada `.space-card__photo` di tiap kartu.

Foto otomatis di-blend dengan gradien brand (`mix-blend-mode: luminosity`),
jadi warnanya tetap konsisten apa pun sumber fotonya.

## Catatan teknis

- Responsif di 3 breakpoint: 1180px, 980px, 680px.
- Menghormati `prefers-reduced-motion` — semua animasi dimatikan.
- Scroll reveal punya pengaman: bila `IntersectionObserver` tidak terpanggil
  (tab tersembunyi, browser lawas), konten tetap ditampilkan dan tidak
  terkunci pada `opacity: 0`.
