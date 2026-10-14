// src/core/roles.ts - Role definitions and evaluation
// Migrated from js/engine/engine-legacy-roles.js (simplified)

import type { Rune } from '../types/rune';
import { statMap } from './formulas';
import { getGodThreshold } from './thresholds';
import { modeKey } from './utils';

/**
 * Role configuration
 */
export interface RoleConfig {
  id: string;
  name: string;
  description?: string;
  
  // Attribute requirements
  attributes?: number[];
  
  // Archetype requirements
  archetypes?: number[];
  
  // Preferred slots
  preferredSlots?: number[];
  
  // Preferred sets
  preferredSets?: number[];
  
  // Required stats
  requiredStats?: string[];
  
  // Penalty stats
  penaltyStats?: string[];
  
  // Formulas that define this role
  formulas?: string[];
  
  // Minimum efficiency
  minEff?: number;
  
  // Additional configuration
  [key: string]: any;
}

/**
 * Role evaluation result
 */
export interface RoleResult {
  roleId: string;
  passed: boolean;
  score: number;
  details: {
    highRoll: boolean;
    duoRoll: boolean;
    statMatches: Record<string, boolean>;
    efficiency: number;
  };
  meta?: Record<string, any>;
}

/**
 * Check for High Roll (God Roll)
 */
export function checkHighRoll(
  rune: Rune,
  _stage: string,
  settings: {
    statConstants?: Record<string, any>;
    policy?: { godRollMinRatio?: number };
  }
): boolean {
  const ratio = Number(settings?.policy?.godRollMinRatio);
  const minRatio = Number.isFinite(ratio) ? ratio : 1;
  
  for (const s of rune.substats) {
    if (s.source === 'innate' || !s.name || s.flat) continue;
    
    const base = getGodThreshold(s.name, settings, rune.gradeStr);
    const threshold = Number.isFinite(Number(base)) ? Number(base) * minRatio : base;
    
    const subVal = s.val + s.grind;
    if (threshold != null && threshold > 0 && subVal >= threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check for Duo Roll
 */
export function checkDuoRoll(
  rune: Rune,
  stage: string,
  settings: {
    duoThresholds?: Record<string, Record<string, number>>;
    policy?: { duoRollMinRatio?: number };
  }
): boolean {
  const key = modeKey(stage, rune.gradeStr);
  const dr = settings.duoThresholds;
  
  if (!dr || typeof dr !== 'object') return false;
  
  const sm = statMap(rune);
  const ratioCfg = Number(settings?.policy?.duoRollMinRatio);
  const duoRatio = Number.isFinite(ratioCfg) ? ratioCfg : 1;
  
  const hit = (stat: string): number => {
    const th = dr[stat]?.[key];
    if (th == null || !(th > 0)) return 0;
    return (sm[stat] || 0) >= (th * duoRatio) ? 1 : 0;
  };
  
  const spd = hit('SPD');
  const hp = hit('HP%');
  const def = hit('DEF%');
  const atk = hit('ATK%');
  const cr = hit('CRate');
  const cd = hit('CDmg');
  const acc = hit('ACC');
  const res = hit('RES');
  
  // Check common duo pairs
  const pairs = [
    spd + hp >= 2,      // SPD + HP%
    spd + def >= 2,      // SPD + DEF%
    spd + atk >= 2,      // SPD + ATK%
    cr + cd >= 2,        // CRate + CDmg
    cr + atk >= 2,       // CRate + ATK%
    cd + cr >= 2,        // CDmg + CRate
    hp + def >= 2,       // HP% + DEF%
    hp + res >= 2,       // HP% + RES
    def + res >= 2,      // DEF% + RES
    hp + cd >= 2,        // HP% + CDmg
    cd + hp >= 2,        // CDmg + HP%
    hp + acc >= 2,       // HP% + ACC
    acc + hp >= 2,       // ACC + HP%
    def + acc >= 2,      // DEF% + ACC
    acc + def >= 2,      // ACC + DEF%
  ];
  
  return pairs.some(p => p);
}

/**
 * Evaluate a role against a rune
 */
export function evaluateRole(
  rune: Rune,
  role: RoleConfig,
  settings: {
    statConstants?: Record<string, any>;
    duoThresholds?: Record<string, Record<string, number>>;
    policy?: {
      godRollMinRatio?: number;
      duoRollMinRatio?: number;
    };
  },
  _stage: string
): RoleResult {
  const sm = statMap(rune);
  
  // Check stat requirements
  const statMatches: Record<string, boolean> = {};
  for (const stat of role.requiredStats || []) {
    statMatches[stat] = (sm[stat] || 0) > 0;
  }
  
  const allRequiredStatsMet = Object.values(statMatches).every(v => v);
  
  // Check efficiency
  const efficiencyGate = !role.minEff || rune.eff >= role.minEff;
  
  // Check special rolls
  const highRoll = checkHighRoll(rune, _stage, settings);
  const duoRoll = checkDuoRoll(rune, _stage, settings);
  
  // Calculate score
  let score = 0;
  if (highRoll) score += 30;
  if (duoRoll) score += 25;
  if (allRequiredStatsMet) score += 25;
  if (efficiencyGate) score += 20;
  
  const passed = 
    allRequiredStatsMet &&
    efficiencyGate &&
    (highRoll || duoRoll || rune.eff >= 80);
  
  return {
    roleId: role.id,
    passed,
    score,
    details: {
      highRoll,
      duoRoll,
      statMatches,
      efficiency: rune.eff,
    },
  };
}

/**
 * Get all matching roles for a rune
 */
export function getMatchingRoles(
  rune: Rune,
  roles: RoleConfig[],
  settings: {
    statConstants?: Record<string, any>;
    duoThresholds?: Record<string, Record<string, number>>;
    policy?: {
      godRollMinRatio?: number;
      duoRollMinRatio?: number;
    };
  },
  stage: string
): RoleResult[] {
  const results: RoleResult[] = [];
  
  for (const role of roles) {
    const result = evaluateRole(rune, role, settings, stage);
    if (result.passed) {
      results.push(result);
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results;
}