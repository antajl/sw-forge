// =============================================
// settings.js — Default thresholds & config
// =============================================

const STAT_NAMES = {
  1:  'HP',     2:  'HP%',    3:  'ATK',
  4:  'ATK%',   5:  'DEF',    6:  'DEF%',
  // SWEX stat IDs (used by pri_eff/sec_eff/prefix_eff):
  // 8=SPD, 9=CRate, 10=CDmg, 11=RES, 12=ACC
  8:  'SPD',    9:  'CRate',  10: 'CDmg',
  11: 'RES',    12: 'ACC'
};

const SET_NAMES = {
  1:  'Energy',   2:  'Guard',    3:  'Swift',
  4:  'Blade',    5:  'Rage',     6:  'Focus',
  7:  'Endure',   8:  'Fatal',    10: 'Despair',
  11: 'Vampire',  13: 'Violent',  14: 'Nemesis',
  15: 'Will',     16: 'Shield',   17: 'Revenge',
  18: 'Destroy',  19: 'Fight',    20: 'Determination',
  21: 'Enhance',  22: 'Accuracy', 23: 'Tolerance',
  24: 'Seal',     25: 'Intangible', 99: 'Immemorial',
};

const GRADE_NAMES = { 1:'Common', 2:'Magic', 3:'Rare', 4:'Hero', 5:'Legend' };
/** Short labels used in UI / filters (SWEX rank → string) */
const GRADE_SHORT = { 3:'Rare', 4:'Hero', 5:'Legend' };

/** Shown in footer, changelog, and Copy summary — bump when shipping a user-visible build. */
const APP_VERSION = '1.1.3';

