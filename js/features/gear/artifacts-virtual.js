// js/features/gear/artifacts-virtual.js — windowed tbody render for large artifact lists
  const ARTIFACT_TABLE_VIRTUAL_COLS = 5;
  const ARTIFACT_TABLE_VIRTUAL_OVERSCAN = 8;
  const ARTIFACT_TABLE_VIRTUAL_ROW_FALLBACK = 44;
  const ARTIFACT_TABLE_VIRTUAL_SPACER_COL_CLASSES = [
    'col-grade',
    'col-category',
    'col-main',
    'col-subs-stack',
    'col-location',
  ];

  let artifactVirtualRowHeight = 0;
  let artifactVirtualScrollRaf = 0;
  let artifactVirtualBound = false;
  let artifactVirtualLastKey = '';

  function artifactTableVirtualScroller() {
    return document.getElementById('artifact-table-scroll');
  }

  function artifactTableVirtualSpacerRow(heightPx) {
    const h = Math.max(0, Math.round(heightPx));
    if (h <= 0) return '';
    const cells = ARTIFACT_TABLE_VIRTUAL_SPACER_COL_CLASSES.map(
      (cls) =>
        `<td class="${cls}" style="height:${h}px;padding:0;border:none;line-height:0" aria-hidden="true"></td>`,
    ).join('');
    return `<tr class="gear-table__spacer" aria-hidden="true">${cells}</tr>`;
  }

  function measureArtifactVirtualRowHeight(tbody) {
    const row = tbody && tbody.querySelector('tr.gear-table__data-row');
    if (!row) return 0;
    const h = row.getBoundingClientRect().height;
    return h > 0 ? Math.ceil(h) : 0;
  }

  function artifactVirtualRangeKey(start, end, total) {
    return `${total}:${start}:${end}:${artifactVirtualRowHeight}`;
  }

  function resetArtifactTableVirtualScroll() {
    const scroller = artifactTableVirtualScroller();
    if (scroller) scroller.scrollTop = 0;
    artifactVirtualLastKey = '';
  }

  function scheduleArtifactTableVirtualRepaint() {
    if (artifactVirtualScrollRaf) return;
    artifactVirtualScrollRaf = requestAnimationFrame(() => {
      artifactVirtualScrollRaf = 0;
      if (typeof paintArtifactTableVirtualBody === 'function') {
        paintArtifactTableVirtualBody(filteredArtifacts);
      }
    });
  }

  function paintArtifactTableVirtualBody(rows) {
    const tbody = document.getElementById('artifact-tbody');
    const scroller = artifactTableVirtualScroller();
    if (!tbody || !scroller) return;

    const list = rows || [];
    const total = list.length;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    if (!total) {
      artifactVirtualLastKey = 'empty';
      tbody.innerHTML = `<tr><td colspan="${ARTIFACT_TABLE_VIRTUAL_COLS}" class="table-empty">${escapeHtml(t.tableGearEmpty || 'No artifacts')}</td></tr>`;
      if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();
      return;
    }

    let rowH = artifactVirtualRowHeight;
    if (!rowH) rowH = ARTIFACT_TABLE_VIRTUAL_ROW_FALLBACK;

    const viewH = Math.max(scroller.clientHeight, 120);
    const scrollTop = Math.max(0, scroller.scrollTop);
    const start = Math.max(0, Math.floor(scrollTop / rowH) - ARTIFACT_TABLE_VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil(viewH / rowH) + ARTIFACT_TABLE_VIRTUAL_OVERSCAN * 2;
    const end = Math.min(total, start + visibleCount);

    const key = artifactVirtualRangeKey(start, end, total);
    if (key === artifactVirtualLastKey) return;
    artifactVirtualLastKey = key;

    const topPad = start * rowH;
    const bottomPad = (total - end) * rowH;
    const slice = list.slice(start, end);

    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;

    tbody.innerHTML =
      artifactTableVirtualSpacerRow(topPad) +
      slice.map((a, i) => {
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
        const evenClass = (start + i) % 2 === 0 ? 'gear-table__data-row--even' : '';
        return `<tr class="gear-table__data-row ${evenClass}">
          <td class="col-grade">${gradeCell}</td>
          <td class="col-category">${catCell}</td>
          <td class="col-main">${escapeHtml(main)}</td>
          <td class="col-subs-stack"><div class="gear-table-subs">${artifactSubStack(a, fmtSub)}</div></td>
          <td class="col-location">${escapeHtml(gearLocationLabel(a.occupiedId, t))}</td>
        </tr>`;
      }).join('') +
      artifactTableVirtualSpacerRow(bottomPad);

    const measured = measureArtifactVirtualRowHeight(tbody);
    if (measured && measured !== artifactVirtualRowHeight) {
      artifactVirtualRowHeight = measured;
      scroller.style.setProperty('--artifact-virtual-row-h', `${measured}px`);
      artifactVirtualLastKey = '';
      scheduleArtifactTableVirtualRepaint();
      return;
    }
    if (!artifactVirtualRowHeight && measured) {
      artifactVirtualRowHeight = measured;
      scroller.style.setProperty('--artifact-virtual-row-h', `${measured}px`);
    }

    if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();
  }

  function bindArtifactTableVirtualScroll() {
    if (artifactVirtualBound) return;
    const scroller = artifactTableVirtualScroller();
    if (!scroller) return;
    artifactVirtualBound = true;
    scroller.classList.add('table-wrap--virtual');
    scroller.addEventListener(
      'scroll',
      () => {
        scheduleArtifactTableVirtualRepaint();
      },
      { passive: true },
    );
    window.addEventListener('resize', () => {
      artifactVirtualLastKey = '';
      scheduleArtifactTableVirtualRepaint();
    });
  }
