#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const monstersPath = path.join(root, 'partials/tabs/monsters.html');
const lines = fs.readFileSync(monstersPath, 'utf8').split(/\r?\n/);

/** Inner dashboard markup only (scope + box overview), not the hub pane wrapper. */
const overview = lines.slice(22, 147).join('\n');
fs.mkdirSync(path.join(root, 'partials/dashboard'), { recursive: true });
fs.writeFileSync(path.join(root, 'partials/dashboard/monsters-overview.html'), `${overview}\n`, 'utf8');

const out = [...lines.slice(0, 4), ...lines.slice(8, 21), ...lines.slice(148)];
fs.writeFileSync(monstersPath, out.join('\n'), 'utf8');
console.log('Wrote partials/dashboard/monsters-overview.html');
console.log('Trimmed monsters.html to', out.length, 'lines');
