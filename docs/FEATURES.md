# Feature layout (SW Forge)

How UI and data are split after the gear/teams redistribution.

## Principles

| Layer | Role |
|-------|------|
| `js/features/<name>/` | Browser UI modules concatenated into `js/ui.js` (`npm run build:ui`) |
| `js/data/<name>/` | Static labels & SWEX parsers loaded before `ui.js` in `index.html` |
| `css/features/<name>/` | Feature styles imported from `css/style.css` |

**Runes tab → Table** still hosts three list kinds (Runes / Artifacts / Relics) in one screen; only the **code folders** are split.

## JavaScript (`js/features/`)

| Folder | Scope | Main files |
|--------|--------|------------|
| `shell/` | App chrome, tabs, i18n bindings | `bootstrap.js`, `i18n-bindings.js`, `main-tabs.js` |
| `runes/` | Dashboard, rune table, filters, upload | `table.js`, `table-row-render.js`, `dashboard.js`, … |
| `gear/` | Artifact & relic inventory tables + Runes/Artifacts/Relics sub-tabs | `table-kind.js`, `artifacts-table.js`, `relics-table.js` |
| `teams/` | Team sets builder (Monsters → Teams hub pane) | `storage.js`, `ui.js` |
| `monsters/` | Roster, cards, detail, gear on unit | `monsters-gear.js`, `monsters-detail.js`, … |
| `rules/` | Rune rules panels | `panel.js`, `bootstrap.js`, … |
| `app/` | Settings, share, changelog | `settings-ui.js`, `share.js` |

**Build order** (`tools/build-ui.mjs`): `shell` → `runes` → `gear/table-kind.js` → `gear/artifacts-table.js` → `gear/relics-table.js` → `runes/table.js` → `rules` → `app` → monster modules → `teams` → `monsters/bootstrap.js`.

## Data (`js/data/`)

| Path | Scope |
|------|--------|
| `gear/parse.js` | SWEX artifacts & relics → normalized objects + panel stat bonuses |
| `artifacts/effects.js` | Artifact sub-stat labels (SW-Exporter mapping) |
| `relics/effects.js` | Relic category / secondary labels (user-confirmed types only) |
| `parser.js`, `monster-db.js`, `skill-db.js` | Shared import / monsters |

## CSS (`css/features/`)

| Folder | Scope |
|--------|--------|
| `runes/` | Dashboard, rune grid, rune table core/chips (no artifact/relic-only rules) |
| `gear/` | Table-kind tabs, `#artifact-table` / `#relic-table` layout |
| `teams/` | Teams builder shell & cards |
| `monsters/` | Roster, detail, cards, rune slots on unit |
| `app/`, `guide/` | Settings, guide archive |

Entry: `css/style.css` imports `runes`, `gear`, `teams`, `monsters` index files.

## Editing workflow

1. Change source under `js/features/` (not `js/ui.js` by hand).
2. Run `npm run build:ui`.
3. Reload the page (hard refresh if CSS changed).

## Future splits (optional)

- `js/features/artifacts/` only if artifact UI leaves the Runes table screen.
