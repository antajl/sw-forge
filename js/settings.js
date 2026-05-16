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

/** Localized stat abbreviations for dropdowns (engine + JSON still use {@link STAT_NAMES}). French uses in-game style: VIT, PV, ATQ… */
const STAT_NAMES_UI_BY_LANG = {
  en: { ...STAT_NAMES },
  ru: { ...STAT_NAMES },
  fr: {
    1: 'PV',
    2: 'PV%',
    3: 'ATQ',
    4: 'ATQ%',
    5: 'DEF',
    6: 'DEF%',
    8: 'VIT',
    9: 'Taux CR',
    10: 'DG CR',
    11: 'RÉS',
    12: 'PRÉ',
  },
};
function statNamesUiForLang(lang) {
  return STAT_NAMES_UI_BY_LANG[lang] || STAT_NAMES_UI_BY_LANG.en;
}

const SET_NAMES = {
  1:  'Energy',   2:  'Guard',    3:  'Swift',
  4:  'Blade',    5:  'Rage',     6:  'Focus',
  7:  'Endure',   8:  'Fatal',    10: 'Despair',
  11: 'Vampire',  13: 'Violent',  14: 'Nemesis',
  15: 'Will',     16: 'Shield',   17: 'Revenge',
  18: 'Destroy',  19: 'Fight',    20: 'Determination',
  21: 'Enhance',  22: 'Accuracy', 23: 'Tolerance',
  24: 'Seal',     25: 'Intangible',
  /* 99 is not a playable 4‑piece rune set name in SW; SWEX may still emit it — show as Set99 via parser fallback. */
};

const GRADE_NAMES = { 1:'Common', 2:'Magic', 3:'Rare', 4:'Hero', 5:'Legend' };
/** Short labels used in UI / filters (SWEX rank → string) */
const GRADE_SHORT = { 3:'Rare', 4:'Hero', 5:'Legend' };

/** Shown in footer, changelog, and Copy summary — bump when shipping a user-visible build. */
const APP_VERSION = '1.2.16';

/**
 * Debug only: when true, the verdict engine skips every check that compares `rune.eff`
 * (Gem quality gate, Reapp max-eff, Hero +9…+11 Sell-on-low-eff, and the no-role branch that
 * only exists to Sell by eff — that branch falls through to Grind/Keep). `rune.eff` is still
 * filled by the parser; dashboard, charts, table, and sorting are unchanged.
 * Set to `true` locally to compare behavior with spreadsheets; keep `false` for normal use.
 */
