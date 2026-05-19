# sw-backend (Cloudflare Worker)

## Routes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/share` | Save read-only profile JSON (D1) |
| `GET` | `/share?id=…` | Load profile |
| `GET` | `/swarfarm/*` | Proxy to `https://swarfarm.com/*` with CORS |

## Wrangler on Windows

Use `npx wrangler` (or install globally: `npm i -g wrangler` and restart the terminal).

## D1 schema

**New database:** table does not exist yet:

```bash
cd worker
npx wrangler d1 execute swf-db --remote --file=./schema.sql
```

**Already have `shares` but errors like `no such column: expires_at`:** your table was created with fewer columns. Run the migration once:

```bash
npx wrangler d1 execute swf-db --remote --file=./migrate-shares-columns.sql
```

If SQLite reports `duplicate column name: created_at`, edit the migration file and remove the `ALTER TABLE ... created_at` line, then run again (only `expires_at` was missing).

## Deploy

```bash
cd worker
npx wrangler deploy
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
