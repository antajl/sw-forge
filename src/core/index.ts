// src/core/index.ts - Core module exports
// Central export point for all core functionality

// Re-export everything from engine-core (which re-exports from other modules)
export * from './engine-core';

// Direct exports for clarity
export {
  GOD_STAT_ORDER,
  HR_COL_KEYS,
  roundThresh,
  type Stage,
  type Grade,
} from './constants';

export { modeKey } from './utils';

export {
  defaultStatConstants,
  mergeStatConstants,
  stageHrValue,
  computeHrThresholds,
  duoLineForStat,
  computeDuoThresholds,
  getGodThreshold,
  type StatConstantRow,
  type StatConstants,
} from './thresholds';

export {
  normalizeGradeRank,
  statName,
  isFlat,
  isMainStatFlat,
  swopEfficiencyLineTerm,
  calcEfficiencyUncapped,
  calcEfficiency,
  parseRune,
  parseSWEX,
  countAllSwexRunes,
} from './parser';

export {
  isFormulaEnabled,
  isHeroLikeGrade,
  getEvalPolicy,
  getFitModel,
  statMap,
  computeRolePressure,
  checkAcceptedMains,
  evaluateFormula,
  type FormulaConfig,
  type EvalPolicy,
  type FitModel,
  type FormulaResult,
} from './formulas';

export {
  checkHighRoll,
  checkDuoRoll,
  evaluateRole,
  getMatchingRoles,
  type RoleConfig,
  type RoleResult,
} from './roles';

export {
  evaluateRune,
  evaluateRunes,
  type EngineContext,
  type EngineResult,
} from './engine-core';