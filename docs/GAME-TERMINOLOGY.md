# SW Forge — Game terminology (Summoners War)

> **For AI / IDE:** read this before changing stat labels, rune table text, filters, or FR translations.  
> **Code:** `js/core/meta.js` · **UI strings:** `translations-*.js` · **Player guide:** `partials/tabs/guide.html`

## Two layers — do not mix them

| Layer | Language | Where | Purpose |
|-------|----------|-------|---------|
| **Engine / data** | Always **English** | `STAT_NAMES`, `r.mainName`, `r.substats[].name`, parser, scoring, filters (`value`), CSV sort keys | Stable keys from SWEX; logic never branches on UI locale |
| **Display** | **en / ru / fr** | Table cells, dashboard charts, filter **labels**, tooltips | What the player sees |

**Rule:** parse and store canonical English (`HP%`, `SPD`, `CRate`, …). Render with `SWRM.displayStatForUi(typeId, canonicalName, lang)`.

```javascript
// Filter dropdown — value = English, label = localized
const canon = STAT_NAMES[id];           // e.g. "HP%"
const label = statNamesUiForLang('fr')[id]; // e.g. "PV%"
`<option value="${canon}">${label}</option>`

// Table cell
displayStatForUi(r.mainType, r.mainName, currentLang); // → "PV" + " 13%"
```

### Why tables showed English on FR before

1. `STAT_NAMES_UI_BY_LANG.fr` existed (PV, VIT, TC, …) but was used only for the **Main stat** filter dropdown.
2. Table cells used `formatRuneStatPlainText()` with raw `o.name` (English from parser).
3. The filter used localized strings as `<option value>` while `table-filters.js` compares `r.mainName` (English) — so FR filtering was broken too.

**Fix (2026-06):** `displayStatForUi()` in `meta.js`; table/charts/chips call it at render time; filter keeps English `value`.

---

## Rune stats (SWEX type id → labels)

Canonical source: `STAT_NAMES` in `js/core/meta.js`.  
FR community abbreviations: [summoners-war-tierlist.fr — Lexique](https://summoners-war-tierlist.fr/lexique/) (also referenced in `meta.js` comment).

| ID | Engine (EN) | FR display | RU display | Notes |
|----|-------------|------------|------------|-------|
| 1 | HP | PV | HP | Flat HP (slot 5/6 mains on odd slots use slot rules) |
| 2 | HP% | PV% | HP% | |
| 3 | ATK | ATQ | ATK | |
| 4 | ATK% | ATQ% | ATK% | |
| 5 | DEF | DEF | DEF | |
| 6 | DEF% | DEF% | DEF% | |
| 8 | SPD | VIT | SPD | FR: Vitesse → **VIT** in UI |
| 9 | CRate | TC | CRate | FR: Taux Crit. → **TC** |
| 10 | CDmg | DCC | CDmg | FR: Dégâts Crit. → **DCC** |
| 11 | RES | RES | RES | |
| 12 | ACC | ACC | ACC | |

**Search:** table search maps FR tokens (`pv`, `atq`, `vit`, `tc`, `dcc`) to the same canonical keys as EN (`hp`, `atk`, …) in `canonRuneSearchStatKey()` (`table-filters.js`).

**Percent display:** UI maps may include `%` in the label (`PV%`), but `formatRuneStatPlainText()` strips `%` from the name and appends it to the **value** (`PV 13%`), matching EN behavior (`HP 13%`).

---

## Not localized yet (still English in UI)

| Domain | Constant | Notes |
|--------|----------|-------|
| Rune sets | `SET_NAMES` | Energy, Swift, Violent, … — use `translations-*.js` keys where wired; set names in table may still be EN |
| Grades | `GRADE_SHORT` / `GRADE_NAMES` | Legend, Hero, Rare — internal + table tags |
| Roles / verdicts | engine strings | Partially via `translations-*.js` (`verdictUiLabel`, role names) |
| Artifact flat primaries | `formatEffectLine()` in `gear/parse.js` | HP/ATK/DEF lines for artifact flat mains |
| Monster / element names | SWARFARM / bundled index | Separate from rune stats |

When adding FR for these, follow the same pattern: **canonical EN in data**, localized string only at render or via translation keys.

---

## API (`window.SWRM`)

| Function | Role |
|----------|------|
| `STAT_NAMES` | English canonical map (type id → string) |
| `STAT_NAMES_UI_BY_LANG` | Per-locale display map |
| `statNamesUiForLang(lang)` | Safe getter (`en` fallback) |
| `STAT_TYPE_IDS` | Ordered ids for filter dropdowns |
| `statTypeIdFromCanonical(name)` | `"HP%"` → `2` |
| `displayStatForUi(typeId, canonicalName, lang)` | Cell/chart/chip label |

---

## Files to touch when changing stat labels

| Change | Files |
|--------|-------|
| FR abbreviations | `js/core/meta.js` → `STAT_NAMES_UI_BY_LANG.fr` |
| New language | Add block in `STAT_NAMES_UI_BY_LANG`, rebuild not required for meta (loaded directly) |
| Table / export text | `js/features/runes/table-row-render.js` (`formatRuneStatPlainText`) |
| Filters | `language-bindings.js` (dropdown), `table-filters.js` (chips, search aliases) |
| Dashboard slot mains | `js/features/runes/charts.js` |
| Artifacts/relics secondary lines | `js/data/gear/parse.js` (`statLabel`) |
| After `js/features/*` edit | `npm run build:ui` |

---

## UI copy vs game terms

- **`translations-*.js`:** buttons, column headers, guide prose, verdict tooltips — general UI i18n.
- **`STAT_NAMES_UI_BY_LANG`:** short **in-game stat abbreviations** embedded in rune lines (same slot as SW client / community lexicon).

Do not put PV/VIT/TC into `translations-fr.js` for table stats — use `meta.js` so engine and UI stay separated.
