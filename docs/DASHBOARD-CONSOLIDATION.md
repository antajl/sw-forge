# Dashboard consolidation (Gear / Monsters → main Dashboard tab)

> **For AI / IDE:** read this **before** moving dashboard HTML or changing tab navigation.  
> **Goal:** one top-level **Dashboard** tab with **Runes | Monsters** hub; remove Dashboard subtabs from **Gear** and **Monsters**.

## Why a dedicated doc

This migration is easy to break:

1. **Duplicate DOM ids** — today `id="tab-dashboard"` exists on both the main section (`index-shell.html`) and the Gear hub pane (`gear.html`). `getElementById('tab-dashboard')` hits the **section first**, so chart replay and click handlers behave incorrectly while both copies exist.
2. **Three surfaces, one JS** — rune charts (`dashboard.js`, `charts.js`, `stage-filters.js`) were built for Gear → Dashboard; the main Dashboard tab only has stage advisor + a placeholder `#dashboard-charts`.
3. **Hash / storage** — `#dashboard`, `#runes/dashboard`, `#gear`, session keys `swrm_runes_subtab_v1` / monsters subtab must stay compatible or redirect.
4. **Phased deletion** — do **not** remove Gear/Monsters dashboard subtabs until the main tab is verified.

**Rule:** one widget → **one id** in the document. Shared markup → `partials/dashboard/*.html` included from `partials/tabs/dashboard.html`.

---

## Current layout (before)

```
Header tabs
├── Dashboard (#tab-dashboard section)     ← partials/tabs/dashboard.html
│   ├── hub: Runes | Monsters
│   ├── #dashboard-pane-runes            ← INCOMPLETE (hero only, no charts)
│   └── #dashboard-pane-monsters         ← STUB (empty content)
├── Gear (#tab-runes section)            ← partials/tabs/gear.html
│   ├── hub: Dashboard | Table | Rules
│   └── #tab-dashboard (div!)            ← FULL rune + artifact dashboard  ⚠ duplicate id
└── Monsters (#tab-monsters section)
    ├── hub: Dashboard | Roster | …
    └── #tab-monsters-dashboard          ← FULL monsters box overview
```

**Canonical rune dashboard today:** Gear hub → Dashboard subtab (`gear.html` lines ~137–347 + stage advisor above).

---

## Target layout (after)

```
Header tabs
├── Dashboard (#tab-dashboard section)
│   ├── hub: Runes | Monsters
│   ├── #dashboard-pane-runes            ← full copy from old Gear dashboard
│   └── #dashboard-pane-monsters         ← full copy from old Monsters dashboard
├── Gear (#tab-runes section)
│   └── hub: Table | Rules only         ← default subtab: runetable
└── Monsters (#tab-monsters section)
    └── hub: Roster | Skill plan | Teams  ← no Dashboard subtab
```

---

## Phases (do in order)

### Phase 1 — Runes dashboard → `#dashboard-pane-runes`

- [ ] Extract shared HTML to `partials/dashboard/runes-distributions.html` (scope bar + `#panel-dash-distributions` from `gear.html`).
- [ ] Include it in `partials/tabs/dashboard.html` (replace `#dashboard-charts` placeholder).
- [ ] **Remove** dashboard pane + hub tab from `gear.html`; default Gear hub to **Table** (`runetable`).
- [ ] Fix `scheduleDashboardChartReplay()` — visible when main `#tab-dashboard` section is active and `#dashboard-pane-runes` is shown (not Gear hub).
- [ ] Hash redirect: `#runes/dashboard` / `#gear` + stored subtab `dashboard` → open main **Dashboard → Runes** (or `#dashboard` / `#dashboard/runes`).
- [ ] `npm run build:html` + smoke test (stage advisor, scope filters, 5 chart tabs, artifacts toggle, export, chart → table).

### Phase 2 — Monsters dashboard → `#dashboard-pane-monsters`

- [ ] Extract `partials/dashboard/monsters-overview.html` from `monsters.html` (`#tab-monsters-dashboard` inner content).
- [ ] Include in `#dashboard-pane-monsters`; remove stub `#monsters-dashboard-content`.
- [ ] `showDashboardSubtab('monsters')` → call `renderMonstersDashboard()` (mirror `monsters-hub.js`).
- [ ] Smoke test (filters, metrics, composition bars, tiles → roster).

### Phase 3 — Remove hub Dashboard subtabs

