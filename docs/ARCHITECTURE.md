# Architecture

SW Forge is a static browser app. Cloudflare Pages serves `index.html`, CSS, data JSON, and plain script files. There is no runtime bundler requirement.

**Source of truth for paths and workflow:** `docs/PROJECT-CONTEXT.md`

## Runtime Load Order

`index.html` is the runtime contract:

1. `js/core/*.js` (meta → i18n → defaults → changelog-data → bootstrap)
2. `js/data/parser.js`
3. `js/data/skill-db.js`
4. `js/data/monster-db.js`
5. `js/engine/*.js`
6. `js/advanced-formulas.js`
7. `js/self-test.js`
8. `js/swrm-motion.js`
9. `js/ui.js`

The app API is exposed through `window.SWRM` and related browser globals. Keep that order stable unless the dependency graph is changed deliberately.

## UI Source Map

`js/ui.js` is a generated artifact. Do not edit it by hand. Edit the feature files below, then run `npm run build:ui`.

| Area | JavaScript source | CSS |
| --- | --- | --- |
| Header, theme, tabs | `js/features/shell/*` | `css/foundation/header.css`, `css/foundation/base.css` |
| Runes dashboard | `js/features/runes/dashboard.js`, `charts.js`, `verdict-filters.js`, `stage-advisor-ui.js`, `depth.js`, `copy-summary.js` | `css/features/runes/*` |
| Rune table | `js/features/runes/table.js`, `table-filters.js`, `table-row-render.js` | `css/features/runes/table-*.css` |
| Rune rules | `js/features/rules/*` | `css/features/runes/rules.css` |
| Monsters | `js/features/monsters/*` | `css/features/monsters/*` |
| App settings, guide, changelog | `js/features/app/*`, shell bindings | `css/foundation/*`, `css/features/runes/hub.css` |
| Verdicts and formulas | `js/engine/*`, `js/advanced-formulas.js`, `js/core/defaults.js` | none |
| SWEX/data loading | `js/data/parser.js`, `js/data/skill-db.js`, `js/data/monster-db.js` | none |
| Demo dataset | loaded from `data/demo.json` via `js/features/runes/upload.js` | none |

## UI Build

`tools/build-ui.mjs` is the single manifest for concatenation order. It joins `js/features/**/*.js` into `js/ui.js` without transforms, preserving the historical single IIFE closure.

Common commands:

```bash
npm run build:ui
npm run watch:ui
```

Use `npm run build:ui` after any edit under `js/features/`.

## CSS Entry

`css/style.css` imports:

- `css/foundation/*` (base, header, overlays, toasts)
- `css/features/runes/index.css` (dashboard modules, table, hub, rules, stage-advisor)
- `css/features/monsters/index.css`

## Conventions

- Keep source files feature-oriented, not numbered by old monolith line ranges.
- Keep `js/ui.js` committed as a build artifact for static hosting unless CI builds it.
- Prefer adding new UI code under the owning feature folder.
- Keep engine and core changes outside UI files when behavior is not presentation-specific.
- When splitting a large file, split by responsibility first: rendering, filters, chart helpers, persistence, or event wiring.
