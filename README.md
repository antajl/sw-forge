# SW Rune Master

A client-side rune analyzer for Summoners War, powered by your SWEX JSON export.

🔗 **Live site:** https://antajl.github.io/sw-rune-master/

---

## Features

- **Load SWEX JSON** — drag & drop your export file, all processing happens in the browser
- **Dashboard** — role distribution, set/slot breakdown, efficiency histogram, verdict summary
- **Rune Table** — sortable, filterable table with stat chips, roles and verdicts
- **Settings** — Constants-driven thresholds, Duo Roll lines, God Roll line, and per-role filters (substats, must-haves, min stats)

## How to use

1. Export your account with [SWEX](https://github.com/Xzandro/sw-exporter/releases/latest)
2. Open the site and click **Load JSON**
3. Select your stage (Early / Mid / Late)
4. Review your runes on the Dashboard and Rune Table

## Role system

| Role | Key stats |
|---|---|
| Bruiser | SPD + HP% + ATK% + DEF% + CRate |
| Fast CC | SPD + HP%/DEF%/ACC |
| Tank | HP% + DEF% + RES |
| Bomber | ATK% + ACC |
| Classic DPS | SPD + ATK% + CRate + CDmg |
| Slow DPS | ATK% + CRate + CDmg (no SPD) |
| Duo Roll | Synergy pairs (SPD+X, CRate+CDmg, etc.) |
| High Roll | One exceptional stat (God line from Constants) |
