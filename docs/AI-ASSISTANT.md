# AI Assistant Guide for SW Forge

This document provides specific instructions for AI assistants working on the SW Forge project.

## Project Summary

SW Forge is a browser-only Summoners War rune analyzer and monster hub. It's a static site on Cloudflare Pages that processes SWEX JSON exports entirely client-side. The stack is Vanilla JS + CSS (no frameworks), with a custom build system that concatenates feature files into production artifacts.

**Key URLs:**
- Prod: https://sw-forge.pages.dev
- Share API: https://sw-backend.antajltube.workers.dev
- Local: http://127.0.0.1:5500/

**Stack:** Vanilla JS + CSS, GSAP local (no external CDN)

## 6 Edit Rules (CRITICAL)

1. **partials/ changes** → Run `npm run build:html`
2. **js/features/ changes** → Run `npm run build:ui`
3. **CSS changes** (from build-css.mjs list) → Run `npm run build:css`
4. **UI strings EN/RU** → Edit translations-en.js + translations-ru.js → Run `npm run build:translations`
5. **Player-facing changes** → Update changelog with today's date only; then remove from BACKLOG.md
6. **NEVER edit manually:** js/ui.js, css/dist/app.css, index.html, js/core/translations.js, script order in index-shell.html

## Build Commands

```bash
npm run build:html         # tools/build-html.mjs → index.html
npm run build:translations # translations-en/ru → js/core/translations.js
npm run build:ui           # tools/build-ui.mjs → js/ui.js
npm run build:css          # tools/build-css.mjs → css/dist/app.css
npm run build              # all four steps
npm run watch:ui           # rebuild ui.js on save in js/features/
```

