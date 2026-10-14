// src/features/shell/theme-nav.ts — theme, header, and navigation bindings
import { getShellState, updateShellState } from './bootstrap';

function applyThemeDom(): void {
  const toggle = document.getElementById('theme-toggle');
  const { currentTheme } = getShellState();
  const isLight = currentTheme === 'light';
  document.body.classList.toggle('light-theme', isLight);
  if (toggle) {
    toggle.classList.toggle('is-light', isLight);
    toggle.classList.toggle('is-dark', !isLight);
    toggle.setAttribute('aria-pressed', isLight ? 'true' : 'false');
  }
}

export function setTheme(mode: 'light' | 'dark'): void {
  const theme = mode === 'dark' ? 'dark' : 'light';
  updateShellState({ currentTheme: theme });
  localStorage.setItem('swrm-theme', theme);
  applyThemeDom();
  const { currentLang } = getShellState();
  const t = (window.SWRM?.TRANSLATIONS?.[currentLang] || window.SWRM?.TRANSLATIONS?.en || {}) as Translation;
  updateHeaderThemeA11y(t);
}

export function toggleTheme(): void {
  const { currentTheme } = getShellState();
  setTheme(currentTheme === 'dark' ? 'light' : 'dark');
}

export function initTheme(): void {
  applyThemeDom();
}

function updateHeaderThemeA11y(t: Translation): void {
  const group = document.getElementById('header-theme-group');
  const toggle = document.getElementById('theme-toggle');
  if (group) group.setAttribute('aria-label', t.themeGroupAria || t.theme || 'Theme');
  if (!toggle) return;
  const { currentTheme } = getShellState();
  const isLight = currentTheme === 'light';
  const label = isLight
    ? (t.themeDarkTitle || 'Dark theme')
    : (t.themeLightTitle || 'Light theme');
  toggle.setAttribute('title', label);
  toggle.setAttribute('aria-label', label);
}

export function stageDisplayName(tr: Translation, stageKey: string): string {
  if (!stageKey) return '\u2014';
  const map: Record<string, string> = { Early: tr.early || 'Early', Mid: tr.mid || 'Mid', Late: tr.late || 'Late' };
  return map[stageKey] || stageKey;
}

export function updateStageAdvisorLabels(t: Translation): void {
  const setText = (id: string, text: string | undefined): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = text || '';
  };
  setText('lbl-stage-advisor-title', t.stageAdvisorTitle || '');
  setText('lbl-stage-advisor-lead', t.stageAdvisorLead || '');
  setText('lbl-stage-suggested', t.stageSuggestedLabel || '');
  setText('lbl-stage-your-preset', t.stageYourPresetLabel || '');
  setText('lbl-stage-metrics-explainer', t.stageMetricsExplainer || '');
  const formulaEl = document.getElementById('lbl-stage-formula');
  if (formulaEl) {
    const ft = (t.stageFormulaExpl || '').trim();
    formulaEl.textContent = ft;
    formulaEl.hidden = !ft;
  }
  setText('lbl-card-hr-name', (t.stageCardHrName || '').trim());
  setText('lbl-card-hr-desc', t.stageCardHrDesc || '');
  setText('lbl-card-keep-name', (t.stageCardKeepName || '').trim());
  setText('lbl-card-keep-desc', t.stageCardKeepDesc || '');
  setText('lbl-card-meta-name', (t.stageCardMetaName || '').trim());
  setText('lbl-card-meta-desc', t.stageCardMetaDesc || '');
  setText('lbl-card-hr-weight', t.stageCardHrWeight || '');
  setText('lbl-card-keep-weight', t.stageCardKeepWeight || '');
  setText('lbl-card-meta-weight', t.stageCardMetaWeight || '');
  const btnAuto = document.getElementById('btn-auto-stage');
  if (btnAuto) {
    btnAuto.textContent = t.stageApplySuggestion || 'Apply suggestion';
    const aria = String(t.stageApplySuggestionAria || t.stageApplySuggestion || '').trim();
    if (aria) btnAuto.setAttribute('aria-label', aria);
    else btnAuto.removeAttribute('aria-label');
  }
  setText('lbl-dashboard-strictness', t.dashboardStrictnessLabel || 'Strictness');
}
