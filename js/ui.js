// =============================================
// ui.js — Tabs, Dashboard, Table, Settings
// =============================================

(function() {
  const APP_LANG_KEY = 'swrm_app_lang_v1';

  const { parseSWEX, extractSwexSummary, countAllSwexRunes, processAll, ROLE_PRIORITY, settings: cfg,
          STAT_NAMES, SET_NAMES, GRADE_SHORT, saveSettings,
          DEFAULT_THRESHOLDS, DEFAULT_HR_THRESHOLDS, DEFAULT_HR_COEFF,
          DEFAULT_DUO_THRESHOLDS, DEFAULT_ROLES, DEFAULT_REAPP, DEFAULT_GEM_META, TRANSLATIONS } = window.SWRM;

  let allRunes = [];
  let processedRunes = [];
  /** Full process at Mid only — progression suggestion (score, Keep/meta/power) does not depend on user's Early/Late preset. */
  let processedRunesAdvisorMid = [];
  let stage    = 'Mid';

  const STAGE_FOR_PROGRESSION_ADVISOR = 'Mid';

  /**
   * Combined score (0–100) cuts for progression suggestion — stricter Early than spreadsheet 25/50.
   * Early: genuinely weak progression; Mid: developing; Late: strong.
   */
  const STAGE_ADVISOR_SCORE_MID_MIN = 43;
  const STAGE_ADVISOR_SCORE_LATE_MIN = 52;
  let sortKey  = 'eff';
  let sortDir  = 'desc';
  let globalMinLevel = 0;
  let currentLang = localStorage.getItem(APP_LANG_KEY) || localStorage.getItem('swrm-lang') || 'en';
  let currentTheme = localStorage.getItem('swrm-theme') || 'light';

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
    setText('lbl-stage-score-label', t.stageScoreLabel || '');
    setText('lbl-stage-metrics-explainer', t.stageMetricsExplainer || '');
    setText('lbl-card-hr-name', t.stageCardHrName || '');
    setText('lbl-card-hr-desc', t.stageCardHrDesc || '');
    setText('lbl-card-keep-name', t.stageCardKeepName || '');
    setText('lbl-card-keep-desc', t.stageCardKeepDesc || '');
    setText('lbl-card-meta-name', t.stageCardMetaName || '');
    setText('lbl-card-meta-desc', t.stageCardMetaDesc || '');
    setText('lbl-stage-formula', t.stageFormulaExpl || '');
    const btnAuto = document.getElementById('btn-auto-stage');
    if (btnAuto) btnAuto.textContent = t.stageApplySuggestion || 'Apply suggestion';
  }

  // ===================== LANGUAGE =====================
  function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem(APP_LANG_KEY, lang);
    const t = TRANSLATIONS[lang];

    document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';

    updateStageAdvisorLabels(t);

    const appLangSelectEl = document.getElementById('app-language');
    if (appLangSelectEl) appLangSelectEl.value = lang;
    
    // Update title
    document.title = t.title;
    const logoText = document.querySelector('.logo-text');
    if (logoText) logoText.innerHTML = `SW <strong>${t.title.substring(3)}</strong>`;
    
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
    const actionListTab = document.querySelector('[data-tab="actionlist"]');
    if (actionListTab) actionListTab.textContent = t.actionList;
    const appSettingsTab = document.querySelector('[data-tab="app-settings"]');
    if (appSettingsTab) appSettingsTab.textContent = t.appSettings;

    // Update header elements
    const uploadLabel = document.querySelector('label[for="json-upload"] span');
    if (uploadLabel) uploadLabel.textContent = '⬆ ' + t.loadJson;
    const settingsBtn = document.getElementById('open-app-settings');
    if (settingsBtn) settingsBtn.textContent = t.settings;

    const scopeTitle = document.getElementById('dashboard-scope-title');
    if (scopeTitle) scopeTitle.textContent = t.dashboardScopeTitle || '';
    const scopeHint = document.getElementById('dashboard-scope-hint');
    if (scopeHint) scopeHint.textContent = t.dashboardScopeHint || '';
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
    }
    
    // Update upload prompt
    const uploadPrompt = document.getElementById('upload-prompt');
    if (uploadPrompt) {
      const titleEl = document.getElementById('upload-prompt-title');
      if (titleEl) titleEl.textContent = t.loadYourSWEX;
      const leadEl = document.getElementById('upload-prompt-lead');
      if (leadEl) leadEl.textContent = t.uploadPromptLead || t.uploadDescription;
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
    
    // Update table elements
    updateTableLabels();
    refreshRoleFilterOptions();

    // Update settings
    updateSettingsLabels();
  }

  function updateDashboardLabels() {
    const t = TRANSLATIONS[currentLang];
    const labels = {
      'sc-total': t.totalRunes,
      'sc-keep': t.keep,
      'sc-sell': t.sell,
      'sc-grind': t.grind,
      'sc-finish': t.finish,
      'sc-reapp': t.reapp,
      'sc-upgrade': t.upgrade,
      'sc-gem': t.gem
    };
    
    Object.entries(labels).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        const label = element.querySelector('.sc-label');
        if (label) label.textContent = text;
      }
    });
    
    // Update chart titles
    const chartTitles = {
      'panel-roles': t.roleDistribution,
      'panel-sets': t.setDistribution,
      'panel-slots': t.slotDistribution,
      'panel-eff': t.efficiencyDistribution
    };
    
    Object.entries(chartTitles).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        const title = element.querySelector('.panel-title');
        if (title) title.textContent = text;
      }
    });
  }

  function updateTableLabels() {
    const t = TRANSLATIONS[currentLang];
    
    // Update search and filters
    const searchBox = document.getElementById('search-box');
    if (searchBox) searchBox.placeholder = t.searchPlaceholder;
    
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
    
    const filterRole = document.getElementById('filter-role');
    if (filterRole) {
      filterRole.innerHTML = `<option value="">${t.allRoles}</option>
        <option value="High Roll">High Roll</option>
        <option value="Duo Roll">Duo Roll</option>
        <option value="Classic DPS">Classic DPS</option>
        <option value="Slow DPS">Slow DPS</option>
        <option value="Fast Utility">Fast Utility</option>
        <option value="Bomber">Bomber</option>
        <option value="Heavy Resist">Heavy Resist</option>
        <option value="Bruiser">Bruiser</option>`;
    }
    const actionSearch = document.getElementById('action-search-box');
    if (actionSearch) actionSearch.placeholder = t.actionSearchPlaceholder;
    const btnExportAction = document.getElementById('btn-action-export-csv');
    if (btnExportAction) btnExportAction.textContent = t.exportActionCsv;
    const actionLead = document.getElementById('action-list-lead');
    if (actionLead) actionLead.textContent = t.actionListLead;
    const actionTargetTh = document.querySelector('#action-table thead .target-col-header-visible');
    if (actionTargetTh) actionTargetTh.textContent = t.targetHeading;

    const af = document.getElementById('action-filter-verdict');
    if (af) {
      af.innerHTML = `<option value="">${t.allActions}</option>
        <option value="Upgrade">${t.upgrade}</option>
        <option value="Finish">${t.finish}</option>
        <option value="Gem">${t.gem}</option>
        <option value="Grind">${t.grind}</option>
        <option value="Reapp">${t.reapp}</option>`;
    }

    const filterGrade = document.getElementById('filter-grade');
    if (filterGrade) {
      filterGrade.innerHTML = `<option value="">${t.allGrades}</option>
        <option value="Legend">Legend</option>
        <option value="Hero">Hero</option>`;
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

    const h3High = settingsTab.querySelector('.settings-col-left h3:first-of-type');
    if (h3High) h3High.textContent = t.highRollThresholds;
    const h3Duo = settingsTab.querySelectorAll('.settings-col-left h3')[1];
    if (h3Duo) h3Duo.textContent = t.duoRollThresholds;
    const gemH = settingsTab.querySelector('.gem-meta-heading');
    if (gemH) gemH.textContent = t.gemMetaRules;
    const reappH = settingsTab.querySelector('.reapp-heading');
    if (reappH) reappH.textContent = t.reappCandidateRules;
    const roleH = settingsTab.querySelector('.role-filters-heading');
    if (roleH) roleH.textContent = t.roleFilters;

    const dh = settingsTab.querySelector('.high-roll-desc');
    if (dh) dh.textContent = 'A rune qualifies as High Roll if at least one substat meets or exceeds these values.';
    const dd = settingsTab.querySelector('.duo-desc');
    if (dd) dd.textContent = 'Synergy pairs. Both stats must reach their respective minimum values.';
    const dg = settingsTab.querySelector('.gem-meta-desc');
    if (dg) dg.textContent = t.gemMetaRulesDesc;
    const dre = settingsTab.querySelector('.reapp-rules-desc');
    if (dre) dre.textContent = t.reappDescription;
    const drf = settingsTab.querySelector('.role-filters-desc');
    if (drf) drf.textContent = t.configureRoleRules;

    const gmtl = document.getElementById('gem-meta-toggle-label');
    if (gmtl) gmtl.textContent = t.gemMetaToggle;
    const gl = document.getElementById('gem-meta-legend-label');
    if (gl) gl.textContent = t.gemMetaLegendOnly;
    const gfs = document.getElementById('gem-universal-flats-label');
    if (gfs) gfs.textContent = t.gemUniversalFlats;
    const gleg = document.getElementById('gem-legacy-subs-label');
    if (gleg) gleg.textContent = t.gemLegacySubs;
    const xh = settingsTab.querySelector('.gem-extra-hint');
    if (xh) xh.textContent = t.gemExtraBySlot;

    const gemSetsInput = document.getElementById('gem-meta-sets');
    const gemSetsLabel = gemSetsInput?.closest('.settings-row')?.querySelector('label');
    if (gemSetsLabel && gemSetsLabel.childNodes[0]) gemSetsLabel.childNodes[0].textContent = t.gemMetaSetsList + ' ';
    const gemJsonInput = document.getElementById('gem-meta-by-set-json');
    const gemJsonLbl = gemJsonInput?.closest('.settings-row')?.querySelector('label');
    if (gemJsonLbl && gemJsonLbl.childNodes[0]) gemJsonLbl.childNodes[0].textContent = t.gemPerSetJson + ' ';
    const gemExTa = document.getElementById('gem-meta-extra-slots');
    const gemExLbl = gemExTa?.closest('.settings-row')?.querySelector('label');
    if (gemExLbl && gemExLbl.childNodes[0]) gemExLbl.childNodes[0].textContent = t.gemExtrasLabel + ' ';
    
    // Update partner coefficient label (only text node, keep input)
    const partnerRow = document.getElementById('hr-coeff')?.closest('.settings-row');
    if (partnerRow) {
      const partnerLabel = partnerRow.querySelector('label');
      if (partnerLabel) {
        const textNode = partnerLabel.childNodes[0];
        if (textNode) textNode.textContent = t.partnerCoeff + ' ';
      }
    }
    
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
  }

  // ===================== TABS =====================
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      
      // Render db slots when app settings tab is opened
      if (btn.dataset.tab === 'app-settings') {
        renderDbSlots();
      }
      if (btn.dataset.tab === 'actionlist') {
        renderActionList(getVisibleRunes());
      }
    });
  });

  // ===================== STAGE =====================
  document.getElementById('stage-select').addEventListener('change', e => {
    stage = e.target.value;
    if (allRunes.length) reprocess();
  });

  // Auto Game Stage button
  document.getElementById('btn-auto-stage').addEventListener('click', () => {
    const metrics = analyzeGameStage(processedRunesAdvisorMid);
    const recommendedStage = getRecommendedStage(parseFloat(metrics.score));
    const stageSelect = document.getElementById('stage-select');
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    if (!metrics.eligibleCount) {
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
      renderActionList(visible);
    }
  });

  // ===================== FILE UPLOAD =====================
  document.getElementById('json-upload').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const jsonText = ev.target.result;
        const json = JSON.parse(jsonText);
        allRunes = parseSWEX(json);
        reprocess();
        
        // Check file size and save to appropriate storage
        const fileSizeKB = Math.round(jsonText.length / 1024);
        const maxLocalStorageSize = 4 * 1024; // 4MB limit for localStorage
        
        if (fileSizeKB <= maxLocalStorageSize) {
          // Use localStorage for small files
          localStorage.setItem('loadedRunes', jsonText);
          localStorage.setItem('loadedRunesName', file.name);
          localStorage.setItem('loadedRunesDate', new Date().toISOString());
          localStorage.setItem('loadedRunesSize', fileSizeKB.toString());
          console.log(`Saved ${file.name} (${fileSizeKB}KB) to localStorage`);
        } else {
          // Use IndexedDB for large files
          try {
            await saveSlotData('current-runes', jsonText);
            localStorage.setItem('loadedRunesName', file.name);
            localStorage.setItem('loadedRunesDate', new Date().toISOString());
            localStorage.setItem('loadedRunesSize', fileSizeKB.toString());
            localStorage.setItem('loadedRunesStorage', 'indexeddb');
            console.log(`Saved ${file.name} (${fileSizeKB}KB) to IndexedDB`);
          } catch (err) {
            alert(`Failed to save large file (${fileSizeKB}KB): ${err.message}`);
            return;
          }
        }
        
        const slots = loadDbSlots();
        const targetSlot = slots.find(s => s.id === 1) || slots[0];
        applySlotSummaryFromJson(targetSlot, file.name, json);
        targetSlot.active = true;
        slots.forEach(s => { if (s.id !== targetSlot.id) s.active = false; });
        saveDbSlots(slots);
        
        // Save actual JSON to IndexedDB
        await saveSlotData(targetSlot.id, jsonText);
        
        document.getElementById('upload-prompt').classList.add('hidden');
        document.getElementById('tab-dashboard').classList.remove('hidden');
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === 'dashboard');
        });
      } catch(err) {
        alert('Failed to parse JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Close upload prompt overlay (load later via App Settings → slot Upload, or refresh to see prompt again)
  document.getElementById('close-upload-prompt')?.addEventListener('click', () => {
    document.getElementById('upload-prompt').classList.add('hidden');
  });

  // Clear saved runes button
  document.getElementById('btn-clear-saved-runes')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear all saved runes? This will remove the currently loaded runes from browser storage.')) return;
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
  });

  function reprocess() {
    processedRunes = processAll(allRunes, stage, window.SWRM.settings);
    processedRunesAdvisorMid = allRunes.length
      ? processAll(allRunes, STAGE_FOR_PROGRESSION_ADVISOR, window.SWRM.settings)
      : [];
    const visible = getVisibleRunes();
    renderDashboard(visible);
    renderTable(visible);
    renderActionList(visible);
  }

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
      document.getElementById('tab-dashboard').classList.remove('hidden');
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === 'dashboard');
      });
    }
    if (meta && meta.name) {
      console.log(`Auto-loaded runes from ${meta.name}${meta.id != null ? ` (Data ${meta.id})` : ''}`);
    }
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
    processedRunesAdvisorMid = [];
    if (!keepTab) {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      document.getElementById('tab-guide').classList.remove('hidden');
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === 'guide');
      });
      document.getElementById('upload-prompt').classList.remove('hidden');
    } else {
      document.getElementById('upload-prompt').classList.add('hidden');
    }
    document.getElementById('sc-total').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-keep').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-sell').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-grind').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-finish').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-reapp').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-upgrade').querySelector('.sc-value').textContent = '—';
    document.getElementById('sc-gem').querySelector('.sc-value').textContent = '—';
    document.getElementById('rune-tbody').innerHTML = '';
    renderDashboard([]);
    renderTable([]);
    renderActionList([]);
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
    return processedRunes.filter(r => r.level >= globalMinLevel);
  }

  // ===================== GAME STAGE ANALYSIS (Sheets-aligned) =====================
  /**
   * `runes` must be Mid-processed (processedRunesAdvisorMid): Keep/meta use Mid verdicts.
   * Power share uses Mid High Roll thresholds only.
   * Same weighting as the spreadsheet suggestion:
   * - 40% × share of +9 runes with power level > 0 (Engine!AH / hrThresholds sub count → 1–3)
   * - 30% × min(avg Keep eff / 130, 1) — Keep eff uses uncapped SWOP-style % (see parser)
   * - 30% × share of Keep on Violent/Swift/Will
   * Stage: score < MID_MIN → Early, else if < LATE_MIN → Mid, else Late.
   */
  function analyzeGameStage(runes) {
    const settings = window.SWRM.settings;
    const powerFn = window.SWRM.runePowerLevel0to3;
    const effUncapped = window.SWRM.calcEfficiencyUncapped;
    const eligibleRunes = runes.filter(r => r.level >= 9);
    if (eligibleRunes.length === 0) {
      return {
        powerSharePercent: '0.0',
        keepAvgEff: '0.0',
        metaSetsPercent: '0.0',
        score: '0.0',
        eligibleCount: 0,
      };
    }

    const total = eligibleRunes.length;
    const withPower = powerFn
      ? eligibleRunes.filter(r => powerFn(r, STAGE_FOR_PROGRESSION_ADVISOR, settings) > 0)
      : [];
    const pctAny = withPower.length / total;

    const keepRunes = eligibleRunes.filter(r => r.verdict === 'Keep');
    const avgKeepEff = keepRunes.length > 0
      ? keepRunes.reduce((sum, r) => {
          const v = effUncapped ? effUncapped(r) : r.eff;
          return sum + v;
        }, 0) / keepRunes.length
      : 0;
    const normKeep = Math.min(avgKeepEff / 130, 1);

    const metaSets = ['Violent', 'Swift', 'Will'];
    const metaCount = keepRunes.filter(r => metaSets.includes(r.setName)).length;
    const pctMeta = keepRunes.length > 0 ? metaCount / keepRunes.length : 0;
    const metaSetsPercent = pctMeta * 100;

    const score = pctAny * 40 + normKeep * 30 + pctMeta * 30;

    return {
      powerSharePercent: (pctAny * 100).toFixed(1),
      keepAvgEff: avgKeepEff.toFixed(1),
      metaSetsPercent: metaSetsPercent.toFixed(1),
      score: score.toFixed(1),
      eligibleCount: eligibleRunes.length,
    };
  }

  function getRecommendedStage(score) {
    if (score >= STAGE_ADVISOR_SCORE_LATE_MIN) return 'Late';
    if (score >= STAGE_ADVISOR_SCORE_MID_MIN) return 'Mid';
    return 'Early';
  }

  // ===================== DASHBOARD =====================
  function renderDashboard(runes) {
    const counts = { Keep:0, Sell:0, Grind:0, Finish:0, Reapp:0, Upgrade:0, Gem:0 };
    const roleCounts = {};
    const roleEff    = {};
    const setCounts  = {};
    const setEff     = {};
    const slotCounts = {1:0,2:0,3:0,4:0,5:0,6:0};
    const slotMain = {1:{},2:{},3:{},4:{},5:{},6:{}};
    const effBuckets = new Array(20).fill(0); // 5% buckets: 0-4, 5-9, ..., 95-99, 100+

    // Suggestion metrics: +9+ only, Min Lvl ignored; all three terms use Mid preset processing (not current stage).
    const metrics = analyzeGameStage(processedRunesAdvisorMid);
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const recStage = getRecommendedStage(parseFloat(metrics.score));

    const metricHr = document.getElementById('metric-val-highroll');
    const metricKe = document.getElementById('metric-val-keepeff');
    const metricMe = document.getElementById('metric-val-meta');
    const recDisp = document.getElementById('recommended-stage-display');
    const scoreNum = document.getElementById('stage-score-num');
    const mismatchLine = document.getElementById('stage-mismatch-line');
    const noEligLine = document.getElementById('stage-noeligible-line');

    if (metricHr) {
      metricHr.textContent = metrics.eligibleCount ? `${metrics.powerSharePercent}%` : '\u2014';
    }
    if (metricKe) {
      metricKe.textContent = metrics.eligibleCount ? `${metrics.keepAvgEff}%` : '\u2014';
    }
    if (metricMe) {
      metricMe.textContent = metrics.eligibleCount ? `${metrics.metaSetsPercent}%` : '\u2014';
    }

    if (recDisp) {
      recDisp.textContent =
        processedRunes.length && metrics.eligibleCount ? stageDisplayName(tloc, recStage) : '\u2014';
    }
    if (scoreNum) {
      scoreNum.textContent =
        processedRunes.length && metrics.eligibleCount ? String(metrics.score) : '\u2014';
    }

    if (noEligLine) {
      const showNoElig = processedRunes.length > 0 && metrics.eligibleCount === 0;
      noEligLine.hidden = !showNoElig;
      if (showNoElig) noEligLine.textContent = tloc.stageAdvisorNoEligible || '';
    }

    if (mismatchLine) {
      const showMismatch =
        processedRunes.length > 0 &&
        metrics.eligibleCount > 0 &&
        stage !== recStage;
      mismatchLine.hidden = !showMismatch;
      mismatchLine.textContent = showMismatch ? (tloc.stageMismatchHint || '') : '';
    }

    for (const r of runes) {
      counts[r.verdict] = (counts[r.verdict] || 0) + 1;

      if (r.role) {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        roleEff[r.role] = (roleEff[r.role] || []);
        roleEff[r.role].push(r.eff);
      }

      setCounts[r.setName] = (setCounts[r.setName] || 0) + 1;
      setEff[r.setName] = setEff[r.setName] || [];
      setEff[r.setName].push(r.eff);
      slotCounts[r.slot]   = (slotCounts[r.slot]   || 0) + 1;
      slotMain[r.slot][r.mainName] = (slotMain[r.slot][r.mainName] || 0) + 1;

      const bucket = Math.min(19, Math.floor(r.eff / 5));
      effBuckets[bucket]++;
    }

    // Summary cards
    const total = runes.length;
    setText('sc-total', total, '.sc-value');
    setText('sc-keep',  counts.Keep  || 0, '.sc-value');
    setText('sc-sell',  counts.Sell  || 0, '.sc-value');
    setText('sc-grind', counts.Grind || 0, '.sc-value');
    setText('sc-finish',counts.Finish|| 0, '.sc-value');
    setText('sc-reapp', counts.Reapp || 0, '.sc-value');
    setText('sc-upgrade', counts.Upgrade || 0, '.sc-value');
    setText('sc-gem', counts.Gem || 0, '.sc-value');

    // Role chart
    const roleEl = document.getElementById('role-chart');
    roleEl.innerHTML = '';
    const sortedRoles = Object.keys(roleCounts).sort((a, b) => (roleCounts[b] || 0) - (roleCounts[a] || 0));
    const maxCount = Math.max(...sortedRoles.map(r => roleCounts[r] || 0), 1);
    for (const role of sortedRoles) {
      const cnt = roleCounts[role] || 0;
      const avg = roleEff[role] ? (roleEff[role].reduce((a,b)=>a+b,0)/roleEff[role].length).toFixed(1) : '-';
      const pct = ((cnt / maxCount) * 100).toFixed(1);
      roleEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">${role}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
          <div class="chart-avg">${avg}%</div>
        </div>`;
    }

    // Set chart (top 10)
    const setEl = document.getElementById('set-chart');
    setEl.innerHTML = '';
    const topSets = Object.entries(setCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const maxSet  = topSets[0]?.[1] || 1;
    for (const [name, cnt] of topSets) {
      const pct = ((cnt / maxSet) * 100).toFixed(1);
      const avg = (setEff[name].reduce((a,b)=>a+b,0) / setEff[name].length).toFixed(1);
      setEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">${name}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%; background: linear-gradient(90deg,#2dd4c4,#4e9eff)">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
          <div class="chart-avg">${avg}%</div>
        </div>`;
    }

    // Slot chart
    const slotEl = document.getElementById('slot-chart');
    slotEl.innerHTML = '';
    const maxSlot = Math.max(...Object.values(slotCounts), 1);
    for (let s = 1; s <= 6; s++) {
      const cnt = slotCounts[s] || 0;
      const pct = ((cnt / maxSlot) * 100).toFixed(1);
      const topMain = Object.entries(slotMain[s])
        .sort((a,b) => b[1] - a[1])
        .slice(0, 2)
        .map(([stat, c]) => `${stat} ${c}`)
        .join(' | ');
      slotEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">Slot ${s}<br><small>${topMain || '—'}</small></div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%; background: linear-gradient(90deg,#b06aff,#7b5fff)">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
        </div>`;
    }

    // Efficiency histogram
    const effEl = document.getElementById('eff-chart');
    effEl.innerHTML = '';
    const maxBucket = Math.max(...effBuckets, 1);
    for (let i = 0; i < 20; i++) {
      const h = Math.max(4, (effBuckets[i] / maxBucket) * 72);
      const label = `${i*5}-${i*5+4}`;
      const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
      effEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}%: ${effBuckets[i]} runes">
          <div class="eff-bar ${cls}" style="height:${h}px"></div>
          <div class="eff-label">${i*5}</div>
        </div>`;
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
  const ACTION_VERDICTS = new Set(['Upgrade', 'Finish', 'Gem', 'Grind', 'Reapp']);
  let actionSortKey = 'eff';
  let actionSortDir = 'desc';
  let lastActionFiltered = [];

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
        case 'eff':     av = a.eff;     bv = b.eff;     break;
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
          return `${g.stat} ${g.from}→${g.need}`;
        }
        return g.stat;
      }
      return '';
    }
    if (v === 'Gem') {
      if (r.gemInfo?.kind === 'innate-meta') {
        return `Innate ${r.gemInfo.innate || ''} → reroll`;
      }
      if (r.gemInfo?.from && r.gemInfo?.to) {
        return `${r.gemInfo.from} → ${r.gemInfo.to}`;
      }
      return '';
    }
    if (v === 'Upgrade') return tl.actionTargetUpgrade;
    if (v === 'Finish') return tl.actionTargetFinish;
    if (v === 'Reapp') return tl.actionTargetReapp;
    return '';
  }

  function applyFiltersAndSort(runes) {
    const search  = (document.getElementById('search-box')?.value || '').toLowerCase();
    const verdict = document.getElementById('filter-verdict')?.value || '';
    const role    = document.getElementById('filter-role')?.value    || '';
    const grade   = document.getElementById('filter-grade')?.value   || '';

    filteredRunes = runes.filter(r => {
      if (verdict && r.verdict !== verdict) return false;
      if (role    && r.role    !== role)    return false;
      if (grade   && r.gradeStr !== grade)  return false;
      if (search) {
        const haystack = [
          r.setName, r.mainName, r.gradeStr, r.role, r.verdict,
          ...r.substats.map(s => s.name)
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    sortRunesInPlace(filteredRunes, sortKey, sortDir);

    const tbody = document.getElementById('rune-tbody');
    if (!tbody) return;
    const countEl = document.getElementById('table-count');
    if (countEl) {
      const t = TRANSLATIONS[currentLang];
      countEl.textContent = `${filteredRunes.length} ${t.runes}`;
    }

    // Render up to 500 rows (virtual scroll TODO)
    const rows = filteredRunes.slice(0, 500);
    const verdictFilter = document.getElementById('filter-verdict')?.value || '';
    const showTarget = verdictFilter === 'Grind' || verdictFilter === 'Gem';
    document.getElementById('target-col-header')?.classList.toggle('hidden', !showTarget);
    document.getElementById('rune-table')?.classList.toggle('show-target', showTarget);
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    renderRuneSummary(filteredRunes);
    renderActionList(getVisibleRunes());
  }

  function renderActionSummary(rows) {
    const box = document.getElementById('action-summary');
    if (!box) return;
    const t = TRANSLATIONS[currentLang];
    const tally = {};
    rows.forEach(r => {
      tally[r.verdict] = tally[r.verdict] || { c: 0, e: 0 };
      tally[r.verdict].c++;
      tally[r.verdict].e += r.eff;
    });
    let html = `<div class="summary-title">${t.actionList}</div>`;
    html += `<div class="summary-row"><span>${t.actionsListedSummary}</span><span>${rows.length}</span></div>`;
    ['Upgrade', 'Finish', 'Gem', 'Grind', 'Reapp'].forEach(vKey => {
      const item = tally[vKey];
      if (!item) return;
      const label =
        vKey === 'Upgrade' ? t.upgrade :
        vKey === 'Finish' ? t.finish :
        vKey === 'Gem' ? t.gem :
        vKey === 'Grind' ? t.grind :
        t.reapp;
      html += `<div class="summary-row"><span>${label}</span><span>${item.c} <span class="summary-eff">${(item.e / item.c).toFixed(1)}%</span></span></div>`;
    });
    box.innerHTML = html;
  }

  function exportActionCsv() {
    const rows = lastActionFiltered;
    if (!rows.length) return;
    const headers = ['Grade', 'Set', 'Lvl', 'Slot', 'Main', 'Innate', 'Sub1', 'Sub2', 'Sub3', 'Sub4', 'Eff%', 'Role', 'Verdict', 'Target'];
    function cellPart(s) {
      const raw = String(s ?? '');
      if (/[,"\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    }
    function subcell(sub) {
      if (!sub || !sub.name) return '';
      return `${sub.name} ${sub.val}${sub.grind ? `+${sub.grind}` : ''}`;
    }
    const lines = [headers.map(cellPart).join(',')];
    rows.forEach(r => {
      const subs = r.substats || [];
      const row = [
        r.gradeStr,
        r.setName,
        r.level,
        r.slot,
        r.mainName,
        r.innate_name ? `${r.innate_name} ${r.innate_val}` : '',
        subcell(subs[0]),
        subcell(subs[1]),
        subcell(subs[2]),
        subcell(subs[3]),
        `${r.eff}%`,
        r.role || '',
        r.verdict || '',
        runeTargetText(r),
      ];
      lines.push(row.map(cellPart).join(','));
    });
    const csv = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sw-rune-master-action-list-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }

  function renderActionList(runes) {
    let list = runes.filter(r => ACTION_VERDICTS.has(r.verdict));

    const search = (document.getElementById('action-search-box')?.value || '').toLowerCase();
    const verdictF = document.getElementById('action-filter-verdict')?.value || '';
    list = list.filter(r => {
      if (verdictF && r.verdict !== verdictF) return false;
      if (!search) return true;
      const haystack = [
        r.setName, r.mainName, r.gradeStr, r.role, r.verdict,
        runeTargetText(r),
        ...r.substats.map(s => `${s.name} ${s.val}`),
      ].join(' ').toLowerCase();
      return haystack.includes(search);
    });

    sortRunesInPlace(list, actionSortKey, actionSortDir);
    lastActionFiltered = list;

    const tbody = document.getElementById('action-tbody');
    if (!tbody) return;
    const t = TRANSLATIONS[currentLang];
    const cnt = document.getElementById('action-table-count');
    if (cnt) cnt.textContent = `${list.length} ${t.actionsCount}`;

    const rows = list.slice(0, 500);
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    renderActionSummary(list);
  }

  function statChip(s) {
    if (!s || !s.name) return '';
    const cls = statClass(s.name);
    const flat = s.flat ? ' flat' : '';
    return `<span class="stat-chip ${cls}${flat}">${s.name} ${s.val}${s.grind ? `+${s.grind}` : ''}</span>`;
  }

  function statClass(name) {
    const m = { 'SPD':'spd','HP%':'hp','HP':'hp flat','ATK%':'atk','ATK':'atk',
                'DEF%':'def','DEF':'def','CRate':'cr','CDmg':'cd','ACC':'acc','RES':'res' };
    return m[name] || '';
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
    const grade = r.gradeStr === 'Legend'
      ? '<span class="grade-tag legend">Legend</span>'
      : '<span class="grade-tag hero">Hero</span>';

    const effCls = r.eff >= 90 ? 'eff-hi' : r.eff >= 75 ? 'eff-mid' : 'eff-lo';
    const rCls   = roleClass(r.role);
    const subs   = r.substats.slice(0, 4);
    const innate = r.innate_name ? `${r.innate_name} ${r.innate_val}` : '';
    const target = runeTargetText(r);

    return `<tr>
      <td>${grade}</td>
      <td>${r.setName}</td>
      <td><span class="stat-chip">Lvl ${r.level}</span></td>
      <td><span class="stat-chip ${statClass(r.mainName)}">${r.mainName}</span></td>
      <td>${innate ? `<span class="stat-chip">${innate}</span>` : ''}</td>
      <td>${subs[0] ? statChip(subs[0]) : ''}</td>
      <td>${subs[1] ? statChip(subs[1]) : ''}</td>
      <td>${subs[2] ? statChip(subs[2]) : ''}</td>
      <td>${subs[3] ? statChip(subs[3]) : ''}</td>
      <td class="${effCls}">${r.eff}%</td>
      <td><span class="role-tag ${rCls}">${r.role || ''}</span></td>
      <td><span class="verdict-tag ${(r.verdict||'').toLowerCase()}">${r.verdict || ''}</span></td>
      <td>${r.slot}</td>
      <td class="target-col-cell">${target ? `<span class="stat-chip">${target}</span>` : ''}</td>
    </tr>`;
  }

  function renderRuneSummary(runes) {
    const box = document.getElementById('rune-summary');
    if (!box) return;

    const byVerdict = {};
    const byRole = {};
    for (const r of runes) {
      byVerdict[r.verdict] = byVerdict[r.verdict] || { c: 0, e: 0 };
      byVerdict[r.verdict].c++;
      byVerdict[r.verdict].e += r.eff;
      if (r.role) {
        byRole[r.role] = byRole[r.role] || { c: 0, e: 0 };
        byRole[r.role].c++;
        byRole[r.role].e += r.eff;
      }
    }

    let html = `<div class="summary-title">Rune Summary</div>`;
    html += `<div class="summary-row"><span>Total</span><span>${runes.length}</span></div>`;
    ['Keep','Grind','Gem','Finish','Upgrade','Reapp','Sell'].forEach(v => {
      const item = byVerdict[v];
      if (!item) return;
      html += `<div class="summary-row"><span>${v}</span><span>${item.c} <span class="summary-eff">${(item.e / item.c).toFixed(1)}%</span></span></div>`;
    });
    html += `<div class="summary-title" style="margin-top:10px">Roles</div>`;
    Object.keys(byRole).sort((a, b) => byRole[b].c - byRole[a].c).forEach(role => {
      const item = byRole[role];
      if (!item) return;
      html += `<div class="summary-row"><span>${role}</span><span>${item.c} <span class="summary-eff">${(item.e / item.c).toFixed(1)}%</span></span></div>`;
    });
    box.innerHTML = html;
  }

  // Table sorting — main table
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

  document.querySelectorAll('#action-table thead th[data-action-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.actionSort;
      if (!key) return;
      if (actionSortKey === key) actionSortDir = actionSortDir === 'asc' ? 'desc' : 'asc';
      else { actionSortKey = key; actionSortDir = 'desc'; }
      document.querySelectorAll('#action-table thead th[data-action-sort]').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(actionSortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      renderActionList(getVisibleRunes());
    });
  });

  document.getElementById('btn-action-export-csv')?.addEventListener('click', exportActionCsv);

  // Table filters
  ['search-box','filter-verdict','filter-role','filter-grade'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => applyFiltersAndSort(getVisibleRunes()));
    document.getElementById(id)?.addEventListener('change', () => applyFiltersAndSort(getVisibleRunes()));
  });

  ['action-search-box', 'action-filter-verdict'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => renderActionList(getVisibleRunes()));
    document.getElementById(id)?.addEventListener('change', () => renderActionList(getVisibleRunes()));
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
        <input type="checkbox" data-formula="${formulaName}" data-field="enabled" ${formulaCfg.enabled ? 'checked' : ''} style="width:18px;height:18px">
        Enable Formula
      </label>`;
      html += `</div>`;
      
      // Accepted Mains section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Accepted Mains</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Main 1</div><div>Main 2</div><div>Main 3</div>`;
      
      for (const slot of [2, 4, 6]) {
        const mains = formulaCfg.acceptedMains?.[slot] || ['None', 'None', 'None'];
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        for (let i = 0; i < 3; i++) {
          html += `<select data-formula="${formulaName}" data-field="acceptedMains" data-slot="${slot}" data-index="${i}" style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
          for (const opt of options) {
            html += `<option value="${opt}" ${mains[i] === opt ? 'selected' : ''}>${opt}</option>`;
          }
          html += `</select>`;
        }
        html += ``;
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
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
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
        const value = formulaCfg.mustHave?.[stage] || '';
        html += `<select data-formula="${formulaName}" data-field="mustHave" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
        const options = ['', 'None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
        for (const opt of options) {
          html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
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
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
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
          const value = formulaCfg.minStats?.[slotType]?.[stage] || 1;
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
        const slot = parseInt(element.dataset.slot);
        const index = parseInt(element.dataset.index);
        if (!settings.formulas[formulaName].acceptedMains) settings.formulas[formulaName].acceptedMains = {};
        if (!settings.formulas[formulaName].acceptedMains[slot]) settings.formulas[formulaName].acceptedMains[slot] = ['None', 'None', 'None'];
        settings.formulas[formulaName].acceptedMains[slot][index] = value;
      } else if (field === 'substats') {
        const stat = element.dataset.stat;
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].substats) settings.formulas[formulaName].substats = {};
        if (!settings.formulas[formulaName].substats[stat]) settings.formulas[formulaName].substats[stat] = {};
        settings.formulas[formulaName].substats[stat][stage] = value;
      } else if (field === 'mustHave') {
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].mustHave) settings.formulas[formulaName].mustHave = {};
        settings.formulas[formulaName].mustHave[stage] = value === '' ? null : value;
      } else if (field === 'slotRequirements') {
        const slot = parseInt(element.dataset.slot);
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].slotRequirements) settings.formulas[formulaName].slotRequirements = {};
        if (!settings.formulas[formulaName].slotRequirements[slot]) settings.formulas[formulaName].slotRequirements[slot] = {};
        settings.formulas[formulaName].slotRequirements[slot][stage] = value;
      } else if (field === 'minStats') {
        const slotType = element.dataset.slot;
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].minStats) settings.formulas[formulaName].minStats = {};
        if (!settings.formulas[formulaName].minStats[slotType]) settings.formulas[formulaName].minStats[slotType] = {};
        settings.formulas[formulaName].minStats[slotType][stage] = value;
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
        settings.roles[formulaName].mustHave[stage] = value === '' ? null : value;
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
  }

  // ===================== SETTINGS UI =====================
  function parseList(v) {
    return (v || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function stringifyGemExtras(extraBadBySlot) {
    const lines = [];
    const m = extraBadBySlot || {};
    for (let slot = 1; slot <= 6; slot++) {
      const v = m[slot] ?? m[String(slot)];
      if (Array.isArray(v) && v.length > 0) {
        lines.push(`${slot}:${v.join(',')}`);
      }
    }
    return lines.join('\n');
  }

  function parseGemExtrasFromText(text) {
    const map = {};
    (text || '').split(/\r?\n/).forEach(line => {
      const ln = line.trim();
      if (!ln) return;
      const matched = ln.match(/^([1-6])\s*:\s*(.+)$/);
      if (!matched) return;
      const slotNum = parseInt(matched[1], 10);
      map[slotNum] = parseList(matched[2]);
    });
    return map;
  }

  function hydrateGemMetaFields(gm) {
    const g = gm || DEFAULT_GEM_META;
    const el = id => document.getElementById(id);
    if (!el('gem-meta-enabled')) return;
    el('gem-meta-enabled').checked = g.enabled !== false;
    el('gem-meta-legend-only').checked = g.legendOnlyInnate === true;
    el('gem-meta-sets').value = (g.sets || []).join(', ');
    el('gem-meta-universal-flats').checked = g.useUniversalFlatBadInnate !== false;
    el('gem-meta-extra-slots').value = stringifyGemExtras(g.extraBadBySlot);
    el('gem-meta-by-set-json').value = g.bySet && Object.keys(g.bySet).length
      ? JSON.stringify(g.bySet, null, 2)
      : '';
    el('gem-meta-legacy-subs').checked = g.legacyFlatSubGem === true;
  }

  function renderRoleSettings() {
    const navWrap = document.getElementById('role-nav-list');
    const contentWrap = document.getElementById('roles-settings-wrap');
    const selector = document.getElementById('role-selector');
    
    if (!navWrap || !contentWrap || !selector) return;
    
    // Use advanced formulas if available, otherwise fall back to legacy roles
    const formulas = window.SWRM.settings.formulas || {};
    const roles = window.SWRM.settings.roles || {};
    
    // Combine all roles/formulas
    const allRoles = { ...formulas, ...roles };
    let currentActiveRole = '';
    
    // Render navigation list
    let navHtml = '';
    for (const [roleName, roleCfg] of Object.entries(allRoles)) {
      const isActive = currentActiveRole === '' || currentActiveRole === roleName;
      const isFormula = formulas[roleName] !== undefined;
      const displayName = roleName + (isFormula ? '' : ' (Legacy)');
      
      navHtml += `<div class="role-nav-item ${isActive ? 'active' : ''}" data-role="${roleName}">${displayName}</div>`;
    }
    navWrap.innerHTML = navHtml;
    
    // Update role selector dropdown
    let selectorHtml = '<option value="">Choose a role...</option>';
    for (const roleName of Object.keys(allRoles)) {
      selectorHtml += `<option value="${roleName}">${roleName}</option>`;
    }
    selector.innerHTML = selectorHtml;
    
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
          <input type="checkbox" data-formula="${roleName}" data-field="enabled" ${roleCfg.enabled ? 'checked' : ''} style="width:18px;height:18px">
          Enable Formula
        </label>`;
      } else {
        html += `<button class="btn-ghost btn-remove-role" data-role-remove="${roleName}" ${Object.keys(roles).length <= 1 ? 'disabled' : ''}>Remove</button>`;
      }
      html += `</div>`;
      
      // Accepted Mains section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Accepted Mains</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Main 1</div><div>Main 2</div><div>Main 3</div>`;
      
      for (const slot of [2, 4, 6]) {
        const mains = roleCfg.acceptedMains?.[slot] || (isFormula ? ['None', 'None', 'None'] : ['HP%', 'ATK%', 'DEF%']);
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        for (let i = 0; i < 3; i++) {
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="acceptedMains" data-slot="${slot}" data-index="${i}"` : `data-role="${roleName}" data-field="acceptedMains" data-slot="${slot}" data-index="${i}"`;
          html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
          for (const opt of options) {
            html += `<option value="${opt}" ${mains[i] === opt ? 'selected' : ''}>${opt}</option>`;
          }
          html += `</select>`;
        }
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
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
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
        const value = (isFormula ? roleCfg.mustHave?.[stage] : roleCfg.mustHave?.[stage]) || '';
        const dataAttr = isFormula ? `data-formula="${roleName}" data-field="mustHave" data-stage="${stage}"` : `data-role="${roleName}" data-field="mustHave" data-stage="${stage}"`;
        html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
        const options = ['', 'None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
        for (const opt of options) {
          html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
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
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`;
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
          const value = (isFormula ? roleCfg.minStats?.[slotType]?.[stage] : roleCfg.minStats?.[stage]) || 1;
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
          renderRoleSettings();
        });
      });
    }
    
    // Set first role as active by default
    const firstRole = Object.keys(allRoles)[0];
    if (firstRole) {
      renderActiveRole(firstRole);
    }
    
    // Add navigation click handlers (only once)
    if (!navWrap.dataset.handlersAdded) {
      navWrap.querySelectorAll('.role-nav-item').forEach(item => {
        item.addEventListener('click', () => {
          const roleName = item.dataset.role;
          
          // Update active state
          navWrap.querySelectorAll('.role-nav-item').forEach(navItem => {
            navItem.classList.remove('active');
          });
          item.classList.add('active');
          
          // Update selector
          selector.value = roleName;
          
          // Render content
          renderActiveRole(roleName);
        });
      });
      navWrap.dataset.handlersAdded = 'true';
    }
    
    // Add selector change handler
    selector.addEventListener('change', () => {
      const roleName = selector.value;
      if (roleName) {
        // Update active state
        navWrap.querySelectorAll('.role-nav-item').forEach(navItem => {
          navItem.classList.remove('active');
          if (navItem.dataset.role === roleName) {
            navItem.classList.add('active');
          }
        });
        
        // Render content
        renderActiveRole(roleName);
      }
    });
  }

  function refreshRoleFilterOptions() {
    const roleSelect = document.getElementById('filter-role');
    if (!roleSelect) return;
    const current = roleSelect.value;
    const formulas = Object.keys(window.SWRM.settings.formulas || {});
    const roles = ['High Roll', 'Duo Roll', ...formulas, ...Object.keys(window.SWRM.settings.roles)];
    const t = TRANSLATIONS[currentLang];
    roleSelect.innerHTML = `<option value="">${t.allRoles}</option>${roles.map(r => `<option value="${r}">${r}</option>`).join('')}`;
    if (roles.includes(current)) roleSelect.value = current;
  }

  function buildThresholdTable(containerId, thresholds, settingsKey) {
    const stages = ['Early','Mid','Late'];
    const grades = ['Leg','Hero'];
    const cols   = stages.flatMap(s => grades.map(g => `${s}_${g}`));
    const colLabels = stages.flatMap(s => grades.map(g => `${s} ${g === 'Leg' ? 'Legend' : 'Hero'}`));

    let html = `<table class="s-table"><thead><tr><th>Stat</th>`;
    colLabels.forEach(c => { html += `<th>${c}</th>`; });
    html += `</tr></thead><tbody>`;

    for (const [stat, vals] of Object.entries(thresholds)) {
      html += `<tr><td>${stat}</td>`;
      cols.forEach(col => {
        html += `<td><input type="number" data-settings="${settingsKey}" data-stat="${stat}" data-col="${col}" value="${vals[col] ?? ''}" min="0" max="100"></td>`;
      });
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById(containerId).innerHTML = html;
  }

  buildThresholdTable('hr-table-wrap', window.SWRM.settings.hrThresholds, 'hrThresholds');

  document.getElementById('hr-coeff').value = window.SWRM.settings.hrCoeff;

  // Duo Roll table
  (function() {
    const dr = window.SWRM.settings.duoThresholds;
    const stages = ['Early','Mid','Late'];
    const grades = ['Leg','Hero'];
    const cols = stages.flatMap(s => grades.map(g => `${s}_${g}`));
    const colLabels = stages.flatMap(s => grades.map(g => `${s} ${g === 'Leg' ? 'Legend' : 'Hero'}`));

    let html = `<table class="s-table"><thead><tr><th>Pair</th>`;
    colLabels.forEach(c => { html += `<th>${c}</th>`; });
    html += `</tr></thead><tbody>`;
    for (const [key, vals] of Object.entries(dr)) {
      html += `<tr><td>${key.replace(/_/g,' ')}</td>`;
      cols.forEach(col => {
        html += `<td><input type="number" data-settings="duoThresholds" data-stat="${key}" data-col="${col}" value="${vals[col] ?? ''}" min="0" max="100"></td>`;
      });
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById('dr-table-wrap').innerHTML = html;
  })();

  refreshRoleFilterOptions();
  renderRoleSettings();

  document.getElementById('btn-add-role')?.addEventListener('click', () => {
    const name = document.getElementById('new-role-name').value.trim();
    if (!name) return;
    
    // Create new role with full formula interface
    const template = {
      enabled: true,
      acceptedMains: {
        2: ['None', 'None', 'None'],
        4: ['None', 'None', 'None'],
        6: ['None', 'None', 'None']
      },
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
    
    document.getElementById('new-role-name').value = '';
    refreshRoleFilterOptions();
  });

  const reapp = window.SWRM.settings.reapp || {};
  document.getElementById('reapp-sets').value = (reapp.sets || []).join(', ');
  document.getElementById('reapp-innate').value = (reapp.innateStats || []).join(', ');
  document.getElementById('reapp-main2').value = (reapp.mainBySlot?.[2] || []).join(', ');
  document.getElementById('reapp-main4').value = (reapp.mainBySlot?.[4] || []).join(', ');
  document.getElementById('reapp-main6').value = (reapp.mainBySlot?.[6] || []).join(', ');
  document.getElementById('reapp-max-eff').value = reapp.maxEff ?? 65;

  hydrateGemMetaFields(window.SWRM.settings.gemMeta);

  // Save settings
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const s = window.SWRM.settings;

    // HR coeff
    s.hrCoeff = parseFloat(document.getElementById('hr-coeff').value) || 0.7;

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

    let gemBySet = {};
    const gemJsonRaw = (document.getElementById('gem-meta-by-set-json').value || '').trim();
    if (gemJsonRaw) {
      try {
        const parsed = JSON.parse(gemJsonRaw);
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          throw new Error('Root must be an object');
        }
        gemBySet = parsed;
      } catch (e) {
        alert('Gem per-set JSON: invalid JSON — ' + (e && e.message ? e.message : e));
        return;
      }
    }

    s.gemMeta = window.SWRM.mergeGemMeta({
      enabled: document.getElementById('gem-meta-enabled').checked,
      legendOnlyInnate: document.getElementById('gem-meta-legend-only').checked,
      sets: parseList(document.getElementById('gem-meta-sets').value),
      useUniversalFlatBadInnate: document.getElementById('gem-meta-universal-flats').checked,
      extraBadBySlot: parseGemExtrasFromText(document.getElementById('gem-meta-extra-slots').value),
      bySet: gemBySet,
      legacyFlatSubGem: document.getElementById('gem-meta-legacy-subs').checked,
    });

    saveSettings(s);
    refreshRoleFilterOptions();
    if (processedRunes.length) reprocess();
    alert('Settings saved & recalculated!');
  });

  
  // Initialize on page load
  document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    updateLanguage(currentLang);
    
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
        uiShowUploadPrompt();
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
          if (hasSlotMeta && targetSlot) {
            console.log(`Slot ${targetSlot.id} has metadata but no readable JSON; showing upload prompt`);
          } else {
            console.log('No saved runes found; showing upload prompt');
          }
          uiShowUploadPrompt();
        }
      }
    } catch (err) {
      console.error('Error during restore:', err);
      uiShowUploadPrompt();
    }

    // Initialize Database slots
    renderDbSlots();
    renderActionList(getVisibleRunes());
  });

  // Reset settings
  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults?')) return;
    window.SWRM.settings = {
      hrThresholds:  JSON.parse(JSON.stringify(DEFAULT_HR_THRESHOLDS)),
      hrCoeff:       DEFAULT_HR_COEFF,
      duoThresholds: JSON.parse(JSON.stringify(DEFAULT_DUO_THRESHOLDS)),
      roles:         JSON.parse(JSON.stringify(DEFAULT_ROLES)),
      reapp:         JSON.parse(JSON.stringify(DEFAULT_REAPP)),
      gemMeta:       JSON.parse(JSON.stringify(DEFAULT_GEM_META)),
    };
    localStorage.removeItem('swrm_settings_v1');
    location.reload();
  });

  // ===================== APP SETTINGS =====================
  const DB_SLOTS_META_KEY = 'swrm_db_slots_meta_v1';
  const CHANGELOG_KEY = 'swrm_changelog_v1';

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
    document.getElementById('upload-prompt').classList.add('hidden');
  }

  function parseAndLoadJson(jsonText) {
    processJsonData(jsonText);
    document.getElementById('tab-dashboard').classList.remove('hidden');
    // activate dashboard tab
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'dashboard');
    });
  }

  const appLangSelect = document.getElementById('app-language');
  if (appLangSelect) {
    appLangSelect.value = currentLang;
    appLangSelect.addEventListener('change', () => {
      updateLanguage(appLangSelect.value);
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
          await clearAllIndexedDbRunePayloads();
          clearLocalStorageRuneBackup();
          saveDbSlots(defaultEmptyDbSlotsMeta());
          uiEmptyRuneApplicationState({ keepTab: true });
          showSwrmToast(t.slotDeleteAllCleared || 'All saved databases were removed.', { type: 'info' });
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
            await clearAllIndexedDbRunePayloads();
            clearLocalStorageRuneBackup();
            saveDbSlots(defaultEmptyDbSlotsMeta());
            uiEmptyRuneApplicationState({ keepTab: true });
            showSwrmToast(t.slotDeleteNextLoadFailed || 'Could not load the next database.', { type: 'error', duration: 7000 });
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

  // ===================== CHANGELOG =====================
  function loadChangelog() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]');
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    return [];
  }
  function saveChangelog(items) {
    localStorage.setItem(CHANGELOG_KEY, JSON.stringify(items));
  }
  function renderChangelog() {
    const list = document.getElementById('changelog-list');
    if (!list) return;
    const items = loadChangelog();
    list.innerHTML = items.length
      ? items.map(it => `<p><strong>${it.date}</strong> — ${it.text}</p>`).join('')
      : '<p>No changelog entries yet.</p>';
  }
  document.getElementById('btn-add-changelog')?.addEventListener('click', () => {
    const input = document.getElementById('changelog-input');
    const text = (input?.value || '').trim();
    if (!text) return;
    const items = loadChangelog();
    items.unshift({ date: new Date().toLocaleString(), text });
    saveChangelog(items);
    input.value = '';
    renderChangelog();
  });
  renderChangelog();

})();
