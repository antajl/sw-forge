// js/engine/engine-artifacts.js — artifact keep/sell verdicts
(function () {
  'use strict';

  const DEFAULT_SYNERGY_PAIRS = [
    { subs: [219, 400], bonus: 0.5, role: 'Classic DPS', label: 'ATK dmg + S1 CRIT', enabled: true },
    { subs: [219, 401], bonus: 0.5, role: 'Classic DPS', label: 'ATK dmg + S2 CRIT', enabled: true },
    { subs: [219, 402], bonus: 0.5, role: 'Classic DPS', label: 'ATK dmg + S3 CRIT', enabled: true },
    { subs: [219, 410], bonus: 0.5, role: 'Classic DPS', label: 'ATK dmg + S3/4 CRIT', enabled: true },
    { subs: [218, 400], bonus: 0.5, role: 'Classic DPS', label: 'HP dmg + S1 CRIT', enabled: true },
    { subs: [218, 402], bonus: 0.5, role: 'Classic DPS', label: 'HP dmg + S3 CRIT', enabled: true },
    { subs: [210, 219], bonus: 0.5, role: 'Bomber', label: 'Bomb + ATK dmg', enabled: true },
    { subs: [208, 219], bonus: 0.5, role: 'Bruiser', label: 'Counter + ATK dmg', enabled: true },
    { subs: [213, 214], bonus: 0.5, role: 'Tank', label: 'DMG received -% + Crit DMG -', enabled: true },
    { subs: [213, 205], bonus: 0.3, role: 'Tank', label: 'DMG received + DEF UP effect', enabled: true },
    { subs: [300, 301], bonus: 0.3, role: 'Classic DPS', label: 'Fire+Water dmg', enabled: true },
    { subs: [219, 300], bonus: 0.5, role: 'Classic DPS', label: 'ATK dmg + Element dmg', enabled: true },
  ];

  const DEFAULT_MAIN_SUB_SYNERGY = {
    101: {
      goodSubs: [219, 222, 223, 224, 400, 401, 402, 403, 410, 411, 208, 209, 210],
      bonus: 0.3,
      label: 'ATK main + damage subs',
      enabled: true,
    },
    102: {
      goodSubs: [213, 214, 205, 201, 211],
      bonus: 0.3,
      label: 'DEF main + defensive subs',
      enabled: true,
    },
    100: {
      goodSubs: [213, 216, 217, 218, 201],
      bonus: 0.3,
      label: 'HP main + bulk subs',
      enabled: true,
    },
  };

  const PRI_MAIN =
    (window.SWRM && window.SWRM.ARTIFACT_PRI_MAIN) || { 100: 'HP', 101: 'ATK', 102: 'DEF' };

  function normalizeRules(settings) {
    const base =
      window.SWRM && typeof window.SWRM.mergeArtifactRules === 'function'
        ? window.SWRM.mergeArtifactRules(settings && settings.artifactRules)
        : settings && settings.artifactRules;
    return base || {};
  }

  function artifactMainStatKey(artifact) {
    const t = artifact && artifact.pri ? artifact.pri.type : null;
    if (t == null) return null;
    return PRI_MAIN[t] || null;
  }

  function getArtifactRolesList(rules) {
    const pack = rules.artifactRoles || rules.roles;
    if (pack && Array.isArray(pack.roles) && pack.roles.length) return pack.roles;
    const d = window.SWRM && window.SWRM.DEFAULT_ARTIFACT_ROLES;
    return d && Array.isArray(d.roles) ? d.roles : [];
  }

  function calcSynergyBonus(artifact, rules) {
    const subTypes = (artifact.secs || []).map((s) => s.type);
    const mainType = artifact.pri ? artifact.pri.type : null;
    let bonus = 0;
    const matchedSynergies = [];

    if (rules.synergiesEnabled === false) {
      return { bonus: 0, synergies: [] };
    }

    const pairs = rules.synergyPairs || DEFAULT_SYNERGY_PAIRS;
    for (const pair of pairs) {
      if (pair.enabled === false) continue;
      const subs = pair.subs || [];
      if (subs.length && subs.every((id) => subTypes.includes(id))) {
        bonus += Number(pair.bonus) || 0;
        if (pair.label) matchedSynergies.push(pair.label);
      }
    }

    const mainMap = rules.mainSubSynergy || DEFAULT_MAIN_SUB_SYNERGY;
    const ms = mainType != null ? mainMap[mainType] : null;
    if (ms && ms.enabled !== false) {
      const good = Array.isArray(ms.goodSubs) ? ms.goodSubs : [];
      const matchCount = subTypes.filter((t) => good.includes(t)).length;
      if (matchCount >= 2) {
        bonus += Number(ms.bonus) || 0;
        if (ms.label) matchedSynergies.push(ms.label);
      }
    }

    return { bonus, synergies: matchedSynergies };
  }

  function scoreArtifactForRole(artifact, roleDef) {
    const subTypes = (artifact.secs || []).map((s) => s.type);
    const mainKey = artifactMainStatKey(artifact);
    const expected = roleDef.mainStat;
    if (expected && mainKey && expected !== mainKey) {
      return { usefulCount: 0, mainMismatch: true, score: 0 };
    }
    const usefulSet = new Set(
      (roleDef.usefulSubs || []).map(Number).filter((n) => Number.isFinite(n)),
    );
    const usefulCount = subTypes.filter((t) => usefulSet.has(t)).length;
    return { usefulCount, mainMismatch: false, score: usefulCount };
  }

  function pickArtifactRole(artifact, rules) {
    const roles = getArtifactRolesList(rules);
    if (!roles.length) return { role: null, usefulCount: 0, roleScore: 0, mainMismatch: false };

    let best = null;
    let bestUseful = 0;
    let bestRoleScore = 0;

    for (const roleDef of roles) {
      const { usefulCount, mainMismatch, score } = scoreArtifactForRole(artifact, roleDef);
      if (mainMismatch) continue;
      if (score > bestRoleScore) {
        bestRoleScore = score;
        bestUseful = usefulCount;
        best = roleDef.name;
      }
    }

    if (!best) {
      return { role: 'Unknown', usefulCount: 0, roleScore: 0, mainMismatch: true };
    }
    return { role: best, usefulCount: bestUseful, roleScore: bestRoleScore, mainMismatch: false };
  }

  function getArtifactRole(artifact, settings) {
    const rules = normalizeRules(settings);
    return pickArtifactRole(artifact, rules).role;
  }

  function getArtifactVerdict(artifact, settings) {
    if (!artifact || !artifact.secs) return null;

    const rules = normalizeRules(settings);
    const grade = artifact.grade != null ? artifact.grade : artifact.gradeRank || 0;
    if (grade < 3) {
      return { verdict: 'sell', role: null, usefulCount: 0, score: 0, synergies: [], reason: 'grade_too_low' };
    }

    const minLegend = Number.isFinite(Number(rules.minUsefulLegend)) ? Number(rules.minUsefulLegend) : 2;
    const minHero = Number.isFinite(Number(rules.minUsefulHero)) ? Number(rules.minUsefulHero) : 1;
    const minUseful = grade >= 5 ? minLegend : minHero;

    const { bonus, synergies } = calcSynergyBonus(artifact, rules);
    const picked = pickArtifactRole(artifact, rules);
    const bestScore = picked.roleScore + bonus;
    const usefulCount = picked.usefulCount;
    const role = picked.role;
    const reason =
      picked.mainMismatch && role === 'Unknown'
        ? 'main_mismatch'
        : usefulCount >= minUseful
          ? 'role_match'
          : 'not_enough_useful';

    const verdict = bestScore >= minUseful ? 'keep' : 'sell';

    return {
      verdict,
      role,
      usefulCount,
      score: Math.round(bestScore * 10) / 10,
      synergies,
      reason,
    };
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.getArtifactVerdict = getArtifactVerdict;
  window.SWRM.getArtifactRole = getArtifactRole;
  window.SWRM.calcArtifactSynergyBonus = calcSynergyBonus;
  window.SWRM.ARTIFACT_DEFAULT_SYNERGY_PAIRS = DEFAULT_SYNERGY_PAIRS;
  window.SWRM.ARTIFACT_DEFAULT_MAIN_SUB_SYNERGY = DEFAULT_MAIN_SUB_SYNERGY;
})();
