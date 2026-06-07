# SW Forge — Game Knowledge

> **For AI / IDE agents:** read this before touching engine logic in `js/engine/`,
> `js/advanced-formulas.js`, or `js/core/defaults.js`.
> Covers stat naming conventions, localization layers, and all game mechanic rules
> that the engine must enforce correctly.
> **Artifact score research:** see [ARTIFACT_SCORING_RESEARCH.md](ARTIFACT_SCORING_RESEARCH.md)

## Stat names and localization

### Two layers — do not mix them

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

### Rune stats (SWEX type id → labels)

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

### Not localized yet (still English in UI)

| Domain | Constant | Notes |
|--------|----------|-------|
| Rune sets | `SET_NAMES` | Energy, Swift, Violent, … — use `translations-*.js` keys where wired; set names in table may still be EN |
| Grades | `GRADE_SHORT` / `GRADE_NAMES` | Legend, Hero, Rare — internal + table tags |
| Roles / verdicts | engine strings | Partially via `translations-*.js` (`verdictUiLabel`, role names) |
| Artifact flat primaries | `formatEffectLine()` in `gear/parse.js` | HP/ATK/DEF lines for artifact flat mains |
| Monster / element names | SWARFARM / bundled index | Separate from rune stats |

When adding FR for these, follow the same pattern: **canonical EN in data**, localized string only at render or via translation keys.

### API (`window.SWRM`)

| Function | Role |
|----------|------|
| `STAT_NAMES` | English canonical map (type id → string) |
| `STAT_NAMES_UI_BY_LANG` | Per-locale display map |
| `statNamesUiForLang(lang)` | Safe getter (`en` fallback) |
| `STAT_TYPE_IDS` | Ordered ids for filter dropdowns |
| `statTypeIdFromCanonical(name)` | `"HP%"` → `2` |
| `displayStatForUi(typeId, canonicalName, lang)` | Cell/chart/chip label |

### Files to touch when changing stat labels

| Change | Files |
|--------|-------|
| FR abbreviations | `js/core/meta.js` → `STAT_NAMES_UI_BY_LANG.fr` |
| New language | Add block in `STAT_NAMES_UI_BY_LANG`, rebuild not required for meta (loaded directly) |
| Table / export text | `js/features/runes/table-row-render.js` (`formatRuneStatPlainText`) |
| Filters | `language-bindings.js` (dropdown), `table-filters.js` (chips, search aliases) |
| Dashboard slot mains | `js/features/runes/charts.js` |
| Artifacts/relics secondary lines | `js/data/gear/parse.js` (`statLabel`) |
| After `js/features/*` edit | `npm run build:ui` |

### UI copy vs game terms

- **`translations-*.js`:** buttons, column headers, guide prose, verdict tooltips — general UI i18n.
- **`STAT_NAMES_UI_BY_LANG`:** short **in-game stat abbreviations** embedded in rune lines (same slot as SW client / community lexicon).

Do not put PV/VIT/TC into `translations-fr.js` for table stats — use `meta.js` so engine and UI stay separated.

## Rune mechanics

### Slots and fixed main stats

| Slot | Fixed main stat | Notes |
|------|----------------|-------|
| 1 | ATK (flat) | Always flat, never % |
| 2 | SPD / ATK / ATK% / DEF / DEF% / HP / HP% | SPD only exists as a main stat here |
| 3 | DEF (flat) | Always flat, never % |
| 4 | ATK% / CDmg / CRate / ATK / DEF / DEF% / HP / HP% | CRate/CDmg exclusive to slot 4 as main |
| 5 | HP (flat) | Always flat, never % |
| 6 | ATK% / DEF% / HP% / ACC / RES / ATK / DEF / HP | ACC/RES exclusive to slot 6 as main |

### Substat availability by slot (CRITICAL for gem logic)

All substats are valid on all slots **except**:

- **Slot 1:** cannot have `DEF` or `DEF%` as substats
- **Slot 3:** cannot have `ATK` or `ATK%` as substats
- **Slot 5:** no extra restrictions — `ATK%`, `DEF%`, `SPD` are all valid substats here

Gems obey the same slot restrictions. A gem cannot introduce a stat that the slot is incapable of naturally having.

### Uniqueness rule

A stat type cannot appear more than once on a rune across main stat + innate/prefix + substats. If `SPD` is the main stat (slot 2), no substat can be `SPD`. If `HP%` is innate, it cannot appear in substats either.

## Grindstones

