// js/features/monsters/teams-storage.js — local teams / sets persistence
  const TEAMS_STORAGE_KEY = 'swrm_teams_v1';
  const TEAM_SLOT_COUNT = 5;
  const SET_TEAM_COUNT = 5;

  let teamsStateCache = null;
  let teamsActiveSetId = null;
  let teamsActiveTeamId = null;
  let teamsShareViewPayload = null;

  function newTeamsId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultTeamsState() {
    return { version: 1, sets: [], teams: {} };
  }

  function normalizeTeamSlots(slots) {
    const out = Array.from({ length: TEAM_SLOT_COUNT }, (_, i) => {
      const v = slots && slots[i] != null ? Number(slots[i]) : null;
      return Number.isFinite(v) && v > 0 ? v : null;
    });
    return out;
  }

  function loadTeamsState() {
    if (teamsStateCache) return teamsStateCache;
    try {
      const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) {
        teamsStateCache = defaultTeamsState();
        return teamsStateCache;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') throw new Error('bad teams state');
      teamsStateCache = {
        version: 1,
        sets: Array.isArray(parsed.sets) ? parsed.sets : [],
        teams: parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {},
      };
    } catch (e) {
      teamsStateCache = defaultTeamsState();
    }
    return teamsStateCache;
  }

  function saveTeamsState(state) {
    teamsStateCache = state || defaultTeamsState();
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teamsStateCache));
    } catch (e) {
      /* ignore quota */
    }
  }

  function createEmptyTeam(name) {
    const id = newTeamsId('team');
    const team = {
      id,
      name: String(name || 'Team').trim() || 'Team',
      leaderUnitId: null,
      slots: normalizeTeamSlots([]),
      shareInProfile: false,
    };
    return team;
  }

  function createTeamSet(name) {
    const state = loadTeamsState();
    const setId = newTeamsId('set');
    const teamIds = [];
    for (let i = 0; i < SET_TEAM_COUNT; i++) {
      const team = createEmptyTeam(`Team ${i + 1}`);
      state.teams[team.id] = team;
      teamIds.push(team.id);
    }
    const set = { id: setId, name: String(name || 'New set').trim() || 'New set', teamIds };
    state.sets.push(set);
    saveTeamsState(state);
    teamsActiveSetId = setId;
    teamsActiveTeamId = teamIds[0] || null;
    return set;
  }

  function getTeamById(teamId) {
    const state = loadTeamsState();
    return teamId && state.teams[teamId] ? state.teams[teamId] : null;
  }

  function getTeamSetById(setId) {
    const state = loadTeamsState();
    return state.sets.find((s) => s.id === setId) || null;
  }

  function updateTeam(teamId, patch) {
    const state = loadTeamsState();
    const team = state.teams[teamId];
    if (!team) return null;
    if (patch.name != null) team.name = String(patch.name).trim() || team.name;
    if (patch.leaderUnitId !== undefined) {
      const lid = patch.leaderUnitId != null ? Number(patch.leaderUnitId) : null;
      team.leaderUnitId = Number.isFinite(lid) && lid > 0 ? lid : null;
    }
    if (patch.slots) team.slots = normalizeTeamSlots(patch.slots);
    if (patch.shareInProfile != null) team.shareInProfile = !!patch.shareInProfile;
    saveTeamsState(state);
    return team;
  }

  function renameTeamSet(setId, name) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return null;
    set.name = String(name || '').trim() || set.name;
    saveTeamsState(state);
    return set;
  }

  function exportTeamsForShare() {
    const state = loadTeamsState();
    const sets = [];
    for (const set of state.sets) {
      const teams = [];
      for (const tid of set.teamIds || []) {
        const team = state.teams[tid];
        if (!team || !team.shareInProfile) continue;
        teams.push({
          name: team.name,
          leader_unit_id: team.leaderUnitId,
          unit_ids: team.slots,
        });
      }
      if (teams.length) sets.push({ name: set.name, teams });
    }
    return sets.length ? { sets } : null;
  }

  function setTeamsShareViewPayload(payload) {
    teamsShareViewPayload = payload && payload.sets ? payload : null;
  }

  function getTeamsShareViewPayload() {
    return teamsShareViewPayload;
  }

  function getTeamsActiveSetId() {
    return teamsActiveSetId;
  }

  function setTeamsActiveSetId(id) {
    teamsActiveSetId = id;
  }

  function getTeamsActiveTeamId() {
    return teamsActiveTeamId;
  }

  function setTeamsActiveTeamId(id) {
    teamsActiveTeamId = id;
  }
