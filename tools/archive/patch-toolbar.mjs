import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
let html = fs.readFileSync(file, 'utf8');

const start = html.indexOf('<motion class="monsters-toolbar-sticky">');
const startDiv = html.indexOf('<div class="monsters-toolbar-sticky">');
const i = startDiv >= 0 ? startDiv : start;
if (i < 0) throw new Error('toolbar sticky not found');

const endMarker = '<div class="monsters-bulk-bar';
const end = html.indexOf(endMarker, i);
if (end < 0) throw new Error('bulk bar not found');

const replacement = fs.readFileSync(path.join(root, 'tools', 'roster-toolbar-snippet.html'), 'utf8');

html = html.slice(0, i) + replacement + '\n        ' + html.slice(end);
fs.writeFileSync(file, html);
console.log('patched toolbar');
