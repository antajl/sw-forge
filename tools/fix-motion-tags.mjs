import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'index.html');
let s = fs.readFileSync(file, 'utf8');
const wrongClose = '</' + ['m', 'o', 't', 'i', 'o', 'n'].join('') + '>';
const rightClose = '</' + ['d', 'i', 'v'].join('') + '>';
const wrongOpen = '<' + ['m', 'o', 't', 'i', 'o', 'n'].join('') + ' ';
const rightOpen = '<' + ['d', 'i', 'v'].join('') + ' ';
let closeCount = 0;
while (s.includes(wrongClose)) {
  s = s.replace(wrongClose, rightClose);
  closeCount += 1;
}
let openCount = 0;
while (s.includes(wrongOpen)) {
  s = s.replace(wrongOpen, rightOpen);
  openCount += 1;
}
fs.writeFileSync(file, s);
console.log('closed', closeCount, 'open', openCount);
