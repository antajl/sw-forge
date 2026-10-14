import { updateShellState } from './bootstrap';

export function setTheme(_mode: 'light' | 'dark'): void {
  updateShellState({ currentTheme: 'light' });
}

export function toggleTheme(): void {
  // Single light workstation theme is active
}

export function initTheme(): void {
  // Single light workstation theme is active
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
