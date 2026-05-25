// js/features/runes/processed-cache.js — skip processAll on reload when SWEX + settings unchanged
  const PROCESSED_CACHE_KEY_PREFIX = '__proc_v1__';
  const PROCESSED_CACHE_SCHEMA = 1;

  /** First hydrate after F5/navigation: skip chart tweens and defer table/monsters. */
  let swrmColdBootPending = true;
  /** True while bootstrap is loading the primary SWEX slot (blocks eager demo). */
  let swrmPrimaryDatasetRestorePending = false;

  function beginPrimaryDatasetRestore() {
    swrmColdBootPending = true;
    swrmPrimaryDatasetRestorePending = true;
  }

  function endPrimaryDatasetRestore() {
    swrmPrimaryDatasetRestorePending = false;
  }

  function isPrimaryDatasetRestorePending() {
    return swrmPrimaryDatasetRestorePending;
  }

  function isColdBootUiPending() {
    return swrmColdBootPending;
  }

  function consumeColdBootUiOpts() {
    if (!swrmColdBootPending) return null;
    swrmColdBootPending = false;
    return { animateCharts: false, fromZero: false, deferSecondaryUi: true };
  }

  function scheduleDeferredSecondaryPanels(visible) {
    const run = () => {
      if (typeof renderTable === 'function') renderTable(visible);
      if (typeof renderMonstersPanel === 'function') renderMonstersPanel();
    };
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(run, { timeout: 2500 });
    } else {
      setTimeout(run, 16);
    }
  }

  /**
   * Dashboard + optional table/monsters after hydrate or reprocess.
   * @param {{ animateCharts?: boolean, fromZero?: boolean, deferSecondaryUi?: boolean }} [extra]
   */
  function renderHydratedAppUi(extra = {}) {
    const boot = consumeColdBootUiOpts();
    const animateCharts = extra.animateCharts ?? boot?.animateCharts ?? true;
    const fromZero = extra.fromZero ?? boot?.fromZero ?? false;
    const deferSecondary =
      extra.deferSecondaryUi ?? boot?.deferSecondaryUi ?? false;
    const visible =
      typeof getVisibleRunes === 'function' ? getVisibleRunes() : processedRunes;
    if (typeof renderDashboard === 'function') {
      renderDashboard(visible, { animateCharts, fromZero });
    }
    if (deferSecondary) scheduleDeferredSecondaryPanels(visible);
    else {
      if (typeof renderTable === 'function') renderTable(visible);
      if (typeof renderMonstersPanel === 'function') renderMonstersPanel();
    }
  }

  function processedCacheStorageKey(cacheId) {
    return `${PROCESSED_CACHE_KEY_PREFIX}${cacheId}`;
  }

  function hashStringDjb2(text) {
    let h = 5381;
    const s = String(text || '');
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) + h) ^ s.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
  }

  function stableStringify(value) {
    if (value == null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) {
      return '[' + value.map((v) => stableStringify(v)).join(',') + ']';
    }
    const keys = Object.keys(value).sort();
    return (
      '{' +
      keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') +
      '}'
    );
  }

  function pickSettingsForFingerprint(settings) {
    if (!settings || typeof settings !== 'object') return {};
    return {
      policy: settings.policy,
      formulas: settings.formulas,
      roles: settings.roles,
      constants: settings.statConstants || settings.constants,
      thresholds: settings.thresholds,
      reapp: settings.reapp,
      grind: settings.grind,
      gem: settings.gemMeta || settings.gem,
      rolePriority: settings.rolePriority,
    };
  }

  function buildProcessFingerprint(jsonText, runStage, settings) {
    const appVer = (window.SWRM && window.SWRM.APP_VERSION) || '';
    const swexKey = hashStringDjb2(String(jsonText || ''));
    const cfgKey = hashStringDjb2(
      stableStringify(pickSettingsForFingerprint(settings || {})),
    );
    const stageKey = String(runStage || '');
    return `${appVer}|${PROCESSED_CACHE_SCHEMA}|${stageKey}|${swexKey}|${cfgKey}`;
  }

  function getProcessCacheId(explicitId) {
    if (explicitId != null && String(explicitId).trim() !== '') {
      return String(explicitId);
    }
    if (typeof isUsingDemoDataset === 'function' && isUsingDemoDataset()) {
      return typeof DEMO_IDB_KEY === 'string' ? DEMO_IDB_KEY : '__swrm_embedded_demo__';
    }
    try {
      const slots = typeof loadDbSlots === 'function' ? loadDbSlots() : [];
      const active = slots.find((s) => s.active && s.name && String(s.name).trim());
      if (active) return String(active.id);
      const named = slots.find((s) => s.name && String(s.name).trim());
      if (named) return String(named.id);
    } catch (e) {
      /* ignore */
    }
    return 'legacy';
  }

  async function loadProcessedRunesCache(cacheId, fingerprint) {
    if (!fingerprint || typeof loadSlotData !== 'function') return null;
    try {
      const raw = await loadSlotData(processedCacheStorageKey(cacheId));
      if (!raw) return null;
      const payload = JSON.parse(raw);
      if (!payload || payload.fingerprint !== fingerprint) return null;
      if (!Array.isArray(payload.runes) || !payload.runes.length) return null;
      return payload.runes;
    } catch (e) {
      console.warn('loadProcessedRunesCache', e);
      return null;
    }
  }

  async function saveProcessedRunesCache(cacheId, fingerprint, runes) {
    if (
      !fingerprint ||
      !Array.isArray(runes) ||
      !runes.length ||
      typeof saveSlotData !== 'function'
    ) {
      return;
    }
    try {
      const payload = {
        v: PROCESSED_CACHE_SCHEMA,
        fingerprint,
        at: Date.now(),
        runes,
      };
      await saveSlotData(
        processedCacheStorageKey(cacheId),
        JSON.stringify(payload),
      );
    } catch (e) {
      console.warn('saveProcessedRunesCache', e);
    }
  }

  async function deleteProcessedRunesCache(cacheId) {
    if (typeof deleteSlotDataRobust !== 'function') return;
    try {
      await deleteSlotDataRobust(processedCacheStorageKey(cacheId));
    } catch (e) {
      /* ignore */
    }
  }

  async function getActiveSwexJsonTextForCache(cacheId) {
    const id = getProcessCacheId(cacheId);
    if (typeof loadSlotData === 'function') {
      const fromIdb = await loadSlotData(id);
      if (fromIdb) return fromIdb;
    }
    try {
      const ls = localStorage.getItem('loadedRunes');
      if (ls) return ls;
    } catch (e) {
      /* ignore */
    }
    if (activeSwexJson) return JSON.stringify(activeSwexJson);
    return '';
  }

  async function tryRestoreProcessedFromCache(jsonText, cacheId) {
    const settings = window.SWRM && window.SWRM.settings;
    const fp = buildProcessFingerprint(jsonText, stage, settings);
    const id = getProcessCacheId(cacheId);
    const runes = await loadProcessedRunesCache(id, fp);
    if (!runes) return false;
    processedRunes = runes;
    if (typeof attachForgeScoresToRunes === 'function') {
      attachForgeScoresToRunes(processedRunes);
    }
    if (typeof bumpProcessedRev === 'function') bumpProcessedRev();
    if (typeof renderHydratedAppUi === 'function') {
      renderHydratedAppUi({ animateCharts: false, fromZero: false });
    }
    console.log('[SWRM] Restored %s processed runes from cache (slot %s)', runes.length, id);
    return true;
  }
