# SW Forge — Project Context

> **AI:** read first. **Index:** [`docs/README.md`](README.md) · **Code map:** [`MASTER.md`](MASTER.md) · **Backlog:** [`PLANS.md`](PLANS.md)

## Что это

Summoners War rune analyzer + monster hub. Static site on **Cloudflare Pages** — SWEX JSON stays in the browser (except optional Share via Worker).

## Стек

Vanilla JS + CSS · **Build:** `npm run build` (`build:css` + `build:ui`) · **Prod CSS:** `css/dist/app.css` · **Prod UI:** `js/ui.js` · **No external CDN dependencies** (GSAP local in `assets/`)

## URLs

| | |
|---|---|
| Prod | https://sw-forge.pages.dev |
| Share API | https://sw-backend.antajltube.workers.dev |
| Local | http://127.0.0.1:5500/ |

## Где код

| Area | Path |
|------|------|
| Runes engine | `js/engine/` |
| Runes UI | `js/features/runes/` |
| Monsters | `js/features/monsters/` |
| Gear tables | `js/features/gear/` |
| Teams | `js/features/teams/` · combat SPD + totem via `monsters-stats-calc.js` |
| SWEX / indexes | `js/data/` · bundled `data/*.json` (see `data/README.md`) |
| translations, changelog | `js/core/` (`translations-en.js`, `translations-ru.js`, `translations-fr.js`) |
| **Rune stat labels (EN engine / FR display)** | `js/core/meta.js` — see [`GAME-TERMINOLOGY.md`](GAME-TERMINOLOGY.md) |
| **Dashboard consolidation (in progress)** | [`DASHBOARD-CONSOLIDATION.md`](DASHBOARD-CONSOLIDATION.md) |
| Ingame rune Rating | `js/data/ingame-score.js` |
| Artifact Ingame Score | `js/data/artifact-ingame-score.js` · `ARTIFACT_INGAME_WEIGHTS`, `artifactIngameScoreBreakdown()` |
| Player Guide (EN/RU) | `index.html` `#tab-guide` — sync with code when table/rules change |

## Правила правок

1. `js/features/` → `npm run build:ui`
2. CSS from `tools/build-css.mjs` list → `npm run build:css`
3. UI strings EN/RU → `translations-en.js` + `translations-ru.js` → `npm run build:translations`; FR → `translations-fr.js`
4. Player-facing changes → changelog **today's date only**; then remove from `PLANS.md`
5. No manual edits to `js/ui.js`, `css/dist/app.css`, or `js/core/translations.js`

## Build

```bash
npm run build:translations
npm run build:ui
npm run build:css
npm run build
npm run watch:ui
```

Do not edit `js/ui.js` or `js/core/translations.js` by hand. Script order in `index-shell.html` — see `MASTER.md`.
