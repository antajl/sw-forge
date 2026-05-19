// js/features/monsters/monsters-state.js — constants and module state
  const MONSTERS_FILTER_STORAGE_KEY = 'swrm_monsters_filters_v2';
  const MONSTERS_UNIT_META_KEY = 'swrm_monsters_unit_meta_v1';
  const MONSTERS_TAGS_REGISTRY_KEY = 'swrm_monsters_tags_registry_v1';
  const MONSTERS_SELECTED_KEY = 'swrm_monsters_selected_unit_v1';
  const MONSTERS_VIEW_KEY = 'swrm_monsters_view_v1';
  const MONSTERS_BULK_SEL_KEY = 'swrm_monsters_bulk_sel_v1';
  const MONSTERS_TABLE_SORT_KEY = 'swrm_monsters_table_sort_v1';
  const ELEMENT_ORDER = ['Fire', 'Water', 'Wind', 'Light', 'Dark'];
  const MONSTER_ROLE_ORDER = ['HP', 'Attack', 'Defense', 'Support'];
  const MAX_UNIT_TAGS = 12;
  const MAX_TAG_LEN = 32;

  let monstersSelectedUnitId = null;
  let monstersEnrichedCache = [];
  let monstersVisibleUnitIds = [];
  let monstersDetailHideTimer = null;
  let monstersDetailHoverUnitId = null;
  /** When set, detail panel is pinned in the right sidebar (click to pin). */
  let monstersDetailPinnedUnitId = null;
  /** @type {{ col: string, dir: 'asc'|'desc' }|null} — in-memory only; resets on F5 / tab change */
  let monstersTableSort = null;

  function resetMonstersTableSort() {
    monstersTableSort = null;
  }
  let monstersBulkSelected = new Set();
  let monstersBulkLastIndex = -1;
  let monstersDetailTab = 'info';
  let monstersRuneFocusState = null;
