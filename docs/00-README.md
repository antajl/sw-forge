# SW Forge Documentation — AI Guide

> **For AI agents:** Read this documentation in the numbered order below to understand the project before analyzing design screenshots or proposing changes.

---

## Documentation Reading Order

Read these files in sequence to build complete understanding:

### 1. Project Overview
**00-MASTER.md** — Entry point
- Project context (static site on Cloudflare Pages)
- Stack information (Vanilla JS + CSS)
- URLs (prod, share API, local)
- Edit rules (6 critical rules)
- Build commands
- Script load order (25 scripts, strict dependency contract)
- CI/CD deployment (GitHub Actions)
- Development tools (ESLint, Prettier, Stylelint, Vitest)
- Documentation index

### 2. Game Context
**01-GAME-OVERVIEW.md** — Summoners War context for AI
- What is Summoners War (monsters, runes, artifacts)
- How SW Forge fits in (user workflow)
- Rune mechanics context (why runes matter, verdicts)
- Artifact mechanics context
- Monster mechanics context
- UI concepts (Rune Table, Dashboard, Monsters, Teams)
- Key terms for AI (SWEX, Efficiency, Verdict, Depth, etc.)
- Design context for analyzing screenshots

### 3. Technical Rules
**02-GAME-KNOWLEDGE.md** — Game mechanics for engine logic
- Stat names and localization (two layers: engine vs display)
- Rune mechanics (slots, fixed mains, substat availability)
- Uniqueness rule (stat cannot appear twice)
- Grindstones (how they work, what can be grinded)
- Enchanted Gems (how they work, restrictions)
- Reappraisal Stones (how they work, when to use)
- Artifacts (structure, secondary effects, power-ups)
- Ancient runes (differences from regular)
- Engine constants (must stay in sync with game rules)

### 4. Project Structure
**03-PROJECT-STRUCTURE.md** — File map and build system
- Build system (HTML, translations, UI, CSS)
- Do not edit manually (build artifacts)
- Script and CSS load order
- ui.js internal order (modular monsters)
- CSS build order
- Dependency contracts
- File map (root, CSS, JS core, data, engine, features)
- Dependency map (high-level architecture)

### 5. API Reference
**04-API-REFERENCE.md** — window.SWRM API
- Main API functions (parseSWEX, calcEfficiency, processAll, etc.)
- New constants from defaults.js (STAT_NAMES_UI_BY_LANG, DEFAULT_FORMULAS, artifact system)
- CSS variables (theming tokens)
- Versioning and cache busting

### 6. Workflows
**05-WORKFLOWS.md** — Step-by-step task guides
- Adding new rune verdict
- Adding new monster filter
- Changing UI strings
- Adding new CSS classes
- Modifying build process
- Adding new tabs
- Fixing bugs
- Updating changelog
- Adding artifact effects

### 7. Debugging
**06-DEBUGGING.md** — Debugging guide
- How to enable debug mode
- Where to look for logs
- Common error patterns
- Debugging checklist
- Browser DevTools tips

### 8. Testing
**07-TESTING.md** — Testing guide
- Local server setup
- Test data (demo.json)
- Testing checklist before deployment
- Functionality, UI, localization, cross-browser, performance testing
- Regression testing
- Common testing issues

### 9. Development Tools
**08-DEVELOPMENT-TOOLS.md** — Tools reference
- Build tools (build-html, build-css, build-ui, build-translations)
- Asset fetching tools (skills-icons, monsters-index, etc.)
- Translation tools (extract, build, audit)
- Development tools (watch-ui)
- Utility tools
- NPM scripts

### 10. CI/CD
**09-CI-CD.md** — Deployment guide
- GitHub Actions workflow
- Required secrets (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- Manual deployment
- Worker configuration
- Troubleshooting
- Monitoring

### 11. Backlog
**11-BACKLOG.md** — Open bugs and features
- Priority levels (P0-P3)
- Open issues (residual hex colors, no watch:css)
- Planned features (monsters, share, runes, artifacts)
- Resolved bugs archive

### 12. AI Assistant Guide
**12-AI-ASSISTANT.md** — Specific instructions for AI
- Project summary
- Critical edit rules
- Build commands
- Script load order
- Dependency flow
- Project structure
- Checklists for common tasks
- Common pitfalls
- Debugging tips

### 13. Research
**13-RESEARCH-ARTIFACT-SCORING.md** — Artifact scoring research
- Why artifact ingame score is disabled
- Knowns and hypotheses
- What attempts were made
- What is still needed

---

## Quick Start for New AI

If you're new to this project and need to quickly understand it:

1. **Read 00-MASTER.md** — Get project overview
2. **Read 01-GAME-OVERVIEW.md** — Understand game context
3. **Read 03-PROJECT-STRUCTURE.md** — Know where code lives
4. **Read 04-API-REFERENCE.md** — Understand available APIs

Then, depending on your task:
- **Design changes:** Read 01-GAME-OVERVIEW.md + 03-PROJECT-STRUCTURE.md
- **Engine logic:** Read 02-GAME-KNOWLEDGE.md + 04-API-REFERENCE.md
- **Build issues:** Read 03-PROJECT-STRUCTURE.md + 08-DEVELOPMENT-TOOLS.md
- **Deployment:** Read 09-CI-CD.md
- **Debugging:** Read 06-DEBUGGING.md

---

## File Naming Convention

Documentation files are numbered for reading order:
- `00-` — Entry point
- `01-02` — Game context (overview + technical rules)
- `03-04` — Project structure and API
- `05-07` — Development workflows (workflows, debugging, testing)
- `08-09` — Tools and deployment
- `10-13` — Reference materials

---

## Russian Documentation

**README.md** (no prefix) — Russian documentation map for developers and AI. Provides quick routes to key information in Russian.

---

## Related Resources

- **Project repository:** d:\Site\SW-Forge
- **Production URL:** https://sw-forge.ru
- **Share API:** https://sw-backend.antajltube.workers.dev
