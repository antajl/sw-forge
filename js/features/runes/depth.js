// js/features/runes/depth.js — account progression scoring
  // ===================== GAME STAGE ANALYSIS (Depth v2) =====================
  /**
   * Absolute depth metrics over the full exported rune list (Rare+ as in SWEX parse, rank ≥3).
   * Does not use Mid processing or verdicts.
   */
  function analyzeGameStage(runes) {
    // ----- Depth v2 tuning: edit all knobs here -----
    const CFG = {
      spdSubMin: 18,
      spdDepthCap: 250,
      spdDepthWeight: 35,
      plus15DepthCap: 600,
      plus15DepthWeight: 35,
      eliteTopN: 50,
      eliteEffBaseline: 80,
      eliteEffSpan: 30,
      eliteWeight: 30,
      stageMidMin: 45,
      stageLateMin: 85,
    };

    const effUncapped = window.SWRM.calcEfficiencyUncapped;

    function runeSpdSubTotal(r) {
      let s = 0;
      for (const sub of r.substats || []) {
        if (sub.name === 'SPD') s += subLineTotal(sub);
      }
      return s;
    }

    const list = Array.isArray(runes) ? runes : [];
    if (list.length === 0) {
      return {
        spdDepthCount: 0,
        plus15DepthCount: 0,
        eliteAvgEff: '0.0',
        eliteSampleSize: 0,
        score: '0.0',
        runeCount: 0,
        stageMidMin: CFG.stageMidMin,
        stageLateMin: CFG.stageLateMin,
        spdPoints: '0.0',
        plus15Points: '0.0',
        elitePoints: '0.0',
        spdCap: CFG.spdDepthWeight,
        plus15Cap: CFG.plus15DepthWeight,
        eliteCap: CFG.eliteWeight,
      };
    }

    let spdDepthCount = 0;
    let plus15DepthCount = 0;
    for (const r of list) {
      if (runeSpdSubTotal(r) >= CFG.spdSubMin) spdDepthCount++;
      const stars = r.stars;
      const starsNum = typeof stars === 'number' ? stars : parseInt(String(stars), 10);
      if (starsNum === 6 && (r.level | 0) === 15) plus15DepthCount++;
    }

    const effScores = [];
    for (const r of list) {
      effScores.push(effUncapped ? effUncapped(r) : r.eff || 0);
    }
    effScores.sort((a, b) => b - a);
    const eliteK = Math.min(CFG.eliteTopN, effScores.length);
    let eliteAvgUncapped = 0;
    if (eliteK > 0) {
      let sumE = 0;
      for (let i = 0; i < eliteK; i++) sumE += effScores[i];
      eliteAvgUncapped = sumE / eliteK;
    }

    const spdNorm = Math.min(spdDepthCount / CFG.spdDepthCap, 1);
    const plus15Norm = Math.min(plus15DepthCount / CFG.plus15DepthCap, 1);
    const eliteEffExcess = Math.max(0, eliteAvgUncapped - CFG.eliteEffBaseline);
    const eliteNorm = Math.min(eliteEffExcess / CFG.eliteEffSpan, 1);

    const spdPoints = spdNorm * CFG.spdDepthWeight;
    const plus15Points = plus15Norm * CFG.plus15DepthWeight;
    const elitePoints = eliteNorm * CFG.eliteWeight;

    const scoreVal = spdPoints + plus15Points + elitePoints;
    const scoreRounded = Math.round(scoreVal * 10) / 10;

    return {
      spdDepthCount,
      plus15DepthCount,
      eliteAvgEff: eliteAvgUncapped.toFixed(1),
      eliteSampleSize: eliteK,
      score: scoreRounded.toFixed(1),
      runeCount: list.length,
      stageMidMin: CFG.stageMidMin,
      stageLateMin: CFG.stageLateMin,
      spdPoints: (Math.round(spdPoints * 10) / 10).toFixed(1),
      plus15Points: (Math.round(plus15Points * 10) / 10).toFixed(1),
      elitePoints: (Math.round(elitePoints * 10) / 10).toFixed(1),
      spdCap: CFG.spdDepthWeight,
      plus15Cap: CFG.plus15DepthWeight,
      eliteCap: CFG.eliteWeight,
    };
  }

  function getRecommendedStage(score, midMin = 45, lateMin = 85) {
    if (score >= lateMin) return 'Late';
    if (score >= midMin) return 'Mid';
    return 'Early';
  }

  const DASH_VERDICT_SEG_ORDER = ['Keep', 'Finish', 'Upgrade', 'Gem', 'Grind', 'Reapp', 'Sell'];
  const DASH_VERDICT_SEG_CSS = {
    Keep: 'var(--tint-keep)',
    Finish: 'var(--tint-finish)',
    Upgrade: 'var(--tint-upgrade)',
    Gem: 'var(--tint-gem)',
    Grind: 'var(--tint-grind)',
    Reapp: 'var(--tint-reapp)',
    Sell: 'var(--tint-sell)',
  };

  /** Sort verdict keys by count (desc), then stable tie-break using DASH_VERDICT_SEG_ORDER. */
  function sortVerdictKeysByCount(counts) {
    return [...DASH_VERDICT_SEG_ORDER].sort((a, b) => {
      const ca = counts[a] || 0;
      const cb = counts[b] || 0;
      if (cb !== ca) return cb - ca;
      return DASH_VERDICT_SEG_ORDER.indexOf(a) - DASH_VERDICT_SEG_ORDER.indexOf(b);
    });
  }

  function setStatCard(id, count, total, hidePct, avgEff) {
    const wrap = document.getElementById(id);
    if (!wrap) return;
    const v = wrap.querySelector('.sc-value');
    const p = wrap.querySelector('.sc-pct');
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const avgPx = String(tloc.dashboardVerdictAvgPrefix || 'avg').trim();
    const pctNum = total ? Math.round((count / total) * 1000) / 10 : 0;
    const hasAvg =
      !hidePct &&
      total > 0 &&
      count > 0 &&
      avgEff != null &&
      Number.isFinite(avgEff);
    if (v) {
      if (hidePct || !total) {
        v.textContent = String(count);
      } else if (hasAvg) {
        v.textContent = `${count} (${pctNum}%) · ${avgPx} ${avgEff.toFixed(1)}%`;
      } else {
        v.textContent = `${count} (${pctNum}%)`;
      }
    }
    if (p) {
      p.textContent = '';
    }
  }

  function dashboardGradeRangeSummary(t) {
    const tr = (k, fb) => (t && t[k]) || fb;
    const r = tr('dashboardGradeOptRare', 'Rare');
    const h = tr('dashboardGradeOptHero', 'Hero');
    const l = tr('dashboardGradeOptLegend', 'Legend');
    const name = (n) => (n === 3 ? r : n === 4 ? h : l);
    if (globalGradeMin === globalGradeMax) return String(name(globalGradeMin));
    return `${name(globalGradeMin)}\u2013${name(globalGradeMax)}`;
  }

  function syncDashboardGradeRangeSelects() {
    const selMin = document.getElementById('global-grade-min');
    const selMax = document.getElementById('global-grade-max');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const opt = (val) => {
      let txt = String(val);
      if (val === 3) txt = t.dashboardGradeOptRare || 'Rare';
      else if (val === 4) txt = t.dashboardGradeOptHero || 'Hero';
      else if (val === 5) txt = t.dashboardGradeOptLegend || 'Legend';
      return `<option value="${val}">${escapeHtml(txt)}</option>`;
    };
    const optsHtml = [3, 4, 5].map((v) => opt(v)).join('');
    if (selMin) {
      selMin.innerHTML = optsHtml;
      selMin.value = String(Math.min(5, Math.max(3, globalGradeMin)));
    }
    if (selMax) {
      selMax.innerHTML = optsHtml;
      selMax.value = String(Math.min(5, Math.max(3, globalGradeMax)));
    }
    globalGradeMin = parseInt(selMin && selMin.value, 10) || globalGradeMin;
    globalGradeMax = parseInt(selMax && selMax.value, 10) || globalGradeMax;
    if (globalGradeMin > globalGradeMax) {
      const x = globalGradeMin;
      globalGradeMin = globalGradeMax;
      globalGradeMax = x;
      if (selMin) selMin.value = String(globalGradeMin);
      if (selMax) selMax.value = String(globalGradeMax);
    }
  }

  /** Full game roster + unknown exporter sets; ordered by count high→low (ties A→Z). */
  function getDashboardSetDisplayOrder(setCounts) {
    const raw = Object.values((window.SWRM && window.SWRM.SET_NAMES) || {});
    const uniqKnown = [...new Set(raw)];
    const knownSet = new Set(uniqKnown);
    const extras = Object.keys(setCounts || {}).filter((x) => x && !knownSet.has(x));
    const all = uniqKnown.concat(extras);
    const sc = setCounts || {};
    all.sort((a, b) => {
      const ca = sc[a] || 0;
      const cb = sc[b] || 0;
      if (cb !== ca) return cb - ca;
      return String(a).localeCompare(String(b));
    });
    return all;
  }

  function aggregateDashboardRunes(runes) {
    const counts = { Keep: 0, Sell: 0, Grind: 0, Finish: 0, Reapp: 0, Upgrade: 0, Gem: 0 };
    const roleCounts = {};
    const roleEff = {};
    const setCounts = {};
    const setEff = {};
    const slotCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const slotEff = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    const slotMain = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {} };
    const effBuckets = new Array(20).fill(0);
    const effVals = [];
    const verdictEff = {};
    for (let i = 0; i < runes.length; i++) {
      const r = runes[i];
      counts[r.verdict] = (counts[r.verdict] || 0) + 1;
      const rv = r.verdict || '';
      if (rv) {
        verdictEff[rv] = verdictEff[rv] || [];
        verdictEff[rv].push(Number.isFinite(r.eff) ? r.eff : 0);
      }
      if (r.role) {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        roleEff[r.role] = roleEff[r.role] || [];
        roleEff[r.role].push(r.eff);
      }
      setCounts[r.setName] = (setCounts[r.setName] || 0) + 1;
      setEff[r.setName] = setEff[r.setName] || [];
      setEff[r.setName].push(r.eff);
      const eff = Number.isFinite(r.eff) ? r.eff : 0;
      slotCounts[r.slot] = (slotCounts[r.slot] || 0) + 1;
      slotMain[r.slot][r.mainName] = (slotMain[r.slot][r.mainName] || 0) + 1;
      const si =
        typeof r.slot === 'number' && Number.isFinite(r.slot)
          ? r.slot
          : parseInt(String(r.slot), 10);
      if (si >= 1 && si <= 6 && !Number.isNaN(si)) slotEff[si].push(eff);
      effVals.push(eff);
      effBuckets[Math.min(19, Math.floor(eff / 5))]++;
    }
    effVals.sort((a, b) => a - b);
    return {
      counts,
      roleCounts,
      roleEff,
      setCounts,
      setEff,
      slotCounts,
      slotEff,
      slotMain,
      effBuckets,
      medianEff: medianSorted(effVals),
      verdictEff,
    };
  }

  function verdictMeanEff(verdictEff, verdictKey) {
    const a = verdictEff && verdictEff[verdictKey];
    if (!a || !a.length) return null;
    return a.reduce((x, y) => x + y, 0) / a.length;
  }

  function getDashboardExportText() {
    const vis = getVisibleRunes();
    const agg = aggregateDashboardRunes(vis);
    const metrics = analyzeGameStage(allRunes);
    const recStage = getRecommendedStage(
      parseFloat(metrics.score),
      metrics.stageMidMin,
      metrics.stageLateMin
    );
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const lines = [];
    lines.push(String(t.title || 'SW Rune Master'));
    lines.push(`${t.stageYourPresetLabel || 'Preset'}: ${stage}`);
    lines.push(
      `${t.stageSuggestedLabel || 'Suggested'}: ${stageDisplayName(t, recStage)} · ${t.stageScoreLabel || 'Score'} ${metrics.score} ` +
        `(+${metrics.spdPoints}/${metrics.spdCap} +${metrics.plus15Points}/${metrics.plus15Cap} +${metrics.elitePoints}/${metrics.eliteCap})`
    );
    lines.push(
      `${t.stageCardHrName || 'SPD depth'}: ${metrics.spdDepthCount}, ${t.stageCardKeepName || '+15'}: ${metrics.plus15DepthCount}, ${t.stageCardMetaName || 'Elite'}: ${metrics.eliteAvgEff}% (${metrics.eliteSampleSize})`
    );
    const gradeLine = `${t.dashboardGradeRangeInExport || 'Grades'}: ${dashboardGradeRangeSummary(t)}`;
    lines.push(`${t.dashboardScopeTitle || 'Filter'}: ${t.minLvl || 'Min Lvl'} +${globalMinLevel}, ${gradeLine}`);
    lines.push(
      `${(t.dashboardExportTotalCurrent || 'Total {acc} · Current {view}')
        .replace(/\{acc\}/g, String(allRunes.length))
        .replace(/\{view\}/g, String(vis.length))}`,
    );

    lines.push('');
    lines.push(t.dashboardVerdictMixTitle || 'Verdict distribution');
    const avgPx = String(t.dashboardVerdictAvgPrefix || 'avg').trim();
    sortVerdictKeysByCount(agg.counts).forEach((k) => {
      const c = agg.counts[k] || 0;
      const pct = vis.length ? Math.round((c / vis.length) * 1000) / 10 : 0;
      const mu = verdictMeanEff(agg.verdictEff, k);
      const avgBit =
        c > 0 && mu != null && Number.isFinite(mu) ? ` · ${avgPx} ${mu.toFixed(1)}%` : '';
      lines.push(`  ${k}: ${c} (${pct}%)${avgBit}`);
    });

    lines.push('');
    lines.push(t.roleDistribution || 'Role distribution');
    const sortedRoles = Object.keys(agg.roleCounts).sort((a, b) => (agg.roleCounts[b] || 0) - (agg.roleCounts[a] || 0));
    sortedRoles.forEach((role) => {
      const cnt = agg.roleCounts[role] || 0;
      const avg = agg.roleEff[role]
        ? (agg.roleEff[role].reduce((a, b) => a + b, 0) / agg.roleEff[role].length).toFixed(1)
        : '-';
      lines.push(`  ${role}: ${cnt} · avg ${avg}%`);
    });

    lines.push('');
    lines.push(t.setDistribution || 'Set distribution');
    getDashboardSetDisplayOrder(agg.setCounts).forEach((name) => {
      const cnt = agg.setCounts[name] || 0;
      const se = agg.setEff[name];
      const avg = se && se.length
        ? (se.reduce((a, b) => a + b, 0) / se.length).toFixed(1)
        : '-';
      lines.push(`  ${name}: ${cnt} · avg ${avg}%`);
    });

    lines.push('');
    lines.push(t.dashboardSlotMatrixTitle || 'Slot × main distribution');
    const slotLabelTmpl = String(t.dashboardTopSpdSlotLabel || 'Slot {n}').trim();
    const slotAvgPx = String(t.dashboardChartLblAvg || t.dashboardVerdictAvgPrefix || 'avg').trim();
    for (let s = 1; s <= 6; s++) {
      const cnt = agg.slotCounts[s] || 0;
      const list = agg.slotEff[s] || [];
      const avgStr = list.length
        ? (list.reduce((a, b) => a + b, 0) / list.length).toFixed(1)
        : '-';
      lines.push(`  ${slotLabelTmpl.replace('{n}', String(s))}: ${cnt} · ${slotAvgPx} ${avgStr}%`);
    }

    lines.push('');
    lines.push(t.efficiencyDistribution || 'Efficiency Distribution');
    if (agg.medianEff != null && vis.length) {
      lines.push(`  ${(t.effMedianCaption || '').replace('{pct}', agg.medianEff.toFixed(1))}`);
    }
    lines.push(`  ${t.dashboardExportEffBuckets || 'Histogram (5% buckets):'}`);
    let anyBucket = false;
    for (let i = 0; i < 20; i++) {
      if (!agg.effBuckets[i]) continue;
      anyBucket = true;
      lines.push(`    ${i * 5}-${i * 5 + 4}%: ${agg.effBuckets[i]}`);
    }
    if (!anyBucket) lines.push(`    —`);

    lines.push('');
    lines.push(`${t.footerVersionLabel || 'Build'}: ${(window.SWRM && window.SWRM.APP_VERSION) || ''}`);

    return lines.join('\n');
  }
