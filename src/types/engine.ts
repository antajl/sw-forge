// src/types/engine.ts - Engine and computation types
// Based on engine-core.js and engine processing logic

export interface EngineConfig {
  // Threshold configuration
  hrThresholds: ThresholdMap;
  
  // Stage configuration
  stage: Stage;
  
  // Formula configuration
  formulas: FormulaMap;
  
  // Role configuration
  roles: RoleMap;
  
  // Additional engine settings
  [key: string]: any;
}

export interface ThresholdMap {
  [statName: string]: {
    [stageKey: string]: number;
  };
}

export interface Stage {
  id: string;
  name: string;
  label: string;
  description?: string;
}

export interface FormulaMap {
  [formulaId: string]: Formula;
}

export interface Formula {
  id: string;
  name: string;
  description?: string;
  substats: {
    [statName: string]: {
      [stage: string]: 'Include' | 'Exclude' | 'Penalty';
    };
  };
  weights?: {
    [statName: string]: number;
  };
  [key: string]: any;
}

export interface RoleMap {
  [roleId: string]: Role;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  attributes?: number[];
  archetypes?: number[];
  preferredSlots?: number[];
  preferredSets?: number[];
  requiredStats?: string[];
  penaltyStats?: string[];
  formulas?: string[];
  [key: string]: any;
}

export interface EngineResult {
  // Computed metrics
  efficiency: number;
  powerLevel: number; // 0-3
  hasHrAnchor: boolean;
  
  // Stat calculations
  statMap: StatMap;
  
  // Formula-specific results
  formulaResults?: {
    [formulaId: string]: FormulaResult;
  };
  
  // Role-specific results
  roleResults?: {
    [roleId: string]: RoleResult;
  };
  
  // Additional computed properties
  meta?: Record<string, any>;
}

export interface StatMap {
  [statName: string]: number;
}

export interface FormulaResult {
  score: number;
  passed: boolean;
  hasHrAnchor: boolean;
  qualifyingStats: string[];
  penalties: string[];
  meta?: Record<string, any>;
}

export interface RoleResult {
  score: number;
  matched: boolean;
  formulaScores: {
    [formulaId: string]: number;
  };
  statMatches: {
    [statName: string]: boolean;
  };
  meta?: Record<string, any>;
}

export interface EngineContext {
  config: EngineConfig;
  rune: any; // Rune type
  monster?: any; // Monster type
  settings?: any; // Settings type
  [key: string]: any;
}