// =============================================
// parser.js — SWEX JSON → normalised runes[]
// =============================================

(function() {
  const { STAT_NAMES, SET_NAMES, GRADE_SHORT } = window.SWRM;

  /**
   * Stat type ID → short name
   */
  function statName(typeId) {
    return STAT_NAMES[typeId] || `s${typeId}`;
  }

  /**
   * Is stat a flat (non-%) type?
   */
  function isFlat(typeId) {
    // Real SWEX mapping: 1=HP flat, 3=ATK flat, 5=DEF flat
    return typeId === 1 || typeId === 3 || typeId === 5;
  }

  /**
   * Calculate rune efficiency % (Legend 6★ baseline)
   * Formula: (sum of substat_value / max_possible_substat_value) / 2.8 * 100
   * Simplified: each substat scored 0–1 relative to max Legend roll.
   */
  const SUB_MAX = {
    1:  1875, // HP flat
    2:  8,    // HP%
    3:  100,  // ATK flat
    4:  8,    // ATK%
    5:  100,  // DEF flat
    6:  8,    // DEF%
    8:  6,    // CRate
    9:  7,    // CDmg
    10: 8,    // RES
    11: 8,    // ACC
    12: 6,    // SPD
  };

  function calcEfficiency(rune) {
    let score = 0;
    // main stat contribution = 1.0 (always max for its type)
    score += 1.0;
    // prefix/innate = 0.5 weight
    if (rune.innate_type && SUB_MAX[rune.innate_type]) {
      score += 0.5 * (rune.innate_val / (SUB_MAX[rune.innate_type] * 5));
    }
    // substats
    for (const s of rune.substats) {
      const maxRoll = SUB_MAX[s.type];
      if (maxRoll) {
        const totalVal = s.val + (s.grind || 0);
        score += (totalVal / (maxRoll * 5));
      }
    }
    // max possible score = 1 (main) + 0.5 (innate) + 4 subs × 1.0 = 5.5
    // but 4-sub Legend has max 2×(1+0.5+4) = express as % of 2.8 (SWOP formula)
    return Math.min(100, Math.round((score / 2.8) * 100 * 10) / 10);
  }

  /**
   * Parse a single rune object from SWEX JSON
   */
  function parseRune(raw) {
    const grade = raw.rank;           // 4=Hero, 5=Legend
    const slot  = raw.slot_no;        // 1–6
    const setId = raw.set_id;
    const level = raw.upgrade_curr || 0;
    const stars = raw.class || 6;

    // Main stat
    const mainType = raw.pri_eff ? raw.pri_eff[0] : 0;
    const mainVal  = raw.pri_eff ? raw.pri_eff[1] : 0;

    // Innate / prefix
    const innType = raw.prefix_eff ? raw.prefix_eff[0] : 0;
    const innVal  = raw.prefix_eff ? raw.prefix_eff[1] : 0;

    // Substats: [type, val, extra, grind]
    const substats = (raw.sec_eff || []).map(s => ({
      type:  s[0],
      name:  statName(s[0]),
      val:   s[1] + (s[2] || 0),   // base + enchant
      grind: s[3] || 0,
      flat:  isFlat(s[0]),
    }));

    const rune = {
      id:         raw.rune_id,
      slot,
      grade,
      gradeStr:   GRADE_SHORT[grade] || `r${grade}`,
      stars,
      level,
      setId,
      setName:    SET_NAMES[setId] || `Set${setId}`,
      mainType,
      mainName:   statName(mainType),
      mainVal,
      innate_type: innType || null,
      innate_name: innType ? statName(innType) : null,
      innate_val:  innVal  || 0,
      substats,
      // filled by engine:
      eff:        0,
      role:       '',
      verdict:    '',
    };

    rune.eff = calcEfficiency(rune);
    return rune;
  }

  /**
   * Main parse entry — accepts parsed JSON object from SWEX
   * SWEX file has { runes: [...], unit_list: [...], ... }
   * We collect inventory runes + equipped runes from unit_list
   */
  function parseSWEX(json) {
    const runeMap = new Map();

    // 1. Inventory runes
    const inv = json.runes || json.rune_list || [];
    for (const r of inv) {
      const rune = parseRune(r);
      if (rune.grade >= 4) runeMap.set(rune.id, rune); // Hero+ only
    }

    // 2. Equipped runes (inside unit_list)
    const units = json.unit_list || [];
    for (const unit of units) {
      for (const r of (unit.runes || [])) {
        if (!r || !r.rune_id) continue;
        const rune = parseRune(r);
        rune.equipped_to = unit.unit_id;
        rune.equipped_name = unit.unit_master_id; // monster master id
        if (rune.grade >= 4) runeMap.set(rune.id, rune);
      }
    }

    return Array.from(runeMap.values());
  }

  window.SWRM.parseRune  = parseRune;
  window.SWRM.parseSWEX  = parseSWEX;
  window.SWRM.calcEfficiency = calcEfficiency;
})();
