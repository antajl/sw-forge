// src/core/thresholds.ts - Threshold management and calculations
// Migrated from js/core/defaults.js

import { GOD_STAT_ORDER, HR_COL_KEYS, roundThresh } from './constants';

/**
 * Stat constant row structure
 */
export interface StatConstantRow {
  base: number;
  godMod: number;
  duoMod: number;
  earlyScale: number;
  lateScale: number;
  gradeMod: number;
}

/**
 * Stat constants map
 */
export type StatConstants = Record<string, StatConstantRow>;

/**
 * Default stat constants (aligned with master Constants sheet)
 */
const EXPLICIT_DEFAULT_STAT_CONSTANTS: StatConstants = {
  SPD:    { base: 16, godMod: 0.25, duoMod: 0.15, earlyScale: 0.20, lateScale: 0.30, gradeMod: 0.05 },
  'HP%':  { base: 20, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  'DEF%': { base: 20, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  'ATK%': { base: 17, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  CRate:  { base: 13, godMod: 0.25, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.05 },
  CDmg:   { base: 16, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  ACC:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.10 },
  RES:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.10 },
};

/**
 * Get default stat constants
 */
export function defaultStatConstants(): StatConstants {
  const out: StatConstants = {};
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

/**
 * Merge saved stat constants with defaults
 */
export function mergeStatConstants(saved: Partial<StatConstants>): StatConstants {
  const d = JSON.parse(JSON.stringify(defaultStatConstants()));
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return d;
  
  for (const stat of GOD_STAT_ORDER) {
    const src = saved[stat];
    if (!src || typeof src !== 'object') continue;
    
    const keys: (keyof StatConstantRow)[] = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
    for (const key of keys) {
      if (src[key] == null) continue;
      const n = Number(src[key]);
      if (Number.isFinite(n)) {
        d[stat][key] = n;
      }
    }
  }
  return d;
}

/**
 * Stage+grade High Roll threshold cell from Constants
 */
export function stageHrValue(statRow: StatConstantRow, colKey: string): number {
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
 * Compute HR thresholds from stat constants
 */
export function computeHrThresholds(statConstants: StatConstants): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  
  for (const stat of GOD_STAT_ORDER) {
    const row = statConstants[stat];
    out[stat] = {};
    
    for (const col of HR_COL_KEYS) {
      out[stat][col] = roundThresh(stageHrValue(row, col));
    }
  }
  return out;
}

/**
 * Duo line = stage HR for that stat × (1 − Duo_Mod)
 */
export function duoLineForStat(
  stat: string,
  colKey: string,
  hrTable: Record<string, Record<string, number>>,
  statConstants: StatConstants
): number {
  const hr = Number(hrTable[stat]?.[colKey]);
  if (!Number.isFinite(hr) || hr <= 0) return 0;
  
  const dm = Number(statConstants[stat]?.duoMod);
  const d = Number.isFinite(dm) ? dm : 0;
  
  return roundThresh(hr * (1 - d));
}

/**
 * Compute Duo thresholds from stat constants and HR table
 */
export function computeDuoThresholds(
  statConstants: StatConstants,
  hrTable: Record<string, Record<string, number>>
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  
  for (const stat of GOD_STAT_ORDER) {
    out[stat] = {};
    
    for (const col of HR_COL_KEYS) {
      const raw = duoLineForStat(stat, col, hrTable, statConstants);
      out[stat][col] = Number.isFinite(raw) ? Math.round(raw) : 0;
    }
  }
  return out;
}

/**
 * God threshold by grade
 */
export function getGodThreshold(
  stat: string,
  settings: { statConstants?: StatConstants },
  gradeStr: string
): number | null {
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