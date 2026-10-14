// src/features/teams/ui.ts — Teams builder UI (simplified)
import { loadTeamsState, getTeamSetById, getTeamsActiveSetId, setTeamsActiveSetId, Team, TeamSet } from './storage';

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

function teamUnitLabel(unitId: number | null): string {
  if (!unitId) return `#${unitId}`;
  const u = (window.monstersEnrichedCache || []).find((x) => x.unitId === unitId);
  if (u) return u.displayName || `#${u.masterId}`;
  const u2 = (window.allUnits || []).find((x) => x.unitId === unitId);
  if (u2) return `#${u2.masterId}`;
  return `#${unitId}`;
}

function teamUnitDisplaySpeed(unitId: number | null, team: Team): number | null {
  if (!unitId || typeof window === 'undefined') return null;
  const swrm = (window as any).SWRM;
  if (!swrm) return null;
  const opts = {
    team,
    totemSpdPct: typeof swrm.getAccountTotemSpdPct === 'function' ? swrm.getAccountTotemSpdPct() : 15,
    leaderUnitId: team.leaderUnitId,
  };
  if (typeof swrm.computeUnitSpeedForTeam === 'function') {
    return Math.round(Number(swrm.computeUnitSpeedForTeam(unitId, opts)) || 0);
  }
  return null;
}

function buildTeamSlotIcons(team: Team): string {
  const slots = team.slots || [];
  const size = slots.length;
  const cells = slots
    .map((uid, i) => {
      const leader = team.leaderUnitId != null && Number(team.leaderUnitId) === Number(uid);
      const label = uid ? teamUnitLabel(uid) : '';
      const unitAttr = uid ? ` data-unit-id="${escapeHtml(String(uid))}"` : '';
      const aria = label ? ` aria-label="${escapeHtml(label)}"` : '';
      const spd = uid ? teamUnitDisplaySpeed(uid, team) : null;
      const spdBadge = spd ? `<span class="team-card__spd" title="Combat SPD">${spd}</span>` : '';
      const crownIcon = `<svg class="team-card__crown-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`;
      return `<div class="team-card__slot${leader ? ' team-card__slot--leader' : ''}" data-slot-idx="${i}"${unitAttr}${aria} tabindex="${uid ? '0' : '-1'}">
        ${leader ? `<span class="team-card__crown" aria-hidden="true">${crownIcon}</span>` : ''}
        ${uid ? `<span class="team-card__portrait-label">${escapeHtml(label)}</span>${spdBadge}` : '<span class="team-card__slot-empty">+</span>'}
      </div>`;
    })
    .join('');
  return `<div class="team-card__slots team-card__slots--n${size}">${cells}</div>`;
}

function buildTeamCardHtml(team: Team, t: Translation, opts?: { readOnly?: boolean; fromShare?: boolean }): string {
  const ro = !!(opts && opts.readOnly);
  const tags = (team.tags || [])
    .map((tag) => `<span class="team-card__tag">${escapeHtml(tag)}</span>`)
    .join('');
  const notes = team.notes
    ? `<p class="team-card__notes">${escapeHtml(team.notes)}</p>`
    : '';
  const name = team.name || (t as any).teamsUntitled || 'New Team';
  const publicBadge =
    team.shareInProfile || (ro && opts && opts.fromShare)
      ? `<span class="team-card__public" title="${escapeHtml((t as any).teamsSharePublic || 'Public in profile')}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></span>`
      : '';
  const actions = ro
    ? ''
    : `<div class="team-card__actions">
        <button type="button" class="team-card__action" data-team-action="edit" data-team-id="${escapeHtml(team.id)}">${escapeHtml((t as any).teamsEdit || 'Edit')}</button>
        <button type="button" class="team-card__action" data-team-action="duplicate" data-team-id="${escapeHtml(team.id)}">${escapeHtml((t as any).teamsDuplicate || 'Duplicate')}</button>
        <button type="button" class="team-card__action team-card__action--danger" data-team-action="delete" data-team-id="${escapeHtml(team.id)}">${escapeHtml((t as any).teamsDelete || 'Delete')}</button>
      </div>`;
  return `<article class="team-card${ro ? ' team-card--readonly' : ''}" data-teams-team-id="${escapeHtml(team.id)}"${ro ? '' : ' draggable="true"'}>
    <header class="team-card__head">
      <h4 class="team-card__title">${escapeHtml(name)}${publicBadge}</h4>
      ${actions}
    </header>
    ${buildTeamSlotIcons(team)}
    ${tags ? `<div class="team-card__tags">${tags}</div>` : ''}
    ${notes}
  </article>`;
}

function renderTeamsSetList(state: any, t: Translation): void {
  const list = document.getElementById('teams-set-list');
  if (!list) return;
  if (!state.sets.length) {
    list.innerHTML = `<li class="teams-set-list__empty">${escapeHtml((t as any).teamsNoSets || 'No team sets yet. Create one to get started.')}</li>`;
    return;
  }
  const activeId = getTeamsActiveSetId();
  list.innerHTML = state.sets
    .map((set: TeamSet) => {
      const on = set.id === activeId;
      const collapsed = !!set.collapsed;
      const count = (set.teamIds || []).length;
      const delTitle = escapeAttr((t as any).teamsDeleteSet || 'Delete set');
      return `<li class="teams-set-tree__item">
        <div class="teams-set-tree__row${on ? ' is-active' : ''}">
          <button type="button" class="teams-set-tree__toggle" data-teams-set-collapse="${escapeHtml(set.id)}" aria-expanded="${collapsed ? 'false' : 'true'}">${collapsed ? '▶' : '▼'}</button>
          <button type="button" class="teams-set-tree__btn" data-teams-set-id="${escapeHtml(set.id)}">
            <span class="teams-set-tree__name">${escapeHtml(set.name)}</span>
            <span class="teams-set-tree__count">${count}</span>
          </button>
          <button type="button" class="teams-set-tree__delete btn-ghost" data-teams-delete-set="${escapeHtml(set.id)}" title="${delTitle}" aria-label="${delTitle}" data-teams-readonly-hide>×</button>
        </div>
      </li>`;
    })
    .join('');
}

function renderTeamsCardGrid(set: TeamSet | null, state: any, t: Translation): void {
  const grid = document.getElementById('teams-card-grid');
  if (!grid) return;
  if (!set) {
    grid.innerHTML = `<p class="teams-main__empty">${escapeHtml((t as any).teamsPickSet || 'Select or create a team set.')}</p>`;
    return;
  }
  const teams = (set.teamIds || []).map((id) => state.teams[id]).filter(Boolean) as Team[];
  if (!teams.length) {
    grid.innerHTML = `<div class="teams-main__empty">
      <p>${escapeHtml((t as any).teamsNoTeams || 'No teams in this set yet.')}</p>
      <button type="button" class="btn-primary" id="teams-create-team-inline">${escapeHtml((t as any).teamsCreateTeam || '+ Create Team')}</button>
    </div>`;
    return;
  }
  grid.innerHTML = teams.map((team) => buildTeamCardHtml(team, t)).join('');
}

export function renderTeamsPanel(): void {
  const shell = document.getElementById('teams-shell');
  if (!shell) return;
  const t = (window.TRANSLATIONS?.en || {}) as Translation;
  const state = loadTeamsState();
  if (!getTeamsActiveSetId() && state.sets[0]) setTeamsActiveSetId(state.sets[0].id);
  const set = getTeamSetById(getTeamsActiveSetId() || '') || null;
  renderTeamsSetList(state, t);
  renderTeamsCardGrid(set, state, t);
}

export { teamUnitLabel };
