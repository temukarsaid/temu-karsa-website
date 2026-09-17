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

http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';

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
