// js/features/monsters/monsters-events.js — monsters event wiring
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
    const advLbl = document.getElementById('lbl-monsters-filters-advanced');
    if (advLbl) advLbl.textContent = t.monstersFiltersAdvanced || 'Advanced filters';
    const fullSixField = document.getElementById('lbl-monsters-filter-full-six');
    if (fullSixField) fullSixField.textContent = t.monstersFilterRune || 'Runes';
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
    syncMonstersShowLevelButton(!!readMonstersFilters().minLevel36Only, t);
    updateMonstersFilterSummary();
    const bulkMarksLbl = document.getElementById('lbl-monsters-bulk-marks');
    if (bulkMarksLbl) bulkMarksLbl.textContent = t.monstersBulkMarksGroup || 'Bulk marks';
    const bulkFavBtn = document.getElementById('monsters-bulk-favorite');
    if (bulkFavBtn) {
      const lbl = bulkFavBtn.querySelector('.monsters-bulk-mark-btn__label');
      if (lbl) lbl.textContent = t.monstersBulkFavorite || t.monstersFavorite || 'Favorite';
      bulkFavBtn.title = t.monstersFavorite || 'Favorite';
    }
    const bulkFoodBtn = document.getElementById('monsters-bulk-food');
    if (bulkFoodBtn) {
      const lbl = bulkFoodBtn.querySelector('.monsters-bulk-mark-btn__label');
      if (lbl) lbl.textContent = t.monstersBulkFood || 'Food';
      bulkFoodBtn.title = t.monstersFood || 'Food';
    }
    const bulkTagLbl = document.getElementById('lbl-monsters-bulk-tag');
    if (bulkTagLbl) bulkTagLbl.textContent = t.monstersFilterTag || 'Tag';
    const bulkApplyBtn = document.getElementById('monsters-bulk-tag-apply');
    if (bulkApplyBtn) bulkApplyBtn.textContent = t.monstersBulkTagApply || 'Apply';
    const bulkClearBtn = document.getElementById('monsters-bulk-clear');
    if (bulkClearBtn) bulkClearBtn.textContent = t.monstersBulkClear || 'Clear selection';
    const bulkStorageBtn = document.getElementById('monsters-bulk-storage');
    if (bulkStorageBtn) {
      const lbl = bulkStorageBtn.querySelector('.monsters-bulk-mark-btn__label');
      if (lbl) lbl.textContent = t.monstersBulkStorage || 'Storage';
      bulkStorageBtn.title = t.monstersStorageMark || 'Storage tag';
    }
    const lblCards = document.getElementById('lbl-monsters-view-cards');
    if (lblCards) lblCards.title = t.monstersViewCards || 'Cards';
    const btnCards = document.getElementById('monsters-view-cards');
    if (btnCards) btnCards.title = t.monstersViewCards || 'Cards';
    const btnTable = document.getElementById('monsters-view-table');
    if (btnTable) btnTable.title = t.monstersViewTable || 'Table';
    const lblGridSel = document.getElementById('lbl-monsters-grid-select-all');
    if (lblGridSel) lblGridSel.textContent = t.monstersTableSelectAll || 'Select all visible';
    const clrToolbar = document.getElementById('monsters-toolbar-clear');
    if (clrToolbar) clrToolbar.textContent = t.monstersToolbarClear || 'Clear filters';
    const clearMonster = document.getElementById('btn-rune-table-clear-monster-filter');
    if (clearMonster) clearMonster.textContent = t.runeTableMonsterFilterClear || 'Clear';
    const emptyClear = document.getElementById('monsters-empty-clear-filters');
    if (emptyClear) emptyClear.textContent = t.monstersEmptyClearFilters || 'Clear filters';
    const emptySearch = document.getElementById('monsters-empty-reset-search');
    if (emptySearch) emptySearch.textContent = t.monstersEmptyResetSearch || 'Reset search';
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

  function countMonstersActiveFilters(f) {
    let n = 0;
    if (f.location && f.location !== 'all') n += 1;
    if (f.skillFilter) n += 1;
    if (f.runeFilter) n += 1;
    if (f.runeSet) n += 1;
    if (f.tagFilter) n += 1;
    if (f.roleFilter) n += 1;
    if (f.markFilter) n += 1;
    if (f.fullSixOnly) n += 1;
    if (f.minLevel36Only) n += 1;
    return n;
  }

  function updateMonstersFilterSummary() {
    const f = readMonstersFiltersFromDom();
    const n = countMonstersActiveFilters(f);
    const det = document.getElementById('monsters-filters-details');
    const sum = document.getElementById('lbl-monsters-filters-toggle');
    const countEl = document.getElementById('monsters-filters-active-count');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const base = t.monstersFiltersToggle || 'Filters';
    if (sum) sum.textContent = base;
    const activeTpl = t.monstersFiltersActive || '{n} active';
    if (countEl) {
      countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
      countEl.hidden = !n;
    }
    if (det) det.classList.toggle('monsters-toolbar__filters--active', n > 0);
  }

  function readMonstersFiltersFromDom() {
    const sixBtn = document.getElementById('monsters-filter-full-six');
    const lvlBtn = document.getElementById('monsters-filter-min-level');
    const fullSixOnly = sixBtn?.getAttribute('aria-pressed') === 'true';
    const minLevel36Only = lvlBtn?.getAttribute('aria-pressed') === 'true';
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
      minLevel36Only,
    };
  }

  function bindMonstersToolbar() {
    const onFilter = () => {
      writeMonstersFilters(readMonstersFiltersFromDom());
      updateMonstersFilterSummary();
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
    document.getElementById('monsters-bulk-favorite')?.addEventListener('click', () => {
      if (!monstersBulkSelected.size) return;
      bulkToggleFavoriteFlag([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-food')?.addEventListener('click', () => {
      if (!monstersBulkSelected.size) return;
      bulkToggleFoodFlag([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-storage')?.addEventListener('click', () => {
      if (!monstersBulkSelected.size) return;
      bulkToggleStorageMark([...monstersBulkSelected]);
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
      clearAllMonstersSelection();
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersBulkBar(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-filter-mark')?.addEventListener('change', onFilter);
    document.getElementById('monsters-layout')?.addEventListener('click', (e) => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      if (e.target && e.target.id === 'monsters-empty-clear-filters') {
        resetMonstersToolbarFilters(t);
        renderMonstersPanel();
      } else if (e.target && e.target.id === 'monsters-empty-reset-search') {
        resetMonstersSearchQuery();
        onFilter();
      }
    });
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
    document.getElementById('monsters-filter-min-level')?.addEventListener('click', () => {
      const btn = document.getElementById('monsters-filter-min-level');
      if (!btn) return;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      btn.classList.toggle('monsters-toolbar-btn--active', next);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersShowLevelButton(next, t);
      onFilter();
    });
    document.getElementById('monsters-toolbar-clear')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      resetMonstersToolbarFilters(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-view-cards')?.addEventListener('click', () => {
      writeMonstersView('cards');
      syncMonstersViewToggle('cards');
      renderMonstersPanel();
    });
    document.getElementById('monsters-view-table')?.addEventListener('click', () => {
      writeMonstersView('table');
      syncMonstersViewToggle('table');
      renderMonstersPanel();
    });
    syncMonstersViewToggle(readMonstersView());
    const t0 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    syncMonstersShowAllButton(readMonstersFilters().fullSixOnly, t0);
    syncMonstersShowLevelButton(!!readMonstersFilters().minLevel36Only, t0);
    updateMonstersFilterSummary();
    bindMonstersDetailFloat();
    bindMonstersGridDelegation();
  }
