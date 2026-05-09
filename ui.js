// =============================================
// ui.js — Tabs, Dashboard, Table, Settings
// =============================================

(function() {
  const { parseSWEX, processAll, ROLE_PRIORITY, settings: cfg,
          STAT_NAMES, SET_NAMES, GRADE_SHORT, saveSettings,
          DEFAULT_THRESHOLDS, DEFAULT_HR_THRESHOLDS, DEFAULT_HR_COEFF,
          DEFAULT_DUO_THRESHOLDS, DEFAULT_ROLES } = window.SWRM;

  let allRunes = [];
  let stage    = 'Mid';
  let sortKey  = 'eff';
  let sortDir  = 'desc';

  // ===================== TABS =====================
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
    });
  });

  document.querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.stab-content').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`stab-${btn.dataset.stab}`).classList.remove('hidden');
    });
  });

  // ===================== STAGE =====================
  document.getElementById('stage-select').addEventListener('change', e => {
    stage = e.target.value;
    if (allRunes.length) reprocess();
  });

  // ===================== FILE UPLOAD =====================
  document.getElementById('json-upload').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const json = JSON.parse(ev.target.result);
        allRunes = parseSWEX(json);
        reprocess();
        document.getElementById('upload-prompt').classList.add('hidden');
        document.getElementById('tab-dashboard').classList.remove('hidden');
        // activate dashboard tab
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === 'dashboard');
        });
      } catch(err) {
        alert('Failed to parse JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  function reprocess() {
    const processed = processAll(allRunes, stage, window.SWRM.settings);
    allRunes = processed;
    renderDashboard(processed);
    renderTable(processed);
  }

  // ===================== DASHBOARD =====================
  function renderDashboard(runes) {
    const counts = { Keep:0, Sell:0, Grind:0, Finish:0, Reapp:0, Upgrade:0, Gem:0 };
    const roleCounts = {};
    const roleEff    = {};
    const setCounts  = {};
    const slotCounts = {1:0,2:0,3:0,4:0,5:0,6:0};
    const effBuckets = new Array(20).fill(0); // 5% buckets: 0-4, 5-9, ..., 95-99, 100+

    for (const r of runes) {
      counts[r.verdict] = (counts[r.verdict] || 0) + 1;

      if (r.role) {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        roleEff[r.role] = (roleEff[r.role] || []);
        roleEff[r.role].push(r.eff);
      }

      setCounts[r.setName] = (setCounts[r.setName] || 0) + 1;
      slotCounts[r.slot]   = (slotCounts[r.slot]   || 0) + 1;

      const bucket = Math.min(19, Math.floor(r.eff / 5));
      effBuckets[bucket]++;
    }

    // Summary cards
    const total = runes.length;
    setText('sc-total', total, '.sc-value');
    setText('sc-keep',  counts.Keep  || 0, '.sc-value');
    setText('sc-sell',  counts.Sell  || 0, '.sc-value');
    setText('sc-grind', counts.Grind || 0, '.sc-value');
    setText('sc-finish',counts.Finish|| 0, '.sc-value');
    setText('sc-reapp', (counts.Reapp||0) + (counts.Upgrade||0), '.sc-value');

    // Role chart
    const roleEl = document.getElementById('role-chart');
    roleEl.innerHTML = '';
    const sortedRoles = ROLE_PRIORITY.filter(r => roleCounts[r]);
    const maxCount = Math.max(...sortedRoles.map(r => roleCounts[r] || 0), 1);
    for (const role of sortedRoles) {
      const cnt = roleCounts[role] || 0;
      const avg = roleEff[role] ? (roleEff[role].reduce((a,b)=>a+b,0)/roleEff[role].length).toFixed(1) : '-';
      const pct = ((cnt / maxCount) * 100).toFixed(1);
      roleEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">${role}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
          <div class="chart-avg">${avg}%</div>
        </div>`;
    }

    // Set chart (top 10)
    const setEl = document.getElementById('set-chart');
    setEl.innerHTML = '';
    const topSets = Object.entries(setCounts).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const maxSet  = topSets[0]?.[1] || 1;
    for (const [name, cnt] of topSets) {
      const pct = ((cnt / maxSet) * 100).toFixed(1);
      setEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">${name}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%; background: linear-gradient(90deg,#2dd4c4,#4e9eff)">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
        </div>`;
    }

    // Slot chart
    const slotEl = document.getElementById('slot-chart');
    slotEl.innerHTML = '';
    const maxSlot = Math.max(...Object.values(slotCounts), 1);
    for (let s = 1; s <= 6; s++) {
      const cnt = slotCounts[s] || 0;
      const pct = ((cnt / maxSlot) * 100).toFixed(1);
      slotEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">Slot ${s}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%; background: linear-gradient(90deg,#b06aff,#7b5fff)">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
        </div>`;
    }

    // Efficiency histogram
    const effEl = document.getElementById('eff-chart');
    effEl.innerHTML = '';
    const maxBucket = Math.max(...effBuckets, 1);
    for (let i = 0; i < 20; i++) {
      const h = Math.max(4, (effBuckets[i] / maxBucket) * 72);
      const label = `${i*5}-${i*5+4}`;
      const cls = i >= 18 ? 'great' : i >= 14 ? 'good' : '';
      effEl.innerHTML += `
        <div class="eff-bar-wrap" title="${label}%: ${effBuckets[i]} runes">
          <div class="eff-bar ${cls}" style="height:${h}px"></div>
          <div class="eff-label">${i*5}</div>
        </div>`;
    }
  }

  function setText(id, val, sel) {
    const el = document.querySelector(`#${id} ${sel}`);
    if (el) el.textContent = val;
  }

  // ===================== TABLE =====================
  function renderTable(runes) {
    applyFiltersAndSort(runes);
  }

  let filteredRunes = [];

  function applyFiltersAndSort(runes) {
    const search  = (document.getElementById('search-box')?.value || '').toLowerCase();
    const verdict = document.getElementById('filter-verdict')?.value || '';
    const role    = document.getElementById('filter-role')?.value    || '';
    const grade   = document.getElementById('filter-grade')?.value   || '';

    filteredRunes = runes.filter(r => {
      if (verdict && r.verdict !== verdict) return false;
      if (role    && r.role    !== role)    return false;
      if (grade   && r.gradeStr !== grade)  return false;
      if (search) {
        const haystack = [
          r.setName, r.mainName, r.gradeStr, r.role, r.verdict,
          ...r.substats.map(s => s.name)
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    // Sort
    filteredRunes.sort((a, b) => {
      let av, bv;
      switch(sortKey) {
        case 'slot':    av = a.slot;    bv = b.slot;    break;
        case 'set':     av = a.setName; bv = b.setName; break;
        case 'grade':   av = a.grade;   bv = b.grade;   break;
        case 'level':   av = a.level;   bv = b.level;   break;
        case 'main':    av = a.mainName;bv = b.mainName;break;
        case 'eff':     av = a.eff;     bv = b.eff;     break;
        case 'role':    av = a.role;    bv = b.role;    break;
        case 'verdict': av = a.verdict; bv = b.verdict; break;
        default:        av = a.eff;     bv = b.eff;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const tbody = document.getElementById('rune-tbody');
    if (!tbody) return;
    const countEl = document.getElementById('table-count');
    if (countEl) countEl.textContent = `${filteredRunes.length} runes`;

    // Render up to 500 rows (virtual scroll TODO)
    const rows = filteredRunes.slice(0, 500);
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
  }

  function statChip(s) {
    if (!s || !s.name) return '';
    const cls = statClass(s.name);
    const flat = s.flat ? ' flat' : '';
    return `<span class="stat-chip ${cls}${flat}">${s.name} ${s.val}${s.grind ? `+${s.grind}` : ''}</span>`;
  }

  function statClass(name) {
    const m = { 'SPD':'spd','HP%':'hp','HP':'hp flat','ATK%':'atk','ATK':'atk',
                'DEF%':'def','DEF':'def','CRate':'cr','CDmg':'cd','ACC':'acc','RES':'res' };
    return m[name] || '';
  }

  function roleClass(role) {
    const m = {
      'High Roll':'highroll','Bruiser':'bruiser','Fast Utility':'fastutil',
      'Classic DPS':'classicdps','Slow DPS':'slowdps','Bomber':'bomber',
      'Heavy Resist':'heavyres','Duo Roll':'duoroll'
    };
    return m[role] || '';
  }

  function runeRow(r) {
    const grade = r.gradeStr === 'Legend'
      ? '<span class="badge badge-legend">Legend</span>'
      : '<span class="badge badge-hero">Hero</span>';

    const effCls = r.eff >= 90 ? 'eff-hi' : r.eff >= 75 ? 'eff-mid' : 'eff-lo';
    const vCls   = `verdict-${(r.verdict||'').toLowerCase()}`;
    const rCls   = roleClass(r.role);
    const subs   = r.substats.slice(0, 4);

    return `<tr>
      <td>${r.slot}</td>
      <td>${r.setName}</td>
      <td>${grade}</td>
      <td>${r.level}</td>
      <td><span class="stat-chip ${statClass(r.mainName)}">${r.mainName}</span></td>
      <td>${statChip(subs[0])}</td>
      <td>${statChip(subs[1])}</td>
      <td>${statChip(subs[2])}</td>
      <td>${statChip(subs[3])}</td>
      <td class="${effCls}">${r.eff}%</td>
      <td><span class="role-tag ${rCls}">${r.role || '—'}</span></td>
      <td class="${vCls}">${r.verdict || '—'}</td>
    </tr>`;
  }

  // Table sorting
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      document.querySelectorAll('th').forEach(t => t.classList.remove('sort-asc','sort-desc'));
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      applyFiltersAndSort(allRunes);
    });
  });

  // Table filters
  ['search-box','filter-verdict','filter-role','filter-grade'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => applyFiltersAndSort(allRunes));
    document.getElementById(id)?.addEventListener('change', () => applyFiltersAndSort(allRunes));
  });

  // ===================== SETTINGS UI =====================
  function buildThresholdTable(containerId, thresholds, settingsKey) {
    const stages = ['Early','Mid','Late'];
    const grades = ['Leg','Hero'];
    const cols   = stages.flatMap(s => grades.map(g => `${s}_${g}`));
    const colLabels = stages.flatMap(s => grades.map(g => `${s} ${g === 'Leg' ? 'Legend' : 'Hero'}`));

    let html = `<table class="s-table"><thead><tr><th>Stat</th>`;
    colLabels.forEach(c => { html += `<th>${c}</th>`; });
    html += `</tr></thead><tbody>`;

    for (const [stat, vals] of Object.entries(thresholds)) {
      html += `<tr><td>${stat}</td>`;
      cols.forEach(col => {
        html += `<td><input type="number" data-settings="${settingsKey}" data-stat="${stat}" data-col="${col}" value="${vals[col] ?? ''}" min="0" max="100"></td>`;
      });
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById(containerId).innerHTML = html;
  }

  buildThresholdTable('threshold-table-wrap', window.SWRM.settings.thresholds, 'thresholds');
  buildThresholdTable('hr-table-wrap', window.SWRM.settings.hrThresholds, 'hrThresholds');

  document.getElementById('hr-coeff').value = window.SWRM.settings.hrCoeff;

  // Duo Roll table
  (function() {
    const dr = window.SWRM.settings.duoThresholds;
    const stages = ['Early','Mid','Late'];
    const grades = ['Leg','Hero'];
    const cols = stages.flatMap(s => grades.map(g => `${s}_${g}`));
    const colLabels = stages.flatMap(s => grades.map(g => `${s} ${g === 'Leg' ? 'Legend' : 'Hero'}`));

    let html = `<table class="s-table"><thead><tr><th>Pair</th>`;
    colLabels.forEach(c => { html += `<th>${c}</th>`; });
    html += `</tr></thead><tbody>`;
    for (const [key, vals] of Object.entries(dr)) {
      html += `<tr><td>${key.replace(/_/g,' ')}</td>`;
      cols.forEach(col => {
        html += `<td><input type="number" data-settings="duoThresholds" data-stat="${key}" data-col="${col}" value="${vals[col] ?? ''}" min="0" max="100"></td>`;
      });
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    document.getElementById('dr-table-wrap').innerHTML = html;
  })();

  // Role settings
  (function() {
    const wrap = document.getElementById('roles-settings-wrap');
    if (!wrap) return;
    const roles = window.SWRM.settings.roles;
    let html = '';
    for (const [roleName, cfg] of Object.entries(roles)) {
      html += `<div style="margin-bottom:24px; padding:16px; background:var(--bg3); border-radius:var(--radius-lg); border:1px solid var(--border)">`;
      html += `<div style="font-family:var(--font-head);font-size:1rem;font-weight:700;color:var(--text-hi);margin-bottom:12px">${roleName}</div>`;

      // Substats
      html += `<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:6px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Substats</div>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">`;
      for (const [stat, val] of Object.entries(cfg.substats)) {
        html += `<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text)">
          <span style="min-width:50px">${stat}</span>
          <select data-role="${roleName}" data-field="substats" data-stat="${stat}" style="padding:3px 8px">
            ${['Include','None','Exclude'].map(o => `<option ${val===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </label>`;
      }
      html += `</div>`;

      // Must have
      html += `<div style="display:flex;gap:16px;margin-bottom:8px">`;
      ['Early','Mid','Late'].forEach(s => {
        html += `<label style="font-size:0.82rem;color:var(--text)">Must Have (${s}):
          <input type="text" data-role="${roleName}" data-field="mustHave" data-stage="${s}"
            value="${cfg.mustHave[s] || ''}"
            style="width:70px;margin-left:6px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.8rem">
        </label>`;
      });
      html += `</div>`;

      // Min stats
      html += `<div style="display:flex;gap:16px;">`;
      ['Early','Mid','Late'].forEach(s => {
        html += `<label style="font-size:0.82rem;color:var(--text)">Min Stats (${s}):
          <input type="number" data-role="${roleName}" data-field="minStats" data-stage="${s}"
            value="${cfg.minStats[s] ?? 1}" min="0" max="6"
            style="width:50px;margin-left:6px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.8rem">
        </label>`;
      });
      html += `</div>`;
      html += `</div>`;
    }
    wrap.innerHTML = html;
  })();

  // Save settings
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const s = window.SWRM.settings;

    // Collect threshold inputs
    document.querySelectorAll('input[data-settings]').forEach(inp => {
      const key  = inp.dataset.settings;
      const stat = inp.dataset.stat;
      const col  = inp.dataset.col;
      const val  = parseFloat(inp.value);
      if (!isNaN(val) && s[key] && s[key][stat]) s[key][stat][col] = val;
    });

    // HR coeff
    s.hrCoeff = parseFloat(document.getElementById('hr-coeff').value) || 0.7;

    // Role substats
    document.querySelectorAll('select[data-role]').forEach(sel => {
      const role  = sel.dataset.role;
      const stat  = sel.dataset.stat;
      if (s.roles[role]) s.roles[role].substats[stat] = sel.value;
    });

    // Role mustHave
    document.querySelectorAll('input[data-role][data-field="mustHave"]').forEach(inp => {
      const role  = inp.dataset.role;
      const stage = inp.dataset.stage;
      if (s.roles[role]) s.roles[role].mustHave[stage] = inp.value.trim() || null;
    });

    // Role minStats
    document.querySelectorAll('input[data-role][data-field="minStats"]').forEach(inp => {
      const role  = inp.dataset.role;
      const stage = inp.dataset.stage;
      if (s.roles[role]) s.roles[role].minStats[stage] = parseInt(inp.value) || 1;
    });

    saveSettings(s);
    if (allRunes.length) reprocess();
    alert('Settings saved & recalculated!');
  });

  // Reset settings
  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults?')) return;
    window.SWRM.settings = {
      thresholds:    JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
      hrThresholds:  JSON.parse(JSON.stringify(DEFAULT_HR_THRESHOLDS)),
      hrCoeff:       DEFAULT_HR_COEFF,
      duoThresholds: JSON.parse(JSON.stringify(DEFAULT_DUO_THRESHOLDS)),
      roles:         JSON.parse(JSON.stringify(DEFAULT_ROLES)),
    };
    localStorage.removeItem('swrm_settings_v1');
    location.reload();
  });

})();
