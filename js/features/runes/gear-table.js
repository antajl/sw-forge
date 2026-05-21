// js/features/runes/gear-table.js — artifact & relic tables inside Runes → Table
  const TABLE_KIND_IDS = ['runes', 'artifacts', 'relics'];
  const TABLE_KIND_STORAGE_KEY = 'swrm_table_kind_v1';
  let tableKindTabsBound = false;
  let filteredArtifacts = [];
  let filteredRelics = [];
  let artifactFilterGrade = '';
  let artifactFilterCategory = '';
  let artifactFilterLocation = '';
  let relicFilterGrade = '';
  let relicFilterCategory = '';

  function normalizeTableKind(id) {
    return TABLE_KIND_IDS.includes(id) ? id : 'runes';
  }

  function readTableKind() {
    try {
      const v = sessionStorage.getItem(TABLE_KIND_STORAGE_KEY);
      return normalizeTableKind(v || 'runes');
    } catch (e) {
      return 'runes';
    }
  }

  function writeTableKind(id) {
    try {
      sessionStorage.setItem(TABLE_KIND_STORAGE_KEY, normalizeTableKind(id));
    } catch (e) { /* ignore */ }
  }

  function gearLocationLabel(occupiedId, t) {
    const inv = t.tableGearInventory || 'Inventory';
    if (occupiedId == null || !Number.isFinite(Number(occupiedId)) || Number(occupiedId) === 0) {
      return inv;
    }
    const uid = Number(occupiedId);
    const u = (allUnits || []).find((x) => Number(x.unitId) === uid);
    if (!u) return inv;
    const db = window.SWRM_MONSTER_DB;
    const name = db ? db.monsterDisplayName(u.masterId) : '';
    return name || `#${u.masterId}`;
  }

  function gearSearchHay(gear) {
    const parts = [
      gear.kind,
      gear.category,
      gear.gradeStr,
      gearLocationLabel(gear.occupiedId, { tableGearInventory: 'Inventory' }),
    ];
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    if (gear.pri && fmt) parts.push(fmt(gear.pri, { kind: gear.kind }));
    if (gear.kind === 'relic' && fmtSec) parts.push(fmtSec(gear));
    if (gear.kind === 'artifact' && fmtSub) {
      for (const s of gear.secs || []) parts.push(fmtSub(s));
    }
    return parts.join(' ').toLowerCase();
  }

  function artifactPassesFilters(a) {
    if (artifactFilterGrade && String(a.gradeStr || '') !== artifactFilterGrade) return false;
    if (artifactFilterCategory && String(a.category || '') !== artifactFilterCategory) return false;
    if (artifactFilterLocation === 'inventory') {
      if (a.occupiedId != null && Number(a.occupiedId) !== 0) return false;
    } else if (artifactFilterLocation === 'equipped') {
      if (a.occupiedId == null || Number(a.occupiedId) === 0) return false;
    }
    return true;
  }

  function relicPassesFilters(r) {
    if (relicFilterGrade && String(r.gradeStr || '') !== relicFilterGrade) return false;
    if (relicFilterCategory && String(r.category || '') !== relicFilterCategory) return false;
    return true;
  }

  function applyGearTableSearch() {
    const artQ = (document.getElementById('search-box-artifacts')?.value || '')
      .trim()
      .toLowerCase();
    const relQ = (document.getElementById('search-box-relics')?.value || '').trim().toLowerCase();
    const artSrc = (allArtifacts || []).filter(artifactPassesFilters);
    const relSrc = (allRelics || []).filter(relicPassesFilters);
    filteredArtifacts = !artQ
      ? artSrc.slice()
      : artSrc.filter((a) => gearSearchHay(a).includes(artQ));
    filteredRelics = !relQ ? relSrc.slice() : relSrc.filter((r) => gearSearchHay(r).includes(relQ));
  }

  function countActiveArtifactFilters() {
    let n = 0;
    if (artifactFilterGrade) n++;
    if (artifactFilterCategory) n++;
    if (artifactFilterLocation) n++;
    return n;
  }

  function countActiveRelicFilters() {
    let n = 0;
    if (relicFilterGrade) n++;
    if (relicFilterCategory) n++;
    return n;
  }

  function updateArtifactFilterBadge() {
    const badge = document.getElementById('artifact-filters-active-count');
    if (!badge) return;
    const n = countActiveArtifactFilters();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function updateRelicFilterBadge() {
    const badge = document.getElementById('relic-filters-active-count');
    if (!badge) return;
    const n = countActiveRelicFilters();
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function populateGearFilterSelects() {
    const arts = allArtifacts || [];
    const rels = allRelics || [];
    const artGrades = [...new Set(arts.map((a) => a.gradeStr).filter(Boolean))].sort();
    const artCats = [...new Set(arts.map((a) => a.category).filter(Boolean))].sort();
    const relGrades = [...new Set(rels.map((r) => r.gradeStr).filter(Boolean))].sort();
    const relCats = [...new Set(rels.map((r) => r.category).filter(Boolean))].sort();
    const fill = (sel, values, current) => {
      if (!sel) return;
      const keep = current || sel.value || '';
      sel.innerHTML = '<option value="">All</option>';
      for (const v of values) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = v;
        sel.appendChild(opt);
      }
      sel.value = keep;
    };
    fill(document.getElementById('filter-artifact-grade'), artGrades, artifactFilterGrade);
    fill(document.getElementById('filter-artifact-category'), artCats, artifactFilterCategory);
    fill(document.getElementById('filter-relic-grade'), relGrades, relicFilterGrade);
    fill(document.getElementById('filter-relic-category'), relCats, relicFilterCategory);
  }

  function resetArtifactTableFilters() {
    artifactFilterGrade = '';
    artifactFilterCategory = '';
    artifactFilterLocation = '';
    const sb = document.getElementById('search-box-artifacts');
    if (sb) sb.value = '';
    const g = document.getElementById('filter-artifact-grade');
    const c = document.getElementById('filter-artifact-category');
    const l = document.getElementById('filter-artifact-location');
    if (g) g.value = '';
    if (c) c.value = '';
    if (l) l.value = '';
    updateArtifactFilterBadge();
    renderGearTables();
  }

  function resetRelicTableFilters() {
    relicFilterGrade = '';
    relicFilterCategory = '';
    const sb = document.getElementById('search-box-relics');
    if (sb) sb.value = '';
    const g = document.getElementById('filter-relic-grade');
    const c = document.getElementById('filter-relic-category');
    if (g) g.value = '';
    if (c) c.value = '';
    updateRelicFilterBadge();
    renderGearTables();
  }

  function updateGearTableCount() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const artEl = document.getElementById('artifact-table-count');
    const relEl = document.getElementById('relic-table-count');
    if (artEl) {
      artEl.textContent = (t.tableCountArtifacts || '{n} artifacts').replace(
        '{n}',
        String(filteredArtifacts.length),
      );
    }
    if (relEl) {
      relEl.textContent = (t.tableCountRelics || '{n} relics').replace(
        '{n}',
        String(filteredRelics.length),
      );
    }
    const legacy = document.getElementById('table-count');
    const kind = readTableKind();
    if (legacy && kind === 'artifacts' && artEl) legacy.textContent = artEl.textContent;
    if (legacy && kind === 'relics' && relEl) legacy.textContent = relEl.textContent;
  }

  function artifactSubStack(a, fmtSub) {
    const subs = (a.secs || []).slice(0, 4);
    if (!subs.length) {
      return '<span class="gear-table-subs__empty">—</span>';
    }
    return subs
      .map((s) => {
        const text = s && fmtSub ? fmtSub(s) : '—';
        return `<span class="gear-table-subs__line">${escapeHtml(text)}</span>`;
      })
      .join('');
  }

  function renderArtifactTableBody() {
    const tbody = document.getElementById('artifact-tbody');
    if (!tbody) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSub = window.SWRM && window.SWRM.formatArtifactSubLine;
    if (!filteredArtifacts.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="table-empty">${escapeHtml(t.tableGearEmpty || 'No artifacts')}</td></tr>`;
      return;
    }
    const rows = filteredArtifacts
      .slice()
      .sort(
        (a, b) =>
          String(a.category).localeCompare(String(b.category)) ||
          String(a.gradeStr).localeCompare(String(b.gradeStr)),
      )
      .map((a) => {
        const main = a.pri && fmt ? fmt(a.pri, { kind: 'artifact' }) : '—';
        return `<tr>
          <td class="col-grade">${escapeHtml(a.gradeStr || '—')}</td>
          <td>${escapeHtml(a.category || '—')}</td>
          <td>${escapeHtml(main)}</td>
          <td class="col-subs-stack"><div class="gear-table-subs">${artifactSubStack(a, fmtSub)}</div></td>
          <td>${escapeHtml(gearLocationLabel(a.occupiedId, t))}</td>
        </tr>`;
      });
    tbody.innerHTML = rows.join('');
  }

  function renderRelicTableBody() {
    const tbody = document.getElementById('relic-tbody');
    if (!tbody) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const fmt = window.SWRM && window.SWRM.formatGearEffectLine;
    const fmtSec = window.SWRM && window.SWRM.formatRelicSecLine;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    if (!filteredRelics.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${escapeHtml(t.tableGearEmptyRelics || 'No relics')}</td></tr>`;
      return;
    }
    const rows = filteredRelics
      .slice()
      .sort(
        (a, b) =>
          String(a.category).localeCompare(String(b.category)) ||
          (b.level || 0) - (a.level || 0),
      )
      .map((r) => {
        const main = r.pri && fmt ? fmt(r.pri, { kind: 'relic' }) : '—';
        const sec = fmtSec ? fmtSec(r) : '—';
        const dur = fmtDur ? fmtDur(r) : '—';
        const grade = r.gradeStr || '—';
        const fmtWear =
          window.SWRM && typeof window.SWRM.formatRelicWearCount === 'function'
            ? window.SWRM.formatRelicWearCount
            : null;
        const wear = fmtWear ? fmtWear(r) : '0/100';
        return `<tr>
          <td class="col-grade">${escapeHtml(grade)}</td>
          <td>${escapeHtml(r.category || '—')}</td>
          <td class="th-num">+${escapeHtml(String(r.level || 0))}</td>
          <td class="th-num">${escapeHtml(dur)}</td>
          <td>${escapeHtml(main)}</td>
          <td class="col-text">${escapeHtml(sec)}</td>
          <td class="th-num">${escapeHtml(wear)}</td>
        </tr>`;
      });
    tbody.innerHTML = rows.join('');
  }

  function renderGearTables() {
    applyGearTableSearch();
    renderArtifactTableBody();
    renderRelicTableBody();
    updateGearTableCount();
  }

  function setTableToolbarVisible(kind) {
    document.querySelectorAll('[data-table-toolbar]').forEach((el) => {
      const on = el.dataset.tableToolbar === kind;
      el.classList.toggle('hidden', !on);
      if (on) el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
  }

  function updateTableKindTabIndicator() {
    const nav = document.getElementById('table-kind-tabs');
    const indicator = nav && nav.querySelector('.table-kind-tabs__indicator');
    const active = nav && nav.querySelector('.table-kind-tab.is-active');
    if (!nav || !indicator || !active) return;
    const navRect = nav.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    indicator.style.left = `${tabRect.left - navRect.left}px`;
    indicator.style.width = `${tabRect.width}px`;
  }

  function showTableKind(kind, options) {
    const id = normalizeTableKind(kind);
    writeTableKind(id);
    document.querySelectorAll('.table-kind-tab').forEach((btn) => {
      const on = btn.dataset.tableKind === id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('[data-table-kind-pane]').forEach((pane) => {
      const on = pane.dataset.tableKindPane === id;
      pane.classList.toggle('is-active', on);
      pane.classList.toggle('hidden', !on);
      if (on) pane.removeAttribute('hidden');
      else pane.setAttribute('hidden', '');
    });
    setTableToolbarVisible(id);
    const runeOnly = document.getElementById('rune-table-rune-only-ui');
    if (runeOnly) runeOnly.hidden = id !== 'runes';
    const loadStrip = document.getElementById('rune-table-load-strip');
    if (loadStrip) loadStrip.classList.toggle('hidden', id !== 'runes');
    const runeMeta = document.getElementById('rune-table-roster-meta');
    if (runeMeta) runeMeta.classList.toggle('hidden', id !== 'runes');
    const runeChips = document.getElementById('rune-table-active-filters');
    if (runeChips) runeChips.classList.toggle('hidden', id !== 'runes');
    const search = document.getElementById('search-box');
    if (search) {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      search.placeholder = t.tableSearchRunes || 'Search by set, stat, role…';
    }
    updateTableKindTabIndicator();
    if (id === 'runes') {
      if (options && options.skipRuneRender) return;
      applyFiltersAndSort(getVisibleRunes(), { preserveTableExpansion: true });
    } else {
      renderGearTables();
    }
  }

  function bindGearTableFilters() {
    if (bindGearTableFilters._done) return;
    bindGearTableFilters._done = true;

    document.getElementById('btn-artifact-reset-filters')?.addEventListener('click', resetArtifactTableFilters);
    document.getElementById('artifact-filters-drawer-reset')?.addEventListener('click', resetArtifactTableFilters);
    document.getElementById('btn-relic-reset-filters')?.addEventListener('click', resetRelicTableFilters);
    document.getElementById('relic-filters-drawer-reset')?.addEventListener('click', resetRelicTableFilters);

    const onArtifactFilterChange = () => {
      artifactFilterGrade = document.getElementById('filter-artifact-grade')?.value || '';
      artifactFilterCategory = document.getElementById('filter-artifact-category')?.value || '';
      artifactFilterLocation = document.getElementById('filter-artifact-location')?.value || '';
      updateArtifactFilterBadge();
      renderGearTables();
    };
    document.getElementById('filter-artifact-grade')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-category')?.addEventListener('change', onArtifactFilterChange);
    document.getElementById('filter-artifact-location')?.addEventListener('change', onArtifactFilterChange);

    const onRelicFilterChange = () => {
      relicFilterGrade = document.getElementById('filter-relic-grade')?.value || '';
      relicFilterCategory = document.getElementById('filter-relic-category')?.value || '';
      updateRelicFilterBadge();
      renderGearTables();
    };
    document.getElementById('filter-relic-grade')?.addEventListener('change', onRelicFilterChange);
    document.getElementById('filter-relic-category')?.addEventListener('change', onRelicFilterChange);

    let artDebounce = null;
    document.getElementById('search-box-artifacts')?.addEventListener('input', () => {
      clearTimeout(artDebounce);
      artDebounce = setTimeout(() => renderGearTables(), 280);
    });
    let relDebounce = null;
    document.getElementById('search-box-relics')?.addEventListener('input', () => {
      clearTimeout(relDebounce);
      relDebounce = setTimeout(() => renderGearTables(), 280);
    });
  }

  function initTableKindTabs() {
    const nav = document.getElementById('table-kind-tabs');
    if (!nav || tableKindTabsBound) return;
    tableKindTabsBound = true;
    bindGearTableFilters();
    nav.querySelectorAll('.table-kind-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.tableKind;
        if (!kind) return;
        showTableKind(kind);
      });
    });
    showTableKind(readTableKind(), { skipRuneRender: true });
  }

  function onGearDataHydrated() {
    populateGearFilterSelects();
    if (readTableKind() !== 'runes') renderGearTables();
  }
