# SW Forge — Project Structure

> **Context:** [MASTER.md](MASTER.md)
> Read this file to understand where code lives, how it builds, and where to add
> new features.

## Overview

SW Forge is a static browser app. Cloudflare Pages serves `index.html`, CSS, data JSON, and plain script files. There is no runtime bundler requirement.

## Build system and commands

### HTML Build

`tools/build-html.mjs` assembles `index.html` from `index-shell.html` and partial files in `partials/`. The shell template contains `<!-- @include partials/... -->` markers that are replaced with partial content at build time.

Common commands:

```bash
npm run build:html
```

Use `npm run build:html` after any edit under `partials/`.

### Translations Build

`tools/build-translations.mjs` joins `js/core/translations-en.js` and `js/core/translations-ru.js` into `js/core/translations.js`. French stays in `translations-fr.js` and loads lazily.

```bash
npm run build:translations
```

Edit EN/RU in source files, then run `npm run build:translations`. Edit FR directly in `translations-fr.js`.

### UI Build

`tools/build-ui.mjs` is the single manifest for concatenation order. It joins `js/features/**/*.js` into `js/ui.js` without transforms, preserving the historical single IIFE closure.

Common commands:

```bash
npm run build:ui
npm run watch:ui
```

Use `npm run build:ui` after any edit under `js/features/`.

> **Note:** Do not edit `js/ui.js` by hand — it is a build artifact.

## Do not edit manually

| File | Why |
|------|------|
| `js/ui.js` | Artifact of `npm run build:ui` |
| `css/dist/app.css` | Artifact of `npm run build:css` |
| `index.html` | Artifact of `npm run build:html` (from `index-shell.html` + partials) |
| `js/core/translations.js` | Artifact of `npm run build:translations` (from `translations-en.js` + `translations-ru.js`) |
| Order of `<script defer>` in `index-shell.html` | Hard dependency contract |

## Script and CSS load order

### CSS Load Order (`index.html`, `<head>`)

**Note:** `index.html` is a build artifact assembled from `index-shell.html` + partials via `npm run build:html`.

| # | File | Line ~ |
|---|------|--------|
| — | `css/dist/app.css` | 21 |

Dev: `css/style.css` (local only; prod uses `app.css`).

### JavaScript Load Order (`index.html`, end of `<body>`)

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

### `ui.js` Internal Order (inside single IIFE)

See `tools/build-ui.mjs`: `CHUNKS` (shell → runes → gear → rules → app) → `MONSTER_PARTS` → `monsters/bootstrap.js` (only file with closing `})();`).

#### Build Order (`tools/build-ui.mjs`)

1. **Shell:** `bootstrap.js`, `theme-nav.js`, `donate-dialog.js`, `language-bindings.js`, `mobile-nav.js`, `filters-popover.js`, `main-tabs.js`
2. **Runes:** `stage-filters.js`, `rune-processor-worker.js`, `upload.js`, `utils.js`, `verdict-filters.js`, `charts.js`, `copy-summary.js`, `stage-advisor-ui.js`, `depth.js`, `dashboard.js`, `rune-score.js`, `table-row-render.js`, `table-filters.js`, `table.js`
3. **Gear:** `table-kind.js`, `gear-roster-chips.js`, `artifacts-table.js`, `relics-table.js`, `dashboard-artifacts.js`
4. **Rules:** `formulas-ui.js`, `panel.js`, `constants-ui.js`, `bootstrap.js`, `policy-ui.js`, `artifact-rules-ui.js`
5. **App:** `settings-ui.js`, `share.js`, `changelog.js`
6. **Monsters:** `monsters-state.js`, `monsters-hub.js`, `teams/storage.js`, `teams/ui.js`, `monsters-storage.js`, `monsters-bulk.js`, `monsters-filters.js`, `box-overview.js`, `monsters-stats-calc.js`, `monsters-gear.js`, `monsters-runes.js`, `monsters-detail.js`, `monsters-card.js`, `monsters-table.js`, `monsters-list.js`, `monsters-events.js`, `bootstrap.js`

### CSS Build Order (`tools/build-css.mjs` → `FILES` array)

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

### Dependency Contracts

