(function () {
  const S = (window.SWRM = window.SWRM || {});

  /**
   * Artifact Ingame Score based on the official game formula (patch v8.3.4):
   * Σ (value_i / max_i) * 100, result Math.round
   * Range: 0-400 (4 subs × 100 each)
   *
   * Source: Official patch notes v8.3.4 + Spokland (v8.0.0+)
   * "Sub Property values are calculated based on the maximum value that can be added to the Rune/Artifact from power-ups."
   */

  /** Maximum values for each artifact effect type (Spokland v8.0.0+). */
  const ARTIFACT_EFFECT_MAX = {
    // ATK/DEF/SPD Increased Proportional to Lost HP: max 30%
    200: 30, 201: 30, 202: 30,
    // SPD Under Inability Effects: max 30%
    203: 30,
    // ATK/DEF Increasing Effect: max 20%
    204: 20, 205: 20,
    // SPD Increasing Effect: max 30%
    206: 30,
    // Crit Rate Increasing Effect: max 30%
    207: 30,
    // Counter/Team-up/Bomb/Reflect/Crushing Hit DMG: max 15%
    208: 15, 209: 15, 210: 15, 211: 15, 212: 15,
    // Damage Received Under Inability Effect: max 30%
    213: 30,
    // Received Crit DMG: max 15%
    214: 15,
    // Life Drain / HP when Revived / Attack Bar when Revived: max 15%
    215: 15, 216: 15, 217: 15,
    // Additional Damage by HP: max 1.5%
    218: 1.5,
    // Additional Damage by ATK/DEF: max 20%
    219: 20, 220: 20,
    // Additional Damage by SPD: max 200%
    221: 200,
    // CRIT DMG+ (good HP condition): max 30%
    222: 30,
    // CRIT DMG+ (bad HP condition): max 60%
    223: 60,
    // Single-target skill CRIT DMG on your turn: max 20%
    224: 20,
    // Counterattack/Co-op Attack DMG: max 15%
    225: 15,
    // ATK/DEF UP Effect: max 20%
    226: 20,
    // Damage Dealt on Elements: max 20%
    300: 20, 301: 20, 302: 20, 303: 20, 304: 20,
    // Damage Received from Elements: max 30%
    305: 30, 306: 30, 307: 30, 308: 30, 309: 30,
    // Skill 1-4 CRIT DMG: max 30%
    400: 30, 401: 30, 402: 30, 403: 30,
    // Skill 1-3 Recovery: max 30%
    404: 30, 405: 30, 406: 30,
    // Skill 1-3 Accuracy: max 30%
    407: 30, 408: 30, 409: 30,
    // Skill 3/4 CRIT DMG: max 30%
    410: 30,
    // First Attack CRIT DMG: max 20%
    411: 20,
  };
  
  function calcArtifactIngameScoreRaw(artifact) {
    const secs = artifact && Array.isArray(artifact.secs) ? artifact.secs : [];
    let score = 0;

    for (let i = 0; i < secs.length; i++) {
      const sec = secs[i];
      const type = Number(sec && sec.type);
      const val = Number(sec && sec.value);
      if (!Number.isFinite(type) || !Number.isFinite(val) || val <= 0) continue;

      const max = ARTIFACT_EFFECT_MAX[type];
      if (max && max > 0) {
        score += (val / max) * 100;
      }
    }

    return Math.round(score);
  }

  function calcArtifactIngameScore(artifact) {
    return calcArtifactIngameScoreRaw(artifact);
  }

  function artifactIngameScoreBreakdown(artifact) {
    const secs = artifact && Array.isArray(artifact.secs) ? artifact.secs : [];
    const lines = [];
    let totalScore = 0;

    for (let i = 0; i < secs.length; i++) {
      const sec = secs[i];
      const type = Number(sec && sec.type);
      const val = Number(sec && sec.value);
      if (!Number.isFinite(type) || !Number.isFinite(val) || val <= 0) continue;

      const max = ARTIFACT_EFFECT_MAX[type];
      if (max && max > 0) {
        const ratio = val / max;
        const points = ratio * 100;
        totalScore += points;
        const formatFn = window.SWRM && window.SWRM.ARTIFACT_SUB_FORMAT && window.SWRM.ARTIFACT_SUB_FORMAT[type];
        const label = formatFn ? formatFn({ type, value: val }) : `type ${type}`;
        lines.push(`${label}: ${val} / ${max} = ${ratio.toFixed(3)} → ${points.toFixed(0)} pts`);
      } else {
        lines.push(`type ${type}: ${val} (no max defined)`);
      }
    }

    lines.push(`Total score: ${Math.round(totalScore)}`);

    return lines;
  }

  /**
   * Artifact Forge Score is our own quality scale (not the in-game rating).
   * It mirrors the Rune Table UX: a compact 0–5+ number with 0.5 steps.
   */
  function calcArtifactForgeScoreDisplay(artifact) {
    const raw = Number(artifact && artifact.artifactScore);
    if (!Number.isFinite(raw) || raw < 0) return null;
    const scaled = (raw / 4) * 5;
    return Math.round(scaled * 2) / 2;
  }

  S.calcArtifactIngameScoreRaw = calcArtifactIngameScoreRaw;
  S.calcArtifactIngameScore = calcArtifactIngameScore;
  S.artifactIngameScoreBreakdown = artifactIngameScoreBreakdown;
  S.calcArtifactForgeScoreDisplay = calcArtifactForgeScoreDisplay;
})();
