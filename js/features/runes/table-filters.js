// js/features/runes/table-filters.js — rune table filtering logic
  let filteredRunes = [];

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
    if (sortKey !== 'eff') p.set('sort', sortKey);
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

  function updateRuneTableFilterIndicators() {
    document.querySelectorAll('#rune-table thead .th-text[data-filter]').forEach((textEl) => {
      const key = textEl.getAttribute('data-filter');
      const sel = document.getElementById(
        key === 'grade' ? 'filter-grade'
          : key === 'set' ? 'filter-set'
            : key === 'slot' ? 'filter-slot'
              : key === 'main' ? 'filter-main'
                : key === 'role' ? 'filter-role'
                  : key === 'verdict' ? 'filter-verdict' : ''
      );
      const on = !!(sel && sel.value);
      textEl.classList.toggle('th-text--filtered', on);
    });
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
    sortKey = 'eff';
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
    const strip = document.getElementById('rune-table-monster-filter');
    if (strip) strip.hidden = runeTableMonsterMasterId == null;
    const label = document.getElementById('rune-table-monster-filter-label');
    if (label && runeTableMonsterMasterId != null && window.SWRM_MONSTER_DB) {
      const name = window.SWRM_MONSTER_DB.monsterDisplayName(runeTableMonsterMasterId);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const tpl = t.runeTableMonsterFilterTpl || 'Runes on {name}';
      label.textContent = tpl.replace('{name}', name);
    }
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
        const tmpl = t.runeTableCountCapped || '{shown} / {total} {runes}';
        countEl.textContent = tmpl
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total))
          .replace(/\{runes\}/g, t.runes);
      } else {
        countEl.textContent = `${total} ${t.runes}`;
      }
    }

    const detailEl = document.getElementById('table-count-detail');
    if (detailEl) {
      if (total === 0) {
        detailEl.textContent = t.tableShownDetailEmpty || '';
      } else if (!runeTableShowAll && total > RUNE_TABLE_PAGE) {
        detailEl.textContent = (t.tableShownDetailCapped || '')
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total));
      } else {
        detailEl.textContent = (t.tableShownDetailAll || '')
          .replace(/\{total\}/g, String(total));
      }
    }

    applyRuneTableTargetColumnVisibility();
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    setupRuneTableMoreUi(total, rows.length);
    updateRuneTableFilterIndicators();
    replaceRuneTableLocationFromState();
  }
