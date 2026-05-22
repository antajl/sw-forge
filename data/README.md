# Bundled game data (offline)

These JSON files ship with the site. Refresh them locally, then deploy with the static build.

| File | Tool | Contents |
|------|------|----------|
| `monsters-index.json` | `node tools/fetch-monsters-index.mjs` | Monster names, icons, bestiary slugs (from SWARFARM API) |
| `skills-index.json` | `node tools/fetch-skills-index.mjs --fresh` | All skills: max level, icon, description, upgrades, cooldown (schema 2, ~1.6 MB) |
| `demo.json` | (manual) | Sample SWEX export for demo mode |

After updating JSON, bump `APP_VERSION` in `js/core/meta.js` so browsers reload caches.

**Planned local images** (not all shipped yet): see [`docs/PLANS-LOCAL-ASSETS.md`](../docs/PLANS-LOCAL-ASSETS.md).
