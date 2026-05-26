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
