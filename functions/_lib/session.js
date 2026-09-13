/* Session cookie ringan buat halaman /admin/leads/ — nggak butuh database
   session terpisah, cukup cookie yang ditandatangani (HMAC-SHA256) pakai
   SESSION_SECRET (env var rahasia, cuma ada di server). Isinya cuma
   {login, exp}, jadi tinggal verifikasi tanda tangannya + expiry tiap ada
   request ke /api/leads, gak perlu nyimpen apa-apa di server.

   Dipakai bareng oleh functions/api/callback.js (yang nerbitin cookie-nya)
   dan functions/api/leads.js (yang verifikasi). */

function b64url(bytes) {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload, secret) {
  const key = await hmacKey(secret);
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sigBytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body)));
  return `${body}.${b64url(sigBytes)}`;
}

// Balikin payload-nya kalau tanda tangan valid & belum expired, null kalau enggak.
export async function verifySession(cookieValue, secret) {
  if (!cookieValue || cookieValue.indexOf('.') === -1) return null;
  const [body, sig] = cookieValue.split('.');
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), new TextEncoder().encode(body));
  if (!valid) return null;
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
  } catch {
    return null;
  }
  if (!payload.exp || Date.now() > payload.exp) return null;
  return payload;
}

export function parseCookies(header) {
  const out = {};
  (header || '').split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  });
  return out;
}
