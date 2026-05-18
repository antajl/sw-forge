// js/features/monsters/monsters-storage.js — local metadata storage
  function fmtRuneStatVal(type, val, slotNo) {
    const n = Number(val);
    if (!Number.isFinite(n)) return '0';
    const flatFn =
      window.SWRM && typeof window.SWRM.isMainStatFlat === 'function'
        ? window.SWRM.isMainStatFlat
        : window.SWRM && typeof window.SWRM.isFlat === 'function'
          ? (slot, typeId) => window.SWRM.isFlat(typeId)
          : () => false;
    return flatFn(slotNo, type) ? String(Math.round(n)) : `${n}%`;
  }

  function readMonstersFilters() {
    const defaults = {
      q: '',
      element: '',
      location: 'all',
      sort: 'name',
      fullSixOnly: false,
      skillFilter: '',
      runeFilter: '',
      runeSet: '',
      tagFilter: '',
      roleFilter: '',
      markFilter: '',
    };
    try {
      const raw = localStorage.getItem(MONSTERS_FILTER_STORAGE_KEY);
      if (!raw) return defaults;
      const o = JSON.parse(raw);
      return {
        q: o.q != null ? String(o.q) : '',
        element: o.element != null ? String(o.element) : '',
        location: o.location != null ? String(o.location) : 'all',
        sort: o.sort != null ? String(o.sort) : 'name',
        fullSixOnly: !!o.fullSixOnly,
        skillFilter: o.skillFilter != null ? String(o.skillFilter) : '',
        runeFilter: o.runeFilter != null ? String(o.runeFilter) : '',
        runeSet: o.runeSet != null ? String(o.runeSet) : '',
        tagFilter: o.tagFilter != null ? String(o.tagFilter) : '',
        roleFilter: o.roleFilter != null ? String(o.roleFilter) : '',
        markFilter: o.markFilter != null ? String(o.markFilter) : '',
      };
    } catch (e) {
      return defaults;
    }
  }

  function writeMonstersFilters(f) {
    try {
      localStorage.setItem(MONSTERS_FILTER_STORAGE_KEY, JSON.stringify(f));
    } catch (e) { /* ignore */ }
  }

  function readMonstersUnitMeta() {
    try {
      const raw = localStorage.getItem(MONSTERS_UNIT_META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeMonstersUnitMeta(map) {
    try {
      localStorage.setItem(MONSTERS_UNIT_META_KEY, JSON.stringify(map));
    } catch (e) { /* ignore */ }
  }

  function normalizeCustomTag(name) {
    return String(name || '')
      .trim()
      .slice(0, MAX_TAG_LEN);
  }

  function isUnitMetaEmpty(row) {
    if (!row || typeof row !== 'object') return true;
    if (row.favorite || row.food || row.storageMark) return false;
    if (Array.isArray(row.tags) && row.tags.length) return false;
    return true;
  }

  function unitMetaFor(unitId) {
    const map = readMonstersUnitMeta();
    const row = map[String(unitId)] || {};
    const tags = Array.isArray(row.tags)
      ? row.tags.map(normalizeCustomTag).filter(Boolean)
      : [];
    return {
      favorite: !!row.favorite,
      food: !!row.food,
      storageMark: !!row.storageMark,
      tags,
    };
  }

  function setUnitMetaFlag(unitId, key, on) {
    const map = readMonstersUnitMeta();
    const id = String(unitId);
    if (!map[id]) map[id] = {};
    if (on) map[id][key] = true;
    else delete map[id][key];
    if (isUnitMetaEmpty(map[id])) delete map[id];
    writeMonstersUnitMeta(map);
  }

  function toggleUnitMetaFlag(unitId, flagKey) {
    const cur = unitMetaFor(unitId);
    const on = !cur[flagKey];
    setUnitMetaFlag(unitId, flagKey, on);
    return on;
  }

  function readTagsRegistry() {
    try {
      const raw = localStorage.getItem(MONSTERS_TAGS_REGISTRY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return [...new Set(arr.map(normalizeCustomTag).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      );
    } catch (e) {
      return [];
    }
  }

  function writeTagsRegistry(list) {
    const uniq = [...new Set(list.map(normalizeCustomTag).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
    try {
      localStorage.setItem(MONSTERS_TAGS_REGISTRY_KEY, JSON.stringify(uniq));
    } catch (e) { /* ignore */ }
    return uniq;
  }

  function registerCustomTag(name) {
    const n = normalizeCustomTag(name);
    if (!n) return readTagsRegistry();
    const list = readTagsRegistry();
    if (!list.includes(n)) list.push(n);
    return writeTagsRegistry(list);
  }

  function setUnitCustomTags(unitId, tags) {
    const map = readMonstersUnitMeta();
    const id = String(unitId);
    const norm = [...new Set(tags.map(normalizeCustomTag).filter(Boolean))].slice(0, MAX_UNIT_TAGS);
    if (!map[id]) map[id] = {};
    if (norm.length) map[id].tags = norm;
    else delete map[id].tags;
    if (isUnitMetaEmpty(map[id])) delete map[id];
    writeMonstersUnitMeta(map);
    norm.forEach((t) => registerCustomTag(t));
  }

  function addUnitCustomTag(unitId, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    const cur = unitMetaFor(unitId).tags;
    if (cur.includes(n)) return;
    setUnitCustomTags(unitId, [...cur, n]);
  }

  function removeUnitCustomTag(unitId, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    setUnitCustomTags(
      unitId,
      unitMetaFor(unitId).tags.filter((t) => t !== n),
    );
    pruneUnusedTagsRegistry();
  }

  function pruneUnusedTagsRegistry() {
    const registry = readTagsRegistry();
    const meta = readMonstersUnitMeta();
    const used = new Set();
    for (const row of Object.values(meta)) {
      if (!row || !Array.isArray(row.tags)) continue;
      for (const name of row.tags) used.add(name);
    }
    const pruned = registry.filter((name) => used.has(name));
    if (pruned.length !== registry.length) writeTagsRegistry(pruned);
  }

  function normalizeArchetype(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const k = s.toLowerCase();
    if (k === 'hp') return 'HP';
    if (k === 'attack' || k === 'atk') return 'Attack';
    if (k === 'defense' || k === 'defence' || k === 'def') return 'Defense';
    if (k === 'support' || k === 'sup') return 'Support';
    if (MONSTER_ROLE_ORDER.includes(s)) return s;
    return s;
  }
