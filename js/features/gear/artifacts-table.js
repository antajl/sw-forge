// js/features/gear/artifacts-table.js — artifact inventory table

  let filteredArtifacts = [];

  let artifactFilterGrade = '';

  let artifactFilterType = '';

  let artifactFilterAttribute = '';

  let artifactFilterRole = '';

  let artifactFilterLocation = '';

  let artifactFilterVerdict = '';


  function compareArtifactTableValues(a, b, dir) {
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

  function artifactTableSortValue(a, key) {
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    switch (key) {
      case 'grade':
        return Number(a.grade) || 0;
      case 'category':
        return a.category || '';
      case 'main':
        return a.pri && fmt ? fmt(a.pri, { kind: 'artifact' }) : '';
      case 'subs':
        return (a.secs || []).map((s) => (fmtSub ? fmtSub(s) : '')).join(' ');
      case 'ingame':
        return Number.isFinite(Number(a.artifactIngameScore)) ? Number(a.artifactIngameScore) : -1;
      case 'forge':
        return Number.isFinite(Number(a.artifactForgeScore)) ? Number(a.artifactForgeScore) : -1;
      case 'role':
        return a.artifactRole || '';
      case 'verdict':
        return a.artifactVerdict || '';
      case 'location':
        return gearLocationLabel(a.occupiedId, TRANSLATIONS[currentLang] || TRANSLATIONS.en);
      default:
        return Number.isFinite(Number(a.artifactForgeScore)) ? Number(a.artifactForgeScore) : -1;
    }
  }

  function sortArtifactTableRows(rows) {
    if (!Array.isArray(rows)) return rows;
    const key = artifactSortKey || 'forge';
    const dir = artifactSortDir === 'asc' ? 'asc' : 'desc';
    rows.sort((a, b) => {
      const primary = compareArtifactTableValues(
        artifactTableSortValue(a, key),
        artifactTableSortValue(b, key),
        dir,
      );
      if (primary) return primary;
      const byCategory = compareArtifactTableValues(a.category || '', b.category || '', 'asc');
      if (byCategory) return byCategory;
      return compareArtifactTableValues(Number(a.rid) || 0, Number(b.rid) || 0, 'asc');
    });
    return rows;
  }

  function updateArtifactSortHeaderClasses() {
    document.querySelectorAll('#artifact-table thead th[data-sort]').forEach((th) => {
      th.classList.remove('sort-asc', 'sort-desc');
      th.removeAttribute('aria-sort');
      if (th.dataset.sort === artifactSortKey) {
        const cls = artifactSortDir === 'asc' ? 'sort-asc' : 'sort-desc';
        th.classList.add(cls);
        th.setAttribute('aria-sort', artifactSortDir === 'asc' ? 'ascending' : 'descending');
      }
    });
  }


  function artifactPassesFilters(a) {

    if (artifactFilterVerdict && a.artifactVerdict !== artifactFilterVerdict) return false;

    if (artifactFilterGrade && String(a.gradeStr || '') !== artifactFilterGrade) return false;

    const pieceType = Number(a.pieceType != null ? a.pieceType : a.gearType);

    if (artifactFilterType) {

      if (pieceType !== 2 && Number(a.slot) !== 2) return false;

      if (String(a.category || '') !== artifactFilterType) return false;

    }

    if (artifactFilterAttribute) {

      if (pieceType !== 1 && Number(a.slot) !== 1) return false;

      if (String(a.category || '') !== artifactFilterAttribute) return false;

    }

    if (artifactFilterRole && String(a.artifactRole || '') !== artifactFilterRole) return false;

    if (artifactFilterLocation === 'inventory') {

      if (a.occupiedId != null && Number(a.occupiedId) !== 0) return false;

    } else if (artifactFilterLocation === 'equipped') {

      if (a.occupiedId == null || Number(a.occupiedId) === 0) return false;

    }

    return true;

  }



  function readArtifactFiltersFromDom() {

    return {

      grade: document.getElementById('filter-artifact-grade')?.value || '',

      type: document.getElementById('filter-artifact-type')?.value || '',

      attribute: document.getElementById('filter-artifact-attribute')?.value || '',

      role: document.getElementById('filter-artifact-role')?.value || '',

      location: document.getElementById('filter-artifact-location')?.value || '',

      verdict: document.getElementById('filter-artifact-verdict')?.value || '',

    };

  }



  function applyArtifactFiltersFromDom() {

    const f = readArtifactFiltersFromDom();

    artifactFilterGrade = f.grade;

    artifactFilterType = f.type;

    artifactFilterAttribute = f.attribute;

    artifactFilterRole = f.role;

    artifactFilterLocation = f.location;

    artifactFilterVerdict = f.verdict;

  }



  function countActiveArtifactFilters() {

    let n = 0;

    if (artifactFilterVerdict) n++;

    if (artifactFilterGrade) n++;

    if (artifactFilterType) n++;

    if (artifactFilterAttribute) n++;

    if (artifactFilterRole) n++;

    if (artifactFilterLocation) n++;

    return n;

  }



  function artifactFilterChipDefs() {

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    const chips = [];

    const push = (key, label) => {

      if (label) chips.push({ key, label });

    };

    if (artifactFilterVerdict) {

      push(

        'verdict',

        `${t.artifactFilterVerdict || 'Verdict'}: ${artifactFilterVerdict === 'keep' ? t.artifactVerdictKeep || 'Keep' : t.artifactVerdictSell || 'Sell'}`,

      );

    }

    if (artifactFilterGrade) push('grade', `${t.artifactFilterGrade || 'Grade'}: ${artifactFilterGrade}`);

    if (artifactFilterType) {

      push(

        'type',

        `${t.artifactFilterType || 'Type'}: ${artifactTypeOptionLabel(t, artifactFilterType)}`,

      );

    }

    if (artifactFilterAttribute) {

      push(

        'attribute',

        `${t.artifactFilterAttribute || 'Attribute'}: ${artifactAttributeOptionLabel(t, artifactFilterAttribute)}`,

      );

    }

    if (artifactFilterRole) push('role', `${t.artifactFilterRole || 'Role'}: ${artifactFilterRole}`);

    if (artifactFilterLocation) {

      const locLbl =

        artifactFilterLocation === 'inventory'

          ? t.artifactFilterInventory || 'Inventory'

          : t.artifactFilterEquipped || 'Equipped';

      push('location', `${t.artifactFilterLocation || 'Location'}: ${locLbl}`);

    }

    return chips;

  }



  function clearArtifactFilterChip(key) {

    const map = {

      verdict: 'filter-artifact-verdict',

      grade: 'filter-artifact-grade',

      type: 'filter-artifact-type',

      attribute: 'filter-artifact-attribute',

      role: 'filter-artifact-role',

      location: 'filter-artifact-location',

    };

    const id = map[key];

    const el = id ? document.getElementById(id) : null;

    if (el) el.value = '';

    applyArtifactFiltersFromDom();

    updateArtifactFilterBadge();

    renderGearTables();

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

      updateToolbarResetButton('artifact-filters-drawer-reset', artifactToolbarHasActiveFilters());

    }

  }



  function updateArtifactFilterBadge() {

    const n = countActiveArtifactFilters();

    updateGearFiltersButtonState('artifact-more-filters-btn', 'artifact-filters-active-count', n);

    renderGearFilterChips(artifactFilterChipDefs());

    updateArtifactResetButton();

  }



  function resetArtifactTableFilters() {

    artifactFilterGrade = '';

    artifactFilterType = '';

    artifactFilterAttribute = '';

    artifactFilterRole = '';

    artifactFilterLocation = '';

    artifactFilterVerdict = '';

    const sb = document.getElementById('search-box-artifacts');

    if (sb) sb.value = '';

    const ids = [

      'filter-artifact-grade',

      'filter-artifact-type',

      'filter-artifact-attribute',

      'filter-artifact-role',

      'filter-artifact-location',

      'filter-artifact-verdict',

    ];

    ids.forEach((id) => {

      const el = document.getElementById(id);

      if (el) el.value = '';

    });

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

    sortArtifactTableRows(filteredArtifacts);
    updateArtifactSortHeaderClasses();

    if (!filteredArtifacts.length) {

      tbody.innerHTML = `<tr><td colspan="9" class="table-empty">${escapeHtml(t.tableGearEmpty || 'No artifacts')}</td></tr>`;

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
          const ingameScore = Number(a.artifactIngameScore);
          const forgeScore = Number(a.artifactForgeScore);

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

            <td class="col-art-ingame th-num col-block-gap">${Number.isFinite(ingameScore) ? escapeHtml(String(ingameScore)) : '—'}</td>

            <td class="col-art-forge th-num">${Number.isFinite(forgeScore) ? escapeHtml(forgeScore.toFixed(1)) : '—'}</td>

            <td class="col-art-role col-block-gap">${escapeHtml(role || '—')}</td>

            <td class="col-art-verdict">${verdict ? `<span class="${escapeHtml(verdictClass)}">${escapeHtml(verdictLabel)}</span>` : '—'}</td>

            <td class="col-location col-block-gap">${escapeHtml(gearLocationLabel(a.occupiedId, t))}</td>

          </tr>`;

        });

      tbody.innerHTML = rows.join('');

    }

    if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();

  }



  function bindArtifactTableFilters() {

    if (bindArtifactTableFilters._done) return;

    bindArtifactTableFilters._done = true;



    if (typeof initArtifactTypeAttributeFilterOptions === 'function') {

      initArtifactTypeAttributeFilterOptions();

    }

    if (typeof bindGearFilterChipsClear === 'function') bindGearFilterChipsClear();

    document.querySelectorAll('#artifact-table thead th[data-sort]').forEach((th) => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort || 'forge';
        if (artifactSortKey === key) artifactSortDir = artifactSortDir === 'asc' ? 'desc' : 'asc';
        else {
          artifactSortKey = key;
          artifactSortDir = key === 'category' || key === 'main' || key === 'role' || key === 'location' ? 'asc' : 'desc';
        }
        if (typeof resetArtifactTableVirtualScroll === 'function') resetArtifactTableVirtualScroll();
        renderGearTables();
      });
    });



    const onArtifactFilterChange = () => {

      applyArtifactFiltersFromDom();

      updateArtifactFilterBadge();

      renderGearTables();

    };



    if (typeof bindFiltersPopover === 'function') {

      bindFiltersPopover('artifact-more-filters-btn', 'artifact-filters-popover', {

        onClose: onArtifactFilterChange,

      });

    }



    document.getElementById('artifact-filters-drawer-reset')?.addEventListener('click', resetArtifactTableFilters);

    document.getElementById('btn-artifact-export-csv')?.addEventListener('click', exportArtifactsCsv);



    [

      'filter-artifact-grade',

      'filter-artifact-type',

      'filter-artifact-attribute',

      'filter-artifact-role',

      'filter-artifact-location',

      'filter-artifact-verdict',

    ].forEach((id) => {

      document.getElementById(id)?.addEventListener('change', onArtifactFilterChange);

    });



    let artDebounce = null;

    document.getElementById('search-box-artifacts')?.addEventListener('input', () => {

      clearTimeout(artDebounce);

      artDebounce = setTimeout(() => {

        updateArtifactFilterBadge();

        renderGearTables();

      }, 280);

    });

    updateArtifactFilterBadge();

  }


