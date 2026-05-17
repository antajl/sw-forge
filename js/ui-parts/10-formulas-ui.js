// ui-parts/10-formulas-ui.js — slice of ui.monolith.bak.js L4073-4334
  // ===================== ADVANCED FORMULAS UI =====================
  function renderAdvancedFormulas() {
    const wrap = document.getElementById('advanced-formulas-wrap');
    if (!wrap) return;
    
    const formulas = window.SWRM.settings.formulas || {};
    let html = '';
    
    for (const [formulaName, formulaCfg] of Object.entries(formulas)) {
      html += `<div style="margin-bottom:32px; padding:20px; background:var(--bg3); border-radius:var(--radius-lg); border:1px solid var(--border);">`;
      
      // Formula header with enable toggle
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px">`;
      html += `<div style="font-family:var(--font-head);font-size:1.1rem;font-weight:700;color:var(--text-hi)">${formulaName}</div>`;
        html += `<label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;color:var(--text)">
          <input type="checkbox" data-formula="${formulaName}" data-field="enabled" ${formulaCfg.enabled !== false ? 'checked' : ''} style="width:18px;height:18px">
        Enable Formula
      </label>`;
      html += `</div>`;
      
      function acceptedMainsToText(raw) {
        if (Array.isArray(raw)) {
          const vals = raw.map((v) => String(v || '').trim()).filter((v) => v && v !== 'None');
          return vals.length ? vals.join(', ') : 'None';
        }
        if (typeof raw === 'string') {
          const txt = raw.trim();
          return txt || 'None';
        }
        return 'None';
      }

      // Accepted Mains section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Accepted Mains</div>`;
      html += `<div style="display:grid;grid-template-columns:80px 1fr;gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Allowed mains (comma-separated)</div>`;
      
      for (const slot of [2, 4, 6]) {
        const mainsText = acceptedMainsToText(formulaCfg.acceptedMains?.[slot]);
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        const safeValue = String(mainsText).replace(/"/g, '&quot;');
        html += `<input type="text" data-formula="${formulaName}" data-field="acceptedMains" data-slot="${slot}" value="${safeValue}" placeholder="None or SPD, HP%, DEF%" style="padding:4px 8px;font-size:0.8rem">`;
      }
      html += `</div></div>`;
      
      // Sub-stats section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Sub-stats</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stat</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const stats = ['SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
      for (const stat of stats) {
        html += `<div style="font-weight:600;color:var(--text)">${stat}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = formulaCfg.substats?.[stat]?.[stage] || 'None';
          html += `<select data-formula="${formulaName}" data-field="substats" data-stat="${stat}" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['Include', 'None', 'Exclude'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Must Have section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Must Have (Required Substat)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stage</div><div>Early</div><div>Mid</div><div>Late</div>`;
      html += `<div style="font-weight:600;color:var(--text)">Required</div>`;
      
      for (const stage of ['Early', 'Mid', 'Late']) {
        const value = formulaCfg.mustHave?.[stage] || 'None';
        html += `<select data-formula="${formulaName}" data-field="mustHave" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
        const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
        for (const opt of options) {
          html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
        }
        html += `</select>`;
      }
      html += `</div></div>`;
      
      // Slot Requirements section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Slot Requirements (Required Stats per Slot)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      for (const slot of [2, 4, 6]) {
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = formulaCfg.slotRequirements?.[slot]?.[stage] || 'None';
          html += `<select data-formula="${formulaName}" data-field="slotRequirements" data-slot="${slot}" data-stage="${stage}" style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Min Stats section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Min Stats (excluding Must Have)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot Type</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const slotTypes = ['1/3/5', 'Slot 2', 'Slot 4', 'Slot 6'];
      for (const slotType of slotTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${slotType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value =
            typeof window.SWRM.readFormulaMinStat === 'function'
              ? window.SWRM.readFormulaMinStat(formulaCfg.minStats, slotType, stage)
              : formulaCfg.minStats?.[slotType]?.[stage] || 1;
          html += `<input type="number" data-formula="${formulaName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}" value="${value}" min="0" max="4" style="padding:4px 8px;font-size:0.8rem;width:60px">`;
        }
      }
      html += `</div></div>`;
      
      // Anchor Requirements section
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Anchor Requirements (High Roll for Hero/Legend)</div>`;
      html += `<div style="display:grid;grid-template-columns:140px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Requirement</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const anchorTypes = ['High Roll for Hero', 'High Roll for Legend'];
      for (const anchorType of anchorTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${anchorType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = formulaCfg.requireHR?.[anchorType]?.[stage] || false;
          html += `<input type="checkbox" data-formula="${formulaName}" data-field="requireHR" data-anchor="${anchorType}" data-stage="${stage}" ${value ? 'checked' : ''} style="width:18px;height:18px">`;
        }
      }
      html += `</div></div>`;
      
      html += `</div>`;
    }
    
    wrap.innerHTML = html;
    
    // Add event listeners
    wrap.querySelectorAll('input, select').forEach(element => {
      element.addEventListener('change', handleAdvancedFormulaChange);
    });
  }
  
  function handleAdvancedFormulaChange(e) {
    const element = e.target;
    const formulaName = element.dataset.formula || element.dataset.role;
    const field = element.dataset.field;
    
    if (!formulaName || !field) return;
    
    let value;
    if (element.type === 'checkbox') {
      value = element.checked;
    } else if (element.type === 'number') {
      value = parseInt(element.value) || 0;
    } else {
      value = element.value;
    }
    
    // Check if this is a formula or legacy role
    const isFormula = window.SWRM.settings.formulas && window.SWRM.settings.formulas[formulaName] !== undefined;
    
    // Update settings object
    const settings = window.SWRM.settings;
    
    if (isFormula) {
      // Update formula settings
      if (!settings.formulas) settings.formulas = {};
      if (!settings.formulas[formulaName]) settings.formulas[formulaName] = {};
      
      // Handle nested properties
      if (field === 'enabled') {
        settings.formulas[formulaName].enabled = value;
      } else if (field === 'acceptedMains') {
        const slot = parseInt(element.dataset.slot, 10);
        if (!settings.formulas[formulaName].acceptedMains) settings.formulas[formulaName].acceptedMains = {};
        const cleaned = String(value || '').trim();
        settings.formulas[formulaName].acceptedMains[slot] = cleaned || 'None';
      } else if (field === 'substats') {
        const stat = element.dataset.stat;
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].substats) settings.formulas[formulaName].substats = {};
        if (!settings.formulas[formulaName].substats[stat]) settings.formulas[formulaName].substats[stat] = {};
        settings.formulas[formulaName].substats[stat][stage] = value;
      } else if (field === 'mustHave') {
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].mustHave) settings.formulas[formulaName].mustHave = {};
        settings.formulas[formulaName].mustHave[stage] = value || 'None';
      } else if (field === 'slotRequirements') {
        const slot = parseInt(element.dataset.slot);
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].slotRequirements) settings.formulas[formulaName].slotRequirements = {};
        if (!settings.formulas[formulaName].slotRequirements[slot]) settings.formulas[formulaName].slotRequirements[slot] = {};
        settings.formulas[formulaName].slotRequirements[slot][stage] = value;
      } else if (field === 'minStats') {
        const slotType = element.dataset.slot;
        const stage = element.dataset.stage;
        const fm = settings.formulas[formulaName];
        if (!fm.minStats) fm.minStats = {};
        const writeKey =
          typeof window.SWRM.formulaMinStatWriteKey === 'function'
            ? window.SWRM.formulaMinStatWriteKey(fm.minStats, slotType)
            : slotType;
        if (!fm.minStats[writeKey]) fm.minStats[writeKey] = {};
        fm.minStats[writeKey][stage] = value;
      } else if (field === 'requireHR') {
        const anchorType = element.dataset.anchor;
        const stage = element.dataset.stage;
        if (!settings.formulas[formulaName].requireHR) settings.formulas[formulaName].requireHR = {};
        if (!settings.formulas[formulaName].requireHR[anchorType]) settings.formulas[formulaName].requireHR[anchorType] = {};
        settings.formulas[formulaName].requireHR[anchorType][stage] = value;
      }
    } else {
      // Update legacy role settings
      if (!settings.roles) settings.roles = {};
      if (!settings.roles[formulaName]) settings.roles[formulaName] = {};
      
      // Handle nested properties for legacy roles
      if (field === 'substats') {
        const stat = element.dataset.stat;
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].substats) settings.roles[formulaName].substats = {};
        if (!settings.roles[formulaName].substats[stat]) settings.roles[formulaName].substats[stat] = {};
        settings.roles[formulaName].substats[stat][stage] = value;
      } else if (field === 'mustHave') {
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].mustHave) settings.roles[formulaName].mustHave = {};
        settings.roles[formulaName].mustHave[stage] = value || 'None';
      } else if (field === 'minStats') {
        const slotType = element.dataset.slot;
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].minStats) settings.roles[formulaName].minStats = {};
        if (!settings.roles[formulaName].minStats[slotType]) settings.roles[formulaName].minStats[slotType] = {};
        settings.roles[formulaName].minStats[slotType][stage] = value;
      } else if (field === 'requireHR') {
        const anchorType = element.dataset.anchor;
        const stage = element.dataset.stage;
        if (!settings.roles[formulaName].requireHR) settings.roles[formulaName].requireHR = {};
        if (!settings.roles[formulaName].requireHR[anchorType]) settings.roles[formulaName].requireHR[anchorType] = {};
        settings.roles[formulaName].requireHR[anchorType][stage] = value;
      }
    }

    // Apply immediately: persist + recompute results so toggles feel responsive.
    try {
      saveSettings(window.SWRM.settings);
    } catch (err) {
      console.warn('Failed to persist settings after formula change:', err);
    }
    if (processedRunes && processedRunes.length) {
      reprocess();
    }
  }
