// src/features/monsters/state.ts - Constants and module state
// Migrated from js/features/monsters/monsters-state.js

/**
 * Storage keys
 */
export const MONSTERS_FILTER_STORAGE_KEY = 'swrm_monsters_filters_v2';
export const MONSTERS_UNIT_META_KEY = 'swrm_monsters_unit_meta_v1';
export const MONSTERS_TAGS_REGISTRY_KEY = 'swrm_monsters_tags_registry_v1';
export const MONSTERS_SELECTED_KEY = 'swrm_monsters_selected_unit_v1';
export const MONSTERS_VIEW_KEY = 'swrm_monsters_view_v1';
export const MONSTERS_BULK_SEL_KEY = 'swrm_monsters_bulk_sel_v1';
export const MONSTERS_TABLE_SORT_KEY = 'swrm_monsters_table_sort_v1';

/**
 * Element order
 */
export const ELEMENT_ORDER = ['Fire', 'Water', 'Wind', 'Light', 'Dark'] as const;

/**
 * Monster role order
 */
export const MONSTER_ROLE_ORDER = ['HP', 'Attack', 'Defense', 'Support'] as const;

/**
 * Constants
 */
export const MAX_UNIT_TAGS = 12;
export const MAX_TAG_LEN = 32;

/**
 * Table sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Table sort state
 */
export interface TableSort {
  col: string;
  dir: SortDirection;
}

/**
 * Reset monsters table sort
 */
export function resetMonstersTableSort(): void {
  // In real implementation, this would reset global state
  console.log('resetMonstersTableSort');
}
