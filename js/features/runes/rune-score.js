// js/features/runes/rune-score.js — Forge Score: stat value tiers + synergy (+/−), not Eff% or verdict
  const SWRM_REF = () => window.SWRM || {};

  /** How much each MAIN stat type is worth (0–100), separate from subs. */
  const MAIN_STAT_VALUE = {
    SPD: 100,
    CDmg: 93,
    'ATK%': 91,
    CRate: 89,
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
    CRate: 95,
    CDmg: 93,
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

  /**
   * Main ↔ sub (directional keys `main|sub` where order matters; else sorted fallback).
   * Values above 1 = synergy bonus, below 1 = anti-synergy penalty.
   */
  const MAIN_SUB_SYNERGY = {
    'SPD|ACC': 1.1,
    'SPD|ATK%': 1.1,
    'ATK%|SPD': 1.11,
    'SPD|HP%': 1,
    'SPD|RES': 1,
    'SPD|DEF%': 1,
    'ATK%|CDmg': 1.13,
    'ATK%|CRate': 1.1,
    'ATK%|ATK': 1.1,
    'ATK%|HP%': 1,
    'ATK%|RES': 0.9,
    'ATK%|DEF%': 0.91,
    'HP%|DEF%': 1.11,
    'HP%|RES': 1.1,
    'HP%|SPD': 1.04,
    'HP%|ATK%': 1,
    'HP%|CDmg': 1,
    'HP%|HP': 1.1,
    'DEF%|HP%': 1.1,
    'DEF%|RES': 1.09,
    'DEF%|ATK%': 1,
    'DEF%|DEF': 1.1,
    'CDmg|CRate': 1.12,
    'CDmg|ATK%': 1.1,
    'CDmg|RES': 0.94,
    'CRate|CDmg': 1.12,
    'ACC|SPD': 1.1,
    'ACC|HP%': 1,
    'RES|HP%': 1.1,
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
    'ATK%|SPD': 1.09,
    'SPD|HP%': 1,
    'ATK%|RES': 0.93,
    'ATK%|HP%': 1,
    'CDmg|RES': 0.94,
    'ACC|HP%': 1,
  };

  /** Golden triplet / archetype bonus (at most one per rune). */
  const ARCHETYPE_MUL = 1.04;
  const ARCHETYPES = [
    { id: 'Nuker', tokens: ['ATK', 'CRate', 'CDmg'] },
    { id: 'Fast Tank', tokens: ['HP', 'DEF', 'SPD'] },
    { id: 'Control', tokens: ['SPD', 'ACC', 'HP'] },
    { id: 'Bruiser', tokens: ['HP', 'CRate', 'CDmg'] },
  ];

  const DEFAULT_SYNERGY = 1;
  const DEFAULT_ANTI_SYNERGY = 0.94;
  const CROSS_STAT_DUP_MUL = 0.88;

  /** Slots 1 / 3 / 5 only roll flat mains — not penalized vs % slots. */
  const FLAT_MAIN_SLOTS = new Set([1, 3, 5]);
  const FLAT_MAIN_NAMES = new Set(['HP', 'ATK', 'DEF']);
  /** Tier for HP / ATK / DEF main on flat slots (slot-appropriate, not “wrong main”). */
  const FLAT_SLOT_MAIN_TIER = 72;

  /** Typical rune lands ~55–75 points before normalize. */
  const SCORE_CALIBRATION = 295;

  function isFlatMainSlot(slot) {
    return FLAT_MAIN_SLOTS.has(Number(slot) || 0);
  }

  function mainStatTier(main, slot) {
    if (isFlatMainSlot(slot) && FLAT_MAIN_NAMES.has(main)) return FLAT_SLOT_MAIN_TIER;
    return MAIN_STAT_VALUE[main] ?? 50;
  }

  function mainSubSynergyFallback(slot) {
    return isFlatMainSlot(slot) ? DEFAULT_SYNERGY : DEFAULT_ANTI_SYNERGY;
  }

  /** HP / ATK / DEF roots: flat and % share one base type for cross-zone dup checks. */
  function baseStatType(statName) {
    if (!statName) return '';
    if (statName === 'HP' || statName === 'HP%') return 'HP';
    if (statName === 'ATK' || statName === 'ATK%') return 'ATK';
    if (statName === 'DEF' || statName === 'DEF%') return 'DEF';
    return statName;
  }

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

  /** Main→sub pairs can be directional (e.g. ATK% main + SPD sub ≠ SPD main + ATK% sub). */
  function lookupMainSubSynergy(main, sub, fallback) {
    if (!main || !sub) return fallback;
    const dir = `${main}|${sub}`;
    if (MAIN_SUB_SYNERGY[dir] != null) return MAIN_SUB_SYNERGY[dir];
    return lookupSynergy(MAIN_SUB_SYNERGY, main, sub, fallback);
  }

  function qualifyingSubs(rune) {
    return (rune.substats || []).filter((s) => s && s.name && s.source !== 'innate');
  }

  function mainContribution(rune) {
    const main = rune.mainName;
    if (!main) return 0;
    const slot = Number(rune.slot) || 0;
    const intrinsic = mainStatTier(main, slot);
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

  function innateRollQuality(rune) {
    const name = rune.innate_name;
    if (!name) return 0;
    const typeId = statTypeId(name, { type: rune.innate_type });
    return rollQuality(Number(rune.innate_val) || 0, maxRollForType(typeId));
  }

  function mainSubSynergyFactor(main, subs, slot) {
    if (!main || !subs.length) return 1;
    const fallback = mainSubSynergyFallback(slot);
    let sum = 0;
    let n = 0;
    for (const s of subs) {
      sum += lookupMainSubSynergy(main, s.name, fallback);
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

  /**
   * Cross-zone duplicate: same base stat on main, innate, and/or subs (ATK + ATK% = one type).
   * 0.88^overlaps where overlap = main↔sub OR main↔innate OR innate↔sub (each at most once).
   */
  function duplicateSubPenalty(rune) {
    const mainBase = baseStatType(rune.mainName);
    const innateBase = baseStatType(rune.innate_name);
    const subs = qualifyingSubs(rune);
    let overlaps = 0;

    if (mainBase) {
      if (subs.some((s) => baseStatType(s.name) === mainBase)) overlaps += 1;
      if (innateBase && innateBase === mainBase) overlaps += 1;
    }
    if (innateBase && subs.some((s) => baseStatType(s.name) === innateBase)) overlaps += 1;

    if (!overlaps) return 1;
    return Math.pow(CROSS_STAT_DUP_MUL, overlaps);
  }

  function archetypeLabel(id, t) {
    const loc = t || {};
    const map = {
      Nuker: loc.archetypeNuker || 'Nuker',
      'Fast Tank': loc.archetypeFastTank || 'Fast Tank',
      Control: loc.archetypeControl || 'Control',
      Bruiser: loc.archetypeBruiser || 'Bruiser',
    };
    return map[id] || id;
  }

  function collectArchetypeStatKeys(rune) {
    const keys = new Set();
    if (rune.mainName) keys.add(baseStatType(rune.mainName));
    for (const s of qualifyingSubs(rune)) {
      if (s.name) keys.add(baseStatType(s.name));
    }
    if (rune.innate_name && innateRollQuality(rune) > 0.5) {
      keys.add(baseStatType(rune.innate_name));
    }
    return keys;
  }

  /** First matching archetype wins; bonus applied at most once. */
  function archetypeFactor(rune, t) {
    const keys = collectArchetypeStatKeys(rune);
    for (const arch of ARCHETYPES) {
      if (arch.tokens.every((tok) => keys.has(tok))) {
        return {
          mul: ARCHETYPE_MUL,
          name: archetypeLabel(arch.id, t),
          id: arch.id,
        };
      }
    }
    return { mul: 1, name: '', id: '' };
  }

  function computeForgeScoreBreakdown(rune, t) {
    if (!rune) {
      return {
        total: 0,
        mainPts: 0,
        subPts: 0,
        innatePts: 0,
        mainSubSyn: 1,
        subSubSyn: 1,
        dupSub: 1,
        archetypeMul: 1,
        archetypeName: '',
      };
    }
    const main = rune.mainName || '';
    const subs = qualifyingSubs(rune);
    const slot = Number(rune.slot) || 0;

    const mainPts = mainContribution(rune);
    const subPts = subs.reduce((acc, s) => acc + subContribution(s, slot), 0);
    const innatePts = innateContribution(rune);

    const mainSubSyn = mainSubSynergyFactor(main, subs, slot);
    const subSubSyn = subSubSynergyFactor(subs);
    const dupSub = duplicateSubPenalty(rune);
    const arch = archetypeFactor(rune, t);

    const raw =
      (mainPts + subPts + innatePts) * mainSubSyn * subSubSyn * dupSub * arch.mul;
    const total = Math.max(0, Math.min(100, Math.round((raw / SCORE_CALIBRATION) * 100)));

    return {
      total,
      mainPts: Math.round(mainPts),
      subPts: Math.round(subPts),
      innatePts: Math.round(innatePts),
      mainSubSyn: Math.round(mainSubSyn * 100) / 100,
      subSubSyn: Math.round(subSubSyn * 100) / 100,
      dupSub: Math.round(dupSub * 100) / 100,
      archetypeMul: Math.round(arch.mul * 100) / 100,
      archetypeName: arch.name,
    };
  }

  function computeForgeScore(rune, t) {
    return computeForgeScoreBreakdown(rune, t).total;
  }

  function computeRuneScore(rune, t) {
    return computeForgeScore(rune, t);
  }

  function runeScoreBreakdown(rune, t) {
    return computeForgeScoreBreakdown(rune, t);
  }

  function formatForgeScoreTooltip(b, t) {
    const loc = t || {};
    const archetypeSuffix =
      b.archetypeMul > 1 && b.archetypeName
        ? (loc.forgeScoreTooltipArchetype || ' · archetype ×{mul} ({name})')
            .replace(/\{mul\}/g, String(b.archetypeMul))
            .replace(/\{name\}/g, String(b.archetypeName))
        : '';
    const tpl =
      loc.forgeScoreTooltip ||
      'Main {mainPts} pts · Subs {subPts} · Innate {innatePts}. Synergy main↔sub ×{ms} · sub↔sub ×{ss} · cross-stat dup ×{dup}{archetypeSuffix}. Stat tiers + roll size — not Eff% or verdict.';
    return tpl
      .replace(/\{mainPts\}/g, String(b.mainPts))
      .replace(/\{subPts\}/g, String(b.subPts))
      .replace(/\{innatePts\}/g, String(b.innatePts))
      .replace(/\{ms\}/g, String(b.mainSubSyn))
      .replace(/\{ss\}/g, String(b.subSubSyn))
      .replace(/\{dup\}/g, String(b.dupSub))
      .replace(/\{archetypeSuffix\}/g, archetypeSuffix);
  }

  function runeScoreTooltip(r, t) {
    const b = runeScoreBreakdown(r, t);
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
    S.FORGE_SCORE_ARCHETYPES = ARCHETYPES;
  }
