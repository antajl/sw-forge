// src/core/engine-core.ts - Core engine integration
// Integrates parser, formulas, roles, and thresholds

import type { Rune } from '../types/rune';
import type { FormulaConfig, FormulaResult, EvalPolicy, FitModel } from './formulas';
import type { RoleConfig, RoleResult } from './roles';
import type { StatConstants } from './thresholds';

import {
  // Thresholds
  computeHrThresholds,
  computeDuoThresholds,
} from './thresholds';

import {
  // Formulas
  isFormulaEnabled,
  evaluateFormula,
} from './formulas';

import {
  // Roles
  checkHighRoll,
  checkDuoRoll,
  getMatchingRoles,
} from './roles';

import { modeKey } from './utils';

/**
 * Re-export modeKey for convenience
 */
export { modeKey };

/**
 * Complete engine context
 */
export interface EngineContext {
  // Settings
  statConstants?: StatConstants;
  hrThresholds?: Record<string, Record<string, number>>;
  duoThresholds?: Record<string, Record<string, number>>;
  formulas?: Record<string, FormulaConfig>;
  roles?: Record<string, RoleConfig>;
  policy?: Partial<EvalPolicy>;
  fitModel?: Partial<FitModel>;
  
  // Current stage
  stage: string;
  
  // Additional context
  [key: string]: any;
}

/**
 * Complete engine result for a rune
 */
export interface EngineResult {
  rune: Rune;
  
  // Basic metrics
  efficiency: number;
  highRoll: boolean;
  duoRoll: boolean;
  
  // Formula results
  formulaResults: Record<string, FormulaResult>;
  
  // Role results
  roleResults: RoleResult[];
  
  // Best match
  bestRole?: RoleResult;
  bestFormula?: FormulaResult;
  
  // Additional metadata
  meta?: Record<string, any>;
}

/**
 * Run complete engine evaluation on a rune
 */
export function evaluateRune(
  rune: Rune,
  context: EngineContext
): EngineResult {
  const {
    statConstants = {},
    hrThresholds = {},
    duoThresholds = {},
    formulas = {},
    roles = {},
    policy = {},
    fitModel = {},
    stage = 'Mid',
  } = context;
  
  // Compute thresholds if not provided
  const computedHrThresholds = Object.keys(hrThresholds).length > 0 
    ? hrThresholds 
    : computeHrThresholds(statConstants);
  
  const computedDuoThresholds = Object.keys(duoThresholds).length > 0
    ? duoThresholds
    : computeDuoThresholds(statConstants, computedHrThresholds);
  
  const settings = {
    statConstants,
    hrThresholds: computedHrThresholds,
    duoThresholds: computedDuoThresholds,
    formulas,
    roles,
    policy,
    fitModel,
  };
  
  // Check special rolls
  const highRoll = checkHighRoll(rune, stage, {
    statConstants,
    policy: { godRollMinRatio: policy?.godRollMinRatio },
  });
  const duoRoll = checkDuoRoll(rune, stage, {
    duoThresholds: computedDuoThresholds,
    policy: { duoRollMinRatio: policy?.duoRollMinRatio },
  });
  
  // Evaluate formulas
  const formulaResults: Record<string, FormulaResult> = {};
  for (const [formulaId, formula] of Object.entries(formulas)) {
    if (isFormulaEnabled(formulaId, settings)) {
      formulaResults[formulaId] = evaluateFormula(rune, formula, settings, stage, rune.gradeStr);
    }
  }
  
  // Evaluate roles
  const roleConfigList = Object.values(roles);
  const roleResults = getMatchingRoles(rune, roleConfigList, {
    statConstants,
    duoThresholds: computedDuoThresholds,
    policy: {
      godRollMinRatio: policy?.godRollMinRatio,
      duoRollMinRatio: policy?.duoRollMinRatio,
    },
  }, stage);
  
  // Find best matches
  const bestRole = roleResults.length > 0 ? roleResults[0] : undefined;
  const bestFormula = Object.values(formulaResults)
    .filter(r => r.passed)
    .sort((a, b) => b.score - a.score)[0];
  
  return {
    rune,
    efficiency: rune.eff,
    highRoll,
    duoRoll,
    formulaResults,
    roleResults,
    bestRole,
    bestFormula,
    meta: {
      stage,
      gradeStr: rune.gradeStr,
    },
  };
}

/**
 * Batch evaluate multiple runes
 */
export function evaluateRunes(
  runes: Rune[],
  context: EngineContext
): EngineResult[] {
  return runes.map(rune => evaluateRune(rune, context));
}