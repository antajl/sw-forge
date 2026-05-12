// =============================================
// settings.js — Default thresholds & config
// =============================================

const STAT_NAMES = {
  1:  'HP',     2:  'HP%',    3:  'ATK',
  4:  'ATK%',   5:  'DEF',    6:  'DEF%',
  8:  'CRate',  9:  'CDmg',   10: 'RES',
  11: 'ACC',    12: 'SPD'
};

const SET_NAMES = {
  1:  'Energy',   2:  'Guard',    3:  'Swift',
  4:  'Blade',    5:  'Rage',     6:  'Focus',
  7:  'Endure',   8:  'Fatal',    10: 'Despair',
  11: 'Vampire',  13: 'Violent',  14: 'Nemesis',
  15: 'Will',     16: 'Shield',   17: 'Revenge',
  18: 'Destroy',  19: 'Fight',    20: 'Determination',
  21: 'Enhance',  22: 'Accuracy', 23: 'Tolerance'
};

const GRADE_NAMES = { 1:'Common', 2:'Magic', 3:'Rare', 4:'Hero', 5:'Legend' };
/** Short labels used in UI / filters (SWEX rank → string) */
const GRADE_SHORT = { 3:'Rare', 4:'Hero', 5:'Legend' };

// ==== TRANSLATIONS ====
const TRANSLATIONS = {
  en: {
    // Header
    title: 'SW Rune Master',
    dashboard: 'Dashboard',
    runeTable: 'Rune Table',
    runeRules: 'Rune Rules',
    guide: 'Guide',
    changelog: 'Changelog',
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
      'Stage + grade grid: used for grind checks, rune power level (0–3), and formula anchors «High Roll for Hero/Legend». Does not set the God Roll line.',
    godRollConstants: 'God Roll constants',
    godRollConstantsDesc:
      'Per stat: God threshold = Base × (1 + God Mod). Same at every stage (matches Sheets Constants). The «High Roll» role in the engine uses this line only.',
    constantsSheetTitle: 'Constants (8 stats)',
    constantsSheetDesc:
      'Sheets-style Constants row per stat: Base, God Mod, Duo Mod, Early ×, Late ×, Grade mod. The «= God line» column shows Base×(1+God Mod). Stage+grade HR (C:J) and Duo (K:R) previews are computed from these — not stored separately.',
    enginePreviewHr: 'Engine HR preview (C:J)',
    enginePreviewDuo: 'Engine Duo preview (K:R)',
    godColBase: 'Base',
    godColMod: 'God Mod',
    godColResult: '= God line',
    constColDuoMod: 'Duo Mod',
    constColEarly: 'Early ×',
    constColLate: 'Late ×',
    constColGrade: 'Grade mod',
    resetConstantsButton: 'Reset Constants to defaults',
    resetConstantsHint: 'Reloads the built-in Constants table only. Roles, formulas, and other settings stay unchanged.',
    resetConstantsConfirm:
      'Replace the Constants (8 stats) grid with built-in defaults? Roles and formulas will not be changed.',
    resetConstantsDone: 'Constants reset to defaults.',
    duoRollThresholds: 'Duo Roll Thresholds',
    partnerCoeff: 'Partner coefficient',
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
      'Early / Mid / Late sets rule strictness. Combined score uses Depth v2 over your full Rare+ export (SWEX rank ≥3) — SPD depth, +15 depth, and elite average uncapped eff. Unaffected by preset or Min Lvl below.',

    stageSuggestedLabel: 'Suggested stage',
    stageYourPresetLabel: 'Your preset',
    stageScoreLabel: 'Combined score',
    stageApplySuggestion: 'Apply suggestion',
    stageMismatchHint: 'Your preset differs from the suggestion—you can still keep your choice.',
    stageAdvisorNoEligible:
      'Load a SWEX export to see progression depth and combined score.',

    stageMetricsExplainer:
      'Depth v2: full export, absolute depth metrics. Preset and Min Lvl do not change this. Weights:',

    stageCardHrName: 'Speed Depth',
    stageCardHrWeight: '35%',
    stageCardHrDesc:
      'Count of runes with substat SPD sum ≥ 18 (base + grind). Score term capped at 250 runes (see CFG in analyzeGameStage).',

    stageCardKeepName: 'Power Depth',
    stageCardKeepWeight: '35%',
    stageCardKeepDesc:
      'Count of 6★ runes at exactly +15. Score term capped at 600 runes (CFG).',

    stageCardMetaName: 'Elite Quality',
    stageCardMetaWeight: '30%',
    stageCardMetaDesc:
      'Mean uncapped SWOP-style eff over top min(50, n) runes; if you have fewer than 50, n = all runes. Baseline 80, span 30 for full points (CFG).',

    stageEliteValFormat: '{eff}% · n={n}',

    stageFormulaExpl:
      'Depth v2: min(SPD-depth / 250, 1)×35 + min(+15 count / 600, 1)×35 + min(max(0, eliteAvg−80) / 30, 1)×30. Suggested stage: below 45 → Early, below 85 → Mid, otherwise Late. Tune all values in analyzeGameStage CFG.',

    dashboardScopeTitle: 'Global filter',
    dashboardScopeHint:
      'Applies to the summary cards, charts below, and Rune Table. Does not change the progression suggestion (Depth v2 uses the full export).'
  },
  ru: {
    // Header
    title: 'SW Rune Master',
    dashboard: 'Панель',
    runeTable: 'Руны',
    runeRules: 'Правила',
    guide: 'Гайд',
    changelog: 'Лог',
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
      'Сетка стадия + грейд: для гринда, уровня силы руны (0–3) и якорей формул «High Roll for Hero/Legend». Не задаёт линию God Roll.',
    godRollConstants: 'Константы God Roll',
    godRollConstantsDesc:
      'По стату: порог God = Base × (1 + God Mod). Одинаков при любой стадии (как Constants в Sheets). Роль «High Roll» в движке использует только эту линию.',
    constantsSheetTitle: 'Constants (8 статов)',
    constantsSheetDesc:
      'Строка Constants как в Sheets: Base, God Mod, Duo Mod, Early×, Late×, Grade mod. Колонка «= God line» — Base×(1+God Mod). Сетки HR (C:J) и Duo (K:R) считаются из них и не хранятся отдельно.',
    enginePreviewHr: 'Превью HR (C:J)',
    enginePreviewDuo: 'Превью Duo (K:R)',
    godColBase: 'Base',
    godColMod: 'God Mod',
    godColResult: '= линия God',
    constColDuoMod: 'Duo Mod',
    constColEarly: 'Early ×',
    constColLate: 'Late ×',
    constColGrade: 'Grade mod',
    resetConstantsButton: 'Сбросить Constants к умолчанию',
    resetConstantsHint:
      'Подставляет встроенную таблицу Constants. Роли, формулы и остальные настройки не трогаются.',
    resetConstantsConfirm:
      'Заменить таблицу Constants (8 статов) на значения по умолчанию? Роли и формулы не изменятся.',
    resetConstantsDone: 'Constants сброшены к умолчанию.',
    duoRollThresholds: 'Пороги Парных Показателей',
    partnerCoeff: 'Коэффициент партнера',
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
      'Стадия задаёт строгость правил. Сводный балл — Depth v2 по всему экспорту (Rare+, ранг ≥3 в SWEX): SPD-глубина, +15, элита по eff. Пресет и «Мин. ур.» на балл не влияют.',

    stageSuggestedLabel: 'Советуемая стадия',
    stageYourPresetLabel: 'Ваш выбор',
    stageScoreLabel: 'Сводный балл',
    stageApplySuggestion: 'Применить совет',
    stageMismatchHint: 'Ваш выбор отличается от совета — так можно оставить.',
    stageAdvisorNoEligible:
      'Загрузите SWEX JSON, чтобы увидеть глубину и сводный балл.',

    stageMetricsExplainer:
      'Depth v2 по полному экспорту, без пресета/«Мин. ур.». Веса на карточках:',

    stageCardHrName: 'SPD-глубина',
    stageCardHrWeight: '35%',
    stageCardHrDesc:
      'Число рун с суммой саб SPD ≥ 18 (база + камень). В балле до 250 (CFG в analyzeGameStage).',

    stageCardKeepName: 'Глубина +15',
    stageCardKeepWeight: '35%',
    stageCardKeepDesc:
      'Число 6★ рун на ровно +15. В балле до 600 (CFG).',

    stageCardMetaName: 'Элита по eff',
    stageCardMetaWeight: '30%',
    stageCardMetaDesc:
      'Средняя uncapped-eff по топ min(50, n); если рун < 50, берутся все. База 80%, диапазон 30 (CFG).',

    stageEliteValFormat: '{eff}% · n={n}',

    stageFormulaExpl:
      'Depth v2 (CFG в analyzeGameStage): SPD / 250, +15 / 600, элита по eff. Стадии: до 45 → Ранняя, до 85 → Средняя, иначе Поздняя.',

    dashboardScopeTitle: 'Общий фильтр',
    dashboardScopeHint:
      'Карточки сводки, графики и таблица рун. На совет не влияет — Depth v2 считает по всему экспорту.'
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
const DEFAULT_HR_COEFF = 0.70; // partner soft threshold

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

/** Stats aligned with Sheets Constants table (8 substats). */
const GOD_STAT_ORDER = ['SPD', 'HP%', 'DEF%', 'ATK%', 'CRate', 'CDmg', 'ACC', 'RES'];
const HR_COL_KEYS = ['Early_Leg', 'Early_Hero', 'Mid_Leg', 'Mid_Hero', 'Late_Leg', 'Late_Hero'];

function roundThresh(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.round(x * 100) / 100;
}

/**
 * Stage+grade HR cell from Constants (Sheets Engine C:J):
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
// New structure for multiple formulas with comprehensive settings
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
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'None', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: { 2: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' }, 4: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' }, 6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 3 }, 'Slot 2': { Early: 1, Mid: 1, Late: 1 }, 'Slot 4': { Early: 1, Mid: 1, Late: 1 }, 'Slot 6': { Early: 1, Mid: 1, Late: 1 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
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
    mustHave: { Early: 'None', Mid: 'CRate', Late: 'CRate' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 3 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
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
    slotRequirements: { 2: { Early: 'None', Mid: 'ATK%', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'None', Mid: 'None', Late: 'None' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 3 }, 'Slot 2': { Early: 1, Mid: 1, Late: 1 }, 'Slot 4': { Early: 1, Mid: 1, Late: 1 }, 'Slot 6': { Early: 1, Mid: 1, Late: 1 } },
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
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: { 2: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' }, 4: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' }, 6: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' } },
    minStats: { '1/3/5': { Early: 2, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 1 }, 'Slot 4': { Early: 1, Mid: 1, Late: 1 }, 'Slot 6': { Early: 1, Mid: 1, Late: 1 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Tank': {
    enabled: true,
    acceptedMains: { 2: ['HP%', 'DEF%', 'None'], 4: ['HP%', 'DEF%', 'None'], 6: ['HP%', 'DEF%', 'RES'] },
    substats: {
      SPD: { Early: 'None', Mid: 'None', Late: 'None' },
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
      RES: { Early: 'None', Mid: 'None', Late: 'None' }
    },
    mustHave: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'HP%', Mid: 'HP%', Late: 'HP%' } },
    minStats: { '1/3/5': { Early: 3, Mid: 3, Late: 3 }, 'Slot 2': { Early: 2, Mid: 2, Late: 2 }, 'Slot 4': { Early: 2, Mid: 2, Late: 2 }, 'Slot 6': { Early: 2, Mid: 2, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: true, Late: true } }
  }
};

const DEFAULT_ROLE_PRIORITY = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Duo Roll', 'High Roll'];

// ---- LEGACY ROLE DEFINITIONS (for backward compatibility) ----
// Include/Exclude/None; mustHave per stage; acceptedMains per slot; minStats per slot
const DEFAULT_ROLES = {
  'Classic DPS': {
    substats: { SPD:'Include', 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: null, Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD'], 4:['CRate','CDmg'], 6:['ATK%'] },
    minStats: { Early:1, Mid:2, Late:3 },
    requireHR: { Early_Hero:false, Mid_Hero:true, Late_Hero:true, Early_Leg:false, Mid_Leg:false, Late_Leg:true },
  },
  'Slow DPS': {
    substats: { 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                SPD:'None', 'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: null, Mid: 'CRate', Late: 'CRate' },
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
    substats: { 'HP%':'Include', 'DEF%':'Include', RES:'Include',
                SPD:'None', 'ATK%':'None', CRate:'None', CDmg:'None', ACC:'None' },
    mustHave: { Early: 'RES', Mid: 'RES', Late: 'RES' },
    acceptedMains: { 2:['HP%','DEF%'], 4:['HP%','DEF%'], 6:['HP%','DEF%','RES'] },
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
  sets: ['Violent', 'Will', 'Swift', 'Despair', 'Fatal', 'Rage', 'Nemesis', 'Revenge', 'Destroy', 'Vampire', 'Blade'],
  innateStats: ['SPD', 'HP%', 'ATK%', 'DEF%'],
  mainBySlot: {
    2: ['SPD'],
    4: ['CDmg'],
    6: ['ATK%', 'HP%']
  }
};

// ---- GEM (innate Enchant Gem) — aligns with Sheets “Meta Sets + bad innate per slot”
const DEFAULT_GEM_META = {
  enabled: true,
  /** Legend runes usually have innate; Hero Gem is rare — allow both by default */
  legendOnlyInnate: false,
  /** Value rune sets where rolling innate is worthwhile */
  sets: ['Violent', 'Will', 'Swift', 'Despair', 'Vampire', 'Rage', 'Fatal', 'Nemesis', 'Revenge', 'Destroy', 'Blade'],
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

  return {
    thresholds:    saved?.thresholds    || JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
    statConstants,
    hrThresholds,
    duoThresholds,
    godConstants,
    hrCoeff:       saved?.hrCoeff       ?? DEFAULT_HR_COEFF,
    roles,
    formulas,
    rolePriority,
    presetVersion: 4,
    reapp:         saved?.reapp         || JSON.parse(JSON.stringify(DEFAULT_REAPP)),
    gemMeta:       mergeGemMeta(saved?.gemMeta),
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

window.SWRM = window.SWRM || {};
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
window.SWRM.DEFAULT_HR_COEFF = DEFAULT_HR_COEFF;
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
window.SWRM.DEFAULT_GEM_META = DEFAULT_GEM_META;
window.SWRM.mergeGemMeta = mergeGemMeta;
window.SWRM.DEFAULT_FORMULAS = DEFAULT_FORMULAS;
window.SWRM.saveSettings = saveSettings;
window.SWRM.TRANSLATIONS = TRANSLATIONS;
