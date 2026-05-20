// js/core/defaults.js — part of core load chain
// ---- THRESHOLDS ----
// Structure: { Early_Leg, Early_Hero, Mid_Leg, Mid_Hero, Late_Leg, Late_Hero }
const DEFAULT_THRESHOLDS = {
  SPD:   { Early_Leg:14, Early_Hero:10, Mid_Leg:17, Mid_Hero:15, Late_Leg:21, Late_Hero:18 },
  'HP%': { Early_Leg:18, Early_Hero:14, Mid_Leg:21, Mid_Hero:20, Late_Leg:25, Late_Hero:24 },
  'DEF%':{ Early_Leg:18, Early_Hero:14, Mid_Leg:21, Mid_Hero:20, Late_Leg:25, Late_Hero:24 },
  'ATK%':{ Early_Leg:16, Early_Hero:12, Mid_Leg:18, Mid_Hero:17, Late_Leg:23, Late_Hero:21 },
  CRate: { Early_Leg:11, Early_Hero:8,  Mid_Leg:14, Mid_Hero:13, Late_Leg:17, Late_Hero:16 },
  CDmg:  { Early_Leg:14, Early_Hero:10, Mid_Leg:17, Mid_Hero:16, Late_Leg:21, Late_Hero:20 },
  ACC:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
  RES:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
};

// Legacy flat grids (used only to seed defaults / migration into statConstants).
const DEFAULT_HR_THRESHOLDS = DEFAULT_THRESHOLDS;

