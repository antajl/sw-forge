// src/data/core/meta.ts - Application metadata
export const APP_VERSION = '1.2.19';
export const APP_NAME = 'SW Forge';
export const APP_DESCRIPTION = 'Summoners War Rune Analyzer & Calculator';

export interface AppMeta {
  version: string;
  name: string;
  description: string;
}

export const appMeta: AppMeta = {
  version: APP_VERSION,
  name: APP_NAME,
  description: APP_DESCRIPTION
};