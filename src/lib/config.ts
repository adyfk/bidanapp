import settingsData from '@/data/simulation/settings.json';
import type { AppSettingsFile } from '@/types/settings';

const settings = settingsData as AppSettingsFile;

export const APP_CONFIG = {
  appName: settings.branding.appName,
  seoDescription: settings.branding.seoDescription,
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || settings.branding.baseUrl,
  ogImage: settings.branding.ogImage,
  terms: settings.terms,
  colors: settings.colors,
};
