// js/features/shell/theme-nav.js — theme, header, and navigation bindings
  // ===================== THEME (header sun / moon slider) =====================
  function applyThemeDom() {
    const toggle = document.getElementById('theme-toggle');
    const isLight = currentTheme === 'light';
    document.body.classList.toggle('light-theme', isLight);
    if (toggle) {
      toggle.classList.toggle('is-light', isLight);
      toggle.classList.toggle('is-dark', !isLight);
      toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
    }
  }

  function setTheme(mode) {
    currentTheme = mode === 'dark' ? 'dark' : 'light';
    localStorage.setItem('swrm-theme', currentTheme);
    applyThemeDom();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
    updateHeaderThemeA11y(t);
  }

  function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  function initTheme() {
    applyThemeDom();
  }

  function updateHeaderThemeA11y(t) {
    const group = document.getElementById('header-theme-group');
    const toggle = document.getElementById('theme-toggle');
    if (group) group.setAttribute('aria-label', t.themeGroupAria || t.theme || 'Theme');
    if (!toggle) return;
    const isLight = currentTheme === 'light';
    const label = isLight
      ? (t.themeDarkTitle || 'Dark theme')
      : (t.themeLightTitle || 'Light theme');
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-label', label);
  }

  function stageDisplayName(tr, stageKey) {
    if (!stageKey) return '\u2014';
    const map = { Early: tr.early, Mid: tr.mid, Late: tr.late };
    return map[stageKey] || stageKey;
  }

  function updateStageAdvisorLabels(t) {
    const setText = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    setText('lbl-stage-advisor-title', t.stageAdvisorTitle || '');
    setText('lbl-stage-advisor-lead', t.stageAdvisorLead || '');
    setText('lbl-stage-suggested', t.stageSuggestedLabel || '');
    setText('lbl-stage-your-preset', t.stageYourPresetLabel || '');
    setText('lbl-stage-metrics-explainer', t.stageMetricsExplainer || '');
    const formulaEl = document.getElementById('lbl-stage-formula');
    if (formulaEl) {
      const ft = (t.stageFormulaExpl || '').trim();
      formulaEl.textContent = ft;
      formulaEl.hidden = !ft;
    }
    setText('lbl-card-hr-name', (t.stageCardHrName || '').trim());
    setText('lbl-card-hr-desc', t.stageCardHrDesc || '');
    setText('lbl-card-keep-name', (t.stageCardKeepName || '').trim());
    setText('lbl-card-keep-desc', t.stageCardKeepDesc || '');
    setText('lbl-card-meta-name', (t.stageCardMetaName || '').trim());
    setText('lbl-card-meta-desc', t.stageCardMetaDesc || '');
    setText('lbl-card-hr-weight', t.stageCardHrWeight || '');
    setText('lbl-card-keep-weight', t.stageCardKeepWeight || '');
    setText('lbl-card-meta-weight', t.stageCardMetaWeight || '');
    const btnAuto = document.getElementById('btn-auto-stage');
    if (btnAuto) {
      btnAuto.textContent = t.stageApplySuggestion || 'Apply suggestion';
      const aria = String(t.stageApplySuggestionAria || t.stageApplySuggestion || '').trim();
      if (aria) btnAuto.setAttribute('aria-label', aria);
      else btnAuto.removeAttribute('aria-label');
    }
    setText('lbl-dashboard-strictness', t.dashboardStrictnessLabel || 'Strictness');
  }

  const RULES_SUBTAB_KEY = 'swrm_rules_subtab_v1';
  let rulesSubtabsBound = false;

  const RULES_SUBTAB_IDS = [
    'engine',
    'roles',
    'verdict',
    'artifact-roles',
    'artifact-verdict',
    'artifact-synergies',
  ];

  function normalizeRulesSubtabId(id) {
    if (id === 'artifacts') return 'artifact-roles';
    return RULES_SUBTAB_IDS.includes(id) ? id : 'engine';
  }

  function rulesNavForSubtab(subtabId) {
    const btn = document.getElementById(`rules-subtab-${subtabId}`);
    return btn && btn.closest('.rules-subtabs');
  }

  function setRulesSubtab(id, instant) {
    const v = normalizeRulesSubtabId(id);
    try { sessionStorage.setItem(RULES_SUBTAB_KEY, v); } catch (e) { /* ignore */ }
    document.querySelectorAll('#tab-settings .rules-subtab').forEach((btn) => {
      const on = btn.dataset.rulesSubtab === v;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });

    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionRulesSubtabIndicator === 'function') {
      const nav = rulesNavForSubtab(v);
      if (nav) {
        motionApi.positionRulesSubtabIndicator({ nav, activeKey: v, instant: !!instant });
      }
    }

    const panels = Array.from(document.querySelectorAll('#tab-settings .rules-subpanel'));
    if (motionApi) {
      motionApi.swapSubpanels(panels, (p) => p.dataset.rulesSubtab === v, !!instant);
    } else {
      panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.rulesSubtab === v);
      });
    }
  }

  function initRulesSubtabs() {
    const root = document.getElementById('tab-settings');
    if (!root || rulesSubtabsBound) return;
    rulesSubtabsBound = true;
    root.querySelectorAll('.rules-subtab[data-rules-subtab]').forEach((btn) => {
      btn.addEventListener('click', () => setRulesSubtab(btn.dataset.rulesSubtab));
    });
    let saved = 'engine';
    try { saved = normalizeRulesSubtabId(sessionStorage.getItem(RULES_SUBTAB_KEY) || 'engine'); } catch (e) { /* ignore */ }
    setRulesSubtab(saved, true);

    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionRulesSubtabIndicator === 'function') {
      rafTwice(() => {
        const nav = rulesNavForSubtab(saved);
        if (nav) motionApi.positionRulesSubtabIndicator({ nav, activeKey: saved, instant: true });
      });
    }
  }

  const CHANGELOG_SUBTAB_KEY = 'swrm_changelog_subtab_v1';
  let changelogSubtabsBound = false;

  function setChangelogSubtab(subtabId, instant) {
    const nav = document.getElementById('changelog-subtabs');
    if (!nav) return;
    const v = subtabId === 'roadmap' ? 'roadmap' : 'shipped';
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      const active = btn.dataset.changelogSubtab === v;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
    const panels = Array.from(document.querySelectorAll('#tab-changelog .rules-subpanel'));
    const motionApi = window.SWRM_MOTION;
    if (motionApi) {
      motionApi.swapSubpanels(panels, (p) => p.dataset.changelogSubtab === v, !!instant);
    } else {
      panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.changelogSubtab === v);
      });
    }
    try { sessionStorage.setItem(CHANGELOG_SUBTAB_KEY, v); } catch (e) { /* ignore */ }
  }

  function initChangelogSubtabs() {
    const nav = document.getElementById('changelog-subtabs');
    if (!nav || changelogSubtabsBound) return;
    changelogSubtabsBound = true;
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      btn.addEventListener('click', () => setChangelogSubtab(btn.dataset.changelogSubtab));
    });
    let saved = 'shipped';
    try { saved = sessionStorage.getItem(CHANGELOG_SUBTAB_KEY) || 'shipped'; } catch (e) { /* ignore */ }
    setChangelogSubtab(saved, true);
  }

  const GUIDE_SUBTAB_KEY = 'swrm_guide_subtab_v1';
  let guideSubtabsBound = false;

  function normalizeGuideSubtabId(id) {
    if (
      id === 'start' ||
      id === 'dashboard' ||
      id === 'progression' ||
      id === 'table' ||
      id === 'evaluation' ||
      id === 'rules' ||
      id === 'tips'
    ) {
      return id;
    }
    return 'start';
  }

  function setGuideSubtab(subtabId, instant) {
    const nav = document.getElementById('guide-subtabs');
    if (!nav) return;
    const v = normalizeGuideSubtabId(subtabId);
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      const active = btn.dataset.guideSubtab === v;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
    const panels = Array.from(
      document.querySelectorAll('#tab-guide .rules-subpanel[data-guide-subtab]'),
    );
    const motionApi = window.SWRM_MOTION;
    if (motionApi) {
      motionApi.swapSubpanels(panels, (p) => p.dataset.guideSubtab === v, !!instant);
    } else {
      panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.guideSubtab === v);
      });
    }
    try {
      sessionStorage.setItem(GUIDE_SUBTAB_KEY, v);
    } catch (e) {
      /* ignore */
    }
  }

  function initGuideSubtabs() {
    const nav = document.getElementById('guide-subtabs');
    if (!nav || guideSubtabsBound) return;
    guideSubtabsBound = true;
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      btn.addEventListener('click', () => setGuideSubtab(btn.dataset.guideSubtab));
    });
    let saved = 'start';
    try {
      saved = sessionStorage.getItem(GUIDE_SUBTAB_KEY) || 'start';
    } catch (e) {
      /* ignore */
    }
    setGuideSubtab(saved, true);
  }

  /** Top-level header tabs. Runes hub sub-views: dashboard | runetable | settings. */
  const MAIN_TAB_IDS = ['runes', 'monsters', 'guide', 'changelog', 'app-settings'];
  const RUNES_SUBTAB_IDS = ['dashboard', 'runetable', 'settings'];
  const RUNES_SUBTAB_STORAGE_KEY = 'swrm_runes_subtab_v1';
  const MONSTERS_SUBTAB_IDS = ['dashboard', 'roster', 'teams', 'planner'];
  const MONSTERS_SUBTAB_STORAGE_KEY = 'swrm_monsters_subtab_v1';
  let runesHubTabsBound = false;

  function normalizeMainTabRequest(tabId) {
    if (tabId === 'dashboard' || tabId === 'runetable' || tabId === 'settings') {
      return { main: 'runes', sub: tabId };
    }
    if (tabId === 'roster' || tabId === 'teams' || tabId === 'planner') {
      return { main: 'monsters', sub: tabId };
    }
    if (MAIN_TAB_IDS.includes(tabId)) return { main: tabId, sub: null };
    return { main: 'runes', sub: 'dashboard' };
  }

  function runesSubtabFromHashSegment(segment) {
    const s = String(segment || '').trim().toLowerCase();
    if (s === 'table') return 'runetable';
    if (s === 'rules') return 'settings';
    if (RUNES_SUBTAB_IDS.includes(s)) return s;
    return null;
  }

  function splitMainHash() {
    const raw = (window.location.hash || '').replace(/^#/, '').trim();
    if (!raw) return { tab: null, runesSubtab: null, monstersSubtab: null, query: '' };
    const qm = raw.indexOf('?');
    const tabPart = (qm === -1 ? raw : raw.slice(0, qm)).trim();
    const query = qm === -1 ? '' : raw.slice(qm + 1);
    let h = tabPart;
    if (h.startsWith('tab-')) h = h.slice(4);
    if (h.startsWith('runes/')) {
      const sub = runesSubtabFromHashSegment(h.slice(6).split('/')[0]);
      if (sub) return { tab: 'runes', runesSubtab: sub, monstersSubtab: null, query };
    }
    if (h.startsWith('monsters/')) {
      const sub = monstersSubtabFromHashSegment(h.slice(9).split('/')[0]);
      if (sub) return { tab: 'monsters', runesSubtab: null, monstersSubtab: sub, query };
    }
    if (h === 'dashboard' || h === 'runetable' || h === 'settings') {
      return { tab: 'runes', runesSubtab: h, monstersSubtab: null, query };
    }
    if (h === 'roster' || h === 'teams' || h === 'planner') {
      return { tab: 'monsters', runesSubtab: null, monstersSubtab: h, query };
    }
    if (h === 'archive') return { tab: 'guide', runesSubtab: null, monstersSubtab: null, query };
    if (MAIN_TAB_IDS.includes(h)) return { tab: h, runesSubtab: null, monstersSubtab: null, query };
    return { tab: null, runesSubtab: null, monstersSubtab: null, query };
  }

  function mainTabIdFromHash() {
    const { tab, runesSubtab, monstersSubtab } = splitMainHash();
    if (tab === 'runes' && runesSubtab) return runesSubtab;
    if (tab === 'monsters' && monstersSubtab) return monstersSubtab;
    return tab;
  }

  function readStoredMonstersSubtab() {
    try {
      const v = sessionStorage.getItem(MONSTERS_SUBTAB_STORAGE_KEY);
      return MONSTERS_SUBTAB_IDS.includes(v) ? v : 'roster';
    } catch (e) {
      return 'roster';
    }
  }

  function readStoredRunesSubtab() {
    try {
      const v = sessionStorage.getItem(RUNES_SUBTAB_STORAGE_KEY);
      return RUNES_SUBTAB_IDS.includes(v) ? v : 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  }

  function isRuneTablePaneVisible() {
    const hub = document.getElementById('tab-runes');
    const pane = document.getElementById('tab-runetable');
    if (!hub || hub.classList.contains('hidden')) return false;
    if (!pane) return false;
    return pane.classList.contains('is-active') && !pane.hidden;
  }

  function showRunesSubtab(subId, options) {
    const opts = options || {};
    const id = RUNES_SUBTAB_IDS.includes(subId) ? subId : 'dashboard';
    try {
      sessionStorage.setItem(RUNES_SUBTAB_STORAGE_KEY, id);
    } catch (e) { /* ignore */ }

    document.querySelectorAll('.runes-hub-tab').forEach((btn) => {
      const on = btn.dataset.runesHub === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });

    document.querySelectorAll('.runes-hub-pane').forEach((pane) => {
      const on = pane.dataset.runesPane === id;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('hidden', !on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });

    const motionApi = window.SWRM_MOTION;
    if (motionApi) {
      rafTwice(() => {
        const nav = document.getElementById('runes-hub-tabs');
        if (nav && typeof motionApi.positionRunesHubTabIndicator === 'function') {
          motionApi.positionRunesHubTabIndicator({ nav, activeKey: id, instant: false });
        }
        if (id === 'dashboard') {
          const uniNav = document.getElementById('dash-unified-tabs');
          if (uniNav && typeof motionApi.positionDashUnifiedTabIndicator === 'function') {
            const key =
              (typeof readDashboardUnifiedTab === 'function' && readDashboardUnifiedTab()) ||
              (uniNav.querySelector('[data-dash-uni].is-active')?.getAttribute('data-dash-uni')) ||
              (uniNav.querySelector('[data-dash-uni]')?.getAttribute('data-dash-uni')) ||
              'breakdown';
            motionApi.positionDashUnifiedTabIndicator({ nav: uniNav, activeKey: key, instant: true });
          }
          const kindNav = document.getElementById('dash-dist-kind-tabs');
          if (kindNav && typeof motionApi.positionDashUnifiedTabIndicator === 'function') {
            const kind =
              (typeof readDashboardDistKind === 'function' && readDashboardDistKind()) ||
              (kindNav.querySelector('[data-dash-dist-kind].is-active')?.getAttribute('data-dash-dist-kind')) ||
              'runes';
            motionApi.positionDashUnifiedTabIndicator({ nav: kindNav, activeKey: kind, instant: true });
          }
          const artNav = document.getElementById('dash-art-tabs');
          if (artNav && !artNav.closest('[hidden]') && typeof positionArtifactDashTabIndicator === 'function') {
            const key =
              (typeof readArtifactDashTab === 'function' && readArtifactDashTab()) ||
              (artNav.querySelector('[data-dash-art-tab].is-active')?.getAttribute('data-dash-art-tab')) ||
              'breakdown';
            positionArtifactDashTabIndicator({ nav: artNav, activeKey: key, instant: true });
          }
        } else if (id === 'runetable') {
          if (typeof updateTableKindTabIndicator === 'function') {
            updateTableKindTabIndicator({ instant: true });
          }
        } else if (id === 'settings') {
          if (typeof initRulesSubtabs === 'function') initRulesSubtabs();
          const rulesNav = document.querySelector('#tab-settings .rules-subtabs');
          if (rulesNav && typeof motionApi.positionRulesSubtabIndicator === 'function') {
            let key = 'engine';
            try {
              key =
                sessionStorage.getItem(RULES_SUBTAB_KEY) ||
                rulesNav.querySelector('[data-rules-subtab].is-active')?.getAttribute('data-rules-subtab') ||
                'engine';
            } catch (e) {
              key =
                rulesNav.querySelector('[data-rules-subtab].is-active')?.getAttribute('data-rules-subtab') ||
                'engine';
            }
            motionApi.positionRulesSubtabIndicator({ nav: rulesNav, activeKey: normalizeRulesSubtabId(key), instant: true });
          }
        }
      });
    }

    if (id === 'settings') {
      const rulesRoot = document.getElementById('tab-settings');
      if (rulesRoot) rulesRoot.scrollTop = 0;
    }

    if (id === 'dashboard' && typeof scheduleDashboardChartReplay === 'function') {
      scheduleDashboardChartReplay({ tabSwitch: true, animateCharts: false });
    }

    if (id === 'runetable') {
      if (typeof initTableKindTabs === 'function') initTableKindTabs();
      const kind = typeof readTableKind === 'function' ? readTableKind() : 'runes';
      if (kind === 'runes') {
        const { query } = splitMainHash();
        if (query) applyRuneTableQueryParams(new URLSearchParams(query));
        updateSortHeaderClasses();
        updateRuneTableFilterIndicators();
        if (typeof flushRuneTableRenderIfNeeded === 'function') {
          flushRuneTableRenderIfNeeded();
        } else {
          applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
        }
      } else if (typeof showTableKind === 'function') {
        showTableKind(kind);
      }
    }
  }

  function initRunesHubTabs() {
    const nav = document.getElementById('runes-hub-tabs');
    if (!nav || runesHubTabsBound) return;
    runesHubTabsBound = true;
    nav.querySelectorAll('.runes-hub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = btn.dataset.runesHub;
        if (!sub) return;
        showMainTab('runes', { runesSubtab: sub, writeHash: true });
      });
    });
    
    // Position indicator on initial load
    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionRunesHubTabIndicator === 'function') {
      rafTwice(() => {
        const activeTab = nav.querySelector('.runes-hub-tab.is-active');
        if (activeTab) {
          motionApi.positionRunesHubTabIndicator({ nav, activeKey: activeTab.dataset.runesHub, instant: true });
        }
      });
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const activeTab = nav.querySelector('.runes-hub-tab.is-active');
          if (activeTab) {
            motionApi.positionRunesHubTabIndicator({ nav, activeKey: activeTab.dataset.runesHub, instant: true });
          }
        }, 120);
      });
      window.addEventListener('pageshow', () => {
        rafTwice(() => {
          const activeTab = nav.querySelector('.runes-hub-tab.is-active');
          if (activeTab) {
            motionApi.positionRunesHubTabIndicator({ nav, activeKey: activeTab.dataset.runesHub, instant: true });
          }
        });
      });
    }
  }

  /**
   * @param {string} tabId
   * @param {{ writeHash?: boolean, pushHistory?: boolean, runesSubtab?: string, keepTab?: boolean }} [options]
   */
  let showMainTabLastMain = null;

  function showMainTab(tabId, options) {
    const opts = options || {};
    const writeHash = opts.writeHash === true;
    const pushHistory = opts.pushHistory === true;
    let { main, sub } = normalizeMainTabRequest(tabId);
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) {
      if (main === 'guide' || main === 'changelog') {
        main = 'runes';
        sub = sub || readStoredRunesSubtab();
        tabId = sub && sub !== 'dashboard' ? `runes/${sub}` : 'runes';
      }
    }
    if (showMainTabLastMain === 'monsters' && main !== 'monsters') {
      if (typeof resetMonstersTableSort === 'function') resetMonstersTableSort();
      if (typeof unpinMonsterDetail === 'function') unpinMonsterDetail();
      if (typeof clearAllMonstersSelection === 'function') clearAllMonstersSelection();
    }
    showMainTabLastMain = main;
    const hashParts = splitMainHash();
    const runesSub =
      sub ||
      (opts.runesSubtab && RUNES_SUBTAB_IDS.includes(opts.runesSubtab) ? opts.runesSubtab : null) ||
      hashParts.runesSubtab ||
      readStoredRunesSubtab();

    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === main);
    });
    document.querySelectorAll('.tab-content').forEach((el) => {
      el.classList.toggle('hidden', el.id !== `tab-${main}`);
    });

    if (main === 'runes') {
      initRunesHubTabs();
      showRunesSubtab(runesSub, opts);
    }

    if (main === 'changelog') {
      const chRoot = document.getElementById('tab-changelog');
      if (chRoot) chRoot.scrollTop = 0;
    }
    if (main === 'guide') {
      const guideRoot = document.getElementById('tab-guide');
      if (guideRoot) guideRoot.scrollTop = 0;
    }
    if (main === 'app-settings') {
      renderDbSlots();
    }
    if (main === 'monsters') {
      initMonstersHubTabs();
      const monstersSub =
        sub ||
        (opts.monstersSubtab && MONSTERS_SUBTAB_IDS.includes(opts.monstersSubtab)
          ? opts.monstersSubtab
          : null) ||
        hashParts.monstersSubtab ||
        readStoredMonstersSubtab();
      showMonstersSubtab(monstersSub, opts);
      const monstersRoot = document.getElementById('tab-monsters');
      if (monstersRoot) monstersRoot.scrollTop = 0;
    }

    if (writeHash) {
      try {
        const base = window.location.pathname + window.location.search;
        let url;
        if (main === 'runes') {
          if (runesSub === 'dashboard') url = base;
          else if (runesSub === 'runetable') url = `${base}#runetable${buildRuneTableQuerySuffix()}`;
          else url = `${base}#${runesSub}`;
        } else if (main === 'monsters') {
          const monstersSub =
            sub ||
            (opts.monstersSubtab && MONSTERS_SUBTAB_IDS.includes(opts.monstersSubtab)
              ? opts.monstersSubtab
              : null) ||
            hashParts.monstersSubtab ||
            readStoredMonstersSubtab();
          url = monstersSub === 'roster' ? `${base}#monsters` : `${base}#monsters/${monstersSub}`;
        } else if (main === 'guide') url = `${base}#guide`;
        else url = `${base}#${main}`;
        if (pushHistory) history.pushState(null, '', url);
        else history.replaceState(null, '', url);
      } catch (e) { /* ignore */ }
    }
  }
