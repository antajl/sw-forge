(function () {
  const S = (window.SWRM = window.SWRM || {});

  /**
   * Artifact Ingame Score is modeled as internal weighted stat coefficients.
   * Seed values come from the old community score model, then each type
   * can be calibrated independently against real in-game datasets.
   */
  const ARTIFACT_INGAME_WEIGHTS = {
    200: 1.775,
    201: 1.775,
    202: 1.775,
    203: 4.1666666667,
    204: 5,
    205: 5,
    206: 4.1666666667,
    207: 5,
    208: 8.3333333333,
    209: 8.3333333333,
    210: 6.25,
    211: 5,
    212: 5,
    213: 5,
    214: 2.0833333333,
    215: 3.125,
    216: 4.1666666667,
    217: 4.1666666667,
    218: 83.3333333333,
    219: 6.25,
    220: 6.25,
    221: 0.625,
    222: 4.1666666667,
    223: 2.0833333333,
    224: 6.25,
    225: 8.3333333333,
    226: 5,
    300: 5,
    301: 5,
    302: 5,
    303: 5,
    304: 5,
    305: 5,
    306: 5,
    307: 5,
    308: 5,
    309: 5,
    400: 4.1666666667,
    401: 4.1666666667,
    402: 4.1666666667,
    403: 4.1666666667,
    404: 4.1666666667,
    405: 4.1666666667,
    406: 4.1666666667,
    407: 4.1666666667,
    408: 4.1666666667,
    409: 4.1666666667,
    410: 4.1666666667,
    411: 4.1666666667,
  };

  function calcArtifactIngameScoreRaw(artifact) {
    const secs = artifact && Array.isArray(artifact.secs) ? artifact.secs : [];
    let raw = 0;
    for (let i = 0; i < secs.length; i++) {
      const sec = secs[i];
      const type = Number(sec && sec.type);
      const val = Number(sec && sec.value);
      const weight = ARTIFACT_INGAME_WEIGHTS[type];
      if (!Number.isFinite(type) || !Number.isFinite(val)) continue;
      if (!Number.isFinite(weight)) continue;
      if (val <= 0) continue;
      raw += val * weight;
    }
    return raw;
  }

  function calcArtifactIngameScore(artifact) {
    return Math.round(calcArtifactIngameScoreRaw(artifact));
  }

  function artifactIngameScoreBreakdown(artifact) {
    const lines = [];
    const secs = artifact && Array.isArray(artifact.secs) ? artifact.secs : [];
    let rawTotal = 0;
    for (let i = 0; i < secs.length; i++) {
      const sec = secs[i];
      const type = Number(sec && sec.type);
      const val = Number(sec && sec.value);
      const weight = ARTIFACT_INGAME_WEIGHTS[type];
      if (!Number.isFinite(type) || !Number.isFinite(val) || val <= 0) continue;
      if (!Number.isFinite(weight)) {
        lines.push(`type ${type}: ${val} (unknown weight) -> skipped`);
        continue;
      }
      const pts = val * weight;
      rawTotal += pts;
      lines.push(`type ${type}: ${val} * ${weight} -> +${pts.toFixed(3)}`);
    }
    lines.push(`Sigma weighted ${rawTotal.toFixed(3)} -> ${Math.round(rawTotal)}`);
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

  S.ARTIFACT_INGAME_WEIGHTS = ARTIFACT_INGAME_WEIGHTS;
  S.calcArtifactIngameScoreRaw = calcArtifactIngameScoreRaw;
  S.calcArtifactIngameScore = calcArtifactIngameScore;
  S.artifactIngameScoreBreakdown = artifactIngameScoreBreakdown;
  S.calcArtifactForgeScoreDisplay = calcArtifactForgeScoreDisplay;
})();