- **Core → Data → Engine → UI:** strict order in `index.html`
- **`window.SWRM`:** assembled by `js/core/bootstrap.js` from defaults, available to all later scripts
- **`TRANSLATIONS`:** loaded by `translations.js`, FR extended by lazy `translations-fr.js`
- **`updateLanguage()`:** defined in `language-bindings.js` (inside `ui.js`), called on boot in `shell/bootstrap.js` and `rules/bootstrap.js`
- **Do not change `<script defer>` order** without verifying dependency graph

## File map

### Root and static files

| Path | Purpose |
|------|---------|
| `index.html` | **Prod** — assembled HTML (build artifact from `index-shell.html` + partials) |
| `index-shell.html` | Shell template with `<!-- @include partials/... -->` markers |
| `partials/header.html` | Header partial (logo, navigation, theme toggle) |
| `partials/tabs/dashboard.html` | Dashboard tab content |
| `partials/tabs/gear.html` | Gear tab content (runes, artifacts, relics) |
| `partials/tabs/monsters.html` | Monsters tab content |
| `partials/tabs/guide.html` | Guide tab content |
| `partials/tabs/changelog.html` | Changelog tab content |
| `partials/tabs/app-settings.html` | App Settings tab content |
| `_headers` | Cache-Control for Cloudflare Pages |
| `assets/fonts/*.woff2` | Self-hosted fonts (legacy, not connected) |
| `data/demo.json` | Demo SWEX (~5.5 MB) |
| `data/monsters-index.json` | Monster names/icons/meta (SWARFARM cache, `fetch-monsters-index.mjs`) |
| `data/skills-index.json` | Skills: max level, icons, description, upgrades, CD (`fetch-skills-index.mjs --fresh`, schema 2) |

### CSS

| Path | Purpose |
|------|---------|
| `css/dist/app.css` | **Prod** — bundled CSS |
| `css/style.css` | Dev: only `@import` statements |
| `css/foundation/base.css` | `:root` variables, `@font-face`, light theme |
| `css/foundation/header.css` | Header, navigation |
| `css/foundation/overlays.css` | Modals, share banner, demo banner |
| `css/foundation/toasts.css` | Toast notifications |
| `css/foundation/action-chrome.css` | Buttons |
| `css/features/runes/*.css` | Runes tab (table, dashboard, rules UI…) |
| `css/features/gear/table-kind.css` | Artifacts / Relics tables |
| `css/features/teams/*.css` | Teams |
| `css/features/monsters/*.css` | Monsters (roster, detail, toolbar…) |
| `css/features/guide/archive.css` | Guide |
| `css/features/app/settings.css` | Settings |

CSS build order: `tools/build-css.mjs` → `FILES` array.

### JS — core (before UI)

| Path | Purpose |
|------|---------|
| `js/core/meta.js` | `APP_VERSION`, stat constants |
| `js/core/translations-en.js` | English UI strings (source) |
| `js/core/translations-ru.js` | Russian UI strings (source) |
| `js/core/translations-fr.js` | French UI strings (lazy-loaded source) |
| `js/core/translations.js` | **Prod** — EN+RU bundle (`npm run build:translations`) |
| `js/core/defaults.js` | Thresholds, roles, formulas, settings |
| `js/core/changelog-data.js` | `STATIC_CHANGELOG`, `STATIC_ROADMAP` |
| `js/core/bootstrap.js` | Assembles `window.SWRM` from defaults |

### JS — data

| Path | Purpose |
|------|---------|
| `js/data/parser.js` | `parseSWEX`, `parseRune`, `parseUnits`, SWOP Eff% |
| `js/data/ingame-score.js` | `calcIngameScore`, `ingameScoreBreakdown` — Com2uS Rating (rune table column) |
| `js/data/artifact-ingame-score.js` | `calcArtifactIngameScore`, `artifactIngameScoreBreakdown`, `ARTIFACT_INGAME_WEIGHTS` — artifact Ingame Score coefficients |
| `js/data/monster-db.js` | `monsters-index.json`, `SWRM_MONSTER_DB` |
| `js/data/skill-db.js` | `skills-index.json` + `metaById` (tooltips, Skill plan CD without API) |
| `js/data/gear/parse.js` | Artifacts/relics from SWEX |
| `js/data/artifacts/effects.js` | Artifact effects reference |
| `js/data/relics/effects.js` | Relic types, labels |

