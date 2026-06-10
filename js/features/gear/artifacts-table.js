// js/features/gear/artifacts-table.js — artifact inventory table

  let filteredArtifacts = [];

  let deletedArtifacts = new Set();

  const DELETED_ARTIFACTS_KEY = 'swrm_deleted_artifacts_v1';

  function loadDeletedArtifacts() {
    try {
      const stored = localStorage.getItem(DELETED_ARTIFACTS_KEY);
      if (stored) {
        deletedArtifacts = new Set(JSON.parse(stored));
      }
    } catch (e) {
      deletedArtifacts = new Set();
    }
  }

  function saveDeletedArtifacts() {
    try {
      localStorage.setItem(DELETED_ARTIFACTS_KEY, JSON.stringify([...deletedArtifacts]));
    } catch (e) {
      // Ignore storage errors
    }
  }

  function deleteArtifact(artifactId) {
    if (!artifactId) return;
    deletedArtifacts.add(String(artifactId));
    saveDeletedArtifacts();
    renderGearTables();
  }

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

    if (a.rid != null && deletedArtifacts.has(String(a.rid))) return false;

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

        return `<span class="gear-table-subs__line" data-full-text="${escapeAttr(text)}">${escapeHtml(text)}</span>`;

      })

      .join('');

  }



  function setupArtifactSubsScrollAnimation(tbody) {
    const rows = tbody.querySelectorAll('tr.gear-table__data-row');
    
    rows.forEach(row => {
      const subsLines = row.querySelectorAll('.gear-table-subs__line');
      let scrollAnimations = [];
      
      row.addEventListener('mouseenter', () => {
        subsLines.forEach(line => {
          // Check if text is truncated
          if (line.scrollWidth > line.clientWidth) {
            const fullText = line.getAttribute('data-full-text');
            
            // Create inner span for animation
            line.innerHTML = `<span class="gear-table-subs__line-inner">${escapeHtml(fullText)}</span>`;
            const innerSpan = line.querySelector('.gear-table-subs__line-inner');
            
            line.style.textOverflow = 'clip';
            
            // Calculate the distance to scroll to show full text
            const scrollDistance = innerSpan.scrollWidth - line.clientWidth;
            
            // Use GSAP if available, otherwise use CSS animation
            if (typeof gsap !== 'undefined' && gsap.to) {
              const animation = gsap.fromTo(innerSpan, 
                { x: 0 },
                { 
                  x: -scrollDistance,
                  duration: 1.5,
                  ease: 'none',
                  repeat: -1,
                  repeatDelay: 0.3
                }
              );
              scrollAnimations.push(animation);
            } else {
              // Fallback to CSS animation
              innerSpan.style.animation = 'scroll-text 1.5s linear infinite';
            }
          }
        });
      });
      
      row.addEventListener('mouseleave', () => {
        // Stop all animations
        scrollAnimations.forEach(animation => {
          if (animation && animation.kill) {
            animation.kill();
          }
        });
        scrollAnimations = [];
        
        // Reset all lines
        subsLines.forEach(line => {
          line.style.animation = '';
          line.style.textOverflow = 'ellipsis';
          const fullText = line.getAttribute('data-full-text');
          line.textContent = fullText;
        });
      });
    });
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

      tbody.innerHTML = `<tr><td colspan="8" class="table-empty">${escapeHtml(t.tableGearEmpty || 'No artifacts')}</td></tr>`;

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

              ? catFn(iconUrl, a.category || '—', null, a.gradeStr)

              : escapeHtml(a.category || '—');

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

          const ingameShown = String(ingameScore);
          const ingameTip = typeof window.SWRM?.artifactIngameScoreBreakdown === 'function'
              ? window.SWRM.artifactIngameScoreBreakdown(a).join('\n')
              : t.tableIngameScoreHeaderTitle || '';
          const ingameTipAttr = ingameTip ? ` data-swrm-tip="${escapeAttr(ingameTip)}"` : '';

          const scoreShown = Number.isFinite(forgeScore) ? forgeScore.toFixed(1) : '—';
          const scoreTip = typeof window.SWRM?.artifactForgeScoreTooltip === 'function'
              ? window.SWRM.artifactForgeScoreTooltip(a, t)
              : t.tableScoreHint || '';
          const scoreTipAttr = scoreTip ? ` data-swrm-tip="${escapeAttr(scoreTip)}"` : '';

          return `<tr class="gear-table__data-row ${evenClass}">

            <td class="col-location col-block-gap">${escapeHtml(gearLocationLabel(a.occupiedId, t))}</td>

            <td class="col-category">${catCell}</td>

            <td class="col-main">${escapeHtml(main)}</td>

            <td class="col-subs-stack"><div class="gear-table-subs">${artifactSubStack(a, fmtSub)}</div></td>

            <td class="col-art-scores th-num col-block-gap">
              <div class="gear-table-scores">
                <span class="gear-table-scores__ingame"${ingameTipAttr}>${Number.isFinite(ingameScore) ? escapeHtml(ingameShown) : '—'}</span>
                <span class="gear-table-scores__forge"${scoreTipAttr}>${scoreShown}</span>
              </div>
            </td>

            <td class="col-art-role col-block-gap">${escapeHtml(role || '—')}</td>

            <td class="col-art-verdict">${verdict ? `<span class="${escapeHtml(verdictClass)}">${escapeHtml(verdictLabel)}</span>` : '—'}</td>

            <td class="col-actions"><button type="button" class="gear-table__delete-btn btn-secondary btn-sm" data-delete-artifact="${escapeHtml(String(a.rid))}" title="Sell artifact">Sold</button></td>

          </tr>`;

        });

      tbody.innerHTML = rows.join('');

      // Add scroll animation for subs on hover
      setupArtifactSubsScrollAnimation(tbody);

    }

    if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();

  }



  function bindArtifactTableFilters() {

    if (bindArtifactTableFilters._done) return;

    bindArtifactTableFilters._done = true;

    loadDeletedArtifacts();



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

    // Bind artifact sort popover
    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('artifact-sort-btn', 'artifact-sort-popover', { onClose: () => {} });
    }

    // Handle artifact sort parameter select change
    const artifactSortParameterSelect = document.getElementById('artifact-sort-parameter');
    const artifactSortDirectionBtn = document.getElementById('artifact-sort-direction-toggle');
    let currentArtifactSortDirection = 'desc';

    if (artifactSortParameterSelect) {
      artifactSortParameterSelect.addEventListener('change', () => {
        const key = artifactSortParameterSelect.value;
        artifactSortKey = key;
        artifactSortDir = currentArtifactSortDirection;
        if (typeof resetArtifactTableVirtualScroll === 'function') resetArtifactTableVirtualScroll();
        renderGearTables();
      });
    }

    // Handle artifact direction toggle button
    if (artifactSortDirectionBtn) {
      artifactSortDirectionBtn.addEventListener('click', () => {
        currentArtifactSortDirection = currentArtifactSortDirection === 'desc' ? 'asc' : 'desc';
        artifactSortDirectionBtn.textContent = currentArtifactSortDirection === 'desc' ? '↓' : '↑';
        if (artifactSortParameterSelect) {
          const key = artifactSortParameterSelect.value;
          artifactSortKey = key;
          artifactSortDir = currentArtifactSortDirection;
          if (typeof resetArtifactTableVirtualScroll === 'function') resetArtifactTableVirtualScroll();
          renderGearTables();
        }
      });
    }

    // Handle artifact Reset sort button
    const artifactResetSortBtn = document.getElementById('btn-artifact-reset-sort');
    if (artifactResetSortBtn) {
      artifactResetSortBtn.addEventListener('click', () => {
        if (artifactSortParameterSelect) {
          artifactSortParameterSelect.value = 'forgeScore';
        }
        currentArtifactSortDirection = 'desc';
        if (artifactSortDirectionBtn) {
          artifactSortDirectionBtn.textContent = '↓';
        }
        artifactSortKey = 'forgeScore';
        artifactSortDir = 'desc';
        if (typeof resetArtifactTableVirtualScroll === 'function') resetArtifactTableVirtualScroll();
        renderGearTables();
      });
    }

    // Handle artifact Done button
    const artifactSortPopoverDoneBtn = document.querySelector('#artifact-sort-popover [data-filters-popover-done]');
    if (artifactSortPopoverDoneBtn) {
      artifactSortPopoverDoneBtn.addEventListener('click', () => {
        const popover = document.getElementById('artifact-sort-popover');
        if (popover) popover.hidden = true;
      });
    }

    document.getElementById('artifact-table-scroll')?.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-delete-artifact]');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const artifactId = deleteBtn.getAttribute('data-delete-artifact');
        if (artifactId && confirm('Sell this artifact from the current profile?')) {
          deleteArtifact(artifactId);
        }
      }
    });



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


