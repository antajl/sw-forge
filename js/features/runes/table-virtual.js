// js/features/runes/table-virtual.js — windowed tbody render for large rune lists
  const RUNE_TABLE_VIRTUAL_COLS = 15;
  const RUNE_TABLE_VIRTUAL_OVERSCAN = 12;
  const RUNE_TABLE_VIRTUAL_ROW_FALLBACK = 44;
  const RUNE_TABLE_VIRTUAL_SPACER_COL_CLASSES = [
    'col-slot',
    'col-set',
    'col-main',
    'col-grade',
    'col-lvl',
    'col-innate',
    'col-sub',
    'col-sub',
    'col-sub',
    'col-sub',
    'col-ingame',
    'col-score',
    'col-verdict',
    'col-role',
    'col-location',
  ];

  let runeVirtualRowHeight = 0;
  let runeVirtualScrollRaf = 0;
  let runeVirtualBound = false;
  let runeVirtualLastKey = '';

  function runeTableVirtualScroller() {
    return document.getElementById('rune-table-scroll');
  }

  function runeTableVirtualSpacerRow(heightPx) {
    const h = Math.max(0, Math.round(heightPx));
    if (h <= 0) return '';
    const cells = RUNE_TABLE_VIRTUAL_SPACER_COL_CLASSES.map(
      (cls) =>
        `<td class="${cls}" style="height:${h}px;padding:0;border:none;line-height:0" aria-hidden="true"></td>`,
    ).join('');
    return `<tr class="rune-table__spacer" aria-hidden="true">${cells}</tr>`;
  }

  function measureRuneVirtualRowHeight(tbody) {
    const row = tbody && tbody.querySelector('tr.rune-table__data-row');
    if (!row) return 0;
    const h = row.getBoundingClientRect().height;
    return h > 0 ? Math.ceil(h) : 0;
  }

  function runeVirtualRangeKey(start, end, total) {
    return `${total}:${start}:${end}:${runeVirtualRowHeight}`;
  }

  function resetRuneTableVirtualScroll() {
    const scroller = runeTableVirtualScroller();
    if (scroller) scroller.scrollTop = 0;
    runeVirtualLastKey = '';
  }

  function scheduleRuneTableVirtualRepaint() {
    if (runeVirtualScrollRaf) return;
    runeVirtualScrollRaf = requestAnimationFrame(() => {
      runeVirtualScrollRaf = 0;
      if (typeof paintRuneTableVirtualBody === 'function') {
        paintRuneTableVirtualBody(filteredRunes);
      }
    });
  }

  function paintRuneTableVirtualBody(rows) {
    const tbody = document.getElementById('rune-tbody');
    const scroller = runeTableVirtualScroller();
    if (!tbody || !scroller) return;

    const list = rows || [];
    const total = list.length;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    if (!total) {
      runeVirtualLastKey = 'empty';
      tbody.innerHTML = `<tr><td colspan="${RUNE_TABLE_VIRTUAL_COLS}" class="table-empty">${escapeHtml(t.tableShownDetailEmpty || 'No runes match the current filters.')}</td></tr>`;
      return;
    }

    let rowH = runeVirtualRowHeight;
    if (!rowH) rowH = RUNE_TABLE_VIRTUAL_ROW_FALLBACK;

    const viewH = Math.max(scroller.clientHeight, 120);
    const scrollTop = Math.max(0, scroller.scrollTop);
    const start = Math.max(0, Math.floor(scrollTop / rowH) - RUNE_TABLE_VIRTUAL_OVERSCAN);
    const visibleCount = Math.ceil(viewH / rowH) + RUNE_TABLE_VIRTUAL_OVERSCAN * 2;
    const end = Math.min(total, start + visibleCount);

    const key = runeVirtualRangeKey(start, end, total);
    if (key === runeVirtualLastKey) return;
    runeVirtualLastKey = key;

    const topPad = start * rowH;
    const bottomPad = (total - end) * rowH;
    const slice = list.slice(start, end);

    tbody.innerHTML =
      runeTableVirtualSpacerRow(topPad) +
      slice.map((r, i) => runeRow(r, { rowIndex: start + i })).join('') +
      runeTableVirtualSpacerRow(bottomPad);

    const measured = measureRuneVirtualRowHeight(tbody);
    if (measured && measured !== runeVirtualRowHeight) {
      runeVirtualRowHeight = measured;
      scroller.style.setProperty('--rune-virtual-row-h', `${measured}px`);
      runeVirtualLastKey = '';
      scheduleRuneTableVirtualRepaint();
      return;
    }
    if (!runeVirtualRowHeight && measured) {
      runeVirtualRowHeight = measured;
      scroller.style.setProperty('--rune-virtual-row-h', `${measured}px`);
    }

    if (typeof replaceRuneTableLocationFromState === 'function') {
      replaceRuneTableLocationFromState();
    }
  }

  function bindRuneTableVirtualScroll() {
    if (runeVirtualBound) return;
    const scroller = runeTableVirtualScroller();
    if (!scroller) return;
    runeVirtualBound = true;
    scroller.classList.add('table-wrap--virtual');
    scroller.addEventListener(
      'scroll',
      () => {
        scheduleRuneTableVirtualRepaint();
      },
      { passive: true },
    );
    window.addEventListener('resize', () => {
      runeVirtualLastKey = '';
      scheduleRuneTableVirtualRepaint();
    });
  }
