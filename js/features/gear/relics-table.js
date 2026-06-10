// js/features/gear/relics-table.js — relic inventory table
  let filteredRelics = [];
  let deletedRelics = new Set();
  const DELETED_RELICS_KEY = 'swrm_deleted_relics_v1';

  function loadDeletedRelics() {
    try {
      const stored = localStorage.getItem(DELETED_RELICS_KEY);
      if (stored) {
        deletedRelics = new Set(JSON.parse(stored));
      }
    } catch (e) {
      deletedRelics = new Set();
    }
  }

  function saveDeletedRelics() {
    try {
      localStorage.setItem(DELETED_RELICS_KEY, JSON.stringify([...deletedRelics]));
    } catch (e) {
      // Ignore storage errors
    }
  }

  function deleteRelic(relicId) {
    if (!relicId) return;
    deletedRelics.add(String(relicId));
    saveDeletedRelics();
    renderGearTables();
  }

  let relicFilterGrade = '';
  let relicFilterCategory = '';
  let relicFilterLocation = '';

  function compareRelicTableValues(a, b, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    const an = Number(a);
    const bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) {
      if (an !== bn) return (an - bn) * mul;
      return 0;
    }
    const as = String(a ?? '').trim();
    const bs = String(b ?? '').trim();
    return as.localeCompare(bs, currentLang || undefined, { numeric: true, sensitivity: 'base' }) * mul;
  }

  function relicTableSortValue(r, key) {
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    const fmtWear =
      window.SWRM && typeof window.SWRM.formatRelicWearCount === 'function'
        ? window.SWRM.formatRelicWearCount
        : null;
    switch (key) {
      case 'category':
        return r.category || '';
      case 'level':
        return Number(r.level) || 0;
      case 'durability':
        return Number(r.durability) || 0;
      case 'main':
        return r.pri && fmt ? fmt(r.pri, { kind: 'relic' }) : '';
      case 'secondary':
        return fmtSec ? fmtSec(r) : '';
      case 'equipped':
        return fmtWear ? fmtWear(r) : '';
      default:
        return r.category || '';
    }
  }

  function sortRelicTableRows(rows) {
    if (!Array.isArray(rows)) return rows;
    const key = relicSortKey || 'category';
    const dir = relicSortDir === 'desc' ? 'desc' : 'asc';
    rows.sort((a, b) => {
      const primary = compareRelicTableValues(
        relicTableSortValue(a, key),
        relicTableSortValue(b, key),
        dir,
      );
      if (primary) return primary;
      const byCategory = compareRelicTableValues(a.category || '', b.category || '', 'asc');
      if (byCategory) return byCategory;
      return compareRelicTableValues(Number(a.rid) || 0, Number(b.rid) || 0, 'asc');
    });
    return rows;
  }

  function updateRelicSortHeaderClasses() {
    document.querySelectorAll('#relic-table thead th[data-sort]').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      th.removeAttribute('aria-sort');
      if (th.dataset.sort === relicSortKey) {
        const cls = relicSortDir === 'asc' ? 'sort-asc' : 'sort-desc';
        th.classList.add(cls);
        th.setAttribute('aria-sort', relicSortDir === 'asc' ? 'ascending' : 'descending');
      }
    });
  }

  function relicPassesFilters(r) {
    if (r.rid != null && deletedRelics.has(String(r.rid))) return false;
    if (relicFilterGrade && String(r.gradeStr || '') !== relicFilterGrade) return false;
    if (relicFilterCategory && String(r.category || '') !== relicFilterCategory) return false;
    if (relicFilterLocation === 'inventory') {
      if (r.occupiedId != null && Number(r.occupiedId) !== 0) return false;
    } else if (relicFilterLocation === 'equipped') {
      if (r.occupiedId == null || Number(r.occupiedId) === 0) return false;
    }
    return true;
  }

  function readRelicFiltersFromDom() {
    return {
      grade: document.getElementById('filter-relic-grade')?.value || '',
      category: document.getElementById('filter-relic-category')?.value || '',
      location: document.getElementById('filter-relic-location')?.value || '',
    };
  }

  function applyRelicFiltersFromDom() {
    const f = readRelicFiltersFromDom();
    relicFilterGrade = f.grade;
    relicFilterCategory = f.category;
    relicFilterLocation = f.location;
  }

  function countActiveRelicFilters() {
    let n = 0;
    if (relicFilterGrade) n++;
    if (relicFilterCategory) n++;
    if (relicFilterLocation) n++;
    return n;
  }

  function relicFilterChipDefs() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const chips = [];
    const push = (key, label) => {
      if (label) chips.push({ key, label });
    };
    if (relicFilterGrade) push('grade', `${t.relicFilterGrade || 'Grade'}: ${relicFilterGrade}`);
    if (relicFilterCategory) {
      push('category', `${t.relicFilterCategory || 'Category'}: ${relicFilterCategory}`);
    }
    if (relicFilterLocation) {
      const locLbl =
        relicFilterLocation === 'inventory'
          ? t.relicFilterInventory || t.artifactFilterInventory || 'Inventory'
          : t.relicFilterEquipped || t.artifactFilterEquipped || 'Equipped';
      push('location', `${t.relicFilterLocation || 'Location'}: ${locLbl}`);
    }
    return chips;
  }

  function clearRelicFilterChip(key) {
    const map = {
      grade: 'filter-relic-grade',
      category: 'filter-relic-category',
      location: 'filter-relic-location',
    };
    const id = map[key];
    const el = id ? document.getElementById(id) : null;
    if (el) el.value = '';
    applyRelicFiltersFromDom();
    updateRelicFilterBadge();
    renderGearTables();
  }

  function exportRelicsCsv() {
    const rows = filteredRelics || [];
    if (!rows.length) return;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    const fmtWear =
      window.SWRM && typeof window.SWRM.formatRelicWearCount === 'function'
        ? window.SWRM.formatRelicWearCount
        : null;
    const headers = [
      tloc.thRelCategory || 'Category',
      tloc.thRelGrade || 'Grade',
      'Level',
      tloc.thRelDurability || 'Durability',
      tloc.thRelLocation || 'Main',
      'Secondary',
      tloc.thRelWearers || 'Equipped',
    ];
    const cellPart = (s) => {
      const raw = String(s ?? '');
      if (/[,"\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    };
    const lines = [headers.map(cellPart).join(',')];
    rows.forEach((r) => {
      lines.push(
        [
          r.category || '',
          r.gradeStr || '',
          r.level || 0,
          fmtDur ? fmtDur(r) : '',
          r.pri && fmt ? fmt(r.pri, { kind: 'relic' }) : '',
          fmtSec ? fmtSec(r) : '',
          fmtWear ? fmtWear(r) : '',
        ]
          .map(cellPart)
          .join(','),
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sw-forge-relics.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyRelicTableSearch() {
    const relQ = (document.getElementById('search-box-relics')?.value || '').trim().toLowerCase();
    const relSrc = (allRelics || []).filter(relicPassesFilters);
    const rawQ = document.getElementById('search-box-relics')?.value || '';
    filteredRelics = !relQ ? relSrc.slice() : relSrc.filter((r) => gearMatchesSearchQuery(r, rawQ));
  }

  function relicToolbarHasActiveFilters() {
    const q = (document.getElementById('search-box-relics')?.value || '').trim();
    if (q) return true;
    return countActiveRelicFilters() > 0;
  }

  function updateRelicResetButton() {
    if (typeof updateToolbarResetButton === 'function') {
      updateToolbarResetButton('relic-filters-drawer-reset', relicToolbarHasActiveFilters());
    }
  }

  function updateRelicFilterBadge() {
    const n = countActiveRelicFilters();
    updateGearFiltersButtonState('relic-more-filters-btn', 'relic-filters-active-count', n);
    renderGearFilterChips(relicFilterChipDefs());
    updateRelicResetButton();
  }

  function resetRelicTableFilters() {
    relicFilterGrade = '';
    relicFilterCategory = '';
    relicFilterLocation = '';
    const sb = document.getElementById('search-box-relics');
    if (sb) sb.value = '';
    ['filter-relic-grade', 'filter-relic-category', 'filter-relic-location'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    updateRelicFilterBadge();
    updateRelicResetButton();
    renderGearTables();
  }

  function renderRelicTableBody() {
    const tbody = document.getElementById('relic-tbody');
    if (!tbody) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    sortRelicTableRows(filteredRelics);
    updateRelicSortHeaderClasses();
    if (!filteredRelics.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${escapeHtml(t.tableGearEmptyRelics || 'No relics')}</td></tr>`;
      if (typeof renderRelicTableRosterChips === 'function') renderRelicTableRosterChips();
      return;
    }
    const rows = filteredRelics
      .slice()
      .map((r, i) => {
        const main = r.pri && fmt ? fmt(r.pri, { kind: 'relic' }) : '—';
        const sec = fmtSec ? fmtSec(r) : '—';
        const dur = fmtDur ? fmtDur(r) : '—';
        const category = r.category ? r.category : '—';
        const fmtWear =
          window.SWRM && typeof window.SWRM.formatRelicWearCount === 'function'
            ? window.SWRM.formatRelicWearCount
            : null;
        const wear = fmtWear ? fmtWear(r) : '0/100';
        const catFn = window.SWRM && window.SWRM.gearCategoryCellHtml;
        const paths =
          window.SWRM && typeof window.SWRM.relicLocalIconCandidates === 'function'
            ? window.SWRM.relicLocalIconCandidates(r)
            : [];
        const catCell =
          typeof catFn === 'function' ? catFn('', category, paths) : escapeHtml(category);
        const evenClass = i % 2 === 0 ? 'gear-table__data-row--even' : '';
        return `<tr class="gear-table__data-row ${evenClass}">
          <td class="col-category">${catCell}</td>
          <td class="col-lvl th-num">+${escapeHtml(String(r.level || 0))}</td>
          <td class="col-durability th-num">${escapeHtml(dur)}</td>
          <td class="col-main col-block-gap">${escapeHtml(main)}</td>
          <td class="col-sec">${escapeHtml(sec)}</td>
          <td class="col-equipped th-num col-block-gap">${escapeHtml(wear)}</td>
          <td class="col-actions"><button type="button" class="gear-table__delete-btn btn-secondary btn-sm" data-delete-relic="${escapeHtml(String(r.rid))}" title="Sell relic">Sold</button></td>
        </tr>`;
      });
    tbody.innerHTML = rows.join('');
    if (typeof renderRelicTableRosterChips === 'function') renderRelicTableRosterChips();
  }

  function bindRelicTableFilters() {
    if (bindRelicTableFilters._done) return;
    bindRelicTableFilters._done = true;

    loadDeletedRelics();

    if (typeof bindGearFilterChipsClear === 'function') bindGearFilterChipsClear();

    document.querySelectorAll('#relic-table thead th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort || 'category';
        if (relicSortKey === key) relicSortDir = relicSortDir === 'asc' ? 'desc' : 'asc';
        else {
          relicSortKey = key;
          relicSortDir = key === 'level' || key === 'durability' || key === 'equipped' ? 'desc' : 'asc';
        }
        renderGearTables();
      });
    });

    const onRelicFilterChange = () => {
      applyRelicFiltersFromDom();
      updateRelicFilterBadge();
      renderGearTables();
    };

    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('relic-more-filters-btn', 'relic-filters-popover', {
        onClose: onRelicFilterChange,
      });
    }

    document.getElementById('relic-filters-drawer-reset')?.addEventListener('click', resetRelicTableFilters);
    document.getElementById('btn-relic-export-csv')?.addEventListener('click', exportRelicsCsv);

    // Bind relic sort popover
    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('relic-sort-btn', 'relic-sort-popover', { onClose: () => {} });
    }

    // Handle relic sort parameter select change
    const relicSortParameterSelect = document.getElementById('relic-sort-parameter');
    const relicSortDirectionBtn = document.getElementById('relic-sort-direction-toggle');
    let currentRelicSortDirection = 'asc';

    if (relicSortParameterSelect) {
      relicSortParameterSelect.addEventListener('change', () => {
        const key = relicSortParameterSelect.value;
        relicSortKey = key;
        relicSortDir = currentRelicSortDirection;
        renderGearTables();
      });
    }

    // Handle relic direction toggle button
    if (relicSortDirectionBtn) {
      relicSortDirectionBtn.addEventListener('click', () => {
        currentRelicSortDirection = currentRelicSortDirection === 'desc' ? 'asc' : 'desc';
        relicSortDirectionBtn.textContent = currentRelicSortDirection === 'desc' ? '↓' : '↑';
        if (relicSortParameterSelect) {
          const key = relicSortParameterSelect.value;
          relicSortKey = key;
          relicSortDir = currentRelicSortDirection;
          renderGearTables();
        }
      });
    }

    // Handle relic Reset sort button
    const relicResetSortBtn = document.getElementById('btn-relic-reset-sort');
    if (relicResetSortBtn) {
      relicResetSortBtn.addEventListener('click', () => {
        if (relicSortParameterSelect) {
          relicSortParameterSelect.value = 'category';
        }
        currentRelicSortDirection = 'asc';
        if (relicSortDirectionBtn) {
          relicSortDirectionBtn.textContent = '↓';
        }
        relicSortKey = 'category';
        relicSortDir = 'asc';
        renderGearTables();
      });
    }

    // Handle relic Done button
    const relicSortPopoverDoneBtn = document.querySelector('#relic-sort-popover [data-filters-popover-done]');
    if (relicSortPopoverDoneBtn) {
      relicSortPopoverDoneBtn.addEventListener('click', () => {
        const popover = document.getElementById('relic-sort-popover');
        if (popover) popover.hidden = true;
      });
    }

    document.getElementById('relic-table-scroll')?.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-delete-relic]');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const relicId = deleteBtn.getAttribute('data-delete-relic');
        if (relicId && confirm('Sell this relic from the current profile?')) {
          deleteRelic(relicId);
        }
      }
    });

    ['filter-relic-grade', 'filter-relic-category', 'filter-relic-location'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', onRelicFilterChange);
    });

    let relDebounce = null;
    document.getElementById('search-box-relics')?.addEventListener('input', () => {
      clearTimeout(relDebounce);
      relDebounce = setTimeout(() => {
        updateRelicFilterBadge();
        renderGearTables();
      }, 280);
    });
    updateRelicFilterBadge();
  }
