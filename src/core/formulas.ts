// src/core/formulas.ts - Formula system for rune evaluation
// Migrated from js/advanced-formulas.js (simplified core structure)

import type { Rune } from '../types/rune';

import { modeKey } from './utils';

/**
 * Formula configuration
 */
export interface FormulaConfig {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  
  // Substat requirements
  substats?: {
    [statName: string]: {
      [stage: string]: 'Include' | 'Exclude' | 'Penalty';
    };
  };
  
  // Main stat requirements
  acceptedMains?: {
    [slot: number]: string[] | string;
  };
  
  conditionalMains?: {
    [slot: number]: Array<{
      main: string;
      requireSub: string;
      minSubValue: number;
    }>;
  };
  
  // Weights and scoring
  weights?: {
    hrWeight?: number;
    synergyWeight?: number;
    innateWeight?: number;
  };
  
  // Advanced options
  keyStatPressureBoost?: Record<string, number>;
  minSubs?: number;
  minEff?: number;
  slotRequirements?: {
    [slot: number]: boolean;
  };
}

/**
 * Evaluation policy configuration
 */
export interface EvalPolicy {
  anchorMode: 'hard' | 'soft';
  slotRequirementMode: 'hard' | 'soft';
  minStatsModifier: -1 | 0 | 1;
  minRolePressure: number;
  rolePressureByRole: Record<string, number>;
  minUsefulSubsByRole: Record<string, number>;
  godCountsAsRole: boolean;
  duoCountsAsRole: boolean;
  preset: string;
  godRollMinRatio?: number;
  duoRollMinRatio?: number;
}

/**
 * Fit model configuration
 */
export interface FitModel {
  enabled: boolean;
  scoreScale: number;
  hrWeight: number;
  synergyWeight: number;
  innateWeight: number;
  roleSynergyPairs: Record<string, string[]>;
}

/**
 * Formula evaluation result
 */
export interface FormulaResult {
  formulaId: string;
  passed: boolean;
  score: number;
  details: {
    hrScore: number;
    synergyScore: number;
    innateScore: number;
    rolePressure: number;
    minStatsMet: boolean;
    slotRequirementsMet: boolean;
    efficiencyGatePassed: boolean;
  };
  meta?: Record<string, any>;
}

/**
 * Check if formula is enabled
 */
export function isFormulaEnabled(formulaName: string, settings: { formulas?: Record<string, FormulaConfig> }): boolean {
  return settings.formulas?.[formulaName]?.enabled !== false;
}

/**
 * Check if grade is hero-like (Hero or Rare)
 */
export function isHeroLikeGrade(gradeStr: string): boolean {
  return gradeStr === 'Hero' || gradeStr === 'Rare';
}

/**
 * Get evaluation policy from settings
 */
export function getEvalPolicy(settings: { policy?: Partial<EvalPolicy> }): EvalPolicy {
  const defaultPolicy: EvalPolicy = {
    anchorMode: 'hard',
    slotRequirementMode: 'hard',
    minStatsModifier: 0,
    minRolePressure: 0.58,
    rolePressureByRole: {},
    minUsefulSubsByRole: {},
    godCountsAsRole: true,
    duoCountsAsRole: true,
    preset: 'Custom',
    godRollMinRatio: 1,
    duoRollMinRatio: 1,
  };

  const p = settings?.policy || {};
  const rawMod = Number(p.minStatsModifier);
  const minStatsModifier: -1 | 0 | 1 = rawMod === -1 ? -1 : (rawMod === 1 ? 1 : 0);

  return {
    anchorMode: p.anchorMode === 'soft' ? 'soft' : 'hard',
    slotRequirementMode: p.slotRequirementMode === 'soft' ? 'soft' : 'hard',
    minStatsModifier,
    minRolePressure: Number.isFinite(Number(p.minRolePressure)) ? Math.max(0, Math.min(1, Number(p.minRolePressure))) : 0.58,
    rolePressureByRole: p.rolePressureByRole && typeof p.rolePressureByRole === 'object' ? p.rolePressureByRole : {},
    minUsefulSubsByRole: p.minUsefulSubsByRole && typeof p.minUsefulSubsByRole === 'object' ? p.minUsefulSubsByRole : {},
    godCountsAsRole: p.godCountsAsRole !== false,
    duoCountsAsRole: p.duoCountsAsRole !== false,
    preset: p.preset || defaultPolicy.preset,
    godRollMinRatio: p.godRollMinRatio !== undefined ? p.godRollMinRatio : defaultPolicy.godRollMinRatio,
    duoRollMinRatio: p.duoRollMinRatio !== undefined ? p.duoRollMinRatio : defaultPolicy.duoRollMinRatio,
  };
}

/**
 * Get fit model from settings
 */
