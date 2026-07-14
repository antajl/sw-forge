# SW Forge — Development Tools

> **Context:** [MASTER.md](MASTER.md)
> Reference for all development tools in the `tools/` directory.

---

## Overview

The `tools/` directory contains scripts for building, validating, fetching assets, and managing translations. These tools are Node.js modules (`.mjs` files) that can be run directly with `node`.

---

## Build Tools

### build-html.mjs

Assembles `index.html` from `index-shell.html` and partial files.

```bash
node tools/build-html.mjs
# or
npm run build:html
```

**Features:**
- Replaces `<!-- @include partials/... -->` markers with partial content
- Adds hash-based cache busting to CSS, JS, and translations URLs
- Supports nested includes (up to 20 levels to prevent cycles)

**Output:** `index.html` in project root

---

### build-css.mjs

Concatenates CSS partials into `css/dist/app.css` with minification.

```bash
node tools/build-css.mjs
# or
npm run build:css
```

**Features:**
- Concatenates CSS files in order defined in `FILES` array
- Minifies output using csso
- Reports size reduction percentage

**Output:** `css/dist/app.css`

**Source files:** Listed in `FILES` array (70+ files from `css/foundation/` and `css/features/`)

---

### build-ui.mjs

Concatenates UI feature files into `js/ui.js` with minification and source maps.

```bash
node tools/build-ui.mjs
# or
npm run build:ui
```

**Features:**
- Concatenates feature files in order defined in `CHUNKS` array
- Supports modular monsters architecture (checks for `MONSTER_PARTS`)
- Minifies output using terser
- Generates source map for debugging
- Reports size reduction percentage

**Output:** `js/ui.js` and `js/ui.js.map`

**Source files:** `js/features/**/*.js` (58+ feature modules)

---

### build-translations.mjs

Joins English and Russian translations into a single bundle.

```bash
node tools/build-translations.mjs
# or
npm run build:translations
```

**Features:**
- Merges `translations-en.js` and `translations-ru.js` into `translations.js`
- French remains separate for lazy loading
- Validates translation structure

**Output:** `js/core/translations.js`

**Source files:** `js/core/translations-en.js`, `js/core/translations-ru.js`

---

### build-favicons.mjs

Generates favicon files for the application.

```bash
node tools/build-favicons.mjs
# or
npm run build:favicons
```

**Output:** Favicon files in `assets/` directory

---

### build-validate.mjs

Validates build artifacts for common issues.

```bash
node tools/build-validate.mjs
# or
npm run build:validate
```

**Checks:**
- Hex colors in CSS features (should use CSS variables)
- Translation completeness
- Missing assets

---

### validate-data.mjs

Validates data files and asset completeness.

```bash
node tools/validate-data.mjs
# or
npm run validate:data
```

**Checks:**
- JSON file validity
- Missing assets from manifests
- Data structure integrity

---

## Asset Fetching Tools

### fetch-static-bundle.mjs

Fetches the complete static asset bundle from SWARFARM.

```bash
node tools/fetch-static-bundle.mjs
# or
npm run fetch:static-bundle
```

**Fetches:** All static assets in one operation

---

### fetch-skills-icons.mjs

Fetches skill icons from SWARFARM.

```bash
node tools/fetch-skills-icons.mjs
# or
npm run fetch:skills-icons
```

**Output:** Skill icons in `assets/` directory

---

### fetch-leader-icons.mjs

Fetches leader icons from SWARFARM.

```bash
node tools/fetch-leader-icons.mjs
# or
npm run fetch:leader-icons
```

**Output:** Leader icons in `assets/` directory

---

### fetch-monsters-index.mjs

Fetches monster index from SWARFARM.

```bash
node tools/fetch-monsters-index.mjs --fresh
# or
npm run fetch:monsters-index
```

**Output:** `data/monsters-index.json`

**Flag:** `--fresh` forces fresh fetch (ignores cache)

---

### fetch-monsters-portraits.mjs

Fetches monster portrait images from SWARFARM.

```bash
node tools/fetch-monsters-portraits.mjs
# or
npm run fetch:monsters-portraits
```

**Output:** Monster portraits in `assets/` directory

---

### fetch-skills-index.mjs

Fetches skills index from SWARFARM.

```bash
node tools/fetch-skills-index.mjs --fresh
# or
npm run fetch:data
```

**Output:** `data/skills-index.json`

**Flag:** `--fresh` forces fresh fetch (ignores cache)

---

### fetch-missing-assets.mjs

Fetches assets that are missing based on manifests.

```bash
node tools/fetch-missing-assets.mjs
# or
npm run fetch:missing-assets
```

**Features:**
- Checks manifests for missing assets
- Fetches only missing files
- Updates asset reports

---

### diagnose-missing-assets.mjs

Diagnoses missing assets without fetching.

```bash
node tools/diagnose-missing-assets.mjs
# or
npm run diagnose:missing-assets
```

**Output:** Report of missing assets in console

---

### optimize-assets.mjs

Optimizes images by converting to WebP format.

```bash
node tools/optimize-assets.mjs
# or
npm run optimize:assets
```

**Features:**
- Converts PNG/JPEG to WebP
- Reduces file size
- Maintains quality

---

## Translation Tools

### translations-extract-en.mjs

Extracts English translation keys from code.

```bash
node tools/translations-extract-en.mjs
```

**Output:** `_en-keys.json` (extracted keys)

---

### translations-build-fr.mjs

Builds French translation bundle.

```bash
node tools/translations-build-fr.mjs
```

**Output:** French translation bundle

---

### translations-fr-audit.mjs

Audits French translations for quality issues.

```bash
node tools/translations-fr-audit.mjs
```

**Checks:**
- Missing keys
- Inconsistent formatting
- Translation quality

