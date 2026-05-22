// js/features/gear/gear-roster-chips.js — summary chips above artifact / relic tables

  function renderGearSummaryChips(hostId, parts) {
    const host = document.getElementById(hostId);
    if (!host) return;
    if (!parts || !parts.length) {
      host.innerHTML = '';
      return;
    }
    host.innerHTML = parts
      .map(
        (p) =>
          `<span class="monsters-chip"><span class="monsters-chip__label">${escapeHtml(p.label)}</span><strong class="monsters-chip__value">${escapeHtml(String(p.value))}</strong></span>`,
      )
      .join('');
  }

  function computeArtifactTableSummary(list) {
    const items = list || [];
    let legend = 0;
    let hero = 0;
    let equipped = 0;
    let locked = 0;
    for (let i = 0; i < items.length; i++) {
      const a = items[i];
      if (a.gradeStr === 'Legend') legend += 1;
      else if (a.gradeStr === 'Hero') hero += 1;
      if (a.occupiedId != null && Number(a.occupiedId) !== 0) equipped += 1;
      if (a.locked) locked += 1;
    }
    return {
      total: items.length,
      legend,
      hero,
      equipped,
      inventory: items.length - equipped,
      locked,
    };
  }

  function computeRelicTableSummary(list) {
    const items = list || [];
    let legend = 0;
    let hero = 0;
    let equipped = 0;
    let maxLevel = 0;
    let fullDurability = 0;
    for (let i = 0; i < items.length; i++) {
      const r = items[i];
      if (r.gradeStr === 'Legend') legend += 1;
      else if (r.gradeStr === 'Hero') hero += 1;
      if (r.occupiedId != null && Number(r.occupiedId) !== 0) equipped += 1;
      if (Number(r.level) >= 15) maxLevel += 1;
      if (Number(r.durability) >= 3) fullDurability += 1;
    }
    return {
      total: items.length,
      legend,
      hero,
      equipped,
      inventory: items.length - equipped,
      maxLevel,
      fullDurability,
    };
  }

  function renderArtifactTableRosterChips() {
    const meta = document.getElementById('artifact-table-roster-meta');
    const pool = typeof filteredArtifacts !== 'undefined' ? filteredArtifacts : allArtifacts || [];
    if (meta) {
      meta.hidden = !pool.length;
    }
    if (!pool.length) {
      renderGearSummaryChips('artifact-table-roster-chips', []);
      return;
    }
    const sum = computeArtifactTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.artChipTotal || 'Artifacts', value: sum.total },
      { label: t.artChipLegend || 'Legend', value: sum.legend },
      { label: t.artChipHero || 'Hero', value: sum.hero },
      { label: t.artChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.artChipInventory || 'Inventory', value: sum.inventory },
    ];
    if (sum.locked > 0) {
      parts.push({ label: t.artChipLocked || 'Locked', value: sum.locked });
    }
    renderGearSummaryChips('artifact-table-roster-chips', parts);
  }

  function renderRelicTableRosterChips() {
    const meta = document.getElementById('relic-table-roster-meta');
    const pool = typeof filteredRelics !== 'undefined' ? filteredRelics : allRelics || [];
    if (meta) {
      meta.hidden = !pool.length;
    }
    if (!pool.length) {
      renderGearSummaryChips('relic-table-roster-chips', []);
      return;
    }
    const sum = computeRelicTableSummary(pool);
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const parts = [
      { label: t.relChipTotal || 'Relics', value: sum.total },
      { label: t.relChipEquipped || 'Equipped', value: sum.equipped },
      { label: t.relChipInventory || 'Inventory', value: sum.inventory },
      { label: t.relChipMaxLevel || 'Lvl 15', value: sum.maxLevel },
      { label: t.relChipFullDur || 'Full durability', value: sum.fullDurability },
    ];
    renderGearSummaryChips('relic-table-roster-chips', parts);
  }
