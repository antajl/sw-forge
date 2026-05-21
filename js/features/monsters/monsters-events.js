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
    syncMonstersMinLevelInput(readMonstersFilters().minLevelMin, t);
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
    if (f.minLevelMin > 0) n += 1;
    return n;
  }

  function monstersFilterChipDefs(f, t) {
    const chips = [];
    const q = (f.q || '').trim();
    if (q) chips.push({ key: 'q', label: `"${q}"` });
    if (f.element) chips.push({ key: 'element', label: f.element });
    if (f.minLevelMin > 0) {
      const tpl = t.monstersFilterMinLevelChip || 'Lv {n}+';
      chips.push({ key: 'minLevelMin', label: tpl.replace(/\{n\}/g, String(f.minLevelMin)) });
    }
    if (f.location && f.location !== 'all') {
      const locMap = { active: t.monstersFilterLocActive || 'In use', storage: t.monstersFilterLocStorage || 'Storage' };
      chips.push({ key: 'location', label: locMap[f.location] || f.location });
    }
    if (f.fullSixOnly) chips.push({ key: 'fullSixOnly', label: t.monstersFilterSixOnly || '6/6 runes' });
    if (f.skillFilter) chips.push({ key: 'skillFilter', label: f.skillFilter });
    if (f.runeFilter) chips.push({ key: 'runeFilter', label: f.runeFilter });
    if (f.runeSet) chips.push({ key: 'runeSet', label: f.runeSet });
    if (f.tagFilter) chips.push({ key: 'tagFilter', label: f.tagFilter });
    if (f.roleFilter) chips.push({ key: 'roleFilter', label: f.roleFilter });
    if (f.markFilter) {
      const markMap = { favorite: '★', food: '🍖' };
      chips.push({ key: 'markFilter', label: markMap[f.markFilter] || f.markFilter });
    }
    return chips;
  }

  function clearMonstersFilterChip(key) {
    switch (key) {
      case 'q':
        resetMonstersSearchQuery();
        break;
      case 'element': {
        const el = document.getElementById('monsters-filter-element');
        if (el) el.value = '';
        break;
      }
      case 'minLevelMin': {
        const lvl = document.getElementById('monsters-filter-min-level');
        if (lvl) lvl.value = '';
        break;
      }
      case 'location': {
        const loc = document.getElementById('monsters-filter-location');
        if (loc) loc.value = 'all';
        break;
      }
      case 'fullSixOnly': {
        const six = document.getElementById('monsters-filter-full-six');
        if (six) {
          six.setAttribute('aria-pressed', 'false');
          six.classList.remove('monsters-toolbar-btn--active');
        }
        break;
      }
      case 'skillFilter':
        document.getElementById('monsters-filter-skill').value = '';
        break;
      case 'runeFilter':
        document.getElementById('monsters-filter-rune').value = '';
        break;
      case 'runeSet':
        document.getElementById('monsters-filter-rune-set').value = '';
        break;
      case 'tagFilter':
        document.getElementById('monsters-filter-tag').value = '';
        break;
      case 'roleFilter':
        document.getElementById('monsters-filter-role').value = '';
        break;
      case 'markFilter':
        document.getElementById('monsters-filter-mark').value = '';
        break;
      default:
        break;
    }
  }

  function renderMonstersActiveFilterChips() {
    const row = document.getElementById('monsters-active-filters');
    const host = document.getElementById('monsters-filter-chips');
    if (!row || !host) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const f = readMonstersFiltersFromDom();
    const chips = monstersFilterChipDefs(f, t);
    if (!chips.length) {
      host.innerHTML = '';
      row.hidden = true;
      return;
    }
    row.hidden = false;
    host.innerHTML = chips
      .map(
        (c) =>
          `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-filter-chip-remove="${escapeHtml(c.key)}" aria-label="Remove">✕</button></span>`,
      )
      .join('');
  }

  function updateMonstersFilterSummary() {
    const f = readMonstersFiltersFromDom();
    const n = countMonstersActiveFilters(f);
    const countEl = document.getElementById('monsters-filters-active-count');
    const moreBtn = document.getElementById('monsters-more-filters-btn');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const activeTpl = t.monstersFiltersActive || '{n}';
    if (countEl) {
      countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
      countEl.hidden = !n;
    }
    if (moreBtn) moreBtn.classList.toggle('monsters-toolbar-btn--filters-active', n > 0);
    renderMonstersActiveFilterChips();
  }

  function readMonstersFiltersFromDom() {
    const sixBtn = document.getElementById('monsters-filter-full-six');
    const lvlInp = document.getElementById('monsters-filter-min-level');
    const fullSixOnly = sixBtn?.getAttribute('aria-pressed') === 'true';
    const rawLvl = lvlInp?.value != null ? String(lvlInp.value).trim() : '';
    const parsed = rawLvl === '' ? 0 : Math.round(Number(rawLvl));
    const minLevelMin =
      Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.min(40, parsed)) : 0;
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
      minLevelMin,
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
    document.getElementById('monsters-filter-min-level')?.addEventListener('input', onFilter);
    document.getElementById('monsters-filter-min-level')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-location')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-sort')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-skill')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-rune')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-rune-set')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-tag')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-role')?.addEventListener('change', onFilter);
    document.getElementById('monsters-bulk-favorite')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      if (!monstersBulkSelected.size) return;
      bulkToggleFavoriteFlag([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-food')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      if (!monstersBulkSelected.size) return;
      bulkToggleFoodFlag([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-storage')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      if (!monstersBulkSelected.size) return;
      bulkToggleStorageMark([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-tag-apply')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
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
    document.getElementById('monsters-filter-clear-all')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      resetMonstersToolbarFilters(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-filter-chips')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-chip-remove]');
      if (!btn) return;
      clearMonstersFilterChip(btn.dataset.filterChipRemove);
      writeMonstersFilters(readMonstersFiltersFromDom());
      updateMonstersFilterSummary();
      renderMonstersPanel();
    });
    function openMonstersFiltersDrawer() {
      const dlg = document.getElementById('monsters-filters-drawer');
      if (!dlg) return;
      if (typeof dlg.showModal === 'function') {
        try {
          dlg.showModal();
        } catch (e) {
          dlg.setAttribute('open', '');
        }
      } else {
        dlg.setAttribute('open', '');
      }
    }

    function closeMonstersFiltersDrawer() {
      const dlg = document.getElementById('monsters-filters-drawer');
      if (!dlg) return;
      if (dlg.open && typeof dlg.close === 'function') dlg.close();
      else dlg.removeAttribute('open');
    }

    document.getElementById('monsters-more-filters-btn')?.addEventListener('click', () => {
      openMonstersFiltersDrawer();
    });
    document.getElementById('monsters-filters-drawer-close')?.addEventListener('click', () => {
      closeMonstersFiltersDrawer();
    });
    document.getElementById('monsters-filters-drawer')?.addEventListener('close', () => {
      const f = readMonstersFiltersFromDom();
      writeMonstersFilters(f);
      updateMonstersFilterSummary();
      renderMonstersPanel();
    });
    document.getElementById('monsters-filters-drawer-reset')?.addEventListener('click', () => {
      clearMonstersPanelFilters();
      writeMonstersFilters(readMonstersFiltersFromDom());
      updateMonstersFilterSummary();
      renderMonstersPanel();
    });
    document.getElementById('monsters-select-all-visible')?.addEventListener('click', () => {
      if (typeof selectAllVisibleMonsters === 'function') selectAllVisibleMonsters();
    });
    document.getElementById('monsters-bulk-tag-toggle')?.addEventListener('click', () => {
      const menu = document.getElementById('monsters-bulk-tag-menu');
      if (!menu) return;
      const tags = typeof readTagsRegistry === 'function' ? readTagsRegistry() : [];
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      if (!tags.length) {
        const val = window.prompt(t.monstersBulkTagPrompt || 'Tag name');
        if (val && monstersBulkSelected.size) {
          bulkAddCustomTag([...monstersBulkSelected], val);
          registerCustomTag(val);
          populateMonstersTagFilter();
          renderMonstersPanel();
        }
        return;
      }
      menu.innerHTML = tags
        .map(
          (tag) =>
            `<button type="button" class="monsters-selection-tag__option" data-bulk-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`,
        )
        .join('');
      const open = menu.hidden;
      menu.hidden = !open;
      document.getElementById('monsters-bulk-tag-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('monsters-bulk-tag-menu')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bulk-tag]');
      if (!btn || !monstersBulkSelected.size) return;
      bulkAddCustomTag([...monstersBulkSelected], btn.dataset.bulkTag);
      document.getElementById('monsters-bulk-tag-menu').hidden = true;
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
    syncMonstersMinLevelInput(readMonstersFilters().minLevelMin, t0);
    updateMonstersFilterSummary();
    bindMonstersDetailFloat();
    bindMonstersGridDelegation();
  }
