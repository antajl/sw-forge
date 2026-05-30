// js/core/changelog-data.js — part of core load chain
/**
 * Release notes bundled with the app (Changelog tab → Releases). Roadmap: STATIC_ROADMAP.
 * Each `items[locale]` is a string[] (legacy `{ shipped: [] }` is still read).
 * Entries are newest-first by date. Plain text — the UI escapes HTML (no markdown).
 * Style: each locale uses the same count/order of bullets — thematic only (no shipped build/version strings); section title is always `date` above.
 */
const STATIC_CHANGELOG = [
  {
    date: '2026-05-30',
    items: {
      en: [
        'UI polish: unified vertical spacing (16px) across all Gear sections for consistent layout.',
        'Tab animations: smoother transitions between Dashboard/Table/Rules with fade effect and off-screen slide.',
        'Card styling: unified gradient backgrounds across all tabs (Dashboard, Rules, Guide, Changelog) for consistent visual design.',
        'Ambient glow: moved to body background for consistent lighting across all pages.',
      ],
      ru: [
        'UI: унифицированы вертикальные отступы (16px) во всех разделах Gear для единообразного вида.',
        'Анимации вкладок: плавные переходы между Dashboard/Table/Rules с fade и улетом за экран.',
        'Стиль карточек: унифицированы градиентные фоны во всех вкладках (Dashboard, Rules, Guide, Changelog).',
        'Фоновое свечение: перенесено на body для равномерного освещения на всех страницах.',
      ],
      fr: [
        'UI : espacement vertical unifié (16px) dans toutes les sections Gear.',
        'Animations d\'onglets : transitions fluides entre Dashboard/Table/Rules avec fondu et glissement hors écran.',
        'Style des cartes : arrière-plans dégradés unifiés dans tous les onglets.',
        'Lueur ambiante : déplacée sur le body pour un éclairage constant.',
      ],
    },
  },
  {
    date: '2026-05-28',
    items: {
      en: [
        'Fixed artifact Type category mapping (HP/Attack/Defense/Support) to match SWEX unit_style values; icons now match names.',
        'Fixed artifact Ingame Score calculation for special substats (LifeDrain, Received Crit DMG, Additional Damage by SPD/HP/ATK/DEF).',
        'Fixed phantom artifacts from previous loads showing in table; artifacts now cleared before parsing new data.',
        'Fixed rare case where site could show only header after loading data.',
      ],
      ru: [
        'Исправлен маппинг Type категории артефактов (HP/Attack/Defense/Support) для соответствия unit_style из SWEX; иконки теперь соответствуют названиям.',
        'Исправлен расчёт Ingame Score для артефактов со специальными сабами (LifeDrain, Received Crit DMG, Additional Damage by SPD/HP/ATK/DEF).',
        'Исправлено отображение фантомных артефактов от предыдущих загрузок; артефакты теперь очищаются перед парсингом новых данных.',
        'Исправлен редкий случай, когда сайт показывал только шапку после загрузки данных.',
      ],
      fr: [
        'Corrigé le mapping Type des artefacts (HP/Attack/Defense/Support) pour correspondre aux unit_style SWEX; icônes correspondent aux noms.',
        'Corrigé le calcul Ingame Score pour les sous-stats spéciaux (LifeDrain, Received Crit DMG, Additional Damage by SPD/HP/ATK/DEF).',
        'Corrigé les artefacts fantômes des chargements précédents ; artefacts effacés avant le nouveau parsing.',
        'Corrigé le cas rare où seul l\'en-tête s\'affichait après chargement.',
      ],
    },
  },
  {
    date: '2026-05-27',
    items: {
      en: [
        'Artifacts and Relics tables: sortable headers now match Rune Table behavior; score, role, and location blocks have clearer separators. Top SPD by slot moved into Dashboard → Slots.',
        'Artifacts: Ingame Score switched to per-stat coefficients, with calibration weights exposed as SWRM.ARTIFACT_INGAME_WEIGHTS and a breakdown helper in the console: SWRM.artifactIngameScoreBreakdown(artifact). Forge Score shown as 0–100 in table and dashboard.',
        'All tables: toolbar in one row — search → More Filters → Export CSV / Share; Export CSV added to Artifacts, Relics, and Monsters.',
        'More Filters: columns with category groups on all three tables; Reset only inside the popover; consistent width across Runes, Artifacts, and Relics.',
        'Table count chips moved above the table (right side) — full summary: Ancient, Equipped, +15, Keep, Sell, grades.',
        'Vertical column separators added to Artifacts and Relics tables.',
        'Dashboard → Score: Ingame and Forge charts stacked on one tab; Breakdown: Verdict / Roles / Sets in a grid like Artifacts.',
        'Dashboard → Distributions: Runes | Artifacts toggle. Artifact charts: Verdict, Grade, Type, Role, Attribute, and Score histogram.',
        'Dashboard: artifact Keep/Sell chip colors now match rune Keep/Sell colors.',
        'Monsters: toolbar in one row (Grid/List → search → More Filters → Export / Share); summary cards replaced by chips.',
        'Monsters → Roster: "Needs attention" sorted by minimum devilmon deficit for skills 2+ (auto-attack excluded); click filters the list.',
        'Monsters → Roster: skill-ups count link now opens Skill Plan tab; rune summary row hidden from Roster.',
        'Settings: swapping to an empty database slot loads demo.json on that slot; swapping back restores the saved file.',
        'Teams: import now accepts v2 export JSON and share profile format.',
        'Artifacts and Relics: Share button added to toolbar; verdict hint removed from Runes table toolbar.',
        'Search hints improved for Artifacts ("Search type, role, sub effect…") and Relics.',
        'Updates tab: release dates follow your language — US, European, or Russian format.',
      ],
      ru: [
        'Таблицы артефактов и реликвий: сортировка по заголовкам теперь как у Rune Table; score, role и location разделены понятнее. Top SPD по слотам переехал в Dashboard → Slots.',
        'Артефакты: Ingame Score переведён на коэффициенты для каждого саба; веса для калибровки доступны как SWRM.ARTIFACT_INGAME_WEIGHTS, разбор в консоли: SWRM.artifactIngameScoreBreakdown(artifact). Forge Score 0–100 в таблице и на dashboard.',
        'Все таблицы: тулбар в одну строку — поиск → More Filters → Export CSV / Share; Export CSV у артефактов, реликвий и монстров.',
        'More Filters: колонки по категориям на трёх таблицах; Reset только внутри поповера; одинаковая ширина у Runes, Artifacts и Relics.',
        'Чипы над таблицей справа — полная сводка: Ancient, Equipped, +15, Keep, Sell, грейды.',
        'Вертикальные разделители колонок в таблицах артефактов и реликвий.',
        'Dashboard → Score: графики Ingame и Forge в одной вкладке; Breakdown: Verdict / Roles / Sets сеткой как у артефактов.',
        'Dashboard → Распределения: переключатель Руны | Артефакты. Графики артефактов: вердикт, грейд, тип, роль, стихия, оценка.',
        'Dashboard: цвета Keep/Sell у артефактов как у рун.',
        'Монстры: тулбар в одну строку (Grid/List → поиск → More Filters → Export / Share); карточки заменены чипами.',
        'Roster: «Needs attention» — сортировка по суммарному дефициту скиллов 2+; клик фильтрует список (без storage).',
        'Roster: ссылка skill-ups открывает Skill Plan; строка сводки по рунам скрыта.',
        'Settings: пустой слот → demo.json на этом слоте; возврат на слот с файлом восстанавливает экспорт.',
        'Teams: импорт v2 export и share profile.',
        'Артефакты и реликвии: Share в тулбаре; подсказка Verdict убрана из тулбара рун.',
        'Подсказки поиска для артефактов и реликвий.',
        'Вкладка «Обновления»: даты релизов в формате вашего языка.',
      ],
      fr: [
        'Tables artéfacts et reliques : tri par en-têtes comme la Rune Table ; blocs score, rôle et emplacement mieux séparés. Top VIT par slot passe dans Dashboard → Slots.',
        'Artefacts : Ingame Score passe à des coefficients par stat, avec poids de calibration SWRM.ARTIFACT_INGAME_WEIGHTS et détail console : SWRM.artifactIngameScoreBreakdown(artifact). Forge Score en 0–100.',
        'Tables : barre d’outils sur une ligne — recherche → Plus de filtres → Export CSV / Partager.',
        'Plus de filtres : colonnes par catégorie ; Réinitialiser dans le popover ; largeur uniforme.',
        'Puces au-dessus du tableau (droite) — résumé complet.',
        'Séparateurs verticaux sur artéfacts et reliques.',
        'Dashboard → Score : graphiques Ingame et Forge empilés ; Répartition en grille.',
        'Dashboard → Distributions : Runes | Artefacts.',
        'Couleurs Garder/Vendre alignées sur les runes.',
        'Monstres : barre d’outils sur une ligne ; tuiles remplacées par puces.',
        'Roster : « Needs attention » trié par déficit de compétences 2+.',
        'Lien skill-ups → Skill Plan ; ligne runes masquée.',
        'Paramètres : slot vide → demo.json ; retour restaure le fichier.',
        'Teams : import v2 et profil partagé.',
        'Partage sur artéfacts/reliques ; hint Verdict retiré des runes.',
        'Indices de recherche artéfacts/reliques.',
        'Mises à jour : dates selon la langue.',
      ],
    },
  },
  {
    date: '2026-05-26',
    items: {
      en: [
        'Artifacts: fix Type category parsing (SWEX type=piece kind, unit_style=archetype). Dashboard artifact Verdict chart restyled; Grade/Type/Attribute sorted by count.',
        'Artifacts / Relics table: More Filters — Type and Attribute split, Role filter, active filter chips; relics get Location (Inventory / Equipped).',
        'Dashboard → Distributions: Runes | Artifacts toggle. Type chart counts slot-2 pieces only (HP/Attack/Defense/Support); Attribute chart counts slot-1 by element.',
        'Dashboard → Distributions: Runes | Artifacts toggle. Artifact charts: Verdict (donut), Grade, Type, Role, Attribute, and Score histogram (0–5+).',
        'Rules: split into Runes (Engine / Roles / Verdict) and Artifacts (Roles / Verdict / Synergies). Artifact roles are fully editable with expected main stat and useful sub list.',
        'Artifacts: DEF main on Attack-type pieces no longer auto-assigns Classic DPS when that role requires ATK main — role Unknown or a better match instead.',
        'Artifacts table: one list again (no Type/Attribute split) — same layout as Runes and Relics.',
        'Rules → Artifacts: clearer explanations of what you can tune (useful subs, synergies, Keep thresholds; Role is auto-detected).',
        'Artifacts table: Role and Verdict columns with Keep/Sell filter in More Filters.',
        'Guide: French panels for all sections, like English and Russian.',
        'Rules: Gem, Grind, and Reapp sections stay open; Reapp settings always visible.',
        'Artifact Keep/Sell scoring with role detection; tune thresholds under Rules → Artifacts.',
        'Reapp rules: optional odd slots 1/3/5 with required innate list.',
        'Dashboard: Ingame Score chart and Elite Quality thresholds (85+ elite, 75–84 good).',
        'Table: smoother tab animations; Artifacts and Relics tables match Rune Table styling; Export CSV on gear toolbars.',
        'Runes hub → Table: Runes, Artifacts, and Relics lists with search and filters.',
        'Monsters: artifacts and relics on the detail panel; Share Profile links; Ancient rune glow.',
      ],
      ru: [
        'Артефакты: исправлен разбор Type (SWEX: type — вид слота, unit_style — архетип). Dashboard: Verdict в стиле сайта; Grade/Type/Attribute по убыванию.',
        'Таблицы артефактов / реликвий: More Filters — Type и Attribute отдельно, фильтр Role, чипы активных фильтров; у реликвий — Location.',
        'Dashboard → Распределения: график Type только для слота 2 (HP/Attack/Defense/Support); Attribute — слот 1 по стихии.',
        'Dashboard → Распределения: переключатель Руны | Артефакты. Графики: вердикт, грейд, тип, роль, стихия, оценка (0–5+).',
        'Rules: разделение на Runes (Engine / Roles / Verdict) и Artifacts (Roles / Verdict / Synergies). Роли артефактов настраиваются: main и список полезных сабов.',
        'Артефакты: DEF main на Attack-типе больше не даёт Classic DPS, если у роли задан ATK main — Unknown или другая роль.',
        'Таблица артефактов: снова один общий список (без Type/Attribute), как у рун и реликвий.',
        'Rules → Artifacts: понятнее, что настраивается (полезные сабы, синергии, пороги Keep; Role определяется автоматически).',
        'Таблица артефактов: колонки Role и Verdict, фильтр Keep/Sell в «Ещё фильтры».',
        'Справка: французские панели для всех разделов, как EN и RU.',
        'Rules: секции Gem, Grind и Reapp открыты; настройки Reapp всегда на виду.',
        'Оценка артефактов Keep/Sell с ролями; пороги в Rules → Artifacts.',
        'Reapp: слоты 1/3/5 и список innate для нечётных слотов.',
        'Dashboard: график Ingame Score и пороги Elite Quality (85+ элита, 75–84 хорошо).',
        'Таблица: плавнее переключение вкладок; артефакты и реликвии как у рун; Export CSV.',
        'Runes → Таблица: руны, артефакты, реликвии с поиском и фильтрами.',
        'Монстры: артефакты и реликвии в деталях; Share Profile; свечение Ancient.',
      ],
      fr: [
        'Artefacts : parsing Type corrigé (SWEX type/unit_style). Dashboard : Verdict refait ; Grade/Type/Attribut triés par quantité.',
        'Tables artéfacts / reliques : More Filters — Type et Attribut séparés, filtre Rôle, puces ; reliques : emplacement.',
        'Dashboard → Distributions : graphique Type (emplacement 2) et Attribut (emplacement 1) comptés séparément.',
        'Dashboard → Distributions : bascule Runes | Artefacts. Graphiques verdict, grade, type, rôle, attribut, score (0–5+).',
        'Rules : Runes (Engine / Roles / Verdict) et Artifacts (Roles / Verdict / Synergies). Rôles artefacts éditables avec main attendu et sous-stats utiles.',
        'Artefacts : main DEF sur type Attack n’obtient plus Classic DPS si le rôle exige ATK — Unknown ou autre rôle.',
        'Table artefacts : une seule liste (plus de split Type/Attribute), comme runes et reliques.',
        'Rules → Artifacts : explications plus claires (sous-stats utiles, synergies, seuils ; Rôle auto-détecté).',
        'Table artefacts : colonnes Rôle et Verdict, filtre Garder/Vendre dans Plus de filtres.',
        'Guide : panneaux français pour toutes les sections, comme EN et RU.',
        'Rules : sections Gem, Grind et Reapp ouvertes ; Réapp toujours visible.',
        'Artefacts Garder/Vendre avec rôles ; seuils dans Rules → Artifacts.',
        'Réapp : emplacements impairs 1/3/5 et innée requise.',
        'Dashboard : graphique Ingame Score et seuils Elite Quality (85+ élite, 75–84 bon).',
        'Table : animations d’onglets ; artefacts/reliques alignés sur les runes ; Export CSV.',
        'Hub Runes → Table : runes, artéfacts, reliques avec filtres.',
        'Monstres : artéfacts/reliques au détail ; partage de profil ; lueur Ancient.',
      ],
    },
  },
  {
    date: '2026-05-25',
    items: {
      en: [
        'Artifacts / Relics tables: visual alignment with Rune Table — sticky headers, zebra striping, colgroup-based column widths.',
        'Artifacts table: virtual scrolling (like Rune Table) — renders only visible rows for large datasets.',
        'Skill Plan: search field added to toolbar — filters monsters by name (EN/RU i18n).',
      ],
      ru: [
        'Таблицы Артефактов / Релик: визуальное выравнивание с Таблицей рун — sticky headers, зебра, colgroup для ширин колонок.',
        'Таблица Артефактов: virtual scrolling (как у рун) — рендер только видимых строк для больших наборов данных.',
        'Skill Plan: поле поиска в тулбаре — фильтр монстров по имени (i18n EN/RU).',
      ],
      fr: [
        'Tables Artifacts / Relics : alignement visuel avec la Table des runes — sticky headers, zebra, colgroup pour les largeurs de colonnes.',
        'Table Artifacts : virtual scrolling (comme les runes) — rendu uniquement des lignes visibles pour les grands jeux de données.',
        'Skill Plan : champ de recherche dans la barre d\'outils — filtre des monstres par nom.',
      ],
    },
  },
  {
    date: '2026-05-24',
    items: {
      en: [
        'Rune Table: Ingame column — Com2uS Rating from SWEX (innate + subs with grind, main ignored), same sum-then-round logic as the game; hover for line breakdown. Sort Ingame by slot 1→6 like the in-game rune list.',
        'Rune Table: Location column and filter — monster names when equipped, Inventory otherwise (runes, same idea as artifacts).',
        'Rune Table: default sort stays Forge Score; verdict reasons on hover (no separate Reason column); CSV still exports a Reason field.',
        'Guide (EN/RU) and developer docs updated for Ingame vs Forge vs SWOP Eff% (Eff% only for Depth/dashboard charts).',
        'Header: Donate opens support options (Boosty, Lava.top, USDT TRC-20).',
        'Dashboard: faster return from Table — skips full rebuild when data unchanged; Forge Score cached during processing; Min Lvl / Grade filter changes animate charts like preset switches.',
        'Reload (F5): if SWEX file and verdict settings are unchanged, restores processed runes from IndexedDB instead of re-running the full pipeline.',
        'Reload: dashboard charts appear at full size immediately (no grow animation); Rune Table fills in shortly after via idle scheduling.',
        'Boot: no longer loads embedded demo before your active database slot (fixes double render on F5).',
      ],
      ru: [
        'Таблица рун: колонка Ingame — игровой Rating из SWEX (innate + сабы с гриндом, main не считается), сумма и одно округление как в клиенте; hover — разбивка по линиям. Сортировка Ingame: слоты 1→6 как в игре.',
        'Таблица рун: колонка Location и фильтр — имена монстров / Inventory (как у артефактов).',
        'Таблица рун: сортировка по умолчанию — Forge; причина в тултипе Verdict (отдельной колонки «Причина» нет); в CSV колонка Reason остаётся.',
        'Справка (EN/RU) и docs/ синхронизированы: Ingame vs Forge vs SWOP Eff% (Eff% только для прогрессии и графиков).',
        'Шапка: Donate — Boosty, Lava.top, USDT TRC-20.',
        'Dashboard: быстрый возврат с Таблицы — без полной пересборки при тех же данных; Forge Score кэшируется при обработке; Min Lvl / Grade — анимация графиков как при смене пресета.',
        'F5: при тех же SWEX и настройках вердиктов — восстановление обработанных рун из IndexedDB без полного processAll.',
        'F5: графики Dashboard сразу в финальном виде; таблица рун догружается чуть позже в idle.',
        'Старт: демо не подгружается раньше активного слота — один рендер вместо трёх при F5.',
      ],
      fr: [
        'Table runes : colonne Ingame (Rating Com2uS, comme en jeu) ; tri par slot 1→6.',
        'Table runes : colonne Location + filtre (noms des monstres / inventaire).',
        'Tri par défaut : Forge ; raisons au survol du verdict ; CSV Reason conservé.',
        'Guide et docs mis à jour (Ingame vs Forge vs Eff% SWOP).',
        'En-tête : Donate (Boosty, Lava, crypto USDT TRC-20).',
        'Dashboard : retour rapide depuis la table ; Forge Score mis en cache ; filtres Min Lvl / Grade animés.',
        'Rechargement : si SWEX et réglages inchangés, restauration depuis IndexedDB sans retraitement complet.',
      ],
    },
  },
  {
    date: '2026-05-23',
    items: {
      en: [
        'Monsters → Teams: combat SPD on each slot (base at level + runes/Swift + Sky Tribe Totem and leader % of base). Portraits stay after refresh.',
        'Monster detail Total SPD uses the same formula; totem level is read from modern SWEX (`wizard_skill_list`, skill_id 14). Older exports may still use `deco_list` / `deo_list` with master_id 11001.',
        'Demo sample teams only while the embedded demo dataset is active — they disappear after you load your own SWEX.',
        'App Settings: Share control in the Database slots card; header language is a globe menu (EN / RU / FR).',
      ],
      ru: [
        'Монстры → Teams: боевая скорость на слоте (база на уровне + руны/Swift + % тотема Sky Tribe и лидера от базы). Портреты не пропадают после F5.',
        'Total SPD в карточке монстра — та же формула; уровень тотема из актуального SWEX (`wizard_skill_list`, skill_id 14). Старые файлы — `deco_list` / `deo_list`, master_id 11001.',
        'Демо-составы только в режиме demo-данных — после загрузки своего SWEX удаляются.',
        'Настройки: Share в карточке слотов базы; язык в шапке — иконка глобуса (EN / RU / FR).',
      ],
      fr: [
        'Monstres → Teams : VIT combat par slot (base + runes/Swift + totem Sky Tribe et lead % de la base). Portraits conservés après rechargement.',
        'Total VIT au détail : même formule ; totem lu depuis SWEX récent (`wizard_skill_list`, skill_id 14). Anciens exports : `deco_list` / `deo_list`, master_id 11001.',
        'Équipes démo uniquement avec le jeu de données démo — retirées après import de votre SWEX.',
        'Paramètres : partage dans la carte des slots ; langue via icône globe.',
      ],
    },
  },
  {
    date: '2026-05-22',
    items: {
      en: [
        'Monster portraits, skill icons, leader skills, rune sets, elements, and artifact types load from the site bundle when available — faster repeat visits, less reliance on external image hosts.',
        'Monsters → Skill plan: storage toggle labels fixed, portraits on Stuck skills, “Skill-ups needed” columns; Roster More filters → Not maxed (skill-ups). Artifacts & Relics tables: type icons (SWARFARM). Forge Score tab: distribution slider works.',
        'Shared accounts: banner shows Keep/Sell, roster summary, and up to three unit names that need runes or skill-ups; Teams tab lists their shared squads.',
        'Open someone else\'s SWEX in read-only from a share link, a ?profile= JSON URL, or embedded ?data= export in the address bar.',
        'Artifacts → Table: Location column shows monster names (e.g. Lushen), not #ID numbers.',
        'Awakened monster stars are pink again with a slightly clearer outline.',
        'Faster load after export: cached demo, one bundled stylesheet, rune checks can run in the background.',
        'French UI loads only when you pick FR; fonts are hosted on the site (no Google Fonts).',
      ],
      ru: [
        'Портреты монстров, иконки скиллов, лидер-скиллы, сеты рун, стихии и типы артефактов по возможности грузятся с сайта — быстрее повторные визиты, меньше зависимость от внешних CDN.',
        'Монстры → Skill plan: подписи Storage, портреты в «застрявших», колонки «нужно skill-up»; в Ростере More filters — «не на макс. (нужны skill-up)». Таблицы артефактов и реликтов: иконки типов. Forge Score: ползунок вкладок.',
        'Чужой аккаунт: в баннере Keep/Sell, сводка по монстрам и до трёх имён юнитов без рун или со skill-up; на Teams — их расшаренные отряды.',
        'Чужой SWEX в режиме только просмотра: ссылка share, ?profile= на JSON или ?data= в адресной строке.',
        'Артефакты → Таблица: в Location — имена монстров, а не #номера.',
        'Звёзды эвейкнутых снова розовые, обводка чуть заметнее.',
        'Быстрее после загрузки экспорта: кэш демо, один CSS, проверка рун может идти в фоне.',
        'Французский интерфейс только при выборе FR; шрифты с сайта, без Google Fonts.',
      ],
    },
  },
  {
    date: '2026-05-21',
    items: {
      en: [
        'Forge Score column in the Rune Table: separate 0–100 rating from main-tier values, sub-tier values (different ranking), main↔sub synergy (+/−), sub↔sub pairs, duplicate-sub penalty, and a small innate term — not Eff% and not verdict.',
        'Guide → Rune Table documents Forge Score vs Ingame Rating; hover Forge for a point breakdown.',
        'Monsters → Roster: Box overview strip with clickable tiles (unruned, incomplete sets, 6/6, skill-ups, storage) and a readiness summary line.',
        'Fix: a JavaScript syntax error in the score module could block the whole app (tabs and UI frozen) until reload after rebuild.',
      ],
      ru: [
        'Колонка Forge Score в таблице рун: отдельная шкала 0–100 — ценность main и sub (разные рейтинги), синергии main↔sub (+/−), пары сабов, штраф за дубли, слабый innate; не Eff% и не вердикт.',
        'Guide → Таблица рун: Forge Score vs Ingame; подсказка при наведении на Forge.',
        'Монстры → Roster: полоса «обзор коробки» с плитками (без рун, неполный сет, 6/6, skill-ups, склад) и строка готовности.',
        'Исправление: синтаксическая ошибка в модуле Score могла ломать весь интерфейс (вкладки не переключались) до пересборки.',
      ],
      fr: [
        'Colonne Forge Score : note 0–100 séparée (tiers main/sub, synergies, paires, doublons, innate léger) — pas Eff% ni verdict.',
        'Guide → Table runes : Forge Score vs Ingame ; infobulle sur Forge.',
        'Monstres → Roster : bandeau « vue boîte » avec tuiles cliquables et ligne de readiness.',
        'Correctif : erreur de syntaxe JS dans le module Score pouvait bloquer toute l\'app.',
      ],
    },
  },
  {
    date: '2026-05-19',
    items: {
      en: [
        'Monsters tab: expanded filters, table/card views, bulk actions, rune slots on cards, skill-up hints, Teams builder in localStorage.',
        'Rune table: equipped-monster filter from monster detail, roster summary chips above the grid, filter popovers aligned with Monsters toolbar.',
        'Rules / engine tweaks for gem and grind display; relic and artifact effect label maps from SW-Exporter.',
      ],
      ru: [
        'Вкладка Монстры: фильтры, таблица/карточки, bulk, слоты рун, подсказки skill-up, Teams в localStorage.',
        'Таблица рун: фильтр по монстру с деталки, чипы сводки над таблицей, поповеры фильтров как у Monsters.',
        'Правки gem/grind; карты подписей артефактов и реликтов по SW-Exporter.',
      ],
      fr: [
        'Onglet Monstres : filtres, vues, bulk, Teams.',
        'Table runes : chips résumé, filtres monstre.',
        'Cartes libellés artéfacts/reliques.',
      ],
    },
  },
  {
    date: '2026-05-18',
    items: {
      en: [
        'Dashboard Top SPD: hexagon “strength” chart for slots 1–6 — peak sub SPD per slot for the selected set, scaled to the best slot; weaker slots highlighted in orange.',
        'Top SPD layout: radar sits beside the top-3 SPD chips per slot; changing the set updates both views.',
      ],
      ru: [
        'Top SPD на дашборде: «многоугольник силы» по слотам 1–6 — пик саб SPD в выбранном сете, шкала от лучшего слота; слабые слоты подсвечены оранжевым.',
        'Блок Top SPD: радар рядом с топ-3 чипами по слотам; смена сета обновляет оба вида.',
      ],
      fr: [
        'Top VIT : hexagone « force » par emplacements 1–6 — pic sous-stat pour le set choisi, échelle = meilleur emplacement ; emplacements faibles en orange.',
        'Bloc Top VIT : radar à côté des 3 meilleures runes par emplacement ; le set met à jour les deux vues.',
      ],
    },
  },
  {
    date: '2026-05-17',
    items: {
      en: [
        'Header theme control is now one sun / moon slider (tap toggles light / dark); the square highlight slides to the active side with yellow sun or blue moon on the selected mode only.',
        'Rune Table Target for Sell verdicts shows the first engine reason (no role, Duo near-miss, Exclude blocking a role, bad flat, low eff); role filter label uses God Roll instead of High Roll.',
      ],
      ru: [
        'Тема в шапке — один переключатель-слайдер солнце / луна (тап меняет светлую и тёмную); квадратная подсветка едет к активной стороне, жёлтое солнце или голубая луна только у выбранного режима.',
        'Target в таблице для Sell показывает первую причину из движка (нет роли, почти Duo, Exclude блокирует роль, плохой flat, низкий eff); в фильтре ролей подпись God Roll вместо High Roll.',
      ],
      fr: [
        'Thème d\'en-tête : un seul curseur soleil / lune (bascule clair / sombre) ; surbrillance carrée côté actif, soleil jaune ou lune bleue seulement sur le mode choisi.',
        'Colonne Target pour Sell : première raison moteur (pas de rôle, Duo presque, Exclude bloque un rôle, flat faible, eff bas) ; filtre rôle affiche God Roll au lieu de High Roll.',
      ],
    },
  },
  {
    date: '2026-05-16',
    items: {
      en: [
        'Spreadsheet-aligned thresholds: sub values use roll + grind (as on the rune); Duo preview is 8 stats × stage×grade (HR × (1 − Duo%)); Duo match uses the sheet pair list; Require HR checks any of the four sub lines; God rescue uses the God line per sub line.',
        'Rune Table shows total sub value with [grind bonus] in brackets; Guide, Engine copy, and README updated for God vs High Roll vs Duo.',
        'UI polish: dark theme default, unified content width, Rune Rules chrome aligned with Account progression; light-theme gradients on depth cards; App Settings layout and FR labels.',
      ],
      ru: [
        'Пороги как в таблице: сабы = ролл + гринд; превью Duo — 8 статов × стадия×грейд; Duo по списку пар; Require HR — любая из четырёх строк сабов; God-спасение — линия God по строке саба.',
        'Таблица рун: итог саба и [бонус гринда] в скобках; обновлены Guide, подписи Engine и README (God / High Roll / Duo).',
        'Интерфейс: тёмная тема по умолчанию, единая ширина контента, chrome «Правила рун» как у прогресса; градиенты в светлой теме; настройки приложения и FR.',
      ],
      fr: [
        'Seuils alignés tableur : sous-stat = roll + meule ; aperçu Duo 8 stats × stade×grade ; paires Duo comme la feuille ; Require HR sur une des 4 lignes ; sauvetage God ligne par ligne.',
        'Table runes : total affiché et [bonus meule] entre crochets ; Guide, Engine et README mis à jour.',
        'UI : thème sombre par défaut, largeur unifiée, chrome Règles runes ; cartes profondeur en thème clair ; Paramètres app.',
      ],
    },
  },
  {
    date: '2026-05-12',
    items: {
      en: [
        'Engine ↔ spreadsheet parity: thresholds, God/Duo, Legend, Reapp, Fast CC / Bomber / Bruiser / Classic with silent migrations; optional mode skips internal exporter-eff comparisons while the UI still surfaces true eff.',
        'Dashboard and rune table: verdict flow and Copy summary match the charts; full set inventory and sorted distributions; heavy-SWEX UX (toolbar, sticky grid, `#runetable`, CSV, dense row typography on desktop); first-run JSON drag-drop; guide sections remember the session anchor.',
        'SWEX foundations kept: stat IDs and per-rune exporter efficiency for audits; Gem / Grind / Reapp align with Require HR vs Min Stats and Late×HR grind pacing.',
      ],
      ru: [
        'Движок и таблица согласованы: God/Duo, Legend, Reapp, пресеты Fast CC / Bomber / Bruiser / Classic с миграциями профилей; есть режим, где расчёт не опирается на eff из JSON, а интерфейс всё равно показывает фактический eff.',
        'Дашборд и таблица рун: вердикты и Copy summary совпадают с графиками; полный список сетов и сортированные распределения; режим большого SWEX (тулбар, липкая сетка, `#runetable`, CSV, плотная типографика строк на широком экране); первый запуск через drag‑and‑drop `.json`; гайд по разделам с якорем на сессию.',
        'Совместимость с экспортом: ID статов и efficiency на руне; карточки Gem/Grind/Reapp следуют Min Stats / Require HR и цепочке grind к позднему порогу.',
      ],
      fr: [
        'Alignement tableur : seuils God/Duo, Legend, Reapp et archétypes Fast CC / Bomber / Bruiser / Classic migrés sans friction ; mode diagnostic qui évite les comparaisons eff internes tout en reflétant l’efficience réelle.',
        'Dashboard et liste runes : verdicts et copier‑synthèse fidèles aux graphes ; inventaire complet des sets et distributions triées ; prêt aux gros SWEX (toolbar, grille sticky, lien `#runetable`, CSV, lignes resserrées sur grand écran) ; onboarding par glisser‑déposer `.json` ; guide segmenté avec ancrage de session.',
        'Socle SWEX préservé : identifiants stats et eff export rune par rune pour audit ; Gem / Meule / Réapp restent sous Require HR vs Min Stats avec cadence grind Late×HR.',
      ],
    },
  },
  {
    date: '2026-05-11',
    items: {
      en: [
        'Formula layer is canonical: six archetypes plus Min Stats (Include subs at HR for stage×grade), Gem/Reapp tightened for Legend/meta, one-shot migrations for older saves.',
        'Additional SWEX set IDs recognized; exporter efficiency stays on each rune to compare with the app.',
      ],
      ru: [
        'Формулы — единый источник правды: шесть архетипов и Min Stats с учётом HR для стадии×грейда, Gem/Reapp жёстче для Legend и меты, миграция профилей одним проходом.',
        'Расширен список set_id из SWEX; efficiency экспортёра остаётся на руне для сверки с приложением.',
      ],
      fr: [
        'Les formules font foi : six archétypes + Min Stats (lignes « Include » au niveau HR stade×grade), Gem/Réapp resserrés Legend/meta, migration unique des sauvegardes.',
        'Mapping set_id SWEX élargi ; efficience export conservée rune par rune pour contrôle.',
      ],
    },
  },
  {
    date: '2026-05-09',
    items: {
      en: [
        'Account progression on the dashboard: clearer wording and less clutter around the preset and filters.',
        'Persisted settings: unused engine fields removed; Constants use clearer percent UX; Releases tab ships only bundled notes (no browser-only changelog storage).',
      ],
      ru: [
        'Полоска прогресса аккаунта аккуратнее описана и не перебивает пресеты и фильтры.',
        'Чистка настроек и Constants: убраны неиспользуемые поля движка, процентный ввод и подсказки читаются проще; во вкладке Releases только текст из сборки, без локального журнала в браузере.',
      ],
      fr: [
        'Bandeau progression nettoyé : moins de bruit lumineux autour filtres/préréglages.',
        'Grand ménage des réglages : clés fantômes supprimées, Constants retrouvent des pourcents lisibles ; onglet Releases limité aux notes figées incluses avec la livraison.',
      ],
    },
  },
];

