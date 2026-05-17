// js/monsters/monsters-state.js — constants + module state
  const MONSTERS_FILTER_STORAGE_KEY = 'swrm_monsters_filters_v2';
  const MONSTERS_UNIT_META_KEY = 'swrm_monsters_unit_meta_v1';
  const MONSTERS_TAGS_REGISTRY_KEY = 'swrm_monsters_tags_registry_v1';
  const MONSTERS_SELECTED_KEY = 'swrm_monsters_selected_unit_v1';
  const MONSTERS_VIEW_KEY = 'swrm_monsters_view_v1';
  const MONSTERS_BULK_SEL_KEY = 'swrm_monsters_bulk_sel_v1';
  const ELEMENT_ORDER = ['Fire', 'Water', 'Wind', 'Light', 'Dark'];
  const MONSTER_ROLE_ORDER = ['HP', 'Attack', 'Defense', 'Support'];
  const MAX_UNIT_TAGS = 12;
  const MAX_TAG_LEN = 32;

  let monstersSelectedUnitId = null;
  let monstersEnrichedCache = [];
  let monstersVisibleUnitIds = [];
  let monstersDetailHideTimer = null;
  let monstersDetailHoverUnitId = null;
  let monstersBulkSelected = new Set();
  let monstersBulkLastIndex = -1;
  let monstersDetailTab = 'info';
  let monstersRuneFocusState = null;
