/* Static file server sederhana untuk preview lokal Temu Karsa.
   Jalankan: node server.js  →  http://localhost:4321 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 4321;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const ARTICLES_DIR = path.join(ROOT, 'eleventy', 'articles');
const IMAGES_DIR = path.join(ROOT, 'assets', 'img', 'artikel');

function isValidSlug(slug) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

function isValidFilename(name) {
  return /^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+$/.test(name) && !name.includes('..');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  // Dukung CORS untuk dev lokal jika diakses beda port/origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';

  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const parts = urlObj.pathname.split('/').filter(Boolean);

  // Penanganan endpoint artikel & upload gambar lokal
  if (parts[0] === 'articles') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // GET /articles — daftar semua artikel
    if (!parts[1] && req.method === 'GET') {
      try {
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
        const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.json'));
        const articles = files.map((f) => {
          const data = JSON.parse(fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8'));
          data.slug = data.slug || f.replace(/\.json$/, '');
          return data;
        });
        articles.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.writeHead(200);
        res.end(JSON.stringify({ articles }));
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    // POST / DELETE /articles/:slug
    if (parts[1]) {
      const slug = parts[1];
      if (!isValidSlug(slug)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Slug tidak valid. Cuma boleh huruf kecil, angka, dan tanda hubung.' }));
        return;
      }
      const filePath = path.join(ARTICLES_DIR, `${slug}.json`);

      if (req.method === 'POST') {
        try {
          const body = await readBody(req);
          const article = JSON.parse(body.toString('utf8'));
          if (!article.title || !article.slug) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Field "title" dan "slug" wajib diisi.' }));
            return;
          }
          fs.mkdirSync(ARTICLES_DIR, { recursive: true });
          fs.writeFileSync(filePath, JSON.stringify(article, null, 2) + '\n', 'utf8');
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, slug }));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: err.message || 'Body bukan JSON valid.' }));
        }
        return;
      }

      if (req.method === 'DELETE') {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
        return;
      }
    }
  }

  if (parts[0] === 'upload-image' && req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const body = await readBody(req);
      const payload = JSON.parse(body.toString('utf8'));
      const { filename, dataBase64 } = payload || {};
      if (!filename || !isValidFilename(filename)) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Nama file gambar tidak valid.' }));
        return;
      }
      if (!dataBase64) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Data gambar kosong.' }));
        return;
      }
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
      const bytes = Buffer.from(dataBase64, 'base64');
      fs.writeFileSync(path.join(IMAGES_DIR, filename), bytes);
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, path: `assets/img/artikel/${filename}` }));
    } catch (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: err.message || 'Upload gagal.' }));
    }
    return;
  }

  let file = path.join(ROOT, path.normalize(rel).replace(/^([\\/])+/, ''));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  // Penanganan API lokal (mock Cloudflare Pages Functions)
  if (rel.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    const cookieHeader = req.headers.cookie || '';
    const isLoggedIn = cookieHeader.includes('admin_session=dev_mock_session');

    if (rel === '/api/admin-login') {
      res.setHeader('Set-Cookie', 'admin_session=dev_mock_session; Path=/; HttpOnly; SameSite=Lax');
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    if (rel === '/api/admin-me') {
      if (isLoggedIn) {
        res.writeHead(200);
        res.end(JSON.stringify({ login: 'admin@temukarsa.id' }));
      } else {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'Belum login' }));
      }
      return;
    }
    if (rel === '/api/admin-logout') {
      res.setHeader('Set-Cookie', 'admin_session=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      res.writeHead(302, { Location: '/admin/' });
      res.end();
      return;
    }
    if (rel.startsWith('/api/leads')) {
      const LEADS_FILE = path.join(ROOT, '.gemini', 'local_leads.json');
      function readLocalLeads() {
        try {
          if (fs.existsSync(LEADS_FILE)) {
            return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
          }
        } catch(e) {}
        return [
          {
            id: '11111111-aaaa-4bbb-8ccc-000000000001',
            created_at: '2026-09-10T03:24:00.000Z',
            nama: 'Siti Rahmawati',
            whatsapp: '0812-3456-7890',
            email: 'siti.rahmawati@gmail.com',
            status: 'pdf_siap',
            answers: { q1: 'perorangan', q2: 'makanan', kemasan: 'kering', bahan: 'kering', q5: 'rumah', q6: 'lokal', q7: 'tidak-berdampak' },
            recommendations: [
              { label: 'NIB (Nomor Induk Berusaha)', description: 'Identitas legalitas utama pelaku usaha', status: 'wajib', statusLabel: 'Wajib' },
              { label: 'Sertifikat Halal Self-Declare', description: 'Wajib untuk produk makanan & minuman', status: 'wajib', statusLabel: 'Wajib' }
            ],
            kbli_matched: [{ code: '10799', title: 'Industri Produk Makanan Lainnya' }]
          }
        ];
      }
      function saveLocalLeads(data) {
        try {
          const dir = path.dirname(LEADS_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(LEADS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } catch(e) {}
      }

      let localLeads = readLocalLeads();
      const urlObj = new URL(req.url, 'http://localhost');
      const leadId = urlObj.searchParams.get('id');

      if (req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(bodyStr);
            const newLead = {
              id: 'local-' + Date.now(),
              created_at: new Date().toISOString(),
              status: 'baru',
              ...data
            };
            localLeads.unshift(newLead);
            saveLocalLeads(localLeads);
            console.log('[DevServer] Lead baru berhasil disimpan:', newLead.nama);
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, lead: newLead }));
          } catch(e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Data JSON tidak valid' }));
          }
        });
        return;
      }

      if (req.method === 'PATCH' && leadId) {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(bodyStr);
            const item = localLeads.find(l => l.id === leadId);
            if (item) {
              Object.assign(item, data);
              saveLocalLeads(localLeads);
            }
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true }));
          } catch(e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Gagal update' }));
          }
        });
        return;
      }

      if (req.method === 'DELETE' && leadId) {
        localLeads = localLeads.filter(l => l.id !== leadId);
        saveLocalLeads(localLeads);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (leadId) {
        const item = localLeads.find(l => l.id === leadId);
        if (item) {
          res.writeHead(200);
          res.end(JSON.stringify(item));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Lead tidak ditemukan' }));
        }
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify(localLeads));
      return;
    }
    if (rel.startsWith('/api/checklist-leads')) {
      const CHECKLIST_FILE = path.join(ROOT, '.gemini', 'local_checklist.json');
      function readLocalChecklist() {
        try {
          if (fs.existsSync(CHECKLIST_FILE)) {
            return JSON.parse(fs.readFileSync(CHECKLIST_FILE, 'utf-8'));
          }
        } catch(e) {}
        return [
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
                { nama: 'Budi Santoso', nik: '3201234567890001', alamat: 'Jl. Melati III No. 12, RT 004/RW 007, Cibinong', saham: '60' },
                { nama: 'Siti Aminah', nik: '3201234567890002', alamat: 'Jl. Sudirman No. 5, Bekasi Timur', saham: '40' }
              ],
              npwpList: [{ nama: 'Budi Santoso', npwp: '3201234567890001' }],
              companyNames: ['Maju Jaya Sentosa', 'Karya Abadi Makmur'],
              businessAddress: 'Ruko Taman Juanda, Bekasi Timur',
              modalDasar: '50000000',
              modalDisetor: '12500000'
            }
          }
        ];
      }
      function saveLocalChecklist(data) {
        try {
          const dir = path.dirname(CHECKLIST_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(CHECKLIST_FILE, JSON.stringify(data, null, 2), 'utf-8');
        } catch(e) {}
      }

      let localChecklist = readLocalChecklist();
      const urlObj = new URL(req.url, 'http://localhost');
      const leadId = urlObj.searchParams.get('id');

      if (req.method === 'POST') {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(bodyStr);
            const newLead = {
              id: 'local-cl-' + Date.now(),
              created_at: new Date().toISOString(),
              status: 'baru',
              ...data
            };
            localChecklist.unshift(newLead);
            saveLocalChecklist(localChecklist);
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true, lead: newLead }));
          } catch(e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Data JSON tidak valid' }));
          }
        });
        return;
      }

      if (req.method === 'PATCH' && leadId) {
        let bodyStr = '';
        req.on('data', chunk => { bodyStr += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(bodyStr);
            const item = localChecklist.find(l => l.id === leadId);
            if (item) {
              Object.assign(item, data);
              saveLocalChecklist(localChecklist);
            }
            res.writeHead(200);
            res.end(JSON.stringify({ ok: true }));
          } catch(e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Gagal update' }));
          }
        });
        return;
      }

      if (req.method === 'DELETE' && leadId) {
        localChecklist = localChecklist.filter(l => l.id !== leadId);
        saveLocalChecklist(localChecklist);
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (leadId) {
        const item = localChecklist.find(l => l.id === leadId);
        if (item) {
          res.writeHead(200);
          res.end(JSON.stringify(item));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Checklist lead tidak ditemukan' }));
        }
        return;
      }

      res.writeHead(200);
      res.end(JSON.stringify(localChecklist));
      return;
    }

    if (rel.startsWith('/api/analytics')) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        totals: {
          current: { users: 142, newUsers: 110, sessions: 185, views: 320 },
          previous: { users: 120, newUsers: 95, sessions: 160, views: 280 }
        },
        toolVisitors: { lc: 85, cl: 45 },
        clicks: {
          current: { all: 28, unique: 22 },
          previous: { all: 20, unique: 16 }
        },
        daily: [
          { date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10), users: 40, sessions: 52, views: 90 },
          { date: new Date(Date.now() - 86400000).toISOString().slice(0, 10), users: 48, sessions: 60, views: 110 },
          { date: new Date().toISOString().slice(0, 10), users: 54, sessions: 73, views: 120 }
        ],
        pages: [
          { path: '/', views: 140 },
          { path: '/karsabiz.html', views: 95 },
          { path: '/artikel/', views: 85 }
        ],
        sources: [
          { channel: 'Direct', sessions: 90 },
          { channel: 'Organic Search', sessions: 65 },
          { channel: 'Social', sessions: 30 }
        ]
      }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint API tidak ditemukan di server dev lokal.' }));
    return;
  }

  // Jika request mengarah ke direktori, arahkan ke index.html di direktori tersebut
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('Temu Karsa dev server → http://localhost:' + PORT);
});