// ==== TRANSLATIONS ====
const TRANSLATIONS = {
  en: {
    // Header
    title: 'SW Rune Master',
    donateShort: 'Donate',
    donateTitle: 'Support the project — opens Lava.top payment page',
    donateAria: 'Donate — support the project (external page)',
    footerDisclaimer:
      'Summoners War™ is a trademark of Com2uS Corp. This site is not affiliated with or endorsed by Com2uS Corp.',
    footerVersionLabel: 'Build',
    dashboard: 'Dashboard',
    runeTable: 'Rune Table',
    runeRules: 'Rune Rules',
    guide: 'Guide',
    changelog: 'Changelog',
    changelogPageLead:
      'Bundled with the app (not stored in your browser). Switch between release highlights and the roadmap.',
    changelogSubtabShipped: 'Releases',
    changelogSubtabRoadmap: 'Roadmap',
    changelogShippedLead: 'Major themes only — routine fixes are not listed.',
    changelogRoadmapLead: 'Discussed next steps; may not appear in the current build.',
    changelogRoadmapEmpty: 'No roadmap items in this build.',
    changelogSubtabsAria: 'Changelog sections',
    changelogEmpty: 'No release notes in this build yet.',
    loadJson: 'Load JSON',
    minLvl: 'Min Lvl',
    settings: 'Settings',
    
    // Upload prompt
    loadYourSWEX: 'Load your SWEX JSON',
    uploadDescription: 'Export your account data from <strong>Summoners War Exporter (SWEX)</strong> and load the JSON file here to analyze your rune collection.',
    chooseJsonFile: 'Choose JSON file',
    privacyNote: 'All processing happens in your browser — your data never leaves your device.',
    uploadPromptLead: 'Export with Summoners War Exporter (SWEX), then select your .json file. Analysis runs entirely in this browser.',
    uploadPromptSecondary: 'This becomes your active profile (Data 1). Add or switch accounts in App Settings → Database Slots.',
    uploadClearAll: 'Clear all saved data',
    lvAbbr: 'Lv.',
    runesWord: 'runes',
    runesHeroPlus: 'runes',
    monsShort: 'monsters',
    clipboardNotJson: 'Clipboard does not contain valid JSON.',
    
    // Dashboard cards
    totalRunes: 'Total Runes',
    keep: 'Keep',
    sell: 'Sell',
    grind: 'Grind',
    finish: 'Finish',
    reapp: 'Reapp',
    upgrade: 'Upgrade',
    gem: 'Gem',
    
    // Charts
    roleDistribution: 'Role Distribution',
    setDistribution: 'Set Distribution',
    slotDistribution: 'Slot Distribution',
    efficiencyDistribution: 'Efficiency Distribution',
    
    // Table
    searchPlaceholder: 'Search by set, stat, role...',
    allVerdicts: 'All Verdicts',
    allRoles: 'All Roles',
    allGrades: 'All Grades',
    runes: 'runes',
    runeTableCountCapped: '{shown} / {total} {runes} in table',
    runeTableMoreHint:
      'Only the first {shown} rows are loaded for speed. Scroll to this area — then you can load all {total} matching runes (very large lists may feel slower).',
    runeTableShowAllButton: 'Load all {total} in table',
    targetHeading: 'Target',
    exportTableCsv: 'Export CSV',
    actionTargetUpgrade: 'Power to ≥ +9 before judging',
    actionTargetFinish: 'Power to +12',
    actionTargetReapp: 'Reappraisal (roll subs)',
    
    // Settings
    thresholds: 'Thresholds',
    roleFilters: 'Role Filters',
    reappRules: 'Reapp Rules',
    generalThresholds: 'General Thresholds',
    highRollThresholds: 'High Roll Thresholds',
    highRollGridDesc:
      'Stage and grade affect grind targets, rune power (0–3), and formula anchors «High Roll for Hero/Legend». They do not set the God Roll line.',
    godRollConstants: 'God Roll constants',
    godRollConstantsDesc:
      'Per stat: God threshold = Base plus the God +% column (same at every stage). The «High Roll» role in the engine uses that God line only.',
    rulesPageTitle: 'Rune Rules',
    rulesPageLead:
      'Constants define the numeric thresholds; roles map runes to archetypes. Save at the bottom to refresh verdicts on the Dashboard and Rune Table.',
    rulesSectionPreviewsTitle: 'Threshold previews',
    rulesSectionPreviewsDesc:
      'Read-only tables: values are computed from Constants above (stage × grade for High Roll lines; Duo lines use the same base scales and each stat’s Duo mod).',
    rulesSubtabsAria: 'Rune Rules sections',
    rulesSubtabEngine: 'Engine',
    rulesSubtabEngineDesc: 'Constants and HR/Duo previews',
    rulesSubtabVerdict: 'Verdict rules',
    rulesSubtabVerdictDesc: 'Gem and Reapp tuning',
    rulesSubtabRoles: 'Roles',
    rulesSubtabRolesDesc: 'Formulas and role filters',
    rulesSectionRolesAside: 'Roles & formulas',
    rolesNavTitle: 'Roles',
    constantsSheetTitle: 'Constants (8 stats)',
    constantsSheetDesc:
      'Base is the Mid / Hero anchor for that substat (rolled value including grind). Change it when a whole row feels too strict or too soft. The next columns are entered as percents (30 means 30%, not 0.30): God +% adds on top of Base for the God-only line (30 → Base×1.30). Duo −% lowers Duo pair thresholds below the High Roll value (20 → Duo line = 80% of HR). Early % and Late % scale those stages versus Base (80 → 80% of Base). Legend −% at Mid lowers Legend Mid versus Hero Mid for HR (5 → Legend Mid = 95% of Base). The right column shows the computed God threshold. Previews update as you type; use Save to refresh verdicts.',
    enginePreviewHr: 'High Roll thresholds (by stage & grade)',
    enginePreviewDuo: 'Duo Roll thresholds (by stage & grade)',
    constantsColStat: 'Stat',
    constantsColHintBase:
      'Mid-game Hero anchor for this substat (roll + grind). Other columns scale from here.',
    constantsColHintGod:
      'God line = Base × (1 + this%/100). Used only for God roll detection.',
    constantsColHintDuo:
      'Duo line = High Roll × (1 − this%/100). Higher % = stricter Duo pairs.',
    constantsColHintEarly:
      'Early HR hero lines use Base × this%/100 (Legend uses grade rules too).',
    constantsColHintLate: 'Late HR hero lines use Base × this%/100.',
    constantsColHintGrade:
      'At Mid, Legend HR uses Base × (1 − this%/100); Hero Mid stays exactly Base.',
    godColBase: 'Base',
    godColMod: 'God +%',
    godColResult: 'God line',
    constColDuoMod: 'Duo −%',
    constColEarly: 'Early %',
    constColLate: 'Late %',
    constColGrade: 'Leg @Mid −%',
    resetConstantsButton: 'Reset Constants to defaults',
    resetConstantsHint: 'Reloads the built-in Constants table only. Roles, formulas, and other settings stay unchanged.',
    resetConstantsConfirm:
      'Replace the Constants (8 stats) grid with built-in defaults? Roles and formulas will not be changed.',
    resetConstantsDone: 'Constants reset to defaults.',
    duoRollThresholds: 'Duo Roll Thresholds',
    configureRoleRules: 'Configure role rules. You can add a custom role or remove existing roles (minimum one role must remain).',
    newRole: 'New role',
    addRole: '+ Add role',
    gemMetaRules: 'Gem (Innate) — Meta sets',
    gemMetaRulesDesc: 'On listed sets, verdict Gem appears when innate is undesirable for this slot. Per-set overrides in JSON replace defaults for those slots.',
    gemMetaToggle: 'Enable innate Gem hints',
    gemMetaLegendOnly: 'Only Legend runes',
    gemMetaSetsList: 'Meta sets (comma)',
    gemUniversalFlats: 'Treat flat innate (HP ATK DEF) as bad',
    gemExtrasLabel: 'Extra bad innate',
    gemExtraBySlot: 'Extra bad innate by slot — one line per slot: Slot:STAT,STAT …',
    gemPerSetJson: 'Per-set slot overrides (JSON)',
    gemLegacySubs: 'Also use legacy “flat subs → grindable %” Gem',
    reappCandidateRules: 'Reapp Candidate Rules',
    reappDescription: 'If a rune has low efficiency and matches these filters, verdict can be Reapp.',
    allowedSets: 'Allowed sets (comma)',
    innateStats: 'Innate stats (comma)',
    slot2Mains: 'Slot 2 mains (comma)',
    slot4Mains: 'Slot 4 mains (comma)',
    slot6Mains: 'Slot 6 mains (comma)',
    maxEffReapp: 'Max efficiency for Reapp',
    saveRecalculate: 'Save & Recalculate',
    resetDefaults: 'Reset to Defaults',
    
    // App settings
    appSettings: 'App Settings',
    language: 'Language',
    theme: 'Theme',
    themeGroupAria: 'Color theme',
    themeLightTitle: 'Light theme',
    themeDarkTitle: 'Dark theme',
    dbSlot: 'Database Slot',
    activeProfile: 'Active',
    current: 'Current',
    name: 'Name',
    uploaded: 'Uploaded',
    clipboard: 'Clipboard',
    upload: 'Upload',
    download: 'Download',
    delete: 'Delete',
    swap: 'Swap',
    slotEmpty: 'Selected slot is empty',
    slotDeleteSwitchedTo: 'The current database was removed. Loaded Data {n} — {name}.',
    slotDeleteAllCleared: 'All saved databases were removed. Please load a JSON export.',
    slotDeleteNextLoadFailed: 'Could not load data from the next slot. Please load a JSON file.',
    parseError: 'Failed to parse slot JSON: ',
    dbSlotsTitle: 'Database Slots',
    dbSlotsDesc: 'Up to four SWEX exports. Summary lines show wizard name, level, total rune count, and monsters when the JSON includes them.',
    
    // Stages
    early: 'Early',
    mid: 'Mid',
    late: 'Late',

    stageAdvisorTitle: 'Account progression suggestion',
    stageAdvisorLead:
      'Early, Mid, and Late change how strict the rules are. The combined score estimates account depth from your full rune export (Rare and above): fast runes, upgraded runes, and quality on your best pieces. It ignores the preset below and the dashboard minimum level filter.',

    stageSuggestedLabel: 'Suggested stage',
    stageYourPresetLabel: 'Your preset',
    stageScoreLabel: 'Combined score',
    stageApplySuggestion: 'Apply suggestion',
    stageMismatchHint: 'Your preset differs from the suggestion—you can still keep your choice.',
    stageAdvisorNoEligible:
      'Load a SWEX export to see progression depth and combined score.',

    stageMetricsExplainer:
      'These three numbers always use your full export — not the preset or Min level below. Card weights:',

    stageCardHrName: 'Speed Depth',
    stageCardHrWeight: '35%',
    stageCardHrDesc:
      'How many runes have sub SPD total ≥ 18 (roll + grind). This term contributes up to 35 points once you reach 250 such runes.',

    stageCardKeepName: 'Power Depth',
    stageCardKeepWeight: '35%',
    stageCardKeepDesc:
      'How many 6★ runes are at exactly +15. This term contributes up to 35 points once you reach 600.',

    stageCardMetaName: 'Elite Quality',
    stageCardMetaWeight: '30%',
    stageCardMetaDesc:
      'Average efficiency on your best runes (up to 50). Baseline 80%, span 30 percentage points for the full 30-point term.',

    stageEliteValFormat: '{eff}% · n={n}',

    stageFormulaExpl: '',

    dashboardScopeTitle: 'Global filter',
    dashboardScopeHint:
      'Applies to verdict cards, charts, and Rune Table (min rune level and minimum grade). Account progression above always uses the full export.',
    dashboardMinGradeLabel: 'Min grade',
    dashboardMinGradeRare: 'Rare+',
    dashboardMinGradeHero: 'Hero+',
    dashboardMinGradeLegend: 'Legend only',
    dashboardExportSummary: 'Copy summary',
    dashboardExportDone: 'Dashboard summary copied.',
    dashboardExportFail: 'Could not copy summary.',
    dashboardVerdictMixTitle: 'Verdict mix',
    dashboardVerdictStackHint: 'Click a segment to open the Rune Table with that verdict.',
    dashboardChartLblCount: 'n',
    dashboardChartLblAvg: 'avg',
    dashboardGroupKeepers: 'Stash & power',
    dashboardGroupQueue: 'Needs attention',
    dashboardOpenTableHint: 'Opens Rune Table',
    stageCompactExpand: 'Show full progression details',
    stageCompactCollapse: 'Compact progression view',
    stageMetricContribTpl: '+{pts} / {cap} pts',
    effMedianCaption: 'Median efficiency (filtered): {pct}%',
    dashboardExportEffBuckets: 'Histogram (5% buckets):',
  },
  ru: {
    // Header
    title: 'SW Rune Master',
    donateShort: 'Донат',
    donateTitle: 'Поддержать проект — откроется страница оплаты Lava.top',
    donateAria: 'Донат — поддержать проект (внешняя страница)',
    footerDisclaimer:
      'Summoners War™ — торговая марка Com2uS Corp. Этот сайт не аффилирован с Com2uS Corp. и не одобрен ею.',
    footerVersionLabel: 'Сборка',
    dashboard: 'Панель',
    runeTable: 'Руны',
    runeRules: 'Правила',
    guide: 'Гайд',
    changelog: 'Лог',
    changelogPageLead:
      'Идёт вместе со сборкой (не в localStorage). Переключайте вкладки: релизы и дорожная карта.',
    changelogSubtabShipped: 'Релизы',
    changelogSubtabRoadmap: 'Планы',
    changelogShippedLead: 'Только крупные темы — мелкие правки не перечисляются.',
    changelogRoadmapLead: 'Обсуждаемые шаги вперёд; в текущей сборке может не быть.',
    changelogRoadmapEmpty: 'В этой сборке список планов пуст.',
    changelogSubtabsAria: 'Разделы журнала',
    changelogEmpty: 'В этой сборке пока нет записей журнала.',
    loadJson: 'Загрузить JSON',
    minLvl: 'Мин Ур',
    settings: 'Настройки',
    
    // Upload prompt
    loadYourSWEX: 'Загрузите ваш SWEX JSON',
    uploadDescription: 'Экспортируйте данные аккаунта из <strong>Summoners War Exporter (SWEX)</strong> и загрузите JSON файл здесь для анализа вашей коллекции рун.',
    chooseJsonFile: 'Выбрать JSON файл',
    privacyNote: 'Все обработка происходит в вашем браузере — ваши данные никогда не покидают ваше устройство.',
    uploadPromptLead: 'Экспортируйте аккаунт через Summoners War Exporter (SWEX) и выберите .json файл. Всё считается только в браузере.',
    uploadPromptSecondary: 'Файл станет активным профилем (Data 1). Другие аккаунты — в Настройках приложения → Слоты баз данных.',
    uploadClearAll: 'Удалить все сохранения',
    lvAbbr: 'Ур.',
    runesWord: 'рун',
    runesHeroPlus: 'рун',
    monsShort: 'монстров',
    clipboardNotJson: 'В буфере нет корректного JSON.',
    
    // Dashboard cards
    totalRunes: 'Всего Рун',
    keep: 'Оставить',
    sell: 'Продать',
    grind: 'Прокачать',
    finish: 'Докачать',
    reapp: 'Переставить',
    upgrade: 'Улучшить',
    gem: 'Камень',
    
    // Charts
    roleDistribution: 'Роли',
    setDistribution: 'Сеты',
    slotDistribution: 'Слоты',
    efficiencyDistribution: 'Эффективность',
    
    // Table
    searchPlaceholder: 'Поиск по сету, стату, роли...',
    allVerdicts: 'Все Вердикты',
    allRoles: 'Все Роли',
    allGrades: 'Все Грейды',
    runes: 'рун',
    runeTableCountCapped: '{shown} / {total} {runes} в таблице',
    runeTableMoreHint:
      'Для скорости сначала загружены только первые {shown} строк. Прокрутите сюда вниз — затем можно загрузить все {total} подходящих рун (очень большой список может тормозить).',
    runeTableShowAllButton: 'Загрузить все {total} в таблице',
    targetHeading: 'Цель',
    exportTableCsv: 'Экспорт CSV',
    actionTargetUpgrade: 'Докачать до ≥ +9',
    actionTargetFinish: 'Докачать до +12',
    actionTargetReapp: 'Реапп подстатов',
    
    // Settings
    thresholds: 'Пороги',
    roleFilters: 'Фильтры Ролей',
    reappRules: 'Правила Перестановки',
    generalThresholds: 'Общие Пороги',
    highRollThresholds: 'Пороги Высоких Показателей',
    highRollGridDesc:
      'Стадия и грейд влияют на гринд, уровень силы руны (0–3) и якоря «High Roll for Hero/Legend». Линию God Roll они не задают.',
    godRollConstants: 'Константы God Roll',
    godRollConstantsDesc:
      'По стату: порог God = Base плюс колонка God +% (одинаков при любой стадии). Роль «High Roll» в движке использует только эту линию God.',
    rulesPageTitle: 'Правила рун',
    rulesPageLead:
      'Constants задают числовые пороги; роли относят руны к архетипам. Сохраните внизу — пересчитаются вердикты на дашборде и в таблице.',
    rulesSectionPreviewsTitle: 'Превью порогов',
    rulesSectionPreviewsDesc:
      'Только чтение: числа считаются из Constants выше (стадия × грейд для линий High Roll; Duo — те же масштабы и Duo mod по каждому стату).',
    rulesSubtabsAria: 'Разделы правил рун',
    rulesSubtabEngine: 'Движок',
    rulesSubtabEngineDesc: 'Constants и превью HR/Duo',
    rulesSubtabVerdict: 'Вердикты',
    rulesSubtabVerdictDesc: 'Gem и Reapp',
    rulesSubtabRoles: 'Роли',
    rulesSubtabRolesDesc: 'Формулы и фильтры ролей',
    rulesSectionRolesAside: 'Роли и формулы',
    rolesNavTitle: 'Роли',
    constantsSheetTitle: 'Constants (8 статов)',
    constantsSheetDesc:
      'Base — якорь Mid / Hero для этого сабстата (ролл + камень). Меняйте, если вся строка кажется слишком жёсткой или слишком мягкой. Следующие колонки вводятся в процентах (30 значит 30%, не 0,30): God +% добавляется к Base для отдельной линии God (30 → Base×1,30). Duo −% опускает пороги пар относительно High Roll (20 → линия Duo = 80% от HR). Early % и Late % масштабируют эти стадии от Base (80 → 80% от Base). Leg @Mid −% в Mid опускает Legend относительно Hero для HR (5 → Legend Mid = 95% от Base). Справа — вычисленный порог God. Превью обновляются при вводе; вердикты — после Сохранить.',
    enginePreviewHr: 'Пороги High Roll (стадия × грейд)',
    enginePreviewDuo: 'Пороги Duo Roll (стадия × грейд)',
    constantsColStat: 'Стат',
    constantsColHintBase:
      'Якорь Mid / Hero для сабстата (ролл + камень). Остальные колонки масштабируют от него.',
    constantsColHintGod:
      'Линия God = Base × (1 + этот%/100). Только для детекта God roll.',
    constantsColHintDuo:
      'Линия Duo = High Roll × (1 − этот%/100). Больше % — строже пары.',
    constantsColHintEarly:
      'Early HR по герою: Base × этот%/100 (у Legend ещё правила грейда).',
    constantsColHintLate: 'Late HR по герою: Base × этот%/100.',
    constantsColHintGrade:
      'В Mid Legend HR = Base × (1 − этот%/100); Hero Mid ровно Base.',
    godColBase: 'Base',
    godColMod: 'God +%',
    godColResult: 'Линия God',
    constColDuoMod: 'Duo −%',
    constColEarly: 'Early %',
    constColLate: 'Late %',
    constColGrade: 'Leg @Mid −%',
    resetConstantsButton: 'Сбросить Constants к умолчанию',
    resetConstantsHint:
      'Подставляет встроенную таблицу Constants. Роли, формулы и остальные настройки не трогаются.',
    resetConstantsConfirm:
      'Заменить таблицу Constants (8 статов) на значения по умолчанию? Роли и формулы не изменятся.',
    resetConstantsDone: 'Constants сброшены к умолчанию.',
    duoRollThresholds: 'Пороги Парных Показателей',
    configureRoleRules: 'Настройте правила ролей. Вы можете добавить пользовательскую роль или удалить существующие (должна остаться минимум одна роль).',
    newRole: 'Новая роль',
    addRole: '+ Добавить роль',
    gemMetaRules: 'Gem (врожд.) — мета-сеты',
    gemMetaRulesDesc: 'На перечисленных сетах вердикт Gem, если врождённый стат «плохой» для слота. JSON ниже задаёт переопределения по сету и слоту.',
    gemMetaToggle: 'Включить Gem по врождённому стату',
    gemMetaLegendOnly: 'Только Legend',
    gemMetaSetsList: 'Мета-сеты (через запятую)',
    gemUniversalFlats: 'Считать плохим врождённый флет (HP ATK DEF)',
    gemExtrasLabel: 'Доп. плохой innate',
    gemExtraBySlot: 'Доп. плохие innate по слоту — строка на слот: Слот:СТАТ,СТАТ …',
    gemPerSetJson: 'Переопределения по сетам (JSON)',
    gemLegacySubs: 'Дополнительно старый Gem: флет в субстатах → % ',
    reappCandidateRules: 'Правила Кандидатов на Перестановку',
    reappDescription: 'Если у руны низкая эффективность и она соответствует этим фильтрам, вердикт может быть "Переставить".',
    allowedSets: 'Разрешенные сеты (через запятую)',
    innateStats: 'Врожденные статы (через запятую)',
    slot2Mains: 'Основные статы слота 2 (через запятую)',
    slot4Mains: 'Основные статы слота 4 (через запятую)',
    slot6Mains: 'Основные статы слота 6 (через запятую)',
    maxEffReapp: 'Макс. эффективность для Перестановки',
    saveRecalculate: 'Сохранить & Пересчитать',
    resetDefaults: 'Сбросить по умолчанию',
    
    // App settings
    appSettings: 'Приложение',
    language: 'Язык',
    theme: 'Тема',
    themeGroupAria: 'Тема оформления',
    themeLightTitle: 'Светлая тема',
    themeDarkTitle: 'Тёмная тема',
    dbSlot: 'Слот Базы Данных',
    activeProfile: 'Активен',
    current: 'Текущий',
    name: 'Имя',
    uploaded: 'Загружен',
    clipboard: 'Буфер',
    upload: 'Загрузить',
    download: 'Скачать',
    delete: 'Удалить',
    swap: 'Переключить',
    slotEmpty: 'Выбранный слот пуст',
    slotDeleteSwitchedTo: 'Текущая база удалена. Загружен слот {n} — {name}.',
    slotDeleteAllCleared: 'Все сохранённые базы удалены. Загрузите JSON экспорт.',
    slotDeleteNextLoadFailed: 'Не удалось загрузить данные из следующего слота. Загрузите JSON файл.',
    parseError: 'Ошибка разбора JSON слота: ',
    dbSlotsTitle: 'Слоты Базы Данных',
    dbSlotsDesc: 'До четырёх экспортов SWEX. В карточке — имя мага, уровень, общее число рун и монстров, если они есть в JSON.',
    
    // Stages
    early: 'Ранняя',
    mid: 'Средняя',
    late: 'Поздняя',

    stageAdvisorTitle: 'Совет по прогрессу аккаунта',
    stageAdvisorLead:
      'Стадия задаёт строгость правил. Сводный балл оценивает глубину аккаунта по всему экспорту рун (Rare и выше): быстрые руны, прокачка до +15 и качество лучших. Пресет ниже и общий «Мин. ур.» на этот балл не влияют.',

    stageSuggestedLabel: 'Советуемая стадия',
    stageYourPresetLabel: 'Ваш выбор',
    stageScoreLabel: 'Сводный балл',
    stageApplySuggestion: 'Применить совет',
    stageMismatchHint: 'Ваш выбор отличается от совета — так можно оставить.',
    stageAdvisorNoEligible:
      'Загрузите SWEX JSON, чтобы увидеть глубину и сводный балл.',

    stageMetricsExplainer:
      'Три числа всегда по полному экспорту — не по пресету и не по «Мин. ур.» ниже. Веса на карточках:',

    stageCardHrName: 'SPD-глубина',
    stageCardHrWeight: '35%',
    stageCardHrDesc:
      'Сколько рун, у которых сумма саб SPD ≥ 18 (ролл + камень). До 35 баллов, полный вклад при 250+ таких рунах.',

    stageCardKeepName: 'Глубина +15',
    stageCardKeepWeight: '35%',
    stageCardKeepDesc:
      'Сколько 6★ рун на ровно +15. До 35 баллов, полный вклад при 600+.',

    stageCardMetaName: 'Элита по eff',
    stageCardMetaWeight: '30%',
    stageCardMetaDesc:
      'Средняя эффективность по лучшим рунам (до 50). База 80%, диапазон 30 п.п. для полных 30 баллов.',

    stageEliteValFormat: '{eff}% · n={n}',

    stageFormulaExpl: '',

    dashboardScopeTitle: 'Общий фильтр',
    dashboardScopeHint:
      'Влияет на карточки вердиктов, графики и таблицу (мин. уровень и мин. грейд). Прогресс аккаунта выше — всегда по полному экспорту.',
    dashboardMinGradeLabel: 'Мин. грейд',
    dashboardMinGradeRare: 'Rare+',
    dashboardMinGradeHero: 'Hero+',
    dashboardMinGradeLegend: 'Только Legend',
    dashboardExportSummary: 'Копировать сводку',
    dashboardExportDone: 'Сводка скопирована.',
    dashboardExportFail: 'Не удалось скопировать.',
    dashboardVerdictMixTitle: 'Вердикты',
    dashboardVerdictStackHint: 'Клик по сегменту откроет таблицу с этим вердиктом.',
    dashboardChartLblCount: 'n',
    dashboardChartLblAvg: 'ср.',
    dashboardGroupKeepers: 'Запас и качество',
    dashboardGroupQueue: 'Требуют внимания',
    dashboardOpenTableHint: 'Открыть таблицу',
    stageCompactExpand: 'Показать детали прогресса',
    stageCompactCollapse: 'Компактный вид прогресса',
    stageMetricContribTpl: '+{pts} / {cap} балл.',
    effMedianCaption: 'Медиана eff (с фильтром): {pct}%',
    dashboardExportEffBuckets: 'Гистограмма (корзины по 5%):',
  }
};

