// js/features/runes/table-filters.js — rune table filtering logic
  let filteredRunes = [];

  function computeRuneTableSummary(runes) {
    const list = runes || [];
    let ancient = 0;
    let equipped = 0;
    let plus15 = 0;
    let keep = 0;
    for (const r of list) {
      if (r.isAncient) ancient += 1;
      if (r.equipped_name != null && Number.isFinite(Number(r.equipped_name))) equipped += 1;
      if (Number(r.level) >= 15) plus15 += 1;
      if (r.verdict === 'Keep') keep += 1;
    }
    return { total: list.length, ancient, equipped, plus15, keep };
  }

  function renderRuneTableRosterChips() {
    const host = document.getElementById('rune-table-roster-chips');
    const meta = document.getElementById('rune-table-roster-meta');
    if (!host) return;
    const pool = typeof getVisibleRunes === 'function' ? getVisibleRunes() : [];
    if (!pool.length) {
      host.innerHTML = '';
      if (meta) meta.hidden = true;
      return;
    }
    if (meta) meta.hidden = false;
    const sum = computeRuneTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.runeChipTotal || 'Runes', value: sum.total },
      { label: t.runeChipAncient || 'Ancient', value: sum.ancient },
      { label: t.runeChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.runeChipPlus15 || '+15', value: sum.plus15 },
    ];
    if (sum.keep > 0) {
      parts.push({ label: t.runeChipKeep || 'Keep', value: sum.keep });
    }
    host.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
  }

  function runeTableTargetColumnVisible() {
    const verdictFilter = document.getElementById('filter-verdict')?.value || '';
    if (verdictFilter === 'Grind' || verdictFilter === 'Gem') return true;
    return !readRuneTableHideTarget() && !document.getElementById('toggle-target-col')?.checked;
  }

  function applyRuneTableTargetColumnVisibility() {
    const show = runeTableTargetColumnVisible();
    document.getElementById('target-col-header')?.classList.toggle('hidden', !show);
    document.getElementById('target-filter-cell')?.classList.toggle('hidden', !show);
    document.getElementById('rune-table')?.classList.toggle('show-target', show);
  }

  function buildRuneTableQuerySuffix() {
    const p = new URLSearchParams();
    const q = (document.getElementById('search-box')?.value || '').trim();
    if (q) p.set('q', q);
    const fv = document.getElementById('filter-verdict')?.value;
    if (fv) p.set('verdict', fv);
    const fr = document.getElementById('filter-role')?.value;
    if (fr) p.set('role', fr);
    const fg = document.getElementById('filter-grade')?.value;
    if (fg) p.set('grade', fg);
    const fs = document.getElementById('filter-set')?.value;
    if (fs) p.set('set', fs);
    const fsl = document.getElementById('filter-slot')?.value;
    if (fsl) p.set('slot', fsl);
    const fm = document.getElementById('filter-main')?.value;
    if (fm) p.set('main', fm);
    if (sortKey !== 'score') p.set('sort', sortKey);
    if (sortDir !== 'desc') p.set('dir', sortDir);
    if (document.getElementById('toggle-target-col')?.checked) p.set('target', '0');
    if (document.getElementById('toggle-ancient-only')?.checked) p.set('ancient', '1');
    if (runeTableShowAll) p.set('all', '1');
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  function replaceRuneTableLocationFromState() {
    if (runeTableApplyingHash) return;
    if (!isRuneTablePaneVisible()) return;
    try {
      const base = window.location.pathname + window.location.search;
      const suf = buildRuneTableQuerySuffix();
      history.replaceState(null, '', `${base}#runetable${suf}`);
    } catch (e) { /* ignore */ }
  }

  function applyRuneTableQueryParams(params) {
    if (!params) return;
    const keys = [...params.keys()];
    if (!keys.length) return;
    runeTableApplyingHash = true;
    try {
      if (params.has('q')) document.getElementById('search-box').value = params.get('q');
      if (params.has('verdict')) document.getElementById('filter-verdict').value = params.get('verdict');
      if (params.has('role')) document.getElementById('filter-role').value = params.get('role');
      if (params.has('grade')) document.getElementById('filter-grade').value = params.get('grade');
      if (params.has('set')) document.getElementById('filter-set').value = params.get('set');
      if (params.has('slot')) document.getElementById('filter-slot').value = params.get('slot');
      if (params.has('main')) document.getElementById('filter-main').value = params.get('main');
      const sk = params.get('sort');
      if (sk && RUNE_TABLE_SORT_KEYS.has(sk)) sortKey = sk;
      const sd = params.get('dir');
      if (sd === 'asc' || sd === 'desc') sortDir = sd;
      if (params.has('target')) {
        const hide = params.get('target') === '0';
        const tgl = document.getElementById('toggle-target-col');
        if (tgl) tgl.checked = hide;
        try {
          localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, hide ? '1' : '0');
        } catch (e) { /* ignore */ }
      }
      if (params.has('ancient')) {
        const on = params.get('ancient') === '1';
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = on;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, on ? '1' : '0');
      }
      if (params.has('all')) runeTableShowAll = params.get('all') === '1';
      else runeTableShowAll = false;
      applyRuneTableTargetColumnVisibility();
    } finally {
      runeTableApplyingHash = false;
      applyRuneTableEffHeader();
    }
  }

  const RUNE_FILTER_SELECT_IDS = {
    grade: 'filter-grade',
    set: 'filter-set',
    slot: 'filter-slot',
    main: 'filter-main',
    role: 'filter-role',
    verdict: 'filter-verdict',
  };

  function readRuneTableFiltersFromDom() {
    return {
      verdict: document.getElementById('filter-verdict')?.value || '',
      role: document.getElementById('filter-role')?.value || '',
      grade: document.getElementById('filter-grade')?.value || '',
      set: document.getElementById('filter-set')?.value || '',
      slot: document.getElementById('filter-slot')?.value || '',
      main: document.getElementById('filter-main')?.value || '',
      ancientOnly: !!document.getElementById('toggle-ancient-only')?.checked,
      hideTarget: !!document.getElementById('toggle-target-col')?.checked,
    };
  }

  function countRuneTableActiveFilters(f) {
    let n = 0;
    if (f.verdict) n += 1;
    if (f.role) n += 1;
    if (f.grade) n += 1;
    if (f.set) n += 1;
    if (f.slot) n += 1;
    if (f.main) n += 1;
    if (f.ancientOnly) n += 1;
    if (f.hideTarget) n += 1;
    return n;
  }

  function runeTableFilterChipDefs(f, t) {
    const chips = [];
    if (f.verdict) chips.push({ key: 'verdict', label: verdictUiLabel(t, f.verdict) || f.verdict });
    if (f.role) chips.push({ key: 'role', label: f.role });
    if (f.grade) chips.push({ key: 'grade', label: f.grade });
    if (f.set) chips.push({ key: 'set', label: f.set });
    if (f.slot) chips.push({ key: 'slot', label: `${t.runeFilterSlot || 'Slot'} ${f.slot}` });
    if (f.main) chips.push({ key: 'main', label: f.main });
    if (f.ancientOnly) chips.push({ key: 'ancientOnly', label: t.tableAncientOnly || 'Ancient only' });
    if (f.hideTarget) chips.push({ key: 'hideTarget', label: t.toggleTargetCol || 'Hide Target' });
    return chips;
  }

  function clearRuneTableFilterChip(key) {
    switch (key) {
      case 'verdict':
        document.getElementById('filter-verdict').value = '';
        break;
      case 'role':
        document.getElementById('filter-role').value = '';
        break;
      case 'grade':
        document.getElementById('filter-grade').value = '';
        break;
      case 'set':
        document.getElementById('filter-set').value = '';
        break;
      case 'slot':
        document.getElementById('filter-slot').value = '';
        break;
      case 'main':
        document.getElementById('filter-main').value = '';
        break;
      case 'ancientOnly': {
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = false;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
        break;
      }
      case 'hideTarget': {
        const tgl = document.getElementById('toggle-target-col');
        if (tgl) tgl.checked = false;
        try {
          localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
        } catch (e) { /* ignore */ }
        applyRuneTableTargetColumnVisibility();
        break;
      }
      default:
        break;
    }
  }

  function renderRuneTableActiveFilterChips() {
    const row = document.getElementById('rune-table-active-filters');
    const host = document.getElementById('rune-table-filter-chips');
    if (!row || !host) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const chips = runeTableFilterChipDefs(readRuneTableFiltersFromDom(), t);
    if (!chips.length) {
      host.innerHTML = '';
      row.hidden = true;
      return;
    }
    row.hidden = false;
    host.innerHTML = chips
      .map(
        (c) =>
          `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-rune-filter-chip-remove="${escapeHtml(c.key)}" aria-label="Remove">✕</button></span>`,
      )
      .join('');
  }

  function updateRuneTableFilterSummary() {
    const f = readRuneTableFiltersFromDom();
    const n = countRuneTableActiveFilters(f);
    const countEl = document.getElementById('rune-filters-active-count');
    const moreBtn = document.getElementById('rune-more-filters-btn');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const activeTpl = t.runeTableFiltersActive || '{n}';
    if (countEl) {
      countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
      countEl.hidden = !n;
    }
    if (moreBtn) moreBtn.classList.toggle('monsters-toolbar-btn--filters-active', n > 0);
    renderRuneTableActiveFilterChips();
  }

  function updateRuneTableFilterIndicators() {
    const f = readRuneTableFiltersFromDom();
    document.querySelectorAll('#rune-table thead [data-filter-key]').forEach((th) => {
      const key = th.getAttribute('data-filter-key');
      const id = RUNE_FILTER_SELECT_IDS[key];
      const sel = id ? document.getElementById(id) : null;
      const on = !!(sel && sel.value);
      th.classList.toggle('th--filtered', on);
      const textEl = th.querySelector('.th-text');
      if (textEl) textEl.classList.toggle('th-text--filtered', on);
    });
    updateRuneTableFilterSummary();
  }

  function resetRuneTableFilters() {
    const sb = document.getElementById('search-box');
    if (sb) sb.value = '';
    const fv = document.getElementById('filter-verdict');
    if (fv) fv.value = '';
    const fr = document.getElementById('filter-role');
    if (fr) fr.value = '';
    const fg = document.getElementById('filter-grade');
    if (fg) fg.value = '';
    const fs = document.getElementById('filter-set');
    if (fs) fs.value = '';
    const fsl = document.getElementById('filter-slot');
    if (fsl) fsl.value = '';
    const fm = document.getElementById('filter-main');
    if (fm) fm.value = '';
    const tgl = document.getElementById('toggle-target-col');
    if (tgl) tgl.checked = false;
    try {
      localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
    } catch (e) { /* ignore */ }
    const tglAncient = document.getElementById('toggle-ancient-only');
    if (tglAncient) tglAncient.checked = false;
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
    applyRuneTableTargetColumnVisibility();
    sortKey = 'score';
    sortDir = 'desc';
    runeTableShowAll = false;
    if (typeof setRuneTableMonsterMasterId === 'function') setRuneTableMonsterMasterId(null);
    updateSortHeaderClasses();
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes());
  }

  /** When set, Rune Table shows only runes equipped on this unit_master_id. */
  let runeTableMonsterMasterId = null;

  function setRuneTableMonsterMasterId(masterId) {
    runeTableMonsterMasterId =
      masterId != null && Number.isFinite(Number(masterId)) ? Number(masterId) : null;
  }

  function clearRuneTableMonsterMasterId() {
    setRuneTableMonsterMasterId(null);
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  }

  function applyFiltersAndSort(runes, opts) {
    if (!opts || !opts.preserveTableExpansion) {
      runeTableShowAll = false;
    }
    const search  = (document.getElementById('search-box')?.value || '').toLowerCase();
    tableSearchHighlight = search;
    const tTable = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const verdict = document.getElementById('filter-verdict')?.value || '';
    const role    = document.getElementById('filter-role')?.value    || '';
    const grade   = document.getElementById('filter-grade')?.value   || '';
    const setName = document.getElementById('filter-set')?.value || '';
    const slotVal = document.getElementById('filter-slot')?.value || '';
    const mainVal = document.getElementById('filter-main')?.value || '';
    const ancientOnly = !!document.getElementById('toggle-ancient-only')?.checked;

    filteredRunes = runes.filter(r => {
      if (runeTableMonsterMasterId != null) {
        const eq = r.equipped_name != null ? Number(r.equipped_name) : NaN;
        if (eq !== runeTableMonsterMasterId) return false;
      }
      if (ancientOnly && !r.isAncient) return false;
      if (verdict && r.verdict !== verdict) return false;
      if (role) {
        if (role === 'God Roll') {
          if (r.role !== 'God Roll' && r.role !== 'High Roll') return false;
        } else if (r.role !== role) return false;
      }
      if (grade   && r.gradeStr !== grade)  return false;
      if (setName && r.setName !== setName) return false;
      if (slotVal && String(r.slot) !== slotVal) return false;
      if (mainVal && r.mainName !== mainVal) return false;
      if (search) {
        const subParts = (r.substats || []).flatMap((s) => {
          const total = subLineTotal(s);
          const grind = Number(s.grind) || 0;
          return [s.name, String(total), grind > 0 ? String(s.val ?? '') : ''];
        });
        const ancientTokens = r.isAncient
          ? [String(tTable.tableAncientBadge || 'Ancient'), 'ancient']
          : [];
        const haystack = [
          r.setName, r.mainName, r.gradeStr, r.role, r.verdict,
          r.innate_name, String(r.innate_val ?? ''),
          ...ancientTokens,
          ...subParts,
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    sortRunesInPlace(filteredRunes, sortKey, sortDir);

    const tbody = document.getElementById('rune-tbody');
    if (!tbody) return;
    const total = filteredRunes.length;
    const cap = runeTableShowAll ? total : Math.min(RUNE_TABLE_PAGE, total);
    const rows = filteredRunes.slice(0, cap);

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const countEl = document.getElementById('table-count');
    if (countEl) {
      if (!runeTableShowAll && total > RUNE_TABLE_PAGE) {
        const tmpl = t.runeTableCountCapped || '{shown} / {total}';
        countEl.textContent = tmpl
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total));
      } else {
        countEl.textContent = `${total} ${t.runes}`;
      }
    }

    applyRuneTableTargetColumnVisibility();
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    setupRuneTableMoreUi(total, rows.length);
    updateRuneTableFilterIndicators();
    if (typeof renderRuneTableRosterChips === 'function') renderRuneTableRosterChips();
    replaceRuneTableLocationFromState();
  }

  function bindRuneTableFiltersDrawer() {
    const onFilter = () => {
      updateRuneTableFilterIndicators();
      applyFiltersAndSort(getVisibleRunes());
    };

    bindFiltersPopover('rune-more-filters-btn', 'rune-filters-popover', { onClose: onFilter });

    document.getElementById('rune-filters-drawer-reset')?.addEventListener('click', () => {
      ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const tgl = document.getElementById('toggle-target-col');
      if (tgl) tgl.checked = false;
      try {
        localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
      } catch (e) { /* ignore */ }
      const tglAncient = document.getElementById('toggle-ancient-only');
      if (tglAncient) tglAncient.checked = false;
      localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
      applyRuneTableTargetColumnVisibility();
      onFilter();
    });
    document.getElementById('rune-table-filter-chips')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rune-filter-chip-remove]');
      if (!btn) return;
      clearRuneTableFilterChip(btn.getAttribute('data-rune-filter-chip-remove'));
      onFilter();
    });

    ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', onFilter);
    });
  }

  bindRuneTableFiltersDrawer();
