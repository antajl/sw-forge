// js/features/rules/policy-ui.js — Evaluation policy + dashboard strictness

  function getDashboardGameStage() {
    const sel = document.getElementById('stage-select');
    const v = sel && sel.value;
    if (v === 'Early' || v === 'Mid' || v === 'Late') return v;
    return 'Mid';
  }

  function stageToSimplePreset(stage) {
    if (stage === 'Early') return 'Early Progression';
    if (stage === 'Late') return 'Late Progression';
    return 'Mid Progression';
  }

  function updateDashboardStrictnessHints() {
    const el = document.getElementById('dashboard-policy-strictness');
    const hint = document.getElementById('dashboard-policy-strictness-hint');
    if (!el || !hint) return;
    const v = Math.max(1, Math.min(5, parseInt(el.value, 10) || 3));
    hint.textContent = `${v}/5`;
  }

  function policyFromPresetName(name) {
    const presets = window.SWRM.DEFAULT_EVAL_POLICY_PRESETS || {};
    const tmpl = presets[name];
    const cur = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    if (!tmpl) {
      return window.SWRM.mergeEvalPolicy({ ...cur, preset: name || 'Custom' });
    }
    return window.SWRM.mergeEvalPolicy({
      ...cur,
      ...tmpl,
      preset: tmpl.preset,
      simpleStrictness: cur.simpleStrictness,
      relaxedRetryMode: cur.relaxedRetryMode,
    });
  }

  /**
   * Strictness 1–5: L=3 matches the stage preset baseline. Each step moves real filters:
   * minUsefulSubs ±1 per level, minRolePressure ~±0.08/step, God/Duo/Slow-DPS ratios for Universal,
   * anchor/slot modes at extremes. L≥4 turns relaxed retry off so strict pass dominates.
   */
  function blendSimpleStrictnessOntoStageTemplate(tmpl, L) {
    const presets = window.SWRM.DEFAULT_EVAL_POLICY_PRESETS || {};
    const late = presets['Late Progression'] || {};
    const d = L - 3;
    const base = window.SWRM.mergeEvalPolicy(tmpl);

    const tUp = Math.max(0, d) / 2;
    const tDown = Math.max(0, -d) / 2;

    const blendRatioField = (field, forgiving) => {
      const fb = Number(base[field]);
      const cur = Number.isFinite(fb) ? fb : forgiving;
      if (d > 0) {
        const dest = Number(late[field]);
        const end = Number.isFinite(dest) ? dest : cur;
        return Math.max(0.62, Math.min(1.02, cur + (end - cur) * tUp));
      }
      if (d < 0) {
        return Math.max(0.62, Math.min(1.02, cur + (forgiving - cur) * tDown));
      }
      return cur;
    };

    // ~0.08 / step on global floor (target band 0.05–0.10 between adjacent levels)
    const minRolePressure = Math.max(
      0,
      Math.min(0.52, Number(base.minRolePressure || 0) + d * 0.082),
    );

    const prMult = 1 + d * 0.15;
    const rolePressureByRole = {};
    const srcRp = base.rolePressureByRole && typeof base.rolePressureByRole === 'object' ? base.rolePressureByRole : {};
    Object.keys(srcRp).forEach((role) => {
      const v = Number(srcRp[role]);
      if (!Number.isFinite(v)) return;
      const boosted = v * prMult + Math.max(0, d) * 0.028;
      rolePressureByRole[role] = Math.max(0.18, Math.min(0.8, boosted));
    });

    // Exactly one useful-sub step per strictness level vs L=3 baseline
    const minUsefulSubsByRole = {};
    const srcMu = base.minUsefulSubsByRole && typeof base.minUsefulSubsByRole === 'object' ? base.minUsefulSubsByRole : {};
    const rolesFromFormulas = Object.keys(window.SWRM.settings?.formulas || {});
    const muKeys = new Set([...Object.keys(srcMu), ...rolesFromFormulas]);
    muKeys.forEach((role) => {
      let n = Number(srcMu[role]);
      if (!Number.isFinite(n)) n = 2;
      const adj = n + d;
      minUsefulSubsByRole[role] = Math.max(1, Math.min(5, adj));
    });

    let minStatsModifier = 0;
    if (Number(base.minStatsModifier) === 1) minStatsModifier = 1;
    else if (Number(base.minStatsModifier) === -1) minStatsModifier = -1;
    if (d <= -2) minStatsModifier = -1;
    else if (d >= 2) minStatsModifier = 1;

    let anchorMode = base.anchorMode === 'soft' ? 'soft' : 'hard';
    if (d <= -1) anchorMode = 'soft';
    else if (d >= 1) anchorMode = 'hard';

    let slotRequirementMode = base.slotRequirementMode === 'soft' ? 'soft' : 'hard';
    if (d <= -1) slotRequirementMode = 'soft';
    else if (d >= 1) slotRequirementMode = 'hard';

    // High strictness: no second pass — primary policy + Universal thresholds decide.
    const relaxedRetryMode = L >= 4 ? 'off' : 'normal';

    return window.SWRM.mergeEvalPolicy({
      ...base,
      preset: base.preset,
      anchorMode,
      slotRequirementMode,
      minStatsModifier,
      minRolePressure,
      rolePressureByRole,
      minUsefulSubsByRole,
      slowDpsCoreMinRatio: blendRatioField('slowDpsCoreMinRatio', 0.665),
      godRollMinRatio: blendRatioField('godRollMinRatio', 0.855),
      duoRollMinRatio: blendRatioField('duoRollMinRatio', 0.755),
      simpleStrictness: L,
      relaxedRetryMode,
      godCountsAsRole: false,
      duoCountsAsRole: false,
    });
  }

  function applySimpleAnalyzerPolicy(gameStage, strictness) {
    const presets = window.SWRM.DEFAULT_EVAL_POLICY_PRESETS || {};
    const presetName = stageToSimplePreset(gameStage || 'Mid');
    const tmpl = presets[presetName] || presets['Mid Progression'];
    const L = Math.max(1, Math.min(5, Number(strictness) || 3));

    const next = blendSimpleStrictnessOntoStageTemplate(tmpl, L);
    window.SWRM.settings.policy = next;
    writePolicyToExpertControls(next);
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    refreshPolicySummary();
  }

  function writePolicyToExpertControls(policy) {
    const p = window.SWRM.mergeEvalPolicy(policy);
    const setSel = (id, val) => {
      const el = document.getElementById(id);
      if (!el || val == null) return;
      el.value = String(val);
    };
    setSel('policy-preset', p.preset);
    setSel('policy-anchor-mode', p.anchorMode);
    setSel('policy-slotreq-mode', p.slotRequirementMode);
    setSel('policy-minstats-mod', String(p.minStatsModifier));
    const mp = document.getElementById('policy-min-pressure');
    if (mp) {
      const want = Number(p.minRolePressure).toFixed(2);
      const opts = Array.from(mp.options).map((o) => o.value);
      mp.value = opts.includes(want) ? want : (opts.includes('0.00') ? '0.00' : mp.options[0].value);
    }
    const g = document.getElementById('policy-god-counts');
    const d = document.getElementById('policy-duo-counts');
    if (g) g.checked = !!p.godCountsAsRole;
    if (d) d.checked = !!p.duoCountsAsRole;
    const dash = document.getElementById('dashboard-policy-strictness');
    if (dash) dash.value = String(Math.max(1, Math.min(5, Number(p.simpleStrictness) || 3)));
  }

  function readPolicyFromControls() {
    const cur = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    const preset = document.getElementById('policy-preset')?.value || cur.preset;
    const anchorMode = document.getElementById('policy-anchor-mode')?.value === 'soft' ? 'soft' : 'hard';
    const slotRequirementMode = document.getElementById('policy-slotreq-mode')?.value === 'soft' ? 'soft' : 'hard';
    const msm = parseInt(document.getElementById('policy-minstats-mod')?.value, 10);
    const minStatsModifier = msm === -1 || msm === 1 ? msm : 0;
    const mpSel = document.getElementById('policy-min-pressure');
    const minRolePressure = mpSel ? Number(mpSel.value) : cur.minRolePressure;
    const merged = window.SWRM.mergeEvalPolicy({
      ...cur,
      preset,
      anchorMode,
      slotRequirementMode,
      minStatsModifier,
      minRolePressure: Number.isFinite(minRolePressure) ? minRolePressure : cur.minRolePressure,
      godCountsAsRole: !!document.getElementById('policy-god-counts')?.checked,
      duoCountsAsRole: !!document.getElementById('policy-duo-counts')?.checked,
    });
    const dash = document.getElementById('dashboard-policy-strictness');
    if (dash) {
      const ss = parseInt(dash.value, 10);
      if (Number.isFinite(ss)) merged.simpleStrictness = Math.max(1, Math.min(5, ss));
    }
    return window.SWRM.mergeEvalPolicy(merged);
  }

  function refreshPolicySummary() {
    const el = document.getElementById('policy-summary');
    if (!el) return;
    const p = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    const a = p.anchorMode === 'soft' ? 'anchor soft' : 'anchor hard';
    const s = p.slotRequirementMode === 'soft' ? 'slots soft' : 'slots hard';
    el.textContent = `${p.preset} · ${a} · ${s} · pressure ${Number(p.minRolePressure).toFixed(2)} · strictness ${p.simpleStrictness}/5 · retry ${p.relaxedRetryMode || 'normal'}`;
  }

  function syncPolicySimplePreview() {
    const simplePrev = document.getElementById('policy-simple-preview');
    if (simplePrev) simplePrev.hidden = true;
  }

  let policyReprocTm = null;
  function schedulePolicyReprocess() {
    refreshPolicySummary();
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    if (typeof processedRunes === 'undefined' || !processedRunes.length) return;
    clearTimeout(policyReprocTm);
    policyReprocTm = setTimeout(() => {
      if (processedRunes.length) reprocess();
    }, 90);
  }

  function applyPolicyExpertUi() {
    const expert = document.getElementById('policy-expert-wrap');
    if (expert) expert.hidden = false;
  }

  function initPolicySimpleExpertUx() {
    applyPolicyExpertUi();
  }

  function initThresholdPreviewsToggle() {
    const btn = document.getElementById('btn-toggle-threshold-previews');
    const wrap = document.getElementById('threshold-previews-wrap');
    if (!btn || !wrap) return;
    const tloc = () => TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const syncBtn = () => {
      const t = tloc();
      const hidden = wrap.hasAttribute('hidden');
      btn.textContent = hidden
        ? (t.rulesThresholdPreviewsShow || 'Show threshold previews')
        : (t.rulesThresholdPreviewsHide || 'Hide threshold previews');
    };
    syncBtn();
    btn.addEventListener('click', () => {
      if (wrap.hasAttribute('hidden')) wrap.removeAttribute('hidden');
      else wrap.setAttribute('hidden', '');
      syncBtn();
    });
  }

  function initPolicyControls() {
    const pol = window.SWRM.mergeEvalPolicy(window.SWRM.settings.policy);
    writePolicyToExpertControls(pol);
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    refreshPolicySummary();

    applySimpleAnalyzerPolicy(getDashboardGameStage(), pol.simpleStrictness);

    const dash = document.getElementById('dashboard-policy-strictness');
    if (dash) {
      dash.addEventListener('input', () => updateDashboardStrictnessHints());
      dash.addEventListener('change', () => {
        const v = Math.max(1, Math.min(5, parseInt(dash.value, 10) || 3));
        applySimpleAnalyzerPolicy(getDashboardGameStage(), v);
        schedulePolicyReprocess();
      });
    }

    document.getElementById('policy-preset')?.addEventListener('change', (e) => {
      const name = e.target && e.target.value;
      if (name && name !== 'Custom') {
        window.SWRM.settings.policy = policyFromPresetName(name);
        writePolicyToExpertControls(window.SWRM.settings.policy);
      } else {
        window.SWRM.settings.policy = window.SWRM.mergeEvalPolicy({
          ...window.SWRM.settings.policy,
          preset: 'Custom',
        });
      }
      schedulePolicyReprocess();
    });

    ['policy-anchor-mode', 'policy-slotreq-mode', 'policy-minstats-mod', 'policy-min-pressure'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', () => {
        window.SWRM.settings.policy = readPolicyFromControls();
        schedulePolicyReprocess();
      });
    });
    document.getElementById('policy-god-counts')?.addEventListener('change', () => {
      window.SWRM.settings.policy = readPolicyFromControls();
      schedulePolicyReprocess();
    });
    document.getElementById('policy-duo-counts')?.addEventListener('change', () => {
      window.SWRM.settings.policy = readPolicyFromControls();
      schedulePolicyReprocess();
    });
  }

  window.applySimpleAnalyzerPolicy = applySimpleAnalyzerPolicy;
  window.getDashboardGameStage = getDashboardGameStage;
  window.syncPolicySimplePreview = syncPolicySimplePreview;

  window.swrmOnDashboardStageChanged = function () {
    const dash = document.getElementById('dashboard-policy-strictness');
    const v = dash ? Math.max(1, Math.min(5, parseInt(dash.value, 10) || 3)) : 3;
    applySimpleAnalyzerPolicy(getDashboardGameStage(), v);
    updateDashboardStrictnessHints();
    syncPolicySimplePreview();
    refreshPolicySummary();
    schedulePolicyReprocess();
  };

  initPolicyControls();
  initPolicySimpleExpertUx();
  initThresholdPreviewsToggle();
