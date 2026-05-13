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
   * God Roll (UI label «High Roll»): any sub >= grade-aware God threshold.
   * Legend uses gradeMod discount before applying godMod.
   */
  function checkHighRoll(rune, stage, settings) {
    const sm = statMap(rune);
    const order = window.SWRM.GOD_STAT_ORDER || [];
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      const threshold = window.SWRM.getGodThreshold?.(stat, settings, rune.gradeStr);
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
    const acc = sm.ACC || 0;
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
    const hpCdA = dr.HP_for_CDmg?.[key];
    const hpCdB = dr.CDmg_for_HP?.[key];
    if (hpCdA != null && hpCdB != null && hp >= hpCdA && cd >= hpCdB) return true;
    const hpAccA = dr.HP_for_ACC?.[key];
    const hpAccB = dr.ACC_for_HP?.[key];
    if (hpAccA != null && hpAccB != null && hp >= hpAccA && acc >= hpAccB) return true;
    const defAccA = dr.DEF_for_ACC?.[key];
    const defAccB = dr.ACC_for_DEF?.[key];
    if (defAccA != null && defAccB != null && def >= defAccA && acc >= defAccB) return true;

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
    if (needHR && !checkHighRoll(rune, stage, settings)) return false;

    return true;
  }

  S.checkHighRoll = checkHighRoll;
  S.checkDuoRoll = checkDuoRoll;
  S.checkRole = checkRole;
})();
