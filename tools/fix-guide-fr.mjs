#!/usr/bin/env node
/**
 * Polish guide-lang--fr blocks in partials/tabs/guide.html (SW FR terminology).
 * Run: node tools/fix-guide-fr.mjs && npm run build:html
 */
import fs from 'fs';

const path = 'partials/tabs/guide.html';
let html = fs.readFileSync(path, 'utf8');

const PHRASES = [
  ['Tableauau de bord', 'Tableau de bord'],
  ['Tableauau', 'Tableau de bord'],
  ['Liste des runes', 'Table des runes'],
  ['Mettre à niveau/Gemme', 'Grind/Gemme'],
  ['Mettre à niveau target', 'cible Grind'],
  ['Garder, Gemme, Mettre à niveau, Vendre', 'Garder, Gemme, Grind, Vendre'],
  ['Choose your file on the Runes tab — or', 'Choisissez votre fichier dans l’onglet Runes — ou'],
  ['<strong>drag &amp; drop</strong> the .json anywhere on the screen.', '<strong>glissez-déposez</strong> le .json n’importe où sur la page.'],
  ['On the Tableau de bord pick', 'Sur le tableau de bord, choisissez'],
  ['and tune <strong>Sévérité</strong> — that is how picky rune grading is.', 'et réglez la <strong>Sévérité</strong> — c’est la dureté du tri des runes.'],
  ['for Rôle / Verdict · <strong>Monstres → Roster</strong> to browse units and their runes.', 'pour Rôle / Verdict · <strong>Monstres → Roster</strong> pour parcourir vos unités et leurs runes.'],
  ['Search by name, element, or rune text. Open a unit to see', 'Recherchez par nom, élément ou texte de rune. Ouvrez une unité pour voir'],
  ['<strong>Base</strong>, <strong>+runes</strong>, and <strong>Total</strong> stats — Total SPD includes your account <strong>Sky Tribe Totem</strong> bonus (% of base, from the export). Six rune slots link to the Table des runes.', '<strong>Base</strong>, <strong>+runes</strong> et stats <strong>Total</strong> — la VIT totale inclut le bonus <strong>Monument Sky Tribe</strong> (% de la base, depuis l’export). Six emplacements runes mènent à la table des runes.'],
  ['In <strong>Paramètres de l\'app → Database Slots</strong> you can store alt accounts or before/after exports — <strong>Share</strong> is in the card header. <strong>Swap</strong> changes which file the Tableau de bord and Table des runes use. Language: globe icon in the header.', 'Dans <strong>Paramètres de l’app → Emplacements base</strong>, stockez d’autres comptes ou exports avant/après — <strong>Partager</strong> est dans l’en-tête de la carte. <strong>Changer</strong> modifie le fichier actif pour le tableau de bord et la table des runes. Langue : icône globe dans l’en-tête.'],
  ['Click a <strong>verdict</strong> slice, number tile, or <strong>role</strong> row — the Table des runes opens with the same filter.', 'Cliquez sur une tranche de <strong>verdict</strong>, une tuile ou une ligne de <strong>rôle</strong> — la table des runes s’ouvre avec le même filtre.'],
  ['<strong>Enter</strong> or <strong>Space</strong> on a chart row works too (keyboard). Five chart tabs answer “where are my runes?” without leaving the Tableau de bord.', '<strong>Entrée</strong> ou <strong>Espace</strong> sur une ligne de graphique fonctionne aussi (clavier). Cinq onglets répondent à « où sont mes runes ? » sans quitter le tableau de bord.'],
  ['Your action list: every rune with stats, <strong>Ingame</strong> and <strong>Forge</strong> ratings, <strong>Verdict</strong>, <strong>Rôle</strong>, and <strong>Location</strong>. Hover <strong>Verdict</strong> for the plain-language reason (Garder quality, Grind/Gemme hints, why Vendre).', 'Votre liste d’actions : chaque rune avec stats, notes <strong>Ingame</strong> et <strong>Forge</strong>, <strong>Verdict</strong>, <strong>Rôle</strong> et <strong>Emplacement</strong>. Survolez <strong>Verdict</strong> pour la raison (qualité Garder, indices Grind/Gemme, pourquoi Vendre).'],
  ['Hover the number for a line-by-line breakdown.', 'Survolez le nombre pour le détail ligne par ligne.'],
  ['Hover <strong>Forge</strong> for live breakdown (pts + all multipliers, including archetype name when ×1.04). Chip color: ≥88 high · ≥72 mid · below low.', 'Survolez <strong>Forge</strong> pour le détail live (pts + multiplicateurs, archétype si ×1.04). Couleur puce : ≥88 élevé · ≥72 moyen · en dessous faible.'],
  ['Huge exports: first <strong>500 rows</strong> for speed — <strong>Load all …</strong> for the full filtered list. Search highlights matches in the row.', 'Gros exports : les <strong>500 premières lignes</strong> pour la vitesse — <strong>Tout charger…</strong> pour la liste filtrée complète. La recherche surligne les correspondances.'],
  ['<strong>Export CSV</strong> — filtered list with Forge, Ingame, Rôle, Verdict, and a <strong>Reason</strong> text column (same text as the Verdict tooltip). <strong>Share</strong> (toolbar) — read-only link for monsters/runes (see Paramètres de l\'app for modes).', '<strong>Exporter CSV</strong> — liste filtrée avec Forge, Ingame, Rôle, Verdict et colonne <strong>Raison</strong> (même texte que le tooltip Verdict). <strong>Partager</strong> (barre d’outils) — lien lecture seule (modes dans Paramètres de l’app).'],
  ['<strong>You do not need to edit spreadsheets.</strong> The <strong>Rôle</strong> and <strong>Verdict</strong> columns are the main answers. Open <strong>Règles des runes</strong> only if you want to tune how strict the app is.', '<strong>Pas besoin de tableur.</strong> Les colonnes <strong>Rôle</strong> et <strong>Verdict</strong> suffisent. Ouvrez <strong>Règles des runes</strong> seulement pour ajuster la sévérité.'],
  ['Early, Mid, or Late on the Tableau de bord — same labels as your preset.', 'Début, Milieu ou Fin sur le tableau de bord — mêmes libellés que votre préréglage.'],
  ['Garder, Gemme, Grind, Vendre, … Hover Verdict for the plain sentence (Vendre why, Grind target, Garder quality).', 'Garder, Gemme, Grind, Vendre… Survolez Verdict pour la phrase claire (pourquoi Vendre, cible Grind, qualité Garder).'],
  ['<strong>Sévérité (1–5)</strong> on the Tableau de bord makes checks tougher:', '<strong>Sévérité (1–5)</strong> sur le tableau de bord durcit les critères :'],
  ['Open <strong>Runes → Règles</strong> to tune the same engine that fills <strong>Rôle</strong> and <strong>Verdict</strong> in the table. The Tableau de bord <strong>Sévérité</strong> slider is the everyday control; this page is the full spreadsheet-style setup.', 'Ouvrez <strong>Runes → Règles</strong> pour ajuster le moteur qui remplit <strong>Rôle</strong> et <strong>Verdict</strong>. Le curseur <strong>Sévérité</strong> du tableau de bord suffit au quotidien ; cette page est le réglage expert complet.'],
  ['<strong>Show threshold previews</strong> — read-only God / High Roll / Duo tables (stage × grade). Change numbers above → previews update live; <strong>Enregistrer & recalculer</strong> applies to all runes.', '<strong>Afficher les aperçus de seuils</strong> — tableaux God / High Roll / Duo en lecture seule (segment × grade). Modifiez les chiffres → aperçu live ; <strong>Enregistrer & recalculer</strong> applique à toutes les runes.'],
  ['Global strictness on top of your Tableau de bord stage. Expert fields:', 'Sévérité globale en plus du segment du tableau de bord. Champs expert :'],
  ['Six default builds (Fast CC, Classic DPS, Bomber, Tank, Bruiser, Slow DPS). Pick one in the left list; the big sheet is that role’s formula.', 'Six builds par défaut (Fast CC, Classic DPS, Bomber, Tank, Bruiser, Slow DPS). Choisissez-en un à gauche ; la grande feuille est la formule du rôle.'],
  ['<strong>Runes → Tableau</strong> — focus search from any tab (not while typing elsewhere). Open Tableau to see the field.', '<strong>Runes → Table</strong> — focus recherche depuis n’importe quel onglet (sauf si vous tapez ailleurs). Ouvrez Table pour voir le champ.'],
  ['<strong>Tableau de bord charts</strong> — activate a clickable verdict / role / set / slot row (same as click) → opens filtered table.', '<strong>Graphiques tableau de bord</strong> — activez une ligne verdict / rôle / set / emplacement cliquable → ouvre la table filtrée.'],
  ['<strong>Drag &amp; drop</strong> a SWEX .json onto the page — loads into active Data 1 (same as the upload button).', '<strong>Glissez-déposez</strong> un .json SWEX sur la page — charge dans Data 1 actif (comme le bouton d’import).'],
  ['<strong>Tableau de bord → Tableau</strong> — click chart bars, verdict tiles, or role lines to filter the table in one step.', '<strong>Tableau de bord → Table</strong> — cliquez barres, tuiles verdict ou lignes rôle pour filtrer la table en un geste.'],
  ['<strong>#runetable?…</strong> in the address bar — share your current filters; <strong>Copy summary</strong> on Tableau de bord for a text dump.', '<strong>#runetable?…</strong> dans la barre d’adresse — partagez vos filtres ; <strong>Copier le résumé</strong> sur le tableau de bord pour un export texte.'],
  ['Dashboard only', 'Tableau de bord uniquement'],
  ['Evaluation Policy', 'Politique d’évaluation'],
  ['no need to open Engine or formulas.', 'pas besoin d’ouvrir Moteur ou formules.'],
  ['Roster', 'Roster'],
  ['Sky Tribe Totem', 'Monument Sky Tribe'],
  ['Strictness', 'Sévérité'],
  ['Location', 'Emplacement'],
  ['Reason', 'Raison'],
  ['Share', 'Partager'],
  ['Swap', 'Changer'],
  ['Load all', 'Tout charger'],
  ['Export CSV', 'Exporter CSV'],
  ['Database Slots', 'Emplacements base'],
  ['Read-only', 'Lecture seule'],
  ['Grind', 'Grind'],
  ['Reappraisal', 'Réappréciation'],
  ['Grindstone', 'Meule'],
  ['Ancient', 'Antique'],
  ['Eff%', 'Eff%'],
  ['God Roll', 'God Roll'],
  ['High Roll', 'High Roll'],
  ['Duo Roll', 'Duo Roll'],
];

function patchFrBlocks(source) {
  return source.replace(
    /(<div class="guide-lang guide-lang--fr guide-list">)([\s\S]*?)(<\/div>\s*<div class="guide-lang guide-lang--ru)/g,
    (full, open, inner, close) => {
      let s = inner;
      const sorted = [...PHRASES].sort((a, b) => b[0].length - a[0].length);
      for (const [from, to] of sorted) {
        s = s.split(from).join(to);
      }
      return open + s + close;
    },
  );
}

const before = (html.match(/Tableauau/g) || []).length;
html = patchFrBlocks(html);
html = html.split('Tableauau').join('Tableau de bord');
const after = (html.match(/Tableauau/g) || []).length;

fs.writeFileSync(path, html, 'utf8');
console.log(`Patched guide FR blocks. Tableauau: ${before} → ${after}`);
