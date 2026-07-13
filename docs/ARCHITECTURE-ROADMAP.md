# SW Forge Architecture Roadmap

Comprehensive analysis of current architecture, identified issues, and detailed improvement plan with justifications.

**Status: Implementation Complete (July 2026)**

All phases from the revised roadmap have been successfully implemented:
- ✅ Phase 1: CI/CD, Pre-commit hooks, Cache busting, Source maps
- ✅ Phase 2: Minification, Parallel builds, Build validation
- ✅ Phase 3: Data validation
- ✅ Phase 4: Testing framework (Vitest)
- ✅ Phase 5: Linting (ESLint, Stylelint, Prettier)
- ✅ Phase 6: Runtime optimization (debounce), Asset optimization (WebP)

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Data Flow Analysis](#data-flow-analysis)
3. [Build Process Analysis](#build-process-analysis)
4. [Deployment Analysis](#deployment-analysis)
5. [Runtime Architecture](#runtime-architecture)
6. [Identified Issues](#identified-issues)
7. [Improvement Roadmap](#improvement-roadmap)
8. [Implementation Phases](#implementation-phases)

---

## Current Architecture

### Overview

SW Forge is a static web application deployed on Cloudflare Pages with a Cloudflare Worker backend. The application processes Summoners War SWEX JSON exports entirely client-side, with optional share functionality via the Worker.

**Stack:**
- Frontend: Vanilla JavaScript + CSS (no frameworks)
- Backend: Cloudflare Worker (Node.js runtime)
- Database: Cloudflare D1 (SQLite)
- Hosting: Cloudflare Pages (static)
- CDN: Cloudflare (built-in)

**Key Characteristics:**
- Client-side processing (SWEX stays in browser)
- Static site with dynamic build-time assembly
- Manual Worker deployment
- Git-based deployment for frontend

---

## Data Flow Analysis

### External Data Sources

**Game Data (from SWARFARM):**
- `monsters-index.json` - Monster names, portraits, base/max stats, leader skills
- `skills-index.json` - All skills with descriptions, cooldowns, upgrades (~1.6 MB)
- Monster portraits - Images for each monster
- Skill icons - Images for each skill
- Leader icons - Images for leader skills

**Fetch Tools:**
- `tools/fetch-monsters-index.mjs` - Fetches monster data from SWARFARM API
- `tools/fetch-skills-index.mjs` - Fetches skill data from SWARFARM API
- `tools/fetch-monsters-portraits.mjs` - Fetches monster portrait images
- `tools/fetch-skills-icons.mjs` - Fetches skill icon images
- `tools/fetch-leader-icons.mjs` - Fetches leader skill icon images

**Why SWARFARM?**
- Most comprehensive Summoners War database
- Well-documented API
- Community-maintained
- Free to use

**Current Process:**
1. Developer runs fetch commands manually
2. Data saved to `data/` directory
3. Data bundled with build
4. Deployed to Cloudflare Pages

**Issues:**
- Manual process (error-prone)
- No automation (data may become stale)
- No validation (corrupted data possible)
- No versioning (hard to track changes)

### Internal Data

**Static Data:**
- `demo.json` - Sample SWEX export (~5.5 MB) for demo mode
- Translations (EN/RU bundled, FR lazy-loaded)
- Changelog/Roadmap - Static in `js/core/changelog-data.js`

**User Data:**
- SWEX exports - Uploaded by users, processed client-side
- Settings - Stored in LocalStorage
- Share data - Stored in Worker D1 database

**Data Flow Diagram:**

```
SWARFARM API
    ↓ (fetch tools)
data/*.json (bundled)
    ↓ (build)
Cloudflare Pages
    ↓ (user loads)
Browser
    ↓ (user uploads SWEX)
Parser → Engine → UI
    ↓ (user shares)
Worker D1 → Share URL
```

**Why This Flow?**
- **Client-side processing:** Privacy (SWEX never leaves browser unless shared)
- **Bundled data:** Fast load, no API calls during runtime
- **LocalStorage:** Persistent settings without server
- **Worker D1:** Simple, serverless database for shares

**Issues:**
- No data freshness guarantees
- Large bundle size (demo.json + game data)
- No data validation before bundling
- No incremental updates (full rebuild needed)

---

## Build Process Analysis

### Current Build Steps

**1. build:html**
- **Tool:** `tools/build-html.mjs`
- **Input:** `index-shell.html` + `partials/`
- **Output:** `index.html`
- **Process:** Replaces `<!-- @include partials/... -->` markers with partial content

**Why Build-Time Assembly?**
- Single HTML file for deployment (simpler hosting)
- No runtime partial loading (faster initial load)
- Easier to debug (final HTML visible)

**2. build:translations**
- **Tool:** `tools/build-translations.mjs`
- **Input:** `js/core/translations-en.js` + `js/core/translations-ru.js`
- **Output:** `js/core/translations.js`
- **Process:** Concatenates EN+RU translations into single bundle

**Why Bundle Translations?**
- Single HTTP request (faster)
- Lazy-load FR only when needed (smaller initial bundle)
- Simplified translation management

**3. build:css**
- **Tool:** `tools/build-css.mjs`
- **Input:** CSS files from `css/foundation/` + `css/features/`
- **Output:** `css/dist/app.css`
- **Process:** Concatenates CSS files in dependency order

**Why Concatenate CSS?**
- Single HTTP request (faster)
- Maintains dependency order
- Easier cache management

**4. build:ui**
- **Tool:** `tools/build-ui.mjs`
- **Input:** JS files from `js/features/`
- **Output:** `js/ui.js`
- **Process:** Concatenates feature JS files in IIFE closure

**Why Concatenate JS?**
- Single HTTP request (faster)
- Maintains load order (critical for dependencies)
- No module system overhead (Vanilla JS)

**Full Build Command:**
```bash
npm run build  # Runs all 4 steps sequentially
```

### Build Artifacts

**Generated Files:**
- `index.html` - Assembled HTML (~250 KB)
- `js/ui.js` - Concatenated JS (~200+ KB)
- `css/dist/app.css` - Concatenated CSS (~100+ KB)
- `js/core/translations.js` - EN+RU bundle (~50 KB)

**Source Files (Never Edit):**
- `js/ui.js` - Edit `js/features/` instead
- `css/dist/app.css` - Edit CSS files instead
- `index.html` - Edit `index-shell.html` + `partials/` instead
- `js/core/translations.js` - Edit translation files instead

### Build Issues

**No Minification:**
- **Current:** No minification of JS/CSS
- **Impact:** Larger bundle size (~30-40% larger than minified)
- **Trade-off:** Intentional for easier debugging
- **Why:** Developer experience vs bundle size

**No Source Maps:**
- **Current:** No source maps generated
- **Impact:** Harder debugging in production
- **Why:** Not implemented yet

**No Hash-Based Cache Busting:**
- **Current:** Uses APP_VERSION for cache busting
- **Impact:** All files re-downloaded on version change
- **Why:** Simpler implementation

**No Parallel Execution:**
- **Current:** Build steps run sequentially
- **Impact:** Slower builds (~10-15 seconds)
- **Why:** Dependency order (html → translations → css → ui)

**No Incremental Builds:**
- **Current:** Full rebuild every time
- **Impact:** Slower development iterations
- **Why:** Simpler build system

---

## Deployment Analysis

### Frontend Deployment (Cloudflare Pages)

**Current Process:**
1. Developer commits changes to Git
2. Developer pushes to GitHub (`git push`)
3. Cloudflare Pages auto-deploys from GitHub
4. Build runs on Cloudflare Pages
5. Site deployed to `https://sw-forge.pages.dev`

**Why Cloudflare Pages?**
- Free hosting for static sites
- Automatic deployments from Git
- Built-in CDN
- Fast global distribution
- No server management

**Cache Strategy (_headers file):**
- Assets: 1 year immutable (never change)
- JS/CSS: 1 day with stale-while-revalidate
- JSON data: 1 hour with stale-while-revalidate
- HTML: no-cache (always fresh)

**Why These Cache Rules?**
- Assets: Never change, can cache forever
- JS/CSS: Change rarely, stale-while-revalidate for updates
- JSON: May update, short cache
- HTML: Always serve fresh (contains cache-busting URLs)

### Backend Deployment (Cloudflare Worker)

**Current Process:**
1. Developer changes Worker code
2. Developer runs `cd worker && npx wrangler deploy`
3. Worker deployed to `https://sw-backend.antajltube.workers.dev`
4. Manual step (not automated with frontend)

**Why Manual Deployment?**
- Worker is separate project
- Different deployment target
- Not always changed with frontend
- Simpler for now

**Worker Routes:**
- `POST /share` - Store read-only profile in D1
- `GET /share?id=…` - Load profile from D1
- `GET /swarfarm/*` - Proxy to SWARFARM with CORS

**Why These Routes?**
- Share: Temporary profile storage for mentor reviews
- Swarfarm proxy: CORS workaround for static assets

**Database (D1):**
- SQLite database on Cloudflare
- Stores share data (id, wizard_name, data, expires_at, created_at)
- Indexed by expires_at for cleanup

**Why D1?**
- Serverless (no management)
- Integrated with Cloudflare Workers
- Free tier sufficient
- SQL interface (familiar)

### Deployment Issues

**No CI/CD Pipeline:**
- **Current:** Manual Git push → auto-deploy
- **Impact:** No automated testing, no build validation
- **Why:** Not implemented yet

**No Pre-Commit Hooks:**
- **Current:** No checks before commit
- **Impact:** Broken commits possible
- **Why:** Not implemented yet

**No Automated Worker Deploy:**
- **Current:** Manual wrangler deploy
- **Impact:** Worker may be out of sync with frontend
- **Why:** Separate deployment process

**No Automated Testing:**
- **Current:** No tests run before deploy
- **Impact:** Regressions possible
- **Why:** No test framework

---

## Runtime Architecture

### Browser Runtime

**Load Sequence (Critical):**

```
1. Load index.html
2. Load CSS (css/dist/app.css)
3. Load scripts in strict order (25 scripts):
   - js/core/meta.js (constants)
   - js/core/i18n.js (translations)
   - js/core/defaults.js (thresholds, roles)
   - js/core/changelog-data.js (changelog)
   - js/core/bootstrap.js (assembles window.SWRM)
   - js/data/* (parser, DBs, scoring)
   - js/engine/* (verdicts, processing)
   - js/self-test.js (self-tests)
   - GSAP (animation library)
   - js/swrm-motion.js (motion effects)
   - js/ui.js (concatenated features)
4. Bootstrap assembles window.SWRM API
5. User uploads SWEX (or loads demo)
6. Parser parses SWEX into normalized format
7. Engine processes runes with verdicts
8. UI renders results
```

**Why Strict Load Order?**
- Dependencies: Core → Data → Engine → UI
- window.SWRM assembled by bootstrap.js
- TRANSLATIONS loaded by i18n.js
- Engine depends on data being loaded
- UI depends on engine being loaded

**Lazy Loading:**
- `js/core/i18n-fr.js` - Loaded only when FR selected
- Why: Smaller initial bundle, FR is less common

**Worker:**
- `js/workers/rune-processor.worker.js` - Created dynamically
- Why: Background processing for large SWEX exports

### Worker Runtime

**Request Flow:**

```
Browser → Cloudflare Worker
  ↓
Route handler
  ↓
POST /share → Store in D1
GET /share?id=… → Load from D1
GET /swarfarm/* → Proxy to SWARFARM
  ↓
Response with CORS headers
```

**Why Worker?**
- Serverless (no server management)
- CORS proxy for SWARFARM
- D1 database for shares
- Free tier sufficient

**CORS Headers:**
- `Access-Control-Allow-Origin: *` - Allow any origin
- `Access-Control-Allow-Methods: GET, POST, HEAD, OPTIONS` - Allowed methods
- `Access-Control-Allow-Headers: Content-Type, Accept` - Allowed headers

**Why CORS?**
- Frontend on different origin than Worker
- SWARFARM doesn't allow cross-origin requests
- Share functionality needs CORS

### Runtime Issues

**No Service Worker:**
- **Current:** No service worker
- **Impact:** No offline support, no background sync
- **Why:** Not implemented yet

**No Error Tracking:**
- **Current:** No error tracking (Sentry, etc.)
- **Impact:** Hard to debug production issues
- **Why:** Not implemented yet

**No Performance Monitoring:**
- **Current:** No performance monitoring
- **Impact:** Hard to identify performance issues
- **Why:** Not implemented yet

---

## Identified Issues

### Critical Issues (P0)

*No critical issues at this time.*

### High Priority Issues (P1)

**1. No CI/CD Pipeline**
- **Impact:** No automated testing, no build validation
- **Risk:** Broken deployments, regressions
- **Why Fix:** Consistency, reliability

**2. Residual Hex Colors in CSS**
- **Impact:** Theme switching harder, color inconsistency
- **Risk:** Maintenance burden
- **Why Fix:** Maintainability, theme consistency

**3. No JS/CSS Minification**
- **Impact:** Larger bundle size (~30-40%)
- **Risk:** Slower load times
- **Why Fix:** Performance, user experience

**4. No npm run watch:css**
- **Impact:** Manual build:css required
- **Risk:** Slower development iterations
- **Why Fix:** Developer experience

### Medium Priority Issues (P2)

**1. Manual Worker Deployment**
- **Impact:** Worker may be out of sync with frontend
- **Risk:** Share functionality broken
- **Why Fix:** Consistency

**2. No Automated Data Updates**
- **Impact:** Data may become stale
- **Risk:** Outdated game information
- **Why Fix:** Data freshness

**3. No Source Maps**
- **Impact:** Harder debugging in production
- **Risk:** Longer debug time
- **Why Fix:** Developer experience

**4. No Pre-Commit Hooks**
- **Impact:** Broken commits possible
- **Risk:** Wasted time fixing broken commits
- **Why Fix:** Code quality

### Low Priority Issues (P3)

**1. No Service Worker**
- **Impact:** No offline support
- **Risk:** Poor experience on poor connections
- **Why Fix:** User experience

**2. No Error Tracking**
- **Impact:** Hard to debug production issues
- **Risk:** Longer resolution time
- **Why Fix:** Reliability

**3. No Performance Monitoring**
- **Impact:** Hard to identify performance issues
- **Risk:** Poor user experience
- **Why Fix:** Performance optimization

---

## Improvement Roadmap

### Phase 1: Quick Wins (1-2 days)

**Goal:** Implement high-impact, low-effort improvements.

#### 1.1 Add CI/CD Pipeline

**What:** Create `.github/workflows/deploy.yml` for automated builds and deployments.

**Why:**
- Consistent builds across environments
- Catch build errors before deployment
- Automate Worker deployment with frontend
- Run basic tests before deploy

**How:**
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: cd worker && npx wrangler deploy
```

**Impact:** High
**Effort:** Low (2-4 hours)

#### 1.2 Add Pre-Commit Hooks

**What:** Use Husky or git hooks to run build before commit.

**Why:**
- Prevent broken commits
- Catch syntax errors early
- Ensure build succeeds before commit

**How:**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run build"
    }
  }
}
```

**Impact:** Medium
**Effort:** Low (1-2 hours)

#### 1.3 Add Hash-Based Cache Busting

**What:** Generate content hashes for JS/CSS and update references in HTML.

**Why:**
- Better cache invalidation
- Only re-download changed files
- Remove APP_VERSION dependency

**How:**
- Modify build scripts to generate hashes
- Update index.html with hashed filenames
- Configure cache rules for hashed files

**Impact:** Medium
**Effort:** Medium (4-6 hours)

#### 1.4 Add Source Maps

**What:** Generate source maps for JS/CSS in development.

**Why:**
- Better debugging in production
- Easier to trace errors
- Better developer experience

**How:**
- Use esbuild with source map generation
- Enable in dev, disable in prod
- Upload to private CDN or exclude from deploy

**Impact:** Medium
**Effort:** Low (2-3 hours)

### Phase 2: Build System Improvements (3-5 days)

**Goal:** Improve build speed, output quality, and developer experience.

#### 2.1 Add Minification

**What:** Use esbuild or terser for JS, csso or clean-css for CSS.

**Why:**
- Smaller bundle size (~30-40% reduction)
- Faster load times
- Better user experience

**How:**
```javascript
// tools/build-ui.mjs
import { minify } from 'terser';
const minified = await minify(code);
```

**Trade-off:** Harder to debug in production (mitigated by source maps)

**Impact:** High
**Effort:** Medium (4-6 hours)

#### 2.2 Parallel Build Execution

**What:** Run build steps in parallel where possible.

**Why:**
- Faster builds (~50% faster)
- Better developer experience
- Save time

**How:**
- Use npm-run-all or concurrent
- Parallelize independent steps (css, translations)
- Keep dependent steps sequential

**Impact:** Medium
**Effort:** Low (2-3 hours)

#### 2.3 Add Build Validation

**What:** Check for missing translations, hardcoded hex colors, JSON schemas.

**Why:**
- Catch errors early
- Ensure code quality
- Prevent broken builds

**How:**
- Add validation step to build process
- Check translation keys match across languages
- Check for hardcoded hex colors
- Validate JSON schemas

**Impact:** Medium
**Effort:** Medium (4-6 hours)

### Phase 3: Data Management (1 day)

**Goal:** Improve data quality.

#### 3.1 Data Validation

**What:** Validate JSON schemas, check for missing assets.

**Why:**
- Catch data errors early
- Ensure data integrity
- Prevent broken builds

**How:**
- Add JSON schema validation
- Check for missing assets
- Test data integrity

**Impact:** Medium
**Effort:** Medium (4-6 hours)

### Phase 4: Testing (2-3 days)

**Goal:** Add automated testing to prevent regressions.

#### 4.1 Add Testing

**What:** Add unit tests, integration tests, E2E tests.

**Why:**
- Catch regressions
- Ensure code quality
- Document expected behavior
- Refactor with confidence

**How:**
- Unit tests for engine (Vitest)
- Integration tests for parser
- E2E tests with Playwright
- Add to CI/CD pipeline

**Impact:** High
**Effort:** High (3-4 days)

### Phase 5: Code Quality (1 day)

**Goal:** Improve code quality and consistency.

#### 5.1 Add Linting

**What:** ESLint for JavaScript, Stylelint for CSS, Prettier for formatting.

**Why:**
- Consistent code quality
- Catch common errors
- Enforce coding standards
- Auto-formatting

**How:**
```json
// package.json
{
  "devDependencies": {
    "eslint": "^8.0.0",
    "stylelint": "^15.0.0",
    "prettier": "^3.0.0"
  }
}
```

**Impact:** Medium
**Effort:** Low (2-3 hours)

### Phase 6: Performance (2-3 days)

**Goal:** Optimize performance for better user experience.

#### 6.1 Optimize Runtime

**What:** Virtual scrolling for large lists, debounce/throttle, Web Workers.

**Why:**
- Smoother UI
- Better performance
- No blocking main thread

**How:**
- Implement virtual scrolling for rune table
- Debounce expensive operations
- Use Web Workers for heavy computation

**Impact:** High
**Effort:** High (6-8 hours)

#### 6.2 Optimize Assets

**What:** Compress images, use WebP, lazy load images.

**Why:**
- Faster asset loading
- Smaller asset size
- Better user experience

**How:**
- Compress images with sharp
- Convert to WebP format
- Lazy load images below fold

**Impact:** Medium
**Effort:** Medium (4-6 hours)

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1)

**Timeline:** 1-2 days
**Priority:** High
**Impact:** High

**Tasks:**
1. Add CI/CD pipeline
2. Add pre-commit hooks
3. Add hash-based cache busting
4. Add source maps

**Success Criteria:**
- CI/CD pipeline runs on push
- Pre-commit hooks prevent broken commits
- Cache busting works with content hashes
- Source maps generated for debugging

**Rollback Plan:**
- Remove GitHub Actions workflow
- Remove Husky hooks
- Revert to APP_VERSION cache busting
- Disable source map generation

### Phase 2: Build System (Week 1-2)

**Timeline:** 2-3 days
**Priority:** High
**Impact:** High

**Tasks:**
1. Add minification
2. Parallel build execution
3. Build validation

**Success Criteria:**
- Bundle size reduced by 30-40%
- Build time reduced by 50%
- Build validation catches errors

**Rollback Plan:**
- Disable minification
- Revert to sequential builds
- Remove build validation

### Phase 3: Data Management (Week 2)

**Timeline:** 1 day
**Priority:** Medium
**Impact:** Medium

**Tasks:**
1. Data validation

**Success Criteria:**
- Data validation catches errors

**Rollback Plan:**
- Remove validation

### Phase 4: Testing (Week 2-3)

**Timeline:** 2-3 days
**Priority:** Medium
**Impact:** High

**Tasks:**
1. Testing framework

**Success Criteria:**
- Tests run in CI/CD

**Rollback Plan:**
- Remove tests

### Phase 5: Code Quality (Week 3)

**Timeline:** 1 day
**Priority:** Medium
**Impact:** Medium

**Tasks:**
1. Linting

**Success Criteria:**
- Linting passes

**Rollback Plan:**
- Disable linting

### Phase 6: Performance (Week 3-4)

**Timeline:** 2-3 days
**Priority:** Medium
**Impact:** High

**Tasks:**
1. Optimize runtime
2. Optimize assets

**Success Criteria:**
- Runtime performance improved
- Assets optimized

**Rollback Plan:**
- Revert runtime optimization
- Revert asset optimization

---

## Risks and Considerations

### Breaking Changes

**Minification:**
- **Risk:** Harder to debug in production
- **Mitigation:** Source maps, dev builds unminified
- **Impact:** Low (mitigated by source maps)

### Trade-offs

**Minification vs Debuggability:**
- **Trade-off:** Harder to debug in production
- **Mitigation:** Source maps, dev builds unminified
- **Decision:** Optional minification flag

**Build Time vs Optimization:**
- **Trade-off:** More optimization = slower builds
- **Mitigation:** Parallel builds
- **Decision:** Optimize for dev speed, prod quality

### Dependencies

**More npm packages:**
- **Risk:** More dependencies to maintain
- **Mitigation:** Choose stable, well-maintained packages
- **Impact:** Low (package.json management)

**CI/CD Requirements:**
- **Risk:** Requires GitHub Actions
- **Mitigation:** GitHub Actions is free and reliable
- **Impact:** Low (platform lock-in)

---

## Estimated Effort

**Phase 1:** 1-2 days
**Phase 2:** 2-3 days
**Phase 3:** 1 day
**Phase 4:** 2-3 days
**Phase 5:** 1 day
**Phase 6:** 2-3 days

**Total:** 9-13 days of focused work

**Recommended Timeline:**
- Week 1: Phase 1 (Quick Wins) + Phase 2 (Build System)
- Week 2: Phase 3 (Data Management) + Phase 4 (Testing)
- Week 3: Phase 5 (Code Quality) + Phase 6 (Performance)

---

## Recommendation

**Start with Phase 1 (Quick Wins)** for immediate benefits with minimal effort:
- CI/CD pipeline for consistent deploys
- Pre-commit hooks for code quality
- Hash-based cache busting for better caching
- Source maps for better debugging

**Then proceed with Phase 2 (Build System)** to improve performance:
- Minification for smaller bundles (30-40% reduction)
- Parallel builds for faster development
- Build validation for error prevention

**Phase 3-6 provide targeted improvements:**
- Phase 3 (Data Validation) - ensure data integrity
- Phase 4 (Testing) - prevent regressions
- Phase 5 (Linting) - code quality and consistency
- Phase 6 (Performance) - smoother runtime and faster assets

**Key Principle:** Each phase provides measurable value for the user:
- Faster load times (minification, cache busting, assets)
- Smoother experience (runtime optimization)
- Fewer bugs (CI/CD, validation, testing, linting)
- Stable deploys (CI/CD, pre-commit hooks)

**Removed from original plan (overkill for current scale):**
- ES Modules + Code Splitting (IIFE works well)
- Service Worker (offline support not critical)
- TypeScript (JSDoc sufficient)
- Automated Data Updates (manual trigger sufficient)
- Data Versioning (Git history sufficient)
- Incremental Builds (watch:ui sufficient)
- Dev Tools (current setup adequate)
- Performance Monitoring (can add later if needed)