const SLOT_MAIN_FIXED = {
  1: { type: 3,  name: 'ATK' },   // Flat ATK
  3: { type: 5,  name: 'DEF' },   // Flat DEF
  5: { type: 1,  name: 'HP'  }    // Flat HP
};

// ---- THRESHOLDS ----
// Structure: { Early_Leg, Early_Hero, Mid_Leg, Mid_Hero, Late_Leg, Late_Hero }
const DEFAULT_THRESHOLDS = {
  SPD:   { Early_Leg:14, Early_Hero:10, Mid_Leg:17, Mid_Hero:15, Late_Leg:21, Late_Hero:18 },
  'HP%': { Early_Leg:18, Early_Hero:14, Mid_Leg:21, Mid_Hero:20, Late_Leg:25, Late_Hero:24 },
  'DEF%':{ Early_Leg:18, Early_Hero:14, Mid_Leg:21, Mid_Hero:20, Late_Leg:25, Late_Hero:24 },
  'ATK%':{ Early_Leg:16, Early_Hero:12, Mid_Leg:18, Mid_Hero:17, Late_Leg:23, Late_Hero:21 },
  CRate: { Early_Leg:11, Early_Hero:8,  Mid_Leg:14, Mid_Hero:13, Late_Leg:17, Late_Hero:16 },
  CDmg:  { Early_Leg:14, Early_Hero:10, Mid_Leg:17, Mid_Hero:16, Late_Leg:21, Late_Hero:20 },
  ACC:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
  RES:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
};

