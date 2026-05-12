// =============================================
// engine-gem-reapp-verdict.js — flats, grind, gem meta, reapp, base verdict
// Depends on: engine-core.js, engine-legacy-roles.js
// =============================================

(function() {
  const S = window.SWRM;
  const modeKey = S.modeKey;
  const qSub = (s) => (typeof S.isQualifyingSubstatRow === 'function' ? S.isQualifyingSubstatRow(s) : s.source !== 'innate');

  function hasBadFlat(rune, stage) {
    const flatIds = [1, 3, 5];
    const flatThresholds = { 1: 200, 3: 20, 5: 20 };
    const subs = (rune.substats || []).filter(qSub);

    // Spreadsheet parity: if any sub is enchanted, rune is treated as Clean for bad-flat gate.
    if (subs.some((s) => s.enchanted === true)) return false;

    let cleanFlatCount = 0;
    for (const s of subs) {
      if (flatIds.includes(s.type)) {
        const threshold = flatThresholds[s.type];
        // Bad flat row only when it's a low flat and has no gem / no grind.
        if ((s.val || 0) <= threshold && (s.gem || 0) === 0 && (s.grind || 0) === 0) {
          cleanFlatCount++;
        }
      }
    }

    const requiredFlats = stage === 'Late' ? 1 : 2;
    return cleanFlatCount >= requiredFlats;
  }

  /** Target row is always Late×grade (Sheets grind line), never the account preset stage */
  function checkGrind(rune, stage, settings) {
    const key = modeKey('Late', rune.gradeStr);
    const th = (settings.hrThresholds && Object.keys(settings.hrThresholds).length)
      ? settings.hrThresholds
      : settings.thresholds;
    // Spreadsheet parity: grind recommendation checks only these stats.
    const GRIND_GAIN = { SPD: 5, 'HP%': 10, 'DEF%': 10, 'ATK%': 10 };
    const ALLOWED_STATS = new Set(Object.keys(GRIND_GAIN));
    const gap = Number.isFinite(Number(settings?.grind?.gap)) ? Number(settings.grind.gap) : 1;

    for (const s of rune.substats) {
      if (!qSub(s)) continue;
      if (!ALLOWED_STATS.has(s.name)) continue;
      // Must be not grinded and not enchanted.
      if ((s.grind || 0) !== 0) continue;
      if (s.enchanted === true || (s.gem || 0) !== 0) continue;
      const thresholdRaw = th[s.name]?.[key];
      const threshold = Number.isFinite(Number(thresholdRaw)) ? Math.ceil(Number(thresholdRaw)) : null;
      if (!threshold) continue;
      // Base-only current value; simulate grind gain from there.
      const currentVal = (s.val || 0);
      const gain = GRIND_GAIN[s.name] || 0;
      const distance = threshold - currentVal;
      if (currentVal < threshold && currentVal + gain >= threshold && distance <= gain * gap) {
        return { can: true, stat: s.name, from: currentVal, to: currentVal + gain, need: threshold };
      }
    }
    return { can: false };
  }

  function checkSubstatFlatGem(rune, stage, settings) {
    const useHr = settings.hrThresholds && Object.keys(settings.hrThresholds).length;
    const key = modeKey('Late', rune.gradeStr);
    const th = useHr ? settings.hrThresholds : settings.thresholds;
    const GRINDABLE = new Set(['SPD', 'HP%', 'ATK%', 'DEF%', 'ACC', 'RES']);
    const statScores = Object.fromEntries(
      Object.entries(th).map(([stat, vals]) => [stat, vals[key] || 0])
    );

    let bestCandidate = null;
    for (const s of rune.substats) {
      if (!qSub(s)) continue;
      if (GRINDABLE.has(s.name)) continue;
      for (const target of GRINDABLE) {
        const score = statScores[target] || 0;
        if (score < 15) continue;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = { can: true, kind: 'sub-flat', from: s.name, to: target, score };
        }
      }
    }
    return bestCandidate || { can: false };
  }

  function slotArray(slotMap, slot) {
    if (!slotMap || typeof slotMap !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(slotMap, slot)) return slotMap[slot];
    const sk = String(slot);
    if (Object.prototype.hasOwnProperty.call(slotMap, sk)) return slotMap[sk];
    return null;
  }

  function getBadInnateList(rune, gm) {
    const setRules = gm.bySet && gm.bySet[rune.setName];
    let explicit = setRules !== undefined && setRules !== null ? slotArray(setRules, rune.slot) : null;

    if (explicit !== null && explicit !== undefined) {
      if (!Array.isArray(explicit)) return [];
      return explicit.filter(Boolean).map(function(s) { return String(s).trim(); }).filter(Boolean);
    }

    const extras = gm.extraBadBySlot && (slotArray(gm.extraBadBySlot, rune.slot) || []);
    const arrEx = Array.isArray(extras) ? extras.map(function(x) { return String(x).trim(); }).filter(Boolean) : [];
    const flats = gm.useUniversalFlatBadInnate !== false
      ? (gm.universalFlatInnates || []).map(function(x) { return String(x).trim(); }).filter(Boolean)
      : [];
    return [...new Set([...arrEx, ...flats])];
  }

  function checkMetaInnateGem(rune, settings) {
    const gm = settings.gemMeta;
    const none = { can: false };
    if (!gm || gm.enabled === false) return none;

    const setsList = gm.sets || [];
    if (!setsList.length || setsList.indexOf(rune.setName) === -1) return none;

    if (gm.legendOnlyInnate === true) {
      if (rune.gradeStr !== 'Legend') return none;
    }

    const innateName = rune.innate_name;
    if (!innateName) return none;

    const badList = getBadInnateList(rune, gm);
    if (badList.indexOf(innateName) === -1) return none;

    return {
      can: true,
      kind: 'innate-meta',
      innate: innateName,
      setName: rune.setName,
      slot: rune.slot,
    };
  }

  function evaluateGemRecommendation(rune, stage, settings) {
    const metaHit = checkMetaInnateGem(rune, settings);
    if (metaHit.can) return metaHit;

    const gm = settings.gemMeta;
    if (gm && gm.legacyFlatSubGem && hasBadFlat(rune, stage)) {
      const leg = checkSubstatFlatGem(rune, stage, settings);
      if (leg.can) return leg;
    }
    return { can: false };
  }

  function passesGemQualityGate(rune, stage, isHero, hasHighDuo, settings) {
    const gm = settings?.gemMeta || {};
    const q = gm.qualityGate || {};
    const early = q.early || { min: 40, heroMin: 52 };
    const mid = q.mid || { min: 55, heroMin: 67 };
    const late = q.late || { min: 70, heroMin: 82 };
    const cfg = stage === 'Late' ? late : (stage === 'Mid' ? mid : early);
    const minEff = cfg.min != null ? cfg.min : 55;
    if (rune.eff < minEff) return false;
    if (isHero && !hasHighDuo) {
      const heroMin = cfg.heroMin != null ? cfg.heroMin : 67;
      if (rune.eff < heroMin) return false;
    }
    return true;
  }

  function matchReappRule(rune, settings) {
    if (rune.gradeStr !== 'Legend') return false;

    const rc = settings.reapp || {};
    if (rune.eff > (rc.maxEff ?? 65)) return false;

    if (rc.sets?.length && !rc.sets.includes(rune.setName)) return false;

    if (rune.innate_name && ['ATK', 'DEF', 'HP'].includes(rune.innate_name)) return false;

    if ([2, 4, 6].includes(rune.slot)) {
      const allowed = rc.mainBySlot?.[rune.slot] || [];
      if (allowed.length && !allowed.includes(rune.mainName)) return false;
    }

    return true;
  }

  const PRIMARY_BUILD_ROLES = ['Classic DPS', 'Slow DPS', 'Bomber', 'Bruiser', 'Fast CC', 'Tank'];

  function isPrimaryBuildRole(name) {
    return !!name && PRIMARY_BUILD_ROLES.indexOf(name) !== -1;
  }

  /**
   * God-line safety net: Sell forbidden when High Roll matched.
   * Prefer Grind when one stone reaches Late HR line; else Keep (never Sell).
   * Role key is `High Roll` (alias `God Roll` optional).
   */
  function finalizeGodSellOverride(verdict, mergedResults, rune, stage, settings) {
    if (verdict !== 'Sell') return verdict;
    if (!mergedResults || (!mergedResults['High Roll'] && !mergedResults['God Roll'])) return verdict;
    if (rune && settings) {
      const grind = checkGrind(rune, stage, settings);
      if (grind && grind.can) return 'Grind';
    }
    return 'Keep';
  }

  function getVerdict(rune, stage, settings, roleResult, mergedResults) {
    const hasRole = roleResult !== '';
    const isHero = rune.gradeStr === 'Hero';
    const isLegend = rune.gradeStr === 'Legend';
    const hasHighDuo = roleResult === 'High Roll' || roleResult === 'Duo Roll';

    if (rune.level < 9) {
      return 'Upgrade';
    }

    if (rune.level < 12 && hasRole) {
      if (isHero && !hasHighDuo) {
        const effThreshold = stage === 'Late' ? 85 : (stage === 'Mid' ? 85 : 65);
        if (rune.eff < effThreshold) return finalizeGodSellOverride('Sell', mergedResults, rune, stage, settings);
      }
      return 'Finish';
    }

    if (hasRole && isLegend && matchReappRule(rune, settings)) {
      if (!isPrimaryBuildRole(roleResult)) {
        return 'Reapp';
      }
    }

    if (hasRole) {
      const gem = evaluateGemRecommendation(rune, stage, settings);
      if (gem.can) {
        if (passesGemQualityGate(rune, stage, isHero, hasHighDuo, settings)) {
          return 'Gem';
        }
        // If a rune has a role (including Duo/God), do not Sell because of gem gating.
        // Just skip Gem recommendation and continue to Grind/Keep.
      }
    }

    if (!hasRole) {
      const effThreshold = stage === 'Late' ? 65 : (stage === 'Mid' ? 50 : 35);
      if (isHero && !hasHighDuo) {
        const heroEffThreshold = stage === 'Late' ? 80 : (stage === 'Mid' ? 65 : 50);
        if (rune.eff < heroEffThreshold) return finalizeGodSellOverride('Sell', mergedResults, rune, stage, settings);
      } else if (rune.eff < effThreshold) {
        return finalizeGodSellOverride('Sell', mergedResults, rune, stage, settings);
      } else {
        return finalizeGodSellOverride('Sell', mergedResults, rune, stage, settings);
      }
    }

    const grind = checkGrind(rune, stage, settings);
    if (grind.can) {
      return 'Grind';
    }

    return 'Keep';
  }

  S.hasBadFlat = hasBadFlat;
  S.checkGrind = checkGrind;
  S.checkSubstatFlatGem = checkSubstatFlatGem;
  S.checkGem = checkSubstatFlatGem;
  S.checkMetaInnateGem = checkMetaInnateGem;
  S.evaluateGemRecommendation = evaluateGemRecommendation;
  S.passesGemQualityGate = passesGemQualityGate;
  S.matchReappRule = matchReappRule;
  S.isPrimaryBuildRole = isPrimaryBuildRole;
  S.finalizeGodSellOverride = finalizeGodSellOverride;
  S.getBaseVerdict = getVerdict;
})();