Grindstones **boost the numeric value** of an existing substat. They do not change the stat type.

**The innate/prefix stat cannot be grinded.** Only the four regular substats are grindable.

### Grindable stats (exhaustive list)

`SPD`, `ATK%`, `ATK` (flat), `DEF%`, `DEF` (flat), `HP%`, `HP` (flat)

### Cannot be grinded

`CRate`, `CDmg`, `ACC`, `RES` — no grindstones exist for these stats.

### Mechanics

- Can be applied unlimited times to the same substat; each application replaces the previous grind value (not additive).
- Grind value is added on top of the base substat value, not on top of the total including power-up rolls.
- Cannot grind a substat that has been replaced by a gem (the slot is locked after gem use).
- Grindstones are **set-specific**: a Swift grindstone only applies to Swift runes.
- **Ancient grindstones only apply to Ancient runes. Regular grindstones cannot be used on Ancient runes.**

### Actual in-game gain ranges (Legend grade, max-roll grindstone)

| Stat | Gain range |
|------|-----------|
| SPD | +4 to +5 |
| ATK% | +4% to +7% |
| DEF% | +4% to +7% |
| HP% | +4% to +7% |
| ATK (flat) | +18 to +34 |
| DEF (flat) | +18 to +34 |
| HP (flat) | ~+430 to +610 |

Hero grade rolls: `ATK%/DEF%/HP%` max ~+7%, `SPD` max +4. Rare grade is lower still.

### Engine simplification (SW Forge specific)

`getGrindGainByGrade()` uses **fixed single values** per grade, not ranges, because the engine models whether a grind *can* bridge a threshold gap — it assumes the best-case roll:

| Stat | Legend | Hero | Rare |
|------|--------|------|------|
| SPD | +5 | +4 | +3 |
| ATK% / DEF% / HP% | +10% | +8% | +6% |

> **Note:** The `+10 / +8 / +6` values are **engine approximations** (optimistic ceiling for threshold bridging), not exact in-game values. Flat ATK/DEF/HP grindstones are **not modeled** in the engine at all — `checkGrind()` only operates on `SPD`, `ATK%`, `DEF%`, `HP%`.

*Engine reference: `getGrindGainByGrade()`, `checkGrind()` in `engine-gem-reapp-verdict.js`*

## Enchanted Gems (Gems)

Gems **replace one substat** with a completely different stat type.

**The innate/prefix stat cannot be gemmed.** Only the four regular substats can be targeted.

### Valid gem-in targets

Any stat can be gemmed in: `SPD`, `ATK%`, `ATK`, `DEF%`, `DEF`, `HP%`, `HP`, `CRate`, `CDmg`, `ACC`, `RES`.

Unlike grindstones, gems can introduce `CRate`, `CDmg`, `ACC`, and `RES`.

### Restrictions

1. **One gem per rune, ever.** Only one substat can be replaced on a given rune. Once applied, the other three substats are permanently locked against gem replacement. (The already-gemmed substat can be re-enchanted with another gem.)
2. **No duplicates.** Cannot gem-in a stat already present on the rune (main stat, innate, or any other substat).
3. **Slot restrictions apply.** Cannot gem-in a stat forbidden for that slot:
   - Slot 1: cannot gem-in `DEF` or `DEF%`
   - Slot 3: cannot gem-in `ATK` or `ATK%`
   - Slot 5: no restrictions
