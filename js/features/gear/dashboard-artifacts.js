// js/features/gear/dashboard-artifacts.js — artifact distribution charts on Dashboard

  const DASH_ART_VERDICT_CSS = { keep: '#2d9a6a', sell: '#c45c5c' };
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
  const DASH_ART_SCORE_BIN_SIZE = 0.5;
  const DASH_ART_SCORE_BIN_COUNT = 11;

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
    const scoreBins = new Array(DASH_ART_SCORE_BIN_COUNT).fill(0);
    let typeTotal = 0;
    let attributeTotal = 0;

    for (let i = 0; i < artifacts.length; i++) {
      const a = artifacts[i];
      if (!a) continue;
      const g = String(a.gradeStr || '').trim();
      if (g && Object.prototype.hasOwnProperty.call(grade, g)) grade[g] += 1;

      if (artifactPieceType(a) === ARTIFACT_PIECE_TYPE) {
        const us = Number(a.unitStyle);
        if (DASH_ART_TYPE_ORDER.includes(us)) {
          artifactType[us] += 1;
          typeTotal += 1;
        }
      }

      const v = String(a.artifactVerdict || '').toLowerCase();
      if (v === 'keep') verdict.keep += 1;
      else if (v === 'sell') verdict.sell += 1;

      const roleName = String(a.artifactRole || 'Unknown').trim() || 'Unknown';
      role[roleName] = (role[roleName] || 0) + 1;

      if (artifactPieceType(a) === ARTIFACT_PIECE_ATTRIBUTE) {
        const attr = Number(a.attribute);
        if (DASH_ART_ATTRIBUTE_ORDER.includes(attr)) {
          attribute[attr] += 1;
          attributeTotal += 1;
        }
      }

      const sc = Number(a.artifactScore);
      if (Number.isFinite(sc) && sc >= 0) {
        let bin = Math.floor(sc / DASH_ART_SCORE_BIN_SIZE);
        if (bin >= DASH_ART_SCORE_BIN_COUNT) bin = DASH_ART_SCORE_BIN_COUNT - 1;
        scoreBins[bin] += 1;
      }
    }

    return { grade, artifactType, typeTotal, attribute, attributeTotal, verdict, role, scoreBins };
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
    const fillClass = o.fillClass || 'chart-bar--roles';
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
      const { key, label, count } = rows[i];
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
      el.innerHTML += `
        <div class="chart-row" ${dataAttr}="${ek}">
          <div class="chart-label">${elbl}</div>
          ${chartBarTrackHtml(pct, fillClass, animateCharts ? startPct : undefined)}
          ${chartRowStatsHtml(count, undefined, tloc)}
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
    const keepPct = Math.round((keep / total) * 100);
    const sellPct = Math.max(0, 100 - keepPct);
    const summary = `
      <div class="dash-artifact-verdict-summary" role="group" aria-label="${escapeHtml(keepLbl)} / ${escapeHtml(sellLbl)}">
        <span class="dash-artifact-verdict-pill dash-artifact-verdict-pill--keep">
          <span class="dash-artifact-verdict-pill__lbl">${escapeHtml(keepLbl)}</span>
          <span class="dash-artifact-verdict-pill__val">${keep}</span>
          <span class="dash-artifact-verdict-pill__pct">${keepPct}%</span>
        </span>
        <span class="dash-artifact-verdict-pill dash-artifact-verdict-pill--sell">
          <span class="dash-artifact-verdict-pill__lbl">${escapeHtml(sellLbl)}</span>
          <span class="dash-artifact-verdict-pill__val">${sell}</span>
          <span class="dash-artifact-verdict-pill__pct">${sellPct}%</span>
        </span>
      </div>`;

    const rows = sortDashRowsByCountDesc([
      { key: 'keep', label: keepLbl, count: keep },
      { key: 'sell', label: sellLbl, count: sell },
    ]).filter((r) => r.count > 0);

    host.innerHTML = summary;
    const inner = document.createElement('div');
    inner.className = 'dash-artifact-verdict-bars';
    host.appendChild(inner);

    const targets = renderArtifactBarRows(inner, rows, {
      tloc,
      dataAttr: 'data-dash-art-verdict',
      fillClass: 'chart-bar--roles',
      animateCharts: o.animateCharts,
      fromZero: o.fromZero,
    });
    inner.querySelectorAll('[data-dash-art-verdict]').forEach((row) => {
      const k = row.getAttribute('data-dash-art-verdict');
      const fill = row.querySelector('.chart-bar-fill');
      if (!fill || !k) return;
      const bg = DASH_ART_VERDICT_CSS[k] || '#888';
      fill.classList.add('chart-bar-fill--verdict');
      fill.style.background = bg;
      const pct = targets.get(k);
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
    for (let i = 0; i < DASH_ART_SCORE_BIN_COUNT; i++) {
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
      const labelStart = (i * DASH_ART_SCORE_BIN_SIZE).toFixed(1);
      const labelEnd =
        i < DASH_ART_SCORE_BIN_COUNT - 1
          ? (i * DASH_ART_SCORE_BIN_SIZE + DASH_ART_SCORE_BIN_SIZE).toFixed(1)
          : '5+';
      const label = i < DASH_ART_SCORE_BIN_COUNT - 1 ? `${labelStart}-${labelEnd}` : '5+';
      const cls = i >= DASH_ART_SCORE_BIN_COUNT - 2 ? 'great' : i >= DASH_ART_SCORE_BIN_COUNT - 4 ? 'good' : '';
      el.innerHTML += `
        <div class="eff-bar-wrap" title="${label}: ${cnt}">
          <div class="eff-bar eff-bar--artifact-score ${cls}" style="height:${h0}px"></div>
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

  function renderArtifactDashboardDistributions(opts) {
    const o = opts || {};
    const animateCharts = o.animateCharts !== false;
    const chartFromZero = !!o.fromZero;
    const artifacts = typeof allArtifacts !== 'undefined' ? allArtifacts : [];
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;

    const emptyEl = document.getElementById('dash-artifact-empty');
    const gridEl = document.getElementById('dash-artifact-grid');
    const wrapEl = document.getElementById('dash-dist-artifacts-wrap');

    if (readDashboardDistKind() !== 'artifacts') {
      if (emptyEl) emptyEl.hidden = true;
      if (gridEl) gridEl.hidden = true;
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
      artifactDashCache.key = cacheKey;
      artifactDashCache.built = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = true;
    if (gridEl) gridEl.hidden = false;

    const agg = aggregateArtifactDashboard(artifacts);

    renderArtifactVerdictBlock(agg, tloc, { animateCharts, fromZero: chartFromZero });

    const gradeRows = sortDashRowsByCountDesc(
      DASH_ART_GRADE_ORDER.map((g) => ({
        key: g,
        label: g,
        count: agg.grade[g] || 0,
      })).filter((r) => r.count > 0),
    );
    const gradeTargets = renderArtifactBarRows(
      document.getElementById('dash-art-grade-chart'),
      gradeRows,
      { tloc, dataAttr: 'data-dash-art-grade', fillClass: 'chart-bar--sets', animateCharts, fromZero: chartFromZero },
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
        });
      }
    }

    const roleKeys = Object.keys(agg.role).sort(
      (a, b) => (agg.role[b] || 0) - (agg.role[a] || 0) || a.localeCompare(b),
    );
    const roleRows = roleKeys.map((k) => ({ key: k, label: k, count: agg.role[k] || 0 }));
    const roleTargets = renderArtifactBarRows(
      document.getElementById('dash-art-role-chart'),
      roleRows,
      { tloc, dataAttr: 'data-dash-art-role', fillClass: 'chart-bar--roles', animateCharts, fromZero: chartFromZero },
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
        attributeTargets = renderArtifactBarRows(attributeEl, attributeRows, {
          tloc,
          dataAttr: 'data-dash-art-attribute',
          fillClass: 'chart-bar--sets',
          animateCharts,
          fromZero: chartFromZero,
        });
      }
    }

    const scoreEl = document.getElementById('dash-art-score-chart');
    const scoreTargets = renderArtifactScoreHistogram(scoreEl, agg.scoreBins, {
      animateCharts,
      fromZero: chartFromZero,
    });

    if (animateCharts) {
      rafTwice(() => {
        applyArtifactBarTargets([
          { container: document.getElementById('dash-art-grade-chart'), attr: 'data-dash-art-grade', map: gradeTargets },
          { container: document.getElementById('dash-art-type-chart'), attr: 'data-dash-art-type', map: typeTargets },
          { container: document.getElementById('dash-art-role-chart'), attr: 'data-dash-art-role', map: roleTargets },
          { container: document.getElementById('dash-art-attribute-chart'), attr: 'data-dash-art-attribute', map: attributeTargets },
        ]);
        applyArtifactScoreBarHeights(scoreEl, scoreTargets, true);
      });
    }

    artifactDashCache.key = cacheKey;
    artifactDashCache.built = true;
    if (wrapEl) wrapEl.dataset.artifactCount = String(artifacts.length);
  }

  function replayArtifactDashboardAnimations() {
    if (readDashboardDistKind() !== 'artifacts') return false;
    const grid = document.getElementById('dash-artifact-grid');
    if (!grid || grid.hidden) return false;
    renderArtifactDashboardDistributions({ animateCharts: true, fromZero: false, skipIfCached: false });
    return true;
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
    const initial = readDashboardDistKind();
    syncDashboardDistKindUi(initial);
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
