// js/core/meta.js — part of core load chain
// =============================================
// settings.js — Default thresholds & config
// =============================================

const STAT_NAMES = {
  1:  'HP',     2:  'HP%',    3:  'ATK',
  4:  'ATK%',   5:  'DEF',    6:  'DEF%',
  // SWEX stat IDs (used by pri_eff/sec_eff/prefix_eff):
  // 8=SPD, 9=CRate, 10=CDmg, 11=RES, 12=ACC
  8:  'SPD',    9:  'CRate',  10: 'CDmg',
  11: 'RES',    12: 'ACC'
};

/** Localized stat abbreviations for dropdowns (engine + JSON still use {@link STAT_NAMES}). French uses in-game style: VIT, PV, ATQ… */
const STAT_NAMES_UI_BY_LANG = {
  en: { ...STAT_NAMES },
  ru: { ...STAT_NAMES },
  fr: {
    1: 'PV',
    2: 'PV%',
    3: 'ATQ',
    4: 'ATQ%',
    5: 'DEF',
    6: 'DEF%',
    8: 'VIT',
    9: 'Taux CR',
    10: 'DG CR',
    11: 'RÉS',
    12: 'PRÉ',
  },
};
function statNamesUiForLang(lang) {
  return STAT_NAMES_UI_BY_LANG[lang] || STAT_NAMES_UI_BY_LANG.en;
}

const SET_NAMES = {
  1:  'Energy',   2:  'Guard',    3:  'Swift',
  4:  'Blade',    5:  'Rage',     6:  'Focus',
  7:  'Endure',   8:  'Fatal',    10: 'Despair',
  11: 'Vampire',  13: 'Violent',  14: 'Nemesis',
  15: 'Will',     16: 'Shield',   17: 'Revenge',
  18: 'Destroy',  19: 'Fight',    20: 'Determination',
  21: 'Enhance',  22: 'Accuracy', 23: 'Tolerance',
  24: 'Seal',     25: 'Intangible',
  /* 99 is not a playable 4‑piece rune set name in SW; SWEX may still emit it — show as Set99 via parser fallback. */
};

const GRADE_NAMES = { 1:'Common', 2:'Magic', 3:'Rare', 4:'Hero', 5:'Legend' };
/** Short labels used in UI / filters (SWEX rank → string) */
const GRADE_SHORT = { 3:'Rare', 4:'Hero', 5:'Legend' };

/** Shown in footer, changelog, and Copy summary — bump when shipping a user-visible build. */
const APP_VERSION = '1.2.17';

/**
 * Debug only: when true, the verdict engine skips every check that compares `rune.eff`
 * (Gem quality gate, Reapp max-eff, Hero +9…+11 Sell-on-low-eff, and the no-role branch that
 * only exists to Sell by eff — that branch falls through to Grind/Keep). `rune.eff` is still
 * filled by the parser; dashboard, charts, table, and sorting are unchanged.
 * Set to `true` locally to compare behavior with spreadsheets; keep `false` for normal use.
 */
const DEBUG_BYPASS_EFFICIENCY_GATES = false;

/** Cloudflare Worker API (Share Profile, Leaderboard). */
const SWRM_API = 'https://sw-backend.antajltube.workers.dev';
/** Set true after Worker exposes GET /swarfarm/* (static proxy). Until then, images use swarfarm.com directly. */
const SWRM_SWARFARM_PROXY_STATIC = true;


// Slot mains (odd slots) — after i18n in monolith, kept here for load order with thresholds.
const SLOT_MAIN_FIXED = {
  1: { type: 3,  name: 'ATK' },   // Flat ATK
  3: { type: 5,  name: 'DEF' },   // Flat DEF
  5: { type: 1,  name: 'HP'  }    // Flat HP
};
