/** EN → FR for missing i18n keys (Summoners War UI tone). */
export const EXACT = {
  title: 'SW-Forge',
  footerVersionLabel: 'Build',
  runesHubDashboard: 'Tableau de bord',
  runesHubRuneTable: 'Tableau',
  runesHubRuneRules: 'Règles',
  runesHubRulesExpertHint: 'Optionnel · expert',
  rulesExpertBannerTitle: 'Réglage expert — non requis',
  rulesExpertBannerText:
    'Pour les joueurs qui veulent un contrôle fin : seuils, formules de rôles et logique Gemme/Réappréciation. Ces réglages modifient les verdicts — le tableau de bord et la liste des runes fonctionnent très bien par défaut.',
  actionTargetReapp: 'Réapprécier (reroll sous-stats)',
  resetDefaults: 'Réinitialiser par défaut',
  dashboardExportEffBuckets: 'Histogramme (tranches 5 %) :',
  shareLinkCopiedLong: 'Copié ! Envoyez ce lien pour comparer les builds.',
  shareNoContent: 'Rien à partager pour ce mode d’export',
};

const PHRASES = [
  ['Dashboard', 'Tableau de bord'],
  ['More Filters', 'Plus de filtres'],
  ['Clear all', 'Tout effacer'],
  ['Select all', 'Tout sélectionner'],
  ['Deselect all', 'Tout désélectionner'],
  ['Artifacts', 'Artefacts'],
  ['Relics', 'Reliques'],
  ['Artifact', 'Artefact'],
  ['Relic', 'Relique'],
  ['Runes', 'Runes'],
  ['Verdict', 'Verdict'],
  ['Keep', 'Garder'],
  ['Sell', 'Vendre'],
  ['Equipped', 'Équipé'],
  ['Inventory', 'Inventaire'],
  ['Legend', 'Légendaire'],
  ['Hero', 'Héros'],
  ['Rare', 'Rare'],
  ['Grade', 'Grade'],
  ['Location', 'Emplacement'],
  ['Search artifacts…', 'Rechercher artefacts…'],
  ['Search relics…', 'Rechercher reliques…'],
  ['Reset filters', 'Réinitialiser filtres'],
  ['Export CSV', 'Exporter CSV'],
  ['God Roll', 'God Roll'],
  ['High Roll', 'High Roll'],
  ['Duo Roll', 'Duo Roll'],
  ['Gem', 'Gemme'],
  ['Grind', 'Mettre à niveau'],
  ['Share all', 'Tout partager'],
  ['Favorites', 'Favoris'],
  ['Favorite', 'Favori'],
  ['Food', 'Food'],
  ['Table', 'Tableau'],
  ['Rules', 'Règles'],
  ['Engine', 'Moteur'],
  ['Roles', 'Rôles'],
  ['Strictness', 'Sévérité'],
  ['Filters', 'Filtres'],
  ['Monster', 'Monstre'],
  ['Monsters', 'Monstres'],
  ['Skill', 'Compétence'],
  ['Skills', 'Compétences'],
  ['Total', 'Total'],
  ['Base', 'Base'],
  ['Clear', 'Effacer'],
  ['Reason', 'Raison'],
  ['Ancient', 'Ancienne'],
  ['Equipped runes', 'Runes équipées'],
  ['Equipped monsters', 'Monstres équipés'],
  ['Share Equipped', 'Partager l’équipé'],
  ['Selected only', 'Sélection seulement'],
  ['New tag name', 'Nom du nouveau tag'],
  ['Lv 35+', 'Niv. 35+'],
  ['Lv.', 'Niv.'],
  ['Read-only', 'Lecture seule'],
  ['Optional · expert', 'Optionnel · expert'],
];

export function translateEn(en) {
  if (EXACT[en] != null) return EXACT[en];
  let s = en;
  const sorted = [...PHRASES].sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of sorted) {
    if (s.includes(from)) s = s.split(from).join(to);
  }
  return s;
}
