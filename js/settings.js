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
const GRADE_SHORT = { 4:'Hero', 5:'Legend' };

// ==== TRANSLATIONS ====
const TRANSLATIONS = {
  en: {
    // Header
    title: 'SW Rune Master',
    dashboard: 'Dashboard',
    runeTable: 'Rune Table',
    actionList: 'Action List',
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
    actionsCount: 'actions',
    actionsListedSummary: 'Listed actions',
    actionListLead:
      'Only Upgrade, Finish, Gem, Grind and Reapp. Min Lvl from Dashboard applies globally.',
    actionSearchPlaceholder: 'Search by set, stat, role, verdict…',
    allActions: 'All actions',
    targetHeading: 'Target',
    exportActionCsv: 'Export CSV',
    actionTargetUpgrade: 'Power to ≥ +9 before judging',
    actionTargetFinish: 'Power to +12',
    actionTargetReapp: 'Reappraisal (roll subs)',
    
    // Settings
    thresholds: 'Thresholds',
    roleFilters: 'Role Filters',
    reappRules: 'Reapp Rules',
    generalThresholds: 'General Thresholds',
    highRollThresholds: 'High Roll Thresholds',
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
      'Early / Mid / Late sets rule strictness. Suggestion uses all +9+ runes in your export (ignores Min Lvl below). You can override manually.',

    stageSuggestedLabel: 'Suggested stage',
    stageYourPresetLabel: 'Your preset',
    stageScoreLabel: 'Combined score',
    stageApplySuggestion: 'Apply suggestion',
    stageMismatchHint: 'Your preset differs from the suggestion—you can still keep your choice.',
    stageAdvisorNoEligible:
      'Suggestion needs runes at +9 or higher. Power up some runes or load another export.',

    stageMetricsExplainer:
      'All +9+ runes (ignores Min Lvl). Entire combined score uses Mid preset only (power thresholds, Keep verdicts, meta share) — switching Early/Late does not change it. Weights:',

    stageCardHrName: 'Power share',
    stageCardHrDesc:
      'Among +9 runes: % with power > 0. Uses Mid preset thresholds only (count subs ≥ High Roll table, cap 1–3 like Engine!AH).',

    stageCardKeepName: 'Avg Keep efficiency',
    stageCardKeepDesc:
      'Mean uncapped SWOP-style % for Keep (same formula as the table, not limited to 100). Scoring: min(avg / 130, 1) × 30. Rune Table still shows capped 0–100%.',

    stageCardMetaName: 'Meta sets among Keep',
    stageCardMetaDesc:
      'Among Keep runes: percent on Violent, Swift, or Will.',

    stageFormulaExpl:
      'Score = 40% × power share + 30% × min(avg Keep eff / 130, 1) + 30% × meta among Keep. Suggested stage (stricter Early than Sheets): combined score below 43 → Early, below 52 → Mid, otherwise Late.',

    dashboardScopeTitle: 'Global filter',
    dashboardScopeHint:
      'Applies to the summary cards, charts below, Rune Table, and Action List. Does not change the Account progression suggestion (it always uses all +9+ runes).'
  },
  ru: {
    // Header
    title: 'SW Rune Master',
    dashboard: 'Панель',
    runeTable: 'Руны',
    actionList: 'Действия',
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
    actionsCount: 'действий',
    actionsListedSummary: 'В списке',
    actionListLead:
      'Только Upgrade, Finish, Gem, Grind и Reapp. Общий Min Lvl с панели учитывается.',
    actionSearchPlaceholder: 'Поиск по сету, стату, роли, вердикту…',
    allActions: 'Все действия',
    targetHeading: 'Цель',
    exportActionCsv: 'Экспорт CSV',
    actionTargetUpgrade: 'Докачать до ≥ +9',
    actionTargetFinish: 'Докачать до +12',
    actionTargetReapp: 'Реапп подстатов',
    
    // Settings
    thresholds: 'Пороги',
    roleFilters: 'Фильтры Ролей',
    reappRules: 'Правила Перестановки',
    generalThresholds: 'Общие Пороги',
    highRollThresholds: 'Пороги Высоких Показателей',
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
      'Стадия задаёт строгость правил. Совет — по всем рунам от +9 в экспорте (без учёта «Мин. ур.» ниже). Можно выбрать вручную.',

    stageSuggestedLabel: 'Советуемая стадия',
    stageYourPresetLabel: 'Ваш выбор',
    stageScoreLabel: 'Сводный балл',
    stageApplySuggestion: 'Применить совет',
    stageMismatchHint: 'Ваш выбор отличается от совета — так можно оставить.',
    stageAdvisorNoEligible:
      'Для совета нужны руны от +9. Докачайте руны или загрузите другой экспорт.',

    stageMetricsExplainer:
      'Все руны от +9 (без «Мин. ур.»). Весь сводный балл только в логике Mid (пороги power, вердикты Keep, мета) — смена Early/Late его не меняет. Веса:',

    stageCardHrName: 'Доля «силы субов»',
    stageCardHrDesc:
      'Среди +9: % с power > 0. Только пороги Mid и таблица High Roll; уровень 1–3 как Engine!AH.',

    stageCardKeepName: 'Средняя eff Keep',
    stageCardKeepDesc:
      'Средняя eff без потолка 100% (SWOP-стиль), только для совета. В балл: min(средн./130, 1) × 30. В таблице рун по-прежнему 0–100%.',

    stageCardMetaName: 'Мета-сеты среди Keep',
    stageCardMetaDesc:
      'Среди Keep: доля рун на Violent, Swift или Will.',

    stageFormulaExpl:
      'Балл = 40% × доля power + 30% × min(средн. Keep eff / 130, 1) + 30% × мета среди Keep. Стадия (жёстче Early, чем в Sheets): балл ниже 43 → Ранняя, ниже 52 → Средняя, иначе Поздняя.',

    dashboardScopeTitle: 'Общий фильтр',
    dashboardScopeHint:
      'Учитывается в карточках сводки, графиках ниже, таблице рун и списке действий. На блок «Совет по прогрессу» не влияет — там всегда все руны от +9.'
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

// Теперь High Roll всегда равен обычным порогам
const DEFAULT_HR_THRESHOLDS = DEFAULT_THRESHOLDS;
const DEFAULT_HR_COEFF = 0.70; // partner soft threshold

// Duo Roll pairs
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

// ---- ADVANCED FORMULA SYSTEM ----
// New structure for multiple formulas with comprehensive settings
const DEFAULT_FORMULAS = {
  'Classic DPS': {
    enabled: true,
    acceptedMains: {
      2: ['SPD', 'None', 'None'],
      4: ['CRate', 'CDmg', 'None'],
      6: ['ATK%', 'None', 'None']
    },
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
    mustHave: { Early: null, Mid: 'SPD', Late: 'SPD' },
    slotRequirements: {
      2: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
      4: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
      6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' }
    },
    minStats: {
      '1/3/5': { Early: 1, Mid: 2, Late: 3 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 }
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: false, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: true }
    }
  },
  'Slow DPS': {
    enabled: true,
    acceptedMains: {
      2: ['ATK%', 'None', 'None'],
      4: ['CRate', 'CDmg', 'None'],
      6: ['ATK%', 'None', 'None']
    },
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
    mustHave: { Early: null, Mid: 'CRate', Late: 'CRate' },
    slotRequirements: {
      2: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
      4: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
      6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' }
    },
    minStats: {
      '1/3/5': { Early: 1, Mid: 2, Late: 2 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 }
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: false, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: false }
    }
  },
  'Bomber': {
    enabled: true,
    acceptedMains: {
      2: ['SPD', 'ATK%', 'None'],
      4: ['ATK%', 'None', 'None'],
      6: ['ATK%', 'ACC', 'None']
    },
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
    slotRequirements: {
      2: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
      4: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
      6: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' }
    },
    minStats: {
      '1/3/5': { Early: 1, Mid: 1, Late: 2 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 }
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: false, Late: false },
      'High Roll for Legend': { Early: false, Mid: false, Late: false }
    }
  },
  'Fast Utility': {
    enabled: true,
    acceptedMains: {
      2: ['SPD', 'HP%', 'DEF%'],
      4: ['HP%', 'DEF%', 'None'],
      6: ['HP%', 'DEF%', 'ACC']
    },
    substats: {
      SPD: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'HP%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      'ATK%': { Early: 'None', Mid: 'None', Late: 'None' },
      'DEF%': { Early: 'Include', Mid: 'Include', Late: 'Include' },
      CRate: { Early: 'None', Mid: 'None', Late: 'None' },
      CDmg: { Early: 'None', Mid: 'None', Late: 'None' },
      ACC: { Early: 'Include', Mid: 'Include', Late: 'Include' },
      RES: { Early: 'Include', Mid: 'Include', Late: 'Include' }
    },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    slotRequirements: {
      2: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
      4: { Early: 'HP%', Mid: 'HP%', Late: 'HP%' },
      6: { Early: 'DEF%', Mid: 'DEF%', Late: 'DEF%' }
    },
    minStats: {
      '1/3/5': { Early: 1, Mid: 2, Late: 2 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 }
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: false, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: true }
    }
  },
  'Heavy Resist': {
    enabled: true,
    acceptedMains: {
      2: ['HP%', 'DEF%', 'None'],
      4: ['HP%', 'DEF%', 'RES'],
      6: ['HP%', 'DEF%', 'RES']
    },
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
    slotRequirements: {
      2: { Early: 'RES', Mid: 'RES', Late: 'RES' },
      4: { Early: 'RES', Mid: 'RES', Late: 'RES' },
      6: { Early: 'RES', Mid: 'RES', Late: 'RES' }
    },
    minStats: {
      '1/3/5': { Early: 1, Mid: 2, Late: 2 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 }
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: false, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: true }
    }
  },
  'Bruiser': {
    enabled: true,
    acceptedMains: {
      2: ['SPD', 'HP%', 'ATK%'],
      4: ['HP%', 'ATK%', 'DEF%'],
      6: ['DEF%', 'HP%', 'ATK%']
    },
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
    slotRequirements: {
      2: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' },
      4: { Early: 'ATK%', Mid: 'ATK%', Late: 'ATK%' },
      6: { Early: 'DEF%', Mid: 'DEF%', Late: 'DEF%' }
    },
    minStats: {
      '1/3/5': { Early: 2, Mid: 3, Late: 3 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 }
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: false, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: true }
    }
  }
};

