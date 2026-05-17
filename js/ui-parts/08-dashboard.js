// ui-parts/08-dashboard.js — slice of ui.monolith.bak.js L2844-3303
  // ===================== DASHBOARD =====================
  function renderDashboard(runes, opts) {
    const animateCharts = !!(opts && opts.animateCharts);
    // Account progression: full export rune list, absolute counts + top-N eff (not affected by preset / Min Lvl).
    const metrics = analyzeGameStage(allRunes);
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
      medianEff,
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
    let slotShareAnimTargets = null;

    const verdictChartEl = document.getElementById('verdict-chart');
    if (verdictChartEl) {
      oldRectsVerdict = animateCharts ? snapshotKeyedRowRects(verdictChartEl, 'data-dash-verdict') : null;
      const prevVerdictW = animateCharts
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
      const maxV = Math.max(...vRows.map((x) => x.c), 1);
      verdictBarTargets = new Map();
      const openHint = String((tloc.dashboardOpenTableHint || '').trim());
      for (let i = 0; i < vRows.length; i++) {
        const { v, c } = vRows[i];
        const avgMu = verdictMeanEff(verdictEff, v);
        const avg =
          c > 0 && avgMu != null && Number.isFinite(avgMu) ? avgMu.toFixed(1) : '-';
        const pct = ((c / maxV) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        verdictBarTargets.set(v, pctNum);
        const startPct = !animateCharts
          ? pctNum
          : prevVerdictW.has(v)
            ? prevVerdictW.get(v)
            : 0;
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
      const prevRoleW = animateCharts ? snapshotRowBarWidthMap(roleEl, 'data-dash-role') : new Map();
      roleEl.innerHTML = '';
      const sortedRoles = Object.keys(roleCounts).sort((a, b) => (roleCounts[b] || 0) - (roleCounts[a] || 0));
      const maxCount = Math.max(...sortedRoles.map((rr) => roleCounts[rr] || 0), 1);
      roleBarTargets = new Map();
      for (const role of sortedRoles) {
        const cnt = roleCounts[role] || 0;
        const avg = roleEff[role]
          ? (roleEff[role].reduce((a, b) => a + b, 0) / roleEff[role].length).toFixed(1)
          : '-';
        const pct = ((cnt / maxCount) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        roleBarTargets.set(role, pctNum);
        const startPct = !animateCharts
          ? pctNum
          : prevRoleW.has(role)
            ? prevRoleW.get(role)
            : 0;
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
      const prevSetW = animateCharts ? snapshotRowBarWidthMap(setEl, 'data-dash-set') : new Map();
      setEl.innerHTML = '';
      const maxSet = Math.max(...setOrder.map((nm) => setCounts[nm] || 0), 1);
      setBarTargets = new Map();
      const openHintSets = String((tloc.dashboardOpenTableHint || '').trim());
      for (const name of setOrder) {
        const cnt = setCounts[name] || 0;
        const effList = setEff[name];
        const avg =
          effList && effList.length
            ? (effList.reduce((a, b) => a + b, 0) / effList.length).toFixed(1)
            : '-';
        const pct = ((cnt / maxSet) * 100).toFixed(1);
        const pctNum = parseFloat(pct);
        const enc = encodeURIComponent(name);
        setBarTargets.set(enc, pctNum);
        const startPct = !animateCharts
          ? pctNum
          : prevSetW.has(enc)
            ? prevSetW.get(enc)
            : 0;
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
    const prevEffHeights = animateCharts && effEl ? snapshotEffBarHeights(effEl) : null;
    if (effEl) effEl.innerHTML = '';
    const maxBucket = Math.max(...effBuckets, 1);
    const medEff = medianEff;
    const medLine = document.getElementById('eff-median-line');
    const medianTipTpl = tloc.effMedianCaption || 'Median efficiency (filtered): {pct}%';
    if (medEff != null && runes.length) {
      const pos = Math.min(100, Math.max(0, medEff));
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
      for (let i = 0; i < 20; i++) {
        const h = Math.max(4, (effBuckets[i] / maxBucket) * 80);
        effBarTargets[i] = h;
        const h0 = !animateCharts
          ? h
          : prevEffHeights && prevEffHeights[i] != null
            ? prevEffHeights[i]
            : 0;
        const label = `${i * 5}-${i * 5 + 4}`;
        const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
        effEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}%: ${effBuckets[i]} runes">
          <div class="eff-bar ${cls}" style="height:${h0}px"></div>
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
  }

  function setText(id, val, sel) {
    const el = document.querySelector(`#${id} ${sel}`);
    if (el) el.textContent = val;
  }
