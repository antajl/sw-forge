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

**Already have `shares` but errors like `no such column: wizard_name` or `expires_at`:** your table was created with fewer columns. Run the migration once:

```bash
npx wrangler d1 execute swf-db --remote --file=./migrate-shares-columns.sql
```

If SQLite reports `duplicate column name: expires_at`, `expires_at` is already there — run only the wizard name migration:

```bash
npx wrangler d1 execute swf-db --remote --file=./migrate-shares-wizard-name.sql
```

If SQLite reports `duplicate column name: wizard_name`, you are done; retry Share in the app.

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
