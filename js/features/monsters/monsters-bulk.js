// js/features/monsters/monsters-bulk.js — bulk selection actions
  function bulkSetFoodFlag(unitIds, on) {
    for (const id of unitIds) setUnitMetaFlag(id, 'food', !!on);
  }

  function bulkSetStorageMark(unitIds, on) {
    for (const id of unitIds) setUnitMetaFlag(id, 'storageMark', !!on);
  }

  function bulkToggleFoodFlag(unitIds) {
    if (!unitIds.length) return;
    const allOn = unitIds.every((id) => unitMetaFor(id).food);
    bulkSetFoodFlag(unitIds, !allOn);
  }

  function bulkToggleStorageMark(unitIds) {
    const eligible = unitIds.filter((id) => {
      const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(id));
      return !u || !u.inStorage;
    });
    if (!eligible.length) return;
    const allOn = eligible.every((id) => unitMetaFor(id).storageMark);
    bulkSetStorageMark(eligible, !allOn);
  }

  function bulkToggleFavoriteFlag(unitIds) {
    if (!unitIds.length) return;
    const allOn = unitIds.every((id) => unitMetaFor(id).favorite);
    for (const id of unitIds) setUnitMetaFlag(id, 'favorite', !allOn);
  }

  function bulkAddCustomTag(unitIds, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    for (const id of unitIds) addUnitCustomTag(id, n);
    registerCustomTag(n);
  }

  function readMonstersBulkSelected() {
    try {
      const raw = localStorage.getItem(MONSTERS_BULK_SEL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch (e) {
      return new Set();
    }
  }

  function writeMonstersBulkSelected(set) {
    monstersBulkSelected = set instanceof Set ? set : new Set();
    try {
      localStorage.setItem(
        MONSTERS_BULK_SEL_KEY,
        JSON.stringify([...monstersBulkSelected]),
      );
    } catch (e) { /* ignore */ }
  }

  function toggleMonstersBulkSelect(unitId) {
    const id = String(unitId);
    if (monstersBulkSelected.has(id)) monstersBulkSelected.delete(id);
    else monstersBulkSelected.add(id);
    writeMonstersBulkSelected(monstersBulkSelected);
  }

  function loadMonstersSelectedUnitId() {
    try {
      const raw = sessionStorage.getItem(MONSTERS_SELECTED_KEY);
      return raw ? String(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveMonstersSelectedUnitId(unitId) {
    monstersSelectedUnitId = unitId != null ? String(unitId) : null;
    try {
      if (monstersSelectedUnitId) sessionStorage.setItem(MONSTERS_SELECTED_KEY, monstersSelectedUnitId);
      else sessionStorage.removeItem(MONSTERS_SELECTED_KEY);
    } catch (e) { /* ignore */ }
  }
