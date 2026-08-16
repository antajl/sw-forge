# SW Forge Workflows

Step-by-step instructions for common tasks in SW Forge development.

## Workflow: Debug a Bug Report

**Goal:** Systematically investigate and fix reported issues.

**Files involved:** Varies by issue

**Steps:**
1. **Reproduce the issue:**
   - Read the issue description carefully
   - Try to reproduce locally with demo.json or real SWEX data
   - Note exact steps to reproduce
2. **Isolate the problem:**
   - Use code search to find relevant code
   - Read related files to understand patterns
   - Check console for errors
3. **Identify root cause:**
   - Trace code execution path
   - Check data flow
   - Verify assumptions
4. **Create minimal fix:**
   - Implement smallest possible change
   - Follow existing code conventions
   - Don't refactor unrelated code
5. **Test the fix:**
   - Run `npm test` (if applicable)
   - Run `npm run build`
   - Test locally with dev server
   - Verify the bug is fixed
6. **Document if needed:**
   - Update relevant documentation
   - Add comments if logic is complex
7. **Commit with reference:**
   - Include issue number in commit message
   - Explain "why" not "what"

**Common mistakes:**
- Fixing symptoms instead of root cause
- Making unrelated changes while debugging
- Not testing after fix
- Committing without referencing the issue

**Reference:** See `06-DEBUGGING.md` for detailed debugging guide.

## Workflow: Add New Translation

**Goal:** Add new UI strings for all supported languages.

**Files to edit:**
1. `js/core/translations-en.js` - English translation
2. `js/core/translations-ru.js` - Russian translation
3. `js/core/translations-fr.js` - French translation (optional)
4. `js/core/translations-zh.js` - Chinese translation (optional)

**Steps:**
1. Add translation key to all language files:
   ```javascript
   // Example in translations-en.js
   'newFeature': 'New Feature',
   
   // Example in translations-ru.js
   'newFeature': 'Новая функция',
   ```
2. Run translation build:
   ```bash
   npm run build:translations
   ```
3. Test language switching:
   - Start dev server: `npm run dev`
   - Switch between languages
   - Verify translation appears correctly
4. Update documentation if needed:
   - Update guide text if feature is user-facing
   - Update workflows if translation workflow changes

**Common mistakes:**
- Adding key to only one language file
- Forgetting to run build:translations
- Using inconsistent key names across languages
- Leaving empty translation strings

## Workflow: Perform Browser Testing

**Goal:** Test UI changes in a real browser environment.

**Prerequisites:**
- Dev server running: `npm run dev`
- Chrome DevTools MCP configured

**Steps:**
1. Start dev server:
   ```bash
   npm run dev
   ```
