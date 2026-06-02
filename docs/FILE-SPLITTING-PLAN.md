# SW Forge — File Splitting Plan

> Detailed plan for splitting large files to improve maintainability.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **File map:** [`FILE-MAP.md`](FILE-MAP.md)  
> **Related:** [`KNOWN-ISSUES.md`](KNOWN-ISSUES.md) § index.html monolithic

---

## Overview

This document outlines a plan to split large, monolithic files into smaller, more manageable pieces. The goal is to improve developer experience without changing runtime behavior or requiring a build system.

**Priority:** High for `index.html`, Medium for JS core files.

---

## 1. index.html — Split by Main Tabs

### Current State
- **Size:** 4237 lines, ~371KB
- **Structure:** Single file containing all tabs inline
- **Issue:** Difficult to navigate and edit

### Proposed Structure

Split into modular HTML partials loaded via JavaScript (no build system required):

```
index.html (main shell, ~200 lines)
├── partials/header.html
├── partials/tabs/dashboard.html
├── partials/tabs/gear.html
├── partials/tabs/monsters.html
├── partials/tabs/guide.html
├── partials/tabs/updates.html
└── partials/tabs/settings.html
```

### Implementation Plan

#### Step 1: Create partials directory structure
```bash
mkdir -p partials/tabs
```

#### Step 2: Extract header to partials/header.html
**Content to extract:** Lines 1-179 (DOCTYPE, `<head>`, header navigation)

**New index.html structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SW Forge</title>
  <!-- CSS, fonts, meta tags -->
</head>
<body>
  <div id="header-container"></div>
  <div id="demo-dataset-banner"></div>
  <main>
    <div id="tabs-container"></div>
  </main>
  <!-- Scripts -->
</body>
</html>
```

**Loading script (inline in index.html):**
```html
<script>
  // Load partials synchronously before DOMContentLoaded
  async function loadPartial(id, path) {
    const response = await fetch(path);
    const html = await response.text();
    document.getElementById(id).innerHTML = html;
  }

  (async () => {
    await loadPartial('header-container', 'partials/header.html');
    await loadPartial('tabs-container', 'partials/tabs/dashboard.html');
    // Load other tabs on demand or all at once
  })();
</script>
```

#### Step 3: Extract each tab content

**partials/tabs/dashboard.html**
- Extract: Lines 196-342 (`<section id="tab-dashboard">`)
- Size: ~150 lines
- Contains: Dashboard hub (Runes/Monsters sub-tabs), stage advisor, charts

**partials/tabs/gear.html**
- Extract: Lines 344-1480 (`<section id="tab-runes">`)
- Size: ~1136 lines
- Contains: Gear hub (Dashboard/Table/Rules sub-tabs), rune table, rules panels

**partials/tabs/monsters.html**
- Extract: Lines 1482-1944 (`<section id="tab-monsters">`)
- Size: ~462 lines
- Contains: Monsters hub, roster, detail, teams

**partials/tabs/guide.html**
- Extract: Lines 1946-4065 (`<section id="tab-guide">`)
- Size: ~2119 lines
- Contains: Guide content (EN/RU/FR sections)

**partials/tabs/updates.html**
- Extract: Lines 4067-4095 (`<section id="tab-changelog">`)
- Size: ~28 lines
- Contains: Updates/Changelog UI shell

**partials/tabs/settings.html**
- Extract: Lines 4097-end (`<section id="tab-app-settings">`)
- Size: ~140 lines
- Contains: App settings UI

#### Step 4: Update script loading order
Move all `<script defer>` tags to the end of `index.html` (after partials are loaded).

#### Step 5: Update documentation
- Update `FILE-MAP.md` with new structure
- Update `ARCHITECTURE.md` with partial loading strategy
- Update `LOAD-ORDER.md` with new load sequence

### Benefits
- **Navigation:** Each tab in separate file, easier to find content
- **Collaboration:** Multiple developers can work on different tabs simultaneously
- **Git:** Smaller diffs per change, easier code review
- **Maintenance:** Clear separation of concerns

### Risks & Mitigations
- **Risk:** Fetch latency for partials
  - **Mitigation:** Load critical partials synchronously, lazy-load others
- **Risk:** Offline support (file:// protocol)
  - **Mitigation:** Provide fallback to single-file mode or use build system for production
- **Risk:** SEO impact
  - **Mitigation:** Not applicable (SPA, content loaded client-side)

### Alternative: Build System Approach
If fetch-based loading is problematic, use a simple build step:

**tools/build-html.mjs:**
```javascript
import fs from 'fs';

