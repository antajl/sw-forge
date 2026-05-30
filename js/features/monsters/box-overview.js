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
    root.hidden = false;
    if (lead) lead.hidden = true;
    tiles.innerHTML = '';

    // Render metric labels
    const totalLabelEl = document.getElementById('lbl-monsters-metric-total');
    const fullSixLabelEl = document.getElementById('lbl-monsters-metric-fullsix');
    const skillupsLabelEl = document.getElementById('lbl-monsters-metric-skillups');
    const readinessLabelEl = document.getElementById('lbl-monsters-metric-readiness');

    if (totalLabelEl) totalLabelEl.textContent = t.monstersMetricTotal || 'Total';
    if (fullSixLabelEl) fullSixLabelEl.textContent = t.monstersMetricFullsix || 'Full 6/6';
    if (skillupsLabelEl) skillupsLabelEl.textContent = t.monstersMetricSkillups || 'Skill Ups';
    if (readinessLabelEl) readinessLabelEl.textContent = t.monstersMetricReadiness || 'Readiness';

    // Render score boxes
    const totalEl = document.getElementById('monsters-metric-val-total');
    const fullSixEl = document.getElementById('monsters-metric-val-fullsix');
    const skillupsEl = document.getElementById('monsters-metric-val-skillups');
    const readinessEl = document.getElementById('monsters-metric-val-readiness');

    if (totalEl) totalEl.textContent = String(o.total);
    if (fullSixEl) fullSixEl.textContent = String(o.fullSix);
    if (skillupsEl) skillupsEl.textContent = String(o.skillUpsTotal);
    if (readinessEl) readinessEl.textContent = `${o.readinessPct}%`;

    // Render composition labels
    const elementsTitleEl = document.getElementById('lbl-monsters-composition-elements');
    const archetypesTitleEl = document.getElementById('lbl-monsters-composition-archetypes');
    const runeSlotsTitleEl = document.getElementById('lbl-monsters-rune-slots-title');
    const skillPrioritiesTitleEl = document.getElementById('lbl-monsters-skill-priorities-title');

    if (elementsTitleEl) elementsTitleEl.textContent = t.monstersCompositionElements || 'Elements';
    if (archetypesTitleEl) archetypesTitleEl.textContent = t.monstersCompositionArchetypes || 'Archetypes';
    if (runeSlotsTitleEl) runeSlotsTitleEl.textContent = t.monstersRuneSlotsTitle || 'Rune Slots';
    if (skillPrioritiesTitleEl) skillPrioritiesTitleEl.textContent = t.monstersSkillPrioritiesTitle || 'Skill Plan Priorities';

    // Render element composition
    const elementsBarsEl = document.getElementById('monsters-composition-elements');
    if (elementsBarsEl) {
      const elementCounts = {};
      for (const u of units || []) {
        if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) continue;
        const el = u.metaElement || '';
        if (el) {
          elementCounts[el] = (elementCounts[el] || 0) + 1;
        }
      }
      elementsBarsEl.innerHTML = '';
      for (const [el, count] of Object.entries(elementCounts).sort((a, b) => b[1] - a[1])) {
        const barEl = document.createElement('div');
        barEl.className = 'monsters-composition-bar';
        barEl.innerHTML = `
          <span class="monsters-composition-bar__label">${el}</span>
          <span class="monsters-composition-bar__count">${count}</span>
        `;
        elementsBarsEl.appendChild(barEl);
      }
    }

    // Render archetype composition
    const archetypesBarsEl = document.getElementById('monsters-composition-archetypes');
    if (archetypesBarsEl) {
      const archetypeCounts = {};
      for (const u of units || []) {
        if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) continue;
        const arch = u.metaArchetype || '';
        if (arch) {
          archetypeCounts[arch] = (archetypeCounts[arch] || 0) + 1;
        }
      }
      archetypesBarsEl.innerHTML = '';
      for (const [arch, count] of Object.entries(archetypeCounts).sort((a, b) => b[1] - a[1])) {
        const barEl = document.createElement('div');
        barEl.className = 'monsters-composition-bar';
        barEl.innerHTML = `
          <span class="monsters-composition-bar__label">${arch}</span>
          <span class="monsters-composition-bar__count">${count}</span>
        `;
        archetypesBarsEl.appendChild(barEl);
      }
    }

    // Render rune slots chart
    const runeSlotsChartEl = document.getElementById('monsters-rune-slots-chart');
    if (runeSlotsChartEl) {
      const slotCounts = Array(7).fill(0);
      for (const u of units || []) {
        if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) continue;
        const count = u.equippedCount || 0;
        if (count >= 0 && count <= 6) {
          slotCounts[count] += 1;
        }
      }
      const maxCount = Math.max(...slotCounts, 1);
      runeSlotsChartEl.innerHTML = '';
      for (let i = 0; i <= 6; i++) {
        const count = slotCounts[i];
        if (count > 0) {
          const pct = (count / maxCount) * 100;
          const barEl = document.createElement('div');
          barEl.className = 'monsters-rune-slots-bar';
          barEl.setAttribute('data-rune-slots', String(i));
          barEl.setAttribute('role', 'button');
          barEl.setAttribute('tabindex', '0');
          barEl.setAttribute('aria-label', `${i} runes: ${count} monsters`);
          barEl.innerHTML = `
            <span class="monsters-rune-slots-bar__label">${i}/6</span>
            <div class="monsters-rune-slots-bar__track">
              <div class="monsters-rune-slots-bar__fill" style="width: ${pct}%"></div>
            </div>
            <span class="monsters-rune-slots-bar__count">${count}</span>
          `;
          runeSlotsChartEl.appendChild(barEl);
        }
      }
    }

    // Render skill plan priorities
    const skillPrioritiesListEl = document.getElementById('monsters-skill-priorities-list');
    if (skillPrioritiesListEl) {
      const skillPriorityUnits = (units || [])
        .filter(u => typeof isTechnicalFodderMonster !== 'function' || !isTechnicalFodderMonster(u))
        .filter(u => (u.skillUpsNeeded || 0) > 0)
        .sort((a, b) => (b.skillUpsNeeded || 0) - (a.skillUpsNeeded || 0))
        .slice(0, 5);
      
      skillPrioritiesListEl.innerHTML = '';
      for (const u of skillPriorityUnits) {
        const itemEl = document.createElement('div');
        itemEl.className = 'monsters-skill-priority-item';
        itemEl.setAttribute('role', 'button');
        itemEl.setAttribute('tabindex', '0');
        itemEl.setAttribute('aria-label', `${u.displayName}: ${u.skillUpsNeeded} skill-ups needed`);
        itemEl.innerHTML = `
          <span class="monsters-skill-priority-item__name">${u.displayName}</span>
          <span class="monsters-skill-priority-item__count">${u.skillUpsNeeded}</span>
        `;
        skillPrioritiesListEl.appendChild(itemEl);
      }
    }

    // Render attention tiles
    const tileData = [
      { kind: 'unruned', value: o.unruned, label: t.monstersBoxTileUnruned || 'No runes', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' },
      { kind: 'partial', value: o.partial, label: t.monstersBoxTilePartial || 'Incomplete sets', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
      { kind: 'fullSix', value: o.fullSix, label: t.monstersBoxTileFullSix || 'Full 6/6', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>' },
      { kind: 'skill-ups', value: o.skillMonsters, label: t.monstersBoxTileSkillUps || 'Need skill-ups', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>' },
      { kind: 'storage', value: o.storage, label: t.monstersBoxTileStorage || 'In storage', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>' },
    ];

    for (const tile of tileData) {
      if (tile.value > 0) {
        const tileEl = document.createElement('button');
        tileEl.className = 'monsters-box-tile';
        tileEl.type = 'button';
        tileEl.setAttribute('data-box-tile', tile.kind);
        tileEl.setAttribute('aria-label', `${tile.label}: ${tile.value}. ${t.monstersBoxTileHint || 'Show matching monsters'}`);
        tileEl.innerHTML = `
          <span class="monsters-box-tile__value">${tile.value}</span>
          <span class="monsters-box-tile__sub">${tile.icon}</span>
          <span class="monsters-box-tile__label">${tile.label}</span>
        `;
        tiles.appendChild(tileEl);
      }
    }

    if (window.SWRM && typeof window.SWRM.renderAccountReviewStrip === 'function') {
      window.SWRM.renderAccountReviewStrip();
    }
  }

  function bindMonstersBoxOverview() {
    if (boxOverviewBound) return;
    const tiles = document.getElementById('monsters-box-overview-tiles');
    const runeSlotsChart = document.getElementById('monsters-rune-slots-chart');
    if (!tiles) return;
    boxOverviewBound = true;
    tiles.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-box-tile]');
      if (!btn) return;
      const kind = btn.dataset.boxTile;
      if (!kind) return;
      applyMonsterBoxOverviewFilter(kind);
    });

    if (runeSlotsChart) {
      runeSlotsChart.addEventListener('click', (e) => {
        const bar = e.target.closest('[data-rune-slots]');
        if (!bar) return;
        const slots = bar.dataset.runeSlots;
        if (!slots) return;
        applyMonsterRuneSlotsFilter(Number(slots));
      });
    }

    // Bind dashboard filters
    const minLevelSelect = document.getElementById('monsters-dashboard-min-level');
    const starsMinSelect = document.getElementById('monsters-dashboard-stars-min');
    const starsMaxSelect = document.getElementById('monsters-dashboard-stars-max');
    const natMinSelect = document.getElementById('monsters-dashboard-nat-min');
    const natMaxSelect = document.getElementById('monsters-dashboard-nat-max');
    const copySummaryBtn = document.getElementById('btn-monsters-dashboard-copy-summary');

    if (minLevelSelect) {
      minLevelSelect.addEventListener('change', () => {
        if (typeof renderMonstersDashboard === 'function') renderMonstersDashboard();
      });
    }

    if (starsMinSelect) {
      starsMinSelect.addEventListener('change', () => {
        if (typeof renderMonstersDashboard === 'function') renderMonstersDashboard();
      });
    }

    if (starsMaxSelect) {
      starsMaxSelect.addEventListener('change', () => {
        if (typeof renderMonstersDashboard === 'function') renderMonstersDashboard();
      });
    }

    if (natMinSelect) {
      natMinSelect.addEventListener('change', () => {
        if (typeof renderMonstersDashboard === 'function') renderMonstersDashboard();
      });
    }

    if (natMaxSelect) {
      natMaxSelect.addEventListener('change', () => {
        if (typeof renderMonstersDashboard === 'function') renderMonstersDashboard();
      });
    }

    if (copySummaryBtn) {
      copySummaryBtn.addEventListener('click', () => {
        copyMonstersDashboardSummary();
      });
    }
  }

  function applyMonsterRuneSlotsFilter(slots) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const f =
      typeof readMonstersFiltersFromDom === 'function'
        ? readMonstersFiltersFromDom()
        : { sort: 'name', q: '', element: '', location: 'all', minLevelMin: 0 };
    f.runeFilter = '';
    f.skillFilter = '';
    f.fullSixOnly = false;
    f.location = 'all';
    f.runeSlotsCount = slots;
    if (typeof writeMonstersFilters === 'function') writeMonstersFilters(f);
    if (typeof updateMonstersFilterSummary === 'function') updateMonstersFilterSummary();
    if (typeof renderMonstersPanel === 'function') void renderMonstersPanel();
  }

  function renderMonstersDashboard() {
    const allUnits = typeof getMonstersEnriched === 'function' ? getMonstersEnriched() : [];
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    console.log('[Monsters Dashboard] allUnits:', allUnits.length);

    // Get filter values
    const minLevel = Number(document.getElementById('monsters-dashboard-min-level')?.value) || 0;
    const starsMin = Number(document.getElementById('monsters-dashboard-stars-min')?.value) || 1;
    const starsMax = Number(document.getElementById('monsters-dashboard-stars-max')?.value) || 6;
    const natMin = Number(document.getElementById('monsters-dashboard-nat-min')?.value) || 1;
    const natMax = Number(document.getElementById('monsters-dashboard-nat-max')?.value) || 5;

    console.log('[Monsters Dashboard] filters:', { minLevel, starsMin, starsMax, natMin, natMax });

    // Apply filters
    const filteredUnits = allUnits.filter(u => {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) return false;
      if ((u.level || 0) < minLevel) return false;
      const unitStars = u.stars || 6;
      if (unitStars < starsMin || unitStars > starsMax) return false;
      const unitNat = u.unitRank ? u.unitRank.charAt(0) : '1';
      const natNum = parseInt(unitNat, 10) || 1;
      if (natNum < natMin || natNum > natMax) return false;
      return true;
    });

    console.log('[Monsters Dashboard] filteredUnits:', filteredUnits.length);

    // Update count display
    const countEl = document.getElementById('dashboard-monsters-count');
    if (countEl) {
      const tpl = (t.monstersDashboardAccountMonstersInline || 'Total: {acc} · Current: {view}').trim();
      countEl.textContent = tpl
        .replace(/\{acc\}/g, String(allUnits.length))
        .replace(/\{view\}/g, String(filteredUnits.length));
    }

    // Update labels
    const minlvlLabel = document.getElementById('lbl-monsters-dashboard-minlvl');
    const starsRangeLabel = document.getElementById('lbl-monsters-dashboard-stars-range');
    const starsMinLabel = document.getElementById('lbl-monsters-dashboard-stars-min');
    const starsMaxLabel = document.getElementById('lbl-monsters-dashboard-stars-max');
    const natRangeLabel = document.getElementById('lbl-monsters-dashboard-nat-range');
    const natMinLabel = document.getElementById('lbl-monsters-dashboard-nat-min');
    const natMaxLabel = document.getElementById('lbl-monsters-dashboard-nat-max');
    const copyBtn = document.getElementById('btn-monsters-dashboard-copy-summary');

    if (minlvlLabel) minlvlLabel.textContent = t.monstersDashboardMinlvl || 'Min Level';
    if (starsRangeLabel) starsRangeLabel.textContent = t.monstersDashboardStarsRange || 'Stars';
    if (starsMinLabel) starsMinLabel.textContent = t.monstersDashboardStarsMin || 'From';
    if (starsMaxLabel) starsMaxLabel.textContent = t.monstersDashboardStarsMax || 'To';
    if (natRangeLabel) natRangeLabel.textContent = t.monstersDashboardNatRange || 'Nat';
    if (natMinLabel) natMinLabel.textContent = t.monstersDashboardNatMin || 'From';
    if (natMaxLabel) natMaxLabel.textContent = t.monstersDashboardNatMax || 'To';
    if (copyBtn) copyBtn.textContent = t.monstersDashboardCopySummary || 'Copy summary';

    // Ensure bindMonstersBoxOverview is called
    bindMonstersBoxOverview();

    renderMonstersBoxOverview(filteredUnits);
  }

  async function copyMonstersDashboardSummary() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allUnits = typeof getMonstersEnriched === 'function' ? getMonstersEnriched() : [];
    const minLevel = Number(document.getElementById('monsters-dashboard-min-level')?.value) || 0;
    const starsMin = Number(document.getElementById('monsters-dashboard-stars-min')?.value) || 1;
    const starsMax = Number(document.getElementById('monsters-dashboard-stars-max')?.value) || 6;
    const natMin = Number(document.getElementById('monsters-dashboard-nat-min')?.value) || 1;
    const natMax = Number(document.getElementById('monsters-dashboard-nat-max')?.value) || 5;

    const filteredUnits = allUnits.filter(u => {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) return false;
      if ((u.level || 0) < minLevel) return false;
      const unitStars = u.stars || 6;
      if (unitStars < starsMin || unitStars > starsMax) return false;
      const unitNat = u.unitRank ? u.unitRank.charAt(0) : '1';
      const natNum = parseInt(unitNat, 10) || 1;
      if (natNum < natMin || natNum > natMax) return false;
      return true;
    });

    const o = computeMonstersBoxOverview(filteredUnits);

    const lines = [
      `Monsters Dashboard Summary`,
      `Total: ${allUnits.length}`,
      `Current (filtered): ${filteredUnits.length}`,
      `Min Level: +${minLevel}`,
      `Stars: ${starsMin}★ to ${starsMax}★`,
      `Nat: ${natMin} to ${natMax}`,
      ``,
      `Metrics:`,
      `  Total: ${o.total}`,
      `  Full 6/6: ${o.fullSix}`,
      `  Skill Ups: ${o.skillUpsTotal}`,
      `  Readiness: ${o.readinessPct}%`,
      ``,
      `Breakdown:`,
      `  Unruned: ${o.unruned}`,
      `  Partial: ${o.partial}`,
      `  Need skill-ups: ${o.skillMonsters}`,
      `  In storage: ${o.storage}`,
    ];

    const text = lines.join('\n');
    const ok = typeof copyTextToClipboard === 'function' ? await copyTextToClipboard(text) : false;
    if (typeof showSwrmToast === 'function') {
      showSwrmToast(
        ok ? (t.dashboardExportDone || 'Copied') : (t.dashboardExportFail || 'Failed'),
        { type: ok ? 'success' : 'error', duration: 3200 }
      );
    }
  }

  window.renderMonstersDashboard = renderMonstersDashboard;
  window.renderMonstersBoxOverview = renderMonstersBoxOverview;
