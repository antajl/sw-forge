# SW Forge — MASTER (Entry Point)

> **Purpose:** Repository map, edit rules, build commands.
> **Not a backlog:** open features → [`11-BACKLOG.md`](11-BACKLOG.md); completed → Updates in app.
> **Docs index:** [README.md](README.md) · **Project structure:** [03-PROJECT-STRUCTURE.md](03-PROJECT-STRUCTURE.md) · **Game knowledge:** [02-GAME-KNOWLEDGE.md](02-GAME-KNOWLEDGE.md)

---

## Project Context

SW Forge — Summoners War rune analyzer + monster hub. Static site on **Cloudflare Pages** — SWEX JSON stays in the browser (except optional Share via Worker).

### Stack

Vanilla JS + CSS · **Build:** `npm run build` (`build:html` + `build:css` + `build:ui`) · **Prod CSS:** `css/dist/app.css` · **Prod UI:** `js/ui.js` · **No external CDN dependencies** (GSAP local in `assets/`)

### URLs

| | |
|---|---|
| Prod | https://sw-forge.ru |
| Share API | https://sw-backend.antajltube.workers.dev |
| Local | http://127.0.0.1:5500/ |

### Where code is

| Area | Path |
|------|------|
| Runes engine | `js/engine/` |
| Runes UI | `js/features/runes/` |
| Monsters | `js/features/monsters/` |
| Gear tables | `js/features/gear/` |
| Teams | `js/features/teams/` · combat SPD + totem via `monsters-stats-calc.js` |
| SWEX / indexes | `js/data/` · bundled `data/*.json` (see `data/README.md`) |
| translations, changelog | `js/core/` (`translations-en.js`, `translations-ru.js`, `translations-fr.js`) |
| Rune stat labels (EN engine / FR display) | `js/core/meta.js` — see [`GAME-KNOWLEDGE.md`](GAME-KNOWLEDGE.md) |
| Dashboard consolidation (completed) | Dashboard tab now hosts Runes | Monsters hub; Gear/Monsters hubs removed Dashboard subtabs |
| Ingame rune Rating | `js/data/ingame-score.js` |
| Artifact Ingame Score | `js/data/artifact-ingame-score.js` · `ARTIFACT_INGAME_WEIGHTS`, `artifactIngameScoreBreakdown()` — **⚠ DISABLED** (formula unconfirmed, returns null — see `ARTIFACT_SCORING_RESEARCH.md`) |
| Player Guide (EN/RU) | `index.html` `#tab-guide` — sync with code when table/rules change |

---

## Edit Rules (6 points)

1. `partials/` changes → `npm run build:html`
2. `js/features/` changes → `npm run build:ui`
3. CSS from `tools/build-css.mjs` list → `npm run build:css`
4. UI strings EN/RU → `translations-en.js` + `translations-ru.js` → `npm run build:translations`; FR → `translations-fr.js` (lazy)
5. Player-facing changes → changelog **today's date only**; then remove from `PLANS.md`
6. **Do not edit manually:** `js/ui.js`, `css/dist/app.css`, `index.html`, `js/core/translations.js` (build artifact), `<script defer>` order in `index-shell.html`

---

## Build Commands

```bash
npm run dev                # local dev server (http://127.0.0.1:5500)
npm run build:html         # tools/build-html.mjs → index.html (with hash-based cache busting)
npm run build:translations # translations-en/ru → js/core/translations.js
npm run build:ui           # tools/build-ui.mjs → js/ui.js (with minification + source maps)
npm run build:css          # tools/build-css.mjs → css/dist/app.css (with minification)
npm run build:validate     # validate build (hex colors, translations)
npm run validate:data       # validate data (JSON, missing assets)
npm run build              # all steps (parallel build + validation)
npm run watch:ui           # rebuild ui.js on save in js/features/
npm run lint               # lint JS and CSS
npm run lint:fix           # auto-fix linting issues
npm run format             # format code with Prettier
npm run test               # run tests (Vitest)
npm run optimize:assets    # convert images to WebP
```

---

## Script Load Order

Strict dependency contract for `<script defer>` tags in `index-shell.html` (25 scripts in specific order). **Do not modify without checking dependency graph.**

