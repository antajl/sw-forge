// js/features/runes/table-filters.js — rune table filtering logic
  let filteredRunes = [];
  let runeTableRenderPending = false;

  function isRuneTableRunesTabActive() {
    if (typeof isRuneTablePaneVisible === 'function' && !isRuneTablePaneVisible()) return false;
    if (typeof readTableKind === 'function' && readTableKind() !== 'runes') return false;
    return true;
  }

  function flushRuneTableRenderIfNeeded() {
    if (!runeTableRenderPending && !isRuneTableRunesTabActive()) return;
    if (!isRuneTableRunesTabActive()) return;
    runeTableRenderPending = false;
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  }

  function isRuneEquipped(r) {
    const uid = r.equipped_to != null ? Number(r.equipped_to) : NaN;
    if (Number.isFinite(uid) && uid !== 0) return true;
    const mid = r.equipped_name != null ? Number(r.equipped_name) : NaN;
    return Number.isFinite(mid) && mid !== 0;
  }

  function computeRuneTableSummary(runes) {
    const list = runes || [];
    let ancient = 0;
    let equipped = 0;
    let plus15 = 0;
    let keep = 0;
    let sell = 0;
    const grades = {};
    for (const r of list) {
      if (r.isAncient) ancient += 1;
      if (isRuneEquipped(r)) equipped += 1;
      if (Number(r.level) >= 15) plus15 += 1;
      const v = (r.verdict || '').trim();
      if (v === 'Keep') keep += 1;
      else if (v === 'Sell') sell += 1;
      const g = String(r.grade || '').trim();
      if (g) grades[g] = (grades[g] || 0) + 1;
    }
    return {
      total: list.length,
      ancient,
      equipped,
      inventory: list.length - equipped,
      plus15,
      keep,
      sell,
      grades,
    };
  }

  function renderRuneTableRosterChips() {
    const host = document.getElementById('rune-table-roster-chips');
    const meta = document.getElementById('rune-table-roster-meta');
    if (!host) return;
    const pool = typeof getVisibleRunes === 'function' ? getVisibleRunes() : [];
    if (!pool.length) {
      host.innerHTML = '';
      if (meta) meta.hidden = true;
      return;
    }
    if (meta) meta.hidden = false;
    const sum = computeRuneTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.runeChipTotal || 'Runes', value: sum.total },
      { label: t.runeChipAncient || 'Ancient', value: sum.ancient },
      { label: t.runeChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.runeChipInventory || 'Inventory', value: sum.inventory },
      { label: t.runeChipPlus15 || '+15', value: sum.plus15 },
      { label: t.runeChipKeep || 'Keep', value: sum.keep },
    ];
    if (sum.sell > 0) {
      parts.push({ label: t.runeChipSell || 'Sell', value: sum.sell });
    }
    const gradeOrder = ['Legend', 'Hero', 'Rare', 'Magic', 'Common'];
    for (const g of gradeOrder) {
      if (sum.grades[g] > 0) {
        parts.push({ label: g, value: sum.grades[g] });
      }
    }
    host.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
  }

  function buildRuneTableQuerySuffix() {
    const p = new URLSearchParams();
    const q = (document.getElementById('search-box')?.value || '').trim();
    if (q) p.set('q', q);
    const fv = document.getElementById('filter-verdict')?.value;
    if (fv) p.set('verdict', fv);
    const fr = document.getElementById('filter-role')?.value;
    if (fr) p.set('role', fr);
    const fg = document.getElementById('filter-grade')?.value;
    if (fg) p.set('grade', fg);
    const fs = document.getElementById('filter-set')?.value;
    if (fs) p.set('set', fs);
    const fsl = document.getElementById('filter-slot')?.value;
    if (fsl) p.set('slot', fsl);
    const fm = document.getElementById('filter-main')?.value;
    if (fm) p.set('main', fm);
    const fl = document.getElementById('filter-rune-location')?.value;
    if (fl) p.set('loc', fl);
    if (sortKey !== 'score') p.set('sort', sortKey);
    if (sortDir !== 'desc') p.set('dir', sortDir);
    if (document.getElementById('toggle-ancient-only')?.checked) p.set('ancient', '1');
    if (runeTableShowAll) p.set('all', '1');
    const s = p.toString();
    return s ? `?${s}` : '';
  }

  function replaceRuneTableLocationFromState() {
    if (runeTableApplyingHash) return;
    if (!isRuneTablePaneVisible()) return;
    try {
      const base = window.location.pathname + window.location.search;
      const suf = buildRuneTableQuerySuffix();
      history.replaceState(null, '', `${base}#runetable${suf}`);
    } catch (e) { /* ignore */ }
  }

  function applyRuneTableQueryParams(params) {
    if (!params) return;
    const keys = [...params.keys()];
    if (!keys.length) return;
    runeTableApplyingHash = true;
    try {
      if (params.has('q')) document.getElementById('search-box').value = params.get('q');
      if (params.has('verdict')) document.getElementById('filter-verdict').value = params.get('verdict');
      if (params.has('role')) document.getElementById('filter-role').value = params.get('role');
      if (params.has('grade')) document.getElementById('filter-grade').value = params.get('grade');
      if (params.has('set')) document.getElementById('filter-set').value = params.get('set');
      if (params.has('slot')) document.getElementById('filter-slot').value = params.get('slot');
      if (params.has('main')) document.getElementById('filter-main').value = params.get('main');
      if (params.has('loc')) {
        const locEl = document.getElementById('filter-rune-location');
        if (locEl) locEl.value = params.get('loc');
      }
      const sk = params.get('sort');
      if (sk && RUNE_TABLE_SORT_KEYS.has(sk)) sortKey = sk;
      const sd = params.get('dir');
      if (sd === 'asc' || sd === 'desc') sortDir = sd;
      if (params.has('ancient')) {
        const on = params.get('ancient') === '1';
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = on;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, on ? '1' : '0');
      }
      if (params.has('all')) runeTableShowAll = params.get('all') === '1';
      else runeTableShowAll = false;
    } finally {
      runeTableApplyingHash = false;
      applyRuneTableIngameScoreHeader();
    }
  }

  const RUNE_FILTER_SELECT_IDS = {
    grade: 'filter-grade',
    set: 'filter-set',
    slot: 'filter-slot',
    main: 'filter-main',
    role: 'filter-role',
    verdict: 'filter-verdict',
    location: 'filter-rune-location',
  };

  function readRuneTableFiltersFromDom() {
    return {
      verdict: document.getElementById('filter-verdict')?.value || '',
      role: document.getElementById('filter-role')?.value || '',
      grade: document.getElementById('filter-grade')?.value || '',
      set: document.getElementById('filter-set')?.value || '',
      slot: document.getElementById('filter-slot')?.value || '',
      main: document.getElementById('filter-main')?.value || '',
      location: document.getElementById('filter-rune-location')?.value || '',
      ancientOnly: !!document.getElementById('toggle-ancient-only')?.checked,
    };
  }

  function countRuneTableActiveFilters(f) {
    let n = 0;
    if (f.verdict) n += 1;
    if (f.role) n += 1;
    if (f.grade) n += 1;
    if (f.set) n += 1;
    if (f.slot) n += 1;
    if (f.main) n += 1;
    if (f.location) n += 1;
    if (f.ancientOnly) n += 1;
    return n;
  }

  function runeTableHasActiveFiltersOrSearch() {
    const q = (document.getElementById('search-box')?.value || '').trim();
    if (q) return true;
    if (runeTableMonsterMasterId != null) return true;
    return countRuneTableActiveFilters(readRuneTableFiltersFromDom()) > 0;
  }

  function updateRuneTableResetButton() {
    if (typeof updateToolbarResetButton === 'function') {
      updateToolbarResetButton('rune-filters-drawer-reset', runeTableHasActiveFiltersOrSearch());
    }
  }

  const RUNE_SEARCH_STAT_KEYS = new Set(['hp', 'atk', 'def', 'spd', 'crate', 'cdmg', 'res', 'acc']);

  function canonRuneSearchStatKey(tok) {
    const t = String(tok || '')
      .toLowerCase()
      .replace(/%$/, '')
      .trim();
    const map = {
      hp: 'hp',
      health: 'hp',
      atk: 'atk',
      attack: 'atk',
      def: 'def',
      defense: 'def',
      defence: 'def',
      spd: 'spd',
      speed: 'spd',
      crate: 'crate',
      cr: 'crate',
      cdmg: 'cdmg',
      cd: 'cdmg',
      cdamage: 'cdmg',
      res: 'res',
      resistance: 'res',
      acc: 'acc',
      accuracy: 'acc',
    };
    if (map[t]) return map[t];
    return RUNE_SEARCH_STAT_KEYS.has(t) ? t : null;
  }

  function parseRuneSearchQuery(rawQuery) {
    const norm = normalizeRuneSearchText(rawQuery);
    if (!norm) return { pairs: [], free: [] };
    const tokens = norm.split(' ').filter(Boolean);
    const pairs = [];
    const free = [];
    let i = 0;
    while (i < tokens.length) {
      const key = canonRuneSearchStatKey(tokens[i]);
      const next = tokens[i + 1];
      if (key && next !== undefined && /^\d+$/.test(next)) {
        pairs.push({ stat: key, value: Number(next) });
        i += 2;
        continue;
      }
      if (/^\d+$/.test(tokens[i]) && canonRuneSearchStatKey(next)) {
        pairs.push({ stat: canonRuneSearchStatKey(next), value: Number(tokens[i]) });
        i += 2;
        continue;
      }
      if (key && (next === undefined || !/^\d+$/.test(next))) {
        free.push(key);
        i += 1;
        continue;
      }
      free.push(tokens[i]);
      i += 1;
    }
    return { pairs, free };
  }

  function runeStatValueLines(r) {
    const lines = [];
    const add = (name, total) => {
      if (!name) return;
      const base =
        typeof runeStatBaseName === 'function' ? runeStatBaseName(name) : String(name).replace(/%$/, '');
      const key = canonRuneSearchStatKey(base);
      const val = Number(total);
      if (!key || !Number.isFinite(val)) return;
      lines.push({ key, value: Math.round(val) });
    };
    if (r.mainName) add(r.mainName, r.mainVal);
    if (r.innate_name) add(r.innate_name, r.innate_val);
    for (const s of r.substats || []) {
      if (!s || !s.name) continue;
      const total =
        typeof subLineTotal === 'function' ? subLineTotal(s) : (Number(s.val) || 0) + (Number(s.grind) || 0);
      add(s.name, total);
    }
    return lines;
  }

  function runeHaystackWords(hay) {
    return hay.split(' ').filter(Boolean);
  }

  function runeFreeTokensMatchHaystack(hay, free) {
    if (!free.length) return true;
    const words = runeHaystackWords(hay);
    const full = free.join(' ');
    if (full.length >= 2 && hay.includes(full)) return true;
    return free.every((tok) => {
      const stat = canonRuneSearchStatKey(tok);
      if (stat) return words.includes(stat);
      return words.includes(tok) || hay.includes(tok);
    });
  }

  /** Loose match text: lowercase, % and grind brackets → spaces. */
  function normalizeRuneSearchText(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/%/g, ' ')
      .replace(/\[\+\d+\]/g, ' ')
      .replace(/[^a-z0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function runeSearchStatTokens(statName, typeId, val, grind, total) {
    const base =
      typeof runeStatBaseName === 'function' ? runeStatBaseName(statName) : String(statName || '').replace(/%$/, '');
    const v = Number.isFinite(Number(val)) ? Number(val) : 0;
    const g = Number.isFinite(Number(grind)) ? Number(grind) : 0;
    const t = Number.isFinite(Number(total)) ? Number(total) : v + g;
    const parts = [base, String(v), String(t)];
    if (g > 0) parts.push(String(g), `${v} ${g}`, `${base} ${t}`, `${base} ${v} ${g}`);
    if (typeof formatRuneStatPlainText === 'function') {
      parts.push(
        formatRuneStatPlainText({ type: typeId, name: statName, val: v, grind: g, total: t }),
      );
    }
    return normalizeRuneSearchText(parts.join(' '));
  }

  function buildRuneSearchHaystack(r, tTable) {
    const parts = [
      r.setName,
      r.mainName,
      r.gradeStr,
      r.role,
      r.verdict,
      r.innate_name,
      String(r.innate_val ?? ''),
      String(r.slot),
      String(r.level),
      String(
        (typeof getRuneIngameScore === 'function' ? getRuneIngameScore(r) : null) ??
          r.ingameScore ??
          '',
      ),
      typeof computeRuneScore === 'function' ? String(computeRuneScore(r)) : '',
    ];
    if (r.mainName) {
      parts.push(
        runeSearchStatTokens(r.mainName, r.mainType, r.mainVal, 0, r.mainVal),
      );
    }
    if (r.innate_name) {
      parts.push(runeSearchStatTokens(r.innate_name, r.innate_type, r.innate_val, 0, r.innate_val));
    }
    for (const s of r.substats || []) {
      if (!s || !s.name) continue;
      const total = typeof subLineTotal === 'function' ? subLineTotal(s) : (Number(s.val) || 0) + (Number(s.grind) || 0);
      parts.push(runeSearchStatTokens(s.name, s.type, s.val, s.grind, total));
    }
    if (r.isAncient) {
      parts.push(String(tTable.tableAncientBadge || 'Ancient'), 'ancient');
    }
    if (typeof runeLocationLabel === 'function') {
      parts.push(runeLocationLabel(r, tTable));
    }
    return normalizeRuneSearchText(parts.join(' '));
  }

  function runeMatchesSearchQuery(r, rawQuery, tTable) {
    const norm = normalizeRuneSearchText(rawQuery);
    if (!norm) return true;
    const { pairs, free } = parseRuneSearchQuery(rawQuery);
    const statLines = runeStatValueLines(r);
    for (const p of pairs) {
      const hit = statLines.some((ln) => ln.key === p.stat && ln.value === p.value);
      if (!hit) return false;
    }
    if (pairs.length && !free.length) return true;
    const hay = buildRuneSearchHaystack(r, tTable);
    if (!pairs.length && !free.length) return true;
    if (!free.length) return hay.includes(norm);
    return runeFreeTokensMatchHaystack(hay, free);
  }

  function runeTableFilterChipDefs(f, t) {
    const chips = [];
    if (f.verdict) chips.push({ key: 'verdict', label: verdictUiLabel(t, f.verdict) || f.verdict });
    if (f.role) chips.push({ key: 'role', label: f.role });
    if (f.grade) chips.push({ key: 'grade', label: f.grade });
    if (f.set) chips.push({ key: 'set', label: f.set });
    if (f.slot) chips.push({ key: 'slot', label: `${t.runeFilterSlot || 'Slot'} ${f.slot}` });
    if (f.main) chips.push({ key: 'main', label: f.main });
    if (f.location === 'inventory') {
      chips.push({
        key: 'location',
        label: t.runeFilterInventory || t.artifactFilterInventory || t.tableGearInventory || 'Inventory',
      });
    } else if (f.location === 'equipped') {
      chips.push({
        key: 'location',
        label: t.runeFilterEquipped || t.artifactFilterEquipped || 'Equipped',
      });
    }
    if (f.ancientOnly) chips.push({ key: 'ancientOnly', label: t.tableAncientOnly || 'Ancient only' });
    return chips;
  }

  function clearRuneTableFilterChip(key) {
    switch (key) {
      case 'verdict':
        document.getElementById('filter-verdict').value = '';
        break;
      case 'role':
        document.getElementById('filter-role').value = '';
        break;
      case 'grade':
        document.getElementById('filter-grade').value = '';
        break;
      case 'set':
        document.getElementById('filter-set').value = '';
        break;
      case 'slot':
        document.getElementById('filter-slot').value = '';
        break;
      case 'main':
        document.getElementById('filter-main').value = '';
        break;
      case 'location':
        document.getElementById('filter-rune-location').value = '';
        break;
      case 'ancientOnly': {
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = false;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
        break;
      }
      default:
        break;
    }
  }

  function renderRuneTableActiveFilterChips() {
    const row = document.getElementById('rune-table-active-filters');
    const host = document.getElementById('rune-table-filter-chips');
    if (!row || !host) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const chips = runeTableFilterChipDefs(readRuneTableFiltersFromDom(), t);
    if (!chips.length) {
      host.innerHTML = '';
      row.hidden = true;
      return;
    }
    row.hidden = false;
    host.innerHTML = chips
      .map(
        (c) =>
          `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-rune-filter-chip-remove="${escapeHtml(c.key)}" aria-label="Remove">✕</button></span>`,
      )
      .join('');
  }

  function updateRuneTableFilterSummary() {
    const f = readRuneTableFiltersFromDom();
    const n = countRuneTableActiveFilters(f);
    const countEl = document.getElementById('rune-filters-active-count');
    const moreBtn = document.getElementById('rune-more-filters-btn');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const activeTpl = t.runeTableFiltersActive || '{n}';
    if (countEl) {
      countEl.textContent = n ? activeTpl.replace(/\{n\}/g, String(n)) : '';
      countEl.hidden = !n;
    }
    if (moreBtn) moreBtn.classList.toggle('monsters-toolbar-btn--filters-active', n > 0);
    renderRuneTableActiveFilterChips();
    updateRuneTableResetButton();
  }

  function updateRuneTableFilterIndicators() {
    const f = readRuneTableFiltersFromDom();
    document.querySelectorAll('#rune-table thead [data-filter-key]').forEach((th) => {
      const key = th.getAttribute('data-filter-key');
      const id = RUNE_FILTER_SELECT_IDS[key];
      const sel = id ? document.getElementById(id) : null;
      const on = !!(sel && sel.value);
      th.classList.toggle('th--filtered', on);
      const textEl = th.querySelector('.th-text');
      if (textEl) textEl.classList.toggle('th-text--filtered', on);
    });
    updateRuneTableFilterSummary();
  }

  function resetRuneTableFilters() {
    const sb = document.getElementById('search-box');
    if (sb) sb.value = '';
    const fv = document.getElementById('filter-verdict');
    if (fv) fv.value = '';
    const fr = document.getElementById('filter-role');
    if (fr) fr.value = '';
    const fg = document.getElementById('filter-grade');
    if (fg) fg.value = '';
    const fs = document.getElementById('filter-set');
    if (fs) fs.value = '';
    const fsl = document.getElementById('filter-slot');
    if (fsl) fsl.value = '';
    const fm = document.getElementById('filter-main');
    if (fm) fm.value = '';
    const floc = document.getElementById('filter-rune-location');
    if (floc) floc.value = '';
    const tglAncient = document.getElementById('toggle-ancient-only');
    if (tglAncient) tglAncient.checked = false;
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
    sortKey = 'score';
    sortDir = 'desc';
    runeTableShowAll = false;
    if (typeof setRuneTableMonsterMasterId === 'function') setRuneTableMonsterMasterId(null);
    updateSortHeaderClasses();
    updateRuneTableFilterIndicators();
    updateRuneTableResetButton();
    applyFiltersAndSort(getVisibleRunes());
  }

  /** When set, Rune Table shows only runes equipped on this unit_master_id. */
  let runeTableMonsterMasterId = null;

  function setRuneTableMonsterMasterId(masterId) {
    runeTableMonsterMasterId =
      masterId != null && Number.isFinite(Number(masterId)) ? Number(masterId) : null;
    updateRuneTableResetButton();
  }

  function clearRuneTableMonsterMasterId() {
    setRuneTableMonsterMasterId(null);
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  }

  function applyFiltersAndSort(runes, opts) {
    if (!opts || !opts.preserveTableExpansion) {
      runeTableShowAll = false;
    }
    const search  = (document.getElementById('search-box')?.value || '').toLowerCase();
    tableSearchHighlight = search;
    const tTable = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const verdict = document.getElementById('filter-verdict')?.value || '';
    const role    = document.getElementById('filter-role')?.value    || '';
    const grade   = document.getElementById('filter-grade')?.value   || '';
    const setName = document.getElementById('filter-set')?.value || '';
    const slotVal = document.getElementById('filter-slot')?.value || '';
    const mainVal = document.getElementById('filter-main')?.value || '';
    const locVal = document.getElementById('filter-rune-location')?.value || '';
    const ancientOnly = !!document.getElementById('toggle-ancient-only')?.checked;

    filteredRunes = runes.filter(r => {
      if (runeTableMonsterMasterId != null) {
        const eq = r.equipped_name != null ? Number(r.equipped_name) : NaN;
        if (eq !== runeTableMonsterMasterId) return false;
      }
      if (ancientOnly && !r.isAncient) return false;
      if (verdict && r.verdict !== verdict) return false;
      if (role) {
        if (role === 'God Roll') {
          if (r.role !== 'God Roll' && r.role !== 'High Roll') return false;
        } else if (r.role !== role) return false;
      }
      if (grade   && r.gradeStr !== grade)  return false;
      if (setName && r.setName !== setName) return false;
      if (slotVal && String(r.slot) !== slotVal) return false;
      if (mainVal && r.mainName !== mainVal) return false;
      if (locVal === 'inventory' && isRuneEquipped(r)) return false;
      if (locVal === 'equipped' && !isRuneEquipped(r)) return false;
      if (search && !runeMatchesSearchQuery(r, search, tTable)) return false;
      return true;
    });

    sortRunesInPlace(filteredRunes, sortKey, sortDir);

    if (!isRuneTableRunesTabActive()) {
      runeTableRenderPending = true;
      updateRuneTableFilterIndicators();
      return;
    }
    runeTableRenderPending = false;

    const tbody = document.getElementById('rune-tbody');
    if (!tbody) return;
    const total = filteredRunes.length;

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const countEl = document.getElementById('table-count');
    if (countEl) countEl.textContent = `${total} ${t.runes}`;

    if (!opts || !opts.preserveTableExpansion) {
      if (typeof resetRuneTableVirtualScroll === 'function') resetRuneTableVirtualScroll();
    }
    if (typeof bindRuneTableVirtualScroll === 'function') bindRuneTableVirtualScroll();
    if (typeof paintRuneTableVirtualBody === 'function') {
      runeVirtualLastKey = '';
      paintRuneTableVirtualBody(filteredRunes);
    } else {
      const cap = runeTableShowAll ? total : Math.min(RUNE_TABLE_PAGE, total);
      const rows = filteredRunes.slice(0, cap);
      tbody.innerHTML = rows.map((r, i) => runeRow(r, { rowIndex: i })).join('');
      setupRuneTableMoreUi(total, rows.length);
    }
    const loadStrip = document.getElementById('rune-table-load-strip');
    if (loadStrip) {
      loadStrip.classList.add('hidden');
      loadStrip.setAttribute('aria-hidden', 'true');
    }
    updateRuneTableFilterIndicators();
    if (typeof renderRuneTableRosterChips === 'function') renderRuneTableRosterChips();
    if (typeof paintRuneTableVirtualBody !== 'function' && typeof replaceRuneTableLocationFromState === 'function') {
      replaceRuneTableLocationFromState();
    }
  }

  function bindRuneTableFiltersDrawer() {
    const onFilter = () => {
      updateRuneTableFilterIndicators();
      applyFiltersAndSort(getVisibleRunes());
    };

    bindFiltersPopover('rune-more-filters-btn', 'rune-filters-popover', { onClose: onFilter });

    document.getElementById('rune-filters-drawer-reset')?.addEventListener('click', () => {
      ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main', 'filter-rune-location'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
      const tglAncient = document.getElementById('toggle-ancient-only');
      if (tglAncient) tglAncient.checked = false;
      localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
      onFilter();
    });
    document.getElementById('rune-table-filter-chips')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-rune-filter-chip-remove]');
      if (!btn) return;
      clearRuneTableFilterChip(btn.getAttribute('data-rune-filter-chip-remove'));
      onFilter();
    });

    ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main', 'filter-rune-location'].forEach((id) => {
      document.getElementById(id)?.addEventListener('change', onFilter);
    });
  }

  bindRuneTableFiltersDrawer();
  updateRuneTableResetButton();
