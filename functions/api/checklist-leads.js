/* API data buat /admin/checklist/ — submission "Checklist Dokumen Usaha".
   Disimpan di tabel Supabase YANG SAMA dengan Legal Check (`leads`), cuma
   dibedain lewat answers.formType = 'checklist-dokumen-usaha' (lihat
   assets/js/checklist.js submitChecklist()) — jadi gak perlu migrasi
   skema tabel baru. Endpoint ini filter query-nya ke formType itu doang,
   sisanya pola persis functions/api/leads.js.

   GET /api/checklist-leads          -> daftar ringkas
   GET /api/checklist-leads?id=<uuid> -> detail lengkap 1 submission

   Wajib login admin (cookie admin_session), sama kayak /api/leads. */

import { verifySession, parseCookies } from '../_lib/session.js';
import { getDemoChecklistLeads } from '../_lib/demo-leads.js';

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

  if (env.DEMO_LEADS === '1') {
    if (id) {
      const lead = getDemoChecklistLeads().find(function (l) { return l.id === id; });
      if (!lead) return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify(lead), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    const list = getDemoChecklistLeads().map(function (l) {
      return {
        id: l.id, created_at: l.created_at, nama: l.nama, whatsapp: l.whatsapp, email: l.email, status: l.status,
        jenisLayanan: l.answers.jenisLayanan,
      };
    });
    return new Response(JSON.stringify(list), { status: 200, headers: { 'Content-Type': 'application/json', 'X-Demo-Data': '1' } });
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
  restUrl.searchParams.set('answers->>formType', 'eq.checklist-dokumen-usaha');
  if (id) {
    restUrl.searchParams.set('id', `eq.${id}`);
    restUrl.searchParams.set('select', '*');
  } else {
    restUrl.searchParams.set('select', 'id,created_at,nama,whatsapp,email,status,jenisLayanan:answers->>jenisLayanan');
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

// DELETE /api/checklist-leads?id=<uuid>
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
  restUrl.searchParams.set('answers->>formType', 'eq.checklist-dokumen-usaha');

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

// PATCH /api/checklist-leads?id=<uuid>  body: { status: "baru" | "pdf_siap" }
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
  restUrl.searchParams.set('answers->>formType', 'eq.checklist-dokumen-usaha');

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
