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

// DELETE /api/leads?id=<uuid> -> hapus 1 lead permanen dari Supabase.
export async function onRequestDelete({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'id wajib diisi' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (env.DEMO_LEADS === '1') {
    // Mode demo cuma buat coba-coba tampilan lokal — gak ada tempat nyimpen
    // beneran buat dihapus, jadi anggap sukses aja tanpa efek apa-apa.
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
  restUrl.searchParams.set('id', `eq.${id}`);

  const res = await fetch(restUrl, { method: 'DELETE', headers: supaHeaders });
  if (!res.ok) {
    const text = await res.text();
    return new Response(JSON.stringify({ error: `Supabase error: ${text}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

// PATCH /api/leads?id=<uuid>  body: { status: "baru" | "pdf_siap" }
// -> admin tandai manual status lead (dulu ini otomatis lewat trigger yang
// udah dimatiin — sekarang murni aksi manual admin, biar sesuai fakta
// "udah dikirim beneran" bukan "berhasil generate PDF di server").
export async function onRequestPatch({ request, env }) {
  const session = await requireSession(request, env);
  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'id wajib diisi' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Body request gak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (body.status !== 'baru' && body.status !== 'pdf_siap') {
    return new Response(JSON.stringify({ error: 'status harus "baru" atau "pdf_siap"' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (env.DEMO_LEADS === '1') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };

  const restUrl = new URL(`${env.SUPABASE_URL}/rest/v1/leads`);
  restUrl.searchParams.set('id', `eq.${id}`);

  const res = await fetch(restUrl, {
    method: 'PATCH',
    headers: supaHeaders,
    body: JSON.stringify({ status: body.status }),
  });
  if (!res.ok) {
    const text = await res.text();
    return new Response(JSON.stringify({ error: `Supabase error: ${text}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
