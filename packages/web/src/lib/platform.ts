import {
  getPlatformRegistrationSchema,
  getPlatformSeo,
  normalizePlatformLocale,
  type PlatformLocale,
  type ServicePlatformConfig,
  type ServicePlatformId,
} from '@marketplace/platform-config';
import type { Metadata } from 'next';
import { getSiteUrl } from './env';

export function resolvePlatformLocale(platform: ServicePlatformConfig, locale?: string | null): PlatformLocale {
  const normalizedLocale = normalizePlatformLocale(locale);
  return platform.supportedLocales.includes(normalizedLocale) ? normalizedLocale : platform.defaultLocale;
}

export function createLocalizedPath(locale: string, pathname = '') {
  const normalizedLocale = normalizePlatformLocale(locale);
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalizedPathname === '/') {
    return `/${normalizedLocale}`;
  }
  return `/${normalizedLocale}${normalizedPathname}`;
}

export function createPlatformAppUrl(pathname: string, fallbackOrigin: string) {
  const siteUrl = getSiteUrl(fallbackOrigin);
  return new URL(pathname, siteUrl).toString();
}

function appendNextSearch(pathname: string, nextPath?: string) {
  if (!nextPath) {
    return pathname;
  }

  const search = new URLSearchParams({ next: nextPath });
  return `${pathname}?${search.toString()}`;
}

export function createPlatformMetadata(
  platform: ServicePlatformConfig,
  locale: string = platform.defaultLocale,
  pathname = '/',
): Metadata {
  const resolvedLocale = resolvePlatformLocale(platform, locale);
  const seo = getPlatformSeo(platform, resolvedLocale);
  const metadataBase = getSiteUrl(`https://${platform.domains[0]}`);
  const canonicalPath = createLocalizedPath(resolvedLocale, pathname);
  return {
    metadataBase: new URL(metadataBase),
    title: {
      default: seo.title,
      template: `%s | ${seo.title}`,
    },
    description: seo.description,
    alternates: {
      canonical: canonicalPath,
      languages: Object.fromEntries(
        platform.supportedLocales.map((item) => [item, createLocalizedPath(item, pathname)]),
      ),
    },
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      siteName: seo.title,
      locale: resolvedLocale === 'en' ? 'en_US' : 'id_ID',
      type: 'website',
      url: new URL(canonicalPath, metadataBase),
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle,
      description: seo.ogDescription,
    },
  };
}

export function createPlatformLoginPath(locale: string = 'id', nextPath?: string) {
  return appendNextSearch(createLocalizedPath(locale, '/login'), nextPath);
}

export function createPlatformRegisterPath(locale: string = 'id', nextPath?: string) {
  return appendNextSearch(createLocalizedPath(locale, '/register'), nextPath);
}

export function createPlatformForgotPasswordPath(locale: string = 'id', nextPath?: string) {
  return appendNextSearch(createLocalizedPath(locale, '/forgot-password'), nextPath);
}

export function createPlatformSecurityPath(locale: string = 'id') {
  return createLocalizedPath(locale, '/security');
}

export function createPlatformSessionsPath(locale: string = 'id') {
  return createLocalizedPath(locale, '/sessions');
}

export function createViewerSecurityHref(locale: string = 'id', platformId?: ServicePlatformId) {
  return createPlatformSecurityPath(locale);
}

export function createViewerSessionsHref(locale: string = 'id', platformId?: ServicePlatformId) {
  return createPlatformSessionsPath(locale);
}

export function createPlatformAuthUrl(nextPath: string, locale: string = 'id') {
  return createPlatformLoginPath(locale, nextPath);
}

export function getPlatformRegistrationSchemaForLocale(platform: ServicePlatformConfig, locale?: string | null) {
  return getPlatformRegistrationSchema(platform, resolvePlatformLocale(platform, locale));
}
