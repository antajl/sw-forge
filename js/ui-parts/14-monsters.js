// ui-parts/14-monsters.js — Monsters tab (6★ roster + detail panel)
  const MONSTERS_FILTER_STORAGE_KEY = 'swrm_monsters_filters_v2';
  const MONSTERS_UNIT_META_KEY = 'swrm_monsters_unit_meta_v1';
  const MONSTERS_TAGS_REGISTRY_KEY = 'swrm_monsters_tags_registry_v1';
  const MONSTERS_SELECTED_KEY = 'swrm_monsters_selected_unit_v1';
  const MONSTERS_VIEW_KEY = 'swrm_monsters_view_v1';
  const MONSTERS_BULK_MODE_KEY = 'swrm_monsters_bulk_mode_v1';
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
  let monstersBulkMode = false;
  let monstersBulkSelected = new Set();
  let monstersBulkLastIndex = -1;
  let monstersDetailTab = 'info';

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

  function bulkSetFoodFlag(unitIds, on) {
    for (const id of unitIds) setUnitMetaFlag(id, 'food', !!on);
  }

  function bulkSetStorageMark(unitIds, on) {
    for (const id of unitIds) setUnitMetaFlag(id, 'storageMark', !!on);
  }

  function bulkAddCustomTag(unitIds, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    for (const id of unitIds) addUnitCustomTag(id, n);
    registerCustomTag(n);
  }

  function readMonstersBulkMode() {
    try {
      return localStorage.getItem(MONSTERS_BULK_MODE_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function writeMonstersBulkMode(on) {
    monstersBulkMode = !!on;
    try {
      localStorage.setItem(MONSTERS_BULK_MODE_KEY, monstersBulkMode ? '1' : '0');
    } catch (e) { /* ignore */ }
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

  function bindMonsterPortrait(img, imageFilename) {
    if (!img || !imageFilename || !window.SWRM_MONSTER_DB) return;
    const db = window.SWRM_MONSTER_DB;
    let base = 0;
    img.onerror = () => {
      base += 1;
      if (base < db.IMG_BASES.length) {
        img.src = db.monsterImageUrl(imageFilename, base);
      } else {
        img.removeAttribute('src');
        img.classList.add('monsters-card__img--placeholder');
      }
    };
    img.referrerPolicy = 'no-referrer';
    img.src = db.monsterImageUrl(imageFilename, 0);
  }

  function elementClass(el) {
    const k = String(el || '').toLowerCase();
    if (k === 'fire' || k === 'water' || k === 'wind' || k === 'light' || k === 'dark') return k;
    return '';
  }

  function unitHasRuneSet(u, setName) {
    if (!setName) return true;
    for (const slot of u.runeSlots || []) {
      if (slot.rune && slot.rune.setName === setName) return true;
    }
    return false;
  }

  function filterMonstersList(units, filters) {
    const q = (filters.q || '').trim().toLowerCase();
    const el = filters.element || '';
    const loc = filters.location || 'all';
    const fullSixOnly = !!filters.fullSixOnly;
    const skillFilter = filters.skillFilter || '';
    const runeFilter = filters.runeFilter || '';
    const runeSet = filters.runeSet || '';
    const tagFilter = filters.tagFilter || '';
    const roleFilter = filters.roleFilter || '';
    const markFilter = filters.markFilter || '';
    return units.filter((u) => {
      if (fullSixOnly && !u.hasFullRunes) return false;
      if (el && u.metaElement !== el) return false;
      if (loc === 'active' && u.inStorage) return false;
      if (loc === 'storage' && !u.inStorage) return false;
      if (skillFilter === 'maxed') {
        if (!u.skillsKnown || !u.skillsMaxed) return false;
      } else if (skillFilter === 'needs-up') {
        if (u.skillUpsNeeded <= 0) return false;
      }
      if (runeFilter === 'unruned') {
        if (u.equippedCount > 0) return false;
      } else if (runeFilter === 'partial') {
        if (u.equippedCount <= 0 || u.hasFullRunes) return false;
      }
      if (runeSet && !unitHasRuneSet(u, runeSet)) return false;
      if (tagFilter && !(u.customTags || []).includes(tagFilter)) return false;
      if (roleFilter && normalizeArchetype(u.metaArchetype) !== roleFilter) return false;
      if (markFilter === 'favorite' && !u.favorite) return false;
      if (markFilter === 'food' && !u.food) return false;
      if (q) {
        const hay = `${u.displayName || ''} ${u.masterId}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function sortMonstersList(units, sortKey) {
    const list = units.slice();
    const elIdx = (el) => {
      const i = ELEMENT_ORDER.indexOf(el);
      return i === -1 ? 99 : i;
    };
    list.sort((a, b) => {
      switch (sortKey) {
        case 'level-desc':
          return b.level - a.level || String(a.displayName).localeCompare(String(b.displayName));
        case 'level-asc':
          return a.level - b.level || String(a.displayName).localeCompare(String(b.displayName));
        case 'runes-desc':
          return b.equippedCount - a.equippedCount || String(a.displayName).localeCompare(String(b.displayName));
        case 'element':
          return elIdx(a.metaElement) - elIdx(b.metaElement)
            || String(a.displayName).localeCompare(String(b.displayName));
        case 'favorite-first':
          return (
            (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
            || (b.food ? 1 : 0) - (a.food ? 1 : 0)
            || String(a.displayName).localeCompare(String(b.displayName))
          );
        case 'food-first':
          return (
            (b.food ? 1 : 0) - (a.food ? 1 : 0)
            || (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
            || String(a.displayName).localeCompare(String(b.displayName))
          );
        case 'name':
        default:
          return String(a.displayName).localeCompare(String(b.displayName));
      }
    });
    return list;
  }

  function computeMonstersSummary(units) {
    const total = units.length;
    let anyRune = 0;
    let fullSix = 0;
    let skillUpsTotal = 0;
    for (const u of units) {
      if (u.equippedCount > 0) anyRune += 1;
      if (u.hasFullRunes) fullSix += 1;
      if (u.skillUpsNeeded > 0) skillUpsTotal += u.skillUpsNeeded;
    }
    return { total, anyRune, fullSix, skillUpsTotal };
  }

  function renderMonstersChips(sum, t, indexMissing, skillsIndexMissing) {
    const chips = document.getElementById('monsters-chips');
    if (!chips) return;
    const tpl =
      t.monstersStatsTpl || '{total} six-star · {any} with any rune · {full} with 6 runes';
    const parts = [
      { label: t.monstersChipTotal || '6★', value: sum.total },
      { label: t.monstersChipRunes || 'With runes', value: sum.anyRune },
      { label: t.monstersChipFull || '6/6', value: sum.fullSix },
    ];
    if (sum.skillUpsTotal > 0) {
      parts.push({
        label: t.monstersChipSkillUps || 'Skill-ups needed',
        value: sum.skillUpsTotal,
      });
    }
    chips.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
    if (indexMissing) {
      const hint =
        t.monstersIndexMissing ||
        'Monster names need data/monsters-index.json — run: node tools/fetch-monsters-index.mjs';
      chips.insertAdjacentHTML(
        'beforeend',
        `<p class="monsters-index-warn monsters-index-warn--inline">${escapeHtml(hint)}</p>`,
      );
    }
    if (skillsIndexMissing) {
      const hint =
        t.monstersSkillsIndexMissing ||
        'Skill max levels need data/skills-index.json — run: node tools/fetch-skills-index.mjs';
      chips.insertAdjacentHTML(
        'beforeend',
        `<p class="monsters-index-warn monsters-index-warn--inline">${escapeHtml(hint)}</p>`,
      );
    }
    const statsEl = document.getElementById('monsters-stats');
    if (statsEl) statsEl.hidden = true;
  }

  function readMonstersView() {
    try {
      return localStorage.getItem(MONSTERS_VIEW_KEY) === 'list' ? 'list' : 'cards';
    } catch (e) {
      return 'cards';
    }
  }

  function writeMonstersView(view) {
    try {
      localStorage.setItem(MONSTERS_VIEW_KEY, view === 'list' ? 'list' : 'cards');
    } catch (e) { /* ignore */ }
  }

  function syncMonstersShowAllButton(fullSixOnly, t) {
    const btn = document.getElementById('monsters-filter-full-six');
    const lbl = document.getElementById('lbl-monsters-filter-full-six');
    if (!btn) return;
    const hideUnruned = !!fullSixOnly;
    btn.classList.toggle('monsters-toolbar-btn--active', hideUnruned);
    btn.setAttribute('aria-pressed', hideUnruned ? 'true' : 'false');
    const text = hideUnruned
      ? t.monstersFilterShowAll || 'Show all monsters'
      : t.monstersFilterSixOnly || '6/6 runes only';
    if (lbl) lbl.textContent = text;
    else btn.textContent = text;
  }

  function syncMonstersViewToggle(view) {
    const grid = document.getElementById('monsters-grid');
    if (grid) {
      grid.classList.toggle('monsters-grid--list', view === 'list');
      grid.classList.toggle('monsters-grid--cards', view !== 'list');
    }
    const btnCards = document.getElementById('monsters-view-cards');
    const btnList = document.getElementById('monsters-view-list');
    if (btnCards) {
      btnCards.classList.toggle('monsters-view-btn--active', view === 'cards');
      btnCards.setAttribute('aria-pressed', view === 'cards' ? 'true' : 'false');
    }
    if (btnList) {
      btnList.classList.toggle('monsters-view-btn--active', view === 'list');
      btnList.setAttribute('aria-pressed', view === 'list' ? 'true' : 'false');
    }
  }

  function cancelMonstersDetailHide() {
    if (monstersDetailHideTimer) {
      clearTimeout(monstersDetailHideTimer);
      monstersDetailHideTimer = null;
    }
  }

  function scheduleMonstersDetailHide() {
    cancelMonstersDetailHide();
    monstersDetailHideTimer = setTimeout(() => {
      monstersDetailHideTimer = null;
      hideMonstersDetailFloat();
    }, 140);
  }

  function hideMonstersDetailFloat() {
    const aside = document.getElementById('monsters-detail');
    if (aside) {
      aside.hidden = true;
      aside.classList.remove('monsters-detail--visible');
      aside.style.removeProperty('left');
      aside.style.removeProperty('top');
    }
    monstersDetailHoverUnitId = null;
    document.querySelectorAll('.monsters-card--hover').forEach((c) => {
      c.classList.remove('monsters-card--hover');
    });
  }

  function positionMonstersDetailFloat(anchorEl) {
    const aside = document.getElementById('monsters-detail');
    if (!aside || !anchorEl) return;
    aside.hidden = false;
    aside.classList.add('monsters-detail--visible');
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const pad = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = aside.offsetWidth || 320;
      const h = aside.offsetHeight || 400;
      let left = rect.right + pad;
      let top = rect.top;
      if (left + w > vw - pad) left = rect.left - w - pad;
      if (left < pad) left = Math.max(pad, (vw - w) / 2);
      if (top + h > vh - pad) top = Math.max(pad, vh - h - pad);
      if (top < pad) top = pad;
      aside.style.left = `${Math.round(left)}px`;
      aside.style.top = `${Math.round(top)}px`;
    };
    requestAnimationFrame(() => requestAnimationFrame(place));
  }

  function bindMonstersDetailFloat() {
    const aside = document.getElementById('monsters-detail');
    if (!aside || aside.dataset.floatBound === '1') return;
    aside.dataset.floatBound = '1';
    aside.addEventListener('mouseenter', cancelMonstersDetailHide);
    aside.addEventListener('mouseleave', scheduleMonstersDetailHide);
    const reposition = () => {
      const uid = monstersDetailHoverUnitId;
      const card = uid
        ? document.querySelector(`.monsters-card[data-unit-id="${String(uid).replace(/"/g, '\\"')}"]`)
        : null;
      if (card && !aside.hidden) positionMonstersDetailFloat(card);
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  }

  function formatMonsterRuneTooltip(r, t) {
    if (!r) return '';
    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const isFlat =
      window.SWRM && typeof window.SWRM.isFlat === 'function'
        ? window.SWRM.isFlat
        : () => false;
    const fmtVal = (type, val) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return '0';
      return isFlat(type) ? String(Math.round(n)) : `${n}%`;
    };
    const parts = [];
    const hdr = [r.setName, `+${r.level || 0}`, r.gradeStr || ''].filter(Boolean).join(' ');
    if (hdr) parts.push(hdr);
    if (r.mainName) parts.push(`${r.mainName} ${fmtVal(r.mainType, r.mainVal)}`);
    if (r.innate_name && r.innate_val) {
      parts.push(
        `${t.monstersRuneInnate || 'Inn'} ${r.innate_name} ${fmtVal(r.innate_type, r.innate_val)}`,
      );
    }
    for (const s of r.substats || []) {
      let line = `${s.name} +${subFn(s)}`;
      if (s.enchanted) line += ' *';
      if (Number(s.grind) > 0) line += ` (+${s.grind})`;
      parts.push(line);
    }
    if (Number.isFinite(r.eff)) {
      parts.push(`${t.monstersRuneEff || 'Eff'} ${(Math.round(r.eff * 10) / 10).toFixed(1)}%`);
    }
    return parts.join(' · ');
  }

  function bindMonsterRuneTooltips(root, unit, t) {
    if (!root || !unit || typeof setSwrmFloatTipTarget !== 'function') return;
    root.querySelectorAll('[data-slot]').forEach((el) => {
      const slotNo = Number(el.getAttribute('data-slot'));
      if (!Number.isFinite(slotNo)) return;
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      const tip = slot && slot.rune ? formatMonsterRuneTooltip(slot.rune, t) : '';
      setSwrmFloatTipTarget(el, tip);
    });
  }

  function buildLocationIconHtml(u, t) {
    if (!u.inStorage) return '';
    const label = t.monstersLocationStorage || 'Storage';
    return `<span class="monsters-card__loc monsters-card__loc--storage monsters-card__loc--on" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="monsters-card__loc-icon" aria-hidden="true"></span><span class="monsters-card__loc-text">${escapeHtml(label)}</span></span>`;
  }

  function buildCustomTagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return `<span class="monsters-card__tags">${tags
      .map((tag) => `<span class="monsters-card__tag">${escapeHtml(tag)}</span>`)
      .join('')}</span>`;
  }

  function buildMonsterStatsHtml(u, t) {
    const s = u.stats;
    if (!s) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoStats || 'No stat data in SWEX.')}</p>`;
    }
    const rows = [
      [t.monstersStatHp || 'HP', s.hp],
      [t.monstersStatAtk || 'ATK', s.atk],
      [t.monstersStatDef || 'DEF', s.def],
      [t.monstersStatSpd || 'SPD', s.spd],
      [t.monstersStatCr || 'CRI Rate', `${s.critRate}%`],
      [t.monstersStatCd || 'CRI Dmg', `${s.critDmg}%`],
      [t.monstersStatRes || 'RES', `${s.res}%`],
      [t.monstersStatAcc || 'ACC', `${s.acc}%`],
    ];
    const body = rows
      .map(
        ([label, val]) =>
          `<div class="monsters-detail__stat"><span class="monsters-detail__stat-k">${escapeHtml(label)}</span><span class="monsters-detail__stat-v">${escapeHtml(String(val))}</span></div>`,
      )
      .join('');
    return `<div class="monsters-detail__stats">${body}</` + `div>`;
  }

  const DETAIL_RUNE_GRID_ORDER = [6, 1, 2, 5, 4, 3];

  function buildRuneDetailPanelHtml(r, t) {
    if (!r) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersRuneEmpty || '—')}</p>`;
    }
    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const isFlat =
      window.SWRM && typeof window.SWRM.isFlat === 'function'
        ? window.SWRM.isFlat
        : () => false;
    const fmtVal = (type, val) => {
      const n = Number(val);
      if (!Number.isFinite(n)) return '0';
      return isFlat(type) ? String(Math.round(n)) : `${n}%`;
    };
    const lines = [];
    const hdr = [r.setName, `+${r.level || 0}`, r.gradeStr || ''].filter(Boolean).join(' ');
    if (hdr) {
      lines.push(
        `<div class="monsters-rune-focus__line monsters-rune-focus__hdr">${escapeHtml(hdr)}</div>`,
      );
    }
    if (r.mainName) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(r.mainName)}</span><span class="monsters-rune-focus__v">${escapeHtml(fmtVal(r.mainType, r.mainVal))}</span></div>`,
      );
    }
    if (r.innate_name && r.innate_val) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(t.monstersRuneInnate || 'Inn')} ${escapeHtml(r.innate_name)}</span><span class="monsters-rune-focus__v">${escapeHtml(fmtVal(r.innate_type, r.innate_val))}</span></div>`,
      );
    }
    for (const s of r.substats || []) {
      let sub = `${s.name} +${subFn(s)}`;
      if (s.enchanted) sub += ' *';
      if (Number(s.grind) > 0) sub += ` (+${s.grind})`;
      lines.push(
        '<' +
          'd' +
          'iv class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">' +
          escapeHtml(sub) +
          '</span></' +
          'd' +
          'iv>',
      );
    }
    if (Number.isFinite(r.eff)) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(t.monstersRuneEff || 'Eff')}</span><span class="monsters-rune-focus__v">${escapeHtml((Math.round(r.eff * 10) / 10).toFixed(1))}%</span></div>`,
      );
    }
    return `<div class="monsters-rune-focus">${lines.join('')}</div>`;
  }

  function bindMonsterRuneFocusPanel(root, unit, t) {
    if (!root || !unit) return;
    const panel = root.querySelector('[data-rune-focus]');
    if (!panel) return;
    const clear = () => {
      panel.hidden = true;
      panel.innerHTML = '';
    };
    root.querySelectorAll('[data-slot]').forEach((el) => {
      if (typeof setSwrmFloatTipTarget === 'function') setSwrmFloatTipTarget(el, '');
      const slotNo = Number(el.getAttribute('data-slot'));
      if (!Number.isFinite(slotNo)) return;
      el.addEventListener('mouseenter', () => {
        const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
        if (!slot || !slot.rune) {
          clear();
          return;
        }
        panel.innerHTML = buildRuneDetailPanelHtml(slot.rune, t);
        panel.hidden = false;
      });
      el.addEventListener('mouseleave', clear);
    });
  }

  function buildListRowMetaHtml(u, t) {
    const uid = escapeHtml(String(u.unitId));
    const tagChips = (u.customTags || [])
      .map(
        (tag) =>
          `<span class="monsters-list__tag"><span class="monsters-list__tag-label">${escapeHtml(tag)}</span><button type="button" class="monsters-list__tag-rm" data-remove-custom-tag="${escapeHtml(tag)}" data-unit-id="${uid}" title="${escapeHtml(t.monstersTagRemove || 'Remove tag')}">×</button></span>`,
      )
      .join('');
    return `<div class="monsters-card__list-meta">
      <div class="monsters-card__actions monsters-card__actions--list">
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.favorite ? ' monsters-tag-btn--on' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.food ? ' monsters-tag-btn--on' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.storageMark ? ' monsters-tag-btn--on' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${u.storageMark}" title="${escapeHtml(t.monstersStorageMark || 'Storage tag')}">▣</button>
        ${buildLocationIconHtml(u, t)}
      </div>
      <div class="monsters-list__tags">
        ${tagChips}
        <input type="text" class="monsters-list__tag-input" data-tag-input data-unit-id="${uid}" maxlength="${MAX_TAG_LEN}" placeholder="${escapeHtml(t.monstersTagPlaceholder || 'New tag…')}" autocomplete="off" />
        <button type="button" class="monsters-list__tag-add" data-add-custom-tag data-unit-id="${uid}" title="${escapeHtml(t.monstersTagAdd || 'Add')}">+</button>
      </div>
    </div>`;
  }

  function buildMonsterDetailTagsHtml(u, t) {
    const tags = u.customTags || [];
    const chips = tags.length
      ? tags
          .map(
            (tag) =>
              `<span class="monsters-detail__tag"><span class="monsters-detail__tag-label">${escapeHtml(tag)}</span><button type="button" class="monsters-detail__tag-remove" data-remove-custom-tag="${escapeHtml(tag)}" data-unit-id="${escapeHtml(String(u.unitId))}" title="${escapeHtml(t.monstersTagRemove || 'Remove tag')}">×</button></span>`,
          )
          .join('')
      : `<span class="monsters-detail__muted">${escapeHtml(t.monstersNoCustomTags || 'No custom tags.')}</span>`;
    return `<div class="monsters-detail__custom-tags">
      <p class="monsters-detail__custom-tags-label">${escapeHtml(t.monstersCustomTags || 'Custom tags')}</p>
      <div class="monsters-detail__tag-list">${chips}</div>
      <div class="monsters-detail__tag-add">
        <input type="text" class="monsters-detail__tag-input" id="monsters-detail-tag-input" maxlength="${MAX_TAG_LEN}" placeholder="${escapeHtml(t.monstersTagPlaceholder || 'New tag…')}" autocomplete="off" />
        <button type="button" class="btn-secondary btn-sm" data-add-custom-tag="1" data-unit-id="${escapeHtml(String(u.unitId))}">${escapeHtml(t.monstersTagAdd || 'Add')}</button>
      </div>
    </div>`;
  }

  function syncMonstersBulkBar(t) {
    const bar = document.getElementById('monsters-bulk-bar');
    const countEl = document.getElementById('monsters-bulk-count');
    const toggle = document.getElementById('monsters-bulk-toggle');
    if (toggle) {
      const on = monstersBulkMode;
      toggle.classList.toggle('monsters-toolbar-btn--active', on);
      toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      const lbl = document.getElementById('lbl-monsters-bulk-toggle');
      const text = on
        ? t.monstersBulkModeOn || 'Selecting…'
        : t.monstersBulkModeOff || 'Select';
      if (lbl) lbl.textContent = text;
      else toggle.textContent = text;
    }
    if (!bar) return;
    if (!monstersBulkMode) {
      bar.hidden = true;
      return;
    }
    bar.hidden = false;
    const n = monstersBulkSelected.size;
    const tpl = t.monstersBulkCountTpl || '{n} selected';
    if (countEl) countEl.textContent = tpl.replace(/\{n\}/g, String(n));
  }

  function openMonsterRunesInTable(u) {
    if (typeof setRuneTableMonsterMasterId === 'function') {
      setRuneTableMonsterMasterId(u.masterId);
    }
    if (typeof showMainTab === 'function') {
      showMainTab('runes', { runesSubtab: 'runetable', writeHash: true });
    }
    if (typeof applyFiltersAndSort === 'function') {
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    }
  }

  function buildRuneSetIconsHtml(u, db, t) {
    const emptySlot = t.monstersRuneEmpty || '—';
    const slotLbl = t.monstersRuneSlot || 'Slot';
    const inner = (u.runeSlots || [])
      .map((slot) => {
        const r = slot.rune;
        const filled = !!(r || slot.runeId);
        const setName = r && r.setName ? r.setName : '';
        const tip = filled
          ? `${slotLbl} ${slot.slot}: ${setName}`
          : `${slotLbl} ${slot.slot}: ${emptySlot}`;
        const runeIconUrl = filled && db && setName ? db.runeSetImageUrl(setName) : '';
        if (runeIconUrl) {
          return `<span class="monsters-rune-icon" data-slot="${slot.slot}" title="${escapeHtml(tip)}">
            <img class="monsters-rune-icon__img" src="${escapeHtml(runeIconUrl)}" alt="${escapeHtml(setName)}" width="20" height="20" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <span class="monsters-rune-icon__n">${slot.slot}</span>
          </span>`;
        }
        return `<span class="monsters-rune-icon monsters-rune-icon--empty" data-slot="${slot.slot}" title="${escapeHtml(tip)}">
          <span class="monsters-rune-icon__n">${slot.slot}</span>
        </span>`;
      })
      .join('');
    return `<div class="monsters-rune-icons" aria-label="${escapeHtml(t.monstersRunesLabel || 'Rune sets')}">${inner}</div>`;
  }

  function buildRuneBlockHtml(u, db, t, view) {
    if (view === 'list') return buildRuneSetIconsHtml(u, db, t);
    if (view !== 'list') return '';
    const inner = buildRuneSlotHtml(u, db, t, {});
    return `<div class="monsters-runes monsters-runes--hex">${inner}</div>`;
  }

  function buildRuneSlotHtml(u, db, t, opts) {
    const large = opts && opts.large;
    const clickable = opts && opts.clickable;
    const hideNum = opts && opts.hideSlotNum;
    const gridOrder = opts && opts.gridOrder;
    const emptySlot = t.monstersRuneEmpty || '—';
    const clsBase = large ? 'monsters-detail-rune' : 'monsters-rune-slot';
    const slotList = gridOrder
      ? gridOrder
          .map((n) => (u.runeSlots || []).find((s) => Number(s.slot) === Number(n)))
          .filter(Boolean)
      : u.runeSlots || [];
    return slotList
      .map((slot) => {
        const r = slot.rune;
        const filled = !!(r || slot.runeId);
        const setName = r && r.setName ? r.setName : '';
        const cls = filled ? '' : ` ${clsBase}--empty`;
        const runeIconUrl = filled && db && setName ? db.runeSetImageUrl(setName) : '';
        const iconHtml = runeIconUrl
          ? `<img class="${clsBase}__icon" src="${escapeHtml(runeIconUrl)}" alt="${escapeHtml(setName)}" width="${large ? 32 : 22}" height="${large ? 32 : 22}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : '';
        const mainTxt =
          filled && r && r.mainName
            ? String(r.mainName)
            : '';
        const tip = [setName, mainTxt].filter(Boolean).join(' · ') || emptySlot;
        const clickAttr = clickable
          ? ` role="button" tabindex="0" data-open-runes="1" title="${escapeHtml(t.monstersOpenRunesHint || 'Open in Rune Table')}"`
          : ` title="${escapeHtml(tip)}"`;
        const labelHtml = runeIconUrl
          ? `<span class="${clsBase}__set ${clsBase}__set--sr">${escapeHtml(setName)}</span>`
          : `<span class="${clsBase}__set">${escapeHtml(setName || emptySlot)}</span>`;
        const mainHtml =
          large && mainTxt
            ? `<span class="${clsBase}__main">${escapeHtml(mainTxt)}</span>`
            : '';
        const numHtml = hideNum
          ? ''
          : `<span class="${clsBase}__num">${slot.slot}</span>`;
        return `<div class="${clsBase}${cls}" data-slot="${slot.slot}"${clickAttr}>
          ${numHtml}
          ${iconHtml}
          ${labelHtml}
          ${mainHtml}
        </div>`;
      })
      .join('');
  }

  function renderMonstersDetail(u, t, anchorEl) {
    const aside = document.getElementById('monsters-detail');
    const body = document.getElementById('monsters-detail-body');
    if (!aside || !body) return;
    bindMonstersDetailFloat();

    if (!u) {
      hideMonstersDetailFloat();
      body.hidden = true;
      body.innerHTML = '';
      return;
    }

    const db = window.SWRM_MONSTER_DB;
    const meta = u.meta;
    const elCls = elementClass(u.metaElement);
    const natLbl = t.monstersNatShort || 'nat';
    const lvlLbl = t.monstersLevelShort || 'Lv';
    const storageLbl = t.monstersStorageBadge || 'Storage';
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const skillDb = window.SWRM_SKILL_DB;
    const skillRows = Array.isArray(u.skillRows)
      ? u.skillRows
      : skillDb
        ? skillDb.enrichUnitSkills(u.skills).skills
        : [];
    const rawSkillCount = Array.isArray(u.skills) ? u.skills.length : 0;
    const skillSlotLbl = t.monstersSkillSlot || 'Skill';
    const skillsHtml = skillRows.length
      ? `<ul class="monsters-detail__skills">${skillRows
          .map((s) => {
            const label = skillDb ? skillDb.formatSkillLevel(s, t) : String(s.level);
            const maxCls = s.isMaxed ? ' monsters-detail__skill-lv--maxed' : '';
            const unknownCls = !s.hasMax ? ' monsters-detail__skill-lv--unknown' : '';
            return `<li class="monsters-detail__skill${s.isMaxed ? ' monsters-detail__skill--maxed' : ''}">
              <span class="monsters-detail__skill-slot">${escapeHtml(skillSlotLbl)} ${s.slot}</span>
              <span class="monsters-detail__skill-lv${maxCls}${unknownCls}" title="${escapeHtml(t.monstersSkillLevel || 'Level')}">${escapeHtml(label)}</span>
            </li>`;
          })
          .join('')}</ul>`
      : rawSkillCount > 0
        ? `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoUpgradeableSkills || 'No upgradeable skills (passive only).')}</p>`
        : `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoSkills || 'No skill data in SWEX.')}</p>`;

    const subBits = [
      u.metaElement ? escapeHtml(u.metaElement) : '',
      u.metaArchetype ? escapeHtml(u.metaArchetype) : '',
      meta && meta.natural_stars != null ? `${natLbl} ${meta.natural_stars}` : '',
    ].filter(Boolean);
    const tab = monstersDetailTab || 'info';
    const tabInfo = tab === 'info' ? ' is-active' : '';
    const tabSkills = tab === 'skills' ? ' is-active' : '';
    const tabRunes = tab === 'runes' ? ' is-active' : '';
    const roleLine = u.metaArchetype
      ? `<p class="monsters-detail__role">${escapeHtml(u.metaArchetype)}</p>`
      : '';

    body.innerHTML = `
      <header class="monsters-detail__head">
        <div class="monsters-detail__portrait-wrap monsters-detail__portrait-wrap--${elCls}">
          <img class="monsters-detail__portrait" alt="" width="96" height="96" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
        </div>
        <div class="monsters-detail__head-text">
          <h3 class="monsters-detail__title" id="monsters-detail-title">${bestiaryHref ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>` : escapeHtml(u.displayName)}</h3>
          <p class="monsters-detail__sub">${subBits.join(' · ')}</p>
          <button type="button" class="btn-secondary btn-sm monsters-detail__open-runes" data-open-runes-all="1">${escapeHtml(t.monstersOpenRunes || 'Open runes in table')}</button>
        </div>
      </header>
      <div class="monsters-detail__layout">
      <nav class="monsters-detail__tabs" role="tablist">
        <button type="button" class="monsters-detail__tab${tabInfo}" data-detail-tab="info" role="tab" aria-selected="${tab === 'info'}">${escapeHtml(t.monstersDetailTabInfo || 'Info')}</button>
        <button type="button" class="monsters-detail__tab${tabSkills}" data-detail-tab="skills" role="tab" aria-selected="${tab === 'skills'}">${escapeHtml(t.monstersDetailTabSkills || 'Skill')}</button>
        <button type="button" class="monsters-detail__tab${tabRunes}" data-detail-tab="runes" role="tab" aria-selected="${tab === 'runes'}">${escapeHtml(t.monstersDetailTabRunes || 'Rune')}</button>
      </nav>
      <div class="monsters-detail__tab-panels">
      <div class="monsters-detail__panel" data-detail-panel="info"${tab !== 'info' ? ' hidden' : ''}>
        <p class="monsters-detail__level">${escapeHtml(lvlLbl)} <strong>${u.level}</strong>${u.inStorage ? ` · <span class="monsters-detail__storage">${escapeHtml(storageLbl)}</span>` : ''}</p>
        ${roleLine}
        ${buildMonsterStatsHtml(u, t)}
      </div>
      <div class="monsters-detail__panel" data-detail-panel="skills"${tab !== 'skills' ? ' hidden' : ''}>
        ${skillsHtml}
      </div>
      <div class="monsters-detail__panel" data-detail-panel="runes"${tab !== 'runes' ? ' hidden' : ''}>
        <h4 class="monsters-detail__section-title monsters-detail__section-title--sr">${escapeHtml(t.monstersDetailRunes || 'Runes')}</h4>
        ${'<div class="monsters-detail__runes-wrap">'}
          <div class="monsters-detail__runes">${buildRuneSlotHtml(u, db, t, { large: true, clickable: true, hideSlotNum: true, gridOrder: DETAIL_RUNE_GRID_ORDER })}</div>
          <div class="monsters-rune-focus-panel" data-rune-focus hidden></div>
        </div>
      </div>
      </div>
      </div>`;

    body.hidden = false;

    const img = body.querySelector('.monsters-detail__portrait[data-img-file]');
    if (img && u.imageFilename) bindMonsterPortrait(img, u.imageFilename);

    body.querySelector('[data-open-runes-all]')?.addEventListener('click', () => openMonsterRunesInTable(u));
    body.querySelectorAll('[data-open-runes]').forEach((el) => {
      el.addEventListener('click', () => openMonsterRunesInTable(u));
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openMonsterRunesInTable(u);
        }
      });
    });
    const runeWrap = body.querySelector('.monsters-detail__runes-wrap');
    bindMonsterRuneFocusPanel(runeWrap, u, t);

    body.querySelectorAll('[data-detail-tab]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const next = btn.getAttribute('data-detail-tab');
        if (!next || next === monstersDetailTab) return;
        monstersDetailTab = next;
        renderMonstersDetail(u, t, anchorEl);
      });
    });

    if (anchorEl) positionMonstersDetailFloat(anchorEl);
  }

  function handleMonstersUnitTagClick(btn) {
    const tag = btn.getAttribute('data-unit-tag');
    const uid = btn.getAttribute('data-unit-id');
    if (!tag || !uid) return;
    if (tag === 'favorite' || tag === 'food' || tag === 'storageMark') {
      toggleUnitMetaFlag(uid, tag);
      renderMonstersPanel();
    }
  }

  function syncBulkCardStates(grid) {
    if (!grid) return;
    grid.querySelectorAll('.monsters-card').forEach((card) => {
      const uid = card.getAttribute('data-unit-id');
      const on = monstersBulkSelected.has(String(uid));
      card.classList.toggle('monsters-card--bulk-on', on);
      const cb = card.querySelector('[data-bulk-check]');
      if (cb) cb.checked = on;
    });
  }

  function bindMonstersGridDelegation() {
    const grid = document.getElementById('monsters-grid');
    if (!grid || grid.dataset.monstersDelegation === '1') return;
    grid.dataset.monstersDelegation = '1';

    grid.addEventListener('change', (e) => {
      const cb = e.target.closest('[data-bulk-check]');
      if (!cb || !grid.contains(cb) || !monstersBulkMode) return;
      const uid = cb.getAttribute('data-unit-id');
      if (!uid) return;
      if (cb.checked) monstersBulkSelected.add(String(uid));
      else monstersBulkSelected.delete(String(uid));
      writeMonstersBulkSelected(monstersBulkSelected);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersBulkBar(t);
      syncBulkCardStates(grid);
    });

    grid.addEventListener('click', (e) => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

      const addBtn = e.target.closest('[data-add-custom-tag]');
      if (addBtn && grid.contains(addBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = addBtn.getAttribute('data-unit-id');
        const row = addBtn.closest('.monsters-card');
        const input = row?.querySelector(`[data-tag-input][data-unit-id="${uid}"]`);
        const val = input ? input.value : '';
        if (uid && normalizeCustomTag(val)) {
          addUnitCustomTag(uid, val);
          if (input) input.value = '';
          renderMonstersPanel();
        }
        return;
      }

      const rmBtn = e.target.closest('[data-remove-custom-tag]');
      if (rmBtn && grid.contains(rmBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = rmBtn.getAttribute('data-unit-id');
        const tag = rmBtn.getAttribute('data-remove-custom-tag');
        if (uid && tag) {
          removeUnitCustomTag(uid, tag);
          renderMonstersPanel();
        }
        return;
      }

      const tagBtn = e.target.closest('[data-unit-tag]');
      if (tagBtn && grid.contains(tagBtn)) {
        e.preventDefault();
        e.stopPropagation();
        handleMonstersUnitTagClick(tagBtn);
        return;
      }

      const card = e.target.closest('.monsters-card');
      if (!card || !grid.contains(card)) return;
      const uid = card.getAttribute('data-unit-id');
      if (!uid) return;

      if (e.target.closest('[data-bulk-check]') || e.target.closest('label.monsters-card__bulk')) {
        return;
      }
      if (e.target.closest('a')) return;
      if (e.target.closest('[data-tag-input]')) return;

      if (monstersBulkMode) {
        e.preventDefault();
        const idx = monstersVisibleUnitIds.indexOf(String(uid));
        if (e.shiftKey && monstersBulkLastIndex >= 0 && idx >= 0) {
          const a = Math.min(monstersBulkLastIndex, idx);
          const b = Math.max(monstersBulkLastIndex, idx);
          for (let i = a; i <= b; i++) monstersBulkSelected.add(monstersVisibleUnitIds[i]);
        } else {
          toggleMonstersBulkSelect(uid);
          monstersBulkLastIndex = idx;
        }
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        return;
      }

      selectMonsterUnit(uid, card);
    });
  }

  function devilmonIconHtml(className) {
    const db = window.SWRM_MONSTER_DB;
    const url =
      db && typeof db.devilmonImageUrl === 'function'
        ? db.devilmonImageUrl()
        : 'https://swarfarm.com/static/herders/images/monsters/devilmon_dark.png';
    return `<img class="${className}" src="${escapeHtml(url)}" alt="" width="16" height="16" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
  }

  function buildMonsterCardHtml(u, db, t, view) {
    const elCls = elementClass(u.metaElement);
    const selected = String(u.unitId) === String(monstersSelectedUnitId);
    const hover = String(u.unitId) === String(monstersDetailHoverUnitId);
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const nameInner = bestiaryHref
      ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>`
      : escapeHtml(u.displayName);
    const natLbl = t.monstersNatShort || 'nat';
    const lvlLbl = t.monstersLevelShort || 'Lv';
    const subBits = [
      u.metaElement ? escapeHtml(u.metaElement) : '',
      u.metaArchetype ? escapeHtml(u.metaArchetype) : '',
      u.meta && u.meta.natural_stars != null ? `${natLbl} ${u.meta.natural_stars}` : '',
      `${lvlLbl} ${u.level}`,
    ].filter(Boolean);
    const runeCells = buildRuneBlockHtml(u, db, t, view);
    const listCls = view === 'list' ? ' monsters-card--list' : '';
    const bulkSel = monstersBulkSelected.has(String(u.unitId));
    const bulkCls = monstersBulkMode ? ' monsters-card--bulk-mode' : '';
    const bulkChecked = bulkSel ? ' checked' : '';
    const bulkHtml = monstersBulkMode
      ? `<label class="monsters-card__bulk" title="${escapeHtml(t.monstersBulkSelectOne || 'Select')}"><input type="checkbox" class="monsters-card__bulk-cb" data-bulk-check data-unit-id="${escapeHtml(String(u.unitId))}"${bulkChecked} /></label>`
      : '';
    const isList = view === 'list';
    const listMetaHtml = isList ? buildListRowMetaHtml(u, t) : '';
    const locHtml = isList ? '' : '';
    const tagsHtml = isList ? buildCustomTagsHtml(u.customTags) : '';
    const flagBadges = isList
      ? [
          u.favorite
            ? `<span class="monsters-card__badge monsters-card__badge--fav" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</span>`
            : '',
          u.food
            ? `<span class="monsters-card__badge monsters-card__badge--food" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</span>`
            : '',
          u.storageMark
            ? `<span class="monsters-card__badge monsters-card__badge--tag-storage" title="${escapeHtml(t.monstersStorageMark || 'Storage tag')}">▣</span>`
            : '',
        ].join('')
      : '';
    const actionsHtml = isList
      ? ''
      : '';
    const deficitTipTpl = t.monstersSkillDeficitTip || '{n} skill level(s) to max';
    const deficitTip =
      u.skillUpsNeeded > 0
        ? deficitTipTpl.replace(/\{n\}/g, String(u.skillUpsNeeded))
        : '';
    const skillDeficitHtml =
      view === 'list' && u.skillUpsNeeded > 0
        ? `<span class="monsters-card__skill-deficit" title="${escapeHtml(deficitTip)}">${devilmonIconHtml('monsters-card__skill-deficit-icon')}<span class="monsters-card__skill-deficit-pill"><span class="monsters-card__skill-deficit-n">${escapeHtml(String(u.skillUpsNeeded))}</span></span></span>`
        : '';
    return `<article class="monsters-card${listCls}${bulkCls}${u.favorite ? ' monsters-card--favorite' : ''}${u.food ? ' monsters-card--food' : ''}${u.inStorage ? ' monsters-card--storage' : ''}${bulkSel ? ' monsters-card--bulk-on' : ''}${selected ? ' monsters-card--selected' : ''}${hover ? ' monsters-card--hover' : ''}${elCls ? ` monsters-card--${elCls}` : ''}" data-unit-id="${escapeHtml(String(u.unitId))}" data-master-id="${u.masterId}" tabindex="0">
          ${bulkHtml}
          <div class="monsters-card__bar monsters-card__bar--${elCls}" aria-hidden="true"></div>
          ${actionsHtml}
          <div class="monsters-card__top">
            <div class="monsters-card__img-wrap">
              <img class="monsters-card__img" alt="" width="48" height="48" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
            </div>
            <div class="monsters-card__meta">
              <p class="monsters-card__name">${locHtml}${nameInner}${skillDeficitHtml}</p>
              <p class="monsters-card__sub">${subBits.join(' · ')}</p>
              <span class="monsters-card__badges">${flagBadges}</span>${tagsHtml}
            </div>
          </div>
          ${runeCells}
          ${listMetaHtml}
        </article>`;
  }

  async function ensureMonstersDataset() {
    if (allUnits.length) return true;
    if (typeof installEmbeddedDemoDataset !== 'function') return false;
    return installEmbeddedDemoDataset({ keepTab: true });
  }

  function showMonsterDetailForCard(unitId, anchorEl) {
    monstersDetailHoverUnitId = unitId != null ? String(unitId) : null;
    const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(unitId));
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    cancelMonstersDetailHide();
    document.querySelectorAll('.monsters-card').forEach((card) => {
      card.classList.toggle('monsters-card--hover', card.getAttribute('data-unit-id') === String(unitId));
    });
    renderMonstersDetail(u || null, t, anchorEl);
  }

  function selectMonsterUnit(unitId, anchorEl) {
    saveMonstersSelectedUnitId(unitId);
    document.querySelectorAll('.monsters-card').forEach((card) => {
      card.classList.toggle('monsters-card--selected', card.getAttribute('data-unit-id') === String(unitId));
    });
    showMonsterDetailForCard(unitId, anchorEl);
  }

  async function renderMonstersPanel() {
    const grid = document.getElementById('monsters-grid');
    const emptyEl = document.getElementById('monsters-empty');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!grid) return;

    monstersBulkMode = readMonstersBulkMode();
    monstersBulkSelected = readMonstersBulkSelected();
    syncMonstersBulkBar(t);

    if (monstersSelectedUnitId == null) {
      monstersSelectedUnitId = loadMonstersSelectedUnitId();
    }

    if (!allUnits.length) {
      const loaded = await ensureMonstersDataset();
      if (loaded && allUnits.length) {
        return renderMonstersPanel();
      }
      if (grid) grid.innerHTML = '';
      renderMonstersChips({ total: 0, anyRune: 0, fullSix: 0, skillUpsTotal: 0 }, t, false);
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = t.monstersEmptyNoData || 'Load a SWEX export to see your 6★ monsters.';
      }
      hideMonstersDetailFloat();
      return;
    }

    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (db.indexCount() === 0) await db.loadMonsterIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    if (db && typeof db.hydrateMonsterMeta === 'function') {
      await db.hydrateMonsterMeta(allUnits.map((x) => x.masterId));
    }
    const skillIds = [];
    for (const unit of allUnits) {
      for (const s of unit.skills || []) {
        if (s && s.skillId != null) skillIds.push(s.skillId);
      }
    }
    if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
      try {
        await skillDb.loadSkillIndex();
        if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
        if (skillIds.length) await skillDb.hydrateSkillMaxLevels(skillIds);
      } catch (e) { /* ignore */ }
    }

    const indexMissing =
      db && typeof db.indexCount === 'function' && db.isReady() && db.indexCount() === 0;
    const skillsIndexMissing =
      skillDb && typeof skillDb.indexCount === 'function' && skillDb.isReady() && skillDb.indexCount() === 0;

    const enriched = allUnits.map((u) => {
      const meta = db ? db.lookupMonster(u.masterId) : null;
      const tags = unitMetaFor(u.unitId);
      const skillPack = skillDb
        ? skillDb.enrichUnitSkills(u.skills)
        : { skills: [], skillUpsNeeded: 0, skillsMaxed: true, skillsKnown: false };
      return {
        ...u,
        meta,
        metaElement: meta && meta.element ? meta.element : '',
        displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
        imageFilename: meta && meta.image_filename ? meta.image_filename : '',
        bestiarySlug: meta && meta.bestiary_slug ? meta.bestiary_slug : '',
        favorite: tags.favorite,
        food: tags.food,
        storageMark: tags.storageMark,
        customTags: tags.tags,
        metaArchetype: normalizeArchetype(
          (meta && meta.archetype) ||
            (db && typeof db.monsterArchetype === 'function' ? db.monsterArchetype(u.masterId) : ''),
        ),
        skillRows: skillPack.skills,
        skillUpsNeeded: skillPack.skillUpsNeeded,
        skillsMaxed: skillPack.skillsMaxed,
        skillsKnown: skillPack.skillsKnown,
      };
    });
    monstersEnrichedCache = enriched;

    const filters = readMonstersFilters();
    const qInput = document.getElementById('monsters-filter-q');
    const elSelect = document.getElementById('monsters-filter-element');
    const locSelect = document.getElementById('monsters-filter-location');
    const sortSelect = document.getElementById('monsters-filter-sort');
    if (qInput && qInput.value !== filters.q) qInput.value = filters.q;
    if (elSelect && elSelect.value !== filters.element) elSelect.value = filters.element;
    if (locSelect && locSelect.value !== filters.location) locSelect.value = filters.location;
    if (sortSelect && sortSelect.value !== filters.sort) sortSelect.value = filters.sort;
    populateMonstersSetFilter();
    populateMonstersTagFilter();
    populateMonstersRoleFilter();
    const skillSel = document.getElementById('monsters-filter-skill');
    const runeSel = document.getElementById('monsters-filter-rune');
    const setSel = document.getElementById('monsters-filter-rune-set');
    const tagSel = document.getElementById('monsters-filter-tag');
    const roleSel = document.getElementById('monsters-filter-role');
    const markSel = document.getElementById('monsters-filter-mark');
    if (skillSel && skillSel.value !== (filters.skillFilter || '')) skillSel.value = filters.skillFilter || '';
    if (runeSel && runeSel.value !== (filters.runeFilter || '')) runeSel.value = filters.runeFilter || '';
    if (setSel && setSel.value !== (filters.runeSet || '')) setSel.value = filters.runeSet || '';
    if (tagSel && tagSel.value !== (filters.tagFilter || '')) tagSel.value = filters.tagFilter || '';
    if (roleSel && roleSel.value !== (filters.roleFilter || '')) roleSel.value = filters.roleFilter || '';
    if (markSel && markSel.value !== (filters.markFilter || '')) markSel.value = filters.markFilter || '';
    syncMonstersShowAllButton(!!filters.fullSixOnly, t);

    const visible = sortMonstersList(filterMonstersList(enriched, filters), filters.sort);
    monstersVisibleUnitIds = visible.map((u) => String(u.unitId));
    const sum = computeMonstersSummary(enriched);
    renderMonstersChips(sum, t, indexMissing, skillsIndexMissing);

    if (!visible.length) {
      grid.innerHTML = '';
      if (emptyEl) {
        emptyEl.hidden = false;
        emptyEl.textContent = t.monstersEmptyFiltered || 'No monsters match the filters.';
      }
      hideMonstersDetailFloat();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    const view = readMonstersView();
    syncMonstersViewToggle(view);
    grid.innerHTML = visible.map((u) => buildMonsterCardHtml(u, db, t, view)).join('');
    grid.querySelectorAll('.monsters-card__img[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file) bindMonsterPortrait(img, file);
    });

    if (view === 'list') {
      grid.querySelectorAll('.monsters-card').forEach((card) => {
        const uid = card.getAttribute('data-unit-id');
        const uRow = enriched.find((x) => String(x.unitId) === String(uid));
        bindMonsterRuneTooltips(card, uRow, t);
      });
    }

    grid.querySelectorAll('.monsters-card').forEach((card) => {
      const uid = card.getAttribute('data-unit-id');
      card.addEventListener('mouseenter', () => {
        if (!monstersBulkMode) showMonsterDetailForCard(uid, card);
      });
      card.addEventListener('mouseleave', scheduleMonstersDetailHide);
      card.addEventListener('focus', () => {
        if (!monstersBulkMode) showMonsterDetailForCard(uid, card);
      });
      card.addEventListener('blur', scheduleMonstersDetailHide);
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        if (monstersBulkMode) {
          toggleMonstersBulkSelect(uid);
          syncMonstersBulkBar(t);
          syncBulkCardStates(grid);
        } else {
          selectMonsterUnit(uid, card);
        }
      });
    });

    syncBulkCardStates(grid);

    if (monstersDetailHoverUnitId) {
      const hoverCard = document.querySelector(
        `.monsters-card[data-unit-id="${String(monstersDetailHoverUnitId).replace(/"/g, '\\"')}"]`,
      );
      const hu = enriched.find((x) => String(x.unitId) === String(monstersDetailHoverUnitId));
      if (hu && hoverCard) renderMonstersDetail(hu, t, hoverCard);
    }
  }

  function populateMonstersRoleFilter() {
    const sel = document.getElementById('monsters-filter-role');
    if (!sel) return;
    const cur = sel.value || '';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allLbl = t.monstersRoleAll || 'All roles';
    const frag = document.createDocumentFragment();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = allLbl;
    frag.appendChild(allOpt);
    for (const role of MONSTER_ROLE_ORDER) {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = role;
      frag.appendChild(opt);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    if (cur && [...sel.options].some((o) => o.value === cur)) sel.value = cur;
  }

  function populateMonstersTagFilter() {
    const sel = document.getElementById('monsters-filter-tag');
    if (!sel) return;
    const cur = sel.value || '';
    pruneUnusedTagsRegistry();
    const tags = readTagsRegistry();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allLbl = t.monstersTagFilterAll || 'All tags';
    const frag = document.createDocumentFragment();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = allLbl;
    frag.appendChild(allOpt);
    for (const name of tags) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    if (cur && [...sel.options].some((o) => o.value === cur)) {
      sel.value = cur;
    } else if (cur) {
      const f = readMonstersFilters();
      if (f.tagFilter === cur) {
        f.tagFilter = '';
        writeMonstersFilters(f);
      }
    }
  }

  function populateMonstersSetFilter() {
    const sel = document.getElementById('monsters-filter-rune-set');
    if (!sel || sel.dataset.populated === '1') return;
    const setMap = window.SWRM && window.SWRM.SET_NAMES;
    if (!setMap) return;
    const names = [...new Set(Object.values(setMap).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allLbl = t.monstersRuneSetAll || 'Any set';
    const frag = document.createDocumentFragment();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = allLbl;
    frag.appendChild(allOpt);
    for (const name of names) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    sel.dataset.populated = '1';
  }

  function syncMonstersFilterLabels(t) {
    const title = document.getElementById('lbl-monsters-title');
    if (title) title.textContent = t.monstersTitle || 'Monsters';
    const lead = document.getElementById('lbl-monsters-lead');
    if (lead) lead.textContent = t.monstersLead || '';
    const qLbl = document.getElementById('lbl-monsters-filter-q');
    if (qLbl) qLbl.textContent = t.monstersFilterSearch || 'Search';
    const elLbl = document.getElementById('lbl-monsters-filter-element');
    if (elLbl) elLbl.textContent = t.monstersFilterElement || 'Element';
    const locLbl = document.getElementById('lbl-monsters-filter-location');
    if (locLbl) locLbl.textContent = t.monstersFilterLocation || 'Location';
    const sortLbl = document.getElementById('lbl-monsters-filter-sort');
    if (sortLbl) sortLbl.textContent = t.monstersFilterSort || 'Sort';
    const skillLbl = document.getElementById('lbl-monsters-filter-skill');
    if (skillLbl) skillLbl.textContent = t.monstersFilterSkill || 'Skills';
    const runeLbl = document.getElementById('lbl-monsters-filter-rune');
    if (runeLbl) runeLbl.textContent = t.monstersFilterRune || 'Runes';
    const setLbl = document.getElementById('lbl-monsters-filter-rune-set');
    if (setLbl) setLbl.textContent = t.monstersFilterRuneSet || 'Set';
    const tagLbl = document.getElementById('lbl-monsters-filter-tag');
    if (tagLbl) tagLbl.textContent = t.monstersFilterTag || 'Tag';
    const roleLbl = document.getElementById('lbl-monsters-filter-role');
    if (roleLbl) roleLbl.textContent = t.monstersFilterRole || 'Role';
    const markLbl = document.getElementById('lbl-monsters-filter-mark');
    if (markLbl) markLbl.textContent = t.monstersFilterMark || 'Marks';
    populateMonstersSetFilter();
    populateMonstersTagFilter();
    populateMonstersRoleFilter();
    const skillSel = document.getElementById('monsters-filter-skill');
    if (skillSel) {
      const opts = {
        '': t.monstersSkillAll || 'All skills',
        maxed: t.monstersSkillMaxed || 'Max skills',
        'needs-up': t.monstersSkillNeedsUp || 'Needs skill-ups',
      };
      skillSel.querySelectorAll('option').forEach((opt) => {
        if (opts[opt.value] != null) opt.textContent = opts[opt.value];
      });
    }
    const runeSel = document.getElementById('monsters-filter-rune');
    if (runeSel) {
      const opts = {
        '': t.monstersRuneAll || 'All runes',
        unruned: t.monstersRuneUnruned || 'Unruned',
        partial: t.monstersRunePartial || 'Partial (1–5)',
      };
      runeSel.querySelectorAll('option').forEach((opt) => {
        if (opts[opt.value] != null) opt.textContent = opts[opt.value];
      });
    }
    const setSel = document.getElementById('monsters-filter-rune-set');
    if (setSel) {
      const allOpt = setSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersRuneSetAll || 'Any set';
    }
    const tagSel = document.getElementById('monsters-filter-tag');
    if (tagSel) {
      const allOpt = tagSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersTagFilterAll || 'All tags';
    }
    const roleSel = document.getElementById('monsters-filter-role');
    if (roleSel) {
      const allOpt = roleSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersRoleAll || 'All roles';
    }
    const markSel = document.getElementById('monsters-filter-mark');
    if (markSel) {
      const markOpts = {
        '': t.monstersMarkAll || 'All',
        favorite: t.monstersMarkFavorite || '★ Favorites',
        food: t.monstersMarkFood || '🍖 Food',
      };
      markSel.querySelectorAll('option').forEach((opt) => {
        if (markOpts[opt.value] != null) opt.textContent = markOpts[opt.value];
      });
    }
    syncMonstersBulkBar(t);
    syncMonstersShowAllButton(readMonstersFilters().fullSixOnly, t);
    const bulkFoodBtn = document.getElementById('monsters-bulk-food');
    if (bulkFoodBtn) bulkFoodBtn.textContent = t.monstersBulkFood || 'Mark food';
    const bulkTagLbl = document.getElementById('lbl-monsters-bulk-tag');
    if (bulkTagLbl) bulkTagLbl.textContent = t.monstersFilterTag || 'Tag';
    const bulkApplyBtn = document.getElementById('monsters-bulk-tag-apply');
    if (bulkApplyBtn) bulkApplyBtn.textContent = t.monstersBulkTagApply || 'Apply';
    const bulkClearBtn = document.getElementById('monsters-bulk-clear');
    if (bulkClearBtn) bulkClearBtn.textContent = t.monstersBulkClear || 'Clear selection';
    const bulkStorageBtn = document.getElementById('monsters-bulk-storage');
    if (bulkStorageBtn) bulkStorageBtn.textContent = t.monstersBulkStorage || 'Storage tag';
    const lblCards = document.getElementById('lbl-monsters-view-cards');
    if (lblCards) lblCards.title = t.monstersViewCards || 'Cards';
    const btnCards = document.getElementById('monsters-view-cards');
    if (btnCards) btnCards.title = t.monstersViewCards || 'Cards';
    const btnList = document.getElementById('monsters-view-list');
    if (btnList) btnList.title = t.monstersViewList || 'List';
    const clearMonster = document.getElementById('btn-rune-table-clear-monster-filter');
    if (clearMonster) clearMonster.textContent = t.runeTableMonsterFilterClear || 'Clear';
    const attrib = document.getElementById('lbl-monsters-attrib');
    if (attrib) {
      attrib.innerHTML =
        t.monstersSwarfarmAttrib ||
        'Monster names & icons from <a href="https://swarfarm.com" target="_blank" rel="noopener noreferrer">SWARFARM</a>.';
    }
    const elSel = document.getElementById('monsters-filter-element');
    if (elSel && elSel.options.length) {
      const allOpt = elSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersElementAll || 'All elements';
    }
    const locSel = document.getElementById('monsters-filter-location');
    if (locSel && locSel.options.length >= 3) {
      const o0 = locSel.querySelector('option[value="all"]');
      const o1 = locSel.querySelector('option[value="active"]');
      const o2 = locSel.querySelector('option[value="storage"]');
      if (o0) o0.textContent = t.monstersLocationAll || 'All';
      if (o1) o1.textContent = t.monstersLocationActive || 'In use';
      if (o2) o2.textContent = t.monstersLocationStorage || 'Storage';
    }
    const sortSel = document.getElementById('monsters-filter-sort');
    if (sortSel) {
      const opts = {
        name: t.monstersSortName || 'Name',
        'level-desc': t.monstersSortLevelDesc || 'Level ↓',
        'level-asc': t.monstersSortLevelAsc || 'Level ↑',
        'runes-desc': t.monstersSortRunes || 'Runes equipped',
        element: t.monstersSortElement || 'Element',
        'favorite-first': t.monstersSortFavorite || 'Favorites first',
        'food-first': t.monstersSortFood || 'Food first',
      };
      sortSel.querySelectorAll('option').forEach((opt) => {
        const v = opt.value;
        if (opts[v]) opt.textContent = opts[v];
      });
    }
  }

  function readMonstersFiltersFromDom() {
    const sixBtn = document.getElementById('monsters-filter-full-six');
    const fullSixOnly = sixBtn?.getAttribute('aria-pressed') === 'true';
    return {
      q: document.getElementById('monsters-filter-q')?.value || '',
      element: document.getElementById('monsters-filter-element')?.value || '',
      location: document.getElementById('monsters-filter-location')?.value || 'all',
      sort: document.getElementById('monsters-filter-sort')?.value || 'name',
      skillFilter: document.getElementById('monsters-filter-skill')?.value || '',
      runeFilter: document.getElementById('monsters-filter-rune')?.value || '',
      runeSet: document.getElementById('monsters-filter-rune-set')?.value || '',
      tagFilter: document.getElementById('monsters-filter-tag')?.value || '',
      roleFilter: document.getElementById('monsters-filter-role')?.value || '',
      markFilter: document.getElementById('monsters-filter-mark')?.value || '',
      fullSixOnly,
    };
  }

  function bindMonstersToolbar() {
    const onFilter = () => {
      writeMonstersFilters(readMonstersFiltersFromDom());
      renderMonstersPanel();
    };
    document.getElementById('monsters-filter-q')?.addEventListener('input', onFilter);
    document.getElementById('monsters-filter-element')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-location')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-sort')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-skill')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-rune')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-rune-set')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-tag')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-role')?.addEventListener('change', onFilter);
    document.getElementById('monsters-bulk-toggle')?.addEventListener('click', () => {
      writeMonstersBulkMode(!monstersBulkMode);
      if (!monstersBulkMode) {
        monstersBulkSelected = new Set();
        writeMonstersBulkSelected(monstersBulkSelected);
        monstersBulkLastIndex = -1;
      }
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersBulkBar(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-food')?.addEventListener('click', () => {
      if (!monstersBulkSelected.size) return;
      bulkSetFoodFlag([...monstersBulkSelected], true);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-storage')?.addEventListener('click', () => {
      if (!monstersBulkSelected.size) return;
      bulkSetStorageMark([...monstersBulkSelected], true);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-tag-apply')?.addEventListener('click', () => {
      const input = document.getElementById('monsters-bulk-tag-input');
      const val = input?.value || '';
      if (!monstersBulkSelected.size || !normalizeCustomTag(val)) return;
      bulkAddCustomTag([...monstersBulkSelected], val);
      registerCustomTag(val);
      populateMonstersTagFilter();
      if (input) input.value = '';
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-clear')?.addEventListener('click', () => {
      monstersBulkSelected = new Set();
      writeMonstersBulkSelected(monstersBulkSelected);
      monstersBulkLastIndex = -1;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersBulkBar(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-filter-mark')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-full-six')?.addEventListener('click', () => {
      const btn = document.getElementById('monsters-filter-full-six');
      if (!btn) return;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      btn.classList.toggle('monsters-toolbar-btn--active', next);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersShowAllButton(!next, t);
      onFilter();
    });
    document.getElementById('monsters-view-cards')?.addEventListener('click', () => {
      writeMonstersView('cards');
      syncMonstersViewToggle('cards');
      renderMonstersPanel();
    });
    document.getElementById('monsters-view-list')?.addEventListener('click', () => {
      writeMonstersView('list');
      syncMonstersViewToggle('list');
      renderMonstersPanel();
    });
    syncMonstersViewToggle(readMonstersView());
    const t0 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    syncMonstersShowAllButton(readMonstersFilters().fullSixOnly, t0);
    bindMonstersDetailFloat();
    bindMonstersGridDelegation();
  }

  bindMonstersToolbar();
  bindMonstersGridDelegation();

})();
