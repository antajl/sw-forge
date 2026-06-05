#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gearPath = path.join(root, 'partials/tabs/gear.html');
const lines = fs.readFileSync(gearPath, 'utf8').split(/\r?\n/);

const dist = lines.slice(136, 347).join('\n');
const distDir = path.join(root, 'partials/dashboard');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'runes-distributions.html'), `${dist}\n`, 'utf8');

const out = [...lines.slice(0, 3), ...lines.slice(7, 17), ...lines.slice(350)];
const fixed = out.map((l) => {
  if (l.includes('runes-hub-tab-runetable')) {
    return l
      .replace('aria-selected="false"', 'aria-selected="true"')
      .replace('tabindex="-1"', 'tabindex="0"')
      .replace('class="rules-subtab runes-hub-tab"', 'class="rules-subtab runes-hub-tab is-active"');
  }
  if (l.includes('id="tab-runetable"')) {
    return l
      .replace(' hidden', '')
      .replace('class="runes-hub-pane"', 'class="runes-hub-pane is-active"');
  }
  return l;
});
fs.writeFileSync(gearPath, fixed.join('\n'), 'utf8');
console.log('Wrote partials/dashboard/runes-distributions.html');
console.log('Trimmed gear.html to', fixed.length, 'lines');
