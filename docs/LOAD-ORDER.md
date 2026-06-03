# SW Forge — Load Order

> Exact script loading order and build chain.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Architecture:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## CSS Load Order (`index.html`, `<head>`)

**Note:** `index.html` is a build artifact assembled from `index-shell.html` + partials via `npm run build:html`.

| # | File | Line ~ |
|---|------|--------|
| — | `css/dist/app.css` | 21 |

Dev: `css/style.css` (local only; prod uses `app.css`).

---

## JavaScript Load Order (`index.html`, end of `<body>`)

**Note:** `index.html` is a build artifact assembled from `index-shell.html` + partials via `npm run build:html`. Script order is defined in `index-shell.html`.

All local scripts use **`defer`**, including GSAP.

| # | File | Line in `index.html` |
|---|------|----------------------|
| 1 | `js/core/meta.js` | ~4218 |
| 2 | `js/core/translations.js` | ~4219 |
| 3 | `js/core/defaults.js` | ~4220 |
| 4 | `js/core/changelog-data.js` | ~4221 |
| 5 | `js/core/bootstrap.js` | ~4222 |
| 6 | `js/data/artifacts/effects.js` | ~4223 |
| 7 | `js/data/artifact-ingame-score.js` | ~4224 |
| 8 | `js/data/relics/effects.js` | ~4225 |
| 9 | `js/data/gear/parse.js` | ~4226 |
| 10 | `js/data/gear/icons.js` | ~4227 |
| 11 | `js/data/parser.js` | ~4228 |
| 12 | `js/data/ingame-score.js` | ~4229 |
| 13 | `js/data/local-assets.js` | ~4230 |
| 14 | `js/data/skill-db.js` | ~4231 |
| 15 | `js/data/monster-db.js` | ~4232 |
| 16–21 | `js/engine/*`, `advanced-formulas.js` | ~4233–4238 |
| 22 | `js/self-test.js` | ~4239 |
| 23 | GSAP local | ~4240 |
| 24 | `js/swrm-motion.js` | ~4241 |
| 25 | `js/ui.js` | ~4242 |

**Lazy (not in HTML):** `js/core/translations-fr.js` — loaded on-demand when FR is selected in `language-bindings.js`.

**Translation sources (edit, not loaded in HTML):** `translations-en.js`, `translations-ru.js` → `npm run build:translations` → `translations.js`.

**Worker:** `js/workers/rune-processor.worker.js` — created from `rune-processor-worker.js`, not in HTML.

---

## `ui.js` Internal Order (inside single IIFE)

See `tools/build-ui.mjs`: `CHUNKS` (shell → runes → gear → rules → app) → `MONSTER_PARTS` → `monsters/bootstrap.js` (only file with closing `})();`).

### Build Order (`tools/build-ui.mjs`)

1. **Shell:** `bootstrap.js`, `theme-nav.js`, `donate-dialog.js`, `language-bindings.js`, `mobile-nav.js`, `filters-popover.js`, `main-tabs.js`
2. **Runes:** `stage-filters.js`, `rune-processor-worker.js`, `upload.js`, `utils.js`, `verdict-filters.js`, `charts.js`, `copy-summary.js`, `stage-advisor-ui.js`, `depth.js`, `dashboard.js`, `rune-score.js`, `table-row-render.js`, `table-filters.js`, `table.js`
3. **Gear:** `table-kind.js`, `gear-roster-chips.js`, `artifacts-table.js`, `relics-table.js`, `dashboard-artifacts.js`
4. **Rules:** `formulas-ui.js`, `panel.js`, `constants-ui.js`, `bootstrap.js`, `policy-ui.js`, `artifact-rules-ui.js`
5. **App:** `settings-ui.js`, `share.js`, `changelog.js`
6. **Monsters:** `monsters-state.js`, `monsters-hub.js`, `teams/storage.js`, `teams/ui.js`, `monsters-storage.js`, `monsters-bulk.js`, `monsters-filters.js`, `box-overview.js`, `monsters-stats-calc.js`, `monsters-gear.js`, `monsters-runes.js`, `monsters-detail.js`, `monsters-card.js`, `monsters-table.js`, `monsters-list.js`, `monsters-events.js`, `bootstrap.js`

---

## CSS Build Order (`tools/build-css.mjs` → `FILES` array)

1. `css/foundation/base.css`
2. `css/foundation/header.css`
3. `css/foundation/overlays.css`
4. `css/foundation/toasts.css`
5. `css/foundation/action-chrome.css`
6. `css/features/runes/index.css`
7. `css/features/gear/index.css`
8. `css/features/teams/index.css`
9. `css/features/monsters/index.css`
10. `css/features/app/settings.css`
11. `css/features/guide/archive.css`

---

## Dependency Contracts

- **Core → Data → Engine → UI:** strict order in `index.html`
- **`window.SWRM`:** assembled by `js/core/bootstrap.js` from defaults, available to all later scripts
- **`TRANSLATIONS`:** loaded by `translations.js`, FR extended by lazy `translations-fr.js`
- **`updateLanguage()`:** defined in `language-bindings.js` (inside `ui.js`), called on boot in `shell/bootstrap.js` and `rules/bootstrap.js`
- **Do not change `<script defer>` order** without verifying dependency graph
