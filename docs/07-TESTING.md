# SW Forge Testing Guide

This guide covers testing practices for SW Forge development.

## Local Testing

### Setup Local Server

**Option 1: VS Code Live Server**
1. Install "Live Server" extension in VS Code
2. Right-click on index.html
3. Select "Open with Live Server"
4. Opens at http://127.0.0.1:5500/

**Option 2: Python Simple Server**
```bash
cd d:\Site\SW-Forge
python -m http.server 5500
```
Opens at http://127.0.0.1:5500/

**Option 3: Node.js http-server**
```bash
npm install -g http-server
cd d:\Site\SW-Forge
http-server -p 5500
```
Opens at http://127.0.0.1:5500/

### Test Data

**demo.json**
- Location: `data/demo.json`
- Size: ~5.5 MB
- Contains: Sample SWEX export with runes and units
- Use for: Consistent testing across sessions

**How to use demo.json:**
1. Open SW Forge locally
2. Click "Upload SWEX" button
3. Select demo.json from data/ directory
4. Verify data loads correctly
5. Test features with known data

**Real SWEX exports:**
- Export from Summoners War Exporter (SWEX)
- Test with your own account data
- Good for edge cases and real-world scenarios

## Testing Checklist Before Deploy

### Build Verification
- [ ] Ran `npm run build` (all 4 steps)
- [ ] Build completed without errors
- [ ] index.html generated correctly
- [ ] js/ui.js generated correctly
- [ ] css/dist/app.css generated correctly
- [ ] js/core/translations.js generated correctly

### Functionality Testing
- [ ] Demo dataset loads correctly
- [ ] Real SWEX export loads correctly
- [ ] Dashboard displays correctly
- [ ] Rune table renders all runes
- [ ] Rune verdicts appear correct
- [ ] Filters work (all types)
- [ ] Sorting works (all columns)
- [ ] Gear tab displays artifacts/relics
- [ ] Monsters tab displays monsters
- [ ] Monster detail view works
- [ ] Skill planner works
- [ ] Settings save/load correctly
- [ ] Share functionality works (if applicable)
- [ ] Guide displays correctly
- [ ] Changelog displays correctly

### UI Testing
- [ ] No console errors
- [ ] No console warnings
- [ ] All tabs switch correctly
- [ ] Responsive design works (mobile/desktop)
- [ ] Dark theme works correctly
- [ ] Light theme works correctly
- [ ] All buttons are clickable
- [ ] All inputs accept input
- [ ] All dropdowns open/close
- [ ] Tooltips appear correctly
- [ ] Modals open/close correctly
- [ ] Toasts appear/disappear correctly

### Localization Testing
- [ ] English (EN) displays correctly
- [ ] Russian (RU) displays correctly
- [ ] French (FR) loads and displays correctly
- [ ] Language switch works
- [ ] Language persists on reload
- [ ] All translations present
- [ ] No missing translation keys
- [ ] No empty translations

### Cross-Browser Testing
Test in at least:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

### Performance Testing
- [ ] Initial load < 3 seconds
- [ ] Demo dataset loads < 5 seconds
- [ ] Rune table scrolls smoothly
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] No layout shifts (check DevTools Performance tab)

## Regression Testing

### What to Test After Changes

**After core changes (meta.js, defaults.js, bootstrap.js):**
- [ ] All features still work
- [ ] Settings load/save
- [ ] Translations load
- [ ] window.SWRM available
- [ ] All stat calculations correct

**After data changes (parser.js, DBs):**
- [ ] SWEX parsing works
- [ ] Rune stats correct
- [ ] Unit stats correct
- [ ] Efficiency calculation correct
- [ ] Ingame score correct

**After engine changes (engine modules):**
- [ ] Rune verdicts correct
- [ ] Role checks work
- [ ] Grind verdicts correct
- [ ] Gem verdicts correct
- [ ] Reapp verdicts correct
- [ ] High roll detection works

**After UI changes (features):**
- [ ] UI element appears
- [ ] UI element functions
- [ ] Event handlers work
- [ ] No console errors
- [ ] Responsive design works