4. **+12 required.** Rune must be powered up to at least +12 before a gem can be used.
5. **Power-up rolls lost.** If the replaced substat had accumulated power-up rolls (+3/+6/+9/+12 bonuses), those rolls are discarded.
6. **Set-specific.** Gems are set-specific, except **Immemorial Gems** (from Tartarus' Labyrinth), which work on any rune set.
7. **Ancient gems only apply to Ancient runes. Regular gems cannot be used on Ancient runes.**

### What gem-out candidates are (SW Forge logic)

Only **flat substats** (`ATK`, `DEF`, `HP`) that are below quality thresholds and have no existing grind or gem applied. Called `badFlat` in the engine.

*Engine reference: `listBadFlatSubNames()`, `hasBadFlat()`, `checkRoleAwareGemTarget()`, `GEM_SLOT_FORBIDDEN` in `engine-gem-reapp-verdict.js`*

## Reappraisal Stones (Reapp)

Reappraisal stones **reroll all four substats** on a rune.

### In-game restrictions (actual game rules)

- Rune must be powered up to **+12** minimum.
- Works on **any grade and star level** — Rare, Hero, Legend, 1★ through 6★.
- After reroll, player chooses to keep either the **new or original** substats.
- Rune level and power-up state are preserved.
- Innate/prefix stat is **not** affected.

### SW Forge engine filter (not a game rule)

The engine restricts the `Reapp` verdict to **6-star Legend** runes only, plus additional filters:

- Flat innate stats (`ATK`, `DEF`, `HP` as innate) disqualify the rune.
- Rune efficiency must be below a configurable cap (default: 65%).
- Odd slots (1/3/5) can be excluded via settings.
- Set and main-stat filters are configurable.

> Using reapp on non-Legend runes is a waste of resources — hence the engine filter. But it is not a game-level restriction.

*Engine reference: `matchReappRule()` in `engine-gem-reapp-verdict.js`*

## Artifacts

Artifacts occupy two separate equipment slots per monster (separate from the six rune slots).

### Structure

Each artifact has:
- **Element** (Fire / Water / Wind / Light / Dark) or **Archetype** (Attack / Defense / HP / Support) — determines which monsters can equip it
- **Primary effect** — flat stat bonus (ATK, DEF, or HP depending on archetype)
- Up to **4 secondary effects** (substats) — percentage-based special effects, not standard stats

### Secondary effects (substats)

Artifact substats are completely different from rune substats. They are **special skill/battle effects** such as additional damage based on ATK/DEF/HP, counterattack/co-op damage, life drain, conditional critical damage, skill accuracy/recovery bonuses, elemental damage modifiers. All are unique effect IDs — there are no flat HP/ATK/DEF artifact substats.

### Power-ups

- Artifacts are powered up to a maximum of **+15**, same as runes.
- Secondary effects (substats) unlock at power-up levels **+3, +6, +9, +12** if the artifact dropped with fewer than 4 effects.
- Each of the 4 effects can receive up to **4 power-up rolls**.
- The +15 upgrade boosts only the primary (main) stat — no additional substat rolls occur.

### Grindstones and gems

**Artifacts cannot be grinded or gemmed.** Grindstones and enchanted gems only apply to runes.

### Ingame score — ⚠ DISABLED

The artifact ingame score system is partially reverse-engineered but the formula is not confirmed. `artifactIngameScoreBreakdown()` in `js/data/artifact-ingame-score.js` **currently returns null / placeholder**. Do not attempt to fix or call this function until the formula is resolved. See [`ARTIFACT_SCORING_RESEARCH.md`](ARTIFACT_SCORING_RESEARCH.md).

## Ancient Runes, Grindstones, and Gems

Ancient runes drop from Tartarus' Labyrinth. They behave identically to regular runes with the following differences:

- Higher stat ranges (roughly 15–20% higher values than Legend rune equivalents).
- **Ancient grindstones and ancient gems are required** — regular ones cannot be used on Ancient runes.
- Conversely, **ancient grindstones/gems cannot be used on regular runes**.
- **Immemorial Gems** (also from Tartarus) are a special gem variant that can apply to **any rune set**, unlike regular set-specific gems.

SW Forge currently processes Ancient runes through the same engine as regular runes. No ancient-specific threshold profiles exist yet.

## Rune Sets

Sets grant a bonus when the required number of runes are equipped (regardless of which slots).

SW Forge does not currently evaluate set bonuses as part of the verdict engine — runes are scored individually on their stats.

## Engine constants — keep in sync with this document

| Constant / function | File | Must match |
|--------------------|------|-----------|
| `FLAT_SUB_TYPE_IDS` | `engine-gem-reapp-verdict.js` | IDs 1 (HP), 3 (ATK), 5 (DEF) |
| `ALLOWED_STATS` in `checkGrind` | `engine-gem-reapp-verdict.js` | Section 2: only `SPD`, `HP%`, `ATK%`, `DEF%` |
| `GRINDABLE` in gem functions | `engine-gem-reapp-verdict.js` | Valid gem-in targets (section 3) — includes `ACC`, `RES` |
| `GEM_SLOT_FORBIDDEN` | `engine-gem-reapp-verdict.js` | Section 1 slot restrictions |
| `getGrindGainByGrade()` | `engine-gem-reapp-verdict.js` | Engine approximations — not exact game values |
| `matchReappRule()` | `engine-gem-reapp-verdict.js` | SW Forge filter (Legend only) — stricter than game rule |
| `DEFAULT_FORMULAS` | `js/core/defaults.js` | Role archetypes — SW Forge specific, not game mechanics |
