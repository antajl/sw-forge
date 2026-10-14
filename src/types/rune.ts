// src/types/rune.ts - Normalized rune type definitions
// Based on parsed rune structure from js/data/parser.js

/**
 * Base interface for avoiding circular imports
 */
export interface BaseRune {
  id: number;
  slot: number;
  grade: number;
  [key: string]: any;
}

/**
 * Normalized rune structure after parsing from SWEX JSON
 */
export interface Rune extends BaseRune {
  // Original SWEX payload for debugging
  _raw: any;
  
  // Core identification
  id: number;
  slot: number; // 1-6
  grade: number; // 1-5 (Common to Legend)
  gradeStr: string;
  
  // Star tier (6 for 6★, derived from class)
  stars: number;
  
  // Ancient rune detection
  isAncient: boolean;
  
  // Set information
  setId: number;
  setName: string;
  
  // Level information
  level: number;
  maxLevel: number;
  
  // Main stat
  mainType: number;
  mainVal: number;
  mainName: string;
  mainFlat: boolean;
  
  // Innate/prefix stat
  innType: number;
  innVal: number;
  innName: string;
  innFlat: boolean;
  
  // Substats
  substats: Substat[];
  
  // Computed metrics
  eff: number; // Efficiency score
  effUncapped: number; // Uncapped efficiency
  
  // Occupation information
  occupiedType: number;
  occupiedId: number;
  
  // Additional computed properties
  meta?: Record<string, any>;
}

export interface Substat {
  type: number;
  name: string;
  val: number; // Base roll value
  gem: number; // Enchant gem value
  grind: number; // Grind bonus
  procs: number; // Upgrade procs
  enchanted: boolean;
  flat: boolean;
  source: 'sub' | 'innate';
}

export interface RuneFilter {
  setIds?: number[];
  grades?: number[];
  slots?: number[];
  minEff?: number;
  maxEff?: number;
  minLevel?: number;
  maxLevel?: number;
  isAncient?: boolean;
  mainTypes?: number[];
  hasInnate?: boolean;
  substatTypes?: number[];
  substatCount?: number;
}

export interface RuneSort {
  field: keyof Rune;
  direction: 'asc' | 'desc';
}