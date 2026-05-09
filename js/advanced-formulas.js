// =============================================
// advanced-formulas.js — Advanced Formula System
// Mirrors Google Sheets formula logic with comprehensive settings
// =============================================

(function() {
  'use strict';

  // Get the threshold key string for a given stage + grade
  function modeKey(stage, grade) {
    const g = grade === 'Legend' ? 'Leg' : 'Hero';
    return `${stage}_${g}`;
  }

  // Build a stat lookup for a rune { statName: value }
  function statMap(rune) {
    const m = {};
    for (const s of rune.substats) {
      m[s.name] = (m[s.name] || 0) + s.val + s.grind;
    }
    return m;
  }

  // Check if formula is enabled
  function isFormulaEnabled(formulaName, settings) {
    return settings.formulas?.[formulaName]?.enabled !== false;
  }

  // Check accepted main stats for slots
  function checkAcceptedMains(rune, formula) {
    if ([2, 4, 6].includes(rune.slot)) {
      const accepted = formula.acceptedMains?.[rune.slot];
      if (accepted && accepted.length > 0) {
        // Filter out 'None' values
        const validMains = accepted.filter(m => m !== 'None');
        if (validMains.length > 0 && !validMains.includes(rune.mainName)) {
          return false;
        }
      }
    }
    return true;
  }

  // Check substats inclusion/exclusion for stage
  function checkSubstats(rune, formula, stage) {
    const sm = statMap(rune);
    const includedStats = [];
    const excludedStats = [];

    for (const [stat, stageConfig] of Object.entries(formula.substats || {})) {
      const setting = stageConfig[stage];
      if (setting === 'Include') {
        includedStats.push(stat);
      } else if (setting === 'Exclude') {
        excludedStats.push(stat);
      }
    }

    // Check excluded stats - if present, disqualify
    for (const stat of excludedStats) {
      if ((sm[stat] || 0) > 0) {
        return false;
      }
    }

    // Count included stats present
    const presentCount = includedStats.filter(stat => (sm[stat] || 0) > 0).length;
    
    return {
      passed: true,
      presentCount,
      includedStats,
      statMap: sm
    };
  }

  // Check slot requirements
  function checkSlotRequirements(rune, formula, stage, sm) {
    const slotReq = formula.slotRequirements?.[rune.slot]?.[stage];
    if (slotReq && slotReq !== 'None') {
      return (sm[slotReq] || 0) > 0;
    }
    return true;
  }

  // Check minimum stats requirement (excluding must-have)
  function checkMinStats(rune, formula, stage, includedStats, mustHaveStat) {
    let slotKey;
    if ([1, 3, 5].includes(rune.slot)) {
      slotKey = '1/3/5';
    } else {
      slotKey = `Slot ${rune.slot}`;
    }

    const minRequired = formula.minStats?.[slotKey]?.[stage] || 1;
    
    // Count included stats excluding must-have
    const effectiveStats = includedStats.filter(stat => stat !== mustHaveStat);
    
    return effectiveStats.length >= minRequired;
  }

  // Check must-have requirement
  function checkMustHave(rune, formula, stage, sm) {
    const mustHave = formula.mustHave?.[stage];
    if (mustHave && mustHave !== 'None') {
      return (sm[mustHave] || 0) > 0;
    }
    return true;
  }

  // Check high roll anchor requirements
  function checkAnchorRequirements(rune, formula, stage, settings, sm) {
    const isHero = rune.gradeStr === 'Hero';
    const isLegend = rune.gradeStr === 'Legend';
    
    for (const [anchorType, stageConfig] of Object.entries(formula.requireHR || {})) {
      const required = stageConfig[stage];
      if (!required) continue;

      const isHeroAnchor = anchorType.includes('Hero');
      const isLegendAnchor = anchorType.includes('Legend');

      if ((isHero && isHeroAnchor) || (isLegend && isLegendAnchor)) {
        const hrKey = modeKey(stage, rune.gradeStr);
        const thresholds = settings.hrThresholds;
        
        let hasAnchor = false;
        for (const [stat, value] of Object.entries(sm)) {
          if (value > 0) {
            const threshold = thresholds[stat]?.[hrKey];
            if (threshold && value >= threshold) {
              hasAnchor = true;
              break;
            }
          }
        }
        
        if (!hasAnchor) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Main formula checker - mirrors Google Sheets logic
  function checkFormula(rune, formulaName, stage, settings) {
    const formula = settings.formulas?.[formulaName];
    if (!formula) return false;

    // Check if formula is enabled
    if (!isFormulaEnabled(formulaName, settings)) {
      return false;
    }

    // Check accepted main stats
    if (!checkAcceptedMains(rune, formula)) {
      return false;
    }

    // Check substats
    const substatResult = checkSubstats(rune, formula, stage);
    if (!substatResult.passed) {
      return false;
    }

    // Check must-have requirement
    const mustHaveStat = formula.mustHave?.[stage];
    if (!checkMustHave(rune, formula, stage, substatResult.statMap)) {
      return false;
    }

    // Check slot requirements
    if (!checkSlotRequirements(rune, formula, stage, substatResult.statMap)) {
      return false;
    }

    // Check minimum stats (excluding must-have)
    if (!checkMinStats(rune, formula, stage, substatResult.includedStats, mustHaveStat)) {
      return false;
    }

    // Check anchor requirements
    if (!checkAnchorRequirements(rune, formula, stage, settings, substatResult.statMap)) {
      return false;
    }

    return true;
  }

  // Process all formulas for a rune
  function processAdvancedFormulas(rune, stage, settings) {
    const results = {};
    const formulaNames = Object.keys(settings.formulas || {});
    
    // Check each formula
    for (const formulaName of formulaNames) {
      results[formulaName] = checkFormula(rune, formulaName, stage, settings);
    }

    return results;
  }

  // Get best formula match (mirrors Google Sheets priority)
  function getBestFormulaMatch(formulaResults, settings) {
    const enabledFormulas = Object.entries(formulaResults)
      .filter(([name, matched]) => matched && isFormulaEnabled(name, settings))
      .map(([name]) => name);

    // Priority order (can be customized)
    const priority = [
      'Classic DPS',
      'Slow DPS', 
      'Bomber',
      'Fast Utility',
      'Heavy Resist',
      'Bruiser'
    ];

    for (const formula of priority) {
      if (enabledFormulas.includes(formula)) {
        return formula;
      }
    }

    return enabledFormulas[0] || '';
  }

  // Enhanced verdict calculation using advanced formulas
  function getAdvancedVerdict(rune, stage, settings, formulaResults) {
    const bestFormula = getBestFormulaMatch(formulaResults, settings);
    const hasFormula = bestFormula !== '';
    
    const isHero = rune.gradeStr === 'Hero';
    const isLegend = rune.gradeStr === 'Legend';
    const hasHighDuo = formulaResults['High Roll'] || formulaResults['Duo Roll'];
    
    // Priority order: Upgrade → Finish → Reapp → (Gem if Flat) → (Keep, or Grind if Keep-worthy) → Sell
    
    // 1. Upgrade: below +9, power up first
    if (rune.level < 9) {
      return 'Upgrade';
    }
    
    // 2. Finish: +9 with potential, take to +12
    if (rune.level < 12 && hasFormula) {
      // Check efficiency thresholds for Hero without High Roll/Duo Roll
      if (isHero && !hasHighDuo) {
        const effThreshold = stage === 'Late' ? 85 : (stage === 'Mid' ? 85 : 65);
        if (rune.eff < effThreshold) return 'Sell';
      }
      return 'Finish';
    }
    
    // 3. Reapp: Legend with good set/main, bad subs (skipped if any other formula matched)
    if (hasFormula && isLegend) {
      // Check if this is ONLY a Reapp candidate
      if (bestFormula === 'Classic DPS' || bestFormula === 'Slow DPS' || 
          bestFormula === 'Bomber' || bestFormula === 'Bruiser' || 
          bestFormula === 'Fast Utility' || bestFormula === 'Heavy Resist') {
        // Has other formulas, don't Reapp
      } else {
        // Check Reapp rules
        if (window.SWRM.matchReappRule?.(rune, settings)) {
          return 'Reapp';
        }
      }
    }
    
    // 4. Gem: good but has a flat stat to replace
    if (hasFormula && window.SWRM.hasBadFlat?.(rune, stage)) {
      const gem = window.SWRM.checkGem?.(rune, stage, settings);
      if (gem?.can) {
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
    if (!hasFormula) {
      // No formula matching - check efficiency thresholds
      const effThreshold = stage === 'Late' ? 65 : (stage === 'Mid' ? 50 : 35);
      if (isHero && !hasHighDuo) {
        const heroEffThreshold = stage === 'Late' ? 80 : (stage === 'Mid' ? 65 : 50);
        if (rune.eff < heroEffThreshold) return 'Sell';
      } else if (rune.eff < effThreshold) {
        return 'Sell';
      } else {
        return 'Sell'; // No formula but meets efficiency - still Sell per logic
      }
    }
    
    // 6. Grind: Keep-quality, one grindstone from High Roll
    const grind = window.SWRM.checkGrind?.(rune, stage, settings);
    if (grind?.can) {
      return 'Grind';
    }
    
    // 7. Keep: strong stats, ready to equip
    return 'Keep';
  }

  // Export functions
  window.SWRM.checkFormula = checkFormula;
  window.SWRM.processAdvancedFormulas = processAdvancedFormulas;
  window.SWRM.getBestFormulaMatch = getBestFormulaMatch;
  window.SWRM.getAdvancedVerdict = getAdvancedVerdict;

})();
