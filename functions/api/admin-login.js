/* Login dashboard admin (satu pintu buat /admin/ — Artikel & KarsaBiz),
   pakai email + password sederhana (BUKAN GitHub OAuth — itu punya Decap
   CMS sendiri, cuma dipakai pas proses commit artikel, beda lapisan sama
   login dashboard ini).

   WAJIB diisi di Cloudflare Pages -> Settings -> Environment variables:
     ADMIN_EMAIL     = email admin
     ADMIN_PASSWORD  = password admin (plain text di env var server —
                       env var Cloudflare gak pernah kekirim ke browser,
                       jadi aman; kalau mau lebih ketat lagi nanti bisa
                       diganti hash, tapi untuk skala tim kecil ini cukup)
     SESSION_SECRET  = string acak buat nandatangani cookie sesi (sama
                       persis yang dipakai fitur leads sebelumnya) */

import { signSession } from '../_lib/session.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'Server belum dikonfigurasi (ADMIN_EMAIL/ADMIN_PASSWORD/SESSION_SECRET).' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body tidak valid.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (email !== env.ADMIN_EMAIL.trim().toLowerCase() || password !== env.ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Email atau password salah.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const maxAgeSeconds = 60 * 60 * 12; // 12 jam
  const session = await signSession({ login: email, exp: Date.now() + maxAgeSeconds * 1000 }, env.SESSION_SECRET);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `admin_session=${session}; Path=/; HttpOnly; Max-Age=${maxAgeSeconds}; SameSite=Lax`,
    },
  });
}
