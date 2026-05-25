/**
 * Summoners War in-game rune Score (Rating).
 *
 * SWEX JSON (per rune):
 * - prefix_eff: [stat_id, value] — innate; index [1], no grind.
 * - sec_eff[]:  [stat_id, base_value, enchant_type, grind_value] — line total [1] + [3].
 * - pri_eff: ignored (main treated as perfect at +15).
 *
 * Per line: (20 / maxRoll_6★) × value, flat HP/ATK/DEF ÷3 — summed unrounded, then
 * Math.round once on the total (matches in-game, not per-stat rounding).
 */
(function () {
  const S = (window.SWRM = window.SWRM || {});

  const INGAME_MAX_ROLL = {
    1: 375,
    2: 8,
    3: 20,
    4: 8,
    5: 20,
    6: 8,
    8: 6,
    9: 6,
    10: 7,
    11: 8,
    12: 8,
  };

  const INGAME_MULTIPLIER = {
    1: 20 / 375 / 3,
    2: 2.5,
    3: 20 / 20 / 3,
    4: 2.5,
    5: 20 / 20 / 3,
    6: 2.5,
    8: 20 / 6,
    9: 20 / 6,
    10: 20 / 7,
    11: 2.5,
    12: 2.5,
  };

  const FLAT_TYPE_IDS = new Set([1, 3, 5]);

  function ingameSubTotalFromSwex(secEffRow) {
    if (!secEffRow) return 0;
    if (Array.isArray(secEffRow)) {
      const base = Number(secEffRow[1]);
      const grind = Number(secEffRow[3]);
      return (Number.isFinite(base) ? base : 0) + (Number.isFinite(grind) ? grind : 0);
    }
    return ingameLineValue(secEffRow);
  }

  function ingameLineValue(sub) {
    if (!sub) return 0;
    if (Array.isArray(sub)) return ingameSubTotalFromSwex(sub);
    const base = Number(sub.val);
    const grind = Number(sub.grind);
    return (Number.isFinite(base) ? base : 0) + (Number.isFinite(grind) ? grind : 0);
  }

  /** Unrounded points for one stat line. */
  function ingameRawPointsForStat(typeId, currentValue) {
    const tid = Number(typeId);
    const val = Number(currentValue);
    if (!Number.isFinite(tid) || tid <= 0 || !Number.isFinite(val) || val <= 0) return 0;
    const mult = INGAME_MULTIPLIER[tid];
    if (mult) return mult * val;
    const maxRoll = INGAME_MAX_ROLL[tid];
    if (!maxRoll) return 0;
    let pts = (20 / maxRoll) * val;
    if (FLAT_TYPE_IDS.has(tid)) pts /= 3;
    return pts;
  }

  function isInnateDuplicateSub(rune, sub) {
    if (!rune || !sub) return false;
    if (sub.source === 'innate') return true;
    const innType = Number(rune.innate_type);
    if (!Number.isFinite(innType) || innType <= 0) return false;
    const subType = Number(sub.type ?? (Array.isArray(sub) ? sub[0] : 0));
    if (!Number.isFinite(subType) || subType !== innType) return false;
    const innVal = Number(rune.innate_val) || 0;
    const lineVal = ingameLineValue(sub);
    return innVal > 0 && Math.abs(lineVal - innVal) < 0.01;
  }

  function isInnateDuplicateRaw(raw, row) {
    const prefix = raw && raw.prefix_eff;
    if (!Array.isArray(prefix) || !prefix[0]) return false;
    const innType = Number(prefix[0]);
    const innVal = Number(prefix[1]) || 0;
    if (!Number.isFinite(innType) || innType <= 0 || innVal <= 0) return false;
    const subType = Number(Array.isArray(row) ? row[0] : row.type);
    if (!Number.isFinite(subType) || subType !== innType) return false;
    const lineVal = ingameSubTotalFromSwex(row);
    return Math.abs(lineVal - innVal) < 0.01;
  }

  function sumIngameScoreRaw(rune) {
    let total = 0;
    const innType = Number(rune.innate_type);
    const innVal = Number(rune.innate_val);
    if (Number.isFinite(innType) && innType > 0 && Number.isFinite(innVal) && innVal > 0) {
      total += ingameRawPointsForStat(innType, innVal);
    }
    for (const sub of rune.substats || []) {
      if (!sub || isInnateDuplicateSub(rune, sub)) continue;
      const tid = Number(sub.type ?? (Array.isArray(sub) ? sub[0] : 0));
      const val = ingameLineValue(sub);
      if (!Number.isFinite(tid) || tid <= 0 || val <= 0) continue;
      total += ingameRawPointsForStat(tid, val);
    }
    return total;
  }

  function sumIngameScoreRawFromSwex(raw) {
    let total = 0;
    const prefix = raw.prefix_eff;
    if (Array.isArray(prefix) && prefix.length >= 2) {
      const tid = Number(prefix[0]);
      const val = Number(prefix[1]);
      if (tid > 0 && val > 0) total += ingameRawPointsForStat(tid, val);
    }
    for (const row of raw.sec_eff || []) {
      if (!row || isInnateDuplicateRaw(raw, row)) continue;
      const tid = Number(Array.isArray(row) ? row[0] : row.type);
      const val = ingameSubTotalFromSwex(row);
      if (!Number.isFinite(tid) || tid <= 0 || val <= 0) continue;
      total += ingameRawPointsForStat(tid, val);
    }
    return total;
  }

  function calcIngameScore(rune) {
    if (!rune) return 0;
    return Math.round(sumIngameScoreRaw(rune));
  }

  function calcIngameScoreFromRaw(raw) {
    if (!raw || typeof raw !== 'object') return 0;
    return Math.round(sumIngameScoreRawFromSwex(raw));
  }

  function ingameScoreBreakdown(rune) {
    if (!rune) return [];
    const lines = [];
    let rawSum = 0;
    const innType = Number(rune.innate_type);
    const innVal = Number(rune.innate_val);
    if (Number.isFinite(innType) && innType > 0 && Number.isFinite(innVal) && innVal > 0) {
      const raw = ingameRawPointsForStat(innType, innVal);
      rawSum += raw;
      const label = rune.innate_name || `stat_id ${innType}`;
      lines.push(`${label} ${innVal} → +${raw.toFixed(3)}`);
    }
    for (const sub of rune.substats || []) {
      if (!sub || isInnateDuplicateSub(rune, sub)) continue;
      const tid = Number(sub.type ?? (Array.isArray(sub) ? sub[0] : 0));
      const val = ingameLineValue(sub);
      if (!Number.isFinite(tid) || tid <= 0 || val <= 0) continue;
      const raw = ingameRawPointsForStat(tid, val);
      rawSum += raw;
      const label = sub.name || `stat_id ${tid}`;
      lines.push(`${label} ${val} → +${raw.toFixed(3)}`);
    }
    lines.push(`Σ raw ${rawSum.toFixed(3)} → ${Math.round(rawSum)}`);
    return lines;
  }

  const calculateIngameScore = calcIngameScore;

  /** @deprecated Per-line rounded pts; game uses sum-then-round. */
  function ingamePointsForStat(typeId, currentValue) {
    return ingameRawPointsForStat(typeId, currentValue);
  }

  S.INGAME_MAX_ROLL = INGAME_MAX_ROLL;
  S.INGAME_MULTIPLIER = INGAME_MULTIPLIER;
  S.ingameSubTotalFromSwex = ingameSubTotalFromSwex;
  S.ingameLineValue = ingameLineValue;
  S.ingameRawPointsForStat = ingameRawPointsForStat;
  S.ingamePointsForStat = ingamePointsForStat;
  S.sumIngameScoreRaw = sumIngameScoreRaw;
  S.calcIngameScore = calcIngameScore;
  S.calculateIngameScore = calculateIngameScore;
  S.calcIngameScoreFromRaw = calcIngameScoreFromRaw;
  S.ingameScoreBreakdown = ingameScoreBreakdown;
})();
