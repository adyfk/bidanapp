import { APP_BRANDING, APP_COLORS } from '@/lib/app-config';
import { PUBLIC_ENV } from '@/lib/env';

export const APP_CONFIG = {
  appName: APP_BRANDING.appName,
  appVersion: PUBLIC_ENV.appVersion,
  seoDescription: APP_BRANDING.seoDescription,
  baseUrl: PUBLIC_ENV.siteUrl,
  apiBaseUrl: PUBLIC_ENV.apiBaseUrl,
  ogImage: APP_BRANDING.ogImage,
  colors: APP_COLORS,
};
