// js/features/rules/artifact-rules-ui.js — Artifacts rules: Roles, Verdict, Synergies

  let artifactRoleEditId = null;

  function artifactSubLabel(typeId) {
    const fmt = window.SWRM && window.SWRM.formatArtifactSubLine;
    if (fmt) {
      const line = fmt({ type: typeId, value: 0 });
      return line.replace(/\+0%?$/, '').replace(/\s+0%$/, '').trim() || `t${typeId}`;
    }
    return `t${typeId}`;
  }

  function allArtifactSubIds() {
    const fmt = window.SWRM && window.SWRM.ARTIFACT_SUB_FORMAT || {};
    return Object.keys(fmt)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
  }

  function currentArtifactRules() {
    return window.SWRM.mergeArtifactRules(window.SWRM.settings.artifactRules);
  }

  function persistArtifactRules(rules) {
    const merged = window.SWRM.mergeArtifactRules(rules);
    window.SWRM.settings.artifactRules = merged;
    if (typeof window.SWRM.saveArtifactRulesStorage === 'function') {
      window.SWRM.saveArtifactRulesStorage(merged);
    }
    const persist = JSON.parse(JSON.stringify(window.SWRM.settings));
    delete persist.hrThresholds;
    delete persist.duoThresholds;
    delete persist.godConstants;
    delete persist.hrCoeff;
    if (typeof saveSettings === 'function') saveSettings(persist);
    if (typeof refreshArtifactVerdictsAndTable === 'function') refreshArtifactVerdictsAndTable();
  }

  function onArtifactRulesChanged() {
    persistArtifactRules(collectArtifactRulesFromOpenPanels());
  }

  function collectArtifactRulesFromOpenPanels() {
    const base = currentArtifactRules();
    const verdictHost = document.getElementById('artifact-verdict-rules-form');
    if (verdictHost) {
      base.minUsefulLegend =
        parseInt(document.getElementById('artifact-min-useful-legend')?.value, 10) ||
        base.minUsefulLegend;
      base.minUsefulHero =
        parseInt(document.getElementById('artifact-min-useful-hero')?.value, 10) ||
        base.minUsefulHero;
      const synEn = document.getElementById('artifact-synergies-enabled');
      base.synergiesEnabled = synEn ? synEn.checked : base.synergiesEnabled !== false;
    }
    const synHost = document.getElementById('artifact-synergies-form');
    if (synHost) {
      base.synergyPairs.forEach((pair, i) => {
        const cb = synHost.querySelector(`input[data-art-synergy-idx="${i}"]`);
        if (cb) pair.enabled = cb.checked;
      });
      Object.keys(base.mainSubSynergy).forEach((mainKey) => {
        const cb = synHost.querySelector(`input[data-art-main-synergy="${mainKey}"]`);
        if (cb) base.mainSubSynergy[mainKey].enabled = cb.checked;
      });
    }
    return base;
  }

  function slugRoleId(name) {
    return String(name || 'role')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `role-${Date.now()}`;
  }

  function collectRoleFromEditor() {
    const name = document.getElementById('artifact-role-edit-name')?.value.trim();
    if (!name) return null;
    const mainSel = document.getElementById('artifact-role-edit-main')?.value || '';
    const mainStat = mainSel === 'ATK' || mainSel === 'DEF' || mainSel === 'HP' ? mainSel : null;
    const usefulSubs = [];
    document.querySelectorAll('#artifact-role-subs-list input[data-art-role-sub]:checked').forEach((inp) => {
      const id = Number(inp.dataset.artRoleSub);
      if (Number.isFinite(id)) usefulSubs.push(id);
    });
    return {
      id: artifactRoleEditId || slugRoleId(name),
      name,
      mainStat,
      usefulSubs,
    };
  }

  function saveRoleFromEditor() {
    const role = collectRoleFromEditor();
    if (!role) return;
    const rules = currentArtifactRules();
    const roles = rules.artifactRoles?.roles ? rules.artifactRoles.roles.slice() : [];
    const idx = roles.findIndex((r) => r.id === role.id || r.name === role.name);
    if (idx >= 0) roles[idx] = role;
    else roles.push(role);
    rules.artifactRoles = { roles };
    artifactRoleEditId = role.id;
    persistArtifactRules(rules);
    renderArtifactRolesPanel(true);
  }

  function deleteArtifactRole(roleId) {
    const rules = currentArtifactRules();
    const roles = (rules.artifactRoles?.roles || []).filter((r) => r.id !== roleId);
    if (roles.length < 1) return;
    rules.artifactRoles = { roles };
    if (artifactRoleEditId === roleId) artifactRoleEditId = null;
    persistArtifactRules(rules);
    renderArtifactRolesPanel(true);
  }

  function openRoleEditor(roleDef) {
    artifactRoleEditId = roleDef ? roleDef.id : null;
    const editor = document.getElementById('artifact-role-editor');
    if (!editor) return;
    editor.hidden = false;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const title = document.getElementById('artifact-role-editor-title');
    if (title) {
      title.textContent = roleDef
        ? t.artifactRolesEdit || 'Edit role'
        : t.artifactRolesAdd || 'Add role';
    }
    document.getElementById('artifact-role-edit-name').value = roleDef ? roleDef.name : '';
    document.getElementById('artifact-role-edit-main').value = roleDef?.mainStat || '';
    const enabled = new Set((roleDef?.usefulSubs || []).map(Number));
    document.querySelectorAll('#artifact-role-subs-list input[data-art-role-sub]').forEach((inp) => {
      const id = Number(inp.dataset.artRoleSub);
      inp.checked = enabled.has(id);
    });
    editor.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function renderArtifactRolesPanel(force) {
    const host = document.getElementById('artifact-roles-form');
    if (!host) return;
    if (!force && host.dataset.rendered === '1') return;
    const rules = currentArtifactRules();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const roles = rules.artifactRoles?.roles || [];

    let cards = '';
    roles.forEach((r) => {
      const mainLabel = r.mainStat || t.artifactRoleMainStatNone || 'Any main';
      cards += `<article class="artifact-role-card" data-role-id="${escapeHtml(r.id)}">
        <h4 class="artifact-role-card__name">${escapeHtml(r.name)}</h4>
        <p class="artifact-role-card__meta">${escapeHtml(mainLabel)} · ${(r.usefulSubs || []).length} ${escapeHtml(t.artifactRoleUsefulSubs || 'useful subs')}</p>
        <div class="artifact-role-card__actions">
          <button type="button" class="btn-ghost btn-sm" data-art-role-edit="${escapeHtml(r.id)}">${escapeHtml(t.artifactRolesEdit || 'Edit')}</button>
          <button type="button" class="btn-ghost btn-sm artifact-role-card__delete" data-art-role-delete="${escapeHtml(r.id)}" ${roles.length <= 1 ? 'disabled' : ''}>×</button>
        </div>
      </article>`;
    });

    const subChecks = allArtifactSubIds()
      .map((subId) => {
        return `<label class="artifact-rules-check"><input type="checkbox" data-art-role-sub="${subId}" /><span>${escapeHtml(artifactSubLabel(subId))} <span class="artifact-sub-id">(${subId})</span></span></label>`;
      })
      .join('');

    host.innerHTML = `
      <p class="rules-card__desc">${escapeHtml(t.artifactRolesPanelDesc || '')}</p>
      <div class="artifact-role-cards">${cards}</div>
      <button type="button" class="btn-ghost" id="btn-artifact-role-add">+ ${escapeHtml(t.artifactRolesAdd || 'Add role')}</button>
      <div id="artifact-role-editor" class="artifact-role-editor" hidden>
        <h4 id="artifact-role-editor-title" class="artifact-role-editor__title"></h4>
        <div class="settings-row">
          <label for="artifact-role-edit-name">${escapeHtml(t.artifactRoleName || 'Role name')}</label>
          <input type="text" id="artifact-role-edit-name" />
        </div>
        <div class="settings-row">
          <label for="artifact-role-edit-main">${escapeHtml(t.artifactRoleMainStat || 'Expected main stat')}</label>
          <select id="artifact-role-edit-main">
            <option value="">${escapeHtml(t.artifactRoleMainStatNone || 'Any / no requirement')}</option>
            <option value="ATK">ATK</option>
            <option value="DEF">DEF</option>
            <option value="HP">HP</option>
          </select>
        </div>
        <p class="artifact-rules-subhead">${escapeHtml(t.artifactRoleSubList || 'Useful sub-stats')}</p>
        <div id="artifact-role-subs-list" class="artifact-rules-checks artifact-rules-checks--tall">${subChecks}</div>
        <div class="artifact-role-editor__foot">
          <button type="button" class="btn-primary" id="btn-artifact-role-save">Save role</button>
          <button type="button" class="btn-ghost" id="btn-artifact-role-cancel">Close</button>
        </div>
      </div>`;

    host.dataset.rendered = '1';

    host.querySelectorAll('[data-art-role-edit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-art-role-edit');
        const role = roles.find((r) => r.id === id);
        if (role) openRoleEditor(role);
      });
    });
    host.querySelectorAll('[data-art-role-delete]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-art-role-delete');
        if (id) deleteArtifactRole(id);
      });
    });
    document.getElementById('btn-artifact-role-add')?.addEventListener('click', () => openRoleEditor(null));
    document.getElementById('btn-artifact-role-save')?.addEventListener('click', saveRoleFromEditor);
    document.getElementById('btn-artifact-role-cancel')?.addEventListener('click', () => {
      const ed = document.getElementById('artifact-role-editor');
      if (ed) ed.hidden = true;
      artifactRoleEditId = null;
    });
  }

  function renderArtifactVerdictRulesPanel(force) {
    const host = document.getElementById('artifact-verdict-rules-form');
    if (!host) return;
    if (!force && host.dataset.rendered === '1') return;
    const rules = currentArtifactRules();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    host.innerHTML = `
      <p class="rules-card__desc">${escapeHtml(t.artifactVerdictRulesDesc || '')}</p>
      <div class="settings-row">
        <label for="artifact-min-useful-legend">${escapeHtml(t.artifactMinUsefulLegend || t.artifactRulesMinUsefulLegend || 'Min useful subs (Legend)')}</label>
        <input type="number" id="artifact-min-useful-legend" min="0" max="4" step="1" value="${rules.minUsefulLegend ?? 2}" />
      </div>
      <div class="settings-row">
        <label for="artifact-min-useful-hero">${escapeHtml(t.artifactMinUsefulHero || t.artifactRulesMinUsefulHero || 'Min useful subs (Hero)')}</label>
        <input type="number" id="artifact-min-useful-hero" min="0" max="4" step="1" value="${rules.minUsefulHero ?? 1}" />
      </div>
      <div class="settings-row">
        <label><input type="checkbox" id="artifact-synergies-enabled" ${rules.synergiesEnabled !== false ? 'checked' : ''} /> ${escapeHtml(t.artifactSynergiesEnable || 'Apply synergy bonuses to Keep/Sell score')}</label>
      </div>`;
    host.dataset.rendered = '1';
    host.querySelectorAll('input').forEach((el) => el.addEventListener('change', onArtifactRulesChanged));
  }

  function renderArtifactSynergiesPanel(force) {
    const host = document.getElementById('artifact-synergies-form');
    if (!host) return;
    if (!force && host.dataset.rendered === '1') return;
    const rules = currentArtifactRules();
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    let pairs = '';
    (rules.synergyPairs || []).forEach((pair, i) => {
      const bonus = Number(pair.bonus) || 0;
      pairs += `<label class="artifact-rules-check artifact-synergy-row">
        <input type="checkbox" data-art-synergy-idx="${i}" ${pair.enabled !== false ? 'checked' : ''} />
        <span>${escapeHtml(pair.label || pair.subs.join('+'))} <span class="artifact-synergy-bonus">+${bonus}</span></span>
      </label>`;
    });
    let mains = '';
    Object.entries(rules.mainSubSynergy || {}).forEach(([mainKey, ms]) => {
      const bonus = Number(ms.bonus) || 0;
      mains += `<label class="artifact-rules-check artifact-synergy-row">
        <input type="checkbox" data-art-main-synergy="${mainKey}" ${ms.enabled !== false ? 'checked' : ''} />
        <span>${escapeHtml(ms.label || `Main ${mainKey}`)} <span class="artifact-synergy-bonus">+${bonus}</span></span>
      </label>`;
    });
    host.innerHTML = `
      <p class="rules-card__desc">${escapeHtml(t.artifactSynergiesPanelDesc || '')}</p>
      <p class="artifact-rules-subhead">${escapeHtml(t.artifactRulesSynergyPairsLabel || 'Sub-stat pairs')}</p>
      <div class="artifact-rules-checks">${pairs}</div>
      <p class="artifact-rules-subhead">${escapeHtml(t.artifactRulesMainSubLabel || 'Main + sub combos')}</p>
      <div class="artifact-rules-checks">${mains}</div>`;
    host.dataset.rendered = '1';
    host.querySelectorAll('input').forEach((el) => el.addEventListener('change', onArtifactRulesChanged));
  }

  function renderActiveArtifactRulesPanel() {
    const panel = document.querySelector('#tab-settings .rules-subpanel.is-active[data-rules-subtab^="artifact"]');
    if (!panel) return;
    const id = panel.dataset.rulesSubtab;
    if (id === 'artifact-roles') renderArtifactRolesPanel(true);
    else if (id === 'artifact-verdict') renderArtifactVerdictRulesPanel(true);
    else if (id === 'artifact-synergies') renderArtifactSynergiesPanel(true);
  }

  function refreshArtifactRulesPanels() {
    ['artifact-roles-form', 'artifact-verdict-rules-form', 'artifact-synergies-form'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.dataset.rendered = '';
    });
    renderActiveArtifactRulesPanel();
  }

  function initArtifactRulesPanel() {
    const root = document.getElementById('tab-settings');
    if (!root) return;
    const obs = new MutationObserver(() => {
      const active = root.querySelector('.rules-subpanel.is-active');
      if (!active) return;
      const st = active.dataset.rulesSubtab;
      if (st === 'artifact-roles') renderArtifactRolesPanel();
      else if (st === 'artifact-verdict') renderArtifactVerdictRulesPanel();
      else if (st === 'artifact-synergies') renderArtifactSynergiesPanel();
    });
    root.querySelectorAll('.rules-subpanel').forEach((p) => {
      obs.observe(p, { attributes: true, attributeFilter: ['class'] });
    });
    renderActiveArtifactRulesPanel();
  }

  function refreshArtifactRulesPanelTexts() {
    refreshArtifactRulesPanels();
  }
