import type { ServicePlatformId } from '@marketplace/platform-config';
import { createLocalizedPath, createPlatformLoginPath } from '../../lib/platform';
import { fetchViewerSessionServer } from '../../lib/viewer-session-server';
import { MarketplaceHomeView } from '../../screens/public/home/view';
import { resolvePublicRouteContext, safeOfferings, safeProfessionals } from './shared';

export async function PlatformHomePage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const { platform, resolvedLocale } = await resolvePublicRouteContext(platformId, locale);
  const currentPath = createLocalizedPath(resolvedLocale);
  const [professionals, offerings, initialSession] = await Promise.all([
    safeProfessionals(platform.id),
    safeOfferings(platform.id),
    fetchViewerSessionServer(),
  ]);

  return (
    <MarketplaceHomeView
      currentPath={currentPath}
      locale={resolvedLocale}
      loginHref={createPlatformLoginPath(resolvedLocale, currentPath)}
      notificationsHref={createLocalizedPath(resolvedLocale, '/notifications')}
      offerings={offerings}
      ordersHref={createLocalizedPath(resolvedLocale, '/orders')}
      platform={platform}
      professionals={professionals}
      profileHref={createLocalizedPath(resolvedLocale, '/profile')}
      servicesHref={createLocalizedPath(resolvedLocale, '/services')}
      session={initialSession}
      supportHref={createLocalizedPath(resolvedLocale, '/support')}
    />
  );
}
