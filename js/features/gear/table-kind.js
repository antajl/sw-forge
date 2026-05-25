// js/features/gear/table-kind.js — Runes / Artifacts / Relics sub-tabs & shared gear helpers
  const TABLE_KIND_IDS = ['runes', 'artifacts', 'relics'];
  const TABLE_KIND_STORAGE_KEY = 'swrm_table_kind_v1';
  let tableKindTabsBound = false;

  function normalizeTableKind(id) {
    return TABLE_KIND_IDS.includes(id) ? id : 'runes';
  }

  function readTableKind() {
    try {
      const v = sessionStorage.getItem(TABLE_KIND_STORAGE_KEY);
      return normalizeTableKind(v || 'runes');
    } catch (e) {
      return 'runes';
    }
  }

  function writeTableKind(id) {
    try {
      sessionStorage.setItem(TABLE_KIND_STORAGE_KEY, normalizeTableKind(id));
    } catch (e) { /* ignore */ }
  }

  function gearMonsterNameFromMasterId(masterId) {
    const mid = Number(masterId);
    if (!Number.isFinite(mid) || mid <= 0) return '';
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.monsterDisplayName === 'function') {
      const n = db.monsterDisplayName(mid);
      if (n && !String(n).startsWith('#')) return String(n);
    }
    return '';
  }

  function gearUnitByOccupiedId(occupiedId) {
    const id = Number(occupiedId);
    if (!Number.isFinite(id) || id === 0) return null;
    const units = allUnits || [];
    let u = units.find((x) => Number(x.unitId) === id);
    if (!u) u = units.find((x) => Number(x.masterId) === id);
    if (!u && activeSwexJson && Array.isArray(activeSwexJson.unit_list)) {
      const raw = activeSwexJson.unit_list.find(
        (x) => x && (Number(x.unit_id) === id || Number(x.unit_master_id) === id),
      );
      if (raw) {
        u = {
          unitId: raw.unit_id,
          masterId: Number(raw.unit_master_id),
        };
      }
    }
    return u || null;
  }

  function gearLocationLabel(occupiedId, t) {
    const inv = t.tableGearInventory || 'Inventory';
    if (occupiedId == null || !Number.isFinite(Number(occupiedId)) || Number(occupiedId) === 0) {
      return inv;
    }
    const id = Number(occupiedId);
    const u = gearUnitByOccupiedId(id);
    if (u) {
      const cache = typeof monstersEnrichedCache !== 'undefined' ? monstersEnrichedCache : [];
      const enriched = cache.find((x) => Number(x.unitId) === Number(u.unitId));
      if (enriched && enriched.displayName && !String(enriched.displayName).startsWith('#')) {
        return String(enriched.displayName);
      }
      if (u.displayName && !String(u.displayName).startsWith('#')) return String(u.displayName);
      const byMaster = gearMonsterNameFromMasterId(u.masterId);
      if (byMaster) return byMaster;
      return inv;
    }
    const byOccupiedMaster = gearMonsterNameFromMasterId(id);
    return byOccupiedMaster || inv;
  }

  function gearSearchHay(gear) {
    const parts = [
      gear.kind,
      gear.category,
      gear.gradeStr,
      gearLocationLabel(gear.occupiedId, { tableGearInventory: 'Inventory' }),
    ];
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    if (gear.pri && fmt) parts.push(fmt(gear.pri, { kind: gear.kind }));
    if (gear.kind === 'relic' && fmtSec) parts.push(fmtSec(gear));
    if (gear.kind === 'artifact' && fmtSub) {
      for (const s of gear.secs || []) parts.push(fmtSub(s));
    }
    return parts.join(' ').toLowerCase();
  }

  function normalizeGearSearchText(raw) {
    return String(raw || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function gearMatchesSearchQuery(gear, rawQuery) {
    const norm = normalizeGearSearchText(rawQuery);
    if (!norm) return true;
    const hay = gearSearchHay(gear);
    const tokens = norm.split(' ').filter(Boolean);
    const full = tokens.join(' ');
    if (full.length >= 2 && hay.includes(full)) return true;
    const words = hay.split(' ').filter(Boolean);
    return tokens.every((tok) => words.includes(tok) || hay.includes(tok));
  }

  function populateGearFilterSelects() {
    const arts = allArtifacts || [];
    const rels = allRelics || [];
    const artGrades = [...new Set(arts.map((a) => a.gradeStr).filter(Boolean))].sort();
    const artCats = [...new Set(arts.map((a) => a.category).filter(Boolean))].sort();
    const relGrades = [...new Set(rels.map((r) => r.gradeStr).filter(Boolean))].sort();
    const relCats = [...new Set(rels.map((r) => r.category).filter(Boolean))].sort();
    const fill = (sel, values, current) => {
      if (!sel) return;
      const keep = current || sel.value || '';
      sel.innerHTML = '<option value="">All</option>';
      for (const v of values) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      }
      sel.value = keep;
    };
    fill(
      document.getElementById('filter-artifact-grade'),
      artGrades,
      typeof artifactFilterGrade !== 'undefined' ? artifactFilterGrade : '',
    );
    fill(
      document.getElementById('filter-artifact-category'),
      artCats,
      typeof artifactFilterCategory !== 'undefined' ? artifactFilterCategory : '',
    );
    fill(
      document.getElementById('filter-relic-grade'),
      relGrades,
      typeof relicFilterGrade !== 'undefined' ? relicFilterGrade : '',
    );
    fill(
      document.getElementById('filter-relic-category'),
      relCats,
      typeof relicFilterCategory !== 'undefined' ? relicFilterCategory : '',
    );
  }

  function renderGearTables() {
    applyArtifactTableSearch();
    applyRelicTableSearch();
    renderArtifactTableBody();
    renderRelicTableBody();
    updateGearTableCount();
  }

  function updateGearTableCount() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const artEl = document.getElementById('artifact-table-count');
    const relEl = document.getElementById('relic-table-count');
    if (artEl) {
      artEl.textContent = (t.tableCountArtifacts || '{n} artifacts').replace(
        '{n}',
        String(filteredArtifacts.length),
      );
    }
    if (relEl) {
      relEl.textContent = (t.tableCountRelics || '{n} relics').replace(
        '{n}',
        String(filteredRelics.length),
      );
    }
    const legacy = document.getElementById('table-count');
    const kind = readTableKind();
    if (legacy && kind === 'artifacts' && artEl) legacy.textContent = artEl.textContent;
    if (legacy && kind === 'relics' && relEl) legacy.textContent = relEl.textContent;
  }

  function setTableToolbarVisible(kind) {
    document.querySelectorAll('[data-table-toolbar]').forEach((el) => {
      const on = el.dataset.tableToolbar === kind;
      el.classList.toggle('hidden', !on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function updateTableKindTabIndicator() {
    const nav = document.getElementById('table-kind-tabs');
    const indicator = nav && nav.querySelector('.table-kind-tabs__indicator');
    const active = nav && nav.querySelector('.table-kind-tab.is-active');
    if (!nav || !indicator || !active) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    indicator.style.left = `${tabRect.left - navRect.left}px`;
    indicator.style.width = `${tabRect.width}px`;
  }

  function showTableKind(kind, options) {
    const id = normalizeTableKind(kind);
    writeTableKind(id);
    document.querySelectorAll('.table-kind-tab').forEach((btn) => {
      const on = btn.dataset.tableKind === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-table-kind-pane]').forEach((pane) => {
      const on = pane.dataset.tableKindPane === id;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('hidden', !on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });
    setTableToolbarVisible(id);
    const runeOnly = document.getElementById('rune-table-rune-only-ui');
    if (runeOnly) runeOnly.hidden = id !== 'runes';
    const loadStrip = document.getElementById('rune-table-load-strip');
    if (loadStrip) loadStrip.classList.toggle('hidden', id !== 'runes');
    document.querySelectorAll('[data-gear-roster-meta]').forEach((el) => {
      const on = el.dataset.gearRosterMeta === id;
      el.classList.toggle('hidden', !on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    const runeChips = document.getElementById('rune-table-active-filters');
    if (runeChips) runeChips.classList.toggle('hidden', id !== 'runes');
    const search = document.getElementById('search-box');
    if (search) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      search.placeholder = t.tableSearchRunes || 'Search by set, stat, role…';
    }
    updateTableKindTabIndicator();
    if (id === 'runes') {
      if (options && options.skipRuneRender) return;
      if (typeof flushRuneTableRenderIfNeeded === 'function') {
        flushRuneTableRenderIfNeeded();
        return;
      }
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    } else {
      renderGearTables();
    }
  }

  function initTableKindTabs() {
    const nav = document.getElementById('table-kind-tabs');
    if (!nav || tableKindTabsBound) return;
    tableKindTabsBound = true;
    bindArtifactTableFilters();
    bindRelicTableFilters();
    nav.querySelectorAll('.table-kind-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.tableKind;
        if (!kind) return;
        showTableKind(kind);
      });
    });
    showTableKind(readTableKind(), { skipRuneRender: true });
  }

  function onGearDataHydrated() {
    populateGearFilterSelects();
    if (readTableKind() !== 'runes') renderGearTables();
  }
