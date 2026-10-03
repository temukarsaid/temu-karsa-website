/* Traffic website buat dashboard admin, dibaca dari Google Analytics 4
   (GA4 Data API) — biar owner/admin gak perlu buka GA.

   GET /api/analytics?days=7|30|90

   Wajib login admin (cookie admin_session). Kredensial GA cuma ada di env
   server (Cloudflare Pages → Settings → Environment variables, atau
   .dev.vars lokal), gak pernah dikirim ke browser:
     GA4_PROPERTY_ID    angka property id, mis. 412345678 (BUKAN G-XXXX)
     GA4_CLIENT_EMAIL   email service account, …@….iam.gserviceaccount.com
     GA4_PRIVATE_KEY    private_key dari file JSON service account (PEM;
                        "\n" literal dibolehin, diubah jadi newline asli)
   Service account-nya harus ditambah sebagai Viewer di property GA4.

   DEMO_LEADS=1 → balikin data contoh (header X-Demo-Data: 1), sama kayak
   endpoint leads. Kalau env GA belum diisi → 503 { error: 'not_configured' }
   supaya dashboard bisa nampilin langkah setup, bukan angka palsu. */

import { verifySession, parseCookies } from '../_lib/session.js';

const TOOL_PAGES = { lc: '/legal-check.html', cl: '/checklist-dokumen-usaha.html' };
const json = (body, status, extra) => new Response(JSON.stringify(body), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, extra || {}),
});

async function requireSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const cookies = parseCookies(request.headers.get('Cookie'));
  return verifySession(cookies.admin_session, env.SESSION_SECRET);
}

/* ------------------------------------------------------------ Google auth */
function b64url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = '';
  bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function importKey(pem) {
  const body = pem.replace(/\\n/g, '\n').replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(body), function (c) { return c.charCodeAt(0); });
  return crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

// Token disimpan per isolate sampai ~1 menit sebelum kedaluwarsa.
let tokenCache = null;
async function accessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) return tokenCache.token;
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: env.GA4_CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const key = await importKey(env.GA4_PRIVATE_KEY);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(header + '.' + claims));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + header + '.' + claims + '.' + b64url(sig),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Login ke Google gagal: ' + (data.error_description || data.error || res.status));
  tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return tokenCache.token;
}

/* -------------------------------------------------------------- GA4 query */
function range(days, offset) {
  return { startDate: (days - 1 + offset) + 'daysAgo', endDate: offset ? offset + 'daysAgo' : 'today' };
}

function rowsOf(report) { return (report && report.rows) || []; }
function val(row, i) { return Number(row.metricValues[i].value) || 0; }

