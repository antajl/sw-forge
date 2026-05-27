// js/features/gear/artifact-verdict.js — attach keep/sell verdicts after gear load

  function attachArtifactVerdicts(artifacts) {
    if (!Array.isArray(artifacts) || !window.SWRM || typeof window.SWRM.getArtifactVerdict !== 'function') {
      return;
    }
    const settings = window.SWRM.settings;
    for (let i = 0; i < artifacts.length; i++) {
      const a = artifacts[i];
      if (!a) continue;
      const v = window.SWRM.getArtifactVerdict(a, settings);
      a.artifactVerdict = v ? v.verdict : null;
      a.artifactRole = v ? v.role : null;
      a.artifactScore = v ? v.score : null;
      if (typeof window.SWRM.calcArtifactIngameScore === 'function') {
        a.artifactIngameScore = window.SWRM.calcArtifactIngameScore(a);
      } else {
        a.artifactIngameScore = null;
      }
      if (typeof window.SWRM.calcArtifactForgeScoreDisplay === 'function') {
        a.artifactForgeScore = window.SWRM.calcArtifactForgeScoreDisplay(a);
      } else {
        a.artifactForgeScore = null;
      }
      a.artifactSynergies = v && v.synergies ? v.synergies.slice() : [];
    }
  }

  function refreshArtifactVerdictsAndTable() {
    if (typeof attachArtifactVerdicts === 'function' && Array.isArray(allArtifacts)) {
      attachArtifactVerdicts(allArtifacts);
    }
    if (typeof bumpAllArtifactsRev === 'function') bumpAllArtifactsRev();
    if (typeof renderArtifactDashboardDistributions === 'function') {
      renderArtifactDashboardDistributions({ animateCharts: true });
    }
    if (typeof renderGearTables === 'function') renderGearTables();
  }