// Legacy flat grids (used only to seed defaults / migration into statConstants).
const DEFAULT_HR_THRESHOLDS = DEFAULT_THRESHOLDS;

const DEFAULT_DUO_THRESHOLDS = {
  SPD_min:       { Early_Leg:10, Early_Hero:8,  Mid_Leg:13, Mid_Hero:12, Late_Leg:15, Late_Hero:12 },
  SPD_partner:   { Early_Leg:12, Early_Hero:11, Mid_Leg:18, Mid_Hero:14, Late_Leg:18, Late_Hero:16 },
  CRate_for_CDmg:{ Early_Leg:10, Early_Hero:8,  Mid_Leg:12, Mid_Hero:10, Late_Leg:14, Late_Hero:10 },
  CDmg_for_CRate:{ Early_Leg:12, Early_Hero:9,  Mid_Leg:15, Mid_Hero:12, Late_Leg:17, Late_Hero:14 },
  CRate_for_ATK: { Early_Leg:10, Early_Hero:8,  Mid_Leg:12, Mid_Hero:10, Late_Leg:14, Late_Hero:10 },
  ATK_for_CRate: { Early_Leg:14, Early_Hero:14, Mid_Leg:14, Mid_Hero:14, Late_Leg:14, Late_Hero:14 },
  HP_for_DEF:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  DEF_for_HP:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  DEF_for_RES:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  RES_for_DEF:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  HP_for_RES:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  RES_for_HP:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
};

/** Stat order for the Constants table (8 substats). */
const GOD_STAT_ORDER = ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'];
const HR_COL_KEYS = ['Early_Leg', 'Early_Hero', 'Mid_Leg', 'Mid_Hero', 'Late_Leg', 'Late_Hero'];

function roundThresh(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

/**
 * Stage+grade High Roll threshold cell from Constants:
 * Mid_Hero = Base; Mid_Leg = Base×(1−Grade_Mod); Early_Hero = Base×Early_Scale; Late_Hero = Base×Late_Scale;
 * Early/Legend and Late/Legend = Hero cell × (1−Grade_Mod).
 */
function stageHrValue(statRow, colKey) {
  const base = Number(statRow.base);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const earlyScale = Number.isFinite(Number(statRow.earlyScale)) ? Number(statRow.earlyScale) : 1;
  const lateScale = Number.isFinite(Number(statRow.lateScale)) ? Number(statRow.lateScale) : 1;
  const gradeMod = Number.isFinite(Number(statRow.gradeMod)) ? Number(statRow.gradeMod) : 0;
  const leg = colKey.indexOf('_Leg') !== -1;
  const heroFactor = leg ? (1 - gradeMod) : 1;
  if (colKey.startsWith('Early')) return base * earlyScale * heroFactor;
  if (colKey.startsWith('Mid')) return (leg ? base * (1 - gradeMod) : base);
  if (colKey.startsWith('Late')) return base * lateScale * heroFactor;
  return base;
}

/**
 * Defaults aligned with master Constants sheet (base + God/Duo mods + stage/grade scales).
 * HR/Duo threshold grids are derived — do not duplicate numbers here and in DEFAULT_THRESHOLDS manually.
 */
const EXPLICIT_DEFAULT_STAT_CONSTANTS = {
  SPD:    { base: 16, godMod: 0.30, duoMod: 0.20, earlyScale: 0.80, lateScale: 1.30, gradeMod: 0.05 },
  'HP%':  { base: 20, godMod: 0.40, duoMod: 0.25, earlyScale: 0.80, lateScale: 1.20, gradeMod: 0.08 },
  'DEF%': { base: 20, godMod: 0.40, duoMod: 0.25, earlyScale: 0.80, lateScale: 1.20, gradeMod: 0.08 },
  'ATK%': { base: 17, godMod: 0.40, duoMod: 0.25, earlyScale: 0.80, lateScale: 1.20, gradeMod: 0.08 },
  CRate:  { base: 13, godMod: 0.35, duoMod: 0.30, earlyScale: 0.80, lateScale: 1.15, gradeMod: 0.05 },
  CDmg:   { base: 16, godMod: 0.40, duoMod: 0.30, earlyScale: 0.80, lateScale: 1.20, gradeMod: 0.08 },
  ACC:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.80, lateScale: 1.15, gradeMod: 0.10 },
  RES:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.80, lateScale: 1.15, gradeMod: 0.10 },
};

function defaultStatConstants() {
  const out = {};
  for (const stat of GOD_STAT_ORDER) {
    const row = EXPLICIT_DEFAULT_STAT_CONSTANTS[stat];
    out[stat] = {
      base: row.base,
      godMod: row.godMod,
      duoMod: row.duoMod,
      earlyScale: row.earlyScale,
      lateScale: row.lateScale,
      gradeMod: row.gradeMod,
    };
  }
  return out;
}

