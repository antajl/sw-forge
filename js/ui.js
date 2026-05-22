// =============================================
// ui.js — built from js/features/ (do not edit by hand)
// Rebuild: npm run build:ui
// =============================================

(function() {
  const APP_LANG_KEY = 'swrm_app_lang_v1';

  const { parseSWEX, parseUnits, extractSwexSummary, countAllSwexRunes, processAll,
          STAT_NAMES, SET_NAMES, GRADE_SHORT, saveSettings,
          DEFAULT_STAT_CONSTANTS, DEFAULT_THRESHOLDS, DEFAULT_FORMULAS,
          DEFAULT_ROLES, DEFAULT_REAPP, DEFAULT_GRIND, DEFAULT_GEM_META, TRANSLATIONS } = window.SWRM;

  let allRunes = [];
  let allArtifacts = [];
  let allRelics = [];
  /** 6★ units from last SWEX `unit_list` (see rebuildUnitsFromSwex). */
  let allUnits = [];
  let activeSwexJson = null;
  let processedRunes = [];
  let stage    = 'Mid';
  let sortKey  = 'score';
  let sortDir  = 'desc';
  /** First paint of Rune Table: this many rows; user can load the rest explicitly. */
  const RUNE_TABLE_PAGE = 500;
  const RUNE_TABLE_SORT_KEYS = new Set([
    'grade', 'set', 'level', 'slot', 'main', 'eff', 'score', 'role', 'verdict', 's1', 's2', 's3', 's4',
  ]);
  const RUNE_TABLE_ANCIENT_ONLY_KEY = 'swrm_rune_table_ancient_only_v1';
  const RUNE_TABLE_HIDE_TARGET_KEY = 'swrm_rune_table_hide_target_v1';
  let runeTableShowAll = false;
  let runeTableApplyingHash = false;
  /** Lowercase search string for highlighting table cells (full query, not debounced). */
  let tableSearchHighlight = '';
  let searchDebounceTimer = null;
  let globalMinLevel = 0;
  let globalGradeMin = 3;
  let globalGradeMax = 5;
  try {
    const _gmin = parseInt(localStorage.getItem('swrm_dashboard_grade_min_v1'), 10);
    const _gmax = parseInt(localStorage.getItem('swrm_dashboard_grade_max_v1'), 10);
    if (_gmin >= 3 && _gmin <= 5 && _gmax >= 3 && _gmax <= 5 && _gmin <= _gmax) {
      globalGradeMin = _gmin;
      globalGradeMax = _gmax;
    } else {
      const _mg = parseInt(localStorage.getItem('swrm_dashboard_min_grade_v1'), 10);
      if (_mg >= 3 && _mg <= 5) {
        globalGradeMin = _mg;
        globalGradeMax = 5;
      }
    }
  } catch (e) { /* ignore */ }
  /** User explicitly expanded the progression panel (`1` = expanded; default collapsed). */
  const STAGE_PROGRESSION_EXPANDED_KEY = 'swrm_stage_progression_expanded_v1';
  const TOP_SPD_STORAGE_KEY = 'swrm_dashboard_top_spd_set_v1';
  const TOP_SPD_DEFAULT_SET = 'Swift';
  const TOP_SPD_PER_SLOT = 5;
  const SPD_SUB_MAX_GRIND = 5;
  /** Slot 2 is % main — SPD sub lines are not tracked in Top SPD. */
  const TOP_SPD_SKIP_SLOT = 2;
  const TOP_SPD_GRID_SLOTS = [1, 3, 4, 5, 6];
  const TOP_SPD_RADAR_VERTICES = TOP_SPD_GRID_SLOTS.length;
  /** SVG viewBox + pentagon layout (larger, centered in host). */
  const TOP_SPD_RADAR_VB_W = 500;
  const TOP_SPD_RADAR_VB_H = 460;
  const TOP_SPD_RADAR_CX = TOP_SPD_RADAR_VB_W / 2;
  const TOP_SPD_RADAR_CY = 232;
  const TOP_SPD_RADAR_R = 132;
  const TOP_SPD_RADAR_LABEL_OFFSET = 50;
  const TOP_SPD_SORT_METRIC_KEY = 'swrm_top_spd_sort_metric_v1';
  const TOP_SPD_SORT_DIR_KEY = 'swrm_top_spd_sort_dir_v1';
  const DASH_UNIFIED_DIST_KEY = 'swrm_dashboard_unified_dist_v1';
  /** Legacy Role/Sets-only toggle — migrated once into {@link DASH_UNIFIED_DIST_KEY}. */
  const DASH_DIST_TAB_LEGACY_KEY = 'swrm_dashboard_dist_tab_v1';
  let currentLang = localStorage.getItem(APP_LANG_KEY) || localStorage.getItem('swrm-lang') || 'en';
  if (!['en', 'ru', 'fr'].includes(currentLang)) currentLang = 'en';
  let currentTheme = localStorage.getItem('swrm-theme') || 'dark';

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

  function normalizeRulesSubtabId(id) {
    if (id === 'verdict' || id === 'roles' || id === 'engine') return id;
    return 'engine';
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
    const panels = Array.from(document.querySelectorAll('#tab-settings .rules-subpanel'));
    const motionApi = window.SWRM_MOTION;
    if (motionApi) {
      motionApi.swapSubpanels(panels, (p) => p.dataset.rulesSubtab === v, !!instant);
    } else {
      panels.forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.rulesSubtab === v);
      });
    }
  }

  function initRulesSubtabs() {
    const nav = document.getElementById('rules-subtabs');
    if (!nav || rulesSubtabsBound) return;
    rulesSubtabsBound = true;
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      btn.addEventListener('click', () => setRulesSubtab(btn.dataset.rulesSubtab));
    });
    let saved = 'engine';
    try { saved = sessionStorage.getItem(RULES_SUBTAB_KEY) || 'engine'; } catch (e) { /* ignore */ }
    setRulesSubtab(saved, true);
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
  const MONSTERS_SUBTAB_IDS = ['roster', 'teams', 'planner'];
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

    if (id === 'settings') {
      const rulesRoot = document.getElementById('tab-settings');
      if (rulesRoot) rulesRoot.scrollTop = 0;
    }

    if (id === 'dashboard' && typeof scheduleDashboardChartReplay === 'function') {
      scheduleDashboardChartReplay({ fromZero: true });
    }

    if (id === 'runetable') {
      if (typeof initTableKindTabs === 'function') initTableKindTabs();
      const kind = typeof readTableKind === 'function' ? readTableKind() : 'runes';
      if (kind === 'runes') {
        const { query } = splitMainHash();
        if (query) applyRuneTableQueryParams(new URLSearchParams(query));
        updateSortHeaderClasses();
        updateRuneTableFilterIndicators();
        applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
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

  // ===================== LANGUAGE =====================
  function loadFrTranslations() {
    if (TRANSLATIONS.fr) return Promise.resolve();
    if (window.SWRM_I18N_FR) {
      TRANSLATIONS.fr = { ...TRANSLATIONS.en, ...window.SWRM_I18N_FR };
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'js/core/i18n-fr.js';
      s.onload = () => {
        TRANSLATIONS.fr = {
          ...TRANSLATIONS.en,
          ...(window.SWRM_I18N_FR || {}),
        };
        resolve();
      };
      s.onerror = () => reject(new Error('Failed to load French translations'));
      document.head.appendChild(s);
    });
  }

  async function updateLanguage(lang) {
    if (lang === 'fr') await loadFrTranslations();
    currentLang = lang;
    localStorage.setItem(APP_LANG_KEY, lang);
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

    document.documentElement.lang = lang === 'ru' ? 'ru' : lang === 'fr' ? 'fr' : 'en';

    updateStageAdvisorLabels(t);

    const appLangSelectEl = document.getElementById('app-language');
    if (appLangSelectEl) appLangSelectEl.value = lang;
    
    // Update title
    document.title = t.title;
    const siteLogoLink = document.getElementById('site-logo-link');
    if (siteLogoLink) siteLogoLink.setAttribute('aria-label', t.title);
    
    const setMainNavTabLabel = (btn, text) => {
      if (!btn || text == null) return;
      const label = btn.querySelector('.tab__label');
      if (label) label.textContent = text;
      btn.setAttribute('title', text);
    };

    // Update tabs - safely check if elements exist
    setMainNavTabLabel(document.querySelector('[data-tab="runes"]'), t.dashboard);
    setMainNavTabLabel(document.querySelector('[data-tab="monsters"]'), t.monsters);
    const hubDash = document.getElementById('lbl-runes-hub-dashboard');
    if (hubDash) hubDash.textContent = t.runesHubDashboard || 'Dashboard';
    const hubTable = document.getElementById('lbl-runes-hub-runetable');
    if (hubTable) hubTable.textContent = t.runesHubRuneTable || 'Table';
    const hubRules = document.getElementById('lbl-runes-hub-settings');
    if (hubRules) hubRules.textContent = t.runesHubRuneRules || 'Rules';
    const hubRulesHint = document.getElementById('lbl-runes-hub-settings-hint');
    if (hubRulesHint) hubRulesHint.textContent = t.runesHubRulesExpertHint || '';
    const hubNav = document.getElementById('runes-hub-tabs');
    if (hubNav) hubNav.setAttribute('aria-label', t.dashboard || 'Runes');
    setMainNavTabLabel(document.querySelector('[data-tab="guide"]'), t.guide);
    setMainNavTabLabel(document.querySelector('[data-tab="changelog"]'), t.changelog);
    const guidePageTitle = document.getElementById('lbl-guide-page-title');
    if (guidePageTitle) guidePageTitle.textContent = t.guide;
    const guidePageLead = document.getElementById('lbl-guide-page-lead');
    if (guidePageLead) guidePageLead.textContent = t.guidePageLead || '';
    const subGuideStart = document.getElementById('lbl-guide-subtab-start');
    if (subGuideStart) subGuideStart.textContent = t.guideSubtabStart || '';
    const subGuideStartHint = document.getElementById('lbl-guide-subtab-start-hint');
    if (subGuideStartHint) subGuideStartHint.textContent = t.guideSubtabStartHint || '';
    const subGuideDash = document.getElementById('lbl-guide-subtab-dashboard');
    if (subGuideDash) subGuideDash.textContent = t.guideSubtabDashboard || '';
    const subGuideDashHint = document.getElementById('lbl-guide-subtab-dashboard-hint');
    if (subGuideDashHint) subGuideDashHint.textContent = t.guideSubtabDashboardHint || '';
    const subGuideProg = document.getElementById('lbl-guide-subtab-progression');
    if (subGuideProg) subGuideProg.textContent = t.guideSubtabProgression || '';
    const subGuideProgHint = document.getElementById('lbl-guide-subtab-progression-hint');
    if (subGuideProgHint) subGuideProgHint.textContent = t.guideSubtabProgressionHint || '';
    const subGuideTable = document.getElementById('lbl-guide-subtab-table');
    if (subGuideTable) subGuideTable.textContent = t.guideSubtabTable || '';
    const subGuideTableHint = document.getElementById('lbl-guide-subtab-table-hint');
    if (subGuideTableHint) subGuideTableHint.textContent = t.guideSubtabTableHint || '';
    const subGuideEval = document.getElementById('lbl-guide-subtab-evaluation');
    if (subGuideEval) subGuideEval.textContent = t.guideSubtabEvaluation || '';
    const subGuideEvalHint = document.getElementById('lbl-guide-subtab-evaluation-hint');
    if (subGuideEvalHint) subGuideEvalHint.textContent = t.guideSubtabEvaluationHint || '';
    const subGuideRules = document.getElementById('lbl-guide-subtab-rules');
    if (subGuideRules) subGuideRules.textContent = t.guideSubtabRules || '';
    const subGuideRulesHint = document.getElementById('lbl-guide-subtab-rules-hint');
    if (subGuideRulesHint) subGuideRulesHint.textContent = t.guideSubtabRulesHint || '';
    const subGuideTips = document.getElementById('lbl-guide-subtab-tips');
    if (subGuideTips) subGuideTips.textContent = t.guideSubtabTips || '';
    const subGuideTipsHint = document.getElementById('lbl-guide-subtab-tips-hint');
    if (subGuideTipsHint) subGuideTipsHint.textContent = t.guideSubtabTipsHint || '';
    const guideNav = document.getElementById('guide-subtabs');
    if (guideNav) guideNav.setAttribute('aria-label', t.guideSubtabsAria || 'Guide');
    const changelogPageTitle = document.getElementById('lbl-changelog-page-title');
    if (changelogPageTitle) changelogPageTitle.textContent = t.changelog;
    const changelogPageLead = document.getElementById('lbl-changelog-page-lead');
    if (changelogPageLead) changelogPageLead.textContent = t.changelogPageLead || '';
    const shippedLead = document.getElementById('lbl-changelog-shipped-lead');
    if (shippedLead) shippedLead.textContent = t.changelogShippedLead || '';
    const subShipped = document.getElementById('lbl-changelog-subtab-shipped');
    if (subShipped) subShipped.textContent = t.changelogSubtabShipped || 'Releases';
    const subRoadmap = document.getElementById('lbl-changelog-subtab-roadmap');
    if (subRoadmap) subRoadmap.textContent = t.changelogSubtabRoadmap || 'Roadmap';
    const chNav = document.getElementById('changelog-subtabs');
    if (chNav) chNav.setAttribute('aria-label', t.changelogSubtabsAria || 'Changelog');
    setMainNavTabLabel(document.querySelector('[data-tab="app-settings"]'), t.appSettings);

    const donateLbl = document.getElementById('lbl-header-donate');
    if (donateLbl) donateLbl.textContent = t.donateShort || 'Donate';
    const donateLink = document.getElementById('header-donate-link');
    if (donateLink) {
      donateLink.setAttribute('title', t.donateTitle || '');
      donateLink.setAttribute('aria-label', t.donateAria || t.donateShort || 'Donate');
    }

    const footDisc = document.getElementById('lbl-footer-disclaimer');
    if (footDisc) footDisc.textContent = t.footerDisclaimer || '';
    const footVerLbl = document.getElementById('lbl-footer-version');
    if (footVerLbl) footVerLbl.textContent = t.footerVersionLabel || 'Build';
    const footVer = document.getElementById('footer-app-version');
    if (footVer) footVer.textContent = (window.SWRM && window.SWRM.APP_VERSION) || '—';

    // Update header elements
    const uploadLabel = document.querySelector('label[for="json-upload"] span');
    if (uploadLabel) uploadLabel.textContent = t.loadJson;
    const settingsBtn = document.getElementById('open-app-settings');
    if (settingsBtn) settingsBtn.textContent = t.settings;

    const minLvlLbl = document.getElementById('dashboard-minlvl-label');
    if (minLvlLbl) minLvlLbl.textContent = t.minLvl || '';

    // Update stage options (keep selected game stage)
    const stageSelect = document.getElementById('stage-select');
    if (stageSelect) {
      const preserved =
        (['Early', 'Mid', 'Late'].includes(stage) ? stage : null) ||
        (['Early', 'Mid', 'Late'].includes(stageSelect.value) ? stageSelect.value : null) ||
        'Mid';
      stageSelect.innerHTML = `
      <option value="Early">${t.early}</option>
      <option value="Mid">${t.mid}</option>
      <option value="Late">${t.late}</option>`;
      stageSelect.value = preserved;
      stage = preserved;
      const mq = analyzeGameStage(allRunes);
      const rq = getRecommendedStage(parseFloat(mq.score), mq.stageMidMin, mq.stageLateMin);
      syncGameStageVisualClasses(stage, rq, !!(allRunes.length && mq.runeCount));
    }
    
    // Update upload prompt
    const uploadPrompt = document.getElementById('upload-prompt');
    if (uploadPrompt) {
      const titleEl = document.getElementById('upload-prompt-title');
      if (titleEl) titleEl.textContent = t.loadYourSWEX;
      const leadEl = document.getElementById('upload-prompt-lead');
      if (leadEl) leadEl.textContent = t.uploadPromptLead || t.uploadDescription;
      const dragHintEl = document.getElementById('upload-prompt-drag-hint');
      if (dragHintEl) dragHintEl.textContent = t.uploadPromptDragHint || '';
      const secEl = document.getElementById('upload-prompt-secondary');
      if (secEl) secEl.textContent = t.uploadPromptSecondary || '';
      const ctaEl = document.getElementById('upload-prompt-cta');
      if (ctaEl) ctaEl.textContent = t.chooseJsonFile;
      const clearBtn = document.getElementById('btn-clear-saved-runes');
      if (clearBtn) clearBtn.textContent = t.uploadClearAll || 'Clear all saved data';
      const hintEl = document.getElementById('upload-prompt-hint');
      if (hintEl) hintEl.textContent = t.privacyNote;
    }
    
    // Update dashboard cards
    updateDashboardLabels();
    if (processedRunes.length) {
      renderDashboard(getVisibleRunes());
    }

    // Update table elements
    updateTableLabels();
    refreshRoleFilterOptions();

    // Update settings
    updateSettingsLabels();
    if (processedRunes.length) {
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: runeTableShowAll });
    }
    renderChangelog();
    renderRoadmap();
    syncMonstersFilterLabels(t);
    renderMonstersPanel();
    applyDemoBannerTextFromTranslations();
    syncDemoBannerVisibility();
    if (typeof renderShareViewBanner === 'function') renderShareViewBanner();
    applySwrmDropVeilTranslations();
  }

  function updateDashboardLabels() {
    const t = TRANSLATIONS[currentLang];

    const setDashUniTabLabel = (id, text) => {
      const btn = document.getElementById(id);
      const lbl = btn && btn.querySelector('.rules-subtab__label');
      if (lbl) lbl.textContent = text || '';
    };
    setDashUniTabLabel('dash-unified-tab-verdict', t.dashboardDistVerdict);
    setDashUniTabLabel('dash-unified-tab-roles', t.dashboardDistRoles);
    setDashUniTabLabel('dash-unified-tab-sets', t.dashboardDistSets);
    setDashUniTabLabel('dash-unified-tab-slots', t.dashboardDistSlots);
    setDashUniTabLabel('dash-unified-tab-eff', t.dashboardDistEff);
    setDashUniTabLabel('dash-unified-tab-score', t.dashboardDistScore);
    const uniTabs = document.getElementById('dash-unified-tabs');
    const unifiedBlockTitle = document.getElementById('lbl-dash-unified-block-title');
    if (unifiedBlockTitle) unifiedBlockTitle.textContent = t.dashboardUnifiedBlockTitle || '';
    if (uniTabs) uniTabs.setAttribute('aria-label', t.dashboardUnifiedDistAria || '');

    const lblTopSpd = document.getElementById('lbl-top-spd-title');
    if (lblTopSpd) lblTopSpd.textContent = t.dashboardTopSpdTitle || '';

    const lblTopSpdLegCur = document.getElementById('lbl-top-spd-legend-cur');
    if (lblTopSpdLegCur) lblTopSpdLegCur.textContent = t.dashboardTopSpdRadarLegendCur || 'Current';
    const lblTopSpdLegPot = document.getElementById('lbl-top-spd-legend-pot');
    if (lblTopSpdLegPot) lblTopSpdLegPot.textContent = t.dashboardTopSpdRadarLegendPot || 'Potential';

    const lblTopSpdSort = document.getElementById('lbl-top-spd-sort');
    if (lblTopSpdSort) lblTopSpdSort.textContent = t.dashboardTopSpdSortAria || '';
    const btnTopSpdCur = document.getElementById('btn-top-spd-sort-cur');
    if (btnTopSpdCur) btnTopSpdCur.textContent = t.dashboardTopSpdSortCur || 'Current';
    const btnTopSpdPot = document.getElementById('btn-top-spd-sort-pot');
    if (btnTopSpdPot) btnTopSpdPot.textContent = t.dashboardTopSpdSortPot || 'Potential';
    syncTopSpdSortControls(t);

    const topSpdSetSelect = document.getElementById('top-spd-set-select');
    if (topSpdSetSelect) {
      topSpdSetSelect.setAttribute('aria-label', t.dashboardTopSpdSetAria || 'Rune set');
    }

    const chartHint = document.getElementById('lbl-dash-unified-chart-hint');
    if (chartHint) chartHint.textContent = t.dashboardVerdictStackHint || '';

    const slotShareTitle = document.getElementById('lbl-dash-slot-share-title');
    if (slotShareTitle) slotShareTitle.textContent = t.dashboardSlotShareTitle || '';

    const gk = document.getElementById('lbl-dash-group-keepers');
    if (gk) gk.textContent = t.dashboardGroupKeepers || '';
    const gq = document.getElementById('lbl-dash-group-queue');
    if (gq) gq.textContent = t.dashboardGroupQueue || '';
    const exp = document.getElementById('btn-dashboard-export-summary');
    if (exp) exp.textContent = t.dashboardExportSummary || 'Copy summary';
    const gr = document.getElementById('lbl-dashboard-grade-range');
    const glm = document.getElementById('lbl-dashboard-grade-min');
    const glx = document.getElementById('lbl-dashboard-grade-max');
    if (gr) gr.textContent = t.dashboardGradeRangeGroup || 'Grades';
    if (glm) glm.textContent = t.dashboardGradeRangeFrom || 'From';
    if (glx) glx.textContent = t.dashboardGradeRangeTo || 'To';

    syncDashboardGradeRangeSelects();
    applyStageAdvisorCollapsed(!readStageProgressionExpanded(), { instant: true });
  }

  function updateTableLabels() {
    const t = TRANSLATIONS[currentLang];
    
    // Update search and filters
    const searchBox = document.getElementById('search-box');
    if (searchBox) searchBox.placeholder = t.searchPlaceholder;
    const lblSearch = document.getElementById('lbl-search-box');
    if (lblSearch) lblSearch.textContent = t.tableToolbarSearchLabel || 'Search';
    const lblActions = document.getElementById('lbl-table-toolbar-actions');
    if (lblActions) lblActions.textContent = t.tableToolbarSectionActions || 'Actions';
    const lblDisplay = document.getElementById('lbl-table-toolbar-display');
    if (lblDisplay) lblDisplay.textContent = t.tableToolbarSectionDisplay || 'Display';
    const lblRuneMoreFilters = document.getElementById('lbl-rune-more-filters');
    if (lblRuneMoreFilters) lblRuneMoreFilters.textContent = t.runeTableMoreFilters || 'More Filters';
    const lblRuneDrawerTitle = document.getElementById('lbl-rune-filters-drawer-title');
    if (lblRuneDrawerTitle) lblRuneDrawerTitle.textContent = t.runeTableFiltersDrawerTitle || 'More filters';
    const lblRuneFilterClear = document.getElementById('rune-filter-clear-all');
    if (lblRuneFilterClear) lblRuneFilterClear.textContent = t.runeTableFilterClearAll || 'Clear all';
    const lblRuneFv = document.getElementById('lbl-rune-filter-verdict');
    if (lblRuneFv) lblRuneFv.textContent = t.runeFilterVerdict || 'Verdict';
    const lblRuneFr = document.getElementById('lbl-rune-filter-role');
    if (lblRuneFr) lblRuneFr.textContent = t.runeFilterRole || 'Role';
    const lblRuneFg = document.getElementById('lbl-rune-filter-grade');
    if (lblRuneFg) lblRuneFg.textContent = t.runeFilterGrade || 'Grade';
    const lblRuneFs = document.getElementById('lbl-rune-filter-set');
    if (lblRuneFs) lblRuneFs.textContent = t.runeFilterSet || 'Set';
    const lblRuneFsl = document.getElementById('lbl-rune-filter-slot');
    if (lblRuneFsl) lblRuneFsl.textContent = t.runeFilterSlot || 'Slot';
    const lblRuneFm = document.getElementById('lbl-rune-filter-main');
    if (lblRuneFm) lblRuneFm.textContent = t.runeFilterMain || 'Main stat';
    const lblTableKindRunes = document.getElementById('lbl-table-kind-runes');
    if (lblTableKindRunes) lblTableKindRunes.textContent = t.tableKindRunes || 'Runes';
    const lblTableKindArt = document.getElementById('lbl-table-kind-artifacts');
    if (lblTableKindArt) lblTableKindArt.textContent = t.tableKindArtifacts || 'Artifacts';
    const lblTableKindRel = document.getElementById('lbl-table-kind-relics');
    if (lblTableKindRel) lblTableKindRel.textContent = t.tableKindRelics || 'Relics';
    const bindTh = (id, key, fallback) => {
      const el = document.getElementById(id);
      if (el) el.textContent = t[key] || fallback;
    };
    bindTh('lbl-th-art-icon', 'thArtIcon', 'Icon');
    bindTh('lbl-th-art-grade', 'thArtGrade', 'Grade');
    bindTh('lbl-th-art-category', 'thArtCategory', 'Category');
    bindTh('lbl-th-art-main', 'monstersGearMain', 'Main');
    bindTh('lbl-th-art-subs', 'thArtSubs', 'Subs');
    bindTh('lbl-th-art-location', 'thArtLocation', 'Location');
    bindTh('lbl-th-rel-icon', 'thRelIcon', 'Icon');
    bindTh('lbl-th-rel-category', 'thRelCategory', 'Category');
    bindTh('lbl-th-rel-level', 'monstersGearLevel', 'Lvl');
    bindTh('lbl-th-rel-durability', 'thRelDurability', 'Durability');
    bindTh('lbl-th-rel-main', 'monstersGearMain', 'Main');
    bindTh('lbl-th-rel-sec', 'monstersGearSecondary', 'Secondary');
    bindTh('lbl-th-rel-wearers', 'thRelWearers', 'Equipped');
    const artSearch = document.getElementById('search-box-artifacts');
    if (artSearch) artSearch.placeholder = t.tableSearchArtifacts || 'Search artifacts…';
    const relSearch = document.getElementById('search-box-relics');
    if (relSearch) relSearch.placeholder = t.tableSearchRelics || 'Search relics…';
    const lblArtSearch = document.getElementById('lbl-search-box-artifacts');
    if (lblArtSearch) lblArtSearch.textContent = t.tableSearchArtifacts || 'Search artifacts';
    const lblRelSearch = document.getElementById('lbl-search-box-relics');
    if (lblRelSearch) lblRelSearch.textContent = t.tableSearchRelics || 'Search relics';
    const btnArtReset = document.getElementById('btn-artifact-reset-filters');
    if (btnArtReset) btnArtReset.textContent = t.tableResetFilters || 'Reset filters';
    const btnRelReset = document.getElementById('btn-relic-reset-filters');
    if (btnRelReset) btnRelReset.textContent = t.tableResetFilters || 'Reset filters';
    const lblArtMore = document.getElementById('lbl-artifact-more-filters');
    if (lblArtMore) lblArtMore.textContent = t.runeTableMoreFilters || 'More Filters';
    const lblRelMore = document.getElementById('lbl-relic-more-filters');
    if (lblRelMore) lblRelMore.textContent = t.runeTableMoreFilters || 'More Filters';
    const lblArtDrawer = document.getElementById('lbl-artifact-filters-drawer-title');
    if (lblArtDrawer) lblArtDrawer.textContent = t.artifactFiltersDrawerTitle || 'Artifact filters';
    const lblRelDrawer = document.getElementById('lbl-relic-filters-drawer-title');
    if (lblRelDrawer) lblRelDrawer.textContent = t.relicFiltersDrawerTitle || 'Relic filters';
    const lblArtFg = document.getElementById('lbl-artifact-filter-grade');
    if (lblArtFg) lblArtFg.textContent = t.artifactFilterGrade || 'Grade';
    const lblArtFc = document.getElementById('lbl-artifact-filter-category');
    if (lblArtFc) lblArtFc.textContent = t.artifactFilterCategory || 'Category';
    const lblArtFl = document.getElementById('lbl-artifact-filter-location');
    if (lblArtFl) lblArtFl.textContent = t.artifactFilterLocation || 'Location';
    const lblArtInv = document.getElementById('lbl-artifact-filter-inventory-opt');
    if (lblArtInv) lblArtInv.textContent = t.artifactFilterInventory || t.tableGearInventory || 'Inventory';
    const lblArtEq = document.getElementById('lbl-artifact-filter-equipped-opt');
    if (lblArtEq) lblArtEq.textContent = t.artifactFilterEquipped || 'Equipped';
    const lblRelFg = document.getElementById('lbl-relic-filter-grade');
    if (lblRelFg) lblRelFg.textContent = t.relicFilterGrade || 'Grade';
    const lblRelFc = document.getElementById('lbl-relic-filter-category');
    if (lblRelFc) lblRelFc.textContent = t.relicFilterCategory || 'Category';
    const lblThGrade = document.getElementById('lbl-th-grade');
    if (lblThGrade) lblThGrade.textContent = t.runeFilterGrade || 'Grade';
    const lblThSet = document.getElementById('lbl-th-set');
    if (lblThSet) lblThSet.textContent = t.runeFilterSet || 'Set';
    const lblThSlot = document.getElementById('lbl-th-slot');
    if (lblThSlot) lblThSlot.textContent = t.runeFilterSlot || 'Slot';
    const lblThMain = document.getElementById('lbl-th-main');
    if (lblThMain) lblThMain.textContent = t.monstersGearMain || 'Main';
    const lblThRole = document.getElementById('lbl-th-role');
    if (lblThRole) lblThRole.textContent = t.runeFilterRole || 'Role';
    const lblThVerdict = document.getElementById('lbl-th-verdict');
    if (lblThVerdict) lblThVerdict.textContent = t.runeFilterVerdict || 'Verdict';
    
    const filterVerdict = document.getElementById('filter-verdict');
    if (filterVerdict) {
      filterVerdict.innerHTML = `<option value="">${t.allVerdicts}</option>
        <option value="Keep">${t.keep}</option>
        <option value="Sell">${t.sell}</option>
        <option value="Grind">${t.grind}</option>
        <option value="Gem">${t.gem}</option>
        <option value="Finish">${t.finish}</option>
        <option value="Upgrade">${t.upgrade}</option>
        <option value="Reapp">${t.reapp}</option>`;
    }

    // filter-role is updated by refreshRoleFilterOptions to include custom roles
    refreshRoleFilterOptions();

    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) btnExport.textContent = t.exportTableCsv || 'Export CSV';
    const btnResetTbl = document.getElementById('btn-table-reset-filters');
    if (btnResetTbl) btnResetTbl.textContent = t.tableResetFilters || 'Reset filters';
    const lblAncientOnly = document.getElementById('lbl-toggle-ancient-only');
    if (lblAncientOnly) lblAncientOnly.textContent = t.tableAncientOnly || 'Ancient only';
    const lblTgt = document.getElementById('lbl-toggle-target');
    if (lblTgt) lblTgt.textContent = t.toggleTargetCol || 'Show Target';
    const thTgt = document.getElementById('target-col-header');
    if (thTgt) thTgt.textContent = t.targetHeading || 'Target';

    const filterGrade = document.getElementById('filter-grade');
    if (filterGrade) {
      filterGrade.innerHTML = `<option value="">${t.allGrades}</option>
        <option value="Legend">Legend</option>
        <option value="Hero">Hero</option>
        <option value="Rare">Rare</option>`;
    }
    const filterSet = document.getElementById('filter-set');
    if (filterSet) {
      const current = filterSet.value;
      const sets = Object.values(SET_NAMES || {});
      filterSet.innerHTML = `<option value="">All Sets</option>${sets.map(s => `<option value="${s}">${s}</option>`).join('')}`;
      if (sets.includes(current)) filterSet.value = current;
    }
    applyRuneTableEffHeader();
    if (typeof applyRuneTableScoreHeader === 'function') applyRuneTableScoreHeader();

    const filterSlot = document.getElementById('filter-slot');
    if (filterSlot) {
      const current = filterSlot.value;
      const slots = ['1', '2', '3', '4', '5', '6'];
      filterSlot.innerHTML = `<option value="">All Slots</option>${slots.map(s => `<option value="${s}">${s}</option>`).join('')}`;
      if (slots.includes(current)) filterSlot.value = current;
    }
    const filterMain = document.getElementById('filter-main');
    if (filterMain) {
      const current = filterMain.value;
    const mains = Object.values((window.SWRM.statNamesUiForLang || (() => STAT_NAMES))(currentLang) || STAT_NAMES);
      filterMain.innerHTML = `<option value="">All Mains</option>${mains.map(s => `<option value="${s}">${s}</option>`).join('')}`;
      if (mains.includes(current)) filterMain.value = current;
    }
    
    // Update table count text
    const tableCount = document.getElementById('table-count');
    if (tableCount) {
      const currentText = tableCount.textContent;
      const number = currentText.match(/\d+/);
      if (number) {
        tableCount.textContent = `${number[0]} ${t.runes}`;
      }
    }
  }

  function updateSettingsLabels() {
    const t = TRANSLATIONS[currentLang];
    const settingsTab = document.getElementById('tab-settings');
    if (!settingsTab) return;

    const rulesPageTitle = document.getElementById('lbl-rules-page-title');
    if (rulesPageTitle) rulesPageTitle.textContent = t.rulesPageTitle || 'Rune Rules';
    const rulesPageLead = document.getElementById('lbl-rules-page-lead');
    if (rulesPageLead) rulesPageLead.textContent = t.rulesPageLead || '';
    const rulesExpertTitle = document.getElementById('lbl-rules-expert-banner-title');
    if (rulesExpertTitle) rulesExpertTitle.textContent = t.rulesExpertBannerTitle || '';
    const rulesExpertText = document.getElementById('lbl-rules-expert-banner-text');
    if (rulesExpertText) rulesExpertText.textContent = t.rulesExpertBannerText || '';

    const lblPrevTitle = document.getElementById('lbl-rules-section-previews-title');
    if (lblPrevTitle) lblPrevTitle.textContent = t.rulesSectionPreviewsTitle || '';
    const lblPrevDesc = document.getElementById('lbl-rules-section-previews-desc');
    if (lblPrevDesc) lblPrevDesc.textContent = t.rulesSectionPreviewsDesc || '';

    const roleNavHdr = document.getElementById('lbl-role-nav-header');
    if (roleNavHdr) roleNavHdr.textContent = t.rolesNavTitle || 'Roles';

    const subNav = document.getElementById('rules-subtabs');
    if (subNav) subNav.setAttribute('aria-label', t.rulesSubtabsAria || 'Rune Rules sections');
    const setSubLbl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text || '';
    };
    setSubLbl('lbl-rules-subtab-engine', t.rulesSubtabEngine);
    setSubLbl('lbl-rules-subtab-engine-hint', t.rulesSubtabEngineDesc);
    setSubLbl('lbl-rules-subtab-verdict', t.rulesSubtabVerdict);
    setSubLbl('lbl-rules-subtab-verdict-hint', t.rulesSubtabVerdictDesc);
    setSubLbl('lbl-rules-subtab-roles', t.rulesSubtabRoles);
    setSubLbl('lbl-rules-subtab-roles-hint', t.rulesSubtabRolesDesc);

    setSubLbl('policy-simple-lead', t.rulesPolicySimpleLead);
    setSubLbl('policy-expert-lead', t.rulesPolicyExpertLead);
    const policyDashNote = document.getElementById('policy-simple-dashboard-note');
    if (policyDashNote) policyDashNote.textContent = t.rulesPolicySimpleDashboardNote || '';

    if (typeof window.syncPolicySimplePreview === 'function') window.syncPolicySimplePreview();

    const h3Const = settingsTab.querySelector('.constants-sheet-heading');
    if (h3Const) h3Const.textContent = t.constantsSheetTitle || '';
    const gemH = settingsTab.querySelector('.gem-meta-heading');
    if (gemH) gemH.textContent = t.gemMetaRules;
    const reappH = settingsTab.querySelector('.reapp-heading');
    if (reappH) reappH.textContent = t.reappCandidateRules;
    const roleH = settingsTab.querySelector('.role-filters-heading');
    if (roleH) roleH.textContent = t.rulesSectionRolesAside || t.roleFilters;

    const dConst = settingsTab.querySelector('.constants-sheet-desc');
    if (dConst) dConst.textContent = t.constantsSheetDesc || '';
    const godPvTitle = document.getElementById('lbl-god-preview-title');
    if (godPvTitle) godPvTitle.textContent = t.enginePreviewGod || 'God Roll';
    const hrPvTitle = document.getElementById('lbl-hr-preview-title');
    if (hrPvTitle) hrPvTitle.textContent = t.enginePreviewHr || 'High Roll';
    const duoPvTitle = document.getElementById('lbl-duo-preview-title');
    if (duoPvTitle) duoPvTitle.textContent = t.enginePreviewDuo || 'Duo Roll';
    const dg = settingsTab.querySelector('.gem-meta-desc');
    if (dg) dg.textContent = t.gemMetaRulesDesc;
    const gh = document.getElementById('gem-bad-flat-hint');
    if (gh) gh.textContent = t.gemBadFlatHint || '';
    const dre = settingsTab.querySelector('.reapp-rules-desc');
    if (dre) dre.textContent = t.reappDescription;
    const drf = settingsTab.querySelector('.role-filters-desc');
    if (drf) drf.textContent = t.configureRoleRules;

    const gb = document.getElementById('gem-bad-flat-label');
    if (gb) gb.textContent = t.gemBadFlatGem || '';

    // Update new role label (only text node, keep input)
    const newRoleRow = document.getElementById('new-role-name')?.closest('.settings-row');
    if (newRoleRow) {
      const newRoleLabel = newRoleRow.querySelector('label');
      if (newRoleLabel) {
        const textNode = newRoleLabel.childNodes[0];
        if (textNode) textNode.textContent = t.newRole + ' ';
      }
    }
    const addBtn = document.getElementById('btn-add-role');
    if (addBtn) addBtn.textContent = t.addRole;

    
    // Update reapp labels (only text nodes, keep inputs)
    const reappInputs = [
      { id: 'reapp-sets', text: t.allowedSets },
      { id: 'reapp-innate', text: t.innateStats },
      { id: 'reapp-main2', text: t.slot2Mains },
      { id: 'reapp-main4', text: t.slot4Mains },
      { id: 'reapp-main6', text: t.slot6Mains },
      { id: 'reapp-max-eff', text: t.maxEffReapp },
    ];
    reappInputs.forEach(({ id, text }) => {
      const input = document.getElementById(id);
      if (input) {
        const label = input.closest('.settings-row')?.querySelector('label');
        if (label) {
          const textNode = label.childNodes[0];
          if (textNode) textNode.textContent = text + ' ';
        }
      }
    });

    // Update dashboard cards
    updateDashboardLabels();
    const langSelect = document.getElementById('app-language');
    if (langSelect) langSelect.value = currentLang;
    const headerLangLbl = document.getElementById('lbl-header-language');
    if (headerLangLbl) headerLangLbl.textContent = t.language || 'Language';
    if (window.SWRM && typeof window.SWRM.syncHeaderLangMenu === 'function') {
      window.SWRM.syncHeaderLangMenu();
    }

    updateHeaderThemeA11y(t);
    const shareEquippedLbl = document.getElementById('lbl-share-equipped-only');
    if (shareEquippedLbl) shareEquippedLbl.textContent = t.shareEquippedOnly || '';
    const shareBtn = document.getElementById('share-profile-btn');
    if (shareBtn) shareBtn.textContent = t.shareProfileBtn || 'Share';
    if (typeof syncShareSplitLabels === 'function') syncShareSplitLabels();
    const moreFilters = document.getElementById('lbl-monsters-more-filters');
    if (moreFilters) moreFilters.textContent = t.monstersMoreFilters || 'More Filters';
    const monstersReset = document.getElementById('monsters-toolbar-reset-filters');
    if (monstersReset) monstersReset.textContent = t.tableResetFilters || 'Reset filters';
    const monstersExport = document.getElementById('btn-monsters-export-csv');
    if (monstersExport) monstersExport.textContent = t.exportTableCsv || 'Export CSV';
    const clearAll = document.getElementById('monsters-filter-clear-all');
    if (clearAll) clearAll.textContent = t.monstersFilterClearAll || 'Clear all';
    const bulkFav = document.getElementById('lbl-monsters-bulk-favorite');
    if (bulkFav) bulkFav.textContent = t.monstersBulkFavorite || '';
    const bulkFood = document.getElementById('lbl-monsters-bulk-food');
    if (bulkFood) bulkFood.textContent = t.monstersBulkFood || '';
    const bulkSt = document.getElementById('lbl-monsters-bulk-storage');
    if (bulkSt) bulkSt.textContent = t.monstersBulkStorage || '';
    const selAll = document.getElementById('monsters-select-all-visible');
    if (selAll) selAll.textContent = t.monstersSelectAll || 'Select all';
    const desel = document.getElementById('monsters-bulk-clear');
    if (desel) desel.textContent = t.monstersDeselectAll || 'Deselect all';
    const hubRoster = document.getElementById('lbl-monsters-hub-roster');
    if (hubRoster) hubRoster.textContent = t.monstersHubRoster || 'Roster';
    const hubTeams = document.getElementById('lbl-monsters-hub-teams');
    if (hubTeams) hubTeams.textContent = t.monstersHubTeams || 'Teams';
    const hubPlanner = document.getElementById('lbl-monsters-hub-planner');
    if (hubPlanner) hubPlanner.textContent = t.monstersHubPlanner || 'Skill plan';
    const spNat = document.getElementById('lbl-skill-planner-nat');
    if (spNat) spNat.textContent = t.skillPlannerNatFilter || 'Priority';
    const spNatAll = document.getElementById('lbl-skill-planner-nat-all');
    if (spNatAll) spNatAll.textContent = t.skillPlannerNatAll || 'All naturals';
    const spNat5 = document.getElementById('lbl-skill-planner-nat5');
    if (spNat5) spNat5.textContent = t.skillPlannerNat5 || 'Nat 5 only';
    const spNat4p = document.getElementById('lbl-skill-planner-nat4plus');
    if (spNat4p) spNat4p.textContent = t.skillPlannerNat4Plus || 'Nat 4+';
    const spNat4 = document.getElementById('lbl-skill-planner-nat4-only');
    if (spNat4) spNat4.textContent = t.skillPlannerNat4Only || 'Nat 4 only';
    const spNat3 = document.getElementById('lbl-skill-planner-nat3');
    if (spNat3) spNat3.textContent = t.skillPlannerNat3 || 'Nat 3 only';
    const spTabQueue = document.getElementById('lbl-skill-planner-tab-queue');
    if (spTabQueue) spTabQueue.textContent = t.skillPlannerTabQueue || 'Priority queue';
    const spTabStuck = document.getElementById('lbl-skill-planner-tab-stuck');
    if (spTabStuck) spTabStuck.textContent = t.skillPlannerTabStuck || 'CD −1 goals';
    const spExclude = document.getElementById('lbl-skill-planner-exclude-storage');
    if (spExclude) {
      const hiding = document.getElementById('skill-planner-exclude-storage')?.getAttribute('aria-pressed') === 'true';
      spExclude.textContent = hiding
        ? t.skillPlannerShowStorage || 'Include Storage'
        : t.skillPlannerHideStorage || 'Exclude Storage';
    }
    const skillNeedsOpt = document.getElementById('lbl-monsters-filter-skill-needs');
    if (skillNeedsOpt) skillNeedsOpt.textContent = t.monstersFilterSkillNeeds || 'Not maxed (skill-ups needed)';
    const skillAllOpt = document.getElementById('lbl-monsters-filter-skill-all');
    if (skillAllOpt) skillAllOpt.textContent = t.monstersFilterSkillAll || 'All skills';
    const skillMaxedOpt = document.getElementById('lbl-monsters-filter-skill-maxed');
    if (skillMaxedOpt) skillMaxedOpt.textContent = t.monstersFilterSkillMaxed || 'Max skills';
    const teamsSetsTitle = document.getElementById('lbl-teams-sets-title');
    if (teamsSetsTitle) teamsSetsTitle.textContent = t.teamsSetsTitle || '';
    const teamsSetName = document.getElementById('lbl-teams-set-name');
    if (teamsSetName) teamsSetName.textContent = t.teamsSetName || '';
    const teamsSetHint = document.getElementById('lbl-teams-set-hint');
    if (teamsSetHint) teamsSetHint.textContent = t.teamsSetHint || '';
    const teamsEditorTitle = document.getElementById('lbl-teams-editor-title');
    if (teamsEditorTitle) teamsEditorTitle.textContent = t.teamsEditorTitle || '';
    const teamsTeamName = document.getElementById('lbl-teams-team-name');
    if (teamsTeamName) teamsTeamName.textContent = t.teamsTeamName || '';
    const teamsLeader = document.getElementById('lbl-teams-leader');
    if (teamsLeader) teamsLeader.textContent = t.teamsLeader || '';
    const teamsSharePublic = document.getElementById('lbl-teams-share-public');
    if (teamsSharePublic) teamsSharePublic.textContent = t.teamsSharePublic || '';
    const teamsSaveTeam = document.getElementById('teams-save-team');
    if (teamsSaveTeam) teamsSaveTeam.textContent = t.teamsSaveTeam || '';

    // Update database slots title and description in app settings tab
    const dbSlotsTitle = document.getElementById('db-slots-title');
    if (dbSlotsTitle) dbSlotsTitle.textContent = t.dbSlotsTitle;
    
    const dbSlotsDesc = document.getElementById('db-slots-desc');
    if (dbSlotsDesc) dbSlotsDesc.textContent = t.dbSlotsDesc;

    if (document.getElementById('stat-constants-wrap')) {
      buildStatConstantsTable();
      refreshEnginePreviews();
    }

    /* Keep DB slot cards in sync with locale (otherwise only title/description update when language changes). */
    if (document.getElementById('db-slots-wrap')) {
      renderDbSlots();
    }
  }

  function closeHeaderNavMenu() {
    const row = document.querySelector('.header-row--nav');
    const toggle = document.getElementById('header-nav-toggle');
    if (row) row.classList.remove('is-nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  function initHeaderMobileNav() {
    const toggle = document.getElementById('header-nav-toggle');
    const row = document.querySelector('.header-row--nav');
    const panel = document.getElementById('main-tabs-panel');
    if (!toggle || !row || !panel) return;

    toggle.addEventListener('click', () => {
      const open = row.classList.toggle('is-nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    panel.querySelectorAll('.tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 720px)').matches) closeHeaderNavMenu();
      });
    });

    document.addEventListener('click', (e) => {
      if (!row.classList.contains('is-nav-open')) return;
      if (row.contains(e.target) || toggle.contains(e.target)) return;
      closeHeaderNavMenu();
    });

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 721px)').matches) closeHeaderNavMenu();
    });
  }

  function closeAllFiltersPopovers(exceptId) {
    document.querySelectorAll('.filters-popover').forEach((panel) => {
      if (exceptId && panel.id === exceptId) return;
      panel.hidden = true;
      panel.dataset.open = '0';
    });
    document.querySelectorAll('[data-filters-popover-btn]').forEach((btn) => {
      const panelId = btn.getAttribute('aria-controls');
      if (exceptId && panelId === exceptId) return;
      btn.setAttribute('aria-expanded', 'false');
      btn.closest('.filters-popover-host')?.classList.remove('is-open');
    });
  }

  function positionFiltersPopover(btn, panel) {
    if (!btn || !panel) return;
    const host = btn.closest('.filters-popover-host');
    if (host) {
      panel.style.position = '';
      panel.style.top = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.width = '';
      return;
    }
    const r = btn.getBoundingClientRect();
    const gap = 6;
    const maxW = Math.min(360, window.innerWidth - 16);
    let left = r.left;
    if (left + maxW > window.innerWidth - 8) left = window.innerWidth - maxW - 8;
    if (left < 8) left = 8;
    panel.style.position = 'fixed';
    panel.style.top = `${Math.round(r.bottom + gap)}px`;
    panel.style.left = `${Math.round(left)}px`;
    panel.style.right = 'auto';
    panel.style.width = `${Math.round(maxW)}px`;
  }

  function bindFiltersPopover(btnId, panelId, opts) {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    const onClose = opts && typeof opts.onClose === 'function' ? opts.onClose : null;

    btn.setAttribute('data-filters-popover-btn', '1');
    if (!btn.hasAttribute('aria-controls')) btn.setAttribute('aria-controls', panelId);

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = panel.hidden;
      closeAllFiltersPopovers(open ? panelId : null);
      if (open) {
        positionFiltersPopover(btn, panel);
        panel.hidden = false;
        panel.dataset.open = '1';
        btn.setAttribute('aria-expanded', 'true');
        btn.closest('.filters-popover-host')?.classList.add('is-open');
      }
    });

    panel.querySelectorAll('[data-filters-popover-close]').forEach((el) => {
      el.addEventListener('click', () => {
        panel.hidden = true;
        panel.dataset.open = '0';
        btn.setAttribute('aria-expanded', 'false');
        btn.closest('.filters-popover-host')?.classList.remove('is-open');
        if (onClose) onClose();
      });
    });

    panel.querySelectorAll('[data-filters-popover-done]').forEach((el) => {
      el.addEventListener('click', () => {
        panel.hidden = true;
        panel.dataset.open = '0';
        btn.setAttribute('aria-expanded', 'false');
        btn.closest('.filters-popover-host')?.classList.remove('is-open');
        if (onClose) onClose();
      });
    });
  }

  if (!window.__swrmFiltersPopoverDocBound) {
    window.__swrmFiltersPopoverDocBound = true;
    document.addEventListener('click', (e) => {
      if (e.target.closest('.filters-popover-host') || e.target.closest('.filters-popover')) return;
      document.querySelectorAll('.filters-popover[data-open="1"]').forEach((panel) => {
        const btn = document.querySelector(`[aria-controls="${panel.id}"]`);
        const onCloseAttr = panel.getAttribute('data-on-close');
        panel.hidden = true;
        panel.dataset.open = '0';
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.closest('.filters-popover-host')?.classList.remove('is-open');
        }
      });
    });
    window.addEventListener('resize', () => {
      document.querySelectorAll('.filters-popover[data-open="1"]').forEach((panel) => {
        const btnId = panel.getAttribute('data-anchor-btn');
        const btn = btnId ? document.getElementById(btnId) : document.querySelector(`[aria-controls="${panel.id}"]`);
        positionFiltersPopover(btn, panel);
      });
    });
  }

  // ===================== TABS =====================
  initHeaderMobileNav();

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      showMainTab(btn.dataset.tab, { writeHash: true });
    });
  });

  window.addEventListener('hashchange', () => {
    const id = mainTabIdFromHash();
    if (id) showMainTab(id);
    else showMainTab('runes');
  });

  window.addEventListener('popstate', () => {
    const id = mainTabIdFromHash() || 'runes';
    showMainTab(id);
  });

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
      if (['verdict', 'roles', 'sets', 'slots', 'eff', 'score'].includes(v)) return v;
    } catch (e) { /* ignore */ }
    return 'verdict';
  }

  function syncDashboardUnifiedTabButtons(active) {
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff', 'score'];
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
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff', 'score'];
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
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff', 'score'];
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
        const w = ['verdict', 'roles', 'sets', 'slots', 'eff', 'score'].includes(raw) ? raw : 'verdict';
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

  const SWRM_NS = window.SWRM || (window.SWRM = {});
  let runeWorker = null;
  let workerFailed = false;
  let pendingId = 0;
  const handlers = new Map();

  function workerUrl() {
    try {
      return new URL('js/workers/rune-processor.worker.js', window.location.href).href;
    } catch (e) {
      return 'js/workers/rune-processor.worker.js';
    }
  }

  function getRuneWorker() {
    if (workerFailed || typeof Worker === 'undefined') return null;
    if (runeWorker) return runeWorker;
    try {
      runeWorker = new Worker(workerUrl());
      runeWorker.onmessage = ({ data }) => {
        const h = handlers.get(data.requestId);
        if (!h) return;
        handlers.delete(data.requestId);
        if (data.error) h.reject(new Error(data.error));
        else h.resolve(data.result);
      };
      runeWorker.onerror = () => {
        workerFailed = true;
        for (const [, h] of handlers) {
          h.reject(new Error('Rune worker failed'));
        }
        handlers.clear();
      };
    } catch (e) {
      workerFailed = true;
      return null;
    }
    return runeWorker;
  }

  function processRunesAsync(runes, stage, settings) {
    const sync = () =>
      typeof processAll === 'function'
        ? processAll(runes, stage, settings)
        : SWRM_NS.processAll(runes, stage, settings);

    const w = getRuneWorker();
    if (!w) return Promise.resolve(sync());

    return new Promise((resolve, reject) => {
      const requestId = ++pendingId;
      handlers.set(requestId, { resolve, reject });
      try {
        w.postMessage({ runes, stage, settings, requestId });
      } catch (e) {
        handlers.delete(requestId);
        reject(e);
      }
    }).catch((err) => {
      console.warn('processRunesAsync: worker unavailable, using main thread', err);
      return sync();
    });
  }

  SWRM_NS.processRunesAsync = processRunesAsync;

  // ===================== FILE UPLOAD =====================
  // Initial SWEX load (file picker + drag-and-drop on #upload-prompt): see loadSwexJsonFromFile below.

  // Close upload prompt overlay (load later via App Settings → slot Upload, or refresh to see prompt again)
  document.getElementById('close-upload-prompt')?.addEventListener('click', () => {
    document.getElementById('upload-prompt').classList.add('hidden');
  });

  // Clear saved runes button
  document.getElementById('btn-clear-saved-runes')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all saved runes? This will remove the currently loaded runes from browser storage.')) return;
    resetDemoAndRealPersistenceFlags();
    clearLocalStorageRuneBackup();
    try {
      await clearAllIndexedDbRunePayloads();
    } catch (err) {
      console.warn('IndexedDB clear:', err);
    }
    saveDbSlots(defaultEmptyDbSlotsMeta());
    uiEmptyRuneApplicationState();
    renderDbSlots();
    console.log('Cleared saved runes from browser storage');
    const demoOk = await installEmbeddedDemoDataset();
    if (!demoOk) uiShowUploadPrompt();
  });

  async function reprocess() {
    const settings = window.SWRM.settings;
    if (typeof window.SWRM.processRunesAsync === 'function') {
      processedRunes = await window.SWRM.processRunesAsync(allRunes, stage, settings);
    } else {
      processedRunes = processAll(allRunes, stage, settings);
    }
    const visible = getVisibleRunes();
    renderDashboard(visible, { animateCharts: true });
    renderTable(visible);
    renderMonstersPanel();
  }

  const LS_USING_DEMO = 'swrm_using_demo_dataset_v1';
  const LS_USER_LOADED_REAL = 'swrm_user_loaded_real_swex_v1';
  const SS_DEMO_BANNER_DISMISS = 'swrm_demo_banner_dismissed_session';
  /** IndexedDB key for embedded demo — never shown as Database Slot 1. */
  const DEMO_IDB_KEY = '__swrm_embedded_demo__';

  function slotNameLooksLikeDemo(name) {
    const n = String(name || '').trim().toLowerCase();
    return n === 'demo' || n.startsWith('demo ') || n.includes('(demo)');
  }

  function isUsingDemoDataset() {
    try {
      return localStorage.getItem(LS_USING_DEMO) === '1';
    } catch (e) {
      return false;
    }
  }

  async function purgeDemoStorage() {
    markUsingDemoDataset(false);
    try {
      await deleteSlotData(DEMO_IDB_KEY);
    } catch (e) {
      console.warn('purgeDemoStorage', e);
    }
  }

  /** Remove legacy demo rows from user-facing database slots. */
  async function scrubDemoFromUserSlots() {
    const slots = loadDbSlots();
    let dirty = false;
    for (const s of slots) {
      if (!slotNameLooksLikeDemo(s.name)) continue;
      Object.assign(
        s,
        normalizeDbSlot({ id: s.id, name: '', uploadedAt: '', active: s.active }),
      );
      dirty = true;
      try {
        await deleteSlotDataRobust(s.id);
      } catch (e) {
        console.warn('scrubDemoFromUserSlots', s.id, e);
      }
    }
    if (dirty) saveDbSlots(slots);
  }

  async function loadDemoDatasetInMemory(jsonText, jsonObj, label) {
    allRunes = parseSWEX(jsonObj);
    rebuildUnitsFromSwex(jsonObj);
    reprocess();
    try {
      await saveSlotData(DEMO_IDB_KEY, jsonText);
    } catch (e) {
      console.warn('Could not persist embedded demo to IndexedDB:', e);
    }
    if (!userHasLoadedRealExport()) {
      saveDbSlots(defaultEmptyDbSlotsMeta());
    }
    markUsingDemoDataset(true);
  }

  async function restoreEmbeddedDemoFromStorage() {
    try {
      const jsonText = await loadSlotData(DEMO_IDB_KEY);
      if (!jsonText) return false;
      const json = JSON.parse(jsonText);
      const runesProbe = parseSWEX(json);
      if (!runesProbe.length) return false;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
      const label = t.demoDatasetSlotLabel || 'Demo';
      await loadDemoDatasetInMemory(jsonText, json, label);
      if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
      uiAfterSuccessfulRuneRestore({ name: label }, { keepTab: true });
      applyDemoBannerTextFromTranslations();
      syncDemoBannerVisibility();
      if (typeof renderTeamsPanel === 'function') renderTeamsPanel();
      return true;
    } catch (e) {
      console.warn('restoreEmbeddedDemoFromStorage failed:', e);
      return false;
    }
  }

  function userHasLoadedRealExport() {
    try {
      return localStorage.getItem(LS_USER_LOADED_REAL) === '1';
    } catch (e) {
      return false;
    }
  }

  function markUsingDemoDataset(on) {
    try {
      if (on) localStorage.setItem(LS_USING_DEMO, '1');
      else localStorage.removeItem(LS_USING_DEMO);
    } catch (e) { /* ignore */ }
  }

  function markUserLoadedRealExport() {
    try {
      localStorage.setItem(LS_USER_LOADED_REAL, '1');
      markUsingDemoDataset(false);
    } catch (e) { /* ignore */ }
    try {
      sessionStorage.removeItem(SS_DEMO_BANNER_DISMISS);
    } catch (e2) { /* ignore */ }
  }

  function resetDemoAndRealPersistenceFlags() {
    try {
      localStorage.removeItem(LS_USING_DEMO);
      localStorage.removeItem(LS_USER_LOADED_REAL);
      sessionStorage.removeItem(SS_DEMO_BANNER_DISMISS);
    } catch (e) { /* ignore */ }
  }

  function applyDemoBannerTextFromTranslations() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
    const aside = document.getElementById('demo-dataset-banner');
    if (!aside) return;
    const badge = aside.querySelector('.demo-dataset-banner__badge');
    if (badge) badge.textContent = t.demoBannerBadge || '';
    const txt = aside.querySelector('.demo-dataset-banner__text');
    if (txt) txt.textContent = t.demoBannerText || '';
    const uploadBtn = document.getElementById('demo-banner-upload-btn');
    if (uploadBtn) uploadBtn.textContent = t.demoBannerUpload || 'Upload JSON';
    const dismissBtn = document.getElementById('demo-banner-dismiss');
    if (dismissBtn) dismissBtn.setAttribute('aria-label', t.demoBannerDismissAria || '');
  }

  function applySwrmDropVeilTranslations() {
    const root = document.getElementById('swrm-drop-veil');
    if (!root) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
    const title = root.querySelector('.swrm-drop-veil__title');
    const hint = root.querySelector('.swrm-drop-veil__hint');
    if (title) title.textContent = t.dragDropVeilTitle || '';
    if (hint) hint.textContent = t.dragDropVeilHint || '';
    const aria = String(t.dragDropVeilAria || '').trim();
    if (aria) root.setAttribute('aria-label', aria);
    else root.removeAttribute('aria-label');
  }

  /** When upload overlay hidden: page-wide SWEX drop + veil while dragging .json onto the window. */
  let swrmDropVeilDragging = false;

  function hideSwrmDropVeilUi() {
    swrmDropVeilDragging = false;
    const v = document.getElementById('swrm-drop-veil');
    if (v) {
      v.dataset.active = '0';
      v.setAttribute('hidden', '');
      v.classList.remove('is-active');
    }
    document.body.classList.remove('swrm-drop-veil-open');
  }

  function showSwrmDropVeilUiFromDrag() {
    if (swrmDropVeilDragging) return;
    swrmDropVeilDragging = true;
    applySwrmDropVeilTranslations();
    const v = document.getElementById('swrm-drop-veil');
    if (!v) return;
    v.dataset.active = '1';
    v.removeAttribute('hidden');
    v.classList.add('is-active');
    document.body.classList.add('swrm-drop-veil-open');
  }

  function dataTransferLooksLikeNativeFiles(dt) {
    return dt && dt.types && Array.from(dt.types).includes('Files');
  }

  /** @param {(s: DragEvent)=>void} fn */
  function guardedUploadOverlayBypass(fn, e) {
    const overlay = document.getElementById('upload-prompt');
    if (overlay && !overlay.classList.contains('hidden')) {
      hideSwrmDropVeilUi();
      return;
    }
    fn(e);
  }

  function syncDemoBannerVisibility() {
    const aside = document.getElementById('demo-dataset-banner');
    if (!aside) return;
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) {
      aside.setAttribute('hidden', '');
      aside.setAttribute('aria-hidden', 'true');
      return;
    }
    let usingDemo = false;
    try {
      usingDemo = localStorage.getItem(LS_USING_DEMO) === '1';
    } catch (e) { /* ignore */ }
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(SS_DEMO_BANNER_DISMISS) === '1';
    } catch (e2) { /* ignore */ }
    const show =
      Boolean(usingDemo && allRunes.length && !userHasLoadedRealExport() && !dismissed);
    if (show) aside.removeAttribute('hidden');
    else aside.setAttribute('hidden', '');
    aside.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  /**
   * Save SWEX JSON + slot summaries (same path as loading from disk into Data 1).
   * @param {string} jsonText
   * @param {string} displayNameForSlot
   * @param {object} jsonObj
   */
  async function persistSwexPayloadToSlots(jsonText, displayNameForSlot, jsonObj) {
    allRunes = parseSWEX(jsonObj);
    rebuildUnitsFromSwex(jsonObj);
    reprocess();

    const fileSizeKB = Math.round(jsonText.length / 1024);
    const maxLocalStorageSize = 4 * 1024;

    if (fileSizeKB <= maxLocalStorageSize) {
      localStorage.setItem('loadedRunes', jsonText);
      localStorage.setItem('loadedRunesName', displayNameForSlot);
      localStorage.setItem('loadedRunesDate', new Date().toISOString());
      localStorage.setItem('loadedRunesSize', fileSizeKB.toString());
    } else {
      await saveSlotData('current-runes', jsonText);
      localStorage.setItem('loadedRunesName', displayNameForSlot);
      localStorage.setItem('loadedRunesDate', new Date().toISOString());
      localStorage.setItem('loadedRunesSize', fileSizeKB.toString());
      localStorage.setItem('loadedRunesStorage', 'indexeddb');
    }

    const slots = loadDbSlots();
    const targetSlot = slots.find(s => s.id === 1) || slots[0];
    applySlotSummaryFromJson(targetSlot, displayNameForSlot, jsonObj);
    targetSlot.active = true;
    slots.forEach((s) => {
      if (s.id !== targetSlot.id) s.active = false;
    });
    saveDbSlots(slots);
    await saveSlotData(targetSlot.id, jsonText);
  }

  /**
   * Fetch data/demo.json, validate, persist like a real load, mark demo mode.
   * @param {{ keepTab?: boolean }} [options]
   */
  async function installEmbeddedDemoDataset(options = {}) {
    let jsonText;
    try {
      const demoPaths = ['data/demo.json'];
      let lastErr = null;
      for (const rel of demoPaths) {
        try {
          const res = await fetch(new URL(rel, window.location.href));
          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status} (${rel})`);
            continue;
          }
          jsonText = await res.text();
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
      if (!jsonText) throw new Error('demo.json not found');
    } catch (e) {
      console.warn('Embedded demo fetch failed:', e);
      return false;
    }
    let json;
    try {
      json = JSON.parse(jsonText);
    } catch (e) {
      console.warn('Embedded demo JSON parse failed:', e);
      return false;
    }
    try {
      const runesProbe = parseSWEX(json);
      if (!runesProbe.length) {
        console.warn('Embedded demo: parseSWEX returned no runes');
        return false;
      }
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en || {};
      const label = t.demoDatasetSlotLabel || 'Demo';
      await loadDemoDatasetInMemory(jsonText, json, label);
      if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
      uiAfterSuccessfulRuneRestore({ name: label }, { keepTab: options.keepTab === true });
      applyDemoBannerTextFromTranslations();
      syncDemoBannerVisibility();
      if (typeof renderTeamsPanel === 'function') renderTeamsPanel();
      return true;
    } catch (e) {
      console.warn('Embedded demo persist/load failed:', e);
      return false;
    }
  }

  function readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error('Read failed'));
      reader.readAsText(file);
    });
  }

  /** First-time SWEX JSON from disk → Data 1 (same pipeline as #json-upload). */
  async function loadSwexJsonFromFile(file) {
    if (!file) return;
    let jsonText;
    try {
      jsonText = await readFileAsText(file);
    } catch (err) {
      alert(`Could not read file: ${err && err.message ? err.message : String(err)}`);
      return;
    }
    try {
      const json = JSON.parse(jsonText);
      const fileSizeKB = Math.round(jsonText.length / 1024);
      const maxLocalStorageSize = 4 * 1024;
      try {
        await persistSwexPayloadToSlots(jsonText, file.name, json);
      } catch (err) {
        if (fileSizeKB > maxLocalStorageSize) {
          alert(`Failed to save large file (${fileSizeKB}KB): ${err.message}`);
          return;
        }
        throw err;
      }
      if (fileSizeKB <= maxLocalStorageSize) {
        console.log(`Saved ${file.name} (${fileSizeKB}KB) to localStorage`);
      } else {
        console.log(`Saved ${file.name} (${fileSizeKB}KB) to IndexedDB`);
      }
      markUserLoadedRealExport();
      await purgeDemoStorage();
      await scrubDemoFromUserSlots();
      if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
      else if (typeof removeDemoTeams === 'function') removeDemoTeams();
      syncDemoBannerVisibility();
      document.getElementById('upload-prompt').classList.add('hidden');
      showMainTab('dashboard', { writeHash: true });
    } catch (err) {
      alert('Failed to parse JSON: ' + err.message);
    }
  }

  function initUploadPromptDragDrop() {
    const overlay = document.getElementById('upload-prompt');
    if (!overlay || overlay.dataset.swrmDragInit === '1') return;
    overlay.dataset.swrmDragInit = '1';

    overlay.addEventListener('dragenter', (e) => {
      if (overlay.classList.contains('hidden')) return;
      e.preventDefault();
      overlay.classList.add('is-dragover');
    });

    overlay.addEventListener('dragover', (e) => {
      if (overlay.classList.contains('hidden')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    overlay.addEventListener('dragleave', (e) => {
      const rt = e.relatedTarget;
      if (rt && overlay.contains(rt)) return;
      overlay.classList.remove('is-dragover');
    });

    overlay.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.remove('is-dragover');
      if (overlay.classList.contains('hidden')) return;
      const files = e.dataTransfer && e.dataTransfer.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (files.length > 1) {
        const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        showSwrmToast(tloc.uploadDropMultipleHint || 'Using the first file only.', {
          type: 'info',
          duration: 4200,
        });
      }
      await loadSwexJsonFromFile(file);
    });
  }

  /** When the fullscreen upload overlay is hidden, users can still drop a .json onto the page (e.g. demo mode). */
  function initSiteWideSwexDragDrop() {
    if (document.body.dataset.swrmSiteDropInit === '1') return;
    document.body.dataset.swrmSiteDropInit = '1';

    document.addEventListener(
      'dragover',
      (e) => {
        guardedUploadOverlayBypass(() => {
          const dt = e.dataTransfer;
          if (!dataTransferLooksLikeNativeFiles(dt)) return;
          e.preventDefault();
          dt.dropEffect = 'copy';
          showSwrmDropVeilUiFromDrag();
        }, e);
      },
      true,
    );

    document.addEventListener('dragend', () => hideSwrmDropVeilUi(), true);

    window.addEventListener('blur', () => hideSwrmDropVeilUi());

    document.addEventListener(
      'drop',
      async (e) => {
        guardedUploadOverlayBypass(async () => {
          hideSwrmDropVeilUi();
          const files = e.dataTransfer && e.dataTransfer.files;
          if (!files || files.length === 0) return;
          e.preventDefault();
          const file = files[0];
          const nameOk = /\.json$/i.test(file.name || '');
          const typeOk = (file.type || '').toLowerCase().includes('json');
          if (!(nameOk || typeOk)) return;
          if (files.length > 1) {
            const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
            showSwrmToast(tloc.uploadDropMultipleHint || 'Using the first file only.', {
              type: 'info',
              duration: 4200,
            });
          }
          await loadSwexJsonFromFile(file);
        }, e);
      },
      true,
    );
  }

  document.getElementById('json-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await loadSwexJsonFromFile(file);
    e.target.value = '';
  });
  initUploadPromptDragDrop();
  initSiteWideSwexDragDrop();

  /** Parse stored SWEX JSON (string or object) and populate allRunes. */
  function tryHydrateRunesFromJsonText(raw) {
    if (raw == null) return false;
    if (typeof raw === 'string' && raw.trim() === '') return false;
    let obj;
    try {
      obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error('Stored data is not valid JSON:', e);
      return false;
    }
    if (!obj || typeof obj !== 'object') return false;
    const runes = parseSWEX(obj);
    if (!runes.length) return false;
    allRunes = runes;
    rebuildUnitsFromSwex(obj);
    reprocess();
    return true;
  }

  function rebuildUnitsFromSwex(json) {
    activeSwexJson = json && typeof json === 'object' ? json : null;
    if (!activeSwexJson || typeof parseUnits !== 'function') {
      allUnits = [];
      return;
    }
    const runeById = new Map();
    for (const r of allRunes) {
      if (r && r.id != null) runeById.set(Number(r.id), r);
    }
    allUnits = parseUnits(activeSwexJson, { sixStarOnly: false, runeById });
    if (window.SWRM && typeof window.SWRM.parseAccountGear === 'function') {
      const bag = window.SWRM.parseAccountGear(activeSwexJson);
      window.SWRM_ACCOUNT_GEAR = bag;
      allArtifacts = bag.artifacts || [];
      allRelics = bag.relics || [];
    } else {
      window.SWRM_ACCOUNT_GEAR = null;
      allArtifacts = [];
      allRelics = [];
    }
    if (typeof onGearDataHydrated === 'function') onGearDataHydrated();
    if (typeof refreshAccountTotemFromSwex === 'function') {
      refreshAccountTotemFromSwex(activeSwexJson);
    } else if (window.SWRM && typeof window.SWRM.refreshAccountTotemFromSwex === 'function') {
      window.SWRM.refreshAccountTotemFromSwex(activeSwexJson);
    } else if (window.SWRM) {
      window.SWRM.accountTotemSpdPct = 0;
      window.SWRM.accountTotemLevel = 0;
    }
  }

  /**
   * @param {object} [meta]
   * @param {{ keepTab?: boolean }} [options] if keepTab, do not switch to Dashboard (e.g. user is in App Settings)
   */
  function uiAfterSuccessfulRuneRestore(meta, options = {}) {
    const keepTab = options.keepTab === true;
    document.getElementById('upload-prompt').classList.add('hidden');
    if (!keepTab) {
      const fromHash = mainTabIdFromHash();
      if (fromHash) {
        showMainTab(fromHash);
      } else {
        showMainTab('dashboard', { writeHash: true });
      }
    }
    if (meta && meta.name) {
      console.log(`Auto-loaded runes from ${meta.name}${meta.id != null ? ` (Data ${meta.id})` : ''}`);
    }
    if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
    syncDemoBannerVisibility();
    if (typeof renderTeamsPanel === 'function') void renderTeamsPanel();
  }

  function uiShowUploadPrompt() {
    document.getElementById('upload-prompt').classList.remove('hidden');
  }

  function clearLocalStorageRuneBackup() {
    localStorage.removeItem('loadedRunes');
    localStorage.removeItem('loadedRunesName');
    localStorage.removeItem('loadedRunesDate');
    localStorage.removeItem('loadedRunesStorage');
    localStorage.removeItem('loadedRunesSize');
  }

  /**
   * No runes in memory; reset charts/tables.
   * Default: Guide tab + upload overlay. With keepTab: stay on current tab, no overlay (e.g. slot delete from Settings).
   */
  function uiEmptyRuneApplicationState(options = {}) {
    const keepTab = options.keepTab === true;
    allRunes = [];
    allUnits = [];
    activeSwexJson = null;
    if (window.SWRM) {
      window.SWRM.accountTotemSpdPct = 0;
      window.SWRM.accountTotemLevel = 0;
    }
    processedRunes = [];
    if (!keepTab) {
      showMainTab('guide', { writeHash: true });
      document.getElementById('upload-prompt').classList.remove('hidden');
    } else {
      document.getElementById('upload-prompt').classList.add('hidden');
    }
    const accCt = document.getElementById('dashboard-account-run-count');
    if (accCt) accCt.textContent = '\u2014';
    document.getElementById('rune-tbody').innerHTML = '';
    renderDashboard([]);
    renderTable([]);
    renderMonstersPanel();
  }

  function normalizeDbSlot(raw) {
    const id = Number(raw.id);
    return {
      id: Number.isFinite(id) ? id : 0,
      name: raw.name != null ? String(raw.name) : '',
      uploadedAt: raw.uploadedAt != null ? String(raw.uploadedAt) : '',
      active: !!raw.active,
      wizardName: raw.wizardName != null ? String(raw.wizardName) : '',
      wizardLevel: raw.wizardLevel != null && raw.wizardLevel !== '' && Number.isFinite(Number(raw.wizardLevel))
        ? Number(raw.wizardLevel) : null,
      wizardId: raw.wizardId != null ? String(raw.wizardId) : '',
      monsterCount: raw.monsterCount != null && Number.isFinite(Number(raw.monsterCount))
        ? Number(raw.monsterCount) : null,
      inventoryRuneCount: raw.inventoryRuneCount != null && Number.isFinite(Number(raw.inventoryRuneCount))
        ? Number(raw.inventoryRuneCount) : null,
      runeCount: (() => {
        if (raw.runeCount != null && Number.isFinite(Number(raw.runeCount))) return Number(raw.runeCount);
        if (raw.heroRuneCount != null && Number.isFinite(Number(raw.heroRuneCount))) return Number(raw.heroRuneCount);
        return null;
      })(),
    };
  }

  function defaultEmptyDbSlotsMeta() {
    return Array.from({ length: 4 }, (_, i) =>
      normalizeDbSlot({ id: i + 1, name: '', uploadedAt: '', active: i === 0 }));
  }

  function applySlotSummaryFromJson(slot, displayName, jsonObj) {
    slot.name = displayName;
    slot.uploadedAt = new Date().toLocaleString();
    const sum = extractSwexSummary(jsonObj);
    if (sum) {
      slot.wizardName = sum.wizardName || '';
      slot.wizardLevel = sum.wizardLevel;
      slot.wizardId = sum.wizardId || '';
      slot.monsterCount = sum.monsterCount;
      slot.inventoryRuneCount = sum.inventoryRuneCount;
    } else {
      slot.wizardName = '';
      slot.wizardLevel = null;
      slot.wizardId = '';
      slot.monsterCount = null;
      slot.inventoryRuneCount = null;
    }
    slot.runeCount = countAllSwexRunes(jsonObj);
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSlotSummaryLine(slot, t) {
    if (!slot.name) return '';
    const parts = [];
    if (slot.wizardName) parts.push(escapeHtml(slot.wizardName));
    if (slot.wizardLevel != null) {
      parts.push(`${escapeHtml(t.lvAbbr || 'Lv.')}${escapeHtml(slot.wizardLevel)}`);
    }
    if (slot.runeCount != null) {
      parts.push(`${escapeHtml(String(slot.runeCount))}\u00A0${escapeHtml(t.runesWord || t.runesHeroPlus || 'runes')}`);
    }
    if (slot.monsterCount != null) {
      parts.push(`${escapeHtml(String(slot.monsterCount))}\u00A0${escapeHtml(t.monsShort || 'mons')}`);
    }
    if (!parts.length && slot.wizardId) {
      parts.push(`ID\u00A0${escapeHtml(slot.wizardId)}`);
    }
    if (!parts.length) return '';
    return `<div class="db-slot-summary">${parts.join(' · ')}</div>`;
  }

  /**
   * In-app toast (styled panel, bottom-right). Replaces browser alert for non-blocking notices.
   * @param {string} message
   * @param {{ type?: 'success'|'info'|'error', duration?: number }} [options] duration ms; 0 = no auto-dismiss
   */
  function showToast(message, typeOrOptions) {
    const opts =
      typeof typeOrOptions === 'string'
        ? { type: typeOrOptions }
        : typeOrOptions && typeof typeOrOptions === 'object'
          ? typeOrOptions
          : {};
    showSwrmToast(message, opts);
  }

  function showSwrmToast(message, options = {}) {
    const type = options.type || 'info';
    const duration = options.duration !== undefined ? options.duration : 5200;
    const host = document.getElementById('swrm-toast-host');
    if (!host || !message) return;

    const icons = { success: '\u2713', info: '\u25C6', error: '\u0021' };
    const el = document.createElement('div');
    el.className = `swrm-toast swrm-toast--${type}`;
    el.setAttribute('role', 'status');

    const iconEl = document.createElement('span');
    iconEl.className = 'swrm-toast-icon';
    iconEl.textContent = icons[type] || icons.info;

    const msgEl = document.createElement('span');
    msgEl.className = 'swrm-toast-msg';
    msgEl.textContent = message;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'swrm-toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '\u00D7';

    el.append(iconEl, msgEl, closeBtn);
    host.appendChild(el);

    let hideTimer = null;
    const dismiss = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      const motionApi = window.SWRM_MOTION;
      if (motionApi && motionApi.toastOut(el, () => el.remove())) return;
      el.classList.remove('swrm-toast--in');
      el.classList.add('swrm-toast--out');
      setTimeout(() => el.remove(), 320);
    };

    closeBtn.addEventListener('click', dismiss);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const motionApi = window.SWRM_MOTION;
        if (!motionApi || !motionApi.toastIn(el)) el.classList.add('swrm-toast--in');
      });
    });
    if (duration > 0) hideTimer = setTimeout(dismiss, duration);
  }

  const SWRM_FLOAT_TIP_SHOW_MS = 0;
  const SWRM_FLOAT_TIP_HIDE_MS = 0;
  let swrmFloatTipEl = null;
  let swrmFloatTipShowTimer = null;
  let swrmFloatTipHideTimer = null;
  let swrmFloatTipAnchor = null;

  function ensureSwrmFloatTipEl() {
    if (swrmFloatTipEl) return swrmFloatTipEl;
    const el = document.createElement('d' + 'iv');
    el.id = 'swrm-floating-tip';
    el.className = 'swrm-floating-tip';
    el.setAttribute('role', 'tooltip');
    el.hidden = true;
    document.body.appendChild(el);
    swrmFloatTipEl = el;
    return el;
  }

  function positionSwrmFloatTip(anchor) {
    const tip = ensureSwrmFloatTipEl();
    if (!anchor || tip.hidden) return;
    const r = anchor.getBoundingClientRect();
    const pad = 8;
    const gap = 10;
    tip.style.left = '0px';
    tip.style.top = '0px';
    tip.hidden = false;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    let top = r.top - th - gap;
    if (top < pad) top = r.bottom + gap;
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function hideSwrmFloatTip(immediate) {
    if (swrmFloatTipShowTimer) {
      clearTimeout(swrmFloatTipShowTimer);
      swrmFloatTipShowTimer = null;
    }
    if (swrmFloatTipHideTimer) {
      clearTimeout(swrmFloatTipHideTimer);
      swrmFloatTipHideTimer = null;
    }
    const tip = swrmFloatTipEl;
    if (!tip) return;
    const finish = () => {
      tip.hidden = true;
      tip.classList.remove('swrm-floating-tip--in');
      tip.textContent = '';
      tip.innerHTML = '';
      tip.classList.remove('swrm-floating-tip--rich', 'swrm-floating-tip--pre');
      swrmFloatTipAnchor = null;
    };
    if (immediate) {
      finish();
      return;
    }
    const motionApi = window.SWRM_MOTION;
    if (motionApi && motionApi.floatTipOut(tip, finish)) return;
    tip.classList.remove('swrm-floating-tip--in');
    swrmFloatTipHideTimer = window.setTimeout(finish, SWRM_FLOAT_TIP_HIDE_MS);
  }

  function normalizeSwrmTipText(text) {
    return String(text || '').trim();
  }

  function findSwrmTipTarget(el) {
    return el && el.closest ? el.closest('[data-swrm-tip],[data-swrm-tip-html]') : null;
  }

  function paintSwrmFloatTipNow(anchor, tipHtml, tipText) {
    const tip = ensureSwrmFloatTipEl();
    if (tipHtml) {
      tip.innerHTML = tipHtml;
      tip.classList.add('swrm-floating-tip--rich');
      tip.classList.remove('swrm-floating-tip--pre');
    } else {
      tip.textContent = tipText;
      tip.classList.remove('swrm-floating-tip--rich');
      tip.classList.add('swrm-floating-tip--pre');
    }
    tip.hidden = false;
    requestAnimationFrame(() => {
      if (swrmFloatTipAnchor !== anchor) return;
      positionSwrmFloatTip(anchor);
      const motionApi = window.SWRM_MOTION;
      if (!motionApi || !motionApi.floatTipIn(tip)) tip.classList.add('swrm-floating-tip--in');
    });
  }

  function showSwrmFloatTip(anchor, text, isHtml) {
    const tipHtml = isHtml ? String(text || '').trim() : '';
    const tipText = isHtml ? '' : normalizeSwrmTipText(text);
    if (!anchor || (!tipText && !tipHtml)) return;
    if (swrmFloatTipShowTimer) {
      clearTimeout(swrmFloatTipShowTimer);
      swrmFloatTipShowTimer = null;
    }
    if (swrmFloatTipHideTimer) {
      clearTimeout(swrmFloatTipHideTimer);
      swrmFloatTipHideTimer = null;
    }
    swrmFloatTipAnchor = anchor;
    if (SWRM_FLOAT_TIP_SHOW_MS <= 0) {
      paintSwrmFloatTipNow(anchor, tipHtml, tipText);
      return;
    }
    swrmFloatTipShowTimer = window.setTimeout(() => {
      swrmFloatTipShowTimer = null;
      if (swrmFloatTipAnchor !== anchor) return;
      paintSwrmFloatTipNow(anchor, tipHtml, tipText);
    }, SWRM_FLOAT_TIP_SHOW_MS);
  }

  function setSwrmFloatTipTarget(el, text, options) {
    if (!el) return;
    const opts = options && typeof options === 'object' ? options : {};
    const tipHtml = String(opts.html || '').trim();
    const tipText = normalizeSwrmTipText(text);
    if (tipHtml) {
      el.setAttribute('data-swrm-tip-html', tipHtml);
      el.removeAttribute('data-swrm-tip');
      el.removeAttribute('title');
    } else if (tipText) {
      el.setAttribute('data-swrm-tip', tipText);
      el.removeAttribute('data-swrm-tip-html');
      el.removeAttribute('title');
    } else {
      el.removeAttribute('data-swrm-tip');
      el.removeAttribute('data-swrm-tip-html');
      el.removeAttribute('title');
    }
  }

  function showSwrmFloatTipFromTarget(anchor) {
    if (!anchor) return;
    const html = anchor.getAttribute('data-swrm-tip-html');
    if (html) {
      showSwrmFloatTip(anchor, html, true);
      return;
    }
    showSwrmFloatTip(anchor, anchor.getAttribute('data-swrm-tip') || '', false);
  }

  function initSwrmFloatingTips() {
    if (initSwrmFloatingTips._done) return;
    initSwrmFloatingTips._done = true;

    const onFocusIn = (e) => {
      const t =
        e.target && e.target.closest
          ? e.target.closest('[data-swrm-tip],[data-swrm-tip-html]')
          : null;
      if (t) showSwrmFloatTipFromTarget(t);
    };
    const onFocusOut = (e) => {
      const t =
        e.target && e.target.closest
          ? e.target.closest('[data-swrm-tip],[data-swrm-tip-html]')
          : null;
      if (t && swrmFloatTipAnchor === t) hideSwrmFloatTip(false);
    };

    const onPointerOver = (e) => {
      const tip = findSwrmTipTarget(e.target);
      if (!tip) return;
      const from = findSwrmTipTarget(e.relatedTarget);
      if (from === tip) return;
      if (swrmFloatTipAnchor === tip && swrmFloatTipEl && !swrmFloatTipEl.hidden) {
        positionSwrmFloatTip(tip);
        return;
      }
      showSwrmFloatTipFromTarget(tip);
    };
    const onPointerOut = (e) => {
      const tip = findSwrmTipTarget(e.target);
      if (!tip) return;
      const to = findSwrmTipTarget(e.relatedTarget);
      if (to === tip) return;
      const { clientX: x, clientY: y } = e;
      requestAnimationFrame(() => {
        if (!tip.isConnected) return;
        const r = tip.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return;
        if (swrmFloatTipAnchor === tip) hideSwrmFloatTip(true);
      });
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener(
      'scroll',
      () => {
        if (swrmFloatTipAnchor) positionSwrmFloatTip(swrmFloatTipAnchor);
      },
      true,
    );
    window.addEventListener('resize', () => {
      if (swrmFloatTipAnchor) positionSwrmFloatTip(swrmFloatTipAnchor);
    });
  }

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

  /** Bar track + fill only (counts live in chartRowStatsHtml). Optional startPct for width animation. */
  function chartBarTrackHtml(pctStr, fillClass, startPctOpt) {
    const initial =
      startPctOpt != null && Number.isFinite(Number(startPctOpt))
        ? Number(startPctOpt).toFixed(1)
        : pctStr;
    return `<div class="chart-bar-wrap">
            <div class="chart-bar-fill ${fillClass}" style="width:${initial}%"></div>
          </div>`;
  }

  /** Right column: count value + labeled avg line (no prefix letter before count). */
  function chartRowStatsHtml(cnt, avgDisplay, tloc) {
    const la = escapeHtml((tloc && tloc.dashboardChartLblAvg) || 'avg');
    const countLine = `<div class="chart-stat-line chart-stat-line--count">
      <span class="chart-stat-val">${cnt}</span>
    </div>`;
    if (avgDisplay === undefined) {
      return `<div class="chart-row-stats chart-row-stats--solo">${countLine}</div>`;
    }
    const avgInner = avgDisplay === '-' ? '\u2014' : `${escapeHtml(String(avgDisplay))}%`;
    const avgLine = `<div class="chart-stat-line chart-stat-line--avg">
      <span class="chart-stat-lbl">${la}</span>
      <span class="chart-stat-val">${avgInner}</span>
    </div>`;
    return `<div class="chart-row-stats">${countLine}${avgLine}</div>`;
  }

  function subLineTotal(s) {
    if (typeof window.SWRM?.subRuneValue === 'function') return window.SWRM.subRuneValue(s);
    return (Number(s?.val) || 0) + (Number(s?.grind) || 0);
  }

  function sumRuneSpdSubs(r) {
    let s = 0;
    for (const sub of r.substats || []) {
      if (sub.name === 'SPD') s += subLineTotal(sub);
    }
    return s;
  }

  /** Sub SPD with grind assumed up to SPD_SUB_MAX_GRIND on grindable lines. */
  function sumRuneSpdSubsPotential(r) {
    let s = 0;
    for (const sub of r.substats || []) {
      if (sub.name !== 'SPD') continue;
      if (sub.source === 'innate') {
        s += subLineTotal(sub);
        continue;
      }
      const val = Number(sub.val) || 0;
      const grind = Number(sub.grind) || 0;
      s += val + Math.max(grind, SPD_SUB_MAX_GRIND);
    }
    return s;
  }

  function formatTopSpdChipLabel(r, tloc) {
    const spd = sumRuneSpdSubs(r);
    const pot = sumRuneSpdSubsPotential(r);
    const grade = String(r.gradeStr || '').trim();
    let core = `+${spd} SPD`;
    if (pot > spd) core += ` →+${pot}`;
    return grade ? `${core} · ${grade}` : core;
  }

  function chartBarTrackHtmlVerdict(pctStr, bgCss, startPctOpt) {
    const initial =
      startPctOpt != null && Number.isFinite(Number(startPctOpt))
        ? Number(startPctOpt).toFixed(1)
        : pctStr;
    return `<div class="chart-bar-wrap">
      <div class="chart-bar-fill chart-bar-fill--verdict" style="width:${initial}%;background:${bgCss};"></div>
    </div>`;
  }

  function rafTwice(fn) {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  }

  /** Verdict/Roles/Sets chart row reorder: FLIP translation duration (viewport coords). */
  const DASH_CHART_ROW_FLIP_MS = 460;

  function snapshotKeyedRowRects(container, attrName) {
    const map = new Map();
    if (!container) return map;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const k = row.getAttribute(safe);
      if (k == null) return;
      const r = row.getBoundingClientRect();
      map.set(k, { top: r.top, left: r.left, width: r.width, height: r.height });
    });
    return map;
  }

  /** FLIP invert: move rows visually back to prior viewport positions (transform only). */
  function collectChartRowFlipMoves(container, attrName, oldRectMap) {
    const moved = [];
    if (!container || !oldRectMap || !oldRectMap.size) return moved;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const k = row.getAttribute(safe);
      if (k == null || !oldRectMap.has(k)) return;
      const o = oldRectMap.get(k);
      const n = row.getBoundingClientRect();
      const dx = o.left - n.left;
      const dy = o.top - n.top;
      if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) return;
      row.style.transformOrigin = '0 0';
      row.style.transform = `translate(${dx}px, ${dy}px)`;
      row.style.transition = 'transform 0s';
      moved.push(row);
    });
    return moved;
  }

  function playChartRowFlipMoves(movedRows) {
    const motionApi = window.SWRM_MOTION;
    if (motionApi) {
      motionApi.playChartRowFlip(movedRows);
      return;
    }
    movedRows.forEach((row) => {
      row.style.transition = `transform ${DASH_CHART_ROW_FLIP_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      row.style.transform = 'translate(0, 0)';
      const clear = () => {
        row.style.transition = '';
        row.style.transform = '';
        row.style.transformOrigin = '';
      };
      row.addEventListener(
        'transitionend',
        (e) => {
          if (e.propertyName === 'transform') clear();
        },
        { once: true },
      );
      setTimeout(clear, DASH_CHART_ROW_FLIP_MS + 120);
    });
  }

  function snapshotRowBarWidthMap(container, attrName) {
    const map = new Map();
    if (!container) return map;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const key = row.getAttribute(safe);
      if (key == null) return;
      const fill = row.querySelector('.chart-bar-fill');
      if (!fill) return;
      const w = fill.style.width;
      const m = w && String(w).match(/([\d.]+)/);
      const n = m ? parseFloat(m[1]) : NaN;
      map.set(key, Number.isFinite(n) ? n : 0);
    });
    return map;
  }

  function snapshotEffBarHeights(el) {
    if (!el) return [];
    return Array.from(el.querySelectorAll('.eff-bar')).map((bar) => {
      const h = bar.style.height;
      const m = h && String(h).match(/([\d.]+)/);
      const n = m ? parseFloat(m[1]) : NaN;
      return Number.isFinite(n) ? n : null;
    });
  }

  function snapshotSlotShareBarHeights(hostEl) {
    const map = new Map();
    if (!hostEl) return map;
    let cells = hostEl.querySelectorAll('.slot-share-cell[data-slot]');
    if (!cells.length) cells = hostEl.querySelectorAll('.slot-share-cell');
    cells.forEach((cell, idx) => {
      const key = cell.getAttribute('data-slot') || String(idx + 1);
      const fill = cell.querySelector('.slot-share-bar-fill');
      if (!fill) return;
      const h = fill.style.height;
      const m = h && String(h).match(/([\d.]+)/);
      const n = m ? parseFloat(m[1]) : NaN;
      map.set(String(key), Number.isFinite(n) ? n : 0);
    });
    return map;
  }

  function applyRowBarWidthMap(container, attrName, targetMap) {
    if (!container || !targetMap || !targetMap.size) return;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const k = row.getAttribute(safe);
      if (k == null || !targetMap.has(k)) return;
      const fill = row.querySelector('.chart-bar-fill');
      if (!fill) return;
      const v = targetMap.get(k);
      if (!Number.isFinite(v)) return;
      fill.style.width = `${Number(v).toFixed(1)}%`;
    });
  }

  function buildSlotMainPivot(list) {
    const slotTotals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const cell = {};
    const runes = Array.isArray(list) ? list : [];
    for (let i = 0; i < runes.length; i++) {
      const r = runes[i];
      const slot = r.slot | 0;
      if (slot < 1 || slot > 6) continue;
      slotTotals[slot]++;
      const m = r.mainName || '\u2014';
      if (!cell[m]) cell[m] = {};
      cell[m][slot] = (cell[m][slot] || 0) + 1;
    }
    const mains = Object.keys(cell).sort((a, b) => {
      const ta = Object.values(cell[a]).reduce((x, y) => x + y, 0);
      const tb = Object.values(cell[b]).reduce((x, y) => x + y, 0);
      if (tb !== ta) return tb - ta;
      return String(a).localeCompare(String(b));
    });
    return { slotTotals, cell, mains };
  }

  function renderSlotMainCards(hostEl, pivot, tloc, opts) {
    if (!hostEl || !pivot) return null;
    const animateCharts = !!(opts && opts.animateCharts);
    const prevSlotHeights = animateCharts ? snapshotSlotShareBarHeights(hostEl) : new Map();

    hostEl.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'slot-distribution';

    const slotHdr = (n) =>
      ((tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}').replace('{n}', String(n));

    const grandTotal = [1, 2, 3, 4, 5, 6].reduce((acc, s) => acc + (pivot.slotTotals[s] || 0), 0);

    /** Bar height scale: tallest slot count + headroom so the max bar uses most of the track. */
    const SLOT_SHARE_BAR_HEADROOM = 50;
    let maxSlotCount = 0;
    for (let si = 1; si <= 6; si++) {
      maxSlotCount = Math.max(maxSlotCount, pivot.slotTotals[si] || 0);
    }
    const barScaleDen = maxSlotCount + SLOT_SHARE_BAR_HEADROOM;

    const slotShareTargets = new Map();

    const shareSection = document.createElement('section');
    shareSection.className = 'slot-share-section';

    const shareGrid = document.createElement('div');
    shareGrid.className = 'slot-share-grid';
    shareGrid.setAttribute('role', 'group');
    shareGrid.setAttribute(
      'aria-label',
      (tloc && tloc.dashboardSlotShareAria) || 'Rune count share per slot',
    );

    for (let s = 1; s <= 6; s++) {
      const n = pivot.slotTotals[s] || 0;
      const sharePct = grandTotal ? Math.round((n / grandTotal) * 1000) / 10 : 0;
      const barH =
        grandTotal && barScaleDen > 0
          ? Math.min(100, Math.round((n / barScaleDen) * 1000) / 10)
          : 0;
      const cell = document.createElement('d' + 'iv');
      cell.className = 'slot-share-cell slot-share-cell--clickable';
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('data-dash-slot', String(s));
      cell.setAttribute('data-slot', String(s));
      cell.setAttribute(
        'aria-label',
        `${slotHdr(s)}, ${grandTotal ? n : '—'} runes, ${grandTotal ? `${sharePct}%` : '—'}`,
      );

      const lbl = document.createElement('div');
      lbl.className = 'slot-share-slot-lbl';
      lbl.textContent = slotHdr(s);

      const countEl = document.createElement('div');
      countEl.className = 'slot-share-count';
      countEl.textContent = grandTotal ? String(n) : '\u2014';

      const track = document.createElement('div');
      track.className = 'slot-share-bar-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div');
      fill.className = 'slot-share-bar-fill';
      const startH = !animateCharts
        ? barH
        : prevSlotHeights.has(String(s))
          ? prevSlotHeights.get(String(s))
          : 0;
      fill.style.height = `${startH}%`;
      slotShareTargets.set(String(s), barH);
      track.appendChild(fill);

      const pctEl = document.createElement('div');
      pctEl.className = 'slot-share-pct';
      pctEl.textContent = grandTotal ? `${sharePct}%` : '\u2014';

      cell.appendChild(lbl);
      cell.appendChild(countEl);
      cell.appendChild(track);
      cell.appendChild(pctEl);
      shareGrid.appendChild(cell);
    }

    shareSection.appendChild(shareGrid);
    root.appendChild(shareSection);

    const fillVariableList = (listEl, s) => {
      listEl.className = 'slot-main-card-list slot-dist-var-list';
      const tot = pivot.slotTotals[s] || 0;
      const rawEntries = pivot.mains
        .map((main) => ({
          main,
          c: (pivot.cell[main] && pivot.cell[main][s]) || 0,
        }))
        .filter((e) => e.c > 0)
        .sort((a, b) => b.c - a.c);
      const entries = rawEntries.slice(0, 7);

      if (!tot || !entries.length) {
        const li = document.createElement('li');
        li.className = 'slot-main-card-li slot-main-card-li--empty';
        li.textContent = (tloc && tloc.dashboardSlotCardEmpty) || '\u2014';
        listEl.appendChild(li);
        return;
      }

      const maxC = entries[0].c;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const pct = tot ? Math.round((e.c / tot) * 1000) / 10 : 0;
        const barW = maxC ? Math.round((e.c / maxC) * 100) : 0;
        const li = document.createElement('li');
        li.className = 'slot-main-card-li';
        li.innerHTML =
          `<span class="slot-main-card-name">${escapeHtml(e.main)}</span>` +
          `<span class="slot-main-card-track" aria-hidden="true"><span class="slot-main-card-bar" style="width:${barW}%"></span></span>` +
          `<span class="slot-main-card-stat"><span class="slot-main-card-n">${e.c}</span>` +
          `<span class="slot-main-card-p">${pct}%</span></span>`;
        listEl.appendChild(li);
      }
    };

    const mainsSection = document.createElement('section');
    mainsSection.className = 'slot-mains-section';
    const mainsTitle = document.createElement('h3');
    mainsTitle.className = 'slot-dist-section-title';
    mainsTitle.textContent = (tloc && tloc.dashboardSlotMainsTitle) || 'Main stats (2 / 4 / 6)';

    const varGrid = document.createElement('div');
    varGrid.className = 'slot-dist-variable-grid';
    for (const s of [2, 4, 6]) {
      const article = document.createElement('article');
      article.className = 'slot-dist-var-block';
      const hd = document.createElement('header');
      hd.className = 'slot-dist-var-hdr';
      hd.textContent = slotHdr(s);
      const list = document.createElement('ul');
      fillVariableList(list, s);
      article.appendChild(hd);
      article.appendChild(list);
      varGrid.appendChild(article);
    }

    mainsSection.appendChild(mainsTitle);
    mainsSection.appendChild(varGrid);
    root.appendChild(mainsSection);

    hostEl.appendChild(root);
    return animateCharts ? slotShareTargets : null;
  }

  const TOP_SPD_RADAR_WEAK_RATIO = 0.72;

  function topSpdSlotExcluded(slotNum) {
    return (slotNum | 0) === TOP_SPD_SKIP_SLOT;
  }

  function topSpdPeakForRune(r, usePotential) {
    if (usePotential) return sumRuneSpdSubsPotential(r);
    return sumRuneSpdSubs(r);
  }

  function buildTopSpdSlotPeaks(runes, selectedSet, usePotential) {
    const slots = TOP_SPD_GRID_SLOTS;
    const peaks = slots.map(() => 0);
    if (!selectedSet) return { peaks, maxPeak: 0, slots };
    const filtered = runes.filter((r) => r.setName === selectedSet);
    for (let i = 0; i < filtered.length; i++) {
      const r = filtered[i];
      const slot = r.slot | 0;
      const si = slots.indexOf(slot);
      if (si < 0) continue;
      const spd = topSpdPeakForRune(r, usePotential);
      if (spd > peaks[si]) peaks[si] = spd;
    }
    return { peaks, maxPeak: Math.max(...peaks, 0), slots };
  }

  function topSpdRadarVertex(cx, cy, radius, vertexIndex, scale) {
    const n = TOP_SPD_RADAR_VERTICES;
    const angle = -Math.PI / 2 + vertexIndex * ((2 * Math.PI) / n);
    const r = radius * scale;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function topSpdRadarPolygonPoints(cx, cy, radius, scales) {
    const parts = [];
    for (let i = 0; i < TOP_SPD_RADAR_VERTICES; i++) {
      const p = topSpdRadarVertex(cx, cy, radius, i, scales[i]);
      parts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    }
    return parts.join(' ');
  }

  function topSpdRadarSlotIndexAtPoint(cx, cy, x, y) {
    const dx = x - cx;
    const dy = y - cy;
    if (Math.hypot(dx, dy) < 12) return -1;
    const n = TOP_SPD_RADAR_VERTICES;
    let ang = Math.atan2(dy, dx) + Math.PI / 2;
    if (ang < 0) ang += Math.PI * 2;
    return Math.floor(ang / ((2 * Math.PI) / n)) % n;
  }

  function readTopSpdSortMetric() {
    try {
      const v = localStorage.getItem(TOP_SPD_SORT_METRIC_KEY);
      return v === 'pot' ? 'pot' : 'cur';
    } catch (e) {
      return 'cur';
    }
  }

  function readTopSpdSortDesc() {
    try {
      const v = localStorage.getItem(TOP_SPD_SORT_DIR_KEY);
      return v !== 'asc';
    } catch (e) {
      return true;
    }
  }

  function syncTopSpdSortControls(tloc) {
    const metric = readTopSpdSortMetric();
    const desc = readTopSpdSortDesc();
    const curBtn = document.getElementById('btn-top-spd-sort-cur');
    const potBtn = document.getElementById('btn-top-spd-sort-pot');
    const dirBtn = document.getElementById('btn-top-spd-sort-dir');
    const dirLbl = document.getElementById('lbl-top-spd-sort-dir');
    const metricGrp = document.getElementById('top-spd-sort-metric');
    if (curBtn) curBtn.classList.toggle('is-active', metric === 'cur');
    if (potBtn) potBtn.classList.toggle('is-active', metric === 'pot');
    if (metricGrp && tloc) {
      metricGrp.setAttribute('aria-label', tloc.dashboardTopSpdSortMetricAria || '');
    }
    if (dirBtn) {
      dirBtn.dataset.dir = desc ? 'desc' : 'asc';
      dirBtn.setAttribute('aria-pressed', desc ? 'true' : 'false');
      dirBtn.title = desc
        ? (tloc && tloc.dashboardTopSpdSortDescTitle) || ''
        : (tloc && tloc.dashboardTopSpdSortAscTitle) || '';
    }
    if (dirLbl) dirLbl.textContent = desc ? '\u2193' : '\u2191';
  }

  function compareTopSpdRunes(a, b, metric, desc) {
    const primary = metric === 'pot' ? sumRuneSpdSubsPotential : sumRuneSpdSubs;
    const secondary = metric === 'pot' ? sumRuneSpdSubs : sumRuneSpdSubsPotential;
    const va = primary(a);
    const vb = primary(b);
    if (va !== vb) return desc ? vb - va : va - vb;
    const sa = secondary(a);
    const sb = secondary(b);
    if (sa !== sb) return desc ? sb - sa : sa - sb;
    return 0;
  }

  function bindTopSpdRadarInteraction(hostEl, peaks, potPeaks, tloc, geom) {
    const svg = hostEl.querySelector('.top-spd-radar__svg');
    if (!svg) return;
    let tip = hostEl.querySelector('.top-spd-radar-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'top-spd-radar-tip';
      tip.hidden = true;
      hostEl.appendChild(tip);
    }
    const slotLblTmpl = (tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}';
    const curLbl = (tloc && tloc.dashboardTopSpdRadarLegendCur) || 'Current';
    const potLbl = (tloc && tloc.dashboardTopSpdRadarLegendPot) || 'Potential';
    const slots = geom.slots || TOP_SPD_GRID_SLOTS;

    const clearHover = () => {
      tip.hidden = true;
      hostEl.classList.remove('top-spd-radar-host--hover');
      svg.querySelectorAll('.top-spd-radar__axis--hot').forEach((el) => {
        el.classList.remove('top-spd-radar__axis--hot');
      });
    };

    const showSlot = (slotIdx, clientX, clientY) => {
      if (slotIdx < 0) {
        clearHover();
        return;
      }
      const slotNum = slots[slotIdx];
      const cur = peaks[slotIdx] || 0;
      const pot = potPeaks[slotIdx] || 0;
      const slotName = slotLblTmpl.replace('{n}', String(slotNum));
      tip.textContent =
        cur > 0
          ? pot > cur
            ? `${slotName}: ${curLbl} +${cur} · ${potLbl} +${pot}`
            : `${slotName}: ${curLbl} +${cur}`
          : `${slotName}: —`;
      hostEl.classList.add('top-spd-radar-host--hover');
      const axis = svg.querySelector(`.top-spd-radar__axis[data-slot="${slotIdx}"]`);
      if (axis) axis.classList.add('top-spd-radar__axis--hot');
      const hostRect = hostEl.getBoundingClientRect();
      tip.hidden = false;
      tip.style.left = `${clientX - hostRect.left + 12}px`;
      tip.style.top = `${clientY - hostRect.top + 12}px`;
    };

    svg.addEventListener('pointermove', (ev) => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      showSlot(topSpdRadarSlotIndexAtPoint(geom.cx, geom.cy, loc.x, loc.y), ev.clientX, ev.clientY);
    });
    svg.addEventListener('pointerleave', clearHover);
  }

  function topSpdRadarLabelTexts(peaks, potPeaks, norms, slots, tloc) {
    const slotLblTmpl = (tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}';
    return slots.map((slotNum, i) => {
      const weak = norms[i] > 0 && norms[i] < TOP_SPD_RADAR_WEAK_RATIO;
      let valTxt = '\u2014';
      if (peaks[i] > 0) {
        valTxt = potPeaks[i] > peaks[i] ? `+${peaks[i]}/${potPeaks[i]}` : `+${peaks[i]}`;
      }
      return {
        slotLbl: slotLblTmpl.replace('{n}', String(slotNum)),
        valTxt,
        weak,
      };
    });
  }

  function applyTopSpdRadarLabels(svg, labelData) {
    labelData.forEach((row, i) => {
      const slotEl = svg.querySelector(`.top-spd-radar__slot[data-slot="${i}"]`);
      const valEl = svg.querySelector(`.top-spd-radar__val[data-slot="${i}"]`);
      if (slotEl) {
        slotEl.textContent = row.slotLbl;
        slotEl.classList.toggle('top-spd-radar__slot--weak', row.weak);
      }
      if (valEl) valEl.textContent = row.valTxt;
    });
  }

  function renderTopSpdRadar(hostEl, runes, selectedSet, tloc, opts) {
    if (!hostEl) return;
    const animate = !(opts && opts.animate === false);
    const motionApi = window.SWRM_MOTION;
    const legendEl = document.getElementById('top-spd-radar-legend');
    const setLegend = (show) => {
      if (!legendEl) return;
      legendEl.hidden = !show;
      legendEl.setAttribute('aria-hidden', show ? 'false' : 'true');
    };
    if (!selectedSet) {
      if (motionApi && motionApi.cancelTopSpdRadar) motionApi.cancelTopSpdRadar();
      hostEl.innerHTML = '';
      hostEl.setAttribute('aria-hidden', 'true');
      hostEl.classList.remove('top-spd-radar-host--interactive');
      hostEl._topSpdRadarReady = false;
      setLegend(false);
      return;
    }
    const curData = buildTopSpdSlotPeaks(runes, selectedSet, false);
    const potData = buildTopSpdSlotPeaks(runes, selectedSet, true);
    const peaks = curData.peaks;
    const potPeaks = potData.peaks;
    const slots = curData.slots || TOP_SPD_GRID_SLOTS;
    const maxPeak = Math.max(curData.maxPeak, potData.maxPeak, 0);
    if (!maxPeak) {
      const emptyTxt = escapeHtml((tloc && tloc.dashboardTopSpdRadarEmpty) || '\u2014');
      hostEl.innerHTML =
        `<div class="top-spd-radar__empty">${emptyTxt}</div>`;
      hostEl.setAttribute('aria-hidden', 'true');
      hostEl.classList.remove('top-spd-radar-host--interactive');
      hostEl._topSpdRadarReady = false;
      setLegend(false);
      return;
    }
    hostEl.removeAttribute('aria-hidden');
    hostEl.classList.add('top-spd-radar-host--interactive');
    const norms = peaks.map((v) => v / maxPeak);
    const potNorms = potPeaks.map((v) => v / maxPeak);
    const cx = TOP_SPD_RADAR_CX;
    const cy = TOP_SPD_RADAR_CY;
    const R = TOP_SPD_RADAR_R;
    const labelR = R + TOP_SPD_RADAR_LABEL_OFFSET;
    const geom = { cx, cy, R, labelR, slots };
    const slotLblTmpl = (tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}';
    const ariaBase = (tloc && tloc.dashboardTopSpdRadarAria) || 'SPD strength by slot';
    const ariaParts = slots
      .map((slotNum, i) => {
        const v = peaks[i];
        const pot = potPeaks[i];
        return pot > v && v > 0
          ? `${slotLblTmpl.replace('{n}', String(slotNum))} +${v} (+${pot} pot.)`
          : `${slotLblTmpl.replace('{n}', String(slotNum))} +${v || 0}`;
      })
      .join(', ');
    const curPoints = topSpdRadarPolygonPoints(cx, cy, R, norms);
    const potPoints = topSpdRadarPolygonPoints(cx, cy, R, potNorms);
    const labelData = topSpdRadarLabelTexts(peaks, potPeaks, norms, slots, tloc);
    setLegend(true);

    const svgExisting = hostEl.querySelector('.top-spd-radar__svg');
    const curPoly = svgExisting && svgExisting.querySelector('.top-spd-radar__fill--cur');
    const potPoly = svgExisting && svgExisting.querySelector('.top-spd-radar__fill--pot');

    if (svgExisting && curPoly && potPoly && hostEl._topSpdRadarReady && animate) {
      svgExisting.setAttribute('aria-label', `${ariaBase}: ${ariaParts}`);
      const started =
        motionApi &&
        motionApi.animateTopSpdRadar &&
        motionApi.animateTopSpdRadar({
          curPoly,
          potPoly,
          curPoints,
          potPoints,
          onMid: () => applyTopSpdRadarLabels(svgExisting, labelData),
        });
      if (!started) {
        curPoly.setAttribute('points', curPoints);
        potPoly.setAttribute('points', potPoints);
        applyTopSpdRadarLabels(svgExisting, labelData);
      }
      bindTopSpdRadarInteraction(hostEl, peaks, potPeaks, tloc, geom);
      return;
    }

    if (motionApi && motionApi.cancelTopSpdRadar) motionApi.cancelTopSpdRadar();

    let svg = `<svg class="top-spd-radar__svg" viewBox="0 0 ${TOP_SPD_RADAR_VB_W} ${TOP_SPD_RADAR_VB_H}" role="img" aria-label="${escapeHtml(`${ariaBase}: ${ariaParts}`)}">`;

    for (const ring of [0.25, 0.5, 0.75, 1]) {
      const ringScales = Array(TOP_SPD_RADAR_VERTICES).fill(ring);
      svg += `<polygon class="top-spd-radar__ring" points="${topSpdRadarPolygonPoints(cx, cy, R, ringScales)}" />`;
    }
    for (let i = 0; i < TOP_SPD_RADAR_VERTICES; i++) {
      const end = topSpdRadarVertex(cx, cy, R, i, 1);
      svg += `<line class="top-spd-radar__axis" data-slot="${i}" x1="${cx}" y1="${cy}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" />`;
    }
    svg += `<polygon class="top-spd-radar__fill top-spd-radar__fill--pot" points="${potPoints}" />`;
    svg += `<polygon class="top-spd-radar__fill top-spd-radar__fill--cur" points="${curPoints}" />`;

    for (let i = 0; i < TOP_SPD_RADAR_VERTICES; i++) {
      const lp = topSpdRadarVertex(cx, cy, labelR, i, 1);
      const row = labelData[i];
      const slotCls = row.weak
        ? 'top-spd-radar__slot top-spd-radar__slot--weak'
        : 'top-spd-radar__slot';
      svg += `<text class="${slotCls}" data-slot="${i}" x="${lp.x.toFixed(2)}" y="${(lp.y - 5).toFixed(2)}" text-anchor="middle">${escapeHtml(row.slotLbl)}</text>`;
      svg += `<text class="top-spd-radar__val" data-slot="${i}" x="${lp.x.toFixed(2)}" y="${(lp.y + 11).toFixed(2)}" text-anchor="middle">${escapeHtml(row.valTxt)}</text>`;
    }
    svg += '</svg>';
    hostEl.innerHTML = svg;
    hostEl._topSpdRadarReady = true;
    bindTopSpdRadarInteraction(hostEl, peaks, potPeaks, tloc, geom);
  }

  function renderTopSpdPanel(runes, selectedSet, tloc, opts) {
    syncTopSpdSortControls(tloc);
    renderTopSpdRadar(
      document.getElementById('top-spd-radar-host'),
      runes,
      selectedSet,
      tloc,
      opts,
    );
    renderTopSpdGrid(document.getElementById('top-spd-grid'), runes, selectedSet, tloc);
  }

  function renderTopSpdGrid(gridEl, runes, selectedSet, tloc) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    if (!selectedSet) {
      const empty = document.createElement('div');
      empty.className = 'top-spd-slot-empty';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = (tloc && tloc.dashboardTopSpdPickHint) || '';
      gridEl.appendChild(empty);
      return;
    }
    const filtered = runes.filter((r) => r.setName === selectedSet);
    const slots = TOP_SPD_GRID_SLOTS || [1, 3, 4, 5, 6];
    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si];
      const col = document.createElement('div');
      col.className = 'top-spd-slot-col';
      const hdr = document.createElement('div');
      hdr.className = 'top-spd-slot-hdr';
      hdr.textContent = ((tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}').replace('{n}', String(slot));
      col.appendChild(hdr);
      const inSlot = filtered.filter((r) => (r.slot | 0) === slot);
      const metric = readTopSpdSortMetric();
      const desc = readTopSpdSortDesc();
      inSlot.sort((a, b) => compareTopSpdRunes(a, b, metric, desc));
      const pick = inSlot.slice(0, TOP_SPD_PER_SLOT);
      if (!pick.length) {
        const empty = document.createElement('div');
        empty.className = 'top-spd-slot-empty';
        empty.textContent = (tloc && tloc.dashboardTopSpdNoRunes) || '\u2014';
        col.appendChild(empty);
      } else {
        for (let pi = 0; pi < pick.length; pi++) {
          const r = pick[pi];
          const grade = String(r.gradeStr || '').trim();
          const btn = document.createElement('button');
          btn.type = 'button';
          const pot = sumRuneSpdSubsPotential(r);
          const cur = sumRuneSpdSubs(r);
          btn.className =
            pot > cur ? 'top-spd-chip top-spd-chip--has-pot' : 'top-spd-chip';
          const chipLabel = formatTopSpdChipLabel(r, tloc);
          btn.textContent = chipLabel;
          btn.title = chipLabel;
          const setNm = selectedSet;
          const sl = slot;
          btn.addEventListener('click', () => {
            navigateToRuneTableWithFilters({
              verdict: '',
              role: '',
              gradeStr: gradeStrForDashboardNav(),
              set: setNm,
              slot: String(sl),
              clearSearch: true,
            });
          });
          col.appendChild(btn);
        }
      }
      gridEl.appendChild(col);
    }
  }

  function resolveTopSpdSetPick(preferredName, setOrder) {
    const order = setOrder || [];
    if (preferredName !== null && preferredName !== undefined) {
      if (preferredName === '') return '';
      if (order.includes(preferredName)) return preferredName;
    }
    if (order.includes(TOP_SPD_DEFAULT_SET)) return TOP_SPD_DEFAULT_SET;
    return order[0] || '';
  }

  function fillTopSpdSetSelect(selectEl, setOrder, tloc, preferredName) {
    if (!selectEl) return;
    const blank = escapeHtml((tloc && tloc.dashboardTopSpdNoneOption) || '\u2014');
    const opts = [`<option value="">${blank}</option>`].concat(
      (setOrder || []).map((nm) => `<option value="${escapeHtml(nm)}">${escapeHtml(nm)}</option>`),
    );
    selectEl.innerHTML = opts.join('');
    selectEl.value = resolveTopSpdSetPick(preferredName, setOrder);
  }

  function medianSorted(sorted) {
    const n = sorted.length;
    if (!n) return null;
    const mid = Math.floor(n / 2);
    if (n % 2) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  function getStageExpandedWrap() {
    return (
      document.getElementById('stage-advisor-expanded-wrap') ||
      document.querySelector('.dashboard-stage-wrap .stage-advisor-expanded-wrap')
    );
  }

  function finishStageAdvisorCollapsed(collapsed) {
    const root = document.getElementById('stage-advisor');
    const btn = document.getElementById('btn-stage-compact');
    const expandedWrap = getStageExpandedWrap();
    if (!root || !btn) return;
    if (window.SWRM_MOTION) window.SWRM_MOTION.killStage();
    if (expandedWrap) {
      expandedWrap.style.minHeight = '';
      expandedWrap.style.transition = '';
      expandedWrap.classList.remove(
        'is-panel-content-locked',
        'is-panel-shrinking',
        'is-panel-opening-ready',
        'is-motion-running',
      );
    }
    root.classList.remove('is-panel-closing', 'is-panel-closing-shrink', 'is-panel-opening');
    if (collapsed) root.classList.add('is-compact');
    else root.classList.remove('is-compact');
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (expandedWrap) {
      if (collapsed) expandedWrap.setAttribute('aria-hidden', 'true');
      else expandedWrap.removeAttribute('aria-hidden');
    }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    btn.title = collapsed ? (t.stageCompactExpand || '') : (t.stageCompactCollapse || '');
  }

  /** @param {boolean} collapsed — true = one-line bar only */
  function applyStageAdvisorCollapsed(collapsed, opts) {
    const instant = opts && opts.instant === true;
    const root = document.getElementById('stage-advisor');
    const btn = document.getElementById('btn-stage-compact');
    const expandedWrap = getStageExpandedWrap();
    if (!root || !btn) return;

    const wasCollapsed = root.classList.contains('is-compact');
    const wrapAnimating = expandedWrap && expandedWrap.classList.contains('is-motion-running');
    if (wasCollapsed === collapsed && !wrapAnimating) {
      finishStageAdvisorCollapsed(collapsed);
      return;
    }

    const motionApi = window.SWRM_MOTION;
    const motionOff =
      !motionApi || !motionApi.enabled() || motionApi.reduced();
    if (instant || motionOff) {
      finishStageAdvisorCollapsed(collapsed);
      return;
    }

    const inner = expandedWrap && expandedWrap.querySelector('.stage-advisor-expanded');

    if (collapsed) {
      btn.setAttribute('aria-expanded', 'false');
      const started = motionApi.animateStageAdvisor({
        collapsed: true,
        wrap: expandedWrap,
        inner,
        root,
        onComplete: () => finishStageAdvisorCollapsed(true),
      });
      if (!started) finishStageAdvisorCollapsed(true);
      return;
    }

    btn.setAttribute('aria-expanded', 'true');
    if (expandedWrap) expandedWrap.removeAttribute('aria-hidden');
    const started = motionApi.animateStageAdvisor({
      collapsed: false,
      wrap: expandedWrap,
      inner,
      root,
      onComplete: () => finishStageAdvisorCollapsed(false),
    });
    if (!started) finishStageAdvisorCollapsed(false);
  }

  /** Preset & suggestion UI: stage colors (Early/Mid/Late). */
  function syncGameStageVisualClasses(presetStageKey, suggestedStageKey, hasProgressionMetrics) {
    const sel = document.getElementById('stage-select');
    const wrap = sel && sel.closest('.stage-select-wrap');
    const root = document.getElementById('stage-advisor');
    const preset = String(presetStageKey || '').toLowerCase();
    const sug = String(suggestedStageKey || '').toLowerCase();

    ['early', 'mid', 'late'].forEach((k) => {
      if (sel) sel.classList.remove(`stage-select--${k}`);
      if (wrap) wrap.classList.remove(`stage-select-wrap--${k}`);
    });
    if (preset === 'early' || preset === 'mid' || preset === 'late') {
      if (sel) sel.classList.add(`stage-select--${preset}`);
      if (wrap) wrap.classList.add(`stage-select-wrap--${preset}`);
    }

    if (root) root.classList.remove('stage-accent-early', 'stage-accent-mid', 'stage-accent-late');
    if (hasProgressionMetrics && (sug === 'early' || sug === 'mid' || sug === 'late')) {
      if (root) root.classList.add(`stage-accent-${sug}`);
    }
  }

  function readStageProgressionExpanded() {
    try { return localStorage.getItem(STAGE_PROGRESSION_EXPANDED_KEY) === '1'; } catch (e) { return false; }
  }

  // ===================== GAME STAGE ANALYSIS (Depth v2) =====================
  /**
   * Absolute depth metrics over the full exported rune list (Rare+ as in SWEX parse, rank ≥3).
   * Does not use Mid processing or verdicts.
   */
  function analyzeGameStage(runes) {
    // ----- Depth v2 tuning: edit all knobs here -----
    const CFG = {
      spdSubMin: 18,
      spdDepthCap: 250,
      spdDepthWeight: 35,
      plus15DepthCap: 600,
      plus15DepthWeight: 35,
      eliteTopN: 50,
      eliteEffBaseline: 80,
      eliteEffSpan: 30,
      eliteWeight: 30,
      stageMidMin: 45,
      stageLateMin: 85,
    };

    const effUncapped = window.SWRM.calcEfficiencyUncapped;

    function runeSpdSubTotal(r) {
      let s = 0;
      for (const sub of r.substats || []) {
        if (sub.name === 'SPD') s += subLineTotal(sub);
      }
      return s;
    }

    const list = Array.isArray(runes) ? runes : [];
    if (list.length === 0) {
      return {
        spdDepthCount: 0,
        plus15DepthCount: 0,
        eliteAvgEff: '0.0',
        eliteSampleSize: 0,
        score: '0.0',
        runeCount: 0,
        stageMidMin: CFG.stageMidMin,
        stageLateMin: CFG.stageLateMin,
        spdPoints: '0.0',
        plus15Points: '0.0',
        elitePoints: '0.0',
        spdCap: CFG.spdDepthWeight,
        plus15Cap: CFG.plus15DepthWeight,
        eliteCap: CFG.eliteWeight,
      };
    }

    let spdDepthCount = 0;
    let plus15DepthCount = 0;
    for (const r of list) {
      if (runeSpdSubTotal(r) >= CFG.spdSubMin) spdDepthCount++;
      const stars = r.stars;
      const starsNum = typeof stars === 'number' ? stars : parseInt(String(stars), 10);
      if (starsNum === 6 && (r.level | 0) === 15) plus15DepthCount++;
    }

    const effScores = [];
    for (const r of list) {
      effScores.push(effUncapped ? effUncapped(r) : r.eff || 0);
    }
    effScores.sort((a, b) => b - a);
    const eliteK = Math.min(CFG.eliteTopN, effScores.length);
    let eliteAvgUncapped = 0;
    if (eliteK > 0) {
      let sumE = 0;
      for (let i = 0; i < eliteK; i++) sumE += effScores[i];
      eliteAvgUncapped = sumE / eliteK;
    }

    const spdNorm = Math.min(spdDepthCount / CFG.spdDepthCap, 1);
    const plus15Norm = Math.min(plus15DepthCount / CFG.plus15DepthCap, 1);
    const eliteEffExcess = Math.max(0, eliteAvgUncapped - CFG.eliteEffBaseline);
    const eliteNorm = Math.min(eliteEffExcess / CFG.eliteEffSpan, 1);

    const spdPoints = spdNorm * CFG.spdDepthWeight;
    const plus15Points = plus15Norm * CFG.plus15DepthWeight;
    const elitePoints = eliteNorm * CFG.eliteWeight;

    const scoreVal = spdPoints + plus15Points + elitePoints;
    const scoreRounded = Math.round(scoreVal * 10) / 10;

    return {
      spdDepthCount,
      plus15DepthCount,
      eliteAvgEff: eliteAvgUncapped.toFixed(1),
      eliteSampleSize: eliteK,
      score: scoreRounded.toFixed(1),
      runeCount: list.length,
      stageMidMin: CFG.stageMidMin,
      stageLateMin: CFG.stageLateMin,
      spdPoints: (Math.round(spdPoints * 10) / 10).toFixed(1),
      plus15Points: (Math.round(plus15Points * 10) / 10).toFixed(1),
      elitePoints: (Math.round(elitePoints * 10) / 10).toFixed(1),
      spdCap: CFG.spdDepthWeight,
      plus15Cap: CFG.plus15DepthWeight,
      eliteCap: CFG.eliteWeight,
    };
  }

  function getRecommendedStage(score, midMin = 45, lateMin = 85) {
    if (score >= lateMin) return 'Late';
    if (score >= midMin) return 'Mid';
    return 'Early';
  }

  const DASH_VERDICT_SEG_ORDER = ['Keep', 'Finish', 'Upgrade', 'Gem', 'Grind', 'Reapp', 'Sell'];
  const DASH_VERDICT_SEG_CSS = {
    Keep: 'var(--tint-keep)',
    Finish: 'var(--tint-finish)',
    Upgrade: 'var(--tint-upgrade)',
    Gem: 'var(--tint-gem)',
    Grind: 'var(--tint-grind)',
    Reapp: 'var(--tint-reapp)',
    Sell: 'var(--tint-sell)',
  };

  /** Sort verdict keys by count (desc), then stable tie-break using DASH_VERDICT_SEG_ORDER. */
  function sortVerdictKeysByCount(counts) {
    return [...DASH_VERDICT_SEG_ORDER].sort((a, b) => {
      const ca = counts[a] || 0;
      const cb = counts[b] || 0;
      if (cb !== ca) return cb - ca;
      return DASH_VERDICT_SEG_ORDER.indexOf(a) - DASH_VERDICT_SEG_ORDER.indexOf(b);
    });
  }

  function setStatCard(id, count, total, hidePct, avgEff) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const v = wrap.querySelector('.sc-value');
    const p = wrap.querySelector('.sc-pct');
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const avgPx = String(tloc.dashboardVerdictAvgPrefix || 'avg').trim();
    const pctNum = total ? Math.round((count / total) * 1000) / 10 : 0;
    const hasAvg =
      !hidePct &&
      total > 0 &&
      count > 0 &&
      avgEff != null &&
      Number.isFinite(avgEff);
    if (v) {
      if (hidePct || !total) {
        v.textContent = String(count);
      } else if (hasAvg) {
        v.textContent = `${count} (${pctNum}%) · ${avgPx} ${avgEff.toFixed(1)}%`;
      } else {
        v.textContent = `${count} (${pctNum}%)`;
      }
    }
    if (p) {
      p.textContent = '';
    }
  }

  function dashboardGradeRangeSummary(t) {
    const tr = (k, fb) => (t && t[k]) || fb;
    const r = tr('dashboardGradeOptRare', 'Rare');
    const h = tr('dashboardGradeOptHero', 'Hero');
    const l = tr('dashboardGradeOptLegend', 'Legend');
    const name = (n) => (n === 3 ? r : n === 4 ? h : l);
    if (globalGradeMin === globalGradeMax) return String(name(globalGradeMin));
    return `${name(globalGradeMin)}\u2013${name(globalGradeMax)}`;
  }

  function syncDashboardGradeRangeSelects() {
    const selMin = document.getElementById('global-grade-min');
    const selMax = document.getElementById('global-grade-max');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const opt = (val) => {
      let txt = String(val);
      if (val === 3) txt = t.dashboardGradeOptRare || 'Rare';
      else if (val === 4) txt = t.dashboardGradeOptHero || 'Hero';
      else if (val === 5) txt = t.dashboardGradeOptLegend || 'Legend';
      return `<option value="${val}">${escapeHtml(txt)}</option>`;
    };
    const optsHtml = [3, 4, 5].map((v) => opt(v)).join('');
    if (selMin) {
      selMin.innerHTML = optsHtml;
      selMin.value = String(Math.min(5, Math.max(3, globalGradeMin)));
    }
    if (selMax) {
      selMax.innerHTML = optsHtml;
      selMax.value = String(Math.min(5, Math.max(3, globalGradeMax)));
    }
    globalGradeMin = parseInt(selMin && selMin.value, 10) || globalGradeMin;
    globalGradeMax = parseInt(selMax && selMax.value, 10) || globalGradeMax;
    if (globalGradeMin > globalGradeMax) {
      const x = globalGradeMin;
      globalGradeMin = globalGradeMax;
      globalGradeMax = x;
      if (selMin) selMin.value = String(globalGradeMin);
      if (selMax) selMax.value = String(globalGradeMax);
    }
  }

  /** Full game roster + unknown exporter sets; ordered by count high→low (ties A→Z). */
  function getDashboardSetDisplayOrder(setCounts) {
    const raw = Object.values((window.SWRM && window.SWRM.SET_NAMES) || {});
    const uniqKnown = [...new Set(raw)];
    const knownSet = new Set(uniqKnown);
    const extras = Object.keys(setCounts || {}).filter((x) => x && !knownSet.has(x));
    const all = uniqKnown.concat(extras);
    const sc = setCounts || {};
    all.sort((a, b) => {
      const ca = sc[a] || 0;
      const cb = sc[b] || 0;
      if (cb !== ca) return cb - ca;
      return String(a).localeCompare(String(b));
    });
    return all;
  }

  function aggregateDashboardRunes(runes) {
    const counts = { Keep: 0, Sell: 0, Grind: 0, Finish: 0, Reapp: 0, Upgrade: 0, Gem: 0 };
    const roleCounts = {};
    const roleEff = {};
    const setCounts = {};
    const setEff = {};
    const slotCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const slotEff = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const slotMain = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
    const effBuckets = new Array(20).fill(0);
    const scoreBuckets = new Array(20).fill(0);
    const effVals = [];
    const scoreVals = [];
    const verdictEff = {};
    for (let i = 0; i < runes.length; i++) {
      const r = runes[i];
      counts[r.verdict] = (counts[r.verdict] || 0) + 1;
      const rv = r.verdict || '';
      if (rv) {
        verdictEff[rv] = verdictEff[rv] || [];
        verdictEff[rv].push(Number.isFinite(r.eff) ? r.eff : 0);
      }
      if (r.role) {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        roleEff[r.role] = roleEff[r.role] || [];
        roleEff[r.role].push(r.eff);
      }
      setCounts[r.setName] = (setCounts[r.setName] || 0) + 1;
      setEff[r.setName] = setEff[r.setName] || [];
      setEff[r.setName].push(r.eff);
      const eff = Number.isFinite(r.eff) ? r.eff : 0;
      slotCounts[r.slot] = (slotCounts[r.slot] || 0) + 1;
      slotMain[r.slot][r.mainName] = (slotMain[r.slot][r.mainName] || 0) + 1;
      const si =
        typeof r.slot === 'number' && Number.isFinite(r.slot)
          ? r.slot
          : parseInt(String(r.slot), 10);
      if (si >= 1 && si <= 6 && !Number.isNaN(si)) slotEff[si].push(eff);
      effVals.push(eff);
      effBuckets[Math.min(19, Math.floor(eff / 5))]++;
      const sc =
        typeof computeRuneScore === 'function'
          ? Number(computeRuneScore(r))
          : NaN;
      const scoreNum = Number.isFinite(sc) ? sc : 0;
      scoreVals.push(scoreNum);
      scoreBuckets[Math.min(19, Math.floor(scoreNum / 5))]++;
    }
    effVals.sort((a, b) => a - b);
    scoreVals.sort((a, b) => a - b);
    return {
      counts,
      roleCounts,
      roleEff,
      setCounts,
      setEff,
      slotCounts,
      slotEff,
      slotMain,
      effBuckets,
      scoreBuckets,
      medianEff: medianSorted(effVals),
      medianScore: medianSorted(scoreVals),
      verdictEff,
    };
  }

  function verdictMeanEff(verdictEff, verdictKey) {
    const a = verdictEff && verdictEff[verdictKey];
    if (!a || !a.length) return null;
    return a.reduce((x, y) => x + y, 0) / a.length;
  }

  function getDashboardExportText() {
    const vis = getVisibleRunes();
    const agg = aggregateDashboardRunes(vis);
    const metrics = analyzeGameStage(allRunes);
    const recStage = getRecommendedStage(
      parseFloat(metrics.score),
      metrics.stageMidMin,
      metrics.stageLateMin
    );
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lines = [];
    lines.push(String(t.title || 'SW-Forge'));
    lines.push(`${t.stageYourPresetLabel || 'Preset'}: ${stage}`);
    lines.push(
      `${t.stageSuggestedLabel || 'Suggested'}: ${stageDisplayName(t, recStage)} · ${t.stageScoreLabel || 'Score'} ${metrics.score} ` +
        `(+${metrics.spdPoints}/${metrics.spdCap} +${metrics.plus15Points}/${metrics.plus15Cap} +${metrics.elitePoints}/${metrics.eliteCap})`
    );
    lines.push(
      `${t.stageCardHrName || 'SPD depth'}: ${metrics.spdDepthCount}, ${t.stageCardKeepName || '+15'}: ${metrics.plus15DepthCount}, ${t.stageCardMetaName || 'Elite'}: ${metrics.eliteAvgEff}% (${metrics.eliteSampleSize})`
    );
    const gradeLine = `${t.dashboardGradeRangeInExport || 'Grades'}: ${dashboardGradeRangeSummary(t)}`;
    lines.push(`${t.dashboardScopeTitle || 'Filter'}: ${t.minLvl || 'Min Lvl'} +${globalMinLevel}, ${gradeLine}`);
    lines.push(
      `${(t.dashboardExportTotalCurrent || 'Total {acc} · Current {view}')
        .replace(/\{acc\}/g, String(allRunes.length))
        .replace(/\{view\}/g, String(vis.length))}`,
    );

    lines.push('');
    lines.push(t.dashboardVerdictMixTitle || 'Verdict distribution');
    const avgPx = String(t.dashboardVerdictAvgPrefix || 'avg').trim();
    sortVerdictKeysByCount(agg.counts).forEach((k) => {
      const c = agg.counts[k] || 0;
      const pct = vis.length ? Math.round((c / vis.length) * 1000) / 10 : 0;
      const mu = verdictMeanEff(agg.verdictEff, k);
      const avgBit =
        c > 0 && mu != null && Number.isFinite(mu) ? ` · ${avgPx} ${mu.toFixed(1)}%` : '';
      lines.push(`  ${k}: ${c} (${pct}%)${avgBit}`);
    });

    lines.push('');
    lines.push(t.roleDistribution || 'Role distribution');
    const sortedRoles = Object.keys(agg.roleCounts).sort((a, b) => (agg.roleCounts[b] || 0) - (agg.roleCounts[a] || 0));
    sortedRoles.forEach((role) => {
      const cnt = agg.roleCounts[role] || 0;
      const avg = agg.roleEff[role]
        ? (agg.roleEff[role].reduce((a, b) => a + b, 0) / agg.roleEff[role].length).toFixed(1)
        : '-';
      lines.push(`  ${role}: ${cnt} · avg ${avg}%`);
    });

    lines.push('');
    lines.push(t.setDistribution || 'Set distribution');
    getDashboardSetDisplayOrder(agg.setCounts).forEach((name) => {
      const cnt = agg.setCounts[name] || 0;
      const se = agg.setEff[name];
      const avg = se && se.length
        ? (se.reduce((a, b) => a + b, 0) / se.length).toFixed(1)
        : '-';
      lines.push(`  ${name}: ${cnt} · avg ${avg}%`);
    });

    lines.push('');
    lines.push(t.dashboardSlotMatrixTitle || 'Slot × main distribution');
    const slotLabelTmpl = String(t.dashboardTopSpdSlotLabel || 'Slot {n}').trim();
    const slotAvgPx = String(t.dashboardChartLblAvg || t.dashboardVerdictAvgPrefix || 'avg').trim();
    for (let s = 1; s <= 6; s++) {
      const cnt = agg.slotCounts[s] || 0;
      const list = agg.slotEff[s] || [];
      const avgStr = list.length
        ? (list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)
        : '-';
      lines.push(`  ${slotLabelTmpl.replace('{n}', String(s))}: ${cnt} · ${slotAvgPx} ${avgStr}%`);
    }

    lines.push('');
    lines.push(t.efficiencyDistribution || 'Efficiency Distribution');
    if (agg.medianEff != null && vis.length) {
      lines.push(`  ${(t.effMedianCaption || '').replace('{pct}', agg.medianEff.toFixed(1))}`);
    }
    lines.push(`  ${t.dashboardExportEffBuckets || 'Histogram (5% buckets):'}`);
    let anyBucket = false;
    for (let i = 0; i < 20; i++) {
      if (!agg.effBuckets[i]) continue;
      anyBucket = true;
      lines.push(`    ${i * 5}-${i * 5 + 4}%: ${agg.effBuckets[i]}`);
    }
    if (!anyBucket) lines.push(`    —`);

    lines.push('');
    lines.push(t.scoreDistribution || 'Forge Score distribution');
    if (agg.medianScore != null && vis.length) {
      lines.push(`  ${(t.scoreMedianCaption || '').replace('{score}', String(Math.round(agg.medianScore)))}`);
    }
    lines.push(`  ${t.dashboardExportScoreBuckets || 'Histogram (5-point buckets):'}`);
    let anyScoreBucket = false;
    for (let i = 0; i < 20; i++) {
      if (!agg.scoreBuckets || !agg.scoreBuckets[i]) continue;
      anyScoreBucket = true;
      lines.push(`    ${i * 5}-${i * 5 + 4}: ${agg.scoreBuckets[i]}`);
    }
    if (!anyScoreBucket) lines.push(`    —`);

    lines.push('');
    lines.push(`${t.footerVersionLabel || 'Build'}: ${(window.SWRM && window.SWRM.APP_VERSION) || ''}`);

    return lines.join('\n');
  }

  // ===================== DASHBOARD =====================
  /** Scale so the largest bar uses ~75% of track width (25% headroom). */
  function dashChartScaleMax(counts) {
    const maxV = Math.max(0, ...(counts.length ? counts : [0]));
    if (maxV <= 0) return 1;
    return Math.max(maxV / 0.75, 1);
  }

  function dashChartPct(count, scaleMax) {
    const denom = Math.max(scaleMax, 1);
    return Math.min(100, (Number(count) / denom) * 100);
  }

  function replayDashboardDistributionAnimations() {
    const motionApi = window.SWRM_MOTION;
    if (!motionApi || !motionApi.enabled()) return false;
    let played = false;
    for (const k of ['verdict', 'roles', 'sets', 'slots', 'eff', 'score']) {
      const pane = document.getElementById(`dash-pane-${k}`);
      if (pane && motionApi.animateDashboardPaneBars(pane)) played = true;
    }
    return played;
  }

  function scheduleDashboardChartReplay(options) {
    const fromZero = !!(options && options.fromZero);
    rafTwice(() => {
      const hub = document.getElementById('tab-runes');
      if (hub && hub.classList.contains('hidden')) return;
      const dashPane = document.getElementById('tab-dashboard');
      if (
        dashPane &&
        (dashPane.hidden || !dashPane.classList.contains('is-active'))
      ) {
        return;
      }
      if (fromZero) {
        if (typeof renderDashboard === 'function' && typeof getVisibleRunes === 'function') {
          renderDashboard(getVisibleRunes(), { animateCharts: true, fromZero: true });
        }
        return;
      }
      if (!replayDashboardDistributionAnimations()) {
        if (typeof renderDashboard === 'function' && typeof getVisibleRunes === 'function') {
          renderDashboard(getVisibleRunes(), { animateCharts: true });
        }
      }
    });
  }

  function renderDashboard(runes, opts) {
    const animateCharts = !!(opts && opts.animateCharts);
    const chartFromZero = !!(opts && opts.fromZero);
    // Account progression: full export rune list, absolute counts + top-N eff (not affected by preset / Min Lvl).
    const metrics = analyzeGameStage(allRunes);
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const recStage = getRecommendedStage(
      parseFloat(metrics.score),
      metrics.stageMidMin,
      metrics.stageLateMin
    );

    const metricHr = document.getElementById('metric-val-highroll');
    const metricKe = document.getElementById('metric-val-keepeff');
    const metricMe = document.getElementById('metric-val-meta');
    const recDisp = document.getElementById('recommended-stage-display');
    const scoreInline = document.getElementById('lbl-stage-score-inline');
    const scoreFootnote = document.getElementById('lbl-stage-score-footnote');
    const mismatchLine = document.getElementById('stage-mismatch-line');
    const noEligLine = document.getElementById('stage-noeligible-line');

    const hasProg = !!(allRunes.length && metrics.runeCount);

    if (metricHr) {
      metricHr.textContent = metrics.runeCount ? String(metrics.spdDepthCount) : '\u2014';
    }
    if (metricKe) {
      metricKe.textContent = metrics.runeCount ? String(metrics.plus15DepthCount) : '\u2014';
    }
    if (metricMe) {
      if (metrics.runeCount) {
        const tmpl = tloc.stageEliteValFormat || '{eff}% (n={n})';
        metricMe.textContent = tmpl.replace('{eff}', metrics.eliteAvgEff).replace('{n}', String(metrics.eliteSampleSize));
      } else {
        metricMe.textContent = '\u2014';
      }
    }

    if (recDisp) {
      recDisp.textContent =
        allRunes.length && metrics.runeCount ? stageDisplayName(tloc, recStage) : '\u2014';
      recDisp.classList.remove(
        'stage-advisor-suggestion-value--early',
        'stage-advisor-suggestion-value--mid',
        'stage-advisor-suggestion-value--late'
      );
      if (hasProg) {
        const sg = String(recStage || '').toLowerCase();
        if (sg === 'early' || sg === 'mid' || sg === 'late') {
          recDisp.classList.add(`stage-advisor-suggestion-value--${sg}`);
        }
      }
    }

    if (scoreInline) {
      scoreInline.classList.remove('stage-score-inline--early', 'stage-score-inline--mid', 'stage-score-inline--late');
      if (!hasProg) {
        scoreInline.textContent = '';
        scoreInline.hidden = true;
      } else {
        scoreInline.hidden = false;
        const label = tloc.stageScoreLabel || 'Combined score';
        const bandsTpl = String(tloc.stageScoreInlineBandsTpl || 'Mid from {mid}, Late from {late}').trim();
        const bands = bandsTpl
          .replace(/\{mid\}/g, String(metrics.stageMidMin))
          .replace(/\{late\}/g, String(metrics.stageLateMin));
        const strong = document.createElement('strong');
        strong.className = 'stage-advisor-score-inline-num';
        strong.textContent = String(metrics.score);
        scoreInline.replaceChildren(
          document.createTextNode(`${label}: `),
          strong,
          document.createTextNode(` \u00b7 ${bands}`),
        );
        const filtersNote = String(tloc.stageCombinedScoreFootnote || '').trim();
        if (filtersNote) {
          const note = document.createElement('span');
          note.className = 'stage-score-inline-filters-note';
          note.textContent = filtersNote;
          scoreInline.appendChild(note);
        }
        const seg = String(recStage || '').toLowerCase();
        if (seg === 'early' || seg === 'mid' || seg === 'late') {
          scoreInline.classList.add(`stage-score-inline--${seg}`);
        }
      }
    }

    if (scoreFootnote) {
      scoreFootnote.textContent = '';
      scoreFootnote.hidden = true;
    }

    const setMetricTitleName = (spanId, nameTpl) => {
      const el = document.getElementById(spanId);
      const n = String(nameTpl || '').trim();
      if (el && n) el.textContent = n;
    };
    setMetricTitleName('lbl-card-hr-name', tloc.stageCardHrName || '');
    setMetricTitleName('lbl-card-keep-name', tloc.stageCardKeepName || '');
    setMetricTitleName('lbl-card-meta-name', tloc.stageCardMetaName || '');

    const metricsExpl = document.getElementById('lbl-stage-metrics-explainer');
    if (metricsExpl) {
      const raw = tloc.stageMetricsExplainer || '';
      metricsExpl.textContent = raw.split(/\bCard weights:?\s*/i)[0].trim();
    }

    try {
      if (localStorage.getItem(STAGE_PROGRESSION_EXPANDED_KEY) == null) {
        applyStageAdvisorCollapsed(true, { instant: true });
      }
    } catch (e) { /* ignore */ }

    if (noEligLine) {
      const showNoElig = allRunes.length === 0 && processedRunes.length === 0;
      noEligLine.hidden = !showNoElig;
      if (showNoElig) noEligLine.textContent = tloc.stageAdvisorNoEligible || '';
    }

    if (mismatchLine) {
      const showMismatch =
        allRunes.length > 0 &&
        metrics.runeCount > 0 &&
        stage !== recStage;
      mismatchLine.hidden = !showMismatch;
      if (!showMismatch) {
        mismatchLine.textContent = '';
      } else {
        const explain = String(tloc.stageMismatchExplainTpl || '{preset} vs {suggested}. {hint}');
        mismatchLine.textContent = explain
          .replace(/\{preset\}/g, stageDisplayName(tloc, stage))
          .replace(/\{suggested\}/g, stageDisplayName(tloc, recStage))
          .replace(/\{hint\}/g, (tloc.stageMismatchHint || '').trim());
      }
    }

    const tplContrib = tloc.stageMetricContribTpl || '+{pts} / {cap} pts';
    const showContrib = metrics.runeCount > 0;
    [
      ['metric-contrib-spd', 'spdPoints', 'spdCap'],
      ['metric-contrib-plus15', 'plus15Points', 'plus15Cap'],
      ['metric-contrib-elite', 'elitePoints', 'eliteCap'],
    ].forEach(([elId, pk, ck]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (showContrib) {
        el.textContent = tplContrib.replace('{pts}', String(metrics[pk])).replace('{cap}', String(metrics[ck]));
        el.hidden = false;
      } else {
        el.textContent = '';
        el.hidden = true;
      }
    });

    /** Custom floating tip on metric cards (Sheets parity text from hidden desc or i18n). */
    const attachMetricCardTooltip = (descId, fallback) => {
      const desc = document.getElementById(descId);
      const card = desc && desc.closest('.stage-metric-card');
      if (!card) return;
      let tip = String(desc.textContent || '').replace(/\s+/g, ' ').trim();
      if (!tip) tip = String(fallback || '').replace(/\s+/g, ' ').trim();
      const targets = [
        card,
        ...card.querySelectorAll('.stage-metric-card-head, .stage-metric-val, .stage-metric-contrib, .stage-metric-weight, .stage-metric-icon'),
      ];
      targets.forEach((node) => {
        if (!node) return;
        setSwrmFloatTipTarget(node, tip);
      });
    };
    attachMetricCardTooltip('lbl-card-hr-desc', tloc.stageCardHrDesc || '');
    attachMetricCardTooltip('lbl-card-keep-desc', tloc.stageCardKeepDesc || '');
    attachMetricCardTooltip('lbl-card-meta-desc', tloc.stageCardMetaDesc || '');

    syncGameStageVisualClasses(stage, recStage, hasProg);

    const agg = aggregateDashboardRunes(runes);
    const {
      counts,
      roleCounts,
      roleEff,
      setCounts,
      setEff,
      effBuckets,
      scoreBuckets,
      medianEff,
      medianScore,
      verdictEff,
    } = agg;

    const setOrder = getDashboardSetDisplayOrder(setCounts);

    const total = runes.length;

    const accCt = document.getElementById('dashboard-account-run-count');
    if (accCt) {
      const tpl = (tloc.dashboardAccountRunesInline || 'Total: {acc} · Current: {view}').trim();
      accCt.textContent = tpl
        .replace(/\{acc\}/g, String(allRunes.length))
        .replace(/\{view\}/g, String(total));
    }

    let oldRectsVerdict = null;
    let oldRectsRoles = null;
    let oldRectsSets = null;

    let verdictBarTargets = null;
    let roleBarTargets = null;
    let setBarTargets = null;
    let effBarTargets = null;
    let scoreBarTargets = null;
    let slotShareAnimTargets = null;

    const verdictChartEl = document.getElementById('verdict-chart');
    if (verdictChartEl) {
      oldRectsVerdict = animateCharts ? snapshotKeyedRowRects(verdictChartEl, 'data-dash-verdict') : null;
      const prevVerdictW =
        animateCharts && !chartFromZero
          ? snapshotRowBarWidthMap(verdictChartEl, 'data-dash-verdict')
          : new Map();
      verdictChartEl.innerHTML = '';
      const vRows = [];
      DASH_VERDICT_SEG_ORDER.forEach((v) => {
        const c = counts[v] || 0;
        if (c > 0) vRows.push({ v, c });
      });
      vRows.sort((a, b) => {
        if (b.c !== a.c) return b.c - a.c;
        return DASH_VERDICT_SEG_ORDER.indexOf(a.v) - DASH_VERDICT_SEG_ORDER.indexOf(b.v);
      });
      const verdictScale = dashChartScaleMax(vRows.map((x) => x.c));
      verdictBarTargets = new Map();
      const openHint = String((tloc.dashboardOpenTableHint || '').trim());
      for (let i = 0; i < vRows.length; i++) {
        const { v, c } = vRows[i];
        const avgMu = verdictMeanEff(verdictEff, v);
        const avg =
          c > 0 && avgMu != null && Number.isFinite(avgMu) ? avgMu.toFixed(1) : '-';
        const pct = dashChartPct(c, verdictScale).toFixed(1);
        const pctNum = parseFloat(pct);
        verdictBarTargets.set(v, pctNum);
        const startPct = !animateCharts ? pctNum : chartFromZero ? 0 : prevVerdictW.has(v) ? prevVerdictW.get(v) : 0;
        const lblRaw = verdictUiLabel(tloc, v);
        const lbl = escapeHtml(lblRaw);
        const bg = DASH_VERDICT_SEG_CSS[v] || '#888';
        const titleRaw = openHint ? `${lblRaw}: ${c}. ${openHint}` : `${lblRaw}: ${c}`;
        const titleAttr = escapeHtml(titleRaw);
        verdictChartEl.innerHTML += `
        <div class="chart-row chart-row--clickable chart-row--verdict" role="button" tabindex="0" data-dash-verdict="${escapeHtml(v)}" title="${titleAttr}">
          <div class="chart-label">${lbl}</div>
          ${chartBarTrackHtmlVerdict(pct, bg, animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(c, avg, tloc)}
        </div>`;
      }
    }

    const roleEl = document.getElementById('role-chart');
    if (roleEl) {
      oldRectsRoles = animateCharts ? snapshotKeyedRowRects(roleEl, 'data-dash-role') : null;
      const prevRoleW =
        animateCharts && !chartFromZero ? snapshotRowBarWidthMap(roleEl, 'data-dash-role') : new Map();
      roleEl.innerHTML = '';
      const sortedRoles = Object.keys(roleCounts).sort((a, b) => (roleCounts[b] || 0) - (roleCounts[a] || 0));
      const roleScale = dashChartScaleMax(sortedRoles.map((rr) => roleCounts[rr] || 0));
      roleBarTargets = new Map();
      for (const role of sortedRoles) {
        const cnt = roleCounts[role] || 0;
        const avg = roleEff[role]
          ? (roleEff[role].reduce((a, b) => a + b, 0) / roleEff[role].length).toFixed(1)
          : '-';
        const pct = dashChartPct(cnt, roleScale).toFixed(1);
        const pctNum = parseFloat(pct);
        roleBarTargets.set(role, pctNum);
        const startPct = !animateCharts ? pctNum : chartFromZero ? 0 : prevRoleW.has(role) ? prevRoleW.get(role) : 0;
        const er = escapeHtml(role);
        roleEl.innerHTML += `
        <div class="chart-row chart-row--clickable" role="button" tabindex="0" data-dash-role="${er}">
          <div class="chart-label">${er}</div>
          ${chartBarTrackHtml(pct, 'chart-bar--roles', animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(cnt, avg, tloc)}
        </div>`;
      }
    }

    const setEl = document.getElementById('set-chart');
    if (setEl) {
      oldRectsSets = animateCharts ? snapshotKeyedRowRects(setEl, 'data-dash-set') : null;
      const prevSetW =
        animateCharts && !chartFromZero ? snapshotRowBarWidthMap(setEl, 'data-dash-set') : new Map();
      setEl.innerHTML = '';
      const setScale = dashChartScaleMax(setOrder.map((nm) => setCounts[nm] || 0));
      setBarTargets = new Map();
      const openHintSets = String((tloc.dashboardOpenTableHint || '').trim());
      for (const name of setOrder) {
        const cnt = setCounts[name] || 0;
        const effList = setEff[name];
        const avg =
          effList && effList.length
            ? (effList.reduce((a, b) => a + b, 0) / effList.length).toFixed(1)
            : '-';
        const pct = dashChartPct(cnt, setScale).toFixed(1);
        const pctNum = parseFloat(pct);
        const enc = encodeURIComponent(name);
        setBarTargets.set(enc, pctNum);
        const startPct = !animateCharts ? pctNum : chartFromZero ? 0 : prevSetW.has(enc) ? prevSetW.get(enc) : 0;
        const en = escapeHtml(name);
        const encAttr = escapeHtml(enc);
        const titleRaw = openHintSets ? `${name}: ${cnt}. ${openHintSets}` : `${name}: ${cnt}`;
        const titleAttr = escapeHtml(titleRaw);
        setEl.innerHTML += `
        <div class="chart-row chart-row--clickable chart-row--set" role="button" tabindex="0" data-dash-set="${encAttr}" title="${titleAttr}">
          <div class="chart-label">${en}</div>
          ${chartBarTrackHtml(pct, 'chart-bar--sets', animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(cnt, avg, tloc)}
        </div>`;
      }
    }

    const slotCardsRoot = document.getElementById('slot-main-cards-root');
    const pivot = buildSlotMainPivot(runes);
    slotShareAnimTargets = renderSlotMainCards(slotCardsRoot, pivot, tloc, { animateCharts });

    let savedSet = null;
    try {
      if (localStorage.getItem(TOP_SPD_STORAGE_KEY) !== null) {
        savedSet = localStorage.getItem(TOP_SPD_STORAGE_KEY);
      }
    } catch (e) { /* ignore */ }
    const spdSel = document.getElementById('top-spd-set-select');
    fillTopSpdSetSelect(spdSel, setOrder, tloc, savedSet);
    const spdPick = spdSel && spdSel.value ? spdSel.value : '';
    renderTopSpdPanel(runes, spdPick, tloc, { animate: false });

    const effEl = document.getElementById('eff-chart');
    const prevEffHeights =
      animateCharts && effEl && !chartFromZero ? snapshotEffBarHeights(effEl) : null;
    if (effEl) effEl.innerHTML = '';
    const maxBucket = Math.max(...effBuckets, 1);
    const medEff = medianEff;
    const medLine = document.getElementById('eff-median-line');
    const medianTipTpl = tloc.effMedianCaption || 'Median efficiency (filtered): {pct}%';
    if (medEff != null && runes.length) {
      const pos = Math.min(100, Math.max(0, medEff));
      if (medLine) {
        medLine.style.left = `calc(${pos}% - 1px)`;
        medLine.hidden = false;
        medLine.setAttribute('aria-hidden', 'false');
        const tip = medianTipTpl.replace('{pct}', medEff.toFixed(1));
        medLine.setAttribute('aria-label', tip);
        setSwrmFloatTipTarget(medLine, tip);
      }
    } else if (medLine) {
      medLine.hidden = true;
      medLine.setAttribute('aria-hidden', 'true');
      medLine.removeAttribute('aria-label');
      setSwrmFloatTipTarget(medLine, '');
    }
    if (effEl) {
      effBarTargets = [];
      for (let i = 0; i < 20; i++) {
        const h = Math.max(4, (effBuckets[i] / maxBucket) * 80);
        effBarTargets[i] = h;
        const h0 = !animateCharts ? h : chartFromZero ? 0 : prevEffHeights && prevEffHeights[i] != null ? prevEffHeights[i] : 0;
        const label = `${i * 5}-${i * 5 + 4}`;
        const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
        effEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}%: ${effBuckets[i]} runes">
          <div class="eff-bar ${cls}" style="height:${h0}px"></div>
          <div class="eff-label">${i * 5}</div>
        </div>`;
      }
    }

    const scoreEl = document.getElementById('score-chart');
    const prevScoreHeights =
      animateCharts && scoreEl && !chartFromZero ? snapshotEffBarHeights(scoreEl) : null;
    if (scoreEl) scoreEl.innerHTML = '';
    const maxScoreBucket = Math.max(...(scoreBuckets || []), 1);
    const medScore = medianScore;
    const medScoreLine = document.getElementById('score-median-line');
    const medianScoreTipTpl = tloc.scoreMedianCaption || 'Median Forge Score (filtered): {score}';
    if (medScore != null && runes.length) {
      const pos = Math.min(100, Math.max(0, medScore));
      if (medScoreLine) {
        medScoreLine.style.left = `calc(${pos}% - 1px)`;
        medScoreLine.hidden = false;
        medScoreLine.setAttribute('aria-hidden', 'false');
        const tip = medianScoreTipTpl.replace('{score}', String(Math.round(medScore)));
        medScoreLine.setAttribute('aria-label', tip);
        setSwrmFloatTipTarget(medScoreLine, tip);
      }
    } else if (medScoreLine) {
      medScoreLine.hidden = true;
      medScoreLine.setAttribute('aria-hidden', 'true');
      medScoreLine.removeAttribute('aria-label');
      setSwrmFloatTipTarget(medScoreLine, '');
    }
    if (scoreEl && scoreBuckets) {
      scoreBarTargets = [];
      for (let i = 0; i < 20; i++) {
        const h = Math.max(4, (scoreBuckets[i] / maxScoreBucket) * 80);
        scoreBarTargets[i] = h;
        const h0 = !animateCharts ? h : chartFromZero ? 0 : prevScoreHeights && prevScoreHeights[i] != null ? prevScoreHeights[i] : 0;
        const label = `${i * 5}-${i * 5 + 4}`;
        const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
        scoreEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}: ${scoreBuckets[i]} runes">
          <div class="eff-bar eff-bar--score ${cls}" style="height:${h0}px"></div>
          <div class="eff-label">${i * 5}</div>
        </div>`;
      }
    }

    if (animateCharts) {
      rafTwice(() => {
        const mv = verdictChartEl
          ? collectChartRowFlipMoves(verdictChartEl, 'data-dash-verdict', oldRectsVerdict)
          : [];
        const mr = roleEl ? collectChartRowFlipMoves(roleEl, 'data-dash-role', oldRectsRoles) : [];
        const ms = setEl ? collectChartRowFlipMoves(setEl, 'data-dash-set', oldRectsSets) : [];
        const allFlip = [...mv, ...mr, ...ms];

        const applyBarAndEffTargets = () => {
          const motionApi = window.SWRM_MOTION;
          const useGsap = motionApi && motionApi.enabled();
          const barEntries = [];
          const heightEntries = [];

          const collectBarMap = (container, attr, map) => {
            if (!container || !map || !map.size) return;
            const safe = String(attr).replace(/"/g, '');
            container.querySelectorAll(`[${safe}]`).forEach((row) => {
              const k = row.getAttribute(safe);
              if (k == null || !map.has(k)) return;
              const fill = row.querySelector('.chart-bar-fill');
              const v = map.get(k);
              if (!fill || !Number.isFinite(v)) return;
              if (useGsap) barEntries.push({ el: fill, pct: v });
              else fill.style.width = `${Number(v).toFixed(1)}%`;
            });
          };

          collectBarMap(verdictChartEl, 'data-dash-verdict', verdictBarTargets);
          collectBarMap(roleEl, 'data-dash-role', roleBarTargets);
          collectBarMap(setEl, 'data-dash-set', setBarTargets);

          if (effEl && effBarTargets && effBarTargets.length) {
            const bars = effEl.querySelectorAll('.eff-bar');
            bars.forEach((bar, i) => {
              if (effBarTargets[i] == null) return;
              const px = `${effBarTargets[i]}px`;
              if (useGsap) heightEntries.push({ el: bar, value: px });
              else bar.style.height = px;
            });
          }

          if (scoreEl && scoreBarTargets && scoreBarTargets.length) {
            const bars = scoreEl.querySelectorAll('.eff-bar');
            bars.forEach((bar, i) => {
              if (scoreBarTargets[i] == null) return;
              const px = `${scoreBarTargets[i]}px`;
              if (useGsap) heightEntries.push({ el: bar, value: px });
              else bar.style.height = px;
            });
          }

          if (slotCardsRoot && slotShareAnimTargets && slotShareAnimTargets.size) {
            slotCardsRoot.querySelectorAll('.slot-share-cell[data-slot]').forEach((cell) => {
              const s = cell.getAttribute('data-slot');
              const fill = cell.querySelector('.slot-share-bar-fill');
              if (!fill || !s || !slotShareAnimTargets.has(s)) return;
              const pct = `${slotShareAnimTargets.get(s)}%`;
              if (useGsap) heightEntries.push({ el: fill, value: pct });
              else fill.style.height = pct;
            });
          }

          if (useGsap) {
            motionApi.animateBarWidthFills(barEntries);
            motionApi.animateHeightFills(heightEntries);
          }
        };

        if (allFlip.length) {
          requestAnimationFrame(() => {
            playChartRowFlipMoves(allFlip);
            applyBarAndEffTargets();
          });
        } else {
          applyBarAndEffTargets();
        }
      });
    }
  }

  function setText(id, val, sel) {
    const el = document.querySelector(`#${id} ${sel}`);
    if (el) el.textContent = val;
  }

  const SWRM_REF = () => window.SWRM || {};

  /** How much each MAIN stat type is worth (0–100), separate from subs. */
  const MAIN_STAT_VALUE = {
    SPD: 100,
    CDmg: 93,
    'ATK%': 91,
    CRate: 89,
    ACC: 80,
    'HP%': 76,
    'DEF%': 73,
    RES: 71,
    ATK: 58,
    DEF: 56,
    HP: 54,
  };

  /** How much each SUB stat type is worth (0–100) — own ranking, not the same as main. */
  const SUB_STAT_VALUE = {
    SPD: 100,
    CRate: 95,
    CDmg: 93,
    'ATK%': 90,
    ACC: 84,
    'HP%': 78,
    'DEF%': 74,
    RES: 72,
    ATK: 62,
    DEF: 60,
    HP: 58,
  };

  /** Innate uses sub-tier values but weaker overall role in the sum. */
  const INNATE_WEIGHT_VS_SUB = 0.38;

  const STAT_NAME_TO_TYPE = {
    HP: 1,
    'HP%': 2,
    ATK: 3,
    'ATK%': 4,
    DEF: 5,
    'DEF%': 6,
    SPD: 8,
    CRate: 9,
    CDmg: 10,
    RES: 11,
    ACC: 12,
  };

  /**
   * Main ↔ sub (directional keys `main|sub` where order matters; else sorted fallback).
   * Values above 1 = synergy bonus, below 1 = anti-synergy penalty.
   */
  const MAIN_SUB_SYNERGY = {
    'SPD|ACC': 1.1,
    'SPD|ATK%': 1.1,
    'ATK%|SPD': 1.11,
    'SPD|HP%': 1,
    'SPD|RES': 1,
    'SPD|DEF%': 1,
    'ATK%|CDmg': 1.13,
    'ATK%|CRate': 1.1,
    'ATK%|ATK': 1.1,
    'ATK%|HP%': 1,
    'ATK%|RES': 0.9,
    'ATK%|DEF%': 0.91,
    'HP%|DEF%': 1.11,
    'HP%|RES': 1.1,
    'HP%|SPD': 1.04,
    'HP%|ATK%': 1,
    'HP%|CDmg': 1,
    'HP%|HP': 1.1,
    'DEF%|HP%': 1.1,
    'DEF%|RES': 1.09,
    'DEF%|ATK%': 1,
    'DEF%|DEF': 1.1,
    'CDmg|CRate': 1.12,
    'CDmg|ATK%': 1.1,
    'CDmg|RES': 0.94,
    'CRate|CDmg': 1.12,
    'ACC|SPD': 1.1,
    'ACC|HP%': 1,
    'RES|HP%': 1.1,
  };

  /** Sub ↔ sub pairs (unordered). >1 bonus, <1 penalty. */
  const SUB_SUB_SYNERGY = {
    'CRate|CDmg': 1.12,
    'ATK%|CDmg': 1.1,
    'ATK%|CRate': 1.08,
    'SPD|ACC': 1.09,
    'SPD|CDmg': 1.07,
    'HP%|DEF%': 1.08,
    'HP%|RES': 1.07,
    'DEF%|RES': 1.06,
    'ATK%|SPD': 1.09,
    'SPD|HP%': 1,
    'ATK%|RES': 0.93,
    'ATK%|HP%': 1,
    'CDmg|RES': 0.94,
    'ACC|HP%': 1,
  };

  /** Golden triplet / archetype bonus (at most one per rune). */
  const ARCHETYPE_MUL = 1.04;
  const ARCHETYPES = [
    { id: 'Nuker', tokens: ['ATK', 'CRate', 'CDmg'] },
    { id: 'Fast Tank', tokens: ['HP', 'DEF', 'SPD'] },
    { id: 'Control', tokens: ['SPD', 'ACC', 'HP'] },
    { id: 'Bruiser', tokens: ['HP', 'CRate', 'CDmg'] },
  ];

  const DEFAULT_SYNERGY = 1;
  const DEFAULT_ANTI_SYNERGY = 0.94;
  const CROSS_STAT_DUP_MUL = 0.88;

  /** Slots 1 / 3 / 5 only roll flat mains — not penalized vs % slots. */
  const FLAT_MAIN_SLOTS = new Set([1, 3, 5]);
  const FLAT_MAIN_NAMES = new Set(['HP', 'ATK', 'DEF']);
  /** Tier for HP / ATK / DEF main on flat slots (slot-appropriate, not “wrong main”). */
  const FLAT_SLOT_MAIN_TIER = 72;

  /** Typical rune lands ~55–75 points before normalize. */
  const SCORE_CALIBRATION = 295;

  function isFlatMainSlot(slot) {
    return FLAT_MAIN_SLOTS.has(Number(slot) || 0);
  }

  function mainStatTier(main, slot) {
    if (isFlatMainSlot(slot) && FLAT_MAIN_NAMES.has(main)) return FLAT_SLOT_MAIN_TIER;
    return MAIN_STAT_VALUE[main] ?? 50;
  }

  function mainSubSynergyFallback(slot) {
    return isFlatMainSlot(slot) ? DEFAULT_SYNERGY : DEFAULT_ANTI_SYNERGY;
  }

  /** HP / ATK / DEF roots: flat and % share one base type for cross-zone dup checks. */
  function baseStatType(statName) {
    if (!statName) return '';
    if (statName === 'HP' || statName === 'HP%') return 'HP';
    if (statName === 'ATK' || statName === 'ATK%') return 'ATK';
    if (statName === 'DEF' || statName === 'DEF%') return 'DEF';
    return statName;
  }

  function statTypeId(statName, subOrRune) {
    if (subOrRune && Number(subOrRune.type) > 0) return Number(subOrRune.type);
    return STAT_NAME_TO_TYPE[statName] || 0;
  }

  function subLineValue(s) {
    const S = SWRM_REF();
    if (typeof S.subRuneValue === 'function') return S.subRuneValue(s);
    return (Number(s?.val) || 0) + (Number(s?.grind) || 0);
  }

  function maxRollForType(typeId) {
    const S = SWRM_REF();
    const m = S.SUB_MAX && S.SUB_MAX[typeId];
    return m ? m * 5 : 0;
  }

  function maxRollForMain(rune) {
    const slot = Number(rune.slot) || 0;
    const main = rune.mainName;
    const S = SWRM_REF();
    const table = S.EFF_MAIN_MAX && S.EFF_MAIN_MAX[slot];
    if (table && main && table[main]) return table[main];
    const typeId = statTypeId(main, null);
    return maxRollForType(typeId) || 1;
  }

  /** Roll quality 0–1: how much of the stat is present (not engine HR). */
  function rollQuality(value, maxRoll) {
    if (!maxRoll || maxRoll <= 0) return 0.5;
    return Math.min(1.12, Math.max(0, Number(value) / maxRoll));
  }

  function synergyKey(a, b) {
    return [a, b].sort().join('|');
  }

  function lookupSynergy(map, a, b, fallback) {
    if (!a || !b) return fallback;
    return map[synergyKey(a, b)] ?? fallback;
  }

  /** Main→sub pairs can be directional (e.g. ATK% main + SPD sub ≠ SPD main + ATK% sub). */
  function lookupMainSubSynergy(main, sub, fallback) {
    if (!main || !sub) return fallback;
    const dir = `${main}|${sub}`;
    if (MAIN_SUB_SYNERGY[dir] != null) return MAIN_SUB_SYNERGY[dir];
    return lookupSynergy(MAIN_SUB_SYNERGY, main, sub, fallback);
  }

  function qualifyingSubs(rune) {
    return (rune.substats || []).filter((s) => s && s.name && s.source !== 'innate');
  }

  function mainContribution(rune) {
    const main = rune.mainName;
    if (!main) return 0;
    const slot = Number(rune.slot) || 0;
    const intrinsic = mainStatTier(main, slot);
    const q = rollQuality(Number(rune.mainVal) || 0, maxRollForMain(rune));
    return intrinsic * q;
  }

  function subContribution(sub, slot) {
    const name = sub.name;
    const intrinsic = SUB_STAT_VALUE[name] ?? 45;
    const typeId = statTypeId(name, sub);
    const q = rollQuality(subLineValue(sub), maxRollForType(typeId));
    let slotMul = 1;
    const flatOnPercentSlot =
      (slot === 2 || slot === 4 || slot === 6) && (typeId === 1 || typeId === 3 || typeId === 5);
    if (flatOnPercentSlot) slotMul = 0.88;
    return intrinsic * q * slotMul;
  }

  function innateContribution(rune) {
    const name = rune.innate_name;
    if (!name) return 0;
    const intrinsic = (SUB_STAT_VALUE[name] ?? 45) * INNATE_WEIGHT_VS_SUB;
    const typeId = statTypeId(name, { type: rune.innate_type });
    const q = rollQuality(Number(rune.innate_val) || 0, maxRollForType(typeId));
    return intrinsic * q;
  }

  function innateRollQuality(rune) {
    const name = rune.innate_name;
    if (!name) return 0;
    const typeId = statTypeId(name, { type: rune.innate_type });
    return rollQuality(Number(rune.innate_val) || 0, maxRollForType(typeId));
  }

  function mainSubSynergyFactor(main, subs, slot) {
    if (!main || !subs.length) return 1;
    const fallback = mainSubSynergyFallback(slot);
    let sum = 0;
    let n = 0;
    for (const s of subs) {
      sum += lookupMainSubSynergy(main, s.name, fallback);
      n += 1;
    }
    return n ? sum / n : 1;
  }

  function subSubSynergyFactor(subs) {
    const names = subs.map((s) => s.name).filter(Boolean);
    if (names.length < 2) return 1;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        sum += lookupSynergy(SUB_SUB_SYNERGY, names[i], names[j], DEFAULT_SYNERGY);
        n += 1;
      }
    }
    if (!n) return 1;
    return sum / n;
  }

  /**
   * Cross-zone duplicate: same base stat on main, innate, and/or subs (ATK + ATK% = one type).
   * 0.88^overlaps where overlap = main↔sub OR main↔innate OR innate↔sub (each at most once).
   */
  function duplicateSubPenalty(rune) {
    const mainBase = baseStatType(rune.mainName);
    const innateBase = baseStatType(rune.innate_name);
    const subs = qualifyingSubs(rune);
    let overlaps = 0;

    if (mainBase) {
      if (subs.some((s) => baseStatType(s.name) === mainBase)) overlaps += 1;
      if (innateBase && innateBase === mainBase) overlaps += 1;
    }
    if (innateBase && subs.some((s) => baseStatType(s.name) === innateBase)) overlaps += 1;

    if (!overlaps) return 1;
    return Math.pow(CROSS_STAT_DUP_MUL, overlaps);
  }

  function archetypeLabel(id, t) {
    const loc = t || {};
    const map = {
      Nuker: loc.archetypeNuker || 'Nuker',
      'Fast Tank': loc.archetypeFastTank || 'Fast Tank',
      Control: loc.archetypeControl || 'Control',
      Bruiser: loc.archetypeBruiser || 'Bruiser',
    };
    return map[id] || id;
  }

  function collectArchetypeStatKeys(rune) {
    const keys = new Set();
    if (rune.mainName) keys.add(baseStatType(rune.mainName));
    for (const s of qualifyingSubs(rune)) {
      if (s.name) keys.add(baseStatType(s.name));
    }
    if (rune.innate_name && innateRollQuality(rune) > 0.5) {
      keys.add(baseStatType(rune.innate_name));
    }
    return keys;
  }

  /** First matching archetype wins; bonus applied at most once. */
  function archetypeFactor(rune, t) {
    const keys = collectArchetypeStatKeys(rune);
    for (const arch of ARCHETYPES) {
      if (arch.tokens.every((tok) => keys.has(tok))) {
        return {
          mul: ARCHETYPE_MUL,
          name: archetypeLabel(arch.id, t),
          id: arch.id,
        };
      }
    }
    return { mul: 1, name: '', id: '' };
  }

  function computeForgeScoreBreakdown(rune, t) {
    if (!rune) {
      return {
        total: 0,
        mainPts: 0,
        subPts: 0,
        innatePts: 0,
        mainSubSyn: 1,
        subSubSyn: 1,
        dupSub: 1,
        archetypeMul: 1,
        archetypeName: '',
      };
    }
    const main = rune.mainName || '';
    const subs = qualifyingSubs(rune);
    const slot = Number(rune.slot) || 0;

    const mainPts = mainContribution(rune);
    const subPts = subs.reduce((acc, s) => acc + subContribution(s, slot), 0);
    const innatePts = innateContribution(rune);

    const mainSubSyn = mainSubSynergyFactor(main, subs, slot);
    const subSubSyn = subSubSynergyFactor(subs);
    const dupSub = duplicateSubPenalty(rune);
    const arch = archetypeFactor(rune, t);

    const raw =
      (mainPts + subPts + innatePts) * mainSubSyn * subSubSyn * dupSub * arch.mul;
    const total = Math.max(0, Math.min(100, Math.round((raw / SCORE_CALIBRATION) * 100)));

    return {
      total,
      mainPts: Math.round(mainPts),
      subPts: Math.round(subPts),
      innatePts: Math.round(innatePts),
      mainSubSyn: Math.round(mainSubSyn * 100) / 100,
      subSubSyn: Math.round(subSubSyn * 100) / 100,
      dupSub: Math.round(dupSub * 100) / 100,
      archetypeMul: Math.round(arch.mul * 100) / 100,
      archetypeName: arch.name,
    };
  }

  function computeForgeScore(rune, t) {
    return computeForgeScoreBreakdown(rune, t).total;
  }

  function computeRuneScore(rune, t) {
    return computeForgeScore(rune, t);
  }

  function runeScoreBreakdown(rune, t) {
    return computeForgeScoreBreakdown(rune, t);
  }

  function formatForgeScoreTooltip(b, t) {
    const loc = t || {};
    const archetypeSuffix =
      b.archetypeMul > 1 && b.archetypeName
        ? (loc.forgeScoreTooltipArchetype || ' · archetype ×{mul} ({name})')
            .replace(/\{mul\}/g, String(b.archetypeMul))
            .replace(/\{name\}/g, String(b.archetypeName))
        : '';
    const tpl =
      loc.forgeScoreTooltip ||
      'Main {mainPts} pts · Subs {subPts} · Innate {innatePts}. Synergy main↔sub ×{ms} · sub↔sub ×{ss} · cross-stat dup ×{dup}{archetypeSuffix}. Stat tiers + roll size — not Eff% or verdict.';
    return tpl
      .replace(/\{mainPts\}/g, String(b.mainPts))
      .replace(/\{subPts\}/g, String(b.subPts))
      .replace(/\{innatePts\}/g, String(b.innatePts))
      .replace(/\{ms\}/g, String(b.mainSubSyn))
      .replace(/\{ss\}/g, String(b.subSubSyn))
      .replace(/\{dup\}/g, String(b.dupSub))
      .replace(/\{archetypeSuffix\}/g, archetypeSuffix);
  }

  function runeScoreTooltip(r, t) {
    const b = runeScoreBreakdown(r, t);
    return formatForgeScoreTooltip(b, t || {});
  }

  function runeScoreTier(score) {
    const n = Number(score) || 0;
    if (n >= 88) return 'stat-chip--score-hi';
    if (n >= 72) return 'stat-chip--score-mid';
    return 'stat-chip--score-lo';
  }

  const S = SWRM_REF();
  if (S) {
    S.computeForgeScore = computeForgeScore;
    S.computeForgeScoreBreakdown = computeForgeScoreBreakdown;
    S.formatForgeScoreTooltip = formatForgeScoreTooltip;
    S.FORGE_SCORE_MAIN_VALUE = MAIN_STAT_VALUE;
    S.FORGE_SCORE_SUB_VALUE = SUB_STAT_VALUE;
    S.FORGE_SCORE_ARCHETYPES = ARCHETYPES;
  }

  function highlightSearchInPlain(text, qRaw) {
    const q = (qRaw || '').trim().toLowerCase();
    const t = String(text ?? '');
    if (!q) return escapeHtml(t);
    const tl = t.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < t.length) {
      const idx = tl.indexOf(q, i);
      if (idx === -1) {
        parts.push(escapeHtml(t.slice(i)));
        break;
      }
      if (idx > i) parts.push(escapeHtml(t.slice(i, idx)));
      parts.push(`<mark class="search-hit">${escapeHtml(t.slice(idx, idx + q.length))}</mark>`);
      i = idx + q.length;
    }
    return parts.join('');
  }

  function roleDisplayName(role) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (role === 'God Roll' || role === 'High Roll') return t.roleGodRoll || 'God Roll';
    return role || '';
  }

  function sellReasonText(r) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const code = r.sellReasonCode || '';
    const roleLbl = roleDisplayName(r.sellReasonDetail || '');
    const roleTpl = (tpl) => (tpl || '').replace(/\{role\}/g, roleLbl);
    if (!code) return t.sellReasonNoRole || 'No matching role';
    if (code === 'duo_near') return t.sellReasonDuoNear || '';
    if (code === 'exclude') return roleTpl(t.sellReasonExclude || 'Exclude stat blocks {role}');
    if (code === 'main_stat') return roleTpl(t.sellReasonMainStat || 'Main stat not accepted for {role}');
    if (code === 'must_have') return roleTpl(t.sellReasonMustHave || 'Missing required stat for {role}');
    if (code === 'anchor_hr') return roleTpl(t.sellReasonAnchor || 'No high-roll anchor for {role}');
    if (code === 'min_stats') return roleTpl(t.sellReasonMinStats || 'Too few supporting subs for {role}');
    if (code === 'role_pressure') return roleTpl(t.sellReasonPressure || 'Substats too weak for {role}');
    if (code === 'slot_req') return roleTpl(t.sellReasonSlotReq || 'Slot requirement failed for {role}');
    if (code === 'slow_dps_core') return roleTpl(t.sellReasonSlowDps || 'Core DPS stats too low for {role}');
    if (code === 'near_miss') return roleTpl(t.sellReasonNearMiss || 'Close to {role}, preset rules not met');
    if (code === 'bad_flat') return t.sellReasonBadFlat || '';
    if (code === 'low_eff') return t.sellReasonLowEff || '';
    if (code === 'low_eff_finish') return t.sellReasonLowEffFinish || '';
    return t.sellReasonNoRole || 'No matching role';
  }

  function runeTargetText(r) {
    const tl = TRANSLATIONS[currentLang];
    const v = r.verdict || '';
    if (v === 'Sell') return sellReasonText(r);
    if (v === 'Grind') {
      const g = r.grindInfo;
      if (g && g.can && g.stat) {
        if (typeof g.from === 'number' && typeof g.need === 'number') {
          const from = Math.ceil(g.from);
          const need = Math.ceil(g.need);
          const maxTo = typeof g.to === 'number' ? Math.ceil(g.to) : null;
          if (maxTo != null) {
            return `${g.stat} ${from}→${need} (max ${maxTo})`;
          }
          return `${g.stat} ${from}→${need}`;
        }
        return g.stat;
      }
      return '';
    }
    if (v === 'Gem') {
      const subs = Array.isArray(r.gemInfo?.badFlatSubs)
        ? r.gemInfo.badFlatSubs.filter(Boolean)
        : [];
      if (subs.length > 0) {
        const verb = tl.targetGemReplaceVerb || 'Replace';
        const sep = tl.targetGemReplaceOr || ' or ';
        return `${verb} ${subs.join(sep)}`;
      }
      return '';
    }
    if (v === 'Upgrade') return tl.actionTargetUpgrade;
    if (v === 'Finish') return tl.actionTargetFinish;
    if (v === 'Reapp') return tl.actionTargetReapp;
    if (v === 'Keep' && r && r.decisionTrace) {
      const dt = r.decisionTrace || {};
      const strict = !!dt.strictFormulaMatch;
      const policy = !!dt.policyFormulaMatch;
      const strictRole = dt.strictBestFormula || '';
      const policyRole = dt.policyBestFormula || dt.bestRole || '';
      const fitScore = Number(r.fitSummary?.bestScore || 0);
      const tier = fitScore >= 75 ? 'Excellent' : fitScore >= 60 ? 'Good' : 'Usable';
      const fit = Number.isFinite(fitScore) && fitScore > 0 ? `Fit ${Math.round(fitScore)}` : '';

      if (r.policyRelaxedRole) {
        const base = `${roleDisplayName(r.policyRelaxedRole)} · ${tier} (Relaxed)`;
        return fit ? `${base} · ${fit}` : base;
      }

      if ((policyRole || '') === 'Universal' || r.universalSource) {
        if (String(r.universalSource) === 'God') {
          const src = 'High Value · God';
          return fit ? `${src} · ${fit}` : src;
        }
        if (String(r.universalSource) === 'Duo') {
          const src = 'High Value · Duo';
          return fit ? `${src} · ${fit}` : src;
        }
        const src = 'High Value';
        return fit ? `${src} · ${fit}` : src;
      }

      if (!strict && policy && policyRole) {
        const base = `${roleDisplayName(policyRole)} · ${tier} (Flexible)`;
        return fit ? `${base} · ${fit}` : base;
      }
      if (strictRole) {
        const base = `${roleDisplayName(strictRole)} · ${tier} (Strict)`;
        return fit ? `${base} · ${fit}` : base;
      }
    }
    return '';
  }

  /** Raw grindInfo / gemInfo fields for native tooltip on Target cell (Grind/Gem). */
  function runeEngineDetailTooltip(r) {
    const tl = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [];
    const v = r.verdict || '';
    if (v === 'Grind' && r.grindInfo && typeof r.grindInfo === 'object') {
      parts.push(tl.tableTooltipGrind || 'Grind');
      Object.keys(r.grindInfo).sort().forEach((k) => {
        const val = r.grindInfo[k];
        if (val === undefined || val === null || val === '') return;
        parts.push(`${k}=${val}`);
      });
    } else if (v === 'Gem' && r.gemInfo && typeof r.gemInfo === 'object') {
      parts.push(tl.tableTooltipGem || 'Gem');
      Object.keys(r.gemInfo).sort().forEach((k) => {
        const val = r.gemInfo[k];
        if (val === undefined || val === null || val === '') return;
        parts.push(`${k}=${val}`);
      });
    }
    if (v === 'Keep' && r && r.fitSummary && Number(r.fitSummary.bestScore || 0) > 0) {
      parts.push(`Fit Score: ${Math.round(Number(r.fitSummary.bestScore || 0))}`);
      parts.push('Fit Score — how well the rune stats fit this role');
    }
    return parts.join('\n');
  }

  /** Counter‑clockwise circular arrows (gem / replaced sub) — stroke reads clearly at small sizes. */
  const STAT_SUB_GEM_ICON_SVG =
    '<svg class="table-stat-gem-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M1 4v6h6"/>'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M23 20v-6h-6"/>'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>'
    + '</svg>';

  /** Plain table text (no chip) — set / main / innate / subs / target */
  function tableStatLine(innerHtml, opts) {
    const setCls = opts && opts.set ? ' table-stat--set' : '';
    const gemOnlyCls = opts && opts.gemOnly ? ' table-stat--gem-only' : '';
    const tipAttr = opts && opts.tip ? ` title="${escapeAttr(opts.tip)}"` : '';
    const gemSvg = opts && opts.gem ? STAT_SUB_GEM_ICON_SVG : '';
    return `<span class="table-stat${setCls}${gemOnlyCls}"${tipAttr}>${innerHtml}${gemSvg}</span>`;
  }

  function renderSubStat(s) {
    if (!s || !s.name) return '';
    const grindAmt = Number(s.grind) || 0;
    const gemMarked = !!(s.enchanted || (Number(s.gem) || 0) !== 0);
    const total = subLineTotal(s);
    const showGrindSuffix = grindAmt > 0;
    const valShown = showGrindSuffix ? `${total} [${grindAmt}]` : String(total);
    const plain = `${s.name} ${valShown}`;
    const inner = highlightSearchInPlain(plain, tableSearchHighlight);
    const grindCls = showGrindSuffix ? ' table-stat__text--grind' : '';
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const tipParts = [];
    if (showGrindSuffix) {
      tipParts.push((tloc.tableSubGrindTooltip || '').replace(/\{n\}/g, String(grindAmt)));
    }
    if (gemMarked) tipParts.push(tloc.tableSubGemTooltip || '');
    const tip = tipParts.filter(Boolean).join(' ');
    return tableStatLine(`<span class="table-stat__text${grindCls}">${inner}</span>`, {
      tip,
      gem: gemMarked,
      gemOnly: gemMarked && !showGrindSuffix,
    });
  }

  function roleClass(role) {
    const m = {
      'God Roll':'godroll','High Roll':'godroll','Bruiser':'bruiser','Fast CC':'fastcc',
      'Classic DPS':'classicdps','Slow DPS':'slowdps','Bomber':'bomber',
      'Tank':'tank','Duo Roll':'duoroll'
    };
    return m[role] || '';
  }

  function runeRow(r) {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const gradeKey = r.gradeStr;
    const gradeClass = { Legend: 'legend', Hero: 'hero', Rare: 'rare' }[gradeKey] || 'grade-tag--other';
    const gradeLabel = { Legend: 'Legend', Hero: 'Hero', Rare: 'Rare' }[gradeKey] || String(r.gradeStr);
    const gradeLabelHtml = highlightSearchInPlain(gradeLabel, tableSearchHighlight);
    const ancientTipRaw = tloc.tableAncientBadgeTitle || '';
    const ancientTipAttr = r.isAncient && ancientTipRaw ? ` title="${escapeAttr(ancientTipRaw)}"` : '';
    const ancientLbl = escapeAttr(tloc.tableAncientBadge || 'Ancient');
    const gradeAria = r.isAncient ? ` aria-label="${ancientLbl}, ${escapeAttr(gradeLabel)}"` : '';
    const grade = `<span class="grade-tag ${gradeClass}${r.isAncient ? ' grade-tag--ancient' : ''}"${ancientTipAttr}${gradeAria}><span class="grade-tag__lbl">${gradeLabelHtml}</span></span>`;

    const tScore = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const effDisplay =
      typeof getRuneDisplayEff === 'function'
        ? getRuneDisplayEff(r)
        : Math.min(100, Number(r.eff) || 0);
    const effShown = `${(Math.round(effDisplay * 10) / 10).toFixed(1)}%`;
    const scoreNum =
      typeof computeRuneScore === 'function' ? computeRuneScore(r, tScore) : 0;
    const scoreTier = typeof runeScoreTier === 'function' ? runeScoreTier(scoreNum) : 'stat-chip--score-lo';
    const scoreShown = String(scoreNum);
    const scoreTitle = escapeAttr(
      typeof runeScoreTooltip === 'function'
        ? runeScoreTooltip(r, tScore)
        : tScore.tableScoreHint || '',
    );
    const rCls = roleClass(r.role);
    const subs   = r.substats.slice(0, 4);
    const innate = r.innate_name ? `${r.innate_name} ${r.innate_val}` : '';
    const innateHtml = innate
      ? tableStatLine(highlightSearchInPlain(innate, tableSearchHighlight))
      : '';
    const target = runeTargetText(r);
    const targetHtml = target
      ? tableStatLine(highlightSearchInPlain(target, tableSearchHighlight))
      : '';
    const targetTipRaw = runeEngineDetailTooltip(r);
    const targetTipAttr = targetTipRaw ? ` title="${escapeAttr(targetTipRaw)}"` : '';
    const mainInner = highlightSearchInPlain(r.mainName, tableSearchHighlight);
    const roleText = roleDisplayName((r.role || '').trim());
    const roleHtml = roleText
      ? `<span class="role-tag ${rCls}">${highlightSearchInPlain(roleText, tableSearchHighlight)}</span>`
      : '';
    const verdictText = (r.verdict || '').trim();
    const verdictHtml = verdictText
      ? `<span class="verdict-tag ${verdictText.toLowerCase()}">${highlightSearchInPlain(verdictText, tableSearchHighlight)}</span>`
      : '';

    const subCell = (sub, first) => {
      const inner = sub ? renderSubStat(sub) : '';
      const cls = first ? 'col-sub col-sub-first' : 'col-sub';
      return `<td class="${cls}">${inner}</td>`;
    };

    return `<tr>
      <td class="col-grade">${grade}</td>
      <td class="col-set col-text">${tableStatLine(highlightSearchInPlain(r.setName, tableSearchHighlight), { set: true })}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.level), tableSearchHighlight)}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.slot), tableSearchHighlight)}</td>
      <td class="col-text">${tableStatLine(mainInner)}</td>
      <td class="col-text">${innateHtml}</td>
      ${subCell(subs[0], true)}
      ${subCell(subs[1], false)}
      ${subCell(subs[2], false)}
      ${subCell(subs[3], false)}
      <td class="col-num td-num td-num--score" title="${scoreTitle}"><span class="stat-chip stat-chip--score ${scoreTier}">${highlightSearchInPlain(scoreShown, tableSearchHighlight)}</span></td>
      <td class="col-num td-num td-num--eff"><span class="rune-eff-muted">${highlightSearchInPlain(effShown, tableSearchHighlight)}</span></td>
      <td class="col-text">${roleHtml}</td>
      <td class="col-text">${verdictHtml}</td>
      <td class="target-col-cell col-text"${targetTipAttr}>${targetHtml}</td>
    </tr>`;
  }

  let filteredRunes = [];

  function computeRuneTableSummary(runes) {
    const list = runes || [];
    let ancient = 0;
    let equipped = 0;
    let plus15 = 0;
    let keep = 0;
    for (const r of list) {
      if (r.isAncient) ancient += 1;
      if (r.equipped_name != null && Number.isFinite(Number(r.equipped_name))) equipped += 1;
      if (Number(r.level) >= 15) plus15 += 1;
      if (r.verdict === 'Keep') keep += 1;
    }
    return { total: list.length, ancient, equipped, plus15, keep };
  }

  function renderRuneTableRosterChips() {
    const host = document.getElementById('rune-table-roster-chips');
    const meta = document.getElementById('rune-table-roster-meta');
    if (!host) return;
    const pool = typeof getVisibleRunes === 'function' ? getVisibleRunes() : [];
    if (!pool.length) {
      host.innerHTML = '';
      if (meta) meta.hidden = true;
      return;
    }
    if (meta) meta.hidden = false;
    const sum = computeRuneTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.runeChipTotal || 'Runes', value: sum.total },
      { label: t.runeChipAncient || 'Ancient', value: sum.ancient },
      { label: t.runeChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.runeChipPlus15 || '+15', value: sum.plus15 },
    ];
    if (sum.keep > 0) {
      parts.push({ label: t.runeChipKeep || 'Keep', value: sum.keep });
    }
    host.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
  }

  function runeTableTargetColumnVisible() {
    const verdictFilter = document.getElementById('filter-verdict')?.value || '';
    if (verdictFilter === 'Grind' || verdictFilter === 'Gem') return true;
    return !readRuneTableHideTarget() && !document.getElementById('toggle-target-col')?.checked;
  }

  function applyRuneTableTargetColumnVisibility() {
    const show = runeTableTargetColumnVisible();
    document.getElementById('target-col-header')?.classList.toggle('hidden', !show);
    document.getElementById('target-filter-cell')?.classList.toggle('hidden', !show);
    document.getElementById('rune-table')?.classList.toggle('show-target', show);
  }

  function buildRuneTableQuerySuffix() {
    const p = new URLSearchParams();
    const q = (document.getElementById('search-box')?.value || '').trim();
    if (q) p.set('q', q);
    const fv = document.getElementById('filter-verdict')?.value;
    if (fv) p.set('verdict', fv);
    const fr = document.getElementById('filter-role')?.value;
    if (fr) p.set('role', fr);
    const fg = document.getElementById('filter-grade')?.value;
    if (fg) p.set('grade', fg);
    const fs = document.getElementById('filter-set')?.value;
    if (fs) p.set('set', fs);
    const fsl = document.getElementById('filter-slot')?.value;
    if (fsl) p.set('slot', fsl);
    const fm = document.getElementById('filter-main')?.value;
    if (fm) p.set('main', fm);
    if (sortKey !== 'score') p.set('sort', sortKey);
    if (sortDir !== 'desc') p.set('dir', sortDir);
    if (document.getElementById('toggle-target-col')?.checked) p.set('target', '0');
    if (document.getElementById('toggle-ancient-only')?.checked) p.set('ancient', '1');
    if (runeTableShowAll) p.set('all', '1');
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  function replaceRuneTableLocationFromState() {
    if (runeTableApplyingHash) return;
    if (!isRuneTablePaneVisible()) return;
    try {
      const base = window.location.pathname + window.location.search;
      const suf = buildRuneTableQuerySuffix();
      history.replaceState(null, '', `${base}#runetable${suf}`);
    } catch (e) { /* ignore */ }
  }

  function applyRuneTableQueryParams(params) {
    if (!params) return;
    const keys = [...params.keys()];
    if (!keys.length) return;
    runeTableApplyingHash = true;
    try {
      if (params.has('q')) document.getElementById('search-box').value = params.get('q');
      if (params.has('verdict')) document.getElementById('filter-verdict').value = params.get('verdict');
      if (params.has('role')) document.getElementById('filter-role').value = params.get('role');
      if (params.has('grade')) document.getElementById('filter-grade').value = params.get('grade');
      if (params.has('set')) document.getElementById('filter-set').value = params.get('set');
      if (params.has('slot')) document.getElementById('filter-slot').value = params.get('slot');
      if (params.has('main')) document.getElementById('filter-main').value = params.get('main');
      const sk = params.get('sort');
      if (sk && RUNE_TABLE_SORT_KEYS.has(sk)) sortKey = sk;
      const sd = params.get('dir');
      if (sd === 'asc' || sd === 'desc') sortDir = sd;
      if (params.has('target')) {
        const hide = params.get('target') === '0';
        const tgl = document.getElementById('toggle-target-col');
        if (tgl) tgl.checked = hide;
        try {
          localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, hide ? '1' : '0');
        } catch (e) { /* ignore */ }
      }
      if (params.has('ancient')) {
        const on = params.get('ancient') === '1';
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = on;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, on ? '1' : '0');
      }
      if (params.has('all')) runeTableShowAll = params.get('all') === '1';
      else runeTableShowAll = false;
      applyRuneTableTargetColumnVisibility();
    } finally {
      runeTableApplyingHash = false;
      applyRuneTableEffHeader();
    }
  }

  const RUNE_FILTER_SELECT_IDS = {
    grade: 'filter-grade',
    set: 'filter-set',
    slot: 'filter-slot',
    main: 'filter-main',
    role: 'filter-role',
    verdict: 'filter-verdict',
  };

  function readRuneTableFiltersFromDom() {
    return {
      verdict: document.getElementById('filter-verdict')?.value || '',
      role: document.getElementById('filter-role')?.value || '',
      grade: document.getElementById('filter-grade')?.value || '',
      set: document.getElementById('filter-set')?.value || '',
      slot: document.getElementById('filter-slot')?.value || '',
      main: document.getElementById('filter-main')?.value || '',
      ancientOnly: !!document.getElementById('toggle-ancient-only')?.checked,
      hideTarget: !!document.getElementById('toggle-target-col')?.checked,
    };
  }

  function countRuneTableActiveFilters(f) {
    let n = 0;
    if (f.verdict) n += 1;
    if (f.role) n += 1;
    if (f.grade) n += 1;
    if (f.set) n += 1;
    if (f.slot) n += 1;
    if (f.main) n += 1;
    if (f.ancientOnly) n += 1;
    if (f.hideTarget) n += 1;
    return n;
  }

  function runeTableFilterChipDefs(f, t) {
    const chips = [];
    if (f.verdict) chips.push({ key: 'verdict', label: verdictUiLabel(t, f.verdict) || f.verdict });
    if (f.role) chips.push({ key: 'role', label: f.role });
    if (f.grade) chips.push({ key: 'grade', label: f.grade });
    if (f.set) chips.push({ key: 'set', label: f.set });
    if (f.slot) chips.push({ key: 'slot', label: `${t.runeFilterSlot || 'Slot'} ${f.slot}` });
    if (f.main) chips.push({ key: 'main', label: f.main });
    if (f.ancientOnly) chips.push({ key: 'ancientOnly', label: t.tableAncientOnly || 'Ancient only' });
    if (f.hideTarget) chips.push({ key: 'hideTarget', label: t.toggleTargetCol || 'Hide Target' });
    return chips;
  }

  function clearRuneTableFilterChip(key) {
    switch (key) {
      case 'verdict':
        document.getElementById('filter-verdict').value = '';
        break;
      case 'role':
        document.getElementById('filter-role').value = '';
        break;
      case 'grade':
        document.getElementById('filter-grade').value = '';
        break;
      case 'set':
        document.getElementById('filter-set').value = '';
        break;
      case 'slot':
        document.getElementById('filter-slot').value = '';
        break;
      case 'main':
        document.getElementById('filter-main').value = '';
        break;
      case 'ancientOnly': {
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = false;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
        break;
      }
      case 'hideTarget': {
        const tgl = document.getElementById('toggle-target-col');
        if (tgl) tgl.checked = false;
        try {
          localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
        } catch (e) { /* ignore */ }
        applyRuneTableTargetColumnVisibility();
        break;
      }
      default:
        break;
    }
  }

  function renderRuneTableActiveFilterChips() {
    const row = document.getElementById('rune-table-active-filters');
    const host = document.getElementById('rune-table-filter-chips');
    if (!row || !host) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const chips = runeTableFilterChipDefs(readRuneTableFiltersFromDom(), t);
    if (!chips.length) {
      host.innerHTML = '';
      row.hidden = true;
      return;
    }
    row.hidden = false;
    host.innerHTML = chips
      .map(
        (c) =>
          `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-rune-filter-chip-remove="${escapeHtml(c.key)}" aria-label="Remove">✕</button></span>`,
      )
      .join('');
  }

  function updateRuneTableFilterSummary() {
    const f = readRuneTableFiltersFromDom();
    const n = countRuneTableActiveFilters(f);
    const countEl = document.getElementById('rune-filters-active-count');
    const moreBtn = document.getElementById('rune-more-filters-btn');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const activeTpl = t.runeTableFiltersActive || '{n}';
    if (countEl) {
      countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
      countEl.hidden = !n;
    }
    if (moreBtn) moreBtn.classList.toggle('monsters-toolbar-btn--filters-active', n > 0);
    renderRuneTableActiveFilterChips();
  }

  function updateRuneTableFilterIndicators() {
    const f = readRuneTableFiltersFromDom();
    document.querySelectorAll('#rune-table thead [data-filter-key]').forEach((th) => {
      const key = th.getAttribute('data-filter-key');
      const id = RUNE_FILTER_SELECT_IDS[key];
      const sel = id ? document.getElementById(id) : null;
      const on = !!(sel && sel.value);
      th.classList.toggle('th--filtered', on);
      const textEl = th.querySelector('.th-text');
      if (textEl) textEl.classList.toggle('th-text--filtered', on);
    });
    updateRuneTableFilterSummary();
  }

  function resetRuneTableFilters() {
    const sb = document.getElementById('search-box');
    if (sb) sb.value = '';
    const fv = document.getElementById('filter-verdict');
    if (fv) fv.value = '';
    const fr = document.getElementById('filter-role');
    if (fr) fr.value = '';
    const fg = document.getElementById('filter-grade');
    if (fg) fg.value = '';
    const fs = document.getElementById('filter-set');
    if (fs) fs.value = '';
    const fsl = document.getElementById('filter-slot');
    if (fsl) fsl.value = '';
    const fm = document.getElementById('filter-main');
    if (fm) fm.value = '';
    const tgl = document.getElementById('toggle-target-col');
    if (tgl) tgl.checked = false;
    try {
      localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
    } catch (e) { /* ignore */ }
    const tglAncient = document.getElementById('toggle-ancient-only');
    if (tglAncient) tglAncient.checked = false;
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
    applyRuneTableTargetColumnVisibility();
    sortKey = 'score';
    sortDir = 'desc';
    runeTableShowAll = false;
    if (typeof setRuneTableMonsterMasterId === 'function') setRuneTableMonsterMasterId(null);
    updateSortHeaderClasses();
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes());
  }

  /** When set, Rune Table shows only runes equipped on this unit_master_id. */
  let runeTableMonsterMasterId = null;

  function setRuneTableMonsterMasterId(masterId) {
    runeTableMonsterMasterId =
      masterId != null && Number.isFinite(Number(masterId)) ? Number(masterId) : null;
  }

  function clearRuneTableMonsterMasterId() {
    setRuneTableMonsterMasterId(null);
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  }

  function applyFiltersAndSort(runes, opts) {
    if (!opts || !opts.preserveTableExpansion) {
      runeTableShowAll = false;
    }
    const search  = (document.getElementById('search-box')?.value || '').toLowerCase();
    tableSearchHighlight = search;
    const tTable = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const verdict = document.getElementById('filter-verdict')?.value || '';
    const role    = document.getElementById('filter-role')?.value    || '';
    const grade   = document.getElementById('filter-grade')?.value   || '';
    const setName = document.getElementById('filter-set')?.value || '';
    const slotVal = document.getElementById('filter-slot')?.value || '';
    const mainVal = document.getElementById('filter-main')?.value || '';
    const ancientOnly = !!document.getElementById('toggle-ancient-only')?.checked;

    filteredRunes = runes.filter(r => {
      if (runeTableMonsterMasterId != null) {
        const eq = r.equipped_name != null ? Number(r.equipped_name) : NaN;
        if (eq !== runeTableMonsterMasterId) return false;
      }
      if (ancientOnly && !r.isAncient) return false;
      if (verdict && r.verdict !== verdict) return false;
      if (role) {
        if (role === 'God Roll') {
          if (r.role !== 'God Roll' && r.role !== 'High Roll') return false;
        } else if (r.role !== role) return false;
      }
      if (grade   && r.gradeStr !== grade)  return false;
      if (setName && r.setName !== setName) return false;
      if (slotVal && String(r.slot) !== slotVal) return false;
      if (mainVal && r.mainName !== mainVal) return false;
      if (search) {
        const subParts = (r.substats || []).flatMap((s) => {
          const total = subLineTotal(s);
          const grind = Number(s.grind) || 0;
          return [s.name, String(total), grind > 0 ? String(s.val ?? '') : ''];
        });
        const ancientTokens = r.isAncient
          ? [String(tTable.tableAncientBadge || 'Ancient'), 'ancient']
          : [];
        const haystack = [
          r.setName, r.mainName, r.gradeStr, r.role, r.verdict,
          r.innate_name, String(r.innate_val ?? ''),
          ...ancientTokens,
          ...subParts,
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    sortRunesInPlace(filteredRunes, sortKey, sortDir);

    const tbody = document.getElementById('rune-tbody');
    if (!tbody) return;
    const total = filteredRunes.length;
    const cap = runeTableShowAll ? total : Math.min(RUNE_TABLE_PAGE, total);
    const rows = filteredRunes.slice(0, cap);

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const countEl = document.getElementById('table-count');
    if (countEl) {
      if (!runeTableShowAll && total > RUNE_TABLE_PAGE) {
        const tmpl = t.runeTableCountCapped || '{shown} / {total}';
        countEl.textContent = tmpl
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total));
      } else {
        countEl.textContent = `${total} ${t.runes}`;
      }
    }

    applyRuneTableTargetColumnVisibility();
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    setupRuneTableMoreUi(total, rows.length);
    updateRuneTableFilterIndicators();
    if (typeof renderRuneTableRosterChips === 'function') renderRuneTableRosterChips();
    replaceRuneTableLocationFromState();
  }

  function bindRuneTableFiltersDrawer() {
    const onFilter = () => {
      updateRuneTableFilterIndicators();
      applyFiltersAndSort(getVisibleRunes());
    };

    bindFiltersPopover('rune-more-filters-btn', 'rune-filters-popover', { onClose: onFilter });

    document.getElementById('rune-filters-drawer-reset')?.addEventListener('click', () => {
      ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const tgl = document.getElementById('toggle-target-col');
      if (tgl) tgl.checked = false;
      try {
        localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
      } catch (e) { /* ignore */ }
      const tglAncient = document.getElementById('toggle-ancient-only');
      if (tglAncient) tglAncient.checked = false;
      localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
      applyRuneTableTargetColumnVisibility();
      onFilter();
    });
    document.getElementById('rune-table-filter-chips')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rune-filter-chip-remove]');
      if (!btn) return;
      clearRuneTableFilterChip(btn.getAttribute('data-rune-filter-chip-remove'));
      onFilter();
    });

    ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', onFilter);
    });
  }

  bindRuneTableFiltersDrawer();

  const TABLE_KIND_IDS = ['runes', 'artifacts', 'relics'];
  const TABLE_KIND_STORAGE_KEY = 'swrm_table_kind_v1';
  let tableKindTabsBound = false;

  function normalizeTableKind(id) {
    return TABLE_KIND_IDS.includes(id) ? id : 'runes';
  }

  function readTableKind() {
    try {
      const v = sessionStorage.getItem(TABLE_KIND_STORAGE_KEY);
      return normalizeTableKind(v || 'runes');
    } catch (e) {
      return 'runes';
    }
  }

  function writeTableKind(id) {
    try {
      sessionStorage.setItem(TABLE_KIND_STORAGE_KEY, normalizeTableKind(id));
    } catch (e) { /* ignore */ }
  }

  function gearMonsterNameFromMasterId(masterId) {
    const mid = Number(masterId);
    if (!Number.isFinite(mid) || mid <= 0) return '';
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.monsterDisplayName === 'function') {
      const n = db.monsterDisplayName(mid);
      if (n && !String(n).startsWith('#')) return String(n);
    }
    return '';
  }

  function gearUnitByOccupiedId(occupiedId) {
    const id = Number(occupiedId);
    if (!Number.isFinite(id) || id === 0) return null;
    const units = allUnits || [];
    let u = units.find((x) => Number(x.unitId) === id);
    if (!u) u = units.find((x) => Number(x.masterId) === id);
    if (!u && activeSwexJson && Array.isArray(activeSwexJson.unit_list)) {
      const raw = activeSwexJson.unit_list.find(
        (x) => x && (Number(x.unit_id) === id || Number(x.unit_master_id) === id),
      );
      if (raw) {
        u = {
          unitId: raw.unit_id,
          masterId: Number(raw.unit_master_id),
        };
      }
    }
    return u || null;
  }

  function gearLocationLabel(occupiedId, t) {
    const inv = t.tableGearInventory || 'Inventory';
    if (occupiedId == null || !Number.isFinite(Number(occupiedId)) || Number(occupiedId) === 0) {
      return inv;
    }
    const id = Number(occupiedId);
    const u = gearUnitByOccupiedId(id);
    if (u) {
      const cache = typeof monstersEnrichedCache !== 'undefined' ? monstersEnrichedCache : [];
      const enriched = cache.find((x) => Number(x.unitId) === Number(u.unitId));
      if (enriched && enriched.displayName && !String(enriched.displayName).startsWith('#')) {
        return String(enriched.displayName);
      }
      if (u.displayName && !String(u.displayName).startsWith('#')) return String(u.displayName);
      const byMaster = gearMonsterNameFromMasterId(u.masterId);
      if (byMaster) return byMaster;
      return inv;
    }
    const byOccupiedMaster = gearMonsterNameFromMasterId(id);
    return byOccupiedMaster || inv;
  }

  function gearSearchHay(gear) {
    const parts = [
      gear.kind,
      gear.category,
      gear.gradeStr,
      gearLocationLabel(gear.occupiedId, { tableGearInventory: 'Inventory' }),
    ];
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    if (gear.pri && fmt) parts.push(fmt(gear.pri, { kind: gear.kind }));
    if (gear.kind === 'relic' && fmtSec) parts.push(fmtSec(gear));
    if (gear.kind === 'artifact' && fmtSub) {
      for (const s of gear.secs || []) parts.push(fmtSub(s));
    }
    return parts.join(' ').toLowerCase();
  }

  function populateGearFilterSelects() {
    const arts = allArtifacts || [];
    const rels = allRelics || [];
    const artGrades = [...new Set(arts.map((a) => a.gradeStr).filter(Boolean))].sort();
    const artCats = [...new Set(arts.map((a) => a.category).filter(Boolean))].sort();
    const relGrades = [...new Set(rels.map((r) => r.gradeStr).filter(Boolean))].sort();
    const relCats = [...new Set(rels.map((r) => r.category).filter(Boolean))].sort();
    const fill = (sel, values, current) => {
      if (!sel) return;
      const keep = current || sel.value || '';
      sel.innerHTML = '<option value="">All</option>';
      for (const v of values) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      }
      sel.value = keep;
    };
    fill(
      document.getElementById('filter-artifact-grade'),
      artGrades,
      typeof artifactFilterGrade !== 'undefined' ? artifactFilterGrade : '',
    );
    fill(
      document.getElementById('filter-artifact-category'),
      artCats,
      typeof artifactFilterCategory !== 'undefined' ? artifactFilterCategory : '',
    );
    fill(
      document.getElementById('filter-relic-grade'),
      relGrades,
      typeof relicFilterGrade !== 'undefined' ? relicFilterGrade : '',
    );
    fill(
      document.getElementById('filter-relic-category'),
      relCats,
      typeof relicFilterCategory !== 'undefined' ? relicFilterCategory : '',
    );
  }

  function renderGearTables() {
    applyArtifactTableSearch();
    applyRelicTableSearch();
    renderArtifactTableBody();
    renderRelicTableBody();
    updateGearTableCount();
  }

  function updateGearTableCount() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const artEl = document.getElementById('artifact-table-count');
    const relEl = document.getElementById('relic-table-count');
    if (artEl) {
      artEl.textContent = (t.tableCountArtifacts || '{n} artifacts').replace(
        '{n}',
        String(filteredArtifacts.length),
      );
    }
    if (relEl) {
      relEl.textContent = (t.tableCountRelics || '{n} relics').replace(
        '{n}',
        String(filteredRelics.length),
      );
    }
    const legacy = document.getElementById('table-count');
    const kind = readTableKind();
    if (legacy && kind === 'artifacts' && artEl) legacy.textContent = artEl.textContent;
    if (legacy && kind === 'relics' && relEl) legacy.textContent = relEl.textContent;
  }

  function setTableToolbarVisible(kind) {
    document.querySelectorAll('[data-table-toolbar]').forEach((el) => {
      const on = el.dataset.tableToolbar === kind;
      el.classList.toggle('hidden', !on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function updateTableKindTabIndicator() {
    const nav = document.getElementById('table-kind-tabs');
    const indicator = nav && nav.querySelector('.table-kind-tabs__indicator');
    const active = nav && nav.querySelector('.table-kind-tab.is-active');
    if (!nav || !indicator || !active) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    indicator.style.left = `${tabRect.left - navRect.left}px`;
    indicator.style.width = `${tabRect.width}px`;
  }

  function showTableKind(kind, options) {
    const id = normalizeTableKind(kind);
    writeTableKind(id);
    document.querySelectorAll('.table-kind-tab').forEach((btn) => {
      const on = btn.dataset.tableKind === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-table-kind-pane]').forEach((pane) => {
      const on = pane.dataset.tableKindPane === id;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('hidden', !on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });
    setTableToolbarVisible(id);
    const runeOnly = document.getElementById('rune-table-rune-only-ui');
    if (runeOnly) runeOnly.hidden = id !== 'runes';
    const loadStrip = document.getElementById('rune-table-load-strip');
    if (loadStrip) loadStrip.classList.toggle('hidden', id !== 'runes');
    document.querySelectorAll('[data-gear-roster-meta]').forEach((el) => {
      const on = el.dataset.gearRosterMeta === id;
      el.classList.toggle('hidden', !on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    const runeChips = document.getElementById('rune-table-active-filters');
    if (runeChips) runeChips.classList.toggle('hidden', id !== 'runes');
    const search = document.getElementById('search-box');
    if (search) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      search.placeholder = t.tableSearchRunes || 'Search by set, stat, role…';
    }
    updateTableKindTabIndicator();
    if (id === 'runes') {
      if (options && options.skipRuneRender) return;
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    } else {
      renderGearTables();
    }
  }

  function initTableKindTabs() {
    const nav = document.getElementById('table-kind-tabs');
    if (!nav || tableKindTabsBound) return;
    tableKindTabsBound = true;
    bindArtifactTableFilters();
    bindRelicTableFilters();
    nav.querySelectorAll('.table-kind-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.tableKind;
        if (!kind) return;
        showTableKind(kind);
      });
    });
    showTableKind(readTableKind(), { skipRuneRender: true });
  }

  function onGearDataHydrated() {
    populateGearFilterSelects();
    if (readTableKind() !== 'runes') renderGearTables();
  }


  function renderGearSummaryChips(hostId, parts) {
    const host = document.getElementById(hostId);
    if (!host) return;
    if (!parts || !parts.length) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
  }

  function computeArtifactTableSummary(list) {
    const items = list || [];
    let legend = 0;
    let hero = 0;
    let equipped = 0;
    let locked = 0;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (a.gradeStr === 'Legend') legend += 1;
      else if (a.gradeStr === 'Hero') hero += 1;
      if (a.occupiedId != null && Number(a.occupiedId) !== 0) equipped += 1;
      if (a.locked) locked += 1;
    }
    return {
      total: items.length,
      legend,
      hero,
      equipped,
      inventory: items.length - equipped,
      locked,
    };
  }

  function computeRelicTableSummary(list) {
    const items = list || [];
    let legend = 0;
    let hero = 0;
    let equipped = 0;
    let maxLevel = 0;
    let fullDurability = 0;
    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      if (r.gradeStr === 'Legend') legend += 1;
      else if (r.gradeStr === 'Hero') hero += 1;
      if (r.occupiedId != null && Number(r.occupiedId) !== 0) equipped += 1;
      if (Number(r.level) >= 15) maxLevel += 1;
      if (Number(r.durability) >= 3) fullDurability += 1;
    }
    return {
      total: items.length,
      legend,
      hero,
      equipped,
      inventory: items.length - equipped,
      maxLevel,
      fullDurability,
    };
  }

  function renderArtifactTableRosterChips() {
    const meta = document.getElementById('artifact-table-roster-meta');
    const pool = typeof filteredArtifacts !== 'undefined' ? filteredArtifacts : allArtifacts || [];
    if (meta) {
      meta.hidden = !pool.length;
    }
    if (!pool.length) {
      renderGearSummaryChips('artifact-table-roster-chips', []);
      return;
    }
    const sum = computeArtifactTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.artChipTotal || 'Artifacts', value: sum.total },
      { label: t.artChipLegend || 'Legend', value: sum.legend },
      { label: t.artChipHero || 'Hero', value: sum.hero },
      { label: t.artChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.artChipInventory || 'Inventory', value: sum.inventory },
    ];
    if (sum.locked > 0) {
      parts.push({ label: t.artChipLocked || 'Locked', value: sum.locked });
    }
    renderGearSummaryChips('artifact-table-roster-chips', parts);
  }

  function renderRelicTableRosterChips() {
    const meta = document.getElementById('relic-table-roster-meta');
    const pool = typeof filteredRelics !== 'undefined' ? filteredRelics : allRelics || [];
    if (meta) {
      meta.hidden = !pool.length;
    }
    if (!pool.length) {
      renderGearSummaryChips('relic-table-roster-chips', []);
      return;
    }
    const sum = computeRelicTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.relChipTotal || 'Relics', value: sum.total },
      { label: t.relChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.relChipInventory || 'Inventory', value: sum.inventory },
      { label: t.relChipMaxLevel || 'Lvl 15', value: sum.maxLevel },
      { label: t.relChipFullDur || 'Full durability', value: sum.fullDurability },
    ];
    renderGearSummaryChips('relic-table-roster-chips', parts);
  }

  let filteredArtifacts = [];
  let artifactFilterGrade = '';
  let artifactFilterCategory = '';
  let artifactFilterLocation = '';

  function artifactPassesFilters(a) {
    if (artifactFilterGrade && String(a.gradeStr || '') !== artifactFilterGrade) return false;
    if (artifactFilterCategory && String(a.category || '') !== artifactFilterCategory) return false;
    if (artifactFilterLocation === 'inventory') {
      if (a.occupiedId != null && Number(a.occupiedId) !== 0) return false;
    } else if (artifactFilterLocation === 'equipped') {
      if (a.occupiedId == null || Number(a.occupiedId) === 0) return false;
    }
    return true;
  }

  function applyArtifactTableSearch() {
    const artQ = (document.getElementById('search-box-artifacts')?.value || '')
      .trim()
      .toLowerCase();
    const artSrc = (allArtifacts || []).filter(artifactPassesFilters);
    filteredArtifacts = !artQ
      ? artSrc.slice()
      : artSrc.filter((a) => gearSearchHay(a).includes(artQ));
  }

  function countActiveArtifactFilters() {
    let n = 0;
    if (artifactFilterGrade) n++;
    if (artifactFilterCategory) n++;
    if (artifactFilterLocation) n++;
    return n;
  }

  function updateArtifactFilterBadge() {
    const badge = document.getElementById('artifact-filters-active-count');
    if (!badge) return;
    const n = countActiveArtifactFilters();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function resetArtifactTableFilters() {
    artifactFilterGrade = '';
    artifactFilterCategory = '';
    artifactFilterLocation = '';
    const sb = document.getElementById('search-box-artifacts');
    if (sb) sb.value = '';
    const g = document.getElementById('filter-artifact-grade');
    const c = document.getElementById('filter-artifact-category');
    const l = document.getElementById('filter-artifact-location');
    if (g) g.value = '';
    if (c) c.value = '';
    if (l) l.value = '';
    updateArtifactFilterBadge();
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
    if (!filteredArtifacts.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHtml(t.tableGearEmpty || 'No artifacts')}</td></tr>`;
      if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();
      return;
    }
    const rows = filteredArtifacts
      .slice()
      .sort(
        (a, b) =>
          String(a.category).localeCompare(String(b.category)) ||
          String(a.gradeStr).localeCompare(String(b.gradeStr)),
      )
      .map((a) => {
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
        return `<tr>
          <td class="col-grade">${gradeCell}</td>
          <td class="col-category">${catCell}</td>
          <td>${escapeHtml(main)}</td>
          <td class="col-subs-stack"><div class="gear-table-subs">${artifactSubStack(a, fmtSub)}</div></td>
          <td>${escapeHtml(gearLocationLabel(a.occupiedId, t))}</td>
        </tr>`;
      });
    tbody.innerHTML = rows.join('');
    if (typeof renderArtifactTableRosterChips === 'function') renderArtifactTableRosterChips();
  }

  function bindArtifactTableFilters() {
    if (bindArtifactTableFilters._done) return;
    bindArtifactTableFilters._done = true;

    const onArtifactFilterChange = () => {
      artifactFilterGrade = document.getElementById('filter-artifact-grade')?.value || '';
      artifactFilterCategory = document.getElementById('filter-artifact-category')?.value || '';
      artifactFilterLocation = document.getElementById('filter-artifact-location')?.value || '';
      updateArtifactFilterBadge();
      renderGearTables();
    };

    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('artifact-more-filters-btn', 'artifact-filters-popover', {
        onClose: onArtifactFilterChange,
      });
    }

    document.getElementById('btn-artifact-reset-filters')?.addEventListener('click', resetArtifactTableFilters);
    document.getElementById('artifact-filters-drawer-reset')?.addEventListener('click', resetArtifactTableFilters);

    document.getElementById('filter-artifact-grade')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-category')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-location')?.addEventListener('change', onArtifactFilterChange);

    let artDebounce = null;
    document.getElementById('search-box-artifacts')?.addEventListener('input', () => {
      clearTimeout(artDebounce);
      artDebounce = setTimeout(() => renderGearTables(), 280);
    });
  }

  let filteredRelics = [];
  let relicFilterGrade = '';
  let relicFilterCategory = '';

  function relicPassesFilters(r) {
    if (relicFilterGrade && String(r.gradeStr || '') !== relicFilterGrade) return false;
    if (relicFilterCategory && String(r.category || '') !== relicFilterCategory) return false;
    return true;
  }

  function applyRelicTableSearch() {
    const relQ = (document.getElementById('search-box-relics')?.value || '').trim().toLowerCase();
    const relSrc = (allRelics || []).filter(relicPassesFilters);
    filteredRelics = !relQ ? relSrc.slice() : relSrc.filter((r) => gearSearchHay(r).includes(relQ));
  }

  function countActiveRelicFilters() {
    let n = 0;
    if (relicFilterGrade) n++;
    if (relicFilterCategory) n++;
    return n;
  }

  function updateRelicFilterBadge() {
    const badge = document.getElementById('relic-filters-active-count');
    if (!badge) return;
    const n = countActiveRelicFilters();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function resetRelicTableFilters() {
    relicFilterGrade = '';
    relicFilterCategory = '';
    const sb = document.getElementById('search-box-relics');
    if (sb) sb.value = '';
    const g = document.getElementById('filter-relic-grade');
    const c = document.getElementById('filter-relic-category');
    if (g) g.value = '';
    if (c) c.value = '';
    updateRelicFilterBadge();
    renderGearTables();
  }

  function renderRelicTableBody() {
    const tbody = document.getElementById('relic-tbody');
    if (!tbody) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    if (!filteredRelics.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${escapeHtml(t.tableGearEmptyRelics || 'No relics')}</td></tr>`;
      if (typeof renderRelicTableRosterChips === 'function') renderRelicTableRosterChips();
      return;
    }
    const rows = filteredRelics
      .slice()
      .sort(
        (a, b) =>
          String(a.category).localeCompare(String(b.category)) ||
          (b.level || 0) - (a.level || 0),
      )
      .map((r) => {
        const main = r.pri && fmt ? fmt(r.pri, { kind: 'relic' }) : '—';
        const sec = fmtSec ? fmtSec(r) : '—';
        const dur = fmtDur ? fmtDur(r) : '—';
        const category = r.category ? r.category : '—';
        const fmtWear =
          window.SWRM && typeof window.SWRM.formatRelicWearCount === 'function'
            ? window.SWRM.formatRelicWearCount
            : null;
        const wear = fmtWear ? fmtWear(r) : '0/100';
        const catFn = window.SWRM && window.SWRM.gearCategoryCellHtml;
        const paths =
          window.SWRM && typeof window.SWRM.relicLocalIconCandidates === 'function'
            ? window.SWRM.relicLocalIconCandidates(r)
            : [];
        const catCell =
          typeof catFn === 'function' ? catFn('', category, paths) : escapeHtml(category);
        return `<tr>
          <td class="col-category">${catCell}</td>
          <td class="th-num">+${escapeHtml(String(r.level || 0))}</td>
          <td class="th-num">${escapeHtml(dur)}</td>
          <td>${escapeHtml(main)}</td>
          <td class="col-text">${escapeHtml(sec)}</td>
          <td class="th-num">${escapeHtml(wear)}</td>
        </tr>`;
      });
    tbody.innerHTML = rows.join('');
    if (typeof renderRelicTableRosterChips === 'function') renderRelicTableRosterChips();
  }

  function bindRelicTableFilters() {
    if (bindRelicTableFilters._done) return;
    bindRelicTableFilters._done = true;

    const onRelicFilterChange = () => {
      relicFilterGrade = document.getElementById('filter-relic-grade')?.value || '';
      relicFilterCategory = document.getElementById('filter-relic-category')?.value || '';
      updateRelicFilterBadge();
      renderGearTables();
    };

    if (typeof bindFiltersPopover === 'function') {
      bindFiltersPopover('relic-more-filters-btn', 'relic-filters-popover', {
        onClose: onRelicFilterChange,
      });
    }

    document.getElementById('btn-relic-reset-filters')?.addEventListener('click', resetRelicTableFilters);
    document.getElementById('relic-filters-drawer-reset')?.addEventListener('click', resetRelicTableFilters);

    document.getElementById('filter-relic-grade')?.addEventListener('change', onRelicFilterChange);
    document.getElementById('filter-relic-category')?.addEventListener('change', onRelicFilterChange);

    let relDebounce = null;
    document.getElementById('search-box-relics')?.addEventListener('input', () => {
      clearTimeout(relDebounce);
      relDebounce = setTimeout(() => renderGearTables(), 280);
    });
  }

  // ===================== TABLE =====================
  function renderTable(runes) {
    applyFiltersAndSort(runes);
  }

  /** SWOP Eff% (uncapped) — used for sort, CSV, depth charts. */
  function getRuneNumericEff(r) {
    if (!r) return 0;
    if (Number.isFinite(r.eff)) return r.eff;
    const calc = window.SWRM?.calcEfficiencyUncapped;
    return typeof calc === 'function' ? calc(r) : 0;
  }

  /** Table display only — cap at 100% like SWOP column UI. */
  function getRuneDisplayEff(r) {
    return Math.min(100, getRuneNumericEff(r));
  }

  function applyRuneTableEffHeader() {
    const lbl = document.getElementById('lbl-th-eff');
    if (!lbl) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    lbl.textContent = t.tableEffHeaderCapped || 'Eff%';
    lbl.setAttribute('title', t.tableEffHeaderCappedTitle || '');
  }

  function applyRuneTableScoreHeader() {
    const lbl = document.getElementById('lbl-th-score');
    if (!lbl) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    lbl.textContent = t.tableScoreHeader || 'Score';
    lbl.setAttribute('title', t.tableScoreHint || '');
  }

  function initRuneTablePrefsFromStorage() {
    applyRuneTableEffHeader();
    applyRuneTableScoreHeader();
    const ancient = document.getElementById('toggle-ancient-only');
    if (ancient) {
      const v = localStorage.getItem(RUNE_TABLE_ANCIENT_ONLY_KEY);
      if (v === '1') ancient.checked = true;
      else if (v === '0') ancient.checked = false;
    }
    const hideTarget = document.getElementById('toggle-target-col');
    if (hideTarget) hideTarget.checked = readRuneTableHideTarget();
    applyRuneTableTargetColumnVisibility();
  }

  function sortRunesInPlace(arr, key, dir) {
    arr.sort((a, b) => {
      let av;
      let bv;
      switch (key) {
        case 'slot':    av = a.slot;    bv = b.slot;    break;
        case 'set':     av = a.setName; bv = b.setName; break;
        case 'grade':   av = a.grade;   bv = b.grade;   break;
        case 'level':   av = a.level;   bv = b.level;   break;
        case 'main':    av = a.mainName;bv = b.mainName;break;
        case 'eff':     av = getRuneNumericEff(a); bv = getRuneNumericEff(b); break;
        case 'score':
          av = typeof computeRuneScore === 'function' ? computeRuneScore(a) : 0;
          bv = typeof computeRuneScore === 'function' ? computeRuneScore(b) : 0;
          break;
        case 'role':    av = a.role;    bv = b.role;    break;
        case 'verdict': av = a.verdict; bv = b.verdict; break;
        case 's1':      av = a.substats[0]?.name || ''; bv = b.substats[0]?.name || ''; break;
        case 's2':      av = a.substats[1]?.name || ''; bv = b.substats[1]?.name || ''; break;
        case 's3':      av = a.substats[2]?.name || ''; bv = b.substats[2]?.name || ''; break;
        case 's4':      av = a.substats[3]?.name || ''; bv = b.substats[3]?.name || ''; break;
        default:
          av = typeof computeRuneScore === 'function' ? computeRuneScore(a) : 0;
          bv = typeof computeRuneScore === 'function' ? computeRuneScore(b) : 0;
          break;
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function readRuneTableHideTarget() {
    try {
      return localStorage.getItem(RUNE_TABLE_HIDE_TARGET_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setupRuneTableMoreUi(total, rendered) {
    const strip = document.getElementById('rune-table-load-strip');
    const hint = document.getElementById('lbl-rune-table-more-hint');
    const btn = document.getElementById('btn-rune-table-show-all');
    if (!strip) return;

    if (runeTableShowAll || total <= RUNE_TABLE_PAGE || rendered >= total) {
      strip.classList.add('hidden');
      strip.setAttribute('aria-hidden', 'true');
      return;
    }

    strip.classList.remove('hidden');
    strip.removeAttribute('aria-hidden');
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const detailHint = (tloc.runeTableMoreHint || '')
      .replace(/\{shown\}/g, String(rendered))
      .replace(/\{total\}/g, String(total));
    if (hint) {
      hint.textContent = (tloc.runeTableMoreHintInline || '')
        .replace(/\{shown\}/g, String(rendered))
        .replace(/\{total\}/g, String(total));
    }
    if (btn) {
      btn.textContent = (tloc.runeTableShowAllButton || '').replace(/\{total\}/g, String(total));
      btn.title = detailHint;
    }
  }

  function updateSortHeaderClasses() {
    document.querySelectorAll('#rune-table thead th[data-sort]').forEach((t) => {
      t.classList.remove('sort-asc', 'sort-desc');
      if (t.dataset.sort === sortKey) {
        t.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  function exportCsv() {
    const rows = filteredRunes;
    if (!rows.length) return;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const includeTarget = document.getElementById('rune-table')?.classList.contains('show-target');
    const headers = [
      'Grade',
      tloc.csvHeaderAncient || 'Ancient',
      'Set', 'Lvl', 'Slot', 'Main', 'Innate', 'Sub1', 'Sub2', 'Sub3', 'Sub4', 'Score', 'Eff%', 'Role', 'Verdict',
    ];
    if (includeTarget) headers.push('Target');
    function cellPart(s) {
      const raw = String(s ?? '');
      if (/[,"\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    }
    function subcell(sub) {
      if (!sub || !sub.name) return '';
      const g = Number(sub.grind) || 0;
      const gem = !!(sub.enchanted || (Number(sub.gem) || 0) !== 0);
      const total = subLineTotal(sub);
      let out = `${sub.name} ${total}`;
      if (g > 0) out += ` [${g}]`;
      if (gem) out += ' (gem)';
      return out;
    }
    const lines = [headers.map(cellPart).join(',')];
    rows.forEach(r => {
      const subs = r.substats || [];
      const row = [
        r.gradeStr,
        r.isAncient ? (tloc.csvAncientYes || 'yes') : '',
        r.setName,
        r.level,
        r.slot,
        r.mainName,
        r.innate_name ? `${r.innate_name} ${r.innate_val}` : '',
        subcell(subs[0]),
        subcell(subs[1]),
        subcell(subs[2]),
        subcell(subs[3]),
        String(typeof computeRuneScore === 'function' ? computeRuneScore(r) : ''),
        `${getRuneNumericEff(r).toFixed(1)}`,
        roleDisplayName(r.role || ''),
        r.verdict || '',
      ];
      if (includeTarget) row.push(runeTargetText(r));
      lines.push(row.map(cellPart).join(','));
    });
    const csv = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sw-rune-master-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }

  // Table sorting
  document.querySelectorAll('#rune-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      document.querySelectorAll('#rune-table thead th[data-sort]').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      applyFiltersAndSort(getVisibleRunes());
    });
  });

  // Export CSV from Rune Table
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);

  document.getElementById('btn-rune-table-show-all')?.addEventListener('click', () => {
    runeTableShowAll = true;
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  // Toggle Target column visibility
  document.getElementById('toggle-target-col')?.addEventListener('change', (e) => {
    try {
      localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, e.target.checked ? '1' : '0');
    } catch (err) { /* ignore */ }
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('toggle-ancient-only')?.addEventListener('change', (e) => {
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, e.target.checked ? '1' : '0');
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('btn-table-reset-filters')?.addEventListener('click', () => {
    resetRuneTableFilters();
  });

  document.getElementById('search-box')?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null;
      applyFiltersAndSort(getVisibleRunes());
    }, 280);
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    const tag = e.target && e.target.tagName;
    const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      || (e.target && e.target.isContentEditable);
    const onTableTab = isRuneTablePaneVisible();

    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const kind = typeof readTableKind === 'function' ? readTableKind() : 'runes';
      const searchIds = {
        runes: 'search-box',
        artifacts: 'search-box-artifacts',
        relics: 'search-box-relics',
      };
      const activeId = searchIds[kind] || 'search-box';
      if (inField && e.target.id !== activeId) return;
      if (inField && e.target.id === activeId) return;
      e.preventDefault();
      document.getElementById(activeId)?.focus();
      return;
    }

    if (!onTableTab || inField) return;
    const wrap = document.getElementById('rune-table-scroll');
    if (!wrap) return;
    const step = Math.max(96, Math.floor(wrap.clientHeight * 0.82));
    if (e.key === 'PageDown') {
      e.preventDefault();
      wrap.scrollBy({ top: step, behavior: 'smooth' });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      wrap.scrollBy({ top: -step, behavior: 'smooth' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      wrap.scrollBy({ top: 56, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      wrap.scrollBy({ top: -56, behavior: 'smooth' });
    }
  });

  // ===================== ADVANCED FORMULAS UI =====================
  function renderAdvancedFormulas() {
    const wrap = document.getElementById('advanced-formulas-wrap');
    if (!wrap) return;
    
    const formulas = window.SWRM.settings.formulas || {};
    let html = '';
    
    for (const [formulaName, formulaCfg] of Object.entries(formulas)) {
      html += `<div style="margin-bottom:32px; padding:20px; background:var(--bg3); border-radius:var(--radius-lg); border:1px solid var(--border);">`;
      
      // Formula header with enable toggle
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px">`;
      html += `<div style="font-family:var(--font-head);font-size:1.1rem;font-weight:700;color:var(--text-hi)">${formulaName}</div>`;
        html += `<label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;color:var(--text)">
          <input type="checkbox" data-formula="${formulaName}" data-field="enabled" ${formulaCfg.enabled !== false ? 'checked' : ''} style="width:18px;height:18px">
        Enable Formula
      </label>`;
      html += `</div>`;
      
      function acceptedMainsToText(raw) {
        if (Array.isArray(raw)) {
          const vals = raw.map((v) => String(v || '').trim()).filter((v) => v && v !== 'None');
          return vals.length ? vals.join(', ') : 'None';
        }
        if (typeof raw === 'string') {
          const txt = raw.trim();
          return txt || 'None';
        }
        return 'None';
      }

      // Accepted Mains section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Accepted Mains</div>`;
      html += `<div style="display:grid;grid-template-columns:80px 1fr;gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Allowed mains (comma-separated)</div>`;
      
      for (const slot of [2, 4, 6]) {
        const mainsText = acceptedMainsToText(formulaCfg.acceptedMains?.[slot]);
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        const safeValue = String(mainsText).replace(/"/g, '&quot;');
        html += `<input type="text" data-formula="${formulaName}" data-field="acceptedMains" data-slot="${slot}" value="${safeValue}" placeholder="None or SPD, HP%, DEF%" style="padding:4px 8px;font-size:0.8rem">`;
      }
      html += `</div></div>`;
      
      // Sub-stats section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Sub-stats</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stat</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const stats = ['SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
      for (const stat of stats) {
        html += `<div style="font-weight:600;color:var(--text)">${stat}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = formulaCfg.substats?.[stat]?.[stage] || 'None';
          html += `<select data-formula="${formulaName}" data-field="substats" data-stat="${stat}" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['Include', 'None', 'Exclude'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Must Have section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Must Have (Required Substat)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stage</div><div>Early</div><div>Mid</div><div>Late</div>`;
      html += `<div style="font-weight:600;color:var(--text)">Required</div>`;
      
      for (const stage of ['Early', 'Mid', 'Late']) {
        const value = formulaCfg.mustHave?.[stage] || 'None';
        html += `<select data-formula="${formulaName}" data-field="mustHave" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
        const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
        for (const opt of options) {
          html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
        }
        html += `</select>`;
      }
      html += `</div></div>`;
      
      // Slot Requirements section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Slot Requirements (Required Stats per Slot)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      for (const slot of [2, 4, 6]) {
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = formulaCfg.slotRequirements?.[slot]?.[stage] || 'None';
          html += `<select data-formula="${formulaName}" data-field="slotRequirements" data-slot="${slot}" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Min Stats section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Min Stats (excluding Must Have)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot Type</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const slotTypes = ['1/3/5', 'Slot 2', 'Slot 4', 'Slot 6'];
      for (const slotType of slotTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${slotType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value =
            typeof window.SWRM.readFormulaMinStat === 'function'
              ? window.SWRM.readFormulaMinStat(formulaCfg.minStats, slotType, stage)
              : formulaCfg.minStats?.[slotType]?.[stage] || 1;
          html += `<input type="number" data-formula="${formulaName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}" value="${value}" min="0" max="4" step="1" style="padding:4px 8px;font-size:0.8rem;width:60px">`;
        }
      }
      html += `</div></div>`;
      
      // Anchor Requirements section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Anchor Requirements (High Roll for Hero/Legend)</div>`;
      html += `<div style="display:grid;grid-template-columns:140px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Requirement</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const anchorTypes = ['High Roll for Hero', 'High Roll for Legend'];
      for (const anchorType of anchorTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${anchorType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = formulaCfg.requireHR?.[anchorType]?.[stage] || false;
          html += `<input type="checkbox" data-formula="${formulaName}" data-field="requireHR" data-anchor="${anchorType}" data-stage="${stage}" ${value ? 'checked' : ''} style="width:18px;height:18px">`;
        }
      }
      html += `</div></div>`;
      
      html += `</div>`;
    }
    
    wrap.innerHTML = html;
    
    // Add event listeners
    wrap.querySelectorAll('input, select').forEach(element => {
      element.addEventListener('change', handleAdvancedFormulaChange);
    });
  }
  
  function handleAdvancedFormulaChange(e) {
    const element = e.target;
    const formulaName = element.dataset.formula || element.dataset.role;
    const field = element.dataset.field;
    
    if (!formulaName || !field) return;
    
    let value;
    if (element.type === 'checkbox') {
      value = element.checked;
    } else if (element.type === 'number') {
      value = parseInt(element.value) || 0;
    } else {
      value = element.value;
    }
    
    // Check if this is a formula or legacy role
    const isFormula = window.SWRM.settings.formulas && window.SWRM.settings.formulas[formulaName] !== undefined;
    
    // Update settings object
    const settings = window.SWRM.settings;
    
    if (isFormula) {
      // Update formula settings
      if (!settings.formulas) settings.formulas = {};
      if (!settings.formulas[formulaName]) settings.formulas[formulaName] = {};
      
      // Handle nested properties
      if (field === 'enabled') {
        settings.formulas[formulaName].enabled = value;
      } else if (field === 'acceptedMains') {
        const slot = parseInt(element.dataset.slot, 10);
        if (!settings.formulas[formulaName].acceptedMains) settings.formulas[formulaName].acceptedMains = {};
        const cleaned = String(value || '').trim();
        settings.formulas[formulaName].acceptedMains[slot] = cleaned || 'None';
      } else if (field === 'substats') {
        const stat = element.dataset.stat;
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].substats) settings.formulas[formulaName].substats = {};
        if (!settings.formulas[formulaName].substats[stat]) settings.formulas[formulaName].substats[stat] = {};
        settings.formulas[formulaName].substats[stat][stage] = value;
      } else if (field === 'mustHave') {
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].mustHave) settings.formulas[formulaName].mustHave = {};
        settings.formulas[formulaName].mustHave[stage] = value || 'None';
      } else if (field === 'slotRequirements') {
        const slot = parseInt(element.dataset.slot);
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].slotRequirements) settings.formulas[formulaName].slotRequirements = {};
        if (!settings.formulas[formulaName].slotRequirements[slot]) settings.formulas[formulaName].slotRequirements[slot] = {};
        settings.formulas[formulaName].slotRequirements[slot][stage] = value;
      } else if (field === 'minStats') {
        const slotType = element.dataset.slot;
        const stage = element.dataset.stage;
        const fm = settings.formulas[formulaName];
        if (!fm.minStats) fm.minStats = {};
        const writeKey =
          typeof window.SWRM.formulaMinStatWriteKey === 'function'
            ? window.SWRM.formulaMinStatWriteKey(fm.minStats, slotType)
            : slotType;
        if (!fm.minStats[writeKey]) fm.minStats[writeKey] = {};
        fm.minStats[writeKey][stage] = value;
      } else if (field === 'requireHR') {
        const anchorType = element.dataset.anchor;
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].requireHR) settings.formulas[formulaName].requireHR = {};
        if (!settings.formulas[formulaName].requireHR[anchorType]) settings.formulas[formulaName].requireHR[anchorType] = {};
        settings.formulas[formulaName].requireHR[anchorType][stage] = value;
      }
    } else {
      // Update legacy role settings
      if (!settings.roles) settings.roles = {};
      if (!settings.roles[formulaName]) settings.roles[formulaName] = {};
      
      // Handle nested properties for legacy roles
      if (field === 'substats') {
        const stat = element.dataset.stat;
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].substats) settings.roles[formulaName].substats = {};
        if (!settings.roles[formulaName].substats[stat]) settings.roles[formulaName].substats[stat] = {};
        settings.roles[formulaName].substats[stat][stage] = value;
      } else if (field === 'mustHave') {
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].mustHave) settings.roles[formulaName].mustHave = {};
        settings.roles[formulaName].mustHave[stage] = value || 'None';
      } else if (field === 'minStats') {
        const slotType = element.dataset.slot;
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].minStats) settings.roles[formulaName].minStats = {};
        if (!settings.roles[formulaName].minStats[slotType]) settings.roles[formulaName].minStats[slotType] = {};
        settings.roles[formulaName].minStats[slotType][stage] = value;
      } else if (field === 'requireHR') {
        const anchorType = element.dataset.anchor;
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].requireHR) settings.roles[formulaName].requireHR = {};
        if (!settings.roles[formulaName].requireHR[anchorType]) settings.roles[formulaName].requireHR[anchorType] = {};
        settings.roles[formulaName].requireHR[anchorType][stage] = value;
      }
    }

    // Apply immediately: persist + recompute results so toggles feel responsive.
    try {
      saveSettings(window.SWRM.settings);
    } catch (err) {
      console.warn('Failed to persist settings after formula change:', err);
    }
    if (processedRunes && processedRunes.length) {
      reprocess();
    }
  }

  // ===================== SETTINGS UI =====================
  function parseList(v) {
    return (v || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function hydrateGemMetaFields(gm) {
    const g = gm || DEFAULT_GEM_META;
    const el = id => document.getElementById(id);
    if (!el('gem-bad-flat-enabled')) return;
    el('gem-bad-flat-enabled').checked = g.legacyFlatSubGem !== false;
  }

  function renderRoleSettings() {
    const navWrap = document.getElementById('role-nav-list');
    const contentWrap = document.getElementById('roles-settings-wrap');
    
    if (!navWrap || !contentWrap) return;
    
    // Use advanced formulas if available, otherwise fall back to legacy roles
    const formulas = window.SWRM.settings.formulas || {};
    const roles = window.SWRM.settings.roles || {};
    // Formula config should win when role names overlap with legacy roles.
    const allRoles = { ...roles, ...formulas };
    const configuredNames = Object.keys(allRoles);
    const storedPriority = Array.isArray(window.SWRM.settings.rolePriority)
      ? window.SWRM.settings.rolePriority
      : [];
    const roleNames = [
      ...storedPriority.filter(name => configuredNames.includes(name)),
      ...configuredNames.filter(name => !storedPriority.includes(name)),
    ];
    window.SWRM.settings.rolePriority = roleNames.slice();
    let currentActiveRole = '';
    
    // Render navigation list
    let navHtml = '';
    for (let idx = 0; idx < roleNames.length; idx++) {
      const roleName = roleNames[idx];
      const roleCfg = allRoles[roleName];
      const isActive = currentActiveRole === '' || currentActiveRole === roleName;
      const isFormula = formulas[roleName] !== undefined;
      const displayName = roleName + (isFormula ? '' : ' (Legacy)');
      navHtml += `<div class="role-nav-item ${isActive ? 'active' : ''}" data-role="${roleName}">
        <span class="role-nav-main">
          <span class="role-prio-group">
          <button type="button" class="btn-ghost role-prio-btn" data-role-prio="${roleName}" data-dir="up" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn-ghost role-prio-btn" data-role-prio="${roleName}" data-dir="down" ${idx === roleNames.length - 1 ? 'disabled' : ''}>↓</button>
        </span>
          <span>${displayName}</span>
        </span>
      </div>`;
    }
    navWrap.innerHTML = navHtml;
    
    // Render content for active role - UNIFIED INTERFACE FOR ALL ROLES
    function renderActiveRole(roleName) {
      currentActiveRole = roleName;
      const roleCfg = allRoles[roleName];
      const isFormula = formulas[roleName] !== undefined;
      
      let html = '';
      
      // UNIFIED INTERFACE - All roles get the same advanced interface
      html += `<div style="margin-bottom:20px">`;
      
      // Role header with enable toggle
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px">`;
      html += `<div style="font-family:var(--font-head);font-size:1.1rem;font-weight:700;color:var(--text-hi)">${roleName}${isFormula ? '' : ' (Legacy)'}</div>`;
      
      if (isFormula) {
        html += `<label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;color:var(--text)">
          <input type="checkbox" data-formula="${roleName}" data-field="enabled" ${roleCfg.enabled !== false ? 'checked' : ''} style="width:18px;height:18px">
          Enable Formula
        </label>`;
      } else {
        html += `<button class="btn-ghost btn-remove-role" data-role-remove="${roleName}" ${Object.keys(roles).length <= 1 ? 'disabled' : ''}>Remove</button>`;
      }
      html += `</div>`;
      
      function acceptedMainsToText(raw) {
        if (Array.isArray(raw)) {
          const vals = raw.map((v) => String(v || '').trim()).filter((v) => v && v !== 'None');
          return vals.length ? vals.join(', ') : 'None';
        }
        if (typeof raw === 'string') {
          const txt = raw.trim();
          return txt || 'None';
        }
        return 'None';
      }

      // Accepted Mains section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Accepted Mains</div>`;
      html += `<div style="display:grid;grid-template-columns:80px 1fr;gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Allowed mains (comma-separated)</div>`;
      
      for (const slot of [2, 4, 6]) {
        const mainsText = acceptedMainsToText(roleCfg.acceptedMains?.[slot]);
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        const dataAttr = isFormula
          ? `data-formula="${roleName}" data-field="acceptedMains" data-slot="${slot}"`
          : `data-role="${roleName}" data-field="acceptedMains" data-slot="${slot}"`;
        const safeValue = String(mainsText).replace(/"/g, '&quot;');
        html += `<input type="text" ${dataAttr} value="${safeValue}" placeholder="None or SPD, HP%, DEF%" style="padding:4px 8px;font-size:0.8rem">`;
      }
      html += `</div></div>`;
      
      // Sub-stats section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Sub-stats</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stat</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const stats = ['SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
      for (const stat of stats) {
        html += `<div style="font-weight:600;color:var(--text)">${stat}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = (isFormula ? roleCfg.substats?.[stat]?.[stage] : roleCfg.substats?.[stat]) || 'None';
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="substats" data-stat="${stat}" data-stage="${stage}"` : `data-role="${roleName}" data-field="substats" data-stat="${stat}" data-stage="${stage}"`;
          html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['Include', 'None', 'Exclude'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Must Have section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Must Have (Required Substat)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stage</div><div>Early</div><div>Mid</div><div>Late</div>`;
      html += `<div style="font-weight:600;color:var(--text)">Required</div>`;
      
      for (const stage of ['Early', 'Mid', 'Late']) {
        const value = (isFormula ? roleCfg.mustHave?.[stage] : roleCfg.mustHave?.[stage]) || 'None';
        const dataAttr = isFormula ? `data-formula="${roleName}" data-field="mustHave" data-stage="${stage}"` : `data-role="${roleName}" data-field="mustHave" data-stage="${stage}"`;
        html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
        const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
        for (const opt of options) {
          html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
        }
        html += `</select>`;
      }
      html += `</div></div>`;
      
      // Slot Requirements section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Slot Requirements (Required Stats per Slot)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      for (const slot of [2, 4, 6]) {
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = (isFormula ? roleCfg.slotRequirements?.[slot]?.[stage] : 'None') || 'None';
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="slotRequirements" data-slot="${slot}" data-stage="${stage}"` : `data-role="${roleName}" data-field="slotRequirements" data-slot="${slot}" data-stage="${stage}"`;
          html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Min Stats section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Min Stats (excluding Must Have)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot Type</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const slotTypes = ['1/3/5', 'Slot 2', 'Slot 4', 'Slot 6'];
      for (const slotType of slotTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${slotType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = isFormula
            ? (typeof window.SWRM.readFormulaMinStat === 'function'
              ? window.SWRM.readFormulaMinStat(roleCfg.minStats, slotType, stage)
              : roleCfg.minStats?.[slotType]?.[stage] || 1)
            : (roleCfg.minStats?.[stage] || 1);
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}"` : `data-role="${roleName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}"`;
          html += `<input type="number" ${dataAttr} value="${value}" min="0" max="4" step="1" style="padding:4px 8px;font-size:0.8rem;width:60px">`;
        }
      }
      html += `</div></div>`;
      
      // Anchor Requirements section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Anchor Requirements (High Roll for Hero/Legend)</div>`;
      html += `<div style="display:grid;grid-template-columns:140px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Requirement</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const anchorTypes = ['High Roll for Hero', 'High Roll for Legend'];
      for (const anchorType of anchorTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${anchorType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = (isFormula ? roleCfg.requireHR?.[anchorType]?.[stage] : false) || false;
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="requireHR" data-anchor="${anchorType}" data-stage="${stage}"` : `data-role="${roleName}" data-field="requireHR" data-anchor="${anchorType}" data-stage="${stage}"`;
          html += `<input type="checkbox" ${dataAttr} ${value ? 'checked' : ''} style="width:18px;height:18px">`;
        }
      }
      html += `</div></div>`;
      
      html += `</div>`;
      
      contentWrap.innerHTML = html;
      
      // Add event listeners
      contentWrap.querySelectorAll('input[data-formula], select[data-formula], input[data-role], select[data-role]').forEach(element => {
        element.addEventListener('change', handleAdvancedFormulaChange);
      });
      
      // Remove role buttons for legacy roles
      contentWrap.querySelectorAll('.btn-remove-role').forEach(btn => {
        btn.addEventListener('click', () => {
          const roleName = btn.dataset.roleRemove;
          if (Object.keys(roles).length <= 1) return;
          delete window.SWRM.settings.roles[roleName];
          window.SWRM.settings.rolePriority = (window.SWRM.settings.rolePriority || []).filter(name => name !== roleName);
          saveSettings(window.SWRM.settings);
          renderRoleSettings();
          refreshRoleFilterOptions();
          if (processedRunes.length) reprocess();
        });
      });
    }
    
    // Set first role as active by default
    const firstRole = roleNames[0];
    if (firstRole) {
      renderActiveRole(firstRole);
    }
    
    // Add navigation click handlers
    navWrap.querySelectorAll('.role-nav-item').forEach(item => {
      item.addEventListener('click', (event) => {
        if (event.target && event.target.closest('.role-prio-btn')) return;
        const roleName = item.dataset.role;
        
        // Update active state
        navWrap.querySelectorAll('.role-nav-item').forEach(navItem => {
          navItem.classList.remove('active');
        });
        item.classList.add('active');
        
        // Render content
        renderActiveRole(roleName);
      });
    });
    navWrap.querySelectorAll('.role-prio-btn').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const roleName = btn.dataset.rolePrio;
        const dir = btn.dataset.dir;
        const order = Array.isArray(window.SWRM.settings.rolePriority)
          ? window.SWRM.settings.rolePriority.slice()
          : roleNames.slice();
        const index = order.indexOf(roleName);
        if (index < 0) return;
        const target = dir === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= order.length) return;
        const tmp = order[target];
        order[target] = order[index];
        order[index] = tmp;
        window.SWRM.settings.rolePriority = order;
        saveSettings(window.SWRM.settings);
        renderRoleSettings();
        refreshRoleFilterOptions();
        if (processedRunes.length) reprocess();
      });
    });
    
  }

  function refreshRoleFilterOptions() {
    const roleSelect = document.getElementById('filter-role');
    if (!roleSelect) return;
    const current = roleSelect.value;
    const formulas = Object.keys(window.SWRM.settings.formulas || {});
    const roleNamesRaw = Array.from(new Set([...formulas, ...Object.keys(window.SWRM.settings.roles || {})]));
    const roleNames = roleNamesRaw.map((n) => (n === 'High Roll' ? 'God Roll' : n));
    const defaultPriority = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS'];
    const storedPriority = (Array.isArray(window.SWRM.settings.rolePriority)
      ? window.SWRM.settings.rolePriority
      : defaultPriority
    ).map((n) => (n === 'High Roll' ? 'God Roll' : n));
    const orderedRoles = [
      ...storedPriority.filter((name) => roleNames.includes(name) || name === 'God Roll'),
      ...roleNames.filter((name) => !storedPriority.includes(name)),
    ].filter((name, idx, arr) => arr.indexOf(name) === idx);
    const roles = [...orderedRoles, 'Duo Roll', 'God Roll'].filter(
      (name, idx, arr) => arr.indexOf(name) === idx,
    );
    const t = TRANSLATIONS[currentLang];
    const godLbl = t.roleGodRoll || 'God Roll';
    roleSelect.innerHTML =
      `<option value="">${t.allRoles || 'All Roles'}</option>` +
      roles
        .map((r) => {
          const value = r === 'High Roll' ? 'God Roll' : r;
          const label = value === 'God Roll' ? godLbl : r;
          return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
        })
        .join('');
    const cur = current === 'High Roll' ? 'God Roll' : current;
    if (roles.includes(cur) || cur === 'God Roll') roleSelect.value = cur;
  }

  function collectStatConstantsFromForm() {
    const wrap = document.getElementById('stat-constants-wrap');
    if (!wrap || !wrap.querySelector('.sc-inp')) {
      return window.SWRM.mergeStatConstants(window.SWRM.settings.statConstants || null);
    }
    const order = window.SWRM.GOD_STAT_ORDER || [];
    const raw = {};
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      raw[stat] = {};
      const fields = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
      for (let fi = 0; fi < fields.length; fi++) {
        const f = fields[fi];
        const el = document.querySelector(`#stat-constants-wrap [data-sc-stat="${stat}"][data-sc-field="${f}"]`);
        if (!el) continue;
        const v = parseFloat(el.value);
        if (!Number.isFinite(v)) continue;
        const unit = el.getAttribute('data-sc-unit');
        raw[stat][f] = unit === 'percent' ? v / 100 : v;
      }
    }
    return window.SWRM.mergeStatConstants(raw);
  }

  const HR_PREVIEW_COL_KEYS = [
    'Early_Hero', 'Early_Leg', 'Mid_Hero', 'Mid_Leg', 'Late_Hero', 'Late_Leg',
  ];

  function thresholdPreviewColLabels(tloc) {
    const gte = (tloc && tloc.previewThresholdGte) || '≥';
    return HR_PREVIEW_COL_KEYS.map((col) => {
      const [stage, gradeKey] = col.split('_');
      const grade = gradeKey === 'Leg' ? 'Leg' : 'Hero';
      const gradeLabel = grade === 'Leg'
        ? ((tloc && tloc.previewGradeLegend) || 'Leg')
        : ((tloc && tloc.previewGradeHero) || 'Hero');
      return `${gte} ${stage} ${gradeLabel}`;
    });
  }

  function formatPreviewCell(v) {
    if (v == null || v === '') return '—';
    const n = Number(v);
    return Number.isFinite(n) ? String(Math.round(n)) : String(v);
  }

  function renderGodRollPreview(containerId, sc, tloc) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const gte = (tloc && tloc.previewThresholdGte) || '≥';
    const cStat = (tloc && tloc.constantsColStat) || 'Stat';
    const hHero = `${gte} ${(tloc && tloc.previewGradeHero) || 'Hero'}`;
    const hLeg = `${gte} ${(tloc && tloc.previewGradeLegend) || 'Legend'}`;
    let html = `<table class="s-table s-table--preview" role="region" aria-readonly="true" aria-label="God Roll preview"><thead><tr><th>${cStat}</th><th>${hHero}</th><th>${hLeg}</th></tr></thead><tbody>`;
    const order = window.SWRM.GOD_STAT_ORDER || [];
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      const vHero = window.SWRM.getGodThreshold(stat, { statConstants: sc }, 'Hero');
      const vLeg = window.SWRM.getGodThreshold(stat, { statConstants: sc }, 'Legend');
      html += `<tr><td>${escapeHtml(stat)}</td><td>${escapeHtml(formatPreviewCell(vHero))}</td><td>${escapeHtml(formatPreviewCell(vLeg))}</td></tr>`;
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function renderReadonlyMatrix(containerId, rowLabelKey, dataObj, colKeys, colLabels, rowOrder) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const keys = rowOrder && rowOrder.length ? rowOrder : Object.keys(dataObj || {});
    let html = `<table class="s-table s-table--preview" role="region" aria-readonly="true" aria-label="Engine threshold preview (read-only)"><thead><tr><th>${rowLabelKey}</th>`;
    for (let i = 0; i < colLabels.length; i++) html += `<th>${colLabels[i]}</th>`;
    html += '</tr></thead><tbody>';
    for (let ri = 0; ri < keys.length; ri++) {
      const rowKey = keys[ri];
      const vals = dataObj[rowKey];
      if (!vals) continue;
      const rowLabel = String(rowKey).replace(/_/g, ' ');
      html += `<tr><td>${escapeHtml(rowLabel)}</td>`;
      for (let ci = 0; ci < colKeys.length; ci++) {
        const c = colKeys[ci];
        const v = vals[c];
        html += `<td>${escapeHtml(formatPreviewCell(v))}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function refreshEnginePreviews() {
    const sc = document.getElementById('stat-constants-wrap')
      ? collectStatConstantsFromForm()
      : (window.SWRM.settings.statConstants || window.SWRM.DEFAULT_STAT_CONSTANTS);
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const hr = window.SWRM.computeHrThresholds(sc);
    const duo = window.SWRM.computeDuoThresholds(sc, hr);
    const colKeys = HR_PREVIEW_COL_KEYS;
    const colLabels = thresholdPreviewColLabels(tloc);
    const statOrder = window.SWRM.GOD_STAT_ORDER || [];
    const rowStat = (tloc && tloc.constantsColStat) || 'Stat';
    renderGodRollPreview('god-preview-wrap', sc, tloc);
    renderReadonlyMatrix('hr-preview-wrap', rowStat, hr, colKeys, colLabels, statOrder);
    renderReadonlyMatrix('duo-preview-wrap', rowStat, duo, colKeys, colLabels, statOrder);
  }

  function statConstantDecimalToPercentInput(d) {
    if (d == null || !Number.isFinite(Number(d))) return '';
    const p = Number(d) * 100;
    return String(Math.round(p * 100) / 100);
  }

  function escapeAttr(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function wireStatConstantsTableInputs(wrap) {
    wrap.querySelectorAll('.sc-inp').forEach((inp) => {
      inp.addEventListener('input', () => {
        refreshEnginePreviews();
      });
    });
  }

  function buildStatConstantsTable() {
    const wrap = document.getElementById('stat-constants-wrap');
    if (!wrap) return;
    const sc = window.SWRM.settings.statConstants || window.SWRM.DEFAULT_STAT_CONSTANTS;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const cStat = tloc.constantsColStat || 'Stat';
    const cB = tloc.godColBase || 'Base';
    const cG = tloc.godColMod || 'God (+%)';
    const cD = tloc.constColDuoMod || 'Duo −%';
    const cE = tloc.constColEarly || 'Early %';
    const cL = tloc.constColLate || 'Late %';
    const cGm = tloc.constColGrade || 'Legend (−%)';
    const hB = escapeAttr(tloc.constantsColHintBase || '');
    const hG = escapeAttr(tloc.constantsColHintGod || '');
    const hD = escapeAttr(tloc.constantsColHintDuo || '');
    const hE = escapeAttr(tloc.constantsColHintEarly || '');
    const hL = escapeAttr(tloc.constantsColHintLate || '');
    const hGm = escapeAttr(tloc.constantsColHintGrade || '');
    let html = `<table class="s-table stat-constants-table"><thead><tr><th>${cStat}</th>`;
    html += `<th title="${hB}">${cB}</th><th title="${hG}">${cG}</th><th title="${hD}">${cD}</th>`;
    html += `<th title="${hE}">${cE}</th><th title="${hL}">${cL}</th><th title="${hGm}">${cGm}</th></tr></thead><tbody>`;
    const order = window.SWRM.GOD_STAT_ORDER || [];
    const percentFields = new Set(['godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod']);
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      const row = sc[stat] || {};
      const fields = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
      html += `<tr><td>${stat}</td>`;
      for (let fi = 0; fi < fields.length; fi++) {
        const f = fields[fi];
        const val = row[f];
        const isPct = percentFields.has(f);
        const displayVal = isPct ? statConstantDecimalToPercentInput(val) : (val != null && val !== '' ? String(val) : '');
        const step = isPct ? '0.1' : '1';
        const unit = isPct ? 'percent' : 'raw';
        const tdCls = isPct ? ' sc-td--pct' : '';
        const suffix = isPct ? '<span class="sc-inp-suffix" aria-hidden="true">%</span>' : '';
        html += `<td class="sc-td${tdCls}"><span class="sc-inp-suffix-wrap">`;
        html += `<input type="number" class="sc-inp" data-sc-stat="${stat}" data-sc-field="${f}" data-sc-unit="${unit}" value="${displayVal}" step="${step}" />`;
        html += `${suffix}</span></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
    wireStatConstantsTableInputs(wrap);
  }



  buildStatConstantsTable();
  refreshEnginePreviews();

  refreshRoleFilterOptions();
  renderRoleSettings();

  document.getElementById('btn-add-role')?.addEventListener('click', () => {
    const name = document.getElementById('new-role-name').value.trim();
    if (!name) return;
    
    // Create new role with full formula interface
    const template = {
      enabled: true,
      acceptedMains: { 2: 'None', 4: 'None', 6: 'None' },
      substats: {
        SPD: { Early: 'None', Mid: 'None', Late: 'None' },
        'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
        'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
        'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
        CRate: { Early: 'None', Mid: 'None', Late: 'None' },
        CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
        ACC: { Early: 'None', Mid: 'None', Late: 'None' },
        RES: { Early: 'None', Mid: 'None', Late: 'None' }
      },
      mustHave: { Early: null, Mid: null, Late: null },
      slotRequirements: {
        2: { Early: 'None', Mid: 'None', Late: 'None' },
        4: { Early: 'None', Mid: 'None', Late: 'None' },
        6: { Early: 'None', Mid: 'None', Late: 'None' }
      },
      minStats: {
        '1/3/5': { Early: 1, Mid: 1, Late: 1 },
        'Slot 2': { Early: 1, Mid: 1, Late: 1 },
        'Slot 4': { Early: 1, Mid: 1, Late: 1 },
        'Slot 6': { Early: 1, Mid: 1, Late: 1 }
      },
      requireHR: {
        'High Roll for Hero': { Early: false, Mid: false, Late: false },
        'High Roll for Legend': { Early: false, Mid: false, Late: false }
      }
    };
    
    // Add as formula (not legacy role)
    if (!window.SWRM.settings.formulas) window.SWRM.settings.formulas = {};
    window.SWRM.settings.formulas[name] = template;
    if (!Array.isArray(window.SWRM.settings.rolePriority)) window.SWRM.settings.rolePriority = [];
    if (!window.SWRM.settings.rolePriority.includes(name)) window.SWRM.settings.rolePriority.push(name);
    saveSettings(window.SWRM.settings);
    
    document.getElementById('new-role-name').value = '';
    refreshRoleFilterOptions();
    renderRoleSettings();
    if (processedRunes.length) reprocess();
  });

  const reapp = window.SWRM.settings.reapp || {};
  const grind = window.SWRM.settings.grind || window.SWRM.DEFAULT_GRIND || { gap: 1 };
  document.getElementById('reapp-sets').value = (reapp.sets || []).join(', ');
  document.getElementById('reapp-innate').value = (reapp.innateStats || []).join(', ');
  document.getElementById('reapp-main2').value = (reapp.mainBySlot?.[2] || []).join(', ');
  document.getElementById('reapp-main4').value = (reapp.mainBySlot?.[4] || []).join(', ');
  document.getElementById('reapp-main6').value = (reapp.mainBySlot?.[6] || []).join(', ');
  document.getElementById('reapp-max-eff').value = reapp.maxEff ?? 65;
  document.getElementById('grind-gap').value = Number.isFinite(Number(grind.gap)) ? Number(grind.gap) : 1;

  hydrateGemMetaFields(window.SWRM.settings.gemMeta);

  // Save settings
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
    const s = window.SWRM.settings;

    // Role substats
    document.querySelectorAll('select[data-role]').forEach(sel => {
      const role  = sel.dataset.role;
      const stat  = sel.dataset.stat;
      if (s.roles[role]) s.roles[role].substats[stat] = sel.value;
    });

    // Role mustHave
    document.querySelectorAll('input[data-role][data-field="mustHave"]').forEach(inp => {
      const role  = inp.dataset.role;
      const stage = inp.dataset.stage;
      if (s.roles[role]) s.roles[role].mustHave[stage] = inp.value.trim() || null;
    });

    // Role minStats
    document.querySelectorAll('input[data-role][data-field="minStats"]').forEach(inp => {
      const role  = inp.dataset.role;
      const stage = inp.dataset.stage;
      if (s.roles[role]) s.roles[role].minStats[stage] = parseInt(inp.value) || 1;
    });

    s.reapp = {
      maxEff: parseFloat(document.getElementById('reapp-max-eff').value) || 65,
      sets: parseList(document.getElementById('reapp-sets').value),
      innateStats: parseList(document.getElementById('reapp-innate').value),
      mainBySlot: {
        2: parseList(document.getElementById('reapp-main2').value),
        4: parseList(document.getElementById('reapp-main4').value),
        6: parseList(document.getElementById('reapp-main6').value),
      }
    };
    s.grind = {
      gap: Number.isFinite(Number(document.getElementById('grind-gap').value))
        ? Math.max(0, Number(document.getElementById('grind-gap').value))
        : 1,
    };

    s.gemMeta = window.SWRM.mergeGemMeta({
      ...window.SWRM.settings.gemMeta,
      legacyFlatSubGem: document.getElementById('gem-bad-flat-enabled').checked,
    });

    s.statConstants = collectStatConstantsFromForm();
    window.SWRM.applyDerivedThresholdFields(s);

    if (typeof readPolicyFromControls === 'function') {
      s.policy = readPolicyFromControls();
    }
    const dash = document.getElementById('dashboard-policy-strictness');
    const stSel = document.getElementById('stage-select');
    let stg = 'Mid';
    if (stSel && (stSel.value === 'Early' || stSel.value === 'Mid' || stSel.value === 'Late')) stg = stSel.value;
    const v = Math.max(1, Math.min(5, parseInt(dash && dash.value, 10) || 3));
    if (typeof window.applySimpleAnalyzerPolicy === 'function') {
      window.applySimpleAnalyzerPolicy(stg, v);
      s.policy = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    }

    const persist = JSON.parse(JSON.stringify(s));
    delete persist.hrThresholds;
    delete persist.duoThresholds;
    delete persist.godConstants;
    delete persist.hrCoeff;
    saveSettings(persist);

    refreshRoleFilterOptions();
    if (processedRunes.length) reprocess();
    alert('Settings saved & recalculated!');
  });

  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', async () => {
    initSwrmFloatingTips();
    initTheme();
    await updateLanguage(currentLang);
    initDashboardUnifiedTabs();
    initRuneTablePrefsFromStorage();
    if (typeof initTableKindTabs === 'function') initTableKindTabs();
    initRulesSubtabs();
    initChangelogSubtabs();
    initGuideSubtabs();
    showMainTab(mainTabIdFromHash() || 'runes');

    const shareIdInUrl =
      typeof getShareIdFromUrl === 'function' ? getShareIdFromUrl() : '';
    const profileInUrl =
      typeof getProfileLinkFromUrl === 'function' ? getProfileLinkFromUrl() : null;
    const hasProfileLink =
      profileInUrl && (profileInUrl.profileUrl || profileInUrl.dataBlob);
    if ((shareIdInUrl || hasProfileLink) && typeof initShareProfile === 'function') {
      await initShareProfile();
      renderDbSlots();
      if (typeof applyShareUrlTabFromLocation === 'function') applyShareUrlTabFromLocation();
      return;
    }
    if (typeof initShareProfile === 'function') {
      await initShareProfile();
    }

    if (typeof scrubDemoFromUserSlots === 'function') {
      await scrubDemoFromUserSlots();
    }

    const savedRunes = localStorage.getItem('loadedRunes');

    try {
      const slots = loadDbSlots();
      const hasSlotMeta = slots.some(s => s.name && s.name.trim() !== '');
      const realSlot = (s) => s.name && s.name.trim() !== '' && !(typeof slotNameLooksLikeDemo === 'function' && slotNameLooksLikeDemo(s.name));
      const targetSlot =
        slots.find(s => s.active && realSlot(s)) ||
        slots.find(s => realSlot(s));

      console.log('=== INITIALIZATION DEBUG ===');
      console.log('Slots from loadDbSlots():', slots);
      console.log('hasSlotMeta:', hasSlotMeta, 'targetSlot:', targetSlot);

      if (!Array.isArray(slots) || slots.length === 0) {
        console.error('Invalid slots array:', slots);
        if (!userHasLoadedRealExport()) {
          const demoOk = await installEmbeddedDemoDataset();
          if (!demoOk) uiShowUploadPrompt();
        } else {
          uiShowUploadPrompt();
        }
      } else {
        console.log('Slots metadata key present:', !!localStorage.getItem(DB_SLOTS_META_KEY));

        let restored = false;

        if (targetSlot) {
          const jsonText = await loadSlotData(targetSlot.id);
          if (tryHydrateRunesFromJsonText(jsonText)) {
            if (typeof markUsingDemoDataset === 'function') markUsingDemoDataset(false);
            uiAfterSuccessfulRuneRestore(targetSlot);
            restored = true;
          } else if (savedRunes && tryHydrateRunesFromJsonText(savedRunes)) {
            console.log(`IndexedDB empty for Data ${targetSlot.id}; restored from localStorage backup`);
            if (typeof markUsingDemoDataset === 'function') markUsingDemoDataset(false);
            uiAfterSuccessfulRuneRestore(targetSlot);
            restored = true;
          }
        }

        if (!restored && savedRunes && tryHydrateRunesFromJsonText(savedRunes)) {
          if (!hasSlotMeta) {
            const migrated = loadDbSlots();
            const name = localStorage.getItem('loadedRunesName') || 'Saved export';
            const dateRaw = localStorage.getItem('loadedRunesDate') || '';
            let parsedObj = null;
            try {
              parsedObj = JSON.parse(savedRunes);
            } catch (e) { /* ignore */ }
            migrated.forEach(s => {
              if (s.id === 1) {
                if (parsedObj) {
                  applySlotSummaryFromJson(s, name, parsedObj);
                } else {
                  s.name = name;
                  s.uploadedAt = dateRaw ? new Date(dateRaw).toLocaleString() : new Date().toLocaleString();
                  s.wizardName = '';
                  s.wizardLevel = null;
                  s.wizardId = '';
                  s.monsterCount = null;
                  s.inventoryRuneCount = null;
                  s.runeCount = allRunes.length;
                }
              }
              s.active = s.id === 1;
            });
            saveDbSlots(migrated);
            try {
              await saveSlotData(1, savedRunes);
            } catch (e) {
              console.warn('Could not mirror JSON to IndexedDB slot 1:', e);
            }
          }
          if (typeof markUsingDemoDataset === 'function') markUsingDemoDataset(false);
          uiAfterSuccessfulRuneRestore({ name: localStorage.getItem('loadedRunesName') || 'Saved export', id: 1 });
          restored = true;
        }

        if (!restored) {
          if (userHasLoadedRealExport()) {
            if (hasSlotMeta && targetSlot) {
              console.log(`Slot ${targetSlot.id} has metadata but no readable JSON; showing upload prompt`);
            } else {
              console.log('No saved runes found; showing upload prompt');
            }
            uiShowUploadPrompt();
          } else {
            if (hasSlotMeta && targetSlot) {
              console.log(`Slot ${targetSlot.id} has metadata but no readable JSON; trying embedded demo`);
            } else {
              console.log('No saved runes found; trying embedded demo');
            }
            let demoOk = false;
            if (typeof restoreEmbeddedDemoFromStorage === 'function') {
              demoOk = await restoreEmbeddedDemoFromStorage();
            }
            if (!demoOk) demoOk = await installEmbeddedDemoDataset();
            if (!demoOk) uiShowUploadPrompt();
          }
        }
      }
    } catch (err) {
      console.error('Error during restore:', err);
      try {
        if (!userHasLoadedRealExport()) {
          const demoOk = await installEmbeddedDemoDataset();
          if (!demoOk) uiShowUploadPrompt();
        } else {
          uiShowUploadPrompt();
        }
      } catch (e2) {
        uiShowUploadPrompt();
      }
    }

    document.getElementById('demo-banner-dismiss')?.addEventListener('click', () => {
      try {
        sessionStorage.setItem(SS_DEMO_BANNER_DISMISS, '1');
      } catch (e) { /* ignore */ }
      syncDemoBannerVisibility();
    });
    document.getElementById('demo-banner-upload-btn')?.addEventListener('click', () => {
      uiShowUploadPrompt();
    });

    // Initialize Database slots
    renderDbSlots();
  });

  // Reset settings
  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults?')) return;
    window.SWRM.settings = {
      thresholds: JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
      statConstants: JSON.parse(JSON.stringify(DEFAULT_STAT_CONSTANTS)),
      roles: JSON.parse(JSON.stringify(DEFAULT_ROLES)),
      formulas: JSON.parse(JSON.stringify(DEFAULT_FORMULAS)),
      rolePriority: [],
      reapp: JSON.parse(JSON.stringify(DEFAULT_REAPP)),
      grind: JSON.parse(JSON.stringify(DEFAULT_GRIND)),
      gemMeta: JSON.parse(JSON.stringify(DEFAULT_GEM_META)),
      presetVersion: 15,
    };
    window.SWRM.applyDerivedThresholdFields(window.SWRM.settings);
    localStorage.removeItem('swrm_settings_v1');
    location.reload();
  });


  function getDashboardGameStage() {
    const sel = document.getElementById('stage-select');
    const v = sel && sel.value;
    if (v === 'Early' || v === 'Mid' || v === 'Late') return v;
    return 'Mid';
  }

  function stageToSimplePreset(stage) {
    if (stage === 'Early') return 'Early Progression';
    if (stage === 'Late') return 'Late Progression';
    return 'Mid Progression';
  }

  function updateDashboardStrictnessHints() {
    const el = document.getElementById('dashboard-policy-strictness');
    const hint = document.getElementById('dashboard-policy-strictness-hint');
    if (!el || !hint) return;
    const v = Math.max(1, Math.min(5, parseInt(el.value, 10) || 3));
    hint.textContent = `${v}/5`;
  }

  function policyFromPresetName(name) {
    const presets = window.SWRM.DEFAULT_EVAL_POLICY_PRESETS || {};
    const tmpl = presets[name];
    const cur = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    if (!tmpl) {
      return window.SWRM.mergeEvalPolicy({ ...cur, preset: name || 'Custom' });
    }
    return window.SWRM.mergeEvalPolicy({
      ...cur,
      ...tmpl,
      preset: tmpl.preset,
      simpleStrictness: cur.simpleStrictness,
      relaxedRetryMode: cur.relaxedRetryMode,
    });
  }

  /**
   * Strictness 1–5: L=3 matches the stage preset baseline. Each step moves real filters:
   * minUsefulSubs ±1 per level, minRolePressure ~±0.08/step, God/Duo/Slow-DPS ratios for Universal,
   * anchor/slot modes at extremes. L≥4 turns relaxed retry off so strict pass dominates.
   */
  function blendSimpleStrictnessOntoStageTemplate(tmpl, L) {
    const presets = window.SWRM.DEFAULT_EVAL_POLICY_PRESETS || {};
    const late = presets['Late Progression'] || {};
    const d = L - 3;
    const base = window.SWRM.mergeEvalPolicy(tmpl);

    const tUp = Math.max(0, d) / 2;
    const tDown = Math.max(0, -d) / 2;

    const blendRatioField = (field, forgiving) => {
      const fb = Number(base[field]);
      const cur = Number.isFinite(fb) ? fb : forgiving;
      if (d > 0) {
        const dest = Number(late[field]);
        const end = Number.isFinite(dest) ? dest : cur;
        return Math.max(0.62, Math.min(1.02, cur + (end - cur) * tUp));
      }
      if (d < 0) {
        return Math.max(0.62, Math.min(1.02, cur + (forgiving - cur) * tDown));
      }
      return cur;
    };

    // ~0.08 / step on global floor (target band 0.05–0.10 between adjacent levels)
    const minRolePressure = Math.max(
      0,
      Math.min(0.52, Number(base.minRolePressure || 0) + d * 0.082),
    );

    const prMult = 1 + d * 0.15;
    const rolePressureByRole = {};
    const srcRp = base.rolePressureByRole && typeof base.rolePressureByRole === 'object' ? base.rolePressureByRole : {};
    Object.keys(srcRp).forEach((role) => {
      const v = Number(srcRp[role]);
      if (!Number.isFinite(v)) return;
      const boosted = v * prMult + Math.max(0, d) * 0.028;
      rolePressureByRole[role] = Math.max(0.18, Math.min(0.8, boosted));
    });

    // Exactly one useful-sub step per strictness level vs L=3 baseline
    const minUsefulSubsByRole = {};
    const srcMu = base.minUsefulSubsByRole && typeof base.minUsefulSubsByRole === 'object' ? base.minUsefulSubsByRole : {};
    const rolesFromFormulas = Object.keys(window.SWRM.settings?.formulas || {});
    const muKeys = new Set([...Object.keys(srcMu), ...rolesFromFormulas]);
    muKeys.forEach((role) => {
      let n = Number(srcMu[role]);
      if (!Number.isFinite(n)) n = 2;
      const adj = n + d;
      minUsefulSubsByRole[role] = Math.max(1, Math.min(5, adj));
    });

    let minStatsModifier = 0;
    if (Number(base.minStatsModifier) === 1) minStatsModifier = 1;
    else if (Number(base.minStatsModifier) === -1) minStatsModifier = -1;
    if (d <= -2) minStatsModifier = -1;
    else if (d >= 2) minStatsModifier = 1;

    let anchorMode = base.anchorMode === 'soft' ? 'soft' : 'hard';
    if (d <= -1) anchorMode = 'soft';
    else if (d >= 1) anchorMode = 'hard';

    let slotRequirementMode = base.slotRequirementMode === 'soft' ? 'soft' : 'hard';
    if (d <= -1) slotRequirementMode = 'soft';
    else if (d >= 1) slotRequirementMode = 'hard';

    // High strictness: no second pass — primary policy + Universal thresholds decide.
    const relaxedRetryMode = L >= 4 ? 'off' : 'normal';

    return window.SWRM.mergeEvalPolicy({
      ...base,
      preset: base.preset,
      anchorMode,
      slotRequirementMode,
      minStatsModifier,
      minRolePressure,
      rolePressureByRole,
      minUsefulSubsByRole,
      slowDpsCoreMinRatio: blendRatioField('slowDpsCoreMinRatio', 0.665),
      godRollMinRatio: blendRatioField('godRollMinRatio', 0.855),
      duoRollMinRatio: blendRatioField('duoRollMinRatio', 0.755),
      simpleStrictness: L,
      relaxedRetryMode,
      godCountsAsRole: false,
      duoCountsAsRole: false,
    });
  }

  function applySimpleAnalyzerPolicy(gameStage, strictness) {
    const presets = window.SWRM.DEFAULT_EVAL_POLICY_PRESETS || {};
    const presetName = stageToSimplePreset(gameStage || 'Mid');
    const tmpl = presets[presetName] || presets['Mid Progression'];
    const L = Math.max(1, Math.min(5, Number(strictness) || 3));

    const next = blendSimpleStrictnessOntoStageTemplate(tmpl, L);
    window.SWRM.settings.policy = next;
    writePolicyToExpertControls(next);
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    refreshPolicySummary();
  }

  function writePolicyToExpertControls(policy) {
    const p = window.SWRM.mergeEvalPolicy(policy);
    const setSel = (id, val) => {
      const el = document.getElementById(id);
      if (!el || val == null) return;
      el.value = String(val);
    };
    setSel('policy-preset', p.preset);
    setSel('policy-anchor-mode', p.anchorMode);
    setSel('policy-slotreq-mode', p.slotRequirementMode);
    setSel('policy-minstats-mod', String(p.minStatsModifier));
    const mp = document.getElementById('policy-min-pressure');
    if (mp) {
      const want = Number(p.minRolePressure).toFixed(2);
      const opts = Array.from(mp.options).map((o) => o.value);
      mp.value = opts.includes(want) ? want : (opts.includes('0.00') ? '0.00' : mp.options[0].value);
    }
    const g = document.getElementById('policy-god-counts');
    const d = document.getElementById('policy-duo-counts');
    if (g) g.checked = !!p.godCountsAsRole;
    if (d) d.checked = !!p.duoCountsAsRole;
    const dash = document.getElementById('dashboard-policy-strictness');
    if (dash) dash.value = String(Math.max(1, Math.min(5, Number(p.simpleStrictness) || 3)));
  }

  function readPolicyFromControls() {
    const cur = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    const preset = document.getElementById('policy-preset')?.value || cur.preset;
    const anchorMode = document.getElementById('policy-anchor-mode')?.value === 'soft' ? 'soft' : 'hard';
    const slotRequirementMode = document.getElementById('policy-slotreq-mode')?.value === 'soft' ? 'soft' : 'hard';
    const msm = parseInt(document.getElementById('policy-minstats-mod')?.value, 10);
    const minStatsModifier = msm === -1 || msm === 1 ? msm : 0;
    const mpSel = document.getElementById('policy-min-pressure');
    const minRolePressure = mpSel ? Number(mpSel.value) : cur.minRolePressure;
    const merged = window.SWRM.mergeEvalPolicy({
      ...cur,
      preset,
      anchorMode,
      slotRequirementMode,
      minStatsModifier,
      minRolePressure: Number.isFinite(minRolePressure) ? minRolePressure : cur.minRolePressure,
      godCountsAsRole: !!document.getElementById('policy-god-counts')?.checked,
      duoCountsAsRole: !!document.getElementById('policy-duo-counts')?.checked,
    });
    const dash = document.getElementById('dashboard-policy-strictness');
    if (dash) {
      const ss = parseInt(dash.value, 10);
      if (Number.isFinite(ss)) merged.simpleStrictness = Math.max(1, Math.min(5, ss));
    }
    return window.SWRM.mergeEvalPolicy(merged);
  }

  function refreshPolicySummary() {
    const el = document.getElementById('policy-summary');
    if (!el) return;
    const p = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    const a = p.anchorMode === 'soft' ? 'anchor soft' : 'anchor hard';
    const s = p.slotRequirementMode === 'soft' ? 'slots soft' : 'slots hard';
    el.textContent = `${p.preset} · ${a} · ${s} · pressure ${Number(p.minRolePressure).toFixed(2)} · strictness ${p.simpleStrictness}/5 · retry ${p.relaxedRetryMode || 'normal'}`;
  }

  function syncPolicySimplePreview() {
    const simplePrev = document.getElementById('policy-simple-preview');
    if (simplePrev) simplePrev.hidden = true;
  }

  let policyReprocTm = null;
  function schedulePolicyReprocess() {
    refreshPolicySummary();
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    if (typeof processedRunes === 'undefined' || !processedRunes.length) return;
    clearTimeout(policyReprocTm);
    policyReprocTm = setTimeout(() => {
      if (processedRunes.length) reprocess();
    }, 90);
  }

  function applyPolicyExpertUi() {
    const expert = document.getElementById('policy-expert-wrap');
    if (expert) expert.hidden = false;
  }

  function initPolicySimpleExpertUx() {
    applyPolicyExpertUi();
  }

  function initThresholdPreviewsToggle() {
    const btn = document.getElementById('btn-toggle-threshold-previews');
    const wrap = document.getElementById('threshold-previews-wrap');
    if (!btn || !wrap) return;
    const tloc = () => TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const syncBtn = () => {
      const t = tloc();
      const hidden = wrap.hasAttribute('hidden');
      btn.textContent = hidden
        ? (t.rulesThresholdPreviewsShow || 'Show threshold previews')
        : (t.rulesThresholdPreviewsHide || 'Hide threshold previews');
    };
    syncBtn();
    btn.addEventListener('click', () => {
      if (wrap.hasAttribute('hidden')) wrap.removeAttribute('hidden');
      else wrap.setAttribute('hidden', '');
      syncBtn();
    });
  }

  function initPolicyControls() {
    const pol = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    writePolicyToExpertControls(pol);
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    refreshPolicySummary();

    applySimpleAnalyzerPolicy(getDashboardGameStage(), pol.simpleStrictness);

    const dash = document.getElementById('dashboard-policy-strictness');
    if (dash) {
      dash.addEventListener('input', () => updateDashboardStrictnessHints());
      dash.addEventListener('change', () => {
        const v = Math.max(1, Math.min(5, parseInt(dash.value, 10) || 3));
        applySimpleAnalyzerPolicy(getDashboardGameStage(), v);
        schedulePolicyReprocess();
      });
    }

    document.getElementById('policy-preset')?.addEventListener('change', (e) => {
      const name = e.target && e.target.value;
      if (name && name !== 'Custom') {
        window.SWRM.settings.policy = policyFromPresetName(name);
        writePolicyToExpertControls(window.SWRM.settings.policy);
      } else {
        window.SWRM.settings.policy = window.SWRM.mergeEvalPolicy({
          ...window.SWRM.settings.policy,
          preset: 'Custom',
        });
      }
      schedulePolicyReprocess();
    });

    ['policy-anchor-mode', 'policy-slotreq-mode', 'policy-minstats-mod', 'policy-min-pressure'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => {
        window.SWRM.settings.policy = readPolicyFromControls();
        schedulePolicyReprocess();
      });
    });
    document.getElementById('policy-god-counts')?.addEventListener('change', () => {
      window.SWRM.settings.policy = readPolicyFromControls();
      schedulePolicyReprocess();
    });
    document.getElementById('policy-duo-counts')?.addEventListener('change', () => {
      window.SWRM.settings.policy = readPolicyFromControls();
      schedulePolicyReprocess();
    });
  }

  window.applySimpleAnalyzerPolicy = applySimpleAnalyzerPolicy;
  window.getDashboardGameStage = getDashboardGameStage;
  window.syncPolicySimplePreview = syncPolicySimplePreview;

  window.swrmOnDashboardStageChanged = function () {
    const dash = document.getElementById('dashboard-policy-strictness');
    const v = dash ? Math.max(1, Math.min(5, parseInt(dash.value, 10) || 3)) : 3;
    applySimpleAnalyzerPolicy(getDashboardGameStage(), v);
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    refreshPolicySummary();
    schedulePolicyReprocess();
  };

  initPolicyControls();
  initPolicySimpleExpertUx();
  initThresholdPreviewsToggle();

  // ===================== APP SETTINGS =====================
  const DB_SLOTS_META_KEY = 'swrm_db_slots_meta_v1';

  // IndexedDB setup for large JSON files
  const DB_NAME = 'SWRM';
  const DB_VERSION = 1;
  const STORE_NAME = 'slots';
  let idb = null;

  async function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { idb = req.result; resolve(idb); };
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async function saveSlotData(slotId, jsonText) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: slotId, jsonText });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function loadSlotData(slotId) {
    if (!idb) await initIndexedDB();
    const get = (key) => new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.jsonText || '');
      req.onerror = () => reject(req.error);
    });
    let text = await get(slotId);
    if (text) return text;
    if (slotId === 'current-runes') return '';
    if (typeof slotId === 'number' && !Number.isNaN(slotId)) {
      text = await get(String(slotId));
    } else if (typeof slotId === 'string' && /^\d+$/.test(slotId)) {
      text = await get(Number(slotId));
    }
    return text || '';
  }

  async function deleteSlotData(slotId) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(slotId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteSlotDataRobust(slotId) {
    await deleteSlotData(slotId);
    if (typeof slotId === 'number' && !Number.isNaN(slotId)) {
      await deleteSlotData(String(slotId));
    }
  }

  async function clearAllIndexedDbRunePayloads() {
    for (const id of [1, 2, 3, 4, 'current-runes', '__swrm_embedded_demo__']) {
      try {
        await deleteSlotDataRobust(id);
      } catch (e) {
        console.warn('clearAllIndexedDbRunePayloads', id, e);
      }
    }
  }

  function loadDbSlots() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_SLOTS_META_KEY) || '[]');
      if (Array.isArray(parsed) && parsed.length === 4) return parsed.map(normalizeDbSlot);
    } catch(e) {}
    return defaultEmptyDbSlotsMeta();
  }

  function saveDbSlots(slots) {
    const meta = slots.map(s => normalizeDbSlot(s));
    localStorage.setItem(DB_SLOTS_META_KEY, JSON.stringify(meta));
  }

  function renderDbSlots() {
    const wrap = document.getElementById('db-slots-wrap');
    if (!wrap) {
      console.error('db-slots-wrap element not found');
      return;
    }
    const slots = loadDbSlots();
    const t = TRANSLATIONS && TRANSLATIONS[currentLang] ? TRANSLATIONS[currentLang] : {};
    
    wrap.innerHTML = slots.map(slot => {
      const hasData = !!slot.name;
      const summaryHtml = formatSlotSummaryLine(slot, t);
      const activeClass = slot.active ? ' db-slot--active' : '';
      const activePill = slot.active
        ? `<span class="db-slot-active-pill" aria-label="${escapeHtml(t.activeProfile || t.current)}">${escapeHtml(t.activeProfile || t.current)}</span>`
        : '';
      return `
      <div class="db-slot${activeClass}" data-slot="${slot.id}" ${slot.active ? 'data-active="true"' : ''}>
        <div class="db-slot-header-row">
          <div class="db-slot-title">${escapeHtml(t.dbSlot || 'Database Slot')} ${slot.id}</div>
          ${activePill}
        </div>
        <div class="db-slot-meta">${escapeHtml(t.name || 'Name')}: ${escapeHtml(slot.name) || '—'}</div>
        <div class="db-slot-meta">${escapeHtml(t.uploaded || 'Uploaded')}: ${escapeHtml(slot.uploadedAt) || '—'}</div>
        ${summaryHtml}
        <div class="db-slot-actions">
          <button type="button" class="btn-ghost" data-db-action="clipboard" data-slot="${slot.id}">${escapeHtml(t.clipboard || 'Clipboard')}</button>
          <button type="button" class="btn-ghost" data-db-action="upload" data-slot="${slot.id}">${escapeHtml(t.upload || 'Upload')}</button>
          <button type="button" class="btn-ghost" ${hasData ? '' : 'disabled'} data-db-action="download" data-slot="${slot.id}">${escapeHtml(t.download || 'Download')}</button>
          <button type="button" class="btn-ghost" ${hasData ? '' : 'disabled'} data-db-action="delete" data-slot="${slot.id}">${escapeHtml(t.delete || 'Delete')}</button>
          ${slot.active || !hasData ? '' : `<button type="button" class="btn-primary" data-db-action="swap" data-slot="${slot.id}">${escapeHtml(t.swap || 'Swap')}</button>`}
        </div>
      </div>`;
    }).join('');
  }

  async function processJsonData(jsonText) {
    const json = JSON.parse(jsonText);
    allRunes = parseSWEX(json);
    rebuildUnitsFromSwex(json);
    reprocess();
    markUserLoadedRealExport();
    if (typeof purgeDemoStorage === 'function') await purgeDemoStorage();
    if (typeof scrubDemoFromUserSlots === 'function') await scrubDemoFromUserSlots();
    if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
    else if (typeof removeDemoTeams === 'function') removeDemoTeams();
    syncDemoBannerVisibility();
    document.getElementById('upload-prompt').classList.add('hidden');
  }

  async function parseAndLoadJson(jsonText) {
    await processJsonData(jsonText);
    showMainTab('dashboard', { writeHash: true });
  }

  function syncHeaderLangMenu() {
    const select = document.getElementById('app-language');
    const wrap = document.getElementById('header-lang-wrap');
    const btn = document.getElementById('header-lang-btn');
    const menu = document.getElementById('header-lang-menu');
    if (!select || !wrap || !menu) return;
    select.value = currentLang;
    menu.querySelectorAll('[data-lang]').forEach((opt) => {
      const on = opt.dataset.lang === currentLang;
      opt.classList.toggle('is-active', on);
      opt.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (btn) {
      btn.title = t.language || 'Language';
      btn.setAttribute('aria-label', t.language || 'Language');
    }
  }

  function closeHeaderLangMenu() {
    const wrap = document.getElementById('header-lang-wrap');
    const btn = document.getElementById('header-lang-btn');
    const menu = document.getElementById('header-lang-menu');
    if (!wrap || !menu) return;
    wrap.classList.remove('is-open');
    menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function initHeaderLangMenu() {
    const wrap = document.getElementById('header-lang-wrap');
    const btn = document.getElementById('header-lang-btn');
    const menu = document.getElementById('header-lang-menu');
    const select = document.getElementById('app-language');
    if (!wrap || !btn || !menu || !select) return;
    syncHeaderLangMenu();
    if (btn.dataset.bound) return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !wrap.classList.contains('is-open');
      closeHeaderLangMenu();
      if (open) {
        wrap.classList.add('is-open');
        menu.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
    });
    menu.querySelectorAll('[data-lang]').forEach((opt) => {
      opt.addEventListener('click', async (e) => {
        e.preventDefault();
        let v = opt.dataset.lang || 'en';
        if (!['en', 'ru', 'fr'].includes(v)) v = 'en';
        closeHeaderLangMenu();
        await updateLanguage(v);
        select.value = currentLang;
        syncHeaderLangMenu();
      });
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#header-lang-wrap')) closeHeaderLangMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeHeaderLangMenu();
    });
  }

  initHeaderLangMenu();

  const appLangSelect = document.getElementById('app-language');
  if (appLangSelect) {
    appLangSelect.value = currentLang;
    appLangSelect.addEventListener('change', async () => {
      let v = appLangSelect.value || 'en';
      if (!['en', 'ru', 'fr'].includes(v)) v = 'en';
      await updateLanguage(v);
      appLangSelect.value = currentLang;
      syncHeaderLangMenu();
    });
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.syncHeaderLangMenu = syncHeaderLangMenu;

  document.getElementById('theme-toggle')?.addEventListener('click', () => toggleTheme());

  document.getElementById('db-slots-wrap')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-db-action]');
    if (!btn) return;
    e.stopPropagation();
    
    const action = btn.dataset.dbAction;
    const slotId = Number(btn.dataset.slot);
    console.log('Slot action:', action, 'slotId:', slotId);
    
    const slots = loadDbSlots();
    const idx = slots.findIndex(s => s.id === slotId);
    if (idx < 0) return;
    const slot = slots[idx];
    const t = TRANSLATIONS[currentLang];

    if (action === 'clipboard') {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        let jsonObj;
        try {
          jsonObj = JSON.parse(text);
        } catch {
          alert(t.clipboardNotJson || 'Clipboard does not contain valid JSON.');
          return;
        }
        await saveSlotData(slotId, text);
        applySlotSummaryFromJson(slot, `Clipboard ${slotId}`, jsonObj);
        saveDbSlots(slots);
        renderDbSlots();
        markUserLoadedRealExport();
        syncDemoBannerVisibility();
      } catch(err) {
        alert('Clipboard access denied or not available');
      }
      return;
    }
    
    if (action === 'upload') {
      console.log('Upload clicked for slot', slotId);
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      
      inp.addEventListener('change', async ev => {
        console.log('File selected');
        const file = ev.target.files?.[0];
        if (!file) {
          console.log('No file selected');
          return;
        }
        console.log('Reading file:', file.name);
        const reader = new FileReader();
        reader.onload = async event => {
          try {
            const text = event.target.result;
            console.log('File read successfully, length:', text.length);
            const jsonObj = JSON.parse(text);
            await saveSlotData(slotId, text);
            applySlotSummaryFromJson(slot, file.name, jsonObj);
            slots.forEach((s) => { s.active = s.id === slotId; });
            saveDbSlots(slots);
            await processJsonData(text);
            renderDbSlots();
            console.log('Slot saved and rendered');
          } catch(err) {
            console.error('Error saving to IndexedDB:', err);
            alert('Failed to save file: ' + err.message);
          }
        };
        reader.onerror = () => console.error('File read error');
        reader.readAsText(file);
        document.body.removeChild(inp);
      });
      
      inp.click();
      return;
    }
    
    if (action === 'download') {
      try {
        const jsonText = await loadSlotData(slotId);
        if (!jsonText) return;
        const blob = new Blob([jsonText], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = slot.name || `slot-${slot.id}.json`;
        a.click();
      } catch(err) {
        alert('Failed to load slot data: ' + err.message);
      }
      return;
    }
    
    if (action === 'delete') {
      if (!confirm(`Delete slot ${slot.id}?`)) return;
      try {
        const wasActive = slot.active;
        await deleteSlotDataRobust(slotId);
        slots[idx] = normalizeDbSlot({ id: slot.id, name: '', uploadedAt: '', active: false });

        const namedSlots = slots.filter(s => s.name && s.name.trim() !== '');

        if (namedSlots.length === 0) {
          resetDemoAndRealPersistenceFlags();
          await clearAllIndexedDbRunePayloads();
          clearLocalStorageRuneBackup();
          saveDbSlots(defaultEmptyDbSlotsMeta());
          uiEmptyRuneApplicationState({ keepTab: true });
          showSwrmToast(t.slotDeleteAllCleared || 'All saved databases were removed.', { type: 'info' });
          renderDbSlots();
          const demoOk = await installEmbeddedDemoDataset({ keepTab: true });
          if (!demoOk) uiEmptyRuneApplicationState({ keepTab: false });
          renderDbSlots();
          return;
        }

        const needReselectActive =
          wasActive || !slots.some(s => s.active && s.name && s.name.trim() !== '');

        if (needReselectActive) {
          let next = slots.find(s => s.active && s.name && s.name.trim() !== '');
          if (!next) next = namedSlots[0];
          slots.forEach(s => {
            s.active = s.id === next.id;
          });
          saveDbSlots(slots);
          clearLocalStorageRuneBackup();
          const jsonText = await loadSlotData(next.id);
          if (!jsonText || !tryHydrateRunesFromJsonText(jsonText)) {
            resetDemoAndRealPersistenceFlags();
            await clearAllIndexedDbRunePayloads();
            clearLocalStorageRuneBackup();
            saveDbSlots(defaultEmptyDbSlotsMeta());
            uiEmptyRuneApplicationState({ keepTab: true });
            showSwrmToast(t.slotDeleteNextLoadFailed || 'Could not load the next database.', { type: 'error', duration: 7000 });
            renderDbSlots();
            const demoOk = await installEmbeddedDemoDataset({ keepTab: true });
            if (!demoOk) uiEmptyRuneApplicationState({ keepTab: false });
            renderDbSlots();
            return;
          }
          uiAfterSuccessfulRuneRestore(next, { keepTab: true });
          const msg = (t.slotDeleteSwitchedTo || '')
            .replace('{n}', String(next.id))
            .replace('{name}', next.name || '');
          if (msg) showSwrmToast(msg, { type: 'success' });
        } else {
          clearLocalStorageRuneBackup();
        }

        saveDbSlots(slots);
        renderDbSlots();
      } catch (err) {
        showSwrmToast('Failed to delete slot: ' + err.message, { type: 'error', duration: 7000 });
      }
      return;
    }
    
    if (action === 'swap') {
      try {
        const jsonText = await loadSlotData(slotId);
        if (!jsonText) return alert(t.slotEmpty || 'Selected slot is empty');
        slots.forEach(s => { s.active = s.id === slot.id; });
        saveDbSlots(slots);
        await processJsonData(jsonText);
      } catch(err) {
        alert((t.parseError || 'Failed to parse slot JSON: ') + err.message);
      }
      renderDbSlots();
    }
  });

  const SHARE_QUERY_KEY = 's';
  const PROFILE_URL_QUERY_KEY = 'profile';
  const PROFILE_DATA_QUERY_KEY = 'data';
  const SHARE_SESSION_KEY = 'swrm_share_readonly_v1';
  const SHARE_EXPIRY_DAYS = 90;
  const SHARE_MODE_STORAGE_KEY = 'swrm_share_mode_v1';
  /** Cloudflare D1 row limit ~2 MB; keep request body under this. */
  const SHARE_MAX_BODY_BYTES = 1_850_000;
  let shareReadOnly = false;
  let shareViewLoadFailed = false;
  let shareViewWizardName = '';
  let shareExportMode = 'all';
  /** Set when viewing a shared profile (payload share_mode). */
  let shareViewExportMode = '';

  const SHARE_MODE_LABEL_KEYS = {
    'all': 'shareModeAll',
    'equipped-monsters': 'shareModeEquippedMonsters',
    'equipped-runes': 'shareModeEquippedRunes',
    'equipped-both': 'shareModeEquippedBoth',
    selected: 'shareModeSelected',
    favorites: 'shareModeFavorites',
  };

  function shareToast(message, type) {
    const opts = { type: type || 'info', duration: type === 'error' ? 6800 : 5200 };
    if (typeof showSwrmToast === 'function') showSwrmToast(message, opts);
    else if (typeof showToast === 'function') showToast(message, opts.type);
  }

  function readStoredShareMode() {
    try {
      const v = localStorage.getItem(SHARE_MODE_STORAGE_KEY);
      return v && SHARE_MODE_LABEL_KEYS[v] ? v : 'all';
    } catch (e) {
      return 'all';
    }
  }

  function writeStoredShareMode(mode) {
    try {
      localStorage.setItem(SHARE_MODE_STORAGE_KEY, mode);
    } catch (e) { /* ignore */ }
  }

  function getShareExportMode() {
    return shareExportMode;
  }

  function setShareExportMode(mode) {
    if (!SHARE_MODE_LABEL_KEYS[mode]) mode = 'all';
    shareExportMode = mode;
    writeStoredShareMode(mode);
    syncShareSplitLabels();
  }

  function shareModeLabel(mode, t) {
    const key = SHARE_MODE_LABEL_KEYS[mode] || SHARE_MODE_LABEL_KEYS.all;
    return (t && t[key]) || mode;
  }

  function syncShareSplitLabels() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const mainLabel = t.shareButtonLabel || 'Share';
    document.querySelectorAll('[data-share-split-label]').forEach((el) => {
      el.textContent = mainLabel;
    });
    document.querySelectorAll('[data-share-mode]').forEach((btn) => {
      const on = btn.dataset.shareMode === shareExportMode;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }

  function getShareIdFromUrl() {
    try {
      return new URL(window.location.href).searchParams.get(SHARE_QUERY_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function getProfileLinkFromUrl() {
    try {
      const params = new URL(window.location.href).searchParams;
      return {
        profileUrl: (params.get(PROFILE_URL_QUERY_KEY) || '').trim(),
        dataBlob: (params.get(PROFILE_DATA_QUERY_KEY) || '').trim(),
      };
    } catch (e) {
      return { profileUrl: '', dataBlob: '' };
    }
  }

  function decodeProfileDataParam(blob) {
    const raw = String(blob || '').trim();
    if (!raw) return '';
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padLen = (4 - (b64.length % 4)) % 4;
    const padded = b64 + (padLen ? '='.repeat(padLen) : '');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function normalizeProfileSwexRoot(parsed) {
    if (!parsed || typeof parsed !== 'object') return null;
    if (Array.isArray(parsed.unit_list) || Array.isArray(parsed.runes) || Array.isArray(parsed.rune_list)) {
      return parsed;
    }
    if (parsed.data && typeof parsed.data === 'object') return normalizeProfileSwexRoot(parsed.data);
    if (typeof parsed.data === 'string') {
      try {
        return normalizeProfileSwexRoot(JSON.parse(parsed.data));
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function applyReadOnlyProfilePayload(parsed, wizardName) {
    const root = normalizeProfileSwexRoot(parsed);
    if (!root) return false;
    const name =
      String(wizardName || '').trim() ||
      String(
        (root.wizard_info && (root.wizard_info.wizard_name || root.wizard_info.name)) ||
          root.wizard_name ||
          '',
      ).trim();
    if (!tryHydrateRunesFromJsonText(JSON.stringify(root))) return false;
    shareReadOnly = true;
    persistShareSession(true);
    shareViewLoadFailed = false;
    shareViewWizardName = name;
    shareViewExportMode = String(
      root.share_mode || parsed.share_mode || parsed.shareMode || '',
    ).trim();
    if (parsed.teams && typeof setTeamsShareViewPayload === 'function') {
      setTeamsShareViewPayload(parsed.teams);
    } else if (root.teams && typeof setTeamsShareViewPayload === 'function') {
      setTeamsShareViewPayload(root.teams);
    }
    applyShareReadOnlyUi();
    renderShareViewBanner();
    if (typeof uiAfterSuccessfulRuneRestore === 'function') {
      uiAfterSuccessfulRuneRestore({ name: shareViewWizardName }, { keepTab: true });
    }
    if (typeof renderDashboard === 'function' && typeof getVisibleRunes === 'function') {
      renderDashboard(getVisibleRunes(), { animateCharts: false });
    }
    if (typeof renderMonstersPanel === 'function') renderMonstersPanel();
    if (typeof renderTeamsPanel === 'function') renderTeamsPanel();
    if (typeof applyShareUrlTabFromLocation === 'function') applyShareUrlTabFromLocation();
    return true;
  }

  async function tryOpenProfileFromUrl() {
    if (getShareIdFromUrl()) return false;
    const { profileUrl, dataBlob } = getProfileLinkFromUrl();
    if (!profileUrl && !dataBlob) return false;
    shareViewLoadFailed = false;
    try {
      let text = '';
      if (dataBlob) {
        text = decodeProfileDataParam(dataBlob);
      } else {
        const res = await fetch(profileUrl);
        if (!res.ok) throw new Error('profile fetch failed');
        text = await res.text();
      }
      const parsed = JSON.parse(text);
      return applyReadOnlyProfilePayload(parsed);
    } catch (e) {
      console.warn('Profile link load failed', e);
      shareViewLoadFailed = true;
      shareReadOnly = true;
      persistShareSession(true);
      applyShareReadOnlyUi();
      renderShareViewBanner();
      if (typeof uiEmptyRuneApplicationState === 'function') {
        uiEmptyRuneApplicationState({ keepTab: true });
      }
      return false;
    }
  }

  function persistShareSession(on) {
    try {
      if (on) sessionStorage.setItem(SHARE_SESSION_KEY, '1');
      else sessionStorage.removeItem(SHARE_SESSION_KEY);
    } catch (e) { /* ignore */ }
  }

  function readShareSession() {
    try {
      return sessionStorage.getItem(SHARE_SESSION_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function shareExpiryUnix() {
    return Math.floor(Date.now() / 1000) + SHARE_EXPIRY_DAYS * 24 * 60 * 60;
  }

  function unitMetaFavorite(unitId) {
    if (typeof unitMetaFor !== 'function') return false;
    return !!unitMetaFor(unitId).favorite;
  }

  function slimRuneRawForShare(raw, parsed) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const rid =
      src.rune_id != null
        ? Number(src.rune_id)
        : parsed && parsed.id != null
          ? Number(parsed.id)
          : null;
    if (!Number.isFinite(rid)) return src;
    const rawRune = parsed && parsed._raw && typeof parsed._raw === 'object' ? parsed._raw : null;
    const out = {
      rune_id: rid,
      slot_no: src.slot_no ?? rawRune?.slot_no ?? parsed?.slot,
      set_id: src.set_id ?? rawRune?.set_id ?? parsed?.setId,
      upgrade_curr: src.upgrade_curr ?? rawRune?.upgrade_curr ?? parsed?.level ?? 0,
      extra: src.extra ?? rawRune?.extra ?? parsed?.grade,
      class: src.class ?? rawRune?.class,
      rank: src.rank ?? rawRune?.rank,
    };
    if (src.pri_eff) out.pri_eff = src.pri_eff;
    else if (rawRune?.pri_eff) out.pri_eff = rawRune.pri_eff;
    else if (parsed?.mainType != null) out.pri_eff = [parsed.mainType, parsed.mainVal];
    if (src.prefix_eff) out.prefix_eff = src.prefix_eff;
    else if (rawRune?.prefix_eff) out.prefix_eff = rawRune.prefix_eff;
    if (src.sec_eff) out.sec_eff = src.sec_eff;
    else if (rawRune?.sec_eff) out.sec_eff = rawRune.sec_eff;
    else if (parsed?.substats) {
      out.sec_eff = (parsed.substats || []).map((s) => [
        s.type,
        s.val,
        s.enchanted ? 1 : 0,
        s.grind || 0,
      ]);
    }
    return out;
  }

  function buildShareSlimPayload(mode) {
    const exportMode = mode || shareExportMode || 'all';
    const json = activeSwexJson;
    if (!json || !Array.isArray(json.unit_list)) return null;
    const runeById = new Map();
    for (const r of allRunes || []) {
      if (r && r.id != null) runeById.set(Number(r.id), r);
    }

    const selectedIds =
      typeof monstersBulkSelected !== 'undefined' && monstersBulkSelected && monstersBulkSelected.size
        ? new Set([...monstersBulkSelected].map(String))
        : null;

    const units = json.unit_list
      .filter((u) => u && u.unit_master_id != null)
      .filter((u) => {
        const uid = u.unit_id != null ? String(u.unit_id) : '';
        const hasRunes = Array.isArray(u.runes) && u.runes.length > 0;
        if (exportMode === 'selected') {
          return selectedIds && selectedIds.has(uid);
        }
        if (exportMode === 'favorites') {
          return unitMetaFavorite(uid);
        }
        if (exportMode === 'all') return true;
        if (exportMode === 'equipped-monsters') return hasRunes;
        if (exportMode === 'equipped-runes') return hasRunes;
        if (exportMode === 'equipped-both') return hasRunes;
        return hasRunes;
      })
      .map((u) => {
        const runes = (u.runes || []).map((raw) => {
          const rid = raw.rune_id != null ? Number(raw.rune_id) : null;
          const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
          return slimRuneRawForShare(raw, parsed);
        });
        return {
          unit_master_id: u.unit_master_id,
          unit_id: u.unit_id,
          class: u.class,
          attribute: u.attribute,
          unit_level: u.unit_level,
          rank: u.rank,
          con: u.con,
          atk: u.atk,
          def: u.def,
          spd: u.spd,
          critical_rate: u.critical_rate,
          critical_damage: u.critical_damage,
          resist: u.resist,
          accuracy: u.accuracy,
          skills: Array.isArray(u.skills) ? u.skills : [],
          runes,
        };
      });
    const wizardName =
      (json.wizard_info && (json.wizard_info.wizard_name || json.wizard_info.name)) ||
      localStorage.getItem('loadedRunesName') ||
      '';
    const payload = {
      wizard_name: String(wizardName || '').trim(),
      unit_list: units,
      share_mode: exportMode,
    };
    if (exportMode === 'all') {
      const inv = json.runes || json.rune_list || [];
      if (Array.isArray(inv) && inv.length) {
        payload.runes = inv.map((raw) => {
          const rid = raw && raw.rune_id != null ? Number(raw.rune_id) : null;
          const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
          return slimRuneRawForShare(raw, parsed);
        });
      }
    }
    if (typeof exportTeamsForShare === 'function') {
      const teams = exportTeamsForShare();
      if (teams) {
        payload.teams = teams;
        const included = new Set(units.map((u) => String(u.unit_id)));
        const byId = new Map(
          (json.unit_list || []).map((u) => [String(u.unit_id), u]),
        );
        for (const set of teams.sets || []) {
          for (const team of set.teams || []) {
            for (const uid of team.unit_ids || []) {
              if (uid == null || uid === '') continue;
              const key = String(uid);
              if (included.has(key)) continue;
              const src = byId.get(key);
              if (!src) continue;
              included.add(key);
              units.push({
                unit_master_id: src.unit_master_id,
                unit_id: src.unit_id,
                class: src.class,
                attribute: src.attribute,
                unit_level: src.unit_level,
                rank: src.rank,
                runes: (src.runes || []).map((raw) => {
                  const rid = raw.rune_id != null ? Number(raw.rune_id) : null;
                  const parsed = rid != null && runeById.has(rid) ? runeById.get(rid) : null;
                  return slimRuneRawForShare(raw, parsed);
                }),
              });
            }
          }
        }
        payload.unit_list = units;
      }
    }
    return payload;
  }

  function shareHasExportableContent(data) {
    if (!data) return false;
    const units = Array.isArray(data.unit_list) ? data.unit_list.length : 0;
    const teamSets =
      data.teams && Array.isArray(data.teams.sets) ? data.teams.sets.length : 0;
    return units > 0 || teamSets > 0;
  }

  async function postShareProfile(mode) {
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (!api) throw new Error('API not configured');
    const data = buildShareSlimPayload(mode);
    if (!shareHasExportableContent(data)) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      throw new Error(t.shareNoContent || 'Nothing to share for this export mode');
    }
    const payload = {
      wizard_name: data.wizard_name,
      data: JSON.stringify(data),
      expires_at: shareExpiryUnix(),
    };
    const bodyStr = JSON.stringify(payload);
    if (bodyStr.length > SHARE_MAX_BODY_BYTES) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const mb = (bodyStr.length / (1024 * 1024)).toFixed(1);
      const tpl =
        t.sharePayloadTooLarge ||
        'Export is too large to share ({size} MB). Try equipped-only, or remove unused runes from the JSON.';
      throw new Error(tpl.replace(/\{size\}/g, mb));
    }
    const res = await fetch(`${api}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    });
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      body = null;
    }
    if (!res.ok) {
      const detail =
        (body && (body.message || body.error)) ||
        (res.status === 500
          ? 'Server error — share database may be unavailable'
          : `HTTP ${res.status}`);
      throw new Error(detail);
    }
    if (!body || !body.id) throw new Error('Invalid response');
    return String(body.id);
  }

  function sharePageUrl(shareId) {
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?${SHARE_QUERY_KEY}=${encodeURIComponent(shareId)}`;
  }

  async function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (e) { /* fallback */ }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
    if (!ok) throw new Error('Clipboard unavailable');
    return ok;
  }

  async function copyShareLink(mode) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const id = await postShareProfile(mode);
    const url = sharePageUrl(id);
    await copyTextToClipboard(url);
    shareToast(t.shareLinkCopiedLong || t.shareLinkCopied || 'Share link copied', 'success');
  }

  function closeShareSplitMenus() {
    document.querySelectorAll('.share-split').forEach((root) => {
      root.classList.remove('is-open');
      const menu = root.querySelector('.share-split__menu');
      const caret = root.querySelector('.share-split__caret');
      if (menu) menu.hidden = true;
      if (caret) caret.setAttribute('aria-expanded', 'false');
    });
  }

  async function triggerShareProfile(mode) {
    const exportMode = mode || shareExportMode;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const triggers = document.querySelectorAll('.share-split__main, .share-profile-trigger');
    triggers.forEach((btn) => {
      btn.disabled = true;
    });
    closeShareSplitMenus();
    try {
      await copyShareLink(exportMode);
    } catch (e) {
      shareToast((t.shareFailed || 'Share failed') + (e.message ? `: ${e.message}` : ''), 'error');
    } finally {
      if (!shareReadOnly) {
        triggers.forEach((btn) => {
          btn.disabled = false;
        });
      }
    }
  }

  function unitsForShareReview() {
    const cache = typeof monstersEnrichedCache !== 'undefined' ? monstersEnrichedCache : [];
    if (window.SWRM && typeof window.SWRM.filterPlannerRosterUnits === 'function') {
      return window.SWRM.filterPlannerRosterUnits(cache);
    }
    return cache.filter((u) => {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) return false;
      return true;
    });
  }

  function syncShareMentorFilterDom(f) {
    const runeSel = document.getElementById('monsters-filter-rune');
    const skillSel = document.getElementById('monsters-filter-skill');
    const locSel = document.getElementById('monsters-filter-location');
    const sixBtn = document.getElementById('monsters-filter-full-six');
    if (runeSel) runeSel.value = f.runeFilter || '';
    if (skillSel) skillSel.value = f.skillFilter || '';
    if (locSel) locSel.value = f.location || 'all';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (typeof syncMonstersShowAllButton === 'function') {
      syncMonstersShowAllButton(!!f.fullSixOnly, t);
    }
    if (typeof updateMonstersFilterSummary === 'function') updateMonstersFilterSummary();
  }

  function openMentorRoster(kind) {
    const k = String(kind || '').trim();
    if (!k) return;
    const f =
      typeof readMonstersFiltersFromDom === 'function'
        ? readMonstersFiltersFromDom()
        : { sort: 'name', q: '', element: '', location: 'all', minLevelMin: 0 };
    f.runeFilter = '';
    f.skillFilter = '';
    f.fullSixOnly = false;
    f.location = 'all';
    if (k === 'skills') f.skillFilter = 'needs-up';
    else if (k === 'partial') f.runeFilter = 'partial';
    else if (k === 'unruned') f.runeFilter = 'unruned';
    else if (k === 'attention') {
      f.skillFilter = 'needs-up';
    }
    if (typeof writeMonstersFilters === 'function') writeMonstersFilters(f);
    syncShareMentorFilterDom(f);
    if (typeof showMainTab === 'function') {
      showMainTab('monsters', { monstersSubtab: 'roster', writeHash: true });
    }
    window.setTimeout(() => {
      if (typeof renderMonstersPanel === 'function') void renderMonstersPanel();
    }, 40);
  }

  function mentorRosterSegment(innerEscaped, kind) {
    if (!kind) return innerEscaped;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const title = escapeHtml(t.shareMentorOpenRoster || 'Open filtered roster');
    return `<button type="button" class="account-mentor-btn" data-mentor-roster="${escapeHtml(kind)}" title="${title}">${innerEscaped}</button>`;
  }

  function bindMentorRosterClicks() {
    if (document.documentElement.dataset.mentorRosterBound) return;
    document.documentElement.dataset.mentorRosterBound = '1';
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mentor-roster]');
      if (!btn) return;
      e.preventDefault();
      openMentorRoster(btn.dataset.mentorRoster);
    });
  }

  function buildShareMentorUnitHints(t) {
    const cache = unitsForShareReview();
    if (!cache.length) return '';
    const scored = [];
    for (const u of cache) {
      let score = 0;
      if (u.skillUpsNeeded > 0) score += 3 + Math.min(u.skillUpsNeeded, 9);
      if (u.equippedCount > 0 && !u.hasFullRunes) score += 2;
      if (u.equippedCount === 0 && (u.level >= 40 || u.stars >= 6)) score += 1;
      if (score > 0) {
        scored.push({
          score,
          name: u.displayName && !String(u.displayName).startsWith('#') ? u.displayName : null,
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    const names = [];
    for (const row of scored) {
      if (!row.name) continue;
      if (names.includes(row.name)) continue;
      names.push(row.name);
      if (names.length >= 3) break;
    }
    if (!names.length) return '';
    const tpl = t.shareReviewUnits || 'Needs attention: {names}';
    const text = tpl.replace(/\{names\}/g, names.join(', '));
    return mentorRosterSegment(escapeHtml(text), 'attention');
  }

  function buildAccountReviewLines(opts) {
    const o = opts || {};
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lines = [];
    if (!o.hideScope) {
      const mode = o.mode || shareViewExportMode || shareExportMode || 'all';
      const scopeTpl = shareReadOnly
        ? t.shareReviewScope || 'In this link: {mode}'
        : t.accountReviewScope || 'Your box: {mode}';
      lines.push(escapeHtml(scopeTpl.replace(/\{mode\}/g, shareModeLabel(mode, t))));
    }

    const runes = typeof allRunes !== 'undefined' && Array.isArray(allRunes) ? allRunes : [];
    if (runes.length) {
      let keep = 0;
      let sell = 0;
      for (const r of runes) {
        const v = (r.verdict || '').trim();
        if (v === 'Keep') keep += 1;
        else if (v === 'Sell') sell += 1;
      }
      const tpl = t.shareReviewRunes || '{n} runes · Keep {keep} · Sell {sell}';
      const runeLine = tpl
        .replace(/\{n\}/g, String(runes.length))
        .replace(/\{keep\}/g, String(keep))
        .replace(/\{sell\}/g, String(sell));
      lines.push(escapeHtml(runeLine));
    }

    const reviewUnits = unitsForShareReview();
    const stats =
      window.SWRM && typeof window.SWRM.computeSkillPlannerStats === 'function'
        ? window.SWRM.computeSkillPlannerStats(reviewUnits)
        : null;
    if (stats && (stats.skillUpsTotal > 0 || stats.monstersNeeding > 0)) {
      const tpl = t.shareReviewSkills || '{skill} skill-ups to max · {monsters} monsters';
      const skillLine = tpl
        .replace(/\{skill\}/g, String(stats.skillUpsTotal))
        .replace(/\{monsters\}/g, String(stats.monstersNeeding));
      lines.push(mentorRosterSegment(escapeHtml(skillLine), 'skills'));
    }
    if (reviewUnits.length) {
      let partial = 0;
      for (const u of reviewUnits) {
        if (u.equippedCount > 0 && !u.hasFullRunes) partial += 1;
      }
      if (partial > 0) {
        const tpl = t.shareReviewPartial || '{partial} with incomplete rune sets';
        const partialLine = tpl.replace(/\{partial\}/g, String(partial));
        lines.push(mentorRosterSegment(escapeHtml(partialLine), 'partial'));
      }
    }

    const hints = buildShareMentorUnitHints(t);
    if (hints) lines.push(hints);
    return lines;
  }

  function buildAccountReviewHtml(opts) {
    const o = opts || {};
    if (shareViewLoadFailed) return '';
    const lines = buildAccountReviewLines(o);
    const runes = typeof allRunes !== 'undefined' && Array.isArray(allRunes) ? allRunes : [];
    if (!lines.length) return '';
    if (!o.hideScope && lines.length <= 1 && !runes.length) return '';
    const wrapClass = o.wrapClass || 'account-review';
    return `<p class="${escapeHtml(wrapClass)}">${lines.join('<span class="account-review__sep" aria-hidden="true"> · </span>')}</p>`;
  }

  function buildShareAccountReviewHtml() {
    return buildAccountReviewHtml({ wrapClass: 'share-view-banner__review account-review' });
  }

  function renderAccountReviewStrip() {
    const el = document.getElementById('monsters-account-review');
    if (!el) return;
    if (shareReadOnly || !allUnits.length) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    const html = buildAccountReviewHtml({
      hideScope: true,
      wrapClass: 'monsters-box-overview__review account-review',
    });
    if (!html) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = html;
  }

  function renderShareViewBanner() {
    let bar = document.getElementById('share-view-banner');
    if (!shareReadOnly) {
      if (bar) bar.remove();
      return;
    }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!bar) {
      bar = document.createElement('aside');
      bar.id = 'share-view-banner';
      bar.className = 'share-view-banner demo-dataset-banner';
      const chrome = document.querySelector('.site-chrome-sticky');
      const demo = document.getElementById('demo-dataset-banner');
      if (demo && chrome && demo.parentElement === chrome) {
        demo.insertAdjacentElement('afterend', bar);
      } else if (chrome) {
        chrome.appendChild(bar);
      } else {
        document.body.prepend(bar);
      }
    }
    bar.removeAttribute('hidden');
    bar.setAttribute('aria-hidden', 'false');
    const nameRaw = (shareViewWizardName || '').trim() || (t.shareUnknownWizard || 'another player');
    const name = escapeHtml(nameRaw);
    const readOnlyLbl = escapeHtml(t.shareReadOnlyLabel || 'Read-only');
    const reviewHtml = shareViewLoadFailed ? '' : buildShareAccountReviewHtml();
    const text = shareViewLoadFailed
      ? escapeHtml(t.shareViewLoadFailed || 'Could not load this shared profile. The link may be expired.')
      : `<span class="share-view-banner__line"><span class="share-view-banner__prefix">${escapeHtml(t.shareViewingPrefix || 'Viewing account')}</span> <strong class="share-view-banner__name">${name}</strong></span> <span class="share-view-banner__readonly">${readOnlyLbl}</span>`;
    bar.innerHTML = `<div class="demo-dataset-banner__inner">
      <div class="demo-dataset-banner__content">
        <span class="demo-dataset-banner__badge" aria-hidden="true">${readOnlyLbl}</span>
        <div class="demo-dataset-banner__text-wrap">
          <span class="demo-dataset-banner__text">${text}</span>
          ${reviewHtml}
        </div>
        <button type="button" class="btn-ghost demo-dataset-banner__upload-btn" id="share-view-exit-btn">${escapeHtml(t.shareLoadOwn || 'Load your SWEX')}</button>
      </div>
    </div>`;
    const exitBtn = bar.querySelector('#share-view-exit-btn');
    if (exitBtn && !exitBtn.dataset.bound) {
      exitBtn.dataset.bound = '1';
      exitBtn.addEventListener('click', () => {
        persistShareSession(false);
        try {
          const u = new URL(window.location.href);
          u.searchParams.delete(SHARE_QUERY_KEY);
          u.searchParams.delete(PROFILE_URL_QUERY_KEY);
          u.searchParams.delete(PROFILE_DATA_QUERY_KEY);
          window.location.href = u.pathname + (u.hash || '');
        } catch (e) {
          window.location.href = window.location.pathname;
        }
      });
    }
  }

  async function tryOpenShareFromUrl(shareId) {
    shareId = shareId || getShareIdFromUrl();
    if (!shareId) return false;
    shareViewLoadFailed = false;
    const api = typeof SWRM_API === 'string' ? SWRM_API : '';
    if (!api) return false;
    try {
      const res = await fetch(`${api}/share?id=${encodeURIComponent(shareId)}`);
      if (!res.ok) return false;
      const body = await res.json();
      const raw = body && body.data != null ? body.data : null;
      const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
      const parsed = JSON.parse(text);
      const wizardName = String(body.wizard_name || parsed.wizard_name || '').trim();
      const root = normalizeProfileSwexRoot(parsed);
      if (!root) {
        shareViewLoadFailed = true;
        return false;
      }
      if (!applyReadOnlyProfilePayload({ ...root, teams: parsed.teams }, wizardName)) {
        shareViewLoadFailed = true;
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Share load failed', e);
      shareViewLoadFailed = true;
      return false;
    }
  }

  function isShareReadOnly() {
    return shareReadOnly || readShareSession();
  }

  function applyShareReadOnlyUi() {
    const ro = isShareReadOnly();
    shareReadOnly = ro;
    document.documentElement.classList.toggle('share-readonly', ro);
    document.body.classList.toggle('share-readonly', ro);
    if (typeof syncDemoBannerVisibility === 'function') syncDemoBannerVisibility();
    document.querySelectorAll('.share-split__main, .share-split__caret, .share-profile-trigger').forEach((el) => {
      el.disabled = ro;
    });
    document.querySelectorAll('.db-slot-btn, #btn-upload-slot, #btn-demo-load').forEach((el) => {
      if (el) el.disabled = ro;
    });
    document.querySelectorAll('[data-share-hidden]').forEach((el) => {
      el.hidden = ro;
    });
    document.querySelectorAll('.tab[data-tab="guide"], .tab[data-tab="changelog"]').forEach((el) => {
      if (ro) el.setAttribute('hidden', '');
      else el.removeAttribute('hidden');
    });
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) saveBtn.hidden = ro;
    const rulesRoot = document.getElementById('tab-settings');
    if (rulesRoot) {
      rulesRoot.querySelectorAll('input, select, textarea').forEach((el) => {
        el.disabled = ro;
        if (ro) el.setAttribute('readonly', 'readonly');
        else el.removeAttribute('readonly');
      });
      rulesRoot.querySelectorAll('button').forEach((el) => {
        if (el.classList.contains('rules-subtab')) return;
        if (el.id === 'share-view-exit-btn') return;
        if (el.id === 'btn-toggle-threshold-previews') return;
        el.disabled = ro;
        if (ro && el.id === 'btn-save-settings') el.hidden = true;
      });
    }
    const appSettingsRoot = document.getElementById('tab-app-settings');
    if (appSettingsRoot) {
      appSettingsRoot.querySelectorAll('input, select, textarea, button').forEach((el) => {
        if (el.id === 'app-language') return;
        el.disabled = ro;
        if (ro) el.setAttribute('readonly', 'readonly');
        else el.removeAttribute('readonly');
      });
    }
    const bulkBar = document.getElementById('monsters-bulk-bar');
    if (bulkBar) bulkBar.hidden = ro || monstersBulkSelected.size === 0;
    document.querySelectorAll('[data-teams-readonly-hide]').forEach((el) => {
      el.hidden = ro;
    });
    renderShareViewBanner();
    if (ro) {
      const activeMain = document.querySelector('.tab.active')?.dataset?.tab;
      if (activeMain === 'guide' || activeMain === 'changelog') {
        if (typeof showMainTab === 'function') showMainTab('runes', { writeHash: true });
      }
    }
  }

  function bindShareProfileUi() {
    shareExportMode = readStoredShareMode();
    syncShareSplitLabels();
    bindMentorRosterClicks();

    document.addEventListener('click', (e) => {
      const mainBtn = e.target.closest('.share-split__main');
      if (mainBtn && !mainBtn.disabled && !shareReadOnly) {
        e.preventDefault();
        void triggerShareProfile();
        return;
      }
      const legacyBtn = e.target.closest('.share-profile-trigger');
      if (legacyBtn && !legacyBtn.disabled && !shareReadOnly) {
        e.preventDefault();
        void triggerShareProfile();
        return;
      }
      const modeBtn = e.target.closest('[data-share-mode]');
      if (modeBtn) {
        e.preventDefault();
        setShareExportMode(modeBtn.dataset.shareMode);
        closeShareSplitMenus();
        return;
      }
      const copyBtn = e.target.closest('[data-share-copy-link]');
      if (copyBtn) {
        e.preventDefault();
        void triggerShareProfile(shareExportMode);
        return;
      }
      const caret = e.target.closest('.share-split__caret');
      if (caret) {
        e.preventDefault();
        const root = caret.closest('.share-split');
        if (!root) return;
        const open = !root.classList.contains('is-open');
        closeShareSplitMenus();
        if (open) {
          root.classList.add('is-open');
          const menu = root.querySelector('.share-split__menu');
          if (menu) menu.hidden = false;
          caret.setAttribute('aria-expanded', 'true');
        }
        return;
      }
      if (!e.target.closest('.share-split')) closeShareSplitMenus();
    });
  }

  async function initShareProfile() {
    bindShareProfileUi();
    const shareId = getShareIdFromUrl();
    if (!shareId) {
      const profileLink = getProfileLinkFromUrl();
      if (profileLink.profileUrl || profileLink.dataBlob) {
        return tryOpenProfileFromUrl();
      }
      if (readShareSession()) persistShareSession(false);
      shareReadOnly = false;
      shareViewLoadFailed = false;
      applyShareReadOnlyUi();
      return false;
    }
    const opened = await tryOpenShareFromUrl(shareId);
    if (!opened) {
      shareReadOnly = true;
      persistShareSession(true);
      shareViewLoadFailed = true;
      applyShareReadOnlyUi();
      if (typeof uiEmptyRuneApplicationState === 'function') {
        uiEmptyRuneApplicationState({ keepTab: true });
      }
    }
    return opened;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.isShareReadOnly = isShareReadOnly;
  window.SWRM.applyShareReadOnlyUi = applyShareReadOnlyUi;
  window.SWRM.renderShareViewBanner = renderShareViewBanner;
  window.SWRM.openMentorRoster = openMentorRoster;
  window.SWRM.buildAccountReviewHtml = buildAccountReviewHtml;
  window.SWRM.renderAccountReviewStrip = renderAccountReviewStrip;
  window.SWRM.getShareIdFromUrl = getShareIdFromUrl;
  window.SWRM.getProfileLinkFromUrl = getProfileLinkFromUrl;

  // ===================== CHANGELOG (STATIC, ship-time only) =====================
  function escapeChangelogText(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function changelogItemsForLang(rel, lang) {
    const pack = (rel.items && rel.items[lang]) || rel.items?.en;
    if (!pack) return [];
    if (Array.isArray(pack)) return pack;
    if (Array.isArray(pack.shipped)) return pack.shipped;
    return [];
  }

  function roadmapLangKey() {
    return currentLang === 'ru' ? 'ru' : currentLang === 'fr' ? 'fr' : 'en';
  }

  /** @returns {{ intro: string, sections: object[], outOfScope?: object } | null} */
  function roadmapPackForLang(lang) {
    const raw =
      (window.SWRM && window.SWRM.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP[lang]) ||
      (window.SWRM && window.SWRM.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP.en);
    if (!raw) return null;
    if (Array.isArray(raw)) {
      return {
        intro: '',
        sections: [{ id: 'legacy', title: 'Plans', items: raw.map((text) => ({ text })) }],
        outOfScope: null,
      };
    }
    return raw;
  }

  function renderRoadmapSection(sec, idx) {
    const sid = escapeChangelogText(sec.id || `sec-${idx}`);
    const titleId = `roadmap-h-${sid}`;
    const kicker = sec.kicker
      ? `<span class="roadmap-section__kicker">${escapeChangelogText(sec.kicker)}</span>`
      : '';
    const phase = sec.phase
      ? `<span class="roadmap-phase">${escapeChangelogText(sec.phase)}</span>`
      : '';
    const lead = sec.lead
      ? `<p class="guide-lead">${escapeChangelogText(sec.lead)}</p>`
      : '';
    const items = (sec.items || [])
      .map((item) => {
        const text = typeof item === 'string' ? item : item.text;
        return `<li><span class="guide-checklist__icon" aria-hidden="true">◇</span><span>${escapeChangelogText(text)}</span></li>`;
      })
      .join('');
    return `<section class="guide-section roadmap-section" aria-labelledby="${titleId}">
      <div class="roadmap-section__head">
        ${kicker}
        <h3 class="roadmap-section__title" id="${titleId}">${escapeChangelogText(sec.title)}</h3>
        ${phase}
      </div>
      ${lead}
      <ul class="guide-checklist">${items}</ul>
    </section>`;
  }

  function renderChangelog() {
    const list = document.getElementById('changelog-list');
    if (!list) return;
    try { localStorage.removeItem('swrm_changelog_v1'); } catch (e) { /* ignore */ }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const releases = (window.SWRM && window.SWRM.STATIC_CHANGELOG) || [];
    if (!releases.length) {
      list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogEmpty || '')}</p>`;
      return;
    }
    const lang = roadmapLangKey();
    list.innerHTML = releases.map((rel) => {
      const items = changelogItemsForLang(rel, lang);
      const ul = items.length
        ? `<ul class="changelog-bullets">${items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul>`
        : `<p class="settings-desc">${escapeChangelogText(t.changelogEmpty || '')}</p>`;
      return `<article class="changelog-release"><h3 class="changelog-release-date">${escapeChangelogText(rel.date)}</h3>${ul}</article>`;
    }).join('');
  }

  function renderRoadmap() {
    const list = document.getElementById('changelog-roadmap-list');
    if (!list) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const pack = roadmapPackForLang(roadmapLangKey());
    if (!pack || (!pack.sections?.length && !pack.intro)) {
      list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogRoadmapEmpty || '')}</p>`;
      return;
    }
    const intro = pack.intro
      ? `<section class="guide-section guide-section--hero roadmap-section roadmap-section--intro" aria-labelledby="roadmap-intro-title">
          <h3 id="roadmap-intro-title">${escapeChangelogText(t.changelogSubtabRoadmap || 'Roadmap')}</h3>
          <p class="guide-lead">${escapeChangelogText(pack.intro)}</p>
        </section>`
      : '';
    const sections = (pack.sections || []).map((sec, i) => renderRoadmapSection(sec, i)).join('');
    const oos = pack.outOfScope;
    const outBlock = oos?.items?.length
      ? `<section class="guide-section roadmap-section roadmap-section--oos" aria-labelledby="roadmap-oos-title">
          <h3 id="roadmap-oos-title">${escapeChangelogText(oos.title)}</h3>
          <div class="guide-callout guide-callout--warn">
            <ul class="guide-bullets">${oos.items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul>
          </div>
        </section>`
      : '';
    list.innerHTML = `<div class="roadmap-grid__inner">${intro}${sections}${outBlock}</div>`;
  }

  const MONSTERS_FILTER_STORAGE_KEY = 'swrm_monsters_filters_v2';
  const MONSTERS_UNIT_META_KEY = 'swrm_monsters_unit_meta_v1';
  const MONSTERS_TAGS_REGISTRY_KEY = 'swrm_monsters_tags_registry_v1';
  const MONSTERS_SELECTED_KEY = 'swrm_monsters_selected_unit_v1';
  const MONSTERS_VIEW_KEY = 'swrm_monsters_view_v1';
  const MONSTERS_BULK_SEL_KEY = 'swrm_monsters_bulk_sel_v1';
  const MONSTERS_TABLE_SORT_KEY = 'swrm_monsters_table_sort_v1';
  const ELEMENT_ORDER = ['Fire', 'Water', 'Wind', 'Light', 'Dark'];
  const MONSTER_ROLE_ORDER = ['HP', 'Attack', 'Defense', 'Support'];
  const MAX_UNIT_TAGS = 12;
  const MAX_TAG_LEN = 32;

  let monstersSelectedUnitId = null;
  let monstersEnrichedCache = [];
  let monstersVisibleUnitIds = [];
  let monstersDetailHideTimer = null;
  let monstersDetailHoverUnitId = null;
  /** When set, detail panel is pinned in the right sidebar (click to pin). */
  let monstersDetailPinnedUnitId = null;
  /** @type {{ col: string, dir: 'asc'|'desc' }|null} — in-memory only; resets on F5 / tab change */
  let monstersTableSort = null;

  function resetMonstersTableSort() {
    monstersTableSort = null;
  }
  let monstersBulkSelected = new Set();
  let monstersBulkLastIndex = -1;
  let monstersDetailTab = 'info';
  let monstersRuneFocusState = null;

  let monstersHubTabsBound = false;

  function normalizeMonstersSubtabId(id) {
    return MONSTERS_SUBTAB_IDS.includes(id) ? id : 'roster';
  }

  function showMonstersSubtab(subId, options) {
    const id = normalizeMonstersSubtabId(subId);
    try {
      sessionStorage.setItem(MONSTERS_SUBTAB_STORAGE_KEY, id);
    } catch (e) { /* ignore */ }

    document.querySelectorAll('.monsters-hub-tab').forEach((btn) => {
      const on = btn.dataset.monstersHub === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });

    document.querySelectorAll('.monsters-hub-pane').forEach((pane) => {
      const on = pane.dataset.monstersPane === id;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('hidden', !on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lead = document.getElementById('lbl-monsters-lead');
    if (lead) {
      if (id === 'teams') {
        lead.textContent =
          t.monstersTeamsLead || 'Build named teams and group them into sets (e.g. Arena Offence).';
      } else if (id === 'planner') {
        lead.textContent = '';
      } else {
        lead.textContent = t.monstersLead || '';
      }
    }

    if (id === 'roster') {
      void renderMonstersPanel();
    } else if (id === 'planner' && typeof renderSkillPlannerPanel === 'function') {
      void renderSkillPlannerPanel();
    } else if (id === 'teams' && typeof renderTeamsPanel === 'function') {
      void renderTeamsPanel();
    }
  }

  function initMonstersHubTabs() {
    const nav = document.getElementById('monsters-hub-tabs');
    if (!nav || monstersHubTabsBound) return;
    monstersHubTabsBound = true;
    nav.querySelectorAll('.monsters-hub-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sub = btn.dataset.monstersHub;
        if (!sub) return;
        showMainTab('monsters', { monstersSubtab: sub, writeHash: true });
      });
    });
  }

  function monstersSubtabFromHashSegment(segment) {
    const s = String(segment || '').trim().toLowerCase();
    if (s === 'team' || s === 'teams') return 'teams';
    if (s === 'roster' || s === 'list') return 'roster';
    if (s === 'planner' || s === 'skill' || s === 'skills' || s === 'skill-plan') return 'planner';
    return MONSTERS_SUBTAB_IDS.includes(s) ? s : null;
  }

//
// SWEX does not ship reliable final combat totals on units; we derive Total from:
//   1) Base at unit level — SWARFARM monster base/max stats scaled to u.level
//   2) Equipped runes — mains, innate (prefix), substats (+ grind)
//   3) Active rune set bonuses (2-/4-piece panel stats)
//   4) Artifacts / relics — only confirmed pri effects (flat HP/ATK/DEF; relic % HP/ATK/DEF)
//
// HP / ATK / DEF / SPD: flat bonuses stack; % bonuses apply to base (runes + set %).
// CRI Rate / CRI Dmg / RES / ACC: % bonuses stack additively on base (game stat screen).
//
// +Gear column = total − base. Not included: glory, leader/passive, artifact combat subs.
  const PCT_STAT_TYPES = new Set([2, 4, 6, 9, 10, 11, 12]);
  const ADDITIVE_PCT_KEYS = new Set(['critRate', 'critDmg', 'res', 'acc']);

  /** Panel stat bonuses when a set threshold is active (one rule per set name). */
  const RUNE_SET_PANEL_BONUSES = {
    Energy: { need: 2, hpPct: 15 },
    Guard: { need: 2, defPct: 15 },
    Swift: { need: 4, spdFlat: 25 },
    Blade: { need: 2, critRatePct: 12 },
    Rage: { need: 4, critDmgPct: 40 },
    Focus: { need: 2, accPct: 20 },
    Endure: { need: 2, resPct: 20 },
    Fatal: { need: 4, atkPct: 35 },
    Despair: { need: 4, accPct: 25 },
    Vampire: { need: 4, hpPct: 35 },
    Fight: { need: 2, atkPct: 8 },
    Determination: { need: 2, defPct: 8 },
    Enhance: { need: 2, hpPct: 8 },
    Accuracy: { need: 2, accPct: 20 },
    Tolerance: { need: 2, resPct: 20 },
  };

  function statKeyForTypeId(typeId) {
    const id = Number(typeId);
    if (id === 1 || id === 2) return 'hp';
    if (id === 3 || id === 4) return 'atk';
    if (id === 5 || id === 6) return 'def';
    if (id === 8) return 'spd';
    if (id === 9) return 'critRate';
    if (id === 10) return 'critDmg';
    if (id === 11) return 'res';
    if (id === 12) return 'acc';
    return null;
  }

  function isPercentBonus(typeId, slotNo) {
    const id = Number(typeId);
    const slot = Number(slotNo);
    if (Number.isFinite(slot) && slot >= 1 && slot <= 6) {
      if (window.SWRM && typeof window.SWRM.isMainStatFlat === 'function') {
        return !window.SWRM.isMainStatFlat(slot, id);
      }
      return slot === 2 || slot === 4 || slot === 6;
    }
    return PCT_STAT_TYPES.has(id);
  }

  function subVal(sub) {
    if (window.SWRM && typeof window.SWRM.subRuneValue === 'function') {
      return window.SWRM.subRuneValue(sub);
    }
    return (Number(sub?.val) || 0) + (Number(sub?.grind) || 0);
  }

  function sumRuneBonusesForKey(statKey, runesArray) {
    let flat = 0;
    let pct = 0;
    for (const rune of runesArray || []) {
      if (!rune) continue;
      const add = (typeId, value, slotNo) => {
        const key = statKeyForTypeId(typeId);
        const v = Number(value);
        if (key !== statKey || !Number.isFinite(v) || v === 0) return;
        if (isPercentBonus(typeId, slotNo)) pct += v;
        else flat += v;
      };
      if (rune.mainType != null && rune.mainVal != null) {
        add(rune.mainType, rune.mainVal, rune.slot);
      }
      if (rune.innate_type && rune.innate_val) {
        add(rune.innate_type, rune.innate_val, null);
      }
      for (const s of rune.substats || []) {
        if (s && s.source === 'innate') continue;
        add(s.type, subVal(s), null);
      }
    }
    return { flat, pct };
  }

  function countRuneSets(runesArray) {
    const counts = {};
    for (const rune of runesArray || []) {
      if (!rune || !rune.setName) continue;
      counts[rune.setName] = (counts[rune.setName] || 0) + 1;
    }
    return counts;
  }

  function sumSetBonusesForKey(statKey, runesArray) {
    let flat = 0;
    let pct = 0;
    const counts = countRuneSets(runesArray);
    for (const [setName, total] of Object.entries(counts)) {
      const rule = RUNE_SET_PANEL_BONUSES[setName];
      if (!rule || total < rule.need) continue;
      if (rule.spdFlat && statKey === 'spd') flat += rule.spdFlat;
      if (rule.hpPct && statKey === 'hp') pct += rule.hpPct;
      if (rule.atkPct && statKey === 'atk') pct += rule.atkPct;
      if (rule.defPct && statKey === 'def') pct += rule.defPct;
      if (rule.critRatePct && statKey === 'critRate') pct += rule.critRatePct;
      if (rule.critDmgPct && statKey === 'critDmg') pct += rule.critDmgPct;
      if (rule.resPct && statKey === 'res') pct += rule.resPct;
      if (rule.accPct && statKey === 'acc') pct += rule.accPct;
    }
    return { flat, pct };
  }

  function sumConfirmedGearBonusesForKey(statKey, unit) {
    if (!unit || !window.SWRM || typeof window.SWRM.sumGearBonusesForKey !== 'function') {
      return { flat: 0, pct: 0 };
    }
    return window.SWRM.sumGearBonusesForKey(statKey, unit);
  }

  function calculateTotalStatForKey(base, runesArray, statKey, unit) {
    const b = Number(base);
    const baseNum = Number.isFinite(b) ? b : 0;
    const rune = sumRuneBonusesForKey(statKey, runesArray);
    const set = sumSetBonusesForKey(statKey, runesArray);
    const gear = sumConfirmedGearBonusesForKey(statKey, unit);
    const flat = rune.flat + set.flat + gear.flat;
    const pct = rune.pct + set.pct + gear.pct;
    let total = baseNum + flat;
    if (pct) {
      if (ADDITIVE_PCT_KEYS.has(statKey)) total += pct;
      else total += (baseNum * pct) / 100;
    }
    return roundStatTotal(statKey, total);
  }

  /** Match in-game stat screen (HP/ATK/DEF ceil; SPD floor; % round). */
  function roundStatTotal(statKey, total) {
    const n = Number(total);
    if (!Number.isFinite(n)) return 0;
    if (statKey === 'spd') return Math.floor(n + 1e-6);
    if (statKey === 'hp' || statKey === 'atk' || statKey === 'def') {
      return Math.ceil(n - 1e-9);
    }
    return Math.round(n);
  }

  function displayStatValue(statKey, value, isPct) {
    const n = roundStatTotal(statKey, value);
    return isPct ? `${n}%` : String(n);
  }

  function reconcileTotalWithSwex(statKey, computedTotal, unit) {
    const s = unit && unit.stats;
    if (!s) return computedTotal;
    const swex = Number(s[statKey]);
    if (!Number.isFinite(swex)) return computedTotal;
    const comp = roundStatTotal(statKey, computedTotal);
    const sw = roundStatTotal(statKey, swex);
    if (Math.abs(sw - comp) <= 1) return sw;
    return comp;
  }

  /**
   * Sky Tribe Totem / account SPD bonus sources in SWEX (2025+):
   * - Primary: `wizard_skill_list[]` row with `skill_id: 14` (Glory monument #14), `level` = totem level.
   * - Legacy: `deco_list` / `deo_list` with `master_id: 11001` (old export naming).
   * - Optional: `wizard_info.unit_home_bonus` (stat_type 8 = SPD) on some payloads.
   */
  const WIZARD_SKILL_ID_SPEED_TOTEM = 14;
  const SPEED_TOTEM_DECO_MASTER_ID = 11001;
  const COM2US_STAT_TYPE_SPD = 8;
  /** % bonus to base SPD by totem level (SWOP / in-game, levels 1–10; extended to 20). */
  const TOTEM_SPD_PCT_BY_LEVEL = {
    1: 2,
    2: 3,
    3: 5,
    4: 6,
    5: 8,
    6: 9,
    7: 11,
    8: 12,
    9: 14,
    10: 15,
    11: 8.5,
    12: 9,
    13: 10,
    14: 11,
    15: 11.5,
    16: 12,
    17: 13,
    18: 14,
    19: 14.5,
    20: 15,
  };

  function totemSpdPctFromLevel(level) {
    const lv = Number(level);
    if (!Number.isFinite(lv) || lv < 1) return 0;
    const pct = TOTEM_SPD_PCT_BY_LEVEL[lv];
    return pct != null ? pct : lv >= 10 ? 15 : 0;
  }

  function decoEntryMasterId(d) {
    if (!d || typeof d !== 'object') return NaN;
    return Number(d.master_id ?? d.deco_master_id ?? d.building_master_id);
  }

  function decoEntryLevel(d) {
    return Number(d.level ?? d.lv ?? d.upgrade_curr ?? d.upgrade_level ?? d.building_level);
  }

  function swexAllDecoEntries(json) {
    const out = [];
    const seen = new Set();
    const pushList = (list) => {
      if (!Array.isArray(list)) return;
      for (const d of list) {
        if (!d || typeof d !== 'object') continue;
        const key = `${decoEntryMasterId(d)}:${decoEntryLevel(d)}:${d.deco_id ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(d);
      }
    };
    if (!json || typeof json !== 'object') return out;
    pushList(json.deco_list);
    pushList(json.deo_list);
    pushList(json.decoration_list);
    const wi = json.wizard_info;
    if (wi && typeof wi === 'object') {
      pushList(wi.deco_list);
      pushList(wi.deo_list);
    }
    for (const v of Object.values(json)) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
      pushList(v.deco_list);
      pushList(v.deo_list);
    }
    return out;
  }

  function wizardSkillListRows(json) {
    if (!json || typeof json !== 'object') return [];
    const raw = json.wizard_skill_list ?? json.wizard_info?.wizard_skill_list;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw);
    return [];
  }

  function totemFromWizardSkillList(json) {
    let best = null;
    for (const row of wizardSkillListRows(json)) {
      if (Number(row.skill_id) !== WIZARD_SKILL_ID_SPEED_TOTEM) continue;
      const lv = Number(row.level ?? row.skill_level ?? row.lv);
      const pct = totemSpdPctFromLevel(lv);
      if (pct > 0 && (!best || lv > best.level)) {
        best = { level: lv, pct, source: 'wizard_skill_list', skill_id: WIZARD_SKILL_ID_SPEED_TOTEM };
      }
    }
    return best;
  }

  function rowLooksLikeSpdBonus(row) {
    if (!row || typeof row !== 'object') return false;
    const stat = Number(row.stat_type ?? row.stat ?? row.attribute_type);
    const type = Number(row.bonus_type ?? row.type ?? row.effect_type);
    const attr = String(row.attribute ?? row.effect ?? row.stat_name ?? '').toLowerCase();
    if (stat === COM2US_STAT_TYPE_SPD || type === COM2US_STAT_TYPE_SPD) return true;
    if (attr.includes('speed') || attr.includes('spd')) return true;
    return false;
  }

  function totemFromUnitHomeBonus(json) {
    const lists = [];
    if (json?.wizard_info?.unit_home_bonus) lists.push(json.wizard_info.unit_home_bonus);
    if (json?.unit_home_bonus) lists.push(json.unit_home_bonus);
    if (json?.wizard_info?.bonus_list) lists.push(json.wizard_info.bonus_list);
    if (json?.account_bonus) lists.push(json.account_bonus);
    let best = null;
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const row of list) {
        if (!rowLooksLikeSpdBonus(row)) continue;
        let pct = Number(row.bonus_value ?? row.value ?? row.amount ?? row.pct ?? row.rate);
        if (!Number.isFinite(pct) || pct <= 0) continue;
        if (pct > 0 && pct <= 1) pct *= 100;
        const lv = Number(row.level);
        if (pct > 0 && (!best || pct > best.pct)) {
          best = { level: Number.isFinite(lv) ? lv : 0, pct, source: 'unit_home_bonus' };
        }
      }
    }
    return best;
  }

  function totemFromDecoList(json) {
    let best = null;
    for (const d of swexAllDecoEntries(json)) {
      const mid = decoEntryMasterId(d);
      if (mid !== SPEED_TOTEM_DECO_MASTER_ID && mid !== WIZARD_SKILL_ID_SPEED_TOTEM) continue;
      const lv = decoEntryLevel(d);
      const pct = totemSpdPctFromLevel(lv);
      if (pct > 0 && (!best || lv > best.level)) {
        best = { level: lv, pct, source: mid === SPEED_TOTEM_DECO_MASTER_ID ? 'deco_list:11001' : 'deco_list:14' };
      }
    }
    return best;
  }

  /** Resolve account-wide SPD% from base (Sky Tribe Totem / Summoner monument). */
  function findAccountSpeedTotemBonus(json) {
    return (
      totemFromWizardSkillList(json) ||
      totemFromUnitHomeBonus(json) ||
      totemFromDecoList(json) ||
      null
    );
  }

  function findSkyTribeTotemInJson(json) {
    return findAccountSpeedTotemBonus(json);
  }

  function totemSpdPctFromSwexJson(json) {
    const hit = findAccountSpeedTotemBonus(json);
    return hit ? hit.pct : 0;
  }

  function refreshAccountTotemFromSwex(json) {
    const hit = findAccountSpeedTotemBonus(json);
    const pct = hit ? hit.pct : 0;
    if (window.SWRM) {
      window.SWRM.accountTotemSpdPct = pct;
      window.SWRM.accountTotemLevel = hit ? hit.level : 0;
      window.SWRM.accountTotemSource = hit ? hit.source : '';
    }
    return pct;
  }

  function getAccountTotemSpdPct() {
    if (window.SWRM && Number.isFinite(Number(window.SWRM.accountTotemSpdPct))) {
      return Number(window.SWRM.accountTotemSpdPct);
    }
    const json = typeof activeSwexJson !== 'undefined' ? activeSwexJson : null;
    return totemSpdPctFromSwexJson(json);
  }

  function calculateMonsterStatBreakdown(baseStats, unit) {
    const runes = getUnitEquippedRunes(unit);
    const totemPct = getAccountTotemSpdPct();
    const keys = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'res', 'acc'];
    const out = {};
    for (const key of keys) {
      const b = baseStats && Number.isFinite(Number(baseStats[key])) ? Number(baseStats[key]) : 0;
      const baseRounded = roundStatTotal(key, b);
      let total = calculateTotalStatForKey(b, runes, key, unit);
      total = reconcileTotalWithSwex(key, total, unit);
      if (key === 'spd' && totemPct > 0) {
        const totemFlat = baseSpdAuraBonusFlat(baseRounded, totemPct, 0);
        total += totemFlat;
      }
      const isPct = ADDITIVE_PCT_KEYS.has(key);
      let bonus = total - baseRounded;
      if (!isPct) bonus = Math.max(0, bonus);
      else bonus = Math.max(0, Math.round(bonus));
      out[key] = {
        base: baseRounded,
        bonus,
        total,
        isPct,
      };
    }
    return out;
  }

  function getUnitEquippedRunes(u) {
    if (!u || !Array.isArray(u.runeSlots)) return [];
    return u.runeSlots.map((s) => s && s.rune).filter(Boolean);
  }

  function calculateMonsterStatTotals(baseStats, unit) {
    const bd = calculateMonsterStatBreakdown(baseStats, unit);
    const totals = {};
    for (const key of Object.keys(bd)) totals[key] = bd[key].total;
    return totals;
  }

  /** Flat SPD from totem + leader (% of base only; runes/Swift already in SWEX unit spd). */
  function baseSpdAuraBonusFlat(baseSpd, totemPct, leaderPct) {
    const base = Number(baseSpd);
    if (!Number.isFinite(base) || base <= 0) return 0;
    const pct = (Number(totemPct) || 0) + (Number(leaderPct) || 0);
    if (pct <= 0) return 0;
    return Math.round((base * pct) / 100);
  }

  function leaderSkillSpdPct(leaderSkill) {
    if (!leaderSkill) return 0;
    const attr = String(leaderSkill.attribute || '').toLowerCase();
    if (!attr.includes('speed')) return 0;
    const n = Number(leaderSkill.amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /**
   * SWEX `unit_list[].spd` is usually base SPD at unit level (same as monster screen base),
   * not rune total. Some exports may ship a higher value that already includes runes.
   */
  function swexSpdLooksLikeRuneTotal(swexSpd, baseSpd) {
    const sw = Number(swexSpd);
    const base = Number(baseSpd);
    if (!Number.isFinite(sw) || !Number.isFinite(base) || base <= 0) return false;
    return sw > base + 2;
  }

  function unitBaseSpdForSpeed(unit) {
    if (!unit) return null;
    const db = window.SWRM_MONSTER_DB;
    const meta =
      unit.meta ||
      (db && typeof db.lookupMonster === 'function' ? db.lookupMonster(unit.masterId) : null);
    if (db && typeof db.monsterBaseStatsAtLevel === 'function') {
      const baseStats = db.monsterBaseStatsAtLevel(meta, unit.level);
      const b = baseStats && Number(baseStats.spd);
      if (Number.isFinite(b) && b > 0) return b;
    }
    const swex = Number(unit.stats && unit.stats.spd);
    return Number.isFinite(swex) && swex > 0 ? swex : null;
  }

  /**
   * Team / combat SPD: base + runes (+ Swift set) + round(base × totem%) + round(base × leader%).
   * Uses SWEX spd as rune total only when it is clearly above scaled base.
   * Optional spdBuffPct: +30% of that total (in-battle buff).
   */
  function computeUnitSpeedForTeam(unit, opts) {
    const o = opts || {};
    if (!unit) return null;
    const swexSpd = Number(unit.stats && unit.stats.spd);
    const totemPct =
      Number(o.totemSpdPct) ||
      (typeof getAccountTotemSpdPct === 'function' ? getAccountTotemSpdPct() : 0) ||
      0;
    const leaderPct = Number(o.leaderSpdPct) || 0;
    const baseSpd = unitBaseSpdForSpeed(unit);
    const auraBase = baseSpd != null ? baseSpd : swexSpd;
    const auraFlat =
      Number.isFinite(auraBase) && auraBase > 0
        ? baseSpdAuraBonusFlat(auraBase, totemPct, leaderPct)
        : 0;

    let spd = null;
    if (baseSpd != null) {
      const runes = getUnitEquippedRunes(unit);
      const runeTotal = calculateTotalStatForKey(baseSpd, runes, 'spd', unit);
      if (swexSpdLooksLikeRuneTotal(swexSpd, baseSpd)) {
        spd = Math.floor(swexSpd) + auraFlat;
      } else {
        spd = runeTotal + auraFlat;
      }
    } else if (Number.isFinite(swexSpd) && swexSpd > 0) {
      spd = Math.floor(swexSpd) + auraFlat;
    }
    if (spd == null || !Number.isFinite(spd)) return null;
    const buffPct = Number(o.spdBuffPct) || 0;
    if (buffPct > 0) spd = roundStatTotal('spd', spd * (1 + buffPct / 100));
    return roundStatTotal('spd', spd);
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.totemSpdPctFromSwexJson = totemSpdPctFromSwexJson;
  window.SWRM.findAccountSpeedTotemBonus = findAccountSpeedTotemBonus;
  window.SWRM.findSkyTribeTotemInJson = findSkyTribeTotemInJson;
  window.SWRM.refreshAccountTotemFromSwex = refreshAccountTotemFromSwex;
  window.SWRM.getAccountTotemSpdPct = getAccountTotemSpdPct;
  window.SWRM.totemSpdPctFromLevel = totemSpdPctFromLevel;
  window.SWRM.leaderSkillSpdPct = leaderSkillSpdPct;
  window.SWRM.baseSpdAuraBonusFlat = baseSpdAuraBonusFlat;
  window.SWRM.unitBaseSpdForSpeed = unitBaseSpdForSpeed;
  window.SWRM.computeUnitSpeedForTeam = computeUnitSpeedForTeam;

  const TEAMS_STORAGE_KEY = 'swrm_teams_v2';
  const TEAMS_STORAGE_KEY_LEGACY = 'swrm_teams_v1';
  const TEAM_SIZE_MIN = 3;
  const TEAM_SIZE_MAX = 6;
  const TEAM_SIZE_DEFAULT = 5;

  let teamsStateCache = null;
  let teamsActiveSetId = null;
  let teamsShareViewPayload = null;

  function newTeamsId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultTeamsState() {
    return { version: 2, sets: [], teams: {} };
  }

  function clampTeamSize(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return TEAM_SIZE_DEFAULT;
    return Math.min(TEAM_SIZE_MAX, Math.max(TEAM_SIZE_MIN, Math.round(v)));
  }

  function normalizeTeamSlots(slots, size) {
    const n = clampTeamSize(size);
    const out = Array.from({ length: n }, (_, i) => {
      const v = slots && slots[i] != null ? Number(slots[i]) : null;
      return Number.isFinite(v) && v > 0 ? v : null;
    });
    return out;
  }

  function migrateLegacyState(parsed) {
    const state = defaultTeamsState();
    if (!parsed || typeof parsed !== 'object') return state;
    const teams = parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {};
    for (const [id, team] of Object.entries(teams)) {
      if (!team || typeof team !== 'object') continue;
      const size = clampTeamSize((team.slots || []).length || TEAM_SIZE_DEFAULT);
      state.teams[id] = {
        id,
        name: String(team.name || 'Team').trim() || 'Team',
        notes: '',
        tags: [],
        size,
        leaderUnitId:
          team.leaderUnitId != null && Number.isFinite(Number(team.leaderUnitId))
            ? Number(team.leaderUnitId)
            : null,
        slots: normalizeTeamSlots(team.slots, size),
        shareInProfile: !!team.shareInProfile,
      };
    }
    for (const set of parsed.sets || []) {
      if (!set || !set.id) continue;
      state.sets.push({
        id: set.id,
        name: String(set.name || 'Set').trim() || 'Set',
        collapsed: false,
        teamIds: Array.isArray(set.teamIds) ? set.teamIds.filter((tid) => state.teams[tid]) : [],
      });
    }
    return state;
  }

  function loadTeamsState() {
    if (teamsStateCache) return teamsStateCache;
    try {
      let raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) raw = localStorage.getItem(TEAMS_STORAGE_KEY_LEGACY);
      if (!raw) {
        teamsStateCache = defaultTeamsState();
        return teamsStateCache;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) {
        teamsStateCache = {
          version: 2,
          sets: Array.isArray(parsed.sets) ? parsed.sets : [],
          teams: parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {},
        };
      } else {
        teamsStateCache = migrateLegacyState(parsed);
        saveTeamsState(teamsStateCache);
      }
    } catch (e) {
      teamsStateCache = defaultTeamsState();
    }
    return teamsStateCache;
  }

  function saveTeamsState(state) {
    teamsStateCache = state || defaultTeamsState();
    teamsStateCache.version = 2;
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teamsStateCache));
    } catch (e) {
      /* ignore quota */
    }
  }

  function createEmptyTeam(name, size) {
    const id = newTeamsId('team');
    const n = clampTeamSize(size);
    return {
      id,
      name: String(name || '').trim() || '',
      notes: '',
      tags: [],
      size: n,
      leaderUnitId: null,
      slots: normalizeTeamSlots([], n),
      shareInProfile: false,
    };
  }

  function createTeamSet(name) {
    const state = loadTeamsState();
    const setId = newTeamsId('set');
    const set = {
      id: setId,
      name: String(name || 'New set').trim() || 'New set',
      collapsed: false,
      teamIds: [],
    };
    state.sets.push(set);
    saveTeamsState(state);
    teamsActiveSetId = setId;
    return set;
  }

  function createTeamInSet(setId, name, size) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return null;
    const team = createEmptyTeam(name, size);
    state.teams[team.id] = team;
    set.teamIds.push(team.id);
    saveTeamsState(state);
    return team;
  }

  function deleteTeam(teamId) {
    const state = loadTeamsState();
    if (!state.teams[teamId]) return false;
    delete state.teams[teamId];
    for (const set of state.sets) {
      set.teamIds = (set.teamIds || []).filter((id) => id !== teamId);
    }
    saveTeamsState(state);
    return true;
  }

  function duplicateTeam(teamId) {
    const state = loadTeamsState();
    const src = state.teams[teamId];
    if (!src) return null;
    const set = state.sets.find((s) => (s.teamIds || []).includes(teamId));
    const copy = createEmptyTeam((src.name || 'Team') + ' (copy)', src.size);
    copy.notes = src.notes || '';
    copy.tags = [...(src.tags || [])];
    copy.leaderUnitId = src.leaderUnitId;
    copy.slots = normalizeTeamSlots(src.slots, src.size);
    copy.shareInProfile = false;
    state.teams[copy.id] = copy;
    if (set) {
      const idx = set.teamIds.indexOf(teamId);
      if (idx >= 0) set.teamIds.splice(idx + 1, 0, copy.id);
      else set.teamIds.push(copy.id);
    }
    saveTeamsState(state);
    return copy;
  }

  function reorderTeamsInSet(setId, teamIds) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    set.teamIds = teamIds.filter((id) => state.teams[id]);
    saveTeamsState(state);
  }

  function toggleSetCollapsed(setId) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    set.collapsed = !set.collapsed;
    saveTeamsState(state);
  }

  function deleteTeamSet(setId) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return false;
    for (const tid of set.teamIds || []) {
      delete state.teams[tid];
    }
    state.sets = state.sets.filter((s) => s.id !== setId);
    saveTeamsState(state);
    if (teamsActiveSetId === setId) teamsActiveSetId = state.sets[0]?.id || null;
    return true;
  }

  function getTeamById(teamId) {
    const state = loadTeamsState();
    return teamId && state.teams[teamId] ? state.teams[teamId] : null;
  }

  function getTeamSetById(setId) {
    const state = loadTeamsState();
    return state.sets.find((s) => s.id === setId) || null;
  }

  function orderSlotsWithLeaderFirst(slots, leaderUnitId) {
    if (!Array.isArray(slots) || leaderUnitId == null) return slots;
    const leader = Number(leaderUnitId);
    if (!Number.isFinite(leader) || leader <= 0) return slots;
    const out = slots.map((s) => (s != null && s !== '' ? Number(s) : null));
    const idx = out.findIndex((s) => s === leader);
    if (idx <= 0) return out;
    const copy = [...out];
    copy.splice(idx, 1);
    copy.unshift(leader);
    return copy;
  }

  function updateTeam(teamId, patch) {
    const state = loadTeamsState();
    const team = state.teams[teamId];
    if (!team) return null;
    if (patch.name != null) team.name = String(patch.name).trim();
    if (patch.notes != null) team.notes = String(patch.notes).trim();
    if (patch.tags != null) team.tags = Array.isArray(patch.tags) ? patch.tags.map(String) : [];
    if (patch.size != null) {
      team.size = clampTeamSize(patch.size);
      team.slots = normalizeTeamSlots(team.slots, team.size);
    }
    if (patch.leaderUnitId !== undefined) {
      const lid = patch.leaderUnitId != null ? Number(patch.leaderUnitId) : null;
      team.leaderUnitId = Number.isFinite(lid) && lid > 0 ? lid : null;
    }
    if (patch.slots) team.slots = normalizeTeamSlots(patch.slots, team.size);
    if (team.leaderUnitId && team.slots) {
      team.slots = orderSlotsWithLeaderFirst(team.slots, team.leaderUnitId);
    }
    if (patch.shareInProfile != null) team.shareInProfile = !!patch.shareInProfile;
    saveTeamsState(state);
    return team;
  }

  function renameTeamSet(setId, name) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return null;
    set.name = String(name || '').trim() || set.name;
    saveTeamsState(state);
    return set;
  }

  function exportTeamsForShare() {
    teamsStateCache = null;
    const state = loadTeamsState();
    const sets = [];
    for (const set of state.sets) {
      const teams = [];
      for (const tid of set.teamIds || []) {
        const team = state.teams[tid];
        if (!team || !team.shareInProfile) continue;
        teams.push({
          name: team.name,
          notes: team.notes,
          tags: team.tags,
          leader_unit_id: team.leaderUnitId,
          unit_ids: team.slots,
          master_ids: team.slots.map((uid) => {
            if (uid == null) return null;
            const u = (allUnits || []).find((x) => Number(x.unitId) === Number(uid));
            return u ? Number(u.masterId) : null;
          }),
        });
      }
      if (teams.length) sets.push({ name: set.name, teams });
    }
    return sets.length ? { sets } : null;
  }

  function setTeamsShareViewPayload(payload) {
    teamsShareViewPayload = payload && payload.sets ? payload : null;
  }

  function getTeamsShareViewPayload() {
    return teamsShareViewPayload;
  }

  function getTeamsActiveSetId() {
    return teamsActiveSetId;
  }

  function setTeamsActiveSetId(id) {
    teamsActiveSetId = id;
  }

  function exportTeamsStateJson() {
    teamsStateCache = null;
    const state = loadTeamsState();
    return JSON.stringify(state, null, 2);
  }

  function importTeamsStateFromJson(text, merge) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: 'invalid_json' };
    }
    let incoming = defaultTeamsState();
    if (parsed && parsed.version === 2) {
      incoming = {
        version: 2,
        sets: Array.isArray(parsed.sets) ? parsed.sets : [],
        teams: parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {},
      };
    } else {
      incoming = migrateLegacyState(parsed);
    }
    if (merge) {
      const cur = loadTeamsState();
      const teamIdMap = {};
      for (const [oldId, team] of Object.entries(incoming.teams)) {
        const copy = { ...team, id: newTeamsId('team') };
        teamIdMap[oldId] = copy.id;
        cur.teams[copy.id] = copy;
      }
      for (const set of incoming.sets) {
        const newSetId = newTeamsId('set');
        cur.sets.push({
          id: newSetId,
          name: set.name || 'Imported set',
          collapsed: !!set.collapsed,
          teamIds: (set.teamIds || []).map((tid) => teamIdMap[tid]).filter(Boolean),
        });
      }
      saveTeamsState(cur);
    } else {
      saveTeamsState(incoming);
      teamsActiveSetId = incoming.sets[0]?.id || null;
    }
    teamsStateCache = null;
    return { ok: true };
  }

  const DEMO_TEAMS_SEED_VERSION = 3;
  const DEMO_TEAMS_SEED_KEY = 'swrm_demo_teams_seed_v';

  function isDemoTeamSetName(name) {
    return /^demo[\s·:]/i.test(String(name || '').trim());
  }

  /** Remove all demo sample team sets after user loads their own SWEX. */
  function removeDemoTeams() {
    const state = loadTeamsState();
    const demoSetIds = state.sets.filter((s) => isDemoTeamSetName(s.name)).map((s) => s.id);
    if (!demoSetIds.length) return false;
    const teamIds = new Set();
    for (const sid of demoSetIds) {
      const set = state.sets.find((x) => x.id === sid);
      (set?.teamIds || []).forEach((tid) => teamIds.add(tid));
    }
    state.sets = state.sets.filter((s) => !demoSetIds.includes(s.id));
    for (const tid of teamIds) delete state.teams[tid];
    saveTeamsState(state);
    teamsStateCache = null;
    try {
      localStorage.removeItem(DEMO_TEAMS_SEED_KEY);
    } catch (e) { /* ignore */ }
    return true;
  }

  function clearDemoTeamSets() {
    return removeDemoTeams();
  }

  function shouldKeepDemoTeamSets() {
    if (typeof userHasLoadedRealExport === 'function' && userHasLoadedRealExport()) return false;
    return typeof isUsingDemoDataset === 'function' && isUsingDemoDataset();
  }

  /** Demo team sets only while demo dataset is active; remove when user loads real SWEX. */
  function syncDemoTeamsWithDatasetMode() {
    teamsStateCache = null;
    if (shouldKeepDemoTeamSets()) {
      if (typeof seedDemoTeamsIfEmpty === 'function') seedDemoTeamsIfEmpty();
    } else {
      removeDemoTeams();
    }
  }

  function readDemoTeamsSeedVersion() {
    try {
      return Number(localStorage.getItem(DEMO_TEAMS_SEED_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function writeDemoTeamsSeedVersion(v) {
    try {
      localStorage.setItem(DEMO_TEAMS_SEED_KEY, String(v));
    } catch (e) { /* ignore */ }
  }

  /**
   * User-provided demo lineups (unit_id from data/demo.json, main roster only).
   * Skipped: comps needing storage-only units (Zinc, Dias, Hwa, Lisa, Rakan) or near-duplicates.
   */
  const DEMO_TEAMS_LAYOUT = [
    {
      setName: 'Demo · B12',
      teams: [
        {
          name: 'GB12',
          size: 5,
          leader: 35976386571,
          slots: [27144694306, 35976386571, 5365490176, 31564033638, 8025980618],
          tags: ['Demo', 'GB12'],
        },
        {
          name: 'DB12',
          size: 5,
          leader: 12072006659,
          slots: [12072006659, 27244867420, 27244858404, 5365490176, 30376382096],
          tags: ['Demo', 'DB12'],
        },
        {
          name: 'NB12',
          size: 5,
          leader: 13559060898,
          slots: [13559060898, 15339861886, 30376925404, 26928924951, 26928923162],
          tags: ['Demo', 'NB12'],
        },
        {
          name: 'SRB12',
          size: 5,
          leader: 7637619578,
          slots: [12072006659, 26915472290, 15339861886, 26928924951, 7637619578],
          tags: ['Demo', 'SRB12'],
        },
        {
          name: 'PCB12',
          size: 5,
          leader: 7637619578,
          slots: [13578469034, 19588712314, 15339861886, 26928924951, 7637619578],
          tags: ['Demo', 'PCB12'],
        },
      ],
    },
    {
      setName: 'Demo · Essence',
      teams: [
        {
          name: 'Magic Ess',
          size: 5,
          leader: 8838130354,
          slots: [8838130354, 11050945835, 8611226449, 26928923162, 16139462679],
          tags: ['Demo', 'Ess'],
        },
        {
          name: 'Fire Ess',
          size: 5,
          leader: 16410692026,
          slots: [19588712314, 15339861886, 26928924951, 16410692026, 15370507039],
          tags: ['Demo', 'Ess'],
        },
        {
          name: 'Water Ess',
          size: 5,
          leader: 8838130354,
          slots: [11130827981, 15363394957, 8838130354, 8261783479, 16139462679],
          tags: ['Demo', 'Ess'],
        },
        {
          name: 'Light Ess',
          size: 5,
          leader: 5096889290,
          slots: [8838130354, 11050945835, 8611226449, 27398455635, 5096889290],
          tags: ['Demo', 'Ess'],
        },
      ],
    },
    {
      setName: 'Demo · Rift',
      teams: [
        {
          name: 'Rift R5 — Loren',
          size: 6,
          leader: 11130827981,
          slots: [19588712314, 27064855468, 5365490176, 26915472290, 11130827981, 8600073708],
          tags: ['Demo', 'Rift'],
        },
        {
          name: 'Rift R5 — Bastet',
          size: 6,
          leader: 8151537453,
          slots: [8151537453, 6489936246, 16410692026, 26961999021, 26881992509, 13578469034],
          tags: ['Demo', 'Rift'],
        },
      ],
    },
    {
      setName: 'Demo · Beasts',
      teams: [
        {
          name: 'Fire Beast',
          size: 6,
          leader: 13578469034,
          slots: [8600073708, 12477086251, 15394260876, 26881992509, 15370507039, 13578469034],
          tags: ['Demo', 'Beast'],
        },
      ],
    },
    {
      setName: 'Demo · Arena',
      teams: [
        {
          name: 'AO — Seara',
          size: 4,
          leader: 8524048104,
          slots: [9489707897, 8151537453, 5630889580, 8524048104],
          tags: ['Demo', 'AO'],
          shareInProfile: true,
        },
        {
          name: 'AO — Trinity',
          size: 4,
          leader: 30419927866,
          slots: [9489707897, 6946053164, 30419927866, 6608483306],
          tags: ['Demo', 'AO'],
          shareInProfile: true,
        },
        {
          name: 'AO — Zaiross',
          size: 4,
          leader: 6608483306,
          slots: [9489707897, 6946053164, 26882030840, 6608483306],
          tags: ['Demo', 'AO'],
          shareInProfile: true,
        },
        {
          name: 'AD',
          size: 4,
          leader: 6076074940,
          slots: [15661874898, 28035029184, 4667273474, 6076074940],
          tags: ['Demo', 'AD'],
          shareInProfile: true,
        },
      ],
    },
    {
      setName: 'Demo · GvG',
      teams: [
        {
          name: 'GD — Seara',
          size: 3,
          leader: 8524048104,
          slots: [5612043734, 8524048104, 5096889290],
          tags: ['Demo', 'GD'],
        },
        {
          name: 'GD — Galleon',
          size: 3,
          leader: 6946053164,
          slots: [9489707897, 6946053164, 6608483306],
          tags: ['Demo', 'GD'],
        },
        {
          name: 'GD — Martina',
          size: 3,
          leader: 27658693773,
          slots: [12072006659, 27658693773, 13633460962],
          tags: ['Demo', 'GD'],
        },
        {
          name: 'GD — Khmun',
          size: 3,
          leader: 9041774297,
          slots: [16399615784, 15335072189, 9041774297],
          tags: ['Demo', 'GD'],
        },
      ],
    },
    {
      setName: 'Demo · Dimension',
      teams: [
        {
          name: 'Dim R5 1',
          size: 5,
          leader: 30376382096,
          slots: [30376382096, 6946053164, 27244858404, 5365490176, 5404037534],
          tags: ['Demo', 'Dim'],
        },
        {
          name: 'Dim R5 3',
          size: 5,
          leader: 6115665171,
          slots: [6115665171, 13578469034, 26992216401, 27064855468, 27398455635],
          tags: ['Demo', 'Dim'],
        },
      ],
    },
  ];

  function rosterHasDemoUnits(slotIds) {
    const need = slotIds.filter((id) => id != null && Number(id) > 0);
    if (!need.length) return false;
    const have = new Set((allUnits || []).map((u) => Number(u.unitId)));
    return need.every((id) => have.has(Number(id)));
  }

  function seedDemoTeamInSet(setId, spec) {
    const size = clampTeamSize(spec.size || (spec.slots && spec.slots.length) || TEAM_SIZE_DEFAULT);
    const slots = normalizeTeamSlots(spec.slots, size);
    if (!rosterHasDemoUnits(slots)) return false;
    const team = createTeamInSet(setId, spec.name, size);
    if (!team) return false;
    const leader = spec.leader != null ? Number(spec.leader) : null;
    const leaderInSlots = slots.some((id) => Number(id) === leader);
    updateTeam(team.id, {
      slots,
      size,
      leaderUnitId:
        Number.isFinite(leader) && leader > 0 && leaderInSlots
          ? leader
          : slots.find((id) => id != null) || null,
      shareInProfile: spec.shareInProfile !== false,
      tags: spec.tags || ['Demo'],
      notes: spec.notes || '',
    });
    return true;
  }

  /** Sample teams for demo mode (curated sets; re-seeds when layout version bumps). */
  function seedDemoTeamsIfEmpty() {
    if (!shouldKeepDemoTeamSets()) return false;
    if (!allUnits || allUnits.length < 3) return false;

    const state = loadTeamsState();
    const seededVer = readDemoTeamsSeedVersion();
    const hasCurrentDemo =
      seededVer >= DEMO_TEAMS_SEED_VERSION &&
      state.sets.some((s) => isDemoTeamSetName(s.name));
    if (hasCurrentDemo) return false;

    const hasUserSets = state.sets.some((s) => !isDemoTeamSetName(s.name));
    if (hasUserSets) return false;

    clearDemoTeamSets();

    let created = 0;
    for (const block of DEMO_TEAMS_LAYOUT) {
      const set = createTeamSet(block.setName);
      if (!set) continue;
      for (const spec of block.teams) {
        if (seedDemoTeamInSet(set.id, spec)) created += 1;
      }
    }
    if (created > 0) {
      writeDemoTeamsSeedVersion(DEMO_TEAMS_SEED_VERSION);
      teamsStateCache = null;
    }
    return created > 0;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.syncDemoTeamsWithDatasetMode = syncDemoTeamsWithDatasetMode;
  window.SWRM.removeDemoTeams = removeDemoTeams;

  let teamsUiBound = false;
  let teamsEditingTeamId = null;

  function teamUnitRecord(unitId) {
    const id = Number(unitId);
    if (!Number.isFinite(id) || id <= 0) return null;
    return (
      (monstersEnrichedCache || []).find((x) => x.unitId === id) ||
      (allUnits || []).find((x) => x.unitId === id) ||
      null
    );
  }

  function teamUnitLabel(unitId) {
    const u = teamUnitRecord(unitId);
    if (!u) return `#${unitId}`;
    return u.displayName || `#${u.masterId}`;
  }

  function teamUnitImageFile(unitId, masterIdFallback) {
    const u = teamUnitRecord(unitId);
    const db = window.SWRM_MONSTER_DB;
    const masterId = u?.masterId ?? masterIdFallback;
    if (u && u.imageFilename) return u.imageFilename;
    if (db && masterId && typeof db.imageFilename === 'function') {
      return db.imageFilename(masterId) || '';
    }
    return '';
  }

  async function ensureTeamsUnitCache() {
    if (!allUnits || !allUnits.length) return;
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (typeof db.indexCount === 'function' && db.indexCount() === 0) {
          await db.loadMonsterIndex({ force: true });
        }
      } catch (e) { /* ignore */ }
    }
    if (monstersEnrichedCache.length) return;
    monstersEnrichedCache = allUnits.map((u) => {
      const meta = db ? db.lookupMonster(u.masterId) : null;
      return {
        ...u,
        meta,
        metaElement: meta && meta.element ? meta.element : '',
        displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
        imageFilename: meta && meta.image_filename ? meta.image_filename : '',
      };
    });
  }

  function bindTeamsCardPortraits(root) {
    const host = root || document.getElementById('teams-card-grid');
    if (!host || typeof bindMonsterPortrait !== 'function') return;
    host.querySelectorAll('img.team-card__portrait[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file) bindMonsterPortrait(img, file);
    });
  }

  function teamRuneStatus(unitId) {
    const u = teamUnitRecord(unitId);
    if (!u) return 'missing';
    if (u.hasFullRunes) return 'ready';
    if (u.equippedCount > 0) return 'partial';
    return 'unruned';
  }

  function teamLeaderSpdPct(team) {
    const lid = team && team.leaderUnitId != null ? Number(team.leaderUnitId) : null;
    if (!Number.isFinite(lid) || lid <= 0) return 0;
    const u = teamUnitRecord(lid);
    if (!u) return 0;
    const meta =
      u.meta ||
      (window.SWRM_MONSTER_DB && typeof window.SWRM_MONSTER_DB.lookupMonster === 'function'
        ? window.SWRM_MONSTER_DB.lookupMonster(u.masterId)
        : null);
    const ls = meta && meta.leader_skill ? meta.leader_skill : null;
    if (typeof leaderSkillSpdPct === 'function') return leaderSkillSpdPct(ls);
    if (!ls) return 0;
    const attr = String(ls.attribute || '').toLowerCase();
    if (!attr.includes('speed')) return 0;
    const n = Number(ls.amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function teamTotemSpdPct() {
    if (typeof getAccountTotemSpdPct === 'function') return getAccountTotemSpdPct();
    if (window.SWRM && typeof window.SWRM.getAccountTotemSpdPct === 'function') {
      return window.SWRM.getAccountTotemSpdPct();
    }
    const json = typeof activeSwexJson !== 'undefined' ? activeSwexJson : null;
    if (typeof totemSpdPctFromSwexJson === 'function') return totemSpdPctFromSwexJson(json);
    if (window.SWRM && typeof window.SWRM.totemSpdPctFromSwexJson === 'function') {
      return window.SWRM.totemSpdPctFromSwexJson(json);
    }
    return 0;
  }

  function teamUnitDisplaySpeed(unitId, team) {
    const u = teamUnitRecord(unitId);
    if (!u) return null;
    const opts = {
      totemSpdPct: teamTotemSpdPct(),
      leaderSpdPct: teamLeaderSpdPct(team),
    };
    const calc =
      (window.SWRM && typeof window.SWRM.computeUnitSpeedForTeam === 'function'
        ? window.SWRM.computeUnitSpeedForTeam
        : null) ||
      (typeof computeUnitSpeedForTeam === 'function' ? computeUnitSpeedForTeam : null);
    if (calc) return calc(u, opts);
    const sw = Number(u.stats && u.stats.spd);
    return Number.isFinite(sw) && sw > 0 ? Math.floor(sw) : null;
  }

  function computeTeamCardStats(team) {
    const slots = team.slots || [];
    let filled = 0;
    let fullSix = 0;
    for (const uid of slots) {
      if (!uid) continue;
      const u = teamUnitRecord(uid);
      if (!u) continue;
      filled += 1;
      if (u.hasFullRunes) fullSix += 1;
    }
    return { filled, slotCount: slots.length, fullSix };
  }

  function buildTeamCardMeta(team, t) {
    const st = computeTeamCardStats(team);
    if (!st.filled) return '';
    const tpl = t.teamsCardReadiness || '{full}/{filled} with 6/6 runes';
    return `<p class="team-card__meta">${escapeHtml(
      tpl.replace(/\{full\}/g, String(st.fullSix)).replace(/\{filled\}/g, String(st.filled)),
    )}</p>`;
  }

  function buildTeamsUnitOptions(selectedId) {
    const units = monstersEnrichedCache.length
      ? monstersEnrichedCache
      : (allUnits || []).map((u) => ({
          unitId: u.unitId,
          displayName: `#${u.masterId}`,
          masterId: u.masterId,
        }));
    const opts = ['<option value="">—</option>'];
    for (const u of units) {
      const sel = Number(selectedId) === u.unitId ? ' selected' : '';
      opts.push(
        `<option value="${escapeHtml(String(u.unitId))}"${sel}>${escapeHtml(u.displayName || String(u.unitId))}</option>`,
      );
    }
    return opts.join('');
  }

  function buildTeamSlotIcons(team, t) {
    const slots = team.slots || [];
    const masterIds = team.masterIds || [];
    const size = slots.length;
    const cells = slots
      .map((uid, i) => {
        const leader = team.leaderUnitId != null && Number(team.leaderUnitId) === Number(uid);
        const missing = uid && !teamUnitRecord(uid) && !masterIds[i];
        const runeSt = uid ? teamRuneStatus(uid) : '';
        const imgFile = uid ? teamUnitImageFile(uid, masterIds[i]) : '';
        const spd = uid ? teamUnitDisplaySpeed(uid, team) : null;
        const spdBadge =
          spd != null
            ? `<span class="team-card__spd" title="${escapeHtml(t.teamsSlotSpd || 'Speed')}">${escapeHtml(String(spd))}</span>`
            : '';
        const inner = imgFile
          ? `<img class="team-card__portrait" data-img-file="${escapeAttr(imgFile)}" alt="" width="52" height="52" loading="lazy" decoding="async" />`
          : '<span class="team-card__slot-empty">+</span>';
        const tip = uid ? escapeHtml(teamUnitLabel(uid)) : '';
        return `<div class="team-card__slot${leader ? ' team-card__slot--leader' : ''}${missing ? ' team-card__slot--missing' : ''}" data-slot-idx="${i}" title="${tip}">
          ${leader ? '<span class="team-card__crown" aria-hidden="true">👑</span>' : ''}
          ${inner}
          ${spdBadge}
          ${runeSt === 'ready' ? '<span class="team-card__rune-ok" title="6/6 runes">✓</span>' : ''}
        </div>`;
      })
      .join('');
    return `<div class="team-card__slots team-card__slots--n${size}">${cells}</div>`;
  }

  function buildShareTeamFromPayload(team) {
    const unitIds = Array.isArray(team.unit_ids) ? team.unit_ids : [];
    const masterIds = Array.isArray(team.master_ids) ? team.master_ids : [];
    const size = Math.max(unitIds.length, TEAM_SIZE_DEFAULT);
    return {
      id: 'share',
      name: team.name || 'Team',
      notes: team.notes || '',
      tags: team.tags || [],
      size,
      leaderUnitId: team.leader_unit_id != null ? Number(team.leader_unit_id) : null,
      slots: unitIds,
      masterIds,
    };
  }

  function buildTeamCardHtml(team, t, opts) {
    const ro = !!(opts && opts.readOnly);
    const tags = (team.tags || [])
      .map((tag) => `<span class="team-card__tag">${escapeHtml(tag)}</span>`)
      .join('');
    const notes = team.notes
      ? `<p class="team-card__notes">${escapeHtml(team.notes)}</p>`
      : '';
    const name = team.name || t.teamsUntitled || 'New Team';
    const publicBadge =
      team.shareInProfile || (ro && opts && opts.fromShare)
        ? `<span class="team-card__public" title="${escapeHtml(t.teamsSharePublic || 'Public in profile')}">◉</span>`
        : '';
    const actions = ro
      ? ''
      : `<div class="team-card__actions">
          <button type="button" class="team-card__action" data-team-action="edit" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsEdit || 'Edit')}</button>
          <button type="button" class="team-card__action" data-team-action="duplicate" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsDuplicate || 'Duplicate')}</button>
          <button type="button" class="team-card__action" data-team-action="share" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsShare || 'Share')}</button>
          <button type="button" class="team-card__action team-card__action--danger" data-team-action="delete" data-team-id="${escapeHtml(team.id)}">${escapeHtml(t.teamsDelete || 'Delete')}</button>
        </div>`;
    return `<article class="team-card${ro ? ' team-card--readonly' : ''}" data-teams-team-id="${escapeHtml(team.id)}"${ro ? '' : ' draggable="true"'}>
      <header class="team-card__head">
        <h4 class="team-card__title">${escapeHtml(name)}${publicBadge}</h4>
        ${actions}
      </header>
      ${buildTeamSlotIcons(team, t)}
      ${buildTeamCardMeta(team, t)}
      ${tags ? `<div class="team-card__tags">${tags}</div>` : ''}
      ${notes}
    </article>`;
  }

  function renderTeamsSetList(state, t) {
    const list = document.getElementById('teams-set-list');
    if (!list) return;
    if (!state.sets.length) {
      list.innerHTML = `<li class="teams-set-list__empty">${escapeHtml(t.teamsNoSets || 'No team sets yet. Create one to get started.')}</li>`;
      return;
    }
    const activeId = getTeamsActiveSetId();
    list.innerHTML = state.sets
      .map((set) => {
        const on = set.id === activeId;
        const collapsed = !!set.collapsed;
        const count = (set.teamIds || []).length;
        const delTitle = escapeAttr(t.teamsDeleteSet || 'Delete set');
        return `<li class="teams-set-tree__item">
          <div class="teams-set-tree__row${on ? ' is-active' : ''}">
            <button type="button" class="teams-set-tree__toggle" data-teams-set-collapse="${escapeHtml(set.id)}" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? '▶' : '▼'}</button>
            <button type="button" class="teams-set-tree__btn" data-teams-set-id="${escapeHtml(set.id)}">
              <span class="teams-set-tree__name">${escapeHtml(set.name)}</span>
              <span class="teams-set-tree__count">${count}</span>
            </button>
            <button type="button" class="teams-set-tree__delete btn-ghost" data-teams-delete-set="${escapeHtml(set.id)}" title="${delTitle}" aria-label="${delTitle}" data-teams-readonly-hide>×</button>
          </div>
        </li>`;
      })
      .join('');
  }

  function renderTeamsCardGrid(set, state, t) {
    const grid = document.getElementById('teams-card-grid');
    if (!grid) return;
    if (!set) {
      grid.innerHTML = `<p class="teams-main__empty">${escapeHtml(t.teamsPickSet || 'Select or create a team set.')}</p>`;
      return;
    }
    const teams = (set.teamIds || []).map((id) => state.teams[id]).filter(Boolean);
    if (!teams.length) {
      grid.innerHTML = `<div class="teams-main__empty">
        <p>${escapeHtml(t.teamsNoTeams || 'No teams in this set yet.')}</p>
        <button type="button" class="btn-primary" id="teams-create-team-inline">${escapeHtml(t.teamsCreateTeam || '+ Create Team')}</button>
      </div>`;
      return;
    }
    grid.innerHTML = teams.map((team) => buildTeamCardHtml(team, t)).join('');
  }

  function openTeamsEditor(teamId) {
    const dlg = document.getElementById('teams-editor-dialog');
    const team = getTeamById(teamId);
    if (!dlg || !team) return;
    teamsEditingTeamId = teamId;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const nameInput = document.getElementById('teams-team-name');
    const notesInput = document.getElementById('teams-team-notes');
    const tagsInput = document.getElementById('teams-team-tags');
    const sizeSelect = document.getElementById('teams-team-size');
    const shareCb = document.getElementById('teams-share-public');
    if (nameInput) {
      nameInput.value = team.name || '';
      nameInput.placeholder = t.teamsNamePlaceholder || 'e.g. Arena Offence';
    }
    if (notesInput) notesInput.value = team.notes || '';
    if (tagsInput) tagsInput.value = (team.tags || []).join(', ');
    if (sizeSelect) sizeSelect.value = String(team.size || TEAM_SIZE_DEFAULT);
    if (shareCb) shareCb.checked = !!team.shareInProfile;
    renderEditorSlots(team, t);
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  function closeTeamsEditor() {
    const dlg = document.getElementById('teams-editor-dialog');
    teamsEditingTeamId = null;
    if (dlg && dlg.open && typeof dlg.close === 'function') dlg.close();
    else if (dlg) dlg.removeAttribute('open');
  }

  function renderEditorSlots(team, t) {
    const wrap = document.getElementById('teams-monster-slots');
    if (!wrap || !team) return;
    wrap.innerHTML = (team.slots || [])
      .map((slotId, i) => {
        const leader = team.leaderUnitId != null && Number(team.leaderUnitId) === Number(slotId);
        return `<div class="teams-editor-slot${leader ? ' teams-editor-slot--leader' : ''}" data-slot-idx="${i}">
          <label class="teams-editor-slot__label">
            <span>${escapeHtml((t.teamsSlotLabel || 'Slot {n}').replace('{n}', String(i + 1)))}</span>
            <select class="teams-slot-select" data-slot-idx="${i}">${buildTeamsUnitOptions(slotId)}</select>
          </label>
          <button type="button" class="teams-editor-slot__leader" data-set-leader="${i}" title="${escapeHtml(t.teamsSetLeader || 'Set leader')}">👑</button>
        </div>`;
      })
      .join('');
  }

  function saveTeamsEditorFromDom() {
    const teamId = teamsEditingTeamId;
    if (!teamId) return;
    const name = document.getElementById('teams-team-name')?.value;
    const notes = document.getElementById('teams-team-notes')?.value;
    const tagsRaw = document.getElementById('teams-team-tags')?.value || '';
    const size = document.getElementById('teams-team-size')?.value;
    const shareInProfile = document.getElementById('teams-share-public')?.checked === true;
    const slots = [];
    document.querySelectorAll('#teams-monster-slots .teams-slot-select').forEach((sel) => {
      slots.push(sel.value ? Number(sel.value) : null);
    });
    let leaderUnitId = getTeamById(teamId)?.leaderUnitId ?? null;
    const leaderBtn = document.querySelector('#teams-monster-slots .teams-editor-slot--leader .teams-slot-select');
    if (leaderBtn && leaderBtn.value) leaderUnitId = Number(leaderBtn.value);
    updateTeam(teamId, {
      name,
      notes,
      tags: tagsRaw.split(/[,;]+/).map((x) => x.trim()).filter(Boolean),
      size,
      slots,
      leaderUnitId,
      shareInProfile,
    });
    closeTeamsEditor();
    renderTeamsPanel();
  }

  async function renderTeamsPanel() {
    const shell = document.getElementById('teams-shell');
    if (!shell) return;
    if (typeof syncDemoTeamsWithDatasetMode === 'function') syncDemoTeamsWithDatasetMode();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    const sharePayload = getTeamsShareViewPayload();
    const layout = shell.querySelector('.teams-layout');
    const shareView = document.getElementById('teams-share-view');

    if (ro) {
      shell.classList.add('teams-shell--share-only');
      if (layout) {
        layout.hidden = true;
        layout.setAttribute('aria-hidden', 'true');
      }
      const dlg = document.getElementById('teams-editor-dialog');
      if (dlg?.open && typeof dlg.close === 'function') dlg.close();
      renderTeamsShareView(sharePayload || { sets: [] }, t);
      return;
    }

    shell.classList.remove('teams-shell--share-only');
    if (layout) {
      layout.hidden = false;
      layout.removeAttribute('aria-hidden');
    }
    if (shareView) {
      shareView.hidden = true;
      shareView.innerHTML = '';
    }

    const state = loadTeamsState();
    if (!getTeamsActiveSetId() && state.sets[0]) setTeamsActiveSetId(state.sets[0].id);

    const set = getTeamSetById(getTeamsActiveSetId()) || null;
    const setNameInput = document.getElementById('teams-set-name');
    if (setNameInput) {
      setNameInput.value = set ? set.name : '';
      setNameInput.placeholder = t.teamsSetNamePlaceholder || 'e.g. Arena';
      setNameInput.disabled = !set;
    }

    const createBtn = document.getElementById('teams-create-team');
    if (createBtn) createBtn.disabled = !set;

    renderTeamsSetList(state, t);
    await ensureTeamsUnitCache();
    renderTeamsCardGrid(set, state, t);
    bindTeamsCardPortraits(document.getElementById('teams-card-grid'));

    shell.querySelectorAll('[data-teams-readonly-hide]').forEach((el) => {
      el.hidden = ro;
    });
  }

  async function renderTeamsShareView(payload, t) {
    const shell = document.getElementById('teams-shell');
    if (!shell) return;
    const layout = shell.querySelector('.teams-layout');
    if (layout) layout.hidden = true;
    let view = document.getElementById('teams-share-view');
    if (!view) {
      view = document.createElement('div');
      view.id = 'teams-share-view';
      view.className = 'teams-share-view-wrap';
      shell.appendChild(view);
    }
    view.hidden = false;

    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
      } catch (e) { /* ignore */ }
    }
    if (!monstersEnrichedCache.length && allUnits.length) {
      monstersEnrichedCache = allUnits.map((u) => {
        const meta = db ? db.lookupMonster(u.masterId) : null;
        return {
          ...u,
          displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
          imageFilename: meta && meta.image_filename ? meta.image_filename : '',
        };
      });
    }

    const blocks = (payload.sets || [])
      .map((set) => {
        const teams = (set.teams || [])
          .map((raw) =>
            buildTeamCardHtml(buildShareTeamFromPayload(raw), t, { readOnly: true, fromShare: true }),
          )
          .join('');
        const count = (set.teams || []).length;
        return `<section class="teams-share-set-panel">
          <header class="teams-share-set-panel__head">
            <span class="teams-share-set-panel__icon" aria-hidden="true">📁</span>
            <h4 class="teams-share-set-panel__title">${escapeHtml(set.name || 'Set')}</h4>
            <span class="teams-share-set-panel__count">${count}</span>
          </header>
          <div class="teams-share-set-panel__grid">${teams}</div>
        </section>`;
      })
      .join('');
    view.innerHTML = `<div class="teams-share-view">
      <h3 class="teams-share-view__title">${escapeHtml(t.teamsShareViewTitle || 'Shared teams')}</h3>
      ${blocks || `<p class="teams-share-view__empty">${escapeHtml(t.teamsShareViewEmpty || 'No public teams in this profile.')}</p>`}
    </div>`;
    bindTeamsCardPortraits(view);
  }

  function bindTeamsUi() {
    if (teamsUiBound) return;
    teamsUiBound = true;

    const createTeamHandler = () => {
      const setId = getTeamsActiveSetId();
      if (!setId) return;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      createTeamInSet(setId, '', TEAM_SIZE_DEFAULT);
      const set = getTeamSetById(setId);
      const tid = set && set.teamIds.length ? set.teamIds[set.teamIds.length - 1] : null;
      renderTeamsPanel();
      if (tid) openTeamsEditor(tid);
    };

    document.getElementById('teams-export-json')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      try {
        const json = exportTeamsStateJson();
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'sw-forge-teams.json';
        a.click();
        URL.revokeObjectURL(a.href);
        if (typeof showSwrmToast === 'function') {
          showSwrmToast(t.teamsExportDone || 'Teams exported.', { type: 'success' });
        }
      } catch (e) {
        if (typeof showSwrmToast === 'function') {
          showSwrmToast((t.teamsExportFailed || 'Export failed') + (e.message ? `: ${e.message}` : ''), { type: 'error' });
        }
      }
    });

    document.getElementById('teams-import-json')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json,application/json';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', () => {
        const file = inp.files?.[0];
        document.body.removeChild(inp);
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const replaceAll = confirm(
            t.teamsImportReplaceConfirm || 'Replace all teams? OK = replace, Cancel = merge into existing.',
          );
          const res = importTeamsStateFromJson(String(reader.result || ''), !replaceAll);
          if (!res.ok) {
            if (typeof showSwrmToast === 'function') {
              showSwrmToast(t.teamsImportFailed || 'Import failed — invalid JSON.', { type: 'error' });
            }
            return;
          }
          renderTeamsPanel();
          if (typeof showSwrmToast === 'function') {
            showSwrmToast(t.teamsImportDone || 'Teams imported.', { type: 'success' });
          }
        };
        reader.readAsText(file);
      });
      inp.click();
    });

    document.getElementById('teams-add-set')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const name = window.prompt(t.teamsNewSetPrompt || 'Set name', '');
      if (name == null) return;
      createTeamSet(name || t.teamsDefaultSetName || 'Arena');
      renderTeamsPanel();
    });

    document.getElementById('teams-create-team')?.addEventListener('click', createTeamHandler);
    document.getElementById('teams-card-grid')?.addEventListener('click', (e) => {
      if (e.target.id === 'teams-create-team-inline') {
        createTeamHandler();
        return;
      }
      const actionBtn = e.target.closest('[data-team-action]');
      if (!actionBtn) return;
      const action = actionBtn.dataset.teamAction;
      const teamId = actionBtn.dataset.teamId;
      if (action === 'edit') openTeamsEditor(teamId);
      else if (action === 'duplicate') {
        duplicateTeam(teamId);
        renderTeamsPanel();
      } else if (action === 'delete') {
        if (window.confirm((TRANSLATIONS[currentLang] || TRANSLATIONS.en).teamsDeleteConfirm || 'Delete this team?')) {
          deleteTeam(teamId);
          renderTeamsPanel();
        }
      } else if (action === 'share') {
        const team = getTeamById(teamId);
        if (team) {
          updateTeam(teamId, { shareInProfile: true });
          if (typeof triggerShareProfile === 'function') void triggerShareProfile();
        }
      }
    });

    document.getElementById('teams-set-list')?.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-teams-delete-set]');
      if (delBtn) {
        e.stopPropagation();
        const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        const setId = delBtn.dataset.teamsDeleteSet;
        if (!setId) return;
        if (!window.confirm(tloc.teamsDeleteSetConfirm || 'Delete this team set and all teams in it?')) return;
        deleteTeamSet(setId);
        renderTeamsPanel();
        return;
      }
      const collapse = e.target.closest('[data-teams-set-collapse]');
      if (collapse) {
        toggleSetCollapsed(collapse.dataset.teamsSetCollapse);
        renderTeamsPanel();
        return;
      }
      const btn = e.target.closest('[data-teams-set-id]');
      if (!btn) return;
      setTeamsActiveSetId(btn.dataset.teamsSetId);
      renderTeamsPanel();
    });

    document.getElementById('teams-set-name')?.addEventListener('change', (e) => {
      const setId = getTeamsActiveSetId();
      if (!setId) return;
      renameTeamSet(setId, e.target.value);
      renderTeamsPanel();
    });

    document.getElementById('teams-editor-dialog')?.addEventListener('close', () => {
      teamsEditingTeamId = null;
    });

    document.getElementById('teams-editor-save')?.addEventListener('click', () => {
      saveTeamsEditorFromDom();
    });

    const closeEditor = () => closeTeamsEditor();
    document.getElementById('teams-editor-cancel')?.addEventListener('click', closeEditor);
    document.getElementById('teams-editor-cancel-foot')?.addEventListener('click', closeEditor);

    document.getElementById('teams-team-size')?.addEventListener('change', () => {
      const teamId = teamsEditingTeamId;
      if (!teamId) return;
      const size = document.getElementById('teams-team-size')?.value;
      const team = getTeamById(teamId);
      if (!team) return;
      updateTeam(teamId, { size, slots: team.slots });
      renderEditorSlots(getTeamById(teamId), TRANSLATIONS[currentLang] || TRANSLATIONS.en);
    });

    document.getElementById('teams-monster-slots')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-set-leader]');
      if (!btn || !teamsEditingTeamId) return;
      const idx = Number(btn.dataset.setLeader);
      const sel = document.querySelector(`#teams-monster-slots .teams-slot-select[data-slot-idx="${idx}"]`);
      const val = sel?.value;
      if (!val) return;
      document.querySelectorAll('.teams-editor-slot').forEach((el) => el.classList.remove('teams-editor-slot--leader'));
      btn.closest('.teams-editor-slot')?.classList.add('teams-editor-slot--leader');
    });

    const grid = document.getElementById('teams-card-grid');
    if (grid) {
      let dragTeamId = null;
      grid.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.team-card');
        if (!card) return;
        dragTeamId = card.dataset.teamsTeamId;
        e.dataTransfer?.setData('text/plain', dragTeamId);
      });
      grid.addEventListener('dragover', (e) => {
        if (!dragTeamId) return;
        e.preventDefault();
      });
      grid.addEventListener('drop', (e) => {
        e.preventDefault();
        const target = e.target.closest('.team-card');
        const setId = getTeamsActiveSetId();
        const set = getTeamSetById(setId);
        if (!target || !set || !dragTeamId) return;
        const targetId = target.dataset.teamsTeamId;
        const ids = [...set.teamIds];
        const from = ids.indexOf(dragTeamId);
        const to = ids.indexOf(targetId);
        if (from < 0 || to < 0) return;
        ids.splice(from, 1);
        ids.splice(to, 0, dragTeamId);
        reorderTeamsInSet(setId, ids);
        dragTeamId = null;
        renderTeamsPanel();
      });
    }
  }

  function initTeamsPanel() {
    bindTeamsUi();
    void renderTeamsPanel();
  }

  function fmtRuneStatVal(type, val, slotNo) {
    const n = Number(val);
    if (!Number.isFinite(n)) return '0';
    const flatFn =
      window.SWRM && typeof window.SWRM.isMainStatFlat === 'function'
        ? window.SWRM.isMainStatFlat
        : window.SWRM && typeof window.SWRM.isFlat === 'function'
          ? (slot, typeId) => window.SWRM.isFlat(typeId)
          : () => false;
    return flatFn(slotNo, type) ? String(Math.round(n)) : `${n}%`;
  }

  function readMonstersFilters() {
    const defaults = {
      q: '',
      element: '',
      location: 'all',
      sort: 'name',
      fullSixOnly: false,
      minLevelMin: 0,
      skillFilter: '',
      runeFilter: '',
      runeSet: '',
      tagFilter: '',
      roleFilter: '',
      markFilter: '',
    };
    try {
      const raw = localStorage.getItem(MONSTERS_FILTER_STORAGE_KEY);
      if (!raw) return defaults;
      const o = JSON.parse(raw);
      return {
        q: o.q != null ? String(o.q) : '',
        element: o.element != null ? String(o.element) : '',
        location: o.location != null ? String(o.location) : 'all',
        sort: o.sort != null ? String(o.sort) : 'name',
        fullSixOnly: !!o.fullSixOnly,
        minLevelMin:
          o.minLevelMin != null && Number.isFinite(Number(o.minLevelMin))
            ? Math.max(0, Math.min(40, Math.round(Number(o.minLevelMin))))
            : o.minLevel36Only
              ? 35
              : 0,
        skillFilter: o.skillFilter != null ? String(o.skillFilter) : '',
        runeFilter: o.runeFilter != null ? String(o.runeFilter) : '',
        runeSet: o.runeSet != null ? String(o.runeSet) : '',
        tagFilter: o.tagFilter != null ? String(o.tagFilter) : '',
        roleFilter: o.roleFilter != null ? String(o.roleFilter) : '',
        markFilter: o.markFilter != null ? String(o.markFilter) : '',
      };
    } catch (e) {
      return defaults;
    }
  }

  function writeMonstersFilters(f) {
    try {
      localStorage.setItem(MONSTERS_FILTER_STORAGE_KEY, JSON.stringify(f));
    } catch (e) { /* ignore */ }
  }

  function readMonstersUnitMeta() {
    try {
      const raw = localStorage.getItem(MONSTERS_UNIT_META_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function writeMonstersUnitMeta(map) {
    try {
      localStorage.setItem(MONSTERS_UNIT_META_KEY, JSON.stringify(map));
    } catch (e) { /* ignore */ }
  }

  function normalizeCustomTag(name) {
    return String(name || '')
      .trim()
      .slice(0, MAX_TAG_LEN);
  }

  function isUnitMetaEmpty(row) {
    if (!row || typeof row !== 'object') return true;
    if (row.favorite || row.food || row.storageMark) return false;
    if (Array.isArray(row.tags) && row.tags.length) return false;
    return true;
  }

  function unitMetaFor(unitId) {
    const map = readMonstersUnitMeta();
    const row = map[String(unitId)] || {};
    const tags = Array.isArray(row.tags)
      ? row.tags.map(normalizeCustomTag).filter(Boolean)
      : [];
    return {
      favorite: !!row.favorite,
      food: !!row.food,
      storageMark: !!row.storageMark,
      tags,
    };
  }

  function setUnitMetaFlag(unitId, key, on) {
    const map = readMonstersUnitMeta();
    const id = String(unitId);
    if (!map[id]) map[id] = {};
    if (on) map[id][key] = true;
    else delete map[id][key];
    if (isUnitMetaEmpty(map[id])) delete map[id];
    writeMonstersUnitMeta(map);
  }

  function toggleUnitMetaFlag(unitId, flagKey) {
    const cur = unitMetaFor(unitId);
    const on = !cur[flagKey];
    setUnitMetaFlag(unitId, flagKey, on);
    return on;
  }

  function readTagsRegistry() {
    try {
      const raw = localStorage.getItem(MONSTERS_TAGS_REGISTRY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return [...new Set(arr.map(normalizeCustomTag).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      );
    } catch (e) {
      return [];
    }
  }

  function writeTagsRegistry(list) {
    const uniq = [...new Set(list.map(normalizeCustomTag).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
    try {
      localStorage.setItem(MONSTERS_TAGS_REGISTRY_KEY, JSON.stringify(uniq));
    } catch (e) { /* ignore */ }
    return uniq;
  }

  function registerCustomTag(name) {
    const n = normalizeCustomTag(name);
    if (!n) return readTagsRegistry();
    const list = readTagsRegistry();
    if (!list.includes(n)) list.push(n);
    return writeTagsRegistry(list);
  }

  function setUnitCustomTags(unitId, tags) {
    const map = readMonstersUnitMeta();
    const id = String(unitId);
    const norm = [...new Set(tags.map(normalizeCustomTag).filter(Boolean))].slice(0, MAX_UNIT_TAGS);
    if (!map[id]) map[id] = {};
    if (norm.length) map[id].tags = norm;
    else delete map[id].tags;
    if (isUnitMetaEmpty(map[id])) delete map[id];
    writeMonstersUnitMeta(map);
    norm.forEach((t) => registerCustomTag(t));
  }

  function addUnitCustomTag(unitId, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    const cur = unitMetaFor(unitId).tags;
    if (cur.includes(n)) return;
    setUnitCustomTags(unitId, [...cur, n]);
  }

  function removeUnitCustomTag(unitId, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    setUnitCustomTags(
      unitId,
      unitMetaFor(unitId).tags.filter((t) => t !== n),
    );
    pruneUnusedTagsRegistry();
  }

  function pruneUnusedTagsRegistry() {
    const registry = readTagsRegistry();
    const meta = readMonstersUnitMeta();
    const used = new Set();
    for (const row of Object.values(meta)) {
      if (!row || !Array.isArray(row.tags)) continue;
      for (const name of row.tags) used.add(name);
    }
    const pruned = registry.filter((name) => used.has(name));
    if (pruned.length !== registry.length) writeTagsRegistry(pruned);
  }

  function normalizeArchetype(raw) {
    const s = String(raw || '').trim();
    if (!s) return '';
    const k = s.toLowerCase();
    if (k === 'hp') return 'HP';
    if (k === 'attack' || k === 'atk') return 'Attack';
    if (k === 'defense' || k === 'defence' || k === 'def') return 'Defense';
    if (k === 'support' || k === 'sup') return 'Support';
    if (MONSTER_ROLE_ORDER.includes(s)) return s;
    return s;
  }

  function bulkSetFoodFlag(unitIds, on) {
    for (const id of unitIds) setUnitMetaFlag(id, 'food', !!on);
  }

  function bulkSetStorageMark(unitIds, on) {
    for (const id of unitIds) setUnitMetaFlag(id, 'storageMark', !!on);
  }

  function bulkToggleFoodFlag(unitIds) {
    if (!unitIds.length) return;
    const allOn = unitIds.every((id) => unitMetaFor(id).food);
    bulkSetFoodFlag(unitIds, !allOn);
  }

  function bulkToggleStorageMark(unitIds) {
    const eligible = unitIds.filter((id) => {
      const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(id));
      return !u || !u.inStorage;
    });
    if (!eligible.length) return;
    const allOn = eligible.every((id) => unitMetaFor(id).storageMark);
    bulkSetStorageMark(eligible, !allOn);
  }

  function bulkToggleFavoriteFlag(unitIds) {
    if (!unitIds.length) return;
    const allOn = unitIds.every((id) => unitMetaFor(id).favorite);
    for (const id of unitIds) setUnitMetaFlag(id, 'favorite', !allOn);
  }

  function bulkAddCustomTag(unitIds, tag) {
    const n = normalizeCustomTag(tag);
    if (!n) return;
    for (const id of unitIds) addUnitCustomTag(id, n);
    registerCustomTag(n);
  }

  function readMonstersBulkSelected() {
    try {
      const raw = localStorage.getItem(MONSTERS_BULK_SEL_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.map(String) : []);
    } catch (e) {
      return new Set();
    }
  }

  function writeMonstersBulkSelected(set) {
    monstersBulkSelected = set instanceof Set ? set : new Set();
    try {
      localStorage.setItem(
        MONSTERS_BULK_SEL_KEY,
        JSON.stringify([...monstersBulkSelected]),
      );
    } catch (e) { /* ignore */ }
  }

  function toggleMonstersBulkSelect(unitId) {
    const id = String(unitId);
    if (monstersBulkSelected.has(id)) monstersBulkSelected.delete(id);
    else monstersBulkSelected.add(id);
    writeMonstersBulkSelected(monstersBulkSelected);
  }

  function loadMonstersSelectedUnitId() {
    try {
      const raw = sessionStorage.getItem(MONSTERS_SELECTED_KEY);
      return raw ? String(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveMonstersSelectedUnitId(unitId) {
    monstersSelectedUnitId = unitId != null ? String(unitId) : null;
    try {
      if (monstersSelectedUnitId) sessionStorage.setItem(MONSTERS_SELECTED_KEY, monstersSelectedUnitId);
      else sessionStorage.removeItem(MONSTERS_SELECTED_KEY);
    } catch (e) { /* ignore */ }
  }

  /** Clear bulk + focus selection and strip highlight classes from the grid. */
  function clearAllMonstersSelection() {
    monstersBulkSelected = new Set();
    writeMonstersBulkSelected(monstersBulkSelected);
    monstersBulkLastIndex = -1;
    saveMonstersSelectedUnitId(null);
    monstersDetailHoverUnitId = null;
    if (typeof hideMonstersDetailFloat === 'function') hideMonstersDetailFloat();
    const grid = document.getElementById('monsters-grid');
    if (grid) {
      grid.querySelectorAll('.monsters-card').forEach((card) => {
        card.classList.remove('monsters-card--bulk-on', 'monsters-card--selected', 'monsters-card--hover');
      });
      grid.querySelectorAll('.monsters-table__row').forEach((row) => {
        row.classList.remove('monsters-table__row--bulk-on', 'monsters-table__row--selected', 'monsters-table__row--hover');
      });
    }
  }

  function bindMonsterPortrait(img, imageFilename) {
    if (!img || !imageFilename || !window.SWRM_MONSTER_DB) return;
    const db = window.SWRM_MONSTER_DB;
    const la = window.SWRM_LOCAL_ASSETS;
    let base = 0;
    img.onerror = () => {
      base += 1;
      if (base < db.IMG_BASES.length) {
        const url =
          la && typeof la.monsterPortraitRemoteUrl === 'function'
            ? la.monsterPortraitRemoteUrl(imageFilename, base)
            : db.monsterImageUrl(imageFilename, base);
        img.src = url;
      } else {
        img.removeAttribute('src');
        img.classList.add('monsters-card__img--placeholder');
      }
    };
    img.referrerPolicy = 'no-referrer';
    const primary = db.monsterImageUrl(imageFilename, 0);
    const fb =
      la && typeof la.monsterPortraitFallbackUrl === 'function'
        ? la.monsterPortraitFallbackUrl(imageFilename)
        : '';
    if (fb && fb !== primary) img.dataset.fallback = fb;
    img.src = primary;
  }

  function elementClass(el) {
    const k = String(el || '').toLowerCase();
    if (k === 'fire' || k === 'water' || k === 'wind' || k === 'light' || k === 'dark') return k;
    return '';
  }

  /** Rainbowmon, elemental Angelmon, Devilmon — excluded from roster views. */
  function isTechnicalFodderMonster(u) {
    if (!u) return false;
    const name = String(u.displayName || '').toLowerCase();
    if (/\brainbowmon\b/i.test(name)) return true;
    if (/\bdevilmon\b/i.test(name)) return true;
    if (/\bangelmon\b/i.test(name)) return true;
    return false;
  }

  function unitHasRuneSet(u, setName) {
    if (!setName) return true;
    for (const slot of u.runeSlots || []) {
      if (slot.rune && slot.rune.setName === setName) return true;
    }
    return false;
  }

  let monstersSearchHighlight = '';

  function highlightMonstersSearchInPlain(text, qRaw) {
    const q = (qRaw || '').trim().toLowerCase();
    const t = String(text ?? '');
    if (!q) return escapeHtml(t);
    const tl = t.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < t.length) {
      const idx = tl.indexOf(q, i);
      if (idx === -1) {
        parts.push(escapeHtml(t.slice(i)));
        break;
      }
      if (idx > i) parts.push(escapeHtml(t.slice(i, idx)));
      parts.push(`<mark class="search-hit">${escapeHtml(t.slice(idx, idx + q.length))}</mark>`);
      i = idx + q.length;
    }
    return parts.join('');
  }

  function monsterUnitSearchHaystack(u) {
    const bits = [
      u.displayName,
      u.masterId,
      u.metaElement,
      u.metaArchetype,
      String(u.level ?? ''),
      String(u.equippedCount ?? ''),
      u.inStorage ? 'storage' : 'active',
      u.favorite ? 'favorite' : '',
      u.food ? 'food fodder' : '',
      (u.customTags || []).join(' '),
    ];
    for (const slot of u.runeSlots || []) {
      const r = slot.rune;
      if (!r) continue;
      bits.push(
        r.setName,
        r.mainName,
        r.gradeStr,
        String(r.slot),
        String(r.level),
        r.role,
        r.verdict,
      );
      for (const s of r.substats || []) {
        if (s.name) bits.push(s.name, String(s.val ?? ''));
      }
    }
    for (const sk of u.skillRows || []) {
      bits.push(sk.name, String(sk.level), String(sk.maxLevel));
    }
    return bits
      .filter((x) => x != null && String(x).trim() !== '')
      .join(' ')
      .toLowerCase();
  }

  function filterMonstersList(units, filters) {
    const q = (filters.q || '').trim().toLowerCase();
    const el = filters.element || '';
    const loc = filters.location || 'all';
    const fullSixOnly = !!filters.fullSixOnly;
    const minLevelMin = Number(filters.minLevelMin) || 0;
    const skillFilter = filters.skillFilter || '';
    const runeFilter = filters.runeFilter || '';
    const runeSet = filters.runeSet || '';
    const tagFilter = filters.tagFilter || '';
    const roleFilter = filters.roleFilter || '';
    const markFilter = filters.markFilter || '';
    return units.filter((u) => {
      if (isTechnicalFodderMonster(u)) return false;
      if (fullSixOnly && !u.hasFullRunes) return false;
      if (minLevelMin > 0 && (Number(u.level) || 0) < minLevelMin) return false;
      if (el && u.metaElement !== el) return false;
      if (loc === 'active' && u.inStorage) return false;
      if (loc === 'storage' && !u.inStorage) return false;
      if (skillFilter === 'maxed') {
        if (!u.skillsKnown || !u.skillsMaxed) return false;
      } else if (skillFilter === 'needs-up') {
        if (u.skillUpsNeeded <= 0) return false;
      }
      if (runeFilter === 'unruned') {
        if (u.equippedCount > 0) return false;
      } else if (runeFilter === 'partial') {
        if (u.equippedCount <= 0 || u.hasFullRunes) return false;
      }
      if (runeSet && !unitHasRuneSet(u, runeSet)) return false;
      if (tagFilter && !(u.customTags || []).includes(tagFilter)) return false;
      if (roleFilter && normalizeArchetype(u.metaArchetype) !== roleFilter) return false;
      if (markFilter === 'favorite' && !u.favorite) return false;
      if (markFilter === 'food' && !u.food) return false;
      if (q) {
        const hay = monsterUnitSearchHaystack(u);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function sortMonstersList(units, sortKey) {
    const list = units.slice();
    const elIdx = (el) => {
      const i = ELEMENT_ORDER.indexOf(el);
      return i === -1 ? 99 : i;
    };
    list.sort((a, b) => {
      switch (sortKey) {
        case 'level-desc':
          return b.level - a.level || String(a.displayName).localeCompare(String(b.displayName));
        case 'level-asc':
          return a.level - b.level || String(a.displayName).localeCompare(String(b.displayName));
        case 'runes-desc':
          return b.equippedCount - a.equippedCount || String(a.displayName).localeCompare(String(b.displayName));
        case 'element':
          return elIdx(a.metaElement) - elIdx(b.metaElement)
            || String(a.displayName).localeCompare(String(b.displayName));
        case 'favorite-first':
          return (
            (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
            || (b.food ? 1 : 0) - (a.food ? 1 : 0)
            || String(a.displayName).localeCompare(String(b.displayName))
          );
        case 'food-first':
          return (
            (b.food ? 1 : 0) - (a.food ? 1 : 0)
            || (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)
            || String(a.displayName).localeCompare(String(b.displayName))
          );
        case 'name':
        default:
          return String(a.displayName).localeCompare(String(b.displayName));
      }
    });
    return list;
  }

  function computeMonstersSummary(units) {
    const total = units.length;
    let anyRune = 0;
    let fullSix = 0;
    let skillUpsTotal = 0;
    for (const u of units) {
      if (u.equippedCount > 0) anyRune += 1;
      if (u.hasFullRunes) fullSix += 1;
      if (u.skillUpsNeeded > 0) skillUpsTotal += u.skillUpsNeeded;
    }
    return { total, anyRune, fullSix, skillUpsTotal };
  }

  function renderMonstersChips(sum, t, indexMissing, skillsIndexMissing, chipsHostId) {
    const chips = document.getElementById(chipsHostId || 'monsters-chips');
    if (!chips) return;
    const tpl =
      t.monstersStatsTpl || '{total} six-star · {any} with any rune · {full} with 6 runes';
    const parts = [
      { label: t.monstersChipTotal || '6★', value: sum.total },
      { label: t.monstersChipRunes || 'With runes', value: sum.anyRune },
      { label: t.monstersChipFull || '6/6', value: sum.fullSix },
    ];
    if (sum.skillUpsTotal > 0) {
      parts.push({
        label: t.monstersChipSkillUps || 'Skill-ups needed',
        value: sum.skillUpsTotal,
      });
    }
    const bag = window.SWRM_ACCOUNT_GEAR;
    if (bag && ((bag.artifacts && bag.artifacts.length) || (bag.relics && bag.relics.length))) {
      const na = (bag.artifacts || []).length;
      const nr = (bag.relics || []).length;
      parts.push({
        label: t.monstersChipGear || 'Gear in box',
        value: `${na} / ${nr}`,
      });
    }
    chips.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
    const hostId = chipsHostId || 'monsters-chips';
    if (hostId === 'monsters-chips') {
      if (indexMissing) {
        const hint =
          t.monstersIndexMissing ||
          'Monster names need data/monsters-index.json — run: node tools/fetch-monsters-index.mjs';
        chips.insertAdjacentHTML(
          'beforeend',
          `<p class="monsters-index-warn monsters-index-warn--inline">${escapeHtml(hint)}</p>`,
        );
      }
      if (skillsIndexMissing) {
        const hint =
          t.monstersSkillsIndexMissing ||
          'Skill max levels need data/skills-index.json — run: node tools/fetch-skills-index.mjs';
        chips.insertAdjacentHTML(
          'beforeend',
          `<p class="monsters-index-warn monsters-index-warn--inline">${escapeHtml(hint)}</p>`,
        );
      }
      const statsEl = document.getElementById('monsters-stats');
      if (statsEl) statsEl.hidden = true;
    }
  }

  function readMonstersView() {
    try {
      const v = localStorage.getItem(MONSTERS_VIEW_KEY);
      if (v === 'table') return 'table';
      if (v === 'list') return 'cards';
      return 'cards';
    } catch (e) {
      return 'cards';
    }
  }

  function writeMonstersView(view) {
    try {
      const v = view === 'table' ? 'table' : 'cards';
      localStorage.setItem(MONSTERS_VIEW_KEY, v);
    } catch (e) { /* ignore */ }
  }

  function syncMonstersShowAllButton(fullSixOnly, t) {
    const btn = document.getElementById('monsters-filter-full-six');
    const lbl = document.getElementById('lbl-monsters-filter-full-six-btn');
    if (!btn) return;
    const hideUnruned = !!fullSixOnly;
    btn.classList.toggle('monsters-toolbar-btn--active', hideUnruned);
    btn.setAttribute('aria-pressed', hideUnruned ? 'true' : 'false');
    const text = hideUnruned
      ? t.monstersFilterShowAll || 'Show all monsters'
      : t.monstersFilterSixOnly || '6/6 runes only';
    if (lbl) lbl.textContent = text;
    else btn.textContent = text;
  }

  function clearMonstersPanelFilters() {
    const ids = [
      'monsters-filter-location',
      'monsters-filter-skill',
      'monsters-filter-rune',
      'monsters-filter-rune-set',
      'monsters-filter-tag',
      'monsters-filter-role',
      'monsters-filter-mark',
    ];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (id === 'monsters-filter-location') el.value = 'all';
      else el.value = '';
    }
    const sixBtn = document.getElementById('monsters-filter-full-six');
    if (sixBtn) {
      sixBtn.setAttribute('aria-pressed', 'false');
      sixBtn.classList.remove('monsters-toolbar-btn--active');
    }
    const lvlInp = document.getElementById('monsters-filter-min-level');
    if (lvlInp) lvlInp.value = '';
  }

  /** Reset search, element, location, advanced filters, level / 6-6 toggles; then persist from DOM. */
  function resetMonstersToolbarFilters(t) {
    clearMonstersPanelFilters();
    resetMonstersSearchQuery();
    const elSel = document.getElementById('monsters-filter-element');
    if (elSel) elSel.value = '';
    const locSel = document.getElementById('monsters-filter-location');
    if (locSel) locSel.value = 'all';
    if (t) {
      syncMonstersShowAllButton(false, t);
      syncMonstersMinLevelInput(0, t);
    }
    writeMonstersFilters(readMonstersFiltersFromDom());
    updateMonstersFilterSummary();
  }

  function resetMonstersSearchQuery() {
    const q = document.getElementById('monsters-filter-q');
    if (q) q.value = '';
  }

  function renderMonstersEmptyState(mode, t) {
    const grid = document.getElementById('monsters-grid');
    const gridHead = document.getElementById('monsters-grid-head');
    if (!grid) return;
    if (gridHead) gridHead.hidden = true;
    const title =
      mode === 'no-data'
        ? t.monstersEmptyNoData || 'Load a SWEX export to see your monsters.'
        : t.monstersEmptyTitle || 'No monsters found';
    const hint = mode === 'filtered' ? t.monstersEmptyFiltered || '' : '';
    const actions =
      mode === 'filtered'
        ? `<div class="monsters-grid__empty-actions">
            <button type="button" class="monsters-toolbar-btn btn-sm" id="monsters-empty-clear-filters">${escapeHtml(t.monstersEmptyClearFilters || 'Clear filters')}</button>
            <button type="button" class="monsters-toolbar-btn btn-sm" id="monsters-empty-reset-search">${escapeHtml(t.monstersEmptyResetSearch || 'Reset search')}</button>
          </div>`
        : '';
    grid.innerHTML =
      '<div class="monsters-grid__empty" role="status">' +
      `<p class="monsters-grid__empty-title">${escapeHtml(title)}</p>` +
      (hint ? `<p class="monsters-grid__empty-hint">${escapeHtml(hint)}</p>` : '') +
      actions +
      '</div>';
    grid.classList.remove('monsters-grid--table', 'monsters-grid--cards');
    grid.classList.add('monsters-grid--empty-state');
  }

  function syncMonstersMinLevelInput(minLevelMin, t) {
    const n = Number(minLevelMin) || 0;
    const inp = document.getElementById('monsters-filter-min-level');
    if (inp) inp.value = n > 0 ? String(n) : '';
    const lbl = document.getElementById('lbl-monsters-filter-min-level');
    if (lbl) lbl.textContent = t.monstersFilterMinLevel || 'Min level';
  }

  function selectAllVisibleMonsters() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    for (const id of monstersVisibleUnitIds) monstersBulkSelected.add(id);
    writeMonstersBulkSelected(monstersBulkSelected);
    syncMonstersBulkBar(t);
    const grid = document.getElementById('monsters-grid');
    if (typeof syncBulkCardStates === 'function') syncBulkCardStates(grid);
    syncMonstersSelectAllState();
  }

  function syncMonstersSelectAllState() {
    const vis = monstersVisibleUnitIds.length;
    let n = 0;
    for (const id of monstersVisibleUnitIds) {
      if (monstersBulkSelected.has(id)) n += 1;
    }
    const state = { checked: vis > 0 && n === vis, indeterminate: n > 0 && n < vis };
    for (const id of ['monsters-table-select-all', 'monsters-grid-select-all']) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.checked = state.checked;
      el.indeterminate = state.indeterminate;
    }
  }

  function bindMonstersGridSelectAll(t) {
    const selAll = document.getElementById('monsters-grid-select-all');
    if (!selAll || selAll.dataset.bound === '1') return;
    selAll.dataset.bound = '1';
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    if (ro) return;
    selAll.addEventListener('change', () => {
      const on = selAll.checked;
      for (const id of monstersVisibleUnitIds) {
        if (on) monstersBulkSelected.add(id);
        else monstersBulkSelected.delete(id);
      }
      writeMonstersBulkSelected(monstersBulkSelected);
      syncMonstersBulkBar(t);
      const grid = document.getElementById('monsters-grid');
      if (typeof syncBulkCardStates === 'function') syncBulkCardStates(grid);
      syncMonstersSelectAllState();
    });
  }

  function syncMonstersViewToggle(view) {
    const grid = document.getElementById('monsters-grid');
    const gridHead = document.getElementById('monsters-grid-head');
    const sortField = document.querySelector('.monsters-toolbar__field--sort');
    if (sortField) sortField.hidden = view === 'table';
    const rosterMeta = document.querySelector('.monsters-roster-meta');
    if (gridHead) gridHead.hidden = view !== 'cards';
    if (rosterMeta) rosterMeta.classList.toggle('monsters-roster-meta--table', view === 'table');
    if (grid) {
      grid.classList.toggle('monsters-grid--table', view === 'table');
      grid.classList.toggle('monsters-grid--cards', view === 'cards');
    }
    const btnCards = document.getElementById('monsters-view-cards');
    const btnTable = document.getElementById('monsters-view-table');
    if (btnCards) {
      btnCards.classList.toggle('monsters-view-btn--active', view === 'cards');
      btnCards.setAttribute('aria-pressed', view === 'cards' ? 'true' : 'false');
    }
    if (btnTable) {
      btnTable.classList.toggle('monsters-view-btn--active', view === 'table');
      btnTable.setAttribute('aria-pressed', view === 'table' ? 'true' : 'false');
    }
  }

  function cancelMonstersDetailHide() {
    if (monstersDetailHideTimer) {
      clearTimeout(monstersDetailHideTimer);
      monstersDetailHideTimer = null;
    }
  }

  function scheduleMonstersDetailHide() {
    if (monstersDetailPinnedUnitId != null) return;
    cancelMonstersDetailHide();
    monstersDetailHideTimer = setTimeout(() => {
      monstersDetailHideTimer = null;
      hideMonstersDetailFloat();
    }, 140);
  }

  function syncMonstersDetailPinnedLayout() {
    const layout = document.getElementById('monsters-layout');
    const aside = document.getElementById('monsters-detail');
    const pinned = monstersDetailPinnedUnitId != null;
    if (layout) layout.classList.remove('monsters-layout--pinned');
    if (!aside) return;
    aside.classList.add('monsters-detail--float');
    aside.classList.remove('monsters-detail--pinned');
    aside.classList.toggle('monsters-detail--locked', pinned);
  }

  function hideMonstersDetailFloat() {
    if (monstersDetailPinnedUnitId != null) return;
    const aside = document.getElementById('monsters-detail');
    if (aside) {
      aside.hidden = true;
      aside.classList.remove('monsters-detail--visible');
      aside.style.removeProperty('left');
      aside.style.removeProperty('top');
    }
    monstersDetailHoverUnitId = null;
    syncMonsterRowHighlight(null);
  }

  function positionMonstersDetailFloat(anchorEl) {
    const aside = document.getElementById('monsters-detail');
    if (!aside || !anchorEl) return;
    aside.hidden = false;
    aside.classList.add('monsters-detail--visible');
    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const pad = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = aside.offsetWidth || 320;
      const h = aside.offsetHeight || 400;
      let left = rect.right + pad;
      let top = rect.top;
      if (left + w > vw - pad) left = rect.left - w - pad;
      if (left < pad) left = Math.max(pad, (vw - w) / 2);
      if (top + h > vh - pad) top = Math.max(pad, vh - h - pad);
      if (top < pad) top = pad;
      aside.style.left = `${Math.round(left)}px`;
      aside.style.top = `${Math.round(top)}px`;
    };
    requestAnimationFrame(() => requestAnimationFrame(place));
  }

  function bindMonstersDetailFloat() {
    const aside = document.getElementById('monsters-detail');
    if (!aside || aside.dataset.floatBound === '1') return;
    aside.dataset.floatBound = '1';
    aside.addEventListener('mouseenter', cancelMonstersDetailHide);
    aside.addEventListener('mouseleave', scheduleMonstersDetailHide);
    const reposition = () => {
      const uid = monstersDetailPinnedUnitId || monstersDetailHoverUnitId;
      if (!uid) return;
      const esc = String(uid).replace(/"/g, '\\"');
      const card =
        document.querySelector(`.monsters-card[data-unit-id="${esc}"]`) ||
        document.querySelector(`.monsters-table__row[data-unit-id="${esc}"]`);
      if (card && !aside.hidden) positionMonstersDetailFloat(card);
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
  }

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
    if (lead) {
      const tpl =
        t.monstersBoxOverviewLead ||
        '{readiness}% of your 6★ have full rune sets · {unruned} without runes · {partial} incomplete · {skill} skill levels to max';
      lead.textContent = tpl
        .replace(/\{readiness\}/g, String(o.readinessPct))
        .replace(/\{unruned\}/g, String(o.unruned))
        .replace(/\{partial\}/g, String(o.partial))
        .replace(/\{skill\}/g, String(o.skillUpsTotal));
    }
    const defs = [
      {
        kind: 'unruned',
        label: t.monstersBoxTileUnruned || 'No runes',
        value: o.unruned,
        hide: o.unruned === 0,
      },
      {
        kind: 'partial',
        label: t.monstersBoxTilePartial || 'Incomplete sets',
        value: o.partial,
        hide: o.partial === 0,
      },
      {
        kind: 'fullSix',
        label: t.monstersBoxTileFullSix || 'Full 6/6',
        value: o.fullSix,
        hide: false,
      },
      {
        kind: 'skill-ups',
        label: t.monstersBoxTileSkillUps || 'Need skill-ups',
        value: o.skillMonsters,
        sub: o.skillUpsTotal > 0 ? `(${o.skillUpsTotal} lv)` : '',
        hide: o.skillMonsters === 0,
      },
      {
        kind: 'storage',
        label: t.monstersBoxTileStorage || 'In storage',
        value: o.storage,
        hide: o.storage === 0,
      },
    ];
    tiles.innerHTML = defs
      .filter((d) => !d.hide)
      .map(
        (d) =>
          `<button type="button" class="monsters-box-tile" data-box-tile="${escapeHtml(d.kind)}" title="${escapeHtml(t.monstersBoxTileHint || 'Show matching monsters')}">
            <span class="monsters-box-tile__value">${escapeHtml(String(d.value))}${d.sub ? `<span class="monsters-box-tile__sub">${escapeHtml(d.sub)}</span>` : ''}</span>
            <span class="monsters-box-tile__label">${escapeHtml(d.label)}</span>
          </button>`,
      )
      .join('');
    bindMonstersBoxOverview();
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

  const SKILL_PLANNER_STORAGE_KEY = 'swrm_skill_planner_exclude_storage_v1';

  let skillPlannerBound = false;
  let skillPlannerNatFilter = 'all';
  let skillPlannerExcludeStorage = true;
  let skillPlannerView = 'queue';
  /** @type {{ col: string, dir: 'asc'|'desc' }|null} */
  let skillPlannerQueueSort = null;
  /** @type {{ col: string, dir: 'asc'|'desc' }|null} */
  let skillPlannerStuckSort = null;
  /** @type {Array<object>} */
  let skillPlannerUnitsCache = [];
  let skillPlannerCdHydrateGen = 0;
  let skillPlannerCdMetaReady = false;
  /** @type {Promise<void>|null} */
  let skillPlannerRenderPromise = null;

  function readSkillPlannerExcludeStorage() {
    try {
      const v = localStorage.getItem(SKILL_PLANNER_STORAGE_KEY);
      if (v === '0' || v === 'false') return false;
      if (v === '1' || v === 'true') return true;
    } catch (e) { /* ignore */ }
    return true;
  }

  function writeSkillPlannerExcludeStorage(on) {
    try {
      localStorage.setItem(SKILL_PLANNER_STORAGE_KEY, on ? '1' : '0');
    } catch (e) { /* ignore */ }
  }

  function syncSkillPlannerExcludeStorageButton(t) {
    const btn = document.getElementById('skill-planner-exclude-storage');
    if (!btn) return;
    const hiding = !!skillPlannerExcludeStorage;
    btn.classList.toggle('is-active', hiding);
    btn.setAttribute('aria-pressed', hiding ? 'true' : 'false');
    const lbl = document.getElementById('lbl-skill-planner-exclude-storage');
    if (lbl) {
      lbl.textContent = hiding
        ? t.skillPlannerShowStorage || 'Include Storage'
        : t.skillPlannerHideStorage || 'Exclude Storage';
    }
  }

  function showSkillPlannerView(view) {
    const id = view === 'stuck' ? 'stuck' : 'queue';
    skillPlannerView = id;
    document.querySelectorAll('.skill-planner__tab').forEach((btn) => {
      const on = btn.dataset.plannerView === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.skill-planner__panel').forEach((pane) => {
      const on = pane.id === `skill-planner-panel-${id}`;
      pane.classList.toggle('is-active', on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });
    if (id === 'stuck') void paintSkillPlannerCdPanel();
  }

  function syncSkillPlannerCdTabLabel(stats, t) {
    const stuckTab = document.getElementById('skill-planner-tab-stuck');
    if (!stuckTab) return;
    const stuckLbl = t.skillPlannerTabStuck || 'Cooldown hunt';
    const count = stats && stats.stuckRows > 0 ? ` (${stats.stuckRows})` : '';
    const label = stuckTab.querySelector('.rules-subtab__label');
    if (label) label.textContent = stuckLbl + count;
  }

  function paintSkillPlannerQueue(rosterUnits, t) {
    const queueWrap = document.getElementById('skill-planner-queue');
    const emptyEl = document.getElementById('skill-planner-empty');
    const skillDb = window.SWRM_SKILL_DB;
    if (!queueWrap) return;
    const noData = !rosterUnits.length;
    const stats = computeSkillPlannerStats(rosterUnits);
    const noUps = !noData && stats.skillUpsTotal === 0;
    if (emptyEl) {
      emptyEl.hidden = !noData && !noUps;
      emptyEl.textContent = noData
        ? t.skillPlannerEmptyNoData || 'Load your export first (Runes tab).'
        : t.skillPlannerEmptyMaxed || 'All tracked monsters have maxed skills.';
    }
    if (noData || noUps) {
      queueWrap.innerHTML = '';
      return;
    }
    const needing = sortPlannerQueue(
      rosterUnits.filter((u) => (u.skillUpsNeeded || 0) > 0 && plannerPassesNatFilter(u)),
    );
    queueWrap.innerHTML = `<table class="skill-planner__table swrm-table-zebra"><caption class="sr-only">${escapeHtml(t.skillPlannerQueueTitle || 'Priority queue')}</caption>${skillPlannerQueueHeadHtml(t)}<tbody>${needing.map((u) => skillPlannerQueueRowHtml(u, skillDb, t)).join('')}</tbody></table>`;
  }

  function paintSkillPlannerCdTable(rosterUnits, t) {
    const stuckWrap = document.getElementById('skill-planner-stuck');
    const skillDb = window.SWRM_SKILL_DB;
    if (!stuckWrap) return;
    const stuckEntries = sortPlannerStuck(
      plannerCooldownGapEntries(rosterUnits.filter((u) => plannerPassesNatFilter(u))),
    );
    if (!stuckEntries.length) {
      stuckWrap.innerHTML = `<p class="skill-planner__stuck-empty">${escapeHtml(t.skillPlannerCdEmpty || t.skillPlannerStuckEmpty || 'No cooldown hunts right now.')}</p>`;
    } else {
      stuckWrap.innerHTML = `<table class="skill-planner__table skill-planner__table--stuck swrm-table-zebra"><caption class="sr-only">${escapeHtml(t.skillPlannerCdTitle || t.skillPlannerStuckTitle || 'Cooldown hunt')}</caption>${skillPlannerStuckHeadHtml(t)}<tbody>${stuckEntries.map((e) => skillPlannerStuckRowHtml(e, skillDb, t)).join('')}</tbody></table>`;
    }
    const root = document.getElementById('skill-planner-root');
    if (root) bindSkillPlannerPortraits(root);
  }

  async function ensureSkillPlannerCdReady(units) {
    const skillDb = window.SWRM_SKILL_DB;
    if (!skillDb) return units.map((u) => refreshUnitSkillRows(u));
    await skillDb.loadSkillIndex();
    if (typeof skillDb.hasBundledSkillMeta === 'function' && skillDb.hasBundledSkillMeta()) {
      skillPlannerCdMetaReady = true;
      return units.map((u) => refreshUnitSkillRows(u));
    }
    if (!skillPlannerCdMetaReady) {
      return hydratePlannerCdMeta(units);
    }
    return units.map((u) => refreshUnitSkillRows(u));
  }

  async function paintSkillPlannerCdPanel() {
    const stuckWrap = document.getElementById('skill-planner-stuck');
    if (!stuckWrap || skillPlannerView !== 'stuck') return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let units = skillPlannerUnitsCache;

    if (!units.length && skillPlannerRenderPromise) {
      stuckWrap.innerHTML = `<p class="skill-planner__loading" role="status">${escapeHtml(t.skillPlannerCdLoading || 'Loading…')}</p>`;
      await skillPlannerRenderPromise;
      units = skillPlannerUnitsCache;
    }

    if (!units.length) {
      stuckWrap.innerHTML = '';
      return;
    }

    stuckWrap.innerHTML = `<p class="skill-planner__loading" role="status">${escapeHtml(t.skillPlannerCdLoading || 'Loading Cooltime Turn data…')}</p>`;
    const updated = await ensureSkillPlannerCdReady(units);
    if (skillPlannerView !== 'stuck') return;

    skillPlannerUnitsCache = updated;
    const stats = computeSkillPlannerStats(updated);
    syncSkillPlannerCdTabLabel(stats, t);
    const summary = document.getElementById('skill-planner-summary');
    if (summary) summary.innerHTML = skillPlannerSummaryHtml(stats, t);
    paintSkillPlannerCdTable(updated, t);
  }

  function schedulePlannerCdMetaBackground(units) {
    const skillDb = window.SWRM_SKILL_DB;
    if (skillDb && typeof skillDb.hasBundledSkillMeta === 'function' && skillDb.hasBundledSkillMeta()) {
      skillPlannerCdMetaReady = true;
      skillPlannerUnitsCache = units.map((u) => refreshUnitSkillRows(u));
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const stats = computeSkillPlannerStats(skillPlannerUnitsCache);
      syncSkillPlannerCdTabLabel(stats, t);
      const summary = document.getElementById('skill-planner-summary');
      if (summary) summary.innerHTML = skillPlannerSummaryHtml(stats, t);
      if (skillPlannerView === 'stuck') paintSkillPlannerCdTable(skillPlannerUnitsCache, t);
      return;
    }
    void hydratePlannerCdMeta(units).then((updated) => {
      skillPlannerUnitsCache = updated;
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const stats = computeSkillPlannerStats(updated);
      syncSkillPlannerCdTabLabel(stats, t);
      const summary = document.getElementById('skill-planner-summary');
      if (summary) summary.innerHTML = skillPlannerSummaryHtml(stats, t);
      if (skillPlannerView === 'stuck') paintSkillPlannerCdTable(updated, t);
    });
  }

  function plannerNaturalStars(u) {
    const n = u.meta && Number(u.meta.natural_stars);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  function plannerUnitLevelsToMax(u) {
    const lvl = Number(u.level);
    const max = Number(u.maxLevel);
    if (!Number.isFinite(lvl) || !Number.isFinite(max) || max <= lvl) return 0;
    return max - lvl;
  }

  function unitSkillsSource(u) {
    if (Array.isArray(u.skills) && u.skills.length) return u.skills;
    return (u.skillRows || [])
      .filter((s) => s && Number.isFinite(Number(s.skillId)))
      .map((s) => ({ skillId: s.skillId, level: s.level }));
  }

  function refreshUnitSkillRows(u) {
    const skillDb = window.SWRM_SKILL_DB;
    const skills = unitSkillsSource(u);
    if (!skillDb || typeof skillDb.enrichUnitSkills !== 'function' || !skills.length) return u;
    const pack = skillDb.enrichUnitSkills(skills);
    return {
      ...u,
      skillRows: pack.skills,
      skillUpsNeeded: pack.skillUpsNeeded,
      skillsMaxed: pack.skillsMaxed,
      skillsKnown: pack.skillsKnown,
    };
  }

  /** SWARFARM meta only for skills that may still need CD−1 (not whole roster). */
  async function hydratePlannerCdMeta(units) {
    const skillDb = window.SWRM_SKILL_DB;
    if (!skillDb || typeof skillDb.hydrateSkillMetaBatch !== 'function') {
      return units.map((u) => refreshUnitSkillRows(u));
    }
    const gen = ++skillPlannerCdHydrateGen;
    const ids = [];
    for (const u of units) {
      if ((u.skillUpsNeeded || 0) <= 0) continue;
      for (const s of u.skillRows || []) {
        if ((s.deficit || 0) > 0 && s.skillId) ids.push(s.skillId);
      }
    }
    const uniq = [...new Set(ids.map(Number).filter(Number.isFinite))];
    if (uniq.length) {
      await skillDb.hydrateSkillMetaBatch(uniq, { pauseMs: 60, batchSize: 12 });
    }
    if (gen !== skillPlannerCdHydrateGen) return units;
    skillPlannerCdMetaReady = true;
    return units.map((u) => refreshUnitSkillRows(u));
  }

  function plannerCooldownGapEntries(units) {
    const out = [];
    for (const u of units) {
      for (const s of u.skillRows || []) {
        if ((s.deficitToCooldown || 0) > 0) {
          out.push({ u, s });
        }
      }
    }
    return out;
  }

  function devilmonIconUrl() {
    const db = window.SWRM_MONSTER_DB;
    return db && typeof db.devilmonImageUrl === 'function' ? db.devilmonImageUrl() : '';
  }

  function plannerComparePriority(a, b) {
    const nat = plannerNaturalStars(b) - plannerNaturalStars(a);
    if (nat !== 0) return nat;
    const ups = (b.skillUpsNeeded || 0) - (a.skillUpsNeeded || 0);
    if (ups !== 0) return ups;
    const lv = plannerUnitLevelsToMax(b) - plannerUnitLevelsToMax(a);
    if (lv !== 0) return lv;
    return String(a.displayName || '').localeCompare(String(b.displayName || ''));
  }

  function plannerPassesNatFilter(u) {
    const nat = plannerNaturalStars(u);
    if (skillPlannerNatFilter === 'nat5') return nat >= 5;
    if (skillPlannerNatFilter === 'nat4') return nat === 4;
    if (skillPlannerNatFilter === 'nat3') return nat === 3;
    if (skillPlannerNatFilter === 'nat4plus') return nat >= 4;
    return true;
  }

  function filterPlannerRosterUnits(units) {
    return (units || []).filter((u) => {
      if (typeof isTechnicalFodderMonster === 'function' && isTechnicalFodderMonster(u)) return false;
      if (skillPlannerExcludeStorage && u.inStorage) return false;
      return true;
    });
  }

  function plannerSortIcon(col, table) {
    const sort = table === 'stuck' ? skillPlannerStuckSort : skillPlannerQueueSort;
    if (!sort || sort.col !== col) {
      return '<span class="skill-planner__sort-icon" aria-hidden="true">↕</span>';
    }
    return `<span class="skill-planner__sort-icon" aria-hidden="true">${sort.dir === 'asc' ? '▲' : '▼'}</span>`;
  }

  function cycleSkillPlannerSort(table, col) {
    const cur = table === 'stuck' ? skillPlannerStuckSort : skillPlannerQueueSort;
    if (!cur || cur.col !== col) {
      const next = { col, dir: 'desc' };
      if (table === 'stuck') skillPlannerStuckSort = next;
      else skillPlannerQueueSort = next;
      return;
    }
    cur.dir = cur.dir === 'desc' ? 'asc' : 'desc';
  }

  function comparePlannerQueueRows(a, b, col, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    switch (col) {
      case 'nat':
        return mul * (plannerNaturalStars(a) - plannerNaturalStars(b)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      case 'ups':
        return (
          mul * ((Number(a.skillUpsNeeded) || 0) - (Number(b.skillUpsNeeded) || 0)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'level':
        return (
          mul * (plannerUnitLevelsToMax(a) - plannerUnitLevelsToMax(b)) ||
          mul * ((Number(a.level) || 0) - (Number(b.level) || 0)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'name':
      default:
        return mul * String(a.displayName || '').localeCompare(String(b.displayName || ''));
    }
  }

  function comparePlannerStuckRows(a, b, col, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    const ua = a.u;
    const ub = b.u;
    const sa = a.s;
    const sb = b.s;
    switch (col) {
      case 'nat':
        return mul * (plannerNaturalStars(ua) - plannerNaturalStars(ub)) || comparePlannerStuckRows(a, b, 'name', dir);
      case 'skill':
        return (
          mul * String((sa.skillName || '') + sa.skillId).localeCompare(String((sb.skillName || '') + sb.skillId)) ||
          comparePlannerStuckRows(a, b, 'name', dir)
        );
      case 'target':
        return (
          mul * ((Number(sa.cooldownUnlockLevel) || 0) - (Number(sb.cooldownUnlockLevel) || 0)) ||
          comparePlannerStuckRows(a, b, 'name', dir)
        );
      case 'deficit':
        return (
          mul * ((Number(sa.deficitToCooldown) || 0) - (Number(sb.deficitToCooldown) || 0)) ||
          comparePlannerStuckRows(a, b, 'name', dir)
        );
      case 'name':
      default:
        return (
          mul * String(ua.displayName || '').localeCompare(String(ub.displayName || '')) ||
          mul * ((sa.slot || 0) - (sb.slot || 0))
        );
    }
  }

  function sortPlannerQueue(units) {
    const list = units.slice();
    if (!skillPlannerQueueSort) {
      list.sort(plannerComparePriority);
      return list;
    }
    const { col, dir } = skillPlannerQueueSort;
    list.sort((a, b) => comparePlannerQueueRows(a, b, col, dir));
    return list;
  }

  function sortPlannerStuck(entries) {
    const list = entries.slice();
    if (!skillPlannerStuckSort) {
      list.sort((a, b) => {
        const c = plannerComparePriority(a.u, b.u);
        if (c !== 0) return c;
        return (a.s.slot || 0) - (b.s.slot || 0);
      });
      return list;
    }
    const { col, dir } = skillPlannerStuckSort;
    list.sort((a, b) => comparePlannerStuckRows(a, b, col, dir));
    return list;
  }

  async function getMonstersEnrichedForPlanner() {
    if (monstersEnrichedCache && monstersEnrichedCache.length) {
      const skillDb = window.SWRM_SKILL_DB;
      if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
        try {
          await skillDb.loadSkillIndex();
          if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
        } catch (e) { /* ignore */ }
      }
      return monstersEnrichedCache.map((u) => refreshUnitSkillRows(u));
    }
    if (!allUnits.length) {
      const loaded = await ensureMonstersDataset();
      if (!loaded || !allUnits.length) return [];
    }
    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (db.indexCount() === 0) await db.loadMonsterIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
      try {
        await skillDb.loadSkillIndex();
        if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    return allUnits.map((u) => {
      const meta = db ? db.lookupMonster(u.masterId) : null;
      const tags = unitMetaFor(u.unitId);
      const skillPack = skillDb
        ? skillDb.enrichUnitSkills(u.skills)
        : { skills: [], skillUpsNeeded: 0, skillsMaxed: true, skillsKnown: false };
      return {
        ...u,
        meta,
        metaElement: meta && meta.element ? meta.element : '',
        displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
        imageFilename: meta && meta.image_filename ? meta.image_filename : '',
        naturalStars: meta && Number(meta.natural_stars) > 0 ? Number(meta.natural_stars) : 0,
        skillRows: skillPack.skills,
        skillUpsNeeded: skillPack.skillUpsNeeded,
        skillsMaxed: skillPack.skillsMaxed,
        skillsKnown: skillPack.skillsKnown,
        unitLevelsToMax: plannerUnitLevelsToMax(u),
        favorite: tags.favorite,
        food: tags.food,
        storageMark: tags.storageMark,
        customTags: tags.tags,
      };
    });
  }

  function computeSkillPlannerStats(units) {
    const stats = {
      monstersNeeding: 0,
      skillUpsTotal: 0,
      nat5Monsters: 0,
      nat5Ups: 0,
      nat4Monsters: 0,
      nat4Ups: 0,
      otherUps: 0,
      stuckRows: 0,
      unitLevelsTotal: 0,
      monstersBelowMaxLevel: 0,
    };
    for (const u of units) {
      const ups = u.skillUpsNeeded || 0;
      const nat = plannerNaturalStars(u);
      const lvGap = plannerUnitLevelsToMax(u);
      if (lvGap > 0) {
        stats.monstersBelowMaxLevel += 1;
        stats.unitLevelsTotal += lvGap;
      }
      if (ups <= 0) continue;
      stats.monstersNeeding += 1;
      stats.skillUpsTotal += ups;
      if (nat >= 5) {
        stats.nat5Monsters += 1;
        stats.nat5Ups += ups;
      } else if (nat === 4) {
        stats.nat4Monsters += 1;
        stats.nat4Ups += ups;
      } else {
        stats.otherUps += ups;
      }
      for (const s of u.skillRows || []) {
        if ((s.deficitToCooldown || 0) > 0) stats.stuckRows += 1;
      }
    }
    return stats;
  }

  function skillPlannerSummaryHtml(stats, t) {
    const cards = [
      {
        key: 'total',
        value: stats.skillUpsTotal,
        label: t.skillPlannerCardTotal || 'Skill levels to max',
        sub:
          stats.monstersNeeding > 0
            ? (t.skillPlannerCardTotalSub || '{n} monsters').replace('{n}', String(stats.monstersNeeding))
            : '',
      },
      {
        key: 'nat5',
        value: stats.nat5Ups,
        label: t.skillPlannerCardNat5 || 'Nat 5 debt',
        sub:
          stats.nat5Monsters > 0
            ? (t.skillPlannerCardNat5Sub || '{n} monsters').replace('{n}', String(stats.nat5Monsters))
            : '',
      },
      {
        key: 'nat4',
        value: stats.nat4Ups,
        label: t.skillPlannerCardNat4 || 'Nat 4 debt',
        sub:
          stats.nat4Monsters > 0
            ? (t.skillPlannerCardNat4Sub || '{n} monsters').replace('{n}', String(stats.nat4Monsters))
            : '',
      },
      {
        key: 'stuck',
        value: stats.stuckRows,
        label: t.skillPlannerCardCd || 'CD −1 gaps',
        sub: t.skillPlannerCardCdSub || 'Skills missing CD upgrade',
        tab: 'stuck',
      },
      {
        key: 'level',
        value: stats.unitLevelsTotal,
        label: t.skillPlannerCardLevel || 'Monster levels to max',
        sub:
          stats.monstersBelowMaxLevel > 0
            ? (t.skillPlannerCardLevelSub || '{n} below max').replace('{n}', String(stats.monstersBelowMaxLevel))
            : '',
      },
    ];
    return cards
      .map((c) => {
        const tabAttr = c.tab ? ` data-planner-goto-tab="${c.tab}" role="button" tabindex="0"` : '';
        const cls = c.tab ? ' skill-planner__card--clickable' : '';
        return `<div class="skill-planner__card${cls}" data-planner-card="${c.key}"${tabAttr}>
            <span class="skill-planner__card-value">${escapeHtml(String(c.value))}</span>
            <span class="skill-planner__card-label">${escapeHtml(c.label)}</span>
            ${c.sub ? `<span class="skill-planner__card-sub">${escapeHtml(c.sub)}</span>` : ''}
          </div>`;
      })
      .join('');
  }

  function skillPlannerSkillChipHtml(s, skillDb) {
    const label =
      skillDb && typeof skillDb.formatSkillLevelDetail === 'function'
        ? skillDb.formatSkillLevelDetail(s)
        : `${s.level}/${s.maxLevel}`;
    const url =
      skillDb && typeof skillDb.skillIconUrl === 'function' ? skillDb.skillIconUrl(s.skillId) : '';
    const fb =
      skillDb && typeof skillDb.skillIconFallbackUrl === 'function'
        ? skillDb.skillIconFallbackUrl(s.skillId)
        : '';
    const cdCls = (s.deficitToCooldown || 0) > 0 ? ' skill-planner__skill-chip--cd' : '';
    const fbAttr = fb ? ` data-fallback="${escapeHtml(fb)}"` : '';
    const img = url
      ? `<img class="skill-planner__skill-chip-icon" src="${escapeHtml(url)}"${fbAttr} alt="" width="28" height="28" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="var f=this.dataset.fallback;if(f){this.src=f;this.removeAttribute('data-fallback');}else{this.classList.add('is-broken');}" />`
      : '<span class="skill-planner__skill-chip-icon skill-planner__skill-chip-icon--empty" aria-hidden="true"></span>';
    return `<span class="skill-planner__skill-chip${cdCls}" data-skill-id="${escapeHtml(String(s.skillId))}" data-skill-level="${escapeHtml(String(s.level))}" tabindex="0">${img}<span class="skill-planner__skill-chip-lv">${escapeHtml(label)}</span></span>`;
  }

  function skillPlannerSkillsCell(u, skillDb) {
    const rows = (u.skillRows || []).filter((s) => s.deficit > 0);
    if (!rows.length) return '—';
    return `<div class="skill-planner__skill-chips">${rows.map((s) => skillPlannerSkillChipHtml(s, skillDb)).join('')}</div>`;
  }

  function skillPlannerUpsCell(u, t) {
    const n = u.skillUpsNeeded || 0;
    const dUrl = devilmonIconUrl();
    const img = dUrl
      ? `<img class="skill-planner__devilmon" src="${escapeHtml(dUrl)}" alt="" width="22" height="22" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : '';
    const tip = escapeHtml(t.skillPlannerUpsTip || 'Skill levels still needed (≈ devilmon uses)');
    return `<span class="skill-planner__ups-cell" title="${tip}">${img}<strong>${escapeHtml(String(n))}</strong></span>`;
  }

  function skillPlannerQueueHeadHtml(t) {
    const sort = skillPlannerQueueSort;
    const th = (col, labelKey, fallback) => {
      const label = t[labelKey] || fallback;
      const sorted = sort && sort.col === col;
      const ariaSort = sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="skill-planner__th--sortable${sorted ? ' skill-planner__th--sorted' : ''}" data-sort-table="queue" data-sort-col="${col}" aria-sort="${ariaSort}"><span class="skill-planner__th-inner">${escapeHtml(label)}${plannerSortIcon(col, 'queue')}</span></th>`;
    };
    return `<thead><tr>
      ${th('name', 'skillPlannerColMonster', 'Monster')}
      ${th('nat', 'skillPlannerColNat', 'Natural')}
      ${th('ups', 'skillPlannerColUps', 'Levels needed')}
      <th scope="col">${escapeHtml(t.skillPlannerColSkills || 'Skills')}</th>
      ${th('level', 'skillPlannerColUnitLv', 'Monster level')}
      <th scope="col" class="skill-planner__th--action">${escapeHtml(t.skillPlannerColAction || '')}</th>
    </tr></thead>`;
  }

  function skillPlannerStuckHeadHtml(t) {
    const sort = skillPlannerStuckSort;
    const th = (col, labelKey, fallback) => {
      const label = t[labelKey] || fallback;
      const sorted = sort && sort.col === col;
      const ariaSort = sorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="skill-planner__th--sortable${sorted ? ' skill-planner__th--sorted' : ''}" data-sort-table="stuck" data-sort-col="${col}" aria-sort="${ariaSort}"><span class="skill-planner__th-inner">${escapeHtml(label)}${plannerSortIcon(col, 'stuck')}</span></th>`;
    };
    return `<thead><tr>
      ${th('name', 'skillPlannerColMonster', 'Monster')}
      ${th('nat', 'skillPlannerColNat', 'Natural')}
      ${th('skill', 'skillPlannerColCdSkill', 'Skill')}
      ${th('target', 'skillPlannerColCdTarget', 'Target level')}
      ${th('deficit', 'skillPlannerColDeficit', 'Skill-ups needed')}
      <th scope="col" class="skill-planner__th--action"></th>
    </tr></thead>`;
  }

  function skillPlannerQueueRowHtml(u, skillDb, t) {
    const nat = plannerNaturalStars(u);
    const natLbl = nat > 0 ? `Nat ${nat}` : '—';
    const lvGap = plannerUnitLevelsToMax(u);
    const lvTxt =
      lvGap > 0
        ? `${u.level}/${u.maxLevel} (+${lvGap})`
        : `${u.level}/${u.maxLevel}`;
    const thumb = u.imageFilename
      ? `<img class="skill-planner__thumb" alt="" width="36" height="36" data-img-file="${escapeHtml(u.imageFilename)}" loading="lazy" decoding="async" />`
      : '<span class="skill-planner__thumb skill-planner__thumb--empty" aria-hidden="true"></span>';
    const openLbl = escapeHtml(t.skillPlannerOpenMonster || 'Open in Roster');
    return `<tr class="skill-planner__row" data-unit-id="${escapeHtml(String(u.unitId))}">
      <td class="skill-planner__td skill-planner__td--monster">
        <button type="button" class="skill-planner__monster-btn" data-planner-open="${escapeHtml(String(u.unitId))}">
          ${thumb}
          <span class="skill-planner__monster-name">${escapeHtml(u.displayName || '')}</span>
        </button>
      </td>
      <td class="skill-planner__td skill-planner__td--nat">${escapeHtml(natLbl)}</td>
      <td class="skill-planner__td skill-planner__td--ups">${skillPlannerUpsCell(u, t)}</td>
      <td class="skill-planner__td skill-planner__td--skills">${skillPlannerSkillsCell(u, skillDb)}</td>
      <td class="skill-planner__td skill-planner__td--level">${escapeHtml(lvTxt)}</td>
      <td class="skill-planner__td skill-planner__td--act">
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm" data-planner-open="${escapeHtml(String(u.unitId))}">${openLbl}</button>
      </td>
    </tr>`;
  }

  function skillPlannerStuckRowHtml(entry, skillDb, t) {
    const { u, s } = entry;
    const nat = plannerNaturalStars(u);
    const natLbl = nat > 0 ? `Nat ${nat}` : '—';
    const thumb = u.imageFilename
      ? `<img class="skill-planner__thumb" alt="" width="36" height="36" data-img-file="${escapeHtml(u.imageFilename)}" loading="lazy" decoding="async" />`
      : '<span class="skill-planner__thumb skill-planner__thumb--empty" aria-hidden="true"></span>';
    const openLbl = escapeHtml(t.skillPlannerOpenMonster || 'Open in Roster');
    const cdLv = s.cooldownUnlockLevel != null ? s.cooldownUnlockLevel : '—';
    const targetTxt = (t.skillPlannerCdTarget || 'Lv {cur} → {goal}')
      .replace('{cur}', String(s.level))
      .replace('{goal}', String(cdLv));
    const skillName = s.skillName ? `<span class="skill-planner__cd-skill-name">${escapeHtml(s.skillName)}</span>` : '';
    return `<tr class="skill-planner__row skill-planner__row--stuck" data-unit-id="${escapeHtml(String(u.unitId))}">
      <td class="skill-planner__td skill-planner__td--monster">
        <button type="button" class="skill-planner__monster-btn" data-planner-open="${escapeHtml(String(u.unitId))}">
          ${thumb}
          <span class="skill-planner__monster-name">${escapeHtml(u.displayName || '')}</span>
        </button>
      </td>
      <td class="skill-planner__td skill-planner__td--nat">${escapeHtml(natLbl)}</td>
      <td class="skill-planner__td skill-planner__td--skills"><div class="skill-planner__cd-skill">${skillPlannerSkillChipHtml(s, skillDb)}${skillName}</div></td>
      <td class="skill-planner__td">${escapeHtml(targetTxt)}</td>
      <td class="skill-planner__td"><strong>+${escapeHtml(String(s.deficitToCooldown || 0))}</strong></td>
      <td class="skill-planner__td skill-planner__td--act"><button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm" data-planner-open="${escapeHtml(String(u.unitId))}">${openLbl}</button></td>
    </tr>`;
  }

  function applySkillPlannerChipTip(chip, skillDb) {
    if (!chip || !skillDb || typeof setSwrmFloatTipTarget !== 'function') return;
    const skillId = Number(chip.getAttribute('data-skill-id'));
    const level = Number(chip.getAttribute('data-skill-level'));
    if (!Number.isFinite(skillId)) return;
    const text =
      typeof skillDb.formatSkillProgressTooltip === 'function'
        ? skillDb.formatSkillProgressTooltip(skillId, level)
        : '';
    const html =
      typeof skillDb.formatSkillProgressTooltipHtml === 'function'
        ? skillDb.formatSkillProgressTooltipHtml(skillId, level)
        : '';
    if (html) {
      setSwrmFloatTipTarget(chip, '', { html });
      chip.setAttribute('aria-label', text || '');
    } else if (text) {
      setSwrmFloatTipTarget(chip, text);
      chip.setAttribute('aria-label', text);
    }
  }

  function bindSkillPlannerSkillTips(root) {
    if (!root) return;
    const skillDb = window.SWRM_SKILL_DB;
    const chips = root.querySelectorAll('.skill-planner__skill-chip[data-skill-id]');
    if (!chips.length) return;
    void (async () => {
      if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
        try {
          await skillDb.loadSkillIndex();
        } catch (e) { /* ignore */ }
      }
      chips.forEach((chip) => {
        if (!chip.isConnected) return;
        applySkillPlannerChipTip(chip, skillDb);
      });
    })();
  }

  function bindSkillPlannerPortraits(root) {
    if (!root) return;
    root.querySelectorAll('.skill-planner__thumb[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file && typeof bindMonsterPortrait === 'function') bindMonsterPortrait(img, file);
    });
    bindSkillPlannerSkillTips(root);
  }

  function openMonsterFromSkillPlanner(unitId) {
    const uid = unitId != null ? String(unitId) : '';
    if (!uid) return;
    if (typeof saveMonstersSelectedUnitId === 'function') saveMonstersSelectedUnitId(uid);
    monstersSelectedUnitId = uid;
    if (typeof showMainTab === 'function') {
      showMainTab('monsters', { monstersSubtab: 'roster', writeHash: true });
    }
    window.setTimeout(() => {
      if (typeof renderMonstersPanel === 'function') void renderMonstersPanel();
      window.setTimeout(() => {
        const esc =
          typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
            ? CSS.escape(uid)
            : uid.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        const node = document.querySelector(
          `.monsters-card[data-unit-id="${esc}"], .monsters-table__row[data-unit-id="${esc}"]`,
        );
        if (node) node.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        if (typeof showMonsterDetailForCard === 'function') {
          showMonsterDetailForCard(uid, node || null, { pin: true });
        }
      }, 80);
    }, 40);
  }

  function bindSkillPlannerPanel(root) {
    if (!root || skillPlannerBound) return;
    skillPlannerBound = true;
    skillPlannerExcludeStorage = readSkillPlannerExcludeStorage();

    root.addEventListener('click', (ev) => {
      const sortTh = ev.target.closest('[data-sort-col][data-sort-table]');
      if (sortTh) {
        ev.preventDefault();
        cycleSkillPlannerSort(sortTh.getAttribute('data-sort-table'), sortTh.getAttribute('data-sort-col'));
        void renderSkillPlannerPanel();
        return;
      }
      const tabBtn = ev.target.closest('[data-planner-view]');
      if (tabBtn && tabBtn.classList.contains('skill-planner__tab')) {
        showSkillPlannerView(tabBtn.getAttribute('data-planner-view'));
        return;
      }
      const gotoTab = ev.target.closest('[data-planner-goto-tab]');
      if (gotoTab) {
        showSkillPlannerView(gotoTab.getAttribute('data-planner-goto-tab'));
        return;
      }
      const btn = ev.target.closest('[data-planner-open]');
      if (btn) {
        ev.preventDefault();
        openMonsterFromSkillPlanner(btn.getAttribute('data-planner-open'));
      }
    });

    root.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const card = ev.target.closest('[data-planner-goto-tab]');
      if (!card) return;
      ev.preventDefault();
      showSkillPlannerView(card.getAttribute('data-planner-goto-tab'));
    });

    const natSel = document.getElementById('skill-planner-nat-filter');
    if (natSel) {
      natSel.addEventListener('change', () => {
        skillPlannerNatFilter = natSel.value || 'all';
        void renderSkillPlannerPanel();
      });
    }

    const storageBtn = document.getElementById('skill-planner-exclude-storage');
    if (storageBtn) {
      storageBtn.addEventListener('click', () => {
        skillPlannerExcludeStorage = !skillPlannerExcludeStorage;
        writeSkillPlannerExcludeStorage(skillPlannerExcludeStorage);
        const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        syncSkillPlannerExcludeStorageButton(t);
        void renderSkillPlannerPanel();
      });
    }

    document.querySelectorAll('.skill-planner__tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const v = btn.getAttribute('data-planner-view');
        if (v) showSkillPlannerView(v);
      });
    });
  }

  async function renderSkillPlannerPanel() {
    const root = document.getElementById('skill-planner-root');
    const summary = document.getElementById('skill-planner-summary');
    const queueWrap = document.getElementById('skill-planner-queue');
    const stuckWrap = document.getElementById('skill-planner-stuck');
    const emptyEl = document.getElementById('skill-planner-empty');
    if (!root || !summary || !queueWrap || !stuckWrap) return;

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    bindSkillPlannerPanel(root);
    syncSkillPlannerExcludeStorageButton(t);
    showSkillPlannerView(skillPlannerView);

    const tabsNav = document.getElementById('skill-planner-view-tabs');
    if (tabsNav) tabsNav.setAttribute('aria-label', t.skillPlannerTabsAria || 'Skill plan views');

    const natSel = document.getElementById('skill-planner-nat-filter');
    if (natSel && natSel.value !== skillPlannerNatFilter) natSel.value = skillPlannerNatFilter;

    const renderTask = (async () => {
      const skillDb = window.SWRM_SKILL_DB;
      if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
        try {
          await skillDb.loadSkillIndex();
        } catch (e) { /* ignore */ }
      }

      const bundled =
        skillDb &&
        typeof skillDb.hasBundledSkillMeta === 'function' &&
        skillDb.hasBundledSkillMeta();

      if (!bundled) {
        skillPlannerCdMetaReady = false;
        skillPlannerCdHydrateGen += 1;
      }

      let allEnriched = await getMonstersEnrichedForPlanner();
      let rosterUnits = filterPlannerRosterUnits(allEnriched);
      if (bundled) {
        rosterUnits = rosterUnits.map((u) => refreshUnitSkillRows(u));
        skillPlannerCdMetaReady = true;
      }
      skillPlannerUnitsCache = rosterUnits;

      const stats = computeSkillPlannerStats(rosterUnits);
      summary.innerHTML = skillPlannerSummaryHtml(stats, t);
      syncSkillPlannerCdTabLabel(stats, t);

      if (!rosterUnits.length) {
        queueWrap.innerHTML = '';
        stuckWrap.innerHTML = '';
        return;
      }

      paintSkillPlannerQueue(rosterUnits, t);
      if (skillPlannerView === 'stuck') {
        void paintSkillPlannerCdPanel();
      } else {
        stuckWrap.innerHTML = '';
      }

      bindSkillPlannerPortraits(root);
      schedulePlannerCdMetaBackground(rosterUnits);
    })();

    skillPlannerRenderPromise = renderTask;
    try {
      await renderTask;
    } finally {
      if (skillPlannerRenderPromise === renderTask) skillPlannerRenderPromise = null;
    }
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.computeSkillPlannerStats = computeSkillPlannerStats;
  window.SWRM.filterPlannerRosterUnits = filterPlannerRosterUnits;

  skillPlannerExcludeStorage = readSkillPlannerExcludeStorage();

  function gearEffectLines(gear, t) {
    const lines = [];
    const fmtPri =
      window.SWRM && typeof window.SWRM.formatGearEffectLine === 'function'
        ? window.SWRM.formatGearEffectLine
        : null;
    const fmtSub =
      window.SWRM && typeof window.SWRM.formatArtifactSubLine === 'function'
        ? window.SWRM.formatArtifactSubLine
        : null;
    const fmtRelicSec =
      window.SWRM && typeof window.SWRM.formatRelicSecLine === 'function'
        ? window.SWRM.formatRelicSecLine
        : null;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    if (gear.pri && fmtPri) {
      const line = fmtPri(gear.pri, { kind: gear.kind });
      if (line) lines.push(line);
    }
    if (gear.kind === 'relic') {
      if (fmtRelicSec) {
        const line = fmtRelicSec(gear);
        if (line) lines.push(line);
      }
      if (fmtDur) lines.push(`${t.monstersGearDurability || 'Durability'} ${fmtDur(gear)}`);
      if (gear.level) lines.push(`+${gear.level}`);
    }
    if (gear.kind === 'artifact' && gear.secs && gear.secs.length && fmtSub) {
      for (const s of gear.secs) {
        const line = fmtSub(s);
        if (line) lines.push(line);
      }
    }
    return lines;
  }

  function buildArtifactEffectStack(gear, t) {
    const fmtPri =
      window.SWRM && typeof window.SWRM.formatGearEffectLine === 'function'
        ? window.SWRM.formatGearEffectLine
        : null;
    const fmtSub =
      window.SWRM && typeof window.SWRM.formatArtifactSubLine === 'function'
        ? window.SWRM.formatArtifactSubLine
        : null;
    const lines = [];
    if (gear.pri && fmtPri) {
      const line = fmtPri(gear.pri, { kind: 'artifact' });
      if (line) lines.push(line);
    }
    if (fmtSub) {
      for (const sub of (gear.secs || []).slice(0, 4)) {
        const line = fmtSub(sub);
        if (line) lines.push(line);
      }
    }
    return lines;
  }

  function buildGearItemHtml(gear, t) {
    const kindLbl =
      gear.kind === 'relic'
        ? t.monstersGearRelic || 'Relic'
        : t.monstersGearArtifact || 'Artifact';
    const grade =
      gear.gradeStr && gear.grade > 0
        ? gear.gradeStr
        : gear.kind === 'relic'
          ? ''
          : gear.gradeStr || '';
    const categoryLabel = gear.category || '';
    const meta = [categoryLabel, grade].filter(Boolean).join(' · ');
    const head = [kindLbl, meta].filter(Boolean).join(' · ');
    const lines =
      gear.kind === 'artifact' ? buildArtifactEffectStack(gear, t) : gearEffectLines(gear, t);
    const bodyCls =
      gear.kind === 'artifact'
        ? 'monsters-gear-item__body monsters-gear-item__body--stack'
        : 'monsters-gear-item__body';
    const body = lines.length
      ? lines.map((l) => `<span class="monsters-gear-item__line">${escapeHtml(l)}</span>`).join('')
      : `<span class="monsters-gear-item__line monsters-gear-item__line--muted">${escapeHtml(t.monstersGearNoEffects || '—')}</span>`;
    return `<li class="monsters-gear-item">
      <span class="monsters-gear-item__head">${escapeHtml(head)}</span>
      <span class="${bodyCls}">${body}</span>
    </li>`;
  }

  function isArtifactElementSlot(artifact) {
    if (!artifact) return false;
    if (artifact.slot === 1) return true;
    if (artifact.slot === 2) return false;
    const el = ['Fire', 'Water', 'Wind', 'Light', 'Dark'];
    return el.includes(artifact.category);
  }

  function sortArtifactsForDisplay(artifacts) {
    return artifacts.slice().sort((a, b) => {
      const orderA = isArtifactElementSlot(a) ? 0 : 1;
      const orderB = isArtifactElementSlot(b) ? 0 : 1;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.category).localeCompare(String(b.category));
    });
  }

  function buildMonsterGearListHtml(items, t, emptyMsg) {
    if (!items.length) {
      return `<p class="monsters-detail__muted">${escapeHtml(emptyMsg || t.monstersGearEmpty || 'None equipped.')}</p>`;
    }
    return `<ul class="monsters-gear-list">${items.map((g) => buildGearItemHtml(g, t)).join('')}</ul>`;
  }

  function buildMonsterDetailLoadoutHtml(u, t, runesBlockHtml) {
    const runesLbl = escapeHtml(t.monstersDetailRunes || 'Runes');
    const artLbl = escapeHtml(t.monstersDetailArtifacts || 'Artifacts');
    const relLbl = escapeHtml(t.monstersDetailRelics || 'Relics');
    const countTpl = t.monstersDetailGearCount || '{n}';
    const artifacts = sortArtifactsForDisplay(u.artifacts || []);
    const relics = (u.relics || [])
      .slice()
      .sort((a, b) => String(a.category).localeCompare(String(b.category)));
    const artCount = artifacts.length;
    const relCount = relics.length;
    const artCountHtml = artCount
      ? ` <span class="monsters-detail__loadout-count">${escapeHtml(countTpl.replace('{n}', String(artCount)))}</span>`
      : '';
    const relCountHtml = relCount
      ? ` <span class="monsters-detail__loadout-count">${escapeHtml(countTpl.replace('{n}', String(relCount)))}</span>`
      : '';
    const artEmpty = t.monstersGearArtifactsEmpty || 'No artifacts on this monster.';
    const relEmpty = t.monstersGearRelicsEmpty || 'No relics on this monster.';
    return `<div class="monsters-detail__loadout-tabs" role="tablist" aria-label="${escapeHtml(t.monstersDetailLoadoutAria || 'Gear')}">
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm monsters-detail__loadout-tab is-active" data-loadout-tab="runes" role="tab" aria-selected="true" aria-controls="monsters-detail-loadout-runes">${runesLbl}</button>
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm monsters-detail__loadout-tab" data-loadout-tab="artifacts" role="tab" aria-selected="false" aria-controls="monsters-detail-loadout-artifacts"${artCount ? '' : ' disabled'}>${artLbl}${artCountHtml}</button>
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm monsters-detail__loadout-tab" data-loadout-tab="relics" role="tab" aria-selected="false" aria-controls="monsters-detail-loadout-relics"${relCount ? '' : ' disabled'}>${relLbl}${relCountHtml}</button>
      </div>
      <div class="monsters-detail__loadout-panels">
        <div class="monsters-detail__loadout-panel is-active" id="monsters-detail-loadout-runes" data-loadout-panel="runes" role="tabpanel">${runesBlockHtml}</div>
        <div class="monsters-detail__loadout-panel" id="monsters-detail-loadout-artifacts" data-loadout-panel="artifacts" role="tabpanel" hidden>${buildMonsterGearListHtml(artifacts, t, artEmpty)}</div>
        <div class="monsters-detail__loadout-panel" id="monsters-detail-loadout-relics" data-loadout-panel="relics" role="tabpanel" hidden>${buildMonsterGearListHtml(relics, t, relEmpty)}</div>
      </div>`;
  }

  function bindMonsterDetailLoadoutTabs(root) {
    if (!root) return;
    const tabs = root.querySelectorAll('[data-loadout-tab]');
    const panels = root.querySelectorAll('[data-loadout-panel]');
    if (!tabs.length) return;
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const kind = btn.getAttribute('data-loadout-tab');
        if (!kind) return;
        tabs.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach((p) => {
          const on = p.getAttribute('data-loadout-panel') === kind;
          p.classList.toggle('is-active', on);
          if (on) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
      });
    });
  }

  function formatMonsterRuneTooltip(r, t, slotNo) {
    if (!r) return '';
    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const parts = [];
    const hdr = [r.setName, `+${r.level || 0}`, r.gradeStr || ''].filter(Boolean).join(' ');
    if (hdr) parts.push(hdr);
    if (r.mainName) {
      parts.push(`${r.mainName} ${fmtRuneStatVal(r.mainType, r.mainVal, slotNo)}`);
    }
    if (r.innate_name && r.innate_val) {
      parts.push(
        `${t.monstersRuneInnate || 'Inn'} ${r.innate_name} ${fmtRuneStatVal(r.innate_type, r.innate_val, null)}`,
      );
    }
    for (const s of r.substats || []) {
      let line = `${s.name} +${subFn(s)}`;
      if (s.enchanted) line += ' *';
      if (Number(s.grind) > 0) line += ` (+${s.grind})`;
      parts.push(line);
    }
    if (Number.isFinite(r.eff)) {
      parts.push(`${t.monstersRuneEff || 'Eff'} ${(Math.round(r.eff * 10) / 10).toFixed(1)}%`);
    }
    return parts.join(' · ');
  }

  function computeActiveSetBonuses(u) {
    const counts = {};
    for (const slot of u.runeSlots || []) {
      const name = slot.rune && slot.rune.setName;
      if (!name) continue;
      counts[name] = (counts[name] || 0) + 1;
    }
    const out = [];
    for (const [name, total] of Object.entries(counts)) {
      let left = total;
      const parts = [];
      while (left >= 4) {
        parts.push(4);
        left -= 4;
      }
      if (left >= 2) {
        parts.push(2);
        left -= 2;
      }
      for (const pieces of parts) {
        out.push({ name, pieces });
      }
    }
    out.sort((a, b) => b.pieces - a.pieces || String(a.name).localeCompare(String(b.name)));
    return out;
  }

  function buildRuneSetBonusSummaryHtml(u, t, db) {
    const bonuses = computeActiveSetBonuses(u);
    if (!bonuses.length) return '';
    const chips = bonuses
      .map((b) => {
        const icon =
          db && typeof db.runeSetImageUrl === 'function' ? db.runeSetImageUrl(b.name) : '';
        const iconHtml = icon
          ? `<img class="monsters-rune-set-chip__icon" src="${escapeHtml(icon)}" alt="" width="18" height="18" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : '';
        return `<span class="monsters-rune-set-chip">${iconHtml}<span class="monsters-rune-set-chip__label">${escapeHtml(String(b.pieces))} ${escapeHtml(b.name)}</span></span>`;
      })
      .join('');
    const lbl = t.monstersRuneSetsActive || 'Active sets';
    return (
      '<div class="monsters-rune-sets" aria-label="' +
      escapeHtml(lbl) +
      '">' +
      chips +
      '</div>'
    );
  }

  function buildListRuneLineHtml(slot, db, t) {
    const emptySlot = t.monstersRuneEmpty || '—';
    const slotLbl = t.monstersRuneSlot || 'Slot';
    const r = slot.rune;
    const setName = r && r.setName ? r.setName : '';
    const runeIconUrl = setName && db ? db.runeSetImageUrl(setName) : '';
    const iconInner = runeIconUrl
      ? `<img src="${escapeHtml(runeIconUrl)}" alt="" width="16" height="16" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
      : '<span class="monsters-list-rune-row__ph" aria-hidden="true"></span>';

    if (!r && !slot.runeId) {
      return `<div class="monsters-list-rune-row monsters-list-rune-row--empty" data-slot="${slot.slot}" title="${escapeHtml(`${slotLbl} ${slot.slot}`)}">
        <span class="monsters-list-rune-row__icon">${iconInner}</span>
        <span class="monsters-list-rune-row__text">${slotLbl} ${slot.slot}: ${escapeHtml(emptySlot)}</span>
      </div>`;
    }

    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const hdr = [setName, r.level != null ? `+${r.level}` : '', r.gradeStr || '']
      .filter(Boolean)
      .join(' ');
    const mainPart = r.mainName
      ? `${r.mainName} ${fmtRuneStatVal(r.mainType, r.mainVal, slot.slot)}`
      : '';
    const innPart =
      r.innate_name && r.innate_val
        ? `${t.monstersRuneInnate || 'Inn'} ${r.innate_name} ${fmtRuneStatVal(r.innate_type, r.innate_val, null)}`
        : '';
    const subPart = (r.substats || [])
      .map((s) => {
        let line = `${s.name} +${subFn(s)}`;
        if (s.enchanted) line += '*';
        if (Number(s.grind) > 0) line += `+${s.grind}`;
        return line;
      })
      .join(', ');
    const text = [hdr, mainPart, innPart, subPart].filter(Boolean).join(' · ');
    const tip = formatMonsterRuneTooltip(r, t, slot.slot);

    return `<div class="monsters-list-rune-row" data-slot="${slot.slot}" title="${escapeHtml(tip || text)}">
        <span class="monsters-list-rune-row__icon">${iconInner}</span>
        <span class="monsters-list-rune-row__text"><strong>${slotLbl} ${slot.slot}</strong> ${escapeHtml(text)}</span>
      </div>`;
  }

  function buildListRuneColumnHtml(u, db, t) {
    const slots = (u.runeSlots || []).slice().sort((a, b) => a.slot - b.slot);
    const lines = slots.map((slot) => buildListRuneLineHtml(slot, db, t)).join('');
    return `<div class="monsters-list__runes-col">${lines}</div>`;
  }

  function bindMonsterRuneTooltips(root, unit, t) {
    if (!root || !unit || typeof setSwrmFloatTipTarget !== 'function') return;
    root.querySelectorAll('[data-slot]').forEach((el) => {
      const slotNo = Number(el.getAttribute('data-slot'));
      if (!Number.isFinite(slotNo)) return;
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      const tip = slot && slot.rune ? formatMonsterRuneTooltip(slot.rune, t, slotNo) : '';
      setSwrmFloatTipTarget(el, tip);
    });
  }

  function buildLocationIconHtml(u, t) {
    if (!u.inStorage) return '';
    const label = t.monstersLocationStorage || 'Storage';
    return `<span class="monsters-card__loc monsters-card__loc--storage monsters-card__loc--on" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"><span class="monsters-card__loc-icon" aria-hidden="true"></span><span class="monsters-card__loc-text">${escapeHtml(label)}</span></span>`;
  }

  function buildCustomTagsHtml(tags) {
    if (!tags || !tags.length) return '';
    return `<span class="monsters-card__tags">${tags
      .map((tag) => `<span class="monsters-card__tag">${escapeHtml(tag)}</span>`)
      .join('')}</span>`;
  }

  function swarfarmSkillIconUrl(skillId) {
    const db = window.SWRM_SKILL_DB;
    if (db && typeof db.skillIconUrl === 'function') {
      const url = db.skillIconUrl(skillId);
      if (url) return url;
    }
    return '';
  }

  function swarfarmSkillIconFallback(skillId) {
    const db = window.SWRM_SKILL_DB;
    if (db && typeof db.skillIconFallbackUrl === 'function') {
      return db.skillIconFallbackUrl(skillId) || '';
    }
    return '';
  }

  const SKILL_IMG_ONERROR =
    'onerror="var f=this.dataset.fallback;if(f){this.src=f;this.removeAttribute(\'data-fallback\');}else{this.hidden=true;}"';

  function hydrateMonsterSkillIcons(container) {
    const db = window.SWRM_SKILL_DB;
    if (!db || typeof db.ensureSkillIcon !== 'function' || !container) return;
    container.querySelectorAll('.monsters-detail__skill-img[data-skill-id]').forEach((img) => {
      const id = Number(img.getAttribute('data-skill-id'));
      if (!Number.isFinite(id)) return;
      db.ensureSkillIcon(id).then((url) => {
        if (url && img.isConnected) {
          img.src = url;
          img.hidden = false;
        }
      });
    });
  }

  function formatStatRuneDelta(total, baseVal, asPct) {
    if (!Number.isFinite(total)) return { total: '—', rune: '—' };
    const totStr = asPct ? `${Math.round(total)}%` : String(Math.round(total));
    if (!Number.isFinite(baseVal)) return { total: totStr, rune: '—' };
    const delta = Math.round(total - baseVal);
    const runeStr = delta > 0 ? (asPct ? `+${delta}%` : `+${delta}`) : asPct ? '0%' : '0';
    return { total: totStr, rune: runeStr };
  }

  function buildMonsterDetailStatsBlock(u, t) {
    const s = u.stats;
    if (!s) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersNoStats || 'No stat data in SWEX.')}</p>`;
    }
    const base = u.baseStats || null;
    const breakdown =
      base && typeof calculateMonsterStatBreakdown === 'function'
        ? calculateMonsterStatBreakdown(base, u)
        : null;
    const coreKeys = [
      [t.monstersStatHp || 'HP', 'hp'],
      [t.monstersStatAtk || 'ATK', 'atk'],
      [t.monstersStatDef || 'DEF', 'def'],
      [t.monstersStatSpd || 'SPD', 'spd'],
    ];
    const pctKeys = [
      [t.monstersStatCr || 'CRI Rate', 'critRate'],
      [t.monstersStatCd || 'CRI Dmg', 'critDmg'],
      [t.monstersStatRes || 'RES', 'res'],
      [t.monstersStatAcc || 'ACC', 'acc'],
    ];
    function fmtVal(key, field, isPct) {
      const row = breakdown && breakdown[key];
      if (row) {
        const n = row[field];
        if (!Number.isFinite(n)) return '—';
        if (typeof displayStatValue === 'function') {
          return displayStatValue(key, n, isPct);
        }
        return isPct ? `${Math.round(n)}%` : String(Math.round(n));
      }
      if (field === 'total' && s) {
        const n = Number(s[key]);
        if (Number.isFinite(n)) {
          if (typeof displayStatValue === 'function') return displayStatValue(key, n, isPct);
          return isPct ? `${Math.round(n)}%` : String(Math.round(n));
        }
      }
      return '—';
    }
    function coreRow(label, key) {
      const row = breakdown && breakdown[key];
      const bonus = row && Number.isFinite(row.bonus) ? row.bonus : 0;
      const bonusStr =
        bonus > 0
          ? row.isPct
            ? `+${bonus}%`
            : `+${bonus}`
          : row?.isPct
            ? '0%'
            : '0';
      const clickTip = t.monstersStatsClickHint || 'Click HP–SPD to switch base+rune / total view';
      const clickAria = `${label}. ${clickTip}`;
      return `<div class="monsters-detail__stat-row monsters-detail__stat-row--core monsters-detail__stat-row--clickable" data-stat-key="${key}" role="button" tabindex="0" title="${escapeAttr(clickTip)}" aria-label="${escapeAttr(clickAria)}">
          <span class="monsters-detail__stat-k">${escapeHtml(label)}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--base" data-col="base">${escapeHtml(fmtVal(key, 'base', false))}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--rune" data-col="bonus">${escapeHtml(bonusStr)}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--total-green" data-col="total" hidden>${escapeHtml(fmtVal(key, 'total', false))}</span>
        </div>`;
    }
    function pctRow(label, key) {
      return `<div class="monsters-detail__stat-row monsters-detail__stat-row--pct" data-stat-key="${key}">
          <span class="monsters-detail__stat-k">${escapeHtml(label)}</span>
          <span class="monsters-detail__stat-num monsters-detail__stat-num--pct-total" data-col="pct">${escapeHtml(fmtVal(key, 'total', true))}</span>
        </div>`;
    }
    const statRows = coreKeys.map(([label, key]) => coreRow(label, key)).concat(pctKeys.map(([label, key]) => pctRow(label, key))).join('');
    const loading =
      !base && window.SWRM_MONSTER_DB
        ? `<p class="monsters-detail__muted monsters-detail__stats-loading">${escapeHtml(t.monstersStatsLoading || 'Loading base stats…')}</p>`
        : '';
    return (
      '<div class="monsters-detail__stats-grid monsters-detail__stats-grid--split" data-stats-grid data-stats-view="split">' +
      loading +
      statRows +
      '</div>'
    );
  }

  function bindMonsterDetailStatsToggle(root) {
    if (!root) return;
    const grid = root.querySelector('[data-stats-grid]');
    if (!grid || grid.dataset.statsToggleBound === '1') return;
    grid.dataset.statsToggleBound = '1';
    const setView = (mode) => {
      const split = mode !== 'total';
      grid.dataset.statsView = split ? 'split' : 'total';
      grid.classList.toggle('monsters-detail__stats-grid--total-view', !split);
      grid.querySelectorAll('.monsters-detail__stat-row--core [data-col="total"]').forEach((el) => {
        if (split) el.setAttribute('hidden', '');
        else el.removeAttribute('hidden');
      });
      grid.querySelectorAll('.monsters-detail__stat-row--core [data-col="base"], .monsters-detail__stat-row--core [data-col="bonus"]').forEach((el) => {
        if (split) el.removeAttribute('hidden');
        else el.setAttribute('hidden', '');
      });
    };
    const toggle = () => {
      const next = grid.dataset.statsView === 'total' ? 'split' : 'total';
      setView(next);
    };
    grid.querySelectorAll('.monsters-detail__stat-row--core').forEach((row) => {
      row.addEventListener('click', toggle);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
    setView('split');
  }

  function buildMonsterStatsHtml(u, t) {
    return buildMonsterDetailStatsBlock(u, t);
  }

  const DETAIL_RUNE_GRID_ORDER = [6, 1, 2, 5, 4, 3];
  const STAR_SLOT_ANGLES = { 6: -150, 1: -90, 2: -30, 3: 30, 4: 90, 5: 150 };

  function buildRuneDetailPanelHtml(r, t, slotNo) {
    if (!r) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersRuneEmpty || '—')}</p>`;
    }
    const subFn =
      window.SWRM && typeof window.SWRM.subRuneValue === 'function'
        ? window.SWRM.subRuneValue
        : (s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0);
    const lines = [];
    const hdr = [r.setName, `+${r.level || 0}`, r.gradeStr || ''].filter(Boolean).join(' ');
    if (hdr) {
      lines.push(
        `<div class="monsters-rune-focus__line monsters-rune-focus__hdr">${escapeHtml(hdr)}</div>`,
      );
    }
    if (r.mainName) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(r.mainName)}</span><span class="monsters-rune-focus__v">${escapeHtml(fmtRuneStatVal(r.mainType, r.mainVal, slotNo))}</span></div>`,
      );
    }
    if (r.innate_name && r.innate_val) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(t.monstersRuneInnate || 'Inn')} ${escapeHtml(r.innate_name)}</span><span class="monsters-rune-focus__v">${escapeHtml(fmtRuneStatVal(r.innate_type, r.innate_val, null))}</span></div>`,
      );
    }
    for (const s of r.substats || []) {
      let sub = `${s.name} +${subFn(s)}`;
      if (s.enchanted) sub += ' *';
      if (Number(s.grind) > 0) sub += ` (+${s.grind})`;
      lines.push(
        '<' +
          'd' +
          'iv class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">' +
          escapeHtml(sub) +
          '</span></' +
          'd' +
          'iv>',
      );
    }
    if (Number.isFinite(r.eff)) {
      lines.push(
        `<div class="monsters-rune-focus__line"><span class="monsters-rune-focus__k">${escapeHtml(t.monstersRuneEff || 'Eff')}</span><span class="monsters-rune-focus__v">${escapeHtml((Math.round(r.eff * 10) / 10).toFixed(1))}%</span></div>`,
      );
    }
    return `<div class="monsters-rune-focus">${lines.join('')}</div>`;
  }

  function clearMonsterRuneFocus(root) {
    if (!root) return;
    const panel = root.querySelector('[data-rune-focus]');
    const grid = root.querySelector('.monsters-detail__runes, .monsters-runes--hex-star');
    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
    if (grid) grid.removeAttribute('aria-hidden');
    monstersRuneFocusState = null;
  }

  function bindMonsterRuneFocusPanel(root, unit, t) {
    if (!root || !unit) return;
    const panel = root.querySelector('[data-rune-focus]');
    if (!panel) return;
    const grid = root.querySelector('.monsters-detail__runes, .monsters-runes--hex-star');
    const unitId = String(unit.unitId);

    const showSlot = (slotNo) => {
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      if (!slot || !slot.rune) {
        clearMonsterRuneFocus(root);
        return;
      }
      if (
        monstersRuneFocusState &&
        monstersRuneFocusState.unitId === unitId &&
        monstersRuneFocusState.slot === slotNo
      ) {
        return;
      }
      monstersRuneFocusState = { unitId, slot: slotNo };
      panel.innerHTML = buildRuneDetailPanelHtml(slot.rune, t, slotNo);
      panel.hidden = false;
      if (grid) grid.setAttribute('aria-hidden', 'true');
      if (typeof setSwrmFloatTipTarget === 'function') {
        root.querySelectorAll('[data-slot]').forEach((el) => setSwrmFloatTipTarget(el, ''));
      }
      history.pushState({ swrmMonsterRuneFocus: 1, unitId, slot: slotNo }, '');
    };

    root.querySelectorAll('[data-slot]').forEach((el) => {
      const slotNo = Number(el.getAttribute('data-slot'));
      if (!Number.isFinite(slotNo)) return;
      const slot = (unit.runeSlots || []).find((s) => s.slot === slotNo);
      const tip = slot && slot.rune ? formatMonsterRuneTooltip(slot.rune, t, slotNo) : '';
      if (typeof setSwrmFloatTipTarget === 'function') setSwrmFloatTipTarget(el, tip);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!slot || !slot.rune) return;
        showSlot(slotNo);
      });
    });
  }

  if (!window.__swrmMonsterRunePopstate) {
    window.__swrmMonsterRunePopstate = true;
    window.addEventListener('popstate', () => {
      if (!monstersRuneFocusState) return;
      const wrap = document.querySelector('.monsters-detail__runes-wrap');
      clearMonsterRuneFocus(wrap);
    });
  }

  function isStorageMarked(u) {
    return !!(u && (u.storageMark || u.inStorage));
  }

  function buildCardActionsHtml(u, t) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return '';
    const uid = escapeHtml(String(u.unitId));
    const storageOn = isStorageMarked(u);
    const storageTitle = u.inStorage
      ? t.monstersStorageSwex || t.monstersLocationStorage || 'Storage (SWEX)'
      : t.monstersStorageMark || 'Storage tag';
    const storageDisabled = u.inStorage ? ' disabled' : '';
    return `<button type="button" class="monsters-mark-btn${u.favorite ? ' monsters-mark-btn--on monsters-mark-btn--favorite' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-mark-btn${u.food ? ' monsters-mark-btn--on monsters-mark-btn--food' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-mark-btn${storageOn ? ' monsters-mark-btn--on monsters-mark-btn--storage' : ''}${u.inStorage ? ' monsters-mark-btn--swex' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${storageOn}" title="${escapeHtml(storageTitle)}"${storageDisabled}>▣</button>`;
  }

  function buildListRowMetaHtml(u, t) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return '';
    const uid = escapeHtml(String(u.unitId));
    const storageOn = isStorageMarked(u);
    const storageTitle = u.inStorage
      ? t.monstersStorageSwex || t.monstersLocationStorage || 'Storage (SWEX)'
      : t.monstersStorageMark || 'Storage tag';
    const storageDisabled = u.inStorage ? ' disabled' : '';
    return `<div class="monsters-card__list-meta">
      <div class="monsters-card__actions monsters-card__actions--list">
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.favorite ? ' monsters-tag-btn--on' : ''}" data-unit-tag="favorite" data-unit-id="${uid}" aria-pressed="${u.favorite}" title="${escapeHtml(t.monstersFavorite || 'Favorite')}">★</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${u.food ? ' monsters-tag-btn--on' : ''}" data-unit-tag="food" data-unit-id="${uid}" aria-pressed="${u.food}" title="${escapeHtml(t.monstersFood || 'Food')}">🍖</button>
        <button type="button" class="monsters-tag-btn monsters-tag-btn--sm${storageOn ? ' monsters-tag-btn--on' : ''}${u.inStorage ? ' monsters-tag-btn--swex' : ''}" data-unit-tag="storageMark" data-unit-id="${uid}" aria-pressed="${storageOn}" title="${escapeHtml(storageTitle)}"${storageDisabled}>▣</button>
      </div>
    </div>`;
  }

  function buildMonsterDetailTagsHtml(u, t) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) {
      const tags = u.customTags || [];
      if (!tags.length) return '';
      const chips = tags
        .map(
          (tag) =>
            `<span class="monsters-detail__tag"><span class="monsters-detail__tag-label">${escapeHtml(tag)}</span></span>`,
        )
        .join('');
      return `<div class="monsters-detail__custom-tags">
      <p class="monsters-detail__custom-tags-label">${escapeHtml(t.monstersCustomTags || 'Custom tags')}</p>
      <div class="monsters-detail__tag-list">${chips}</div>
    </div>`;
    }
    const tags = u.customTags || [];
    const chips = tags.length
      ? tags
          .map(
            (tag) =>
              `<span class="monsters-detail__tag"><span class="monsters-detail__tag-label">${escapeHtml(tag)}</span><button type="button" class="monsters-detail__tag-remove" data-remove-custom-tag="${escapeHtml(tag)}" data-unit-id="${escapeHtml(String(u.unitId))}" title="${escapeHtml(t.monstersTagRemove || 'Remove tag')}">×</button></span>`,
          )
          .join('')
      : `<span class="monsters-detail__muted">${escapeHtml(t.monstersNoCustomTags || 'No custom tags.')}</span>`;
    return `<div class="monsters-detail__custom-tags">
      <p class="monsters-detail__custom-tags-label">${escapeHtml(t.monstersCustomTags || 'Custom tags')}</p>
      <div class="monsters-detail__tag-list">${chips}</div>
      <div class="monsters-detail__tag-add">
        <input type="text" class="monsters-detail__tag-input" id="monsters-detail-tag-input" maxlength="${MAX_TAG_LEN}" placeholder="${escapeHtml(t.monstersTagPlaceholder || 'New tag…')}" autocomplete="off" />
        <button type="button" class="btn-secondary btn-sm" data-add-custom-tag="1" data-unit-id="${escapeHtml(String(u.unitId))}">${escapeHtml(t.monstersTagAdd || 'Add')}</button>
      </div>
    </div>`;
  }

  function syncMonstersBulkBar(t) {
    const bar = document.getElementById('monsters-bulk-bar');
    const countEl = document.getElementById('monsters-bulk-count');
    const n = monstersBulkSelected.size;
    const tpl = t.monstersBulkCountTpl || '{n} selected';
    if (countEl) countEl.textContent = n ? tpl.replace(/\{n\}/g, String(n)) : '';
    if (!bar) return;
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    bar.hidden = ro || !n;
    if (!n) return;
    const ids = [...monstersBulkSelected];
    const syncMarkBtn = (id, key, isOn) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const on = isOn(ids);
      btn.classList.toggle('monsters-bulk-mark-btn--on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    };
    syncMarkBtn('monsters-bulk-favorite', 'favorite', (list) => list.length > 0 && list.every((uid) => unitMetaFor(uid).favorite));
    syncMarkBtn('monsters-bulk-food', 'food', (list) => list.length > 0 && list.every((uid) => unitMetaFor(uid).food));
    syncMarkBtn('monsters-bulk-storage', 'storageMark', (list) => {
      const eligible = list.filter((uid) => {
        const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(uid));
        return !u || !u.inStorage;
      });
      return eligible.length > 0 && eligible.every((uid) => unitMetaFor(uid).storageMark);
    });
    const storageBtn = document.getElementById('monsters-bulk-storage');
    if (storageBtn) {
      const allSwex = ids.length > 0 && ids.every((uid) => {
        const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(uid));
        return u && u.inStorage;
      });
      storageBtn.disabled = allSwex;
    }
  }

  function openMonsterRunesInTable(u) {
    if (typeof setRuneTableMonsterMasterId === 'function') {
      setRuneTableMonsterMasterId(u.masterId);
    }
    if (typeof showMainTab === 'function') {
      showMainTab('runes', { runesSubtab: 'runetable', writeHash: true });
    }
    if (typeof applyFiltersAndSort === 'function') {
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    }
  }

  function buildRuneSetIconsHtml(u, db, t) {
    const emptySlot = t.monstersRuneEmpty || '—';
    const slotLbl = t.monstersRuneSlot || 'Slot';
    const inner = (u.runeSlots || [])
      .map((slot) => {
        const r = slot.rune;
        const filled = !!(r || slot.runeId);
        const setName = r && r.setName ? r.setName : '';
        const tip = filled
          ? `${slotLbl} ${slot.slot}: ${setName}`
          : `${slotLbl} ${slot.slot}: ${emptySlot}`;
        const runeIconUrl = filled && db && setName ? db.runeSetImageUrl(setName) : '';
        if (runeIconUrl) {
          return `<span class="monsters-rune-icon" data-slot="${slot.slot}" title="${escapeHtml(tip)}">
            <img class="monsters-rune-icon__img" src="${escapeHtml(runeIconUrl)}" alt="${escapeHtml(setName)}" width="20" height="20" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
            <span class="monsters-rune-icon__n">${slot.slot}</span>
          </span>`;
        }
        return `<span class="monsters-rune-icon monsters-rune-icon--empty" data-slot="${slot.slot}" title="${escapeHtml(tip)}">
          <span class="monsters-rune-icon__n">${slot.slot}</span>
        </span>`;
      })
      .join('');
    return `<div class="monsters-rune-icons" aria-label="${escapeHtml(t.monstersRunesLabel || 'Rune sets')}">${inner}</div>`;
  }

  function buildSkillTileHtml(s, skillDb) {
    const url = swarfarmSkillIconUrl(s.skillId);
    const fb = swarfarmSkillIconFallback(s.skillId);
    const label = skillDb && s.upgradeable !== false ? skillDb.formatSkillLevelDetail(s) : '';
    const fbAttr = fb ? ' data-fallback="' + escapeHtml(fb) + '"' : '';
    const img = url
      ? '<img class="monsters-detail__skill-img" src="' +
        escapeHtml(url) +
        '"' +
        fbAttr +
        ' alt="" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer" ' +
        SKILL_IMG_ONERROR +
        ' />'
      : '<img class="monsters-detail__skill-img" hidden data-skill-id="' +
        escapeHtml(String(s.skillId)) +
        '" alt="" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer" ' +
        SKILL_IMG_ONERROR +
        ' />';
    const overlay = label
      ? '<span class="monsters-detail__skill-lv-overlay">' + escapeHtml(label) + '</span>'
      : '';
    return (
      '<div class="monsters-detail__skill-tile monsters-detail__skill-tile--tip" data-skill-id="' +
      escapeHtml(String(s.skillId)) +
      '" data-skill-level="' +
      escapeHtml(String(s.level)) +
      '">' +
      img +
      overlay +
      '</div>'
    );
  }

  function resolveLeaderSkillTile(leaderSkill) {
    if (!leaderSkill) return null;
    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    const sk = leaderSkill.skill;

    if (skillDb && sk) {
      const sid = Number(sk.com2us_id ?? sk.com2usId ?? leaderSkill.com2us_id ?? leaderSkill.id);
      if (Number.isFinite(sid) && sid > 0 && typeof skillDb.skillIconUrl === 'function') {
        const url = skillDb.skillIconUrl(sid);
        if (url) {
          const fallback =
            typeof skillDb.skillIconFallbackUrl === 'function'
              ? skillDb.skillIconFallbackUrl(sid)
              : '';
          return { url, fallback };
        }
      }
      const fn = sk.icon_filename ? String(sk.icon_filename) : '';
      if (fn) {
        const la = window.SWRM_LOCAL_ASSETS;
        const url =
          la && typeof la.resolveSkillIconUrl === 'function'
            ? la.resolveSkillIconUrl(fn)
            : db && typeof db.swarfarmAssetUrl === 'function'
              ? db.swarfarmAssetUrl(`static/herders/images/skills/${fn}`)
              : '';
        if (url) {
          const fallback =
            la && typeof la.skillIconFallbackUrl === 'function' ? la.skillIconFallbackUrl(fn) : '';
          return { url, fallback };
        }
      }
    }

    if (db && typeof db.leaderSkillIconUrl === 'function') {
      const url = db.leaderSkillIconUrl(leaderSkill);
      if (url) {
        const fallback =
          typeof db.leaderSkillIconRemoteUrl === 'function'
            ? db.leaderSkillIconRemoteUrl(leaderSkill)
            : '';
        return { url, fallback };
      }
    }
    return null;
  }

  function formatLeaderSkillTooltip(leaderSkill, t) {
    if (!leaderSkill) return '';
    const sk = leaderSkill.skill;
    if (sk && typeof sk === 'object') {
      const desc = String(sk.description || sk.description_en || '').trim();
      if (desc) return desc;
      const name = String(sk.name || sk.name_en || '').trim();
      if (name) return name;
    }
    const attr = String(leaderSkill.attribute || '').trim();
    const amt = leaderSkill.amount;
    const area = String(leaderSkill.area || '').trim();
    const element = leaderSkill.element ? String(leaderSkill.element).trim() : '';
    let condition = '';
    if (area === 'Dungeon') condition = 'in the Dungeons ';
    else if (area === 'Arena') condition = 'in the Arena ';
    else if (area === 'Guild') condition = 'in Guild Content ';
    else if (area === 'Element' && element) condition = `with ${element} attribute `;
    if (attr && amt != null) {
      return `Increase the ${attr} of ally monsters ${condition}by ${amt}%`;
    }
    const lb = formatLeaderSkillTitleBody(leaderSkill, t);
    return [lb.title, lb.body].filter(Boolean).join(' — ');
  }

  function bindMonsterDetailLeaderTips(root, leaderSkill, t) {
    if (!root || !leaderSkill || typeof setSwrmFloatTipTarget !== 'function') return;
    const tile = root.querySelector('.monsters-detail__skill-tile--leader');
    if (!tile) return;
    const tip = formatLeaderSkillTooltip(leaderSkill, t);
    setSwrmFloatTipTarget(tile, tip);
    tile.setAttribute('aria-label', tip);
  }

  function applyMonsterSkillTipToTile(tile, skillId, level) {
    if (!tile || !skillId || typeof setSwrmFloatTipTarget !== 'function') return false;
    const db = window.SWRM_SKILL_DB;
    if (!db) return false;
    const text =
      typeof db.formatSkillProgressTooltip === 'function'
        ? db.formatSkillProgressTooltip(skillId, level)
        : typeof db.formatSkillTooltip === 'function'
          ? db.formatSkillTooltip(skillId, level)
          : '';
    const html =
      typeof db.formatSkillProgressTooltipHtml === 'function'
        ? db.formatSkillProgressTooltipHtml(skillId, level)
        : '';
    if (html) {
      setSwrmFloatTipTarget(tile, '', { html });
      tile.setAttribute('aria-label', text || tile.getAttribute('aria-label') || '');
      return true;
    }
    if (text && !/^Skill \d+/.test(text)) {
      setSwrmFloatTipTarget(tile, text);
      tile.setAttribute('aria-label', text);
      return true;
    }
    return false;
  }

  function bindMonsterDetailSkillTips(root, skillRows) {
    if (!root || typeof setSwrmFloatTipTarget !== 'function') return;
    const rows = skillRows || [];
    const tiles = root.querySelectorAll(
      '.monsters-detail__skills-main .monsters-detail__skill-tile--tip',
    );
    const pending = [];
    tiles.forEach((tile, i) => {
      const row = rows[i];
      const skillId = row?.skillId ?? Number(tile.getAttribute('data-skill-id'));
      const level = row?.level ?? Number(tile.getAttribute('data-skill-level'));
      if (!skillId) return;
      tile.style.cursor = 'help';
      pending.push({ tile, skillId, level });
    });

    void (async () => {
      const db = window.SWRM_SKILL_DB;
      if (!db) return;
      if (typeof db.loadSkillIndex === 'function') {
        try {
          await db.loadSkillIndex();
        } catch (e) { /* ignore */ }
      }
      for (const { tile, skillId, level } of pending) {
        if (!tile.isConnected) continue;
        if (applyMonsterSkillTipToTile(tile, skillId, level)) continue;
        if (typeof db.fetchSkillMeta === 'function') {
          try {
            await db.fetchSkillMeta(skillId);
          } catch (e) { /* ignore */ }
        }
        applyMonsterSkillTipToTile(tile, skillId, level);
      }
    })();
  }

  function formatLeaderSkillTitleBody(leaderSkill, t) {
    if (!leaderSkill) return { title: '', body: '' };
    const sk = leaderSkill.skill;
    if (sk && typeof sk === 'object') {
      const name = String(sk.name || sk.name_en || '').trim();
      const desc = String(sk.description || sk.description_en || '').trim();
      return {
        title: name || (t.monstersLeaderSkill || 'Leader skill'),
        body: desc,
      };
    }
    const attr = String(leaderSkill.attribute || '').trim();
    const amt = leaderSkill.amount != null ? String(leaderSkill.amount).trim() : '';
    const area = String(leaderSkill.area || '').trim();
    const element = String(leaderSkill.element || '').trim();
    const bits = [];
    if (amt && attr) bits.push(`${amt}% ${attr}`);
    else if (attr) bits.push(attr);
    if (area) bits.push(area);
    if (element) bits.push(element);
    const title =
      amt && attr
        ? `${amt}% ${attr}`
        : attr || (t.monstersLeaderSkill || 'Leader skill');
    const body = bits.length > 1 ? bits.slice(1).join(' · ') : area && attr ? area : '';
    return { title, body: body || bits.join(' · ') };
  }

  function buildMonsterDetailSkillsBlock(skillRows, t, skillDb, leaderSkill) {
    const rows = skillRows || [];
    const hasLeader = !!(leaderSkill && (leaderSkill.attribute || leaderSkill.skill || leaderSkill.id));
    if (!rows.length && !hasLeader) {
      return '<p class="monsters-detail__muted">' + escapeHtml(t.monstersNoSkills || 'No skill data.') + '</p>';
    }
    const activeTiles = rows.map((s) => buildSkillTileHtml(s, skillDb)).join('');
    const mainHtml =
      '<div class="monsters-detail__skills-main"><div class="monsters-detail__skills-row">' +
      (activeTiles || '<span class="monsters-detail__muted">—</span>') +
      '</div></div>';
    if (!hasLeader) {
      return '<div class="monsters-detail__skills-layout">' + mainHtml + '</div>';
    }
    const leader = resolveLeaderSkillTile(leaderSkill);
    const leaderTip = escapeHtml(formatLeaderSkillTooltip(leaderSkill, t));
    const leaderFbAttr =
      leader && leader.fallback ? ' data-fallback="' + escapeHtml(leader.fallback) + '"' : '';
    const leaderImg = leader && leader.url
      ? '<img class="monsters-detail__skill-img" src="' +
        escapeHtml(leader.url) +
        '"' +
        leaderFbAttr +
        ' alt="" width="40" height="40" loading="lazy" decoding="async" referrerpolicy="no-referrer" ' +
        SKILL_IMG_ONERROR +
        ' />'
      : '<span class="monsters-detail__skill-img monsters-detail__skill-img--ph" aria-hidden="true"></span>';
    const leaderHtml =
      '<div class="monsters-detail__skills-leader">' +
      '<div class="monsters-detail__skill-tile monsters-detail__skill-tile--leader" title="' +
      leaderTip +
      '">' +
      leaderImg +
      '</div></div>';
    return '<div class="monsters-detail__skills-layout">' + mainHtml + leaderHtml + '</div>';
  }

  function buildMonsterDetailRunesStrip(u, db, t) {
    const empty = t.monstersRuneEmpty || '—';
    const cells = [];
    for (let n = 1; n <= 6; n++) {
      const slot = (u.runeSlots || []).find((s) => Number(s.slot) === n) || { slot: n, rune: null };
      const r = slot.rune;
      const filled = !!(r || slot.runeId);
      const setName = r && r.setName ? r.setName : '';
      const main = r && r.mainName ? String(r.mainName) : '';
      const lvl = r && r.level != null ? '+' + r.level : '';
      const url = filled && db && setName ? db.runeSetImageUrl(setName) : '';
      const img = url
        ? '<img class="monsters-detail__rune-strip__icon" src="' +
          escapeHtml(url) +
          '" alt="" width="28" height="28" loading="lazy" referrerpolicy="no-referrer" />'
        : '';
      cells.push(
        '<div class="monsters-detail__rune-strip__cell' +
          (filled ? '' : ' monsters-detail__rune-strip__cell--empty') +
          '" data-slot="' +
          slot.slot +
          '">' +
          '<span class="monsters-detail__rune-strip__slot">' +
          slot.slot +
          '</span>' +
          img +
          '<span class="monsters-detail__rune-strip__lvl">' +
          escapeHtml(lvl || empty) +
          '</span>' +
          '<span class="monsters-detail__rune-strip__main">' +
          escapeHtml(main || empty) +
          '</span></div>',
      );
    }
    return '<div class="monsters-detail__runes-strip">' + cells.join('') + '</div>';
  }

  function buildRuneBlockHtml(u, db, t, view) {
    if (view === 'list') return '';
    return '';
  }

  function buildListRowInfoHtml(u, t) {
    const filled = (u.runeSlots || []).filter((s) => s.rune || s.runeId).length;
    const runeTpl = t.monstersListRunesTpl || '{n}/6 runes';
    const runeTip = t.monstersRunesLabel || 'Runes';
    const runeHtml = `<span class="monsters-list-info__runes" title="${escapeHtml(runeTip)}">${escapeHtml(runeTpl.replace(/\{n\}/g, String(filled)))}</span>`;
    const bonuses = computeActiveSetBonuses(u);
    const setHtml = bonuses.length
      ? `<span class="monsters-list-info__sets">${bonuses
          .slice(0, 3)
          .map((b) => `<span class="monsters-list-info__set">${escapeHtml(b.pieces)} ${escapeHtml(b.name)}</span>`)
          .join('')}</span>`
      : '';
    const skillHtml =
      u.skillUpsNeeded > 0
        ? `<span class="monsters-list-info__skills" title="${escapeHtml((t.monstersSkillDeficitTip || '{n} to max').replace(/\{n\}/g, String(u.skillUpsNeeded)))}">${devilmonIconHtml('monsters-list-info__skill-icon')}<span class="monsters-list-info__skill-n">${escapeHtml(String(u.skillUpsNeeded))}</span></span>`
        : '';
    const locHtml = u.inStorage ? buildLocationIconHtml(u, t) : '';
    return `<div class="monsters-list-info">${runeHtml}${setHtml}${skillHtml}${locHtml}</div>`;
  }

  function buildRuneSlotHtml(u, db, t, opts) {
    const large = opts && opts.large;
    const clickable = opts && opts.clickable;
    const hideNum = opts && opts.hideSlotNum;
    const gridOrder = opts && opts.gridOrder;
    const starLayout = opts && opts.starLayout;
    const emptySlot = t.monstersRuneEmpty || '—';
    const clsBase = large ? 'monsters-detail-rune' : 'monsters-rune-slot';
    const slotList = gridOrder
      ? gridOrder
          .map((n) => (u.runeSlots || []).find((s) => Number(s.slot) === Number(n)))
          .filter(Boolean)
      : u.runeSlots || [];
    const inner = slotList
      .map((slot) => {
        const r = slot.rune;
        const filled = !!(r || slot.runeId);
        const setName = r && r.setName ? r.setName : '';
        const cls = filled ? '' : ` ${clsBase}--empty`;
        const starCls = starLayout ? ' monsters-rune-star' : '';
        const angle = starLayout ? STAR_SLOT_ANGLES[slot.slot] : null;
        const starStyle = angle != null ? ` style="--star-angle: ${angle}deg"` : '';
        const runeIconUrl = filled && db && setName ? db.runeSetImageUrl(setName) : '';
        const iconHtml = runeIconUrl
          ? `<img class="${clsBase}__icon" src="${escapeHtml(runeIconUrl)}" alt="${escapeHtml(setName)}" width="${large ? 32 : 22}" height="${large ? 32 : 22}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`
          : '';
        const mainTxt =
          filled && r && r.mainName
            ? String(r.mainName)
            : '';
        const tip = [setName, mainTxt].filter(Boolean).join(' · ') || emptySlot;
        const clickAttr = clickable
          ? ` role="button" tabindex="0" title="${escapeHtml(tip)}"`
          : ` title="${escapeHtml(tip)}"`;
        const labelHtml = runeIconUrl
          ? `<span class="${clsBase}__set ${clsBase}__set--sr">${escapeHtml(setName)}</span>`
          : `<span class="${clsBase}__set">${escapeHtml(setName || emptySlot)}</span>`;
        const mainHtml =
          large && mainTxt
            ? `<span class="${clsBase}__main">${escapeHtml(mainTxt)}</span>`
            : '';
        const numHtml = hideNum
          ? ''
          : `<span class="${clsBase}__num">${slot.slot}</span>`;
        return `<div class="${clsBase}${cls}${starCls}" data-slot="${slot.slot}"${starStyle}${clickAttr}>
          ${numHtml}
          ${iconHtml}
          ${labelHtml}
          ${mainHtml}
        </div>`;
      })
      .join('');
    if (starLayout) {
      const lbl = escapeHtml(t.monstersDetailRunes || 'Runes');
      return `<div class="monsters-runes monsters-runes--hex-star monsters-runes--game" role="group" aria-label="${lbl}">${inner}${'<'+'/div>'}`;
    }
    return inner;
  }

  function renderMonstersDetail(u, t, anchorEl) {
    const aside = document.getElementById('monsters-detail');
    const body = document.getElementById('monsters-detail-body');
    if (!aside || !body) return;
    bindMonstersDetailFloat();
    syncMonstersDetailPinnedLayout();

    if (!u) {
      hideMonstersDetailFloat();
      body.hidden = true;
      body.innerHTML = '';
      return;
    }

    const db = window.SWRM_MONSTER_DB;
    const meta = u.meta;
    const elCls = elementClass(u.metaElement);
    const natLbl = t.monstersNatShort || 'nat';
    const lvlLbl = t.monstersLevelShort || 'Lv';
    const storageLbl = t.monstersStorageBadge || 'Storage';
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const skillDb = window.SWRM_SKILL_DB;
    const skillRows = skillDb
      ? skillDb.enrichUnitSkillsForDetail(u.skills)
      : Array.isArray(u.skillRows)
        ? u.skillRows
        : [];
    const lookupRow = db && typeof db.lookupMonster === 'function' ? db.lookupMonster(u.masterId) : null;
    const metaRow = meta || lookupRow;
    const leaderSkill = metaRow && metaRow.leader_skill ? metaRow.leader_skill : null;
    const skillsBlock = buildMonsterDetailSkillsBlock(skillRows, t, skillDb, leaderSkill);
    let statsBlock = buildMonsterStatsHtml(u, t);
    if (db && lookupRow && typeof db.monsterBaseStatsAtLevel === 'function') {
      const initialBase = db.monsterBaseStatsAtLevel(lookupRow, u.level);
      if (
        initialBase &&
        typeof db.hasUsableBaseStats === 'function' &&
        db.hasUsableBaseStats(initialBase)
      ) {
        statsBlock = buildMonsterDetailStatsBlock(
          { ...u, meta: metaRow, baseStats: initialBase },
          t,
        );
      }
    }
    const runesBlock =
      buildRuneSetBonusSummaryHtml(u, t, db) + buildMonsterDetailRunesStrip(u, db, t);
    const loadoutBlock =
      typeof buildMonsterDetailLoadoutHtml === 'function'
        ? buildMonsterDetailLoadoutHtml(u, t, runesBlock)
        : runesBlock;
    const natStars =
      meta && meta.natural_stars != null
        ? meta.natural_stars
        : u.stars != null
          ? u.stars
          : '';
    const subBits = [
      u.metaElement ? escapeHtml(u.metaElement) : '',
      u.metaArchetype ? escapeHtml(u.metaArchetype) : '',
    ].filter(Boolean);
    const rankStars = typeof buildMonsterStarsBadge === 'function' ? buildMonsterStarsBadge(u) : '';
    const elementBadge =
      typeof buildMonsterElementBadge === 'function' ? buildMonsterElementBadge(u) : '';
    const levelBadge =
      typeof buildMonsterLevelBadge === 'function' ? buildMonsterLevelBadge(u, t) : '';
    const natLine =
      natStars !== ''
        ? `<span class="monsters-detail__nat-pill">${escapeHtml(natLbl)} <strong>${escapeHtml(String(natStars))}</strong></span>`
        : '';
    const pinned = monstersDetailPinnedUnitId != null;
    const closeBtn = pinned
      ? `<button type="button" class="monsters-detail__unpin btn-secondary btn-sm" data-unpin-detail="1" title="${escapeHtml(t.monstersDetailUnpin || 'Close')}">×</button>`
      : '';

    body.innerHTML = `
      <header class="monsters-detail__head">
        <div class="monsters-detail__portrait-wrap monsters-detail__portrait-wrap--${elCls}">
          ${rankStars}
          <img class="monsters-detail__portrait" alt="" width="96" height="96" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
          ${elementBadge}
          ${levelBadge}
        </div>
        <div class="monsters-detail__head-text">
          <h3 class="monsters-detail__title" id="monsters-detail-title">${bestiaryHref ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(u.displayName)}</a>` : escapeHtml(u.displayName)}</h3>
          <p class="monsters-detail__meta-line">${[natLine, subBits.join(' · '), `${escapeHtml(lvlLbl)} <strong>${u.level}</strong>`].filter(Boolean).join(' · ')}${u.inStorage ? ` · <span class="monsters-detail__storage">${escapeHtml(storageLbl)}</span>` : ''}</p>
          <button type="button" class="btn-secondary btn-sm monsters-detail__open-runes" data-open-runes-all="1">${escapeHtml(t.monstersOpenRunes || 'Open runes in table')}</button>
        </div>
        ${closeBtn}
      </header>
      <div class="monsters-detail__scroll" data-detail-scroll>
        <div data-detail-stats>${statsBlock}</div>
        <section class="monsters-detail__section" data-detail-skills>
          <h4 class="monsters-detail__section-title">${escapeHtml(t.monstersDetailTabSkills || 'Skills')}</h4>
          ${skillsBlock}
        </section>
        <section class="monsters-detail__section monsters-detail__section--loadout" data-detail-loadout>
          ${loadoutBlock}
        </section>
      </div>`;

    body.hidden = false;
    aside.hidden = false;
    aside.classList.add('monsters-detail--visible');

    const img = body.querySelector('.monsters-detail__portrait[data-img-file]');
    if (img && u.imageFilename) bindMonsterPortrait(img, u.imageFilename);
    if (typeof hydrateMonsterSkillIcons === 'function') hydrateMonsterSkillIcons(body);
    if (typeof bindMonsterDetailLeaderTips === 'function') {
      bindMonsterDetailLeaderTips(body, leaderSkill, t);
    }
    if (typeof bindMonsterDetailSkillTips === 'function') {
      bindMonsterDetailSkillTips(body, skillRows);
    }
    if (typeof bindMonsterDetailLoadoutTabs === 'function') {
      bindMonsterDetailLoadoutTabs(body);
    }
    if (typeof bindMonsterRuneFocusPanel === 'function') {
      bindMonsterRuneFocusPanel(body, u, t);
    }
    if (typeof bindMonsterDetailStatsToggle === 'function') {
      bindMonsterDetailStatsToggle(body);
    }

    body.querySelector('[data-open-runes-all]')?.addEventListener('click', () => openMonsterRunesInTable(u));
    body.querySelector('[data-unpin-detail]')?.addEventListener('click', () => unpinMonsterDetail());

    if (anchorEl) positionMonstersDetailFloat(anchorEl);

    const needsApiFetch =
      db &&
      typeof db.fetchMonsterMetaForDetail === 'function' &&
      (!lookupRow ||
        typeof db.monsterHasBundledDetail !== 'function' ||
        !db.monsterHasBundledDetail(lookupRow));

    if (needsApiFetch) {
      db.fetchMonsterMetaForDetail(u.masterId).then((row) => {
        if (!row || !body.isConnected) return;
        db.mergeMonsterMetaIntoCache(u.masterId, row);
        const cur = monstersEnrichedCache.find((x) => String(x.unitId) === String(u.unitId));
        if (cur) cur.meta = { ...(cur.meta || {}), ...row };

        const base =
          db.monsterBaseStatsAtLevel && typeof db.monsterBaseStatsAtLevel === 'function'
            ? db.monsterBaseStatsAtLevel(row, u.level)
            : null;
        const statsHost = body.querySelector('[data-detail-stats]');
        const baseOk =
          base &&
          db.hasUsableBaseStats &&
          typeof db.hasUsableBaseStats === 'function' &&
          db.hasUsableBaseStats(base);
        if (statsHost && baseOk) {
          statsHost.innerHTML = buildMonsterDetailStatsBlock({ ...u, meta: row, baseStats: base }, t);
          if (typeof bindMonsterDetailStatsToggle === 'function') {
            bindMonsterDetailStatsToggle(body);
          }
        }

        const skillsSec = body.querySelector('[data-detail-skills]');
        if (skillsSec) {
          const block = buildMonsterDetailSkillsBlock(
            skillDb ? skillDb.enrichUnitSkillsForDetail(u.skills) : skillRows,
            t,
            skillDb,
            row.leader_skill || null,
          );
          skillsSec.innerHTML = `<h4 class="monsters-detail__section-title">${escapeHtml(t.monstersDetailTabSkills || 'Skills')}</h4>${block}`;
          if (typeof hydrateMonsterSkillIcons === 'function') hydrateMonsterSkillIcons(body);
          if (typeof bindMonsterDetailLeaderTips === 'function') {
            bindMonsterDetailLeaderTips(body, row.leader_skill || null, t);
          }
          if (typeof bindMonsterDetailSkillTips === 'function') {
            const rows = skillDb ? skillDb.enrichUnitSkillsForDetail(u.skills) : skillRows;
            bindMonsterDetailSkillTips(body, rows);
          }
          if (typeof bindMonsterDetailStatsToggle === 'function') {
            bindMonsterDetailStatsToggle(body);
          }
        }

        syncMonsterRowHighlight(u.unitId);
      });
    }
  }

  function handleMonstersUnitTagClick(btn) {
    if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
    const tag = btn.getAttribute('data-unit-tag');
    const uid = btn.getAttribute('data-unit-id');
    if (!tag || !uid) return;
    if (tag === 'favorite' || tag === 'food' || tag === 'storageMark') {
      if (tag === 'storageMark') {
        const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(uid));
        if (u && u.inStorage) return;
      }
      toggleUnitMetaFlag(uid, tag);
      renderMonstersPanel();
    }
  }

  function syncBulkCardStates(grid) {
    if (!grid) return;
    grid.querySelectorAll('.monsters-card').forEach((card) => {
      const uid = card.getAttribute('data-unit-id');
      const on = monstersBulkSelected.has(String(uid));
      card.classList.toggle('monsters-card--bulk-on', on);
      const bulkBtn = card.querySelector('[data-bulk-toggle]');
      if (bulkBtn) {
        bulkBtn.classList.toggle('monsters-card__bulk-btn--on', on);
        bulkBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });
    grid.querySelectorAll('.monsters-table__row').forEach((row) => {
      const uid = row.getAttribute('data-unit-id');
      const on = monstersBulkSelected.has(String(uid));
      row.classList.toggle('monsters-table__row--bulk-on', on);
      const cb = row.querySelector('.monsters-table__bulk-cb:not(.monsters-table__bulk-cb--all)');
      if (cb) cb.checked = on;
    });
    if (typeof syncMonstersSelectAllState === 'function') syncMonstersSelectAllState();
  }

  function bindMonstersGridDelegation() {
    const grid = document.getElementById('monsters-grid');
    if (!grid || grid.dataset.monstersDelegation === '1') return;
    grid.dataset.monstersDelegation = '1';

    grid.addEventListener('click', (e) => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

      const addBtn = e.target.closest('[data-add-custom-tag]');
      if (addBtn && grid.contains(addBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = addBtn.getAttribute('data-unit-id');
        const row = addBtn.closest('.monsters-card');
        const input = row?.querySelector(`[data-tag-input][data-unit-id="${uid}"]`);
        const val = input ? input.value : '';
        if (uid && normalizeCustomTag(val)) {
          addUnitCustomTag(uid, val);
          if (input) input.value = '';
          renderMonstersPanel();
        }
        return;
      }

      const rmBtn = e.target.closest('[data-remove-custom-tag]');
      if (rmBtn && grid.contains(rmBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = rmBtn.getAttribute('data-unit-id');
        const tag = rmBtn.getAttribute('data-remove-custom-tag');
        if (uid && tag) {
          removeUnitCustomTag(uid, tag);
          renderMonstersPanel();
        }
        return;
      }

      const tagBtn = e.target.closest('[data-unit-tag]');
      if (tagBtn && grid.contains(tagBtn)) {
        e.preventDefault();
        e.stopPropagation();
        handleMonstersUnitTagClick(tagBtn);
        return;
      }

      const bulkBtn = e.target.closest('[data-bulk-toggle]');
      if (bulkBtn && grid.contains(bulkBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const uid = bulkBtn.getAttribute('data-unit-id');
        if (!uid) return;
        toggleMonstersBulkSelect(uid);
        monstersBulkLastIndex = monstersVisibleUnitIds.indexOf(String(uid));
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        return;
      }

      const card = e.target.closest('.monsters-card');
      if (!card || !grid.contains(card)) return;
      const uid = card.getAttribute('data-unit-id');
      if (!uid) return;

      if (e.target.closest('[data-unpin-detail]')) {
        e.preventDefault();
        e.stopPropagation();
        unpinMonsterDetail();
        return;
      }
      if (e.target.closest('a, button, input, .monsters-mark-btn, .monsters-card__bulk-btn')) return;
      if (e.target.closest('[data-tag-input]')) return;
      if (e.target.closest('.monsters-tag-btn')) return;

      e.preventDefault();
      pinMonsterDetail(uid, card);
    });
  }

  function devilmonIconHtml(className) {
    const db = window.SWRM_MONSTER_DB;
    const url =
      db && typeof db.devilmonImageUrl === 'function'
        ? db.devilmonImageUrl()
        : 'https://swarfarm.com/static/herders/images/monsters/devilmon_dark.png';
    return `<img class="${className}" src="${escapeHtml(url)}" alt="" width="16" height="16" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
  }

  function monsterUnitNatStars(u) {
    const n = u.unitClass != null ? Number(u.unitClass) : Number(u.stars) || 0;
    return Math.min(6, Math.max(0, n));
  }

  function monsterUnitRankStars(u) {
    const n = u.unitRank != null ? Number(u.unitRank) : Number(u.stars) || 0;
    return Math.min(6, Math.max(0, n));
  }

  function monsterUnitIsAwakened(u) {
    const db = window.SWRM_MONSTER_DB;
    if (db && typeof db.isMonsterAwakened === 'function') {
      return db.isMonsterAwakened(u.masterId, u.meta);
    }
    return false;
  }

  function buildMonsterStarsBadge(u, variant) {
    const n = monsterUnitRankStars(u);
    if (!n) return '';
    const awakened = monsterUnitIsAwakened(u);
    const rowCls =
      variant === 'table'
        ? 'monsters-table__stars'
        : 'monsters-card__stars-row';
    const starCls = variant === 'table' ? 'monsters-table__star' : 'monsters-card__star';
    const awakenCls = awakened
      ? variant === 'table'
        ? ' monsters-table__stars--awakened'
        : ' monsters-card__stars-row--awakened'
      : '';
    const stars = Array.from(
      { length: n },
      (_, i) => `<span class="${starCls}" style="--star-i:${i}">★</span>`,
    ).join('');
    if (variant === 'table') {
      return `<div class="${rowCls}${awakenCls}" aria-label="${n}★">${stars}</div>`;
    }
    return `<div class="${rowCls}${awakenCls} monsters-card__stars-row--overlay" aria-label="${n}★">${stars}</div>`;
  }

  function buildMonsterElementBadge(u) {
    const db = window.SWRM_MONSTER_DB;
    const el = elementClass(u.metaElement);
    if (!el) return '';
    const url = db && typeof db.elementIconUrl === 'function' ? db.elementIconUrl(u.metaElement) : '';
    if (url) {
      const fallback =
        db && typeof db.swarfarmDirectUrl === 'function'
          ? db.swarfarmDirectUrl(`static/herders/images/elements/${elementClass(u.metaElement)}.png`)
          : '';
      const onerr = fallback
        ? ` onerror="if(this.dataset.fb){this.onerror=null;this.src=this.dataset.fb}" data-fb="${escapeHtml(fallback)}"`
        : '';
      return `<img class="monsters-card__element-img" src="${escapeHtml(url)}" alt="${escapeHtml(u.metaElement)}" width="24" height="24" loading="lazy" decoding="async" referrerpolicy="no-referrer"${onerr} />`;
    }
    const letter = String(u.metaElement || '?').charAt(0).toUpperCase();
    return `<span class="monsters-card__element monsters-card__element--${el}" title="${escapeHtml(u.metaElement)}">${escapeHtml(letter)}</span>`;
  }

  function buildMonsterLevelBadge(u, t) {
    const lbl = t.monstersLevelShort || 'Lv';
    const lv = escapeHtml(String(u.level));
    return `<span class="monsters-card__level" aria-label="${escapeHtml(lbl)} ${lv}">${lv}</span>`;
  }

  function buildMonsterBulkToggleHtml(u) {
    const uid = escapeHtml(String(u.unitId));
    const on = monstersBulkSelected.has(String(u.unitId));
    return `<button type="button" class="monsters-card__bulk-btn${on ? ' monsters-card__bulk-btn--on' : ''}" data-bulk-toggle="1" data-unit-id="${uid}" aria-pressed="${on ? 'true' : 'false'}" title="Select for bulk">✓</button>`;
  }

  function buildMonsterCardHtml(u, db, t, view) {
    const elCls = elementClass(u.metaElement);
    const pinned = monstersDetailPinnedUnitId != null && String(monstersDetailPinnedUnitId) === String(u.unitId);
    const hover =
      !pinned &&
      monstersDetailHoverUnitId != null &&
      String(monstersDetailHoverUnitId) === String(u.unitId);
    const bestiaryHref = db && u.bestiarySlug ? db.bestiaryUrl(u.bestiarySlug) : '';
    const q = monstersSearchHighlight || '';
    const nameHtml = highlightMonstersSearchInPlain(u.displayName || `#${u.masterId}`, q);
    const nameInner = bestiaryHref
      ? `<a href="${escapeHtml(bestiaryHref)}" target="_blank" rel="noopener noreferrer">${nameHtml}</a>`
      : nameHtml;
    const runeCells = buildRuneBlockHtml(u, db, t, view);
    const bulkSel = monstersBulkSelected.has(String(u.unitId));
    const starsBadge = buildMonsterStarsBadge(u);
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    const marksHtml =
      view !== 'table' && !ro
        ? `<span class="monsters-card__name-marks">${buildCardActionsHtml(u, t)}</span>`
        : '';
    const pinClose =
      pinned && !ro
        ? `<button type="button" class="monsters-card__pin-close" data-unpin-detail="1" title="${escapeHtml(t.monstersDetailUnpin || 'Close')}">×</button>`
        : '';
    return `<article class="monsters-card monsters-card--grid${u.favorite ? ' monsters-card--favorite' : ''}${u.food ? ' monsters-card--food' : ''}${bulkSel ? ' monsters-card--bulk-on' : ''}${pinned ? ' monsters-card--pinned' : ''}${hover ? ' monsters-card--hover' : ''}${elCls ? ` monsters-card--${elCls}` : ''}" data-unit-id="${escapeHtml(String(u.unitId))}" data-master-id="${u.masterId}" tabindex="0">
          ${pinClose}
          <div class="monsters-card__bar monsters-card__bar--${elCls}" aria-hidden="true"></div>
          ${ro ? '' : buildMonsterBulkToggleHtml(u)}
          <div class="monsters-card__hero">
            ${starsBadge}
            <img class="monsters-card__img" alt="" width="120" height="120" data-img-file="${escapeHtml(u.imageFilename || '')}" loading="lazy" decoding="async" />
            ${buildMonsterElementBadge(u)}
            ${buildMonsterLevelBadge(u, t)}
          </div>
          <div class="monsters-card__meta">
            <p class="monsters-card__name">
              <span class="monsters-card__name-text">${nameInner}</span>${marksHtml}
            </p>
          </div>
          ${runeCells}
        </article>`;
  }

  async function ensureMonstersDataset() {
    if (allUnits.length) return true;
    if (typeof installEmbeddedDemoDataset !== 'function') return false;
    return installEmbeddedDemoDataset({ keepTab: true });
  }

  function syncMonsterRowHighlight(unitId) {
    const uid = unitId != null ? String(unitId) : '';
    const pinned = monstersDetailPinnedUnitId != null;
    document.querySelectorAll('.monsters-card, .monsters-table__row').forEach((node) => {
      const id = node.getAttribute('data-unit-id');
      const on = id === uid;
      if (node.classList.contains('monsters-card')) {
        node.classList.toggle('monsters-card--hover', !pinned && on);
        node.classList.toggle('monsters-card--pinned', pinned && on);
      } else {
        node.classList.toggle('monsters-table__row--hover', !pinned && on);
        node.classList.toggle('monsters-table__row--pinned', pinned && on);
      }
    });
  }

  function showMonsterDetailForCard(unitId, anchorEl, options) {
    const opts = options || {};
    const pin = opts.pin === true;
    if (pin) {
      monstersDetailPinnedUnitId = unitId != null ? String(unitId) : null;
    }
    if (!monstersDetailPinnedUnitId) {
      monstersDetailHoverUnitId = unitId != null ? String(unitId) : null;
    } else if (pin) {
      monstersDetailHoverUnitId = null;
    }
    const u = monstersEnrichedCache.find((x) => String(x.unitId) === String(unitId));
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    cancelMonstersDetailHide();
    syncMonsterRowHighlight(unitId);
    syncMonstersDetailPinnedLayout();
    renderMonstersDetail(u || null, t, pin ? null : anchorEl);
  }

  function pinMonsterDetail(unitId, anchorEl) {
    showMonsterDetailForCard(unitId, anchorEl, { pin: true });
  }

  function unpinMonsterDetail() {
    monstersDetailPinnedUnitId = null;
    syncMonstersDetailPinnedLayout();
    hideMonstersDetailFloat();
  }

  const MONSTERS_TABLE_COLS = [
    { id: 'bulk', labelKey: 'monstersColBulk', fallback: '', sortable: false },
    { id: 'name', labelKey: 'monstersColName', fallback: 'Name', sortable: true },
    { id: 'stars', labelKey: 'monstersColStars', fallback: 'Stars', sortable: true },
    { id: 'level', labelKey: 'monstersColLevel', fallback: 'Lv', sortable: true },
    { id: 'element', labelKey: 'monstersColElement', fallback: 'Element', sortable: true },
    { id: 'role', labelKey: 'monstersColRole', fallback: 'Archetype', sortable: true },
    { id: 'runes', labelKey: 'monstersColRunes', fallback: 'Runes', sortable: true },
    { id: 'skills', labelKey: 'monstersColDevilmons', fallback: 'Devilmons', sortable: true },
    { id: 'marks', labelKey: 'monstersColMarks', fallback: 'Marks', sortable: true },
    { id: 'tags', labelKey: 'monstersColTags', fallback: 'Tags', sortable: true },
  ];

  function monsterTableCellStars(u) {
    return buildMonsterStarsBadge(u, 'table');
  }

  function monsterTableCellTags(u) {
    const tags = (u.customTags || []).slice(0, 3);
    if (!tags.length) return '—';
    return tags.map((tag) => escapeHtml(tag)).join(', ');
  }

  function monsterTableCellMarks(u) {
    const bits = [];
    if (u.favorite) bits.push('★');
    if (u.food) bits.push('🍖');
    if (u.inStorage) bits.push('▣');
    else if (u.storageMark) bits.push('▣*');
    return bits.length ? bits.join(' ') : '—';
  }

  function monsterTableThumbHtml(u) {
    if (!u.imageFilename) return '';
    return `<img class="monsters-table__thumb" alt="" width="32" height="32" data-img-file="${escapeHtml(u.imageFilename)}" loading="lazy" decoding="async" />`;
  }

  function monsterTableElementCell(u) {
    const db = window.SWRM_MONSTER_DB;
    const url = db && typeof db.elementIconUrl === 'function' ? db.elementIconUrl(u.metaElement) : '';
    if (url) {
      return `<img class="monsters-table__element-img" src="${escapeHtml(url)}" alt="${escapeHtml(u.metaElement || '')}" width="20" height="20" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
    }
    return escapeHtml(u.metaElement || '—');
  }

  function tableSortIconFor(colId) {
    if (!monstersTableSort || monstersTableSort.col !== colId) {
      return '<span class="monsters-table__sort-icon" aria-hidden="true">↕</span>';
    }
    const arrow = monstersTableSort.dir === 'asc' ? '▲' : '▼';
    return `<span class="monsters-table__sort-icon" aria-hidden="true">${arrow}</span>`;
  }

  function buildMonsterTableHeadHtml(t) {
    return MONSTERS_TABLE_COLS.map((c) => {
      if (c.id === 'bulk') {
        const allLbl = escapeHtml(t.monstersTableSelectAll || 'Select all visible');
        const oneLbl = escapeHtml(t.monstersBulkSelectOne || 'Select');
        return `<th scope="col" class="monsters-table__th monsters-table__th--bulk" data-col="bulk">
          <span class="monsters-table__bulk-th-inner">
            <input type="checkbox" id="monsters-table-select-all" class="monsters-table__bulk-cb monsters-table__bulk-cb--all" title="${allLbl}" aria-label="${allLbl}" />
            <span class="sr-only">${oneLbl}</span>
          </span>
        </th>`;
      }
      const label = t[c.labelKey] || c.fallback;
      const sorted = monstersTableSort && monstersTableSort.col === c.id;
      const cls = [
        'monsters-table__th--sortable',
        sorted ? 'monsters-table__th--sorted' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const ariaSort = sorted ? (monstersTableSort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="${cls}" data-col="${c.id}" data-sort-col="${c.id}" aria-sort="${ariaSort}"><span class="monsters-table__th-inner">${escapeHtml(label)}${tableSortIconFor(c.id)}</span></th>`;
    }).join('');
  }

  function compareMonstersTableRows(a, b, col, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    switch (col) {
      case 'stars':
        return mul * (monsterUnitRankStars(a) - monsterUnitRankStars(b)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      case 'level':
        return mul * ((Number(a.level) || 0) - (Number(b.level) || 0)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      case 'element': {
        const elIdx = (el) => {
          const i = ELEMENT_ORDER.indexOf(el);
          return i === -1 ? 99 : i;
        };
        return (
          mul * (elIdx(a.metaElement) - elIdx(b.metaElement)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      }
      case 'role':
        return (
          mul * String(a.metaArchetype || '').localeCompare(String(b.metaArchetype || '')) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'runes':
        return (
          mul * ((Number(a.equippedCount) || 0) - (Number(b.equippedCount) || 0)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'skills': {
        const sa = Number(a.skillUpsNeeded) || 0;
        const sb = Number(b.skillUpsNeeded) || 0;
        return mul * (sa - sb) || mul * String(a.displayName).localeCompare(String(b.displayName));
      }
      case 'marks': {
        const score = (u) =>
          (u.favorite ? 4 : 0) + (u.food ? 2 : 0) + (u.inStorage || u.storageMark ? 1 : 0);
        return mul * (score(a) - score(b)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      }
      case 'tags':
        return (
          mul * String((a.customTags || []).join(',')).localeCompare(String((b.customTags || []).join(','))) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'bulk':
        return 0;
      case 'name':
      default:
        return mul * String(a.displayName || '').localeCompare(String(b.displayName || ''));
    }
  }

  function sortMonstersForTable(units) {
    if (!monstersTableSort) {
      return sortMonstersList(units, 'level-desc');
    }
    const list = units.slice();
    list.sort((a, b) => compareMonstersTableRows(a, b, monstersTableSort.col, monstersTableSort.dir));
    return list;
  }

  function cycleMonstersTableSort(col) {
    if (!monstersTableSort || monstersTableSort.col !== col) {
      monstersTableSort = { col, dir: 'desc' };
    } else {
      monstersTableSort.dir = monstersTableSort.dir === 'desc' ? 'asc' : 'desc';
    }
  }

  function buildMonsterTableHtml(visible, t) {
    const head = buildMonsterTableHeadHtml(t);
    const body = visible
      .map((u) => {
        const uid = escapeHtml(String(u.unitId));
        const bulkSel = monstersBulkSelected.has(String(u.unitId));
        const pinned =
          monstersDetailPinnedUnitId != null &&
          String(monstersDetailPinnedUnitId) === String(u.unitId);
        const hover =
          !pinned &&
          monstersDetailHoverUnitId != null &&
          String(monstersDetailHoverUnitId) === String(u.unitId);
        const elCls = elementClass(u.metaElement);
        const rowCls = [
          bulkSel ? 'monsters-table__row--bulk-on' : '',
          pinned ? 'monsters-table__row--pinned' : '',
          hover ? 'monsters-table__row--hover' : '',
          elCls ? `monsters-table__row--${elCls}` : '',
        ]
          .filter(Boolean)
          .join(' ');
        const q = monstersSearchHighlight || '';
        const name = highlightMonstersSearchInPlain(u.displayName || `#${u.masterId}`, q);
        const runeTpl = t.monstersListRunesTpl || '{n}/6';
        const runes = highlightMonstersSearchInPlain(
          runeTpl.replace(/\{n\}/g, String(u.equippedCount || 0)),
          q,
        );
        const skills =
          u.skillUpsNeeded > 0
            ? `<span class="monsters-table__devils" title="${escapeHtml((t.monstersSkillDeficitTip || '{n} to max').replace(/\{n\}/g, String(u.skillUpsNeeded)))}">${devilmonIconHtml('monsters-table__devil-icon')}<span class="monsters-table__devil-n">${escapeHtml(String(u.skillUpsNeeded))}</span></span>`
            : u.skillsMaxed
              ? '✓'
              : '—';
        const storageBadge = u.inStorage
          ? `<span class="monsters-table__storage-badge">${escapeHtml(t.monstersStorageBadge || 'Storage')}</span>`
          : '';
        return `<tr class="monsters-table__row${rowCls ? ` ${rowCls}` : ''}" data-unit-id="${uid}" tabindex="0">
          <td data-col="bulk" class="monsters-table__td-bulk"><input type="checkbox" class="monsters-table__bulk-cb" data-unit-id="${uid}" ${bulkSel ? 'checked' : ''} aria-label="${escapeHtml(t.monstersBulkSelectOne || 'Select')}" /></td>
          <td data-col="name"><div class="monsters-table__name-cell">${monsterTableThumbHtml(u)}<span class="monsters-table__name">${name}</span>${storageBadge}</div></td>
          <td data-col="stars">${monsterTableCellStars(u)}</td>
          <td data-col="level">${highlightMonstersSearchInPlain(String(u.level), q)}</td>
          <td data-col="element">${monsterTableElementCell(u)}</td>
          <td data-col="role">${highlightMonstersSearchInPlain(u.metaArchetype || '—', q)}</td>
          <td data-col="runes">${runes}</td>
          <td data-col="skills">${skills}</td>
          <td data-col="marks">${monsterTableCellMarks(u)}</td>
          <td data-col="tags">${monsterTableCellTags(u)}</td>
        </tr>`;
      })
      .join('');
    return `<div class="monsters-table-wrap"><table class="monsters-table swrm-table-zebra"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function bindMonsterTableHeaderSort(grid) {
    if (!grid) return;
    grid.querySelectorAll('th[data-sort-col]').forEach((th) => {
      th.addEventListener('click', (e) => {
        e.preventDefault();
        const col = th.getAttribute('data-sort-col');
        if (!col) return;
        cycleMonstersTableSort(col);
        renderMonstersPanel();
      });
    });
  }

  function bindMonsterTableRows(grid, t) {
    if (!grid) return;
    bindMonsterTableHeaderSort(grid);
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    grid.querySelectorAll('.monsters-table__thumb[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file) bindMonsterPortrait(img, file);
    });
    grid.querySelectorAll('.monsters-table__row').forEach((row) => {
      const uid = row.getAttribute('data-unit-id');
      row.addEventListener('mouseenter', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, row);
      });
      row.addEventListener('mouseleave', scheduleMonstersDetailHide);
      row.addEventListener('focus', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, row);
      });
      row.addEventListener('blur', scheduleMonstersDetailHide);
      row.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (e.target.closest('.monsters-table__td-bulk') || e.target.classList.contains('monsters-table__bulk-cb')) {
          return;
        }
        e.preventDefault();
        pinMonsterDetail(uid, row);
        if (!ro) {
          const idx = monstersVisibleUnitIds.indexOf(String(uid));
          if (e.shiftKey && monstersBulkLastIndex >= 0 && idx >= 0) {
            const a = Math.min(monstersBulkLastIndex, idx);
            const b = Math.max(monstersBulkLastIndex, idx);
            for (let i = a; i <= b; i++) monstersBulkSelected.add(monstersVisibleUnitIds[i]);
          } else if (e.ctrlKey || e.metaKey) {
            toggleMonstersBulkSelect(uid);
            monstersBulkLastIndex = idx;
          }
          writeMonstersBulkSelected(monstersBulkSelected);
          syncMonstersBulkBar(t);
          syncBulkCardStates(grid);
        }
      });
      row.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        pinMonsterDetail(uid, row);
      });
    });

    const syncSelectAllState = () => {
      if (typeof syncMonstersSelectAllState === 'function') syncMonstersSelectAllState();
    };

    grid.querySelectorAll('.monsters-table__bulk-cb:not(.monsters-table__bulk-cb--all)').forEach((cb) => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = cb.getAttribute('data-unit-id');
        if (!id) return;
        const on = cb.checked;
        if (on) monstersBulkSelected.add(String(id));
        else monstersBulkSelected.delete(String(id));
        monstersBulkLastIndex = monstersVisibleUnitIds.indexOf(String(id));
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        syncSelectAllState();
      });
    });

    const selAll = document.getElementById('monsters-table-select-all');
    if (selAll && !ro) {
      selAll.addEventListener('click', (e) => e.stopPropagation());
      selAll.addEventListener('change', () => {
        const on = selAll.checked;
        for (const id of monstersVisibleUnitIds) {
          if (on) monstersBulkSelected.add(id);
          else monstersBulkSelected.delete(id);
        }
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        syncSelectAllState();
      });
      syncSelectAllState();
    }
  }

  async function renderMonstersPanel() {
    const grid = document.getElementById('monsters-grid');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!grid) return;

    monstersBulkSelected = readMonstersBulkSelected();
    syncMonstersBulkBar(t);

    if (monstersSelectedUnitId == null) {
      monstersSelectedUnitId = loadMonstersSelectedUnitId();
    }

    if (!allUnits.length) {
      const loaded = await ensureMonstersDataset();
      if (loaded && allUnits.length) {
        return renderMonstersPanel();
      }
      if (grid) grid.innerHTML = '';
      if (typeof renderMonstersBoxOverview === 'function') renderMonstersBoxOverview([]);
      renderMonstersChips({ total: 0, anyRune: 0, fullSix: 0, skillUpsTotal: 0 }, t, false);
      renderMonstersEmptyState('no-data', t);
      hideMonstersDetailFloat();
      return;
    }

    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (db.indexCount() === 0) await db.loadMonsterIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
      try {
        await skillDb.loadSkillIndex();
        if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
      } catch (e) { /* ignore */ }
    }

    const indexMissing =
      db && typeof db.indexCount === 'function' && db.isReady() && db.indexCount() === 0;
    const skillsIndexMissing =
      skillDb && typeof skillDb.indexCount === 'function' && skillDb.isReady() && skillDb.indexCount() === 0;

    const enriched = allUnits.map((u) => {
      const meta = db ? db.lookupMonster(u.masterId) : null;
      const tags = unitMetaFor(u.unitId);
      const skillPack = skillDb
        ? skillDb.enrichUnitSkills(u.skills)
        : { skills: [], skillUpsNeeded: 0, skillsMaxed: true, skillsKnown: false };
      return {
        ...u,
        meta,
        metaElement: meta && meta.element ? meta.element : '',
        displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
        imageFilename: meta && meta.image_filename ? meta.image_filename : '',
        bestiarySlug: meta && meta.bestiary_slug ? meta.bestiary_slug : '',
        favorite: tags.favorite,
        food: tags.food,
        storageMark: tags.storageMark,
        customTags: tags.tags,
        metaArchetype: normalizeArchetype(
          (meta && meta.archetype) ||
            (db && typeof db.monsterArchetype === 'function' ? db.monsterArchetype(u.masterId) : ''),
        ),
        skillRows: skillPack.skills,
        skillUpsNeeded: skillPack.skillUpsNeeded,
        skillsMaxed: skillPack.skillsMaxed,
        skillsKnown: skillPack.skillsKnown,
      };
    });
    monstersEnrichedCache = enriched;

    const filters = readMonstersFilters();
    const qInput = document.getElementById('monsters-filter-q');
    const elSelect = document.getElementById('monsters-filter-element');
    const locSelect = document.getElementById('monsters-filter-location');
    if (qInput && qInput.value !== filters.q) qInput.value = filters.q;
    if (elSelect && elSelect.value !== filters.element) elSelect.value = filters.element;
    if (locSelect && locSelect.value !== filters.location) locSelect.value = filters.location;
    populateMonstersSetFilter();
    populateMonstersTagFilter();
    populateMonstersRoleFilter();
    const skillSel = document.getElementById('monsters-filter-skill');
    const runeSel = document.getElementById('monsters-filter-rune');
    const setSel = document.getElementById('monsters-filter-rune-set');
    const tagSel = document.getElementById('monsters-filter-tag');
    const roleSel = document.getElementById('monsters-filter-role');
    const markSel = document.getElementById('monsters-filter-mark');
    if (skillSel && skillSel.value !== (filters.skillFilter || '')) skillSel.value = filters.skillFilter || '';
    if (runeSel && runeSel.value !== (filters.runeFilter || '')) runeSel.value = filters.runeFilter || '';
    if (setSel && setSel.value !== (filters.runeSet || '')) setSel.value = filters.runeSet || '';
    if (tagSel && tagSel.value !== (filters.tagFilter || '')) tagSel.value = filters.tagFilter || '';
    if (roleSel && roleSel.value !== (filters.roleFilter || '')) roleSel.value = filters.roleFilter || '';
    if (markSel && markSel.value !== (filters.markFilter || '')) markSel.value = filters.markFilter || '';
    syncMonstersShowAllButton(!!filters.fullSixOnly, t);
    syncMonstersMinLevelInput(filters.minLevelMin, t);

    const view = readMonstersView();
    const filtered = filterMonstersList(enriched, filters);
    let visible;
    if (view === 'table') {
      visible = sortMonstersForTable(filtered);
    } else {
      visible = sortMonstersList(filtered, filters.sort);
    }
    monstersVisibleUnitIds = visible.map((u) => String(u.unitId));
    const sum = computeMonstersSummary(enriched);
    if (typeof renderMonstersBoxOverview === 'function') renderMonstersBoxOverview(enriched);
    renderMonstersChips(sum, t, indexMissing, skillsIndexMissing);
    if (typeof renderRuneTableRosterChips === 'function') renderRuneTableRosterChips();

    if (!visible.length) {
      grid.innerHTML = '';
      renderMonstersEmptyState('filtered', t);
      hideMonstersDetailFloat();
      return;
    }

    grid.classList.remove('monsters-grid--empty-state');

    syncMonstersViewToggle(view);

    if (view === 'table') {
      grid.innerHTML = buildMonsterTableHtml(visible, t);
      bindMonsterTableRows(grid, t);
    } else if (view === 'cards') {
      grid.innerHTML = visible.map((u) => buildMonsterCardHtml(u, db, t, view)).join('');
      grid.querySelectorAll('.monsters-card__img[data-img-file]').forEach((img) => {
        const file = img.getAttribute('data-img-file');
        if (file) bindMonsterPortrait(img, file);
      });
      bindMonstersGridSelectAll(t);
    }

    if (typeof syncMonstersSelectAllState === 'function') syncMonstersSelectAllState();

    grid.querySelectorAll('.monsters-card').forEach((card) => {
      const uid = card.getAttribute('data-unit-id');
      card.addEventListener('mouseenter', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, card);
      });
      card.addEventListener('mouseleave', scheduleMonstersDetailHide);
      card.addEventListener('focus', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, card);
      });
      card.addEventListener('blur', scheduleMonstersDetailHide);
    });

    syncBulkCardStates(grid);

    if (monstersDetailPinnedUnitId) {
      const esc = String(monstersDetailPinnedUnitId).replace(/"/g, '\\"');
      const pinCard =
        document.querySelector(`.monsters-card[data-unit-id="${esc}"]`) ||
        document.querySelector(`.monsters-table__row[data-unit-id="${esc}"]`);
      const pu = enriched.find((x) => String(x.unitId) === String(monstersDetailPinnedUnitId));
      if (pu) renderMonstersDetail(pu, t, pinCard);
    } else if (monstersDetailHoverUnitId) {
      const hoverCard = document.querySelector(
        `.monsters-card[data-unit-id="${String(monstersDetailHoverUnitId).replace(/"/g, '\\"')}"]`,
      );
      const hu = enriched.find((x) => String(x.unitId) === String(monstersDetailHoverUnitId));
      if (hu && hoverCard) renderMonstersDetail(hu, t, hoverCard);
    }
    if (typeof applyShareReadOnlyUi === 'function') applyShareReadOnlyUi();
  }

  function populateMonstersRoleFilter() {
    const sel = document.getElementById('monsters-filter-role');
    if (!sel) return;
    const cur = sel.value || '';
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allLbl = t.monstersRoleAll || 'All roles';
    const frag = document.createDocumentFragment();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = allLbl;
    frag.appendChild(allOpt);
    for (const role of MONSTER_ROLE_ORDER) {
      const opt = document.createElement('option');
      opt.value = role;
      opt.textContent = role;
      frag.appendChild(opt);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    if (cur && [...sel.options].some((o) => o.value === cur)) sel.value = cur;
  }

  function populateMonstersTagFilter() {
    const sel = document.getElementById('monsters-filter-tag');
    if (!sel) return;
    const cur = sel.value || '';
    pruneUnusedTagsRegistry();
    const tags = readTagsRegistry();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allLbl = t.monstersTagFilterAll || 'All tags';
    const frag = document.createDocumentFragment();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = allLbl;
    frag.appendChild(allOpt);
    for (const name of tags) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    if (cur && [...sel.options].some((o) => o.value === cur)) {
      sel.value = cur;
    } else if (cur) {
      const f = readMonstersFilters();
      if (f.tagFilter === cur) {
        f.tagFilter = '';
        writeMonstersFilters(f);
      }
    }
  }

  function populateMonstersSetFilter() {
    const sel = document.getElementById('monsters-filter-rune-set');
    if (!sel || sel.dataset.populated === '1') return;
    const setMap = window.SWRM && window.SWRM.SET_NAMES;
    if (!setMap) return;
    const names = [...new Set(Object.values(setMap).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b)),
    );
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const allLbl = t.monstersRuneSetAll || 'Any set';
    const frag = document.createDocumentFragment();
    const allOpt = document.createElement('option');
    allOpt.value = '';
    allOpt.textContent = allLbl;
    frag.appendChild(allOpt);
    for (const name of names) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      frag.appendChild(opt);
    }
    sel.innerHTML = '';
    sel.appendChild(frag);
    sel.dataset.populated = '1';
  }

  function syncMonstersFilterLabels(t) {
    const title = document.getElementById('lbl-monsters-title');
    if (title) title.textContent = t.monstersTitle || 'Monsters';
    const lead = document.getElementById('lbl-monsters-lead');
    if (lead) lead.textContent = t.monstersLead || '';
    const qLbl = document.getElementById('lbl-monsters-filter-q');
    if (qLbl) qLbl.textContent = t.monstersFilterSearch || 'Search';
    const elLbl = document.getElementById('lbl-monsters-filter-element');
    if (elLbl) elLbl.textContent = t.monstersFilterElement || 'Element';
    const locLbl = document.getElementById('lbl-monsters-filter-location');
    if (locLbl) locLbl.textContent = t.monstersFilterLocation || 'Location';
    const skillLbl = document.getElementById('lbl-monsters-filter-skill');
    if (skillLbl) skillLbl.textContent = t.monstersFilterSkill || 'Skills';
    const runeLbl = document.getElementById('lbl-monsters-filter-rune');
    if (runeLbl) runeLbl.textContent = t.monstersFilterRune || 'Runes';
    const setLbl = document.getElementById('lbl-monsters-filter-rune-set');
    if (setLbl) setLbl.textContent = t.monstersFilterRuneSet || 'Set';
    const tagLbl = document.getElementById('lbl-monsters-filter-tag');
    if (tagLbl) tagLbl.textContent = t.monstersFilterTag || 'Tag';
    const roleLbl = document.getElementById('lbl-monsters-filter-role');
    if (roleLbl) roleLbl.textContent = t.monstersFilterRole || 'Role';
    const markLbl = document.getElementById('lbl-monsters-filter-mark');
    if (markLbl) markLbl.textContent = t.monstersFilterMark || 'Marks';
    const advLbl = document.getElementById('lbl-monsters-filters-advanced');
    if (advLbl) advLbl.textContent = t.monstersFiltersAdvanced || 'Advanced filters';
    const fullSixField = document.getElementById('lbl-monsters-filter-full-six');
    if (fullSixField) fullSixField.textContent = t.monstersFilterRune || 'Runes';
    populateMonstersSetFilter();
    populateMonstersTagFilter();
    populateMonstersRoleFilter();
    const skillSel = document.getElementById('monsters-filter-skill');
    if (skillSel) {
      const opts = {
        '': t.monstersFilterSkillAll || t.monstersSkillAll || 'All skills',
        maxed: t.monstersFilterSkillMaxed || t.monstersSkillMaxed || 'Max skills',
        'needs-up':
          t.monstersFilterSkillNeeds || t.monstersSkillNeedsUp || 'Not maxed (skill-ups needed)',
      };
      skillSel.querySelectorAll('option').forEach((opt) => {
        if (opts[opt.value] != null) opt.textContent = opts[opt.value];
      });
    }
    const runeSel = document.getElementById('monsters-filter-rune');
    if (runeSel) {
      const opts = {
        '': t.monstersRuneAll || 'All runes',
        unruned: t.monstersRuneUnruned || 'Unruned',
        partial: t.monstersRunePartial || 'Partial (1–5)',
      };
      runeSel.querySelectorAll('option').forEach((opt) => {
        if (opts[opt.value] != null) opt.textContent = opts[opt.value];
      });
    }
    const setSel = document.getElementById('monsters-filter-rune-set');
    if (setSel) {
      const allOpt = setSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersRuneSetAll || 'Any set';
    }
    const tagSel = document.getElementById('monsters-filter-tag');
    if (tagSel) {
      const allOpt = tagSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersTagFilterAll || 'All tags';
    }
    const roleSel = document.getElementById('monsters-filter-role');
    if (roleSel) {
      const allOpt = roleSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersRoleAll || 'All roles';
    }
    const markSel = document.getElementById('monsters-filter-mark');
    if (markSel) {
      const markOpts = {
        '': t.monstersMarkAll || 'All',
        favorite: t.monstersMarkFavorite || '★ Favorites',
        food: t.monstersMarkFood || '🍖 Food',
      };
      markSel.querySelectorAll('option').forEach((opt) => {
        if (markOpts[opt.value] != null) opt.textContent = markOpts[opt.value];
      });
    }
    syncMonstersBulkBar(t);
    syncMonstersShowAllButton(readMonstersFilters().fullSixOnly, t);
    syncMonstersMinLevelInput(readMonstersFilters().minLevelMin, t);
    updateMonstersFilterSummary();
    const bulkMarksLbl = document.getElementById('lbl-monsters-bulk-marks');
    if (bulkMarksLbl) bulkMarksLbl.textContent = t.monstersBulkMarksGroup || 'Bulk marks';
    const bulkFavBtn = document.getElementById('monsters-bulk-favorite');
    if (bulkFavBtn) {
      const lbl = bulkFavBtn.querySelector('.monsters-bulk-mark-btn__label');
      if (lbl) lbl.textContent = t.monstersBulkFavorite || t.monstersFavorite || 'Favorite';
      bulkFavBtn.title = t.monstersFavorite || 'Favorite';
    }
    const bulkFoodBtn = document.getElementById('monsters-bulk-food');
    if (bulkFoodBtn) {
      const lbl = bulkFoodBtn.querySelector('.monsters-bulk-mark-btn__label');
      if (lbl) lbl.textContent = t.monstersBulkFood || 'Food';
      bulkFoodBtn.title = t.monstersFood || 'Food';
    }
    const bulkTagLbl = document.getElementById('lbl-monsters-bulk-tag');
    if (bulkTagLbl) bulkTagLbl.textContent = t.monstersFilterTag || 'Tag';
    const bulkApplyBtn = document.getElementById('monsters-bulk-tag-apply');
    if (bulkApplyBtn) bulkApplyBtn.textContent = t.monstersBulkTagApply || 'Apply';
    const bulkClearBtn = document.getElementById('monsters-bulk-clear');
    if (bulkClearBtn) bulkClearBtn.textContent = t.monstersBulkClear || 'Clear selection';
    const bulkStorageBtn = document.getElementById('monsters-bulk-storage');
    if (bulkStorageBtn) {
      const lbl = bulkStorageBtn.querySelector('.monsters-bulk-mark-btn__label');
      if (lbl) lbl.textContent = t.monstersBulkStorage || 'Storage';
      bulkStorageBtn.title = t.monstersStorageMark || 'Storage tag';
    }
    const lblCards = document.getElementById('lbl-monsters-view-cards');
    if (lblCards) lblCards.title = t.monstersViewCards || 'Cards';
    const btnCards = document.getElementById('monsters-view-cards');
    if (btnCards) btnCards.title = t.monstersViewCards || 'Cards';
    const btnTable = document.getElementById('monsters-view-table');
    if (btnTable) btnTable.title = t.monstersViewTable || 'Table';
    const lblGridSel = document.getElementById('lbl-monsters-grid-select-all');
    if (lblGridSel) lblGridSel.textContent = t.monstersTableSelectAll || 'Select all visible';
    const resetToolbar = document.getElementById('monsters-toolbar-reset-filters');
    if (resetToolbar) resetToolbar.textContent = t.tableResetFilters || 'Reset filters';
    const exportBtn = document.getElementById('btn-monsters-export-csv');
    if (exportBtn) exportBtn.textContent = t.exportTableCsv || 'Export CSV';
    const emptyClear = document.getElementById('monsters-empty-clear-filters');
    if (emptyClear) emptyClear.textContent = t.monstersEmptyClearFilters || 'Clear filters';
    const emptySearch = document.getElementById('monsters-empty-reset-search');
    if (emptySearch) emptySearch.textContent = t.monstersEmptyResetSearch || 'Reset search';
    const attrib = document.getElementById('lbl-monsters-attrib');
    if (attrib) {
      attrib.innerHTML =
        t.monstersSwarfarmAttrib ||
        'Monster names & icons from <a href="https://swarfarm.com" target="_blank" rel="noopener noreferrer">SWARFARM</a>.';
    }
    const elSel = document.getElementById('monsters-filter-element');
    if (elSel && elSel.options.length) {
      const allOpt = elSel.querySelector('option[value=""]');
      if (allOpt) allOpt.textContent = t.monstersElementAll || 'All elements';
    }
    const locSel = document.getElementById('monsters-filter-location');
    if (locSel && locSel.options.length >= 3) {
      const o0 = locSel.querySelector('option[value="all"]');
      const o1 = locSel.querySelector('option[value="active"]');
      const o2 = locSel.querySelector('option[value="storage"]');
      if (o0) o0.textContent = t.monstersLocationAll || 'All';
      if (o1) o1.textContent = t.monstersLocationActive || 'In use';
      if (o2) o2.textContent = t.monstersLocationStorage || 'Storage';
    }
  }

  function countMonstersActiveFilters(f) {
    let n = 0;
    if (f.element) n += 1;
    if (f.location && f.location !== 'all') n += 1;
    if (f.skillFilter) n += 1;
    if (f.runeFilter) n += 1;
    if (f.runeSet) n += 1;
    if (f.tagFilter) n += 1;
    if (f.roleFilter) n += 1;
    if (f.markFilter) n += 1;
    if (f.fullSixOnly) n += 1;
    if (f.minLevelMin > 0) n += 1;
    return n;
  }

  function monstersFilterChipDefs(f, t) {
    const chips = [];
    const q = (f.q || '').trim();
    if (q) chips.push({ key: 'q', label: `"${q}"` });
    if (f.element) chips.push({ key: 'element', label: f.element });
    if (f.minLevelMin > 0) {
      const tpl = t.monstersFilterMinLevelChip || 'Lv {n}+';
      chips.push({ key: 'minLevelMin', label: tpl.replace(/\{n\}/g, String(f.minLevelMin)) });
    }
    if (f.location && f.location !== 'all') {
      const locMap = { active: t.monstersFilterLocActive || 'In use', storage: t.monstersFilterLocStorage || 'Storage' };
      chips.push({ key: 'location', label: locMap[f.location] || f.location });
    }
    if (f.fullSixOnly) chips.push({ key: 'fullSixOnly', label: t.monstersFilterSixOnly || '6/6 runes' });
    if (f.skillFilter) chips.push({ key: 'skillFilter', label: f.skillFilter });
    if (f.runeFilter) chips.push({ key: 'runeFilter', label: f.runeFilter });
    if (f.runeSet) chips.push({ key: 'runeSet', label: f.runeSet });
    if (f.tagFilter) chips.push({ key: 'tagFilter', label: f.tagFilter });
    if (f.roleFilter) chips.push({ key: 'roleFilter', label: f.roleFilter });
    if (f.markFilter) {
      const markMap = { favorite: '★', food: '🍖' };
      chips.push({ key: 'markFilter', label: markMap[f.markFilter] || f.markFilter });
    }
    return chips;
  }

  function clearMonstersFilterChip(key) {
    switch (key) {
      case 'q':
        resetMonstersSearchQuery();
        break;
      case 'element': {
        const el = document.getElementById('monsters-filter-element');
        if (el) el.value = '';
        break;
      }
      case 'minLevelMin': {
        const lvl = document.getElementById('monsters-filter-min-level');
        if (lvl) lvl.value = '';
        break;
      }
      case 'location': {
        const loc = document.getElementById('monsters-filter-location');
        if (loc) loc.value = 'all';
        break;
      }
      case 'fullSixOnly': {
        const six = document.getElementById('monsters-filter-full-six');
        if (six) {
          six.setAttribute('aria-pressed', 'false');
          six.classList.remove('monsters-toolbar-btn--active');
        }
        break;
      }
      case 'skillFilter':
        document.getElementById('monsters-filter-skill').value = '';
        break;
      case 'runeFilter':
        document.getElementById('monsters-filter-rune').value = '';
        break;
      case 'runeSet':
        document.getElementById('monsters-filter-rune-set').value = '';
        break;
      case 'tagFilter':
        document.getElementById('monsters-filter-tag').value = '';
        break;
      case 'roleFilter':
        document.getElementById('monsters-filter-role').value = '';
        break;
      case 'markFilter':
        document.getElementById('monsters-filter-mark').value = '';
        break;
      default:
        break;
    }
  }

  function renderMonstersActiveFilterChips() {
    const row = document.getElementById('monsters-active-filters');
    const host = document.getElementById('monsters-filter-chips');
    if (!row || !host) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const f = readMonstersFiltersFromDom();
    const chips = monstersFilterChipDefs(f, t);
    if (!chips.length) {
      host.innerHTML = '';
      row.hidden = true;
      return;
    }
    row.hidden = false;
    host.innerHTML = chips
      .map(
        (c) =>
          `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-filter-chip-remove="${escapeHtml(c.key)}" aria-label="Remove">✕</button></span>`,
      )
      .join('');
  }

  function updateMonstersFilterSummary() {
    const f = readMonstersFiltersFromDom();
    const n = countMonstersActiveFilters(f);
    const countEl = document.getElementById('monsters-filters-active-count');
    const moreBtn = document.getElementById('monsters-more-filters-btn');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const activeTpl = t.monstersFiltersActive || '{n}';
    if (countEl) {
      countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
      countEl.hidden = !n;
    }
    if (moreBtn) moreBtn.classList.toggle('monsters-toolbar-btn--filters-active', n > 0);
    renderMonstersActiveFilterChips();
  }

  function readMonstersFiltersFromDom() {
    const sixBtn = document.getElementById('monsters-filter-full-six');
    const lvlInp = document.getElementById('monsters-filter-min-level');
    const fullSixOnly = sixBtn?.getAttribute('aria-pressed') === 'true';
    const rawLvl = lvlInp?.value != null ? String(lvlInp.value).trim() : '';
    const parsed = rawLvl === '' ? 0 : Math.round(Number(rawLvl));
    const minLevelMin =
      Number.isFinite(parsed) && parsed > 0 ? Math.max(1, Math.min(40, parsed)) : 0;
    return {
      q: document.getElementById('monsters-filter-q')?.value || '',
      element: document.getElementById('monsters-filter-element')?.value || '',
      location: document.getElementById('monsters-filter-location')?.value || 'all',
      sort: readMonstersFilters().sort || 'name',
      skillFilter: document.getElementById('monsters-filter-skill')?.value || '',
      runeFilter: document.getElementById('monsters-filter-rune')?.value || '',
      runeSet: document.getElementById('monsters-filter-rune-set')?.value || '',
      tagFilter: document.getElementById('monsters-filter-tag')?.value || '',
      roleFilter: document.getElementById('monsters-filter-role')?.value || '',
      markFilter: document.getElementById('monsters-filter-mark')?.value || '',
      fullSixOnly,
      minLevelMin,
    };
  }

  function exportMonstersCsv() {
    const cache = monstersEnrichedCache || [];
    if (!cache.length) return;
    const filters = readMonstersFiltersFromDom();
    const filtered = filterMonstersList(cache, filters);
    const view = readMonstersView();
    const visible =
      view === 'table' ? sortMonstersForTable(filtered) : sortMonstersList(filtered, filters.sort);
    if (!visible.length) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    function cellPart(s) {
      const raw = String(s ?? '');
      if (/[,"\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    }
    const headers = [
      t.monstersColName || 'Name',
      t.monstersColLevel || 'Lv',
      t.monstersColElement || 'Element',
      t.monstersColRole || 'Archetype',
      t.monstersColRunes || 'Runes',
      t.monstersColDevilmons || 'Devilmons',
      t.monstersColMarks || 'Marks',
      t.monstersColTags || 'Tags',
    ];
    const lines = [headers.map(cellPart).join(',')];
    for (const u of visible) {
      const marks = [];
      if (u.favorite) marks.push('★');
      if (u.food) marks.push('🍖');
      if (u.inStorage) marks.push('▣');
      else if (u.storageMark) marks.push('▣*');
      const skillUps = u.skillUpsNeeded > 0 ? String(u.skillUpsNeeded) : '0';
      lines.push(
        [
          u.displayName,
          u.level,
          u.metaElement || '',
          u.metaArchetype || '',
          String(u.equippedCount || 0),
          skillUps,
          marks.join(' ') || '—',
          (u.customTags || []).join(', ') || '—',
        ]
          .map(cellPart)
          .join(','),
      );
    }
    const csv = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sw-monsters-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }

  function bindMonstersToolbar() {
    const onFilter = () => {
      monstersSearchHighlight = (document.getElementById('monsters-filter-q')?.value || '').trim().toLowerCase();
      writeMonstersFilters(readMonstersFiltersFromDom());
      updateMonstersFilterSummary();
      renderMonstersPanel();
    };
    monstersSearchHighlight = (document.getElementById('monsters-filter-q')?.value || '').trim().toLowerCase();
    document.getElementById('monsters-filter-q')?.addEventListener('input', onFilter);
    document.getElementById('monsters-filter-element')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-min-level')?.addEventListener('input', onFilter);
    document.getElementById('monsters-filter-min-level')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-location')?.addEventListener('change', onFilter);
    document.getElementById('monsters-toolbar-reset-filters')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      resetMonstersToolbarFilters(t);
      renderMonstersPanel();
    });
    document.getElementById('btn-monsters-export-csv')?.addEventListener('click', exportMonstersCsv);
    document.getElementById('monsters-filter-skill')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-rune')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-rune-set')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-tag')?.addEventListener('change', onFilter);
    document.getElementById('monsters-filter-role')?.addEventListener('change', onFilter);
    document.getElementById('monsters-bulk-favorite')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      if (!monstersBulkSelected.size) return;
      bulkToggleFavoriteFlag([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-food')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      if (!monstersBulkSelected.size) return;
      bulkToggleFoodFlag([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-storage')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      if (!monstersBulkSelected.size) return;
      bulkToggleStorageMark([...monstersBulkSelected]);
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-tag-apply')?.addEventListener('click', () => {
      if (typeof isShareReadOnly === 'function' && isShareReadOnly()) return;
      const input = document.getElementById('monsters-bulk-tag-input');
      const val = input?.value || '';
      if (!monstersBulkSelected.size || !normalizeCustomTag(val)) return;
      bulkAddCustomTag([...monstersBulkSelected], val);
      registerCustomTag(val);
      populateMonstersTagFilter();
      if (input) input.value = '';
      renderMonstersPanel();
    });
    document.getElementById('monsters-bulk-clear')?.addEventListener('click', () => {
      clearAllMonstersSelection();
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersBulkBar(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-filter-mark')?.addEventListener('change', onFilter);
    document.getElementById('monsters-layout')?.addEventListener('click', (e) => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      if (e.target && e.target.id === 'monsters-empty-clear-filters') {
        resetMonstersToolbarFilters(t);
        renderMonstersPanel();
      } else if (e.target && e.target.id === 'monsters-empty-reset-search') {
        resetMonstersSearchQuery();
        onFilter();
      }
    });
    document.getElementById('monsters-filter-full-six')?.addEventListener('click', () => {
      const btn = document.getElementById('monsters-filter-full-six');
      if (!btn) return;
      const next = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', next ? 'true' : 'false');
      btn.classList.toggle('monsters-toolbar-btn--active', next);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersShowAllButton(!next, t);
      onFilter();
    });
    document.getElementById('monsters-filter-clear-all')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      resetMonstersToolbarFilters(t);
      renderMonstersPanel();
    });
    document.getElementById('monsters-filter-chips')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter-chip-remove]');
      if (!btn) return;
      clearMonstersFilterChip(btn.dataset.filterChipRemove);
      writeMonstersFilters(readMonstersFiltersFromDom());
      updateMonstersFilterSummary();
      renderMonstersPanel();
    });
    const onMonstersFiltersClose = () => {
      const f = readMonstersFiltersFromDom();
      writeMonstersFilters(f);
      updateMonstersFilterSummary();
      renderMonstersPanel();
    };
    bindFiltersPopover('monsters-more-filters-btn', 'monsters-filters-popover', {
      onClose: onMonstersFiltersClose,
    });
    document.getElementById('monsters-filters-drawer-reset')?.addEventListener('click', () => {
      clearMonstersPanelFilters();
      const elSel = document.getElementById('monsters-filter-element');
      if (elSel) elSel.value = '';
      const lvlInp = document.getElementById('monsters-filter-min-level');
      if (lvlInp) lvlInp.value = '';
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      syncMonstersMinLevelInput(0, t);
      writeMonstersFilters(readMonstersFiltersFromDom());
      updateMonstersFilterSummary();
      renderMonstersPanel();
    });
    document.getElementById('monsters-select-all-visible')?.addEventListener('click', () => {
      if (typeof selectAllVisibleMonsters === 'function') selectAllVisibleMonsters();
    });
    document.getElementById('monsters-bulk-tag-toggle')?.addEventListener('click', () => {
      const menu = document.getElementById('monsters-bulk-tag-menu');
      if (!menu) return;
      const tags = typeof readTagsRegistry === 'function' ? readTagsRegistry() : [];
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      if (!tags.length) {
        const val = window.prompt(t.monstersBulkTagPrompt || 'Tag name');
        if (val && monstersBulkSelected.size) {
          bulkAddCustomTag([...monstersBulkSelected], val);
          registerCustomTag(val);
          populateMonstersTagFilter();
          renderMonstersPanel();
        }
        return;
      }
      menu.innerHTML = tags
        .map(
          (tag) =>
            `<button type="button" class="monsters-selection-tag__option" data-bulk-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`,
        )
        .join('');
      const open = menu.hidden;
      menu.hidden = !open;
      document.getElementById('monsters-bulk-tag-toggle')?.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.getElementById('monsters-bulk-tag-menu')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-bulk-tag]');
      if (!btn || !monstersBulkSelected.size) return;
      bulkAddCustomTag([...monstersBulkSelected], btn.dataset.bulkTag);
      document.getElementById('monsters-bulk-tag-menu').hidden = true;
      renderMonstersPanel();
    });
    document.getElementById('monsters-view-cards')?.addEventListener('click', () => {
      writeMonstersView('cards');
      syncMonstersViewToggle('cards');
      renderMonstersPanel();
    });
    document.getElementById('monsters-view-table')?.addEventListener('click', () => {
      writeMonstersView('table');
      syncMonstersViewToggle('table');
      renderMonstersPanel();
    });
    syncMonstersViewToggle(readMonstersView());
    const t0 = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    syncMonstersShowAllButton(readMonstersFilters().fullSixOnly, t0);
    syncMonstersMinLevelInput(readMonstersFilters().minLevelMin, t0);
    updateMonstersFilterSummary();
    bindMonstersDetailFloat();
    bindMonstersGridDelegation();
  }

  bindMonstersToolbar();
  bindMonstersGridDelegation();
  initMonstersHubTabs();
  initTeamsPanel();

})();
