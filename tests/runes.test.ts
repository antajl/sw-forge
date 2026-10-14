// tests/runes.test.ts - Tests for runes feature modules
import { describe, it, expect } from 'vitest';

import {
  escapeHtml,
  normalizeDbSlot,
  defaultEmptyDbSlotsMeta,
  formatSlotSummaryLine,
  isRuneEquipped,
  type DbSlot,
} from '../src/features/runes';

import {
  getVisibleRunes,
  verdictUiLabel,
  gradeStrForDashboardNav,
} from '../src/features/runes';

import {
  computeRuneTableSummary,
  canonRuneSearchStatKey,
  normalizeRuneSearchText,
  parseRuneSearchQuery,
  runeStatValueLines,
  runeMatchesSearchQuery,
} from '../src/features/runes';

import type { Rune } from '../src/types/rune';

describe('Utils', () => {
  it('should escape HTML', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml(null)).toBe('');
  });

  it('should normalize database slot', () => {
    const slot = normalizeDbSlot({
      id: 1,
      name: 'Test Profile',
      uploadedAt: '2024-01-01',
      active: true,
      wizardName: 'TestWizard',
      wizardLevel: 50,
      monsterCount: 100,
      runeCount: 200,
    });

    expect(slot.id).toBe(1);
    expect(slot.name).toBe('Test Profile');
    expect(slot.active).toBe(true);
    expect(slot.wizardLevel).toBe(50);
    expect(slot.monsterCount).toBe(100);
    expect(slot.runeCount).toBe(200);
  });

  it('should create default empty slots', () => {
    const slots = defaultEmptyDbSlotsMeta();
    expect(slots).toHaveLength(4);
    expect(slots[0].active).toBe(true);
    expect(slots[1].active).toBe(false);
  });

  it('should format slot summary line', () => {
    const slot: DbSlot = {
      id: 1,
      name: 'Test',
      uploadedAt: '2024-01-01',
      active: true,
      wizardName: 'Wizard',
      wizardLevel: 50,
      wizardId: '123',
      monsterCount: 100,
      inventoryRuneCount: 200,
      runeCount: 300,
      demoProfile: false,
    };

    const t = { runesWord: 'runes', monsShort: 'mons', lvAbbr: 'Lv.' };
    const summary = formatSlotSummaryLine(slot, t);
    expect(summary).toContain('Wizard');
    expect(summary).toContain('Lv.50');
    expect(summary).toContain('300');
  });

  it('should check if rune is equipped', () => {
    const rune1: Partial<Rune> = { equipped_to: 123 };
    const rune2: Partial<Rune> = { equipped_to: 0 };
    const rune3: Partial<Rune> = { equipped_name: 456 };
    const rune4: Partial<Rune> = { equipped_name: 0 };

    expect(isRuneEquipped(rune1 as Rune)).toBe(true);
    expect(isRuneEquipped(rune2 as Rune)).toBe(false);
    expect(isRuneEquipped(rune3 as Rune)).toBe(true);
    expect(isRuneEquipped(rune4 as Rune)).toBe(false);
  });
});

describe('Verdict Filters', () => {
  it('should get visible runes', () => {
    const runes: Rune[] = [
      { id: 1, level: 12, grade: 5 } as Rune,
      { id: 2, level: 12, grade: 4 } as Rune,
      { id: 3, level: 10, grade: 5 } as Rune,
    ];

    const visible = getVisibleRunes(runes, { minLevel: 12, gradeMin: 4, gradeMax: 5 });
    expect(visible).toHaveLength(2);
  });

  it('should get verdict UI label', () => {
    const t = { keep: 'Keep', sell: 'Sell', grind: 'Grind' };
    expect(verdictUiLabel(t, 'Keep')).toBe('Keep');
    expect(verdictUiLabel(t, 'Sell')).toBe('Sell');
    expect(verdictUiLabel(t, 'Unknown')).toBe('Unknown');
  });

  it('should get grade string for dashboard nav', () => {
    expect(gradeStrForDashboardNav(5, 5)).toBe('Legend');
    expect(gradeStrForDashboardNav(4, 4)).toBe('Hero');
    expect(gradeStrForDashboardNav(3, 3)).toBe('Rare');
    expect(gradeStrForDashboardNav(4, 5)).toBe('');
  });
});

describe('Table Filters', () => {
  it('should compute rune table summary', () => {
    const runes: Partial<Rune>[] = [
      { isAncient: true, level: 15, grade: 'Legend' as any, verdict: 'Keep', equipped_to: 123 } as unknown as Rune,
      { isAncient: false, level: 12, grade: 'Hero' as any, verdict: 'Sell', equipped_to: 0 } as unknown as Rune,
      { isAncient: false, level: 15, grade: 'Legend' as any, verdict: 'Keep', equipped_to: 0 } as unknown as Rune,
    ];

    const summary = computeRuneTableSummary(runes as Rune[]);
    expect(summary.total).toBe(3);
    expect(summary.ancient).toBe(1);
    expect(summary.equipped).toBe(1);
    expect(summary.inventory).toBe(2);
    expect(summary.plus15).toBe(2);
    expect(summary.keep).toBe(2);
    expect(summary.sell).toBe(1);
  });

  it('should canonicalize search stat key', () => {
    expect(canonRuneSearchStatKey('HP')).toBe('hp');
    expect(canonRuneSearchStatKey('Attack')).toBe('atk');
    expect(canonRuneSearchStatKey('Speed')).toBe('spd');
    expect(canonRuneSearchStatKey('crate')).toBe('crate');
    expect(canonRuneSearchStatKey('unknown')).toBeNull();
  });

  it('should normalize search text', () => {
    expect(normalizeRuneSearchText('HP% +10')).toBe('hp 10');
    expect(normalizeRuneSearchText('Attack[+5]')).toBe('attack');
    expect(normalizeRuneSearchText('')).toBe('');
  });

  it('should parse search query', () => {
    const result = parseRuneSearchQuery('spd 20 hp 5000');
    expect(result.pairs).toHaveLength(2);
    expect(result.pairs[0].stat).toBe('spd');
    expect(result.pairs[0].value).toBe(20);
    expect(result.pairs[1].stat).toBe('hp');
    expect(result.pairs[1].value).toBe(5000);
  });

  it('should get stat value lines from rune', () => {
    const rune: Partial<Rune> = {
      mainName: 'ATK%',
      mainVal: 16,
      innate_name: 'SPD',
      innate_val: 8,
      substats: [
        { name: 'HP%', val: 8, grind: 0 } as any,
        { name: 'DEF%', val: 5, grind: 0 } as any,
      ],
    };

    const lines = runeStatValueLines(rune as unknown as Rune);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some(l => l.key === 'atk')).toBe(true);
  });

  it('should match search query', () => {
    const rune: Partial<Rune> = {
      setName: 'Violent',
      mainName: 'ATK%',
      gradeStr: 'Legend',
      role: 'ATK%',
      verdict: 'Keep',
      substats: [
        { name: 'SPD', val: 8, grind: 0 } as any,
        { name: 'HP%', val: 8, grind: 0 } as any,
      ],
    };

    const tTable = { tableAncientBadge: 'Ancient' };
    expect(runeMatchesSearchQuery(rune as unknown as Rune, 'violent', tTable)).toBe(true);
    expect(runeMatchesSearchQuery(rune as unknown as Rune, 'spd 8', tTable)).toBe(true);
  });
});
