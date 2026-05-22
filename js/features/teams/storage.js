// js/features/teams/storage.js — team sets & teams (v2)
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

  function exportTeamsStateJson() {
    teamsStateCache = null;
    const state = loadTeamsState();
    return JSON.stringify(state, null, 2);
  }

  function importTeamsStateFromJson(text, merge) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      return { ok: false, error: 'invalid_json' };
    }
    let incoming = defaultTeamsState();
    if (parsed && parsed.version === 2) {
      incoming = {
        version: 2,
        sets: Array.isArray(parsed.sets) ? parsed.sets : [],
        teams: parsed.teams && typeof parsed.teams === 'object' ? parsed.teams : {},
      };
    } else {
      incoming = migrateLegacyState(parsed);
    }
    if (merge) {
      const cur = loadTeamsState();
      const teamIdMap = {};
      for (const [oldId, team] of Object.entries(incoming.teams)) {
        const copy = { ...team, id: newTeamsId('team') };
        teamIdMap[oldId] = copy.id;
        cur.teams[copy.id] = copy;
      }
      for (const set of incoming.sets) {
        const newSetId = newTeamsId('set');
        cur.sets.push({
          id: newSetId,
          name: set.name || 'Imported set',
          collapsed: !!set.collapsed,
          teamIds: (set.teamIds || []).map((tid) => teamIdMap[tid]).filter(Boolean),
        });
      }
      saveTeamsState(cur);
    } else {
      saveTeamsState(incoming);
      teamsActiveSetId = incoming.sets[0]?.id || null;
    }
    teamsStateCache = null;
    return { ok: true };
  }

  const DEMO_TEAMS_SEED_VERSION = 3;
  const DEMO_TEAMS_SEED_KEY = 'swrm_demo_teams_seed_v';

  function isDemoTeamSetName(name) {
    return /^demo[\s·:]/i.test(String(name || '').trim());
  }

  /** Remove all demo sample team sets after user loads their own SWEX. */
  function removeDemoTeams() {
    const state = loadTeamsState();
    const demoSetIds = state.sets.filter((s) => isDemoTeamSetName(s.name)).map((s) => s.id);
    if (!demoSetIds.length) return false;
    const teamIds = new Set();
    for (const sid of demoSetIds) {
      const set = state.sets.find((x) => x.id === sid);
      (set?.teamIds || []).forEach((tid) => teamIds.add(tid));
    }
    state.sets = state.sets.filter((s) => !demoSetIds.includes(s.id));
    for (const tid of teamIds) delete state.teams[tid];
    saveTeamsState(state);
    teamsStateCache = null;
    try {
      localStorage.removeItem(DEMO_TEAMS_SEED_KEY);
    } catch (e) { /* ignore */ }
    return true;
  }

  function clearDemoTeamSets() {
    return removeDemoTeams();
  }

  function shouldKeepDemoTeamSets() {
    if (typeof userHasLoadedRealExport === 'function' && userHasLoadedRealExport()) return false;
    return typeof isUsingDemoDataset === 'function' && isUsingDemoDataset();
  }

  /** Demo team sets only while demo dataset is active; remove when user loads real SWEX. */
  function syncDemoTeamsWithDatasetMode() {
    teamsStateCache = null;
    if (shouldKeepDemoTeamSets()) {
      if (typeof seedDemoTeamsIfEmpty === 'function') seedDemoTeamsIfEmpty();
    } else {
      removeDemoTeams();
    }
  }

  function readDemoTeamsSeedVersion() {
    try {
      return Number(localStorage.getItem(DEMO_TEAMS_SEED_KEY)) || 0;
    } catch (e) {
      return 0;
    }
  }

  function writeDemoTeamsSeedVersion(v) {
    try {
      localStorage.setItem(DEMO_TEAMS_SEED_KEY, String(v));
    } catch (e) { /* ignore */ }
  }

  /**
   * User-provided demo lineups (unit_id from data/demo.json, main roster only).
   * Skipped: comps needing storage-only units (Zinc, Dias, Hwa, Lisa, Rakan) or near-duplicates.
   */
  const DEMO_TEAMS_LAYOUT = [
    {
      setName: 'Demo · B12',
      teams: [
        {
          name: 'GB12',
          size: 5,
          leader: 35976386571,
          slots: [27144694306, 35976386571, 5365490176, 31564033638, 8025980618],
          tags: ['Demo', 'GB12'],
        },
        {
          name: 'DB12',
          size: 5,
          leader: 12072006659,
          slots: [12072006659, 27244867420, 27244858404, 5365490176, 30376382096],
          tags: ['Demo', 'DB12'],
        },
        {
          name: 'NB12',
          size: 5,
          leader: 13559060898,
          slots: [13559060898, 15339861886, 30376925404, 26928924951, 26928923162],
          tags: ['Demo', 'NB12'],
        },
        {
          name: 'SRB12',
          size: 5,
          leader: 7637619578,
          slots: [12072006659, 26915472290, 15339861886, 26928924951, 7637619578],
          tags: ['Demo', 'SRB12'],
        },
        {
          name: 'PCB12',
          size: 5,
          leader: 7637619578,
          slots: [13578469034, 19588712314, 15339861886, 26928924951, 7637619578],
          tags: ['Demo', 'PCB12'],
        },
      ],
    },
    {
      setName: 'Demo · Essence',
      teams: [
        {
          name: 'Magic Ess',
          size: 5,
          leader: 8838130354,
          slots: [8838130354, 11050945835, 8611226449, 26928923162, 16139462679],
          tags: ['Demo', 'Ess'],
        },
        {
          name: 'Fire Ess',
          size: 5,
          leader: 16410692026,
          slots: [19588712314, 15339861886, 26928924951, 16410692026, 15370507039],
          tags: ['Demo', 'Ess'],
        },
        {
          name: 'Water Ess',
          size: 5,
          leader: 8838130354,
          slots: [11130827981, 15363394957, 8838130354, 8261783479, 16139462679],
          tags: ['Demo', 'Ess'],
        },
        {
          name: 'Light Ess',
          size: 5,
          leader: 5096889290,
          slots: [8838130354, 11050945835, 8611226449, 27398455635, 5096889290],
          tags: ['Demo', 'Ess'],
        },
      ],
    },
    {
      setName: 'Demo · Rift',
      teams: [
        {
          name: 'Rift R5 — Loren',
          size: 6,
          leader: 11130827981,
          slots: [19588712314, 27064855468, 5365490176, 26915472290, 11130827981, 8600073708],
          tags: ['Demo', 'Rift'],
        },
        {
          name: 'Rift R5 — Bastet',
          size: 6,
          leader: 8151537453,
          slots: [8151537453, 6489936246, 16410692026, 26961999021, 26881992509, 13578469034],
          tags: ['Demo', 'Rift'],
        },
      ],
    },
    {
      setName: 'Demo · Beasts',
      teams: [
        {
          name: 'Fire Beast',
          size: 6,
          leader: 13578469034,
          slots: [8600073708, 12477086251, 15394260876, 26881992509, 15370507039, 13578469034],
          tags: ['Demo', 'Beast'],
        },
      ],
    },
    {
      setName: 'Demo · Arena',
      teams: [
        {
          name: 'AO — Seara',
          size: 4,
          leader: 8524048104,
          slots: [9489707897, 8151537453, 5630889580, 8524048104],
          tags: ['Demo', 'AO'],
          shareInProfile: true,
        },
        {
          name: 'AO — Trinity',
          size: 4,
          leader: 30419927866,
          slots: [9489707897, 6946053164, 30419927866, 6608483306],
          tags: ['Demo', 'AO'],
          shareInProfile: true,
        },
        {
          name: 'AO — Zaiross',
          size: 4,
          leader: 6608483306,
          slots: [9489707897, 6946053164, 26882030840, 6608483306],
          tags: ['Demo', 'AO'],
          shareInProfile: true,
        },
        {
          name: 'AD',
          size: 4,
          leader: 6076074940,
          slots: [15661874898, 28035029184, 4667273474, 6076074940],
          tags: ['Demo', 'AD'],
          shareInProfile: true,
        },
      ],
    },
    {
      setName: 'Demo · GvG',
      teams: [
        {
          name: 'GD — Seara',
          size: 3,
          leader: 8524048104,
          slots: [5612043734, 8524048104, 5096889290],
          tags: ['Demo', 'GD'],
        },
        {
          name: 'GD — Galleon',
          size: 3,
          leader: 6946053164,
          slots: [9489707897, 6946053164, 6608483306],
          tags: ['Demo', 'GD'],
        },
        {
          name: 'GD — Martina',
          size: 3,
          leader: 27658693773,
          slots: [12072006659, 27658693773, 13633460962],
          tags: ['Demo', 'GD'],
        },
        {
          name: 'GD — Khmun',
          size: 3,
          leader: 9041774297,
          slots: [16399615784, 15335072189, 9041774297],
          tags: ['Demo', 'GD'],
        },
      ],
    },
    {
      setName: 'Demo · Dimension',
      teams: [
        {
          name: 'Dim R5 1',
          size: 5,
          leader: 30376382096,
          slots: [30376382096, 6946053164, 27244858404, 5365490176, 5404037534],
          tags: ['Demo', 'Dim'],
        },
        {
          name: 'Dim R5 3',
          size: 5,
          leader: 6115665171,
          slots: [6115665171, 13578469034, 26992216401, 27064855468, 27398455635],
          tags: ['Demo', 'Dim'],
        },
      ],
    },
  ];

  function rosterHasDemoUnits(slotIds) {
    const need = slotIds.filter((id) => id != null && Number(id) > 0);
    if (!need.length) return false;
    const have = new Set((allUnits || []).map((u) => Number(u.unitId)));
    return need.every((id) => have.has(Number(id)));
  }

  function seedDemoTeamInSet(setId, spec) {
    const size = clampTeamSize(spec.size || (spec.slots && spec.slots.length) || TEAM_SIZE_DEFAULT);
    const slots = normalizeTeamSlots(spec.slots, size);
    if (!rosterHasDemoUnits(slots)) return false;
    const team = createTeamInSet(setId, spec.name, size);
    if (!team) return false;
    const leader = spec.leader != null ? Number(spec.leader) : null;
    const leaderInSlots = slots.some((id) => Number(id) === leader);
    updateTeam(team.id, {
      slots,
      size,
      leaderUnitId:
        Number.isFinite(leader) && leader > 0 && leaderInSlots
          ? leader
          : slots.find((id) => id != null) || null,
      shareInProfile: spec.shareInProfile !== false,
      tags: spec.tags || ['Demo'],
      notes: spec.notes || '',
    });
    return true;
  }

  /** Sample teams for demo mode (curated sets; re-seeds when layout version bumps). */
  function seedDemoTeamsIfEmpty() {
    if (!shouldKeepDemoTeamSets()) return false;
    if (!allUnits || allUnits.length < 3) return false;

    const state = loadTeamsState();
    const seededVer = readDemoTeamsSeedVersion();
    const hasCurrentDemo =
      seededVer >= DEMO_TEAMS_SEED_VERSION &&
      state.sets.some((s) => isDemoTeamSetName(s.name));
    if (hasCurrentDemo) return false;

    const hasUserSets = state.sets.some((s) => !isDemoTeamSetName(s.name));
    if (hasUserSets) return false;

    clearDemoTeamSets();

    let created = 0;
    for (const block of DEMO_TEAMS_LAYOUT) {
      const set = createTeamSet(block.setName);
      if (!set) continue;
      for (const spec of block.teams) {
        if (seedDemoTeamInSet(set.id, spec)) created += 1;
      }
    }
    if (created > 0) {
      writeDemoTeamsSeedVersion(DEMO_TEAMS_SEED_VERSION);
      teamsStateCache = null;
    }
    return created > 0;
  }

  window.SWRM = window.SWRM || {};
  window.SWRM.syncDemoTeamsWithDatasetMode = syncDemoTeamsWithDatasetMode;
  window.SWRM.removeDemoTeams = removeDemoTeams;
