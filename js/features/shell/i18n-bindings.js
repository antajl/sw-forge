// js/features/shell/i18n-bindings.js — UI translation bindings
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
