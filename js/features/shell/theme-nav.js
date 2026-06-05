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
  let lastChangelogSubtab = null;

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

    const tabOrder = ['shipped', 'roadmap'];
    const prevIndex = lastChangelogSubtab ? tabOrder.indexOf(lastChangelogSubtab) : -1;
    const nextIndex = tabOrder.indexOf(v);
    const direction = prevIndex >= 0 && nextIndex >= 0 && nextIndex > prevIndex ? 'next' : 'prev';
    lastChangelogSubtab = v;

    const currentPane = prevIndex >= 0
      ? document.querySelector(`#tab-changelog .rules-subpanel[data-changelog-subtab="${tabOrder[prevIndex]}"]`)
      : null;
    const nextPane = document.querySelector(`#tab-changelog .rules-subpanel[data-changelog-subtab="${v}"]`);

    if (!instant && motionApi && motionApi.enabled() && currentPane && nextPane && currentPane !== nextPane) {
      motionApi.animateSubTabTransition({
        current: currentPane, next: nextPane, direction,
        onComplete: () => {
          panels.forEach((p) => {
            const on = p.dataset.changelogSubtab === v;
            p.classList.toggle('is-active', on);
            if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
          });
        },
      });
    } else {
      panels.forEach((p) => {
        const on = p.dataset.changelogSubtab === v;
        p.classList.toggle('is-active', on);
        if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
    }

    if (motionApi && typeof motionApi.positionChangelogSubtabIndicator === 'function') {
      rafTwice(() => {
        const nav = document.getElementById('changelog-subtabs');
        if (nav) motionApi.positionChangelogSubtabIndicator({ nav, activeKey: v, instant: !!instant });
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

    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionChangelogSubtabIndicator === 'function') {
      rafTwice(() => {
        const nav = document.getElementById('changelog-subtabs');
        if (nav) motionApi.positionChangelogSubtabIndicator({ nav, activeKey: saved, instant: true });
      });
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const nav = document.getElementById('changelog-subtabs');
          const activeBtn = nav && nav.querySelector('.rules-subtab.is-active');
          if (activeBtn) motionApi.positionChangelogSubtabIndicator({ nav, activeKey: activeBtn.dataset.changelogSubtab, instant: true });
        }, 120);
      });
    }
  }

  const GUIDE_SUBTAB_KEY = 'swrm_guide_subtab_v1';
  let guideSubtabsBound = false;
  let lastGuideSubtab = null;
  let lastDashboardSubtab = null;

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

    const tabOrder = ['start', 'dashboard', 'progression', 'table', 'evaluation', 'rules', 'tips'];
    const prevIndex = lastGuideSubtab ? tabOrder.indexOf(lastGuideSubtab) : -1;
    const nextIndex = tabOrder.indexOf(v);
    const direction = prevIndex >= 0 && nextIndex >= 0 && nextIndex > prevIndex ? 'next' : 'prev';
    lastGuideSubtab = v;

    const currentPane = prevIndex >= 0
      ? document.querySelector(`#tab-guide .rules-subpanel[data-guide-subtab="${tabOrder[prevIndex]}"]`)
      : null;
    const nextPane = document.querySelector(`#tab-guide .rules-subpanel[data-guide-subtab="${v}"]`);

    if (!instant && motionApi && motionApi.enabled() && currentPane && nextPane && currentPane !== nextPane) {
      motionApi.animateSubTabTransition({
        current: currentPane, next: nextPane, direction,
        onComplete: () => {
          panels.forEach((p) => {
            const on = p.dataset.guideSubtab === v;
            p.classList.toggle('is-active', on);
            if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
          });
        },
      });
    } else {
      panels.forEach((p) => {
        const on = p.dataset.guideSubtab === v;
        p.classList.toggle('is-active', on);
        if (on) p.removeAttribute('hidden'); else p.setAttribute('hidden', '');
      });
    }

    if (motionApi && typeof motionApi.positionGuideSubtabIndicator === 'function') {
      rafTwice(() => {
        const nav = document.getElementById('guide-subtabs');
        if (nav) motionApi.positionGuideSubtabIndicator({ nav, activeKey: v, instant: !!instant });
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

    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionGuideSubtabIndicator === 'function') {
      rafTwice(() => {
        const nav = document.getElementById('guide-subtabs');
        if (nav) motionApi.positionGuideSubtabIndicator({ nav, activeKey: saved, instant: true });
      });
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const nav = document.getElementById('guide-subtabs');
          const activeBtn = nav && nav.querySelector('.rules-subtab.is-active');
          if (activeBtn) motionApi.positionGuideSubtabIndicator({ nav, activeKey: activeBtn.dataset.guideSubtab, instant: true });
        }, 120);
      });
    }
  }

  /** Top-level header tabs. Gear hub sub-views: runetable | settings (rune dashboard → main Dashboard tab). */
  const MAIN_TAB_IDS = ['dashboard', 'gear', 'monsters', 'guide', 'changelog', 'app-settings'];
  const RUNES_SUBTAB_IDS = ['runetable', 'settings'];
  const RUNES_SUBTAB_STORAGE_KEY = 'swrm_runes_subtab_v1';
  const MONSTERS_SUBTAB_IDS = ['roster', 'teams', 'planner'];
  const MONSTERS_SUBTAB_STORAGE_KEY = 'swrm_monsters_subtab_v1';
  let runesHubTabsBound = false;

  function normalizeMainTabRequest(tabId) {
    if (tabId === 'gear' || tabId === 'runetable' || tabId === 'settings') {
      return { main: 'runes', sub: tabId === 'gear' ? 'runetable' : tabId };
    }
    if (tabId === 'roster' || tabId === 'teams' || tabId === 'planner') {
      return { main: 'monsters', sub: tabId };
    }
    if (MAIN_TAB_IDS.includes(tabId)) return { main: tabId, sub: null };
    return { main: 'dashboard', sub: 'runes' };
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
    const empty = {
      tab: null,
      runesSubtab: null,
      monstersSubtab: null,
      dashboardSubtab: null,
      query: '',
    };
    if (!raw) return empty;
    const qm = raw.indexOf('?');
    const tabPart = (qm === -1 ? raw : raw.slice(0, qm)).trim();
    const query = qm === -1 ? '' : raw.slice(qm + 1);
    let h = tabPart;
    if (h.startsWith('tab-')) h = h.slice(4);
    if (h.startsWith('dashboard/')) {
      const seg = h.slice(11).split('/')[0];
      const dashboardSubtab = seg === 'monsters' ? 'monsters' : 'runes';
      return { tab: 'dashboard', runesSubtab: null, monstersSubtab: null, dashboardSubtab, query };
    }
    if (h === 'dashboard') {
      return { tab: 'dashboard', runesSubtab: null, monstersSubtab: null, dashboardSubtab: 'runes', query };
    }
    if (h === 'gear' || h.startsWith('gear/')) {
      const seg = h === 'gear' ? 'dashboard' : h.slice(5).split('/')[0];
      if (seg === 'dashboard') {
        return { tab: 'dashboard', runesSubtab: null, monstersSubtab: null, dashboardSubtab: 'runes', query };
      }
      const sub = runesSubtabFromHashSegment(seg);
      if (sub) return { tab: 'runes', runesSubtab: sub, monstersSubtab: null, dashboardSubtab: null, query };
    }
    if (h.startsWith('runes/')) {
      const sub = runesSubtabFromHashSegment(h.slice(6).split('/')[0]);
      if (sub === 'dashboard') {
        return { tab: 'dashboard', runesSubtab: null, monstersSubtab: null, dashboardSubtab: 'runes', query };
      }
      if (sub) return { tab: 'runes', runesSubtab: sub, monstersSubtab: null, dashboardSubtab: null, query };
    }
    if (h.startsWith('monsters/')) {
      const sub = monstersSubtabFromHashSegment(h.slice(9).split('/')[0]);
      if (sub === 'dashboard') {
        return { tab: 'dashboard', runesSubtab: null, monstersSubtab: null, dashboardSubtab: 'monsters', query };
      }
      if (sub) return { tab: 'monsters', runesSubtab: null, monstersSubtab: sub, dashboardSubtab: null, query };
    }
    if (h === 'runetable' || h === 'settings') {
      return { tab: 'runes', runesSubtab: h, monstersSubtab: null, dashboardSubtab: null, query };
    }
    if (h === 'roster' || h === 'teams' || h === 'planner') {
      return { tab: 'monsters', runesSubtab: null, monstersSubtab: h, dashboardSubtab: null, query };
    }
    if (h === 'archive') return { tab: 'guide', runesSubtab: null, monstersSubtab: null, dashboardSubtab: null, query };
    if (MAIN_TAB_IDS.includes(h)) {
      return { tab: h, runesSubtab: null, monstersSubtab: null, dashboardSubtab: null, query };
    }
    return empty;
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
      if (v === 'dashboard') return 'roster';
      return MONSTERS_SUBTAB_IDS.includes(v) ? v : 'roster';
    } catch (e) {
      return 'roster';
    }
  }

  function readStoredRunesSubtab() {
    try {
      const v = sessionStorage.getItem(RUNES_SUBTAB_STORAGE_KEY);
      if (v === 'dashboard') return 'runetable';
      return RUNES_SUBTAB_IDS.includes(v) ? v : 'runetable';
    } catch (e) {
      return 'runetable';
    }
  }

  function isRuneTablePaneVisible() {
    const hub = document.getElementById('tab-runes');
    const pane = document.getElementById('tab-runetable');
    if (!hub || hub.classList.contains('hidden')) return false;
    if (!pane) return false;
    return pane.classList.contains('is-active') && !pane.hidden;
  }

  let lastRunesSubtab = null;

  function showRunesSubtab(subId, options) {
    const opts = options || {};
    const id = RUNES_SUBTAB_IDS.includes(subId) ? subId : 'runetable';
    try {
      sessionStorage.setItem(RUNES_SUBTAB_STORAGE_KEY, id);
    } catch (e) { /* ignore */ }

    const tabOrder = ['runetable', 'settings'];
    const prevIndex = lastRunesSubtab ? tabOrder.indexOf(lastRunesSubtab) : -1;
    const nextIndex = tabOrder.indexOf(id);
    const direction = prevIndex >= 0 && nextIndex >= 0 && nextIndex > prevIndex ? 'next' : 'prev';
    lastRunesSubtab = id;

    const motionApi = window.SWRM_MOTION;
    const useGsap = motionApi && motionApi.enabled();

    const currentPane = prevIndex >= 0 ? document.querySelector(`.runes-hub-pane[data-runes-pane="${tabOrder[prevIndex]}"]`) : null;
    const nextPane = document.querySelector(`.runes-hub-pane[data-runes-pane="${id}"]`);

    document.querySelectorAll('.runes-hub-tab').forEach((btn) => {
      const on = btn.dataset.runesHub === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });

    if (useGsap && currentPane && nextPane && currentPane !== nextPane) {
      const started = motionApi.animateSubTabTransition({
        current: currentPane,
        next: nextPane,
        direction,
        onComplete: () => {
          document.querySelectorAll('.runes-hub-pane').forEach((pane) => {
            const on = pane.dataset.runesPane === id;
            pane.classList.toggle('is-active', on);
            pane.classList.toggle('hidden', !on);
            if (on) pane.removeAttribute('hidden');
            else pane.setAttribute('hidden', '');
          });
        },
      });
      if (!started) {
        document.querySelectorAll('.runes-hub-pane').forEach((pane) => {
          const on = pane.dataset.runesPane === id;
          pane.classList.toggle('is-active', on);
          pane.classList.toggle('hidden', !on);
          if (on) pane.removeAttribute('hidden');
          else pane.setAttribute('hidden', '');
        });
      }
    } else {
      document.querySelectorAll('.runes-hub-pane').forEach((pane) => {
        const on = pane.dataset.runesPane === id;
        pane.classList.toggle('is-active', on);
        pane.classList.toggle('hidden', !on);
        if (on) pane.removeAttribute('hidden');
        else pane.setAttribute('hidden', '');
      });
    }

    if (motionApi) {
      rafTwice(() => {
        const nav = document.getElementById('runes-hub-tabs');
        if (nav && typeof motionApi.positionRunesHubTabIndicator === 'function') {
          motionApi.positionRunesHubTabIndicator({ nav, activeKey: id, instant: false });
        }
        if (id === 'runetable') {
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
        showRunesSubtab(sub, { writeHash: true });
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

  let mainTabsIndicatorBound = false;
  let positionMainTabsIndicator = null;

  function initMainTabsIndicator() {
    const nav = document.getElementById('main-tabs-nav');
    if (!nav || mainTabsIndicatorBound) return;
    mainTabsIndicatorBound = true;

    const indicator = nav.querySelector('.tabs__indicator');
    if (!indicator) return;

    const motionApi = window.SWRM_MOTION;
    const useGsap = motionApi && motionApi.enabled();

    // Position indicator on initial load and tab changes
    positionMainTabsIndicator = () => {
      const activeTab = nav.querySelector('.tab.active');
      if (!activeTab) return;

      const navRect = nav.getBoundingClientRect();
      const tabRect = activeTab.getBoundingClientRect();

      const left = tabRect.left - navRect.left;
      const width = tabRect.width;

      if (useGsap && typeof gsap !== 'undefined') {
        // Use GSAP animation like dash-unified-tabs
        gsap.to(indicator, {
          left: left,
          width: width,
          duration: 0.3,
          ease: 'power2.out'
        });
      } else {
        // Fallback to CSS transitions
        indicator.style.left = `${left}px`;
        indicator.style.width = `${width}px`;
      }
    };

    // Position immediately
    positionMainTabsIndicator();
    rafTwice(positionMainTabsIndicator);
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(positionMainTabsIndicator, 120);
    });
    window.addEventListener('pageshow', () => {
      rafTwice(positionMainTabsIndicator);
    });
  }

  let dashboardHubTabsBound = false;
  const DASHBOARD_SUBTAB_IDS = ['runes', 'monsters'];

  function initDashboardHubTabs() {
    const nav = document.getElementById('dashboard-hub-tabs');
    if (!nav || dashboardHubTabsBound) return;
    dashboardHubTabsBound = true;
    nav.querySelectorAll('.dashboard-hub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = btn.dataset.dashboardHub;
        if (!sub) return;
        showDashboardSubtab(sub, { writeHash: true });
      });
    });

    // Position indicator on initial load
    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionDashboardHubTabIndicator === 'function') {
      rafTwice(() => {
        const activeTab = nav.querySelector('.dashboard-hub-tab.is-active');
        if (activeTab) {
          motionApi.positionDashboardHubTabIndicator({ nav, activeKey: activeTab.dataset.dashboardHub, instant: true });
        }
      });
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const activeTab = nav.querySelector('.dashboard-hub-tab.is-active');
          if (activeTab) {
            motionApi.positionDashboardHubTabIndicator({ nav, activeKey: activeTab.dataset.dashboardHub, instant: true });
          }
        }, 120);
      });
      window.addEventListener('pageshow', () => {
        rafTwice(() => {
          const activeTab = nav.querySelector('.dashboard-hub-tab.is-active');
          if (activeTab) {
            motionApi.positionDashboardHubTabIndicator({ nav, activeKey: activeTab.dataset.dashboardHub, instant: true });
          }
        });
      });
    }
  }

  function showDashboardSubtab(sub, options) {
    const opts = options || {};
    const nav = document.getElementById('dashboard-hub-tabs');
    if (!nav) return;

    const subId = DASHBOARD_SUBTAB_IDS.includes(sub) ? sub : 'runes';

    const DASHBOARD_TAB_ORDER = ['runes', 'monsters'];
    const prevDashIndex = lastDashboardSubtab ? DASHBOARD_TAB_ORDER.indexOf(lastDashboardSubtab) : -1;
    const nextDashIndex = DASHBOARD_TAB_ORDER.indexOf(subId);
    const dashDirection = prevDashIndex >= 0 && nextDashIndex >= 0 && nextDashIndex > prevDashIndex ? 'next' : 'prev';
    const prevDashSubId = lastDashboardSubtab;
    lastDashboardSubtab = subId;

    // Update tab buttons
    nav.querySelectorAll('.dashboard-hub-tab').forEach((btn) => {
      const isActive = btn.dataset.dashboardHub === subId;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
      btn.tabIndex = isActive ? 0 : -1;
    });

    // Update panes with slide animation
    const motionApi = window.SWRM_MOTION;
    const currentDashPane = prevDashSubId
      ? document.querySelector(`.dashboard-hub-pane[data-dashboard-pane="${prevDashSubId}"]`)
      : null;
    const nextDashPane = document.querySelector(`.dashboard-hub-pane[data-dashboard-pane="${subId}"]`);

    if (!opts.instant && motionApi && motionApi.enabled() && currentDashPane && nextDashPane && currentDashPane !== nextDashPane) {
      const started = motionApi.animateSubTabTransition({
        current: currentDashPane,
        next: nextDashPane,
        direction: dashDirection,
        onComplete: () => {
          document.querySelectorAll('.dashboard-hub-pane').forEach((pane) => {
            const isActive = pane.dataset.dashboardPane === subId;
            pane.classList.toggle('is-active', isActive);
            pane.hidden = !isActive;
          });
        },
      });
      if (!started) {
        document.querySelectorAll('.dashboard-hub-pane').forEach((pane) => {
          const isActive = pane.dataset.dashboardPane === subId;
          pane.classList.toggle('is-active', isActive);
          pane.hidden = !isActive;
        });
      }
    } else {
      document.querySelectorAll('.dashboard-hub-pane').forEach((pane) => {
        const isActive = pane.dataset.dashboardPane === subId;
        pane.classList.toggle('is-active', isActive);
        pane.hidden = !isActive;
      });
    }

    // Position indicator
    if (motionApi && typeof motionApi.positionDashboardHubTabIndicator === 'function') {
      motionApi.positionDashboardHubTabIndicator({ nav, activeKey: subId, instant: opts.instant });
    }

    if (subId === 'runes' && typeof scheduleDashboardChartReplay === 'function') {
      scheduleDashboardChartReplay({ tabSwitch: true, animateCharts: false });
    }
    if (subId === 'monsters' && typeof renderMonstersDashboard === 'function') {
      const hasCache =
        typeof monstersEnrichedCache !== 'undefined' &&
        Array.isArray(monstersEnrichedCache) &&
        monstersEnrichedCache.length > 0;
      if (hasCache) {
        renderMonstersDashboard();
      } else {
        // Явно вызываем renderMonstersPanel чтобы заполнить кэш
        if (typeof renderMonstersPanel === 'function') {
          void renderMonstersPanel();
        }
      }
    }

    if (motionApi && subId === 'runes') {
      rafTwice(() => {
        const uniNav = document.getElementById('dash-unified-tabs');
        if (uniNav && typeof motionApi.positionDashUnifiedTabIndicator === 'function') {
          const key =
            (typeof readDashboardUnifiedTab === 'function' && readDashboardUnifiedTab()) ||
            (uniNav.querySelector('[data-dash-uni].is-active')?.getAttribute('data-dash-uni')) ||
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
    
    // Map 'gear' to 'runes' for content (tab-runes element)
    if (main === 'gear') {
      main = 'runes';
    }
    
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) {
      if (main === 'guide' || main === 'changelog') {
        main = 'runes';
        sub = sub || readStoredRunesSubtab();
        tabId = sub ? `runes/${sub}` : 'runes';
      }
    }
    if (showMainTabLastMain === 'monsters' && main !== 'monsters') {
      if (typeof resetMonstersTableSort === 'function') resetMonstersTableSort();
      if (typeof unpinMonsterDetail === 'function') unpinMonsterDetail();
      if (typeof clearAllMonstersSelection === 'function') clearAllMonstersSelection();
    }

    const prevMain = showMainTabLastMain;
    showMainTabLastMain = main;
    const hashParts = splitMainHash();
    const runesSub =
      sub ||
      (opts.runesSubtab && RUNES_SUBTAB_IDS.includes(opts.runesSubtab) ? opts.runesSubtab : null) ||
      hashParts.runesSubtab ||
      readStoredRunesSubtab();

    // Tab order for direction detection
    // Note: 'runes' is used internally for the Gear tab (data-tab="gear")
    const tabOrder = ['dashboard', 'runes', 'monsters', 'guide', 'changelog', 'app-settings'];
    const prevIndex = prevMain ? tabOrder.indexOf(prevMain) : -1;
    const nextIndex = tabOrder.indexOf(main);
    const direction = prevIndex >= 0 && nextIndex >= 0 && nextIndex > prevIndex ? 'next' : 'prev';

    const motionApi = window.SWRM_MOTION;
    const useGsap = motionApi && motionApi.enabled();

    const currentTabContent = prevMain ? document.getElementById(`tab-${prevMain}`) : null;
    const nextTabContent = document.getElementById(`tab-${main}`);

    document.querySelectorAll('.tab').forEach((t) => {
      // Handle gear/runes mapping for active class
      const tabId = t.dataset.tab;
      const isActive = tabId === main || (tabId === 'gear' && main === 'runes');
      t.classList.toggle('active', isActive);
    });

    if (useGsap && currentTabContent && nextTabContent && currentTabContent !== nextTabContent) {
      const started = motionApi.animateMainTabTransition({
        current: currentTabContent,
        next: nextTabContent,
        direction,
        onComplete: () => {
          document.querySelectorAll('.tab-content').forEach((el) => {
            el.classList.toggle('hidden', el.id !== `tab-${main}`);
          });
          // Reset scroll position after animation completes
          if (main === 'changelog') {
            const chRoot = document.getElementById('tab-changelog');
            if (chRoot) chRoot.scrollTop = 0;
          }
          if (main === 'guide') {
            const guideRoot = document.getElementById('tab-guide');
            if (guideRoot) guideRoot.scrollTop = 0;
          }
          if (main === 'monsters') {
            const monstersRoot = document.getElementById('tab-monsters');
            if (monstersRoot) monstersRoot.scrollTop = 0;
          }
        },
      });
      if (!started) {
        document.querySelectorAll('.tab-content').forEach((el) => {
          el.classList.toggle('hidden', el.id !== `tab-${main}`);
        });
      }
    } else {
      document.querySelectorAll('.tab-content').forEach((el) => {
        el.classList.toggle('hidden', el.id !== `tab-${main}`);
      });
    }

    if (main === 'dashboard') {
      if (positionMainTabsIndicator) positionMainTabsIndicator();
      initDashboardHubTabs();
      const dashSub =
        sub ||
        (opts.dashboardSubtab && DASHBOARD_SUBTAB_IDS.includes(opts.dashboardSubtab)
          ? opts.dashboardSubtab
          : null) ||
        hashParts.dashboardSubtab ||
        'runes';
      showDashboardSubtab(dashSub, opts);
    }

    if (main === 'runes') {
      if (positionMainTabsIndicator) positionMainTabsIndicator();
      initRunesHubTabs();
      showRunesSubtab(runesSub, opts);
    }

    if (main === 'app-settings') {
      if (positionMainTabsIndicator) positionMainTabsIndicator();
      renderDbSlots();
    }
    if (main === 'guide') {
      if (positionMainTabsIndicator) positionMainTabsIndicator();
      initGuideSubtabs();
      // initGuideSubtabs() is guarded by guideSubtabsBound and skips on repeat visits,
      // so the indicator is never repositioned after the first time. Always reposition it.
      const motionApiG = window.SWRM_MOTION;
      if (motionApiG && typeof motionApiG.positionGuideSubtabIndicator === 'function') {
        rafTwice(() => {
          const guideNav = document.getElementById('guide-subtabs');
          const activeBtn = guideNav && guideNav.querySelector('.rules-subtab.is-active');
          if (activeBtn) motionApiG.positionGuideSubtabIndicator({ nav: guideNav, activeKey: activeBtn.dataset.guideSubtab, instant: true });
        });
      }
    }
    if (main === 'changelog') {
      if (positionMainTabsIndicator) positionMainTabsIndicator();
      initChangelogSubtabs();
      // Same guard issue as guide — always reposition indicator on every visit.
      const motionApiC = window.SWRM_MOTION;
      if (motionApiC && typeof motionApiC.positionChangelogSubtabIndicator === 'function') {
        rafTwice(() => {
          const clNav = document.getElementById('changelog-subtabs');
          const activeBtn = clNav && clNav.querySelector('.rules-subtab.is-active');
          if (activeBtn) motionApiC.positionChangelogSubtabIndicator({ nav: clNav, activeKey: activeBtn.dataset.changelogSubtab, instant: true });
        });
      }
    }
    if (main === 'monsters') {
      if (positionMainTabsIndicator) positionMainTabsIndicator();
      initMonstersHubTabs();
      const monstersSub =
        sub ||
        (opts.monstersSubtab && MONSTERS_SUBTAB_IDS.includes(opts.monstersSubtab)
          ? opts.monstersSubtab
          : null) ||
        hashParts.monstersSubtab ||
        readStoredMonstersSubtab();
      showMonstersSubtab(monstersSub, opts);
    }

    if (writeHash) {
      try {
        const base = window.location.pathname + window.location.search;
        let url;
        if (main === 'runes') {
          if (runesSub === 'runetable') url = `${base}#gear/runetable${buildRuneTableQuerySuffix()}`;
          else url = `${base}#gear/${runesSub}`;
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
        else if (main === 'dashboard') {
          const dashSub =
            sub ||
            (opts.dashboardSubtab && DASHBOARD_SUBTAB_IDS.includes(opts.dashboardSubtab)
              ? opts.dashboardSubtab
              : null) ||
            hashParts.dashboardSubtab ||
            'runes';
          url = dashSub === 'monsters' ? `${base}#dashboard/monsters` : `${base}#dashboard`;
        }
        else url = `${base}#${main}`;
        if (pushHistory) history.pushState(null, '', url);
        else history.replaceState(null, '', url);
      } catch (e) { /* ignore */ }
    }
  }

  // Initialize main tabs indicator on page load
  document.addEventListener('DOMContentLoaded', () => {
    initMainTabsIndicator();
  });
