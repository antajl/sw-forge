// src/types/global.d.ts — Global window declarations
interface Translation {
  title?: string;
  dashboardTab?: string;
  dashboard?: string;
  monsters?: string;
  guide?: string;
  changelog?: string;
  appSettings?: string;
  loadJson?: string;
  settings?: string;
  minLvl?: string;
  early?: string;
  mid?: string;
  late?: string;
  donateDialogTitle?: string;
  donateTitle?: string;
  donateDialogLead?: string;
  donateSectionBoostyTitle?: string;
  donateSectionBoostyDesc?: string;
  donateBtnBoosty?: string;
  donateSectionLavaTitle?: string;
  donateSectionLavaDesc?: string;
  donateBtnLava?: string;
  donateSectionCryptoTitle?: string;
  donateSectionCryptoDesc?: string;
  donateCopyAddress?: string;
  donateCryptoPrefix?: string;
  donateCryptoEmpty?: string;
  donateCryptoNetworkHint?: string;
  donateAria?: string;
  donateShort?: string;
  donateCopied?: string;
  themeGroupAria?: string;
  theme?: string;
  themeDarkTitle?: string;
  themeLightTitle?: string;
  stageAdvisorTitle?: string;
  stageAdvisorLead?: string;
  stageSuggestedLabel?: string;
  stageYourPresetLabel?: string;
  stageMetricsExplainer?: string;
  stageFormulaExpl?: string;
  stageCardHrName?: string;
  stageCardHrDesc?: string;
  stageCardKeepName?: string;
  stageCardKeepDesc?: string;
  stageCardMetaName?: string;
  stageCardMetaDesc?: string;
  stageCardHrWeight?: string;
  stageCardKeepWeight?: string;
  stageCardMetaWeight?: string;
  stageApplySuggestion?: string;
  stageApplySuggestionAria?: string;
  dashboardStrictnessLabel?: string;
  language?: string;
  activeProfile?: string;
  current?: string;
  dbSlot?: string;
  name?: string;
  uploaded?: string;
  clipboard?: string;
  upload?: string;
  download?: string;
  delete?: string;
  swap?: string;
  shareButtonLabel?: string;
  shareLinkCopied?: string;
  shareLinkCopiedLong?: string;
  shareFailed?: string;
  shareNoContent?: string;
  sharePayloadTooLarge?: string;
  changelogEmpty?: string;
  changelogSubtabRoadmap?: string;
  changelogRoadmapEmpty?: string;
  teamsNoSets?: string;
  teamsPickSet?: string;
  teamsNoTeams?: string;
  teamsCreateTeam?: string;
  teamsUntitled?: string;
  teamsSharePublic?: string;
  teamsEdit?: string;
  teamsDuplicate?: string;
  teamsShare?: string;
  teamsDelete?: string;
  teamsDeleteSet?: string;
  teamsNamePlaceholder?: string;
  teamsSlotLabel?: string;
  teamsSetLeader?: string;
  teamsSetNamePlaceholder?: string;
  [key: string]: string | undefined;
}

interface SWRMGlobal {
  DONATE_BOOSTY_URL?: string;
  DONATE_LAVA_URL?: string;
  DONATE_CRYPTO_USDT_TRC20?: string;
  TRANSLATIONS?: Record<string, Translation>;
  STATIC_CHANGELOG?: Array<{ date: string; items: Record<string, string[]> }>;
  STATIC_ROADMAP?: Record<string, {
  intro?: string;
  sections: Array<{
    id?: string;
    kicker?: string;
    phase?: string;
    lead?: string;
    title: string;
    items: (string | { text: string })[];
  }>;
  outOfScope?: {
    title: string;
    items: string[];
  };
}>;
  GOD_STAT_ORDER?: string[];
  DEFAULT_STAT_CONSTANTS?: Record<string, any>;
  settings?: {
    statConstants?: Record<string, any>;
  };
  mergeStatConstants?: (raw: any) => any;
  getGodThreshold?: (stat: string, opts: any, grade: string) => number;
  computeHrThresholds?: (sc: any) => any;
  computeDuoThresholds?: (sc: any, hr: any) => any;
  version?: string;
  [key: string]: any;
}

interface Window {
  SWRM?: SWRMGlobal;
  TRANSLATIONS?: Record<string, Translation>;
  allUnits?: Array<{ unitId: number; masterId: number; }>;
  monstersEnrichedCache?: Array<{ unitId: number; masterId: number; displayName: string; }>;
  __swrmFiltersPopoverDocBound?: boolean;
}
