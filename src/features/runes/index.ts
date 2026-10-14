// src/features/runes/index.ts - Runes feature module exports
// Central export point for all runes functionality

// Utils
export {
  escapeHtml,
  normalizeDbSlot,
  defaultEmptyDbSlotsMeta,
  formatSlotSummaryLine,
  clearLocalStorageRuneBackup,
  isRuneEquipped,
  updateToolbarResetButton,
  showToast,
  setSwrmFloatTipTarget,
  initSwrmFloatingTips,
  type DbSlot,
  type ToastOptions,
} from './utils';

// Verdict filters
export {
  getVisibleRunes,
  verdictUiLabel,
  navigateToRuneTableWithFilters,
  gradeStrForDashboardNav,
  type FilterPartial,
} from './verdict-filters';

// Table filters
export {
  isRuneTableRunesTabActive,
  flushRuneTableRenderIfNeeded,
  scheduleRuneTableRender,
  computeRuneTableSummary,
  renderRuneTableRosterChips,
  buildRuneTableQuerySuffix,
  readRuneTableFiltersFromDom,
  countRuneTableActiveFilters,
  runeTableHasActiveFiltersOrSearch,
  canonRuneSearchStatKey,
  normalizeRuneSearchText,
  parseRuneSearchQuery,
  runeStatValueLines,
  runeHaystackWords,
  runeFreeTokensMatchHaystack,
  buildRuneSearchHaystack,
  runeSearchStatTokens,
  runeMatchesSearchQuery,
  runeTableFilterChipDefs,
  clearRuneTableFilterChip,
  renderRuneTableActiveFilterChips,
  updateRuneTableFilterSummary,
  resetRuneTableFilters,
  type RuneTableSummary,
  type RuneTableFilters,
  type FilterChip,
  type SearchQueryResult,
  type StatValueLine,
} from './table-filters';