- [ ] Remove Dashboard button + pane from `monsters-hub-tabs` / `monsters.html`.
- [ ] Update `MONSTERS_SUBTAB_IDS`, `readStoredMonstersSubtab` default (`roster`), hash `#monsters/dashboard` redirect.
- [ ] Update `RUNES_SUBTAB_IDS` (drop `dashboard`), `readStoredRunesSubtab` default (`runetable`).
- [ ] `language-bindings.js`: labels for removed hub tabs; Guide copy if it says “Gear → Dashboard”.
- [ ] Changelog + Guide panels if player-facing paths change.

### Phase 4 — Cleanup

- [ ] Grep for `tab-dashboard`, `runes-hub-tab-dashboard`, `monsters-hub-tab-dashboard`, `#runes/dashboard`.
- [ ] Optional: nested `@include` support in `tools/build-html.mjs` (already needed for partials under `partials/dashboard/`).

---

## DOM ids — rune dashboard (single instance after Phase 1)

| Block | ids |
|-------|-----|
| Stage advisor | `#stage-advisor`, `#stage-select`, `#dashboard-policy-strictness`, `#btn-auto-stage`, `#metric-val-*` |
| Scope | `#dashboard-account-run-count`, `#global-min-level`, `#global-grade-min/max`, `#btn-dashboard-export-summary` |
| Distributions | `#panel-dash-distributions`, `#dash-dist-kind-tabs`, `#dash-unified-tabs`, `#verdict-chart`, `#role-chart`, `#set-chart`, `#slot-main-cards-root`, `#panel-top-spd`, `#eff-chart`, `#score-chart`, artifact `#dash-art-*` |

**Do not duplicate** these ids in `gear.html` after Phase 1.

---

## DOM ids — monsters dashboard (single instance after Phase 2)

| Block | ids |
|-------|-----|
| Scope | `#dashboard-monsters-count`, `#monsters-dashboard-min-level`, `#monsters-dashboard-stars-min/max`, `#monsters-dashboard-nat-min/max`, `#btn-monsters-dashboard-copy-summary` |
| Overview | `#monsters-box-overview`, `#monsters-metric-val-*`, `#monsters-composition-*`, `#monsters-rune-slots-chart`, `#monsters-skill-priorities-list`, `#monsters-box-overview-tiles` |

---

## JS files (logic stays split; DOM must be single)

| Area | Files |
|------|-------|
| Runes render | `js/features/runes/dashboard.js`, `charts.js`, `stage-filters.js`, `stage-advisor-ui.js`, `depth.js` |
| Artifacts on rune dash | `js/features/gear/dashboard-artifacts.js` |
| Monsters render | `js/features/monsters/box-overview.js` |
| Navigation | `js/features/shell/theme-nav.js`, `main-tabs.js` |
| Labels | `js/features/shell/language-bindings.js` |

After `js/features/*` edits: `npm run build:ui`. After partials: `npm run build:html`.

---

## Hash / storage migration

| Old | New |
|-----|-----|
| `#gear` (default dashboard) | `#dashboard` or `#dashboard/runes` |
| `#runes/dashboard` | `#dashboard` (main tab, runes pane) |
| `#runes/runetable` | `#gear` or `#runes/runetable` (unchanged) |
| `#monsters/dashboard` | `#dashboard/monsters` |
| `swrm_runes_subtab_v1=dashboard` | redirect once to main dashboard |

---

## Test checklist

**Runes (main Dashboard → Runes)**

- [ ] Stage advisor expand/collapse, Apply suggestion, Early/Mid/Late, Strictness
- [ ] Min level + grade range filters refresh charts
- [ ] Breakdown / Slot / Score tabs; Runes / Artifacts kind toggle
- [ ] Click verdict / role / set / slot → Rune Table with filters
- [ ] Copy summary button
- [ ] FR/RU labels via language switch

**Monsters (main Dashboard → Monsters)**

- [ ] Star / nat / min level filters
- [ ] Metric cards and composition bars
- [ ] Attention tiles → roster filters
- [ ] Copy summary

**Regression**

- [ ] Gear → Table and Rules still work
- [ ] Monsters → Roster default, no empty Dashboard subtab
- [ ] Share read-only mode tab restrictions unchanged

---

## Related docs

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — build pipeline  
- [`FILE-MAP.md`](FILE-MAP.md) — update after partials move  
- [`README.md`](README.md) — docs index  
- Player Guide `#tab-guide` — update paths after Phase 3
