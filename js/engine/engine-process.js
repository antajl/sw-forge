// =============================================
// engine-process.js — role merge, best role, processRune / processAll
// Depends on: engine-core.js, engine-legacy-roles.js, engine-gem-reapp-verdict.js, advanced-formulas.js (runtime)
// =============================================

(function() {
  const S = window.SWRM;

  const ROLE_PRIORITY_CORE = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Universal'];
  const GOD_ROLL_LEGACY = 'High Roll';
  const GOD_OR_DUO_BEST_ROLES = new Set(['God Roll', GOD_ROLL_LEGACY, 'Duo Roll']);

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
      return mergedPriority.concat(['Universal']);
    }

    const pivot = ROLE_PRIORITY_CORE.indexOf('Universal');
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

  /** After grind: pickBestRole is non-empty and not only God/Duo/High (custom formula slots count). */
  function mergedResultsHasPrimaryBuildMatch(mergedResults, settings) {
    const best = pickBestRole(mergedResults, settings);
    if (!best) return false;
    if (GOD_OR_DUO_BEST_ROLES.has(best)) return false;
    return true;
  }

  /** Canonical verdict tree (advanced-formulas.js). Do not use legacy getBaseVerdict. */
  function getRuneVerdict(rune, stage, settings, mergedResults) {
    const fn = window.SWRM.getAdvancedVerdict;
    if (typeof fn !== 'function') {
      throw new Error('SWRM.getAdvancedVerdict missing — load advanced-formulas.js before engine-process.js');
    }
    return fn(rune, stage, settings, mergedResults);
  }

  /** Same merge as processRune (God/Duo + legacy roles + advanced formulas). */
  function buildMergedResults(rune, stage, settings) {
    const results = {};
    const godRoll = S.checkHighRoll(rune, stage, settings);
    results['God Roll'] = godRoll;
    results[GOD_ROLL_LEGACY] = godRoll;
    results['Duo Roll'] = S.checkDuoRoll(rune, stage, settings);
    const formulaKeys = new Set(Object.keys(settings.formulas || {}));
    for (const role of Object.keys(settings.roles || {})) {
      if (formulaKeys.has(role)) continue;
      results[role] = S.checkRole(rune, role, stage, settings);
    }
    const advancedResults = window.SWRM.processAdvancedFormulas?.(rune, stage, settings) || {};
    return { ...results, ...advancedResults };
  }

  /**
   * Grind is useful only if the stone yields a **primary build** role match (not only God/Duo/High).
   */
  function grindEnablesMatch(rune, grind, stage, settings) {
    if (!grind || !grind.can || !grind.stat) return false;
    const cloned = {
      ...rune,
      substats: (rune.substats || []).map((s) => ({ ...s })),
    };
    const gain = grind.stat === 'SPD' ? 5 : 10;
    let applied = false;
    for (let i = 0; i < cloned.substats.length; i++) {
      const s = cloned.substats[i];
      if (typeof S.isQualifyingSubstatRow === 'function' && !S.isQualifyingSubstatRow(s)) continue;
      if (s.name !== grind.stat) continue;
      if ((s.grind || 0) !== 0) continue;
      if (s.enchanted === true) continue;
      if ((s.gem || 0) !== 0) continue;
      const base = s.val || 0;
      if (typeof grind.from === 'number' && base !== grind.from) continue;
      s.grind = (s.grind || 0) + gain;
      applied = true;
      break;
    }
    if (!applied) return false;
    const merged = buildMergedResults(cloned, stage, settings);
    return mergedResultsHasPrimaryBuildMatch(merged, settings);
  }

  function normalizeBestRole(bestRole) {
    return bestRole === GOD_ROLL_LEGACY ? 'God Roll' : (bestRole || '');
  }

  function computeMatchState(mergedResults, settings) {
    const policy = settings?.policy || {};
    const rawBestRole = pickBestRole(mergedResults, settings);
    const bestRole = normalizeBestRole(rawBestRole);
    const hasRole = !!bestRole && bestRole !== 'God Roll' && bestRole !== 'Duo Roll';
    const hasGod = policy.godCountsAsRole !== false && !!(mergedResults['God Roll'] || mergedResults[GOD_ROLL_LEGACY]);
    const hasDuo = policy.duoCountsAsRole !== false && !!mergedResults['Duo Roll'];
    return { rawBestRole, bestRole, hasRole, hasGod, hasDuo };
  }

  function findRelaxedSpecificRole(rune, stage, settings) {
    if (typeof window.SWRM.evaluateFormula !== 'function') return '';
    const policy = settings?.policy || {};
    const mode = policy.relaxedRetryMode || 'normal';
    if (mode === 'off') return '';

    const relaxedSettings = JSON.parse(JSON.stringify(settings || {}));
    relaxedSettings.policy = relaxedSettings.policy || {};
    relaxedSettings.policy.anchorMode = 'soft';
    relaxedSettings.policy.slotRequirementMode = 'soft';

    const floorP = Number(policy.minRolePressure);
    const minP = Number.isFinite(floorP) ? Math.max(0, Math.min(1, floorP)) : 0;

    if (mode === 'strict') {
      relaxedSettings.policy.minRolePressure = Math.max(0.25, minP * 0.92);
      relaxedSettings.policy.rolePressureByRole = policy.rolePressureByRole && typeof policy.rolePressureByRole === 'object'
        ? JSON.parse(JSON.stringify(policy.rolePressureByRole))
        : {};
      const usefulStrict = { ...(policy.minUsefulSubsByRole || {}) };
      Object.keys(relaxedSettings.formulas || {}).forEach((name) => {
        const v = Number(usefulStrict[name]);
        const base = Number.isFinite(v) ? v : 2;
        usefulStrict[name] = Math.max(2, Math.min(8, base));
      });
      relaxedSettings.policy.minUsefulSubsByRole = usefulStrict;
    } else {
      // Normal relaxed retry: still soften anchor/slot, but keep role pressure shape so
      // strictness (and per-role floors) continues to matter — do not zero rolePressureByRole.
      const lvl = Number(policy.simpleStrictness);
      const L = Number.isFinite(lvl) ? Math.max(1, Math.min(5, lvl)) : 3;
      const relaxTable = { 1: 0.26, 2: 0.17, 3: 0.09, 4: 0.04 };
      const relax = relaxTable[L] != null ? relaxTable[L] : 0.09;
      relaxedSettings.policy.minRolePressure = Math.max(0, minP - relax * 0.92);

      const rpIn = policy.rolePressureByRole && typeof policy.rolePressureByRole === 'object' ? policy.rolePressureByRole : {};
      const scaleMap = { 1: 0.58, 2: 0.68, 3: 0.78, 4: 0.88, 5: 0.92 };
      const scale = scaleMap[L] != null ? scaleMap[L] : 0.78;
      const rpOut = {};
      Object.keys(rpIn).forEach((k) => {
        const v = Number(rpIn[k]);
        if (!Number.isFinite(v)) return;
        rpOut[k] = Math.max(0.2, Math.min(0.78, v * scale));
      });
      relaxedSettings.policy.rolePressureByRole = rpOut;

      const useful = {};
      const drop = Math.max(0, 3 - L);
      Object.keys(relaxedSettings.formulas || {}).forEach((name) => {
        const fromPol = Number(policy.minUsefulSubsByRole?.[name]);
        const mu = Number.isFinite(fromPol) ? fromPol : 2;
        useful[name] = Math.max(1, Math.min(8, mu - drop));
      });
      relaxedSettings.policy.minUsefulSubsByRole = useful;
    }
    // Relaxed retry: allow at most one excluded stat if it is a low flat or low RES.
    const sm = typeof S.statMap === 'function' ? S.statMap(rune) : {};
    const lowFlat = { HP: 200, ATK: 20, DEF: 20 };
    Object.values(relaxedSettings.formulas || {}).forEach((f) => {
      if (!f || !f.substats) return;
      let allowedUsed = false;
      Object.keys(f.substats).forEach((st) => {
        const cur = f.substats?.[st]?.[stage];
        if (cur !== 'Exclude') return;
        const val = Number(sm[st] || 0);
        const ok =
          (!allowedUsed && st in lowFlat && val > 0 && val <= lowFlat[st])
          || (!allowedUsed && st === 'RES' && val > 0 && val <= 8);
        if (ok) {
          f.substats[st][stage] = 'None';
          allowedUsed = true;
        }
      });
    });
    const map = {};
    Object.keys(relaxedSettings.formulas || {}).forEach((name) => {
      const ev = window.SWRM.evaluateFormula(rune, name, stage, relaxedSettings);
      map[name] = !!ev?.policyMatched;
    });
    return pickBestRole(map, relaxedSettings);
  }

  function applyNoMatchSafety(verdict, matchState) {
    if (S.DEBUG_BYPASS_EFFICIENCY_GATES === true) return verdict;
    if (matchState.hasRole || matchState.hasGod || matchState.hasDuo) return verdict;
    return ['Sell', 'Reapp', 'Upgrade', 'Grind', 'Finish'].includes(verdict) ? verdict : 'Sell';
  }

  function buildDecisionTrace(rune, stage, settings, mergedResults, matchState, verdict, formulaDetails, strictFormulaResults) {
    const policyFormulaResults = {};
    Object.keys(formulaDetails || {}).forEach((name) => {
      policyFormulaResults[name] = !!formulaDetails[name]?.policyMatched;
    });
    const strictBestFormula = pickBestRole(strictFormulaResults || {}, settings);
    const policyBestFormula = pickBestRole(policyFormulaResults, settings);
    const softenedChecks = Object.entries(formulaDetails || {})
      .filter(([, d]) => d && Array.isArray(d.softOverrides) && d.softOverrides.length)
      .map(([name, d]) => ({ role: name, checks: d.softOverrides.slice() }));
    return {
      stage,
      level: rune.level,
      bestRole: matchState.bestRole,
      hasRole: matchState.hasRole,
      hasGod: matchState.hasGod,
      hasDuo: matchState.hasDuo,
      verdict,
      formulaResults: mergedResults,
      strictFormulaResults: strictFormulaResults || {},
      policyFormulaResults,
      strictFormulaMatch: Object.values(strictFormulaResults || {}).some(Boolean),
      policyFormulaMatch: Object.values(policyFormulaResults).some(Boolean),
      strictBestFormula: strictBestFormula || '',
      policyBestFormula: policyBestFormula || '',
      softenedChecks,
      formulaDetails: formulaDetails || {},
      borderlineGuard: rune.borderlineGuard || null,
    };
  }

  function evaluateBorderlineGuard(rune, settings, matchState, formulaDetails) {
    const cfg = (typeof S.mergeBorderlinePolicy === 'function')
      ? S.mergeBorderlinePolicy(settings?.borderlinePolicy)
      : (settings?.borderlinePolicy || {});
    const res = { enabled: !!cfg.enabled, eligible: false, blockedBy: [], minFitScore: cfg.minFitScore || 0 };
    if (!cfg.enabled) {
      res.blockedBy.push('disabled');
      return res;
    }
    const fitScore = Number(rune?.fitSummary?.bestScore || 0);
    if (fitScore < Number(cfg.minFitScore || 0)) res.blockedBy.push('low_fit');
    const softened = Object.entries(formulaDetails || {})
      .filter(([, d]) => d && Array.isArray(d.softOverrides) && d.softOverrides.length)
      .map(([role, d]) => ({ role, checks: d.softOverrides.slice() }));
    const softenedCount = softened.reduce((acc, it) => acc + (Array.isArray(it?.checks) ? it.checks.length : 0), 0);
    if (softenedCount > Number(cfg.maxSoftenedChecks || 0)) res.blockedBy.push('too_many_soft_overrides');
    const policyRole = matchState?.bestRole || '';
    if (cfg.requirePolicyMatch !== false && !policyRole) res.blockedBy.push('no_policy_match');
    if (cfg.disallowWhenNoRoleDirection !== false && !policyRole) res.blockedBy.push('no_role_direction');
    if (cfg.keepVerdictsOnly !== false && rune?.verdict !== 'Keep') res.blockedBy.push('verdict_not_keep');
    res.eligible = res.blockedBy.length === 0;
    res.fitScore = fitScore;
    res.policyRole = policyRole || '';
    res.softenedCount = softenedCount;
    return res;
  }

  function enrichRuneMeta(rune, stage, settings) {
    rune.badFlat = S.hasBadFlat(rune, stage);
    rune.grindInfo = S.checkGrind(rune, stage, settings);
    rune.gemInfo = S.evaluateGemRecommendation(rune, stage, settings);
    if (
      rune.verdict === 'Gem' &&
      (!rune.gemInfo || !rune.gemInfo.can) &&
      rune.badFlat &&
      typeof S.listBadFlatSubNames === 'function'
    ) {
      const badFlatSubs = S.listBadFlatSubNames(rune);
      if (badFlatSubs.length) rune.gemInfo = { can: true, badFlatSubs };
    }
  }

  function processRune(rune, stage, settings) {
    const mergedResults = buildMergedResults(rune, stage, settings);
    // God/Duo are tags, not primary roles.
    const specificRoleMatched = Object.keys(settings?.formulas || {}).some((name) => !!mergedResults[name]);
    if (!specificRoleMatched) {
      const relaxedRole = findRelaxedSpecificRole(rune, stage, settings);
      if (relaxedRole) {
        mergedResults[relaxedRole] = true;
        rune.policyRelaxedRole = relaxedRole;
      } else if (mergedResults['God Roll'] || mergedResults['High Roll'] || mergedResults['Duo Roll']) {
        mergedResults.Universal = true;
        rune.universalSource = mergedResults['God Roll'] || mergedResults['High Roll'] ? 'God' : 'Duo';
      }
    }
    const formulaDetails = window.SWRM.processAdvancedFormulasDetailed?.(rune, stage, settings) || {};
    const strictFormulaResults = {};
    Object.keys(formulaDetails).forEach((name) => {
      strictFormulaResults[name] = !!formulaDetails[name]?.strictMatched;
    });
    const matchState = computeMatchState(mergedResults, settings);
    const baseVerdict = S.getRuneVerdict(rune, stage, settings, mergedResults);
    rune.role = matchState.bestRole;
    rune.verdict = applyNoMatchSafety(baseVerdict, matchState);
    enrichRuneMeta(rune, stage, settings);
    // If role came only from relaxed retry, prefer actionable improvement verdicts.
    if (rune.policyRelaxedRole && rune.verdict === 'Keep') {
      const grindToGod = S.checkGrindToGod?.(rune, settings);
      if (rune.badFlat) rune.verdict = 'Gem';
      else if (grindToGod?.can || rune.grindInfo?.can) rune.verdict = 'Grind';
    }
    rune.formulaResults = mergedResults;
    rune.fitSummary = window.SWRM.computeRuneFitSummary?.(rune, stage, settings, mergedResults) || { bestRole: '', bestScore: 0, byRole: {} };
    rune.borderlineGuard = evaluateBorderlineGuard(rune, settings, matchState, formulaDetails);
    rune.decisionTrace = buildDecisionTrace(
      rune,
      stage,
      settings,
      mergedResults,
      matchState,
      rune.verdict,
      formulaDetails,
      strictFormulaResults
    );
    const sellReason = S.computeSellReason?.(rune, stage, settings, mergedResults) || { code: '', detail: '' };
    rune.sellReasonCode = sellReason.code || '';
    rune.sellReasonDetail = sellReason.detail || '';

    return rune;
  }

  function processAll(runes, stage, settings) {
    return runes.map(r => processRune(r, stage, settings));
  }

  /** Console / validation: aggregate verdicts and best-role counts for a processed list. */
  function summarizeVerdictsAndRoles(runes) {
    const verdicts = {};
    const roles = {};
    for (let i = 0; i < runes.length; i++) {
      const r = runes[i];
      const v = r.verdict || '—';
      verdicts[v] = (verdicts[v] || 0) + 1;
      const ro = r.role || '—';
      roles[ro] = (roles[ro] || 0) + 1;
    }
    return { verdicts, roles };
  }

  S.getRuneVerdict = getRuneVerdict;
  S.processAll = processAll;
  S.processRune = processRune;
  S.ROLE_PRIORITY = ROLE_PRIORITY_CORE;
  S.pickBestRole = pickBestRole;
  S.buildMergedResults = buildMergedResults;
  S.grindEnablesMatch = grindEnablesMatch;
  S.computeMatchState = computeMatchState;
  S.applyNoMatchSafety = applyNoMatchSafety;
  S.summarizeVerdictsAndRoles = summarizeVerdictsAndRoles;
})();
