import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { APP_CONFIG } from '@/lib/config';
import { MOCK_PROFESSIONALS, MOCK_SERVICES } from '@/lib/mock-db/catalog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = APP_CONFIG.baseUrl;
  const locales = routing.locales;

  // Base routes that exist in the app
  const defaultRoutes = ['', '/home', '/explore', '/services', '/appointments', '/profile'];

  // Map default routes for all locales
  const mappedRoutes: MetadataRoute.Sitemap = defaultRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: route === '' || route === '/home' ? 1 : 0.8,
    })),
  );

  // Map dynamic professional routes for all locales
  const professionalRoutes: MetadataRoute.Sitemap = MOCK_PROFESSIONALS.flatMap((prof) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/p/${prof.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  // Map dynamic service routes for all locales
  const serviceRoutes: MetadataRoute.Sitemap = MOCK_SERVICES.flatMap((svc) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/s/${svc.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  return [...mappedRoutes, ...professionalRoutes, ...serviceRoutes];
}
