# SW Forge — Project Context

> **AI:** read first. **Index:** [`docs/README.md`](README.md) · **Code map:** [`MASTER.md`](MASTER.md) · **Backlog:** [`PLANS.md`](PLANS.md)

## Что это

Summoners War rune analyzer + monster hub. Static site on **Cloudflare Pages** — SWEX JSON stays in the browser (except optional Share via Worker).

## Стек

Vanilla JS + CSS · **Build:** `npm run build` (`build:css` + `build:ui`) · **Prod CSS:** `css/dist/app.css` · **Prod UI:** `js/ui.js`

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
| i18n, changelog | `js/core/` |

## Правила правок

1. `js/features/` → `npm run build:ui`
2. CSS from `tools/build-css.mjs` list → `npm run build:css`
3. New UI strings → `i18n.js` EN + RU
4. Player-facing changes → changelog **today's date only**; then remove from `PLANS.md`
5. No manual edits to `js/ui.js` or `css/dist/app.css`

## Build

```bash
npm run build:ui
npm run build:css
npm run build
npm run watch:ui
```

Do not edit `js/ui.js` by hand. Script order in `index.html` — see `MASTER.md` §3.
