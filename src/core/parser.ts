// src/core/parser.ts - SWEX JSON parser for runes
// Migrated from js/data/parser.js

import type { Rune, Substat } from '../types/rune';
import type { SwexJson } from '../types/swex';

/**
 * Stat type ID → short name mapping
 */
const STAT_NAMES: Record<number, string> = {
  1: 'HP',
  2: 'HP%',
  3: 'ATK',
  4: 'ATK%',
  5: 'DEF',
  6: 'DEF%',
  8: 'SPD',
  9: 'CRate',
  10: 'CDmg',
  11: 'RES',
  12: 'ACC',
};

/**
 * Grade short names
 */
const GRADE_SHORT: Record<number, string> = {
  1: 'Common',
  2: 'Magic',
  3: 'Rare',
  4: 'Hero',
  5: 'Legend',
};

/**
 * Grade full names
 */
const GRADE_NAMES: Record<number, string> = {
  1: 'Common',
  2: 'Magic',
  3: 'Rare',
  4: 'Hero',
  5: 'Legend',
};

/**
 * Set names mapping
 */
const SET_NAMES: Record<number, string> = {
  1: 'Energy',
  2: 'Guard',
  3: 'Swift',
  4: 'Blade',
  5: 'Rage',
  6: 'Focus',
  7: 'Endure',
  8: 'Fatal',
  10: 'Despair',
  11: 'Vampire',
  13: 'Violent',
  14: 'Nemesis',
  15: 'Will',
  16: 'Shield',
  17: 'Revenge',
  18: 'Destroy',
  19: 'Fight',
  20: 'Determination',
  21: 'Enhance',
  22: 'Accuracy',
  23: 'Tolerance',
  24: 'Speed',
  25: 'Unity',
  28: 'Seal',
  99: 'Fight',
  100: 'Ancient',
  101: 'Immemorial',
  102: 'Taoist',
  103: 'Labyrinth',
  104: 'Dimension',
  105: 'Providence',
  106: 'Recovery',
  107: 'Protect',
  108: 'Intimidate',
  109: 'Spite',
  110: 'Soul',
  111: 'Generosity',
  112: 'Absorption',
  113: 'Jealousy',
  114: 'Rage',
  115: 'Divine',
  116: 'Illusion',
  117: 'Restriction',
  118: 'Elemental',
  119: 'Inspiration',
  120: 'Cruel',
  121: 'Cursed',
  122: 'Adventure',
  123: 'Vampiric',
  124: 'Fierce',
  125: 'Compulsion',
  126: 'Ritual',
  127: 'Cyclic',
  128: 'Penetration',
  129: 'Catastrophe',
  130: 'Arrogance',
  131: 'Devotion',
  132: 'Skill',
  133: 'Obsession',
  134: 'Gallantry',
  135: 'Relic',
  136: 'Thorn',
  137: 'Shield',
  138: 'Merciless',
  139: 'Determination',
  140: 'Vitality',
  141: 'Trace',
  142: 'Revelation',
  143: 'Annihilation',
  144: 'Rage',
  145: 'Suffering',
  146: 'Reap',
  147: 'Samurai',
  148: 'Fire',
  149: 'Ice',
  150: 'Immunity',
  151: 'Tenacity',
  152: 'Freedom',
  153: 'Tranquility',
  154: 'Harmony',
  155: 'Radiance',
  156: 'Tapestry',
  157: 'Dream',
  158: 'Rapture',
  159: 'Paralyze',
  160: 'Stun',
  161: 'Freeze',
  162: 'Sleep',
  163: 'Provocation',
  164: 'Brand',
  165: 'Mystery',
  166: 'Cheer',
  167: 'Blessing',
  168: 'Blight',
  169: 'Dragons',
  170: 'Ruin',
  171: 'Nirvana',
  172: 'Eternity',
  173: 'Liberation',
  174: 'Sagacity',
  175: 'Virtue',
  176: 'Sovereignty',
  177: 'Perseverance',
  178: 'Valor',
  179: 'Wisdom',
  180: 'Glory',
  181: 'Radiance',
  182: 'Bravery',
  183: 'Fortitude',
  184: 'Indomitability',
  185: 'Authority',
  186: 'Ascension',
  187: 'Sanctuary',
  188: 'Omniscience',
  189: 'Omnipotence',
  190: 'Eternity',
  191: 'Immortality',
  192: 'Divinity',
  193: 'Transcendence',
  194: 'Apocalypse',
  195: 'Revelation',
  196: 'Epiphany',
  197: 'Enlightenment',
  198: 'Salvation',
  199: 'Redemption',
  200: 'Ressurection',
  201: 'Rebirth',
  202: 'Renewal',
  203: 'Regeneration',
  204: 'Restoration',
  205: 'Revival',
  206: 'Resurgence',
  207: 'Rejuvenation',
  208: 'Invigoration',
  209: 'Revitalization',
  210: 'Reanimation',
  211: 'Resuscitation',
  212: 'Reconstitution',
  213: 'Reintegration',
  214: 'Reassembly',
  215: 'Reconstruction',
  216: 'Reorganization',
  217: 'Restructuring',
  218: 'Reformation',
  219: 'Revolution',
  220: 'Rebellion',
  221: 'Revolt',
  222: 'Insurrection',
  223: 'Uprising',
  224: 'Mutiny',
  225: 'Sedition',
  226: 'Treason',
  227: 'Betrayal',
  228: 'Perfidy',
  229: 'Treachery',
  230: 'Deceit',
  231: 'Deception',
  232: 'Fraud',
  233: 'Cheating',
  234: 'Dishonesty',
  235: 'Corruption',
  236: 'Degradation',
  237: 'Depravity',
  238: 'Debasement',
  239: 'Debauchery',
  240: 'Depravation',
  241: 'Depravity',
  242: 'Depravation',
  243: 'Depravation',
  244: 'Depravation',
  245: 'Depravation',
  246: 'Depravation',
  247: 'Depravation',
  248: 'Depravation',
  249: 'Depravation',
  250: 'Depravation',
  251: 'Depravation',
  252: 'Depravation',
  253: 'Depravation',
  254: 'Depravation',
  255: 'Depravation',
  256: 'Depravation',
  257: 'Depravation',
  258: 'Depravation',
  259: 'Depravation',
  260: 'Depravation',
  261: 'Depravation',
  262: 'Depravation',
  263: 'Depravation',
  264: 'Depravation',
  265: 'Depravation',
  266: 'Depravation',
  267: 'Depravation',
  268: 'Depravation',
  269: 'Depravation',
  270: 'Depravation',
  271: 'Depravation',
  272: 'Depravation',
  273: 'Depravation',
  274: 'Depravation',
  275: 'Depravation',
  276: 'Depravation',
  277: 'Depravation',
  278: 'Depravation',
  279: 'Depravation',
  280: 'Depravation',
  281: 'Depravation',
  282: 'Depravation',
  283: 'Depravation',
  284: 'Depravation',
  285: 'Depravation',
  286: 'Depravation',
  287: 'Depravation',
  288: 'Depravation',
  289: 'Depravation',
  290: 'Depravation',
  291: 'Depravation',
  292: 'Depravation',
  293: 'Depravation',
  294: 'Depravation',
  295: 'Depravation',
  296: 'Depravation',
  297: 'Depravation',
  298: 'Depravation',
  299: 'Depravation',
  300: 'Depravation',
};

