import { describe, it, expect } from 'vitest';
import '../js/engine/engine-depth.js';

describe('Account Depth Engine (engine-depth.js)', () => {
  const { analyzeGameStage, analyzeRosterDepth, getRecommendedStage } = window.SWRM;

  it('handles empty rune list gracefully', () => {
    const res = analyzeGameStage([]);
    expect(res.score).toBe('0.0');
    expect(res.spdDepthCount).toBe(0);
    expect(res.plus15DepthCount).toBe(0);
    expect(res.rosterDepthCount).toBe(0);
    expect(res.runeCount).toBe(0);
  });

  it('calculates Speed Depth correctly', () => {
    const runes = [
      // Qualifying: SPD >= 18 and eff >= 60
      { substats: [{ name: 'SPD', val: 19, grind: 0 }], eff: 75, stars: 6, level: 12 },
      { substats: [{ name: 'SPD', val: 15, grind: 4 }], eff: 80, stars: 6, level: 12 },
      // Not qualifying: SPD < 18
      { substats: [{ name: 'SPD', val: 14, grind: 2 }], eff: 70, stars: 6, level: 12 },
      // Not qualifying: eff < 60
      { substats: [{ name: 'SPD', val: 20, grind: 0 }], eff: 55, stars: 6, level: 12 },
    ];

    const res = analyzeGameStage(runes);
    expect(res.spdDepthCount).toBe(2);
  });

  it('calculates +15 Power Depth correctly', () => {
    const runes = [
      { stars: 6, level: 15, eff: 70, substats: [] },
      { stars: 6, level: 15, eff: 80, substats: [] },
      { stars: 5, level: 15, eff: 65, substats: [] }, // 5 star not counted
      { stars: 6, level: 12, eff: 85, substats: [] }, // +12 not counted
    ];

    const res = analyzeGameStage(runes);
    expect(res.plus15DepthCount).toBe(2);
  });

  it('calculates Roster Depth for built monsters', () => {
    const units = [
      // Built monster: 6★, lvl 40, 6 runes at +15, avg eff >= 60%
      {
        stars: 6,
        level: 40,
        runeSlots: [
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
        ],
      },
      // Not built: level 35
      {
        stars: 6,
        level: 35,
        runeSlots: [
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
        ],
      },
      // Not built: only 5 runes
      {
        stars: 6,
        level: 40,
        runeSlots: [
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
          { rune: { level: 15, eff: 80 } },
        ],
      },
    ];

    const res = analyzeRosterDepth(units);
    expect(res.rosterDepthCount).toBe(1);
    expect(parseFloat(res.rosterPoints)).toBeGreaterThan(0);
  });

  it('combines runes and roster in analyzeGameStage', () => {
    const runes = [
      { substats: [{ name: 'SPD', val: 20, grind: 0 }], eff: 80, stars: 6, level: 15, ingameScore: 90 },
    ];
    const units = [
      {
        stars: 6,
        level: 40,
        runeSlots: Array(6).fill({ rune: { level: 15, eff: 80 } }),
      },
    ];

    const res = analyzeGameStage(runes, units);
    expect(res.spdDepthCount).toBe(1);
    expect(res.plus15DepthCount).toBe(1);
    expect(res.rosterDepthCount).toBe(1);
    expect(parseFloat(res.score)).toBeGreaterThan(0);
  });

  it('recommends stages based on threshold points', () => {
    expect(getRecommendedStage(30)).toBe('Early');
    expect(getRecommendedStage(44.9)).toBe('Early');
    expect(getRecommendedStage(45)).toBe('Mid');
    expect(getRecommendedStage(84.9)).toBe('Mid');
    expect(getRecommendedStage(85)).toBe('Late');
    expect(getRecommendedStage(95)).toBe('Late');
  });
});
