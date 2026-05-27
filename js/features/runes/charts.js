// js/features/runes/charts.js — dashboard chart helpers (Verdicts, Roles, Sets, Slot Distribution, Top SPD)
  /** Bar track + fill only (counts live in chartRowStatsHtml). Optional startPct for width animation. */
  function chartBarTrackHtml(pctStr, fillClass, startPctOpt) {
    const initial =
      startPctOpt != null && Number.isFinite(Number(startPctOpt))
        ? Number(startPctOpt).toFixed(1)
        : pctStr;
    return `<div class="chart-bar-wrap">
            <div class="chart-bar-fill ${fillClass}" style="width:${initial}%"></div>
          </div>`;
  }

  /** Right column: count value + optional ingame score line. */
  function chartRowStatsHtml(cnt, ingameDisplay, tloc) {
    const li = escapeHtml((tloc && tloc.dashboardChartLblAvgIngame) || 'Avg Ingame Score');
    const countLine = `<div class="chart-stat-line chart-stat-line--count">
      <span class="chart-stat-val">${cnt}</span>
    </div>`;
    if (ingameDisplay === undefined) {
      return `<div class="chart-row-stats chart-row-stats--solo">${countLine}</div>`;
    }
    const ingameInner = ingameDisplay === '-' ? '\u2014' : escapeHtml(String(ingameDisplay));
    const ingameLine = `<div class="chart-stat-line chart-stat-line--ingame">
      <span class="chart-stat-lbl">${li}</span>
      <span class="chart-stat-val">${ingameInner}</span>
    </div>`;
    return `<div class="chart-row-stats">${countLine}${ingameLine}</div>`;
  }

  function subLineTotal(s) {
    if (typeof window.SWRM?.subRuneValue === 'function') return window.SWRM.subRuneValue(s);
    return (Number(s?.val) || 0) + (Number(s?.grind) || 0);
  }

  function sumRuneSpdSubs(r) {
    let s = 0;
    for (const sub of r.substats || []) {
      if (sub.name === 'SPD') s += subLineTotal(sub);
    }
    return s;
  }

  /** Sub SPD with grind assumed up to SPD_SUB_MAX_GRIND on grindable lines. */
  function sumRuneSpdSubsPotential(r) {
    let s = 0;
    for (const sub of r.substats || []) {
      if (sub.name !== 'SPD') continue;
      if (sub.source === 'innate') {
        s += subLineTotal(sub);
        continue;
      }
      const val = Number(sub.val) || 0;
      const grind = Number(sub.grind) || 0;
      s += val + Math.max(grind, SPD_SUB_MAX_GRIND);
    }
    return s;
  }

  function formatTopSpdChipLabel(r, tloc) {
    const spd = sumRuneSpdSubs(r);
    const pot = sumRuneSpdSubsPotential(r);
    const grade = String(r.gradeStr || '').trim();
    let core = `+${spd} SPD`;
    if (pot > spd) core += ` →+${pot}`;
    return grade ? `${core} · ${grade}` : core;
  }

  function chartBarTrackHtmlVerdict(pctStr, bgCss, startPctOpt) {
    const initial =
      startPctOpt != null && Number.isFinite(Number(startPctOpt))
        ? Number(startPctOpt).toFixed(1)
        : pctStr;
    return `<div class="chart-bar-wrap">
      <div class="chart-bar-fill chart-bar-fill--verdict" style="width:${initial}%;background:${bgCss};"></div>
    </div>`;
  }

  function rafTwice(fn) {
    requestAnimationFrame(() => {
      requestAnimationFrame(fn);
    });
  }

  /** Verdict/Roles/Sets chart row reorder: FLIP translation duration (viewport coords). */
  const DASH_CHART_ROW_FLIP_MS = 460;

  function snapshotKeyedRowRects(container, attrName) {
    const map = new Map();
    if (!container) return map;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const k = row.getAttribute(safe);
      if (k == null) return;
      const r = row.getBoundingClientRect();
      map.set(k, { top: r.top, left: r.left, width: r.width, height: r.height });
    });
    return map;
  }

  /** FLIP invert: move rows visually back to prior viewport positions (transform only). */
  function collectChartRowFlipMoves(container, attrName, oldRectMap) {
    const moved = [];
    if (!container || !oldRectMap || !oldRectMap.size) return moved;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const k = row.getAttribute(safe);
      if (k == null || !oldRectMap.has(k)) return;
      const o = oldRectMap.get(k);
      const n = row.getBoundingClientRect();
      const dx = o.left - n.left;
      const dy = o.top - n.top;
      if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) return;
      row.style.transformOrigin = '0 0';
      row.style.transform = `translate(${dx}px, ${dy}px)`;
      row.style.transition = 'transform 0s';
      moved.push(row);
    });
    return moved;
  }

  function playChartRowFlipMoves(movedRows) {
    const motionApi = window.SWRM_MOTION;
    if (motionApi) {
      motionApi.playChartRowFlip(movedRows);
      return;
    }
    movedRows.forEach((row) => {
      row.style.transition = `transform ${DASH_CHART_ROW_FLIP_MS}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
      row.style.transform = 'translate(0, 0)';
      const clear = () => {
        row.style.transition = '';
        row.style.transform = '';
        row.style.transformOrigin = '';
      };
      row.addEventListener(
        'transitionend',
        (e) => {
          if (e.propertyName === 'transform') clear();
        },
        { once: true },
      );
      setTimeout(clear, DASH_CHART_ROW_FLIP_MS + 120);
    });
  }

  function snapshotRowBarWidthMap(container, attrName) {
    const map = new Map();
    if (!container) return map;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const key = row.getAttribute(safe);
      if (key == null) return;
      const fill = row.querySelector('.chart-bar-fill');
      if (!fill) return;
      const w = fill.style.width;
      const m = w && String(w).match(/([\d.]+)/);
      const n = m ? parseFloat(m[1]) : NaN;
      map.set(key, Number.isFinite(n) ? n : 0);
    });
    return map;
  }

  function snapshotEffBarHeights(el) {
    if (!el) return [];
    return Array.from(el.querySelectorAll('.eff-bar')).map((bar) => {
      const h = bar.style.height;
      const m = h && String(h).match(/([\d.]+)/);
      const n = m ? parseFloat(m[1]) : NaN;
      return Number.isFinite(n) ? n : null;
    });
  }

  function snapshotSlotShareBarHeights(hostEl) {
    const map = new Map();
    if (!hostEl) return map;
    let cells = hostEl.querySelectorAll('.slot-share-cell[data-slot]');
    if (!cells.length) cells = hostEl.querySelectorAll('.slot-share-cell');
    cells.forEach((cell, idx) => {
      const key = cell.getAttribute('data-slot') || String(idx + 1);
      const fill = cell.querySelector('.slot-share-bar-fill');
      if (!fill) return;
      const h = fill.style.height;
      const m = h && String(h).match(/([\d.]+)/);
      const n = m ? parseFloat(m[1]) : NaN;
      map.set(String(key), Number.isFinite(n) ? n : 0);
    });
    return map;
  }

  function applyRowBarWidthMap(container, attrName, targetMap) {
    if (!container || !targetMap || !targetMap.size) return;
    const safe = String(attrName).replace(/"/g, '');
    container.querySelectorAll(`[${safe}]`).forEach((row) => {
      const k = row.getAttribute(safe);
      if (k == null || !targetMap.has(k)) return;
      const fill = row.querySelector('.chart-bar-fill');
      if (!fill) return;
      const v = targetMap.get(k);
      if (!Number.isFinite(v)) return;
      fill.style.width = `${Number(v).toFixed(1)}%`;
    });
  }

  function buildSlotMainPivot(list) {
    const slotTotals = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const cell = {};
    const runes = Array.isArray(list) ? list : [];
    for (let i = 0; i < runes.length; i++) {
      const r = runes[i];
      const slot = r.slot | 0;
      if (slot < 1 || slot > 6) continue;
      slotTotals[slot]++;
      const m = r.mainName || '\u2014';
      if (!cell[m]) cell[m] = {};
      cell[m][slot] = (cell[m][slot] || 0) + 1;
    }
    const mains = Object.keys(cell).sort((a, b) => {
      const ta = Object.values(cell[a]).reduce((x, y) => x + y, 0);
      const tb = Object.values(cell[b]).reduce((x, y) => x + y, 0);
      if (tb !== ta) return tb - ta;
      return String(a).localeCompare(String(b));
    });
    return { slotTotals, cell, mains };
  }

  function renderSlotMainCards(hostEl, pivot, tloc, opts) {
    if (!hostEl || !pivot) return null;
    const animateCharts = !!(opts && opts.animateCharts);
    const prevSlotHeights = animateCharts ? snapshotSlotShareBarHeights(hostEl) : new Map();

    hostEl.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'slot-distribution';

    const slotHdr = (n) =>
      ((tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}').replace('{n}', String(n));

    const grandTotal = [1, 2, 3, 4, 5, 6].reduce((acc, s) => acc + (pivot.slotTotals[s] || 0), 0);

    /** Bar height scale: tallest slot count + headroom so the max bar uses most of the track. */
    const SLOT_SHARE_BAR_HEADROOM = 50;
    let maxSlotCount = 0;
    for (let si = 1; si <= 6; si++) {
      maxSlotCount = Math.max(maxSlotCount, pivot.slotTotals[si] || 0);
    }
    const barScaleDen = maxSlotCount + SLOT_SHARE_BAR_HEADROOM;

    const slotShareTargets = new Map();

    const shareSection = document.createElement('section');
    shareSection.className = 'slot-share-section';

    const shareGrid = document.createElement('div');
    shareGrid.className = 'slot-share-grid';
    shareGrid.setAttribute('role', 'group');
    shareGrid.setAttribute(
      'aria-label',
      (tloc && tloc.dashboardSlotShareAria) || 'Rune count share per slot',
    );

    for (let s = 1; s <= 6; s++) {
      const n = pivot.slotTotals[s] || 0;
      const sharePct = grandTotal ? Math.round((n / grandTotal) * 1000) / 10 : 0;
      const barH =
        grandTotal && barScaleDen > 0
          ? Math.min(100, Math.round((n / barScaleDen) * 1000) / 10)
          : 0;
      const cell = document.createElement('d' + 'iv');
      cell.className = 'slot-share-cell slot-share-cell--clickable';
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('data-dash-slot', String(s));
      cell.setAttribute('data-slot', String(s));
      cell.setAttribute(
        'aria-label',
        `${slotHdr(s)}, ${grandTotal ? n : '—'} runes, ${grandTotal ? `${sharePct}%` : '—'}`,
      );

      const lbl = document.createElement('div');
      lbl.className = 'slot-share-slot-lbl';
      lbl.textContent = slotHdr(s);

      const countEl = document.createElement('div');
      countEl.className = 'slot-share-count';
      countEl.textContent = grandTotal ? String(n) : '\u2014';

      const track = document.createElement('div');
      track.className = 'slot-share-bar-track';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('div');
      fill.className = 'slot-share-bar-fill';
      const startH = !animateCharts
        ? barH
        : prevSlotHeights.has(String(s))
          ? prevSlotHeights.get(String(s))
          : 0;
      fill.style.height = `${startH}%`;
      slotShareTargets.set(String(s), barH);
      track.appendChild(fill);

      const pctEl = document.createElement('div');
      pctEl.className = 'slot-share-pct';
      pctEl.textContent = grandTotal ? `${sharePct}%` : '\u2014';

      cell.appendChild(lbl);
      cell.appendChild(countEl);
      cell.appendChild(track);
      cell.appendChild(pctEl);
      shareGrid.appendChild(cell);
    }

    shareSection.appendChild(shareGrid);
    root.appendChild(shareSection);

    const fillVariableList = (listEl, s) => {
      listEl.className = 'slot-main-card-list slot-dist-var-list';
      const tot = pivot.slotTotals[s] || 0;
      const rawEntries = pivot.mains
        .map((main) => ({
          main,
          c: (pivot.cell[main] && pivot.cell[main][s]) || 0,
        }))
        .filter((e) => e.c > 0)
        .sort((a, b) => b.c - a.c);
      const entries = rawEntries.slice(0, 7);

      if (!tot || !entries.length) {
        const li = document.createElement('li');
        li.className = 'slot-main-card-li slot-main-card-li--empty';
        li.textContent = (tloc && tloc.dashboardSlotCardEmpty) || '\u2014';
        listEl.appendChild(li);
        return;
      }

      const maxC = entries[0].c;
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        const pct = tot ? Math.round((e.c / tot) * 1000) / 10 : 0;
        const barW = maxC ? Math.round((e.c / maxC) * 100) : 0;
        const li = document.createElement('li');
        li.className = 'slot-main-card-li';
        li.innerHTML =
          `<span class="slot-main-card-name">${escapeHtml(e.main)}</span>` +
          `<span class="slot-main-card-track" aria-hidden="true"><span class="slot-main-card-bar" style="width:${barW}%"></span></span>` +
          `<span class="slot-main-card-stat"><span class="slot-main-card-n">${e.c}</span>` +
          `<span class="slot-main-card-p">${pct}%</span></span>`;
        listEl.appendChild(li);
      }
    };

    const mainsSection = document.createElement('section');
    mainsSection.className = 'slot-mains-section';
    const mainsTitle = document.createElement('h3');
    mainsTitle.className = 'slot-dist-section-title';
    mainsTitle.textContent = (tloc && tloc.dashboardSlotMainsTitle) || 'Main stats (2 / 4 / 6)';

    const varGrid = document.createElement('div');
    varGrid.className = 'slot-dist-variable-grid';
    for (const s of [2, 4, 6]) {
      const article = document.createElement('article');
      article.className = 'slot-dist-var-block';
      const hd = document.createElement('header');
      hd.className = 'slot-dist-var-hdr';
      hd.textContent = slotHdr(s);
      const list = document.createElement('ul');
      fillVariableList(list, s);
      article.appendChild(hd);
      article.appendChild(list);
      varGrid.appendChild(article);
    }

    mainsSection.appendChild(mainsTitle);
    mainsSection.appendChild(varGrid);
    root.appendChild(mainsSection);

    hostEl.appendChild(root);
    return animateCharts ? slotShareTargets : null;
  }

  const TOP_SPD_RADAR_WEAK_RATIO = 0.72;

  function topSpdSlotExcluded(slotNum) {
    return (slotNum | 0) === TOP_SPD_SKIP_SLOT;
  }

  function topSpdPeakForRune(r, usePotential) {
    if (usePotential) return sumRuneSpdSubsPotential(r);
    return sumRuneSpdSubs(r);
  }

  function buildTopSpdSlotPeaks(runes, selectedSet, usePotential) {
    const slots = TOP_SPD_GRID_SLOTS;
    const peaks = slots.map(() => 0);
    if (!selectedSet) return { peaks, maxPeak: 0, slots };
    const filtered = runes.filter((r) => r.setName === selectedSet);
    for (let i = 0; i < filtered.length; i++) {
      const r = filtered[i];
      const slot = r.slot | 0;
      const si = slots.indexOf(slot);
      if (si < 0) continue;
      const spd = topSpdPeakForRune(r, usePotential);
      if (spd > peaks[si]) peaks[si] = spd;
    }
    return { peaks, maxPeak: Math.max(...peaks, 0), slots };
  }

  function topSpdRadarVertex(cx, cy, radius, vertexIndex, scale) {
    const n = TOP_SPD_RADAR_VERTICES;
    const angle = -Math.PI / 2 + vertexIndex * ((2 * Math.PI) / n);
    const r = radius * scale;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function topSpdRadarPolygonPoints(cx, cy, radius, scales) {
    const parts = [];
    for (let i = 0; i < TOP_SPD_RADAR_VERTICES; i++) {
      const p = topSpdRadarVertex(cx, cy, radius, i, scales[i]);
      parts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
    }
    return parts.join(' ');
  }

  function topSpdRadarSlotIndexAtPoint(cx, cy, x, y) {
    const dx = x - cx;
    const dy = y - cy;
    if (Math.hypot(dx, dy) < 12) return -1;
    const n = TOP_SPD_RADAR_VERTICES;
    let ang = Math.atan2(dy, dx) + Math.PI / 2;
    if (ang < 0) ang += Math.PI * 2;
    return Math.floor(ang / ((2 * Math.PI) / n)) % n;
  }

  function readTopSpdSortMetric() {
    try {
      const v = localStorage.getItem(TOP_SPD_SORT_METRIC_KEY);
      return v === 'pot' ? 'pot' : 'cur';
    } catch (e) {
      return 'cur';
    }
  }

  function readTopSpdSortDesc() {
    try {
      const v = localStorage.getItem(TOP_SPD_SORT_DIR_KEY);
      return v !== 'asc';
    } catch (e) {
      return true;
    }
  }

  function syncTopSpdSortControls(tloc) {
    const metric = readTopSpdSortMetric();
    const desc = readTopSpdSortDesc();
    const curBtn = document.getElementById('btn-top-spd-sort-cur');
    const potBtn = document.getElementById('btn-top-spd-sort-pot');
    const dirBtn = document.getElementById('btn-top-spd-sort-dir');
    const dirLbl = document.getElementById('lbl-top-spd-sort-dir');
    const metricGrp = document.getElementById('top-spd-sort-metric');
    if (curBtn) curBtn.classList.toggle('is-active', metric === 'cur');
    if (potBtn) potBtn.classList.toggle('is-active', metric === 'pot');
    if (metricGrp && tloc) {
      metricGrp.setAttribute('aria-label', tloc.dashboardTopSpdSortMetricAria || '');
    }
    if (dirBtn) {
      dirBtn.dataset.dir = desc ? 'desc' : 'asc';
      dirBtn.setAttribute('aria-pressed', desc ? 'true' : 'false');
      dirBtn.title = desc
        ? (tloc && tloc.dashboardTopSpdSortDescTitle) || ''
        : (tloc && tloc.dashboardTopSpdSortAscTitle) || '';
    }
    if (dirLbl) dirLbl.textContent = desc ? '\u2193' : '\u2191';
  }

  function compareTopSpdRunes(a, b, metric, desc) {
    const primary = metric === 'pot' ? sumRuneSpdSubsPotential : sumRuneSpdSubs;
    const secondary = metric === 'pot' ? sumRuneSpdSubs : sumRuneSpdSubsPotential;
    const va = primary(a);
    const vb = primary(b);
    if (va !== vb) return desc ? vb - va : va - vb;
    const sa = secondary(a);
    const sb = secondary(b);
    if (sa !== sb) return desc ? sb - sa : sa - sb;
    return 0;
  }

  function bindTopSpdRadarInteraction(hostEl, peaks, potPeaks, tloc, geom) {
    const svg = hostEl.querySelector('.top-spd-radar__svg');
    if (!svg) return;
    let tip = hostEl.querySelector('.top-spd-radar-tip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'top-spd-radar-tip';
      tip.hidden = true;
      hostEl.appendChild(tip);
    }
    const slotLblTmpl = (tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}';
    const curLbl = (tloc && tloc.dashboardTopSpdRadarLegendCur) || 'Current';
    const potLbl = (tloc && tloc.dashboardTopSpdRadarLegendPot) || 'Potential';
    const slots = geom.slots || TOP_SPD_GRID_SLOTS;

    const clearHover = () => {
      tip.hidden = true;
      hostEl.classList.remove('top-spd-radar-host--hover');
      svg.querySelectorAll('.top-spd-radar__axis--hot').forEach((el) => {
        el.classList.remove('top-spd-radar__axis--hot');
      });
    };

    const showSlot = (slotIdx, clientX, clientY) => {
      if (slotIdx < 0) {
        clearHover();
        return;
      }
      const slotNum = slots[slotIdx];
      const cur = peaks[slotIdx] || 0;
      const pot = potPeaks[slotIdx] || 0;
      const slotName = slotLblTmpl.replace('{n}', String(slotNum));
      tip.textContent =
        cur > 0
          ? pot > cur
            ? `${slotName}: ${curLbl} +${cur} · ${potLbl} +${pot}`
            : `${slotName}: ${curLbl} +${cur}`
          : `${slotName}: —`;
      hostEl.classList.add('top-spd-radar-host--hover');
      const axis = svg.querySelector(`.top-spd-radar__axis[data-slot="${slotIdx}"]`);
      if (axis) axis.classList.add('top-spd-radar__axis--hot');
      const hostRect = hostEl.getBoundingClientRect();
      tip.hidden = false;
      tip.style.left = `${clientX - hostRect.left + 12}px`;
      tip.style.top = `${clientY - hostRect.top + 12}px`;
    };

    svg.addEventListener('pointermove', (ev) => {
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const loc = pt.matrixTransform(ctm.inverse());
      showSlot(topSpdRadarSlotIndexAtPoint(geom.cx, geom.cy, loc.x, loc.y), ev.clientX, ev.clientY);
    });
    svg.addEventListener('pointerleave', clearHover);
  }

  function topSpdRadarLabelTexts(peaks, potPeaks, norms, slots, tloc) {
    const slotLblTmpl = (tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}';
    return slots.map((slotNum, i) => {
      const weak = norms[i] > 0 && norms[i] < TOP_SPD_RADAR_WEAK_RATIO;
      let valTxt = '\u2014';
      if (peaks[i] > 0) {
        valTxt = potPeaks[i] > peaks[i] ? `+${peaks[i]}/${potPeaks[i]}` : `+${peaks[i]}`;
      }
      return {
        slotLbl: slotLblTmpl.replace('{n}', String(slotNum)),
        valTxt,
        weak,
      };
    });
  }

  function applyTopSpdRadarLabels(svg, labelData) {
    labelData.forEach((row, i) => {
      const slotEl = svg.querySelector(`.top-spd-radar__slot[data-slot="${i}"]`);
      const valEl = svg.querySelector(`.top-spd-radar__val[data-slot="${i}"]`);
      if (slotEl) {
        slotEl.textContent = row.slotLbl;
        slotEl.classList.toggle('top-spd-radar__slot--weak', row.weak);
      }
      if (valEl) valEl.textContent = row.valTxt;
    });
  }

  function renderTopSpdRadar(hostEl, runes, selectedSet, tloc, opts) {
    if (!hostEl) return;
    const animate = !(opts && opts.animate === false);
    const motionApi = window.SWRM_MOTION;
    const legendEl = document.getElementById('top-spd-radar-legend');
    const setLegend = (show) => {
      if (!legendEl) return;
      legendEl.hidden = !show;
      legendEl.setAttribute('aria-hidden', show ? 'false' : 'true');
    };
    if (!selectedSet) {
      if (motionApi && motionApi.cancelTopSpdRadar) motionApi.cancelTopSpdRadar();
      hostEl.innerHTML = '';
      hostEl.setAttribute('aria-hidden', 'true');
      hostEl.classList.remove('top-spd-radar-host--interactive');
      hostEl._topSpdRadarReady = false;
      setLegend(false);
      return;
    }
    const curData = buildTopSpdSlotPeaks(runes, selectedSet, false);
    const potData = buildTopSpdSlotPeaks(runes, selectedSet, true);
    const peaks = curData.peaks;
    const potPeaks = potData.peaks;
    const slots = curData.slots || TOP_SPD_GRID_SLOTS;
    const maxPeak = Math.max(curData.maxPeak, potData.maxPeak, 0);
    if (!maxPeak) {
      const emptyTxt = escapeHtml((tloc && tloc.dashboardTopSpdRadarEmpty) || '\u2014');
      hostEl.innerHTML =
        `<div class="top-spd-radar__empty">${emptyTxt}</div>`;
      hostEl.setAttribute('aria-hidden', 'true');
      hostEl.classList.remove('top-spd-radar-host--interactive');
      hostEl._topSpdRadarReady = false;
      setLegend(false);
      return;
    }
    hostEl.removeAttribute('aria-hidden');
    hostEl.classList.add('top-spd-radar-host--interactive');
    const norms = peaks.map((v) => v / maxPeak);
    const potNorms = potPeaks.map((v) => v / maxPeak);
    const cx = TOP_SPD_RADAR_CX;
    const cy = TOP_SPD_RADAR_CY;
    const R = TOP_SPD_RADAR_R;
    const labelR = R + TOP_SPD_RADAR_LABEL_OFFSET;
    const geom = { cx, cy, R, labelR, slots };
    const slotLblTmpl = (tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}';
    const ariaBase = (tloc && tloc.dashboardTopSpdRadarAria) || 'SPD strength by slot';
    const ariaParts = slots
      .map((slotNum, i) => {
        const v = peaks[i];
        const pot = potPeaks[i];
        return pot > v && v > 0
          ? `${slotLblTmpl.replace('{n}', String(slotNum))} +${v} (+${pot} pot.)`
          : `${slotLblTmpl.replace('{n}', String(slotNum))} +${v || 0}`;
      })
      .join(', ');
    const curPoints = topSpdRadarPolygonPoints(cx, cy, R, norms);
    const potPoints = topSpdRadarPolygonPoints(cx, cy, R, potNorms);
    const labelData = topSpdRadarLabelTexts(peaks, potPeaks, norms, slots, tloc);
    setLegend(true);

    const svgExisting = hostEl.querySelector('.top-spd-radar__svg');
    const curPoly = svgExisting && svgExisting.querySelector('.top-spd-radar__fill--cur');
    const potPoly = svgExisting && svgExisting.querySelector('.top-spd-radar__fill--pot');

    if (svgExisting && curPoly && potPoly && hostEl._topSpdRadarReady && animate) {
      svgExisting.setAttribute('aria-label', `${ariaBase}: ${ariaParts}`);
      const started =
        motionApi &&
        motionApi.animateTopSpdRadar &&
        motionApi.animateTopSpdRadar({
          curPoly,
          potPoly,
          curPoints,
          potPoints,
          onMid: () => applyTopSpdRadarLabels(svgExisting, labelData),
        });
      if (!started) {
        curPoly.setAttribute('points', curPoints);
        potPoly.setAttribute('points', potPoints);
        applyTopSpdRadarLabels(svgExisting, labelData);
      }
      bindTopSpdRadarInteraction(hostEl, peaks, potPeaks, tloc, geom);
      return;
    }

    if (motionApi && motionApi.cancelTopSpdRadar) motionApi.cancelTopSpdRadar();

    let svg = `<svg class="top-spd-radar__svg" viewBox="0 0 ${TOP_SPD_RADAR_VB_W} ${TOP_SPD_RADAR_VB_H}" role="img" aria-label="${escapeHtml(`${ariaBase}: ${ariaParts}`)}">`;

    for (const ring of [0.25, 0.5, 0.75, 1]) {
      const ringScales = Array(TOP_SPD_RADAR_VERTICES).fill(ring);
      svg += `<polygon class="top-spd-radar__ring" points="${topSpdRadarPolygonPoints(cx, cy, R, ringScales)}" />`;
    }
    for (let i = 0; i < TOP_SPD_RADAR_VERTICES; i++) {
      const end = topSpdRadarVertex(cx, cy, R, i, 1);
      svg += `<line class="top-spd-radar__axis" data-slot="${i}" x1="${cx}" y1="${cy}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" />`;
    }
    svg += `<polygon class="top-spd-radar__fill top-spd-radar__fill--pot" points="${potPoints}" />`;
    svg += `<polygon class="top-spd-radar__fill top-spd-radar__fill--cur" points="${curPoints}" />`;

    for (let i = 0; i < TOP_SPD_RADAR_VERTICES; i++) {
      const lp = topSpdRadarVertex(cx, cy, labelR, i, 1);
      const row = labelData[i];
      const slotCls = row.weak
        ? 'top-spd-radar__slot top-spd-radar__slot--weak'
        : 'top-spd-radar__slot';
      svg += `<text class="${slotCls}" data-slot="${i}" x="${lp.x.toFixed(2)}" y="${(lp.y - 5).toFixed(2)}" text-anchor="middle">${escapeHtml(row.slotLbl)}</text>`;
      svg += `<text class="top-spd-radar__val" data-slot="${i}" x="${lp.x.toFixed(2)}" y="${(lp.y + 11).toFixed(2)}" text-anchor="middle">${escapeHtml(row.valTxt)}</text>`;
    }
    svg += '</svg>';
    hostEl.innerHTML = svg;
    hostEl._topSpdRadarReady = true;
    bindTopSpdRadarInteraction(hostEl, peaks, potPeaks, tloc, geom);
  }

  function renderTopSpdPanel(runes, selectedSet, tloc, opts) {
    syncTopSpdSortControls(tloc);
    renderTopSpdRadar(
      document.getElementById('top-spd-radar-host'),
      runes,
      selectedSet,
      tloc,
      opts,
    );
    renderTopSpdGrid(document.getElementById('top-spd-grid'), runes, selectedSet, tloc);
  }

  function renderTopSpdGrid(gridEl, runes, selectedSet, tloc) {
    if (!gridEl) return;
    gridEl.innerHTML = '';
    if (!selectedSet) {
      const empty = document.createElement('div');
      empty.className = 'top-spd-slot-empty';
      empty.style.gridColumn = '1 / -1';
      empty.textContent = (tloc && tloc.dashboardTopSpdPickHint) || '';
      gridEl.appendChild(empty);
      return;
    }
    const filtered = runes.filter((r) => r.setName === selectedSet);
    const slots = TOP_SPD_GRID_SLOTS || [1, 3, 4, 5, 6];
    for (let si = 0; si < slots.length; si++) {
      const slot = slots[si];
      const col = document.createElement('div');
      col.className = 'top-spd-slot-col';
      const hdr = document.createElement('div');
      hdr.className = 'top-spd-slot-hdr';
      hdr.textContent = ((tloc && tloc.dashboardTopSpdSlotLabel) || 'Slot {n}').replace('{n}', String(slot));
      col.appendChild(hdr);
      const inSlot = filtered.filter((r) => (r.slot | 0) === slot);
      const metric = readTopSpdSortMetric();
      const desc = readTopSpdSortDesc();
      inSlot.sort((a, b) => compareTopSpdRunes(a, b, metric, desc));
      const pick = inSlot.slice(0, TOP_SPD_PER_SLOT);
      if (!pick.length) {
        const empty = document.createElement('div');
        empty.className = 'top-spd-slot-empty';
        empty.textContent = (tloc && tloc.dashboardTopSpdNoRunes) || '\u2014';
        col.appendChild(empty);
      } else {
        for (let pi = 0; pi < pick.length; pi++) {
          const r = pick[pi];
          const grade = String(r.gradeStr || '').trim();
          const btn = document.createElement('button');
          btn.type = 'button';
          const pot = sumRuneSpdSubsPotential(r);
          const cur = sumRuneSpdSubs(r);
          btn.className =
            pot > cur ? 'top-spd-chip top-spd-chip--has-pot' : 'top-spd-chip';
          const chipLabel = formatTopSpdChipLabel(r, tloc);
          btn.textContent = chipLabel;
          btn.title = chipLabel;
          const setNm = selectedSet;
          const sl = slot;
          btn.addEventListener('click', () => {
            navigateToRuneTableWithFilters({
              verdict: '',
              role: '',
              gradeStr: gradeStrForDashboardNav(),
              set: setNm,
              slot: String(sl),
              clearSearch: true,
            });
          });
          col.appendChild(btn);
        }
      }
      gridEl.appendChild(col);
    }
  }

  function resolveTopSpdSetPick(preferredName, setOrder) {
    const order = setOrder || [];
    if (preferredName !== null && preferredName !== undefined) {
      if (preferredName === '') return '';
      if (order.includes(preferredName)) return preferredName;
    }
    if (order.includes(TOP_SPD_DEFAULT_SET)) return TOP_SPD_DEFAULT_SET;
    return order[0] || '';
  }

  function fillTopSpdSetSelect(selectEl, setOrder, tloc, preferredName) {
    if (!selectEl) return;
    const blank = escapeHtml((tloc && tloc.dashboardTopSpdNoneOption) || '\u2014');
    const opts = [`<option value="">${blank}</option>`].concat(
      (setOrder || []).map((nm) => `<option value="${escapeHtml(nm)}">${escapeHtml(nm)}</option>`),
    );
    selectEl.innerHTML = opts.join('');
    selectEl.value = resolveTopSpdSetPick(preferredName, setOrder);
  }

  function medianSorted(sorted) {
    const n = sorted.length;
    if (!n) return null;
    const mid = Math.floor(n / 2);
    if (n % 2) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
