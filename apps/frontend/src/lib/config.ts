import settingsData from '@/data/simulation/settings.json';
import { PUBLIC_ENV } from '@/lib/env';
import type { AppSettingsFile } from '@/types/settings';

const settings = settingsData as AppSettingsFile;

export const APP_CONFIG = {
  appName: settings.branding.appName,
  appVersion: PUBLIC_ENV.appVersion,
  seoDescription: settings.branding.seoDescription,
  baseUrl: PUBLIC_ENV.siteUrl,
  apiBaseUrl: PUBLIC_ENV.apiBaseUrl,
  ogImage: settings.branding.ogImage,
  terms: settings.terms,
  colors: settings.colors,
};
