# sw-backend (Cloudflare Worker)

## Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/share` | Save read-only profile JSON (D1) |
| `GET` | `/share?id=…` | Load profile |
| `GET` | `/swarfarm/*` | Proxy to `https://swarfarm.com/*` with CORS |

## Deploy

```bash
cd worker
npm i -g wrangler   # or use npx wrangler
wrangler d1 execute swf-db --remote --file=./schema.sql   # once, if table missing
wrangler deploy
```

After deploy, in `js/core/meta.js` set:

```js
const SWRM_SWARFARM_PROXY_STATIC = true;
```

Then `npm run build:ui` and push Pages.

Until then, static icons load directly from `swarfarm.com` (default `false`).

## Local frontend (Live Server)

`http://127.0.0.1:5500` calls `https://sw-backend.antajltube.workers.dev` — works once Worker is deployed and CORS is `*` (included).

Share and Swarfarm proxy do **not** require the frontend to be on the same origin as the Worker.
