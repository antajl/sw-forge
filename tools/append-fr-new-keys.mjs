import fs from 'fs';

const frMap = {
  rulesSubtabArtifacts: 'Artefacts',
  rulesSubtabArtifactsDesc: 'Notation Garder/Vendre des artefacts',
  artifactRulesTitle: 'Règles des artefacts',
  artifactRulesTypeSection: 'Artefacts de type (emplacement 2)',
  artifactRulesElementSection: 'Artefacts élément (emplacement 1)',
  artifactRulesSynergiesSection: 'Synergies',
  artifactRulesThresholdsSection: 'Seuils',
  artifactRulesMinUsefulLegend: 'Sous-stats utiles min pour Garder (Légendaire)',
  artifactRulesMinUsefulHero: 'Sous-stats utiles min pour Garder (Héros)',
  artifactVerdictKeep: 'Garder',
  artifactVerdictSell: 'Vendre',
  artifactRoleLabel: 'Rôle',
  artifactFilterVerdict: 'Verdict',
  artChipKeep: 'Garder',
  artChipSell: 'Vendre',
  thArtRole: 'Rôle',
  thArtVerdict: 'Verdict',
  reappOddSlots: 'Emplacements impairs (1/3/5)',
  reappOddSlotsHint: 'Inclure les emplacements 1, 3 et 5 dans les candidats Réappréciation',
  reappOddInnate: 'Innée requise pour impairs',
  reappOddInnateHint: 'Vide = toute innée ; ex. SPD, ACC',
};

let fr = fs.readFileSync('js/core/i18n-fr.js', 'utf8');
const additions = [];
for (const [k, v] of Object.entries(frMap)) {
  if (fr.includes(`${k}:`)) continue;
  additions.push(`  ${k}: '${v.replace(/'/g, "\\'")}',`);
}
if (!additions.length) {
  console.log('no new FR keys');
  process.exit(0);
}
const idx = fr.lastIndexOf('};');
fr = `${fr.slice(0, idx)}\n${additions.join('\n')}\n};`;
fs.writeFileSync('js/core/i18n-fr.js', fr);
console.log('added', additions.length);
