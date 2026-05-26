// js/features/runes/dashboard.js — dashboard rendering
  // ===================== DASHBOARD =====================
  let swrmAllRunesRev = 0;
  let swrmProcessedRev = 0;
  const dashboardRenderCache = { key: '', built: false };
  let gameStageMetricsCache = { key: '', value: null };

  function invalidateDashboardRenderCache() {
    dashboardRenderCache.key = '';
    dashboardRenderCache.built = false;
  }

  function invalidateGameStageMetricsCache() {
    gameStageMetricsCache.key = '';
    gameStageMetricsCache.value = null;
  }

  function bumpAllRunesRev() {
    swrmAllRunesRev += 1;
    invalidateGameStageMetricsCache();
    invalidateDashboardRenderCache();
  }

  function bumpProcessedRev() {
    swrmProcessedRev += 1;
    invalidateDashboardRenderCache();
  }

  function dashboardRenderCacheKey(runes) {
    const vis = Array.isArray(runes) ? runes : [];
    return [
      swrmAllRunesRev,
      swrmProcessedRev,
      stage,
      globalMinLevel,
      globalGradeMin,
      globalGradeMax,
      currentLang,
      vis.length,
      allRunes.length,
    ].join('\u0001');
  }

  function getCachedGameStageMetrics(runes) {
    const key = `${swrmAllRunesRev}:${Array.isArray(runes) ? runes.length : 0}`;
    if (gameStageMetricsCache.key === key && gameStageMetricsCache.value) {
      return gameStageMetricsCache.value;
    }
    const value = analyzeGameStage(runes);
    gameStageMetricsCache.key = key;
    gameStageMetricsCache.value = value;
    return value;
  }

  function attachForgeScoresToRunes(runes) {
    if (!Array.isArray(runes) || typeof computeRuneScore !== 'function') return;
    for (let i = 0; i < runes.length; i++) {
      const r = runes[i];
      if (!r) continue;
      r.forgeScore = computeRuneScore(r);
    }
  }

  /** Scale so the largest bar uses ~75% of track width (25% headroom). */
  function dashChartScaleMax(counts) {
    const maxV = Math.max(0, ...(counts.length ? counts : [0]));
    if (maxV <= 0) return 1;
    return Math.max(maxV / 0.75, 1);
  }

  function dashChartPct(count, scaleMax) {
    const denom = Math.max(scaleMax, 1);
    return Math.min(100, (Number(count) / denom) * 100);
  }

  function replayDashboardDistributionAnimations() {
    if (typeof readDashboardDistKind === 'function' && readDashboardDistKind() === 'artifacts') {
      if (typeof replayArtifactDashboardAnimations === 'function') {
        return replayArtifactDashboardAnimations();
      }
      return false;
    }
    const motionApi = window.SWRM_MOTION;
    if (!motionApi || !motionApi.enabled()) return false;
    let played = false;
    for (const k of ['verdict', 'roles', 'sets', 'slots', 'eff', 'score']) {
      const pane = document.getElementById(`dash-pane-${k}`);
      if (pane && motionApi.animateDashboardPaneBars(pane)) played = true;
    }
    return played;
  }

  function scheduleDashboardChartReplay(options) {
    const opts = options || {};
    const tabSwitch = !!opts.tabSwitch;
    const fromZero = !!opts.fromZero && !tabSwitch;
    const animateCharts = opts.animateCharts !== false;
    rafTwice(() => {
      const hub = document.getElementById('tab-runes');
      if (hub && hub.classList.contains('hidden')) return;
      const dashPane = document.getElementById('tab-dashboard');
      if (
        dashPane &&
        (dashPane.hidden || !dashPane.classList.contains('is-active'))
      ) {
        return;
      }
      if (typeof readDashboardDistKind === 'function' && readDashboardDistKind() === 'artifacts') {
        if (typeof renderArtifactDashboardDistributions === 'function') {
          renderArtifactDashboardDistributions({ animateCharts, fromZero });
        }
        return;
      }
      if (typeof getVisibleRunes !== 'function' || typeof renderDashboard !== 'function') return;
      const visible = getVisibleRunes();
      const cacheKey = dashboardRenderCacheKey(visible);
      const cacheHit = dashboardRenderCache.built && dashboardRenderCache.key === cacheKey;

      if (tabSwitch && cacheHit) {
        if (animateCharts && replayDashboardDistributionAnimations()) return;
        return;
      }

      if (fromZero) {
        renderDashboard(visible, { animateCharts: true, fromZero: true });
        return;
      }
      if (cacheHit && animateCharts && replayDashboardDistributionAnimations()) return;
      renderDashboard(visible, { animateCharts, fromZero: false });
    });
  }

  function renderDashboard(runes, opts) {
    const o = opts || {};
    const animateCharts = !!o.animateCharts;
    const chartFromZero = !!o.fromZero;
    const cacheKey = dashboardRenderCacheKey(runes);
    if (o.skipIfCached && dashboardRenderCache.built && dashboardRenderCache.key === cacheKey) {
      if (animateCharts) {
        rafTwice(() => {
          if (!replayDashboardDistributionAnimations()) {
            renderDashboard(runes, { ...o, skipIfCached: false, animateCharts: true });
          }
        });
      }
      return;
    }

    // Account progression: full export rune list (cached while allRunes unchanged).
    const metrics = getCachedGameStageMetrics(allRunes);
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const recStage = getRecommendedStage(
      parseFloat(metrics.score),
      metrics.stageMidMin,
      metrics.stageLateMin
    );

    const metricHr = document.getElementById('metric-val-highroll');
    const metricKe = document.getElementById('metric-val-keepeff');
    const metricMe = document.getElementById('metric-val-meta');
    const recDisp = document.getElementById('recommended-stage-display');
    const scoreInline = document.getElementById('lbl-stage-score-inline');
    const scoreFootnote = document.getElementById('lbl-stage-score-footnote');
    const mismatchLine = document.getElementById('stage-mismatch-line');
    const noEligLine = document.getElementById('stage-noeligible-line');

    const hasProg = !!(allRunes.length && metrics.runeCount);

    if (metricHr) {
      metricHr.textContent = metrics.runeCount ? String(metrics.spdDepthCount) : '\u2014';
    }
    if (metricKe) {
      metricKe.textContent = metrics.runeCount ? String(metrics.plus15DepthCount) : '\u2014';
    }
    if (metricMe) {
      if (metrics.runeCount) {
        const tmpl = tloc.stageEliteValFormat || '{eff}% (n={n})';
        metricMe.textContent = tmpl.replace('{eff}', metrics.eliteAvgEff).replace('{n}', String(metrics.eliteSampleSize));
      } else {
        metricMe.textContent = '\u2014';
      }
    }

    if (recDisp) {
      recDisp.textContent =
        allRunes.length && metrics.runeCount ? stageDisplayName(tloc, recStage) : '\u2014';
      recDisp.classList.remove(
        'stage-advisor-suggestion-value--early',
        'stage-advisor-suggestion-value--mid',
        'stage-advisor-suggestion-value--late'
      );
      if (hasProg) {
        const sg = String(recStage || '').toLowerCase();
        if (sg === 'early' || sg === 'mid' || sg === 'late') {
          recDisp.classList.add(`stage-advisor-suggestion-value--${sg}`);
        }
      }
    }

    if (scoreInline) {
      scoreInline.classList.remove('stage-score-inline--early', 'stage-score-inline--mid', 'stage-score-inline--late');
      if (!hasProg) {
        scoreInline.textContent = '';
        scoreInline.hidden = true;
      } else {
        scoreInline.hidden = false;
        const label = tloc.stageScoreLabel || 'Combined score';
        const bandsTpl = String(tloc.stageScoreInlineBandsTpl || 'Mid from {mid}, Late from {late}').trim();
        const bands = bandsTpl
          .replace(/\{mid\}/g, String(metrics.stageMidMin))
          .replace(/\{late\}/g, String(metrics.stageLateMin));
        const strong = document.createElement('strong');
        strong.className = 'stage-advisor-score-inline-num';
        strong.textContent = String(metrics.score);
        scoreInline.replaceChildren(
          document.createTextNode(`${label}: `),
          strong,
          document.createTextNode(` \u00b7 ${bands}`),
        );
        const filtersNote = String(tloc.stageCombinedScoreFootnote || '').trim();
        if (filtersNote) {
          const note = document.createElement('span');
          note.className = 'stage-score-inline-filters-note';
          note.textContent = filtersNote;
          scoreInline.appendChild(note);
        }
        const seg = String(recStage || '').toLowerCase();
        if (seg === 'early' || seg === 'mid' || seg === 'late') {
          scoreInline.classList.add(`stage-score-inline--${seg}`);
        }
      }
    }

    if (scoreFootnote) {
      scoreFootnote.textContent = '';
      scoreFootnote.hidden = true;
    }

    const setMetricTitleName = (spanId, nameTpl) => {
      const el = document.getElementById(spanId);
      const n = String(nameTpl || '').trim();
      if (el && n) el.textContent = n;
    };
    setMetricTitleName('lbl-card-hr-name', tloc.stageCardHrName || '');
    setMetricTitleName('lbl-card-keep-name', tloc.stageCardKeepName || '');
    setMetricTitleName('lbl-card-meta-name', tloc.stageCardMetaName || '');

    const metricsExpl = document.getElementById('lbl-stage-metrics-explainer');
    if (metricsExpl) {
      const raw = tloc.stageMetricsExplainer || '';
      metricsExpl.textContent = raw.split(/\bCard weights:?\s*/i)[0].trim();
    }

    try {
      if (localStorage.getItem(STAGE_PROGRESSION_EXPANDED_KEY) == null) {
        applyStageAdvisorCollapsed(true, { instant: true });
      }
    } catch (e) { /* ignore */ }

    if (noEligLine) {
      const showNoElig = allRunes.length === 0 && processedRunes.length === 0;
      noEligLine.hidden = !showNoElig;
      if (showNoElig) noEligLine.textContent = tloc.stageAdvisorNoEligible || '';
    }

    if (mismatchLine) {
      const showMismatch =
        allRunes.length > 0 &&
        metrics.runeCount > 0 &&
        stage !== recStage;
      mismatchLine.hidden = !showMismatch;
      if (!showMismatch) {
        mismatchLine.textContent = '';
      } else {
        const explain = String(tloc.stageMismatchExplainTpl || '{preset} vs {suggested}. {hint}');
        mismatchLine.textContent = explain
          .replace(/\{preset\}/g, stageDisplayName(tloc, stage))
          .replace(/\{suggested\}/g, stageDisplayName(tloc, recStage))
          .replace(/\{hint\}/g, (tloc.stageMismatchHint || '').trim());
      }
    }

    const tplContrib = tloc.stageMetricContribTpl || '+{pts} / {cap} pts';
    const showContrib = metrics.runeCount > 0;
    [
      ['metric-contrib-spd', 'spdPoints', 'spdCap'],
      ['metric-contrib-plus15', 'plus15Points', 'plus15Cap'],
      ['metric-contrib-elite', 'elitePoints', 'eliteCap'],
    ].forEach(([elId, pk, ck]) => {
      const el = document.getElementById(elId);
      if (!el) return;
      if (showContrib) {
        el.textContent = tplContrib.replace('{pts}', String(metrics[pk])).replace('{cap}', String(metrics[ck]));
        el.hidden = false;
      } else {
        el.textContent = '';
        el.hidden = true;
      }
    });

    /** Custom floating tip on metric cards (Sheets parity text from hidden desc or i18n). */
    const attachMetricCardTooltip = (descId, fallback) => {
      const desc = document.getElementById(descId);
      const card = desc && desc.closest('.stage-metric-card');
      if (!card) return;
      let tip = String(desc.textContent || '').replace(/\s+/g, ' ').trim();
      if (!tip) tip = String(fallback || '').replace(/\s+/g, ' ').trim();
      const targets = [
        card,
        ...card.querySelectorAll('.stage-metric-card-head, .stage-metric-val, .stage-metric-contrib, .stage-metric-weight, .stage-metric-icon'),
      ];
      targets.forEach((node) => {
        if (!node) return;
        setSwrmFloatTipTarget(node, tip);
      });
    };
    attachMetricCardTooltip('lbl-card-hr-desc', tloc.stageCardHrDesc || '');
    attachMetricCardTooltip('lbl-card-keep-desc', tloc.stageCardKeepDesc || '');
    attachMetricCardTooltip('lbl-card-meta-desc', tloc.stageCardMetaDesc || '');

    syncGameStageVisualClasses(stage, recStage, hasProg);

    const agg = aggregateDashboardRunes(runes);
    const {
      counts,
      roleCounts,
      roleEff,
      setCounts,
      setEff,
      effBuckets,
      scoreBuckets,
      medianEff,
      medianScore,
      verdictEff,
    } = agg;

    const setOrder = getDashboardSetDisplayOrder(setCounts);

    const total = runes.length;

    const accCt = document.getElementById('dashboard-account-run-count');
    if (accCt) {
      const tpl = (tloc.dashboardAccountRunesInline || 'Total: {acc} · Current: {view}').trim();
      accCt.textContent = tpl
        .replace(/\{acc\}/g, String(allRunes.length))
        .replace(/\{view\}/g, String(total));
    }

    let oldRectsVerdict = null;
    let oldRectsRoles = null;
    let oldRectsSets = null;

    let verdictBarTargets = null;
    let roleBarTargets = null;
    let setBarTargets = null;
    let effBarTargets = null;
    let scoreBarTargets = null;
    let slotShareAnimTargets = null;

    const verdictChartEl = document.getElementById('verdict-chart');
    if (verdictChartEl) {
      oldRectsVerdict = animateCharts ? snapshotKeyedRowRects(verdictChartEl, 'data-dash-verdict') : null;
      const prevVerdictW =
        animateCharts && !chartFromZero
          ? snapshotRowBarWidthMap(verdictChartEl, 'data-dash-verdict')
          : new Map();
      verdictChartEl.innerHTML = '';
      const vRows = [];
      DASH_VERDICT_SEG_ORDER.forEach((v) => {
        const c = counts[v] || 0;
        if (c > 0) vRows.push({ v, c });
      });
      vRows.sort((a, b) => {
        if (b.c !== a.c) return b.c - a.c;
        return DASH_VERDICT_SEG_ORDER.indexOf(a.v) - DASH_VERDICT_SEG_ORDER.indexOf(b.v);
      });
      const verdictScale = dashChartScaleMax(vRows.map((x) => x.c));
      verdictBarTargets = new Map();
      const openHint = String((tloc.dashboardOpenTableHint || '').trim());
      for (let i = 0; i < vRows.length; i++) {
        const { v, c } = vRows[i];
        const avgMu = verdictMeanEff(verdictEff, v);
        const avg =
          c > 0 && avgMu != null && Number.isFinite(avgMu) ? avgMu.toFixed(1) : '-';
        const pct = dashChartPct(c, verdictScale).toFixed(1);
        const pctNum = parseFloat(pct);
        verdictBarTargets.set(v, pctNum);
        const startPct = !animateCharts ? pctNum : chartFromZero ? 0 : prevVerdictW.has(v) ? prevVerdictW.get(v) : 0;
        const lblRaw = verdictUiLabel(tloc, v);
        const lbl = escapeHtml(lblRaw);
        const bg = DASH_VERDICT_SEG_CSS[v] || '#888';
        const titleRaw = openHint ? `${lblRaw}: ${c}. ${openHint}` : `${lblRaw}: ${c}`;
        const titleAttr = escapeHtml(titleRaw);
        verdictChartEl.innerHTML += `
        <div class="chart-row chart-row--clickable chart-row--verdict" role="button" tabindex="0" data-dash-verdict="${escapeHtml(v)}" title="${titleAttr}">
          <div class="chart-label">${lbl}</div>
          ${chartBarTrackHtmlVerdict(pct, bg, animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(c, avg, tloc)}
        </div>`;
      }
    }

    const roleEl = document.getElementById('role-chart');
    if (roleEl) {
      oldRectsRoles = animateCharts ? snapshotKeyedRowRects(roleEl, 'data-dash-role') : null;
      const prevRoleW =
        animateCharts && !chartFromZero ? snapshotRowBarWidthMap(roleEl, 'data-dash-role') : new Map();
      roleEl.innerHTML = '';
      const sortedRoles = Object.keys(roleCounts).sort((a, b) => (roleCounts[b] || 0) - (roleCounts[a] || 0));
      const roleScale = dashChartScaleMax(sortedRoles.map((rr) => roleCounts[rr] || 0));
      roleBarTargets = new Map();
      for (const role of sortedRoles) {
        const cnt = roleCounts[role] || 0;
        const avg = roleEff[role]
          ? (roleEff[role].reduce((a, b) => a + b, 0) / roleEff[role].length).toFixed(1)
          : '-';
        const pct = dashChartPct(cnt, roleScale).toFixed(1);
        const pctNum = parseFloat(pct);
        roleBarTargets.set(role, pctNum);
        const startPct = !animateCharts ? pctNum : chartFromZero ? 0 : prevRoleW.has(role) ? prevRoleW.get(role) : 0;
        const er = escapeHtml(role);
        roleEl.innerHTML += `
        <div class="chart-row chart-row--clickable" role="button" tabindex="0" data-dash-role="${er}">
          <div class="chart-label">${er}</div>
          ${chartBarTrackHtml(pct, 'chart-bar--roles', animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(cnt, avg, tloc)}
        </div>`;
      }
    }

    const setEl = document.getElementById('set-chart');
    if (setEl) {
      oldRectsSets = animateCharts ? snapshotKeyedRowRects(setEl, 'data-dash-set') : null;
      const prevSetW =
        animateCharts && !chartFromZero ? snapshotRowBarWidthMap(setEl, 'data-dash-set') : new Map();
      setEl.innerHTML = '';
      const setScale = dashChartScaleMax(setOrder.map((nm) => setCounts[nm] || 0));
      setBarTargets = new Map();
      const openHintSets = String((tloc.dashboardOpenTableHint || '').trim());
      for (const name of setOrder) {
        const cnt = setCounts[name] || 0;
        const effList = setEff[name];
        const avg =
          effList && effList.length
            ? (effList.reduce((a, b) => a + b, 0) / effList.length).toFixed(1)
            : '-';
        const pct = dashChartPct(cnt, setScale).toFixed(1);
        const pctNum = parseFloat(pct);
        const enc = encodeURIComponent(name);
        setBarTargets.set(enc, pctNum);
        const startPct = !animateCharts ? pctNum : chartFromZero ? 0 : prevSetW.has(enc) ? prevSetW.get(enc) : 0;
        const en = escapeHtml(name);
        const encAttr = escapeHtml(enc);
        const titleRaw = openHintSets ? `${name}: ${cnt}. ${openHintSets}` : `${name}: ${cnt}`;
        const titleAttr = escapeHtml(titleRaw);
        setEl.innerHTML += `
        <div class="chart-row chart-row--clickable chart-row--set" role="button" tabindex="0" data-dash-set="${encAttr}" title="${titleAttr}">
          <div class="chart-label">${en}</div>
          ${chartBarTrackHtml(pct, 'chart-bar--sets', animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(cnt, avg, tloc)}
        </div>`;
      }
    }

    const slotCardsRoot = document.getElementById('slot-main-cards-root');
    const pivot = buildSlotMainPivot(runes);
    slotShareAnimTargets = renderSlotMainCards(slotCardsRoot, pivot, tloc, { animateCharts });

    let savedSet = null;
    try {
      if (localStorage.getItem(TOP_SPD_STORAGE_KEY) !== null) {
        savedSet = localStorage.getItem(TOP_SPD_STORAGE_KEY);
      }
    } catch (e) { /* ignore */ }
    const spdSel = document.getElementById('top-spd-set-select');
    fillTopSpdSetSelect(spdSel, setOrder, tloc, savedSet);
    const spdPick = spdSel && spdSel.value ? spdSel.value : '';
    renderTopSpdPanel(runes, spdPick, tloc, { animate: false });

    const effEl = document.getElementById('eff-chart');
    const prevEffHeights =
      animateCharts && effEl && !chartFromZero ? snapshotEffBarHeights(effEl) : null;
    if (effEl) effEl.innerHTML = '';
    const maxBucket = Math.max(...effBuckets, 1);
    const medEff = medianEff;
    const medLine = document.getElementById('eff-median-line');
    const medianTipTpl = tloc.effMedianCaption || 'Median Ingame Score (filtered): {pct}';
    const xMin = agg.effXMin || 0;
    const xMax = agg.effXMax || 100;
    const binSize = agg.effBinSize || 5;
    const binCount = agg.effBinCount || 20;
    const range = xMax - xMin;
    
    if (medEff != null && runes.length) {
      const pos = Math.min(100, Math.max(0, ((medEff - xMin) / range) * 100));
      if (medLine) {
        medLine.style.left = `calc(${pos}% - 1px)`;
        medLine.hidden = false;
        medLine.setAttribute('aria-hidden', 'false');
        const tip = medianTipTpl.replace('{pct}', medEff.toFixed(1));
        medLine.setAttribute('aria-label', tip);
        setSwrmFloatTipTarget(medLine, tip);
      }
    } else if (medLine) {
      medLine.hidden = true;
      medLine.setAttribute('aria-hidden', 'true');
      medLine.removeAttribute('aria-label');
      setSwrmFloatTipTarget(medLine, '');
    }
    if (effEl) {
      effBarTargets = [];
      for (let i = 0; i < binCount; i++) {
        const h = Math.max(4, (effBuckets[i] / maxBucket) * 80);
        effBarTargets[i] = h;
        const h0 = !animateCharts ? h : chartFromZero ? 0 : prevEffHeights && prevEffHeights[i] != null ? prevEffHeights[i] : 0;
        const labelStart = xMin + i * binSize;
        const labelEnd = labelStart + binSize - 1;
        const label = `${labelStart}-${labelEnd}`;
        const cls = i >= binCount - 2 ? 'great' : i >= binCount - 4 ? 'good' : '';
        effEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}: ${effBuckets[i]} runes">
          <div class="eff-bar ${cls}" style="height:${h0}px"></div>
          <div class="eff-label">${labelStart}</div>
        </div>`;
      }
    }

    const scoreEl = document.getElementById('score-chart');
    const prevScoreHeights =
      animateCharts && scoreEl && !chartFromZero ? snapshotEffBarHeights(scoreEl) : null;
    if (scoreEl) scoreEl.innerHTML = '';
    const maxScoreBucket = Math.max(...(scoreBuckets || []), 1);
    const medScore = medianScore;
    const medScoreLine = document.getElementById('score-median-line');
    const medianScoreTipTpl = tloc.scoreMedianCaption || 'Median Forge Score (filtered): {score}';
    if (medScore != null && runes.length) {
      const pos = Math.min(100, Math.max(0, medScore));
      if (medScoreLine) {
        medScoreLine.style.left = `calc(${pos}% - 1px)`;
        medScoreLine.hidden = false;
        medScoreLine.setAttribute('aria-hidden', 'false');
        const tip = medianScoreTipTpl.replace('{score}', String(Math.round(medScore)));
        medScoreLine.setAttribute('aria-label', tip);
        setSwrmFloatTipTarget(medScoreLine, tip);
      }
    } else if (medScoreLine) {
      medScoreLine.hidden = true;
      medScoreLine.setAttribute('aria-hidden', 'true');
      medScoreLine.removeAttribute('aria-label');
      setSwrmFloatTipTarget(medScoreLine, '');
    }
    if (scoreEl && scoreBuckets) {
      scoreBarTargets = [];
      for (let i = 0; i < 20; i++) {
        const h = Math.max(4, (scoreBuckets[i] / maxScoreBucket) * 80);
        scoreBarTargets[i] = h;
        const h0 = !animateCharts ? h : chartFromZero ? 0 : prevScoreHeights && prevScoreHeights[i] != null ? prevScoreHeights[i] : 0;
        const label = `${i * 5}-${i * 5 + 4}`;
        const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
        scoreEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}: ${scoreBuckets[i]} runes">
          <div class="eff-bar eff-bar--score ${cls}" style="height:${h0}px"></div>
          <div class="eff-label">${i * 5}</div>
        </div>`;
      }
    }

    if (animateCharts) {
      rafTwice(() => {
        const mv = verdictChartEl
          ? collectChartRowFlipMoves(verdictChartEl, 'data-dash-verdict', oldRectsVerdict)
          : [];
        const mr = roleEl ? collectChartRowFlipMoves(roleEl, 'data-dash-role', oldRectsRoles) : [];
        const ms = setEl ? collectChartRowFlipMoves(setEl, 'data-dash-set', oldRectsSets) : [];
        const allFlip = [...mv, ...mr, ...ms];

        const applyBarAndEffTargets = () => {
          const motionApi = window.SWRM_MOTION;
          const useGsap = motionApi && motionApi.enabled();
          const barEntries = [];
          const heightEntries = [];

          const collectBarMap = (container, attr, map) => {
            if (!container || !map || !map.size) return;
            const safe = String(attr).replace(/"/g, '');
            container.querySelectorAll(`[${safe}]`).forEach((row) => {
              const k = row.getAttribute(safe);
              if (k == null || !map.has(k)) return;
              const fill = row.querySelector('.chart-bar-fill');
              const v = map.get(k);
              if (!fill || !Number.isFinite(v)) return;
              if (useGsap) barEntries.push({ el: fill, pct: v });
              else fill.style.width = `${Number(v).toFixed(1)}%`;
            });
          };

          collectBarMap(verdictChartEl, 'data-dash-verdict', verdictBarTargets);
          collectBarMap(roleEl, 'data-dash-role', roleBarTargets);
          collectBarMap(setEl, 'data-dash-set', setBarTargets);

          if (effEl && effBarTargets && effBarTargets.length) {
            const bars = effEl.querySelectorAll('.eff-bar');
            bars.forEach((bar, i) => {
              if (effBarTargets[i] == null) return;
              const px = `${effBarTargets[i]}px`;
              if (useGsap) heightEntries.push({ el: bar, value: px });
              else bar.style.height = px;
            });
          }

          if (scoreEl && scoreBarTargets && scoreBarTargets.length) {
            const bars = scoreEl.querySelectorAll('.eff-bar');
            bars.forEach((bar, i) => {
              if (scoreBarTargets[i] == null) return;
              const px = `${scoreBarTargets[i]}px`;
              if (useGsap) heightEntries.push({ el: bar, value: px });
              else bar.style.height = px;
            });
          }

          if (slotCardsRoot && slotShareAnimTargets && slotShareAnimTargets.size) {
            slotCardsRoot.querySelectorAll('.slot-share-cell[data-slot]').forEach((cell) => {
              const s = cell.getAttribute('data-slot');
              const fill = cell.querySelector('.slot-share-bar-fill');
              if (!fill || !s || !slotShareAnimTargets.has(s)) return;
              const pct = `${slotShareAnimTargets.get(s)}%`;
              if (useGsap) heightEntries.push({ el: fill, value: pct });
              else fill.style.height = pct;
            });
          }

          if (useGsap) {
            motionApi.animateBarWidthFills(barEntries);
            motionApi.animateHeightFills(heightEntries);
          }
        };

        if (allFlip.length) {
          requestAnimationFrame(() => {
            playChartRowFlipMoves(allFlip);
            applyBarAndEffTargets();
          });
        } else {
          applyBarAndEffTargets();
        }
      });
    }

    dashboardRenderCache.key = cacheKey;
    dashboardRenderCache.built = allRunes.length > 0;

    if (typeof renderArtifactDashboardDistributions === 'function') {
      renderArtifactDashboardDistributions({ animateCharts: false, skipIfCached: true });
    }
  }

  function setText(id, val, sel) {
    const el = document.querySelector(`#${id} ${sel}`);
    if (el) el.textContent = val;
  }
