// =============================================
// ui.js — Tabs, Dashboard, Table, Settings
// =============================================

(function() {
  const APP_LANG_KEY = 'swrm_app_lang_v1';

  const { parseSWEX, extractSwexSummary, countAllSwexRunes, processAll,
          STAT_NAMES, SET_NAMES, GRADE_SHORT, saveSettings,
          DEFAULT_STAT_CONSTANTS, DEFAULT_THRESHOLDS, DEFAULT_FORMULAS,
          DEFAULT_ROLES, DEFAULT_REAPP, DEFAULT_GRIND, DEFAULT_GEM_META, TRANSLATIONS } = window.SWRM;

  let allRunes = [];
  let processedRunes = [];
  let stage    = 'Mid';
  let sortKey  = 'eff';
  let sortDir  = 'desc';
  /** First paint of Rune Table: this many rows; user can load the rest explicitly. */
  const RUNE_TABLE_PAGE = 500;
  const RUNE_TABLE_SORT_KEYS = new Set([
    'grade', 'set', 'level', 'slot', 'main', 'eff', 'role', 'verdict', 's1', 's2', 's3', 's4',
  ]);
  const RUNE_TABLE_ANCIENT_ONLY_KEY = 'swrm_rune_table_ancient_only_v1';
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
  const TOP_SPD_PER_SLOT = 3;
  const DASH_UNIFIED_DIST_KEY = 'swrm_dashboard_unified_dist_v1';
  /** Legacy Role/Sets-only toggle — migrated once into {@link DASH_UNIFIED_DIST_KEY}. */
  const DASH_DIST_TAB_LEGACY_KEY = 'swrm_dashboard_dist_tab_v1';
  let currentLang = localStorage.getItem(APP_LANG_KEY) || localStorage.getItem('swrm-lang') || 'en';
  if (!['en', 'ru', 'fr'].includes(currentLang)) currentLang = 'en';
  let currentTheme = localStorage.getItem('swrm-theme') || 'dark';

  // ===================== THEME (header sun / moon) =====================
  function applyThemeDom() {
    const sunBtn = document.getElementById('theme-sun');
    const moonBtn = document.getElementById('theme-moon');
    if (currentTheme === 'light') {
      document.body.classList.add('light-theme');
      sunBtn?.classList.add('is-active');
      sunBtn?.setAttribute('aria-pressed', 'true');
      moonBtn?.classList.remove('is-active');
      moonBtn?.setAttribute('aria-pressed', 'false');
    } else {
      document.body.classList.remove('light-theme');
      moonBtn?.classList.add('is-active');
      moonBtn?.setAttribute('aria-pressed', 'true');
      sunBtn?.classList.remove('is-active');
      sunBtn?.setAttribute('aria-pressed', 'false');
    }
  }

  function setTheme(mode) {
    currentTheme = mode === 'dark' ? 'dark' : 'light';
    localStorage.setItem('swrm-theme', currentTheme);
    applyThemeDom();
  }

  function initTheme() {
    applyThemeDom();
  }

  function updateHeaderThemeA11y(t) {
    const group = document.getElementById('header-theme-group');
    const sun = document.getElementById('theme-sun');
    const moon = document.getElementById('theme-moon');
    if (group) group.setAttribute('aria-label', t.themeGroupAria || t.theme || 'Theme');
    if (sun) sun.setAttribute('title', t.themeLightTitle || 'Light theme');
    if (moon) moon.setAttribute('title', t.themeDarkTitle || 'Dark theme');
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
  }

  const RULES_SUBTAB_KEY = 'swrm_rules_subtab_v1';
  let rulesSubtabsBound = false;

  function normalizeRulesSubtabId(id) {
    if (id === 'verdict' || id === 'roles' || id === 'engine') return id;
    return 'engine';
  }

  function setRulesSubtab(id) {
    const v = normalizeRulesSubtabId(id);
    try { sessionStorage.setItem(RULES_SUBTAB_KEY, v); } catch (e) { /* ignore */ }
    document.querySelectorAll('#tab-settings .rules-subtab').forEach((btn) => {
      const on = btn.dataset.rulesSubtab === v;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('#tab-settings .rules-subpanel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.rulesSubtab === v);
    });
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
    setRulesSubtab(saved);
  }

  const CHANGELOG_SUBTAB_KEY = 'swrm_changelog_subtab_v1';
  let changelogSubtabsBound = false;

  function setChangelogSubtab(subtabId) {
    const nav = document.getElementById('changelog-subtabs');
    if (!nav) return;
    const v = subtabId === 'roadmap' ? 'roadmap' : 'shipped';
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      const active = btn.dataset.changelogSubtab === v;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('#tab-changelog .rules-subpanel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.changelogSubtab === v);
    });
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
    setChangelogSubtab(saved);
  }

  const GUIDE_SUBTAB_KEY = 'swrm_guide_subtab_v1';
  let guideSubtabsBound = false;

  function normalizeGuideSubtabId(id) {
    if (
      id === 'start' ||
      id === 'dashboard' ||
      id === 'progression' ||
      id === 'table' ||
      id === 'rules' ||
      id === 'tips'
    ) {
      return id;
    }
    return 'start';
  }

  function setGuideSubtab(subtabId) {
    const nav = document.getElementById('guide-subtabs');
    if (!nav) return;
    const v = normalizeGuideSubtabId(subtabId);
    nav.querySelectorAll('.rules-subtab').forEach((btn) => {
      const active = btn.dataset.guideSubtab === v;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll('#tab-guide .rules-subpanel[data-guide-subtab]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.guideSubtab === v);
    });
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
    setGuideSubtab(saved);
  }

  /** Main nav tab ids — kept in URL as `#settings` etc. so refresh restores the same view. */
  const MAIN_TAB_IDS = ['dashboard', 'runetable', 'settings', 'guide', 'changelog', 'app-settings'];

  function splitMainHash() {
    const raw = (window.location.hash || '').replace(/^#/, '').trim();
    if (!raw) return { tab: null, query: '' };
    const qm = raw.indexOf('?');
    const tabPart = (qm === -1 ? raw : raw.slice(0, qm)).trim();
    const query = qm === -1 ? '' : raw.slice(qm + 1);
    let h = tabPart;
    if (h.startsWith('tab-')) h = h.slice(4);
    return { tab: MAIN_TAB_IDS.includes(h) ? h : null, query };
  }

  function mainTabIdFromHash() {
    return splitMainHash().tab;
  }

  /**
   * @param {string} tabId
   * @param {{ writeHash?: boolean }} [options] pass writeHash: true when user (or app) chose a tab and URL should update
   */
  function showMainTab(tabId, options) {
    const opts = options || {};
    const writeHash = opts.writeHash === true;
    const pushHistory = opts.pushHistory === true;
    const id = MAIN_TAB_IDS.includes(tabId) ? tabId : 'dashboard';
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === id);
    });
    document.querySelectorAll('.tab-content').forEach((el) => {
      el.classList.toggle('hidden', el.id !== `tab-${id}`);
    });
    if (id === 'settings') {
      const rulesRoot = document.getElementById('tab-settings');
      if (rulesRoot) rulesRoot.scrollTop = 0;
    }
    if (id === 'changelog') {
      const chRoot = document.getElementById('tab-changelog');
      if (chRoot) chRoot.scrollTop = 0;
    }
    if (id === 'guide') {
      const guideRoot = document.getElementById('tab-guide');
      if (guideRoot) guideRoot.scrollTop = 0;
    }
    if (id === 'app-settings') {
      renderDbSlots();
    }
    if (writeHash) {
      try {
        const base = window.location.pathname + window.location.search;
        let url;
        if (id === 'dashboard') url = base;
        else if (id === 'runetable') url = `${base}#runetable${buildRuneTableQuerySuffix()}`;
        else url = `${base}#${id}`;
        if (pushHistory) history.pushState(null, '', url);
        else history.replaceState(null, '', url);
      } catch (e) { /* ignore */ }
    }

    if (id === 'runetable') {
      const { query } = splitMainHash();
      if (query) applyRuneTableQueryParams(new URLSearchParams(query));
      updateSortHeaderClasses();
      updateRuneTableFilterIndicators();
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    }
  }

  // ===================== LANGUAGE =====================
  function updateLanguage(lang) {
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
    
    // Update tabs - safely check if elements exist
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) dashboardTab.textContent = t.dashboard;
    const runeTableTab = document.querySelector('[data-tab="runetable"]');
    if (runeTableTab) runeTableTab.textContent = t.runeTable;
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) settingsTab.textContent = t.runeRules;
    const guideTab = document.querySelector('[data-tab="guide"]');
    if (guideTab) guideTab.textContent = t.guide;
    const changelogTab = document.querySelector('[data-tab="changelog"]');
    if (changelogTab) changelogTab.textContent = t.changelog;
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
    const roadmapLead = document.getElementById('lbl-changelog-roadmap-lead');
    if (roadmapLead) roadmapLead.textContent = t.changelogRoadmapLead || '';
    const subShipped = document.getElementById('lbl-changelog-subtab-shipped');
    if (subShipped) subShipped.textContent = t.changelogSubtabShipped || 'Releases';
    const subRoadmap = document.getElementById('lbl-changelog-subtab-roadmap');
    if (subRoadmap) subRoadmap.textContent = t.changelogSubtabRoadmap || 'Roadmap';
    const chNav = document.getElementById('changelog-subtabs');
    if (chNav) chNav.setAttribute('aria-label', t.changelogSubtabsAria || 'Changelog');
    const appSettingsTab = document.querySelector('[data-tab="app-settings"]');
    if (appSettingsTab) appSettingsTab.textContent = t.appSettings;

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
    applyDemoBannerTextFromTranslations();
    syncDemoBannerVisibility();
    applySwrmDropVeilTranslations();
  }

  function updateDashboardLabels() {
    const t = TRANSLATIONS[currentLang];

    const tv = document.getElementById('dash-unified-tab-verdict');
    const tr = document.getElementById('dash-unified-tab-roles');
    const ts = document.getElementById('dash-unified-tab-sets');
    const tsl = document.getElementById('dash-unified-tab-slots');
    const te = document.getElementById('dash-unified-tab-eff');
    if (tv) tv.textContent = t.dashboardDistVerdict || '';
    if (tr) tr.textContent = t.dashboardDistRoles || '';
    if (ts) ts.textContent = t.dashboardDistSets || '';
    if (tsl) tsl.textContent = t.dashboardDistSlots || '';
    if (te) te.textContent = t.dashboardDistEff || '';
    const uniTabs = document.getElementById('dash-unified-tabs');
    const unifiedBlockTitle = document.getElementById('lbl-dash-unified-block-title');
    if (unifiedBlockTitle) unifiedBlockTitle.textContent = t.dashboardUnifiedBlockTitle || '';
    if (uniTabs) uniTabs.setAttribute('aria-label', t.dashboardUnifiedDistAria || '');

    const lblTopSpd = document.getElementById('lbl-top-spd-title');
    if (lblTopSpd) lblTopSpd.textContent = t.dashboardTopSpdTitle || '';

    const topSpdSetSelect = document.getElementById('top-spd-set-select');
    if (topSpdSetSelect) {
      topSpdSetSelect.setAttribute('aria-label', t.dashboardTopSpdSetAria || 'Rune set');
    }

    const hintTopSpd = document.getElementById('lbl-top-spd-hint');
    if (hintTopSpd) hintTopSpd.textContent = t.dashboardTopSpdHint || '';

    const vhint = document.getElementById('lbl-dash-unified-verdict-hint');
    if (vhint) vhint.textContent = t.dashboardVerdictStackHint || '';

    const slotPaneHint = document.getElementById('lbl-dash-slot-pane-hint');
    if (slotPaneHint) slotPaneHint.textContent = t.dashboardSlotPaneHint || '';

    const btnAll = document.getElementById('btn-dash-open-all-runes');
    if (btnAll) btnAll.textContent = t.dashboardOpenAllRunes || 'Open table';

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
    applyStageAdvisorCollapsed(!readStageProgressionExpanded());
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

    const resetConstBtn = document.getElementById('btn-reset-stat-constants');
    if (resetConstBtn) resetConstBtn.textContent = t.resetConstantsButton || '';
    const resetConstHint = document.getElementById('lbl-reset-constants-hint');
    if (resetConstHint) resetConstHint.textContent = t.resetConstantsHint || '';
    
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
    // Update language label in app settings tab
    const langLabel = document.querySelector('#tab-app-settings .db-settings-header label:first-child');
    if (langLabel) {
      const select = document.getElementById('app-language');
      if (select) {
        select.value = currentLang;
        const textNode = langLabel.childNodes[0];
        if (textNode) {
          textNode.textContent = t.language + ' ';
        }
      }
    }
    
    updateHeaderThemeA11y(t);

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

  // ===================== TABS =====================
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      showMainTab(btn.dataset.tab, { writeHash: true });
    });
  });

  window.addEventListener('hashchange', () => {
    const id = mainTabIdFromHash();
    if (id) showMainTab(id);
    else showMainTab('dashboard');
  });

  window.addEventListener('popstate', () => {
    const id = mainTabIdFromHash() || 'dashboard';
    showMainTab(id);
  });

  // ===================== STAGE =====================
  document.getElementById('stage-select').addEventListener('change', e => {
    stage = e.target.value;
    if (allRunes.length) reprocess();
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
    stage = recommendedStage;
    if (allRunes.length) reprocess();

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

  function applyDashboardUnifiedTab(which) {
    const keys = ['verdict', 'roles', 'sets', 'slots', 'eff'];
    const active = keys.includes(which) ? which : 'verdict';
    keys.forEach((k) => {
      const btn = document.getElementById(`dash-unified-tab-${k}`);
      const pane = document.getElementById(`dash-pane-${k}`);
      if (!btn || !pane) return;
      const on = k === active;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
      pane.toggleAttribute('hidden', !on);
      pane.classList.toggle('is-active', on);
    });
  }

  function initDashboardUnifiedTabs() {
    applyDashboardUnifiedTab(readDashboardUnifiedTab());
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

  document.getElementById('btn-dash-open-all-runes')?.addEventListener('click', () => {
    navigateToRuneTableWithFilters({
      verdict: '',
      role: '',
      gradeStr: gradeStrForDashboardNav(),
      set: '',
      slot: '',
      clearSearch: true,
    });
  });

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
    if (setRow || vrow || row) {
      e.preventDefault();
      (setRow || vrow || row).click();
    }
  });

  document.getElementById('top-spd-set-select')?.addEventListener('change', (e) => {
    const v = e.target.value || '';
    try {
      localStorage.setItem(TOP_SPD_STORAGE_KEY, v);
    } catch (err) { /* ignore */ }
    renderTopSpdGrid(
      document.getElementById('top-spd-grid'),
      getVisibleRunes(),
      v,
      TRANSLATIONS[currentLang] || TRANSLATIONS.en,
    );
  });

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

  function reprocess() {
    processedRunes = processAll(allRunes, stage, window.SWRM.settings);
    window.SWRM.debugLastProcessedRunes = processedRunes;
    const visible = getVisibleRunes();
    renderDashboard(visible, { animateCharts: true });
    renderTable(visible);
  }

  const LS_USING_DEMO = 'swrm_using_demo_dataset_v1';
  const LS_USER_LOADED_REAL = 'swrm_user_loaded_real_swex_v1';
  const SS_DEMO_BANNER_DISMISS = 'swrm_demo_banner_dismissed_session';

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
   * Fetch assets/demo.json, validate, persist like a real load, mark demo mode.
   * @param {{ keepTab?: boolean }} [options]
   */
  async function installEmbeddedDemoDataset(options = {}) {
    let jsonText;
    try {
      const demoPaths = ['assets/demo.json', 'demo.json'];
      let lastErr = null;
      for (const rel of demoPaths) {
        try {
          const res = await fetch(new URL(rel, window.location.href), { cache: 'no-store' });
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
      const label = t.demoDatasetSlotLabel || 'Example SWEX export';
      await persistSwexPayloadToSlots(jsonText, label, json);
      markUsingDemoDataset(true);
      uiAfterSuccessfulRuneRestore({ name: label, id: 1 }, { keepTab: options.keepTab === true });
      applyDemoBannerTextFromTranslations();
      syncDemoBannerVisibility();
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
    reprocess();
    return true;
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
    syncDemoBannerVisibility();
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
      el.classList.remove('swrm-toast--in');
      el.classList.add('swrm-toast--out');
      setTimeout(() => el.remove(), 320);
    };

    closeBtn.addEventListener('click', dismiss);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('swrm-toast--in'));
    });
    if (duration > 0) hideTimer = setTimeout(dismiss, duration);
  }

  function getVisibleRunes() {
    return processedRunes.filter((r) => {
      if (r.level < globalMinLevel) return false;
      const g = typeof r.grade === 'number' ? r.grade : 0;
      return g >= globalGradeMin && g <= globalGradeMax;
    });
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
    const shareTitle = document.createElement('h3');
    shareTitle.className = 'slot-dist-section-title';
    shareTitle.textContent = (tloc && tloc.dashboardSlotShareTitle) || 'Runes by slot';
    shareSection.appendChild(shareTitle);

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
      const cell = document.createElement('div');
      cell.className = 'slot-share-cell';
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
    for (let slot = 1; slot <= 6; slot++) {
      const col = document.createElement('div');
      col.className = 'top-spd-slot-col';
      const hdr = document.createElement('div');
      hdr.className = 'top-spd-slot-hdr';
      hdr.textContent = ((tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}').replace('{n}', String(slot));
      col.appendChild(hdr);
      const inSlot = filtered.filter((r) => (r.slot | 0) === slot);
      inSlot.sort((a, b) => sumRuneSpdSubs(b) - sumRuneSpdSubs(a));
      const pick = inSlot.slice(0, TOP_SPD_PER_SLOT);
      if (!pick.length) {
        const empty = document.createElement('div');
        empty.className = 'top-spd-slot-empty';
        empty.textContent = (tloc && tloc.dashboardTopSpdNoRunes) || '\u2014';
        col.appendChild(empty);
      } else {
        for (let pi = 0; pi < pick.length; pi++) {
          const r = pick[pi];
          const spd = sumRuneSpdSubs(r);
          const eff = Number.isFinite(r.eff) ? r.eff.toFixed(1) : '\u2014';
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'top-spd-chip';
          btn.textContent = `+${spd} SPD · ${eff}% · ${r.gradeStr || ''}`;
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

  /** @param {boolean} collapsed — true = one-line bar only */
  function applyStageAdvisorCollapsed(collapsed) {
    const root = document.getElementById('stage-advisor');
    const btn = document.getElementById('btn-stage-compact');
    const expandedWrap = document.getElementById('stage-advisor-expanded-wrap');
    if (!root || !btn) return;
    root.classList.toggle('is-compact', collapsed);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (expandedWrap) {
      if (collapsed) expandedWrap.setAttribute('aria-hidden', 'true');
      else expandedWrap.removeAttribute('aria-hidden');
    }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    btn.title = collapsed ? (t.stageCompactExpand || '') : (t.stageCompactCollapse || '');
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
    const effVals = [];
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
    }
    effVals.sort((a, b) => a - b);
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
      medianEff: medianSorted(effVals),
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
    lines.push(String(t.title || 'SW Rune Master'));
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
    lines.push(`${t.footerVersionLabel || 'Build'}: ${(window.SWRM && window.SWRM.APP_VERSION) || ''}`);

    return lines.join('\n');
  }

  // ===================== DASHBOARD =====================
  function renderDashboard(runes, opts) {
    const animateCharts = !!(opts && opts.animateCharts);
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
        const seg = String(recStage || '').toLowerCase();
        if (seg === 'early' || seg === 'mid' || seg === 'late') {
          scoreInline.classList.add(`stage-score-inline--${seg}`);
        }
      }
    }

    if (scoreFootnote) {
      const foot = String(tloc.stageCombinedScoreFootnote || '').trim();
      scoreFootnote.textContent = foot;
      scoreFootnote.hidden = !foot || !hasProg;
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
        applyStageAdvisorCollapsed(true);
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

    /** Native tooltip: children receive hover, so duplicate title onto card + headline + values (Sheets parity text from hidden desc or i18n). */
    const attachMetricCardTooltip = (descId, fallback) => {
      const desc = document.getElementById(descId);
      const card = desc && desc.closest('.stage-metric-card');
      if (!card) return;
      let tip = String(desc.textContent || '').replace(/\s+/g, ' ').trim();
      if (!tip) tip = String(fallback || '').replace(/\s+/g, ' ').trim();
      const safe = tip ? tip.replace(/"/g, '\u2019') : '';
      const targets = [
        card,
        ...card.querySelectorAll('.stage-metric-card-head, .stage-metric-val, .stage-metric-contrib, .stage-metric-weight, .stage-metric-icon'),
      ];
      targets.forEach((node) => {
        if (!node) return;
        if (safe) node.setAttribute('title', safe);
        else node.removeAttribute('title');
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
      medianEff,
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
    let slotShareAnimTargets = null;

    const verdictChartEl = document.getElementById('verdict-chart');
    if (verdictChartEl) {
      oldRectsVerdict = animateCharts ? snapshotKeyedRowRects(verdictChartEl, 'data-dash-verdict') : null;
      const prevVerdictW = animateCharts
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
      const maxV = Math.max(...vRows.map((x) => x.c), 1);
      verdictBarTargets = new Map();
      const openHint = String((tloc.dashboardOpenTableHint || '').trim());
      for (let i = 0; i < vRows.length; i++) {
        const { v, c } = vRows[i];
        const avgMu = verdictMeanEff(verdictEff, v);
        const avg =
          c > 0 && avgMu != null && Number.isFinite(avgMu) ? avgMu.toFixed(1) : '-';
        const pct = ((c / maxV) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        verdictBarTargets.set(v, pctNum);
        const startPct = !animateCharts
          ? pctNum
          : prevVerdictW.has(v)
            ? prevVerdictW.get(v)
            : 0;
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
      const prevRoleW = animateCharts ? snapshotRowBarWidthMap(roleEl, 'data-dash-role') : new Map();
      roleEl.innerHTML = '';
      const sortedRoles = Object.keys(roleCounts).sort((a, b) => (roleCounts[b] || 0) - (roleCounts[a] || 0));
      const maxCount = Math.max(...sortedRoles.map((rr) => roleCounts[rr] || 0), 1);
      roleBarTargets = new Map();
      for (const role of sortedRoles) {
        const cnt = roleCounts[role] || 0;
        const avg = roleEff[role]
          ? (roleEff[role].reduce((a, b) => a + b, 0) / roleEff[role].length).toFixed(1)
          : '-';
        const pct = ((cnt / maxCount) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        roleBarTargets.set(role, pctNum);
        const startPct = !animateCharts
          ? pctNum
          : prevRoleW.has(role)
            ? prevRoleW.get(role)
            : 0;
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
      const prevSetW = animateCharts ? snapshotRowBarWidthMap(setEl, 'data-dash-set') : new Map();
      setEl.innerHTML = '';
      const maxSet = Math.max(...setOrder.map((nm) => setCounts[nm] || 0), 1);
      setBarTargets = new Map();
      const openHintSets = String((tloc.dashboardOpenTableHint || '').trim());
      for (const name of setOrder) {
        const cnt = setCounts[name] || 0;
        const effList = setEff[name];
        const avg =
          effList && effList.length
            ? (effList.reduce((a, b) => a + b, 0) / effList.length).toFixed(1)
            : '-';
        const pct = ((cnt / maxSet) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        const enc = encodeURIComponent(name);
        setBarTargets.set(enc, pctNum);
        const startPct = !animateCharts
          ? pctNum
          : prevSetW.has(enc)
            ? prevSetW.get(enc)
            : 0;
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
    renderTopSpdGrid(document.getElementById('top-spd-grid'), runes, spdPick, tloc);

    const effEl = document.getElementById('eff-chart');
    const prevEffHeights = animateCharts && effEl ? snapshotEffBarHeights(effEl) : null;
    if (effEl) effEl.innerHTML = '';
    const maxBucket = Math.max(...effBuckets, 1);
    const medEff = medianEff;
    const medLine = document.getElementById('eff-median-line');
    const medCap = document.getElementById('eff-median-caption');
    if (medEff != null && runes.length) {
      const pos = Math.min(100, Math.max(0, medEff));
      if (medLine) {
        medLine.style.left = `calc(${pos}% - 1px)`;
        medLine.hidden = false;
      }
      if (medCap) {
        medCap.textContent = (tloc.effMedianCaption || '').replace('{pct}', medEff.toFixed(1));
        medCap.hidden = false;
      }
    } else {
      if (medLine) medLine.hidden = true;
      if (medCap) medCap.hidden = true;
    }
    if (effEl) {
      effBarTargets = [];
      for (let i = 0; i < 20; i++) {
        const h = Math.max(4, (effBuckets[i] / maxBucket) * 80);
        effBarTargets[i] = h;
        const h0 = !animateCharts
          ? h
          : prevEffHeights && prevEffHeights[i] != null
            ? prevEffHeights[i]
            : 0;
        const label = `${i * 5}-${i * 5 + 4}`;
        const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
        effEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}%: ${effBuckets[i]} runes">
          <div class="eff-bar ${cls}" style="height:${h0}px"></div>
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
          if (verdictChartEl && verdictBarTargets && verdictBarTargets.size) {
            applyRowBarWidthMap(verdictChartEl, 'data-dash-verdict', verdictBarTargets);
          }
          if (roleEl && roleBarTargets && roleBarTargets.size) {
            applyRowBarWidthMap(roleEl, 'data-dash-role', roleBarTargets);
          }
          if (setEl && setBarTargets && setBarTargets.size) {
            applyRowBarWidthMap(setEl, 'data-dash-set', setBarTargets);
          }
          if (effEl && effBarTargets && effBarTargets.length) {
            const bars = effEl.querySelectorAll('.eff-bar');
            bars.forEach((bar, i) => {
              if (effBarTargets[i] != null) bar.style.height = `${effBarTargets[i]}px`;
            });
          }
          if (slotCardsRoot && slotShareAnimTargets && slotShareAnimTargets.size) {
            slotCardsRoot.querySelectorAll('.slot-share-cell[data-slot]').forEach((cell) => {
              const s = cell.getAttribute('data-slot');
              const fill = cell.querySelector('.slot-share-bar-fill');
              if (!fill || !s || !slotShareAnimTargets.has(s)) return;
              fill.style.height = `${slotShareAnimTargets.get(s)}%`;
            });
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

  // ===================== TABLE =====================
  function renderTable(runes) {
    applyFiltersAndSort(runes);
  }

  let filteredRunes = [];

  function getRuneNumericEff(r) {
    if (!r) return 0;
    return Number.isFinite(r.eff) ? r.eff : 0;
  }

  function applyRuneTableEffHeader() {
    const lbl = document.getElementById('lbl-th-eff');
    if (!lbl) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    lbl.textContent = t.tableEffHeaderCapped || 'Eff%';
    lbl.setAttribute('title', t.tableEffHeaderCappedTitle || '');
  }

  function initRuneTablePrefsFromStorage() {
    applyRuneTableEffHeader();
    const ancient = document.getElementById('toggle-ancient-only');
    if (ancient) {
      const v = localStorage.getItem(RUNE_TABLE_ANCIENT_ONLY_KEY);
      if (v === '1') ancient.checked = true;
      else if (v === '0') ancient.checked = false;
    }
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
        case 'role':    av = a.role;    bv = b.role;    break;
        case 'verdict': av = a.verdict; bv = b.verdict; break;
        case 's1':      av = a.substats[0]?.name || ''; bv = b.substats[0]?.name || ''; break;
        case 's2':      av = a.substats[1]?.name || ''; bv = b.substats[1]?.name || ''; break;
        case 's3':      av = a.substats[2]?.name || ''; bv = b.substats[2]?.name || ''; break;
        case 's4':      av = a.substats[3]?.name || ''; bv = b.substats[3]?.name || ''; break;
        default:        av = a.eff;     bv = b.eff;
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function runeTargetText(r) {
    const tl = TRANSLATIONS[currentLang];
    const v = r.verdict || '';
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
    return parts.join(' · ');
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
    if (sortKey !== 'eff') p.set('sort', sortKey);
    if (sortDir !== 'desc') p.set('dir', sortDir);
    if (document.getElementById('toggle-target-col')?.checked) p.set('target', '1');
    if (document.getElementById('toggle-ancient-only')?.checked) p.set('ancient', '1');
    if (runeTableShowAll) p.set('all', '1');
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  function replaceRuneTableLocationFromState() {
    if (runeTableApplyingHash) return;
    const tabEl = document.getElementById('tab-runetable');
    if (!tabEl || tabEl.classList.contains('hidden')) return;
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
        const on = params.get('target') === '1';
        const tgl = document.getElementById('toggle-target-col');
        if (tgl) tgl.checked = on;
      }
      if (params.has('ancient')) {
        const on = params.get('ancient') === '1';
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = on;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, on ? '1' : '0');
      }
      if (params.has('all')) runeTableShowAll = params.get('all') === '1';
      else runeTableShowAll = false;
      const manualTarget = document.getElementById('toggle-target-col')?.checked;
      document.getElementById('target-col-header')?.classList.toggle('hidden', !manualTarget);
      document.getElementById('rune-table')?.classList.toggle('show-target', !!manualTarget);
    } finally {
      runeTableApplyingHash = false;
      applyRuneTableEffHeader();
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

  function updateRuneTableFilterIndicators() {
    document.querySelectorAll('#rune-table thead .th-text[data-filter]').forEach((textEl) => {
      const key = textEl.getAttribute('data-filter');
      const sel = document.getElementById(
        key === 'grade' ? 'filter-grade'
          : key === 'set' ? 'filter-set'
            : key === 'slot' ? 'filter-slot'
              : key === 'main' ? 'filter-main'
                : key === 'role' ? 'filter-role'
                  : key === 'verdict' ? 'filter-verdict' : ''
      );
      const on = !!(sel && sel.value);
      textEl.classList.toggle('th-text--filtered', on);
    });
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
    const tglAncient = document.getElementById('toggle-ancient-only');
    if (tglAncient) tglAncient.checked = false;
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
    document.getElementById('target-col-header')?.classList.add('hidden');
    document.getElementById('rune-table')?.classList.remove('show-target');
    sortKey = 'eff';
    sortDir = 'desc';
    runeTableShowAll = false;
    updateSortHeaderClasses();
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes());
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
      if (ancientOnly && !r.isAncient) return false;
      if (verdict && r.verdict !== verdict) return false;
      if (role    && r.role    !== role)    return false;
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
        const tmpl = t.runeTableCountCapped || '{shown} / {total} {runes}';
        countEl.textContent = tmpl
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total))
          .replace(/\{runes\}/g, t.runes);
      } else {
        countEl.textContent = `${total} ${t.runes}`;
      }
    }

    const detailEl = document.getElementById('table-count-detail');
    if (detailEl) {
      if (total === 0) {
        detailEl.textContent = t.tableShownDetailEmpty || '';
      } else if (!runeTableShowAll && total > RUNE_TABLE_PAGE) {
        detailEl.textContent = (t.tableShownDetailCapped || '')
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total));
      } else {
        detailEl.textContent = (t.tableShownDetailAll || '')
          .replace(/\{total\}/g, String(total));
      }
    }

    const verdictFilter = document.getElementById('filter-verdict')?.value || '';
    const needTargetByVerdict = verdictFilter === 'Grind' || verdictFilter === 'Gem';
    const tglTarget = document.getElementById('toggle-target-col');
    if (needTargetByVerdict && tglTarget && !tglTarget.checked) tglTarget.checked = true;
    const targetManual = document.getElementById('toggle-target-col')?.checked;
    const showTarget = needTargetByVerdict || targetManual;
    document.getElementById('target-col-header')?.classList.toggle('hidden', !showTarget);
    document.getElementById('target-filter-cell')?.classList.toggle('hidden', !showTarget);
    document.getElementById('rune-table')?.classList.toggle('show-target', showTarget);
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    setupRuneTableMoreUi(total, rows.length);
    updateRuneTableFilterIndicators();
    replaceRuneTableLocationFromState();
  }

  function exportCsv() {
    const rows = filteredRunes;
    if (!rows.length) return;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const includeTarget = document.getElementById('rune-table')?.classList.contains('show-target');
    const headers = [
      'Grade',
      tloc.csvHeaderAncient || 'Ancient',
      'Set', 'Lvl', 'Slot', 'Main', 'Innate', 'Sub1', 'Sub2', 'Sub3', 'Sub4', 'Eff%', 'Role', 'Verdict',
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
        `${getRuneNumericEff(r).toFixed(1)}%`,
        r.role || '',
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

  /** Stylised “Ancient” mark: A without crossbar, dot at mid-height (matches in-game cue). */
  const ANCIENT_GRADE_ICON_SVG =
    '<svg class="ancient-grade-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.85" d="M2.35 12.85L8 2.65l5.65 10.2"/>'
    + '<circle cx="8" cy="9.55" r="1.45" fill="currentColor"/>'
    + '</svg>';

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
      'High Roll':'highroll','Bruiser':'bruiser','Fast CC':'fastcc',
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
    const ancientIcon = r.isAncient
      ? `<span class="ancient-grade-icon-wrap" aria-hidden="true">${ANCIENT_GRADE_ICON_SVG}</span>`
      : '';
    const gradeAria = r.isAncient ? ` aria-label="${ancientLbl}, ${escapeAttr(gradeLabel)}"` : '';
    const grade = `<span class="grade-tag ${gradeClass}${r.isAncient ? ' grade-tag--ancient' : ''}"${ancientTipAttr}${gradeAria}>${ancientIcon}<span class="grade-tag__lbl">${gradeLabelHtml}</span></span>`;

    const effNum = getRuneNumericEff(r);
    const effTier =
      effNum >= 90 ? 'stat-chip--eff-hi' : effNum >= 75 ? 'stat-chip--eff-mid' : 'stat-chip--eff-lo';
    const effShown = `${(Math.round(effNum * 10) / 10).toFixed(1)}%`;
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
    const roleText = (r.role || '').trim();
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
      <td class="col-grade col-pin">${grade}</td>
      <td class="col-set col-pin col-text">${tableStatLine(highlightSearchInPlain(r.setName, tableSearchHighlight), { set: true })}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.level), tableSearchHighlight)}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.slot), tableSearchHighlight)}</td>
      <td class="col-text">${tableStatLine(mainInner)}</td>
      <td class="col-text">${innateHtml}</td>
      ${subCell(subs[0], true)}
      ${subCell(subs[1], false)}
      ${subCell(subs[2], false)}
      ${subCell(subs[3], false)}
      <td class="col-num td-num"><span class="stat-chip stat-chip--eff ${effTier}">${highlightSearchInPlain(effShown, tableSearchHighlight)}</span></td>
      <td class="col-text">${roleHtml}</td>
      <td class="col-text">${verdictHtml}</td>
      <td class="target-col-cell col-text"${targetTipAttr}>${targetHtml}</td>
    </tr>`;
  }

  // Table sorting — main table (skip filter columns; those have th-text/th-filter)
  document.querySelectorAll('#rune-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', (e) => {
      // Ignore clicks on filter text/select
      if (e.target.closest('.th-text') || e.target.closest('.th-filter')) return;
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      document.querySelectorAll('#rune-table thead th[data-sort]').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      applyFiltersAndSort(getVisibleRunes());
    });
  });

  function closeAllRuneTableHeaderFilters() {
    document.querySelectorAll('#rune-table thead .th-filter').forEach(s => {
      s.style.display = 'none';
    });
    document.querySelectorAll('#rune-table thead .th-text').forEach(t => {
      t.classList.remove('th-text--filter-active');
      t.style.removeProperty('display');
    });
  }

  // Inline filter toggles inside table headers — hover to reveal, click to open
  document.querySelectorAll('#rune-table thead th .th-text').forEach(textEl => {
    textEl.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      const select = textEl.parentElement.querySelector('.th-filter');
      if (!select) return;
      closeAllRuneTableHeaderFilters();
      select.style.display = 'inline-block';
      textEl.classList.add('th-text--filter-active');
    });
  });

  // Hide select when cursor leaves the header cell (unless select is focused/open)
  document.querySelectorAll('#rune-table thead th.th-has-filter').forEach(th => {
    const select = th.querySelector('.th-filter');
    const text = th.querySelector('.th-text');
    if (!select || !text) return;

    th.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (document.activeElement !== select) {
          select.style.display = 'none';
          text.classList.remove('th-text--filter-active');
          text.style.removeProperty('display');
        }
      }, 200);
    });
  });

  document.querySelectorAll('#rune-table thead th .th-filter').forEach(select => {
    // Prevent sort when clicking inside the select
    select.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    select.addEventListener('change', () => {
      select.style.display = 'none';
      const text = select.parentElement.querySelector('.th-text');
      if (text) {
        text.classList.remove('th-text--filter-active');
        text.style.removeProperty('display');
      }
      applyFiltersAndSort(getVisibleRunes());
    });

    select.addEventListener('blur', () => {
      // Small delay so change fires first
      setTimeout(() => {
        select.style.display = 'none';
        const text = select.parentElement.querySelector('.th-text');
        if (text) {
          text.classList.remove('th-text--filter-active');
          text.style.removeProperty('display');
        }
      }, 150);
    });
  });

  // Export CSV from Rune Table
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);

  document.getElementById('btn-rune-table-show-all')?.addEventListener('click', () => {
    runeTableShowAll = true;
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  // Toggle Target column visibility
  document.getElementById('toggle-target-col')?.addEventListener('change', () => {
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('toggle-ancient-only')?.addEventListener('change', (e) => {
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, e.target.checked ? '1' : '0');
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('btn-table-reset-filters')?.addEventListener('click', () => {
    resetRuneTableFilters();
  });

  // Table filters (search debounced separately)
  ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => applyFiltersAndSort(getVisibleRunes()));
    document.getElementById(id)?.addEventListener('change', () => applyFiltersAndSort(getVisibleRunes()));
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
    const tabRt = document.getElementById('tab-runetable');
    const onTableTab = tabRt && !tabRt.classList.contains('hidden');

    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (inField && e.target.id !== 'search-box') return;
      if (inField && e.target.id === 'search-box') return;
      e.preventDefault();
      document.getElementById('search-box')?.focus();
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
          html += `<input type="number" data-formula="${formulaName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}" value="${value}" min="0" max="4" style="padding:4px 8px;font-size:0.8rem;width:60px">`;
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
          html += `<input type="number" ${dataAttr} value="${value}" min="0" max="4" style="padding:4px 8px;font-size:0.8rem;width:60px">`;
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
    const roleNames = Array.from(new Set([...formulas, ...Object.keys(window.SWRM.settings.roles || {})]));
    const defaultPriority = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS'];
    const storedPriority = Array.isArray(window.SWRM.settings.rolePriority)
      ? window.SWRM.settings.rolePriority
      : defaultPriority;
    const orderedRoles = [
      ...storedPriority.filter(name => roleNames.includes(name)),
      ...roleNames.filter(name => !storedPriority.includes(name)),
    ];
    const roles = [...orderedRoles, 'Duo Roll', 'High Roll'];
    const t = TRANSLATIONS[currentLang];
    roleSelect.innerHTML = `<option value="">${t.allRoles || 'All Roles'}</option>${roles.map(r => `<option value="${r}">${r}</option>`).join('')}`;
    if (roles.includes(current)) roleSelect.value = current;
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
        const step = isPct ? '0.1' : '0.01';
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

  document.getElementById('btn-reset-stat-constants')?.addEventListener('click', () => {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!confirm(tloc.resetConstantsConfirm || 'Replace Constants with defaults?')) return;
    const s = window.SWRM.settings;
    s.statConstants = JSON.parse(JSON.stringify(window.SWRM.DEFAULT_STAT_CONSTANTS));
    window.SWRM.applyDerivedThresholdFields(s);
    const persist = JSON.parse(JSON.stringify(s));
    delete persist.hrThresholds;
    delete persist.duoThresholds;
    delete persist.godConstants;
    delete persist.hrCoeff;
    saveSettings(persist);
    buildStatConstantsTable();
    refreshEnginePreviews();
    if (processedRunes.length) reprocess();
    showSwrmToast(tloc.resetConstantsDone || 'Constants reset.', { type: 'success', duration: 3800 });
  });

  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    updateLanguage(currentLang);
    initDashboardUnifiedTabs();
    initRuneTablePrefsFromStorage();
    initRulesSubtabs();
    initChangelogSubtabs();
    initGuideSubtabs();
    showMainTab(mainTabIdFromHash() || 'dashboard');

    const savedRunes = localStorage.getItem('loadedRunes');

    try {
      const slots = loadDbSlots();
      const hasSlotMeta = slots.some(s => s.name && s.name.trim() !== '');
      const targetSlot =
        slots.find(s => s.active && s.name && s.name.trim() !== '') ||
        slots.find(s => s.name && s.name.trim() !== '');

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
            uiAfterSuccessfulRuneRestore(targetSlot);
            restored = true;
          } else if (savedRunes && tryHydrateRunesFromJsonText(savedRunes)) {
            console.log(`IndexedDB empty for Data ${targetSlot.id}; restored from localStorage backup`);
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
            const demoOk = await installEmbeddedDemoDataset();
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
    for (const id of [1, 2, 3, 4, 'current-runes']) {
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

  function processJsonData(jsonText) {
    const json = JSON.parse(jsonText);
    allRunes = parseSWEX(json);
    reprocess();
    markUserLoadedRealExport();
    syncDemoBannerVisibility();
    document.getElementById('upload-prompt').classList.add('hidden');
  }

  function parseAndLoadJson(jsonText) {
    processJsonData(jsonText);
    showMainTab('dashboard', { writeHash: true });
  }

  const appLangSelect = document.getElementById('app-language');
  if (appLangSelect) {
    appLangSelect.value = currentLang;
    appLangSelect.addEventListener('change', () => {
      let v = appLangSelect.value || 'en';
      if (!['en', 'ru', 'fr'].includes(v)) v = 'en';
      updateLanguage(v);
      appLangSelect.value = currentLang;
    });
  }

  document.getElementById('theme-sun')?.addEventListener('click', () => setTheme('light'));
  document.getElementById('theme-moon')?.addEventListener('click', () => setTheme('dark'));

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
            saveDbSlots(slots);
            renderDbSlots();
            markUserLoadedRealExport();
            syncDemoBannerVisibility();
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
        processJsonData(jsonText);
      } catch(err) {
        alert((t.parseError || 'Failed to parse slot JSON: ') + err.message);
      }
      renderDbSlots();
    }
  });

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
    const lang = currentLang === 'ru' ? 'ru' : currentLang === 'fr' ? 'fr' : 'en';
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
    const lang = currentLang === 'ru' ? 'ru' : currentLang === 'fr' ? 'fr' : 'en';
    const items =
      (window.SWRM && window.SWRM.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP[lang]) ||
      (window.SWRM && window.SWRM.STATIC_ROADMAP && window.SWRM.STATIC_ROADMAP.en) ||
      [];
    if (!items.length) {
      list.innerHTML = `<p class="settings-desc">${escapeChangelogText(t.changelogRoadmapEmpty || '')}</p>`;
      return;
    }
    list.innerHTML = `<article class="changelog-release changelog-release--roadmap"><ul class="changelog-bullets">${items.map((tx) => `<li>${escapeChangelogText(tx)}</li>`).join('')}</ul></article>`;
  }

})();
