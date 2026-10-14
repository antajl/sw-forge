import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load demo data
const demoPath = path.resolve(process.cwd(), 'data/demo.json');
const demoJson = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));

// Helper to ensure window.SWRM environment has necessary functions loaded
function ensureSwrmLoaded() {
  if (!window.SWRM) window.SWRM = {};
  
  // Load core files if not already populated on window.SWRM
  const loadScript = (fileRelPath) => {
    const fullPath = path.resolve(process.cwd(), fileRelPath);
    const code = fs.readFileSync(fullPath, 'utf-8');
    const fn = new Function('window', code);
    fn(window);
  };

  if (!window.SWRM.GRADE_NAMES) {
    window.SWRM.GRADE_NAMES = { 1: 'Common', 2: 'Magic', 3: 'Rare', 4: 'Hero', 5: 'Legend' };
    window.SWRM.GRADE_SHORT = { 3: 'Rare', 4: 'Hero', 5: 'Legend' };
    window.SWRM.STAT_NAMES = {
      1: 'HP', 2: 'HP%', 3: 'ATK', 4: 'ATK%', 5: 'DEF', 6: 'DEF%',
      8: 'SPD', 9: 'CRate', 10: 'CDmg', 11: 'RES', 12: 'ACC'
    };
    window.SWRM.SET_NAMES = {
      1: 'Energy', 2: 'Guard', 3: 'Swift', 4: 'Blade', 5: 'Rage', 6: 'Focus',
      7: 'Endure', 8: 'Fatal', 10: 'Despair', 11: 'Vampire', 13: 'Violent', 14: 'Nemesis',
      15: 'Will', 16: 'Shield', 17: 'Revenge', 18: 'Destroy', 19: 'Fight', 20: 'Determination',
      21: 'Enhance', 22: 'Accuracy', 23: 'Tolerance', 24: 'Seal', 25: 'Intangible'
    };
  }
  if (!window.SWRM.parseRune) {
    loadScript('js/data/parser.js');
  }
  if (!window.SWRM.parseAccountGear) {
    loadScript('js/data/relics/effects.js');
    loadScript('js/data/artifacts/effects.js');
    loadScript('js/data/gear/parse.js');
  }
  if (!window.SWRM.computeActiveSetBonusesFromRunes) {
    loadScript('js/features/monsters/monsters-stats-calc.js');
  }
  if (!window.SWRM.computeActiveSetBonuses) {
    loadScript('js/features/monsters/monsters-runes.js');
  }
}

