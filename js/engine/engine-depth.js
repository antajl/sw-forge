/**
 * js/engine/engine-depth.js — Account progression (Depth v2) scoring engine.
 * Pure calculations: runs in browser main thread, Web Worker, or Node.js.
 */
(function () {
  const globalObj = typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis);
  const S = (globalObj.SWRM = globalObj.SWRM || {});

  const CFG_DEFAULT = {
    spdSubMin: 18,
    spdEffMin: 60,
    spdDepthCap: 250,
    spdDepthWeight: 30,
    plus15DepthCap: 600,
    plus15DepthWeight: 15,
    eliteTopN: 50,
    eliteEffBaseline: 80,
    eliteEffSpan: 25,
    eliteWeight: 35,
    rosterDepthCap: 50,
    rosterEffMin: 60,
    rosterDepthWeight: 20,
    stageMidMin: 45,
    stageLateMin: 85,
  };

  function subLineTotal(s) {
    if (!s) return 0;
    return (Number(s.val) || 0) + (Number(s.grind) || 0);
  }

  function runeSpdSubTotal(r) {
    let s = 0;
    for (const sub of r.substats || []) {
      if (sub && sub.name === 'SPD') s += subLineTotal(sub);
    }
    return s;
  }

  /**
   * Analyze roster depth — count built monsters (6★ level 40 with 6 runes +15 and avg efficiency ≥ 60%).
   * @param {Array} units - Parsed units from SWEX unit_list
   * @param {Object} [opts] - Options with CFG values
   * @returns {Object} Roster depth metrics
   */
  function analyzeRosterDepth(units, opts = {}) {
    const CFG = opts.CFG || CFG_DEFAULT;
    const list = Array.isArray(units) ? units : [];
    let builtCount = 0;

    for (const u of list) {
      if (!u) continue;
      const stars = typeof u.stars === 'number' ? u.stars : parseInt(String(u.stars || ''), 10);
      const level = u.level || 0;
      const runeSlots = u.runeSlots || [];

      if (stars !== 6 || level !== 40 || runeSlots.length !== 6) continue;

      const runes = runeSlots.map((slot) => slot && slot.rune).filter((r) => r != null);
      if (runes.length !== 6) continue;

      const allPlus15 = runes.every((r) => {
        if (!r) return false;
        return (r.level | 0) === 15;
      });
      if (!allPlus15) continue;

      let totalEff = 0;
      let validRuneCount = 0;
      for (const r of runes) {
        if (!r) continue;
        const eff = r.eff || 0;
        if (Number.isFinite(eff)) {
          totalEff += eff;
          validRuneCount++;
        }
      }
      if (validRuneCount === 0) continue;

      const avgEff = totalEff / validRuneCount;
      if (avgEff >= CFG.rosterEffMin) {
        builtCount++;
      }
    }

    const rosterNorm = Math.min(builtCount / CFG.rosterDepthCap, 1);
    const rosterPoints = rosterNorm * CFG.rosterDepthWeight;

    return {
      rosterDepthCount: builtCount,
      rosterPoints: (Math.round(rosterPoints * 10) / 10).toFixed(1),
      rosterCap: CFG.rosterDepthWeight,
    };
  }

  /**
   * Absolute depth metrics over the full exported rune list (Rare+ as in SWEX parse, rank ≥3).
   * @param {Array} runes - Parsed rune list
   * @param {Array} [units] - Optional parsed unit list for roster depth
   * @param {Object} [opts] - Tuning options
   * @returns {Object} Stage progression metrics
   */
  function analyzeGameStage(runes, units, opts = {}) {
    const CFG = { ...CFG_DEFAULT, ...(opts.CFG || {}) };
    const calcScore = S.calcIngameScore;

    const list = Array.isArray(runes) ? runes : [];
    if (list.length === 0) {
      return {
        spdDepthCount: 0,
        plus15DepthCount: 0,
        eliteAvgEff: '0.0',
        eliteSampleSize: 0,
        rosterDepthCount: 0,
        score: '0.0',
        runeCount: 0,
        stageMidMin: CFG.stageMidMin,
        stageLateMin: CFG.stageLateMin,
        spdPoints: '0.0',
        plus15Points: '0.0',
        elitePoints: '0.0',
        rosterPoints: '0.0',
        spdCap: CFG.spdDepthWeight,
        plus15Cap: CFG.plus15DepthWeight,
        eliteCap: CFG.eliteWeight,
        rosterCap: CFG.rosterDepthWeight,
      };
    }

    let spdDepthCount = 0;
    let plus15DepthCount = 0;
    for (const r of list) {
      if (!r) continue;
      const spdTotal = runeSpdSubTotal(r);
      const eff = r.eff || 0;
      if (spdTotal >= CFG.spdSubMin && eff >= CFG.spdEffMin) spdDepthCount++;
      const stars = r.stars;
      const starsNum = typeof stars === 'number' ? stars : parseInt(String(stars), 10);
      if (starsNum === 6 && (r.level | 0) === 15) plus15DepthCount++;
    }

    const ingameScores = [];
    for (const r of list) {
      if (!r) continue;
      ingameScores.push(calcScore ? calcScore(r) : r.ingameScore || 0);
    }
    ingameScores.sort((a, b) => b - a);
    const eliteK = Math.min(CFG.eliteTopN, ingameScores.length);
    let eliteAvgUncapped = 0;
    if (eliteK > 0) {
      let sumE = 0;
      for (let i = 0; i < eliteK; i++) sumE += ingameScores[i];
      eliteAvgUncapped = sumE / eliteK;
    }

    const spdNorm = Math.min(spdDepthCount / CFG.spdDepthCap, 1);
    const plus15Norm = Math.min(plus15DepthCount / CFG.plus15DepthCap, 1);
    const eliteEffExcess = Math.max(0, eliteAvgUncapped - CFG.eliteEffBaseline);
    const eliteNorm = Math.min(eliteEffExcess / CFG.eliteEffSpan, 1);

    const spdPoints = spdNorm * CFG.spdDepthWeight;
    const plus15Points = plus15Norm * CFG.plus15DepthWeight;
    const elitePoints = eliteNorm * CFG.eliteWeight;

    const rosterMetrics = Array.isArray(units) ? analyzeRosterDepth(units, { CFG }) : null;
    const rosterPoints = rosterMetrics ? parseFloat(rosterMetrics.rosterPoints) || 0 : 0;
    const rosterDepthCount = rosterMetrics ? rosterMetrics.rosterDepthCount : 0;

    const scoreVal = spdPoints + plus15Points + elitePoints + rosterPoints;
    const scoreRounded = Math.round(scoreVal * 10) / 10;

    return {
      spdDepthCount,
      plus15DepthCount,
      eliteAvgEff: eliteAvgUncapped.toFixed(1),
      eliteSampleSize: eliteK,
      rosterDepthCount,
      score: scoreRounded.toFixed(1),
      runeCount: list.length,
      stageMidMin: CFG.stageMidMin,
      stageLateMin: CFG.stageLateMin,
      spdPoints: (Math.round(spdPoints * 10) / 10).toFixed(1),
      plus15Points: (Math.round(plus15Points * 10) / 10).toFixed(1),
      elitePoints: (Math.round(elitePoints * 10) / 10).toFixed(1),
      rosterPoints: (Math.round(rosterPoints * 10) / 10).toFixed(1),
      spdCap: CFG.spdDepthWeight,
      plus15Cap: CFG.plus15DepthWeight,
      eliteCap: CFG.eliteWeight,
      rosterCap: CFG.rosterDepthWeight,
    };
  }

  function getRecommendedStage(score, midMin = 45, lateMin = 85) {
    if (score >= lateMin) return 'Late';
    if (score >= midMin) return 'Mid';
    return 'Early';
  }

  S.CFG_DEPTH = CFG_DEFAULT;
  S.analyzeGameStage = analyzeGameStage;
  S.analyzeRosterDepth = analyzeRosterDepth;
  S.getRecommendedStage = getRecommendedStage;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      analyzeGameStage,
      analyzeRosterDepth,
      getRecommendedStage,
      CFG_DEFAULT,
    };
  }
})();