**When to run which command:**
- Edited partials/*.html → build:html
- Edited js/features/*.js → build:ui
- Edited CSS files in build-css.mjs list → build:css
- Edited translations-en.js or translations-ru.js → build:translations
- Multiple changes → build (runs all)

## Script Load Order (CRITICAL)

The order of `<script defer>` tags in index-shell.html is a hard dependency contract. DO NOT change without verifying dependencies.

1. js/core/meta.js
2. js/core/i18n.js
3. js/core/defaults.js
4. js/core/changelog-data.js
5. js/core/bootstrap.js (assembles window.SWRM)
6. js/data/artifacts/effects.js
7. js/data/artifact-ingame-score.js
8. js/data/relics/effects.js
9. js/data/gear/parse.js
10. js/data/gear/icons.js
11. js/data/parser.js
12. js/data/ingame-score.js
13. js/data/local-assets.js
14. js/data/skill-db.js
15. js/data/monster-db.js
16-21. js/engine/*, advanced-formulas.js
22. js/self-test.js
23. GSAP local (assets/gsap.min.js)
24. js/swrm-motion.js
25. js/ui.js

**Lazy-loaded:** js/core/i18n-fr.js (loaded on demand when FR is selected)

**Worker:** js/workers/rune-processor.worker.js (created dynamically, not in HTML)

## Dependency Flow

```
Core (meta, i18n, defaults, changelog-data)
  ↓
Bootstrap (assembles window.SWRM)
  ↓
Data (parser, DBs, ingame-score, gear)
  ↓
Engine (engine-core, engine-legacy-roles, engine-gem-reapp-verdict, engine-process)
  ↓
UI (concatenated from js/features/)
```

**Key dependencies:**
- window.SWRM is assembled by bootstrap.js and available to all subsequent scripts
- TRANSLATIONS is loaded by i18n.js and extended by lazy i18n-fr.js
- updateLanguage() is defined in i18n-bindings.js (inside ui.js)
- All feature modules are in the same IIFE closure (see build-ui.mjs)

## Project Structure

### Core JavaScript (loaded first)
- `js/core/meta.js` - APP_VERSION, stat constants, localization
- `js/core/defaults.js` - Thresholds, roles, formulas, settings
- `js/core/bootstrap.js` - Assembles window.SWRM API

### Data Layer
- `js/data/parser.js` - SWEX parsing, SWOP Eff%
- `js/data/ingame-score.js` - Com2uS Rating calculation
- `js/data/monster-db.js` - Monster index
- `js/data/skill-db.js` - Skills with metaById
- `js/data/gear/parse.js` - Artifacts/relics parsing

### Engine (no DOM)
- `js/engine/engine-core.js` - statMap, HR anchor helpers
- `js/engine/engine-legacy-roles.js` - Role checking
- `js/engine/engine-gem-reapp-verdict.js` - Grind/Gem/Reapp verdicts
- `js/engine/engine-process.js` - Rune processing

### Features (→ ui.js)
- `js/features/shell/` - Chrome, tabs, i18n bindings
- `js/features/runes/` - Dashboard, table, filters, upload
- `js/features/gear/` - Artifacts/relics tables
- `js/features/monsters/` - Roster, cards, detail, gear
- `js/features/rules/` - Rune rules + artifact rules
- `js/features/app/` - Settings, share, changelog

### CSS Organization
- `css/foundation/` - Base, header, overlays, toasts, buttons
- `css/features/runes/` - Rune dashboard, table, rules
- `css/features/gear/` - Gear tables
- `css/features/monsters/` - Monster UI
- `css/features/teams/` - Teams builder

### HTML Assembly
- `index-shell.html` - Template with `<!-- @include partials/... -->` markers
- `partials/header.html` - Header partial
- `partials/tabs/*.html` - Tab content (dashboard, gear, monsters, guide, changelog, app-settings)
- `tools/build-html.mjs` - Replaces markers with partial content

## Checklists for Common Tasks

### Task: Add a New Feature

1. Identify which area: runes, gear, monsters, rules, or app
2. Create/edit files in `js/features/[area]/`
3. If adding UI strings, edit `js/core/translations-en.js` and `js/core/translations-ru.js`
4. If adding CSS, edit files in `css/features/[area]/`
5. If adding HTML partials, edit `partials/tabs/[tab].html`
6. Run build commands:
   - `npm run build:ui` (for JS changes)
   - `npm run build:css` (for CSS changes)
   - `npm run build:translations` (for translation changes)
   - `npm run build:html` (for HTML partial changes)
7. Test locally at http://127.0.0.1:5500/
8. If player-facing, add to changelog with today's date

### Task: Fix a Bug

1. Identify the affected file (use grep/search)
2. Understand the dependency context (check script load order)
3. Make minimal fix (prefer upstream fixes over downstream workarounds)
4. Run appropriate build command based on file type
5. Test the fix
6. If bug was in BACKLOG.md, remove it

### Task: Add UI String

1. Add key to `js/core/translations-en.js`
2. Add translation to `js/core/translations-ru.js`
3. If FR needed, add to `js/core/translations-fr.js`
4. Run `npm run build:translations`
5. Use the key in JS via `TRANSLATIONS[key]` or in HTML via `data-i18n="key"`

### Task: Change CSS

1. Identify if CSS file is in build-css.mjs list
2. If yes, edit the CSS file
3. Run `npm run build:css`
4. If adding new CSS file, add it to build-css.mjs list
5. Test visual changes

### Task: Change Rune Verdict

1. Edit `js/core/defaults.js` (thresholds, formulas, roles)
2. Or edit `js/engine/engine-legacy-roles.js` (role checking logic)
3. Or edit `js/engine/engine-gem-reapp-verdict.js` (grind/gem/reapp)
4. Run `npm run build:ui` (if engine changes are in features)
5. Test with demo.json

## Common Pitfalls

**DO NOT:**
- Edit js/ui.js directly (it's a build artifact)
- Edit css/dist/app.css directly (it's a build artifact)
- Edit index.html directly (it's a build artifact)
- Change script order in index-shell.html without verifying dependencies
- Forget to run build commands after editing source files
- Add hardcoded hex colors in CSS (use CSS variables instead)
- Edit js/core/translations.js directly (it's a build artifact)

**DO:**
- Always run build commands after editing source files
- Check script load order before adding new dependencies
- Use CSS variables for colors (defined in css/foundation/base.css)
- Keep changes minimal and focused
- Test locally before assuming it works
- Update changelog for player-facing changes

## Debugging Checklist

1. **Enable debug mode:** Check if debug flags are set in js/core/meta.js
2. **Check console:** Look for errors in browser DevTools
3. **Verify build:** Ensure you ran the correct build command
4. **Check dependencies:** Verify script load order is correct
5. **Test with demo.json:** Use data/demo.json for consistent testing
6. **Check translations:** Verify UI strings are in TRANSLATIONS object
7. **Check CSS variables:** Ensure you're using defined CSS variables

## Game Knowledge Reference

For game mechanics (rune rules, grind/gem/reapp, artifacts), see `docs/GAME-KNOWLEDGE.md`.

**Key points:**
- Engine/data uses English stat names (HP, ATK, DEF, SPD, CRate, CDmg, RES, ACC)
- UI uses localized names (FR: PV, ATQ, VIT, TC, DCC)
- Substat uniqueness rule: same substat cannot appear twice on a rune
- Grindstones: only HP/ATK/DEF (flat or %), SPD
- Gems: only CRate, CDmg, RES, ACC
- Artifact scoring is disabled (formula unconfirmed)

## API Reference

For window.SWRM API and CSS variables, see `docs/API-REFERENCE.md`.

**Key API:**
- `window.SWRM.parseSWEX(json)` - Parse SWEX export
- `window.SWRM.calcEfficiency(rune)` - Calculate rune efficiency
- `window.SWRM.processAll(runes)` - Process all runes with verdicts
- `window.SWRM.runSelfTests()` - Run self-tests

## File Map

For detailed file structure, see `docs/PROJECT-STRUCTURE.md`.

## Quick Reference

**Build commands:**
- partials/ → build:html
- js/features/ → build:ui
- CSS → build:css
- translations → build:translations
- full build → build

**Script order:** core → data → engine → UI (25 scripts, strict order)

**Edit rules:** Never edit ui.js, app.css, index.html, translations.js manually

**Dependencies:** window.SWRM assembled by bootstrap.js, available to all subsequent scripts
