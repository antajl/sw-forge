/**
 * GSAP motion helpers for SW Rune Master.
 * Requires global `gsap` (loaded before this file). Falls back when missing or reduced motion.
 */
(function (global) {
  'use strict';

  const gsap = global.gsap;

  /** Clear stuck GSAP stage state after reload / bfcache (prevents expanded panel + huge metric SVG flash). */
  function bootStageMotionGuard() {
    const doc = global.document;
    if (!doc) return;
    const wrap =
      doc.getElementById('stage-advisor-expanded-wrap') ||
      doc.querySelector('.dashboard-stage-wrap .stage-advisor-expanded-wrap');
    if (!wrap) return;
    wrap.classList.remove('is-motion-running');
    wrap.style.height = '';
    wrap.style.overflow = '';
    wrap.style.minHeight = '';
    if (gsap) {
      gsap.killTweensOf(wrap);
      const inner = wrap.querySelector('.stage-advisor-expanded');
      if (inner) gsap.killTweensOf(inner);
      gsap.set(wrap, { clearProps: 'height,overflow,minHeight,borderTopWidth,borderTopColor' });
      if (inner) gsap.set(inner, { clearProps: 'opacity' });
    }
  }

  bootStageMotionGuard();
  if (global.document) {
    global.document.addEventListener('DOMContentLoaded', bootStageMotionGuard, { once: true });
    global.addEventListener('pageshow', bootStageMotionGuard);
  }

  let reducedMotion = false;
  const mq = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)');

  function refreshReduced() {
    reducedMotion = !!(mq && mq.matches);
  }

  refreshReduced();
  if (mq && mq.addEventListener) mq.addEventListener('change', refreshReduced);
  else if (mq && mq.addListener) mq.addListener(refreshReduced);

  function enabled() {
    return !!gsap && !reducedMotion;
  }

  let stageTimeline = null;

  function killTweensOf(el) {
    if (!el || !gsap) return;
    gsap.killTweensOf(el);
  }

  function killStage() {
    if (stageTimeline) {
      stageTimeline.kill();
      stageTimeline = null;
    }
    const wrap =
      global.document &&
      (global.document.getElementById('stage-advisor-expanded-wrap') ||
        global.document.querySelector('.dashboard-stage-wrap .stage-advisor-expanded-wrap'));
    if (!wrap) return;
    killTweensOf(wrap);
    const inner = wrap.querySelector('.stage-advisor-expanded');
    if (inner) killTweensOf(inner);
    wrap.classList.remove('is-motion-running');
    if (gsap) gsap.set(wrap, { clearProps: 'height,overflow,minHeight,borderTopWidth,borderTopColor' });
    if (inner && gsap) gsap.set(inner, { clearProps: 'opacity' });
  }

  /**
   * @param {{ collapsed: boolean, wrap: HTMLElement|null, inner: HTMLElement|null, root: HTMLElement|null, onComplete?: () => void }} opts
   * @returns {boolean} true if GSAP animation started
   */
  function animateStageAdvisor(opts) {
    const { collapsed, wrap, inner, root, onComplete } = opts || {};
    if (!enabled() || !wrap) return false;

    killStage();
    wrap.classList.add('is-motion-running');
    if (root) {
      root.classList.remove(
        'is-panel-closing',
        'is-panel-closing-shrink',
        'is-panel-opening',
      );
      wrap.classList.remove('is-panel-opening-ready', 'is-panel-content-locked', 'is-panel-shrinking');
    }

    const finish = () => {
      wrap.classList.remove('is-motion-running');
      gsap.set(wrap, { clearProps: 'height,overflow,minHeight,borderTopWidth' });
      if (inner) gsap.set(inner, { clearProps: 'opacity' });
      stageTimeline = null;
      onComplete && onComplete();
    };

    if (collapsed) {
      const startH = Math.max(wrap.offsetHeight, wrap.scrollHeight);
      gsap.set(wrap, { height: startH, overflow: 'hidden' });
      stageTimeline = gsap.timeline({ onComplete: finish });
      if (inner) stageTimeline.to(inner, { opacity: 0, duration: 0.14, ease: 'power1.in' }, 0);
      stageTimeline.to(wrap, { height: 0, duration: 0.32, ease: 'power3.inOut' }, inner ? 0.05 : 0);
      return true;
    }

    if (root) root.classList.remove('is-compact');
    gsap.set(wrap, { height: 0, overflow: 'hidden' });
    if (inner) gsap.set(inner, { opacity: 0 });
    wrap.style.height = 'auto';
    const targetH = wrap.offsetHeight;
    wrap.style.height = '0px';
    stageTimeline = gsap.timeline({ onComplete: finish });
    stageTimeline.to(wrap, { height: targetH, duration: 0.32, ease: 'power3.inOut' });
    if (inner) {
      stageTimeline.to(inner, { opacity: 1, duration: 0.2, ease: 'power1.out' }, '-=0.14');
    }
    return true;
  }

  let dashGen = 0;
  let dashTimeline = null;

  /**
   * @param {{ host: HTMLElement, current: HTMLElement|null, next: HTMLElement, onComplete: () => void }} opts
   * @returns {boolean}
   */
  function animateDashUnifiedTab(opts) {
    const { host, current, next, onComplete } = opts || {};
    if (!enabled() || !host || !next) return false;

    const gen = ++dashGen;
    if (dashTimeline) dashTimeline.kill();

    host.classList.add('dash-unified-panes--gsap');
    next.classList.add('is-shown');
    next.removeAttribute('hidden');
    next.setAttribute('aria-hidden', 'false');
    gsap.set(next, { opacity: 0 });

    const panes = host.querySelectorAll('.dash-unified-pane');
    killTweensOf(panes);

    dashTimeline = gsap.timeline({
      onComplete: () => {
        if (gen !== dashGen) return;
        dashTimeline = null;
        gsap.set(panes, { clearProps: 'opacity' });
        onComplete && onComplete();
      },
    });

    if (current && current !== next) {
      current.classList.remove('is-active');
      dashTimeline.to(current, { opacity: 0, duration: 0.22, ease: 'power1.inOut' }, 0);
    }
    next.classList.add('is-active');
    dashTimeline.to(next, { opacity: 1, duration: 0.22, ease: 'power1.inOut' }, 0);
    animateDashboardPaneBars(next);
    return true;
  }

  function cancelDashUnifiedTab() {
    dashGen++;
    if (dashTimeline) {
      dashTimeline.kill();
      dashTimeline = null;
    }
  }

  /**
   * Sliding underline under Dashboard “Distributions” subtabs (Verdict / Roles / …).
   * @param {{ nav: HTMLElement|null, activeKey: string, instant?: boolean }} opts
   * @returns {boolean} true when a GSAP tween ran
   */
  function positionDashUnifiedTabIndicator(opts) {
    const { nav, activeKey, instant } = opts || {};
    const ind = nav && nav.querySelector('.dash-unified-tabs__indicator');
    const key = String(activeKey || '').trim();
    const btn =
      (key && document.getElementById(`dash-unified-tab-${key}`)) ||
      (key && nav && nav.querySelector(`[data-dash-uni="${key}"]`)) ||
      (key && nav && nav.querySelector(`[data-dash-art-tab="${key}"]`)) ||
      (nav && nav.querySelector('.is-active')) ||
      null;
    if (!nav || !ind || !btn) return false;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const x = Math.max(0, btnRect.left - navRect.left);
    const w = Math.max(0, btnRect.width);
    killTweensOf(ind);
    const snap = () => {
      ind.style.left = `${x}px`;
      ind.style.width = `${w}px`;
    };
    if (instant || !enabled()) {
      snap();
      return false;
    }
    gsap.to(ind, {
      left: x,
      width: w,
      duration: 0.32,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    return true;
  }

  /**
   * Sliding underline under Runes Hub tabs (Dashboard / Table / Rules).
   * @param {{ nav: HTMLElement|null, activeKey: string, instant?: boolean }} opts
   * @returns {boolean} true when a GSAP tween ran
   */
  function positionRunesHubTabIndicator(opts) {
    const { nav, activeKey, instant } = opts || {};
    const ind = nav && nav.querySelector('.runes-hub-tabs__indicator');
    const key = ['dashboard', 'runetable', 'settings'].includes(activeKey) ? activeKey : 'dashboard';
    const btn = document.getElementById(`runes-hub-tab-${key}`);
    if (!nav || !ind || !btn) return false;
    const x = btn.offsetLeft;
    const w = Math.max(0, btn.offsetWidth);
    killTweensOf(ind);
    const snap = () => {
      ind.style.left = `${x}px`;
      ind.style.width = `${w}px`;
    };
    if (instant || !enabled()) {
      snap();
      return false;
    }
    gsap.to(ind, {
      left: x,
      width: w,
      duration: 0.32,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    return true;
  }

  /**
   * Sliding underline under Rules sub-tabs (Engine / Roles / Verdict rules).
   * @param {{ nav: HTMLElement|null, activeKey: string, instant?: boolean }} opts
   * @returns {boolean} true when a GSAP tween ran
   */
  function positionRulesSubtabIndicator(opts) {
    const { nav, activeKey, instant } = opts || {};
    const ind = nav && nav.querySelector('.rules-subtabs__indicator');
    const key = [
      'engine',
      'roles',
      'verdict',
      'artifact-roles',
      'artifact-verdict',
      'artifact-synergies',
    ].includes(activeKey)
      ? activeKey
      : 'engine';
    const btn = document.getElementById(`rules-subtab-${key}`);
    if (!nav || !ind || !btn) return false;
    const label = btn.querySelector('.rules-subtab__label');
    const navRect = nav.getBoundingClientRect();
    const targetRect = (label || btn).getBoundingClientRect();
    const x = Math.max(0, targetRect.left - navRect.left);
    const w = Math.max(0, targetRect.width);
    killTweensOf(ind);
    const snap = () => {
      ind.style.left = `${x}px`;
      ind.style.width = `${w}px`;
    };
    if (instant || !enabled()) {
      snap();
      return false;
    }
    gsap.to(ind, {
      left: x,
      width: w,
      duration: 0.32,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    return true;
  }

  const subpanelTimelines = new WeakMap();

  /**
   * @param {HTMLElement[]} panels
   * @param {(panel: HTMLElement) => boolean} isTarget
   * @param {boolean} instant
   */
  function swapSubpanels(panels, isTarget, instant) {
    const list = Array.isArray(panels) ? panels : [];
    const active = list.find((p) => isTarget(p));
    const prev = list.find((p) => p.classList.contains('is-active') && p !== active);
    if (!active) return;
    if (prev === active) return;

    list.forEach((p) => {
      const prevTl = subpanelTimelines.get(p);
      if (prevTl) {
        prevTl.kill();
        subpanelTimelines.delete(p);
      }
      killTweensOf(p);
    });

    const applyInstant = () => {
      list.forEach((p) => {
        const on = p === active;
        p.classList.toggle('is-active', on);
        if (gsap) gsap.set(p, { clearProps: 'opacity' });
      });
    };

    if (instant || !enabled()) {
      applyInstant();
      return;
    }

    active.classList.add('is-active');
    gsap.set(active, { opacity: 0 });
    if (prev) prev.classList.add('rules-subpanel--exit');
    const tl = gsap.timeline({
      onComplete: () => {
        subpanelTimelines.delete(active);
        if (prev) {
          prev.classList.remove('is-active', 'rules-subpanel--exit');
          gsap.set(prev, { clearProps: 'opacity' });
        }
        gsap.set(active, { clearProps: 'opacity' });
      },
    });
    if (prev) {
      tl.to(prev, { opacity: 0, duration: 0.2, ease: 'power1.inOut' }, 0);
    }
    tl.to(active, { opacity: 1, duration: 0.2, ease: 'power1.inOut' }, 0);
    subpanelTimelines.set(active, tl);
  }

  function toastIn(el) {
    if (!el) return false;
    if (!enabled()) return false;
    killTweensOf(el);
    gsap.set(el, { opacity: 0, x: 20 });
    gsap.to(el, { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' });
    return true;
  }

  function toastOut(el, onComplete) {
    if (!el) {
      onComplete && onComplete();
      return false;
    }
    if (!enabled()) return false;
    killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      x: 16,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(el, { clearProps: 'opacity,transform' });
        onComplete && onComplete();
      },
    });
    return true;
  }

  function floatTipIn(el) {
    if (!el || !enabled()) return false;
    killTweensOf(el);
    gsap.set(el, { opacity: 0, y: 4 });
    gsap.to(el, { opacity: 1, y: 0, duration: 0.14, ease: 'power2.out' });
    return true;
  }

  function floatTipOut(el, onComplete) {
    if (!el) {
      onComplete && onComplete();
      return false;
    }
    if (!enabled()) return false;
    killTweensOf(el);
    gsap.to(el, {
      opacity: 0,
      y: 4,
      duration: 0.12,
      ease: 'power1.in',
      onComplete: () => {
        gsap.set(el, { clearProps: 'opacity,transform' });
        onComplete && onComplete();
      },
    });
    return true;
  }

  const CHART_ROW_FLIP_DURATION = 0.46;

  function playChartRowFlip(movedRows) {
    const rows = movedRows && movedRows.length ? movedRows : [];
    if (!rows.length) return;
    if (!enabled()) {
      rows.forEach((row) => {
        row.style.transform = '';
        row.style.transformOrigin = '';
        row.style.transition = '';
      });
      return;
    }
    killTweensOf(rows);
    rows.forEach((row) => {
      row.style.transition = 'none';
      const raw = row.style.transform || '';
      const m = raw.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*\)/);
      const x = m ? parseFloat(m[1]) : 0;
      const y = m ? parseFloat(m[2]) : 0;
      row.style.transform = '';
      gsap.set(row, { x, y, transformOrigin: '0 0' });
    });
    gsap.to(rows, {
      x: 0,
      y: 0,
      duration: CHART_ROW_FLIP_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(rows, { clearProps: 'transform,x,y,transformOrigin' });
        rows.forEach((row) => {
          row.style.transition = '';
        });
      },
    });
  }

  function tweenStyleTargets(targets, prop, duration, ease) {
    if (!targets.length) return;
    if (!enabled()) return;
    killTweensOf(targets.map((t) => t.el));
    targets.forEach(({ el, value }) => {
      gsap.to(el, {
        [prop]: value,
        duration,
        ease,
        overwrite: 'auto',
      });
    });
  }

  function parseStyleAmount(styleVal) {
    const m = String(styleVal || '').match(/([\d.]+)/);
    return m ? parseFloat(m[1]) : 0;
  }

  function collectDashboardPaneBarAnimations(pane) {
    const barEntries = [];
    const heightEntries = [];
    if (!pane) return { barEntries, heightEntries };

    pane.querySelectorAll('.chart-bar-fill, .slot-main-card-bar').forEach((el) => {
      const pct = parseStyleAmount(el.style.width);
      if (pct <= 0) return;
      barEntries.push({ el, pct });
    });

    pane.querySelectorAll('.slot-share-bar-fill').forEach((el) => {
      const pct = parseStyleAmount(el.style.height);
      if (pct <= 0) return;
      heightEntries.push({ el, value: `${pct}%`, zero: '0%' });
    });

    pane.querySelectorAll('.eff-bar').forEach((el) => {
      const px = parseStyleAmount(el.style.height);
      if (px <= 0) return;
      heightEntries.push({ el, value: `${px}px`, zero: '0px' });
    });

    return { barEntries, heightEntries };
  }

  /**
   * Replay bar grow animation for one Distributions pane (tab switch).
   * @param {HTMLElement} pane
   * @returns {boolean}
   */
  function animateDashboardPaneBars(pane) {
    if (!enabled() || !pane) return false;
    const { barEntries, heightEntries } = collectDashboardPaneBarAnimations(pane);
    if (!barEntries.length && !heightEntries.length) return false;

    barEntries.forEach(({ el }) => {
      killTweensOf(el);
      gsap.set(el, { width: '0%' });
    });
    heightEntries.forEach(({ el, zero }) => {
      killTweensOf(el);
      gsap.set(el, { height: zero });
    });

    animateBarWidthFills(barEntries);
    animateHeightFills(heightEntries);
    return true;
  }

  function animateBarWidthFills(entries) {
    if (!entries || !entries.length) return;
    const targets = entries
      .filter((e) => e && e.el)
      .map((e) => ({ el: e.el, value: `${Number(e.pct).toFixed(1)}%` }));
    tweenStyleTargets(targets, 'width', 0.5, 'power2.inOut');
  }

  function animateHeightFills(entries) {
    if (!entries || !entries.length) return;
    const targets = entries
      .filter((e) => e && e.el)
      .map((e) => ({ el: e.el, value: e.value }));
    tweenStyleTargets(targets, 'height', 0.4, 'power2.inOut');
  }

  let topSpdRadarGen = 0;

  /**
   * Morph Top SPD radar polygon `points` when the selected set changes.
   * @param {{ curPoly: SVGPolygonElement, potPoly: SVGPolygonElement, curPoints: string, potPoints: string, onMid?: () => void, instant?: boolean }} opts
   * @returns {boolean}
   */
  function animateTopSpdRadar(opts) {
    const { curPoly, potPoly, curPoints, potPoints, onMid, instant } = opts || {};
    if (!curPoly || !potPoly) return false;
    topSpdRadarGen++;
    const gen = topSpdRadarGen;
    killTweensOf([curPoly, potPoly]);

    if (instant || !enabled()) {
      curPoly.setAttribute('points', curPoints);
      potPoly.setAttribute('points', potPoints);
      onMid && onMid();
      return false;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        if (gen !== topSpdRadarGen) return;
      },
    });
    tl.to(
      curPoly,
      { attr: { points: curPoints }, duration: 0.48, ease: 'power2.inOut' },
      0,
    );
    tl.to(
      potPoly,
      { attr: { points: potPoints }, duration: 0.48, ease: 'power2.inOut' },
      0,
    );
    if (onMid) tl.call(onMid, [], 0.18);
    return true;
  }

  function cancelTopSpdRadar() {
    topSpdRadarGen++;
  }

  if (enabled() && global.document && global.document.documentElement) {
    global.document.documentElement.classList.add('swrm-has-gsap');
  }

  global.SWRM_MOTION = {
    enabled,
    reduced: () => reducedMotion,
    killStage,
    animateStageAdvisor,
    cancelDashUnifiedTab,
    animateDashUnifiedTab,
    positionDashUnifiedTabIndicator,
    positionRunesHubTabIndicator,
    positionRulesSubtabIndicator,
    swapSubpanels,
    toastIn,
    toastOut,
    floatTipIn,
    floatTipOut,
    playChartRowFlip,
    animateBarWidthFills,
    animateHeightFills,
    animateDashboardPaneBars,
    animateTopSpdRadar,
    cancelTopSpdRadar,
    killTweensOf,
  };
})(typeof window !== 'undefined' ? window : globalThis);