const DEBUG_BYPASS_EFFICIENCY_GATES = false;

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
    guidePageLead:
      'Plain-language notes for everyday use. Subsections mirror the main tabs; the last one you opened stays selected for this browser session.',
    guideSubtabsAria: 'Guide sections',
    guideSubtabStart: 'Getting started',
    guideSubtabStartHint: 'SWEX, privacy, slots',
    guideSubtabDashboard: 'Dashboard',
    guideSubtabDashboardHint: 'Filters, charts, copy summary',
    guideSubtabProgression: 'Account depth',
    guideSubtabProgressionHint: 'Score math & stages',
    guideSubtabTable: 'Rune Table',
    guideSubtabTableHint: 'Search, filters, URL state',
    guideSubtabRules: 'Rune Rules',
    guideSubtabRulesHint: 'Engine, verdicts, roles',
    guideSubtabTips: 'Tips & FAQ',
    guideSubtabTipsHint: 'Theme, keyboard, changelog',
    loadJson: 'Load JSON',
    minLvl: 'Min Lvl',
    settings: 'Settings',
    
    // Upload prompt
    loadYourSWEX: 'Load your SWEX JSON',
    uploadDescription: 'Export your account data from <strong>Summoners War Exporter (SWEX)</strong> and load the JSON file here to analyze your rune collection.',
    chooseJsonFile: 'Choose JSON file',
    privacyNote: 'All processing happens in your browser — your data never leaves your device.',
    uploadPromptLead: 'Export with Summoners War Exporter (SWEX), then select your .json file. Analysis runs entirely in this browser.',
    uploadPromptDragHint: 'Or drag and drop your .json file anywhere on this screen.',
    uploadDropMultipleHint: 'Multiple files dropped — loading the first one only.',
    demoBannerBadge: 'DEMO',
    demoBannerText: 'Demo data — upload your SWEX JSON to see your stats.',
    demoBannerUpload: 'Upload JSON',
    demoBannerDismissAria: 'Dismiss example data notice',
    demoDatasetSlotLabel: 'Example SWEX export',
    dragDropVeilTitle: 'Drop SWEX JSON here',
    dragDropVeilHint: 'Release to load your file · replaces active Data 1',
    dragDropVeilAria: 'File drop zone for SWEX JSON',
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
    roleDistribution: 'Role distribution',
    setDistribution: 'Set distribution',
    slotDistribution: 'Slot distribution',
    efficiencyDistribution: 'Efficiency distribution',
    
    // Table
    searchPlaceholder: 'Search by set, stat, role...',
    allVerdicts: 'All Verdicts',
    allRoles: 'All Roles',
    allGrades: 'All Grades',
    runes: 'runes',
    runeTableCountCapped: '{shown} / {total} {runes} in table',
    tableResetFilters: 'Reset filters',
    tableShownDetailEmpty: 'No runes match the current filters.',
    tableShownDetailCapped: 'Showing {shown} of {total} matching runes — use Load all above for the full list.',
    tableShownDetailAll: 'Showing all {total} matching runes.',
    toggleTargetCol: 'Show Target',
    tableAncientOnly: 'Ancient only',
    tableEffHeaderCapped: 'Eff%',
    tableEffHeaderCappedTitle: 'Efficiency up to 100%, or the efficiency field from your export if the file has one.',
    tableSubGrindTooltip: 'Grindstones contributed +{n} on this sub.',
    tableSubGemTooltip: 'Enchanted substat (magic gem).',
    tableAncientBadge: 'Ancient',
    tableAncientBadgeTitle:
      'Detected from SWEX: rune.class > 10 and/or rank 11–15 (same +10 encoding as grade on extra).',
    csvHeaderAncient: 'Ancient',
    csvAncientYes: 'yes',
    tableTooltipGrind: 'Grind',
    tableTooltipGem: 'Gem',
    tableToolbarSearchLabel: 'Search runes',
    tableToolbarSectionActions: 'Actions',
    tableToolbarSectionDisplay: 'Display',
    runeTableMoreHintInline:
      '{shown} / {total} in table · load all for full list (large exports may lag)',
    runeTableMoreHint:
      'For speed, only the first {shown} rows are in the grid. Load all {total} matching runes when you need the full list (very large tables may feel slower).',
    runeTableShowAllButton: 'Load all {total} in table',
    targetHeading: 'Target',
    targetGemReplaceVerb: 'Replace',
    targetGemReplaceOr: ' or ',
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
    gemMetaRules: 'Gem — bad flat subs',
    gemMetaRulesDesc:
      'Enchant Gem rerolls substats only (prefix / innate cannot be gemmed). Verdict Gem uses the spreadsheet-style bad-flat sub pattern (clean low flats, no enchantment on subs) plus a plausible grindable % target. Turning this off disables Gem hints.',
    gemBadFlatGem: 'Enable Gem recommendations',
    gemBadFlatHint:
      'Two or more low flat subs early / one in late stage; enchanted subs make the rune “clean”; see engine bad-flat thresholds.',
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
    stageApplySuggestionAria:
      'Set your preset stage to the suggestion (Early, Mid, or Late) using the dropdown next to Apply.',
    stageMismatchHint: 'Your preset differs from the suggestion—you can still keep your choice.',
    stageMismatchExplainTpl:
      'Preset: {preset}. Suggestion: {suggested}. {hint}',
    stageCombinedScoreFootnote:
      'Uses your full Rare+ export; ignores dashboard filters and your preset picker above.',
    stageScoreBandsTpl: 'Recommendation on this score: Mid from {mid} pts, Late from {late}.',
    stageScoreInlineBandsTpl: 'Mid from {mid}, Late from {late}',
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

    stageEliteValFormat: '{eff}% ({n})',

    stageFormulaExpl: '',

    dashboardScopeTitle: 'Global filter',
    dashboardMinGradeLabel: 'Min grade',
    dashboardMinGradeRare: 'Rare+',
    dashboardMinGradeHero: 'Hero+',
    dashboardMinGradeLegend: 'Legend only',
    dashboardExportSummary: 'Copy summary',
    dashboardExportDone: 'Dashboard summary copied.',
    dashboardExportFail: 'Could not copy summary.',
    dashboardUnifiedBlockTitle: 'Distributions',
    dashboardDistVerdict: 'Verdict',
    dashboardDistRoles: 'Roles',
    dashboardDistSets: 'Sets',
    dashboardDistSlots: 'Slot',
    dashboardDistEff: 'Efficiency',
    dashboardVerdictMixTitle: 'Verdict distribution',
    dashboardVerdictAvgPrefix: 'avg',
    dashboardVerdictStackHint: 'Click a verdict row to open the Rune Table with that filter.',
    dashboardSlotMatrixTitle: 'Slot × main distribution',
    dashboardSlotMatrixCorner: 'Main',
    dashboardSlotMatrixCountRow: 'Count',
    dashboardSlotCardEmpty: 'No runes',
    dashboardSlotPaneHint:
      'Top: share of filtered runes in each slot. Below: main-stat mix for slots 2, 4, and 6.',
    dashboardSlotShareTitle: 'Runes by slot',
    dashboardSlotShareAria: 'Rune count share per slot',
    dashboardSlotMainsTitle: 'Main stats (2 / 4 / 6)',
    dashboardTopSpdTitle: 'Top SPD (subs) by slot',
    dashboardTopSpdSetLabel: 'Set',
    dashboardTopSpdHint:
      'Percentages are share of runes in that slot (row main × slot column). Pick a set from the list for top SPD substats per slot.',
    dashboardTopSpdPickHint: 'Select a set to show top SPD substats per slot.',
    dashboardTopSpdSlotLabel: 'Slot {n}',
    dashboardTopSpdNoRunes: '—',
    dashboardTopSpdNoneOption: '—',
    dashboardGradeRangeGroup: 'Grades',
    dashboardGradeRangeFrom: 'From',
    dashboardGradeRangeTo: 'To',
    dashboardGradeRangeInExport: 'Grades',
    dashboardGradeOptRare: 'Rare',
    dashboardGradeOptHero: 'Hero',
    dashboardGradeOptLegend: 'Legend',
    dashboardExportTotalCurrent: 'Total {acc} · Current {view}',
    dashboardUnifiedDistAria: 'Charts: verdicts, roles, sets, slot mains, or efficiency buckets',
    dashboardAccountRunesInline: 'Total: {acc} · Current: {view}',
    dashboardOpenAllRunes: 'Open table',
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
    guidePageLead:
      'Коротко для обычного пользователя: подразделы совпадают с основными вкладками; последний открытый запоминается до закрытия браузера.',
    guideSubtabsAria: 'Разделы гайда',
    guideSubtabStart: 'С чего начать',
    guideSubtabStartHint: 'SWEX, приватность, слоты',
    guideSubtabDashboard: 'Панель',
    guideSubtabDashboardHint: 'Фильтры, графики, сводка',
    guideSubtabProgression: 'Глубина аккаунта',
    guideSubtabProgressionHint: 'Формулы и стадии',
    guideSubtabTable: 'Таблица рун',
    guideSubtabTableHint: 'Поиск, фильтры, ссылка',
    guideSubtabRules: 'Правила рун',
    guideSubtabRulesHint: 'Движок, вердикты, роли',
    guideSubtabTips: 'Советы и FAQ',
    guideSubtabTipsHint: 'Тема, клавиши, журнал',
    loadJson: 'Загрузить JSON',
    minLvl: 'Мин Ур',
    settings: 'Настройки',
    
    // Upload prompt
    loadYourSWEX: 'Загрузите ваш SWEX JSON',
    uploadDescription: 'Экспортируйте данные аккаунта из <strong>Summoners War Exporter (SWEX)</strong> и загрузите JSON файл здесь для анализа вашей коллекции рун.',
    chooseJsonFile: 'Выбрать JSON файл',
    privacyNote: 'Все обработка происходит в вашем браузере — ваши данные никогда не покидают ваше устройство.',
    uploadPromptLead: 'Экспортируйте аккаунт через Summoners War Exporter (SWEX) и выберите .json файл. Всё считается только в браузере.',
    uploadPromptDragHint: 'Или перетащите .json файл в любое место этого экрана.',
    uploadDropMultipleHint: 'Несколько файлов — загружается только первый.',
    demoBannerBadge: 'ДЕМО',
    demoBannerText:
      'Демо-данные — загрузите свой SWEX JSON, чтобы увидеть свою статистику.',
    demoBannerUpload: 'Загрузить JSON',
    demoBannerDismissAria: 'Закрыть подсказку о примере данных',
    demoDatasetSlotLabel: 'Пример экспорта SWEX',
    dragDropVeilTitle: 'Отпустите SWEX JSON здесь',
    dragDropVeilHint: 'Отпускание — загрузка файла · заменит активный Data 1',
    dragDropVeilAria: 'Зона сброса файла SWEX JSON',
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
    roleDistribution: 'Role distribution',
    setDistribution: 'Set distribution',
    slotDistribution: 'Slot distribution',
    efficiencyDistribution: 'Efficiency distribution',
    
    // Table
    searchPlaceholder: 'Поиск по сету, стату, роли...',
    allVerdicts: 'Все Вердикты',
    allRoles: 'Все Роли',
    allGrades: 'Все Грейды',
    runes: 'рун',
    runeTableCountCapped: '{shown} / {total} {runes} в таблице',
    tableResetFilters: 'Сбросить фильтры',
    tableShownDetailEmpty: 'Нет рун по текущим фильтрам.',
    tableShownDetailCapped: 'Показано {shown} из {total} подходящих рун — полный список: «Загрузить все» выше.',
    tableShownDetailAll: 'Показаны все {total} подходящих рун.',
    toggleTargetCol: 'Колонка Target',
    tableAncientOnly: 'Только древние',
    tableEffHeaderCapped: 'Eff%',
    tableEffHeaderCappedTitle: 'Eff до 100% или значение efficiency из экспорта, если оно есть.',
    tableSubGrindTooltip: 'Гринд даёт +{n} к этой строке.',
    tableSubGemTooltip: 'Строка зачарована гемом (замена саба).',
    tableAncientBadge: 'Древняя',
    tableAncientBadgeTitle:
      'Из SWEX: rune.class > 10 и/или rank 11–15 (то же +10 к кодированию, что у грейда в extra).',
    csvHeaderAncient: 'Древ.',
    csvAncientYes: 'да',
    tableTooltipGrind: 'Grind',
    tableTooltipGem: 'Gem',
    tableToolbarSearchLabel: 'Поиск по рунам',
    tableToolbarSectionActions: 'Действия',
    tableToolbarSectionDisplay: 'Отображение',
    runeTableMoreHintInline:
      '{shown} / {total} в таблице · загрузите все для полного списка (тяжело на больших выборках)',
    runeTableMoreHint:
      'Для скорости в таблице только первые {shown} строк. Загрузите все {total} подходящих рун, когда нужен полный список (очень большие таблицы могут тормозить).',
    runeTableShowAllButton: 'Загрузить все {total} в таблице',
    targetHeading: 'Цель',
    targetGemReplaceVerb: 'Заменить',
    targetGemReplaceOr: ' или ',
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
    gemMetaRules: 'Gem — плоские субстаты',
    gemMetaRulesDesc:
      'Камень зачарования меняет только субстаты (prefix / innate в игре нельзя геммить). Вердикт Gem использует паттерн «плоские сабы» как в таблице (несколько чистых низких флетов без зачара сабов и цель в «гриндимый» %). Выключите, чтобы скрыть подсказки Gem.',
    gemBadFlatGem: 'Включить рекомендации Gem',
    gemBadFlatHint:
      'Два или более низких флета раньше / один позже; любой зачарованный саб делает руну «чистой»; пороги — в коде проверки bad flat.',
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
    stageApplySuggestionAria:
      'Подставить в пресет стадию из совета (ранняя, средняя или поздняя) через список рядом с кнопкой.',
    stageMismatchHint: 'Ваш выбор отличается от совета — так можно оставить.',
    stageMismatchExplainTpl:
      'Пресет: {preset}. Совет: {suggested}. {hint}',
    stageCombinedScoreFootnote:
      'Считается по полному экспорту Rare+ и не учитывает общие фильтры дашборда и выбор пресета выше.',
    stageScoreBandsTpl: 'Порог по этому баллу: средняя стадия от {mid}+, поздняя от {late}+.',
    stageScoreInlineBandsTpl: 'Средняя от {mid}+, поздняя от {late}+',
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

    stageEliteValFormat: '{eff}% ({n})',

    stageFormulaExpl: '',

    dashboardScopeTitle: 'Общий фильтр',
    dashboardMinGradeLabel: 'Мин. грейд',
    dashboardMinGradeRare: 'Rare+',
    dashboardMinGradeHero: 'Hero+',
    dashboardMinGradeLegend: 'Только Legend',
    dashboardExportSummary: 'Копировать сводку',
    dashboardExportDone: 'Сводка скопирована.',
    dashboardExportFail: 'Не удалось скопировать.',
    dashboardUnifiedBlockTitle: 'Распределения',
    dashboardDistVerdict: 'Вердикты',
    dashboardDistRoles: 'Роли',
    dashboardDistSets: 'Сеты',
    dashboardDistSlots: 'Слот',
    dashboardDistEff: 'Эффективность',
    dashboardVerdictMixTitle: 'Распределение вердиктов',
    dashboardVerdictAvgPrefix: 'ср.',
    dashboardVerdictStackHint: 'Клик по строке вердикта откроет таблицу с этим фильтром.',
    dashboardSlotMatrixTitle: 'Слот × основной стат',
    dashboardSlotMatrixCorner: 'Осн.',
    dashboardSlotMatrixCountRow: 'Всего',
    dashboardSlotCardEmpty: 'Нет рун',
    dashboardSlotPaneHint:
      'Сверху — доля отфильтрованных рун по каждому слоту. Ниже — основные статы для слотов 2, 4 и 6.',
    dashboardSlotShareTitle: 'Руны по слотам',
    dashboardSlotShareAria: 'Доля рун по слотам',
    dashboardSlotMainsTitle: 'Основные статы (2 / 4 / 6)',
    dashboardTopSpdTitle: 'Топ SPD (сабы) по слотам',
    dashboardTopSpdSetLabel: 'Сет',
    dashboardTopSpdHint:
      'Проценты — доля среди рун в этом слоте (основной стат × колонка слота). Выберите сет в списке для топа SPD в сабах по слотам.',
    dashboardTopSpdPickHint: 'Выберите сет, чтобы показать топ SPD по слотам.',
    dashboardTopSpdSlotLabel: 'Слот {n}',
    dashboardTopSpdNoRunes: '—',
    dashboardTopSpdNoneOption: '—',
    dashboardGradeRangeGroup: 'Грейды',
    dashboardGradeRangeFrom: 'От',
    dashboardGradeRangeTo: 'До',
    dashboardGradeRangeInExport: 'Грейды',
    dashboardGradeOptRare: 'Rare',
    dashboardGradeOptHero: 'Hero',
    dashboardGradeOptLegend: 'Legend',
    dashboardExportTotalCurrent: 'Всего {acc} · Текущий вид {view}',
    dashboardUnifiedDistAria: 'Графики: вердикты, роли, сеты, основные по слотам или эффективность',
    dashboardAccountRunesInline: 'Всего: {acc} · Текущий вид: {view}',
    dashboardOpenAllRunes: 'Таблица',
    dashboardChartLblAvg: 'ср.',
    dashboardGroupKeepers: 'Запас и качество',
    dashboardGroupQueue: 'Требуют внимания',
    dashboardOpenTableHint: 'Открыть таблицу',
    stageCompactExpand: 'Показать детали прогресса',
    stageCompactCollapse: 'Компактный вид прогресса',
    stageMetricContribTpl: '+{pts} / {cap} балл.',
    effMedianCaption: 'Медиана eff (с фильтром): {pct}%',
    dashboardExportEffBuckets: 'Гистограмма (корзины по 5%):',
  },
};

