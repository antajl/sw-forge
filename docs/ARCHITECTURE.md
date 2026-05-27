# Architecture

SW Forge is a static browser app. Cloudflare Pages serves `index.html`, CSS, data JSON, and plain script files. There is no runtime bundler requirement.

**Docs index:** `docs/README.md` · **Quick context:** `docs/PROJECT-CONTEXT.md`

## Runtime Load Order

`index.html` is the runtime contract:

1. `js/core/*.js` (meta → i18n → defaults → changelog-data → bootstrap)
2. `js/data/artifacts/effects.js`, `js/data/artifact-ingame-score.js`, `js/data/relics/effects.js`, `js/data/gear/parse.js`, `js/data/gear/icons.js`
3. `js/data/parser.js` (SWEX runes/units, SWOP Eff%)
4. `js/data/ingame-score.js` (Com2uS Ingame Rating — table column, sort, CSV)
5. `js/data/local-assets.js`, `js/data/skill-db.js`, `js/data/monster-db.js`
6. `js/engine/*.js`, `js/advanced-formulas.js`
7. `js/self-test.js`
8. `js/swrm-motion.js`
9. `js/ui.js` (Forge Score in `js/features/runes/rune-score.js`, table in `table*.js`)

**Player docs:** Guide text lives in `index.html` (`#tab-guide`), not under `docs/`. Changelog strings: `js/core/changelog-data.js`.

The app API is exposed through `window.SWRM` and related browser globals. Keep that order stable unless the dependency graph is changed deliberately.

## UI Source Map

`js/ui.js` is a generated artifact. Do not edit it by hand. Edit the feature files below, then run `npm run build:ui`.

| Area | JavaScript source | CSS |
| --- | --- | --- |
| Header, theme, tabs | `js/features/shell/*` | `css/foundation/header.css`, `css/foundation/base.css` |
| Runes dashboard | `js/features/runes/dashboard.js`, `charts.js`, `verdict-filters.js`, `stage-advisor-ui.js`, `depth.js`, `copy-summary.js` | `css/features/runes/*` |
| Rune table | `js/features/runes/table.js`, `table-filters.js`, `table-row-render.js`, `table-virtual.js` | `css/features/runes/table-*.css` |
| Ingame Rating (data) | `js/data/ingame-score.js` | — |
| Artifact Ingame Score (data) | `js/data/artifact-ingame-score.js` (`ARTIFACT_INGAME_WEIGHTS`, `artifactIngameScoreBreakdown`) | — |
| Artifacts & relics tables | `js/features/gear/table-kind.js`, `artifacts-table.js`, `relics-table.js` (Rune Table-style sorting) | `css/features/gear/*` |
| Teams | `js/features/teams/*` | `css/features/teams/*` |
| Account SPD totem | `js/features/monsters/monsters-stats-calc.js` (`getAccountTotemSpdPct`, cached on `rebuildUnitsFromSwex`) | none |
| Rune rules | `js/features/rules/*` | `css/features/runes/rules.css` |
| Monsters | `js/features/monsters/*` | `css/features/monsters/*` |
| Gear data (SWEX) | `js/data/gear/parse.js`, `js/data/artifacts/effects.js`, `js/data/relics/effects.js` | none |
| App settings, guide, changelog | `js/features/app/*`, shell bindings | `css/foundation/*`, `css/features/runes/hub.css` |
| Verdicts and formulas | `js/engine/*`, `js/advanced-formulas.js`, `js/core/defaults.js` | none |
| SWEX/data loading | `js/data/parser.js`, `js/data/skill-db.js`, `js/data/monster-db.js` | none |
| Demo dataset | loaded from `data/demo.json` via `js/features/runes/upload.js` | none |
| Bundled indexes | `data/monsters-index.json`, `data/skills-index.json` (schema 2: `metaById`) | see `data/README.md`, `MASTER.md` § external data |

## UI Build

`tools/build-ui.mjs` is the single manifest for concatenation order. It joins `js/features/**/*.js` into `js/ui.js` without transforms, preserving the historical single IIFE closure.

Common commands:

```bash
npm run build:ui
npm run watch:ui
```

Use `npm run build:ui` after any edit under `js/features/`.

## CSS Entry

**Production:** `index.html` loads `css/dist/app.css` (built by `npm run build:css`).

**Source chain** (`css/style.css` — used when editing partials) imports:

- `css/foundation/*` (base, header, overlays, toasts)
- `css/features/runes/index.css` (dashboard, rune table, hub, rules, stage-advisor)
- `css/features/gear/index.css` (artifact/relic table tabs & layout)
- `css/features/teams/index.css`
- `css/features/monsters/index.css`

See **`docs/FEATURES.md`** for the full feature-folder map.

## Conventions

- Keep source files feature-oriented, not numbered by old monolith line ranges.
- Keep `js/ui.js` committed as a build artifact for static hosting unless CI builds it.
- Prefer adding new UI code under the owning feature folder.
- Keep engine and core changes outside UI files when behavior is not presentation-specific.
- When splitting a large file, split by responsibility first: rendering, filters, chart helpers, persistence, or event wiring.
