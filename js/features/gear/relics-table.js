// js/features/gear/relics-table.js — relic inventory table
  let filteredRelics = [];
  let relicFilterGrade = '';
  let relicFilterCategory = '';

  function relicPassesFilters(r) {
    if (relicFilterGrade && String(r.gradeStr || '') !== relicFilterGrade) return false;
    if (relicFilterCategory && String(r.category || '') !== relicFilterCategory) return false;
    return true;
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
      updateToolbarResetButton('btn-relic-reset-filters', relicToolbarHasActiveFilters());
    }
  }

  function countActiveRelicFilters() {
    let n = 0;
    if (relicFilterGrade) n++;
    if (relicFilterCategory) n++;
    return n;
  }

  function updateRelicFilterBadge() {
    const badge = document.getElementById('relic-filters-active-count');
    if (!badge) return;
    const n = countActiveRelicFilters();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
    updateRelicResetButton();
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

  function resetRelicTableFilters() {
    relicFilterGrade = '';
    relicFilterCategory = '';
    const sb = document.getElementById('search-box-relics');
    if (sb) sb.value = '';
    const g = document.getElementById('filter-relic-grade');
    const c = document.getElementById('filter-relic-category');
    if (g) g.value = '';
    if (c) c.value = '';
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
    if (!filteredRelics.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${escapeHtml(t.tableGearEmptyRelics || 'No relics')}</td></tr>`;
      if (typeof renderRelicTableRosterChips === 'function') renderRelicTableRosterChips();
      return;
    }
    const rows = filteredRelics
      .slice()
      .sort(
        (a, b) =>
          String(a.category).localeCompare(String(b.category)) ||
          (b.level || 0) - (a.level || 0),
      )
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
          <td class="col-main">${escapeHtml(main)}</td>
          <td class="col-sec">${escapeHtml(sec)}</td>
          <td class="col-equipped th-num">${escapeHtml(wear)}</td>
        </tr>`;
      });
    tbody.innerHTML = rows.join('');
    if (typeof renderRelicTableRosterChips === 'function') renderRelicTableRosterChips();
  }

  function bindRelicTableFilters() {
    if (bindRelicTableFilters._done) return;
    bindRelicTableFilters._done = true;

    const onRelicFilterChange = () => {
      relicFilterGrade = document.getElementById('filter-relic-grade')?.value || '';
      relicFilterCategory = document.getElementById('filter-relic-category')?.value || '';
      updateRelicFilterBadge();
      renderGearTables();
    };

    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('relic-more-filters-btn', 'relic-filters-popover', {
        onClose: onRelicFilterChange,
      });
    }

    document.getElementById('btn-relic-reset-filters')?.addEventListener('click', resetRelicTableFilters);
    document.getElementById('relic-filters-drawer-reset')?.addEventListener('click', resetRelicTableFilters);
    document.getElementById('btn-relic-export-csv')?.addEventListener('click', exportRelicsCsv);

    document.getElementById('filter-relic-grade')?.addEventListener('change', onRelicFilterChange);
    document.getElementById('filter-relic-category')?.addEventListener('change', onRelicFilterChange);

    let relDebounce = null;
    document.getElementById('search-box-relics')?.addEventListener('input', () => {
      clearTimeout(relDebounce);
      relDebounce = setTimeout(() => {
        updateRelicResetButton();
        renderGearTables();
      }, 280);
    });
    updateRelicResetButton();
  }