/** UI strings for français — merges over English; deep rules/engine copy stays EN until localized. Stats in filters use PV/VIT via {@link statNamesUiForLang}. */
const TRANSLATIONS_FR_PARTIAL = {
  donateShort: 'Soutenir',
  donateTitle: 'Soutenir le projet — ouvre la page de paiement Lava.top',
  donateAria: 'Soutenir le projet (page externe)',
  footerDisclaimer:
    'Summoners War™ est une marque de Com2uS Corp. Ce site n’est pas affilié ni approuvé par Com2uS Corp.',
  dashboard: 'Accueil',
  runeTable: 'Liste des runes',
  runeRules: 'Règles des runes',
  guide: 'Guide',
  changelog: 'Notes',
  changelogPageLead:
    'Fournies avec cette version (pas stockées localement). Basculez entre les nouveautés et la feuille de route.',
  changelogSubtabShipped: 'Versions',
  changelogSubtabRoadmap: 'Feuille de route',
  changelogShippedLead: 'Résumés haut niveau uniquement.',
  changelogRoadmapLead: 'Pistes suivantes — pas forcément encore dans cette build.',
  changelogRoadmapEmpty: 'Aucune entrée de feuille de route pour cette build.',
  changelogSubtabsAria: 'Sections changelog',
  changelogEmpty: 'Aucune entrée changelog pour cette build.',
  guidePageLead:
    'Texte simple au quotidien. Les sous-sections suivent les onglets ; la dernière ouverte reste en session.',
  guideSubtabsAria: 'Sections du guide',
  loadJson: 'Charger JSON',
  minLvl: 'Niv. mini',
  settings: 'Paramètres',

  loadYourSWEX: 'Charger votre fichier SWEX (JSON)',
  uploadDescription:
    'Exportez votre <strong>Summoners War Exporter (SWEX)</strong> et chargez le JSON ici pour analyser vos runes.',
  chooseJsonFile: 'Choisir un fichier JSON',
  privacyNote: 'Tout est traité dans votre navigateur — vos données ne quittent pas l’appareil.',
  uploadPromptLead: 'Export SWEX, puis sélection du .json. Analyse 100 % locale.',
  uploadPromptDragHint: 'Ou glissez-déposez votre .json sur la page ou l’écran d’import.',
  uploadDropMultipleHint: 'Plusieurs fichiers — seul le premier est chargé.',
  demoBannerBadge: 'DÉMO',
  demoBannerText:
    'Données de démo — importez votre SWEX JSON pour voir vos stats.',
  demoBannerUpload: 'Importer JSON',
  demoBannerDismissAria: 'Masquer la bannière de démo (cette session)',
  demoDatasetSlotLabel: 'Exemple d’export SWEX',
  dragDropVeilTitle: 'Relâchez le SWEX (.json)',
  dragDropVeilHint: 'Chargement en relâchant — remplace le profil Data 1 actif',
  dragDropVeilAria: 'Zone de dépôt fichier SWEX',
  uploadPromptSecondary: 'Devient le profil actif (Data 1). D’autres comptes : Paramètres app → Slots base.',
  uploadClearAll: 'Effacer les données locales',

  totalRunes: 'Total runes',
  keep: 'Garder',
  sell: 'Vendre',
  grind: 'Moudre',
  finish: 'Terminer',
  reapp: 'Réapp',
  upgrade: '+niveaux',
  gem: 'Gemme',

  roleDistribution: 'Rôles',
  setDistribution: 'Sets',
  slotDistribution: 'Emplacements',
  efficiencyDistribution: 'Efficience',

  searchPlaceholder: 'Recherche par set, stat, rôle…',
  tableSubGrindTooltip: 'Meule : +{n} sur cette ligne.',
  tableSubGemTooltip: 'Sous-stat enchantée (gemme magique).',
  tableAncientBadge: 'Ancient',
  tableAncientBadgeTitle:
    'Détecté via SWEX : rune.class > 10 et/ou rank 11–15 (même encodage +10 que la qualité dans extra).',
  csvHeaderAncient: 'Ancient',
  csvAncientYes: 'oui',
  tableAncientOnly: 'Uniquement Ancient',
  allVerdicts: 'Tous les verdicts',
  allRoles: 'Tous les rôles',
  allGrades: 'Tous les grades',
  runesWord: 'runes',
  runesHeroPlus: 'runes',
  monsShort: 'monstres',

  appSettings: 'Paramètres de l’app',
  language: 'Langue',
  theme: 'Thème',
  themeGroupAria: 'Thème affichage',
  themeLightTitle: 'Thème clair',
  themeDarkTitle: 'Thème sombre',
  dbSlotsTitle: 'Slots de bases',
  dbSlotsDesc: 'Jusqu’à 4 exports SWEX : résumé magicien, niveau, runes, monstres si présents.',

  early: 'Début',
  mid: 'Milieu',
  late: 'Fin',

  stageAdvisorTitle: 'Progression de compte',
  stageSuggestedLabel: 'Segment suggéré',
  stageYourPresetLabel: 'Votre pré-réglage',
  stageScoreLabel: 'Score combiné',
  stageApplySuggestion: 'Appliquer suggestion',
  stageAdvisorNoEligible: 'Chargez un export SWEX pour la profondeur de compte.',
  stageMismatchHint:
    'Votre pré-réglage diffère du segment suggéré — vous pouvez garder votre choix.',
  stageCombinedScoreFootnote:
    'Utilise uniquement Rare+ du fichier ; ignore les filtres du tableau de bord et le pré-réglage ci-dessus.',
  stageCardHrName: 'Puissance VIT',
  stageCardHrDesc:
    'Runes où la somme VIT en sous-stat (roll + mouture) ≥ 18. Jusqu’à 35 pts à 250 runes.',
  dashboardTopSpdTitle: 'Top VIT (sous-stats) par emplacement',
  dashboardTopSpdHint:
    'Pourcentages = part des runes de l’emplacement (stat principale × colonne). Choisissez un set pour le top VIT par emplacement.',
  dashboardTopSpdPickHint: 'Choisissez un set pour le top VIT par emplacement.',
  dashboardSlotPaneHint:
    'Haut : part filtrée par emplacement / Bas : stats principales des emplacements 2, 4 et 6.',
  clipboardNotJson: 'Le presse-papiers ne contient pas du JSON valide.',

  dbSlot: 'Slot base',
  activeProfile: 'Actif',
  current: 'Actuel',
  name: 'Nom',
  uploaded: 'Importé',
  clipboard: 'Presse‑pap.',
  upload: 'Importer',
  download: 'Téléch.',
  delete: 'Suppr.',
  swap: 'Changer',

  thresholds: 'Seuils',
  roleFilters: 'Filtres de rôle',
  reappRules: 'Réapp — règles',
  saveRecalculate: 'Enregistrer & recalculer',
};

