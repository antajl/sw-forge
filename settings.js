// =============================================
// settings.js — Default thresholds & config
// Mirrors your Google Sheets Settings structure
// =============================================

const STAT_NAMES = {
  1:  'SPD',    2:  'HP%',    3:  'HP',
  4:  'ATK%',   5:  'ATK',    6:  'DEF%',
  7:  'DEF',    8:  'CRate',  9:  'CDmg',
  10: 'RES',   11: 'ACC'
};

const SET_NAMES = {
  1:  'Energy',   2:  'Guard',    3:  'Swift',
  4:  'Blade',    5:  'Rage',     6:  'Focus',
  7:  'Endure',   8:  'Fatal',    10: 'Despair',
  11: 'Vampire',  13: 'Violent',  14: 'Nemesis',
  15: 'Will',     16: 'Shield',   17: 'Revenge',
  18: 'Destroy',  19: 'Fight',    20: 'Determination',
  21: 'Enhance',  22: 'Accuracy', 23: 'Tolerance'
};

const GRADE_NAMES = { 1:'Common', 2:'Magic', 3:'Rare', 4:'Hero', 5:'Legend' };
const GRADE_SHORT = { 4:'Hero', 5:'Legend' };

const SLOT_MAIN_FIXED = {
  1: { type: 5,  name: 'ATK' },   // Flat ATK
  3: { type: 7,  name: 'DEF' },   // Flat DEF
  5: { type: 3,  name: 'HP'  }    // Flat HP
};

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

// High Roll thresholds (separate from general)
const DEFAULT_HR_THRESHOLDS = {
  SPD:   { Early_Leg:14, Early_Hero:10, Mid_Leg:17, Mid_Hero:15, Late_Leg:21, Late_Hero:18 },
  'HP%': { Early_Leg:18, Early_Hero:14, Mid_Leg:21, Mid_Hero:20, Late_Leg:25, Late_Hero:24 },
  'DEF%':{ Early_Leg:18, Early_Hero:14, Mid_Leg:21, Mid_Hero:20, Late_Leg:25, Late_Hero:24 },
  'ATK%':{ Early_Leg:16, Early_Hero:12, Mid_Leg:18, Mid_Hero:17, Late_Leg:23, Late_Hero:21 },
  CRate: { Early_Leg:11, Early_Hero:8,  Mid_Leg:14, Mid_Hero:13, Late_Leg:17, Late_Hero:16 },
  CDmg:  { Early_Leg:14, Early_Hero:10, Mid_Leg:17, Mid_Hero:16, Late_Leg:21, Late_Hero:20 },
  ACC:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
  RES:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
};
const DEFAULT_HR_COEFF = 0.70; // partner soft threshold

// Duo Roll pairs
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
};

// ---- ROLE DEFINITIONS ----
// Include/Exclude/None; mustHave per stage; acceptedMains per slot; minStats per slot
const DEFAULT_ROLES = {
  'Classic DPS': {
    substats: { SPD:'Include', 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: null, Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD'], 4:['HP%','ATK%','DEF%'], 6:['ATK%','HP%','DEF%'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:true, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Slow DPS': {
    substats: { 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                SPD:'None', 'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: null, Mid: 'CRate', Late: 'CRate' },
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
  'Fast Utility': {
    substats: { SPD:'Include', 'HP%':'Include', 'DEF%':'Include', ACC:'Include',
                'ATK%':'None', CRate:'None', CDmg:'None', RES:'None' },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD','HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','ACC'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Heavy Resist': {
    substats: { 'HP%':'Include', 'DEF%':'Include', RES:'Include',
                SPD:'None', 'ATK%':'None', CRate:'None', CDmg:'None', ACC:'None' },
    mustHave: { Early: 'RES', Mid: 'RES', Late: 'RES' },
    acceptedMains: { 2:['HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','RES'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:false, Early_Leg:false, Mid_Leg:false, Late_Leg:false },
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
  4: { 'HP%':63, 'ATK%':63, 'DEF%':63 },
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

function getSettings() {
  const saved = loadSettings();
  return {
    thresholds:    saved?.thresholds    || JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
    hrThresholds:  saved?.hrThresholds  || JSON.parse(JSON.stringify(DEFAULT_HR_THRESHOLDS)),
    hrCoeff:       saved?.hrCoeff       ?? DEFAULT_HR_COEFF,
    duoThresholds: saved?.duoThresholds || JSON.parse(JSON.stringify(DEFAULT_DUO_THRESHOLDS)),
    roles:         saved?.roles         || JSON.parse(JSON.stringify(DEFAULT_ROLES)),
  };
}

window.SWRM = window.SWRM || {};
window.SWRM.settings = getSettings();
window.SWRM.STAT_NAMES = STAT_NAMES;
window.SWRM.SET_NAMES  = SET_NAMES;
window.SWRM.GRADE_NAMES = GRADE_NAMES;
window.SWRM.GRADE_SHORT = GRADE_SHORT;
window.SWRM.SLOT_MAIN_FIXED = SLOT_MAIN_FIXED;
window.SWRM.EFF_MAX = EFF_MAX;
window.SWRM.EFF_MAIN_MAX = EFF_MAIN_MAX;
window.SWRM.DEFAULT_ROLES = DEFAULT_ROLES;
window.SWRM.DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS;
window.SWRM.DEFAULT_HR_THRESHOLDS = DEFAULT_HR_THRESHOLDS;
window.SWRM.DEFAULT_HR_COEFF = DEFAULT_HR_COEFF;
window.SWRM.DEFAULT_DUO_THRESHOLDS = DEFAULT_DUO_THRESHOLDS;
window.SWRM.saveSettings = saveSettings;
