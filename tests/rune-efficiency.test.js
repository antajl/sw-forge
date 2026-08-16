import { describe, it, expect } from 'vitest';

// SWOP Efficiency calculation logic from parser.js
// This is the actual formula used in SW-Forge

const SUB_MAX = {
  1: 1872,   // HP flat (max substat roll)
  2: 8,      // HP% (max substat roll)
  3: 20,     // ATK flat (max substat roll)
  4: 8,      // ATK% (max substat roll)
  5: 20,     // DEF flat (max substat roll)
  6: 8,      // DEF% (max substat roll)
  8: 6,      // SPD (max substat roll)
  9: 8,      // CRI (max substat roll)
  10: 7,     // CD (max substat roll)
  11: 8,     // RES (max substat roll)
  12: 8,     // ACC (max substat roll)
};

function swopEfficiencyLineTerm(typeId, baseValue) {
  const maxRoll = SUB_MAX[typeId];
  if (!maxRoll) return 0;
  return (Number(baseValue) || 0) / (maxRoll * 5);
}

function calcEfficiencyUncapped(rune) {
  let score = 1.0;
  if (rune.innate_type && SUB_MAX[rune.innate_type]) {
    score += swopEfficiencyLineTerm(rune.innate_type, rune.innate_val);
  }
  for (const s of rune.substats || []) {
    if (s && s.type && SUB_MAX[s.type]) {
      score += swopEfficiencyLineTerm(s.type, s.val);
    }
  }
  return Math.round((score / 2.8) * 100 * 10) / 10;
}

function calcEfficiency(rune) {
  return calcEfficiencyUncapped(rune);
}

describe('SWOP Efficiency Calculations', () => {
  describe('swopEfficiencyLineTerm', () => {
    it('returns 0 for invalid stat types', () => {
      expect(swopEfficiencyLineTerm(99, 10)).toBe(0);
      expect(swopEfficiencyLineTerm(0, 10)).toBe(0);
    });

    it('calculates HP% efficiency term correctly', () => {
      // Max HP% roll is 8, max roll * 5 = 40
      // 8 / 40 = 0.2 (one perfect roll)
      expect(swopEfficiencyLineTerm(2, 8)).toBeCloseTo(0.2, 2);
    });

    it('calculates SPD efficiency term correctly', () => {
      // Max SPD roll is 6, max roll * 5 = 30
      // 6 / 30 = 0.2 (one perfect roll)
      expect(swopEfficiencyLineTerm(8, 6)).toBeCloseTo(0.2, 2);
    });

    it('calculates CRI efficiency term correctly', () => {
      // Max CRI roll is 8, max roll * 5 = 40
      // 8 / 40 = 0.2 (one perfect roll)
      expect(swopEfficiencyLineTerm(9, 8)).toBeCloseTo(0.2, 2);
    });

    it('handles partial rolls', () => {
      // HP% with 4 value (half of max roll)
      // 4 / 40 = 0.1 (half roll)
      expect(swopEfficiencyLineTerm(2, 4)).toBeCloseTo(0.1, 2);
    });
  });

  describe('calcEfficiencyUncapped', () => {
    it('calculates efficiency for rune with no substats', () => {
      const rune = {
        substats: []
      };
      const eff = calcEfficiencyUncapped(rune);
      // Score starts at 1.0, divided by 2.8, times 100
      // 1.0 / 2.8 * 100 = 35.7
      expect(eff).toBeCloseTo(35.7, 1);
    });

    it('calculates efficiency for rune with one perfect substat', () => {
      const rune = {
        substats: [{ type: 2, val: 8 }] // Perfect HP% roll
      };
      const eff = calcEfficiencyUncapped(rune);
      // Score: 1.0 + 0.2 = 1.2
      // 1.2 / 2.8 * 100 = 42.9
      expect(eff).toBeCloseTo(42.9, 1);
    });

    it('calculates efficiency for rune with innate substat', () => {
      const rune = {
        innate_type: 8,
        innate_val: 6, // Perfect SPD roll
        substats: []
      };
      const eff = calcEfficiencyUncapped(rune);
      // Score: 1.0 + 0.2 = 1.2
      // 1.2 / 2.8 * 100 = 42.9
      expect(eff).toBeCloseTo(42.9, 1);
    });

    it('calculates efficiency for rune with multiple substats', () => {
      const rune = {
        substats: [
          { type: 2, val: 8 },  // Perfect HP% roll (0.2)
          { type: 8, val: 6 },  // Perfect SPD roll (0.2)
          { type: 9, val: 8 }   // Perfect CRI roll (0.2)
        ]
      };
      const eff = calcEfficiencyUncapped(rune);
      // Score: 1.0 + 0.2 + 0.2 + 0.2 = 1.6
      // 1.6 / 2.8 * 100 = 57.1
      expect(eff).toBeCloseTo(57.1, 1);
    });

    it('handles runes with perfect rolls in all substats', () => {
      const rune = {
        substats: [
          { type: 2, val: 8 },  // HP% (0.2)
          { type: 4, val: 8 },  // ATK% (0.2)
          { type: 6, val: 8 },  // DEF% (0.2)
          { type: 8, val: 6 }   // SPD (0.2)
        ]
      };
      const eff = calcEfficiencyUncapped(rune);
      // Score: 1.0 + 0.8 = 1.8
      // 1.8 / 2.8 * 100 = 64.3
      expect(eff).toBeCloseTo(64.3, 1);
    });
  });

  describe('calcEfficiency', () => {
    it('returns same value as uncapped calculation', () => {
      const rune = {
        substats: [{ type: 2, val: 8 }]
      };
      expect(calcEfficiency(rune)).toBe(calcEfficiencyUncapped(rune));
    });
  });
});

describe('Substat Max Values', () => {
  it('has defined max values for all stat types', () => {
    expect(SUB_MAX[1]).toBeDefined(); // HP flat
    expect(SUB_MAX[2]).toBeDefined(); // HP%
    expect(SUB_MAX[3]).toBeDefined(); // ATK flat
    expect(SUB_MAX[4]).toBeDefined(); // ATK%
    expect(SUB_MAX[5]).toBeDefined(); // DEF flat
    expect(SUB_MAX[6]).toBeDefined(); // DEF%
    expect(SUB_MAX[8]).toBeDefined(); // SPD
    expect(SUB_MAX[9]).toBeDefined(); // CRI
    expect(SUB_MAX[10]).toBeDefined(); // CD
    expect(SUB_MAX[11]).toBeDefined(); // RES
    expect(SUB_MAX[12]).toBeDefined(); // ACC
  });

  it('has reasonable max values for flat stats', () => {
    expect(SUB_MAX[1]).toBeGreaterThan(1000); // HP flat should be high
    expect(SUB_MAX[3]).toBeGreaterThan(10);  // ATK flat
    expect(SUB_MAX[5]).toBeGreaterThan(10);  // DEF flat
  });

  it('has reasonable max values for percent stats', () => {
    expect(SUB_MAX[2]).toBeLessThan(20); // HP%
    expect(SUB_MAX[4]).toBeLessThan(20); // ATK%
    expect(SUB_MAX[6]).toBeLessThan(20); // DEF%
  });

  it('has reasonable max values for special stats', () => {
    expect(SUB_MAX[8]).toBeLessThan(10);  // SPD
    expect(SUB_MAX[9]).toBeLessThan(20); // CRI
    expect(SUB_MAX[10]).toBeLessThan(20); // CD
    expect(SUB_MAX[11]).toBeLessThan(20); // RES
    expect(SUB_MAX[12]).toBeLessThan(20); // ACC
  });
});
