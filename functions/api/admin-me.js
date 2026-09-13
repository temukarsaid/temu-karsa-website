/* Cek cepat: sesi dashboard admin masih valid atau enggak. Dipakai sama
   semua halaman di bawah /admin/ (index, leads) buat mutusin nampilin
   form login atau isi dashboard-nya. */
import { verifySession, parseCookies } from '../_lib/session.js';

export async function onRequestGet({ request, env }) {
  if (!env.SESSION_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const cookies = parseCookies(request.headers.get('Cookie'));
  const session = await verifySession(cookies.admin_session, env.SESSION_SECRET);
  if (!session) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ ok: true, login: session.login }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
