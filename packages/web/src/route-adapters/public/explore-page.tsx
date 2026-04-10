import type { ServicePlatformId } from '@marketplace/platform-config';
import { createLocalizedPath, createPlatformLoginPath } from '../../lib/platform';
import { fetchViewerSessionServer } from '../../lib/viewer-session-server';
import { MarketplaceExploreView } from '../../screens/public/explore/view';
import { resolvePublicRouteContext, safeProfessionals } from './shared';

export async function PlatformExplorePage({ locale, platformId }: { locale: string; platformId: ServicePlatformId }) {
  const { platform, resolvedLocale } = await resolvePublicRouteContext(platformId, locale);
  const [professionals, initialSession] = await Promise.all([
    safeProfessionals(platform.id),
    fetchViewerSessionServer(),
  ]);

  return (
    <MarketplaceExploreView
      currentPath={createLocalizedPath(resolvedLocale, '/explore')}
      locale={resolvedLocale}
      notificationsHref={createLocalizedPath(resolvedLocale, '/notifications')}
      platform={platform}
      professionals={professionals}
      profileHref={
        initialSession?.isAuthenticated
          ? createLocalizedPath(resolvedLocale, '/profile')
          : createPlatformLoginPath(resolvedLocale, createLocalizedPath(resolvedLocale, '/explore'))
      }
      session={initialSession}
    />
  );
}
