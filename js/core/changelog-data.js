// js/core/changelog-data.js — part of core load chain
/**
 * Release notes bundled with the app (Changelog tab → Releases). Roadmap: STATIC_ROADMAP.
 * Each `items[locale]` is a string[] (legacy `{ shipped: [] }` is still read).
 * Entries are newest-first by date. Plain text — the UI escapes HTML (no markdown).
 * Style: each locale uses the same count/order of bullets — thematic only (no shipped build/version strings); section title is always `date` above.
 */
const STATIC_CHANGELOG = [
  {
    date: '2026-05-22',
    items: {
      en: [
        'Monsters → Skill plan: storage toggle labels fixed, portraits on Stuck skills, “Skill-ups needed” columns; Roster More filters → Not maxed (skill-ups). Artifacts & Relics tables: type icons (SWARFARM). Forge Score tab: distribution slider works.',
        'Shared accounts: banner shows Keep/Sell, roster summary, and up to three unit names that need runes or skill-ups; Teams tab lists their shared squads.',
        'Open someone else\'s SWEX in read-only from a share link, a ?profile= JSON URL, or embedded ?data= export in the address bar.',
        'Artifacts → Table: Location column shows monster names (e.g. Lushen), not #ID numbers.',
        'Awakened monster stars are pink again with a slightly clearer outline.',
        'Faster load after export: cached demo, one bundled stylesheet, rune checks can run in the background.',
        'French UI loads only when you pick FR; fonts are hosted on the site (no Google Fonts).',
      ],
      ru: [
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
        'Guide → Rune Table documents Forge Score vs Eff%; hover Score for a point breakdown.',
        'Monsters → Roster: Box overview strip with clickable tiles (unruned, incomplete sets, 6/6, skill-ups, storage) and a readiness summary line.',
        'Fix: a JavaScript syntax error in the score module could block the whole app (tabs and UI frozen) until reload after rebuild.',
        'Project layout: UI split into gear/ (artifact & relic tables), teams/, and monsters/box-overview modules; docs in docs/FEATURES.md.',
      ],
      ru: [
        'Колонка Forge Score в таблице рун: отдельная шкала 0–100 — ценность main и sub (разные рейтинги), синергии main↔sub (+/−), пары сабов, штраф за дубли, слабый innate; не Eff% и не вердикт.',
        'Guide → Таблица рун: раздел Forge Score vs Eff%; подсказка при наведении на Score.',
        'Монстры → Roster: полоса «обзор коробки» с плитками (без рун, неполный сет, 6/6, skill-ups, склад) и строка готовности.',
        'Исправление: синтаксическая ошибка в модуле Score могла ломать весь интерфейс (вкладки не переключались) до пересборки.',
        'Структура: модули gear/, teams/, monsters/box-overview; описание в docs/FEATURES.md.',
      ],
      fr: [
        'Colonne Forge Score : note 0–100 séparée (tiers main/sub, synergies, paires, doublons, innate léger) — pas Eff% ni verdict.',
        'Guide → Table runes : Forge Score vs Eff% ; infobulle sur Score.',
        'Monstres → Roster : bandeau « vue boîte » avec tuiles cliquables et ligne de readiness.',
        'Correctif : erreur de syntaxe JS dans le module Score pouvait bloquer toute l’app.',
        'Découpe des sources : dossiers gear/, teams/, box-overview.',
      ],
    },
  },
  {
    date: '2026-05-20',
    items: {
      en: [
        'Runes hub → Table: three inventory tabs — Runes, Artifacts, Relics — each with search, filters, and full-width tables; relic Grade column removed (not in SWEX).',
        'Monsters: artifacts and relics on the detail panel (main + subs); SWEX gear parsing with user-confirmed relic labels; monster card stats layout and toggle (base / +gear / total).',
        'Share Profile via Cloudflare Worker + D1 (read-only links, multiple export modes); PNG logos and favicon set.',
        'Ancient rune grade glow (Legend/Hero/Rare tint); Main column label shortened to Main.',
        'Developer: js/features reorganized (gear/, teams/, runes/, monsters/); npm run build:ui.',
      ],
      ru: [
        'Runes → Таблица: три вкладки инвентаря — руны, артефакты, реликты — поиск, фильтры, таблица на всю ширину; колонка Grade у реликтов убрана (нет в SWEX).',
        'Монстры: артефакты и реликты в панели деталей; парсинг gear из SWEX и подтверждённые подписи реликтов; статы на карточке и переключатель base / +gear / total.',
        'Share Profile через Cloudflare Worker + D1; логотипы PNG и favicon.',
        'Свечение грейда Ancient; колонка Main вместо Main stat.',
        'Разработка: реорганизация js/features (gear/, teams/, runes/, monsters/); npm run build:ui.',
      ],
      fr: [
        'Hub Runes → trois onglets inventaire (runes, artéfacts, reliques) avec filtres et tableaux pleine largeur.',
        'Monstres : artéfacts/reliques au détail ; parsing SWEX gear.',
        'Partage de profil via Worker ; logos PNG.',
        'Lueur grade Ancient ; colonne Main.',
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
        'Developer workflow: UI script split into feature folders under js/features/ with a rebuild step into js/ui.js; settings and CSS already modular.',
      ],
      ru: [
        'Тема в шапке — один переключатель-слайдер солнце / луна (тап меняет светлую и тёмную); квадратная подсветка едет к активной стороне, жёлтое солнце или голубая луна только у выбранного режима.',
        'Target в таблице для Sell показывает первую причину из движка (нет роли, почти Duo, Exclude блокирует роль, плохой flat, низкий eff); в фильтре ролей подпись God Roll вместо High Roll.',
        'Для разработки: UI разбит на feature-папки в js/features/ со сборкой в js/ui.js; settings и CSS уже модульные.',
      ],
      fr: [
        'Thème d’en-tête : un seul curseur soleil / lune (bascule clair / sombre) ; surbrillance carrée côté actif, soleil jaune ou lune bleue seulement sur le mode choisi.',
        'Colonne Target pour Sell : première raison moteur (pas de rôle, Duo presque, Exclude bloque un rôle, flat faible, eff bas) ; filtre rôle affiche God Roll au lieu de High Roll.',
        'Workflow dev : UI découpé en dossiers js/features/ avec rebuild vers js/ui.js ; settings et CSS déjà modulaires.',
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
          'Teams: deck notes, squad readiness, speed gaps from export stats',
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
          'Teams: заметки к декам, готовность пачки, разрывы по скорости по статам из экспорта',
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
          'Teams : notes, préparation d’escouade, écarts de vitesse (stats export)',
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