### JS — engine (no DOM)

| Path | Purpose |
|------|---------|
| `js/engine/engine-core.js` | `statMap`, HR anchor, sub helpers |
| `js/engine/engine-legacy-roles.js` | `checkRole`, `checkHighRoll`, duo |
| `js/engine/engine-gem-reapp-verdict.js` | Grind, Gem, Reapp, God sell |
| `js/advanced-formulas.js` | Formulas, `getAdvancedVerdict` |
| `js/engine/engine-process.js` | `processRune`, `processAll` |

### JS — workers

| Path | Purpose |
|------|---------|
| `js/workers/rune-processor.worker.js` | `processAll` in background |
| `js/features/runes/rune-processor-worker.js` | `processRunesAsync` + fallback |

### JS — other before ui.js

| Path | Purpose |
|------|---------|
| `js/self-test.js` | `SWRM.runSelfTests` |
| `js/swrm-motion.js` | GSAP animations |

### JS — features → `ui.js` (edit here)

Concatenation order: `tools/build-ui.mjs` (`CHUNKS` + `MONSTER_PARTS`).

#### Shell / app

| File | Role |
|------|------|
| `shell/bootstrap.js` | Global app state, tabs |
| `shell/theme-nav.js` | Dark/light theme |
| `shell/language-bindings.js` | Binds `TRANSLATIONS` to DOM, lazy FR |
| `shell/mobile-nav.js` | Mobile navigation |
| `shell/filters-popover.js` | Filter popovers |
| `shell/main-tabs.js` | Runes / Monsters / Guide / Updates |

#### Runes

| File | Role |
|------|------|
| `runes/stage-filters.js` | Early/Mid/Late stage |
| `runes/rune-processor-worker.js` | Async processing |
| `runes/upload.js` | SWEX upload, demo, DB slots |
| `runes/utils.js` | Hydrate SWEX, empty state |
| `runes/verdict-filters.js` | Verdict filters |
| `runes/charts.js` | Charts |
| `runes/copy-summary.js` | Copy summary |
| `runes/stage-advisor-ui.js` | Stage Advisor |
| `runes/depth.js` | Depth analysis |
| `runes/dashboard.js` | Dashboard |
| `runes/rune-score.js` | Forge Score |
| `runes/table-row-render.js` | Rune table row (Ingame, Forge, Verdict tooltip, Location) |
| `runes/table-filters.js` | Table filters |
| `runes/table.js` | Rune table |

#### Gear

| File | Role |
|------|------|
| `gear/table-kind.js` | Runes / Artifacts / Relics sub-tabs |
| `gear/gear-roster-chips.js` | Chips above gear table |
| `gear/artifacts-table.js` | Artifacts table, header sorting |
| `gear/relics-table.js` | Relics table, header sorting |

#### Rules

| File | Role |
|------|------|
| `rules/formulas-ui.js` | Formula editor |
| `rules/panel.js` | Rules container |
| `rules/constants-ui.js` | Constants UI |
| `rules/bootstrap.js` | Init settings / restore |
| `rules/policy-ui.js` | Eval policy |

#### App

| File | Role |
|------|------|
| `app/settings-ui.js` | App Settings |
| `app/share.js` | Share Profile, `?s=`, `?profile=`, `?data=` |
| `app/changelog.js` | Updates / Roadmap UI |

#### Monsters (`MONSTER_PARTS` + `monsters/bootstrap.js`)

| File | Role |
|------|------|
| `monsters/monsters-state.js` | State, localStorage keys |
| `monsters/monsters-hub.js` | Monsters tab |
| `teams/storage.js` | Teams localStorage + share export |
| `teams/ui.js` | Teams UI, combat SPD, share view |
| `monsters/monsters-storage.js` | Filters, meta units |
| `monsters/monsters-bulk.js` | Bulk select / marks |
| `monsters/monsters-filters.js` | Filter logic |
| `monsters/box-overview.js` | Box overview tiles |
| `monsters/monsters-stats-calc.js` | Stats, combat SPD, totem parsing (`wizard_skill_list` skill_id 14) |
| `monsters/monsters-gear.js` | Gear on detail |
| `monsters/monsters-runes.js` | Runes on card |
| `monsters/monsters-detail.js` | Detail panel |
| `monsters/monsters-card.js` | Cards |
| `monsters/monsters-table.js` | Table |
| `monsters/monsters-list.js` | List / enrich |
| `monsters/monsters-events.js` | Toolbar events |
| `monsters/bootstrap.js` | Closes IIFE `ui.js` |

