// js/features/rules/bootstrap.js — rules event wiring

  buildStatConstantsTable();
  refreshEnginePreviews();
  if (typeof initArtifactRulesPanel === 'function') initArtifactRulesPanel();

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
  const oddSlotsEl = document.getElementById('reapp-odd-slots');
  if (oddSlotsEl) oddSlotsEl.checked = reapp.oddSlots !== false;
  const oddInnateEl = document.getElementById('reapp-odd-innate');
  if (oddInnateEl) oddInnateEl.value = (reapp.oddSlotInnate || []).join(', ');
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
      },
      oddSlots: document.getElementById('reapp-odd-slots')?.checked !== false,
      oddSlotInnate: parseList(document.getElementById('reapp-odd-innate')?.value || ''),
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

    const shareIdInUrl =
      typeof getShareIdFromUrl === 'function' ? getShareIdFromUrl() : '';
    const profileInUrl =
      typeof getProfileLinkFromUrl === 'function' ? getProfileLinkFromUrl() : null;
    const hasProfileLink =
      profileInUrl && (profileInUrl.profileUrl || profileInUrl.dataBlob);
    if ((shareIdInUrl || hasProfileLink) && typeof initShareProfile === 'function') {
      await initShareProfile();
      await updateLanguage(currentLang);
      initDashboardUnifiedTabs();
      initRuneTablePrefsFromStorage();
      if (typeof initTableKindTabs === 'function') initTableKindTabs();
      initRulesSubtabs();
      initChangelogSubtabs();
      initGuideSubtabs();
      showMainTab(mainTabIdFromHash() || 'runes');
      renderDbSlots();
      if (typeof applyShareUrlTabFromLocation === 'function') applyShareUrlTabFromLocation();
      return;
    }

    if (typeof beginPrimaryDatasetRestore === 'function') beginPrimaryDatasetRestore();
    if (typeof initShareProfile === 'function') {
      await initShareProfile();
    }
    if (typeof scrubDemoFromUserSlots === 'function') {
      await scrubDemoFromUserSlots();
    }

    let boot = { restored: false };
    if (typeof restorePrimaryRunesDatasetOnBoot === 'function') {
      boot = await restorePrimaryRunesDatasetOnBoot();
    }
    if (typeof endPrimaryDatasetRestore === 'function') endPrimaryDatasetRestore();

    await updateLanguage(currentLang);
    initDashboardUnifiedTabs();
    initRuneTablePrefsFromStorage();
    if (typeof initTableKindTabs === 'function') initTableKindTabs();
    initRulesSubtabs();
    initChangelogSubtabs();
    initGuideSubtabs();
    showMainTab(mainTabIdFromHash() || 'runes');

    if (boot.restored && boot.meta) {
      uiAfterSuccessfulRuneRestore(boot.meta);
    } else {
      uiShowUploadPrompt();
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