const DEFAULT_DUO_THRESHOLDS = {
  SPD_min:       { Early_Leg:10, Early_Hero:8,  Mid_Leg:13, Mid_Hero:12, Late_Leg:15, Late_Hero:12 },
  SPD_partner:   { Early_Leg:12, Early_Hero:11, Mid_Leg:18, Mid_Hero:14, Late_Leg:18, Late_Hero:16 },
  CRate_for_CDmg:{ Early_Leg:10, Early_Hero:8,  Mid_Leg:12, Mid_Hero:10, Late_Leg:14, Late_Hero:10 },
  CDmg_for_CRate:{ Early_Leg:12, Early_Hero:9,  Mid_Leg:15, Mid_Hero:12, Late_Leg:17, Late_Hero:14 },
  CRate_for_ATK: { Early_Leg:10, Early_Hero:8,  Mid_Leg:12, Mid_Hero:10, Late_Leg:14, Late_Hero:10 },
  ATK_for_CRate: { Early_Leg:14, Early_Hero:14, Mid_Leg:14, Mid_Hero:14, Late_Leg:14, Late_Hero:14 },
  HP_for_DEF:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  DEF_for_HP:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  DEF_for_RES:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  RES_for_DEF:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  HP_for_RES:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  RES_for_HP:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  HP_for_CDmg:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  CDmg_for_HP:   { Early_Leg:12, Early_Hero:9,  Mid_Leg:15, Mid_Hero:12, Late_Leg:17, Late_Hero:14 },
  HP_for_ACC:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  ACC_for_HP:    { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
  DEF_for_ACC:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  ACC_for_DEF:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
};

/** Stat order for the Constants table (8 substats). */
const GOD_STAT_ORDER = ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'];
const HR_COL_KEYS = ['Early_Leg', 'Early_Hero', 'Mid_Leg', 'Mid_Hero', 'Late_Leg', 'Late_Hero'];

function roundThresh(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

/**
 * Stage+grade High Roll threshold cell from Constants:
 * Mid_Hero = Base; Mid_Leg = Base×(1−Grade_Mod);
 * Early_Hero = Base×(1−Early_Discount); Late_Hero = Base×(1+Late_Tougher);
 * Early/Legend and Late/Legend = Hero cell × (1−Grade_Mod).
 */
function stageHrValue(statRow, colKey) {
  const base = Number(statRow.base);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const earlyDiscount = Number.isFinite(Number(statRow.earlyScale)) ? Number(statRow.earlyScale) : 0;
  const lateTougher = Number.isFinite(Number(statRow.lateScale)) ? Number(statRow.lateScale) : 0;
  const gradeMod = Number.isFinite(Number(statRow.gradeMod)) ? Number(statRow.gradeMod) : 0;
  const leg = colKey.indexOf('_Leg') !== -1;
  const heroFactor = leg ? (1 - gradeMod) : 1;
  if (colKey.startsWith('Early')) return base * (1 - earlyDiscount) * heroFactor;
  if (colKey.startsWith('Mid')) return (leg ? base * (1 - gradeMod) : base);
  if (colKey.startsWith('Late')) return base * (1 + lateTougher) * heroFactor;
  return base;
}

/**
 * Defaults aligned with master Constants sheet (base + God/Duo mods + stage/grade scales).
 * HR/Duo threshold grids are derived — do not duplicate numbers here and in DEFAULT_THRESHOLDS manually.
 */
const EXPLICIT_DEFAULT_STAT_CONSTANTS = {
  SPD:    { base: 16, godMod: 0.25, duoMod: 0.15, earlyScale: 0.20, lateScale: 0.30, gradeMod: 0.05 },
  'HP%':  { base: 20, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  'DEF%': { base: 20, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  'ATK%': { base: 17, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  CRate:  { base: 13, godMod: 0.25, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.05 },
  CDmg:   { base: 16, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  ACC:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.10 },
  RES:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.10 },
};

function defaultStatConstants() {
  const out = {};
  for (const stat of GOD_STAT_ORDER) {
    const row = EXPLICIT_DEFAULT_STAT_CONSTANTS[stat];
    out[stat] = {
      base: row.base,
      godMod: row.godMod,
      duoMod: row.duoMod,
      earlyScale: row.earlyScale,
      lateScale: row.lateScale,
      gradeMod: row.gradeMod,
    };
  }
  return out;
}

function inferDuoModFromLegacy(stat, hrRow, duo, colKey) {
  const hr = Number(hrRow[colKey]);
  if (!Number.isFinite(hr) || hr <= 0) return 0;
  const d = (pairRow) => {
    const v = Number(pairRow && pairRow[colKey]);
    if (!Number.isFinite(v) || v <= 0) return null;
    return 1 - v / hr;
  };
  const vals = [];
  if (stat === 'SPD') {
    const x = d(duo.SPD_min);
    if (x != null) vals.push(x);
  }
  if (stat === 'HP%') {
    [d(duo.HP_for_DEF), d(duo.HP_for_RES)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (stat === 'DEF%') {
    [d(duo.DEF_for_HP), d(duo.DEF_for_RES)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (stat === 'ATK%') {
    const x = d(duo.ATK_for_CRate);
    if (x != null) vals.push(x);
  }
  if (stat === 'CRate') {
    [d(duo.CRate_for_CDmg), d(duo.CRate_for_ATK)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (stat === 'CDmg') {
    const x = d(duo.CDmg_for_CRate);
    if (x != null) vals.push(x);
  }
  if (stat === 'RES') {
    [d(duo.RES_for_DEF), d(duo.RES_for_HP)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (!vals.length) return 0;
  let s = 0;
  for (let i = 0; i < vals.length; i++) s += vals[i];
  const avg = s / vals.length;
  return Number.isFinite(avg) ? Math.round(avg * 10000) / 10000 : 0;
}

function mergeStatConstants(saved) {
  const d = JSON.parse(JSON.stringify(defaultStatConstants()));
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return d;
  for (const stat of GOD_STAT_ORDER) {
    const src = saved[stat];
    if (!src || typeof src !== 'object') continue;
    const keys = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (src[key] == null) continue;
      const n = Number(src[key]);
      if (Number.isFinite(n)) d[stat][key] = n;
    }
  }
  return d;
}

/** Migrate legacy godConstants { base, godMod } into statConstants row. */
function applyGodConstantsToStatConstants(sc, god) {
  if (!god || typeof god !== 'object') return;
  for (const stat of GOD_STAT_ORDER) {
    const g = god[stat];
    if (!g || typeof g !== 'object') continue;
    if (g.base != null && Number.isFinite(Number(g.base))) sc[stat].base = Number(g.base);
    if (g.godMod != null && Number.isFinite(Number(g.godMod))) sc[stat].godMod = Number(g.godMod);
  }
}

function inferStatConstantsFromLegacyHrDuo(hr, duo, god) {
  const sc = {};
  for (const stat of GOD_STAT_ORDER) {
    const row = hr[stat] || {};
    const base = Number(row.Mid_Hero) || 0;
    const eh = Number(row.Early_Hero);
    const lh = Number(row.Late_Hero);
    const ml = Number(row.Mid_Leg);
    const earlyScale = base > 0 && Number.isFinite(eh) ? (1 - (eh / base)) : 0;
    const lateScale = base > 0 && Number.isFinite(lh) ? ((lh / base) - 1) : 0;
    const gradeMod = base > 0 && Number.isFinite(ml) ? 1 - ml / base : 0;
    sc[stat] = {
      base,
      godMod: 0.12,
      duoMod: duo ? inferDuoModFromLegacy(stat, row, duo, 'Mid_Hero') : 0,
      earlyScale,
      lateScale,
      gradeMod,
    };
  }
  applyGodConstantsToStatConstants(sc, god);
  return mergeStatConstants(sc);
}

function computeHrThresholds(statConstants) {
  const out = {};
  for (const stat of GOD_STAT_ORDER) {
    const row = statConstants[stat];
    out[stat] = {};
    for (let i = 0; i < HR_COL_KEYS.length; i++) {
      const col = HR_COL_KEYS[i];
      out[stat][col] = roundThresh(stageHrValue(row, col));
    }
  }
  return out;
}

/** Duo line = stage HR for that stat × (1 − Duo_Mod). */
function duoLineForStat(stat, colKey, hrTable, statConstants) {
  const hr = Number(hrTable[stat]?.[colKey]);
  if (!Number.isFinite(hr) || hr <= 0) return 0;
  const dm = Number(statConstants[stat]?.duoMod);
  const d = Number.isFinite(dm) ? dm : 0;
  return roundThresh(hr * (1 - d));
}

/**
 * Duo thresholds per stat (Engine K:R): ROUND(HR × (1 − Duo_Mod), 0) for each stage×grade.
 * Same 8×6 layout as hrThresholds.
 */
function computeDuoThresholds(statConstants, hrTable) {
  const out = {};
  for (const stat of GOD_STAT_ORDER) {
    out[stat] = {};
    for (let i = 0; i < HR_COL_KEYS.length; i++) {
      const col = HR_COL_KEYS[i];
      const raw = duoLineForStat(stat, col, hrTable, statConstants);
      out[stat][col] = Number.isFinite(raw) ? Math.round(raw) : 0;
    }
  }
  return out;
}

/**
 * God threshold by grade:
 * Hero/Rare: base × (1 + godMod)
 * Legend:    base × (1 - gradeMod) × (1 + godMod)
 */
function getGodThreshold(stat, settings, gradeStr) {
  const row = settings?.statConstants?.[stat];
  if (!row || row.base == null) return null;
  const base = Number(row.base);
  if (!Number.isFinite(base) || base <= 0) return null;
  const mod = Number.isFinite(Number(row.godMod)) ? Number(row.godMod) : 0;
  const gradeMod = Number.isFinite(Number(row.gradeMod)) ? Number(row.gradeMod) : 0;
  const isLegend = gradeStr === 'Legend';
  const baseByGrade = isLegend ? base * (1 - gradeMod) : base;
  return baseByGrade * (1 + mod);
}

/** godConstants mirror for legacy readers — derived from statConstants. */
function godConstantsFromStatConstants(statConstants) {
  const o = {};
  for (const stat of GOD_STAT_ORDER) {
    const r = statConstants[stat];
    o[stat] = { base: r.base, godMod: r.godMod };
  }
  return o;
}

const DEFAULT_STAT_CONSTANTS = defaultStatConstants();
const DEFAULT_GOD_CONSTANTS = godConstantsFromStatConstants(DEFAULT_STAT_CONSTANTS);

function mergeGodConstants(saved) {
  if (!saved || typeof saved !== 'object') return godConstantsFromStatConstants(DEFAULT_STAT_CONSTANTS);
  const sc = JSON.parse(JSON.stringify(DEFAULT_STAT_CONSTANTS));
  applyGodConstantsToStatConstants(sc, saved);
  return godConstantsFromStatConstants(sc);
}

// ---- ADVANCED FORMULA SYSTEM ----
// Canonical role rules for the six archetypes (Classic DPS, Slow DPS, Bomber, Fast CC, Tank, Bruiser).
// Keep in sync with the project spreadsheet: acceptedMains, substats Include/Exclude, mustHave,
// slotRequirements, minStats per slot tier, requireHR. Legacy DEFAULT_ROLES mirrors rough parity for migration only.
const DEFAULT_FORMULAS = {
  'Classic DPS': {
    enabled: true,
    acceptedMains: { 2: 'SPD, ATK%', 4: 'ATK%, CDmg, CRate', 6: 'ATK%' },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
      CRate: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CDmg: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' },
    },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 3 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } },
  },
  'Slow DPS': {
    enabled: true,
    acceptedMains: { 2: 'ATK%', 4: 'ATK%, CDmg, CRate', 6: 'ATK%' },
    substats: {
      SPD: { Early: 'None', Mid: 'None', Late: 'None' },
      'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
      CRate: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CDmg: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'None', Mid: 'None', Late: 'None' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Bomber': {
    enabled: true,
    acceptedMains: { 2: 'SPD, ATK%', 4: 'ATK%', 6: 'ATK%, ACC' },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'None', Mid: 'None', Late: 'None' } },
    minStats: {
      '1/3/5': { Early: 1, Mid: 2, Late: 2 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 },
    },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: true, Late: true } }
  },
'Fast CC': {
    enabled: true,
    acceptedMains: { 2: 'SPD, HP%, DEF%', 4: 'HP%, DEF%', 6: 'ACC, HP%, DEF%' },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' },
    },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: {
      2: { Early: 'ACC', Mid: 'ACC', Late: 'ACC' },
      4: { Early: 'ACC', Mid: 'ACC', Late: 'ACC' },
      6: { Early: 'ACC', Mid: 'ACC', Late: 'ACC' },
    },
    minStats: {
      '135': { Early: 2, Mid: 2, Late: 2 },
      '2': { Early: 1, Mid: 1, Late: 2 },
      '4': { Early: 1, Mid: 1, Late: 2 },
      '6': { Early: 1, Mid: 1, Late: 2 },
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: true, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: true },
    },
  },
  'Tank': {
    enabled: true,
    acceptedMains: { 2: 'SPD, HP%, DEF%', 4: 'HP%, DEF%', 6: 'HP%, DEF%, RES' },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'Include', Mid: 'Include', Late: 'Include' }
    },
    mustHave: { Early: 'RES', Mid: 'RES', Late: 'RES' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'HP%', Mid: 'HP%', Late: 'HP%' }, 6: { Early: 'RES', Mid: 'RES', Late: 'RES' } },
    minStats: { '1/3/5': { Early: 2, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 1 }, 'Slot 4': { Early: 1, Mid: 1, Late: 1 }, 'Slot 6': { Early: 1, Mid: 1, Late: 1 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Bruiser': {
    enabled: true,
    acceptedMains: { 2: 'SPD, HP%, ATK%, DEF%', 4: 'HP%, ATK%, DEF%, CRate, CDmg', 6: 'ATK%, HP%, DEF%' },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CDmg: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' },
    },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'HP%', Mid: 'HP%', Late: 'HP%' } },
    minStats: {
      '135': { Early: 2, Mid: 2, Late: 3 },
      '2': { Early: 2, Mid: 2, Late: 3 },
      '4': { Early: 2, Mid: 2, Late: 3 },
      '6': { Early: 2, Mid: 2, Late: 3 },
    },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: true, Late: true } },
  },
};

