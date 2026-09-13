/* Langkah 1 dari proses login "Login with GitHub" di /admin/articles/ (Decap CMS).
   Deploy otomatis sebagai Cloudflare Pages Function di /api/auth karena
   letaknya di folder functions/api/ — nggak perlu setup tambahan apapun,
   Cloudflare Pages baca folder functions/ pakai file-based routing sendiri.

   Alurnya: tombol Login di CMS buka jendela pop-up ke sini → endpoint ini
   redirect pop-up itu ke halaman otorisasi GitHub → lanjut ke /api/callback.

   WAJIB diisi di Cloudflare Pages → Settings → Environment variables:
     OAUTH_CLIENT_ID      = Client ID dari GitHub OAuth App
     OAUTH_CLIENT_SECRET  = Client Secret dari GitHub OAuth App (dipakai di callback.js) */
export async function onRequestGet({ request, env }) {
  const clientId = env.OAUTH_CLIENT_ID;
  if (!clientId) {
    return new Response(
      "Konfigurasi belum lengkap: environment variable OAUTH_CLIENT_ID belum diisi di Cloudflare Pages. Lihat CMS-SETUP.md.",
      { status: 500 }
    );
  }

  // "state" acak buat mencegah CSRF — disimpan di cookie sebentar, lalu
  // dicocokkan lagi pas GitHub redirect balik ke /api/callback.
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);

  const url = new URL(request.url);
  const redirectUri = `${url.origin}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
    state,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      "Set-Cookie": `decap_oauth_state=${state}; Path=/; HttpOnly; Max-Age=600; SameSite=Lax`,
    },
  });
}
