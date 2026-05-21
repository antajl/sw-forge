// js/features/gear/artifacts-table.js — artifact inventory table
  let filteredArtifacts = [];
  let artifactFilterGrade = '';
  let artifactFilterCategory = '';
  let artifactFilterLocation = '';

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

  function applyArtifactTableSearch() {
    const artQ = (document.getElementById('search-box-artifacts')?.value || '')
      .trim()
      .toLowerCase();
    const artSrc = (allArtifacts || []).filter(artifactPassesFilters);
    filteredArtifacts = !artQ
      ? artSrc.slice()
      : artSrc.filter((a) => gearSearchHay(a).includes(artQ));
  }

  function countActiveArtifactFilters() {
    let n = 0;
    if (artifactFilterGrade) n++;
    if (artifactFilterCategory) n++;
    if (artifactFilterLocation) n++;
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

  function bindArtifactTableFilters() {
    if (bindArtifactTableFilters._done) return;
    bindArtifactTableFilters._done = true;

    document.getElementById('btn-artifact-reset-filters')?.addEventListener('click', resetArtifactTableFilters);
    document.getElementById('artifact-filters-drawer-reset')?.addEventListener('click', resetArtifactTableFilters);

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

    let artDebounce = null;
    document.getElementById('search-box-artifacts')?.addEventListener('input', () => {
      clearTimeout(artDebounce);
      artDebounce = setTimeout(() => renderGearTables(), 280);
    });
  }
