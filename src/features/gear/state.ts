// src/features/gear/state.ts - Gear module constants
// Migrated from js/features/gear

/**
 * Storage keys
 */
export const GEAR_FILTER_STORAGE_KEY = 'swrm_gear_filters_v1';
export const ARTIFACTS_FILTER_STORAGE_KEY = 'swrm_artifacts_filters_v1';
export const RELICS_FILTER_STORAGE_KEY = 'swrm_relics_filters_v1';

/**
 * Gear types
 */
export type GearType = 'rune' | 'artifact' | 'relic';

/**
 * Get storage key for gear type
 */
export function getGearStorageKey(type: GearType): string {
  switch (type) {
    case 'artifact':
      return ARTIFACTS_FILTER_STORAGE_KEY;
    case 'relic':
      return RELICS_FILTER_STORAGE_KEY;
    case 'rune':
    default:
      return GEAR_FILTER_STORAGE_KEY;
  }
}
