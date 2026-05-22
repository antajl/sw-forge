/* Rune verdict engine — runs off the main thread (importScripts bundle). */
self.window = self;

importScripts(
  '../core/meta.js',
  '../core/i18n.js',
  '../core/defaults.js',
  '../core/changelog-data.js',
  '../core/bootstrap.js',
  '../engine/engine-core.js',
  '../engine/engine-legacy-roles.js',
  '../engine/engine-gem-reapp-verdict.js',
  '../advanced-formulas.js',
  '../engine/engine-process.js',
);

self.onmessage = function onRuneProcessorMessage({ data }) {
  const { runes, stage, settings, requestId } = data || {};
  try {
    if (settings && self.window.SWRM) {
      self.window.SWRM.settings = settings;
    }
    const S = self.window.SWRM;
    const result = S.processAll(runes, stage, settings || S.settings);
    self.postMessage({ requestId, result, error: null });
  } catch (e) {
    self.postMessage({
      requestId,
      result: null,
      error: (e && e.message) || String(e),
    });
  }
};
