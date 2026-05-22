// js/features/runes/rune-processor-worker.js — optional Web Worker for processAll()
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
