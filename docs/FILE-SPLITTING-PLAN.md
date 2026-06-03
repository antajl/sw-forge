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

### Status: ✅ COMPLETED (2026-06-02)

**Implementation:** Build-time assembly from partials (not runtime fetch)

### Current State
- **Size:** 4237 lines, ~371KB → Split into partials
- **Structure:** `index-shell.html` template + partials in `partials/`
- **Issue:** ✅ Resolved - easier to navigate and edit

### Implemented Structure

Build-time assembly from partials:

```
index-shell.html (template with markers, ~133 lines)
├── partials/header.html (header navigation)
├── partials/tabs/dashboard.html (dashboard tab)
├── partials/tabs/gear.html (gear/runes tab)
├── partials/tabs/monsters.html (monsters tab)
├── partials/tabs/guide.html (guide tab)
├── partials/tabs/changelog.html (changelog tab)
└── partials/tabs/app-settings.html (app settings tab)
```

### Implementation (Completed)

**Approach:** Build-time assembly (not runtime fetch)

#### Step 1: Created partials directory structure
```bash
mkdir -p partials/tabs
```

#### Step 2: Created index-shell.html template
- Copied original `index.html` to `index-shell.html`
- Replaced content sections with `<!-- @include partials/... -->` markers
- Preserved script load order in shell template

#### Step 3: Extracted each tab content to partials

**partials/header.html**
- Extracted: Header section (logo, navigation, theme toggle)
- Size: ~126 lines

**partials/tabs/dashboard.html**
- Extracted: Dashboard tab content
- Size: ~145 lines

**partials/tabs/gear.html**
- Extracted: Gear tab content (runes, artifacts, relics)
- Size: ~292 lines

**partials/tabs/monsters.html**
- Extracted: Monsters tab content
- Size: ~461 lines

**partials/tabs/guide.html**
- Extracted: Guide tab content
- Size: ~2118 lines

**partials/tabs/changelog.html**
- Extracted: Changelog tab content
- Size: ~27 lines

**partials/tabs/app-settings.html**
- Extracted: App settings tab content
- Size: ~93 lines

#### Step 4: Created build script
**tools/build-html.mjs:**
- Reads `index-shell.html`
- Replaces `<!-- @include partials/... -->` markers with partial content
- Writes assembled `index.html`

#### Step 5: Updated package.json
```json
{
  "scripts": {
    "build:html": "node tools/build-html.mjs",
    "build": "npm run build:html && npm run build:css && npm run build:ui"
  }
}
```

#### Step 6: Updated documentation
- Updated `MASTER.md` with build:html command and edit rules
- Updated `FILE-MAP.md` with partials and index-shell.html
- Updated `ARCHITECTURE.md` with HTML Build section
- Updated `LOAD-ORDER.md` with index.html as build artifact
- Updated `KNOWN-ISSUES.md` - marked monolithic index.html as resolved

### Benefits
- **Navigation:** Each tab in separate file, easier to find content
- **Collaboration:** Multiple developers can work on different tabs simultaneously
- **Git:** Smaller diffs per change, easier code review
- **Maintenance:** Clear separation of concerns

### Risks & Mitigations
- **Risk:** Build step required
  - **Mitigation:** ✅ Implemented - `npm run build:html` integrates into existing build process
- **Risk:** Offline support (file:// protocol)
  - **Mitigation:** ✅ Resolved - build-time assembly works with file:// protocol
- **Risk:** SEO impact
  - **Mitigation:** Not applicable (SPA, content pre-assembled at build time)

### Build System Approach (Used)
We used the build system approach instead of runtime fetch:

**tools/build-html.mjs:**
```javascript
import fs from 'fs';
import path from 'path';

const shellPath = path.join(rootDir, 'index-shell.html');
const outputPath = path.join(rootDir, 'index.html');

let content = fs.readFileSync(shellPath, 'utf-8');

// Replace <!-- @include partials/... --> markers with partial content
const includePattern = /<!-- @include (.+?) -->/g;
let match;
while ((match = includePattern.exec(content)) !== null) {
  const [fullMatch, partialPath] = match;
  const partialFilePath = path.join(rootDir, partialPath);
  const partialContent = fs.readFileSync(partialFilePath, 'utf-8');
  content = content.replace(fullMatch, partialContent);
}

fs.writeFileSync(outputPath, content, 'utf-8');
```

**package.json:**
```json
{
  "scripts": {
    "build:html": "node tools/build-html.mjs",
    "build": "npm run build:html && npm run build:css && npm run build:ui"
  }
}
```

---

## 2. js/core/translations — Split by Language

### Status: ✅ COMPLETED (2026-06-03)

**Implementation:** Source files per language + build artifact (FR lazy-loaded)

### Structure

```
js/core/translations-en.js   (EN source, edit here)
js/core/translations-ru.js   (RU source, edit here)
js/core/translations-fr.js   (FR source, lazy-loaded)
js/core/translations.js      (build artifact: EN+RU bundle)
tools/build-translations.mjs
```

### Build

```bash
npm run build:translations   # EN+RU → translations.js
npm run build                  # includes build:translations
```

Edit rules: EN/RU in source files → rebuild. FR in `translations-fr.js` directly. UI bindings in `language-bindings.js`.

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

### Phase 1: High Priority ✅
1. **index.html** — Split by tabs (largest impact)
   - Status: ✅ COMPLETED (2026-06-02)
   - Effort: ~2 hours
   - Risk: Medium → Resolved (build-time approach)

### Phase 2: Medium Priority
2. **translations split** — Split by language
   - Status: ✅ COMPLETED (2026-06-03)
   - Estimated effort: ~1 hour
   - Risk: Low

3. **js/core/defaults.js** — Split by category
   - Estimated effort: 2-3 hours
   - Risk: Low-Medium (requires careful categorization)
   - Priority: Medium - improves maintainability

### Phase 3: Low Priority (Future)
4. **js/core/changelog-data.js** — Split by type
   - Estimated effort: 1 hour
   - Risk: Low (simple extraction)
   - Priority: Low - minor benefit

---

## Testing Checklist

### index.html Split ✅ (2026-06-02)
- [x] All functionality works as before
- [x] No console errors
- [x] All tabs load correctly
- [x] Build process works (`npm run build`)
- [x] Documentation updated (MASTER.md, FILE-MAP.md, ARCHITECTURE.md, LOAD-ORDER.md, KNOWN-ISSUES.md)

### Future Splits
After each future split, verify:

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

- **Build system used** for index.html split (build-time assembly from partials)
- **No build system required** for JS splits (ES6 modules work natively in modern browsers)
- **Keep backward compatibility** where possible (same export structures)
- **Test thoroughly** after each split
- **Update documentation** immediately after changes

## Summary

**Completed (2026-06-03):**
- ✅ index.html split via build-time assembly from partials
- ✅ translations split: EN/RU sources + build artifact, FR lazy
- ✅ Renamed `i18n-bindings.js` → `language-bindings.js`
- ✅ Created `tools/build-translations.mjs`, integrated into `npm run build`

**Remaining (Future):**
- js/core/defaults.js split by category (Medium priority)
- js/core/changelog-data.js split by type (Low priority)
