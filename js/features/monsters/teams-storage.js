// js/features/monsters/teams-storage.js — team sets & teams (v2)
  const TEAMS_STORAGE_KEY = 'swrm_teams_v2';
  const TEAMS_STORAGE_KEY_LEGACY = 'swrm_teams_v1';
  const TEAM_SIZE_MIN = 3;
  const TEAM_SIZE_MAX = 6;
  const TEAM_SIZE_DEFAULT = 5;

  let teamsStateCache = null;
  let teamsActiveSetId = null;
  let teamsShareViewPayload = null;

  function newTeamsId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultTeamsState() {
    return { version: 2, sets: [], teams: {} };
  }

  function clampTeamSize(n) {
    const v = Number(n);
    if (!Number.isFinite(v)) return TEAM_SIZE_DEFAULT;
    return Math.min(TEAM_SIZE_MAX, Math.max(TEAM_SIZE_MIN, Math.round(v)));
  }

  function normalizeTeamSlots(slots, size) {
    const n = clampTeamSize(size);
    const out = Array.from({ length: n }, (_, i) => {
      const v = slots && slots[i] != null ? Number(slots[i]) : null;
      return Number.isFinite(v) && v > 0 ? v : null;
    });
    return out;
  }

  function migrateLegacyState(parsed) {
    const state = defaultTeamsState();
    if (!parsed || typeof parsed !== 'object') return state;
    const teams = parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {};
    for (const [id, team] of Object.entries(teams)) {
      if (!team || typeof team !== 'object') continue;
      const size = clampTeamSize((team.slots || []).length || TEAM_SIZE_DEFAULT);
      state.teams[id] = {
        id,
        name: String(team.name || 'Team').trim() || 'Team',
        notes: '',
        tags: [],
        size,
        leaderUnitId:
          team.leaderUnitId != null && Number.isFinite(Number(team.leaderUnitId))
            ? Number(team.leaderUnitId)
            : null,
        slots: normalizeTeamSlots(team.slots, size),
        shareInProfile: !!team.shareInProfile,
      };
    }
    for (const set of parsed.sets || []) {
      if (!set || !set.id) continue;
      state.sets.push({
        id: set.id,
        name: String(set.name || 'Set').trim() || 'Set',
        collapsed: false,
        teamIds: Array.isArray(set.teamIds) ? set.teamIds.filter((tid) => state.teams[tid]) : [],
      });
    }
    return state;
  }

  function loadTeamsState() {
    if (teamsStateCache) return teamsStateCache;
    try {
      let raw = localStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) raw = localStorage.getItem(TEAMS_STORAGE_KEY_LEGACY);
      if (!raw) {
        teamsStateCache = defaultTeamsState();
        return teamsStateCache;
      }
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === 2) {
        teamsStateCache = {
          version: 2,
          sets: Array.isArray(parsed.sets) ? parsed.sets : [],
          teams: parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {},
        };
      } else {
        teamsStateCache = migrateLegacyState(parsed);
        saveTeamsState(teamsStateCache);
      }
    } catch (e) {
      teamsStateCache = defaultTeamsState();
    }
    return teamsStateCache;
  }

  function saveTeamsState(state) {
    teamsStateCache = state || defaultTeamsState();
    teamsStateCache.version = 2;
    try {
      localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teamsStateCache));
    } catch (e) {
      /* ignore quota */
    }
  }

  function createEmptyTeam(name, size) {
    const id = newTeamsId('team');
    const n = clampTeamSize(size);
    return {
      id,
      name: String(name || '').trim() || '',
      notes: '',
      tags: [],
      size: n,
      leaderUnitId: null,
      slots: normalizeTeamSlots([], n),
      shareInProfile: false,
    };
  }

  function createTeamSet(name) {
    const state = loadTeamsState();
    const setId = newTeamsId('set');
    const set = {
      id: setId,
      name: String(name || 'New set').trim() || 'New set',
      collapsed: false,
      teamIds: [],
    };
    state.sets.push(set);
    saveTeamsState(state);
    teamsActiveSetId = setId;
    return set;
  }

  function createTeamInSet(setId, name, size) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return null;
    const team = createEmptyTeam(name, size);
    state.teams[team.id] = team;
    set.teamIds.push(team.id);
    saveTeamsState(state);
    return team;
  }

  function deleteTeam(teamId) {
    const state = loadTeamsState();
    if (!state.teams[teamId]) return false;
    delete state.teams[teamId];
    for (const set of state.sets) {
      set.teamIds = (set.teamIds || []).filter((id) => id !== teamId);
    }
    saveTeamsState(state);
    return true;
  }

  function duplicateTeam(teamId) {
    const state = loadTeamsState();
    const src = state.teams[teamId];
    if (!src) return null;
    const set = state.sets.find((s) => (s.teamIds || []).includes(teamId));
    const copy = createEmptyTeam((src.name || 'Team') + ' (copy)', src.size);
    copy.notes = src.notes || '';
    copy.tags = [...(src.tags || [])];
    copy.leaderUnitId = src.leaderUnitId;
    copy.slots = normalizeTeamSlots(src.slots, src.size);
    copy.shareInProfile = false;
    state.teams[copy.id] = copy;
    if (set) {
      const idx = set.teamIds.indexOf(teamId);
      if (idx >= 0) set.teamIds.splice(idx + 1, 0, copy.id);
      else set.teamIds.push(copy.id);
    }
    saveTeamsState(state);
    return copy;
  }

  function reorderTeamsInSet(setId, teamIds) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    set.teamIds = teamIds.filter((id) => state.teams[id]);
    saveTeamsState(state);
  }

  function toggleSetCollapsed(setId) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return;
    set.collapsed = !set.collapsed;
    saveTeamsState(state);
  }

  function deleteTeamSet(setId) {
    const state = loadTeamsState();
    const set = state.sets.find((s) => s.id === setId);
    if (!set) return false;
    for (const tid of set.teamIds || []) {
      delete state.teams[tid];
    }
    state.sets = state.sets.filter((s) => s.id !== setId);
    saveTeamsState(state);
    if (teamsActiveSetId === setId) teamsActiveSetId = state.sets[0]?.id || null;
    return true;
  }

  function getTeamById(teamId) {
    const state = loadTeamsState();
    return teamId && state.teams[teamId] ? state.teams[teamId] : null;
  }

  function getTeamSetById(setId) {
    const state = loadTeamsState();
    return state.sets.find((s) => s.id === setId) || null;
  }

  function orderSlotsWithLeaderFirst(slots, leaderUnitId) {
    if (!Array.isArray(slots) || leaderUnitId == null) return slots;
    const leader = Number(leaderUnitId);
    if (!Number.isFinite(leader) || leader <= 0) return slots;
    const out = slots.map((s) => (s != null && s !== '' ? Number(s) : null));
    const idx = out.findIndex((s) => s === leader);
    if (idx <= 0) return out;
    const copy = [...out];
    copy.splice(idx, 1);
    copy.unshift(leader);
    return copy;
  }

  function updateTeam(teamId, patch) {
    const state = loadTeamsState();
    const team = state.teams[teamId];
    if (!team) return null;
    if (patch.name != null) team.name = String(patch.name).trim();
    if (patch.notes != null) team.notes = String(patch.notes).trim();
    if (patch.tags != null) team.tags = Array.isArray(patch.tags) ? patch.tags.map(String) : [];
    if (patch.size != null) {
      team.size = clampTeamSize(patch.size);
      team.slots = normalizeTeamSlots(team.slots, team.size);
    }
    if (patch.leaderUnitId !== undefined) {
      const lid = patch.leaderUnitId != null ? Number(patch.leaderUnitId) : null;
      team.leaderUnitId = Number.isFinite(lid) && lid > 0 ? lid : null;
    }
    if (patch.slots) team.slots = normalizeTeamSlots(patch.slots, team.size);
    if (team.leaderUnitId && team.slots) {
      team.slots = orderSlotsWithLeaderFirst(team.slots, team.leaderUnitId);
    }
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
    teamsStateCache = null;
    const state = loadTeamsState();
    const sets = [];
    for (const set of state.sets) {
      const teams = [];
      for (const tid of set.teamIds || []) {
        const team = state.teams[tid];
        if (!team || !team.shareInProfile) continue;
        teams.push({
          name: team.name,
          notes: team.notes,
          tags: team.tags,
          leader_unit_id: team.leaderUnitId,
          unit_ids: team.slots,
          master_ids: team.slots.map((uid) => {
            if (uid == null) return null;
            const u = (allUnits || []).find((x) => Number(x.unitId) === Number(uid));
            return u ? Number(u.masterId) : null;
          }),
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
