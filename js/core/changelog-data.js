// js/core/changelog-data.js — part of core load chain
/**
 * Release notes bundled with the app (Changelog tab → Releases). Roadmap: STATIC_ROADMAP.
 * Each `items[locale]` is a string[] (legacy `{ shipped: [] }` is still read).
 * Entries are newest-first by date. Plain text — the UI escapes HTML (no markdown).
 * Style: each locale uses the same count/order of bullets — thematic only (no shipped build/version strings); section title is always `date` above.
 */
const STATIC_CHANGELOG = [
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
 * Roadmap (Changelog → Roadmap). Structured sections; rendered like Guide cards.
 * Full docs: docs/PLANS.md · Monsters: docs/PLANS-MONSTERS.md
 * Shipped Monsters MVP (roster, filters, Teams, bulk, Guide tab, Runes dashboard, etc.) is intentionally omitted here.
 */
const STATIC_ROADMAP = {
  en: {
    intro:
      'What we plan next — not a release schedule. Ordered by priority (top = do first). Runes stay the core; Monsters grows into a real box overview. Browser-only unless noted.',
    sections: [
      {
        id: 'monsters-overview',
        kicker: 'Monsters',
        title: 'Box overview (phase 1)',
        phase: 'Near term',
        lead: 'Expand today’s summary chips into an at-a-glance “what needs attention” strip on Roster.',
        items: [
          'Clickable tiles: unruned · partial runes · 6/6 · needs skill-ups · in storage',
          'One Box readiness score (e.g. % of six-stars with full rune sets)',
          'Next actions line: “12 unruned · 47 skill-up levels · 8 in storage without runes”',
          'Each tile opens Roster with the matching filter',
        ],
      },
      {
        id: 'monsters-account',
        kicker: 'Monsters',
        title: 'Account-wide planning',
        phase: 'High',
        lead: 'Lessons from SWARFARM: players want a plan for the whole box, not only per-row icons.',
        items: [
          'Devilmon & skill-up planner: priority Nat5/Nat4, total levels to max, “stuck at 3/7” list',
          'Fusion / hexagram tracker: what you can fuse from current box',
          'Monster Builder (lite): suggest inventory runes for an archetype → open in Rune Table (not a full SWOP optimizer)',
          'Richer Teams: saved decks + notes in localStorage; squad readiness and speed-gap hints (SWEX stats, labeled as export-based)',
        ],
      },
      {
        id: 'monsters-dashboard',
        kicker: 'Monsters',
        title: 'Dashboard tab (phase 2)',
        phase: 'Medium term',
        lead: 'Optional third sub-tab — Dashboard | Roster | Teams — mirroring Runes, but for units not verdicts.',
        items: [
          'Top: box score + 2–3 bars (6/6 coverage, skill-up debt, optional avg rune quality on units)',
          'Clickable breakdown charts: element, role, rune state, skill state → filtered Roster',
          'Teams strip: how many saved squads have slots without 6/6 → jump to Teams',
          'Cross-link from Runes depth: “Rune box 68/100 — but 140 six-stars still without 6/6”',
        ],
      },
      {
        id: 'share',
        kicker: 'Share',
        title: 'Profiles & account review',
        phase: 'Planned',
        lead: 'Frontend-only on GitHub Pages — no SW Forge backend.',
        items: [
          'Read-only share URL: external JSON (?profile=) or compressed payload (?data=)',
          'Account review view for mentors: roster summary + rune highlights',
          'Share modes already in App Settings wired to stable public links',
        ],
      },
      {
        id: 'runes',
        kicker: 'Runes',
        title: 'Table & engine',
        phase: 'Planned',
        items: [
          'Rune Score column — sortable strength signal, documented, not a second Sell',
          'Compare two Database Slots — verdict & role diff between exports',
          'God-potential hint on the row (informational)',
          'Optional stricter Grind rule (eff / HR subs)',
        ],
      },
      {
        id: 'monsters-roster',
        kicker: 'Monsters',
        title: 'Roster depth',
        phase: 'Later',
        items: [
          'Compare two units side-by-side (stats, skills, six slots)',
          'Duplicate Nat5 hint (“two identical — food candidate?”)',
          'Saved filter presets: skill-up queue, unruned six-stars, RTA-tagged units',
          'Content tags on units (RTA, Siege, ToA) + filter by tag',
        ],
      },
      {
        id: 'artifacts',
        kicker: 'Artifacts',
        title: 'Dedicated tab',
        phase: 'Large scope',
        items: [
          'Parse artifacts from SWEX',
          'Filters and table UX parallel to runes',
          'Separate rules engine (not mixed into rune verdicts)',
        ],
      },
      {
        id: 'guide-i18n',
        kicker: 'Guide & i18n',
        title: 'Documentation',
        phase: 'Ongoing',
        items: [
          'French Guide bodies for Monsters (and Artifacts when that tab exists)',
          'More FR UI strings on Monsters toolbar and filters',
        ],
      },
      {
        id: 'builders',
        kicker: 'Long horizon',
        title: 'Content builders',
        phase: 'Exploratory',
        lead: 'Only if SW Forge becomes a broader hub — competes with SWLens/SWOP territory.',
        items: [
          'RTA / Arena / Siege draft helpers from your own box',
          'Turn-order / speed notes on top of SWEX stats (honest “not in-game exact”)',
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
      'Что планируем дальше — не график релизов. Сверху вниз — по приоритету (важнее → раньше). Ядро — руны; Монстры — обзор коробки. Только в браузере, если не указано иное.',
    sections: [
      {
        id: 'monsters-overview',
        kicker: 'Монстры',
        title: 'Обзор коробки (фаза 1)',
        phase: 'Ближайшее',
        lead: 'Развить текущие чипы сводки в полосу «на что смотреть сегодня» над Roster.',
        items: [
          'Кликабельные плитки: без рун · частично · 6/6 · нужны skill-ups · в складе',
          'Один балл готовности коробки (например % 6★ с полными сетами)',
          'Строка действий: «12 без рун · 47 уровней skill-up · 8 в storage без рун»',
          'Клик по плитке → Roster с нужным фильтром',
        ],
      },
      {
        id: 'monsters-account',
        kicker: 'Монстры',
        title: 'Планирование по аккаунту',
        phase: 'Высокий',
        lead: 'Урок SWARFARM: нужен план на всю коробку, не только иконки в строке.',
        items: [
          'Планировщик девилмонов и skill-ups: приоритет Nat5/Nat4, уровни до max, список «застрял на 3/7»',
          'Трекер fusion / hexagram — что можно собрать из текущей коробки',
          'Monster Builder (lite): подбор рун из инвентаря под архетип → Rune Table (не полный SWOP)',
          'Развитие Teams: сохранённые деки + заметки в localStorage; готовность пачки и разрывы по SPD (статы SWEX, с пометкой «не как в игре»)',
        ],
      },
      {
        id: 'monsters-dashboard',
        kicker: 'Монстры',
        title: 'Вкладка Dashboard (фаза 2)',
        phase: 'Средний срок',
        lead: 'Опционально третья подвкладка — Dashboard | Roster | Teams — как у рун, но про юнитов, не вердикты.',
        items: [
          'Верх: балл коробки + 2–3 шкалы (6/6, долг skill-ups, опционально качество рун на юнитах)',
          'Графики с drill-down: стихия, роль, состояние рун, скиллы → фильтрованный Roster',
          'Полоска Teams: сколько составов без 6/6 на слотах → переход в Teams',
          'Связка с глубиной рун: «коробка рун 68/100 — но 140 six-stars без 6/6»',
        ],
      },
      {
        id: 'share',
        kicker: 'Share',
        title: 'Профили и account review',
        phase: 'В планах',
        lead: 'Только фронт на GitHub Pages — без бэкенда SW Forge.',
        items: [
          'Read-only ссылка: внешний JSON (?profile=) или сжатый payload (?data=)',
          'Режим «разбор аккаунта» для наставника: сводка ростера + акценты по рунам',
          'Режимы Share из Настроек приложения → стабильные публичные URL',
        ],
      },
      {
        id: 'runes',
        kicker: 'Руны',
        title: 'Таблица и движок',
        phase: 'В планах',
        items: [
          'Колонка Rune Score — сортируемый сигнал силы, не второй Sell',
          'Сравнение двух слотов Database — diff вердиктов и ролей',
          'Подсказка God-potential в строке (информационно)',
          'Опционально жёстче правило Grind (eff / HR subs)',
        ],
      },
      {
        id: 'monsters-roster',
        kicker: 'Монстры',
        title: 'Углубление Roster',
        phase: 'Позже',
        items: [
          'Сравнение двух юнитов рядом (статы, скиллы, 6 слотов)',
          'Подсказка «дубликат Nat5» (два одинаковых — кандидат в food?)',
          'Пресеты фильтров: очередь skill-up, голые 6★, юниты с тегом RTA',
          'Теги контента на юнитах (RTA, Siege, ToA) + фильтр по тегу',
        ],
      },
      {
        id: 'artifacts',
        kicker: 'Артефакты',
        title: 'Отдельная вкладка',
        phase: 'Крупный объём',
        items: [
          'Парсинг артефактов из SWEX',
          'Фильтры и таблица в духе рун',
          'Отдельный движок правил (не смешивать с вердиктами рун)',
        ],
      },
      {
        id: 'guide-i18n',
        kicker: 'Guide & i18n',
        title: 'Документация',
        phase: 'Постоянно',
        items: [
          'Французские тексты Guide для Monsters (и Artifacts, когда появится вкладка)',
          'Больше FR-строк в тулбаре и фильтрах Monsters',
        ],
      },
      {
        id: 'builders',
        kicker: 'Долгий горизонт',
        title: 'Контент-билдеры',
        phase: 'Исследование',
        lead: 'Только если SW Forge станет шире — территория SWLens/SWOP.',
        items: [
          'Черновики RTA / Arena / Siege из своей коробки',
          'Заметки по порядку ходов / SPD поверх статов SWEX (честно: «не точь-в-точь как в игре»)',
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
      'Pistes à venir — pas un calendrier. Classées par priorité (haut = d’abord). Runes = cœur ; Monstres = aperçu boîte. Local navigateur sauf mention contraire.',
    sections: [
      {
        id: 'monsters-overview',
        kicker: 'Monstres',
        title: 'Aperçu boîte (phase 1)',
        phase: 'Proche',
        lead: 'Étendre les chips actuelles en bandeau « quoi traiter aujourd’hui » sur le Roster.',
        items: [
          'Tuiles cliquables : sans runes · partiel · 6/6 · skill-ups manquants · stockage',
          'Score de préparation boîte (% de 6★ avec sets complets)',
          'Ligne d’actions : « 12 sans runes · 47 niveaux skill-up · 8 en stockage sans runes »',
          'Clic → Roster filtré',
        ],
      },
      {
        id: 'monsters-account',
        kicker: 'Monstres',
        title: 'Planification compte',
        phase: 'Priorité haute',
        items: [
          'Plan diables & skill-ups : priorités Nat5/Nat4, niveaux jusqu’au max',
          'Suivi fusion / hexagram',
          'Monster Builder (lite) → table runes (pas un SWOP complet)',
          'Teams enrichies : decks sauvegardés, notes locales, préparation escouade',
        ],
      },
      {
        id: 'monsters-dashboard',
        kicker: 'Monstres',
        title: 'Onglet Dashboard (phase 2)',
        phase: 'Moyen terme',
        lead: 'Sous-onglet optionnel — Dashboard | Roster | Teams — comme Runes, mais pour les unités.',
        items: [
          'Haut : score boîte + barres (6/6, dette skill-ups, qualité runes optionnelle)',
          'Graphiques cliquables : élément, rôle, état runes, skills → Roster filtré',
          'Bandeau Teams : escouades avec slots sans 6/6',
          'Lien profondeur runes : « boîte runes 68/100 — mais 140 6★ sans 6/6 »',
        ],
      },
      {
        id: 'share',
        kicker: 'Partage',
        title: 'Profils & review',
        phase: 'Prévu',
        items: [
          'URL lecture seule (?profile= ou ?data= compressé)',
          'Vue account review pour mentors',
          'Modes Share → liens publics stables',
        ],
      },
      {
        id: 'runes',
        kicker: 'Runes',
        title: 'Table & moteur',
        phase: 'Prévu',
        items: [
          'Colonne Rune Score',
          'Comparer 2 slots SWEX (diff verdicts & rôles)',
          'Indice God-potential ; règle Meule plus stricte (option)',
        ],
      },
      {
        id: 'monsters-roster',
        kicker: 'Monstres',
        title: 'Roster avancé',
        phase: 'Plus tard',
        items: [
          'Comparer deux unités côte à côte',
          'Alerte doublon Nat5',
          'Filtres prédéfinis ; tags contenu (RTA, Siege, ToA)',
        ],
      },
      {
        id: 'artifacts',
        kicker: 'Artéfacts',
        title: 'Onglet dédié',
        phase: 'Gros chantier',
        items: [
          'Parse SWEX, filtres, table, moteur de règles séparé',
        ],
      },
      {
        id: 'guide-i18n',
        kicker: 'Guide',
        title: 'Documentation',
        phase: 'Continu',
        items: [
          'Corps FR du Guide Monstres (et Artéfacts plus tard)',
          'Plus de chaînes FR dans l’UI Monstres',
        ],
      },
      {
        id: 'builders',
        kicker: 'Horizon',
        title: 'Builders contenu',
        phase: 'Exploratoire',
        items: [
          'Aides draft RTA / Arène / Siege depuis votre boîte',
          'Notes ordre de tour / VIT sur stats SWEX',
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
