import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const featuresDir = path.join(root, 'css/features');

const map = {
  '#f0c040': 'var(--gold)',
  '#e87850': 'var(--orange)',
  '#5b9cff': 'var(--accent)',
  '#c9a227': 'var(--gold)',
  '#6ea8fe': 'var(--accent)',
  '#f06eb0': 'var(--purple)',
  '#2d8a5c': 'var(--green)',
  '#ffd54a': 'var(--gold)',
  '#ff9a6e': 'var(--orange)',
};

const keys = Object.keys(map).sort((a, b) => b.length - a.length);

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith('.css')) {
      let c = fs.readFileSync(p, 'utf8');
      const orig = c;
      for (const hex of keys) {
        const re = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        c = c.replace(re, map[hex]);
      }
      c = c.replace(/\bcolor:\s*#fff\b/gi, 'color: var(--text-hi)');
      c = c.replace(/\bcolor:\s*#ffffff\b/gi, 'color: var(--text-hi)');
      if (c !== orig) {
        fs.writeFileSync(p, c);
        console.log('updated', path.relative(root, p));
      }
    }
  }
}

walk(featuresDir);
