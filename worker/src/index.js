/**
 * sw-backend — Cloudflare Worker
 * Routes:
 *   POST /share          — store read-only profile (D1)
 *   GET  /share?id=…     — load profile
 *   GET  /swarfarm/*     — proxy SWARFARM static + API (CORS)
 *   OPTIONS *            — CORS preflight
 */

const SWARFARM_ORIGIN = 'https://swarfarm.com';
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200, extra = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS, ...extra });
  return new Response(JSON.stringify(data), { status, headers });
}

function withCors(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}

function newShareId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function handleSharePost(request, env) {
  if (!env.DB) {
    return json({ error: 'Database not configured', message: 'D1 binding missing on worker' }, 503);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  const wizardName = String(body.wizard_name || '').trim();
  const data = body.data != null ? String(body.data) : '';
  const expiresAt = Number(body.expires_at) || 0;
  if (!data) return json({ error: 'Missing data' }, 400);

  const createdAt = Math.floor(Date.now() / 1000);
  let id = newShareId();

  if (wizardName) {
    const existing = await env.DB.prepare(
      `SELECT id FROM shares WHERE wizard_name = ? ORDER BY created_at DESC LIMIT 1`,
    )
      .bind(wizardName)
      .first();
    if (existing && existing.id) {
      id = existing.id;
      await env.DB.prepare(
        `UPDATE shares SET data = ?, expires_at = ?, created_at = ? WHERE id = ?`,
      )
        .bind(data, expiresAt, createdAt, id)
        .run();
      return json({ id, replaced: true });
    }
  }

  await env.DB.prepare(
    `INSERT INTO shares (id, wizard_name, data, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(id, wizardName, data, expiresAt, createdAt)
    .run();

  return json({ id });
}

async function handleShareGet(url, env) {
  const id = url.searchParams.get('id') || '';
  if (!id) return json({ error: 'Missing id' }, 400);

  const row = await env.DB.prepare(
    `SELECT id, wizard_name, data, expires_at FROM shares WHERE id = ?`,
  )
    .bind(id)
    .first();

  if (!row) return json({ error: 'Not found' }, 404);

  const now = Math.floor(Date.now() / 1000);
  if (row.expires_at && Number(row.expires_at) > 0 && now > Number(row.expires_at)) {
    return json({ error: 'Expired' }, 410);
  }

  return json({
    id: row.id,
    wizard_name: row.wizard_name || '',
    data: row.data,
    expires_at: row.expires_at,
  });
}

async function handleSwarfarmProxy(request, url) {
  let path = url.pathname.replace(/^\/swarfarm\/?/, '');
  if (!path) path = '';
  const target = `${SWARFARM_ORIGIN}/${path}${url.search}`;

  const upstreamHeaders = new Headers();
  const accept = request.headers.get('Accept');
  if (accept) upstreamHeaders.set('Accept', accept);
  upstreamHeaders.set('User-Agent', 'sw-forge-proxy/1.0 (+https://sw-forge.pages.dev)');

  const method = request.method === 'HEAD' ? 'HEAD' : 'GET';
  const upstream = await fetch(target, { method, headers: upstreamHeaders, redirect: 'follow' });

  const headers = new Headers();
  const pass = ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified'];
  for (const key of pass) {
    const v = upstream.headers.get(key);
    if (v) headers.set(key, v);
  }
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Expose-Headers', 'Content-Type, Content-Length, ETag');
  headers.set('Cache-Control', upstream.headers.get('Cache-Control') || 'public, max-age=86400');

  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    try {
      if (url.pathname.startsWith('/swarfarm')) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          return json({ error: 'Method not allowed' }, 405);
        }
        return handleSwarfarmProxy(request, url);
      }

      if (url.pathname === '/share' || url.pathname === '/share/') {
        if (request.method === 'POST') return withCors(await handleSharePost(request, env));
        if (request.method === 'GET') return withCors(await handleShareGet(url, env));
        return json({ error: 'Method not allowed' }, 405);
      }

      return json({ error: 'Not found' }, 404);
    } catch (e) {
      console.error(e);
      return json({ error: 'Internal error', message: String(e.message || e) }, 500);
    }
  },
};
