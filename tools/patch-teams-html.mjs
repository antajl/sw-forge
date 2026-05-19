import fs from 'fs';

const path = 'index.html';
let h = fs.readFileSync(path, 'utf8');

const oldBlock = /            <div class="teams-layout">[\s\S]*?            <\/motion>\n          <\/motion>\n        <\/div>/;

const newBlock = `            <div class="teams-layout">
              <aside class="teams-sidebar" data-teams-readonly-hide>
                <header class="teams-sidebar__head">
                  <h3 class="teams-sidebar__title" id="lbl-teams-sets-title">Team sets</h3>
                  <button type="button" class="monsters-toolbar-btn monsters-toolbar-btn--sm" id="teams-add-set">+ Set</button>
                </header>
                <ul class="teams-set-list teams-set-tree" id="teams-set-list"></ul>
              </aside>
              <section class="teams-main">
                <header class="teams-main__head">
                  <label class="teams-main__set-name">
                    <span id="lbl-teams-set-name">Set name</span>
                    <input type="text" id="teams-set-name" maxlength="48" autocomplete="off" spellcheck="false" data-teams-readonly-hide placeholder="e.g. Arena" />
                  </label>
                  <button type="button" class="btn-primary" id="teams-create-team" data-teams-readonly-hide>+ Create Team</button>
                </header>
                <div class="teams-card-grid" id="teams-card-grid" role="list"></div>
              </section>
            </div>
            <dialog id="teams-editor-dialog" class="teams-editor-dialog" data-teams-readonly-hide>
              <form method="dialog" class="teams-editor-dialog__form">
                <header class="teams-editor-dialog__head">
                  <h3 class="teams-editor-dialog__title" id="lbl-teams-editor-title">Edit team</h3>
                  <button type="button" class="teams-editor-dialog__close" id="teams-editor-cancel" aria-label="Close">✕</button>
                </header>
                <motion class="teams-editor-dialog__body">
                  <label class="teams-editor__field">
                    <span id="lbl-teams-team-name">Team name</span>
                    <input type="text" id="teams-team-name" maxlength="48" autocomplete="off" spellcheck="false" placeholder="e.g. Arena Offence" />
                  </label>
                  <label class="teams-editor__field">
                    <span id="lbl-teams-team-size">Team size</span>
                    <select id="teams-team-size">
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5" selected>5</option>
                      <option value="6">6</option>
                    </select>
                  </label>
                  <div class="teams-monster-slots" id="teams-monster-slots"></div>
                  <label class="teams-editor__field">
                    <span id="lbl-teams-team-tags">Tags</span>
                    <input type="text" id="teams-team-tags" maxlength="120" autocomplete="off" spellcheck="false" placeholder="AO, Fast, Speed Lead" />
                  </label>
                  <label class="teams-editor__field">
                    <span id="lbl-teams-team-notes">Notes</span>
                    <textarea id="teams-team-notes" rows="3" maxlength="500" placeholder="Strategy notes…"></textarea>
                  </label>
                  <label class="teams-editor__share">
                    <input type="checkbox" id="teams-share-public" />
                    <span id="lbl-teams-share-public">Show in share link</span>
                  </label>
                </div>
                <footer class="teams-editor-dialog__foot">
                  <button type="button" class="btn-ghost" id="teams-editor-cancel-foot">Cancel</button>
                  <button type="button" class="btn-primary" id="teams-editor-save">Save team</button>
                </footer>
              </form>
            </dialog>
          </div>`;

if (!oldBlock.test(h)) {
  const alt = h.indexOf('<motion class="teams-layout">');
  if (alt < 0) {
    const start = h.indexOf('            <div class="teams-layout">');
    const end = h.indexOf('        </motion>\n\n        <div id="tab-monsters-roster"');
    if (start >= 0 && end > start) {
      h = h.slice(0, start) + newBlock.replace(/<motion /g, '<div ').replace(/<\/motion>/g, '</div>') + h.slice(end);
    } else {
      console.error('teams block not found');
      process.exit(1);
    }
  }
} else {
  h = h.replace(oldBlock, newBlock.replace(/<motion /g, '<div ').replace(/<\/motion>/g, '</div>'));
}

fs.writeFileSync(path, h);
console.log('patched teams html');
