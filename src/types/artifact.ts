// src/types/artifact.ts - Artifact and Relic type definitions
// Based on parsed artifact structure from js/data/gear/parse.js

/**
 * Base interface for avoiding circular imports
 */
export interface BaseArtifact {
  id: number;
  slot: number;
  grade: number;
  [key: string]: any;
}

/**
 * Normalized artifact structure after parsing from SWEX JSON
 */
export interface Artifact extends BaseArtifact {
  // Original SWEX payload for debugging
  _raw: any;
  
  // Core identification
  id: number;
  kind: 'artifact' | 'relic';
  slot: number; // 1-6
  grade: number; // 1-5 (Common to Legend)
  gradeStr: string;
  
  // Artifact-specific
  pieceType: 'attribute' | 'type';
  category: string; // Element or Archetype
  element?: number; // For attribute pieces
  archetype?: number; // For type pieces (unit_style)
  
  // Relic-specific
  relicType?: number;
  relicCategory?: string;
  relicCategoryVerified?: boolean;
  wearLevel?: number; // 0-100 for relics
  
  // Level information
  level: number;
  maxLevel: number;
  
  // Primary effect
  primaryType: number;
  primaryValue: number;
  primaryName: string;
  
  // Secondary effects
  secondaryEffects: Effect[];
  
  // Occupation information
  occupiedType: number;
  occupiedId: number;
  
  // Additional computed properties
  meta?: Record<string, any>;
}

export interface Relic extends Artifact {
  kind: 'relic';
  relicType: number;
  relicCategory: string;
  relicCategoryVerified: boolean;
  wearLevel: number;
}

export interface Effect {
  type: number;
  value: number;
  name: string;
  raw: any;
}

export interface ArtifactFilter {
  kind?: ('artifact' | 'relic')[];
  pieceTypes?: ('attribute' | 'type')[];
  grades?: number[];
  slots?: number[];
  minLevel?: number;
  maxLevel?: number;
  categories?: string[];
  elements?: number[];
  archetypes?: number[];
  relicTypes?: number[];
  minWearLevel?: number;
  maxWearLevel?: number;
  primaryTypes?: number[];
  secondaryTypes?: number[];
}

export interface ArtifactSort {
  field: keyof Artifact;
  direction: 'asc' | 'desc';
}