TRANSLATIONS.fr = { ...TRANSLATIONS.en, ...TRANSLATIONS_FR_PARTIAL };

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
  HP_for_CDmg:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  CDmg_for_HP:   { Early_Leg:12, Early_Hero:9,  Mid_Leg:15, Mid_Hero:12, Late_Leg:17, Late_Hero:14 },
  HP_for_ACC:    { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  ACC_for_HP:    { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
  DEF_for_ACC:   { Early_Leg:14, Early_Hero:11, Mid_Leg:16, Mid_Hero:14, Late_Leg:20, Late_Hero:14 },
  ACC_for_DEF:   { Early_Leg:18, Early_Hero:14, Mid_Leg:22, Mid_Hero:18, Late_Leg:27, Late_Hero:23 },
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
 * Mid_Hero = Base; Mid_Leg = Base×(1−Grade_Mod);
 * Early_Hero = Base×(1−Early_Discount); Late_Hero = Base×(1+Late_Tougher);
 * Early/Legend and Late/Legend = Hero cell × (1−Grade_Mod).
 */
function stageHrValue(statRow, colKey) {
  const base = Number(statRow.base);
  if (!Number.isFinite(base) || base <= 0) return 0;
  const earlyDiscount = Number.isFinite(Number(statRow.earlyScale)) ? Number(statRow.earlyScale) : 0;
  const lateTougher = Number.isFinite(Number(statRow.lateScale)) ? Number(statRow.lateScale) : 0;
  const gradeMod = Number.isFinite(Number(statRow.gradeMod)) ? Number(statRow.gradeMod) : 0;
  const leg = colKey.indexOf('_Leg') !== -1;
  const heroFactor = leg ? (1 - gradeMod) : 1;
  if (colKey.startsWith('Early')) return base * (1 - earlyDiscount) * heroFactor;
  if (colKey.startsWith('Mid')) return (leg ? base * (1 - gradeMod) : base);
  if (colKey.startsWith('Late')) return base * (1 + lateTougher) * heroFactor;
  return base;
}

/**
 * Defaults aligned with master Constants sheet (base + God/Duo mods + stage/grade scales).
 * HR/Duo threshold grids are derived — do not duplicate numbers here and in DEFAULT_THRESHOLDS manually.
 */
const EXPLICIT_DEFAULT_STAT_CONSTANTS = {
  SPD:    { base: 16, godMod: 0.25, duoMod: 0.15, earlyScale: 0.20, lateScale: 0.30, gradeMod: 0.05 },
  'HP%':  { base: 20, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  'DEF%': { base: 20, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  'ATK%': { base: 17, godMod: 0.30, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  CRate:  { base: 13, godMod: 0.25, duoMod: 0.25, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.05 },
  CDmg:   { base: 16, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.20, gradeMod: 0.08 },
  ACC:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.10 },
  RES:    { base: 18, godMod: 0.30, duoMod: 0.30, earlyScale: 0.20, lateScale: 0.15, gradeMod: 0.10 },
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
    const earlyScale = base > 0 && Number.isFinite(eh) ? (1 - (eh / base)) : 0;
    const lateScale = base > 0 && Number.isFinite(lh) ? ((lh / base) - 1) : 0;
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
    'HP_for_CDmg', 'CDmg_for_HP', 'HP_for_ACC', 'ACC_for_HP', 'DEF_for_ACC', 'ACC_for_DEF',
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
    d.HP_for_CDmg[col] = duoLineForStat('HP%', col, hrTable, statConstants);
    d.CDmg_for_HP[col] = duoLineForStat('CDmg', col, hrTable, statConstants);
    d.HP_for_ACC[col] = duoLineForStat('HP%', col, hrTable, statConstants);
    d.ACC_for_HP[col] = duoLineForStat('ACC', col, hrTable, statConstants);
    d.DEF_for_ACC[col] = duoLineForStat('DEF%', col, hrTable, statConstants);
    d.ACC_for_DEF[col] = duoLineForStat('ACC', col, hrTable, statConstants);
  }
  return d;
}

/**
 * God threshold by grade:
 * Hero/Rare: base × (1 + godMod)
 * Legend:    base × (1 - gradeMod) × (1 + godMod)
 */
function getGodThreshold(stat, settings, gradeStr) {
  const row = settings?.statConstants?.[stat];
  if (!row || row.base == null) return null;
  const base = Number(row.base);
  if (!Number.isFinite(base) || base <= 0) return null;
  const mod = Number.isFinite(Number(row.godMod)) ? Number(row.godMod) : 0;
  const gradeMod = Number.isFinite(Number(row.gradeMod)) ? Number(row.gradeMod) : 0;
  const isLegend = gradeStr === 'Legend';
  const baseByGrade = isLegend ? base * (1 - gradeMod) : base;
  return baseByGrade * (1 + mod);
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
    acceptedMains: { 2: 'SPD, ATK%', 4: 'ATK%, CDmg, CRate', 6: 'ATK%' },
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
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'CRate', Mid: 'CRate', Late: 'CRate' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 3 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } },
  },
  'Slow DPS': {
    enabled: true,
    acceptedMains: { 2: 'ATK%', 4: 'ATK%, CDmg, CRate', 6: 'ATK%' },
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
    slotRequirements: { 2: { Early: 'None', Mid: 'None', Late: 'None' }, 4: { Early: 'None', Mid: 'None', Late: 'None' }, 6: { Early: 'None', Mid: 'None', Late: 'None' } },
    minStats: { '1/3/5': { Early: 1, Mid: 2, Late: 2 }, 'Slot 2': { Early: 1, Mid: 1, Late: 2 }, 'Slot 4': { Early: 1, Mid: 1, Late: 2 }, 'Slot 6': { Early: 1, Mid: 1, Late: 2 } },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
  'Bomber': {
    enabled: true,
    acceptedMains: { 2: 'SPD, ATK%', 4: 'ATK%', 6: 'ATK%, ACC' },
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
    minStats: {
      '1/3/5': { Early: 1, Mid: 2, Late: 2 },
      'Slot 2': { Early: 1, Mid: 1, Late: 1 },
      'Slot 4': { Early: 1, Mid: 1, Late: 1 },
      'Slot 6': { Early: 1, Mid: 1, Late: 1 },
    },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: false, Late: true } }
  },