describe('Game Data & Engine Sync Suite (Branch 4)', () => {
  ensureSwrmLoaded();

  describe('Real SWEX Dump Parsing (demo.json)', () => {
    it('successfully extracts summary from real SWEX data', () => {
      const summary = window.SWRM.extractSwexSummary(demoJson);
      expect(summary).not.toBeNull();
      expect(summary.wizardName).toBe(demoJson.wizard_info.wizard_name);
      expect(summary.wizardLevel).toBe(demoJson.wizard_info.wizard_level);
      expect(summary.wizardId).toBe(String(demoJson.wizard_info.wizard_id));
      expect(summary.monsterCount).toBe(demoJson.unit_list.length);
      expect(summary.inventoryRuneCount).toBe(demoJson.runes.length);
    });

    it('counts all runes accurately across inventory and equipped', () => {
      const totalCount = window.SWRM.countAllSwexRunes(demoJson);
      expect(totalCount).toBeGreaterThan(500);
      expect(totalCount).toBeLessThan(1000);
    });

    it('parses real runes and filters valid grades', () => {
      const parsedRunes = window.SWRM.parseSWEX(demoJson);
      expect(parsedRunes.length).toBeGreaterThan(0);
      for (const r of parsedRunes) {
        expect(r.id).toBeDefined();
        expect(r.slot).toBeGreaterThanOrEqual(1);
        expect(r.slot).toBeLessThanOrEqual(6);
        expect(r.grade).toBeGreaterThanOrEqual(3);
        expect(r.grade).toBeLessThanOrEqual(5);
        expect(r.setName).toBeDefined();
      }
    });

    it('parses real gear (artifacts and relics) with verified categories', () => {
      const gear = window.SWRM.parseAccountGear(demoJson);
      expect(gear.artifacts.length).toBeGreaterThan(700);
      expect(gear.relics.length).toBe(5);

      // Verify that confirmed relics (type 6, 12, 13, 14, 16) have categoryVerified = true
      for (const relic of gear.relics) {
        expect(relic.kind).toBe('relic');
        expect([6, 12, 13, 14, 16]).toContain(relic.relicType);
        expect(relic.categoryVerified).toBe(true);
        expect(relic.category).toBeTruthy();
      }
    });

    it('parses real units and assigns gear & rune slots', () => {
      const units = window.SWRM.parseUnits(demoJson);
      expect(units.length).toBe(demoJson.unit_list.length);
      const equippedUnits = units.filter(u => u.equippedCount > 0);
      expect(equippedUnits.length).toBeGreaterThan(0);

      for (const u of units) {
        expect(u.unitId).toBeDefined();
        expect(u.masterId).toBeDefined();
        expect(u.stats).toBeDefined();
        expect(u.stats.spd).toBeGreaterThan(0);
        expect(u.runeSlots).toHaveLength(6);
      }
    });
  });

  describe('Rune Set Mechanics & Calculations', () => {
    const { computeActiveSetBonusesFromRunes, sumSetBonusesForKey, calculateTotalStatForKey, RUNE_SET_PANEL_BONUSES } = window.SWRM;

    it('verifies panel bonus table correctness against Summoners War rules', () => {
      expect(RUNE_SET_PANEL_BONUSES.Swift.spdPct).toBe(25);
      expect(RUNE_SET_PANEL_BONUSES.Despair).toBeUndefined();
      expect(RUNE_SET_PANEL_BONUSES.Vampire).toBeUndefined();
      expect(RUNE_SET_PANEL_BONUSES.Accuracy.accPct).toBe(10);
      expect(RUNE_SET_PANEL_BONUSES.Tolerance.resPct).toBe(10);
      expect(RUNE_SET_PANEL_BONUSES.Blade.critRatePct).toBe(12);
      expect(RUNE_SET_PANEL_BONUSES.Energy.hpPct).toBe(15);
      expect(RUNE_SET_PANEL_BONUSES.Fatal.atkPct).toBe(35);
      expect(RUNE_SET_PANEL_BONUSES.Rage.critDmgPct).toBe(40);
    });

    it('calculates Swift set bonus as 25% of base speed', () => {
      const swiftRunes = [
        { setName: 'Swift' }, { setName: 'Swift' }, { setName: 'Swift' }, { setName: 'Swift' }
      ];
      // Base 100: +25% = 125
      expect(calculateTotalStatForKey(100, swiftRunes, 'spd')).toBe(125);
      // Base 120: +25% = 150
      expect(calculateTotalStatForKey(120, swiftRunes, 'spd')).toBe(150);
      // Base 111: +25% = 27.75 -> floor(111 + 27.75) = 138
      expect(calculateTotalStatForKey(111, swiftRunes, 'spd')).toBe(138);
    });

    it('stacks multiple identical 2-piece sets correctly', () => {
      const threeBladeSets = [
        { setName: 'Blade' }, { setName: 'Blade' },
        { setName: 'Blade' }, { setName: 'Blade' },
        { setName: 'Blade' }, { setName: 'Blade' }
      ];
      const bladeBonuses = sumSetBonusesForKey('critRate', threeBladeSets);
      expect(bladeBonuses.pct).toBe(36); // 12% * 3

      const twoEnergySets = [
        { setName: 'Energy' }, { setName: 'Energy' },
        { setName: 'Energy' }, { setName: 'Energy' }
      ];
      const energyBonuses = sumSetBonusesForKey('hp', twoEnergySets);
      expect(energyBonuses.pct).toBe(30); // 15% * 2
    });

    it('completes 4-piece set using Intangible wildcard', () => {
      const runes = [
        { setName: 'Swift' }, { setName: 'Swift' }, { setName: 'Swift' },
        { setName: 'Intangible' },
        { setName: 'Will' }, { setName: 'Will' }
      ];
      const activeSets = computeActiveSetBonusesFromRunes(runes);
      expect(activeSets).toHaveLength(2);
      expect(activeSets.find(s => s.name === 'Swift')?.pieces).toBe(4);
      expect(activeSets.find(s => s.name === 'Will')?.pieces).toBe(2);
    });

    it('completes 2-piece set using Intangible wildcard when no 4-piece needs it', () => {
      const runes = [
        { setName: 'Fatal' }, { setName: 'Fatal' }, { setName: 'Fatal' }, { setName: 'Fatal' },
        { setName: 'Blade' },
        { setName: 'Intangible' }
      ];
      const activeSets = computeActiveSetBonusesFromRunes(runes);
      expect(activeSets).toHaveLength(2);
      expect(activeSets.find(s => s.name === 'Fatal')?.pieces).toBe(4);
      expect(activeSets.find(s => s.name === 'Blade')?.pieces).toBe(2);
    });

    it('prioritizes 4-piece completion over 2-piece completion with Intangible', () => {
      const runes = [
        { setName: 'Violent' }, { setName: 'Violent' }, { setName: 'Violent' },
        { setName: 'Will' },
        { setName: 'Intangible' }
      ];
      const activeSets = computeActiveSetBonusesFromRunes(runes);
      expect(activeSets).toHaveLength(1);
      expect(activeSets[0].name).toBe('Violent');
      expect(activeSets[0].pieces).toBe(4);
    });

    it('does not activate incomplete sets', () => {
      const incomplete = [
        { setName: 'Swift' }, { setName: 'Swift' },
        { setName: 'Energy' }
      ];
      const activeSets = computeActiveSetBonusesFromRunes(incomplete);
      expect(activeSets).toHaveLength(0);
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('handles null, undefined, or empty payload in parseSWEX without throwing', () => {
      expect(window.SWRM.parseSWEX(null)).toEqual([]);
      expect(window.SWRM.parseSWEX(undefined)).toEqual([]);
      expect(window.SWRM.parseSWEX({})).toEqual([]);
      expect(window.SWRM.parseSWEX({ runes: null, unit_list: null })).toEqual([]);
      expect(window.SWRM.parseSWEX({ runes: [null, undefined, {}] })).toEqual([]);
    });

    it('falls back to raw.rank when raw.extra is missing or zero', () => {
      const rawRuneNoExtra = {
        rune_id: 99901,
        slot_no: 1,
        rank: 5,
        class: 6,
        set_id: 1,
        upgrade_curr: 12,
        pri_eff: [3, 100],
        sec_eff: []
      };
      const rune = window.SWRM.parseRune(rawRuneNoExtra);
      expect(rune.grade).toBe(5);
      expect(rune.gradeStr).toBe('Legend');
    });

    it('identifies Ancient runes accurately from class and rank', () => {
      const ancientRune = {
        rune_id: 99902,
        slot_no: 2,
        rank: 15,
        class: 16,
        set_id: 3,
        upgrade_curr: 15,
        pri_eff: [8, 42],
        sec_eff: []
      };
      const rune = window.SWRM.parseRune(ancientRune);
      expect(rune.isAncient).toBe(true);
      expect(rune.stars).toBe(6);
      expect(rune.grade).toBe(5);
    });
  });
});
