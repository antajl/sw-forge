// js/features/runes/verdict-filters.js — verdict and grade navigation/filtering
  function getVisibleRunes() {
    return processedRunes.filter((r) => {
      if (r.level < globalMinLevel) return false;
      const g = typeof r.grade === 'number' ? r.grade : 0;
      return g >= globalGradeMin && g <= globalGradeMax;
    });
  }

  const VERDICT_LABEL_MAP = {
    Keep: 'keep',
    Sell: 'sell',
    Grind: 'grind',
    Finish: 'finish',
    Reapp: 'reapp',
    Upgrade: 'upgrade',
    Gem: 'gem',
  };

  function verdictUiLabel(t, verdictKey) {
    const lk = VERDICT_LABEL_MAP[verdictKey];
    return lk ? (t[lk] || verdictKey) : verdictKey;
  }

  function navigateToRuneTableWithFilters(partial) {
    const fv = document.getElementById('filter-verdict');
    const fr = document.getElementById('filter-role');
    const fg = document.getElementById('filter-grade');
    const fs = document.getElementById('filter-set');
    const fsl = document.getElementById('filter-slot');
    if (partial.clearSearch) {
      const sb = document.getElementById('search-box');
      if (sb) sb.value = '';
    }
    if (fv && Object.prototype.hasOwnProperty.call(partial, 'verdict')) {
      fv.value = partial.verdict || '';
    }
    if (fr && Object.prototype.hasOwnProperty.call(partial, 'role')) {
      fr.value = partial.role || '';
    }
    if (fg && Object.prototype.hasOwnProperty.call(partial, 'gradeStr')) {
      fg.value = partial.gradeStr || '';
    }
    if (fs && Object.prototype.hasOwnProperty.call(partial, 'set')) {
      fs.value = partial.set || '';
    }
    if (fsl && Object.prototype.hasOwnProperty.call(partial, 'slot')) {
      fsl.value = partial.slot || '';
    }
    const onDashboard = document.querySelector('.tab.active')?.dataset.tab === 'dashboard';
    showMainTab('runetable', { writeHash: true, pushHistory: onDashboard });
    const visible = getVisibleRunes();
    renderTable(visible);
  }

  /** Table grade filter is exact match — set only when dashboard range is a single grade. */
  function gradeStrForDashboardNav() {
    if (globalGradeMin === globalGradeMax) {
      if (globalGradeMin === 5) return 'Legend';
      if (globalGradeMin === 4) return 'Hero';
      if (globalGradeMin === 3) return 'Rare';
    }
    return '';
  }