### tools/

| Active | |
|--------|--|
| `build-ui.mjs` | Build `js/ui.js` |
| `build-css.mjs` | Build `css/dist/app.css` |
| `build-html.mjs` | Build `index.html` from shell + partials |
| `build-translations.mjs` | Build `js/core/translations.js` from EN/RU sources |
| `translations-audit.mjs` | Compare keys across EN/RU/FR source files |
| `translations-extract-en.mjs` | Extract EN strings for missing FR keys |
| `translations-build-fr.mjs` | Auto-add FR keys from EN missing list |
| `watch-ui.mjs` | Watch UI |
| `fetch-monsters-index.mjs` | Update `monsters-index.json` |
| `fetch-skills-index.mjs` | `skills-index.json` (+ `metaById`; `--fresh` for full re-fetch) |
| `extract-tab-icons.mjs` | Tab icons |
| `inspect-totem-from-json.mjs` | Where Sky Tribe Totem level is in SWEX (skill_id 14) |

One-time patches: `tools/archive/` (do not touch).

### docs/

| File | Role |
|------|------|
| `MASTER.md` | Main reference (includes project context) |
| `PROJECT-STRUCTURE.md` | File map, load order, build system, feature folders |
| `GAME-KNOWLEDGE.md` | Game mechanics, stat names, gem/grind/reapp rules |
| `API-REFERENCE.md` | `window.SWRM` API + CSS variables |
| `BACKLOG.md` | Open bugs + feature backlog |
| `ARTIFACT_SCORING_RESEARCH.md` | Artifact scoring research (incomplete) |
| `README.md` | Russian documentation map for developers/AI |

### worker/

Cloudflare Worker + D1 — Share API (`worker/src/index.js`, `wrangler.toml`).

### External data SWARFARM (local vs network)

| Source | Local (`data/`) | Network (runtime) |
|--------|----------------|-------------------|
| **Skills** | `skills-index.json`: max level, icon, name, description, upgrades, CD | Fallback API only if `com2us_id` missing from index (`SWRM_LOCAL_ASSETS_ONLY` disables API) |
| **Monsters** | `monsters-index.json` schema 2: name, stats, `leader_skill`, portrait path | Detail API not called if row is complete (`monsterHasBundledDetail`) |
| **Images** | `assets/` + manifests (`skills-icons`, `leader-icons`, `monsters-portraits`, static bundle) | CDN fallback until file in manifest; `SWRM_LOCAL_ASSETS_ONLY=true` — local PNG only |
| **Relics** | `assets/relics/*.png` (manual) | — |
| **SWEX** | `demo.json` for demo only | User export — always local in browser |

Icons and static assets are cached by browser; JSON indexes use `?v=APP_VERSION`.

## Feature folders

### Principles

| Layer | Role |
|-------|------|
| `js/features/<name>/` | Browser UI modules concatenated into `js/ui.js` (`npm run build:ui`) |
| `js/data/<name>/` | Static labels & SWEX parsers loaded before `ui.js` in `index.html` |
| `css/features/<name>/` | Feature styles → `tools/build-css.mjs` → `css/dist/app.css` (prod) |

**Runes tab → Table** still hosts three list kinds (Runes / Artifacts / Relics) in one screen; only the **code folders** are split.

### Rune table columns (Runes sub-tab)

| Column | Source | Notes |
|--------|--------|--------|
| Slot … Sub4, Innate | `parser.js` + `table-row-render.js` | Stat lines, gem icon, search highlight |
| **Ingame** | `js/data/ingame-score.js` | Com2uS Rating; sort = slots 1→6 then score ↓ within slot |
| **Forge** | `js/features/runes/rune-score.js` | Default sort ↓; hover tooltip |
| Verdict / Role | `engine` + `table-row-render.js` | Verdict hover = reason text (no Reason column in grid) |
| **Location** | `runeLocationLabel()` in `table-row-render.js` | Monster name or Inventory; filter in More Filters |