'Fast CC': {
    enabled: true,
    acceptedMains: { 2: 'SPD, HP%, DEF%', 4: 'HP%, DEF%', 6: 'ACC, HP%, DEF%' },
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
    slotRequirements: {
      2: { Early: 'ACC', Mid: 'ACC', Late: 'ACC' },
      4: { Early: 'ACC', Mid: 'ACC', Late: 'ACC' },
      6: { Early: 'ACC', Mid: 'ACC', Late: 'ACC' },
    },
    minStats: {
      '135': { Early: 2, Mid: 2, Late: 2 },
      '2': { Early: 1, Mid: 1, Late: 2 },
      '4': { Early: 1, Mid: 1, Late: 2 },
      '6': { Early: 1, Mid: 1, Late: 2 },
    },
    requireHR: {
      'High Roll for Hero': { Early: false, Mid: true, Late: true },
      'High Roll for Legend': { Early: false, Mid: false, Late: true },
    },
  },
  'Tank': {
    enabled: true,
    acceptedMains: { 2: 'SPD, HP%, DEF%', 4: 'HP%, DEF%', 6: 'HP%, DEF%, RES' },
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
    acceptedMains: { 2: 'SPD, HP%, ATK%, DEF%', 4: 'HP%, ATK%, DEF%, CRate, CDmg', 6: 'ATK%, HP%, DEF%' },
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
    minStats: {
      '135': { Early: 2, Mid: 2, Late: 3 },
      '2': { Early: 2, Mid: 2, Late: 3 },
      '4': { Early: 2, Mid: 2, Late: 3 },
      '6': { Early: 2, Mid: 2, Late: 3 },
    },
    requireHR: { 'High Roll for Hero': { Early: false, Mid: true, Late: true }, 'High Roll for Legend': { Early: false, Mid: true, Late: true } },
  },
};