function inferDuoModFromLegacy(stat, hrRow, duo, colKey) {
  const hr = Number(hrRow[colKey]);
  if (!Number.isFinite(hr) || hr <= 0) return 0;
  const d = (pairRow) => {
    const v = Number(pairRow && pairRow[colKey]);
    if (!Number.isFinite(v) || v <= 0) return null;
    return 1 - v / hr;
  };
  const vals = [];
  if (stat === 'SPD') {
    const x = d(duo.SPD_min);
    if (x != null) vals.push(x);
  }
  if (stat === 'HP%') {
    [d(duo.HP_for_DEF), d(duo.HP_for_RES)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (stat === 'DEF%') {
    [d(duo.DEF_for_HP), d(duo.DEF_for_RES)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (stat === 'ATK%') {
    const x = d(duo.ATK_for_CRate);
    if (x != null) vals.push(x);
  }
  if (stat === 'CRate') {
    [d(duo.CRate_for_CDmg), d(duo.CRate_for_ATK)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (stat === 'CDmg') {
    const x = d(duo.CDmg_for_CRate);
    if (x != null) vals.push(x);
  }
  if (stat === 'RES') {
    [d(duo.RES_for_DEF), d(duo.RES_for_HP)].forEach(x => { if (x != null) vals.push(x); });
  }
  if (!vals.length) return 0;
  let s = 0;
  for (let i = 0; i < vals.length; i++) s += vals[i];
  const avg = s / vals.length;
  return Number.isFinite(avg) ? Math.round(avg * 10000) / 10000 : 0;
}

function mergeStatConstants(saved) {
  const d = JSON.parse(JSON.stringify(defaultStatConstants()));
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return d;
  for (const stat of GOD_STAT_ORDER) {
    const src = saved[stat];
    if (!src || typeof src !== 'object') continue;
    const keys = ['base', 'godMod', 'duoMod', 'earlyScale', 'lateScale', 'gradeMod'];
    for (let k = 0; k < keys.length; k++) {
      const key = keys[k];
      if (src[key] == null) continue;
      const n = Number(src[key]);
      if (Number.isFinite(n)) d[stat][key] = n;
    }
  }
  return d;
}

/** Migrate legacy godConstants { base, godMod } into statConstants row. */
function applyGodConstantsToStatConstants(sc, god) {
  if (!god || typeof god !== 'object') return;
  for (const stat of GOD_STAT_ORDER) {
    const g = god[stat];
    if (!g || typeof g !== 'object') continue;
    if (g.base != null && Number.isFinite(Number(g.base))) sc[stat].base = Number(g.base);
    if (g.godMod != null && Number.isFinite(Number(g.godMod))) sc[stat].godMod = Number(g.godMod);
  }
}

function inferStatConstantsFromLegacyHrDuo(hr, duo, god) {
  const sc = {};
  for (const stat of GOD_STAT_ORDER) {
    const row = hr[stat] || {};
    const base = Number(row.Mid_Hero) || 0;
    const eh = Number(row.Early_Hero);
    const lh = Number(row.Late_Hero);
    const ml = Number(row.Mid_Leg);
    const earlyScale = base > 0 && Number.isFinite(eh) ? eh / base : 1;
    const lateScale = base > 0 && Number.isFinite(lh) ? lh / base : 1;
    const gradeMod = base > 0 && Number.isFinite(ml) ? 1 - ml / base : 0;
    sc[stat] = {
      base,
      godMod: 0.12,
      duoMod: duo ? inferDuoModFromLegacy(stat, row, duo, 'Mid_Hero') : 0,
      earlyScale,
      lateScale,
      gradeMod,
    };
  }
  applyGodConstantsToStatConstants(sc, god);
  return mergeStatConstants(sc);
}

function computeHrThresholds(statConstants) {
  const out = {};
  for (const stat of GOD_STAT_ORDER) {
    const row = statConstants[stat];
    out[stat] = {};
    for (let i = 0; i < HR_COL_KEYS.length; i++) {
      const col = HR_COL_KEYS[i];
      out[stat][col] = roundThresh(stageHrValue(row, col));
    }
  }
  return out;
}

/** Duo line = stage HR for that stat × (1 − Duo_Mod). */
function duoLineForStat(stat, colKey, hrTable, statConstants) {
  const hr = Number(hrTable[stat]?.[colKey]);
  if (!Number.isFinite(hr) || hr <= 0) return 0;
  const dm = Number(statConstants[stat]?.duoMod);
  const d = Number.isFinite(dm) ? dm : 0;
  return roundThresh(hr * (1 - d));
}

function computeDuoThresholds(statConstants, hrTable) {
  const d = {};
  const cols = HR_COL_KEYS;
  const keys = [
    'SPD_min',
    'SPD_partner_HP',
    'SPD_partner_DEF',
    'SPD_partner_ATK',
    'SPD_partner_CRate',
    'CRate_for_CDmg', 'CDmg_for_CRate', 'CRate_for_ATK', 'ATK_for_CRate',
    'HP_for_DEF', 'DEF_for_HP', 'DEF_for_RES', 'RES_for_DEF', 'HP_for_RES', 'RES_for_HP',
  ];
  for (let ki = 0; ki < keys.length; ki++) {
    d[keys[ki]] = {};
    for (let ci = 0; ci < cols.length; ci++) {
      const col = cols[ci];
      d[keys[ki]][col] = 0;
    }
  }
  for (let ci = 0; ci < cols.length; ci++) {
    const col = cols[ci];
    d.SPD_min[col] = duoLineForStat('SPD', col, hrTable, statConstants);
    d.SPD_partner_HP[col] = duoLineForStat('HP%', col, hrTable, statConstants);
    d.SPD_partner_DEF[col] = duoLineForStat('DEF%', col, hrTable, statConstants);
    d.SPD_partner_ATK[col] = duoLineForStat('ATK%', col, hrTable, statConstants);
    d.SPD_partner_CRate[col] = duoLineForStat('CRate', col, hrTable, statConstants);
    d.CRate_for_CDmg[col] = duoLineForStat('CRate', col, hrTable, statConstants);
    d.CDmg_for_CRate[col] = duoLineForStat('CDmg', col, hrTable, statConstants);
    d.CRate_for_ATK[col] = duoLineForStat('CRate', col, hrTable, statConstants);
    d.ATK_for_CRate[col] = duoLineForStat('ATK%', col, hrTable, statConstants);
    d.HP_for_DEF[col] = duoLineForStat('HP%', col, hrTable, statConstants);
    d.DEF_for_HP[col] = duoLineForStat('DEF%', col, hrTable, statConstants);
    d.DEF_for_RES[col] = duoLineForStat('DEF%', col, hrTable, statConstants);
    d.RES_for_DEF[col] = duoLineForStat('RES', col, hrTable, statConstants);
    d.HP_for_RES[col] = duoLineForStat('HP%', col, hrTable, statConstants);
    d.RES_for_HP[col] = duoLineForStat('RES', col, hrTable, statConstants);
  }
  return d;
}

/** God threshold: Base × (1 + God_Mod) from statConstants (stage-independent). */
function getGodThreshold(stat, settings) {
  const row = settings?.statConstants?.[stat];
  if (!row || row.base == null) return null;
  const base = Number(row.base);
  if (!Number.isFinite(base) || base <= 0) return null;
  const mod = Number.isFinite(Number(row.godMod)) ? Number(row.godMod) : 0;
  return base * (1 + mod);
}

/** godConstants mirror for legacy readers — derived from statConstants. */
function godConstantsFromStatConstants(statConstants) {
  const o = {};
  for (const stat of GOD_STAT_ORDER) {
    const r = statConstants[stat];
    o[stat] = { base: r.base, godMod: r.godMod };
  }
  return o;
}

const DEFAULT_STAT_CONSTANTS = defaultStatConstants();
const DEFAULT_GOD_CONSTANTS = godConstantsFromStatConstants(DEFAULT_STAT_CONSTANTS);

function mergeGodConstants(saved) {
  if (!saved || typeof saved !== 'object') return godConstantsFromStatConstants(DEFAULT_STAT_CONSTANTS);
  const sc = JSON.parse(JSON.stringify(DEFAULT_STAT_CONSTANTS));
  applyGodConstantsToStatConstants(sc, saved);
  return godConstantsFromStatConstants(sc);
}

// ---- ADVANCED FORMULA SYSTEM ----
// Canonical role rules for the six archetypes (Classic DPS, Slow DPS, Bomber, Fast CC, Tank, Bruiser).
// Keep in sync with the project spreadsheet: acceptedMains, substats Include/Exclude, mustHave,
// slotRequirements, minStats per slot tier, requireHR. Legacy DEFAULT_ROLES mirrors rough parity for migration only.
const DEFAULT_FORMULAS = {
  'Classic DPS': {
    enabled: true,
    acceptedMains: { 2: ['SPD', 'None', 'None'], 4: ['CRate', 'CDmg', 'None'], 6: ['ATK%', 'None', 'None'] },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
      CRate: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CDmg: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' },
    },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' }, 6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 3 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } },
  },
  'Slow DPS': {
    enabled: true,
    acceptedMains: { 2: ['ATK%', 'None', 'None'], 4: ['CRate', 'CDmg', 'None'], 6: ['ATK%', 'None', 'None'] },
    substats: {
      SPD: { Early: 'None', Mid: 'None', Late: 'None' },
      'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
      CRate: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CDmg: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Bomber': {
    enabled: true,
    acceptedMains: { 2: ['SPD', 'ATK%', 'None'], 4: ['ATK%', 'None', 'None'], 6: ['ATK%', 'ACC', 'None'] },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'None', Mid: 'None', Late: 'None' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'None', Mid: 'None', Late: 'None' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'None', Mid: 'None', Late: 'None' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 1 }, 'Slot 4': { Early: 1, Mid: 1, Late: 1 }, 'Slot 6': { Early: 1, Mid: 1, Late: 1 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Fast CC': {
    enabled: true,
    acceptedMains: { 2: ['SPD', 'HP%', 'DEF%'], 4: ['HP%', 'DEF%', 'None'], 6: ['HP%', 'DEF%', 'ACC'] },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' },
    },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: { 2: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' }, 4: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' }, 6: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' } },
    minStats: { '1/3/5': { Early: 2, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } },
  },
  'Tank': {
    enabled: true,
    acceptedMains: { 2: ['HP%', 'DEF%', 'None'], 4: ['HP%', 'DEF%', 'None'], 6: ['HP%', 'DEF%', 'RES'] },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'Include', Mid: 'Include', Late: 'Include' }
    },
    mustHave: { Early: 'RES', Mid: 'RES', Late: 'RES' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'HP%', Mid: 'HP%', Late: 'HP%' }, 6: { Early: 'RES', Mid: 'RES', Late: 'RES' } },
    minStats: { '1/3/5': { Early: 2, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 1 }, 'Slot 4': { Early: 1, Mid: 1, Late: 1 }, 'Slot 6': { Early: 1, Mid: 1, Late: 1 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Bruiser': {
    enabled: true,
    acceptedMains: { 2: ['SPD', 'HP%', 'ATK%'], 4: ['CRate', 'CDmg', 'HP%'], 6: ['DEF%', 'HP%', 'ATK%'] },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CDmg: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      ACC: { Early: 'None', Mid: 'None', Late: 'None' },
      RES: { Early: 'None', Mid: 'None', Late: 'None' },
    },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'HP%', Mid: 'HP%', Late: 'HP%' } },
    minStats: { '1/3/5': { Early: 3, Mid: 3, Late: 3 }, 'Slot 2': { Early: 2, Mid: 2, Late: 3 }, 'Slot 4': { Early: 2, Mid: 2, Late: 3 }, 'Slot 6': { Early: 2, Mid: 2, Late: 3 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: true, Late: true } },
  },
};

const DEFAULT_ROLE_PRIORITY = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Duo Roll', 'High Roll'];

// ---- LEGACY ROLE DEFINITIONS (for backward compatibility) ----
// Include/Exclude/None; mustHave per stage; acceptedMains per slot; minStats per slot
const DEFAULT_ROLES = {
  'Classic DPS': {
    substats: { SPD:'Include', 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD'], 4:['CRate','CDmg'], 6:['ATK%'] },
    minStats: { Early:1, Mid:2, Late:3 },
    requireHR: { Early_Hero:false, Mid_Hero:true, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Slow DPS': {
    substats: { 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                SPD:'None', 'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    acceptedMains: { 2:['ATK%'], 4:['HP%','ATK%','DEF%'], 6:['ATK%','HP%','DEF%'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:false },
  },
  'Bomber': {
    substats: { SPD:'Include', 'ATK%':'Include', ACC:'Include',
                CRate:'None', CDmg:'None', 'HP%':'None', 'DEF%':'None', RES:'None' },
    mustHave: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
    acceptedMains: { 2:['SPD','ATK%'], 4:['HP%','ATK%','DEF%'], 6:['ATK%','HP%','ACC'] },
    minStats: { Early:1, Mid:1, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:false, Early_Leg:false, Mid_Leg:false, Late_Leg:false },
  },
  'Fast CC': {
    substats: { SPD:'Include', 'HP%':'Include', 'DEF%':'Include', ACC:'Include',
                'ATK%':'None', CRate:'None', CDmg:'None', RES:'None' },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD','HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','ACC'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Tank': {
    substats: { 'HP%':'Include', 'DEF%':'Include', RES:'Include', SPD:'Include',
                'ATK%':'None', CRate:'None', CDmg:'None', ACC:'None' },
    mustHave: { Early: 'RES', Mid: 'RES', Late: 'RES' },
    acceptedMains: { 2:['SPD','HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','RES'] },
    minStats: { Early:1, Mid:2, Late:2 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Bruiser': {
    substats: { SPD:'Include', 'HP%':'Include', 'ATK%':'Include', 'DEF%':'Include',
                CRate:'Include', CDmg:'Include', ACC:'None', RES:'None' },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    acceptedMains: { 2:['SPD','HP%','ATK%'], 4:['HP%','ATK%','DEF%'], 6:['DEF%','HP%','ATK%'] },
    minStats: { Early:2, Mid:3, Late:3 },
    requireHR: { Early_Hero:false, Mid_Hero:false, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
};

const DEFAULT_REAPP = {
  maxEff: 75,
  sets: ['Violent', 'Will', 'Swift', 'Despair', 'Vampire', 'Rage', 'Intangible'],
  innateStats: ['SPD', 'HP%', 'ATK%', 'DEF%'],
  mainBySlot: {
    2: ['SPD'],
    4: ['CDmg'],
    6: ['ATK%', 'HP%']
  }
};

// Grind recommendation: always targets Late×grade High Roll line (same hrThresholds as role anchors).
// gap: allowed distance multiplier (threshold - current <= gain * gap)
const DEFAULT_GRIND = {
  /** Stricter default: only subs within (gain × gap) of Late HR count. 0.5 ≈ half a grind window. */
  gap: 0.5,
};

// ---- GEM (innate Enchant Gem) — aligns with Sheets “Meta Sets + bad innate per slot”
const DEFAULT_GEM_META = {
  enabled: true,
  /** Spreadsheet Gem logic targets Legend runes primarily */
  legendOnlyInnate: true,
  /** Core meta sets where innate reroll is high value (matches spreadsheet list) */
  sets: ['Violent', 'Will', 'Swift', 'Despair', 'Vampire', 'Rage', 'Intangible'],
  /** Min calcEff (and Hero branch) before Gem verdict — tune to match spreadsheet */
  qualityGate: {
    early: { min: 40, heroMin: 52 },
    mid: { min: 55, heroMin: 67 },
    late: { min: 70, heroMin: 82 },
  },
  /**
   * If no entry in bySet[set][slot], merge extras for this slot + universal flat innates.
   * bySet overrides: Violent:{ 2:["RES","ACC"], 4:[...] }
   */
  useUniversalFlatBadInnate: true,
  universalFlatInnates: ['HP', 'ATK', 'DEF'],
  extraBadBySlot: {
    /** Example: ACC often weak innate on spd slot — extend in UI */
    2: [],
    4: [],
    6: [],
  },
  bySet: {},
  /** Fallback: previous engine — flat subs + suggest % target (deprecated path) */
  legacyFlatSubGem: false,
};

// ---- EFFICIENCY MAX VALUES (Legend 6★ for each stat) ----
// Used to calculate efficiency %
const EFF_MAX = {
  SPD:  { flat: 6 },
  'HP%':{ pct:  8 }, 'HP': { flat: 1875 },
  'ATK%':{ pct: 8 }, 'ATK':{ flat: 100 },
  'DEF%':{ pct: 8 }, 'DEF':{ flat: 100 },
  CRate:{ flat: 6 }, CDmg: { flat: 7 },
  ACC:  { flat: 8 }, RES:  { flat: 8 },
};
// Max main stat value per slot/type for efficiency baseline
const EFF_MAIN_MAX = {
  2: { SPD:42, 'HP%':63, 'ATK%':63, 'DEF%':63 },
  4: { 'HP%':63, 'ATK%':63, 'DEF%':63 },
  6: { 'HP%':63, 'ATK%':63, 'DEF%':63, ACC:64, RES:64 },
};

// ---- SETTINGS PERSISTENCE ----
const STORAGE_KEY = 'swrm_settings_v1';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return null;
}

function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e) {}
}

function mergeGemMeta(savedGem) {
  const d = JSON.parse(JSON.stringify(DEFAULT_GEM_META));
  if (!savedGem || typeof savedGem !== 'object') return d;
  Object.assign(d, savedGem);
  if (!Array.isArray(d.sets)) d.sets = DEFAULT_GEM_META.sets.slice();
  if (!Array.isArray(d.universalFlatInnates)) d.universalFlatInnates = DEFAULT_GEM_META.universalFlatInnates.slice();
  d.extraBadBySlot = Object.assign(
    {},
    DEFAULT_GEM_META.extraBadBySlot,
    typeof savedGem.extraBadBySlot === 'object' && savedGem.extraBadBySlot ? savedGem.extraBadBySlot : {}
  );
  d.bySet = typeof savedGem.bySet === 'object' && savedGem.bySet ? JSON.parse(JSON.stringify(savedGem.bySet)) : {};
  if (!d.qualityGate || typeof d.qualityGate !== 'object') {
    d.qualityGate = JSON.parse(JSON.stringify(DEFAULT_GEM_META.qualityGate));
  } else {
    d.qualityGate = {
      early: Object.assign({}, DEFAULT_GEM_META.qualityGate.early, savedGem.qualityGate.early || {}),
      mid: Object.assign({}, DEFAULT_GEM_META.qualityGate.mid, savedGem.qualityGate.mid || {}),
      late: Object.assign({}, DEFAULT_GEM_META.qualityGate.late, savedGem.qualityGate.late || {}),
    };
  }
  return d;
}

function getSettings() {
  const saved = loadSettings();
  const presetVersion = Number(saved?.presetVersion || 0);
  const formulas = saved?.formulas
    ? JSON.parse(JSON.stringify(saved.formulas))
    : JSON.parse(JSON.stringify(DEFAULT_FORMULAS));
  // Migration: keep legacy formula names aligned with canonical role names.
  if (formulas['Fast Utility'] && !formulas['Fast CC']) {
    formulas['Fast CC'] = formulas['Fast Utility'];
  }
  if (formulas['Heavy Resist'] && !formulas['Tank']) {
    formulas['Tank'] = formulas['Heavy Resist'];
  }
  delete formulas['Fast Utility'];
  delete formulas['Heavy Resist'];
  // One-time migration: enforce CSV-aligned presets for the six core formula roles.
  if (presetVersion < 2) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
    });
  }
  Object.values(formulas).forEach((formula) => {
    if (formula && formula.enabled === undefined) formula.enabled = true;
  });
  const roles = saved?.roles ? JSON.parse(JSON.stringify(saved.roles)) : JSON.parse(JSON.stringify(DEFAULT_ROLES));
  if (presetVersion < 2) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      roles[name] = JSON.parse(JSON.stringify(DEFAULT_ROLES[name]));
    });
  }
  const roleNames = Array.from(new Set([
    ...Object.keys(formulas || {}),
    ...Object.keys(roles || DEFAULT_ROLES),
  ]));
  const defaultConfiguredPriority = [
    ...DEFAULT_ROLE_PRIORITY.filter((name) => roleNames.includes(name)),
    ...roleNames.filter((name) => !DEFAULT_ROLE_PRIORITY.includes(name)),
  ];
  const storedPriority = (presetVersion < 3)
    ? defaultConfiguredPriority
    : (Array.isArray(saved?.rolePriority) ? saved.rolePriority : []);
  const rolePriority = [
    ...storedPriority.filter((name) => roleNames.includes(name)),
    ...roleNames.filter((name) => !storedPriority.includes(name)),
  ];

  let statConstants;
  if (saved?.statConstants && typeof saved.statConstants === 'object') {
    statConstants = mergeStatConstants(saved.statConstants);
    if (saved.godConstants && typeof saved.godConstants === 'object') {
      applyGodConstantsToStatConstants(statConstants, saved.godConstants);
    }
  } else if (saved?.hrThresholds && typeof saved.hrThresholds === 'object') {
    const duoLegacy = saved.duoThresholds && typeof saved.duoThresholds === 'object'
      ? saved.duoThresholds
      : DEFAULT_DUO_THRESHOLDS;
    statConstants = inferStatConstantsFromLegacyHrDuo(
      saved.hrThresholds,
      duoLegacy,
      saved.godConstants
    );
  } else {
    statConstants = mergeStatConstants(null);
  }

  const hrThresholds = computeHrThresholds(statConstants);
  const duoThresholds = computeDuoThresholds(statConstants, hrThresholds);
  const godConstants = godConstantsFromStatConstants(statConstants);

  let gemMeta = mergeGemMeta(saved?.gemMeta);
  let reapp = saved?.reapp && typeof saved.reapp === 'object'
    ? JSON.parse(JSON.stringify(saved.reapp))
    : JSON.parse(JSON.stringify(DEFAULT_REAPP));
  let grindGap = Number.isFinite(Number(saved?.grind?.gap)) ? Number(saved.grind.gap) : DEFAULT_GRIND.gap;
  // v9: tighten Grind — old default gap was 1.0 (too many runes). Migrate bare 1.0 to new default.
  if (presetVersion < 9 && (!saved?.grind || !Number.isFinite(Number(saved.grind.gap)) || Math.abs(Number(saved.grind.gap) - 1) < 1e-9)) {
    grindGap = DEFAULT_GRIND.gap;
  }
  const grind = { gap: grindGap };
  if (presetVersion < 5) {
    gemMeta.sets = DEFAULT_GEM_META.sets.slice();
    gemMeta.legendOnlyInnate = DEFAULT_GEM_META.legendOnlyInnate;
    gemMeta.qualityGate = JSON.parse(JSON.stringify(DEFAULT_GEM_META.qualityGate));
    reapp.sets = DEFAULT_REAPP.sets.slice();
  }
  // Spreadsheet-aligned six archetypes (reapply once when defaults change).
  if (presetVersion < 7) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      if (DEFAULT_FORMULAS[name]) {
        formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
      }
    });
  }

  return {
    thresholds:    saved?.thresholds    || JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
    statConstants,
    hrThresholds,
    duoThresholds,
    godConstants,
    roles,
    formulas,
    rolePriority,
    presetVersion: 9,
    reapp,
    grind,
    gemMeta,
  };
}