1. `js/core/meta.js`
2. `js/core/translations.js` (EN+RU bundle)
3. `js/core/defaults.js`
4. `js/core/changelog-data.js`
5. `js/core/bootstrap.js` (assembles `window.SWRM`)
6. `js/data/artifacts/effects.js`
7. `js/data/artifact-ingame-score.js`
8. `js/data/relics/effects.js`
9. `js/data/gear/parse.js`
10. `js/data/gear/icons.js`
11. `js/data/parser.js`
12. `js/data/ingame-score.js`
13. `js/data/local-assets.js`
14. `js/data/skill-db.js`
15. `js/data/monster-db.js`
16. `js/engine/engine-core.js`
17. `js/engine/engine-legacy-roles.js`
18. `js/engine/engine-gem-reapp-verdict.js`
19. `js/engine/engine-artifacts.js`
20. `js/advanced-formulas.js`
21. `js/engine/engine-process.js`
22. `js/self-test.js`
23. `assets/gsap.min.js` (not defer)
24. `js/swrm-motion.js`
25. `js/ui.js`

**Lazy-loaded:** `js/core/translations-fr.js` (on demand when FR selected via `language-bindings.js`)

**Worker:** `js/workers/rune-processor.worker.js` (dynamic, not in HTML)

**Dependency flow:** Core → Bootstrap (`window.SWRM`) → Data → Engine → UI

---

## CI/CD Deployment

SW Forge uses GitHub Actions for automatic Cloudflare Worker deployment.

### Workflow
- **Trigger:** Push to `main` branch
- **File:** `.github/workflows/deploy.yml`
- **Steps:**
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies (`npm ci`)
  4. Build (`npm run build`)
  5. Deploy Worker (`cd worker && npx wrangler deploy`)

### Required Secrets
Configure in GitHub repository settings:
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Worker deployment permissions
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID

### Manual Worker Deploy
```bash
cd worker
npx wrangler deploy
```

---

## Development Tools

### Code Quality
- **ESLint:** `.eslintrc.json` — JS linting (browser + ES2021)
- **Prettier:** `.prettierrc.json` — Code formatting (no semicolons, single quotes, 2-space tabs)
- **Stylelint:** `.stylelintrc.json` — CSS linting (standard config)
- **Vitest:** `vitest.config.js` — Unit testing (jsdom environment)

### Linting Scripts
```bash
npm run lint       # lint JS and CSS
npm run lint:fix   # auto-fix linting issues
npm run format     # format code with Prettier
npm run test       # run tests (Vitest)
```

### Ignore Patterns
ESLint ignores build artifacts: `js/ui.js`, `css/dist/app.css`, `index.html`, `node_modules/`, `assets/`

---

## Documentation Index

| Question | File |
|----------|------|
| AI assistant guide, checklists, common pitfalls | [12-AI-ASSISTANT.md](12-AI-ASSISTANT.md) |
| Where code lives, build commands, load order, feature folders | [03-PROJECT-STRUCTURE.md](03-PROJECT-STRUCTURE.md) |
| Game overview (Summoners War context for AI) | [01-GAME-OVERVIEW.md](01-GAME-OVERVIEW.md) |
| Game mechanics, stat names, gem/grind/reapp rules | [02-GAME-KNOWLEDGE.md](02-GAME-KNOWLEDGE.md) |
| window.SWRM API + CSS variables | [04-API-REFERENCE.md](04-API-REFERENCE.md) |
| Open bugs + feature backlog (organized by priority) | [11-BACKLOG.md](11-BACKLOG.md) |
| Step-by-step workflows for common tasks | [05-WORKFLOWS.md](05-WORKFLOWS.md) |
| Debugging guide and common issues | [06-DEBUGGING.md](06-DEBUGGING.md) |
| Testing guide and checklists | [07-TESTING.md](07-TESTING.md) |
| Artifact scoring research (incomplete) | [13-RESEARCH-ARTIFACT-SCORING.md](13-RESEARCH-ARTIFACT-SCORING.md) |
| CI/CD deployment guide | [09-CI-CD.md](09-CI-CD.md) |
| Development tools reference | [08-DEVELOPMENT-TOOLS.md](08-DEVELOPMENT-TOOLS.md) |
| Developer map (Russian) | [README.md](README.md) |

---

## Quick Links

- **Monster/skill data:** `node tools/fetch-monsters-index.mjs` · `node tools/fetch-skills-index.mjs --fresh`
- **Worker deploy:** `cd worker && npx wrangler deploy`
- **Search hex in features:** `rg "#[0-9a-fA-F]{6}" css/features/ -g "*.css"`

---

*When changing repo structure, update [`03-PROJECT-STRUCTURE.md`](03-PROJECT-STRUCTURE.md) and `tools/build-*.mjs`. Do not add backlog items here — use [`11-BACKLOG.md`](11-BACKLOG.md).*
