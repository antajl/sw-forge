// js/features/monsters/monsters-stats-calc.js — rune stat totals from base + runes
//
// SWEX does not ship reliable final combat totals on units; we derive Total from:
//   1) Base at unit level — SWARFARM monster base/max stats scaled to u.level
//   2) All equipped runes — main (slot 1/3/5 flat, 2/4/6 %), innate, substats (+ grind)
//
// Per stat key (hp, atk, def, spd, critRate, critDmg, res, acc):
//   flat  = sum of flat bonuses from runes
//   pct   = sum of % bonuses from runes (each % applies to base only, not to flat)
//   total = round(base + flat + base * pct / 100)
//
// +Runes column in UI = total − base. Not included: artifacts, glory towers, leader/passive buffs.
  const PCT_STAT_TYPES = new Set([2, 4, 6, 9, 10, 11, 12]);
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

  /** Collect flat / % bonuses for one stat key from all runes. */
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

  /**
   * Total stat from base + runes (flat first, then % of base).
   * @param {number} base
   * @param {object[]} runesArray parsed runes
   * @param {string} statKey hp|atk|def|spd|critRate|critDmg|res|acc
   */
  function calculateTotalStatForKey(base, runesArray, statKey) {
    const b = Number(base);
    const baseNum = Number.isFinite(b) ? b : 0;
    const { flat, pct } = sumRuneBonusesForKey(statKey, runesArray);
    let total = baseNum;
    total += flat;
    if (pct) total += baseNum * (pct / 100);
    return Math.round(total);
  }

  function getUnitEquippedRunes(u) {
    if (!u || !Array.isArray(u.runeSlots)) return [];
    return u.runeSlots.map((s) => s && s.rune).filter(Boolean);
  }

  function calculateMonsterStatTotals(baseStats, unit) {
    const runes = getUnitEquippedRunes(unit);
    const keys = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'res', 'acc'];
    const totals = {};
    for (const key of keys) {
      const b = baseStats && Number.isFinite(Number(baseStats[key])) ? Number(baseStats[key]) : 0;
      totals[key] = calculateTotalStatForKey(b, runes, key);
    }
    return totals;
  }
