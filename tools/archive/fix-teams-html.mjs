import fs from 'fs';

const p = 'index.html';
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);

const cardIdx = lines.findIndex((l) => l.includes('teams-card-grid'));
const asideIdx = lines.findIndex((l, i) => i > cardIdx && l.includes('</aside>'));
if (cardIdx < 0 || asideIdx < 0) {
  console.error('markers not found', cardIdx, asideIdx);
  process.exit(1);
}

const dialog = `            </motion>
            <dialog id="teams-editor-dialog" class="teams-editor-dialog" data-teams-readonly-hide>
              <form method="dialog" class="teams-editor-dialog__form">
                <header class="teams-editor-dialog__head">
                  <h3 class="teams-editor-dialog__title" id="lbl-teams-editor-title">Edit team</h3>
                  <button type="button" class="teams-editor-dialog__close" id="teams-editor-cancel" aria-label="Close">✕</button>
                </header>
                <div class="teams-editor-dialog__body">
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
            </dialog>`;

const fixed = dialog.replaceAll('motion', 'div').split('\n');
const out = [
  ...lines.slice(0, cardIdx + 1),
  '              </section>',
  ...fixed,
  ...lines.slice(asideIdx + 1),
];
fs.writeFileSync(p, out.join('\n'));
console.log('fixed teams dialog html');
