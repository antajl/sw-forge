/**
 * Insert guide-lang--fr after each guide-lang--ru block (from EN structure).
 * Run: node tools/inject-guide-fr.mjs
 */
import fs from 'fs';

const path = 'index.html';
let html = fs.readFileSync(path, 'utf8');

if (html.includes('guide-lang--fr')) {
  console.log('guide-lang--fr already present, skipping');
  process.exit(0);
}

const PHRASES = [
  ['Getting started', 'Premiers pas'],
  ['Account depth', 'Profondeur du compte'],
  ['Rune Table', 'Liste des runes'],
  ['How scoring works', 'Comment fonctionne la notation'],
  ['Rune Rules', 'Règles des runes'],
  ['Shortcuts &amp; hidden tricks', 'Raccourcis et astuces'],
  ['Dashboard', 'Tableau de bord'],
  ['Monsters', 'Monstres'],
  ['Table', 'Tableau'],
  ['Rules', 'Règles'],
  ['Verdict', 'Verdict'],
  ['Role', 'Rôle'],
  ['Keep', 'Garder'],
  ['Sell', 'Vendre'],
  ['Grind', 'Mettre à niveau'],
  ['Gem', 'Gemme'],
  ['Reapp', 'Réapprécier'],
  ['Strictness', 'Sévérité'],
  ['Early / Mid / Late', 'Début / Milieu / Fin'],
  ['Inventory', 'Inventaire'],
  ['Equipped', 'Équipé'],
  ['Forge Score', 'Score Forge'],
  ['Ingame Score', 'Score en jeu'],
  ['Artifacts', 'Artefacts'],
  ['Relics', 'Reliques'],
  ['App Settings', "Paramètres de l'app"],
  ['Save &amp; Recalculate', 'Enregistrer & recalculer'],
  ['Reset to Defaults', 'Réinitialiser par défaut'],
  ['First load', 'Premier chargement'],
  ['Monsters tab', 'Onglet Monstres'],
  ['Up to four exports', "Jusqu'à quatre exports"],
  ['Reset', 'Réinitialiser'],
  ['Keyboard', 'Clavier'],
  ['Mouse &amp; links', 'Souris et liens'],
  ['App', 'Application'],
  ['Export from SWEX', 'Exporter depuis SWEX'],
  ['Set your stage', 'Choisir votre stade'],
  ['Use both tabs', 'Utiliser les deux onglets'],
  ['Your monster box', 'Votre boîte de monstres'],
  ['Lineups (optional)', 'Équipes (optionnel)'],
  ['Clear all saved data', 'Effacer toutes les données'],
  ['Quality-of-life features that are easy to miss. Rune logic is in', 'Fonctions pratiques faciles à manquer. La logique des runes est dans'],
  ['One <strong>SWEX JSON</strong> powers the whole app — <strong>Runes</strong> for cleanup and <strong>Monsters</strong> for your box. Everything stays in your browser; nothing is uploaded.', "Un <strong>JSON SWEX</strong> alimente toute l'app — <strong>Runes</strong> pour le tri et <strong>Monstres</strong> pour votre boîte. Tout reste dans le navigateur ; rien n'est envoyé."],
];

function enBlockToFr(enInner) {
  let s = enInner;
  s = s.replace(/guide-lang--en/g, 'guide-lang--fr');
  s = s.replace(/-en"/g, '-fr"');
  s = s.replace(/id="guide-h-([^"]+)-en"/g, 'id="guide-h-$1-fr"');
  s = s.replace(/aria-labelledby="guide-h-([^"]+)-en"/g, 'aria-labelledby="guide-h-$1-fr"');
  const sorted = [...PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    s = s.split(from).join(to);
  }
  return s;
}

const re =
  /<div class="guide-lang guide-lang--en guide-list">([\s\S]*?)<\/div>\s*<div class="guide-lang guide-lang--ru guide-list">([\s\S]*?)<\/div>/g;

let count = 0;
html = html.replace(re, (full, enInner, ruInner) => {
  count += 1;
  const frInner = enBlockToFr(enInner);
  return `<div class="guide-lang guide-lang--en guide-list">${enInner}</div>
          <div class="guide-lang guide-lang--fr guide-list">${frInner}</div>
          <div class="guide-lang guide-lang--ru guide-list">${ruInner}</div>`;
});

fs.writeFileSync(path, html);
console.log('inserted', count, 'guide-lang--fr blocks');
