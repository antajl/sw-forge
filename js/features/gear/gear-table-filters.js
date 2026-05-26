// js/features/gear/gear-table-filters.js — shared More Filters helpers for artifact/relic tables

  const ARTIFACT_TYPE_KEYS = [
    { unitStyle: 1, category: 'HP' },
    { unitStyle: 2, category: 'Attack' },
    { unitStyle: 3, category: 'Defense' },
    { unitStyle: 4, category: 'Support' },
    { unitStyle: 98, category: 'Intangible' },
  ];
  const ARTIFACT_ATTRIBUTE_VALUES = ['Fire', 'Water', 'Wind', 'Light', 'Dark', 'Intangible'];

  function gearFilterAllLabel() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return t.tableFilterAll || t.filterAll || 'All';
  }

  function fillGearFilterSelect(sel, values, current) {
    if (!sel) return;
    const keep = current || sel.value || '';
    const all = gearFilterAllLabel();
    sel.innerHTML = '';
    const optAll = document.createElement('option');
    optAll.value = '';
    optAll.textContent = all;
    sel.appendChild(optAll);
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    }
    if (keep && [...sel.options].some((o) => o.value === keep)) sel.value = keep;
    else sel.value = '';
  }

  function artifactTypeOptionLabel(tloc, category) {
    const map = {
      HP: tloc.artifactTypeHP || 'HP',
      Attack: tloc.artifactTypeAttack || 'Attack',
      Defense: tloc.artifactTypeDefense || 'Defense',
      Support: tloc.artifactTypeSupport || 'Support',
      Intangible: tloc.artifactTypeIntangible || 'Intangible',
      98: tloc.artifactTypeIntangible || 'Intangible',
    };
    return map[category] || category;
  }

  function artifactAttributeOptionLabel(tloc, category) {
    const map = {
      Fire: tloc.artifactAttributeFire || tloc.artifactElementFire || 'Fire',
      Water: tloc.artifactAttributeWater || tloc.artifactElementWater || 'Water',
      Wind: tloc.artifactAttributeWind || tloc.artifactElementWind || 'Wind',
      Light: tloc.artifactAttributeLight || tloc.artifactElementLight || 'Light',
      Dark: tloc.artifactAttributeDark || tloc.artifactElementDark || 'Dark',
      Intangible: tloc.artifactAttributeIntangible || 'Intangible',
    };
    return map[category] || category;
  }

  function syncArtifactTypeAttributeSelectLabels() {
    const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const typeSel = document.getElementById('filter-artifact-type');
    const attrSel = document.getElementById('filter-artifact-attribute');
    if (typeSel) {
      for (const opt of typeSel.options) {
        if (!opt.value) {
          opt.textContent = gearFilterAllLabel();
          continue;
        }
        opt.textContent = artifactTypeOptionLabel(tloc, opt.value);
      }
    }
    if (attrSel) {
      for (const opt of attrSel.options) {
        if (!opt.value) {
          opt.textContent = gearFilterAllLabel();
          continue;
        }
        opt.textContent = artifactAttributeOptionLabel(tloc, opt.value);
      }
    }
  }

  function initArtifactTypeAttributeFilterOptions() {
    const typeSel = document.getElementById('filter-artifact-type');
    const attrSel = document.getElementById('filter-artifact-attribute');
    if (typeSel && !typeSel.dataset.staticOptions) {
      typeSel.dataset.staticOptions = '1';
      const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      typeSel.innerHTML = '';
      const o0 = document.createElement('option');
      o0.value = '';
      o0.textContent = gearFilterAllLabel();
      typeSel.appendChild(o0);
      for (const entry of ARTIFACT_TYPE_KEYS) {
        const o = document.createElement('option');
        o.value = entry.category;
        o.textContent = artifactTypeOptionLabel(tloc, entry.category);
        typeSel.appendChild(o);
      }
    }
    if (attrSel && !attrSel.dataset.staticOptions) {
      attrSel.dataset.staticOptions = '1';
      const tloc = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      attrSel.innerHTML = '';
      const o0 = document.createElement('option');
      o0.value = '';
      o0.textContent = gearFilterAllLabel();
      attrSel.appendChild(o0);
      for (const v of ARTIFACT_ATTRIBUTE_VALUES) {
        const o = document.createElement('option');
        o.value = v;
        o.textContent = artifactAttributeOptionLabel(tloc, v);
        attrSel.appendChild(o);
      }
    }
  }

  function updateGearFiltersButtonState(btnId, countElId, count) {
    const btn = document.getElementById(btnId);
    const countEl = document.getElementById(countElId);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const activeTpl = t.runeTableFiltersActive || '{n}';
    if (countEl) {
      countEl.textContent = count ? activeTpl.replace(/\{n\}/g, String(count)) : '';
      countEl.hidden = !count;
    }
    if (btn) btn.classList.toggle('monsters-toolbar-btn--filters-active', count > 0);
  }

  function renderGearFilterChips(chipDefs) {
    const row = document.getElementById('gear-table-active-filters');
    const host = document.getElementById('gear-table-filter-chips');
    const clearBtn = document.getElementById('gear-table-filter-chips-clear');
    if (!row || !host) return;
    const kind = typeof readTableKind === 'function' ? readTableKind() : 'runes';
    if (kind === 'runes' || (kind !== 'artifacts' && kind !== 'relics')) {
      row.hidden = true;
      host.innerHTML = '';
      if (clearBtn) clearBtn.hidden = true;
      return;
    }
    if (!chipDefs.length) {
      row.hidden = true;
      host.innerHTML = '';
      if (clearBtn) clearBtn.hidden = true;
      return;
    }
    row.hidden = false;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    host.innerHTML = chipDefs
      .map(
        (c) =>
          `<span class="monsters-filter-chip">${escapeHtml(c.label)}<button type="button" class="monsters-filter-chip__remove" data-gear-filter-chip-remove="${escapeHtml(c.key)}" aria-label="${escapeHtml(t.tableFilterChipRemove || 'Remove')}">✕</button></span>`,
      )
      .join('');
    if (clearBtn) {
      clearBtn.textContent = t.tableFilterClearAll || 'Clear all';
      clearBtn.hidden = false;
    }
  }

  function bindGearFilterChipsClear() {
    if (bindGearFilterChipsClear._done) return;
    bindGearFilterChipsClear._done = true;
    document.getElementById('gear-table-filter-chips')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-gear-filter-chip-remove]');
      if (!btn) return;
      const key = btn.getAttribute('data-gear-filter-chip-remove');
      if (typeof clearArtifactFilterChip === 'function') clearArtifactFilterChip(key);
      if (typeof clearRelicFilterChip === 'function') clearRelicFilterChip(key);
    });
    document.getElementById('gear-table-filter-chips-clear')?.addEventListener('click', () => {
      const kind = typeof readTableKind === 'function' ? readTableKind() : 'runes';
      if (kind === 'artifacts' && typeof resetArtifactTableFilters === 'function') {
        resetArtifactTableFilters();
      } else if (kind === 'relics' && typeof resetRelicTableFilters === 'function') {
        resetRelicTableFilters();
      }
    });
  }
