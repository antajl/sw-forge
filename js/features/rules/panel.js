// js/features/rules/panel.js — rules panel rendering
  // ===================== SETTINGS UI =====================
  function parseList(v) {
    return (v || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function hydrateGemMetaFields(gm) {
    const g = gm || DEFAULT_GEM_META;
    const el = id => document.getElementById(id);
    if (!el('gem-bad-flat-enabled')) return;
    el('gem-bad-flat-enabled').checked = g.legacyFlatSubGem !== false;
  }

  function renderRoleSettings() {
    const navWrap = document.getElementById('role-nav-list');
    const contentWrap = document.getElementById('roles-settings-wrap');
    
    if (!navWrap || !contentWrap) return;
    
    // Use advanced formulas if available, otherwise fall back to legacy roles
    const formulas = window.SWRM.settings.formulas || {};
    const roles = window.SWRM.settings.roles || {};
    // Formula config should win when role names overlap with legacy roles.
    const allRoles = { ...roles, ...formulas };
    const configuredNames = Object.keys(allRoles);
    const storedPriority = Array.isArray(window.SWRM.settings.rolePriority)
      ? window.SWRM.settings.rolePriority
      : [];
    const roleNames = [
      ...storedPriority.filter(name => configuredNames.includes(name)),
      ...configuredNames.filter(name => !storedPriority.includes(name)),
    ];
    window.SWRM.settings.rolePriority = roleNames.slice();
    let currentActiveRole = '';
    
    // Render navigation list
    let navHtml = '';
    for (let idx = 0; idx < roleNames.length; idx++) {
      const roleName = roleNames[idx];
      const roleCfg = allRoles[roleName];
      const isActive = currentActiveRole === '' || currentActiveRole === roleName;
      const isFormula = formulas[roleName] !== undefined;
      const displayName = roleName + (isFormula ? '' : ' (Legacy)');
      navHtml += `<div class="role-nav-item ${isActive ? 'active' : ''}" data-role="${roleName}">
        <span class="role-nav-main">
          <span class="role-prio-group">
          <button type="button" class="btn-ghost role-prio-btn" data-role-prio="${roleName}" data-dir="up" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="btn-ghost role-prio-btn" data-role-prio="${roleName}" data-dir="down" ${idx === roleNames.length - 1 ? 'disabled' : ''}>↓</button>
        </span>
          <span>${displayName}</span>
        </span>
      </div>`;
    }
    navWrap.innerHTML = navHtml;
    
    // Render content for active role - UNIFIED INTERFACE FOR ALL ROLES
    function renderActiveRole(roleName) {
      currentActiveRole = roleName;
      const roleCfg = allRoles[roleName];
      const isFormula = formulas[roleName] !== undefined;
      
      let html = '';
      
      // UNIFIED INTERFACE - All roles get the same advanced interface
      html += `<div style="margin-bottom:20px">`;
      
      // Role header with enable toggle
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px">`;
      html += `<div style="font-family:var(--font-head);font-size:1.1rem;font-weight:700;color:var(--text-hi)">${roleName}${isFormula ? '' : ' (Legacy)'}</div>`;
      
      if (isFormula) {
        html += `<label style="display:flex;align-items:center;gap:8px;font-size:0.9rem;color:var(--text)">
          <input type="checkbox" data-formula="${roleName}" data-field="enabled" ${roleCfg.enabled !== false ? 'checked' : ''} style="width:18px;height:18px">
          Enable Formula
        </label>`;
      } else {
        html += `<button class="btn-ghost btn-remove-role" data-role-remove="${roleName}" ${Object.keys(roles).length <= 1 ? 'disabled' : ''}>Remove</button>`;
      }
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

      // Accepted Mains section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Accepted Mains</div>`;
      html += `<div style="display:grid;grid-template-columns:80px 1fr;gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Allowed mains (comma-separated)</div>`;
      
      for (const slot of [2, 4, 6]) {
        const mainsText = acceptedMainsToText(roleCfg.acceptedMains?.[slot]);
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        const dataAttr = isFormula
          ? `data-formula="${roleName}" data-field="acceptedMains" data-slot="${slot}"`
          : `data-role="${roleName}" data-field="acceptedMains" data-slot="${slot}"`;
        const safeValue = String(mainsText).replace(/"/g, '&quot;');
        html += `<input type="text" ${dataAttr} value="${safeValue}" placeholder="None or SPD, HP%, DEF%" style="padding:4px 8px;font-size:0.8rem">`;
      }
      html += `</div></div>`;
      
      // Sub-stats section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Sub-stats</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stat</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const stats = ['SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
      for (const stat of stats) {
        html += `<div style="font-weight:600;color:var(--text)">${stat}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = (isFormula ? roleCfg.substats?.[stat]?.[stage] : roleCfg.substats?.[stat]) || 'None';
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="substats" data-stat="${stat}" data-stage="${stage}"` : `data-role="${roleName}" data-field="substats" data-stat="${stat}" data-stage="${stage}"`;
          html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['Include', 'None', 'Exclude'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Must Have section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Must Have (Required Substat)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Stage</div><div>Early</div><div>Mid</div><div>Late</div>`;
      html += `<div style="font-weight:600;color:var(--text)">Required</div>`;
      
      for (const stage of ['Early', 'Mid', 'Late']) {
        const value = (isFormula ? roleCfg.mustHave?.[stage] : roleCfg.mustHave?.[stage]) || 'None';
        const dataAttr = isFormula ? `data-formula="${roleName}" data-field="mustHave" data-stage="${stage}"` : `data-role="${roleName}" data-field="mustHave" data-stage="${stage}"`;
        html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
        const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
        for (const opt of options) {
          html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
        }
        html += `</select>`;
      }
      html += `</div></div>`;
      
      // Slot Requirements section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Slot Requirements (Required Stats per Slot)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      for (const slot of [2, 4, 6]) {
        html += `<div style="font-weight:600;color:var(--text)">Slot ${slot}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = (isFormula ? roleCfg.slotRequirements?.[slot]?.[stage] : 'None') || 'None';
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="slotRequirements" data-slot="${slot}" data-stage="${stage}"` : `data-role="${roleName}" data-field="slotRequirements" data-slot="${slot}" data-stage="${stage}"`;
          html += `<select ${dataAttr} style="padding:4px 8px;font-size:0.8rem">`;
          const options = ['None', 'SPD', 'HP%', 'ATK%', 'DEF%', 'CRate', 'CDmg', 'ACC', 'RES'];
          for (const opt of options) {
            html += `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt === 'None' ? '' : opt}</option>`;
          }
          html += `</select>`;
        }
      }
      html += `</div></div>`;
      
      // Min Stats section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Min Stats (excluding Must Have)</div>`;
      html += `<div style="display:grid;grid-template-columns:80px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Slot Type</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const slotTypes = ['1/3/5', 'Slot 2', 'Slot 4', 'Slot 6'];
      for (const slotType of slotTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${slotType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = isFormula
            ? (typeof window.SWRM.readFormulaMinStat === 'function'
              ? window.SWRM.readFormulaMinStat(roleCfg.minStats, slotType, stage)
              : roleCfg.minStats?.[slotType]?.[stage] || 1)
            : (roleCfg.minStats?.[stage] || 1);
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}"` : `data-role="${roleName}" data-field="minStats" data-slot="${slotType}" data-stage="${stage}"`;
          html += `<input type="number" ${dataAttr} value="${value}" min="0" max="4" style="padding:4px 8px;font-size:0.8rem;width:60px">`;
        }
      }
      html += `</div></div>`;
      
      // Anchor Requirements section - FOR ALL ROLES
      html += `<div style="margin-bottom:16px">`;
      html += `<div style="font-size:0.85rem;color:var(--text-dim);margin-bottom:8px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Anchor Requirements (High Roll for Hero/Legend)</div>`;
      html += `<div style="display:grid;grid-template-columns:140px repeat(3,1fr);gap:8px;font-size:0.82rem;">`;
      html += `<div style="font-weight:600;color:var(--text)">Requirement</div><div>Early</div><div>Mid</div><div>Late</div>`;
      
      const anchorTypes = ['High Roll for Hero', 'High Roll for Legend'];
      for (const anchorType of anchorTypes) {
        html += `<div style="font-weight:600;color:var(--text)">${anchorType}</div>`;
        for (const stage of ['Early', 'Mid', 'Late']) {
          const value = (isFormula ? roleCfg.requireHR?.[anchorType]?.[stage] : false) || false;
          const dataAttr = isFormula ? `data-formula="${roleName}" data-field="requireHR" data-anchor="${anchorType}" data-stage="${stage}"` : `data-role="${roleName}" data-field="requireHR" data-anchor="${anchorType}" data-stage="${stage}"`;
          html += `<input type="checkbox" ${dataAttr} ${value ? 'checked' : ''} style="width:18px;height:18px">`;
        }
      }
      html += `</div></div>`;
      
      html += `</div>`;
      
      contentWrap.innerHTML = html;
      
      // Add event listeners
      contentWrap.querySelectorAll('input[data-formula], select[data-formula], input[data-role], select[data-role]').forEach(element => {
        element.addEventListener('change', handleAdvancedFormulaChange);
      });
      
      // Remove role buttons for legacy roles
      contentWrap.querySelectorAll('.btn-remove-role').forEach(btn => {
        btn.addEventListener('click', () => {
          const roleName = btn.dataset.roleRemove;
          if (Object.keys(roles).length <= 1) return;
          delete window.SWRM.settings.roles[roleName];
          window.SWRM.settings.rolePriority = (window.SWRM.settings.rolePriority || []).filter(name => name !== roleName);
          saveSettings(window.SWRM.settings);
          renderRoleSettings();
          refreshRoleFilterOptions();
          if (processedRunes.length) reprocess();
        });
      });
    }
    
    // Set first role as active by default
    const firstRole = roleNames[0];
    if (firstRole) {
      renderActiveRole(firstRole);
    }
    
    // Add navigation click handlers
    navWrap.querySelectorAll('.role-nav-item').forEach(item => {
      item.addEventListener('click', (event) => {
        if (event.target && event.target.closest('.role-prio-btn')) return;
        const roleName = item.dataset.role;
        
        // Update active state
        navWrap.querySelectorAll('.role-nav-item').forEach(navItem => {
          navItem.classList.remove('active');
        });
        item.classList.add('active');
        
        // Render content
        renderActiveRole(roleName);
      });
    });
    navWrap.querySelectorAll('.role-prio-btn').forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const roleName = btn.dataset.rolePrio;
        const dir = btn.dataset.dir;
        const order = Array.isArray(window.SWRM.settings.rolePriority)
          ? window.SWRM.settings.rolePriority.slice()
          : roleNames.slice();
        const index = order.indexOf(roleName);
        if (index < 0) return;
        const target = dir === 'up' ? index - 1 : index + 1;
        if (target < 0 || target >= order.length) return;
        const tmp = order[target];
        order[target] = order[index];
        order[index] = tmp;
        window.SWRM.settings.rolePriority = order;
        saveSettings(window.SWRM.settings);
        renderRoleSettings();
        refreshRoleFilterOptions();
        if (processedRunes.length) reprocess();
      });
    });
    
  }

  function refreshRoleFilterOptions() {
    const roleSelect = document.getElementById('filter-role');
    if (!roleSelect) return;
    const current = roleSelect.value;
    const formulas = Object.keys(window.SWRM.settings.formulas || {});
    const roleNamesRaw = Array.from(new Set([...formulas, ...Object.keys(window.SWRM.settings.roles || {})]));
    const roleNames = roleNamesRaw.map((n) => (n === 'High Roll' ? 'God Roll' : n));
    const defaultPriority = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS'];
    const storedPriority = (Array.isArray(window.SWRM.settings.rolePriority)
      ? window.SWRM.settings.rolePriority
      : defaultPriority
    ).map((n) => (n === 'High Roll' ? 'God Roll' : n));
    const orderedRoles = [
      ...storedPriority.filter((name) => roleNames.includes(name) || name === 'God Roll'),
      ...roleNames.filter((name) => !storedPriority.includes(name)),
    ].filter((name, idx, arr) => arr.indexOf(name) === idx);
    const roles = [...orderedRoles, 'Duo Roll', 'God Roll'].filter(
      (name, idx, arr) => arr.indexOf(name) === idx,
    );
    const t = TRANSLATIONS[currentLang];
    const godLbl = t.roleGodRoll || 'God Roll';
    roleSelect.innerHTML =
      `<option value="">${t.allRoles || 'All Roles'}</option>` +
      roles
        .map((r) => {
          const value = r === 'High Roll' ? 'God Roll' : r;
          const label = value === 'God Roll' ? godLbl : r;
          return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
        })
        .join('');
    const cur = current === 'High Roll' ? 'God Roll' : current;
    if (roles.includes(cur) || cur === 'God Roll') roleSelect.value = cur;
  }
