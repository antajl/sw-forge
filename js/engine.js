// =============================================
// engine.js — Role detection + Verdict
// Mirrors your Google Sheets Engine logic
// =============================================

(function() {

  /**
   * Get the threshold key string for a given stage + grade
   * e.g. "Mid" + "Legend" → "Mid_Leg"
   */
  function modeKey(stage, grade) {
    const g = grade === 'Legend' ? 'Leg' : 'Hero';
    return `${stage}_${g}`;
  }

  /**
   * Build a stat lookup for a rune { statName: value }
   */
  function statMap(rune) {
    const m = {};
    for (const s of rune.substats) {
      m[s.name] = (m[s.name] || 0) + s.val + s.grind;
    }
    return m;
  }

  // ---- HIGH ROLL ----
  function checkHighRoll(rune, stage, settings) {
    const key  = modeKey(stage, rune.gradeStr);
    const th   = settings.hrThresholds;
    const coeff = settings.hrCoeff;
    const sm   = statMap(rune);
    const isLegend = rune.gradeStr === 'Legend';

    // Check if any substat hits the high roll threshold
    let hasHighRoll = false;
    for (const [stat, tvals] of Object.entries(th)) {
      const threshold = tvals[key];
      if (threshold && (sm[stat] || 0) >= threshold) { hasHighRoll = true; break; }
    }
    if (!hasHighRoll) return false;

    // Legend: always pass
    if (isLegend) return true;

    // Hero: require a partner stat at soft threshold
    let softCount = 0;
    for (const [stat, tvals] of Object.entries(th)) {
      const threshold = tvals[key];
      if (threshold && (sm[stat] || 0) >= threshold * coeff) softCount++;
    }
    // softCount >= 2: the main High Roll stat + at least 1 partner
    return softCount >= 2;
  }

  // ---- DUO ROLL ----
  function checkDuoRoll(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const dr  = settings.duoThresholds;
    const sm  = statMap(rune);

    const spd = sm['SPD'] || 0;
    const hp  = sm['HP%'] || 0;
    const def = sm['DEF%'] || 0;
    const atk = sm['ATK%'] || 0;
    const cr  = sm['CRate'] || 0;
    const cd  = sm['CDmg'] || 0;
    const res = sm['RES'] || 0;

    // SPD + any stat
    if (spd >= dr.SPD_min[key]) {
      const p = dr.SPD_partner[key];
      if (hp >= p || def >= p || atk >= p || cr >= p) return true;
    }
    // CRate + CDmg
    if (cr >= dr.CRate_for_CDmg[key] && cd >= dr.CDmg_for_CRate[key]) return true;
    // CRate + ATK%
    if (cr >= dr.CRate_for_ATK[key] && atk >= dr.ATK_for_CRate[key]) return true;
    // HP% + DEF%
    if (hp >= dr.HP_for_DEF[key] && def >= dr.DEF_for_HP[key]) return true;
    // DEF% + RES
    if (def >= dr.DEF_for_RES[key] && res >= dr.RES_for_DEF[key]) return true;
    // HP% + RES
    if (hp >= dr.HP_for_RES[key] && res >= dr.RES_for_HP[key]) return true;

    return false;
  }

  // ---- ROLE FILTER ----
  function checkRole(rune, roleKey, stage, settings) {
    const cfg = settings.roles[roleKey];
    if (!cfg) return false;
    const key = modeKey(stage, rune.gradeStr);
    const sm  = statMap(rune);

    // 1. Check main stat for variable slots (2, 4, 6)
    if ([2, 4, 6].includes(rune.slot)) {
      const accepted = cfg.acceptedMains[rune.slot];
      if (accepted && !accepted.includes(rune.mainName)) return false;
    }

    // 2. Count Include substats present above 0
    const includedStats = Object.entries(cfg.substats)
      .filter(([, v]) => v === 'Include')
      .map(([k]) => k);

    // Exclude stats — if present with value > 0, disqualify
    for (const [stat, inc] of Object.entries(cfg.substats)) {
      if (inc === 'Exclude' && (sm[stat] || 0) > 0) return false;
    }

    // Count how many Include stats the rune has (with any value)
    const foundCount = includedStats.filter(s => (sm[s] || 0) > 0).length;
    const minNeeded  = cfg.minStats[stage] || 1;
    if (foundCount < minNeeded) return false;

    // 3. Must have
    const must = cfg.mustHave[stage];
    if (must && !(sm[must] > 0)) return false;

    // 4. Require High Roll
    const hrKey = `${key}`; // e.g. Mid_Hero
    const needHR = cfg.requireHR?.[hrKey];
    if (needHR && !checkHighRoll(rune, stage, settings)) return false;

    return true;
  }

  // ---- BAD FLAT check ----
  function hasBadFlat(rune) {
    // Flat HP / ATK / DEF as substat on a non-1/3/5 slot = bad
    const badFlatIds = [1, 3, 5]; // HP, ATK, DEF flat
    for (const s of rune.substats) {
      if (badFlatIds.includes(s.type)) return true;
    }
    return false;
  }

  // ---- GRIND POTENTIAL ----
  function checkGrind(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const th  = settings.thresholds;
    // Can any substat that's close to threshold be pushed over by grind?
    const GRIND_GAIN = { SPD:2, 'HP%':3, 'DEF%':3, 'ATK%':3, CRate:2, CDmg:2, ACC:3, RES:3 };

    for (const s of rune.substats) {
      const threshold = th[s.name]?.[key];
      if (!threshold) continue;
      const currentVal = s.val + s.grind;
      const gain = GRIND_GAIN[s.name] || 0;
      if (currentVal < threshold && currentVal + gain >= threshold) {
        return { can: true, stat: s.name, from: currentVal, to: currentVal + gain, need: threshold };
      }
    }
    return { can: false };
  }

  // ---- GEM POTENTIAL ----
  function checkGem(rune, stage, settings) {
    const key = modeKey(stage, rune.gradeStr);
    const th  = settings.thresholds;
    const GRINDABLE = new Set(['SPD', 'HP%', 'ATK%', 'DEF%', 'ACC', 'RES']);
    const statScores = Object.fromEntries(
      Object.entries(th).map(([stat, vals]) => [stat, vals[key] || 0])
    );

    let bestCandidate = null;
    for (const s of rune.substats) {
      if (GRINDABLE.has(s.name)) continue;
      for (const target of GRINDABLE) {
        const score = statScores[target] || 0;
        if (score < 10) continue;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = { can: true, from: s.name, to: target, score };
        }
      }
    }
    return bestCandidate || { can: false };
  }

  function matchReappRule(rune, settings) {
    const rc = settings.reapp || {};
    if (rune.eff > (rc.maxEff ?? 65)) return false;
    if (rc.sets?.length && !rc.sets.includes(rune.setName)) return false;
    if (rc.innateStats?.length && (!rune.innate_name || !rc.innateStats.includes(rune.innate_name))) return false;
    if ([2,4,6].includes(rune.slot)) {
      const allowed = rc.mainBySlot?.[rune.slot] || [];
      if (allowed.length && !allowed.includes(rune.mainName)) return false;
    }
    return true;
  }

  // ---- VERDICT ----
  function getVerdict(rune, stage, settings, roleResult) {
    const hasRole = roleResult !== '';

    // Sell: no role, no High Roll match, no Duo Roll match
    if (!hasRole) return 'Sell';

    // Upgrade: low level rune that could become good
    if (rune.level < 9 && rune.grade === 5 && rune.eff >= 60) return 'Upgrade';

    // Finish: +9 or lower but has a role
    if (rune.level < 12 && hasRole) return 'Finish';

    // Grind
    const grind = checkGrind(rune, stage, settings);
    if (grind.can) return 'Grind';

    // Gem: has a role and can replace weak/non-grindable stat
    const gem = checkGem(rune, stage, settings);
    if (gem.can && rune.level >= 12) return 'Gem';

    // Reapp: low efficiency but still role-eligible
    if (hasRole && matchReappRule(rune, settings)) return 'Reapp';

    return 'Keep';
  }

  // ---- MAIN ENGINE ----
  // Role priority order (highest priority first, same as your Best Role formula)
  const BASE_ROLE_PRIORITY = ['Bruiser', 'Fast Utility', 'Heavy Resist', 'Bomber', 'Classic DPS', 'Slow DPS', 'Duo Roll', 'High Roll'];

  function processRune(rune, stage, settings) {
    // Run all role checks
    const results = {};

    results['High Roll'] = checkHighRoll(rune, stage, settings);
    results['Duo Roll']  = checkDuoRoll(rune, stage, settings);
    for (const role of Object.keys(settings.roles)) {
      results[role] = checkRole(rune, role, stage, settings);
    }

    const dynamicPriority = [
      ...BASE_ROLE_PRIORITY,
      ...Object.keys(settings.roles || {}).filter(r => !BASE_ROLE_PRIORITY.includes(r))
    ];

    // Best role by priority
    let bestRole = '';
    for (const role of dynamicPriority) {
      if (results[role]) { bestRole = role; break; }
    }

    rune.role    = bestRole;
    rune.verdict = getVerdict(rune, stage, settings, bestRole);
    rune.badFlat = hasBadFlat(rune);
    rune.grindInfo = checkGrind(rune, stage, settings);
    rune.gemInfo = checkGem(rune, stage, settings);

    return rune;
  }

  function processAll(runes, stage, settings) {
    return runes.map(r => processRune(r, stage, settings));
  }

  window.SWRM.processAll   = processAll;
  window.SWRM.processRune  = processRune;
  window.SWRM.ROLE_PRIORITY = BASE_ROLE_PRIORITY;
})();
