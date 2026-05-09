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
    dbSlot: 'Database Slot',
    current: 'Current',
    name: 'Name',
    uploaded: 'Uploaded',
    clipboard: 'Clipboard',
    upload: 'Upload',
    download: 'Download',
    delete: 'Delete',
    swap: 'Swap',
    slotEmpty: 'Selected slot is empty',
    parseError: 'Failed to parse slot JSON: ',
    dbSlotsTitle: 'Database Slots',
    dbSlotsDesc: 'Store up to 4 different JSON databases and switch between them instantly.',
    
    // Stages
    early: 'Early',
    mid: 'Mid',
    late: 'Late'
  },
  ru: {
    // Header
    title: 'SW Rune Master',
    dashboard: 'Панель',
    runeTable: 'Таблица Рун',
    runeRules: 'Правила Рун',
    guide: 'Инструкция',
    changelog: 'Изменения',
    loadJson: 'Загрузить JSON',
    minLvl: 'Мин Ур',
    settings: 'Настройки',
    
    // Upload prompt
    loadYourSWEX: 'Загрузите ваш SWEX JSON',
    uploadDescription: 'Экспортируйте данные аккаунта из <strong>Summoners War Exporter (SWEX)</strong> и загрузите JSON файл здесь для анализа вашей коллекции рун.',
    chooseJsonFile: 'Выбрать JSON файл',
    privacyNote: 'Все обработка происходит в вашем браузере — ваши данные никогда не покидают ваше устройство.',
    
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
    roleDistribution: 'Распределение Ролей',
    setDistribution: 'Распределение Сетов',
    slotDistribution: 'Распределение Слотов',
    efficiencyDistribution: 'Распределение Эффективности',
    
    // Table
    searchPlaceholder: 'Поиск по сету, стату, роли...',
    allVerdicts: 'Все Вердикты',
    allRoles: 'Все Роли',
    allGrades: 'Все Грейды',
    runes: 'рун',
    
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
    appSettings: 'Настройки Приложения',
    language: 'Язык',
    theme: 'Тема',
    dbSlot: 'Слот Базы Данных',
    current: 'Текущий',
    name: 'Имя',
    uploaded: 'Загружен',
    clipboard: 'Буфер',
    upload: 'Загрузить',
    download: 'Скачать',
    delete: 'Удалить',
    swap: 'Переключить',
    slotEmpty: 'Выбранный слот пуст',
    parseError: 'Ошибка разбора JSON слота: ',
    dbSlotsTitle: 'Слоты Базы Данных',
    dbSlotsDesc: 'Сохраняйте до 4 различных JSON баз данных и переключайтесь между ними мгновенно.',
    
    // Stages
    early: 'Ранняя',
    mid: 'Средняя',
    late: 'Поздняя'
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
window.SWRM.saveSettings = saveSettings;
window.SWRM.TRANSLATIONS = TRANSLATIONS;
