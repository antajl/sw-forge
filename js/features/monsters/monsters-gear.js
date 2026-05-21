// js/features/monsters/monsters-gear.js — artifact & relic display
  function gearEffectLines(gear, t) {
    const lines = [];
    const fmtPri =
      window.SWRM && typeof window.SWRM.formatGearEffectLine === 'function'
        ? window.SWRM.formatGearEffectLine
        : null;
    const fmtSub =
      window.SWRM && typeof window.SWRM.formatArtifactSubLine === 'function'
        ? window.SWRM.formatArtifactSubLine
        : null;
    const fmtRelicSec =
      window.SWRM && typeof window.SWRM.formatRelicSecLine === 'function'
        ? window.SWRM.formatRelicSecLine
        : null;
    const fmtDur =
      window.SWRM && typeof window.SWRM.formatRelicDurability === 'function'
        ? window.SWRM.formatRelicDurability
        : null;
    if (gear.pri && fmtPri) {
      const line = fmtPri(gear.pri, { kind: gear.kind });
      if (line) lines.push(line);
    }
    if (gear.kind === 'relic') {
      if (fmtRelicSec) {
        const line = fmtRelicSec(gear);
        if (line) lines.push(line);
      }
      if (fmtDur) lines.push(`${t.monstersGearDurability || 'Durability'} ${fmtDur(gear)}`);
      if (gear.level) lines.push(`+${gear.level}`);
    }
    if (gear.kind === 'artifact' && gear.secs && gear.secs.length && fmtSub) {
      for (const s of gear.secs) {
        const line = fmtSub(s);
        if (line) lines.push(line);
      }
    }
    return lines;
  }

  function buildArtifactEffectStack(gear, t) {
    const fmtPri =
      window.SWRM && typeof window.SWRM.formatGearEffectLine === 'function'
        ? window.SWRM.formatGearEffectLine
        : null;
    const fmtSub =
      window.SWRM && typeof window.SWRM.formatArtifactSubLine === 'function'
        ? window.SWRM.formatArtifactSubLine
        : null;
    const lines = [];
    if (gear.pri && fmtPri) {
      const line = fmtPri(gear.pri, { kind: 'artifact' });
      if (line) lines.push(line);
    }
    if (fmtSub) {
      for (const sub of (gear.secs || []).slice(0, 4)) {
        const line = fmtSub(sub);
        if (line) lines.push(line);
      }
    }
    return lines;
  }

  function buildGearItemHtml(gear, t) {
    const kindLbl =
      gear.kind === 'relic'
        ? t.monstersGearRelic || 'Relic'
        : t.monstersGearArtifact || 'Artifact';
    const grade = gear.gradeStr ? gear.gradeStr : '';
    const meta = [gear.category, grade].filter(Boolean).join(' · ');
    const head = [kindLbl, meta].filter(Boolean).join(' · ');
    const lines =
      gear.kind === 'artifact' ? buildArtifactEffectStack(gear, t) : gearEffectLines(gear, t);
    const bodyCls =
      gear.kind === 'artifact'
        ? 'monsters-gear-item__body monsters-gear-item__body--stack'
        : 'monsters-gear-item__body';
    const body = lines.length
      ? lines.map((l) => `<span class="monsters-gear-item__line">${escapeHtml(l)}</span>`).join('')
      : `<span class="monsters-gear-item__line monsters-gear-item__line--muted">${escapeHtml(t.monstersGearNoEffects || '—')}</span>`;
    return `<li class="monsters-gear-item">
      <span class="monsters-gear-item__head">${escapeHtml(head)}</span>
      <span class="${bodyCls}">${body}</span>
    </li>`;
  }

  function buildMonsterGearSectionHtml(u, t) {
    const artifacts = u.artifacts || [];
    const relics = u.relics || [];
    if (!artifacts.length && !relics.length) {
      return `<p class="monsters-detail__muted">${escapeHtml(t.monstersGearEmpty || 'No artifacts or relics on this monster.')}</p>`;
    }
    const items = []
      .concat(
        artifacts.slice().sort((a, b) => String(a.category).localeCompare(String(b.category))),
        relics.slice().sort((a, b) => String(a.category).localeCompare(String(b.category))),
      )
      .map((g) => buildGearItemHtml(g, t))
      .join('');
    return `<ul class="monsters-gear-list">${items}</ul>`;
  }
