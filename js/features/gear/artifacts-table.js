// js/features/gear/artifacts-table.js — artifact inventory table
  let filteredArtifacts = [];
  let artifactFilterGrade = '';
  let artifactFilterCategory = '';
  let artifactFilterLocation = '';
  let artifactFilterVerdict = '';

  function artifactPassesFilters(a) {
    if (artifactFilterVerdict && a.artifactVerdict !== artifactFilterVerdict) return false;
    if (artifactFilterGrade && String(a.gradeStr || '') !== artifactFilterGrade) return false;
    if (artifactFilterCategory && String(a.category || '') !== artifactFilterCategory) return false;
    if (artifactFilterLocation === 'inventory') {
      if (a.occupiedId != null && Number(a.occupiedId) !== 0) return false;
    } else if (artifactFilterLocation === 'equipped') {
      if (a.occupiedId == null || Number(a.occupiedId) === 0) return false;
    }
    return true;
  }

  function exportArtifactsCsv() {
    const rows = filteredArtifacts || [];
    if (!rows.length) return;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    const headers = [
      tloc.thArtGrade || 'Grade',
      tloc.thArtCategory || 'Category',
      tloc.thArtMain || 'Main',
      tloc.thArtSubs || 'Subs',
      tloc.thArtRole || 'Role',
      tloc.thArtVerdict || 'Verdict',
      tloc.thArtLocation || 'Location',
    ];
    const cellPart = (s) => {
      const raw = String(s ?? '');
      if (/[,"\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    };
    const lines = [headers.map(cellPart).join(',')];
    rows.forEach((a) => {
      const main = a.pri && fmt ? fmt(a.pri, { kind: 'artifact' }) : '';
      const subs = (a.secs || [])
        .map((s) => (fmtSub ? fmtSub(s) : ''))
        .filter(Boolean)
        .join(' | ');
      lines.push(
        [
          a.gradeStr || '',
          a.category || '',
          main,
          subs,
          a.artifactRole || '',
          a.artifactVerdict || '',
          gearLocationLabel(a.occupiedId, tloc),
        ]
          .map(cellPart)
          .join(','),
      );
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sw-forge-artifacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyArtifactTableSearch() {
    const artQ = (document.getElementById('search-box-artifacts')?.value || '')
      .trim()
      .toLowerCase();
    const artSrc = (allArtifacts || []).filter(artifactPassesFilters);
    const rawQ = document.getElementById('search-box-artifacts')?.value || '';
    filteredArtifacts = !artQ
      ? artSrc.slice()
      : artSrc.filter((a) => gearMatchesSearchQuery(a, rawQ));
  }

  function artifactToolbarHasActiveFilters() {
    const q = (document.getElementById('search-box-artifacts')?.value || '').trim();
    if (q) return true;
    return countActiveArtifactFilters() > 0;
  }

  function updateArtifactResetButton() {
    if (typeof updateToolbarResetButton === 'function') {
      updateToolbarResetButton('btn-artifact-reset-filters', artifactToolbarHasActiveFilters());
    }
  }

  function countActiveArtifactFilters() {
    let n = 0;
    if (artifactFilterVerdict) n++;
    if (artifactFilterGrade) n++;
    if (artifactFilterCategory) n++;
    if (artifactFilterLocation) n++;
    return n;
  }

  function updateArtifactFilterBadge() {
    const badge = document.getElementById('artifact-filters-active-count');
    if (!badge) return;
    const n = countActiveArtifactFilters();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
    updateArtifactResetButton();
  }

  function resetArtifactTableFilters() {
    artifactFilterGrade = '';
    artifactFilterCategory = '';
    artifactFilterLocation = '';
    artifactFilterVerdict = '';
    const sb = document.getElementById('search-box-artifacts');
    if (sb) sb.value = '';
    const g = document.getElementById('filter-artifact-grade');
    const c = document.getElementById('filter-artifact-category');
    const l = document.getElementById('filter-artifact-location');
    const v = document.getElementById('filter-artifact-verdict');
    if (g) g.value = '';
    if (c) c.value = '';
    if (l) l.value = '';
    if (v) v.value = '';
    updateArtifactFilterBadge();
    updateArtifactResetButton();
    renderGearTables();
  }

  function artifactSubStack(a, fmtSub) {
    const subs = (a.secs || []).slice(0, 4);
    if (!subs.length) {
      return '<span class="gear-table-subs__empty">—</span>';
    }
    return subs
      .map((s) => {
        const text = s && fmtSub ? fmtSub(s) : '—';
        return `<span class="gear-table-subs__line">${escapeHtml(text)}</span>`;
      })
      .join('');
  }

  function renderArtifactTableBody() {
    const tbody = document.getElementById('artifact-tbody');
    if (!tbody) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    if (!filteredArtifacts.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${escapeHtml(t.tableGearEmpty || 'No artifacts')}</td></tr>`;
      if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();
      return;
    }
    if (typeof bindArtifactTableVirtualScroll === 'function') bindArtifactTableVirtualScroll();
    if (typeof paintArtifactTableVirtualBody === 'function') {
      artifactVirtualLastKey = '';
      paintArtifactTableVirtualBody(filteredArtifacts);
    } else {
      const rows = filteredArtifacts
        .slice()
        .sort(
          (a, b) =>
            String(a.category).localeCompare(String(b.category)) ||
            String(a.gradeStr).localeCompare(String(b.gradeStr)),
        )
        .map((a, i) => {
          const main = a.pri && fmt ? fmt(a.pri, { kind: 'artifact' }) : '—';
          const catFn = window.SWRM && window.SWRM.gearCategoryCellHtml;
          const iconUrl =
            window.SWRM && typeof window.SWRM.artifactIconUrl === 'function'
              ? window.SWRM.artifactIconUrl(a)
              : '';
          const catCell =
            typeof catFn === 'function'
              ? catFn(iconUrl, a.category || '—')
              : escapeHtml(a.category || '—');
          const gradeFn = window.SWRM && typeof window.SWRM.gearGradeTagHtml === 'function'
            ? window.SWRM.gearGradeTagHtml
            : null;
          const gradeCell = gradeFn
            ? gradeFn(a.gradeStr)
            : escapeHtml(a.gradeStr || '—');
          const verdict = a.artifactVerdict || null;
          const role = a.artifactRole || null;
          const verdictClass =
            verdict === 'keep' ? 'verdict-tag keep' : verdict === 'sell' ? 'verdict-tag sell' : '';
          const verdictLabel = verdict
            ? verdict === 'keep'
              ? t.artifactVerdictKeep || 'Keep'
              : t.artifactVerdictSell || 'Sell'
            : '—';
          const evenClass = i % 2 === 0 ? 'gear-table__data-row--even' : '';
          return `<tr class="gear-table__data-row ${evenClass}">
            <td class="col-grade">${gradeCell}</td>
            <td class="col-category">${catCell}</td>
            <td class="col-main">${escapeHtml(main)}</td>
            <td class="col-subs-stack"><div class="gear-table-subs">${artifactSubStack(a, fmtSub)}</div></td>
            <td class="col-art-role">${escapeHtml(role || '—')}</td>
            <td class="col-art-verdict">${verdict ? `<span class="${escapeHtml(verdictClass)}">${escapeHtml(verdictLabel)}</span>` : '—'}</td>
            <td class="col-location">${escapeHtml(gearLocationLabel(a.occupiedId, t))}</td>
          </tr>`;
        });
      tbody.innerHTML = rows.join('');
    }
    if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();
  }

  function bindArtifactTableFilters() {
    if (bindArtifactTableFilters._done) return;
    bindArtifactTableFilters._done = true;

    const onArtifactFilterChange = () => {
      artifactFilterGrade = document.getElementById('filter-artifact-grade')?.value || '';
      artifactFilterCategory = document.getElementById('filter-artifact-category')?.value || '';
      artifactFilterLocation = document.getElementById('filter-artifact-location')?.value || '';
      artifactFilterVerdict = document.getElementById('filter-artifact-verdict')?.value || '';
      updateArtifactFilterBadge();
      renderGearTables();
    };

    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('artifact-more-filters-btn', 'artifact-filters-popover', {
        onClose: onArtifactFilterChange,
      });
    }

    document.getElementById('btn-artifact-reset-filters')?.addEventListener('click', resetArtifactTableFilters);
    document.getElementById('artifact-filters-drawer-reset')?.addEventListener('click', resetArtifactTableFilters);
    document.getElementById('btn-artifact-export-csv')?.addEventListener('click', exportArtifactsCsv);

    document.getElementById('filter-artifact-grade')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-category')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-location')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-verdict')?.addEventListener('change', onArtifactFilterChange);

    let artDebounce = null;
    document.getElementById('search-box-artifacts')?.addEventListener('input', () => {
      clearTimeout(artDebounce);
      artDebounce = setTimeout(() => {
        updateArtifactResetButton();
        renderGearTables();
      }, 280);
    });
    updateArtifactResetButton();
  }