/** UI row labels → minStats key preference (sheet-style numeric/alternate keys vs legacy slot labels). */
const FORMULA_MINSTAT_KEY_GROUPS = {
  '1/3/5': ['135', '1/3/5'],
  'Slot 2': ['2', 'Slot 2'],
  'Slot 4': ['4', 'Slot 4'],
  'Slot 6': ['6', 'Slot 6'],
};

function readFormulaMinStat(ms, uiSlotType, stage) {
  const keys = FORMULA_MINSTAT_KEY_GROUPS[uiSlotType] || [uiSlotType];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const raw = ms?.[k]?.[stage];
    if (raw != null && raw !== '') return Number(raw);
  }
  return 1;
}

function formulaMinStatWriteKey(ms, uiSlotType) {
  const keys = FORMULA_MINSTAT_KEY_GROUPS[uiSlotType] || [uiSlotType];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (ms && typeof ms[k] === 'object' && ms[k] !== null) return k;
  }
  return keys[keys.length - 1];
}

function readFormulaMinStatForRuneSlot(ms, runeSlot, stage) {
  const uiSlotType = [1, 3, 5].includes(runeSlot) ? '1/3/5' : `Slot ${runeSlot}`;
  return readFormulaMinStat(ms, uiSlotType, stage);
}

const DEFAULT_ROLE_PRIORITY = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Duo Roll', 'God Roll'];