**SWOP Eff%** (`calcEfficiency` in `parser.js`) — account Depth elite metric and dashboard efficiency chart only; not shown in the rune grid.

### Artifact and relic table columns

Artifacts and relics reuse the Rune Table interaction model: sticky headers, zebra rows, vertical block separators, and click-to-sort headers. Artifact score columns are split into **Ingame** (`calcArtifactIngameScore`) and **Forge** (`calcArtifactForgeScoreDisplay`); relics sort by category, level, durability, main, secondary, and equipped location.

### Dashboard distributions

**Runes hub → Dashboard → Distributions** has a **Runes | Artifacts** toggle (default Runes).

| Mode | Charts |
|------|--------|
| **Runes** | Verdict, Roles, Sets, Slot mains, Ingame Score, Forge Score, plus Top SPD inside the Slots pane (respects dashboard grade/level filters) |
| **Artifacts** | Six panels: **Verdict**, **Grade**, **Type** (HP/Attack/Defense/Support — SWEX `type`=2 + `unit_style`), **Role**, **Attribute** (Fire–Dark — SWEX `type`=1 + `attribute`), **Ingame / Forge Score** histograms |

Artifact charts use the full `allArtifacts` list from SWEX (`parseAccountGear`). Artifact Ingame Score comes from coefficient weights in `js/data/artifact-ingame-score.js`; `artifactIngameScoreBreakdown()` exposes the value × coefficient diagnostic surface. Empty state: upload prompt when no artifacts. Charts refresh on SWEX load and when artifact verdict rules change. Kind preference: `localStorage` key `swrm_dashboard_dist_kind_v1`.

### JavaScript (`js/features/`)

| Folder | Scope | Main files |
|--------|--------|------------|
| `shell/` | App chrome, tabs, language bindings | `bootstrap.js`, `theme-nav.js`, `donate-dialog.js`, `language-bindings.js`, `mobile-nav.js`, `filters-popover.js`, `main-tabs.js` |
| `runes/` | Dashboard, rune table, filters, upload | `stage-filters.js`, `rune-processor-worker.js`, `processed-cache.js`, `upload.js`, `utils.js`, `verdict-filters.js`, `charts.js`, `copy-summary.js`, `stage-advisor-ui.js`, `depth.js`, `dashboard.js`, `rune-score.js`, `table-row-render.js`, `table-virtual.js`, `table-filters.js`, `table.js` |
| `gear/` | Artifact & relic tables; Dashboard artifact distributions; Keep/Sell verdicts | `table-kind.js`, `gear-table-filters.js`, `gear-roster-chips.js`, `artifact-verdict.js`, `dashboard-artifacts.js`, `artifacts-table.js`, `artifacts-virtual.js`, `relics-table.js` |
| `teams/` | Team sets builder (Monsters → Teams hub pane); combat SPD badges | `storage.js`, `ui.js` |
| `monsters/` | Roster, cards, detail, gear on unit | `monsters-state.js`, `monsters-hub.js`, `monsters-stats-calc.js`, `monsters-storage.js`, `monsters-bulk.js`, `monsters-filters.js`, `box-overview.js`, `skill-planner.js`, `monsters-gear.js`, `monsters-runes.js`, `monsters-detail.js`, `monsters-card.js`, `monsters-table.js`, `monsters-list.js`, `monsters-events.js` |
| `rules/` | Runes rules (Engine / Roles / Verdict) + Artifacts rules (Roles / Verdict / Synergies) | `formulas-ui.js`, `panel.js`, `constants-ui.js`, `bootstrap.js`, `policy-ui.js`, `artifact-rules-ui.js` |
| `app/` | Settings, share, Updates tab | `settings-ui.js`, `share.js`, `changelog.js` |

**Build order** (`tools/build-ui.mjs`): `shell` → `runes` → `gear/table-kind.js` → `gear/artifacts-table.js` → `gear/relics-table.js` → `runes/table.js` → `rules` → `app` → monster modules → `teams` → `monsters/bootstrap.js`.

### Data (`js/data/`)

