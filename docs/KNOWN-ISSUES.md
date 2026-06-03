# SW Forge — Known Issues

> Known bugs and problems in the codebase.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Backlog:** [`PLANS.md`](PLANS.md)

---

## [RESOLVED] FR language breaks on page reload

**Status:** Resolved (fixed 2026-06-01)  
**Files:** `js/features/shell/bootstrap.js`, `js/features/shell/language-bindings.js`

### Root cause
`translations-fr.js` is lazy-loaded only when `updateLanguage('fr')` runs. Additionally, `translations.js` contained `fr: {}` — an empty but **truthy** object. That made `loadFrTranslations()` skip loading (it checked `if (TRANSLATIONS.fr)`), and `TRANSLATIONS['fr'] || TRANSLATIONS.en` never fell back to English because `{}` is truthy. Result: empty labels on Guide subtabs, demo banner, and upload prompt.

### Fix
- Remove `fr: {}` from `tools/build-translations.mjs` output.
- Add `frTranslationsReady()` / `getTranslationsForLang()` in `language-bindings.js` and use them in `updateLanguage`, demo banner, and drop veil.

### Verification
- FR: select language → reload → UI fully in French ✓
- EN/RU: reload → language preserved, UI works ✓
- First run (no localStorage): EN ✓

---

## [OPEN] Residual hex colors in `css/features/`

**Status:** Partially closed  
**Files:** `css/features/**/*.css`

### Issue
Some feature CSS files still contain hardcoded hex colors instead of CSS variables from `base.css`.

### Impact
Makes theme switching and color consistency harder to maintain.

### Progress
Most files migrated to `var(--…)` tokens. Search with:
```bash
rg "#[0-9a-fA-F]{6}" css/features/ -g "*.css"
```

---

## [RESOLVED] `index.html` monolithic (~250 KB)

**Status:** Resolved (fixed 2026-06-03)  
**Files:** `index.html`, `index-shell.html`, `partials/`

### Issue
Single HTML file contained entire UI inline, making it hard to edit and navigate.

### Resolution
Implemented build-time HTML assembly from partials:
- Created `index-shell.html` template with `<!-- @include partials/... -->` markers
- Split UI sections into partial files in `partials/` and `partials/tabs/`
- Created `tools/build-html.mjs` to assemble `index.html` from shell + partials
- Updated `package.json` to include `build:html` in build process

### Impact
Developer experience improved: UI sections now editable in separate partial files. No runtime impact.

### Notes
Player Guide text lives in `#tab-guide` within HTML by design (not moved to `docs/`).

---

## [OPEN] No JS/CSS minification

**Status:** Open  
**Files:** `js/ui.js`, `css/dist/app.css`

### Issue
Build process does not minify JS or CSS, increasing bundle size.

### Impact
Larger download size for users; no functional impact.

### Notes
Intentional trade-off for easier debugging. Could add minification step in `tools/build-*.mjs` if needed.

---

## [OPEN] No `npm run watch:css`

**Status:** Open  
**Files:** `tools/`

### Issue
No watch mode for CSS changes; must manually run `npm run build:css`.

### Impact
Developer experience; no runtime impact.

### Notes
Could add `watch-css.mjs` similar to existing `watch-ui.mjs`.

---

## [CLOSED] Google Fonts → local

**Status:** Closed  
**Files:** `assets/fonts/`, `css/foundation/base.css`

### Resolution
Migrated to system UI font stack (`system-ui` / Segoe UI / Roboto). Font files in `assets/fonts/` are legacy and not connected.
