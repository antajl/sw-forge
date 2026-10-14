import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadTeamsState,
  saveTeamsState,
  createEmptyTeam,
  createTeamSet,
  getTeamById,
  getTeamSetById,
  getTeamsActiveSetId,
  setTeamsActiveSetId,
  type TeamsState,
} from '../src/features/teams/storage';

describe('Teams Storage Module', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads default empty state when localStorage is clean', () => {
    const state = loadTeamsState();
    expect(state).toBeDefined();
    expect(state.version).toBe(2);
    expect(Array.isArray(state.sets)).toBe(true);
    expect(typeof state.teams).toBe('object');
  });

  it('creates an empty team with clamped size between 3 and 6', () => {
    const team5 = createEmptyTeam('Guild Defense', 5);
    expect(team5.name).toBe('Guild Defense');
    expect(team5.size).toBe(5);
    expect(team5.slots.length).toBe(5);
    expect(team5.leaderUnitId).toBeNull();

    // Clamping min size = 3
    const teamMin = createEmptyTeam('Siege Offense', 1);
    expect(teamMin.size).toBe(3);
    expect(teamMin.slots.length).toBe(3);

    // Clamping max size = 6
    const teamMax = createEmptyTeam('Rift Raid', 10);
    expect(teamMax.size).toBe(6);
    expect(teamMax.slots.length).toBe(6);
  });

  it('creates a new team set and tracks active set id', () => {
    const set = createTeamSet('Siege Season 15');
    expect(set.name).toBe('Siege Season 15');
    expect(set.collapsed).toBe(false);
    expect(Array.isArray(set.teamIds)).toBe(true);
    expect(getTeamsActiveSetId()).toBe(set.id);

    const retrieved = getTeamSetById(set.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(set.id);
  });

  it('saves and reloads state across storage calls', () => {
    const customState: TeamsState = {
      version: 2,
      sets: [
        { id: 'set_1', name: 'Arena Offense', collapsed: false, teamIds: ['team_1'] }
      ],
      teams: {
        team_1: {
          id: 'team_1',
          name: 'Lushen Cleave',
          notes: 'Fast opener with Bastet',
          tags: ['arena', 'cleave'],
          size: 4,
          leaderUnitId: 101,
          slots: [101, 102, 103, 104],
          shareInProfile: true,
        }
      }
    };

    saveTeamsState(customState);
    const loaded = loadTeamsState();
    expect(loaded.sets.length).toBe(1);
    expect(loaded.sets[0].name).toBe('Arena Offense');

    const team = getTeamById('team_1');
    expect(team).not.toBeNull();
    expect(team?.name).toBe('Lushen Cleave');
    expect(team?.leaderUnitId).toBe(101);
    expect(team?.slots).toEqual([101, 102, 103, 104]);
  });

  it('manages active set selection', () => {
    setTeamsActiveSetId('custom_set_99');
    expect(getTeamsActiveSetId()).toBe('custom_set_99');
  });
});
