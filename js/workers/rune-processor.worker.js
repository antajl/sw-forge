/* Rune verdict and progression engine — runs off the main thread (importScripts bundle). */
self.window = self;

importScripts(
  '../core/meta.js',
  '../core/translations.js',
  '../core/defaults.js',
  '../core/changelog-data.js',
  '../core/bootstrap.js',
  '../engine/engine-core.js',
  '../engine/engine-legacy-roles.js',
  '../engine/engine-gem-reapp-verdict.js',
  '../advanced-formulas.js',
  '../engine/engine-process.js',
  '../data/ingame-score.js',
  '../features/runes/rune-score.js',
  '../engine/engine-depth.js',
);

self.onmessage = function onRuneProcessorMessage({ data }) {
  const { runes, stage, settings, units, requestId } = data || {};
  try {
    if (settings && self.window.SWRM) {
      self.window.SWRM.settings = settings;
    }
    const S = self.window.SWRM;
    const processed = S.processAll(runes, stage, settings || S.settings);

    // Compute Forge Score and Ingame Score off-thread
    const computeScore = S.computeForgeScore || S.computeRuneScore;
    const calcIngame = S.calcIngameScore;
    if (Array.isArray(processed)) {
      for (let i = 0; i < processed.length; i++) {
        const r = processed[i];
        if (!r) continue;
        if (computeScore && r.forgeScore == null) {
          r.forgeScore = computeScore(r);
        }
        if (calcIngame && r.ingameScore == null) {
          r.ingameScore = calcIngame(r);
        }
      }
    }

    // Compute Game Stage & Depth v2 progression metrics off-thread
    let gameStageMetrics = null;
    if (typeof S.analyzeGameStage === 'function' && Array.isArray(processed)) {
      gameStageMetrics = S.analyzeGameStage(processed, units);
    }

    self.postMessage({ requestId, result: processed, gameStageMetrics, error: null });
  } catch (e) {
    self.postMessage({
      requestId,
      result: null,
      gameStageMetrics: null,
      error: (e && e.message) || String(e),
    });
  }
};
