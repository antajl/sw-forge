// =============================================
// engine-gem-reapp-verdict.js — flats, grind, gem meta, reapp, base verdict
// Depends on: engine-core.js, engine-legacy-roles.js
// =============================================

(function() {
  const S = window.SWRM;
  const modeKey = S.modeKey;
  const qSub = (s) => (typeof S.isQualifyingSubstatRow === 'function' ? S.isQualifyingSubstatRow(s) : s.source !== 'innate');

  function effGatesBypassed() {
    return S.DEBUG_BYPASS_EFFICIENCY_GATES === true;
  }

  function isLegendGrade(gradeStr) {
    return gradeStr === 'Legend';
  }

  function isHeroLikeGrade(gradeStr) {
    return gradeStr === 'Hero' || gradeStr === 'Rare';
  }

  const FLAT_SUB_TYPE_IDS = [1, 3, 5];
  const FLAT_SUB_THRESHOLDS = { 1: 200, 3: 20, 5: 20 };

  /** Row order: low flat HP/DEF/ATK with no grind/gem; empty if any enchanted sub (spreadsheet “clean” gate). */
  function listBadFlatSubNames(rune) {
    const subs = (rune.substats || []).filter(qSub);
    if (subs.some((s) => s.enchanted === true)) return [];

    const names = [];
    for (const s of subs) {
      if (!FLAT_SUB_TYPE_IDS.includes(s.type)) continue;
      const threshold = FLAT_SUB_THRESHOLDS[s.type];
      if ((s.val || 0) <= threshold && (s.gem || 0) === 0 && (s.grind || 0) === 0) {
        if (s.name) names.push(s.name);
      }
    }
    return names;
  }

  function hasBadFlat(rune, stage) {
    const cleanFlatCount = listBadFlatSubNames(rune).length;
    const requiredFlats = stage === 'Late' ? 1 : 2;
    return cleanFlatCount >= requiredFlats;
  }

  function getGrindGainByGrade(statName, gradeStr) {
    if (isLegendGrade(gradeStr)) {
      return statName === 'SPD' ? 5 : 10;
    }
    if (gradeStr === 'Hero') {
      return statName === 'SPD' ? 4 : 8;
    }
    if (gradeStr === 'Rare') {
      return statName === 'SPD' ? 3 : 6;
    }
    return 0;
  }

  /** Target row is always Late×grade (Sheets grind line), never the account preset stage */
  function checkGrind(rune, stage, settings) {
    const key = modeKey('Late', rune.gradeStr);
    const th = (settings.hrThresholds && Object.keys(settings.hrThresholds).length)
      ? settings.hrThresholds
      : settings.thresholds;
    // Spreadsheet parity: grind recommendation checks only these stats (gain by grade: Legend SPD 5 / % 10, Hero 4/8, Rare 3/6).
    const ALLOWED_STATS = new Set(['SPD', 'HP%', 'DEF%', 'ATK%']);
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
      const gain = getGrindGainByGrade(s.name, rune.gradeStr);
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

  /** Enchant Gem targets substats only (innate prefix is not gemmable in-game). */
  function evaluateGemRecommendation(rune, stage, settings) {
    const gm = settings.gemMeta;
    if (!gm || !gm.legacyFlatSubGem) return { can: false };
    if (!hasBadFlat(rune, stage)) return { can: false };
    const leg = checkSubstatFlatGem(rune, stage, settings);
    if (!leg.can) return { can: false };
    return {
      can: true,
      kind: leg.kind,
      score: leg.score,
      /** UI Target: flat substats triggering the gate (omit suggested grindable target on purpose). */
      badFlatSubs: listBadFlatSubNames(rune),
    };
  }

  function passesGemQualityGate(rune, stage, isHero, hasHighDuo, settings) {
    if (effGatesBypassed()) return true;
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
    if (!effGatesBypassed() && rune.eff > (rc.maxEff ?? 65)) return false;

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
    const isHero = isHeroLikeGrade(rune.gradeStr);
    const isLegend = isLegendGrade(rune.gradeStr);
    const hasHighDuo = roleResult === 'High Roll' || roleResult === 'Duo Roll';

    if (rune.level < 9) {
      return 'Upgrade';
    }

    if (rune.level < 12 && hasRole) {
      if (!effGatesBypassed() && isHero && !hasHighDuo) {
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
      if (!effGatesBypassed()) {
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
    }

    const grind = checkGrind(rune, stage, settings);
    if (grind.can) {
      return 'Grind';
    }

    return 'Keep';
  }

  S.hasBadFlat = hasBadFlat;
  S.listBadFlatSubNames = listBadFlatSubNames;
  S.checkGrind = checkGrind;
  S.checkSubstatFlatGem = checkSubstatFlatGem;
  S.checkGem = checkSubstatFlatGem;
  S.evaluateGemRecommendation = evaluateGemRecommendation;
  S.passesGemQualityGate = passesGemQualityGate;
  S.matchReappRule = matchReappRule;
  S.isPrimaryBuildRole = isPrimaryBuildRole;
  S.finalizeGodSellOverride = finalizeGodSellOverride;
  S.getBaseVerdict = getVerdict;

  /**
   * No-role rescue path: can one ungrinded, unenchanted line reach God with one grind?
   */
  function checkGrindToGod(rune, settings) {
    const gap = Number.isFinite(Number(settings?.grind?.gap)) ? Number(settings.grind.gap) : 0.5;
    const ALLOWED_STATS = new Set(['SPD', 'HP%', 'ATK%', 'DEF%']);
    for (const s of (rune.substats || [])) {
      if (!qSub(s)) continue;
      if (!ALLOWED_STATS.has(s.name)) continue;
      if ((s.grind || 0) !== 0) continue;
      if (s.enchanted === true || (s.gem || 0) !== 0) continue;
      const gain = getGrindGainByGrade(s.name, rune.gradeStr);
      if (!gain) continue;
      const god = S.getGodThreshold?.(s.name, settings, rune.gradeStr);
      if (!Number.isFinite(Number(god)) || god <= 0) continue;
      const current = Number(s.val || 0);
      const distance = god - current;
      if (current < god && current + gain >= god && distance <= gain * gap) {
        return { can: true, stat: s.name, from: current, to: current + gain, need: god, gain };
      }
    }
    return { can: false };
  }

  S.checkGrindToGod = checkGrindToGod;
  S.getGrindGainByGrade = getGrindGainByGrade;
})();
