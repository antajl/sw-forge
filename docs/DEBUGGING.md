# SW Forge Debugging Guide

This guide helps debug common issues in SW Forge development.

## Enable Debug Mode

Debug flags are defined in `js/core/meta.js`:

```javascript
const DEBUG = {
  ENABLED: false,  // Set to true to enable debug mode
  LOG_ENGINE: false,
  LOG_PARSER: false,
  LOG_UI: false,
};
```

**To enable debug mode:**
1. Edit `js/core/meta.js`
2. Set `DEBUG.ENABLED = true`
3. Set specific flags as needed (LOG_ENGINE, LOG_PARSER, LOG_UI)
4. Run `npm run build:ui`
5. Refresh browser

**Debug output locations:**
- Console logs in browser DevTools (F12)
- Some debug info may appear in UI elements when debug mode is enabled

## Where to Look for Logs

### Browser Console
- Press F12 to open DevTools
- Go to Console tab
- Look for:
  - Red errors (JavaScript errors)
  - Yellow warnings (deprecations, issues)
  - Blue info logs (debug output)

### Network Tab
- Check for failed resource loads (404 errors)
- Verify API calls to share backend
- Check for CORS issues

### Application Tab
- Local Storage: Check settings, currentLang, demo dataset flag
- Session Storage: Check temporary UI state

## Common Error Patterns

### "window.SWRM is undefined"
**Cause:** Script loaded before bootstrap.js
**Fix:** Check script load order in index-shell.html, ensure script is after bootstrap.js

### "TRANSLATIONS is undefined"
**Cause:** Script loaded before i18n.js
**Fix:** Check script load order in index-shell.html, ensure script is after i18n.js

### "Cannot read property X of undefined"
**Cause:** Accessing property on undefined object
**Fix:** Add null checks, verify object exists before accessing properties

### "Unexpected token"
**Cause:** Syntax error in JavaScript
**Fix:** Check for missing brackets, commas, or semicolons in the file mentioned in error

### "Failed to fetch"
**Cause:** Network error or CORS issue
**Fix:** Check API URL, verify backend is running, check CORS settings

### Build errors
**Cause:** Missing files, syntax errors in build scripts
**Fix:** Check error message, verify file paths, check build script syntax

## Debugging Rune Verdicts

**Problem:** Rune verdict is incorrect or unexpected

**Steps:**
1. Enable debug mode: `DEBUG.LOG_ENGINE = true`
2. Load demo.json (consistent test data)
3. Open browser console
4. Look for engine logs showing:
   - Rune stats
   - Threshold checks
   - Role checks
   - Verdict calculation
5. Check `js/core/defaults.js`:
   - Verify DEFAULT_THRESHOLDS are correct
   - Verify DEFAULT_FORMULAS match intended logic
   - Verify DEFAULT_ROLES are correct
6. Check `js/engine/engine-legacy-roles.js`:
   - Verify role checking logic
   - Check stat calculations
7. Check `js/engine/engine-gem-reapp-verdict.js`:
   - Verify grind/gem/reapp logic
8. Test with known good rune to verify baseline

**Common issues:**
- Wrong thresholds for stage/grade
- Formula includes/excludes wrong substats
- Role checking logic incorrect
- Stat calculation error (flat vs percent)

## Debugging UI Problems

**Problem:** UI element not appearing or not working

**Steps:**
1. Enable debug mode: `DEBUG.LOG_UI = true`
2. Check browser console for errors
3. Verify HTML structure:
   - Check if element exists in DOM (use DevTools Elements tab)
   - Check if element is hidden (display: none, visibility: hidden)
   - Check if element is off-screen (position, transform)
4. Check CSS:
   - Verify CSS variables are defined
   - Check for conflicting styles
   - Test in both dark and light themes
5. Check JavaScript:
   - Verify event listeners are attached
   - Check if element selector is correct
   - Verify data attributes (data-i18n, data-tab, etc.)
6. Check translations:
   - Verify key exists in TRANSLATIONS
   - Check if translation is empty string
   - Test in all languages (EN， RU, FR)

**Common issues:**
- Missing CSS class or ID
- Wrong CSS variable name
- Translation key not found
- Event listener not attached
- Element selector incorrect
- CSS specificity conflict

## Debugging Parser Issues

**Problem:** SWEX parsing fails or produces incorrect data

