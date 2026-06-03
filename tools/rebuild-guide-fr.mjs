#!/usr/bin/env node
/**
 * Regenerate guide-lang--fr blocks from EN in partials/tabs/guide.html.
 * Run: node tools/rebuild-guide-fr.mjs && npm run build:html
 */
import fs from 'fs';
import { GUIDE_PHRASES } from './guide-fr-phrases.mjs';

const GUIDE_PATH = 'partials/tabs/guide.html';

function enBlockToFr(enInner) {
  let s = enInner;
  s = s.replace(/guide-lang--en/g, 'guide-lang--fr');
  s = s.replace(/-en"/g, '-fr"');
  s = s.replace(/id="guide-h-([^"]+)-en"/g, 'id="guide-h-$1-fr"');
  s = s.replace(/aria-labelledby="guide-h-([^"]+)-en"/g, 'aria-labelledby="guide-h-$1-fr"');

  const sorted = [...GUIDE_PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    s = s.split(from).join(to);
  }

  // Post-process: SW FR terminology fixes
  s = s.split('Tableauau').join('Tableau de bord');
  s = s.split('Applicationly suggestion').join('Appliquer la suggestion');
  s = s.split('Applicationliquer').join('Appliquer');
  s = s.split('«\u00a0exclude\u00a0»').join('«\u00a0exclure\u00a0»');
  s = s.split('« exclude »').join('« exclure »');
  s = s.split('high-roll').join('High Roll');
  s = s.replace(/<span class="guide-verdict-chip upgrade">Upgrade<\/span>/g, '<span class="guide-verdict-chip upgrade">Améliorer</span>');
  s = s.replace(/<span class="guide-verdict-chip finish">Finish<\/span>/g, '<span class="guide-verdict-chip finish">Terminer</span>');
  s = s.replace(/<span class="guide-verdict-chip grind">Grind<\/span>/g, '<span class="guide-verdict-chip grind">Grind</span>');
  s = s.split('Liste des runes').join('Table des runes');
  s = s.split('Gemmeme').join('Gemme');
  // Residual verdict labels (after longer phrases)
  s = s.replace(/\bKeep\b/g, 'Garder');
  s = s.replace(/\bSell\b/g, 'Vendre');
  s = s.replace(/\bGem\b/g, 'Gemme');
  s = s.replace(/\bGrind\b/g, 'Grind');

  return s;
}

let html = fs.readFileSync(GUIDE_PATH, 'utf8');

const blockRe =
  /<div class="guide-lang guide-lang--en guide-list">([\s\S]*?)<\/div>\s*<div class="guide-lang guide-lang--fr guide-list">[\s\S]*?<\/div>\s*<div class="guide-lang guide-lang--ru/g;

let count = 0;
html = html.replace(blockRe, (full, enInner) => {
  count += 1;
  const frInner = enBlockToFr(enInner);
  return `<div class="guide-lang guide-lang--en guide-list">${enInner}</div>
          <div class="guide-lang guide-lang--fr guide-list">${frInner}</div>
          <div class="guide-lang guide-lang--ru`;
});

if (count !== 7) {
  console.warn(`Expected 7 panels, updated ${count}`);
}

fs.writeFileSync(GUIDE_PATH, html, 'utf8');
console.log(`Rebuilt ${count} guide-lang--fr blocks in ${GUIDE_PATH}`);
