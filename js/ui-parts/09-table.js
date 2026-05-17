// ui-parts/09-table.js — slice of ui.monolith.bak.js L3304-4072
  // ===================== TABLE =====================
  function renderTable(runes) {
    applyFiltersAndSort(runes);
  }

  let filteredRunes = [];

  function getRuneNumericEff(r) {
    if (!r) return 0;
    return Number.isFinite(r.eff) ? r.eff : 0;
  }

  function applyRuneTableEffHeader() {
    const lbl = document.getElementById('lbl-th-eff');
    if (!lbl) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    lbl.textContent = t.tableEffHeaderCapped || 'Eff%';
    lbl.setAttribute('title', t.tableEffHeaderCappedTitle || '');
  }

  function initRuneTablePrefsFromStorage() {
    applyRuneTableEffHeader();
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
        case 'role':    av = a.role;    bv = b.role;    break;
        case 'verdict': av = a.verdict; bv = b.verdict; break;
        case 's1':      av = a.substats[0]?.name || ''; bv = b.substats[0]?.name || ''; break;
        case 's2':      av = a.substats[1]?.name || ''; bv = b.substats[1]?.name || ''; break;
        case 's3':      av = a.substats[2]?.name || ''; bv = b.substats[2]?.name || ''; break;
        case 's4':      av = a.substats[3]?.name || ''; bv = b.substats[3]?.name || ''; break;
        default:        av = a.eff;     bv = b.eff;
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

  function roleDisplayName(role) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (role === 'God Roll' || role === 'High Roll') return t.roleGodRoll || 'God Roll';
    return role || '';
  }

  function sellReasonText(r) {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const code = r.sellReasonCode || '';
    if (!code) return t.sellReasonNoRole || 'No matching role';
    if (code === 'duo_near') return t.sellReasonDuoNear || '';
    if (code === 'exclude') {
      const roleLbl = roleDisplayName(r.sellReasonDetail || '');
      return (t.sellReasonExclude || 'Exclude stat blocks {role}').replace(/\{role\}/g, roleLbl);
    }
    if (code === 'bad_flat') return t.sellReasonBadFlat || '';
    if (code === 'low_eff') return t.sellReasonLowEff || '';
    if (code === 'low_eff_finish') return t.sellReasonLowEffFinish || '';
    return t.sellReasonNoRole || 'No matching role';
  }

  function runeTableTargetColumnVisible() {
    const verdictFilter = document.getElementById('filter-verdict')?.value || '';
    if (verdictFilter === 'Grind' || verdictFilter === 'Gem') return true;
    return !readRuneTableHideTarget() && !document.getElementById('toggle-target-col')?.checked;
  }

  function applyRuneTableTargetColumnVisibility() {
    const show = runeTableTargetColumnVisible();
    document.getElementById('target-col-header')?.classList.toggle('hidden', !show);
    document.getElementById('target-filter-cell')?.classList.toggle('hidden', !show);
    document.getElementById('rune-table')?.classList.toggle('show-target', show);
  }

  function runeTargetText(r) {
    const tl = TRANSLATIONS[currentLang];
    const v = r.verdict || '';
    if (v === 'Sell') return sellReasonText(r);
    if (v === 'Grind') {
      const g = r.grindInfo;
      if (g && g.can && g.stat) {
        if (typeof g.from === 'number' && typeof g.need === 'number') {
          const from = Math.ceil(g.from);
          const need = Math.ceil(g.need);
          const maxTo = typeof g.to === 'number' ? Math.ceil(g.to) : null;
          if (maxTo != null) {
            return `${g.stat} ${from}→${need} (max ${maxTo})`;
          }
          return `${g.stat} ${from}→${need}`;
        }
        return g.stat;
      }
      return '';
    }
    if (v === 'Gem') {
      const subs = Array.isArray(r.gemInfo?.badFlatSubs)
        ? r.gemInfo.badFlatSubs.filter(Boolean)
        : [];
      if (subs.length > 0) {
        const verb = tl.targetGemReplaceVerb || 'Replace';
        const sep = tl.targetGemReplaceOr || ' or ';
        return `${verb} ${subs.join(sep)}`;
      }
      return '';
    }
    if (v === 'Upgrade') return tl.actionTargetUpgrade;
    if (v === 'Finish') return tl.actionTargetFinish;
    if (v === 'Reapp') return tl.actionTargetReapp;
    return '';
  }

  /** Raw grindInfo / gemInfo fields for native tooltip on Target cell (Grind/Gem). */
  function runeEngineDetailTooltip(r) {
    const tl = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [];
    const v = r.verdict || '';
    if (v === 'Grind' && r.grindInfo && typeof r.grindInfo === 'object') {
      parts.push(tl.tableTooltipGrind || 'Grind');
      Object.keys(r.grindInfo).sort().forEach((k) => {
        const val = r.grindInfo[k];
        if (val === undefined || val === null || val === '') return;
        parts.push(`${k}=${val}`);
      });
    } else if (v === 'Gem' && r.gemInfo && typeof r.gemInfo === 'object') {
      parts.push(tl.tableTooltipGem || 'Gem');
      Object.keys(r.gemInfo).sort().forEach((k) => {
        const val = r.gemInfo[k];
        if (val === undefined || val === null || val === '') return;
        parts.push(`${k}=${val}`);
      });
    }
    return parts.join(' · ');
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
    if (sortKey !== 'eff') p.set('sort', sortKey);
    if (sortDir !== 'desc') p.set('dir', sortDir);
    if (document.getElementById('toggle-target-col')?.checked) p.set('target', '0');
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
      const sk = params.get('sort');
      if (sk && RUNE_TABLE_SORT_KEYS.has(sk)) sortKey = sk;
      const sd = params.get('dir');
      if (sd === 'asc' || sd === 'desc') sortDir = sd;
      if (params.has('target')) {
        const hide = params.get('target') === '0';
        const tgl = document.getElementById('toggle-target-col');
        if (tgl) tgl.checked = hide;
        try {
          localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, hide ? '1' : '0');
        } catch (e) { /* ignore */ }
      }
      if (params.has('ancient')) {
        const on = params.get('ancient') === '1';
        const tgl = document.getElementById('toggle-ancient-only');
        if (tgl) tgl.checked = on;
        localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, on ? '1' : '0');
      }
      if (params.has('all')) runeTableShowAll = params.get('all') === '1';
      else runeTableShowAll = false;
      applyRuneTableTargetColumnVisibility();
    } finally {
      runeTableApplyingHash = false;
      applyRuneTableEffHeader();
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

  function updateRuneTableFilterIndicators() {
    document.querySelectorAll('#rune-table thead .th-text[data-filter]').forEach((textEl) => {
      const key = textEl.getAttribute('data-filter');
      const sel = document.getElementById(
        key === 'grade' ? 'filter-grade'
          : key === 'set' ? 'filter-set'
            : key === 'slot' ? 'filter-slot'
              : key === 'main' ? 'filter-main'
                : key === 'role' ? 'filter-role'
                  : key === 'verdict' ? 'filter-verdict' : ''
      );
      const on = !!(sel && sel.value);
      textEl.classList.toggle('th-text--filtered', on);
    });
  }

  function highlightSearchInPlain(text, qRaw) {
    const q = (qRaw || '').trim().toLowerCase();
    const t = String(text ?? '');
    if (!q) return escapeHtml(t);
    const tl = t.toLowerCase();
    const parts = [];
    let i = 0;
    while (i < t.length) {
      const idx = tl.indexOf(q, i);
      if (idx === -1) {
        parts.push(escapeHtml(t.slice(i)));
        break;
      }
      if (idx > i) parts.push(escapeHtml(t.slice(i, idx)));
      parts.push(`<mark class="search-hit">${escapeHtml(t.slice(idx, idx + q.length))}</mark>`);
      i = idx + q.length;
    }
    return parts.join('');
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
    const tgl = document.getElementById('toggle-target-col');
    if (tgl) tgl.checked = false;
    try {
      localStorage.setItem(RUNE_TABLE_HIDE_TARGET_KEY, '0');
    } catch (e) { /* ignore */ }
    const tglAncient = document.getElementById('toggle-ancient-only');
    if (tglAncient) tglAncient.checked = false;
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, '0');
    applyRuneTableTargetColumnVisibility();
    sortKey = 'eff';
    sortDir = 'desc';
    runeTableShowAll = false;
    if (typeof setRuneTableMonsterMasterId === 'function') setRuneTableMonsterMasterId(null);
    updateSortHeaderClasses();
    updateRuneTableFilterIndicators();
    applyFiltersAndSort(getVisibleRunes());
  }

  /** When set, Rune Table shows only runes equipped on this unit_master_id. */
  let runeTableMonsterMasterId = null;

  function setRuneTableMonsterMasterId(masterId) {
    runeTableMonsterMasterId =
      masterId != null && Number.isFinite(Number(masterId)) ? Number(masterId) : null;
    const strip = document.getElementById('rune-table-monster-filter');
    if (strip) strip.hidden = runeTableMonsterMasterId == null;
    const label = document.getElementById('rune-table-monster-filter-label');
    if (label && runeTableMonsterMasterId != null && window.SWRM_MONSTER_DB) {
      const name = window.SWRM_MONSTER_DB.monsterDisplayName(runeTableMonsterMasterId);
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const tpl = t.runeTableMonsterFilterTpl || 'Runes on {name}';
      label.textContent = tpl.replace('{name}', name);
    }
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
      if (search) {
        const subParts = (r.substats || []).flatMap((s) => {
          const total = subLineTotal(s);
          const grind = Number(s.grind) || 0;
          return [s.name, String(total), grind > 0 ? String(s.val ?? '') : ''];
        });
        const ancientTokens = r.isAncient
          ? [String(tTable.tableAncientBadge || 'Ancient'), 'ancient']
          : [];
        const haystack = [
          r.setName, r.mainName, r.gradeStr, r.role, r.verdict,
          r.innate_name, String(r.innate_val ?? ''),
          ...ancientTokens,
          ...subParts,
        ].join(' ').toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    sortRunesInPlace(filteredRunes, sortKey, sortDir);

    const tbody = document.getElementById('rune-tbody');
    if (!tbody) return;
    const total = filteredRunes.length;
    const cap = runeTableShowAll ? total : Math.min(RUNE_TABLE_PAGE, total);
    const rows = filteredRunes.slice(0, cap);

    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const countEl = document.getElementById('table-count');
    if (countEl) {
      if (!runeTableShowAll && total > RUNE_TABLE_PAGE) {
        const tmpl = t.runeTableCountCapped || '{shown} / {total} {runes}';
        countEl.textContent = tmpl
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total))
          .replace(/\{runes\}/g, t.runes);
      } else {
        countEl.textContent = `${total} ${t.runes}`;
      }
    }

    const detailEl = document.getElementById('table-count-detail');
    if (detailEl) {
      if (total === 0) {
        detailEl.textContent = t.tableShownDetailEmpty || '';
      } else if (!runeTableShowAll && total > RUNE_TABLE_PAGE) {
        detailEl.textContent = (t.tableShownDetailCapped || '')
          .replace(/\{shown\}/g, String(cap))
          .replace(/\{total\}/g, String(total));
      } else {
        detailEl.textContent = (t.tableShownDetailAll || '')
          .replace(/\{total\}/g, String(total));
      }
    }

    applyRuneTableTargetColumnVisibility();
    tbody.innerHTML = rows.map(r => runeRow(r)).join('');
    setupRuneTableMoreUi(total, rows.length);
    updateRuneTableFilterIndicators();
    replaceRuneTableLocationFromState();
  }

  function exportCsv() {
    const rows = filteredRunes;
    if (!rows.length) return;
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const includeTarget = document.getElementById('rune-table')?.classList.contains('show-target');
    const headers = [
      'Grade',
      tloc.csvHeaderAncient || 'Ancient',
      'Set', 'Lvl', 'Slot', 'Main', 'Innate', 'Sub1', 'Sub2', 'Sub3', 'Sub4', 'Eff%', 'Role', 'Verdict',
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
        `${getRuneNumericEff(r).toFixed(1)}%`,
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

  /** Stylised “Ancient” mark: A without crossbar, dot at mid-height (matches in-game cue). */
  const ANCIENT_GRADE_ICON_SVG =
    '<svg class="ancient-grade-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.85" d="M2.35 12.85L8 2.65l5.65 10.2"/>'
    + '<circle cx="8" cy="9.55" r="1.45" fill="currentColor"/>'
    + '</svg>';

  /** Counter‑clockwise circular arrows (gem / replaced sub) — stroke reads clearly at small sizes. */
  const STAT_SUB_GEM_ICON_SVG =
    '<svg class="table-stat-gem-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M1 4v6h6"/>'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M23 20v-6h-6"/>'
    + '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>'
    + '</svg>';

  /** Plain table text (no chip) — set / main / innate / subs / target */
  function tableStatLine(innerHtml, opts) {
    const setCls = opts && opts.set ? ' table-stat--set' : '';
    const gemOnlyCls = opts && opts.gemOnly ? ' table-stat--gem-only' : '';
    const tipAttr = opts && opts.tip ? ` title="${escapeAttr(opts.tip)}"` : '';
    const gemSvg = opts && opts.gem ? STAT_SUB_GEM_ICON_SVG : '';
    return `<span class="table-stat${setCls}${gemOnlyCls}"${tipAttr}>${innerHtml}${gemSvg}</span>`;
  }

  function renderSubStat(s) {
    if (!s || !s.name) return '';
    const grindAmt = Number(s.grind) || 0;
    const gemMarked = !!(s.enchanted || (Number(s.gem) || 0) !== 0);
    const total = subLineTotal(s);
    const showGrindSuffix = grindAmt > 0;
    const valShown = showGrindSuffix ? `${total} [${grindAmt}]` : String(total);
    const plain = `${s.name} ${valShown}`;
    const inner = highlightSearchInPlain(plain, tableSearchHighlight);
    const grindCls = showGrindSuffix ? ' table-stat__text--grind' : '';
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const tipParts = [];
    if (showGrindSuffix) {
      tipParts.push((tloc.tableSubGrindTooltip || '').replace(/\{n\}/g, String(grindAmt)));
    }
    if (gemMarked) tipParts.push(tloc.tableSubGemTooltip || '');
    const tip = tipParts.filter(Boolean).join(' ');
    return tableStatLine(`<span class="table-stat__text${grindCls}">${inner}</span>`, {
      tip,
      gem: gemMarked,
      gemOnly: gemMarked && !showGrindSuffix,
    });
  }

  function roleClass(role) {
    const m = {
      'God Roll':'godroll','High Roll':'godroll','Bruiser':'bruiser','Fast CC':'fastcc',
      'Classic DPS':'classicdps','Slow DPS':'slowdps','Bomber':'bomber',
      'Tank':'tank','Duo Roll':'duoroll'
    };
    return m[role] || '';
  }

  function runeRow(r) {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const gradeKey = r.gradeStr;
    const gradeClass = { Legend: 'legend', Hero: 'hero', Rare: 'rare' }[gradeKey] || 'grade-tag--other';
    const gradeLabel = { Legend: 'Legend', Hero: 'Hero', Rare: 'Rare' }[gradeKey] || String(r.gradeStr);
    const gradeLabelHtml = highlightSearchInPlain(gradeLabel, tableSearchHighlight);
    const ancientTipRaw = tloc.tableAncientBadgeTitle || '';
    const ancientTipAttr = r.isAncient && ancientTipRaw ? ` title="${escapeAttr(ancientTipRaw)}"` : '';
    const ancientLbl = escapeAttr(tloc.tableAncientBadge || 'Ancient');
    const ancientIcon = r.isAncient
      ? `<span class="ancient-grade-icon-wrap" aria-hidden="true">${ANCIENT_GRADE_ICON_SVG}</span>`
      : '';
    const gradeAria = r.isAncient ? ` aria-label="${ancientLbl}, ${escapeAttr(gradeLabel)}"` : '';
    const grade = `<span class="grade-tag ${gradeClass}${r.isAncient ? ' grade-tag--ancient' : ''}"${ancientTipAttr}${gradeAria}>${ancientIcon}<span class="grade-tag__lbl">${gradeLabelHtml}</span></span>`;

    const effNum = getRuneNumericEff(r);
    const effTier =
      effNum >= 90 ? 'stat-chip--eff-hi' : effNum >= 75 ? 'stat-chip--eff-mid' : 'stat-chip--eff-lo';
    const effShown = `${(Math.round(effNum * 10) / 10).toFixed(1)}%`;
    const rCls = roleClass(r.role);
    const subs   = r.substats.slice(0, 4);
    const innate = r.innate_name ? `${r.innate_name} ${r.innate_val}` : '';
    const innateHtml = innate
      ? tableStatLine(highlightSearchInPlain(innate, tableSearchHighlight))
      : '';
    const target = runeTargetText(r);
    const targetHtml = target
      ? tableStatLine(highlightSearchInPlain(target, tableSearchHighlight))
      : '';
    const targetTipRaw = runeEngineDetailTooltip(r);
    const targetTipAttr = targetTipRaw ? ` title="${escapeAttr(targetTipRaw)}"` : '';
    const mainInner = highlightSearchInPlain(r.mainName, tableSearchHighlight);
    const roleText = roleDisplayName((r.role || '').trim());
    const roleHtml = roleText
      ? `<span class="role-tag ${rCls}">${highlightSearchInPlain(roleText, tableSearchHighlight)}</span>`
      : '';
    const verdictText = (r.verdict || '').trim();
    const verdictHtml = verdictText
      ? `<span class="verdict-tag ${verdictText.toLowerCase()}">${highlightSearchInPlain(verdictText, tableSearchHighlight)}</span>`
      : '';

    const subCell = (sub, first) => {
      const inner = sub ? renderSubStat(sub) : '';
      const cls = first ? 'col-sub col-sub-first' : 'col-sub';
      return `<td class="${cls}">${inner}</td>`;
    };

    return `<tr>
      <td class="col-grade col-pin">${grade}</td>
      <td class="col-set col-pin col-text">${tableStatLine(highlightSearchInPlain(r.setName, tableSearchHighlight), { set: true })}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.level), tableSearchHighlight)}</td>
      <td class="col-num td-num-plain">${highlightSearchInPlain(String(r.slot), tableSearchHighlight)}</td>
      <td class="col-text">${tableStatLine(mainInner)}</td>
      <td class="col-text">${innateHtml}</td>
      ${subCell(subs[0], true)}
      ${subCell(subs[1], false)}
      ${subCell(subs[2], false)}
      ${subCell(subs[3], false)}
      <td class="col-num td-num"><span class="stat-chip stat-chip--eff ${effTier}">${highlightSearchInPlain(effShown, tableSearchHighlight)}</span></td>
      <td class="col-text">${roleHtml}</td>
      <td class="col-text">${verdictHtml}</td>
      <td class="target-col-cell col-text"${targetTipAttr}>${targetHtml}</td>
    </tr>`;
  }

  // Table sorting — main table (skip filter columns; those have th-text/th-filter)
  document.querySelectorAll('#rune-table thead th[data-sort]').forEach(th => {
    th.addEventListener('click', (e) => {
      // Ignore clicks on filter text/select
      if (e.target.closest('.th-text') || e.target.closest('.th-filter')) return;
      const key = th.dataset.sort;
      if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortKey = key; sortDir = 'desc'; }
      document.querySelectorAll('#rune-table thead th[data-sort]').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      applyFiltersAndSort(getVisibleRunes());
    });
  });

  function closeAllRuneTableHeaderFilters() {
    document.querySelectorAll('#rune-table thead .th-filter').forEach(s => {
      s.style.display = 'none';
    });
    document.querySelectorAll('#rune-table thead .th-text').forEach(t => {
      t.classList.remove('th-text--filter-active');
      t.style.removeProperty('display');
    });
  }

  // Inline filter toggles inside table headers — hover to reveal, click to open
  document.querySelectorAll('#rune-table thead th .th-text').forEach(textEl => {
    textEl.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      const select = textEl.parentElement.querySelector('.th-filter');
      if (!select) return;
      closeAllRuneTableHeaderFilters();
      select.style.display = 'inline-block';
      textEl.classList.add('th-text--filter-active');
    });
  });

  // Hide select when cursor leaves the header cell (unless select is focused/open)
  document.querySelectorAll('#rune-table thead th.th-has-filter').forEach(th => {
    const select = th.querySelector('.th-filter');
    const text = th.querySelector('.th-text');
    if (!select || !text) return;

    th.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (document.activeElement !== select) {
          select.style.display = 'none';
          text.classList.remove('th-text--filter-active');
          text.style.removeProperty('display');
        }
      }, 200);
    });
  });

  document.querySelectorAll('#rune-table thead th .th-filter').forEach(select => {
    // Prevent sort when clicking inside the select
    select.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    select.addEventListener('change', () => {
      select.style.display = 'none';
      const text = select.parentElement.querySelector('.th-text');
      if (text) {
        text.classList.remove('th-text--filter-active');
        text.style.removeProperty('display');
      }
      applyFiltersAndSort(getVisibleRunes());
    });

    select.addEventListener('blur', () => {
      // Small delay so change fires first
      setTimeout(() => {
        select.style.display = 'none';
        const text = select.parentElement.querySelector('.th-text');
        if (text) {
          text.classList.remove('th-text--filter-active');
          text.style.removeProperty('display');
        }
      }, 150);
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
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('toggle-ancient-only')?.addEventListener('change', (e) => {
    localStorage.setItem(RUNE_TABLE_ANCIENT_ONLY_KEY, e.target.checked ? '1' : '0');
    applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
  });

  document.getElementById('btn-table-reset-filters')?.addEventListener('click', () => {
    resetRuneTableFilters();
  });

  document.getElementById('btn-rune-table-clear-monster-filter')?.addEventListener('click', () => {
    if (typeof clearRuneTableMonsterMasterId === 'function') clearRuneTableMonsterMasterId();
  });

  // Table filters (search debounced separately)
  ['filter-verdict', 'filter-role', 'filter-grade', 'filter-set', 'filter-slot', 'filter-main'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => applyFiltersAndSort(getVisibleRunes()));
    document.getElementById(id)?.addEventListener('change', () => applyFiltersAndSort(getVisibleRunes()));
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
      if (inField && e.target.id !== 'search-box') return;
      if (inField && e.target.id === 'search-box') return;
      e.preventDefault();
      document.getElementById('search-box')?.focus();
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