/**
 * Roadmap (Changelog → Roadmap). Short copy of docs/PLANS.md for players — same sections, plain game terms (no paths/API).
 * Sync en + ru with PLANS after edits. Shipped work stays in Releases only.
 */
const STATIC_ROADMAP = {
  en: {
    intro:
      'What we plan next — not a release schedule. Top = sooner. Runes stay the core; Monsters = your whole box at a glance. Everything runs in the browser on your file.',
    sections: [
      {
        id: 'monsters-account',
        kicker: 'Monsters',
        title: 'Account-wide planning',
        phase: 'High',
        lead: 'A plan for the whole monster box — not only icons in each row.',
        items: [
          'Fusion tracker: what you can build from monsters you already have',
          'Build ideas (lite): rune picks from inventory for a unit → open in the rune table',
          'Teams: optional polish (in-battle speed buff toggle, clearer slowest-slot gap)',
        ],
      },
      {
        id: 'monsters-dashboard',
        kicker: 'Monsters',
        title: 'Dashboard tab',
        phase: 'Medium term',
        lead: 'Optional extra sub-tab: Dashboard | Roster | Teams.',
        items: [
          'Box score and a few bars (6/6, skill-up debt, optional rune quality)',
          'Charts you can click — element, role, runes, skills → filtered monster list',
          'Teams strip: squads missing 6/6 on a slot',
          'Link from rune overview: strong rune box but many 6★ still not fully runed',
        ],
      },
      {
        id: 'share',
        kicker: 'Share',
        title: 'Shared accounts',
        phase: 'Partial',
        lead: 'Read-only share links already work. Next: mentor jumps straight to the right list.',
        items: [
          'From the mentor banner → filtered monster list (skill-up queue, unruned, etc.)',
        ],
      },
      {
        id: 'runes',
        kicker: 'Runes',
        title: 'Rune table',
        phase: 'Planned',
        items: [
          'Compare two saved exports — see how Keep/Sell and roles changed',
          'Optional stricter Grind hints (speed tuning and Hit Rate subs)',
        ],
      },
      {
        id: 'monsters-roster',
        kicker: 'Monsters',
        title: 'Roster depth',
        phase: 'Later',
        items: [
          'Compare two monsters side by side (stats, skills, six rune slots)',
          'Duplicate Nat5 hint — two identical naturals, food candidate?',
          'Content tags on units (RTA, Siege, ToA) and filter by tag',
        ],
      },
      {
        id: 'artifacts',
        kicker: 'Artifacts & relics',
        title: 'Gear advice',
        phase: 'Partial',
        lead: 'Gear tables and inventory work; Keep/Sell rules for artifacts and relics are not built yet.',
        items: [
          'Keep/Sell-style rules for artifacts and relics (separate from runes)',
          'Optional own top tab, or stay under Runes',
          'More relic type names confirmed with the community',
          'Relic icons: in-game screenshots → PNG files in assets/relics/ (manual, by you)',
        ],
      },
      {
        id: 'guide-i18n',
        kicker: 'Guide & language',
        title: 'Help & French',
        phase: 'Ongoing',
        items: [
          'French Guide text for Monsters (Artifacts later)',
          'More French labels on Monsters screens',
        ],
      },
      {
        id: 'builders',
        kicker: 'Long horizon',
        title: 'Draft & speed tools',
        phase: 'Exploratory',
        lead: 'Only if SW Forge grows beyond rune review — not a full SWOP-style optimizer.',
        items: [
          'RTA / Arena / Siege pick helpers from your box',
          'Turn order and speed notes from export stats (approximate; how to build this is still open)',
        ],
      },
    ],
    outOfScope: {
      title: 'Out of scope',
      items: [
        'Our own backend, cloud accounts, or hosted profile database',
        'Community drop logs (Cairos / Rift / SD)',
        'Full SWARFARM bestiary clone — link to swarfarm.com for multipliers and reference',
        'Million-permutation rune optimizer (SWOP / SWLens class tools)',
      ],
    },
  },
  ru: {
    intro:
      'Что планируем дальше — не график релизов. Сверху вниз — по приоритету. Ядро — руны; Монстры — вся коробка. Всё в браузере, на вашем файле экспорта.',
    sections: [
      {
        id: 'monsters-account',
        kicker: 'Монстры',
        title: 'Планирование по аккаунту',
        phase: 'Высокий',
        lead: 'План на всю коробку — не только иконки в строке.',
        items: [
          'Трекер fusion / hexagram — что можно собрать из того, что уже есть',
          'Подбор рун (lite): идеи из инвентаря под юнита → таблица рун',
          'Teams: опционально — баф скорости в бою, нагляднее разрыв с самым медленным слотом',
        ],
      },
      {
        id: 'monsters-dashboard',
        kicker: 'Монстры',
        title: 'Вкладка Dashboard',
        phase: 'Средний срок',
        lead: 'Опционально третья подвкладка: Dashboard | Roster | Teams.',
        items: [
          'Балл коробки и несколько шкал (6/6, долг skill-up, опционально качество рун)',
          'Графики с кликом: стихия, роль, руны, скиллы → отфильтрованный список монстров',
          'Полоска Teams: составы без 6/6 на слоте',
          'Связка с обзором рун: сильная коробка рун, но много 6★ без полного сета',
        ],
      },
      {
        id: 'share',
        kicker: 'Share',
        title: 'Чужой аккаунт',
        phase: 'Частично',
        lead: 'Ссылки «только просмотр» уже есть. Дальше — наставник сразу попадает в нужный список.',
        items: [
          'Из баннера наставника → отфильтрованный список монстров (очередь skill-up, без рун и т.д.)',
        ],
      },
      {
        id: 'runes',
        kicker: 'Руны',
        title: 'Таблица рун',
        phase: 'В планах',
        items: [
          'Сравнение двух сохранённых экспортов — как изменились Keep/Sell и роли',
          'Опционально строже подсказки к Grind (прокачка скорости и подстаты Hit Rate)',
        ],
      },
      {
        id: 'monsters-roster',
        kicker: 'Монстры',
        title: 'Углубление списка',
        phase: 'Позже',
        items: [
          'Два монстра рядом: статы, скиллы, шесть слотов рун',
          'Подсказка «дубликат Nat5» — два одинаковых, кандидат в food?',
          'Теги контента (RTA, Siege, ToA) и фильтр по тегу',
        ],
      },
      {
        id: 'artifacts',
        kicker: 'Артефакты и реликты',
        title: 'Советы по gear',
        phase: 'Частично',
        lead: 'Таблицы и инвентарь работают; Keep/Sell для артефактов и реликтов ещё нет.',
        items: [
          'Правила Keep/Sell для артефактов и реликтов (отдельно от рун)',
          'Своя верхняя вкладка (опционально) или оставить под Рунами',
          'Больше подтверждённых названий типов реликтов',
        ],
      },
      {
        id: 'guide-i18n',
        kicker: 'Guide и язык',
        title: 'Справка и французский',
        phase: 'Постоянно',
        items: [
          'Французский Guide для Монстров (Артефакты позже)',
          'Больше французских подписей на экранах Монстров',
        ],
      },
      {
        id: 'builders',
        kicker: 'Долгий горизонт',
        title: 'Драфт и скорость',
        phase: 'Исследование',
        lead: 'Только если SW Forge вырастет за пределы рун — не полный SWOP.',
        items: [
          'Помощники пика RTA / Arena / Siege из вашей коробки',
          'Заметки по порядку ходов и скорости по статам экспорта (приблизительно; как сделать — пока не ясно)',
        ],
      },
    ],
    outOfScope: {
      title: 'Вне scope',
      items: [
        'Свой бэкенд, облачные аккаунты, база профилей на нашем сервере',
        'Логи дропа комьюнити (Cairos / Rift / SD)',
        'Полный клон бестиария SWARFARM — ссылки на swarfarm.com',
        'Оптимизатор рун на миллионы перестановок (класс SWOP / SWLens)',
      ],
    },
  },
  fr: {
    intro:
      'Pistes à venir — pas un calendrier. Haut = priorité. Runes = cœur ; Monstres = vue boîte. Tout dans le navigateur, sur votre fichier.',
    sections: [
      {
        id: 'monsters-account',
        kicker: 'Monstres',
        title: 'Planification compte',
        phase: 'Priorité haute',
        lead: 'Un plan pour toute la boîte — pas seulement les icônes par ligne.',
        items: [
          'Suivi fusion / hexagram depuis votre boîte',
          'Idées de runes (lite) depuis l’inventaire → table runes',
          'Teams : optionnel — buff vitesse en combat, écart vs slot le plus lent',
        ],
      },
      {
        id: 'monsters-dashboard',
        kicker: 'Monstres',
        title: 'Onglet Dashboard',
        phase: 'Moyen terme',
        lead: 'Sous-onglet optionnel : Dashboard | Roster | Teams.',
        items: [
          'Score boîte et barres (6/6, dette skill-ups, qualité runes optionnelle)',
          'Graphiques cliquables → liste filtrée',
          'Bandeau Teams : escouades sans 6/6 sur un slot',
          'Lien avec l’aperçu runes : boîte forte mais 6★ pas tous runés',
        ],
      },
      {
        id: 'share',
        kicker: 'Partage',
        title: 'Comptes partagés',
        phase: 'Partiel',
        lead: 'Liens lecture seule OK. Suite : le mentor ouvre la bonne liste.',
        items: [
          'Bannière mentor → liste de monstres filtrée (skill-ups, sans runes…)',
        ],
      },
      {
        id: 'runes',
        kicker: 'Runes',
        title: 'Table runes',
        phase: 'Prévu',
        items: [
          'Comparer deux exports — évolution Keep/Sell et rôles',
          'Meule plus stricte (option) : vitesse et sous-stats Hit Rate',
        ],
      },
      {
        id: 'monsters-roster',
        kicker: 'Monstres',
        title: 'Liste avancée',
        phase: 'Plus tard',
        items: [
          'Deux monstres côte à côte (stats, skills, 6 slots)',
          'Alerte doublon Nat5',
          'Tags contenu (RTA, Siege, ToA) + filtre',
        ],
      },
      {
        id: 'artifacts',
        kicker: 'Artéfacts & reliques',
        title: 'Conseils gear',
        phase: 'Partiel',
        lead: 'Tables OK ; pas encore de Keep/Sell pour artéfacts et reliques.',
        items: [
          'Règles Keep/Sell artéfacts/reliques (à part des runes)',
          'Onglet dédié (option) ou sous Runes',
          'Plus de noms de types de reliques confirmés',
        ],
      },
      {
        id: 'guide-i18n',
        kicker: 'Guide & langue',
        title: 'Aide & français',
        phase: 'Continu',
        items: [
          'Guide FR Monstres (Artéfacts plus tard)',
          'Plus de libellés FR sur Monstres',
        ],
      },
      {
        id: 'builders',
        kicker: 'Horizon',
        title: 'Draft & vitesse',
        phase: 'Exploratoire',
        lead: 'Si SW Forge dépasse l’avis runes — pas un SWOP complet.',
        items: [
          'Aides pick RTA / Arène / Siege depuis votre boîte',
          'Notes ordre de tour / vitesse (approximatif ; conception ouverte)',
        ],
      },
    ],
    outOfScope: {
      title: 'Hors scope',
      items: [
        'Backend propre, comptes cloud, base de profils hébergée',
        'Logs de drop communautaires',
        'Clone complet du bestiaire SWARFARM',
        'Optimiseur runes type SWOP / SWLens',
      ],
    },
  },
};