const partials = {
  'header-container': 'partials/header.html',
  'tabs-container': 'partials/tabs/dashboard.html',
  // ... other tabs
};

let html = fs.readFileSync('index.html', 'utf8');
for (const [id, path] of Object.entries(partials)) {
  const content = fs.readFileSync(path, 'utf8');
  html = html.replace(`<div id="${id}"></div>`, `<div id="${id}">${content}</div>`);
}
fs.writeFileSync('dist/index.html', html);
```

**Update package.json:**
```json
{
  "scripts": {
    "build:html": "node tools/build-html.mjs",
    "build": "npm run build:html && npm run build:css && npm run build:ui"
  }
}
```

---

## 2. js/core/i18n.js — Split by Language

### Current State
- **Size:** 1857 lines, ~100KB
- **Structure:** Single object with EN and RU translations
- **Issue:** Difficult to find specific translation strings

### Proposed Structure

```
js/core/i18n.js (main entry, ~50 lines)
├── js/core/i18n-en.js (EN translations, ~900 lines)
└── js/core/i18n-ru.js (RU translations, ~900 lines)
```

### Implementation Plan

#### Step 1: Extract translations
Split the `TRANSLATIONS` object by language:

**js/core/i18n-en.js:**
```javascript
export const TRANSLATIONS_EN = {
  // All English translations
  "lbl-tab-dashboard": "Dashboard",
  // ... rest of EN strings
};
```

**js/core/i18n-ru.js:**
```javascript
export const TRANSLATIONS_RU = {
  // All Russian translations
  "lbl-tab-dashboard": "Дашборд",
  // ... rest of RU strings
};
```

#### Step 2: Create main i18n.js
**js/core/i18n.js:**
```javascript
import { TRANSLATIONS_EN } from './i18n-en.js';
import { TRANSLATIONS_RU } from './i18n-ru.js';

export const TRANSLATIONS = {
  en: TRANSLATIONS_EN,
  ru: TRANSLATIONS_RU
};

export const DEFAULT_LANG = 'en';
```

#### Step 3: Update index.html load order
Add new script tags before existing i18n.js:
```html
<script defer src="js/core/i18n-en.js"></script>
<script defer src="js/core/i18n-ru.js"></script>
<script defer src="js/core/i18n.js"></script>
```

#### Step 4: Update i18n-fr.js
Keep as-is (already separate file).

### Benefits
- **Navigation:** Easier to find translation strings by language
- **Collaboration:** Translators can work on separate language files
- **Maintenance:** Clear separation of languages

### Risks & Mitigations
- **Risk:** More HTTP requests
  - **Mitigation:** Minimal impact (2 additional small files)
- **Risk:** Breaking existing code
  - **Mitigation:** Keep same export structure (`TRANSLATIONS` object)

---

## 3. js/core/defaults.js — Split by Category

### Current State
- **Size:** 1344 lines, ~54KB
- **Structure:** Mixed settings, thresholds, formulas
- **Issue:** Difficult to find specific defaults

### Proposed Structure

```
js/core/defaults.js (main entry, ~50 lines)
├── js/core/defaults-thresholds.js (rune thresholds, ~400 lines)
├── js/core/defaults-settings.js (UI settings, ~300 lines)
└── js/core/defaults-formulas.js (formula constants, ~600 lines)
```

### Implementation Plan

#### Step 1: Categorize and extract
Analyze current defaults.js and split by responsibility:

**js/core/defaults-thresholds.js:**
```javascript
export const RUNE_THRESHOLDS = {
  // Speed, HP, ATK, DEF thresholds
  // Gem, Grind, Reapp thresholds
};
```

**js/core/defaults-settings.js:**
```javascript
export const UI_SETTINGS = {
  // Default UI state
  // Filter defaults
  // Display preferences
};
```

**js/core/defaults-formulas.js:**
```javascript
export const FORMULA_CONSTANTS = {
  // Weights for scoring
  // Multipliers for calculations
};
```

#### Step 2: Create main defaults.js
**js/core/defaults.js:**
```javascript
import { RUNE_THRESHOLDS } from './defaults-thresholds.js';
import { UI_SETTINGS } from './defaults-settings.js';
import { FORMULA_CONSTANTS } from './defaults-formulas.js';

