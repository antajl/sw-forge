# Artifact Scoring Research

**Date:** May 28, 2026
**Status:** Incomplete - Formula disabled due to inaccuracies

## Summary

Artifact ingame score and forge score calculations have been **disabled** because the game uses a complex roll-based system that is not fully documented in public sources. The simple percentage-based formula (`Σ (value/max)*100`) does not match the actual game scores.

## What We Know (Confirmed)

### Official Formula Statement
From patch v8.3.4: "Sub Property values are calculated based on the maximum value that can be added to the Rune/Artifact from power-ups."

This suggests the formula should be `Σ (value_i / max_i) * 100`, but this does not match actual game scores.

### Roll-Based System
The game uses a **roll-based upgrade system**:
- Artifacts receive up to 5 upgrades (at +4, +8, +12, +16, +20)
- If an artifact drops with 3 substats, the first upgrade adds a 4th substat
- Maximum rolls per substat is 4 (not 5)
- Each effect type has specific roll values (not linear)

### Game UI Format
When clicking on the artifact score in-game, the breakdown shows:
```
Defense Artifact DEF [+]
Current Amount: 57
* **1** Counterattack/Co-op Attack DMG +7% (3/9)
* **2** Life Drain +20% (1/4)
* **1** ATK/DEF UP Effect +10% (3/11)
* **0** Add'l DMG by 3% of DEF (13/16)
175 (2/57)
```

Where:
- Number on left (1, 2, 1, 0) = number of rolls into that substat
- Numbers in parentheses (3/9, 1/4, etc.) = current roll value / maximum roll value
- Current Amount: 57 = some base quality metric
- Final score: 175 (2/57) = actual score with rank

## What We Know (Hypothesized)

### Roll Value Tables
Based on real artifact examples, roll values appear to be:

| Effect | Type ID | Hypothesized Rolls |
|--------|---------|-------------------|
| Damage Dealt on Element | 300-304 | 2, 4, 6, 9 |
| Damage Received from Element | 305-309 | 2, 4, 6, 9 |
| Own turn 1-target CD | 224 | 2, 4, 6, 8 |
| CD+ (good HP) | 222 | 4, 6, 8, 9? |
| CD+ (bad HP) | 223 | 1, 20, 40, 60? (anomalous case) |
| Add'l DMG by ATK | 219 | 1, 4, 7, 11 |
| Skill Accuracy | 407-409 | 4, 5, 7, 10? (max varies by skill) |
| Add'l DMG by HP | 218 | 1, 4, 7, 10 |
| Skill Recovery | 404-406 | 4, 7, 8? |
| Bomb DMG | 210 | 2, 4, 5? |
| Add'l DMG by DEF | 220 | 3, 7, 10, 13, 16? (5 values?) |
| Counterattack/Co-op | 225 | 3, 5, 7, 9 |
| Life Drain | 215 | 1, 2, 3, 4 |
| ATK/DEF UP | 226 | 3, 5, 8, 11 |

**Note:** These are extrapolated from limited examples. More data needed for confirmation.

### Scoring Formula Hypothesis
The scoring likely involves:
1. Roll quality assessment (current roll value / max roll value)
2. Roll count weighting (more rolls = higher score)
3. Current Amount calculation (some function of roll quality)
4. Final score transformation (Current Amount → Score)

The exact formula is unknown.

## What We Tried

### Attempt 1: Simple Percentage Formula
**Formula:** `Σ (value/max)*100`
**Result:** Scores did not match game values (e.g., calculated 245 vs game 175)

### Attempt 2: Official Max Values from Spokland
**Source:** Spokland v8.0.0+ (community-verified)
**Result:** Max values did not match actual game roll maximums (e.g., Life Drain max 15% vs game max 4%)

### Attempt 3: Reddit Formula
**Source:** Reddit post about rune/artifact score comparison
**Formula:** Complex division by star tiers (20, 25, 30) and special weights
**Result:** Did not match game scores

## Data Sources

### Publicly Available
- Official patch notes v8.3.4 (formula statement only)
- Spokland v8.0.0+ (max values - inaccurate for current game version)
- Ellia's Wiki (detailed effect descriptions)
- Reddit posts (various formulas - none confirmed accurate)

### User-Provided Examples
Real artifact breakdowns from game UI with:
- Roll counts
- Current roll values / maximum roll values
- Current Amount
- Final game scores

## What's Needed for Solution

1. **Complete roll value tables** for all effect types (need max roll artifacts)
2. **Current Amount calculation formula** (how roll quality → Current Amount)
3. **Final score transformation** (how Current Amount → Score)
4. **Effect type variations** (some effects have different maxes based on context)

## Current State

- **Ingame score calculation:** DISABLED (returns null)
- **Forge score calculation:** DISABLED (returns null)
- **Breakdown function:** Still available but returns placeholder message

## Files Modified

- `js/data/artifact-ingame-score.js` - Disabled score calculations
- `js/data/gear/parse.js` - Fixed ARTIFACT_ELEMENT mapping (Water/Fire swap)
- `js/data/gear/parse.js` - Fixed ARTIFACT_ARCHETYPE mapping (Attack/Defense/HP/Support order)

## Next Steps (When Returning to This)

1. Collect more artifact examples with max roll values (4 rolls into one effect)
2. Community crowdsourcing of roll value tables
3. Reverse-engineer Current Amount → Score formula from more examples
4. Implement roll-based scoring system once formula is confirmed

## References

- Patch v8.3.4 official notes
- Spokland v8.0.0+ (https://spokland.com)
- Ellia's Wiki (https://elliabot.neocities.org/game_mechanics/artifacts/)
- SWEX artifact efficiency plugin (https://github.com/cooye/swex-artifact-efficiency)
