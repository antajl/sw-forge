// js/features/monsters/monsters-table.js — roster table view
  const MONSTERS_TABLE_COLS = [
    { id: 'bulk', labelKey: 'monstersColBulk', fallback: '', sortable: false },
    { id: 'name', labelKey: 'monstersColName', fallback: 'Name', sortable: true },
    { id: 'stars', labelKey: 'monstersColStars', fallback: 'Stars', sortable: true },
    { id: 'level', labelKey: 'monstersColLevel', fallback: 'Lv', sortable: true },
    { id: 'element', labelKey: 'monstersColElement', fallback: 'Element', sortable: true },
    { id: 'role', labelKey: 'monstersColRole', fallback: 'Archetype', sortable: true },
    { id: 'runes', labelKey: 'monstersColRunes', fallback: 'Runes', sortable: true },
    { id: 'skills', labelKey: 'monstersColDevilmons', fallback: 'Devilmons', sortable: true },
    { id: 'marks', labelKey: 'monstersColMarks', fallback: 'Marks', sortable: true },
    { id: 'tags', labelKey: 'monstersColTags', fallback: 'Tags', sortable: true },
  ];

  function monsterTableCellStars(u) {
    return buildMonsterStarsBadge(u, 'table');
  }

  function monsterTableCellTags(u) {
    const tags = (u.customTags || []).slice(0, 3);
    if (!tags.length) return '—';
    return tags.map((tag) => escapeHtml(tag)).join(', ');
  }

  function monsterTableCellMarks(u) {
    const bits = [];
    if (u.favorite) bits.push('★');
    if (u.food) bits.push('🍖');
    if (u.inStorage) bits.push('▣');
    else if (u.storageMark) bits.push('▣*');
    return bits.length ? bits.join(' ') : '—';
  }

  function monsterTableThumbHtml(u) {
    if (!u.imageFilename) return '';
    return `<img class="monsters-table__thumb" alt="" width="32" height="32" data-img-file="${escapeHtml(u.imageFilename)}" loading="lazy" decoding="async" />`;
  }

  function monsterTableElementCell(u) {
    const db = window.SWRM_MONSTER_DB;
    const url = db && typeof db.elementIconUrl === 'function' ? db.elementIconUrl(u.metaElement) : '';
    if (url) {
      return `<img class="monsters-table__element-img" src="${escapeHtml(url)}" alt="${escapeHtml(u.metaElement || '')}" width="20" height="20" loading="lazy" decoding="async" referrerpolicy="no-referrer" />`;
    }
    return escapeHtml(u.metaElement || '—');
  }

  function tableSortIconFor(colId) {
    if (!monstersTableSort || monstersTableSort.col !== colId) {
      return '<span class="monsters-table__sort-icon" aria-hidden="true">↕</span>';
    }
    const arrow = monstersTableSort.dir === 'asc' ? '▲' : '▼';
    return `<span class="monsters-table__sort-icon" aria-hidden="true">${arrow}</span>`;
  }

  function buildMonsterTableHeadHtml(t) {
    return MONSTERS_TABLE_COLS.map((c) => {
      if (c.id === 'bulk') {
        const allLbl = escapeHtml(t.monstersTableSelectAll || 'Select all visible');
        const oneLbl = escapeHtml(t.monstersBulkSelectOne || 'Select');
        return `<th scope="col" class="monsters-table__th monsters-table__th--bulk" data-col="bulk">
          <span class="monsters-table__bulk-th-inner">
            <input type="checkbox" id="monsters-table-select-all" class="monsters-table__bulk-cb monsters-table__bulk-cb--all" title="${allLbl}" aria-label="${allLbl}" />
            <span class="sr-only">${oneLbl}</span>
          </span>
        </th>`;
      }
      const label = t[c.labelKey] || c.fallback;
      const sorted = monstersTableSort && monstersTableSort.col === c.id;
      const cls = [
        'monsters-table__th--sortable',
        sorted ? 'monsters-table__th--sorted' : '',
      ]
        .filter(Boolean)
        .join(' ');
      const ariaSort = sorted ? (monstersTableSort.dir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th scope="col" class="${cls}" data-col="${c.id}" data-sort-col="${c.id}" aria-sort="${ariaSort}"><span class="monsters-table__th-inner">${escapeHtml(label)}${tableSortIconFor(c.id)}</span></th>`;
    }).join('');
  }

  function compareMonstersTableRows(a, b, col, dir) {
    const mul = dir === 'asc' ? 1 : -1;
    switch (col) {
      case 'stars':
        return mul * (monsterUnitRankStars(a) - monsterUnitRankStars(b)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      case 'level':
        return mul * ((Number(a.level) || 0) - (Number(b.level) || 0)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      case 'element': {
        const elIdx = (el) => {
          const i = ELEMENT_ORDER.indexOf(el);
          return i === -1 ? 99 : i;
        };
        return (
          mul * (elIdx(a.metaElement) - elIdx(b.metaElement)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      }
      case 'role':
        return (
          mul * String(a.metaArchetype || '').localeCompare(String(b.metaArchetype || '')) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'runes':
        return (
          mul * ((Number(a.equippedCount) || 0) - (Number(b.equippedCount) || 0)) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'skills': {
        const sa = Number(a.skillUpsNeeded) || 0;
        const sb = Number(b.skillUpsNeeded) || 0;
        return mul * (sa - sb) || mul * String(a.displayName).localeCompare(String(b.displayName));
      }
      case 'marks': {
        const score = (u) =>
          (u.favorite ? 4 : 0) + (u.food ? 2 : 0) + (u.inStorage || u.storageMark ? 1 : 0);
        return mul * (score(a) - score(b)) || mul * String(a.displayName).localeCompare(String(b.displayName));
      }
      case 'tags':
        return (
          mul * String((a.customTags || []).join(',')).localeCompare(String((b.customTags || []).join(','))) ||
          mul * String(a.displayName).localeCompare(String(b.displayName))
        );
      case 'bulk':
        return 0;
      case 'name':
      default:
        return mul * String(a.displayName || '').localeCompare(String(b.displayName || ''));
    }
  }

  function sortMonstersForTable(units) {
    if (!monstersTableSort) {
      return sortMonstersList(units, 'level-desc');
    }
    const list = units.slice();
    list.sort((a, b) => compareMonstersTableRows(a, b, monstersTableSort.col, monstersTableSort.dir));
    return list;
  }

  function cycleMonstersTableSort(col) {
    if (!monstersTableSort || monstersTableSort.col !== col) {
      monstersTableSort = { col, dir: 'desc' };
    } else {
      monstersTableSort.dir = monstersTableSort.dir === 'desc' ? 'asc' : 'desc';
    }
  }

  function buildMonsterTableHtml(visible, t) {
    const head = buildMonsterTableHeadHtml(t);
    const body = visible
      .map((u) => {
        const uid = escapeHtml(String(u.unitId));
        const bulkSel = monstersBulkSelected.has(String(u.unitId));
        const pinned =
          monstersDetailPinnedUnitId != null &&
          String(monstersDetailPinnedUnitId) === String(u.unitId);
        const hover =
          !pinned &&
          monstersDetailHoverUnitId != null &&
          String(monstersDetailHoverUnitId) === String(u.unitId);
        const elCls = elementClass(u.metaElement);
        const rowCls = [
          bulkSel ? 'monsters-table__row--bulk-on' : '',
          pinned ? 'monsters-table__row--pinned' : '',
          hover ? 'monsters-table__row--hover' : '',
          elCls ? `monsters-table__row--${elCls}` : '',
        ]
          .filter(Boolean)
          .join(' ');
        const q = monstersSearchHighlight || '';
        const name = highlightMonstersSearchInPlain(u.displayName || `#${u.masterId}`, q);
        const runeTpl = t.monstersListRunesTpl || '{n}/6';
        const runes = highlightMonstersSearchInPlain(
          runeTpl.replace(/\{n\}/g, String(u.equippedCount || 0)),
          q,
        );
        const skills =
          u.skillUpsNeeded > 0
            ? `<span class="monsters-table__devils" title="${escapeHtml((t.monstersSkillDeficitTip || '{n} to max').replace(/\{n\}/g, String(u.skillUpsNeeded)))}">${devilmonIconHtml('monsters-table__devil-icon')}<span class="monsters-table__devil-n">${escapeHtml(String(u.skillUpsNeeded))}</span></span>`
            : u.skillsMaxed
              ? '✓'
              : '—';
        const storageBadge = u.inStorage
          ? `<span class="monsters-table__storage-badge">${escapeHtml(t.monstersStorageBadge || 'Storage')}</span>`
          : '';
        return `<tr class="monsters-table__row${rowCls ? ` ${rowCls}` : ''}" data-unit-id="${uid}" tabindex="0">
          <td data-col="bulk" class="monsters-table__td-bulk"><input type="checkbox" class="monsters-table__bulk-cb" data-unit-id="${uid}" ${bulkSel ? 'checked' : ''} aria-label="${escapeHtml(t.monstersBulkSelectOne || 'Select')}" /></td>
          <td data-col="name"><div class="monsters-table__name-cell">${monsterTableThumbHtml(u)}<span class="monsters-table__name">${name}</span>${storageBadge}</div></td>
          <td data-col="stars">${monsterTableCellStars(u)}</td>
          <td data-col="level">${highlightMonstersSearchInPlain(String(u.level), q)}</td>
          <td data-col="element">${monsterTableElementCell(u)}</td>
          <td data-col="role">${highlightMonstersSearchInPlain(u.metaArchetype || '—', q)}</td>
          <td data-col="runes">${runes}</td>
          <td data-col="skills">${skills}</td>
          <td data-col="marks">${monsterTableCellMarks(u)}</td>
          <td data-col="tags">${monsterTableCellTags(u)}</td>
        </tr>`;
      })
      .join('');
    return `<div class="monsters-table-wrap"><table class="monsters-table swrm-table-zebra"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function bindMonsterTableHeaderSort(grid) {
    if (!grid) return;
    grid.querySelectorAll('th[data-sort-col]').forEach((th) => {
      th.addEventListener('click', (e) => {
        e.preventDefault();
        const col = th.getAttribute('data-sort-col');
        if (!col) return;
        cycleMonstersTableSort(col);
        renderMonstersPanel();
      });
    });
  }

  function bindMonsterTableRows(grid, t) {
    if (!grid) return;
    bindMonsterTableHeaderSort(grid);
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    grid.querySelectorAll('.monsters-table__thumb[data-img-file]').forEach((img) => {
      const file = img.getAttribute('data-img-file');
      if (file) bindMonsterPortrait(img, file);
    });
    grid.querySelectorAll('.monsters-table__row').forEach((row) => {
      const uid = row.getAttribute('data-unit-id');
      row.addEventListener('mouseenter', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, row);
      });
      row.addEventListener('mouseleave', scheduleMonstersDetailHide);
      row.addEventListener('focus', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, row);
      });
      row.addEventListener('blur', scheduleMonstersDetailHide);
      row.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (e.target.closest('.monsters-table__td-bulk') || e.target.classList.contains('monsters-table__bulk-cb')) {
          return;
        }
        e.preventDefault();
        pinMonsterDetail(uid, row);
        if (!ro) {
          const idx = monstersVisibleUnitIds.indexOf(String(uid));
          if (e.shiftKey && monstersBulkLastIndex >= 0 && idx >= 0) {
            const a = Math.min(monstersBulkLastIndex, idx);
            const b = Math.max(monstersBulkLastIndex, idx);
            for (let i = a; i <= b; i++) monstersBulkSelected.add(monstersVisibleUnitIds[i]);
          } else if (e.ctrlKey || e.metaKey) {
            toggleMonstersBulkSelect(uid);
            monstersBulkLastIndex = idx;
          }
          writeMonstersBulkSelected(monstersBulkSelected);
          syncMonstersBulkBar(t);
          syncBulkCardStates(grid);
        }
      });
      row.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        pinMonsterDetail(uid, row);
      });
    });

    const syncSelectAllState = () => {
      if (typeof syncMonstersSelectAllState === 'function') syncMonstersSelectAllState();
    };

    grid.querySelectorAll('.monsters-table__bulk-cb:not(.monsters-table__bulk-cb--all)').forEach((cb) => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = cb.getAttribute('data-unit-id');
        if (!id) return;
        const on = cb.checked;
        if (on) monstersBulkSelected.add(String(id));
        else monstersBulkSelected.delete(String(id));
        monstersBulkLastIndex = monstersVisibleUnitIds.indexOf(String(id));
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        syncSelectAllState();
      });
    });

    const selAll = document.getElementById('monsters-table-select-all');
    if (selAll && !ro) {
      selAll.addEventListener('click', (e) => e.stopPropagation());
      selAll.addEventListener('change', () => {
        const on = selAll.checked;
        for (const id of monstersVisibleUnitIds) {
          if (on) monstersBulkSelected.add(id);
          else monstersBulkSelected.delete(id);
        }
        writeMonstersBulkSelected(monstersBulkSelected);
        syncMonstersBulkBar(t);
        syncBulkCardStates(grid);
        syncSelectAllState();
      });
      syncSelectAllState();
    }
  }