function applyDerivedThresholdFields(settings) {
  if (!settings || !settings.statConstants) return settings;
  const hr = computeHrThresholds(settings.statConstants);
  const duo = computeDuoThresholds(settings.statConstants, hr);
  settings.hrThresholds = hr;
  settings.duoThresholds = duo;
  settings.godConstants = godConstantsFromStatConstants(settings.statConstants);
  return settings;
}

/**
 * Maintainer-only release notes. Shipped with the bundle — not editable in the UI.
 * Roadmap bullets: STATIC_ROADMAP (Changelog tab → Plans).
 *
 * Each `items[locale]` is a string[] (legacy `{ shipped: [] }` is still read).
 *
 * Note: entries are newest-first. Calendar labels below use 2026-05-09 … 2026-05-12
 * so the journal does not show dates after “today” when the bundle is dated May 12.
 */
const STATIC_CHANGELOG = [
  {
    date: '2026-05-12',
    items: {
      en: [
        '**v1.1.3** — Dashboard chart stats column: small “n” / “avg” labels, softer monospace numbers, vertical stack and a light divider so counts are not a bold block beside gold percentages.',
        '**v1.1.2** — Dashboard role/set/slot bars use solid theme colors (accent / finish / grind); counts sit beside the bar so the number color is always the normal UI text color.',
        '**v1.1.1** — Verdict mix ordered by count (largest segment left); role/set/slot bar gradients use the same verdict/theme tokens as the rest of the dashboard; donate heart tint; Copy summary button stretches to the Global filter card height.',
        '**v1.1.0** — Site footer (Com2uS disclaimer + build version), subtle Donate link in header (Lava.top), Copy summary on the same row as global filters, dashboard chart counts padded and readable on short or empty fills.',
        'SWEX stat IDs fixed (e.g. 8 = SPD, 9 = CRate) so main/sub labels, filters, and roles match the game exporter.',
        'Engine uses base sub rolls only for roles, anchors, Duo/High checks, and verdict thresholds; each sub row still stores gem/grind/enchant flags for Gem and Grind rules.',
        'Formula Min Stats counts how many Include substats are present (must-have excluded from the count); Require High Roll (anchor) stays a separate checkbox.',
        'Verdict: failing Gem quality gate no longer downgrades to Sell when the rune already has a role; runes with no role and no Duo/High cannot end as Keep/Finish/Gem/Grind.',
        'Grind recommends only SPD / HP% / DEF% / ATK% toward the Late×grade High Roll line from Engine constants; one-grind gains +5 SPD / +10% stats; row must be ungrinded and not enchanted; gap multiplier narrows how far below the line you can be (default 0.5 after preset v9 migration from the old 1.0 default).',
        'Rune Rules → Verdict: separate cards for Gem, Grind, and Reapp (apply with Save & Recalculate). Role formula grids under Roles still auto-save and reprocess on each change.',
        'Bad flat detection: any enchanted sub makes the rune “clean” for that check; low flat count matches spreadsheet-style rules.',
        'Rune Table Target column: Grind shows ceil values; Gem shows Replace from → to.',
        'Eff% uses the exporter’s efficiency field when the JSON includes it.',
        'Debug: each parsed rune keeps `_raw` from SWEX for troubleshooting.',
      ],
      ru: [
        '**v1.1.3** — Колонка статистики у графиков: подписи n / ср., приглушённые цифры, две строки и разделитель — без «кучи» жирных чисел рядом с процентами.',
        '**v1.1.2** — Полосы ролей/сетов/слотов на дашборде — сплошные цвета темы (accent / finish / grind); числа рядом с полосой, цвет как у обычного текста интерфейса.',
        '**v1.1.1** — Verdict mix по убыванию числа рун (крупнейший сегмент слева); градиенты ролей/сетов/слотов из тех же токенов, что вердикты и тема; красное сердце у доната; кнопка Copy summary по высоте карточки Global filter.',
        '**v1.1.0** — Футер (дисклеймер Com2uS + версия сборки), аккуратная ссылка «Донат» в шапке (Lava.top), Copy summary в одной строке с фильтрами, подписи на графиках с отступом и читаемые при короткой заливке.',
        'Исправлены ID статов SWEX (например 8 = SPD, 9 = CRate) — корректные мейны/сабы, фильтры и роли.',
        'Движок считает роли, якоря и вердикты по базовому значению сабов (без гема/гринда); в строке саба по-прежнему хранятся флаги для правил Gem/Grind.',
        'Min Stats в формулах — только подсчёт Include-сабов (must-have в счёт не входит); галочка Require High Roll (якорь) отдельно.',
        'Вердикт: провал quality gate для Gem не уводит в Sell, если у руны уже есть роль; без роли и без Duo/High нельзя получить Keep/Finish/Gem/Grind.',
        'Grind только для SPD / HP% / DEF% / ATK% к линии Late×грейд High Roll из констант Engine; прибавка одного гринда +5 SPD / +10% к статам; строка без гринда и без зачарования; множитель gap сужает окно (дефолт 0.5 после миграции v9 со старого 1.0).',
        'Правила рун → Вердикт: отдельные блоки Gem, Grind, Reapp (применяются через «Сохранить и пересчитать»). Сетка формул в Roles по-прежнему сохраняется и пересчитывает руны при каждом изменении.',
        'Плоские сабы: любой зачарованный саб делает руну «чистой» для этой проверки.',
        'Колонка Target: Grind с округлением вверх; Gem — Replace из → в.',
        'Eff% из поля efficiency в JSON, если оно есть.',
        'Отладка: у распарсенной руны есть `_raw` из SWEX.',
      ],
    },
  },
  {
    date: '2026-05-11',
    items: {
      en: [
        'DEFAULT_FORMULAS replaced to match the current spreadsheet exactly (all 6 archetypes incl. acceptedMains, mustHave, slotRequirements, minStats, requireHR). Preset migration v7 reapplies the six archetype formulas once for existing saves. Canonical export: default-formulas.json in the repo root.',
      ],
      ru: [
        'DEFAULT_FORMULAS заменены в точном соответствии с текущей таблицей (все 6 архетипов: acceptedMains, mustHave, slotRequirements, minStats, requireHR). Миграция пресета v7 один раз обновляет шесть архетипов для существующих сохранений. Экспорт: default-formulas.json в корне репозитория.',
      ],
    },
  },
  {
    date: '2026-05-10',
    items: {
      en: [
        'Role engine: Classic DPS uses only the advanced formula path (legacy checkClassicDPS removed). Legacy checkRole is skipped for any role that has a formula entry so formulas are the single source of truth for the six archetypes.',
        'Formula min-stats: counts Include substats (other than must-have) that are present at or above the Mid/Late HR threshold for the rune’s stage × grade — fixes roles that were too permissive when minStats compared config list length.',
        'Gem defaults: Only Legend, seven meta sets (incl. Intangible), configurable qualityGate eff floors; Reapp allowed-set list aligned to the same seven. Preset migration v5 applies these defaults once for existing saves.',
        'SWEX set names: added Seal (24), Intangible (25), Immemorial (99) to match exporter mapping.',
        'Diagnostics: rune objects include swexEfficiency when the JSON provides it; use window.SWRM.logEfficiencyDiagSample(runes) in the console to compare with calc eff. After reprocessing, window.SWRM.summarizeVerdictsAndRoles(runes) prints verdict and role counts.',
      ],
      ru: [
        'Роли: Classic DPS только через advanced formula (legacy checkClassicDPS удалён). checkRole не вызывается для ролей, у которых есть запись в formulas — единый источник правды для шести архетипов.',
        'Min-stats в формулах: считаются Include-сабы (кроме must-have), реально присутствующие не ниже порога HR для стадии×грейда — исправляет излишне широкий матч.',
        'Gem по умолчанию: только Legend, семь мета-сетов (в т.ч. Intangible), настраиваемые пороги qualityGate; список сетов Reapp совпадает. Миграция пресета v5 один раз подтянет значения в старых сохранениях.',
        'Имена сетов SWEX: добавлены Seal (24), Intangible (25), Immemorial (99).',
        'Диагностика: поле swexEfficiency из JSON при наличии; logEfficiencyDiagSample(runes) в консоли; summarizeVerdictsAndRoles(runes) — сводка вердиктов и ролей после пересчёта.',
      ],
    },
  },
  {
    date: '2026-05-09',
    items: {
      en: [
        'Dashboard — Account progression: clearer copy for players; removed duplicate combined score next to the preset, the long formula footer, and internal jargon; clarified how the global filter relates to the suggestion.',
        'Removed the unused partner coefficient (hrCoeff) from the UI and from saved settings.',
        'Rune Rules → Engine → Constants: modifier columns use intuitive percents (e.g. 30 instead of 0.30), clearer headers, tooltips, and a longer explanation of what Base is and how the percent columns affect God, Duo, and stage lines.',
        'Changelog tab now shows these fixed release notes only — no per-browser scratch entries that disappear when storage is cleared.',
      ],
      ru: [
        'Дашборд — прогресс аккаунта: проще текст для игроков; убран дубль сводного балла у пресета, длинный блок с формулой и внутренняя терминология; яснее описан общий фильтр и совет по стадии.',
        'Удалён неиспользуемый коэффициент партнёра (hrCoeff) из интерфейса и из сохраняемых настроек.',
        'Правила рун → Движок → Constants: модификаторы вводятся как проценты (например 30 вместо 0,30), обновлены заголовки и подсказки, расширено объяснение Base и процентных колонок для God, Duo и стадий.',
        'Вкладка Changelog показывает только такие зафиксированные записи из сборки — больше нет локальных заметок в браузере, которые пропадают при очистке хранилища.',
      ],
    },
  },
];

