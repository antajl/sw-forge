// js/features/monsters/box-overview.js — clickable “what needs attention” tiles on Roster
  let boxOverviewBound = false;

  function computeMonstersBoxOverview(units) {
    let total = 0;
    let unruned = 0;
    let partial = 0;
    let fullSix = 0;
    let skillMonsters = 0;
    let skillUpsTotal = 0;
    let storage = 0;
    for (const u of units || []) {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) continue;
      total += 1;
      if (u.inStorage) storage += 1;
      if (u.equippedCount <= 0) unruned += 1;
      else if (!u.hasFullRunes) partial += 1;
      if (u.hasFullRunes) fullSix += 1;
      if (u.skillUpsNeeded > 0) {
        skillMonsters += 1;
        skillUpsTotal += u.skillUpsNeeded;
      }
    }
    const readinessPct = total > 0 ? Math.round((100 * fullSix) / total) : 0;
    return {
      total,
      unruned,
      partial,
      fullSix,
      skillMonsters,
      skillUpsTotal,
      storage,
      readinessPct,
    };
  }

  function applyMonsterBoxOverviewFilter(kind) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const f =
      typeof readMonstersFiltersFromDom === 'function'
        ? readMonstersFiltersFromDom()
        : { sort: 'name', q: '', element: '', location: 'all', minLevelMin: 0 };
    f.runeFilter = '';
    f.skillFilter = '';
    f.fullSixOnly = false;
    f.location = 'all';
    if (kind === 'unruned') f.runeFilter = 'unruned';
    else if (kind === 'partial') f.runeFilter = 'partial';
    else if (kind === 'fullSix') f.fullSixOnly = true;
    else if (kind === 'skill-ups') f.skillFilter = 'needs-up';
    else if (kind === 'storage') f.location = 'storage';
    if (typeof writeMonstersFilters === 'function') writeMonstersFilters(f);
    const runeSel = document.getElementById('monsters-filter-rune');
    const skillSel = document.getElementById('monsters-filter-skill');
    const locSel = document.getElementById('monsters-filter-location');
    const sixBtn = document.getElementById('monsters-filter-full-six');
    if (runeSel) runeSel.value = f.runeFilter || '';
    if (skillSel) skillSel.value = f.skillFilter || '';
    if (locSel) locSel.value = f.location || 'all';
    if (typeof syncMonstersShowAllButton === 'function') syncMonstersShowAllButton(!!f.fullSixOnly, t);
    if (typeof updateMonstersFilterSummary === 'function') updateMonstersFilterSummary();
    if (typeof renderMonstersPanel === 'function') void renderMonstersPanel();
  }

  function renderMonstersBoxOverview(units) {
    const root = document.getElementById('monsters-box-overview');
    const lead = document.getElementById('monsters-box-overview-lead');
    const tiles = document.getElementById('monsters-box-overview-tiles');
    if (!root || !tiles) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const o = computeMonstersBoxOverview(units);
    if (!o.total) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    if (lead) lead.hidden = true;
    tiles.innerHTML = '';
    if (window.SWRM && typeof window.SWRM.renderAccountReviewStrip === 'function') {
      window.SWRM.renderAccountReviewStrip();
    }
  }

  function bindMonstersBoxOverview() {
    if (boxOverviewBound) return;
    const tiles = document.getElementById('monsters-box-overview-tiles');
    if (!tiles) return;
    boxOverviewBound = true;
    tiles.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-box-tile]');
      if (!btn) return;
      const kind = btn.dataset.boxTile;
      if (!kind) return;
      applyMonsterBoxOverviewFilter(kind);
    });
  }
