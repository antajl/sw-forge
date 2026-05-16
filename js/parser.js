// =============================================
// parser.js — SWEX JSON → normalised runes[]
// =============================================

(function() {
  const { STAT_NAMES, SET_NAMES, GRADE_SHORT, GRADE_NAMES } = window.SWRM;

  /**
   * SWEX / Com2US rarity: normally 1–5 (Common…Legend). Some payloads (often unit_list runes)
   * send 11–15 (same values + 10). Anything else is returned as-is for debugging.
   * All ranks 1–5 are preserved (including 4 = Hero); filtering by grade happens in parseSWEX, not here.
   *
   * Ancient runes: exporter uses the same +10 scheme — `extra` / `rank` can be 11–15, and `class`
   * becomes stars + 10 (e.g. 6★ Legend → class 16). Same rule as SWOP: ancient ⇔ `class > 10`.
   */
  function normalizeGradeRank(rank) {
    const n = Number(rank);
    if (!Number.isFinite(n) || n <= 0) return 0;
    if (n >= 1 && n <= 5) return n;
    if (n >= 11 && n <= 15) return n - 10;
    const mod = n % 10;
    if (n >= 10 && mod >= 1 && mod <= 5) return mod;
    return n;
  }

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
    8:  6,    // SPD
    9:  6,    // CRate
    10: 7,    // CDmg
    11: 8,    // RES
    12: 8,    // ACC
  };
  window.SWRM.SUB_MAX = SUB_MAX;

  /**
   * Raw efficiency % from SWOP-style score (2.8 baseline), not capped.
   * SWOP can show well above 100%; UI table still uses capped calcEfficiency for a 0–100 scale.
   */
  function calcEfficiencyUncapped(rune) {
    let score = 1.0; // main
    if (rune.innate_type && SUB_MAX[rune.innate_type]) {
      let innateScore = 0.5 * ((rune.innate_val || 0) / (SUB_MAX[rune.innate_type] * 5));
      if (rune.innate_type === 1 || rune.innate_type === 3 || rune.innate_type === 5) {
        innateScore *= 0.5;
      }
      score += innateScore;
    }
    for (const s of rune.substats) {
      const maxRoll = SUB_MAX[s.type];
      if (maxRoll) {
        let subScore = (s.val || 0) / (maxRoll * 5);
        if (s.type === 1 || s.type === 3 || s.type === 5) {
          subScore *= 0.5;
        }
        score += subScore;
      }
    }
    return Math.round((score / 2.8) * 100 * 10) / 10;
}

  function calcEfficiency(rune) {
    return Math.min(100, calcEfficiencyUncapped(rune));
  }

  /**
   * Parse a single rune object from SWEX JSON
   */
  function parseRune(raw) {
    const gradeRaw = raw.extra;
    const grade = normalizeGradeRank(gradeRaw);
    const slot  = raw.slot_no;        // 1–6
    const setId = raw.set_id;
    const level = raw.upgrade_curr || 0;

    const classRaw = Number(raw.class);
    const rankRaw = Number(raw.rank);
    const isAncient =
      (Number.isFinite(classRaw) && classRaw > 10)
      || (Number.isFinite(rankRaw) && rankRaw >= 11 && rankRaw <= 15);
    // Star tier for metrics (e.g. +15 depth): non-ancient uses class as tier (6 for 6★); ancient uses class − 10.
    let tierStars = 0;
    if (Number.isFinite(classRaw) && classRaw > 0) {
      tierStars = classRaw > 10 ? classRaw - 10 : classRaw;
    }
    const stars = tierStars > 0 ? tierStars : 6;

    // Main stat
    const mainType = raw.pri_eff ? raw.pri_eff[0] : 0;
    const mainVal  = raw.pri_eff ? raw.pri_eff[1] : 0;

    // Innate / prefix
    const innType = raw.prefix_eff ? raw.prefix_eff[0] : 0;
    const innVal  = raw.prefix_eff ? raw.prefix_eff[1] : 0;

    // Substats: array tuples are usually [type, value, enchanted (0|1), grind_bonus] in SWEX/API exports.
    // Some older payloads used [type, value, grind_bonus, extra]; detect via slot 2 not being 0|1.
    const substats = (raw.sec_eff || []).map((s) => {
      const isObj = s && typeof s === 'object' && !Array.isArray(s);
      const type = isObj ? Number(s.type ?? s.stat_type ?? s.statType ?? 0) : Number(s[0] || 0);
      const val = isObj ? Number(s.value ?? s.val ?? 0) : Number(s[1] || 0);
      let grind;
      let procs;
      let gem;
      let enchanted = false;
      if (isObj) {
        grind = Number(s.gvalue ?? s.grind ?? s.grind_value ?? s.grindValue ?? 0);
        procs = Number(s.procs ?? s.proc ?? s.proc_count ?? s.procCount ?? 0);
        gem = Number(s.gem ?? s.gem_value ?? s.gemValue ?? s.enchant_gem ?? 0);
        enchanted = !!(
          s.enchanted === true || s.is_enchanted === true || s.isEnchanted === true
          || Number(s.enchanted) === 1
          || (!Number.isFinite(gem) ? false : gem !== 0)
        );
      } else {
        const slot2 = Number(s[2]);
        const slot3 = Number(s[3]);
        gem = 0;
        const slot2IsEnchantFlag = slot2 === 0 || slot2 === 1;
        if (slot2IsEnchantFlag) {
          enchanted = slot2 === 1;
          grind = Number.isFinite(slot3) ? slot3 : 0;
          procs = 0;
        } else if (Number.isFinite(slot2) && slot2 > 1) {
          // Legacy / alternate: grind amount at index 2 when it's clearly not an enchant flag.
          enchanted =
            s.length >= 5 && (s[4] === true || s[4] === 1 || s[4] === '1');
          grind = slot2;
          procs = Number.isFinite(slot3) ? slot3 : 0;
        } else {
          grind = 0;
          procs = Number.isFinite(slot3) ? slot3 : 0;
          if (s.length >= 5) {
            const tail = s[4];
            if (tail === true || tail === 1 || tail === '1') enchanted = true;
          }
        }
      }
      if (!Number.isFinite(gem)) gem = 0;
      if (!Number.isFinite(grind)) grind = 0;
      if (!Number.isFinite(procs)) procs = 0;
      return {
        type,
        name:  statName(type),
        // Base roll; grind stored separately — use SWRM.subRuneValue() for roll+grind totals.
        val:   Number.isFinite(val) ? val : 0,
        gem:   Number.isFinite(gem) ? gem : 0,
        grind: Number.isFinite(grind) ? grind : 0,
        procs: Number.isFinite(procs) ? procs : 0,
        enchanted,
        flat:  isFlat(type),
        /** Qualifying sub rows for roles (`innate` if exporter duplicates prefix into sec_eff — excluded from statMap) */
        source: 'sub',
      };
    });

    const rune = {
      // Keep a reference to the original payload for debugging weird cases (e.g. impossible mains per slot).
      _raw: raw,
      id:         raw.rune_id,
      slot,
      grade,
      gradeStr: (grade >= 1 && grade <= 5)
        ? (GRADE_SHORT[grade] || GRADE_NAMES[grade] || `r${gradeRaw}`)
        : `r${gradeRaw}`,
      /** Derived from SWEX `class`/`rank` (+10 encoding); not a separate JSON field in exports. */
      isAncient,
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
      role:       '',
      verdict:    '',
    };

    rune.eff = calcEfficiency(rune);
    return rune;
  }

  /**
   * Count unique runes in a SWEX export (all grades), inventory + equipped.
   */
  function countAllSwexRunes(json) {
    if (!json || typeof json !== 'object') return 0;
    const ids = new Set();
    const inv = json.runes || json.rune_list || [];
    for (const r of inv) {
      if (r && r.rune_id != null) ids.add(r.rune_id);
    }
    const units = json.unit_list || [];
    for (const unit of units) {
      for (const r of (unit.runes || [])) {
        if (r && r.rune_id != null) ids.add(r.rune_id);
      }
    }
    return ids.size;
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
      if (rune.grade >= 3 && rune.grade <= 5) runeMap.set(rune.id, rune); // Rare–Legend only
    }

    // 2. Equipped runes (inside unit_list)
    const units = json.unit_list || [];
    for (const unit of units) {
      for (const r of (unit.runes || [])) {
        if (!r || !r.rune_id) continue;
        const rune = parseRune(r);
        rune.equipped_to = unit.unit_id;
        rune.equipped_name = unit.unit_master_id; // monster master id
        if (rune.grade >= 3 && rune.grade <= 5) runeMap.set(rune.id, rune);
      }
    }

    return Array.from(runeMap.values());
  }

  /**
   * Read wizard / account hints from a SWEX-style JSON root (field names vary by exporter version).
   * Safe to call on any object; returns null if nothing useful is found.
   */
  function extractSwexSummary(json) {
    if (!json || typeof json !== 'object') return null;
    try {
      const wi = json.wizard_info || json.wizardInfo || json.wizard || {};
      let wizardName =
        wi.wizard_name ?? wi.wizardName ?? wi.name ??
        json.wizard_name ?? json.wizardName ?? '';
      let wizardLevel =
        wi.wizard_level ?? wi.wizardLevel ?? json.wizard_level ?? json.wizardLevel;
      let wizardId =
        wi.wizard_id ?? wi.wizardId ?? json.wizard_id ?? json.wizardId;

      wizardName = String(wizardName || '').trim() || null;
      wizardLevel = wizardLevel != null && wizardLevel !== '' ? Number(wizardLevel) : null;
      if (!Number.isFinite(wizardLevel)) wizardLevel = null;
      wizardId = wizardId != null && wizardId !== '' ? String(wizardId) : null;

      const monsterCount = Array.isArray(json.unit_list) ? json.unit_list.length : null;
      let inventoryRuneCount = null;
      if (Array.isArray(json.runes)) inventoryRuneCount = json.runes.length;
      else if (Array.isArray(json.rune_list)) inventoryRuneCount = json.rune_list.length;

      if (!wizardName && wizardLevel == null && !wizardId && monsterCount == null && inventoryRuneCount == null) {
        return null;
      }
      return { wizardName, wizardLevel, wizardId, monsterCount, inventoryRuneCount };
    } catch (e) {
      return null;
    }
  }

  function logEfficiencyDiagSample(runes, limit) {
    const n = limit != null && limit > 0 ? limit : 40;
    const rows = (runes || []).slice(0, n).map((r) => ({
      id: r.id,
      eff: r.eff,
      effUncapped: calcEfficiencyUncapped(r),
    }));
    if (typeof console !== 'undefined' && console.table) console.table(rows);
    return rows;
  }

  window.SWRM.logEfficiencyDiagSample = logEfficiencyDiagSample;
  window.SWRM.parseRune  = parseRune;
  window.SWRM.parseSWEX  = parseSWEX;
  window.SWRM.calcEfficiency = calcEfficiency;
  window.SWRM.calcEfficiencyUncapped = calcEfficiencyUncapped;
  window.SWRM.extractSwexSummary = extractSwexSummary;
  window.SWRM.countAllSwexRunes = countAllSwexRunes;
})();
