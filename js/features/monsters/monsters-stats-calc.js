// js/features/monsters/monsters-stats-calc.js — rune stat totals from base + runes + sets + gear
//
// SWEX does not ship reliable final combat totals on units; we derive Total from:
//   1) Base at unit level — SWARFARM monster base/max stats scaled to u.level
//   2) Equipped runes — mains, innate (prefix), substats (+ grind)
//   3) Active rune set bonuses (2-/4-piece panel stats)
//   4) Artifacts / relics — only confirmed pri effects (flat HP/ATK/DEF; relic % HP/ATK/DEF)
//
// HP / ATK / DEF / SPD: flat bonuses stack; % bonuses apply to base (runes + set %).
// CRI Rate / CRI Dmg / RES / ACC: % bonuses stack additively on base (game stat screen).
//
// +Gear column = total − base. Not included: glory, leader/passive, artifact combat subs.
  const PCT_STAT_TYPES = new Set([2, 4, 6, 9, 10, 11, 12]);
  const ADDITIVE_PCT_KEYS = new Set(['critRate', 'critDmg', 'res', 'acc']);

  /** Panel stat bonuses when a set threshold is active (one rule per set name). */
  const RUNE_SET_PANEL_BONUSES = {
    Energy: { need: 2, hpPct: 15 },
    Guard: { need: 2, defPct: 15 },
    Swift: { need: 4, spdFlat: 25 },
    Blade: { need: 2, critRatePct: 12 },
    Rage: { need: 4, critDmgPct: 40 },
    Focus: { need: 2, accPct: 20 },
    Endure: { need: 2, resPct: 20 },
    Fatal: { need: 4, atkPct: 35 },
    Despair: { need: 4, accPct: 25 },
    Vampire: { need: 4, hpPct: 35 },
    Fight: { need: 2, atkPct: 8 },
    Determination: { need: 2, defPct: 8 },
    Enhance: { need: 2, hpPct: 8 },
    Accuracy: { need: 2, accPct: 20 },
    Tolerance: { need: 2, resPct: 20 },
  };

  function statKeyForTypeId(typeId) {
    const id = Number(typeId);
    if (id === 1 || id === 2) return 'hp';
    if (id === 3 || id === 4) return 'atk';
    if (id === 5 || id === 6) return 'def';
    if (id === 8) return 'spd';
    if (id === 9) return 'critRate';
    if (id === 10) return 'critDmg';
    if (id === 11) return 'res';
    if (id === 12) return 'acc';
    return null;
  }

  function isPercentBonus(typeId, slotNo) {
    const id = Number(typeId);
    const slot = Number(slotNo);
    if (Number.isFinite(slot) && slot >= 1 && slot <= 6) {
      if (window.SWRM && typeof window.SWRM.isMainStatFlat === 'function') {
        return !window.SWRM.isMainStatFlat(slot, id);
      }
      return slot === 2 || slot === 4 || slot === 6;
    }
    return PCT_STAT_TYPES.has(id);
  }

  function subVal(sub) {
    if (window.SWRM && typeof window.SWRM.subRuneValue === 'function') {
      return window.SWRM.subRuneValue(sub);
    }
    return (Number(sub?.val) || 0) + (Number(sub?.grind) || 0);
  }

  function sumRuneBonusesForKey(statKey, runesArray) {
    let flat = 0;
    let pct = 0;
    for (const rune of runesArray || []) {
      if (!rune) continue;
      const add = (typeId, value, slotNo) => {
        const key = statKeyForTypeId(typeId);
        const v = Number(value);
        if (key !== statKey || !Number.isFinite(v) || v === 0) return;
        if (isPercentBonus(typeId, slotNo)) pct += v;
        else flat += v;
      };
      if (rune.mainType != null && rune.mainVal != null) {
        add(rune.mainType, rune.mainVal, rune.slot);
      }
      if (rune.innate_type && rune.innate_val) {
        add(rune.innate_type, rune.innate_val, null);
      }
      for (const s of rune.substats || []) {
        if (s && s.source === 'innate') continue;
        add(s.type, subVal(s), null);
      }
    }
    return { flat, pct };
  }

  function countRuneSets(runesArray) {
    const counts = {};
    for (const rune of runesArray || []) {
      if (!rune || !rune.setName) continue;
      counts[rune.setName] = (counts[rune.setName] || 0) + 1;
    }
    return counts;
  }

  function sumSetBonusesForKey(statKey, runesArray) {
    let flat = 0;
    let pct = 0;
    const counts = countRuneSets(runesArray);
    for (const [setName, total] of Object.entries(counts)) {
      const rule = RUNE_SET_PANEL_BONUSES[setName];
      if (!rule || total < rule.need) continue;
      if (rule.spdFlat && statKey === 'spd') flat += rule.spdFlat;
      if (rule.hpPct && statKey === 'hp') pct += rule.hpPct;
      if (rule.atkPct && statKey === 'atk') pct += rule.atkPct;
      if (rule.defPct && statKey === 'def') pct += rule.defPct;
      if (rule.critRatePct && statKey === 'critRate') pct += rule.critRatePct;
      if (rule.critDmgPct && statKey === 'critDmg') pct += rule.critDmgPct;
      if (rule.resPct && statKey === 'res') pct += rule.resPct;
      if (rule.accPct && statKey === 'acc') pct += rule.accPct;
    }
    return { flat, pct };
  }

  function sumConfirmedGearBonusesForKey(statKey, unit) {
    if (!unit || !window.SWRM || typeof window.SWRM.sumGearBonusesForKey !== 'function') {
      return { flat: 0, pct: 0 };
    }
    return window.SWRM.sumGearBonusesForKey(statKey, unit);
  }

  function calculateTotalStatForKey(base, runesArray, statKey, unit) {
    const b = Number(base);
    const baseNum = Number.isFinite(b) ? b : 0;
    const rune = sumRuneBonusesForKey(statKey, runesArray);
    const set = sumSetBonusesForKey(statKey, runesArray);
    const gear = sumConfirmedGearBonusesForKey(statKey, unit);
    const flat = rune.flat + set.flat + gear.flat;
    const pct = rune.pct + set.pct + gear.pct;
    let total = baseNum + flat;
    if (pct) {
      if (ADDITIVE_PCT_KEYS.has(statKey)) total += pct;
      else total += (baseNum * pct) / 100;
    }
    return roundStatTotal(statKey, total);
  }

  /** Match in-game stat screen (HP/ATK/DEF ceil; SPD floor; % round). */
  function roundStatTotal(statKey, total) {
    const n = Number(total);
    if (!Number.isFinite(n)) return 0;
    if (statKey === 'spd') return Math.floor(n + 1e-6);
    if (statKey === 'hp' || statKey === 'atk' || statKey === 'def') {
      return Math.ceil(n - 1e-9);
    }
    return Math.round(n);
  }

  function displayStatValue(statKey, value, isPct) {
    const n = roundStatTotal(statKey, value);
    return isPct ? `${n}%` : String(n);
  }

  function reconcileTotalWithSwex(statKey, computedTotal, unit) {
    const s = unit && unit.stats;
    if (!s) return computedTotal;
    const swex = Number(s[statKey]);
    if (!Number.isFinite(swex)) return computedTotal;
    const comp = roundStatTotal(statKey, computedTotal);
    const sw = roundStatTotal(statKey, swex);
    if (Math.abs(sw - comp) <= 1) return sw;
    return comp;
  }

  function calculateMonsterStatBreakdown(baseStats, unit) {
    const runes = getUnitEquippedRunes(unit);
    const keys = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'res', 'acc'];
    const out = {};
    for (const key of keys) {
      const b = baseStats && Number.isFinite(Number(baseStats[key])) ? Number(baseStats[key]) : 0;
      const baseRounded = roundStatTotal(key, b);
      let total = calculateTotalStatForKey(b, runes, key, unit);
      total = reconcileTotalWithSwex(key, total, unit);
      const isPct = ADDITIVE_PCT_KEYS.has(key);
      let bonus = total - baseRounded;
      if (!isPct) bonus = Math.max(0, bonus);
      else bonus = Math.max(0, Math.round(bonus));
      out[key] = {
        base: baseRounded,
        bonus,
        total,
        isPct,
      };
    }
    return out;
  }

  function getUnitEquippedRunes(u) {
    if (!u || !Array.isArray(u.runeSlots)) return [];
    return u.runeSlots.map((s) => s && s.rune).filter(Boolean);
  }

  function calculateMonsterStatTotals(baseStats, unit) {
    const bd = calculateMonsterStatBreakdown(baseStats, unit);
    const totals = {};
    for (const key of Object.keys(bd)) totals[key] = bd[key].total;
    return totals;
  }