/** UI row labels → minStats key preference (sheet-style numeric/alternate keys vs legacy slot labels). */
const FORMULA_MINSTAT_KEY_GROUPS = {
  '1/3/5': ['135', '1/3/5'],
  'Slot 2': ['2', 'Slot 2'],
  'Slot 4': ['4', 'Slot 4'],
  'Slot 6': ['6', 'Slot 6'],
};

function readFormulaMinStat(ms, uiSlotType, stage) {
  const keys = FORMULA_MINSTAT_KEY_GROUPS[uiSlotType] || [uiSlotType];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const raw = ms?.[k]?.[stage];
    if (raw != null && raw !== '') return Number(raw);
  }
  return 1;
}

function formulaMinStatWriteKey(ms, uiSlotType) {
  const keys = FORMULA_MINSTAT_KEY_GROUPS[uiSlotType] || [uiSlotType];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (ms && typeof ms[k] === 'object' && ms[k] !== null) return k;
  }
  return keys[keys.length - 1];
}

function readFormulaMinStatForRuneSlot(ms, runeSlot, stage) {
  const uiSlotType = [1, 3, 5].includes(runeSlot) ? '1/3/5' : `Slot ${runeSlot}`;
  return readFormulaMinStat(ms, uiSlotType, stage);
}

const DEFAULT_ROLE_PRIORITY = ['Fast CC', 'Classic DPS', 'Bomber', 'Tank', 'Bruiser', 'Slow DPS', 'Duo Roll', 'High Roll'];