| Path | Scope |
|------|--------|
| `gear/parse.js` | SWEX artifacts & relics → normalized objects + panel stat bonuses |
| `artifact-ingame-score.js` | Artifact Ingame Score coefficients: `ARTIFACT_INGAME_WEIGHTS`, `calcArtifactIngameScore()`, `artifactIngameScoreBreakdown()` |
| `artifacts/effects.js` | Artifact sub-stat labels (SW-Exporter mapping) |
| `relics/effects.js` | Relic category / secondary labels (user-confirmed types only) |
| `parser.js`, `monster-db.js`, `skill-db.js` | Shared import / monsters |

### Rules tab layout

Two columns at the top of **Runes hub → Rules**:

| Column | Sub-tabs | Purpose |
|--------|----------|---------|
| **Runes** | Engine, Roles, Verdict rules | Stat constants, rune role formulas, Gem / Grind / Reapp |
| **Artifacts** | Roles, Verdict rules, Synergies | Editable artifact roles (useful subs + expected ATK/DEF/HP main), Keep thresholds, synergy toggles |

Artifact **Role** in the inventory table is auto-detected: best matching configured role (main stat must match when set). Settings persist in `localStorage`: `swrm_artifact_roles`, `swrm_artifact_synergies`, `swrm_artifact_verdict` (merged into `settings.artifactRules`).

### CSS (`css/features/`)

| Folder | Scope |
|--------|--------|
| `runes/` | Dashboard, rune grid, rune table core/chips (no artifact/relic-only rules) |
| `gear/` | Table-kind tabs, `#artifact-table` / `#relic-table` layout |
| `teams/` | Teams builder shell & cards |
| `monsters/` | Roster, detail, cards, rune slots on unit |
| `app/`, `guide/` | Settings, guide archive |

### Combat SPD & Sky Tribe Totem (`monsters-stats-calc.js` + `teams/ui.js`)

Displayed on **Teams** slot badges and **Monster detail → Total SPD** (same math).

| Piece | Source |
|--------|--------|
| Base SPD | SWARFARM scaled to unit level (fallback: `unit_list[].spd` when it is base-only) |
| +Runes / Swift | Computed from equipped runes + set bonuses (SWEX `unit_list[].spd` is **not** reused when it equals base) |
| +Totem % of base | Parsed from SWEX on load (priority below) |
| +Leader % of base | Active team leader with Attack Speed leader skill |

**Totem level in SWEX (2025–2026 exports):**

1. **`wizard_skill_list`** — row with **`skill_id: 14`** (Sky Tribe Totem / Speed Monument), field **`level`** (1–10 → up to 15% at level 10; table supports levels to 20).
2. **`wizard_info.unit_home_bonus`** (or root `unit_home_bonus`) — if present, SPD stat rows.
3. **Legacy:** **`deco_list`** / **`deo_list`** — **`master_id: 11001`**.

Diagnostic: `node tools/inspect-totem-from-json.mjs path/to/export.json`

**Demo teams:** `teams/storage.js` seeds sample lineups only when demo dataset is active; `syncDemoTeamsWithDatasetMode()` removes them after a real SWEX load.

Entry: `css/style.css` imports `runes`, `gear`, `teams`, `monsters` index files.

### Editing workflow

1. Change source under `js/features/` (not `js/ui.js` by hand).
2. Run `npm run build:ui`.
3. Reload the page (hard refresh if CSS changed).

### Future splits (optional)

- `js/features/artifacts/` only if artifact UI leaves the Runes table screen.

## UI source map

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

## CSS entry

**Production:** `index.html` loads `css/dist/app.css` (built by `npm run build:css`).

**Source chain** (`css/style.css` — used when editing partials) imports:

- `css/foundation/*` (base, header, overlays, toasts)
- `css/features/runes/index.css` (dashboard, rune table, hub, rules, stage-advisor)
- `css/features/gear/index.css` (artifact/relic table tabs & layout)
- `css/features/teams/index.css`
- `css/features/monsters/index.css`

## Conventions

- Keep source files feature-oriented, not numbered by old monolith line ranges.
- Keep `js/ui.js` committed as a build artifact for static hosting unless CI builds it.
- Prefer adding new UI code under the owning feature folder.
- Keep engine and core changes outside UI files when behavior is not presentation-specific.
- When splitting a large file, split by responsibility first: rendering, filters, chart helpers, persistence, or event wiring.
