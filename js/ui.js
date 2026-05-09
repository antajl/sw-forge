// =============================================
// ui.js — Tabs, Dashboard, Table, Settings
// =============================================

(function() {
  const { parseSWEX, processAll, ROLE_PRIORITY, settings: cfg,
          STAT_NAMES, SET_NAMES, GRADE_SHORT, saveSettings,
          DEFAULT_THRESHOLDS, DEFAULT_HR_THRESHOLDS, DEFAULT_HR_COEFF,
          DEFAULT_DUO_THRESHOLDS, DEFAULT_ROLES, DEFAULT_REAPP, TRANSLATIONS } = window.SWRM;

  let allRunes = [];
  let processedRunes = [];
  let stage    = 'Mid';
  let sortKey  = 'eff';
  let sortDir  = 'desc';
  let globalMinLevel = 0;
  let currentLang = localStorage.getItem('swrm-lang') || 'en';
  let currentTheme = localStorage.getItem('swrm-theme') || 'light';

  // ===================== THEME =====================
  function toggleTheme() {
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle');
    
    if (currentTheme === 'dark') {
      body.classList.add('light-theme');
      themeBtn.textContent = '☀️';
      currentTheme = 'light';
    } else {
      body.classList.remove('light-theme');
      themeBtn.textContent = '🌙';
      currentTheme = 'dark';
    }
    
    localStorage.setItem('swrm-theme', currentTheme);
  }

  function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    if (currentTheme === 'light') {
      document.body.classList.add('light-theme');
      if (themeBtn) themeBtn.textContent = '☀️';
    } else {
      if (themeBtn) themeBtn.textContent = '🌙';
    }
  }

  // ===================== LANGUAGE =====================
  function updateLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('swrm-lang', lang);
    const t = TRANSLATIONS[lang];
    
    // Update title
    document.title = t.title;
    const logoText = document.querySelector('.logo-text');
    if (logoText) logoText.innerHTML = `SW <strong>${t.title.substring(3)}</strong>`;
    
    // Update tabs
    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
    if (dashboardTab) dashboardTab.textContent = t.dashboard;
    const runeTableTab = document.querySelector('[data-tab="runetable"]');
    if (runeTableTab) runeTableTab.textContent = t.runeTable;
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) settingsTab.textContent = t.runeRules;
    const guideTab = document.querySelector('[data-tab="guide"]');
    if (guideTab) guideTab.textContent = t.guide;
    const changelogTab = document.querySelector('[data-tab="changelog"]');
    if (changelogTab) changelogTab.textContent = t.changelog;
    
    // Update header elements
    const uploadLabel = document.querySelector('label[for="json-upload"] span');
    if (uploadLabel) uploadLabel.textContent = '⬆ ' + t.loadJson;
    const levelLabel = document.querySelector('.dashboard-controls label.level-filter');
    if (levelLabel) {
      const textNode = levelLabel.childNodes[0];
      if (textNode) textNode.textContent = t.minLvl;
    }
    const settingsBtn = document.getElementById('open-app-settings');
    if (settingsBtn) settingsBtn.textContent = t.settings;
    
    // Update stage options
    const stageSelect = document.getElementById('stage-select');
    stageSelect.innerHTML = `
      <option value="Early">${t.early}</option>
      <option value="Mid" selected>${t.mid}</option>
      <option value="Late">${t.late}</option>
    `;
    
    // Update upload prompt
    const uploadPrompt = document.getElementById('upload-prompt');
    if (uploadPrompt) {
      uploadPrompt.querySelector('h2').textContent = t.loadYourSWEX;
      uploadPrompt.querySelector('p').innerHTML = t.uploadDescription;
      uploadPrompt.querySelector('.upload-btn-large').textContent = t.chooseJsonFile;
      uploadPrompt.querySelector('.prompt-hint').textContent = t.privacyNote;
    }
    
    // Update dashboard cards
    updateDashboardLabels();
    
    // Update table elements
    updateTableLabels();
    refreshRoleFilterOptions();
    
    // Update settings
    updateSettingsLabels();
    
    // Update app settings panel
    updateAppSettingsLabels();
  }

  function updateDashboardLabels() {
    const t = TRANSLATIONS[currentLang];
    const labels = {
      'sc-total': t.totalRunes,
      'sc-keep': t.keep,
      'sc-sell': t.sell,
      'sc-grind': t.grind,
      'sc-finish': t.finish,
      'sc-reapp': t.reapp,
      'sc-upgrade': t.upgrade,
      'sc-gem': t.gem
    };
    
    Object.entries(labels).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        const label = element.querySelector('.sc-label');
        if (label) label.textContent = text;
      }
    });
    
    // Update chart titles
    const chartTitles = {
      'panel-roles': t.roleDistribution,
      'panel-sets': t.setDistribution,
      'panel-slots': t.slotDistribution,
      'panel-eff': t.efficiencyDistribution
    };
    
    Object.entries(chartTitles).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        const title = element.querySelector('.panel-title');
        if (title) title.textContent = text;
      }
    });
  }

  function updateTableLabels() {
    const t = TRANSLATIONS[currentLang];
    
    // Update search and filters
    const searchBox = document.getElementById('search-box');
    if (searchBox) searchBox.placeholder = t.searchPlaceholder;
    
    const filterVerdict = document.getElementById('filter-verdict');
    if (filterVerdict) {
      filterVerdict.innerHTML = `<option value="">${t.allVerdicts}</option>
        <option value="Keep">${t.keep}</option>
        <option value="Sell">${t.sell}</option>
        <option value="Grind">${t.grind}</option>
        <option value="Gem">${t.gem}</option>
        <option value="Finish">${t.finish}</option>
        <option value="Upgrade">${t.upgrade}</option>
        <option value="Reapp">${t.reapp}</option>`;
    }
    
    const filterRole = document.getElementById('filter-role');
    if (filterRole) {
      filterRole.innerHTML = `<option value="">${t.allRoles}</option>
        <option value="High Roll">High Roll</option>
        <option value="Duo Roll">Duo Roll</option>
        <option value="Classic DPS">Classic DPS</option>
        <option value="Slow DPS">Slow DPS</option>
        <option value="Fast Utility">Fast Utility</option>
        <option value="Bomber">Bomber</option>
        <option value="Heavy Resist">Heavy Resist</option>
        <option value="Bruiser">Bruiser</option>`;
    }
    
    const filterGrade = document.getElementById('filter-grade');
    if (filterGrade) {
      filterGrade.innerHTML = `<option value="">${t.allGrades}</option>
        <option value="Legend">Legend</option>
        <option value="Hero">Hero</option>`;
    }
    
    // Update table count text
    const tableCount = document.getElementById('table-count');
    if (tableCount) {
      const currentText = tableCount.textContent;
      const number = currentText.match(/\d+/);
      if (number) {
        tableCount.textContent = `${number[0]} ${t.runes}`;
      }
    }
  }

  function updateSettingsLabels() {
    const t = TRANSLATIONS[currentLang];
    const settingsTab = document.getElementById('tab-settings');
    if (!settingsTab) return;
    
    // Update headings in order: High Roll, Duo Roll, Role Filters, Reapp Rules
    const h3s = settingsTab.querySelectorAll('h3');
    if (h3s[0]) h3s[0].textContent = t.highRollThresholds;
    if (h3s[1]) h3s[1].textContent = t.duoRollThresholds;
    if (h3s[2]) h3s[2].textContent = t.roleFilters;
    if (h3s[3]) h3s[3].textContent = t.reappCandidateRules;
    
    // Update descriptions in order
    const descs = settingsTab.querySelectorAll('.settings-desc');
    if (descs[0]) descs[0].textContent = 'A rune qualifies as High Roll if at least one substat meets or exceeds these values.';
    if (descs[1]) descs[1].textContent = 'Synergy pairs. Both stats must reach their respective minimum values.';
    if (descs[2]) descs[2].textContent = t.configureRoleRules;
    if (descs[3]) descs[3].textContent = t.reappDescription;
    
    // Update partner coefficient label (only text node, keep input)
    const partnerRow = document.getElementById('hr-coeff')?.closest('.settings-row');
    if (partnerRow) {
      const partnerLabel = partnerRow.querySelector('label');
      if (partnerLabel) {
        const textNode = partnerLabel.childNodes[0];
        if (textNode) textNode.textContent = t.partnerCoeff + ' ';
      }
    }
    
    // Update new role label (only text node, keep input)
    const newRoleRow = document.getElementById('new-role-name')?.closest('.settings-row');
    if (newRoleRow) {
      const newRoleLabel = newRoleRow.querySelector('label');
      if (newRoleLabel) {
        const textNode = newRoleLabel.childNodes[0];
        if (textNode) textNode.textContent = t.newRole + ' ';
      }
    }
    const addBtn = document.getElementById('btn-add-role');
    if (addBtn) addBtn.textContent = t.addRole;
    
    // Update reapp labels (only text nodes, keep inputs)
    const reappInputs = [
      { id: 'reapp-sets', text: t.allowedSets },
      { id: 'reapp-innate', text: t.innateStats },
      { id: 'reapp-main2', text: t.slot2Mains },
      { id: 'reapp-main4', text: t.slot4Mains },
      { id: 'reapp-main6', text: t.slot6Mains },
      { id: 'reapp-max-eff', text: t.maxEffReapp },
    ];
    reappInputs.forEach(({ id, text }) => {
      const input = document.getElementById(id);
      if (input) {
        const label = input.closest('.settings-row')?.querySelector('label');
        if (label) {
          const textNode = label.childNodes[0];
          if (textNode) textNode.textContent = text + ' ';
        }
      }
    });
    
    // Update settings actions
    const saveBtn = document.getElementById('btn-save-settings');
    if (saveBtn) saveBtn.textContent = t.saveRecalculate;
    const resetBtn = document.getElementById('btn-reset-settings');
    if (resetBtn) resetBtn.textContent = t.resetDefaults;
  }

  function updateAppSettingsLabels() {
    const t = TRANSLATIONS[currentLang];
    
    // Update language label in app settings tab
    const langLabel = document.querySelector('#tab-app-settings .db-settings-header label:first-child');
    if (langLabel) {
      const select = document.getElementById('app-language');
      if (select) {
        select.value = currentLang;
        const textNode = langLabel.childNodes[0];
        if (textNode) {
          textNode.textContent = t.language + ' ';
        }
      }
    }
    
    // Update theme label in app settings tab
    const themeLabel = document.querySelector('#tab-app-settings .db-settings-header label:last-child');
    if (themeLabel) {
      const select = document.getElementById('app-theme');
      if (select) {
        const textNode = themeLabel.childNodes[0];
        if (textNode) {
          textNode.textContent = t.theme + ' ';
        }
      }
    }
    
    // Update database slots title and description in app settings tab
    const dbSlotsTitle = document.getElementById('db-slots-title');
    if (dbSlotsTitle) dbSlotsTitle.textContent = t.dbSlotsTitle;
    
    const dbSlotsDesc = document.getElementById('db-slots-desc');
    if (dbSlotsDesc) dbSlotsDesc.textContent = t.dbSlotsDesc;
  }

  // ===================== TABS =====================
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.remove('hidden');
      
      // Render db slots when app settings tab is opened
      if (btn.dataset.tab === 'app-settings') {
        renderDbSlots();
      }
    });
  });

  // ===================== STAGE =====================
  document.getElementById('stage-select').addEventListener('change', e => {
    stage = e.target.value;
    if (allRunes.length) reprocess();
  });

  // Auto Game Stage button
  document.getElementById('btn-auto-stage').addEventListener('click', () => {
    const metrics = analyzeGameStage(allRunes);
    const recommendedStage = getRecommendedStage(parseFloat(metrics.score));
    
    // Обновляем select и переменную stage
    const stageSelect = document.getElementById('stage-select');
    stageSelect.value = recommendedStage;
    stage = recommendedStage;
    
    // Пересчитываем руны с новой стадией
    if (allRunes.length) reprocess();
    
    // Показываем уведомление
    const score = parseFloat(metrics.score);
    const message = `Auto-selected: ${recommendedStage} (Score: ${metrics.score})`;
    console.log(message);
  });

  document.getElementById('global-min-level')?.addEventListener('change', e => {
    globalMinLevel = parseInt(e.target.value || '0', 10) || 0;
    if (processedRunes.length) {
      const visible = getVisibleRunes();
      renderDashboard(visible);
      renderTable(visible);
    }
  });

  // ===================== FILE UPLOAD =====================
  document.getElementById('json-upload').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const jsonText = ev.target.result;
        const json = JSON.parse(jsonText);
        allRunes = parseSWEX(json);
        reprocess();
        
        // Save to the first empty slot or active slot
        const slots = loadDbSlots();
        const activeSlot = slots.find(s => s.active);
        const firstEmpty = slots.find(s => !s.name);
        const targetSlot = activeSlot || firstEmpty || slots[0];
        targetSlot.name = file.name;
        targetSlot.uploadedAt = new Date().toLocaleString();
        targetSlot.active = true;
        slots.forEach(s => { if (s.id !== targetSlot.id) s.active = false; });
        saveDbSlots(slots);
        
        // Save actual JSON to IndexedDB
        await saveSlotData(targetSlot.id, jsonText);
        
        document.getElementById('upload-prompt').classList.add('hidden');
        document.getElementById('btn-upload-json').classList.add('hidden');
        document.getElementById('tab-dashboard').classList.remove('hidden');
        document.querySelectorAll('.tab').forEach(t => {
          t.classList.toggle('active', t.dataset.tab === 'dashboard');
        });
      } catch(err) {
        alert('Failed to parse JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  });

  // Close upload prompt overlay
  document.getElementById('close-upload-prompt')?.addEventListener('click', () => {
    document.getElementById('upload-prompt').classList.add('hidden');
    document.getElementById('btn-upload-json').classList.remove('hidden');
  });

  // Re-open upload prompt from header button
  document.getElementById('btn-upload-json')?.addEventListener('click', () => {
    document.getElementById('upload-prompt').classList.remove('hidden');
    document.getElementById('btn-upload-json').classList.add('hidden');
  });

  function reprocess() {
    processedRunes = processAll(allRunes, stage, window.SWRM.settings);
    const visible = getVisibleRunes();
    renderDashboard(visible);
    renderTable(visible);
  }

  function getVisibleRunes() {
    return processedRunes.filter(r => r.level >= globalMinLevel);
  }

  // ===================== GAME STAGE ANALYSIS =====================
  function analyzeGameStage(runes) {
    // Анализируем только руны +9 и выше
    const eligibleRunes = runes.filter(r => r.level >= 9);
    if (eligibleRunes.length === 0) {
      return {
        highRollPercent: 0,
        keepEff: 0,
        metaSetsPercent: 0,
        score: 0
      };
    }

    // 1. High Roll % (40% веса)
    const highRollRunes = eligibleRunes.filter(r => r.role === 'High Roll');
    const highRollPercent = (highRollRunes.length / eligibleRunes.length) * 100;

    // 2. Эффективность Keep рун (30% веса)
    const keepRunes = eligibleRunes.filter(r => r.verdict === 'Keep');
    const keepEff = keepRunes.length > 0 
      ? (keepRunes.reduce((sum, r) => sum + r.eff, 0) / keepRunes.length) / 130 * 100
      : 0;

    // 3. Мета-сеты (30% веса) - Violent, Swift, Will
    const metaSets = ['Violent', 'Swift', 'Will'];
    const metaSetRunes = keepRunes.filter(r => metaSets.includes(r.setName));
    const metaSetsPercent = keepRunes.length > 0 
      ? (metaSetRunes.length / keepRunes.length) * 100
      : 0;

    // Расчет итогового Score
    const score = (highRollPercent * 0.4) + (keepEff * 0.3) + (metaSetsPercent * 0.3);

    return {
      highRollPercent: highRollPercent.toFixed(1),
      keepEff: keepEff.toFixed(1),
      metaSetsPercent: metaSetsPercent.toFixed(1),
      score: score.toFixed(1)
    };
  }

  function getRecommendedStage(score) {
    if (score >= 70) return 'Late';
    if (score >= 40) return 'Mid';
    return 'Early';
  }

  // ===================== DASHBOARD =====================
  function renderDashboard(runes) {
    const counts = { Keep:0, Sell:0, Grind:0, Finish:0, Reapp:0, Upgrade:0, Gem:0 };
    const roleCounts = {};
    const roleEff    = {};
    const setCounts  = {};
    const setEff     = {};
    const slotCounts = {1:0,2:0,3:0,4:0,5:0,6:0};
    const slotMain = {1:{},2:{},3:{},4:{},5:{},6:{}};
    const effBuckets = new Array(20).fill(0); // 5% buckets: 0-4, 5-9, ..., 95-99, 100+

    // Обновляем метрики Game Stage
    const metrics = analyzeGameStage(runes);
    document.getElementById('highroll-percent').textContent = metrics.highRollPercent + '%';
    document.getElementById('keep-eff').textContent = metrics.keepEff;
    document.getElementById('meta-sets-percent').textContent = metrics.metaSetsPercent + '%';

    for (const r of runes) {
      counts[r.verdict] = (counts[r.verdict] || 0) + 1;

      if (r.role) {
        roleCounts[r.role] = (roleCounts[r.role] || 0) + 1;
        roleEff[r.role] = (roleEff[r.role] || []);
        roleEff[r.role].push(r.eff);
      }

      setCounts[r.setName] = (setCounts[r.setName] || 0) + 1;
      setEff[r.setName] = setEff[r.setName] || [];
      setEff[r.setName].push(r.eff);
      slotCounts[r.slot]   = (slotCounts[r.slot]   || 0) + 1;
      slotMain[r.slot][r.mainName] = (slotMain[r.slot][r.mainName] || 0) + 1;

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
    setText('sc-reapp', counts.Reapp || 0, '.sc-value');
    setText('sc-upgrade', counts.Upgrade || 0, '.sc-value');
    setText('sc-gem', counts.Gem || 0, '.sc-value');

    // Role chart
    const roleEl = document.getElementById('role-chart');
    roleEl.innerHTML = '';
    const sortedRoles = Object.keys(roleCounts).sort((a, b) => (roleCounts[b] || 0) - (roleCounts[a] || 0));
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
      const avg = (setEff[name].reduce((a,b)=>a+b,0) / setEff[name].length).toFixed(1);
      setEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">${name}</div>
          <div class="chart-bar-wrap">
            <div class="chart-bar" style="width:${pct}%; background: linear-gradient(90deg,#2dd4c4,#4e9eff)">
              <span class="chart-bar-val">${cnt}</span>
            </div>
          </div>
          <div class="chart-avg">${avg}%</div>
        </div>`;
    }

    // Slot chart
    const slotEl = document.getElementById('slot-chart');
    slotEl.innerHTML = '';
    const maxSlot = Math.max(...Object.values(slotCounts), 1);
    for (let s = 1; s <= 6; s++) {
      const cnt = slotCounts[s] || 0;
      const pct = ((cnt / maxSlot) * 100).toFixed(1);
      const topMain = Object.entries(slotMain[s])
        .sort((a,b) => b[1] - a[1])
        .slice(0, 2)
        .map(([stat, c]) => `${stat} ${c}`)
        .join(' | ');
      slotEl.innerHTML += `
        <div class="chart-row">
          <div class="chart-label">Slot ${s}<br><small>${topMain || '—'}</small></div>
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
    if (countEl) {
      const t = TRANSLATIONS[currentLang];
      countEl.textContent = `${filteredRunes.length} ${t.runes}`;
    }

    // Render up to 500 rows (virtual scroll TODO)
    const rows = filteredRunes.slice(0, 500);
    const verdictFilter = document.getElementById('filter-verdict')?.value || '';
    const showTarget = verdictFilter === 'Grind' || verdictFilter === 'Gem';
    document.getElementById('target-col-header')?.classList.toggle('hidden', !showTarget);
    document.getElementById('rune-table')?.classList.toggle('show-target', showTarget);
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    renderRuneSummary(filteredRunes);
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
      'High Roll':'highroll','Bruiser':'bruiser','Fast CC':'fastcc',
      'Classic DPS':'classicdps','Slow DPS':'slowdps','Bomber':'bomber',
      'Tank':'tank','Duo Roll':'duoroll'
    };
    return m[role] || '';
  }

  function runeRow(r) {
    const grade = r.gradeStr === 'Legend'
      ? '<span class="grade-tag legend">Legend</span>'
      : '<span class="grade-tag hero">Hero</span>';

    const effCls = r.eff >= 90 ? 'eff-hi' : r.eff >= 75 ? 'eff-mid' : 'eff-lo';
    const rCls   = roleClass(r.role);
    const subs   = r.substats.slice(0, 4);
    const innate = r.innate_name ? `${r.innate_name} ${r.innate_val}` : '';
    const target = r.verdict === 'Grind'
      ? (r.grindInfo?.stat || '')
      : r.verdict === 'Gem'
        ? `${r.gemInfo?.from || ''} → ${r.gemInfo?.to || ''}`
        : '';

    return `<tr>
      <td>${grade}</td>
      <td>${r.setName}</td>
      <td><span class="stat-chip">Lvl ${r.level}</span></td>
      <td><span class="stat-chip ${statClass(r.mainName)}">${r.mainName}</span></td>
      <td>${innate ? `<span class="stat-chip">${innate}</span>` : ''}</td>
      <td>${subs[0] ? statChip(subs[0]) : ''}</td>
      <td>${subs[1] ? statChip(subs[1]) : ''}</td>
      <td>${subs[2] ? statChip(subs[2]) : ''}</td>
      <td>${subs[3] ? statChip(subs[3]) : ''}</td>
      <td class="${effCls}">${r.eff}%</td>
      <td><span class="role-tag ${rCls}">${r.role || ''}</span></td>
      <td><span class="verdict-tag ${(r.verdict||'').toLowerCase()}">${r.verdict || ''}</span></td>
      <td>${r.slot}</td>
      <td class="target-col-cell">${target ? `<span class="stat-chip">${target}</span>` : ''}</td>
    </tr>`;
  }

  function renderRuneSummary(runes) {
    const box = document.getElementById('rune-summary');
    if (!box) return;

    const byVerdict = {};
    const byRole = {};
    for (const r of runes) {
      byVerdict[r.verdict] = byVerdict[r.verdict] || { c: 0, e: 0 };
      byVerdict[r.verdict].c++;
      byVerdict[r.verdict].e += r.eff;
      if (r.role) {
        byRole[r.role] = byRole[r.role] || { c: 0, e: 0 };
        byRole[r.role].c++;
        byRole[r.role].e += r.eff;
      }
    }

    let html = `<div class="summary-title">Rune Summary</div>`;
    html += `<div class="summary-row"><span>Total</span><span>${runes.length}</span></div>`;
    ['Keep','Grind','Gem','Finish','Upgrade','Reapp','Sell'].forEach(v => {
      const item = byVerdict[v];
      if (!item) return;
      html += `<div class="summary-row"><span>${v}</span><span>${item.c} <span class="summary-eff">${(item.e / item.c).toFixed(1)}%</span></span></div>`;
    });
    html += `<div class="summary-title" style="margin-top:10px">Roles</div>`;
    Object.keys(byRole).sort((a, b) => byRole[b].c - byRole[a].c).forEach(role => {
      const item = byRole[role];
      if (!item) return;
      html += `<div class="summary-row"><span>${role}</span><span>${item.c} <span class="summary-eff">${(item.e / item.c).toFixed(1)}%</span></span></div>`;
    });
    box.innerHTML = html;
  }

  // Table sorting
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      document.querySelectorAll('th').forEach(t => t.classList.remove('sort-asc','sort-desc'));
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      applyFiltersAndSort(getVisibleRunes());
    });
  });

  // Table filters
  ['search-box','filter-verdict','filter-role','filter-grade'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => applyFiltersAndSort(getVisibleRunes()));
    document.getElementById(id)?.addEventListener('change', () => applyFiltersAndSort(getVisibleRunes()));
  });

  // ===================== SETTINGS UI =====================
  function parseList(v) {
    return (v || '').split(',').map(s => s.trim()).filter(Boolean);
  }

  function refreshRoleFilterOptions() {
    const roleSelect = document.getElementById('filter-role');
    if (!roleSelect) return;
    const current = roleSelect.value;
    const roles = ['High Roll', 'Duo Roll', ...Object.keys(window.SWRM.settings.roles)];
    const t = TRANSLATIONS[currentLang];
    roleSelect.innerHTML = `<option value="">${t.allRoles}</option>${roles.map(r => `<option value="${r}">${r}</option>`).join('')}`;
    if (roles.includes(current)) roleSelect.value = current;
  }

  function renderRoleSettings() {
    const wrap = document.getElementById('roles-settings-wrap');
    if (!wrap) return;
    const roles = window.SWRM.settings.roles;
    let html = '';
    for (const [roleName, roleCfg] of Object.entries(roles)) {
      html += `<div style="margin-bottom:24px; padding:16px; background:var(--bg3); border-radius:var(--radius-lg); border:1px solid var(--border)">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px">`;
      html += `<div style="font-family:var(--font-head);font-size:1rem;font-weight:700;color:var(--text-hi)">${roleName}</div>`;
      html += `<button class="btn-ghost btn-remove-role" data-role-remove="${roleName}" ${Object.keys(roles).length <= 1 ? 'disabled' : ''}>Remove</button>`;
      html += `</div>`;
      html += `<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:6px;font-family:var(--font-head);letter-spacing:0.08em;text-transform:uppercase">Substats</div>`;
      html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">`;
      for (const [stat, val] of Object.entries(roleCfg.substats)) {
        html += `<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text)">
          <span style="min-width:50px">${stat}</span>
          <select data-role="${roleName}" data-field="substats" data-stat="${stat}" style="padding:3px 8px">
            ${['Include','None','Exclude'].map(o => `<option ${val===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </label>`;
      }
      html += `</div>`;
      html += `<div style="display:flex;gap:16px;margin-bottom:8px">`;
      ['Early','Mid','Late'].forEach(s => {
        html += `<label style="font-size:0.82rem;color:var(--text)">Must Have (${s}):
          <input type="text" data-role="${roleName}" data-field="mustHave" data-stage="${s}" value="${roleCfg.mustHave[s] || ''}" style="width:70px;margin-left:6px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.8rem">
        </label>`;
      });
      html += `</div>`;
      html += `<div style="display:flex;gap:16px;">`;
      ['Early','Mid','Late'].forEach(s => {
        html += `<label style="font-size:0.82rem;color:var(--text)">Min Stats (${s}):
          <input type="number" data-role="${roleName}" data-field="minStats" data-stage="${s}" value="${roleCfg.minStats[s] ?? 1}" min="0" max="6" style="width:50px;margin-left:6px;background:var(--surface);border:1px solid var(--border);color:var(--text);padding:3px 6px;border-radius:4px;font-family:var(--font-mono);font-size:0.8rem">
        </label>`;
      });
      html += `</div>`;
      html += `</div>`;
    }
    wrap.innerHTML = html;
    wrap.querySelectorAll('.btn-remove-role').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.roleRemove;
        if (Object.keys(window.SWRM.settings.roles).length <= 1) return;
        delete window.SWRM.settings.roles[key];
        renderRoleSettings();
        refreshRoleFilterOptions();
      });
    });
  }
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

  renderRoleSettings();
  refreshRoleFilterOptions();

  document.getElementById('btn-add-role')?.addEventListener('click', () => {
    const input = document.getElementById('new-role-name');
    const name = (input?.value || '').trim();
    if (!name) return;
    if (window.SWRM.settings.roles[name]) return alert('Role already exists');
    const template = JSON.parse(JSON.stringify(window.SWRM.settings.roles['Bruiser'] || DEFAULT_ROLES['Bruiser']));
    window.SWRM.settings.roles[name] = template;
    input.value = '';
    renderRoleSettings();
    refreshRoleFilterOptions();
  });

  const reapp = window.SWRM.settings.reapp || {};
  document.getElementById('reapp-sets').value = (reapp.sets || []).join(', ');
  document.getElementById('reapp-innate').value = (reapp.innateStats || []).join(', ');
  document.getElementById('reapp-main2').value = (reapp.mainBySlot?.[2] || []).join(', ');
  document.getElementById('reapp-main4').value = (reapp.mainBySlot?.[4] || []).join(', ');
  document.getElementById('reapp-main6').value = (reapp.mainBySlot?.[6] || []).join(', ');
  document.getElementById('reapp-max-eff').value = reapp.maxEff ?? 65;

  // Save settings
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const s = window.SWRM.settings;

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

    s.reapp = {
      maxEff: parseFloat(document.getElementById('reapp-max-eff').value) || 65,
      sets: parseList(document.getElementById('reapp-sets').value),
      innateStats: parseList(document.getElementById('reapp-innate').value),
      mainBySlot: {
        2: parseList(document.getElementById('reapp-main2').value),
        4: parseList(document.getElementById('reapp-main4').value),
        6: parseList(document.getElementById('reapp-main6').value),
      }
    };

    saveSettings(s);
    refreshRoleFilterOptions();
    if (processedRunes.length) reprocess();
    alert('Settings saved & recalculated!');
  });

  // Language switcher
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'app-language') {
      updateLanguage(e.target.value);
    }
  });

  // App Settings - Theme switcher
  document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'app-theme') {
      const newTheme = e.target.value;
      document.body.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('theme', newTheme);
    }
  });

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateLanguage(currentLang);
    
    // Initialize App Settings
    const appThemeSelect = document.getElementById('app-theme');
    if (appThemeSelect) {
      const currentTheme = localStorage.getItem('theme') || 'light';
      appThemeSelect.value = currentTheme;
    }
    
    // Initialize Database slots
    renderDbSlots();
  });

  // Reset settings
  document.getElementById('btn-reset-settings').addEventListener('click', () => {
    if (!confirm('Reset all settings to defaults?')) return;
    window.SWRM.settings = {
      hrThresholds:  JSON.parse(JSON.stringify(DEFAULT_HR_THRESHOLDS)),
      hrCoeff:       DEFAULT_HR_COEFF,
      duoThresholds: JSON.parse(JSON.stringify(DEFAULT_DUO_THRESHOLDS)),
      roles:         JSON.parse(JSON.stringify(DEFAULT_ROLES)),
      reapp:         JSON.parse(JSON.stringify(DEFAULT_REAPP)),
    };
    localStorage.removeItem('swrm_settings_v1');
    location.reload();
  });

  // ===================== APP SETTINGS =====================
  const DB_SLOTS_META_KEY = 'swrm_db_slots_meta_v1';
  const CHANGELOG_KEY = 'swrm_changelog_v1';
  const APP_LANG_KEY = 'swrm_app_lang_v1';

  // IndexedDB setup for large JSON files
  const DB_NAME = 'SWRM';
  const DB_VERSION = 1;
  const STORE_NAME = 'slots';
  let idb = null;

  async function initIndexedDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { idb = req.result; resolve(idb); };
      req.onupgradeneeded = (ev) => {
        const db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async function saveSlotData(slotId, jsonText) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({ id: slotId, jsonText });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function loadSlotData(slotId) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(slotId);
      req.onsuccess = () => resolve(req.result?.jsonText || '');
      req.onerror = () => reject(req.error);
    });
  }

  async function deleteSlotData(slotId) {
    if (!idb) await initIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(slotId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function loadDbSlots() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DB_SLOTS_META_KEY) || '[]');
      if (Array.isArray(parsed) && parsed.length === 4) return parsed;
    } catch(e) {}
    return Array.from({ length: 4 }).map((_, i) => ({ id: i + 1, name: '', uploadedAt: '', active: i === 0 }));
  }

  function saveDbSlots(slots) {
    // Save only metadata (no jsonText) to localStorage
    const meta = slots.map(s => ({ id: s.id, name: s.name, uploadedAt: s.uploadedAt, active: s.active }));
    localStorage.setItem(DB_SLOTS_META_KEY, JSON.stringify(meta));
  }

  function renderDbSlots() {
    const wrap = document.getElementById('db-slots-wrap');
    if (!wrap) {
      console.error('db-slots-wrap element not found');
      return;
    }
    const slots = loadDbSlots();
    const t = TRANSLATIONS && TRANSLATIONS[currentLang] ? TRANSLATIONS[currentLang] : {};
    
    wrap.innerHTML = slots.map(slot => {
      const hasData = !!slot.name;
      return `
      <div class="db-slot" data-slot="${slot.id}">
        <div class="db-slot-title">${t.dbSlot || 'Database Slot'} ${slot.id} ${slot.active ? `(${t.current || 'Current'})` : ''}</div>
        <div class="db-slot-meta">${t.name || 'Name'}: ${slot.name || '—'}</div>
        <div class="db-slot-meta">${t.uploaded || 'Uploaded'}: ${slot.uploadedAt || '—'}</div>
        <div class="db-slot-actions">
          <button class="btn-ghost" data-db-action="clipboard" data-slot="${slot.id}">${t.clipboard || 'Clipboard'}</button>
          <button class="btn-ghost" data-db-action="upload" data-slot="${slot.id}">${t.upload || 'Upload'}</button>
          <button class="btn-ghost" ${hasData ? '' : 'disabled'} data-db-action="download" data-slot="${slot.id}">${t.download || 'Download'}</button>
          <button class="btn-ghost" ${hasData ? '' : 'disabled'} data-db-action="delete" data-slot="${slot.id}">${t.delete || 'Delete'}</button>
          ${slot.active || !hasData ? '' : `<button class="btn-primary" data-db-action="swap" data-slot="${slot.id}">${t.swap || 'Swap'}</button>`}
        </div>
      </div>`;
    }).join('');
  }

  function processJsonData(jsonText) {
    const json = JSON.parse(jsonText);
    allRunes = parseSWEX(json);
    reprocess();
    document.getElementById('upload-prompt').classList.add('hidden');
    document.getElementById('btn-upload-json').classList.add('hidden');
  }

  function parseAndLoadJson(jsonText) {
    processJsonData(jsonText);
    document.getElementById('tab-dashboard').classList.remove('hidden');
    // activate dashboard tab
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === 'dashboard');
    });
  }

  const appLangSelect = document.getElementById('app-language');
  if (appLangSelect) {
    const savedLang = localStorage.getItem(APP_LANG_KEY) || 'en';
    appLangSelect.value = savedLang;
    appLangSelect.addEventListener('change', () => {
      localStorage.setItem(APP_LANG_KEY, appLangSelect.value);
      currentLang = appLangSelect.value;
      updateLanguage(currentLang);
    });
  }

  const appThemeSelect = document.getElementById('app-theme');
  if (appThemeSelect) {
    appThemeSelect.value = currentTheme;
    appThemeSelect.addEventListener('change', () => {
      currentTheme = appThemeSelect.value;
      localStorage.setItem('swrm-theme', currentTheme);
      initTheme();
    });
  }

  document.getElementById('db-slots-wrap')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-db-action]');
    if (!btn) return;
    e.stopPropagation();
    
    const action = btn.dataset.dbAction;
    const slotId = Number(btn.dataset.slot);
    console.log('Slot action:', action, 'slotId:', slotId);
    
    const slots = loadDbSlots();
    const idx = slots.findIndex(s => s.id === slotId);
    if (idx < 0) return;
    const slot = slots[idx];
    const t = TRANSLATIONS[currentLang];

    if (action === 'clipboard') {
      try {
        const text = await navigator.clipboard.readText();
        if (!text) return;
        await saveSlotData(slotId, text);
        slot.uploadedAt = new Date().toLocaleString();
        slot.name = slot.name || `Clipboard ${slotId}`;
        saveDbSlots(slots);
        renderDbSlots();
      } catch(err) {
        alert('Clipboard access denied or not available');
      }
      return;
    }
    
    if (action === 'upload') {
      console.log('Upload clicked for slot', slotId);
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = '.json';
      inp.style.display = 'none';
      document.body.appendChild(inp);
      
      inp.addEventListener('change', async ev => {
        console.log('File selected');
        const file = ev.target.files?.[0];
        if (!file) {
          console.log('No file selected');
          return;
        }
        console.log('Reading file:', file.name);
        const reader = new FileReader();
        reader.onload = async event => {
          try {
            console.log('File read successfully, length:', event.target.result.length);
            await saveSlotData(slotId, event.target.result);
            slot.name = file.name;
            slot.uploadedAt = new Date().toLocaleString();
            saveDbSlots(slots);
            renderDbSlots();
            console.log('Slot saved and rendered');
          } catch(err) {
            console.error('Error saving to IndexedDB:', err);
            alert('Failed to save file: ' + err.message);
          }
        };
        reader.onerror = () => console.error('File read error');
        reader.readAsText(file);
        document.body.removeChild(inp);
      });
      
      inp.click();
      return;
    }
    
    if (action === 'download') {
      try {
        const jsonText = await loadSlotData(slotId);
        if (!jsonText) return;
        const blob = new Blob([jsonText], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = slot.name || `slot-${slot.id}.json`;
        a.click();
      } catch(err) {
        alert('Failed to load slot data: ' + err.message);
      }
      return;
    }
    
    if (action === 'delete') {
      if (!confirm(`Delete slot ${slot.id}?`)) return;
      try {
        await deleteSlotData(slotId);
        slots[idx] = { id: slot.id, name: '', uploadedAt: '', active: slot.active };
        saveDbSlots(slots);
        renderDbSlots();
      } catch(err) {
        alert('Failed to delete slot: ' + err.message);
      }
      return;
    }
    
    if (action === 'swap') {
      try {
        const jsonText = await loadSlotData(slotId);
        if (!jsonText) return alert(t.slotEmpty || 'Selected slot is empty');
        slots.forEach(s => { s.active = s.id === slot.id; });
        saveDbSlots(slots);
        processJsonData(jsonText);
      } catch(err) {
        alert((t.parseError || 'Failed to parse slot JSON: ') + err.message);
      }
      renderDbSlots();
    }
  });

  // ===================== CHANGELOG =====================
  function loadChangelog() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]');
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    return [];
  }
  function saveChangelog(items) {
    localStorage.setItem(CHANGELOG_KEY, JSON.stringify(items));
  }
  function renderChangelog() {
    const list = document.getElementById('changelog-list');
    if (!list) return;
    const items = loadChangelog();
    list.innerHTML = items.length
      ? items.map(it => `<p><strong>${it.date}</strong> — ${it.text}</p>`).join('')
      : '<p>No changelog entries yet.</p>';
  }
  document.getElementById('btn-add-changelog')?.addEventListener('click', () => {
    const input = document.getElementById('changelog-input');
    const text = (input?.value || '').trim();
    if (!text) return;
    const items = loadChangelog();
    items.unshift({ date: new Date().toLocaleString(), text });
    saveChangelog(items);
    input.value = '';
    renderChangelog();
  });
  renderChangelog();

})();
