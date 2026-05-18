// js/features/runes/stage-advisor-ui.js — Stage Advisor visual and interaction logic
  function getStageExpandedWrap() {
    return (
      document.getElementById('stage-advisor-expanded-wrap') ||
      document.querySelector('.dashboard-stage-wrap .stage-advisor-expanded-wrap')
    );
  }

  function finishStageAdvisorCollapsed(collapsed) {
    const root = document.getElementById('stage-advisor');
    const btn = document.getElementById('btn-stage-compact');
    const expandedWrap = getStageExpandedWrap();
    if (!root || !btn) return;
    if (window.SWRM_MOTION) window.SWRM_MOTION.killStage();
    if (expandedWrap) {
      expandedWrap.style.minHeight = '';
      expandedWrap.style.transition = '';
      expandedWrap.classList.remove(
        'is-panel-content-locked',
        'is-panel-shrinking',
        'is-panel-opening-ready',
        'is-motion-running',
      );
    }
    root.classList.remove('is-panel-closing', 'is-panel-closing-shrink', 'is-panel-opening');
    if (collapsed) root.classList.add('is-compact');
    else root.classList.remove('is-compact');
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    if (expandedWrap) {
      if (collapsed) expandedWrap.setAttribute('aria-hidden', 'true');
      else expandedWrap.removeAttribute('aria-hidden');
    }
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    btn.title = collapsed ? (t.stageCompactExpand || '') : (t.stageCompactCollapse || '');
  }

  /** @param {boolean} collapsed — true = one-line bar only */
  function applyStageAdvisorCollapsed(collapsed, opts) {
    const instant = opts && opts.instant === true;
    const root = document.getElementById('stage-advisor');
    const btn = document.getElementById('btn-stage-compact');
    const expandedWrap = getStageExpandedWrap();
    if (!root || !btn) return;

    const wasCollapsed = root.classList.contains('is-compact');
    const wrapAnimating = expandedWrap && expandedWrap.classList.contains('is-motion-running');
    if (wasCollapsed === collapsed && !wrapAnimating) {
      finishStageAdvisorCollapsed(collapsed);
      return;
    }

    const motionApi = window.SWRM_MOTION;
    const motionOff =
      !motionApi || !motionApi.enabled() || motionApi.reduced();
    if (instant || motionOff) {
      finishStageAdvisorCollapsed(collapsed);
      return;
    }

    const inner = expandedWrap && expandedWrap.querySelector('.stage-advisor-expanded');

    if (collapsed) {
      btn.setAttribute('aria-expanded', 'false');
      const started = motionApi.animateStageAdvisor({
        collapsed: true,
        wrap: expandedWrap,
        inner,
        root,
        onComplete: () => finishStageAdvisorCollapsed(true),
      });
      if (!started) finishStageAdvisorCollapsed(true);
      return;
    }

    btn.setAttribute('aria-expanded', 'true');
    if (expandedWrap) expandedWrap.removeAttribute('aria-hidden');
    const started = motionApi.animateStageAdvisor({
      collapsed: false,
      wrap: expandedWrap,
      inner,
      root,
      onComplete: () => finishStageAdvisorCollapsed(false),
    });
    if (!started) finishStageAdvisorCollapsed(false);
  }

  /** Preset & suggestion UI: stage colors (Early/Mid/Late). */
  function syncGameStageVisualClasses(presetStageKey, suggestedStageKey, hasProgressionMetrics) {
    const sel = document.getElementById('stage-select');
    const wrap = sel && sel.closest('.stage-select-wrap');
    const root = document.getElementById('stage-advisor');
    const preset = String(presetStageKey || '').toLowerCase();
    const sug = String(suggestedStageKey || '').toLowerCase();

    ['early', 'mid', 'late'].forEach((k) => {
      if (sel) sel.classList.remove(`stage-select--${k}`);
      if (wrap) wrap.classList.remove(`stage-select-wrap--${k}`);
    });
    if (preset === 'early' || preset === 'mid' || preset === 'late') {
      if (sel) sel.classList.add(`stage-select--${preset}`);
      if (wrap) wrap.classList.add(`stage-select-wrap--${preset}`);
    }

    if (root) root.classList.remove('stage-accent-early', 'stage-accent-mid', 'stage-accent-late');
    if (hasProgressionMetrics && (sug === 'early' || sug === 'mid' || sug === 'late')) {
      if (root) root.classList.add(`stage-accent-${sug}`);
    }
  }

  function readStageProgressionExpanded() {
    try { return localStorage.getItem(STAGE_PROGRESSION_EXPANDED_KEY) === '1'; } catch (e) { return false; }
  }