async function fetchGa(env, days) {
  const token = await accessToken(env);
  const cur = range(days, 0);
  const prev = range(days, days);
  const res = await fetch('https://analyticsdata.googleapis.com/v1beta/properties/' + env.GA4_PROPERTY_ID + ':batchRunReports', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        { dateRanges: [cur], dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400 },
        { dateRanges: [cur, prev], metrics: [{ name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' }, { name: 'screenPageViews' }] },
        { dateRanges: [cur], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }], orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 8 },
        { dateRanges: [cur], dimensions: [{ name: 'sessionDefaultChannelGroup' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 },
        {
          dateRanges: [cur], dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'activeUsers' }],
          dimensionFilter: { filter: { fieldName: 'pagePath', inListFilter: { values: [TOOL_PAGES.lc, TOOL_PAGES.cl, TOOL_PAGES.lc.replace('.html', ''), TOOL_PAGES.cl.replace('.html', '')] } } },
        },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('Google Analytics menolak permintaan: ' + ((data.error && data.error.message) || res.status));
  const r = data.reports || [];

  // date "20260915" → "2026-09-15"
  const daily = rowsOf(r[0]).map(function (row) {
    const d = row.dimensionValues[0].value;
    return { date: d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8), users: val(row, 0), sessions: val(row, 1), views: val(row, 2) };
  });

  // Dengan dua dateRange, GA nambah dimensi "dateRange" (date_range_0/1).
  const totals = { current: null, previous: null };
  rowsOf(r[1]).forEach(function (row) {
    const which = row.dimensionValues && row.dimensionValues[0] && row.dimensionValues[0].value === 'date_range_1' ? 'previous' : 'current';
    totals[which] = { users: val(row, 0), newUsers: val(row, 1), sessions: val(row, 2), views: val(row, 3) };
  });

  const pages = rowsOf(r[2]).map(function (row) { return { path: row.dimensionValues[0].value, views: val(row, 0), users: val(row, 1) }; });
  const sources = rowsOf(r[3]).map(function (row) { return { channel: row.dimensionValues[0].value, sessions: val(row, 0) }; });
  const toolVisitors = { lc: 0, cl: 0 };
  rowsOf(r[4]).forEach(function (row) {
    const p = row.dimensionValues[0].value;
    if (p.indexOf('legal-check') !== -1) toolVisitors.lc += val(row, 0);
    if (p.indexOf('checklist-dokumen-usaha') !== -1) toolVisitors.cl += val(row, 0);
  });

  return { source: 'ga4', days: days, daily: daily, totals: totals, pages: pages, sources: sources, toolVisitors: toolVisitors };
}

/* ------------------------------------------------------------- Demo data */
function seeded(seed) {
  let a = seed;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function demoTraffic(days) {
  const DAY = 86400000;
  const rng = seeded(20261002);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const all = [];
  for (let i = 2 * days - 1; i >= 0; i--) {
    const t = today.getTime() - i * DAY;
    const dow = new Date(t).getDay();
    const growth = 1 - i / (2 * days) * 0.35;
    const weekday = dow === 0 || dow === 6 ? 0.62 : 1;
    const users = Math.round((70 + rng() * 45) * growth * weekday);
    const sessions = Math.round(users * (1.15 + rng() * 0.15));
    const d = new Date(t);
    all.push({
      date: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'),
      users: users, sessions: sessions, views: Math.round(sessions * (2.3 + rng() * 0.6)),
    });
  }
  const daily = all.slice(days);
  const sum = function (list, k) { return list.reduce(function (s, x) { return s + x[k]; }, 0); };
  const total = function (list) {
    const users = Math.round(sum(list, 'users') * 0.78); // pengguna unik < jumlah harian
    return { users: users, newUsers: Math.round(users * 0.71), sessions: sum(list, 'sessions'), views: sum(list, 'views') };
  };
  const views = sum(daily, 'views');
  const share = [
    ['/', 0.27], ['/legal-check.html', 0.11], ['/karsabiz.html', 0.08], ['/virtual-office.html', 0.07],
    ['/pendirian-badan-usaha.html', 0.06], ['/kbli-2025.html', 0.05], ['/checklist-dokumen-usaha.html', 0.04], ['/kontak.html', 0.04],
  ];
  const sessions = sum(daily, 'sessions');
  const users = total(daily).users;
  return {
    source: 'demo',
    days: days,
    daily: daily,
    totals: { current: total(daily), previous: total(all.slice(0, days)) },
    pages: share.map(function (p) { return { path: p[0], views: Math.round(views * p[1]), users: Math.round(users * p[1] * 1.4) }; }),
    sources: [['Organic Search', 0.48], ['Direct', 0.24], ['Organic Social', 0.15], ['Referral', 0.08], ['Unassigned', 0.05]]
      .map(function (s) { return { channel: s[0], sessions: Math.round(sessions * s[1]) }; }),
    toolVisitors: { lc: Math.round(users * 0.14), cl: Math.round(users * 0.06) },
  };
}

/* --------------------------------------------------------------- Handler */
const reportCache = new Map();

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'unauthorized' }, 401);

  const asked = Number(new URL(request.url).searchParams.get('days'));
  const days = [7, 30, 90].indexOf(asked) !== -1 ? asked : 30;

  if (env.DEMO_LEADS === '1') return json(demoTraffic(days), 200, { 'X-Demo-Data': '1' });

  if (!env.GA4_PROPERTY_ID || !env.GA4_CLIENT_EMAIL || !env.GA4_PRIVATE_KEY) {
    return json({ error: 'not_configured' }, 503);
  }

  // GA4 Data API ada kuota per property — hasil disimpan 10 menit per periode.
  const cached = reportCache.get(days);
  if (cached && cached.until > Date.now()) return json(cached.data);

  try {
    const data = await fetchGa(env, days);
    reportCache.set(days, { data: data, until: Date.now() + 10 * 60000 });
    return json(data);
  } catch (err) {
    return json({ error: String(err.message || err) }, 502);
  }
}
