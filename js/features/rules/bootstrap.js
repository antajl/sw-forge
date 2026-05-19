// js/features/rules/bootstrap.js — rules event wiring

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
    initSwrmFloatingTips();
    initTheme();
    updateLanguage(currentLang);
    initDashboardUnifiedTabs();
    initRuneTablePrefsFromStorage();
    initRulesSubtabs();
    initChangelogSubtabs();
    initGuideSubtabs();
    showMainTab(mainTabIdFromHash() || 'runes');

    if (typeof initShareProfile === 'function') {
      const openedShare = await initShareProfile();
      if (openedShare) {
        renderDbSlots();
        return;
      }
    }

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
