# SW Forge

A **browser-only** rune analyzer for **Summoners War**. Load your **[SWEX](https://github.com/Xzandro/sw-exporter/releases/latest)** JSON export and get **verdicts**, **role fits**, **dashboard stats**, and tunable **rules** — no server upload for the main workflow, no SWOP/CSV step.

The project grew out of a **[community-driven Google Sheet](#google-sheet-alternative)** with the same pipeline mindset (pre-checks → scouting → archetypes → grind/gem/reapp). **This web app is now the primary surface**; the sheet remains a supported alternative if you prefer spreadsheets.

**Live site:** https://sw-forge.pages.dev

---

## Why use the web app vs. a spreadsheet

| | Web app | Classic sheet workflow |
|---|---------|------------------------|
| Data in | **SWEX JSON** directly | SWEX → SWOP → **CSV** import |
| Runtime | Your browser (no account DB) | Google Sheets formulas |
| UX | Dashboard, table, rules panels, guide | Tabs & cells |
| Profiles | Up to **4** saved exports (slots) | Copy / duplicate files |

---

## Features

### Data & privacy

- **SWEX JSON** — drag & drop or file picker; parsing and scoring run **entirely on your device**.
- **Database slots** — store up to **four** exports in **App Settings** and swap the active profile.
- **Clear saved data** — removes stored runes/settings for this origin when you need a clean slate.

### Dashboard

- **Verdict mix** and summary cards — click through to the **Rune Table** with matching filters.
- **Charts** — role / set / slot distributions, efficiency histogram (with median).
- **Global filters** — min level & min grade apply to verdict cards, charts, histogram, and table (not to the progression block).
- **Copy summary** — text snapshot of filters, verdicts, charts, and efficiency stats.
- **Account progression (Depth v2)** — combined score from **Speed Depth**, **Power Depth**, and **Elite Quality**; suggested **Early / Mid / Late** stage with optional **Apply suggestion**.

### Rune Table

- Search, header filters (verdict, role, grade, set, slot, main stat), column sort.
- Substats show **roll + grind** as on the rune; `[n]` in brackets is the **grindstone bonus** only (e.g. `SPD 26 [3]`).
- Optional **Eff over 100%** column (same formula, uncapped — aligns with elite / god-tier comparisons).
- **Dense rows** toggle; **CSV export**; **Target** hints for Gem/Grind when relevant.
- Large matches may **paginate** the grid for speed — **Load all** pulls the full filtered list when needed.
- **Shareable URL** — `#runetable?…` query preserves filters/sort/search on this browser.

### Rune Rules

- **Engine** — eight-stat constants; read-only **God** (Hero/Leg), **High Roll** (stage × grade), and **Duo** (HR × (1 − Duo%), same 8×6 grid as the spreadsheet Engine columns).
- **Verdict** — separate cards for **Gem**, **Grind**, **Reapp** (apply with **Save & Recalculate**).
- **Roles** — six archetype formulas; optional **Require High Roll** checks any sub line against the HR grid; edits save and reprocess continuously.
- Subtabs: **Engine → Roles → Verdict**; last-opened subtab is remembered for the session.

### Guide & Changelog

- **Guide** — onboarding sections (getting started, dashboard, depth, table, rules, tips); EN/RU body where applicable.
- **Changelog** — release notes ship with the build (see also version in the footer).

### Interface

- **Dark** theme by default; light/dark toggle in the header.
- **English / Русский / Français** for UI strings (**App Settings**).
- Centered content width (~1200px); Rune Rules uses the same chrome as Account progression on the Dashboard.

---

## Role archetypes

Thresholds tighten as **account depth** increases (same design goal as the original sheet). The six archetypes:

| Role | Idea |
|------|------|
| **Classic DPS** | SPD + ATK% + CRate + CDmg — standard speedy attackers |
| **Slow DPS** | ATK% + CRate + CDmg — nukers that don’t compete for first turn |
| **Bomber** | ATK% + SPD + ACC — bomb-style attackers |
| **Fast CC** | SPD + ACC (+ bulk where relevant) — fast controllers |
| **Tank** | HP% + DEF% + RES — effective bulk |
| **Bruiser** | Mix of survivability and crit-based damage |

On top of roles:

| Layer | Purpose |
|-------|---------|
| **God Roll** | Rescue when no archetype matched — any sub line (roll + grind) hits the God line (role filter still labeled «High Roll»). |
| **Duo Roll** | Two stats on the rune both meet Duo thresholds (spreadsheet pair list). |
| **Require HR** | In formulas — at least one sub line reaches the High Roll grid for your preset. |
| **Grind / Gem / Reapp** | Optimization verdicts — see the in-app **Guide**. |

---

## Quick start

1. Export your account with **SWEX** (JSON).
2. Open the **[live site](https://sw-forge.pages.dev)** and choose **Load JSON**.
3. Set **Early / Mid / Late** if you want to override the suggestion from Depth v2.
4. Use **Dashboard** for overview, **Rune Table** for row-level review, **Rune Rules** to tune logic.

### Run locally

Static files only — open `index.html` in a browser or serve the repo root:

```bash
# Python 3
python -m http.server 8080
# then open http://localhost:8080
```

### Development workflow

The UI source lives under `js/features/`. `js/ui.js` is a generated artifact for static hosting and should not be edited by hand.

```bash
npm run build:ui
npm run watch:ui
```

1. Edit files in `js/features/**` or `css/**`
2. Run `npm run build:ui`
3. `git push` to `main` → Cloudflare Pages deploys automatically (~1 min)
4. Verify at https://sw-forge.pages.dev

See **`docs/FEATURES.md`** (feature folders), **`docs/PROJECT-CONTEXT.md`**, and **`docs/ARCHITECTURE.md`** for script load order.

**Layout:** `js/core/`, `js/data/`, `js/features/`, `css/foundation/`, `css/features/`. Demo data: `data/demo.json`.

---

## Roadmap

| Feature | Status |
|---------|--------|
| **Share Profile** | Share a read-only link to equipped runes (or full inventory) via Cloudflare Worker + D1 |
| **Rune Efficiency Leaderboard** | Anonymous percentile ranking among SW Forge users |
| **Grind Optimizer** | Client-side devilmon / grind candidate suggestions from loaded SWEX |

---

## Google Sheet alternative

If you prefer the original spreadsheet workflow (SWOP **CSV** → sheet):

**[Open the Google Sheet](https://docs.google.com/spreadsheets/d/1Xq6GlFzHS-_8f_4kHGPmOWq7OZfdcG_ESo7pInKHXrQ/edit?usp=drivesdk)**

1. **File → Make a copy**
2. SWEX → SWOP → Runes → **Export as CSV**
3. In your copy: **Raw Data** → **File → Import → Upload**  
   - Replace current sheet · Separator **Custom** `;` · Convert text to numbers **Yes**

Verdicts appear in **Column S** after import. Changelog lives on a dedicated sheet inside the file.

---

## Pipeline (conceptual)

Each rune passes through staged checks — **upgrade gate** → **bad flats** → **reapp / meta scouting** → **role archetypes** → **God / Duo rescue** → **grind/gem** optimization — ending in **one verdict**. Thresholds use **roll + grind** totals (as on the rune); Grind simulation still starts from the ungrinded base on that line. The web app surfaces this as Dashboard + Table + Rules instead of hidden formulas.

---

## Contributing & feedback

Early public builds benefit from **real exports** and honest feedback (wrong verdicts, UI issues, performance). Issues and PRs welcome.

If you maintain a **super late-game** box and want to help validate **preset bundles** for regression tests, reach out via Issues.

---

## Disclaimer

**Summoners War™** is a trademark of **Com2uS Corp.** This project is **not** affiliated with or endorsed by Com2uS.

Third-party tools (**SWEX**, **SWOP**) are subject to their authors and game terms of use — use at your own discretion.
