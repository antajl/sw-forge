# SW Forge — Project context (source of truth)

**Workspace root:** `D:\Site\sw-forge`
**Local preview:** VS Code Live Server → `http://127.0.0.1:5500`
**Production:** Cloudflare Pages → `https://sw-forge.pages.dev`
**Repository:** `https://github.com/antajl/sw-forge` (branch: `main`)

## Infrastructure

| Component | URL | Status |
|---|---|---|
| Cloudflare Pages | https://sw-forge.pages.dev | ✅ Live |
| Cloudflare Worker (API) | https://sw-backend.antajltube.workers.dev | ✅ Live |
| Cloudflare D1 (database) | swf-db (UUID: 7153441f-0dfa-4a15-842a-247dc38c78d0) | ✅ Created |

## Deploy workflow

1. Edit files in `js/features/**` or `css/**`
2. `npm run build:ui`
3. `git push` → Cloudflare deploys automatically in ~1 min
4. Verify at https://sw-forge.pages.dev

❌ Never edit `js/ui.js` directly — it is a build artifact.
❌ Never change `<script>` order in `index.html`.
