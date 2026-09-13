/* Baca semua eleventy/articles/*.json jadi 1 array "articles" — data global
   yang bisa diakses di template manapun ({{ articles }}), dipakai buat:
   - pagination (bikin 1 halaman HTML per artikel)
   - render "Artikel Terbaru Lainnya" (lookup artikel lain by slug)
   Urutan: terbaru duluan (berdasarkan field "date" di tiap JSON). */
const fs = require("fs");
const path = require("path");

// sama persis dengan filter "slugify" di .eleventy.js — dipakai di sini buat
// auto-generate id section dari judulnya, jadi tim CMS nggak perlu isi field
// "ID Section" manual sama sekali.
function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function formatDateID(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

// CMS (Decap) nyimpen tiap blok section pakai field flat sesuai "type"-nya
// (text / table_section / quote_section) — fungsi ini yang mengubahnya jadi
// bentuk seragam {heading, body, table, quote, id, showInToc} yang dipakai
// article-layout.njk, supaya template nggak perlu tau soal tipe-tipe CMS itu.
function normalizeSection(s) {
  if (s.type === "quote_section") {
    return { quote: s.quote };
  }
  if (s.type === "table_section") {
    return {
      id: s.id || (s.heading ? slugify(s.heading) : undefined),
      heading: s.heading,
      wide: true,
      body: "",
      table: {
        split: !!s.table_split,
        headers: s.table_headers,
        rows: s.table_rows || [],
      },
      showInToc: s.showInToc !== false,
    };
  }
  if (s.type === "text") {
    return {
      id: s.id || (s.heading ? slugify(s.heading) : undefined),
      heading: s.heading,
      body: s.body,
      showInToc: s.showInToc,
    };
  }
  // Bentuk lama (artikel migrasi awal, ditulis langsung sebagai JSON tanpa
  // lewat CMS) — sudah cocok dengan yang diharapkan template, tinggal
  // lengkapi id-nya kalau belum ada.
  if (s.heading && !s.id) s.id = slugify(s.heading);
  return s;
}

module.exports = () => {
  const dir = path.join(__dirname, "..", "articles");
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      const data = JSON.parse(raw);
      data.slug = data.slug || f.replace(/\.json$/, "");
      data.dateDisplay = data.dateDisplay || formatDateID(data.date);
      // Tim CMS nggak isi field ini manual lagi — dipakai di pesan WA
      // otomatis tombol "Hubungi Kami" ("...konsultasi gratis mengenai
      // {ctaTopic}."), jadi fallback-nya pakai judul artikel apa adanya.
      data.ctaTopic = data.ctaTopic || data.title;
      data.sections = (data.sections || []).map(normalizeSection);
      return data;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
};