**After CSS changes:**
- [ ] Styles apply correctly
- [ ] Dark theme works
- [ ] Light theme works
- [ ] No layout shifts
- [ ] Responsive design works

**After translation changes:**
- [ ] All languages display
- [ ] No missing keys
- [ ] No empty strings
- [ ] Language switch works

## Specific Feature Testing

### Rune Verdict Testing
1. Load demo.json
2. Check each verdict type appears:
   - Keep
   - Sell
   - Grind
   - Finish
   - Reapp
   - Upgrade
   - Gem
3. Verify verdict filters work
4. Check verdict counts match expected
5. Test with known good/bad runes

### Rune Table Testing
1. Load demo.json
2. Verify all runes display
3. Test each column sort
4. Test each filter
5. Test virtual scrolling (if applicable)
6. Test row actions (delete, etc.)
7. Test export functionality

### Monster Testing
1. Load demo.json
2. Verify all monsters display
3. Test monster filters
4. Test monster detail view
5. Test skill planner
6. Test monster gear view
7. Test monster runes view

### Gear Testing
1. Load demo.json with artifacts/relics
2. Verify artifacts display
3. Verify relics display
4. Test gear filters
5. Test gear verdicts
6. Test gear table actions

### Settings Testing
1. Change each setting
2. Verify setting saves
3. Reload page
4. Verify setting persists
5. Reset settings
6. Verify reset works

## Common Testing Issues

### Issue: Changes not visible
**Cause:** Didn't run build command
**Fix:** Run appropriate build command (build:ui, build:css, build:html, build:translations)

### Issue: Old data persists
**Cause:** Browser cache or Local Storage
**Fix:** Clear browser cache, clear Local Storage, or use incognito mode

### Issue: Console errors
**Cause:** JavaScript error
**Fix:** Check console for error details, fix in source file, rebuild

### Issue: Styles not applying
**Cause:** CSS not built or wrong CSS variable
**Fix:** Run build:css, verify CSS variable names

### Issue: Translations missing
**Cause:** Translation key not added or build:translations not run
**Fix:** Add translation key to all language files, run build:translations

## Automated Testing

Currently, SW Forge has no automated test suite. Self-tests are available via:

```javascript
window.SWRM.runSelfTests();
```

This runs basic sanity checks on core functionality.

## Testing with Different Datasets

### Small Dataset
- Fast to load
- Good for quick checks
- May miss edge cases

### Medium Dataset (demo.json)
- Balanced size
- Good for general testing
- Covers most scenarios

### Large Dataset (real account)
- Slow to load
- Good for performance testing
- Catches edge cases
- Reveals scalability issues

## Accessibility Testing

### Basic Checks
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces elements (ARIA labels)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Tools
- Chrome Lighthouse (Accessibility audit)
- axe DevTools
- WAVE browser extension

## Mobile Testing

### Viewport Sizes
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 Pro (390x844)
- [ ] iPad (768x1024)
- [ ] Desktop (1920x1080)

### Mobile-Specific Checks
- [ ] Touch targets large enough (44x44 minimum)
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Buttons accessible with touch
- [ ] Mobile menu works

## Performance Testing

### Tools
- Chrome Lighthouse
- Chrome DevTools Performance tab
- Chrome DevTools Network tab

### Metrics to Check
- First Contentful Paint (FCP) < 1.8s
- Largest Contentful Paint (LCP) < 2.5s
- Time to Interactive (TTI) < 3.8s
- Cumulative Layout Shift (CLS) < 0.1

### How to Test
1. Open Chrome DevTools
2. Go to Lighthouse tab
3. Run Performance audit
4. Review metrics and recommendations

## Reporting Test Results

When reporting test results, include:

1. **Environment:**
   - Browser and version
   - OS and version
   - Screen resolution

2. **Test data:**
   - Dataset used (demo.json or real SWEX)
   - Dataset size

3. **Steps to reproduce:**
   - Exact steps taken
   - Expected result
   - Actual result

4. **Evidence:**
   - Screenshot (if UI issue)
   - Console logs
   - Error messages

5. **Severity:**
   - Critical (blocks core functionality)
   - High (major feature broken)
   - Medium (minor feature broken)
   - Low (cosmetic or edge case)
