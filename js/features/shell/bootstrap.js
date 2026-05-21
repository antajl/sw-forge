// js/features/shell/bootstrap.js — UI shell state and preamble
(function() {
  const APP_LANG_KEY = 'swrm_app_lang_v1';

  const { parseSWEX, parseUnits, extractSwexSummary, countAllSwexRunes, processAll,
          STAT_NAMES, SET_NAMES, GRADE_SHORT, saveSettings,
          DEFAULT_STAT_CONSTANTS, DEFAULT_THRESHOLDS, DEFAULT_FORMULAS,
          DEFAULT_ROLES, DEFAULT_REAPP, DEFAULT_GRIND, DEFAULT_GEM_META, TRANSLATIONS } = window.SWRM;

  let allRunes = [];
  let allArtifacts = [];
  let allRelics = [];
  /** 6★ units from last SWEX `unit_list` (see rebuildUnitsFromSwex). */
  let allUnits = [];
  let activeSwexJson = null;
  let processedRunes = [];
  let stage    = 'Mid';
  let sortKey  = 'eff';
  let sortDir  = 'desc';
  /** First paint of Rune Table: this many rows; user can load the rest explicitly. */
  const RUNE_TABLE_PAGE = 500;
  const RUNE_TABLE_SORT_KEYS = new Set([
    'grade', 'set', 'level', 'slot', 'main', 'eff', 'score', 'role', 'verdict', 's1', 's2', 's3', 's4',
  ]);
  const RUNE_TABLE_ANCIENT_ONLY_KEY = 'swrm_rune_table_ancient_only_v1';
  const RUNE_TABLE_HIDE_TARGET_KEY = 'swrm_rune_table_hide_target_v1';
  let runeTableShowAll = false;
  let runeTableApplyingHash = false;
  /** Lowercase search string for highlighting table cells (full query, not debounced). */
  let tableSearchHighlight = '';
  let searchDebounceTimer = null;
  let globalMinLevel = 0;
  let globalGradeMin = 3;
  let globalGradeMax = 5;
  try {
    const _gmin = parseInt(localStorage.getItem('swrm_dashboard_grade_min_v1'), 10);
    const _gmax = parseInt(localStorage.getItem('swrm_dashboard_grade_max_v1'), 10);
    if (_gmin >= 3 && _gmin <= 5 && _gmax >= 3 && _gmax <= 5 && _gmin <= _gmax) {
      globalGradeMin = _gmin;
      globalGradeMax = _gmax;
    } else {
      const _mg = parseInt(localStorage.getItem('swrm_dashboard_min_grade_v1'), 10);
      if (_mg >= 3 && _mg <= 5) {
        globalGradeMin = _mg;
        globalGradeMax = 5;
      }
    }
  } catch (e) { /* ignore */ }
  /** User explicitly expanded the progression panel (`1` = expanded; default collapsed). */
  const STAGE_PROGRESSION_EXPANDED_KEY = 'swrm_stage_progression_expanded_v1';
  const TOP_SPD_STORAGE_KEY = 'swrm_dashboard_top_spd_set_v1';
  const TOP_SPD_DEFAULT_SET = 'Swift';
  const TOP_SPD_PER_SLOT = 5;
  const SPD_SUB_MAX_GRIND = 5;
  /** Slot 2 is % main — SPD sub lines are not tracked in Top SPD. */
  const TOP_SPD_SKIP_SLOT = 2;
  const TOP_SPD_GRID_SLOTS = [1, 3, 4, 5, 6];
  const TOP_SPD_RADAR_VERTICES = TOP_SPD_GRID_SLOTS.length;
  /** SVG viewBox + pentagon layout (larger, centered in host). */
  const TOP_SPD_RADAR_VB_W = 500;
  const TOP_SPD_RADAR_VB_H = 460;
  const TOP_SPD_RADAR_CX = TOP_SPD_RADAR_VB_W / 2;
  const TOP_SPD_RADAR_CY = 232;
  const TOP_SPD_RADAR_R = 132;
  const TOP_SPD_RADAR_LABEL_OFFSET = 50;
  const TOP_SPD_SORT_METRIC_KEY = 'swrm_top_spd_sort_metric_v1';
  const TOP_SPD_SORT_DIR_KEY = 'swrm_top_spd_sort_dir_v1';
  const DASH_UNIFIED_DIST_KEY = 'swrm_dashboard_unified_dist_v1';
  /** Legacy Role/Sets-only toggle — migrated once into {@link DASH_UNIFIED_DIST_KEY}. */
  const DASH_DIST_TAB_LEGACY_KEY = 'swrm_dashboard_dist_tab_v1';
  let currentLang = localStorage.getItem(APP_LANG_KEY) || localStorage.getItem('swrm-lang') || 'en';
  if (!['en', 'ru', 'fr'].includes(currentLang)) currentLang = 'en';
  let currentTheme = localStorage.getItem('swrm-theme') || 'dark';
