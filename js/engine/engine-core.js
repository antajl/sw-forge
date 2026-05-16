// =============================================
// engine-core.js — shared helpers (stage keys, stat map, power level)
// Loaded before other engine/*.js modules
// =============================================

(function() {
  const S = window.SWRM = window.SWRM || {};

  /**
   * Threshold key for stage + grade, e.g. "Mid" + "Legend" → "Mid_Leg"
   */
  function modeKey(stage, grade) {
    const g = grade === 'Legend' ? 'Leg' : 'Hero';
    return `${stage}_${g}`;
  }

  /** Rows that count toward role/formula substats (excludes tagged innate duplicates in sec_eff). */
  function isQualifyingSubstatRow(s) {
    return !!s && s.source !== 'innate';
  }

  /** Roll + grind on one sub line (matches in-game / Analysis columns). */
  function subRuneValue(s) {
    if (!s) return 0;
    const base = Number(s.val);
    const grind = Number(s.grind);
    return (Number.isFinite(base) ? base : 0) + (Number.isFinite(grind) ? grind : 0);
  }

  /** { statName: rolled value } from qualifying substats only */
  function statMap(rune) {
    const m = {};
    for (const s of rune.substats) {
      if (!isQualifyingSubstatRow(s)) continue;
      m[s.name] = (m[s.name] || 0) + subRuneValue(s);
    }
    return m;
  }

  /** Any qualifying sub line (not innate) at/above HR for stage × grade. */
  function runeHasHrAnchor(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const th = settings?.hrThresholds || {};
    for (const s of rune.substats || []) {
      if (!isQualifyingSubstatRow(s)) continue;
      if (!s.name) continue;
      const threshold = th[s.name]?.[key];
      if (threshold == null || !(threshold > 0)) continue;
      if (subRuneValue(s) >= threshold) return true;
    }
    return false;
  }

  /**
   * Sheets-style power 0–3: count subs at/above hrThresholds for stage/grade, capped at 3.
   */
  function runePowerLevel0to3(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const th = settings.hrThresholds || {};
    let count = 0;
    for (const s of rune.substats || []) {
      if (!isQualifyingSubstatRow(s)) continue;
      const tvals = th[s.name];
      if (!tvals) continue;
      const threshold = tvals[key];
      if (threshold == null) continue;
      if (subRuneValue(s) >= threshold) count++;
    }
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  S.modeKey = modeKey;
  S.isQualifyingSubstatRow = isQualifyingSubstatRow;
  S.subRuneValue = subRuneValue;
  S.statMap = statMap;
  S.runeHasHrAnchor = runeHasHrAnchor;
  S.runePowerLevel0to3 = runePowerLevel0to3;
})();
