// js/features/runes/rune-processor-worker.js — Web Worker for processAll() & off-thread metrics
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
        else h.resolve(data);
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

  function processRunesAsync(runes, stage, settings, options = {}) {
    const units = options.units || (typeof allUnits !== 'undefined' ? allUnits : []);
    const sync = () => {
      const p = typeof processAll === 'function'
        ? processAll(runes, stage, settings)
        : SWRM_NS.processAll(runes, stage, settings);
      if (typeof attachForgeScoresToRunes === 'function') attachForgeScoresToRunes(p);
      return p;
    };

    const w = getRuneWorker();
    if (!w) return Promise.resolve(sync());

    return new Promise((resolve, reject) => {
      const requestId = ++pendingId;
      handlers.set(requestId, { resolve, reject });
      try {
        w.postMessage({ runes, stage, settings, units, requestId });
      } catch (e) {
        handlers.delete(requestId);
        reject(e);
      }
    }).then((data) => {
      const result = data && data.result ? data.result : data;
      if (data && data.gameStageMetrics && typeof gameStageMetricsCache !== 'undefined') {
        const key = `${typeof swrmAllRunesRev !== 'undefined' ? swrmAllRunesRev : 0}:${Array.isArray(runes) ? runes.length : 0}:${Array.isArray(units) ? units.length : 0}`;
        gameStageMetricsCache.key = key;
        gameStageMetricsCache.value = data.gameStageMetrics;
      }
      return result;
    }).catch((err) => {
      console.warn('processRunesAsync: worker unavailable, using main thread', err);
      return sync();
    });
  }

  SWRM_NS.processRunesAsync = processRunesAsync;