2. Create browser preview:
   - Use browser preview tool with URL (e.g., http://127.0.0.1:5500)
3. Test the specific feature:
   - Navigate to relevant page
   - Perform the user action
   - Verify visual behavior
4. Check console:
   - Open DevTools console
   - Look for errors or warnings
   - Fix any issues found
5. Check performance:
   - Check Network tab for slow requests
   - Check Performance tab for render issues
   - Verify smooth scrolling if applicable
6. Test responsive design:
   - Resize browser window
   - Test on mobile viewport sizes
   - Verify layout adapts correctly

**Common mistakes:**
- Testing only on one viewport size
- Not checking console for errors
- Assuming dev server behavior matches production
- Not testing keyboard navigation

**Reference:** Use `browser-testing-with-devtools` skill for comprehensive testing.

## Workflow: Run Full Verification

**Goal:** Complete project health check before major release.

**Steps:**
1. **Run tests:**
   ```bash
   npm test
   ```
   Verify all tests pass
2. **Run build:**
   ```bash
   npm run build
   ```
   Verify build completes without errors
3. **Run lint:**
   ```bash
   npm run lint
   ```
   Review warnings (fix critical ones)
4. **Check dependencies:**
   ```bash
   npm audit
   ```
   Review vulnerabilities (do NOT auto-fix without approval)
5. **Browser testing:**
   - Test key user flows in real browser
   - Check console for errors
   - Verify performance
6. **Documentation check:**
   - Verify docs/ is up to date
   - Check workflows are current
   - Verify AGENTS.md reflects current state
7. **Git status:**
   - Review staged changes
   - Verify commit messages are clear
   - Ensure no sensitive data committed

**Common mistakes:**
- Skipping browser testing
- Ignoring lint warnings
- Running npm audit fix without review
- Not updating documentation after changes

## Workflow: Add a New Rune Verdict

**Goal:** Add a new verdict type or modify existing rune verdict logic.

**Files to edit:**
1. `js/core/defaults.js` - Add/modify DEFAULT_THRESHOLDS, DEFAULT_FORMULAS, or DEFAULT_ROLES
2. `js/engine/engine-legacy-roles.js` - Modify role checking logic (if needed)
3. `js/engine/engine-gem-reapp-verdict.js` - Modify grind/gem/reapp verdicts (if needed)
4. `js/core/translations-en.js` - Add UI strings for new verdict
5. `js/core/translations-ru.js` - Add Russian translations
6. `js/features/runes/verdict-filters.js` - Add filter for new verdict (if needed)

**Steps:**
1. Define the verdict logic in `js/core/defaults.js`:
   - Add to DEFAULT_FORMULAS with accepted main stats, substat inclusions/exclusions
   - Add to DEFAULT_THRESHOLDS if new stat thresholds needed
   - Add to DEFAULT_ROLES if it's a role-based verdict
2. If custom logic needed, modify `js/engine/engine-legacy-roles.js`:
   - Add role checking function
   - Integrate with existing checkRole() function
3. Add UI strings:
   - Add key to `js/core/translations-en.js`
   - Add translation to `js/core/translations-ru.js`
4. If verdict needs filter, edit `js/features/runes/verdict-filters.js`
5. Run build commands:
   ```bash
   npm run build:ui
   npm run build:translations
   ```
6. Test with demo.json at http://127.0.0.1:5500/
7. Verify verdict appears in filters and table

**Common mistakes:**
- Forgetting to add translations
- Not updating verdict-filters.js (verdict won't appear in filter dropdown)
- Changing script load order (don't touch index-shell.html)

## Workflow: Add a New Monster Filter

**Goal:** Add a new filter option in the Monsters tab.

**Files to edit:**
1. `js/features/monsters/monsters-filters.js` - Add filter logic
2. `js/core/translations-en.js` - Add UI strings
3. `js/core/translations-ru.js` - Add Russian translations
4. `partials/tabs/monsters.html` - Add filter UI (if new UI element needed)
5. `css/features/monsters/toolbar.css` or `toolbar-v2.css` - Add styles (if needed)

**Steps:**
1. Add filter logic in `js/features/monsters/monsters-filters.js`:
   - Add filter function that takes monster data and returns boolean
   - Register filter in filter list
2. Add UI strings:
   - Add filter label to translations-en.js
   - Add translation to translations-ru.js
3. If new UI element needed:
   - Add HTML to `partials/tabs/monsters.html`
   - Add CSS to appropriate CSS file
4. Run build commands:
   ```bash
   npm run build:ui
   npm run build:translations
   npm run build:html  # if HTML partial changed
   npm run build:css   # if CSS changed
   ```
5. Test with demo.json
6. Verify filter works and appears in UI

**Common mistakes:**
- Not registering filter in filter list
- Forgetting to add CSS for new UI elements
- Not testing with monsters that should/shouldn't match filter

## Workflow: Change UI String (EN/RU/FR)

**Goal:** Add or modify a UI string in the interface.

**Files to edit:**
1. `js/core/translations-en.js` - English source
2. `js/core/translations-ru.js` - Russian translation
3. `js/core/translations-fr.js` - French translation (if needed)

**Steps:**
1. Add key to `js/core/translations-en.js`:
   ```javascript
   'yourKey': 'Your English text',
   ```
2. Add translation to `js/core/translations-ru.js`:
   ```javascript
   'yourKey': 'Ваш русский текст',
   ```
3. If French needed, add to `js/core/translations-fr.js`:
   ```javascript
   'yourKey': 'Votre texte français',
   ```
4. Run build command:
   ```bash
   npm run build:translations
   ```
5. Use in JavaScript:
   ```javascript
   TRANSLATIONS.yourKey
   ```
   Or in HTML:
   ```html
   <span data-i18n="yourKey"></span>
   ```
6. Test in all languages (EN, RU, FR)

**Common mistakes:**
- Forgetting to add to all language files
- Not running build:translations
- Using wrong key in JS or HTML
- Not testing in all languages

## Workflow: Add New CSS Class

**Goal:** Add a new CSS class or modify existing styles.

**Files to edit:**
1. CSS file in `css/features/` or `css/foundation/`
2. `tools/build-css.mjs` - If adding new CSS file to build

**Steps:**
1. Identify appropriate CSS file:
   - Foundation styles → `css/foundation/`
   - Rune styles → `css/features/runes/`
   - Gear styles → `css/features/gear/`
   - Monster styles → `css/features/monsters/`
   - Team styles → `css/features/teams/`
2. Add CSS class using CSS variables:
   ```css
   .your-class {
     background: var(--bg);
     color: var(--text);
     border: 1px solid var(--border);
   }
   ```
3. If creating new CSS file:
   - Add file path to `tools/build-css.mjs` FILES array
   - Place in correct position (maintain dependency order)
4. Run build command:
   ```bash
   npm run build:css
   ```
5. Test visual changes at http://127.0.0.1:5500/
6. Test in both dark and light themes

**Common mistakes:**
- Using hardcoded hex colors instead of CSS variables
- Not adding new CSS file to build-css.mjs
- Not testing in light theme
- Using wrong CSS variable names

## Workflow: Modify Build Process

**Goal:** Change how the build system works (add new build step, modify existing).

**Files to edit:**
1. `tools/build-html.mjs` - HTML build
2. `tools/build-css.mjs` - CSS build
3. `tools/build-ui.mjs` - UI build
4. `package.json` - npm scripts

**Steps:**
1. Identify which build tool to modify:
   - HTML assembly → `tools/build-html.mjs`
   - CSS concatenation → `tools/build-css.mjs`
   - UI concatenation → `tools/build-ui.mjs`
2. Make changes to build tool
3. If adding new build step:
   - Create new tool file in `tools/`
   - Add npm script to `package.json`
   - Add to `npm run build` if needed
4. Test build commands:
   ```bash
   npm run build:html  # if HTML build changed
   npm run build:css   # if CSS build changed
   npm run build:ui    # if UI build changed
   npm run build       # full build
   ```
5. Verify output files are correct
6. Test locally with built files

**Common mistakes:**
- Breaking build script (syntax errors)
- Not updating package.json scripts
- Not testing full build after changes
- Breaking file paths in build scripts

## Workflow: Add New Tab

**Goal:** Add a new main tab to the application.

**Files to edit::**
1. `partials/tabs/[new-tab].html` - Create new tab partial
2. `partials/header.html` - Add tab button
3. `js/features/shell/main-tabs.js` - Add tab logic
4. `js/core/translations-en.js` - Add tab label
5. `js/core/translations-ru.js` - Add Russian translation
6. `js/features/[area]/` - Create feature files for tab content
7. `css/features/[area]/` - Create CSS for tab

**Steps:**
1. Create tab partial:
   - Create `partials/tabs/[new-tab].html`
   - Add tab content (no outer section tag)
2. Add tab button to header:
   - Edit `partials/header.html`
   - Add button with `data-tab="[new-tab]"`
3. Add tab logic:
   - Edit `js/features/shell/main-tabs.js`
   - Add tab to tab list
4. Add translations:
   - Add tab label to `js/core/translations-en.js`
   - Add translation to `js/core/translations-ru.js`
5. Create feature files:
   - Create `js/features/[area]/` directory
   - Create feature JS files
   - Add to `tools/build-ui.mjs` CHUNKS array
6. Create CSS:
   - Create `css/features/[area]/` directory
   - Create CSS files
   - Add to `tools/build-css.mjs` FILES array
7. Run build commands:
   ```bash
   npm run build:ui
   npm run build:css
   npm run build:html
   npm run build:translations
   ```
8. Test tab appears and functions correctly

**Common mistakes:**
- Adding outer section tag in partial (should be content only)
- Forgetting to add to build-ui.mjs or build-css.mjs
- Not adding tab to main-tabs.js
- Forgetting translations

## Workflow: Fix Bug

**Goal:** Debug and fix a reported bug.

**Steps:**
1. Reproduce the bug:
   - Use demo.json for consistent testing
   - Note exact steps to reproduce
2. Identify affected file:
   - Use grep/search to find relevant code
   - Check browser console for errors
3. Understand context:
   - Check script load order (dependencies)
   - Check related files (data, engine, UI)
4. Make minimal fix:
   - Prefer upstream fixes over downstream workarounds
   - Keep changes focused and minimal
5. Run appropriate build command based on file type
6. Test fix:
   - Verify bug is resolved
   - Check for regressions
7. If bug was in BACKLOG.md:
   - Remove it from BACKLOG.md
   - Add to changelog if player-facing

**Common mistakes:**
- Over-engineering the fix
- Not testing for regressions
- Fixing symptom instead of root cause
- Not running build command after fix

## Workflow: Update Changelog

**Goal:** Add player-facing change to changelog.

**Files to edit:**
1. `js/core/changelog-data.js` - STATIC_CHANGELOG

**Steps:**
1. Add entry to `STATIC_CHANGELOG` in `js/core/changelog-data.js`:
   ```javascript
   {
     date: 'YYYY-MM-DD',
     changes: [
       'Your change description here'
     ]
   }
   ```
2. Use today's date only (YYYY-MM-DD format)
3. Keep descriptions concise and player-facing
4. If change was in BACKLOG.md, remove it from BACKLOG.md
5. Run build command:
   ```bash
   npm run build:ui
   ```
6. Test changelog appears in Updates tab

**Common mistakes:**
- Using wrong date format
- Adding technical details (keep player-facing)
- Not removing from BACKLOG.md
- Forgetting to run build:ui

## Workflow: Add Artifact Effect

**Goal:** Add new artifact effect or modify existing.

**Files to edit:**
1. `js/data/artifacts/effects.js` - Add effect definition
2. `js/core/translations-en.js` - Add effect name/description
3. `js/core/translations-ru.js` - Add Russian translation
4. `js/features/gear/artifact-verdict.js` - Add verdict logic (if needed)

**Steps:**
1. Add effect to `js/data/artifacts/effects.js`:
   - Define effect structure
   - Add to effects list
2. Add translations:
   - Add effect name to translations-en.js
   - Add translation to translations-ru.js
3. If verdict logic needed:
   - Edit `js/features/gear/artifact-verdict.js`
4. Run build commands:
   ```bash
   npm run build:ui
   npm run build:translations
   ```
5. Test with artifact data

**Common mistakes:**
- Not following effect structure
- Forgetting translations
- Not testing with actual artifact data

## Workflow: Update Documentation

**Goal:** Add or update project documentation.

**Files to edit:**
- Varies by documentation type (see below)

**Documentation Types:**

### Feature Documentation
- **When:** Adding new features or modifying existing ones
- **Files:** `docs/05-WORKFLOWS.md` (add workflow), relevant docs
- **Steps:**
  1. Add workflow to `docs/05-WORKFLOWS.md` if new feature type
  2. Update `docs/00-MASTER.md` if feature changes project structure
  3. Update `docs/03-PROJECT-STRUCTURE.md` if adding new files/directories
  4. Test documentation accuracy by following it yourself

### API Documentation
- **When:** Adding new window.SWRM functions or changing existing
- **Files:** `docs/04-API-REFERENCE.md`
- **Steps:**
  1. Document function signature and parameters
  2. Document return values and error conditions
  3. Add usage examples
  4. Document dependencies on other SWRM functions

### Testing Documentation
- **When:** Adding new tests or changing test infrastructure
- **Files:** `docs/07-TESTING.md`
- **Steps:**
  1. Document test purpose and coverage
  2. Add test setup instructions if needed
  3. Document how to run new tests
  4. Update test coverage statistics

### Changelog Documentation
- **When:** Player-facing changes
- **Files:** `js/core/changelog-data.js`
- **Steps:**
  1. Add entry to STATIC_CHANGELOG with today's date
  2. Keep descriptions player-facing (not technical)
  3. Remove from BACKLOG.md if applicable
  4. Run `npm run build:ui`

**Common mistakes:**
- Writing technical details in player-facing changelog
- Not updating all relevant documentation files
- Adding workflows that don't match actual implementation
- Forgetting to test documentation by following it