/**
 * Substat max values for efficiency calculation
 */
const SUB_MAX: Record<number, number> = {
  1: 1875,  // HP flat
  2: 8,     // HP%
  3: 100,   // ATK flat
  4: 8,     // ATK%
  5: 100,   // DEF flat
  6: 8,     // DEF%
  8: 6,     // SPD
  9: 6,     // CRate
  10: 7,    // CDmg
  11: 8,    // RES
  12: 8,    // ACC
};

/**
 * Normalize grade/rank from SWEX (handles +10 encoding for ancient runes)
 */
export function normalizeGradeRank(rank: number | string): number {
  const n = Number(rank);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 1 && n <= 5) return n;
  if (n >= 11 && n <= 15) return n - 10;
  const mod = n % 10;
  if (n >= 10 && mod >= 1 && mod <= 5) return mod;
  return n;
}

/**
 * Get stat name from type ID
 */
export function statName(typeId: number): string {
  return STAT_NAMES[typeId] || `s${typeId}`;
}

/**
 * Check if stat type is flat (non-percentage)
 */
export function isFlat(typeId: number): boolean {
  return typeId === 1 || typeId === 3 || typeId === 5;
}

/**
 * Check if main stat is flat based on slot (game rule: 1/3/5 flat, 2/4/6 percent)
 */
export function isMainStatFlat(slotNo: number, typeId: number): boolean {
  const slot = Number(slotNo);
  if (slot === 1 || slot === 3 || slot === 5) return true;
  if (slot === 2 || slot === 4 || slot === 6) return false;
  return isFlat(typeId);
}

/**
 * Calculate SWOP efficiency line term for a stat
 */
export function swopEfficiencyLineTerm(typeId: number, baseValue: number): number {
  const maxRoll = SUB_MAX[typeId];
  if (!maxRoll) return 0;
  return (Number(baseValue) || 0) / (maxRoll * 5);
}

/**
 * Calculate uncapped efficiency (can exceed 100%)
 */
export function calcEfficiencyUncapped(rune: Partial<Rune>): number {
  let score = 1.0;
  
  if (rune.innate_type && SUB_MAX[rune.innate_type]) {
    score += swopEfficiencyLineTerm(rune.innate_type, rune.innate_val || 0);
  }
  
  for (const s of rune.substats || []) {
    if (s && s.type && SUB_MAX[s.type]) {
      score += swopEfficiencyLineTerm(s.type, s.val);
    }
  }
  
  return Math.round((score / 2.8) * 100 * 10) / 10;
}

/**
 * Calculate efficiency (same as uncapped for now)
 */
export function calcEfficiency(rune: Partial<Rune>): number {
  return calcEfficiencyUncapped(rune);
}

/**
 * Parse a single rune from SWEX JSON
 */
