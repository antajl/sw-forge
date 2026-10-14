// src/features/shell/bootstrap.ts — UI shell state and preamble

export interface ShellState {
  allRunes: any[];
  allArtifacts: any[];
  allRelics: any[];
  allUnits: any[];
  activeSwexJson: any[] | null;
  processedRunes: any[];
  stage: 'Early' | 'Mid' | 'Late';
  sortKey: string;
  sortDir: 'asc' | 'desc';
  artifactSortKey: string;
  artifactSortDir: 'asc' | 'desc';
  relicSortKey: string;
  relicSortDir: 'asc' | 'desc';
  runeTableShowAll: boolean;
  runeTableApplyingHash: boolean;
  tableSearchHighlight: string;
  globalMinLevel: number;
  globalGradeMin: number;
  globalGradeMax: number;
  currentLang: 'en' | 'ru' | 'fr' | 'zh';
  currentTheme: 'light' | 'dark';
}

export const RUNE_TABLE_PAGE = 200;
export const RUNE_TABLE_SORT_KEYS = new Set([
  'grade', 'set', 'level', 'slot', 'main', 'eff', 'score', 'role', 'verdict', 's1', 's2', 's3', 's4',
]);

export const RUNE_TABLE_ANCIENT_ONLY_KEY = 'swrm_rune_table_ancient_only_v1';
export const RUNE_TABLE_HIDE_TARGET_KEY = 'swrm_rune_table_hide_target_v1';
export const STAGE_PROGRESSION_EXPANDED_KEY = 'swrm_stage_progression_expanded_v1';
export const TOP_SPD_STORAGE_KEY = 'swrm_dashboard_top_spd_set_v1';
export const TOP_SPD_DEFAULT_SET = 'Swift';
export const TOP_SPD_PER_SLOT = 5;
export const SPD_SUB_MAX_GRIND = 5;
export const TOP_SPD_SKIP_SLOT = 2;
export const TOP_SPD_GRID_SLOTS = [1, 3, 4, 5, 6];
export const TOP_SPD_RADAR_VERTICES = TOP_SPD_GRID_SLOTS.length;
export const TOP_SPD_RADAR_VB_W = 500;
export const TOP_SPD_RADAR_VB_H = 460;
export const TOP_SPD_RADAR_CX = TOP_SPD_RADAR_VB_W / 2;
export const TOP_SPD_RADAR_CY = 232;
export const TOP_SPD_RADAR_R = 150;
export const TOP_SPD_RADAR_LABEL_OFFSET = 45;
export const TOP_SPD_SORT_METRIC_KEY = 'swrm_top_spd_sort_metric_v1';
export const TOP_SPD_SORT_DIR_KEY = 'swrm_top_spd_sort_dir_v1';
export const DASH_UNIFIED_DIST_KEY = 'swrm_dashboard_unified_dist_v1';
export const DASH_DIST_TAB_LEGACY_KEY = 'swrm_dashboard_dist_tab_v1';
export const DASH_DIST_KIND_KEY = 'swrm_dashboard_dist_kind_v1';
export const APP_LANG_KEY = 'swrm_app_lang_v1';

let shellState: ShellState = {
  allRunes: [],
  allArtifacts: [],
  allRelics: [],
  allUnits: [],
  activeSwexJson: null,
  processedRunes: [],
  stage: 'Mid',
  sortKey: 'score',
  sortDir: 'desc',
  artifactSortKey: 'forge',
  artifactSortDir: 'desc',
  relicSortKey: 'category',
  relicSortDir: 'asc',
  runeTableShowAll: false,
  runeTableApplyingHash: false,
  tableSearchHighlight: '',
  globalMinLevel: 0,
  globalGradeMin: 3,
  globalGradeMax: 5,
  currentLang: 'en',
  currentTheme: 'dark',
};

export function getShellState(): ShellState {
  return shellState;
}

export function updateShellState(updates: Partial<ShellState>): void {
  shellState = { ...shellState, ...updates };
}

export function initializeShellState(): void {
  try {
    const gmin = parseInt(localStorage.getItem('swrm_dashboard_grade_min_v1') || '0', 10);
    const gmax = parseInt(localStorage.getItem('swrm_dashboard_grade_max_v1') || '0', 10);
    if (gmin >= 3 && gmin <= 5 && gmax >= 3 && gmax <= 5 && gmin <= gmax) {
      shellState.globalGradeMin = gmin;
      shellState.globalGradeMax = gmax;
    } else {
      const mg = parseInt(localStorage.getItem('swrm_dashboard_min_grade_v1') || '0', 10);
      if (mg >= 3 && mg <= 5) {
        shellState.globalGradeMin = mg;
        shellState.globalGradeMax = 5;
      }
    }
  } catch (e) {
    // ignore
  }

  shellState.currentLang = (localStorage.getItem(APP_LANG_KEY) || localStorage.getItem('swrm-lang') || 'en') as 'en' | 'ru' | 'fr' | 'zh';
  if (!['en', 'ru', 'fr', 'zh'].includes(shellState.currentLang)) {
    shellState.currentLang = 'en';
  }

  shellState.currentTheme = (localStorage.getItem('swrm-theme') || 'dark') as 'light' | 'dark';
}

export function initBootstrap(): ShellState {
  initializeShellState();
  return shellState;
}
