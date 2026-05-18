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

/** Roadmap (Changelog tab → Plans). Full docs: docs/PLANS.md, Monsters: docs/PLANS-MONSTERS.md */
const STATIC_ROADMAP = {
  en: [
    '[Monsters · shipped] All roster units in SWEX (default Lv 36+ filter); grid nat★; unified hover detail (stats, skills, rune strip); table view scaffold; clearer selection and dark-theme action buttons.',
    '[Runes · shipped] Dashboard chart headroom (~75% scale) and bar replay when switching header tabs.',
    '— SWARFARM gap: shareable account reviews — planned as frontend-only share (?profile=JSON URL or ?data=compressed), GitHub Pages, no backend.',
    '— SWARFARM gap: account-wide devilmon planning (beyond per-monster deficit icons) — later in Monsters.',
    '— SWARFARM gap: authored teams with real speed tuning; in-game layouts are generic — saved local decks later, no public share.',
    '[Monsters · later] Monster Builder, saved teams in browser, fusion hex tracker, full account devilmon summary.',
    '[Runes] Rune Score column (sortable; documented; not duplicate Sell).',
    '[Runes] Compare two SWEX database slots (verdict & role diff).',
    '[Runes] Optional God-potential hint; optional stricter Grind rule.',
    '[Artifacts] Separate tab: SWEX artifacts, filters, rules engine (large scope).',
    '[Guide] French guide bodies for Monsters (UI strings partly FR already).',
    '[Share] Read-only profile URL (?profile= or ?data=) on static hosting — account review without a server.',
    '[—] Out of scope: our own backend, community drop logs; full SWARFARM bestiary clone — link out.',
  ],
  ru: [
    '[Монстры · сделано] Все юниты из SWEX (фильтр Ур. 36+ по умолчанию); nat★ на карточках; единая панель при наведении; таблица (черновик); выделение и кнопки в тёмной теме.',
    '[Руны · сделано] Запас по шкале дашборда (~75%) и анимация при смене вкладок шапки.',
    '— Пробел SWARFARM: публичные профили / account review — в игре по-прежнему нельзя; у нас только локальный SWEX (URL без сервера — вне scope).',
    '— Пробел SWARFARM: полная сводка девилмонов по аккаунту (chip skill-ups уже есть).',
    '— Пробел SWARFARM: пачки с точным speed tuning; позже — локальные деки без публичных ссылок.',
    '[Монстры · позже] Monster Builder, сохранённые команды, трекер fusion, сводка девилмонов по аккаунту.',
    '[Руны] Колонка Rune Score; сравнение двух слотов SWEX; God potential; жёстче Grind.',
    '[Артефакты] Отдельная вкладка (крупный объём).',
    '[Guide] FR-тексты для Monsters.',
    '[—] Вне scope: публичные профили, sync, логи дропа; полный бестиарий — ссылки на swarfarm.com.',
  ],
  fr: [
    '— Manque SWARFARM : profils publics / account review — toujours impossible en jeu ; ici SWEX local seulement (pas d’URL sans serveur).',
    '— Manque SWARFARM : synthèse diables compte (chip skill-ups déjà en place).',
    '— Manque SWARFARM : teams avec speed tuning réel ; decks locaux plus tard, pas de partage public.',
    '[Monstres · plus tard] Monster Builder, équipes sauvegardées, fusion, synthèse diables compte.',
    '[Runes] Colonne Rune Score ; comparer 2 slots SWEX ; God potential ; Meule plus stricte.',
    '[Artéfacts] Onglet dédié (gros chantier).',
    '[Guide] Corps FR Monstres.',
    '[—] Hors scope : profils publics, sync, logs drop ; bestiaire complet — liens swarfarm.com.',
  ],
};
