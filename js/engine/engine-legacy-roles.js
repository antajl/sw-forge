// =============================================
// engine-legacy-roles.js — High Roll, Duo Roll, legacy role checks
// Depends on: engine-core.js
// =============================================

(function() {
  const S = window.SWRM;
  const modeKey = S.modeKey;
  function statMap(rune) {
    return S.statMap(rune);
  }

  /**
   * God Roll rescue (UI role label «High Roll»): any sub line (roll + grind) >= God line.
   */
  function checkHighRoll(rune, stage, settings) {
    const subVal = S.subRuneValue || ((s) => (Number(s?.val) || 0) + (Number(s?.grind) || 0));
    const qRow = S.isQualifyingSubstatRow || ((s) => !!s && s.source !== 'innate');
    const ratio = Number(settings?.policy?.godRollMinRatio);
    const minRatio = Number.isFinite(ratio) ? ratio : 1;
    for (const s of rune.substats || []) {
      if (!qRow(s) || !s.name || s.flat) continue;
      const base = window.SWRM.getGodThreshold?.(s.name, settings, rune.gradeStr);
      const threshold = Number.isFinite(Number(base)) ? Number(base) * minRatio : base;
      if (threshold != null && threshold > 0 && subVal(s) >= threshold) return true;
    }
    return false;
  }

  /** Spreadsheet Duo: sums per stat vs K:R lines; any listed pair both pass. */
  function checkDuoRoll(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const dr = settings.duoThresholds;
    if (!dr || typeof dr !== 'object') return false;
    const sm = statMap(rune);

    const ratioCfg = Number(settings?.policy?.duoRollMinRatio);
    const duoRatio = Number.isFinite(ratioCfg) ? ratioCfg : 1;
    const hit = (stat) => {
      const th = dr[stat]?.[key];
      if (th == null || !(th > 0)) return 0;
      return (sm[stat] || 0) >= (th * duoRatio) ? 1 : 0;
    };

    const spd = hit('SPD');
    const hp = hit('HP%');
    const def = hit('DEF%');
    const atk = hit('ATK%');
    const cr = hit('CRate');
    const cd = hit('CDmg');
    const acc = hit('ACC');
    const res = hit('RES');

    const pairs =
      spd * hp + spd * def + spd * atk + spd * cr + spd * cd + spd * acc + spd * res
      + cr * cd + cr * atk
      + hp * def + hp * res + hp * cd + hp * acc
      + def * res + def * acc;

    return pairs >= 1;
  }

  const DUO_NEAR_PAIRS = [
    ['SPD', 'HP%'], ['SPD', 'DEF%'], ['SPD', 'ATK%'], ['SPD', 'CRate'], ['SPD', 'CDmg'], ['SPD', 'ACC'], ['SPD', 'RES'],
    ['CRate', 'CDmg'], ['CRate', 'ATK%'],
    ['HP%', 'DEF%'], ['HP%', 'RES'], ['HP%', 'CDmg'], ['HP%', 'ACC'],
    ['DEF%', 'RES'], ['DEF%', 'ACC'],
  ];

  function duoStatRatio(rune, stage, settings, stat) {
    const key = modeKey(stage, rune.gradeStr);
    const dr = settings.duoThresholds;
    if (!dr || typeof dr !== 'object') return 0;
    const th = dr[stat]?.[key];
    if (th == null || !(th > 0)) return 0;
    const sm = statMap(rune);
    return (sm[stat] || 0) / th;
  }

  /** Duo pair: one stat on line, partner ≥88% of line but below threshold. */
  function checkDuoNearMiss(rune, stage, settings) {
    if (checkDuoRoll(rune, stage, settings)) return false;
    const near = 0.88;
    for (let i = 0; i < DUO_NEAR_PAIRS.length; i++) {
      const a = DUO_NEAR_PAIRS[i][0];
      const b = DUO_NEAR_PAIRS[i][1];
      const ra = duoStatRatio(rune, stage, settings, a);
      const rb = duoStatRatio(rune, stage, settings, b);
      if (ra < near && rb < near) continue;
      if (ra >= 1 && rb >= near && rb < 1) return true;
      if (rb >= 1 && ra >= near && ra < 1) return true;
    }
    return false;
  }

  function checkRole(rune, roleKey, stage, settings) {
    const cfg = settings.roles[roleKey];
    if (!cfg) return false;
    const key = modeKey(stage, rune.gradeStr);
    const sm = statMap(rune);

    if ([2, 4, 6].includes(rune.slot)) {
      const accepted = cfg.acceptedMains[rune.slot];
      if (accepted && !accepted.includes(rune.mainName)) return false;
    }

    const includedStats = Object.entries(cfg.substats)
      .filter(([, v]) => v === 'Include')
      .map(([k]) => k);

    for (const [stat, inc] of Object.entries(cfg.substats)) {
      if (inc === 'Exclude' && (sm[stat] || 0) > 0) return false;
    }

    const foundCount = includedStats.filter(s => (sm[s] || 0) > 0).length;
    const minNeeded = cfg.minStats[stage] || 1;
    if (foundCount < minNeeded) return false;

    const must = cfg.mustHave[stage];
    if (must && !(sm[must] > 0)) return false;

    const hrKey = `${key}`;
    const needHR = cfg.requireHR?.[hrKey];
    if (needHR && !(S.runeHasHrAnchor && S.runeHasHrAnchor(rune, stage, settings))) return false;

    return true;
  }

  S.checkHighRoll = checkHighRoll;
  S.checkDuoRoll = checkDuoRoll;
  S.checkDuoNearMiss = checkDuoNearMiss;
  S.checkRole = checkRole;
})();
