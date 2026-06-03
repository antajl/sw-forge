# SW Forge — MASTER (Entry Point)

> **Purpose:** Repository map, edit rules, build commands.  
> **Not a backlog:** open features → [`PLANS.md`](PLANS.md); completed → Updates in app.  
> **Quick start:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Docs index:** [`README.md`](README.md) · **Game terms (stats):** [`GAME-TERMINOLOGY.md`](GAME-TERMINOLOGY.md)

---

## Project Context

SW Forge — static site on **Cloudflare Pages**: Summoners War rune analyzer + monster hub (SWEX stays in browser).

**Stack:** Vanilla JS + CSS · **Build:** `npm run build` (`build:html` + `build:css` + `build:ui`) · **Prod CSS:** `css/dist/app.css` · **Prod UI:** `js/ui.js` · **Prod HTML:** `index.html` (from `index-shell.html` + partials) · **No external CDN** (GSAP local in `assets/`)

**URLs:** Prod https://sw-forge.pages.dev · Share API https://sw-backend.antajltube.workers.dev · Local http://127.0.0.1:5500/

---

## Edit Rules (6 points)

1. `partials/` changes → `npm run build:html`
2. `js/features/` changes → `npm run build:ui`
3. CSS from `tools/build-css.mjs` list → `npm run build:css`
4. UI strings EN/RU → `translations-en.js` + `translations-ru.js` → `npm run build:translations`; FR → `translations-fr.js` (lazy)
5. Player-facing changes → changelog **today's date only**; then remove from `PLANS.md`
6. **Do not edit manually:** `js/ui.js`, `css/dist/app.css`, `index.html`, `js/core/translations.js` (build artifact), `<script defer>` order in `index-shell.html`

---

## Build Commands

```bash
npm run build:html         # tools/build-html.mjs → index.html
npm run build:translations # translations-en/ru → js/core/translations.js
npm run build:ui           # tools/build-ui.mjs → js/ui.js
npm run build:css          # tools/build-css.mjs → css/dist/app.css
npm run build              # all four steps
npm run watch:ui           # rebuild ui.js on save in js/features/
```

---

## Documentation Index

| Question | File |
|----------|------|
| Complete file map | [`FILE-MAP.md`](FILE-MAP.md) |
| Script load order | [`LOAD-ORDER.md`](LOAD-ORDER.md) |
| `window.SWRM` API + CSS variables | [`API-REFERENCE.md`](API-REFERENCE.md) |
| Known bugs / issues | [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) |
| Runtime / build architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Feature folder map | [`FEATURES.md`](FEATURES.md) |
| **What to do next (backlog)** | **[`PLANS.md`](PLANS.md)** + Updates → Roadmap |

---

## Quick Links

- **Monster/skill data:** `node tools/fetch-monsters-index.mjs` · `node tools/fetch-skills-index.mjs --fresh`
- **Worker deploy:** `cd worker && npx wrangler deploy`
- **Search hex in features:** `rg "#[0-9a-fA-F]{6}" css/features/ -g "*.css"`

---

*When changing repo structure, update [`FILE-MAP.md`](FILE-MAP.md) and `tools/build-*.mjs`. Do not add backlog items here — use [`PLANS.md`](PLANS.md).*
