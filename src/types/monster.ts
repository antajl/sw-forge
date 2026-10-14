// src/types/monster.ts - Monster type definitions
// Based on SWEX unit structure and monster database

// Forward declare equipment types to avoid circular imports
export interface BaseRune {
  id: number;
  slot: number;
  grade: number;
  [key: string]: any;
}

export interface BaseArtifact {
  id: number;
  slot: number;
  grade: number;
  [key: string]: any;
}

export interface Monster {
  // Core identification
  id: number;
  unitMasterId: number;
  name: string;
  imageFilename: string;
  
  // Base stats
  attribute: number; // 1=Water, 2=Fire, 3=Wind, 4=Light, 5=Dark
  archetype: number; // 1=Attack, 2=Defense, 3=HP, 4=Support
  class: number; // 1-6 (star tier)
  level: number;
  
  // Current stats (from SWEX)
  con: number; // HP
  atk: number;
  def: number;
  spd: number;
  resist: number;
  accuracy: number;
  criticalRate: number;
  criticalDamage: number;
  
  // Progression
  experience: number;
  expGained: number;
  expGainRate: number;
  
  // Skills
  skills: Skill[];
  
  // Equipment (using base types to avoid circular imports)
  runes: BaseRune[];
  artifacts: BaseArtifact[];
  
  // Position/Location
  islandId: number;
  posX: number;
  posY: number;
  buildingId: number;
  
  // Additional computed properties
  meta?: Record<string, any>;
}

export interface Skill {
  id: number;
  level: number;
  name?: string;
  description?: string;
  cooldown?: number;
  multiplier?: number;
  [key: string]: any;
}

export interface MonsterFilter {
  attributes?: number[];
  archetypes?: number[];
  classes?: number[];
  minLevel?: number;
  maxLevel?: number;
  minCon?: number;
  maxCon?: number;
  minAtk?: number;
  maxAtk?: number;
  minDef?: number;
  maxDef?: number;
  minSpd?: number;
  maxSpd?: number;
  hasRunes?: boolean;
  hasArtifacts?: boolean;
  skillIds?: number[];
}

export interface MonsterSort {
  field: keyof Monster;
  direction: 'asc' | 'desc';
}