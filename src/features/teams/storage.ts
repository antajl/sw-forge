// src/features/teams/storage.ts — team sets & teams (simplified)
const TEAMS_STORAGE_KEY = 'swrm_teams_v2';
const TEAM_SIZE_MIN = 3;
const TEAM_SIZE_MAX = 6;
const TEAM_SIZE_DEFAULT = 5;

interface Team {
  id: string;
  name: string;
  notes: string;
  tags: string[];
  size: number;
  leaderUnitId: number | null;
  slots: (number | null)[];
  shareInProfile: boolean;
}

interface TeamSet {
  id: string;
  name: string;
  collapsed: boolean;
  teamIds: string[];
}

interface TeamsState {
  version: number;
  sets: TeamSet[];
  teams: Record<string, Team>;
}

let teamsStateCache: TeamsState | null = null;
let teamsActiveSetId: string | null = null;

function newTeamsId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultTeamsState(): TeamsState {
  return { version: 2, sets: [], teams: {} };
}

function clampTeamSize(n: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return TEAM_SIZE_DEFAULT;
  return Math.min(TEAM_SIZE_MAX, Math.max(TEAM_SIZE_MIN, Math.round(v)));
}

function normalizeTeamSlots(slots: (number | null)[], size: number): (number | null)[] {
  const n = clampTeamSize(size);
  const out = Array.from({ length: n }, (_, i) => {
    const v = slots && slots[i] != null ? Number(slots[i]) : null;
    return (v !== null && Number.isFinite(v) && v > 0) ? v : null;
  });
  return out;
}

function loadTeamsState(): TeamsState {
  if (teamsStateCache) return teamsStateCache;
  try {
    const raw = localStorage.getItem(TEAMS_STORAGE_KEY);
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
      teamsStateCache = defaultTeamsState();
    }
  } catch (e) {
    teamsStateCache = defaultTeamsState();
  }
  return teamsStateCache;
}

function saveTeamsState(state: TeamsState): void {
  teamsStateCache = state || defaultTeamsState();
  teamsStateCache.version = 2;
  try {
    localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(teamsStateCache));
  } catch (e) {
    // ignore quota
  }
}

function createEmptyTeam(name: string, size: number): Team {
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

function createTeamSet(name: string): TeamSet {
  const state = loadTeamsState();
  const setId = newTeamsId('set');
  const set: TeamSet = {
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

function getTeamById(teamId: string): Team | null {
  const state = loadTeamsState();
  return teamId && state.teams[teamId] ? state.teams[teamId] : null;
}

function getTeamSetById(setId: string): TeamSet | null {
  const state = loadTeamsState();
  return state.sets.find((s) => s.id === setId) || null;
}

function getTeamsActiveSetId(): string | null {
  return teamsActiveSetId;
}

function setTeamsActiveSetId(id: string): void {
  teamsActiveSetId = id;
}

export type { Team, TeamSet, TeamsState };
export { loadTeamsState, saveTeamsState, createEmptyTeam, createTeamSet, getTeamById, getTeamSetById, getTeamsActiveSetId, setTeamsActiveSetId };
