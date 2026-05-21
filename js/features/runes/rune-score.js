// js/features/runes/rune-score.js — Forge Score: stat value tiers + synergy (+/−), not Eff% or verdict
  const SWRM_REF = () => window.SWRM || {};

  /** How much each MAIN stat type is worth (0–100), separate from subs. */
  const MAIN_STAT_VALUE = {
    SPD: 100,
    CDmg: 93,
    'ATK%': 91,
    CRate: 86,
    ACC: 80,
    'HP%': 76,
    'DEF%': 73,
    RES: 71,
    ATK: 58,
    DEF: 56,
    HP: 54,
  };

  /** How much each SUB stat type is worth (0–100) — own ranking, not the same as main. */
  const SUB_STAT_VALUE = {
    SPD: 100,
    CDmg: 96,
    CRate: 92,
    'ATK%': 90,
    ACC: 84,
    'HP%': 78,
    'DEF%': 74,
    RES: 72,
    ATK: 62,
    DEF: 60,
    HP: 58,
  };

  /** Innate uses sub-tier values but weaker overall role in the sum. */
  const INNATE_WEIGHT_VS_SUB = 0.38;

  const STAT_NAME_TO_TYPE = {
    HP: 1,
    'HP%': 2,
    ATK: 3,
    'ATK%': 4,
    DEF: 5,
    'DEF%': 6,
    SPD: 8,
    CRate: 9,
    CDmg: 10,
    RES: 11,
    ACC: 12,
  };

  /** Main ↔ sub: values above 1 = synergy bonus, below 1 = anti-synergy penalty. */
  const MAIN_SUB_SYNERGY = {
    'SPD|SPD': 1.14,
    'SPD|ACC': 1.1,
    'SPD|ATK%': 1.06,
    'SPD|HP%': 0.94,
    'SPD|RES': 0.92,
    'SPD|DEF%': 0.93,
    'ATK%|ATK%': 1.14,
    'ATK%|CDmg': 1.13,
    'ATK%|CRate': 1.1,
    'ATK%|SPD': 1.08,
    'ATK%|RES': 0.9,
    'ATK%|DEF%': 0.91,
    'HP%|HP%': 1.12,
    'HP%|DEF%': 1.11,
    'HP%|RES': 1.1,
    'HP%|SPD': 1.04,
    'HP%|ATK%': 0.93,
    'HP%|CDmg': 0.92,
    'DEF%|DEF%': 1.12,
    'DEF%|HP%': 1.1,
    'DEF%|RES': 1.09,
    'DEF%|ATK%': 0.92,
    'CDmg|CRate': 1.12,
    'CDmg|ATK%': 1.1,
    'CDmg|CDmg': 1.08,
    'CRate|CDmg': 1.12,
    'ACC|SPD': 1.1,
    'ACC|ACC': 1.08,
    'RES|HP%': 1.1,
    'RES|RES': 1.08,
    'ATK|ATK': 1.1,
    'DEF|DEF': 1.1,
    'HP|HP': 1.1,
  };

  /** Sub ↔ sub pairs (unordered). >1 bonus, <1 penalty. */
  const SUB_SUB_SYNERGY = {
    'CRate|CDmg': 1.12,
    'ATK%|CDmg': 1.1,
    'ATK%|CRate': 1.08,
    'SPD|ACC': 1.09,
    'SPD|CDmg': 1.07,
    'HP%|DEF%': 1.08,
    'HP%|RES': 1.07,
    'DEF%|RES': 1.06,
    'ATK%|SPD': 1.06,
    'SPD|HP%': 0.95,
    'ATK%|RES': 0.93,
    'ATK%|HP%': 0.94,
    'CDmg|RES': 0.94,
    'ACC|HP%': 0.96,
  };

  const DEFAULT_SYNERGY = 1;
  const DEFAULT_ANTI_SYNERGY = 0.94;

  /** Typical rune lands ~55–75 points before normalize. */
  const SCORE_CALIBRATION = 295;

  function statTypeId(statName, subOrRune) {
    if (subOrRune && Number(subOrRune.type) > 0) return Number(subOrRune.type);
    return STAT_NAME_TO_TYPE[statName] || 0;
  }

  function subLineValue(s) {
    const S = SWRM_REF();
    if (typeof S.subRuneValue === 'function') return S.subRuneValue(s);
    return (Number(s?.val) || 0) + (Number(s?.grind) || 0);
  }

  function maxRollForType(typeId) {
    const S = SWRM_REF();
    const m = S.SUB_MAX && S.SUB_MAX[typeId];
    return m ? m * 5 : 0;
  }

  function maxRollForMain(rune) {
    const slot = Number(rune.slot) || 0;
    const main = rune.mainName;
    const S = SWRM_REF();
    const table = S.EFF_MAIN_MAX && S.EFF_MAIN_MAX[slot];
    if (table && main && table[main]) return table[main];
    const typeId = statTypeId(main, null);
    return maxRollForType(typeId) || 1;
  }

  /** Roll quality 0–1: how much of the stat is present (not engine HR). */
  function rollQuality(value, maxRoll) {
    if (!maxRoll || maxRoll <= 0) return 0.5;
    return Math.min(1.12, Math.max(0, Number(value) / maxRoll));
  }

  function synergyKey(a, b) {
    return [a, b].sort().join('|');
  }

  function lookupSynergy(map, a, b, fallback) {
    if (!a || !b) return fallback;
    return map[synergyKey(a, b)] ?? fallback;
  }

  function qualifyingSubs(rune) {
    return (rune.substats || []).filter((s) => s && s.name && s.source !== 'innate');
  }

  function mainContribution(rune) {
    const main = rune.mainName;
    if (!main) return 0;
    const intrinsic = MAIN_STAT_VALUE[main] ?? 50;
    const q = rollQuality(Number(rune.mainVal) || 0, maxRollForMain(rune));
    return intrinsic * q;
  }

  function subContribution(sub, slot) {
    const name = sub.name;
    const intrinsic = SUB_STAT_VALUE[name] ?? 45;
    const typeId = statTypeId(name, sub);
    const q = rollQuality(subLineValue(sub), maxRollForType(typeId));
    let slotMul = 1;
    const flatOnPercentSlot =
      (slot === 2 || slot === 4 || slot === 6) && (typeId === 1 || typeId === 3 || typeId === 5);
    if (flatOnPercentSlot) slotMul = 0.88;
    return intrinsic * q * slotMul;
  }

  function innateContribution(rune) {
    const name = rune.innate_name;
    if (!name) return 0;
    const intrinsic = (SUB_STAT_VALUE[name] ?? 45) * INNATE_WEIGHT_VS_SUB;
    const typeId = statTypeId(name, { type: rune.innate_type });
    const q = rollQuality(Number(rune.innate_val) || 0, maxRollForType(typeId));
    return intrinsic * q;
  }

  function mainSubSynergyFactor(main, subs) {
    if (!main || !subs.length) return 1;
    let sum = 0;
    let n = 0;
    for (const s of subs) {
      const m = lookupSynergy(MAIN_SUB_SYNERGY, main, s.name, DEFAULT_ANTI_SYNERGY);
      sum += m;
      n += 1;
    }
    return n ? sum / n : 1;
  }

  function subSubSynergyFactor(subs) {
    const names = subs.map((s) => s.name).filter(Boolean);
    if (names.length < 2) return 1;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        sum += lookupSynergy(SUB_SUB_SYNERGY, names[i], names[j], DEFAULT_SYNERGY);
        n += 1;
      }
    }
    if (!n) return 1;
    return sum / n;
  }

  function duplicateSubPenalty(subs) {
    const counts = {};
    for (const s of subs) {
      counts[s.name] = (counts[s.name] || 0) + 1;
    }
    let mul = 1;
    for (const c of Object.values(counts)) {
      if (c > 1) mul *= Math.pow(0.88, c - 1);
    }
    return mul;
  }

  function computeForgeScoreBreakdown(rune) {
    if (!rune) {
      return {
        total: 0,
        mainPts: 0,
        subPts: 0,
        innatePts: 0,
        mainSubSyn: 1,
        subSubSyn: 1,
        dupSub: 1,
      };
    }
    const main = rune.mainName || '';
    const subs = qualifyingSubs(rune);
    const slot = Number(rune.slot) || 0;

    const mainPts = mainContribution(rune);
    const subPts = subs.reduce((acc, s) => acc + subContribution(s, slot), 0);
    const innatePts = innateContribution(rune);

    const mainSubSyn = mainSubSynergyFactor(main, subs);
    const subSubSyn = subSubSynergyFactor(subs);
    const dupSub = duplicateSubPenalty(subs);

    const raw =
      (mainPts + subPts + innatePts) * mainSubSyn * subSubSyn * dupSub;
    const total = Math.max(0, Math.min(100, Math.round((raw / SCORE_CALIBRATION) * 100)));

    return {
      total,
      mainPts: Math.round(mainPts),
      subPts: Math.round(subPts),
      innatePts: Math.round(innatePts),
      mainSubSyn: Math.round(mainSubSyn * 100) / 100,
      subSubSyn: Math.round(subSubSyn * 100) / 100,
      dupSub: Math.round(dupSub * 100) / 100,
    };
  }

  function computeForgeScore(rune) {
    return computeForgeScoreBreakdown(rune).total;
  }

  function computeRuneScore(rune) {
    return computeForgeScore(rune);
  }

  function runeScoreBreakdown(rune) {
    return computeForgeScoreBreakdown(rune);
  }

  function formatForgeScoreTooltip(b, t) {
    const tpl =
      t.forgeScoreTooltip ||
      'Main {mainPts} pts · Subs {subPts} · Innate {innatePts}. Synergy main↔sub ×{ms} · sub↔sub ×{ss} · dup ×{dup}. Stat tiers + roll size — not Eff% or verdict.';
    return tpl
      .replace(/\{mainPts\}/g, String(b.mainPts))
      .replace(/\{subPts\}/g, String(b.subPts))
      .replace(/\{innatePts\}/g, String(b.innatePts))
      .replace(/\{ms\}/g, String(b.mainSubSyn))
      .replace(/\{ss\}/g, String(b.subSubSyn))
      .replace(/\{dup\}/g, String(b.dupSub));
  }

  function runeScoreTooltip(r, t) {
    const b = runeScoreBreakdown(r);
    return formatForgeScoreTooltip(b, t || {});
  }

  function runeScoreTier(score) {
    const n = Number(score) || 0;
    if (n >= 88) return 'stat-chip--score-hi';
    if (n >= 72) return 'stat-chip--score-mid';
    return 'stat-chip--score-lo';
  }

  const S = SWRM_REF();
  if (S) {
    S.computeForgeScore = computeForgeScore;
    S.computeForgeScoreBreakdown = computeForgeScoreBreakdown;
    S.formatForgeScoreTooltip = formatForgeScoreTooltip;
    S.FORGE_SCORE_MAIN_VALUE = MAIN_STAT_VALUE;
    S.FORGE_SCORE_SUB_VALUE = SUB_STAT_VALUE;
  }
