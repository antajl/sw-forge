// js/features/gear/dashboard-artifacts.js — artifact distribution charts on Dashboard

  const DASH_ART_VERDICT_CSS = { keep: 'var(--tint-keep)', sell: 'var(--tint-sell)' };
  const DASH_ART_GRADE_ORDER = ['Rare', 'Hero', 'Legend'];
  /** SWEX `unit_style` on Type pieces (see parse.js ARTIFACT_ARCHETYPE). */
  const DASH_ART_TYPE_ORDER = [1, 2, 3, 4, 98];
  /** SWEX `attribute` on Attribute pieces (see parse.js ARTIFACT_ELEMENT). */
  const DASH_ART_ATTRIBUTE_ORDER = [1, 2, 3, 4, 5, 98];
  const ARTIFACT_PIECE_ATTRIBUTE = 1;
  const ARTIFACT_PIECE_TYPE = 2;

  function artifactPieceType(a) {
    const pt = Number(a.pieceType != null ? a.pieceType : a.gearType);
    if (pt === ARTIFACT_PIECE_TYPE || pt === ARTIFACT_PIECE_ATTRIBUTE) return pt;
    const slot = Number(a.slot);
    if (slot === 2) return ARTIFACT_PIECE_TYPE;
    if (slot === 1) return ARTIFACT_PIECE_ATTRIBUTE;
    return 0;
  }

  function sortDashRowsByCountDesc(rows) {
    return rows.slice().sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return String(a.label).localeCompare(String(b.label));
    });
  }

  function medianSorted(list) {
    const arr = Array.isArray(list) ? list.slice().sort((a, b) => a - b) : [];
    const n = arr.length;
    if (!n) return null;
    const mid = Math.floor(n / 2);
    return n % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }
  const DASH_ART_FORGE_BIN_SIZE = 0.5;
  const DASH_ART_FORGE_BIN_COUNT = 11;
  const DASH_ART_INGAME_BIN_SIZE = 20;
  const DASH_ART_INGAME_BIN_COUNT = 10;

  let swrmAllArtifactsRev = 0;
  const artifactDashCache = { key: '', built: false };

  function bumpAllArtifactsRev() {
    swrmAllArtifactsRev += 1;
    artifactDashCache.key = '';
    artifactDashCache.built = false;
    if (typeof invalidateDashboardRenderCache === 'function') invalidateDashboardRenderCache();
  }

  function readDashboardDistKind() {
    try {
      const v = localStorage.getItem(DASH_DIST_KIND_KEY);
      if (v === 'artifacts' || v === 'runes') return v;
    } catch (e) { /* ignore */ }
    return 'runes';
  }

  function artifactDashboardCacheKey(artifacts) {
    const list = Array.isArray(artifacts) ? artifacts : [];
    return [swrmAllArtifactsRev, currentLang, list.length].join('\u0001');
  }

  function aggregateArtifactDashboard(artifacts) {
    const grade = { Rare: 0, Hero: 0, Legend: 0 };
    const artifactType = { 1: 0, 2: 0, 3: 0, 4: 0, 98: 0 };
    const attribute = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 98: 0 };
    const verdict = { keep: 0, sell: 0 };
    const role = {};
    const verdictIngame = { keep: [], sell: [] };
    const gradeIngame = {};
    const typeIngame = {};
    const roleIngame = {};
    const attributeIngame = {};
    const forgeScoreBins = new Array(DASH_ART_FORGE_BIN_COUNT).fill(0);
    const ingameScoreBins = new Array(DASH_ART_INGAME_BIN_COUNT).fill(0);
    let typeTotal = 0;
    let attributeTotal = 0;

    for (let i = 0; i < artifacts.length; i++) {
      const a = artifacts[i];
      if (!a) continue;
      const g = String(a.gradeStr || '').trim();
      const ingame = Number(a.artifactIngameScore);
      const hasIngame = Number.isFinite(ingame) && ingame >= 0;
      if (g && Object.prototype.hasOwnProperty.call(grade, g)) {
        grade[g] += 1;
        if (hasIngame) {
          gradeIngame[g] = gradeIngame[g] || [];
          gradeIngame[g].push(ingame);
        }
      }

      if (artifactPieceType(a) === ARTIFACT_PIECE_TYPE) {
        const us = Number(a.unitStyle);
        if (DASH_ART_TYPE_ORDER.includes(us)) {
          artifactType[us] += 1;
          typeTotal += 1;
          if (hasIngame) {
            typeIngame[String(us)] = typeIngame[String(us)] || [];
            typeIngame[String(us)].push(ingame);
          }
        }
      }

      const v = String(a.artifactVerdict || '').toLowerCase();
      if (v === 'keep') {
        verdict.keep += 1;
        if (hasIngame) verdictIngame.keep.push(ingame);
      } else if (v === 'sell') {
        verdict.sell += 1;
        if (hasIngame) verdictIngame.sell.push(ingame);
      }

      const roleName = String(a.artifactRole || 'Unknown').trim() || 'Unknown';
      role[roleName] = (role[roleName] || 0) + 1;
      if (hasIngame) {
        roleIngame[roleName] = roleIngame[roleName] || [];
        roleIngame[roleName].push(ingame);
      }

      if (artifactPieceType(a) === ARTIFACT_PIECE_ATTRIBUTE) {
        const attr = Number(a.attribute);
        if (DASH_ART_ATTRIBUTE_ORDER.includes(attr)) {
          attribute[attr] += 1;
          attributeTotal += 1;
          if (hasIngame) {
            attributeIngame[String(attr)] = attributeIngame[String(attr)] || [];
            attributeIngame[String(attr)].push(ingame);
          }
        }
      }

      const sc =
        typeof window.SWRM.calcArtifactForgeScoreDisplay === 'function'
          ? window.SWRM.calcArtifactForgeScoreDisplay(a)
          : null;
      if (Number.isFinite(sc) && sc >= 0) {
        let bin = Math.floor(sc / DASH_ART_FORGE_BIN_SIZE);
        if (bin >= DASH_ART_FORGE_BIN_COUNT) bin = DASH_ART_FORGE_BIN_COUNT - 1;
        forgeScoreBins[bin] += 1;
      }
      const is = Number(a.artifactIngameScore);
      if (Number.isFinite(is) && is >= 0) {
        let bin = Math.floor(is / DASH_ART_INGAME_BIN_SIZE);
        if (bin >= DASH_ART_INGAME_BIN_COUNT) bin = DASH_ART_INGAME_BIN_COUNT - 1;
        ingameScoreBins[bin] += 1;
      }
    }

    return {
      grade,
      artifactType,
      typeTotal,
      attribute,
      attributeTotal,
      verdict,
      verdictIngame,
      role,
      roleIngame,
      forgeScoreBins,
      ingameScoreBins,
      gradeIngame,
      typeIngame,
      attributeIngame,
    };
  }

  function meanFromList(list) {
    if (!Array.isArray(list) || !list.length) return '-';
    return (list.reduce((sum, n) => sum + n, 0) / list.length).toFixed(1);
  }

  function artifactTypeLabel(tloc, unitStyle) {
    const map = {
      1: tloc.artifactTypeHP || tloc.artifactArchetypeHP || 'HP',
      2: tloc.artifactTypeAttack || tloc.artifactArchetypeAttack || 'Attack',
      3: tloc.artifactTypeDefense || tloc.artifactArchetypeDefense || 'Defense',
      4: tloc.artifactTypeSupport || tloc.artifactArchetypeSupport || 'Support',
      98: tloc.artifactTypeIntangible || 'Intangible',
    };
    return map[unitStyle] || String(unitStyle);
  }

  function artifactAttributeLabel(tloc, attr) {
    const map = {
      1: tloc.artifactAttributeFire || tloc.artifactElementFire || 'Fire',
      2: tloc.artifactAttributeWater || tloc.artifactElementWater || 'Water',
      3: tloc.artifactAttributeWind || tloc.artifactElementWind || 'Wind',
      4: tloc.artifactAttributeLight || tloc.artifactElementLight || 'Light',
      5: tloc.artifactAttributeDark || tloc.artifactElementDark || 'Dark',
      98: tloc.artifactAttributeIntangible || 'Intangible',
    };
    return map[attr] || String(attr);
  }

  function renderArtifactBarRows(el, rows, opts) {
    const o = opts || {};
    const tloc = o.tloc || TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const dataAttr = o.dataAttr || 'data-dash-art-row';
    const defaultFillClass = o.fillClass || 'chart-bar--roles';
    const animateCharts = !!o.animateCharts;
    const chartFromZero = !!o.fromZero;
    const prevW =
      animateCharts && !chartFromZero && el
        ? snapshotRowBarWidthMap(el, dataAttr)
        : new Map();
    if (!el) return new Map();
    el.innerHTML = '';
    const scale = dashChartScaleMax(rows.map((r) => r.count));
    const targets = new Map();
    for (let i = 0; i < rows.length; i++) {
      const { key, label, count, fillClass } = rows[i];
      const pct = dashChartPct(count, scale).toFixed(1);
      const pctNum = parseFloat(pct);
      targets.set(String(key), pctNum);
      const startPct = !animateCharts
        ? pctNum
        : chartFromZero
          ? 0
          : prevW.has(String(key))
            ? prevW.get(String(key))
            : 0;
      const ek = escapeHtml(String(key));
      const elbl = escapeHtml(label);
      const clickDataAttr = o.clickDataAttr || '';
      const clickable = !!(clickDataAttr && o.clickNavigate !== false);
      const rowClasses = clickable ? 'chart-row chart-row--clickable' : 'chart-row';
      const clickAttr =
        clickable && clickDataAttr !== dataAttr ? ` ${clickDataAttr}="${ek}"` : '';
      const ingameByKey = o.ingameByKey || null;
      const ingameVal =
        ingameByKey && Object.prototype.hasOwnProperty.call(ingameByKey, String(key))
          ? ingameByKey[String(key)]
          : undefined;
      const rowFillClass = fillClass || defaultFillClass;
      el.innerHTML += `
        <div class="${rowClasses}" ${dataAttr}="${ek}"${clickAttr}>
          <div class="chart-label">${elbl}</div>
          ${chartBarTrackHtml(pct, rowFillClass, animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(count, ingameVal, tloc)}
        </div>`;
    }
    return targets;
  }

  function renderArtifactVerdictBlock(agg, tloc, opts) {
    const o = opts || {};
    const host = document.getElementById('dash-art-verdict-chart');
    if (!host) return;
    const keep = agg.verdict.keep || 0;
    const sell = agg.verdict.sell || 0;
    const total = keep + sell;
    if (!total) {
      host.innerHTML = '';
      return;
    }

    const keepLbl = tloc.artifactVerdictKeep || 'Keep';
    const sellLbl = tloc.artifactVerdictSell || 'Sell';
    const rows = sortDashRowsByCountDesc([
      { key: 'keep', label: keepLbl, count: keep },
      { key: 'sell', label: sellLbl, count: sell },
    ]).filter((r) => r.count > 0);
    const verdictIngame = {
      keep: meanFromList(agg.verdictIngame.keep),
      sell: meanFromList(agg.verdictIngame.sell),
    };

    host.innerHTML = '';
    const bars = document.createElement('div');
    bars.className = 'dash-artifact-verdict-bars';
    host.appendChild(bars);
    const dataAttr = 'data-dash-art-verdict';
    const scale = dashChartScaleMax(rows.map((r) => r.count));
    const prevW =
      o.animateCharts && !o.fromZero
        ? snapshotRowBarWidthMap(bars, dataAttr)
        : new Map();
    const targets = new Map();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const key = String(r.key);
      const pct = dashChartPct(r.count, scale).toFixed(1);
      const pctNum = parseFloat(pct);
      targets.set(key, pctNum);
      const startPct = !o.animateCharts
        ? pctNum
        : o.fromZero
          ? 0
          : prevW.has(key)
            ? prevW.get(key)
            : 0;
      const bg = DASH_ART_VERDICT_CSS[key] || 'var(--text-dim)';
      bars.innerHTML += `
        <div class="chart-row chart-row--clickable chart-row--verdict" role="button" tabindex="0" ${dataAttr}="${escapeHtml(key)}">
          <div class="chart-label">${escapeHtml(r.label)}</div>
          ${chartBarTrackHtmlVerdict(pct, bg, o.animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(r.count, verdictIngame[key], tloc)}
        </div>`;
    }
    bars.querySelectorAll(`[${dataAttr}]`).forEach((row) => {
      const key = row.getAttribute(dataAttr) || '';
      const fill = row.querySelector('.chart-bar-fill');
      if (!fill || !targets.has(key)) return;
      const pct = targets.get(key);
      if (o.animateCharts && Number.isFinite(pct)) {
        const motionApi = window.SWRM_MOTION;
        if (motionApi && motionApi.enabled()) motionApi.animateBarWidthFills([{ el: fill, pct }]);
        else fill.style.width = `${pct.toFixed(1)}%`;
      }
    });
  }

  function renderArtifactScoreHistogram(el, buckets, opts) {
    const o = opts || {};
    if (!el) return [];
    const animateCharts = !!o.animateCharts;
    const chartFromZero = !!o.fromZero;
    const prevHeights =
      animateCharts && !chartFromZero ? snapshotEffBarHeights(el) : null;
    el.innerHTML = '';
    const maxBucket = Math.max(...(buckets || []), 1);
    const targets = [];
    const binCount = Number(o.binCount) || DASH_ART_FORGE_BIN_COUNT;
    const binSize = Number(o.binSize) || DASH_ART_FORGE_BIN_SIZE;
    const maxLabel = o.maxLabel || '5+';
    for (let i = 0; i < binCount; i++) {
      const cnt = (buckets && buckets[i]) || 0;
      const h = Math.max(4, (cnt / maxBucket) * 80);
      targets[i] = h;
      const h0 = !animateCharts
        ? h
        : chartFromZero
          ? 0
          : prevHeights && prevHeights[i] != null
            ? prevHeights[i]
            : 0;
      const labelStart = (i * binSize).toFixed(binSize < 1 ? 1 : 0);
      const labelEnd =
        i < binCount - 1
          ? (i * binSize + binSize).toFixed(binSize < 1 ? 1 : 0)
          : maxLabel;
      const label = i < binCount - 1 ? `${labelStart}-${labelEnd}` : maxLabel;
      const cls = i >= binCount - 2 ? 'great' : i >= binCount - 4 ? 'good' : '';
      el.innerHTML += `
        <div class="eff-bar-wrap" title="${label}: ${cnt}">
          <div class="eff-bar eff-bar--score ${cls}" style="height:${h0}px"></div>
          <div class="eff-label">${labelStart}</div>
        </div>`;
    }
    return targets;
  }

  function applyArtifactBarTargets(entries) {
    if (!entries || !entries.length) return;
    const motionApi = window.SWRM_MOTION;
    const useGsap = motionApi && motionApi.enabled();
    const barEntries = [];
    entries.forEach(({ container, attr, map }) => {
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
    });
    if (useGsap && barEntries.length) motionApi.animateBarWidthFills(barEntries);
  }

  function applyArtifactScoreBarHeights(el, targets, animateCharts) {
    if (!el || !targets || !targets.length) return;
    const motionApi = window.SWRM_MOTION;
    const useGsap = motionApi && motionApi.enabled();
    const heightEntries = [];
    const bars = el.querySelectorAll('.eff-bar');
    bars.forEach((bar, i) => {
      if (targets[i] == null) return;
      const px = `${targets[i]}px`;
      if (animateCharts && useGsap) heightEntries.push({ el: bar, value: px });
      else bar.style.height = px;
    });
    if (animateCharts && useGsap && heightEntries.length) motionApi.animateHeightFills(heightEntries);
  }

  function applyArtifactMedianLine(lineEl, value, min, max, tipText) {
    if (!lineEl) return;
    if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      lineEl.hidden = true;
      lineEl.setAttribute('aria-hidden', 'true');
      clearSwrmFloatTipTarget(lineEl);
      return;
    }
    const pos = ((value - min) / (max - min)) * 100;
    lineEl.style.left = `calc(${Math.max(0, Math.min(100, pos)).toFixed(1)}% - 1px)`;
    lineEl.hidden = false;
    lineEl.setAttribute('aria-hidden', 'false');
    if (tipText) {
      lineEl.setAttribute('aria-label', tipText);
      setSwrmFloatTipTarget(lineEl, tipText);
    } else {
      clearSwrmFloatTipTarget(lineEl);
    }
  }

  function renderArtifactDashboardDistributions(opts) {
    const o = opts || {};
    const animateCharts = o.animateCharts !== false;
    const chartFromZero = !!o.fromZero;
    const artifacts = typeof allArtifacts !== 'undefined' ? allArtifacts : [];
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    const emptyEl = document.getElementById('dash-artifact-empty');
    const gridEl = document.getElementById('dash-artifact-grid');
    const gridTypeEl = document.getElementById('dash-artifact-grid-type');
    const gridScoreEl = document.getElementById('dash-artifact-grid-score');
    const wrapEl = document.getElementById('dash-dist-artifacts-wrap');

    if (readDashboardDistKind() !== 'artifacts') {
      if (emptyEl) emptyEl.hidden = true;
      if (gridEl) gridEl.hidden = true;
      if (gridTypeEl) gridTypeEl.hidden = true;
      if (gridScoreEl) gridScoreEl.hidden = true;
      return;
    }

    if (typeof attachArtifactVerdicts === 'function' && artifacts.length) {
      attachArtifactVerdicts(artifacts);
    }

    const cacheKey = artifactDashboardCacheKey(artifacts);
    if (o.skipIfCached && artifactDashCache.built && artifactDashCache.key === cacheKey) {
      if (animateCharts && replayArtifactDashboardAnimations()) return;
      return;
    }

    if (!artifacts.length) {
      if (emptyEl) {
        emptyEl.textContent = tloc.dashboardNoArtifacts || '';
        emptyEl.hidden = false;
      }
      if (gridEl) gridEl.hidden = true;
      if (gridTypeEl) gridTypeEl.hidden = true;
      if (gridScoreEl) gridScoreEl.hidden = true;
      artifactDashCache.key = cacheKey;
      artifactDashCache.built = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (gridEl) gridEl.hidden = false;
    if (gridTypeEl) gridTypeEl.hidden = false;
    if (gridScoreEl) gridScoreEl.hidden = false;

    const agg = aggregateArtifactDashboard(artifacts);

    renderArtifactVerdictBlock(agg, tloc, { animateCharts, fromZero: chartFromZero });

    const gradeRows = sortDashRowsByCountDesc(
      DASH_ART_GRADE_ORDER.map((g) => ({
        key: g,
        label: g,
        count: agg.grade[g] || 0,
      })).filter((r) => r.count > 0),
    );
    const gradeColorClassMap = {
      'Legend': 'chart-bar--grade-legend',
      'Hero': 'chart-bar--grade-hero',
      'Rare': 'chart-bar--grade-rare',
    };
    const gradeRowsWithColor = gradeRows.map((row) => ({
      ...row,
      fillClass: gradeColorClassMap[row.key] || 'chart-bar--sets',
    }));
    const gradeTargets = renderArtifactBarRows(
      document.getElementById('dash-art-grade-chart'),
      gradeRowsWithColor,
      {
        tloc,
        dataAttr: 'data-dash-art-grade',
        fillClass: 'chart-bar--sets',
        animateCharts,
        fromZero: chartFromZero,
        clickDataAttr: 'data-dash-art-grade',
        ingameByKey: {
          Rare: meanFromList(agg.gradeIngame.Rare),
          Hero: meanFromList(agg.gradeIngame.Hero),
          Legend: meanFromList(agg.gradeIngame.Legend),
        },
      },
    );

    const typeEl = document.getElementById('dash-art-type-chart');
    let typeTargets = new Map();
    if (typeEl) {
      if (!agg.typeTotal) {
        typeEl.innerHTML = `<p class="dash-artifact-cell__muted">${escapeHtml(tloc.dashboardArtifactTypeEmpty || '—')}</p>`;
      } else {
        const typeRows = sortDashRowsByCountDesc(
          DASH_ART_TYPE_ORDER.map((us) => ({
            key: String(us),
            label: artifactTypeLabel(tloc, us),
            count: agg.artifactType[us] || 0,
          })).filter((r) => r.count > 0),
        );
        typeTargets = renderArtifactBarRows(typeEl, typeRows, {
          tloc,
          dataAttr: 'data-dash-art-type',
          fillClass: 'chart-bar--roles',
          animateCharts,
          fromZero: chartFromZero,
          clickDataAttr: 'data-dash-art-type',
          ingameByKey: Object.fromEntries(typeRows.map((row) => [String(row.key), meanFromList(agg.typeIngame[String(row.key)])])),
        });
      }
    }

    const roleKeys = Object.keys(agg.role).sort(
      (a, b) => (agg.role[b] || 0) - (agg.role[a] || 0) || a.localeCompare(b),
    );
    const roleRows = roleKeys.map((k) => ({ key: k, label: k, count: agg.role[k] || 0 }));
    const roleColorClassMap = {
      'Classic DPS': 'chart-bar--role-classicdps',
      'Tank': 'chart-bar--role-tank',
      'Bomber': 'chart-bar--role-bomber',
      'Fast CC': 'chart-bar--role-fastcc',
      'Bruiser': 'chart-bar--role-bruiser',
      'Slow DPS': 'chart-bar--role-slowdps',
    };
    const roleRowsWithColor = roleRows.map((row) => ({
      ...row,
      fillClass: roleColorClassMap[row.key] || 'chart-bar--roles',
    }));
    const roleTargets = renderArtifactBarRows(
      document.getElementById('dash-art-role-chart'),
      roleRowsWithColor,
      {
        tloc,
        dataAttr: 'data-dash-art-role',
        fillClass: 'chart-bar--roles',
        animateCharts,
        fromZero: chartFromZero,
        clickDataAttr: 'data-dash-art-role',
        ingameByKey: Object.fromEntries(roleRows.map((row) => [String(row.key), meanFromList(agg.roleIngame[String(row.key)])])),
      },
    );

    const attributeEl = document.getElementById('dash-art-attribute-chart');
    let attributeTargets = new Map();
    if (attributeEl) {
      if (!agg.attributeTotal) {
        attributeEl.innerHTML = `<p class="dash-artifact-cell__muted">${escapeHtml(tloc.dashboardArtifactAttributeEmpty || '—')}</p>`;
      } else {
        const attributeRows = sortDashRowsByCountDesc(
          DASH_ART_ATTRIBUTE_ORDER.map((attr) => ({
            key: String(attr),
            label: artifactAttributeLabel(tloc, attr),
            count: agg.attribute[attr] || 0,
          })).filter((r) => r.count > 0),
        );
        const attributeColorClassMap = {
          '1': 'chart-bar--attr-fire',
          '2': 'chart-bar--attr-water',
          '3': 'chart-bar--attr-wind',
          '4': 'chart-bar--attr-light',
          '5': 'chart-bar--attr-dark',
        };
        const attributeRowsWithColor = attributeRows.map((row) => ({
          ...row,
          fillClass: attributeColorClassMap[row.key] || 'chart-bar--sets',
        }));
        attributeTargets = renderArtifactBarRows(attributeEl, attributeRowsWithColor, {
          tloc,
          dataAttr: 'data-dash-art-attribute',
          fillClass: 'chart-bar--sets',
          animateCharts,
          fromZero: chartFromZero,
          clickDataAttr: 'data-dash-art-attribute',
          ingameByKey: Object.fromEntries(attributeRows.map((row) => [String(row.key), meanFromList(agg.attributeIngame[String(row.key)])])),
        });
      }
    }

    const ingameScoreEl = document.getElementById('dash-art-score-ingame-chart');
    const ingameScoreTargets = renderArtifactScoreHistogram(ingameScoreEl, agg.ingameScoreBins, {
      animateCharts,
      fromZero: chartFromZero,
      binCount: DASH_ART_INGAME_BIN_COUNT,
      binSize: DASH_ART_INGAME_BIN_SIZE,
      maxLabel: '200+',
    });
    const forgeScoreEl = document.getElementById('dash-art-score-forge-chart');
    const forgeScoreTargets = renderArtifactScoreHistogram(forgeScoreEl, agg.forgeScoreBins, {
      animateCharts,
      fromZero: chartFromZero,
      binCount: DASH_ART_FORGE_BIN_COUNT,
      binSize: DASH_ART_FORGE_BIN_SIZE,
      maxLabel: '5+',
    });

    const ingameVals = artifacts
      .map((a) => Number(a.artifactIngameScore))
      .filter((n) => Number.isFinite(n) && n >= 0);
    const forgeVals = artifacts
      .map((a) =>
        typeof window.SWRM.calcArtifactForgeScoreDisplay === 'function'
          ? window.SWRM.calcArtifactForgeScoreDisplay(a)
          : null,
      )
      .filter((n) => Number.isFinite(n) && n >= 0);
    const medIngame = medianSorted(ingameVals);
    const medForge = medianSorted(forgeVals);
    const ingameTipTpl = tloc.effMedianCaption || 'Median Ingame Score (filtered): {pct}';
    const forgeTipTpl = tloc.scoreMedianCaption || 'Median Forge Score (filtered): {score}';
    applyArtifactMedianLine(
      document.getElementById('dash-art-ingame-median-line'),
      medIngame,
      0,
      200,
      medIngame == null ? '' : ingameTipTpl.replace('{pct}', medIngame.toFixed(1)),
    );
    applyArtifactMedianLine(
      document.getElementById('dash-art-forge-median-line'),
      medForge,
      0,
      5,
      medForge == null ? '' : forgeTipTpl.replace('{score}', medForge.toFixed(1)),
    );

    if (animateCharts) {
      rafTwice(() => {
        applyArtifactBarTargets([
          { container: document.getElementById('dash-art-grade-chart'), attr: 'data-dash-art-grade', map: gradeTargets },
          { container: document.getElementById('dash-art-type-chart'), attr: 'data-dash-art-type', map: typeTargets },
          { container: document.getElementById('dash-art-role-chart'), attr: 'data-dash-art-role', map: roleTargets },
          { container: document.getElementById('dash-art-attribute-chart'), attr: 'data-dash-art-attribute', map: attributeTargets },
        ]);
        applyArtifactScoreBarHeights(ingameScoreEl, ingameScoreTargets, true);
        applyArtifactScoreBarHeights(forgeScoreEl, forgeScoreTargets, true);
      });
    }

    artifactDashCache.key = cacheKey;
    artifactDashCache.built = true;
    if (wrapEl) wrapEl.dataset.artifactCount = String(artifacts.length);
  }

  function replayArtifactDashboardAnimations() {
    if (readDashboardDistKind() !== 'artifacts') return false;
    const grid = document.getElementById('dash-dist-artifacts-wrap');
    if (!grid || grid.hidden) return false;
    renderArtifactDashboardDistributions({ animateCharts: true, fromZero: false, skipIfCached: false });
    return true;
  }

  const DASH_ART_TABS_KEY = 'swrm_dash_art_tab_v1';

  function normalizeArtifactDashTab(raw) {
    const v = String(raw || '').trim();
    if (v === 'breakdown' || v === 'type' || v === 'score') return v;
    return 'breakdown';
  }

  function readArtifactDashTab() {
    try {
      return normalizeArtifactDashTab(localStorage.getItem(DASH_ART_TABS_KEY));
    } catch (e) {
      return 'breakdown';
    }
  }

  function positionArtifactDashTabIndicator(opts) {
    const o = opts || {};
    const nav = o.nav;
    if (!nav) return;
    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionDashUnifiedTabIndicator === 'function') {
      motionApi.positionDashUnifiedTabIndicator({
        nav,
        activeKey: normalizeArtifactDashTab(o.activeKey),
        instant: !!o.instant,
      });
      return;
    }
    const ind = nav.querySelector('.dash-unified-tabs__indicator');
    if (!ind) return;
    const activeKey = normalizeArtifactDashTab(o.activeKey);
    const btn = nav.querySelector(`[data-dash-art-tab="${activeKey}"]`);
    if (!btn) return;
    const rNav = nav.getBoundingClientRect();
    const rBtn = btn.getBoundingClientRect();
    const left = Math.max(0, rBtn.left - rNav.left);
    ind.style.width = `${Math.max(0, rBtn.width)}px`;
    ind.style.left = `${left}px`;
    ind.style.transform = 'none';
  }

  function applyArtifactDashTab(which) {
    const keys = ['breakdown', 'type', 'score'];
    const active = normalizeArtifactDashTab(which);
    keys.forEach((k) => {
      const btn = document.getElementById(`dash-art-tab-${k}`);
      if (btn) {
        const on = k === active;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
        btn.tabIndex = on ? 0 : -1;
      }
    });
    const host = document.getElementById('dash-art-panes');
    const next = document.getElementById(`dash-art-pane-${active}`);
    if (!next) return;
    const keysSet = new Set(keys);
    const setPaneState = (pane, on) => {
      if (!pane) return;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('is-shown', on);
      pane.classList.remove('is-exiting');
      pane.toggleAttribute('hidden', !on);
      pane.setAttribute('aria-hidden', String(!on));
    };
    const current = host?.querySelector('.dash-unified-pane.is-active') || null;
    if (current === next) {
      keys.forEach((k) => setPaneState(document.getElementById(`dash-art-pane-${k}`), k === active));
      positionArtifactDashTabIndicator({ nav: document.getElementById('dash-art-tabs'), activeKey: active });
      return;
    }
    const finalize = () => {
      (host ? Array.from(host.querySelectorAll('.dash-unified-pane')) : keys.map((k) => document.getElementById(`dash-art-pane-${k}`)))
        .forEach((pane) => {
          if (!pane) return;
          const id = String(pane.id || '');
          const key = id.startsWith('dash-art-pane-') ? id.slice('dash-art-pane-'.length) : '';
          const on = keysSet.has(key) ? key === active : pane === next;
          setPaneState(pane, on);
        });
    };
    const motionApi = window.SWRM_MOTION;
    const playPaneBars = (pane) => {
      if (!pane || !motionApi || !motionApi.enabled()) return;
      requestAnimationFrame(() => motionApi.animateDashboardPaneBars(pane));
    };
    if (!host || !motionApi || !motionApi.enabled()) {
      motionApi && motionApi.cancelDashUnifiedTab();
      finalize();
      playPaneBars(next);
      host?.classList.remove('dash-unified-panes--animate', 'dash-unified-panes--gsap');
      positionArtifactDashTabIndicator({ nav: document.getElementById('dash-art-tabs'), activeKey: active });
      return;
    }
    host.classList.add('dash-unified-panes--gsap');
    host.classList.remove('dash-unified-panes--animate');
    const started = motionApi.animateDashUnifiedTab({
      host,
      current,
      next,
      onComplete: finalize,
    });
    if (!started) {
      finalize();
      playPaneBars(next);
    }
    positionArtifactDashTabIndicator({ nav: document.getElementById('dash-art-tabs'), activeKey: active });
  }

  function initArtifactDashTabs() {
    const nav = document.getElementById('dash-art-tabs');
    if (!nav || nav.dataset.bound === '1') return;
    nav.dataset.bound = '1';
    const initial = readArtifactDashTab();
    const host = document.getElementById('dash-art-panes');
    ['breakdown', 'type', 'score'].forEach((k) => {
      const pane = document.getElementById(`dash-art-pane-${k}`);
      if (!pane) return;
      const on = k === initial;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('is-shown', on);
      pane.classList.remove('is-exiting');
      pane.toggleAttribute('hidden', !on);
      pane.setAttribute('aria-hidden', String(!on));
    });
    if (host && window.SWRM_MOTION && window.SWRM_MOTION.enabled()) {
      host.classList.add('dash-unified-panes--gsap');
    }
    applyArtifactDashTab(initial);
    nav.querySelectorAll('[data-dash-art-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const k = normalizeArtifactDashTab(btn.getAttribute('data-dash-art-tab'));
        try {
          localStorage.setItem(DASH_ART_TABS_KEY, k);
        } catch (e) { /* ignore */ }
        applyArtifactDashTab(k);
      });
    });
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        positionArtifactDashTabIndicator({ nav, activeKey: readArtifactDashTab() });
      }, 120);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => positionArtifactDashTabIndicator({ nav, activeKey: readArtifactDashTab() })));
  }

  let artifactDashClickBound = false;

  function navigateToArtifactTableWithFilters(partial) {
    const v = partial || {};
    if (typeof showMainTab === 'function') {
      showMainTab('runes', { runesSubtab: 'runetable', writeHash: true });
    }
    if (typeof showTableKind === 'function') showTableKind('artifacts');
    const setSelect = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = value || '';
    };
    setSelect('filter-artifact-verdict', v.verdict || '');
    setSelect('filter-artifact-grade', v.grade || '');
    setSelect('filter-artifact-role', v.role || '');
    setSelect('filter-artifact-type', v.type || '');
    setSelect('filter-artifact-attribute', v.attribute || '');
    setSelect('filter-artifact-location', v.location || '');
    const search = document.getElementById('search-box-artifacts');
    if (search) search.value = '';
    if (typeof applyArtifactFiltersFromDom === 'function') applyArtifactFiltersFromDom();
    if (typeof updateArtifactFilterBadge === 'function') updateArtifactFilterBadge();
    if (typeof resetArtifactTableVirtualScroll === 'function') resetArtifactTableVirtualScroll();
    if (typeof renderGearTables === 'function') renderGearTables();
  }

  function bindArtifactDashboardClicks() {
    if (artifactDashClickBound) return;
    artifactDashClickBound = true;
    const activateFromTarget = (target) => {
      const verdict = target.closest('.chart-row--clickable[data-dash-art-verdict]');
      if (verdict) {
        navigateToArtifactTableWithFilters({ verdict: verdict.getAttribute('data-dash-art-verdict') || '' });
        return true;
      }
      const grade = target.closest('.chart-row--clickable[data-dash-art-grade]');
      if (grade) {
        navigateToArtifactTableWithFilters({ grade: grade.getAttribute('data-dash-art-grade') || '' });
        return true;
      }
      const role = target.closest('.chart-row--clickable[data-dash-art-role]');
      if (role) {
        navigateToArtifactTableWithFilters({ role: role.getAttribute('data-dash-art-role') || '' });
        return true;
      }
      const type = target.closest('.chart-row--clickable[data-dash-art-type]');
      if (type) {
        navigateToArtifactTableWithFilters({ type: type.getAttribute('data-dash-art-type') || '' });
        return true;
      }
      const attr = target.closest('.chart-row--clickable[data-dash-art-attribute]');
      if (attr) {
        navigateToArtifactTableWithFilters({ attribute: attr.getAttribute('data-dash-art-attribute') || '' });
        return true;
      }
      return false;
    };
    document.addEventListener('click', (e) => {
      activateFromTarget(e.target);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const target = e.target;
      if (!target || !target.closest || !target.closest('#tab-dashboard')) return;
      if (activateFromTarget(target)) e.preventDefault();
    });
  }

  function syncDashboardDistKindUi(kind) {
    const active = kind === 'artifacts' ? 'artifacts' : 'runes';
    const runesWrap = document.getElementById('dash-dist-runes-wrap');
    const artWrap = document.getElementById('dash-dist-artifacts-wrap');
    const kindTabs = document.getElementById('dash-dist-kind-tabs');
    if (runesWrap) runesWrap.hidden = active !== 'runes';
    if (artWrap) artWrap.hidden = active !== 'artifacts';
    if (kindTabs) {
      kindTabs.querySelectorAll('[data-dash-dist-kind]').forEach((btn) => {
        const k = btn.getAttribute('data-dash-dist-kind');
        const on = k === active;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', String(on));
        btn.tabIndex = on ? 0 : -1;
      });
      positionDashDistKindIndicator({ nav: kindTabs, activeKey: active, instant: false });
    }
    if (active === 'artifacts') {
      if (typeof initArtifactDashTabs === 'function') initArtifactDashTabs();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const nav = document.getElementById('dash-art-tabs');
        if (!nav || typeof positionArtifactDashTabIndicator !== 'function') return;
        const key =
          (typeof readArtifactDashTab === 'function' && readArtifactDashTab()) ||
          (nav.querySelector('[data-dash-art-tab].is-active')?.getAttribute('data-dash-art-tab')) ||
          'breakdown';
        positionArtifactDashTabIndicator({ nav, activeKey: key, instant: true });
      }));
    }
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const hint = document.getElementById('lbl-dash-unified-chart-hint');
    if (hint) {
      hint.textContent =
        active === 'artifacts'
          ? tloc.dashboardArtifactDistHint || ''
          : tloc.dashboardVerdictStackHint || '';
    }
  }

  function positionDashDistKindIndicator(opts) {
    const o = opts || {};
    const nav = o.nav;
    if (!nav) return;
    const motionApi = window.SWRM_MOTION;
    if (motionApi && typeof motionApi.positionDashUnifiedTabIndicator === 'function') {
      motionApi.positionDashUnifiedTabIndicator({
        nav,
        activeKey: o.activeKey,
        instant: !!o.instant,
      });
      return;
    }
    const ind = nav.querySelector('.dash-dist-kind-tabs__indicator');
    if (!ind) return;
    const btn = nav.querySelector(`[data-dash-dist-kind="${o.activeKey}"]`);
    if (!btn) return;
    const rNav = nav.getBoundingClientRect();
    const rBtn = btn.getBoundingClientRect();
    const left = Math.max(0, rBtn.left - rNav.left);
    ind.style.width = `${Math.max(0, rBtn.width)}px`;
    ind.style.left = `${left}px`;
    ind.style.transform = 'none';
  }

  function applyDashboardDistKind(kind, opts) {
    const o = opts || {};
    const active = kind === 'artifacts' ? 'artifacts' : 'runes';
    syncDashboardDistKindUi(active);
    if (active === 'artifacts') {
      renderArtifactDashboardDistributions({
        animateCharts: o.animateCharts !== false,
        fromZero: !!o.fromZero,
      });
    } else if (typeof scheduleDashboardChartReplay === 'function') {
      scheduleDashboardChartReplay({ tabSwitch: true, animateCharts: o.animateCharts !== false });
    }
  }

  function initDashboardDistKindTabs() {
    bindArtifactDashboardClicks();
    const initial = readDashboardDistKind();
    syncDashboardDistKindUi(initial);
    const kindTabs = document.getElementById('dash-dist-kind-tabs');
    if (kindTabs) {
      positionDashDistKindIndicator({ nav: kindTabs, activeKey: initial, instant: true });
    }
    if (kindTabs && kindTabs.dataset.bound === '1') {
      if (initial === 'artifacts') {
        renderArtifactDashboardDistributions({ animateCharts: false, fromZero: false });
      }
      return;
    }
    if (kindTabs) kindTabs.dataset.bound = '1';
    if (kindTabs) {
      let resizeTimer = null;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          positionDashDistKindIndicator({ nav: kindTabs, activeKey: readDashboardDistKind(), instant: true });
        }, 120);
      });
      window.addEventListener('pageshow', () => {
        requestAnimationFrame(() => requestAnimationFrame(() => {
          positionDashDistKindIndicator({ nav: kindTabs, activeKey: readDashboardDistKind(), instant: true });
        }));
      });
    }
    document.querySelectorAll('[data-dash-dist-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const raw = btn.getAttribute('data-dash-dist-kind') || 'runes';
        const k = raw === 'artifacts' ? 'artifacts' : 'runes';
        try {
          localStorage.setItem(DASH_DIST_KIND_KEY, k);
        } catch (e) { /* ignore */ }
        applyDashboardDistKind(k, { animateCharts: true, fromZero: k === 'artifacts' });
      });
    });
    if (initial === 'artifacts') {
      renderArtifactDashboardDistributions({ animateCharts: false, fromZero: false });
    }
  }