/** Roadmap (Changelog tab → Plans) — discussed work not necessarily shipped yet. */
const STATIC_ROADMAP = {
  en: [
    'Optional “God potential” hint in the UI (informational only, not a Grind verdict).',
    'Optional stricter Grind rules (e.g. minimum efficiency or count of HR-quality lines).',
    'Further spreadsheet parity if counts drift after constant tweaks.',
  ],
  ru: [
    'Опциональная подсказка «God potential» в интерфейсе (только информация, не вердикт Grind).',
    'Опционально ужесточить Grind (например порог eff или число линий уровня HR).',
    'Дальнейшая подгонка под таблицу при расхождении после правок констант.',
  ],
};

window.SWRM = window.SWRM || {};
window.SWRM.APP_VERSION = APP_VERSION;
window.SWRM.settings = getSettings();
window.SWRM.applyDerivedThresholdFields = applyDerivedThresholdFields;
window.SWRM.STAT_NAMES = STAT_NAMES;
window.SWRM.SET_NAMES  = SET_NAMES;
window.SWRM.GRADE_NAMES = GRADE_NAMES;
window.SWRM.GRADE_SHORT = GRADE_SHORT;
window.SWRM.SLOT_MAIN_FIXED = SLOT_MAIN_FIXED;
window.SWRM.EFF_MAX = EFF_MAX;
window.SWRM.EFF_MAIN_MAX = EFF_MAIN_MAX;
window.SWRM.DEFAULT_ROLES = DEFAULT_ROLES;
window.SWRM.DEFAULT_THRESHOLDS = DEFAULT_THRESHOLDS;
window.SWRM.DEFAULT_HR_THRESHOLDS = DEFAULT_HR_THRESHOLDS;
window.SWRM.DEFAULT_DUO_THRESHOLDS = DEFAULT_DUO_THRESHOLDS;
window.SWRM.DEFAULT_STAT_CONSTANTS = DEFAULT_STAT_CONSTANTS;
window.SWRM.EXPLICIT_DEFAULT_STAT_CONSTANTS = EXPLICIT_DEFAULT_STAT_CONSTANTS;
window.SWRM.computeHrThresholds = computeHrThresholds;
window.SWRM.computeDuoThresholds = computeDuoThresholds;
window.SWRM.mergeStatConstants = mergeStatConstants;
window.SWRM.DEFAULT_GOD_CONSTANTS = DEFAULT_GOD_CONSTANTS;
window.SWRM.GOD_STAT_ORDER = GOD_STAT_ORDER;
window.SWRM.mergeGodConstants = mergeGodConstants;
window.SWRM.getGodThreshold = getGodThreshold;
window.SWRM.DEFAULT_REAPP = DEFAULT_REAPP;
window.SWRM.DEFAULT_GRIND = DEFAULT_GRIND;
window.SWRM.DEFAULT_GEM_META = DEFAULT_GEM_META;
window.SWRM.mergeGemMeta = mergeGemMeta;
window.SWRM.DEFAULT_FORMULAS = DEFAULT_FORMULAS;
window.SWRM.saveSettings = saveSettings;
window.SWRM.TRANSLATIONS = TRANSLATIONS;
window.SWRM.STATIC_CHANGELOG = STATIC_CHANGELOG;
window.SWRM.STATIC_ROADMAP = STATIC_ROADMAP;
