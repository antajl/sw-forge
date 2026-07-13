# SW Forge Dependency Map

This document maps the dependencies between modules in SW Forge.

## High-Level Architecture

```
Core (constants, i18n, defaults)
  ↓
Bootstrap (assembles window.SWRM)
  ↓
Data (parser, DBs, scoring)
  ↓
Engine (verdicts, processing)
  ↓
UI (features, concatenated)
```

## Module Dependencies

### Core Layer (No dependencies)

**js/core/meta.js**
- Dependencies: None
- Exports: STAT_NAMES, SET_NAMES, GRADE_NAMES, APP_VERSION, debug flags, API URLs
- Used by: bootstrap.js, parser.js, engine modules

**js/core/i18n.js**
- Dependencies: None
- Exports: TRANSLATIONS (EN+RU), updateLanguage()
- Used by: bootstrap.js, UI modules
- Extended by: i18n-fr.js (lazy-loaded)

**js/core/defaults.js**
- Dependencies: meta.js (for stat names)
- Exports: DEFAULT_THRESHOLDS, DEFAULT_FORMULAS, DEFAULT_ROLES, artifact rules
- Used by: bootstrap.js, engine modules

**js/core/changelog-data.js**
- Dependencies: None
- Exports: STATIC_CHANGELOG, STATIC_ROADMAP
- Used by: bootstrap.js, changelog.js

**js/core/bootstrap.js**
- Dependencies: meta.js, i18n.js, defaults.js, changelog-data.js
- Exports: window.SWRM (assembles all core APIs)
- Used by: All subsequent modules (via window.SWRM)

### Data Layer (Depends on Core)

**js/data/artifacts/effects.js**
- Dependencies: None (self-contained effect definitions)
- Exports: Artifact effects data
- Used by: gear/parse.js, artifact-verdict.js

**js/data/artifact-ingame-score.js**
- Dependencies: None
- Exports: calcArtifactIngameScore() (disabled)
- Used by: gear/parse.js

**js/data/relics/effects.js**
- Dependencies: None (self-contained effect definitions)
- Exports: Relic types/labels
- Used by: gear/parse.js

**js/data/gear/parse.js**
- Dependencies: artifacts/effects.js, artifact-ingame-score.js, relics/effects.js
- Exports: parseArtifact(), parseRelic()
- Used by: parser.js (via parseSWEX)

**js/data/gear/icons.js**
- Dependencies: None
- Exports: Gear icon mappings
- Used by: gear UI modules

**js/data/parser.js**
- Dependencies: meta.js (stat names), gear/parse.js
- Exports: parseSWEX(), parseRune(), parseUnits(), calcEfficiency()
- Used by: engine modules, UI modules

**js/data/ingame-score.js**
- Dependencies: meta.js (stat names)
- Exports: calcIngameScore() (Com2uS Rating)
- Used by: parser.js, engine modules

**js/data/local-assets.js**
- Dependencies: None
- Exports: Local asset URLs
- Used by: UI modules

**js/data/skill-db.js**
- Dependencies: None (loads skills-index.json)
- Exports: skill DB, metaById()
- Used by: monsters UI modules

**js/data/monster-db.js**
- Dependencies: None (loads monsters-index.json)
- Exports: monster DB
- Used by: monsters UI modules

### Engine Layer (Depends on Core + Data)

**js/engine/engine-core.js**
- Dependencies: meta.js (stat names)
- Exports: statMap(), subRuneValue(), runeHasHrAnchor(), runePowerLevel0to3()
- Used by: engine-legacy-roles.js, engine-gem-reapp-verdict.js, engine-process.js

**js/engine/engine-legacy-roles.js**
- Dependencies: defaults.js (roles, thresholds), engine-core.js
- Exports: checkRole(), checkHighRoll()
- Used by: engine-process.js, advanced-formulas.js

**js/engine/engine-gem-reapp-verdict.js**
- Dependencies: defaults.js (grind/gem settings), engine-core.js
- Exports: grindVerdict(), gemVerdict(), reappVerdict()
- Used by: engine-process.js

**js/advanced-formulas.js**
- Dependencies: defaults.js (formulas), engine-legacy-roles.js
- Exports: getAdvancedVerdict()
- Used by: engine-process.js

**js/engine/engine-process.js**
- Dependencies: parser.js, engine-core.js, engine-legacy-roles.js, engine-gem-reapp-verdict.js, advanced-formulas.js
- Exports: processRune(), processAll()
- Used by: UI modules (runes/upload.js, monsters/monsters-runes.js)

### UI Layer (Depends on Core + Data + Engine)

