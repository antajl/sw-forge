import fs from 'fs';

const path = 'index.html';
let h = fs.readFileSync(path, 'utf8');
const bad = 'mo' + 'tion';

h = h.replace(
  /\s*<header class="monsters-head">[\s\S]*?<\/header>\s*/,
  '\n        ',
);
h = h.replace(
  'aria-labelledby="lbl-monsters-title"',
  'aria-label="Monsters"',
);

h = h.replaceAll(`<${bad}`, '<div');
h = h.replaceAll(`</${bad}>`, '</div>');

h = h.replace(
  /(<div class="monsters-toolbar-main__right">)\s*<motion class="monsters-view-toggle"[\s\S]*?<\/div>\s*/,
  '$1\n              ',
);

h = h.replace(
  /\s*<div class="monsters-chips monsters-chips--stats" id="monsters-chips" aria-live="polite"><\/div>\s*/,
  '\n',
);

const metaBlock = `        <div class="monsters-roster-meta">
          <div class="monsters-chips monsters-chips--stats" id="monsters-chips" aria-live="polite"></div>
          <div class="monsters-grid-head" id="monsters-grid-head" hidden>
            <label class="monsters-grid-head__select">
              <input type="checkbox" id="monsters-grid-select-all" class="monsters-table__bulk-cb monsters-table__bulk-cb--all" />
              <span id="lbl-monsters-grid-select-all">Select all visible</span>
            </label>
          </div>
        </div>
`;

h = h.replace(
  /        <div class="monsters-grid-head" id="monsters-grid-head" hidden>[\s\S]*?        <\/div>\n        <div id="monsters-grid"/,
  metaBlock + '        <div id="monsters-grid"',
);

if (!h.includes('id="monsters-stats"')) {
  h = h.replace(
    '<div class="monsters-shell">',
    '<div class="monsters-shell">\n        <div id="monsters-stats" hidden aria-live="polite" class="visually-hidden"></div>',
  );
}

fs.writeFileSync(path, h);
console.log('patched index.html');
