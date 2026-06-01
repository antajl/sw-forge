# SW Forge — Load Order

> Exact script loading order and build chain.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Architecture:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## CSS Load Order (`index.html`, `<head>`)

| # | File | Line ~ |
|---|------|--------|
| — | `css/dist/app.css` | 21 |

Dev: `css/style.css` (local only; prod uses `app.css`).

---

## JavaScript Load Order (`index.html`, end of `<body>`)

All local scripts use **`defer`**, including GSAP.

| # | File | Line in `index.html` |
|---|------|----------------------|
| 1 | `js/core/meta.js` | 4022 |
| 2 | `js/core/i18n.js` | 4023 |
| 3 | `js/core/defaults.js` | 4024 |
| 4 | `js/core/changelog-data.js` | 4025 |
| 5 | `js/core/bootstrap.js` | 4026 |
| 6 | `js/data/artifacts/effects.js` | ~4027 |
| 7 | `js/data/artifact-ingame-score.js` | ~4028 |
| 8 | `js/data/relics/effects.js` | ~4029 |
| 9 | `js/data/gear/parse.js` | ~4030 |
| 10 | `js/data/gear/icons.js` | ~4031 |
| 11 | `js/data/parser.js` | ~4032 |
| 12 | `js/data/ingame-score.js` | ~4033 |
| 13 | `js/data/local-assets.js` | ~4034 |
| 14 | `js/data/skill-db.js` | ~4035 |
| 15 | `js/data/monster-db.js` | ~4036 |
| 16–21 | `js/engine/*`, `advanced-formulas.js` | ~4037–4042 |
| 22 | `js/self-test.js` | 4043 |
| 23 | GSAP local | ~4044 |
| 24 | `js/swrm-motion.js` | 4046 |
| 25 | `js/ui.js` | 4047 |

**Lazy (not in HTML):** `js/core/i18n-fr.js` — loaded on-demand when FR is selected in `i18n-bindings.js`.

**Worker:** `js/workers/rune-processor.worker.js` — created from `rune-processor-worker.js`, not in HTML.

---

## `ui.js` Internal Order (inside single IIFE)

See `tools/build-ui.mjs`: `CHUNKS` (shell → runes → gear → rules → app) → `MONSTER_PARTS` → `monsters/bootstrap.js` (only file with closing `})();`).

### Build Order (`tools/build-ui.mjs`)

1. **Shell:** `bootstrap.js`, `theme-nav.js`, `i18n-bindings.js`, `mobile-nav.js`, `filters-popover.js`, `main-tabs.js`
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
- **`TRANSLATIONS`:** loaded by `i18n.js`, extended by lazy `i18n-fr.js`
- **`updateLanguage()`:** defined in `i18n-bindings.js` (inside `ui.js`), called on boot in `shell/bootstrap.js` and `rules/bootstrap.js`
- **Do not change `<script defer>` order** without verifying dependency graph
