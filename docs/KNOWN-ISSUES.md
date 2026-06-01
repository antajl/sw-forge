# SW Forge — Known Issues

> Known bugs and problems in the codebase.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **Backlog:** [`PLANS.md`](PLANS.md)

---

## [RESOLVED] FR language breaks on page reload

**Status:** Resolved (fixed 2026-06-01)  
**Files:** `js/features/shell/bootstrap.js`, `js/features/shell/i18n-bindings.js`

### Root cause
`i18n-fr.js` is lazy-loaded only when `updateLanguage('fr')` is called explicitly. On page reload, `currentLang = 'fr'` is read from localStorage, but `updateLanguage()` was never called during initialization, leaving `TRANSLATIONS.fr` undefined. The UI then broke when trying to access undefined translation keys.

### Fix
Проблема была вызвана синтаксическими ошибками в `js/core/i18n-fr.js`:

1. **Исправлены синтаксические ошибки в `js/core/i18n-fr.js`:**
   - Удалён лишний обратный слеш `\` в конце строки 589
   - Удалены экранированные кавычки `\'` на строке 592
   - Удалён обратный слеш `\` в конце строки 655
   - Исправлены экранированные кавычки `\'` на строке 658

2. **Добавлен fallback в `js/features/rules/panel.js`:**
   - `refreshRoleFilterOptions` теперь использует `TRANSLATIONS[currentLang] || TRANSLATIONS.en`
   - Предотвращает `TypeError` при доступе к отсутствующим ключам в FR

Эти изменения гарантируют, что `i18n-fr.js` загружается без ошибок и UI не падает при перезагрузке с FR языком.

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

## [OPEN] `index.html` monolithic (~250 KB)

**Status:** Open  
**Files:** `index.html`

### Issue
Single HTML file contains entire UI inline, making it hard to edit and navigate.

### Impact
Developer experience; no runtime impact.

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