// ---- LEGACY ROLE DEFINITIONS (for backward compatibility) ----
// Include/Exclude/None; mustHave per stage; acceptedMains per slot; minStats per slot
const DEFAULT_ROLES = {
  'Classic DPS': {
    substats: { SPD:'Include', 'ATK%':'Include', CRate:'Include', CDmg:'Include',
                'HP%':'None', 'DEF%':'None', ACC:'None', RES:'None' },
    mustHave: { Early: 'SPD', Mid: 'SPD', Late: 'SPD' },
    acceptedMains: { 2: ['SPD', 'ATK%'], 4: ['CRate', 'CDmg'], 6: ['ATK%'] },
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
  sets: ['Swift', 'Violent', 'Rage', 'Will'],
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

// ---- GEM — Enchant Gem is sub-only (bad-flat pattern → grindable % target).
const DEFAULT_GEM_META = {
  /** Substat bad-flat Gem path — only Gem engine this build supports */
  legacyFlatSubGem: true,
  /** Min exporter/calc Eff (Hero branch uses heroMin when not Duo/God Roll) — tune to match spreadsheets */
  qualityGate: {
    early: { min: 40, heroMin: 52 },
    mid: { min: 55, heroMin: 67 },
    late: { min: 70, heroMin: 82 },
  },
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
  4: { 'HP%':63, 'ATK%':63, 'DEF%':63, CRate:58, CDmg:80 },
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

  if (typeof savedGem.legacyFlatSubGem === 'boolean') {
    d.legacyFlatSubGem = savedGem.legacyFlatSubGem;
  }
  const qSaved = savedGem.qualityGate;
  if (!qSaved || typeof qSaved !== 'object') {
    d.qualityGate = JSON.parse(JSON.stringify(DEFAULT_GEM_META.qualityGate));
  } else {
    d.qualityGate = {
      early: Object.assign({}, DEFAULT_GEM_META.qualityGate.early, qSaved.early || {}),
      mid: Object.assign({}, DEFAULT_GEM_META.qualityGate.mid, qSaved.mid || {}),
      late: Object.assign({}, DEFAULT_GEM_META.qualityGate.late, qSaved.late || {}),
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
    gemMeta.qualityGate = JSON.parse(JSON.stringify(DEFAULT_GEM_META.qualityGate));
    reapp.sets = DEFAULT_REAPP.sets.slice();
  }
  // One-time: innate-Gem UI removed — enable the substats-only path for browsers that saved legacyFlatSubGem: false next to innate defaults.
  if (presetVersion < 10) {
    gemMeta.legacyFlatSubGem = true;
  }
  // Spreadsheet-aligned six archetypes (reapply once when defaults change).
  if (presetVersion < 7) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      if (DEFAULT_FORMULAS[name]) {
        formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
      }
    });
  }
  // v11: Classic DPS only — slot 2 add ATK% accepted main; slot 4 slotRequirements → None (spreadsheet).
  if (presetVersion < 11) {
    if (DEFAULT_FORMULAS['Classic DPS']) {
      formulas['Classic DPS'] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS['Classic DPS']));
    }
  }
  // v12: Bruiser — min stats for slots 1/3/5: Early & Mid 2 (was 3); Late unchanged (spreadsheet).
  if (presetVersion < 12) {
    if (DEFAULT_FORMULAS.Bruiser) {
      formulas.Bruiser = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bruiser));
    }
  }
  // v13: accepted mains moved to comma-list per slot + latest sheet-aligned mains defaults.
  if (presetVersion < 13) {
    ['Classic DPS', 'Slow DPS', 'Bomber', 'Fast CC', 'Tank', 'Bruiser'].forEach((name) => {
      if (DEFAULT_FORMULAS[name]) {
        formulas[name] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS[name]));
      }
    });
    // Align constants model to the new Sheets baseline (early discount / late tougher + updated mods).
    statConstants = mergeStatConstants(null);
  }
  // v14: narrower Reapp sets; tightened Fast CC + Bomber presets (spreadsheet).
  if (presetVersion < 14) {
    reapp.sets = DEFAULT_REAPP.sets.slice();
    if (DEFAULT_FORMULAS['Fast CC']) {
      formulas['Fast CC'] = JSON.parse(JSON.stringify(DEFAULT_FORMULAS['Fast CC']));
    }
    if (DEFAULT_FORMULAS.Bomber) {
      formulas.Bomber = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bomber));
    }
  }
  // v15: Bruiser preset synced to Sheets (accepted mains, minStats keys 135/2/4/6).
  if (presetVersion < 15) {
    if (DEFAULT_FORMULAS.Bruiser) {
      formulas.Bruiser = JSON.parse(JSON.stringify(DEFAULT_FORMULAS.Bruiser));
    }
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
    presetVersion: 15,
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
 * Release notes bundled with the app (Changelog tab → Releases). Roadmap: STATIC_ROADMAP.
 * Each `items[locale]` is a string[] (legacy `{ shipped: [] }` is still read).
 * Entries are newest-first by date. Plain text — the UI escapes HTML (no markdown).
 * Style: each locale uses the same count/order of bullets — thematic only (no shipped build/version strings); section title is always `date` above.
 */
const STATIC_CHANGELOG = [
  {
    date: '2026-05-16',
    items: {
      en: [
        'Light theme: tinted gradients on preset + Apply suggestion; Speed / Power / Elite cards pick up stage accent on borders and fills.',
        'English returns to sentence casing like localized builds; App Settings uses the column width, equal-width action grid, shorter FR labels, language switch redraw, scrollbar gutter to stop width flicker.',
      ],
      ru: [
        'Светлая тема: градиенты на пресете и «Применить совет», карточки метрик подсвечены цветом этапов.',
        'Английский в обычной кассе, как у переводов; настройки БД — на всю колонку, ровная сетка кнопок, короткие FR подписи, перерисовка при смене языка, резерв под скроллбар.',
      ],
      fr: [
        'Thème clair : gradients sur préréglage segment + suggestion ; cartes VIT / Puissance / élites en phase avec les teintes d’étape.',
        'Anglais en casse phrase comme FR/RU ; Paramètres : largeur mieux utilisée, grille de boutons équilibrée, libellés FR courts, rafraîchissement au changement de langue, gouttière scrollbar anti‑à‑coups.',
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
  fr: [
    'Indicateur optionnel « potentiel God » (info seulement, pas un verdict Moudre).',
    'Règles Moudre plus strictes (ex. efficience minimum ou nombre de lignes « HR »).',
    'Alignement tableur si les comptes dérivent après changement des constantes.',
  ],
};

window.SWRM = window.SWRM || {};
window.SWRM.APP_VERSION = APP_VERSION;
window.SWRM.DEBUG_BYPASS_EFFICIENCY_GATES = DEBUG_BYPASS_EFFICIENCY_GATES;
window.SWRM.settings = getSettings();
window.SWRM.applyDerivedThresholdFields = applyDerivedThresholdFields;
window.SWRM.STAT_NAMES = STAT_NAMES;
window.SWRM.STAT_NAMES_UI_BY_LANG = STAT_NAMES_UI_BY_LANG;
window.SWRM.statNamesUiForLang = statNamesUiForLang;
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
window.SWRM.readFormulaMinStat = readFormulaMinStat;
window.SWRM.formulaMinStatWriteKey = formulaMinStatWriteKey;
window.SWRM.readFormulaMinStatForRuneSlot = readFormulaMinStatForRuneSlot;
window.SWRM.saveSettings = saveSettings;
window.SWRM.TRANSLATIONS = TRANSLATIONS;
window.SWRM.STATIC_CHANGELOG = STATIC_CHANGELOG;
window.SWRM.STATIC_ROADMAP = STATIC_ROADMAP;