---

### translations-fr-translate.mjs

Translates missing French keys (requires translation service).

```bash
node tools/translations-fr-translate.mjs
```

**Features:**
- Identifies missing French keys
- Attempts automatic translation
- Updates `translations-fr.js`

---

### translations-fr-dictionary.mjs

Manages French translation dictionary.

```bash
node tools/translations-fr-dictionary.mjs
```

**Output:** French dictionary for translation assistance

---

### _generate-fr-dictionary.mjs

Generates French translation dictionary from existing translations.

```bash
node tools/_generate-fr-dictionary.mjs
```

**Output:** Comprehensive French dictionary

---

### append-fr-new-keys.mjs

Appends new keys to French translations.

```bash
node tools/append-fr-new-keys.mjs
```

**Features:**
- Finds new keys in English
- Adds placeholders to French
- Preserves existing translations

---

### audit-fr-quality.mjs

Audits French translation quality.

```bash
node tools/audit-fr-quality.mjs
```

**Output:** Quality report with suggestions

---

### audit-guide-fr.mjs

Audits French guide content.

```bash
node tools/audit-guide-fr.mjs
```

**Checks:**
- Guide translations
- Formatting consistency
- Missing sections

---

### fix-guide-fr.mjs

Fixes common issues in French guide.

```bash
node tools/fix-guide-fr.mjs
```

**Features:**
- Auto-fixes formatting issues
- Corrects common errors
- Updates guide content

---

### guide-fr-phrases.mjs

Manages French guide phrase dictionary.

```bash
node tools/guide-fr-phrases.mjs
```

**Output:** Phrase dictionary for guide translations

---

### inject-guide-fr.mjs

Injects French guide content into HTML.

```bash
node tools/inject-guide-fr.mjs
```

**Features:**
- Replaces English guide with French
- Preserves HTML structure
- Updates guide section

---

### rebuild-guide-fr.mjs

Rebuilds French guide from source.

```bash
node tools/rebuild-guide-fr.mjs
```

**Features:**
- Rebuilds entire French guide
- Applies latest translations
- Validates output

---

### rebuild-translations-fr.mjs

Rebuilds French translations from dictionary.

```bash
node tools/rebuild-translations-fr.mjs
```

**Features:**
- Rebuilds `translations-fr.js`
- Applies dictionary changes
- Validates structure

---

### translations-audit.mjs

Audits all translation files.

```bash
node tools/translations-audit.mjs
```

**Checks:**
- All language files
- Key consistency
- Missing translations

---

## Development Tools

### watch-ui.mjs

Watches for changes in `js/features/` and rebuilds `ui.js` automatically.

```bash
node tools/watch-ui.mjs
# or
npm run watch:ui
```

**Features:**
- Monitors `js/features/` directory
- Auto-runs `build-ui.mjs` on file changes
- Reports build status

---

## Utility Tools

### split-gear-dashboard.mjs

Splits gear dashboard into separate modules.

```bash
node tools/split-gear-dashboard.mjs
```

**Purpose:** Modularization of gear dashboard code

---

### split-monsters-dashboard.mjs

Splits monsters dashboard into separate modules.

```bash
node tools/split-monsters-dashboard.mjs
```

**Purpose:** Modularization of monsters dashboard code

---

### extract-tab-icons.mjs

Extracts tab icons from the codebase.

```bash
node tools/extract-tab-icons.mjs
```

**Output:** Tab icon manifest

---

### resolve-demo-teams.mjs

Resolves team data for demo JSON.

```bash
node tools/resolve-demo-teams.mjs
```

**Purpose:** Updates demo teams with current data

---

### test-totem-parse.mjs

Tests totem parsing from SWEX data.

```bash
node tools/test-totem-parse.mjs
```

**Purpose:** Validates totem parsing logic

---

### inspect-totem-from-json.mjs

Inspects totem data from JSON file.

```bash
node tools/inspect-totem-from-json.mjs
```

**Purpose:** Debug totem data structure

---

## Archive Tools

The `tools/archive/` directory contains deprecated or historical tools that are kept for reference but not actively used.

---

## NPM Scripts

All tools are accessible via npm scripts in `package.json`:

```bash
npm run build:html         # Build HTML
npm run build:translations # Build translations
npm run build:ui           # Build UI
npm run build:css          # Build CSS
npm run build:favicons     # Build favicons
npm run build:validate     # Validate build
npm run validate:data       # Validate data
npm run build              # Build all
npm run fetch:static-bundle # Fetch static bundle
npm run fetch:skills-icons # Fetch skill icons
npm run fetch:leader-icons # Fetch leader icons
npm run fetch:monsters-index # Fetch monsters
npm run fetch:monsters-portraits # Fetch portraits
npm run fetch:assets       # Fetch all assets
npm run diagnose:missing-assets # Diagnose missing
npm run fetch:missing-assets # Fetch missing
npm run fetch:data         # Fetch data (skills + monsters)
npm run watch:ui           # Watch UI changes
npm run optimize:assets    # Optimize images
```

---

## Best Practices

1. **Use npm scripts** — Prefer `npm run build:ui` over `node tools/build-ui.mjs`
2. **Run validation** — Always run `npm run build:validate` after builds
3. **Check assets** — Run `npm run diagnose:missing-assets` before releases
4. **Test translations** — Audit translations with `translations-audit.mjs`
5. **Watch during development** — Use `npm run watch:ui` for faster iteration

---

## Related Documentation

- [00-MASTER.md](00-MASTER.md) — Project overview and build commands
- [03-PROJECT-STRUCTURE.md](03-PROJECT-STRUCTURE.md) — File structure and build system
- [09-CI-CD.md](09-CI-CD.md) — Deployment guide
