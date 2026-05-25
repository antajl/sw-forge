(function() {
  'use strict';

  function mkRune(id, cfg) {
    return {
      id,
      slot: cfg.slot,
      gradeStr: cfg.gradeStr,
      level: cfg.level,
      setName: cfg.setName,
      mainName: cfg.mainName || 'ATK%',
      eff: Number.isFinite(cfg.eff) ? cfg.eff : 50,
      substats: (cfg.substats || []).map((s) => ({
        name: s.name,
        type: s.type || 0,
        val: s.val || 0,
        grind: s.grind || 0,
        gem: s.gem || 0,
        enchanted: !!s.enchanted,
        source: 'sub',
      })),
    };
  }

  function buildTests() {
    return [
      {
        id: 1,
        rune: mkRune(1, {
          setName: 'Focus',
          gradeStr: 'Legend',
          slot: 2,
          mainName: 'DEF%',
          level: 12,
          substats: [
            { name: 'CDmg', val: 12 },
            { name: 'SPD', val: 12 },
            { name: 'CRate', val: 5 },
            { name: 'ATK%', val: 19 },
          ],
        }),
        expected: 'Keep',
      },
      {
        id: 2,
        rune: mkRune(2, {
          setName: 'Rage',
          gradeStr: 'Hero',
          slot: 5,
          mainName: 'HP',
          level: 12,
          substats: [
            { name: 'ACC', val: 5 },
            { name: 'CDmg', val: 11 },
            { name: 'ATK%', val: 21 },
            { name: 'HP%', val: 11 },
          ],
        }),
        expected: 'Grind',
      },
      {
        id: 3,
        rune: mkRune(3, {
          setName: 'Vampire',
          gradeStr: 'Legend',
          slot: 1,
          mainName: 'ATK',
          level: 12,
          substats: [
            { name: 'CDmg', val: 9 },
            { name: 'RES', val: 16 },
            { name: 'SPD', val: 12 },
            { name: 'ACC', val: 13 },
          ],
        }),
        expected: 'Sell',
      },
      {
        id: 4,
        rune: mkRune(4, {
          setName: 'Determination',
          gradeStr: 'Legend',
          slot: 3,
          mainName: 'ATK',
          level: 12,
          substats: [
            { name: 'ATK', val: 36 },
            { name: 'CDmg', val: 20 },
            { name: 'HP%', val: 25 },
            { name: 'RES', val: 6 },
          ],
        }),
        expected: 'Keep',
      },
      {
        id: 5,
        rune: mkRune(5, {
          setName: 'Blade',
          gradeStr: 'Hero',
          slot: 5,
          mainName: 'HP',
          level: 12,
          substats: [
            { name: 'DEF', val: 7 },
            { name: 'HP%', val: 20 },
            { name: 'ACC', val: 15 },
            { name: 'ATK%', val: 13 },
          ],
        }),
        expected: 'Keep',
      },
      {
        id: 6,
        rune: mkRune(6, {
          setName: 'Violent',
          gradeStr: 'Rare',
          slot: 5,
          mainName: 'HP',
          level: 15,
          substats: [
            { name: 'CRate', val: 7 },
            { name: 'SPD', val: 17 },
            { name: 'ATK%', val: 11 },
            { name: 'DEF%', val: 13 },
          ],
        }),
        expected: 'Keep',
      },
      {
        id: 7,
        rune: mkRune(7, {
          setName: 'Despair',
          gradeStr: 'Rare',
          slot: 3,
          mainName: 'ATK',
          level: 12,
          substats: [
            { name: 'HP%', val: 26 },
            { name: 'DEF%', val: 9 },
            { name: 'CRate', val: 5 },
            { name: 'SPD', val: 9 },
          ],
        }),
        expected: 'Keep',
      },
      {
        id: 8,
        rune: mkRune(8, {
          setName: 'Revenge',
          gradeStr: 'Rare',
          slot: 3,
          mainName: 'ATK',
          level: 12,
          substats: [
            { name: 'SPD', val: 6 },
            { name: 'CRate', val: 15 },
            { name: 'DEF%', val: 7 },
            { name: 'HP%', val: 13 },
          ],
        }),
        expected: 'Keep',
      },
      {
        id: 9,
        rune: mkRune(9, {
          setName: 'Guard',
          gradeStr: 'Legend',
          slot: 6,
          mainName: 'ATK%',
          level: 15,
          substats: [
            { name: 'SPD', val: 9 },
            { name: 'HP%', val: 13 },
            { name: 'DEF%', val: 13 },
            { name: 'CDmg', val: 17 },
          ],
        }),
        expected: 'Sell',
      },
      {
        id: 10,
        rune: mkRune(10, {
          setName: 'Endure',
          gradeStr: 'Hero',
          slot: 2,
          mainName: 'HP%',
          level: 15,
          substats: [
            { name: 'ACC', val: 14 },
            { name: 'CRate', val: 6 },
            { name: 'RES', val: 18 },
            { name: 'ATK%', val: 15 },
          ],
        }),
        expected: 'Sell',
      },
      {
        id: 11,
        rune: mkRune(11, {
          setName: 'Energy',
          gradeStr: 'Hero',
          slot: 1,
          mainName: 'HP',
          level: 6,
          substats: [
            { name: 'HP', val: 300 },
            { name: 'DEF', val: 10 },
            { name: 'ATK', val: 10 },
          ],
        }),
        expected: 'Upgrade',
      },
      {
        id: 12,
        rune: mkRune(12, {
          setName: 'Energy',
          gradeStr: 'Hero',
          slot: 1,
          mainName: 'HP',
          level: 10,
          substats: [
            { name: 'ACC', val: 4 },
            { name: 'RES', val: 4 },
            { name: 'HP', val: 50 },
          ],
        }),
        expected: 'Sell',
      },
      {
        id: 13,
        rune: mkRune(13, {
          setName: 'Energy',
          gradeStr: 'Legend',
          slot: 2,
          mainName: 'SPD',
          level: 12,
          substats: [
            { name: 'SPD', val: 28 },
            { name: 'ATK%', val: 20 },
            { name: 'CRate', val: 20 },
            { name: 'CDmg', val: 20 },
          ],
        }),
        expected: 'Keep',
      },
    ];
  }

  function runSelfTests(options) {
    const S = window.SWRM || {};
    const stage = (options && options.stage) || 'Mid';
    const settings = (options && options.settings) || S.settings;
    const tests = buildTests();
    const inputRunes = tests.map((t) => t.rune);
    const processed = S.processAll(inputRunes, stage, settings);
    const byId = new Map(processed.map((r) => [r.id, r]));
    const rows = [];
    let passCount = 0;
    let failCount = 0;
    for (const t of tests) {
      const r = byId.get(t.id);
      const actual = r?.verdict || '—';
      const pass = actual === t.expected;
      if (pass) passCount++;
      else failCount++;
      const grindToGod = S.checkGrindToGod ? S.checkGrindToGod(r, settings) : { can: false };
      rows.push({
        id: t.id,
        expected: t.expected,
        actual,
        pass,
        role: r?.role || '',
        highRoll: !!r?.formulaResults?.['High Roll'],
        duoRoll: !!r?.formulaResults?.['Duo Roll'],
        grindToGod: !!grindToGod?.can,
        grindToGodStat: grindToGod?.stat || '',
      });
      if (!pass) {
        const sm = typeof S.statMap === 'function' ? S.statMap(r) : {};
        const god = {};
        ['SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'].forEach((k) => {
          god[k] = Number(S.getGodThreshold?.(k, settings, r.gradeStr) || 0).toFixed(2);
        });
        console.group(`[SELF-TEST FAIL] rune #${t.id}`);
        console.log('Expected:', t.expected, 'Actual:', actual);
        console.log('Role:', r?.role || '—', 'Set:', r?.setName, 'Grade:', r?.gradeStr);
        console.log('Substat map:', sm);
        console.log('God thresholds:', god);
        console.log('Duo:', !!r?.formulaResults?.['Duo Roll'], 'High:', !!r?.formulaResults?.['High Roll']);
        console.log('GrindToGod:', grindToGod);
        console.groupEnd();
      }
    }
    const summary = { stage, total: tests.length, passCount, failCount, rows };
    if (console.table) console.table(rows);
    console.log(`[SELF-TEST] stage=${stage} total=${tests.length} pass=${passCount} fail=${failCount}`);
    return summary;
  }

  /** Community reference rune → in-game Score 132 (see ingame-score.js). */
  function runIngameScoreSelfTest() {
    const calc = window.SWRM && window.SWRM.calcIngameScore;
    if (typeof calc !== 'function') {
      console.warn('[INGAME-SCORE-TEST] calcIngameScore not loaded');
      return { ok: false, score: null, expected: 132 };
    }
    const rune = {
      innate_type: 4,
      innate_name: 'ATK%',
      innate_val: 4,
      substats: [
        { type: 8, name: 'SPD', val: 18, grind: 0, gem: 0, source: 'sub' },
        { type: 2, name: 'HP%', val: 15, grind: 0, gem: 0, source: 'sub' },
        { type: 9, name: 'CRate', val: 6, grind: 0, gem: 0, source: 'sub' },
        { type: 1, name: 'HP', val: 250, grind: 0, gem: 0, source: 'sub' },
      ],
    };
    const score = calc(rune);
    const ok = score === 132;
    const breakdown =
      typeof window.SWRM.ingameScoreBreakdown === 'function'
        ? window.SWRM.ingameScoreBreakdown(rune)
        : [];
    console.log(`[INGAME-SCORE-TEST] score=${score} expected=132 ${ok ? 'PASS' : 'FAIL'}`);
    if (breakdown.length) console.log(breakdown.join('\n'));
    return { ok, score, expected: 132, breakdown };
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.runSelfTests = runSelfTests;
  window.SWRM.runIngameScoreSelfTest = runIngameScoreSelfTest;
})();
