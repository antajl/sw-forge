// js/features/rules/constants-ui.js — constants grid rendering
  function collectStatConstantsFromForm() {
    const wrap = document.getElementById('stat-constants-wrap');
    if (!wrap || !wrap.querySelector('.sc-inp')) {
      return window.SWRM.mergeStatConstants(window.SWRM.settings.statConstants || null);
    }
    const order = window.SWRM.GOD_STAT_ORDER || [];
    const raw = {};
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      raw[stat] = {};
      const fields = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
      for (let fi = 0; fi < fields.length; fi++) {
        const f = fields[fi];
        const el = document.querySelector(`#stat-constants-wrap [data-sc-stat="${stat}"][data-sc-field="${f}"]`);
        if (!el) continue;
        const v = parseFloat(el.value);
        if (!Number.isFinite(v)) continue;
        const unit = el.getAttribute('data-sc-unit');
        raw[stat][f] = unit === 'percent' ? v / 100 : v;
      }
    }
    return window.SWRM.mergeStatConstants(raw);
  }

  const HR_PREVIEW_COL_KEYS = [
    'Early_Hero', 'Early_Leg', 'Mid_Hero', 'Mid_Leg', 'Late_Hero', 'Late_Leg',
  ];

  function thresholdPreviewColLabels(tloc) {
    const gte = (tloc && tloc.previewThresholdGte) || '≥';
    return HR_PREVIEW_COL_KEYS.map((col) => {
      const [stage, gradeKey] = col.split('_');
      const grade = gradeKey === 'Leg' ? 'Leg' : 'Hero';
      const gradeLabel = grade === 'Leg'
        ? ((tloc && tloc.previewGradeLegend) || 'Leg')
        : ((tloc && tloc.previewGradeHero) || 'Hero');
      return `${gte} ${stage} ${gradeLabel}`;
    });
  }

  function formatPreviewCell(v) {
    if (v == null || v === '') return '—';
    const n = Number(v);
    return Number.isFinite(n) ? String(Math.round(n)) : String(v);
  }

  function renderGodRollPreview(containerId, sc, tloc) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const gte = (tloc && tloc.previewThresholdGte) || '≥';
    const cStat = (tloc && tloc.constantsColStat) || 'Stat';
    const hHero = `${gte} ${(tloc && tloc.previewGradeHero) || 'Hero'}`;
    const hLeg = `${gte} ${(tloc && tloc.previewGradeLegend) || 'Legend'}`;
    let html = `<table class="s-table s-table--preview" role="region" aria-readonly="true" aria-label="God Roll preview"><thead><tr><th>${cStat}</th><th>${hHero}</th><th>${hLeg}</th></tr></thead><tbody>`;
    const order = window.SWRM.GOD_STAT_ORDER || [];
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      const vHero = window.SWRM.getGodThreshold(stat, { statConstants: sc }, 'Hero');
      const vLeg = window.SWRM.getGodThreshold(stat, { statConstants: sc }, 'Legend');
      html += `<tr><td>${escapeHtml(stat)}</td><td>${escapeHtml(formatPreviewCell(vHero))}</td><td>${escapeHtml(formatPreviewCell(vLeg))}</td></tr>`;
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function renderReadonlyMatrix(containerId, rowLabelKey, dataObj, colKeys, colLabels, rowOrder) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const keys = rowOrder && rowOrder.length ? rowOrder : Object.keys(dataObj || {});
    let html = `<table class="s-table s-table--preview" role="region" aria-readonly="true" aria-label="Engine threshold preview (read-only)"><thead><tr><th>${rowLabelKey}</th>`;
    for (let i = 0; i < colLabels.length; i++) html += `<th>${colLabels[i]}</th>`;
    html += '</tr></thead><tbody>';
    for (let ri = 0; ri < keys.length; ri++) {
      const rowKey = keys[ri];
      const vals = dataObj[rowKey];
      if (!vals) continue;
      const rowLabel = String(rowKey).replace(/_/g, ' ');
      html += `<tr><td>${escapeHtml(rowLabel)}</td>`;
      for (let ci = 0; ci < colKeys.length; ci++) {
        const c = colKeys[ci];
        const v = vals[c];
        html += `<td>${escapeHtml(formatPreviewCell(v))}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    el.innerHTML = html;
  }

  function refreshEnginePreviews() {
    const sc = document.getElementById('stat-constants-wrap')
      ? collectStatConstantsFromForm()
      : (window.SWRM.settings.statConstants || window.SWRM.DEFAULT_STAT_CONSTANTS);
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const hr = window.SWRM.computeHrThresholds(sc);
    const duo = window.SWRM.computeDuoThresholds(sc, hr);
    const colKeys = HR_PREVIEW_COL_KEYS;
    const colLabels = thresholdPreviewColLabels(tloc);
    const statOrder = window.SWRM.GOD_STAT_ORDER || [];
    const rowStat = (tloc && tloc.constantsColStat) || 'Stat';
    renderGodRollPreview('god-preview-wrap', sc, tloc);
    renderReadonlyMatrix('hr-preview-wrap', rowStat, hr, colKeys, colLabels, statOrder);
    renderReadonlyMatrix('duo-preview-wrap', rowStat, duo, colKeys, colLabels, statOrder);
  }

  function statConstantDecimalToPercentInput(d) {
    if (d == null || !Number.isFinite(Number(d))) return '';
    const p = Number(d) * 100;
    return String(Math.round(p * 100) / 100);
  }

  function escapeAttr(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function wireStatConstantsTableInputs(wrap) {
    wrap.querySelectorAll('.sc-inp').forEach((inp) => {
      inp.addEventListener('input', () => {
        refreshEnginePreviews();
      });
    });
  }

  function buildStatConstantsTable() {
    const wrap = document.getElementById('stat-constants-wrap');
    if (!wrap) return;
    const sc = window.SWRM.settings.statConstants || window.SWRM.DEFAULT_STAT_CONSTANTS;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const cStat = tloc.constantsColStat || 'Stat';
    const cB = tloc.godColBase || 'Base';
    const cG = tloc.godColMod || 'God (+%)';
    const cD = tloc.constColDuoMod || 'Duo −%';
    const cE = tloc.constColEarly || 'Early %';
    const cL = tloc.constColLate || 'Late %';
    const cGm = tloc.constColGrade || 'Legend (−%)';
    const hB = escapeAttr(tloc.constantsColHintBase || '');
    const hG = escapeAttr(tloc.constantsColHintGod || '');
    const hD = escapeAttr(tloc.constantsColHintDuo || '');
    const hE = escapeAttr(tloc.constantsColHintEarly || '');
    const hL = escapeAttr(tloc.constantsColHintLate || '');
    const hGm = escapeAttr(tloc.constantsColHintGrade || '');
    let html = `<table class="s-table stat-constants-table"><thead><tr><th>${cStat}</th>`;
    html += `<th title="${hB}">${cB}</th><th title="${hG}">${cG}</th><th title="${hD}">${cD}</th>`;
    html += `<th title="${hE}">${cE}</th><th title="${hL}">${cL}</th><th title="${hGm}">${cGm}</th></tr></thead><tbody>`;
    const order = window.SWRM.GOD_STAT_ORDER || [];
    const percentFields = new Set(['godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod']);
    for (let i = 0; i < order.length; i++) {
      const stat = order[i];
      const row = sc[stat] || {};
      const fields = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
      html += `<tr><td>${stat}</td>`;
      for (let fi = 0; fi < fields.length; fi++) {
        const f = fields[fi];
        const val = row[f];
        const isPct = percentFields.has(f);
        const displayVal = isPct ? statConstantDecimalToPercentInput(val) : (val != null && val !== '' ? String(val) : '');
        const step = isPct ? '0.1' : '0.01';
        const unit = isPct ? 'percent' : 'raw';
        const tdCls = isPct ? ' sc-td--pct' : '';
        const suffix = isPct ? '<span class="sc-inp-suffix" aria-hidden="true">%</span>' : '';
        html += `<td class="sc-td${tdCls}"><span class="sc-inp-suffix-wrap">`;
        html += `<input type="number" class="sc-inp" data-sc-stat="${stat}" data-sc-field="${f}" data-sc-unit="${unit}" value="${displayVal}" step="${step}" />`;
        html += `${suffix}</span></td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
    wireStatConstantsTableInputs(wrap);
  }