// ---- LEGACY ROLE DEFINITIONS (for backward compatibility) ----
// Include/Exclude/None; mustHave per stage; acceptedMains per slot; minStats per slot
const DEFAULT_ROLES = {
  'Classic DPS': {
    substats: { SPD:'Include', 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2: ['SPD', 'ATK%'], 4: ['CRate', 'CDmg'], 6: ['ATK%'] },
    minStats: { Early:1, Mid:2, Late:3 },
    requireHR: { Early_Hero:false, Mid_Hero:true, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Slow DPS': {
    substats: { 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                SPD:'None', 'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    acceptedMains: { 2:['ATK%'], 4:['HP%','ATK%','DEF%'], 6:['ATK%','HP%','DEF%'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:false },
  },
  'Bomber': {
    substats: { SPD:'Include', 'ATK%':'Include', ACC:'Include',
                CRate:'None', CDmg:'None', 'HP%':'None', 'DEF%':'None', RES:'None' },
    mustHave: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
    acceptedMains: { 2:['SPD','ATK%'], 4:['HP%','ATK%','DEF%'], 6:['ATK%','HP%','ACC'] },
    minStats: { Early:1, Mid:1, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:false, Early_Leg:false, Mid_Leg:false, Late_Leg:false },
  },
  'Fast CC': {
    substats: { SPD:'Include', 'HP%':'Include', 'DEF%':'Include', ACC:'Include',
                'ATK%':'None', CRate:'None', CDmg:'None', RES:'None' },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD','HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','ACC'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Tank': {
    substats: { 'HP%':'Include', 'DEF%':'Include', RES:'Include', SPD:'Include',
                'ATK%':'None', CRate:'None', CDmg:'None', ACC:'None' },
    mustHave: { Early: 'RES', Mid: 'RES', Late: 'RES' },
    acceptedMains: { 2:['SPD','HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','RES'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Bruiser': {
    substats: { SPD:'Include', 'HP%':'Include', 'ATK%':'Include', 'DEF%':'Include',
                CRate:'Include', CDmg:'Include', ACC:'None', RES:'None' },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    acceptedMains: { 2:['SPD','HP%','ATK%'], 4:['HP%','ATK%','DEF%'], 6:['DEF%','HP%','ATK%'] },
    minStats: { Early:2, Mid:3, Late:3 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
};

const DEFAULT_REAPP = {
  maxEff: 75,
  sets: ['Swift', 'Violent', 'Rage', 'Will'],
  innateStats: ['SPD', 'HP%', 'ATK%', 'DEF%'],
  mainBySlot: {
    2: ['SPD'],
    4: ['CDmg'],
    6: ['ATK%', 'HP%']
  }
};

// Grind recommendation: always targets Late×grade High Roll line (same hrThresholds as role anchors).
// gap: allowed distance multiplier (threshold - current <= gain * gap)
const DEFAULT_GRIND = {
  /** Stricter default: only subs within (gain × gap) of Late HR count. 0.5 ≈ half a grind window. */
  gap: 0.5,
};

// ---- GEM — Enchant Gem is sub-only (bad-flat pattern → grindable % target).
const DEFAULT_GEM_META = {
  /** Substat bad-flat Gem path — only Gem engine this build supports */
  legacyFlatSubGem: true,
  /** Min exporter/calc Eff (Hero branch uses heroMin when not Duo/God Roll) — tune to match spreadsheets */
  qualityGate: {
    early: { min: 40, heroMin: 52 },
    mid: { min: 55, heroMin: 67 },
    late: { min: 70, heroMin: 82 },
  },
};

const DEFAULT_EVAL_POLICY = {
  preset: 'Mid Progression',
  anchorMode: 'hard',          // hard | soft
  slotRequirementMode: 'hard', // hard | soft
  minStatsModifier: 0,         // -1 | 0 | +1
  minRolePressure: 0.0,        // 0..1 required role pressure floor (0 = disabled)
  rolePressureByRole: {
    'Fast CC': 0.50,
    Bomber: 0.50,
    'Classic DPS': 0.52,
    'Slow DPS': 0.55,
    Bruiser: 0.42,
    Tank: 0.35,
  },
  minUsefulSubsByRole: {
    'Fast CC': 2,
    Bruiser: 2,
    Tank: 2,
    'Classic DPS': 3,
    Bomber: 2,
    'Slow DPS': 2,
  },
  slowDpsCoreMinRatio: 0.72,    // each of ATK%/CRate/CDmg must reach this HR ratio
  godRollMinRatio: 0.92,        // single-line Universal fallback floor
  duoRollMinRatio: 0.82,        // pair floor for Universal fallback
  godCountsAsRole: false,
  duoCountsAsRole: false,
  /** Simple-mode slider 1–5; drives primary policy blend + relaxed second pass (see policy-ui / engine-process). */
  simpleStrictness: 3,
  /** normal | strict | off — relaxed second pass; Simple mode sets off at strictness ≥4. */
  relaxedRetryMode: 'normal',
};

const DEFAULT_EVAL_POLICY_PRESETS = {
  'Early Progression': {
    preset: 'Early Progression',
    anchorMode: 'soft',
    slotRequirementMode: 'hard',
    minStatsModifier: 0,
    minRolePressure: 0.0,
    rolePressureByRole: {},
    minUsefulSubsByRole: {},
    slowDpsCoreMinRatio: 0.72,
    godRollMinRatio: 0.92,
    duoRollMinRatio: 0.82,
    godCountsAsRole: false,
    duoCountsAsRole: false,
  },
  'Mid Progression': {
    preset: 'Mid Progression',
    anchorMode: 'hard',
    slotRequirementMode: 'hard',
    minStatsModifier: 0,
    minRolePressure: 0.0,
    rolePressureByRole: {
      'Fast CC': 0.48,
      Bomber: 0.50,
      'Classic DPS': 0.50,
      'Slow DPS': 0.55,
      Bruiser: 0.38,
      Tank: 0.35,
    },
    minUsefulSubsByRole: {
      'Fast CC': 2,
      Bruiser: 2,
      Tank: 2,
      'Classic DPS': 3,
      Bomber: 2,
      'Slow DPS': 2,
    },
    slowDpsCoreMinRatio: 0.72,
    godRollMinRatio: 0.92,
    duoRollMinRatio: 0.82,
    godCountsAsRole: false,
    duoCountsAsRole: false,
  },
  'Late Progression': {
    preset: 'Late Progression',
    anchorMode: 'hard',
    slotRequirementMode: 'hard',
    minStatsModifier: 1,
    minRolePressure: 0.55,
    rolePressureByRole: {},
    minUsefulSubsByRole: {},
    slowDpsCoreMinRatio: 0.75,
    godRollMinRatio: 0.95,
    duoRollMinRatio: 0.85,
    godCountsAsRole: false,
    duoCountsAsRole: false,
  },
  Competitive: {
    preset: 'Competitive',
    anchorMode: 'hard',
    slotRequirementMode: 'hard',
    minStatsModifier: 1,
    minRolePressure: 0.65,
    rolePressureByRole: {},
    minUsefulSubsByRole: {},
    slowDpsCoreMinRatio: 0.80,
    godRollMinRatio: 1.00,
    duoRollMinRatio: 0.90,
    godCountsAsRole: false,
    duoCountsAsRole: false,
  },
};

// Diagnostic-only role quality model (does not affect verdict tree).
const DEFAULT_FIT_MODEL = {
  enabled: true,
  scoreScale: 100,
  hrWeight: 70,
  synergyWeight: 20,
  innateWeight: 10,
  innateStats: ['SPD', 'HP%', 'ATK%', 'DEF%', 'ACC', 'RES', 'CRate', 'CDmg'],
  roleSynergyPairs: {
    'Fast CC': [['SPD', 'ACC'], ['SPD', 'HP%'], ['SPD', 'DEF%'], ['HP%', 'DEF%']],
    'Classic DPS': [['SPD', 'CRate'], ['CRate', 'CDmg'], ['ATK%', 'CRate'], ['ATK%', 'CDmg']],
    'Slow DPS': [['ATK%', 'CRate'], ['ATK%', 'CDmg'], ['CRate', 'CDmg']],
    'Bomber': [['ATK%', 'ACC'], ['SPD', 'ACC'], ['SPD', 'ATK%']],
    'Tank': [['HP%', 'DEF%'], ['HP%', 'RES'], ['DEF%', 'RES'], ['SPD', 'HP%']],
    'Bruiser': [['HP%', 'DEF%'], ['SPD', 'HP%'], ['SPD', 'DEF%'], ['CRate', 'HP%']],
  },
};

// Future-safe optional bridge: Fit Score may affect ONLY borderline cases.
// Disabled by default and does not alter verdict unless explicitly enabled.
const DEFAULT_BORDERLINE_POLICY = {
  enabled: false,
  keepVerdictsOnly: true,        // never resurrect hard dead runes
  requirePolicyMatch: true,      // candidate must already pass policy role qualification
  minFitScore: 75,               // floor for any influence
  maxSoftenedChecks: 1,          // only near-pass, not heavily softened roles
  disallowWhenNoRoleDirection: true, // block if no policy role
  notes: 'Guardrail only. Keep verdict tree canonical.',
};

// ---- EFFICIENCY MAX VALUES (Legend 6★ for each stat) ----
// Used to calculate efficiency %
const EFF_MAX = {
  SPD:  { flat: 6 },
  'HP%':{ pct:  8 }, 'HP': { flat: 1875 },
  'ATK%':{ pct: 8 }, 'ATK':{ flat: 100 },
  'DEF%':{ pct: 8 }, 'DEF':{ flat: 100 },
  CRate:{ flat: 6 }, CDmg: { flat: 7 },
  ACC:  { flat: 8 }, RES:  { flat: 8 },
};
// Max main stat value per slot/type for efficiency baseline
const EFF_MAIN_MAX = {
  2: { SPD:42, 'HP%':63, 'ATK%':63, 'DEF%':63 },
  4: { 'HP%':63, 'ATK%':63, 'DEF%':63, CRate:58, CDmg:80 },
  6: { 'HP%':63, 'ATK%':63, 'DEF%':63, ACC:64, RES:64 },
};

// ---- SETTINGS PERSISTENCE ----
const STORAGE_KEY = 'swrm_settings_v1';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {}
}

function mergeGemMeta(savedGem) {
  const d = JSON.parse(JSON.stringify(DEFAULT_GEM_META));
  if (!savedGem || typeof savedGem !== 'object') return d;

  if (typeof savedGem.legacyFlatSubGem === 'boolean') {
    d.legacyFlatSubGem = savedGem.legacyFlatSubGem;
  }
  const qSaved = savedGem.qualityGate;
  if (!qSaved || typeof qSaved !== 'object') {
    d.qualityGate = JSON.parse(JSON.stringify(DEFAULT_GEM_META.qualityGate));
  } else {
    d.qualityGate = {
      early: Object.assign({}, DEFAULT_GEM_META.qualityGate.early, qSaved.early || {}),
      mid: Object.assign({}, DEFAULT_GEM_META.qualityGate.mid, qSaved.mid || {}),
      late: Object.assign({}, DEFAULT_GEM_META.qualityGate.late, qSaved.late || {}),
    };
  }
  return d;
}

function mergeEvalPolicy(savedPolicy) {
  const d = JSON.parse(JSON.stringify(DEFAULT_EVAL_POLICY));
  if (!savedPolicy || typeof savedPolicy !== 'object') return d;
  const out = { ...d, ...savedPolicy };
  out.anchorMode = out.anchorMode === 'soft' ? 'soft' : 'hard';
  out.slotRequirementMode = out.slotRequirementMode === 'soft' ? 'soft' : 'hard';
  const mm = Number(out.minStatsModifier);
  out.minStatsModifier = mm === -1 ? -1 : (mm === 1 ? 1 : 0);
  out.godCountsAsRole = out.godCountsAsRole !== false;
  out.duoCountsAsRole = out.duoCountsAsRole !== false;
  const ratio = (v, fb) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return Math.max(0, Math.min(1.25, n));
  };
  out.slowDpsCoreMinRatio = ratio(out.slowDpsCoreMinRatio, d.slowDpsCoreMinRatio);
  out.godRollMinRatio = ratio(out.godRollMinRatio, d.godRollMinRatio);
  out.duoRollMinRatio = ratio(out.duoRollMinRatio, d.duoRollMinRatio);
  const rp = Number(out.minRolePressure);
  out.minRolePressure = Number.isFinite(rp) ? Math.max(0, Math.min(1, rp)) : d.minRolePressure;
  const srcPress = out.rolePressureByRole && typeof out.rolePressureByRole === 'object' ? out.rolePressureByRole : {};
  const press = {};
  Object.entries(srcPress).forEach(([k, v]) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    press[k] = Math.max(0, Math.min(1, n));
  });
  out.rolePressureByRole = press;
  const srcUseful = out.minUsefulSubsByRole && typeof out.minUsefulSubsByRole === 'object' ? out.minUsefulSubsByRole : {};
  const useful = {};
  Object.entries(srcUseful).forEach(([k, v]) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    useful[k] = Math.max(0, Math.min(8, Math.round(n)));
  });
  out.minUsefulSubsByRole = useful;
  if (!['Early Progression', 'Mid Progression', 'Late Progression', 'Competitive', 'Custom'].includes(out.preset)) {
    out.preset = 'Custom';
  }
  const ss = Number(out.simpleStrictness);
  out.simpleStrictness = Number.isFinite(ss) ? Math.max(1, Math.min(5, Math.round(ss))) : 3;
  const rrm = String(out.relaxedRetryMode || '');
  out.relaxedRetryMode = rrm === 'off' || rrm === 'strict' ? rrm : 'normal';
  return out;
}

function mergeFitModel(savedModel) {
  const d = JSON.parse(JSON.stringify(DEFAULT_FIT_MODEL));
  if (!savedModel || typeof savedModel !== 'object') return d;
  const out = { ...d, ...savedModel };
  out.enabled = out.enabled !== false;
  const cap = (v, lo, hi, fb) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return Math.max(lo, Math.min(hi, n));
  };
  out.scoreScale = cap(out.scoreScale, 10, 1000, d.scoreScale);
  out.hrWeight = cap(out.hrWeight, 0, 100, d.hrWeight);
  out.synergyWeight = cap(out.synergyWeight, 0, 100, d.synergyWeight);
  out.innateWeight = cap(out.innateWeight, 0, 100, d.innateWeight);
  out.innateStats = Array.isArray(out.innateStats) ? out.innateStats.slice() : d.innateStats.slice();
  out.roleSynergyPairs = out.roleSynergyPairs && typeof out.roleSynergyPairs === 'object'
    ? out.roleSynergyPairs
    : JSON.parse(JSON.stringify(d.roleSynergyPairs));
  return out;
}

function mergeBorderlinePolicy(saved) {
  const d = JSON.parse(JSON.stringify(DEFAULT_BORDERLINE_POLICY));
  if (!saved || typeof saved !== 'object') return d;
  const out = { ...d, ...saved };
  out.enabled = out.enabled === true;
  out.keepVerdictsOnly = out.keepVerdictsOnly !== false;
  out.requirePolicyMatch = out.requirePolicyMatch !== false;
  out.disallowWhenNoRoleDirection = out.disallowWhenNoRoleDirection !== false;
  const num = (v, lo, hi, fb) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return fb;
    return Math.max(lo, Math.min(hi, n));
  };
  out.minFitScore = num(out.minFitScore, 0, 1000, d.minFitScore);
  out.maxSoftenedChecks = num(out.maxSoftenedChecks, 0, 8, d.maxSoftenedChecks);
  return out;
}

function toCsvMains(raw) {
  if (Array.isArray(raw)) {
    const vals = raw.map((v) => String(v || '').trim()).filter((v) => v && v !== 'None');
    return vals.length ? vals.join(', ') : 'None';
  }
  if (typeof raw === 'string') {
    const txt = raw.trim();
    return txt || 'None';
  }
  return 'None';
}

/** Convert legacy settings.roles entry to canonical settings.formulas shape. */
function legacyRoleToFormula(role, fallbackName) {
  const base = DEFAULT_FORMULAS[fallbackName]
    ? JSON.parse(JSON.stringify(DEFAULT_FORMULAS[fallbackName]))
    : {
      enabled: true,
      acceptedMains: { 2: 'None', 4: 'None', 6: 'None' },
      substats: {
        SPD: { Early: 'None', Mid: 'None', Late: 'None' },
        'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
        'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
        'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
        CRate: { Early: 'None', Mid: 'None', Late: 'None' },
        CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
        ACC: { Early: 'None', Mid: 'None', Late: 'None' },
        RES: { Early: 'None', Mid: 'None', Late: 'None' },
      },
      mustHave: { Early: 'None', Mid: 'None', Late: 'None' },
      slotRequirements: {
        2: { Early: 'None', Mid: 'None', Late: 'None' },
        4: { Early: 'None', Mid: 'None', Late: 'None' },
        6: { Early: 'None', Mid: 'None', Late: 'None' },
      },
      minStats: {
        '1/3/5': { Early: 1, Mid: 1, Late: 1 },
        'Slot 2': { Early: 1, Mid: 1, Late: 1 },
        'Slot 4': { Early: 1, Mid: 1, Late: 1 },
        'Slot 6': { Early: 1, Mid: 1, Late: 1 },
      },
      requireHR: {
        'High Roll for Hero': { Early: false, Mid: false, Late: false },
        'High Roll for Legend': { Early: false, Mid: false, Late: false },
      },
    };

  const out = JSON.parse(JSON.stringify(base));
  if (!role || typeof role !== 'object') return out;
  out.enabled = role.enabled !== false;
  for (const slot of [2, 4, 6]) {
    out.acceptedMains[slot] = toCsvMains(role.acceptedMains?.[slot] ?? out.acceptedMains[slot]);
  }
  const stats = ['SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
  for (const st of stats) {
    const raw = role.substats?.[st];
    if (raw && typeof raw === 'object') {
      out.substats[st].Early = raw.Early ?? out.substats[st].Early;
      out.substats[st].Mid = raw.Mid ?? out.substats[st].Mid;
      out.substats[st].Late = raw.Late ?? out.substats[st].Late;
    } else if (typeof raw === 'string') {
      out.substats[st].Early = raw;
      out.substats[st].Mid = raw;
      out.substats[st].Late = raw;
    }
  }
  for (const stage of ['Early', 'Mid', 'Late']) {
    out.mustHave[stage] = role.mustHave?.[stage] ?? out.mustHave[stage];
  }
  for (const slot of [2, 4, 6]) {
    for (const stage of ['Early', 'Mid', 'Late']) {
      out.slotRequirements[slot][stage] =
        role.slotRequirements?.[slot]?.[stage] ?? out.slotRequirements[slot][stage];
    }
  }
  for (const slotType of ['1/3/5', 'Slot 2', 'Slot 4', 'Slot 6']) {
    for (const stage of ['Early', 'Mid', 'Late']) {
      const legacyDirect = role.minStats?.[stage];
      const next = role.minStats?.[slotType]?.[stage];
      const val = Number.isFinite(Number(next))
        ? Number(next)
        : (Number.isFinite(Number(legacyDirect)) ? Number(legacyDirect) : out.minStats[slotType][stage]);
      out.minStats[slotType][stage] = val;
    }
  }
  const needHero = role.requireHR?.['High Roll for Hero'] || {};
  const needLegend = role.requireHR?.['High Roll for Legend'] || {};
  for (const stage of ['Early', 'Mid', 'Late']) {
    const heroLegacy = role.requireHR?.[`${stage}_Hero`];
    const legLegacy = role.requireHR?.[`${stage}_Leg`];
    out.requireHR['High Roll for Hero'][stage] =
      typeof needHero[stage] === 'boolean' ? needHero[stage] : !!heroLegacy;
    out.requireHR['High Roll for Legend'][stage] =
      typeof needLegend[stage] === 'boolean' ? needLegend[stage] : !!legLegacy;
  }
  return out;
}

function getSettings() {
  const saved = loadSettings();
  const presetVersion = Number(saved?.presetVersion || 0);
  const formulas = saved?.formulas
    ? JSON.parse(JSON.stringify(saved.formulas))
    : JSON.parse(JSON.stringify(DEFAULT_FORMULAS));
  // Migration: keep legacy formula names aligned with canonical role names.
  if (formulas['Fast Utility'] && !formulas['Fast CC']) {
    formulas['Fast CC'] = formulas['Fast Utility'];
  }
  if (formulas['Heavy Resist'] && !formulas['Tank']) {
    formulas['Tank'] = formulas['Heavy Resist'];
  }
  delete formulas['Fast Utility'];
  delete formulas['Heavy Resist'];
  // One-time migration: enforce CSV-aligned presets for the six core formula roles.
  if (presetVersion < 2) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
    });
  }
  Object.values(formulas).forEach((formula) => {
    if (formula && formula.enabled === undefined) formula.enabled = true;
  });
  const roles = saved?.roles ? JSON.parse(JSON.stringify(saved.roles)) : JSON.parse(JSON.stringify(DEFAULT_ROLES));
  if (presetVersion < 2) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      roles[name] = JSON.parse(JSON.stringify(DEFAULT_ROLES[name]));
    });
  }
  const roleNames = Array.from(new Set([
    ...Object.keys(formulas || {}),
    ...Object.keys(roles || DEFAULT_ROLES),
  ]));
  const defaultConfiguredPriority = [
    ...DEFAULT_ROLE_PRIORITY.filter((name) => roleNames.includes(name)),
    ...roleNames.filter((name) => !DEFAULT_ROLE_PRIORITY.includes(name)),
  ];
  const storedPriority = (presetVersion < 3)
    ? defaultConfiguredPriority
    : (Array.isArray(saved?.rolePriority) ? saved.rolePriority : []);
  const rolePriority = [
    ...storedPriority.filter((name) => roleNames.includes(name)),
    ...roleNames.filter((name) => !storedPriority.includes(name)),
  ];

  let statConstants;
  if (saved?.statConstants && typeof saved.statConstants === 'object') {
    statConstants = mergeStatConstants(saved.statConstants);
    if (saved.godConstants && typeof saved.godConstants === 'object') {
      applyGodConstantsToStatConstants(statConstants, saved.godConstants);
    }
  } else if (saved?.hrThresholds && typeof saved.hrThresholds === 'object') {
    const duoLegacy = saved.duoThresholds && typeof saved.duoThresholds === 'object'
      ? saved.duoThresholds
      : DEFAULT_DUO_THRESHOLDS;
    statConstants = inferStatConstantsFromLegacyHrDuo(
      saved.hrThresholds,
      duoLegacy,
      saved.godConstants
    );
  } else {
    statConstants = mergeStatConstants(null);
  }

  const hrThresholds = computeHrThresholds(statConstants);
  const duoThresholds = computeDuoThresholds(statConstants, hrThresholds);
  const godConstants = godConstantsFromStatConstants(statConstants);

  let gemMeta = mergeGemMeta(saved?.gemMeta);
  let reapp = saved?.reapp && typeof saved.reapp === 'object'
    ? JSON.parse(JSON.stringify(saved.reapp))
    : JSON.parse(JSON.stringify(DEFAULT_REAPP));
  let grindGap = Number.isFinite(Number(saved?.grind?.gap)) ? Number(saved.grind.gap) : DEFAULT_GRIND.gap;
  // v9: tighten Grind — old default gap was 1.0 (too many runes). Migrate bare 1.0 to new default.
  if (presetVersion < 9 && (!saved?.grind || !Number.isFinite(Number(saved.grind.gap)) || Math.abs(Number(saved.grind.gap) - 1) < 1e-9)) {
    grindGap = DEFAULT_GRIND.gap;
  }
  const grind = { gap: grindGap };
  const policy = mergeEvalPolicy(saved?.policy);
  const fitModel = mergeFitModel(saved?.fitModel);
  const borderlinePolicy = mergeBorderlinePolicy(saved?.borderlinePolicy);
  if (presetVersion < 5) {
    gemMeta.qualityGate = JSON.parse(JSON.stringify(DEFAULT_GEM_META.qualityGate));
    reapp.sets = DEFAULT_REAPP.sets.slice();
  }
  // One-time: innate-Gem UI removed — enable the substats-only path for browsers that saved legacyFlatSubGem: false next to innate defaults.
  if (presetVersion < 10) {
    gemMeta.legacyFlatSubGem = true;
  }
  // Spreadsheet-aligned six archetypes (reapply once when defaults change).
  if (presetVersion < 7) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      if (DEFAULT_FORMULAS[name]) {
        formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
      }
    });
  }
  // v11: Classic DPS only — slot 2 add ATK% accepted main; slot 4 slotRequirements → None (spreadsheet).
  if (presetVersion < 11) {
    if (DEFAULT_FORMULAS['Classic DPS']) {
      formulas['Classic DPS'] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS['Classic DPS']));
    }
  }
  // v12: Bruiser — min stats for slots 1/3/5: Early & Mid 2 (was 3); Late unchanged (spreadsheet).
  if (presetVersion < 12) {
    if (DEFAULT_FORMULAS.Bruiser) {
      formulas.Bruiser = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bruiser));
    }
  }
  // v13: accepted mains moved to comma-list per slot + latest sheet-aligned mains defaults.
  if (presetVersion < 13) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      if (DEFAULT_FORMULAS[name]) {
        formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
      }
    });
    // Align constants model to the new Sheets baseline (early discount / late tougher + updated mods).
    statConstants = mergeStatConstants(null);
  }
  // v14: narrower Reapp sets; tightened Fast CC + Bomber presets (spreadsheet).
  if (presetVersion < 14) {
    reapp.sets = DEFAULT_REAPP.sets.slice();
    if (DEFAULT_FORMULAS['Fast CC']) {
      formulas['Fast CC'] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS['Fast CC']));
    }
    if (DEFAULT_FORMULAS.Bomber) {
      formulas.Bomber = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bomber));
    }
  }
  // v15: Bruiser preset synced to Sheets (accepted mains, minStats keys 135/2/4/6).
  if (presetVersion < 15) {
    if (DEFAULT_FORMULAS.Bruiser) {
      formulas.Bruiser = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bruiser));
    }
  }
  // v16: Bomber — Legend needs HR anchor at Mid (avoids match without a high-roll line).
  if (presetVersion < 16) {
    if (DEFAULT_FORMULAS.Bomber && formulas.Bomber) {
      formulas.Bomber.requireHR = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bomber.requireHR));
    }
  }
  // Canonical source is settings.formulas. Migrate any leftover legacy-only roles to formulas.
  for (const [name, roleCfg] of Object.entries(roles || {})) {
    if (formulas[name]) continue;
    formulas[name] = legacyRoleToFormula(roleCfg, name);
  }

  return {
    thresholds:    saved?.thresholds    || JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
    statConstants,
    hrThresholds,
    duoThresholds,
    godConstants,
    roles,
    formulas,
    rolePriority,
    presetVersion: 16,
    reapp,
    grind,
    gemMeta,
    policy,
    fitModel,
    borderlinePolicy,
  };
}

function applyDerivedThresholdFields(settings) {
  if (!settings || !settings.statConstants) return settings;
  const hr = computeHrThresholds(settings.statConstants);
  const duo = computeDuoThresholds(settings.statConstants, hr);
  settings.hrThresholds = hr;
  settings.duoThresholds = duo;
  settings.godConstants = godConstantsFromStatConstants(settings.statConstants);
  return settings;
}
