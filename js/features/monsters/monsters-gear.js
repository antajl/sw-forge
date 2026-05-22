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
    const grade =
      gear.gradeStr && gear.grade > 0
        ? gear.gradeStr
        : gear.kind === 'relic'
          ? ''
          : gear.gradeStr || '';
    const categoryLabel = gear.category || '';
    const meta = [categoryLabel, grade].filter(Boolean).join(' · ');
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

  function isArtifactElementSlot(artifact) {
    if (!artifact) return false;
    if (artifact.slot === 1) return true;
    if (artifact.slot === 2) return false;
    const el = ['Fire', 'Water', 'Wind', 'Light', 'Dark'];
    return el.includes(artifact.category);
  }

  function sortArtifactsForDisplay(artifacts) {
    return artifacts.slice().sort((a, b) => {
      const orderA = isArtifactElementSlot(a) ? 0 : 1;
      const orderB = isArtifactElementSlot(b) ? 0 : 1;
      if (orderA !== orderB) return orderA - orderB;
      return String(a.category).localeCompare(String(b.category));
    });
  }

  function buildMonsterGearListHtml(items, t, emptyMsg) {
    if (!items.length) {
      return `<p class="monsters-detail__muted">${escapeHtml(emptyMsg || t.monstersGearEmpty || 'None equipped.')}</p>`;
    }
    return `<ul class="monsters-gear-list">${items.map((g) => buildGearItemHtml(g, t)).join('')}</ul>`;
  }

  function buildMonsterDetailLoadoutHtml(u, t, runesBlockHtml) {
    const runesLbl = escapeHtml(t.monstersDetailRunes || 'Runes');
    const artLbl = escapeHtml(t.monstersDetailArtifacts || 'Artifacts');
    const relLbl = escapeHtml(t.monstersDetailRelics || 'Relics');
    const countTpl = t.monstersDetailGearCount || '{n}';
    const artifacts = sortArtifactsForDisplay(u.artifacts || []);
    const relics = (u.relics || [])
      .slice()
      .sort((a, b) => String(a.category).localeCompare(String(b.category)));
    const artCount = artifacts.length;
    const relCount = relics.length;
    const artCountHtml = artCount
      ? ` <span class="monsters-detail__loadout-count">${escapeHtml(countTpl.replace('{n}', String(artCount)))}</span>`
      : '';
    const relCountHtml = relCount
      ? ` <span class="monsters-detail__loadout-count">${escapeHtml(countTpl.replace('{n}', String(relCount)))}</span>`
      : '';
    const artEmpty = t.monstersGearArtifactsEmpty || 'No artifacts on this monster.';
    const relEmpty = t.monstersGearRelicsEmpty || 'No relics on this monster.';
    return `<div class="monsters-detail__loadout-tabs" role="tablist" aria-label="${escapeHtml(t.monstersDetailLoadoutAria || 'Gear')}">
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm monsters-detail__loadout-tab is-active" data-loadout-tab="runes" role="tab" aria-selected="true" aria-controls="monsters-detail-loadout-runes">${runesLbl}</button>
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm monsters-detail__loadout-tab" data-loadout-tab="artifacts" role="tab" aria-selected="false" aria-controls="monsters-detail-loadout-artifacts"${artCount ? '' : ' disabled'}>${artLbl}${artCountHtml}</button>
        <button type="button" class="btn-ghost btn-toolbar btn-toolbar--sm monsters-detail__loadout-tab" data-loadout-tab="relics" role="tab" aria-selected="false" aria-controls="monsters-detail-loadout-relics"${relCount ? '' : ' disabled'}>${relLbl}${relCountHtml}</button>
      </div>
      <div class="monsters-detail__loadout-panels">
        <div class="monsters-detail__loadout-panel is-active" id="monsters-detail-loadout-runes" data-loadout-panel="runes" role="tabpanel">${runesBlockHtml}</div>
        <div class="monsters-detail__loadout-panel" id="monsters-detail-loadout-artifacts" data-loadout-panel="artifacts" role="tabpanel" hidden>${buildMonsterGearListHtml(artifacts, t, artEmpty)}</div>
        <div class="monsters-detail__loadout-panel" id="monsters-detail-loadout-relics" data-loadout-panel="relics" role="tabpanel" hidden>${buildMonsterGearListHtml(relics, t, relEmpty)}</div>
      </div>`;
  }

  function bindMonsterDetailLoadoutTabs(root) {
    if (!root) return;
    const tabs = root.querySelectorAll('[data-loadout-tab]');
    const panels = root.querySelectorAll('[data-loadout-panel]');
    if (!tabs.length) return;
    tabs.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const kind = btn.getAttribute('data-loadout-tab');
        if (!kind) return;
        tabs.forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach((p) => {
          const on = p.getAttribute('data-loadout-panel') === kind;
          p.classList.toggle('is-active', on);
          if (on) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
      });
    });
  }
