// js/features/monsters/teams-ui.js — Teams tab scaffold
  let teamsUiBound = false;

  function teamUnitLabel(unitId) {
    const id = Number(unitId);
    if (!Number.isFinite(id) || id <= 0) return '—';
    const u =
      (monstersEnrichedCache || []).find((x) => x.unitId === id) ||
      (allUnits || []).find((x) => x.unitId === id);
    if (!u) return `#${id}`;
    return u.displayName || `#${u.masterId}`;
  }

  function buildTeamsUnitOptions(selectedId) {
    const units = monstersEnrichedCache.length
      ? monstersEnrichedCache
      : (allUnits || []).map((u) => ({
          unitId: u.unitId,
          displayName: `#${u.masterId}`,
          masterId: u.masterId,
        }));
    const opts = ['<option value="">—</option>'];
    for (const u of units) {
      const sel = Number(selectedId) === u.unitId ? ' selected' : '';
      opts.push(
        `<option value="${escapeHtml(String(u.unitId))}"${sel}>${escapeHtml(u.displayName || String(u.unitId))}</option>`,
      );
    }
    return opts.join('');
  }

  function renderTeamsSetList(state, t) {
    const list = document.getElementById('teams-set-list');
    if (!list) return;
    if (!state.sets.length) {
      list.innerHTML = `<li class="teams-set-list__empty">${escapeHtml(t.teamsNoSets || 'No team sets yet.')}</li>`;
      return;
    }
    const activeId = getTeamsActiveSetId();
    list.innerHTML = state.sets
      .map((set) => {
        const on = set.id === activeId;
        return `<li><button type="button" class="teams-set-list__btn${on ? ' is-active' : ''}" data-teams-set-id="${escapeHtml(set.id)}">${escapeHtml(set.name)}</button></li>`;
      })
      .join('');
  }

  function renderTeamsSlotRow(set, state, t) {
    const row = document.getElementById('teams-slot-row');
    if (!row || !set) {
      if (row) row.innerHTML = '';
      return;
    }
    const activeTeamId = getTeamsActiveTeamId();
    row.innerHTML = (set.teamIds || [])
      .map((tid, idx) => {
        const team = state.teams[tid];
        if (!team) return '';
        const on = tid === activeTeamId;
        const leader =
          team.leaderUnitId != null ? teamUnitLabel(team.leaderUnitId) : t.teamsNoLeader || 'No leader';
        const filled = (team.slots || []).filter((s) => s != null).length;
        return `<button type="button" class="teams-slot-card${on ? ' is-active' : ''}" data-teams-team-id="${escapeHtml(tid)}" aria-pressed="${on}">
          <span class="teams-slot-card__idx">${idx + 1}</span>
          <span class="teams-slot-card__name">${escapeHtml(team.name)}</span>
          <span class="teams-slot-card__meta">${escapeHtml(leader)} · ${filled}/${TEAM_SLOT_COUNT}</span>
          ${team.shareInProfile ? '<span class="teams-slot-card__share" title="Shared">⎘</span>' : ''}
        </button>`;
      })
      .join('');
  }

  function renderTeamsEditor(team, t) {
    const nameInput = document.getElementById('teams-team-name');
    const leaderSelect = document.getElementById('teams-leader-select');
    const slotsWrap = document.getElementById('teams-monster-slots');
    const shareCb = document.getElementById('teams-share-public');
    const saveBtn = document.getElementById('teams-save-team');
    if (!team) {
      if (nameInput) nameInput.value = '';
      if (leaderSelect) leaderSelect.innerHTML = '<option value="">—</option>';
      if (slotsWrap) slotsWrap.innerHTML = '';
      if (shareCb) shareCb.checked = false;
      if (saveBtn) saveBtn.disabled = true;
      return;
    }
    if (nameInput) nameInput.value = team.name || '';
    if (shareCb) shareCb.checked = !!team.shareInProfile;
    if (saveBtn) saveBtn.disabled = false;
    if (leaderSelect) {
      leaderSelect.innerHTML = buildTeamsUnitOptions(team.leaderUnitId);
    }
    if (slotsWrap) {
      slotsWrap.innerHTML = (team.slots || [])
        .map(
          (slotId, i) => `<label class="teams-slot-field">
            <span class="teams-slot-field__label">${escapeHtml((t.teamsSlotLabel || 'Slot {n}').replace('{n}', String(i + 1)))}</span>
            <select class="teams-slot-select" data-slot-idx="${i}">${buildTeamsUnitOptions(slotId)}</select>
          </label>`,
        )
        .join('');
    }
  }

  function renderTeamsPanel() {
    const shell = document.getElementById('teams-shell');
    if (!shell) return;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    const ro = typeof isShareReadOnly === 'function' && isShareReadOnly();
    const sharePayload = getTeamsShareViewPayload();
    const layout = shell.querySelector('.teams-layout');
    const shareView = document.getElementById('teams-share-view');

    if (ro && sharePayload && sharePayload.sets) {
      renderTeamsShareView(sharePayload, t);
      return;
    }

    if (layout) layout.hidden = false;
    if (shareView) shareView.hidden = true;

    const state = loadTeamsState();
    if (!state.sets.length) {
      createTeamSet(t.teamsDefaultSetName || 'Arena Offence');
    }
    const fresh = loadTeamsState();
    if (!getTeamsActiveSetId() && fresh.sets[0]) {
      setTeamsActiveSetId(fresh.sets[0].id);
      setTeamsActiveTeamId(fresh.sets[0].teamIds[0] || null);
    }
    const set = getTeamSetById(getTeamsActiveSetId()) || fresh.sets[0];
    if (set && !getTeamsActiveTeamId()) setTeamsActiveTeamId(set.teamIds[0] || null);

    const setNameInput = document.getElementById('teams-set-name');
    if (setNameInput && set) setNameInput.value = set.name;

    renderTeamsSetList(fresh, t);
    renderTeamsSlotRow(set, fresh, t);
    renderTeamsEditor(getTeamById(getTeamsActiveTeamId()), t);

    shell.querySelectorAll('[data-teams-readonly-hide]').forEach((el) => {
      el.hidden = ro;
    });
  }

  function renderTeamsShareView(payload, t) {
    const shell = document.getElementById('teams-shell');
    if (!shell) return;
    const layout = shell.querySelector('.teams-layout');
    if (layout) layout.hidden = true;
    let view = document.getElementById('teams-share-view');
    if (!view) {
      view = document.createElement('div');
      view.id = 'teams-share-view';
      view.className = 'teams-share-view-wrap';
      shell.appendChild(view);
    }
    view.hidden = false;
    const blocks = (payload.sets || [])
      .map((set) => {
        const teams = (set.teams || [])
          .map((team) => {
            const units = (team.unit_ids || [])
              .map((uid) => escapeHtml(teamUnitLabel(uid)))
              .join(', ');
            const leader =
              team.leader_unit_id != null
                ? escapeHtml(teamUnitLabel(team.leader_unit_id))
                : '—';
            return `<li class="teams-share-team"><strong>${escapeHtml(team.name || 'Team')}</strong> — ${escapeHtml(t.teamsLeader || 'Leader')}: ${leader}<br><span class="teams-share-team__units">${units || '—'}</span></li>`;
          })
          .join('');
        return `<section class="teams-share-set"><h4>${escapeHtml(set.name || 'Set')}</h4><ul>${teams}</ul></section>`;
      })
      .join('');
    view.innerHTML = `<div class="teams-share-view">
      <h3 class="teams-share-view__title">${escapeHtml(t.teamsShareViewTitle || 'Shared teams')}</h3>
      ${blocks || `<p>${escapeHtml(t.teamsShareViewEmpty || 'No public teams in this profile.')}</p>`}
    </div>`;
  }

  function bindTeamsUi() {
    if (teamsUiBound) return;
    teamsUiBound = true;

    document.getElementById('teams-add-set')?.addEventListener('click', () => {
      const t = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      const name = window.prompt(t.teamsNewSetPrompt || 'Set name', t.teamsDefaultSetName || 'New set');
      if (name == null) return;
      createTeamSet(name);
      renderTeamsPanel();
    });

    document.getElementById('teams-set-list')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-teams-set-id]');
      if (!btn) return;
      setTeamsActiveSetId(btn.dataset.teamsSetId);
      const set = getTeamSetById(getTeamsActiveSetId());
      setTeamsActiveTeamId(set && set.teamIds[0] ? set.teamIds[0] : null);
      renderTeamsPanel();
    });

    document.getElementById('teams-slot-row')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-teams-team-id]');
      if (!btn) return;
      setTeamsActiveTeamId(btn.dataset.teamsTeamId);
      renderTeamsPanel();
    });

    document.getElementById('teams-set-name')?.addEventListener('change', (e) => {
      const setId = getTeamsActiveSetId();
      if (!setId) return;
      renameTeamSet(setId, e.target.value);
      renderTeamsPanel();
    });

    document.getElementById('teams-save-team')?.addEventListener('click', () => {
      const teamId = getTeamsActiveTeamId();
      if (!teamId) return;
      const name = document.getElementById('teams-team-name')?.value;
      const leaderUnitId = document.getElementById('teams-leader-select')?.value;
      const shareInProfile = document.getElementById('teams-share-public')?.checked === true;
      const slots = [];
      document.querySelectorAll('#teams-monster-slots .teams-slot-select').forEach((sel) => {
        slots.push(sel.value ? Number(sel.value) : null);
      });
      updateTeam(teamId, {
        name,
        leaderUnitId: leaderUnitId ? Number(leaderUnitId) : null,
        slots,
        shareInProfile,
      });
      renderTeamsPanel();
    });
  }

  function initTeamsPanel() {
    bindTeamsUi();
    renderTeamsPanel();
  }
