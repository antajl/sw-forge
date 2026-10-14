// src/types/guards.ts - Type guard functions
// Runtime type checking utilities for TypeScript types

import type { Rune } from './rune';
import type { Artifact, Relic } from './artifact';
import type { Monster } from './monster';

/**
 * Type guard for Rune objects
 */
export function isRune(obj: any): obj is Rune {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.slot === 'number' &&
    typeof obj.grade === 'number' &&
    Array.isArray(obj.substats)
  );
}

/**
 * Type guard for Artifact objects
 */
export function isArtifact(obj: any): obj is Artifact {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.slot === 'number' &&
    typeof obj.grade === 'number' &&
    typeof obj.kind === 'string' &&
    (obj.kind === 'artifact' || obj.kind === 'relic')
  );
}

/**
 * Type guard for Monster objects
 */
export function isMonster(obj: any): obj is Monster {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'number' &&
    typeof obj.unitMasterId === 'number' &&
    typeof obj.attribute === 'number' &&
    typeof obj.archetype === 'number' &&
    typeof obj.level === 'number'
  );
}

/**
 * Type guard for Relic objects (specific type of Artifact)
 */
export function isRelic(obj: any): obj is Relic {
  return (
    isArtifact(obj) &&
    obj.kind === 'relic' &&
    typeof obj.relicType === 'number' &&
    typeof obj.wearLevel === 'number'
  );
}

/**
 * Type guard for array of specific type
 */
export function isArrayOf<T>(
  arr: any,
  guard: (item: any) => item is T
): arr is T[] {
  return Array.isArray(arr) && arr.every(guard);
}

/**
 * Type guard for record with specific value type
 */
export function isRecordOf<T>(
  obj: any,
  guard: (value: any) => value is T
): obj is Record<string, T> {
  return (
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.values(obj).every(guard)
  );
}