export function getFitModel(settings: { fitModel?: Partial<FitModel> }): FitModel {
  const defaultModel: FitModel = {
    enabled: true,
    scoreScale: 100,
    hrWeight: 70,
    synergyWeight: 20,
    innateWeight: 10,
    roleSynergyPairs: {},
  };

  const userFitModel = settings?.fitModel || {};
  return {
    ...defaultModel,
    ...userFitModel,
    enabled: userFitModel.enabled !== undefined ? userFitModel.enabled : defaultModel.enabled,
  };
}

/**
 * Build stat map from rune substats
 */
export function statMap(rune: Rune): Record<string, number> {
  const m: Record<string, number> = {};
  
  for (const s of rune.substats) {
    if (s.source === 'innate') continue;
    const lineVal = s.val + s.grind;
    m[s.name] = (m[s.name] || 0) + lineVal;
  }
  
  return m;
}

/**
 * Compute role pressure based on included stats
 */
export function computeRolePressure(
  includedStats: string[],
  sm: Record<string, number>,
  settings: { hrThresholds?: Record<string, Record<string, number>> },
  stage: string,
  gradeStr: string,
  formulaConfig?: FormulaConfig
): number {
  const key = modeKey(stage as any, gradeStr as any);
  const th = settings?.hrThresholds || {};
  
  let sum = 0;
  let count = 0;
  
  for (const stat of includedStats) {
    const have = Number(sm[stat] || 0);
    const need = Number(th[stat]?.[key] || 0);
    if (need <= 0) continue;
    
    // Apply per-stat pressure boost if configured
    const boost = formulaConfig?.keyStatPressureBoost?.[stat];
    const effectiveHave = boost ? have * boost : have;
    const ratio = Math.max(0, Math.min(1.2, effectiveHave / need));
    
    sum += ratio;
    count++;
  }
  
  if (!count) return 0;
  return sum / count;
}

/**
 * Check accepted main stats for a formula
 */
export function checkAcceptedMains(rune: Rune, formula: FormulaConfig): boolean {
  const slot = rune.slot;
  if (![2, 4, 6].includes(slot)) return true;
  
  const accepted = formula.acceptedMains?.[slot];
  const mainName = rune.mainName;
  
  // Standard accepted mains check
  if (!accepted || accepted.length === 0) return true;
  
  if (typeof accepted === 'string') {
    const raw = accepted.trim();
    if (raw && raw !== 'None') {
      return raw.includes(mainName);
    }
  } else {
    const validMains = accepted.filter(x => x && x !== 'None');
    if (validMains.length > 0 && validMains.includes(mainName)) {
      return true;
    }
  }
  
  // Check conditional mains
  const conditionals = formula.conditionalMains?.[slot];
  if (conditionals && Array.isArray(conditionals)) {
    const sm = statMap(rune);
    for (const cond of conditionals) {
      if (cond.main !== mainName) continue;
      const subVal = Number(sm[cond.requireSub] || 0);
      const minVal = Number(cond.minSubValue || 1);
      if (subVal >= minVal) return true;
    }
  }
  
  return false;
}

/**
 * Evaluate a formula against a rune
 */
export function evaluateFormula(
  rune: Rune,
  formula: FormulaConfig,
  settings: {
    hrThresholds?: Record<string, Record<string, number>>;
    policy?: Partial<EvalPolicy>;
    fitModel?: Partial<FitModel>;
  },
  stage: string,
  gradeStr: string
): FormulaResult {
  const sm = statMap(rune);
  const policy = getEvalPolicy(settings);
  const fitModel = getFitModel(settings);
  
  // Extract included stats
  const includedStats: string[] = [];
  for (const [statName, stages] of Object.entries(formula.substats || {})) {
    const stageValue = stages[stage];
    if (stageValue === 'Include') {
      includedStats.push(statName);
    }
  }
  
  // Calculate role pressure
  const rolePressure = computeRolePressure(includedStats, sm, settings, stage, gradeStr, formula);
  
  // Check main stat requirements
  const slotRequirementsMet = checkAcceptedMains(rune, formula);
  
  // Check efficiency gate
  const efficiencyGatePassed = !formula.minEff || rune.eff >= formula.minEff;
  
  // Calculate score components
  const hrScore = fitModel.hrWeight * rolePressure;
  const synergyScore = fitModel.synergyWeight * (slotRequirementsMet ? 1 : 0);
  const innateScore = fitModel.innateWeight * (rune.innType ? 1 : 0);
  
  const totalScore = (hrScore + synergyScore + innateScore) * (fitModel.scoreScale / 100);
  
  // Determine if passed
  const passed = 
    slotRequirementsMet &&
    efficiencyGatePassed &&
    rolePressure >= policy.minRolePressure;
  
  return {
    formulaId: formula.id,
    passed,
    score: totalScore,
    details: {
      hrScore,
      synergyScore,
      innateScore,
      rolePressure,
      minStatsMet: true, // Simplified for now
      slotRequirementsMet,
      efficiencyGatePassed,
    },
  };
}