// =============================================
// advanced-formulas.js — Advanced Formula System
// Mirrors Google Sheets formula logic with comprehensive settings
// =============================================

(function() {
  'use strict';

  function effGatesBypassed() {
    return window.SWRM && window.SWRM.DEBUG_BYPASS_EFFICIENCY_GATES === true;
  }

  // Get the threshold key string for a given stage + grade
  function modeKey(stage, grade) {
    const g = grade === 'Legend' ? 'Leg' : 'Hero';
    return `${stage}_${g}`;
  }

  // Build a stat lookup for a rune { statName: value } — shared engine map (subs only; innate excluded)
  function statMap(rune) {
    if (typeof window.SWRM.statMap === 'function') {
      return window.SWRM.statMap(rune);
    }
    const m = {};
    for (const s of rune.substats) {
      if (typeof window.SWRM.isQualifyingSubstatRow === 'function') {
        if (!window.SWRM.isQualifyingSubstatRow(s)) continue;
      } else if (s.source === 'innate') continue;
      const lineVal =
        typeof window.SWRM.subRuneValue === 'function'
          ? window.SWRM.subRuneValue(s)
          : (s.val || 0);
      m[s.name] = (m[s.name] || 0) + lineVal;
    }
    return m;
  }

  // Check if formula is enabled
  function isFormulaEnabled(formulaName, settings) {
    return settings.formulas?.[formulaName]?.enabled !== false;
  }

  function isHeroLikeGrade(gradeStr) {
    return gradeStr === 'Hero' || gradeStr === 'Rare';
  }

  function getEvalPolicy(settings) {
    const d = window.SWRM.DEFAULT_EVAL_POLICY || {
      anchorMode: 'hard',
      slotRequirementMode: 'hard',
      minStatsModifier: 0,
      godCountsAsRole: true,
      duoCountsAsRole: true,
    };
    const p = settings?.policy || {};
    const rawMod = Number(p.minStatsModifier);
    const minStatsModifier = rawMod === -1 ? -1 : (rawMod === 1 ? 1 : 0);
    return {
      anchorMode: p.anchorMode === 'soft' ? 'soft' : 'hard',
      slotRequirementMode: p.slotRequirementMode === 'soft' ? 'soft' : 'hard',
      minStatsModifier,
      minRolePressure: Number.isFinite(Number(p.minRolePressure)) ? Math.max(0, Math.min(1, Number(p.minRolePressure))) : 0.58,
      rolePressureByRole: p.rolePressureByRole && typeof p.rolePressureByRole === 'object' ? p.rolePressureByRole : {},
      minUsefulSubsByRole: p.minUsefulSubsByRole && typeof p.minUsefulSubsByRole === 'object' ? p.minUsefulSubsByRole : {},
      godCountsAsRole: p.godCountsAsRole !== false,
      duoCountsAsRole: p.duoCountsAsRole !== false,
      preset: p.preset || d.preset || 'Custom',
    };
  }

  function computeRolePressure(includedStats, sm, settings, stage, gradeStr) {
    const key = modeKey(stage, gradeStr);
    const th = settings?.hrThresholds || {};
    let sum = 0;
    let count = 0;
    for (let i = 0; i < includedStats.length; i++) {
      const stat = includedStats[i];
      const have = Number(sm[stat] || 0);
      const need = Number(th[stat]?.[key] || 0);
      if (need <= 0) continue;
      const ratio = Math.max(0, Math.min(1.2, have / need));
      sum += ratio;
      count++;
    }
    if (!count) return 0;
    return sum / count;
  }

  function getFitModel(settings) {
    const d = window.SWRM.DEFAULT_FIT_MODEL || {
      enabled: true, scoreScale: 100, hrWeight: 70, synergyWeight: 20, innateWeight: 10,
      roleSynergyPairs: {},
    };
    if (typeof window.SWRM.mergeFitModel === 'function') {
      return window.SWRM.mergeFitModel(settings?.fitModel || d);
    }
    return settings?.fitModel || d;
  }

  function splitAcceptedMains(v) {
    if (Array.isArray(v)) {
      return v
        .map((x) => String(x || '').trim())
        .filter((x) => x && x !== 'None');
    }
    if (typeof v === 'string') {
      return v
        .split(',')
        .map((x) => x.trim())
        .filter((x) => x && x !== 'None');
    }
    return [];
  }

  // Check accepted main stats for slots
  function checkAcceptedMains(rune, formula) {
    if ([2, 4, 6].includes(rune.slot)) {
      const accepted = formula.acceptedMains?.[rune.slot];
      if (typeof accepted === 'string') {
        const raw = accepted.trim();
        if (raw && raw !== 'None') {
          return raw.includes(rune.mainName);
        }
        return true;
      }
      const validMains = splitAcceptedMains(accepted);
      if (validMains.length > 0 && !validMains.includes(rune.mainName)) {
        return false;
      }
    }
    return true;
  }

  // Check substats inclusion/exclusion for stage
  function checkSubstats(rune, formula, stage) {
    const sm = statMap(rune);
    const includedStats = [];
    const excludedStats = [];

    for (const [stat, stageConfig] of Object.entries(formula.substats || {})) {
      const setting = stageConfig[stage];
      if (setting === 'Include') {
        includedStats.push(stat);
      } else if (setting === 'Exclude') {
        excludedStats.push(stat);
      }
    }

    // Check excluded stats - if present, disqualify
    for (const stat of excludedStats) {
      if ((sm[stat] || 0) > 0) {
        return false;
      }
    }

    // Count included stats present
    const presentCount = includedStats.filter(stat => (sm[stat] || 0) > 0).length;
    
    return {
      passed: true,
      presentCount,
      includedStats,
      statMap: sm
    };
  }

  // Check slot requirements
  function checkSlotRequirements(rune, formula, stage, sm) {
    const slotReq = formula.slotRequirements?.[rune.slot]?.[stage];
    if (slotReq && slotReq !== 'None') {
      return (sm[slotReq] || 0) > 0 || rune.mainName === slotReq;
    }
    return true;
  }

  /**
   * Min stats: count how many Include substats (other than must-have) are present on the rune.
   * This is independent from Anchor Requirements; anchors are handled separately in checkAnchorRequirements().
   */
  function readMinRequiredForSlot(rune, formula, stage) {
    return (
      typeof window.SWRM.readFormulaMinStatForRuneSlot === 'function'
        ? window.SWRM.readFormulaMinStatForRuneSlot(formula.minStats, rune.slot, stage)
        : (() => {
          let slotKey;
          if ([1, 3, 5].includes(rune.slot)) slotKey = '1/3/5';
          else slotKey = `Slot ${rune.slot}`;
          return formula.minStats?.[slotKey]?.[stage] || 1;
        })()
    );
  }

  function countIncludedSupportingStats(includedStats, mustHaveStat, sm) {
    let count = 0;
    for (let i = 0; i < includedStats.length; i++) {
      const stat = includedStats[i];
      if (stat === mustHaveStat) continue;
      const val = sm[stat] || 0;
      if (val <= 0) continue;
      count++;
    }
    return count;
  }

  function checkMinStats(rune, formula, stage, includedStats, mustHaveStat, settings, sm) {
    const minRequired = readMinRequiredForSlot(rune, formula, stage);
    const count = countIncludedSupportingStats(includedStats, mustHaveStat, sm);
    return count >= minRequired;
  }

  // Check must-have requirement (subs only in sm; main stat satisfies — innate does not)
  function checkMustHave(rune, formula, stage, sm) {
    const mustHave = formula.mustHave?.[stage];
    if (mustHave && mustHave !== 'None') {
      return (sm[mustHave] || 0) > 0 || rune.mainName === mustHave;
    }
    return true;
  }

  // Require High Roll on at least one formula **Include** sub for this stage (not any random HR line).
  function checkAnchorRequirements(rune, formula, stage, settings) {
    const isHero = isHeroLikeGrade(rune.gradeStr);
    const isLegend = rune.gradeStr === 'Legend';

    for (const [anchorType, stageConfig] of Object.entries(formula.requireHR || {})) {
      const required = stageConfig[stage];
      if (!required) continue;

      const isHeroAnchor = anchorType.includes('Hero');
      const isLegendAnchor = anchorType.includes('Legend');

      if ((isHero && isHeroAnchor) || (isLegend && isLegendAnchor)) {
        const hasAnchor =
          typeof window.SWRM.runeHasHrAnchorForFormula === 'function'
            ? window.SWRM.runeHasHrAnchorForFormula(rune, formula, stage, settings)
            : typeof window.SWRM.runeHasHrAnchor === 'function'
              ? window.SWRM.runeHasHrAnchor(rune, stage, settings)
              : false;
        if (!hasAnchor) return false;
      }
    }

    return true;
  }

  // Main formula checker - mirrors Google Sheets logic
  function evaluateFormula(rune, formulaName, stage, settings) {
    const formula = settings.formulas?.[formulaName];
    if (!formula) {
      return { strictMatched: false, policyMatched: false, failCode: 'NO_FORMULA', softOverrides: [] };
    }
    const policy = getEvalPolicy(settings);

    // Check if formula is enabled
    if (!isFormulaEnabled(formulaName, settings)) {
      return { strictMatched: false, policyMatched: false, failCode: 'DISABLED', softOverrides: [] };
    }

    // Check accepted main stats
    if (!checkAcceptedMains(rune, formula)) {
      return { strictMatched: false, policyMatched: false, failCode: 'ACCEPTED_MAINS', softOverrides: [] };
    }

    // Check substats
    const substatResult = checkSubstats(rune, formula, stage);
    if (!substatResult || substatResult.passed === false) {
      return { strictMatched: false, policyMatched: false, failCode: 'EXCLUDED_STAT', softOverrides: [] };
    }

    // Check must-have requirement
    const mustHaveStat = formula.mustHave?.[stage];
    if (!checkMustHave(rune, formula, stage, substatResult.statMap)) {
      return { strictMatched: false, policyMatched: false, failCode: 'MUST_HAVE', softOverrides: [] };
    }

    if (formulaName === 'Slow DPS') {
      const key = modeKey(stage, rune.gradeStr);
      const minRatio = Number(policy.slowDpsCoreMinRatio || 0.72);
      const core = ['ATK%', 'CRate', 'CDmg'];
      for (let i = 0; i < core.length; i++) {
        const st = core[i];
        const have = Number(substatResult.statMap?.[st] || 0);
        const need = Number(settings?.hrThresholds?.[st]?.[key] || 0);
        if (need <= 0) continue;
        if ((have / need) < minRatio) {
          return {
            strictMatched: false,
            policyMatched: false,
            failCode: 'SLOW_DPS_CORE',
            softOverrides: [],
          };
        }
      }
    }

    const slotStrict = checkSlotRequirements(rune, formula, stage, substatResult.statMap);

    const usefulCount = substatResult.includedStats.filter((st) => (substatResult.statMap[st] || 0) > 0).length;
    const minUsefulRequired = Number(policy.minUsefulSubsByRole?.[formulaName] || 0);
    if (usefulCount < minUsefulRequired) {
      return {
        strictMatched: false,
        policyMatched: false,
        failCode: 'MIN_USEFUL_SUBS',
        softOverrides: [],
        supportCount: usefulCount,
        minStrictRequired: minUsefulRequired,
        minPolicyRequired: minUsefulRequired,
      };
    }

    const minStrictRequired = readMinRequiredForSlot(rune, formula, stage);
    const supportCount = countIncludedSupportingStats(substatResult.includedStats, mustHaveStat, substatResult.statMap);
    const minStrict = supportCount >= minStrictRequired;

    const anchorStrict = checkAnchorRequirements(rune, formula, stage, settings);
    const pressure = computeRolePressure(substatResult.includedStats, substatResult.statMap, settings, stage, rune.gradeStr);
    const roleFloorRaw = policy.rolePressureByRole?.[formulaName];
    const roleFloor = Number.isFinite(Number(roleFloorRaw)) ? Number(roleFloorRaw) : Number(policy.minRolePressure || 0);
    const pressureStrict = roleFloor <= 0 ? true : pressure >= roleFloor;
    const strictMatched = slotStrict && minStrict && anchorStrict && pressureStrict;
    if (strictMatched) {
      return {
        strictMatched: true,
        policyMatched: true,
        failCode: '',
        softOverrides: [],
        supportCount,
        minStrictRequired,
        minPolicyRequired: minStrictRequired,
      };
    }

    if (!pressureStrict) {
      return {
        strictMatched: false,
        policyMatched: false,
        failCode: 'ROLE_PRESSURE',
        softOverrides: [],
        supportCount,
        minStrictRequired,
        minPolicyRequired: minStrictRequired,
        pressure,
        pressureFloor: roleFloor,
      };
    }

    const softOverrides = [];
    let slotPolicy = slotStrict;
    if (!slotPolicy && policy.slotRequirementMode === 'soft') {
      slotPolicy = true;
      softOverrides.push('slotRequirement');
    }
    const minPolicyRequired = Math.max(0, minStrictRequired + policy.minStatsModifier);
    const minPolicy = supportCount >= minPolicyRequired;
    if (!minStrict && minPolicy) softOverrides.push('minStats');
    let anchorPolicy = anchorStrict;
    if (!anchorPolicy && policy.anchorMode === 'soft') {
      anchorPolicy = true;
      softOverrides.push('anchor');
    }
    const policyMatched = slotPolicy && minPolicy && anchorPolicy;
    const failCode = !slotPolicy
      ? 'SLOT_REQUIREMENT'
      : !minPolicy
        ? 'MIN_STATS'
        : !anchorPolicy
          ? 'ANCHOR_HR'
          : '';

    return {
      strictMatched: false,
      policyMatched,
      failCode,
      softOverrides,
      supportCount,
      minStrictRequired,
      minPolicyRequired,
    };
  }

  function checkFormula(rune, formulaName, stage, settings) {
    const ev = evaluateFormula(rune, formulaName, stage, settings);
    return !!ev.policyMatched;
  }

  // Process all formulas for a rune
  function processAdvancedFormulas(rune, stage, settings) {
    const results = {};
    const formulaNames = Object.keys(settings.formulas || {});
    
    // Check each formula
    for (const formulaName of formulaNames) {
      results[formulaName] = checkFormula(rune, formulaName, stage, settings);
    }

    return results;
  }

  function processAdvancedFormulasDetailed(rune, stage, settings) {
    const details = {};
    const formulaNames = Object.keys(settings.formulas || {});
    for (let i = 0; i < formulaNames.length; i++) {
      const name = formulaNames[i];
      details[name] = evaluateFormula(rune, name, stage, settings);
    }
    return details;
  }

  function cappedRatio(have, need) {
    const n = Number(need);
    const v = Number(have);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (!Number.isFinite(v) || v <= 0) return 0;
    return Math.max(0, Math.min(1.25, v / n));
  }

  function computeRoleFitScore(rune, roleName, stage, settings) {
    const formula = settings?.formulas?.[roleName];
    if (!formula) return { roleName, score: 0, contributions: [] };
    const fit = getFitModel(settings);
    if (!fit.enabled) return { roleName, score: 0, contributions: [] };
    const sm = statMap(rune);
    const hrKey = modeKey(stage, rune.gradeStr);
    const th = settings?.hrThresholds || {};
    let hrSum = 0;
    let hrCount = 0;
    const contributions = [];
    Object.keys(formula.substats || {}).forEach((st) => {
      if (formula.substats?.[st]?.[stage] !== 'Include') return;
      const have = sm[st] || 0;
      const need = th[st]?.[hrKey] || 0;
      const r = cappedRatio(have, need);
      hrSum += r;
      hrCount += 1;
      contributions.push({ type: 'stat', key: st, ratio: r, have, need });
    });
    const hrScore = hrCount ? (hrSum / hrCount) : 0;

    const pairs = fit.roleSynergyPairs?.[roleName] || [];
    let synSum = 0;
    let synCount = 0;
    for (let i = 0; i < pairs.length; i++) {
      const [a, b] = pairs[i] || [];
      if (!a || !b) continue;
      const ra = cappedRatio(sm[a] || 0, th[a]?.[hrKey] || 0);
      const rb = cappedRatio(sm[b] || 0, th[b]?.[hrKey] || 0);
      if (ra <= 0 && rb <= 0) continue;
      const pairScore = (ra + rb) / 2;
      synSum += pairScore;
      synCount += 1;
      contributions.push({ type: 'synergy', key: `${a}+${b}`, ratio: pairScore });
    }
    const synScore = synCount ? (synSum / synCount) : 0;
    const innateName = rune.innate_name || '';
    const innateBonus = fit.innateStats?.includes(innateName) ? 1 : 0;
    if (innateBonus > 0) contributions.push({ type: 'innate', key: innateName, ratio: innateBonus });

    const totalWeight = fit.hrWeight + fit.synergyWeight + fit.innateWeight;
    const weighted =
      (hrScore * fit.hrWeight + synScore * fit.synergyWeight + innateBonus * fit.innateWeight) / (totalWeight || 1);
    const score = Math.round(weighted * fit.scoreScale);
    return { roleName, score, hrScore, synScore, innateBonus, contributions };
  }

  function computeRuneFitSummary(rune, stage, settings, mergedResults) {
    const roles = Object.keys(settings?.formulas || {}).filter((name) => !!mergedResults?.[name]);
    const byRole = {};
    let best = { roleName: '', score: 0, contributions: [] };
    for (let i = 0; i < roles.length; i++) {
      const roleName = roles[i];
      const fit = computeRoleFitScore(rune, roleName, stage, settings);
      byRole[roleName] = fit;
      if ((fit.score || 0) > (best.score || 0)) best = fit;
    }
    return { bestRole: best.roleName || '', bestScore: best.score || 0, byRole };
  }

  // Prefer engine.pickBestRole (same order as Best Role column); fallback for standalone tests
  function getBestFormulaMatch(formulaResults, settings) {
    if (typeof window.SWRM.pickBestRole === 'function') {
      return window.SWRM.pickBestRole(formulaResults, settings);
    }
    const enabled = Object.entries(formulaResults || {})
      .filter(([name, matched]) => matched && isFormulaEnabled(name, settings))
      .map(([name]) => name);
    const priority = ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'];
    for (let i = 0; i < priority.length; i++) {
      if (enabled.includes(priority[i])) return priority[i];
    }
    return enabled[0] || '';
  }

  /**
   * Canonical rune verdict tree (single source of truth for UI + exports).
   * Priority: level → role/God/Duo match → Reapp/Gem/Grind rules below.
   * Gem uses hasBadFlat only (any enchanted sub on rune clears bad-flat; no eff gate).
   * Reapp only when no role/God/Duo at +12.
   */
  function getAdvancedVerdict(rune, stage, settings, formulaResults) {
    const mergedResults = formulaResults || {};
    const policy = getEvalPolicy(settings);

    const bestRole = window.SWRM.pickBestRole?.(mergedResults, settings)
      ?? getBestFormulaMatch(mergedResults, settings);
    const isSpecialRoll = bestRole === 'God Roll' || bestRole === 'High Roll' || bestRole === 'Duo Roll';
    const hasRole = bestRole !== '' && !isSpecialRoll;
    const hasGod = policy.godCountsAsRole && !!(mergedResults['God Roll'] || mergedResults['High Roll']);
    const hasDuo = policy.duoCountsAsRole && !!mergedResults['Duo Roll'];
    const hasRoleOrGodOrDuo = hasRole || hasGod || hasDuo;

    if (rune.level < 9) return 'Upgrade';

    if (rune.level < 12) {
      const grindToGod = window.SWRM.checkGrindToGod?.(rune, settings);
      if (hasRoleOrGodOrDuo || grindToGod?.can) return 'Finish';
      return 'Sell';
    }

    if (hasRoleOrGodOrDuo) {
      if (window.SWRM.hasBadFlat?.(rune, stage)) return 'Gem';
      return 'Keep';
    }

    const grindToGod = window.SWRM.checkGrindToGod?.(rune, settings);
    if (grindToGod?.can) return 'Grind';
    const grind = window.SWRM.checkGrind?.(rune, stage, settings);
    if (grind?.can) {
      const enables =
        typeof window.SWRM.grindEnablesMatch === 'function'
          ? window.SWRM.grindEnablesMatch(rune, grind, stage, settings)
          : true;
      if (enables) return 'Grind';
    }

    if (window.SWRM.matchReappRule?.(rune, settings)) return 'Reapp';
    return 'Sell';
  }

  /**
   * Step-by-step formula evaluation for debugging (why pass/fail).
   * No side effects; safe to call on any rune object.
   */
  function diagnoseFormula(rune, formulaName, stage, settings) {
    const formula = settings.formulas?.[formulaName];
    const steps = [];
    const fail = (code, detail) => ({ pass: false, code, detail, steps });

    if (!formula) {
      return fail('NO_FORMULA', `No formulas.${formulaName} in settings`);
    }
    steps.push({ step: 'enabled', pass: isFormulaEnabled(formulaName, settings) });
    if (!isFormulaEnabled(formulaName, settings)) {
      return fail('DISABLED', 'Formula disabled in settings');
    }

    const mainsOk = checkAcceptedMains(rune, formula);
    steps.push({
      step: 'acceptedMains',
      pass: mainsOk,
      slot: rune.slot,
      mainName: rune.mainName,
      accepted: formula.acceptedMains?.[rune.slot],
    });
    if (!mainsOk) return fail('ACCEPTED_MAINS', 'Main stat not in accepted list for slot');

    const substatResult = checkSubstats(rune, formula, stage);
    if (!substatResult || substatResult.passed === false) {
      const smEarly = statMap(rune);
      const fe = Object.entries(formula.substats || {}).find(
        ([stat, sc]) => sc[stage] === 'Exclude' && (smEarly[stat] || 0) > 0
      );
      steps.push({
        step: 'substats',
        pass: false,
        excludedHit: fe ? fe[0] : null,
        includedStats: [],
        presentCount: 0,
      });
      return fail('EXCLUDE', fe ? `Excluded stat present: ${fe[0]}` : 'Substat rules failed');
    }
    const hitExc = Object.entries(formula.substats || {}).find(
      ([stat, sc]) => sc[stage] === 'Exclude' && (substatResult.statMap?.[stat] || 0) > 0
    );
    steps.push({
      step: 'substats',
      pass: true,
      excludedHit: hitExc ? hitExc[0] : null,
      includedStats: substatResult.includedStats,
      presentCount: substatResult.presentCount,
    });

    const mustHaveStat = formula.mustHave?.[stage];
    const mustOk = checkMustHave(rune, formula, stage, substatResult.statMap);
    steps.push({
      step: 'mustHave',
      pass: mustOk,
      mustHave: mustHaveStat || null,
      subValue: mustHaveStat ? substatResult.statMap[mustHaveStat] : null,
      mainSatisfies: mustHaveStat ? rune.mainName === mustHaveStat : null,
    });
    if (!mustOk) return fail('MUST_HAVE', `Missing must-have for ${stage}: ${mustHaveStat}`);

    const slotOk = checkSlotRequirements(rune, formula, stage, substatResult.statMap);
    const slotReq = formula.slotRequirements?.[rune.slot]?.[stage];
    steps.push({
      step: 'slotRequirement',
      pass: slotOk,
      required: slotReq || 'None',
      hasSub: slotReq && slotReq !== 'None' ? (substatResult.statMap[slotReq] || 0) > 0 : null,
      mainMatch: slotReq && slotReq !== 'None' ? rune.mainName === slotReq : null,
    });
    if (!slotOk) return fail('SLOT_REQ', `Need sub or main: ${slotReq}`);

    const minOk = checkMinStats(rune, formula, stage, substatResult.includedStats, mustHaveStat, settings, substatResult.statMap);
    const minRequired =
      typeof window.SWRM.readFormulaMinStatForRuneSlot === 'function'
        ? window.SWRM.readFormulaMinStatForRuneSlot(formula.minStats, rune.slot, stage)
        : (() => {
            const slotKey = [1, 3, 5].includes(rune.slot) ? '1/3/5' : `Slot ${rune.slot}`;
            return formula.minStats?.[slotKey]?.[stage] || 1;
          })();
    let counted = 0;
    const countedStats = [];
    for (let i = 0; i < substatResult.includedStats.length; i++) {
      const stat = substatResult.includedStats[i];
      if (stat === mustHaveStat) continue;
      const v = substatResult.statMap[stat] || 0;
      if (v > 0) {
        counted++;
        countedStats.push(stat);
      }
    }
    steps.push({
      step: 'minStats',
      pass: minOk,
      minRequired,
      counted,
      countedStats,
    });
    if (!minOk) return fail('MIN_STATS', `Need ${minRequired} extra Include subs (excl. must-have); have ${counted}`);

    const anchorOk = checkAnchorRequirements(rune, formula, stage, settings);
    const hrKey = modeKey(stage, rune.gradeStr);
    const th = settings?.hrThresholds || {};
    const includeLines = [];
    for (const s of rune.substats || []) {
      if (typeof window.SWRM.isQualifyingSubstatRow === 'function' && !window.SWRM.isQualifyingSubstatRow(s)) continue;
      if (!s.name) continue;
      const inc = formula.substats?.[s.name]?.[stage];
      if (inc !== 'Include') continue;
      const line = typeof window.SWRM.subRuneValue === 'function' ? window.SWRM.subRuneValue(s) : ((s.val || 0) + (s.grind || 0));
      const need = th[s.name]?.[hrKey];
      includeLines.push({
        stat: s.name,
        value: line,
        hrKey,
        hrNeed: need != null ? need : null,
        meetsHr: need != null && need > 0 ? line >= need : null,
      });
    }
    steps.push({
      step: 'requireHR_anchor',
      pass: anchorOk,
      hrGridKey: hrKey,
      gradeStr: rune.gradeStr,
      includeSubLines: includeLines,
      note: 'Anchor = any Include sub line ≥ HR for this stage×grade (not main, not non-Include subs)',
    });
    if (!anchorOk) return fail('ANCHOR_HR', `No Include sub ≥ HR (${hrKey})`);

    return { pass: true, code: 'OK', detail: '', steps };
  }

  /**
   * Full decision trace: thresholds, God/Duo, formulas, verdict, grind hint.
   */
  function explainRune(rune, stage, settings) {
    const S = window.SWRM;
    const hrKey = modeKey(stage, rune.gradeStr);
    const godLine = {};
    ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'].forEach((k) => {
      const g = S.getGodThreshold?.(k, settings, rune.gradeStr);
      godLine[k] = g != null && Number.isFinite(g) ? Math.round(g * 100) / 100 : null;
    });
    const sm = typeof S.statMap === 'function' ? S.statMap(rune) : statMap(rune);
    const merged = typeof S.buildMergedResults === 'function' ? S.buildMergedResults(rune, stage, settings) : null;
    const verdict = merged ? S.getRuneVerdict?.(rune, stage, settings, merged) : null;
    const bestRole = merged ? S.pickBestRole?.(merged, settings) : '';
    const formulaNames = Object.keys(settings.formulas || {});
    const formulaDiag = {};
    for (let i = 0; i < formulaNames.length; i++) {
      const nm = formulaNames[i];
      formulaDiag[nm] = diagnoseFormula(rune, nm, stage, settings);
    }
    const grind = S.checkGrind?.(rune, stage, settings);
    const grindToGod = S.checkGrindToGod?.(rune, settings);
    let grindWouldHelp = null;
    if (grind?.can && typeof S.grindEnablesMatch === 'function') {
      grindWouldHelp = S.grindEnablesMatch(rune, grind, stage, settings);
    }
    return {
      stage,
      gradeStr: rune.gradeStr,
      level: rune.level,
      hrGridColumn: hrKey,
      statMapSubs: sm,
      hrRowForRune: (() => {
        const th = settings?.hrThresholds || {};
        const row = {};
        ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'].forEach((k) => {
          row[k] = th[k]?.[hrKey] != null ? th[k][hrKey] : null;
        });
        return row;
      })(),
      godLineSubVs: Object.fromEntries(
        ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'].map((k) => [
          k,
          { need: godLine[k], have: sm[k] || 0 },
        ])
      ),
      godRoll: merged ? !!merged['God Roll'] : S.checkHighRoll?.(rune, stage, settings),
      duoRoll: merged ? !!merged['Duo Roll'] : S.checkDuoRoll?.(rune, stage, settings),
      bestRole: bestRole || '',
      verdict,
      grindCandidate: grind,
      grindToGod,
      grindEnablesRoleMatch: grindWouldHelp,
      formulas: formulaDiag,
      constantsNote:
        'HR cells = settings.hrThresholds[stat][Early|Mid|Late]_[Leg|Hero] from statConstants (see defaults.js stageHrValue). God line = getGodThreshold (base×grade × (1+godMod)), not the same as HR.',
    };
  }

  // Export functions
  window.SWRM.checkFormula = checkFormula;
  window.SWRM.evaluateFormula = evaluateFormula;
  window.SWRM.processAdvancedFormulas = processAdvancedFormulas;
  window.SWRM.processAdvancedFormulasDetailed = processAdvancedFormulasDetailed;
  window.SWRM.computeRoleFitScore = computeRoleFitScore;
  window.SWRM.computeRuneFitSummary = computeRuneFitSummary;
  window.SWRM.getBestFormulaMatch = getBestFormulaMatch;
  window.SWRM.getAdvancedVerdict = getAdvancedVerdict;
  window.SWRM.getRuneVerdict = getAdvancedVerdict;
  window.SWRM.diagnoseFormula = diagnoseFormula;
  window.SWRM.explainRune = explainRune;

})();
