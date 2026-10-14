// src/core/constants.ts - Core constants for SW-Forge
// Migrated from js/core/defaults.js

/**
 * Stat order for the Constants table (8 substats)
 */
export const GOD_STAT_ORDER = ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'] as const;

/**
 * Column keys for High Roll thresholds
 */
export const HR_COL_KEYS = ['Early_Leg', 'Early_Hero', 'Mid_Leg', 'Mid_Hero', 'Late_Leg', 'Late_Hero'] as const;

/**
 * Round threshold values to 2 decimal places
 */
export function roundThresh(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

/**
 * Type for threshold values by stage and grade
 */
export type ThresholdValue = {
  Early_Leg: number;
  Early_Hero: number;
  Mid_Leg: number;
  Mid_Hero: number;
  Late_Leg: number;
  Late_Hero: number;
};

/**
 * Type for threshold map keyed by stat name
 */
export type ThresholdMap = Record<string, ThresholdValue>;

/**
 * Stage type definitions
 */
export type Stage = 'Early' | 'Mid' | 'Late';
export type Grade = 'Leg' | 'Hero';