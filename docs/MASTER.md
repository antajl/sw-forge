# SW Forge — MASTER (Entry Point)

> **Purpose:** Repository map, edit rules, build commands.  
> **Not a backlog:** open features → [`BACKLOG.md`](BACKLOG.md); completed → Updates in app.  
> **Docs index:** [README.md](README.md) · **Project structure:** [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) · **Game knowledge:** [GAME-KNOWLEDGE.md](GAME-KNOWLEDGE.md)

---

## Project Context

SW Forge — Summoners War rune analyzer + monster hub. Static site on **Cloudflare Pages** — SWEX JSON stays in the browser (except optional Share via Worker).

### Stack

Vanilla JS + CSS · **Build:** `npm run build` (`build:html` + `build:css` + `build:ui`) · **Prod CSS:** `css/dist/app.css` · **Prod UI:** `js/ui.js` · **No external CDN dependencies** (GSAP local in `assets/`)

### URLs

| | |
|---|---|
| Prod | https://sw-forge.pages.dev |
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

## Documentation Index

| Question | File |
|----------|------|
| AI assistant guide, checklists, common pitfalls | [AI-ASSISTANT.md](AI-ASSISTANT.md) |
| Architecture analysis and improvement roadmap | [ARCHITECTURE-ROADMAP.md](ARCHITECTURE-ROADMAP.md) |
| Where code lives, build commands, load order, feature folders | [PROJECT-STRUCTURE.md](PROJECT-STRUCTURE.md) |
| Game mechanics, stat names, gem/grind/reapp rules | [GAME-KNOWLEDGE.md](GAME-KNOWLEDGE.md) |
| window.SWRM API + CSS variables | [API-REFERENCE.md](API-REFERENCE.md) |
| Open bugs + feature backlog (organized by priority) | [BACKLOG.md](BACKLOG.md) |
| Step-by-step workflows for common tasks | [WORKFLOWS.md](WORKFLOWS.md) |
| Module dependencies and load order | [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md) |
| Debugging guide and common issues | [DEBUGGING.md](DEBUGGING.md) |
| Testing guide and checklists | [TESTING.md](TESTING.md) |
| Artifact scoring research (incomplete) | [ARTIFACT_SCORING_RESEARCH.md](ARTIFACT_SCORING_RESEARCH.md) |
| Developer map (Russian) | [README.md](README.md) |

---

## Quick Links

- **Monster/skill data:** `node tools/fetch-monsters-index.mjs` · `node tools/fetch-skills-index.mjs --fresh`
- **Worker deploy:** `cd worker && npx wrangler deploy`
- **Search hex in features:** `rg "#[0-9a-fA-F]{6}" css/features/ -g "*.css"`

---

*When changing repo structure, update [`PROJECT-STRUCTURE.md`](PROJECT-STRUCTURE.md) and `tools/build-*.mjs`. Do not add backlog items here — use [`BACKLOG.md`](BACKLOG.md).*
