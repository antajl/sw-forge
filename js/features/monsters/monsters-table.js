// js/features/monsters/monsters-table.js — roster table view
  function monsterTableCellStars(u) {
    const n = u.meta && u.meta.natural_stars != null ? Number(u.meta.natural_stars) : Number(u.stars) || 0;
    if (!n) return '—';
    return '★'.repeat(Math.min(6, Math.max(0, n)));
  }

  function monsterTableCellTags(u) {
    const tags = (u.customTags || []).slice(0, 3);
    if (!tags.length) return '—';
    return tags.map((t) => escapeHtml(t)).join(', ');
  }

  function monsterTableCellMarks(u) {
    const bits = [];
    if (u.favorite) bits.push('★');
    if (u.food) bits.push('🍖');
    if (u.inStorage) bits.push('▣');
    else if (u.storageMark) bits.push('▣*');
    return bits.length ? bits.join(' ') : '—';
  }

  function buildMonsterTableHtml(visible, t) {
    const cols = [
      { id: 'name', label: t.monstersColName || 'Name' },
      { id: 'stars', label: t.monstersColStars || 'Stars' },
      { id: 'level', label: t.monstersColLevel || 'Lv' },
      { id: 'element', label: t.monstersColElement || 'Element' },
      { id: 'role', label: t.monstersColRole || 'Archetype' },
      { id: 'runes', label: t.monstersColRunes || 'Runes' },
      { id: 'skills', label: t.monstersColSkills || 'Skills' },
      { id: 'marks', label: t.monstersColMarks || 'Marks' },
      { id: 'tags', label: t.monstersColTags || 'Tags' },
    ];
    const head = cols
      .map((c) => `<th scope="col" data-col="${c.id}">${escapeHtml(c.label)}</th>`)
      .join('');
    const body = visible
      .map((u) => {
        const uid = escapeHtml(String(u.unitId));
        const bulkSel = monstersBulkSelected.has(String(u.unitId));
        const selected = String(u.unitId) === String(monstersSelectedUnitId);
        const rowCls = [
          bulkSel ? 'monsters-table__row--bulk-on' : '',
          selected ? 'monsters-table__row--selected' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const name = escapeHtml(u.displayName || `#${u.masterId}`);
        const runeTpl = t.monstersListRunesTpl || '{n}/6';
        const runes = escapeHtml(runeTpl.replace(/\{n\}/g, String(u.equippedCount || 0)));
        const skills =
          u.skillUpsNeeded > 0
            ? escapeHtml(String(u.skillUpsNeeded))
            : u.skillsMaxed
              ? '✓'
              : '—';
        return `<tr class="monsters-table__row${rowCls ? ` ${rowCls}` : ''}" data-unit-id="${uid}" tabindex="0">
          <td data-col="name"><span class="monsters-table__name">${name}</span></td>
          <td data-col="stars">${monsterTableCellStars(u)}</td>
          <td data-col="level">${u.level}</td>
          <td data-col="element">${escapeHtml(u.metaElement || '—')}</td>
          <td data-col="role">${escapeHtml(u.metaArchetype || '—')}</td>
          <td data-col="runes">${runes}</td>
          <td data-col="skills">${skills}</td>
          <td data-col="marks">${monsterTableCellMarks(u)}</td>
          <td data-col="tags">${monsterTableCellTags(u)}</td>
        </tr>`;
      })
      .join('');
    return `<div class="monsters-table-wrap"><table class="monsters-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function bindMonsterTableRows(grid, t) {
    if (!grid) return;
    grid.querySelectorAll('.monsters-table__row').forEach((row) => {
      const uid = row.getAttribute('data-unit-id');
      row.addEventListener('mouseenter', () => showMonsterDetailForCard(uid, row));
      row.addEventListener('mouseleave', scheduleMonstersDetailHide);
      row.addEventListener('focus', () => showMonsterDetailForCard(uid, row));
      row.addEventListener('blur', scheduleMonstersDetailHide);
      row.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof selectMonsterUnit === 'function') selectMonsterUnit(uid, row);
        const idx = monstersVisibleUnitIds.indexOf(String(uid));
        if (e.shiftKey && monstersBulkLastIndex >= 0 && idx >= 0) {
          const a = Math.min(monstersBulkLastIndex, idx);
          const b = Math.max(monstersBulkLastIndex, idx);
          for (let i = a; i <= b; i++) monstersBulkSelected.add(monstersVisibleUnitIds[i]);
        } else {
          toggleMonstersBulkSelect(uid);
          monstersBulkLastIndex = idx;
        }
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        grid.querySelectorAll('.monsters-table__row').forEach((tr) => {
          const id = tr.getAttribute('data-unit-id');
          tr.classList.toggle('monsters-table__row--bulk-on', monstersBulkSelected.has(String(id)));
          tr.classList.toggle(
            'monsters-table__row--selected',
            String(id) === String(monstersSelectedUnitId),
          );
        });
      });
    });
  }
