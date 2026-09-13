/* Langkah 2 (terakhir) dari proses login "Login with GitHub" di dalam
   Decap CMS (/admin/articles/) — GitHub redirect balik ke sini dengan
   sebuah "code", ditukar jadi access token, lalu dikirim balik ke jendela
   CMS lewat postMessage — protokol resmi Decap/Netlify CMS.

   Login GitHub ini KHUSUS buat Decap CMS nulis/commit ke repo — beda sama
   login dashboard admin (/admin/, email+password, lihat admin-login.js). */

import { parseCookies } from '../_lib/session.js';

function renderCmsPage(success, payload) {
  const message = success
    ? `authorization:github:success:${JSON.stringify(payload)}`
    : `authorization:github:error:${JSON.stringify(payload)}`;

  return `<!doctype html>
<html><body>
<p>${success ? 'Login berhasil, menutup jendela...' : 'Login gagal: ' + (payload && payload.message)}</p>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      ${JSON.stringify(message)},
      e.origin
    );
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener.postMessage('authorizing:github', '*');
})();
</script>
</body></html>`;
}

export async function onRequestGet({ request, env }) {
  const htmlHeaders = { 'Content-Type': 'text/html; charset=utf-8' };
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (error) {
    return new Response(renderCmsPage(false, { message: errorDescription || error }), { status: 200, headers: htmlHeaders });
  }

  const cookies = parseCookies(request.headers.get('Cookie'));
  if (!state || state !== cookies.decap_oauth_state) {
    return new Response(
      renderCmsPage(false, { message: 'State tidak cocok (link kedaluwarsa). Coba login ulang dari /admin/articles/.' }),
      { status: 200, headers: htmlHeaders }
    );
  }

  const clientId = env.OAUTH_CLIENT_ID;
  const clientSecret = env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return new Response(
      renderCmsPage(false, { message: 'OAUTH_CLIENT_ID / OAUTH_CLIENT_SECRET belum diisi di Cloudflare Pages.' }),
      { status: 200, headers: htmlHeaders }
    );
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return new Response(
        renderCmsPage(false, { message: tokenData.error_description || 'Gagal mendapatkan token dari GitHub.' }),
        { status: 200, headers: htmlHeaders }
      );
    }

    return new Response(renderCmsPage(true, { token: tokenData.access_token, provider: 'github' }), {
      status: 200,
      headers: { ...htmlHeaders, 'Set-Cookie': 'decap_oauth_state=; Path=/; HttpOnly; Max-Age=0' },
    });
  } catch (err) {
    return new Response(renderCmsPage(false, { message: String(err) }), { status: 200, headers: htmlHeaders });
  }
}
