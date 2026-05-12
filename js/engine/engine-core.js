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

  /** { statName: rolled value } from qualifying substats only */
  function statMap(rune) {
    const m = {};
    for (const s of rune.substats) {
      if (!isQualifyingSubstatRow(s)) continue;
      m[s.name] = (m[s.name] || 0) + s.val + s.grind;
    }
    return m;
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
      const val = (s.val || 0) + (s.grind || 0);
      if (val >= threshold) count++;
    }
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    if (count >= 1) return 1;
    return 0;
  }

  S.modeKey = modeKey;
  S.isQualifyingSubstatRow = isQualifyingSubstatRow;
  S.statMap = statMap;
  S.runePowerLevel0to3 = runePowerLevel0to3;
})();
