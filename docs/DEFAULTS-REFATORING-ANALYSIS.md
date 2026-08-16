# defaults.js Refactoring Analysis

**Date:** August 16, 2026
**Status:** Refactoring deferred - too risky for current architecture

## Why defaults.js Cannot Be Easily Split

### Current Architecture Constraints

1. **Vanilla JS with IIFE Pattern**
   - Project uses vanilla JavaScript with IIFE closures
   - No ES modules (import/export)
   - Global namespace via `window.SWRM`
   - All dependencies managed through HTML script load order

2. **Complex Interdependencies**
   - `defaults.js` contains tightly coupled logic:
     - Thresholds depend on stat constants
     - Stat constants depend on thresholds for migration
     - Formulas depend on thresholds and constants
     - Settings merge functions depend on all of the above
   - Circular dependencies between modules

3. **Load Order Criticality**
   - Current HTML has strict script load order (25 scripts)
   - Splitting would require modifying `index-shell.html`
   - Wrong order would break runtime execution
   - Build system doesn't handle core module dependencies

4. **Legacy Migration Logic**
   - `getSettings()` function contains extensive migration logic
   - Multiple preset versions (v2-v18) with conditional migrations
   - Migration depends on threshold/stat constant relationships
   - Splitting would require complex coordination across modules

### Specific Challenges

```javascript
// Example of tight coupling that makes splitting difficult:
function getSettings() {
  // Uses DEFAULT_THRESHOLDS
  const thresholds = saved?.thresholds || DEFAULT_THRESHOLDS;
  
  // Uses DEFAULT_FORMULAS
  const formulas = saved?.formulas || DEFAULT_FORMULAS;
  
  // Uses functions from constants module
  const statConstants = mergeStatConstants(saved.statConstants);
  const hrThresholds = computeHrThresholds(statConstants);
  const duoThresholds = computeDuoThresholds(statConstants, hrThresholds);
  
  // Complex migration logic spanning all three modules
  if (presetVersion < 13) {
    statConstants = mergeStatConstants(null); // from constants
    formulas[name] = DEFAULT_FORMULAS[name]; // from formulas
  }
}
```

## Current defaults.js Structure

**Size:** 1276 lines
**Contains:**
- Threshold configurations (lines 4-37)
- Stat constant functions (lines 39-265)
- Formula system (lines 267-441)
- Legacy role definitions (lines 443-492)
- Artifact rules (lines 494-748)
- Evaluation policies (lines 750-1043)
- Settings management (lines 1045-1347)

## Safer Alternatives

### Option 1: Code Comments Organization
- Add clear section comments
- Document interdependencies
- Keep file intact but better organized

### Option 2: Future Migration to ES Modules
- Requires major architecture change
- Convert entire project to ES modules
- Add bundler (Rollup/Vite)
- Rewrite bootstrap logic
- **Estimate:** 2-3 days work, high risk

### Option 3: Incremental Split (When Ready)
- Split only after migrating to ES modules
- Split only after removing legacy migration logic
- Split only after adding proper dependency management
- **Prerequisites:** ES modules, bundler, test coverage >80%

### Option 4: Accept Current State
- 1276 lines is manageable for now
- File is logically organized by comments
- Risk of breaking > benefit of splitting
- **Recommendation:** Keep as-is for now

## Recommendation

**Do NOT split defaults.js at this time.**

**Rationale:**
1. High risk of breaking core functionality
2. Would require modifying critical HTML load order
3. Complex migration logic makes clean separation impossible
4. Project architecture (vanilla JS) doesn't support clean module boundaries
5. Benefits (maintainability) don't outweigh risks (breakage)

**When to Reconsider:**
- After migrating to ES modules
- After removing legacy migration logic
- After adding comprehensive integration tests
- After proper dependency management system in place

## Alternative Improvements (Safe to Do Now)

1. **Add section comments** to defaults.js for navigation
2. **Create inline documentation** for complex functions
3. **Add unit tests** for threshold/formula logic
4. **Document interdependencies** in code comments
5. **Monitor file size** - revisit if exceeds 2000 lines

## Conclusion

The split of defaults.js is **not recommended** for the current project state. The architecture constraints and tight coupling make it too risky. The file is large but functional and well-organized with comments. Focus on safer improvements instead.

Generated during codebase-design skill analysis (August 16, 2026)
