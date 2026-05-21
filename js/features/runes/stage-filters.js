// js/features/runes/stage-filters.js — stage and dashboard filter controls
  // ===================== STAGE =====================
  document.getElementById('stage-select').addEventListener('change', e => {
    stage = e.target.value;
    if (typeof window.swrmOnDashboardStageChanged === 'function') {
      window.swrmOnDashboardStageChanged();
    } else if (allRunes.length) {
      reprocess();
    }
  });

  // Auto Game Stage button
  document.getElementById('btn-auto-stage').addEventListener('click', () => {
    const metrics = analyzeGameStage(allRunes);
    const recommendedStage = getRecommendedStage(
      parseFloat(metrics.score),
      metrics.stageMidMin,
      metrics.stageLateMin
    );
    const stageSelect = document.getElementById('stage-select');
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    if (!metrics.runeCount) {
      showSwrmToast(tloc.stageAdvisorNoEligible || 'Need +9 runes.', { type: 'info' });
      return;
    }

    stageSelect.value = recommendedStage;
    stageSelect.dispatchEvent(new Event('change', { bubbles: true }));

    const name = stageDisplayName(tloc, recommendedStage);
    showSwrmToast(
      `${tloc.stageSuggestedLabel || 'Suggested'}: ${name} (${tloc.stageScoreLabel || 'Score'} ${metrics.score})`,
      { type: 'success', duration: 4200 }
    );
  });

  document.getElementById('global-min-level')?.addEventListener('change', e => {
    globalMinLevel = parseInt(e.target.value || '0', 10) || 0;
    if (processedRunes.length) {
      const visible = getVisibleRunes();
      renderDashboard(visible);
      renderTable(visible);
    }
  });

  document.getElementById('global-grade-min')?.addEventListener('change', (e) => {
    let v = parseInt(e.target.value || '3', 10) || 3;
    if (v < 3) v = 3;
    if (v > 5) v = 5;
    globalGradeMin = v;
    if (globalGradeMin > globalGradeMax) globalGradeMax = globalGradeMin;
    try {
      localStorage.setItem('swrm_dashboard_grade_min_v1', String(globalGradeMin));
      localStorage.setItem('swrm_dashboard_grade_max_v1', String(globalGradeMax));
    } catch (err) { /* ignore */ }
    const smax = document.getElementById('global-grade-max');
    if (smax) smax.value = String(globalGradeMax);
    if (processedRunes.length) {
      const visible = getVisibleRunes();
      renderDashboard(visible);
      renderTable(visible);
    }
  });

  document.getElementById('global-grade-max')?.addEventListener('change', (e) => {
    let v = parseInt(e.target.value || '5', 10) || 5;
    if (v < 3) v = 3;
    if (v > 5) v = 5;
    globalGradeMax = v;
    if (globalGradeMax < globalGradeMin) globalGradeMin = globalGradeMax;
    try {
      localStorage.setItem('swrm_dashboard_grade_min_v1', String(globalGradeMin));
      localStorage.setItem('swrm_dashboard_grade_max_v1', String(globalGradeMax));
    } catch (err) { /* ignore */ }
    const smin = document.getElementById('global-grade-min');
    if (smin) smin.value = String(globalGradeMin);
    if (processedRunes.length) {
      const visible = getVisibleRunes();
      renderDashboard(visible);
      renderTable(visible);
    }
  });

  document.getElementById('btn-stage-compact')?.addEventListener('click', () => {
    const root = document.getElementById('stage-advisor');
    if (!root) return;
    const wasCollapsed = root.classList.contains('is-compact');
    const nextCollapsed = !wasCollapsed;
    applyStageAdvisorCollapsed(nextCollapsed);
    try {
      localStorage.setItem(STAGE_PROGRESSION_EXPANDED_KEY, nextCollapsed ? '' : '1');
    } catch (err) { /* ignore */ }
  });

  function readDashboardUnifiedTab() {
    try {
      let v = localStorage.getItem(DASH_UNIFIED_DIST_KEY);
      if (!v) {
        const legacy = localStorage.getItem(DASH_DIST_TAB_LEGACY_KEY);
        if (legacy === 'sets') v = 'sets';
        else if (legacy === 'roles') v = 'roles';
      }
      if (['verdict', 'roles', 'sets', 'slots', 'eff'].includes(v)) return v;
    } catch (e) { /* ignore */ }
    return 'verdict';
  }

  function syncDashboardUnifiedTabButtons(active) {
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff'];
    keys.forEach((k) => {
      const btn = document.getElementById(`dash-unified-tab-${k}`);
      if (!btn) return;
      const on = k === active;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
    const nav = document.getElementById('dash-unified-tabs');
    if (nav && window.SWRM_MOTION && typeof window.SWRM_MOTION.positionDashUnifiedTabIndicator === 'function') {
      window.SWRM_MOTION.positionDashUnifiedTabIndicator({ nav, activeKey: active, instant: false });
    }
  }

  function setDashboardUnifiedPaneState(pane, on) {
    if (!pane) return;
    pane.classList.toggle('is-active', on);
    pane.classList.toggle('is-shown', on);
    pane.classList.remove('is-exiting');
    pane.toggleAttribute('hidden', !on);
    pane.setAttribute('aria-hidden', String(!on));
  }

  function applyDashboardUnifiedTab(which) {
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff'];
    const active = keys.includes(which) ? which : 'verdict';
    const host = document.getElementById('dash-unified-panes');
    const next = document.getElementById(`dash-pane-${active}`);
    if (!next) return;

    const current = host?.querySelector('.dash-unified-pane.is-active') || null;
    if (current === next) {
      syncDashboardUnifiedTabButtons(active);
      keys.forEach((k) => setDashboardUnifiedPaneState(document.getElementById(`dash-pane-${k}`), k === active));
      return;
    }

    syncDashboardUnifiedTabButtons(active);

    const finalizePanes = () => {
      keys.forEach((k) => {
        const pane = document.getElementById(`dash-pane-${k}`);
        if (!pane) return;
        pane.classList.remove('is-exiting');
        setDashboardUnifiedPaneState(pane, k === active);
      });
    };

    const motionApi = window.SWRM_MOTION;
    const playPaneBarIntro = (pane) => {
      if (!pane || !motionApi || !motionApi.enabled()) return;
      requestAnimationFrame(() => motionApi.animateDashboardPaneBars(pane));
    };

    if (!host || !motionApi || !motionApi.enabled()) {
      motionApi && motionApi.cancelDashUnifiedTab();
      finalizePanes();
      playPaneBarIntro(next);
      host?.classList.remove('dash-unified-panes--animate', 'dash-unified-panes--gsap');
      return;
    }

    host.classList.add('dash-unified-panes--gsap');
    host.classList.remove('dash-unified-panes--animate');
    const started = motionApi.animateDashUnifiedTab({
      host,
      current,
      next,
      onComplete: finalizePanes,
    });
    if (!started) {
      finalizePanes();
      playPaneBarIntro(next);
    }
  }

  function initDashboardUnifiedTabs() {
    const host = document.getElementById('dash-unified-panes');
    const initial = readDashboardUnifiedTab();
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff'];
    keys.forEach((k) => {
      setDashboardUnifiedPaneState(document.getElementById(`dash-pane-${k}`), k === initial);
    });
    syncDashboardUnifiedTabButtons(initial);
    if (host && window.SWRM_MOTION && window.SWRM_MOTION.enabled()) {
      host.classList.add('dash-unified-panes--gsap');
    }
    const snapDashInd = () => {
      const nav = document.getElementById('dash-unified-tabs');
      if (nav && window.SWRM_MOTION && typeof window.SWRM_MOTION.positionDashUnifiedTabIndicator === 'function') {
        window.SWRM_MOTION.positionDashUnifiedTabIndicator({ nav, activeKey: readDashboardUnifiedTab(), instant: true });
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(snapDashInd));
    let dashIndResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(dashIndResizeTimer);
      dashIndResizeTimer = setTimeout(snapDashInd, 120);
    });
    document.querySelectorAll('.dash-unified-tab[data-dash-uni]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.getAttribute('data-dash-uni') || 'verdict';
        const w = ['verdict', 'roles', 'sets', 'slots', 'eff'].includes(raw) ? raw : 'verdict';
        applyDashboardUnifiedTab(w);
        try {
          localStorage.setItem(DASH_UNIFIED_DIST_KEY, w);
        } catch (e) { /* ignore */ }
      });
    });
  }

  document.getElementById('btn-dashboard-export-summary')?.addEventListener('click', async () => {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const ok = await copyTextToClipboard(getDashboardExportText());
    showSwrmToast(
      ok ? (tloc.dashboardExportDone || 'Copied') : (tloc.dashboardExportFail || 'Failed'),
      { type: ok ? 'success' : 'error', duration: 3200 }
    );
  });

  function dashboardNavigateFromClick(e) {
    const vrow = e.target.closest('.chart-row--clickable[data-dash-verdict]');
    if (vrow) {
      navigateToRuneTableWithFilters({
        verdict: vrow.getAttribute('data-dash-verdict') || '',
        role: '',
        gradeStr: gradeStrForDashboardNav(),
        set: '',
        slot: '',
        clearSearch: true,
      });
      return;
    }
    const setRow = e.target.closest('.chart-row--clickable[data-dash-set]');
    if (setRow) {
      let setName = '';
      try {
        setName = decodeURIComponent(setRow.getAttribute('data-dash-set') || '');
      } catch (err) {
        setName = setRow.getAttribute('data-dash-set') || '';
      }
      navigateToRuneTableWithFilters({
        verdict: '',
        role: '',
        set: setName,
        slot: '',
        gradeStr: gradeStrForDashboardNav(),
        clearSearch: true,
      });
      return;
    }
    const row = e.target.closest('.chart-row--clickable[data-dash-role]');
    if (row) {
      navigateToRuneTableWithFilters({
        verdict: '',
        role: row.getAttribute('data-dash-role') || '',
        gradeStr: gradeStrForDashboardNav(),
        set: '',
        slot: '',
        clearSearch: true,
      });
      return;
    }
    const slotCell = e.target.closest('.slot-share-cell--clickable[data-dash-slot]');
    if (slotCell) {
      navigateToRuneTableWithFilters({
        verdict: '',
        role: '',
        gradeStr: gradeStrForDashboardNav(),
        set: '',
        slot: slotCell.getAttribute('data-dash-slot') || '',
        clearSearch: true,
      });
    }
  }

  document.getElementById('tab-dashboard')?.addEventListener('click', dashboardNavigateFromClick);

  document.getElementById('tab-dashboard')?.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const t = e.target;
    if (!t || !t.closest || !t.closest('#tab-dashboard')) return;
    const setRow = t.closest('.chart-row--clickable[data-dash-set]');
    const vrow = t.closest('.chart-row--clickable[data-dash-verdict]');
    const row = t.closest('.chart-row--clickable[data-dash-role]');
    const slotCell = t.closest('.slot-share-cell--clickable[data-dash-slot]');
    if (setRow || vrow || row || slotCell) {
      e.preventDefault();
      (setRow || vrow || row || slotCell).click();
    }
  });

  function topSpdPanelRerender(animateRadar) {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const setSel = document.getElementById('top-spd-set-select');
    const setVal = setSel ? setSel.value || '' : '';
    renderTopSpdPanel(getVisibleRunes(), setVal, tloc, {
      animate: animateRadar !== false,
    });
  }

  document.getElementById('top-spd-set-select')?.addEventListener('change', (e) => {
    const v = e.target.value || '';
    try {
      localStorage.setItem(TOP_SPD_STORAGE_KEY, v);
    } catch (err) { /* ignore */ }
    topSpdPanelRerender(true);
  });

  document.getElementById('btn-top-spd-sort-cur')?.addEventListener('click', () => {
    try {
      localStorage.setItem(TOP_SPD_SORT_METRIC_KEY, 'cur');
    } catch (err) { /* ignore */ }
    topSpdPanelRerender(false);
  });

  document.getElementById('btn-top-spd-sort-pot')?.addEventListener('click', () => {
    try {
      localStorage.setItem(TOP_SPD_SORT_METRIC_KEY, 'pot');
    } catch (err) { /* ignore */ }
    topSpdPanelRerender(false);
  });

  document.getElementById('btn-top-spd-sort-dir')?.addEventListener('click', () => {
    const next = readTopSpdSortDesc() ? 'asc' : 'desc';
    try {
      localStorage.setItem(TOP_SPD_SORT_DIR_KEY, next);
    } catch (err) { /* ignore */ }
    topSpdPanelRerender(false);
  });