// ---- LEGACY ROLE DEFINITIONS (for backward compatibility) ----
// Include/Exclude/None; mustHave per stage; acceptedMains per slot; minStats per slot
const DEFAULT_ROLES = {
  'Classic DPS': {
    substats: { SPD:'Include', 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: null, Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2:['SPD'], 4:['HP%','ATK%','DEF%'], 6:['ATK%','HP%','DEF%'] },
    minStats: { Early:1, Mid:2, Late:2 },
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
  return {
    thresholds:    saved?.thresholds    || JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS)),
    hrThresholds:  saved?.hrThresholds  || JSON.parse(JSON.stringify(DEFAULT_HR_THRESHOLDS)),
    hrCoeff:       saved?.hrCoeff       ?? DEFAULT_HR_COEFF,
    duoThresholds: saved?.duoThresholds || JSON.parse(JSON.stringify(DEFAULT_DUO_THRESHOLDS)),
    roles:         saved?.roles         || JSON.parse(JSON.stringify(DEFAULT_ROLES)),
    formulas:      saved?.formulas      || JSON.parse(JSON.stringify(DEFAULT_FORMULAS)),
    reapp:         saved?.reapp         || JSON.parse(JSON.stringify(DEFAULT_REAPP)),
    gemMeta:       mergeGemMeta(saved?.gemMeta),
  };
}

window.SWRM = window.SWRM || {};
window.SWRM.settings = getSettings();
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
window.SWRM.DEFAULT_REAPP = DEFAULT_REAPP;
window.SWRM.DEFAULT_GEM_META = DEFAULT_GEM_META;
window.SWRM.mergeGemMeta = mergeGemMeta;
window.SWRM.DEFAULT_FORMULAS = DEFAULT_FORMULAS;
window.SWRM.saveSettings = saveSettings;
window.SWRM.TRANSLATIONS = TRANSLATIONS;
