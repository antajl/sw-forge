// js/features/runes/table.js — rune table event wiring and core exports
  // ===================== TABLE =====================
  function renderTable(runes) {
    applyFiltersAndSort(runes);
  }

  /** SWOP Eff% (uncapped) — used for sort, CSV, depth charts. */
  function getRuneNumericEff(r) {
    if (!r) return 0;
    if (Number.isFinite(r.eff)) return r.eff;
    const calc = window.SWRM?.calcEfficiencyUncapped;
    return typeof calc === 'function' ? calc(r) : 0;
  }

  /** Table display only — cap at 100% like SWOP column UI. */
  function getRuneDisplayEff(r) {
    return Math.min(100, getRuneNumericEff(r));
  }

  function applyRuneTableEffHeader() {
    const lbl = document.getElementById('lbl-th-eff');
    if (!lbl) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    lbl.textContent = t.tableEffHeaderCapped || 'Eff%';
    lbl.setAttribute('title', t.tableEffHeaderCappedTitle || '');
  }

  function applyRuneTableScoreHeader() {
    const lbl = document.getElementById('lbl-th-score');
    if (!lbl) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    lbl.textContent = t.tableScoreHeader || 'Score';
    lbl.setAttribute('title', t.tableScoreHint || '');
  }

  function initRuneTablePrefsFromStorage() {
    applyRuneTableEffHeader();
    applyRuneTableScoreHeader();
    const ancient = document.getElementById('toggle-ancient-only');
    if (ancient) {
      const v = localStorage.getItem(RUNE_TABLE_ANCIENT_ONLY_KEY);
      if (v === '1') ancient.checked = true;
      else if (v === '0') ancient.checked = false;
    }
    const hideTarget = document.getElementById('toggle-target-col');
    if (hideTarget) hideTarget.checked = readRuneTableHideTarget();
    applyRuneTableTargetColumnVisibility();
  }

  function sortRunesInPlace(arr, key, dir) {
    arr.sort((a, b) => {
      let av;
      let bv;
      switch (key) {
        case 'slot':    av = a.slot;    bv = b.slot;    break;
        case 'set':     av = a.setName; bv = b.setName; break;
        case 'grade':   av = a.grade;   bv = b.grade;   break;
        case 'level':   av = a.level;   bv = b.level;   break;
        case 'main':    av = a.mainName;bv = b.mainName;break;
        case 'eff':     av = getRuneNumericEff(a); bv = getRuneNumericEff(b); break;
        case 'score':
          av = typeof computeRuneScore === 'function' ? computeRuneScore(a) : 0;
          bv = typeof computeRuneScore === 'function' ? computeRuneScore(b) : 0;
          break;
        case 'role':    av = a.role;    bv = b.role;    break;
        case 'verdict': av = a.verdict; bv = b.verdict; break;
        case 's1':      av = a.substats[0]?.name || ''; bv = b.substats[0]?.name || ''; break;
        case 's2':      av = a.substats[1]?.name || ''; bv = b.substats[1]?.name || ''; break;
        case 's3':      av = a.substats[2]?.name || ''; bv = b.substats[2]?.name || ''; break;
        case 's4':      av = a.substats[3]?.name || ''; bv = b.substats[3]?.name || ''; break;
        default:
          av = typeof computeRuneScore === 'function' ? computeRuneScore(a) : 0;
          bv = typeof computeRuneScore === 'function' ? computeRuneScore(b) : 0;
          break;
      }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function readRuneTableHideTarget() {
    try {
      return localStorage.getItem(RUNE_TABLE_HIDE_TARGET_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setupRuneTableMoreUi(total, rendered) {
    const strip = document.getElementById('rune-table-load-strip');
    const hint = document.getElementById('lbl-rune-table-more-hint');
    const btn = document.getElementById('btn-rune-table-show-all');
    if (!strip) return;

    if (runeTableShowAll || total <= RUNE_TABLE_PAGE || rendered >= total) {
      strip.classList.add('hidden');
      strip.setAttribute('aria-hidden', 'true');
      return;
    }

    strip.classList.remove('hidden');
    strip.removeAttribute('aria-hidden');
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const detailHint = (tloc.runeTableMoreHint || '')
      .replace(/\{shown\}/g, String(rendered))
      .replace(/\{total\}/g, String(total));
    if (hint) {
      hint.textContent = (tloc.runeTableMoreHintInline || '')
        .replace(/\{shown\}/g, String(rendered))
        .replace(/\{total\}/g, String(total));
    }
    if (btn) {
      btn.textContent = (tloc.runeTableShowAllButton || '').replace(/\{total\}/g, String(total));
      btn.title = detailHint;
    }
  }

  function updateSortHeaderClasses() {
    document.querySelectorAll('#rune-table thead th[data-sort]').forEach((t) => {
      t.classList.remove('sort-asc', 'sort-desc');
      if (t.dataset.sort === sortKey) {
        t.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });
  }

  function exportCsv() {
    const rows = filteredRunes;
    if (!rows.length) return;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const includeTarget = document.getElementById('rune-table')?.classList.contains('show-target');
    const headers = [
      'Grade',
      tloc.csvHeaderAncient || 'Ancient',
      'Set', 'Lvl', 'Slot', 'Main', 'Innate', 'Sub1', 'Sub2', 'Sub3', 'Sub4', 'Score', 'Eff%', 'Role', 'Verdict',
    ];
    if (includeTarget) headers.push('Target');
    function cellPart(s) {
      const raw = String(s ?? '');
      if (/[,"\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
      return raw;
    }
    function subcell(sub) {
      if (!sub || !sub.name) return '';
      const g = Number(sub.grind) || 0;
      const gem = !!(sub.enchanted || (Number(sub.gem) || 0) !== 0);
      const total = subLineTotal(sub);
      let out = `${sub.name} ${total}`;
      if (g > 0) out += ` [${g}]`;
      if (gem) out += ' (gem)';
      return out;
    }
    const lines = [headers.map(cellPart).join(',')];
    rows.forEach(r => {
      const subs = r.substats || [];
      const row = [
        r.gradeStr,
        r.isAncient ? (tloc.csvAncientYes || 'yes') : '',
        r.setName,
        r.level,
        r.slot,
        r.mainName,
        r.innate_name ? `${r.innate_name} ${r.innate_val}` : '',
        subcell(subs[0]),
        subcell(subs[1]),
        subcell(subs[2]),
        subcell(subs[3]),
        String(typeof computeRuneScore === 'function' ? computeRuneScore(r) : ''),
        `${getRuneNumericEff(r).toFixed(1)}`,
        roleDisplayName(r.role || ''),
        r.verdict || '',
      ];
      if (includeTarget) row.push(runeTargetText(r));
      lines.push(row.map(cellPart).join(','));
    });
    const csv = `\uFEFF${lines.join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `sw-rune-master-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    document.body.removeChild(a);
  }

  // Table sorting
  document.querySelectorAll('#rune-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      document.querySelectorAll('#rune-table thead th[data-sort]').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      applyFiltersAndSort(getVisibleRunes());
    });
  });

  // Export CSV from Rune Table
  document.getElementById('btn-export-csv')?.addEventListener('click', exportCsv);

  document.getElementById('btn-rune-table-show-all')?.addEventListener('click', () => {
    runeTableShowAll = true;
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  // Toggle Target column visibility
  document.getElementById('toggle-target-col')?.addEventListener('change', (e) => {
    try {
      localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, e.target.checked ? '1' : '0');
    } catch (err) { /* ignore */ }
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('toggle-ancient-only')?.addEventListener('change', (e) => {
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, e.target.checked ? '1' : '0');
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('btn-table-reset-filters')?.addEventListener('click', () => {
    resetRuneTableFilters();
  });

  document.getElementById('search-box')?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      searchDebounceTimer = null;
      applyFiltersAndSort(getVisibleRunes());
    }, 280);
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    const tag = e.target && e.target.tagName;
    const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
      || (e.target && e.target.isContentEditable);
    const onTableTab = isRuneTablePaneVisible();

    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const kind = typeof readTableKind === 'function' ? readTableKind() : 'runes';
      const searchIds = {
        runes: 'search-box',
        artifacts: 'search-box-artifacts',
        relics: 'search-box-relics',
      };
      const activeId = searchIds[kind] || 'search-box';
      if (inField && e.target.id !== activeId) return;
      if (inField && e.target.id === activeId) return;
      e.preventDefault();
      document.getElementById(activeId)?.focus();
      return;
    }

    if (!onTableTab || inField) return;
    const wrap = document.getElementById('rune-table-scroll');
    if (!wrap) return;
    const step = Math.max(96, Math.floor(wrap.clientHeight * 0.82));
    if (e.key === 'PageDown') {
      e.preventDefault();
      wrap.scrollBy({ top: step, behavior: 'smooth' });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      wrap.scrollBy({ top: -step, behavior: 'smooth' });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      wrap.scrollBy({ top: 56, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      wrap.scrollBy({ top: -56, behavior: 'smooth' });
    }
  });
