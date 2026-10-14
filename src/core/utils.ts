// src/core/utils.ts - Shared utility functions for core modules
// This file exists to avoid circular dependencies between modules

/**
 * Get the threshold key string for a given stage + grade
 */
export function modeKey(stage: string, grade: string): string {
  const g = grade === 'Legend' ? 'Leg' : 'Hero';
  return `${stage}_${g}`;
}