# SW Forge — Game Overview

> **For AI agents:** Read this before analyzing design screenshots or proposing UI changes.
> Provides context about Summoners War game mechanics and how SW Forge fits into the game ecosystem.

---

## What is Summoners War?

Summoners War is a mobile RPG game where players collect monsters, equip them with runes and artifacts, and build teams for various game modes (Raid, Arena, Guild War, etc.).

### Core Progression Systems

**Monsters:**
- 1★ to 6★ rarity (6★ is max)
- Elements: Fire, Water, Wind, Light, Dark
- Each monster has skills (1-4 active skills)
- Monsters can be awakened to get better skills and element changes

**Runes:**
- 6 rune slots per monster
- Runes provide stats (HP, ATK, DEF, SPD, CRate, CDmg, ACC, RES)
- Rune sets grant bonuses when equipped (e.g., 2 Swift = +25% SPD)
- Runes can be powered up to +15
- Runes have grades: Rare, Hero, Legend

**Artifacts:**
- 2 artifact slots per monster (separate from runes)
- Provide special effects (not just stats)
- Can be powered up to +15
- Have element/archetype restrictions

---

## How SW Forge Fits In

SW Forge is a rune and gear analysis tool that helps players:

1. **Import SWEX data** — Export from Summoners War Exporter (community tool)
2. **Analyze rune quality** — Calculate efficiency, identify good rolls
3. **Get verdicts** — Keep/Sell/Grind/Gem/Reapp recommendations
4. **Build teams** — View monsters with equipped runes
5. **Track progress** — Account depth metrics (SPD depth, elite quality, roster depth)

### User Workflow

1. Player exports data from Summoners War Exporter (SWEX)
2. Player pastes JSON into SW Forge or uses demo data
3. SW Forge parses runes, artifacts, monsters
4. Player views:
   - **Rune Table** — All runes with stats, efficiency, verdicts
   - **Dashboard** — Account progression metrics
   - **Monsters** — Monster roster with equipped gear
   - **Teams** — Team builder with SPD calculations
   - **Guide** — How scoring works

---

## Rune Mechanics (Game Context)

### Why Runes Matter

Runes are the primary progression system. A good rune can make a weak monster strong. Players spend months grinding for good runes.

### Rune Stats

**Primary stats (main stat):**
- Fixed based on slot (e.g., slot 1 always has ATK flat)
- Determines the rune's main purpose

**Secondary stats (substats):**
- 4 substats that roll at +3, +6, +9, +12
- Can be grinded (boosted) or replaced with gems
- Quality varies wildly — same rune can be amazing or terrible based on rolls

**Efficiency:**
- Measures how close substats are to maximum possible rolls
- Higher efficiency = better rune
- SW Forge calculates efficiency using SWOP formula

### Rune Verdicts (SW Forge Recommendations)

**Keep** — Rune is good, worth keeping
**Sell** — Rune is bad, sell for mana
**Grind** — Apply grindstone to boost a substat
**Gem** — Replace a bad substat with a gem
**Reapp** — Use Reappraisal Stone to reroll substats (Legend only)
**Finish** — Rune is near-perfect, no more upgrades needed
**Upgrade** — Power up the rune further

### Rune Sets

Examples:
- **Swift (2)** — +25% SPD
- **Violent (4)** — 22% chance to get extra turn
- **Fatal (4)** — +35% ATK
- **Energy (2)** — +15% HP
- **Blade (2)** — +12% CRIT DMG

Set bonuses are critical for team composition.

---

## Artifact Mechanics (Game Context)

### What Are Artifacts

Artifacts are a newer progression system (added in 2020). They provide special effects that can dramatically change monster performance.

### Artifact Structure

- **Primary stat** — Flat HP/ATK/DEF bonus
- **Secondary effects** — 4 special effects (e.g., "Additional damage by 15% of HP")
- **Element/Archetype** — Determines which monsters can equip

### Artifact Verdicts

Similar to runes: Keep/Sell based on quality and synergy with monster roles.

---

## Monster Mechanics (Game Context)

### Monster Stats

- **HP** — Health points
- **ATK** — Attack power
- **DEF** — Defense
- **SPD** — Speed (turn order — critical)
- **CRate** — Critical hit chance
- **CDmg** — Critical damage
- **ACC** — Accuracy (debuff land rate)
- **RES** — Resistance (debuff avoid rate)

### Monster Roles

**Speedster** — High SPD, goes first (e.g., Lushen, Theo)
**Bruiser** — High ATK/DEF, sustained damage
**Tank** — High HP/DEF, survives hits
**Nuker** — High ATK/CDmg, burst damage
**Support** — Buffs/debuffs, utility

### Teams

Players build teams of 4-5 monsters for specific content:
- **RTA** — Real-time Arena (PvP)
- **Arena** — Turn-based PvP
- **Guild War** — Guild vs Guild
- **Raid** — PvE boss fights
- **ToA** — Tower of Ascension (PvE)

Team composition depends on:
- SPD order (who goes first)
- Synergy (buffs/debuffs)
- Set bonuses
- Element advantage (Fire > Wind > Water > Fire)

---

## SW Forge UI Concepts

### Rune Table

Shows all runes with:
- Stats (main + substats)
- Efficiency percentage
- Verdict (Keep/Sell/etc.)
- Set icon
- Grade (Legend/Hero/Rare)
- Slot number

Filters allow finding specific runes (e.g., "SPD main, slot 2, Swift set").

### Dashboard

Shows account progression:
- **SPD Depth** — How many monsters have good SPD runes
- **Power Depth** — How many monsters have good +15 runes
- **Elite Quality** — Average efficiency of best runes
- **Roster Depth** — How many built monsters (6★ level 40, 6 runes +15)

### Monsters Tab

Shows monster roster with:
- Equipped runes (click to view details)
- Stats (with rune bonuses)
- Skills
- Element and awakening status

### Teams Tab

Team builder with:
- SPD order calculation
- Set bonus tracking
- Stat totals for the team

---

## Key Terms for AI

**SWEX** — Summoners War Exporter (community tool to export game data)
**Efficiency** — How close rune substats are to max rolls (0-100%)
**Verdict** — AI recommendation for rune (Keep/Sell/Grind/Gem)
**Depth** — Account progression metric (how many good runes/monsters)
**+15** — Rune powered up to maximum level
**Ancient** — Higher-tier runes from Tartarus' Labyrinth
**Grindstone** — Item to boost existing substat value
**Gem** — Item to replace one substat with different stat
**Reapp** — Reappraisal Stone to reroll all substats
**SPD** — Speed (most important stat in game)
**CRate/CDmg** — Critical Rate/Damage (damage scaling)
**ACC/RES** — Accuracy/Resistance (debuff mechanics)

---

## Design Context for AI

When analyzing screenshots, understand:

1. **Information density** — Rune tables show 10+ data points per row
2. **Color coding** — Verdicts use colors (green=Keep, red=Sell, orange=Grind)
3. **Filters are critical** — Players filter by set, slot, main stat, verdict
4. **Efficiency is key metric** — Primary quality indicator
5. **SPD is king** — Speed stat is most important in game
6. **Mobile-first** — UI designed for mobile screens
7. **Dark theme default** — Most players use dark mode

---

## Related Documentation

- [02-GAME-KNOWLEDGE.md](02-GAME-KNOWLEDGE.md) — Technical rules for engine logic
- [00-MASTER.md](00-MASTER.md) — Project overview and build system
- [03-PROJECT-STRUCTURE.md](03-PROJECT-STRUCTURE.md) — File structure
- [04-API-REFERENCE.md](04-API-REFERENCE.md) — API reference