export const DEFAULTS = {
  ...RUNE_THRESHOLDS,
  ...UI_SETTINGS,
  ...FORMULA_CONSTANTS
};
```

#### Step 3: Update index.html load order
```html
<script defer src="js/core/defaults-thresholds.js"></script>
<script defer src="js/core/defaults-settings.js"></script>
<script defer src="js/core/defaults-formulas.js"></script>
<script defer src="js/core/defaults.js"></script>
```

#### Step 4: Update bootstrap.js
Ensure `window.SWRM` assembly uses the merged `DEFAULTS` object.

### Benefits
- **Navigation:** Easier to find specific default values
- **Maintenance:** Clear separation of concerns
- **Testing:** Can test each category independently

### Risks & Mitigations
- **Risk:** Breaking existing code that imports defaults.js
  - **Mitigation:** Keep same export structure (`DEFAULTS` object)
- **Risk:** More HTTP requests
  - **Mitigation:** Minimal impact (3 additional small files)

---

## 4. js/core/changelog-data.js — Split by Type

### Current State
- **Size:** 754 lines, ~52KB
- **Structure:** STATIC_CHANGELOG and STATIC_ROADMAP in one file
- **Issue:** Mixed concerns (past releases vs future plans)

### Proposed Structure

```
js/core/changelog-data.js (main entry, ~30 lines)
├── js/core/changelog-releases.js (STATIC_CHANGELOG, ~500 lines)
└── js/core/changelog-roadmap.js (STATIC_ROADMAP, ~250 lines)
```

### Implementation Plan

#### Step 1: Extract releases
**js/core/changelog-releases.js:**
```javascript
export const STATIC_CHANGELOG = [
  // All release entries
];
```

#### Step 2: Extract roadmap
**js/core/changelog-roadmap.js:**
```javascript
export const STATIC_ROADMAP = [
  // All roadmap entries
];
```

#### Step 3: Create main changelog-data.js
**js/core/changelog-data.js:**
```javascript
import { STATIC_CHANGELOG } from './changelog-releases.js';
import { STATIC_ROADMAP } from './changelog-roadmap.js';

export { STATIC_CHANGELOG, STATIC_ROADMAP };
```

#### Step 4: Update index.html load order
```html
<script defer src="js/core/changelog-releases.js"></script>
<script defer src="js/core/changelog-roadmap.js"></script>
<script defer src="js/core/changelog-data.js"></script>
```

### Benefits
- **Navigation:** Clear separation of releases vs roadmap
- **Maintenance:** Easier to update roadmap without touching releases
- **Workflow:** Can update roadmap independently

### Risks & Mitigations
- **Risk:** Breaking existing code
  - **Mitigation:** Keep same export structure (named exports)

---

## Implementation Priority

### Phase 1: High Priority
1. **index.html** — Split by tabs (largest impact)
   - Estimated effort: 4-6 hours
   - Risk: Medium (requires careful testing)

### Phase 2: Medium Priority
2. **js/core/i18n.js** — Split by language
   - Estimated effort: 1-2 hours
   - Risk: Low (simple extraction)

3. **js/core/defaults.js** — Split by category
   - Estimated effort: 2-3 hours
   - Risk: Low-Medium (requires careful categorization)

### Phase 3: Low Priority
4. **js/core/changelog-data.js** — Split by type
   - Estimated effort: 1 hour
   - Risk: Low (simple extraction)

---

## Testing Checklist

After each split, verify:

- [ ] All functionality works as before
- [ ] No console errors
- [ ] All tabs load correctly
- [ ] Translations display correctly
- [ ] Settings persist correctly
- [ ] Changelog displays correctly
- [ ] Build process still works (`npm run build`)
- [ ] Documentation updated (FILE-MAP.md, ARCHITECTURE.md, LOAD-ORDER.md)

---

## Rollback Plan

If issues arise after splitting:

1. **Revert git commit** for the problematic split
2. **Restore original file** from git history
3. **Document issue** in KNOWN-ISSUES.md
4. **Re-evaluate approach** before retrying

---

## Related Documentation Updates

After implementing splits, update:

1. **FILE-MAP.md** — Add new file paths
2. **ARCHITECTURE.md** — Update load order and structure
3. **LOAD-ORDER.md** — Update script load sequence
4. **KNOWN-ISSUES.md** — Remove resolved issues

---

## Notes

- **No build system required** for JS splits (ES6 modules work natively in modern browsers)
- **index.html split** may require build system or fetch-based loading
- **Keep backward compatibility** where possible (same export structures)
- **Test thoroughly** after each split
- **Update documentation** immediately after changes
