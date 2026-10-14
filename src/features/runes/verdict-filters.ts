// src/features/runes/verdict-filters.ts - Verdict and grade navigation/filtering
// Migrated from js/features/runes/verdict-filters.js

import type { Rune } from '../../types/rune';

/**
 * Get visible runes after applying filters
 */
export function getVisibleRunes(processedRunes: Rune[], options: {
  minLevel?: number;
  gradeMin?: number;
  gradeMax?: number;
}): Rune[] {
  const {
    minLevel = 0,
    gradeMin = 0,
    gradeMax = 6,
  } = options;

  const DELETED_RUNES_KEY = 'swrm_deleted_runes_v1';
  let deletedRunes = new Set<string>();
  try {
    const stored = localStorage.getItem(DELETED_RUNES_KEY);
    if (stored) {
      deletedRunes = new Set(JSON.parse(stored));
    }
  } catch (e) {
    deletedRunes = new Set();
  }

  return processedRunes.filter((r) => {
    if (r.level < minLevel) return false;
    const g = typeof r.grade === 'number' ? r.grade : 0;
    if (g < gradeMin || g > gradeMax) return false;
    if (r.id != null && deletedRunes.has(String(r.id))) return false;
    return true;
  });
}

/**
 * Verdict label mapping for UI
 */
const VERDICT_LABEL_MAP: Record<string, string> = {
  Keep: 'keep',
  Sell: 'sell',
  Grind: 'grind',
  Finish: 'finish',
  Reapp: 'reapp',
  Upgrade: 'upgrade',
  Gem: 'gem',
};

/**
 * Get UI label for verdict
 */
export function verdictUiLabel(t: Record<string, string>, verdictKey: string): string {
  const lk = VERDICT_LABEL_MAP[verdictKey];
  return lk ? (t[lk] || verdictKey) : verdictKey;
}

/**
 * Filter partial options for navigation
 */
export interface FilterPartial {
  clearSearch?: boolean;
  verdict?: string;
  role?: string;
  gradeStr?: string;
  set?: string;
  slot?: string;
}

/**
 * Navigate to rune table with filters applied
 */
export function navigateToRuneTableWithFilters(partial: FilterPartial): void {
  const fv = document.getElementById('filter-verdict') as HTMLInputElement;
  const fr = document.getElementById('filter-role') as HTMLInputElement;
  const fg = document.getElementById('filter-grade') as HTMLInputElement;
  const fs = document.getElementById('filter-set') as HTMLInputElement;
  const fsl = document.getElementById('filter-slot') as HTMLInputElement;
  
  if (partial.clearSearch) {
    const sb = document.getElementById('search-box') as HTMLInputElement;
    if (sb) sb.value = '';
  }
  if (fv && Object.prototype.hasOwnProperty.call(partial, 'verdict')) {
    fv.value = partial.verdict || '';
  }
  if (fr && Object.prototype.hasOwnProperty.call(partial, 'role')) {
    fr.value = partial.role || '';
  }
  if (fg && Object.prototype.hasOwnProperty.call(partial, 'gradeStr')) {
    fg.value = partial.gradeStr || '';
  }
  if (fs && Object.prototype.hasOwnProperty.call(partial, 'set')) {
    fs.value = partial.set || '';
  }
  if (fsl && Object.prototype.hasOwnProperty.call(partial, 'slot')) {
    fsl.value = partial.slot || '';
  }
  
  // Note: showMainTab needs to be called from the shell module
  // This is a placeholder for the actual implementation
  console.log('navigateToRuneTableWithFilters', partial);
}

/**
 * Get grade string for dashboard navigation
 * Returns empty string if grade range is not a single grade
 */
export function gradeStrForDashboardNav(gradeMin: number, gradeMax: number): string {
  if (gradeMin === gradeMax) {
    if (gradeMin === 5) return 'Legend';
    if (gradeMin === 4) return 'Hero';
    if (gradeMin === 3) return 'Rare';
  }
  return '';
}