**js/features/shell/** (Chrome, tabs, i18n)
- Dependencies: bootstrap.js (window.SWRM), i18n.js
- Files: bootstrap.js, theme-nav.js, donate-dialog.js, language-bindings.js, mobile-nav.js, filters-popover.js, main-tabs.js
- Used by: All UI modules (via IIFE closure)

**js/features/runes/** (Rune UI)
- Dependencies: bootstrap.js, parser.js, engine modules
- Files: stage-filters.js, rune-processor-worker.js, processed-cache.js, upload.js, utils.js, verdict-filters.js, charts.js, copy-summary.js, stage-advisor-ui.js, depth.js, dashboard.js, rune-score.js, table-row-render.js, table-virtual.js, table-filters.js, table.js
- Used by: Main rune interface

**js/features/gear/** (Gear UI)
- Dependencies: bootstrap.js, parser.js, gear/parse.js
- Files: table-kind.js, gear-table-filters.js, gear-roster-chips.js, artifact-verdict.js, dashboard-artifacts.js, artifacts-table.js, artifacts-virtual.js, relics-table.js
- Used by: Gear interface

**js/features/monsters/** (Monster UI)
- Dependencies: bootstrap.js, parser.js, monster-db.js, skill-db.js
- Files: bootstrap.js, monsters-state.js, monsters-hub.js, monsters-stats-calc.js, monsters-storage.js, monsters-bulk.js, monsters-filters.js, box-overview.js, skill-planner.js, monsters-gear.js, monsters-runes.js, monsters-detail.js, monsters-card.js, monsters-table.js, monsters-list.js, monsters-events.js
- Used by: Monster interface

**js/features/rules/** (Rules UI)
- Dependencies: bootstrap.js, defaults.js
- Files: formulas-ui.js, panel.js, constants-ui.js, bootstrap.js, policy-ui.js, artifact-rules-ui.js
- Used by: Rules panel

**js/features/app/** (App UI)
- Dependencies: bootstrap.js
- Files: settings-ui.js, share.js, changelog.js
- Used by: Settings, share, changelog

### Worker (Separate thread)

**js/workers/rune-processor.worker.js**
- Dependencies: parser.js, engine modules
- Created dynamically from rune-processor-worker.js
- Used by: runes/upload.js for background processing

### Lazy-Loaded

**js/core/i18n-fr.js**
- Dependencies: None
- Loaded on demand when FR language selected
- Extends TRANSLATIONS with French strings
- Triggered by: language-bindings.js

## Build-Time Dependencies

### UI Build (build-ui.mjs)

The order of files in CHUNKS array must match runtime dependencies:

1. shell/* (chrome, tabs, i18n)
2. runes/* (stage-filters, worker, cache, upload, utils, verdict-filters, charts, copy-summary, stage-advisor, depth, dashboard, rune-score, table-row-render, table-virtual, table-filters)
3. gear/* (table-kind, gear-table-filters, gear-roster-chips, artifact-verdict, dashboard-artifacts, artifacts-table, artifacts-virtual, relics-table)
4. runes/table.js (depends on gear/*)
5. rules/* (formulas-ui, panel, constants-ui, bootstrap, policy-ui, artifact-rules-ui)
6. app/* (settings-ui, share, changelog)
7. monsters/* (all monster modules)

### CSS Build (build-css.mjs)

The order of files in FILES array must match CSS dependency order:

1. foundation/* (base, header, i18n-fr, overlays, toasts, action-chrome)
2. guide/archive.css
3. app/settings.css
4. runes/* (typography, hub, stage-advisor, rules, grid, chrome, stat-cards, panel, dashboard-artifacts, chart-bars, slot-distribution, top-spd, eff-histo, floating-tip)
5. shared/table-zebra.css
6. runes/* (table-toolbar, table-core, table-header, table-chips)
7. gear/* (table-kind, table-filters)
8. teams/* (teams, teams-v2)
9. monsters/* (tokens, box-overview, skill-planner, hub, toolbar-v2, toolbar, elements, bulk, detail-runes, detail-gear, shell, toolbar-controls, list-runes, cards, table, rune-slots, detail, table-link, card-meta, detail-tabs, tags-bulk-stats, responsive)

### HTML Build (build-html.mjs)

Partial files are included in order:
1. partials/header.html
2. partials/tabs/dashboard.html
3. partials/tabs/gear.html
4. partials/tabs/monsters.html
5. partials/tabs/guide.html
6. partials/tabs/changelog.html
7. partials/tabs/app-settings.html

## No Circular Dependencies

The current architecture has no circular dependencies:
- Core has no dependencies
- Data depends only on Core
- Engine depends on Core + Data
- UI depends on Core + Data + Engine

## Key Dependency Rules

1. **window.SWRM** is assembled by bootstrap.js and available to all subsequent scripts
2. **TRANSLATIONS** is loaded by i18n.js and extended by lazy i18n-fr.js
3. **updateLanguage()** is defined in i18n-bindings.js (inside ui.js)
4. All feature modules are in the same IIFE closure (see build-ui.mjs)
5. Worker runs in separate thread but has same dependencies as main thread
6. Lazy-loaded modules (i18n-fr.js) must not be required by core functionality

## Adding New Dependencies

When adding a new module:

1. **Determine layer:** Core, Data, Engine, or UI
2. **Check dependencies:** Ensure all dependencies are loaded before your module
3. **Update build script:**
   - For JS: Add to build-ui.mjs CHUNKS array in correct position
   - For CSS: Add to build-css.mjs FILES array in correct position
4. **Test load order:** Verify script works when loaded in position
5. **Check for circular deps:** Ensure no module depends on your new module that also depends on it

## Common Dependency Issues

**Issue:** Module undefined when accessed
- **Cause:** Script loaded before dependency
- **Fix:** Move script later in load order

**Issue:** window.SWRM undefined
- **Cause:** Script loaded before bootstrap.js
- **Fix:** Ensure script is after bootstrap.js in index-shell.html

**Issue:** TRANSLATIONS undefined
- **Cause:** Script loaded before i18n.js
- **Fix:** Ensure script is after i18n.js in index-shell.html

**Issue:** Feature module can't access another feature module
- **Cause:** Wrong order in build-ui.mjs CHUNKS array
- **Fix:** Reorder CHUNKS array to match dependencies
