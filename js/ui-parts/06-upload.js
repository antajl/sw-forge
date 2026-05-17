// ui-parts/06-upload.js — slice of ui.monolith.bak.js L1093-1487
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
    renderMonstersPanel();
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
