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

  /**
   * Sky Tribe Totem / account SPD bonus sources in SWEX (2025+):
   * - Primary: `wizard_skill_list[]` row with `skill_id: 14` (Glory monument #14), `level` = totem level.
   * - Legacy: `deco_list` / `deo_list` with `master_id: 11001` (old export naming).
   * - Optional: `wizard_info.unit_home_bonus` (stat_type 8 = SPD) on some payloads.
   */
  const WIZARD_SKILL_ID_SPEED_TOTEM = 14;
  const SPEED_TOTEM_DECO_MASTER_ID = 11001;
  const COM2US_STAT_TYPE_SPD = 8;
  /** % bonus to base SPD by totem level (SWOP / in-game, levels 1–10; extended to 20). */
  const TOTEM_SPD_PCT_BY_LEVEL = {
    1: 2,
    2: 3,
    3: 5,
    4: 6,
    5: 8,
    6: 9,
    7: 11,
    8: 12,
    9: 14,
    10: 15,
    11: 8.5,
    12: 9,
    13: 10,
    14: 11,
    15: 11.5,
    16: 12,
    17: 13,
    18: 14,
    19: 14.5,
    20: 15,
  };

  function totemSpdPctFromLevel(level) {
    const lv = Number(level);
    if (!Number.isFinite(lv) || lv < 1) return 0;
    const pct = TOTEM_SPD_PCT_BY_LEVEL[lv];
    return pct != null ? pct : lv >= 10 ? 15 : 0;
  }

  function decoEntryMasterId(d) {
    if (!d || typeof d !== 'object') return NaN;
    return Number(d.master_id ?? d.deco_master_id ?? d.building_master_id);
  }

  function decoEntryLevel(d) {
    return Number(d.level ?? d.lv ?? d.upgrade_curr ?? d.upgrade_level ?? d.building_level);
  }

  function swexAllDecoEntries(json) {
    const out = [];
    const seen = new Set();
    const pushList = (list) => {
      if (!Array.isArray(list)) return;
      for (const d of list) {
        if (!d || typeof d !== 'object') continue;
        const key = `${decoEntryMasterId(d)}:${decoEntryLevel(d)}:${d.deco_id ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(d);
      }
    };
    if (!json || typeof json !== 'object') return out;
    pushList(json.deco_list);
    pushList(json.deo_list);
    pushList(json.decoration_list);
    const wi = json.wizard_info;
    if (wi && typeof wi === 'object') {
      pushList(wi.deco_list);
      pushList(wi.deo_list);
    }
    for (const v of Object.values(json)) {
      if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
      pushList(v.deco_list);
      pushList(v.deo_list);
    }
    return out;
  }

  function wizardSkillListRows(json) {
    if (!json || typeof json !== 'object') return [];
    const raw = json.wizard_skill_list ?? json.wizard_info?.wizard_skill_list;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'object') return Object.values(raw);
    return [];
  }

  function totemFromWizardSkillList(json) {
    let best = null;
    for (const row of wizardSkillListRows(json)) {
      if (Number(row.skill_id) !== WIZARD_SKILL_ID_SPEED_TOTEM) continue;
      const lv = Number(row.level ?? row.skill_level ?? row.lv);
      const pct = totemSpdPctFromLevel(lv);
      if (pct > 0 && (!best || lv > best.level)) {
        best = { level: lv, pct, source: 'wizard_skill_list', skill_id: WIZARD_SKILL_ID_SPEED_TOTEM };
      }
    }
    return best;
  }

  function rowLooksLikeSpdBonus(row) {
    if (!row || typeof row !== 'object') return false;
    const stat = Number(row.stat_type ?? row.stat ?? row.attribute_type);
    const type = Number(row.bonus_type ?? row.type ?? row.effect_type);
    const attr = String(row.attribute ?? row.effect ?? row.stat_name ?? '').toLowerCase();
    if (stat === COM2US_STAT_TYPE_SPD || type === COM2US_STAT_TYPE_SPD) return true;
    if (attr.includes('speed') || attr.includes('spd')) return true;
    return false;
  }

  function totemFromUnitHomeBonus(json) {
    const lists = [];
    if (json?.wizard_info?.unit_home_bonus) lists.push(json.wizard_info.unit_home_bonus);
    if (json?.unit_home_bonus) lists.push(json.unit_home_bonus);
    if (json?.wizard_info?.bonus_list) lists.push(json.wizard_info.bonus_list);
    if (json?.account_bonus) lists.push(json.account_bonus);
    let best = null;
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const row of list) {
        if (!rowLooksLikeSpdBonus(row)) continue;
        let pct = Number(row.bonus_value ?? row.value ?? row.amount ?? row.pct ?? row.rate);
        if (!Number.isFinite(pct) || pct <= 0) continue;
        if (pct > 0 && pct <= 1) pct *= 100;
        const lv = Number(row.level);
        if (pct > 0 && (!best || pct > best.pct)) {
          best = { level: Number.isFinite(lv) ? lv : 0, pct, source: 'unit_home_bonus' };
        }
      }
    }
    return best;
  }

  function totemFromDecoList(json) {
    let best = null;
    for (const d of swexAllDecoEntries(json)) {
      const mid = decoEntryMasterId(d);
      if (mid !== SPEED_TOTEM_DECO_MASTER_ID && mid !== WIZARD_SKILL_ID_SPEED_TOTEM) continue;
      const lv = decoEntryLevel(d);
      const pct = totemSpdPctFromLevel(lv);
      if (pct > 0 && (!best || lv > best.level)) {
        best = { level: lv, pct, source: mid === SPEED_TOTEM_DECO_MASTER_ID ? 'deco_list:11001' : 'deco_list:14' };
      }
    }
    return best;
  }

  /** Resolve account-wide SPD% from base (Sky Tribe Totem / Summoner monument). */
  function findAccountSpeedTotemBonus(json) {
    return (
      totemFromWizardSkillList(json) ||
      totemFromUnitHomeBonus(json) ||
      totemFromDecoList(json) ||
      null
    );
  }

  function findSkyTribeTotemInJson(json) {
    return findAccountSpeedTotemBonus(json);
  }

  function totemSpdPctFromSwexJson(json) {
    const hit = findAccountSpeedTotemBonus(json);
    return hit ? hit.pct : 0;
  }

  function refreshAccountTotemFromSwex(json) {
    const hit = findAccountSpeedTotemBonus(json);
    const pct = hit ? hit.pct : 0;
    if (window.SWRM) {
      window.SWRM.accountTotemSpdPct = pct;
      window.SWRM.accountTotemLevel = hit ? hit.level : 0;
      window.SWRM.accountTotemSource = hit ? hit.source : '';
    }
    return pct;
  }

  function getAccountTotemSpdPct() {
    if (window.SWRM && Number.isFinite(Number(window.SWRM.accountTotemSpdPct))) {
      return Number(window.SWRM.accountTotemSpdPct);
    }
    const json = typeof activeSwexJson !== 'undefined' ? activeSwexJson : null;
    return totemSpdPctFromSwexJson(json);
  }

  function calculateMonsterStatBreakdown(baseStats, unit) {
    const runes = getUnitEquippedRunes(unit);
    const totemPct = getAccountTotemSpdPct();
    const keys = ['hp', 'atk', 'def', 'spd', 'critRate', 'critDmg', 'res', 'acc'];
    const out = {};
    for (const key of keys) {
      const b = baseStats && Number.isFinite(Number(baseStats[key])) ? Number(baseStats[key]) : 0;
      const baseRounded = roundStatTotal(key, b);
      let total = calculateTotalStatForKey(b, runes, key, unit);
      total = reconcileTotalWithSwex(key, total, unit);
      if (key === 'spd' && totemPct > 0) {
        const totemFlat = baseSpdAuraBonusFlat(baseRounded, totemPct, 0);
        total += totemFlat;
      }
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

  /** Flat SPD from totem + leader (% of base only; runes/Swift already in SWEX unit spd). */
  function baseSpdAuraBonusFlat(baseSpd, totemPct, leaderPct) {
    const base = Number(baseSpd);
    if (!Number.isFinite(base) || base <= 0) return 0;
    const pct = (Number(totemPct) || 0) + (Number(leaderPct) || 0);
    if (pct <= 0) return 0;
    return Math.round((base * pct) / 100);
  }

  function leaderSkillSpdPct(leaderSkill) {
    if (!leaderSkill) return 0;
    const attr = String(leaderSkill.attribute || '').toLowerCase();
    if (!attr.includes('speed')) return 0;
    const n = Number(leaderSkill.amount);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  /**
   * SWEX `unit_list[].spd` is usually base SPD at unit level (same as monster screen base),
   * not rune total. Some exports may ship a higher value that already includes runes.
   */
  function swexSpdLooksLikeRuneTotal(swexSpd, baseSpd) {
    const sw = Number(swexSpd);
    const base = Number(baseSpd);
    if (!Number.isFinite(sw) || !Number.isFinite(base) || base <= 0) return false;
    return sw > base + 2;
  }

  function unitBaseSpdForSpeed(unit) {
    if (!unit) return null;
    const db = window.SWRM_MONSTER_DB;
    const meta =
      unit.meta ||
      (db && typeof db.lookupMonster === 'function' ? db.lookupMonster(unit.masterId) : null);
    if (db && typeof db.monsterBaseStatsAtLevel === 'function') {
      const baseStats = db.monsterBaseStatsAtLevel(meta, unit.level);
      const b = baseStats && Number(baseStats.spd);
      if (Number.isFinite(b) && b > 0) return b;
    }
    const swex = Number(unit.stats && unit.stats.spd);
    return Number.isFinite(swex) && swex > 0 ? swex : null;
  }

  /**
   * Team / combat SPD: base + runes (+ Swift set) + round(base × totem%) + round(base × leader%).
   * Uses SWEX spd as rune total only when it is clearly above scaled base.
   * Optional spdBuffPct: +30% of that total (in-battle buff).
   */
  function computeUnitSpeedForTeam(unit, opts) {
    const o = opts || {};
    if (!unit) return null;
    const swexSpd = Number(unit.stats && unit.stats.spd);
    const totemPct =
      Number(o.totemSpdPct) ||
      (typeof getAccountTotemSpdPct === 'function' ? getAccountTotemSpdPct() : 0) ||
      0;
    const leaderPct = Number(o.leaderSpdPct) || 0;
    const baseSpd = unitBaseSpdForSpeed(unit);
    const auraBase = baseSpd != null ? baseSpd : swexSpd;
    const auraFlat =
      Number.isFinite(auraBase) && auraBase > 0
        ? baseSpdAuraBonusFlat(auraBase, totemPct, leaderPct)
        : 0;

    let spd = null;
    if (baseSpd != null) {
      const runes = getUnitEquippedRunes(unit);
      const runeTotal = calculateTotalStatForKey(baseSpd, runes, 'spd', unit);
      if (swexSpdLooksLikeRuneTotal(swexSpd, baseSpd)) {
        spd = Math.floor(swexSpd) + auraFlat;
      } else {
        spd = runeTotal + auraFlat;
      }
    } else if (Number.isFinite(swexSpd) && swexSpd > 0) {
      spd = Math.floor(swexSpd) + auraFlat;
    }
    if (spd == null || !Number.isFinite(spd)) return null;
    const buffPct = Number(o.spdBuffPct) || 0;
    if (buffPct > 0) spd = roundStatTotal('spd', spd * (1 + buffPct / 100));
    return roundStatTotal('spd', spd);
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.totemSpdPctFromSwexJson = totemSpdPctFromSwexJson;
  window.SWRM.findAccountSpeedTotemBonus = findAccountSpeedTotemBonus;
  window.SWRM.findSkyTribeTotemInJson = findSkyTribeTotemInJson;
  window.SWRM.refreshAccountTotemFromSwex = refreshAccountTotemFromSwex;
  window.SWRM.getAccountTotemSpdPct = getAccountTotemSpdPct;
  window.SWRM.totemSpdPctFromLevel = totemSpdPctFromLevel;
  window.SWRM.leaderSkillSpdPct = leaderSkillSpdPct;
  window.SWRM.baseSpdAuraBonusFlat = baseSpdAuraBonusFlat;
  window.SWRM.unitBaseSpdForSpeed = unitBaseSpdForSpeed;
  window.SWRM.computeUnitSpeedForTeam = computeUnitSpeedForTeam;
