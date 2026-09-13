/* Hapus cookie sesi dashboard admin, balik ke halaman login. */
export async function onRequestGet() {
  const headers = new Headers({ Location: '/admin/' });
  headers.append('Set-Cookie', 'admin_session=; Path=/; HttpOnly; Max-Age=0');
  return new Response(null, { status: 302, headers });
}
