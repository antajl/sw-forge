# Feature layout (SW Forge)

How UI and data are split after the gear/teams redistribution.

## Principles

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

## JavaScript (`js/features/`)

| Folder | Scope | Main files |
|--------|--------|------------|
| `shell/` | App chrome, tabs, i18n bindings | `bootstrap.js`, `i18n-bindings.js`, `main-tabs.js` |
| `runes/` | Dashboard, rune table, filters, upload | `table.js`, `table-row-render.js`, `table-virtual.js`, `dashboard.js`, … |
| `gear/` | Artifact & relic tables; Dashboard artifact distributions; Keep/Sell verdicts | `dashboard-artifacts.js`, `artifact-verdict.js`, `artifacts-table.js`, `relics-table.js`, … |
| `teams/` | Team sets builder (Monsters → Teams hub pane); combat SPD badges | `storage.js`, `ui.js` |
| `monsters/` | Roster, cards, detail, gear on unit | `monsters-gear.js`, `monsters-detail.js`, … |
| `rules/` | Runes rules (Engine / Roles / Verdict) + Artifacts rules (Roles / Verdict / Synergies) | `panel.js`, `bootstrap.js`, `artifact-rules-ui.js`, … |
| `app/` | Settings, share, Updates tab | `settings-ui.js`, `share.js`, `changelog.js` |

**Build order** (`tools/build-ui.mjs`): `shell` → `runes` → `gear/table-kind.js` → `gear/artifacts-table.js` → `gear/relics-table.js` → `runes/table.js` → `rules` → `app` → monster modules → `teams` → `monsters/bootstrap.js`.

## Data (`js/data/`)

| Path | Scope |
|------|--------|
| `gear/parse.js` | SWEX artifacts & relics → normalized objects + panel stat bonuses |
| `artifact-ingame-score.js` | Artifact Ingame Score coefficients: `ARTIFACT_INGAME_WEIGHTS`, `calcArtifactIngameScore()`, `artifactIngameScoreBreakdown()` |
| `artifacts/effects.js` | Artifact sub-stat labels (SW-Exporter mapping) |
| `relics/effects.js` | Relic category / secondary labels (user-confirmed types only) |
| `parser.js`, `monster-db.js`, `skill-db.js` | Shared import / monsters |

## Rules tab layout

Two columns at the top of **Runes hub → Rules**:

| Column | Sub-tabs | Purpose |
|--------|----------|---------|
| **Runes** | Engine, Roles, Verdict rules | Stat constants, rune role formulas, Gem / Grind / Reapp |
| **Artifacts** | Roles, Verdict rules, Synergies | Editable artifact roles (useful subs + expected ATK/DEF/HP main), Keep thresholds, synergy toggles |

Artifact **Role** in the inventory table is auto-detected: best matching configured role (main stat must match when set). Settings persist in `localStorage`: `swrm_artifact_roles`, `swrm_artifact_synergies`, `swrm_artifact_verdict` (merged into `settings.artifactRules`).

## CSS (`css/features/`)

| Folder | Scope |
|--------|--------|
| `runes/` | Dashboard, rune grid, rune table core/chips (no artifact/relic-only rules) |
| `gear/` | Table-kind tabs, `#artifact-table` / `#relic-table` layout |
| `teams/` | Teams builder shell & cards |
| `monsters/` | Roster, detail, cards, rune slots on unit |
| `app/`, `guide/` | Settings, guide archive |

## Combat SPD & Sky Tribe Totem (`monsters-stats-calc.js` + `teams/ui.js`)

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

## Editing workflow

1. Change source under `js/features/` (not `js/ui.js` by hand).
2. Run `npm run build:ui`.
3. Reload the page (hard refresh if CSS changed).

## Future splits (optional)

- `js/features/artifacts/` only if artifact UI leaves the Runes table screen.
