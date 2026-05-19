// js/features/monsters/monsters-list.js — list rendering
  async function renderMonstersPanel() {
    const grid = document.getElementById('monsters-grid');
    const emptyEl = document.getElementById('monsters-empty');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    if (!grid) return;

    monstersBulkSelected = readMonstersBulkSelected();
    syncMonstersBulkBar(t);

    if (monstersSelectedUnitId == null) {
      monstersSelectedUnitId = loadMonstersSelectedUnitId();
    }

    if (!allUnits.length) {
      const loaded = await ensureMonstersDataset();
      if (loaded && allUnits.length) {
        return renderMonstersPanel();
      }
      if (grid) grid.innerHTML = '';
      renderMonstersChips({ total: 0, anyRune: 0, fullSix: 0, skillUpsTotal: 0 }, t, false);
      renderMonstersEmptyState('no-data', t);
      hideMonstersDetailFloat();
      return;
    }

    const db = window.SWRM_MONSTER_DB;
    const skillDb = window.SWRM_SKILL_DB;
    if (db && typeof db.loadMonsterIndex === 'function') {
      try {
        await db.loadMonsterIndex();
        if (db.indexCount() === 0) await db.loadMonsterIndex({ force: true });
      } catch (e) { /* ignore */ }
    }
    if (skillDb && typeof skillDb.loadSkillIndex === 'function') {
      try {
        await skillDb.loadSkillIndex();
        if (skillDb.indexCount() === 0) await skillDb.loadSkillIndex({ force: true });
      } catch (e) { /* ignore */ }
    }

    const indexMissing =
      db && typeof db.indexCount === 'function' && db.isReady() && db.indexCount() === 0;
    const skillsIndexMissing =
      skillDb && typeof skillDb.indexCount === 'function' && skillDb.isReady() && skillDb.indexCount() === 0;

    const enriched = allUnits.map((u) => {
      const meta = db ? db.lookupMonster(u.masterId) : null;
      const tags = unitMetaFor(u.unitId);
      const skillPack = skillDb
        ? skillDb.enrichUnitSkills(u.skills)
        : { skills: [], skillUpsNeeded: 0, skillsMaxed: true, skillsKnown: false };
      return {
        ...u,
        meta,
        metaElement: meta && meta.element ? meta.element : '',
        displayName: db ? db.monsterDisplayName(u.masterId) : `#${u.masterId}`,
        imageFilename: meta && meta.image_filename ? meta.image_filename : '',
        bestiarySlug: meta && meta.bestiary_slug ? meta.bestiary_slug : '',
        favorite: tags.favorite,
        food: tags.food,
        storageMark: tags.storageMark,
        customTags: tags.tags,
        metaArchetype: normalizeArchetype(
          (meta && meta.archetype) ||
            (db && typeof db.monsterArchetype === 'function' ? db.monsterArchetype(u.masterId) : ''),
        ),
        skillRows: skillPack.skills,
        skillUpsNeeded: skillPack.skillUpsNeeded,
        skillsMaxed: skillPack.skillsMaxed,
        skillsKnown: skillPack.skillsKnown,
      };
    });
    monstersEnrichedCache = enriched;

    const filters = readMonstersFilters();
    const qInput = document.getElementById('monsters-filter-q');
    const elSelect = document.getElementById('monsters-filter-element');
    const locSelect = document.getElementById('monsters-filter-location');
    const sortSelect = document.getElementById('monsters-filter-sort');
    if (qInput && qInput.value !== filters.q) qInput.value = filters.q;
    if (elSelect && elSelect.value !== filters.element) elSelect.value = filters.element;
    if (locSelect && locSelect.value !== filters.location) locSelect.value = filters.location;
    if (sortSelect && sortSelect.value !== filters.sort) sortSelect.value = filters.sort;
    populateMonstersSetFilter();
    populateMonstersTagFilter();
    populateMonstersRoleFilter();
    const skillSel = document.getElementById('monsters-filter-skill');
    const runeSel = document.getElementById('monsters-filter-rune');
    const setSel = document.getElementById('monsters-filter-rune-set');
    const tagSel = document.getElementById('monsters-filter-tag');
    const roleSel = document.getElementById('monsters-filter-role');
    const markSel = document.getElementById('monsters-filter-mark');
    if (skillSel && skillSel.value !== (filters.skillFilter || '')) skillSel.value = filters.skillFilter || '';
    if (runeSel && runeSel.value !== (filters.runeFilter || '')) runeSel.value = filters.runeFilter || '';
    if (setSel && setSel.value !== (filters.runeSet || '')) setSel.value = filters.runeSet || '';
    if (tagSel && tagSel.value !== (filters.tagFilter || '')) tagSel.value = filters.tagFilter || '';
    if (roleSel && roleSel.value !== (filters.roleFilter || '')) roleSel.value = filters.roleFilter || '';
    if (markSel && markSel.value !== (filters.markFilter || '')) markSel.value = filters.markFilter || '';
    syncMonstersShowAllButton(!!filters.fullSixOnly, t);
    syncMonstersShowLevelButton(filters.minLevel36Only !== false, t);

    const view = readMonstersView();
    const filtered = filterMonstersList(enriched, filters);
    let visible;
    if (view === 'table') {
      visible = sortMonstersForTable(filtered);
    } else {
      visible = sortMonstersList(filtered, filters.sort);
    }
    monstersVisibleUnitIds = visible.map((u) => String(u.unitId));
    const sum = computeMonstersSummary(enriched);
    renderMonstersChips(sum, t, indexMissing, skillsIndexMissing);

    if (!visible.length) {
      grid.innerHTML = '';
      renderMonstersEmptyState('filtered', t);
      hideMonstersDetailFloat();
      return;
    }

    if (emptyEl) emptyEl.hidden = true;

    syncMonstersViewToggle(view);

    if (view === 'table') {
      grid.innerHTML = buildMonsterTableHtml(visible, t);
      bindMonsterTableRows(grid, t);
    } else if (view === 'cards') {
      grid.innerHTML = visible.map((u) => buildMonsterCardHtml(u, db, t, view)).join('');
      grid.querySelectorAll('.monsters-card__img[data-img-file]').forEach((img) => {
        const file = img.getAttribute('data-img-file');
        if (file) bindMonsterPortrait(img, file);
      });
    }

    grid.querySelectorAll('.monsters-card').forEach((card) => {
      const uid = card.getAttribute('data-unit-id');
      card.addEventListener('mouseenter', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, card);
      });
      card.addEventListener('mouseleave', scheduleMonstersDetailHide);
      card.addEventListener('focus', () => {
        if (monstersDetailPinnedUnitId) return;
        showMonsterDetailForCard(uid, card);
      });
      card.addEventListener('blur', scheduleMonstersDetailHide);
    });

    syncBulkCardStates(grid);

    if (monstersDetailPinnedUnitId) {
      const pu = enriched.find((x) => String(x.unitId) === String(monstersDetailPinnedUnitId));
      if (pu) renderMonstersDetail(pu, t, null);
    } else if (monstersDetailHoverUnitId) {
      const hoverCard = document.querySelector(
        `.monsters-card[data-unit-id="${String(monstersDetailHoverUnitId).replace(/"/g, '\\"')}"]`,
      );
      const hu = enriched.find((x) => String(x.unitId) === String(monstersDetailHoverUnitId));
      if (hu && hoverCard) renderMonstersDetail(hu, t, hoverCard);
    }
  }