**Steps:**
1. Enable debug mode: `DEBUG.LOG_PARSER = true`
2. Load problematic SWEX export
3. Check browser console for parser logs
4. Verify SWEX structure:
   - Check if JSON is valid
   - Verify rune/unit structure matches expected format
5. Check `js/data/parser.js`:
   - Verify stat ID mappings (STAT_NAMES)
   - Check grade/normalization logic
   - Verify efficiency calculation
6. Test with known good SWEX export (demo.json)

**Common issues:**
- Invalid JSON structure
- Unknown stat ID
- Grade normalization error
- Efficiency calculation error
- Missing required fields

## Debugging Build Issues

**Problem:** Build command fails or produces incorrect output

**Steps:**
1. Check error message in terminal
2. Verify file paths in build script:
   - `tools/build-html.mjs`
   - `tools/build-css.mjs`
   - `tools/build-ui.mjs`
3. Check if source files exist
4. Verify syntax in build scripts
5. Check for circular dependencies in build-ui.mjs CHUNKS array
6. Verify npm scripts in package.json

**Common issues:**
- Missing source file
- Incorrect file path
- Syntax error in build script
- Circular dependency in CHUNKS array
- npm script not defined

## Browser DevTools Tips

### Console
- `console.log()` for general debugging
- `console.error()` for errors
- `console.warn()` for warnings
- `console.table()` for array/object data
- `console.group()` for grouping related logs

### Elements
- Inspect element to see HTML structure
- Check computed styles for CSS values
- Check event listeners attached to element
- Use "Break on" options to pause on DOM changes

### Network
- Filter by type (XHR, JS, CSS)
- Check response status codes
- Preview response data
- Check request/response headers

### Sources
- Set breakpoints in JavaScript
- Step through code execution
- Watch variables
- Call stack for error tracing

### Application
- Local Storage for persistent settings
- Session Storage for temporary state
- Cookies (if used)
- Service Workers (if used)

## Debugging Checklist

Before asking for help, go through this checklist:

1. **Build verification:**
   - [ ] Ran correct build command for changes
   - [ ] Build completed without errors
   - [ ] Refreshed browser after build

2. **Console check:**
   - [ ] No JavaScript errors in console
   - [ ] No warnings related to your changes
   - [ ] Debug logs show expected values

3. **File verification:**
   - [ ] Edited correct source file (not build artifact)
   - [ ] File saved before build
   - [ ] No syntax errors in edited file

4. **Dependency check:**
   - [ ] Script load order is correct
   - [ ] All dependencies loaded before use
   - [ ] No circular dependencies

5. **Translation check:**
   - [ ] Translation key exists in all language files
   - [ ] Translation not empty string
   - [ ] Tested in all languages

6. **CSS check:**
   - [ ] Using CSS variables (not hardcoded hex)
   - [ ] CSS file in build-css.mjs list
   - [ ] Tested in both dark and light themes

7. **Data check:**
   - [ ] Using demo.json for consistent testing
   - [ ] Data structure matches expected format
   - [ ] No undefined/null access

## Common Debugging Commands

```javascript
// Check if window.SWRM is available
console.log(window.SWRM);

// Check TRANSLATIONS
console.log(TRANSLATIONS);

// Check current settings
console.log(window.SWRM.settings);

// Check current language
console.log(localStorage.getItem('swrm-lang'));

// Check if demo dataset is loaded
console.log(localStorage.getItem('swrm-demo-dataset'));

// List all runes
console.log(window.SWRM.runes);

// List all units
console.log(window.SWRM.units);

// Run self-tests
window.SWRM.runSelfTests();

// Check specific rune
console.log(window.SWRM.runes[0]);

// Check specific unit
console.log(window.SWRM.units[0]);
```

## Getting Help

If you're still stuck after going through this guide:

1. Gather information:
   - Error messages (exact text)
   - Steps to reproduce
   - Browser and version
   - Console logs
   - Screenshot (if UI issue)

2. Check documentation:
   - docs/AI-ASSISTANT.md
   - docs/WORKFLOWS.md
   - docs/DEPENDENCY-MAP.md
   - docs/GAME-KNOWLEDGE.md
   - docs/API-REFERENCE.md

3. Check BACKLOG.md:
   - See if issue is already known
   - Check if there's a workaround

4. Report issue:
   - Add to BACKLOG.md with details
   - Include affected files
   - Include reproduction steps
