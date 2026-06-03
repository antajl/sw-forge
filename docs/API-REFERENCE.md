# SW Forge — API Reference

> `window.SWRM` API and CSS variables.  
> **Context:** [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) · **File map:** [`FILE-MAP.md`](FILE-MAP.md)

---

## `window.SWRM` — Main API

Assembled by the script load chain; same object in `ui.js` plus UI helpers.

| API | Module | Purpose |
|-----|--------|---------|
| `APP_VERSION` | bootstrap | App version string |
| `settings`, `saveSettings` | defaults | User settings persistence |
| `TRANSLATIONS`, `STATIC_CHANGELOG`, `STATIC_ROADMAP` | translations / changelog | UI text strings |
| `parseSWEX`, `parseRune`, `parseUnits` | parser | SWEX → runes/units |
| `calcEfficiency`, `calcEfficiencyUncapped` | parser | SWOP Eff% (Depth, dashboard charts — **not** table column) |
| `calcIngameScore`, `ingameScoreBreakdown` | ingame-score | Ingame Rating in rune table |
| `calcArtifactIngameScore`, `artifactIngameScoreBreakdown`, `ARTIFACT_INGAME_WEIGHTS` | artifact-ingame-score | Artifact Ingame Score, calibration coefficients |
| `parseAccountGear`, `parseArtifact`, `parseRelic` | gear/parse | Gear parsing |
| `formatGearEffectLine`, `formatArtifactSubLine` | gear/parse | Stat line display formatting |
| `processAll`, `processRune`, `getRuneVerdict` | engine | Rune verdicts |
| `getAdvancedVerdict`, `processAdvancedFormulas` | advanced-formulas | Formulas / roles |
| `checkRole`, `checkGrind`, `checkHighRoll` | engine | Role rules / grind checks |
| `processRunesAsync` | rune-processor-worker | Worker + fallback |
| `runSelfTests` | self-test | Self-test suite |
| `isShareReadOnly`, `getShareIdFromUrl`, `getProfileLinkFromUrl` | share (ui) | Share mode detection |

**Separate:** `window.SWRM_MONSTER_DB` — monster index (`loadMonsterIndex`, `monsterDisplayName`, `lookupMonster`).

---

## CSS Variables

**Rule:** In `css/features/` use only `var(--…)` from the lists below (hex only in `base.css` / `tokens.css` as value source).

### `css/foundation/base.css` — `:root` (dark theme)

| Group | Variables |
|--------|------------|
| Backgrounds | `--bg`, `--bg2`, `--bg3`, `--surface` |
| Borders | `--border`, `--border2` |
| Text | `--text`, `--text-dim`, `--text-hi` |
| Accents | `--accent`, `--accent2`, `--gold`, `--green`, `--red`, `--orange`, `--purple`, `--teal` |
| Stars | `--star-awaken` (pink awaken, **not** `--purple`) |
| Verdicts | `--keep`, `--sell`, `--grind`, `--finish`, `--reapp`, `--upgrade`, `--gem` |
| Fonts | `--font-ui`, `--font-head`, `--font-mono` |
| Radius | `--radius`, `--radius-lg` |
| Layout | `--app-content-max`, `--content-max`, `--app-gutter` |
| Stages | `--stage-early`, `--stage-mid`, `--stage-late` |
| Effects | `--glow-accent`, `--select-chevron`, `--stage-select-chevron` |
| Chips (base) | `--chip-surface-pct`, `--chip-border-base-pct` |
| Stat tints | `--tint-spd`, `--tint-hp`, `--tint-atk`, `--tint-def`, `--tint-cr`, `--tint-cd`, `--tint-acc`, `--tint-res` |
| Grade tints | `--tint-legend`, `--tint-hero`, `--tint-rare` |
| Other tints | `--tint-neutral`, `--tint-muted`, `--tint-ancient` |
| Verdict tints | `--tint-keep`, `--tint-sell`, `--tint-grind`, `--tint-finish`, `--tint-reapp`, `--tint-upgrade`, `--tint-gem` |
| Role tints | `--tint-highroll`, `--tint-bruiser`, `--tint-fastcc`, `--tint-tank`, `--tint-bomber`, `--tint-classicdps`, `--tint-slowdps`, `--tint-duoroll` |
| Eff tiers | `--tint-eff-hi`, `--tint-eff-mid`, `--tint-eff-lo` |
| Charts | `--chart-sets`, `--chart-slots` |

`.light-theme` overrides the same tokens (see `base.css`).

### `css/features/monsters/tokens.css`

| Variables |
|-----------|
| `--monster-star-natural`, `--monster-star-awaken`, `--monster-star-stroke`, `--monster-star-shadow` |
| `--space-xs`, `--space-sm`, `--space-md`, `--space-lg` |
| `--text-caption`, `--text-secondary`, `--text-body`, `--text-xs`, `--text-sm`, `--text-md` |

---

## Versioning and Cache Busting

**Rule:** On every release with user-visible changes, update version for cache busting.

**Release steps:**
1. Update `APP_VERSION` in `js/core/meta.js` (e.g., `1.2.18` → `1.2.19`)
2. Update `?v=APP_VERSION` in `index.html` for all resources:
   - CSS: `<link rel="stylesheet" href="css/dist/app.css?v=1.2.19" />`
   - JS: `<script defer src="js/core/meta.js?v=1.2.19"></script>` (all scripts)
3. Run `npm run build:ui` to build `js/ui.js`

**Why:**
- Users see new JS/CSS immediately after deploy, without waiting for cache expiry (24 hours)
- Prevents stale file issues in browser/CDN cache
- `_headers` sets 24-hour cache for JS/CSS; versioning bypasses this

**Exceptions:**
- External libraries (e.g., `assets/gsap.min.js`) don't need versioning
- Static assets (`assets/*`) cached forever (`immutable`), versioning not needed
