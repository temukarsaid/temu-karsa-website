/* API data buat section KarsaBiz di /admin/leads/ — satu-satunya tempat
   yang boleh pegang SUPABASE_SERVICE_ROLE_KEY (env var rahasia, cuma ada
   di server, gak pernah dikirim ke browser). Halaman admin/leads/index.html
   cuma manggil endpoint INI, gak pernah connect ke Supabase langsung dari
   browser.

   GET /api/leads          -> daftar ringkas semua lead (buat tabel)
   GET /api/leads?id=<uuid> -> detail lengkap 1 lead (buat tampilan cetak PDF)

   Wajib login dulu ke dashboard admin (cookie admin_session dari
   admin-login.js) — kalau enggak, balikin 401. */

import { verifySession, parseCookies } from '../_lib/session.js';
import { DEMO_LEADS } from '../_lib/demo-leads.js';

async function requireSession(request, env) {
  if (!env.SESSION_SECRET) return null;
  const cookies = parseCookies(request.headers.get('Cookie'));
  return verifySession(cookies.admin_session, env.SESSION_SECRET);
}

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  // Mode demo — cuma buat coba-coba tampilan lokal, TIDAK boleh dipasang
  // di Cloudflare Pages produksi. Diaktifin lewat DEMO_LEADS=1 di .dev.vars.
  if (env.DEMO_LEADS === '1') {
    if (id) {
      const lead = DEMO_LEADS.find(function (l) { return l.id === id; });
      if (!lead) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(lead), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const list = DEMO_LEADS.map(function (l) {
      return {
        id: l.id, created_at: l.created_at, nama: l.nama, whatsapp: l.whatsapp, email: l.email, status: l.status,
        kategori: l.answers.q2, bentuk: l.answers.q1,
      };
    });
    return new Response(JSON.stringify(list), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: 'Server belum dikonfigurasi (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supaHeaders = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };

  const restUrl = new URL(`${env.SUPABASE_URL}/rest/v1/leads`);
  if (id) {
    restUrl.searchParams.set('id', `eq.${id}`);
    restUrl.searchParams.set('select', '*');
  } else {
    // Daftar ringkas doang buat tabel — kolom jsonb berat (answers dkk)
    // gak perlu ditarik penuh di sini, baru diambil pas buka detail satu
    // lead. "kategori"/"bentuk" ditarik ringan langsung dari dalam jsonb
    // (bukan full jsonb-nya) buat kebutuhan chart di Dashboard.
    restUrl.searchParams.set('select', 'id,created_at,nama,whatsapp,email,status,kategori:answers->>q2,bentuk:answers->>q1');
    restUrl.searchParams.set('order', 'created_at.desc');
  }

  const res = await fetch(restUrl, { headers: supaHeaders });
  if (!res.ok) {
    const text = await res.text();
    return new Response(JSON.stringify({ error: `Supabase error: ${text}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const data = await res.json();

  if (id) {
    if (!data.length) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify(data[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
