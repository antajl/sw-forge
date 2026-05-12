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
   * God Roll (UI label «High Roll»): любой саб ≥ Base×(1+God_Mod) из settings.godConstants — без стадии.
   */
  function checkHighRoll(rune, stage, settings) {
    const sm = statMap(rune);
    const order = window.SWRM.GOD_STAT_ORDER || [];
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      const threshold = window.SWRM.getGodThreshold?.(stat, settings);
      if (threshold != null && threshold > 0 && (sm[stat] || 0) >= threshold) {
        return true;
      }
    }
    return false;
  }

  function checkDuoRoll(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const dr = settings.duoThresholds;
    const sm = statMap(rune);

    const spd = sm['SPD'] || 0;
    const hp = sm['HP%'] || 0;
    const def = sm['DEF%'] || 0;
    const atk = sm['ATK%'] || 0;
    const cr = sm['CRate'] || 0;
    const cd = sm['CDmg'] || 0;
    const res = sm['RES'] || 0;

    if (spd >= dr.SPD_min[key]) {
      const leg = dr.SPD_partner?.[key];
      const thHp = dr.SPD_partner_HP?.[key] ?? leg;
      const thDef = dr.SPD_partner_DEF?.[key] ?? leg;
      const thAtk = dr.SPD_partner_ATK?.[key] ?? leg;
      const thCr = dr.SPD_partner_CRate?.[key] ?? leg;
      if (
        (thHp != null && hp >= thHp) ||
        (thDef != null && def >= thDef) ||
        (thAtk != null && atk >= thAtk) ||
        (thCr != null && cr >= thCr)
      ) return true;
    }
    if (cr >= dr.CRate_for_CDmg[key] && cd >= dr.CDmg_for_CRate[key]) return true;
    if (cr >= dr.CRate_for_ATK[key] && atk >= dr.ATK_for_CRate[key]) return true;
    if (hp >= dr.HP_for_DEF[key] && def >= dr.DEF_for_HP[key]) return true;
    if (def >= dr.DEF_for_RES[key] && res >= dr.RES_for_DEF[key]) return true;
    if (hp >= dr.HP_for_RES[key] && res >= dr.RES_for_HP[key]) return true;

    return false;
  }

  function checkClassicDPS(rune, stage, settings) {
    const cfg = settings.roles['Classic DPS'];
    if (!cfg) return false;

    const sm = statMap(rune);
    const isLegend = rune.gradeStr === 'Legend';
    const isHero = rune.gradeStr === 'Hero';

    const acceptedMains = cfg.acceptedMains[rune.slot] || [];
    if (acceptedMains.length > 0 && !acceptedMains.includes(rune.mainName)) {
      return false;
    }

    const dpsStats = ['SPD', 'CRate', 'CDmg', 'ATK%'];
    const presentDpsStats = dpsStats.filter(stat => (sm[stat] || 0) > 0);

    /** Qualifying subs only (Sheets parity: innate does not stand in for a rolled sub) */
    const effectiveStats = new Set(presentDpsStats);

    let requiredStats;
    let minStats;

    if ([1, 3, 5].includes(rune.slot)) {
      requiredStats = effectiveStats.has('SPD') && effectiveStats.size >= 3;
      minStats = cfg.minStats['1/3/5'] || 2;
    } else if (rune.slot === 2 && rune.mainName === 'SPD') {
      requiredStats = effectiveStats.has('CRate') && effectiveStats.size >= 2;
      minStats = cfg.minStats['Slot 2'] || 1;
    } else if (rune.slot === 4 && rune.mainName === 'CRate') {
      requiredStats = effectiveStats.has('SPD') && effectiveStats.size >= 2;
      minStats = cfg.minStats['Slot 4'] || 1;
    } else if ([2, 4, 6].includes(rune.slot) && ['ATK%', 'CDmg'].includes(rune.mainName)) {
      requiredStats = effectiveStats.has('SPD') && effectiveStats.has('CRate');
      minStats = cfg.minStats['Slot 6'] || 1;
    } else {
      requiredStats = effectiveStats.size >= (cfg.minStats['1/3/5'] || 2);
      minStats = cfg.minStats['1/3/5'] || 2;
    }

    if (!requiredStats) return false;
    if (effectiveStats.size < minStats) return false;

    const mustHave = cfg.mustHave[stage];
    if (mustHave && !effectiveStats.has(mustHave)) return false;

    if (isHero) {
      const hrKey = `${stage}_Hero`;
      const needHR = cfg.requireHR?.[hrKey];
      if (needHR) {
        const thresholds = settings.hrThresholds;
        let hasAnchor = false;
        for (const stat of effectiveStats) {
          const threshold = thresholds[stat]?.[hrKey];
          if (threshold && (sm[stat] || 0) >= threshold) {
            hasAnchor = true;
            break;
          }
        }
        if (!hasAnchor) return false;
      }
    }

    if (isLegend) {
      const hrKey = `${stage}_Leg`;
      const needHR = cfg.requireHR?.[hrKey];
      if (needHR) {
        const thresholds = settings.hrThresholds;
        let hasAnchor = false;
        for (const stat of effectiveStats) {
          const threshold = thresholds[stat]?.[hrKey];
          if (threshold && (sm[stat] || 0) >= threshold) {
            hasAnchor = true;
            break;
          }
        }
        if (!hasAnchor) return false;
      }
    }

    return true;
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
    if (needHR && !checkHighRoll(rune, stage, settings)) return false;

    return true;
  }

  S.checkHighRoll = checkHighRoll;
  S.checkDuoRoll = checkDuoRoll;
  S.checkClassicDPS = checkClassicDPS;
  S.checkRole = checkRole;
})();
