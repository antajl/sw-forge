// =============================================
// engine-process.js — role merge, best role, processRune / processAll
// Depends on: engine-core.js, engine-legacy-roles.js, engine-gem-reapp-verdict.js
// Load before advanced-formulas.js
// =============================================

(function() {
  const S = window.SWRM;

  const ROLE_PRIORITY_CORE = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Duo Roll', 'High Roll'];

  function roleMatchActive(name, mergedResults, settings) {
    if (!mergedResults[name]) return false;
    const f = settings.formulas?.[name];
    if (f && f.enabled === false) return false;
    return true;
  }

  function buildRoleEvaluationOrder(settings) {
    const configuredNames = Array.from(new Set([
      ...Object.keys(settings.roles || {}),
      ...Object.keys(settings.formulas || {}),
    ]));
    const storedPriority = Array.isArray(settings.rolePriority) ? settings.rolePriority : [];
    const mergedPriority = [
      ...storedPriority.filter(name => configuredNames.includes(name)),
      ...configuredNames.filter(name => !storedPriority.includes(name)),
    ];
    if (mergedPriority.length) {
      return mergedPriority.concat(['Duo Roll', 'High Roll']);
    }

    const pivot = ROLE_PRIORITY_CORE.indexOf('Duo Roll');
    if (pivot < 0) return ROLE_PRIORITY_CORE.slice();

    const head = ROLE_PRIORITY_CORE.slice(0, pivot);
    const tail = ROLE_PRIORITY_CORE.slice(pivot);
    const mid = [];
    const seen = new Set(ROLE_PRIORITY_CORE);

    for (const bucket of [Object.keys(settings.roles || {}), Object.keys(settings.formulas || {})]) {
      for (const k of bucket) {
        if (seen.has(k)) continue;
        seen.add(k);
        mid.push(k);
      }
    }

    return head.concat(mid, tail);
  }

  function pickBestRole(mergedResults, settings) {
    const order = buildRoleEvaluationOrder(settings);
    for (let i = 0; i < order.length; i++) {
      if (roleMatchActive(order[i], mergedResults, settings)) {
        return order[i];
      }
    }
    return '';
  }

  function processRune(rune, stage, settings) {
    const results = {};

    results['High Roll'] = S.checkHighRoll(rune, stage, settings);
    results['Duo Roll'] = S.checkDuoRoll(rune, stage, settings);
    const classicFormulaEnabled = settings.formulas?.['Classic DPS'] && settings.formulas['Classic DPS'].enabled !== false;
    if (!classicFormulaEnabled) {
      results['Classic DPS'] = S.checkClassicDPS(rune, stage, settings);
    }

    for (const role of Object.keys(settings.roles)) {
      if (role === 'Classic DPS') continue;
      results[role] = S.checkRole(rune, role, stage, settings);
    }

    const advancedResults = window.SWRM.processAdvancedFormulas?.(rune, stage, settings) || {};

    const mergedResults = { ...results, ...advancedResults };

    const bestRole = pickBestRole(mergedResults, settings);

    rune.role = bestRole;
    rune.verdict = window.SWRM.getAdvancedVerdict?.(rune, stage, settings, mergedResults) ||
      S.getBaseVerdict(rune, stage, settings, bestRole, mergedResults);
    rune.badFlat = S.hasBadFlat(rune, stage);
    rune.grindInfo = S.checkGrind(rune, stage, settings);
    rune.gemInfo = S.evaluateGemRecommendation(rune, stage, settings);
    rune.formulaResults = mergedResults;

    return rune;
  }

  function processAll(runes, stage, settings) {
    return runes.map(r => processRune(r, stage, settings));
  }

  S.processAll = processAll;
  S.processRune = processRune;
  S.ROLE_PRIORITY = ROLE_PRIORITY_CORE;
  S.pickBestRole = pickBestRole;
})();
