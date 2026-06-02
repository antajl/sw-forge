# SW Forge — File Map

> Complete file-by-file map of the repository.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Entry point:** [`MASTER.md`](MASTER.md)

---

## ⛔ Do not edit manually

| File | Why |
|------|------|
| `js/ui.js` | Artifact of `npm run build:ui` |
| `css/dist/app.css` | Artifact of `npm run build:css` |
| Order of `<script defer>` in `index.html` | Hard dependency contract |

---

## Root and static files

| Path | Purpose |
|------|---------|
| `index.html` | Single HTML page (entire UI inline) |
| `_headers` | Cache-Control for Cloudflare Pages |
| `assets/fonts/*.woff2` | Self-hosted fonts (legacy, not connected) |
| `data/demo.json` | Demo SWEX (~5.5 MB) |
| `data/monsters-index.json` | Monster names/icons/meta (SWARFARM cache, `fetch-monsters-index.mjs`) |
| `data/skills-index.json` | Skills: max level, icons, description, upgrades, CD (`fetch-skills-index.mjs --fresh`, schema 2) |

---

## CSS

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

---

## JS — core (before UI)

| Path | Purpose |
|------|---------|
| `js/core/meta.js` | `APP_VERSION`, stat constants |
| `js/core/i18n.js` | `TRANSLATIONS` EN + RU |
| `js/core/i18n-fr.js` | FR partial (lazy-loaded) |
| `js/core/defaults.js` | Thresholds, roles, formulas, settings |
| `js/core/changelog-data.js` | `STATIC_CHANGELOG`, `STATIC_ROADMAP` |
| `js/core/bootstrap.js` | Assembles `window.SWRM` from defaults |

---

## JS — data

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

---

## JS — engine (no DOM)

| Path | Purpose |
|------|---------|
| `js/engine/engine-core.js` | `statMap`, HR anchor, sub helpers |
| `js/engine/engine-legacy-roles.js` | `checkRole`, `checkHighRoll`, duo |
| `js/engine/engine-gem-reapp-verdict.js` | Grind, Gem, Reapp, God sell |
| `js/advanced-formulas.js` | Formulas, `getAdvancedVerdict` |
| `js/engine/engine-process.js` | `processRune`, `processAll` |

---

## JS — workers

| Path | Purpose |
|------|---------|
| `js/workers/rune-processor.worker.js` | `processAll` in background |
| `js/features/runes/rune-processor-worker.js` | `processRunesAsync` + fallback |

---

## JS — other before ui.js

| Path | Purpose |
|------|---------|
| `js/self-test.js` | `SWRM.runSelfTests` |
| `js/swrm-motion.js` | GSAP animations |

---

## JS — features → `ui.js` (edit here)

Concatenation order: `tools/build-ui.mjs` (`CHUNKS` + `MONSTER_PARTS`).

### Shell / app

| File | Role |
|------|------|
| `shell/bootstrap.js` | Global app state, tabs |
| `shell/theme-nav.js` | Dark/light theme |
| `shell/i18n-bindings.js` | Binds `TRANSLATIONS` to DOM, lazy FR |
| `shell/mobile-nav.js` | Mobile navigation |
| `shell/filters-popover.js` | Filter popovers |
| `shell/main-tabs.js` | Runes / Monsters / Guide / Updates |

### Runes

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

### Gear

| File | Role |
|------|------|
| `gear/table-kind.js` | Runes / Artifacts / Relics sub-tabs |
| `gear/gear-roster-chips.js` | Chips above gear table |
| `gear/artifacts-table.js` | Artifacts table, header sorting |
| `gear/relics-table.js` | Relics table, header sorting |

### Rules

| File | Role |
|------|------|
| `rules/formulas-ui.js` | Formula editor |
| `rules/panel.js` | Rules container |
| `rules/constants-ui.js` | Constants UI |
| `rules/bootstrap.js` | Init settings / restore |
| `rules/policy-ui.js` | Eval policy |

### App

| File | Role |
|------|------|
| `app/settings-ui.js` | App Settings |
| `app/share.js` | Share Profile, `?s=`, `?profile=`, `?data=` |
| `app/changelog.js` | Updates / Roadmap UI |

### Monsters (`MONSTER_PARTS` + `monsters/bootstrap.js`)

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

---

## tools/

| Active | |
|--------|--|
| `build-ui.mjs` | Build `js/ui.js` |
| `build-css.mjs` | Build `css/dist/app.css` |
| `watch-ui.mjs` | Watch UI |
| `fetch-monsters-index.mjs` | Update `monsters-index.json` |
| `fetch-skills-index.mjs` | `skills-index.json` (+ `metaById`; `--fresh` for full re-fetch) |
| `extract-tab-icons.mjs` | Tab icons |
| `inspect-totem-from-json.mjs` | Where Sky Tribe Totem level is in SWEX (skill_id 14) |

One-time patches: `tools/archive/` (do not touch).

---

## docs/

| File | Role |
|------|------|
| `PROJECT-CONTEXT.md` | Quick entry |
| `MASTER.md` | Main reference |
| `PLANS.md` | Open product backlog |
| `ARCHITECTURE.md` | Runtime / build schema |
| `FEATURES.md` | Feature map by folders |
| `FILE-MAP.md` | This file |
| `FILE-SPLITTING-PLAN.md` | Plan for splitting large files |
| `LOAD-ORDER.md` | Script load order |
| `API-REFERENCE.md` | `window.SWRM` API + CSS variables |
| `KNOWN-ISSUES.md` | Known bugs |

---

## worker/

Cloudflare Worker + D1 — Share API (`worker/src/index.js`, `wrangler.toml`).

---

## External data SWARFARM (local vs network)

| Source | Local (`data/`) | Network (runtime) |
|--------|----------------|-------------------|
| **Skills** | `skills-index.json`: max level, icon, name, description, upgrades, CD | Fallback API only if `com2us_id` missing from index (`SWRM_LOCAL_ASSETS_ONLY` disables API) |
| **Monsters** | `monsters-index.json` schema 2: name, stats, `leader_skill`, portrait path | Detail API not called if row is complete (`monsterHasBundledDetail`) |
| **Images** | `assets/` + manifests (`skills-icons`, `leader-icons`, `monsters-portraits`, static bundle) | CDN fallback until file in manifest; `SWRM_LOCAL_ASSETS_ONLY=true` — local PNG only |
| **Relics** | `assets/relics/*.png` (manual) | — |
| **SWEX** | `demo.json` for demo only | User export — always local in browser |

Icons and static assets are cached by browser; JSON indexes use `?v=APP_VERSION`.
