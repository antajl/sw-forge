# SW Rune Master — Project context (source of truth)

**Workspace root:** `D:\Site\sw-rune-master`  
**Local preview:** VS Code Live Server → `http://127.0.0.1:5500` (or your configured port)  
**Production:** GitHub Pages static hosting — no Node.js on the server.

---

## Current repository tree

```
sw-rune-master/
├── index.html              # Runtime script order = API contract
├── MIGRATE.cmd             # One-time / safe re-run folder migration (see below)
├── assets/                 # favicon, logos, tab SVGs
├── data/
│   ├── demo.json           # Embedded demo SWEX export
│   ├── monsters-index.json
│   └── skills-index.json
├── docs/
│   ├── PROJECT-CONTEXT.md  # ← this file
│   └── ARCHITECTURE.md     # Tab → file map (detail)
├── css/
│   ├── style.css           # Entry: @import only
│   ├── foundation/         # base, header, overlays, toasts
│   └── features/
│       ├── runes/          # dashboard, table, hub, rules, stage-advisor, …
│       └── monsters/       # monsters tab (symmetric with js/features/monsters)
├── js/
│   ├── core/               # meta, i18n, defaults, changelog-data, bootstrap
│   ├── data/               # parser, skill-db, monster-db
│   ├── engine/             # verdict engine (4 files)
│   ├── features/           # UI source (concatenated → ui.js)
│   │   ├── shell/
│   │   ├── runes/
│   │   ├── rules/
│   │   ├── app/
│   │   └── monsters/
│   ├── advanced-formulas.js
│   ├── self-test.js
│   ├── swrm-motion.js
│   └── ui.js               # GENERATED — do not edit by hand
└── tools/
    ├── build-ui.mjs        # Single UI concat manifest
    ├── watch-ui.mjs
    └── migrate-structure.mjs
```

---

## Build workflow

| Step | Command |
|------|---------|
| Edit UI | Change files under `js/features/**` |
| Rebuild | `npm run build:ui` → runs `node tools/build-ui.mjs` |
| Output | `js/ui.js` (single IIFE, same closure as historical monolith) |
| Watch | `npm run watch:ui` |

After any edit under `js/features/`, rebuild before testing in the browser.

**Commit policy:** Prefer committing sources + rebuilt `js/ui.js` for GitHub Pages (no CI build). Alternatively commit only sources if you add a build step in CI later.

---

## Runtime load order (`index.html`)

Order is the public API — change only when dependencies change.

1. `js/core/meta.js`
2. `js/core/i18n.js`
3. `js/core/defaults.js`
4. `js/core/changelog-data.js`
5. `js/core/bootstrap.js`
6. `js/data/parser.js`
7. `js/data/skill-db.js`
8. `js/data/monster-db.js`
9. `js/engine/*.js` (4 files, fixed order in HTML)
10. `js/advanced-formulas.js`
11. `js/self-test.js`
12. `js/swrm-motion.js` (+ GSAP CDN)
13. `js/ui.js`

Globals: `window.SWRM`, `window.SWRM_SKILL_DB`, `window.SWRM_MONSTER_DB`, etc.

---

## Architecture rules

1. **One feature = matching JS + CSS folders**  
   - Example: Monsters → `js/features/monsters/*` + `css/features/monsters/*`

2. **`js/ui.js` is generated** — never edit by hand; edit `js/features/**` and run `npm run build:ui`.

3. **Data assets live in `/data`**  
   - `data/demo.json` — demo SWEX loaded by `installEmbeddedDemoDataset()` in `js/features/runes/upload.js`  
   - `data/monsters-index.json`, `data/skills-index.json` — fetched at runtime by `js/data/*-db.js`

4. **CSS entry is `css/style.css` only** — imports `foundation/*` and `features/*/index.css`.

5. **No bundler on deploy** — concatenation only; no Vite/Webpack for GitHub Pages.

6. **Engine vs UI** — verdict logic stays in `js/engine/` and `js/core/defaults.js`; presentation in `js/features/`.

---

## Feature map (quick)

| Area | JavaScript | CSS |
|------|------------|-----|
| Shell (tabs, theme, i18n bindings) | `js/features/shell/*` | `css/foundation/header.css`, `base.css` |
| Runes dashboard | `runes/dashboard.js`, `charts.js`, `verdict-filters.js`, `copy-summary.js`, `depth.js`, `stage-advisor-ui.js` | `css/features/runes/*` |
| Rune table | `runes/table.js`, `table-filters.js`, `table-row-render.js` | `css/features/runes/table-*.css` |
| Rune rules | `js/features/rules/*` | `css/features/runes/rules.css` |
| Monsters | `js/features/monsters/*` | `css/features/monsters/*` |
| App settings / changelog UI | `js/features/app/*` | `foundation` + runes hub |
| Core config / i18n | `js/core/*` | — |
| SWEX parse & indexes | `js/data/*` | — |

Full table: `docs/ARCHITECTURE.md`.

---

## Migration notes (hybrid → §3 layout)

**Status:** completed on the main workspace (`D:\Site\sw-rune-master`).  
Old clones only: run `MIGRATE.cmd` once, then `npm run build:ui`.

| Before | After |
|--------|--------|
| `js/settings/` | `js/core/` |
| `js/parser.js`, `skill-db.js`, `monster-db.js` (root) | `js/data/` |
| `css/base.css`, `header.css`, … (flat) | `css/foundation/` |
| `css/monsters/` | `css/features/monsters/` |
| `css/runes-hub.css`, `rules.css`, `stage-advisor.css` (flat) | `css/features/runes/hub.css`, `rules.css`, `stage-advisor.css` |
| `demo.json` (project root) | `data/demo.json` |
| `js/settings.js` stub | removed |

`index.html` and `css/style.css` in this repo already target the **new** paths.

---

## Giving tasks to AI

Use real paths:

- «Monsters toolbar» → `js/features/monsters/monsters-filters.js` + `css/features/monsters/toolbar.css`
- «Copy summary» → `js/features/runes/copy-summary.js`
- «Demo load» → `js/features/runes/upload.js` + `data/demo.json`
- «i18n string» → `js/core/i18n.js`

---

## Optional / cleanup

- Remove `split-log.txt`, `tools/rebuild-ui.mjs` if still present (migration script removes them).
- `docs/PLANS.md` — roadmap draft; bundled summary in `js/core/changelog-data.js`.
- Python regression test on `data/demo.json` — not implemented yet (future).
