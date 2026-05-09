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
    const sm   = statMap(rune);
    const isLegend = rune.gradeStr === 'Legend';

    // Check if any substat hits the high roll threshold
    for (const [stat, tvals] of Object.entries(th)) {
      const threshold = tvals[key];
      if (threshold && (sm[stat] || 0) >= threshold) {
        // Found one high roll stat - that's enough
        return true;
      }
    }
    
    return false;
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

  // ---- CLASSIC DPS ----
  function checkClassicDPS(rune, stage, settings) {
    const cfg = settings.roles['Classic DPS'];
    if (!cfg) return false;
    
    const sm = statMap(rune);
    const isLegend = rune.gradeStr === 'Legend';
    const isHero = rune.gradeStr === 'Hero';
    
    // Check if main stat is accepted for this slot
    const acceptedMains = cfg.acceptedMains[rune.slot] || [];
    if (acceptedMains.length > 0 && !acceptedMains.includes(rune.mainName)) {
      return false;
    }
    
    // Count DPS stats present
    const dpsStats = ['SPD', 'CRate', 'CDmg', 'ATK%'];
    const presentDpsStats = dpsStats.filter(stat => (sm[stat] || 0) > 0);
    
    // Include innate stat in calculations
    let effectiveStats = new Set(presentDpsStats);
    if (rune.innate_name && dpsStats.includes(rune.innate_name)) {
      effectiveStats.add(rune.innate_name);
    }
    
    // Slot logic from description
    let requiredStats;
    let minStats;
    
    if ([1, 3, 5].includes(rune.slot)) {
      // Slots 1/3/5: SPD + 2+ DPS stats
      requiredStats = effectiveStats.has('SPD') && effectiveStats.size >= 3;
      minStats = cfg.minStats['1/3/5'] || 2;
    } else if (rune.slot === 2 && rune.mainName === 'SPD') {
      // Slot 2 with SPD main: CRate + 1+ DPS stat
      requiredStats = effectiveStats.has('CRate') && effectiveStats.size >= 2;
      minStats = cfg.minStats['Slot 2'] || 1;
    } else if (rune.slot === 4 && rune.mainName === 'CRate') {
      // Slot 4 with CRate main: SPD + 1+ DPS stat
      requiredStats = effectiveStats.has('SPD') && effectiveStats.size >= 2;
      minStats = cfg.minStats['Slot 4'] || 1;
    } else if ([2, 4, 6].includes(rune.slot) && ['ATK%', 'CDmg'].includes(rune.mainName)) {
      // Slots 2/4/6 with ATK%/CDmg main: SPD + CRate
      requiredStats = effectiveStats.has('SPD') && effectiveStats.has('CRate');
      minStats = cfg.minStats['Slot 6'] || 1;
    } else {
      // Other slots: general logic
      requiredStats = effectiveStats.size >= (cfg.minStats['1/3/5'] || 2);
      minStats = cfg.minStats['1/3/5'] || 2;
    }
    
    if (!requiredStats) return false;
    
    // Check minimum stats requirement
    if (effectiveStats.size < minStats) return false;
    
    // Must have requirement
    const mustHave = cfg.mustHave[stage];
    if (mustHave && !effectiveStats.has(mustHave)) return false;
    
    // Hero anchor requirement
    if (isHero) {
      const hrKey = `${stage}_Hero`;
      const needHR = cfg.requireHR?.[hrKey];
      if (needHR) {
        // At least one DPS stat must reach Hero High Roll threshold
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
    
    // Legend anchor requirement (if configured)
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
  function hasBadFlat(rune, stage) {
    // Flat HP / ATK / DEF substats worth replacing with a gem
    // Early/Mid: 2+ flats. Late: 1+ flat
    // Only counts clean flats — no rolls (ATK/DEF ≤20, HP ≤200), no gem, no grind
    const flatIds = [1, 3, 5]; // HP, ATK, DEF flat
    const flatThresholds = { 1: 200, 3: 20, 5: 20 }; // HP, ATK, DEF
    
    let cleanFlatCount = 0;
    for (const s of rune.substats) {
      if (flatIds.includes(s.type)) {
        const threshold = flatThresholds[s.type];
        // Check if it's a clean flat (below base threshold = not rolled)
        if (s.val <= threshold && s.grind === 0) {
          cleanFlatCount++;
        }
      }
    }
    
    const requiredFlats = stage === 'Late' ? 1 : 2;
    return cleanFlatCount >= requiredFlats;
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
        // Much higher threshold for gem consideration
        if (score < 15) continue;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = { can: true, from: s.name, to: target, score };
        }
      }
    }
    return bestCandidate || { can: false };
  }

  function matchReappRule(rune, settings) {
    // Legend only
    if (rune.gradeStr !== 'Legend') return false;
    
    const rc = settings.reapp || {};
    if (rune.eff > (rc.maxEff ?? 65)) return false;
    
    // Meta sets only
    if (rc.sets?.length && !rc.sets.includes(rune.setName)) return false;
    
    // Exclude flat innate stats (ATK/DEF/HP) that would permanently limit the rune's potential
    if (rune.innate_name && ['ATK', 'DEF', 'HP'].includes(rune.innate_name)) return false;
    
    // Valuable main stats only
    if ([2,4,6].includes(rune.slot)) {
      const allowed = rc.mainBySlot?.[rune.slot] || [];
      if (allowed.length && !allowed.includes(rune.mainName)) return false;
    }
    
    return true;
  }

  // ---- VERDICT ----
  function getVerdict(rune, stage, settings, roleResult) {
    const hasRole = roleResult !== '';
    const isHero = rune.gradeStr === 'Hero';
    const isLegend = rune.gradeStr === 'Legend';
    const hasHighDuo = roleResult === 'High Roll' || roleResult === 'Duo Roll';
    
    // Priority order: Upgrade → Finish → Reapp → (Gem if Flat) → (Keep, or Grind if Keep-worthy) → Sell
    
    // 1. Upgrade: below +9, power up first
    if (rune.level < 9) {
      return 'Upgrade';
    }
    
    // 2. Finish: +9 with potential, take to +12
    if (rune.level < 12 && hasRole) {
      // Check efficiency thresholds for Hero without High Roll/Duo Roll
      if (isHero && !hasHighDuo) {
        const effThreshold = stage === 'Late' ? 85 : (stage === 'Mid' ? 85 : 65);
        if (rune.eff < effThreshold) return 'Sell';
      }
      return 'Finish';
    }
    
    // 3. Reapp: Legend with good set/main, bad subs (skipped if any other filter matched)
    if (hasRole && isLegend && matchReappRule(rune, settings)) {
      // Only Reapp if no other role matched (but we have hasRole = true, so this needs refinement)
      // For now, check if this is ONLY a Reapp candidate
      if (roleResult === 'Classic DPS' || roleResult === 'Slow DPS' || roleResult === 'Bomber' || 
          roleResult === 'Bruiser' || roleResult === 'Fast Utility' || roleResult === 'Heavy Resist') {
        // Has other roles, don't Reapp
      } else {
        return 'Reapp';
      }
    }
    
    // 4. Gem: good but has a flat stat to replace
    if (hasRole && hasBadFlat(rune, stage)) {
      const gem = checkGem(rune, stage, settings);
      if (gem.can) {
        // Check if rune is strong enough for Gem
        const effThreshold = stage === 'Late' ? 70 : (stage === 'Mid' ? 55 : 40);
        if (rune.eff >= effThreshold) {
          // Additional check for Hero without High Roll/Duo Roll
          if (isHero && !hasHighDuo) {
            const heroEffThreshold = stage === 'Late' ? 82 : (stage === 'Mid' ? 67 : 52);
            if (rune.eff < heroEffThreshold) return 'Sell';
          }
          return 'Gem';
        } else {
          return 'Sell';
        }
      }
    }
    
    // 5. Check if rune qualifies for Keep at all
    if (!hasRole) {
      // No role matching - check efficiency thresholds
      const effThreshold = stage === 'Late' ? 65 : (stage === 'Mid' ? 50 : 35);
      if (isHero && !hasHighDuo) {
        const heroEffThreshold = stage === 'Late' ? 80 : (stage === 'Mid' ? 65 : 50);
        if (rune.eff < heroEffThreshold) return 'Sell';
      } else if (rune.eff < effThreshold) {
        return 'Sell';
      } else {
        return 'Sell'; // No role but meets efficiency - still Sell per logic
      }
    }
    
    // 6. Grind: Keep-quality, one grindstone from High Roll
    const grind = checkGrind(rune, stage, settings);
    if (grind.can) {
      return 'Grind';
    }
    
    // 7. Keep: strong stats, ready to equip
    return 'Keep';
  }

  // ---- MAIN ENGINE ----
  // Role priority order (highest priority first, same as your Best Role formula)
  const BASE_ROLE_PRIORITY = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Duo Roll', 'High Roll'];

  function processRune(rune, stage, settings) {
    // Run all role checks
    const results = {};

    results['High Roll'] = checkHighRoll(rune, stage, settings);
    results['Duo Roll']  = checkDuoRoll(rune, stage, settings);
    results['Classic DPS'] = checkClassicDPS(rune, stage, settings);
    
    for (const role of Object.keys(settings.roles)) {
      if (role === 'Classic DPS') continue; // Skip since we handle it above
      results[role] = checkRole(rune, role, stage, settings);
    }

    // Run advanced formula checks
    const advancedResults = window.SWRM.processAdvancedFormulas?.(rune, stage, settings) || {};
    
    // Merge results - advanced formulas take priority
    const mergedResults = { ...results, ...advancedResults };

    const dynamicPriority = [
      ...BASE_ROLE_PRIORITY,
      ...Object.keys(settings.roles || {}).filter(r => !BASE_ROLE_PRIORITY.includes(r)),
      ...Object.keys(settings.formulas || {}).filter(f => !BASE_ROLE_PRIORITY.includes(f))
    ];

    // Best role by priority
    let bestRole = '';
    for (const role of dynamicPriority) {
      if (mergedResults[role]) { bestRole = role; break; }
    }

    rune.role    = bestRole;
    rune.verdict = window.SWRM.getAdvancedVerdict?.(rune, stage, settings, mergedResults) || 
                   getVerdict(rune, stage, settings, bestRole);
    rune.badFlat = hasBadFlat(rune, stage);
    rune.grindInfo = checkGrind(rune, stage, settings);
    rune.gemInfo = checkGem(rune, stage, settings);
    rune.formulaResults = mergedResults; // Store all formula results for debugging

    return rune;
  }

  function processAll(runes, stage, settings) {
    return runes.map(r => processRune(r, stage, settings));
  }

  window.SWRM.processAll   = processAll;
  window.SWRM.processRune  = processRune;
  window.SWRM.ROLE_PRIORITY = BASE_ROLE_PRIORITY;
})();