export function parseRune(raw: any): Rune {
  const gradeRaw = raw.extra;
  const grade = normalizeGradeRank(gradeRaw);
  const slot = raw.slot_no;
  const setId = raw.set_id;
  const level = raw.upgrade_curr || 0;

  const classRaw = Number(raw.class);
  const rankRaw = Number(raw.rank);
  const isAncient =
    (Number.isFinite(classRaw) && classRaw > 10) ||
    (Number.isFinite(rankRaw) && rankRaw >= 11 && rankRaw <= 15);

  let tierStars = 0;
  if (Number.isFinite(classRaw) && classRaw > 0) {
    tierStars = classRaw > 10 ? classRaw - 10 : classRaw;
  }
  const stars = tierStars > 0 ? tierStars : 6;

  // Main stat
  const mainType = raw.pri_eff ? raw.pri_eff[0] : 0;
  const mainVal = raw.pri_eff ? raw.pri_eff[1] : 0;

  // Innate/prefix stat
  const innType = raw.prefix_eff ? raw.prefix_eff[0] : 0;
  const innVal = raw.prefix_eff ? raw.prefix_eff[1] : 0;

  // Substats
  const substats: Substat[] = (raw.sec_eff || []).map((s: any) => {
    const isObj = s && typeof s === 'object' && !Array.isArray(s);
    const type = isObj ? Number(s.type ?? s.stat_type ?? s.statType ?? 0) : Number(s[0] || 0);
    const val = isObj ? Number(s.value ?? s.val ?? 0) : Number(s[1] || 0);
    
    let grind = 0;
    let procs = 0;
    let gem = 0;
    let enchanted = false;

    if (isObj) {
      grind = Number(s.gvalue ?? s.grind ?? s.grind_value ?? s.grindValue ?? 0);
      procs = Number(s.procs ?? s.proc ?? s.proc_count ?? s.procCount ?? 0);
      gem = Number(s.gem ?? s.gem_value ?? s.gemValue ?? s.enchant_gem ?? 0);
      enchanted = !!(
        s.enchanted === true || s.is_enchanted === true || s.isEnchanted === true ||
        Number(s.enchanted) === 1 ||
        (!Number.isFinite(gem) ? false : gem !== 0)
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
        enchanted = s.length >= 5 && (s[4] === true || s[4] === 1 || s[4] === '1');
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
      name: statName(type),
      val: Number.isFinite(val) ? val : 0,
      gem: Number.isFinite(gem) ? gem : 0,
      grind: Number.isFinite(grind) ? grind : 0,
      procs: Number.isFinite(procs) ? procs : 0,
      enchanted,
      flat: isFlat(type),
      source: 'sub',
    };
  });

  const rune: Rune = {
    _raw: raw,
    id: raw.rune_id,
    slot,
    grade,
    gradeStr: (grade >= 1 && grade <= 5)
      ? (GRADE_SHORT[grade] || GRADE_NAMES[grade] || `r${gradeRaw}`)
      : `r${gradeRaw}`,
    isAncient,
    stars,
    level,
    maxLevel: 15,
    setId,
    setName: SET_NAMES[setId] || `Set${setId}`,
    mainType,
    mainName: statName(mainType),
    mainVal,
    mainFlat: isMainStatFlat(slot, mainType),
    innType,
    innName: innType ? statName(innType) : '',
    innVal,
    innFlat: isFlat(innType),
    substats,
    eff: 0, // Will be calculated
    effUncapped: 0, // Will be calculated
    occupiedType: raw.occupied_type,
    occupiedId: raw.occupied_id,
    meta: {},
  };

  if (raw.occupied_id != null && Number(raw.occupied_id) !== 0) {
    if (rune.meta) {
      rune.meta.equipped_to = Number(raw.occupied_id);
    }
  }

  rune.eff = calcEfficiency(rune);
  rune.effUncapped = calcEfficiencyUncapped(rune);

  return rune;
}

/**
 * Parse main SWEX JSON structure
 */
export function parseSWEX(json: SwexJson): Rune[] {
  const runeMap = new Map<number, Rune>();

  // 1. Inventory runes
  const inv = json.runes || json.rune_list || [];
  for (const r of inv) {
    const rune = parseRune(r);
    if (rune.grade >= 3 && rune.grade <= 5) {
      runeMap.set(rune.id, rune);
    }
  }

  // 2. Equipped runes (inside unit_list)
  const units = json.unit_list || [];
  for (const unit of units) {
    for (const r of (unit.runes || [])) {
      if (!r || !r.rune_id) continue;
      const rune = parseRune(r);
      if (rune.meta) {
        rune.meta.equipped_to = unit.unit_id;
        rune.meta.equipped_name = unit.unit_master_id;
      }
      if (rune.grade >= 3 && rune.grade <= 5) {
        runeMap.set(rune.id, rune);
      }
    }
  }

  return Array.from(runeMap.values());
}

/**
 * Count unique runes in SWEX export
 */
export function countAllSwexRunes(json: SwexJson): number {
  if (!json || typeof json !== 'object') return 0;
  
  const ids = new Set<number>();
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