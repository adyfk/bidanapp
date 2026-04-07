import { createBidanappApiClient, fetchCatalog } from '@bidanapp/sdk';
import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { getBackendApiBaseUrl } from '@/lib/backend';
import { APP_CONFIG } from '@/lib/config';

export const revalidate = 600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_CONFIG.baseUrl;
  const locales = routing.locales;
  const client = createBidanappApiClient(getBackendApiBaseUrl());

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

  try {
    const catalog = await fetchCatalog(client);

    // Map dynamic professional routes for all locales
    const professionalRoutes: MetadataRoute.Sitemap = (catalog.professionals as Array<{ slug: string }>).flatMap(
      (prof) =>
        ['', '/services', '/reviews', '/about'].flatMap((suffix) =>
          locales.map((locale) => ({
            url: `${baseUrl}/${locale}/p/${prof.slug}${suffix}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: suffix === '' ? 0.8 : 0.7,
          })),
        ),
    );

    // Map dynamic service routes for all locales
    const serviceRoutes: MetadataRoute.Sitemap = (catalog.services as Array<{ slug: string }>).flatMap((svc) =>
      locales.map((locale) => ({
        url: `${baseUrl}/${locale}/s/${svc.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    );

    return [...mappedRoutes, ...professionalRoutes, ...serviceRoutes];
  } catch {
    return mappedRoutes;
  }
}
