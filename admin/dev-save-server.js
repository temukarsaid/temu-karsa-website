/* Server simpan lokal buat form artikel custom (admin/articles/edit.html).
   Jalankan manual di terminal terpisah: node admin/dev-save-server.js
   (atau: npm run admin:save) — bareng-bareng sama `wrangler pages dev` yang
   biasa dipakai buat admin/dashboard/leads.

   KENAPA PROSES TERPISAH, BUKAN Cloudflare Pages Function (functions/api/):
   Pages Functions jalan di runtime workerd (sama kayak Cloudflare Workers)
   — itu SELALU sandboxed, gak punya akses filesystem OS sama sekali, baik
   di production maupun di `wrangler pages dev` lokal. Nulis file artikel
   (eleventy/articles/*.json) & gambar (assets/img/artikel/*) HARUS lewat
   proses Node beneran yang punya akses `fs` — makanya server kecil sendiri
   di sini, pola yang sama kayak `npx decap-server` sebelumnya (cuma versi
   kita sendiri, jauh lebih simpel & gak gantung ke library orang).

   SCOPE: local dev doang. Belum ada jalur commit ke GitHub — itu nanti
   kerjaan terpisah begitu situsnya beneran mau di-deploy (repo GitHub-nya
   sendiri belum di-setup). Endpoint di sini nulis LANGSUNG ke disk lokal. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'eleventy', 'articles');
const IMAGES_DIR = path.join(ROOT, 'assets', 'img', 'artikel');
const PORT = process.env.PORT || 8082;

// Origin admin (wrangler pages dev) yang boleh fetch cross-origin ke sini.
const ALLOWED_ORIGIN = 'http://localhost:8788';

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, data) {
  withCors(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Slug cuma boleh huruf kecil/angka/tanda hubung — mencegah path traversal
// (mis. "../../secret") lewat parameter URL.
function isValidSlug(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// Nama file gambar: huruf/angka/titik/tanda hubung/underscore doang, harus
// ada ekstensi — sama alasannya kayak validasi slug di atas.
function isValidFilename(name) {
  return /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(name) && !name.includes('..');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    withCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean);

  try {
    // GET /articles — daftar semua artikel (baca langsung dari disk), biar
    // halaman admin nggak perlu nyimpen daftar slug manual lagi kayak
    // sebelumnya (ARTICLE_SLUGS) — otomatis kebaca begitu ada artikel baru
    // dibuat/dihapus lewat form ini.
    if (parts[0] === 'articles' && !parts[1] && req.method === 'GET') {
      fs.mkdirSync(ARTICLES_DIR, { recursive: true });
      const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.json'));
      const articles = files.map((f) => {
        const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8'));
        data.slug = data.slug || f.replace(/\.json$/, '');
        return data;
      });
      articles.sort((a, b) => new Date(b.date) - new Date(a.date));
      return sendJson(res, 200, { articles });
    }

    // POST/DELETE /articles/:slug
    if (parts[0] === 'articles' && parts[1]) {
      const slug = parts[1];
      if (!isValidSlug(slug)) {
        return sendJson(res, 400, { error: 'Slug tidak valid. Cuma boleh huruf kecil, angka, dan tanda hubung.' });
      }
      const filePath = path.join(ARTICLES_DIR, `${slug}.json`);

      if (req.method === 'POST') {
        const body = await readBody(req);
        let article;
        try {
          article = JSON.parse(body.toString('utf8'));
        } catch {
          return sendJson(res, 400, { error: 'Body bukan JSON valid.' });
        }
        if (!article.title || !article.slug) {
          return sendJson(res, 400, { error: 'Field "title" dan "slug" wajib diisi.' });
        }
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(article, null, 2) + '\n', 'utf8');
        return sendJson(res, 200, { ok: true, slug });
      }

      if (req.method === 'DELETE') {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return sendJson(res, 200, { ok: true });
      }
    }

    // POST /upload-image — body: { filename, dataBase64 }
    if (parts[0] === 'upload-image' && req.method === 'POST') {
      const body = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(body.toString('utf8'));
      } catch {
        return sendJson(res, 400, { error: 'Body bukan JSON valid.' });
      }
      const { filename, dataBase64 } = payload || {};
      if (!filename || !isValidFilename(filename)) {
        return sendJson(res, 400, { error: 'Nama file gambar tidak valid.' });
      }
      if (!dataBase64) {
        return sendJson(res, 400, { error: 'Data gambar kosong.' });
      }
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
      const bytes = Buffer.from(dataBase64, 'base64');
      fs.writeFileSync(path.join(IMAGES_DIR, filename), bytes);
      return sendJson(res, 200, { ok: true, path: `assets/img/artikel/${filename}` });
    }

    sendJson(res, 404, { error: 'Route tidak ditemukan.' });
  } catch (err) {
    sendJson(res, 500, { error: String((err && err.message) || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Admin save-server (local dev) -> http://localhost:${PORT}`);
  console.log(`Nulis artikel ke: ${ARTICLES_DIR}`);
  console.log(`Nulis gambar ke:  ${IMAGES_DIR}`);
});
